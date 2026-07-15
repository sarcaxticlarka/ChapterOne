import uuid
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend.models import User, Lesson, Progress, Streak, Chapter
from backend.schemas import ProgressUpdateRequest
from backend.utils.auth_helper import get_current_user

router = APIRouter(prefix="/api/progress", tags=["Progress"])

def update_learning_streak(user_id: uuid.UUID, db: Session):
    """
    Increments or resets user learning streak based on activity date.
    """
    streak = db.query(Streak).filter(Streak.user_id == user_id).first()
    if not streak:
        streak = Streak(user_id=user_id, current_streak=0, longest_streak=0)
        db.add(streak)
        db.commit()
        db.refresh(streak)
        
    today = date.today()
    if streak.last_active_date == today:
        # Already active today, streak remains same
        return
        
    yesterday = today - timedelta(days=1)
    if streak.last_active_date == yesterday:
        # Active yesterday, increment streak
        streak.current_streak += 1
    else:
        # Missed a day or first activity, reset streak to 1
        streak.current_streak = 1
        
    if streak.current_streak > streak.longest_streak:
        streak.longest_streak = streak.current_streak
        
    streak.last_active_date = today
    db.commit()

@router.post("/lessons/{lesson_id}", response_model=dict)
def update_lesson_progress(
    lesson_id: uuid.UUID,
    payload: ProgressUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Verify lesson exists
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
        
    # 2. Find or create progress entry
    progress = db.query(Progress).filter(
        Progress.user_id == current_user.id,
        Progress.lesson_id == lesson_id
    ).first()
    
    if not progress:
        progress = Progress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            completed=payload.completed,
            completed_at=func.now() if payload.completed else None,
            time_spent_seconds=payload.time_spent_seconds
        )
        db.add(progress)
    else:
        # If transitioning to completed
        if payload.completed and not progress.completed:
            progress.completed = True
            progress.completed_at = func.now()
            # Update learning streak since they finished a lesson
            update_learning_streak(current_user.id, db)
        elif not payload.completed:
            progress.completed = False
            progress.completed_at = None
            
        progress.time_spent_seconds += payload.time_spent_seconds
        
    db.commit()
    return {"success": True, "completed": progress.completed}

@router.get("/courses/{course_id}", response_model=dict)
def get_course_progress(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Calculate progress metrics
    total_lessons = db.query(Lesson).join(Chapter).filter(Chapter.course_id == course_id).count()
    completed_lessons = db.query(Progress).join(Lesson).join(Chapter).filter(
        Chapter.course_id == course_id,
        Progress.user_id == current_user.id,
        Progress.completed == True
    ).count()
    
    time_spent = db.query(func.sum(Progress.time_spent_seconds)).join(Lesson).join(Chapter).filter(
        Chapter.course_id == course_id,
        Progress.user_id == current_user.id
    ).scalar() or 0
    
    completion_percentage = 0.0
    if total_lessons > 0:
        completion_percentage = round((completed_lessons / total_lessons) * 100.0, 1)
        
    return {
        "course_id": course_id,
        "total_lessons": total_lessons,
        "completed_lessons": completed_lessons,
        "completion_percentage": completion_percentage,
        "total_time_spent_seconds": time_spent
    }
