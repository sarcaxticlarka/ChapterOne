import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend.models import User, Document, DocumentChunk, Course, Chapter, Lesson, Progress, Enrollment
from backend.schemas import CourseGenerateRequest, CourseResponse, CourseSummaryResponse, LessonDetailResponse
from backend.utils.auth_helper import get_current_user
from backend.utils.pdf_processor import generate_embedding_for_query
from backend.utils.llm_helper import generate_course_outline, generate_lesson_content

router = APIRouter(prefix="/api/courses", tags=["Courses"])

@router.post("/generate", response_model=CourseResponse)
def generate_course(payload: CourseGenerateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Verify document exists and belongs to user
    doc = db.query(Document).filter(Document.id == payload.document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    if doc.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Document is not ready. Current status: {doc.status}"
        )
        
    # 2. Get some text context from the PDF chunks to generate the outline
    # Take first 8 chunks of the document to represent the core outline/table of contents
    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).order_by(DocumentChunk.chunk_index).limit(8).all()
    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No text chunks found for this document to parse"
        )
        
    sample_text = "\n\n".join([c.content for c in chunks])
    
    # 3. Call LLM to create outline
    try:
        outline = generate_course_outline(sample_text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate course outline via LLM: {str(e)}"
        )
        
    # 4. Save Course, Chapters, and Lessons structure to DB
    course = Course(
        document_id=doc.id,
        user_id=current_user.id,
        title=outline.get("title", "Generated Course"),
        description=outline.get("description", ""),
        difficulty=outline.get("difficulty", "Beginner"),
        est_learning_time=outline.get("est_learning_time", ""),
        objectives=outline.get("objectives", []),
        prerequisites=outline.get("prerequisites", [])
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    
    # Add chapters and lessons
    for c_index, chapter_data in enumerate(outline.get("chapters", [])):
        chapter = Chapter(
            course_id=course.id,
            title=chapter_data.get("title", f"Chapter {c_index+1}"),
            order_index=c_index
        )
        db.add(chapter)
        db.commit()
        db.refresh(chapter)
        
        for l_index, lesson_title in enumerate(chapter_data.get("lessons", [])):
            lesson = Lesson(
                chapter_id=chapter.id,
                title=lesson_title,
                order_index=l_index,
                content_md=None  # Set to None for lazy generation on request
            )
            db.add(lesson)
            
    db.commit()
    db.refresh(course)
    
    # Initialize progress table for lessons
    all_lessons = db.query(Lesson).join(Chapter).filter(Chapter.course_id == course.id).all()
    for lesson in all_lessons:
        progress = Progress(
            user_id=current_user.id,
            lesson_id=lesson.id,
            completed=False,
            time_spent_seconds=0
        )
        db.add(progress)
    db.commit()
    
    return course

@router.get("", response_model=list[CourseSummaryResponse])
def get_user_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    courses = db.query(Course).filter(Course.user_id == current_user.id).order_by(Course.created_at.desc()).all()
    
    result = []
    for course in courses:
        # Calculate completion percentage
        total_lessons = db.query(Lesson).join(Chapter).filter(Chapter.course_id == course.id).count()
        completed_lessons = db.query(Progress).join(Lesson).join(Chapter).filter(
            Chapter.course_id == course.id,
            Progress.user_id == current_user.id,
            Progress.completed == True
        ).count()
        
        pct = 0.0
        if total_lessons > 0:
            pct = round((completed_lessons / total_lessons) * 100.0, 1)
            
        result.append(CourseSummaryResponse(
            id=course.id,
            title=course.title,
            description=course.description,
            difficulty=course.difficulty,
            completion_percentage=pct,
            created_at=course.created_at
        ))
        
    return result

@router.get("/{id}", response_model=CourseResponse)
def get_course_detail(id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    course = db.query(Course).filter(Course.id == id, Course.user_id == current_user.id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    return course

@router.get("/{course_id}/lessons/{lesson_id}", response_model=LessonDetailResponse)
def get_lesson_detail(
    course_id: uuid.UUID,
    lesson_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch course & lesson
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
        
    # Check chapter maps to this course
    chapter = db.query(Chapter).filter(Chapter.id == lesson.chapter_id, Chapter.course_id == course.id).first()
    if not chapter:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Lesson does not belong to this course")
        
    # Track student enrollment / last accessed lesson
    enrollment = db.query(Enrollment).filter(Enrollment.user_id == current_user.id, Enrollment.course_id == course.id).first()
    if not enrollment:
        enrollment = Enrollment(user_id=current_user.id, course_id=course.id, last_lesson_id=lesson.id)
        db.add(enrollment)
    else:
        enrollment.last_lesson_id = lesson.id
        enrollment.last_accessed_at = func.now()
    db.commit()

    # 2. Lazy load / generate content using RAG if missing
    if not lesson.content_md:
        print(f"Lazy generating content for lesson: '{lesson.title}' using RAG...")
        # A. Create RAG query embedding using lesson title
        query_vector = generate_embedding_for_query(lesson.title)
        
        # B. Query top 4 matching document chunks scoped to this course's document
        relevant_chunks = []
        if course.document_id:
            chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == course.document_id).order_by(
                DocumentChunk.embedding.cosine_distance(query_vector)
            ).limit(4).all()
            relevant_chunks = [c.content for c in chunks]
            
        # Fallback to general chunks if no vector search results found
        if not relevant_chunks and course.document_id:
            chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == course.document_id).limit(4).all()
            relevant_chunks = [c.content for c in chunks]

        # C. Call Groq to generate grounded educational content
        try:
            generated = generate_lesson_content(
                lesson_title=lesson.title,
                chapter_title=chapter.title,
                course_title=course.title,
                relevant_pdf_chunks=relevant_chunks
            )
            
            lesson.content_md = generated.get("content_md", "")
            lesson.key_takeaways = generated.get("key_takeaways", [])
            lesson.notes = generated.get("notes", [])
            lesson.examples = generated.get("examples", [])
            lesson.summary = generated.get("summary", "")
            db.commit()
            db.refresh(lesson)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate lesson content via LLM: {str(e)}"
            )

    # 3. Retrieve completion status
    progress = db.query(Progress).filter(Progress.user_id == current_user.id, Progress.lesson_id == lesson.id).first()
    completed = progress.completed if progress else False
    
    return LessonDetailResponse(
        id=lesson.id,
        title=lesson.title,
        content_md=lesson.content_md,
        key_takeaways=lesson.key_takeaways,
        notes=lesson.notes,
        examples=lesson.examples,
        summary=lesson.summary,
        order_index=lesson.order_index,
        completed=completed
    )

@router.get("/{course_id}/mindmap")
def get_course_mindmap(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        
    # Build hierarchical tree nodes
    mindmap = {
        "name": course.title,
        "children": []
    }
    
    # Sort chapters by order_index
    chapters = db.query(Chapter).filter(Chapter.course_id == course.id).order_by(Chapter.order_index).all()
    for ch in chapters:
        ch_node = {
            "name": ch.title,
            "children": []
        }
        
        # Sort lessons by order_index
        lessons = db.query(Lesson).filter(Lesson.chapter_id == ch.id).order_by(Lesson.order_index).all()
        for l in lessons:
            ch_node["children"].append({
                "name": l.title
            })
            
        mindmap["children"].append(ch_node)
        
    return mindmap

@router.get("/{course_id}/export")
def export_course_markdown(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        
    # Build markdown study guide
    md = []
    md.append(f"# Study Guide: {course.title}\n")
    md.append(f"**Difficulty:** {course.difficulty} | **Est. Study Time:** {course.est_learning_time}\n")
    md.append(f"{course.description}\n")
    md.append("## Objectives")
    for obj in course.objectives:
        md.append(f"- {obj}")
    md.append("\n---\n")
    
    chapters = db.query(Chapter).filter(Chapter.course_id == course.id).order_by(Chapter.order_index).all()
    for ch_idx, ch in enumerate(chapters):
        md.append(f"# Chapter {ch_idx+1}: {ch.title}\n")
        
        lessons = db.query(Lesson).filter(Lesson.chapter_id == ch.id).order_by(Lesson.order_index).all()
        for l_idx, l in enumerate(lessons):
            md.append(f"## Lesson {l_idx+1}: {l.title}\n")
            if l.content_md:
                md.append(f"{l.content_md}\n")
            else:
                md.append("*Content not generated yet. Visit this lesson in the reader to generate outline pages.*\n")
                
            if l.key_takeaways:
                md.append("### Key Takeaways")
                for tk in l.key_takeaways:
                    md.append(f"- {tk}")
                md.append("")
                
            if l.notes:
                md.append("### Notes")
                for note in l.notes:
                    md.append(f"- {note}")
                md.append("")
                
            if l.examples:
                md.append("### Real-world Examples")
                for ex in l.examples:
                    md.append(f"- {ex}")
                md.append("")
                
            md.append("\n---\n")
            
    return {"markdown": "\n".join(md)}
