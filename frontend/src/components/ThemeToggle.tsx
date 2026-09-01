'use client';

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, Theme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  const options: { id: Theme; label: string; icon: React.ReactNode; tooltip: string }[] = [
    {
      id: 'light',
      label: t('Light', 'Light'),
      icon: <Sun size={15} className="transition-transform duration-200" />,
      tooltip: t('Light Mode', 'Light Mode')
    },
    {
      id: 'system',
      label: t('System', 'System'),
      icon: <Monitor size={15} className="transition-transform duration-200" />,
      tooltip: t('System Preference', 'System Preference')
    },
    {
      id: 'dark',
      label: t('Dark', 'Dark'),
      icon: <Moon size={15} className="transition-transform duration-200" />,
      tooltip: t('Dark Mode', 'Dark Mode')
    }
  ];

  return (
    <div 
      className="inline-flex items-center bg-slate-200/90 dark:bg-slate-900/90 p-0.5 md:p-1 rounded-full border border-slate-300/80 dark:border-slate-700/80 shadow-inner backdrop-blur-sm"
      role="group"
      aria-label={t('Theme Selector', 'Theme Selector')}
    >
      {options.map((opt) => {
        const isActive = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTheme(opt.id)}
            title={opt.tooltip}
            aria-label={opt.tooltip}
            className={`relative p-1.5 md:px-2 md:py-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer select-none ${
              isActive
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-300/50 dark:hover:bg-slate-800/40'
            }`}
          >
            {opt.icon}
            <span className="hidden lg:inline-block text-[11px] font-medium">
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
