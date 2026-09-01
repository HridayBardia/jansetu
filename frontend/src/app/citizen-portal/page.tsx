'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { 
  ShieldCheck, 
  Compass, 
  Bot, 
  Globe, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  FolderLock, 
  FileText, 
  Landmark, 
  Search, 
  Building2, 
  Users, 
  Award, 
  Zap, 
  Eye, 
  HelpCircle,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  FileCheck2,
  RefreshCw
} from 'lucide-react';

export default function CitizenPortalPage() {
  const { t, language } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Sample public schemes for preview
  const PUBLIC_SCHEMES = [
    {
      id: 'sch-pmay',
      title: t('Pradhan Mantri Awas Yojana (Urban & Gramin)', 'Pradhan Mantri Awas Yojana (Urban & Gramin)'),
      category: 'HOUSING',
      categoryLabel: t('Housing & Urban', 'Housing & Urban'),
      ministry: t('Ministry of Housing and Urban Affairs', 'Ministry of Housing and Urban Affairs'),
      benefit: '₹ 2,50,000 subsidy',
      eligibility: t('Income under ₹6 LPA, non-pukka house owners, verified ration card', 'Income under ₹6 LPA, non-pukka house owners, verified ration card'),
      tags: [t('Direct Subsidy', 'Direct Subsidy'), t('DBT Enabled', 'DBT Enabled')]
    },
    {
      id: 'sch-pmkisan',
      title: t('PM Kisan Samman Nidhi Yojana', 'PM Kisan Samman Nidhi Yojana'),
      category: 'AGRICULTURE',
      categoryLabel: t('Agriculture & Farmers', 'Agriculture & Farmers'),
      ministry: t('Ministry of Agriculture & Farmers Welfare', 'Ministry of Agriculture & Farmers Welfare'),
      benefit: '₹ 6,000 / year',
      eligibility: t('Landholding farmer families with cultivable land registered in state Khasra', 'Landholding farmer families with cultivable land registered in state Khasra'),
      tags: [t('Quarterly Installments', 'Quarterly Installments'), t('Aadhaar Seeded', 'Aadhaar Seeded')]
    },
    {
      id: 'sch-postmatric',
      title: t('Post-Matric Scholarship for Higher Education', 'Post-Matric Scholarship for Higher Education'),
      category: 'EDUCATION',
      categoryLabel: t('Education & Students', 'Education & Students'),
      ministry: t('Ministry of Social Justice & Empowerment', 'Ministry of Social Justice & Empowerment'),
      benefit: t('100% Tuition + Maintenance Allowance', '100% Tuition + Maintenance Allowance'),
      eligibility: t('Enrolled in recognized diploma/degree, family income criteria verified', 'Enrolled in recognized diploma/degree, family income criteria verified'),
      tags: [t('Merit-cum-Means', 'Merit-cum-Means'), t('Fee Waiver', 'Fee Waiver')]
    },
    {
      id: 'sch-mudra',
      title: t('Pradhan Mantri MUDRA Yojana (Shishu, Kishore, Tarun)', 'Pradhan Mantri MUDRA Yojana (Shishu, Kishore, Tarun)'),
      category: 'BUSINESS',
      categoryLabel: t('Business & MSME', 'Business & MSME'),
      ministry: t('Ministry of Finance', 'Ministry of Finance'),
      benefit: t('Collateral-free loans up to ₹10 Lakhs', 'Collateral-free loans up to ₹10 Lakhs'),
      eligibility: t('Non-corporate, non-farm micro/small enterprise owners', 'Non-corporate, non-farm micro/small enterprise owners'),
      tags: [t('0% Collateral', '0% Collateral'), t('Bank Disbursed', 'Bank Disbursed')]
    },
    {
      id: 'sch-ayushman',
      title: t('Ayushman Bharat PM-JAY National Health Protection', 'Ayushman Bharat PM-JAY National Health Protection'),
      category: 'HEALTH',
      categoryLabel: t('Health & Social Welfare', 'Health & Social Welfare'),
      ministry: t('Ministry of Health and Family Welfare', 'Ministry of Health and Family Welfare'),
      benefit: '₹ 5,00,000 / family / year',
      eligibility: t('SECC database identified vulnerable families across all states', 'SECC database identified vulnerable families across all states'),
      tags: [t('Cashless Treatment', 'Cashless Treatment'), t('Empanelled Hospitals', 'Empanelled Hospitals')]
    },
    {
      id: 'sch-skill',
      title: t('Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0)', 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0)'),
      category: 'EDUCATION',
      categoryLabel: t('Skill Development', 'Skill Development'),
      ministry: t('Ministry of Skill Development & Entrepreneurship', 'Ministry of Skill Development & Entrepreneurship'),
      benefit: t('Free Industry Training + Certification + Stipend', 'Free Industry Training + Certification + Stipend'),
      eligibility: t('Indian youth aged 15-45 seeking industry-ready skill certifications', 'Indian youth aged 15-45 seeking industry-ready skill certifications'),
      tags: [t('Industry Placement', 'Industry Placement'), t('Digital Badge', 'Digital Badge')]
    }
  ];

  const filteredSchemes = PUBLIC_SCHEMES.filter(s => {
    const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.ministry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.eligibility.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLaunchDashboard = () => {
    if (isAuthenticated && user) {
      router.push('/citizen/dashboard');
    } else {
      router.push('/login?redirect=/citizen/dashboard');
    }
  };

  return (
    <div className="w-full space-y-16 py-4 animate-fade-in text-slate-900 dark:text-slate-100 font-sans">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION & STRATEGIC OVERVIEW                                      */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-blue-50/70 via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 border border-slate-200 dark:border-slate-800 p-6 md:p-12 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          {/* Government Flagship Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-[#133E87] dark:text-blue-300 text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t('Digital Public Infrastructure | Government of India', 'Digital Public Infrastructure | Government of India')}</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight md:leading-[1.15]">
            {t('JanSetu Citizen Portal: Empowering Every Indian with AI-Driven Civic Access', 'JanSetu Citizen Portal: Empowering Every Indian with AI-Driven Civic Access')}
          </h1>

          {/* Subtitle */}
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {t(
              'portal.heroDesc',
              'India\'s sovereign single-window gateway designed to discover, track, and secure government welfare entitlements, land due diligence, and statutory licenses without physical paperwork, photocopies, or administrative delays.'
            )}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleLaunchDashboard}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold px-7 py-3.5 rounded-xl text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>{t('portal.enterDashboard', 'Enter Beneficiary Portal (Login / e-KYC)')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#schemes-preview"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold px-6 py-3.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 shadow-2xs hover:shadow-xs transition cursor-pointer"
            >
              <Search className="w-4 h-4 text-[#133E87] dark:text-blue-400" />
              <span>{t('portal.exploreSchemes', 'Explore Schemes & Services')}</span>
            </a>
          </div>

          {/* Trust Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200 dark:border-slate-800 text-left">
            <div className="bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3 shadow-2xs">
              <span className="text-xl font-black text-blue-900 dark:text-blue-300 font-mono">840+</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t('Central & State Schemes', 'Central & State Schemes')}</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3 shadow-2xs">
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">23</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t('Official Indian Languages', 'Official Indian Languages')}</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3 shadow-2xs">
              <span className="text-xl font-black text-amber-700 dark:text-amber-400 font-mono">100%</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t('Consent-First Vaulted', 'Consent-First Vaulted')}</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3 shadow-2xs">
              <span className="text-xl font-black text-purple-700 dark:text-purple-400 font-mono">&lt; 120ms</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t('Sub-Second Verification', 'Sub-Second Verification')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CORE CITIZEN BENEFITS (4 PILLARS)                                      */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
            {t('portal.pillarsHeading', 'Four Pillars of Sovereign Citizen Enablement')}
          </h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
            {t('portal.pillarsSub', 'Engineered under GIGW 3.0 standards to make public administration transparent, predictable, and hassle-free.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1: Milestone Roadmaps */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-6 shadow-sm hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-[#133E87] dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <Compass className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('Milestone-Based Journey Roadmaps', 'Milestone-Based Journey Roadmaps')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('Converts complex government gazettes, multi-departmental circulars, and eligibility criteria into clear, automated step-by-step checklists with transparent SLAs and zero guesswork.', 'Converts complex government gazettes, multi-departmental circulars, and eligibility criteria into clear, automated step-by-step checklists with transparent SLAs and zero guesswork.')}
              </p>
            </div>
            <ul className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t('Automated Directed Acyclic Graph (DAG) workflow scheduling', 'Automated Directed Acyclic Graph (DAG) workflow scheduling')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t('Live departmental milestone tracking with automated alerts', 'Live departmental milestone tracking with automated alerts')}</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2: Consent Document Vault */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 shadow-sm hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('Secure Consent Document Vault', 'Secure Consent Document Vault')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('Zero physical xerox photocopies. Connects directly to your DigiLocker and authoritative registries with granular, purpose-limited revocable tokens complying with the DPDP Act 2023.', 'Zero physical xerox photocopies. Connects directly to your DigiLocker and authoritative registries with granular, purpose-limited revocable tokens complying with the DPDP Act 2023.')}
              </p>
            </div>
            <ul className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t('Instant e-KYC attestation with tamper-proof digital seals', 'Instant e-KYC attestation with tamper-proof digital seals')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t('1-Click consent revocation and complete transparency logs', '1-Click consent revocation and complete transparency logs')}</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3: SetuSahayak AI Intelligence */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 rounded-2xl p-6 shadow-sm hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
              <Bot className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('SetuSahayak AI Intelligence', 'SetuSahayak AI Intelligence')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('Ask questions in natural language. SetuSahayak translates bureaucratic legalese into straightforward guidance, calculates subsidy amounts, and flags missing eligibility credentials.', 'Ask questions in natural language. SetuSahayak translates bureaucratic legalese into straightforward guidance, calculates subsidy amounts, and flags missing eligibility credentials.')}
              </p>
            </div>
            <ul className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t('Direct clause citations from official gazettes and portals', 'Direct clause citations from official gazettes and portals')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t('24/7 sovereign civic advisory in voice and text', '24/7 sovereign civic advisory in voice and text')}</span>
              </li>
            </ul>
          </div>

          {/* Pillar 4: 23-Language Native Support */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 rounded-2xl p-6 shadow-sm hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800">
              <Globe className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('23-Language Native Support', '23-Language Native Support')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('Full linguistic inclusivity powered by AI4Bharat IndicTrans2. Every citizen interacts with government services in their native mother tongue with zero loss of legal precision.', 'Full linguistic inclusivity powered by AI4Bharat IndicTrans2. Every citizen interacts with government services in their native mother tongue with zero loss of legal precision.')}
              </p>
            </div>
            <ul className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t('Zero-latency hybrid dictionary and neural translation pipeline', 'Zero-latency hybrid dictionary and neural translation pipeline')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t('Full RTL and bidirectional typography support', 'Full RTL and bidirectional typography support')}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. "HOW IT WORKS FOR YOU" (4-STEP CITIZEN JOURNEY FLOW)                    */}
      {/* ========================================================================= */}
      <section className="bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#133E87] dark:text-blue-400 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800">
            {t('portal.howItWorksTag', 'Simple 4-Step Process')}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
            {t('portal.howItWorksHeading', 'How JanSetu Works for Every Citizen')}
          </h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
            {t('portal.howItWorksSub', 'From setting a life goal to receiving direct benefits in four transparent stages.')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 relative shadow-2xs">
            <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-[#133E87] dark:text-blue-400 font-mono font-black text-sm flex items-center justify-center border border-blue-200 dark:border-blue-800">
              01
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('portal.step1Title', '1. State Your Life Goal')}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('portal.step1Desc', 'Type or speak your goal in plain words, like "I want to start a food business in Vadodara" or "Scholarship in Rajasthan".')}
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 relative shadow-2xs">
            <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-mono font-black text-sm flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              02
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('portal.step2Title', '2. AI Pre-Checks Eligibility')}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('portal.step2Desc', 'The engine parses state and national policies, checking your domicile, age, and records to build a tailored journey.')}
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 relative shadow-2xs">
            <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-mono font-black text-sm flex items-center justify-center border border-amber-200 dark:border-amber-800">
              03
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('portal.step3Title', '3. 1-Click Vault Verification')}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('portal.step3Desc', 'Attest documents instantly via DigiLocker with secure cryptographic signatures without visiting any physical counter.')}
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 relative shadow-2xs">
            <span className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 font-mono font-black text-sm flex items-center justify-center border border-purple-200 dark:border-purple-800">
              04
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('portal.step4Title', '4. Receive Direct Benefit')}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('portal.step4Desc', 'Track real-time department approvals, SLA countdowns, and direct bank account disbursement notifications.')}
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PUBLIC SCHEMES & ENTITLEMENTS EXPLORER PREVIEW                         */}
      {/* ========================================================================= */}
      <section id="schemes-preview" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              {t('portal.directoryTag', 'Public Scheme Explorer')}
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {t('portal.browseSchemesHeading', 'Featured National & State Welfare Programmes')}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('portal.browseSchemesSub', 'Explore open government programmes and check criteria before signing into your dashboard.')}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLaunchDashboard}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#133E87] dark:text-blue-400 hover:underline self-start md:self-auto cursor-pointer"
          >
            <span>{t('portal.viewAllInDashboard', 'View all 840+ schemes in Beneficiary Dashboard')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('portal.searchSchemesPlaceholder', 'Search by scheme name, ministry, or keyword (e.g. Housing, Farmer, MUDRA)...')}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#133E87] shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'HOUSING', 'AGRICULTURE', 'EDUCATION', 'BUSINESS', 'HEALTH'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#133E87] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {cat === 'ALL' ? t('All Categories', 'All Categories') : t(cat, cat)}
              </button>
            ))}
          </div>
        </div>

        {/* Scheme Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchemes.map((scheme) => (
            <div
              key={scheme.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#133E87] dark:hover:border-blue-500 rounded-2xl p-5 shadow-2xs hover:shadow-sm transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#133E87] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {scheme.categoryLabel}
                  </span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    {scheme.benefit}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {scheme.title}
                </h4>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {scheme.ministry}
                </p>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-slate-100">{t('portal.eligibilityLabel', 'Eligibility:')}</strong> {scheme.eligibility}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {scheme.tags.map((tg, i) => (
                    <span key={i} className="text-[9px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {tg}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleLaunchDashboard}
                  className="text-xs font-bold text-[#133E87] dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>{t('portal.applyNow', 'Apply →')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CITIZEN PRIVACY & SOVEREIGN TRUST COMMITMENT (DPDP ACT 2023)           */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-6 md:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('portal.dpdpBadge', 'DPDP Act 2023 Statutory Compliance')}</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black">
                {t('portal.privacyHeading', 'Your Data Sovereignty is Non-Negotiable')}
              </h3>
            </div>

            <Link
              href="/legal/privacy-policy"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition self-start sm:self-auto"
            >
              <span>{t('portal.readPrivacyPolicy', 'Read DPDP Statement')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1.5">
              <span className="font-bold text-amber-300 block">{t('portal.privacyPoint1Title', 'Zero Data Monetization')}</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {t('portal.privacyPoint1Desc', 'JanSetu is a sovereign Digital Public Good. Citizen identifiers and telemetry are never commercialized or shared with third parties.')}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1.5">
              <span className="font-bold text-emerald-300 block">{t('portal.privacyPoint2Title', 'Purpose-Limited Consent')}</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {t('portal.privacyPoint2Desc', 'Every departmental access request is bound to a single purpose and requires your explicit, cryptographic authorization.')}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1.5">
              <span className="font-bold text-cyan-300 block">{t('portal.privacyPoint3Title', 'Instant Revocation & Audit')}</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {t('portal.privacyPoint3Desc', 'Inspect complete audit trails of which agency accessed your records, and revoke credentials at any time in one touch.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. BOTTOM CALL TO ACTION BANNER                                           */}
      {/* ========================================================================= */}
      <section className="text-center py-10 px-6 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
            {t('portal.bottomCtaHeading', 'Ready to Access Your Sovereign Civic Benefits?')}
          </h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
            {t('portal.bottomCtaSub', 'Sign in with your Aadhaar / Mobile number or explore the platform using demo credentials.')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleLaunchDashboard}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl text-xs shadow-md transition cursor-pointer"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>{t('portal.launchBeneficiaryDashboard', 'Launch Beneficiary Dashboard')}</span>
          </button>

          <Link
            href="/help"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold px-6 py-3 rounded-xl text-xs border border-slate-300 dark:border-slate-700 shadow-2xs transition"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>{t('portal.citizenHelpdesk', 'Citizen Helpdesk & FAQs')}</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
