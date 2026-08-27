'use client';

import React, { useState } from 'react';
import { Radio, Database, Shield, Server, ArrowRight, Activity, ArrowRightLeft, ArrowDownCircle, Network } from 'lucide-react';
import { ExceptionCenter } from './ExceptionCenter';
import { InteroperabilityDataFlow } from './InteroperabilityDataFlow';
import { useLanguage } from '@/context/LanguageContext';

const mockNodes = [
  {
    id: 'citizen',
    label: 'Citizen Client',
    type: 'client',
    status: 'Active',
    protocol: 'HTTPS / TLS 1.3',
    latency: '45ms',
    successRate: '99.9%',
    demo: false
  },
  {
    id: 'consent',
    label: 'Consent Manager',
    type: 'security',
    status: 'Active',
    protocol: 'OAuth 2.0 / JWT',
    latency: '12ms',
    successRate: '100%',
    demo: false
  },
  {
    id: 'gateway',
    label: 'JanSetu Gateway',
    type: 'core',
    status: 'Active',
    protocol: 'gRPC / REST',
    latency: '5ms',
    successRate: '99.99%',
    demo: false
  },
  {
    id: 'mca',
    label: 'Ministry of Corp Affairs',
    type: 'external',
    status: 'Simulated',
    protocol: 'REST API',
    latency: '150ms',
    successRate: '98.5%',
    demo: true
  },
  {
    id: 'uidai',
    label: 'UIDAI (Aadhaar)',
    type: 'external',
    status: 'Simulated',
    protocol: 'REST / XML',
    latency: '200ms',
    successRate: '97.2%',
    demo: true
  },
  {
    id: 'municipal',
    label: 'Municipal Corporation',
    type: 'external',
    status: 'Simulated',
    protocol: 'SOAP Adapter',
    latency: '450ms',
    successRate: '92.1%',
    demo: true
  }
];

