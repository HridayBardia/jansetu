import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Key, History, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { useMockData } from '@/context/MockDataContext';
import { useLiveSync } from '@/context/LiveSyncContext';
import { createConsentAPI, revokeConsentAPI } from '@/lib/api';

interface YourDataConsentProps {
  auditLogs: any[];
  loadInteropData: () => void;
}

export const YourDataConsent: React.FC<YourDataConsentProps> = ({ auditLogs, loadInteropData }) => {
  const { t } = useLanguage();
  const { revokeConsent: mockRevokeConsent } = useMockData();
  const { 
    consents: liveConsents, 
    broadcastConsentRevoked, 
    broadcastConsentGranted,
    authorizeCitizenDoc
  } = useLiveSync();
  const [selectedConsent, setSelectedConsent] = useState<any | null>(null);

  const consents = liveConsents;
  const activeCount = consents.filter(c => c.status === 'ACTIVE').length;
  const pendingCount = consents.filter(c => c.status === 'PENDING').length;
  const revokedCount = consents.filter(c => c.status === 'REVOKED').length;

  const handleRevoke = (c: any) => {
    mockRevokeConsent(c.id);
    broadcastConsentRevoked(c.department, c.id);
    revokeConsentAPI(c.id).catch(() => {});
    loadInteropData();
  };

  const handleGrant = (c: any, mode: 'ALWAYS' | 'ONCE') => {
    broadcastConsentGranted(c.department, c.id);
    createConsentAPI(c.id, c.department, c.requestedFields, c.purpose, mode).catch(() => {});
    if (c.requestedFields && c.requestedFields.length > 0) {
      c.requestedFields.forEach((field: string) => {
        authorizeCitizenDoc({ appId: 'JS-2026-8801', docName: field, dept: c.department });
      });
    }
    loadInteropData();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Consent stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-4 text-center shadow-2xs">
          <span className="text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">{t('consent.activeConsents', 'Active Consents')}</span>
          <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 block">{activeCount}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-4 text-center shadow-2xs">
          <span className="text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">{t('consent.pendingRequests', 'Pending Requests')}</span>
          <span className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1 block">{pendingCount}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-4 text-center shadow-2xs">
          <span className="text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">{t('consent.revokedAccounts', 'Revoked Accounts')}</span>
          <span className="text-xl font-bold text-slate-600 dark:text-slate-400 mt-1 block">{revokedCount}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-[#133E87] dark:text-blue-400" />
            <span>{t('consent.yourDataConsent', 'Your Data & Privacy Consent')}</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t('consent.tagline', 'You control privacy under the Digital Personal Data Protection Act, 2023. Authorize, restrict, or revoke access to your verified e-KYC documents dynamically.')}
          </p>
        </div>

        {/* List of consents */}
        <div className="space-y-4">
          {consents.map((c, idx) => (
            <div key={`${c.id || c.department || 'cst'}_${idx}`} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-5 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{c.department}</h4>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">Purpose: {c.purpose}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Requested Fields: <span className="font-mono text-[#133E87] dark:text-blue-400 font-bold">{(c.requestedFields || []).join(", ")}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                    c.status === 'ACTIVE'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : c.status === 'REVOKED' ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse'
                  }`}>
                    {c.status === 'ACTIVE' ? t('consent.activeConsent', 'Active Consent') : c.status === 'REVOKED' ? t('consent.revokedLocked', 'Revoked (Locked)') : t('consent.pendingAuth', 'Pending Authorization')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-end border-t border-slate-200 dark:border-slate-700 pt-3">
                <button
                  onClick={() => setSelectedConsent(c)}
                  className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold px-3 py-1.5 rounded text-xs transition cursor-pointer shadow-2xs"
                >
                  {t('consent.viewDetails', 'View Details')}
                </button>
                {c.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleGrant(c, 'ALWAYS')}
                      className="bg-[#0B2545] hover:bg-[#133E87] text-white font-semibold px-3.5 py-1.5 rounded text-xs transition cursor-pointer shadow-2xs"
                    >
                      {t('consent.allowAlways', 'Allow Always')}
                    </button>
                    <button
                      onClick={() => handleGrant(c, 'ONCE')}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-3.5 py-1.5 rounded text-xs transition cursor-pointer shadow-2xs"
                    >
                      {t('consent.allowOnce', 'Allow Once')}
                    </button>
                  </>
                )}
                {c.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleRevoke(c)}
                    className="text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold border border-red-200 dark:border-red-900 px-3 py-1.5 rounded text-xs transition cursor-pointer shadow-2xs"
                  >
                    {t('consent.revokeAccess', 'Revoke Access (DPDP Lock)')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-[#133E87] dark:text-blue-400" />
            <span>{t('consent.auditTrail', 'Immutable Data Access Audit Trail')}</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">256-bit Encrypted Logs</span>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs max-h-64 overflow-y-auto">
          {auditLogs.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <p>{t("dataQuality.noAuditEvents")}</p>
            </div>
          ) : auditLogs.map((log: any, idx: number) => (
            <div key={`${log.id || log.action || 'log'}_${idx}`} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#133E87] dark:text-blue-400 px-2 py-0.5 rounded bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-[10px]">
                    {log.action}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{log.resource}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">{log.status || 'SUCCESS'}</p>
              </div>
              <span className="text-[11px] text-slate-500 shrink-0 font-mono">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Consent Modal Overlay */}
      {selectedConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedConsent(null)} />
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl relative z-10 w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">DPDP Consent Record</h3>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Department</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedConsent.department}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Purpose of Access</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedConsent.purpose}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Fields Authorized</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedConsent.requestedFields.map((f: string, idx: number) => (
                      <span key={`${f}_${idx}`} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono">{f}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded p-3 mt-4">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-500 mb-1">Digital Personal Data Protection Act, 2023</p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400">By approving this, you authorize the department to access specific verified credentials from your JanSetu vault. You can revoke this access at any time.</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                {selectedConsent.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => {
                        createConsentAPI(selectedConsent.id, selectedConsent.department, selectedConsent.requestedFields, selectedConsent.purpose, "ONCE").then(() => {
                          setSelectedConsent(null);
                          loadInteropData();
                        });
                      }}
                      className="flex-1 bg-[#0B2545] hover:bg-[#133E87] text-white font-bold py-2 rounded text-xs transition shadow-xs"
                    >
                      Approve Consent
                    </button>
                    <button
                      onClick={() => {
                        setSelectedConsent(null);
                      }}
                      className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-800 dark:text-white font-bold py-2 rounded text-xs transition"
                    >
                      Deny
                    </button>
                  </>
                )}
                {selectedConsent.status !== 'PENDING' && (
                  <button
                    onClick={() => {
                      setSelectedConsent(null);
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-800 dark:text-white font-bold py-2 rounded text-xs transition"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
