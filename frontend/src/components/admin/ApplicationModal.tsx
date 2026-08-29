'use client';

import React from 'react';
import { useLiveSync, ApplicationRecord } from '@/context/LiveSyncContext';
import { 
  X, 
  FileText, 
  CheckCircle2, 
  Radio, 
  Lock, 
  AlertTriangle 
} from 'lucide-react';

interface ApplicationModalProps {
  application: ApplicationRecord;
  onClose: () => void;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({ application, onClose }) => {
  const { 
    applications: liveApps, 
    revokedDepartments, 
    requestCitizenDoc, 
    broadcastConsentRequested, 
    broadcastApplicationStatusUpdated 
  } = useLiveSync();

  const [awaitingKyc, setAwaitingKyc] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const activeApp = liveApps.find(a => a.id === application.id) || application;
  const isRevoked = revokedDepartments.some(d => (d || '').toLowerCase().includes((activeApp.department || '').toLowerCase()));
  const hasPendingKyc = activeApp.documents?.some(d => d.status !== 'VERIFIED');
  const isKycAwaiting = awaitingKyc && hasPendingKyc;

  const handleRequestDoc = async (docName = 'Land Record Khasra') => {
    requestCitizenDoc({
      appId: activeApp.id,
      citizenName: activeApp.citizenName,
      citizenId: activeApp.citizenId,
      docName: docName,
      dept: activeApp.department
    });
    setAwaitingKyc(true);
    setToastMsg(`Request for ${docName} transmitted to citizen.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleApprove = () => {
    broadcastApplicationStatusUpdated(activeApp.id, 'APPROVED', 'Disbursement Approval Generated to Beneficiary Bank');
    setToastMsg(`Application ${activeApp.id} Approved for DBT Disbursement.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh] overflow-y-auto space-y-6 animate-scale-up text-slate-900 dark:text-white"
        role="dialog"
      >
        {toastMsg && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">{toastMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                {activeApp.id}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                {activeApp.status}
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
              {activeApp.service}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
          <div>
            <p className="text-slate-500 uppercase font-bold text-[10px]">Beneficiary Name</p>
            <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{activeApp.citizenName}</p>
            <p className="text-slate-400 font-mono text-[11px] mt-0.5">UID: {activeApp.citizenId}</p>
          </div>
          <div>
            <p className="text-slate-500 uppercase font-bold text-[10px]">Department</p>
            <p className="font-medium text-slate-900 dark:text-slate-200 mt-0.5">{activeApp.department}</p>
          </div>
        </div>

        {isRevoked ? (
          <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 rounded-2xl p-5 space-y-2 text-red-900 dark:text-red-200">
            <div className="flex items-center gap-2 font-bold text-sm text-red-700 dark:text-red-400">
              <Lock className="w-5 h-5" />
              <span>⚠️ Access Revoked by Citizen under DPDP Act 2023</span>
            </div>
            <p className="text-xs">Document Tokens Purged. Access Denied.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Supporting Verification Documents
            </span>
            <div className="space-y-1.5">
              {activeApp.documents?.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                    <span className="font-medium">{doc.name}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all duration-300 ${
                    doc.status === 'VERIFIED' 
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' 
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse'
                  }`}>
                    {doc.status === 'VERIFIED' ? '✓ VERIFIED' : doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleRequestDoc('Land Record Khasra')}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
              isKycAwaiting
                ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 animate-pulse'
                : 'border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60'
            }`}
          >
            <FileText className={`w-3.5 h-3.5 ${isKycAwaiting ? 'text-amber-600 animate-spin' : 'text-purple-600 dark:text-purple-400'}`} />
            <span>{isKycAwaiting ? 'Awaiting Citizen e-KYC ⏳' : 'Request Citizen e-KYC / Document'}</span>
          </button>

          <button
            type="button"
            disabled={isRevoked}
            onClick={handleApprove}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition flex items-center gap-1.5 ${
              isRevoked
                ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 cursor-pointer'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve & Disburse</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;
