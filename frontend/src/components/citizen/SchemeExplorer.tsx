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
  RotateCcw
} from 'lucide-react';
import { SchemeProps } from '@/components/SchemeCard';
import { ApplicationModal } from './ApplicationModal';

interface SchemeWithMatch extends SchemeProps {
  matchPercentage: number;
}

const SCHEMES_DATABASE: SchemeWithMatch[] = [
  {
    id: 'SCH-PM-KISAN-01',
    name: 'PM-KISAN Samman Nidhi Yojana',
    official_name: 'Pradhan Mantri Kisan Samman Nidhi',
    description: 'Direct income support of ₹6,000 per year in three equal installments to all landholding farmer families across India.',
    level: 'CENTRAL',
    state_name: 'All India',
    department: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Agriculture',
    benefits: { annual_support: '₹6,000 / year', payment_mode: 'Direct DBT to Aadhaar Linked Bank' },
    official_source_url: 'https://pmkisan.gov.in',
    status: 'ACTIVE',
    matchPercentage: 98
  },
  {
    id: 'SCH-NATS-EDU-02',
    name: 'National Apprenticeship Training Scheme (NATS)',
    official_name: 'National Apprenticeship Training Scheme 2.0',
    description: 'One-year skill training & stipend support (₹8,000 - ₹9,000/month) for graduates and diploma holders in technical disciplines.',
    level: 'CENTRAL',
    state_name: 'All India',
    department: 'Ministry of Education & Skill Development',
    category: 'Education & Skills',
    benefits: { monthly_stipend: '₹9,000 / month', duration: '12 Months Paid Training' },
    official_source_url: 'https://nats.education.gov.in',
    status: 'ACTIVE',
    matchPercentage: 95
  },
  {
    id: 'SCH-PMAY-G-03',
    name: 'Pradhan Mantri Awas Yojana - Gramin',
    official_name: 'PMAY-G Housing for All (Rural)',
    description: 'Financial construction grant of ₹1.20 Lakh to ₹1.30 Lakh for rural families without a pucca house.',
    level: 'CENTRAL',
    state_name: 'All India',
    department: 'Ministry of Rural Development',
    category: 'Housing & Urban',
    benefits: { construction_grant: '₹1,20,000', sanitation_bonus: '₹12,000' },
    official_source_url: 'https://pmayg.nic.in',
    status: 'ACTIVE',
    matchPercentage: 92
  },
  {
    id: 'SCH-PMJAY-HEALTH-04',
    name: 'Ayushman Bharat PM-JAY Health Protection',
    official_name: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana',
    description: 'Cashless hospital coverage up to ₹5 Lakh per family per year across secondary and tertiary empaneled hospitals.',
    level: 'CENTRAL',
    state_name: 'All India',
    department: 'National Health Authority (NHA)',
    category: 'Healthcare',
    benefits: { health_cover: '₹5,00,000 / Year', coverage_scope: 'Entire Family' },
    official_source_url: 'https://pmjay.gov.in',
    status: 'ACTIVE',
    matchPercentage: 97
  },
  {
    id: 'SCH-PMMVY-WOMEN-05',
    name: 'Pradhan Mantri Matru Vandana Yojana',
    official_name: 'PMMVY Direct Maternity Support',
    description: 'Direct conditional cash benefit of ₹5,000 for pregnant women and lactating mothers for healthcare and nutrition.',
    level: 'CENTRAL',
    state_name: 'All India',
    department: 'Ministry of Women & Child Development',
    category: 'Women & Child',
    benefits: { maternity_grant: '₹5,00,0', payout_installments: '3 Tranches' },
    official_source_url: 'https://pmmvy.wcd.gov.in',
    status: 'ACTIVE',
    matchPercentage: 89
  },
  {
    id: 'SCH-NSAP-PENSION-06',
    name: 'National Social Assistance Programme (NSAP)',
    official_name: 'National Old Age & Disability Pension Scheme',
    description: 'Monthly welfare pension support for elderly citizens, widows, and persons with disability living below the poverty line.',
    level: 'CENTRAL',
    state_name: 'All India',
    department: 'Ministry of Rural Development',
    category: 'Social Welfare',
    benefits: { monthly_pension: '₹1,000 - ₹3,000 / month', payment_cycle: 'Monthly DBT' },
    official_source_url: 'https://nsap.nic.in',
    status: 'ACTIVE',
    matchPercentage: 94
  }
];

