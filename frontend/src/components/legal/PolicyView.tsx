'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PolicyLayout } from './PolicyLayout';
import { getPolicyById, LEGAL_POLICIES } from '@/data/legalContent';
import { useLanguage } from '@/context/LanguageContext';
import { 
  FileText, 
  CheckCircle2, 
  ExternalLink, 
  ArrowRight,
  ShieldCheck, 
  Sparkles,
  HelpCircle,
  PhoneCall
} from 'lucide-react';
import Link from 'next/link';

interface PolicyViewProps {
  policyId?: string;
}

export const PolicyView: React.FC<PolicyViewProps> = ({ policyId: propPolicyId }) => {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();

  // Extract from params or prop
  const rawId = (propPolicyId || (params?.policyId as string) || 'website-policies').toLowerCase();
  const policy = getPolicyById(rawId);

  useEffect(() => {
    // If slug is not recognized, redirect smoothly to default website-policies
    if (!policy) {
      router.replace('/legal/website-policies');
    }
  }, [policy, router]);

  if (!policy) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm text-slate-500">Redirecting to official policy portal...</p>
      </div>
    );
  }

  return (
    <PolicyLayout currentPolicy={policy}>
      <article className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
        {/* Document Header within content */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              Official Document Series
            </span>
            <span className="text-xs font-mono text-slate-400">
              Ref: MEITY/JS/{policy.id.toUpperCase()}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {policy.title}
          </h2>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8">
          {policy.sections.map((section, idx) => (
            <section 
              key={idx} 
              id={`section-${idx + 1}`}
              className="space-y-3 scroll-mt-28"
            >
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-l-3 border-blue-600 pl-3">
                <span>{section.heading}</span>
              </h3>

              <div className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300 pl-4">
                {Array.isArray(section.content) ? (
                  section.content.map((paragraph, pIdx) => {
                    const isBullet = paragraph.startsWith('•') || paragraph.startsWith('-');
                    if (isBullet) {
                      return (
                        <div key={pIdx} className="flex items-start gap-2.5 ml-2 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-2 shrink-0" />
                          <span className="leading-relaxed">
                            {paragraph.replace(/^[•\-]\s*/, '')}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <p key={pIdx} className="leading-relaxed">
                        {paragraph}
                      </p>
                    );
                  })
                ) : (
                  <p className="leading-relaxed">{section.content}</p>
                )}

                {/* Subsections if present */}
                {section.subsections && (
                  <div className="mt-4 space-y-3 pl-2">
                    {section.subsections.map((sub, subIdx) => (
                      <div key={subIdx} className="space-y-1.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          {sub.subheading}
                        </h4>
                        <ul className="space-y-1 pl-3">
                          {sub.points.map((pt, ptIdx) => (
                            <li key={ptIdx} className="text-xs text-slate-600 dark:text-slate-400 list-disc">
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Section: Additional Departmental Directives & Quick Links */}
        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Related Statutory Frameworks & Portals
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="https://www.meity.gov.in/content/digital-personal-data-protection-act-2023"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-blue-300 dark:hover:border-blue-700 transition flex items-center justify-between text-xs font-medium text-slate-800 dark:text-slate-200 group"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>DPDP Act 2023 Gazette Copy</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
            </a>

            <a
              href="https://www.nic.in"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-blue-300 dark:hover:border-blue-700 transition flex items-center justify-between text-xs font-medium text-slate-800 dark:text-slate-200 group"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>GIGW 3.0 Compliance Matrix (NIC)</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
            </a>
          </div>
        </div>

        {/* Citizen Assurance Sign-off */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 text-xs">
            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Need help applying or understanding policies?</span>
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Our automated Welfare Navigator guides you step-by-step through required documents with zero guesswork.
            </p>
          </div>
          <Link
            href="/citizen/dashboard?tab=planner"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs transition shrink-0"
          >
            <span>Launch Goal Navigator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </article>
    </PolicyLayout>
  );
};

export default PolicyView;
