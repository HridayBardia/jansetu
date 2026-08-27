'use client';

import React, { useState, useEffect } from 'react';
import { Network, Activity, Server, Database, ShieldCheck, Zap } from 'lucide-react';

const NODES = [
  { id: 'citizen', label: 'Citizen Portal', x: 50, y: 50, icon: UserIcon },
  { id: 'uidai', label: 'UIDAI (Identity)', x: 80, y: 20, icon: ShieldCheck },
  { id: 'digilocker', label: 'DigiLocker (Vault)', x: 80, y: 80, icon: Database },
  { id: 'health', label: 'Health Registry', x: 20, y: 20, icon: Activity },
  { id: 'dbt', label: 'DBT (Finance)', x: 20, y: 80, icon: Server },
];

function UserIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const EDGES = [
  { source: 'citizen', target: 'uidai', label: 'eKYC Auth' },
  { source: 'citizen', target: 'digilocker', label: 'Fetch Docs' },
  { source: 'citizen', target: 'health', label: 'ABHA Link' },
  { source: 'citizen', target: 'dbt', label: 'Account Check' },
  { source: 'uidai', target: 'dbt', label: 'Aadhaar Seeding' },
  { source: 'health', target: 'uidai', label: 'Verify ID' },
];

export function InteroperabilityDataFlow() {
  const [activeEdge, setActiveEdge] = useState<number | null>(null);

  useEffect(() => {
    // Simulate real-time API traffic
    const interval = setInterval(() => {
      setActiveEdge(Math.floor(Math.random() * EDGES.length));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
          <Network className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Federated API Exchange</h2>
          <p className="text-xs text-slate-400">Real-time interoperability telemetry across government nodes.</p>
        </div>
      </div>

      <div className="relative w-full h-[400px] bg-slate-950/50 rounded-xl border border-slate-800/50 p-4">
        {/* SVG layer for edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minHeight: '400px' }}>
          {EDGES.map((edge, idx) => {
            const sourceNode = NODES.find(n => n.id === edge.source);
            const targetNode = NODES.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const isAct = activeEdge === idx;

            return (
              <g key={idx}>
                {/* Base Line */}
                <line
                  x1={`${sourceNode.x}%`}
                  y1={`${sourceNode.y}%`}
                  x2={`${targetNode.x}%`}
                  y2={`${targetNode.y}%`}
                  stroke={isAct ? "#fbbf24" : "#334155"}
                  strokeWidth={isAct ? 2 : 1}
                  strokeDasharray="4 4"
                  className="transition-colors duration-500"
                />
                
                {/* Animated Packet */}
                {isAct && (
                  <circle r="4" fill="#fbbf24" className="shadow-lg shadow-amber-500">
                    <animateMotion
                      dur="1s"
                      repeatCount="2"
                      path={`M ${sourceNode.x * (typeof window !== 'undefined' ? window.innerWidth / 100 : 10)} ${sourceNode.y * 4} L ${targetNode.x * (typeof window !== 'undefined' ? window.innerWidth / 100 : 10)} ${targetNode.y * 4}`}
                      keyPoints="0;1"
                      keyTimes="0;1"
                      calcMode="linear"
                    >
                      <mpath href={`#path-${idx}`} />
                    </animateMotion>
                  </circle>
                )}
                {/* Invisible path for animation */}
                <path
                  id={`path-${idx}`}
                  d={`M ${sourceNode.x}% ${sourceNode.y}% L ${targetNode.x}% ${targetNode.y}%`}
                  fill="none"
                />
              </g>
            );
          })}
        </svg>

        {/* Nodes Layer */}
        {NODES.map((node) => {
          const Icon = node.icon;
          const isActive = EDGES.findIndex(e => e.source === node.id || e.target === node.id) === activeEdge ||
                           EDGES.findIndex(e => e.source === node.id || e.target === node.id) === activeEdge;
          
          return (
            <div
              key={node.id}
              className={`absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 z-10 ${isActive ? 'scale-110' : 'scale-100'}`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border backdrop-blur-md shadow-xl transition-colors duration-300 ${isActive ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-amber-500/20' : 'bg-slate-800/80 border-slate-700 text-slate-300'}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="mt-2 text-[10px] font-bold text-slate-300 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-800/80 whitespace-nowrap">
                {node.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Active telemetry log */}
      <div className="mt-4 p-3 bg-slate-950/80 rounded-lg border border-slate-800/50 flex items-center gap-3">
        <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
        <span className="text-xs font-mono text-slate-400">
          {activeEdge !== null ? 
            `[${new Date().toLocaleTimeString()}] HTTP 200 OK - Exchange: ${EDGES[activeEdge].label} from ${NODES.find(n => n.id === EDGES[activeEdge].source)?.label} to ${NODES.find(n => n.id === EDGES[activeEdge].target)?.label}` 
            : 'Awaiting telemetry...'}
        </span>
      </div>
    </div>
  );
}
