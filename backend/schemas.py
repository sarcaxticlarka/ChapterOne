from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime, date

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class GoogleLoginRequest(BaseModel):
    token: str

# Document Schemas
class DocumentResponse(BaseModel):
    id: UUID
    filename: str
    page_count: Optional[int] = None
    status: str
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

# Course Outline generation input
class CourseGenerateRequest(BaseModel):
    document_id: UUID

# Lesson Schemas
class LessonSummaryResponse(BaseModel):
    id: UUID
    title: str
    order_index: int
    completed: bool = False
    
    class Config:
        from_attributes = True

class LessonDetailResponse(BaseModel):
    id: UUID
    title: str
    content_md: Optional[str] = None
    key_takeaways: Optional[List[str]] = None
    notes: Optional[List[str]] = None
    examples: Optional[List[str]] = None
    summary: Optional[str] = None
    order_index: int
    completed: bool = False
    
    class Config:
        from_attributes = True

# Chapter Schemas
class ChapterResponse(BaseModel):
    id: UUID
    title: str
    order_index: int
    lessons: List[LessonSummaryResponse] = []
    
    class Config:
        from_attributes = True

# Course Schemas
class CourseResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    difficulty: Optional[str] = None
    est_learning_time: Optional[str] = None
    objectives: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None
    created_at: datetime
    chapters: List[ChapterResponse] = []
    
    class Config:
        from_attributes = True

class CourseSummaryResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    difficulty: Optional[str] = None
    completion_percentage: float = 0.0
    created_at: datetime
    
    class Config:
        from_attributes = True

# Progress Schemas
class ProgressUpdateRequest(BaseModel):
    completed: bool
    time_spent_seconds: int = 0

# Chat Schemas
class ChatConversationRequest(BaseModel):
    course_id: UUID
    message: str
    conversation_id: Optional[UUID] = None

class ChatMessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ChatConversationResponse(BaseModel):
    id: UUID
    course_id: UUID
    created_at: datetime
    messages: List[ChatMessageResponse] = []
    
    class Config:
        from_attributes = True

# Quiz Schemas
class QuizQuestionResponse(BaseModel):
    id: UUID
    type: str
    question: str
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None  # Normally masked unless graded
    explanation: Optional[str] = None
    
    class Config:
        from_attributes = True

class QuizResponse(BaseModel):
    id: UUID
    chapter_id: UUID
    questions: List[QuizQuestionResponse] = []
    
    class Config:
        from_attributes = True

class QuizSubmitRequest(BaseModel):
    answers: Dict[str, str]  # question_id -> user answer string

class QuizAttemptResponse(BaseModel):
    id: UUID
    quiz_id: UUID
    user_id: UUID
    answers: Dict[str, str]
    score: float
    submitted_at: datetime
    
    class Config:
        from_attributes = True

# Flashcard Schemas
class FlashcardResponse(BaseModel):
    id: UUID
    lesson_id: UUID
    front: str
    back: str
    next_review_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard Stats Schemas
class DashboardResponse(BaseModel):
    enrolled_courses: List[CourseSummaryResponse] = []
    total_time_spent_seconds: int = 0
    average_quiz_score: float = 0.0
    current_streak: int = 0
    longest_streak: int = 0
