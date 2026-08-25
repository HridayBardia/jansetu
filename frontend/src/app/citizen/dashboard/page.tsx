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
  fetchStatesAPI,
  logoutAPI,
  fetchServicesAPI,
  callServiceAPI,
  fetchApplicationsAPI,
  createApplicationAPI,
  fetchApplicationDetailsAPI,
  updateApplicationStatusAPI,
  fetchConsentsAPI,
  createConsentAPI,
  revokeConsentAPI,
  fetchNotificationsAPI,
  fetchConnectorHealthAPI,
  fetchAuditLogsAPI,
  fetchConflictsAPI,
  resolveConflictAPI,
  toggleConnectorHealthAPI,
  fetchMetricsAPI,
  fetchServiceLevelsAPI,
  fetchMasterDataRecordAPI
} from '@/lib/api';
import { StateSelector } from '@/components/StateSelector';
import { SchemeCard } from '@/components/SchemeCard';
import { analyzeGoalUniversal } from '@/lib/goalClassifier';
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
  Globe,
  ShieldAlert,
  Key,
  Activity,
  Bell,
  History,
  Plus,
  RefreshCw,
  Trash2,
  BarChart2,
  Network,
  UserCircle
} from 'lucide-react';
import { useMockData } from '@/context/MockDataContext';

const INDIAN_STATES_AND_UTS = [
  { name: "Andhra Pradesh", code: "AP", type: "STATE", official_name: "State of Andhra Pradesh" },
  { name: "Arunachal Pradesh", code: "AR", type: "STATE", official_name: "State of Arunachal Pradesh" },
  { name: "Assam", code: "AS", type: "STATE", official_name: "State of Assam" },
  { name: "Bihar", code: "BR", type: "STATE", official_name: "State of Bihar" },
  { name: "Chhattisgarh", code: "CT", type: "STATE", official_name: "State of Chhattisgarh" },
  { name: "Goa", code: "GA", type: "STATE", official_name: "State of Goa" },
  { name: "Gujarat", code: "GJ", type: "STATE", official_name: "State of Gujarat" },
  { name: "Haryana", code: "HR", type: "STATE", official_name: "State of Haryana" },
  { name: "Himachal Pradesh", code: "HP", type: "STATE", official_name: "State of Himachal Pradesh" },
  { name: "Jharkhand", code: "JH", type: "STATE", official_name: "State of Jharkhand" },
  { name: "Karnataka", code: "KA", type: "STATE", official_name: "State of Karnataka" },
  { name: "Kerala", code: "KL", type: "STATE", official_name: "State of Kerala" },
  { name: "Madhya Pradesh", code: "MP", type: "STATE", official_name: "State of Madhya Pradesh" },
  { name: "Maharashtra", code: "MH", type: "STATE", official_name: "State of Maharashtra" },
  { name: "Manipur", code: "MN", type: "STATE", official_name: "State of Manipur" },
  { name: "Meghalaya", code: "ML", type: "STATE", official_name: "State of Meghalaya" },
  { name: "Mizoram", code: "MZ", type: "STATE", official_name: "State of Mizoram" },
  { name: "Nagaland", code: "NL", type: "STATE", official_name: "State of Nagaland" },
  { name: "Odisha", code: "OR", type: "STATE", official_name: "State of Odisha" },
  { name: "Punjab", code: "PB", type: "STATE", official_name: "State of Punjab" },
  { name: "Rajasthan", code: "RJ", type: "STATE", official_name: "State of Rajasthan" },
  { name: "Sikkim", code: "SK", type: "STATE", official_name: "State of Sikkim" },
  { name: "Tamil Nadu", code: "TN", type: "STATE", official_name: "State of Tamil Nadu" },
  { name: "Telangana", code: "TG", type: "STATE", official_name: "State of Telangana" },
  { name: "Tripura", code: "TR", type: "STATE", official_name: "State of Tripura" },
  { name: "Uttar Pradesh", code: "UP", type: "STATE", official_name: "State of Uttar Pradesh" },
  { name: "Uttarakhand", code: "UT", type: "STATE", official_name: "State of Uttarakhand" },
  { name: "West Bengal", code: "WB", type: "STATE", official_name: "State of West Bengal" },
  
  { name: "Andaman and Nicobar Islands", code: "AN", type: "UNION_TERRITORY", official_name: "Union Territory of Andaman and Nicobar Islands" },
  { name: "Chandigarh", code: "CH", type: "UNION_TERRITORY", official_name: "Union Territory of Chandigarh" },
  { name: "Dadra and Nagar Haveli and Daman and Diu", code: "DN", type: "UNION_TERRITORY", official_name: "Union Territory of Dadra and Nagar Haveli and Daman and Diu" },
  { name: "Delhi", code: "DL", type: "UNION_TERRITORY", official_name: "National Capital Territory of Delhi" },
  { name: "Jammu and Kashmir", code: "JK", type: "UNION_TERRITORY", official_name: "Union Territory of Jammu and Kashmir" },
  { name: "Ladakh", code: "LA", type: "UNION_TERRITORY", official_name: "Union Territory of Ladakh" },
  { name: "Lakshadweep", code: "LD", type: "UNION_TERRITORY", official_name: "Union Territory of Lakshadweep" },
  { name: "Puducherry", code: "PY", type: "UNION_TERRITORY", official_name: "Union Territory of Puducherry" }
];

function groupMatchedSchemes(matched: any[], domicile: string, targetState: string) {
  const central = matched.filter(s => s.level === 'CENTRAL');
  const targetLocation = matched.filter(s => s.level === 'STATE' && targetState && s.state_name.toLowerCase() === targetState.toLowerCase() && targetState.toLowerCase() !== domicile.toLowerCase());
  const state = matched.filter(s => s.level === 'STATE' && (!targetLocation.some((x: any) => x.id === s.id)));

  return { central, state, targetLocation };
}

function generateDemoJourney(query: string, domicileState: string, matchedSchemes: any[]) {
  // Use the universal goal classifier instead of brittle keyword matching
  const result = analyzeGoalUniversal(query, domicileState);
  // Merge database-matched schemes with the universal engine's schemes
  if (matchedSchemes && matchedSchemes.length > 0) {
    const dbCentral = matchedSchemes.filter((s: any) => s.level === 'CENTRAL');
    const dbState = matchedSchemes.filter((s: any) => s.level === 'STATE');
    result.schemes = {
      central: [...(result.schemes.central || []), ...dbCentral],
      state: [...(result.schemes.state || []), ...dbState],
      targetLocation: result.schemes.targetLocation || [],
    };
  }
  return result;
}

