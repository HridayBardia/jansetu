'use client';

import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Activity, 
  Server, 
  Database, 
  ShieldCheck, 
  Zap, 
  Info, 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  FileText, 
  CreditCard, 
  HeartHandshake, 
  Layers, 
  X, 
  Play, 
  Pause,
  ExternalLink,
  Cpu,
  Fingerprint,
  FileCheck,
  Building,
  Landmark,
  BadgeCheck,
  RefreshCw,
  Clock,
  KeyRound,
  Sparkles,
  Radio
} from 'lucide-react';

interface NodeDetail {
  id: string;
  label: string;
  fullName: string;
  department: string;
  ministry: string;
  x: number;
  y: number;
  icon: any;
  color: string;
  badgeBg: string;
  borderActive: string;
  bgActive: string;
  latency: string;
  uptime: string;
  protocol: string;
  trustScore: string;
  description: string;
  keyResponsibilities: string[];
  citizenBenefit: string;
  exchangedDataFields: Array<{ field: string; type: string; purpose: string }>;
  sampleEndpoint: string;
  complianceCert: string;
}

const NODES: NodeDetail[] = [
  { 
    id: 'citizen', 
    label: 'Citizen Portal', 
    fullName: 'JanSetu Unified Golden Identity Hub',
    department: 'National e-Governance Division (NeGD)',
    ministry: 'Digital India Stack Core',
    x: 50, 
    y: 50, 
    icon: UserCenterIcon,
    color: 'text-amber-500 dark:text-amber-400',
    badgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-300 dark:border-amber-500/30',
    borderActive: 'border-amber-500 shadow-amber-500/20 dark:shadow-amber-500/30',
    bgActive: 'bg-amber-500/10 dark:bg-amber-500/20',
    latency: '0ms (Core)',
    uptime: '99.99%',
    protocol: 'Open API / OAuth 2.0 / NDEF v2',
    trustScore: 'Authoritative Core (1.00)',
    description: 'Central orchestration engine that aggregates authoritative data across government registries to deliver proactive welfare and life-journey milestones.',
    keyResponsibilities: [
      'Orchestrates life-journey milestones (Study Abroad, Business, Farming, Pension)',
      'Enforces user-controlled granular consent under India DPDP Act 2023',
      'Harmonizes demographic variations into a single verified Golden Record',
      'Translates real-time government notifications across 23 official Indian languages'
    ],
    citizenBenefit: 'You never have to fill out the same 50-field form twice or visit multiple district offices.',
    exchangedDataFields: [
      { field: 'consent_token_jwt', type: 'JWT / RSA-2048', purpose: 'Time-bound cryptographic citizen consent' },
      { field: 'journey_session_id', type: 'UUIDv4', purpose: 'Cross-ministry journey state tracker' },
      { field: 'payload_checksum', type: 'SHA-256 Hash', purpose: 'Zero-knowledge verification proof' },
      { field: 'language_bcp47', type: 'ISO String', purpose: 'Citizen preferred Indic dialect code' }
    ],
    sampleEndpoint: 'POST /api/v1/interop/orchestrate-journey',
    complianceCert: 'ISO 27001 / DPDP 2023 Certified'
  },
  { 
    id: 'uidai', 
    label: 'UIDAI (Identity)', 
    fullName: 'Unique Identification Authority of India (UIDAI)',
    department: 'Aadhaar Central Identities Data Repository (CIDR)',
    ministry: 'Ministry of Electronics & IT (MeitY)',
    x: 82, 
    y: 20, 
    icon: ShieldCheck,
    color: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
    borderActive: 'border-emerald-500 shadow-emerald-500/20 dark:shadow-emerald-500/30',
    bgActive: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    latency: '42ms',
    uptime: '99.98%',
    protocol: 'REST v2.4 (mTLS / RSA-2048)',
    trustScore: 'Statutory National Identity Authority',
    description: 'The sole statutory authority providing instant biometric, demographic, and OTP-based digital proof of identity to all Indian residents.',
    keyResponsibilities: [
      'Performs instantaneous demographic and biometric e-KYC (NIST IAL-3)',
      'Generates secure 16-digit Virtual ID (VID) tokens to safeguard citizen privacy',
      'Provides digitally signed demographic proof (Legal Name, DOB, Address, Gender)',
      'Validates mobile OTP and FaceAuth credentials for remote government onboarding'
    ],
    citizenBenefit: 'Proves your identity remotely in 3 seconds without showing physical cards or submitting photocopies.',
    exchangedDataFields: [
      { field: 'aadhaar_token_ref', type: 'Masked Token (VID)', purpose: 'Privacy-preserving identity token (No raw Aadhaar)' },
      { field: 'legal_full_name', type: 'String (Canonical)', purpose: 'Official legal name as per national records' },
      { field: 'dob_iso8601', type: 'ISO Date', purpose: 'Authoritative birthdate verification' },
      { field: 'address_canonical', type: 'NDEF v2 Address', purpose: 'Standardized residential address with Pincode' }
    ],
    sampleEndpoint: 'POST /auth/v2.4/identity/ekyc-verify',
    complianceCert: 'Aadhaar Act 2016 / UIDAI Security Guidelines v3'
  },
  { 
    id: 'digilocker', 
    label: 'DigiLocker (Vault)', 
    fullName: 'DigiLocker National Document Depository',
    department: 'National e-Governance Division (NeGD)',
    ministry: 'Digital India Corporation',
    x: 82, 
    y: 80, 
    icon: Database,
    color: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border-blue-300 dark:border-blue-500/30',
    borderActive: 'border-blue-500 shadow-blue-500/20 dark:shadow-blue-500/30',
    bgActive: 'bg-blue-500/10 dark:bg-blue-500/20',
    latency: '88ms',
    uptime: '99.95%',
    protocol: 'JSON-LD / W3C Verifiable Credentials',
    trustScore: 'Official Digital Repository (IT Act 2000)',
    description: 'Digital wallet and document exchange ecosystem delivering legally recognized certificates directly from 2,300+ government and academic issuers.',
    keyResponsibilities: [
      'Fetches CBSE, ICSE, and State Board Class 10th and 12th Marksheets instantly',
      'Retrieves driving licenses and vehicle registration certificates (RC) from MoRTH',
      'Validates caste, income, and domicile certificates from state revenue departments',
      'Verifies authentic X.509 digital signatures to eliminate fraudulent documentation'
    ],
    citizenBenefit: 'Eliminates lost certificates, notary visits, and attestation fees by pulling verified documents digitally.',
    exchangedDataFields: [
      { field: 'doc_uri', type: 'URN (Universal Doc ID)', purpose: 'Immutable URI pointing to authoritative certificate' },
      { field: 'doc_type', type: 'W3C Credential Type', purpose: 'Standard certificate type (e.g. 10th Marksheet, DL)' },
      { field: 'digital_signature', type: 'X.509 PKI Signature', purpose: 'Official issuer cryptographic tamper-proof stamp' },
      { field: 'issuing_authority', type: 'Org Identifier', purpose: 'Accredited issuing board or state department' }
    ],
    sampleEndpoint: 'GET /public/v1/pull/certificate-verifiable',
    complianceCert: 'Section 9A IT Act 2000 (Legal Parity with Physicals)'
  },
  { 
    id: 'health', 
    label: 'Health Registry (ABHA)', 
    fullName: 'Ayushman Bharat Digital Mission (ABDM)',
    department: 'National Health Authority (NHA)',
    ministry: 'Ministry of Health & Family Welfare',
    x: 18, 
    y: 20, 
    icon: Activity,
    color: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-rose-300 dark:border-rose-500/30',
    borderActive: 'border-rose-500 shadow-rose-500/20 dark:shadow-rose-500/30',
    bgActive: 'bg-rose-500/10 dark:bg-rose-500/20',
    latency: '54ms',
    uptime: '99.96%',
    protocol: 'FHIR v4.0 / HL7 REST API',
    trustScore: 'National Health Authority Certified',
    description: 'Integrated digital health infrastructure linking citizen health identifiers (ABHA) with healthcare providers, coverage schemes, and wellness records.',
    keyResponsibilities: [
      'Creates and verifies the 14-digit ABHA (Ayushman Bharat Health Account) number',
      'Validates ₹5,00,000 annual cashless hospitalization coverage under PM-JAY',
      'Connects 28,000+ empaneled government and private hospitals across India',
      'Enables consent-based sharing of diagnostic reports and discharge summaries'
    ],
    citizenBenefit: 'Guarantees instant cashless hospital admissions under PM-JAY without waiting for manual paper pre-approvals.',
    exchangedDataFields: [
      { field: 'abha_number_14', type: 'String (XX-XXXX-XXXX-XXXX)', purpose: 'Unique citizen digital health identifier' },
      { field: 'pmjay_eligibility', type: 'Boolean / Score', purpose: 'PM-JAY ₹5 Lakh annual hospital cover active status' },
      { field: 'available_balance', type: 'Currency (INR)', purpose: 'Remaining annual health protection balance' },
      { field: 'empaneled_hosp_code', type: 'NHA Facility ID', purpose: 'Authorized hospital network routing code' }
    ],
    sampleEndpoint: 'POST /v0.5/health-information/verify-pmjay',
    complianceCert: 'ABDM Health Data Management Policy (HDMP)'
  },
  { 
    id: 'dbt', 
    label: 'DBT / PFMS (Finance)', 
    fullName: 'Direct Benefit Transfer & PFMS Gateway',
    department: 'Department of Expenditure, Ministry of Finance',
    ministry: 'Ministry of Finance & NPCI',
    x: 18, 
    y: 80, 
    icon: Server,
    color: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 border-purple-300 dark:border-purple-500/30',
    borderActive: 'border-purple-500 shadow-purple-500/20 dark:shadow-purple-500/30',
    bgActive: 'bg-purple-500/10 dark:bg-purple-500/20',
    latency: '62ms',
    uptime: '99.97%',
    protocol: 'ISO 20022 Financial XML / NPCI ACH',
    trustScore: 'Public Financial Management System (PFMS)',
    description: 'Central electronic payment and fund tracking gateway ensuring financial welfare subsidies reach citizen bank accounts directly without leakages.',
    keyResponsibilities: [
      'Verifies NPCI Aadhaar-Bank Account Seeding mapper status in real time',
      'Disburses PM-KISAN, scholarship stipends, and old-age pensions directly',
      'Validates bank IFSC codes, branch validity, and beneficiary account name matching',
      'Provides end-to-end transparent transaction audit trails for welfare disbursements'
    ],
    citizenBenefit: 'Ensures 100% of your welfare money lands straight in your bank account with zero middlemen deductions.',
    exchangedDataFields: [
      { field: 'npci_mapper_status', type: 'Enum (ACTIVE / INACTIVE)', purpose: 'Aadhaar payment bridge linkage confirmation' },
      { field: 'pfms_beneficiary_id', type: 'String (PFMS-XXXX)', purpose: 'Unique government welfare beneficiary account ID' },
      { field: 'bank_name_masked', type: 'String (Bank Name)', purpose: 'Designated primary welfare recipient bank' },
      { field: 'disbursal_status', type: 'Transaction State', purpose: 'Real-time payment release & settlement confirmation' }
    ],
    sampleEndpoint: 'POST /dbt/v3/banking/verify-seeding',
    complianceCert: 'Reserve Bank of India (RBI) & PFMS Security Norms'
  },
];

function UserCenterIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const EDGES = [
  { source: 'citizen', target: 'uidai', label: 'e-KYC Identity Verification', description: 'Validates demographic credentials and active VID token with UIDAI CIDR', latency: '42ms', code: 'REST 200 OK' },
  { source: 'citizen', target: 'digilocker', label: 'Direct Certificate Pull', description: 'Retrieves authentic digitally-signed Marksheet, DL & Domicile documents', latency: '88ms', code: 'JSON-LD 200 OK' },
  { source: 'citizen', target: 'health', label: 'ABHA Health Link', description: 'Validates ₹5 Lakh PM-JAY coverage eligibility and hospital network connectivity', latency: '54ms', code: 'FHIR 200 OK' },
  { source: 'citizen', target: 'dbt', label: 'NPCI Account Seeding Check', description: 'Verifies active bank account linking for instant zero-leakage welfare payouts', latency: '62ms', code: 'ISO 200 OK' },
  { source: 'uidai', target: 'dbt', label: 'Aadhaar Direct Seeding Match', description: 'Cross-verifies identity tokens with central banking registry for automated transfers', latency: '35ms', code: 'RPC 200 OK' },
  { source: 'health', target: 'uidai', label: 'Health Identity Proofing', description: 'Attests ABHA health records against authoritative Aadhaar demographic proofs', latency: '49ms', code: 'TLS 200 OK' },
];

