'use client';

import React, { useState, useRef } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  FolderLock, 
  Upload, 
  Loader2, 
  X, 
  ShieldCheck,
  Building2,
  FileText
} from 'lucide-react';
import { useLiveSync } from '@/context/LiveSyncContext';
import { checkDocInVault } from '@/lib/vaultDetection';
import { eventBus } from '@/utils/eventBus';

export const ActiveAlertBanner: React.FC = () => {
  const { pendingKycRequest, authorizeCitizenDoc, dismissPendingKycRequest } = useLiveSync();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOfficerPortal = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  if (!pendingKycRequest || isOfficerPortal) return null;

  const { appId, citizenName, docName, dept } = pendingKycRequest;
  const vaultCheck = checkDocInVault(docName);

  const handleShareFromVault = async () => {
    setIsAuthorizing(true);
    setTimeout(() => {
      authorizeCitizenDoc({
        appId,
        docName,
        dept,
        citizenName
      });

      // Post back to unified bus
      eventBus.postMessage({
        type: 'DOC_KYC_FULFILLED',
        payload: {
          appId,
          docTitle: docName,
          docName,
          citizenName,
          dept,
          status: 'VERIFIED',
          timestamp: new Date().toLocaleTimeString()
        }
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
        dept,
        citizenName
      });

      eventBus.postMessage({
        type: 'DOC_KYC_FULFILLED',
        payload: {
          appId,
          docTitle: docName,
          docName: `${docName} (${file.name})`,
          citizenName,
          dept,
          status: 'VERIFIED',
          timestamp: new Date().toLocaleTimeString()
        }
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

  const handleDismiss = () => {
    dismissPendingKycRequest(appId);
  };

  return (
    <div className="w-full my-4 animate-scaleUp">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        className="hidden"
      />
      <div className="bg-amber-50 dark:bg-amber-950/80 border-2 border-amber-500 rounded-2xl p-5 md:p-6 shadow-xl text-slate-900 dark:text-white space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <h3 className="text-sm md:text-base font-black text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                  🔔 URGENT ACTION REQUIRED: {docName.toLowerCase().includes('aadhaar') || docName.toLowerCase().includes('kyc') ? 'e-KYC Verification' : 'Document Request'} for {docName}
                </h3>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
                <span>Requested by <strong>{dept}</strong></span>
                <span>•</span>
                <span className="font-mono text-purple-700 dark:text-purple-300 font-bold">App #{appId}</span>
                <span>•</span>
                <span>Beneficiary: <strong>{citizenName}</strong></span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Dismiss Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Vault Intelligence Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/70 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 text-xs">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Department Scrutiny Document: <strong>{docName}</strong>
            </span>
          </div>

          {vaultCheck.isInVault ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>✓ Verified Record Found in Document Vault (DigiLocker)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/60 px-3 py-1 rounded-lg border border-amber-300 dark:border-amber-700 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>⚠️ Document Not Found in Digital Vault</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        {authSuccess ? (
          <div className="bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 p-3.5 rounded-xl flex items-center gap-2 text-xs font-bold animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>✓ Attested {uploadedName || docName} securely shared with {dept}. Status updated to VERIFIED!</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>DPDP Act 2023 End-to-End Cryptographic Token</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleDismiss}
                disabled={isAuthorizing || isUploading}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition cursor-pointer disabled:opacity-50"
              >
                Dismiss
              </button>

              {vaultCheck.isInVault ? (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAuthorizing || isUploading}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleShareFromVault}
                    disabled={isAuthorizing || isUploading}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                  >
                    {isAuthorizing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sharing from Vault...</span>
                      </>
                    ) : (
                      <>
                        <FolderLock className="w-4 h-4" />
                        <span>⚡ Share {docName} from Document Vault</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAuthorizing || isUploading}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading {docName}...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>📤 Upload {docName}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
