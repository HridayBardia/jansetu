'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LanguageSelector } from './LanguageSelector';
import { JanSetuLogo } from './JanSetuLogo';
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
  const currentTab = searchParams.get('tab');
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
    if (user.role === 'ADMIN' || user.role === 'admin') {
      navItems = [
        { label: t('systemOverview', 'System Overview'), href: '/admin/dashboard', icon: Compass },
        { label: t('citizens', 'Citizens'), href: '/admin/dashboard?tab=citizens', icon: User },
        { label: t('applications', 'Applications'), href: '/admin/dashboard?tab=applications', icon: Briefcase },
        { label: t('interopHub', 'Interop Hub'), href: '/admin/dashboard?tab=interop', icon: Radio },
        { label: t('workflowRules', 'Workflow Rules'), href: '/admin/dashboard?tab=workflow', icon: GitMerge },
        { label: t('dataQuality', 'Data Quality'), href: '/admin/dashboard?tab=data_quality', icon: BarChart2 },
      ];
    } else {
      navItems = [
        { label: t('appName', 'Goal Planner'), href: '/citizen/dashboard?tab=planner', icon: Compass },
        { label: t('myJourneys', 'Journeys'), href: '/citizen/dashboard?tab=journeys', icon: MapPin },
        { label: t('myDocuments', 'Documents Vault'), href: '/citizen/dashboard?tab=documents', icon: FileText },
        { label: t('myApplications', 'My Applications'), href: '/citizen/dashboard?tab=applications', icon: Briefcase },
        { label: t('privacy', 'Privacy & Consent'), href: '/citizen/dashboard?tab=consent', icon: ShieldCheck },
        { label: t('interopHub', 'Interop Hub'), href: '/citizen/dashboard?tab=interop', icon: Radio },
        { label: t('dataQuality', 'Data Quality'), href: '/citizen/dashboard?tab=conflicts', icon: BarChart2 },
        { label: t('alerts', 'Alerts'), href: '/citizen/dashboard?tab=alerts', icon: Bell }
      ];
    }
  }

  return (
    <>
      {/* Top Header */}

      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            {/* Desktop Logo */}
            <div className="hidden md:block">
              <JanSetuLogo size="md" variant="full" />
            </div>
            {/* Mobile Logo */}
            <div className="md:hidden">
              <JanSetuLogo size="sm" variant="compact" />
            </div>
          </Link>

          {/* Mobile Contextual Title */}
          <div className="md:hidden flex-1 px-4 text-center">
            <span className="text-xs font-bold text-slate-300 truncate block">
              {navItems.find(item => isActive(item.href))?.label || 'JanSetu'}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Language Selector (Hidden on strict mobile to save space) */}
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>

            {/* Authenticated User Controls */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 bg-slate-950/50 md:bg-slate-950 md:border md:border-slate-800 px-1 md:px-3 py-1.5 rounded-xl">
                
                {/* Mobile Notification Icon (Only on mobile header, desktop has it in the dashboard) */}
                <div className="md:hidden mr-1">
                  <Bell className="w-5 h-5 text-slate-400" />
                </div>

                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-500/30 shrink-0">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-200 leading-none">{user.full_name}</p>
                  <p className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">@{user.username}</p>
                </div>

                {/* Role label instead of switcher */}
                <div className="hidden md:block bg-slate-900 border border-slate-850 rounded px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                  {user.role === 'ADMIN' || user.role === 'admin' ? 'ADMIN' : 'CITIZEN'}
                </div>

                <button
                  onClick={logout}
                  title="Logout"
                  className="hidden md:flex ml-1 text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-md shadow-amber-500/20 transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Citizen Login</span>
              </button>
            )}
          </div>
        </div>
      </header>


      {/* Desktop Navigation Sub-Header */}
      <nav className="hidden md:block bg-slate-950/80 border-b border-slate-800/80 text-xs font-medium">
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
              if (item.label === 'Goal Planner') shortLabel = 'Home';
              if (item.label === 'My Applications') shortLabel = 'Apps';
              if (item.label === 'Privacy & Consent') shortLabel = 'Consent';
              if (item.label === 'Documents Vault') shortLabel = 'Docs';
              if (item.label === 'System Overview') shortLabel = 'Overview';
              if (item.label === 'Interop Hub') shortLabel = 'Interop';
              if (item.label === 'Data Quality') shortLabel = 'Quality';

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

