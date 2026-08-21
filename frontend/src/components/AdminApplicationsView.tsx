'use client';

import React, { useState } from 'react';
import { Briefcase, Filter, CheckCircle2, Clock, AlertTriangle, ArrowRight, X } from 'lucide-react';

const mockGlobalApplications = [
  {
    id: 'APP-KA-00124',
    citizen: 'Hriday Bardia',
    citizenId: 'CIT-8921-HRD',
    service: 'Business Registration',
    department: 'Dept of Industries',
    state: 'Karnataka',
    status: 'Under Verification',
    sla: 'On Track',
    lastUpdated: 'Today, 8:42 PM',
  },
  {
    id: 'APP-KA-00991',
    citizen: 'Hriday Bardia',
    citizenId: 'CIT-8921-HRD',
    service: 'Local Trade License',
    department: 'Municipal Corp',
    state: 'Karnataka',
    status: 'Action Required',
    sla: 'Breach Warning',
    lastUpdated: 'Yesterday, 2:15 PM',
  },
  {
    id: 'APP-MH-02311',
    citizen: 'Varad',
    citizenId: 'CIT-4412-VRD',
    service: 'Driving Licence',
    department: 'Transport Dept',
    state: 'Maharashtra',
    status: 'Completed',
    sla: 'Met',
    lastUpdated: '3 days ago',
  },
  {
    id: 'APP-RJ-10022',
    citizen: 'Ayuh',
    citizenId: 'CIT-7734-AYH',
    service: 'Scholarship App',
    department: 'Education Dept',
    state: 'Rajasthan',
    status: 'Under Verification',
    sla: 'On Track',
    lastUpdated: '5 hours ago',
  }
];

import { useAuth } from '@/context/AuthContext';
import { fetchApplicationsAPI, fetchCitizensAPI } from '@/lib/api';

export const AdminApplicationsView = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('All');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [adminApps, setAdminApps] = useState<any[]>([]);
  const [citizens, setCitizens] = useState<any[]>([]);

  React.useEffect(() => {
    fetchApplicationsAPI().then(data => {
      if (data) setAdminApps(data);
    });
    fetchCitizensAPI().then(data => {
      if (data) setCitizens(data);
    });
  }, []);

  const getCitizenInfo = (userId: string) => {
    const c = citizens.find(cit => cit.id === userId);
    return c ? { name: c.full_name, citId: `CIT-${c.id.substring(0, 4).toUpperCase()}` } : { name: 'Unknown Citizen', citId: userId };
  };

  const filteredApps = adminApps.filter(app => {
    if (filter === 'All') return true;
    if (filter === 'Action Required') return app.status === 'DOCUMENTS_REQUIRED' || app.status === 'UNDER_VERIFICATION';
    if (filter === 'SLA Breach') return false; // Add SLA logic later if needed
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-purple-400" />
            <span>Application Monitor</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global view of all citizen applications, workflow states, and SLA tracking.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-sm text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500"
          >
            <option value="All">All Applications</option>
            <option value="Action Required">Action Required</option>
            <option value="SLA Breach">SLA Breaches</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Application ID</th>
                <th className="px-6 py-4 font-medium">Citizen</th>
                <th className="px-6 py-4 font-medium">Service & Dept</th>
                <th className="px-6 py-4 font-medium">State</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">SLA</th>
                <th className="px-6 py-4 font-medium">Last Updated</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredApps.map(app => (
                <tr key={app.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-200 font-bold">{app.application_id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-200">{getCitizenInfo(app.user_id).name}</div>
                    <div className="text-[10px] font-mono text-slate-500">{getCitizenInfo(app.user_id).citId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-200">{app.service_name}</div>
                    <div className="text-xs text-slate-400">{app.department_name}</div>
                  </td>
                  <td className="px-6 py-4">-</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      app.status === 'DOCUMENTS_REQUIRED' ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' :
                      app.status === 'UNDER_VERIFICATION' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                      'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}>
                      {app.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      On Track
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">{new Date(app.updated_at || app.submitted_at).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedApp(app)}
                      className="text-purple-400 hover:text-purple-300 text-xs font-medium flex items-center gap-1 ml-auto"
                    >
                      Inspect <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-800/50">
          {filteredApps.map(app => (
            <div key={app.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-200">{app.service_name}</div>
                  <div className="text-[10px] font-mono text-slate-400">{app.application_id}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                  app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  app.status === 'DOCUMENTS_REQUIRED' ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' :
                  app.status === 'UNDER_VERIFICATION' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                  'bg-slate-900 text-slate-400 border border-slate-800'
                }`}>
                  {app.status.replace("_", " ")}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Citizen</span>
                  <span className="text-slate-300">{getCitizenInfo(app.user_id).name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">State</span>
                  <span className="text-slate-300">-</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  On Track
                </span>
                <button 
                  onClick={() => setSelectedApp(app)}
                  className="text-purple-400 hover:text-purple-300 text-[11px] font-bold bg-purple-500/10 px-3 py-1.5 rounded"
                >
                  Inspect Details
                </button>
              </div>
            </div>
          ))}
          {filteredApps.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              No applications match your filter.
            </div>
          )}
        </div>
      </div>

      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-purple-400" />
                  {selectedApp.application_id}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{selectedApp.service_name} - {getCitizenInfo(selectedApp.user_id).name}</p>
              </div>
              <button 
                onClick={() => setSelectedApp(null)}
                className="text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="relative border-l border-slate-800 ml-3 pl-6 space-y-6 text-sm">
                
                {selectedApp.timeline && selectedApp.timeline.length > 0 ? (
                  selectedApp.timeline.map((evt: any, idx: number) => (
                    <div key={idx} className="relative">
                      <div className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full border border-slate-900 ${
                        evt.status === 'APPROVED' ? 'bg-emerald-500' : 
                        evt.status === 'DOCUMENTS_REQUIRED' ? 'bg-red-500 animate-pulse' : 
                        'bg-cyan-500'
                      }`} />
                      <div>
                        <h4 className="font-bold text-sm text-slate-300">{evt.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">{evt.description}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{new Date(evt.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-emerald-500 border border-slate-900" />
                    <div>
                      <h4 className="font-bold text-emerald-400 text-sm">Citizen Form Submission</h4>
                      <p className="text-xs text-slate-400 mt-1">Data mapped from Interoperability Registry.</p>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
