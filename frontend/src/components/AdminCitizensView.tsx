'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Briefcase, 
  Activity, 
  ChevronRight, 
  X, 
  UserCheck, 
  RefreshCw,
  UserCircle
} from 'lucide-react';
import { getCitizensForAdmin, AdminCitizen } from '@/lib/adminData';
import { useLanguage } from '@/context/LanguageContext';
import { useLiveSync } from '@/context/LiveSyncContext';
import { DEMO_CITIZENS } from '@/data/demoCitizens';
import { apiFetch } from '@/lib/api';

interface Props {
  adminUsername: string;
}

export const AdminCitizensView = ({ adminUsername }: Props) => {
  const citizens = useMemo(() => getCitizensForAdmin(adminUsername), [adminUsername]);
  const [citizensList, setCitizensList] = useState<AdminCitizen[]>(citizens);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCitizen, setSelectedCitizen] = useState<AdminCitizen | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const { requestCitizenDoc, applications: liveApps } = useLiveSync();
  const { t } = useLanguage();

  const fetchCitizens = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<any[]>('/admin/citizens');
      if (data && data.length > 0) {
        const mapped = data.map((c: any) => ({
          id: c.id || c.citizen_id || 'CZ-2026-000',
          username: c.username || c.email || 'citizen',
          name: c.name || c.full_name || 'Citizen',
          domicile: c.domicile_state || 'Not Specified',
          location: c.location || 'India',
          documentsTotal: c.documents_total || 4,
          documentsVerified: c.documents_verified || 3,
          documentsPending: (c.documents_total || 4) - (c.documents_verified || 3),
          activeApplications: c.active_applications || 1,
          activeWorkflows: c.active_workflows || 1,
          status: c.status || 'Active',
          lastActive: 'Just now',
          lastGoal: c.last_goal || 'Higher Education & Welfare',
          profileCompletion: c.profile_completion || 85,
          lastActivity: c.last_activity || 'Aadhaar e-KYC verified',
          assignedTo: c.assigned_to || 'DISHITA',
          documents: c.documents || [
            { name: 'Aadhaar Card', status: 'Verified' },
            { name: 'PAN Card', status: 'Verified' }
          ],
          applications: c.applications || [
            { id: 'APP-001', service: 'National Apprenticeship', status: 'APPROVED' }
          ],
          recentActivity: c.recent_activity || [
            'Aadhaar e-KYC verified successfully'
          ]
        }));
        setCitizensList(mapped as AdminCitizen[]);
      }
    } catch (e: any) {
      if (e.status !== 403) {
        console.warn('[Admin] Failed to fetch real citizens:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredCitizens = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return citizensList.filter(citizen => {
      const matchesSearch = 
        !q ||
        (citizen.name || '').toLowerCase().includes(q) ||
        (citizen.id || '').toLowerCase().includes(q) ||
        (citizen.username || '').toLowerCase().includes(q) ||
        (citizen.location || '').toLowerCase().includes(q) ||
        ((citizen as any).state || '').toLowerCase().includes(q);
      
      const matchesStatus = statusFilter === 'All' || citizen.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [citizensList, searchQuery, statusFilter]);

  const totalDocs = citizensList.reduce((a, c) => a + c.documentsTotal, 0);
  const totalVerified = citizensList.reduce((a, c) => a + c.documentsVerified, 0);
  const totalPending = citizensList.reduce((a, c) => a + c.documentsPending, 0);
  const totalApps = citizensList.reduce((a, c) => a + c.activeApplications, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>{t('adminCitizens.registry', 'Citizen Beneficiary Registry')}</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t('adminCitizens.registryDesc', 'Master citizen demographic profile ledger and cross-departmental credential status.')}
          </p>
        </div>
        <button
          onClick={fetchCitizens}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition disabled:opacity-50 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? t('adminCitizens.loading', 'Loading...') : t('adminCitizens.refresh', 'Refresh')}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
          <button onClick={fetchCitizens} className="ml-auto text-red-700 hover:text-red-900 font-bold text-[10px] uppercase">Retry</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-4 rounded-xl shadow-2xs space-y-1">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t('adminCitizens.totalCitizens', 'Total Citizens')}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{citizensList.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-4 rounded-xl shadow-2xs space-y-1">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t('adminCitizens.docsVerified', 'Docs Verified')}</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{totalVerified}</p>
          <p className="text-[10px] text-slate-500">{totalPending} {t('adminCitizens.pendingLower', 'pending')}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-4 rounded-xl shadow-2xs space-y-1">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t('adminCitizens.activeApps', 'Active Applications')}</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{totalApps}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-4 rounded-xl shadow-2xs space-y-1">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t('adminCitizens.pendingActions', 'Action Required')}</p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{citizens.filter(c => c.status === 'Action Required').length}</p>
        </div>
      </div>

      {/* Search & Filters Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/40">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">{t('adminCitizens.registeredUsers', 'Registered Beneficiary Directory')}</h2>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#133E87]"
            >
              <option value="All">{t('adminCitizens.allStatus', 'All Statuses')}</option>
              <option value="Active">{t('adminCitizens.statusActive', 'Active')}</option>
              <option value="Action Required">{t('adminCitizens.statusActionRequired', 'Action Required')}</option>
              <option value="Pending KYC">{t('adminCitizens.statusPendingKYC', 'Pending KYC')}</option>
            </select>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('adminCitizens.searchPlaceholder', 'Search by name, ID, username...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white rounded-lg pl-9 pr-4 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#133E87]"
              />
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5 font-bold">{t('adminCitizens.colName', 'Citizen')}</th>
                <th className="px-6 py-3.5 font-bold">{t('adminCitizens.colCitizenID', 'UID / Identifier')}</th>
                <th className="px-6 py-3.5 font-bold">{t('adminCitizens.colDomicile', 'Domicile')}</th>
                <th className="px-6 py-3.5 font-bold text-center">{t('adminCitizens.colDocuments', 'Documents')}</th>
                <th className="px-6 py-3.5 font-bold text-center">{t('adminCitizens.colApplications', 'Applications')}</th>
                <th className="px-6 py-3.5 font-bold text-center">{t('adminCitizens.colWorkflows', 'Workflows')}</th>
                <th className="px-6 py-3.5 font-bold">{t('adminCitizens.colStatus', 'Status')}</th>
                <th className="px-6 py-3.5 font-bold">{t('adminCitizens.colLastActivity', 'Last Active')}</th>
                <th className="px-6 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredCitizens.map((citizen) => (
                <tr 
                  key={citizen.id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer" 
                  onClick={() => setSelectedCitizen(citizen)}
                >
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-[#133E87] dark:text-blue-400" />
                    <span>{citizen.name}</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">{citizen.id}</td>
                  <td className="px-6 py-4 font-medium">{citizen.domicile}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">{citizen.documentsVerified}</span>
                      <span className="text-slate-400"> / </span>
                      <span className="text-slate-600 dark:text-slate-400">{citizen.documentsTotal}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-blue-50 dark:bg-blue-950/60 text-[#133E87] dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      {citizen.activeApplications}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      {citizen.activeWorkflows}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      citizen.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300' :
                      citizen.status === 'Action Required' ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 animate-pulse' :
                      'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300'
                    }`}>
                      {citizen.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{citizen.lastActive}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#133E87] dark:text-blue-400 hover:underline text-xs font-bold flex items-center gap-1 ml-auto">
                      <span>{t('adminCitizens.viewProfile', 'View')}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCitizens.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-500 text-xs">
                    {t('adminCitizens.noCitizensFound', 'No registered citizens match your query.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
          {filteredCitizens.map((citizen) => (
            <div key={citizen.id} className="p-4 space-y-3 cursor-pointer" onClick={() => setSelectedCitizen(citizen)}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                  <UserCircle className="w-4 h-4 text-slate-500" />
                  {citizen.name}
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  citizen.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                  citizen.status === 'Action Required' ? 'bg-red-100 text-red-800 border-red-300' :
                  'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {citizen.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{t('adminCitizens.docsShort', 'Docs')}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">{citizen.documentsVerified}/{citizen.documentsTotal}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{t('adminCitizens.appsShort', 'Apps')}</span>
                  <span className="text-[#133E87] dark:text-blue-400 font-bold">{citizen.activeApplications}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{t('adminCitizens.colWorkflows', 'Workflows')}</span>
                  <span className="text-purple-700 dark:text-purple-400 font-bold">{citizen.activeWorkflows}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Citizen Detail Modal Drawer */}
      {selectedCitizen && (() => {
        const selName = (selectedCitizen.name || selectedCitizen.username || '').toLowerCase().trim();
        const selUser = (selectedCitizen.username || '').toLowerCase().trim();
        const selId = (selectedCitizen.id || '').replace(/\D/g, '');

        const demoInfo = DEMO_CITIZENS.find(dc => {
          const dcUser = (dc.username || '').toLowerCase().trim();
          const dcName = (dc.name || '').toLowerCase().trim();
          const dcAadhaar = (dc.rawAadhaar || '').replace(/\D/g, '');
          return (
            (selUser && dcUser && selUser === dcUser) ||
            (selName && dcName && (selName.includes(dcName) || dcName.includes(selName))) ||
            (selId && dcAadhaar && (selId === dcAadhaar || selId.endsWith(dcAadhaar) || dcAadhaar.endsWith(selId)))
          );
        });

        const citizenApps = liveApps.filter(a => {
          const aName = (a?.citizenName || '').toLowerCase().trim();
          const aId = (a?.citizenId || '').replace(/\D/g, '');
          const aUser = (a?.id || '').toLowerCase();
          return (
            (selName && aName && (aName.includes(selName) || selName.includes(aName))) ||
            (selId && aId && (aId === selId || aId.endsWith(selId) || selId.endsWith(aId))) ||
            (selUser && (aUser.includes(selUser) || aName.includes(selUser)))
          );
        });

        const handleRequestDocFromCitizen = (docName: string, dept: string = 'Administrative Portal') => {
          const matchingApp = citizenApps[0] || {
            id: selectedCitizen.username === 'ayush' ? 'JS-2026-8801' :
                selectedCitizen.username === 'hriday' ? 'JS-2026-8802' :
                selectedCitizen.username === 'varad' ? 'JS-2026-8803' : 'JS-2026-8804',
            department: dept
          };

          requestCitizenDoc({
            appId: matchingApp.id,
            citizenName: selectedCitizen.name,
            docName: docName,
            dept: matchingApp.department || dept
          });

          setActionNotice(t(`e-KYC verification request for "${docName}" transmitted to ${selectedCitizen.name} across Live Mesh.`, `e-KYC verification request for "${docName}" transmitted to ${selectedCitizen.name} across Live Mesh.`));
          setTimeout(() => setActionNotice(null), 5000);
        };

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedCitizen(null); }}
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] overflow-y-auto animate-scaleUp text-xs">
              {/* Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#133E87]/15 border border-[#133E87]/30 flex items-center justify-center text-[#133E87] dark:text-blue-400 font-bold font-serif text-base">
                      {selectedCitizen.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{selectedCitizen.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          selectedCitizen.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300' :
                          'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300'
                        }`}>
                          {t(selectedCitizen.status, selectedCitizen.status)}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {t('Aadhaar UID:', 'Aadhaar UID:')} <strong className="text-slate-800 dark:text-slate-200">{demoInfo?.aadhaar || selectedCitizen.id}</strong> | @{selectedCitizen.username}
                      </p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCitizen(null)} 
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Notification Toast */}
              {actionNotice && (
                <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 flex items-center gap-2 font-bold animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{actionNotice}</span>
                </div>
              )}

              <div className="p-6 space-y-6">
                {/* Demographic Details */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    {t('Master Beneficiary Demographics (NSSO & UIDAI)', 'Master Beneficiary Demographics (NSSO & UIDAI)')}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <p className="text-slate-500 text-[11px] mb-0.5">{t('Phone Number', 'Phone Number')}</p>
                      <p className="text-slate-900 dark:text-white font-bold">{demoInfo?.phone || '+91 XXXXX 9901'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px] mb-0.5">{t('Date of Birth', 'Date of Birth')}</p>
                      <p className="text-slate-900 dark:text-white font-bold">{demoInfo?.dob || '15/08/2001'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px] mb-0.5">{t('Gender / Category', 'Gender / Category')}</p>
                      <p className="text-slate-900 dark:text-white font-bold">{t(demoInfo?.gender || 'Male', demoInfo?.gender || 'Male')} ({t(demoInfo?.category || 'General', demoInfo?.category || 'General')})</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px] mb-0.5">{t('Annual Income Tier', 'Annual Income Tier')}</p>
                      <p className="text-slate-900 dark:text-white font-bold">₹{(demoInfo?.annualIncome || 320000).toLocaleString('en-IN')} ({t(demoInfo?.incomeCategory || 'Middle Class', demoInfo?.incomeCategory || 'Middle Class')})</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px] mb-0.5">{t('State Domicile', 'State Domicile')}</p>
                      <p className="text-slate-900 dark:text-white font-bold">{t(selectedCitizen.domicile, selectedCitizen.domicile)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px] mb-0.5">{t('Profile Consistency', 'Profile Consistency')}</p>
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedCitizen.profileCompletion}% {t('Match', 'Match')}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <p className="text-slate-500 text-[11px] mb-0.5">{t('Registered Residential Address', 'Registered Residential Address')}</p>
                      <p className="text-slate-900 dark:text-white font-medium">{demoInfo?.address || selectedCitizen.location}</p>
                    </div>
                  </div>
                </div>

                {/* Active Applications */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    {t('Active Beneficiary Applications & Schemes', 'Active Beneficiary Applications & Schemes')}
                  </h3>
                  <div className="space-y-2">
                    {(citizenApps.length > 0 ? citizenApps : (selectedCitizen.applications || [])).map((app: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">
                            {app.id}
                          </span>
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs mt-1">
                            {t(app.service, app.service)}
                          </h4>
                          <p className="text-[11px] text-slate-500">{t(app.department || 'Central Welfare Portal', app.department || 'Central Welfare Portal')}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                          app.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300' :
                          app.status === 'DOCUMENTS_REQUIRED' || app.status === 'ACTION_REQUIRED' ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300' :
                          'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300'
                        }`}>
                          {t(app.status, app.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents & Direct e-KYC Request Actions */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    {t('Verified Documents & Department Credential Ledger', 'Verified Documents & Department Credential Ledger')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(selectedCitizen.documents || []).map((doc: { name: string; status: string }, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs">
                        <span className="text-xs text-slate-900 dark:text-slate-200 font-medium flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-[#133E87] dark:text-blue-400 shrink-0" />
                          <span>{t(doc.name, doc.name)}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {doc.status !== 'Verified' && (
                            <button
                              type="button"
                              onClick={() => handleRequestDocFromCitizen(doc.name)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition cursor-pointer shadow-xs"
                            >
                              {t('Request e-KYC', 'Request e-KYC')}
                            </button>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            doc.status === 'Verified'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 animate-pulse'
                          }`}>
                            {t(doc.status, doc.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
export default AdminCitizensView;
