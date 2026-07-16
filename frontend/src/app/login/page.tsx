"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, BookOpen, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function LoginForm() {
  const { user, login, register, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isSignUp, setIsSignUp] = useState(false);
  const [googleClientId, setGoogleClientId] = useState("");

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/google/client-id`)
      .then((r) => r.json())
      .then((d) => { if (d.client_id) setGoogleClientId(d.client_id); })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (!googleClientId) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    script.onload = () => {
      const google = (window as any).google;
      google?.accounts.id.initialize({
        client_id: googleClientId,
        callback: (res: any) => loginWithGoogle(res.credential),
      });
      const container = document.getElementById("google-sso-button-container");
      if (container) {
        google?.accounts.id.renderButton(container, {
          theme: "outline",
          size: "large",
          width: 320,
          shape: "rectangular",
        });
      }
    };
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, [googleClientId]);

  useEffect(() => {
    setIsSignUp(searchParams.get("tab") === "signup");
  }, [searchParams]);

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setActionLoading(true);
    try {
      if (isSignUp) {
        if (!firstName || !lastName) throw new Error("First and last name are required.");
        await register(email, `${firstName} ${lastName}`.trim(), password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGoogleMock = async () => {
    setErrorMsg("");
    setActionLoading(true);
    try {
      await loginWithGoogle(`mock_google_user_${Math.floor(Math.random() * 1000)}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Google sign-in failed.");
    } finally {
      setActionLoading(false);
    }
  };

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
        {/* Top face */}
        <path d="M50 15 L80 32 L50 50 L20 32 Z" fill="url(#cubeGradTop)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.75" />
        {/* Right face */}
        <path d="M50 50 L80 32 L80 68 L50 85 Z" fill="url(#cubeGradSide1)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.75" />
        {/* Left face */}
        <path d="M20 32 L50 50 L50 85 L20 68 Z" fill="url(#cubeGradSide2)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.75" />
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen bg-dreamy-clouds flex items-center justify-center p-4 md:p-6 relative overflow-hidden">

      {/* ── BACKGROUND FLOATING CUBES ── */}
      <FloatingCube className="absolute top-[10%] left-[10%] animate-float" size={90} />
      <FloatingCube className="absolute bottom-[10%] right-[10%] animate-float-delayed" size={110} delay="1s" />
      <FloatingCube className="absolute top-[60%] left-[8%] animate-float-delayed" size={70} delay="2s" />
      <FloatingCube className="absolute top-[15%] right-[15%] animate-float" size={80} delay="1.5s" />

      {/* Back to Home Link */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/5 hover:bg-white/40 text-zinc-700 hover:text-zinc-800 text-xs font-bold transition-all shadow-sm"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to home</span>
      </Link>

      {/* Centered Glassmorphic Form Card */}
      <div
        className="relative w-full max-w-[430px] rounded-[32px] glass-light p-8 md:p-10"
        style={{
          background: "rgba(255, 255, 255, 0.45)",
          border: "1px solid rgba(255, 255, 255, 0.65)",
          boxShadow: "0 24px 60px rgba(139, 92, 246, 0.05), inset 0 1px 1px rgba(255,255,255,0.7)",
        }}
      >
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center text-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-zinc-950 flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-zinc-900">
              Chapter<span className="text-violet-600 font-black">One</span>
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
              {isSignUp ? "Create account" : "Welcome back"}
            </h1>
            <p className="text-zinc-500 text-xs font-semibold">
              {isSignUp
                ? "Join ChapterOne and start learning smarter."
                : "Sign in to continue your learning journey."}
            </p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs flex items-start gap-2 shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Google SSO */}
          {googleClientId ? (
            <div className="w-full flex justify-center min-h-[44px]" id="google-sso-button-container" />
          ) : (
            <button
              type="button"
              onClick={handleGoogleMock}
              disabled={actionLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              <span>Continue with Google</span>
            </button>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#fcfaf8] px-3 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Your First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all placeholder:text-zinc-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Your Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all placeholder:text-zinc-300"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Email address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all placeholder:text-zinc-300"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Password</label>
                {!isSignUp && (
                  <button type="button" className="text-[10px] text-violet-600 hover:text-violet-500 font-bold transition-colors">
                    Forgot?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all placeholder:text-zinc-300"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-md shadow-black/5 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isSignUp ? "Creating account..." : "Signing in..."}</span>
                </>
              ) : (
                <span>{isSignUp ? "Create account" : "Sign in"}</span>
              )}
            </button>
          </form>

          {/* Toggle */}
          <p className="text-center text-xs text-zinc-500 font-medium">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(""); }}
              className="text-violet-600 hover:text-violet-500 font-bold transition-colors"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fdfcfa] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-t-violet-600 border-zinc-200 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
