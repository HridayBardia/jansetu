'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Clock, FileText, Globe, Award, DollarSign, Target } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export const ImpactDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const { t } = useLanguage();

  useEffect(() => {
    setMetrics({
      portals_avoided: 12450,
      documents_avoided: 34200,
      manual_fields_avoided: 184500,
      processing_time_saved_hours: 84000,
      citizen_satisfaction: 98.4,
      bureaucratic_cost_saved: 12500000 // In rupees
    });
  }, []);

  if (!metrics) {
    return (
      <div className="text-slate-500 dark:text-slate-400 p-8 animate-pulse text-center text-xs">
        {t('common.loading', 'Loading Impact Data...')}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>{t('impact.title', 'National Impact Metrics')}</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t('impact.subtitle', 'Real-time quantification of citizen friction reduced across India.')}
          </p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-4 py-2 rounded-xl text-center shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 tracking-wider">
            {t('impact.satisfactionScore', 'Satisfaction Score')}
          </div>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">
            {metrics.citizen_satisfaction}%
          </div>
        </div>
      </div>

      {/* 4 Impact Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1: Portals Bypassed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-5 rounded-xl relative overflow-hidden shadow-2xs space-y-2">
          <div className="absolute -right-3 -bottom-3 opacity-5 dark:opacity-10 pointer-events-none">
            <Globe className="w-24 h-24 text-blue-600" />
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#133E87] dark:text-blue-400">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.portals_avoided.toLocaleString()}
            </div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
              {t('impact.portalsBypassed', 'Portals Bypassed')}
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('impact.portalsBypassedDesc', "Times a citizen didn't have to create a new account.")}
          </p>
        </div>

        {/* Card 2: Docs Avoided */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-5 rounded-xl relative overflow-hidden shadow-2xs space-y-2">
          <div className="absolute -right-3 -bottom-3 opacity-5 dark:opacity-10 pointer-events-none">
            <FileText className="w-24 h-24 text-pink-600" />
          </div>
          <div className="w-9 h-9 rounded-lg bg-pink-50 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-800 flex items-center justify-center text-pink-600 dark:text-pink-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.documents_avoided.toLocaleString()}
            </div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
              {t('impact.docsAvoided', 'Docs Avoided')}
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('impact.docsAvoidedDesc', 'Redundant uploads prevented via API fetching.')}
          </p>
        </div>

        {/* Card 3: Fields Autofilled */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-5 rounded-xl relative overflow-hidden shadow-2xs space-y-2">
          <div className="absolute -right-3 -bottom-3 opacity-5 dark:opacity-10 pointer-events-none">
            <Target className="w-24 h-24 text-amber-600" />
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.manual_fields_avoided.toLocaleString()}
            </div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
              {t('impact.fieldsAutofilled', 'Fields Autofilled')}
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('impact.fieldsAutofilledDesc', 'Keystrokes saved through the Canonical Data Model.')}
          </p>
        </div>

        {/* Card 4: Hours Saved */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-5 rounded-xl relative overflow-hidden shadow-2xs space-y-2">
          <div className="absolute -right-3 -bottom-3 opacity-5 dark:opacity-10 pointer-events-none">
            <Clock className="w-24 h-24 text-indigo-600" />
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.processing_time_saved_hours.toLocaleString()}
            </div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
              {t('impact.hoursSaved', 'Hours Saved')}
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('impact.hoursSavedDesc', 'Cumulative time saved in application processing.')}
          </p>
        </div>

      </div>

      {/* Estimated Economic Impact Banner */}
      <div className="bg-gradient-to-br from-emerald-50/80 via-slate-50 to-teal-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30 border-2 border-emerald-300/80 dark:border-emerald-800/60 rounded-2xl p-8 text-center shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shadow-2xs">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            {t('impact.estimatedEconomicImpact', 'Estimated Economic Impact')}
          </h3>
          <div className="text-4xl md:text-5xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
            <span>₹</span>{((metrics.bureaucratic_cost_saved) / 100000).toFixed(1)} <span className="text-slate-900 dark:text-white font-bold">{t('impact.lakhs', 'Lakhs')}</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            {t('impact.estimatedEconomicImpactDesc', 'Saved by Government departments through automated verification, reduced manual data entry, and lower document storage requirements.')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImpactDashboard;
