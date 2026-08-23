import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, RefreshCw, ServerCrash, Zap, Database } from 'lucide-react';

export const ExceptionCenter = () => {
  const [exceptions, setExceptions] = useState<any[]>([]);

  useEffect(() => {
    // In a real implementation, this would fetch from GET /api/v1/admin/exceptions
    const mockExceptions = [
      {
        id: 'exc_001',
        application_id: 'app_1001',
        connector_id: 'conn_education',
        error_type: 'TIMEOUT',
        error_message: 'Connection to legacy SOAP service timed out after 30s',
        attempts: 2,
        status: 'WAITING_RETRY',
        next_retry: new Date(Date.now() + 5 * 60000).toISOString(),
        created_at: new Date(Date.now() - 30 * 60000).toISOString()
      },
      {
        id: 'exc_002',
        application_id: 'app_1002',
        connector_id: 'conn_welfare',
        error_type: 'SCHEMA_MISMATCH',
        error_message: "Missing required field 'annual_income' in mapping v2.1",
        attempts: 1,
        status: 'ESCALATED',
        next_retry: null,
        created_at: new Date(Date.now() - 120 * 60000).toISOString()
      },
      {
        id: 'exc_003',
        application_id: 'app_1003',
        connector_id: 'conn_mca',
        error_type: 'AUTH_FAILURE',
        error_message: 'Invalid API Key for external registry',
        attempts: 3,
        status: 'ESCALATED',
        next_retry: null,
        created_at: new Date(Date.now() - 240 * 60000).toISOString()
      }
    ];
    setExceptions(mockExceptions);
  }, []);

  const handleRetry = (id: string) => {
    setExceptions(prev => prev.map(e => e.id === id ? { ...e, status: 'RETRYING...' } : e));
    setTimeout(() => {
        setExceptions(prev => prev.filter(e => e.id !== id));
    }, 1500);
  };

  const activeExceptions = exceptions.filter(e => e.status !== 'RESOLVED');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <ServerCrash className="w-6 h-6 text-rose-500" />
          <span>Exception & Retry Center</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">Manage failed orchestration steps, dead-letter queues, and automatic retries.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="bg-rose-500/10 p-3 rounded-lg"><AlertCircle className="w-6 h-6 text-rose-500" /></div>
          <div>
            <div className="text-2xl font-black text-white">{activeExceptions.length}</div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Errors</div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="bg-amber-500/10 p-3 rounded-lg"><Clock className="w-6 h-6 text-amber-500" /></div>
          <div>
            <div className="text-2xl font-black text-white">1</div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Waiting Retry</div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="bg-blue-500/10 p-3 rounded-lg"><Database className="w-6 h-6 text-blue-500" /></div>
          <div>
            <div className="text-2xl font-black text-white">2</div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Schema Errors</div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="bg-purple-500/10 p-3 rounded-lg"><Zap className="w-6 h-6 text-purple-500" /></div>
          <div>
            <div className="text-2xl font-black text-white">99.8%</div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Reliability</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {activeExceptions.map(exc => (
          <div key={exc.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row justify-between gap-6 items-center">
            
            <div className="flex-1 space-y-2 w-full">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                  exc.error_type === 'TIMEOUT' ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' : 
                  exc.error_type === 'SCHEMA_MISMATCH' ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' : 
                  'bg-rose-500/20 text-rose-400 border-rose-500/20'
                }`}>
                  {exc.error_type}
                </span>
                <span className="text-xs text-slate-500 font-mono">Connector: {exc.connector_id}</span>
                <span className="text-xs text-slate-500 font-mono">App: {exc.application_id}</span>
              </div>
              
              <h3 className="text-white font-medium">{exc.error_message}</h3>
              
              <div className="flex items-center gap-6 text-xs text-slate-400">
                <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Attempts: {exc.attempts}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Time: {new Date(exc.created_at).toLocaleTimeString()}</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 w-full md:w-auto min-w-[200px]">
              <div className={`text-center text-xs font-bold p-2 rounded bg-slate-950 border ${exc.status === 'ESCALATED' ? 'text-rose-400 border-rose-500/30' : 'text-amber-400 border-amber-500/30'}`}>
                STATUS: {exc.status}
              </div>
              {exc.status === 'WAITING_RETRY' && exc.next_retry && (
                <div className="text-center text-[10px] text-slate-500 font-mono">
                  Next Retry: {new Date(exc.next_retry).toLocaleTimeString()}
                </div>
              )}
              <button 
                onClick={() => handleRetry(exc.id)}
                disabled={exc.status === 'RETRYING...'}
                className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 disabled:bg-slate-700 text-slate-950 font-bold py-2 rounded transition text-sm flex items-center justify-center gap-2 mt-1"
              >
                {exc.status === 'RETRYING...' ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Force Retry Now'}
              </button>
            </div>
            
          </div>
        ))}
        {activeExceptions.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
            All systems nominal. No active exceptions.
          </div>
        )}
      </div>
    </div>
  );
};
