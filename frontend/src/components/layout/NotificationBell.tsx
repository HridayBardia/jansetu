'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLiveSync } from '@/context/LiveSyncContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  Bell, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Loader2, 
  ExternalLink,
  Sparkles,
  Building2,
  FileText,
  ChevronRight,
  Upload,
  FolderLock
} from 'lucide-react';

import { checkDocInVault } from '@/lib/vaultDetection';

export const NotificationBell: React.FC = () => {
  const { 
    notifications, 
    pendingKycRequest, 
    authorizeCitizenDoc, 
    dismissPendingKycRequest,
    markAllAsRead 
  } = useLiveSync();
  const { user, profile, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // pendingKycRequest and notifications are already strictly persona-filtered in LiveSyncContext
  const isOfficerPortal = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  const activePendingKyc = isOfficerPortal ? null : pendingKycRequest;

  // Smart check if the requested document is present in the Citizen's Document Vault
  const vaultCheck = checkDocInVault(activePendingKyc?.docName || '');

  // Strict citizen-filtered notification count
  const unreadNotifs = notifications.filter(n => n.isNew);
  const newNotifsCount = hasViewed ? 0 : (unreadNotifs.length + (activePendingKyc ? 1 : 0));

  // Reset hasViewed if a brand new pending KYC arrives or new unread notification arrives
  useEffect(() => {
    if (activePendingKyc || unreadNotifs.length > 0) {
      setHasViewed(false);
    }
  }, [activePendingKyc?.appId, activePendingKyc?.docName, unreadNotifs.length]);

  // Handle open toggle and clear unread badge counter immediately
  const handleToggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setHasViewed(true);
      markAllAsRead();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const isLoginPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/login');
  if (isLoginPage) {
    return null;
  }

  // Option 1: Authorize from Document Vault / State Geo-Registry
  const handleAuthorizeFromVault = async () => {
    if (!activePendingKyc) return;
    setIsAuthorizing(true);

    setTimeout(() => {
      authorizeCitizenDoc({
        appId: activePendingKyc.appId,
        docName: activePendingKyc.docName,
        dept: activePendingKyc.dept
      });
      setIsAuthorizing(false);
      setAuthSuccess(true);
      setTimeout(() => {
        setAuthSuccess(false);
        dismissPendingKycRequest(activePendingKyc.appId);
      }, 2500);
    }, 1000);
  };

  // Option 2: Upload Document File Directly
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activePendingKyc) return;

    setUploadedFileName(file.name);
    setIsUploading(true);

    setTimeout(() => {
      authorizeCitizenDoc({
        appId: activePendingKyc.appId,
        docName: `${activePendingKyc.docName} (${file.name})`,
        dept: activePendingKyc.dept
      });
      setIsUploading(false);
      setAuthSuccess(true);
      setTimeout(() => {
        setAuthSuccess(false);
        setUploadedFileName(null);
        dismissPendingKycRequest(activePendingKyc.appId);
      }, 2500);
    }, 1200);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Hidden File Input for Direct Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        className="hidden"
      />

      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleToggleOpen}
        className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#133E87]"
        title="Notifications & Action Requests"
        aria-label="Notifications"
      >
        <Bell className={`w-4 h-4 ${newNotifsCount > 0 ? 'text-[#133E87] dark:text-blue-400' : 'text-slate-500'}`} />

        {/* Dynamic Indicator Badge (Cleared upon clicking/viewing) */}
        {newNotifsCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] px-1 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-black text-[10px] shadow-sm animate-pulse">
            {newNotifsCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scaleUp text-slate-900 dark:text-white">
          {/* Dropdown Header */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#133E87] dark:text-blue-400" />
              <h3 className="font-bold text-xs">Notifications & Department Requests</h3>
              {newNotifsCount > 0 && (
                <span className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {newNotifsCount} New
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action-Required Card for Pending Department e-KYC / Document Request */}
          {activePendingKyc && (
            <div className="p-3.5 bg-amber-500/10 border-b-2 border-amber-500/30 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 leading-tight">
                      Action Required: Document e-KYC Request
                    </h4>
                    <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400">
                      Application #{activePendingKyc.appId}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 space-y-1.5">
                <p className="font-medium">
                  <strong>{activePendingKyc.dept}</strong> has requested verified credential:
                </p>
                <div className="flex items-center justify-between gap-1">
                  <p className="text-amber-900 dark:text-amber-300 font-bold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{activePendingKyc.docName}</span>
                  </p>
                </div>

                {/* Vault Intelligence Badge */}
                {vaultCheck.isInVault ? (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-300 dark:border-emerald-800 font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>✓ Verified Record Found in Document Vault (DigiLocker)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-900 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-950/60 px-2 py-1 rounded-md border border-amber-300 dark:border-amber-800 font-semibold">
                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>⚠️ Document Not Found in Digital Vault</span>
                  </div>
                )}
              </div>

              {authSuccess ? (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>✓ {uploadedFileName || activePendingKyc.docName} submitted & verified!</span>
                </div>
              ) : (
                <div className="space-y-2 pt-0.5">
                  {/* Dynamic Action Options based on Vault Detection */}
                  {vaultCheck.isInVault ? (
                    <div className="grid grid-cols-2 gap-2">
                      {/* Primary Action: Direct Share from Document Vault */}
                      <button
                        type="button"
                        disabled={isAuthorizing || isUploading}
                        onClick={handleAuthorizeFromVault}
                        className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Share directly using verified credentials in Document Vault"
                      >
                        {isAuthorizing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Sharing...</span>
                          </>
                        ) : (
                          <>
                            <FolderLock className="w-3.5 h-3.5" />
                            <span>⚡ Share from Vault</span>
                          </>
                        )}
                      </button>

                      {/* Secondary Action: Upload Alternative File */}
                      <button
                        type="button"
                        disabled={isAuthorizing || isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Upload a different document copy"
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
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {/* Primary Action: Upload Document File */}
                      <button
                        type="button"
                        disabled={isAuthorizing || isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[11px] shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Upload required document from device"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Document</span>
                          </>
                        )}
                      </button>

                      {/* Secondary Action: Authorize via State Registry */}
                      <button
                        type="button"
                        disabled={isAuthorizing || isUploading}
                        onClick={handleAuthorizeFromVault}
                        className="px-2.5 py-2 bg-emerald-700/80 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Attest via State Registry"
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
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                    <Link 
                      href="/citizen/dashboard?tab=documents"
                      onClick={() => setIsOpen(false)}
                      className="text-[#133E87] dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Manage in Vault</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => dismissPendingKycRequest(activePendingKyc.appId)}
                      className="hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* List of Recent Notifications (Strictly Isolated by Citizen Identity) */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {notifications.length === 0 && !activePendingKyc ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 space-y-1">
                <Bell className="w-6 h-6 mx-auto text-slate-400 opacity-40 mb-2" />
                <p className="font-semibold">No notifications</p>
                <p className="text-[10px]">Real-time alerts and document requests will appear here when requested for your account.</p>
              </div>
            ) : (
              notifications.map((n, idx) => (
                <div 
                  key={n.id || idx} 
                  className={`p-3 space-y-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                    n.isNew ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {n.category || 'Notification'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {n.timestamp || 'Just now'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                    {n.message}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold">
            <Link
              href="/citizen/dashboard?tab=documents"
              onClick={() => setIsOpen(false)}
              className="text-[#133E87] dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Document Vault</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
            <Link
              href="/citizen/dashboard?tab=consent"
              onClick={() => setIsOpen(false)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Privacy & DPDP Consent
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
