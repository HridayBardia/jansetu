'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import { Journey } from '@/types';
import { MapPin, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface ActiveJourneysCardProps {
  journeys: Journey[];
}

export const ActiveJourneysCard: React.FC<ActiveJourneysCardProps> = ({ journeys }) => {
  const { t } = useLanguage();
  if (!journeys || journeys.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-amber-400" />
          <span>{t("journeys.activeJourneys")}</span>
        </h2>
        <span className="text-xs text-slate-400 font-medium">
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

          return (
            <div
              key={jrn.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      {jrn.life_event ? jrn.life_event.replace('_', ' ') : 'GENERAL'}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 mt-1">
                      {title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      📍 {location} {city ? `(${city})` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 shrink-0">
                    {jrn.progress_percentage}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden mb-4 border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${jrn.progress_percentage}%` }}
                  />
                </div>

                {/* Active Step preview */}
                {activeStep && (
                  <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 mb-4 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{t("journeys.currentStep")}</span>
                    </div>
                    <p className="text-slate-200 font-medium">
                      {activeStep.title}
                    </p>
                  </div>
                )}
              </div>

              <Link
                href={`/journeys/${jrn.id}`}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold transition flex items-center justify-center gap-2 group border border-slate-700"
              >
                <span>{t("journeys.viewFullWorkflow")}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition text-amber-400" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
