"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import ReactMarkdown from "react-markdown";
import canvasConfetti from "canvas-confetti";
import FlashcardsModal from "@/components/FlashcardsModal";
import MindmapTab from "@/components/MindmapTab";
import {
  BookOpen, Sparkles, AlertCircle, ChevronLeft, ChevronRight,
  CheckCircle2, Circle, MessageSquare, Send, Award, HelpCircle,
  Menu, X, Play, RefreshCw, FileText, Loader2, Brain, Pause,
  Square, Volume2
} from "lucide-react";

interface LessonSummary {
  id: string;
  title: string;
  order_index: number;
  completed: boolean;
}

interface Chapter {
  id: string;
  title: string;
  order_index: number;
  lessons: LessonSummary[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  est_learning_time: string;
  objectives: string[];
  prerequisites: string[];
  chapters: Chapter[];
}

interface LessonDetail {
  id: string;
  title: string;
  content_md: string;
  key_takeaways: string[];
  notes: string[];
  examples: string[];
  summary: string;
  order_index: number;
  completed: boolean;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const API_URL = "http://localhost:8000";

export default function CourseViewer() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const totalLessons = course?.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0) || 0;
  const completedLessons = course?.chapters.reduce((acc, ch) => acc + ch.lessons.filter(l => l.completed).length, 0) || 0;
  const isCourseComplete = totalLessons > 0 && completedLessons === totalLessons;
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [flashcardsOpen, setFlashcardsOpen] = useState(false);
  
  // TTS State
  const [ttsSpeaking, setTtsSpeaking] = useState(false);
  const [ttsPaused, setTtsPaused] = useState(false);
  const [viewMode, setViewMode] = useState<"lesson" | "mindmap">("lesson");
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [courseLoading, setCourseLoading] = useState(true);

