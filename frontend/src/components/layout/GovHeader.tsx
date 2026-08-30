'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLiveSync } from '@/context/LiveSyncContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { Logo } from '@/components/common/Logo';
import { 
  ShieldCheck, 
  Globe, 
  ChevronDown, 
  Check, 
  ExternalLink,
  Lock,
  Building2,
  Home,
  Briefcase,
  Landmark,
  FileText,
  Key,
  HelpCircle,
  BarChart2,
  LogOut,
  User,
  Users,
  GitBranch,
  Database,
  FileCheck,
  Search,
  X as CloseIcon
} from 'lucide-react';

interface NavLinkItem {
  label: string;
  href: string;
  tabKey?: string;
  exactPath: string;
}

function GovNavBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { notifications, consents, docRequests, pendingKycRequest } = useLiveSync();
  const { t } = useLanguage();
  const currentTab = searchParams ? searchParams.get('tab') : null;

  const authRoutes = ['/', '/role-select', '/login', '/citizen-login', '/admin-login', '/janparichay/auth', '/auth/callback'];
  const isAuthPage = !pathname || authRoutes.includes(pathname);

  // 1. Hide the Secondary Nav Bar on Authentication & Landing Pages or when not authenticated
  if (isAuthPage || !isAuthenticated || !user) {
    return null;
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin' || user?.role === 'SYSTEM_ADMIN' || user?.role === 'system_admin';

  const pendingConsentCount = consents.filter(c => c.status === 'PENDING').length + (pendingKycRequest ? 1 : 0);
  const pendingAlertsCount = notifications.filter(n => n.isNew).length + (pendingKycRequest ? 1 : 0);

  const getBadgeForTab = (tabKey?: string) => {
    if (!isAdmin) {
      if (tabKey === 'consent' && pendingConsentCount > 0) {
        return (
          <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-400 text-slate-950 animate-pulse">
            +{pendingConsentCount}
          </span>
        );
      }
      if (tabKey === 'alerts' && pendingAlertsCount > 0) {
        return (
          <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-400 text-slate-950 animate-pulse">
            +{pendingAlertsCount}
          </span>
        );
      }
    }
    return null;
  };

  const citizenLinks: NavLinkItem[] = [
    { label: t('nav.goalPlanner', 'Goal Planner'), href: '/citizen/dashboard', exactPath: '/citizen/dashboard', tabKey: 'planner' },
    { label: t('nav.welfareSchemes', 'Schemes & Benefits'), href: '/citizen/dashboard?tab=schemes', exactPath: '/citizen/dashboard', tabKey: 'schemes' },
    { label: t('nav.activeJourneys', 'Active Journeys'), href: '/citizen/dashboard?tab=journeys', exactPath: '/citizen/dashboard', tabKey: 'journeys' },
    { label: t('nav.documentsVault', 'Documents Vault'), href: '/citizen/dashboard?tab=documents', exactPath: '/citizen/dashboard', tabKey: 'documents' },
    { label: t('nav.myApplications', 'My Applications'), href: '/citizen/dashboard?tab=applications', exactPath: '/citizen/dashboard', tabKey: 'applications' },
    { label: t('nav.checkMyInformation', 'Check My Information'), href: '/citizen/dashboard?tab=conflicts', exactPath: '/citizen/dashboard', tabKey: 'conflicts' },
    { label: t('nav.yourDataConsent', 'Your Data & Consent'), href: '/citizen/dashboard?tab=consent', exactPath: '/citizen/dashboard', tabKey: 'consent' },
    { label: t('nav.govInteropHub', 'Gov Interop Hub'), href: '/citizen/dashboard?tab=interop', exactPath: '/citizen/dashboard', tabKey: 'interop' },
    { label: t('nav.alertsEvents', 'Alerts & Events'), href: '/citizen/dashboard?tab=alerts', exactPath: '/citizen/dashboard', tabKey: 'alerts' },
    { label: t('nav.helpFaq', 'Help & FAQ'), href: '/help', exactPath: '/help' },
  ];

  const adminLinks: NavLinkItem[] = [
    { label: t('nav.home', 'Home'), href: '/', exactPath: '/' },
    { label: t('admin.officerTelemetry', 'Admin Dashboard'), href: '/admin/dashboard', exactPath: '/admin/dashboard', tabKey: 'official' },
    { label: t('admin.interoperabilityHub', 'Interoperability Hub'), href: '/admin/dashboard?tab=interop', exactPath: '/admin/dashboard', tabKey: 'interop' },
    { label: t('admin.dataQualityAudit', 'Data Quality Audit'), href: '/admin/dashboard?tab=data_quality', exactPath: '/admin/dashboard', tabKey: 'data_quality' },
    { label: t('admin.workflowEngine', 'Live Mesh (Journey Preview)'), href: '/admin/dashboard?tab=workflow', exactPath: '/admin/dashboard', tabKey: 'workflow' },
    { label: t('admin.beneficiaryApplications', 'Beneficiary Applications'), href: '/admin/dashboard?tab=applications', exactPath: '/admin/dashboard', tabKey: 'applications' },
    { label: t('admin.citizenRegistry', 'Citizen Registry'), href: '/admin/dashboard?tab=citizens', exactPath: '/admin/dashboard', tabKey: 'citizens' },
    { label: t('nav.helpFaq', 'Help & FAQ'), href: '/help', exactPath: '/help' },
  ];

  const activeLinks = isAdmin ? adminLinks : citizenLinks;

  const isLinkActive = (link: NavLinkItem) => {
    if (pathname !== link.exactPath) {
      return false;
    }
    // If the link has a specific tabKey
    if (link.tabKey) {
      if (link.tabKey === 'planner' || link.tabKey === 'overview' || link.tabKey === 'official') {
        return !currentTab || currentTab === 'overview' || currentTab === 'official' || currentTab === 'planner';
      }
      return currentTab === link.tabKey;
    }
    // If no tabKey (e.g. /help), match path directly
    return !currentTab;
  };

  return (
    <nav className="w-full bg-[#0B2545] text-white text-xs md:text-sm font-medium px-4 md:px-12 flex items-center gap-6 overflow-x-auto py-2.5 shadow-sm tab-scrollbar-hide">
      {activeLinks.map((link) => {
        const active = isLinkActive(link);
        return (
          <Link
            key={link.label}
            href={link.href}
            className={`whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              active
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold pb-1.5 transition-colors'
                : 'text-slate-200 hover:text-amber-300 border-b-2 border-transparent font-normal pb-1.5 transition-colors'
            }`}
          >
            <span>{link.label}</span>
            {getBadgeForTab(link.tabKey)}
          </Link>
        );
      })}
    </nav>
  );
}

