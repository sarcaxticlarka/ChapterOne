"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import canvasConfetti from "canvas-confetti";
import {
  Award, AlertCircle, Loader2, ArrowLeft,
  CheckCircle2, XCircle, Sparkles, Trophy,
} from "lucide-react";

interface Question { id: string; type: string; question: string; options?: string[]; }
interface Quiz { id: string; chapter_id: string; questions: Question[]; }
interface GradedQuestion {
  question_id: string; type: string; question: string;
  user_answer: string; correct_answer: string; explanation: string;
  score: number; is_correct: boolean; feedback: string;
}
interface GradingResult {
  attempt_id: string; score: number; submitted_at: string; questions: GradedQuestion[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* ── shared inline-style tokens ── */
const T = {
  bg:         "#0a0f1e",
  surface:    "rgba(13,20,40,0.92)",
  border:     "rgba(255,255,255,0.07)",
  textPrimary:"#f0f4ff",
  textSec:    "#8b9ab8",
  textMuted:  "#4a5568",
  accent:     "#5b73ff",
  accentDim:  "rgba(91,115,255,0.12)",
  accentBdr:  "rgba(91,115,255,0.22)",
};

export default function ChapterQuiz() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const chapterId = params.chapterId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [quizLoading, setQuizLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);
  useEffect(() => { if (token && chapterId) loadQuiz(); }, [token, chapterId]);

  const loadQuiz = async () => {
    setQuizLoading(true); setErrorMsg("");
    try {
      const res = await fetch(`${API_URL}/api/quizzes/generate?chapter_id=${chapterId}`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json(); setQuiz(data);
        const init: Record<string,string> = {};
        data.questions.forEach((q: Question) => { init[q.id] = ""; });
        setAnswers(init);
      } else setErrorMsg("Failed to generate the chapter quiz.");
    } catch { setErrorMsg("Could not connect to the server."); }
    finally { setQuizLoading(false); }
  };

  const handleSelect = (qId: string, val: string) => { if (!gradingResult) setAnswers(p => ({ ...p, [qId]: val })); };
  const handleText   = (qId: string, val: string) => { if (!gradingResult) setAnswers(p => ({ ...p, [qId]: val })); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz || !token) return;
    if (Object.values(answers).some(a => !a.trim())) { setErrorMsg("Please answer all questions before submitting."); return; }
    setErrorMsg(""); setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/quizzes/${quiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        const result = await res.json(); setGradingResult(result);
        if (result.score >= 70) canvasConfetti({ particleCount: 120, spread: 90, origin: { y: 0.55 } });
      } else setErrorMsg("Error submitting quiz.");
    } catch { setErrorMsg("Failed to submit answers."); }
    finally { setSubmitting(false); }
  };

  const handleRetake = () => {
    setGradingResult(null);
    const r: Record<string,string> = {};
    quiz?.questions.forEach(q => { r[q.id] = ""; });
    setAnswers(r); setErrorMsg("");
  };

  /* ── page shell ── */
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.textPrimary, display: "flex", flexDirection: "column" }}>
      <Navbar />
      {/* Ambient glows */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} aria-hidden>
        <div style={{ position: "absolute", top: 80, right: "25%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(91,115,255,0.08) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: 60, left: "20%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)", filter: "blur(80px)" }} />
        {/* 3D perspective grid */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35vh", perspective: "600px", perspectiveOrigin: "50% 0%" }}>
          <div style={{
            position: "absolute", inset: 0, transformOrigin: "50% 0%", transform: "rotateX(55deg)",
            backgroundImage: "linear-gradient(to right, rgba(91,115,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(91,115,255,0.07) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 40%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 40%, transparent 100%)",
          }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${T.bg} 0%, transparent 60%)` }} />
        </div>
      </div>
      {children}
    </div>
  );

  /* ── Skeleton ── */
  if (loading || quizLoading) {
    return (
      <Shell>
        <div style={{ position: "relative", zIndex: 10, flex: 1, maxWidth: 760, width: "100%", margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 24, marginBottom: 24, borderBottom: `1px solid ${T.border}` }}>
            <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 12 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="skeleton" style={{ width: 200, height: 28, borderRadius: 10 }} />
              <div className="skeleton" style={{ width: 260, height: 16, borderRadius: 8 }} />
            </div>
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 200, borderRadius: 24, marginBottom: 20 }} />
          ))}
        </div>
      </Shell>
    );
  }

  const scoreColor = gradingResult ? (gradingResult.score >= 70 ? "#34d399" : "#fbbf24") : T.accent;

  return (
    <Shell>
      <main style={{ position: "relative", zIndex: 10, flex: 1, maxWidth: 760, width: "100%", margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 24, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => router.push(`/courses/${courseId}`)}
              aria-label="Back to course"
              style={{ padding: 8, borderRadius: 12, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, color: T.textSec, cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <ArrowLeft style={{ width: 16, height: 16 }} />
            </button>
            <div>
              <h1 style={{
                fontSize: 24, fontWeight: 800, lineHeight: 1.2,
                background: "linear-gradient(135deg, #f0f4ff 0%, #7c8fff 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                Chapter Quiz
              </h1>
              <p style={{ fontSize: 13, color: T.textSec, marginTop: 3 }}>
                Test your recall of the concepts in this chapter.
              </p>
            </div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Award style={{ width: 20, height: 20, color: "#fbbf24" }} />
          </div>
        </div>

        {/* ── Error ── */}
        {errorMsg && (
          <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: 14, display: "flex", alignItems: "flex-start", gap: 10 }}>
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── Score banner ── */}
        {gradingResult && (
          <div style={{
            padding: 24, borderRadius: 24,
            background: "linear-gradient(145deg, rgba(13,20,40,0.97) 0%, rgba(17,24,39,0.97) 100%)",
            border: `1px solid ${gradingResult.score >= 70 ? "rgba(52,211,153,0.3)" : "rgba(251,191,36,0.3)"}`,
            boxShadow: `0 0 50px ${gradingResult.score >= 70 ? "rgba(52,211,153,0.07)" : "rgba(251,191,36,0.07)"}`,
            display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: gradingResult.score >= 70 ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)", border: `1px solid ${gradingResult.score >= 70 ? "rgba(52,211,153,0.25)" : "rgba(251,191,36,0.25)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Trophy style={{ width: 28, height: 28, color: scoreColor }} />
              </div>
              <div>
                <p style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Final Score</p>
                <p style={{ fontSize: 36, fontWeight: 900, color: scoreColor, lineHeight: 1.1 }}>{gradingResult.score}%</p>
                <p style={{ fontSize: 13, color: T.textSec, marginTop: 3 }}>
                  {gradingResult.score >= 85 ? "Outstanding! You've mastered these concepts."
                    : gradingResult.score >= 70 ? "Good job! You passed the quiz."
                    : "Keep going — review the lessons and try again."}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={handleRetake} style={{ padding: "10px 20px", borderRadius: 9999, background: "transparent", border: `1px solid ${T.border}`, color: T.textSec, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Retake Quiz
              </button>
              <button onClick={() => router.push(`/courses/${courseId}`)} style={{ padding: "10px 20px", borderRadius: 9999, background: T.accent, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(91,115,255,0.35)" }}>
                Back to Course
              </button>
            </div>
          </div>
        )}

        {/* ── Questions ── */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {quiz?.questions.map((q, idx) => {
            const graded = gradingResult !== null;
            const gInfo = graded ? gradingResult.questions.find(g => g.question_id === q.id) : null;

            const cardBorder = graded && gInfo ? (gInfo.is_correct ? "rgba(52,211,153,0.28)" : "rgba(239,68,68,0.28)") : T.border;
            const cardBg = graded && gInfo
              ? gInfo.is_correct
                ? "linear-gradient(145deg, rgba(16,185,129,0.06) 0%, rgba(13,20,40,0.95) 100%)"
                : "linear-gradient(145deg, rgba(239,68,68,0.06) 0%, rgba(13,20,40,0.95) 100%)"
              : "linear-gradient(145deg, rgba(13,20,40,0.92) 0%, rgba(17,24,39,0.92) 100%)";

            return (
              <div key={q.id} style={{ padding: 24, borderRadius: 24, background: cardBg, border: `1px solid ${cardBorder}`, display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Q header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 28, height: 28, borderRadius: 10, background: T.accentDim, border: `1px solid ${T.accentBdr}`, color: T.accent, fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textMuted }}>
                      {q.type.replace(/-/g, " ")}
                    </span>
                  </div>
                  {graded && gInfo && (
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: gInfo.is_correct ? "#34d399" : "#fca5a5" }}>
                      {gInfo.is_correct ? <><CheckCircle2 style={{ width: 15, height: 15 }} /><span>Correct</span></> : <><XCircle style={{ width: 15, height: 15 }} /><span>Incorrect</span></>}
                    </span>
                  )}
                </div>

                {/* Question */}
                <p style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary, lineHeight: 1.6 }}>{q.question}</p>

                {/* MCQ options */}
                {q.type !== "short-answer" && q.options && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {q.options.map((opt, oi) => {
                      const selected = answers[q.id] === opt;
                      const isCorrectOpt = gInfo?.correct_answer === opt;
                      const isWrongSel = graded && selected && !isCorrectOpt;

                      let bg    = "rgba(255,255,255,0.03)";
                      let bdr   = T.border;
                      let clr   = T.textSec;
                      let td    = "none";
                      let fw: number | string = 400;

                      if (!graded && selected) { bg = "rgba(91,115,255,0.1)"; bdr = "rgba(91,115,255,0.4)"; clr = "#7c8fff"; fw = 700; }
                      if (graded && isCorrectOpt) { bg = "rgba(16,185,129,0.08)"; bdr = "rgba(52,211,153,0.35)"; clr = "#34d399"; fw = 700; }
                      if (isWrongSel) { bg = "rgba(239,68,68,0.08)"; bdr = "rgba(239,68,68,0.35)"; clr = "#fca5a5"; td = "line-through"; fw = 700; }

                      return (
                        <button key={opt} type="button" disabled={graded} onClick={() => handleSelect(q.id, opt)}
                          style={{ width: "100%", textAlign: "left", padding: "14px 16px", borderRadius: 16, background: bg, border: `1px solid ${bdr}`, color: clr, fontSize: 14, fontWeight: fw, textDecoration: td, cursor: graded ? "default" : "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s ease" }}
                        >
                          <span style={{ width: 24, height: 24, borderRadius: 8, background: selected || (graded && isCorrectOpt) ? bdr : "rgba(255,255,255,0.06)", border: `1px solid ${bdr}`, color: "#fff", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span style={{ flex: 1 }}>{opt}</span>
                          {graded && isCorrectOpt && <CheckCircle2 style={{ width: 16, height: 16, color: "#34d399", flexShrink: 0 }} />}
                          {isWrongSel && <XCircle style={{ width: 16, height: 16, color: "#fca5a5", flexShrink: 0 }} />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Short answer */}
                {q.type === "short-answer" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <textarea rows={4} placeholder="Write your answer here…" disabled={graded}
                      value={answers[q.id] || ""} onChange={e => handleText(q.id, e.target.value)}
                      style={{ width: "100%", background: "rgba(10,15,30,0.8)", border: `1px solid ${T.border}`, borderRadius: 14, padding: "12px 14px", color: T.textPrimary, fontSize: 14, fontFamily: "inherit", resize: "vertical", minHeight: 100, outline: "none" }}
                    />
                    {graded && gInfo && (
                      <div style={{ padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 12 }}>
                        <div>
                          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textMuted }}>AI Feedback</p>
                          <p style={{ fontSize: 13, color: T.textSec, marginTop: 4, lineHeight: 1.6 }}>{gInfo.feedback}</p>
                        </div>
                        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textMuted }}>Model Answer</p>
                          <p style={{ fontSize: 13, color: "#34d399", fontWeight: 600, marginTop: 4 }}>{gInfo.correct_answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation */}
                {graded && gInfo?.explanation && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: 16, background: "rgba(91,115,255,0.07)", border: "1px solid rgba(91,115,255,0.18)" }}>
                    <Sparkles style={{ width: 16, height: 16, color: "#7c8fff", flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#7c8fff", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em" }}>Explanation</p>
                      <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6 }}>{gInfo.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit */}
          {!gradingResult && (
            <button type="submit" disabled={submitting}
              style={{ width: "100%", padding: "16px 24px", borderRadius: 20, background: T.accent, border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 8px 28px rgba(91,115,255,0.35)", transition: "all 0.2s ease" }}
            >
              {submitting
                ? <><Loader2 style={{ width: 20, height: 20 }} className="animate-spin" /><span>AI grading your answers…</span></>
                : <><CheckCircle2 style={{ width: 20, height: 20 }} /><span>Submit Quiz</span></>
              }
            </button>
          )}
        </form>
      </main>
    </Shell>
  );
}
