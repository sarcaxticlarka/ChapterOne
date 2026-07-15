import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from backend.database import get_db
from backend.models import User, Lesson, Flashcard, Course, Chapter
from backend.schemas import FlashcardResponse
from backend.utils.auth_helper import get_current_user
from backend.utils.llm_helper import generate_flashcards
from backend.utils.pdf_processor import generate_embedding_for_query
from backend.routes.courses import get_lesson_detail  # Reuse lazy load content helper

router = APIRouter(prefix="/api/flashcards", tags=["Flashcards"])

class FlashcardReviewRequest(BaseModel):
    quality: int = Field(..., ge=0, le=5)  # Quality score 0-5

@router.post("/generate", response_model=list[FlashcardResponse])
def generate_lesson_flashcards(
    lesson_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch lesson and check course access
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
        
    chapter = db.query(Chapter).filter(Chapter.id == lesson.chapter_id).first()
    course = db.query(Course).filter(Course.id == chapter.course_id, Course.user_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
        
    # Check if flashcards already exist
    existing = db.query(Flashcard).filter(Flashcard.lesson_id == lesson_id).all()
    if existing:
        return existing
        
    # Trigger dynamic lesson generation if missing
    if not lesson.content_md:
        # We can dynamically retrieve content details using get_lesson_detail function
        # This will execute the lazy RAG generation automatically!
        get_lesson_detail(course_id=course.id, lesson_id=lesson_id, db=db, current_user=current_user)
        # Reload lesson model
        db.refresh(lesson)
        
    # 2. Call LLM to generate flashcards based on lesson content
    try:
        raw_cards = generate_flashcards(lesson.title, lesson.content_md or "")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate flashcards via LLM: {str(e)}"
        )
        
    # 3. Save flashcards in DB
    db_cards = []
    for c in raw_cards:
        db_card = Flashcard(
            lesson_id=lesson_id,
            front=c.get("front", ""),
            back=c.get("back", ""),
            ease_factor=2.5,
            interval_days=0,
            next_review_at=datetime.utcnow()
        )
        db.add(db_card)
        db_cards.append(db_card)
        
    db.commit()
    for c in db_cards:
        db.refresh(c)
        
    return db_cards

@router.get("/lesson/{lesson_id}", response_model=list[FlashcardResponse])
def get_lesson_cards(
    lesson_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cards = db.query(Flashcard).filter(Flashcard.lesson_id == lesson_id).all()
    return cards

@router.post("/{card_id}/review", response_model=FlashcardResponse)
def review_flashcard(
    card_id: uuid.UUID,
    payload: FlashcardReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    card = db.query(Flashcard).filter(Flashcard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found")
        
    quality = payload.quality
    
    # Standard SM-2 Spaced Repetition calculation
    # We deduce repetitions count from interval_days
    if card.interval_days == 0:
        repetitions = 0
    elif card.interval_days == 1:
        repetitions = 1
    else:
        repetitions = 2
        
    if quality >= 3:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = int(card.interval_days * card.ease_factor)
            if interval == 0:
                interval = 1
        repetitions += 1
    else:
        repetitions = 0
        interval = 1
        
    # Adjust ease factor
    card.ease_factor = card.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if card.ease_factor < 1.3:
        card.ease_factor = 1.3
        
    card.interval_days = interval
    card.next_review_at = datetime.utcnow() + timedelta(days=interval)
    
    db.commit()
    db.refresh(card)
    return card