export const AdminInteropView = () => {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'topology' | 'registry' | 'exceptions'>('topology');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Network className="w-6 h-6 text-pink-400" />
            <span>Interoperability Gateway</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor the real-time API topology and manage reusable system connectors.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setViewMode('topology')}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewMode === 'topology' ? 'bg-pink-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Topology Map
          </button>
          <button
            onClick={() => setViewMode('registry')}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewMode === 'registry' ? 'bg-pink-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Connector Registry
          </button>
          <button
            onClick={() => setViewMode('exceptions')}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewMode === 'exceptions' ? 'bg-pink-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Exception Center
          </button>
        </div>
      </div>

      {viewMode === 'registry' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Reusable Connector Registry</h2>
              <p className="text-xs text-slate-400 mt-1">Manage modular adapters connecting legacy & modern government endpoints.</p>
            </div>
            <button className="bg-pink-500 hover:bg-pink-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm transition">
              + Register New Connector
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockNodes.filter(n => n.type === 'external').map(node => (
              <div key={node.id} className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Department Connector</span>
                    <h3 className="font-bold text-slate-200 mt-0.5">{node.label}</h3>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                    {node.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Protocol</span>
                    <span className="font-mono text-slate-300">{node.protocol}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Avg Latency</span>
                    <span className="font-mono text-slate-300">{node.latency}</span>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button className="text-pink-400 hover:text-pink-300 text-[11px] font-bold bg-pink-500/10 px-3 py-1.5 rounded">
                    Configure Endpoints
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'exceptions' && (
        <div className="animate-in fade-in">
          <ExceptionCenter />
        </div>
      )}

      {viewMode === 'topology' && (
        <div className="space-y-8 animate-in fade-in">

          {/* Without vs With JanSetu Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-4">Without JanSetu</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <UserIcon /> <ArrowRight className="w-4 h-4 text-slate-600" /> 
                  <span>Portal A</span> <ArrowRight className="w-4 h-4 text-slate-600" /> 
                  <span className="text-xs text-slate-500 italic">Submit Identity Docs</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <UserIcon /> <ArrowRight className="w-4 h-4 text-slate-600" /> 
                  <span>Portal B</span> <ArrowRight className="w-4 h-4 text-slate-600" /> 
                  <span className="text-xs text-slate-500 italic">Submit Identity Docs AGAIN</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <UserIcon /> <ArrowRight className="w-4 h-4 text-slate-600" /> 
                  <span>Portal C</span> <ArrowRight className="w-4 h-4 text-slate-600" /> 
                  <span className="text-xs text-slate-500 italic">Submit Identity Docs AGAIN</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                Citizens are forced to act as the integration layer, submitting the exact same information to disconnected portals.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-2xl" />
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 relative z-10">With JanSetu</h3>
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between text-sm text-slate-300 bg-slate-950 p-3 rounded-xl border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <UserIcon /> <ArrowRight className="w-4 h-4 text-emerald-500" /> 
                    <span className="font-bold text-white">JanSetu Gateway</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase font-bold">1-Time Verification</span>
                </div>
                <div className="flex justify-center">
                  <ArrowDownCircle className="w-5 h-5 text-emerald-500/50" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-center text-xs text-slate-400">Portal A API</div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-center text-xs text-slate-400">Portal B API</div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-center text-xs text-slate-400">Portal C API</div>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4 leading-relaxed relative z-10">
                Approved information moves securely via standardized API adapters without requiring the citizen to repeat the process.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <InteroperabilityDataFlow />
          </div>

          {/* Interactive Topology Diagram */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row relative mt-8">
            
            {/* Canvas Area */}
            <div className="flex-1 p-8 relative min-h-[400px] border-b md:border-b-0 md:border-r border-slate-800 flex items-center justify-center bg-[#05050a] overflow-x-auto">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="md:hidden absolute top-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center w-full">Tap a node for details</div>
              
              <div className="relative z-10 flex flex-col items-center gap-8 min-w-[360px] max-w-xl mx-auto py-8">
                {/* Top Row: Client */}
                <NodeButton node={mockNodes[0]} onClick={() => setSelectedNode(mockNodes[0])} selected={selectedNode?.id === 'citizen'} />
                
                <div className="w-px h-8 bg-gradient-to-b from-blue-500 to-amber-500 relative">
                  <div className="absolute inset-0 animate-pulse bg-blue-400 blur-[2px]" />
                </div>

                {/* Middle Row: Security & Core */}
                <div className="flex items-center gap-12">
                  <NodeButton node={mockNodes[1]} onClick={() => setSelectedNode(mockNodes[1])} selected={selectedNode?.id === 'consent'} />
                  <div className="h-px w-12 bg-amber-500 relative"><div className="absolute inset-0 animate-pulse bg-amber-400 blur-[2px]" /></div>
                  <NodeButton node={mockNodes[2]} onClick={() => setSelectedNode(mockNodes[2])} selected={selectedNode?.id === 'gateway'} />
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
                  <NodeButton node={mockNodes[3]} onClick={() => setSelectedNode(mockNodes[3])} selected={selectedNode?.id === 'mca'} />
                  <NodeButton node={mockNodes[4]} onClick={() => setSelectedNode(mockNodes[4])} selected={selectedNode?.id === 'uidai'} />
                  <NodeButton node={mockNodes[5]} onClick={() => setSelectedNode(mockNodes[5])} selected={selectedNode?.id === 'municipal'} />
                </div>
              </div>
              
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes dash { to { stroke-dashoffset: -8; } }
              `}} />
            </div>

            {/* Node Inspection Panel (Desktop) */}
            <div className="hidden md:flex w-80 bg-slate-950 p-6 flex-col">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Node Inspector</h3>
              
              {!selectedNode ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                  <Radio className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="text-sm text-slate-400">Click a node in the topology graph to view technical telemetry.</p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <NodeTelemetry selectedNode={selectedNode} />
                </div>
              )}
            </div>

            {/* Node Inspection Panel (Mobile Bottom Sheet) */}
            {selectedNode && (
              <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-sm p-0">
                <div className="bg-slate-900 border-t border-slate-800 rounded-t-2xl w-full max-h-[85vh] overflow-y-auto p-6 pb-safe shadow-2xl relative animate-in slide-in-from-bottom-full duration-300">
                  <button 
                    onClick={() => setSelectedNode(null)} 
                    className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-400 p-2 rounded-full transition"
                  >
                    ✕
                  </button>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Node Inspector</h3>
                  <NodeTelemetry selectedNode={selectedNode} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Extracted Telemetry View Component
const NodeTelemetry = ({ selectedNode }: { selectedNode: any }) => {
  const [logs, setLogs] = React.useState<string[]>([]);
  const [loadingLogs, setLoadingLogs] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const fetchLogs = async () => {
      if (!selectedNode?.id) return;
      setLoadingLogs(true);
      try {
        const { fetchNodeLogsAPI } = await import('@/lib/api');
        const data = await fetchNodeLogsAPI(selectedNode.id);
        if (mounted) setLogs(data);
      } catch (err) {
        if (mounted) setLogs(["[ERROR] Failed to fetch node telemetry"]);
      } finally {
        if (mounted) setLoadingLogs(false);
      }
    };
    fetchLogs();
    
    // Poll every 5 seconds
    const interval = setInterval(fetchLogs, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [selectedNode?.id]);

  return (
    <>
      <div>
        <div className="flex items-center gap-2 mb-1">
          {selectedNode.demo && <span className="bg-amber-500/20 text-amber-400 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border border-amber-500/20">Demo / Simulated</span>}
          {!selectedNode.demo && <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border border-emerald-500/20">Live System</span>}
        </div>
        <h4 className="text-lg font-bold text-white">{selectedNode.label}</h4>
        <p className="text-xs text-slate-400 font-mono mt-1">ID: net.{selectedNode.id}.jansetu.gov</p>
      </div>

      <div className="space-y-3 bg-slate-900 border border-slate-800 p-4 rounded-xl text-sm">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Status</span>
          <span className={selectedNode.status === 'Active' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{selectedNode.status}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Protocol</span>
          <span className="text-slate-200 font-mono text-xs">{selectedNode.protocol}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Latency</span>
          <span className="text-slate-200">{selectedNode.latency}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Success Rate</span>
          <span className="text-emerald-400">{selectedNode.successRate}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800">
        <h5 className="text-xs font-bold text-slate-300 mb-2">Recent Exchange Log</h5>
        <div className="bg-[#05050a] border border-slate-800 rounded p-2 font-mono text-[10px] text-slate-500 break-all h-32 overflow-y-auto">
          {loadingLogs && logs.length === 0 ? (
            <div className="flex justify-center items-center h-full">
               <span className="animate-pulse">Connecting...</span>
            </div>
          ) : (
            logs.map((log, i) => (
              <React.Fragment key={i}>
                {log}<br/>
              </React.Fragment>
            ))
          )}
        </div>
      </div>
    </>
  );
};

// Helper Components
const UserIcon = () => <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center"><UserCircleIcon /></div>;
const UserCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>;

const NodeButton = ({ node, onClick, selected }: { node: any, onClick: () => void, selected: boolean }) => {
  const getIcon = () => {
    if (node.type === 'client') return <UserCircleIcon />;
    if (node.type === 'security') return <Shield className="w-5 h-5 text-amber-400" />;
    if (node.type === 'core') return <Activity className="w-6 h-6 text-pink-400" />;
    return <Database className="w-5 h-5 text-blue-400" />;
  };

  const getColors = () => {
    if (selected) return 'bg-slate-800 border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]';
    if (node.type === 'core') return 'bg-slate-900 border-pink-500/50 hover:border-pink-400';
    if (node.type === 'security') return 'bg-slate-900 border-amber-500/50 hover:border-amber-400';
    return 'bg-slate-900 border-slate-700 hover:border-slate-500';
  };

  return (
    <button 
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${getColors()} w-28 h-24 z-20`}
    >
      {getIcon()}
      <span className="text-[10px] font-bold text-slate-300 text-center leading-tight">{node.label}</span>
      {node.demo && <div className="absolute -bottom-2 bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 rounded uppercase">DEMO</div>}
    </button>
  );
};
