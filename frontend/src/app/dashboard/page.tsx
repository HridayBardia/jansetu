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
  logoutAPI
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

const DEMO_MODE = true;

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

    setJourneyAnalysis(null);
    setIsAnalyzing(true);
    setGenerationStage(0);

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

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);

      if (didFail) {
        setSchemesError(true);
      }

      const res = generateDemoJourney(trimmedGoal, domicileState, matchedSchemes);
      const journeyId = `demo-${Date.now()}`;
      const resWithId = { ...res, journeyId };
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`journey_analysis_${journeyId}`, JSON.stringify(resWithId));
      }
      setIsAnalyzing(false);
      router.push(`/journey/${journeyId}`);
      return;
    }

    // Simulated quick progress indicators
    const timer1 = setTimeout(() => setGenerationStage(1), 150); // Checking your documents
    const timer2 = setTimeout(() => setGenerationStage(2), 350); // Finding government schemes
    const timer3 = setTimeout(() => setGenerationStage(3), 550); // Building your journey

    try {
      console.log("[Journey] User query:", trimmedGoal);
      const res = await analyzeJourneyAPI(trimmedGoal, domicileState);
      console.log("[Journey] API response:", res);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setGenerationStage(4);
      
      if (res && res.journeyId) {
        console.log("[Journey] Saving journey:", res);
        // Store structured response in session storage
        sessionStorage.setItem(`journey_analysis_${res.journeyId}`, JSON.stringify(res));
        console.log("[Journey] Stored journey:", sessionStorage.getItem(`journey_analysis_${res.journeyId}`));
        
        // Immediate redirection
        router.push(`/journey/${res.journeyId}`);
      } else {
        throw new Error("Journey was not created.");
      }
    } catch (err) {
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
        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
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
    </div>
  );
}
