'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Compass, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';

const testJourney = {
  id: "preview-test",
  goal: "I live in Udaipur and want to go to Australia for masters",
  jurisdiction: {
    domicile_state: "Rajasthan",
    destination_country: "Australia"
  },
  documents_available: [
    { name: "Aadhaar Card", status: "Verified", demo: true },
    { name: "PAN Card", status: "Verified", demo: true },
    { name: "Class 10 Marksheet", status: "Verified", demo: true },
    { name: "Class 12 Marksheet", status: "Verified", demo: true }
  ],
  documents_required: [
    { name: "Valid Passport", reason: "Required for international travel and study." },
    { name: "English Language Test Result", reason: "May be required by the university and/or visa process." },
    { name: "Academic Transcripts", reason: "Required for university admission assessment." },
    { name: "Degree / Provisional Certificate", reason: "May be required depending on admission requirements." }
  ],
  schemes: []
};

export default function JourneyPreviewPage() {
  const [journey, setJourney] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem("activeCitizenJourney");
      if (stored) {
        try {
          setJourney(JSON.parse(stored));
        } catch (e) {
          console.warn("Failed to parse activeCitizenJourney:", e);
        }
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020205] text-white flex flex-col items-center justify-center p-4">
        <p className="text-slate-400 text-sm">Loading journey preview...</p>
      </div>
    );
  }

  // Fallback to testJourney if nothing is set in storage
  const activeJourney = journey || testJourney;

  // Extract variables safely
  const goalTitle = activeJourney?.goal?.title || activeJourney?.goal || "Citizen Goal";
  const domicileState = activeJourney?.location?.domicile_state || activeJourney?.jurisdiction?.domicile_state || "Rajasthan";
  const targetCountry = activeJourney?.location?.destination || activeJourney?.jurisdiction?.destination_country || "Australia";

  const rawHave = Array.isArray(activeJourney?.documents?.available) 
    ? activeJourney.documents.available 
    : Array.isArray(activeJourney?.documents_available)
      ? activeJourney.documents_available
      : Array.isArray(activeJourney?.documents?.have)
        ? activeJourney.documents.have
        : [];

  const rawNeed = Array.isArray(activeJourney?.documents?.needed) 
    ? activeJourney.documents.needed 
    : Array.isArray(activeJourney?.documents_required)
      ? activeJourney.documents_required
      : Array.isArray(activeJourney?.documents?.need)
        ? activeJourney.documents.need
        : [];

  const schemesList = Array.isArray(activeJourney?.schemes) 
    ? activeJourney.schemes 
    : [
        ...(activeJourney?.schemes?.central || []),
        ...(activeJourney?.schemes?.state || []),
        ...(activeJourney?.schemes?.targetLocation || []),
        ...(activeJourney?.schemes?.domicileState || []),
        ...(activeJourney?.schemes?.targetState || [])
      ].filter((v, idx, self) => self.findIndex(t => (t.id === v.id || t.name === v.name)) === idx);

  return (
    <div className="min-h-screen bg-[#020205] text-slate-100 py-10 px-4 md:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation */}
        <div>
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-500 transition-colors mb-3 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </Link>
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">JANSETU PREVIEW ROUTE</span>
        </div>

        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-3">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-amber-500 shrink-0" />
            <span>{goalTitle}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="bg-slate-950 border border-slate-800 px-3 py-1 rounded-full text-slate-300">
              🏡 Domicile: <strong className="text-white font-bold">{domicileState}</strong>
            </span>
            {targetCountry && (
              <span className="bg-slate-950 border border-slate-800 px-3 py-1 rounded-full text-slate-300">
                ✈️ Destination: <strong className="text-white font-bold">{targetCountry}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Section 01: Verified Documents */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
          <h2 className="text-sm font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>01 — Verified Documents</span>
          </h2>
          <div className="space-y-2">
            {rawHave.length === 0 ? (
              <p className="text-slate-500 text-xs italic">No verified documents available in this configuration.</p>
            ) : (
              rawHave.map((doc: any, idx: number) => (
                <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">✓ {doc.name || doc.title}</span>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Verified</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 02: Documents You Need */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
          <h2 className="text-sm font-bold text-amber-500 flex items-center gap-2 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>02 — Documents You Need</span>
          </h2>
          <div className="space-y-2">
            {rawNeed.length === 0 ? (
              <p className="text-slate-500 text-xs italic">All required documents verified in vault.</p>
            ) : (
              rawNeed.map((doc: any, idx: number) => (
                <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 flex flex-col gap-1 text-xs">
                  <span className="font-semibold text-white">• {doc.name || doc.title}</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{doc.reason || doc.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 03: Government Support */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
          <h2 className="text-sm font-bold text-cyan-400 flex items-center gap-2 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>03 — Relevant Government Support / Scholarships</span>
          </h2>
          
          {schemesList.length === 0 ? (
            <p className="text-slate-500 text-xs italic">Government support matches will appear here.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {schemesList.map((scheme: any, idx: number) => (
                <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2 text-xs">
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    {scheme?.level || 'State'}
                  </span>
                  <h4 className="font-bold text-white leading-tight">{scheme?.name || scheme?.title}</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{scheme?.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diagnostic Footer */}
        <div className="text-center pt-6 border-t border-slate-900 text-slate-600 text-[10px] font-mono">
          DEMO MODE — Diagnostic Page
        </div>

      </div>
    </div>
  );
}
