from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from backend.routes import auth, documents, courses, progress, chat, quiz, dashboard, search, history, flashcards

app = FastAPI(
    title="Chapter One Platform API",
    description="Backend API powering AI Course Outline extraction, RAG lesson loading, streaming chat, and quizzes.",
    version="1.0.0"
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For standard local and cross origin deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(courses.router)
app.include_router(progress.router)
app.include_router(chat.router)
app.include_router(quiz.router)
app.include_router(dashboard.router)
app.include_router(search.router)
app.include_router(history.router)
app.include_router(flashcards.router)

@app.get("/")
def get_root():
    return {
        "status": "online",
        "service": "PDF to E-Course Learning Platform API",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
