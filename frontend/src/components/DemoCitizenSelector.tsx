'use client';

import React, { useState, useEffect } from 'react';
import { selectDemoCitizenAPI } from '@/lib/api';
import { UserCheck, ShieldAlert, Sparkles, MapPin, Check } from 'lucide-react';

export interface DemoCitizenSelectorProps {
  onCitizenChange?: (citizenKey: string, data: any) => void;
}

const CITIZEN_PROFILES = [
  {
    key: 'aarav',
    name: 'Hriday Bardia (Demo)',
    city: 'Vadodara',
    state: 'Gujarat',
    age: 22,
    badge: 'Business Formation',
    color: 'border-amber-500/50 bg-amber-500/10 text-amber-300'
  },
  {
    key: 'priya',
    name: 'Priya Sharma',
    city: 'Jaipur',
    state: 'Rajasthan',
    age: 27,
    badge: 'Education & Scholarship',
    color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
  },
  {
    key: 'arjun',
    name: 'Arjun Nair',
    city: 'Bengaluru',
    state: 'Karnataka',
    age: 20,
    badge: 'Tech & Business',
    color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
  }
];

export function DemoCitizenSelector({ onCitizenChange }: DemoCitizenSelectorProps) {
  const [selectedKey, setSelectedKey] = useState('aarav');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = async (key: string) => {
    setIsLoading(true);
    setSelectedKey(key);
    const result = await selectDemoCitizenAPI(key);
    setIsLoading(false);
    if (result && onCitizenChange) {
      onCitizenChange(key, result);
    }
  };

  return (
    <div className="w-full bg-slate-950/90 border-b border-amber-500/30 px-4 py-2.5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Demo Mode Header & Legal Notice */}
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-[11px] uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            DEMO MODE
          </span>
          <div className="flex items-center gap-1.5 text-xs text-amber-200/90">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden sm:inline font-medium">DEMO DATA — Synthetic documents used for demonstration.</span>
          </div>
        </div>

        {/* Right: Interactive Judge Switcher Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 md:pb-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
            Select Profile:
          </span>
          {CITIZEN_PROFILES.map((p) => {
            const isSelected = selectedKey === p.key;
            return (
              <button
                key={p.key}
                onClick={() => handleSelect(p.key)}
                disabled={isLoading}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition shrink-0 ${
                  isSelected
                    ? `${p.color} ring-1 ring-amber-400/50 shadow-md shadow-amber-500/10`
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {isSelected ? (
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>{p.name}</span>
                <span className="text-[10px] opacity-75 font-normal">({p.city}, {p.state})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
