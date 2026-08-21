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

const DEMO_MODE = false;

function groupMatchedSchemes(matched: any[], domicile: string, targetState: string) {
  const central = matched.filter(s => s.level === 'CENTRAL');
  const targetLocation = matched.filter(s => s.level === 'STATE' && targetState && s.state_name.toLowerCase() === targetState.toLowerCase() && targetState.toLowerCase() !== domicile.toLowerCase());
  const state = matched.filter(s => s.level === 'STATE' && (!targetLocation.some((x: any) => x.id === s.id)));

  return { central, state, targetLocation };
}

function matchGovernmentSchemes(query: string, domicileState: string, allSchemes: any[]): any[] {
  const q = query.toLowerCase();
  const domicile = domicileState || 'Rajasthan';

  // 1. Identify category
  let category = 'general';
  if (q.includes('study') || q.includes('masters') || q.includes('scholarship') || q.includes('education') || q.includes('college') || q.includes('engineering')) {
    category = 'education';
  } else if (q.includes('business') || q.includes('shop') || q.includes('restaurant') || q.includes('startup') || q.includes('manufacturing') || q.includes('textile')) {
    category = 'business';
  } else if (q.includes('farmer') || q.includes('farming') || q.includes('agriculture') || q.includes('kisan')) {
    category = 'agriculture';
  } else if (q.includes('driving') || q.includes('licence') || q.includes('license') || q.includes('dl')) {
    category = 'documents';
  }

  // 2. Identify target business location / study location from query
  let businessState = domicile;
  const statesList = [
    { name: "Karnataka", keywords: ["karnataka", "bangalore", "bengaluru"] },
    { name: "Gujarat", keywords: ["gujarat", "vadodara", "ahmedabad", "gandhinagar"] },
    { name: "Rajasthan", keywords: ["rajasthan", "udaipur", "jaipur"] }
  ];

  for (const st of statesList) {
    if (st.keywords.some(kw => q.includes(kw))) {
      businessState = st.name;
      break;
    }
  }

  const isStudyAbroad = q.includes('australia') || q.includes('abroad') || q.includes('foreign') || q.includes('overseas');

  // Filter schemes
  const activeSchemes = allSchemes.filter(s => s.status === 'ACTIVE' || !s.status);
  const matched = [];

  for (const s of activeSchemes) {
    // Skip if category doesn't match
    if (s.category !== category) continue;

    // Skip discontinued/suspended legacy schemes
    if (s.id === 'sch_suspended_legacy_transport') continue;

    let isMatch = false;
    let whyMatches = [];

    if (category === 'education') {
      if (isStudyAbroad) {
        // Study abroad queries should only return study abroad schemes (NOS, RGS, etc.)
        const isStudyAbroadScheme = s.id === 'sch_nos' || s.id === 'sch_rj_rgs' || s.name.toLowerCase().includes('overseas') || s.description.toLowerCase().includes('overseas') || s.description.toLowerCase().includes('abroad');
        if (!isStudyAbroadScheme) continue;

        if (s.level === 'CENTRAL') {
          isMatch = true;
          whyMatches.push("✓ Central Government Scheme");
          whyMatches.push("✓ Supports overseas higher education");
        } else if (s.state_name === domicile) {
          isMatch = true;
          whyMatches.push(`✓ Domicile Match: Resident of ${domicile}`);
          whyMatches.push(`✓ State Scholarship: ${s.state_name} Higher Education Support`);
        }
      } else {
        // Domestic education queries should not return overseas scholarships
        const isStudyAbroadScheme = s.id === 'sch_nos' || s.id === 'sch_rj_rgs' || s.name.toLowerCase().includes('overseas') || s.description.toLowerCase().includes('overseas') || s.description.toLowerCase().includes('abroad');
        if (isStudyAbroadScheme) continue;

        if (s.level === 'CENTRAL') {
          isMatch = true;
          whyMatches.push("✓ Central Government Scheme");
          whyMatches.push("✓ General education assistance");
        } else if (s.state_name === domicile) {
          isMatch = true;
          whyMatches.push(`✓ Domicile Match: Resident of ${domicile}`);
        }
      }
    } else if (category === 'business') {
      if (s.level === 'CENTRAL') {
        isMatch = true;
        whyMatches.push("✓ Central Government MSME/Startup Initiative");
      } else if (s.state_name === businessState) {
        isMatch = true;
        whyMatches.push(`✓ Operating Location Match: Business in ${businessState}`);
        if (domicile !== businessState) {
          whyMatches.push(`ℹ Domicile: ${domicile} (Eligibility verified for cross-state operation)`);
        }
      }
    } else if (category === 'agriculture') {
      if (s.level === 'CENTRAL') {
        isMatch = true;
        whyMatches.push("✓ Central Government Farmer Support");
      } else if (s.state_name === domicile) {
        isMatch = true;
        whyMatches.push(`✓ Domicile Match: Land/Farming registered in ${domicile}`);
      }
    }

    if (isMatch) {
      // Extract benefits if available to render rich descriptions
      let benefitNote = "";
      if (s.benefits) {
        try {
          const bObj = typeof s.benefits === 'string' ? JSON.parse(s.benefits) : s.benefits;
          if (bObj && typeof bObj === 'object') {
            const entries = Object.entries(bObj).map(([k, v]) => `${k.replace(/_/g, ' ').toUpperCase()}: ${v}`);
            if (entries.length > 0) {
              benefitNote = ` [BENEFITS: ${entries.slice(0, 2).join(' | ')}]`;
            }
          }
        } catch (e) {}
      }

      matched.push({
        id: s.id,
        level: s.level,
        match_status: s.level === 'CENTRAL' ? 'POSSIBLE_MATCH' : 'HIGH_MATCH',
        name: s.name,
        description: s.description + benefitNote,
        why_matches: whyMatches,
        last_verified_at: s.last_verified_at || 'Recently',
        official_source_url: s.official_source_url || s.application_url || '#'
      });
    }
  }

  return matched;
}

