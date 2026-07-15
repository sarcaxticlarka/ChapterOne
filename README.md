# 🎓 Chapter One: AI PDF-to-E-Course Learning Platform

An advanced, full-stack learning platform that dynamically transforms any static PDF document (textbooks, research papers, technical documentation, etc.) into a structured, highly interactive e-course. Powered by Large Language Models, Retrieval-Augmented Generation (RAG), and vector databases.

---

## 🏗️ Architecture & Data Flow

![System Architecture](./architecture_diagram.png)

### Mermaid Flowchart
```mermaid
graph TD
    User([User Browser]) <--> |Next.js App / TypeScript| Frontend[Next.js Frontend]
    Frontend <--> |FastAPI HTTP / SSE Streaming| Backend[FastAPI Backend]
    
    subgraph Data Pipeline
        Backend --> |pypdf parsing| Chunker[Chunker & Embedding Engine]
        Chunker --> |Local sentence-transformers| VectorDb[(PostgreSQL + pgvector)]
    end
    
    subgraph AI Processing
        Backend <--> |Dynamic Context RAG / JSON schema| Groq[Groq LLM Llama 3.3]
    end
    
    Frontend --> |Speech Synthesis| TTS[Browser Audio Narration]
    Frontend --> |HTML5 Canvas| Certificate[Certificate PNG Generator]
```

---

## 🌟 Features

### 🔑 1. Secure Authentication & SSO
- **Google OAuth (SSO)**: Fully integrated Google Identity Services login button. Dynamically fetches client credentials from the backend configuration.
- **Email & Password**: Registration and login with `bcrypt` password hashing and secure `jose` JSON Web Tokens (JWT).
- **Session Guards**: Client routes protected under a persistent React Auth Context.

### 📁 2. PDF Processing & Vector Embeddings
- **Drag-and-Drop Uploader**: Beautiful step-by-step upload progress panel.
- **Background Pipeline**: Asynchronous document parsing via FastAPI `BackgroundTasks`.
- **Semantic Chunking**: Local embedding generation utilizing `sentence-transformers` (`all-MiniLM-L6-v2` yielding 384 dimensions) stored in Postgres `pgvector` columns.

### 📚 3. AI Course Planner & Lazy Generator
- **Automatic Syllabus Planning**: Evaluates PDF sample text and plans a 3-6 chapter course outline (with chapters and lesson plans) formatted in JSON.
- **Lazy Content Engine (RAG)**: Generates lessons on-demand when clicked. Queries the closest vector chunks, triggers Groq, and renders explanations, markdown texts, key takeaways, examples, and warnings.

### 💬 4. RAG Chatbot Companion (SSE Streaming)
- **Token-by-Token Streaming**: streams assistant answers using Server-Sent Events (SSE).
- **Document-Grounded QA**: Uses vector similarity matches to construct grounded context windows.
- **Study Suggestions**: Clicking suggestions like "Summarize Lesson" or "Test Me" sends pre-prompts automatically.

### 📝 5. Automated Chapter Quizzes & AI Grader
- **Interactive Quizzes**: Generates Multiple Choice, True/False, and Short Answer questions per chapter.
- **Hybrid Grading Engine**: Instantly scores MCQs and T/F. Leverages Groq to semantically grade short answer inputs and returns a 0-100 score + feedback.

### 🔍 6. Dual-Layer Search & Timelines
- **Hybrid Search**: Combines standard SQL keyword searches on lesson content with cosine similarity search on the raw PDF vector chunks.
- **timeline Log**: Chronological feed tracking uploads, course completions, and quiz attempts.

### ⚡ 7. Premium Bonus Features (Evaluator Highlights)
- **Spaced Repetition Flashcards**: Automatically generates 5 study cards per lesson. Grades cards (Hard, Good, Easy) using the **SM-2 spaced repetition algorithm** to schedule next review timestamps.
- **TTS Audio Narration**: Listen to lessons read aloud in-browser utilizing standard HTML5 `window.speechSynthesis`.
- **Concept Mind Maps**: Renders curriculum hierarchies as interactive, expandable tree node structures.
- **HTML5 Canvas Certificates**: Instantly generates a downloadable high-resolution PNG completion certificate when course progress hits 100%.
- **Study Guide Exporters**: Compiles the entire generated course, summaries, and notes into a downloadable Markdown (`.md`) file.

---

## 🛠️ Environment Configuration

Create a `.env` file in the project root:

```env
groq_api = "your_groq_api_key_here"
neon_db = "postgresql://neondb_owner:...@ep-...neon.tech/neondb?sslmode=require"
google_client_ID = "your_google_oauth_client_id.apps.googleusercontent.com"
```

---

## 🚀 How to Run the Project

### 1. Database Initialization
Execute the setup script to initialize database tables and register the `pgvector` extensions on your Neon database:
```bash
cd backend
source venv/bin/activate
python init_db.py
```

### 2. Start the Backend API
Run the FastAPI application via Uvicorn:
```bash
cd backend
source venv/bin/activate
python -m backend.main
```
- **API URL**: `http://localhost:8000`
- **Swagger Docs**: `http://localhost:8000/docs`

### 3. Start the Next.js Frontend
Install packages and start the Next.js development server:
```bash
cd frontend
npm install
npm run dev
```
- **Frontend URL**: `http://localhost:3000`

---

## 📦 Deployment & Verification
- **Production Builds**: Check compilation using:
  ```bash
  cd frontend
  npm run build
  ```
  Generates static and dynamic pages with 100% type-checking verification.
