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

interface Question {
  id: string;
  type: string;
  question: string;
  options?: string[];
}
interface Quiz {
  id: string;
  chapter_id: string;
  questions: Question[];
}
interface GradedQuestion {
  question_id: string;
  type: string;
  question: string;
  user_answer: string;
  correct_answer: string;
  explanation: string;
  score: number;
  is_correct: boolean;
  feedback: string;
}
interface GradingResult {
  attempt_id: string;
  score: number;
  submitted_at: string;
  questions: GradedQuestion[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (token && chapterId) loadQuiz();
  }, [token, chapterId]);

  const loadQuiz = async () => {
    setQuizLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${API_URL}/api/quizzes/generate?chapter_id=${chapterId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQuiz(data);
        const init: Record<string, string> = {};
        data.questions.forEach((q: Question) => { init[q.id] = ""; });
        setAnswers(init);
      } else {
        setErrorMsg("Failed to generate the chapter quiz.");
      }
    } catch {
      setErrorMsg("Could not connect to the server.");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelect = (qId: string, val: string) => {
    if (gradingResult) return;
    setAnswers((p) => ({ ...p, [qId]: val }));
  };

  const handleText = (qId: string, val: string) => {
    if (gradingResult) return;
    setAnswers((p) => ({ ...p, [qId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz || !token) return;
    if (Object.values(answers).some((a) => !a.trim())) {
      setErrorMsg("Please answer all questions before submitting.");
      return;
    }
    setErrorMsg("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/quizzes/${quiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        const result = await res.json();
        setGradingResult(result);
        if (result.score >= 70) {
          canvasConfetti({ particleCount: 120, spread: 90, origin: { y: 0.55 } });
        }
      } else {
        setErrorMsg("Error submitting quiz.");
      }
    } catch {
      setErrorMsg("Failed to submit answers.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setGradingResult(null);
    const r: Record<string, string> = {};
    quiz?.questions.forEach((q) => { r[q.id] = ""; });
    setAnswers(r);
    setErrorMsg("");
  };

  /* ── Loading skeleton ── */
  if (loading || quizLoading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="flex-1 content-max py-10 space-y-6" style={{ maxWidth: 760 }}>
          <div className="flex items-center gap-3 pb-6" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <div className="skeleton w-9 h-9 rounded-xl" />
            <div className="space-y-2">
              <div className="skeleton h-7 w-52 rounded-xl" />
              <div className="skeleton h-4 w-64 rounded-lg" />
            </div>
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const scoreColor = gradingResult
    ? gradingResult.score >= 70 ? "#34d399" : "#fbbf24"
    : "#5b73ff";

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] rounded-full bg-[#5b73ff]/5 blur-[120px]" />
        <div className="absolute bottom-20 left-1/4 w-[300px] h-[300px] rounded-full bg-amber-500/4 blur-[100px]" />
      </div>

      <main
        className="relative z-10 flex-1 content-max py-10 space-y-7"
        style={{ maxWidth: 760 }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between pb-6"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/courses/${courseId}`)}
              aria-label="Back to course"
              className="btn-ghost p-2"
              style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1
                style={{
                  fontSize: "var(--text-2xl)",
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #f0f4ff 0%, #7c8fff 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Chapter Quiz
              </h1>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginTop: 2 }}>
                Test your recall of the concepts in this chapter.
              </p>
            </div>
          </div>

          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
          >
            <Award className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        {/* ── Error ── */}
        {errorMsg && (
          <div className="alert-error">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── Score banner ── */}
        {gradingResult && (
          <div
            className="p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-5"
            style={{
              background: "linear-gradient(145deg, rgba(13,20,40,0.95) 0%, rgba(17,24,39,0.95) 100%)",
              border: `1px solid ${gradingResult.score >= 70 ? "rgba(52,211,153,0.25)" : "rgba(251,191,36,0.25)"}`,
              boxShadow: `0 0 40px ${gradingResult.score >= 70 ? "rgba(52,211,153,0.06)" : "rgba(251,191,36,0.06)"}`,
            }}
          >
            {/* Left: score */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: gradingResult.score >= 70 ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)",
                  border: `1px solid ${gradingResult.score >= 70 ? "rgba(52,211,153,0.2)" : "rgba(251,191,36,0.2)"}`,
                }}
              >
                <Trophy className="w-7 h-7" style={{ color: scoreColor }} />
              </div>
              <div>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", fontWeight: 600 }}>
                  Final Score
                </p>
                <p style={{ fontSize: "var(--text-3xl)", fontWeight: 900, color: scoreColor, lineHeight: 1.1 }}>
                  {gradingResult.score}%
                </p>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginTop: 2 }}>
                  {gradingResult.score >= 85 && "Outstanding! You've mastered these concepts."}
                  {gradingResult.score >= 70 && gradingResult.score < 85 && "Good job! You passed the quiz."}
                  {gradingResult.score < 70 && "Keep going — review the lessons and try again."}
                </p>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={handleRetake}
                className="btn-secondary flex-1 md:flex-none"
                style={{ borderRadius: "var(--radius-lg)" }}
              >
                Retake Quiz
              </button>
              <button
                onClick={() => router.push(`/courses/${courseId}`)}
                className="btn-primary flex-1 md:flex-none"
                style={{ borderRadius: "var(--radius-lg)" }}
              >
                Back to Course
              </button>
            </div>
          </div>
        )}

        {/* ── Questions ── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {quiz?.questions.map((q, idx) => {
            const graded = gradingResult !== null;
            const gInfo = graded ? gradingResult.questions.find((g) => g.question_id === q.id) : null;

            // Card border based on grade
            let cardBorder = "var(--color-border)";
            let cardBg = "linear-gradient(145deg, rgba(13,20,40,0.9) 0%, rgba(17,24,39,0.9) 100%)";
            if (graded && gInfo) {
              cardBorder = gInfo.is_correct ? "rgba(52,211,153,0.25)" : "rgba(239,68,68,0.25)";
              cardBg = gInfo.is_correct
                ? "linear-gradient(145deg, rgba(16,185,129,0.05) 0%, rgba(13,20,40,0.9) 100%)"
                : "linear-gradient(145deg, rgba(239,68,68,0.05) 0%, rgba(13,20,40,0.9) 100%)";
            }

            return (
              <div
                key={q.id}
                className="p-6 rounded-3xl transition-all duration-300"
                style={{
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  boxShadow: graded && gInfo
                    ? `0 0 30px ${gInfo.is_correct ? "rgba(52,211,153,0.04)" : "rgba(239,68,68,0.04)"}`
                    : "none",
                }}
              >
                <div className="space-y-4">
                  {/* Question header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
                        style={{
                          background: "var(--color-accent-dim)",
                          color: "var(--color-accent)",
                          border: "1px solid rgba(91,115,255,0.2)",
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span
                        style={{
                          fontSize: "var(--text-xs)",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {q.type.replace("-", " ")}
                      </span>
                    </div>

                    {graded && gInfo && (
                      <span
                        className="flex items-center gap-1.5 text-xs font-bold"
                        style={{ color: gInfo.is_correct ? "#34d399" : "#fca5a5" }}
                      >
                        {gInfo.is_correct
                          ? <><CheckCircle2 className="w-4 h-4" /><span>Correct</span></>
                          : <><XCircle className="w-4 h-4" /><span>Incorrect</span></>
                        }
                      </span>
                    )}
                  </div>

                  {/* Question text */}
                  <p style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1.6 }}>
                    {q.question}
                  </p>

                  {/* MCQ / True-False options */}
                  {q.type !== "short-answer" && q.options && (
                    <div className="space-y-2.5 pt-1">
                      {q.options.map((opt) => {
                        const selected = answers[q.id] === opt;
                        const isCorrectOpt = gInfo?.correct_answer === opt;
                        const isWrongSelected = graded && selected && !isCorrectOpt;

                        let bg = "rgba(255,255,255,0.03)";
                        let border = "var(--color-border)";
                        let color = "var(--color-text-secondary)";
                        let textDecoration = "none";

                        if (!graded && selected) {
                          bg = "rgba(91,115,255,0.1)";
                          border = "rgba(91,115,255,0.4)";
                          color = "#7c8fff";
                        } else if (graded && isCorrectOpt) {
                          bg = "rgba(16,185,129,0.08)";
                          border = "rgba(52,211,153,0.35)";
                          color = "#34d399";
                        } else if (isWrongSelected) {
                          bg = "rgba(239,68,68,0.08)";
                          border = "rgba(239,68,68,0.35)";
                          color = "#fca5a5";
                          textDecoration = "line-through";
                        }

                        return (
                          <button
                            key={opt}
                            type="button"
                            disabled={graded}
                            onClick={() => handleSelect(q.id, opt)}
                            className="w-full text-left p-4 rounded-2xl text-sm transition-all duration-150 cursor-pointer disabled:cursor-default flex items-center gap-3"
                            style={{ background: bg, border: `1px solid ${border}`, color, textDecoration }}
                          >
                            {/* Option dot */}
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black"
                              style={{
                                background: selected || (graded && isCorrectOpt) ? border : "rgba(255,255,255,0.06)",
                                border: `1px solid ${border}`,
                                color: selected || (graded && isCorrectOpt) ? "#fff" : "var(--color-text-muted)",
                              }}
                            >
                              {String.fromCharCode(65 + (q.options?.indexOf(opt) ?? 0))}
                            </span>
                            <span style={{ fontWeight: selected || (graded && isCorrectOpt) ? 700 : 400 }}>
                              {opt}
                            </span>
                            {graded && isCorrectOpt && (
                              <CheckCircle2 className="w-4 h-4 ml-auto shrink-0" style={{ color: "#34d399" }} />
                            )}
                            {isWrongSelected && (
                              <XCircle className="w-4 h-4 ml-auto shrink-0" style={{ color: "#fca5a5" }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Short answer textarea */}
                  {q.type === "short-answer" && (
                    <div className="space-y-3 pt-1">
                      <textarea
                        rows={4}
                        placeholder="Write your answer here…"
                        disabled={graded}
                        value={answers[q.id] || ""}
                        onChange={(e) => handleText(q.id, e.target.value)}
                        className="input-field"
                        style={{ resize: "vertical", minHeight: 100, borderRadius: "var(--radius-lg)" }}
                      />
                      {graded && gInfo && (
                        <div
                          className="p-4 rounded-2xl space-y-3"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)" }}
                        >
                          <div>
                            <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-muted)" }}>
                              AI Feedback
                            </p>
                            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginTop: 4, lineHeight: 1.6 }}>
                              {gInfo.feedback}
                            </p>
                          </div>
                          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 12 }}>
                            <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-muted)" }}>
                              Model Answer
                            </p>
                            <p style={{ fontSize: "var(--text-sm)", color: "#34d399", fontWeight: 600, marginTop: 4 }}>
                              {gInfo.correct_answer}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation */}
                  {graded && gInfo?.explanation && (
                    <div
                      className="flex items-start gap-3 p-4 rounded-2xl mt-1"
                      style={{
                        background: "rgba(91,115,255,0.06)",
                        border: "1px solid rgba(91,115,255,0.15)",
                      }}
                    >
                      <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#7c8fff" }} />
                      <div>
                        <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "#7c8fff", marginBottom: 3 }}>
                          Explanation
                        </p>
                        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                          {gInfo.explanation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Submit button */}
          {!gradingResult && (
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{ fontSize: "var(--text-base)" }}
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /><span>AI grading your answers…</span></>
              ) : (
                <><CheckCircle2 className="w-5 h-5" /><span>Submit Quiz</span></>
              )}
            </button>
          )}
        </form>
      </main>
    </div>
  );
}