export function InteroperabilityDataFlow() {
  const [activeEdge, setActiveEdge] = useState<number>(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('citizen');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showExplainer, setShowExplainer] = useState<boolean>(true);
  const [isTestingPing, setIsTestingPing] = useState<boolean>(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const [telemetryLogs, setTelemetryLogs] = useState<Array<{ time: string; text: string; tag: string; latency: string }>>([
    { time: '12:00:01', text: 'UIDAI e-KYC: Demographic verification completed (NIST IAL-3)', tag: 'UIDAI', latency: '42ms' },
    { time: '12:00:03', text: 'DigiLocker: Class 10/12 Marksheet fetched with X.509 signature', tag: 'DigiLocker', latency: '88ms' },
    { time: '12:00:05', text: 'PFMS/DBT: Aadhaar-seeded bank account validated for PM-KISAN subsidy', tag: 'DBT', latency: '62ms' },
  ]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveEdge((prev) => {
        const nextIdx = (prev + 1) % EDGES.length;
        const currentEdge = EDGES[nextIdx];
        const sourceNode = NODES.find(n => n.id === currentEdge.source);
        const targetNode = NODES.find(n => n.id === currentEdge.target);

        const newLog = {
          time: new Date().toLocaleTimeString(),
          text: `${sourceNode?.label} ➔ ${targetNode?.label}: ${currentEdge.label} (${currentEdge.description})`,
          tag: targetNode?.id.toUpperCase() || 'NET',
          latency: currentEdge.latency
        };

        setTelemetryLogs((logs) => [newLog, ...logs.slice(0, 5)]);
        return nextIdx;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Derive selected node dynamically
  const activeSelectedNode = NODES.find(n => n.id === selectedNodeId) || NODES[0];

  const activeEdgeData = EDGES[activeEdge] || EDGES[0];
  const activeSource = NODES.find(n => n.id === activeEdgeData.source);
  const activeTarget = NODES.find(n => n.id === activeEdgeData.target);

  const handleTestHandshake = (node: NodeDetail) => {
    setIsTestingPing(true);
    setPingResult(null);
    setTimeout(() => {
      setIsTestingPing(false);
      setPingResult(`HTTP 200 OK • Handshake verified with ${node.fullName} (${node.latency}) • Protocol: ${node.protocol} • Signature: Cryptographically Validated.`);
    }, 600);
  };

  return (
    <div className="bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl dark:shadow-2xl overflow-hidden relative transition-colors duration-300">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 dark:bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* ─── Header & High-Level Purpose ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 relative z-10">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-500/30 shrink-0">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Federated Government API Exchange</h2>
              <span className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Live Mesh Connected
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Authoritative real-time data bridge connecting India's national registries without duplicating citizen data or requiring physical paperwork.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowExplainer(!showExplainer)}
            className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 transition"
          >
            <Info className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            {showExplainer ? 'Hide Guide' : 'How It Works'}
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-600/20 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/40 transition"
            title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <Pause className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
            {isPaused ? 'Resume Flow' : 'Pause Flow'}
          </button>
        </div>
      </div>

      {/* ─── "How It Works in Plain English" Explainer Box ─── */}
      {showExplainer && (
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-indigo-500/20 rounded-xl relative z-10 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-500 dark:text-amber-400">⚡</span>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              How This Works for Every Citizen (Zero-Paperwork Architecture)
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs mb-1">
                <span className="w-5 h-5 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center text-[10px]">1</span>
                One-Click Citizen Consent
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                When you apply for a scheme, you give explicit, time-bound consent for JanSetu to query only the necessary records on your behalf.
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs mb-1">
                <span className="w-5 h-5 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center text-[10px]">2</span>
                Encrypted Real-Time Query
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                JanSetu queries UIDAI (Identity), DigiLocker (Certificates), and PFMS (Bank Account) in parallel across secure mTLS government channels.
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-1">
                <span className="w-5 h-5 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center text-[10px]">3</span>
                Instant Proof (0 Paperwork)
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Your credentials are cryptographically verified in milliseconds. No photocopies, no notary queues, and zero central storage risks.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Real-Time Architecture Metrics Bar ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-medium">Security Protocol</p>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-200">AES-256 / TLS 1.3</p>
          </div>
        </div>

        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-medium">Mesh Avg Latency</p>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-200">~56ms (Real-Time)</p>
          </div>
        </div>

        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-medium">Data Standards</p>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-200">NDEF / JSON-LD</p>
          </div>
        </div>

        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-medium">Privacy Protection</p>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-200">DPDP Act 2023</p>
          </div>
        </div>
      </div>

      {/* ─── Interactive Visual Topology Canvas ─── */}
      <div className="relative w-full h-[480px] bg-slate-100 dark:bg-slate-950/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 overflow-hidden shadow-inner transition-colors">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-15 dark:opacity-10 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* SVG connection lines with active glowing animations */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minHeight: '480px' }}>
          {EDGES.map((edge, idx) => {
            const sourceNode = NODES.find(n => n.id === edge.source);
            const targetNode = NODES.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const isAct = activeEdge === idx;

            return (
              <g key={idx}>
                {/* Background Line */}
                <line
                  x1={`${sourceNode.x}%`}
                  y1={`${sourceNode.y}%`}
                  x2={`${targetNode.x}%`}
                  y2={`${targetNode.y}%`}
                  stroke={isAct ? "#f59e0b" : "#94a3b8"}
                  strokeOpacity={isAct ? 1 : 0.4}
                  strokeWidth={isAct ? 2.5 : 1.2}
                  strokeDasharray={isAct ? "6 6" : "3 3"}
                  className="transition-all duration-500"
                />

                {/* Animated glowing packet pulse on active line */}
                {isAct && (
                  <circle r="5" fill="#f59e0b" className="filter drop-shadow-[0_0_8px_#f59e0b]">
                    <animate
                      attributeName="r"
                      values="4;7;4"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* Center Live Exchange Activity Banner */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-slate-900/90 border border-amber-500/40 px-4 py-2 rounded-xl shadow-lg dark:shadow-2xl backdrop-blur-md z-20 flex items-center gap-3">
          <div className="p-1.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg animate-pulse">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Live Exchange:</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-300">{activeEdgeData.label}</span>
              <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-500/30">
                {activeEdgeData.code} ({activeEdgeData.latency})
              </span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
              {activeSource?.label} ➔ {activeTarget?.label} • {activeEdgeData.description}
            </p>
          </div>
        </div>

        {/* Interactive Nodes Layer */}
        {NODES.map((node) => {
          const Icon = node.icon;
          const isSelected = selectedNodeId === node.id;
          const isActivelyExchanging = activeSource?.id === node.id || activeTarget?.id === node.id;
          const isCenter = node.id === 'citizen';

          return (
            <div
              key={node.id}
              onClick={() => {
                setSelectedNodeId(node.id);
                setPingResult(null);
              }}
              className={`absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-10 group`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              {/* Pulsing indicator ring */}
              {isActivelyExchanging && (
                <div className="absolute -inset-3 rounded-2xl bg-amber-500/20 animate-ping pointer-events-none" />
              )}

              {/* Node Card Box */}
              <div className={`p-3 rounded-2xl border backdrop-blur-xl shadow-md dark:shadow-2xl transition-all duration-300 flex flex-col items-center text-center ${
                isCenter
                  ? 'w-48 bg-white dark:bg-slate-900 border-amber-500/60 shadow-amber-500/10 dark:shadow-amber-500/20'
                  : 'w-44 bg-white/95 dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800/90'
              } ${
                isSelected
                  ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 border-indigo-500 dark:border-indigo-400 scale-105 shadow-xl'
                  : isActivelyExchanging
                  ? `${node.borderActive} ${node.bgActive} scale-102`
                  : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-600'
              }`}>
                
                {/* Node Top Header */}
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    {node.latency}
                  </span>
                  <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {node.id.toUpperCase()}
                  </span>
                </div>

                {/* Node Icon */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-1.5 transition-all ${
                  isActivelyExchanging ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-white'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Node Label & Department */}
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-amber-300 transition-colors">
                  {node.label}
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {node.department}
                </span>

                {/* Click hint pill */}
                <span className={`mt-2 text-[8px] font-semibold px-2 py-0.5 rounded-full border transition ${
                  isSelected 
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/25 border-indigo-200 dark:border-indigo-500/30'
                }`}>
                  {isSelected ? 'Viewing Details Below' : 'Click to inspect'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Dedicated Node Selector Tab Bar ─── */}
      <div className="mt-5 p-2 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-3 py-1.5 mb-2">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            Select Government Registry to Inspect:
          </span>
          <span className="text-[10px] text-slate-500">
            Active: <strong className="text-indigo-600 dark:text-indigo-400">{activeSelectedNode.fullName}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {NODES.map((node) => {
            const isSel = selectedNodeId === node.id;
            const Icon = node.icon;

            return (
              <button
                key={node.id}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  setPingResult(null);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSel
                    ? 'bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-white/60 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className={`p-1.5 rounded-lg ${isSel ? node.color + ' bg-indigo-50 dark:bg-indigo-950/40' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded ${
                    isSel ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'text-slate-400'
                  }`}>
                    {node.latency}
                  </span>
                </div>
                <div>
                  <p className={`text-xs font-bold ${isSel ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-300'}`}>
                    {node.label}
                  </p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                    {node.ministry}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Selected Node Deep Inspector Panel ─── */}
      <div className="mt-3 p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-indigo-500/40 rounded-2xl relative z-30 shadow-lg dark:shadow-2xl transition-colors">
        
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm ${activeSelectedNode.color}`}>
              {React.createElement(activeSelectedNode.icon, { className: 'w-7 h-7' })}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{activeSelectedNode.fullName}</h3>
                <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-[10px] px-2 py-0.5 rounded font-mono font-medium">
                  {activeSelectedNode.protocol}
                </span>
                <span className="bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  Uptime: {activeSelectedNode.uptime}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {activeSelectedNode.department} • <span className="text-slate-700 dark:text-slate-300 font-medium">{activeSelectedNode.ministry}</span>
              </p>
            </div>
          </div>

          {/* Test Handshake Ping Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleTestHandshake(activeSelectedNode)}
              disabled={isTestingPing}
              className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg shadow-sm font-medium transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingPing ? 'animate-spin' : ''}`} />
              {isTestingPing ? 'Pinging Node...' : `Test ${activeSelectedNode.label} Handshake`}
            </button>
          </div>
        </div>

        {/* Test Ping Feedback Result */}
        {pingResult && (
          <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-mono text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{pingResult}</span>
          </div>
        )}

        {/* 4 Distinct Information Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-xs">
          
          {/* Column 1: Core Description & Mission */}
          <div className="p-3.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-2">
                <Info className="w-3.5 h-3.5" /> Department Mission
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                {activeSelectedNode.description}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-500 font-medium">Compliance:</span>
              <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-300">{activeSelectedNode.complianceCert}</p>
            </div>
          </div>

          {/* Column 2: Key Responsibilities (Unique per node) */}
          <div className="p-3.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mb-2">
              <Layers className="w-3.5 h-3.5" /> Key Responsibilities
            </span>
            <ul className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
              {activeSelectedNode.keyResponsibilities.map((resp, rIdx) => (
                <li key={rIdx} className="flex items-start gap-1.5">
                  <span className="text-indigo-500 font-bold shrink-0">✓</span>
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: What It Solves For The Citizen */}
          <div className="p-3.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Practical Citizen Impact
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                {activeSelectedNode.citizenBenefit}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-500 font-medium">API Endpoint:</span>
              <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 truncate">{activeSelectedNode.sampleEndpoint}</p>
            </div>
          </div>

          {/* Column 4: Exchanged Authoritative Data Fields */}
          <div className="p-3.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1 mb-2">
              <KeyRound className="w-3.5 h-3.5" /> Authoritative Data Fields
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {activeSelectedNode.exchangedDataFields.map((field, fIdx) => (
                <div key={fIdx} className="p-1.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-[10px]">
                  <div className="flex items-center justify-between font-mono font-bold text-slate-800 dark:text-slate-200">
                    <span>{field.field}</span>
                    <span className="text-[9px] text-slate-500 font-normal">{field.type}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[9px]">{field.purpose}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ─── Live Telemetry Stream Feed ─── */}
      <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800/80 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-300">
            <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-pulse" />
            Live Government Registry Telemetry Stream
          </div>
          <span className="text-[10px] text-slate-500 font-mono">WebSocket: ws://jan-setu.gov.in/telemetry</span>
        </div>

        <div className="space-y-1.5 font-mono text-[11px] max-h-28 overflow-y-auto pr-1">
          {telemetryLogs.map((log, lIdx) => (
            <div key={lIdx} className="flex items-center justify-between text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition py-0.5 border-b border-slate-200 dark:border-slate-900">
              <div className="flex items-center gap-2 truncate mr-2">
                <span className="text-slate-400 dark:text-slate-600">[{log.time}]</span>
                <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded text-[9px] font-bold">{log.tag}</span>
                <span className="truncate">{log.text}</span>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold shrink-0">{log.latency}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default InteroperabilityDataFlow;
