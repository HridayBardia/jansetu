'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ShieldCheck, CheckCircle2, AlertCircle, HelpCircle, Info } from 'lucide-react';
import { Journey } from '@/types';

interface EligibilityBreakdownProps {
  journey: Journey;
}

export const EligibilityBreakdown: React.FC<EligibilityBreakdownProps> = ({ journey }) => {
  const { t } = useLanguage();
  const isBusiness = journey.life_event === 'business_formation';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Eligibility & Scheme Reasoning
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Grounded analysis of applicable government benefits and prerequisite conditions
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-1 rounded border border-emerald-200 dark:border-emerald-800">
          Likely Eligible
        </span>
      </div>

      <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
        <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-md border border-slate-200 dark:border-slate-700 space-y-2 shadow-2xs">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t("workflow.criteriaEvaluated")}</span>
          </h4>
          <ul className="space-y-1.5 pl-6 list-disc text-slate-700 dark:text-slate-300">
            <li><strong>State Jurisdiction:</strong> {journey.location || "India"} Resident Status</li>
            {isBusiness ? (
              <>
                <li><strong>Enterprise Category:</strong> Micro Enterprise (Udyam Threshold &lt; ₹1 Cr Investment)</li>
                <li><strong>Location Compliance:</strong> {journey.city || journey.location || "Local"} Municipal Commercial Zone</li>
              </>
            ) : (
              <>
                <li><strong>Academic Seat:</strong> Recognized Institution Enrolment / Entrance Rank</li>
                <li><strong>Income Threshold:</strong> Annual Household Income &lt; ₹8.0 Lakhs (Revenue Verified)</li>
              </>
            )}
          </ul>
        </div>

        {/* Qualified Schemes */}
        <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-md border border-slate-200 dark:border-slate-700 space-y-2 shadow-2xs">
          <h4 className="font-bold text-[#133E87] dark:text-blue-400 text-sm flex items-center gap-2">
            <Info className="w-4 h-4" />
            <span>{t("workflow.matchingSchemes")}</span>
          </h4>
          {isBusiness ? (
            <div className="space-y-2">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
                <p className="font-bold text-slate-900 dark:text-white">{journey.location || "State"} Industrial MSME Capital Subsidy Scheme</p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">Provides capital subsidy on machinery and plant purchases for registered Udyam units.</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
                <p className="font-bold text-slate-900 dark:text-white">Credit Guarantee Fund Trust for Micro & Small Enterprises (CGTMSE)</p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">Collateral-free credit facility up to ₹2 Crores for eligible MSMEs nationwide.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
                <p className="font-bold text-slate-900 dark:text-white">PM-Vidyalaxmi Central Sector Interest Subvention Scheme</p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">3% interest concession on educational loans during moratorium period across India.</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
                <p className="font-bold text-slate-900 dark:text-white">{journey.location || "State"} Post-Matric Merit Scholarship Scheme</p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">Direct tuition fee reimbursement and hostel maintenance allowance.</p>
              </div>
            </div>
          )}
        </div>

        {/* Official Legal Disclaimer */}
        <div className="p-3 bg-blue-50 dark:bg-slate-800/80 rounded-md border border-blue-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-400 flex items-start gap-2 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <span>
            <strong>{t("workflow.legalNote")}</strong> You appear eligible based on the information provided. Final eligibility and disbursement decisions are determined solely by the relevant government authority through official procedures.
          </span>
        </div>
      </div>
    </div>
  );
};
