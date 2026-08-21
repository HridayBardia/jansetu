'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { AdminAnalyticsView } from '@/components/AdminAnalyticsView';
import { AdminCitizensView } from '@/components/AdminCitizensView';
import { AdminApplicationsView } from '@/components/AdminApplicationsView';
import { AdminInteropView } from '@/components/AdminInteropView';
import { AdminDataQualityView } from '@/components/AdminDataQualityView';
export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'official';

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'admin'))) {
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
              Government Interoperability Control Center
            </h1>
            <p className="text-slate-400 mt-2 text-sm leading-relaxed max-w-2xl">
              Monitor pan-India interoperability, connector health, citizen applications, and data sharing logs in real-time.
            </p>
          </header>

          {tab === 'official' || tab === 'overview' ? (
            <AdminAnalyticsView 
              analytics={user?.username === 'dishita' ? {
                total_journeys_started: 4200,
                prerequisites_auto_resolved: 15200,
                sources_indexed: 54,
                time_saved_hours_per_citizen: 9.5,
                avg_completion_rate: 92
              } : user?.username === 'jyoti' ? {
                total_journeys_started: 10320,
                prerequisites_auto_resolved: 26900,
                sources_indexed: 100,
                time_saved_hours_per_citizen: 14.2,
                avg_completion_rate: 81
              } : {
                total_journeys_started: 14520,
                prerequisites_auto_resolved: 42100,
                sources_indexed: 154,
                time_saved_hours_per_citizen: 12.5,
                avg_completion_rate: 85
              }} 
            />
          ) : null}
          {tab === 'citizens' && <AdminCitizensView />}
          {tab === 'applications' && <AdminApplicationsView />}
          {tab === 'interop' && <AdminInteropView />}
          {tab === 'data_quality' && <AdminDataQualityView />}
        </div>
      </main>
    </div>
  );
}
