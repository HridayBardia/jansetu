'use client';

import React, { useState, useEffect } from 'react';
import { GitMerge, Settings, Play, Database, Shield, FileCheck, Plus, Trash2, ArrowUp, ArrowDown, Save, X } from 'lucide-react';
import { fetchWorkflowsAPI, createWorkflowAPI, deleteWorkflowAPI } from '@/lib/api';

export const AdminWorkflowView = () => {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWf, setSelectedWf] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editSteps, setEditSteps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const MOCK_ACTIVE_WORKFLOWS = [
    {
      id: 'wf_001',
      name: 'Business Registration — Gujarat',
      category: 'business',
      department: 'Industries Commissionerate, Gujarat',
      status: 'ACTIVE',
      citizen: 'Hriday Bardia',
      currentStep: 'Document Verification',
      progress: 60,
      lastActivity: '2 hours ago',
      nextAction: 'Upload premises rent agreement',
      steps: [
        { id: 's1', step_key: 'identity_verify', name: 'Identity Verification', step_type: 'Validation', target: 'UIDAI Aadhaar API', prerequisite_step_key: null, order_index: 1 },
        { id: 's2', step_key: 'address_verify', name: 'Address Verification', step_type: 'Validation', target: 'State Land Registry', prerequisite_step_key: 'identity_verify', order_index: 2 },
        { id: 's3', step_key: 'doc_collection', name: 'Document Collection', step_type: 'Action', target: 'Citizen Vault', prerequisite_step_key: 'address_verify', order_index: 3 },
        { id: 's4', step_key: 'udyam_register', name: 'Udyam MSME Registration', step_type: 'Processing', target: 'udyamregistration.gov.in', prerequisite_step_key: 'doc_collection', order_index: 4 },
        { id: 's5', step_key: 'trade_license', name: 'Trade License Application', step_type: 'Action', target: 'Municipal Corporation', prerequisite_step_key: 'doc_collection', order_index: 5 }
      ]
    },
    {
      id: 'wf_002',
      name: 'Higher Education Assistance — Study Abroad',
      category: 'education',
      department: 'Ministry of Education',
      status: 'ACTIVE',
      citizen: 'Varad Kanade',
      currentStep: 'Eligibility Review',
      progress: 40,
      lastActivity: '5 hours ago',
      nextAction: 'Submit English proficiency test scores',
      steps: [
        { id: 's1', step_key: 'passport_check', name: 'Passport Verification', step_type: 'Validation', target: 'Passport Seva Portal', prerequisite_step_key: null, order_index: 1 },
        { id: 's2', step_key: 'academic_verify', name: 'Academic Records Verification', step_type: 'Validation', target: 'DigiLocker / University', prerequisite_step_key: 'passport_check', order_index: 2 },
        { id: 's3', step_key: 'english_test', name: 'English Proficiency Test', step_type: 'Action', target: 'IELTS/PTE Portal', prerequisite_step_key: 'academic_verify', order_index: 3 },
        { id: 's4', step_key: 'scholarship_apply', name: 'Scholarship Application', step_type: 'Processing', target: 'National Scholarship Portal', prerequisite_step_key: 'academic_verify', order_index: 4 }
      ]
    },
    {
      id: 'wf_003',
      name: 'Property Registration — Bangalore',
      category: 'property',
      department: 'Kaveri Online Services, Karnataka',
      status: 'PENDING',
      citizen: 'Satwik',
      currentStep: 'Application Review',
      progress: 75,
      lastActivity: '1 day ago',
      nextAction: 'Await sub-registrar slot confirmation',
      steps: [
        { id: 's1', step_key: 'title_verify', name: 'Title Verification', step_type: 'Validation', target: 'Kaveri Online', prerequisite_step_key: null, order_index: 1 },
        { id: 's2', step_key: 'stamp_duty', name: 'Stamp Duty Payment', step_type: 'Processing', target: 'Karnataka GRAS Portal', prerequisite_step_key: 'title_verify', order_index: 2 },
        { id: 's3', step_key: 'slot_booking', name: 'Sub-Registrar Slot Booking', step_type: 'Action', target: 'Kaveri Online', prerequisite_step_key: 'stamp_duty', order_index: 3 },
        { id: 's4', step_key: 'final_registration', name: 'Final Registration', step_type: 'Action', target: 'Sub-Registrar Office', prerequisite_step_key: 'slot_booking', order_index: 4 }
      ]
    },
    {
      id: 'wf_004',
      name: 'Government Scholarship Application',
      category: 'education',
      department: 'National Scholarship Portal',
      status: 'ACTION_REQUIRED',
      citizen: 'Ayush',
      currentStep: 'Document Collection',
      progress: 30,
      lastActivity: '1 day ago',
      nextAction: 'Upload income certificate',
      steps: [
        { id: 's1', step_key: 'income_cert', name: 'Income Certificate Upload', step_type: 'Action', target: 'Revenue Department', prerequisite_step_key: null, order_index: 1 },
        { id: 's2', step_key: 'caste_cert', name: 'Category Certificate Upload', step_type: 'Action', target: 'Revenue Department', prerequisite_step_key: null, order_index: 2 },
        { id: 's3', step_key: 'nsp_apply', name: 'NSP Application Submission', step_type: 'Processing', target: 'scholarships.gov.in', prerequisite_step_key: 'income_cert', order_index: 3 },
        { id: 's4', step_key: 'verification', name: 'Institutional Verification', step_type: 'Validation', target: 'College / University', prerequisite_step_key: 'nsp_apply', order_index: 4 }
      ]
    }
  ];

  const loadWorkflows = async () => {
    setIsLoading(true);
    try {
      const data = await fetchWorkflowsAPI();
      if (data && data.length > 0) {
        setWorkflows(data);
      } else {
        setWorkflows(MOCK_ACTIVE_WORKFLOWS);
      }
      if ((data && data.length > 0) || !selectedWf) {
        setSelectedWf((data && data.length > 0) ? data[0] : MOCK_ACTIVE_WORKFLOWS[0]);
      }
    } catch (e) {
      console.error(e);
      setWorkflows(MOCK_ACTIVE_WORKFLOWS);
      if (!selectedWf) setSelectedWf(MOCK_ACTIVE_WORKFLOWS[0]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  const handleEdit = () => {
    setEditSteps([...selectedWf.steps]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditSteps([]);
  };

  const handleAddStep = () => {
    setEditSteps([...editSteps, {
      id: `new_${Date.now()}`,
      step_key: 'new_step',
      name: 'New Step',
      step_type: 'Action',
      target: 'New Target',
      prerequisite_step_key: null,
      order_index: editSteps.length + 1
    }]);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = [...editSteps];
    newSteps.splice(index, 1);
    // Re-index
    newSteps.forEach((s, i) => s.order_index = i + 1);
    setEditSteps(newSteps);
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === editSteps.length - 1) return;

    const newSteps = [...editSteps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;
    
    // Re-index
    newSteps.forEach((s, i) => s.order_index = i + 1);
    setEditSteps(newSteps);
  };

  const handleStepChange = (index: number, field: string, value: string) => {
    const newSteps = [...editSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setEditSteps(newSteps);
  };

  const handleSave = async () => {
    try {
      // Delete existing
      await deleteWorkflowAPI(selectedWf.id);
      
      // Create new
      const payload = {
        name: selectedWf.name,
        category: selectedWf.category,
        department: selectedWf.department,
        steps: editSteps.map(s => ({
          step_key: s.step_key,
          name: s.name,
          step_type: s.step_type,
          target: s.target,
          prerequisite_step_key: s.prerequisite_step_key || null,
          order_index: s.order_index
        }))
      };
      
      await createWorkflowAPI(payload);
      setIsEditing(false);
      await loadWorkflows();
      
      // Select the updated workflow by category
      const newData = await fetchWorkflowsAPI();
      const updated = newData.find((w: any) => w.category === selectedWf.category);
      if (updated) setSelectedWf(updated);
      
    } catch (e) {
      console.error(e);
      alert('Failed to save workflow');
    }
  };

  if (isLoading) {
    return <div className="text-white">Loading workflows...</div>;
  }

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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Active Workflows</h3>
          {workflows.map((wf: any) => (
            <button
              key={wf.id}
              onClick={() => {
                if (!isEditing) setSelectedWf(wf);
              }}
              className={`w-full text-left p-4 rounded-xl border transition ${
                selectedWf?.id === wf.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="font-bold text-sm text-slate-200">{wf.name}</div>
              <div className="text-[10px] text-slate-500 mt-1">{wf.department}</div>
              <div className="mt-2 text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded w-fit">
                {wf.status}
              </div>
            </button>
          ))}
          {workflows.length === 0 && (
            <div className="text-slate-400 text-sm p-4 text-center">No workflows found. Run seed script.</div>
          )}
        </div>

        {selectedWf && (
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 relative">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">{selectedWf.name}</h2>
                <p className="text-xs text-slate-400">Pipeline Execution Rules</p>
              </div>
              
              {!isEditing ? (
                <button onClick={handleEdit} className="text-indigo-400 hover:text-indigo-300 p-2 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg flex items-center gap-2 text-sm font-bold transition">
                  <Settings className="w-4 h-4" /> Edit Workflow
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleCancelEdit} className="text-slate-400 hover:text-white p-2 bg-slate-800 rounded-lg flex items-center gap-2 text-sm transition">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button onClick={handleSave} className="text-emerald-400 hover:text-emerald-300 p-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg flex items-center gap-2 text-sm font-bold transition">
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {(isEditing ? editSteps : selectedWf.steps).map((step: any, idx: number) => (
                <div key={step.id || idx} className="flex items-stretch gap-4 relative">
                  {idx !== (isEditing ? editSteps : selectedWf.steps).length - 1 && (
                    <div className="absolute left-6 top-10 w-0.5 h-full bg-slate-800 -z-10" />
                  )}
                  
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                    step.step_type === 'Ingestion' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                    step.step_type === 'Validation' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                    step.step_type === 'Security' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                    'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {step.step_type === 'Ingestion' ? <Database className="w-5 h-5" /> :
                     step.step_type === 'Validation' ? <FileCheck className="w-5 h-5" /> :
                     step.step_type === 'Security' ? <Shield className="w-5 h-5" /> :
                     <Play className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4">
                    {!isEditing ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-200">{step.name}</h4>
                          <p className="text-[11px] text-slate-500 font-mono mt-1">Key: {step.step_key} | Target: {step.target}</p>
                          {step.prerequisite_step_key && (
                             <p className="text-[11px] text-amber-500/80 font-mono mt-1">Requires: {step.prerequisite_step_key}</p>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          step.step_type === 'Ingestion' ? 'bg-blue-500/5 text-blue-400 border-blue-500/20' :
                          step.step_type === 'Validation' ? 'bg-amber-500/5 text-amber-400 border-amber-500/20' :
                          step.step_type === 'Security' ? 'bg-rose-500/5 text-rose-400 border-rose-500/20' :
                          'bg-emerald-500/5 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {step.step_type}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input 
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white flex-1 focus:border-indigo-500 outline-none" 
                            value={step.name} 
                            onChange={(e) => handleStepChange(idx, 'name', e.target.value)}
                            placeholder="Step Name"
                          />
                          <select 
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:border-indigo-500 outline-none"
                            value={step.step_type}
                            onChange={(e) => handleStepChange(idx, 'step_type', e.target.value)}
                          >
                            <option value="Ingestion">Ingestion</option>
                            <option value="Validation">Validation</option>
                            <option value="Security">Security</option>
                            <option value="Action">Action</option>
                            <option value="Processing">Processing</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           <input 
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-300 focus:border-indigo-500 outline-none" 
                            value={step.step_key} 
                            onChange={(e) => handleStepChange(idx, 'step_key', e.target.value)}
                            placeholder="Step Key (e.g. document_prep)"
                          />
                          <input 
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-300 focus:border-indigo-500 outline-none" 
                            value={step.target} 
                            onChange={(e) => handleStepChange(idx, 'target', e.target.value)}
                            placeholder="Target API/Portal"
                          />
                        </div>
                        <div>
                           <input 
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-amber-400/80 focus:border-amber-500 outline-none placeholder-slate-600" 
                            value={step.prerequisite_step_key || ''} 
                            onChange={(e) => handleStepChange(idx, 'prerequisite_step_key', e.target.value)}
                            placeholder="Prerequisite Step Key (Optional)"
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                          <button onClick={() => handleMoveStep(idx, 'up')} disabled={idx === 0} className="p-1 text-slate-400 hover:text-white disabled:opacity-30">
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleMoveStep(idx, 'down')} disabled={idx === editSteps.length - 1} className="p-1 text-slate-400 hover:text-white disabled:opacity-30">
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleRemoveStep(idx)} className="p-1 text-rose-400 hover:text-rose-300 ml-2">
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
