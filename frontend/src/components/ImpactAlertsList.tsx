'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, AlertTriangle, Info, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { ImpactAlert } from '@/types';

interface ImpactAlertsListProps {
  alerts: ImpactAlert[];
}

export const ImpactAlertsList: React.FC<ImpactAlertsListProps> = ({ alerts }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-400" />
            <span>What Affects You?</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Personalized government rule changes and official updates mapped to your active citizen journeys
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {alerts.map((alt) => {
          const isCritical = alt.severity === 'critical';
          const isImportant = alt.severity === 'important';

          return (
            <div
              key={alt.id}
              className={`rounded-2xl border p-5 transition shadow-lg ${
                isCritical
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : isImportant
                  ? 'bg-slate-900 border-amber-500/40'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded border ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : isImportant
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {alt.severity} Alert
                    </span>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Effective: {alt.effective_date}
                    </span>
                  </div>

                  <h3 className="text-base md:text-lg font-bold text-slate-100">
                    {alt.title}
                  </h3>

                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-3xl">
                    {alt.description}
                  </p>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-amber-300 space-y-1">
                    <p className="font-semibold flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Action Recommended:
                    </p>
                    <p className="text-slate-200">{alt.required_action}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  <Link
                    href="/journeys"
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow"
                  >
                    <span>Review Journey</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
