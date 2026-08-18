'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ShieldCheck, ExternalLink, Calendar, Building2, Award } from 'lucide-react';

export interface SchemeProps {
  id: string;
  name: string;
  official_name: string;
  description: string;
  level: string;
  state_name: string;
  department: string;
  category: string;
  benefits?: Record<string, any>;
  eligibility_rules?: Record<string, any>;
  documents_required?: any[];
  application_url?: string;
  official_source_url: string;
  status: string;
  last_verified_at: string;
}

export const SchemeCard: React.FC<{ scheme: SchemeProps }> = ({ scheme }) => {
  const { t } = useLanguage();
  const isExpired = scheme.status === 'EXPIRED';
  const isSuspended = scheme.status === 'SUSPENDED';

  if (isExpired || isSuspended) {
    return null; // NEVER display expired or suspended schemes
  }

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 shadow-lg transition flex flex-col justify-between space-y-4 group">
      <div className="space-y-3">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {scheme.level} • {scheme.state_name}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
              {scheme.category}
            </span>
          </div>

          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" />
            <span>{t('active', 'ACTIVE')} • {t('verified', 'Verified')}</span>
          </div>
        </div>

        {/* Scheme Title & Department */}
        <div>
          <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition">
            {scheme.name}
          </h3>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <Building2 className="w-3 h-3 text-slate-500" />
            <span>{scheme.department}</span>
          </p>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
          {scheme.description}
        </p>

        {/* Benefits Highlights */}
        {scheme.benefits && Object.keys(scheme.benefits).length > 0 && (
          <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Benefits:</span>
            <div className="text-xs font-medium text-amber-300 flex items-center gap-1.5 flex-wrap">
              {Object.entries(scheme.benefits).map(([key, val]) => (
                <span key={key} className="inline-flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded text-[11px] border border-slate-800">
                  <Award className="w-3 h-3 text-emerald-400" />
                  <span className="capitalize">{key.replace('_', ' ')}:</span>
                  <span className="font-bold text-white">{String(val)}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Direct Official URL Links */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{t('officialSource', 'Official Source Verified')}</span>
        </span>

        <a
          href={scheme.official_source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg font-semibold transition border border-slate-700 text-xs shrink-0"
        >
          <span>{t('officialSource', 'Official Source')}</span>
          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
        </a>
      </div>
    </div>
  );
};

