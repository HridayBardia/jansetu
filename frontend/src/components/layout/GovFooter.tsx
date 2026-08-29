'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export const GovFooter: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-slate-100 dark:bg-slate-950 border-t border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs py-8 px-4 md:px-12 transition-colors select-none font-sans mt-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Tier: Official Mandatory Policy Links */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 border-b border-slate-200 dark:border-slate-800 pb-5 font-medium text-slate-700 dark:text-slate-300">
          <Link href="/legal/website-policies" className="hover:text-blue-800 dark:hover:text-blue-400 transition hover:underline focus:outline-hidden focus:ring-2 focus:ring-blue-600 rounded-sm py-0.5">
            {t('footer.websitePolicies', 'Website Policies')}
          </Link>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <Link href="/legal/terms-of-use" className="hover:text-blue-800 dark:hover:text-blue-400 transition hover:underline focus:outline-hidden focus:ring-2 focus:ring-blue-600 rounded-sm py-0.5">
            {t('footer.termsOfUse', 'Terms of Use')}
          </Link>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <Link href="/legal/privacy-policy" className="hover:text-blue-800 dark:hover:text-blue-400 transition hover:underline focus:outline-hidden focus:ring-2 focus:ring-blue-600 rounded-sm py-0.5">
            {t('footer.privacyStatement', 'Privacy Statement (DPDP Act)')}
          </Link>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <Link href="/legal/hyperlinking-policy" className="hover:text-blue-800 dark:hover:text-blue-400 transition hover:underline focus:outline-hidden focus:ring-2 focus:ring-blue-600 rounded-sm py-0.5">
            {t('footer.hyperlinkPolicy', 'Hyperlinking Policy')}
          </Link>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <Link href="/legal/copyright-policy" className="hover:text-blue-800 dark:hover:text-blue-400 transition hover:underline focus:outline-hidden focus:ring-2 focus:ring-blue-600 rounded-sm py-0.5">
            {t('footer.copyrightPolicy', 'Copyright Policy')}
          </Link>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <Link href="/legal/rti" className="hover:text-blue-800 dark:hover:text-blue-400 transition hover:underline focus:outline-hidden focus:ring-2 focus:ring-blue-600 rounded-sm py-0.5">
            {t('footer.rti', 'Right to Information (RTI)')}
          </Link>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <Link href="/legal/help-faq" className="hover:text-blue-800 dark:hover:text-blue-400 transition hover:underline focus:outline-hidden focus:ring-2 focus:ring-blue-600 rounded-sm py-0.5">
            {t('footer.helpFaq', 'Help & FAQ')}
          </Link>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <a 
            href="https://india.gov.in" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-blue-800 dark:hover:text-blue-400 transition hover:underline inline-flex items-center gap-1 focus:outline-hidden focus:ring-2 focus:ring-blue-600 rounded-sm py-0.5"
          >
            <span>{t('footer.nationalPortal', 'National Portal of India')}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>

        {/* Middle Tier: Content Attribution & Technical Info */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-xs text-slate-600 dark:text-slate-400">
          <div className="space-y-1 max-w-2xl">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {t('footer.managedBy', 'Content Managed by Ministry of Electronics & IT, Government of India. Designed, Developed and Hosted by National Informatics Centre (NIC).')}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t('footer.tagline', 'JanSetu is a national public digital infrastructure platform for automated welfare service delivery and interoperability under the MeitY Framework.')}
            </p>
          </div>

          {/* Compliance & Security Seals */}
          <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('footer.gigwCompliant', 'GIGW 3.0 Standard Compliant')}</span>
            </div>
            <div className="px-3 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
              <span>{t('footer.isoCertified', 'Certified ISO 27001 Security')}</span>
            </div>
          </div>
        </div>

        {/* Bottom Tier: Copyright */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <p>{t('footer.allRightsReserved', '© 2026 JanSetu. All Rights Reserved. Government of India.')}</p>
          <p className="font-mono">Last Updated: 28 August 2026 • Build Release v3.0-GIGW</p>
        </div>
      </div>
    </footer>
  );
};
export default GovFooter;
