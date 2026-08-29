'use client';

import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertTriangle, Clock, Search, UserCheck, Merge, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export const EntityMatchReview = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    const mockTasks = [
      {
        id: 'er_001',
        citizen_id: 'user_hriday_123',
        source_a: 'JanSetu Canonical',
        record_a: { full_name: 'Hriday Bardia', date_of_birth: '2006-01-12', mobile: '9876543210' },
        source_b: 'Revenue Department',
        record_b: { full_name: 'Hriday Bardia', date_of_birth: '2006-01-12', mobile: '9876543210' },
        match_confidence: 100.0,
        confidence_category: 'HIGH CONFIDENCE',
        status: 'CONFIRMED',
        evidence: [
          { field: 'Name', status: 'Exact Match' },
          { field: 'Date of Birth', status: 'Exact Match' }
        ]
      },
      {
        id: 'er_002',
        citizen_id: 'user_varad_456',
        source_a: 'JanSetu Canonical',
        record_a: { full_name: 'Varad', date_of_birth: '1995-05-20' },
        source_b: 'Education Connector',
        record_b: { full_name: 'Varad K', date_of_birth: '1995-05-20' },
        match_confidence: 84.2,
        confidence_category: 'REVIEW RECOMMENDED',
        status: 'PENDING_REVIEW',
        evidence: [
          { field: 'Name', status: 'Partial Match' },
          { field: 'Date of Birth', status: 'Exact Match' }
        ]
      },
      {
        id: 'er_003',
        citizen_id: 'user_ayush_789',
        source_a: 'JanSetu Canonical',
        record_a: { full_name: 'Ayush Singh Chauhan', date_of_birth: '2000-11-15' },
        source_b: 'Municipality Batch',
        record_b: { full_name: 'Unknown', date_of_birth: '2001-01-01' },
        match_confidence: 42.1,
        confidence_category: 'UNRESOLVED',
        status: 'PENDING_REVIEW',
        evidence: [
          { field: 'Name', status: 'Mismatch' },
          { field: 'Date of Birth', status: 'Mismatch' }
        ]
      }
    ];
    setTasks(mockTasks);
  }, []);

  const pendingTasks = tasks.filter(t => t.status === 'PENDING_REVIEW');
  const resolvedTasks = tasks.filter(t => t.status === 'CONFIRMED');

  const handleResolve = (id: string, decision: 'MERGE' | 'REJECT') => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'CONFIRMED', confidence_category: decision === 'MERGE' ? 'MANUAL MERGE' : 'REJECTED' } : t));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Merge className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span>Entity Resolution Center</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Review deterministic and probabilistic identity matches across departments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-4 rounded-xl shadow-2xs flex items-center gap-4">
          <div className="bg-amber-100 dark:bg-amber-950/60 p-3 rounded-lg"><AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400" /></div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{pendingTasks.length}</div>
            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Pending Review</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-4 rounded-xl shadow-2xs flex items-center gap-4">
          <div className="bg-emerald-100 dark:bg-emerald-950/60 p-3 rounded-lg"><CheckCircle className="w-5 h-5 text-emerald-700 dark:text-emerald-400" /></div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{resolvedTasks.length}</div>
            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Auto-Resolved</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-4 rounded-xl shadow-2xs flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-950/60 p-3 rounded-lg"><Activity className="w-5 h-5 text-[#133E87] dark:text-blue-400" /></div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">88.5%</div>
            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Avg Confidence</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">Pending Resolution Tasks</h3>
        {pendingTasks.map(task => (
          <div key={task.id} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1 space-y-4 w-full text-xs">
              <div className="flex items-center justify-between">
                <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  {task.confidence_category} ({task.match_confidence}%)
                </span>
                <span className="text-xs font-mono text-slate-500">{task.id}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">{task.source_a}</div>
                  <div className="space-y-1">
                    {Object.entries(task.record_a).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-slate-500">{k}:</span>
                        <span className="text-slate-900 dark:text-white font-bold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">{task.source_b}</div>
                  <div className="space-y-1">
                    {Object.entries(task.record_b).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-slate-500">{k}:</span>
                        <span className="text-slate-900 dark:text-white font-bold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {task.evidence.map((ev: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-[11px] whitespace-nowrap">
                    <span className="text-slate-600 dark:text-slate-400">{ev.field}:</span>
                    <span className={`font-bold ${ev.status === 'Exact Match' ? 'text-emerald-700 dark:text-emerald-400' : ev.status === 'Partial Match' ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'}`}>
                      {ev.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex md:flex-col gap-2 w-full md:w-36 shrink-0">
              <button 
                onClick={() => handleResolve(task.id, 'MERGE')}
                className="flex-1 bg-[#0B2545] hover:bg-[#133E87] text-white font-bold py-2 px-3 rounded-lg text-xs transition shadow-2xs cursor-pointer"
              >
                Approve Merge
              </button>
              <button 
                onClick={() => handleResolve(task.id, 'REJECT')}
                className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold py-2 px-3 rounded-lg text-xs transition cursor-pointer"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default EntityMatchReview;
