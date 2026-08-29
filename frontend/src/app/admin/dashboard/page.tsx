'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { AdminAnalyticsView } from '@/components/AdminAnalyticsView';
import { AdminCitizensView } from '@/components/AdminCitizensView';
import { AdminApplicationsView } from '@/components/AdminApplicationsView';
import { AdminInteropView } from '@/components/AdminInteropView';
import { AdminDataQualityView } from '@/components/AdminDataQualityView';
import { AdminWorkflowView } from '@/components/AdminWorkflowView';
import Link from 'next/link';
import { Loader2, ShieldCheck, BarChart2, Users, Briefcase, GitBranch, Database, FileCheck, Home } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const ADMIN_TABS = [
    { id: 'official', label: t('admin.telemetryOverview', 'Telemetry Overview'), icon: BarChart2 },
    { id: 'applications', label: t('admin.beneficiaryApplications', 'Beneficiary Applications'), icon: Briefcase },
    { id: 'citizens', label: t('admin.citizenRegistry', 'Citizen Registry'), icon: Users },
    { id: 'interop', label: t('admin.interoperabilityHub', 'Interoperability Hub'), icon: GitBranch },
    { id: 'data_quality', label: t('admin.dataQualityAudit', 'Data Quality Audit'), icon: Database },
    { id: 'workflow', label: t('admin.workflowEngine', 'Workflow Engine'), icon: FileCheck },
  ];

  // Local state tab switching (no router.push lag)
  const [activeTab, _setActiveTab] = useState<string>('official');
  const [isMounted, setIsMounted] = useState(false);

  const setActiveTab = (tabId: string) => {
    _setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('tab', tabId);
      window.history.pushState({}, '', newUrl.toString());
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync tab from URL on mount and on popstate (browser back/forward)
  useEffect(() => {
    const syncTabFromUrl = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlTab = params.get('tab');
        if (urlTab) {
          const validIds = ['official', 'applications', 'citizens', 'interop', 'data_quality', 'workflow'];
          if (validIds.includes(urlTab)) {
            _setActiveTab(urlTab);
          }
        }
      }
    };

    syncTabFromUrl();
    window.addEventListener('popstate', syncTabFromUrl);
    return () => window.removeEventListener('popstate', syncTabFromUrl);
  }, []);

  // Also sync when searchParams change (initial load)
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && ['official', 'applications', 'citizens', 'interop', 'data_quality', 'workflow'].includes(urlTab)) {
      _setActiveTab(urlTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'admin' && user?.role !== 'SYSTEM_ADMIN' && user?.role !== 'system_admin'))) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (!isMounted || isLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#133E87]" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-200 selection:bg-amber-500/30 font-sans">
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/10 via-orange-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <main className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8 relative z-10">
        <div>
          <header className="mb-8">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
              {t('admin.systemOverview')}
            </h1>
            <p className="text-slate-400 mt-2 text-sm leading-relaxed max-w-2xl">
              {t('admin.adminAnalytics')}
            </p>
          </header>

      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#0B2545] text-white">
              <ShieldCheck className="w-3 h-3" />
              <span>{t('ADMINISTRATIVE PORTAL', 'ADMINISTRATIVE PORTAL')}</span>
            </span>
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
              {t('Officer:', 'Officer:')} <span className="font-bold text-slate-900 dark:text-white">{user?.full_name || user?.username || 'Dishita'}</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('System Overview', 'System Overview')}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t('Admin Analytics', 'Admin Analytics')}
          </p>
        </div>
      </div>

      {/* Tab Navigation - Local state switching (no router.push lag) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 tab-scrollbar-hide">
        {ADMIN_TABS.map((tabItem) => {
          const Icon = tabItem.icon;
          const isActive = activeTab === tabItem.id || (tabItem.id === 'official' && (activeTab === 'overview' || activeTab === 'official'));
          return (
            <button
              key={tabItem.id}
              onClick={() => setActiveTab(tabItem.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold whitespace-nowrap transition border cursor-pointer ${
                isActive
                  ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tabItem.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <div className="animate-fade-in">
        {(activeTab === 'official' || activeTab === 'overview') && <AdminAnalyticsView />}
        {activeTab === 'citizens' && <AdminCitizensView adminUsername={user?.username || ''} />}
        {activeTab === 'applications' && <AdminApplicationsView adminUsername={user?.username || ''} />}
        {activeTab === 'interop' && <AdminInteropView />}
        {activeTab === 'workflow' && <AdminWorkflowView adminUsername={user?.username || ''} />}
        {activeTab === 'data_quality' && <AdminDataQualityView adminUsername={user?.username || ''} />}
      </div>
    </div>
  );
}
