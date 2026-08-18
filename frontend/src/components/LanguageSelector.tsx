'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, supportedLanguages } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  return (
    <div className="relative inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus-within:border-amber-500/50 hover:border-slate-700 transition">
      <Globe className="w-4 h-4 text-amber-400 shrink-0" />
      <select
        value={language}
        onChange={handleChange}
        className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1"
        aria-label="Select Language"
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
            {lang.native_name} ({lang.name})
          </option>
        ))}
      </select>
    </div>
  );
};

