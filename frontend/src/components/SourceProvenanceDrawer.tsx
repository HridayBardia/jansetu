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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              Verified Government Source
            </span>
            <h3 className="text-lg font-bold text-slate-100">
              Source Provenance Inspector
            </h3>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
          <div>
            <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Document Title</p>
            <p className="text-sm font-bold text-slate-100 mt-0.5">{source.title}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider flex items-center gap-1">
                <Building2 className="w-3 h-3 text-amber-400" /> Authority
              </p>
              <p className="text-slate-200 font-medium mt-0.5">{source.authority}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-400" /> Published
              </p>
              <p className="text-slate-200 font-medium mt-0.5">{source.published_at}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Last Verified</p>
              <p className="text-emerald-400 font-medium mt-0.5">{source.retrieved_at}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Version</p>
              <p className="text-slate-200 font-medium mt-0.5">v{source.version}</p>
            </div>
          </div>

          {source.excerpt && (
            <div className="pt-2 border-t border-slate-800">
              <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Official Snippet</p>
              <p className="text-slate-300 italic bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px] leading-relaxed">
                &ldquo;{source.excerpt}&rdquo;
              </p>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
          >
            Close
          </button>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition shadow"
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
