'use client';

import React from 'react';
import { AlertTriangle, ShieldCheck, X, ArrowRight } from 'lucide-react';
import { WorkflowStep } from '@/types';

interface ConsequentialModalProps {
  step: WorkflowStep | null;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConsequentialModal: React.FC<ConsequentialModalProps> = ({
  step,
  onConfirm,
  onClose
}) => {
  if (!step) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              Consequential Safety Review
            </span>
            <h3 className="text-lg font-bold text-slate-100">
              Review Before Submission
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-300">
          The AI Engine organizes and verifies your requirements, but <strong>you maintain full control</strong> over consequential submissions to government portals.
        </p>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs">
          <div>
            <p className="text-slate-400 font-semibold uppercase text-[10px]">Action</p>
            <p className="font-bold text-slate-100">{step.title}</p>
          </div>
          <div>
            <p className="text-slate-400 font-semibold uppercase text-[10px]">Destination Department</p>
            <p className="font-medium text-amber-300">{step.department}</p>
          </div>
          <div>
            <p className="text-slate-400 font-semibold uppercase text-[10px]">Information & Proofs Included</p>
            <p className="text-slate-300">
              {step.required_documents && step.required_documents.length > 0
                ? step.required_documents.map((d: any) => d.name).join(', ')
                : 'Aadhaar KYC & Basic Entity Details'}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <strong>Consequences:</strong> Proceeding will update your journey status and initiate sandbox application verification.
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-extrabold hover:brightness-110 active:scale-95 transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-slate-950" />
            <span>Confirm & Continue</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      </div>
    </div>
  );
};
