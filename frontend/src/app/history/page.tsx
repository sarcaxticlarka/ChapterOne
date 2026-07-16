"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Clock, Upload, CheckCircle2, Award, Calendar, AlertCircle, ArrowLeft } from "lucide-react";

interface HistoryEvent {
  type: "upload" | "completion" | "quiz";
  title: string;
  timestamp: string;
  metadata: Record<string, any>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TYPE_CONFIG = {
  upload: {
    Icon: Upload,
    dotStyle: { background: "rgba(91,115,255,0.15)", border: "1px solid rgba(91,115,255,0.3)", color: "#7c8fff" },
    card: "card-3d-purple",
    muted: "text-violet-900/60",
  },
  completion: {
    Icon: CheckCircle2,
    dotStyle: { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399" },
    card: "card-3d-green",
    muted: "text-emerald-900/60",
  },
  quiz: {
    Icon: Award,
    dotStyle: { background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#fbbf24" },
    card: "card-3d-peach",
    muted: "text-orange-900/60",
  },
};

export default function HistoryPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (token) fetchHistory();
  }, [token]);

  const fetchHistory = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_URL}/api/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setEvents(await res.json());
      else setErrorMsg("Failed to load history.");
    } catch {
      setErrorMsg("Error connecting to server.");
    } finally {
      setFetching(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="flex-1 content-max py-10 space-y-8">
          <div className="flex items-center gap-3 pb-6" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <div className="skeleton w-9 h-9 rounded-xl" />
            <div className="space-y-2">
              <div className="skeleton h-7 w-44 rounded-xl" />
              <div className="skeleton h-4 w-64 rounded-lg" />
            </div>
          </div>
          <div className="relative ml-4 space-y-6" style={{ borderLeft: "1px solid var(--color-border)" }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="pl-8">
                <div className="skeleton absolute left-[-17px] top-1.5 w-8 h-8 rounded-full" />
                <div className="skeleton h-20 rounded-2xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#5b73ff]/4 blur-[120px]" />
      </div>

      <main className="relative z-10 flex-1 content-max py-10 space-y-8" style={{ maxWidth: 760 }}>

        {/* Header */}
        <div className="flex items-center gap-3 pb-6" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <button
            onClick={() => router.push("/dashboard")}
            aria-label="Back to dashboard"
            className="btn-ghost p-2"
            style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--color-text-primary)" }}>
              Learning History
            </h1>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginTop: 2 }}>
              Chronological log of uploads, completions, and quiz attempts.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="alert-error">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {events.length === 0 ? (
          <div className="surface-raised text-center py-16 px-8 space-y-4">
            <Clock className="w-10 h-10 mx-auto" style={{ color: "var(--color-text-muted)" }} />
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-secondary)" }}>
              Timeline Empty
            </h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              Upload a PDF or take a quiz to see activity here.
            </p>
          </div>
        ) : (
          <div
            className="relative ml-4 space-y-6 py-2"
            style={{ borderLeft: "1px solid var(--color-border)" }}
          >
            {events.map((ev, i) => {
              const cfg = TYPE_CONFIG[ev.type] ?? TYPE_CONFIG.upload;
              const { Icon, dotStyle, card, muted } = cfg;
              return (
                <div key={i} className="relative pl-8 group">
                  {/* Timeline dot */}
                  <div
                    className="absolute left-[-17px] top-3 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                    style={dotStyle}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div
                    className={`${card} p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                      <h3 className="font-extrabold text-sm leading-tight">{ev.title}</h3>
                      <span className={`text-[10px] font-semibold ${muted} flex items-center gap-1 shrink-0`}>
                        <Calendar className="w-3 h-3" />
                        {new Date(ev.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {ev.type === "quiz" && ev.metadata.score !== undefined && (
                      <p className={`text-xs font-semibold mt-1.5 ${muted}`}>
                        Score: <span className="font-black text-current">{ev.metadata.score}%</span>
                      </p>
                    )}
                    {ev.type === "upload" && ev.metadata.status && (
                      <p className={`text-[10px] font-bold uppercase tracking-wide mt-1.5 ${muted}`}>
                        Status: {ev.metadata.status}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
