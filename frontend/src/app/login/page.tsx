"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Mail, Lock, User as UserIcon, AlertCircle, Sparkles, BookOpen } from "lucide-react";

const API_URL = "http://localhost:8000";

function LoginForm() {
  const { user, login, register, loginWithGoogle, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Set tab based on query param ?tab=signup
  const [isSignUp, setIsSignUp] = useState(false);
  const [googleClientId, setGoogleClientId] = useState("");
  
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/google/client-id`)
      .then((res) => res.json())
      .then((data) => {
        if (data.client_id) {
          setGoogleClientId(data.client_id);
        }
      })
      .catch((err) => console.error("Error loading google client id", err));
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
        callback: (res: any) => {
          loginWithGoogle(res.credential);
        },
      });

      const container = document.getElementById("google-sso-button-container");
      if (container) {
        google?.accounts.id.renderButton(container, {
          theme: "filled_blue",
          size: "large",
          width: 384,
          shape: "rectangular",
        });
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [googleClientId]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "signup") {
      setIsSignUp(true);
    } else {
      setIsSignUp(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setActionLoading(true);
    
    try {
      if (isSignUp) {
        if (!name) throw new Error("Name is required");
        await register(email, name, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGoogleMockLogin = async () => {
    setErrorMsg("");
    setActionLoading(true);
    try {
      // Simulate Google OAuth popup output: return a mock token based on email prefix or random string
      // The backend accepts mock_ tokens gracefully for sandbox testing!
      const randomId = Math.floor(Math.random() * 1000);
      const mockGoogleToken = `mock_google_user_${randomId}`;
      await loginWithGoogle(mockGoogleToken);
    } catch (err: any) {
      setErrorMsg(err.message || "Google mock login failed.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <Navbar />

      <div className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md glass-panel p-8 md:p-10 rounded-3xl shadow-2xl border border-zinc-800/60">
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-violet-950/40 border border-violet-800/30 items-center justify-center text-violet-400 mb-2">
              <BookOpen className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-zinc-400 text-sm">
              {isSignUp ? "Join Chapter One to generate custom study plans" : "Access your learning dashboard and streaks"}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-sm flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-xl focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-zinc-100 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-xl focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-zinc-100 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-xl focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 text-zinc-100 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-3.5 rounded-xl font-bold text-white gradient-button flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isSignUp ? "Sign Up" : "Sign In"}</span>
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-950 px-3 text-zinc-500 font-semibold tracking-wider">Or continue with</span>
            </div>
          </div>

          {googleClientId ? (
            <div className="flex justify-center w-full min-h-[44px]" id="google-sso-button-container"></div>
          ) : (
            <button
              onClick={handleGoogleMockLogin}
              disabled={actionLoading}
              className="w-full py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/70 hover:border-zinc-700 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all duration-300 shadow-md cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span>Google Single Sign-On (SSO)</span>
            </button>
          )}

          <div className="mt-8 text-center text-sm text-zinc-400">
            {isSignUp ? (
              <span>
                Already have an account?{" "}
                <button onClick={() => setIsSignUp(false)} className="text-violet-400 font-bold hover:underline">
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                New to Chapter One?{" "}
                <button onClick={() => setIsSignUp(true)} className="text-violet-400 font-bold hover:underline">
                  Create Account
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-t-violet-500 border-zinc-800 animate-spin"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
