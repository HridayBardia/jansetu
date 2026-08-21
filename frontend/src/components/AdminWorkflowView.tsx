'use client';

import React, { useState } from 'react';
import { GitMerge, Settings, Play, Database, Shield, Box, Activity, ChevronRight, FileCheck } from 'lucide-react';

const mockWorkflows = [
  {
    id: 'wf_biz_reg',
    name: 'Business Registration Orchestration',
    department: 'Ministry of Corporate Affairs',
    status: 'ACTIVE',
    steps: [
      { id: 's1', name: 'Citizen Form Intake', type: 'Ingestion', target: 'JanSetu Gateway' },
      { id: 's2', name: 'Identity & Auth', type: 'Validation', target: 'UIDAI Aadhaar API' },
      { id: 's3', name: 'Consent Check', type: 'Security', target: 'Consent Manager' },
      { id: 's4', name: 'Master Data Push', type: 'Action', target: 'MCA Registry (Simulated)' }
    ]
  },
  {
    id: 'wf_trade_lic',
    name: 'Local Trade License',
    department: 'Municipal Corporation',
    status: 'ACTIVE',
    steps: [
      { id: 't1', name: 'Citizen Document Upload', type: 'Ingestion', target: 'JanSetu Gateway' },
      { id: 't2', name: 'Automated OCR & NLP', type: 'Processing', target: 'Document AI API' },
      { id: 't3', name: 'Cross-verification', type: 'Validation', target: 'State Land Records DB' },
      { id: 't4', name: 'SOAP Adapter Push', type: 'Action', target: 'Legacy Municipal System' }
    ]
  }
];

export const AdminWorkflowView = () => {
  const [selectedWf, setSelectedWf] = useState(mockWorkflows[0]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <GitMerge className="w-6 h-6 text-indigo-400" />
            <span>Workflow Orchestrator</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure, monitor, and deploy automated multi-department service logic.
          </p>
        </div>
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition">
          Create Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Active Workflows</h3>
          {mockWorkflows.map(wf => (
            <button
              key={wf.id}
              onClick={() => setSelectedWf(wf)}
              className={`w-full text-left p-4 rounded-xl border transition ${
                selectedWf.id === wf.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-sm text-slate-200">{wf.name}</div>
              <div className="text-[10px] text-slate-500 mt-1">{wf.department}</div>
              <div className="mt-2 text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded w-fit">
                {wf.status}
              </div>
            </button>
          ))}
        </div>

        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 relative">
          <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">{selectedWf.name}</h2>
              <p className="text-xs text-slate-400">Pipeline Execution Rules</p>
            </div>
            <button className="text-slate-400 hover:text-white p-2 bg-slate-800 rounded-lg">
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {selectedWf.steps.map((step, idx) => (
              <div key={step.id} className="flex items-stretch gap-4 relative">
                {idx !== selectedWf.steps.length - 1 && (
                  <div className="absolute left-6 top-10 w-0.5 h-full bg-slate-800 -z-10" />
                )}
                
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                  step.type === 'Ingestion' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                  step.type === 'Validation' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                  step.type === 'Security' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                  'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}>
                  {step.type === 'Ingestion' ? <Database className="w-5 h-5" /> :
                   step.type === 'Validation' ? <FileCheck className="w-5 h-5" /> :
                   step.type === 'Security' ? <Shield className="w-5 h-5" /> :
                   <Play className="w-5 h-5" />}
                </div>

                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">{step.name}</h4>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">Target: {step.target}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    step.type === 'Ingestion' ? 'bg-blue-500/5 text-blue-400 border-blue-500/20' :
                    step.type === 'Validation' ? 'bg-amber-500/5 text-amber-400 border-amber-500/20' :
                    step.type === 'Security' ? 'bg-rose-500/5 text-rose-400 border-rose-500/20' :
                    'bg-emerald-500/5 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {step.type}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
