'use client';

import React from 'react';
import { BarChart2, ShieldCheck, Clock, CheckCircle2, TrendingUp, BookOpen, Layers } from 'lucide-react';
import { AnalyticsSummary } from '@/types';
import { ImpactDashboard } from './ImpactDashboard';

interface AdminAnalyticsViewProps {
  analytics: AnalyticsSummary;
}

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({ analytics }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
            SIH Judge & Product Analytics
          </span>
          <h1 className="text-2xl font-extrabold text-slate-100 mt-1 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-amber-400" />
            <span>Impact & Engine Performance</span>
          </h1>
          <p className="text-xs text-slate-400">
            Quantifiable improvement over traditional government portal navigation
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <p className="text-xs text-slate-400 font-medium">Journeys Orchestrated</p>
          <p className="text-2xl font-extrabold text-amber-400">{analytics.total_journeys_started.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-semibold">
            <TrendingUp className="w-3 h-3" /> +24% this month
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <p className="text-xs text-slate-400 font-medium">Prerequisites Auto-Resolved</p>
          <p className="text-2xl font-extrabold text-emerald-400">{analytics.prerequisites_auto_resolved.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400">Dependency Graph Resolved</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <p className="text-xs text-slate-400 font-medium">Sources Grounded</p>
          <p className="text-2xl font-extrabold text-amber-300">{analytics.sources_indexed}</p>
          <p className="text-[10px] text-slate-400">Verified Govt Portals</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <p className="text-xs text-slate-400 font-medium">Avg Time Saved / Citizen</p>
          <p className="text-2xl font-extrabold text-slate-100">{analytics.time_saved_hours_per_citizen} hrs</p>
          <p className="text-[10px] text-emerald-400 font-semibold">vs manual portal navigation</p>
        </div>
      </div>

      {/* Side-by-Side Comparison Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          <span>Before vs After Paradigm Comparison</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Traditional Portal Approach */}
          <div className="bg-slate-950 p-5 rounded-xl border border-rose-500/20 space-y-2">
            <h4 className="text-sm font-bold text-rose-400 flex items-center gap-1.5">
              <span>Traditional Government Portals</span>
            </h4>
            <ul className="space-y-2 text-slate-400 list-disc pl-4">
              <li>Citizen must discover which department handles their problem (BBMP vs MCA vs Commercial Tax).</li>
              <li>Manual form filling across 5+ disconnected portal websites.</li>
              <li>Surprise missing prerequisites causing applications to get rejected mid-way.</li>
              <li>Zero context or guidance on state-specific subsidy eligibility.</li>
            </ul>
          </div>

          {/* Citizen Journey Engine Approach */}
          <div className="bg-slate-950 p-5 rounded-xl border border-emerald-500/30 space-y-2">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>AI Citizen Journey Engine</span>
            </h4>
            <ul className="space-y-2 text-slate-200 list-disc pl-4 font-medium">
              <li>Citizen explains goal in natural language (English/Hindi/Kannada).</li>
              <li>Engine resolves complete dependency graph automatically.</li>
              <li>Next-Best-Action highlights the ONE priority task to execute next.</li>
              <li>100% grounded in verified official sources with consent-first privacy.</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="pt-8 border-t border-slate-800">
        <ImpactDashboard />
      </div>
    </div>
  );
};
