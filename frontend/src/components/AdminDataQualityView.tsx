'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BarChart2, AlertCircle, CheckCircle2, ShieldAlert, GitMerge, RefreshCw, Activity, Zap } from 'lucide-react';
import {
  fetchConflictsAPI,
  resolveConflictAPI,
  fetchConnectorHealthAPI,
  toggleConnectorHealthAPI,
  fetchConflictsAPI as fetchAdminConflictsAPI
} from '@/lib/api';

const SERVICE_IDS = ['srv_mca', 'srv_uidai', 'srv_kar_municipal'];

export const AdminDataQualityView = () => {
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [health, setHealth] = useState<any>({});
  const [simulating, setSimulating] = useState<string | null>(null);
  const [loadingConflicts, setLoadingConflicts] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    const [conflictsData, healthData] = await Promise.all([
      fetchConflictsAPI(),
      fetchConnectorHealthAPI()
    ]);
    if (conflictsData) setConflicts(conflictsData);
    if (healthData) setHealth(healthData);
    setLoadingConflicts(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResolve = async (conflictId: string, resolvedValue: string) => {
    setResolving(conflictId);
    await resolveConflictAPI(conflictId, resolvedValue);
    showToast('Conflict resolved and master record updated.');
    setConflicts(prev => prev.map(c => c.id === conflictId ? { ...c, status: 'RESOLVED', resolved_value: resolvedValue } : c));
    setResolving(null);
  };

  const handleSimulate = async (serviceId: string, status: 'FAILED' | 'DEGRADED' | 'HEALTHY') => {
    setSimulating(serviceId);
    await toggleConnectorHealthAPI(serviceId, status);
    showToast(`Connector ${serviceId.replace('srv_', '').toUpperCase()} set to ${status}. Retry logic activated.`);
    await loadData();
    setSimulating(null);
  };

  const connectors = health.connectors || [
    { id: 'srv_mca', name: 'Ministry of Corp Affairs', status: 'Healthy', latency: 150, success_rate: 98.5 },
    { id: 'srv_uidai', name: 'UIDAI (Aadhaar)', status: 'Healthy', latency: 200, success_rate: 97.2 },
    { id: 'srv_kar_municipal', name: 'Municipal Corporation', status: 'Healthy', latency: 450, success_rate: 92.1 },
  ];

  const pendingConflicts = conflicts.filter(c => c.status !== 'RESOLVED');
  const resolvedConflicts = conflicts.filter(c => c.status === 'RESOLVED');

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 px-5 py-3 rounded-xl font-bold text-sm shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-orange-400" />
            <span>Data Quality & Monitoring</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            System-wide telemetry on master data consistency, conflicts, connector health & deduplication.
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Global Accuracy Score</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">98.4%</p>
          <p className="text-[10px] text-emerald-500 mt-1">+1.2% this week</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Duplicate Records Merged</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">1,402</p>
          <p className="text-[10px] text-slate-500 mt-1">Auto-resolved via ML</p>
        </div>
        <div className={`bg-slate-900 border p-4 rounded-xl ${pendingConflicts.length > 0 ? 'border-rose-500/30 shadow-[0_0_15px_rgba(225,29,72,0.1)]' : 'border-slate-800'}`}>
          <p className="text-xs text-rose-400 font-medium">Active Conflicts</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{pendingConflicts.length}</p>
          <p className="text-[10px] text-rose-500 mt-1">Requires manual review</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Schema Validations</p>
          <p className="text-2xl font-bold text-slate-200 mt-1">45.2M</p>
          <p className="text-[10px] text-emerald-500 mt-1">100% pass rate today</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Conflict Resolution Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Conflict Resolution Queue
            </h2>
            <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-bold border border-rose-500/20">
              {pendingConflicts.length} PENDING
            </span>
          </div>

          <div className="divide-y divide-slate-800/50 max-h-[500px] overflow-y-auto">
            {loadingConflicts ? (
              <div className="p-8 text-center text-slate-500 text-sm animate-pulse">Loading conflicts...</div>
            ) : pendingConflicts.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">All conflicts resolved!</p>
              </div>
            ) : (
              pendingConflicts.map((conflict) => (
                <div key={conflict.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-mono text-slate-400">ID: {conflict.id.substring(0, 12)}…</div>
                    <div className="text-[10px] text-slate-500">{new Date(conflict.created_at).toLocaleDateString()}</div>
                  </div>
                  <h3 className="text-sm font-bold text-slate-200 mb-2 capitalize">
                    {conflict.field_name?.replace('_', ' ')} Mismatch
                  </h3>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <p className="text-[10px] text-slate-500 mb-1">Source: {conflict.source_a}</p>
                      <p className="text-xs text-slate-300 font-mono">{conflict.value_a}</p>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-rose-500/20">
                      <p className="text-[10px] text-slate-500 mb-1">Source: {conflict.source_b}</p>
                      <p className="text-xs text-rose-400 font-mono font-bold">{conflict.value_b}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      disabled={resolving === conflict.id}
                      onClick={() => handleResolve(conflict.id, conflict.value_a)}
                      className="text-[10px] font-bold px-3 py-1.5 rounded bg-blue-600/80 text-white hover:bg-blue-500 transition disabled:opacity-50"
                    >
                      {resolving === conflict.id ? 'Resolving…' : `Accept "${conflict.value_a}"`}
                    </button>
                    <button
                      disabled={resolving === conflict.id}
                      onClick={() => handleResolve(conflict.id, conflict.value_b)}
                      className="text-[10px] font-bold px-3 py-1.5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition disabled:opacity-50"
                    >
                      {resolving === conflict.id ? '…' : `Accept "${conflict.value_b}"`}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Connector Health & Simulate Failure */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Connector Health Monitor
              </h2>
              <span className="text-[10px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded font-bold">LIVE</span>
            </div>

            <div className="divide-y divide-slate-800/50">
              {connectors.map((connector: any) => {
                const isHealthy = connector.status === 'Healthy' || connector.health_status === 'Healthy';
                const isDegraded = connector.status === 'Degraded' || connector.health_status === 'Degraded';
                const isFailed = connector.status === 'Failed' || connector.health_status === 'Failed';
                const id = connector.id || connector.service_id || 'srv_mca';
                return (
                  <div key={id} className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-200">{connector.name || connector.service_name}</h3>
                        <p className="text-[10px] font-mono text-slate-500">{id}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        isFailed ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' :
                        isDegraded ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {connector.status || connector.health_status || 'Healthy'}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        disabled={simulating === id}
                        onClick={() => handleSimulate(id, 'FAILED')}
                        className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition disabled:opacity-50"
                      >
                        <Zap className="w-3 h-3" />
                        {simulating === id ? 'Wait…' : 'Simulate Failure'}
                      </button>
                      <button
                        disabled={simulating === id}
                        onClick={() => handleSimulate(id, 'DEGRADED')}
                        className="text-[10px] font-bold px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition disabled:opacity-50"
                      >
                        Degrade
                      </button>
                      <button
                        disabled={simulating === id}
                        onClick={() => handleSimulate(id, 'HEALTHY')}
                        className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition disabled:opacity-50"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pipeline Health */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 space-y-5">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Data Pipeline Health
            </h2>
            {[
              { label: 'Master Data Sync', value: 100, color: 'bg-emerald-500' },
              { label: 'Deduplication Engine', value: 94, color: 'bg-emerald-500' },
              { label: 'Orphaned Records Cleanup', value: 82, color: 'bg-amber-500' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">{label}</span>
                  <span className={`font-bold ${value >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{value}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5">
                  <div className={`${color} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
            <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-2">
                <GitMerge className="w-4 h-4 text-slate-500" />
                Latest Deduplication Run
              </h3>
              <p className="text-xs text-slate-500 mb-1">Completed: 10 mins ago</p>
              <p className="text-xs text-slate-500 mb-1">Records scanned: 1.2M</p>
              <p className="text-xs text-emerald-400 font-bold">Entities merged: {142 + resolvedConflicts.length}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
