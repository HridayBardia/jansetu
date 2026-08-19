'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  ExternalLink, 
  Compass, 
  FileText, 
  Building2, 
  Calendar,
  Lock,
  ArrowRight,
  Loader2,
  BookmarkCheck,
  MapPin,
  ClipboardList
} from 'lucide-react';
import { generateJourneyAPI, fetchJourneyAnalysisAPI } from '@/lib/api';

export default function JourneyResultPage() {
  const params = useParams();
  const router = useRouter();
  const journeyId = params.id as string;

  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!journeyId) return;

    async function loadAnalysis() {
      try {
        setLoading(true);
        setError(null);
        
        // 1. First check sessionStorage for instant load
        const stored = sessionStorage.getItem(`journey_analysis_${journeyId}`);
        if (stored) {
          try {
            setAnalysisData(JSON.parse(stored));
            setLoading(false);
            return;
          } catch (e) {
            console.warn("Session storage parsing failed, falling back to API:", e);
          }
        }

        // 2. Fetch from DB singular endpoint
        const res = await fetchJourneyAnalysisAPI(journeyId);
        if (res) {
          setAnalysisData(res);
        } else {
          setError("We couldn't retrieve your journey analysis. Please try again.");
        }
      } catch (err: any) {
        console.error("Error loading analysis:", err);
        setError(err.message || "Failed to load journey. Please ensure the backend is connected.");
      } finally {
        setLoading(false);
      }
    }

    loadAnalysis();
  }, [journeyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020205] text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
        <p className="text-slate-400 text-sm">Retrieving your citizen journey checklist...</p>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="min-h-screen bg-[#020205] text-white flex flex-col items-center justify-center p-4 text-center">
        <XCircle className="w-12 h-12 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-lg font-bold text-white mb-2">Analysis Retrieval Failed</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6">{error || "Journey analysis data not found."}</p>
        <Link 
          href="/dashboard"
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-500 font-bold px-6 py-2.5 rounded-xl text-xs transition"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { goal = {}, domicile = {}, documents = {}, schemes = {}, nextSteps = [], sources = [] } = analysisData;
  
  const goalTitle = goal.title || "Citizen Goal";
  const goalCategory = goal.category || "GENERAL";
  const domicileState = domicile.state || "Rajasthan";
  
  const haveDocs = documents.have || [];
  const missingDocs = documents.missing || [];
  const conditionalDocs = (documents.conditional || documents.need || []).filter(
    (d: any) => !missingDocs.some((m: any) => m.type === d.type)
  );

  const centralSchemes = schemes.central || [];
  const stateSchemes = schemes.state || [];

  const handleCreateJourney = async () => {
    setIsGenerating(true);
    try {
      const catVal = goalCategory === 'STUDY_ABROAD' ? 'education' : goalCategory.toLowerCase();
      const lifeEvent = goalCategory === 'STUDY_ABROAD' ? 'higher_education_funding' : 'business_formation';
      
      const res = await generateJourneyAPI({
        goal_category: catVal,
        life_event: lifeEvent,
        title: `${goalTitle} (${domicileState})`,
        location_state: domicileState,
        location_city: 'Udaipur',
        context_data: { domicile_state: domicileState }
      });
      
      const targetId = res?.journey_id || (res as any)?.id || 'journey_biz_vadodara_1';
      router.push(`/journeys/${targetId}`);
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
    }
  };

  const getDocumentStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'AVAILABLE' || s === 'READY') {
      return (
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 shrink-0">
          ✓ AVAILABLE
        </span>
      );
    }
    if (s === 'REQUIRED' || s === 'MISSING') {
      return (
        <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 shrink-0">
          ⚠ MISSING
        </span>
      );
    }
    if (s === 'CONDITIONAL') {
      return (
        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 shrink-0">
          ? CONDITIONAL
        </span>
      );
    }
    return (
      <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 shrink-0">
        ? {status}
      </span>
    );
  };

  const getSchemeEligibilityBadge = (eligibility: string) => {
    if (eligibility.includes("Appears eligible")) {
      return (
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider shrink-0">
          ✓ Likely match
        </span>
      );
    }
    if (eligibility.includes("Potentially relevant")) {
      return (
        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider shrink-0">
          ⚠ More information required
        </span>
      );
    }
    return (
      <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider shrink-0">
        ✕ Does not appear eligible
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#020205] text-slate-100 py-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="space-y-1">
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-500 transition-colors mb-2 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Dashboard
            </Link>
            <div className="text-[11px] font-bold text-amber-500 uppercase tracking-widest">
              JANSETU
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              YOUR CITIZEN JOURNEY
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/documents"
              className="bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition"
            >
              <FileText className="w-4 h-4" />
              View Document Vault
            </Link>
            <button
              onClick={handleCreateJourney}
              disabled={isGenerating}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg transition"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Building Timeline...</span>
                </>
              ) : (
                <>
                  <span>Build Journey Workflow</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Goal Profile Meta Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Goal Identified</span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Compass className="w-6 h-6 text-amber-500 shrink-0" />
              {goalTitle}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500/80" />
              <span>Domicile: <strong className="text-white font-semibold">{domicileState}</strong></span>
            </div>
          </div>
        </div>

        {/* 3 Main Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Documents (Sections 1 & 2) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* SECTION ONE: DOCUMENTS I HAVE */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="text-md font-bold text-white uppercase tracking-wide flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Documents I Have</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Documents from your JANSETU document vault that are relevant to this goal.
                </p>
              </div>

              {haveDocs.length === 0 ? (
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-center">
                  <p className="text-slate-500 text-xs">No matching documents currently in your vault.</p>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {haveDocs.map((doc: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-bold text-white">{doc.name}</p>
                        <p className="text-[10px] text-slate-400">{doc.description || "Stored securely in vault"}</p>
                        <div className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-850 text-[9px] text-amber-500 font-semibold px-2 py-0.5 rounded mt-1 uppercase tracking-wider">
                          <Lock className="w-2.5 h-2.5 shrink-0" />
                          <span>Available • Synthetic Demo • Not Government Verified</span>
                        </div>
                      </div>
                      {getDocumentStatusBadge(doc.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION TWO: DOCUMENTS I WILL NEED */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="text-md font-bold text-white uppercase tracking-wide flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>Documents I Will Need</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Documents you must obtain or prepare before proceeding with applications.
                </p>
              </div>

              {missingDocs.length === 0 && conditionalDocs.length === 0 ? (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 text-center">
                  <p className="text-emerald-400 text-xs font-semibold">✓ You have all the documents required for this goal!</p>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {/* Missing/Required Documents */}
                  {missingDocs.map((doc: any, idx: number) => (
                    <div key={`missing-${idx}`} className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex items-center justify-between gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <p className="text-xs font-bold text-white">{doc.name}</p>
                        <p className="text-[10px] text-slate-400">
                          <strong className="text-slate-300">Why:</strong> {doc.reason}
                        </p>
                      </div>
                      {getDocumentStatusBadge(doc.status)}
                    </div>
                  ))}

                  {/* Conditional Documents */}
                  {conditionalDocs.map((doc: any, idx: number) => (
                    <div key={`conditional-${idx}`} className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex items-center justify-between gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <p className="text-xs font-bold text-white">{doc.name}</p>
                        <p className="text-[10px] text-slate-400">
                          <strong className="text-slate-300">Why:</strong> {doc.reason}
                        </p>
                      </div>
                      {getDocumentStatusBadge(doc.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Schemes (Section 3) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* SECTION THREE: GOVERNMENT SCHEMES */}
            <div className="space-y-6">
              
              <div className="space-y-1">
                <h3 className="text-md font-bold text-white uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-500" />
                  <span>Government Schemes</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Government schemes you may be eligible for based on profile variables.
                </p>
              </div>

              {/* Central Government schemes */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-extrabold text-blue-400 uppercase tracking-widest border-b border-slate-800 pb-2">
                  Central Government
                </h4>
                <p className="text-[10px] text-slate-400">
                  Government of India schemes/programs relevant to this goal.
                </p>

                {centralSchemes.length === 0 ? (
                  <p className="text-slate-500 text-xs py-2">No matching central government schemes identified.</p>
                ) : (
                  <div className="space-y-4">
                    {centralSchemes.map((scheme: any, idx: number) => (
                      <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3.5 relative">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="text-xs font-bold text-white leading-snug">{scheme.name}</h5>
                            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block mt-0.5">
                              {scheme.department}
                            </span>
                          </div>
                          {getSchemeEligibilityBadge(scheme.eligibility_status)}
                        </div>

                        <p className="text-[10px] text-slate-400 leading-relaxed">{scheme.description}</p>

                        <div className="bg-slate-900 border border-slate-855 rounded-lg p-2.5 space-y-1">
                          <span className="text-[8px] font-bold text-slate-400 uppercase block tracking-wider">Why It Matches</span>
                          <p className="text-[10px] text-slate-300 leading-snug">{scheme.eligibility_status}</p>
                          {scheme.why_matches?.map((m: string, mIdx: number) => (
                            <div key={mIdx} className="text-[10px] text-slate-300 flex items-center gap-1.5 pt-0.5">
                              <span className="text-amber-500 shrink-0">•</span>
                              <span>{m}</span>
                            </div>
                          ))}
                        </div>

                        {scheme.benefits && (
                          <div className="text-[10px] text-slate-400">
                            <strong className="text-slate-300">Benefits:</strong> {typeof scheme.benefits === 'object' ? JSON.stringify(scheme.benefits) : scheme.benefits}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-900/60">
                          <a 
                            href={scheme.official_source_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-amber-500 hover:text-amber-400 flex items-center gap-1 font-semibold"
                          >
                            View Official Source <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                          <span className="flex items-center gap-1">
                            Verified {scheme.last_verified_at}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Domicile State Government schemes */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-extrabold text-orange-400 uppercase tracking-widest border-b border-slate-800 pb-2">
                  {domicileState.toUpperCase()} GOVERNMENT
                </h4>
                <p className="text-[10px] text-slate-400">
                  State government schemes/programs relevant to this goal.
                </p>

                {stateSchemes.length === 0 ? (
                  <p className="text-slate-500 text-xs py-2">No matching state government schemes identified.</p>
                ) : (
                  <div className="space-y-4">
                    {stateSchemes.map((scheme: any, idx: number) => (
                      <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3.5 relative">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="text-xs font-bold text-white leading-snug">{scheme.name}</h5>
                            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block mt-0.5">
                              {scheme.department}
                            </span>
                          </div>
                          {getSchemeEligibilityBadge(scheme.eligibility_status)}
                        </div>

                        <p className="text-[10px] text-slate-400 leading-relaxed">{scheme.description}</p>

                        <div className="bg-slate-900 border border-slate-855 rounded-lg p-2.5 space-y-1">
                          <span className="text-[8px] font-bold text-slate-400 uppercase block tracking-wider">Why It Matches</span>
                          <p className="text-[10px] text-slate-300 leading-snug">{scheme.eligibility_status}</p>
                          {scheme.why_matches?.map((m: string, mIdx: number) => (
                            <div key={mIdx} className="text-[10px] text-slate-300 flex items-center gap-1.5 pt-0.5">
                              <span className="text-amber-500 shrink-0">•</span>
                              <span>{m}</span>
                            </div>
                          ))}
                        </div>

                        {scheme.benefits && (
                          <div className="text-[10px] text-slate-400">
                            <strong className="text-slate-300">Benefits:</strong> {typeof scheme.benefits === 'object' ? JSON.stringify(scheme.benefits) : scheme.benefits}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-900/60">
                          <a 
                            href={scheme.official_source_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-amber-500 hover:text-amber-400 flex items-center gap-1 font-semibold"
                          >
                            View Official Source <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                          <span className="flex items-center gap-1">
                            Verified {scheme.last_verified_at}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* Action Checklist & Sources */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
          
          {/* Next Steps (8 cols) */}
          <div className="md:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-500" />
                <span>Next Steps Checklist</span>
              </h3>
              <p className="text-xs text-slate-400">
                Personalized task checklist based on missing requirements and matched rules.
              </p>
            </div>
            
            <div className="space-y-3 pt-2">
              {nextSteps.map((step: string, idx: number) => (
                <label 
                  key={idx} 
                  className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer select-none ${
                    checkedSteps[idx] 
                      ? 'bg-slate-950 border-emerald-500/20 text-slate-400' 
                      : 'bg-slate-950 border-slate-850 hover:border-slate-750 text-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!checkedSteps[idx]}
                    onChange={(e) => setCheckedSteps({ ...checkedSteps, [idx]: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950"
                  />
                  <span className={`text-xs ${checkedSteps[idx] ? 'line-through' : ''}`}>
                    {step}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Ministry Sources & verification times (4 cols) */}
          <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <BookmarkCheck className="w-5 h-5 text-amber-500" />
                  <span>Official Sources</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Government portals checked for latest regulatory updates.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {sources.map((source: any, idx: number) => (
                  <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-3 space-y-1">
                    <a 
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-white hover:text-amber-500 flex items-center gap-1.5 group transition-colors"
                    >
                      <span className="truncate">{source.name}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-500 shrink-0 transition-colors" />
                    </a>
                    <span className="text-[9px] text-slate-500 uppercase block tracking-wider font-semibold">
                      Last Checked: {source.last_verified}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow Generation CTA */}
            <div className="pt-6 border-t border-slate-800">
              <button
                onClick={handleCreateJourney}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold p-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Constructing workflow...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Active Workflow</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
