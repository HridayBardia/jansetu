'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ShieldCheck, Printer, Share2, Calendar, CheckCircle } from 'lucide-react';

interface PolicyHeaderProps {
  title: string;
  description: string;
  lastUpdated?: string;
  gazetteId?: string;
  onPrint?: () => void;
  onShare?: () => void;
}

export const PolicyHeader: React.FC<PolicyHeaderProps> = ({
  title,
  description,
  lastUpdated = 'August 2026',
  gazetteId = 'JS-MEITY-2026-LEG-09',
  onPrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  },
  onShare = () => {
    if (typeof window !== 'undefined') {
      if (navigator.share) {
        navigator.share({ title, url: window.location.href }).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
      }
    }
  },
}) => {
  const { t } = useLanguage();

  return (
    <header className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 py-8 px-6 lg:px-12 transition-colors duration-200 rounded-xl mb-6 shadow-2xs">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Compliance Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-semibold tracking-wide uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
          <span>{t('GIGW 3.0 & DPDP ACT COMPLIANCE REPOSITORY', 'GIGW 3.0 & DPDP ACT COMPLIANCE REPOSITORY')}</span>
        </div>

        {/* Title and Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t(title, title)}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {t(description, description)}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onPrint}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>{t('Print Policy', 'Print Policy')}</span>
            </button>
            <button
              onClick={onShare}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>{t('Share', 'Share')}</span>
            </button>
          </div>
        </div>

        {/* Metadata Footer Bar */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {t('Last Updated:', 'Last Updated:')} {lastUpdated}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium">
              <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              {t('NIC Guidelines', 'NIC Guidelines')}
            </span>
          </div>

          <span className="font-mono text-slate-500 dark:text-slate-400">
            {t('Official Gazette Publication ID:', 'Official Gazette Publication ID:')} {gazetteId}
          </span>
        </div>
      </div>
    </header>
  );
};

export default PolicyHeader;
