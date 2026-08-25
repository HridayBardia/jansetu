'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Navbar } from '@/components/Navbar';
import { AdminAnalyticsView } from '@/components/AdminAnalyticsView';
import { AdminCitizensView } from '@/components/AdminCitizensView';
import { AdminApplicationsView } from '@/components/AdminApplicationsView';
import { AdminInteropView } from '@/components/AdminInteropView';
import { AdminDataQualityView } from '@/components/AdminDataQualityView';
import { AdminWorkflowView } from '@/components/AdminWorkflowView';

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'official';

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'admin' && user?.role !== 'SYSTEM_ADMIN' && user?.role !== 'system_admin'))) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (!isMounted || isLoading || !user) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(59,130,246,0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-amber-500/30 font-sans">
      <main className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-0 w-96 h-96 bg-gradient-to-tr from-amber-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <header className="mb-8">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
              {t('admin.systemOverview')}
            </h1>
            <p className="text-slate-400 mt-2 text-sm leading-relaxed max-w-2xl">
              {t('admin.adminAnalytics')}
            </p>
          </header>

          {tab === 'official' || tab === 'overview' ? (
            <AdminAnalyticsView />
          ) : null}
          {tab === 'citizens' && <AdminCitizensView adminUsername={user?.username || ''} />}
          {tab === 'applications' && <AdminApplicationsView adminUsername={user?.username || ''} />}
          {tab === 'interop' && <AdminInteropView />}
          {tab === 'workflow' && <AdminWorkflowView adminUsername={user?.username || ''} />}
          {tab === 'data_quality' && <AdminDataQualityView adminUsername={user?.username || ''} />}
        </div>
      </main>
    </div>
  );
}
