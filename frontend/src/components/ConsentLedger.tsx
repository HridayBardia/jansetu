'use client';

import React from 'react';
import { ShieldCheck, History, XCircle, FileText, CheckCircle2, Lock, Clock, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function ConsentLedger({ 
  consents, 
  onRevoke,
  onGrant
}: { 
  consents: any[]; 
  onRevoke?: (id: string) => void;
  onGrant?: (id: string, mode: 'ALWAYS' | 'ONCE') => void;
}) {
  const { t } = useLanguage();

  const ledgerEntries = consents.map(c => ({
    id: c.id,
    date: c.grantedDate || c.created_at || new Date().toISOString(),
    department: c.department,
    purpose: c.purpose,
    dataPoints: c.requestedFields || [],
    status: c.status,
    expires: c.expiryDate || new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  }));

  if (!ledgerEntries.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 shadow-sm text-center">
        <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-400 text-sm">No consent records found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 relative z-10 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-[#133E87] dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Unified DPDP Consent Ledger</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Cryptographically verifiable record of who accessed your data, when, and why.</p>
          </div>
        </div>
        <span className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Protected by DPDP Act
        </span>
      </div>

      <div className="relative z-10 space-y-4">
        {ledgerEntries.map((entry, idx) => (
          <div key={entry.id || idx} className="relative pl-6">
            {/* Timeline Line */}
            {idx !== ledgerEntries.length - 1 && (
              <div className="absolute left-[11px] top-6 bottom-[-16px] w-px bg-slate-200 dark:bg-slate-800" />
            )}
            
            {/* Timeline Dot */}
            <div className={`absolute left-[7px] top-3 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${
              entry.status === 'ACTIVE' ? 'bg-emerald-500' :
              entry.status === 'PENDING' ? 'bg-amber-500 animate-pulse' :
              entry.status === 'REVOKED' ? 'bg-rose-500' : 'bg-slate-400'
            }`} />

            <div className={`bg-slate-50 dark:bg-slate-950 border p-4 rounded-xl transition shadow-2xs ${
              entry.status === 'ACTIVE' ? 'border-emerald-300 dark:border-emerald-500/30' : 
              entry.status === 'PENDING' ? 'border-amber-300 dark:border-amber-500/40' :
              entry.status === 'REVOKED' ? 'border-rose-300 dark:border-rose-500/30 opacity-90' : 'border-slate-200 dark:border-slate-800 opacity-80'
            }`}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      {typeof entry.date === 'string' && entry.date.includes('T') ? new Date(entry.date).toLocaleString() : entry.date}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{entry.department}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold text-slate-700 dark:text-slate-300">Purpose:</span> {entry.purpose}</p>
                  
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {entry.dataPoints.map((dp: string, i: number) => (
                      <span key={i} className="flex items-center gap-1 text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
                        <FileText className="w-2.5 h-2.5 text-slate-400" />
                        {dp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-2 shrink-0 pt-1 md:pt-0">
                  {entry.status === 'ACTIVE' && (
                    <>
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-300 dark:border-emerald-800 uppercase">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Active Consent
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Valid until {typeof entry.expires === 'string' && entry.expires.includes('T') ? new Date(entry.expires).toLocaleDateString() : entry.expires}
                      </span>
                      <button 
                        onClick={() => onRevoke && onRevoke(entry.id)}
                        className="text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800 px-3 py-1.5 rounded-lg transition cursor-pointer shadow-2xs">
                        Revoke Access (DPDP Lock)
                      </button>
                    </>
                  )}
                  {entry.status === 'PENDING' && (
                    <>
                      <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded border border-amber-300 dark:border-amber-800 uppercase animate-pulse">
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Pending Authorization
                      </span>
                      <div className="flex items-center gap-1.5 pt-1">
                        <button 
                          onClick={() => onGrant && onGrant(entry.id, 'ALWAYS')}
                          className="text-[11px] font-bold text-white bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 px-3 py-1.5 rounded-lg transition cursor-pointer shadow-2xs">
                          Allow Always
                        </button>
                        <button 
                          onClick={() => onGrant && onGrant(entry.id, 'ONCE')}
                          className="text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-500 px-2.5 py-1.5 rounded-lg transition cursor-pointer shadow-2xs">
                          Allow Once
                        </button>
                      </div>
                    </>
                  )}
                  {entry.status === 'REVOKED' && (
                    <>
                      <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1 bg-rose-100 dark:bg-rose-950/60 px-2.5 py-1 rounded border border-rose-300 dark:border-rose-800 uppercase">
                        <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Revoked by Citizen
                      </span>
                      <button 
                        onClick={() => onGrant && onGrant(entry.id, 'ALWAYS')}
                        className="text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg transition cursor-pointer shadow-2xs flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Re-Authorize Access</span>
                      </button>
                    </>
                  )}
                  {entry.status === 'EXPIRED' && (
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700">
                      EXPIRED
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ConsentLedger;
