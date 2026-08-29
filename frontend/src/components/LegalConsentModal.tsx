'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  AlertCircle, 
  ArrowRight, 
  Scale, 
  ChevronDown,
  Clock
} from 'lucide-react';

export interface LegalConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy';
  role?: 'citizen' | 'admin';
  onAccept?: () => void;
}

export const LegalConsentModal: React.FC<LegalConsentModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
  role = 'citizen',
  onAccept
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');
  const [countdown, setCountdown] = useState<number>(3);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync initial tab, reset scroll & initiate 3-second mandatory countdown
  useEffect(() => {
    let timer: any = null;

    if (isOpen) {
      setActiveTab(initialTab);
      setHasScrolledToBottom(false);
      setCountdown(3);

      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }

      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(3);
      setHasScrolledToBottom(false);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, initialTab]);

  // Handle scroll detection: scrollTop + clientHeight >= scrollHeight - 25
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 25) {
      setHasScrolledToBottom(true);
    }
  };

  // Switch tabs inside modal
  const handleTabSwitch = (tab: 'terms' | 'privacy') => {
    setActiveTab(tab);
    setHasScrolledToBottom(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  // Handle ESC key to dismiss
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const isAcceptUnlocked = hasScrolledToBottom && countdown === 0;

  const handleAgreeAndAccept = () => {
    if (!isAcceptUnlocked) return;
    if (onAccept) {
      onAccept();
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[85vh] transition-colors transform animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 flex-shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 px-2 py-0.5 rounded">
                DPDP & e-KYC Compliance
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Statutory Framework</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Legal Consent & Governance Policies
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition flex-shrink-0 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <button
            type="button"
            onClick={() => handleTabSwitch('terms')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-[#133E87] dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Scale size={16} />
            <span>Terms & Conditions</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('privacy')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck size={16} />
            <span>Privacy & e-KYC Policy</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="relative overflow-y-auto pr-3 my-4 space-y-5 text-slate-700 dark:text-slate-300 text-sm leading-relaxed custom-scrollbar max-h-[55vh]"
        >
          {activeTab === 'terms' ? (
            /* TERMS AND CONDITIONS CONTENT */
            <>
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/25 text-blue-900 dark:text-blue-200 text-xs flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#133E87] dark:text-blue-400 flex-shrink-0" />
                <span>
                  Please read the complete terms governing JanSetu Unified Citizen Gateway access, scheme routing, and administrative officer oversight.
                </span>
              </div>

              {/* Section 1 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-[#133E87] dark:text-blue-400 text-xs flex items-center justify-center font-bold">1</span>
                  Platform Access & Authorization Scope
                </h3>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">
                  JanSetu operates as an intelligent interoperability and public navigation gateway connecting citizens with central, state, and municipal welfare schemes. Access is authorized strictly for verified residents and certified nodal officers for the lawful discovery and processing of public welfare benefits under national e-Governance interoperability frameworks.
                </p>
              </div>

              {/* Section 2 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-[#133E87] dark:text-blue-400 text-xs flex items-center justify-center font-bold">2</span>
                  User Obligations & Credential Integrity
                </h3>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">
                  Users agree to provide accurate, verified information during Aadhaar e-KYC or Officer authentication. Automated scraping, load-testing, credential stuffing, brute-forcing simulated OTPs, or bypassing the dynamic Canvas Captcha mechanisms is strictly prohibited and subject to legal prosecution under the Information Technology Act.
                </p>
              </div>

              {/* Section 3 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-[#133E87] dark:text-blue-400 text-xs flex items-center justify-center font-bold">3</span>
                  Administrative Officer Non-Disclosure & Compliance
                </h3>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">
                  {role === 'admin' 
                    ? 'Departmental officers and system administrators accessing the telemetry console are bound by statutory Non-Disclosure Agreements (NDA). All cross-departmental queries, citizen profile lookups, rule adjustments, and dispute resolutions are cryptographically signed and permanently logged in tamper-evident audit trails.'
                    : 'System administrators and nodal officers operate under statutory non-disclosure frameworks ensuring strict multi-agency governance and operational segregation across public services.'}
                </p>
              </div>

              {/* Section 4 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-[#133E87] dark:text-blue-400 text-xs flex items-center justify-center font-bold">4</span>
                  Interoperability & Data Integrity
                </h3>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">
                  JanSetu orchestrates cross-agency entity resolution to identify discrepancies in citizen records (e.g. name spelling variations across Aadhaar, PAN, and Ration Card). Citizens agree to allow JanSetu to flag and reconcile conflicting data fields to ensure accurate benefit delivery.
                </p>
              </div>

              {/* Section 5 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-[#133E87] dark:text-blue-400 text-xs flex items-center justify-center font-bold">5</span>
                  Service Availability & Disclaimer of Warranty
                </h3>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">
                  While JanSetu targets high availability and low latency, integration with downstream departmental databases and DigiLocker repositories is subject to external API availability, scheduled maintenance cycles, and network conditions.
                </p>
              </div>
            </>
          ) : (
            /* PRIVACY POLICY & E-KYC CONTENT */
            <>
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/25 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>
                  JanSetu strictly adheres to the Digital Personal Data Protection (DPDP) Act and UIDAI e-KYC Data Minimization standards.
                </span>
              </div>

              {/* Section 1 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-center font-bold">1</span>
                  Data Minimization & Selective Demographic Extraction
                </h3>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">
                  Only the essential demographic attributes (Verified Full Name, Masked Mobile Number, Date of Birth, Gender, and State of Domicile) are retrieved during the 2-step OTP verification to evaluate scheme eligibility and auto-populate application dossiers.
                </p>
              </div>

              {/* Section 2 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-center font-bold">2</span>
                  Zero Plaintext Aadhaar Storage
                </h3>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">
                  Aadhaar numbers are processed strictly in transit through encrypted hardware security tunnels and are <strong>never stored in plaintext</strong> on local servers or persistent analytics databases. All persistent identifiers are tokenized using SHA-256 HMAC representations.
                </p>
              </div>

              {/* Section 3 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-center font-bold">3</span>
                  Ephemeral Session Retention & Auto-Purge
                </h3>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">
                  Authenticated session tokens expire automatically after 30 minutes of inactivity. When a citizen clicks Sign Out, closes the browser window, or triggers refresh confirmation, all decrypted in-memory profile stores and cached document previews are immediately wiped.
                </p>
              </div>

              {/* Section 4 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-center font-bold">4</span>
                  Audit Logging & Telemetry Integrity
                </h3>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">
                  System telemetry logs capture timestamped actions (e.g. login timestamps, scheme recommendation requests, application submissions) strictly for security monitoring, fraud prevention, and performance metrics without recording sensitive personal identity data.
                </p>
              </div>

              {/* Section 5 */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-center font-bold">5</span>
                  Citizen Consent & Revocation Controls
                </h3>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">
                  Citizens retain complete sovereign control over their verified data. You may inspect active agency data linkages, grant selective document access to welfare schemes, or revoke active data sharing anytime via the Privacy & Consent Dashboard.
                </p>
              </div>
            </>
          )}

          {/* Floating Scroll & Timer Helper Badge */}
          <div className="sticky bottom-1 left-0 right-0 flex justify-center pointer-events-none py-1">
            {!isAcceptUnlocked ? (
              <div className="px-4 py-1.5 rounded-full bg-slate-900 text-amber-300 border border-amber-500/60 text-xs font-bold flex items-center gap-2 shadow-lg backdrop-blur-md animate-bounce">
                {countdown > 0 ? (
                  <Clock size={14} className="text-amber-400 animate-pulse" />
                ) : (
                  <ChevronDown size={14} className="text-amber-400" />
                )}
                <span>
                  {!hasScrolledToBottom && countdown > 0
                    ? `Scroll to bottom & review document (${countdown}s remaining)`
                    : !hasScrolledToBottom && countdown === 0
                    ? 'Scroll to bottom to enable acceptance'
                    : `Scrolled to bottom. Unlocking in ${countdown}s...`}
                </span>
              </div>
            ) : (
              <div className="px-4 py-1.5 rounded-full bg-slate-900 text-emerald-300 border border-emerald-500/60 text-xs font-bold flex items-center gap-2 shadow-lg backdrop-blur-md">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>✓ Mandatory review complete. You may now accept.</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-bold text-xs md:text-sm transition cursor-pointer"
          >
            Cancel / Close
          </button>
          
          <button
            type="button"
            onClick={handleAgreeAndAccept}
            disabled={!isAcceptUnlocked}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition-all ${
              !isAcceptUnlocked
                ? 'opacity-40 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
                : 'bg-[#0B2545] hover:bg-[#133E87] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-md cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {!isAcceptUnlocked ? (
              <>
                <Lock size={15} />
                <span>
                  {countdown > 0
                    ? `Please Read & Scroll (${countdown}s)`
                    : 'Scroll to bottom to accept'}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>I Have Read & Agree</span>
              </>
            )}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-up {
          animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.6);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.8);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 1);
        }
      `}} />
    </div>
  );
};

export default LegalConsentModal;
