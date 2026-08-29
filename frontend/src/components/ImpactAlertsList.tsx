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
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-500" />
            <span>What Affects You?</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
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
              className={`rounded-2xl border p-5 transition shadow-2xs ${
                isCritical
                  ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/40'
                  : isImportant
                  ? 'bg-amber-50/70 dark:bg-slate-900 border-amber-300 dark:border-amber-500/40'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded border ${
                        isCritical
                          ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40'
                          : isImportant
                          ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                          : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {alt.severity} Alert
                    </span>

                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Effective: {alt.effective_date}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {alt.title}
                  </h3>

                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                    {alt.description}
                  </p>

                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1 text-[11px] text-amber-800 dark:text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Action Recommended:
                    </p>
                    <p className="text-slate-800 dark:text-slate-200">{alt.required_action}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  <Link
                    href="/journeys"
                    className="px-4 py-2 rounded-xl bg-[#0B2545] hover:bg-[#133E87] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <span>Review Journey</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
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
export default ImpactAlertsList;
