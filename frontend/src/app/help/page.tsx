'use client';

import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { 
  HelpCircle, 
  Compass, 
  LayoutDashboard, 
  ShieldCheck, 
  Lock, 
  Zap, 
  Building2, 
  FileText, 
  Search, 
  ChevronDown, 
  PhoneCall, 
  ExternalLink, 
  CheckCircle2, 
  Layers,
  Sparkles,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
  id: string;
  category: 'Privacy & DPDP' | 'DBT & Disbursal' | 'Interoperability' | 'AI & Guardrails' | 'Documents & e-KYC';
  question: string;
  answer: string;
  highlight?: string;
  icon: any;
}

export default function HelpPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin' || user?.role === 'SYSTEM_ADMIN' || user?.role === 'system_admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>('faq_dpdp');

  const faqs: FAQItem[] = useMemo(() => [
    {
      id: 'faq_diff',
      category: 'Interoperability',
      question: t('help.faqDiffQ', 'How is JanSetu different from standalone portals like DigiLocker or UMANG?'),
      answer: t('help.faqDiffA', 'While DigiLocker is a document repository and UMANG is an app aggregator, JanSetu acts as an intelligent orchestration layer. Rather than requiring citizens to search through hundreds of fragmented department websites, JanSetu analyzes your profile to discover all eligible Central and State welfare schemes, calculates exact financial subsidies, resolves document prerequisites, and manages end-to-end multi-departmental lifecycle progress in one unified timeline.'),
      highlight: 'Intelligent multi-portal orchestration & automated eligibility discovery',
      icon: Layers
    },
    {
      id: 'faq_dpdp',
      category: 'Privacy & DPDP',
      question: t('help.faqDpdpQ', 'How is my personal data and Aadhaar protected under the DPDP Act 2023?'),
      answer: t('help.faqDpdpA', 'JanSetu operates on a zero-knowledge, purpose-bound architecture in strict compliance with the Digital Personal Data Protection (DPDP) Act 2023. We never store raw Aadhaar numbers or sell biometric credentials. All demographic verification is conducted through ephemeral, cryptographically hashed tokens directly linked to UIDAI and DigiLocker. You retain full ownership with an immutable Consent Ledger where you can review, pause, or revoke departmental data access at any time.'),
      highlight: 'Zero-knowledge tokenization with real-time statutory consent revocation',
      icon: Lock
    },
    {
      id: 'faq_dbt',
      category: 'DBT & Disbursal',
      question: t('help.faqDbtQ', 'How does the Direct Benefit Transfer (DBT) reach my bank account without middlemen?'),
      answer: t('help.faqDbtA', 'Once your welfare application receives digital sanction from the designated Nodal Officer, payment instructions are processed via the Public Financial Management System (PFMS) and the National Payments Corporation of India (NPCI) Aadhaar Payment Bridge (APBS). Funds are transferred directly to your Aadhaar-seeded bank account with zero middleman deductions, complete with SMS delivery receipts and verifiable transaction hashes.'),
      highlight: 'Direct NPCI Aadhaar Payment Bridge (APBS) routing with zero leakages',
      icon: Zap
    },
    {
      id: 'faq_guardrails',
      category: 'AI & Guardrails',
      question: t('help.faqGuardrailsQ', 'Does the AI engine submit legal government applications without my permission?'),
      answer: t('help.faqGuardrailsA', 'No. JanSetu strictly adheres to a human-in-the-loop statutory guardrail protocol. While the AI assists by identifying eligibility, pre-filling forms, and validating document hashes, every consequential application submission requires your explicit, informed review. You are presented with a detailed verification modal showing the destination ministry, the exact data payload, and legal terms before any submission occurs.'),
      highlight: 'Mandatory human-in-the-loop review for all consequential submissions',
      icon: ShieldCheck
    },
    {
      id: 'faq_sources',
      category: 'Interoperability',
      question: t('help.faqSourcesQ', 'Where do the scheme rules, guidelines, and financial outlays come from?'),
      answer: t('help.faqSourcesA', 'All welfare schemes, eligibility rules, and benefit computations are 100% grounded in verified official sources, including Gazette notifications, the Union Budget 2025-26 outlays, and authoritative Central/State ministry portals (Ministry of Agriculture, MoHUA, MoHFW, Ministry of MSME). Every scheme card in the catalog provides a direct link to the official government portal for complete transparency.'),
      highlight: '100% verified grounding in Gazette notifications & Union Budget outlays',
      icon: Building2
    },
    {
      id: 'faq_docs',
      category: 'Documents & e-KYC',
      question: t('help.faqDocsQ', 'What happens if a scheme requires documents I have not uploaded yet?'),
      answer: t('help.faqDocsA', 'JanSetu integrates with the National Data Exchange Framework (NDEF) and DigiLocker APIs. If an application requires a domicile certificate, academic mark sheet, or caste verification that is available in national geo-registries, the system securely retrieves the verified digital copy upon your consent, saving you from having to locate physical papers or stand in physical administrative queues.'),
      highlight: 'Automated cross-departmental certificate retrieval via NDEF APIs',
      icon: FileText
    }
  ], [t]);

  const categories = ['All', 'Privacy & DPDP', 'DBT & Disbursal', 'Interoperability', 'AI & Guardrails', 'Documents & e-KYC'];

  const filteredFaqs = useMemo(() => {
    return faqs.filter(f => {
      const matchesCat = selectedCategory === 'All' || f.category === selectedCategory;
      if (!matchesCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        (f.highlight && f.highlight.toLowerCase().includes(q))
      );
    });
  }, [faqs, selectedCategory, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8 px-4 sm:px-6 animate-fadeIn">
      {/* Official Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-800/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[3]" /> DPDP Act 2023 Certified
            </span>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full">
              NeGP 2.0 Architectural Guardrails
            </span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full">
              GIGW 3.0 Standard
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <HelpCircle className="w-7 h-7 text-amber-400 shrink-0" />
              <span>{t('help.title', 'Citizen Knowledge & Statutory Help Desk')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Explore authoritative guidance on JanSetu's zero-knowledge privacy architecture, automated Direct Benefit Transfer (DBT) payment rails, and multi-departmental government interoperability.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative pt-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2 pointer-events-none mt-1" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('help.searchPlaceholder', 'Search frequently asked questions, privacy rules, DBT rails, or document workflows...')}
              className="w-full pl-11 pr-4 py-3 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-amber-400 text-white placeholder-slate-400 rounded-2xl text-xs sm:text-sm backdrop-blur-md outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 mt-1 text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded-md bg-white/10"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider shrink-0 flex items-center gap-1 mr-1">
          <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Topics:
        </span>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap border cursor-pointer ${isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-400'
                }`}
            >
              {cat}
            </button>
          );
        })}
        {(selectedCategory !== 'All' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* FAQ Cards Accordion Grid */}
      <div className="space-y-4">
        {filteredFaqs.map((faq) => {
          const isExpanded = expandedId === faq.id;
          const Icon = faq.icon;

          return (
            <div
              key={faq.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${isExpanded
                  ? 'border-blue-500 dark:border-blue-500/80 ring-2 ring-blue-500/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
            >
              {/* Question Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${isExpanded
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                        {faq.category}
                      </span>
                      {faq.highlight && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> {faq.highlight}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {faq.question}
                    </h3>
                  </div>
                </div>

                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-200 ${isExpanded
                    ? 'bg-blue-600 text-white border-blue-600 rotate-180'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {/* Answer Content */}
              {isExpanded && (
                <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-1">
                  <div className="pl-12.5 pt-3 space-y-3">
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {faq.answer}
                    </p>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Statutory Reference:
                      </span>
                      <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                        MeitY / UIDAI / NeGP Circular 2025-26
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredFaqs.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No matching questions found for "{searchQuery}"
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try searching with keywords like 'Aadhaar', 'DBT', 'DigiLocker', 'Privacy', or reset your search filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Official Citizen Support & Grievance Redressal Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* National Helpline */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 border border-slate-800 shadow-lg space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" /> 24x7 Citizen Assistance
            </span>
            <h3 className="text-base font-bold">National e-Governance Division (NeGD)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              For technical inquiries, DigiLocker authentication issues, or Aadhaar seeding guidance:
            </p>
          </div>
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <span className="text-lg font-mono font-black text-amber-400">1800-11-2026</span>
            <span className="text-[10px] text-slate-400">Toll-Free (All India)</span>
          </div>
        </div>

        {/* Central Grievance Redressal (CPGRAMS) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Department of Administrative Reforms
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Centralized Public Grievance (CPGRAMS)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              If an officer has delayed your sanctioned welfare disbursal past the statutory Citizen Charter SLA:
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <a
              href="https://pgportal.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>Lodge Grievance on pgportal.gov.in</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">48h SLA</span>
          </div>
        </div>
      </div>

      {/* Return / Next Action Footer Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {isAdmin ? t('help.returnDashboard', 'Return to Administrative Central Console') : t('help.readyToStart', 'Ready to explore your welfare entitlements?')}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {isAdmin ? t('help.adminDesc', 'Monitor live applications, manage state workflows, and audit data quality.') : t('help.tellUsGoal', 'Discover 36+ verified Central & State government welfare schemes tailored to your demographic profile.')}
          </p>
        </div>
        <Link
          href={isAdmin ? "/admin/dashboard" : "/citizen/dashboard"}
          className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition flex items-center gap-2 shadow-md shrink-0 cursor-pointer"
        >
          {isAdmin ? <LayoutDashboard className="w-4 h-4 text-amber-300" /> : <Compass className="w-4 h-4 text-amber-300" />}
          <span>{isAdmin ? t('admin.returnDashboard', 'Back to Admin Console') : t('help.startJourney', 'Launch Citizen Portal')}</span>
        </Link>
      </div>
    </div>
  );
}
