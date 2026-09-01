'use client';

import React, { useEffect, useState } from 'react';
import { IndiaMap } from './IndiaMap';
import { useLanguage } from '@/context/LanguageContext';

interface AmbientParticle {
  id: number;
  x: number; // percentage
  y: number; // percentage
  size: number;
  duration: number;
  delay: number;
}

export function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const { t } = useLanguage();
  const [stage, setStage] = useState<'particles' | 'lines' | 'illuminate' | 'network' | 'logo' | 'tagline' | 'fadeout'>('particles');
  const [scale, setScale] = useState(0.82);
  const [ambientParticles, setAmbientParticles] = useState<AmbientParticle[]>([]);

  // Generate random ambient particles on mount
  useEffect(() => {
    const list: AmbientParticle[] = [];
    for (let i = 0; i < 30; i++) {
      list.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        duration: Math.random() * 4 + 3,
        delay: Math.random() * 2
      });
    }
    setAmbientParticles(list);
  }, []);

  // Timeline sequence (exactly 8.8 seconds total)
  useEffect(() => {
    const timers = [
      // 1.2s: start drawing lines
      setTimeout(() => {
        setStage('lines');
        setScale(0.85);
      }, 1200),
      
      // 2.5s: illuminate & reveal nodes
      setTimeout(() => {
        setStage('illuminate');
      }, 2500),
      
      // 4.0s: travel network sweep wave
      setTimeout(() => {
        setStage('network');
      }, 4000),
      
      // 5.5s: bright map, zoom-in, logo reveal
      setTimeout(() => {
        setStage('logo');
        setScale(0.92); // subtle push-in
      }, 5500),
      
      // 6.7s: tagline fade in
      setTimeout(() => {
        setStage('tagline');
      }, 6700),
      
      // 7.8s: fade out intro
      setTimeout(() => {
        setStage('fadeout');
      }, 7800),
      
      // 8.8s: complete intro, transition to login
      setTimeout(() => {
        onComplete();
      }, 8800)
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Geographically accurate capital nodes in viewBox 0 0 612 696
  const nodes = [
    { name: 'Delhi', x: 188, y: 205 },
    { name: 'Jaipur', x: 150, y: 240 },
    { name: 'Mumbai', x: 120, y: 430 },
    { name: 'Bengaluru', x: 190, y: 560 },
    { name: 'Kolkata', x: 350, y: 310 },
    { name: 'Guwahati', x: 480, y: 260 }
  ];

  const showLines = stage !== 'particles';
  const showNodes = stage === 'illuminate' || stage === 'network' || stage === 'logo' || stage === 'tagline';
  const showNetwork = stage === 'network' || stage === 'logo' || stage === 'tagline';
  const showLogo = stage === 'logo' || stage === 'tagline';
  const showTagline = stage === 'tagline';

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020205] transition-opacity duration-1000 ${stage === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Subtle ambient radial background glow */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full transition-all duration-[2500ms] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.04) 0%, rgba(59, 130, 246, 0.03) 50%, transparent 100%)',
          filter: 'blur(50px)',
          opacity: showNodes ? 1 : 0,
          transform: `scale(${scale * 1.2})`
        }}
      />

      {/* Floating particles in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        {ambientParticles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-white/20"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animation: `floatAmbient ${p.duration}s infinite linear`,
              animationDelay: `${p.delay}s`
            }}
          />
        ))}
      </div>

      {/* Main Map Container */}
      <div 
        className="relative w-[340px] h-[380px] sm:w-[420px] sm:h-[480px] transition-all duration-[2000ms] ease-out flex items-center justify-center"
        style={{
          transform: `scale(${scale})`
        }}
      >
        {/* Render Geographically Accurate India Map */}
        <IndiaMap stage={stage === 'particles' ? 'particles' : stage === 'lines' ? 'lines' : 'illuminate'} className="absolute inset-0" />

        {/* Custom SVG Overlay for nodes, network waves, and travelling pulses */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 612 696">
          {/* Light wave sweep (travels across the map outline) */}
          {showNetwork && (
            <circle r="400" fill="none" stroke="url(#sweepGrad)" strokeWidth="4" className="animate-sweep" style={{ transformOrigin: 'center' }} />
          )}

          {/* Travelling light pulses along network lines */}
          {showNetwork && (
            <>
              {/* Pulse 1: Mumbai to Bengaluru */}
              <circle r="2" fill="#ffd700" style={{ animation: 'pulseTravel 2s infinite linear' }}>
                <animateMotion path="M 120 430 L 190 560" dur="1.8s" repeatCount="indefinite" />
              </circle>
              {/* Pulse 2: Delhi to Jaipur */}
              <circle r="2" fill="#3b82f6" style={{ animation: 'pulseTravel 2.5s infinite linear' }}>
                <animateMotion path="M 188 205 L 150 240" dur="1.5s" repeatCount="indefinite" />
              </circle>
              {/* Pulse 3: Kolkata to Delhi */}
              <circle r="2" fill="#ffffff" style={{ animation: 'pulseTravel 3s infinite linear' }}>
                <animateMotion path="M 350 310 L 188 205" dur="2.2s" repeatCount="indefinite" />
              </circle>
            </>
          )}

          <defs>
            <radialGradient id="sweepGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffd700" stopOpacity="0" />
              <stop offset="85%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        {/* Geographic City Nodes */}
        {showNodes && nodes.map((node, idx) => (
          <div
            key={node.name}
            className="absolute transition-opacity duration-1000"
            style={{
              left: `${(node.x / 612) * 100}%`,
              top: `${(node.y / 696) * 100}%`,
              transform: 'translate(-50%, -50%)',
              opacity: 1,
              transitionDelay: `${idx * 150}ms`
            }}
          >
            {/* Pulsing Outer Aura */}
            <div className="absolute w-4 h-4 rounded-full bg-blue-500/20 animate-ping -translate-x-1.5 -translate-y-1.5" />
            {/* Glowing Inner Dot */}
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(59,130,246,1),_0_0_3px_rgba(249,115,22,1)]" />
          </div>
        ))}
      </div>

      {/* Typography: Logo & Tagline */}
      <div className="absolute bottom-20 flex flex-col items-center gap-2.5 text-center px-6">
        <h2 
          className="text-4xl font-extrabold tracking-[0.25em] text-white font-sans transition-all duration-[1200ms] flex items-center justify-center gap-1"
          style={{
            opacity: showLogo ? 1 : 0,
            transform: showLogo ? 'translateY(0)' : 'translateY(15px)'
          }}
        >
          <span className="text-[#f97316]">J</span>
          <span>AN</span>
          <span className="text-[#3b82f6]">S</span>
          <span>ETU</span>
        </h2>
        
        <p 
          className="text-slate-400 text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-[1250ms]"
          style={{
            opacity: showTagline ? 1 : 0,
            transform: showTagline ? 'translateY(0)' : 'translateY(10px)'
          }}
        >
          {t('Your Journey. Simplified.', 'Your Journey. Simplified.')}
        </p>
      </div>

      {/* Intro Keyframe animations */}
      <style>{`
        @keyframes floatAmbient {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-100px) translateX(15px); opacity: 0; }
        }
        @keyframes pulseTravel {
          0% { opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes sweep {
          0% { transform: scale(0.1); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .animate-sweep {
          animation: sweep 3s infinite ease-out;
        }
      `}</style>
    </div>
  );
}
