'use client';

import React from 'react';
import { ArrowRight, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { NextBestAction } from '@/types';

interface NextBestActionCardProps {
  nba: NextBestAction;
  onExecute: (stepId: string) => void;
}

export const NextBestActionCard: React.FC<NextBestActionCardProps> = ({ nba, onExecute }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 border border-amber-500/30 p-6 shadow-xl">
      <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase rounded-bl-xl tracking-wider">
        Your Next Best Action
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Recommended Priority Step</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {nba.estimated_effort || nba.estimated_time || '15 min'}
            </span>
          </div>

          <h3 className="text-lg md:text-xl font-bold text-slate-100">
            {nba.title}
          </h3>

          <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {nba.reason}
          </p>

          {nba.prerequisite_summary && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{nba.prerequisite_summary}</span>
            </div>
          )}
        </div>

        <div className="shrink-0 pt-2 md:pt-0">
          <button
            onClick={() => onExecute(nba.step_key || nba.step_id || '')}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-sm hover:brightness-110 active:scale-95 transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
          >
            <span>{nba.cta_label || "Continue Action"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
