import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogOut, BookOpen, Upload, User as UserIcon, Search, Clock, X, AlertCircle, Loader2, Check } from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout, token, updateUser } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editAvatar, setEditAvatar] = useState(user?.avatar_url || "");
  const [editPassword, setEditPassword] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditAvatar(user.avatar_url || "");
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setModalError("");
    setModalSuccess(false);

    try {
      const response = await fetch("http://localhost:8000/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          avatar_url: editAvatar || null,
          password: editPassword || null
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        setModalSuccess(true);
        setEditPassword("");
        setTimeout(() => {
          setProfileOpen(false);
          setModalSuccess(false);
        }, 1000);
      } else {
        const errData = await response.json();
        setModalError(errData.detail || "Failed to update profile.");
      }
    } catch (err) {
      setModalError("Error connecting to server.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
      <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-3 group">
        <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center text-white">
          <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
        </div>
        <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
          Chapter<span className="text-violet-400">One</span>
        </span>
      </Link>

      {user ? (
        <div className="flex items-center space-x-6">
          <Link
            href="/dashboard"
            className="text-zinc-400 hover:text-white transition-colors duration-200 text-sm font-medium flex items-center space-x-1"
          >
            <span>Dashboard</span>
          </Link>
          
          <Link
            href="/upload"
            className="text-zinc-400 hover:text-white transition-colors duration-200 text-sm font-medium flex items-center space-x-1"
          >
            <Upload className="w-4 h-4" />
            <span>Upload PDF</span>
          </Link>

          <Link
            href="/search"
            className="text-zinc-400 hover:text-white transition-colors duration-200 text-sm font-medium flex items-center space-x-1"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </Link>

          <Link
            href="/history"
            className="text-zinc-400 hover:text-white transition-colors duration-200 text-sm font-medium flex items-center space-x-1"
          >
            <Clock className="w-4 h-4" />
            <span>History</span>
          </Link>

          <div className="flex items-center space-x-4 border-l border-zinc-800 pl-6">
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer text-left"
              title="Profile Settings"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-zinc-700 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                  <UserIcon className="w-4 h-4 text-zinc-400" />
                </div>
              )}
              <span className="text-sm font-semibold text-zinc-200 max-w-[120px] truncate">{user.name}</span>
            </button>
            
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-zinc-900/50 hover:bg-red-950/30 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-900/50 transition-all duration-200"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-zinc-400 hover:text-white transition-colors duration-200 text-sm font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/login?tab=signup"
            className="gradient-button px-4 py-2 rounded-xl text-sm font-medium text-white shadow-lg"
          >
            Get Started
          </Link>
        </div>
      )}

      {/* Profile Settings Modal Overlay */}
      {profileOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 flex flex-col relative space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
              <h3 className="font-extrabold text-base text-zinc-100 flex items-center space-x-2">
                <UserIcon className="w-4.5 h-4.5 text-violet-400" />
                <span>Account Settings</span>
              </h3>
              <button
                onClick={() => setProfileOpen(false)}
                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/40 text-red-400 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs flex items-start space-x-2">
                  <Check className="w-4.5 h-4.5 shrink-0" />
                  <span>Settings updated successfully!</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-zinc-400 text-[10px] uppercase font-extrabold tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 text-[10px] uppercase font-extrabold tracking-wider">Avatar image URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 text-[10px] uppercase font-extrabold tracking-wider">Update Password</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving || modalSuccess}
                  className="w-full py-3 rounded-xl font-bold text-white gradient-button text-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving settings...</span>
                    </>
                  ) : (
                    <span>Save Account Settings</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
};
export default Navbar;
