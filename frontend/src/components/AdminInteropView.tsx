'use client';

import React, { useState, useMemo } from 'react';
import { Radio, Database, Shield, Server, ArrowRight, Activity, ArrowRightLeft, ArrowDownCircle, Network } from 'lucide-react';
import { ExceptionCenter } from './ExceptionCenter';
import { InteroperabilityDataFlow } from './InteroperabilityDataFlow';
import { useLanguage } from '@/context/LanguageContext';

interface Props {}

export const AdminInteropView = () => {
  const { t } = useLanguage();
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'topology' | 'registry' | 'exceptions'>('topology');

  const mockNodes = useMemo(() => [
    { id: 'citizen', label: 'Citizen Web/Mobile Client', type: 'client', status: 'Active', protocol: 'HTTPS / TLS 1.3', latency: '24ms', successRate: '99.9%', demo: false },
    { id: 'consent', label: 'DPDP Electronic Consent Manager', type: 'security', status: 'Active', protocol: 'OAuth 2.0 / JWT', latency: '42ms', successRate: '100%', demo: false },
    { id: 'gateway', label: 'JanSetu Core Interop Gateway', type: 'core', status: 'Active', protocol: 'JSON-LD / gRPC', latency: '12ms', successRate: '99.95%', demo: false },
    { id: 'mca', label: 'MCA21 Company Registry', type: 'external', status: 'Active', protocol: 'SOAP 1.2 XML', latency: '180ms', successRate: '98.5%', demo: true },
    { id: 'uidai', label: 'UIDAI Aadhaar e-KYC', type: 'external', status: 'Active', protocol: 'REST v2 / Base64 XML', latency: '65ms', successRate: '99.8%', demo: false },
    { id: 'municipal', label: 'State & Municipal Registry', type: 'external', status: 'Active', protocol: 'ISO-8583 / REST', latency: '210ms', successRate: '96.2%', demo: true },
  ], []);

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

      {viewMode === 'registry' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xs p-6 space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('adminInterop.reusableRegistry', 'Standardized Connector Catalog')}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{t('adminInterop.reusableRegistryDesc', 'Plug-and-play adapter bindings across central and state government registries.')}</p>
            </div>
            <button className="bg-[#0B2545] hover:bg-[#133E87] dark:bg-pink-600 dark:hover:bg-pink-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition shadow-sm">
              {t('adminInterop.registerNew', '+ Register Connector')}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockNodes.filter((n: any) => n.type === 'external').map((node: any) => (
              <div key={node.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-3 shadow-2xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t('adminInterop.deptConnector', 'Department Gateway')}</span>
                    <h3 className="font-bold text-slate-900 dark:text-slate-200 mt-0.5 text-sm">
                      {node.id === 'mca' ? t('adminInterop.nodeMca', 'Ministry of Corporate Affairs') : 
                       node.id === 'uidai' ? t('adminInterop.nodeUidai', 'UIDAI Aadhaar e-KYC Node') : 
                       node.id === 'municipal' ? t('adminInterop.nodeMunicipal', 'Urban Local Body Municipal Node') : node.label}
                    </h3>
                  </div>
                  <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-emerald-300 dark:border-emerald-800">
                    {node.status === 'Active' ? t('adminInterop.statusActive', 'Active') : t('adminInterop.statusSimulated', 'Simulated')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">{t('adminInterop.protocol', 'Ingest Protocol')}</span>
                    <span className="font-mono text-slate-900 dark:text-slate-300 font-bold">{node.protocol}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">{t('adminInterop.avgLatency', 'Avg Latency')}</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{node.latency}</span>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button className="text-[#133E87] dark:text-pink-400 hover:underline text-[11px] font-bold">
                    {t('adminInterop.configEndpoints', 'Configure Endpoints →')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'exceptions' && (
        <div className="animate-fadeIn">
          <ExceptionCenter />
        </div>
      )}

      {viewMode === 'topology' && (
        <div className="space-y-6 animate-fadeIn">

          {/* Comparison Card: Before vs After JanSetu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-6 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">{t('adminInterop.withoutJansetu', 'Without Unified Interoperability')}</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <UserIcon /> <ArrowRight className="w-3.5 h-3.5 text-slate-400" /> 
                  <span className="font-medium">{t('adminInterop.portalA', 'Portal A (e-District)')}</span> <ArrowRight className="w-3.5 h-3.5 text-slate-400" /> 
                  <span className="text-slate-500 italic">Submit Identity Docs</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <UserIcon /> <ArrowRight className="w-3.5 h-3.5 text-slate-400" /> 
                  <span className="font-medium">{t('adminInterop.portalB', 'Portal B (Trade License)')}</span> <ArrowRight className="w-3.5 h-3.5 text-slate-400" /> 
                  <span className="text-slate-500 italic">Submit Same Docs Again</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('adminInterop.withoutDesc', 'Citizens face redundant KYC checks and disjointed departmental requirements.')}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-6 shadow-2xs space-y-3 relative overflow-hidden">
              <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{t('adminInterop.withJansetu', 'With JanSetu NDEF Interop Hub')}</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-900 dark:text-white bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <UserIcon /> <ArrowRight className="w-3.5 h-3.5 text-[#133E87] dark:text-blue-400" /> 
                    <span className="font-bold">{t('adminInterop.jansetuGateway', 'JanSetu Unified Golden Record')}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">{t('adminInterop.oneTimeVerif', '1-Time Attestation')}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-center text-[10px] font-bold text-slate-700 dark:text-slate-300">UIDAI API</div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-center text-[10px] font-bold text-slate-700 dark:text-slate-300">Parivahan SOAP</div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-center text-[10px] font-bold text-slate-700 dark:text-slate-300">DigiLocker JSON-LD</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('adminInterop.withDesc', 'Zero redundant submissions. Canonical schemas transform data on-the-fly.')}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <InteroperabilityDataFlow />
          </div>

          {/* Interactive Topology Diagram */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row relative mt-8">
            
            {/* Canvas Area */}
            <div className="flex-1 p-8 relative min-h-[400px] border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-50/70 dark:bg-[#05050a] overflow-x-auto">
              <div className="absolute inset-0 opacity-10 dark:opacity-20" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              
              <div className="relative z-10 flex flex-col items-center gap-8 min-w-[360px] max-w-xl mx-auto py-4">
                {/* Top Row: Client */}
                <NodeButton node={mockNodes[0]} t={t} onClick={() => setSelectedNode(mockNodes[0])} selected={selectedNode?.id === 'citizen'} />
                
                <div className="w-px h-8 bg-gradient-to-b from-blue-500 to-amber-500 relative">
                  <div className="absolute inset-0 animate-pulse bg-blue-400 blur-[2px]" />
                </div>

                {/* Middle Row: Security & Core */}
                <div className="flex items-center gap-12">
                  <NodeButton node={mockNodes[1]} t={t} onClick={() => setSelectedNode(mockNodes[1])} selected={selectedNode?.id === 'consent'} />
                  <div className="h-px w-12 bg-amber-500 relative"><div className="absolute inset-0 animate-pulse bg-amber-400 blur-[2px]" /></div>
                  <NodeButton node={mockNodes[2]} t={t} onClick={() => setSelectedNode(mockNodes[2])} selected={selectedNode?.id === 'gateway'} />
                </div>

                <div className="flex w-full justify-between px-16 relative">
                   <svg className="absolute inset-0 w-full h-12" style={{ top: 0, left: 0 }}>
                     <path d="M 50% 0 L 15% 100%" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-[dash_1s_linear_infinite]" />
                     <path d="M 50% 0 L 50% 100%" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-[dash_1s_linear_infinite]" />
                     <path d="M 50% 0 L 85% 100%" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-[dash_1s_linear_infinite]" />
                   </svg>
                </div>

                {/* Bottom Row: External Services */}
                <div className="flex items-center justify-between w-full mt-4">
                  <NodeButton node={mockNodes[3]} t={t} onClick={() => setSelectedNode(mockNodes[3])} selected={selectedNode?.id === 'mca'} />
                  <NodeButton node={mockNodes[4]} t={t} onClick={() => setSelectedNode(mockNodes[4])} selected={selectedNode?.id === 'uidai'} />
                  <NodeButton node={mockNodes[5]} t={t} onClick={() => setSelectedNode(mockNodes[5])} selected={selectedNode?.id === 'municipal'} />
                </div>
              </div>
              
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes dash { to { stroke-dashoffset: -8; } }
              `}} />
            </div>

            {/* Node Inspection Panel (Desktop) */}
            <div className="hidden md:flex w-80 bg-white dark:bg-slate-950 p-6 flex-col border-l border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{t('adminInterop.nodeInspector', 'Node Inspector')}</h3>
              
              {!selectedNode ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70 space-y-2">
                  <Radio className="w-8 h-8 text-slate-400 mb-1 animate-pulse" />
                  <p className="text-xs text-slate-500">{t('adminInterop.clickNode', 'Click any node to inspect telemetry.')}</p>
                </div>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  <NodeTelemetry selectedNode={selectedNode} t={t} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Extracted Telemetry View Component
const NodeTelemetry = ({ selectedNode, t }: { selectedNode: any, t: any }) => {
  return (
    <>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border border-emerald-300 dark:border-emerald-800">
            {selectedNode.status}
          </span>
        </div>
        <h4 className="text-base font-bold text-slate-900 dark:text-white">
          {selectedNode.label}
        </h4>
        <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: net.{selectedNode.id}.jansetu.gov</p>
      </div>

      <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl text-xs">
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Protocol</span>
          <span className="text-slate-900 dark:text-white font-mono font-bold">{selectedNode.protocol}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Latency</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">{selectedNode.latency}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Success Rate</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">{selectedNode.successRate}</span>
        </div>
      </div>
    </>
  );
};

// Helper Components
const UserIcon = () => <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">CZ</div>;

const NodeButton = ({ node, onClick, selected, t }: { node: any, onClick: () => void, selected: boolean, t: any }) => {
  const getIcon = () => {
    if (node.type === 'client') return <div className="w-5 h-5 rounded-full bg-blue-500/20 text-[#133E87] dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">UI</div>;
    if (node.type === 'security') return <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    if (node.type === 'core') return <Activity className="w-5 h-5 text-pink-600 dark:text-pink-400" />;
    return <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
  };

  const getColors = () => {
    if (selected) return 'bg-blue-50 dark:bg-slate-800 border-blue-600 dark:border-white shadow-md';
    if (node.type === 'core') return 'bg-white dark:bg-slate-900 border-pink-400/60 dark:border-pink-500/50 hover:border-pink-500';
    if (node.type === 'security') return 'bg-white dark:bg-slate-900 border-amber-400/60 dark:border-amber-500/50 hover:border-amber-500';
    return 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-slate-400';
  };

  return (
    <button 
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${getColors()} w-28 h-22 z-20 shadow-2xs cursor-pointer`}
    >
      {getIcon()}
      <span className="text-[10px] font-bold text-slate-900 dark:text-slate-200 text-center leading-tight">
        {node.id === 'mca' ? 'MCA21 Registry' :
         node.id === 'uidai' ? 'UIDAI Aadhaar' :
         node.id === 'municipal' ? 'Municipal Node' :
         node.label}
      </span>
      {node.demo && <div className="absolute -bottom-2 bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 rounded uppercase">DEMO</div>}
    </button>
  );
};

export default AdminInteropView;
