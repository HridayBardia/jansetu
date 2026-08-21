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
  toggleConnectorHealthAPI
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
  Trash2
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
  const { user, isAuthenticated, isLoading } = useAuth();

  const [goalInput, setGoalInput] = useState('');
  const latestRequestIdRef = React.useRef<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [journeyAnalysis, setJourneyAnalysis] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [schemesError, setSchemesError] = useState(false);
  
  const [selectedState, setSelectedState] = useState('All India');
  const [domicileState, setDomicileState] = useState('Rajasthan');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statesList, setStatesList] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);
  const [activeJourneys, setActiveJourneys] = useState<any[]>([]);
  const [userDocs, setUserDocs] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'planner' | 'applications' | 'consent' | 'interop' | 'conflicts'>('planner');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [guidedStep, setGuidedStep] = useState<number | null>(null);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [selectedConsent, setSelectedConsent] = useState<any | null>(null);
  const [selectedConnector, setSelectedConnector] = useState<any | null>(null);
  const [showExchange, setShowExchange] = useState<boolean>(false);

  const loadInteropData = () => {
    setIsRefreshing(true);
    fetchApplicationsAPI().then((data) => setApplications(data || []));
    fetchConsentsAPI().then((data) => setConsents(data || []));
    fetchConnectorHealthAPI().then((data) => setHealthData(data || null));
    fetchAuditLogsAPI().then((data) => setAuditLogs(data || []));
    fetchConflictsAPI().then((data) => setConflicts(data || []));
    fetchNotificationsAPI().then((data) => setNotifications(data || []));
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
    <div className="max-w-5xl mx-auto space-y-8 py-6 px-4">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md">
            JS
          </div>
          <span className="text-xs font-black text-slate-400 tracking-widest uppercase">AI Citizen Journey Engine</span>
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
          <p className="text-xs text-slate-500">
            Your personal authenticated citizen gateway to services, schemes, and documents.
          </p>
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

      {/* Interoperability Tabs Switcher */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-px shrink-0">
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
          <span>Consent Center</span>
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
          <span>Interop Hub</span>
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
          <span>Data Quality</span>
          {conflicts.filter(c => c.status === 'DETECTED').length > 0 && (
            <span className="bg-red-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ml-1 animate-pulse">
              {conflicts.filter(c => c.status === 'DETECTED').length}
            </span>
          )}
        </button>
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
              <div className="relative">
                <textarea
                  rows={2}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="Tell us what you're trying to do... e.g. 'I want to study in Australia' or 'I want to start a business'..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 pr-40 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 text-sm resize-none"
                />
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="absolute bottom-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 transition"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>UNDERSTANDING YOUR GOAL...</span>
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
      </>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Applications Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Applications</span>
              <span className="text-lg font-black text-white">{applications.length || 4} Registered</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Verification</span>
              <span className="text-lg font-black text-amber-400">
                {applications.filter(a => ['UNDER_VERIFICATION', 'SUBMITTED', 'DOCUMENTS_REQUIRED'].includes(a.status)).length || 3} Pending
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Completed</span>
              <span className="text-lg font-black text-emerald-400">
                {applications.filter(a => ['APPROVED', 'COMPLETED'].includes(a.status)).length || 1} Issued
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Action Required</span>
              <span className="text-lg font-black text-red-400 animate-pulse">
                {applications.filter(a => a.status === 'DOCUMENTS_REQUIRED').length || 1} Alert
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

                  <div className="flex gap-2 justify-end border-t border-slate-900 pt-3">
                    <button
                      onClick={() => setSelectedConsent(c)}
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-bold px-3 py-1.5 rounded text-[11px] transition"
                    >
                      View Details
                    </button>
                    {!c.granted && c.access_type !== 'REVOKED' && (
                      <>
                        <button
                          onClick={() => {
                            createConsentAPI(c.department_id, c.department_name, c.requested_fields, c.purpose, "ONCE").then(() => loadInteropData());
                          }}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold px-3 py-1.5 rounded text-[11px] hover:from-amber-400 hover:to-orange-400 transition"
                        >
                          Allow Once
                        </button>
                        <button
                          onClick={() => {
                            createConsentAPI(c.department_id, c.department_name, c.requested_fields, c.purpose, "ALWAYS").then(() => loadInteropData());
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded text-[11px] transition"
                        >
                          Allow Always
                        </button>
                      </>
                    )}
                    {c.granted && c.access_type !== 'REVOKED' && (
                      <button
                        onClick={() => revokeConsentAPI(c.consent_id).then(() => loadInteropData())}
                        className="text-red-400 hover:text-red-300 font-bold hover:bg-red-500/10 border border-transparent hover:border-red-500/20 px-3 py-1.5 rounded text-[11px] transition"
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
        <div className="space-y-6 animate-fadeIn">
          {/* Telemetry metrics bar */}
          {healthData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Connected Services
                </span>
                <p className="text-lg font-black text-white">{healthData.connected_services}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" /> Successful Requests
                </span>
                <p className="text-lg font-black text-emerald-400">{healthData.success_rate}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 text-amber-400" /> Response Time
                </span>
                <p className="text-lg font-black text-amber-400">{healthData.avg_latency}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-purple-400" /> Pending Events
                </span>
                <p className="text-lg font-black text-purple-400">{healthData.pending_events}</p>
              </div>
            </div>
          )}

          {/* Interactive Topology Network diagram */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  <span>Interoperability Gateway Topology Diagram</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Interactive network showing mock protocol endpoints. Click any node to inspect data exchanges.
                </p>
              </div>
              {/* Failure Simulation triggers */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    toggleConnectorHealthAPI("srv_pmc_license", "FAILED").then(() => loadInteropData());
                  }}
                  className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold px-3 py-1.5 rounded-lg text-xs transition"
                >
                  Simulate Failure
                </button>
                <button
                  onClick={() => {
                    toggleConnectorHealthAPI("srv_pmc_license", "HEALTHY").then(() => loadInteropData());
                  }}
                  className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 font-bold px-3 py-1.5 rounded-lg text-xs transition"
                >
                  Restore Service
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              <div className="lg:col-span-2">
                <svg viewBox="0 0 600 350" className="w-full h-auto bg-slate-950 border border-slate-850 rounded-xl shadow-2xl">
                  {/* Connections to Satellites */}
                  <line x1="300" y1="175" x2="300" y2="50" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,4" />
                  <line x1="300" y1="175" x2="100" y2="120" stroke="#10b981" strokeWidth="1.5" />
                  <line x1="300" y1="175" x2="100" y2="230" stroke="#10b981" strokeWidth="1.5" />
                  <line x1="300" y1="175" x2="500" y2="120" stroke="#10b981" strokeWidth="1.5" />
                  <line x1="300" y1="175" x2="500" y2="230" stroke={healthData?.services?.find((s: any) => s.name.includes("Municipal"))?.status === "Failed" ? "#ef4444" : "#10b981"} strokeWidth="1.5" />
                  <line x1="300" y1="175" x2="300" y2="300" stroke="#10b981" strokeWidth="1.5" />

                  {/* Animated pulsing circles moving along lines */}
                  <circle r="3.5" fill="#f59e0b">
                    <animateMotion dur="3s" repeatCount="indefinite" path="M 300 175 L 300 50 Z" />
                  </circle>
                  <circle r="3.5" fill="#10b981">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M 300 175 L 100 120 Z" />
                  </circle>
                  <circle r="3.5" fill="#10b981">
                    <animateMotion dur="3.5s" repeatCount="indefinite" path="M 300 175 L 100 230 Z" />
                  </circle>
                  <circle r="3.5" fill="#10b981">
                    <animateMotion dur="4s" repeatCount="indefinite" path="M 300 175 L 500 120 Z" />
                  </circle>
                  <circle r="3.5" fill={healthData?.services?.find((s: any) => s.name.includes("Municipal"))?.status === "Failed" ? "#ef4444" : "#10b981"}>
                    <animateMotion dur="3s" repeatCount="indefinite" path="M 300 175 L 500 230 Z" />
                  </circle>
                  <circle r="3.5" fill="#10b981">
                    <animateMotion dur="2s" repeatCount="indefinite" path="M 300 175 L 300 300 Z" />
                  </circle>

                  {/* Center Hub */}
                  <g className="cursor-pointer" onClick={() => setSelectedConnector({
                    name: "Maharashtra Interoperability Gateway",
                    connector_type: "Hub Engine",
                    status: "Healthy",
                    request_count: "18,421",
                    latency: "380ms",
                    api_version: "v3.2",
                    details: "Central routing engine managing API protocols, token consent controls, and common schemas mapping."
                  })}>
                    <circle cx="300" cy="175" r="45" fill="#f59e0b" fillOpacity="0.1" stroke="#f59e0b" strokeWidth="2" className="animate-pulse" />
                    <circle cx="300" cy="175" r="35" fill="#f59e0b" />
                    <text x="300" y="172" fill="#020205" textAnchor="middle" fontSize="10" fontWeight="900">INTEROP</text>
                    <text x="300" y="184" fill="#020205" textAnchor="middle" fontSize="9" fontWeight="900">GATEWAY</text>
                  </g>

                  {/* Satellites */}
                  {/* Top: Doc Vault */}
                  <g className="cursor-pointer" onClick={() => setSelectedConnector({
                    service_id: "srv_digilocker",
                    name: "Document Verification Service (DigiLocker API)",
                    connector_type: "REST API",
                    status: "Healthy",
                    request_count: "3,142",
                    latency: "210ms",
                    api_version: "v2.0",
                    details: "DigiLocker REST integration verifying document hashes."
                  })}>
                    <circle cx="300" cy="50" r="22" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                    <text x="300" y="53" fill="#ffffff" textAnchor="middle" fontSize="7" fontWeight="bold">DigiLocker</text>
                  </g>

                  {/* Top Left: Identity */}
                  <g className="cursor-pointer" onClick={() => setSelectedConnector({
                    service_id: "srv_identity",
                    name: "Identity Verification Service (Aadhaar API)",
                    connector_type: "REST API",
                    status: "Healthy",
                    request_count: "5,821",
                    latency: "310ms",
                    api_version: "v2.1",
                    details: "Aadhaar e-KYC demographics identity verify."
                  })}>
                    <circle cx="100" cy="120" r="22" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
                    <text x="100" y="123" fill="#ffffff" textAnchor="middle" fontSize="7" fontWeight="bold">Aadhaar ID</text>
                  </g>

                  {/* Bottom Left: Address */}
                  <g className="cursor-pointer" onClick={() => setSelectedConnector({
                    service_id: "srv_address",
                    name: "Address Verification Service",
                    connector_type: "REST API",
                    status: "Healthy",
                    request_count: "4,192",
                    latency: "280ms",
                    api_version: "v1.0",
                    details: "Land registry & property tax databases address match."
                  })}>
                    <circle cx="100" cy="230" r="22" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
                    <text x="100" y="233" fill="#ffffff" textAnchor="middle" fontSize="7" fontWeight="bold">Address</text>
                  </g>

                  {/* Top Right: Business MSINS */}
                  <g className="cursor-pointer" onClick={() => setSelectedConnector({
                    service_id: "srv_msins_biz",
                    name: "Business Registration (MSINS)",
                    connector_type: "REST API",
                    status: "Healthy",
                    request_count: "2,842",
                    latency: "420ms",
                    api_version: "v3.0",
                    details: "Maharashtra State Innovation Society business creation."
                  })}>
                    <circle cx="500" cy="120" r="22" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
                    <text x="500" y="123" fill="#ffffff" textAnchor="middle" fontSize="7" fontWeight="bold">MSINS Biz</text>
                  </g>

                  {/* Bottom Right: Municipal Legacy Adapter */}
                  <g className="cursor-pointer" onClick={() => setSelectedConnector({
                    service_id: "srv_pmc_license",
                    name: "Legacy Municipal System (Pune Trade License)",
                    connector_type: "SOAP Legacy Adapter",
                    status: healthData?.services?.find((s: any) => s.name.includes("Municipal"))?.status || "Healthy",
                    request_count: "1,424",
                    latency: "680ms",
                    api_version: "v2.0-SOAP",
                    details: "Legacy Municipal SOAP service adapter wrapping traditional XML responses."
                  })}>
                    <circle cx="500" cy="230" r="22" fill="#1e293b" stroke={healthData?.services?.find((s: any) => s.name.includes("Municipal"))?.status === "Failed" ? "#ef4444" : "#10b981"} strokeWidth="2" />
                    <text x="500" y="233" fill="#ffffff" textAnchor="middle" fontSize="7" fontWeight="bold">PMC SOAP</text>
                  </g>

                  {/* Bottom: Notifications */}
                  <g className="cursor-pointer" onClick={() => setSelectedConnector({
                    name: "Notification Gateway",
                    connector_type: "REST API",
                    status: "Healthy",
                    request_count: "12,982",
                    latency: "95ms",
                    api_version: "v1.1",
                    details: "SMS & Email notification dispatcher."
                  })}>
                    <circle cx="300" cy="300" r="22" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
                    <text x="300" y="303" fill="#ffffff" textAnchor="middle" fontSize="7" fontWeight="bold">Alerts</text>
                  </g>
                </svg>
              </div>

              {/* Connector details panel */}
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-xs space-y-4 flex flex-col justify-between">
                {selectedConnector ? (
                  <>
                    <div className="space-y-3">
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase inline-block mb-1 ${
                          selectedConnector.status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          selectedConnector.status === 'Failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {selectedConnector.status}
                        </span>
                        <h4 className="font-bold text-white text-sm">{selectedConnector.name}</h4>
                        <p className="text-[10px] text-slate-500">Connector Type: <span className="text-cyan-400 font-mono">{selectedConnector.connector_type}</span></p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-900 p-2.5 rounded-lg border border-slate-850">
                        <p className="text-slate-400">API Version: <strong className="text-slate-200">{selectedConnector.api_version || 'v1.0'}</strong></p>
                        <p className="text-slate-400">Total Requests: <strong className="text-slate-200">{selectedConnector.request_count}</strong></p>
                        <p className="text-slate-400">Success Rate: <strong className="text-emerald-400">99.2%</strong></p>
                        <p className="text-slate-400">Avg Latency: <strong className="text-amber-400">{selectedConnector.latency}</strong></p>
                      </div>

                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        {selectedConnector.details}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-900">
                      <button
                        onClick={() => setShowExchange(!showExchange)}
                        className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold py-2 rounded-lg transition text-[11px]"
                      >
                        {showExchange ? 'Hide Exchange Inspector' : 'View Recent Exchange Packet'}
                      </button>

                      {showExchange && (
                        <div className="mt-3 p-3 bg-slate-950 border border-slate-850 rounded-lg text-[9px] font-mono overflow-x-auto max-h-40 text-slate-300">
                          {selectedConnector.connector_type.includes("SOAP") ? (
                            <pre className="leading-tight text-yellow-300/90">
{`<!-- SOAP Request Envelope -->
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ApplyForTradeLicense xmlns="http://tempuri.org/">
      <business_id>MSINS-PUNE-88741</business_id>
      <ward_number>PMC-Ward-12</ward_number>
      <area_sqft>450</area_sqft>
    </ApplyForTradeLicense>
  </soap:Body>
</soap:Envelope>

<!-- Legacy Response -->
<soap:Envelope>
  <soap:Body>
    <ApplyForTradeLicenseResponse>
      <LicenseNumber>LIC-PMC-2026-9912</LicenseNumber>
      <Status>ISSUED</Status>
    </ApplyForTradeLicenseResponse>
  </soap:Body>
</soap:Envelope>`}
                            </pre>
                          ) : (
                            <pre className="leading-tight text-cyan-300/90">
{`// REST JSON Exchange
{
  "request": {
    "url": "/api/v1/services/srv_identity/call",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer jwt_token_hash"
    },
    "body": {
      "operation": "verify_demographics",
      "params": {
        "aadhaar": "XXXX-XXXX-8865"
      }
    }
  },
  "response": {
    "status": 200,
    "body": {
      "verified": true,
      "claims": {
        "name": "Aarav Mehta",
        "dob": "2005-01-10"
      }
    }
  }
}`}
                            </pre>
                          )}
                          <p className="text-[8px] text-slate-500 mt-2 text-center uppercase tracking-wider block border-t border-slate-900 pt-1">DEMO API EXCHANGE</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 space-y-2">
                    <Activity className="w-8 h-8 text-slate-700 animate-pulse" />
                    <p>Select any node on the interop topology map to view API connection logs.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Common Data Model mapping visualizer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-400" />
                  <span>Common Data Model Schema Normalizer</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Visualizes how disparate formats from separate systems are translated dynamically without modifying their databases.
                </p>
              </div>
              <button
                onClick={() => setShowCDM(!showCDM)}
                className="text-amber-400 hover:text-amber-300 font-bold text-xs"
              >
                {showCDM ? 'Hide Mapping' : 'Show Mapping'}
              </button>
            </div>

            {showCDM && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono bg-slate-950 border border-slate-850 p-4 rounded-xl text-slate-300">
                <div className="bg-slate-900/50 p-3 rounded border border-slate-800 space-y-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase block">Source System: Aadhaar</span>
                  <p className="text-slate-400">full_name: <span className="text-emerald-400 font-bold">"Aarav Mehta"</span></p>
                  <p className="text-slate-400">dob: <span className="text-emerald-400 font-bold">"10/01/2005"</span></p>
                  <p className="text-slate-400">addr_line1: <span className="text-emerald-400 font-bold">"Flat 402, Shivajinagar"</span></p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded border border-slate-800 space-y-2 flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] font-black text-amber-500 uppercase block">JanSetu Normalized CDM</span>
                  <div className="w-full bg-slate-950 p-2 rounded text-[11px] border border-amber-500/20 text-slate-200 space-y-1">
                    <p>name</p>
                    <p>date_of_birth</p>
                    <p>address</p>
                  </div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded border border-slate-800 space-y-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase block">Target System: PMC License</span>
                  <p className="text-slate-400">applicant_name: <span className="text-emerald-400 font-bold">"Aarav Mehta"</span></p>
                  <p className="text-slate-400">birth_date: <span className="text-emerald-400 font-bold">"2005-01-10"</span></p>
                  <p className="text-slate-400">registered_address: <span className="text-emerald-400 font-bold">"Flat 402, Shivajinagar"</span></p>
                </div>
              </div>
            )}
          </div>

          {/* Audit Logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              <span>Interoperability Secure Audit Trail</span>
            </h2>
            <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
              <div className="max-h-60 overflow-y-auto text-xs font-mono">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900 text-slate-500 text-[10px] uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Actor</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Resource</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {auditLogs.map((log, idx) => (
                      <tr key={log.id || idx} className="hover:bg-slate-900/40">
                        <td className="p-3 text-slate-500 text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="p-3 text-slate-400">{log.actor}</td>
                        <td className="p-3 font-bold">{log.action}</td>
                        <td className="p-3 text-slate-400">{log.resource}</td>
                        <td className="p-3">
                          <span className={log.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Quality Tab */}
      {activeTab === 'conflicts' && (
        <div className="space-y-6 animate-fadeIn">
          {/* MDM stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-0.5">
              <span className="text-slate-500 font-semibold uppercase block text-[9px]">Records Validated</span>
              <span className="text-lg font-black text-white">18,421</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-0.5">
              <span className="text-slate-500 font-semibold uppercase block text-[9px]">Consistent</span>
              <span className="text-lg font-black text-emerald-400">17,962</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-0.5">
              <span className="text-slate-500 font-semibold uppercase block text-[9px]">Warnings</span>
              <span className="text-lg font-black text-amber-400">341</span>
            </div>
            <div className="bg-slate-900 border grid-cols-1 border-slate-800 rounded-xl p-4 space-y-0.5">
              <span className="text-slate-500 font-semibold uppercase block text-[9px]">Conflicts</span>
              <span className="text-lg font-black text-red-400">{conflicts.filter(c => c.status === 'DETECTED').length} Active</span>
            </div>
          </div>

          {/* Master Citizen Record (MDM view) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>Master Citizen Profile Record (MDM View)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Authoritative single-source-of-truth values derived from connected registries.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-slate-500 text-[9px] uppercase tracking-wider block">Citizen Master ID</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">CIT-10482</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px] uppercase tracking-wider block">Verified Name</span>
                  <span className="text-sm font-bold text-white">{user?.full_name || 'Aarav Mehta'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px] uppercase tracking-wider block">Authoritative DOB</span>
                  <span className="text-sm font-bold text-white">
                    {conflicts.find(c => c.field_name === 'date_of_birth' && c.status === 'RESOLVED')?.resolved_value || '10 Jan 2005 (Aadhaar)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px] uppercase tracking-wider block">Verified Residence Address</span>
                  <span className="text-sm font-bold text-white">Flat 402, Pune, Maharashtra</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px] uppercase tracking-wider block">Contact Verified</span>
                  <span className="text-sm font-bold text-white">+91 98765 43210</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px] uppercase tracking-wider block">Data Sources Connected</span>
                  <span className="text-sm font-bold text-emerald-400">✓ UIDAI, State land registry</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 border-t border-slate-900 pt-3">
                *Authoritative values are maintained separately from individual department source-system representations to protect citizen data privacy.
              </p>
            </div>
          </div>

          {/* Conflicts Resolver */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>Data Quality Engine Validator</span>
              </h2>
              <p className="text-xs text-slate-400">
                Automatically flags inconsistent citizen identifiers or data schemas across connected databases.
              </p>
            </div>

            {conflicts.length === 0 ? (
              <div className="bg-slate-950 border border-slate-900 p-8 rounded-xl text-center text-slate-500 text-xs">
                No data quality conflicts or discrepancies detected. All schemas consistent.
              </div>
            ) : (
              <div className="space-y-4">
                {conflicts.map((c) => (
                  <div key={c.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-3 text-xs">
                      <div>
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-wider block">DISCREPANCY DETECTED</span>
                        <h4 className="text-sm font-bold text-white uppercase mt-0.5">Field Name: {c.field_name.replace("_", " ")}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'RESOLVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg space-y-1">
                        <span className="text-slate-500 text-[10px] font-semibold block uppercase">Source A: {c.source_a}</span>
                        <p className="text-sm font-bold text-slate-300">{c.value_a}</p>
                      </div>
                      <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg space-y-1">
                        <span className="text-slate-500 text-[10px] font-semibold block uppercase">Source B: {c.source_b}</span>
                        <p className="text-sm font-bold text-slate-300">{c.value_b}</p>
                      </div>
                    </div>

                    {c.status === 'DETECTED' ? (
                      <div className="space-y-3 pt-2">
                        <span className="text-xs text-slate-400 block font-semibold">Select Verified Reference Value to Resolve:</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => resolveConflictAPI(c.id, c.value_a).then(() => loadInteropData())}
                            className="bg-slate-900 hover:bg-slate-850 border border-slate-700 text-white font-bold px-3 py-1.5 rounded text-xs transition"
                          >
                            Use Authoritative Aadhaar: {c.value_a}
                          </button>
                          <button
                            onClick={() => resolveConflictAPI(c.id, c.value_b).then(() => loadInteropData())}
                            className="bg-slate-900 hover:bg-slate-850 border border-slate-700 text-white font-bold px-3 py-1.5 rounded text-xs transition"
                          >
                            Use Local PMC: {c.value_b}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 text-xs text-emerald-400">
                        Conflict resolved. Verified value established: <span className="font-bold">{c.resolved_value}</span>.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Guided Tour Stepper Controller */}
      <div className="fixed bottom-4 right-4 z-40 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl max-w-sm w-full space-y-3">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <span className="text-[10px] font-black text-amber-500 tracking-wider uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> SIH judge guided demo
          </span>
          {guidedStep !== null && (
            <button
              onClick={() => setGuidedStep(null)}
              className="text-slate-500 hover:text-slate-300 text-xs"
            >
              Reset Guide
            </button>
          )}
        </div>

        {guidedStep === null ? (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Start the interactive walkthrough to follow a Pune citizen goal journey through data vault sharing, REST/SOAP connector triggers, and conflict resolutions.
            </p>
            <button
              onClick={() => {
                setGuidedStep(1);
                setActiveTab('planner');
                setGoalInput("I want to start a small food business in Pune.");
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold py-1.5 rounded text-xs hover:from-amber-400 hover:to-orange-400 transition"
            >
              Start Guided Tour
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest font-black">
              <span>Step {guidedStep} of 7</span>
              <span>{guidedStep === 7 ? 'COMPLETED' : 'IN PROGRESS'}</span>
            </div>
            
            {guidedStep === 1 && (
              <div className="space-y-2 text-[11px]">
                <p className="text-slate-200">
                  <strong>STEP 1: Enter Goal.</strong> Domicile State is pre-set to Maharashtra. Click the <strong>"Understand Goal"</strong> button to parse the goal and trigger mock registries.
                </p>
                <button
                  onClick={() => {
                    setGuidedStep(2);
                    // Force input value
                    setGoalInput("I want to start a small food business in Pune.");
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded text-xs transition"
                >
                  Next Step (Auto-fill & Submit)
                </button>
              </div>
            )}

            {guidedStep === 2 && (
              <div className="space-y-2 text-[11px]">
                <p className="text-slate-200">
                  <strong>STEP 2: Review Goal Steps.</strong> Look at the dynamic steps generated. Note status, departments, required data schema, and next actions.
                </p>
                <button
                  onClick={() => {
                    setGuidedStep(3);
                    setActiveTab('applications');
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded text-xs transition"
                >
                  Next Step: Open tracker tab
                </button>
              </div>
            )}

            {guidedStep === 3 && (
              <div className="space-y-2 text-[11px]">
                <p className="text-slate-200">
                  <strong>STEP 3: Track applications.</strong> 4 cards resolved across MSINS, PMC licensing, address check, and UIDAI e-KYC. Click <strong>"Business Registration"</strong> to see details.
                </p>
                <button
                  onClick={() => {
                    setGuidedStep(4);
                    const bizApp = applications.find(a => a.service_id === 'srv_msins_biz');
                    if (bizApp) setSelectedApp(bizApp);
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded text-xs transition"
                >
                  Next Step: Open details modal
                </button>
              </div>
            )}

            {guidedStep === 4 && (
              <div className="space-y-2 text-[11px]">
                <p className="text-slate-200">
                  <strong>STEP 4: Simulate Update.</strong> Click the amber <strong>"Simulate Status Update"</strong> button inside the modal to approve the registration and propagate updates.
                </p>
                <button
                  onClick={() => {
                    setSelectedApp(null);
                    setGuidedStep(5);
                    setActiveTab('consent');
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded text-xs transition"
                >
                  Next Step: Open Consent Center
                </button>
              </div>
            )}

            {guidedStep === 5 && (
              <div className="space-y-2 text-[11px]">
                <p className="text-slate-200">
                  <strong>STEP 5: Manage Consents.</strong> Look at PMC Food Licensing's pending consent request. Click <strong>"Allow Once"</strong> or <strong>"Allow Always"</strong> to authorize secure data reuse.
                </p>
                <button
                  onClick={() => {
                    setGuidedStep(6);
                    setActiveTab('interop');
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded text-xs transition"
                >
                  Next Step: View Interop Hub
                </button>
              </div>
            )}

            {guidedStep === 6 && (
              <div className="space-y-2 text-[11px]">
                <p className="text-slate-200">
                  <strong>STEP 6: Inspect interop layers.</strong> Explore the interactive SVG diagram. Note the SOAP municipal node and REST services. Click <strong>"Simulate Failure"</strong> to test exception handling.
                </p>
                <button
                  onClick={() => {
                    setGuidedStep(7);
                    setActiveTab('conflicts');
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1 rounded text-xs transition"
                >
                  Next Step: Resolve conflicts
                </button>
              </div>
            )}

            {guidedStep === 7 && (
              <div className="space-y-2 text-[11px]">
                <p className="text-slate-200">
                  <strong>STEP 7: Resolve discrepancies.</strong> In Data Quality, select <strong>"Use Authoritative Aadhaar"</strong> to fix the DOB discrepancy and synchronize the Master Record.
                </p>
                <button
                  onClick={() => {
                    setGuidedStep(null);
                    setActiveTab('planner');
                  }}
                  className="w-full bg-emerald-500 text-slate-950 font-bold py-1.5 rounded text-xs hover:bg-emerald-400 transition"
                >
                  Complete Guided Tour
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
