import React from 'react';
import { ShieldCheck, Info, X, Check, ArrowRight } from 'lucide-react';

interface PurposeBoundConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  requestingDepartment: string;
  purpose: string;
  dataFields: string[];
  duration: string;
}

export const PurposeBoundConsentModal: React.FC<PurposeBoundConsentModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  requestingDepartment,
  purpose,
  dataFields,
  duration
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-950 p-5 flex items-start justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Purpose-Bound Consent Request</h2>
              <p className="text-xs text-slate-400 font-mono mt-1">ID: REQ-{Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition bg-slate-900 p-1 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
            <div className="flex-1 text-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Your Vault</div>
              <div className="text-sm font-bold text-white">JanSetu Canonical</div>
            </div>
            <ArrowRight className="w-5 h-5 text-emerald-500" />
            <div className="flex-1 text-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Requesting Dept</div>
              <div className="text-sm font-bold text-amber-400">{requestingDepartment}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Specific Purpose
              </h3>
              <p className="text-sm text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800">
                {purpose}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Requested Data Fields</h3>
              <div className="flex flex-wrap gap-2">
                {dataFields.map(field => (
                  <span key={field} className="text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded">
                    {field}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Data Retention Duration</h3>
              <p className="text-sm text-amber-400 font-bold bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 inline-block">
                {duration}
              </p>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 leading-relaxed text-center">
            By clicking Approve, you authorize the secure transfer of this exact data strictly for the stated purpose. 
            A cryptographic audit log will be generated in your Privacy Center.
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition text-sm">
            Deny Access
          </button>
          <button onClick={onApprove} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Check className="w-4 h-4" /> Approve & Transfer
          </button>
        </div>

      </div>
    </div>
  );
};
