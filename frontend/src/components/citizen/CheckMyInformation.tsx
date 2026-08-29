'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useMockData } from '@/context/MockDataContext';
import { useAuth } from '@/context/AuthContext';
import { 
  ShieldCheck, 
  CheckCircle2, 
  UserCircle, 
  MapPin, 
  AlertTriangle, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Layers, 
  FileCheck, 
  Lock, 
  Building2, 
  RefreshCw, 
  Send, 
  History, 
  Sliders,
  ExternalLink,
  Zap,
  Info
} from 'lucide-react';

interface FieldProvenance {
  fieldKey: string;
  fieldLabel: string;
  fieldValue: string;
  sourceAuthority: string;
  syncTimestamp: string;
  securityHash: string;
  assuranceLevel: string;
  auditTrail: { stage: string; timestamp: string; node: string }[];
}

export const CheckMyInformation: React.FC = () => {
  const { t } = useLanguage();
  const { profile } = useMockData();
  const { user, profile: authProfile } = useAuth();

  // Interactive Discrepancy Playground State
  const [simulateDiscrepancy, setSimulateDiscrepancy] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [resolutionMethod, setResolutionMethod] = useState<'ATTESTATION' | 'PROPAGATION' | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Universal address propagation simulation state
  const [isPropagatingAddress, setIsPropagatingAddress] = useState(false);
  const [propagationStep, setPropagationStep] = useState<number>(0);
  const [isAddressPropagated, setIsAddressPropagated] = useState(false);

  // Field provenance inspector modal state
  const [selectedProvenance, setSelectedProvenance] = useState<FieldProvenance | null>(null);

  const baseName = authProfile?.full_name || user?.full_name || profile?.name || "Hriday Bardia";
  const aadhaarName = baseName;
  const panName = baseName;
  // If discrepancy is simulated and not yet resolved, show middle initial
  const dlName = (simulateDiscrepancy && !isResolved) 
    ? (baseName.includes(' ') ? `${baseName.split(' ')[0]} S. ${baseName.split(' ').slice(1).join(' ')}` : `${baseName} S.`)
    : baseName;

  const citizenAadhaar = authProfile?.aadhaar || (user?.id && /^\d+$/.test(user.id) ? `XXXX XXXX ${user.id.slice(-4)}` : "XXXX XXXX 1405");
  const citizenDob = authProfile?.date_of_birth || "15/08/2001";
  const citizenGender = authProfile?.gender || "Male";
  const citizenPhone = authProfile?.phone || user?.mobile_number || "+91 98765 43210";
  const citizenAddress = authProfile?.location_city ? `${authProfile.location_city}, ${authProfile.location_state || 'Gujarat'}` : "42, Sunrise Greens, Alkapuri, Vadodara, Gujarat - 390007";
  const citizenPan = "ABCDE1234F";

  const handleToggleDiscrepancy = (val: boolean) => {
    setSimulateDiscrepancy(val);
    setIsResolved(false);
    setResolutionMethod(null);
    if (val) {
      setToastMessage("Demo Mode: Simulated middle-initial demographic variance triggered.");
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setToastMessage(null);
    }
  };

  const handleResolveAttestation = () => {
    setIsResolving(true);
    setTimeout(() => {
      setIsResolving(false);
      setIsResolved(true);
      setResolutionMethod('ATTESTATION');
      setToastMessage("Cryptographic One-Time e-Attestation generated. Golden record unified at 100% parity.");
      setTimeout(() => setToastMessage(null), 5000);
    }, 700);
  };

  const handleResolvePropagation = () => {
    setIsResolving(true);
    setTimeout(() => {
      setIsResolving(false);
      setIsResolved(true);
      setResolutionMethod('PROPAGATION');
      setToastMessage("Authoritative Aadhaar Golden Record propagated to MoRTH Parivahan Sarathi node.");
      setTimeout(() => setToastMessage(null), 5000);
    }, 700);
  };

  const handleSimulateAddressPropagation = () => {
    setIsPropagatingAddress(true);
    setPropagationStep(1);
    
    setTimeout(() => setPropagationStep(2), 600);
    setTimeout(() => setPropagationStep(3), 1200);
    setTimeout(() => setPropagationStep(4), 1800);
    setTimeout(() => {
      setIsPropagatingAddress(false);
      setIsAddressPropagated(true);
      setToastMessage("Address successfully synchronized across all 4 departmental registries.");
      setTimeout(() => setToastMessage(null), 5000);
    }, 2400);
  };

  const PROVENANCE_DATA: Record<string, FieldProvenance> = {
    name: {
      fieldKey: 'name',
      fieldLabel: 'Full Legal Name',
      fieldValue: aadhaarName,
      sourceAuthority: 'UIDAI Aadhaar Central Identity Repository (CIDR)',
      syncTimestamp: '2026-08-29 07:15:22 IST',
      securityHash: 'SHA256:7f9b8c21a4e5d6f03b1289c099e84b',
      assuranceLevel: 'NIST IAL-3 / e-KYC Level 3 (Biometric + OTP Seeded)',
      auditTrail: [
        { stage: 'Authoritative Issuance', timestamp: '2012-04-10', node: 'UIDAI Regional Center Bengaluru' },
        { stage: 'PAN-Aadhaar Linkage', timestamp: '2021-06-18', node: 'Income Tax e-Filing Gateway' },
        { stage: 'JanSetu Cross-Registry Ingestion', timestamp: '2026-08-29 07:15:22', node: 'JanSetu Golden Record Vault' }
      ]
    },
    dob: {
      fieldKey: 'dob',
      fieldLabel: 'Date of Birth & Age Proof',
      fieldValue: `${citizenDob} (${citizenGender})`,
      sourceAuthority: 'UIDAI & Municipal Birth & Death Registry',
      syncTimestamp: '2026-08-29 07:15:22 IST',
      securityHash: 'SHA256:190a42f0b7c3d2e184910efb882103',
      assuranceLevel: 'Verified Demographic Entity (NIST IAL-3)',
      auditTrail: [
        { stage: 'Birth Certificate Issued', timestamp: '1985-08-20', node: 'Municipal Registrar Office' },
        { stage: 'Aadhaar Demographic Seeding', timestamp: '2012-04-10', node: 'UIDAI CIDR Service' },
        { stage: 'Synchronized to JanSetu NDEF', timestamp: '2026-08-29 07:15:22', node: 'JanSetu Schema Transformer' }
      ]
    },
    address: {
      fieldKey: 'address',
      fieldLabel: 'Permanent & Residential Address',
      fieldValue: citizenAddress,
      sourceAuthority: 'BBMP Urban Local Body & UIDAI Repository',
      syncTimestamp: '2026-08-29 07:18:04 IST',
      securityHash: 'SHA256:91ac34b802eef566c781190209ab44',
      assuranceLevel: 'Spatial & Municipal Tax Assessed Record',
      auditTrail: [
        { stage: 'Property Tax SAS Assessment', timestamp: '2024-03-15', node: 'BBMP Revenue Directorate' },
        { stage: 'Municipal Cadastral Mapping', timestamp: '2025-01-20', node: 'Karnataka GIS Spatial Node' },
        { stage: 'Zero-Duplicate JanSetu Sync', timestamp: '2026-08-29 07:18:04', node: 'JanSetu MDM Engine' }
      ]
    },
    tax: {
      fieldKey: 'tax',
      fieldLabel: 'Income & Tax Compliance Identity',
      fieldValue: `PAN: ${citizenPan} (ITR Compliant)`,
      sourceAuthority: 'Central Board of Direct Taxes (CBDT)',
      syncTimestamp: '2026-08-29 07:16:45 IST',
      securityHash: 'SHA256:4e2188ab6c90d512ef90123477c109',
      assuranceLevel: 'Financial KYC Tier-1 Compliant',
      auditTrail: [
        { stage: 'PAN Card Issued', timestamp: '2008-11-05', node: 'NSDL / UTIITSL Tax Node' },
        { stage: 'Aadhaar Biometric Linkage', timestamp: '2021-06-18', node: 'CBDT Central Processing Centre' },
        { stage: 'JanSetu Interoperability Sync', timestamp: '2026-08-29 07:16:45', node: 'JanSetu API Gateway' }
      ]
    }
  };

  const isMismatched = simulateDiscrepancy && !isResolved;

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto mt-4">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-sm animate-scaleUp">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 dark:hover:text-white text-[10px] uppercase font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Header Card with Demo Sandbox Switch */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-7 h-7 text-[#133E87] dark:text-blue-400 shrink-0" />
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {t('check_info.checkMyInformation', 'Check My Information')}
                </h1>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                {t('Master Data Management (MDM) & Golden Record Studio. JanSetu continuously harmonizes your demographic attributes across all authoritative ministries to eliminate application clerical rejections.', 'Master Data Management (MDM) & Golden Record Studio. JanSetu continuously harmonizes your demographic attributes across all authoritative ministries to eliminate application clerical rejections.')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
              {/* Pitch Demo Discrepancy Toggle */}
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-lg flex items-center gap-3 shadow-2xs">
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    {t('DEMO MODE: SIMULATE DISCREPANCY', 'Demo Mode: Simulate Discrepancy')}
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    {simulateDiscrepancy ? t('Testing middle initial variance', 'Testing middle initial variance') : t('Clean golden record state', 'Clean golden record state')}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulateDiscrepancy}
                    onChange={(e) => handleToggleDiscrepancy(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Data Consistency Status Badge */}
              <div className="text-right shrink-0">
                {isMismatched ? (
                  <div className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center justify-end gap-1.5 bg-amber-50 dark:bg-amber-950/60 px-3 py-2 rounded-full border border-amber-300 dark:border-amber-700 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>94.2% {t('Match', 'Match')} &bull; {t('FUZZY VARIANCE', 'FUZZY VARIANCE')}</span>
                  </div>
                ) : (
                  <div className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center justify-end gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-2 rounded-full border border-emerald-300 dark:border-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t('check_info.perfectMatch', '100% Match')} &bull; {t('check_info.dataConsistency', 'Data Consistency')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Simulated Discrepancy Resolution Banner */}
          {isMismatched && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 rounded-lg p-5 space-y-4 shadow-sm animate-scaleUp">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-amber-900 dark:text-amber-200">
                    {t('Demographic Variance Detected: Middle Name Initial Abbreviation', 'Demographic Variance Detected: Middle Name Initial Abbreviation')}
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    {t('Aadhaar reads', 'Aadhaar reads')} <strong className="font-bold text-slate-900 dark:text-white font-mono">&quot;{aadhaarName}&quot;</strong> {t('while MoRTH Driving Licence reads', 'while MoRTH Driving Licence reads')} <strong className="font-bold text-slate-900 dark:text-white font-mono">&quot;{dlName}&quot;</strong>. 
                    {t('Standard portal checks would reject your application automatically. JanSetu MDM calculates a', 'Standard portal checks would reject your application automatically. JanSetu MDM calculates a')} <strong className="font-bold">94.2% {t('Jaro-Winkler phonetic equivalence score', 'Jaro-Winkler phonetic equivalence score')}</strong>.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-amber-200 dark:border-amber-900">
                <button
                  onClick={handleResolveAttestation}
                  disabled={isResolving}
                  className="flex-1 bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-4 rounded-md shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isResolving ? t('Computing Proof...', 'Computing Proof...') : t('Generate Instant One-Time e-Attestation', 'Generate Instant One-Time e-Attestation')}</span>
                </button>

                <button
                  onClick={handleResolvePropagation}
                  disabled={isResolving}
                  className="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs py-2.5 px-4 rounded-md border border-slate-300 dark:border-slate-600 shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#133E87] dark:text-blue-400" />
                  <span>{t('Propagate Aadhaar Golden Record', 'Propagate Aadhaar Golden Record')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Resolved State Confirmation Banner */}
          {simulateDiscrepancy && isResolved && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg p-4 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>{t('Golden Record Unified:', 'Golden Record Unified:')}</strong> {t('Discrepancy successfully resolved via', 'Discrepancy successfully resolved via')} {resolutionMethod === 'ATTESTATION' ? t('Cryptographic e-Attestation token', 'Cryptographic e-Attestation token') : t('Universal Aadhaar propagation', 'Universal Aadhaar propagation')}.
                </span>
              </div>
              <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800 font-bold">
                {t('AUDIT SEAL VALID', 'AUDIT SEAL VALID')}
              </span>
            </div>
          )}

          {/* 2. Registry Parity Comparison Cards */}
          <div className="grid gap-6">
            
            {/* Card 1: Verified Name Parity */}
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-[#133E87] dark:text-blue-400" /> 
                  <span>{t('Cross-Registry Name Parity', 'Cross-Registry Name Parity')}</span>
                </h3>
                <button
                  onClick={() => setSelectedProvenance(PROVENANCE_DATA.name)}
                  className="text-[11px] font-bold text-[#133E87] dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{t('Inspect Lineage', 'Inspect Lineage')}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Aadhaar */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs relative">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{t('Aadhaar (UIDAI)', 'Aadhaar (UIDAI)')}</p>
                    <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">{t('Authoritative', 'Authoritative')}</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white font-mono">{aadhaarName}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">{citizenAadhaar}</p>
                </div>

                {/* PAN */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{t('PAN (Income Tax)', 'PAN (Income Tax)')}</p>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white font-mono">{panName}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">{t('DOB:', 'DOB:')} {citizenDob} &bull; {t(citizenGender, citizenGender)}</p>
                </div>

                {/* Driving Licence */}
                <div className={`p-4 rounded-md border shadow-2xs transition-colors ${
                  isMismatched
                    ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{t('Driving License (MoRTH)', 'Driving License (MoRTH)')}</p>
                    {isMismatched ? (
                      <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> 94% {t('Match', 'Match')}
                      </span>
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                  <p className={`text-base font-bold font-mono ${isMismatched ? 'text-amber-900 dark:text-amber-200' : 'text-slate-900 dark:text-white'}`}>
                    {dlName}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">KA-01-2015-0098421</p>
                </div>
              </div>
            </div>

            {/* Card 2: Registered Address Parity */}
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#133E87] dark:text-blue-400" /> 
                  <span>{t('Registered Address Consistency', 'Registered Address Consistency')}</span>
                </h3>
                <button
                  onClick={() => setSelectedProvenance(PROVENANCE_DATA.address)}
                  className="text-[11px] font-bold text-[#133E87] dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{t('Inspect Lineage', 'Inspect Lineage')}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{t('Aadhaar (UIDAI)', 'Aadhaar (UIDAI)')}</p>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">{citizenAddress}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">{t('Property Tax (BBMP Municipal)', 'Property Tax (BBMP Municipal)')}</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">{citizenAddress}</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-3" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 3. Two-Way Universal Data Propagation Studio */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>{t('Two-Way Universal Data Propagation Studio', 'Two-Way Universal Data Propagation Studio')}</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {t('Updating your residential address or identity in any connected registry allows you to sync updates across all ministries in a single cryptographic transaction.', 'Updating your residential address or identity in any connected registry allows you to sync updates across all ministries in a single cryptographic transaction.')}
            </p>
          </div>

          <button
            onClick={handleSimulateAddressPropagation}
            disabled={isPropagatingAddress}
            className="bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-md shadow-sm transition flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-75"
          >
            <Send className={`w-3.5 h-3.5 ${isPropagatingAddress ? 'animate-bounce text-amber-300' : 'text-amber-400'}`} />
            <span>{isPropagatingAddress ? t('Propagating Records...', 'Propagating Records...') : t('Simulate Universal Propagation', 'Simulate Universal Propagation')}</span>
          </button>
        </div>

        {/* Live Propagation Progress Trackers */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          
          <div className={`p-3 rounded-lg border text-xs transition-all ${
            propagationStep >= 1 
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700' 
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-slate-900 dark:text-white text-[11px]">{t('1. UIDAI Aadhaar', '1. UIDAI Aadhaar')}</span>
              {propagationStep >= 1 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-2 h-2 rounded-full bg-slate-300" />}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {propagationStep >= 1 ? t('Address Updated ✓', 'Address Updated ✓') : t('Ready to Sync', 'Ready to Sync')}
            </span>
          </div>

          <div className={`p-3 rounded-lg border text-xs transition-all ${
            propagationStep >= 2 
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700' 
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-slate-900 dark:text-white text-[11px]">{t('2. BBMP Municipal', '2. BBMP Municipal')}</span>
              {propagationStep >= 2 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-2 h-2 rounded-full bg-slate-300" />}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {propagationStep >= 2 ? t('SAS Record Synced ✓', 'SAS Record Synced ✓') : t('Pending Queue', 'Pending Queue')}
            </span>
          </div>

          <div className={`p-3 rounded-lg border text-xs transition-all ${
            propagationStep >= 3 
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700' 
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-slate-900 dark:text-white text-[11px]">{t('3. MoRTH Parivahan', '3. MoRTH Parivahan')}</span>
              {propagationStep >= 3 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-2 h-2 rounded-full bg-slate-300" />}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {propagationStep >= 3 ? t('DL Address Matched ✓', 'DL Address Matched ✓') : t('Pending Queue', 'Pending Queue')}
            </span>
          </div>

          <div className={`p-3 rounded-lg border text-xs transition-all ${
            propagationStep >= 4 
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700' 
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-slate-900 dark:text-white text-[11px]">{t('4. CBDT Income Tax', '4. CBDT Income Tax')}</span>
              {propagationStep >= 4 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-2 h-2 rounded-full bg-slate-300" />}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {propagationStep >= 4 ? t('Jurisdiction Synced ✓', 'Jurisdiction Synced ✓') : t('Pending Queue', 'Pending Queue')}
            </span>
          </div>

        </div>
      </div>

      {/* 4. Field-Level Provenance Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-[#133E87] dark:text-blue-400" />
            <span>Field-Level Provenance & Cryptographic Lineage</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Click any verified credential field to inspect its authoritative source authority, historical audit log, and cryptographic integrity seal.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(PROVENANCE_DATA).map((prov) => (
            <div
              key={prov.fieldKey}
              onClick={() => setSelectedProvenance(prov)}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-[#133E87] dark:hover:border-blue-400 rounded-lg p-4 space-y-2 cursor-pointer transition transform hover:-translate-y-0.5 shadow-2xs group"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{prov.fieldLabel}</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#133E87] dark:group-hover:text-blue-400 transition" />
              </div>
              <p className="text-xs font-black text-slate-900 dark:text-white font-mono truncate">{prov.fieldValue}</p>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">{prov.sourceAuthority}</p>
              <span className="inline-block text-[9px] font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded font-bold">
                NIST IAL-3 Verified
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Field Provenance Inspector Slide-over / Modal */}
      {selectedProvenance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={() => setSelectedProvenance(null)} />
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl relative z-10 w-full max-w-lg overflow-hidden animate-scaleUp">
            
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#133E87] dark:text-blue-400" />
                  <span>Provenance Inspector &bull; {selectedProvenance.fieldLabel}</span>
                </h3>
                <p className="text-[10px] text-slate-500">Cryptographic audit trail and source authority verification.</p>
              </div>
              <button
                onClick={() => setSelectedProvenance(null)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded transition cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500">Current Verified Value</span>
                <p className="text-sm font-black text-slate-900 dark:text-white font-mono">{selectedProvenance.fieldValue}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Issuing Authority</span>
                  <p className="font-semibold text-slate-900 dark:text-slate-200 mt-0.5">{selectedProvenance.sourceAuthority}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Assurance Tier</span>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">{selectedProvenance.assuranceLevel}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">SHA-256 Cryptographic Seal</span>
                <p className="font-mono text-[10px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 break-all mt-1">
                  {selectedProvenance.securityHash}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Immutable Lineage History</span>
                <div className="space-y-2">
                  {selectedProvenance.auditTrail.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-[11px] p-2 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700">
                      <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#133E87] dark:text-blue-300 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1 space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-slate-200">{item.stage}</p>
                        <p className="text-[10px] text-slate-500">{item.node} &bull; {item.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
              <button
                onClick={() => setSelectedProvenance(null)}
                className="bg-[#0B2545] hover:bg-[#133E87] text-white font-bold text-xs px-4 py-1.5 rounded transition cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
