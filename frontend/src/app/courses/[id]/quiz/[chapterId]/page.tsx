"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import canvasConfetti from "canvas-confetti";
import { Award, AlertCircle, HelpCircle, Loader2, ArrowLeft, CheckCircle2, XCircle, Sparkles } from "lucide-react";

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

const API_URL = "http://localhost:8000";

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
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (token && chapterId) {
      loadOrCreateQuiz();
    }
  }, [token, chapterId]);

  const loadOrCreateQuiz = async () => {
    setQuizLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch(`${API_URL}/api/quizzes/generate?chapter_id=${chapterId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setQuiz(data);
        // Initialize answer states
        const initialAnswers: Record<string, string> = {};
        data.questions.forEach((q: Question) => {
          initialAnswers[q.id] = "";
        });
        setAnswers(initialAnswers);
      } else {
        setErrorMsg("Failed to generate or load the chapter quiz.");
      }
    } catch (err) {
      setErrorMsg("Could not establish connection to the server.");
      console.error(err);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectAnswer = (qId: string, val: string) => {
    if (gradingResult) return; // Read-only after submit
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleTextChange = (qId: string, val: string) => {
    if (gradingResult) return;
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz || !token) return;

    // Check that at least all questions have some inputs
    const uncompleted = Object.values(answers).some(a => a.trim() === "");
    if (uncompleted) {
      setErrorMsg("Please answer all questions before submitting.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/quizzes/${quiz.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answers })
      });

      if (response.ok) {
        const result = await response.json();
        setGradingResult(result);
        
        // Celebrate if score is high
        if (result.score >= 70) {
          canvasConfetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 }
          });
        }
      } else {
        setErrorMsg("Error submitting quiz attempts.");
      }
    } catch (err) {
      setErrorMsg("Failed to submit answers.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setGradingResult(null);
    const resetAnswers: Record<string, string> = {};
    quiz?.questions.forEach((q) => {
      resetAnswers[q.id] = "";
    });
    setAnswers(resetAnswers);
    setErrorMsg("");
  };

  if (loading || quizLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-t-violet-500 border-zinc-800 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute top-[10%] right-[10%] w-[300px] h-[300px] bg-amber-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push(`/courses/${courseId}`)}
              className="p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Chapter Quiz Practice</h1>
              <p className="text-zinc-400 text-xs mt-0.5">Test your recall of the concepts explained in this chapter.</p>
            </div>
          </div>
          
          <div className="inline-flex w-10 h-10 rounded-xl bg-amber-950/30 border border-amber-900/40 items-center justify-center text-amber-500">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 text-red-400 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quiz Submission Results Summary */}
        {gradingResult && (
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-zinc-800/40 flex flex-col md:flex-row items-center justify-between gap-6 bg-violet-950/5">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-2xl font-black">Your Quiz Score: <span className={gradingResult.score >= 70 ? "text-emerald-400" : "text-amber-500"}>{gradingResult.score}%</span></h2>
              <p className="text-zinc-400 text-sm">
                {gradingResult.score >= 85 && "Outstanding work! You've mastered these concepts."}
                {gradingResult.score >= 70 && gradingResult.score < 85 && "Good job! You passed the chapter quiz."}
                {gradingResult.score < 70 && "Keep studying! Try reviewing the lessons and retaking the quiz."}
              </p>
            </div>
            
            <div className="flex items-center space-x-4 w-full md:w-auto shrink-0">
              <button
                onClick={handleRetake}
                className="flex-1 md:flex-none py-3 px-6 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl font-bold transition-all text-sm cursor-pointer"
              >
                Retake Quiz
              </button>
              <button
                onClick={() => router.push(`/courses/${courseId}`)}
                className="flex-1 md:flex-none py-3 px-6 gradient-button rounded-xl font-bold text-white text-sm cursor-pointer"
              >
                Return to Course
              </button>
            </div>
          </div>
        )}

        {/* Quiz Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {quiz?.questions.map((q, idx) => {
            const isGraded = gradingResult !== null;
            const gradedInfo = isGraded ? gradingResult.questions.find(g => g.question_id === q.id) : null;
            
            return (
              <div
                key={q.id}
                className={`glass-panel p-6 rounded-3xl border transition-all duration-300 ${
                  isGraded
                    ? gradedInfo?.is_correct
                      ? "border-emerald-950/40 bg-emerald-950/5"
                      : "border-red-950/40 bg-red-950/5"
                    : "border-zinc-800/40"
                }`}
              >
                <div className="space-y-4">
                  {/* Title & Question number */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">
                      Question {idx + 1} • {q.type.replace("-", " ")}
                    </span>
                    {isGraded && (
                      <span className={`text-xs font-bold flex items-center space-x-1 ${
                        gradedInfo?.is_correct ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {gradedInfo?.is_correct ? (
                          <>
                            <CheckCircle2 className="w-4.5 h-4.5" />
                            <span>Correct ({gradedInfo.score} pts)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4.5 h-4.5" />
                            <span>Incorrect ({gradedInfo?.score || 0} pts)</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <p className="text-zinc-100 font-bold text-base leading-relaxed">{q.question}</p>

                  {/* Rendering Options for MCQs and True/False */}
                  {q.type !== "short-answer" && q.options && (
                    <div className="grid grid-cols-1 gap-3 pt-2">
                      {q.options.map((option) => {
                        const isSelected = answers[q.id] === option;
                        let optionStyle = "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300";
                        
                        if (isSelected) {
                          optionStyle = "bg-violet-950/20 border-violet-800/50 text-violet-400";
                        }
                        
                        if (isGraded) {
                          const isCorrectOption = option === gradedInfo?.correct_answer;
                          if (isCorrectOption) {
                            optionStyle = "bg-emerald-950/20 border-emerald-800/60 text-emerald-400 font-bold";
                          } else if (isSelected) {
                            optionStyle = "bg-red-950/20 border-red-800/60 text-red-400 line-through";
                          }
                        }

                        return (
                          <button
                            key={option}
                            type="button"
                            disabled={isGraded}
                            onClick={() => handleSelectAnswer(q.id, option)}
                            className={`w-full text-left p-4 rounded-xl border text-sm flex items-center justify-between transition-all cursor-pointer disabled:cursor-default ${optionStyle}`}
                          >
                            <span>{option}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Rendering Textarea for Short Answers */}
                  {q.type === "short-answer" && (
                    <div className="space-y-4 pt-2">
                      <textarea
                        rows={4}
                        placeholder="Write your explanation or answer in details..."
                        disabled={isGraded}
                        value={answers[q.id] || ""}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        className="input-premium w-full h-32 leading-relaxed"
                      ></textarea>

                      {isGraded && gradedInfo && (
                        <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-850">
                          <div>
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">AI Grader Feedback</span>
                            <p className="text-sm text-zinc-300 leading-relaxed mt-1">{gradedInfo.feedback}</p>
                          </div>
                          <div className="pt-2 border-t border-zinc-800/40">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Expected Reference Model Answer</span>
                            <p className="text-sm text-emerald-400 font-semibold mt-1">{gradedInfo.correct_answer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rendering Explanation Box if submitted */}
                  {isGraded && gradedInfo?.explanation && (
                    <div className="mt-4 p-4 rounded-2xl bg-violet-950/10 border border-violet-900/20 text-zinc-300 text-xs leading-relaxed flex items-start space-x-2.5">
                      <Sparkles className="w-4 h-4 shrink-0 text-violet-400 mt-0.5" />
                      <div>
                        <span className="font-bold text-violet-400 block mb-0.5">Explanation</span>
                        <span>{gradedInfo.explanation}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {!gradingResult && (
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl font-bold text-white gradient-button flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>AI Grader evaluating answers...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Submit Quiz Answers</span>
                </>
              )}
            </button>
          )}
        </form>
      </main>
    </div>
  );
}
