'use client';

import React, { useState, useMemo } from 'react';
import { 
  GitMerge, 
  Settings, 
  Play, 
  Database, 
  Shield, 
  FileCheck, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronRight 
} from 'lucide-react';
import { getWorkflowsForAdmin, AdminWorkflow } from '@/lib/adminData';
import { useLanguage } from '@/context/LanguageContext';
import { CitizenJourneysQueue } from '@/components/admin/CitizenJourneysQueue';

interface Props {
  adminUsername: string;
}

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
  Pending: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
  'Action Required': 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800',
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
    <div className="space-y-8 animate-fadeIn">
      {/* Live Citizen Workflows Telemetry Queue */}
      <CitizenJourneysQueue />

      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>{t('adminWorkflow.title', 'State Workflow & DAG Rule Engine')}</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t('adminWorkflow.desc', 'Configure cross-departmental orchestrator stages, statutory prerequisite rules, and fallback pathways.')}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t('adminWorkflow.total', 'Total Workflows'), count: workflows.length, color: 'text-slate-900 dark:text-white' },
          { label: t('adminInterop.statusActive', 'Active'), count: workflows.filter(w => w.status === 'Active').length, color: 'text-emerald-700 dark:text-emerald-400' },
          { label: t('adminApplications.statusPending', 'Pending'), count: workflows.filter(w => w.status === 'Pending').length, color: 'text-amber-700 dark:text-amber-400' },
          { label: t('adminApplications.statusActionRequired', 'Action Required'), count: workflows.filter(w => w.status === 'Action Required').length, color: 'text-rose-700 dark:text-rose-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-3.5 rounded-xl text-center shadow-2xs">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{s.label}</p>
            <p className={`text-xl font-black mt-0.5 ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Workflow List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xs overflow-hidden p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('adminWorkflow.activeList', 'Configured Workflow Templates')}</h3>
          {workflows.map((wf) => (
            <button
              key={wf.id}
              onClick={() => { if (!isEditing) setSelectedWf(wf); }}
              className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer shadow-2xs ${
                selectedWf?.id === wf.id 
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-[#133E87] dark:border-blue-500' 
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              } ${isEditing && selectedWf?.id !== wf.id ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{wf.name}</div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_COLORS[wf.status] || 'bg-slate-100 text-slate-700'}`}>
                  {wf.status}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">{wf.citizen} • {wf.department}</div>
              <div className="mt-2.5">
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  <span>{wf.currentStep}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{wf.progress}%</span>
                </div>
                <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
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
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xs p-6 relative">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{selectedWf.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{selectedWf.citizen} ({selectedWf.citizenId}) • {selectedWf.department}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                  <span>{t('adminWorkflow.started', 'Initiated:')} {selectedWf.startedDate}</span>
                  <span>{t('adminWorkflow.updated', 'Updated:')} {selectedWf.lastUpdated}</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${STATUS_COLORS[selectedWf.status] || 'bg-slate-100 text-slate-700'}`}>{selectedWf.status}</span>
                </div>
              </div>
              {!isEditing ? (
                <button onClick={handleEdit} className="text-[#133E87] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 p-2 rounded-lg flex items-center gap-1.5 text-xs font-bold transition cursor-pointer border border-blue-200 dark:border-blue-800">
                  <Settings className="w-3.5 h-3.5" />
                  <span>{t('adminWorkflow.edit', 'Configure Rules')}</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleCancelEdit} className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg text-xs font-bold transition border border-slate-300 dark:border-slate-700 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>{t('adminWorkflow.overallProgress', 'Workflow Progression')}</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedWf.progress}%</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${
                  selectedWf.progress >= 70 ? 'bg-emerald-500' : selectedWf.progress >= 40 ? 'bg-amber-500' : 'bg-red-500'
                }`} style={{ width: `${selectedWf.progress}%` }} />
              </div>
            </div>

            {/* Next Action */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{t('adminWorkflow.nextAction', 'Next Statutory Milestone')}</span>
              </div>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1">{selectedWf.nextAction}</p>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('adminWorkflow.workflowSteps', 'Sequential DAG Execution Steps')}</h3>
              {(isEditing ? editSteps : selectedWf.steps).map((step: any, idx: number) => (
                <div key={idx} className="flex items-stretch gap-4 relative">
                  {idx !== (isEditing ? editSteps : selectedWf.steps).length - 1 && (
                    <div className="absolute left-6 top-10 w-0.5 h-full bg-slate-200 dark:bg-slate-800 -z-10" />
                  )}
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                    step.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' :
                    step.status === 'current' ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-[#133E87] dark:text-blue-400' :
                    'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
                  }`}>
                    {step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> :
                     step.status === 'current' ? <Play className="w-4 h-4" /> :
                     <Clock className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
                    {!isEditing ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className={`text-xs font-bold ${step.status === 'current' ? 'text-slate-900 dark:text-white' : step.status === 'completed' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                              {t('adminWorkflow.step', 'Step')} {idx + 1}: {step.name}
                            </h4>
                            {step.status === 'current' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-[#133E87] dark:text-blue-300 border border-blue-200 dark:border-blue-800">{t('adminWorkflow.current', 'Current')}</span>
                            )}
                            {step.status === 'completed' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">{t('adminWorkflow.done', 'Done')}</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">{t('adminWorkflow.type', 'Type:')} {step.type} • {t('adminWorkflow.target', 'Target:')} {step.target}</p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          step.type === 'Validation' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          step.type === 'Processing' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {step.type}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <input
                          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-900 dark:text-white w-full focus:ring-2 focus:ring-[#133E87] outline-none"
                          value={step.name}
                          onChange={(e) => handleStepChange(idx, 'name', e.target.value)}
                          placeholder={t('adminWorkflow.placeholderName', 'Step Name')}
                        />
                        <div className="flex gap-2">
                          <input className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-slate-700 dark:text-slate-300 flex-1 focus:ring-2 focus:ring-[#133E87] outline-none" value={step.type} onChange={(e) => handleStepChange(idx, 'type', e.target.value)} placeholder="Type" />
                          <input className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-slate-700 dark:text-slate-300 flex-1 focus:ring-2 focus:ring-[#133E87] outline-none" value={step.target} onChange={(e) => handleStepChange(idx, 'target', e.target.value)} placeholder="Target" />
                        </div>
                        <div className="flex justify-end">
                          <button onClick={() => handleRemoveStep(idx)} className="p-1 text-rose-600 hover:text-rose-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isEditing && (
                <button onClick={handleAddStep} className="w-full mt-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#133E87] rounded-xl text-slate-600 dark:text-slate-400 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer">
                  <Plus className="w-4 h-4" /> {t('adminWorkflow.addNewStep', '+ Add Rule Step')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default AdminWorkflowView;
