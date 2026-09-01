'use client';

import React, { useState } from 'react';
import { 
  Calculator, 
  X, 
  Sun, 
  Home, 
  Briefcase, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  Award,
  Zap,
  Info
} from 'lucide-react';
import { openDataService } from '@/services/openDataService';
import { SchemeItem } from '@/data/schemesData';

interface Props {
  scheme: SchemeItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyDirectly?: (scheme: SchemeItem) => void;
}

export const SchemeBenefitCalculatorModal: React.FC<Props> = ({ scheme, isOpen, onClose, onApplyDirectly }) => {
  if (!isOpen || !scheme) return null;

  // Detect which calculator mode fits this scheme
  const isSolar = scheme.id.includes('SURYA') || scheme.tags.includes('Rooftop Solar');
  const isHomeLoan = scheme.id.includes('PMAY') || scheme.tags.includes('Home Loan');
  const isLoanOrKCC = scheme.id.includes('KCC') || scheme.id.includes('MUDRA') || scheme.id.includes('VISHWAKARMA') || scheme.tags.includes('Credit');

  // Calculator State: Solar
  const [solarUnits, setSolarUnits] = useState(250);
  const [solarRoofArea, setSolarRoofArea] = useState(250);

  // Calculator State: Home Loan
  const [homeLoanAmount, setHomeLoanAmount] = useState(1500000);
  const [homeLoanTenure, setHomeLoanTenure] = useState(20);

  // Calculator State: Business / Agri Loan
  const [loanAmount, setLoanAmount] = useState(200000);

  // Run Calculations
  const solarRes = openDataService.calculateSolarBenefits(solarUnits, solarRoofArea);
  const pmayRes = openDataService.calculatePMAYBenefits(homeLoanAmount, homeLoanTenure);
  const loanSchemeType = scheme.id.includes('KCC') ? 'KCC' : scheme.id.includes('VISHWAKARMA') ? 'VISHWAKARMA' : 'MUDRA';
  const loanRes = openDataService.calculateSubsidizedLoanBenefits(loanAmount, loanSchemeType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pr-8">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block font-mono">
              Direct Benefit & ROI Calculator
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {scheme.name}
            </h3>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* CASE 1: SOLAR CALCULATOR                             */}
        {/* ---------------------------------------------------- */}
        {isSolar && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Simulate your monthly power savings & direct government rooftop subsidy.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Monthly Power Consumption: <strong className="text-indigo-600 dark:text-indigo-400">{solarUnits} Units</strong>
                </label>
                <input
                  type="range"
                  min="50"
                  max="600"
                  step="25"
                  value={solarUnits}
                  onChange={(e) => setSolarUnits(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Available Shadow-Free Roof: <strong className="text-indigo-600 dark:text-indigo-400">{solarRoofArea} Sq Ft</strong>
                </label>
                <input
                  type="range"
                  min="100"
                  max="800"
                  step="50"
                  value={solarRoofArea}
                  onChange={(e) => setSolarRoofArea(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Results Grid */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Recommended System</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{solarRes.systemSizeKw} kW Rooftop</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Central Government Subsidy</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{solarRes.centralSubsidy.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Estimated Monthly Savings</span>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">₹{solarRes.monthlyBillSavings.toLocaleString()} / mo</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Net Payback Duration</span>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400">{solarRes.paybackYears} Years</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* CASE 2: HOME LOAN PMAY CALCULATOR                    */}
        {/* ---------------------------------------------------- */}
        {isHomeLoan && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/80 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Home className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Calculate home loan interest subvention under PMAY Urban / Gramin schemes.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Loan Amount: <strong className="text-indigo-600 dark:text-indigo-400">₹{(homeLoanAmount / 100000).toFixed(1)} Lakh</strong>
                </label>
                <input
                  type="range"
                  min="300000"
                  max="5000000"
                  step="100000"
                  value={homeLoanAmount}
                  onChange={(e) => setHomeLoanAmount(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Loan Tenure: <strong className="text-indigo-600 dark:text-indigo-400">{homeLoanTenure} Years</strong>
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={homeLoanTenure}
                  onChange={(e) => setHomeLoanTenure(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Results Grid */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Commercial EMI (8.5%)</span>
                  <span className="text-sm font-black text-slate-500 line-through">₹{pmayRes.normalEmi.toLocaleString()}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Subsidized EMI (5.5%)</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{pmayRes.subsidizedEmi.toLocaleString()} / mo</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                  Total Direct Interest Benefit Under PMAY
                </span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                  ₹{pmayRes.totalSavings.toLocaleString()} Total Savings
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* CASE 3: GENERAL CONCESSIONAL LOAN (KCC / MUDRA / VISHWAKARMA) */}
        {/* ---------------------------------------------------- */}
        {!isSolar && !isHomeLoan && (
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/80 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Calculate your interest savings with concessional government institutional credit.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Loan Requirement: <strong className="text-indigo-600 dark:text-indigo-400">₹{loanAmount.toLocaleString()}</strong>
              </label>
              <input
                type="range"
                min="10000"
                max="1000000"
                step="10000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Results */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Government Subsidized Rate</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{loanRes.govtRate}% per annum</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Private Bank Rate</span>
                  <span className="text-sm font-black text-slate-400 line-through">{loanRes.commercialBankRate}% per annum</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                  Annual Interest Money Saved in Hand
                </span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                  ₹{loanRes.annualInterestSavings.toLocaleString()} / year
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            Close Calculator
          </button>

          {onApplyDirectly && (
            <button
              onClick={() => {
                onClose();
                onApplyDirectly(scheme);
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>Apply for this Entitlement</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default SchemeBenefitCalculatorModal;
