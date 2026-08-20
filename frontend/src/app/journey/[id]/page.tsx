'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ExternalLink, 
  Compass, 
  FileText, 
  Building2, 
  Lock,
  ArrowRight,
  Loader2,
  BookmarkCheck,
  MapPin,
  ClipboardList,
  Eye,
  ShieldCheck,
  CheckCircle,
  Globe
} from 'lucide-react';
import { generateJourneyAPI, fetchJourneyAnalysisAPI } from '@/lib/api';
import { PdfViewerModal } from '@/components/PdfViewerModal';

export default function JourneyResultPage() {
  const params = useParams();
  const router = useRouter();
  const journeyId = params.id as string;

  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [selectedPdfDoc, setSelectedPdfDoc] = useState<any | null>(null);

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

  const { goal = {}, domicile = {}, targetLocation = null, documents = {}, schemes = {}, nextSteps = [], sources = [], diagnostics = null } = analysisData;
  
  const goalTitle = goal.title || "Citizen Goal";
  const goalCategory = goal.category || "GENERAL";
  const domicileState = domicile.state || "Rajasthan";
  
  const haveDocs = documents.have || [];
  const neededDocsList = documents.need || [];
  
  // Group needed documents by priority
  const requiredDocs = neededDocsList.filter((d: any) => d.priority === 'Required');
  const conditionalDocs = neededDocsList.filter((d: any) => d.priority === 'Conditional');
  const recommendedDocs = neededDocsList.filter((d: any) => d.priority === 'Recommended');

  const centralSchemes = schemes.central || [];
  const stateSchemes = schemes.state || [];
  const targetLocationSchemes = schemes.targetLocation || [];

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

  const getSchemeEligibilityBadge = (eligibility: string) => {
    if (eligibility && (eligibility.includes("Appears eligible") || eligibility.includes("HIGH_MATCH"))) {
      return (
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider shrink-0">
          ✓ Likely match
        </span>
      );
    }
    if (eligibility && (eligibility.includes("Potentially relevant") || eligibility.includes("POSSIBLE_MATCH"))) {
      return (
        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider shrink-0">
          ⚠ Verification Needed
        </span>
      );
    }
    return (
      <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider shrink-0">
        ✕ Not eligible
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#020205] text-slate-100 py-10 px-4 md:px-8 font-sans selection:bg-amber-500 selection:text-slate-950">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-8 border-b border-slate-900">
          <div className="space-y-1">
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-500 transition-colors mb-3 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Dashboard
            </Link>
            <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
              JANSETU AI ENGINE
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              JOURNEY MAP & RECOMMENDATIONS
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/documents"
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              View Vault
            </Link>
            <button
              onClick={handleCreateJourney}
              disabled={isGenerating}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg transition transform active:scale-95"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Workflow...</span>
                </>
              ) : (
                <>
                  <span>Create Active Journey</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Goal Profile Meta Card */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-3">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Goal Summary</span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Compass className="w-6 h-6 text-amber-500 shrink-0" />
              {goalTitle}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800/60 px-3 py-1 rounded-full text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>Domicile: <strong className="text-white font-bold">{domicileState}</strong></span>
              </div>
              {targetLocation && (targetLocation.state || targetLocation.country) && (
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800/60 px-3 py-1 rounded-full text-slate-300">
                  <Globe className="w-3.5 h-3.5 text-amber-500" />
                  <span>Target: <strong className="text-white font-bold">{targetLocation.state || targetLocation.country}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800/60 px-3 py-1 rounded-full text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Status: <strong className="text-emerald-400 font-bold">Matched</strong></span>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl flex items-center gap-4 shrink-0">
            <div className="space-y-0.5 text-right">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Vault Progress</p>
              <p className="text-sm font-black text-white">{haveDocs.length} / {haveDocs.length + neededDocsList.length} Docs Available</p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-slate-800 flex items-center justify-center font-bold text-xs text-amber-500 shrink-0 bg-slate-900">
              {Math.round((haveDocs.length / (haveDocs.length + neededDocsList.length || 1)) * 100)}%
            </div>
          </div>
        </div>

        {/* SECTION 1: VERIFIED DOCUMENTS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Verified Documents</span>
            </h3>
            <p className="text-xs text-slate-400">
              Documents already available in your document vault and relevant to this journey.
            </p>
          </div>

          {haveDocs.length === 0 ? (
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-8 text-center max-w-lg mx-auto">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-xs font-semibold">No matching verified documents currently in your vault.</p>
              <p className="text-[11px] text-slate-500 mt-1">Upload files directly to your vault to enable automatic matching.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {haveDocs.map((doc: any, idx: number) => (
                <div key={idx} className="bg-slate-950 border border-slate-850 hover:border-slate-750 transition duration-300 rounded-2xl p-5 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-400 tracking-wider uppercase">{doc.type}</h4>
                        <h5 className="text-sm font-black text-white leading-snug mt-0.5">{doc.name}</h5>
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>{doc.status}</span>
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-400 leading-relaxed pt-1">
                      <p><strong className="text-slate-300 font-semibold">Authority:</strong> {doc.issuing_authority || 'Government Authority'}</p>
                      <p><strong className="text-slate-300 font-semibold">Masked Number:</strong> <span className="font-mono">{doc.masked_document_number}</span></p>
                      <p><strong className="text-slate-300 font-semibold">Relevance:</strong> {doc.why_it_matches || doc.description}</p>
                      {doc.issue_date && <p><strong className="text-slate-300 font-semibold">Issued:</strong> {doc.issue_date}</p>}
                      {doc.expiry_date && <p><strong className="text-slate-300 font-semibold">Expiry:</strong> {doc.expiry_date}</p>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-900 text-[10px]">
                    <a
                      href={doc.source || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-500 hover:text-amber-400 flex items-center gap-1 font-bold transition"
                    >
                      Official Source <ExternalLink className="w-3 h-3" />
                    </a>
                    
                    <button
                      onClick={() => setSelectedPdfDoc(doc)}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 flex items-center gap-1 transition"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: DOCUMENTS YOU NEED */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Documents You Need</span>
            </h3>
            <p className="text-xs text-slate-400">
              Documents you still need to obtain or prepare for this journey.
            </p>
          </div>

          {neededDocsList.length === 0 ? (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 text-center max-w-lg mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-400 text-xs font-bold">✓ Complete Vault Ready!</p>
              <p className="text-[11px] text-slate-400 mt-1">You have all the documents required for this journey.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Group 1: Required */}
              {requiredDocs.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest border-b border-red-500/20 pb-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Critical / Required ({requiredDocs.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requiredDocs.map((doc: any, idx: number) => (
                      <div key={idx} className="bg-slate-950 border border-slate-850 hover:border-slate-750 transition duration-300 rounded-2xl p-5 flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <h5 className="text-sm font-black text-white leading-snug">{doc.name}</h5>
                            <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                              REQUIRED
                            </span>
                          </div>
                          <div className="space-y-1.5 text-xs text-slate-400 leading-relaxed pt-1">
                            <p><strong className="text-slate-300 font-semibold">Why:</strong> {doc.reason}</p>
                            <p><strong className="text-slate-300 font-semibold">Authority:</strong> {doc.authority}</p>
                            <p><strong className="text-slate-300 font-semibold">How to obtain:</strong> {doc.how_to}</p>
                            <p><strong className="text-slate-300 font-semibold">Processing time:</strong> {doc.processing_time}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] pt-3 border-t border-slate-900">
                          <a
                            href={doc.official_source || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-500 hover:text-amber-400 flex items-center gap-1 font-bold transition"
                          >
                            Official Source <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Group 2: Conditional */}
              {conditionalDocs.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest border-b border-amber-500/20 pb-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Conditional ({conditionalDocs.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {conditionalDocs.map((doc: any, idx: number) => (
                      <div key={idx} className="bg-slate-950 border border-slate-855 hover:border-slate-750 transition duration-300 rounded-2xl p-5 flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <h5 className="text-sm font-black text-white leading-snug">{doc.name}</h5>
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                              CONDITIONAL
                            </span>
                          </div>
                          <div className="space-y-1.5 text-xs text-slate-400 leading-relaxed pt-1">
                            <p><strong className="text-slate-300 font-semibold">Condition:</strong> {doc.reason}</p>
                            <p><strong className="text-slate-300 font-semibold">Authority:</strong> {doc.authority}</p>
                            <p><strong className="text-slate-300 font-semibold">How to obtain:</strong> {doc.how_to}</p>
                            <p><strong className="text-slate-300 font-semibold">Processing time:</strong> {doc.processing_time}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] pt-3 border-t border-slate-900">
                          <a
                            href={doc.official_source || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-500 hover:text-amber-400 flex items-center gap-1 font-bold transition"
                          >
                            Official Source <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Group 3: Recommended */}
              {recommendedDocs.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                    <span>Recommended ({recommendedDocs.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendedDocs.map((doc: any, idx: number) => (
                      <div key={idx} className="bg-slate-950 border border-slate-855 hover:border-slate-750 transition duration-300 rounded-2xl p-5 flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <h5 className="text-sm font-black text-white leading-snug">{doc.name}</h5>
                            <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                              RECOMMENDED
                            </span>
                          </div>
                          <div className="space-y-1.5 text-xs text-slate-400 leading-relaxed pt-1">
                            <p><strong className="text-slate-300 font-semibold">Advantage:</strong> {doc.reason}</p>
                            <p><strong className="text-slate-300 font-semibold">Authority:</strong> {doc.authority}</p>
                            <p><strong className="text-slate-300 font-semibold">How to obtain:</strong> {doc.how_to}</p>
                            <p><strong className="text-slate-300 font-semibold">Processing time:</strong> {doc.processing_time}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] pt-3 border-t border-slate-900">
                          <a
                            href={doc.official_source || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-500 hover:text-amber-400 flex items-center gap-1 font-bold transition"
                          >
                            Official Source <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* SECTION 3: SCHEMES & BENEFITS YOU MAY BE ELIGIBLE FOR */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-amber-500" />
              <span>Schemes & Benefits You May Be Eligible For</span>
            </h3>
            <p className="text-xs text-slate-400">
              Government schemes and financial support programs matching your goal and profile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Central Schemes Column (6 cols) */}
            <div className="md:col-span-6 space-y-4">
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>Central Government</span>
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold">
                  {centralSchemes.length} Available
                </span>
              </h4>

              {centralSchemes.length === 0 ? (
                <div className="py-4 space-y-1">
                  <p className="text-slate-500 text-xs italic">No matching central schemes identified.</p>
                  {diagnostics && (
                    <p className="text-[10px] text-amber-500/60 font-mono">
                      [JANSETU DIAGNOSTICS] No schemes returned by API (Retrieved: {diagnostics.retrievedCount} | Active: {diagnostics.afterStatusFilter} | Relevance: {diagnostics.afterRelevanceFilter} | Eligible: {diagnostics.afterEligibilityFilter})
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {centralSchemes.map((scheme: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 border border-slate-855 hover:border-slate-800 transition duration-300 rounded-2xl p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h5 className="text-xs font-extrabold text-blue-400 uppercase tracking-wider">{scheme.department}</h5>
                          <h6 className="text-sm font-black text-white leading-snug mt-0.5">{scheme.name}</h6>
                        </div>
                        {getSchemeEligibilityBadge(scheme.match_status || scheme.eligibility_status || scheme.eligibilityStatus)}
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">{scheme.description}</p>

                      {/* Benefits badge info */}
                      {scheme.benefits && (
                        <div className="bg-slate-900/60 border border-slate-855 rounded-xl p-3 text-xs">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Potential Benefits</span>
                          <div className="space-y-1">
                            {typeof scheme.benefits === 'object' ? (
                              Object.entries(scheme.benefits).map(([bKey, bVal]) => (
                                <p key={bKey} className="text-slate-300">
                                  <strong className="text-slate-400 capitalize">{bKey.replace(/_/g, ' ')}:</strong> {String(bVal)}
                                </p>
                              ))
                            ) : (
                              <p className="text-slate-300">{scheme.benefits}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Why it matches list */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Why this appears</span>
                        <div className="space-y-1">
                          {(scheme.why_matches || scheme.whyMatches || [])?.map((matchDetail: string, mIdx: number) => {
                            const isSuccess = matchDetail.includes('✓');
                            const isWarning = matchDetail.includes('⚠');
                            return (
                              <div key={mIdx} className="text-xs text-slate-300 flex items-start gap-1.5">
                                {isSuccess && <span className="text-emerald-400 font-bold shrink-0">✓</span>}
                                {isWarning && <span className="text-amber-400 font-bold shrink-0">⚠</span>}
                                {!isSuccess && !isWarning && <span className="text-amber-500 shrink-0">•</span>}
                                <span>{matchDetail.replace(/^[✓⚠✗•]\s*/, '')}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] pt-3 border-t border-slate-900">
                        <a
                          href={scheme.official_source_url || scheme.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-500 hover:text-amber-400 flex items-center gap-1 font-bold transition"
                        >
                          View Official Scheme <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="text-slate-500 font-semibold">Verified: {scheme.last_verified_at || scheme.lastVerified}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* State & Target Schemes Column (6 cols) */}
            <div className="md:col-span-6 space-y-6">
              {/* Domicile State schemes */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center justify-between">
                  <span>{domicileState} & Local Authorities</span>
                  <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold">
                    {stateSchemes.length} Available
                  </span>
                </h4>

                {stateSchemes.length === 0 ? (
                  <div className="py-4 space-y-1">
                    <p className="text-slate-500 text-xs italic">No matching state or local schemes identified.</p>
                    {diagnostics && (
                      <p className="text-[10px] text-amber-500/60 font-mono">
                        [JANSETU DIAGNOSTICS] No schemes returned by API (Retrieved: {diagnostics.retrievedCount} | Active: {diagnostics.afterStatusFilter} | Relevance: {diagnostics.afterRelevanceFilter} | Eligible: {diagnostics.afterEligibilityFilter})
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stateSchemes.map((scheme: any, idx: number) => (
                      <div key={idx} className="bg-slate-950 border border-slate-855 hover:border-slate-800 transition duration-300 rounded-2xl p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h5 className="text-xs font-extrabold text-orange-400 uppercase tracking-wider">{scheme.department}</h5>
                            <h6 className="text-sm font-black text-white leading-snug mt-0.5">{scheme.name}</h6>
                          </div>
                          {getSchemeEligibilityBadge(scheme.match_status || scheme.eligibility_status || scheme.eligibilityStatus)}
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">{scheme.description}</p>

                        {/* Benefits badge info */}
                        {scheme.benefits && (
                          <div className="bg-slate-900/60 border border-slate-855 rounded-xl p-3 text-xs">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Potential Benefits</span>
                            <div className="space-y-1">
                              {typeof scheme.benefits === 'object' ? (
                                Object.entries(scheme.benefits).map(([bKey, bVal]) => (
                                  <p key={bKey} className="text-slate-300">
                                    <strong className="text-slate-400 capitalize">{bKey.replace(/_/g, ' ')}:</strong> {String(bVal)}
                                  </p>
                                ))
                              ) : (
                                <p className="text-slate-300">{scheme.benefits}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Why it matches list */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Why this appears</span>
                          <div className="space-y-1">
                            {(scheme.why_matches || scheme.whyMatches || [])?.map((matchDetail: string, mIdx: number) => {
                              const isSuccess = matchDetail.includes('✓');
                              const isWarning = matchDetail.includes('⚠');
                              return (
                                <div key={mIdx} className="text-xs text-slate-300 flex items-start gap-1.5">
                                  {isSuccess && <span className="text-emerald-400 font-bold shrink-0">✓</span>}
                                  {isWarning && <span className="text-amber-400 font-bold shrink-0">⚠</span>}
                                  {!isSuccess && !isWarning && <span className="text-amber-500 shrink-0">•</span>}
                                  <span>{matchDetail.replace(/^[✓⚠✗•]\s*/, '')}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] pt-3 border-t border-slate-900">
                          <a
                            href={scheme.official_source_url || scheme.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-500 hover:text-amber-400 flex items-center gap-1 font-bold transition"
                          >
                            View Official Scheme <ExternalLink className="w-3 h-3" />
                          </a>
                          <span className="text-slate-500 font-semibold">Verified: {scheme.last_verified_at || scheme.lastVerified}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Target Location schemes */}
              {targetLocationSchemes.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-slate-800/80">
                  <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center justify-between">
                    <span>{(targetLocation && (targetLocation.state || targetLocation.country)) || "Target Location"} Government</span>
                    <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold">
                      {targetLocationSchemes.length} Available
                    </span>
                  </h4>

                  <div className="space-y-4">
                    {targetLocationSchemes.map((scheme: any, idx: number) => (
                      <div key={idx} className="bg-slate-950 border border-slate-855 hover:border-slate-800 transition duration-300 rounded-2xl p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h5 className="text-xs font-extrabold text-teal-400 uppercase tracking-wider">{scheme.department}</h5>
                            <h6 className="text-sm font-black text-white leading-snug mt-0.5">{scheme.name}</h6>
                          </div>
                          {getSchemeEligibilityBadge(scheme.match_status || scheme.eligibility_status || scheme.eligibilityStatus)}
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">{scheme.description}</p>

                        {/* Benefits badge info */}
                        {scheme.benefits && (
                          <div className="bg-slate-900/60 border border-slate-855 rounded-xl p-3 text-xs">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Potential Benefits</span>
                            <div className="space-y-1">
                              {typeof scheme.benefits === 'object' ? (
                                Object.entries(scheme.benefits).map(([bKey, bVal]) => (
                                  <p key={bKey} className="text-slate-300">
                                    <strong className="text-slate-400 capitalize">{bKey.replace(/_/g, ' ')}:</strong> {String(bVal)}
                                  </p>
                                ))
                              ) : (
                                <p className="text-slate-300">{scheme.benefits}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Why it matches list */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Why this appears</span>
                          <div className="space-y-1">
                            {(scheme.why_matches || scheme.whyMatches || [])?.map((matchDetail: string, mIdx: number) => {
                              const isSuccess = matchDetail.includes('✓');
                              const isWarning = matchDetail.includes('⚠');
                              return (
                                <div key={mIdx} className="text-xs text-slate-300 flex items-start gap-1.5">
                                  {isSuccess && <span className="text-emerald-400 font-bold shrink-0">✓</span>}
                                  {isWarning && <span className="text-amber-400 font-bold shrink-0">⚠</span>}
                                  {!isSuccess && !isWarning && <span className="text-amber-500 shrink-0">•</span>}
                                  <span>{matchDetail.replace(/^[✓⚠✗•]\s*/, '')}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] pt-3 border-t border-slate-900">
                          <a
                            href={scheme.official_source_url || scheme.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-500 hover:text-amber-400 flex items-center gap-1 font-bold transition"
                          >
                            View Official Scheme <ExternalLink className="w-3 h-3" />
                          </a>
                          <span className="text-slate-500 font-semibold">Verified: {scheme.last_verified_at || scheme.lastVerified}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Action Checklist & Sources */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
          
          {/* Next Steps (8 cols) */}
          <div className="md:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
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
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition duration-200 cursor-pointer select-none ${
                    checkedSteps[idx] 
                      ? 'bg-slate-950 border-emerald-500/20 text-slate-500' 
                      : 'bg-slate-950 border-slate-850 hover:border-slate-750 text-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!checkedSteps[idx]}
                    onChange={(e) => setCheckedSteps({ ...checkedSteps, [idx]: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950 cursor-pointer"
                  />
                  <span className={`text-xs ${checkedSteps[idx] ? 'line-through' : ''}`}>
                    {step}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Ministry Sources & verification times (4 cols) */}
          <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl flex flex-col justify-between">
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
                  <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 space-y-1">
                    <a 
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-white hover:text-amber-500 flex items-center gap-1.5 group transition-colors"
                    >
                      <span className="truncate">{source.name}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-500 shrink-0 transition-colors" />
                    </a>
                    <span className="text-[9px] text-slate-500 uppercase block tracking-wider font-bold">
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
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black p-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
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

      {/* PDF Viewer Modal */}
      {selectedPdfDoc && (
        <PdfViewerModal
          documentData={{
            id: selectedPdfDoc.id,
            document_type: selectedPdfDoc.type,
            document_name: selectedPdfDoc.name,
            document_number_masked: selectedPdfDoc.masked_document_number,
            issued_by: selectedPdfDoc.issuing_authority,
            extracted_fields: {},
            synthetic_notice: selectedPdfDoc.synthetic_notice || 'DEMO DOCUMENT — FOR DEMONSTRATION ONLY',
            created_at: selectedPdfDoc.issue_date
          }}
          onClose={() => setSelectedPdfDoc(null)}
        />
      )}
    </div>
  );
}
