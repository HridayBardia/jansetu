'use client';

import React from 'react';
import { HelpCircle, ShieldCheck, Sparkles, FileText, Compass, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  const faqs = [
    {
      q: "How is Citizen Journey Engine different from DigiLocker or UMANG?",
      a: "Citizen Journey Engine does NOT replace DigiLocker or UMANG. It acts as an intelligence & orchestration layer. Rather than expecting citizens to know which forms or portals they need, the AI engine translates a real-world goal (e.g. 'I want to start a business in Karnataka') into a verified step-by-step workflow connecting official portals."
    },
    {
      q: "Does the AI engine submit applications without my permission?",
      a: "No. The AI Engine never submits consequential government applications independently. Every consequential submission requires explicit human review displaying the data payload, destination department, and consequences."
    },
    {
      q: "Where does the government rule information come from?",
      a: "All requirements, eligibility rules, and instructions are 100% grounded in verified official government sources (Ministry of MSME, BBMP Karnataka, NSDL Vidya Lakshmi, Nadakacheri Revenue Dept). You can click the 'ⓘ Source' button on any step to inspect the publishing authority and official URL."
    },
    {
      q: "Can I use voice or regional Indian languages?",
      a: "Yes! You can speak or type in English, Hindi, Kannada, or mixed language (Hinglish/Kanglish) like 'Mujhe Karnataka mein business start karna hai'. The AI engine automatically parses intent and maps location dependencies."
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-400" />
            <span>Help & Grounded Information</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Understanding the Citizen Journey Engine architecture and legal transparency guardrails
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {faqs.map((f, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
            <h3 className="text-sm font-bold text-slate-100 flex items-start gap-2">
              <span className="text-amber-400 font-extrabold">Q.</span>
              <span>{f.q}</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed pl-5">
              {f.a}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-100">Ready to start your citizen journey?</h3>
          <p className="text-xs text-slate-400">Tell us what you want to accomplish in natural language.</p>
        </div>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-xs hover:brightness-110 transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
        >
          <Compass className="w-4 h-4 text-slate-950" />
          <span>Start a Journey</span>
        </Link>
      </div>
    </div>
  );
}
