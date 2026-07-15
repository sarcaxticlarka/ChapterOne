"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogOut, BookOpen, Upload, User as UserIcon, Search, Clock } from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

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
            <div className="flex items-center space-x-2">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-zinc-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                  <UserIcon className="w-4 h-4 text-zinc-400" />
                </div>
              )}
              <span className="text-sm font-semibold text-zinc-200 max-w-[120px] truncate">{user.name}</span>
            </div>
            
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
    </nav>
  );
};
export default Navbar;
