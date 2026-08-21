'use client';

import React from 'react';
import { BarChart2, AlertCircle, CheckCircle2, ShieldAlert, GitMerge } from 'lucide-react';

export const AdminDataQualityView = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-orange-400" />
          <span>Data Quality Monitor</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          System-wide telemetry on master data consistency, conflicts, and deduplication engine performance.
        </p>
      </div>

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
        <div className="bg-slate-900 border border-rose-500/30 p-4 rounded-xl shadow-[0_0_15px_rgba(225,29,72,0.1)]">
          <p className="text-xs text-rose-400 font-medium">Active Conflicts</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">24</p>
          <p className="text-[10px] text-rose-500 mt-1">Requires manual review</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Schema Validations</p>
          <p className="text-2xl font-bold text-slate-200 mt-1">45.2M</p>
          <p className="text-[10px] text-emerald-500 mt-1">100% pass rate today</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Conflict Resolution Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Conflict Resolution Queue
            </h2>
            <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-bold">24 PENDING</span>
          </div>
          
          <div className="divide-y divide-slate-800/50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs font-mono text-slate-400">ID: CNF-882-{i}</div>
                  <div className="text-[10px] text-slate-500">2 mins ago</div>
                </div>
                <h3 className="text-sm font-bold text-slate-200 mb-2">Demographic Mismatch: Date of Birth</h3>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <p className="text-[10px] text-slate-500 mb-1">Source: UIDAI (Aadhaar)</p>
                    <p className="text-xs text-slate-300 font-mono">14-05-1992</p>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <p className="text-[10px] text-slate-500 mb-1">Source: PAN Database</p>
                    <p className="text-xs text-rose-400 font-mono font-bold">14-06-1992</p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <button className="text-[10px] font-bold px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition">View Details</button>
                  <button className="text-[10px] font-bold px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 transition">Resolve Manually</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
           <div className="p-5 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Data Pipeline Health
            </h2>
          </div>
          
          <div className="p-5 space-y-5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Master Data Sync</span>
                <span className="text-emerald-400 font-bold">100%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Deduplication Engine</span>
                <span className="text-emerald-400 font-bold">94%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Orphaned Records Cleanup</span>
                <span className="text-amber-400 font-bold">82%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '82%' }}></div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-2">
                <GitMerge className="w-4 h-4 text-slate-500" />
                Latest Deduplication Run
              </h3>
              <p className="text-xs text-slate-500 mb-1">Completed: 10 mins ago</p>
              <p className="text-xs text-slate-500 mb-1">Records scanned: 1.2M</p>
              <p className="text-xs text-emerald-400 font-bold">Entities merged: 142</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