  // Chatbox states
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [convoId, setConvoId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Cancel speech on unmount or lesson change
    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
    };
  }, [activeLessonId]);

  useEffect(() => {
    setViewMode("lesson");
  }, [activeLessonId]);

  useEffect(() => {
    if (token && courseId) {
      fetchCourseData();
    }
  }, [token, courseId]);

  useEffect(() => {
    if (activeLessonId && token) {
      fetchLessonData(activeLessonId);
    }
  }, [activeLessonId, token]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchCourseData = async () => {
    setCourseLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCourse(data);
        // Set first lesson active by default
        if (data.chapters.length > 0 && data.chapters[0].lessons.length > 0) {
          setActiveLessonId(data.chapters[0].lessons[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading course outline:", err);
    } finally {
      setCourseLoading(false);
    }
  };

  const fetchLessonData = async (lessonId: string) => {
    setLessonLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}/lessons/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLesson(data);
      }
    } catch (err) {
      console.error("Error loading lesson details:", err);
    } finally {
      setLessonLoading(false);
    }
  };

  const toggleLessonComplete = async () => {
    if (!lesson || !token) return;
    const nextCompletedState = !lesson.completed;
    
    // Optimistic UI updates
    setLesson(prev => prev ? { ...prev, completed: nextCompletedState } : null);
    
    // Update sidebar state
    setCourse(prev => {
      if (!prev) return null;
      const updatedChapters = prev.chapters.map(ch => ({
        ...ch,
        lessons: ch.lessons.map(l => l.id === lesson.id ? { ...l, completed: nextCompletedState } : l)
      }));
      return { ...prev, chapters: updatedChapters };
    });

    try {
      const response = await fetch(`${API_URL}/api/progress/lessons/${lesson.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          completed: nextCompletedState,
          time_spent_seconds: 60 // Simulate spending 1 minute on finish
        })
      });
      
      if (response.ok && nextCompletedState) {
        // Trigger celebratory confetti effect
        canvasConfetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 }
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const stripMarkdown = (md: string) => {
    return md
      .replace(/#+\s+/g, "") // Remove headers
      .replace(/\*+/g, "")   // Remove bold/italics
      .replace(/`+/g, "")    // Remove inline code quotes
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Remove links keeping text
      .trim();
  };

  const startTTS = () => {
    if (!lesson || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    
    const cleanText = `${lesson.title}. ${stripMarkdown(lesson.content_md || "")}`;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.onend = () => {
      setTtsSpeaking(false);
      setTtsPaused(false);
    };
    
    utterance.onerror = () => {
      setTtsSpeaking(false);
      setTtsPaused(false);
    };
    
    window.speechSynthesis.speak(utterance);
    setTtsSpeaking(true);
    setTtsPaused(false);
  };

  const pauseTTS = () => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.pause();
    setTtsPaused(true);
  };

  const resumeTTS = () => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.resume();
    setTtsPaused(false);
  };

  const stopTTS = () => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    setTtsSpeaking(false);
    setTtsPaused(false);
  };

  const downloadCertificate = () => {
    if (!course || !user) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 1100;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Background
    const grad = ctx.createLinearGradient(0, 0, 1600, 1100);
    grad.addColorStop(0, "#09090b"); // Zinc 950
    grad.addColorStop(1, "#18181b"); // Zinc 900
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1600, 1100);
    
    // Gold/Violet border lines
    ctx.strokeStyle = "#8b5cf6"; // Violet 500
    ctx.lineWidth = 20;
    ctx.strokeRect(40, 40, 1520, 1020);
    
    ctx.strokeStyle = "#fbbf24"; // Amber 400
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 60, 1480, 980);
    
    // Content Header
    ctx.textAlign = "center";
    ctx.fillStyle = "#fafafa";
    ctx.font = "bold 60px sans-serif";
    ctx.fillText("CERTIFICATE OF COMPLETION", 800, 250);
    
    // Presentation text
    ctx.fillStyle = "#a1a1aa"; // Zinc 400
    ctx.font = "italic 28px sans-serif";
    ctx.fillText("This is proudly presented to", 800, 380);
    
    // User name
    ctx.fillStyle = "#fafafa";
    ctx.font = "bold 70px sans-serif";
    ctx.fillText(user.name.toUpperCase(), 800, 490);
    
    // Subtext
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "28px sans-serif";
    ctx.fillText("for successfully completing all curriculum requirements of the course", 800, 600);
    
    // Course title
    ctx.fillStyle = "#fbbf24"; // Amber 400
    ctx.font = "bold 46px sans-serif";
    
    const title = course.title;
    if (title.length > 50) {
      ctx.fillText(title.substring(0, 50) + "...", 800, 700);
    } else {
      ctx.fillText(title, 800, 700);
    }
    
    // Date & Signature lines
    ctx.fillStyle = "#71717a"; // Zinc 500
    ctx.font = "22px sans-serif";
    ctx.fillText(`Issued on: ${new Date().toLocaleDateString()}`, 800, 840);
    
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("AI EDUCATION PLATFORM", 800, 920);
    
    // Download trigger
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `Certificate_${course.title.replace(/\s+/g, "_")}.png`;
    link.href = url;
    link.click();
  };

  const exportStudyGuide = async () => {
    if (!token || !course) return;
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([data.markdown], { type: "text/markdown;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `StudyGuide_${course.title.replace(/\s+/g, "_")}.md`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Failed to export study guide:", err);
    }
  };

  const handleSendMessage = async (customMsg?: string) => {
    const textToSend = customMsg || inputMsg;
    if (!textToSend.trim() || !token) return;

    if (!customMsg) setInputMsg("");
    
    // Add user message to state
    const newUserMsg: ChatMsg = { role: "user", content: textToSend };
    setMessages(prev => [...prev, newUserMsg]);
    setChatLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          course_id: courseId,
          message: textToSend,
          conversation_id: convoId
        })
      });

      if (!response.body) return;
      
      // Setup reader for streaming response (SSE)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      
      // Add empty assistant placeholder message
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const cleaned = line.replace("data: ", "").trim();
              if (!cleaned) continue;
              const parsed = JSON.parse(cleaned);
              
              if (parsed.conversation_id) {
                setConvoId(parsed.conversation_id);
              }
              if (parsed.token) {
                assistantContent += parsed.token;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                  return updated;
                });
              }
            } catch (e) {
              // Ignore partial parsing errors on chunk border
            }
          }
        }
      }
    } catch (err) {
      console.error("Streaming failed:", err);
    } finally {
      setChatLoading(false);
    }
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-t-violet-500 border-zinc-800 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col relative overflow-hidden">
      <Navbar />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-4 bottom-4 z-40 p-3 rounded-full bg-zinc-900 border border-zinc-800 hover:border-violet-500/50 shadow-2xl transition-colors cursor-pointer block lg:hidden"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Sidebar Table of Contents */}
        <aside className={`glass-panel w-80 shrink-0 border-r border-zinc-900 flex flex-col transition-all duration-300 absolute inset-y-0 left-0 z-30 lg:relative ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:hidden"
        }`}>
          <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-zinc-400">Course Contents</h2>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {course?.chapters.map((chapter) => (
              <div key={chapter.id} className="space-y-2">
                <h3 className="text-sm font-bold text-zinc-200 px-2 line-clamp-1">{chapter.title}</h3>
                
                <div className="space-y-1">
                  {chapter.lessons.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setActiveLessonId(l.id);
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center justify-between transition-all duration-200 ${
                        activeLessonId === l.id
                          ? "bg-violet-950/30 text-violet-400 border border-violet-800/40"
                          : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white border border-transparent"
                      }`}
                    >
                      <span className="truncate pr-2">{l.title}</span>
                      {l.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-zinc-600 shrink-0" />
                      )}
                    </button>
                  ))}
                  
                  {/* Chapter Quiz Trigger */}
                  <Link
                    href={`/courses/${courseId}/quiz/${chapter.id}`}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900/50 flex items-center space-x-2"
                  >
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Practice Chapter Quiz</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Central Reading Area */}
        <section className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-zinc-950/20">
          {lessonLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
              <p className="text-zinc-500 text-sm animate-pulse">Retrieving grounded PDF chunks & building lesson page...</p>
            </div>
          ) : lesson ? (
            <div className="max-w-3xl mx-auto space-y-8 pb-20">
              {/* Course Title Header Bar */}
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/40 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Active Course Curriculum</span>
                  <h4 className="font-bold text-sm text-zinc-200">{course?.title}</h4>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={exportStudyGuide}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-350 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Export Guide (.md)</span>
                  </button>
                  {isCourseComplete && (
                    <button
                      onClick={downloadCertificate}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 rounded-xl text-xs font-black text-black transition-all cursor-pointer shadow-lg shadow-amber-950/20"
                    >
                      🏆 Claim Certificate
                    </button>
                  )}
                </div>
              </div>
              {/* Header */}
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-100 leading-tight">
                  {lesson.title}
                </h1>
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={toggleLessonComplete}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all duration-300 border ${
                      lesson.completed
                        ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/40"
                        : "bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border-zinc-800"
                    }`}
                  >
                    {lesson.completed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4" />
                        <span>Mark as Complete</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setFlashcardsOpen(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 transition-all duration-300 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span>Practice Flashcards</span>
                  </button>

                  {ttsSpeaking ? (
                    <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1">
                      {ttsPaused ? (
                        <button
                          type="button"
                          onClick={resumeTTS}
                          className="p-1 rounded text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
                          title="Play Narration"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={pauseTTS}
                          className="p-1 rounded text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer"
                          title="Pause Narration"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={stopTTS}
                        className="p-1 rounded text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                        title="Stop Narration"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] text-zinc-500 pr-2 border-l border-zinc-800 pl-2 font-bold animate-pulse">Reading...</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startTTS}
                      className="px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 transition-all duration-300 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      <span>Listen to Lesson</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs Bar */}
              <div className="flex border-b border-zinc-900 pb-px">
                <button
                  onClick={() => setViewMode("lesson")}
                  className={`pb-4 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                    viewMode === "lesson"
                      ? "border-violet-500 text-white"
                      : "border-transparent text-zinc-500 hover:text-zinc-350"
                  }`}
                >
                  📖 Lesson Explanation
                </button>
                <button
                  onClick={() => setViewMode("mindmap")}
                  className={`pb-4 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                    viewMode === "mindmap"
                      ? "border-violet-500 text-white"
                      : "border-transparent text-zinc-500 hover:text-zinc-350"
                  }`}
                >
                  🌿 Visual Concept Map
                </button>
              </div>

              {viewMode === "lesson" ? (
                <>
                  {/* Main Markdown Explanation */}
                  <article className="prose prose-invert max-w-none text-zinc-300 leading-relaxed space-y-6">
                    <ReactMarkdown
                      components={{
                        h2: ({ ...props }) => <h2 className="text-xl font-bold text-zinc-200 mt-8 mb-4 border-b border-zinc-900 pb-2" {...props} />,
                        p: ({ ...props }) => <p className="mb-4 text-zinc-300" {...props} />,
                        li: ({ ...props }) => <li className="list-disc pl-2 ml-4 text-zinc-400" {...props} />,
                        strong: ({ ...props }) => <strong className="text-zinc-100 font-bold" {...props} />,
                        code: ({ ...props }) => <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-violet-400 text-sm font-mono" {...props} />
                      }}
                    >
                      {lesson.content_md}
                    </ReactMarkdown>
                  </article>

                  {/* Grid of Summarized Elements */}
                  <div className="grid grid-cols-1 gap-6 pt-6">
                    {/* Key Takeaways */}
                    {lesson.key_takeaways && lesson.key_takeaways.length > 0 && (
                      <div className="p-6 rounded-[24px] card-3d-purple border-violet-300/40 space-y-3 relative overflow-hidden">
                        <div className="w-16 h-16 rounded-full bubble-3d bubble-3d-purple right-[-10px] top-[-10px] opacity-20"></div>
                        <h3 className="font-extrabold text-sm uppercase tracking-wider text-violet-950 flex items-center space-x-2 relative z-10">
                          <Sparkles className="w-4 h-4 text-violet-700" />
                          <span>Key Takeaways</span>
                        </h3>
                        <ul className="space-y-2 relative z-10">
                          {lesson.key_takeaways.map((item, idx) => (
                            <li key={idx} className="text-xs text-violet-950/80 font-semibold flex items-start space-x-2">
                              <span className="text-violet-650 font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Important Notes */}
                    {lesson.notes && lesson.notes.length > 0 && (
                      <div className="p-6 rounded-[24px] card-3d-peach border-orange-300/40 space-y-3 relative overflow-hidden">
                        <div className="w-16 h-16 rounded-full bubble-3d bubble-3d-peach right-[-10px] top-[-10px] opacity-20"></div>
                        <h3 className="font-extrabold text-sm uppercase tracking-wider text-orange-950 flex items-center space-x-2 relative z-10">
                          <AlertCircle className="w-4 h-4 text-orange-700" />
                          <span>Important Notes</span>
                        </h3>
                        <ul className="space-y-2 relative z-10">
                          {lesson.notes.map((item, idx) => (
                            <li key={idx} className="text-xs text-orange-950/80 font-semibold flex items-start space-x-2">
                              <span className="text-orange-650 font-bold">!</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Real-World Examples */}
                    {lesson.examples && lesson.examples.length > 0 && (
                      <div className="p-6 rounded-[24px] card-3d-green border-emerald-300/40 space-y-3 relative overflow-hidden">
                        <div className="w-16 h-16 rounded-full bubble-3d bubble-3d-green right-[-10px] top-[-10px] opacity-20"></div>
                        <h3 className="font-extrabold text-sm uppercase tracking-wider text-emerald-950 flex items-center space-x-2 relative z-10">
                          <FileText className="w-4 h-4 text-emerald-700" />
                          <span>Real-World Application</span>
                        </h3>
                        <ul className="space-y-2 relative z-10">
                          {lesson.examples.map((item, idx) => (
                            <li key={idx} className="text-xs text-emerald-950/80 font-semibold leading-relaxed">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <MindmapTab courseId={courseId} />
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <BookOpen className="w-12 h-12 text-zinc-500" />
              <p className="text-zinc-500 text-sm">Select a lesson from the sidebar to begin reading.</p>
            </div>
          )}
        </section>

        {/* AI Learning Companion Chatbot Drawer */}
        <aside className={`glass-panel w-96 shrink-0 border-l border-zinc-900 flex flex-col transition-all duration-300 absolute inset-y-0 right-0 z-35 lg:relative ${
          chatOpen ? "translate-x-0" : "translate-x-full lg:w-0 lg:border-l-0 overflow-hidden"
        }`}>
          {/* Chat Header */}
          <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-violet-400 animate-pulse" />
              <h2 className="font-bold text-sm">AI Companion</h2>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <Brain className="w-10 h-10 text-zinc-700" />
                <div className="space-y-1">
                  <p className="text-zinc-400 font-bold text-sm">Need help understanding?</p>
                  <p className="text-zinc-600 text-xs">Ask concepts about the PDF, request summaries, or trigger custom commands below.</p>
                </div>
                
                {/* Suggestions Quick Buttons */}
                <div className="w-full space-y-2 pt-2">
                  <button
                    onClick={() => handleSendMessage("Explain the core logic of the current lesson.")}
                    className="w-full text-left px-3 py-2 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-850 hover:border-violet-500/35 rounded-xl text-xs text-zinc-400 hover:text-white transition-all cursor-pointer"
                  >
                    💡 Explain current lesson
                  </button>
                  <button
                    onClick={() => handleSendMessage("Provide a concise summary of the PDF text.")}
                    className="w-full text-left px-3 py-2 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-850 hover:border-violet-500/35 rounded-xl text-xs text-zinc-400 hover:text-white transition-all cursor-pointer"
                  >
                    📖 Summarize book context
                  </button>
                  <button
                    onClick={() => handleSendMessage("Suggest the next logical lesson to study.")}
                    className="w-full text-left px-3 py-2 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-850 hover:border-violet-500/35 rounded-xl text-xs text-zinc-400 hover:text-white transition-all cursor-pointer"
                  >
                    ⏭ What should I learn next?
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col max-w-[85%] rounded-2xl p-3.5 text-sm ${
                  msg.role === "user"
                    ? "bg-violet-650 text-white ml-auto rounded-tr-none shadow-md"
                    : "bg-zinc-900 border border-zinc-850 text-zinc-200 mr-auto rounded-tl-none leading-relaxed"
                }`}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown
                    components={{
                      p: ({ ...props }) => <p className="mb-2" {...props} />,
                      li: ({ ...props }) => <li className="list-disc ml-4 text-zinc-300" {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            ))}
            <div ref={chatBottomRef}></div>
          </div>

          {/* Inputs Area */}
          <div className="p-4 border-t border-zinc-900 bg-zinc-900/10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                placeholder="Ask your companion..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                disabled={chatLoading}
                className="input-premium flex-1"
              />
              <button
                type="submit"
                disabled={chatLoading || !inputMsg.trim()}
                className="p-2.5 rounded-xl gradient-button text-white disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </aside>

        {/* Small floating chat toggle button if closed */}
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="absolute right-4 bottom-4 z-40 p-3 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-2xl transition-all cursor-pointer hover:scale-105"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        )}

        {flashcardsOpen && lesson && (
          <FlashcardsModal
            lessonId={lesson.id}
            lessonTitle={lesson.title}
            onClose={() => setFlashcardsOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
