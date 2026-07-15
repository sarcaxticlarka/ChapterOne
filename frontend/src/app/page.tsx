"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-t-violet-500 border-zinc-950 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-glow-background text-white flex flex-col relative selection:bg-violet-500/30">
      
      {/* Premium Floating Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-20">
        {/* Brand logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
            <BookOpen className="w-4 h-4 text-violet-400" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            Chapter<span className="text-violet-400">One</span>
          </span>
        </div>

        {/* Floating Menu Pill */}
        <nav className="hidden md:flex items-center space-x-1.5 bg-zinc-900/60 border border-zinc-800/60 p-1.5 rounded-full backdrop-blur-md">
          <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-white text-black transition-all">Home</button>
          <button className="px-4 py-1.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-all">Features</button>
          <button className="px-4 py-1.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-all">Methodology</button>
          <button className="px-4 py-1.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-all">About Us</button>
        </nav>

        {/* Get Started Right Action */}
        <Link
          href="/login?tab=signup"
          className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold border border-zinc-200 hover:bg-zinc-100 transition-all shadow-lg cursor-pointer"
        >
          Get Started
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center z-10 relative space-y-12">
        <div className="max-w-4xl space-y-8">
          <div className="inline-flex items-center space-x-2 bg-zinc-900/70 border border-zinc-800/80 px-4 py-1.5 rounded-full text-violet-400 text-[10px] font-extrabold tracking-wider uppercase animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Syllabus Planner</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] serif-title">
            Designed for Minds<br />That Think Ahead
          </h1>

          <p className="text-zinc-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            A premium study platform built to remove friction and turn static PDFs into interactive, structured curriculum paths.
          </p>

          <div className="flex justify-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center space-x-3 bg-zinc-950/80 hover:bg-zinc-900 text-white font-extrabold text-sm py-4 px-8 rounded-full border border-zinc-800 hover:border-zinc-700 transition-all duration-300 shadow-2xl cursor-pointer group"
            >
              <span>Get Started</span>
              <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>
        </div>

        {/* Dynamic Feature List */}
        <section className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
          <div className="glass-panel p-6 rounded-2xl text-left border border-zinc-900/60 flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-900/80 flex items-center justify-center border border-zinc-850">
              <BookOpen className="w-5 h-5 text-violet-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-zinc-200">Interactive Syllabus</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Transforms uploads page-by-page into course outlines, chapters, and rich study sections.
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl text-left border border-zinc-900/60 flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-900/80 flex items-center justify-center border border-zinc-850">
              <Brain className="w-5 h-5 text-violet-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-zinc-200">Grounded RAG Chat</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Ask the companion queries regarding specific parts of your textbook with streaming responses.
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl text-left border border-zinc-900/60 flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-900/80 flex items-center justify-center border border-zinc-850">
              <Award className="w-5 h-5 text-violet-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-zinc-200">Recall Flashcards</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Retain concepts with auto-generated Spaced Repetition flashcards leveraging the SM-2 algorithm.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-zinc-950 text-center text-zinc-650 text-xs z-10">
        <p>© {new Date().getFullYear()} Chapter One Platform. Crafted with modern aesthetics.</p>
      </footer>
    </div>
  );
}
