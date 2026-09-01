'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Network, 
  CheckCircle2, 
  Activity, 
  RefreshCw, 
  Building2, 
  Database, 
  FileCode, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  Lock, 
  Eye, 
  Copy, 
  Check, 
  Zap, 
  Server, 
  Sparkles,
  ExternalLink,
  Code
} from 'lucide-react';
import { InteroperabilityDataFlow } from '@/components/InteroperabilityDataFlow';

interface RegistryConnector {
  id: string;
  name: string;
  department: string;
  protocol: string;
  latencyMs: number;
  extractedFields: string[];
  securityHash: string;
  status: 'ACTIVE' | 'SYNCING' | 'HEALTHY';
  rawPayload: string;
  transformRule: string;
  ndefOutput: string;
}

const REGISTRIES_DATA: RegistryConnector[] = [
  {
    id: 'uidai',
    name: 'UIDAI Aadhaar National Registry',
    department: 'Ministry of Electronics & IT',
    protocol: 'REST v2 (OAuth2 / MTLS)',
    latencyMs: 42,
    extractedFields: ['legal_name', 'dob', 'gender', 'pincode', 'photo_hash'],
    securityHash: 'SHA256:7f9b8c21a4e5d6f03b1289c0',
    status: 'ACTIVE',
    rawPayload: `{
  "auth_response": {
    "aadhaar_ref": "XXXX-XXXX-8921",
    "kyc_status": "SUCCESS",
    "demographic": {
      "name_eng": "Vikas Sharma",
      "dob_iso": "1985-08-14",
      "gender_code": "M",
      "address_canonical": "42, Residency Road, Bengaluru, Karnataka 560025",
      "auth_ts": "2026-08-29T07:15:22Z"
    },
    "sig_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}`,
    transformRule: `// NDEF Ingestion Adapter: UIDAI v2.4
function transformUIDAI(input) {
  return {
    "@context": "https://schema.gov.in/ndef/v2",
    "@type": "CitizenGoldenIdentity",
    "legalName": input.demographic.name_eng.trim(),
    "dateOfBirth": input.demographic.dob_iso,
    "gender": input.demographic.gender_code === "M" ? "MALE" : "FEMALE",
    "primaryAddress": input.demographic.address_canonical,
    "verificationLevel": "NIST_IAL_3",
    "trustScore": 1.00
  };
}`,
    ndefOutput: `{
  "@context": "https://schema.gov.in/ndef/v2",
  "@type": "CitizenGoldenIdentity",
  "id": "urn:gov:citizen:8921",
  "legalName": "Vikas Sharma",
  "dateOfBirth": "1985-08-14",
  "gender": "MALE",
  "primaryAddress": "42, Residency Road, Bengaluru, Karnataka 560025",
  "assuranceLevel": "NIST_IAL_3",
  "cryptographicProof": "SHA256:7f9b8c21a4e5d6f03b1289c0",
  "status": "AUTHORITATIVE_VERIFIED"
}`
  },
  {
    id: 'parivahan',
    name: 'MoRTH Parivahan Sarathi (DL)',
    department: 'Ministry of Road Transport & Highways',
    protocol: 'SOAP 1.2 XML (RPC Envelope)',
    latencyMs: 118,
    extractedFields: ['dl_number', 'cov_classes', 'validity_expiry', 'issuing_rto'],
    securityHash: 'SHA256:3c8d19a77b2e40f1a942cd88',
    status: 'ACTIVE',
    rawPayload: `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:sar="http://sarathi.morth.gov.in/ws">
  <soap:Header>
    <sar:SecurityToken>SAR-ENC-2026-88192</sar:SecurityToken>
  </soap:Header>
  <soap:Body>
    <sar:GetDLDetailsResponse>
      <sar:LicenceNumber>KA-01-2015-0098421</sar:LicenceNumber>
      <sar:HolderName>Vikas Sharma</sar:HolderName>
      <sar:VehicleClass>LMV, MCWG</sar:VehicleClass>
      <sar:IssueAuthority>KA-01 Bangalore Central</sar:IssueAuthority>
      <sar:ValidUntil>2035-08-13</sar:ValidUntil>
      <sar:StatusCode>ACTIVE</sar:StatusCode>
    </sar:GetDLDetailsResponse>
  </soap:Body>
</soap:Envelope>`,
    transformRule: `// NDEF Ingestion Adapter: MoRTH SOAP to NDEF JSON-LD
function transformParivahan(xmlDoc) {
  const body = xmlDoc.getElementsByTagName("sar:GetDLDetailsResponse")[0];
  return {
    "@type": "DrivingCredential",
    "credentialNumber": body.get("sar:LicenceNumber"),
    "holderName": body.get("sar:HolderName"),
    "categories": body.get("sar:VehicleClass").split(", "),
    "issuingRTO": body.get("sar:IssueAuthority"),
    "validUntil": body.get("sar:ValidUntil"),
    "status": "VALID"
  };
}`,
    ndefOutput: `{
  "@context": "https://schema.gov.in/ndef/v2",
  "@type": "DrivingCredential",
  "credentialNumber": "KA-01-2015-0098421",
  "holderName": "Vikas Sharma",
  "authorizedClasses": ["LMV", "MCWG"],
  "issuingAuthority": "KA-01 Bangalore Central RTO",
  "validUntil": "2035-08-13",
  "status": "ACTIVE_VERIFIED"
}`
  },
  {
    id: 'cbdt',
    name: 'CBDT Income Tax / PAN Registry',
    department: 'Ministry of Finance',
    protocol: 'REST JSON-LD (HMAC-SHA256)',
    latencyMs: 65,
    extractedFields: ['pan_masked', 'itr_compliance_status', 'tax_category', 'aadhaar_seeding'],
    securityHash: 'SHA256:4e2188ab6c90d512ef901234',
    status: 'ACTIVE',
    rawPayload: `{
  "pan_inquiry_response": {
    "pan_masked": "ABCDE****F",
    "holder_name": "VIKAS SHARMA",
    "aadhaar_linked": true,
    "last_itr_assessment": "AY 2025-26",
    "filing_status": "VERIFIED_COMPLIANT",
    "jurisdiction": "ITO WARD 3(1) BLR"
  }
}`,
    transformRule: `// NDEF Ingestion Adapter: CBDT PAN
function transformCBDT(input) {
  return {
    "@type": "TaxComplianceIdentity",
    "panReference": input.pan_inquiry_response.pan_masked,
    "normalizedHolder": input.pan_inquiry_response.holder_name,
    "aadhaarLinked": input.pan_inquiry_response.aadhaar_linked,
    "latestAssessment": input.pan_inquiry_response.last_itr_assessment,
    "isCompliant": input.pan_inquiry_response.filing_status === "VERIFIED_COMPLIANT"
  };
}`,
    ndefOutput: `{
  "@context": "https://schema.gov.in/ndef/v2",
  "@type": "TaxComplianceIdentity",
  "panReference": "ABCDE****F",
  "normalizedName": "Vikas Sharma",
  "aadhaarLinkageVerified": true,
  "itrAssessmentYear": "AY 2025-26",
  "complianceStatus": "ACTIVE_COMPLIANT",
  "jurisdiction": "ITO Ward 3(1) Bengaluru"
}`
  },
  {
    id: 'bbmp',
    name: 'BBMP Urban Local Body (Property Tax)',
    department: 'Municipal Administration Dept',
    protocol: 'SQL ODBC Bridge (ISO-8583)',
    latencyMs: 89,
    extractedFields: ['property_id_sas', 'ward_number', 'assessment_status', 'geo_coordinates'],
    securityHash: 'SHA256:91ac34b802eef566c7811902',
    status: 'ACTIVE',
    rawPayload: `{
  "sas_property_record": {
    "pid": "PID-BLR-RES-88219",
    "owner_name": "Vikas Sharma",
    "property_address": "42, Residency Road, Shanthala Nagar, Ward 111",
    "tax_payment_status": "CLEARED_UP_TO_DATE",
    "receipt_no": "SAS/2026/09941",
    "verification_hash": "BBMP-SEC-881249"
  }
}`,
    transformRule: `// NDEF Ingestion Adapter: Municipal Property
function transformMunicipal(input) {
  return {
    "@type": "MunicipalAddressRecord",
    "propertyId": input.sas_property_record.pid,
    "ownerName": input.sas_property_record.owner_name,
    "canonicalAddress": input.sas_property_record.property_address,
    "taxStatus": input.sas_property_record.tax_payment_status,
    "municipalWard": "Ward 111 (Shanthala Nagar)"
  };
}`,
    ndefOutput: `{
  "@context": "https://schema.gov.in/ndef/v2",
  "@type": "MunicipalAddressRecord",
  "propertyIdentification": "PID-BLR-RES-88219",
  "verifiedOwner": "Vikas Sharma",
  "canonicalAddress": "42, Residency Road, Shanthala Nagar, Ward 111, Bengaluru",
  "taxStatus": "PAID_VERIFIED",
  "jurisdiction": "BBMP Central Zone"
}`
  }
];

