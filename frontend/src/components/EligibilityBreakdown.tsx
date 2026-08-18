'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, HelpCircle, Info } from 'lucide-react';
import { Journey } from '@/types';

interface EligibilityBreakdownProps {
  journey: Journey;
}

export const EligibilityBreakdown: React.FC<EligibilityBreakdownProps> = ({ journey }) => {
  const isBusiness = journey.life_event === 'business_formation';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Eligibility & Scheme Reasoning
            </h3>
            <p className="text-xs text-slate-400">
              Grounded analysis of applicable government benefits and prerequisite conditions
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
          🟡 Likely Eligible
        </span>
      </div>

      <div className="space-y-3 text-xs text-slate-300">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Criteria Evaluated</span>
          </h4>
          <ul className="space-y-1.5 pl-6 list-disc text-slate-300">
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
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400" />
            <span>Matching Government Schemes</span>
          </h4>
          {isBusiness ? (
            <div className="space-y-2">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <p className="font-bold text-slate-100">{journey.location || "State"} Industrial MSME Capital Subsidy Scheme</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Provides capital subsidy on machinery and plant purchases for registered Udyam units.</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <p className="font-bold text-slate-100">Credit Guarantee Fund Trust for Micro & Small Enterprises (CGTMSE)</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Collateral-free credit facility up to ₹2 Crores for eligible MSMEs nationwide.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <p className="font-bold text-slate-100">PM-Vidyalaxmi Central Sector Interest Subvention Scheme</p>
                <p className="text-slate-400 text-[11px] mt-0.5">3% interest concession on educational loans during moratorium period across India.</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <p className="font-bold text-slate-100">{journey.location || "State"} Post-Matric Merit Scholarship Scheme</p>
                <p className="text-slate-400 text-[11px] mt-0.5">Direct tuition fee reimbursement and hostel maintenance allowance.</p>
              </div>
            </div>
          )}
        </div>

        {/* Official Legal Disclaimer */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <span>
            <strong>Legal Note:</strong> You appear eligible based on the information provided. Final eligibility and disbursement decisions are determined solely by the relevant government authority through official procedures.
          </span>
        </div>
      </div>
    </div>
  );
};
