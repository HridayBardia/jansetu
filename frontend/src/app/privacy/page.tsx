'use client';

import React, { useState, useEffect } from 'react';
import { fetchPrivacyDataAPI, toggleConsentAPI } from '@/lib/api';
import { ShieldCheck, Lock, Key, Eye, Trash2, Download, CheckCircle2 } from 'lucide-react';

export default function PrivacyPage() {
  const [privacyData, setPrivacyData] = useState<{ consents: any[]; access_logs: any[] }>({
    consents: [],
    access_logs: []
  });

  useEffect(() => {
    fetchPrivacyDataAPI().then((data) => setPrivacyData(data));
  }, []);

  const handleToggle = async (purpose: string, currentStatus: boolean) => {
    const updated = await toggleConsentAPI(purpose, !currentStatus);
    if (updated) {
      fetchPrivacyDataAPI().then((data) => setPrivacyData(data));
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h1 className="text-2xl font-black text-white">Citizen Privacy Center</h1>
        </div>
        <p className="text-xs text-slate-400">
          Privacy-first architecture. You maintain full granular consent control over your data access history and connected verification services.
        </p>
      </div>

      {/* Permissions & Consents */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-400" />
          <span>Active Data Consents & Permissions</span>
        </h3>

        <div className="space-y-3">
          {privacyData.consents.map((consent, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-white">{consent.purpose}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Granted: {new Date(consent.granted_at).toLocaleDateString()}</p>
              </div>

              <button
                onClick={() => handleToggle(consent.purpose, consent.granted)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  consent.granted
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {consent.granted ? 'Allowed ✓' : 'Revoked ✕'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Data Access Audit History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-400" />
          <span>Data Access Audit Logs</span>
        </h3>

        <div className="space-y-2">
          {privacyData.access_logs.map((log, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white">{log.service}</span>
                <span className="text-slate-400 ml-2">— {log.action}</span>
                <p className="text-[11px] text-slate-500 mt-0.5">{log.purpose}</p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
