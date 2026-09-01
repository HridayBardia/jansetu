'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Key, 
  History, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  ShieldCheck, 
  FileText, 
  Clock, 
  ExternalLink,
  RotateCcw,
  Check,
  AlertCircle
} from 'lucide-react';
import { useMockData } from '@/context/MockDataContext';
import { useLiveSync, ConsentRecord } from '@/context/LiveSyncContext';
import { createConsentAPI, revokeConsentAPI } from '@/lib/api';

interface YourDataConsentProps {
  auditLogs?: any[];
  loadInteropData?: () => void;
}

export const YourDataConsent: React.FC<YourDataConsentProps> = ({ 
  auditLogs = [], 
  loadInteropData = () => {} 
}) => {
  const { t } = useLanguage();
  const { revokeConsent: mockRevokeConsent } = useMockData();
  const { 
    consents: liveConsents, 
    broadcastConsentRevoked, 
    broadcastConsentGranted,
    authorizeCitizenDoc,
    grantConsent: contextGrantConsent,
    revokeConsent: contextRevokeConsent
  } = useLiveSync();
  const [selectedConsent, setSelectedConsent] = useState<ConsentRecord | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const consents = liveConsents && liveConsents.length > 0 ? liveConsents : [
    { id: 'cst_001', department: 'UIDAI Aadhaar Gateway', purpose: 'Identity & Biometric e-KYC Verification', requestedFields: ['Name', 'DOB', 'Photo', 'Aadhaar Number'], status: 'ACTIVE' as const, grantedDate: '18 Aug 2026', expiryDate: '18 Feb 2027' },
    { id: 'cst_002', department: 'Ministry of Education', purpose: 'Scholarship & Academic Marksheet Scrutiny', requestedFields: ['Class 10/12 Marksheet', 'Degree Certificate'], status: 'ACTIVE' as const, grantedDate: '21 Aug 2026', expiryDate: '21 Aug 2027' },
    { id: 'cst_003', department: 'Ministry of Road Transport (MoRTH)', purpose: 'Driving Licence & Address Verification', requestedFields: ['Identity Proof', 'Residential Address'], status: 'PENDING' as const },
    { id: 'cst_004', department: 'Municipal Corporation (ULB)', purpose: 'Property Tax & Trade License Assessment', requestedFields: ['Property Assessment Record'], status: 'REVOKED' as const, grantedDate: '15 Jan 2026', expiryDate: '15 Jul 2026' },
    { id: 'cst_005', department: 'Income Tax Department (CBDT)', purpose: 'Annual Income & Financial Capacity Verification', requestedFields: ['PAN Card', 'Income Certificate'], status: 'ACTIVE' as const, grantedDate: '22 Aug 2026', expiryDate: '22 Nov 2026' }
  ];

  const activeCount = consents.filter(c => c.status === 'ACTIVE').length;
  const pendingCount = consents.filter(c => c.status === 'PENDING').length;
  const revokedCount = consents.filter(c => c.status === 'REVOKED').length;

  const handleRevoke = (c: ConsentRecord) => {
    mockRevokeConsent(c.id);
    contextRevokeConsent(c.id, c.department);
    broadcastConsentRevoked(c.department, c.id);
    revokeConsentAPI(c.id).catch(() => {});
    loadInteropData();
    setActionSuccessMsg(`🔒 Revoked DPDP Access: ${c.department} cannot query your vault documents.`);
    setTimeout(() => setActionSuccessMsg(null), 4500);
  };

  const handleGrant = (c: ConsentRecord, mode: 'ALWAYS' | 'ONCE') => {
    contextGrantConsent(c.id, c.department);
    broadcastConsentGranted(c.department, c.id);
    createConsentAPI(c.id, c.department, c.requestedFields, c.purpose, mode).catch(() => {});
    if (c.requestedFields && c.requestedFields.length > 0) {
      c.requestedFields.forEach((field: string) => {
        authorizeCitizenDoc({ appId: 'JS-2026-8801', docName: field, dept: c.department });
      });
    }
    loadInteropData();
    setActionSuccessMsg(`✓ DPDP Consent Granted to ${c.department} (${mode === 'ALWAYS' ? 'Permanent' : 'Single Transaction'}).`);
    setTimeout(() => setActionSuccessMsg(null), 4500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification Banner */}
      {actionSuccessMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-xl p-3.5 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-sm animate-fadeIn">
          <span className="font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {actionSuccessMsg}
          </span>
          <button 
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Consent Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
              {t('consent.activeConsents', 'Active DPDP Consents')}
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
              {activeCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
              {t('consent.pendingRequests', 'Pending Inquiries')}
            </span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5 block">
              {pendingCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
              {t('consent.revokedAccounts', 'Revoked / Locked')}
            </span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5 block">
              {revokedCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Unified Consent Ledger Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-[#133E87] dark:text-blue-400" />
              <span>{t('consent.yourDataConsent', 'DPDP Electronic Consent Manager')}</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {t('consent.tagline', 'Sovereign personal data control under the Digital Personal Data Protection Act, 2023. Authorize, restrict, or revoke access to your verified e-KYC documents dynamically.')}
            </p>
          </div>
          <span className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#133E87] dark:text-blue-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t('Protected by DPDP Act 2023', 'Protected by DPDP Act 2023')}</span>
          </span>
        </div>

        {/* Consents List */}
        <div className="space-y-4">
          {consents.map((c, idx) => {
            const isActive = c.status === 'ACTIVE';
            const isPending = c.status === 'PENDING';
            const isRevoked = c.status === 'REVOKED';

            return (
              <div 
                key={`${c.id || c.department}_${idx}`} 
                className={`bg-slate-50 dark:bg-slate-950 border rounded-xl p-5 space-y-4 shadow-2xs transition ${
                  isActive 
                    ? 'border-emerald-300 dark:border-emerald-500/30 border-l-4 border-l-emerald-500' 
                    : isPending 
                    ? 'border-amber-300 dark:border-amber-500/40 border-l-4 border-l-amber-500' 
                    : 'border-rose-300 dark:border-rose-500/30 border-l-4 border-l-rose-500 opacity-90'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        isActive ? 'bg-emerald-500' : isPending ? 'bg-amber-500 animate-ping' : 'bg-rose-500'
                      }`} />
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {t(c.department, c.department)}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{t('Statutory Purpose:', 'Statutory Purpose:')}</span> {t(c.purpose, c.purpose)}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">{t('Authorized Fields:', 'Authorized Fields:')}</span>
                      {(c.requestedFields || []).map((field, fIdx) => (
                        <span 
                          key={fIdx} 
                          className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-mono font-bold text-[#133E87] dark:text-blue-400 shadow-2xs flex items-center gap-1"
                        >
                          <FileText className="w-2.5 h-2.5 text-slate-400" />
                          <span>{t(field, field)}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-col md:items-end gap-1.5 shrink-0">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 self-start md:self-auto ${
                      isActive
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : isRevoked 
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800' 
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse'
                    }`}>
                      {isActive && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                      {isRevoked && <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />}
                      {isPending && <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                      <span>
                        {isActive ? t('Active DPDP Consent', 'Active DPDP Consent') : isRevoked ? t('Revoked by Citizen', 'Revoked by Citizen') : t('Pending Authorization', 'Pending Authorization')}
                      </span>
                    </span>

                    {c.expiryDate && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {t('Valid until:', 'Valid until:')} {c.expiryDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-3 text-xs">
                  <button
                    onClick={() => setSelectedConsent(c)}
                    className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer shadow-2xs"
                  >
                    {t('consent.viewDetails', 'View Details')}
                  </button>

                  {isPending && (
                    <>
                      <button
                        onClick={() => handleGrant(c, 'ALWAYS')}
                        className="bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer shadow-2xs flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t('Allow Always', 'Allow Always')}</span>
                      </button>
                      <button
                        onClick={() => handleGrant(c, 'ONCE')}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer shadow-2xs"
                      >
                        <span>{t('Allow Once (Single Transaction)', 'Allow Once (Single Transaction)')}</span>
                      </button>
                    </>
                  )}

                  {isActive && (
                    <button
                      onClick={() => handleRevoke(c)}
                      className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{t('consent.revokeAccess', 'Revoke Access (DPDP Lock)')}</span>
                    </button>
                  )}

                  {isRevoked && (
                    <button
                      onClick={() => handleGrant(c, 'ALWAYS')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t('Re-Authorize DPDP Access', 'Re-Authorize DPDP Access')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Immutable Audit Log Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-[#133E87] dark:text-blue-400" />
            <span>{t('consent.auditTrail', 'Immutable Data Access Audit Trail')}</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-0.5 rounded">
            {t('256-bit Encrypted Ledger', '256-bit Encrypted Ledger')}
          </span>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs max-h-72 overflow-y-auto">
          {auditLogs.length === 0 ? (
            <div className="p-6 text-center text-slate-500 dark:text-slate-400">
              <p>{t('dataQuality.noAuditEvents', 'No recent cross-departmental access logs recorded.')}</p>
            </div>
          ) : (
            auditLogs.map((log: any, idx: number) => (
              <div 
                key={`${log.id || log.action || 'log'}_${idx}`} 
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#133E87] dark:text-blue-400 px-2 py-0.5 rounded bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-[10px]">
                      {log.action || 'CONSENT_QUERY'}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {log.resource || log.department || 'Government Vault Query'}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Status: <strong className="text-emerald-600 dark:text-emerald-400">{log.status || 'GRANTED_VERIFIED'}</strong>
                  </p>
                </div>
                <span className="text-[11px] text-slate-500 font-mono shrink-0">
                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Consent Details Modal Overlay */}
      {selectedConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl relative z-10 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#133E87] dark:text-blue-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">DPDP Statutory Consent Record</h3>
              </div>
              <button
                onClick={() => setSelectedConsent(null)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-3">
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Requesting Authority</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedConsent.department}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Statutory Purpose</span>
                  <p className="text-slate-700 dark:text-slate-300">{selectedConsent.purpose}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Authorized Verified Fields</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedConsent.requestedFields || []).map((f, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded font-mono font-bold text-[#133E87] dark:text-blue-400">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3.5 space-y-1">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Digital Personal Data Protection Act, 2023 Compliance</span>
                  </p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed">
                    By confirming this consent, you grant the department time-bound verification access to credentials stored in your sovereign JanSetu vault. You retain the right to modify or revoke this access at any time.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                {selectedConsent.status === 'PENDING' ? (
                  <>
                    <button
                      onClick={() => {
                        handleGrant(selectedConsent, 'ALWAYS');
                        setSelectedConsent(null);
                      }}
                      className="flex-1 bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs cursor-pointer"
                    >
                      Approve & Grant
                    </button>
                    <button
                      onClick={() => setSelectedConsent(null)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectedConsent(null)}
                    className="w-full bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-xs"
                  >
                    Close Record
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

export default YourDataConsent;
