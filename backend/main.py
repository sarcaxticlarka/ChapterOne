import asyncio
import logging
import os

import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from backend.routes import auth, documents, courses, progress, chat, quiz, dashboard, search, history, flashcards

logger = logging.getLogger("keepalive")

# ── Keep-alive background task ────────────────────────────────────────────────
# Render free tier spins down after ~15 min of inactivity.
# This pings the app's own health endpoint every 10 minutes so it stays warm.
# On local dev the RENDER env var is not set, so the loop exits immediately.

PING_INTERVAL_SECONDS = 10 * 60  # 10 minutes


async def _keepalive_loop() -> None:
    """Periodically ping the app's own root endpoint to prevent Render sleep."""
    # Only run on Render (RENDER env var is injected automatically by Render)
    render_url = os.getenv("RENDER_EXTERNAL_URL")  # e.g. https://myapp.onrender.com
    if not render_url:
        logger.info("Keep-alive: not running on Render, skipping.")
        return

    ping_url = render_url.rstrip("/") + "/health"
    logger.info("Keep-alive: will ping %s every %d s", ping_url, PING_INTERVAL_SECONDS)

    async with httpx.AsyncClient(timeout=10) as client:
        while True:
            await asyncio.sleep(PING_INTERVAL_SECONDS)
            try:
                resp = await client.get(ping_url)
                logger.info("Keep-alive ping → %s %s", ping_url, resp.status_code)
            except Exception as exc:
                logger.warning("Keep-alive ping failed: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: launch keep-alive task
    task = asyncio.create_task(_keepalive_loop())
    yield
    # Shutdown: cancel the task cleanly
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Chapter One Platform API",
    description="Backend API powering AI Course Outline extraction, RAG lesson loading, streaming chat, and quizzes.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
        "docs_url": "/docs",
    }


@app.get("/health")
def health_check():
    """Lightweight endpoint used by the keep-alive ping."""
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
