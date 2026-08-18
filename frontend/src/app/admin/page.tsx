'use client';

import React, { useState, useEffect } from 'react';
import { fetchAdminDiagnosticsAPI, fetchSourcesAPI, triggerIngestionAPI, fetchSourceHealthAPI } from '@/lib/api';
import { BarChart2, Database, Cpu, Radio, BookOpen, RefreshCw, ShieldCheck, MapPin } from 'lucide-react';

export default function AdminPage() {
  const [diag, setDiag] = useState<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [isIngesting, setIsIngesting] = useState(false);

  const loadData = () => {
    fetchAdminDiagnosticsAPI().then((data) => setDiag(data));
    fetchSourcesAPI().then((data) => setSources(data));
    fetchSourceHealthAPI().then((data) => setHealth(data));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerIngestion = async () => {
    setIsIngesting(true);
    await triggerIngestionAPI();
    loadData();
    setIsIngesting(false);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-black text-white">System Admin & Data Health Dashboard</h1>
          </div>
          <p className="text-xs text-slate-400">
            Real-time telemetry, automated ingestion status, scheme expiration controls, and source health.
          </p>
        </div>

        <button
          onClick={handleTriggerIngestion}
          disabled={isIngesting}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 transition shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isIngesting ? 'animate-spin' : ''}`} />
          <span>{isIngesting ? 'Ingesting Sources...' : 'Trigger Ingestion Worker'}</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" /> Database Status
          </span>
          <p className="text-lg font-black text-emerald-400">{diag?.database || 'Connected'}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Active Schemes
          </span>
          <p className="text-lg font-black text-amber-400">{diag?.active_schemes ?? health?.active_schemes ?? 10}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" /> States & UTs Covered
          </span>
          <p className="text-lg font-black text-cyan-400">{diag?.total_states_covered ?? 36} Regions</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-purple-400" /> Indexed Sources
          </span>
          <p className="text-lg font-black text-purple-400">{diag?.total_sources ?? sources.length}</p>
        </div>
      </div>

      {/* Knowledge Base Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>Indexed Government Knowledge Sources</span>
        </h3>

        <div className="space-y-3">
          {sources.map((src) => (
            <div key={src.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <h4 className="font-bold text-white">{src.title}</h4>
                <p className="text-slate-400 mt-0.5">{src.department} • {src.state}</p>
                <p className="text-slate-500 text-[11px] mt-1">{src.summary}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {src.freshness_status}
                </span>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded text-[11px] font-semibold"
                >
                  Visit Portal
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

