'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Briefcase, Filter, CheckCircle2, Clock, AlertTriangle, ArrowRight, X, FileText, ChevronDown, RefreshCw, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface AdminApplicationData {
  id: string;
  citizenName: string;
  citizenId: string;
  service: string;
  department: string;
  status: string;
  submittedDate: string;
  lastUpdated: string;
  nextAction: string;
  location?: string;
  sla?: string;
  timeline: { title: string; description: string; timestamp: string; status: string }[];
  required_actions: string[];
  documents: { name: string; status: string }[];
  workflow?: { step: string; status: string }[];
}

interface Props {
  adminUsername: string;
}

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  UNDER_VERIFICATION: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  UNDER_REVIEW: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  DOCUMENTS_REQUIRED: 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse',
  ACTION_REQUIRED: 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse',
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  REJECTED: 'bg-red-500/10 text-red-400 border border-red-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
};

export const AdminApplicationsView = ({ adminUsername }: Props) => {
  const [applications, setApplications] = useState<AdminApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AdminApplicationData[]>('/admin/real-applications');
      if (data) {
        setApplications(data);
      } else {
        setError('Unable to load applications. The backend may be unavailable.');
      }
    } catch (e: any) {
      console.warn('[Admin] Failed to fetch real applications:', e);
      setError(e?.message || 'Unable to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const [filter, setFilter] = useState('All');
  const [selectedApp, setSelectedApp] = useState<AdminApplicationData | null>(null);

  const filteredApps = useMemo(() => {
    if (filter === 'All') return applications;
    return applications.filter(app => {
      if (filter === 'Submitted') return app.status === 'SUBMITTED';
      if (filter === 'Under Verification') return app.status === 'UNDER_VERIFICATION' || app.status === 'UNDER_REVIEW';
      if (filter === 'Documents Required') return app.status === 'DOCUMENTS_REQUIRED';
      if (filter === 'Action Required') return app.status === 'ACTION_REQUIRED';
      if (filter === 'Approved') return app.status === 'APPROVED';
      if (filter === 'Completed') return app.status === 'COMPLETED';
      return true;
    });
  }, [applications, filter]);

  const stats = useMemo(() => ({
    total: applications.length,
    submitted: applications.filter(a => a.status === 'SUBMITTED').length,
    inProgress: applications.filter(a => ['UNDER_VERIFICATION', 'UNDER_REVIEW'].includes(a.status)).length,
    docsRequired: applications.filter(a => a.status === 'DOCUMENTS_REQUIRED').length,
    actionRequired: applications.filter(a => a.status === 'ACTION_REQUIRED').length,
    completed: applications.filter(a => ['APPROVED', 'COMPLETED'].includes(a.status)).length,
  }), [applications]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-purple-400" />
            <span>Application Monitor</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track and manage citizen applications across departments.
          </p>
        </div>
        <button
          onClick={fetchApplications}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={fetchApplications} className="ml-auto text-red-300 hover:text-white font-bold text-[10px] uppercase">Retry</button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', count: stats.total, color: 'text-white' },
          { label: 'Submitted', count: stats.submitted, color: 'text-cyan-400' },
          { label: 'In Progress', count: stats.inProgress, color: 'text-blue-400' },
          { label: 'Docs Required', count: stats.docsRequired, color: 'text-red-400' },
          { label: 'Action Required', count: stats.actionRequired, color: 'text-amber-400' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold">{s.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-500" />
        {['All', 'Submitted', 'Under Verification', 'Documents Required', 'Action Required', 'Approved', 'Completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === f ? 'bg-purple-500 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Applications Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Application ID</th>
                <th className="px-5 py-4 font-medium">Citizen</th>
                <th className="px-5 py-4 font-medium">Service</th>
                <th className="px-5 py-4 font-medium">Department</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Submitted</th>
                <th className="px-5 py-4 font-medium">Next Action</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredApps.map(app => (
                <tr key={app.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setSelectedApp(app)}>
                  <td className="px-5 py-4 font-mono text-xs text-purple-400 font-bold">{app.id}</td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-200 text-xs">{app.citizenName}</div>
                    <div className="text-[10px] font-mono text-slate-500">{app.citizenId}</div>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-200">{app.service}</td>
                  <td className="px-5 py-4 text-xs text-slate-400 max-w-[200px] truncate">{app.department}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[app.status] || 'bg-slate-800 text-slate-400'}`}>
                      {app.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-400">{app.submittedDate}</td>
                  <td className="px-5 py-4 text-xs text-slate-400 max-w-[180px] truncate">{app.nextAction}</td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-purple-400 hover:text-purple-300 text-xs font-medium flex items-center gap-1 ml-auto">
                      Inspect <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredApps.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-500 text-sm">No applications match your filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-800/50">
          {filteredApps.map(app => (
            <div key={app.id} className="p-4 space-y-2 cursor-pointer" onClick={() => setSelectedApp(app)}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-200 text-sm">{app.service}</div>
                  <div className="text-[10px] font-mono text-purple-400">{app.id}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${STATUS_COLORS[app.status] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  {app.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-xs text-slate-400">Citizen: {app.citizenName}</div>
              <div className="text-xs text-slate-500">{app.nextAction}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-start sticky top-0 bg-slate-900 z-10">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-purple-400" />
                  {selectedApp.id}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{selectedApp.service} — {selectedApp.citizenName}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-slate-500 mb-1">Citizen</p><p className="text-slate-200 font-medium">{selectedApp.citizenName} ({selectedApp.citizenId})</p></div>
                <div><p className="text-xs text-slate-500 mb-1">Status</p>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[selectedApp.status] || 'bg-slate-800 text-slate-400'}`}>
                    {selectedApp.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div><p className="text-xs text-slate-500 mb-1">Department</p><p className="text-slate-200">{selectedApp.department}</p></div>
                <div><p className="text-xs text-slate-500 mb-1">Location</p><p className="text-slate-200">{selectedApp.location}</p></div>
                <div><p className="text-xs text-slate-500 mb-1">Submitted</p><p className="text-slate-200">{selectedApp.submittedDate}</p></div>
                <div><p className="text-xs text-slate-500 mb-1">Last Updated</p><p className="text-slate-200">{selectedApp.lastUpdated}</p></div>
                <div className="col-span-2"><p className="text-xs text-slate-500 mb-1">Next Action</p><p className="text-amber-400 font-medium">{selectedApp.nextAction}</p></div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Documents</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedApp.documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs">
                      <span className="text-slate-300 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        {doc.name}
                      </span>
                      {doc.status === 'verified' ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</span>
                      ) : (
                        <span className="text-amber-400 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {doc.status === 'pending' ? 'Pending' : 'Required'}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Workflow */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Workflow</h3>
                <div className="relative border-l border-slate-800 ml-3 pl-6 space-y-4">
                  {(selectedApp.workflow || []).map((step: { step: string; status: string }, i: number) => (
                    <div key={i} className="relative">
                      <div className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full border border-slate-900 ${
                        step.status === 'completed' ? 'bg-emerald-500' :
                        step.status === 'current' ? 'bg-blue-500 animate-pulse' :
                        'bg-slate-700'
                      }`} />
                      <div className={`text-sm ${step.status === 'current' ? 'text-white font-bold' : step.status === 'completed' ? 'text-slate-300' : 'text-slate-500'}`}>
                        {step.step}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              {selectedApp.timeline.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Timeline</h3>
                  <div className="space-y-3">
                    {selectedApp.timeline.map((evt, i) => (
                      <div key={i} className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-300">{evt.title}</span>
                          <span className="text-[10px] text-slate-500">{evt.timestamp}</span>
                        </div>
                        <p className="text-slate-400 mt-1">{evt.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
