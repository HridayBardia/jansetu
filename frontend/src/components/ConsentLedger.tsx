'use client';

import React from 'react';
import { ShieldCheck, History, XCircle, FileText, CheckCircle2, Lock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const MOCK_LEDGER_ENTRIES = [
  {
    id: 'c-101',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    department: 'Ministry of Corporate Affairs',
    purpose: 'Business Registration Verification',
    dataPoints: ['Aadhaar Number', 'PAN Number', 'Address Proof'],
    status: 'ACTIVE',
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: 'c-102',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    department: 'Department of Higher Education',
    purpose: 'Scholarship Eligibility Check',
    dataPoints: ['Income Certificate', '10th Marksheet', 'Domicile'],
    status: 'REVOKED',
    expires: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'c-103',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    department: 'Municipal Corporation',
    purpose: 'Property Tax Assessment',
    dataPoints: ['Property Deed', 'Identity Proof'],
    status: 'EXPIRED',
    expires: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  }
];

export function ConsentLedger({ consents, onRevoke }: { consents: any[], onRevoke?: (id: string) => void }) {
  const { t } = useLanguage();

  const ledgerEntries = consents.map(c => ({
    id: c.id,
    date: c.created_at || new Date().toISOString(),
    department: c.department,
    purpose: c.purpose,
    dataPoints: c.requestedFields || [],
    status: c.status,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  }));

  if (!ledgerEntries.length) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-center">
        <ShieldCheck className="w-8 h-8 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No consent records found.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Unified Consent Ledger</h2>
            <p className="text-xs text-slate-400">Cryptographically verifiable record of who accessed your data, when, and why.</p>
          </div>
        </div>
        <span className="bg-slate-950 border border-slate-800 text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          Protected by JanSetu
        </span>
      </div>

      <div className="relative z-10 space-y-6">
        {ledgerEntries.map((entry, idx) => (
          <div key={entry.id} className="relative pl-8">
            {/* Timeline Line */}
            {idx !== ledgerEntries.length - 1 && (
              <div className="absolute left-[15px] top-6 bottom-[-24px] w-px bg-slate-800" />
            )}
            
            {/* Timeline Dot */}
            <div className={`absolute left-[11px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-slate-950 ${
              entry.status === 'ACTIVE' ? 'bg-emerald-500' :
              entry.status === 'REVOKED' ? 'bg-rose-500' : 'bg-slate-500'
            }`} />

            <div className={`bg-slate-950 border p-4 rounded-xl transition-all duration-300 hover:shadow-lg ${
              entry.status === 'ACTIVE' ? 'border-emerald-500/30 hover:border-emerald-500/50' : 
              entry.status === 'REVOKED' ? 'border-rose-500/20 opacity-70 hover:opacity-100' : 'border-slate-800 opacity-60'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {new Date(entry.date).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-200">{entry.department}</h3>
                  <p className="text-sm text-slate-400 mt-1"><span className="text-slate-500">Purpose:</span> {entry.purpose}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {entry.dataPoints.map((dp: string, i: number) => (
                      <span key={i} className="flex items-center gap-1 text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded">
                        <FileText className="w-3 h-3 text-amber-500" />
                        {dp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {entry.status === 'ACTIVE' && (
                    <>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider">
                        Valid until {new Date(entry.expires).toLocaleDateString()}
                      </span>
                      <button 
                        onClick={() => onRevoke && onRevoke(entry.id)}
                        className="mt-2 text-[10px] font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 hover:border-rose-500 px-3 py-1.5 rounded transition">
                        Revoke Access Now
                      </button>
                    </>
                  )}
                  {entry.status === 'REVOKED' && (
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                      <XCircle className="w-3.5 h-3.5" /> REVOKED BY USER
                    </span>
                  )}
                  {entry.status === 'EXPIRED' && (
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1 bg-slate-800 px-2 py-1 rounded border border-slate-700">
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
