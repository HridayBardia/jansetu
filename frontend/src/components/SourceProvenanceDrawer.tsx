'use client';

import React from 'react';
import { X, ExternalLink, ShieldCheck, Calendar, Building2, Globe } from 'lucide-react';
import { SourceProvenance } from '@/types';

interface SourceProvenanceDrawerProps {
  source: SourceProvenance | null;
  onClose: () => void;
}

export const SourceProvenanceDrawer: React.FC<SourceProvenanceDrawerProps> = ({ source, onClose }) => {
  if (!source) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 animate-scaleUp">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg bg-slate-100 dark:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800">
              Verified Statutory Record
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              Source Provenance Inspector
            </h3>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
          <div>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Document Title</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{source.title}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#133E87] dark:text-blue-400" /> Authority
              </p>
              <p className="text-slate-900 dark:text-slate-200 font-medium mt-0.5">{source.authority}</p>
            </div>
            <div>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#133E87] dark:text-blue-400" /> Published
              </p>
              <p className="text-slate-900 dark:text-slate-200 font-medium mt-0.5">{source.published_at}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Last Verified</p>
              <p className="text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">{source.retrieved_at}</p>
            </div>
            <div>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Version</p>
              <p className="text-slate-900 dark:text-slate-200 font-mono mt-0.5">v{source.version}</p>
            </div>
          </div>

          {source.excerpt && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-wider mb-1">Official Snippet</p>
              <p className="text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800 text-[11px] leading-relaxed">
                &ldquo;{source.excerpt}&rdquo;
              </p>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
          >
            Close
          </button>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-[#0B2545] hover:bg-[#133E87] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Open Official Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
export default SourceProvenanceDrawer;
