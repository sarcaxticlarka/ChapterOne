"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import {
  BookOpen, Upload, Flame, Clock, Award,
  ChevronRight, BookOpenCheck, TrendingUp
} from "lucide-react";

interface CourseSummary {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  completion_percentage: number;
  created_at: string;
}

interface DashboardData {
  enrolled_courses: CourseSummary[];
  total_time_spent_seconds: number;
  average_quiz_score: number;
  current_streak: number;
  longest_streak: number;
}

const API_URL = "http://localhost:8000";

const CARD_THEMES = [
  { 
    cardClass: "glass-light-card", 
    gradient: "from-pink-500/10 to-orange-500/10", 
    textGradient: "from-pink-600 to-orange-600",
    barColor: "bg-gradient-to-r from-pink-500 to-orange-400"
  },
  { 
    cardClass: "glass-light-card", 
    gradient: "from-purple-500/10 to-indigo-500/10", 
    textGradient: "from-purple-600 to-indigo-600",
    barColor: "bg-gradient-to-r from-purple-500 to-indigo-400"
  },
  { 
    cardClass: "glass-light-card", 
    gradient: "from-emerald-500/10 to-teal-500/10", 
    textGradient: "from-emerald-600 to-teal-600",
    barColor: "bg-gradient-to-r from-emerald-500 to-teal-400"
  },
  { 
    cardClass: "glass-light-card", 
    gradient: "from-blue-500/10 to-sky-500/10", 
    textGradient: "from-blue-600 to-sky-600",
    barColor: "bg-gradient-to-r from-blue-500 to-sky-400"
  },
];

