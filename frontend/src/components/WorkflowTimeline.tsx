'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  CheckCircle2,
  Lock,
  Clock,
  ExternalLink,
  HelpCircle,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  FileText,
  Building2,
  Key,
  Info
} from 'lucide-react';
import { JourneyStep } from '@/types';

interface WorkflowTimelineProps {
  steps: JourneyStep[];
  onCompleteStep: (step: JourneyStep) => void;
  onOpenSourceModal: (step: JourneyStep) => void;
  onOpenLegalModal: (step: JourneyStep) => void;
  onOpenHelp: (step: JourneyStep) => void;
  onOpenConsequentialModal: (step: JourneyStep) => void;
}

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
  steps,
  onCompleteStep,
  onOpenSourceModal,
  onOpenLegalModal,
  onOpenHelp,
  onOpenConsequentialModal,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      {steps.map((step, idx) => {
        const isCompleted = step.status === 'completed' || step.state === 'COMPLETED';
        const isActive = step.status === 'active' || step.state === 'AVAILABLE' || step.state === 'IN_PROGRESS';
        const isBlocked = step.status === 'blocked' || step.is_locked || step.state === 'LOCKED';

        return (
          <div
            key={step.id}
            className={`relative rounded-2xl border transition-all p-5 md:p-6 shadow-2xs ${
              isCompleted
                ? 'bg-slate-50/80 dark:bg-slate-900/60 border-emerald-200 dark:border-emerald-900/50'
                : isActive
                ? 'bg-white dark:bg-slate-900 border-amber-400 dark:border-amber-500/50 shadow-md ring-1 ring-amber-400/20'
                : 'bg-slate-50/50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800/80 opacity-80'
            }`}
          >
            {/* Left status vertical track connector line */}
            {idx < steps.length - 1 && (
              <div
                className={`absolute left-7 top-14 bottom-0 w-0.5 -mb-6 hidden md:block ${
                  isCompleted ? 'bg-emerald-500/40' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            )}

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              {/* Header & Number */}
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 border shadow-2xs ${
                    isCompleted
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-400'
                      : isActive
                      ? 'bg-[#0B2545] dark:bg-amber-500 border-[#0B2545] dark:border-amber-400 text-white dark:text-slate-950'
                      : isBlocked
                      ? 'bg-rose-100 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-400'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isBlocked ? <Lock className="w-4 h-4" /> : idx + 1}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      {step.department}
                    </span>

                    {/* Step Status Badge */}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        isCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : isActive
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 animate-pulse'
                          : isBlocked
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300'
                      }`}
                    >
                      {isCompleted ? 'Completed' : isActive ? 'Active Step' : isBlocked ? 'Locked' : 'Pending'}
                    </span>

                    {/* AI Grounded Confidence Badge */}
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#133E87] dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Verified Rules
                    </span>
                  </div>

                  <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                    {step.title}
                  </h3>

                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                    {step.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Est: {step.estimated_time}
                    </span>
                    {step.consequential && (
                      <span className="text-amber-800 dark:text-amber-300 text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                        ⚠️ Requires Consequential Confirmation
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex flex-wrap items-center md:flex-col md:items-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
                {/* Contextual AI Help button */}
                <button
                  onClick={() => onOpenHelp(step)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-300 dark:border-slate-700 cursor-pointer shadow-2xs"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t("workflow.needHelp", "Need Guidance?")}</span>
                </button>

                {/* Primary CTA */}
                {!isCompleted && !isBlocked && (
                  <button
                    onClick={() => {
                      if (step.consequential) {
                        onOpenConsequentialModal(step);
                      } else {
                        onCompleteStep(step);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0B2545] hover:bg-[#133E87] dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{step.consequential ? t('workflow.reviewConfirm', 'Review & Confirm') : t('workflow.markCompleted', 'Mark Complete')}</span>
                    <ChevronRight className="w-4 h-4 text-amber-300" />
                  </button>
                )}

                {isCompleted && (
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed
                  </span>
                )}
              </div>
            </div>

            {/* Lock Overlay Warning */}
            {isBlocked && step.lock_reason && (
              <div className="mt-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-3 flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{step.lock_reason}</span>
              </div>
            )}

            {/* Required Documents Section */}
            {step.required_documents && step.required_documents.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('workflow.prerequisites', 'Statutory Documents Required')} ({step.required_documents.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {step.required_documents.map((doc: any, docIdx: number) => {
                    const docName = typeof doc === 'string' ? doc : doc?.document_type || doc?.title || doc?.name || 'Required Document';
                    return (
                      <div
                        key={docIdx}
                        className="bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#133E87] dark:bg-blue-400" />
                          <span className="font-medium text-slate-800 dark:text-slate-200">{docName}</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          Auto-Fetched
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
export default WorkflowTimeline;
