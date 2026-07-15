import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from sqlalchemy.orm import Session

from backend.database import get_db, SessionLocal
from backend.models import User, Document, DocumentChunk
from backend.schemas import DocumentResponse
from backend.utils.auth_helper import get_current_user
from backend.utils.pdf_processor import extract_pdf_text_and_metadata, chunk_text, generate_embeddings_for_chunks
from backend.config import settings

router = APIRouter(prefix="/api/documents", tags=["Documents"])

def process_pdf_background(doc_id: uuid.UUID, file_path: str):
    """
    Background job to parse PDF, chunk text, generate local embeddings, and store them in database.
    """
    db = SessionLocal()
    try:
        # 1. Update status
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            return
            
        # 2. Extract PDF text
        pdf_data = extract_pdf_text_and_metadata(file_path)
        doc.page_count = pdf_data["page_count"]
        db.commit()
        
        # 3. Chunk text
        chunks = chunk_text(pdf_data["text"])
        
        if chunks:
            # 4. Generate embeddings
            embeddings = generate_embeddings_for_chunks(chunks)
            
            # 5. Save chunks to db
            for index, (content, embedding) in enumerate(zip(chunks, embeddings)):
                db_chunk = DocumentChunk(
                    document_id=doc_id,
                    chunk_index=index,
                    content=content,
                    embedding=embedding
                )
                db.add(db_chunk)
            
        doc.status = "completed"
        db.commit()
        print(f"Background processing completed for Document {doc_id} ({len(chunks)} chunks).")
    except Exception as e:
        print(f"Background processing failed for Document {doc_id}: {e}")
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = "failed"
            db.commit()
    finally:
        db.close()

@router.post("/upload", response_model=DocumentResponse)
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported"
        )
        
    # Generate unique storage filename
    file_id = uuid.uuid4()
    filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(settings.upload_dir, filename)
    
    # Save file on disk
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file: {str(e)}"
        )
        
    # Create Document row
    db_doc = Document(
        id=file_id,
        user_id=current_user.id,
        filename=file.filename,
        storage_path=file_path,
        status="processing"
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    # Kick off background job
    background_tasks.add_task(process_pdf_background, db_doc.id, file_path)
    
    return db_doc

@router.get("/{id}/status", response_model=DocumentResponse)
def get_document_status(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return doc
