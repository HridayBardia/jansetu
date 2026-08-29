'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface FloatingAiButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export const FloatingAiButton: React.FC<FloatingAiButtonProps> = ({ isOpen, onClick }) => {
  if (isOpen) return null; // Hides button when chat widget is open

  return (
    <button
      onClick={onClick}
      type="button"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-[#0f3470] hover:bg-[#0c2957] text-white px-5 py-3 rounded-full shadow-2xl hover:shadow-blue-900/30 active:scale-95 transition-all duration-200 border border-blue-400/20 group cursor-pointer"
      aria-label="Ask SetuSahayak"
    >
      <Sparkles className="w-5 h-5 text-amber-300 animate-pulse group-hover:rotate-12 transition-transform" />
      <span className="font-semibold text-sm tracking-wide">
        Ask SetuSahayak
      </span>
    </button>
  );
};

export default FloatingAiButton;
