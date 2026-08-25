'use client';

import React, { useState, useMemo } from 'react';
import { GitMerge, Settings, Play, Database, Shield, FileCheck, Plus, Trash2, ArrowUp, ArrowDown, Save, X, CheckCircle2, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { getWorkflowsForAdmin, AdminWorkflow } from '@/lib/adminData';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  adminUsername: string;
}

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-emerald-500/10 text-emerald-400',
  Pending: 'bg-amber-500/10 text-amber-400',
  'Action Required': 'bg-red-500/10 text-red-400',
};

export const AdminWorkflowView = ({ adminUsername }: Props) => {
  const workflows = useMemo(() => getWorkflowsForAdmin(adminUsername), [adminUsername]);
  const [selectedWf, setSelectedWf] = useState<AdminWorkflow | null>(workflows[0] || null);
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editSteps, setEditSteps] = useState<any[]>([]);

  const handleEdit = () => {
    if (selectedWf) {
      setEditSteps([...selectedWf.steps]);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditSteps([]);
  };

  const handleStepChange = (index: number, field: string, value: string) => {
    const newSteps = [...editSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setEditSteps(newSteps);
  };

  const handleAddStep = () => {
    setEditSteps([...editSteps, {
      id: `new_${Date.now()}`, name: 'New Step', status: 'pending', type: 'Action', target: 'New Target'
    }]);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = [...editSteps];
    newSteps.splice(index, 1);
    setEditSteps(newSteps);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <GitMerge className="w-6 h-6 text-indigo-400" />
            <span>Workflow Orchestrator</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor citizen workflows, progress, and current steps.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Workflows', count: workflows.length, color: 'text-white' },
          { label: 'Active', count: workflows.filter(w => w.status === 'Active').length, color: 'text-emerald-400' },
          { label: 'Pending', count: workflows.filter(w => w.status === 'Pending').length, color: 'text-amber-400' },
          { label: 'Action Required', count: workflows.filter(w => w.status === 'Action Required').length, color: 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold">{s.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Workflow List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Active Workflows</h3>
          {workflows.map((wf) => (
            <button
              key={wf.id}
              onClick={() => { if (!isEditing) setSelectedWf(wf); }}
              className={`w-full text-left p-4 rounded-xl border transition ${
                selectedWf?.id === wf.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              } ${isEditing && selectedWf?.id !== wf.id ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-slate-200">{wf.name}</div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_COLORS[wf.status] || 'bg-slate-800 text-slate-400'}`}>
                  {wf.status}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">{wf.citizen} — {wf.department}</div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>{wf.currentStep}</span>
                  <span className="font-bold">{wf.progress}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${
                    wf.progress >= 70 ? 'bg-emerald-500' : wf.progress >= 40 ? 'bg-amber-500' : 'bg-red-500'
                  }`} style={{ width: `${wf.progress}%` }} />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Workflow Detail */}
        {selectedWf && (
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 relative">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">{selectedWf.name}</h2>
                <p className="text-xs text-slate-400 mt-1">{selectedWf.citizen} ({selectedWf.citizenId}) — {selectedWf.department}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                  <span>Started: {selectedWf.startedDate}</span>
                  <span>Updated: {selectedWf.lastUpdated}</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${STATUS_COLORS[selectedWf.status] || 'bg-slate-800 text-slate-400'}`}>{selectedWf.status}</span>
                </div>
              </div>
              {!isEditing ? (
                <button onClick={handleEdit} className="text-indigo-400 hover:text-indigo-300 p-2 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg flex items-center gap-2 text-sm font-bold transition">
                  <Settings className="w-4 h-4" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleCancelEdit} className="text-slate-400 hover:text-white p-2 bg-slate-800 rounded-lg text-sm transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Overall Progress</span>
                <span className="font-bold text-white">{selectedWf.progress}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${
                  selectedWf.progress >= 70 ? 'bg-emerald-500' : selectedWf.progress >= 40 ? 'bg-amber-500' : 'bg-red-500'
                }`} style={{ width: `${selectedWf.progress}%` }} />
              </div>
            </div>

            {/* Next Action */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>NEXT ACTION</span>
              </div>
              <p className="text-sm text-slate-300 mt-1">{selectedWf.nextAction}</p>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Workflow Steps</h3>
              {(isEditing ? editSteps : selectedWf.steps).map((step: any, idx: number) => (
                <div key={idx} className="flex items-stretch gap-4 relative">
                  {idx !== (isEditing ? editSteps : selectedWf.steps).length - 1 && (
                    <div className="absolute left-6 top-10 w-0.5 h-full bg-slate-800 -z-10" />
                  )}
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                    step.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    step.status === 'current' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                    'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                    {step.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> :
                     step.status === 'current' ? <Play className="w-5 h-5" /> :
                     <Clock className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4">
                    {!isEditing ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-bold ${step.status === 'current' ? 'text-white' : step.status === 'completed' ? 'text-slate-300' : 'text-slate-500'}`}>
                              Step {idx + 1}: {step.name}
                            </h4>
                            {step.status === 'current' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">CURRENT</span>
                            )}
                            {step.status === 'completed' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">DONE</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono mt-1">Type: {step.type} | Target: {step.target}</p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          step.type === 'Validation' ? 'bg-amber-500/5 text-amber-400 border-amber-500/20' :
                          step.type === 'Processing' ? 'bg-blue-500/5 text-blue-400 border-blue-500/20' :
                          'bg-emerald-500/5 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {step.type}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <input
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white w-full focus:border-indigo-500 outline-none"
                          value={step.name}
                          onChange={(e) => handleStepChange(idx, 'name', e.target.value)}
                          placeholder="Step Name"
                        />
                        <div className="flex gap-2">
                          <input className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-300 flex-1 focus:border-indigo-500 outline-none" value={step.type} onChange={(e) => handleStepChange(idx, 'type', e.target.value)} placeholder="Type" />
                          <input className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-300 flex-1 focus:border-indigo-500 outline-none" value={step.target} onChange={(e) => handleStepChange(idx, 'target', e.target.value)} placeholder="Target" />
                        </div>
                        <div className="flex justify-end">
                          <button onClick={() => handleRemoveStep(idx)} className="p-1 text-rose-400 hover:text-rose-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isEditing && (
                <button onClick={handleAddStep} className="w-full mt-4 py-3 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl text-slate-400 hover:text-indigo-400 font-bold text-sm flex items-center justify-center gap-2 transition">
                  <Plus className="w-4 h-4" /> Add New Step
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
