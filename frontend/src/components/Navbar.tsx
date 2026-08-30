'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from '@/components/common/Logo';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

import {
  Compass,
  MapPin,
  Bell,
  HelpCircle,
  ShieldCheck,
  BarChart2,
  Radio,
  FileText,
  User,
  LogOut,
  LogIn,
  Landmark,
  Briefcase,
  Activity,
  Menu,
  X,
  GitMerge
} from 'lucide-react';

interface NavbarProps {
  sandboxMode?: boolean;
  setSandboxMode?: (val: boolean) => void;
}


export const Navbar: React.FC<NavbarProps> = ({
  sandboxMode = true,
  setSandboxMode
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab');
  const { t } = useLanguage();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();

  const isActive = (href: string) => {
    if (!pathname) return false;
    const [base, query] = href.split('?');
    if (pathname === base) {
      if (query && query.startsWith('tab=')) {
        return currentTab === query.replace('tab=', '');
      } else {
        if (pathname === '/admin/dashboard') return !currentTab || currentTab === 'overview';
        if (pathname === '/citizen/dashboard') return !currentTab || currentTab === 'planner';
        return true;
      }
    }
    return pathname.startsWith(href) && href !== '/';
  };

  let navItems: { label: string, href: string, icon: any }[] = [];

  if (isAuthenticated && user) {
    if (user.role === 'ADMIN' || user.role === 'admin' || user.role === 'SYSTEM_ADMIN') {
      navItems = [
        { label: t('navigation.systemOverview'), href: '/admin/dashboard', icon: Compass },
        { label: t('navigation.citizens'), href: '/admin/dashboard?tab=citizens', icon: User },
        { label: t('navigation.applications'), href: '/admin/dashboard?tab=applications', icon: Briefcase },
        { label: t('navigation.interopHub'), href: '/admin/dashboard?tab=interop', icon: Radio },
        { label: t('navigation.workflowRules'), href: '/admin/dashboard?tab=workflow', icon: GitMerge },
        { label: t('navigation.dataQuality'), href: '/admin/dashboard?tab=data_quality', icon: BarChart2 },
      ];
    } else {
      navItems = [
        { label: t('navigation.goalPlanner'), href: '/citizen/dashboard?tab=planner', icon: Compass },
        { label: 'Schemes & Benefits', href: '/citizen/dashboard?tab=schemes', icon: Landmark },
        { label: t('navigation.myJourneys'), href: '/citizen/dashboard?tab=journeys', icon: MapPin },
        { label: t('navigation.documentsVault'), href: '/citizen/dashboard?tab=documents', icon: FileText },
        { label: t('navigation.myApplications'), href: '/citizen/dashboard?tab=applications', icon: Briefcase },
        { label: 'Check My Information', href: '/citizen/dashboard?tab=conflicts', icon: BarChart2 },
        { label: 'Your Data & Consent', href: '/citizen/dashboard?tab=consent', icon: ShieldCheck },
        { label: 'Gov Interop Hub', href: '/citizen/dashboard?tab=interop', icon: Radio },
        { label: 'Alerts & Events', href: '/citizen/dashboard?tab=alerts', icon: Bell }
      ];
    }
  }

  return (
    <>
      {/* Top Header */}

      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 text-slate-900 dark:text-slate-100 shadow-sm dark:shadow-lg dark:shadow-black/40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-18 md:h-20 flex items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3.5 shrink-0 transition transform hover:scale-[1.02]">
            {/* Desktop Logo */}
            <div className="hidden sm:block">
              <Logo variant="full" height={42} />
            </div>
            {/* Mobile Logo */}
            <div className="sm:hidden">
              <Logo variant="icon-only" height={36} />
            </div>
          </div>

          {/* Mobile Contextual Title */}
          <div className="md:hidden flex-1 px-3 text-center">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block">
              {navItems.find(item => isActive(item.href))?.label || t('appName')}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2.5 md:gap-3.5 shrink-0">
            {/* Theme Toggle Switcher */}
            <ThemeToggle />

            {/* Language Selector */}
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>

            {/* Authenticated User Controls */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-950/80 md:bg-slate-100 md:dark:bg-slate-900/90 md:border md:border-slate-200 md:dark:border-slate-800 px-2 md:px-3.5 py-2 rounded-2xl shadow-inner transition-colors">
                
                {/* Mobile Notification Icon */}
                <div className="md:hidden mr-1">
                  <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>

                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-300 font-black text-sm flex items-center justify-center border border-amber-500/40 shrink-0 shadow-sm">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{user.full_name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono leading-none mt-0.5">@{user.username}</p>
                </div>

                {/* Role label badge */}
                <div className="hidden md:block bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {(user.role === 'ADMIN' || user.role === 'admin' || user.role === 'SYSTEM_ADMIN') ? 'OFFICER' : 'CITIZEN'}
                </div>

                <button
                  onClick={logout}
                  title={t('navigation.signOut')}
                  className="hidden md:flex ml-1 text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800/80 transition shrink-0"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black px-4 md:px-5 py-2 md:py-2.5 rounded-2xl text-xs md:text-sm shadow-lg shadow-amber-500/25 transition transform hover:scale-[1.03] active:scale-[0.98]"
              >
                <LogIn className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>{t('navigation.citizenLogin')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Navigation Sub-Header */}
      <nav className="hidden md:block bg-slate-100/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800/80 text-xs font-medium transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 h-11">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition ${
                  active
                    ? 'text-amber-400 bg-amber-500/10 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      {isAuthenticated && user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950 border-t border-slate-800 text-slate-300 px-2 py-2 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-around h-14">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              // Simplistic naming for bottom nav limits string lengths
              let shortLabel = item.label;
              if (item.label.includes('Goal') || item.label.includes('Planner')) shortLabel = t('navigation.goalPlanner').split(' ')[0] || 'Home';
              if (item.label.includes('Application')) shortLabel = t('navigation.apps');
              if (item.label.includes('Consent') || item.label.includes('Privacy')) shortLabel = 'Consent';
              if (item.label.includes('Document') || item.label.includes('Vault')) shortLabel = t('navigation.docs');
              if (item.label.includes('System') || item.label.includes('Overview')) shortLabel = t('navigation.overview');
              if (item.label.includes('Interop')) shortLabel = 'Interop Hub';
              if (item.label.includes('Information') || item.label.includes('Quality')) shortLabel = 'Check Info';
              if (item.label.includes('Alerts')) shortLabel = 'Alerts';

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 w-16 h-full rounded-xl transition ${
                    active ? 'text-amber-400 font-bold bg-amber-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'fill-amber-500/20' : ''}`} />
                  <span className="text-[10px] truncate w-full text-center">{shortLabel}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
