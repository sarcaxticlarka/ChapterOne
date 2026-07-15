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

const API_URL = "http://localhost:8000";

export default function HistoryPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  const fetchHistory = async () => {
    setFetching(true);
    try {
      const response = await fetch(`${API_URL}/api/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        setErrorMsg("Failed to load learning history logs.");
      }
    } catch (err) {
      setErrorMsg("Error connecting to server.");
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-t-violet-500 border-zinc-800 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute bottom-[10%] right-[-10%] w-[350px] h-[350px] bg-indigo-650/5 rounded-full blur-[100px] pointer-events-none"></div>

      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10 space-y-8">
        
        {/* Header */}
        <div className="flex items-center space-x-3 border-b border-zinc-900 pb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Learning History</h1>
            <p className="text-zinc-400 text-sm mt-0.5">Timeline log of your uploads, completions, and quiz submissions.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 text-red-400 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {events.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-zinc-800/40 text-center space-y-4">
            <Clock className="w-10 h-10 text-zinc-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-zinc-300">Timeline Empty</h3>
              <p className="text-zinc-500 text-sm max-w-xs mx-auto">
                Upload your first study material or take a quiz to populate logs.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative border-l border-zinc-800 ml-4 space-y-8 py-2">
            {events.map((event, index) => {
              let Icon = Clock;
              let iconColor = "text-zinc-400 bg-zinc-900 border-zinc-850";
              
              if (event.type === "upload") {
                Icon = Upload;
                iconColor = "text-violet-400 bg-violet-950/30 border-violet-900/40";
              } else if (event.type === "completion") {
                Icon = CheckCircle2;
                iconColor = "text-emerald-400 bg-emerald-950/30 border-emerald-900/40";
              } else if (event.type === "quiz") {
                Icon = Award;
                iconColor = "text-amber-500 bg-amber-950/30 border-amber-900/40";
              }

              return (
                <div key={index} className="relative pl-8 group">
                  {/* Timeline bullet dot */}
                  <div className={`absolute left-[-17px] top-1.5 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="glass-panel p-5 rounded-2xl border border-zinc-800/45 space-y-2 group-hover:border-zinc-700/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3 className="font-bold text-zinc-150 text-base">{event.title}</h3>
                      <span className="text-zinc-500 text-xs font-semibold flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(event.timestamp).toLocaleString()}</span>
                      </span>
                    </div>

                    {event.type === "quiz" && event.metadata.score !== undefined && (
                      <p className="text-sm">
                        Graded Score:{" "}
                        <span className={`font-black ${
                          event.metadata.score >= 70 ? "text-emerald-400" : "text-amber-500"
                        }`}>
                          {event.metadata.score}%
                        </span>
                      </p>
                    )}

                    {event.type === "upload" && event.metadata.status && (
                      <p className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                        Parsing Status: {event.metadata.status}
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
