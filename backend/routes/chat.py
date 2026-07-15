import uuid
import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.database import get_db, SessionLocal
from backend.models import User, Course, DocumentChunk, ChatConversation, ChatMessage
from backend.schemas import ChatConversationRequest, ChatConversationResponse
from backend.utils.auth_helper import get_current_user
from backend.utils.pdf_processor import generate_embedding_for_query
from backend.utils.llm_helper import get_groq_client

router = APIRouter(prefix="/api/chat", tags=["Chatbot"])

@router.post("", response_class=StreamingResponse)
def stream_chatbot(
    payload: ChatConversationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Verify course exists
    course = db.query(Course).filter(Course.id == payload.course_id, Course.user_id == current_user.id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
        
    # 2. Get or create conversation
    convo_id = payload.conversation_id
    if not convo_id:
        conversation = ChatConversation(
            user_id=current_user.id,
            course_id=course.id
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        convo_id = conversation.id
    else:
        conversation = db.query(ChatConversation).filter(
            ChatConversation.id == convo_id,
            ChatConversation.user_id == current_user.id
        ).first()
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
            
    # 3. Retrieve RAG chunks matching user message
    relevant_chunks = []
    if course.document_id:
        query_vector = generate_embedding_for_query(payload.message)
        chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == course.document_id).order_by(
            DocumentChunk.embedding.cosine_distance(query_vector)
        ).limit(3).all()
        relevant_chunks = [c.content for c in chunks]
        
    context_str = "\n\n".join(relevant_chunks)
    
    # 4. Fetch last 5 turns of conversation history for context
    history_messages = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == convo_id
    ).order_by(ChatMessage.created_at.asc()).limit(10).all()
    
    # 5. Build prompt messages
    system_prompt = (
        "You are an expert AI Learning Companion chatbot. Your goal is to guide students through the course material, "
        "explain difficult concepts, summarize chapters, answer questions, and generate quizzes if requested.\n"
        "Ground your answers in the provided PDF reference context when explaining. If the user asks a general question "
        "unrelated to the context, answer politely but try to steer the discussion back to the course topic.\n"
        "Format your responses using clean Markdown format for headings, lists, bold text, and code blocks."
    )
    
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add history
    for msg in history_messages:
        messages.append({"role": msg.role, "content": msg.content})
        
    # Add user query with context
    user_content = f"Reference Context:\n{context_str}\n\nUser Question: {payload.message}"
    messages.append({"role": "user", "content": user_content})
    
    # 6. Stream with SSE
    def sse_generator(cid: uuid.UUID, user_msg: str):
        # We need a separate database session inside the generator since it runs asynchronously
        generator_db = SessionLocal()
        try:
            # First, save user message
            db_user_msg = ChatMessage(
                conversation_id=cid,
                role="user",
                content=user_msg
            )
            generator_db.add(db_user_msg)
            generator_db.commit()
            
            # Send initial conversation metadata to client
            yield f"data: {json.dumps({'conversation_id': str(cid), 'token': ''})}\n\n"
            
            # Request streaming from Groq
            groq_client = get_groq_client()
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.7,
                stream=True
            )
            
            assistant_reply = ""
            for chunk in response:
                token = chunk.choices[0].delta.content or ""
                if token:
                    assistant_reply += token
                    # Yield SSE format data
                    yield f"data: {json.dumps({'token': token})}\n\n"
                    
            # Save assistant reply to db
            db_assistant_msg = ChatMessage(
                conversation_id=cid,
                role="assistant",
                content=assistant_reply
            )
            generator_db.add(db_assistant_msg)
            generator_db.commit()
            
        except Exception as e:
            print(f"SSE Streaming error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            generator_db.close()
            
    return StreamingResponse(
        sse_generator(convo_id, payload.message),
        media_type="text/event-stream"
    )

@router.get("/conversations/{course_id}", response_model=list[ChatConversationResponse])
def get_chat_conversations(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversations = db.query(ChatConversation).filter(
        ChatConversation.course_id == course_id,
        ChatConversation.user_id == current_user.id
    ).order_by(ChatConversation.created_at.desc()).all()
    
    return conversations
