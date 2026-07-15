"use client";

import React, { useEffect, useState } from "react";
import { X, Sparkles, RefreshCw, Loader2, ArrowRight, HelpCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Flashcard {
  id: string;
  lesson_id: string;
  front: string;
  back: string;
}

interface FlashcardsModalProps {
  lessonId: string;
  lessonTitle: string;
  onClose: () => void;
}

const API_URL = "http://localhost:8000";

export const FlashcardsModal: React.FC<FlashcardsModalProps> = ({ lessonId, lessonTitle, onClose }) => {
  const { token } = useAuth();
  
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token && lessonId) {
      fetchFlashcards();
    }
  }, [token, lessonId]);

  const fetchFlashcards = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/flashcards/lesson/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCards(data);
      } else {
        setError("Failed to fetch flashcards.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/flashcards/generate?lesson_id=${lessonId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCards(data);
        setCurrentIndex(0);
      } else {
        setError("AI was unable to generate flashcards.");
      }
    } catch (err) {
      setError("Connection failure.");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleReview = async (quality: number) => {
    if (!token || cards.length === 0) return;
    const currentCard = cards[currentIndex];
    
    // Optimistically advance to next card or loop back
    setFlipped(false);
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Complete or loop back
        setCurrentIndex(0);
      }
    }, 200);

    try {
      await fetch(`${API_URL}/api/flashcards/${currentCard.id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quality })
      });
    } catch (err) {
      console.error("Failed to register spaced repetition review:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 flex flex-col relative space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
          <div className="space-y-1">
            <h3 className="font-extrabold text-lg text-zinc-100 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
              <span>Spaced Repetition Review</span>
            </h3>
            <p className="text-zinc-500 text-xs truncate max-w-[280px]">Lesson: {lessonTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inner Content states */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            <p className="text-zinc-500 text-sm">Loading flashcards...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="py-12 text-center space-y-6">
            <HelpCircle className="w-12 h-12 text-zinc-650 mx-auto" />
            <div className="space-y-2">
              <h4 className="font-bold text-zinc-200">No Flashcards Generated Yet</h4>
              <p className="text-zinc-500 text-xs max-w-sm mx-auto leading-relaxed">
                Unlock automated flashcards for this lesson! AI will analyze the explanation text and write Q&A recall cards using SM-2 scheduling.
              </p>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="gradient-button px-6 py-3 rounded-xl font-bold text-white text-sm shadow-lg flex items-center justify-center space-x-2 mx-auto cursor-pointer disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI Writing Flashcards...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Flashcards</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            {/* Cards index header */}
            <div className="flex justify-between items-center text-xs font-bold text-zinc-500">
              <span>CARD {currentIndex + 1} OF {cards.length}</span>
              <span>SM-2 Mode</span>
            </div>

            {/* Flippable Card Container */}
            <div
              onClick={() => setFlipped(!flipped)}
              className="h-64 relative cursor-pointer select-none [perspective:1000px] w-full"
            >
              <div className={`w-full h-full relative transition-transform duration-500 [transform-style:preserve-3d] ${
                flipped ? "[transform:rotateY(180deg)]" : ""
              }`}>
                
                {/* Front Side */}
                <div className="absolute inset-0 w-full h-full glass-panel border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center [backface-visibility:hidden]">
                  <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-4">Question</span>
                  <p className="text-zinc-150 font-bold text-base leading-relaxed md:text-lg">
                    {cards[currentIndex]?.front}
                  </p>
                  <span className="text-[10px] text-zinc-500 font-medium absolute bottom-4">Click Card to Flip</span>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 w-full h-full glass-panel border border-violet-900/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center [backface-visibility:hidden] [transform:rotateY(180deg)] bg-violet-950/5">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4">Correct Answer</span>
                  <p className="text-zinc-200 font-medium text-sm leading-relaxed md:text-base">
                    {cards[currentIndex]?.back}
                  </p>
                  <span className="text-[10px] text-zinc-500 font-medium absolute bottom-4">Click Card to Flip Back</span>
                </div>

              </div>
            </div>

            {/* Answer reviews grading action panel */}
            <div className="space-y-4 pt-4 border-t border-zinc-900">
              {flipped ? (
                <div className="space-y-3">
                  <p className="text-center text-zinc-500 text-xs font-semibold">How well did you recall this answer?</p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleReview(1)}
                      className="py-3 px-4 rounded-xl text-xs font-bold bg-red-950/20 text-red-400 border border-red-900/40 hover:bg-red-950/30 transition-all cursor-pointer text-center"
                    >
                      Hard (SM-1d)
                    </button>
                    <button
                      onClick={() => handleReview(3)}
                      className="py-3 px-4 rounded-xl text-xs font-bold bg-amber-950/20 text-amber-400 border border-amber-900/40 hover:bg-amber-950/30 transition-all cursor-pointer text-center"
                    >
                      Good (SM-6d)
                    </button>
                    <button
                      onClick={() => handleReview(5)}
                      className="py-3 px-4 rounded-xl text-xs font-bold bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 hover:bg-emerald-950/30 transition-all cursor-pointer text-center"
                    >
                      Easy (SM-EF)
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setFlipped(true)}
                  className="w-full py-3.5 rounded-xl font-bold text-white gradient-button text-sm flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <RefreshCw className="w-4.5 h-4.5" />
                  <span>Reveal Answer Card</span>
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
export default FlashcardsModal;
