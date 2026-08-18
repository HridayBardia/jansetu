'use client';

import React from 'react';

interface JanSetuLogoProps {
  variant?: 'full' | 'compact';
  size?: 'sm' | 'md' | 'lg';
}

export const JanSetuLogo: React.FC<JanSetuLogoProps> = ({
  variant = 'full',
  size = 'md'
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className="inline-flex items-center gap-2.5 group cursor-pointer select-none">
      {/* Symbol: Setu (Bridge) + AI Node */}
      <div className={`relative ${iconSizes[size]} rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-emerald-500 p-[1.5px] shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition duration-300`}>
        <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden relative">
          {/* Subtle grid background inside logo */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:6px_6px]" />
          
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-3/4 h-3/4 text-amber-400 z-10 group-hover:scale-105 transition duration-300"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Arch/Bridge curves (Setu) */}
            <path d="M3 17C7 10 17 10 21 17" stroke="url(#logo-grad)" strokeWidth="2.5" />
            <path d="M6 17v-3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 17v-6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M18 17v-3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 17h20" stroke="currentColor" strokeWidth="2" />
            {/* AI Sparkle / Node atop the bridge */}
            <circle cx="12" cy="7" r="2" fill="#10b981" />
            <path d="M12 3v2" stroke="#10b981" strokeWidth="1.5" />
            <path d="M12 9v1" stroke="#10b981" strokeWidth="1.5" />
            <defs>
              <linearGradient id="logo-grad" x1="3" y1="10" x2="21" y2="17" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f59e0b" />
                <stop offset="0.5" stopColor="#f97316" />
                <stop offset="1" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {variant === 'full' && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight ${textSizes[size]} text-white group-hover:text-amber-400 transition`}>
              JanSetu
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
              जनसेतु
            </span>
          </div>
          <span className="text-[9px] font-semibold tracking-wider uppercase text-slate-400 -mt-0.5">
            Pan-India AI Navigator
          </span>
        </div>
      )}
    </div>
  );
};
