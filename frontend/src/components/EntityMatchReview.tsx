import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertTriangle, Clock, Search, UserCheck, Merge } from 'lucide-react';

export const EntityMatchReview = () => {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    // In a real implementation, this would fetch from GET /api/v1/admin/entity-resolution
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
        citizen_id: 'user_ayuh_789',
        source_a: 'JanSetu Canonical',
        record_a: { full_name: 'Ayuh', date_of_birth: '2000-11-15' },
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <Merge className="w-6 h-6 text-purple-400" />
          <span>Entity Resolution Center</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">Review deterministic and probabilistic identity matches across departments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="bg-amber-500/10 p-3 rounded-lg"><AlertTriangle className="w-6 h-6 text-amber-500" /></div>
          <div>
            <div className="text-2xl font-black text-white">{pendingTasks.length}</div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pending Review</div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-lg"><CheckCircle className="w-6 h-6 text-emerald-500" /></div>
          <div>
            <div className="text-2xl font-black text-white">{resolvedTasks.length}</div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Auto-Resolved</div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="bg-blue-500/10 p-3 rounded-lg"><Activity className="w-6 h-6 text-blue-500" /></div>
          <div>
            <div className="text-2xl font-black text-white">88.5%</div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Avg Confidence</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">Pending Resolution Tasks</h3>
        {pendingTasks.map(task => (
          <div key={task.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1 space-y-4 w-full">
              <div className="flex items-center justify-between">
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                  {task.confidence_category} ({task.match_confidence}%)
                </span>
                <span className="text-xs font-mono text-slate-500">{task.id}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">{task.source_a}</div>
                  <div className="space-y-1">
                    {Object.entries(task.record_a).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-slate-400">{k}</span>
                        <span className="text-white font-medium">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 relative">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 bg-slate-800 p-1 rounded-full md:block hidden">
                    <ArrowRightIcon />
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">{task.source_b}</div>
                  <div className="space-y-1">
                    {Object.entries(task.record_b).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-slate-400">{k}</span>
                        <span className="text-white font-medium">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {task.evidence.map((ev: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded text-xs whitespace-nowrap">
                    <span className="text-slate-400">{ev.field}:</span>
                    <span className={ev.status === 'Exact Match' ? 'text-emerald-400' : ev.status === 'Partial Match' ? 'text-amber-400' : 'text-rose-400'}>
                      {ev.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col gap-2 w-full md:w-48 pt-8">
              <button onClick={() => handleResolve(task.id, 'MERGE')} className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 px-4 rounded-lg transition text-sm">
                Confirm Match
              </button>
              <button onClick={() => handleResolve(task.id, 'REJECT')} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition text-sm">
                Reject Match
              </button>
            </div>
          </div>
        ))}
        {pendingTasks.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
            No pending resolution tasks!
          </div>
        )}
      </div>
    </div>
  );
};

const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