export const GovInteropHub: React.FC = () => {
  const { t } = useLanguage();
  const [registries, setRegistries] = useState<RegistryConnector[]>(REGISTRIES_DATA);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [selectedInspector, setSelectedInspector] = useState<RegistryConnector | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'RAW' | 'RULE' | 'NDEF'>('RAW');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activePipelineNode, setActivePipelineNode] = useState<string | null>(null);

  const handleResync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      // Add slight realistic jitter to latency
      setRegistries(prev => prev.map(reg => ({
        ...reg,
        latencyMs: Math.max(28, reg.latencyMs + Math.floor(Math.random() * 14 - 7))
      })));
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 900);
  };

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto mt-4">
      {/* 1. Interactive Top Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Network className="w-6 h-6 text-[#133E87] dark:text-blue-400" />
              <span>{t('Federated Interoperability Bus & API Gateway', 'Federated Interoperability Bus & API Gateway')}</span>
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            {t('Live middleware orchestration converting multi-departmental legacy feeds (SOAP/XML, REST, SQL) into standardized National Data Exchange Format (NDEF) records.', 'Live middleware orchestration converting multi-departmental legacy feeds (SOAP/XML, REST, SQL) into standardized National Data Exchange Format (NDEF) records.')}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">{t('Gateway Status', 'Gateway Status')}</span>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">4 / 4 {t('Nodes Online', 'Nodes Online')}</span>
          </div>

          <button
            onClick={handleResync}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-md shadow-sm transition transform active:scale-95 disabled:opacity-75 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-300' : 'text-amber-400'}`} />
            <span>{isSyncing ? t('Syncing Middleware...', 'Syncing Middleware...') : t('Re-sync Federated Registries', 'Re-sync Federated Registries')}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Federated API Exchange Mesh */}
      <InteroperabilityDataFlow />

      {/* 3. Topological Connector Flow Diagram */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#133E87] dark:text-blue-400" />
            <span>{t('Topological Data Flow Pipeline', 'Topological Data Flow Pipeline')}</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">{t('Last Synced:', 'Last Synced:')} {lastSyncTime}</span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-6 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 items-center">
            
            {/* Connected Registries (Col span 3) */}
            <div className="lg:col-span-3 space-y-2.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-[#133E87] dark:text-blue-400" />
                <span>{t('Authoritative Ministry Nodes', 'Authoritative Ministry Nodes')}</span>
              </div>
              
              {registries.map((reg) => (
                <div
                  key={reg.id}
                  onMouseEnter={() => setActivePipelineNode(reg.id)}
                  onMouseLeave={() => setActivePipelineNode(null)}
                  onClick={() => { setSelectedInspector(reg); setInspectorTab('RAW'); }}
                  className={`p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between text-xs ${
                    activePipelineNode === reg.id
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-[#133E87] dark:border-blue-400 shadow-sm scale-[1.01]'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 dark:text-white leading-tight">{t(reg.name, reg.name)}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{t(reg.protocol, reg.protocol)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">{reg.latencyMs}ms</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                </div>
              ))}
            </div>

            {/* Pipeline Center: JanSetu NDEF Transformation Engine (Col span 2) */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm text-center relative my-2 lg:my-0">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-700 flex items-center justify-center text-[#133E87] dark:text-blue-400 mb-2 shadow-xs relative">
                <Zap className={`w-6 h-6 ${isSyncing ? 'animate-pulse text-amber-500' : 'text-[#133E87] dark:text-blue-400'}`} />
                {isSyncing && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full animate-ping" />
                )}
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">{t('JanSetu NDEF Transformer', 'JanSetu NDEF Transformer')}</h4>
              <p className="text-[10px] text-slate-500 mt-1">{t('Schema Normalization & Entity Resolution Engine', 'Schema Normalization & Entity Resolution Engine')}</p>
              <div className="mt-2.5 inline-flex items-center gap-1 text-[9px] font-bold text-[#133E87] dark:text-blue-300 bg-blue-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-blue-200 dark:border-slate-700 font-mono">
                SOAP/XML &rarr; JSON-LD
              </div>
            </div>

            {/* Output Node: Citizen Golden Record Vault (Col span 2) */}
            <div className="lg:col-span-2 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">{t('Citizen Golden Record', 'Citizen Golden Record')}</h4>
              <p className="text-[10px] text-slate-600 dark:text-slate-400">{t('Zero-Duplication Vaulted Profile', 'Zero-Duplication Vaulted Profile')}</p>
              <span className="inline-block text-[9px] font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                AES-256 GCM
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* 3. Friction Reduction Value Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block">45 {t('interop_hub.fieldsSaved', 'Redundant Fields Saved')}</span>
            <span className="text-[11px] text-slate-600 dark:text-slate-400">{t('interop_hub.zeroDataEntry', 'Zero redundant data entry across departments')}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#133E87] dark:text-blue-400 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block">3 {t('interop_hub.visitsEliminated', 'Office Visits Eliminated')}</span>
            <span className="text-[11px] text-slate-600 dark:text-slate-400">{t('interop_hub.autoLinked', 'Municipal, Transport & Tax auto-linked')}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block">&lt; 120ms {t('interop_hub.subsecondTurnaround', 'Sub-second Turnaround')}</span>
            <span className="text-[11px] text-slate-600 dark:text-slate-400">{t('interop_hub.ekycPayload', 'Sub-second e-KYC payload processing')}</span>
          </div>
        </div>
      </div>

      {/* 4. Protocol & Adapter Telemetry Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm space-y-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-[#133E87] dark:text-blue-400" />
              <span>{t('interop_hub.departmentalConnectors', 'Departmental Registry Connectors & Protocols')}</span>
            </h3>
            <p className="text-[11px] text-slate-500">{t('interop_hub.liveAdapterStatus', 'Live adapter status, protocol transformations, and telemetry hashes.')}</p>
          </div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
            {t('GIGW 3.0 Middleware Compliant', 'GIGW 3.0 Middleware Compliant')}
          </span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 text-[10px] uppercase font-bold bg-slate-50/60 dark:bg-slate-900/80">
                <th className="py-3 px-4">{t('interop_hub.registrySource', 'Registry Endpoint')}</th>
                <th className="py-3 px-3">{t('interop_hub.protocolAdapter', 'Connector Protocol')}</th>
                <th className="py-3 px-3">{t('interop_hub.latency', 'Latency')}</th>
                <th className="py-3 px-3">{t('interop_hub.extractedFields', 'Extracted Fields')}</th>
                <th className="py-3 px-3">{t('interop_hub.cryptographicSeal', 'Security Hash')}</th>
                <th className="py-3 px-3 text-center">{t('common.status', 'Status')}</th>
                <th className="py-3 px-4 text-right">{t('interop_hub.schemaInspector', 'Schema Inspector')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {registries.map((reg) => (
                <tr key={reg.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900 dark:text-slate-200">{t(reg.name, reg.name)}</p>
                    <p className="text-[10px] text-slate-500">{t(reg.department, reg.department)}</p>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-semibold">{reg.protocol}</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{reg.latencyMs}ms</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {reg.extractedFields.map((f) => (
                        <span key={f} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[9px] font-mono text-slate-700 dark:text-slate-300">
                          {t(f, f)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate block max-w-[120px]">{reg.securityHash}</span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded text-[9px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {t('ACTIVE', 'ACTIVE')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => { setSelectedInspector(reg); setInspectorTab('RAW'); }}
                      className="bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-[#133E87] dark:text-blue-300 border border-blue-200 dark:border-slate-700 font-bold px-2.5 py-1.5 rounded text-[10px] transition cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>{t('Inspect', 'Inspect')}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Schema Transformation Inspector Modal / Drawer */}
      {selectedInspector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={() => setSelectedInspector(null)} />
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl relative z-10 w-full max-w-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#133E87] dark:text-blue-400" />
                  <span>Schema Transformation Inspector &bull; {selectedInspector.name}</span>
                </h3>
                <p className="text-[10px] text-slate-500">Inspect raw legacy ingestion payload and cleaned NDEF JSON output.</p>
              </div>
              <button
                onClick={() => setSelectedInspector(null)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded transition cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900 px-4 text-xs font-semibold">
              <button
                onClick={() => setInspectorTab('RAW')}
                className={`py-2.5 px-3.5 border-b-2 transition cursor-pointer ${
                  inspectorTab === 'RAW'
                    ? 'border-amber-400 text-amber-500 dark:text-amber-400 font-bold bg-white dark:bg-slate-800/80'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                1. Raw Ingest Feed ({selectedInspector.protocol.split(' ')[0]})
              </button>
              <button
                onClick={() => setInspectorTab('RULE')}
                className={`py-2.5 px-3.5 border-b-2 transition cursor-pointer ${
                  inspectorTab === 'RULE'
                    ? 'border-amber-400 text-amber-500 dark:text-amber-400 font-bold bg-white dark:bg-slate-800/80'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                2. Transformation Mapping
              </button>
              <button
                onClick={() => setInspectorTab('NDEF')}
                className={`py-2.5 px-3.5 border-b-2 transition cursor-pointer ${
                  inspectorTab === 'NDEF'
                    ? 'border-amber-400 text-amber-500 dark:text-amber-400 font-bold bg-white dark:bg-slate-800/80'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                3. Unified NDEF Output (JSON-LD)
              </button>
            </div>

            {/* Code Content View */}
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-slate-900 text-slate-100 relative">
              <button
                onClick={() => {
                  const content = inspectorTab === 'RAW' ? selectedInspector.rawPayload : inspectorTab === 'RULE' ? selectedInspector.transformRule : selectedInspector.ndefOutput;
                  handleCopy(content, inspectorTab);
                }}
                className="absolute top-6 right-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-2.5 py-1 rounded text-[10px] flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedSection === inspectorTab ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSection === inspectorTab ? 'Copied' : 'Copy'}</span>
              </button>

              <pre className="p-3 leading-relaxed whitespace-pre-wrap">
                {inspectorTab === 'RAW' && selectedInspector.rawPayload}
                {inspectorTab === 'RULE' && selectedInspector.transformRule}
                {inspectorTab === 'NDEF' && selectedInspector.ndefOutput}
              </pre>
            </div>

            {/* Modal Footer Info */}
            <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
              <span className="font-mono">Security Seal: {selectedInspector.securityHash}</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero Data Loss Guaranteed</span>
              </span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
