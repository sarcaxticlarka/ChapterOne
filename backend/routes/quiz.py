import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, Chapter, Lesson, Quiz, QuizQuestion, QuizAttempt
from backend.schemas import QuizResponse, QuizSubmitRequest, QuizAttemptResponse, QuizQuestionResponse
from backend.utils.auth_helper import get_current_user
from backend.utils.llm_helper import generate_chapter_quiz, grade_short_answer

router = APIRouter(prefix="/api/quizzes", tags=["Quizzes"])

class QuizGenerateRequest(object):
    # Dummy placeholder since it's defined inside function or simple post body
    pass

@router.post("/generate", response_model=QuizResponse)
def generate_quiz(
    chapter_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Verify chapter exists
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chapter not found"
        )
        
    # Check if a quiz already exists for this chapter. If so, return it.
    existing_quiz = db.query(Quiz).filter(Quiz.chapter_id == chapter_id).first()
    if existing_quiz:
        return existing_quiz
        
    # 2. Gather lesson summaries to ground the quiz in the chapter content
    lessons = db.query(Lesson).filter(Lesson.chapter_id == chapter_id).all()
    if not lessons:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No lessons found in this chapter to write a quiz for"
        )
        
    lesson_contents = []
    for l in lessons:
        summary_text = l.summary or (l.content_md[:500] if l.content_md else "No summary available.")
        lesson_contents.append(f"Lesson: '{l.title}'\nSummary: {summary_text}")
        
    aggregated_context = "\n\n".join(lesson_contents)
    
    # 3. Call LLM to generate quiz questions
    try:
        raw_questions = generate_chapter_quiz(chapter.title, aggregated_context, num_questions=4)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate quiz questions via LLM: {str(e)}"
        )
        
    # 4. Save Quiz and Questions in DB
    quiz = Quiz(chapter_id=chapter_id)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    
    for q_data in raw_questions:
        question = QuizQuestion(
            quiz_id=quiz.id,
            type=q_data.get("type", "multiple-choice"),
            question=q_data.get("question", ""),
            options=q_data.get("options"),
            correct_answer=q_data.get("correct_answer", ""),
            explanation=q_data.get("explanation", "")
        )
        db.add(question)
        
    db.commit()
    db.refresh(quiz)
    return quiz

@router.get("/{id}", response_model=QuizResponse)
def get_quiz_detail(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz = db.query(Quiz).filter(Quiz.id == id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    return quiz

@router.post("/{id}/submit", response_model=dict)
def submit_quiz_attempt(
    id: uuid.UUID,
    payload: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch quiz & questions
    quiz = db.query(Quiz).filter(Quiz.id == id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
        
    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == id).all()
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz has no questions"
        )
        
    graded_questions = []
    total_score = 0.0
    questions_count = len(questions)
    
    # 2. Grade each answer
    for q in questions:
        user_ans = payload.answers.get(str(q.id), "").strip()
        is_correct = False
        feedback = ""
        score = 0.0
        
        if q.type in ["multiple-choice", "true-false"]:
            # Check exact string match (case-insensitive)
            if user_ans.lower() == q.correct_answer.lower():
                is_correct = True
                score = 100.0
                feedback = "Correct!"
            else:
                feedback = f"Incorrect. The correct answer is: {q.correct_answer}"
        elif q.type == "short-answer":
            # Call LLM to grade short answer semantically
            try:
                grading_result = grade_short_answer(
                    question=q.question,
                    reference_answer=q.correct_answer,
                    user_answer=user_ans
                )
                score = float(grading_result.get("score", 0.0))
                feedback = grading_result.get("feedback", "No feedback provided.")
                is_correct = score >= 70.0
            except Exception as e:
                print(f"Short answer grading failed: {e}")
                score = 50.0
                feedback = "Grading failed due to network error. Manual review suggestion."
                is_correct = False
                
        total_score += score
        graded_questions.append({
            "question_id": str(q.id),
            "type": q.type,
            "question": q.question,
            "user_answer": user_ans,
            "correct_answer": q.correct_answer,
            "explanation": q.explanation,
            "score": score,
            "is_correct": is_correct,
            "feedback": feedback
        })
        
    final_score = round(total_score / questions_count, 1)
    
    # 3. Save attempt in DB
    attempt = QuizAttempt(
        quiz_id=id,
        user_id=current_user.id,
        answers=payload.answers,
        score=final_score
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    return {
        "attempt_id": attempt.id,
        "score": final_score,
        "submitted_at": attempt.submitted_at,
        "questions": graded_questions
    }

@router.get("/{id}/attempts", response_model=list[QuizAttemptResponse])
def get_quiz_attempts(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == id,
        QuizAttempt.user_id == current_user.id
    ).order_by(QuizAttempt.submitted_at.desc()).all()
    return attempts
