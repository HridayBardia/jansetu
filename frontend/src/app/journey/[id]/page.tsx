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
  Loader2
} from 'lucide-react';
import { generateJourneyAPI } from '@/lib/api';

export default function JourneyResultPage() {
  const params = useParams();
  const router = useRouter();
  const journeyId = params.id as string;

  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (journeyId) {
      const stored = sessionStorage.getItem(`journey_analysis_${journeyId}`);
      if (stored) {
        try {
          setAnalysisData(JSON.parse(stored));
        } catch (e) {
          console.error("Error parsing stored analysis:", e);
        }
      }
    }
  }, [journeyId]);

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-[#020205] text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
        <p className="text-slate-400 text-sm">Loading goal analysis checklist...</p>
      </div>
    );
  }

  const { result, query, domicile } = analysisData;
  const goalTitle = result.goal?.title || "Citizen Goal";
  const category = result.intent?.primary || "GENERAL";
  const location = result.location || {};
  const destination = location.destination;
  const currentLocation = location.current_location;
  
  // Document mapping
  const availableDocs = result.documents?.available || [];
  const neededDocs = result.documents?.needed || [];
  
  // Schemes mapping
  const schemesList = result.schemes || [];
  const centralSchemes = schemesList.filter((s: any) => s.level === 'CENTRAL' || s.level === 'NATIONAL');
  const stateSchemes = schemesList.filter((s: any) => s.level === 'STATE' || s.level === 'UT' || s.state_name?.toLowerCase() === domicile.toLowerCase());

  const nextSteps = result.next_steps || [];
  const sources = result.sources || [];

  const handleCreateJourney = async () => {
    setIsGenerating(true);
    try {
      const catVal = category === 'STUDY_ABROAD' ? 'education' : category.toLowerCase();
      const lifeEvent = category === 'STUDY_ABROAD' ? 'higher_education_funding' : 'business_formation';
      
      const res = await generateJourneyAPI({
        goal_category: catVal,
        life_event: lifeEvent,
        title: `${goalTitle} (${currentLocation || 'Udaipur'}, ${domicile})`,
        location_state: domicile,
        location_city: currentLocation || 'Udaipur',
        context_data: { domicile_state: domicile }
      });
      
      const targetId = res?.journey_id || (res as any)?.id || 'journey_biz_vadodara_1';
      router.push(`/journeys/${targetId}`);
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'AVAILABLE' || s === 'READY') {
      return (
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0">
          <CheckCircle2 className="w-3 h-3" /> Ready
        </span>
      );
    }
    if (s === 'REQUIRED' || s === 'MISSING') {
      return (
        <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0">
          <XCircle className="w-3 h-3" /> Missing
        </span>
      );
    }
    if (s === 'CONDITIONAL') {
      return (
        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0">
          <AlertTriangle className="w-3 h-3" /> Conditional
        </span>
      );
    }
    return (
      <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0">
        <HelpCircle className="w-3 h-3" /> {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#020205] text-slate-100 py-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-500 transition-colors mb-2 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Compass className="w-7 h-7 text-amber-500" />
              <span>Goal Analysis: {goalTitle}</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Citizen Query: &quot;{query}&quot;
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/documents"
              className="bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition"
            >
              <FileText className="w-4 h-4" />
              View My Vault
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl grid grid-cols-2 md:grid-cols-4 gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
          
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Goal Category</span>
            <p className="text-sm font-semibold text-white">{category.replace('_', ' ')}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Domicile State</span>
            <p className="text-sm font-semibold text-white">{domicile}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Location</span>
            <p className="text-sm font-semibold text-white">{currentLocation || domicile}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Destination</span>
            <p className="text-sm font-semibold text-white">{destination || 'Domestic'}</p>
          </div>
        </div>

        {/* Main Grid Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Documents Vault Matching (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Documents Required Header */}
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <span>Required Documents Analysis</span>
              </h2>
              <p className="text-xs text-slate-400">
                Automatic mapping of goal rules against documents in your secure vault.
              </p>
            </div>

            {/* Available Documents */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Documents You Already Have ({availableDocs.length})
              </span>
              
              {availableDocs.length === 0 ? (
                <p className="text-slate-500 text-xs py-2">No documents currently matched in your vault.</p>
              ) : (
                <div className="space-y-3">
                  {availableDocs.map((doc: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{doc.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{doc.description}</p>
                        
                        {/* Demo Notice Warning Badge */}
                        <div className="inline-flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/10 text-[9px] text-amber-500 font-semibold px-2 py-0.5 rounded mt-1 uppercase tracking-wider">
                          <Lock className="w-2.5 h-2.5 shrink-0" />
                          <span>Available • Synthetic Demo • Not Government Verified</span>
                        </div>
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Needed Documents */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">
                Documents You Still Need ({neededDocs.length})
              </span>
              
              {neededDocs.length === 0 ? (
                <p className="text-emerald-400 text-xs font-semibold py-2">✓ All required documents are ready in your vault!</p>
              ) : (
                <div className="space-y-3">
                  {neededDocs.map((doc: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{doc.name}</p>
                        <p className="text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-300">Why required:</span> {doc.reason}
                        </p>
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Schemes & Eligibility Check (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                <span>Matching Government Schemes</span>
              </h2>
              <p className="text-xs text-slate-400">
                Direct matching with government benefit databases.
              </p>
            </div>

            {/* Central Schemes */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                Central Government Schemes
              </span>
              
              {centralSchemes.length === 0 ? (
                <p className="text-slate-500 text-xs py-2">No matching central schemes found for this goal.</p>
              ) : (
                <div className="space-y-4">
                  {centralSchemes.map((scheme: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-bold text-white">{scheme.name}</h4>
                          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mt-0.5">
                            {scheme.department}
                          </span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                          scheme.match_status === 'HIGH_MATCH' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {scheme.match_status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-slate-400 leading-relaxed">{scheme.description}</p>
                      
                      {/* Match Reasons */}
                      <div className="bg-slate-900 border border-slate-850 rounded-lg p-2.5 space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wide">Match Criteria</span>
                        {scheme.why_matches?.map((reason: string, rIdx: number) => (
                          <div key={rIdx} className="text-[10px] text-slate-300 flex items-center gap-1.5">
                            <span className="text-amber-500 shrink-0">•</span>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>

                      {/* Official link & Last verified timestamp */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <a 
                          href={scheme.official_source_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-amber-500/80 hover:text-amber-400 flex items-center gap-1 hover:underline"
                        >
                          Official Source <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" /> Verified {scheme.last_verified_at}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* State Schemes */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block">
                {domicile.toUpperCase()} State Schemes
              </span>
              
              {stateSchemes.length === 0 ? (
                <p className="text-slate-500 text-xs py-2">No state schemes found for {domicile}.</p>
              ) : (
                <div className="space-y-4">
                  {stateSchemes.map((scheme: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-bold text-white">{scheme.name}</h4>
                          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mt-0.5">
                            {scheme.department}
                          </span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                          scheme.match_status === 'HIGH_MATCH' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {scheme.match_status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-slate-400 leading-relaxed">{scheme.description}</p>
                      
                      {/* Match Reasons */}
                      <div className="bg-slate-900 border border-slate-850 rounded-lg p-2.5 space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wide">Match Criteria</span>
                        {scheme.why_matches?.map((reason: string, rIdx: number) => (
                          <div key={rIdx} className="text-[10px] text-slate-300 flex items-center gap-1.5">
                            <span className="text-amber-500 shrink-0">•</span>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>

                      {/* Official link & Last verified timestamp */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <a 
                          href={scheme.official_source_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-amber-500/80 hover:text-amber-400 flex items-center gap-1 hover:underline"
                        >
                          Official Source <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" /> Verified {scheme.last_verified_at}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Bottom Section: Actionable Next Steps & Checklists */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
          
          {/* Next Steps (8 cols) */}
          <div className="md:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-md font-bold text-white">Your Actionable Next Steps</h3>
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
                <h3 className="text-md font-bold text-white">Official Ministry Sources</h3>
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
            <div className="pt-6 border-t border-slate-800/80">
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
