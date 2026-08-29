'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ShieldCheck, ExternalLink, Calendar, Building2, Award, Send, CheckCircle2 } from 'lucide-react';

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
  last_verified_at?: string;
}

export const SchemeCard: React.FC<{
  scheme: SchemeProps;
  onApply?: (scheme: SchemeProps) => void;
  isApplied?: boolean;
}> = ({ scheme, onApply, isApplied }) => {
  const { t } = useLanguage();
  const isExpired = scheme.status === 'EXPIRED';
  const isSuspended = scheme.status === 'SUSPENDED';

  if (isExpired || isSuspended) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/40 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between space-y-4 group">
      <div className="space-y-3">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              {scheme.level} • {scheme.state_name}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {scheme.category}
            </span>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('active', 'ACTIVE')} • {t('verified', 'Verified')}</span>
          </div>
        </div>

        {/* Scheme Title & Department */}
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
            {scheme.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>{scheme.department}</span>
          </p>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
          {scheme.description}
        </p>

        {/* Benefits Highlights */}
        {scheme.benefits && Object.keys(scheme.benefits).length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-950/80 rounded-xl p-3 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              {t('schemes.benefits', 'Benefits & Direct Support')}
            </span>
            <div className="text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1.5 flex-wrap">
              {Object.entries(scheme.benefits).map(([key, val]) => (
                <span key={key} className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md text-[11px] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                  <Award className="w-3 h-3 text-emerald-500" />
                  <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{String(val)}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs flex-wrap">
        <a
          href={scheme.official_source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white text-xs font-medium transition"
        >
          <Calendar className="w-3 h-3" />
          <span>{t('officialSource', 'Official Source')}</span>
          <ExternalLink className="w-3 h-3 text-amber-500" />
        </a>

        {onApply && (
          <button
            type="button"
            onClick={() => onApply(scheme)}
            disabled={isApplied}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
              isApplied
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 hover:shadow-md cursor-pointer'
            }`}
          >
            {isApplied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Applied</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Apply Now</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
export default SchemeCard;
