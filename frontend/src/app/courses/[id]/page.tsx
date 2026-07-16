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
  CheckCircle2, Circle, MessageSquare, Send, Award,
  Menu, X, Play, FileText, Loader2, Brain, Pause,
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
        setLesson(await response.json());
      }
    } catch (err) {
      console.error("Error loading lesson details:", err);
    } finally {
      setLessonLoading(false);
    }
  };

  const toggleLessonComplete = async () => {
    if (!lesson || !token) return;
    const nextCompleted = !lesson.completed;
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}/lessons/${lesson.id}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ completed: nextCompleted })
      });
      if (response.ok) {
        setLesson(prev => prev ? { ...prev, completed: nextCompleted } : null);
        setCourse(prev => {
          if (!prev) return null;
          const updatedChapters = prev.chapters.map(ch => ({
            ...ch,
            lessons: ch.lessons.map(l => l.id === lesson.id ? { ...l, completed: nextCompleted } : l)
          }));
          return { ...prev, chapters: updatedChapters };
        });

        // Trigger confetti on new completion if it completes the course
        if (nextCompleted) {
          const isNowComplete = course?.chapters.every(ch => 
            ch.lessons.every(l => l.id === lesson.id ? true : l.completed)
          );
          if (isNowComplete) {
            canvasConfetti({ particleCount: 150, spread: 80 });
          }
        }
      }
    } catch (err) {
      console.error("Failed to toggle completion status:", err);
    }
  };

  // TTS Methods
  const startTTS = () => {
    if (!lesson || typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    
    // Build full speaking text
    const titleText = `Lesson: ${lesson.title}. `;
    const contentText = lesson.content_md.replace(/[#*`_\[\]]/g, ""); // clean Markdown symbols
    const fullText = titleText + contentText;
    
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.onend = () => {
      setTtsSpeaking(false);
      setTtsPaused(false);
    };
    utterance.onerror = () => {
      setTtsSpeaking(false);
      setTtsPaused(false);
    };
    
    setTtsSpeaking(true);
    setTtsPaused(false);
    window.speechSynthesis?.speak(utterance);
  };

  const pauseTTS = () => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.pause();
    setTtsPaused(true);
  };

  const resumeTTS = () => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.resume();
    setTtsPaused(false);
  };

  const stopTTS = () => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    setTtsSpeaking(false);
    setTtsPaused(false);
  };

  // Claim certificate generator
  const downloadCertificate = () => {
    if (!course || !user) return;
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = "#faf7f5";
    ctx.fillRect(0, 0, 800, 600);

    // Decorative borders
    ctx.strokeStyle = "#c084fc";
    ctx.lineWidth = 15;
    ctx.strokeRect(20, 20, 760, 560);
    ctx.strokeStyle = "#09090b";
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 35, 730, 530);

    // Title
    ctx.fillStyle = "#09090b";
    ctx.font = "italic bold 38px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("Certificate of Completion", 400, 130);

    // Award detail
    ctx.fillStyle = "#52525b";
    ctx.font = "14px Arial";
    ctx.fillText("THIS IS PROUDLY PRESENTED TO", 400, 210);

    ctx.fillStyle = "#7c3aed";
    ctx.font = "bold 28px Arial";
    ctx.fillText(user.name, 400, 260);

    ctx.fillStyle = "#52525b";
    ctx.font = "14px Arial";
    ctx.fillText("FOR SUCCESSFUL COMPLETION OF THE COURSE", 400, 310);

    ctx.fillStyle = "#09090b";
    ctx.font = "bold 20px Arial";
    ctx.fillText(course.title, 400, 350);

    ctx.font = "12px Arial";
    ctx.fillStyle = "#71717a";
    ctx.fillText(`ID: ${course.id.substring(0, 8)}-${user.id.substring(0, 8)} | Date: ${new Date().toLocaleDateString()}`, 400, 410);

    // Signature line
    ctx.strokeStyle = "#71717a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(300, 490);
    ctx.lineTo(500, 490);
    ctx.stroke();

    ctx.fillStyle = "#09090b";
    ctx.font = "bold 13px Arial";
    ctx.fillText("ChapterOne Academic Advisor", 400, 515);

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
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      
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
      <div className="h-screen bg-dreamy-clouds flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-t-violet-650 border-zinc-200 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-dreamy-clouds text-zinc-900 flex flex-col relative overflow-hidden">
      <Navbar />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-4 bottom-4 z-40 p-3 rounded-full bg-white border border-zinc-200 hover:border-violet-500/50 shadow-2xl transition-colors cursor-pointer block lg:hidden"
        >
          {sidebarOpen ? <X className="w-5 h-5 text-zinc-800" /> : <Menu className="w-5 h-5 text-zinc-800" />}
        </button>

        {/* Sidebar Table of Contents */}
        <aside className={`glass-light border-r border-black/5 w-80 shrink-0 flex flex-col transition-all duration-300 absolute inset-y-0 left-0 z-30 lg:relative ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:hidden"
        }`}>
          <div className="p-6 border-b border-black/5 flex items-center justify-between">
            <h2 className="font-extrabold text-xs uppercase tracking-wider text-zinc-550">Course Contents</h2>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-zinc-500 hover:text-zinc-900">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {course?.chapters.map((chapter) => (
              <div key={chapter.id} className="space-y-2">
                <h3 className="text-sm font-black text-zinc-900 px-2 line-clamp-1">{chapter.title}</h3>
                
                <div className="space-y-1">
                  {chapter.lessons.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setActiveLessonId(l.id);
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center justify-between transition-all duration-200 border cursor-pointer ${
                        activeLessonId === l.id
                          ? "bg-white border-black/5 shadow-xs text-violet-650 font-bold"
                          : "text-zinc-600 hover:bg-white/40 hover:text-zinc-900 border-transparent"
                      }`}
                    >
                      <span className="truncate pr-2 font-bold">{l.title}</span>
                      {l.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-zinc-300 shrink-0" />
                      )}
                    </button>
                  ))}
                  
                  {/* Chapter Quiz Trigger */}
                  <Link
                    href={`/courses/${courseId}/quiz/${chapter.id}`}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-900 hover:bg-white/40 flex items-center space-x-2"
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
        <section className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-white/10">
          {lessonLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
              <p className="text-zinc-500 text-sm font-bold animate-pulse">Retrieving grounded PDF chunks & building lesson page...</p>
            </div>
          ) : lesson ? (
            <div className="max-w-3xl mx-auto space-y-8 pb-20">
              {/* Course Title Header Bar */}
              <div className="p-5 rounded-2xl bg-white/50 border border-white/60 flex items-center justify-between flex-wrap gap-4 shadow-xs">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Active Course Curriculum</span>
                  <h4 className="font-bold text-sm text-zinc-900">{course?.title}</h4>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={exportStudyGuide}
                    className="px-4 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Export Guide (.md)</span>
                  </button>
                  {isCourseComplete && (
                    <button
                      onClick={downloadCertificate}
                      className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl text-xs font-black text-zinc-950 transition-all cursor-pointer shadow-md shadow-amber-950/5"
                    >
                      🏆 Claim Certificate
                    </button>
                  )}
                </div>
              </div>
              {/* Header */}
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-950 leading-tight">
                  {lesson.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={toggleLessonComplete}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all duration-300 border cursor-pointer ${
                      lesson.completed
                        ? "bg-emerald-50 text-emerald-650 border-emerald-200"
                        : "bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200"
                    }`}
                  >
                    {lesson.completed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4 text-zinc-300" />
                        <span>Mark as Complete</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setFlashcardsOpen(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 transition-all duration-300 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-4 h-4 text-violet-650" />
                    <span>Practice Flashcards</span>
                  </button>

                  {ttsSpeaking ? (
                    <div className="flex items-center space-x-2 bg-white border border-zinc-200 rounded-xl px-2 py-1 shadow-xs">
                      {ttsPaused ? (
                        <button
                          type="button"
                          onClick={resumeTTS}
                          className="p-1 rounded text-zinc-500 hover:text-emerald-500 transition-colors cursor-pointer"
                          title="Play Narration"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={pauseTTS}
                          className="p-1 rounded text-zinc-500 hover:text-amber-500 transition-colors cursor-pointer"
                          title="Pause Narration"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={stopTTS}
                        className="p-1 rounded text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
                        title="Stop Narration"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] text-zinc-500 pr-2 border-l border-zinc-200 pl-2 font-bold animate-pulse">Reading...</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startTTS}
                      className="px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 transition-all duration-300 cursor-pointer shadow-xs"
                    >
                      <Volume2 className="w-4 h-4 text-emerald-500" />
                      <span>Listen to Lesson</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs Bar */}
              <div className="flex border-b border-black/5 pb-px">
                <button
                  onClick={() => setViewMode("lesson")}
                  className={`pb-4 px-4 font-black text-xs border-b-2 transition-all cursor-pointer ${
                    viewMode === "lesson"
                      ? "border-violet-600 text-zinc-950"
                      : "border-transparent text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  📖 Lesson Explanation
                </button>
                <button
                  onClick={() => setViewMode("mindmap")}
                  className={`pb-4 px-4 font-black text-xs border-b-2 transition-all cursor-pointer ${
                    viewMode === "mindmap"
                      ? "border-violet-600 text-zinc-950"
                      : "border-transparent text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  🌿 Visual Concept Map
                </button>
              </div>

              {viewMode === "lesson" ? (
                <>
                  {/* Main Markdown Explanation */}
                  <article className="prose prose-zinc max-w-none text-zinc-800 leading-relaxed space-y-6 font-semibold">
                    <ReactMarkdown
                      components={{
                        h2: ({ ...props }) => <h2 className="text-xl font-black text-zinc-900 mt-8 mb-4 border-b border-black/5 pb-2" {...props} />,
                        p: ({ ...props }) => <p className="mb-4 text-zinc-700 leading-relaxed font-bold opacity-90" {...props} />,
                        li: ({ ...props }) => <li className="list-disc pl-2 ml-4 text-zinc-700 font-bold" {...props} />,
                        strong: ({ ...props }) => <strong className="text-zinc-950 font-black" {...props} />,
                        code: ({ ...props }) => <code className="bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded text-violet-600 text-sm font-mono" {...props} />
                      }}
                    >
                      {lesson.content_md}
                    </ReactMarkdown>
                  </article>

                  {/* Grid of Summarized Elements */}
                  <div className="grid grid-cols-1 gap-6 pt-6">
                    {/* Key Takeaways */}
                    {lesson.key_takeaways && lesson.key_takeaways.length > 0 && (
                      <div className="p-6 rounded-[24px] bg-violet-50/50 border border-violet-200/60 space-y-3 relative overflow-hidden shadow-xs">
                        <h3 className="font-extrabold text-sm uppercase tracking-wider text-violet-950 flex items-center space-x-2 relative z-10">
                          <Sparkles className="w-4 h-4 text-violet-600" />
                          <span>Key Takeaways</span>
                        </h3>
                        <ul className="space-y-2 relative z-10">
                          {lesson.key_takeaways.map((item, idx) => (
                            <li key={idx} className="text-xs text-violet-950/85 font-extrabold flex items-start space-x-2">
                              <span className="text-violet-600 font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Important Notes */}
                    {lesson.notes && lesson.notes.length > 0 && (
                      <div className="p-6 rounded-[24px] bg-orange-50/50 border border-orange-200/60 space-y-3 relative overflow-hidden shadow-xs">
                        <h3 className="font-extrabold text-sm uppercase tracking-wider text-orange-950 flex items-center space-x-2 relative z-10">
                          <AlertCircle className="w-4 h-4 text-orange-655" />
                          <span>Important Notes</span>
                        </h3>
                        <ul className="space-y-2 relative z-10">
                          {lesson.notes.map((item, idx) => (
                            <li key={idx} className="text-xs text-orange-955/85 font-extrabold flex items-start space-x-2">
                              <span className="text-orange-600 font-bold">!</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Real-World Examples */}
                    {lesson.examples && lesson.examples.length > 0 && (
                      <div className="p-6 rounded-[24px] bg-emerald-50/50 border border-emerald-200/60 space-y-3 relative overflow-hidden shadow-xs">
                        <h3 className="font-extrabold text-sm uppercase tracking-wider text-emerald-950 flex items-center space-x-2 relative z-10">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          <span>Real-World Application</span>
                        </h3>
                        <ul className="space-y-2 relative z-10">
                          {lesson.examples.map((item, idx) => (
                            <li key={idx} className="text-xs text-emerald-955/85 font-extrabold leading-relaxed">
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
              <p className="text-zinc-600 text-sm font-bold">Select a lesson from the sidebar to begin reading.</p>
            </div>
          )}
        </section>

        {/* AI Learning Companion Chatbot Drawer */}
        <aside className={`glass-light border-l border-black/5 w-96 shrink-0 flex flex-col transition-all duration-300 absolute inset-y-0 right-0 z-35 lg:relative ${
          chatOpen ? "translate-x-0" : "translate-x-full lg:w-0 lg:border-l-0 overflow-hidden"
        }`}>
          {/* Chat Header */}
          <div className="p-4 border-b border-black/5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-violet-600" />
              <h2 className="font-black text-sm text-zinc-900">AI Companion</h2>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="p-1 rounded bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-500 hover:text-zinc-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <Brain className="w-10 h-10 text-zinc-400" />
                <div className="space-y-1">
                  <p className="text-zinc-800 font-extrabold text-sm">Need help understanding?</p>
                  <p className="text-zinc-500 text-xs font-bold leading-relaxed">Ask concepts about the PDF, request summaries, or trigger custom commands below.</p>
                </div>
                
                {/* Suggestions Quick Buttons */}
                <div className="w-full space-y-2 pt-2">
                  <button
                    onClick={() => handleSendMessage("Explain the core logic of the current lesson.")}
                    className="w-full text-left px-3.5 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-violet-500/35 rounded-xl text-xs text-zinc-700 hover:text-zinc-900 transition-all cursor-pointer font-bold shadow-xs"
                  >
                    💡 Explain current lesson
                  </button>
                  <button
                    onClick={() => handleSendMessage("Provide a concise summary of the PDF text.")}
                    className="w-full text-left px-3.5 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-violet-500/35 rounded-xl text-xs text-zinc-700 hover:text-zinc-900 transition-all cursor-pointer font-bold shadow-xs"
                  >
                    📖 Summarize book context
                  </button>
                  <button
                    onClick={() => handleSendMessage("Suggest the next logical lesson to study.")}
                    className="w-full text-left px-3.5 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-violet-500/35 rounded-xl text-xs text-zinc-700 hover:text-zinc-900 transition-all cursor-pointer font-bold shadow-xs"
                  >
                    ⏭ What should I learn next?
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col max-w-[85%] rounded-2xl p-3.5 text-xs font-bold ${
                  msg.role === "user"
                    ? "bg-zinc-950 text-white ml-auto rounded-tr-none shadow-sm"
                    : "bg-white border border-black/5 text-zinc-800 mr-auto rounded-tl-none leading-relaxed shadow-xs"
                }`}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown
                    components={{
                      p: ({ ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
                      li: ({ ...props }) => <li className="list-disc ml-4 text-zinc-700 font-bold" {...props} />
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
          <div className="p-4 border-t border-black/5 bg-white/20">
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
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all placeholder:text-zinc-400 font-bold"
              />
              <button
                type="submit"
                disabled={chatLoading || !inputMsg.trim()}
                className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white disabled:opacity-50 cursor-pointer shadow-sm"
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
            className="absolute right-4 bottom-4 z-40 p-3 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white shadow-2xl transition-all cursor-pointer hover:scale-105"
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
