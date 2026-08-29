'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw, 
  GitMerge, 
  Database, 
  AlertCircle, 
  Activity, 
  Zap, 
  Radio, 
  Layers, 
  ChevronRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { EntityMatchReview } from './EntityMatchReview';

interface Props {
  adminUsername: string;
}

export const AdminDataQualityView = ({ adminUsername }: Props) => {
  const { t } = useLanguage();
  const [dataQuality, setDataQuality] = useState<any>({
    totalRecords: 14820,
    validRecords: 14758,
    missingFields: 38,
    duplicates: 12,
    staleRecords: 12,
    qualityScore: 99.6
  });

  const [connectors, setConnectors] = useState<any[]>([
    { id: 'srv_uidai', name: 'UIDAI Aadhaar e-KYC', status: 'Healthy', latency: '48ms', success_rate: '99.9%' },
    { id: 'srv_mca', name: 'MCA21 Corporate Registry', status: 'Healthy', latency: '120ms', success_rate: '98.5%' },
    { id: 'srv_parivahan', name: 'Parivahan Sarathi / Vahan', status: 'Healthy', latency: '95ms', success_rate: '99.1%' },
    { id: 'srv_digilocker', name: 'DigiLocker NAD Issuer', status: 'Healthy', latency: '35ms', success_rate: '100%' },
  ]);

  const [pendingConflicts, setPendingConflicts] = useState<any[]>([
    {
      id: 'cnf_001',
      field_name: 'date_of_birth',
      source_a: 'UIDAI Aadhaar',
      value_a: '14/08/1998',
      source_b: 'Parivahan DL',
      value_b: '14/08/1999',
      created_at: new Date().toISOString()
    }
  ]);

  const [resolvedConflicts, setResolvedConflicts] = useState<string[]>([]);
  const [resolving, setResolving] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'conflicts' | 'entity_match'>('conflicts');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleResolve = (conflictId: string, acceptedValue: string) => {
    setResolving(conflictId);
    setTimeout(() => {
      setPendingConflicts(prev => prev.filter(c => c.id !== conflictId));
      setResolvedConflicts(prev => [...prev, conflictId]);
      setResolving(null);
      showToast(`Conflict resolved: Accepted "${acceptedValue}"`);
    }, 400);
  };

  const handleSimulate = (connectorId: string, status: string) => {
    setSimulating(connectorId);
    setTimeout(() => {
      setConnectors(prev => prev.map(c => c.id === connectorId ? { ...c, status: status === 'HEALTHY' ? 'Healthy' : status === 'DEGRADED' ? 'Degraded' : 'Failed' } : c));
      setSimulating(null);
      showToast(`Connector ${connectorId} status updated to ${status}`);
    }, 300);
  };

  const handleRefresh = () => {
    setIsRefreshingData(true);
    setTimeout(() => {
      setIsRefreshingData(false);
      setLastRefreshed(new Date().toLocaleTimeString());
      showToast('Data quality telemetry refreshed.');
    }, 400);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B2545] text-white px-5 py-3 rounded-xl font-bold text-xs shadow-2xl border border-slate-700 animate-slideUp">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>{t('adminDataQuality.title', 'Data Quality Audit & Golden Record Engine')}</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t('adminDataQuality.desc', 'Continuous automated cross-departmental reconciliation, fuzzy match resolution, and connector health.')}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setViewMode('conflicts')}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewMode === 'conflicts' ? 'bg-[#0B2545] text-white font-bold shadow-xs' : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('adminDataQuality.tabConflicts', 'Conflict Queue & Health')}
          </button>
          <button
            onClick={() => setViewMode('entity_match')}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewMode === 'entity_match' ? 'bg-[#0B2545] text-white font-bold shadow-xs' : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('adminDataQuality.tabEntity', 'Entity Match Review')}
          </button>
        </div>
      </div>

      {viewMode === 'entity_match' && (
        <div className="animate-fadeIn">
          <EntityMatchReview />
        </div>
      )}

      {viewMode === 'conflicts' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshingData}
              className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition disabled:opacity-50 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingData ? 'animate-spin' : ''}`} />
              <span>{isRefreshingData ? t('adminDataQuality.refreshing', 'Refreshing...') : t('adminCitizens.refresh', 'Refresh')}</span>
            </button>
            {lastRefreshed && (
              <span className="text-[10px] text-slate-500 font-mono">{t('adminDataQuality.lastRefreshed', 'Last sync:')} {lastRefreshed}</span>
            )}
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-4 rounded-xl shadow-2xs space-y-1">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t('adminDataQuality.totalRecords', 'Total Records')}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{dataQuality.totalRecords.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500">Cross-department verified</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-4 rounded-xl shadow-2xs space-y-1">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t('adminDataQuality.validRecords', 'Valid Records')}</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{dataQuality.validRecords.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">{dataQuality.qualityScore}% Quality Score</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-4 rounded-xl shadow-2xs space-y-1">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t('adminDataQuality.issuesFound', 'Flagged Mismatches')}</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{dataQuality.missingFields + dataQuality.duplicates}</p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">Automatic deduplication applied</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-4 rounded-xl shadow-2xs space-y-1">
              <p className="text-[11px] text-rose-700 dark:text-rose-400 font-bold uppercase tracking-wider">{t('adminDataQuality.activeConflicts', 'Active Conflicts')}</p>
              <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">{pendingConflicts.length}</p>
              <p className="text-[10px] text-slate-500">Requires officer resolution</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Conflict Resolution Queue */}
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>{t('adminDataQuality.conflictQueue', 'Master Data Discrepancy Queue')}</span>
                </h2>
                <span className="text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-bold border border-rose-300 dark:border-rose-800">
                  {pendingConflicts.length} Pending
                </span>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[450px] overflow-y-auto">
                {pendingConflicts.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-900 dark:text-white">All Demographics 100% Reconciled</p>
                    <p className="text-[11px] text-slate-500">No active identity discrepancies in the master registry queue.</p>
                  </div>
                ) : (
                  pendingConflicts.map((conflict) => (
                    <div key={conflict.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono text-slate-500">ID: {conflict.id}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Today</span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                        {conflict.field_name?.replace('_', ' ')} Discrepancy Flag
                      </h3>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <p className="text-[10px] text-slate-500 mb-0.5 font-medium">{conflict.source_a}</p>
                          <p className="text-slate-900 dark:text-slate-200 font-bold font-mono">{conflict.value_a}</p>
                        </div>
                        <div className="bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800">
                          <p className="text-[10px] text-rose-700 dark:text-rose-400 mb-0.5 font-medium">{conflict.source_b}</p>
                          <p className="text-rose-900 dark:text-rose-300 font-bold font-mono">{conflict.value_b}</p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          disabled={resolving === conflict.id}
                          onClick={() => handleResolve(conflict.id, conflict.value_a)}
                          className="text-[10px] font-bold px-3 py-1.5 rounded bg-[#0B2545] hover:bg-[#133E87] text-white transition cursor-pointer shadow-2xs disabled:opacity-50"
                        >
                          {resolving === conflict.id ? 'Reconciling...' : `Accept "${conflict.value_a}"`}
                        </button>
                        <button
                          disabled={resolving === conflict.id}
                          onClick={() => handleResolve(conflict.id, conflict.value_b)}
                          className="text-[10px] font-bold px-3 py-1.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
                        >
                          `Accept "${conflict.value_b}"`
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Connector Health & Simulate Failure */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#133E87] dark:text-blue-400" />
                    <span>{t('adminDataQuality.healthMonitor', 'Live API Connector Health')}</span>
                  </h2>
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded font-bold">LIVE</span>
                </div>

                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {connectors.map((connector: any) => {
                    const isHealthy = connector.status === 'Healthy';
                    const isDegraded = connector.status === 'Degraded';
                    const isFailed = connector.status === 'Failed';
                    return (
                      <div key={connector.id} className="p-3.5 space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200">{connector.name}</h3>
                            <p className="text-[10px] font-mono text-slate-500">{connector.id}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            isFailed ? 'bg-red-100 text-red-800 border-red-300' :
                            isDegraded ? 'bg-amber-100 text-amber-800 border-amber-300' :
                            'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}>
                            {connector.status}
                          </span>
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            disabled={simulating === connector.id}
                            onClick={() => handleSimulate(connector.id, 'FAILED')}
                            className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 transition cursor-pointer"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Simulate Fail</span>
                          </button>
                          <button
                            disabled={simulating === connector.id}
                            onClick={() => handleSimulate(connector.id, 'DEGRADED')}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition cursor-pointer"
                          >
                            Degrade
                          </button>
                          <button
                            disabled={simulating === connector.id}
                            onClick={() => handleSimulate(connector.id, 'HEALTHY')}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                          >
                            Restore
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
export default AdminDataQualityView;
