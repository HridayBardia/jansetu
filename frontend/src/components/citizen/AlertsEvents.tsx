'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { 
  Bell, 
  Activity, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Upload, 
  Loader2, 
  FileText,
  RefreshCw,
  FolderLock
} from 'lucide-react';
import { useLiveSync } from '@/context/LiveSyncContext';
import { checkDocInVault, isCitizenMatching } from '@/lib/vaultDetection';
import { eventBus } from '@/utils/eventBus';

interface PolicyTrigger {
  id: string;
  tag: string;
  tagColor: string;
  effectiveDate: string;
  title: string;
  description: string;
  relevantState?: string;
}

const POLICY_POOL: PolicyTrigger[] = [
  {
    id: 'pol_rj_01',
    tag: 'Rajasthan State Welfare',
    tagColor: 'emerald',
    effectiveDate: 'Effective: 15 Aug 2026',
    title: 'Rajasthan Direct Benefit Transfer & Jan Aadhaar 2.0 Integration',
    description: 'Accelerates Aadhaar-seeded treasury disbursement for state agriculture, scholarship, and housing beneficiaries within 24 hours.',
    relevantState: 'Rajasthan'
  },
  {
    id: 'pol_gj_01',
    tag: 'Gujarat Labour & Education',
    tagColor: 'amber',
    effectiveDate: 'Effective: 01 June 2026',
    title: 'Gujarat Single Window Apprenticeship Clearance & Digital Stipend Framework',
    description: 'Mandates polytechnic and diploma credential auto-verification via state DigiLocker gateway for MSME apprentices in Vadodara and Ahmedabad.',
    relevantState: 'Gujarat'
  },
  {
    id: 'pol_mh_01',
    tag: 'Maharashtra Rural Development',
    tagColor: 'blue',
    effectiveDate: 'Effective: 10 July 2026',
    title: 'PMAY-Gramin Geo-Tagged Site Verification Mandate',
    description: 'Replaces manual physical inspection with satellite and geo-spatial stamped photographs for faster subsidy installment release in Pune and rural zones.',
    relevantState: 'Maharashtra'
  },
  {
    id: 'pol_ka_01',
    tag: 'Karnataka Trade Policy',
    tagColor: 'indigo',
    effectiveDate: 'Effective: 01 April 2026',
    title: 'Karnataka Single Window Clearance Amendment',
    description: 'Updates trade licensing rules for commercial food businesses in BBMP limits, reducing approval timelines from 15 to 7 days.',
    relevantState: 'Karnataka'
  },
  {
    id: 'pol_dpdp_01',
    tag: 'National Digital Policy',
    tagColor: 'purple',
    effectiveDate: 'Effective: 01 Oct 2026',
    title: 'DPDP Act 2023 Enforcement Protocol (Section 6 & 11)',
    description: 'Enforces real-time digital consent handshakes and instant data purge rights across all central and state welfare registry queries.',
  },
  {
    id: 'pol_health_01',
    tag: 'Ministry of Health & Family Welfare',
    tagColor: 'rose',
    effectiveDate: 'Effective: 20 Aug 2026',
    title: 'Ayushman Bharat PM-JAY Instant Family ID Linking',
    description: 'Enables automated ration card NFSA cross-verification for paperless hospital cashless pre-authorization nationwide.',
  },
  {
    id: 'pol_agri_01',
    tag: 'Ministry of Agriculture',
    tagColor: 'teal',
    effectiveDate: 'Effective: 05 Aug 2026',
    title: 'PM-KISAN Khasra Geo-Registry e-Authentication Protocol',
    description: 'Synchronizes state land revenue records directly with Central DBT portal, eliminating in-person tehsil land deed submission.',
  }
];

