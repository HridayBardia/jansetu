'use client';

/**
 * NAVIGATION ARCHITECTURE CONSOLIDATION DECISION:
 * We implement the "Reverse Navigation Model" where `/dashboard` acts as the single source
 * of truth for all sections (Goal Planner, Journeys list, Documents, Applications, Privacy/Consent,
 * Interop Hub, Data Quality conflicts, Alerts, and Official Telemetry). The top navigation bar items
 * link to `/dashboard?tab=...`, which automatically syncs the active tab state. This prevents
 * redundant rendering, ensures a unified citizen experience, and preserves the Guided Tour state.
 */

import React, { useState } from 'react';
import './globals.css';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LoginForm } from '@/components/LoginForm';
import { OnboardingModal } from '@/components/OnboardingModal';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { GovHeader } from '@/components/layout/GovHeader';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { GovFooter } from '@/components/layout/GovFooter';
import { GlobalLanguageWrapper } from '@/components/GlobalLanguageWrapper';

function AppContent({ children }: { children: React.ReactNode }) {
  const { isAuthModalOpen, closeAuthModal, isAuthenticated, isLoading, user, sessionConsentAccepted } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading) {
      const protectedRoutes = ['/citizen', '/journeys', '/alerts', '/help', '/privacy', '/admin'];
      const isProtected = pathname ? protectedRoutes.some(route => pathname.startsWith(route)) : false;
      // Require BOTH authentication AND current-session T&C consent for protected routes
      if (isProtected && (!isAuthenticated || !sessionConsentAccepted)) {
        router.replace('/login');
      }
      // Redirect to appropriate dashboard if already authenticated and consented on login page
      if (pathname && pathname === '/login' && isAuthenticated && sessionConsentAccepted && user) {
        if (user.role === 'ADMIN' || user.role === 'admin' || user.role === 'SYSTEM_ADMIN') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/citizen/dashboard');
        }
      }
    }
  }, [isLoading, isAuthenticated, sessionConsentAccepted, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#133E87]" />
      </div>
    );
  }

  const isAuthPage = pathname === '/login';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between text-slate-900 dark:text-white transition-colors">
      {/* Official Government 3-Tier Masthead */}
      <GovHeader />

      {/* Universal Breadcrumbs on Internal Routes */}
      {!isAuthPage && <Breadcrumbs />}

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col">
        {children}
      </main>

      {/* Global Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <LoginForm onClose={closeAuthModal} />
        </div>
      )}

      {/* Global Onboarding Modal */}
      <OnboardingModal />

      {/* Official National Portal Footer */}
      <GovFooter />
    </div>
  );
}

import { CinematicIntro } from '@/components/CinematicIntro';
import { MockDataProvider } from '@/context/MockDataContext';
import { LiveSyncProvider, useLiveSync } from '@/context/LiveSyncContext';
import { SmoothScrollProvider } from '@/components/SmoothScrollProvider';
import { Radio, X as CloseIcon, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

function LiveEventToast() {
  const { liveEventNotice, clearLiveNotice } = useLiveSync();

  if (!liveEventNotice) return null;

  return (
    <div className="fixed top-20 right-6 z-50 max-w-sm w-full animate-scaleUp">
      <div className={`p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-3 text-xs ${
        liveEventNotice.type === 'warning'
          ? 'bg-amber-50/95 dark:bg-amber-950/95 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
          : liveEventNotice.type === 'success'
          ? 'bg-emerald-50/95 dark:bg-emerald-950/95 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
          : 'bg-blue-50/95 dark:bg-slate-900/95 border-blue-300 dark:border-blue-700 text-slate-900 dark:text-white'
      }`}>
        <div className="mt-0.5 shrink-0">
          {liveEventNotice.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          ) : liveEventNotice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Radio className="w-5 h-5 text-[#133E87] dark:text-blue-400 animate-pulse" />
          )}
        </div>
        <div className="flex-1 space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="font-black text-[11px] uppercase tracking-wider">{liveEventNotice.title}</span>
            <button 
              onClick={clearLiveNotice}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] leading-relaxed">{liveEventNotice.message}</p>
        </div>
      </div>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(false);

  React.useEffect(() => {
    const shown = sessionStorage.getItem('jansetu_intro_shown');
    if (!shown) {
      setShowIntro(true);
    }
  }, []);

  if (showIntro) {
    return (
      <html lang="en" className="dark">
        <head>
          <title>JanSetu — Citizen AI Platform</title>
          <meta name="description" content="JanSetu - AI-powered National Citizen Welfare & Scheme Delivery Gateway by Government of India." />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="alternate icon" href="/favicon.svg" />
          <link rel="shortcut icon" href="/favicon.svg" />
          <link rel="apple-touch-icon" href="/icon.svg" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </head>
        <body className="bg-slate-950 text-slate-100 flex flex-col min-h-screen">
          <CinematicIntro onComplete={() => {
            sessionStorage.setItem('jansetu_intro_shown', 'true');
            setShowIntro(false);
          }} />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <title>JanSetu — Citizen AI Platform</title>
        <meta name="description" content="JanSetu - AI-powered National Citizen Welfare & Scheme Delivery Gateway by Government of India." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&family=Noto+Sans+Telugu:wght@400;500;600;700&family=Noto+Sans+Kannada:wght@400;500;600;700&family=Noto+Sans+Malayalam:wght@400;500;600;700&family=Noto+Sans+Gujarati:wght@400;500;600;700&family=Noto+Sans+Gurmukhi:wght@400;500;600;700&family=Noto+Sans+Oriya:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Noto+Sans+Meetei+Mayek:wght@400;500;600;700&display=swap" 
        />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col min-h-screen transition-colors duration-200">
        <ThemeProvider>
          <SmoothScrollProvider>
            <LanguageProvider>
              <GlobalLanguageWrapper>
                <AuthProvider>
                  <MockDataProvider>
                    <LiveSyncProvider>
                      <AppContent>
                        {children}
                      </AppContent>
                      <LiveEventToast />
                    </LiveSyncProvider>
                  </MockDataProvider>
                </AuthProvider>
              </GlobalLanguageWrapper>
            </LanguageProvider>
          </SmoothScrollProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
