"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LogOut, BookOpen, Upload, Search, Clock, X,
  AlertCircle, Loader2, Check, Settings, Camera,
  LayoutDashboard, Menu, ChevronRight,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout, token, updateUser } = useAuth();
  const pathname = usePathname();

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editAvatar, setEditAvatar] = useState(user?.avatar_url || "");
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState(false);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditAvatar(user.avatar_url || "");
    }
  }, [user]);

  useEffect(() => {
    if (profileOpen) {
      setTimeout(() => firstFocusRef.current?.focus(), 50);
    }
  }, [profileOpen]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setModalError("");
    setModalSuccess(false);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName, avatar_url: editAvatar || null, password: editPassword || null }),
      });
      if (res.ok) {
        const updated = await res.json();
        updateUser(updated);
        setModalSuccess(true);
        setEditPassword("");
        setTimeout(() => { setProfileOpen(false); setModalSuccess(false); }, 1200);
      } else {
        const err = await res.json();
        setModalError(err.detail || "Failed to update profile.");
      }
    } catch {
      setModalError("Error connecting to server.");
    } finally {
      setSaving(false);
    }
  };

  // Generate initials-based avatar colour
  const getInitialsColor = (name: string) => {
    const colors = [
      "bg-indigo-600", "bg-violet-600", "bg-pink-600",
      "bg-amber-600", "bg-emerald-600", "bg-sky-600",
    ];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  const initials = user?.name
    ? user.name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/upload", label: "Upload PDF", icon: Upload },
    { href: "/search", label: "Search", icon: Search },
    { href: "/history", label: "History", icon: Clock },
  ];

  return (
    <>
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-5 py-3.5 transition-all"
        style={{
          background: "rgba(255, 255, 255, 0.45)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: "0 2px 20px rgba(0,0,0,0.01)",
        }}
      >
        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center shadow-md shadow-black/10 group-hover:bg-zinc-800 transition-all">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-zinc-900">
            Chapter<span className="text-violet-600">One</span>
          </span>
        </Link>

        {user ? (
          <>
            {/* Desktop nav pills */}
            <div
              className="hidden md:flex items-center gap-1 p-1 rounded-full"
              style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.05)" }}
            >
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-1.5 px-4.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                      active
                        ? "bg-white text-zinc-900 shadow-sm border border-black/5"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-black/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Desktop right: avatar + logout */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setProfileOpen(true)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-black/5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                aria-label="Open account settings"
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-7 h-7 rounded-full object-cover ring-2 ring-black/5" />
                ) : (
                  <div className={`w-7 h-7 rounded-full ${getInitialsColor(user.name)} flex items-center justify-center text-white text-[10px] font-extrabold`}>
                    {initials}
                  </div>
                )}
                <span className="text-xs font-semibold text-zinc-700 max-w-[120px] truncate">{user.name}</span>
              </button>

              <button
                onClick={logout}
                aria-label="Sign out"
                className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/10 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="md:hidden p-2 rounded-xl text-zinc-500 hover:text-zinc-950 hover:bg-black/5 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-zinc-500 hover:text-zinc-950 text-xs font-bold transition-colors">
              Sign In
            </Link>
            <Link
              href="/login?tab=signup"
              className="px-4.5 py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-sm shadow-black/10"
            >
              Get Started
            </Link>
          </div>
        )}
      </nav>

      {/* ── MOBILE DRAWER ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-72 flex flex-col transition-transform duration-300"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              borderLeft: "1px solid rgba(0, 0, 0, 0.08)",
            }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
              <span className="font-bold text-sm text-zinc-950">Navigation</span>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? "bg-violet-50 text-violet-600 border border-violet-100"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-black/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </div>
                    {active && <ChevronRight className="w-3.5 h-3.5" />}
                  </Link>
                );
              })}
            </div>

            <div className="p-4 border-t border-black/5 space-y-2">
              <button
                onClick={() => { setMobileOpen(false); setProfileOpen(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-black/5 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>Account Settings</span>
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PROFILE MODAL ── */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Account Settings"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-xs"
            onClick={() => setProfileOpen(false)}
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-xl"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15), 0 0 30px rgba(139, 92, 246, 0.03)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-zinc-900">Account Settings</h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Manage your profile and security</p>
                </div>
              </div>
              <button
                ref={firstFocusRef}
                onClick={() => setProfileOpen(false)}
                aria-label="Close settings"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-black/5 border border-transparent hover:border-black/5 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Avatar preview */}
            <div className="px-6 pt-6 flex items-center gap-4">
              <div className="relative">
                {editAvatar ? (
                  <img src={editAvatar} alt="Avatar preview" className="w-14 h-14 rounded-2xl object-cover ring-2 ring-violet-500/20" />
                ) : (
                  <div className={`w-14 h-14 rounded-2xl ${getInitialsColor(editName || "U")} flex items-center justify-center text-white text-lg font-extrabold`}>
                    {(editName || "U").split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-zinc-200 flex items-center justify-center">
                  <Camera className="w-2.5 h-2.5 text-zinc-500" />
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-800">{editName || "Your Name"}</p>
                <p className="text-xs text-zinc-400 mt-0.5">Update your avatar via URL below</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}
              {modalSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs flex items-start gap-2">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Avatar URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">New Password</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || modalSuccess}
                  className="flex-1 py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-md shadow-black/5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {saving ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Saving...</span></>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
