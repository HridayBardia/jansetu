'use client';

import React, { useState } from 'react';
import { Users, Search, Activity, Briefcase, AlertCircle, FileText, CheckCircle2, ChevronRight, UserCircle } from 'lucide-react';

const mockCitizens = [
  {
    id: 'CIT-8921-HRD',
    name: 'Hriday Bardia',
    location: 'Bengaluru, Karnataka',
    activeJourneys: 2,
    applications: 4,
    accountStatus: 'Verified',
    lastActivity: '10 mins ago',
    consentStatus: 'Granted',
    identityDoc: 'Verified (Aadhaar)'
  },
  {
    id: 'CIT-4412-VRD',
    name: 'Varad',
    location: 'Pune, Maharashtra',
    activeJourneys: 1,
    applications: 2,
    accountStatus: 'Verified',
    lastActivity: '2 hours ago',
    consentStatus: 'Granted',
    identityDoc: 'Verified (Aadhaar)'
  },
  {
    id: 'CIT-7734-AYH',
    name: 'Ayuh',
    location: 'Jaipur, Rajasthan',
    activeJourneys: 3,
    applications: 1,
    accountStatus: 'Pending KYC',
    lastActivity: '1 day ago',
    consentStatus: 'Pending',
    identityDoc: 'Pending Verification'
  },
  {
    id: 'CIT-1198-STW',
    name: 'Satwik',
    location: 'Hyderabad, Telangana',
    activeJourneys: 0,
    applications: 0,
    accountStatus: 'Verified',
    lastActivity: '3 days ago',
    consentStatus: 'Revoked',
    identityDoc: 'Verified (Aadhaar)'
  }
];

import { useAuth } from '@/context/AuthContext';

export const AdminCitizensView = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCitizen, setSelectedCitizen] = useState<any>(null);

  const adminCitizens = user?.username === 'dishita' 
    ? mockCitizens.filter(c => ['CIT-8921-HRD', 'CIT-4412-VRD'].includes(c.id))
    : user?.username === 'jyoti'
    ? mockCitizens.filter(c => ['CIT-7734-AYH', 'CIT-1198-STW'].includes(c.id))
    : mockCitizens;

  const filteredCitizens = adminCitizens.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-400" />
          <span>Citizen Registry</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          View citizens using JanSetu and monitor their government journeys.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Total Citizens</p>
          <p className="text-2xl font-bold text-white mt-1">{adminCitizens.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Active Journeys</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{adminCitizens.reduce((acc, c) => acc + c.activeJourneys, 0)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Total Applications</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{adminCitizens.reduce((acc, c) => acc + c.applications, 0)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Pending Actions</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{adminCitizens.filter(c => c.accountStatus.includes('Pending')).length}</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-slate-200">Registered Users</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-sm text-slate-200 rounded-lg pl-9 pr-4 py-2 w-full sm:w-64 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Citizen ID</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium text-center">Active Journeys</th>
                <th className="px-6 py-4 font-medium text-center">Applications</th>
                <th className="px-6 py-4 font-medium">Account Status</th>
                <th className="px-6 py-4 font-medium">Last Activity</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredCitizens.map((citizen) => (
                <tr key={citizen.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-200 flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-slate-500" />
                    {citizen.name}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{citizen.id}</td>
                  <td className="px-6 py-4">{citizen.location}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
                      {citizen.activeJourneys}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
                      {citizen.applications}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${
                      citizen.accountStatus === 'Verified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {citizen.accountStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">{citizen.lastActivity}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedCitizen(citizen)}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium flex items-center gap-1 ml-auto"
                    >
                      View Profile <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCitizens.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500 text-sm">
                    No citizens found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-800/50">
          {filteredCitizens.map((citizen) => (
            <div key={citizen.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  <UserCircle className="w-5 h-5 text-slate-500" />
                  {citizen.name}
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                  citizen.accountStatus === 'Verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {citizen.accountStatus}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Citizen ID</span>
                  <span className="font-mono text-slate-400">{citizen.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Location</span>
                  <span className="text-slate-300">{citizen.location}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-2">
                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/20">
                    {citizen.activeJourneys} Journeys
                  </span>
                  <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/20">
                    {citizen.applications} Apps
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedCitizen(citizen)}
                  className="text-blue-400 hover:text-blue-300 text-[11px] font-bold bg-blue-500/10 px-3 py-1.5 rounded"
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
          {filteredCitizens.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              No citizens found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Citizen Profile Modal Overlay */}
      {selectedCitizen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserCircle className="w-6 h-6 text-blue-400" />
                  {selectedCitizen.name}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">ID: {selectedCitizen.id}</p>
              </div>
              <button 
                onClick={() => setSelectedCitizen(null)}
                className="text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Location</p>
                  <p className="text-slate-200">{selectedCitizen.location}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Account Status</p>
                  <p className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {selectedCitizen.accountStatus}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Consent Status</p>
                  <p className="text-slate-200">{selectedCitizen.consentStatus}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Identity Document Metadata</p>
                  <p className="text-slate-200">{selectedCitizen.identityDoc}</p>
                </div>
              </div>
              
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Activity</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-3 text-slate-300">
                    <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Initiated new business registration journey</span>
                  </li>
                  <li className="flex gap-3 text-slate-300">
                    <FileText className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>Consent granted for Address Verification Service</span>
                  </li>
                  <li className="flex gap-3 text-slate-300">
                    <Briefcase className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Application #APP-KA-00124 status updated</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
