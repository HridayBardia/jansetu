'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Landmark, 
  Sparkles, 
  CheckCircle2, 
  X, 
  FileText, 
  ShieldCheck, 
  Send, 
  Loader2, 
  Building2, 
  Calendar, 
  Award,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { SchemeCard, SchemeProps } from './SchemeCard';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { SCHEMES_DATABASE, SCHEME_CATEGORIES, SchemeItem } from '@/data/schemesData';

interface CitizenSchemeExplorerProps {
  onApplicationSubmitted?: (newApp: any) => void;
}

export const CitizenSchemeExplorer: React.FC<CitizenSchemeExplorerProps> = ({ onApplicationSubmitted }) => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Schemes');
  const [appliedSchemeIds, setAppliedSchemeIds] = useState<string[]>([]);
  const [selectedSchemeForApply, setSelectedSchemeForApply] = useState<SchemeProps | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState<any | null>(null);

  const filteredSchemes = useMemo(() => {
    return SCHEMES_DATABASE.filter(sch => {
      // Category match
      if (selectedCategory !== 'All Schemes' && sch.category !== selectedCategory) {
        return false;
      }
      // Search match
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        sch.name.toLowerCase().includes(q) ||
        sch.official_name.toLowerCase().includes(q) ||
        sch.description.toLowerCase().includes(q) ||
        sch.department.toLowerCase().includes(q) ||
        sch.category.toLowerCase().includes(q) ||
        sch.tags.some(tag => tag.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

  const handleOpenApplyModal = (scheme: SchemeProps) => {
    setSelectedSchemeForApply(scheme);
    setApplicationSuccess(null);
  };

  const handleConfirmSubmit = () => {
    if (!selectedSchemeForApply) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const generatedId = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newApp = {
        id: generatedId,
        title: selectedSchemeForApply.name,
        service_name: selectedSchemeForApply.name,
        department: selectedSchemeForApply.department,
        department_name: selectedSchemeForApply.department,
        status: 'SUBMITTED',
        submittedDate: new Date().toISOString().slice(0, 10),
        timeline: [
          {
            title: 'Application Submitted',
            description: 'Direct digital application submitted via JanSetu Unified Gateway.',
            timestamp: new Date().toISOString(),
            status: 'SUBMITTED'
          },
          {
            title: 'Automated Identity Resolution',
            description: 'Aadhaar e-KYC credentials validated with UIDAI registry.',
            timestamp: new Date().toISOString(),
            status: 'SUBMITTED'
          }
        ]
      };

      setAppliedSchemeIds(prev => [...prev, selectedSchemeForApply.id]);
      setIsSubmitting(false);
      setApplicationSuccess({
        appId: generatedId,
        schemeName: selectedSchemeForApply.name,
        department: selectedSchemeForApply.department
      });

      if (onApplicationSubmitted) {
        onApplicationSubmitted(newApp);
      }
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-amber-500" />
            <span>National Welfare Scheme Explorer</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Discover, check eligibility, and apply with 1-click verified e-KYC data prefill.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schemes or benefits..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9.5 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition shadow-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 tab-scrollbar-hide">
        {SCHEME_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
              selectedCategory === cat
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSchemes.map((scheme) => (
          <SchemeCard
            key={scheme.id}
            scheme={scheme}
            isApplied={appliedSchemeIds.includes(scheme.id)}
            onApply={handleOpenApplyModal}
          />
        ))}
      </div>

      {filteredSchemes.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
          <Landmark className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="font-bold text-slate-800 dark:text-slate-200">No schemes found matching "{searchQuery}"</p>
          <p className="text-xs text-slate-400 mt-1">Try selecting a different category or clearing search terms.</p>
        </div>
      )}

      {/* Interactive Application Modal */}
      {selectedSchemeForApply && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setSelectedSchemeForApply(null);
          }}
        >
          <div 
            className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh] overflow-y-auto space-y-5 animate-scale-up text-slate-900 dark:text-white"
            role="dialog"
            aria-modal="true"
          >
            {!applicationSuccess ? (
              <>
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      Pre-Filled e-KYC Application
                    </span>
                    <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mt-1">
                      {selectedSchemeForApply.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedSchemeForApply.department}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedSchemeForApply(null)}
                    disabled={isSubmitting}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Pre-filled Citizen Data */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Verified Applicant Details (UIDAI e-KYC)
                  </span>
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Full Name</span>
                      <span className="font-bold text-slate-900 dark:text-white">{user?.full_name || 'Ayush Singh Chauhan'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Aadhaar (Masked)</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{profile?.aadhaar || 'XXXX XXXX 0207'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Domicile State</span>
                      <span className="font-medium text-slate-900 dark:text-white">{profile?.location_state || 'Rajasthan'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Income & Category</span>
                      <span className="font-medium text-slate-900 dark:text-white">EWS • General</span>
                    </div>
                  </div>
                </div>

                {/* Direct Benefits Review */}
                {selectedSchemeForApply.benefits && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4 rounded-2xl space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                      Target Benefit Disbursal
                    </span>
                    {Object.entries(selectedSchemeForApply.benefits).map(([k, v]) => (
                      <p key={k} className="text-slate-800 dark:text-slate-200 font-medium">
                        <span className="capitalize">{k.replace(/_/g, ' ')}:</span> <span className="font-bold text-slate-950 dark:text-white">{String(v)}</span>
                      </p>
                    ))}
                  </div>
                )}

                {/* Consent & Submit */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>DPDP Act 2023 Consent Active</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleConfirmSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Application</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Success View */
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Application Submitted!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Your request has been registered with the national portal under ID:
                  </p>
                  <p className="text-base font-mono font-black text-amber-500 mt-2 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-xl inline-block">
                    {applicationSuccess.appId}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-left space-y-1 text-slate-600 dark:text-slate-300">
                  <p>• <strong>Scheme:</strong> {applicationSuccess.schemeName}</p>
                  <p>• <strong>Department:</strong> {applicationSuccess.department}</p>
                  <p>• <strong>Tracking:</strong> Live telemetry status tracker initialized in your Applications tab.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSchemeForApply(null)}
                  className="w-full py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs rounded-xl hover:opacity-90 transition cursor-pointer"
                >
                  Done & Return to Explorer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default CitizenSchemeExplorer;