export default function DashboardPage() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { user, isAuthenticated, isLoading, profile } = useAuth();

  const [goalInput, setGoalInput] = useState('');
  const latestRequestIdRef = React.useRef<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [journeyAnalysis, setJourneyAnalysis] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [schemesError, setSchemesError] = useState(false);
  
  const [selectedState, setSelectedState] = useState('All India');
  const [domicileState, setDomicileState] = useState('Gujarat');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statesList, setStatesList] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);
  const { 
    profile: mockProfile, 
    familyMembers, 
    documents: mockDocs, 
    journeys: mockJourneys, 
    applications: mockApplications, 
    consents: mockConsents, 
    governmentConnections, 
    alerts: mockAlerts,
    addDocument
  } = useMockData();

  const [activeTab, setActiveTab] = useState<'planner' | 'journeys' | 'documents' | 'applications' | 'consent' | 'interop' | 'conflicts' | 'alerts' | 'official'>('planner');

  useEffect(() => {
    const handleUrlChange = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab) {
          const validTabs = ['planner', 'journeys', 'documents', 'applications', 'consent', 'interop', 'conflicts', 'alerts', 'official'];
          if (validTabs.includes(tab)) {
            setActiveTab(tab as any);
          }
        }
      }
    };
    
    handleUrlChange();
    const interval = setInterval(handleUrlChange, 200);
    return () => clearInterval(interval);
  }, []);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const [healthData, setHealthData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [selectedConsent, setSelectedConsent] = useState<any | null>(null);
  const [selectedConnector, setSelectedConnector] = useState<any | null>(null);
  const [showExchange, setShowExchange] = useState<boolean>(false);
  const [showCDM, setShowCDM] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [serviceLevels, setServiceLevels] = useState<any[]>([]);
  const [masterRecord, setMasterRecord] = useState<any>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [realNotifications, setRealNotifications] = useState<any[]>([]);
  const [realDocuments, setRealDocuments] = useState<any[]>([]);
  const [realJourneys, setRealJourneys] = useState<any[]>([]);

  const loadInteropData = () => {
    setIsRefreshing(true);
    fetchConnectorHealthAPI().then((data) => setHealthData(data || null));
    fetchAuditLogsAPI().then((data) => setAuditLogs(data || []));
    fetchConflictsAPI().then((data) => setConflicts(data || []));
    fetchMetricsAPI().then((data) => setMetrics(data || null));
    fetchServiceLevelsAPI().then((data) => setServiceLevels(data || []));
    fetchMasterDataRecordAPI().then((data) => setMasterRecord(data || null));
    setTimeout(() => setIsRefreshing(false), 500);
  };

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
      fetchStatesAPI().then((data) => {
        if (data && data.length > 0) {
          setStatesList(data);
        }
      });
      loadInteropData();
      // Fetch real notifications and documents
      fetchNotificationsAPI().then((data) => {
        if (data) setRealNotifications(data);
      });
      fetchUserDocumentsAPI().then((data) => {
        if (data) setRealDocuments(data);
      });
      fetchJourneysAPI().then((data) => {
        if (data) setRealJourneys(data);
      });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (profile?.location_state) {
      setDomicileState(profile.location_state);
      setSelectedState(profile.location_state);
    }
  }, [profile]);

  useEffect(() => {
    if (domicileState) {
      setSelectedState(domicileState);
    }
  }, [domicileState]);

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
    setErrorMessage(null);

    const trimmedGoal = goalInput.trim();
    if (!trimmedGoal) {
      setErrorMessage(t('goalPlanner.tellGoalError'));
      return;
    }

    if (!domicileState) {
      setErrorMessage(t('goalPlanner.selectDomicile'));
      return;
    }

    latestRequestIdRef.current += 1;
    const currentRequestId = latestRequestIdRef.current;

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem("citizenJourney");
      sessionStorage.removeItem("activeCitizenJourney");
    }

    setJourneyAnalysis(null);
    setIsAnalyzing(true);
    setGenerationStage(0);

    console.log("[Journey DEBUG] query:", trimmedGoal);

    // Simulated quick progress indicators
    const timer1 = setTimeout(() => setGenerationStage(1), 150); // Checking your documents
    const timer2 = setTimeout(() => setGenerationStage(2), 350); // Finding government schemes
    const timer3 = setTimeout(() => setGenerationStage(3), 550); // Building your journey

    try {
      console.log("[Journey] User query:", trimmedGoal);
      const res = await analyzeJourneyAPI(trimmedGoal, domicileState);
      
      if (currentRequestId !== latestRequestIdRef.current) {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        return;
      }
      
      console.log("[Journey] API response:", res);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setGenerationStage(4);
      
      const journeyId = res?.journeyId || res?.id;
      const resWithId = res ? { ...res, journeyId, id: journeyId } : null;

      console.log("[Journey DEBUG] generated journey:", resWithId);
      console.log("[Journey DEBUG] journey ID:", journeyId);

      if (resWithId && journeyId) {
        console.log("[Journey] Saving journey:", resWithId);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`journey_analysis_${journeyId}`, JSON.stringify(resWithId));
          sessionStorage.setItem("citizenJourney", JSON.stringify(resWithId));
          sessionStorage.setItem("activeCitizenJourney", JSON.stringify(resWithId));
        }
        
        console.log("[Journey DEBUG] before navigation:", resWithId);
        console.log("[Journey DEBUG] storage:", sessionStorage.getItem("citizenJourney"));
        
        // Immediate redirection
        router.push(`/journey-preview`);
      } else {
        throw new Error("Journey was not created.");
      }
    } catch (err) {
      if (currentRequestId !== latestRequestIdRef.current) return;
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      console.error(err);
      setErrorMessage(t('goalPlanner.journeyFailed'));
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

    const locState = journeyAnalysis.location?.domicile_state || domicileState || 'Not specified';
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

  const filteredStates = INDIAN_STATES_AND_UTS.filter(st =>
    st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    st.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const localSchemes = schemes.filter(s => s.level === 'CITY' || s.level === 'LOCAL' || s.level === 'DISTRICT');
  const stateSchemes = schemes.filter(s => s.level === 'STATE' || s.level === 'UT');
  const nationalSchemes = schemes.filter(s => s.level === 'CENTRAL' || s.level === 'NATIONAL');

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6 px-4 pb-24 md:pb-6">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md">
            JS
          </div>
          <span className="text-xs font-black text-slate-400 tracking-widest uppercase">{t('dashboard.oneCitizen')}</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-400 relative">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-1.5 bg-slate-900 border border-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition relative"
            >
              <Bell className="w-4.5 h-4.5" />
              {realNotifications.filter((n: any) => !n.is_read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-slate-950 animate-pulse" />
              )}
            </button>
            
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-50 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="font-bold text-white uppercase tracking-wider">{t('dashboard.notificationsCenter')}</span>
                  <span className="text-[10px] text-slate-500">{realNotifications.length} alerts</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {realNotifications.slice(0, 10).map((n: any) => (
                    <div key={n.id} className="p-2 bg-slate-950 border border-slate-850 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300">{n.category || 'Update'}</span>
                        <span className="text-[9px] text-slate-500">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{n.title}: {n.message}</p>
                    </div>
                  ))}
                  {realNotifications.length === 0 && (
                    <p className="text-slate-500 text-center py-4">{t('dashboard.noNotifications')}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <span className="bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800/60 text-[10px] uppercase font-bold text-slate-300">
            ✓ Secure Gate
          </span>
          <button 
            type="button"
            onClick={() => logoutAPI().then(() => router.push('/login'))} 
            className="hover:text-amber-500 transition font-bold"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white tracking-tight">
            {t('dashboard.welcome')}, {user?.full_name || t('dashboard.citizen')} 👋
          </h1>
          <p className="text-xs font-black text-amber-500 tracking-wider uppercase">
            {t('dashboard.oneCitizen')}
          </p>
          <p className="text-[11px] text-slate-500">
            {t('dashboard.jurisdictionAware')}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2.5 bg-slate-950/40 border border-slate-850 px-2.5 py-1 rounded-lg w-fit">
            <span>JanSetu</span>
            <span>/</span>
            <span className="text-amber-400">
              {activeTab === 'planner' ? t('dashboard.goalPlanner') : 
               activeTab === 'journeys' ? t('dashboard.activeJourneys') : 
               activeTab === 'documents' ? t('dashboard.documentsVault') :
               activeTab === 'applications' ? t('dashboard.myApplications') :
               activeTab === 'consent' ? t('dashboard.yourDataConsent') :
               activeTab === 'interop' ? t('dashboard.govtInteropHub') :
               activeTab === 'conflicts' ? t('dashboard.checkMyInformation') :
               activeTab === 'alerts' ? t('dashboard.alertsEvents') : t('dashboard.officialView')}
            </span>
          </div>
        </div>


      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4 transition hover:border-slate-700/80">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{t('dashboard.documentVault')}</span>
            <span className="text-sm font-black text-white">{realDocuments.length > 0 ? realDocuments.length : mockDocs.length} {t('dashboard.verifiedFiles')}</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4 transition hover:border-slate-700/80">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{t('dashboard.activeJourneys')}</span>
            <span className="text-sm font-black text-white">{(realJourneys.length || mockJourneys.length)} {t('dashboard.activeJourneysCount')}</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4 transition hover:border-slate-700/80">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{t('dashboard.govtSupport')}</span>
            <span className="text-sm font-black text-white">{schemes.length} {t('dashboard.schemesAvailable')}</span>
          </div>
        </div>
      </div>

      {/* Interoperability Tabs Switcher (Hidden on Mobile) */}
      <div className="hidden md:flex border-b border-slate-800 gap-1 overflow-x-auto pb-px shrink-0">
        <button
          onClick={() => setActiveTab('planner')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
            activeTab === 'planner'
              ? 'border-amber-500 text-amber-400 font-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>{t('dashboard.goalPlanner')}</span>
        </button>

        <button
          onClick={() => setActiveTab('journeys')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
            activeTab === 'journeys'
              ? 'border-amber-500 text-amber-400 font-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>{t('dashboard.activeJourneys')}</span>
          {(realJourneys.length || mockJourneys.length) > 0 && (
            <span className="bg-amber-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ml-1">
              {realJourneys.length || mockJourneys.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
            activeTab === 'documents'
              ? 'border-amber-500 text-amber-400 font-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{t('dashboard.documentsVault')}</span>
          {(realDocuments.length > 0 ? realDocuments.length : mockDocs.length) > 0 && (
            <span className="bg-amber-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ml-1">
              {realDocuments.length > 0 ? realDocuments.length : mockDocs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('applications'); loadInteropData(); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap relative ${
            activeTab === 'applications'
              ? 'border-amber-500 text-amber-400 font-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>{t('dashboard.myApplications')}</span>
          {mockApplications.length > 0 && (
            <span className="bg-amber-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ml-1">
              {mockApplications.length}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('consent'); loadInteropData(); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
            activeTab === 'consent'
              ? 'border-amber-500 text-amber-400 font-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>{t('dashboard.yourDataConsent')}</span>
          {mockConsents.filter(c => c.status === 'ACTIVE').length > 0 && (
            <span className="bg-emerald-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ml-1">
              {mockConsents.filter(c => c.status === 'ACTIVE').length}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('interop'); loadInteropData(); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
            activeTab === 'interop'
              ? 'border-amber-500 text-amber-400 font-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>{t('dashboard.govtInteropHub')}</span>
        </button>

        <button
          onClick={() => { setActiveTab('conflicts'); loadInteropData(); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
            activeTab === 'conflicts'
              ? 'border-amber-500 text-amber-400 font-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{t('dashboard.checkMyInformation')}</span>
          {conflicts.filter(c => c.status === 'DETECTED').length > 0 && (
            <span className="bg-red-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ml-1 animate-pulse">
              {conflicts.filter(c => c.status === 'DETECTED').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
            activeTab === 'alerts'
              ? 'border-amber-500 text-amber-400 font-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>{t('dashboard.alertsEvents')}</span>
        </button>

        {(user?.role === 'SYSTEM_ADMIN' || user?.role === 'DEPARTMENT_ADMIN') && (
          <button
            onClick={() => setActiveTab('official')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
              activeTab === 'official'
                ? 'border-emerald-500 text-emerald-400 font-black'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>{t('dashboard.officialView')}</span>
          </button>
        )}
      </div>

      {activeTab === 'planner' && (
        <>
          {/* Main Goal Input Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <form onSubmit={handleAnalyzeGoal} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 md:col-span-1 relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t('goalPlanner.domicileState')}
              </label>
              
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 text-sm text-left focus:outline-none focus:border-amber-500/50 flex items-center justify-between transition-colors hover:border-slate-700"
              >
                <span>{domicileState}</span>
                <span className="text-slate-500 text-xs">▼</span>
              </button>

              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setIsDropdownOpen(false)} 
                  />
                  <div className="absolute left-0 right-0 mt-1.5 bg-slate-900 border border-slate-855 rounded-xl shadow-2xl z-50 p-2.5 space-y-2 max-h-72 overflow-y-auto">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('goalPlanner.searchStates')}
                      autoFocus
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500/50"
                    />
                    
                    <div className="space-y-3 pt-1">
                      {/* States Group */}
                      {filteredStates.filter(s => s.type === 'STATE').length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase px-2 block">
                            {t('goalPlanner.states')}
                          </span>
                          {filteredStates.filter(s => s.type === 'STATE').map(st => (
                            <button
                              key={st.code}
                              type="button"
                              onClick={() => {
                                setDomicileState(st.name);
                                setIsDropdownOpen(false);
                                setSearchQuery('');
                              }}
                              className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition ${
                                domicileState === st.name 
                                  ? 'bg-amber-500/10 text-amber-400 font-semibold' 
                                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                              }`}
                            >
                              {st.name}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* UTs Group */}
                      {filteredStates.filter(s => s.type === 'UNION_TERRITORY').length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase px-2 block">
                            {t('goalPlanner.unionTerritories')}
                          </span>
                          {filteredStates.filter(s => s.type === 'UNION_TERRITORY').map(st => (
                            <button
                              key={st.code}
                              type="button"
                              onClick={() => {
                                setDomicileState(st.name);
                                setIsDropdownOpen(false);
                                setSearchQuery('');
                              }}
                              className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition ${
                                domicileState === st.name 
                                  ? 'bg-amber-500/10 text-amber-400 font-semibold' 
                                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                              }`}
                            >
                              {st.name}
                            </button>
                          ))}
                        </div>
                      )}

                      {filteredStates.length === 0 && (
                        <p className="text-slate-500 text-xs text-center py-2">{t('goalPlanner.noMatchingStates')}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t('goalPlanner.whatToAccomplish')}
              </label>
              <div className="relative flex flex-col md:block">
                <textarea
                  rows={2}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder={t('goalPlanner.tellUs')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 md:pr-40 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 text-base md:text-sm resize-none min-h-[80px]"
                />
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="mt-2 md:mt-0 md:absolute md:bottom-3 md:right-3 w-full md:w-auto justify-center bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-4 py-3 md:py-2 rounded-lg text-sm md:text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 transition"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 md:w-3.5 md:h-3.5 animate-spin" />
                      <span>{t('goalPlanner.understanding')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('goalPlanner.understandGoal')}</span>
                      <ArrowRight className="w-4 h-4 md:w-3.5 md:h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
        
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2 mt-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Quick Starts */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <span className="text-xs text-slate-500 font-semibold block mb-2">{t('goalPlanner.quickStarts')}</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <button
              onClick={() => {
                setDomicileState("Gujarat");
                handleQuickStart("I want to start a business in Vadodara, Gujarat.");
              }}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-lg text-xs text-slate-300 transition text-left"
            >
              <Briefcase className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t('goalPlanner.startBusinessVadodara')}</span>
            </button>

            <button
              onClick={() => {
                setDomicileState("Rajasthan");
                handleQuickStart("I am living in Udaipur and I wanna go to Australia for masters.");
              }}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-lg text-xs text-slate-300 transition text-left"
            >
              <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t('goalPlanner.mastersAustralia')}</span>
            </button>

            <button
              onClick={() => {
                setDomicileState("Rajasthan");
                handleQuickStart("I want a scholarship in Rajasthan.");
              }}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-lg text-xs text-slate-300 transition text-left"
            >
              <Landmark className="w-4 h-4 text-orange-400 shrink-0" />
              <span>{t('goalPlanner.scholarshipRajasthan')}</span>
            </button>

            <button
              onClick={() => {
                setDomicileState("Rajasthan");
                handleQuickStart("I am a farmer in Rajasthan.");
              }}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-lg text-xs text-slate-300 transition text-left"
            >
              <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{t('goalPlanner.farmerRajasthan')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cinematic Progressive Processing Screen */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-[#020205]/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{t('goalPlanner.analyzingGoal')}</h4>
                <p className="text-xs text-slate-400">{t('goalPlanner.verifyingRequirements')}</p>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 1 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 1 ? '✓' : '●'} Understanding your request
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Done</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 2 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 2 ? '✓' : '●'} {t('goalPlanner.identifyingLocation')}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Done</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 3 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 3 ? '✓' : '●'} {t('goalPlanner.findingServices')}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Done</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 4 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 4 ? '✓' : '●'} {t('goalPlanner.checkingEligibility')}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Ready</span>
              </div>
            </div>
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
                <h4 className="text-sm font-bold text-white">{t('goalPlanner.buildingJourney')}</h4>
                <p className="text-xs text-slate-400">{t('goalPlanner.realTimeAnalysis')}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 1 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 1 ? '✓' : '●'} {t('goalPlanner.understandingRequest')}
                </span>
                <span className="text-slate-500">{t('common.done')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 2 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 2 ? '✓' : '●'} {t('goalPlanner.identifyingLocation')}
                </span>
                <span className="text-slate-500">{t('common.done')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 3 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 3 ? '✓' : '●'} {t('goalPlanner.findingServices')}
                </span>
                <span className="text-slate-500">{t('common.done')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 4 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 4 ? '✓' : '●'} {t('goalPlanner.checkingEligibility')}
                </span>
                <span className="text-slate-500">{t('common.ready')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sections 01-04 (Journey, Documents, Applications, Govt Support) removed from Goal Planner page.
          These are available via dedicated navigation tabs. */}
      {false && (
      <>
      {/* 01 — YOUR JOURNEY */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-amber-500 font-mono">01</span>
          <div className="border-l border-slate-800 pl-3">
            <h2 className="text-base font-bold text-white uppercase tracking-wider">YOUR JOURNEY</h2>
            <p className="text-xs text-slate-400">Your active government tasks</p>
          </div>
        </div>

        {mockJourneys.length === 0 ? (
          <div className="bg-slate-905 border border-slate-800/80 rounded-xl p-6 text-center text-slate-500 text-xs">
            No active journeys yet. Enter your goal above (e.g. "I want to start a business in Pune") to build your first personalized government journey.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockJourneys.map((j) => (
              <div
                key={j.id}
                onClick={() => router.push(`/journeys/${j.id || 'journey_biz_vadodara_1'}`)}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 cursor-pointer transition space-y-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                      {domicileState === 'Gujarat' ? 'GJ' : domicileState === 'Karnataka' ? 'KA' : domicileState === 'Rajasthan' ? 'RJ' : 'IN'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                        {j.title || 'Dynamic Citizen Journey'}
                      </h3>
                      <p className="text-xs text-slate-400">{profile?.location_city || 'Vadodara'}, {domicileState || 'Gujarat'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-400">In Progress</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Explore resolved categories, single-windows and documents.</span>
                  <span className="text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition">
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 02 — DOCUMENTS */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-amber-500 font-mono">02</span>
          <div className="border-l border-slate-800 pl-3">
            <h2 className="text-base font-bold text-white uppercase tracking-wider">DOCUMENTS</h2>
            <p className="text-xs text-slate-400">Your verified documents</p>
          </div>
        </div>
        <DocumentVault documents={mockDocs.map(d => ({
          id: d.id,
          document_type: d.type,
          document_name: d.name,
          file_name: d.name,
          file_size: 100,
          status: 'COMPLETED',
          verification_status: d.status,
          is_synthetic: d.isDemo,
          issued_by: d.source
        })) as any} />
      </div>

      {/* 03 — APPLICATIONS */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-amber-500 font-mono">03</span>
          <div className="border-l border-slate-800 pl-3">
            <h2 className="text-base font-bold text-white uppercase tracking-wider">APPLICATIONS</h2>
            <p className="text-xs text-slate-400">Track your applications</p>
          </div>
        </div>

        {mockApplications.length === 0 ? (
          <div className="bg-slate-905 border border-slate-800/80 rounded-xl p-6 text-center text-slate-500 text-xs">
            No active applications found. Use the Goal Planner to start a journey.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockApplications.slice(0, 2).map((app) => (
              <div 
                key={app.id} 
                onClick={() => { setActiveTab('applications'); setSelectedApp(app); }}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-4 cursor-pointer transition shadow-md"
              >
                <div className="flex justify-between items-start gap-2 border-b border-slate-850 pb-3 text-xs">
                  <div>
                    <span className="text-[9px] font-black text-slate-500 tracking-wider block uppercase">{app.department}</span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{app.title}</h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">ID: <span className="text-amber-500 font-bold">{app.id}</span></p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider text-center shrink-0 ${
                    ['APPROVED', 'COMPLETED'].includes(app.status) ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    app.status === 'ACTION_REQUIRED' ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' :
                    ['SUBMITTED', 'VERIFICATION'].includes(app.status) ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {app.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Submitted: {app.submittedDate}</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    Track <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 04 — GOVERNMENT SUPPORT */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-amber-500 font-mono">04</span>
          <div className="border-l border-slate-800 pl-3">
            <h2 className="text-base font-bold text-white uppercase tracking-wider">GOVERNMENT SUPPORT</h2>
            <p className="text-xs text-slate-400">Relevant support available to you</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Verified Schemes & Benefits</span>
                <span className="text-xs font-normal text-slate-400">({schemes.length} Available)</span>
              </h3>
              <p className="text-xs text-slate-450 font-mono">
                Source: JanSetu federated query • Last verified: {new Date().toLocaleDateString('en-GB')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => {
                  setIsRefreshing(true);
                  const stFilter = selectedState === 'All India' ? undefined : selectedState;
                  fetchSchemesAPI({ state_name: stFilter, limit: 15 }).then((res) => {
                    if (res && res.schemes) {
                      setSchemes(res.schemes);
                    }
                    setTimeout(() => setIsRefreshing(false), 300);
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Query</span>
              </button>
              <StateSelector selectedState={selectedState} onStateChange={setSelectedState} />
            </div>
          </div>

          {schemes.length === 0 ? (
            <div className="bg-slate-950 border border-slate-900 p-8 rounded-xl text-center text-slate-505 text-xs">
              No active schemes currently listed for this location. Try changing your domicile state.
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
      </>
      )}
      </>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Applications Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Applications</span>
              <span className="text-lg font-black text-white">{mockApplications.length} Registered</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Verification</span>
              <span className="text-lg font-black text-amber-400">
                {mockApplications.filter(a => ['VERIFICATION', 'SUBMITTED', 'ACTION_REQUIRED'].includes(a.status)).length} Pending
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Completed</span>
              <span className="text-lg font-black text-emerald-400">
                {mockApplications.filter(a => ['APPROVED', 'COMPLETED'].includes(a.status)).length} Issued
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Action Required</span>
              <span className="text-lg font-black text-red-400 animate-pulse">
                {mockApplications.filter(a => a.status === 'ACTION_REQUIRED').length} Alert
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-amber-400" />
                  <span>Unified Government Application Tracking</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Track and manage registrations across multiple departments from a single authenticated citizen window.
                </p>
              </div>
              <button
                onClick={loadInteropData}
                disabled={isRefreshing}
                className="p-2 bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white rounded-lg transition"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {mockApplications.length === 0 ? (
              <div className="bg-slate-950 border border-slate-900 p-8 rounded-xl text-center text-slate-500 text-xs">
                No active applications found. Use the Goal Planner to start a journey.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockApplications.map((app) => (
                  <div 
                    key={app.id} 
                    onClick={() => setSelectedApp(app)}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-4 cursor-pointer transition shadow-md"
                  >
                    <div className="flex justify-between items-start gap-2 border-b border-slate-900 pb-3 text-xs">
                      <div>
                        <span className="text-[9px] font-black text-slate-500 tracking-wider block uppercase">{app.department}</span>
                        <h3 className="text-sm font-bold text-white mt-0.5">{app.title}</h3>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">ID: <span className="text-amber-500 font-bold">{app.id}</span></p>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider text-center shrink-0 ${
                        ['APPROVED', 'COMPLETED'].includes(app.status) ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        app.status === 'ACTION_REQUIRED' ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' :
                        ['SUBMITTED', 'VERIFICATION'].includes(app.status) ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}>
                        {app.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>Submitted: {app.submittedDate}</span>
                      <span className="text-amber-400 font-bold hover:underline flex items-center gap-1">
                        View Details <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Application Detail Modal */}
          {selectedApp && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-scaleUp">
                <div className="bg-slate-950 p-5 border-b border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-black text-slate-500 tracking-wider block uppercase">{selectedApp.department_name}</span>
                    <h3 className="text-base font-bold text-white">{selectedApp.service_name}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedApp(null)}
                    className="text-slate-400 hover:text-white text-sm font-bold bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg transition"
                  >
                    Close
                  </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs">
                  {/* Timeline Progress */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Application Timeline</span>
                    <div className="relative border-l border-slate-800 ml-1.5 pl-4 space-y-4 py-1">
                      <div className="relative">
                        <div className="absolute -left-[21.5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-500" />
                        <h4 className="font-bold text-slate-300">Goal Created</h4>
                        <p className="text-slate-500 text-[10px]">Citizen goal resolved and journey generated.</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[21.5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-500" />
                        <h4 className="font-bold text-slate-300">Identity Verified</h4>
                        <p className="text-slate-500 text-[10px]">Authoritative Aadhaar e-KYC validation successful.</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[21.5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-500" />
                        <h4 className="font-bold text-slate-300">Address Verified</h4>
                        <p className="text-slate-500 text-[10px]">Residential address validated from state land registry.</p>
                      </div>
                      {selectedApp.timeline.map((evt: any, idx: number) => (
                        <div key={idx} className="relative">
                          <div className={`absolute -left-[21.5px] top-1 w-2.5 h-2.5 rounded-full border ${
                            evt.status === 'APPROVED' ? 'bg-emerald-500 border-emerald-500' :
                            evt.status === 'DOCUMENTS_REQUIRED' ? 'bg-red-500 border-red-500 animate-pulse' :
                            'bg-cyan-500 border-cyan-500'
                          }`} />
                          <h4 className="font-bold text-slate-300">{evt.title}</h4>
                          <p className="text-slate-400 text-[11px] mt-0.5">{evt.description}</p>
                          <span className="text-[9px] text-slate-500 block mt-0.5">{new Date(evt.timestamp).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metadata fields */}
                  <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-slate-500 font-semibold block uppercase text-[9px]">Data Fields Reused</span>
                        <span className="text-slate-300 font-bold">✓ Identity, Address, Contact</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block uppercase text-[9px]">Registry Source</span>
                        <span className="text-slate-300 font-bold">UIDAI Registry, State Land Registry</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block uppercase text-[9px]">Consent token</span>
                        <span className="text-cyan-400 font-mono font-bold">✓ CONSENT-8821 (Authorized)</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block uppercase text-[9px]">Connector Protocol</span>
                        <span className="text-slate-300 font-bold">
                          {selectedApp.service_id === 'srv_pmc_license' ? 'SOAP Legacy Adapter' : 'Modern OAuth REST API'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Simulate update action */}
                  {selectedApp.status === 'UNDER_VERIFICATION' && (
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-amber-400">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span className="font-bold uppercase tracking-wider text-[10px]">Simulate Event Update (Judge Demo)</span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Clicking this triggers an asynchronous event update from the department. The status change will immediately propagate to all tabs.
                      </p>
                      <button
                        onClick={() => {
                          updateApplicationStatusAPI(selectedApp.application_id, "APPROVED", "Business Registration approved. Corporate Registration ID: MSINS-PUNE-88742 successfully issued.").then(() => {
                            setSelectedApp(null);
                            loadInteropData();
                          });
                        }}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold py-2 rounded-lg text-xs hover:from-amber-400 hover:to-orange-400 transition"
                      >
                        Simulate Status Update: Approve Application
                      </button>
                    </div>
                  )}

                  {selectedApp.status === 'DOCUMENTS_REQUIRED' && (
                    <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-red-400 font-bold">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>Action Required: Missing Premises Document</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Please resolve the action item by simulating a document upload validation check.
                      </p>
                      <button
                        onClick={() => {
                          updateApplicationStatusAPI(selectedApp.application_id, "UNDER_VERIFICATION", "Fire NOC layout document uploaded. Re-initiating automated interoperability validation checklist.").then(() => {
                            setSelectedApp(null);
                            loadInteropData();
                          });
                        }}
                        className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-2 rounded-lg text-xs transition"
                      >
                        Resolve & Upload Fire NOC
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Consent Tab */}
      {activeTab === 'consent' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Consent stats bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Active Consents</span>
              <span className="text-lg font-black text-emerald-400">{mockConsents.filter(c => c.status === 'ACTIVE').length}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Pending Requests</span>
              <span className="text-lg font-black text-amber-400">{mockConsents.filter(c => c.status === 'PENDING').length}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Revoked Accounts</span>
              <span className="text-lg font-black text-slate-500">{mockConsents.filter(c => c.status === 'REVOKED').length}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <span>Consent-Based Data Sharing Dashboard</span>
              </h2>
              <p className="text-xs text-slate-400">
                You control privacy. Authorize, restrict, or revoke access to your verified e-KYC documents dynamically.
              </p>
            </div>

            {/* List of consents */}
            <div className="space-y-4">
              {mockConsents.map((c) => (
                <div key={c.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <h4 className="font-bold text-white text-sm">{c.department}</h4>
                      <p className="text-slate-400 mt-1">Purpose: {c.purpose}</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Requested Fields: <span className="font-mono text-cyan-400 font-bold">{c.requestedFields.join(", ")}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : c.status === 'REVOKED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {c.status === 'ACTIVE' ? 'Active Consent' : c.status === 'REVOKED' ? 'Access Revoked' : 'Pending Authorization'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 justify-end border-t border-slate-900 pt-3">
                    <button
                      onClick={() => setSelectedConsent(c)}
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-bold px-3 py-3 sm:py-1.5 rounded-lg text-xs sm:text-[11px] transition text-center min-h-[44px] sm:min-h-0"
                    >
                      View Details
                    </button>
                    {c.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => {
                            createConsentAPI(c.id, c.department, c.requestedFields, c.purpose, "ALWAYS").then(() => loadInteropData());
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-3 sm:py-1.5 rounded-lg text-xs sm:text-[11px] transition text-center min-h-[44px] sm:min-h-0"
                        >
                          Allow Always
                        </button>
                        <button
                          onClick={() => {
                            createConsentAPI(c.id, c.department, c.requestedFields, c.purpose, "ONCE").then(() => loadInteropData());
                          }}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold px-3 py-3 sm:py-1.5 rounded-lg text-xs sm:text-[11px] hover:from-amber-400 hover:to-orange-400 transition text-center min-h-[44px] sm:min-h-0"
                        >
                          Allow Once
                        </button>
                      </>
                    )}
                    {c.status === 'ACTIVE' && (
                      <button
                        onClick={() => revokeConsentAPI(c.id).then(() => loadInteropData())}
                        className="text-red-400 hover:text-red-300 font-bold bg-red-500/5 sm:bg-transparent hover:bg-red-500/10 border border-red-500/10 sm:border-transparent hover:border-red-500/20 px-3 py-3 sm:py-1.5 rounded-lg text-xs sm:text-[11px] transition text-center min-h-[44px] sm:min-h-0"
                      >
                        Revoke Access
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Log Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <span>Immutable Data Access Audit Trail</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">256-bit Encrypted Logs</span>
            </div>
            <div className="divide-y divide-slate-800/80 text-xs max-h-64 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <p>No audit events yet. Consent actions will be logged here.</p>
                </div>
              ) : auditLogs.map((log: any) => (
                <div key={log.id} className="p-4 hover:bg-slate-800/40 transition flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px]">
                        {log.action}
                      </span>
                      <span className="font-semibold text-slate-200">{log.resource}</span>
                    </div>
                    <p className="text-slate-400">{log.status || 'SUCCESS'}</p>
                  </div>
                  <span className="text-[11px] text-slate-500 shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Consent Details Modal */}
          {selectedConsent && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scaleUp">
                <div className="bg-slate-950 p-5 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>Consent Details Sheet</span>
                  </h3>
                  <button 
                    onClick={() => setSelectedConsent(null)}
                    className="text-slate-400 hover:text-white text-xs bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg transition"
                  >
                    Close
                  </button>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-500 text-[10px] font-semibold block uppercase">WHO IS REQUESTING?</span>
                      <p className="text-slate-200 font-bold">{selectedConsent.department}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] font-semibold block uppercase">WHAT DATA FIELDS?</span>
                      <p className="text-cyan-400 font-mono font-bold">{selectedConsent.requestedFields.join(", ")}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] font-semibold block uppercase">WHY ACCESS IS NEEDED?</span>
                      <p className="text-slate-300">{selectedConsent.purpose}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] font-semibold block uppercase">DURATION</span>
                      <p className="text-slate-300">Scoped strictly to the application lifetime ({selectedConsent.status}).</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] font-semibold block uppercase">SECURITY PROTOCOL</span>
                      <p className="text-slate-300 font-bold text-emerald-400">✓ End-to-end Encrypted payload exchange in transit</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] font-semibold block uppercase">AUDIT COMPLIANCE</span>
                      <p className="text-slate-300">All lookups logged permanently in system audit trails.</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    {selectedConsent.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => {
                            createConsentAPI(selectedConsent.id, selectedConsent.department, selectedConsent.requestedFields, selectedConsent.purpose, "ONCE").then(() => {
                              setSelectedConsent(null);
                              loadInteropData();
                            });
                          }}
                          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold py-2 rounded-lg text-xs hover:from-amber-400 hover:to-orange-400 transition"
                        >
                          Approve Consent
                        </button>
                        <button
                          onClick={() => {
                            setSelectedConsent(null);
                          }}
                          className="flex-1 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-white font-bold py-2 rounded-lg text-xs transition"
                        >
                          Deny
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Interop Tab */}
      {activeTab === 'interop' && (
        <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto mt-8">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <Network className="w-10 h-10 text-emerald-400" />
              </div>
              
              <h1 className="text-3xl font-extrabold text-white mb-4">
                Government Interop Hub
              </h1>
              
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-left w-full max-w-xl mx-auto my-6 space-y-4 shadow-inner">
                <p className="text-slate-300 text-lg leading-relaxed text-center">
                  Your data has been securely synced with <strong className="text-white">UIDAI</strong>, <strong className="text-white">Municipal Corporation</strong>, and the <strong className="text-white">Tax Department</strong>.
                </p>
                <div className="h-px w-full bg-slate-800/50 my-4" />
                <p className="text-emerald-400 font-bold text-lg flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-6 h-6" />
                  Because of JanSetu, you didn't have to fill out 45 form fields.
                </p>
              </div>
              
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                JanSetu securely routes your authorized information behind the scenes, so you only provide your details once.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Quality Tab */}
      {activeTab === 'conflicts' && (
        <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto mt-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-3xl rounded-full" />
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                    Your Information Across Government
                  </h1>
                  <p className="text-sm text-slate-400 mt-2 max-w-xl">
                    JanSetu automatically ensures your records are consistent across all departments, preventing delays in your applications.
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-3xl font-black text-emerald-400 flex items-center justify-end gap-2">
                    <CheckCircle2 className="w-6 h-6" /> 100% Match
                  </div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Data Consistency</div>
                </div>
              </div>
              
              <div className="grid gap-6">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-inner">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-blue-400" /> Verified Name
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Aadhaar (UIDAI)</p>
                      <p className="text-lg font-bold text-white">{user?.full_name || 'Hriday Bardia'}</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">PAN (Income Tax)</p>
                      <p className="text-lg font-bold text-white">{user?.full_name || 'Hriday Bardia'}</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Driving License</p>
                      <p className="text-lg font-bold text-white">{user?.full_name || 'Hriday Bardia'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-inner">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-400" /> Registered Address
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Aadhaar (UIDAI)</p>
                      <p className="text-sm font-bold text-white">{(user as any)?.address || 'Flat 402, Shivajinagar, Pune'}</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Property Tax (PMC)</p>
                        <p className="text-sm font-bold text-white">{(user as any)?.address || 'Flat 402, Shivajinagar, Pune'}</p>
                      </div>
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center pt-4">
                 <p className="text-xs text-slate-500 flex items-center gap-2">
                   <ShieldCheck className="w-4 h-4 text-slate-400" /> Your information is securely vaulted and never shared without your explicit consent.
                 </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'journeys' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-400" />
                <span>Your Active Workflows & Journeys</span>
              </h2>
              <p className="text-xs text-slate-400">
                Monitor status, check prerequisite dependencies, and execute step-by-step onboarding sequences.
              </p>
            </div>
            
            {realJourneys.length === 0 && mockJourneys.length === 0 ? (
              <div className="bg-slate-950 border border-slate-900 p-8 rounded-xl text-center space-y-4 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <MapPin className="w-6 h-6 text-amber-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white">No active journeys found</h3>
                  <p className="text-[11px] text-slate-500">Analyze a citizen goal to automatically generate a step-by-step journey.</p>
                </div>
                <button
                  onClick={() => setActiveTab('planner')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs transition hover:opacity-90"
                >
                  Go to Goal Planner
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Real backend journeys */}
                {realJourneys.map((j: any) => (
                  <div key={j.id} className="bg-slate-950 border border-slate-850 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          {j.goal_category || 'general'}
                        </span>
                        <span className="text-xs text-slate-500">Progress: {j.progress_percentage || 0}%</span>
                      </div>
                      <h3 className="text-sm font-black text-white">{j.title}</h3>
                      <p className="text-xs text-slate-400">{j.location_state || 'India'} {j.location_city ? `(${j.location_city})` : ''}</p>
                    </div>
                    <button
                      onClick={() => router.push(`/journeys/${j.id}`)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition shadow self-start sm:self-center"
                    >
                      <span>Track Workflow</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {/* Mock journeys (fallback) */}
                {realJourneys.length === 0 && mockJourneys.map((j) => (
                  <div key={j.id} className="bg-slate-950 border border-slate-850 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          {j.category}
                        </span>
                        <span className="text-xs text-slate-500">Progress: {j.progress}%</span>
                      </div>
                      <h3 className="text-sm font-black text-white">{j.title}</h3>
                      <p className="text-xs text-slate-400">{j.currentStage}</p>
                    </div>
                    <button
                      onClick={() => router.push(`/journeys/${j.id}`)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition shadow self-start sm:self-center"
                    >
                      <span>Track Workflow</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-6 animate-fadeIn">
          {uploadingFile && (
            <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-4 space-y-2 animate-pulse text-xs">
              <div className="flex justify-between font-bold text-slate-200">
                <span>Uploading {uploadingFile}...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-500 h-full transition-all duration-100" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="text-[10px] text-slate-500">Running OCR extraction and hashing cross-document consistency...</p>
            </div>
          )}
          <DocumentVault 
            documents={mockDocs.map(d => ({
              id: d.id,
              document_type: d.type,
              document_name: d.name,
              file_name: d.name,
              file_size: 100,
              status: 'COMPLETED',
              verification_status: d.status,
              is_synthetic: d.isDemo,
              issued_by: d.source
            })) as any} 
            goalCategory={journeyAnalysis?.intent?.primary === 'STUDY_ABROAD' ? 'education' : 'business'}
            consistencyStatus={
              mockDocs.length > 0 ? {
                overall_status: 'CONSISTENT',
                identity_status: 'MATCHED',
                dob_status: 'MATCHED',
                discrepancies: []
              } : undefined
            }
            onUpload={(file) => {
              setUploadingFile(file ? file.name : 'rent_agreement_signed.pdf');
              setUploadProgress(0);
              let progress = 0;
              const timer = setInterval(() => {
                progress += 20;
                setUploadProgress(progress);
                if (progress >= 100) {
                  clearInterval(timer);
                  setTimeout(() => {
                    const mockDoc = {
                      id: `doc-${Date.now()}`,
                      name: file ? file.name : 'rent_agreement_signed.pdf',
                      type: 'Rent Agreement',
                      status: 'VERIFIED' as const,
                      uploadDate: new Date().toLocaleDateString('en-GB'),
                      fileType: 'PDF',
                      pageCount: 1,
                      source: 'Uploaded by User',
                      isDemo: true
                    };
                    addDocument(mockDoc);
                    setUploadingFile(null);
                  }, 300);
                }
              }, 200);
            }}
          />
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Regulatory Policy Changes */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <span>System Policy & Regulatory Updates</span>
              </h2>
              <p className="text-xs text-slate-400">
                Official regulatory policy triggers automatically mapped to your location and profile.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Karnataka Trade Policy</span>
                  <span className="text-[10px] text-slate-500">Effective: 01 April 2026</span>
                </div>
                <h4 className="text-xs font-bold text-white">Karnataka Single Window Clearance Amendment</h4>
                <p className="text-[11px] text-slate-400">Updates trade licensing rules for commercial food businesses in BBMP limits, reducing approval timelines from 15 to 7 days.</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Central Indirect Taxes</span>
                  <span className="text-[10px] text-slate-500">Effective: 15 Feb 2026</span>
                </div>
                <h4 className="text-xs font-bold text-white">GSTIN Validation Schema Change</h4>
                <p className="text-[11px] text-slate-400">Requires multi-factor authentication for API-based registration, automatically managed by JanSetu OAuth adapters.</p>
              </div>
            </div>
          </div>

          {/* Event-driven Notifications */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <span>Application-Status Event Feed</span>
              </h2>
              <p className="text-xs text-slate-400">
                Event-driven notification triggers tracking your registrations across departments.
              </p>
            </div>

            <div className="space-y-3">
              {mockAlerts.length === 0 ? (
                <div className="bg-slate-950 border border-slate-900 p-6 rounded-xl text-center text-slate-500 text-xs">
                  No notifications yet. Submitted applications will post event feeds here.
                </div>
              ) : (
                mockAlerts.map((n) => (
                  <div key={n.id} className={`bg-slate-950 border border-slate-850 rounded-xl p-3.5 flex gap-3 text-xs ${n.isNew ? 'border-amber-500/50 bg-slate-900 animate-pulse' : ''}`}>
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500 shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200">{n.category || 'Event Log'}</span>
                        <span className="text-[9px] text-slate-500 font-mono">{n.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{n.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'official' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Stats Panel */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Beneficiaries</span>
              <span className="text-lg font-black text-white">148,204 Citizens</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Approvals Rate</span>
              <span className="text-lg font-black text-emerald-400">94.2% Success</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">SLA Compliance</span>
              <span className="text-lg font-black text-cyan-400">{metrics?.sla_compliance_rate || '97.4'}% Target</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Failed Transactions</span>
              <span className="text-lg font-black text-red-400 animate-pulse">{metrics?.failed_transactions_count || '8'} Events</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* System Health Telemetry */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl lg:col-span-1 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Telemetry Health Monitoring</span>
                </h2>
                <p className="text-[10px] text-slate-500">Live API response latency and connector uptime telemetry.</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="text-slate-400">Core Gateway Latency</span>
                  <span className="font-bold text-white font-mono">{metrics?.latency_average_ms || 118}ms</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="text-slate-400">Orchestrator Uptime</span>
                  <span className="font-bold text-emerald-400 font-mono">{metrics?.uptime_percentage || 99.98}%</span>
                </div>

                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">State Nodes Response Uptime</span>
                  {metrics?.departments?.map((dept: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">{dept.name}</span>
                      <span className="font-bold text-white font-mono">{dept.uptime}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Connector Registries Topology */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl lg:col-span-2 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>GovTech Connector Registry & Protocols</span>
                </h2>
                <p className="text-[10px] text-slate-500">Connected middleware state adapters, caching nodes, and legacy protocols.</p>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-bold">
                      <th className="pb-2">Registry Endpoint</th>
                      <th className="pb-2">Protocol</th>
                      <th className="pb-2 text-center">Status</th>
                      <th className="pb-2 text-right">Simulation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr className="hover:bg-slate-950/20">
                      <td className="py-2.5 font-bold text-slate-200">DigiLocker Sandbox Endpoint</td>
                      <td className="py-2.5 text-slate-400 font-mono">REST JSON API (Oauth2)</td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-bold">HEALTHY</span>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="text-slate-500 text-[10px]">Authoritative Node</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-950/20">
                      <td className="py-2.5 font-bold text-slate-200">Pune Municipal Corp (PMC)</td>
                      <td className="py-2.5 text-slate-400 font-mono">SOAP 1.1 XML (Envelope)</td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          healthData?.services?.find((s: any) => s.service_id === 'srv_pmc_license')?.health_status === 'Failed' 
                            ? 'bg-red-500/10 text-red-400 animate-pulse'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {healthData?.services?.find((s: any) => s.service_id === 'srv_pmc_license')?.health_status === 'Failed' ? 'FAILED' : 'HEALTHY'}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => {
                            const currentStatus = healthData?.services?.find((s: any) => s.service_id === 'srv_pmc_license')?.health_status === 'Failed' ? 'HEALTHY' : 'FAILED';
                            toggleConnectorHealthAPI('srv_pmc_license', currentStatus).then(() => loadInteropData());
                          }}
                          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold px-2 py-1 rounded text-[9px] transition"
                        >
                          Toggle Outage
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-950/20">
                      <td className="py-2.5 font-bold text-slate-200">BBMP Bangalore Municipal Node</td>
                      <td className="py-2.5 text-slate-400 font-mono">SOAP 1.2 XML (RPC)</td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-bold">HEALTHY</span>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="text-slate-500 text-[10px]">N/A</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-950/20">
                      <td className="py-2.5 font-bold text-slate-200">GSTN Central Taxes Registry</td>
                      <td className="py-2.5 text-slate-400 font-mono">REST JSON (OAuth2)</td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-bold">HEALTHY</span>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="text-slate-500 text-[10px]">Authoritative Node</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>

  );
}

