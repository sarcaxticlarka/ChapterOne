"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Upload, FileText, AlertCircle, Sparkles, Loader2, CheckCircle2, CloudUpload } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Phase = "idle" | "uploading" | "processing" | "generating" | "success";

const PHASES: Phase[] = ["uploading", "processing", "generating", "success"];

const PHASE_META: Record<string, { label: string; msg: string }> = {
  uploading:   { label: "Uploading Document",  msg: "Transferring your PDF to the server…" },
  processing:  { label: "Processing PDF",      msg: "Extracting text and building semantic embeddings…" },
  generating:  { label: "Generating Course",   msg: "AI is structuring chapters, lessons and quizzes…" },
  success:     { label: "Course Ready!",       msg: "Redirecting to your new interactive course…" },
};

export default function UploadPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const pickFile = (f: File) => {
    setError("");
    if (f.type !== "application/pdf") {
      setError("Only PDF files are supported. Please select a valid PDF.");
      return;
    }
    setFile(f);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) pickFile(e.target.files[0]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) pickFile(e.dataTransfer.files[0]);
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !token) return;
    setError("");

    try {
      setPhase("uploading");
      const fd = new FormData();
      fd.append("file", file);
      const upRes = await fetch(`${API_URL}/api/documents/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!upRes.ok) throw new Error((await upRes.json()).detail || "Upload failed.");
      const { id: docId } = await upRes.json();

      setPhase("processing");
      let ready = false;
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const st = await fetch(`${API_URL}/api/documents/${docId}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!st.ok) throw new Error("Failed to check processing status.");
        const { status } = await st.json();
        if (status === "completed") { ready = true; break; }
        if (status === "failed") throw new Error("PDF processing failed. Please check the file.");
      }
      if (!ready) throw new Error("Processing timed out. Try a smaller document.");

      setPhase("generating");
      const genRes = await fetch(`${API_URL}/api/courses/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ document_id: docId }),
      });
      if (!genRes.ok) throw new Error((await genRes.json()).detail || "Course generation failed.");
      const { id: courseId } = await genRes.json();

      setPhase("success");
      setTimeout(() => router.push(`/courses/${courseId}`), 2000);
    } catch (err: any) {
      setPhase("idle");
      setError(err.message || "An unexpected error occurred.");
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-t-[#5b73ff] border-[#1e2a45] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#5b73ff]/6 blur-[120px]" />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center content-max py-12">
        <div
          className="w-full max-w-xl surface-raised p-8 md:p-10 text-center"
          style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 40px rgba(91,115,255,0.06)" }}
        >

          {phase === "idle" ? (
            <div className="space-y-7">
              {/* Icon */}
              <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center" style={{ background: "var(--color-accent-dim)", border: "1px solid rgba(91,115,255,0.2)" }}>
                <CloudUpload className="w-7 h-7" style={{ color: "var(--color-accent)" }} />
              </div>

              <div className="space-y-2">
                <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--color-text-primary)" }}>
                  Convert PDF to Course
                </h1>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", maxWidth: 360, margin: "0 auto" }}>
                  Upload any study guide, textbook, or paper and get a full interactive course with lessons, quizzes, and flashcards.
                </p>
              </div>

              {error && (
                <div className="alert-error text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleUpload} className="space-y-5">
                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className="relative rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
                  style={{
                    border: `2px dashed ${dragOver ? "var(--color-accent)" : "var(--color-border)"}`,
                    background: dragOver ? "var(--color-accent-dim)" : "rgba(255,255,255,0.02)",
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={onInputChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <FileText className="w-10 h-10 mb-3" style={{ color: file ? "var(--color-accent)" : "var(--color-text-muted)" }} />
                  {file ? (
                    <div className="space-y-0.5">
                      <p style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "var(--text-sm)" }}>{file.name}</p>
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB · PDF
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <p style={{ fontWeight: 600, color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                        Drop your PDF here, or <span style={{ color: "var(--color-accent)" }}>browse</span>
                      </p>
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>PDF files up to 25 MB</p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!file}
                  className="btn-primary w-full py-3.5 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Build Interactive Course</span>
                </button>
              </form>
            </div>
          ) : (
            /* Progress state */
            <div className="py-8 space-y-8 flex flex-col items-center">
              {/* Animated icon */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: phase === "success" ? "rgba(16,185,129,0.12)" : "var(--color-accent-dim)",
                  border: `1px solid ${phase === "success" ? "rgba(16,185,129,0.3)" : "rgba(91,115,255,0.25)"}`,
                }}
              >
                {phase === "success" ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                ) : (
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--color-accent)" }} />
                )}
              </div>

              <div className="space-y-2">
                <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--color-text-primary)" }}>
                  {PHASE_META[phase].label}
                </h3>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  {PHASE_META[phase].msg}
                </p>
              </div>

              {/* Step segments */}
              <div className="flex items-center gap-2 w-full max-w-xs">
                {PHASES.map((p) => {
                  const idx = PHASES.indexOf(p);
                  const cur = PHASES.indexOf(phase);
                  const done = idx < cur;
                  const active = idx === cur;
                  const future = idx > cur;
                  return (
                    <div
                      key={p}
                      className="h-1.5 flex-1 rounded-full transition-all duration-500"
                      style={{
                        background: done
                          ? "rgba(91,115,255,0.5)"
                          : active
                          ? (p === "success" ? "var(--color-success)" : "var(--color-accent)")
                          : future
                          ? "var(--color-border)"
                          : "var(--color-border)",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
