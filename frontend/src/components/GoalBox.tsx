'use client';

import React, { useState } from 'react';
import { Sparkles, Mic, ArrowRight, Loader2, Volume2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface GoalBoxProps {
  onAnalyzeGoal: (input: string) => void;
  isLoading: boolean;
}

export const GoalBox: React.FC<GoalBoxProps> = ({ onAnalyzeGoal, isLoading }) => {
  const [input, setInput] = useState('');
  const { t, translateInputToEnglish } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Normalize input query in any Indic script to English keywords
    const normalized = await translateInputToEnglish(input.trim());
    onAnalyzeGoal(normalized || input.trim());
  };

  const handleQuickClick = async (prompt: string) => {
    setInput(prompt);
    const normalized = await translateInputToEnglish(prompt);
    onAnalyzeGoal(normalized || prompt);
  };

  const toggleMic = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      setTimeout(() => {
        const demoSpeech = "Mujhe Rajasthan mein scholarship ke liye apply karna hai";
        setInput(demoSpeech);
        setIsRecording(false);
      }, 2000);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 p-6 md:p-8 shadow-sm">
      <div className="max-w-3xl mx-auto text-center space-y-3 mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-[#133E87] dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('goal_planner.intentEngine', 'Intent & Workflow Engine')}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          {t('goal_planner.whatLookingToAccomplish', 'What are you looking to accomplish?')}
        </h1>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          {t('goal_planner.tagline', 'Tell us what you want to do in natural language. We turn fragmented government processes into one unified journey.')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="relative flex flex-col md:flex-row items-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus-within:ring-2 focus-within:ring-[#133E87] dark:focus-within:ring-blue-500 transition-all p-1.5 shadow-2xs">
          <div className="flex items-center w-full px-3 py-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('goal_planner.placeholder', 'e.g. I want to start a business in Vadodara, Gujarat...')}
              className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-sm md:text-base focus:outline-none"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 px-2 border-t md:border-t-0 border-slate-200 dark:border-slate-700">
            {/* Voice Input Mic Button */}
            <button
              type="button"
              onClick={toggleMic}
              className={`p-2.5 rounded border transition ${
                isRecording
                  ? 'bg-red-50 text-red-600 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
              title={t('Voice Input (Speech-to-Text)', 'Voice Input (Speech-to-Text)')}
            >
              {isRecording ? <Volume2 className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-full md:w-auto px-5 py-2.5 rounded bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('goal_planner.analyzing', 'Analyzing...')}</span>
                </>
              ) : (
                <>
                  <span>{t('goal_planner.buildJourney', 'Build Journey')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Voice indicator bar */}
        {isRecording && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-medium animate-pulse">
            <Volume2 className="w-4 h-4" />
            <span>{t('Listening... Speak your goal in any of the 23 Indian languages...', 'Listening... Speak your goal in any of the 23 Indian languages...')}</span>
          </div>
        )}
      </form>

      {/* Quick Prompts */}
      <div className="max-w-2xl mx-auto mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 text-center md:text-left font-semibold uppercase tracking-wider">
          {t('goal_planner.quickStarts', 'Quick Start Examples:')}
        </p>
        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          {[
            { text: "Start a business in Vadodara, Gujarat", label: t('goal_planner.startBusinessVadodara', 'Start Food Business in Vadodara') },
            { text: "Higher education and masters in Australia", label: t('goal_planner.mastersAustralia', 'Higher Education & Masters in Australia') },
            { text: "Scholarship in Rajasthan", label: t('goal_planner.scholarshipRajasthan', 'Post-Matric Scholarship in Rajasthan') },
            { text: "Farmer support in Rajasthan", label: t('goal_planner.farmerSupport', 'PM-KISAN Beneficiary & Land Linking') }
          ].map((promptItem, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickClick(promptItem.text)}
              className="px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-xs font-medium transition cursor-pointer shadow-2xs"
            >
              {promptItem.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
