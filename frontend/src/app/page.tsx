"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, BookOpen, Brain, Sparkles, Award, Zap, FileText, CheckCircle, ChevronRight } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activePreviewTab, setActivePreviewTab] = useState<"lesson" | "flashcards" | "quiz">("lesson");
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);

  const handleScroll = (id: string) => {
    if (id === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!loading && user) router.push("/dashboard");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfcfa]">
        <div className="w-10 h-10 rounded-full border-4 border-t-violet-600 border-zinc-200 animate-spin" />
      </div>
    );
  }

  // Floating 3D Isometric Cube SVG Component
  const FloatingCube = ({ className, size = 80, delay = "0s" }: { className: string; size?: number; delay?: string }) => (
    <div className={`pointer-events-none select-none ${className}`} style={{ animationDelay: delay }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <defs>
          <linearGradient id="cubeGradSide1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="cubeGradSide2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="cubeGradTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbcfe8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#e879f9" stopOpacity="0.75" />
          </linearGradient>
        </defs>
        {/* Top face */}
        <path d="M50 15 L80 32 L50 50 L20 32 Z" fill="url(#cubeGradTop)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.75" />
        {/* Right face */}
        <path d="M50 50 L80 32 L80 68 L50 85 Z" fill="url(#cubeGradSide1)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.75" />
        {/* Left face */}
        <path d="M20 32 L50 50 L50 85 L20 68 Z" fill="url(#cubeGradSide2)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.75" />
      </svg>
    </div>
  );

  return (
    <div className="page-wrapper bg-dreamy-clouds min-h-screen relative overflow-x-hidden text-zinc-900">
      
      {/* ── BACKGROUND FLOATING CUBES ── */}
      <FloatingCube className="absolute top-[22%] left-[8%] animate-float" size={90} />
      <FloatingCube className="absolute top-[15%] right-[10%] animate-float-delayed" size={110} delay="1s" />
      <FloatingCube className="absolute top-[55%] left-[5%] animate-float-delayed" size={70} delay="2s" />
      <FloatingCube className="absolute top-[65%] right-[6%] animate-float" size={85} delay="1.5s" />

      {/* ── FLOATING HEADER ── */}
      <header className="relative z-20 flex justify-center pt-5 px-4 w-full">
        <div
          className="w-full flex items-center justify-between px-6 py-3 rounded-full glass-light"
          style={{
            maxWidth: "1100px",
            background: "rgba(255, 255, 255, 0.45)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.03)",
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center shadow-md shadow-black/10">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-zinc-900">
              Chapter<span className="text-violet-600">One</span>
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-full" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.04)" }}>
            {[
              { label: "Home", id: "home" },
              { label: "Features", id: "features" },
              { label: "Workflow", id: "workflow" },
              { label: "About", id: "about" },
            ].map((item, i) => (
              <button
                key={item.id}
                onClick={() => handleScroll(item.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  i === 0
                    ? "bg-white text-zinc-900 shadow-sm border border-black/5"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-black/5"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* CTA */}
          <Link
            href="/login?tab=signup"
            className="px-4.5 py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-sm shadow-black/10"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-16 text-center">
        <div className="max-w-4xl space-y-7">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-violet-50 border border-violet-100 px-4 py-1.5 rounded-full text-violet-600 text-[10px] font-extrabold tracking-widest uppercase shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Learning Platform</span>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl md:text-7.5xl font-black tracking-tight leading-[1.04] text-zinc-950"
            style={{
              letterSpacing: "-0.03em"
            }}
          >
            Turn any PDF into <br className="hidden sm:inline" />
            <span className="text-gradient-primary">a full course.</span>
          </h1>

          {/* Sub */}
          <p className="text-zinc-800 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-bold">
            Upload a document and get chapters, lessons, quizzes, flashcards, and an AI companion — in seconds.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/login?tab=signup"
              className="inline-flex items-center gap-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs py-3.5 px-8 rounded-full transition-all shadow-md shadow-black/10 hover:-translate-y-0.5 group"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-zinc-200 bg-white/40 hover:bg-white/70 text-zinc-800 font-bold text-xs py-3.5 px-8 rounded-full transition-all backdrop-blur-md hover:-translate-y-0.5"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* ── MOCKUP CONTAINER ── */}
        <div className="relative mt-16 w-full max-w-4xl px-4 md:px-0">
          <div
            className="rounded-[32px] glass-light p-6 md:p-8"
            style={{
              background: "rgba(255, 255, 255, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.6)",
              boxShadow: "0 24px 60px rgba(139, 92, 246, 0.05), inset 0 1px 1px rgba(255,255,255,0.7)",
            }}
          >
            {/* Header of Mockup */}
            <div className="flex items-center justify-between pb-4 border-b border-black/5 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
              </div>
              <div className="px-4 py-1 rounded-full bg-white/60 border border-white text-[10px] font-bold text-zinc-800 shadow-sm flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-violet-500" />
                <span>spaced_repetition_study.pdf</span>
              </div>
              <div className="w-10" />
            </div>

            {/* Mock Chat View */}
            <div className="space-y-4 max-w-2xl mx-auto text-left">
              {/* User message */}
              <div className="flex items-start gap-3 justify-end">
                <div className="bg-white border border-black/10 text-zinc-900 px-4 py-3 rounded-2xl rounded-tr-none text-xs md:text-sm font-bold shadow-sm max-w-md">
                  Hey, I need help studying chapter 3 of the uploaded PDF. Can we go over Spaced Repetition?
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-400 to-purple-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm">
                  ME
                </div>
              </div>

              {/* AI message */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center shrink-0 shadow-md">
                  <BookOpen className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="space-y-3 max-w-lg">
                  <div className="bg-white text-zinc-900 px-4.5 py-3 rounded-2xl rounded-tl-none text-xs md:text-sm font-bold shadow-sm border border-black/10">
                    Of course! I'll prepare a personalized spaced repetition study plan based on Chapter 3. I have generated 5 flashcards for this concept. Would you like me to start the review now?
                  </div>
                  {/* Action buttons inside mockup */}
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-full bg-violet-100 hover:bg-violet-200 border border-violet-200 text-violet-700 text-[10px] font-extrabold transition-all shadow-sm cursor-pointer">
                      Yes, start flashcards
                    </button>
                    <button className="px-3 py-1.5 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-[10px] font-extrabold transition-all shadow-sm cursor-pointer">
                      Show summary
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Input box */}
            <div className="mt-8 bg-white/80 border border-black/10 rounded-2xl p-3 shadow-md max-w-2xl mx-auto flex items-center justify-between">
              <span className="text-zinc-500 text-xs md:text-sm font-bold pl-2">Ask anything about your document...</span>
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 text-[9px] font-bold uppercase tracking-wider">
                  ✦ RAG Mode
                </span>
                <div className="w-7 h-7 rounded-xl bg-zinc-950 flex items-center justify-center shadow-md">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── INTERACTIVE COURSE PREVIEW PANEL (Replaces Stats Row) ── */}
        <div className="mt-28 w-full max-w-4xl px-4 md:px-0 text-left relative z-10 animate-fade-in">
          <div className="text-center mb-10 space-y-2">
            <p className="text-violet-600 text-xs font-extrabold tracking-widest uppercase">Take a Look Inside</p>
            <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight leading-tight">
              Experience Your Generated Course
            </h2>
            <p className="text-zinc-800 text-xs md:text-sm font-bold max-w-lg mx-auto text-center opacity-90">
              Click through the tabs below to preview the syllabus lessons, spacing flashcards, and practice quizzes built instantly from your documents.
            </p>
          </div>

          <div
            className="rounded-[32px] glass-light border border-white/60 shadow-sm p-2 flex flex-col md:flex-row min-h-[460px] overflow-hidden"
            style={{
              background: "rgba(255, 255, 255, 0.45)",
            }}
          >
            {/* Sidebar: Chapters */}
            <div className="w-full md:w-60 bg-white/20 border-r border-black/5 p-4 flex flex-col gap-2 shrink-0 rounded-l-[30px]">
              <div className="px-3 py-1 text-[9px] font-black uppercase tracking-wider text-zinc-500">Chapters</div>
              {[
                { num: "01", title: "Introduction to RAG", active: true },
                { num: "02", title: "Semantic Embeddings", active: false },
                { num: "03", title: "Chunking Strategies", active: false },
                { num: "04", title: "Spaced Repetition SM-2", active: false },
              ].map((ch) => (
                <div
                  key={ch.num}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl border transition-all ${
                    ch.active
                      ? "bg-white border-black/5 shadow-sm text-zinc-900 font-extrabold"
                      : "border-transparent text-zinc-600 hover:text-zinc-950 font-bold"
                  }`}
                >
                  <span
                    className={`text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      ch.active ? "bg-zinc-950 text-white" : "bg-black/5 text-zinc-500"
                    }`}
                  >
                    {ch.num}
                  </span>
                  <span className="text-xs truncate">{ch.title}</span>
                </div>
              ))}
            </div>

            {/* Main Preview Panel */}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between bg-white/10 rounded-r-[30px]">
              {/* Top: Nav Tabs */}
              <div className="flex items-center gap-2 border-b border-black/5 pb-4 mb-6">
                {[
                  { id: "lesson", label: "📄 Interactive Lesson" },
                  { id: "flashcards", label: "🧠 Spaced Flashcards" },
                  { id: "quiz", label: "📝 Practice Quiz" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActivePreviewTab(tab.id as any);
                    }}
                    className={`px-3.5 py-2 rounded-full text-xs font-black transition-all border ${
                      activePreviewTab === tab.id
                        ? "bg-zinc-950 border-zinc-950 text-white shadow-sm"
                        : "bg-white/60 border-zinc-200 text-zinc-700 hover:bg-white/80 hover:text-zinc-950 hover:border-zinc-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Center: Tab Content */}
              <div className="flex-1 flex flex-col justify-center min-h-[220px]">
                {activePreviewTab === "lesson" && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3 className="text-md font-extrabold text-zinc-900 tracking-tight">
                        1.1 Introduction to Retrieval-Augmented Generation
                      </h3>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 hover:bg-violet-100 border border-violet-100 text-violet-600 text-[10px] font-bold transition-all shadow-xs self-start sm:self-auto">
                        <Zap className="w-3 h-3 fill-violet-600" />
                        <span>Listen to Audio</span>
                      </button>
                    </div>
                    <p className="text-xs text-zinc-800 leading-relaxed font-bold">
                      Retrieval-Augmented Generation (RAG) is an AI framework for retrieving facts from an external knowledge base to ground Large Language Models (LLMs) on the most accurate, up-to-date information. This prevents hallucinations and anchors answers directly in your source documents.
                    </p>
                    <div className="bg-white/60 border border-black/5 rounded-2xl p-4 space-y-2">
                      <span className="text-[9px] font-extrabold text-violet-600 uppercase tracking-widest">Key Takeaways</span>
                      <ul className="list-disc list-inside text-[11px] text-zinc-800 space-y-1 font-bold">
                        <li>Augments generic model training with private context data.</li>
                        <li>Anchors response patterns in vector similarity searches.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activePreviewTab === "flashcards" && (
                  <div className="flex flex-col items-center justify-center space-y-5 animate-fade-in">
                    {/* Flashcard Body */}
                    <div
                      onClick={() => setFlashcardFlipped(!flashcardFlipped)}
                      className="w-full max-w-sm h-40 bg-white border border-black/5 rounded-3xl p-6 shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:shadow-sm relative overflow-hidden"
                    >
                      <span className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                        Click card to flip
                      </span>
                      <span className="text-[9px] font-extrabold text-violet-600 uppercase tracking-widest">
                        SM-2 Spaced Card
                      </span>

                      <div className="flex-1 flex items-center justify-center text-center px-4">
                        <p className="text-xs md:text-sm font-extrabold text-zinc-900 leading-tight">
                          {flashcardFlipped
                            ? "A mechanism that matches database facts to queries using multi-dimensional vector cosine distance."
                            : "What is Vector Similarity Search in the context of RAG?"}
                        </p>
                      </div>

                      <div className="w-full h-1 bg-zinc-150 rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-violet-500 rounded-full" />
                      </div>
                    </div>

                    {/* SM-2 Buttons */}
                    {flashcardFlipped && (
                      <div className="flex gap-2 animate-fade-in">
                        {["Again", "Good", "Easy"].map((btn, i) => (
                          <button
                            key={btn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFlashcardFlipped(false);
                            }}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                              i === 0
                                ? "bg-red-50 border-red-100 text-red-650 hover:bg-red-100"
                                : i === 1
                                ? "bg-violet-50 border-violet-100 text-violet-600 hover:bg-violet-100"
                                : "bg-emerald-50 border-emerald-100 text-emerald-650 hover:bg-emerald-100"
                            }`}
                          >
                            {btn}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activePreviewTab === "quiz" && (
                  <div className="space-y-4 animate-fade-in">
                    <span className="text-[9px] font-bold text-violet-600 uppercase tracking-widest">Question 1 of 5</span>
                    <h3 className="text-xs md:text-sm font-extrabold text-zinc-900 leading-tight">
                      How does RAG improve LLM factual correctness?
                    </h3>

                    <div className="space-y-2">
                      {[
                        "By fine-tuning model parameters globally.",
                        "By retrieving vector embeddings from document chunks to inject relevant context.",
                        "By running faster inference pipelines without memory states.",
                      ].map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => setQuizSelectedOption(i)}
                          className={`w-full text-left px-4 py-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between ${
                            quizSelectedOption === i
                              ? "bg-violet-50 border-violet-200 text-violet-600 shadow-xs"
                              : "bg-white/60 border-zinc-200 text-zinc-700 hover:bg-white hover:text-zinc-950"
                          }`}
                        >
                          <span>{opt}</span>
                          {quizSelectedOption === i && (
                            <span className="text-[10px] font-extrabold bg-violet-650 text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                              ✓
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom footer bar */}
              <div className="mt-8 pt-4 border-t border-black/5 flex items-center justify-between text-[10px] font-bold text-zinc-500">
                <span>CHAPTERONE COURSE PREVIEW</span>
                <Link href="/login?tab=signup" className="text-violet-600 hover:underline flex items-center gap-1">
                  <span>Unlock full course</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── FEATURES SECTION ── */}
        <section id="features" className="mt-32 w-full max-w-5xl relative">
          <div className="text-center mb-12 space-y-2">
            <p className="text-violet-600 text-xs font-extrabold tracking-widest uppercase">Everything you need</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 leading-tight">
              Learning, reimagined
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {[
              {
                icon: BookOpen,
                title: "Interactive Syllabus",
                desc: "PDF → structured chapters, lessons, and study guides automatically.",
                color: "from-pink-500/10 to-orange-500/10",
                iconColor: "text-orange-600",
                bubble1: "bg-gradient-to-tr from-pink-300/50 to-orange-300/40",
                bubble2: "bg-gradient-to-tr from-orange-350/40 to-pink-250/30"
              },
              {
                icon: Brain,
                title: "RAG AI Tutor",
                desc: "Ask anything about your document. Get grounded, streaming answers.",
                color: "from-purple-500/10 to-indigo-500/10",
                iconColor: "text-violet-600",
                bubble1: "bg-gradient-to-tr from-purple-300/50 to-indigo-300/40",
                bubble2: "bg-gradient-to-tr from-indigo-350/40 to-purple-250/30"
              },
              {
                icon: Award,
                title: "Spaced Repetition",
                desc: "Auto-generated SM-2 flashcards that adapt to your memory curve.",
                color: "from-emerald-500/10 to-teal-500/10",
                iconColor: "text-emerald-600",
                bubble1: "bg-gradient-to-tr from-emerald-300/50 to-teal-300/40",
                bubble2: "bg-gradient-to-tr from-teal-350/40 to-emerald-250/30"
              }
            ].map(({ icon: Icon, title, desc, color, iconColor, bubble1, bubble2 }) => (
              <div
                key={title}
                className="glass-light-card p-8 text-left rounded-[32px] flex flex-col justify-between h-72 relative group overflow-hidden border border-white/60 shadow-xs"
              >
                {/* Gradient background blur */}
                <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl ${color} blur-2xl rounded-full opacity-70 group-hover:scale-110 transition-transform duration-500`} />
                
                {/* 3D Glass Bubbles for "bubble feel" */}
                <div className={`bubble-glass-3d w-20 h-20 -top-6 -right-6 ${bubble1} group-hover:scale-110 group-hover:translate-x-1 group-hover:-translate-y-1`} />
                <div className={`bubble-glass-3d w-9 h-9 top-14 right-14 opacity-75 ${bubble2} group-hover:scale-125 group-hover:-translate-x-1.5 group-hover:translate-y-1.5`} />
                
                <div className="w-11 h-11 rounded-2xl bg-white shadow-sm border border-zinc-150 flex items-center justify-center relative z-10">
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="space-y-2.5 relative z-10">
                  <h3 className="font-extrabold text-sm text-zinc-900 tracking-tight">{title}</h3>
                  <p className="text-zinc-800 text-xs leading-relaxed font-bold opacity-90">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── WORKFLOW / TIMELINE SECTION ── */}
        <section id="workflow" className="mt-32 w-full max-w-5xl bg-white/40 border border-white/60 rounded-[32px] p-8 md:p-12 shadow-sm backdrop-blur-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Info */}
            <div className="lg:col-span-5 text-left space-y-6">
              <div className="space-y-2">
                <p className="text-violet-600 text-xs font-extrabold tracking-widest uppercase">Product Overview</p>
                <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight leading-tight">
                  Seamless Course Generation Process
                </h2>
              </div>
              <p className="text-zinc-800 text-xs md:text-sm leading-relaxed font-bold opacity-85">
                Effortlessly connect with your static textbooks, papers, or documentation. Watch as ChapterOne transforms raw files into a structured learning journey.
              </p>

              <div className="space-y-4 pt-2">
                {[
                  { title: "Unified PDF Connections", desc: "Instantly ingest documents up to 25 MB" },
                  { title: "Real-Time Semantic Extraction", desc: "Build embeddings in seconds" },
                  { title: "Flexible Learning Formats", desc: "Structured lessons, quizzes & audio files" }
                ].map(({ title, desc }) => (
                  <div key={title} className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0 shadow-sm mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-805 leading-none">{title}</h4>
                      <p className="text-[11px] text-zinc-700 mt-1 font-bold">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right isometric pipeline diagram */}
            <div className="lg:col-span-7 flex justify-center relative">
              <div className="w-full max-w-md bg-gradient-to-tr from-violet-500/10 to-pink-500/5 rounded-3xl p-6 border border-white shadow-inner relative overflow-hidden">
                {/* SVG Isometric Flow Diagram */}
                <svg viewBox="0 0 400 300" className="w-full h-auto" fill="none">
                  {/* Pipeline lines */}
                  <path d="M 60 220 L 150 140 L 250 140 L 340 70" stroke="rgba(139, 92, 246, 0.2)" strokeWidth="3" strokeDasharray="6 4" />
                  
                  {/* Step 1 Node */}
                  <g transform="translate(60, 220)">
                    <polygon points="0,-15 26,0 0,15 -26,0" fill="#ffffff" stroke="rgba(0,0,0,0.06)" strokeWidth="2" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.04))" />
                    <rect x="-10" y="-10" width="20" height="20" rx="6" fill="#09090b" />
                    <text x="0" y="32" textAnchor="middle" fill="#09090b" fontSize="9" fontWeight="800">1. PDF UPLOAD</text>
                  </g>

                  {/* Step 2 Node */}
                  <g transform="translate(150, 140)">
                    <polygon points="0,-15 26,0 0,15 -26,0" fill="#ffffff" stroke="rgba(0,0,0,0.06)" strokeWidth="2" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.04))" />
                    <rect x="-10" y="-10" width="20" height="20" rx="6" fill="#a855f7" />
                    <text x="0" y="32" textAnchor="middle" fill="#09090b" fontSize="9" fontWeight="800">2. AI PLANNER</text>
                  </g>

                  {/* Step 3 Node */}
                  <g transform="translate(250, 140)">
                    <polygon points="0,-15 26,0 0,15 -26,0" fill="#ffffff" stroke="rgba(0,0,0,0.06)" strokeWidth="2" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.04))" />
                    <rect x="-10" y="-10" width="20" height="20" rx="6" fill="#ec4899" />
                    <text x="0" y="32" textAnchor="middle" fill="#09090b" fontSize="9" fontWeight="800">3. QUIZ & RAG</text>
                  </g>

                  {/* Step 4 Node */}
                  <g transform="translate(340, 70)">
                    <polygon points="0,-15 26,0 0,15 -26,0" fill="#ffffff" stroke="rgba(0,0,0,0.06)" strokeWidth="2" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.04))" />
                    <rect x="-10" y="-10" width="20" height="20" rx="6" fill="#10b981" />
                    <text x="0" y="32" textAnchor="middle" fill="#09090b" fontSize="9" fontWeight="800">4. MASTERED</text>
                  </g>

                  {/* Glowing core indicator */}
                  <circle cx="150" cy="140" r="4" fill="#ffffff" filter="drop-shadow(0px 0px 8px #a855f7)" />
                  <circle cx="250" cy="140" r="4" fill="#ffffff" filter="drop-shadow(0px 0px 8px #ec4899)" />
                </svg>

                {/* Subtext info */}
                <div className="mt-4 text-center bg-white/70 border border-white rounded-xl py-2 px-4 shadow-sm flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400">AVERAGE PROCESSING TIME</span>
                  <span className="text-xs font-black text-violet-650">1.2s avg / MB</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── ABOUT & HIGH-CONTRAST BIG TEXT SECTION ── */}
      <section id="about" className="relative z-10 bg-zinc-950 py-24 px-6 text-center select-none overflow-hidden">
        {/* Glows in dark section */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-violet-600/10 blur-[120px]" />
        
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-white text-[10px] font-extrabold tracking-widest uppercase">
            <span>ABOUT</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-[1.2] max-w-3xl mx-auto text-center">
            ChapterOne is crafted to elevate how students, researchers, and modern teams learn from PDF documents. 
            <span className="text-zinc-400 font-medium"> With a focus on simple, beautiful, and clean design, it helps minds master any syllabus effortlessly.</span>
          </h2>

          <div className="pt-8">
            <Link
              href="/login?tab=signup"
              className="inline-flex items-center gap-2.5 bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs py-3.5 px-8 rounded-full transition-all shadow-lg hover:-translate-y-0.5"
            >
              Start Generating Now
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 py-10 border-t border-white/5 bg-zinc-950 text-center text-zinc-500">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-zinc-950" />
          </div>
          <span className="font-extrabold text-sm text-white">
            Chapter<span className="text-zinc-400">One</span>
          </span>
        </div>
        <p className="text-[11px] font-medium text-zinc-500">
          © {new Date().getFullYear()} ChapterOne Platform. Built for curious minds.
        </p>
      </footer>
    </div>
  );
}
