'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLiveSync } from '@/context/LiveSyncContext';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Building2, 
  CreditCard, 
  FileText, 
  Download, 
  Loader2, 
  Send, 
  Check, 
  AlertCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { SchemeProps } from '@/components/SchemeCard';

interface ApplicationModalProps {
  scheme: SchemeProps | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (newApplication: any) => void;
  onNavigateToTracker?: () => void;
}

const DEMO_BANK_ACCOUNTS = [
  {
    id: 'bank_sbi_1',
    bankName: 'State Bank of India',
    accountNumber: '•••• •••• 4421',
    ifsc: 'SBIN0001234',
    branch: 'Secretariat Branch, Jaipur',
    isDbtActive: true
  },
  {
    id: 'bank_pnb_2',
    bankName: 'Punjab National Bank',
    accountNumber: '•••• •••• 8892',
    ifsc: 'PUNB0123450',
    branch: 'Civil Lines, Jaipur',
    isDbtActive: false
  }
];

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  scheme,
  isOpen,
  onClose,
  onSubmitSuccess,
  onNavigateToTracker
}) => {
  const { user, profile } = useAuth();
  const { broadcastApplicationCreated } = useLiveSync();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedBankId, setSelectedBankId] = useState(DEMO_BANK_ACCOUNTS[0].id);
  const [isSelfDeclared, setIsSelfDeclared] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedAppId, setGeneratedAppId] = useState<string>('');
  const [declarationError, setDeclarationError] = useState(false);

  if (!isOpen || !scheme) return null;

  // Resolve active logged-in citizen specifically
  const citizenName = profile?.full_name || user?.full_name || 'Hriday Bardia';
  const aadhaarNumber = profile?.aadhaar || user?.id || '1111 2222 1405';
  const maskedAadhaar = `XXXX XXXX ${aadhaarNumber.replace(/\D/g, '').slice(-4) || '1405'}`;
  const address = `${profile?.location_city || 'Vadodara'}, ${profile?.location_state || 'Gujarat'}`;

  const handleNextStep = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
  };

  const handlePrevStep = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleSubmitApplication = () => {
    if (!isSelfDeclared) {
      setDeclarationError(true);
      return;
    }
    setDeclarationError(false);
    setIsSubmitting(true);

    setTimeout(() => {
      const code = Math.floor(1000 + Math.random() * 9000);
      const newId = `JS-2026-${code}`;
      setGeneratedAppId(newId);
      setIsSubmitting(false);
      setStep(4);

      const selectedBank = DEMO_BANK_ACCOUNTS.find(b => b.id === selectedBankId) || DEMO_BANK_ACCOUNTS[0];

      const newRecord = {
        id: newId,
        scheme_id: scheme.id,
        title: scheme.name,
        service: scheme.name,
        service_name: scheme.name,
        department: scheme.department,
        department_name: scheme.department,
        citizenName,
        citizenId: aadhaarNumber,
        status: 'SUBMITTED',
        submittedDate: new Date().toISOString().slice(0, 10),
        disbursementBank: `${selectedBank.bankName} (${selectedBank.accountNumber})`,
        sanctionReference: `SANCTION/2026/MEITY-${code}`,
        officerRemarks: 'Aadhaar e-KYC demographic cross-check successfully resolved. Forwarded to Nodal Welfare Officer for sanction allocation.',
        timeline: [
          {
            title: 'Application Lodged',
            description: 'Direct digital application submitted via JanSetu Unified Gateway.',
            timestamp: new Date().toISOString(),
            status: 'completed'
          },
          {
            title: 'Document & e-KYC Verification',
            description: 'Aadhaar demographic data and domicile records validated.',
            timestamp: new Date().toISOString(),
            status: 'completed'
          },
          {
            title: 'Nodal Officer Approval',
            description: 'Awaiting digital sanction signature from department officer.',
            timestamp: new Date().toISOString(),
            status: 'current'
          },
          {
            title: 'Direct Benefit Transfer (DBT)',
            description: `Scheduled to dispatch into ${selectedBank.bankName} (${selectedBank.accountNumber}).`,
            timestamp: '',
            status: 'pending'
          }
        ]
      };

      onSubmitSuccess(newRecord);

      // Broadcast event across in-browser live mesh for instant cross-tab Admin reaction
      broadcastApplicationCreated({
        id: newId,
        citizenName,
        citizenId: aadhaarNumber,
        service: scheme.name,
        department: scheme.department,
        status: 'SUBMITTED',
        submittedDate: new Date().toISOString().slice(0, 10),
        lastUpdated: 'Just now',
        nextAction: 'Nodal Officer Scrutiny & Sanction Allocation',
        location: address,
        sla: '48 Hours',
        documents: [
          { name: 'Aadhaar e-KYC Certificate', status: 'VERIFIED' },
          { name: 'Direct DBT Bank Mandate', status: 'VERIFIED' }
        ],
        timeline: newRecord.timeline
      });
    }, 1200);
  };

  const handleDownloadAck = () => {
    // Generate simulated download
    const ackContent = `
=====================================================
JANSETU NATIONAL CITIZEN WELFARE GATEWAY
OFFICIAL APPLICATION ACKNOWLEDGMENT RECEIPT
=====================================================
Application Reference: ${generatedAppId}
Date of Submission:    ${new Date().toLocaleDateString('en-GB')}
Scheme Name:           ${scheme.name}
Nodal Ministry:        ${scheme.department}
Beneficiary Name:      ${citizenName}
UIDAI Identity Token:  ${maskedAadhaar}
Disbursement Bank:     SBI (•••• •••• 4421)
DPDP Act Status:       Verified & Grounded
=====================================================
`;
    const blob = new Blob([ackContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `JanSetu_Receipt_${generatedAppId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div 
        className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh] overflow-y-auto space-y-6 animate-scale-up text-slate-900 dark:text-white"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                1-Click Direct Application
              </span>
              {step < 4 && (
                <span className="text-xs text-slate-400 font-mono">
                  Step {step} of 3
                </span>
              )}
            </div>
            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mt-1">
              {scheme.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{scheme.department}</p>
          </div>

          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: e-KYC Verification */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Your profile details have been automatically pre-filled from your authenticated UIDAI e-KYC record.</span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Applicant Full Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">{citizenName}</span>
                </div>
                <span className="text-emerald-500 text-[11px] font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Verified
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Aadhaar Identity Token</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{maskedAadhaar}</span>
                </div>
                <span className="text-emerald-500 text-[11px] font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Verified
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Verified Residential Address</span>
                  <span className="font-medium text-slate-900 dark:text-white">{address}</span>
                </div>
                <span className="text-emerald-500 text-[11px] font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition"
            >
              <span>Confirm e-KYC & Proceed</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Benefit Disbursement Account (DBT) */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Select Direct Benefit Transfer (DBT) Bank Account
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Financial assistance will be credited directly to your Aadhaar-seeded bank account.
              </p>
            </div>

            <div className="space-y-2.5">
              {DEMO_BANK_ACCOUNTS.map((bank) => (
                <label 
                  key={bank.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                    selectedBankId === bank.id 
                      ? 'border-amber-500 bg-amber-500/10 shadow-sm' 
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="dbtBank"
                      value={bank.id}
                      checked={selectedBankId === bank.id}
                      onChange={() => setSelectedBankId(bank.id)}
                      className="accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="space-y-0.5 text-xs">
                      <p className="font-bold text-slate-900 dark:text-white">{bank.bankName}</p>
                      <p className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">{bank.accountNumber} • IFSC: {bank.ifsc}</p>
                      <p className="text-[10px] text-slate-400">{bank.branch}</p>
                    </div>
                  </div>

                  {bank.isDbtActive && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Primary DBT
                    </span>
                  )}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition"
              >
                <span>Continue to Declaration</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Self Declaration & Final Submission */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Statutory Self-Declaration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Under the Digital Personal Data Protection (DPDP) Act 2023 & Scheme Guidelines.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2 text-slate-700 dark:text-slate-300">
              <p>
                1. I declare that the demographic and financial information furnished is true, authentic, and matches my Aadhaar records.
              </p>
              <p>
                2. I hereby authorize the Ministry of {scheme.department} to verify my land, income, or educational credentials via the JanSetu Interoperability Gateway.
              </p>
              <p>
                3. I understand that fraudulent claims are liable for recovery and legal action under government service rules.
              </p>
            </div>

            {/* Declaration Checkbox */}
            <label className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer text-xs transition ${
              isSelfDeclared 
                ? 'border-emerald-500 bg-emerald-500/10' 
                : declarationError 
                  ? 'border-red-500 bg-red-500/10' 
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'
            }`}>
              <input
                type="checkbox"
                checked={isSelfDeclared}
                onChange={(e) => {
                  setIsSelfDeclared(e.target.checked);
                  if (e.target.checked) setDeclarationError(false);
                }}
                className="mt-0.5 accent-emerald-500 w-4 h-4 cursor-pointer"
              />
              <span className="font-semibold text-slate-900 dark:text-slate-200 select-none">
                I agree to the statutory terms and confirm submission of this application.
              </span>
            </label>

            {declarationError && (
              <p className="text-[11px] text-red-500 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Please check the self-declaration box to continue.
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
              </button>
              <button
                type="button"
                onClick={handleSubmitApplication}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirm & Submit Application</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Success & Acknowledgment */}
        {step === 4 && (
          <div className="text-center py-4 space-y-5">
            <div className="w-16 h-16 bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                Application Successfully Registered
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
                Welfare Application Lodged
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your application has been assigned a national tracking reference:
              </p>
              <p className="text-lg font-mono font-black text-amber-600 dark:text-amber-400 mt-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl inline-block shadow-inner">
                {generatedAppId}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-left space-y-1.5 text-slate-700 dark:text-slate-300">
              <p>• <strong>Beneficiary:</strong> {citizenName} ({maskedAadhaar})</p>
              <p>• <strong>Scheme:</strong> {scheme.name}</p>
              <p>• <strong>Target DBT Bank:</strong> State Bank of India (•••• •••• 4421)</p>
              <p>• <strong>Telemetry:</strong> Real-time stage updates are now live in your Benefit Tracker.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadAck}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-500" />
                <span>Download Acknowledgment PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigateToTracker) {
                    onNavigateToTracker();
                  } else if (typeof window !== 'undefined') {
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.set('tab', 'applications');
                    window.history.pushState({}, '', newUrl.toString());
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                }}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                <span>View in Benefit Tracker</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ApplicationModal;