export const AlertsEvents: React.FC = () => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const { notifications: liveSyncNotifs, docRequests: liveSyncDocRequests, pendingKycRequest, authorizeCitizenDoc, dismissPendingKycRequest } = useLiveSync();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activePolicies, setActivePolicies] = useState<PolicyTrigger[]>([]);
  const [isRefreshingPolicies, setIsRefreshingPolicies] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Dynamic Webhook Notifications Feed initialized from LiveSync Context
  const webhookAlerts = useMemo(() => {
    let citName = profile?.full_name || '';
    let citAadhaar = profile?.aadhaar || '';
    let citUser = '';

    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem('jansetu_citizen_session') || localStorage.getItem('jansetu_citizen_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          const u = parsed.user || {};
          const p = parsed.profile || {};
          citName = citName || p.full_name || u.full_name || '';
          citAadhaar = citAadhaar || p.aadhaar || u.id || '';
          citUser = citUser || u.username || '';
        }
      } catch {}

      if (!citName && !citAadhaar) {
        try {
          const rawDemo = sessionStorage.getItem('demo_citizen') || localStorage.getItem('demo_citizen');
          if (rawDemo) {
            const parsed = JSON.parse(rawDemo);
            citName = parsed.name || parsed.full_name || '';
            citAadhaar = parsed.aadhaar || parsed.rawAadhaar || parsed.id || '';
            citUser = parsed.username || '';
          }
        } catch {}
      }
    }

    // Fallback default for citizen dashboard (Hriday Bardia)
    if (!citName && !citAadhaar) {
      citName = 'Hriday Bardia';
      citAadhaar = '1111 2222 1405';
    }

    const filtered = liveSyncDocRequests.filter(req => 
      isCitizenMatching(
        { citizenName: req.citizenName, citizenId: req.citizenId, appId: req.appId },
        { name: citName, aadhaar: citAadhaar, username: citUser }
      )
    );

    return filtered.map(req => ({
      id: req.id,
      appId: req.appId || req.id,
      schemeName: 'National Apprenticeship Training Scheme (NATS)',
      deptName: req.deptName,
      targetCitizenName: req.citizenName,
      requestedDoc: req.docType,
      docType: req.docType,
      timestamp: req.requestedAt,
      status: req.status === 'PENDING' ? 'ACTION_REQUIRED' : 'RESOLVED',
      type: 'DOC_KYC_REQUEST',
      category: 'Document'
    }));
  }, [liveSyncDocRequests, profile]);

  // Shuffle and pick 2-3 randomized & profile-relevant policies on every refresh/mount
  const refreshPolicies = () => {
    setIsRefreshingPolicies(true);
    const userState = (profile?.location_state || '').toLowerCase();
    
    // Pick state-relevant policy first if available
    const stateMatched = POLICY_POOL.filter(p => p.relevantState && userState && p.relevantState.toLowerCase().includes(userState));
    const others = POLICY_POOL.filter(p => !stateMatched.some(s => s.id === p.id));
    
    // Shuffle others randomly
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
    const combined = [...stateMatched, ...shuffledOthers].slice(0, 2);

    // If no state match, just take 2 random ones
    if (combined.length < 2) {
      const fallback = [...POLICY_POOL].sort(() => Math.random() - 0.5).slice(0, 2);
      setActivePolicies(fallback);
    } else {
      setActivePolicies(combined);
    }

    setTimeout(() => setIsRefreshingPolicies(false), 400);
  };

  useEffect(() => {
    refreshPolicies();
  }, [profile?.location_state]);

  const handleShareFromVaultItem = (alertItem: any) => {
    const docName = alertItem.requestedDoc || alertItem.docName || 'Polytechnic Marksheet';
    const targetAppId = alertItem.appId || 'JS-2026-8802';
    const targetDept = alertItem.deptName || alertItem.dept || 'Ministry of Education';

    setIsProcessing(true);

    setTimeout(() => {
      // 1. Update global LiveSync state (Supabase will handle real-time sync across devices)
      authorizeCitizenDoc({
        appId: targetAppId,
        docName: docName,
        dept: targetDept,
        citizenName: profile?.full_name || 'Hriday Bardia'
      });

      setIsProcessing(false);
      setSuccessMsg(`✓ ${docName} securely shared with ${targetDept}!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const docName = pendingKycRequest?.docName || webhookAlerts.find(a => a.type === 'DOC_KYC_REQUEST')?.requestedDoc || 'Document';
    const targetAppId = pendingKycRequest?.appId || webhookAlerts.find(a => a.type === 'DOC_KYC_REQUEST')?.appId || 'JS-2026-8802';
    const targetDept = pendingKycRequest?.dept || webhookAlerts.find(a => a.type === 'DOC_KYC_REQUEST')?.deptName || 'Ministry of Education';

    setUploadedName(file.name);
    setIsUploading(true);

    setTimeout(() => {
      // 1. Update global LiveSync state
      authorizeCitizenDoc({
        appId: targetAppId,
        docName: `${docName} (${file.name})`,
        dept: targetDept,
        citizenName: profile?.full_name || 'Hriday Bardia'
      });

      setIsUploading(false);
      setSuccessMsg(`✓ Attested document file "${file.name}" uploaded and transmitted to ${targetDept}.`);
      setTimeout(() => {
        setSuccessMsg(null);
        setUploadedName(null);
      }, 4000);
    }, 1000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        className="hidden"
      />

      {/* Regulatory Policy Triggers (Dynamically mapped and changes on every refresh) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#133E87] dark:text-blue-400" />
              <span>{t('alerts.regulatoryPolicyTriggers', 'Regulatory Policy Triggers')}</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {t('alerts.regulatoryDesc', 'Official regulatory policy triggers automatically mapped to your location and profile.')}
            </p>
          </div>

          <button
            type="button"
            onClick={refreshPolicies}
            disabled={isRefreshingPolicies}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
            title="Refresh mapped regulatory policies"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingPolicies ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
        
        <div className="space-y-4">
          {activePolicies.map((policy) => {
            const tagBg = 
              policy.tagColor === 'emerald' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
              policy.tagColor === 'amber' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
              policy.tagColor === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
              policy.tagColor === 'indigo' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' :
              policy.tagColor === 'purple' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800' :
              policy.tagColor === 'rose' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800' :
              'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800';

            return (
              <div 
                key={policy.id} 
                className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2 shadow-2xs transition hover:border-[#133E87]/40 dark:hover:border-blue-500/40"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-bold border px-2 py-0.5 rounded text-[11px] ${tagBg}`}>
                    {policy.tag}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{policy.effectiveDate}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{policy.title}</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{policy.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event-driven Notifications */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#133E87] dark:text-blue-400" />
            <span>{t('alerts.eventDrivenNotifications', 'Event-Driven Webhook Notifications')}</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t('alerts.eventDesc', 'Real-time department webhook feeds tracking your applications and requests.')}
          </p>
        </div>

        {/* Success / Confirmation Feedback Banner */}
        {successMsg && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 p-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-fade-in shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-3">
          {webhookAlerts.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-6 rounded-xl text-center text-slate-500 text-xs space-y-1">
              <Bell className="w-6 h-6 mx-auto text-slate-400 opacity-40 mb-2" />
              <p className="font-semibold">{t('alerts.noNotifications', 'No notifications yet.')}</p>
              <p className="text-[11px] text-slate-400">Real-time alerts, status updates, and department e-KYC requests will appear here when requested for your account.</p>
            </div>
          ) : (
            webhookAlerts.map((item: any, idx: number) => {
              // 1. Check if this is an interactive DOC_KYC_REQUEST item
              const isKycRequest = item.type === 'DOC_KYC_REQUEST';
              const isActionRequired = item.status === 'ACTION_REQUIRED' || !item.status;
              const isResolved = item.status === 'RESOLVED';

              if (isKycRequest && isActionRequired) {
                const docName = item.requestedDoc || item.docName || 'Polytechnic Marksheet';
                const vaultCheck = checkDocInVault(docName);

                return (
                  <div 
                    key={item.id || `notif-kyc-${idx}`}
                    className="bg-gradient-to-r from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-slate-900 border-2 border-amber-500 rounded-2xl p-4 my-2 shadow-md space-y-3 animate-scaleUp text-slate-900 dark:text-white"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                        <h4 className="text-amber-900 dark:text-amber-300 font-bold text-xs">
                          Action Required: Document {docName.toLowerCase().includes('aadhaar') || docName.toLowerCase().includes('kyc') ? 'e-KYC' : 'Request'}
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono font-bold">{item.timestamp || 'Just now'}</span>
                    </div>

                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                      <strong>{item.deptName || item.dept || 'Ministry of Education'}</strong> requested {docName.toLowerCase().includes('aadhaar') || docName.toLowerCase().includes('kyc') ? 'e-KYC verification' : 'a verified copy'} for <strong>{docName}</strong> (App #{item.appId || 'JS-2026-8802'}).
                    </p>

                    {/* Vault Detection Notice */}
                    {vaultCheck.isInVault ? (
                      <div className="py-2 px-3 rounded-xl bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-300 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>✓ Verified record located in your DigiLocker Vault</span>
                        </span>
                        <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded shadow-xs">8 Verified Files</span>
                      </div>
                    ) : (
                      <div className="py-2 px-3 rounded-xl bg-amber-100/90 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>⚠️ Document Not Found in Digital Vault</span>
                        </span>
                        <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded shadow-xs">Upload Required</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      {vaultCheck.isInVault ? (
                        <>
                          <button
                            type="button"
                            disabled={isProcessing || isUploading}
                            onClick={() => handleShareFromVaultItem(item)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Attesting & Transmitting...</span>
                              </>
                            ) : (
                              <>
                                <FolderLock className="w-3.5 h-3.5" />
                                <span>⚡ Share from Document Vault</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing || isUploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>📤 Upload Manual Copy</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={isProcessing || isUploading}
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>📤 Upload Required Document</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              if (isKycRequest && isResolved) {
                return (
                  <div 
                    key={item.id || `notif-kyc-res-${idx}`}
                    className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl p-3.5 flex gap-3 text-xs shadow-2xs transition animate-scaleUp"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-emerald-900 dark:text-emerald-200">e-KYC Verification Completed</span>
                        <span className="text-[9px] text-slate-500 font-mono">{item.timestamp || 'Just now'}</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
                        {item.resolvedText || `✓ Verified ${item.requestedDoc || 'Polytechnic Marksheet'} shared with ${item.deptName || 'Ministry of Education'}.`}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={`${item.id || 'notif'}-${idx}`} 
                  className={`bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 flex gap-3 text-xs shadow-2xs transition animate-scaleUp ${item.isNew ? 'border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-slate-700 flex items-center justify-center text-[#133E87] dark:text-blue-400 shrink-0">
                    <Sparkles className="w-4 h-4 text-[#133E87] dark:text-blue-400" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-slate-200">{t(item.category || item.title || 'Event Log', item.category || item.title || 'Event Log')}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{t(item.timestamp || 'Just now', item.timestamp || 'Just now')}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{t(item.message || item.description || '', item.message || item.description || '')}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsEvents;
