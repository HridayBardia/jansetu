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
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>{t("consent.dashboard", "Privacy & Electronic Consent Center")}</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            &ldquo;Don&apos;t own the data; orchestrate authorized access to it.&rdquo; You maintain full control over all data permissions and access trails under the DPDP Act 2023.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('consents')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'consents' ? 'bg-[#0B2545] text-white font-bold shadow-xs' : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Active Scopes ({consents.filter((c) => c.is_active).length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'audit' ? 'bg-[#0B2545] text-white font-bold shadow-xs' : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
              className={`rounded-2xl border p-5 transition flex flex-col justify-between shadow-2xs ${
                c.is_active
                  ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/60 opacity-60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {c.scope}
                  </span>
                  {c.is_active ? (
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active Permission
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400">{t("consent.accessRevoked", "Access Revoked")}</span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.purpose}</h3>
                <p className="text-xs text-slate-500">Granted: {new Date(c.granted_at).toLocaleString()}</p>
              </div>

              {c.is_active && (
                <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => onRevokeConsent(c.id)}
                    className="w-full py-2 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t("consent.revokeInstantly", "Revoke Access (DPDP Lock)")}</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Immutable Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-[#133E87] dark:text-blue-400" />
              <span>{t("dataQuality.auditTrail", "Tamper-Evident Consent Ledger")}</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">{t("dataQuality.encryptedLogs", "SHA-256 Encrypted")}</span>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-[10px]">
                      {log.action}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-200">{log.resource}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
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
export default PrivacyCenter;
