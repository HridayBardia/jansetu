'use client';

import React from 'react';
import { WorkflowStep } from '@/types';
import { Network, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

interface DependencyGraphProps {
  steps: WorkflowStep[];
}

export const DependencyGraph: React.FC<DependencyGraphProps> = ({ steps }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              How Your Steps Connect
            </h3>
            <p className="text-xs text-slate-400">
              Visual dependency map showing prerequisite relationships between regulatory stages
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-300">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Active
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Locked Dependency
          </span>
        </div>
      </div>

      {/* SVG Container for Node-Link Graph */}
      <div className="relative overflow-x-auto py-4">
        <div className="min-w-[650px] space-y-4">
          {steps.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isActive = step.status === 'active';
            const isLocked = step.is_locked || step.status === 'blocked';

            return (
              <div key={step.id} className="relative flex items-center gap-4">
                {/* Step Node Card */}
                <div
                  className={`flex-1 p-4 rounded-xl border transition-all ${
                    isCompleted
                      ? 'bg-slate-950 border-emerald-500/40 text-emerald-300'
                      : isActive
                      ? 'bg-slate-950 border-amber-500/80 text-amber-200 ring-2 ring-amber-500/20'
                      : isLocked
                      ? 'bg-slate-950 border-rose-500/30 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      Stage {idx + 1}
                    </span>
                    <span className="text-xs font-semibold flex items-center gap-1">
                      {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {isActive && <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />}
                      {isLocked && <Lock className="w-4 h-4 text-rose-400" />}
                      {isCompleted ? 'Done' : isActive ? 'Active' : isLocked ? 'Locked' : 'Pending'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100">{step.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{step.department}</p>

                  {((step.prerequisites && step.prerequisites.length > 0) || (step.dependencies && step.dependencies.length > 0)) && (
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
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
