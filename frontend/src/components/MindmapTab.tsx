"use client";

import React, { useEffect, useState } from "react";
import { GitFork, ChevronRight, ChevronDown, BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface MindNode {
  name: string;
  children?: MindNode[];
}

interface MindmapTabProps {
  courseId: string;
}

const API_URL = "http://localhost:8000";

export const MindmapTab: React.FC<MindmapTabProps> = ({ courseId }) => {
  const { token } = useAuth();
  const [mindmap, setMindmap] = useState<MindNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (token && courseId) {
      fetchMindmap();
    }
  }, [token, courseId]);

  const fetchMindmap = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}/mindmap`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMindmap(data);
        
        // Expand root and all chapter nodes by default
        const expansions: Record<string, boolean> = { root: true };
        data.children?.forEach((ch: MindNode, idx: number) => {
          expansions[`chapter-${idx}`] = true;
        });
        setExpandedNodes(expansions);
      } else {
        setError("Failed to fetch course mind map.");
      }
    } catch (err) {
      setError("Network connection failed.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (nodeKey: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeKey]: !prev[nodeKey]
    }));
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        <p className="text-zinc-500 text-sm">Mapping course nodes...</p>
      </div>
    );
  }

  if (error || !mindmap) {
    return (
      <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-3xl">
        <p>{error || "No mindmap data found."}</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 md:p-8 rounded-3xl border border-zinc-800/40 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
        <div className="flex items-center space-x-2">
          <GitFork className="w-5 h-5 text-violet-400 rotate-90" />
          <h3 className="font-extrabold text-base text-zinc-200">Interactive Concept Tree Map</h3>
        </div>
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Dynamic Visual View</span>
      </div>

      {/* Mindmap nodes list */}
      <div className="space-y-4 pl-4 border-l border-zinc-850">
        {/* Root Node (Course title) */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 group">
            <button
              onClick={() => toggleExpand("root")}
              className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-white cursor-pointer"
            >
              {expandedNodes["root"] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            <div className="px-4 py-2.5 rounded-xl bg-violet-950/20 border border-violet-900/50 text-zinc-100 font-bold text-sm shadow-md">
              📂 Course: {mindmap.name}
            </div>
          </div>

          {/* Chapters (Children) */}
          {expandedNodes["root"] && mindmap.children && (
            <div className="pl-6 space-y-6 relative border-l border-violet-950/40 ml-2.5 py-1">
              {mindmap.children.map((chapter, chIdx) => {
                const chKey = `chapter-${chIdx}`;
                const chExpanded = expandedNodes[chKey];

                return (
                  <div key={chIdx} className="space-y-3 relative">
                    {/* Node line indicator */}
                    <div className="absolute left-[-16px] top-4 w-4 border-t border-violet-950/40"></div>
                    
                    <div className="flex items-center space-x-3 group">
                      <button
                        onClick={() => toggleExpand(chKey)}
                        className="p-1 rounded bg-zinc-900 border border-zinc-850 text-zinc-500 group-hover:text-zinc-300 cursor-pointer"
                      >
                        {chExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>
                      <div className="px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-zinc-200 font-extrabold text-xs shadow-sm">
                        📁 Chapter {chIdx + 1}: {chapter.name}
                      </div>
                    </div>

                    {/* Lessons (Grandchildren) */}
                    {chExpanded && chapter.children && (
                      <div className="pl-8 space-y-2 relative border-l border-zinc-800 ml-2 py-0.5">
                        {chapter.children.map((lesson, lIdx) => (
                          <div key={lIdx} className="relative flex items-center space-x-2.5 group">
                            {/* Branch connector */}
                            <div className="absolute left-[-24px] top-3.5 w-6 border-t border-zinc-800"></div>
                            <div className="w-2 h-2 rounded-full bg-zinc-700 group-hover:bg-violet-400 transition-colors"></div>
                            <div className="px-3 py-1.5 rounded-lg bg-zinc-950/45 border border-zinc-900/60 text-zinc-400 group-hover:text-zinc-200 group-hover:border-zinc-800 text-xs font-medium transition-all shadow-sm flex items-center space-x-2">
                              <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                              <span>{lesson.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default MindmapTab;
