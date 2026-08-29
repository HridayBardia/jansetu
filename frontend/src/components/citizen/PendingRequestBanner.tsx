'use client';

import React, { useState, useRef } from 'react';
import { useLiveSync } from '@/context/LiveSyncContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Loader2, 
  ExternalLink,
  Sparkles,
  Lock,
  FileCheck,
  Building2,
  Upload,
  FolderLock
} from 'lucide-react';
import { checkDocInVault } from '@/lib/vaultDetection';

export const PendingRequestBanner: React.FC = () => {
  const { pendingKycRequest, authorizeCitizenDoc, dismissPendingKycRequest } = useLiveSync();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smart check if the requested document is present in the Citizen's Document Vault
  const vaultCheck = checkDocInVault(pendingKycRequest?.docName || '');

  const isOfficerPortal = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  if (!pendingKycRequest || isOfficerPortal) return null;

  const { appId, citizenName, docName, dept } = pendingKycRequest;

  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    setTimeout(() => {
      authorizeCitizenDoc({
        appId,
        docName,
        dept
      });
      setIsAuthorizing(false);
      setAuthSuccess(true);
      setTimeout(() => {
        setAuthSuccess(false);
        dismissPendingKycRequest(appId);
      }, 2500);
    }, 1000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedName(file.name);
    setIsUploading(true);
    setTimeout(() => {
      authorizeCitizenDoc({
        appId,
        docName: `${docName} (${file.name})`,
        dept
      });
      setIsUploading(false);
      setAuthSuccess(true);
      setTimeout(() => {
        setAuthSuccess(false);
        setUploadedName(null);
        dismissPendingKycRequest(appId);
      }, 2500);
    }, 1200);
  };

  const handleDecline = () => {
    dismissPendingKycRequest(appId);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-lg w-[calc(100vw-3rem)] animate-slide-up shadow-2xl">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        className="hidden"
      />
      <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-5 shadow-2xl text-slate-900 dark:text-white space-y-4 backdrop-blur-lg">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>⚠️ Action Required: Department {docName.toLowerCase().includes('aadhaar') || docName.toLowerCase().includes('kyc') ? 'e-KYC ' : ''}Request</span>
              </h4>
              <p className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-semibold">
                Application #{appId} • Live Mesh
              </p>
            </div>
          </div>
          <button
            onClick={handleDecline}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Dismiss request"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Text */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3.5 text-xs text-slate-800 dark:text-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
            <Building2 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
            <span>{dept}</span>
          </div>
          <p className="leading-relaxed">
            The department has requested {docName.toLowerCase().includes('aadhaar') || docName.toLowerCase().includes('kyc') ? 'verified e-KYC credentials for' : 'a verified copy of'} <strong>{docName}</strong> to finalize processing for beneficiary <strong>{citizenName}</strong>.
          </p>

          {/* Vault Detection Status */}
          {(() => {
            const vaultCheck = checkDocInVault(docName);
            if (vaultCheck.isInVault) {
              return (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>✓ Verified Record Found in Document Vault (DigiLocker)</span>
                </div>
              );
            }
            return (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-900 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>⚠️ Document Not Found in Digital Vault</span>
              </div>
            );
          })()}

          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-0.5">
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
              <ShieldCheck className="w-3 h-3" />
              <span>DPDP Act 2023 Compliant</span>
            </span>
            <span>• 256-bit Encrypted Token</span>
          </div>
        </div>

        {/* Success State or Action CTAs */}
        {authSuccess ? (
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 p-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>✓ {uploadedName || docName} credential token generated & shared with {dept}.</span>
          </div>
        ) : (
          (() => {
            const vaultCheck = checkDocInVault(docName);
            return (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={isAuthorizing || isUploading}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition cursor-pointer disabled:opacity-50 text-center"
                >
                  Dismiss
                </button>

                {vaultCheck.isInVault ? (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isAuthorizing || isUploading}
                      className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleAuthorize}
                      disabled={isAuthorizing || isUploading}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isAuthorizing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sharing from Vault...</span>
                        </>
                      ) : (
                        <>
                          <FolderLock className="w-3.5 h-3.5" />
                          <span>⚡ Share from Document Vault</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isAuthorizing || isUploading}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading Document...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Required Document</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleAuthorize}
                      disabled={isAuthorizing || isUploading}
                      className="px-3.5 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
                    >
                      {isAuthorizing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Attesting...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Attest via Registry</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};

export default PendingRequestBanner;
