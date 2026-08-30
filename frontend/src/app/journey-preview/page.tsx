'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, Compass, CheckCircle2, AlertTriangle, ArrowLeft, ExternalLink, 
  Building2, GraduationCap, Zap, HeartPulse, ShieldCheck, Landmark, Globe,
  Check, ArrowRight, Sparkles, Loader2, Play
} from 'lucide-react';
import { useLiveSync } from '@/context/LiveSyncContext';
import { buildRichJourneySteps } from '@/lib/api';

const testJourney = {
  id: "preview-test",
  goal: "Higher Education & Skill Development",
  domicile: {
    state: "Rajasthan"
  },
  jurisdiction: {
    domicile_state: "Rajasthan",
    destination_country: "Australia"
  },
  documents_available: [
    { name: "Aadhaar Card", status: "Verified", demo: true },
    { name: "PAN Card", status: "Verified", demo: true },
    { name: "Class 10 Marksheet", status: "Verified", demo: true },
    { name: "Class 12 Marksheet", status: "Verified", demo: true }
  ],
  documents_required: [
    { name: "Valid Passport", reason: "Mandatory government identity document for international travel, university clearance, and overseas student visa." },
    { name: "English Language Test Result (IELTS / TOEFL)", reason: "Required by academic admission boards and consular visa authorities to certify linguistic competency." },
    { name: "Academic Transcripts & Degree Certificate", reason: "Mandatory certified mark sheets for university evaluation and credit equivalency verification." },
    { name: "Financial Capacity & Bank Account Mandate", reason: "Proof of tuition funding and living maintenance via Aadhaar-linked bank statement." }
  ],
  schemes: [
    {
      id: "sch_001",
      name: "National Overseas Scholarship Scheme",
      level: "Central",
      description: "Financial assistance to meritorious students pursuing Master's or Ph.D. abroad.",
      portal_url: "https://nosmsje.gov.in"
    },
    {
      id: "sch_002",
      name: "Vidya Lakshmi Education Loan Scheme",
      level: "Central",
      description: "Single window portal for students to apply for educational loans from scheduled Indian banks.",
      portal_url: "https://www.vidyalakshmi.co.in"
    }
  ]
};

// Document procurement mapping helper
function getDocumentPortalInfo(docName: string): { portalName: string; url: string; authority: string } {
  const lower = (docName || '').toLowerCase();
  
  if (lower.includes('passport')) {
    return { portalName: 'Passport Seva Portal', url: 'https://passportindia.gov.in', authority: 'Ministry of External Affairs' };
  }
  if (lower.includes('english') || lower.includes('ielts') || lower.includes('toefl')) {
    return { portalName: 'Official IELTS / TOEFL Portal', url: 'https://www.ets.org/toefl', authority: 'Authorized Testing Board' };
  }
  if (lower.includes('transcript') || lower.includes('degree') || lower.includes('marksheet') || lower.includes('academic')) {
    return { portalName: 'DigiLocker Academic Bank of Credits (ABC)', url: 'https://www.abc.gov.in', authority: 'UGC & Ministry of Education' };
  }
  if (lower.includes('aadhaar')) {
    return { portalName: 'UIDAI myAadhaar Portal', url: 'https://myaadhaar.uidai.gov.in', authority: 'UIDAI' };
  }
  if (lower.includes('pan')) {
    return { portalName: 'Protean NSDL e-PAN Portal', url: 'https://onlineservices.nsdl.com/paam/endUserRegisterContact.html', authority: 'Income Tax Department' };
  }
  if (lower.includes('income')) {
    return { portalName: 'State e-District / Revenue Portal', url: 'https://services.india.gov.in', authority: 'Revenue Department' };
  }
  if (lower.includes('domicile') || lower.includes('residence')) {
    return { portalName: 'State Citizen Services Portal', url: 'https://services.india.gov.in', authority: 'District Administration' };
  }
  if (lower.includes('fire') || lower.includes('noc')) {
    return { portalName: 'State Fire & Emergency Services', url: 'https://services.india.gov.in', authority: 'Fire & Emergency Services' };
  }
  if (lower.includes('food') || lower.includes('fssai')) {
    return { portalName: 'FSSAI FoSCoS Portal', url: 'https://foscos.fssai.gov.in', authority: 'Food Safety & Standards Authority of India' };
  }
  if (lower.includes('udyam') || lower.includes('msme') || lower.includes('business')) {
    return { portalName: 'Udyam Registration Portal', url: 'https://udyamregistration.gov.in', authority: 'Ministry of MSME' };
  }
  if (lower.includes('trade') || lower.includes('municipal')) {
    return { portalName: 'Municipal Citizen Portal', url: 'https://services.india.gov.in', authority: 'Urban Local Body' };
  }
  if (lower.includes('electricity') || lower.includes('solar') || lower.includes('discom')) {
    return { portalName: 'PM Surya Ghar National Portal', url: 'https://pmsuryaghar.gov.in', authority: 'Ministry of New & Renewable Energy' };
  }
  if (lower.includes('bank') || lower.includes('financial') || lower.includes('mandate')) {
    return { portalName: 'NPCI DBT Seeding Portal', url: 'https://www.npci.org.in', authority: 'NPCI / Public Financial Management' };
  }
  if (lower.includes('driving') || lower.includes('licence') || lower.includes('license')) {
    return { portalName: 'Parivahan Sarathi Portal', url: 'https://sarathi.parivahan.gov.in', authority: 'Ministry of Road Transport & Highways' };
  }
  if (lower.includes('ration') || lower.includes('food grain')) {
    return { portalName: 'National Food Security Portal', url: 'https://nfsa.gov.in', authority: 'Department of Food & Public Distribution' };
  }

  return { portalName: 'National Government Services Directory', url: 'https://services.india.gov.in', authority: 'Government of India' };
}

