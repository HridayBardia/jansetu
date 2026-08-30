'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import { Journey } from '@/types';
import { MapPin, ArrowRight, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

interface ActiveJourneysCardProps {
  journeys: Journey[];
  onRemove?: (id: string) => void;
}

export const ActiveJourneysCard: React.FC<ActiveJourneysCardProps> = ({ journeys, onRemove }) => {
  const { t } = useLanguage();
  if (!journeys || journeys.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#133E87] dark:text-blue-400" />
          <span>{t("journeys.activeJourneys")}</span>
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {journeys.length} {t("journeys.journeysInProgress")}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {journeys.map((jrn) => {
          const steps = Array.isArray(jrn?.steps) ? jrn.steps : [];
          const activeStep = steps.find((s: any) => 
            s?.status === 'active' || 
            s?.status === 'AVAILABLE' || 
            s?.status === 'IN_PROGRESS' || 
            s?.state === 'AVAILABLE' || 
            s?.state === 'IN_PROGRESS'
          ) || (steps.length > 0 ? steps[0] : null);

          const title = jrn?.title || (jrn as any)?.goal_raw || jrn?.goal_category || 'Citizen Journey';
          const location = jrn?.location_state || (jrn as any)?.location || 'National / Central';
          const city = jrn?.location_city || jrn?.city;
          const progressPct = (steps.length > 0)
            ? Math.round((steps.filter((s: any) => s.state === 'COMPLETED' || s.status === 'COMPLETED' || s.status === 'completed').length / steps.length) * 100)
            : (jrn.progress_percentage ?? (jrn as any).progress ?? 0);

          return (
            <div
              key={jrn.id}
              className="bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 hover:border-[#133E87] dark:hover:border-blue-500 rounded-lg p-5 shadow-sm transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                      {jrn.life_event ? jrn.life_event.replace('_', ' ') : 'GENERAL'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      📍 {location} {city ? `(${city})` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-xs font-bold text-[#133E87] dark:text-blue-300 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 font-mono">
                      {progressPct}%
                    </span>
                    {onRemove && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onRemove(jrn.id);
                        }}
                        className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded transition"
                        title={t("journeys.removeJourney", "Remove Journey")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden mb-4 border border-slate-200 dark:border-slate-700">
                  <div
                    className="bg-gradient-to-r from-[#133E87] to-emerald-600 dark:from-amber-500 dark:to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Active Step preview */}
                {activeStep && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 rounded-md p-3 border border-slate-200 dark:border-slate-700 mb-4 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold mb-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{t("journeys.currentStep")}</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">
                      {activeStep.title}
                    </p>
                  </div>
                )}
              </div>

              <Link
                href={`/journeys/${jrn.id}`}
                className="w-full py-2 px-4 rounded bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center justify-center gap-2 group shadow-xs"
              >
                <span>{t("journeys.viewFullWorkflow")}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition text-amber-300" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
