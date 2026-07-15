"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Upload, FileText, AlertCircle, Sparkles, Loader2, CheckCircle2 } from "lucide-react";

const API_URL = "http://localhost:8000";

export default function UploadPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [phase, setPhase] = useState<"idle" | "uploading" | "processing" | "generating" | "success">("idle");
  const [progressMsg, setProgressMsg] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg("");
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setErrorMsg("Please select a valid PDF document.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !token) return;

    setErrorMsg("");
    setPhase("uploading");
    setProgressMsg("Uploading PDF to server...");

    try {
      // 1. Upload File
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(`${API_URL}/api/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.detail || "File upload failed.");
      }

      const docData = await uploadResponse.json();
      const docId = docData.id;

      // 2. Poll Document processing status
      setPhase("processing");
      setProgressMsg("Extracting text and computing semantic vector embeddings...");
      
      let attempts = 0;
      let docReady = false;
      
      while (attempts < 60) { // Timeout after 5 minutes (60 * 5s)
        await new Promise((resolve) => setTimeout(resolve, 5000));
        
        const statusResponse = await fetch(`${API_URL}/api/documents/${docId}/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!statusResponse.ok) {
          throw new Error("Failed to fetch document processing status.");
        }
        
        const statusData = await statusResponse.json();
        if (statusData.status === "completed") {
          docReady = true;
          break;
        } else if (statusData.status === "failed") {
          throw new Error("PDF processing failed. Please verify the document is not corrupted.");
        }
        
        attempts++;
      }

      if (!docReady) {
        throw new Error("PDF processing timed out. Please try a smaller file.");
      }

      // 3. Trigger Course Generation
      setPhase("generating");
      setProgressMsg("AI is analyzing structure and creating your interactive course outline...");

      const generateResponse = await fetch(`${API_URL}/api/courses/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ document_id: docId }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.detail || "AI course generation failed.");
      }

      const courseData = await generateResponse.json();
      setPhase("success");
      setProgressMsg("Success! Directing to your new interactive e-course...");
      
      // Delay slightly for UX
      setTimeout(() => {
        router.push(`/courses/${courseData.id}`);
      }, 2000);

    } catch (err: any) {
      setPhase("idle");
      setErrorMsg(err.message || "An error occurred during course building.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-t-violet-500 border-zinc-800 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[10%] left-[10%] w-[350px] h-[350px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      <Navbar />

      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl glass-panel p-8 md:p-10 rounded-3xl border border-zinc-800/40 text-center">
          
          {phase === "idle" ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="inline-flex w-12 h-12 rounded-2xl bg-violet-950/40 border border-violet-850/30 items-center justify-center text-violet-400 mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">Convert PDF to Course</h1>
                <p className="text-zinc-400 text-sm max-w-md mx-auto">
                  Drag and drop your study guide or document to start creating a structured interactive curriculum.
                </p>
              </div>

              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 text-red-400 text-sm flex items-start space-x-3 text-left">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpload} className="space-y-6">
                <div className="border-2 border-dashed border-zinc-800 hover:border-violet-500/50 rounded-2xl p-8 transition-colors bg-zinc-900/30 relative flex flex-col items-center justify-center cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <FileText className="w-12 h-12 text-zinc-600 mb-4" />
                  
                  {file ? (
                    <div className="space-y-1">
                      <p className="font-bold text-zinc-200">{file.name}</p>
                      <p className="text-zinc-500 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF Document</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-bold text-zinc-300">Click to browse or drag PDF here</p>
                      <p className="text-zinc-500 text-xs">Supports PDF files up to 25MB</p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!file}
                  className="w-full py-4 rounded-xl font-bold text-white gradient-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Build Interactive Course</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="py-10 space-y-8 flex flex-col items-center justify-center">
              <div className="relative">
                {phase === "success" ? (
                  <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-900/50 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-8 h-8 animate-bounce" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-violet-950/40 border border-violet-900/30 flex items-center justify-center text-violet-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-bold tracking-tight">
                  {phase === "uploading" && "Uploading Document"}
                  {phase === "processing" && "Processing PDF"}
                  {phase === "generating" && "Generating Course"}
                  {phase === "success" && "Course Ready!"}
                </h3>
                <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed animate-pulse">
                  {progressMsg}
                </p>
              </div>

              {/* Step indicator */}
              <div className="flex items-center space-x-3 w-full max-w-sm pt-4">
                <div className={`h-1.5 flex-1 rounded-full ${
                  phase === "uploading" ? "bg-violet-500" : "bg-violet-900/50"
                }`}></div>
                <div className={`h-1.5 flex-1 rounded-full ${
                  phase === "processing" ? "bg-violet-500" : phase === "uploading" ? "bg-zinc-800" : "bg-violet-900/50"
                }`}></div>
                <div className={`h-1.5 flex-1 rounded-full ${
                  phase === "generating" ? "bg-violet-500" : phase === "success" ? "bg-violet-900/50" : "bg-zinc-800"
                }`}></div>
                <div className={`h-1.5 flex-1 rounded-full ${
                  phase === "success" ? "bg-emerald-500" : "bg-zinc-800"
                }`}></div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