// Master Domain Official Gateways
const DOMAIN_PORTALS = [
  {
    domain: "Scholarships & Higher Education",
    icon: GraduationCap,
    color: "blue",
    portals: [
      { name: "National Scholarship Portal (NSP)", desc: "Centralized one-stop scholarship gateway for pre-matric, post-matric & higher studies.", url: "https://scholarships.gov.in", authority: "MoE & MoMA" },
      { name: "Academic Bank of Credits (ABC)", desc: "DigiLocker verified repository for college credits and digital degree credentials.", url: "https://www.abc.gov.in", authority: "UGC / DigiLocker" },
      { name: "Vidya Lakshmi Education Portal", desc: "Apply and track national education loans with interest subsidies.", url: "https://www.vidyalakshmi.co.in", authority: "Dept of Financial Services" },
      { name: "Study in India Portal", desc: "Overseas admission and exchange coordination portal.", url: "https://studyinindia.gov.in", authority: "Ministry of Education" },
    ]
  },
  {
    domain: "Business, MSME & Commercial Licensing",
    icon: Building2,
    color: "purple",
    portals: [
      { name: "Udyam MSME Registration", desc: "Zero-cost paperless MSME registration and permanent Udyam Certificate.", url: "https://udyamregistration.gov.in", authority: "Ministry of MSME" },
      { name: "FSSAI FoSCoS Food Licensing", desc: "Food Safety and Standards Authority of India cloud compliance portal.", url: "https://foscos.fssai.gov.in", authority: "FSSAI" },
      { name: "GST Portal & Tax Registration", desc: "Goods and Services Tax registration, returns, and compliance filings.", url: "https://www.gst.gov.in", authority: "GSTN / CBIC" },
      { name: "Startup India Hub", desc: "Recognition, tax exemptions, and seed funding support for innovators.", url: "https://www.startupindia.gov.in", authority: "DPIIT" },
    ]
  },
  {
    domain: "Energy, Solar & Housing Infrastructure",
    icon: Zap,
    color: "amber",
    portals: [
      { name: "PM Surya Ghar Muft Bijli Yojana", desc: "National portal for rooftop solar installations with up to 78,000 INR subsidy.", url: "https://pmsuryaghar.gov.in", authority: "MNRE" },
      { name: "PM Awas Yojana (PMAY-U / G)", desc: "Affordable housing subsidy and credit-linked interest assistance.", url: "https://pmaymis.gov.in", authority: "MoHUA" },
    ]
  },
  {
    domain: "Healthcare & Citizen Social Security",
    icon: HeartPulse,
    color: "emerald",
    portals: [
      { name: "Ayushman Bharat ABHA Health ID", desc: "Ayushman Bharat Digital Health Account and cashless healthcare records.", url: "https://abha.abdm.gov.in", authority: "National Health Authority" },
      { name: "PM Kisan Samman Nidhi", desc: "Direct benefit transfer of 6,000 INR annually for landholding farmers.", url: "https://pmkisan.gov.in", authority: "Ministry of Agriculture" },
      { name: "e-Shram National Portal", desc: "National database and social security cover for unorganised workers.", url: "https://eshram.gov.in", authority: "Ministry of Labour" },
    ]
  },
  {
    domain: "National Identity & Common Gateway Directory",
    icon: Landmark,
    color: "slate",
    portals: [
      { name: "UIDAI myAadhaar Portal", desc: "Resident identity management, document updates, and e-KYC verification.", url: "https://myaadhaar.uidai.gov.in", authority: "UIDAI" },
      { name: "Parivahan Sarathi Portal", desc: "Driving license issuance, renewals, and vehicle registry services.", url: "https://sarathi.parivahan.gov.in", authority: "MoRTH" },
      { name: "National Services Directory", desc: "Comprehensive catalog of 14,000+ Central and State citizen e-services.", url: "https://services.india.gov.in", authority: "NIC / MeitY" },
    ]
  }
];

