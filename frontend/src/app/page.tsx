'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeGoalAPI, generateJourneyAPI, fetchJourneysAPI, fetchSchemesAPI, fetchUserDocumentsAPI, matchDocumentRequirementsAPI } from '@/lib/api';
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
  Globe,
  UserCheck
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { user, profile, isAuthenticated, openAuthModal } = useAuth();

  const [goalInput, setGoalInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  
  // Realtime location & scheme state
  const [selectedState, setSelectedState] = useState('All India');
  const [schemes, setSchemes] = useState<any[]>([]);

  // Realtime generation progress state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);
  const [activeJourneys, setActiveJourneys] = useState<any[]>([]);

  // User documents & requirement match state
  const [userDocs, setUserDocs] = useState<any[]>([]);
  const [docMatch, setDocMatch] = useState<any>(null);

  // Extracted location state from current user query
  const [detectedLocation, setDetectedLocation] = useState<{
    city?: string;
    district?: string;
    state?: string;
  } | null>(null);

  useEffect(() => {
    fetchJourneysAPI().then((data) => setActiveJourneys(data || []));
  }, []);

  useEffect(() => {
    fetchUserDocumentsAPI().then((docs) => setUserDocs(docs || []));
  }, [user]);

  useEffect(() => {
    const stFilter = selectedState === 'All India' ? undefined : selectedState;
    fetchSchemesAPI({ state_name: stFilter, limit: 15 }).then((res) => {
      if (res && res.schemes) {
        setSchemes(res.schemes);
      }
    });
  }, [selectedState]);

  const handleAnalyzeGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) return;

    setIsAnalyzing(true);
    const result = await analyzeGoalAPI(goalInput);
    setAnalysisResult(result);

    if (result) {
      setDetectedLocation({
        city: result.location_city,
        district: result.location_district,
        state: result.location_state
      });

      // Match document requirements dynamically against logged-in citizen's vault
      matchDocumentRequirementsAPI(result.goal || 'business').then((matchRes) => {
        if (matchRes) setDocMatch(matchRes);
      });

      // Set default answers for context questions
      if (result.context_questions) {
        const defaults: Record<string, string> = {};
        result.context_questions.forEach((q: any) => {
          defaults[q.key] = q.default_value || q.options[0];
        });
        setSelectedAnswers(defaults);
      }
    }
    setIsAnalyzing(false);
  };


  const handleQuickStart = (text: string) => {
    setGoalInput(text);
  };

  const handleCreateJourney = async () => {
    if (!analysisResult) return;
    setIsGenerating(true);
    setGenerationStage(1);

    setTimeout(() => setGenerationStage(2), 500);
    setTimeout(() => setGenerationStage(3), 1000);
    setTimeout(() => setGenerationStage(4), 1500);

    const locState = selectedAnswers.location_state || analysisResult.location_state || 'Gujarat';
    const locCity = analysisResult.location_city || (locState === 'Gujarat' ? 'Vadodara' : 'Jaipur');

    const res = await generateJourneyAPI({
      goal_category: analysisResult.goal,
      life_event: analysisResult.life_event,
      title: `${analysisResult.goal === 'business' ? 'Start a Business' : 'Scholarship & Loan'} (${locCity}, ${locState})`,
      location_state: locState,
      location_city: locCity,
      context_data: selectedAnswers
    });

    setTimeout(() => {
      setIsGenerating(false);
      const targetId = res?.journey_id || (res as any)?.id || 'journey_biz_vadodara_1';
      router.push(`/journeys/${targetId}`);
    }, 1800);
  };

  // Group schemes into Local, State, National for location transparency
  const localSchemes = schemes.filter(s => s.level === 'CITY' || s.level === 'LOCAL' || s.level === 'DISTRICT');
  const stateSchemes = schemes.filter(s => s.level === 'STATE' || s.level === 'UT');
  const nationalSchemes = schemes.filter(s => s.level === 'CENTRAL' || s.level === 'NATIONAL');

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6 px-4">
      {/* 1. Hero Section */}
      <div className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isAuthenticated && user ? `Good evening, ${user.full_name} 👋` : t('tagline', 'AI-Powered Government & Citizen Services Navigator for India')}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
          {t('heroTitle', 'Tell us what you need.')} <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 bg-clip-text text-transparent">
            {t('heroSubtitle', "We'll help you find the way.")}
          </span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
          {t('heroDesc', 'One AI assistant for government schemes, services and citizen requirements across India.')}
        </p>
      </div>

      {/* 2. Main Goal Input Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-slate-950">
        <form onSubmit={handleAnalyzeGoal} className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('inputPlaceholder', 'What are you trying to accomplish?')}
            </label>

            {detectedLocation?.state && (
              <div className="inline-flex items-center gap-1.5 bg-slate-950 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs text-amber-300 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  📍 {detectedLocation.city ? `${detectedLocation.city}, ` : ''}{detectedLocation.state}
                </span>
                <button
                  type="button"
                  onClick={() => setDetectedLocation(null)}
                  className="text-slate-400 hover:text-white ml-1 text-[10px] underline"
                >
                  {t('change', 'Change')}
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <textarea
              rows={3}
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="e.g. 'I want to start a business in Vadodara, Gujarat' or 'I want to apply for a government scholarship' or 'मुझे जयपुर में बिजनेस शुरू करना है'..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 text-sm md:text-base resize-none"
            />
            <button
              type="submit"
              disabled={isAnalyzing || !goalInput.trim()}
              className="absolute bottom-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('analyzing', 'Analyzing...')}</span>
                </>
              ) : (
                <>
                  <span>{t('understandGoal', 'Understand Goal')}</span>
                  <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Starts */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <span className="text-xs text-slate-500 font-medium block mb-3">{t('quickStarts', 'Quick Starts:')}</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <button
              onClick={() => handleQuickStart("I want to start a business in Vadodara, Gujarat.")}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-lg text-xs text-slate-300 transition text-left"
            >
              <Briefcase className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Start Business in Vadodara</span>
            </button>

            <button
              onClick={() => handleQuickStart("I want to apply for a government scholarship.")}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-lg text-xs text-slate-300 transition text-left"
            >
              <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Government Scholarship</span>
            </button>

            <button
              onClick={() => handleQuickStart("मुझे जयपुर में बिजनेस शुरू करना है।")}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-lg text-xs text-slate-300 transition text-left"
            >
              <Landmark className="w-4 h-4 text-orange-400 shrink-0" />
              <span>जयपुर में बिजनेस (Hindi)</span>
            </button>

            <button
              onClick={() => handleQuickStart("I am a farmer in Nashik. What schemes can I get?")}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-lg text-xs text-slate-300 transition text-left"
            >
              <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Farmer Support in Nashik</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Context Collection & Dynamic Document Matching Section */}
      {analysisResult && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 space-y-6 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-amber-400">{t('goalClassified', 'Goal Classified')}</span>
              <h3 className="text-lg font-bold text-white capitalize">
                {analysisResult.goal} Journey {analysisResult.location_state ? `(${analysisResult.location_state})` : ''}
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {t('confidenceHigh', 'Confidence: High')}
            </span>
          </div>

          {/* DYNAMIC DOCUMENT REQUIREMENT MATCHING CARD */}
          {docMatch && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Personalized Document Requirements ({user?.full_name || 'Citizen Vault'})</span>
                </h4>
                <span className="text-xs font-bold text-amber-400">
                  {docMatch.available_count || 0} Available • {docMatch.missing_count || 0} Required
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Available Documents */}
                <div className="space-y-2">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Documents You Already Have</span>
                  </span>
                  <div className="space-y-1">
                    {docMatch.available_documents?.length === 0 ? (
                      <p className="text-slate-500 italic">No matching documents found in vault.</p>
                    ) : (
                      docMatch.available_documents?.map((item: any, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 flex items-center justify-between">
                          <span>✓ {item.document_type || item}</span>
                          <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">Available</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Missing / Required Documents */}
                <div className="space-y-2">
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Still Required</span>
                  </span>
                  <div className="space-y-1">
                    {docMatch.missing_documents?.length === 0 ? (
                      <p className="text-emerald-400 font-medium">✓ All required documents ready!</p>
                    ) : (
                      docMatch.missing_documents?.map((item: any, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-center justify-between">
                          <span>⚠ {item.document_type || item}</span>
                          <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300">Action Needed</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {analysisResult.needs_location_clarification && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200">

              ⚠️ <strong>{t('needLocation', 'Which city or state are you planning this in?')}</strong>
              <p className="text-[11px] text-amber-300/80 mt-0.5">Please specify your location to get accurate local, state, and central schemes.</p>
            </div>
          )}

          <div className="space-y-4">
            {analysisResult.context_questions?.map((q: any) => (
              <div key={q.key} className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">{q.question}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt: string) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSelectedAnswers({ ...selectedAnswers, [q.key]: opt })}
                      className={`p-3 rounded-lg text-xs text-left border transition ${
                        selectedAnswers[q.key] === opt
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              onClick={() => setAnalysisResult(null)}
              className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              onClick={handleCreateJourney}
              disabled={isGenerating}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('buildJourney', 'Build My Journey')}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Real-time Progress Indicator */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{t('progressTitle', 'Building Your Personalized Journey')}</h4>
                <p className="text-xs text-slate-400">{t('progressSub', 'Real-time engine analysis in progress...')}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 1 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 1 ? '✓' : '●'} {t('step1', 'Understanding your request')}
                </span>
                <span className="text-slate-500">{t('done', 'Done')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 2 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 2 ? '✓' : '●'} {t('step2', 'Identifying your location')}
                </span>
                <span className="text-slate-500">{t('done', 'Done')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 3 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 3 ? '✓' : '●'} {t('step3', 'Finding relevant government services')}
                </span>
                <span className="text-slate-500">{t('done', 'Done')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 4 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 4 ? '✓' : '●'} {t('step4', 'Checking current eligibility')}
                </span>
                <span className="text-slate-500">{t('ready', 'Ready')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Active Journeys Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <span>{t('myJourneys', 'Your Active Journeys')}</span>
          </h2>
        </div>

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
                {t('continue', 'Continue')} <ArrowRight className="w-3.5 h-3.5" />
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
                {t('continue', 'Continue')} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Real-Time Verified Government Schemes Explorer (Location Grouped) */}
      <div className="space-y-6 pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>{t('verifiedSchemesTitle', 'Real-Time Verified Government Schemes')}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {t('verifiedSchemesSubtitle', 'Active schemes across Central, 28 States, and 8 Union Territories with verified status.')}
            </p>
          </div>

          <StateSelector selectedState={selectedState} onStateChange={setSelectedState} />
        </div>

        {schemes.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-300">{t('noSchemesFound', 'No active schemes currently listed for this location.')}</p>
            <p className="text-xs text-slate-500">{t('tryAllIndia', "Try switching to 'All India' or select a different location.")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Local / Municipal Scope */}
            {localSchemes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  <span>{t('localServices', 'LOCAL')} / {t('districtServices', 'DISTRICT')} SERVICES</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {localSchemes.map((sch) => (
                    <SchemeCard key={sch.id} scheme={sch} />
                  ))}
                </div>
              </div>
            )}

            {/* State Scope */}
            {stateSchemes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  <span>{t('stateServices', 'STATE')} PROGRAMMES ({selectedState})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stateSchemes.map((sch) => (
                    <SchemeCard key={sch.id} scheme={sch} />
                  ))}
                </div>
              </div>
            )}

            {/* National Scope */}
            {nationalSchemes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Globe className="w-4 h-4" />
                  <span>{t('nationalServices', 'NATIONAL (Government of India)')}</span>
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


