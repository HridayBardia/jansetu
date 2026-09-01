'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  ShieldCheck, 
  CheckCircle2, 
  CreditCard, 
  FileCheck2, 
  MapPin
} from 'lucide-react';

export const CitizenHero: React.FC = () => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();

  const citizenName = profile?.full_name || user?.full_name || 'Citizen Resident';
  const aadhaarNumber = profile?.aadhaar || (user?.id && /^\d+$/.test(user.id) ? `XXXX XXXX ${user.id.slice(-4)}` : '1111 2222 1405');
  const maskedAadhaar = `XXXX XXXX ${aadhaarNumber.replace(/\D/g, '').slice(-4) || '1405'}`;
  const phone = profile?.phone || user?.mobile_number || '+91 98765 43210';
  const maskedPhone = phone.replace(/(\+91\s?)(\d{2})\d{5}(\d{3})/, '$1$2XXXXX$3');
  const dob = profile?.date_of_birth || '15/08/2001';
  const gender = profile?.gender || 'Male';
  const state = profile?.location_state || 'Gujarat';
  const city = profile?.location_city || 'Vadodara';
  const initials = citizenName.split(' ').map((n: string) => n[0]).slice(0, 2).join('');

  return (
    <div className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Avatar & Identity Details */}
        <div className="flex items-start md:items-center gap-5">
          {/* Avatar with GIGW Structured Badge */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded bg-[#0B2545] text-amber-400 font-serif font-bold text-xl flex items-center justify-center border border-amber-500/50 shadow-xs">
              {initials}
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs border-2 border-white dark:border-slate-900">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          {/* Name & Headline */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {citizenName}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('hero.uidaiVerified', 'UIDAI e-KYC Level 2 Verified')}</span>
              </span>
            </div>

            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{city}, {state}</span>
              </span>
              <span>•</span>
              <span className="text-[#133E87] dark:text-blue-400 font-bold">{t('hero.nationalBeneficiary', 'National Citizen Beneficiary')}</span>
            </p>

            {/* Action Chips */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <ShieldCheck className="w-3 h-3 text-blue-700" />
                <span>{t('hero.uidaiL2', 'UIDAI Level-2')}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                <FileCheck2 className="w-3 h-3 text-slate-600" />
                <span>{t('hero.digilockerSynced', 'DigiLocker Synced')}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CreditCard className="w-3 h-3 text-emerald-600" />
                <span>{t('hero.dbtLinked', 'DBT Direct Bank Linked')}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Demographic Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded text-xs shrink-0">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">{t('hero.aadhaarToken', 'Aadhaar Token')}</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{maskedAadhaar}</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">{t('hero.linkedMobile', 'Linked Mobile')}</span>
            <span className="font-mono font-medium text-slate-900 dark:text-slate-200">{maskedPhone}</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">{t('hero.dob', 'Date of Birth')}</span>
            <span className="font-mono font-medium text-slate-900 dark:text-slate-200">{dob}</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">{t('hero.gender', 'Gender')}</span>
            <span className="font-medium text-slate-900 dark:text-white">{t(gender, gender)}</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">{t('hero.incomeClass', 'Income Class')}</span>
            <span className="font-bold text-[#C2410C] dark:text-amber-400">{t(profile?.income_category || 'Middle Class', profile?.income_category || 'Middle Class')} (₹1.8L)</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">{t('hero.consentToken', 'Consent Token')}</span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">DPDP-2023-OK</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CitizenHero;
