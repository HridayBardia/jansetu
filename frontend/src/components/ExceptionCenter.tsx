'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, RefreshCw, ServerCrash, Zap, Database } from 'lucide-react';

export const ExceptionCenter = () => {
  const [exceptions, setExceptions] = useState<any[]>([]);

  useEffect(() => {
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
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ServerCrash className="w-5 h-5 text-rose-600 dark:text-rose-500" />
          <span>Exception & Retry Center</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Manage failed orchestration steps, dead-letter queues, and automatic retries.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-4 rounded-xl shadow-2xs flex items-center gap-4">
          <div className="bg-rose-100 dark:bg-rose-950/60 p-3 rounded-lg"><AlertCircle className="w-5 h-5 text-rose-700 dark:text-rose-500" /></div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{activeExceptions.length}</div>
            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Active Errors</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-4 rounded-xl shadow-2xs flex items-center gap-4">
          <div className="bg-amber-100 dark:bg-amber-950/60 p-3 rounded-lg"><Clock className="w-5 h-5 text-amber-700 dark:text-amber-500" /></div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">1</div>
            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Waiting Retry</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-4 rounded-xl shadow-2xs flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-950/60 p-3 rounded-lg"><Database className="w-5 h-5 text-[#133E87] dark:text-blue-500" /></div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">2</div>
            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Schema Errors</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-4 rounded-xl shadow-2xs flex items-center gap-4">
          <div className="bg-purple-100 dark:bg-purple-950/60 p-3 rounded-lg"><Zap className="w-5 h-5 text-purple-700 dark:text-purple-500" /></div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">99.8%</div>
            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Reliability</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {activeExceptions.map(exc => (
          <div key={exc.id} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row justify-between gap-6 items-center">
            
            <div className="flex-1 space-y-2 w-full text-xs">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                  exc.error_type === 'TIMEOUT' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border-amber-300' : 
                  exc.error_type === 'SCHEMA_MISMATCH' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-400 border-blue-300' : 
                  'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400 border-rose-300'
                }`}>
                  {exc.error_type}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Connector: {exc.connector_id}</span>
                <span className="text-[10px] text-slate-500 font-mono">App: {exc.application_id}</span>
              </div>
              
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{exc.error_message}</h3>
              
              <div className="flex items-center gap-6 text-xs text-slate-500">
                <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Attempts: {exc.attempts}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Time: {new Date(exc.created_at).toLocaleTimeString()}</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 w-full md:w-auto min-w-[180px]">
              <div className={`text-center text-xs font-bold p-2 rounded bg-slate-50 dark:bg-slate-950 border ${exc.status === 'ESCALATED' ? 'text-rose-700 dark:text-rose-400 border-rose-300' : 'text-amber-700 dark:text-amber-400 border-amber-300'}`}>
                STATUS: {exc.status}
              </div>
              <button 
                onClick={() => handleRetry(exc.id)}
                disabled={exc.status === 'RETRYING...'}
                className="w-full bg-[#0B2545] hover:bg-[#133E87] dark:bg-pink-600 dark:hover:bg-pink-500 text-white font-bold py-2 rounded-lg transition text-xs flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                {exc.status === 'RETRYING...' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Force Retry Now'}
              </button>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
};
export default ExceptionCenter;
