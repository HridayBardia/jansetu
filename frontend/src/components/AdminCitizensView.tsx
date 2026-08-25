'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Users, Search, Activity, Briefcase, AlertCircle, FileText, CheckCircle2, ChevronRight, UserCircle, X, Shield, MapPin, Clock, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface AdminCitizenData {
  id: string;
  name: string;
  username: string;
  domicile: string;
  location: string;
  status: 'Active' | 'Action Required' | 'Pending KYC';
  lastActive: string;
  lastActivity?: string;
  documentsTotal: number;
  documentsVerified: number;
  documentsPending: number;
  activeApplications: number;
  activeWorkflows: number;
  lastGoal: string;
  profileCompletion: number;
  documents?: { name: string; status: string }[];
  applications?: { id: string; service: string; status: string }[];
  recentActivity?: string[];
}

interface Props {
  adminUsername: string;
}

export const AdminCitizensView = ({ adminUsername }: Props) => {
  const [citizens, setCitizens] = useState<AdminCitizenData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCitizens();
  }, []);

  const fetchCitizens = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<AdminCitizenData[]>('/admin/real-citizens');
      if (data) setCitizens(data);
    } catch (e) {
      console.warn('[Admin] Failed to fetch real citizens:', e);
    } finally {
      setLoading(false);
    }
  };

  const citizensList = citizens;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedCitizen, setSelectedCitizen] = useState<AdminCitizenData | null>(null);

  const filteredCitizens = useMemo(() => {
    return citizensList.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [citizensList, searchQuery, statusFilter]);

  const totalDocs = citizensList.reduce((a, c) => a + c.documentsTotal, 0);
  const totalVerified = citizensList.reduce((a, c) => a + c.documentsVerified, 0);
  const totalPending = citizensList.reduce((a, c) => a + c.documentsPending, 0);
  const totalApps = citizensList.reduce((a, c) => a + c.activeApplications, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-400" />
          <span>Citizen Registry</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          View citizens assigned to you and monitor their government journeys.
        </p>
      </div>
      <button
        onClick={fetchCitizens}
        disabled={loading}
        className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Loading...' : 'Refresh'}
      </button>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Total Citizens</p>
          <p className="text-2xl font-bold text-white mt-1">{citizensList.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Documents Verified</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{totalVerified}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{totalPending} pending</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Active Applications</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{totalApps}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Pending Actions</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{citizens.filter(c => c.status === 'Action Required').length}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-slate-200">Registered Users</h2>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-sm text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Action Required">Action Required</option>
              <option value="Pending KYC">Pending KYC</option>
            </select>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, ID, username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-sm text-slate-200 rounded-lg pl-9 pr-4 py-2 w-full sm:w-64 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Citizen ID</th>
                <th className="px-6 py-4 font-medium">Domicile</th>
                <th className="px-6 py-4 font-medium text-center">Documents</th>
                <th className="px-6 py-4 font-medium text-center">Applications</th>
                <th className="px-6 py-4 font-medium text-center">Workflows</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Last Activity</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredCitizens.map((citizen) => (
                <tr key={citizen.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setSelectedCitizen(citizen)}>
                  <td className="px-6 py-4 font-medium text-slate-200 flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-slate-500" />
                    {citizen.name}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{citizen.id}</td>
                  <td className="px-6 py-4">{citizen.domicile}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs">
                      <span className="text-emerald-400 font-bold">{citizen.documentsVerified}</span>
                      <span className="text-slate-600"> / </span>
                      <span className="text-slate-400">{citizen.documentsTotal}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
                      {citizen.activeApplications}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
                      {citizen.activeWorkflows}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${
                      citizen.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      citizen.status === 'Action Required' ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {citizen.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">{citizen.lastActive}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-400 hover:text-blue-300 text-xs font-medium flex items-center gap-1 ml-auto">
                      View Profile <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCitizens.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-500 text-sm">
                    No citizens found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-800/50">
          {filteredCitizens.map((citizen) => (
            <div key={citizen.id} className="p-4 space-y-3 cursor-pointer" onClick={() => setSelectedCitizen(citizen)}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  <UserCircle className="w-5 h-5 text-slate-500" />
                  {citizen.name}
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                  citizen.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  citizen.status === 'Action Required' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {citizen.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Docs</span>
                  <span className="text-emerald-400 font-bold">{citizen.documentsVerified}/{citizen.documentsTotal}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Apps</span>
                  <span className="text-blue-400 font-bold">{citizen.activeApplications}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Workflows</span>
                  <span className="text-indigo-400 font-bold">{citizen.activeWorkflows}</span>
                </div>
              </div>
              <div className="flex justify-end">
                <button className="text-blue-400 hover:text-blue-300 text-[11px] font-bold bg-blue-500/10 px-3 py-1.5 rounded">
                  View Profile
                </button>
              </div>
            </div>
          ))}
          {filteredCitizens.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">No citizens found matching your search.</div>
          )}
        </div>
      </div>

      {/* Citizen Detail Modal */}
      {selectedCitizen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-start sticky top-0 bg-slate-900 z-10">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserCircle className="w-6 h-6 text-blue-400" />
                  {selectedCitizen.name}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">ID: {selectedCitizen.id} | @{selectedCitizen.username}</p>
              </div>
              <button onClick={() => setSelectedCitizen(null)} className="text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Section */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Profile</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-xs text-slate-500 mb-1">Domicile</p><p className="text-slate-200 font-medium">{selectedCitizen.domicile}</p></div>
                  <div><p className="text-xs text-slate-500 mb-1">Location</p><p className="text-slate-200">{selectedCitizen.location}</p></div>
                  <div><p className="text-xs text-slate-500 mb-1">Status</p>
                    <p className={`font-medium flex items-center gap-1 ${selectedCitizen.status === 'Active' ? 'text-emerald-400' : selectedCitizen.status === 'Action Required' ? 'text-red-400' : 'text-amber-400'}`}>
                      {selectedCitizen.status === 'Active' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {selectedCitizen.status}
                    </p>
                  </div>
                  <div><p className="text-xs text-slate-500 mb-1">Profile Completion</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedCitizen.profileCompletion}%` }} />
                      </div>
                      <span className="text-xs text-emerald-400 font-bold">{selectedCitizen.profileCompletion}%</span>
                    </div>
                  </div>
                  <div><p className="text-xs text-slate-500 mb-1">Last Goal</p><p className="text-slate-300 text-xs italic">&quot;{selectedCitizen.lastGoal}&quot;</p></div>
                  <div><p className="text-xs text-slate-500 mb-1">Last Activity</p><p className="text-slate-200">{selectedCitizen.lastActivity}</p></div>
                </div>
              </div>

              {/* Documents Section */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Documents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(selectedCitizen.documents || []).map((doc: { name: string; status: string }, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg p-3">
                      <span className="text-xs text-slate-300 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        {doc.name}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        doc.status === 'Verified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        doc.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Applications Section */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Applications</h3>
                <div className="space-y-2">
                  {(selectedCitizen.applications || []).map((app: { id: string; service: string; status: string }, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg p-3">
                      <div>
                        <span className="text-xs text-slate-300 font-medium">{app.service}</span>
                        <span className="text-[10px] text-slate-500 font-mono ml-2">{app.id}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                        app.status === 'DOCUMENTS_REQUIRED' || app.status === 'ACTION_REQUIRED' ? 'bg-red-500/10 text-red-400' :
                        'bg-cyan-500/10 text-cyan-400'
                      }`}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Activity</h3>
                <ul className="space-y-3 text-sm">
                  {(selectedCitizen.recentActivity || []).map((activity: string, i: number) => (
                    <li key={i} className="flex gap-3 text-slate-300">
                      {i === 0 ? <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> :
                       i === 1 ? <FileText className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" /> :
                       <Briefcase className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                      <span className="text-xs">{activity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
