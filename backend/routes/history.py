import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, Document, Progress, QuizAttempt, Course, Lesson, Quiz, Chapter
from backend.utils.auth_helper import get_current_user

router = APIRouter(prefix="/api/history", tags=["History"])

@router.get("")
def get_learning_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    history_events = []
    
    # 1. Fetch PDF uploads
    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    for d in docs:
        history_events.append({
            "type": "upload",
            "title": f"Uploaded PDF: '{d.filename}'",
            "timestamp": d.uploaded_at,
            "metadata": {"filename": d.filename, "status": d.status}
        })
        
    # 2. Fetch completed lessons
    completions = db.query(Progress).join(Lesson).filter(
        Progress.user_id == current_user.id,
        Progress.completed == True
    ).all()
    for c in completions:
        history_events.append({
            "type": "completion",
            "title": f"Completed Lesson: '{c.lesson.title}'",
            "timestamp": c.completed_at,
            "metadata": {"lesson_id": str(c.lesson_id)}
        })
        
    # 3. Fetch quiz attempts
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == current_user.id
    ).all()
    for a in attempts:
        quiz = db.query(Quiz).filter(Quiz.id == a.quiz_id).first()
        chapter_title = ""
        if quiz:
            chapter = db.query(Chapter).filter(Chapter.id == quiz.chapter_id).first()
            if chapter:
                chapter_title = chapter.title
                
        history_events.append({
            "type": "quiz",
            "title": f"Submitted chapter quiz for '{chapter_title}'",
            "timestamp": a.submitted_at,
            "metadata": {"score": a.score, "quiz_id": str(a.quiz_id)}
        })
        
    # Sort events chronologically (newest first)
    history_events.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return history_events
