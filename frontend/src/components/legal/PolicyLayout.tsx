'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Shield, 
  FileText, 
  ChevronRight, 
  Globe, 
  Scale, 
  Lock, 
  Link2, 
  HelpCircle, 
  FileCheck2,
  BookmarkCheck
} from 'lucide-react';
import { getAllPolicies, LegalPolicy } from '@/data/legalContent';
import { useLanguage } from '@/context/LanguageContext';
import { PolicyHeader } from './PolicyHeader';

interface PolicyLayoutProps {
  currentPolicy: LegalPolicy;
  children: React.ReactNode;
}

const POLICY_ICONS: Record<string, React.ReactNode> = {
  'website-policies': <Globe className="w-4 h-4" />,
  'terms-of-use': <Scale className="w-4 h-4" />,
  'privacy-policy': <Lock className="w-4 h-4" />,
  'hyperlinking-policy': <Link2 className="w-4 h-4" />,
  'copyright-policy': <BookmarkCheck className="w-4 h-4" />,
  'rti': <FileCheck2 className="w-4 h-4" />,
  'help-faq': <HelpCircle className="w-4 h-4" />
};

export const PolicyLayout: React.FC<PolicyLayoutProps> = ({ currentPolicy, children }) => {
  const { t } = useLanguage();
  const allPolicies = getAllPolicies();

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-3 sm:px-6 lg:px-8 space-y-8 font-sans">
      {/* Top Standard GIGW Policy Header */}
      <PolicyHeader
        title={currentPolicy.title}
        description={currentPolicy.metaDescription}
        lastUpdated={currentPolicy.lastUpdated}
        gazetteId="JS-MEITY-2026-LEG-09"
      />

      {/* 22 Regional Languages Compliance Notice Banner */}
      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-4 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
        <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">
            {t('legal.bilingualMandate', 'Official 22 Scheduled Language Gazette Notice')}
          </p>
          <p className="text-amber-800 dark:text-amber-300/90 text-[11px] leading-relaxed">
            In accordance with Digital India Bhashini guidelines and Article 343/Eighth Schedule provisions, this policy is translated dynamically across all 22 official scheduled languages. Use the top language selector to switch dialects instantly. The English and Hindi gazette texts serve as the primary authentic references in legal disputes.
          </p>
        </div>
      </div>

      {/* Main Grid: Sticky Sidebar + Policy Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sticky Desktop Sidebar Navigation */}
        <aside className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Civic Policy Directory</span>
              </h2>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                7 Documents
              </span>
            </div>

            <nav aria-label="Legal policies" className="p-2 space-y-1">
              {allPolicies.map((policy) => {
                const isActive = policy.id === currentPolicy.id;
                const icon = POLICY_ICONS[policy.id] || <FileText className="w-4 h-4" />;
                return (
                  <Link
                    key={policy.id}
                    href={`/legal/${policy.id}`}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={isActive ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}>
                        {icon}
                      </span>
                      <span className="truncate">{policy.shortTitle}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-blue-700 dark:text-blue-400 translate-x-0.5' : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400'}`} />
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Verification & Helpdesk Callout */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Grievance & DPO Helpline</span>
            </h3>
            <p className="text-[11px] leading-relaxed">
              Questions regarding DPDP compliance or data revocation? Contact the Data Protection Officer directly at <span className="font-mono text-blue-600 dark:text-blue-400">dpo.jansetu@gov.in</span> or call toll-free <span className="font-bold text-slate-900 dark:text-white">1800-11-2026</span>.
            </p>
          </div>
        </aside>

        {/* Policy Body Content */}
        <main className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-2xs space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PolicyLayout;