export default function JourneyPreviewPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [journey, setJourney] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isAddingApp, setIsAddingApp] = useState(false);
  const [appAddedNotice, setAppAddedNotice] = useState<{ id: string; service: string } | null>(null);
  const [showAllPortals, setShowAllPortals] = useState(false);
  const { startJourney, submitApplication } = useLiveSync();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem("citizenJourney") || sessionStorage.getItem("activeCitizenJourney");
      if (stored) {
        try {
          setJourney(JSON.parse(stored));
        } catch (e) {
          console.warn("Failed to parse activeCitizenJourney:", e);
        }
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020205] text-slate-900 dark:text-white flex flex-col items-center justify-center p-4">
        <p className="text-slate-600 dark:text-slate-400 text-sm">{t("loading.loading")}</p>
      </div>
    );
  }

  // Fallback to testJourney if nothing is set in storage
  const activeJourney = journey || testJourney;

  // Extract variables safely
  const goalTitle = activeJourney?.goal?.title || activeJourney?.goal || "Citizen Goal Preview";
  const domicileState = activeJourney?.domicile?.state || activeJourney?.location?.domicile_state || activeJourney?.jurisdiction?.domicile_state || "Not specified";
  const targetLocation = activeJourney?.targetLocation || activeJourney?.location || null;
  const targetCountry = targetLocation?.country || activeJourney?.jurisdiction?.destination_country || null;
  const targetState = targetLocation?.state || null;
  const targetCity = targetLocation?.city || targetLocation?.location || null;

  const rawHave = Array.isArray(activeJourney?.documents?.available) 
    ? activeJourney.documents.available 
    : Array.isArray(activeJourney?.documents_available)
      ? activeJourney.documents_available
      : Array.isArray(activeJourney?.documents?.have)
        ? activeJourney.documents.have
        : [];

  const rawNeed = Array.isArray(activeJourney?.documents?.needed) 
    ? activeJourney.documents.needed 
    : Array.isArray(activeJourney?.documents_required)
      ? activeJourney.documents_required
      : Array.isArray(activeJourney?.documents?.need)
        ? activeJourney.documents.need
        : [];

  const schemesList = Array.isArray(activeJourney?.schemes) 
    ? activeJourney.schemes 
    : [
        ...(activeJourney?.schemes?.central || []),
        ...(activeJourney?.schemes?.state || []),
        ...(activeJourney?.schemes?.targetLocation || []),
        ...(activeJourney?.schemes?.domicileState || []),
        ...(activeJourney?.schemes?.targetState || [])
      ].filter((v, idx, self) => self.findIndex(t => (t.id === v.id || t.name === v.name)) === idx);

  const journeyCategory = activeJourney?.goal_category || activeJourney?.category || (
    goalTitle.toLowerCase().includes('voter') || goalTitle.toLowerCase().includes('epic') ? 'National Identity & Electoral' :
    goalTitle.toLowerCase().includes('pan') ? 'Tax & Legal Identity' :
    goalTitle.toLowerCase().includes('ration') ? 'Food & Civil Supplies' :
    goalTitle.toLowerCase().includes('visa') ? 'Consular & Overseas Travel' :
    goalTitle.toLowerCase().includes('food') || goalTitle.toLowerCase().includes('business') ? 'Business & Commerce' :
    goalTitle.toLowerCase().includes('scholarship') ? 'Scholarships & Welfare' :
    goalTitle.toLowerCase().includes('australia') || goalTitle.toLowerCase().includes('master') ? 'Higher Education' :
    goalTitle.toLowerCase().includes('solar') || goalTitle.toLowerCase().includes('surya') ? 'Energy & Solar' :
    goalTitle.toLowerCase().includes('licence') || goalTitle.toLowerCase().includes('driving') ? 'Transport & Mobility' :
    goalTitle.toLowerCase().includes('farm') || goalTitle.toLowerCase().includes('kisan') ? 'Agriculture & Rural' :
    'General Welfare'
  );

  const journeyLocation = targetCity 
    ? `${targetCity}${targetState ? `, ${targetState}` : ''}`
    : domicileState ? `${domicileState}, India` : 'India';

  const departmentName = (
    goalTitle.toLowerCase().includes('voter') || goalTitle.toLowerCase().includes('epic') ? 'Election Commission of India (ECI)' :
    goalTitle.toLowerCase().includes('pan') ? 'Income Tax Department (CBDT)' :
    goalTitle.toLowerCase().includes('ration') ? 'Department of Food & Public Distribution' :
    goalTitle.toLowerCase().includes('visa') ? 'Ministry of External Affairs (MEA)' :
    goalTitle.toLowerCase().includes('passport') ? 'Ministry of External Affairs' :
    goalTitle.toLowerCase().includes('licence') || goalTitle.toLowerCase().includes('driving') ? 'Ministry of Road Transport & Highways' :
    goalTitle.toLowerCase().includes('food') || goalTitle.toLowerCase().includes('business') ? 'Ministry of MSME & FSSAI' :
    goalTitle.toLowerCase().includes('scholarship') || goalTitle.toLowerCase().includes('education') ? 'Ministry of Education' :
    goalTitle.toLowerCase().includes('kisan') || goalTitle.toLowerCase().includes('farm') ? 'Ministry of Agriculture & Farmers Welfare' :
    'National Public Services Authority'
  );

  const handleAddApplication = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isAddingApp || appAddedNotice) return;
    setIsAddingApp(true);

    const generatedAppId = `JS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newAppRecord = {
      id: generatedAppId,
      citizenName: 'Hriday Bardia',
      citizenId: '1111 2222 1405',
      service: goalTitle,
      department: departmentName,
      status: 'SUBMITTED' as const,
      submittedDate: new Date().toISOString().split('T')[0],
      lastUpdated: 'Just now',
      nextAction: 'e-KYC Cross-Verification via JanSetu Live Mesh',
      location: journeyLocation,
      sla: '48 Hours',
      documents: rawNeed.length > 0 ? rawNeed.map((d: any) => ({
        name: typeof d === 'string' ? d : (d.name || d.title || 'Verification Document'),
        status: 'PENDING_MATCH'
      })) : [
        { name: 'Aadhaar e-KYC Identity', status: 'VERIFIED' },
        { name: 'Proof of Address / Certificate', status: 'PENDING_MATCH' }
      ],
      timeline: [
        { title: 'Application Lodged', description: `Application successfully registered for ${goalTitle} through JanSetu Resident Gateway.`, timestamp: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'completed' },
        { title: 'Document & e-KYC Verification', description: 'Cross-matching verified identity documents across state geo-registries.', timestamp: 'In progress', status: 'current' },
        { title: 'Nodal Officer Approval', description: 'Digital sanction review by designated departmental nodal officer.', timestamp: '', status: 'pending' },
        { title: 'Direct Benefit / Smart Card Disbursal', description: 'Official dispatch via India Post Speed Post / Digital Locker token.', timestamp: '', status: 'pending' }
      ]
    };

    // Save to LiveSync and storage
    submitApplication(newAppRecord);
    
    // Also save journey if not started
    const generatedId = activeJourney?.journey_id || activeJourney?.journeyId || activeJourney?.id || `jrn_${Date.now()}`;
    const richSteps = buildRichJourneySteps(generatedId, goalTitle, journeyCategory, domicileState, targetCity || '');
    const firstActiveStep = richSteps.find((s: any) => s.state !== 'COMPLETED') || richSteps[0];
    const initialProgress = Math.round((richSteps.filter((s: any) => s.state === 'COMPLETED').length / richSteps.length) * 100);

    const newJourneyRecord = {
      id: generatedId,
      journey_id: generatedId,
      title: goalTitle,
      category: journeyCategory,
      goal_category: journeyCategory,
      citizenName: 'Hriday Bardia',
      status: 'In Progress' as const,
      state: 'IN_PROGRESS',
      progress: initialProgress,
      progress_percentage: initialProgress,
      currentStage: firstActiveStep.title,
      documentsReady: rawHave.length || 3,
      documentsTotal: (rawHave.length + rawNeed.length) || 6,
      nextAction: `Complete step: ${firstActiveStep.title}`,
      lastUpdated: 'Just now',
      timestamp: Date.now(),
      location: journeyLocation,
      location_state: domicileState,
      location_city: targetCity || '',
      steps: richSteps
    };
    startJourney(newJourneyRecord);

    setTimeout(() => {
      setIsAddingApp(false);
      setAppAddedNotice({ id: generatedAppId, service: goalTitle });
    }, 400);
  };

  const handleStartJourney = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isStarting) return;
    setIsStarting(true);

    const generatedId = activeJourney?.journey_id || activeJourney?.journeyId || activeJourney?.id || `jrn_${Date.now()}`;
    const richSteps = buildRichJourneySteps(generatedId, goalTitle, journeyCategory, domicileState, targetCity || '');
    const firstActiveStep = richSteps.find((s: any) => s.state !== 'COMPLETED') || richSteps[0];
    const initialProgress = Math.round((richSteps.filter((s: any) => s.state === 'COMPLETED').length / richSteps.length) * 100);

    const newJourneyRecord = {
      id: generatedId,
      journey_id: generatedId,
      title: goalTitle,
      category: journeyCategory,
      goal_category: journeyCategory,
      citizenName: 'Hriday Bardia',
      status: 'In Progress' as const,
      state: 'IN_PROGRESS',
      progress: initialProgress,
      progress_percentage: initialProgress,
      currentStage: firstActiveStep.title,
      documentsReady: rawHave.length || 3,
      documentsTotal: (rawHave.length + rawNeed.length) || 6,
      nextAction: `Complete step: ${firstActiveStep.title}`,
      lastUpdated: 'Just now',
      timestamp: Date.now(),
      location: journeyLocation,
      location_state: domicileState,
      location_city: targetCity || '',
      steps: richSteps,
      required_documents: rawNeed.length > 0 ? rawNeed.map((d: any) => ({
        name: typeof d === 'string' ? d : (d.name || d.title || 'Required Document'),
        verified: false,
        authority: d.authority || 'State Department / Central Agency'
      })) : [
        { name: "Aadhaar Card", verified: true, authority: "UIDAI" },
        { name: "Income Certificate", verified: true, authority: "Revenue Department" },
        { name: "Bank Passbook / Mandate", verified: true, authority: "NPCI / DBT" }
      ],
      eligibility_criteria: [
        { criterion: `Resident of ${domicileState || 'jurisdiction'}`, satisfied: true, note: "Validated via e-KYC" },
        { criterion: "Annual household income within statutory norms", satisfied: true, note: "Validated via Revenue Portal" },
        { criterion: "Statutory prerequisites and identity criteria met", satisfied: true, note: "Citizen profile compliant" }
      ],
      next_best_action: {
        action_type: "NEXT_STEP",
        description: `Proceed with step: ${firstActiveStep.title}`,
        priority: "HIGH",
        step_key: firstActiveStep.step_key || firstActiveStep.id,
        step_title: firstActiveStep.title,
        estimated_effort: firstActiveStep.estimated_effort || "1 business day"
      }
    };

    // 1. Add to LiveSyncContext
    startJourney(newJourneyRecord);

    // 2. Add to localStorage
    if (typeof window !== 'undefined') {
      try {
        const cached = JSON.parse(localStorage.getItem('jansetu_active_journeys') || '[]');
        const exists = cached.some((j: any) => 
          j.id === generatedId || 
          (j.title && j.title.trim().toLowerCase() === goalTitle.trim().toLowerCase())
        );
        const updated = exists 
          ? cached.map((j: any) => (j.id === generatedId || (j.title && j.title.trim().toLowerCase() === goalTitle.trim().toLowerCase())) ? { ...j, ...newJourneyRecord } : j)
          : [newJourneyRecord, ...cached];
        localStorage.setItem('jansetu_active_journeys', JSON.stringify(updated));
        localStorage.setItem('jansetu_journeys', JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save new journey to local storage", e);
      }
    }

    // 3. Smooth transition to the active interactive journey page
    setTimeout(() => {
      router.push(`/journeys/${generatedId}`);
    }, 300);
  };

  const isPuneFoodBiz = goalTitle.toLowerCase().includes("pune") && 
    (goalTitle.toLowerCase().includes("food") || goalTitle.toLowerCase().includes("business"));

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#020205] text-slate-900 dark:text-slate-100 py-8 px-4 md:px-8 font-sans transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb & Back */}
        <div className="flex items-center justify-between">
          <Link 
            href="/citizen/dashboard"
            className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 hover:text-[#133E87] dark:hover:text-blue-400 transition-colors py-1.5 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-2xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("common.back")}</span>
          </Link>
          <span className="text-[10px] font-bold text-[#133E87] dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
            {t("journeyPreview.previewRoute")}
          </span>
        </div>

        {/* Goal Hero Masthead Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 border-l-4 border-l-[#133E87] dark:border-l-blue-500 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-[#133E87] dark:text-blue-400 uppercase tracking-wider block">
                {t("journeyPreview.goalUnderstood")}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Compass className="w-6 h-6 text-[#133E87] dark:text-blue-500 shrink-0" />
                <span>{goalTitle}</span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 font-medium">
                  🏡 {t("journeyPreview.domicile")} <strong className="text-slate-900 dark:text-white font-bold">{domicileState}</strong>
                </span>
                {targetCity && (
                  <span className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 font-medium">
                    📍 {t("journeyPreview.location")} <strong className="text-slate-900 dark:text-white font-bold">{targetCity}{targetState ? `, ${targetState}` : ''}</strong>
                  </span>
                )}
                {targetCountry && !targetCity && (
                  <span className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 font-medium">
                    ✈️ {t("journeyPreview.destination")} <strong className="text-slate-900 dark:text-white font-bold">{targetCountry}</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={isAddingApp || !!appAddedNotice}
                  onClick={handleAddApplication}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition shadow-sm shrink-0 cursor-pointer ${
                    appAddedNotice 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' 
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isAddingApp ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#133E87] dark:text-blue-400" />
                      <span>Adding...</span>
                    </>
                  ) : appAddedNotice ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Added to Applications ✓</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-[#133E87] dark:text-blue-400" />
                      <span>Add to My Applications</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isStarting}
                  onClick={handleStartJourney}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shrink-0 cursor-pointer disabled:opacity-75"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      <span>Starting Journey...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                      <span>Start This Journey</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Success Banner when Added to Applications */}
          {appAddedNotice && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-300">
                    Application #{appAddedNotice.id} created successfully!
                  </span>
                  <p className="text-emerald-700 dark:text-emerald-400 text-[11px]">
                    Added to your National Applications tab and instantly synchronized to the Admin Scrutiny Portal.
                  </p>
                </div>
              </div>
              <Link
                href="/citizen/dashboard?tab=applications"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shrink-0 transition"
              >
                <span>View My Applications</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Section 01: Verified Documents in Your Digital Locker */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm border-l-4 border-l-emerald-500 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t("documents.verifiedDocuments")} ({rawHave.length})</span>
            </h2>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              DigiLocker / UIDAI Level-2 Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rawHave.length === 0 ? (
              <p className="text-slate-500 text-xs italic">{t("documents.noVerifiedDocuments")}</p>
            ) : (
              rawHave.map((doc: any, idx: number) => {
                const docName = doc.name || doc.title || "Identity Certificate";
                const portalInfo = getDocumentPortalInfo(docName);
                return (
                  <div 
                    key={idx} 
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between gap-3 text-xs hover:border-emerald-400/60 dark:hover:border-emerald-600/50 transition shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{docName}</span>
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {portalInfo.authority}
                        </p>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                        {t("documents.issuerVerified")}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">Source: {portalInfo.portalName}</span>
                      <a
                        href={portalInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#133E87] dark:text-blue-400 hover:underline font-bold cursor-pointer"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section 02: Documents You Need (With Official Procurement Portal Links) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm border-l-4 border-l-amber-500 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{t("documents.youNeed")} ({rawNeed.length})</span>
            </h2>
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400/80">
              Procure from Official Portals
            </span>
          </div>

          <div className="space-y-3">
            {rawNeed.length === 0 ? (
              <p className="text-slate-500 text-xs italic">{t("documents.allRequiredVerified")}</p>
            ) : (
              rawNeed.map((doc: any, idx: number) => {
                const docName = doc.name || doc.title || "Required Document";
                const portalInfo = getDocumentPortalInfo(docName);
                return (
                  <div 
                    key={idx} 
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:border-amber-400/60 dark:hover:border-amber-600/50 transition shadow-2xs"
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          • {docName}
                        </span>
                        <span className="text-[10px] bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          Action Required
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                        {doc.reason || doc.description || "Required for statutory validation, benefit sanction, or university admission."}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-500">
                        Issuing Authority: <span className="font-semibold text-slate-700 dark:text-slate-300">{portalInfo.authority}</span>
                      </p>
                    </div>

                    <a
                      href={portalInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs transition shadow-xs shrink-0 cursor-pointer"
                    >
                      <span>Apply on {portalInfo.portalName}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section 03: Government Support Schemes & Subsidies */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm border-l-4 border-l-[#133E87] dark:border-l-blue-500 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0B2545] dark:text-blue-400 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-[#133E87] dark:text-blue-400" />
              <span>{t("journeyPreview.relevantGovSupport")} ({schemesList.length})</span>
            </h2>
            <a
              href="https://www.myscheme.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#133E87] dark:text-blue-400 hover:underline font-bold cursor-pointer"
            >
              <span>Explore All Schemes on myScheme ↗</span>
            </a>
          </div>
          
          {schemesList.length === 0 ? (
            <p className="text-slate-500 text-xs italic">{t("journeyPreview.supportMatchesAppear")}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schemesList.map((scheme: any, idx: number) => {
                const schemePortal = scheme.portal_url || "https://www.myscheme.gov.in";
                return (
                  <div 
                    key={idx} 
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 rounded-xl p-4 flex flex-col justify-between gap-3 text-xs hover:border-blue-400/60 dark:hover:border-blue-600/50 transition shadow-2xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-[#133E87] dark:text-blue-300 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                          {scheme?.level || scheme?.governmentLevel || 'National Scheme'}
                        </span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                          Direct Benefit (DBT)
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white leading-tight text-sm">
                        {scheme?.name || scheme?.title}
                      </h4>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                        {scheme?.description || "Government welfare scheme designed to provide financial, operational, or academic enablement."}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Official Portal</span>
                      <a
                        href={schemePortal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 hover:bg-[#0B2545] hover:text-white dark:bg-blue-950/40 dark:hover:bg-blue-600 text-[#0B2545] dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 transition cursor-pointer"
                      >
                        <span>Official Portal Guidelines</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 04: Official Government Portals & Domain Gateways Directory */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm border-l-4 border-l-purple-600 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Contextual Official Government Portals & Gateways</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Verified national and state digital governance portals filtered specifically for <strong>{journeyCategory}</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAllPortals(prev => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold self-start sm:self-auto transition cursor-pointer"
            >
              <span>{showAllPortals ? "Show Contextual Only" : "Explore All 14,000+ Portals"}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-6">
            {DOMAIN_PORTALS.filter(cat => {
              if (showAllPortals) return true;
              const catLower = cat.domain.toLowerCase();
              const jLower = journeyCategory.toLowerCase();
              const gLower = goalTitle.toLowerCase();

              if (jLower.includes('education') || gLower.includes('scholarship') || gLower.includes('australia') || gLower.includes('master')) {
                return catLower.includes('scholarship') || catLower.includes('identity');
              }
              if (jLower.includes('business') || gLower.includes('food') || gLower.includes('restaurant') || gLower.includes('msme')) {
                return catLower.includes('business') || catLower.includes('identity');
              }
              if (jLower.includes('solar') || jLower.includes('energy') || gLower.includes('housing') || gLower.includes('pmay')) {
                return catLower.includes('energy') || catLower.includes('identity');
              }
              if (jLower.includes('agriculture') || jLower.includes('rural') || gLower.includes('kisan') || gLower.includes('farmer')) {
                return catLower.includes('healthcare') || catLower.includes('identity');
              }
              if (jLower.includes('electoral') || jLower.includes('tax') || jLower.includes('food & civil') || jLower.includes('transport') || gLower.includes('voter') || gLower.includes('pan') || gLower.includes('ration') || gLower.includes('driving')) {
                return catLower.includes('identity') || catLower.includes('scholarship');
              }
              return true;
            }).map((cat, catIdx) => {
              const IconComp = cat.icon;
              return (
                <div key={catIdx} className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <IconComp className="w-4 h-4 text-[#133E87] dark:text-purple-400" />
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white tracking-wide">
                      {cat.domain}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cat.portals.map((p, pIdx) => (
                      <a
                        key={pIdx}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 space-y-1.5 hover:border-[#133E87] dark:hover:border-purple-500 hover:shadow-xs transition block cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#133E87] dark:group-hover:text-purple-400 transition-colors flex items-center gap-1.5">
                            <span>{p.name}</span>
                            <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                          </span>
                          <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded font-semibold">
                            {p.authority}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {p.desc}
                        </p>
                        <div className="pt-1 flex items-center gap-1 text-[10px] text-[#133E87] dark:text-purple-400 font-bold">
                          <span>Visit Official Gateway</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 05: Multi-Step Interactive Workflow Roadmap */}
        {isPuneFoodBiz && (
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 transition-colors">
            <div>
              <span className="text-[10px] font-black text-[#133E87] dark:text-blue-400 uppercase tracking-widest block">{t("journeyPreview.yourJourney")}</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">Start a small food business in Pune, Maharashtra</h2>
            </div>

            {/* Identified Services */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">{t("journeyPreview.identifiedServices")}</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Identity verification</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Verified</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Address verification</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Verified</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Business registration</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">● In Progress</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Applicable licensing</span>
                  <span className="text-red-600 dark:text-red-400 font-bold animate-pulse">⚠ Action Required</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-3 flex items-center justify-between sm:col-span-2 md:col-span-1">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Govt support discovery</span>
                  <span className="text-blue-600 dark:text-cyan-400 font-bold">✓ Ready</span>
                </div>
              </div>
            </div>

            {/* Steps Timeline */}
            <div className="space-y-4 pt-2">
              <div className="relative border-l border-slate-300 dark:border-slate-800 ml-3 pl-6 space-y-6 text-xs">
                
                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-emerald-500 border border-white dark:border-slate-900" />
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">1. Verify identity</h4>
                      <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{t("journeyPreview.completed")}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <p><strong>Service:</strong> Identity Service (Aadhaar API)</p>
                      <p><strong>Department:</strong> UIDAI / Ministry of Electronics & IT</p>
                      <p><strong>Required Data:</strong> Aadhaar number, name</p>
                      <p><strong>Required Docs:</strong> Aadhaar Card</p>
                      <p><strong>Dependencies:</strong> None</p>
                      <p><strong>Connector:</strong> Modern REST API (OAuth 2.0)</p>
                      <p><strong>Est. Processing:</strong> Instant</p>
                      <p><strong>Official Portal:</strong> <a href="https://uidai.gov.in" target="_blank" rel="noopener noreferrer" className="text-[#133E87] dark:text-blue-400 hover:underline font-bold">uidai.gov.in ↗</a></p>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-emerald-500 border border-white dark:border-slate-900" />
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">2. Verify address</h4>
                      <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{t("journeyPreview.completed")}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <p><strong>Service:</strong> Address Verification Service</p>
                      <p><strong>Department:</strong> Revenue Department, Govt of Maharashtra</p>
                      <p><strong>Required Data:</strong> Address text, pincode</p>
                      <p><strong>Required Docs:</strong> Rent Agreement</p>
                      <p><strong>Dependencies:</strong> Step 1</p>
                      <p><strong>Connector:</strong> Modern REST API</p>
                      <p><strong>Est. Processing:</strong> Instant</p>
                      <p><strong>Official Portal:</strong> <a href="https://services.india.gov.in" target="_blank" rel="noopener noreferrer" className="text-[#133E87] dark:text-blue-400 hover:underline font-bold">services.india.gov.in ↗</a></p>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <div className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-amber-500 border border-white dark:border-slate-900" />
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">3. Register business (MSME / MSINS)</h4>
                      <span className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{t("journeyPreview.underVerification")}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <p><strong>Service:</strong> Business Registration (Single Window)</p>
                      <p><strong>Department:</strong> Maharashtra State Innovation Society (MSINS)</p>
                      <p><strong>Required Data:</strong> Business Name, PAN, Type</p>
                      <p><strong>Required Docs:</strong> Aadhaar Card, PAN Card</p>
                      <p><strong>Dependencies:</strong> Step 1, 2</p>
                      <p><strong>Connector:</strong> Modern REST API</p>
                      <p><strong>Est. Processing:</strong> 1-2 Days</p>
                      <p><strong>Official Portal:</strong> <a href="https://udyamregistration.gov.in" target="_blank" rel="noopener noreferrer" className="text-[#133E87] dark:text-blue-400 hover:underline font-bold">udyamregistration.gov.in ↗</a></p>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="relative">
                  <div className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-red-500 border border-white dark:border-slate-900 animate-pulse" />
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">4. Complete applicable licensing (Trade / FSSAI)</h4>
                      <span className="bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{t("journeyPreview.actionRequired")}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <p><strong>Service:</strong> Trade License / Food Safety</p>
                      <p><strong>Department:</strong> Pune Municipal Corporation (PMC) & FSSAI</p>
                      <p><strong>Required Data:</strong> Ward Number, Area Sqft, Business ID</p>
                      <p><strong>Required Docs:</strong> Aadhaar, Rent Agreement, Fire NOC</p>
                      <p><strong>Dependencies:</strong> Step 3</p>
                      <p><strong>Connector:</strong> Legacy SOAP Adapter (MunicipalServiceAdapter)</p>
                      <p><strong>Est. Processing:</strong> 3-5 Days</p>
                      <p><strong>Official Portal:</strong> <a href="https://foscos.fssai.gov.in" target="_blank" rel="noopener noreferrer" className="text-[#133E87] dark:text-blue-400 hover:underline font-bold">foscos.fssai.gov.in ↗</a></p>
                    </div>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="relative">
                  <div className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-800 border border-white dark:border-slate-900" />
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">5. Submit required applications</h4>
                      <span className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">{t("journeyPreview.pending")}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <p><strong>Service:</strong> Interoperability Registry Submission</p>
                      <p><strong>Department:</strong> Maharashtra State Innovation Society</p>
                      <p><strong>Required Data:</strong> Verified common data schemas</p>
                      <p><strong>Required Docs:</strong> Aadhaar, PAN, Rent Agreement</p>
                      <p><strong>Dependencies:</strong> Step 4</p>
                      <p><strong>Connector:</strong> Modern REST API</p>
                      <p><strong>Est. Processing:</strong> 1 Day</p>
                      <p><strong>Official Portal:</strong> <a href="https://services.india.gov.in" target="_blank" rel="noopener noreferrer" className="text-[#133E87] dark:text-blue-400 hover:underline font-bold">services.india.gov.in ↗</a></p>
                    </div>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="relative">
                  <div className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-800 border border-white dark:border-slate-900" />
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">6. Track all applications</h4>
                      <span className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">{t("journeyPreview.pending")}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <p><strong>Service:</strong> Unified tracking console</p>
                      <p><strong>Department:</strong> Citizen Portal</p>
                      <p><strong>Required Data:</strong> Transaction references</p>
                      <p><strong>Required Docs:</strong> None</p>
                      <p><strong>Dependencies:</strong> Step 5</p>
                      <p><strong>Connector:</strong> REST API</p>
                      <p><strong>Est. Processing:</strong> Real-time</p>
                      <p><strong>Action:</strong> Track in citizen dashboard</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Section 06: Direct Launch Interactive Workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 shadow-sm border-l-4 border-l-[#133E87] dark:border-l-blue-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#133E87] dark:text-blue-400 uppercase tracking-widest block">Interactive Real-Time Tracking & Submission</span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Ready to Execute and Track this Journey?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Add to your persistent applications ledger or launch the live multi-stage execution DAG console.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              disabled={isAddingApp || !!appAddedNotice}
              onClick={handleAddApplication}
              className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition shadow-sm shrink-0 cursor-pointer ${
                appAddedNotice
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700'
              }`}
            >
              {isAddingApp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#133E87] dark:text-blue-400" />
                  <span>Adding to Apps...</span>
                </>
              ) : appAddedNotice ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Added to Applications ✓</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-[#133E87] dark:text-blue-400" />
                  <span>Add to My Applications</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isStarting}
              onClick={handleStartJourney}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shrink-0 cursor-pointer disabled:opacity-75"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Launching Active Workflow...</span>
                </>
              ) : (
                <>
                  <span>Launch Active Workflow Console</span>
                  <ArrowRight className="w-4 h-4 text-amber-300" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