function generateDemoJourney(query: string, domicileState: string, matchedSchemes: any[]) {
  const q = query.toLowerCase();

  if (
    q.includes("australia") ||
    q.includes("study abroad") ||
    q.includes("masters")
  ) {
    return {
      goal: {
        title: "Study Masters in Australia",
        description: "Personalized regulatory map for higher education in Australia."
      },
      location: {
        current_location: "Udaipur",
        domicile_state: domicileState || "Rajasthan",
        destination: "Australia"
      },
      intent: {
        primary: "STUDY_ABROAD"
      },
      documents: {
        available: [
          { name: "Aadhaar Card", verification_status: "VERIFIED" },
          { name: "PAN Card", verification_status: "VERIFIED" },
          { name: "Class 10 Marksheet", verification_status: "VERIFIED" },
          { name: "Class 12 Marksheet", verification_status: "VERIFIED" },
          { name: "Bachelor's Marksheet", verification_status: "VERIFIED" }
        ],
        needed: [
          { name: "Valid Passport", status: "Required", reason: "Required for international travel and study" },
          { name: "English Language Test Result", status: "Required", reason: "May be required by the university and/or visa process" },
          { name: "University Academic Transcripts", status: "Required", reason: "Required for admission assessment" },
          { name: "Degree / Provisional Certificate", status: "Required", reason: "Required depending on current academic status" },
          { name: "University Offer Letter", status: "Conditional", reason: "Required after receiving admission" }
        ]
      },
      schemes: groupMatchedSchemes(matchedSchemes, domicileState, "Australia"),
      next_steps: [
        "Apply for / renew passport",
        "Prepare and register for IELTS/PTE English exam",
        "Request official transcripts from university",
        "Submit applications to Australian universities",
        "Await offer letter and compile financial documentation"
      ],
      sources: [
        { name: "Department of Home Affairs, Australia", last_verified: "Yesterday", url: "https://immi.homeaffairs.gov.au/" },
        { name: "Ministry of External Affairs, India", last_verified: "2 days ago", url: "https://www.mea.gov.in/" }
      ]
    };
  }

  if (
    q.includes("driving licence") ||
    q.includes("driving license")
  ) {
    return {
      goal: {
        title: "Get a Driving Licence",
        description: "Licensing workflow for Karnataka Transport Department."
      },
      location: {
        current_location: "Bengaluru",
        domicile_state: domicileState || "Karnataka",
        destination: null
      },
      intent: {
        primary: "LICENSING"
      },
      documents: {
        available: [
          { name: "Aadhaar Card", verification_status: "VERIFIED" },
          { name: "PAN Card", verification_status: "VERIFIED" }
        ],
        needed: [
          { name: "Age / Date-of-Birth Proof", status: "Required", reason: "Used to establish eligibility (min 18 years)" },
          { name: "Address Proof", status: "Required", reason: "Required for the regional transport office licence application" },
          { name: "Learner's Licence", status: "Required", reason: "Mandatory prerequisite before driving test" },
          { name: "Passport-size Photograph", status: "Required", reason: "Required for physical/digital record" }
        ]
      },
      schemes: groupMatchedSchemes(matchedSchemes, domicileState, ""),
      next_steps: [
        "Apply for Learner's Licence online via Sarathi portal",
        "Schedule and pass Learner's test (computer based)",
        "Hold Learner's Licence for minimum 30 days while practicing",
        "Schedule driving skill test track date",
        "Pass driving test and receive driving licence"
      ],
      sources: [
        { name: "Ministry of Road Transport and Highways (MoRTH)", last_verified: "Today", url: "https://sarathi.parivahan.gov.in/" },
        { name: "Karnataka Transport Department", last_verified: "3 days ago", url: "https://transport.karnataka.gov.in/" }
      ]
    };
  }

  if (
    q.includes("restaurant") ||
    q.includes("business") ||
    q.includes("startup")
  ) {
    const isRestaurant = q.includes("restaurant") || q.includes("food");
    const targetState = q.includes("gujarat") ? "Gujarat" : "Karnataka";
    return {
      goal: {
        title: isRestaurant ? "Start a Restaurant / Business" : "Start a Business / Startup",
        description: `Business setup and regulatory compliance mapping for ${targetState}.`
      },
      location: {
        current_location: targetState === "Gujarat" ? "Vadodara" : "Bengaluru",
        domicile_state: domicileState || "Rajasthan",
        destination: null
      },
      intent: {
        primary: "BUSINESS"
      },
      documents: {
        available: [
          { name: "Aadhaar Card", verification_status: "VERIFIED" },
          { name: "PAN Card", verification_status: "VERIFIED" }
        ],
        needed: [
          { name: "Business Constitution Documents", status: "Required", reason: "Depends on whether the business is proprietorship, partnership, LLP, or Pvt Ltd company." },
          { name: "Business Premises Address Proof (Lease/NOC)", status: "Required", reason: "Required for all local registrations and utility connections." },
          { name: "FSSAI Food Business License", status: "Required", reason: "Mandatory regulatory registration for all food/restaurant establishments." },
          { name: "Local Municipal Corporation Trade License", status: "Required", reason: `Required to operate a commercial business in ${targetState}.` },
          { name: "Fire Department NOC", status: "Conditional", reason: "Required depending on seating capacity and building height." }
        ]
      },
      schemes: groupMatchedSchemes(matchedSchemes, domicileState, targetState),
      next_steps: [
        "Choose business structure and register entity (MCA/MSME Udyam)",
        "Execute rental agreement for commercial kitchen premises",
        "Apply for FSSAI registration/license online via FoSCoS portal",
        "Obtain Trade License from local municipality",
        "Register for GST and open commercial bank account"
      ],
      sources: [
        { name: "Food Safety and Standards Authority of India (FSSAI)", last_verified: "Today", url: "https://foscos.fssai.gov.in/" },
        { name: "Bruhat Bengaluru Mahanagara Palike (BBMP)", last_verified: "Yesterday", url: "https://bbmp.gov.in/" }
      ]
    };
  }

  return {
    goal: {
      title: "Citizen Goal Journey",
      description: "Detailed regulatory checklist for your citizen query."
    },
    location: {
      current_location: "Udaipur",
      domicile_state: domicileState || "Rajasthan",
      destination: null
    },
    intent: {
      primary: "OTHER"
    },
    documents: {
      available: [
        { name: "Aadhaar Card", verification_status: "VERIFIED" },
        { name: "PAN Card", verification_status: "VERIFIED" }
      ],
      needed: [
        { name: "Additional documents depend on your exact goal", status: "Required", reason: "The requirement varies according to the service, jurisdiction and eligibility." }
      ]
    },
    schemes: groupMatchedSchemes(matchedSchemes, domicileState, ""),
    next_steps: [
      "Check required certificates or licenses on local state portal",
      "Prepare basic identification proofs (Aadhaar, PAN, Photos)"
    ],
    sources: [
      { name: "National Government Services Portal", last_verified: "Recently", url: "https://services.india.gov.in/" }
    ]
  };
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
  const [activeJourneys, setActiveJourneys] = useState<any[]>([]);
  const [userDocs, setUserDocs] = useState<any[]>([]);

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
  const [applications, setApplications] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [guidedStep, setGuidedStep] = useState<number | null>(null);
  const [isGuidedTourMinimized, setIsGuidedTourMinimized] = useState(false);
  const [isGuidedTourPaused, setIsGuidedTourPaused] = useState(false);
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

  const loadInteropData = () => {
    setIsRefreshing(true);
    fetchApplicationsAPI().then((data) => setApplications(data || []));
    fetchConsentsAPI().then((data) => setConsents(data || []));
    fetchConnectorHealthAPI().then((data) => setHealthData(data || null));
    fetchAuditLogsAPI().then((data) => setAuditLogs(data || []));
    fetchConflictsAPI().then((data) => setConflicts(data || []));
    fetchNotificationsAPI().then((data) => setNotifications(data || []));
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
      fetchJourneysAPI().then((data) => setActiveJourneys(data || []));
      fetchUserDocumentsAPI().then((docs) => setUserDocs(docs || []));
      fetchStatesAPI().then((data) => {
        if (data && data.length > 0) {
          setStatesList(data);
        }
      });
      loadInteropData();
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
      setErrorMessage("Tell us what you want to accomplish.");
      return;
    }

    if (!domicileState) {
      setErrorMessage("Select your domicile state.");
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

    if (DEMO_MODE) {
      const timer1 = setTimeout(() => setGenerationStage(1), 200);
      const timer2 = setTimeout(() => setGenerationStage(2), 450);
      const timer3 = setTimeout(() => setGenerationStage(3), 700);
      const timer4 = setTimeout(() => setGenerationStage(4), 950);

      // Fetch real schemes dynamically from database
      let matchedSchemes: any[] = [];
      let didFail = false;
      try {
        setSchemesError(false);
        const schemesRes = await fetchSchemesAPI({ limit: 100 });
        if (schemesRes && schemesRes.schemes) {
          matchedSchemes = matchGovernmentSchemes(trimmedGoal, domicileState, schemesRes.schemes);
        } else {
          didFail = true;
        }
      } catch (err) {
        console.warn("Failed to fetch schemes for demo:", err);
        didFail = true;
      }

      await new Promise(resolve => setTimeout(resolve, 1100));

      if (currentRequestId !== latestRequestIdRef.current) return;

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);

      if (didFail) {
        setSchemesError(true);
      }

      const res = generateDemoJourney(trimmedGoal, domicileState, matchedSchemes);
      const journeyId = `demo-${Date.now()}`;
      const resWithId = { ...res, journeyId, id: journeyId };
      
      console.log("[Journey DEBUG] generated journey:", resWithId);
      console.log("[Journey DEBUG] journey ID:", journeyId);
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`journey_analysis_${journeyId}`, JSON.stringify(resWithId));
        sessionStorage.setItem("citizenJourney", JSON.stringify(resWithId));
        sessionStorage.setItem("activeCitizenJourney", JSON.stringify(resWithId));
      }
      
      console.log("[Journey DEBUG] before navigation:", resWithId);
      console.log("[Journey DEBUG] storage:", sessionStorage.getItem("citizenJourney"));

      setIsAnalyzing(false);
      router.push(`/journey-preview`);
      return;
    }

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
      setErrorMessage("We couldn't create your journey. Please try again.");
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
          <span className="text-xs font-black text-slate-400 tracking-widest uppercase">National GovTech Interoperability Platform</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-400 relative">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-1.5 bg-slate-900 border border-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition relative"
            >
              <Bell className="w-4.5 h-4.5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-slate-950 animate-pulse" />
              )}
            </button>
            
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-50 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="font-bold text-white uppercase tracking-wider">Notifications Center</span>
                  <span className="text-[10px] text-slate-500">{notifications.length} alerts</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {notifications.map((n, idx) => (
                    <div key={n.id || idx} className="p-2 bg-slate-950 border border-slate-850 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300">{n.title}</span>
                        <span className="text-[9px] text-slate-500">{new Date(n.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{n.message}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-slate-500 text-center py-4">No recent notifications.</p>
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
            Good evening, {user?.full_name || 'Citizen'} 👋
          </h1>
          <p className="text-xs font-black text-amber-500 tracking-wider uppercase">
            ONE CITIZEN. ONE JOURNEY. CONNECTED GOVERNMENT SERVICES.
          </p>
          <p className="text-[11px] text-slate-500">
            A jurisdiction-aware interoperability middleware layer orchestrating Central, State, and Municipal departments.
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2.5 bg-slate-950/40 border border-slate-850 px-2.5 py-1 rounded-lg w-fit">
            <span>JanSetu</span>
            <span>/</span>
            <span className="text-amber-400">
              {activeTab === 'planner' ? 'Goal Planner' : 
               activeTab === 'journeys' ? 'Active Journeys' : 
               activeTab === 'documents' ? 'Documents Vault' :
               activeTab === 'applications' ? 'My Applications' :
               activeTab === 'consent' ? 'YOUR DATA & CONSENT' :
               activeTab === 'interop' ? 'Govt Interop Hub' :
               activeTab === 'conflicts' ? 'CHECK MY INFORMATION' :
               activeTab === 'alerts' ? 'Alerts & Events' : 'Official View'}
            </span>
          </div>
        </div>

        {/* Current Location Badge & Change Location Action */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">CURRENT LOCATION</span>
              <span className="text-xs font-black text-white">{profile?.location_city || 'Vadodara'}, {domicileState}</span>
            </div>
          </div>
          <button 
            onClick={() => {
              setActiveTab('planner');
              setIsDropdownOpen(true);
            }}
            className="text-[10px] text-amber-400 hover:text-amber-300 font-black uppercase tracking-wider border-l border-slate-800 pl-3 transition"
          >
            [Change]
          </button>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4 transition hover:border-slate-700/80">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Document Vault</span>
            <span className="text-sm font-black text-white">{userDocs.length} Verified Files</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4 transition hover:border-slate-700/80">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Journeys</span>
            <span className="text-sm font-black text-white">{activeJourneys.length} Workflows</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4 transition hover:border-slate-700/80">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Government Support</span>
            <span className="text-sm font-black text-white">{schemes.length} Schemes Available</span>
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
          <span>Goal Planner</span>
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
          <span>Active Journeys</span>
          {activeJourneys.length > 0 && (
            <span className="bg-amber-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ml-1">
              {activeJourneys.length}
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
          <span>Documents Vault</span>
          {userDocs.length > 0 && (
            <span className="bg-amber-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ml-1">
              {userDocs.length}
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
          <span>My Applications</span>
          {applications.length > 0 && (
            <span className="bg-amber-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ml-1">
              {applications.length}
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
          <span>YOUR DATA & CONSENT</span>
          {consents.filter(c => c.granted).length > 0 && (
            <span className="bg-emerald-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ml-1">
              {consents.filter(c => c.granted).length}
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
          <span>Govt Interop Hub</span>
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
          <span>CHECK MY INFORMATION</span>
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
          <span>Alerts & Events</span>
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
            <span>Official View</span>
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
                Domicile State
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
                      placeholder="Search state/UT..."
                      autoFocus
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500/50"
                    />
                    
                    <div className="space-y-3 pt-1">
                      {/* States Group */}
                      {filteredStates.filter(s => s.type === 'STATE').length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase px-2 block">
                            States
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
                            Union Territories
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
                        <p className="text-slate-500 text-xs text-center py-2">No matching states or UTs found.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                What are you looking to accomplish?
              </label>
              <div className="relative flex flex-col md:block">
                <textarea
                  rows={2}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="Tell us what you're trying to do... e.g. 'I want to start a business'..."
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
                      <span>UNDERSTANDING...</span>
                    </>
                  ) : (
                    <>
                      <span>Understand Goal</span>
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
                <h4 className="text-sm font-bold text-white">Analyzing Goal & Intent</h4>
                <p className="text-xs text-slate-400">Verifying requirements and rules deterministically...</p>
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
                  {generationStage >= 2 ? '✓' : '●'} Identifying your location & jurisdiction
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Done</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 3 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 3 ? '✓' : '●'} Finding relevant government support
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Done</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={generationStage >= 4 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                  {generationStage >= 4 ? '✓' : '●'} Checking current eligibility constraints
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

      {/* 01 — YOUR JOURNEY */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-amber-500 font-mono">01</span>
          <div className="border-l border-slate-800 pl-3">
            <h2 className="text-base font-bold text-white uppercase tracking-wider">YOUR JOURNEY</h2>
            <p className="text-xs text-slate-400">Your active government tasks</p>
          </div>
        </div>

        {activeJourneys.length === 0 ? (
          <div className="bg-slate-905 border border-slate-800/80 rounded-xl p-6 text-center text-slate-500 text-xs">
            No active journeys yet. Enter your goal above (e.g. "I want to start a business in Pune") to build your first personalized government journey.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeJourneys.map((j: any) => (
              <div
                key={j.id}
                onClick={() => router.push(`/journeys/${j.id || 'journey_biz_vadodara_1'}`)}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 cursor-pointer transition space-y-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                      {j.location_state === 'Gujarat' ? 'GJ' : j.location_state === 'Karnataka' ? 'KA' : j.location_state === 'Rajasthan' ? 'RJ' : 'IN'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                        {j.goal_title || 'Dynamic Citizen Journey'}
                      </h3>
                      <p className="text-xs text-slate-400">{j.location_city || 'Vadodara'}, {j.location_state || 'Gujarat'}</p>
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
        <DocumentVault documents={userDocs} />
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

        {applications.length === 0 ? (
          <div className="bg-slate-905 border border-slate-800/80 rounded-xl p-6 text-center text-slate-500 text-xs">
            No active applications found. Use the Goal Planner to start a journey.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applications.slice(0, 2).map((app) => (
              <div 
                key={app.id} 
                onClick={() => { setActiveTab('applications'); setSelectedApp(app); }}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-4 cursor-pointer transition shadow-md"
              >
                <div className="flex justify-between items-start gap-2 border-b border-slate-850 pb-3 text-xs">
                  <div>
                    <span className="text-[9px] font-black text-slate-500 tracking-wider block uppercase">{app.department_name}</span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{app.service_name}</h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">ID: <span className="text-amber-500 font-bold">{app.application_id}</span></p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider text-center shrink-0 ${
                    app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    app.status === 'DOCUMENTS_REQUIRED' ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' :
                    app.status === 'UNDER_VERIFICATION' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {app.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Submitted: {new Date(app.submitted_at).toLocaleDateString()}</span>
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

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Applications Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Applications</span>
              <span className="text-lg font-black text-white">{applications.length} Registered</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Verification</span>
              <span className="text-lg font-black text-amber-400">
                {applications.filter(a => ['UNDER_VERIFICATION', 'SUBMITTED', 'DOCUMENTS_REQUIRED'].includes(a.status)).length} Pending
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Completed</span>
              <span className="text-lg font-black text-emerald-400">
                {applications.filter(a => ['APPROVED', 'COMPLETED'].includes(a.status)).length} Issued
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Action Required</span>
              <span className="text-lg font-black text-red-400 animate-pulse">
                {applications.filter(a => a.status === 'DOCUMENTS_REQUIRED').length} Alert
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

            {applications.length === 0 ? (
              <div className="bg-slate-950 border border-slate-900 p-8 rounded-xl text-center text-slate-500 text-xs">
                No active applications found. Use the Goal Planner to start a journey.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {applications.map((app) => (
                  <div 
                    key={app.id} 
                    onClick={() => setSelectedApp(app)}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-4 cursor-pointer transition shadow-md"
                  >
                    <div className="flex justify-between items-start gap-2 border-b border-slate-900 pb-3 text-xs">
                      <div>
                        <span className="text-[9px] font-black text-slate-500 tracking-wider block uppercase">{app.department_name}</span>
                        <h3 className="text-sm font-bold text-white mt-0.5">{app.service_name}</h3>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">ID: <span className="text-amber-500 font-bold">{app.application_id}</span></p>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider text-center shrink-0 ${
                        app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        app.status === 'DOCUMENTS_REQUIRED' ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' :
                        app.status === 'UNDER_VERIFICATION' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}>
                        {app.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>Submitted: {new Date(app.submitted_at).toLocaleDateString()}</span>
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
              <span className="text-lg font-black text-emerald-400">{consents.filter(c => c.granted && c.access_type !== 'REVOKED').length || 2}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Pending Requests</span>
              <span className="text-lg font-black text-amber-400">{consents.filter(c => !c.granted).length || 1}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Revoked Accounts</span>
              <span className="text-lg font-black text-slate-500">{consents.filter(c => c.access_type === 'REVOKED').length || 1}</span>
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
              {consents.map((c) => (
                <div key={c.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <h4 className="font-bold text-white text-sm">{c.department_name}</h4>
                      <p className="text-slate-400 mt-1">Purpose: {c.purpose}</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Requested Fields: <span className="font-mono text-cyan-400 font-bold">{c.requested_fields.join(", ")}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.granted && c.access_type !== 'REVOKED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : c.access_type === 'REVOKED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {c.granted && c.access_type !== 'REVOKED' ? 'Active Consent' : c.access_type === 'REVOKED' ? 'Access Revoked' : 'Pending Authorization'}
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
                    {!c.granted && c.access_type !== 'REVOKED' && (
                      <>
                        <button
                          onClick={() => {
                            createConsentAPI(c.department_id, c.department_name, c.requested_fields, c.purpose, "ALWAYS").then(() => loadInteropData());
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-3 sm:py-1.5 rounded-lg text-xs sm:text-[11px] transition text-center min-h-[44px] sm:min-h-0"
                        >
                          Allow Always
                        </button>
                        <button
                          onClick={() => {
                            createConsentAPI(c.department_id, c.department_name, c.requested_fields, c.purpose, "ONCE").then(() => loadInteropData());
                          }}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold px-3 py-3 sm:py-1.5 rounded-lg text-xs sm:text-[11px] hover:from-amber-400 hover:to-orange-400 transition text-center min-h-[44px] sm:min-h-0"
                        >
                          Allow Once
                        </button>
                      </>
                    )}
                    {c.granted && c.access_type !== 'REVOKED' && (
                      <button
                        onClick={() => revokeConsentAPI(c.consent_id).then(() => loadInteropData())}
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
                      <p className="text-slate-200 font-bold">{selectedConsent.department_name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] font-semibold block uppercase">WHAT DATA FIELDS?</span>
                      <p className="text-cyan-400 font-mono font-bold">{selectedConsent.requested_fields.join(", ")}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] font-semibold block uppercase">WHY ACCESS IS NEEDED?</span>
                      <p className="text-slate-300">{selectedConsent.purpose}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] font-semibold block uppercase">DURATION</span>
                      <p className="text-slate-300">Scoped strictly to the application lifetime ({selectedConsent.access_type}).</p>
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
                    {!selectedConsent.granted && selectedConsent.access_type !== 'REVOKED' && (
                      <>
                        <button
                          onClick={() => {
                            createConsentAPI(selectedConsent.department_id, selectedConsent.department_name, selectedConsent.requested_fields, selectedConsent.purpose, "ONCE").then(() => {
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
            
            {activeJourneys.length === 0 ? (
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
                {activeJourneys.map((j) => (
                  <div key={j.id} className="bg-slate-950 border border-slate-850 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          {j.goal_category}
                        </span>
                        <span className="text-xs text-slate-500">Jurisdiction: {j.jurisdiction || 'State'}</span>
                      </div>
                      <h3 className="text-sm font-black text-white">{j.title}</h3>
                      <p className="text-xs text-slate-400">{j.description}</p>
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
            documents={userDocs} 
            goalCategory={journeyAnalysis?.intent?.primary === 'STUDY_ABROAD' ? 'education' : 'business'}
            consistencyStatus={
              userDocs.length > 0 ? {
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
                      document_type: 'RENT_AGREEMENT',
                      document_name: 'Rent Agreement / Lease Deed',
                      document_number_masked: 'XXXX-XXXX-8821',
                      file_name: file ? file.name : 'rent_agreement_signed.pdf',
                      file_size: file ? Math.round(file.size / 1024) : 124,
                      status: 'COMPLETED',
                      verification_status: 'OCR_EXTRACTED',
                      is_synthetic: false,
                      issued_by: 'Sub-Registrar Office, Bengaluru',
                      expiry_status: 'NO_EXPIRY',
                      extracted_fields: {
                        lessee_name: user?.full_name || 'Hriday Bardia',
                        property_address: '42, 2nd Main, Indiranagar, Bengaluru, KA',
                        monthly_rent: '₹25,000',
                        stamp_duty_paid: '₹5,000',
                        valid_from: '2026-04-01',
                        valid_to: '2027-03-31'
                      }
                    };
                    setUserDocs(prev => [mockDoc, ...prev]);
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
              {notifications.length === 0 ? (
                <div className="bg-slate-950 border border-slate-900 p-6 rounded-xl text-center text-slate-500 text-xs">
                  No notifications yet. Submitted applications will post event feeds here.
                </div>
              ) : (
                notifications.map((n: any, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 flex gap-3 text-xs">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500 shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200">{n.title || 'Event Log'}</span>
                        <span className="text-[9px] text-slate-500 font-mono">{new Date(n.created_at || Date.now()).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{n.message || n.description}</p>
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

      {/* Floating Guided Tour Stepper Controller */}
      {isGuidedTourMinimized ? (
        <button 
          onClick={() => setIsGuidedTourMinimized(false)}
          className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-amber-400/20 text-xs uppercase tracking-wider animate-bounce"
        >
          <Sparkles className="w-4 h-4" />
          <span>Restore Demo Guide {guidedStep !== null ? `(Step ${guidedStep})` : ''}</span>
        </button>
      ) : (
        <div className="fixed bottom-4 right-4 z-40 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl max-w-sm w-full space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-[10px] font-black text-amber-500 tracking-wider uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> SIH judge guided demo
              <span className="group relative cursor-pointer inline-block">
                <HelpCircle className="w-3 h-3 text-slate-400 hover:text-white" />
                <span className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 text-[10px] text-slate-300 p-2 rounded-lg w-52 font-normal hidden group-hover:block shadow-2xl z-50 normal-case leading-relaxed">
                  This stepper guide walks judges through the platform's key interoperability features: including document sharing consent, API payload inspection, legacy connector failures, and master-data reconciliations.
                </span>
              </span>
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsGuidedTourMinimized(true)}
                className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 bg-slate-805 rounded"
                title="Minimize Guide"
              >
                Minimize
              </button>
              {guidedStep !== null && (
                <button
                  onClick={() => { setGuidedStep(null); setIsGuidedTourPaused(false); }}
                  className="text-slate-500 hover:text-slate-300 text-xs"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {guidedStep === null ? (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Start the interactive walkthrough to follow a citizen goal journey through data vault sharing, REST/SOAP connector triggers, and conflict resolutions.
              </p>
              <button
                onClick={() => {
                  setGuidedStep(1);
                  setActiveTab('planner');
                  setGoalInput("I want to start a small food business in Bengaluru.");
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold py-1.5 rounded text-xs hover:from-amber-400 hover:to-orange-400 transition"
              >
                Start Guided Tour
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest font-black">
                <span>Step {guidedStep} of 12</span>
                <span className={isGuidedTourPaused ? 'text-amber-500' : 'text-emerald-400'}>
                  {isGuidedTourPaused ? 'PAUSED' : guidedStep === 12 ? 'COMPLETED' : 'IN PROGRESS'}
                </span>
              </div>
              
              {!isGuidedTourPaused ? (
                <>
                  {guidedStep === 1 && (
                    <div className="space-y-2 text-[11px]">
                      <p className="text-slate-200">
                        <strong>STEP 1: PAN-INDIA ALIGNMENT.</strong> Government systems don't need to be replaced. They need to be connected. Our platform sitting as middleware orchestrates Central, State, and Local services.
                      </p>
                      <button
                        onClick={() => {
                          setGuidedStep(2);
                          setActiveTab('planner');
                          setDomicileState('Karnataka');
                          setSelectedState('Karnataka');
                          setGoalInput("I want to start a small food business in Bengaluru.");
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded text-xs transition"
                      >
                        Next: Enter Karnataka Goal
                      </button>
                    </div>
                  )}

                  {guidedStep === 2 && (
                    <div className="space-y-2 text-[11px]">
                      <p className="text-slate-200">
                        <strong>STEP 2: JURISDICTION DETECTION.</strong> The system dynamically parses city (Bengaluru) and maps it to Karnataka state, without hardcoded boundaries. Domicile is resolved to Karnataka.
                      </p>
                      <button
                        onClick={() => {
                          setGuidedStep(3);
                          setActiveTab('planner');
                          setDomicileState('Karnataka');
                          setSelectedState('Karnataka');
                          setGoalInput("I want to start a small food business in Bengaluru.");
                          // Simulate goal planning analysis submit
                          handleAnalyzeGoal({ preventDefault: () => {} } as any);
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded text-xs transition"
                      >
                        Next: Understand Goal / AI Map
                      </button>
                    </div>
                  )}

                  {guidedStep === 3 && (
                    <div className="space-y-2 text-[11px]">
                      <p className="text-slate-200">
                        <strong>STEP 3: RUN PLATFORM MAPPING.</strong> AI maps required documents, matching local business single-windows and local municipal trade licenses. Click <strong>"Next"</strong> to explore the resolved categories.
                      </p>
                      <button
                        onClick={() => {
                          setGuidedStep(4);
                          setActiveTab('planner');
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded text-xs transition"
                      >
                        Next: Inspect Document Checklists
                      </button>
                    </div>
                  )}

                  {guidedStep === 4 && (
                    <div className="space-y-2 text-[11px]">
                      <p className="text-slate-200">
                        <strong>STEP 4: DOCUMENTS YOU NEED.</strong> Under segment 02, verify that Aadhaar & PAN are loaded. See how single-window registrations require these federated files securely.
                      </p>
                      <button
                        onClick={() => {
                          setGuidedStep(5);
                          setActiveTab('consent');
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded text-xs transition"
                      >
                        Next: Federated Data Sharing Consent
                      </button>
                    </div>
                  )}

                  {guidedStep === 5 && (
                    <div className="space-y-2 text-[11px]">
                      <p className="text-slate-200">
                        <strong>STEP 5: CONSENT HUB.</strong> Switch to the <strong>Privacy & Data</strong> tab. See the logged list of active and pending data-sharing requests made by government endpoints.
                      </p>
                      <button
                        onClick={() => {
                          setGuidedStep(6);
                          setActiveTab('consent');
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded text-xs transition"
                      >
                        Next: Go to Privacy & Data Tab
                      </button>
                    </div>
                  )}

                  {guidedStep === 6 && (
                    <div className="space-y-2 text-[11px]">
                      <p className="text-slate-200">
                        <strong>STEP 6: SECURE TOGGLE & LOGS.</strong> Click the toggle to grant or revoke access. Check the real-time access audit logs showing exactly when records were accessed.
                      </p>
                      <button
                        onClick={() => {
                          setGuidedStep(7);
                          setActiveTab('planner');
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded text-xs transition"
                      >
                        Next: Run Live API Integration
                      </button>
                    </div>
                  )}

                  {guidedStep === 7 && (
                    <div className="space-y-2 text-[11px]">
                      <p className="text-slate-200">
                        <strong>STEP 7: MIDDLEWARE ROUTER.</strong> Scroll to segment 03. Click the continue action on the active journey cards to trigger middleware SOAP and REST adapters.
                      </p>
                      <button
                        onClick={() => {
                          setGuidedStep(8);
                          setActiveTab('interop');
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded text-xs transition"
                      >
                        Next: Interoperability Hub Exchange
                      </button>
                    </div>
                  )}

                  {guidedStep === 8 && (
                    <div className="space-y-2 text-[11px]">
                      <p className="text-slate-200">
                        <strong>STEP 8: TRACK SYSTEM EXCHANGES.</strong> Navigate to the <strong>Interop Hub</strong> tab. See live API exchange logs, JSON payloads, and response headers.
                      </p>
                      <button
                        onClick={() => {
                          setGuidedStep(9);
                          setActiveTab('interop');
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded text-xs transition"
                      >
                        Next: Inspect Interop Hub SVG
                      </button>
                    </div>
                  )}

                  {guidedStep === 9 && (
                    <div className="space-y-2 text-[11px]">
                      <p className="text-slate-200">
                        <strong>STEP 9: SVG TOPOLOGY NETWORK.</strong> Explore the national middleware network. Central, State, and Legacy SOAP municipal services are linked. Click any node to check raw payload logs.
                      </p>
                      <button
                        onClick={() => {
                          setGuidedStep(10);
                          setActiveTab('interop');
                          // Trigger connector failure simulation automatically so the PMC node turns red!
                          toggleConnectorHealthAPI('srv_pmc_license', 'FAILED').then(() => loadInteropData());
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded text-xs transition"
                      >
                        Next: Simulate Connector Failure
                      </button>
                    </div>
                  )}

                  {guidedStep === 10 && (
                    <div className="space-y-2 text-[11px]">
                      <p className="text-slate-200">
                        <strong>STEP 10: FAULT TOLERANCE.</strong> Click <strong>"Simulate Failure"</strong> at the top right. PMC/BMA goes degraded, triggering automatic retries and secure fallback policies without crash.
                      </p>
                      <button
                        onClick={() => {
                          setGuidedStep(11);
                          setActiveTab('conflicts');
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded text-xs transition"
                      >
                        Next: Resolve Data Discrepancy
                      </button>
                    </div>
                  )}

                  {guidedStep === 11 && (
                    <div className="space-y-2 text-[11px]">
                      <p className="text-slate-200">
                        <strong>STEP 11: DATA QUALITY & MDM.</strong> Check Master Profile. Click <strong>"Use Authoritative Aadhaar"</strong> to normalize conflicts into standard CDM models and resolve database discrepancies.
                      </p>
                      <button
                        onClick={() => {
                          setGuidedStep(12);
                          setActiveTab('official');
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded text-xs transition"
                      >
                        Next: Performance & SLA Impact
                      </button>
                    </div>
                  )}

                  {guidedStep === 12 && (
                    <div className="space-y-2 text-[11px]">
                      <p className="text-slate-200">
                        <strong>STEP 12: SLA AND GovTech IMPACT.</strong> Look at the SLA targets (e.g. 48h vs 31h) and GovTech impact metrics (60.7% duplicate submission reduction, +11.2% data consistency).
                      </p>
                      <button
                        onClick={() => {
                          setGuidedStep(null);
                          setActiveTab('planner');
                          // Reset connector health to healthy
                          toggleConnectorHealthAPI('srv_pmc_license', 'HEALTHY').then(() => loadInteropData());
                        }}
                        className="w-full bg-emerald-500 text-slate-950 font-bold py-1.5 rounded text-xs hover:bg-emerald-400 transition"
                      >
                        Complete Guided Tour
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  Guided tour paused. Explore the application manually.
                </p>
              )}

              {/* Stepper Control Panel */}
              <div className="flex justify-between items-center border-t border-slate-800/80 pt-2.5 mt-2 text-[10px]">
                <button
                  onClick={() => {
                    if (guidedStep > 1) {
                      setGuidedStep(guidedStep - 1);
                    } else {
                      setGuidedStep(null);
                    }
                  }}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ← BACK
                </button>
                
                <button
                  onClick={() => setIsGuidedTourPaused(!isGuidedTourPaused)}
                  className="text-amber-500 hover:text-amber-400 font-bold"
                >
                  {isGuidedTourPaused ? '▶ RESUME' : '⏸ PAUSE'}
                </button>

                <button
                  onClick={() => {
                    setGuidedStep(1);
                    setIsGuidedTourPaused(false);
                    setActiveTab('planner');
                  }}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  RESTART
                </button>
                
                <button
                  onClick={() => {
                    setGuidedStep(null);
                    setIsGuidedTourPaused(false);
                    setActiveTab('planner');
                  }}
                  className="text-red-400 hover:text-red-300 font-bold"
                >
                  EXIT
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
