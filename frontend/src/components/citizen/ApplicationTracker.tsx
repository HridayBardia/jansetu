'use client';

import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useLiveSync } from '@/context/LiveSyncContext';

export interface BenefitApplication {
  id: string;
  title: string;
  department: string;
  status: 'SUBMITTED' | 'UNDER_VERIFICATION' | 'APPROVED' | 'DISBURSED' | 'ACTION_REQUIRED';
  submittedDate: string;
  disbursementBank?: string;
  sanctionReference?: string;
  officerRemarks?: string;
  timeline?: {
    title: string;
    description: string;
    timestamp?: string;
    status: 'completed' | 'current' | 'pending';
  }[];
}

const DEFAULT_APPLICATIONS: BenefitApplication[] = [
  {
    id: 'JS-2026-8801',
    title: 'PM-KISAN Samman Nidhi Yojana',
    department: 'Ministry of Agriculture & Farmers Welfare',
    status: 'APPROVED',
    submittedDate: '2026-08-28',
    disbursementBank: 'State Bank of India (•••• •••• 4421)',
    sanctionReference: 'SANCTION/2026/AGRI-8801',
    officerRemarks: 'Landholding records cross-matched with Rajasthan Bhulekh Registry. 14th DBT installment queued for scheduled transfer.',
    timeline: [
      {
        title: 'Application Lodged',
        description: 'Application successfully registered through JanSetu Resident e-KYC Gateway.',
        timestamp: '2026-08-28 10:15',
        status: 'completed'
      },
      {
        title: 'Document & e-KYC Verification',
        description: 'Aadhaar demographic data and Land Records Khasra verified.',
        timestamp: '2026-08-28 11:30',
        status: 'completed'
      },
      {
        title: 'Nodal Officer Approval',
        description: 'Digital sanction signed by District Agriculture Nodal Officer.',
        timestamp: '2026-08-28 14:00',
        status: 'completed'
      },
      {
        title: 'Direct Benefit Transfer (DBT)',
        description: '₹2,000 disbursement order dispatched to NPCI mapper for account •••• 4421.',
        timestamp: '2026-08-28 15:45',
        status: 'current'
      }
    ]
  },
  {
    id: 'JS-2026-8802',
    title: 'National Apprenticeship Training Scheme (NATS)',
    department: 'Ministry of Education & Skill Development',
    status: 'UNDER_VERIFICATION',
    submittedDate: '2026-08-27',
    disbursementBank: 'State Bank of India (•••• •••• 4421)',
    sanctionReference: 'SANCTION/2026/EDU-8802',
    officerRemarks: 'Diploma certificate sent to AICTE National Academic Depository for digital authenticity check.',
    timeline: [
      {
        title: 'Application Lodged',
        description: 'Application successfully registered with NATS 2.0 portal.',
        timestamp: '2026-08-27 16:20',
        status: 'completed'
      },
      {
        title: 'Document & e-KYC Verification',
        description: 'Under digital verification with state polytechnic board records.',
        timestamp: '2026-08-28 09:10',
        status: 'current'
      },
      {
        title: 'Nodal Officer Approval',
        description: 'Awaiting stipend approval from Regional Director of Apprenticeship.',
        timestamp: '',
        status: 'pending'
      },
      {
        title: 'Direct Benefit Transfer (DBT)',
        description: 'Monthly stipend of ₹9,000 will be credited directly.',
        timestamp: '',
        status: 'pending'
      }
    ]
  }
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  SUBMITTED: {
    label: 'Pending Review',
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
  ACTION_REQUIRED: {
    label: 'Action Required',
    bg: 'bg-red-100 dark:bg-red-950/60',
    text: 'text-red-900 dark:text-red-300',
    border: 'border-red-300 dark:border-red-800'
  }
};

interface ApplicationTrackerProps {
  customApplications?: BenefitApplication[];
}

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({ customApplications }) => {
  const router = useRouter();
  const { t } = useLanguage();
  const { applications: liveApps } = useLiveSync();

  const formattedLiveApps: BenefitApplication[] = liveApps.map(a => ({
    id: a.id,
    title: a.service || (a as any).title || 'Welfare Scheme Application',
    department: a.department,
    status: (a.status === 'UNDER_REVIEW' ? 'UNDER_VERIFICATION' : a.status === 'DOCUMENTS_REQUIRED' ? 'ACTION_REQUIRED' : a.status) as any,
    submittedDate: a.submittedDate,
    disbursementBank: 'State Bank of India (•••• •••• 4421)',
    sanctionReference: `SANCTION/2026/JS-${a.id.replace(/\D/g, '') || '8801'}`,
    officerRemarks: a.nextAction || 'Demographic verification cross-matched across national registries.',
    timeline: (a.timeline && a.timeline.length > 0) ? (a.timeline as any) : [
      { title: 'Application Lodged', description: 'Application submitted via JanSetu Unified Gateway.', timestamp: a.submittedDate, status: 'completed' as ('completed' | 'current' | 'pending') },
      { title: 'Document & e-KYC Verification', description: 'Aadhaar demographic data and documents verified.', timestamp: a.lastUpdated, status: (a.status === 'SUBMITTED' ? 'current' : 'completed') as ('completed' | 'current' | 'pending') },
      { title: 'Nodal Officer Approval', description: 'Sanction allocation and digital signature.', timestamp: '', status: (a.status === 'APPROVED' ? 'completed' : a.status === 'SUBMITTED' ? 'pending' : 'current') as ('completed' | 'current' | 'pending') },
      { title: 'Direct Benefit Transfer (DBT)', description: 'Disbursement order dispatched to NPCI mapper.', timestamp: '', status: (a.status === 'APPROVED' ? 'current' : 'pending') as ('completed' | 'current' | 'pending') }
    ]
  }));

  const applications = customApplications && customApplications.length > 0 ? customApplications : formattedLiveApps;

  const [expandedAppId, setExpandedAppId] = useState<string | null>(applications[0]?.id || null);

  const toggleExpand = (id: string) => {
    setExpandedAppId(prev => prev === id ? null : id);
  };

  const handleDownloadReceipt = (app: BenefitApplication) => {
    const text = `
=====================================================
JANSETU APPLICATION STATUS RECEIPT
=====================================================
Application Reference: ${app.id}
Scheme Name:           ${app.title}
Ministry / Department: ${app.department}
Status:                ${app.status}
Submitted Date:        ${app.submittedDate}
Sanction Reference:    ${app.sanctionReference || 'PENDING'}
Disbursement Bank:     ${app.disbursementBank || 'SBI Direct DBT'}
Officer Notes:         ${app.officerRemarks || 'No active remarks'}
=====================================================
`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `JanSetu_${app.id}_Receipt.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#133E87] dark:text-blue-400" />
            <span>{t('National Benefit Application Tracker', 'National Benefit Application Tracker')}</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t('Real-time multi-stage telemetry showing identity verification, sanction approval, and direct bank disbursal.', 'Real-time multi-stage telemetry showing identity verification, sanction approval, and direct bank disbursal.')}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>{t('Real-Time National Telemetry Feed', 'Real-Time National Telemetry Feed')}</span>
        </div>
      </div>

      {/* Applications Collapsible Cards */}
      <div className="space-y-4">
        {applications.map((app) => {
          const isExpanded = expandedAppId === app.id;
          const statusStyle = STATUS_CONFIG[app.status] || STATUS_CONFIG.SUBMITTED;

          return (
            <div 
              key={app.id}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md shadow-xs transition-all overflow-hidden"
            >
              {/* Card Header Bar */}
              <div 
                onClick={() => toggleExpand(app.id)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#0B2545] dark:text-blue-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                      {app.id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                      {t(statusStyle.label, statusStyle.label)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {t(app.title, app.title)}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t(app.department, app.department)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right hidden sm:block">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">{t('Lodged Date', 'Lodged Date')}</span>
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
                      {t('Welfare Disbursal Progress', 'Welfare Disbursal Progress')}
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                      {[
                        { step: '01', title: t('Application Lodged', 'Application Lodged'), state: 'completed', desc: t('UIDAI e-KYC Received', 'UIDAI e-KYC Received') },
                        { step: '02', title: t('Document Verification', 'Document Verification'), state: app.status === 'SUBMITTED' ? 'current' : 'completed', desc: t('Interoperability Match', 'Interoperability Match') },
                        { step: '03', title: t('Nodal Officer Approval', 'Nodal Officer Approval'), state: app.status === 'APPROVED' || app.status === 'DISBURSED' ? 'completed' : 'current', desc: t('Digital Sanction Order', 'Digital Sanction Order') },
                        { step: '04', title: t('Direct Benefit Transfer', 'Direct Benefit Transfer'), state: app.status === 'DISBURSED' ? 'completed' : 'pending', desc: t('Aadhaar Seeded Bank', 'Aadhaar Seeded Bank') }
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
                    <div className="bg-slate-50 dark:bg-slate-950 rounded p-3.5 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5 text-[#133E87] dark:text-blue-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{t('Official Nodal Officer Telemetry', 'Official Nodal Officer Telemetry')}</span>
                        </span>
                        <span className="font-mono">{app.sanctionReference || 'SANCTION/2026/REF'}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        "{t(app.officerRemarks, app.officerRemarks)}"
                      </p>
                    </div>
                  )}

                  {/* Disbursement Bank & Download Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>{t('Direct Benefit Destination:', 'Direct Benefit Destination:')} <strong className="text-slate-900 dark:text-white">{app.disbursementBank || 'SBI Direct DBT Account'}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const journeyId = app.id === 'app_dl_001' ? 'jrn_003' : app.id === 'app_sch_002' ? 'jrn_002' : 'jrn_001';
                          router.push(`/journeys/${journeyId}`);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs border border-[#0B2545] dark:border-blue-500 transition cursor-pointer shadow-xs"
                      >
                        <span>{t('Track Workflow', 'Track Workflow')}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadReceipt(app)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t('Download Receipt', 'Download Receipt')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default ApplicationTracker;
