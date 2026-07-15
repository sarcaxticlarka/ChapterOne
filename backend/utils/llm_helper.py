import json
import re
import time
from typing import List, Dict, Any, Optional
from groq import Groq
from backend.config import settings

# Initialize Groq client
client = None

def get_groq_client():
    global client
    if client is None:
        client = Groq(api_key=settings.groq_api)
    return client

def clean_json_response(text: str) -> str:
    """
    Cleans markdown code block wraps (like ```json ... ```) from the LLM response.
    """
    # Remove block formatting if present
    cleaned = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()

def safe_parse_json(text: str) -> Optional[Dict[str, Any]]:
    """
    Tries to safely parse json from LLM text output.
    """
    try:
        return json.loads(clean_json_response(text))
    except Exception as e:
        print(f"JSON parsing error: {e}. Raw response: {text}")
        # Try finding anything between first '{' and last '}'
        try:
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1:
                return json.loads(clean_json_response(text[start:end+1]))
        except Exception:
            pass
        return None

def call_llm(messages: List[Dict[str, str]], response_format: Optional[str] = None, max_retries: int = 3) -> str:
    """
    Wrapper for Groq chat completion API with retry logic.
    """
    groq_client = get_groq_client()
    model = "llama-3.3-70b-versatile"
    
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.2,
    }
    
    if response_format == "json":
        payload["response_format"] = {"type": "json_object"}

    for attempt in range(max_retries):
        try:
            chat_completion = groq_client.chat.completions.create(**payload)
            return chat_completion.choices[0].message.content
        except Exception as e:
            # Handle rate limit (429) or timeouts
            print(f"Groq API call attempt {attempt+1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                raise e
    return ""

def generate_course_outline(pdf_sample_text: str) -> Dict[str, Any]:
    """
    Generates a structured course outline based on a sample of the PDF text.
    """
    system_prompt = (
        "You are an expert curriculum designer. Your task is to design a structured, coherent, "
        "and logical interactive e-course based on the provided PDF document summary and sections.\n"
        "You must return your output strictly in JSON format. The JSON must match this structure:\n"
        "{\n"
        '  "title": "Course Title",\n'
        '  "description": "Comprehensive course description...",\n'
        '  "difficulty": "Beginner" or "Intermediate" or "Advanced",\n'
        '  "est_learning_time": "Estimated study time (e.g. 6 hours)",\n'
        '  "objectives": ["Objective 1", "Objective 2", ...],\n'
        '  "prerequisites": ["Prerequisite 1", "Prerequisite 2", ...],\n'
        '  "chapters": [\n'
        "    {\n"
        '      "title": "Chapter 1 Title",\n'
        '      "lessons": ["Lesson 1 Title", "Lesson 2 Title", ...]\n'
        "    },\n"
        "    ...\n"
        "  ]\n"
        "}\n"
        "Keep the course focused, educational, and limit it to between 3 to 6 chapters for readability."
    )
    
    user_prompt = f"Create a course outline based on this text extracted from the PDF:\n\n{pdf_sample_text[:12000]}"
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    response = call_llm(messages, response_format="json")
    parsed = safe_parse_json(response)
    if parsed:
        return parsed
    raise ValueError("Failed to generate course outline in valid JSON format")

def generate_lesson_content(lesson_title: str, chapter_title: str, course_title: str, relevant_pdf_chunks: List[str]) -> Dict[str, Any]:
    """
    Generates comprehensive lesson content based on retrieved source chunks from the PDF.
    """
    system_prompt = (
        "You are an elite educational instructor. Your job is to create a detailed, highly structured, "
        "and engaging lesson page for students. Use only the provided PDF source chunks to ground your explanations "
        "and avoid making up facts not present in the reference context.\n"
        "You must return your response strictly as a JSON object with the following fields:\n"
        "{\n"
        '  "content_md": "Detailed explanation written in Markdown format, with proper headings (##), bold text, bullet points, and clean spacing. It should be comprehensive (around 500-1000 words) and explain all core concepts thoroughly.",\n'
        '  "key_takeaways": ["Takeaway 1", "Takeaway 2", ...],\n'
        '  "notes": ["Important warning or hint 1", ...],\n'
        '  "examples": ["Real-world application or sample code 1", ...],\n'
        '  "summary": "A concise one-paragraph summary of the lesson."\n'
        "}"
    )
    
    context_str = "\n\n--- Source Chunk ---\n".join(relevant_pdf_chunks)
    user_prompt = (
        f"Course: {course_title}\n"
        f"Chapter: {chapter_title}\n"
        f"Lesson: {lesson_title}\n\n"
        f"Here are the reference chunks extracted from the uploaded PDF:\n{context_str}\n\n"
        f"Generate the detailed lesson content now."
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    response = call_llm(messages, response_format="json")
    parsed = safe_parse_json(response)
    if parsed:
        return parsed
    raise ValueError("Failed to generate lesson content in valid JSON format")

def generate_chapter_quiz(chapter_title: str, lessons_summaries: str, num_questions: int = 5) -> List[Dict[str, Any]]:
    """
    Generates a set of multiple-choice, true/false, and short-answer questions for a chapter.
    """
    system_prompt = (
        "You are a professional educational assessor. Your goal is to write a highly testing, "
        "accurate, and helpful quiz based on the chapter content provided.\n"
        "Provide a mix of multiple-choice (type: 'multiple-choice'), true/false (type: 'true-false'), "
        "and short-answer (type: 'short-answer') questions.\n"
        "You must return your response strictly as a JSON object with a single 'questions' list:\n"
        "{\n"
        '  "questions": [\n'
        "    {\n"
        '      "type": "multiple-choice",\n'
        '      "question": "Question text...",\n'
        '      "options": ["A", "B", "C", "D"],\n'
        '      "correct_answer": "Exact text of the correct option",\n'
        '      "explanation": "Why this answer is correct..."\n'
        "    },\n"
        "    {\n"
        '      "type": "true-false",\n'
        '      "question": "Statement...",\n'
        '      "options": ["True", "False"],\n'
        '      "correct_answer": "True" or "False",\n'
        '      "explanation": "Explanation..."\n'
        "    },\n"
        "    {\n"
        '      "type": "short-answer",\n'
        '      "question": "Prompt asking user to explain something...",\n'
        '      "correct_answer": "Key points expected in the answer...",\n'
        '      "explanation": "Rubric or explanation of what makes a correct answer..."\n'
        "    }\n"
        "  ]\n"
        "}\n"
    )
    
    user_prompt = (
        f"Generate a quiz with {num_questions} questions for the chapter: '{chapter_title}'.\n"
        f"Here is a summary of the concepts covered in this chapter's lessons:\n{lessons_summaries}"
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    response = call_llm(messages, response_format="json")
    parsed = safe_parse_json(response)
    if parsed and "questions" in parsed:
        return parsed["questions"]
    raise ValueError("Failed to generate quiz questions in valid JSON format")

def grade_short_answer(question: str, reference_answer: str, user_answer: str) -> Dict[str, Any]:
    """
    Uses LLM to grade short answers semantically, returning a score (0 to 100) and brief feedback.
    """
    system_prompt = (
        "You are an automated grading system. Grade the student's short answer response by comparing it semantically "
        "to the expected correct answer reference. Focus on understanding and conceptual accuracy, not exact wording.\n"
        "You must return your output strictly in JSON format matching this structure:\n"
        "{\n"
        '  "score": 85, // An integer score between 0 and 100\n'
        '  "feedback": "Explain why the score was given, point out missing details or correct parts."\n'
        "}\n"
    )
    
    user_prompt = (
        f"Question: {question}\n"
        f"Expected Reference Answer: {reference_answer}\n"
        f"Student's Answer: {user_answer}\n"
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    response = call_llm(messages, response_format="json")
    parsed = safe_parse_json(response)
    if parsed:
        return parsed
    # Fallback default score if parsing fails
    return {"score": 50, "feedback": "Manual review suggested; grading format error."}

def generate_flashcards(lesson_title: str, content_md: str) -> List[Dict[str, str]]:
    """
    Generates 5 question/answer flashcards for a lesson based on its content.
    """
    system_prompt = (
        "You are an expert tutor. Your goal is to write 5 highly focused, clear, and challenging study flashcards "
        "based on the provided lesson text. Each flashcard must consist of a concise question (front) and a concise, "
        "clear answer (back).\n"
        "You must return your response strictly in JSON format matching this structure:\n"
        "{\n"
        '  "flashcards": [\n'
        "    {\n"
        '      "front": "Question to test knowledge...",\n'
        '      "back": "Short correct answer..."\n'
        "    },\n"
        "    ...\n"
        "  ]\n"
        "}\n"
    )
    
    user_prompt = f"Lesson: '{lesson_title}'\n\nContent:\n{content_md[:12000]}"
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    response = call_llm(messages, response_format="json")
    parsed = safe_parse_json(response)
    if parsed and "flashcards" in parsed:
        return parsed["flashcards"]
    raise ValueError("Failed to generate flashcards in valid JSON format")
