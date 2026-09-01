'use client';

import React, { useState, useMemo } from 'react';
import { 
  GitBranch, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Activity, 
  ArrowRight, 
  UserCheck, 
  ChevronRight, 
  ExternalLink,
  ShieldAlert,
  Building2,
  X
} from 'lucide-react';
import { useLiveSync, JourneyRecord } from '@/context/LiveSyncContext';
import { useLanguage } from '@/context/LanguageContext';

export const CitizenJourneysQueue: React.FC = () => {
  const { journeys, recentlyAddedJourneyId } = useLiveSync();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [selectedJourney, setSelectedJourney] = useState<JourneyRecord | null>(null);

  const filteredJourneys = useMemo(() => {
    return journeys.filter(j => {
      // Hide journeys unless they have started progressing
      if ((j.progress || (j as any).progress_percentage || 0) <= 10) return false;

      if (filter === 'In Progress' && j.status !== 'In Progress') return false;
      if (filter === 'Ready to Apply' && j.status !== 'Ready to Apply') return false;
      if (filter === 'Completed' && j.status !== 'Completed') return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        j.title.toLowerCase().includes(q) ||
        (j.citizenName || '').toLowerCase().includes(q) ||
        j.category.toLowerCase().includes(q) ||
        j.currentStage.toLowerCase().includes(q)
      );
    });
  }, [journeys, filter, searchQuery]);

  const stats = useMemo(() => {
    const active = journeys.filter(j => (j.progress || (j as any).progress_percentage || 0) > 10);
    const total = active.length;
    const inProgress = active.filter(j => j.status === 'In Progress').length;
    const ready = active.filter(j => j.status === 'Ready to Apply').length;
    const avgProgress = total > 0 ? Math.round(active.reduce((acc, curr) => acc + (curr.progress || 0), 0) / total) : 0;
    return { total, inProgress, ready, avgProgress };
  }, [journeys]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-[#133E87] dark:text-blue-400" />
            <span>{t('Citizen Workflows & Registry Telemetry Desk', 'Citizen Workflows & Registry Telemetry Desk')}</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t('Real-time telemetry stream of citizen life-event workflows, cross-departmental DAG executions, and automated credential validation.', 'Real-time telemetry stream of citizen life-event workflows, cross-departmental DAG executions, and automated credential validation.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold border border-emerald-300 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{t('Live Mesh Connected', 'Live Mesh Connected')}</span>
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-4 text-center shadow-2xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">{t('ACTIVE CITIZEN WORKFLOWS', 'Active Citizen Workflows')}</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{stats.total}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-4 text-center shadow-2xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">{t('In Progress', 'In Progress')}</span>
          <span className="text-2xl font-black text-[#133E87] dark:text-blue-400 mt-1 block">{stats.inProgress}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-4 text-center shadow-2xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">{t('READY TO APPLY', 'Ready to Apply')}</span>
          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1 block">{stats.ready}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-4 text-center shadow-2xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">{t('AVERAGE PROGRESSION', 'Average Progression')}</span>
          <span className="text-2xl font-black text-purple-700 dark:text-purple-400 mt-1 block">{stats.avgProgress}%</span>
        </div>
      </div>

      {/* Live Highlight Banner */}
      {recentlyAddedJourneyId && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200 font-semibold animate-scaleUp shadow-sm">
          <Sparkles className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
          <span>{t(`Live Mesh: New Citizen Workflow (${recentlyAddedJourneyId}) initiated and prepended to the queue in real-time.`, `Live Mesh: New Citizen Workflow (${recentlyAddedJourneyId}) initiated and prepended to the queue in real-time.`)}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search by Citizen Name, Goal, or Stage...', 'Search by Citizen Name, Goal, or Stage...')}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#133E87] focus:outline-none shadow-2xs"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {[
            { id: 'All', label: t('All', 'All') },
            { id: 'In Progress', label: t('In Progress', 'In Progress') },
            { id: 'Ready to Apply', label: t('Ready to Apply', 'Ready to Apply') },
            { id: 'Completed', label: t('Completed', 'Completed') }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition border ${
                filter === f.id
                  ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Workflows Grid / List */}
      <div className="space-y-3">
        {filteredJourneys.map((j) => {
          const isNew = recentlyAddedJourneyId === j.id;
          return (
            <div
              key={j.id}
              onClick={() => setSelectedJourney(j)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
                isNew
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-500 font-bold animate-pulse'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#133E87] dark:text-blue-300 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                      {t(j.category, j.category)}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      j.status === 'Ready to Apply' 
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300' 
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300'
                    }`}>
                      {t(j.status, j.status)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {t('Synced', 'Synced')} {t(j.lastUpdated || 'Just now', j.lastUpdated || 'Just now')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t(j.title, j.title)}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <span>{t('Citizen:', 'Citizen:')} <strong className="text-slate-900 dark:text-white">{j.citizenName || 'Hriday Bardia'}</strong></span>
                    <span>•</span>
                    <span>{t('Current Stage:', 'Current Stage:')} <strong className="text-[#133E87] dark:text-blue-400">{t(j.currentStage, j.currentStage)}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  {/* Progress bar */}
                  <div className="w-36 space-y-1 text-right">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-500">{t('Progress', 'Progress')}</span>
                      <span className="text-[#133E87] dark:text-blue-400">{j.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#133E87] to-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${j.progress}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredJourneys.length === 0 && (
          <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <GitBranch className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No active workflows match your query.</p>
            <p className="text-xs text-slate-400 mt-0.5">When citizens initiate goals on the Resident Portal, they will appear here in real-time.</p>
          </div>
        )}
      </div>

      {/* Selected Journey Modal Drawer */}
      {selectedJourney && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedJourney(null); }}
        >
          <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl text-xs text-slate-900 dark:text-white animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold uppercase">{selectedJourney.category}</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{selectedJourney.title}</h3>
              </div>
              <button onClick={() => setSelectedJourney(null)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Citizen Beneficiary</span>
                <p className="font-bold text-sm mt-0.5">{selectedJourney.citizenName || 'Hriday Bardia'}</p>
                <p className="text-slate-400 font-mono text-[10px]">UID: 1111 2222 1405</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Workflow Status</span>
                <p className="font-bold text-sm text-[#133E87] dark:text-blue-400 mt-0.5">{selectedJourney.status} ({selectedJourney.progress}%)</p>
                <p className="text-slate-400 text-[10px]">Documents: {selectedJourney.documentsReady}/{selectedJourney.documentsTotal} verified</p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 p-3.5 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-[#133E87] dark:text-blue-400 uppercase">Current Department Stage</span>
              <p className="font-medium text-slate-800 dark:text-slate-200">{selectedJourney.currentStage}</p>
              <p className="text-[11px] text-slate-500 mt-1">Next Action: {selectedJourney.nextAction}</p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => {
                  alert('SMS Nudge sent to citizen successfully.');
                }}
                className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-400 font-semibold text-xs border border-amber-200 dark:border-amber-800 transition cursor-pointer"
              >
                Send SMS Nudge
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to administratively override and mark this stage as complete?')) {
                    alert('Stage overridden and marked complete.');
                    setSelectedJourney(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-400 font-semibold text-xs border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
              >
                Override & Approve
              </button>
              <button
                onClick={() => setSelectedJourney(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CitizenJourneysQueue;
