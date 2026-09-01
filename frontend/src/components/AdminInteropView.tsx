'use client';

import React, { useState, useMemo } from 'react';
import { 
  Radio, 
  Database, 
  Shield, 
  Server, 
  ArrowRight, 
  Activity, 
  ArrowRightLeft, 
  ArrowDownCircle, 
  Network, 
  CheckCircle2, 
  Info, 
  Zap, 
  KeyRound, 
  RefreshCw, 
  Layers, 
  ExternalLink,
  Code,
  Building,
  Landmark,
  Lock
} from 'lucide-react';
import { ExceptionCenter } from './ExceptionCenter';
import { InteroperabilityDataFlow } from './InteroperabilityDataFlow';
import { useLanguage } from '@/context/LanguageContext';

interface NodeDetail {
  id: string;
  label: string;
  shortName: string;
  type: 'client' | 'security' | 'core' | 'external';
  layer: string;
  department: string;
  status: string;
  protocol: string;
  latency: string;
  successRate: string;
  demo: boolean;
  description: string;
  citizenImpact: string;
  exchangedFields: Array<{ name: string; type: string; desc: string }>;
  endpoint: string;
  securityStandard: string;
}

export const AdminInteropView = () => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'topology' | 'registry' | 'exceptions'>('topology');

  const mockNodes: NodeDetail[] = useMemo(() => [
    { 
      id: 'citizen', 
      label: 'Citizen Web/Mobile Client', 
      shortName: 'Client UI',
      type: 'client', 
      layer: 'Layer 1: Presentation & User Client',
      department: 'Digital Public Infrastructure (India Stack)',
      status: 'Active', 
      protocol: 'HTTPS / TLS 1.3', 
      latency: '24ms', 
      successRate: '99.9%', 
      demo: false,
      description: 'End-user responsive progressive web app and mobile client where citizens trigger service journeys, review consent prompts, and access digital lockers.',
      citizenImpact: 'Provides a unified single window for all 28 central ministries and state departments without visiting physical offices.',
      exchangedFields: [
        { name: 'session_token', type: 'JWT Bearer', desc: 'Secure ephemeral session credential' },
        { name: 'client_locale', type: 'BCP-47', desc: 'Selected Indic language code (e.g. hi, mr, ta)' },
        { name: 'user_agent_sig', type: 'SHA-256', desc: 'Device integrity and tamper proof stamp' }
      ],
      endpoint: 'GET /app/citizen/dashboard',
      securityStandard: 'GIGW 3.0 / W3C WCAG 2.1 AAA'
    },
    { 
      id: 'consent', 
      label: 'DPDP Electronic Consent Manager', 
      shortName: 'Consent Manager',
      type: 'security', 
      layer: 'Layer 2: Privacy, Policy & Security',
      department: 'Data Protection Board of India',
      status: 'Active', 
      protocol: 'OAuth 2.0 / JWT / PKCE', 
      latency: '42ms', 
      successRate: '100%', 
      demo: false,
      description: 'Zero-trust electronic consent manager enforcing the Digital Personal Data Protection (DPDP) Act 2023. Generates cryptographic consent tokens.',
      citizenImpact: 'Guarantees that your data is never accessed, shared, or processed by any department without your explicit, revocable permission.',
      exchangedFields: [
        { name: 'consent_artifact_id', type: 'UUIDv4', desc: 'Immutable signed consent record' },
        { name: 'purpose_code', type: 'String (ISO)', desc: 'Standardized purpose (e.g. SCHEME_ELIGIBILITY)' },
        { name: 'validity_expiry', type: 'ISO Date', desc: 'Time-bound expiration timestamp (15 mins)' }
      ],
      endpoint: 'POST /v1/consent/artifact/grant',
      securityStandard: 'DPDP Act 2023 / MeitY Consent Architecture v1.2'
    },
    { 
      id: 'gateway', 
      label: 'JanSetu Core Interop Gateway', 
      shortName: 'Interop Gateway',
      type: 'core', 
      layer: 'Layer 2: Canonical Normalization & Routing',
      department: 'National e-Governance Division (NeGD)',
      status: 'Active', 
      protocol: 'JSON-LD / gRPC v2 / NDEF v2', 
      latency: '12ms', 
      successRate: '99.95%', 
      demo: false,
      description: 'High-throughput enterprise schema transformation engine. Harmonizes incompatible legacy SOAP, XML, and SQL payloads into standardized NDEF JSON-LD.',
      citizenImpact: 'Translates messy departmental data on-the-fly, resolving spelling discrepancies and mismatches between Aadhaar, PAN, and certificates.',
      exchangedFields: [
        { name: 'ndef_canonical_record', type: 'JSON-LD Object', desc: 'Standardized national citizen entity model' },
        { name: 'schema_transform_id', type: 'String', desc: 'Active adapter rule (e.g. SOAP_TO_NDEF_V2)' },
        { name: 'latency_telemetry_ms', type: 'Integer', desc: 'Real-time pipeline latency measurement' }
      ],
      endpoint: 'POST /gateway/v2/transform-ndef',
      securityStandard: 'National Data Governance Framework (NDGFP)'
    },
    { 
      id: 'mca', 
      label: 'MCA21 Company & Business Registry', 
      shortName: 'MCA21 Registry',
      type: 'external', 
      layer: 'Layer 3: Authoritative Corporate Registry',
      department: 'Ministry of Corporate Affairs',
      status: 'Active', 
      protocol: 'SOAP 1.2 XML / WS-Security', 
      latency: '180ms', 
      successRate: '98.5%', 
      demo: true,
      description: 'Authoritative national registry for corporate entities, LLPs, Director Identification Numbers (DIN), and business incorporation records.',
      citizenImpact: 'Enables instant business onboarding and trade licensing by verifying company registration numbers (CIN/LLPIN) without paper documents.',
      exchangedFields: [
        { name: 'cin_llpin_number', type: 'String (21 Char)', desc: 'Corporate / LLP Identification Number' },
        { name: 'company_status', type: 'Enum (ACTIVE)', desc: 'Authoritative registrar status flag' },
        { name: 'authorized_capital', type: 'Currency (INR)', desc: 'Verified share capital valuation' }
      ],
      endpoint: 'POST /mca-soap/services/CompanyMasterData_v2',
      securityStandard: 'MCA Security Guidelines / XML-DSig'
    },
    { 
      id: 'uidai', 
      label: 'UIDAI Aadhaar e-KYC Registry', 
      shortName: 'UIDAI Aadhaar',
      type: 'external', 
      layer: 'Layer 3: Statutory National Identity Registry',
      department: 'Unique Identification Authority of India (UIDAI)',
      status: 'Active', 
      protocol: 'REST v2.4 / Base64 XML / mTLS', 
      latency: '65ms', 
      successRate: '99.8%', 
      demo: false,
      description: 'National identity repository providing instant demographic validation, OTP-based e-KYC, and masked Virtual ID (VID) privacy tokenization.',
      citizenImpact: 'Proves your legal name, age, and address in under 1 second without showing physical plastic cards or photocopies.',
      exchangedFields: [
        { name: 'masked_vid_token', type: '16-Digit VID', desc: 'Privacy-safe virtual identifier' },
        { name: 'canonical_full_name', type: 'String', desc: 'Authoritative legal name in Roman & Devanagari' },
        { name: 'ekyc_level', type: 'Enum (IAL_3)', desc: 'NIST Identity Assurance Level' }
      ],
      endpoint: 'POST /uidai/auth/v2.4/kyc/demographic-match',
      securityStandard: 'Aadhaar Act 2016 / UIDAI CIDR Security Norms'
    },
    { 
      id: 'municipal', 
      label: 'State & Municipal Registry', 
      shortName: 'Municipal Node',
      type: 'external', 
      layer: 'Layer 3: State & Local Urban Governance',
      department: 'Urban Development & Municipal Administration',
      status: 'Active', 
      protocol: 'ISO-8583 / REST JSON', 
      latency: '210ms', 
      successRate: '96.2%', 
      demo: true,
      description: 'Local government database managing property assessment numbers (PID), trade license renewals, municipal tax clearance, and water/sewerage connections.',
      citizenImpact: 'Enables automatic property tax verification and trade license renewals without visiting the municipal corporation office.',
      exchangedFields: [
        { name: 'property_pid_no', type: 'String (PID)', desc: 'Property Identification Number' },
        { name: 'tax_clearance_flag', type: 'Boolean', desc: 'Current fiscal year tax clearance proof' },
        { name: 'ward_zone_code', type: 'String', desc: 'Municipal administrative jurisdiction code' }
      ],
      endpoint: 'POST /state-municipal/api/v1/property/verify-tax',
      securityStandard: 'State Municipal e-Gov Security Standard'
    },
  ], []);

  // Default selected node on initial load
  const [selectedNode, setSelectedNode] = useState<NodeDetail>(mockNodes[0]);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const handleTestHandshake = (node: NodeDetail) => {
    setIsTestingPing(true);
    setPingResult(null);
    setTimeout(() => {
      setIsTestingPing(false);
      setPingResult(`HTTP 200 OK • Handshake verified with ${node.label} (${node.latency}) • Protocol: ${node.protocol} • Status: ${node.status}`);
    }, 500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Network className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            <span>{t('adminInterop.gateway', 'Government Interoperability Hub')}</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t('adminInterop.gatewayDesc', 'Cross-departmental API mesh converting legacy state protocols into the National Data Exchange Format (NDEF).')}
          </p>
        </div>
        
        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setViewMode('topology')}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewMode === 'topology' 
                ? 'bg-[#0B2545] dark:bg-pink-500 text-white font-bold shadow-xs' 
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('adminInterop.topologyMap', 'Topology Map')}
          </button>
          <button
            onClick={() => setViewMode('registry')}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewMode === 'registry' 
                ? 'bg-[#0B2545] dark:bg-pink-500 text-white font-bold shadow-xs' 
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('adminInterop.connectorRegistry', 'Connector Registry')}
          </button>
          <button
            onClick={() => setViewMode('exceptions')}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewMode === 'exceptions' 
                ? 'bg-[#0B2545] dark:bg-pink-500 text-white font-bold shadow-xs' 
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('adminInterop.exceptionCenter', 'Exception Center')}
          </button>
        </div>
      </div>

      {/* SIH Presentation Demo Mode Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-indigo-500/40 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-pink-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider">{t('SIH 2026 Live Demo Mode', 'SIH 2026 Live Demo Mode')}</span>
              <span className="text-emerald-400 text-xs font-mono font-bold">{t('● Multi-Cloud Mesh Active', '● Multi-Cloud Mesh Active')}</span>
            </div>
            <h3 className="text-base font-black tracking-tight">{t('Zero-Trust NDEF Data Translation Engine', 'Zero-Trust NDEF Data Translation Engine')}</h3>
            <p className="text-xs text-slate-300 max-w-3xl">
              {t('Simulate an end-to-end citizen query showing how JanSetu verifies DPDP user consent, queries heterogeneous state nodes (SOAP/REST/ISO), and unifies credentials into verifiable NDEF JSON-LD.', 'Simulate an end-to-end citizen query showing how JanSetu verifies DPDP user consent, queries heterogeneous state nodes (SOAP/REST/ISO), and unifies credentials into verifiable NDEF JSON-LD.')}
            </p>
          </div>

          <button
            type="button"
            disabled={isSimulating}
            onClick={runSimulation}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-md transition cursor-pointer shrink-0 disabled:opacity-75"
          >
            {isSimulating ? (
              <>
                <Activity className="w-4 h-4 animate-spin text-amber-300" />
                <span>{t('Translating across Mesh...', 'Translating across Mesh...')}</span>
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4 text-amber-300" />
                <span>{t('Trigger Live SIH Simulation', 'Trigger Live SIH Simulation')}</span>
              </>
            )}
          </button>
        </div>

        {/* Live Simulation Progress Pipeline */}
        {simulationStage > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2 border-t border-indigo-800/60 animate-fade-in text-[11px]">
            <div className={`p-2.5 rounded-lg border ${simulationStage >= 1 ? 'bg-indigo-900/60 border-pink-400 text-pink-200' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
              <span className="font-bold block text-[10px]">{t('01. Citizen Request', '01. Citizen Request')}</span>
              <span className="text-[10px] text-slate-300">Pune Food Biz / Voter / PAN</span>
            </div>
            <div className={`p-2.5 rounded-lg border ${simulationStage >= 2 ? 'bg-indigo-900/60 border-pink-400 text-pink-200' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
              <span className="font-bold block text-[10px]">{t('02. DPDP Consent Gate', '02. DPDP Consent Gate')}</span>
              <span className="text-[10px] text-slate-300">OAuth 2.0 Token Issued</span>
            </div>
            <div className={`p-2.5 rounded-lg border ${simulationStage >= 3 ? 'bg-indigo-900/60 border-pink-400 text-pink-200' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
              <span className="font-bold block text-[10px]">{t('03. Legacy Protocol Ingest', '03. Legacy Protocol Ingest')}</span>
              <span className="text-[10px] text-slate-300">SOAP 1.2 XML / ISO-8583</span>
            </div>
            <div className={`p-2.5 rounded-lg border ${simulationStage >= 4 ? 'bg-indigo-900/60 border-pink-400 text-pink-200' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
              <span className="font-bold block text-[10px]">{t('04. NDEF Canonical Map', '04. NDEF Canonical Map')}</span>
              <span className="text-[10px] text-slate-300">Normalized JSON-LD Mesh</span>
            </div>
            <div className={`p-2.5 rounded-lg border ${simulationStage >= 5 ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
              <span className="font-bold block text-[10px]">{t('05. Verified Delivery', '05. Verified Delivery')}</span>
              <span className="text-[10px] text-emerald-300">Verified in 14ms ✓</span>
            </div>
          </div>
        )}
      </div>

      {/* Interoperability Gateway Descriptive Banner */}
      <div className="bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800/40 rounded-2xl p-5 shadow-xs border-l-4 border-l-pink-500 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-xs shrink-0 border border-pink-100 dark:border-pink-900/50">
          <ArrowRightLeft className="w-6 h-6 text-pink-600 dark:text-pink-400" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">How the Interoperability Hub Works</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
            The Interoperability Hub serves as the central nervous system connecting disjointed state and central government registries. 
            By standardizing data protocols into the National Data Exchange Format (NDEF), it enables seamless cross-departmental data fetching,
            eliminating the need for citizens to manually submit duplicate documents across different government silos.
          </p>
        </div>
      </div>

      {viewMode === 'registry' && (
        <div className="space-y-6">
          <InteroperabilityDataFlow />
        </div>
      )}

      {viewMode === 'topology' && (
        <div className="space-y-6">
          {/* Quick Explainer Overview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                National Data Exchange Architecture (3-Tier Enterprise Mesh)
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-4xl">
              JanSetu decouples the citizen presentation layer from raw government databases. When a citizen triggers a service request, the <strong>DPDP Consent Manager</strong> issues a cryptographic consent token, allowing the <strong>Core Gateway</strong> to query heterogeneous ministry protocols (SOAP, XML, REST) and normalize them into unified NDEF JSON-LD.
            </p>
          </div>

          {/* Dedicated Quick Node Selector Bar */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                Select Node in Graph to Inspect:
              </span>
              <span className="text-[10px] text-slate-500">
                Active Node: <strong className="text-indigo-600 dark:text-indigo-400">{selectedNode.label}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {mockNodes.map((node) => {
                const isSel = selectedNode.id === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => {
                      setSelectedNode(node);
                      setPingResult(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSel
                        ? 'bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-white/70 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`w-2 h-2 rounded-full ${node.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className={`text-[9px] font-bold font-mono px-1 py-0.2 rounded ${
                        isSel ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'text-slate-400'
                      }`}>
                        {node.latency}
                      </span>
                    </div>
                    <div>
                      <p className={`text-xs font-bold leading-tight ${isSel ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                        {node.shortName}
                      </p>
                      <p className="text-[9px] text-slate-500 truncate mt-0.5">
                        {node.protocol}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Topology Diagram with Node Inspector */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row relative">
            
            {/* Canvas Area */}
            <div className="flex-1 p-8 relative min-h-[460px] border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-50/70 dark:bg-[#05050a] overflow-x-auto">
              {/* Dot Grid Background */}
              <div className="absolute inset-0 opacity-15 dark:opacity-25" style={{ backgroundImage: 'radial-gradient(#3b82f6 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
              
              <div className="relative z-10 flex flex-col items-center gap-8 min-w-[360px] max-w-xl mx-auto py-4">
                
                {/* Layer 1: Client Node */}
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                    [Tier 1: Citizen Client Interface]
                  </span>
                  <NodeButton 
                    node={mockNodes[0]} 
                    t={t} 
                    onClick={() => { setSelectedNode(mockNodes[0]); setPingResult(null); }} 
                    selected={selectedNode.id === 'citizen'} 
                  />
                </div>
                
                {/* Animated Connecting Line to Tier 2 */}
                <div className="w-px h-8 bg-gradient-to-b from-blue-500 to-amber-500 relative">
                  <div className="absolute inset-0 animate-pulse bg-blue-400 blur-[2px]" />
                </div>

                {/* Layer 2: Security & Core Gateway */}
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                    [Tier 2: Policy, DPDP Consent & Core Middleware]
                  </span>
                  <div className="flex items-center gap-8 sm:gap-12">
                    <NodeButton 
                      node={mockNodes[1]} 
                      t={t} 
                      onClick={() => { setSelectedNode(mockNodes[1]); setPingResult(null); }} 
                      selected={selectedNode.id === 'consent'} 
                    />
                    <div className="h-px w-8 sm:w-12 bg-amber-500 relative">
                      <div className="absolute inset-0 animate-pulse bg-amber-400 blur-[2px]" />
                    </div>
                    <NodeButton 
                      node={mockNodes[2]} 
                      t={t} 
                      onClick={() => { setSelectedNode(mockNodes[2]); setPingResult(null); }} 
                      selected={selectedNode.id === 'gateway'} 
                    />
                  </div>
                </div>

                {/* Connecting Lines to Tier 3 */}
                <div className="flex w-full justify-between px-12 relative">
                   <svg className="absolute inset-0 w-full h-12 pointer-events-none" style={{ top: 0, left: 0 }}>
                     <path d="M 50% 0 L 15% 100%" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-[dash_1s_linear_infinite]" />
                     <path d="M 50% 0 L 50% 100%" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-[dash_1s_linear_infinite]" />
                     <path d="M 50% 0 L 85% 100%" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-[dash_1s_linear_infinite]" />
                   </svg>
                </div>

                {/* Layer 3: External Authoritative Registries */}
                <div className="flex flex-col items-center w-full">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                    [Tier 3: Authoritative Government Databases]
                  </span>
                  <div className="flex items-center justify-between w-full mt-2 gap-2 sm:gap-4">
                    <NodeButton 
                      node={mockNodes[3]} 
                      t={t} 
                      onClick={() => { setSelectedNode(mockNodes[3]); setPingResult(null); }} 
                      selected={selectedNode.id === 'mca'} 
                    />
                    <NodeButton 
                      node={mockNodes[4]} 
                      t={t} 
                      onClick={() => { setSelectedNode(mockNodes[4]); setPingResult(null); }} 
                      selected={selectedNode.id === 'uidai'} 
                    />
                    <NodeButton 
                      node={mockNodes[5]} 
                      t={t} 
                      onClick={() => { setSelectedNode(mockNodes[5]); setPingResult(null); }} 
                      selected={selectedNode.id === 'municipal'} 
                    />
                  </div>
                </div>

              </div>
              
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes dash { to { stroke-dashoffset: -8; } }
              `}} />
            </div>

            {/* Node Inspection Panel */}
            <div className="w-full lg:w-96 bg-white dark:bg-slate-950 p-6 flex flex-col border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-500" />
                  {t('adminInterop.nodeInspector', 'Node Inspector & Telemetry')}
                </h3>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded font-bold border border-emerald-200 dark:border-emerald-800">
                  ● {selectedNode.status}
                </span>
              </div>
              
              <div className="space-y-4 animate-fadeIn">
                {/* Node Identity */}
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                    {selectedNode.layer}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedNode.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{selectedNode.department}</p>
                </div>

                {/* Technical Metric Cards */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Protocol</span>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-200 truncate block">{selectedNode.protocol}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Latency / Rate</span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedNode.latency} ({selectedNode.successRate})</span>
                  </div>
                </div>

                {/* Plain-English Citizen Impact */}
                <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> What This Node Solves
                  </span>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedNode.citizenImpact}
                  </p>
                </div>

                {/* Technical Mission */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Info className="w-3.5 h-3.5" /> Department Role
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {selectedNode.description}
                  </p>
                </div>

                {/* Exchanged Fields Preview */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                    <KeyRound className="w-3.5 h-3.5" /> Exchanged Schema Fields
                  </span>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1 text-[10px] font-mono">
                    {selectedNode.exchangedFields.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between text-slate-700 dark:text-slate-300 py-0.5 border-b border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{f.name}</span>
                        <span className="text-slate-500">{f.type}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Test Handshake Ping Button */}
                <div>
                  <button
                    onClick={() => handleTestHandshake(selectedNode)}
                    disabled={isTestingPing}
                    className="w-full flex items-center justify-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingPing ? 'animate-spin' : ''}`} />
                    {isTestingPing ? 'Pinging Gateway...' : `Test ${selectedNode.shortName} Connection`}
                  </button>

                  {pingResult && (
                    <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[10px] font-mono text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{pingResult}</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const NodeButton = ({ node, onClick, selected, t }: { node: NodeDetail, onClick: () => void, selected: boolean, t: any }) => {
  const getIcon = () => {
    if (node.type === 'client') return <div className="w-6 h-6 rounded-full bg-blue-500/20 text-[#133E87] dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">UI</div>;
    if (node.type === 'security') return <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
    if (node.type === 'core') return <Activity className="w-6 h-6 text-pink-600 dark:text-pink-400" />;
    return <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
  };

  const getColors = () => {
    if (selected) return 'bg-indigo-50 dark:bg-slate-800 border-indigo-600 dark:border-indigo-400 shadow-lg scale-105 ring-2 ring-indigo-500/20';
    if (node.type === 'core') return 'bg-white dark:bg-slate-900 border-pink-400 dark:border-pink-500/50 hover:border-pink-500';
    if (node.type === 'security') return 'bg-white dark:bg-slate-900 border-amber-400 dark:border-amber-500/50 hover:border-amber-500';
    return 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-400';
  };

  return (
    <button 
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${getColors()} w-32 h-24 z-20 shadow-sm cursor-pointer`}
    >
      {getIcon()}
      <span className="text-[10px] font-bold text-slate-900 dark:text-slate-200 text-center leading-tight">
        {node.shortName}
      </span>
      <span className="text-[8px] font-mono text-slate-500 dark:text-slate-400">
        {node.latency}
      </span>
      {node.demo && <div className="absolute -bottom-2 bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 rounded uppercase">DEMO</div>}
    </button>
  );
};

export default AdminInteropView;
