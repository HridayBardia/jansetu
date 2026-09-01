'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Building2, 
  CreditCard, 
  ShieldCheck, 
  Info,
  Calendar,
  ArrowRight,
  Search,
  Trash2,
  ExternalLink,
  PlusCircle,
  Eye,
  Check
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useLiveSync, ApplicationRecord, JourneyRecord } from '@/context/LiveSyncContext';
import { useAuth } from '@/context/AuthContext';
import { isCitizenMatching } from '@/lib/vaultDetection';

export interface BenefitApplication {
  id: string;
  title: string;
  department: string;
  status: 'SUBMITTED' | 'UNDER_VERIFICATION' | 'APPROVED' | 'DISBURSED' | 'ACTION_REQUIRED';
  submittedDate: string;
  disbursementBank?: string;
  sanctionReference?: string;
  officerRemarks?: string;
  journey_id?: string;
  location?: string;
  documents?: { name: string; status: string }[];
  timeline?: {
    title: string;
    description: string;
    timestamp?: string;
    status: 'completed' | 'current' | 'pending';
  }[];
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  SUBMITTED: {
    label: 'Submitted / Under Review',
    bg: 'bg-amber-100 dark:bg-amber-950/60',
    text: 'text-amber-900 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800'
  },
  UNDER_VERIFICATION: {
    label: 'Under Verification',
    bg: 'bg-blue-100 dark:bg-blue-950/60',
    text: 'text-blue-900 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-800'
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    bg: 'bg-blue-100 dark:bg-blue-950/60',
    text: 'text-blue-900 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-800'
  },
  DOCUMENTS_REQUIRED: {
    label: 'Documents Required',
    bg: 'bg-amber-100 dark:bg-amber-950/60',
    text: 'text-amber-900 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800'
  },
  ACTION_REQUIRED: {
    label: 'Action Required',
    bg: 'bg-red-100 dark:bg-red-950/60',
    text: 'text-red-900 dark:text-red-300',
    border: 'border-red-300 dark:border-red-800'
  },
  APPROVED: {
    label: 'Sanction Approved',
    bg: 'bg-emerald-100 dark:bg-emerald-950/60',
    text: 'text-emerald-900 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-800'
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-emerald-100 dark:bg-emerald-950/60',
    text: 'text-emerald-900 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-800'
  },
  DISBURSED: {
    label: 'DBT Disbursed',
    bg: 'bg-teal-100 dark:bg-teal-950/60',
    text: 'text-teal-900 dark:text-teal-300',
    border: 'border-teal-300 dark:border-teal-800'
  },
  REJECTED: {
    label: 'Rejected / Ineligible',
    bg: 'bg-rose-100 dark:bg-rose-950/60',
    text: 'text-rose-900 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-800'
  }
};

