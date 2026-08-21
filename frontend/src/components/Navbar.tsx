'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Briefcase
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
  const { t } = useLanguage();
  const { user, isAuthenticated, logout, openAuthModal, changeRole } = useAuth();

  const navItems = [
    { label: t('appName', 'Goal Planner'), href: '/dashboard?tab=planner', icon: Compass },
    { label: t('myJourneys', 'Journeys'), href: '/dashboard?tab=journeys', icon: MapPin },
    { label: t('myDocuments', 'Documents Vault'), href: '/dashboard?tab=documents', icon: FileText },
    { label: t('myApplications', 'My Applications'), href: '/dashboard?tab=applications', icon: Briefcase },
    { label: t('privacy', 'Privacy & Consent'), href: '/dashboard?tab=consent', icon: ShieldCheck },
    { label: t('alerts', 'Alerts'), href: '/dashboard?tab=alerts', icon: Bell }
  ];

  if (isAuthenticated && user && (user.role === 'SYSTEM_ADMIN' || user.role === 'DEPARTMENT_ADMIN')) {
    navItems.push({ label: t('officialDashboard', 'Official & Health'), href: '/dashboard?tab=official', icon: BarChart2 });
  }

  return (
    <>
      {/* Top Header */}

      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <JanSetuLogo size="md" variant="full" />
          </Link>

          {/* Controls: Language Selector, User Profile & Auth Button */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <LanguageSelector />

            {/* Authenticated Citizen Profile / Login Button */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-500/30 shrink-0">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-200 leading-none">{user.full_name}</p>
                  <p className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">@{user.username}</p>
                </div>

                {/* Role Switcher */}
                <select
                  value={user.role || 'citizen'}
                  onChange={(e) => changeRole(e.target.value)}
                  className="bg-slate-900 border border-slate-850 rounded px-1.5 py-0.5 text-[10px] font-bold text-amber-400 cursor-pointer focus:outline-none focus:border-amber-500"
                >
                  <option value="citizen">Citizen</option>
                  <option value="DEPARTMENT_ADMIN">Official</option>
                  <option value="SYSTEM_ADMIN">Admin</option>
                </select>

                <button
                  onClick={logout}
                  title="Logout"
                  className="ml-1 text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition shrink-0"
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
            const active = pathname === item.href || (item.href !== '/' && pathname && pathname.startsWith(item.href));
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 text-slate-300 px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/' && pathname && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition ${
                  active ? 'text-amber-400 font-bold bg-amber-500/10' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

