'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ShieldCheck, Lock, Trash2, Key, History, CheckCircle2, AlertCircle } from 'lucide-react';
import { ConsentRecord, AuditLogEntry } from '@/types';

interface PrivacyCenterProps {
  consents: ConsentRecord[];
  auditLogs: AuditLogEntry[];
  onRevokeConsent: (id: string) => void;
}

export const PrivacyCenter: React.FC<PrivacyCenterProps> = ({
  consents,
  auditLogs,
  onRevokeConsent
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'consents' | 'audit'>('consents');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span>{t("consent.dashboard")}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            &ldquo;Don&apos;t own the data; orchestrate authorized access to it.&rdquo; You maintain full control over all data permissions and access trails.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('consents')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'consents' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Active Scopes ({consents.filter((c) => c.is_active).length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'audit' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Log ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Active Permissions */}
      {activeTab === 'consents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {consents.map((c) => (
            <div
              key={c.id}
              className={`rounded-2xl border p-5 transition flex flex-col justify-between ${
                c.is_active
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-slate-950/60 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {c.scope}
                  </span>
                  {c.is_active ? (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active Permission
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-rose-400">{t("consent.accessRevoked")}</span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-100">{c.purpose}</h3>
                <p className="text-xs text-slate-400">Granted at: {new Date(c.granted_at).toLocaleString()}</p>
              </div>

              {c.is_active && (
                <div className="pt-4 mt-4 border-t border-slate-800">
                  <button
                    onClick={() => onRevokeConsent(c.id)}
                    className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t("consent.revokeInstantly")}</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Immutable Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>{t("dataQuality.auditTrail")}</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{t("dataQuality.encryptedLogs")}</span>
          </div>

          <div className="divide-y divide-slate-800/80 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-800/40 transition flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px]">
                      {log.action}
                    </span>
                    <span className="font-semibold text-slate-200">{log.resource}</span>
                  </div>
                  <p className="text-slate-300">{log.details}</p>
                </div>
                <span className="text-[11px] text-slate-500 shrink-0 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
