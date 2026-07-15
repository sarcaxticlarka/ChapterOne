"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { ArrowRight, BookOpen, Brain, Sparkles, Award } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-t-violet-500 border-zinc-800 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-violet-500/30">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center relative overflow-hidden">
        {/* Abstract Glowing Gradients in Background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl z-10 space-y-8">
          <div className="inline-flex items-center space-x-2 bg-violet-950/30 border border-violet-800/40 px-4 py-1.5 rounded-full text-violet-400 text-xs font-semibold tracking-wide uppercase animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Curriculum Builder</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Turn Any PDF Into An
            <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">
              Interactive E-Course
            </span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Upload textbooks, research papers, documentation, or study guides. Our AI will chunk, embed, and convert your documents into structured learning paths with summaries, quizzes, and an AI companion chatbot.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/login?tab=signup"
              className="gradient-button w-full sm:w-auto px-8 py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 group text-white shadow-xl shadow-violet-900/30 hover:scale-105 transition-all duration-300"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/70 hover:border-zinc-700 transition-all duration-300"
            >
              Log In
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full z-10">
          <div className="glass-panel p-8 rounded-3xl text-left space-y-4 border border-zinc-800/50 hover:border-violet-500/30 transition-all duration-300 hover:translate-y-[-4px]">
            <div className="w-12 h-12 rounded-2xl bg-violet-950/50 flex items-center justify-center text-violet-400 border border-violet-800/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl text-zinc-100">Structured Curriculum</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Instantly converts large documents into courses divided into chapters, topics, subtopics, and comprehensive reading lessons.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl text-left space-y-4 border border-zinc-800/50 hover:border-fuchsia-500/30 transition-all duration-300 hover:translate-y-[-4px]">
            <div className="w-12 h-12 rounded-2xl bg-fuchsia-950/50 flex items-center justify-center text-fuchsia-400 border border-fuchsia-800/30">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl text-zinc-100">AI Study Companion</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Ask questions on specific PDF contents. Our RAG-grounded chatbot reads your PDF to explain complex logic, summarize, or query facts.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl text-left space-y-4 border border-zinc-800/50 hover:border-indigo-500/30 transition-all duration-300 hover:translate-y-[-4px]">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/50 flex items-center justify-center text-indigo-400 border border-indigo-800/30">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl text-zinc-100">Semantic & MCQ Quizzes</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Test your recall with auto-generated chapter quizzes. Grades short-answer questions semantically using AI evaluation models.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-zinc-900 text-center text-zinc-500 text-sm">
        <p>© {new Date().getFullYear()} Chapter One Platform. Built for Premium Interactive Learning.</p>
      </footer>
    </div>
  );
}