export const GovHeader: React.FC = () => {
  const { language, setLanguage, t, supportedLanguages } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [fontSizeLevel, setFontSizeLevel] = useState<number>(0); // -1: small, 0: normal, 1: large
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');

  // Apply font-size scale to root document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (fontSizeLevel === -1) {
        root.style.fontSize = '90%';
      } else if (fontSizeLevel === 1) {
        root.style.fontSize = '110%';
      } else {
        root.style.fontSize = '100%';
      }
    }
  }, [fontSizeLevel]);

  return (
    <header className="w-full select-none z-30 font-sans">
      {/* ========================================================================= */}
      {/* TIER 1: NATIONAL TRICOLOR RIBBON & ACCESSIBILITY MASTHEAD                */}
      {/* ========================================================================= */}
      <div className="h-[3px] w-full bg-gradient-to-r from-orange-600 via-white to-green-600 shadow-xs" />

      <div className="w-full bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 py-1 px-4 md:px-12 flex items-center justify-between transition-colors">
        {/* Left: Official Government of India attribution (No unverified claims) */}
        <div className="flex items-center gap-2 font-semibold">
          <span className="text-orange-600 dark:text-orange-400 font-bold">{t('Government of India', 'Government of India')}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-900 dark:text-slate-100 font-bold">{t('header.govBannerTag', 'An Official Digital Public Good')}</span>
        </div>

        {/* Right: GIGW Accessibility Toolbar */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* Skip to Main Content Link (GIGW Standard) */}
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-1 focus:left-4 focus:z-50 focus:bg-amber-500 focus:text-slate-950 focus:px-3 focus:py-1 focus:rounded text-xs font-bold"
          >
            {t('header.skipToContent', 'Skip to Main Content')}
          </a>

          {/* Font Scaler: A- / A / A+ */}
          <div className="hidden sm:flex items-center bg-slate-200 dark:bg-slate-800 rounded px-1 py-0.5 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setFontSizeLevel(-1)}
              title="Decrease Font Size"
              className={`px-1.5 py-0.5 rounded transition ${
                fontSizeLevel === -1 ? 'bg-white dark:bg-slate-900 text-blue-800 dark:text-blue-400 shadow-xs' : 'hover:text-blue-700'
              }`}
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSizeLevel(0)}
              title="Standard Font Size"
              className={`px-1.5 py-0.5 rounded transition ${
                fontSizeLevel === 0 ? 'bg-white dark:bg-slate-900 text-blue-800 dark:text-blue-400 shadow-xs' : 'hover:text-blue-700'
              }`}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSizeLevel(1)}
              title="Increase Font Size"
              className={`px-1.5 py-0.5 rounded transition ${
                fontSizeLevel === 1 ? 'bg-white dark:bg-slate-900 text-blue-800 dark:text-blue-400 shadow-xs' : 'hover:text-blue-700'
              }`}
            >
              A+
            </button>
          </div>

          {/* Theme Selector Toggle */}
          <div className="flex items-center">
            <ThemeToggle />
          </div>

          {/* Language Selector Dropdown (All 23 Indic Languages) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-bold text-slate-900 dark:text-white hover:border-[#133E87] dark:hover:border-blue-400 transition shadow-2xs cursor-pointer text-xs"
            >
              <Globe className="w-3.5 h-3.5 text-[#133E87] dark:text-blue-400" />
              <span>{supportedLanguages.find(l => l.code === language)?.native_name || language?.toUpperCase() || 'EN'}</span>
              <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => { setIsLangMenuOpen(false); setLangSearch(''); }} />
                <div className="absolute right-0 mt-1.5 w-60 max-h-80 flex flex-col bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-scaleUp">
                  {/* Search Input */}
                  <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                      <input
                        type="text"
                        value={langSearch}
                        onChange={(e) => setLangSearch(e.target.value)}
                        placeholder="Search 23 Indian languages..."
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#133E87]"
                        autoFocus
                      />
                      {langSearch && (
                        <button
                          onClick={() => setLangSearch('')}
                          className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                        >
                          <CloseIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filtered Languages List */}
                  <div className="overflow-y-auto p-1 max-h-60 space-y-0.5">
                    {supportedLanguages
                      .filter((l) => 
                        !langSearch.trim() || 
                        l.name.toLowerCase().includes(langSearch.toLowerCase()) || 
                        l.native_name.toLowerCase().includes(langSearch.toLowerCase()) ||
                        l.code.toLowerCase().includes(langSearch.toLowerCase())
                      )
                      .map((lang: any) => {
                        const isSelected = language === lang.code || (language === 'kok' && lang.code === 'gom');
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              setLanguage(lang.code);
                              setIsLangMenuOpen(false);
                              setLangSearch('');
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                              isSelected
                                ? 'font-bold text-[#133E87] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs">{lang.native_name}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">{lang.name}</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#133E87] dark:text-blue-400 shrink-0" />}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIER 2: MAIN BRANDING & OFFICIAL SEALS MASTHEAD                           */}
      {/* ========================================================================= */}
      <div className="w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 py-3 px-4 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        {/* Left: Official JanSetu Bilingual Logo Identity */}
        <div className="flex items-center gap-3.5">
          <Logo variant="full" height={44} />
          <span className="hidden lg:inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider self-center">
            GIGW 3.0 Standard
          </span>
        </div>

        {/* Right: Official Partner Seals & Auth State */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          {/* MeriPehchaan NSSO Seal */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
            <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300 block leading-tight">MeriPehchaan</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 block leading-tight font-mono">NSSO SSO Node</span>
            </div>
          </div>

          {/* Digital India Seal */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded">
            <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-black text-blue-900 dark:text-blue-300 block leading-tight">Digital India</span>
              <span className="text-[9px] text-blue-700 dark:text-blue-400 block leading-tight">{t('Power To Empower', 'Power To Empower')}</span>
            </div>
          </div>

          {/* Notification Bell Component for Real-Time Citizen Alerts & Document Requests */}
          {!pathname?.startsWith('/login') && <NotificationBell />}

          {/* Auth Action */}
          {isAuthenticated && user ? (
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60 transition cursor-pointer shadow-2xs"
              title={t('header.signOutTitle', 'Sign out of your session')}
            >
              <LogOut className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span>{t('Sign Out', 'Sign Out')}</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold bg-[#133E87] hover:bg-[#0B2545] text-white shadow-xs transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{t('Sign In', 'Sign In')}</span>
            </Link>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIER 3: PRIMARY NAVY NAVIGATION BAR (AUTHENTICATED SESSIONS ONLY)          */}
      {/* ========================================================================= */}
      <Suspense fallback={null}>
        <GovNavBar />
      </Suspense>
    </header>
  );
};

export default GovHeader;
