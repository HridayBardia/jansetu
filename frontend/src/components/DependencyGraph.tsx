'use client';

import React from 'react';
import { WorkflowStep } from '@/types';
import { Network, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

interface DependencyGraphProps {
  steps: WorkflowStep[];
}

export const DependencyGraph: React.FC<DependencyGraphProps> = ({ steps }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-6 shadow-2xs space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#133E87] dark:text-blue-400">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Sequential Dependency Graph
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Visual dependency map showing prerequisite relationships between regulatory stages
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Locked Dependency
          </span>
        </div>
      </div>

      {/* SVG Container for Node-Link Graph */}
      <div className="relative overflow-x-auto py-2">
        <div className="min-w-[650px] space-y-3">
          {steps.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isActive = step.status === 'active';
            const isLocked = step.is_locked || step.status === 'blocked';

            return (
              <div key={step.id} className="relative flex items-center gap-4">
                {/* Step Node Card */}
                <div
                  className={`flex-1 p-4 rounded-xl border transition-all shadow-2xs ${
                    isCompleted
                      ? 'bg-emerald-50/70 dark:bg-slate-950 border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-300'
                      : isActive
                      ? 'bg-blue-50/50 dark:bg-slate-950 border-[#133E87] dark:border-blue-500 ring-2 ring-blue-500/20 text-slate-900 dark:text-white'
                      : isLocked
                      ? 'bg-rose-50/50 dark:bg-slate-950 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      Stage {idx + 1}
                    </span>
                    <span className="text-xs font-bold flex items-center gap-1">
                      {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                      {isActive && <AlertCircle className="w-4 h-4 text-[#133E87] dark:text-blue-400 animate-pulse" />}
                      {isLocked && <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                      {isCompleted ? 'Done' : isActive ? 'Active' : isLocked ? 'Locked' : 'Pending'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{step.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{step.department}</p>

                  {((step.prerequisites && step.prerequisites.length > 0) || (step.dependencies && step.dependencies.length > 0)) && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                      Prerequisites: {(step.prerequisites || step.dependencies || []).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default DependencyGraph;
