'use client';

import React, { useEffect, useState } from 'react';

interface Point {
  id: number;
  x: number; // percentage
  y: number; // percentage
  label?: string;
}

interface Connection {
  from: number;
  to: number;
}

export function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<'particles' | 'lines' | 'illuminate' | 'text' | 'fadeout'>('particles');
  const [scale, setScale] = useState(0.85);

  // Nodes tracing a stylized India map outline
  const points: Point[] = [
    { id: 1, x: 50, y: 10, label: 'Kashmir' },
    { id: 2, x: 54, y: 11, label: 'Ladakh' },
    { id: 3, x: 53, y: 17, label: 'Himachal' },
    { id: 4, x: 45, y: 19, label: 'Punjab' },
    { id: 5, x: 38, y: 28, label: 'Rajasthan West' },
    { id: 6, x: 28, y: 40, label: 'Gujarat West' },
    { id: 7, x: 34, y: 46, label: 'Gujarat South' },
    { id: 8, x: 37, y: 55, label: 'Maharashtra Coast' },
    { id: 9, x: 39, y: 64, label: 'Goa' },
    { id: 10, x: 41, y: 72, label: 'Karnataka Coast' },
    { id: 11, x: 44, y: 81, label: 'Kerala Coast' },
    { id: 12, x: 48, y: 88, label: 'Kanyakumari' },
    { id: 13, x: 51, y: 81, label: 'Tamil Nadu East' },
    { id: 14, x: 54, y: 70, label: 'Andhra Coast' },
    { id: 15, x: 62, y: 57, label: 'Odisha Coast' },
    { id: 16, x: 69, y: 52, label: 'West Bengal' },
    { id: 17, x: 68, y: 39, label: 'Sikkim' },
    { id: 18, x: 86, y: 33, label: 'Arunachal East' },
    { id: 19, x: 84, y: 41, label: 'Nagaland' },
    { id: 20, x: 80, y: 46, label: 'Mizoram' },
    { id: 21, x: 77, y: 38, label: 'Meghalaya' },
    { id: 22, x: 64, y: 37, label: 'Bihar' },
    { id: 23, x: 56, y: 27, label: 'Uttar Pradesh North' },
    // Central Nodes
    { id: 24, x: 48, y: 44, label: 'Madhya Pradesh' },
    { id: 25, x: 57, y: 49, label: 'Chhattisgarh' },
    { id: 26, x: 63, y: 43, label: 'Jharkhand' },
    { id: 27, x: 49, y: 60, label: 'Telangana' }
  ];

  // Connections to build the network outline of India
  const connections: Connection[] = [
    { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 }, { from: 4, to: 5 },
    { from: 5, to: 6 }, { from: 6, to: 7 }, { from: 7, to: 8 }, { from: 8, to: 9 },
    { from: 9, to: 10 }, { from: 10, to: 11 }, { from: 11, to: 12 }, { from: 12, to: 13 },
    { from: 13, to: 14 }, { from: 14, to: 15 }, { from: 15, to: 16 }, { from: 16, to: 17 },
    { from: 17, to: 21 }, { from: 21, to: 18 }, { from: 18, to: 19 }, { from: 19, to: 20 },
    { from: 20, to: 21 }, { from: 21, to: 16 }, { from: 16, to: 22 }, { from: 22, to: 23 },
    { from: 23, to: 1 },
    // Center mesh
    { from: 5, to: 24 }, { from: 24, to: 25 }, { from: 25, to: 15 }, { from: 25, to: 26 },
    { from: 26, to: 16 }, { from: 26, to: 22 }, { from: 24, to: 23 }, { from: 24, to: 7 },
    { from: 24, to: 27 }, { from: 27, to: 8 }, { from: 27, to: 14 }, { from: 27, to: 10 },
    { from: 27, to: 25 }
  ];

  useEffect(() => {
    // Stage progressions (total 3.5 seconds)
    const timers = [
      setTimeout(() => setStage('lines'), 600),
      setTimeout(() => setStage('illuminate'), 1300),
      setTimeout(() => {
        setStage('text');
        setScale(0.92); // gentle camera move forward
      }, 2000),
      setTimeout(() => setStage('fadeout'), 3200),
      setTimeout(() => {
        onComplete();
      }, 3700)
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020205] transition-opacity duration-700 ${stage === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Decorative ambient radial glow */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full transition-all duration-[2000ms] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212, 163, 89, 0.05) 0%, rgba(59, 130, 246, 0.03) 50%, transparent 100%)',
          filter: 'blur(40px)',
          opacity: stage === 'illuminate' || stage === 'text' ? 1 : 0,
          transform: `scale(${scale})`
        }}
      />

      {/* Main Map Container */}
      <div 
        className="relative w-[340px] h-[380px] sm:w-[400px] sm:h-[440px] transition-all duration-[2500ms] ease-out flex items-center justify-center"
        style={{
          transform: `scale(${scale})`
        }}
      >
        {/* Constellation Canvas (SVG) */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Connection Lines */}
          {connections.map((conn, idx) => {
            const fromPt = points.find(p => p.id === conn.from);
            const toPt = points.find(p => p.id === conn.to);
            if (!fromPt || !toPt) return null;

            const isLinesVisible = stage !== 'particles';
            const isIlluminated = stage === 'illuminate' || stage === 'text';

            return (
              <line
                key={`line-${idx}`}
                x1={fromPt.x}
                y1={fromPt.y}
                x2={toPt.x}
                y2={toPt.y}
                stroke={isIlluminated ? 'url(#glowGrad)' : 'rgba(255,255,255,0.06)'}
                strokeWidth={isIlluminated ? '0.4' : '0.2'}
                className="transition-all duration-1000 ease-in-out"
                style={{
                  strokeDasharray: '100',
                  strokeDashoffset: isLinesVisible ? '0' : '100',
                  transitionDelay: `${idx * 15}ms`,
                  opacity: isLinesVisible ? 1 : 0
                }}
              />
            );
          })}

          {/* Glowing travelling light pulses */}
          {(stage === 'illuminate' || stage === 'text') && connections.slice(0, 8).map((conn, idx) => {
            const fromPt = points.find(p => p.id === conn.from);
            const toPt = points.find(p => p.id === conn.to);
            if (!fromPt || !toPt) return null;

            return (
              <circle
                key={`pulse-${idx}`}
                r="0.6"
                fill="#ffd700"
                style={{
                  animation: 'pulseTravel 3s infinite linear',
                  animationDelay: `${idx * 0.4}s`
                }}
              >
                <animateMotion
                  path={`M ${fromPt.x} ${fromPt.y} L ${toPt.x} ${toPt.y}`}
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
            );
          })}

          {/* Definitions for Gradients */}
          <defs>
            <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd700" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>

        {/* Constellation Nodes */}
        {points.map((pt) => {
          const isIlluminated = stage === 'illuminate' || stage === 'text';
          const delay = (pt.id * 30) % 600;

          return (
            <div
              key={`point-${pt.id}`}
              className="absolute transition-all duration-1000 ease-out"
              style={{
                left: `${pt.x}%`,
                top: `${pt.y}%`,
                transform: 'translate(-50%, -50%)',
                opacity: stage !== 'fadeout' ? 1 : 0,
              }}
            >
              {/* Central Dot */}
              <div 
                className="w-1.5 h-1.5 rounded-full transition-all duration-700"
                style={{
                  background: isIlluminated ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                  boxShadow: isIlluminated 
                    ? '0 0 10px #3b82f6, 0 0 4px #ffd700' 
                    : 'none',
                  animation: 'subtlePulse 2s infinite ease-in-out',
                  animationDelay: `${delay}ms`
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Logo & Tagline Title */}
      <div 
        className="absolute bottom-20 flex flex-col items-center gap-2 text-center transition-all duration-[1200ms] px-6"
        style={{
          opacity: stage === 'text' ? 1 : 0,
          transform: stage === 'text' ? 'translateY(0)' : 'translateY(15px)'
        }}
      >
        <h2 className="text-4xl font-extrabold tracking-[0.25em] text-white font-sans flex items-center justify-center gap-1">
          <span className="text-[#f97316]">J</span>
          <span>AN</span>
          <span className="text-[#3b82f6]">S</span>
          <span>ETU</span>
        </h2>
        <p className="text-slate-400 text-sm font-medium tracking-widest uppercase">
          Your Journey. Simplified.
        </p>
      </div>

      {/* Internal Custom Keyframes */}
      <style>{`
        @keyframes subtlePulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; }
        }
        @keyframes pulseTravel {
          0% { opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
