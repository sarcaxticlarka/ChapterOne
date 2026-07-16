"use client";

import React, { useEffect, useState } from "react";
import { X, Sparkles, RefreshCw, Loader2, HelpCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Flashcard {
  id: string;
  lesson_id: string;
  front: string;
  back: string;
}

interface FlashcardsModalProps {
  lessonId: string;
  lessonTitle: string;
  onClose: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const FlashcardsModal: React.FC<FlashcardsModalProps> = ({ lessonId, lessonTitle, onClose }) => {
  const { token } = useAuth();

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token && lessonId) fetchFlashcards();
  }, [token, lessonId]);

  const fetchFlashcards = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/flashcards/lesson/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setCards(await res.json());
      else setError("Failed to fetch flashcards.");
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/flashcards/generate?lesson_id=${lessonId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCards(await res.json());
        setCurrentIndex(0);
      } else {
        setError("AI was unable to generate flashcards.");
      }
    } catch {
      setError("Connection failure.");
    } finally {
      setGenerating(false);
    }
  };

  const handleReview = async (quality: number) => {
    if (!token || cards.length === 0) return;
    const card = cards[currentIndex];
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex((i) => (i < cards.length - 1 ? i + 1 : 0));
    }, 220);
    try {
      await fetch(`${API_URL}/api/flashcards/${card.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quality }),
      });
    } catch { /* silent */ }
  };

  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5, 8, 20, 0.85)", backdropFilter: "blur(12px)" }}
    >
      {/* Ambient glow behind modal */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(91,115,255,0.12) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          filter: "blur(40px)",
        }}
      />

      <div
        className="relative w-full max-w-lg flex flex-col overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0d1428 0%, #111827 100%)",
          border: "1px solid rgba(91,115,255,0.18)",
          borderRadius: 28,
          boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(91,115,255,0.1)",
        }}
      >
        {/* Top accent line */}
        <div
          className="h-0.5 w-full"
          style={{ background: "linear-gradient(90deg, transparent, #5b73ff, #a78bfa, transparent)" }}
        />

        <div className="p-6 md:p-7 space-y-5">
          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(91,115,255,0.15)", border: "1px solid rgba(91,115,255,0.25)" }}
                >
                  <Sparkles className="w-3.5 h-3.5" style={{ color: "#7c8fff" }} />
                </div>
                <h3
                  className="font-extrabold text-base tracking-tight"
                  style={{
                    background: "linear-gradient(135deg, #f0f4ff 0%, #7c8fff 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Spaced Repetition Review
                </h3>
              </div>
              <p
                className="text-xs truncate max-w-[280px] pl-9"
                style={{ color: "var(--color-text-muted)" }}
              >
                {lessonTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-xl transition-all cursor-pointer shrink-0"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--color-text-muted)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLButtonElement).style.color = "#f0f4ff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)";
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Divider ── */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

          {/* ── Content states ── */}
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(91,115,255,0.12)", border: "1px solid rgba(91,115,255,0.2)" }}
              >
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#5b73ff" }} />
              </div>
              <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Loading flashcards…</p>
            </div>

          ) : cards.length === 0 ? (
            <div className="py-10 text-center space-y-5">
              <div
                className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
                style={{ background: "rgba(91,115,255,0.08)", border: "1px solid rgba(91,115,255,0.15)" }}
              >
                <HelpCircle className="w-7 h-7" style={{ color: "#5b73ff" }} />
              </div>
              <div className="space-y-1.5">
                <h4 style={{ color: "var(--color-text-primary)", fontWeight: 700, fontSize: 15 }}>
                  No flashcards yet
                </h4>
                <p style={{ color: "var(--color-text-muted)", fontSize: 12, maxWidth: 300, margin: "0 auto", lineHeight: 1.6 }}>
                  AI will analyse this lesson and write spaced-repetition Q&A cards using SM-2 scheduling.
                </p>
              </div>
              {error && <p style={{ color: "#fca5a5", fontSize: 12 }}>{error}</p>}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn-primary mx-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>AI Writing Flashcards…</span></>
                ) : (
                  <><Sparkles className="w-4 h-4" /><span>Generate Flashcards</span></>
                )}
              </button>
            </div>

          ) : (
            <div className="space-y-5">
              {/* Progress bar + counter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--color-text-muted)", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                    Card {currentIndex + 1} of {cards.length}
                  </span>
                  <span
                    className="badge badge-accent"
                    style={{ fontSize: 10 }}
                  >
                    SM-2 Mode
                  </span>
                </div>
                {/* Progress track */}
                <div
                  className="h-1 w-full rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      background: "linear-gradient(90deg, #5b73ff, #a78bfa)",
                    }}
                  />
                </div>
              </div>

              {/* ── Flip Card ── */}
              <div
                onClick={() => setFlipped(!flipped)}
                className="h-56 relative cursor-pointer select-none w-full"
                style={{ perspective: "1000px" }}
                role="button"
                aria-label={flipped ? "Click to return to question" : "Click to reveal answer"}
              >
                <div
                  className="w-full h-full relative transition-transform duration-500"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* Front — Question */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-6"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      borderRadius: 20,
                      background: "linear-gradient(145deg, rgba(91,115,255,0.08) 0%, rgba(13,20,40,0.9) 100%)",
                      border: "1px solid rgba(91,115,255,0.15)",
                    }}
                  >
                    {/* Subtle glow dot top-right */}
                    <div
                      className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
                      style={{ background: "radial-gradient(circle, rgba(91,115,255,0.2) 0%, transparent 70%)", filter: "blur(12px)" }}
                    />
                    <span
                      className="text-[10px] font-black uppercase tracking-widest mb-4"
                      style={{ color: "#7c8fff" }}
                    >
                      Question
                    </span>
                    <p
                      className="font-bold text-base leading-relaxed"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {cards[currentIndex]?.front}
                    </p>
                    <span
                      className="absolute bottom-4 text-[10px] font-medium"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Click card to flip
                    </span>
                  </div>

                  {/* Back — Answer */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-6"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      borderRadius: 20,
                      background: "linear-gradient(145deg, rgba(16,185,129,0.08) 0%, rgba(13,20,40,0.9) 100%)",
                      border: "1px solid rgba(16,185,129,0.2)",
                    }}
                  >
                    <div
                      className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
                      style={{ background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)", filter: "blur(12px)" }}
                    />
                    <span
                      className="text-[10px] font-black uppercase tracking-widest mb-4"
                      style={{ color: "#34d399" }}
                    >
                      Correct Answer
                    </span>
                    <p
                      className="font-medium text-sm leading-relaxed"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {cards[currentIndex]?.back}
                    </p>
                    <span
                      className="absolute bottom-4 text-[10px] font-medium"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Click card to flip back
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Action row ── */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
                {flipped ? (
                  <div className="space-y-3">
                    <p
                      className="text-center text-xs font-semibold"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      How well did you recall this?
                    </p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {/* Hard */}
                      <button
                        onClick={() => handleReview(1)}
                        className="py-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        style={{
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          color: "#fca5a5",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)";
                        }}
                      >
                        😓 Hard
                      </button>
                      {/* Good */}
                      <button
                        onClick={() => handleReview(3)}
                        className="py-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        style={{
                          background: "rgba(245,158,11,0.08)",
                          border: "1px solid rgba(245,158,11,0.2)",
                          color: "#fcd34d",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.08)";
                        }}
                      >
                        🤔 Good
                      </button>
                      {/* Easy */}
                      <button
                        onClick={() => handleReview(5)}
                        className="py-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        style={{
                          background: "rgba(16,185,129,0.08)",
                          border: "1px solid rgba(16,185,129,0.2)",
                          color: "#6ee7b7",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(16,185,129,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(16,185,129,0.08)";
                        }}
                      >
                        ✅ Easy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {/* Prev */}
                    <button
                      onClick={() => { setFlipped(false); setCurrentIndex((i) => Math.max(0, i - 1)); }}
                      disabled={currentIndex === 0}
                      aria-label="Previous card"
                      className="p-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--color-text-secondary)" }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Reveal */}
                    <button
                      onClick={() => setFlipped(true)}
                      className="btn-primary flex-1 py-3 rounded-xl"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Reveal Answer</span>
                    </button>

                    {/* Next */}
                    <button
                      onClick={() => { setFlipped(false); setCurrentIndex((i) => Math.min(cards.length - 1, i + 1)); }}
                      disabled={currentIndex === cards.length - 1}
                      aria-label="Next card"
                      className="p-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--color-text-secondary)" }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashcardsModal;
