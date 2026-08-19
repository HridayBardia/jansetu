'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  analyzeGoalAPI, 
  generateJourneyAPI, 
  fetchJourneysAPI, 
  fetchSchemesAPI, 
  fetchUserDocumentsAPI, 
  matchDocumentRequirementsAPI,
  analyzeJourneyAPI,
  fetchStatesAPI
} from '@/lib/api';
import { StateSelector } from '@/components/StateSelector';
import { SchemeCard } from '@/components/SchemeCard';
import { DocumentVault } from '@/components/DocumentVault';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
  Briefcase,
  GraduationCap,
  FileText,
  Landmark,
  Loader2,
  MapPin,
  Building2,
  CheckCircle,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Globe
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [goalInput, setGoalInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [journeyAnalysis, setJourneyAnalysis] = useState<any>(null);
  
  const [selectedState, setSelectedState] = useState('All India');
  const [domicileState, setDomicileState] = useState('Rajasthan');
  const [statesList, setStatesList] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);
  const [activeJourneys, setActiveJourneys] = useState<any[]>([]);
  const [userDocs, setUserDocs] = useState<any[]>([]);

  const [detectedLocation, setDetectedLocation] = useState<{
    city?: string;
    district?: string;
    state?: string;
  } | null>(null);

  // Route protection
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchJourneysAPI().then((data) => setActiveJourneys(data || []));
      fetchUserDocumentsAPI().then((docs) => setUserDocs(docs || []));
      fetchStatesAPI().then((data) => {
        if (data && data.length > 0) {
          setStatesList(data);
        }
      });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const stFilter = selectedState === 'All India' ? undefined : selectedState;
    fetchSchemesAPI({ state_name: stFilter, limit: 15 }).then((res) => {
      if (res && res.schemes) {
        setSchemes(res.schemes);
      }
    });
  }, [selectedState]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const handleAnalyzeGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) return;

    setJourneyAnalysis(null);
    setIsAnalyzing(true);
    setGenerationStage(0);

    const stages = [
      "Understanding your goal",
      "Finding relevant requirements",
      "Checking your documents",
      "Finding matching government schemes",
      "Building your journey"
    ];

    let currentStage = 0;
    const timer = setInterval(() => {
      if (currentStage < stages.length - 1) {
        currentStage++;
        setGenerationStage(currentStage);
      }
    }, 250);

    try {
      const res = await analyzeJourneyAPI(goalInput, domicileState);
      clearInterval(timer);
      setGenerationStage(stages.length);
      
      if (res) {
        setJourneyAnalysis(res);
        setDetectedLocation({
          city: res.location.current_location,
          state: res.location.domicile_state
        });
      }
    } catch (err) {
      clearInterval(timer);
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickStart = (text: string) => {
    setGoalInput(text);
  };

  const handleCreateJourney = async () => {
    if (!journeyAnalysis) return;
    setIsGenerating(true);
    setGenerationStage(1);

    setTimeout(() => setGenerationStage(2), 500);
    setTimeout(() => setGenerationStage(3), 1000);
    setTimeout(() => setGenerationStage(4), 1500);

    const locState = journeyAnalysis.location.domicile_state || 'Rajasthan';
    const locCity = journeyAnalysis.location.current_location || 'Udaipur';

    const res = await generateJourneyAPI({
      goal_category: journeyAnalysis.intent.primary === 'STUDY_ABROAD' ? 'education' : journeyAnalysis.intent.primary.toLowerCase(),
      life_event: journeyAnalysis.intent.primary === 'STUDY_ABROAD' ? 'higher_education_funding' : 'business_formation',
      title: `${journeyAnalysis.goal.title} (${locCity}, ${locState})`,
      location_state: locState,
      location_city: locCity,
      context_data: { domicile_state: locState }
    });

    setTimeout(() => {
      setIsGenerating(false);
      const targetId = res?.journey_id || (res as any)?.id || 'journey_biz_vadodara_1';
      router.push(`/journeys/${targetId}`);
    }, 1800);
  };

  const localSchemes = schemes.filter(s => s.level === 'CITY' || s.level === 'LOCAL' || s.level === 'DISTRICT');
  const stateSchemes = schemes.filter(s => s.level === 'STATE' || s.level === 'UT');
  const nationalSchemes = schemes.filter(s => s.level === 'CENTRAL' || s.level === 'NATIONAL');

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6 px-4">
      {/* Greeting Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <span>Good evening, {user?.full_name || 'Citizen'} 👋</span>
        </h1>
        <p className="text-xs text-slate-400">
          Your personal authenticated citizen gateway to services, schemes, and documents.
        </p>
      </div>

      {/* Main Goal Input Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <form onSubmit={handleAnalyzeGoal} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 md:col-span-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Domicile State
              </label>
              <select
                value={domicileState}
                onChange={(e) => setDomicileState(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 text-sm focus:outline-none focus:border-amber-500/50"
              >
                {statesList.length === 0 ? (
                  <option value="Rajasthan">Rajasthan</option>
                ) : (
                  statesList.map((st) => (
                    <option key={st.code} value={st.name}>
                      {st.name} {st.is_ut ? '(UT)' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                What are you looking to accomplish?
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="Tell us what you're trying to do... e.g. 'I wanna go to Australia for masters' or 'I want to start a business'..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 pr-40 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 text-sm resize-none"
                />
                <button
                  type="submit"
                  disabled={isAnalyzing || !goalInput.trim()}
                  className="absolute bottom-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 transition"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span>Understand Goal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Quick Starts */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <span className="text-xs text-slate-500 font-semibold block mb-2">Quick Starts:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <button
              onClick={() => {
                setDomicileState("Gujarat");
                handleQuickStart("I want to start a business in Vadodara, Gujarat.");
              }}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-lg text-xs text-slate-300 transition text-left"
            >
              <Briefcase className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Start Business in Vadodara</span>
            </button>

            <button
              onClick={() => {
                setDomicileState("Rajasthan");
                handleQuickStart("I am living in Udaipur and I wanna go to Australia for masters.");
              }}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-lg text-xs text-slate-300 transition text-left"
            >
              <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Masters in Australia</span>
            </button>

            <button
              onClick={() => {
                setDomicileState("Rajasthan");
                handleQuickStart("I want a scholarship in Rajasthan.");
              }}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-lg text-xs text-slate-300 transition text-left"
            >
              <Landmark className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Scholarship in Rajasthan</span>
            </button>

            <button
              onClick={() => {
                setDomicileState("Rajasthan");
                handleQuickStart("I am a farmer in Rajasthan.");
              }}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-lg text-xs text-slate-300 transition text-left"
            >
              <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Farmer in Rajasthan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cinematic Progressive Loading Experience */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-[#020205]/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Analyzing Citizen Query</h4>
                <p className="text-xs text-slate-400">Verifying requirements and rules deterministically...</p>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-800">
              {[
                "Understanding your goal",
                "Finding relevant requirements",
                "Checking your documents",
                "Finding matching government schemes",
                "Building your journey"
              ].map((label, idx) => {
                const isCompleted = generationStage > idx;
                const isActive = generationStage === idx;
                return (
                  <div key={idx} className="flex items-center justify-between text-xs transition-all duration-350">
                    <span className={`${
                      isCompleted 
                        ? 'text-emerald-400 font-semibold' 
                        : isActive 
                          ? 'text-amber-400 font-bold' 
                          : 'text-slate-500'
                    }`}>
                      {isCompleted ? '✓' : isActive ? '●' : '○'} {label}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {isCompleted ? 'Done' : isActive ? 'Active' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Personalized Citizen Journey Result UI */}
      {journeyAnalysis && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-8 space-y-8 shadow-2xl animate-fade-in">
          {/* Header & Goal Identification */}
          <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full">
                Goal Identified
              </span>
              <h2 className="text-2xl font-black text-white mt-3">
                {journeyAnalysis.goal.title}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {journeyAnalysis.goal.description}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
                📍 Current: <strong className="text-white">{journeyAnalysis.location.current_location}</strong>
              </span>
              <span className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
                🏡 Domicile: <strong className="text-white">{journeyAnalysis.location.domicile_state}</strong>
              </span>
              {journeyAnalysis.location.destination && (
                <span className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
                  ✈️ Destination: <strong className="text-white">{journeyAnalysis.location.destination}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Documents You Already Have */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Documents You Already Have ({journeyAnalysis.documents.available.length})</span>
              </h3>
              
              <div className="space-y-2">
                {journeyAnalysis.documents.available.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">No matching documents found in your vault.</p>
                ) : (
                  journeyAnalysis.documents.available.map((doc: any, idx: number) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">✓ {doc.name}</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold uppercase">
                          Available
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-500/80 font-mono tracking-wider font-semibold">
                        {doc.verification_status === 'DEMO_SYNTHETIC' || doc.verification_status === 'SYNTHETIC_DEMO' ? 'Demo Available' : doc.verification_status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Documents You Need */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2 uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" />
                <span>Documents You Need ({journeyAnalysis.documents.needed.length})</span>
              </h3>
              
              <div className="space-y-2">
                {journeyAnalysis.documents.needed.length === 0 ? (
                  <p className="text-emerald-400 text-xs font-semibold">✓ All required documents are ready in your vault!</p>
                ) : (
                  journeyAnalysis.documents.needed.map((doc: any, idx: number) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">⚠ {doc.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                          doc.status === 'Required' 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {doc.status === 'Required' ? 'Missing' : doc.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs">{doc.reason}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Schemes Section */}
          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2 uppercase tracking-wider">
              <Landmark className="w-4 h-4" />
              <span>Relevant Government Support / Scholarships</span>
            </h3>

            {journeyAnalysis.schemes.length === 0 ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-400">No verified scheme matching your current information was found.</p>
                <p className="text-[11px] text-slate-500">We only show government schemes that strictly match your parameters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {journeyAnalysis.schemes.map((sch: any) => (
                  <div key={sch.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-cyan-500/15 text-cyan-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {sch.level}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          sch.match_status === 'HIGH_MATCH' 
                            ? 'bg-emerald-500/15 text-emerald-400' 
                            : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {sch.match_status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {sch.name}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {sch.description}
                      </p>
                    </div>

                    {/* Eligibility Match Breakdown */}
                    <div className="bg-slate-900/60 rounded-lg p-3 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Why It Matches
                      </span>
                      {sch.why_matches.map((reason: string, idx: number) => (
                        <div key={idx} className="text-xs flex items-start gap-1.5 text-slate-300">
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-900">
                      <span>Last verified: {sch.last_verified_at}</span>
                      {sch.official_source_url && (
                        <a 
                          href={sch.official_source_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline font-semibold"
                        >
                          Official Portal →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Next Steps & Sources Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/80">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2 uppercase tracking-wider">
                <Compass className="w-4 h-4" />
                <span>Next Steps Checklist</span>
              </h3>
              
              <ol className="space-y-2 text-xs">
                {journeyAnalysis.next_steps.map((step: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3 bg-slate-950/40 p-2.5 rounded-lg border border-slate-900/50">
                    <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 font-bold font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-slate-200 mt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Official Sources Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                <Globe className="w-4 h-4" />
                <span>Official Government Sources</span>
              </h3>

              <div className="space-y-2">
                {journeyAnalysis.sources.map((src: any, idx: number) => (
                  <div key={idx} className="bg-slate-950/40 p-3 rounded-lg border border-slate-900/50 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-200 block">{src.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Last verified: {src.last_verified}</span>
                    </div>
                    <a 
                      href={src.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white px-3 py-1.5 rounded border border-slate-800 text-[10px] font-semibold tracking-wider shrink-0 transition"
                    >
                      Visit Source
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              onClick={() => setJourneyAnalysis(null)}
              className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200"
            >
              Clear Analysis
            </button>
            <button
              onClick={handleCreateJourney}
              disabled={isGenerating}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span>Build Journey Workflow</span>
            </button>
          </div>
        </div>
      )}

      {/* Real-time Progress Indicator */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Building Your Personalized Journey</h4>
                <p className="text-xs text-slate-400">Real-time engine analysis in progress...</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 1 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 1 ? '✓' : '●'} Understanding your request
                </span>
                <span className="text-slate-500">Done</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 2 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 2 ? '✓' : '●'} Identifying your location
                </span>
                <span className="text-slate-500">Done</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 3 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 3 ? '✓' : '●'} Finding relevant government services
                </span>
                <span className="text-slate-500">Done</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 4 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 4 ? '✓' : '●'} Checking current eligibility
                </span>
                <span className="text-slate-500">Ready</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Citizen Document Vault Integrated Directly in Dashboard */}
      <DocumentVault documents={userDocs} />

      {/* Active Journeys Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Compass className="w-5 h-5 text-amber-400" />
          <span>Your Active Journeys</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => router.push('/journeys/journey_biz_vadodara_1')}
            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 cursor-pointer transition space-y-4 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                  GJ
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                    Start a Small Business in Vadodara
                  </h3>
                  <p className="text-xs text-slate-400">Vadodara, Gujarat • Sole Proprietorship</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-400">75%</span>
            </div>

            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full w-[75%]" />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Next: VMC Trade License & MSME Registration</span>
              <span className="text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition">
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          <div
            onClick={() => router.push('/journeys/journey_edu_gujarat_1')}
            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-5 cursor-pointer transition space-y-4 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  MYSY
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                    Gujarat MYSY Higher Education Scholarship
                  </h3>
                  <p className="text-xs text-slate-400">Gujarat • PM-Vidyalaxmi Subvention</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400">40%</span>
            </div>

            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full w-[40%]" />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Next: Income Certificate Verification</span>
              <span className="text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition">
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Verified Government Schemes Explorer */}
      <div className="space-y-6 pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Real-Time Verified Government Schemes</span>
            </h2>
            <p className="text-xs text-slate-400">
              Active schemes across Central, 28 States, and 8 Union Territories with verified status.
            </p>
          </div>

          <StateSelector selectedState={selectedState} onStateChange={setSelectedState} />
        </div>

        {schemes.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-300">No active schemes currently listed for this location.</p>
            <p className="text-xs text-slate-500">Try switching to 'All India' or select a different location.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {localSchemes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  <span>LOCAL / DISTRICT SERVICES</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {localSchemes.map((sch) => (
                    <SchemeCard key={sch.id} scheme={sch} />
                  ))}
                </div>
              </div>
            )}

            {stateSchemes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  <span>STATE PROGRAMMES ({selectedState})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stateSchemes.map((sch) => (
                    <SchemeCard key={sch.id} scheme={sch} />
                  ))}
                </div>
              </div>
            )}

            {nationalSchemes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Globe className="w-4 h-4" />
                  <span>NATIONAL (Government of India)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nationalSchemes.map((sch) => (
                    <SchemeCard key={sch.id} scheme={sch} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