const CATEGORIES = [
  'All Schemes',
  'Agriculture',
  'Education & Skills',
  'Healthcare',
  'Housing & Urban',
  'Women & Child',
  'Social Welfare'
];

interface SchemeExplorerProps {
  onApplicationCreated?: (newApp: any) => void;
}

export const SchemeExplorer: React.FC<SchemeExplorerProps> = ({ onApplicationCreated }) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Schemes');
  const [selectedSchemeForApply, setSelectedSchemeForApply] = useState<SchemeProps | null>(null);
  const [appliedSchemeIds, setAppliedSchemeIds] = useState<string[]>([]);

  const filteredSchemes = useMemo(() => {
    return SCHEMES_DATABASE.filter(sch => {
      if (selectedCategory !== 'All Schemes' && sch.category !== selectedCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        sch.name.toLowerCase().includes(q) ||
        sch.official_name.toLowerCase().includes(q) ||
        sch.description.toLowerCase().includes(q) ||
        sch.department.toLowerCase().includes(q) ||
        sch.category.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All Schemes');
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
    <div className="space-y-6">
      {/* Explorer Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#133E87] dark:text-blue-400" />
            <span>{t('National Welfare Scheme Directory', 'National Welfare Scheme Directory')}</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t('Discover and apply for central & state welfare entitlements verified under the National e-Governance Plan.', 'Discover and apply for central & state welfare entitlements verified under the National e-Governance Plan.')}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search schemes, ministries, benefits...', 'Search schemes, ministries, benefits...')}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#133E87] focus:outline-none shadow-2xs"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 tab-scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition border ${
              selectedCategory === cat
                ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400'
            }`}
          >
            {t(cat, cat)}
          </button>
        ))}
      </div>

      {/* Scheme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSchemes.map((scheme) => {
          const isApplied = appliedSchemeIds.includes(scheme.id);
          return (
            <div 
              key={scheme.id}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#133E87] dark:hover:border-blue-500 transition-colors"
            >
              <div className="space-y-3">
                {/* Badges */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                    {t(scheme.category, scheme.category)}
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-mono">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>{scheme.matchPercentage}% {t('Eligibility Match', 'Eligibility Match')}</span>
                  </span>
                </div>

                {/* Title & Ministry */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {t(scheme.name, scheme.name)}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{t(scheme.department, scheme.department)}</span>
                  </p>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {t(scheme.description, scheme.description)}
                </p>

                {/* Financial Benefit Badge */}
                {scheme.benefits && (
                  <div className="bg-slate-50 dark:bg-slate-950 rounded p-2.5 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      {t('Target Benefit Disbursal', 'Target Benefit Disbursal')}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {Object.entries(scheme.benefits).map(([k, v]) => (
                        <span key={k} className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded text-xs border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold">
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                          <span>{t(String(v), String(v))}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs flex-wrap">
                <a
                  href={scheme.official_source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-800 dark:text-slate-400 dark:hover:text-blue-400 font-medium transition hover:underline"
                >
                  <span>{t('Official Portal', 'Official Portal')}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedSchemeForApply(scheme)}
                  disabled={isApplied}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs font-semibold transition cursor-pointer shadow-xs ${
                    isApplied
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-default'
                      : 'bg-[#133E87] hover:bg-[#0B2545] text-white'
                  }`}
                >
                  {isApplied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t('Application Lodged', 'Application Lodged')}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{t('Apply for Benefit', 'Apply for Benefit')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredSchemes.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md p-10 text-center text-slate-500 space-y-3">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center mx-auto text-slate-400">
            <Landmark className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No welfare schemes found matching "{searchQuery}"
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or reset category filters to view all central schemes.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#133E87] hover:bg-[#0B2545] text-white font-semibold text-xs shadow-xs transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      )}

      {/* Application Modal */}
      <ApplicationModal
        scheme={selectedSchemeForApply}
        isOpen={!!selectedSchemeForApply}
        onClose={() => setSelectedSchemeForApply(null)}
        onSubmitSuccess={handleApplySuccess}
      />
    </div>
  );
};
export default SchemeExplorer;
