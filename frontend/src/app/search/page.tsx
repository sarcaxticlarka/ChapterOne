"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Search as SearchIcon, BookOpen, AlertCircle, Sparkles, ChevronRight, HelpCircle } from "lucide-react";

interface CourseOption {
  id: string;
  title: string;
}

interface SearchResult {
  type: "keyword" | "semantic";
  lesson_id?: string;
  title?: string;
  snippet: string;
  chunk_index?: number;
}

const API_URL = "http://localhost:8000";

export default function SearchPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  
  const [searching, setSearching] = useState(false);
  const [fetchingCourses, setFetchingCourses] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (token) {
      fetchCourses();
    }
  }, [token]);

  const fetchCourses = async () => {
    setFetchingCourses(true);
    try {
      const response = await fetch(`${API_URL}/api/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
        if (data.length > 0) {
          setSelectedCourseId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingCourses(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !query.trim() || !token) return;

    setErrorMsg("");
    setSearching(true);
    try {
      const response = await fetch(
        `${API_URL}/api/search?q=${encodeURIComponent(query)}&course_id=${selectedCourseId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        setErrorMsg("Failed to complete search query.");
      }
    } catch (err) {
      setErrorMsg("Error connecting to search service.");
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  if (loading || fetchingCourses) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-t-violet-500 border-zinc-800 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[20%] left-[-10%] w-[350px] h-[350px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight">Search Course Contents</h1>
          <p className="text-zinc-400 text-sm">
            Search keywords using Postgres Full-Text search, or search concepts using pgvector Semantic Search.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 text-red-400 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {courses.length === 0 ? (
          <div className="glass-panel p-10 rounded-3xl border border-zinc-800/40 text-center space-y-4">
            <BookOpen className="w-10 h-10 text-zinc-650 mx-auto" />
            <p className="text-zinc-400 text-sm">You must generate a course first to perform searches.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search Controls Form */}
            <form onSubmit={handleSearch} className="glass-panel p-6 rounded-3xl border border-zinc-800/40 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-1 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Select Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full p-3 bg-zinc-900 border border-zinc-850 rounded-xl text-zinc-100 text-sm focus:border-violet-500 focus:outline-none"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Keyword or Concept</label>
                <input
                  type="text"
                  placeholder="e.g. explain machine learning or search 'recursion'..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full p-3 bg-zinc-900 border border-zinc-850 rounded-xl text-zinc-100 text-sm focus:border-violet-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={searching || !query.trim()}
                className="md:col-span-1 py-3 px-6 rounded-xl gradient-button text-white font-bold flex items-center justify-center space-x-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <SearchIcon className="w-4 h-4" />
                    <span>Query DB</span>
                  </>
                )}
              </button>
            </form>

            {/* Results Output */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">Search Results ({results.length})</h2>

              {results.length === 0 && !searching && query && (
                <div className="p-8 text-center text-zinc-500 text-sm">
                  No matches found for your query. Try different keywords or concepts.
                </div>
              )}

              <div className="space-y-4">
                {results.map((res, index) => (
                  <div
                    key={index}
                    className={`glass-panel p-6 rounded-2xl border ${
                      res.type === "semantic"
                        ? "border-violet-950/40 bg-violet-950/5"
                        : "border-zinc-800/40"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          res.type === "semantic"
                            ? "bg-violet-950/40 text-violet-400 border-violet-900/40"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800"
                        }`}>
                          {res.type === "semantic" ? (
                            <span className="flex items-center space-x-1">
                              <Sparkles className="w-3 h-3 mr-1" />
                              <span>pgvector Semantic Chunk</span>
                            </span>
                          ) : (
                            "SQL Keyword Lesson Match"
                          )}
                        </span>
                        
                        {res.type === "keyword" && res.lesson_id && (
                          <button
                            onClick={() => router.push(`/courses/${selectedCourseId}/lessons/${res.lesson_id}`)}
                            className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center space-x-1"
                          >
                            <span>Read Lesson</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        {res.title && <h3 className="font-bold text-base text-zinc-150">{res.title}</h3>}
                        <p className="text-zinc-400 text-sm leading-relaxed">{res.snippet}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Simple loader helper
const Loader2 = ({ className }: { className?: string }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);
