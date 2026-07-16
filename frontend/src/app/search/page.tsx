"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import {
  Search as SearchIcon, BookOpen, AlertCircle,
  Sparkles, ChevronRight, Loader2,
} from "lucide-react";

interface CourseOption { id: string; title: string; }
interface SearchResult {
  type: "keyword" | "semantic";
  lesson_id?: string;
  title?: string;
  snippet: string;
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
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (token) fetchCourses();
  }, [token]);

  const fetchCourses = async () => {
    setFetchingCourses(true);
    try {
      const res = await fetch(`${API_URL}/api/courses`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data: CourseOption[] = await res.json();
        setCourses(data);
        if (data.length > 0) setSelectedCourseId(data[0].id);
      }
    } catch { /* silent */ } finally { setFetchingCourses(false); }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !query.trim() || !token) return;
    setErrorMsg("");
    setSearching(true);
    setSearched(true);
    try {
      const res = await fetch(
        `${API_URL}/api/search?q=${encodeURIComponent(query)}&course_id=${selectedCourseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) setResults(await res.json());
      else setErrorMsg("Search failed. Please try again.");
    } catch {
      setErrorMsg("Error connecting to search service.");
    } finally {
      setSearching(false);
    }
  };

  if (loading || fetchingCourses) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="flex-1 content-max py-10 space-y-6" style={{ maxWidth: 800 }}>
          <div className="space-y-2">
            <div className="skeleton h-8 w-56 rounded-xl" />
            <div className="skeleton h-4 w-80 rounded-lg" />
          </div>
          <div className="skeleton h-20 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute top-1/4 left-0 w-[400px] h-[400px] rounded-full bg-[#5b73ff]/5 blur-[120px]" />
      </div>

      <main className="relative z-10 flex-1 content-max py-10 space-y-8" style={{ maxWidth: 800 }}>

        {/* Page heading */}
        <div className="space-y-1">
          <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--color-text-primary)" }}>
            Search Course Content
          </h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Full-text keyword search or pgvector semantic search across your courses.
          </p>
        </div>

        {errorMsg && (
          <div className="alert-error">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {courses.length === 0 ? (
          <div className="surface-raised text-center py-16 px-8 space-y-4">
            <BookOpen className="w-10 h-10 mx-auto" style={{ color: "var(--color-text-muted)" }} />
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
              You need to generate a course first before searching.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search form */}
            <form
              onSubmit={handleSearch}
              className="surface p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
              style={{ borderRadius: "var(--radius-2xl)" }}
            >
              <div className="space-y-1.5">
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-muted)" }}>
                  Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="input-field"
                  style={{ appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%238b9ab8' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: "#111827" }}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-muted)" }}>
                  Query
                </label>
                <input
                  type="text"
                  placeholder="e.g. 'machine learning' or 'explain recursion'…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={searching || !query.trim()}
                className="btn-primary w-full disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                style={{ height: 44, borderRadius: "var(--radius-md)" }}
              >
                {searching ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Searching…</span></>
                ) : (
                  <><SearchIcon className="w-4 h-4" /><span>Search</span></>
                )}
              </button>
            </form>

            {/* Results */}
            {searched && (
              <div className="space-y-4">
                <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-secondary)" }}>
                  {results.length} result{results.length !== 1 ? "s" : ""}
                </p>

                {results.length === 0 ? (
                  <div
                    className="surface text-center py-10"
                    style={{ borderRadius: "var(--radius-xl)" }}
                  >
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                      No matches for "{query}". Try different keywords.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.map((res, i) => {
                      const semantic = res.type === "semantic";
                      return (
                        <div
                          key={i}
                          className={`${semantic ? "card-3d-purple" : "card-3d-gray"} p-5 rounded-[20px] border relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl`}
                        >
                          {semantic && (
                            <div className="w-14 h-14 bubble-3d bubble-3d-purple absolute right-[-8px] top-[-8px] opacity-20" />
                          )}
                          <div className="relative z-10 space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <span className={`badge ${semantic ? "badge-accent" : ""}`} style={!semantic ? { background: "rgba(0,0,0,0.06)", color: "#52525b", border: "1px solid rgba(0,0,0,0.1)" } : {}}>
                                {semantic ? (
                                  <><Sparkles className="w-2.5 h-2.5" /><span>Semantic</span></>
                                ) : (
                                  "Keyword"
                                )}
                              </span>
                              {!semantic && res.lesson_id && (
                                <button
                                  onClick={() => router.push(`/courses/${selectedCourseId}/lessons/${res.lesson_id}`)}
                                  className="flex items-center gap-1 text-xs font-bold hover:underline cursor-pointer"
                                  style={{ color: "#18181b" }}
                                >
                                  <span>Read Lesson</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            {res.title && (
                              <p className="font-extrabold text-sm">{res.title}</p>
                            )}
                            <p className={`text-xs leading-relaxed font-medium ${semantic ? "text-violet-900/60" : "text-zinc-600"}`}>
                              {res.snippet}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
