import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, Course, Chapter, Lesson, DocumentChunk
from backend.utils.auth_helper import get_current_user
from backend.utils.pdf_processor import generate_embedding_for_query

router = APIRouter(prefix="/api/search", tags=["Search"])

@router.get("")
def search_course_contents(
    q: str,
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Verify course
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == current_user.id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
        
    results = []
    
    # 2. Keyword Search (SQL ILIKE) on Lessons
    keyword_lessons = db.query(Lesson).join(Chapter).filter(
        Chapter.course_id == course_id,
        (Lesson.title.ilike(f"%{q}%")) | (Lesson.content_md.ilike(f"%{q}%"))
    ).limit(5).all()
    
    for l in keyword_lessons:
        results.append({
            "type": "keyword",
            "lesson_id": str(l.id),
            "title": l.title,
            "snippet": l.summary or (l.content_md[:150] + "..." if l.content_md else "No content available.")
        })
        
    # 3. Semantic Search (pgvector) on PDF Document Chunks
    if course.document_id:
        try:
            query_vector = generate_embedding_for_query(q)
            semantic_chunks = db.query(DocumentChunk).filter(
                DocumentChunk.document_id == course.document_id
            ).order_by(
                DocumentChunk.embedding.cosine_distance(query_vector)
            ).limit(4).all()
            
            # Map chunks back to general lessons by matching title or text references (optional)
            # For simplicity and clean UI display, we return the matching raw chunk contents
            for chunk in semantic_chunks:
                # Avoid duplicates from keyword search
                snippet = chunk.content[:200] + "..." if len(chunk.content) > 200 else chunk.content
                results.append({
                    "type": "semantic",
                    "chunk_index": chunk.chunk_index,
                    "snippet": snippet
                })
        except Exception as e:
            print(f"Semantic search failed: {e}")
            
    return results
