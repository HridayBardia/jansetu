'use client';

import React from 'react';
import { ShieldAlert, LogIn, AlertTriangle, ShieldCheck } from 'lucide-react';
import { LockScroll } from '@/hooks/useLockBodyScroll';

interface SessionBreakModalProps {
  isOpen: boolean;
  accountName?: string;
  onConfirm: () => void;
}

export const SessionBreakModal: React.FC<SessionBreakModalProps> = ({
  isOpen,
  accountName = 'Citizen Beneficiary',
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <LockScroll />
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-2xl shadow-2xl overflow-hidden animate-scale-up text-slate-900 dark:text-white"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-break-title"
      >
        {/* Urgent Header */}
        <div className="bg-gradient-to-r from-rose-600 to-red-700 px-6 py-4 text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
            <ShieldAlert className="w-6 h-6 text-white animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-rose-900/60 px-2 py-0.5 rounded border border-rose-400/40">
                Security Alert
              </span>
              <span className="text-[10px] text-rose-100 font-mono">DPDP-2023 SEC-14</span>
            </div>
            <h2 id="session-break-title" className="text-base font-extrabold tracking-tight mt-0.5 text-white">
              Session Terminated: Concurrent Login
            </h2>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-rose-900 dark:text-rose-200 text-xs">
                Active Session Overwritten
              </span>
              <p className="text-rose-700 dark:text-rose-300 text-[11px] leading-relaxed">
                Your account (<span className="font-bold text-rose-950 dark:text-rose-100">{accountName}</span>) was just logged into on another browser tab or device.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
            <p>
              In accordance with <span className="font-bold text-slate-900 dark:text-white">Digital Personal Data Protection (DPDP) Act 2023</span> single-session integrity protocols, active telemetry and authenticated access on this tab have been disconnected to prevent unauthorized dual access.
            </p>
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>All local session credentials and tokens for this tab have been purged.</span>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onConfirm}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              <span>Return to Sign In Page</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
