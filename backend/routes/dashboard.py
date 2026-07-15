import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend.models import User, Course, Chapter, Lesson, Progress, QuizAttempt, Streak
from backend.schemas import DashboardResponse, CourseSummaryResponse
from backend.utils.auth_helper import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardResponse)
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch user's courses
    courses = db.query(Course).filter(Course.user_id == current_user.id).order_by(Course.created_at.desc()).all()
    
    enrolled_courses = []
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
            
        enrolled_courses.append(CourseSummaryResponse(
            id=course.id,
            title=course.title,
            description=course.description,
            difficulty=course.difficulty,
            completion_percentage=pct,
            created_at=course.created_at
        ))
        
    # 2. Total time spent learning (sum of all completed and in-progress lesson times)
    total_time = db.query(func.sum(Progress.time_spent_seconds)).filter(
        Progress.user_id == current_user.id
    ).scalar() or 0
    
    # 3. Average quiz score across all user attempts
    avg_score = db.query(func.avg(QuizAttempt.score)).filter(
        QuizAttempt.user_id == current_user.id
    ).scalar() or 0.0
    avg_score = round(float(avg_score), 1)
    
    # 4. Learning streak statistics
    streak = db.query(Streak).filter(Streak.user_id == current_user.id).first()
    current_s = streak.current_streak if streak else 0
    longest_s = streak.longest_streak if streak else 0
    
    return DashboardResponse(
        enrolled_courses=enrolled_courses,
        total_time_spent_seconds=total_time,
        average_quiz_score=avg_score,
        current_streak=current_s,
        longest_streak=longest_s
    )