export default function Dashboard() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (token) fetchDashboard();
  }, [token]);

  const fetchDashboard = async () => {
    setFetching(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
      else setError("Failed to load dashboard.");
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setFetching(false);
    }
  };

  const fmt = (s: number) => {
    if (!s) return "0 min";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60), r = m % 60;
    return r ? `${h}h ${r}m` : `${h}h`;
  };

  const stats = [
    {
      icon: BookOpenCheck,
      label: "Courses Generated",
      value: String(data?.enrolled_courses.length ?? 0),
      iconColor: "text-violet-600",
      bgColor: "bg-violet-50 border-violet-100",
    },
    {
      icon: Flame,
      label: "Learning Streak",
      value: `${data?.current_streak ?? 0} days`,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50 border-orange-100",
    },
    {
      icon: Clock,
      label: "Study Time",
      value: fmt(data?.total_time_spent_seconds ?? 0),
      iconColor: "text-sky-600",
      bgColor: "bg-sky-50 border-sky-100",
    },
    {
      icon: Award,
      label: "Avg Quiz Score",
      value: data?.average_quiz_score ? `${data.average_quiz_score}%` : "—",
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50 border-emerald-100",
    },
  ];

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
        <path d="M50 15 L80 32 L50 50 L20 32 Z" fill="url(#cubeGradTop)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.75" />
        <path d="M50 50 L80 32 L80 68 L50 85 Z" fill="url(#cubeGradSide1)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.75" />
        <path d="M20 32 L50 50 L50 85 L20 68 Z" fill="url(#cubeGradSide2)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.75" />
      </svg>
    </div>
  );

  if (loading || (fetching && !data)) {
    return (
      <div className="page-wrapper bg-dreamy-clouds min-h-screen">
        <Navbar />
        <div className="flex-1 content-max py-10 space-y-8 relative z-10">
          {/* Skeleton greeting */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 w-56 bg-zinc-200/50 animate-pulse rounded-xl" />
              <div className="h-4 w-80 bg-zinc-200/40 animate-pulse rounded-lg" />
            </div>
            <div className="h-11 w-44 bg-zinc-200/50 animate-pulse rounded-full" />
          </div>
          {/* Skeleton stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-light p-5 rounded-2xl flex items-center gap-4 border border-white/60">
                <div className="w-11 h-11 bg-zinc-200/50 animate-pulse rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-24 bg-zinc-200/40 animate-pulse rounded" />
                  <div className="h-6 w-16 bg-zinc-200/50 animate-pulse rounded-lg" />
                </div>
              </div>
            ))}
          </div>
          {/* Skeleton cards */}
          <div className="space-y-4">
            <div className="h-7 w-48 bg-zinc-200/50 animate-pulse rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-72 bg-zinc-200/40 animate-pulse rounded-[32px]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper bg-dreamy-clouds min-h-screen relative overflow-x-hidden">
      <Navbar />

      {/* ── BACKGROUND FLOATING CUBES ── */}
      <FloatingCube className="absolute top-[18%] left-[4%] animate-float" size={85} />
      <FloatingCube className="absolute bottom-[20%] right-[5%] animate-float-delayed" size={100} delay="1s" />
      <FloatingCube className="absolute top-[60%] left-[2%] animate-float-delayed" size={70} delay="2s" />

      <main className="relative z-10 flex-1 content-max py-10 space-y-10">

        {/* ── Greeting row ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-zinc-900">
              Hello,{" "}
              <span className="text-gradient-primary">
                {user?.name}
              </span>{" "}👋
            </h1>
            <p className="text-zinc-500 text-xs font-semibold">
              Track your progress, resume courses, and keep your streak alive.
            </p>
          </div>
          <Link href="/upload" className="inline-flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs py-3 px-6 rounded-full transition-all shadow-md shadow-black/10 hover:-translate-y-0.5 self-start md:self-auto">
            <Upload className="w-4 h-4" />
            <span>Generate New Course</span>
          </Link>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ icon: Icon, label, value, iconColor, bgColor }) => (
            <div key={label} className="glass-light border border-white/60 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${bgColor}`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div>
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                  {label}
                </p>
                <p className="text-zinc-900 text-lg font-black mt-0.5">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Courses ── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">
              Active Learning Paths
            </h2>
            {(data?.enrolled_courses.length ?? 0) > 0 && (
              <Link href="/upload" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/5 hover:bg-white/40 text-zinc-600 hover:text-zinc-900 text-xs font-bold transition-all shadow-xs">
                <TrendingUp className="w-3.5 h-3.5 text-violet-600" />
                <span>Add Course</span>
              </Link>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-650 text-xs font-medium">
              <span>{error}</span>
            </div>
          )}

          {data?.enrolled_courses.length === 0 ? (
            /* Zero state */
            <div className="glass-light border border-white/65 text-center py-16 px-8 max-w-lg mx-auto space-y-6 rounded-[32px] shadow-sm">
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-violet-50 border border-violet-100 shadow-xs">
                <BookOpen className="w-7 h-7 text-violet-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-zinc-900">
                  No courses yet
                </h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed font-semibold">
                  Upload a PDF — study guide, textbook, or paper — and turn it into a full interactive course.
                </p>
              </div>
              <Link href="/upload" className="inline-flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs py-3 px-6 rounded-full transition-all shadow-md shadow-black/10 hover:-translate-y-0.5">
                <Upload className="w-4 h-4" />
                <span>Upload First PDF</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data?.enrolled_courses.map((course, idx) => {
                const theme = CARD_THEMES[idx % CARD_THEMES.length];
                return (
                  <div
                    key={course.id}
                    className={`glass-light-card p-7 rounded-[32px] flex flex-col justify-between h-[300px] relative group overflow-hidden`}
                  >
                    {/* Subtle gradient blobbing on top-right */}
                    <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl ${theme.gradient} blur-2xl rounded-full opacity-60 group-hover:scale-110 transition-transform duration-500`} />

                    <div className="space-y-3.5 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-zinc-900/5 border border-black/5 text-zinc-600">
                          {course.difficulty}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400">
                          {new Date(course.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="max-w-[76%]">
                        <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight leading-tight line-clamp-2 hover:underline">
                          <Link href={`/courses/${course.id}`}>
                            {course.title}
                          </Link>
                        </h3>
                        <p className="text-xs text-zinc-600 leading-relaxed mt-1.5 line-clamp-2 font-medium">
                          {course.description || "No description."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-black/5 space-y-4.5 relative z-10">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          <span>Completion</span>
                          <span className="text-zinc-800">{course.completion_percentage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-200/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${theme.barColor}`}
                            style={{ width: `${course.completion_percentage}%` }}
                          />
                        </div>
                      </div>
                      <Link
                        href={`/courses/${course.id}`}
                        className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest text-zinc-900 hover:translate-x-1 transition-all"
                      >
                        <span>Resume Study</span>
                        <ChevronRight className="w-4 h-4 text-violet-650" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
