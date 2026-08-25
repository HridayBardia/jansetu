'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { HelpCircle, CheckCircle2, X } from 'lucide-react';
import { GoalAnalysisResponse } from '@/types';

interface ClarificationModalProps {
  analysis: GoalAnalysisResponse;
  onSelectOption: (option: string) => void;
  onClose: () => void;
}

export const ClarificationModal: React.FC<ClarificationModalProps> = ({
  analysis,
  onSelectOption,
  onClose
}) => {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10">
              Minimum Context Request
            </span>
            <h2 className="text-lg font-bold text-slate-100">
              Personalizing Your Journey
            </h2>
          </div>
        </div>

        <p className="text-sm text-slate-300 font-medium mb-5 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          {analysis.clarification_question || "Please select the option that best describes your intent:"}
        </p>

        <div className="space-y-2.5">
          {(analysis.clarification_options || []).map((opt: string, idx: number) => (
            <button
              key={idx}
              onClick={() => onSelectOption(opt)}
              className="w-full text-left p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 transition flex items-center justify-between group"
            >
              <span className="text-xs md:text-sm font-medium text-slate-200 group-hover:text-amber-300">
                {opt}
              </span>
              <CheckCircle2 className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition" />
            </button>
          ))}
        </div>

        <p className="text-[11px] text-slate-500 mt-4 text-center">
          {t("clarification.privacyNote")}
        </p>
      </div>
    </div>
  );
};
