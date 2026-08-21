"use client";

import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Server,
  Activity,
  Play
} from 'lucide-react';

interface APIRecord {
  id: string;
  name: string;
  category: string;
  official_url: string;
  status: string;
  response_time_ms: number;
  last_checked: string | null;
  country: string;
  requires_key: boolean;
}

export default function AdminAPIRegistry() {
  const [apis, setApis] = useState<APIRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchApis = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/admin/apis", {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setApis(data.data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApis();
  }, []);

  const triggerDiscovery = async () => {
    setDiscovering(true);
    try {
      await fetch("http://localhost:8000/api/v1/admin/apis/discover", {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      alert("API Discovery started in the background. It will scrape github and test endpoints.");
      setTimeout(fetchApis, 5000);
    } catch (e) {
      console.error(e);
    }
    setDiscovering(false);
  };

  const testApi = async (id: string) => {
    try {
      await fetch(`http://localhost:8000/api/v1/admin/apis/${id}/test`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      fetchApis();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = apis.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.category.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Network className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
            </div>
            Global API Registry
          </h1>
          <p className="text-slate-500 mt-1">Manage and monitor dynamically discovered public APIs.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={triggerDiscovery}
            disabled={discovering}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {discovering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Discover APIs
          </button>
          <button 
            onClick={fetchApis}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-slate-500">Total APIs</p>
            <Server className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{apis.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-slate-500">Active</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{apis.filter(a => a.status === 'ACTIVE').length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-slate-500">Avg Latency</p>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {apis.length > 0 ? Math.round(apis.reduce((a,b) => a + (b.response_time_ms || 0), 0) / apis.length) : 0} ms
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-slate-500">Degraded/Down</p>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{apis.filter(a => a.status !== 'ACTIVE' && a.status !== 'pending_check').length}</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search APIs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">API Name</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Latency</th>
                <th className="px-6 py-3 font-medium">Auth</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map(api => (
                <tr key={api.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{api.name}</div>
                    <a href={api.official_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">
                      {api.official_url ? (api.official_url.length > 30 ? api.official_url.substring(0, 30) + '...' : api.official_url) : 'No URL'}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                      {api.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {api.status === 'ACTIVE' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {api.status === 'DEGRADED' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      {api.status === 'DOWN' && <XCircle className="w-4 h-4 text-red-500" />}
                      {api.status === 'TIMEOUT' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                      {api.status === 'pending_check' && <RefreshCw className="w-4 h-4 text-slate-400" />}
                      <span className={`font-medium ${
                        api.status === 'ACTIVE' ? 'text-emerald-700' :
                        api.status === 'DOWN' || api.status === 'TIMEOUT' ? 'text-red-700' :
                        api.status === 'DEGRADED' ? 'text-amber-700' : 'text-slate-500'
                      }`}>
                        {api.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {api.response_time_ms > 0 ? `${api.response_time_ms} ms` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {api.requires_key ? (
                      <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-medium">Key Required</span>
                    ) : (
                      <span className="text-slate-500">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => testApi(api.id)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Test API"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No APIs found. Click "Discover APIs" to populate the registry from GitHub.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
