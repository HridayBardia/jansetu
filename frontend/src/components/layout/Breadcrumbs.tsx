'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export const Breadcrumbs: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const activeTab = searchParams.get('tab');

  if (pathname === '/') return null;

  const TAB_NAME_MAP: Record<string, string> = {
    planner: t('Goal & Welfare Navigator', 'Goal & Welfare Navigator'),
    schemes: t('Scheme Directory & Entitlements', 'Scheme Directory & Entitlements'),
    journeys: t('Active Journeys', 'Active Journeys'),
    documents: t('DigiLocker Document Vault', 'DigiLocker Document Vault'),
    applications: t('Live Benefit Tracker', 'Live Benefit Tracker'),
    consent: t('DPDP Data Consent Manager', 'DPDP Data Consent Manager'),
    interop: t('Interoperability Hub', 'Interoperability Hub'),
    conflicts: t('Data Quality Auditing', 'Data Quality Auditing'),
    alerts: t('Departmental Notices & Alerts', 'Departmental Notices & Alerts'),
    official: t('Officer Telemetry Console', 'Officer Telemetry Console')
  };

  const ROUTE_NAME_MAP: Record<string, string> = {
    citizen: t('Citizen Portal', 'Citizen Portal'),
    dashboard: t('Beneficiary Dashboard', 'Beneficiary Dashboard'),
    admin: t('Administration Portal', 'Administration Portal'),
    login: t('Unified Sign In', 'Unified Sign In'),
    help: t('Helpdesk & FAQ', 'Helpdesk & FAQ'),
    privacy: t('Website Policies & DPDP Terms', 'Website Policies & DPDP Terms'),
    alerts: t('National Alerts', 'National Alerts'),
    legal: t('Legal & Compliance', 'Legal & Compliance'),
    'website-policies': t('Website Policies', 'Website Policies'),
    'terms-of-use': t('Terms of Use', 'Terms of Use'),
    'privacy-policy': t('Privacy Statement (DPDP Act)', 'Privacy Statement (DPDP Act)'),
    'hyperlinking-policy': t('Hyperlinking Policy', 'Hyperlinking Policy'),
    'copyright-policy': t('Copyright Policy', 'Copyright Policy'),
    rti: t('Right to Information (RTI)', 'Right to Information (RTI)'),
    'help-faq': t('Help & FAQ', 'Help & FAQ')
  };

  const segments = pathname.split('/').filter(Boolean);

  const crumbs = [
    { label: t('Home', 'Home'), href: '/' }
  ];

  let accumulatedPath = '';
  segments.forEach((seg) => {
    accumulatedPath += `/${seg}`;
    const rawLabel = ROUTE_NAME_MAP[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
    crumbs.push({
      label: t(rawLabel, rawLabel),
      href: accumulatedPath
    });
  });

  if (activeTab && TAB_NAME_MAP[activeTab]) {
    crumbs.push({
      label: TAB_NAME_MAP[activeTab],
      href: `${pathname}?tab=${activeTab}`
    });
  }

  return (
    <div className="w-full bg-slate-100 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 px-4 md:px-12 py-2 text-xs text-slate-600 dark:text-slate-400 select-none transition-colors">
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto flex items-center gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-1">
          <Home className="w-3.5 h-3.5 text-slate-500" />
          <span>{t('Home', 'Home')}</span>
        </Link>

        {crumbs.slice(1).map((crumb, idx) => {
          const isLast = idx === crumbs.length - 2;
          return (
            <React.Fragment key={crumb.href + idx}>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              {isLast ? (
                <span className="font-bold text-slate-900 dark:text-white" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="hover:text-blue-700 dark:hover:text-blue-400 transition hover:underline">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
};
export default Breadcrumbs;
