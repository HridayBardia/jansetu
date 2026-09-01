'use client';

import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  Search,
  Filter,
  Landmark,
  ShieldCheck,
  ExternalLink,
  Building2,
  Award,
  Send,
  CheckCircle2,
  X,
  RotateCcw,
  Sparkles,
  Zap,
  Check,
  Tag,
  Globe,
  SlidersHorizontal,
  Calculator,
  ArrowRight
} from 'lucide-react';
import { SchemeProps } from '@/components/SchemeCard';
import { ApplicationModal } from './ApplicationModal';
import { SchemeBenefitCalculatorModal } from '@/components/SchemeBenefitCalculatorModal';
import { SCHEMES_DATABASE, SCHEME_CATEGORIES, SchemeItem } from '@/data/schemesData';
import { useLiveSync } from '@/context/LiveSyncContext';
import { useAuth } from '@/context/AuthContext';
import { isCitizenMatching } from '@/lib/vaultDetection';

interface SchemeExplorerProps {
  onApplicationCreated?: (newApp: any) => void;
  onNavigateToTracker?: () => void;
}

export const SchemeExplorer: React.FC<SchemeExplorerProps> = ({ 
  onApplicationCreated,
  onNavigateToTracker
}) => {
  const { t } = useLanguage();
  const { applications } = useLiveSync();
  const { user, profile } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Schemes');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedSchemeForApply, setSelectedSchemeForApply] = useState<SchemeProps | null>(null);
  const [selectedSchemeForCalculator, setSelectedSchemeForCalculator] = useState<SchemeItem | null>(null);
  const [appliedSchemeIds, setAppliedSchemeIds] = useState<string[]>([]);

  // Resolve active logged-in citizen credentials for application isolation
  const activeCitName = (profile?.full_name || user?.full_name || '').toLowerCase().trim();
  const activeCitAadhaar = (profile?.aadhaar || user?.id || '').replace(/\D/g, '');

  // Map only applications submitted by THIS active citizen to schemes
  const appliedAppForScheme = useMemo(() => {
    const map = new Map<string, any>();
    if (!applications || applications.length === 0) return map;

    applications.forEach(app => {
      const matchesCit = isCitizenMatching(
        { citizenName: app.citizenName, citizenId: app.citizenId, appId: app.id },
        { name: activeCitName, aadhaar: activeCitAadhaar }
      );

      if (matchesCit) {
        const appSvc = (app.service || (app as any).title || (app as any).service_name || '').toLowerCase().trim();
        const appSchId = ((app as any).scheme_id || '').toLowerCase().trim();

        SCHEMES_DATABASE.forEach(sch => {
          const schName = sch.name.toLowerCase().trim();
          const schOff = sch.official_name.toLowerCase().trim();
          const schId = sch.id.toLowerCase().trim();

          if (
            (appSchId && appSchId === schId) ||
            (appSvc && (appSvc === schName || appSvc === schOff || appSvc.includes(schName) || schName.includes(appSvc)))
          ) {
            map.set(sch.id, app);
          }
        });
      }
    });

    return map;
  }, [applications, activeCitName, activeCitAadhaar]);

  // Collect all unique tags for quick filter chips
  const popularTags = useMemo(() => [
    'DBT Cash',
    'Farmers',
    'Scholarship',
    'Cashless Hospital',
    'Rooftop Solar',
    'Women SHG',
    'Zero Balance Bank',
    'Artisans',
    'Micro Loan',
    'Digital Documents'
  ], []);

  const filteredSchemes = useMemo(() => {
    return SCHEMES_DATABASE.filter(sch => {
      // Category filter
      if (selectedCategory !== 'All Schemes' && sch.category !== selectedCategory) {
        return false;
      }
      // Tag filter
      if (selectedTag && !sch.tags.includes(selectedTag)) {
        return false;
      }
      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        sch.name.toLowerCase().includes(q) ||
        sch.official_name.toLowerCase().includes(q) ||
        sch.description.toLowerCase().includes(q) ||
        sch.department.toLowerCase().includes(q) ||
        sch.category.toLowerCase().includes(q) ||
        sch.tags.some(tag => tag.toLowerCase().includes(q)) ||
        sch.eligibility.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, selectedTag, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All Schemes': SCHEMES_DATABASE.length };
    SCHEMES_DATABASE.forEach(sch => {
      counts[sch.category] = (counts[sch.category] || 0) + 1;
    });
    return counts;
  }, []);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All Schemes');
    setSelectedTag(null);
  };

  const handleApplySuccess = (newApp: any) => {
    if (selectedSchemeForApply) {
      setAppliedSchemeIds(prev => [...prev, selectedSchemeForApply.id]);
    }
    if (onApplicationCreated) {
      onApplicationCreated(newApp);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Overview Stats & Official Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-blue-800/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" /> 100% Active & Verified
              </span>
              <span className="text-blue-300 text-xs font-mono">National e-Governance Plan (NeGP)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {t('National Welfare & Direct Benefit Directory', 'National Welfare & Direct Benefit Directory')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explore 32+ authoritative Central & State government schemes. All programs are integrated with the <strong>National Data Exchange (NDEF)</strong> and <strong>NPCI Aadhaar Payment Bridge</strong> for zero-paperwork, instant direct benefit transfer.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3 text-center">
              <p className="text-lg sm:text-xl font-black text-amber-400">32+</p>
              <p className="text-[10px] text-slate-300 uppercase font-semibold">Active Portals</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3 text-center">
              <p className="text-lg sm:text-xl font-black text-emerald-400">₹0</p>
              <p className="text-[10px] text-slate-300 uppercase font-semibold">Middleman Fees</p>
            </div>
          </div>
        </div>
      </div>

      {/* Explorer Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Filter & Search Schemes ({filteredSchemes.length} Found)
            </h3>
            <p className="text-[11px] text-slate-500">
              Instant keyword search across ministries, eligibility criteria, and benefit types.
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search schemes, loans, pensions, subsidies...', 'Search schemes, loans, pensions, subsidies...')}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills with Dynamic Counters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {SCHEME_CATEGORIES.map((cat) => {
          const count = categoryCounts[cat] || 0;
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedTag(null);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                }`}
            >
              <span>{t(cat, cat)}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick Tag Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
        <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider shrink-0 flex items-center gap-1 mr-1">
          <Tag className="w-3 h-3 text-amber-500" /> Trending:
        </span>
        {popularTags.map((tag) => {
          const isTagActive = selectedTag === tag;
          return (
            <button
              key={tag}
              onClick={() => setSelectedTag(isTagActive ? null : tag)}
              className={`px-2.5 py-1 rounded-lg font-medium transition whitespace-nowrap border cursor-pointer ${isTagActive
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                }`}
            >
              #{tag}
            </button>
          );
        })}
        {(selectedCategory !== 'All Schemes' || selectedTag || searchQuery) && (
          <button
            onClick={handleResetFilters}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
          >
            <RotateCcw className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>

      {/* Scheme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSchemes.map((scheme) => {
          const matchedApp = appliedAppForScheme.get(scheme.id);
          const isApplied = !!matchedApp || appliedSchemeIds.includes(scheme.id);

          return (
            <div
              key={scheme.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between space-y-4 group relative"
            >
              <div className="space-y-3">
                {/* Badges Bar */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      {t(scheme.category, scheme.category)}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {scheme.level}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-mono">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span>{scheme.matchPercentage}% {t('Match', 'Match')}</span>
                  </span>
                </div>

                {/* Title & Ministry */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                    {t(scheme.name, scheme.name)}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{t(scheme.department, scheme.department)}</span>
                  </p>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {t(scheme.description, scheme.description)}
                </p>

                {/* Financial Benefit Disbursal Box */}
                {scheme.benefits && Object.keys(scheme.benefits).length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-950/90 rounded-xl p-3 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500" />
                      {t('Target Benefit Disbursal', 'Target Benefit Disbursal')}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {Object.entries(scheme.benefits).map(([k, v]) => (
                        <span key={k} className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md text-[11px] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white font-bold shadow-2xs">
                          <Award className="w-3 h-3 text-emerald-500" />
                          <span>{t(String(v), String(v))}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Eligibility Snippet */}
                {scheme.eligibility && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-blue-50/50 dark:bg-blue-950/20 p-2 rounded-lg border border-blue-100 dark:border-blue-900/40">
                    <strong className="text-blue-700 dark:text-blue-300">Eligibility:</strong> {scheme.eligibility}
                  </div>
                )}

                {/* Tag Chips */}
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  {scheme.tags.map((tag, idx) => (
                    <span key={idx} className="text-[9px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs flex-wrap">
                <a
                  href={scheme.official_source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 font-semibold transition hover:underline cursor-pointer group/link"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate max-w-[130px]">{scheme.direct_portal_name || t('Official Portal', 'Official Portal')}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform shrink-0" />
                </a>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {(scheme.tags.some(t => ['Rooftop Solar', 'Home Loan', 'Credit', 'Loans', 'Micro Loan', 'Interest Subsidy', 'Toolkit Grant', 'Business Loan'].includes(t)) || scheme.id.includes('SURYA') || scheme.id.includes('PMAY') || scheme.id.includes('KCC') || scheme.id.includes('MUDRA') || scheme.id.includes('VISHWAKARMA')) && (
                    <button
                      type="button"
                      onClick={() => setSelectedSchemeForCalculator(scheme)}
                      className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer shadow-2xs"
                      title="Calculate Subsidy & EMI Savings"
                    >
                      <Calculator className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>{t('Calculate', 'Calculate')}</span>
                    </button>
                  )}

                  {isApplied ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (onNavigateToTracker) {
                          onNavigateToTracker();
                        } else if (typeof window !== 'undefined') {
                          const newUrl = new URL(window.location.href);
                          newUrl.searchParams.set('tab', 'applications');
                          window.history.pushState({}, '', newUrl.toString());
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition cursor-pointer shadow-sm group/applied"
                      title="Track your live application status in Benefit Tracker"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{t('Track Benefit', 'Track Benefit')}</span>
                      <ArrowRight className="w-3 h-3 text-emerald-600 group-hover/applied:translate-x-0.5 transition-transform" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedSchemeForApply(scheme as any)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{t('Apply for Benefit', 'Apply for Benefit')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredSchemes.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-500 space-y-3 shadow-sm">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Landmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No welfare schemes found matching "{searchQuery}"
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, clearing tag filters, or select "All Schemes" to view the complete catalog.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}

      {/* Application Modal */}
      <ApplicationModal
        scheme={selectedSchemeForApply}
        isOpen={!!selectedSchemeForApply}
        onClose={() => setSelectedSchemeForApply(null)}
        onSubmitSuccess={handleApplySuccess}
        onNavigateToTracker={onNavigateToTracker}
      />

      {/* Benefit & ROI Calculator Modal */}
      <SchemeBenefitCalculatorModal
        scheme={selectedSchemeForCalculator}
        isOpen={!!selectedSchemeForCalculator}
        onClose={() => setSelectedSchemeForCalculator(null)}
        onApplyDirectly={(sch) => {
          setSelectedSchemeForCalculator(null);
          setSelectedSchemeForApply(sch as any);
        }}
      />
    </div>
  );
};

export default SchemeExplorer;
