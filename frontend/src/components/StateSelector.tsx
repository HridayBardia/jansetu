'use client';

import React, { useState, useEffect } from 'react';
import { fetchStatesAPI } from '@/lib/api';
import { MapPin } from 'lucide-react';

interface StateSelectorProps {
  selectedState?: string;
  onStateChange: (stateName: string) => void;
}

export const StateSelector: React.FC<StateSelectorProps> = ({
  selectedState = 'All India',
  onStateChange
}) => {
  const [states, setStates] = useState<{ code: string; name: string; is_ut: boolean }[]>([]);

  useEffect(() => {
    fetchStatesAPI().then((data) => {
      if (data && data.length > 0) {
        setStates(data);
      }
    });
  }, []);

  return (
    <div className="relative inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus-within:border-amber-500/50">
      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <select
        value={selectedState}
        onChange={(e) => onStateChange(e.target.value)}
        className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
      >
        <option value="All India" className="bg-slate-900 text-slate-200">
          All India (Central + 36 States/UTs)
        </option>
        <option value="Central" className="bg-slate-900 text-slate-200">
          Central Government Only
        </option>
        <optgroup label="States (28)" className="bg-slate-900 text-amber-400 font-bold">
          {states
            .filter((s) => !s.is_ut)
            .map((s) => (
              <option key={s.code} value={s.name} className="bg-slate-900 text-slate-200 font-normal">
                {s.name}
              </option>
            ))}
        </optgroup>
        <optgroup label="Union Territories (8)" className="bg-slate-900 text-emerald-400 font-bold">
          {states
            .filter((s) => s.is_ut)
            .map((s) => (
              <option key={s.code} value={s.name} className="bg-slate-900 text-slate-200 font-normal">
                {s.name} (UT)
              </option>
            ))}
        </optgroup>
      </select>
    </div>
  );
};
