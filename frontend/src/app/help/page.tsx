'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { HelpCircle, Compass } from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  const { t } = useLanguage();
  
  const faqs = [
    {
      q: t("help.faqDifferenceQuestion", "How is Citizen Journey Engine different from DigiLocker or UMANG?"),
      a: t("help.faqDifferenceAnswer", "Citizen Journey Engine does NOT replace DigiLocker or UMANG. It acts as an intelligence & orchestration layer. Rather than expecting citizens to know which forms or portals they need, the AI engine translates a real-world goal (e.g. 'I want to start a business in Karnataka') into a verified step-by-step workflow connecting official portals.")
    },
    {
      q: t("help.faqPermissionQuestion", "Does the AI engine submit applications without my permission?"),
      a: t("help.faqPermissionAnswer", "No. The AI Engine never submits consequential government applications independently. Every consequential submission requires explicit human review displaying the data payload, destination department, and consequences.")
    },
    {
      q: t("help.faqSourcesQuestion", "Where does the government rule information come from?"),
      a: t("help.faqSourcesAnswer", "All requirements, eligibility rules, and instructions are 100% grounded in verified official government sources (Ministry of MSME, BBMP Karnataka, NSDL Vidya Lakshmi, Nadakacheri Revenue Dept). You can click the 'ⓘ Source' button on any step to inspect the publishing authority and official URL.")
    },
    {
      q: t("help.faqVoiceQuestion", "Can I use voice or regional Indian languages?"),
      a: t("help.faqVoiceAnswer", "Yes! You can speak or type in English, Hindi, Kannada, or mixed language (Hinglish/Kanglish) like 'Mujhe Karnataka mein business start karna hai'. The AI engine automatically parses intent and maps location dependencies.")
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6 px-4 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-[#133E87] dark:text-amber-400" />
            <span>{t("help.title", "Help & Information Desk")}</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {t("help.subtitle", "Understanding the architecture and statutory guardrails of the Citizen Journey Engine.")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {faqs.map((f, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-5 space-y-2 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400 font-extrabold">Q.</span>
              <span>{f.q}</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-5">
              {f.a}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{t("help.readyToStart", "Ready to start your citizen journey?")}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">{t("help.tellUsGoal", "Tell us your goal in natural language on the Dashboard.")}</p>
        </div>
        <Link
          href="/citizen/dashboard"
          className="px-5 py-2.5 rounded-xl bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-sm"
        >
          <Compass className="w-4 h-4 text-amber-400" />
          <span>{t("help.startJourney", "Start Your Journey")}</span>
        </Link>
      </div>
    </div>
  );
}
