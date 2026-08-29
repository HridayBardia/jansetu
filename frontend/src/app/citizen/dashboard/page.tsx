'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
import { CitizenHero } from '@/components/citizen/CitizenHero';
import { SchemeExplorer } from '@/components/citizen/SchemeExplorer';
import { ApplicationTracker } from '@/components/citizen/ApplicationTracker';
import { ConsentLedger } from '@/components/ConsentLedger';
import { analyzeGoalUniversal } from '@/lib/goalClassifier';
import { DocumentVault } from '@/components/DocumentVault';
import { CitizenNavTabs } from '@/components/citizen/CitizenNavTabs';
import { CheckMyInformation } from '@/components/citizen/CheckMyInformation';
import { YourDataConsent } from '@/components/citizen/YourDataConsent';
import { AlertsEvents } from '@/components/citizen/AlertsEvents';
import { GovInteropHub } from '@/components/citizen/GovInteropHub';
import { AiHelpDrawer } from '@/components/AiHelpDrawer';
import { PendingRequestBanner } from '@/components/citizen/PendingRequestBanner';
import { ActiveAlertBanner } from '@/components/citizen/ActiveAlertBanner';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useLiveSync } from '@/context/LiveSyncContext';
import { DEMO_CITIZENS, findCitizen } from '@/data/demoCitizens';
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
  UserCircle,
  ChevronDown,
  X
} from 'lucide-react';
import { useMockData } from '@/context/MockDataContext';
import { LockScroll } from '@/hooks/useLockBodyScroll';

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
  const { t, isRTL, language, translateInputToEnglish, translateDynamicText } = useLanguage();
  const { user, isAuthenticated, isLoading, profile, logout } = useAuth();

  const [ekycProfile, setEkycProfile] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('jansetu_ekyc_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.name === user?.full_name || parsed.username === user?.username || parsed.rawAadhaar === user?.id)) {
            setEkycProfile(parsed);
            return;
          }
        }
        if (user) {
          const matched = findCitizen(user.username || user.full_name || user.id);
          if (matched) setEkycProfile(matched);
          else setEkycProfile(null);
        }
      } catch (e) {}
    }
  }, [user]);

  const citizenName = profile?.full_name || ekycProfile?.name || user?.full_name || 'Ayush Singh Chauhan';
  const citizenAadhaar = profile?.aadhaar || ekycProfile?.aadhaar || (user?.id && /^\d+$/.test(user.id) ? `XXXX XXXX ${user.id.slice(-4)}` : '1111 2222 0207');
  const citizenPhone = profile?.phone || ekycProfile?.phone || user?.mobile_number || '+91 XXXXX 0207';
  const citizenDob = profile?.date_of_birth || ekycProfile?.dob || '20/12/2004';
  const citizenGender = profile?.gender || ekycProfile?.gender || 'Male';
  const citizenAddress = profile?.location_city ? `${profile.location_city}, ${profile.location_state}` : ekycProfile?.address || '88, Boring Road, Jaipur, Rajasthan - 302001';

  const [goalInput, setGoalInput] = useState('');
  const latestRequestIdRef = React.useRef<number>(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
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
    addDocument,
    removeDocument,
    addApplication
  } = useMockData();

  const { 
    journeys: liveJourneys, 
    startJourney 
  } = useLiveSync();

  const [activeTab, _setActiveTab] = useState<'planner' | 'schemes' | 'journeys' | 'documents' | 'applications' | 'consent' | 'interop' | 'conflicts' | 'alerts' | 'official'>('planner');

  const setActiveTab = (tab: 'planner' | 'schemes' | 'journeys' | 'documents' | 'applications' | 'consent' | 'interop' | 'conflicts' | 'alerts' | 'official') => {
    _setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('tab', tab);
      router.push(newUrl.pathname + newUrl.search, { scroll: false });
    }
  };

  const searchParams = useSearchParams();
  const queryTab = searchParams.get('tab');

  useEffect(() => {
    if (queryTab) {
      const validTabs = ['planner', 'schemes', 'journeys', 'documents', 'applications', 'consent', 'interop', 'conflicts', 'alerts', 'official'];
      if (validTabs.includes(queryTab)) {
        _setActiveTab(prev => {
          if (prev !== queryTab) return queryTab as any;
          return prev;
        });
      }
    } else {
      // If no tab parameter exists in the URL, default to planner
      _setActiveTab(prev => {
        if (prev !== 'planner') return 'planner';
        return prev;
      });
    }
  }, [queryTab]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close notifications menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        isNotificationsOpen &&
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isNotificationsOpen]);
  
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
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

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
        <Loader2 className="w-8 h-8 animate-spin text-[#133E87] dark:text-blue-400" />
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
      const normalizedQuery = await translateInputToEnglish(trimmedGoal);
      console.log("[Journey] Normalized query for search engine:", normalizedQuery);
      const res = await analyzeJourneyAPI(normalizedQuery || trimmedGoal, domicileState);
      
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

  const handleStartActiveJourney = (customTitle?: string, customCat?: string, customLoc?: string) => {
    let title = customTitle || goalInput.trim();
    let category = customCat || 'General Welfare';
    let location = customLoc || `${domicileState}, India`;
    let currentStage = 'Document & e-KYC Verification';

    if (title.toLowerCase().includes('vadodara') || title.toLowerCase().includes('business')) {
      title = 'Start Commercial Food Business in Vadodara';
      category = 'Business & Commerce';
      location = 'Vadodara, Gujarat';
      currentStage = 'FSSAI License & Municipal Trade Clearance';
    } else if (title.toLowerCase().includes('australia') || title.toLowerCase().includes('masters')) {
      title = 'Higher Education & Masters in Australia';
      category = 'Higher Education';
      location = 'Udaipur, Rajasthan';
      currentStage = 'Academic Marksheet Verification & Bank Mandate';
    } else if (title.toLowerCase().includes('scholarship')) {
      title = 'Post-Matric Scholarship Scheme Application';
      category = 'Scholarships & Welfare';
      location = 'Jaipur, Rajasthan';
      currentStage = 'Income Certificate & Category Scrutiny';
    } else if (title.toLowerCase().includes('farmer') || title.toLowerCase().includes('kisan')) {
      title = 'PM-KISAN Beneficiary Registration & Land Linking';
      category = 'Agriculture & Rural';
      location = 'Kota, Rajasthan';
      currentStage = 'Land Revenue Khasra e-Authentication';
    }

    startJourney({
      id: `jrn_${Date.now()}`,
      title,
      category,
      citizenName,
      status: 'In Progress',
      progress: 10,
      currentStage,
      documentsReady: 2,
      documentsTotal: 4,
      nextAction: 'Verify Aadhaar e-KYC and upload state credentials',
      lastUpdated: 'Just now',
      timestamp: Date.now(),
      location
    });

    setActiveTab('journeys');
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
    <div className="w-full space-y-6 animate-fade-in">
      {/* e-KYC Verified Citizen Banner */}
      <CitizenHero />

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => setActiveTab('documents')}
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md p-4 flex items-center gap-4 transition hover:border-amber-500/50 cursor-pointer shadow-xs hover:shadow-sm"
        >
          <div className="w-10 h-10 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-300 dark:border-emerald-800 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">{t('dashboard.documentVault')}</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">{realDocuments.length > 0 ? realDocuments.length : mockDocs.length} {t('dashboard.verifiedFiles')}</span>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('journeys')}
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md p-4 flex items-center gap-4 transition hover:border-amber-500/50 cursor-pointer shadow-xs hover:shadow-sm"
        >
          <div className="w-10 h-10 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-300 dark:border-amber-800 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">{t('dashboard.activeJourneys')}</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">{(realJourneys.length || mockJourneys.length)} {t('dashboard.activeJourneysCount')}</span>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('schemes')}
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md p-4 flex items-center gap-4 transition hover:border-amber-500/50 cursor-pointer shadow-xs hover:shadow-sm"
        >
          <div className="w-10 h-10 rounded bg-blue-50 dark:bg-blue-950/40 text-[#133E87] dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800 shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">{t('dashboard.govtSupport')}</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">{schemes.length || 6} {t('dashboard.schemesAvailable')}</span>
          </div>
        </div>
      </div>

      {/* Interoperability Tabs Switcher (Hidden on Mobile) */}
      <CitizenNavTabs activeTab={activeTab as any} setActiveTab={setActiveTab} loadInteropData={loadInteropData} />

      {/* Prominent High-Visibility e-KYC Urgent Action Banner */}
      <ActiveAlertBanner />

      {activeTab === 'schemes' && (
        <SchemeExplorer 
          onApplicationCreated={(newApp: any) => {
            addApplication(newApp);
          }} 
        />
      )}

      {activeTab === 'planner' && (
        <>
          {/* Main Goal Input Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6 shadow-sm">
        <form onSubmit={handleAnalyzeGoal} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 md:col-span-1 relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {t('goalPlanner.domicileState')}
              </label>
              
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md p-3 text-slate-900 dark:text-white text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#133E87] dark:focus:ring-blue-500 flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
              >
                <span>{domicileState}</span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {isDropdownOpen && (
                <>
                  <LockScroll />
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setIsDropdownOpen(false)} 
                  />
                  <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md shadow-lg z-50 p-2.5 space-y-2 max-h-72 overflow-y-auto">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('goalPlanner.searchStates')}
                      autoFocus
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                    />
                    
                    <div className="space-y-3 pt-1">
                      {/* States Group */}
                      {filteredStates.filter(s => s.type === 'STATE').length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase px-2 block">
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
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-[#133E87] dark:text-blue-400 font-bold' 
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
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
                          <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase px-2 block">
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
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-[#133E87] dark:text-blue-400 font-bold' 
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {t('goalPlanner.whatToAccomplish')}
              </label>
              <div className="relative flex flex-col md:block">
                <textarea
                  rows={2}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder={t('goalPlanner.tellUs')}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md p-3 md:pr-44 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#133E87] dark:focus:ring-blue-500 text-base md:text-sm resize-none min-h-[80px] shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="mt-2 md:mt-0 md:absolute md:bottom-3 md:right-3 w-full md:w-auto justify-center bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-md text-sm md:text-xs flex items-center gap-2 shadow-xs disabled:opacity-50 transition cursor-pointer"
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
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs p-3 rounded-md flex items-center gap-2 mt-4">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Quick Starts */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider block mb-2">{t('goalPlanner.quickStarts')}</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <button
              onClick={() => {
                setDomicileState("Gujarat");
                handleQuickStart("I want to start a business in Vadodara, Gujarat.");
              }}
              className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 p-2.5 rounded-md text-xs text-slate-800 dark:text-slate-200 transition text-left cursor-pointer shadow-2xs"
            >
              <Briefcase className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{t('goalPlanner.startBusinessVadodara')}</span>
            </button>

            <button
              onClick={() => {
                setDomicileState("Rajasthan");
                handleQuickStart("I am living in Udaipur and I wanna go to Australia for masters.");
              }}
              className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 p-2.5 rounded-md text-xs text-slate-800 dark:text-slate-200 transition text-left cursor-pointer shadow-2xs"
            >
              <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{t('goalPlanner.mastersAustralia')}</span>
            </button>

            <button
              onClick={() => {
                setDomicileState("Rajasthan");
                handleQuickStart("I want a scholarship in Rajasthan.");
              }}
              className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 p-2.5 rounded-md text-xs text-slate-800 dark:text-slate-200 transition text-left cursor-pointer shadow-2xs"
            >
              <Landmark className="w-4 h-4 text-[#133E87] dark:text-blue-400 shrink-0" />
              <span>{t('goalPlanner.scholarshipRajasthan')}</span>
            </button>

            <button
              onClick={() => {
                setDomicileState("Rajasthan");
                handleQuickStart("I am a farmer in Rajasthan.");
              }}
              className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 p-2.5 rounded-md text-xs text-slate-800 dark:text-slate-200 transition text-left cursor-pointer shadow-2xs"
            >
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{t('goalPlanner.farmerRajasthan')}</span>
            </button>
          </div>
        </div>

        {/* Interactive Goal Road-Map Card & Direct Activation CTA */}
        {goalInput.trim().length > 0 && (
          <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-blue-50/80 via-slate-50 to-indigo-50/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-850 border-2 border-[#133E87]/30 dark:border-blue-500/30 shadow-md space-y-5 animate-scaleUp">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#133E87] dark:text-blue-400 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800">
                    {t('goalPlanner.liveRoadmap', 'Live Goal Workflow Road-Map')}
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                    ✓ {t('goalPlanner.blueprintGenerated', 'Cross-Departmental Blueprint Generated')}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {goalInput.toLowerCase().includes('vadodara') || goalInput.toLowerCase().includes('business') ? t('goalPlanner.businessVadodara', 'Start Commercial Food Business in Vadodara') :
                   goalInput.toLowerCase().includes('australia') || goalInput.toLowerCase().includes('masters') ? t('goalPlanner.studyAbroadAustralia', 'Higher Education & Masters in Australia') :
                   goalInput.toLowerCase().includes('scholarship') ? t('goalPlanner.scholarshipScheme', 'Post-Matric Scholarship Scheme Application') :
                   goalInput.toLowerCase().includes('farmer') || goalInput.toLowerCase().includes('kisan') ? t('goalPlanner.pmKisanBeneficiary', 'PM-KISAN Beneficiary Registration & Land Linking') :
                   goalInput}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {t('goalPlanner.automatedDagDesc', 'Automated regulatory DAG will sequence identity verification, statutory departmental NOCs, and direct DBT seeding.')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleStartActiveJourney()}
                className="bg-[#0B2545] hover:bg-[#133E87] dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-bold px-5 py-3 rounded-xl text-xs shadow-md flex items-center gap-2 transition transform hover:scale-[1.02] cursor-pointer self-start sm:self-center shrink-0"
              >
                <span>{t('goalPlanner.startWithThisJourney', '▶ Start with this Journey →')}</span>
              </button>
            </div>

            {/* Stages Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">{t('workflow.stage1', 'Stage 1: Identity')}</span>
                <p className="font-bold text-slate-900 dark:text-white text-xs">{t('workflow.aadhaarEkyc', 'Aadhaar e-KYC Verification')}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>✓ {t('workflow.matchVerified', '100% Match Verified')}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-blue-300 dark:border-blue-800/80 space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-bold text-[#133E87] dark:text-blue-400 uppercase tracking-wider block">{t('workflow.stage2', 'Stage 2: Credentials')}</span>
                <p className="font-bold text-slate-900 dark:text-white text-xs">
                  {goalInput.toLowerCase().includes('vadodara') || goalInput.toLowerCase().includes('business') ? t('workflow.fssaiTradeNoc', 'FSSAI License & Trade NOC') :
                   goalInput.toLowerCase().includes('australia') || goalInput.toLowerCase().includes('masters') ? t('workflow.passportAcademic', 'Passport & Academic ABC') :
                   goalInput.toLowerCase().includes('scholarship') ? t('workflow.incomeCasteCert', 'Income & Caste Certificate') :
                   t('workflow.landKhasraRegistry', 'Land Khasra & Farmer Registry')}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                  <span>● {t('workflow.readyIngestion', 'Ready for Ingestion')}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{t('workflow.stage3', 'Stage 3: Approval')}</span>
                <p className="font-bold text-slate-900 dark:text-white text-xs">{t('workflow.deptScrutiny', 'Department Nodal Scrutiny')}</p>
                <p className="text-[10px] text-slate-400">{t('workflow.slaTime', 'Automated SLA: 24-48 Hours')}</p>
              </div>

              <div className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{t('workflow.stage4', 'Stage 4: Execution')}</span>
                <p className="font-bold text-slate-900 dark:text-white text-xs">{t('workflow.directBenefitOrder', 'Direct Benefit / License')}</p>
                <p className="text-[10px] text-slate-400">{t('workflow.sanctionOrder', 'Final Digital Sanction Order')}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cinematic Progressive Processing Screen */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-8 max-w-md w-full space-y-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#133E87] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t('goalPlanner.analyzingGoal')}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">{t('goalPlanner.verifyingRequirements')}</p>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 1 ? 'text-[#133E87] dark:text-blue-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 1 ? '✓' : '○'} {t("goalPlanner.understandingRequest")}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">{t("common.done")}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 2 ? 'text-[#133E87] dark:text-blue-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 2 ? '✓' : '○'} {t('goalPlanner.identifyingLocation')}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">{t("common.done")}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 3 ? 'text-[#133E87] dark:text-blue-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 3 ? '✓' : '○'} {t('goalPlanner.findingServices')}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">{t('common.done')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 4 ? 'text-[#133E87] dark:text-blue-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 4 ? '✓' : '○'} {t('goalPlanner.checkingEligibility')}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">{t('common.ready')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Progress Indicator */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6 max-w-md w-full space-y-5 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#133E87] dark:text-blue-400 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t('goalPlanner.buildingJourney')}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">{t('goalPlanner.realTimeAnalysis')}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 1 ? 'text-[#133E87] dark:text-blue-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 1 ? '✓' : '○'} {t('goalPlanner.understandingRequest')}
                </span>
                <span className="text-slate-500">{t('common.done')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 2 ? 'text-[#133E87] dark:text-blue-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 2 ? '✓' : '○'} {t('goalPlanner.identifyingLocation')}
                </span>
                <span className="text-slate-500">{t('common.done')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 3 ? 'text-[#133E87] dark:text-blue-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 3 ? '✓' : '○'} {t('goalPlanner.findingServices')}
                </span>
                <span className="text-slate-500">{t('common.done')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 4 ? 'text-[#133E87] dark:text-blue-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 4 ? '✓' : '○'} {t('goalPlanner.checkingEligibility')}
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
      {/* 01 - YOUR JOURNEY */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-[#133E87] dark:text-blue-400 font-mono">01</span>
          <div className="border-l border-slate-800 pl-3">
            <h2 className="text-base font-bold text-white uppercase tracking-wider">YOUR JOURNEY</h2>
            <p className="text-xs text-slate-400">Your active government tasks</p>
          </div>
        </div>

        {mockJourneys.length === 0 ? (
          <div className="bg-slate-905 border border-slate-800/80 rounded-md p-6 text-center text-slate-500 text-xs">
            No active journeys yet. Enter your goal above (e.g. "I want to start a business in Pune") to build your first personalized government journey.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockJourneys.map((j) => (
              <div
                key={j.id}
                onClick={() => router.push(`/journeys/${j.id || 'journey_biz_vadodara_1'}`)}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 rounded-md p-5 cursor-pointer transition space-y-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-400 flex items-center justify-center font-bold text-xs">
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

      {/* 02 - DOCUMENTS */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-[#133E87] dark:text-blue-400 font-mono">02</span>
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

      {/* 03 - APPLICATIONS */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-[#133E87] dark:text-blue-400 font-mono">03</span>
          <div className="border-l border-slate-800 pl-3">
            <h2 className="text-base font-bold text-white uppercase tracking-wider">{t("navigation.applications")}</h2>
            <p className="text-xs text-slate-400">{t("applications.trackApplications")}</p>
          </div>
        </div>

        {mockApplications.length === 0 ? (
          <div className="bg-slate-905 border border-slate-800/80 rounded-md p-6 text-center text-slate-500 text-xs">
            {t("applications.noApplications")} {t("applications.useGoalPlanner")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockApplications.slice(0, 2).map((app) => {
              const targetJourneyId = app.id === 'app_dl_001' ? 'jrn_003' : app.id === 'app_sch_002' ? 'jrn_002' : 'jrn_001';
              return (
                <div 
                  key={app.id} 
                  onClick={() => router.push(`/journeys/${targetJourneyId}`)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#133E87] dark:hover:border-blue-500 rounded-xl p-5 space-y-4 cursor-pointer transition shadow-2xs hover:shadow-md border-l-4 border-l-[#133E87] dark:border-l-blue-500 group"
                >
                  <div className="flex justify-between items-start gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs">
                    <div>
                      <span className="text-[9px] font-black text-slate-500 tracking-wider block uppercase">{app.department}</span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 group-hover:text-[#133E87] dark:group-hover:text-blue-400 transition-colors">{app.title}</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">ID: <span className="text-[#133E87] dark:text-blue-400 font-bold">{app.id}</span></p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider text-center shrink-0 ${
                      ['APPROVED', 'COMPLETED'].includes(app.status) ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' :
                      app.status === 'ACTION_REQUIRED' ? 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20 animate-pulse' :
                      ['SUBMITTED', 'VERIFICATION'].includes(app.status) ? 'bg-blue-50 text-[#133E87] dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200 dark:border-cyan-500/20' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {app.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span>Submitted: {app.submittedDate}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/journeys/${targetJourneyId}`);
                      }}
                      className="text-[#133E87] dark:text-amber-400 font-bold flex items-center gap-1.5 hover:underline cursor-pointer group-hover:text-[#133E87] dark:group-hover:text-amber-300"
                    >
                      <span>{t("journeys.trackWorkflow")}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 04 - GOVERNMENT SUPPORT */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-[#133E87] dark:text-blue-400 font-mono">04</span>
          <div className="border-l border-slate-800 pl-3">
            <h2 className="text-base font-bold text-white uppercase tracking-wider">GOVERNMENT SUPPORT</h2>
            <p className="text-xs text-slate-400">Relevant support available to you</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Verified Schemes & Benefits</span>
                <span className="text-xs font-normal text-slate-400">({schemes.length} Available)</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">
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
                  <div className="flex items-center gap-2 text-xs font-bold text-[#133E87] dark:text-blue-400 uppercase tracking-wider">
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
        <ApplicationTracker 
          customApplications={mockApplications.map(a => ({
            id: a.id,
            title: a.title,
            department: a.department,
            status: (a.status === 'VERIFICATION' ? 'UNDER_VERIFICATION' : a.status as any),
            submittedDate: a.submittedDate,
            disbursementBank: 'State Bank of India (•••• •••• 4421)',
            sanctionReference: `SANCTION/2026/BEN-${a.id.replace(/\D/g, '').slice(-4) || '8801'}`,
            officerRemarks: 'Demographic and eligibility credentials successfully validated across state node.',
            timeline: a.timeline as any
          }))}
        />
      )}

      {/* Consent Tab */}
      {activeTab === 'consent' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Consent stats bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">{t("consent.activeConsentsLabel")}</span>
              <span className="text-lg font-black text-emerald-400">{mockConsents.filter(c => c.status === 'ACTIVE').length}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">{t("consent.pendingRequests")}</span>
              <span className="text-lg font-black text-amber-400">{mockConsents.filter(c => c.status === 'PENDING').length}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">{t("consent.revokedAccounts")}</span>
              <span className="text-lg font-black text-slate-500">{mockConsents.filter(c => c.status === 'REVOKED').length}</span>
            </div>
          </div>

            <ConsentLedger 
              consents={mockConsents} 
              onRevoke={(id) => revokeConsentAPI(id).then(() => loadInteropData())} 
            />

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
                  <p>{t("dataQuality.noAuditEvents")}</p>
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
                    <span>{t("consent.consentDetails")}</span>
                  </h3>
                  <button 
                    onClick={() => setSelectedConsent(null)}
                    className="text-slate-400 hover:text-white text-xs bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg transition"
                  >
                    {t("common.close")}
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
        <GovInteropHub />
      )}

      {/* Data Quality Tab */}
      {activeTab === 'conflicts' && (
        <CheckMyInformation />
      )}

      {activeTab === 'journeys' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#133E87] dark:text-blue-400" />
                <span>{t("journeys.yourWorkflows")}</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t("journeys.monitorStatus")}
              </p>
            </div>
            
            {liveJourneys.length === 0 && realJourneys.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-8 rounded-lg text-center space-y-4 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-slate-700 flex items-center justify-center mx-auto text-[#133E87] dark:text-blue-400">
                  <MapPin className="w-6 h-6 text-[#133E87] dark:text-blue-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">No active journeys found</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Analyze a citizen goal to automatically generate a step-by-step journey.</p>
                </div>
                <button
                  onClick={() => setActiveTab('planner')}
                  className="px-4 py-2 rounded bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                >
                  Go to Goal Planner
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {liveJourneys.map((j) => {
                  const journeyUrl = `/journeys/${j.id}`;
                  return (
                    <div 
                      key={j.id} 
                      role="link"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') router.push(journeyUrl); }}
                      onClick={() => router.push(journeyUrl)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs hover:shadow-md border-l-4 border-l-[#133E87] dark:border-l-blue-500 transition hover:border-[#133E87] dark:hover:border-blue-500 group cursor-pointer select-none"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#133E87] dark:text-blue-300 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                              {j.category}
                            </span>
                            <span className="text-xs text-slate-500 font-mono font-medium">Progress: {j.progress}%</span>
                            <span className="text-[10px] text-slate-400 font-mono">({j.location || 'India'})</span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#133E87] dark:group-hover:text-blue-400 transition-colors">{j.title}</h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Current Stage: <strong className="text-[#133E87] dark:text-blue-400">{j.currentStage}</strong></p>
                          <p className="text-[11px] text-slate-500">Next Action: {j.nextAction}</p>
                        </div>
                        <div
                          className="bg-[#0B2545] group-hover:bg-[#133E87] dark:bg-blue-600 dark:group-hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs self-start sm:self-center shrink-0"
                        >
                          <span>{t("journeys.trackWorkflow")}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-amber-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-6 animate-fadeIn">
          {uploadingFile && (
            <div className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-md p-4 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-900 dark:text-slate-200">
                <span>Uploading {uploadingFile}...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#133E87] dark:bg-blue-500 h-full transition-all duration-100" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="text-[10px] text-slate-500">Running OCR extraction and hashing cross-document consistency...</p>
            </div>
          )}
          <DocumentVault 
            documents={[
              ...realDocuments.map(d => ({
                id: d.id,
                document_type: d.document_type || d.type,
                document_name: d.document_name || d.name,
                file_name: d.file_name || d.name,
                file_size: d.file_size || 100,
                status: 'COMPLETED',
                verification_status: d.verification_status || d.status || 'VERIFIED',
                is_synthetic: false,
                issued_by: d.issued_by || d.source || 'Verified Source'
              })),
              ...mockDocs.map(d => ({
                id: d.id,
                document_type: d.type,
                document_name: d.name,
                file_name: d.name,
                file_size: 100,
                status: 'COMPLETED',
                verification_status: d.status,
                is_synthetic: d.isDemo,
                issued_by: d.source
              }))
            ] as any} 
            goalCategory={journeyAnalysis?.intent?.primary === 'STUDY_ABROAD' ? 'education' : 'business'}
            consistencyStatus={
              mockDocs.length > 0 ? {
                overall_status: 'CONSISTENT',
                identity_status: 'MATCHED',
                dob_status: 'MATCHED',
                discrepancies: []
              } : undefined
            }
            onRemove={removeDocument}
            onUpload={(file) => {
              setUploadingFile(file ? file.name : 'rent_agreement_signed.pdf');
              setUploadProgress(0);
              let progress = 0;
              const timer = setInterval(() => {
                progress += 20;
                setUploadProgress(progress);
                if (progress >= 100) {
                  clearInterval(timer);
                  if (file) {
                    addDocument({
                      id: `doc_${Date.now()}`,
                      name: file.name,
                      type: file.type || 'application/pdf',
                      status: 'AVAILABLE',
                      uploadDate: new Date().toLocaleDateString('en-GB'),
                      fileType: file.type.includes('pdf') ? 'PDF' : file.type.includes('image') ? 'JPG' : 'DOC',
                      pageCount: 1,
                      source: 'Self Uploaded',
                      isDemo: true,
                      fileObject: file
                    });
                  }
                  setTimeout(() => setUploadingFile(null), 500);
                }
              }, 200);
            }}
          />
        </div>
      )}

      {activeTab === 'alerts' && (
        <AlertsEvents />
      )}

      {activeTab === 'official' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Stats Panel */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md p-4 space-y-0.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Beneficiaries</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">148,204 Citizens</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md p-4 space-y-0.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Approvals Rate</span>
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">94.2% Success</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md p-4 space-y-0.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">SLA Compliance</span>
              <span className="text-lg font-black text-[#133E87] dark:text-blue-400">{metrics?.sla_compliance_rate || '97.4'}% Target</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md p-4 space-y-0.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Failed Transactions</span>
              <span className="text-lg font-black text-red-600 dark:text-red-400 animate-pulse">{metrics?.failed_transactions_count || '8'} Events</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* System Health Telemetry */}
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md p-6 shadow-sm lg:col-span-1 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Telemetry Health Monitoring</span>
                </h2>
                <p className="text-[10px] text-slate-500">Live API response latency and connector uptime telemetry.</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
                  <span className="text-slate-600 dark:text-slate-400">Core Gateway Latency</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{metrics?.latency_average_ms || 118}ms</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
                  <span className="text-slate-600 dark:text-slate-400">Orchestrator Uptime</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">{metrics?.uptime_percentage || 99.98}%</span>
                </div>

                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">State Nodes Response Uptime</span>
                  {metrics?.departments?.map((dept: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-600 dark:text-slate-400">{dept.name}</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{dept.uptime}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Connector Registries Topology */}
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md p-6 shadow-sm lg:col-span-2 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#133E87] dark:text-blue-400" />
                  <span>GovTech Connector Registry & Protocols</span>
                </h2>
                <p className="text-[10px] text-slate-500">Connected middleware state adapters, caching nodes, and legacy protocols.</p>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 text-[10px] uppercase font-bold">
                      <th className="pb-2">Registry Endpoint</th>
                      <th className="pb-2">Protocol</th>
                      <th className="pb-2 text-center">Status</th>
                      <th className="pb-2 text-right">Simulation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-bold text-slate-900 dark:text-slate-200">DigiLocker Sandbox Endpoint</td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400 font-mono">REST JSON API (Oauth2)</td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded text-[9px] font-bold">HEALTHY</span>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="text-slate-500 text-[10px]">Authoritative Node</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-bold text-slate-900 dark:text-slate-200">Pune Municipal Corp (PMC)</td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400 font-mono">SOAP 1.1 XML (Envelope)</td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          healthData?.services?.find((s: any) => s.service_id === 'srv_pmc_license')?.health_status === 'Failed' 
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 animate-pulse'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
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
                          className="bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 text-[#133E87] dark:text-blue-300 border border-blue-200 dark:border-slate-700 font-bold px-2 py-1 rounded text-[9px] transition cursor-pointer"
                        >
                          Toggle Outage
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-bold text-slate-900 dark:text-slate-200">BBMP Bangalore Municipal Node</td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400 font-mono">SOAP 1.2 XML (RPC)</td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded text-[9px] font-bold">HEALTHY</span>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="text-slate-500 text-[10px]">N/A</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-bold text-slate-900 dark:text-slate-200">GSTN Central Taxes Registry</td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400 font-mono">REST JSON (OAuth2)</td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded text-[9px] font-bold">HEALTHY</span>
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

      {/* Floating AI Assistant Navigator Trigger */}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsAiDrawerOpen(true)}
          className="group px-4 py-2.5 rounded-full bg-[#133E87] hover:bg-[#0B2545] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs shadow-2xl hover:shadow-blue-500/30 flex items-center gap-2.5 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 border border-white/20 dark:border-blue-400/30"
          aria-label="Ask JanSetu AI Navigator"
        >
          <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          </div>
          <span className="tracking-wide">Ask JanSetu AI Navigator</span>
        </button>
      </div>

      {/* AI Help Drawer */}
      {isAiDrawerOpen && (
        <AiHelpDrawer
          onClose={() => setIsAiDrawerOpen(false)}
          onOpenSource={(src) => {
            alert(`Official Source: ${src.title}\nAuthority: ${src.authority}\nReference URL: ${src.url || 'National Portal'}`);
          }}
        />
      )}

      {/* Department e-KYC Pending Request Banner / Drawer */}
      <PendingRequestBanner />

    </div>
  );
}
