"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { BookOpen, Upload, Flame, Clock, Award, Sparkles, ChevronRight, BookOpenCheck } from "lucide-react";

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

export default function Dashboard() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    setFetching(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const resData = await response.json();
        setData(resData);
      } else {
        setError("Failed to load dashboard data. Please try again later.");
      }
    } catch (err) {
      setError("Unable to connect to the backend server.");
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds === 0) return "0 mins";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const remMins = minutes % 60;
    return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
  };

  if (loading || (fetching && !data)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-t-violet-500 border-zinc-800 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-violet-500/30">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-10">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Hello, <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">{user?.name}</span>
            </h1>
            <p className="text-zinc-400 text-sm">
              Track your course completion, practice quizzes, and resume study sessions.
            </p>
          </div>
          
          <Link
            href="/upload"
            className="gradient-button px-6 py-3.5 rounded-xl font-bold flex items-center justify-center space-x-2 text-white shadow-lg cursor-pointer self-start md:self-auto"
          >
            <Upload className="w-5 h-5" />
            <span>Generate New Course</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Enrolled Courses */}
          <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4 border border-zinc-800/40">
            <div className="w-12 h-12 rounded-xl bg-violet-950/40 flex items-center justify-center text-violet-400 border border-violet-850/30">
              <BookOpenCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Generated Courses</p>
              <h3 className="text-2xl font-black text-zinc-100">{data?.enrolled_courses.length || 0}</h3>
            </div>
          </div>

          {/* Card 2: Streak */}
          <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4 border border-zinc-800/40">
            <div className="w-12 h-12 rounded-xl bg-amber-950/40 flex items-center justify-center text-amber-500 border border-amber-850/30">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Learning Streak</p>
              <h3 className="text-2xl font-black text-zinc-100">
                {data?.current_streak || 0} <span className="text-xs font-medium text-zinc-400">days (longest: {data?.longest_streak || 0})</span>
              </h3>
            </div>
          </div>

          {/* Card 3: Time Spent */}
          <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4 border border-zinc-800/40">
            <div className="w-12 h-12 rounded-xl bg-sky-950/40 flex items-center justify-center text-sky-400 border border-sky-850/30">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Study Time</p>
              <h3 className="text-2xl font-black text-zinc-100">{formatTime(data?.total_time_spent_seconds || 0)}</h3>
            </div>
          </div>

          {/* Card 4: Average Quiz Score */}
          <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4 border border-zinc-800/40">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/40 flex items-center justify-center text-emerald-400 border border-emerald-850/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Avg Quiz Score</p>
              <h3 className="text-2xl font-black text-zinc-100">
                {data?.average_quiz_score ? `${data.average_quiz_score}%` : "No scores yet"}
              </h3>
            </div>
          </div>
        </div>

        {/* Enrolled Courses Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">Active Learning Paths</h2>

          {error && (
            <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 text-red-400 text-sm">
              {error}
            </div>
          )}

          {data?.enrolled_courses.length === 0 ? (
            <div className="glass-panel p-10 md:p-16 rounded-3xl border border-zinc-800/40 text-center space-y-6 max-w-xl mx-auto">
              <div className="inline-flex w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 items-center justify-center text-zinc-400 mb-2">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">No Generated Courses Yet</h3>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
                  Get started by uploading a PDF document (study guide, paper, textbook, documentation) and convert it into a full interactive e-course.
                </p>
              </div>
              <Link
                href="/upload"
                className="gradient-button inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg cursor-pointer"
              >
                <span>Upload First PDF</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data?.enrolled_courses.map((course) => (
                <div
                  key={course.id}
                  className="glass-panel p-6 rounded-3xl border border-zinc-800/40 flex flex-col justify-between glass-panel-hover"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${
                        course.difficulty === "Advanced"
                          ? "bg-red-950/30 text-red-400 border-red-900/40"
                          : course.difficulty === "Intermediate"
                          ? "bg-amber-950/30 text-amber-400 border-amber-900/40"
                          : "bg-emerald-950/30 text-emerald-400 border-emerald-900/40"
                      }`}>
                        {course.difficulty}
                      </span>
                      <span className="text-zinc-500 text-xs font-medium">
                        Created {new Date(course.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-zinc-100 hover:text-violet-400 transition-colors duration-200">
                        <Link href={`/courses/${course.id}`}>{course.title}</Link>
                      </h3>
                      <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2">
                        {course.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-zinc-900 space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                        <span>Course Completion</span>
                        <span>{course.completion_percentage}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/40">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${course.completion_percentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <Link
                      href={`/courses/${course.id}`}
                      className="w-full py-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl font-bold flex items-center justify-center space-x-2 text-zinc-200 hover:text-white transition-all duration-200"
                    >
                      <span>Resume Study Session</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
