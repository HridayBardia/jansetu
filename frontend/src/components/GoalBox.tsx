'use client';

import React, { useState } from 'react';
import { Sparkles, Mic, ArrowRight, Loader2, Volume2, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface GoalBoxProps {
  onAnalyzeGoal: (input: string) => void;
  isLoading: boolean;
}

export const GoalBox: React.FC<GoalBoxProps> = ({ onAnalyzeGoal, isLoading }) => {
  const [input, setInput] = useState('');
  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onAnalyzeGoal(input.trim());
  };

  const handleQuickClick = (prompt: string) => {
    setInput(prompt);
    onAnalyzeGoal(prompt);
  };

  const toggleMic = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      // Simulate voice input audio speech recognition
      setTimeout(() => {
        setInput("Mujhe Karnataka mein ek chhota business start karna hai");
        setIsRecording(false);
      }, 2000);
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-6 md:p-8 shadow-2xl shadow-slate-950/50">
      <div className="max-w-3xl mx-auto text-center space-y-3 mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intent & Workflow Engine</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
          What are you trying to accomplish?
        </h1>
        <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto">
          Tell us what you want to do in natural language. We turn India&apos;s fragmented digital government into one guided journey.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="relative flex flex-col md:flex-row items-center bg-slate-950/90 border border-slate-700/80 rounded-xl focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all p-2 shadow-inner">
          <div className="flex items-center w-full px-3 py-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. I want to start a business in Vadodara, Gujarat..."
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm md:text-base focus:outline-none"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 px-2 border-t md:border-t-0 border-slate-800">
            {/* Voice Input Mic Button */}
            <button
              type="button"
              onClick={toggleMic}
              className={`p-2.5 rounded-lg border transition ${
                isRecording
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Voice Input (Speech-to-Text)"
            >
              {isRecording ? <Volume2 className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-full md:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-bold text-sm hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Build Journey</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Voice indicator bar */}
        {isRecording && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-rose-400 animate-pulse">
            <Volume2 className="w-4 h-4" />
            <span>Listening... Speak your goal in Hindi, Gujarati, Kannada, or English...</span>
          </div>
        )}
      </form>

      {/* Quick Prompts */}
      <div className="max-w-2xl mx-auto mt-6 pt-4 border-t border-slate-800/80">
        <p className="text-xs text-slate-400 mb-3 text-center md:text-left font-medium">
          Quick Start Examples:
        </p>
        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          {[
            "Start a business in Vadodara, Gujarat",
            "मुझे जयपुर में बिजनेस शुरू करना है",
            "મારે વડોદરામાં બિઝનેસ શરૂ કરવો છે",
            "Farmer support in Nashik",
            "Education scholarship in Rajasthan"
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickClick(prompt)}
              className="px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 text-xs hover:border-amber-500/50 hover:text-amber-300 transition"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