interface ApplicationTrackerProps {
  customApplications?: BenefitApplication[];
}

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({ customApplications }) => {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const { 
    applications: liveApps, 
    journeys: liveJourneys, 
    startJourney, 
    removeApplication 
  } = useLiveSync();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [viewDocsAppId, setViewDocsAppId] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  // Map LiveSync Applications strictly for THIS active logged-in citizen
  const activeCitName = (profile?.full_name || user?.full_name || '').toLowerCase().trim();
  const activeCitAadhaar = (profile?.aadhaar || user?.id || '').replace(/\D/g, '');
  const activeCitUsername = (user?.username || '').toLowerCase().trim();

  const applications: BenefitApplication[] = useMemo(() => {
    if (customApplications && customApplications.length > 0) {
      return customApplications;
    }

    // Filter live applications strictly belonging to this citizen
    const myLiveApps = liveApps.filter(a => {
      return isCitizenMatching(
        { citizenName: a.citizenName, citizenId: a.citizenId, appId: a.id },
        { name: activeCitName, aadhaar: activeCitAadhaar, username: activeCitUsername }
      );
    });

    return myLiveApps.map(a => {
      const statusKey = (
        a.status === 'UNDER_REVIEW' ? 'UNDER_VERIFICATION' :
        a.status === 'DOCUMENTS_REQUIRED' ? 'ACTION_REQUIRED' :
        a.status === 'COMPLETED' ? 'DISBURSED' :
        a.status
      ) as BenefitApplication['status'];

      const defaultTimeline: { title: string; description: string; timestamp?: string; status: 'completed' | 'current' | 'pending' }[] = [
        { 
          title: 'Application Lodged', 
          description: `Application registered for ${a.service} via JanSetu Citizen Gateway.`, 
          timestamp: a.submittedDate, 
          status: 'completed' 
        },
        { 
          title: 'Document & e-KYC Verification', 
          description: a.nextAction || 'Cross-matching verified credentials across state geo-registries.', 
          timestamp: a.lastUpdated || 'In progress', 
          status: a.status === 'SUBMITTED' ? 'current' : 'completed' 
        },
        { 
          title: 'Nodal Officer Approval', 
          description: 'Digital sanction review by designated departmental authority.', 
          timestamp: a.status === 'APPROVED' || a.status === 'COMPLETED' ? a.lastUpdated : '', 
          status: (a.status === 'APPROVED' || a.status === 'COMPLETED') ? 'completed' : a.status === 'SUBMITTED' ? 'pending' : 'current' 
        },
        { 
          title: 'Direct Benefit / Smart Card Disbursal', 
          description: 'Official dispatch via India Post Speed Post / Direct Benefit Transfer (DBT).', 
          timestamp: a.status === 'COMPLETED' ? a.lastUpdated : '', 
          status: a.status === 'COMPLETED' ? 'completed' : 'pending' 
        }
      ];

      return {
        id: a.id,
        title: a.service || (a as any).title || 'Welfare Service Application',
        department: a.department || 'National Government Authority',
        status: statusKey,
        submittedDate: a.submittedDate || new Date().toISOString().split('T')[0],
        disbursementBank: 'State Bank of India (•••• •••• 4421)',
        sanctionReference: `SANCTION/2026/JS-${a.id.replace(/\D/g, '') || '8801'}`,
        officerRemarks: a.nextAction || 'Demographic verification cross-matched across national registries.',
        location: a.location || 'Vadodara, Gujarat',
        documents: a.documents || [
          { name: 'Aadhaar e-KYC Identity', status: 'VERIFIED' },
          { name: 'Proof of Address / Certificate', status: 'PENDING_MATCH' }
        ],
        timeline: (a.timeline && a.timeline.length > 0) ? (a.timeline as any) : defaultTimeline
      };
    });
  }, [customApplications, liveApps, activeCitName, activeCitAadhaar, activeCitUsername]);

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = 
        app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.department.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = 
        selectedStatus === 'ALL' ||
        app.status === selectedStatus ||
        (selectedStatus === 'ACTIVE' && (app.status === 'SUBMITTED' || app.status === 'UNDER_VERIFICATION' || app.status === 'ACTION_REQUIRED'));

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchQuery, selectedStatus]);

  // Stats
  const stats = useMemo(() => {
    const total = applications.length;
    const approved = applications.filter(a => a.status === 'APPROVED' || a.status === 'DISBURSED').length;
    const underReview = applications.filter(a => a.status === 'SUBMITTED' || a.status === 'UNDER_VERIFICATION').length;
    const actionRequired = applications.filter(a => a.status === 'ACTION_REQUIRED').length;
    return { total, approved, underReview, actionRequired };
  }, [applications]);

  const toggleExpand = (id: string) => {
    setExpandedAppId(prev => prev === id ? null : id);
  };

  // Track Application: Route accurately to matching journey or instantiate journey
  const handleTrackApplication = (app: BenefitApplication) => {
    // 1. Try to find matching journey in liveJourneys
    const appTitleClean = app.title.toLowerCase().trim();
    let matchingJourney = liveJourneys.find(j => {
      if (j.id === app.id || (app as any).journey_id === j.id) return true;
      const jTitleClean = (j.title || '').toLowerCase().trim();
      return (
        jTitleClean.includes(appTitleClean.slice(0, 10)) ||
        appTitleClean.includes(jTitleClean.slice(0, 10))
      );
    });

    if (matchingJourney) {
      router.push(`/journeys/${matchingJourney.id}`);
      return;
    }

    // 2. If not found in active list, dynamically instantiate a matching Journey Record
    const generatedJourneyId = (app as any).journey_id || `jrn_${app.id.replace(/\D/g, '') || Date.now()}`;
    const newJourneyRecord: Partial<JourneyRecord> = {
      id: generatedJourneyId,
      journey_id: generatedJourneyId,
      title: app.title,
      category: app.department || 'National Public Services',
      goal_category: app.department || 'National Public Services',
      citizenName: 'Hriday Bardia',
      status: (app.status === 'APPROVED' || app.status === 'DISBURSED' ? 'Completed' : 'In Progress') as any,
      state: app.status === 'APPROVED' ? 'APPROVED' : 'IN_PROGRESS',
      progress: app.status === 'APPROVED' ? 85 : app.status === 'DISBURSED' ? 100 : 40,
      progress_percentage: app.status === 'APPROVED' ? 85 : app.status === 'DISBURSED' ? 100 : 40,
      currentStage: app.status === 'APPROVED' ? 'Direct Benefit Transfer' : 'Document & e-KYC Verification',
      documentsReady: 3,
      documentsTotal: 4,
      nextAction: app.officerRemarks || 'Track real-time multi-departmental dispatch telemetry',
      lastUpdated: 'Just now',
      timestamp: Date.now(),
      location: app.location || 'Vadodara, Gujarat',
      location_state: 'Gujarat',
      steps: (app.timeline || []).map((t, idx) => ({
        id: `step_${idx + 1}`,
        step_key: `step_${idx + 1}`,
        title: t.title,
        department: app.department,
        authority: app.department,
        state: t.status === 'completed' ? 'COMPLETED' : t.status === 'current' ? 'IN_PROGRESS' : 'PENDING',
        progress: t.status === 'completed' ? 100 : t.status === 'current' ? 50 : 0,
        description: t.description,
        estimated_effort: '1 business day',
        official_source_url: 'https://services.india.gov.in'
      })),
      required_documents: (app.documents || []).map(d => ({
        name: d.name,
        verified: d.status === 'VERIFIED',
        authority: app.department
      }))
    };

    startJourney(newJourneyRecord);

    setTimeout(() => {
      router.push(`/journeys/${generatedJourneyId}`);
    }, 250);
  };

  const handleWithdrawApplication = (appId: string) => {
    if (confirm(`Are you sure you want to withdraw application #${appId}? This will remove it from the citizen portal and officer scrutiny queue.`)) {
      if (removeApplication) {
        removeApplication(appId);
      }
      setWithdrawingId(null);
    }
  };

  const handleDownloadReceipt = (app: BenefitApplication) => {
    const text = `
================================================================================
                    JANSETU NATIONAL CITIZEN PORTAL
              OFFICIAL APPLICATION STATUS ACKNOWLEDGEMENT
================================================================================
Date of Generation:    ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
Application Reference: ${app.id}
Applicant Full Name:   Hriday Bardia
Citizen Identifier:    1111 2222 1405 (Aadhaar Seeded)
--------------------------------------------------------------------------------
SCHEME / SERVICE DETAILS:
Service Title:         ${app.title}
Nodal Department:      ${app.department}
Current Status:        ${app.status}
Date of Submission:    ${app.submittedDate}
Jurisdiction Location: ${app.location || 'India'}
Sanction Reference:    ${app.sanctionReference || 'SANCTION/2026/JS-8801'}
Disbursement Account:  ${app.disbursementBank || 'State Bank of India (•••• •••• 4421)'}
--------------------------------------------------------------------------------
OFFICIAL OFFICER REMARKS:
"${app.officerRemarks || 'Statutory e-KYC cross-verified via JanSetu Multi-Cloud Mesh.'}"
--------------------------------------------------------------------------------
ATTACHED CREDENTIALS & VERIFICATION:
${(app.documents || [
  { name: 'Aadhaar e-KYC Identity Certificate', status: 'VERIFIED' },
  { name: 'State Domicile / Land Record', status: 'VERIFIED' }
]).map(d => `• [${d.status}] ${d.name}`).join('\n')}
--------------------------------------------------------------------------------
This is an electronically generated receipt verified by the Government of India
Unified Service Registry. No physical signature is required.
================================================================================
`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `JanSetu_${app.id}_Acknowledgement.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#133E87] dark:text-blue-400" />
            <span>National Benefit & Legal Application Ledger</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Real-time telemetry showing identity verification, nodal officer review, and direct statutory benefit delivery.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Synced with Officer Scrutiny Portal</span>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Applications</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Sanction Approved</span>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">{stats.approved}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Under Review</span>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono">{stats.underReview}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Action Required</span>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">{stats.actionRequired}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by scheme name, Application ID (e.g. JS-2026-8801), or Ministry..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#133E87]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'SUBMITTED', label: 'Submitted' },
            { id: 'UNDER_VERIFICATION', label: 'Verifying' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'ACTION_REQUIRED', label: 'Action Required' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] whitespace-nowrap transition cursor-pointer ${
                selectedStatus === tab.id
                  ? 'bg-[#0B2545] dark:bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApps.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No applications match your criteria</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Search in Goal Planner for documents like Voter ID, Passport, PAN Card, or Ration Card and click "Add to My Applications" to populate this tracker.
              </p>
            </div>
          </div>
        ) : (
          filteredApps.map((app) => {
            const isExpanded = expandedAppId === app.id;
            const isDocsOpen = viewDocsAppId === app.id;
            const statusStyle = STATUS_CONFIG[app.status] || STATUS_CONFIG.SUBMITTED;

            return (
              <div 
                key={app.id}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-xs transition-all overflow-hidden"
              >
                {/* Card Header Bar */}
                <div 
                  onClick={() => toggleExpand(app.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#0B2545] dark:text-blue-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                        {app.id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                        {statusStyle.label}
                      </span>
                      {app.location && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                          📍 {app.location}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {app.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{app.department}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right hidden sm:block">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Lodged Date</span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{app.submittedDate}</span>
                    </div>

                    <button 
                      type="button"
                      className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-5 animate-fade-in">
                    {/* 4-Stage Stepper */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
                        Lifecycle & Verification Telemetry
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                        {[
                          { step: '01', title: 'Application Lodged', state: 'completed', desc: 'UIDAI e-KYC Received' },
                          { step: '02', title: 'Document Verification', state: app.status === 'SUBMITTED' ? 'current' : 'completed', desc: 'Interoperability Match' },
                          { step: '03', title: 'Nodal Officer Approval', state: app.status === 'APPROVED' || app.status === 'DISBURSED' ? 'completed' : 'current', desc: 'Digital Sanction Order' },
                          { step: '04', title: 'Benefit Disbursal', state: app.status === 'DISBURSED' ? 'completed' : 'pending', desc: 'Direct Speed Post / DBT' }
                        ].map((st, idx) => (
                          <div 
                            key={idx}
                            className={`p-3 rounded border text-xs space-y-1 ${
                              st.state === 'completed'
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                                : st.state === 'current'
                                  ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 shadow-2xs'
                                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-[10px]">{st.step}</span>
                              {st.state === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : st.state === 'current' ? (
                                <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                              )}
                            </div>
                            <p className="font-bold text-slate-900 dark:text-white mt-1">{st.title}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{st.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Nodal Officer Remarks Card */}
                    {app.officerRemarks && (
                      <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3.5 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5 text-[#133E87] dark:text-blue-400">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Official Officer Scrutiny Note</span>
                          </span>
                          <span className="font-mono">{app.sanctionReference || 'SANCTION/2026/REF'}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          "{app.officerRemarks}"
                        </p>
                      </div>
                    )}

                    {/* Expandable Attached Documents Panel */}
                    {isDocsOpen && (
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 animate-fade-in text-xs">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-[#133E87] dark:text-blue-400" />
                            <span>Attached Supporting Documents & Verifications</span>
                          </h4>
                          <span className="text-[10px] text-slate-500">Cross-checked via JanSetu Mesh</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(app.documents || [
                            { name: 'Aadhaar e-KYC Identity Card', status: 'VERIFIED' },
                            { name: 'State Domicile / Land Records Certificate', status: 'VERIFIED' }
                          ]).map((doc, dIdx) => (
                            <div key={dIdx} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-2">{doc.name}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                                doc.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}>
                                {doc.status === 'VERIFIED' ? '✓ Verified' : '● In Scrutiny'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Disbursement Bank & Dynamic Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span>Direct Benefit Destination: <strong className="text-slate-900 dark:text-white">{app.disbursementBank || 'SBI Direct DBT Account'}</strong></span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Track Application (Directly opens matching Journey) */}
                        <button
                          type="button"
                          onClick={() => handleTrackApplication(app)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs border border-[#0B2545] dark:border-blue-500 transition cursor-pointer shadow-xs"
                        >
                          <span>Track Application</span>
                          <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                        </button>

                        {/* View Documents Toggle */}
                        <button
                          type="button"
                          onClick={() => setViewDocsAppId(prev => prev === app.id ? null : app.id)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isDocsOpen ? 'Hide Docs' : 'View Documents'}</span>
                        </button>

                        {/* Download Official Receipt */}
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(app)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>

                        {/* Withdraw Application */}
                        <button
                          type="button"
                          onClick={() => handleWithdrawApplication(app.id)}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-800/80 transition cursor-pointer"
                          title="Withdraw Application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Withdraw</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ApplicationTracker;
