'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Briefcase, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  X, 
  FileText, 
  RefreshCw, 
  AlertCircle, 
  Search, 
  ShieldCheck, 
  UserCheck, 
  ExternalLink,
  ChevronRight,
  Send,
  Lock,
  Sparkles,
  Radio
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useLiveSync, ApplicationRecord } from '@/context/LiveSyncContext';
import { eventBus } from '@/utils/eventBus';

interface Props {
  adminUsername: string;
}

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20',
  UNDER_VERIFICATION: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  UNDER_REVIEW: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
  DOCUMENTS_REQUIRED: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  ACTION_REQUIRED: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
  APPROVED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  REJECTED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
};

export const AdminApplicationsView = ({ adminUsername }: Props) => {
  const { 
    applications: liveApps, 
    revokedDepartments, 
    recentlyAddedAppId, 
    requestDocument,
    requestCitizenDoc,
    broadcastConsentRequested, 
    broadcastApplicationStatusUpdated 
  } = useLiveSync();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isDocReqModalOpen, setIsDocReqModalOpen] = useState(false);
  const [reqDept, setReqDept] = useState('Revenue Department');
  const [reqDocType, setReqDocType] = useState('Income Certificate');
  const [awaitingDocKyc, setAwaitingDocKyc] = useState<Record<string, boolean>>({});
  const [justFulfilledAppId, setJustFulfilledAppId] = useState<string | null>(null);

  const applications = liveApps;

  // Listen for real-time document fulfillments from Citizen Portal on JANSETU_SHARED_BUS
  useEffect(() => {
    const handleBusResponse = (event: MessageEvent<any>) => {
      if (event.data?.type === 'DOC_KYC_FULFILLED' || event.data?.type === 'CITIZEN_DOC_FULFILLED' || event.data?.type === 'CITIZEN_DOC_PROVIDED') {
        const payload = event.data.payload || {};
        console.log('[JANSETU ADMIN] Received fulfillment from Citizen on BUS:', payload);
        const fulfilledAppId = payload.appId || 'JS-2026-8802';
        setJustFulfilledAppId(fulfilledAppId);
        setAwaitingDocKyc(prev => ({ ...prev, [fulfilledAppId]: false }));
        setActionSuccessMsg(`✓ ${payload.citizenName || 'Citizen'} has verified & shared ${payload.docTitle || payload.docName || 'Polytechnic Marksheet'} via DigiLocker Vault! Status updated to VERIFIED.`);
        setTimeout(() => setActionSuccessMsg(null), 6000);
      }
    };

    eventBus.addEventListener('message', handleBusResponse);
    return () => {
      eventBus.removeEventListener('message', handleBusResponse);
    };
  }, []);

  const isConsentRevoked = (dept: string) => {
    const safeDept = (dept || '').toLowerCase();
    return revokedDepartments.some(d => {
      const dLower = (d || '').toLowerCase();
      return dLower && safeDept && (dLower === safeDept || dLower.includes(safeDept) || safeDept.includes(dLower));
    });
  };

  const handleRequestConsent = (dept: string) => {
    broadcastConsentRequested({
      department: dept,
      purpose: 'Welfare Scheme Eligibility & Income Scrutiny',
      requestedFields: ['Demographic e-KYC', 'Income Certificate', 'Property/Academic Proof']
    });
    setActionSuccessMsg(`Verification Consent Request dispatched to citizen for ${dept} across Live Mesh.`);
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  const getPendingDocForApp = (app: ApplicationRecord) => {
    const unverified = app.documents?.find(d => d.status !== 'VERIFIED');
    if (unverified) return unverified.name;
    if (app.service.includes('PM-KISAN')) return 'Land Record Khasra';
    if (app.service.includes('Apprenticeship') || app.service.includes('NATS')) return 'Polytechnic Marksheet';
    if (app.service.includes('Awas') || app.service.includes('PMAY')) return 'Geo-Tagged Site Inspection Photo';
    if (app.service.includes('Ayushman') || app.service.includes('Scholarship')) return 'Income & Domicile Certificate';
    return 'Supporting Document';
  };

  const handleRequestKycDoc = (docName?: string) => {
    if (!selectedApp) return;
    const targetDoc = docName || getPendingDocForApp(selectedApp);
    
    const newNotification = {
      id: `REQ-${Date.now()}`,
      appId: selectedApp.id || '',
      schemeName: selectedApp.service || 'Unknown Scheme',
      deptName: selectedApp.department || 'Unknown Department',
      targetCitizenName: selectedApp.citizenName || 'Unknown Beneficiary',
      targetUidLast4: (selectedApp.citizenId || 'XXXX').slice(-4),
      citizenId: selectedApp.citizenId || '',
      requestedDoc: targetDoc,
      docType: targetDoc.toLowerCase().replace(/\s+/g, '_'),
      timestamp: 'Just now',
      status: 'ACTION_REQUIRED',
      type: 'DOC_KYC_REQUEST'
    };

    console.log('[JANSETU ADMIN] Emitting Request Event:', newNotification);

    // 1. Broadcast locally for instant 0ms tab synchronization
    eventBus.postMessage({ type: 'NEW_WEBHOOK_ALERT', payload: newNotification });
    eventBus.postMessage({ type: 'DOC_KYC_REQUEST', payload: newNotification });

    // 2. Persist to shared localStorage feed
    try {
      const existing = JSON.parse(localStorage.getItem('jansetu_webhook_notifications') || '[]');
      localStorage.setItem('jansetu_webhook_notifications', JSON.stringify([newNotification, ...existing.filter((n: any) => n.id !== newNotification.id)]));
    } catch (e) {}

    // 3. Dispatch via LiveSync mesh & Supabase
    requestCitizenDoc({
      appId: selectedApp.id,
      citizenName: selectedApp.citizenName,
      citizenId: selectedApp.citizenId,
      docName: targetDoc,
      dept: selectedApp.department,
      schemeName: selectedApp.service
    });

    setAwaitingDocKyc(prev => ({ ...prev, [selectedApp.id]: true }));
    setActionSuccessMsg(`e-KYC Request for "${targetDoc}" dispatched to ${selectedApp.citizenName} (UID: ${selectedApp.citizenId}) via JANSETU_SHARED_BUS.`);
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  const handleDispatchDocRequest = () => {
    if (selectedApp) {
      const newNotification = {
        id: `REQ-${Date.now()}`,
        appId: selectedApp.id || '',
        schemeName: selectedApp.service || 'Unknown Scheme',
        deptName: reqDept,
        targetCitizenName: selectedApp.citizenName || 'Unknown Beneficiary',
        targetUidLast4: (selectedApp.citizenId || 'XXXX').slice(-4),
        citizenId: selectedApp.citizenId || '',
        requestedDoc: reqDocType,
        docType: reqDocType.toLowerCase().replace(/\s+/g, '_'),
        timestamp: 'Just now',
        status: 'ACTION_REQUIRED',
        type: 'DOC_KYC_REQUEST'
      };

      eventBus.postMessage({ type: 'NEW_WEBHOOK_ALERT', payload: newNotification });
      eventBus.postMessage({ type: 'DOC_KYC_REQUEST', payload: newNotification });

      try {
        const existing = JSON.parse(localStorage.getItem('jansetu_webhook_notifications') || '[]');
        localStorage.setItem('jansetu_webhook_notifications', JSON.stringify([newNotification, ...existing.filter((n: any) => n.id !== newNotification.id)]));
      } catch (e) {}

      requestCitizenDoc({
        appId: selectedApp.id,
        citizenName: selectedApp.citizenName,
        citizenId: selectedApp.citizenId,
        docName: reqDocType,
        dept: reqDept,
        schemeName: selectedApp.service
      });
      setAwaitingDocKyc(prev => ({ ...prev, [selectedApp.id]: true }));
    }
    requestDocument(
      reqDept,
      reqDocType,
      selectedApp?.citizenId || '1111 2222 1405',
      selectedApp?.citizenName || 'Hriday Bardia'
    );
    setIsDocReqModalOpen(false);
    setActionSuccessMsg(`Document Request for "${reqDocType}" from ${reqDept} transmitted to Citizen Portal via JANSETU_SHARED_BUS.`);
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  const handleUpdateStatus = (appId: string, newStatus: ApplicationRecord['status'], nextAct: string) => {
    broadcastApplicationStatusUpdated(appId, newStatus, nextAct);

    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp(prev => prev ? {
        ...prev,
        status: newStatus,
        nextAction: nextAct,
        lastUpdated: 'Just now'
      } : null);
    }

    setActionSuccessMsg(`Application ${appId} successfully marked as ${newStatus.replace(/_/g, ' ')}.`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleRefreshFeed = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setActionSuccessMsg('Application feed synchronized with Event Mesh.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }, 600);
  };

  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      // Category filter
      let matchesFilter = true;
      if (filter === 'Submitted') matchesFilter = app.status === 'SUBMITTED';
      else if (filter === 'Under Verification') matchesFilter = app.status === 'UNDER_VERIFICATION' || app.status === 'UNDER_REVIEW';
      else if (filter === 'Documents Required') matchesFilter = app.status === 'DOCUMENTS_REQUIRED' || app.status === 'ACTION_REQUIRED';
      else if (filter === 'Approved') matchesFilter = app.status === 'APPROVED' || app.status === 'COMPLETED';

      // Search query filter
      if (!matchesFilter) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        (app.id || '').toLowerCase().includes(q) ||
        (app.citizenName || '').toLowerCase().includes(q) ||
        (app.citizenId || '').toLowerCase().includes(q) ||
        (app.service || '').toLowerCase().includes(q) ||
        (app.department || '').toLowerCase().includes(q) ||
        (app.location || '').toLowerCase().includes(q)
      );
    });
  }, [applications, filter, searchQuery]);

  const stats = useMemo(() => ({
    total: applications.length,
    submitted: applications.filter(a => a.status === 'SUBMITTED').length,
    inProgress: applications.filter(a => ['UNDER_VERIFICATION', 'UNDER_REVIEW'].includes(a.status)).length,
    docsRequired: applications.filter(a => ['DOCUMENTS_REQUIRED', 'ACTION_REQUIRED'].includes(a.status)).length,
    approved: applications.filter(a => ['APPROVED', 'COMPLETED'].includes(a.status)).length,
  }), [applications]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {actionSuccessMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="font-semibold">{actionSuccessMsg}</span>
          <button onClick={() => setActionSuccessMsg(null)} className="ml-auto text-emerald-600 hover:text-emerald-800 dark:hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>{t('adminApplications.monitor', 'Beneficiary Application Processing')}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('adminApplications.monitorDesc', 'Monitor, audit, and disburse active welfare applications across national departments.')}
          </p>
        </div>
        <button
          onClick={handleRefreshFeed}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition disabled:opacity-50 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? t('common.loading', 'Refreshing...') : t('Refresh Feed', 'Refresh Feed')}</span>
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: t('Total Applications', 'Total Applications'), count: stats.total, color: 'text-slate-900 dark:text-white', bg: 'bg-white dark:bg-slate-900' },
          { label: t('Submitted (New)', 'Submitted (New)'), count: stats.submitted, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20' },
          { label: t('Under Verification', 'Under Verification'), count: stats.inProgress, color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800' },
          { label: t('Docs Required', 'Docs Required'), count: stats.docsRequired, color: 'text-[#C2410C] dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' },
          { label: t('Approved / Disbursed', 'Approved / Disbursed'), count: stats.approved, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} border border-slate-300 dark:border-slate-700 p-4 rounded text-center shadow-2xs`}>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search by Citizen Name, Application ID, or Scheme...', 'Search by Citizen Name, Application ID, or Scheme...')}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#133E87] focus:outline-none shadow-2xs transition"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {[
            { id: 'All', label: t('All', 'All') },
            { id: 'Submitted', label: t('Submitted', 'Submitted') },
            { id: 'Under Verification', label: t('Under Verification', 'Under Verification') },
            { id: 'Documents Required', label: t('Documents Required', 'Documents Required') },
            { id: 'Approved', label: t('Approved', 'Approved') }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition border ${
                filter === f.id 
                  ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-2xs' 
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Live Mesh Alert Banner */}
      {recentlyAddedAppId && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-lg flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-200 font-semibold animate-scaleUp shadow-sm">
          <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
          <span>Live Mesh: Incoming application ({recentlyAddedAppId}) received and prepended to your queue in real-time.</span>
        </div>
      )}

      {/* Applications Table (GIGW Compliant Grid) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-bold border-b border-slate-300 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">{t('Application ID', 'Application ID')}</th>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">{t('Citizen (e-KYC)', 'Citizen (e-KYC)')}</th>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">{t('Scheme / Service', 'Scheme / Service')}</th>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">{t('Department', 'Department')}</th>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">{t('Status', 'Status')}</th>
                <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">{t('Submitted Date', 'Submitted Date')}</th>
                <th className="px-4 py-3 text-right">{t('Action', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredApps.map((app, rowIdx) => {
                const isNew = recentlyAddedAppId === app.id;
                return (
                  <tr 
                    key={app.id} 
                    onClick={() => setSelectedApp(app)}
                    className={`transition-all cursor-pointer ${
                      isNew 
                        ? 'bg-emerald-100/90 dark:bg-emerald-950/80 ring-2 ring-emerald-500 font-bold animate-pulse' 
                        : rowIdx % 2 === 1 
                        ? 'bg-slate-50/80 dark:bg-slate-800/30 hover:bg-blue-50/50 dark:hover:bg-slate-800/60' 
                        : 'bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-[#133E87] dark:text-blue-400 border-r border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        {isNew && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
                        <span>{app.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">
                      <div className="font-bold text-slate-900 dark:text-white">{app.citizenName}</div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">UID: {app.citizenId}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white max-w-[220px] truncate border-r border-slate-200 dark:border-slate-800">
                      {app.service}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[200px] truncate border-r border-slate-200 dark:border-slate-800">
                      {app.department}
                    </td>
                    <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[app.status] || 'bg-slate-100 text-slate-600'}`}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono border-r border-slate-200 dark:border-slate-800">
                      {app.submittedDate}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        type="button"
                        className="text-[#133E87] dark:text-blue-400 hover:underline font-bold inline-flex items-center gap-1"
                      >
                        <span>Review</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredApps.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Briefcase className="w-8 h-8 text-slate-400" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">No applications match your search or filter.</p>
                      <p className="text-xs text-slate-400">Try adjusting keywords or selecting "All" categories.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Application Modal / Drawer */}
      {selectedApp && (() => {
        const activeApp = liveApps.find(a => a.id === selectedApp.id) || selectedApp;
        const isRevoked = isConsentRevoked(activeApp.department);
        const hasPendingKyc = activeApp.documents?.some(d => d.status !== 'VERIFIED');
        const isKycAwaiting = (awaitingDocKyc[activeApp.id] || activeApp.status === 'DOCUMENTS_REQUIRED') && hasPendingKyc;

        return (
          <div 
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedApp(null);
            }}
          >
            <div 
              className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh] overflow-y-auto space-y-6 animate-scale-up text-slate-900 dark:text-white"
              role="dialog"
              aria-modal="true"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                      {activeApp.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[activeApp.status] || STATUS_COLORS.SUBMITTED}`}>
                      {activeApp.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white">
                    {activeApp.service}
                  </h2>
                </div>
                <button 
                  onClick={() => setSelectedApp(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Citizen Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <p className="text-slate-500 uppercase font-bold text-[10px]">Beneficiary Name</p>
                  <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{activeApp.citizenName}</p>
                  <p className="text-slate-400 font-mono text-[11px] mt-0.5">UID: {activeApp.citizenId}</p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase font-bold text-[10px]">Department & SLA</p>
                  <p className="font-medium text-slate-900 dark:text-slate-200 mt-0.5">{activeApp.department}</p>
                  <p className="text-amber-600 dark:text-amber-400 font-mono text-[11px] mt-0.5">Target SLA: {activeApp.sla || '48 Hours'}</p>
                </div>
              </div>

              {/* DPDP Consent Lockout Overlay vs Standard Verified Documents */}
              {isRevoked ? (
                <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 rounded-2xl p-5 space-y-3 text-red-900 dark:text-red-200 animate-scaleUp">
                  <div className="flex items-center gap-2 font-black text-sm text-red-700 dark:text-red-400">
                    <Lock className="w-5 h-5" />
                    <span>⚠️ Access Revoked by Citizen under DPDP Act 2023</span>
                  </div>
                  <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
                    The citizen has dynamically revoked e-KYC consent for <strong>{activeApp.department}</strong>. In compliance with the Digital Personal Data Protection Act, 2023, data tokens and verification hashes have been invalidated. Officer scrutiny access is legally blocked.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-red-700 dark:text-red-400">
                    <span className="bg-red-100 dark:bg-red-900/60 px-2 py-0.5 rounded border border-red-300 dark:border-red-700 font-bold">
                      DPDP_SEC_6_REVOCATION_ENFORCED
                    </span>
                    <span>Document Tokens Purged</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Next Action Notice */}
                  <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 p-4 rounded-2xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      Pending Verification Action
                    </span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                      {activeApp.nextAction}
                    </p>
                  </div>

                  {/* Documents Verified */}
                  {activeApp.documents && activeApp.documents.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Required Supporting Documents
                      </span>
                      <div className="space-y-1.5">
                        {activeApp.documents.map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-purple-500" />
                              <span className="font-medium">{doc.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {doc.status !== 'VERIFIED' && (
                                <button
                                  type="button"
                                  onClick={() => handleRequestKycDoc(doc.name)}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition cursor-pointer shadow-xs"
                                  title={`Request ${doc.name} from ${activeApp.citizenName}`}
                                >
                                  Request e-KYC
                                </button>
                              )}
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all duration-300 ${
                                doc.status === 'VERIFIED' 
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' 
                                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse'
                              }`}>
                                {doc.status === 'VERIFIED' ? '✓ VERIFIED' : doc.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Officer Action Buttons */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleRequestKycDoc()}
                  className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                    isKycAwaiting
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 animate-pulse'
                      : 'border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60'
                  }`}
                >
                  <FileText className={`w-3.5 h-3.5 ${isKycAwaiting ? 'text-amber-600 animate-spin' : 'text-purple-600 dark:text-purple-400'}`} />
                  <span>{isKycAwaiting ? 'Awaiting Citizen e-KYC ⏳' : `Request Citizen e-KYC (${getPendingDocForApp(activeApp)})`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleRequestConsent(activeApp.department);
                    handleRequestKycDoc();
                  }}
                  className="px-3.5 py-2.5 rounded-xl border border-blue-300 dark:border-blue-700 text-[#133E87] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Radio className="w-3.5 h-3.5 text-[#133E87] dark:text-blue-400 animate-pulse" />
                  <span>Request e-KYC Consent</span>
                </button>

                <button
                  type="button"
                  disabled={isRevoked}
                  onClick={() => handleRequestKycDoc()}
                  className="px-4 py-2.5 rounded-xl border border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isKycAwaiting ? 'Request Transmitted (Awaiting Citizen) ⏳' : 'Request Docs'}
                </button>

                <button
                  type="button"
                  disabled={isRevoked}
                  onClick={() => handleUpdateStatus(activeApp.id, 'APPROVED', 'Disbursement Approval Generated to Beneficiary Bank')}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all duration-300 flex items-center gap-1.5 ${
                    isRevoked
                      ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-50'
                      : justFulfilledAppId === activeApp.id
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 ring-4 ring-emerald-400/80 ring-offset-2 dark:ring-offset-slate-900 shadow-xl shadow-emerald-500/50 scale-105 animate-pulse cursor-pointer'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20 cursor-pointer'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${justFulfilledAppId === activeApp.id ? 'text-white animate-bounce' : ''}`} />
                  <span>{isRevoked ? 'Action Blocked (Consent Revoked)' : justFulfilledAppId === activeApp.id ? '⚡ Verified! Approve & Disburse →' : 'Approve & Disburse'}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Document / e-KYC Request Modal */}
      {isDocReqModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setIsDocReqModalOpen(false); }}
        >
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl text-xs text-slate-900 dark:text-white animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold">Transmit Statutory Document Request</h3>
              </div>
              <button onClick={() => setIsDocReqModalOpen(false)} className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Select the statutory department and document to request from citizen <strong>{selectedApp?.citizenName || 'Hriday Bardia'}</strong>. This will dispatch a real-time event across the JanSetu Interop Mesh.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Department</label>
                <select
                  value={reqDept}
                  onChange={(e) => setReqDept(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-[#133E87]"
                >
                  <option value="Revenue Department">Revenue Department</option>
                  <option value="Transport Department">Transport Department</option>
                  <option value="Ministry of Education">Ministry of Education</option>
                  <option value="Municipal Corporation">Municipal Corporation</option>
                  <option value="UIDAI">UIDAI Identity Authority</option>
                  <option value="Ministry of Agriculture & Farmers Welfare">Ministry of Agriculture</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Requested Credential / Document</label>
                <select
                  value={reqDocType}
                  onChange={(e) => setReqDocType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-[#133E87]"
                >
                  <option value="Income Certificate">Income Certificate (Revenue)</option>
                  <option value="Land Deed / Khasra Khatauni">Land Deed / Khasra Khatauni (Revenue)</option>
                  <option value="Driving Licence & Vehicle RC">Driving Licence & Vehicle RC (Transport)</option>
                  <option value="Polytechnic Diploma Marksheet">Polytechnic Diploma Marksheet (Education)</option>
                  <option value="Property Tax Clearance Receipt">Property Tax Clearance Receipt (Municipal)</option>
                  <option value="Biometric Demographic e-KYC">Biometric Demographic e-KYC (UIDAI)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDocReqModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold hover:bg-slate-200 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatchDocRequest}
                className="px-5 py-2 rounded-xl bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold transition shadow-md"
              >
                Transmit Request →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminApplicationsView;
