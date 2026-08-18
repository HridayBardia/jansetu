'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

import en from '../locales/en.json';
import hi from '../locales/hi.json';
import gu from '../locales/gu.json';
import kn from '../locales/kn.json';
import ur from '../locales/ur.json';
import bn from '../locales/bn.json';
import mr from '../locales/mr.json';
import ta from '../locales/ta.json';
import te from '../locales/te.json';
import ml from '../locales/ml.json';
import or from '../locales/or.json';
import pa from '../locales/pa.json';

const LOCALES: Record<string, Record<string, string>> = {
  en, hi, gu, kn, ur, bn, mr, ta, te, ml, or, pa
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, fallback?: string) => string;
  isRTL: boolean;
  supportedLanguages: { code: string; name: string; native_name: string }[];
}

const SUPPORTED_LANGUAGES_LIST = [
  { code: 'en', name: 'English', native_name: 'English' },
  { code: 'hi', name: 'Hindi', native_name: 'हिन्दी' },
  { code: 'gu', name: 'Gujarati', native_name: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native_name: 'ಕನ್ನಡ' },
  { code: 'bn', name: 'Bengali', native_name: 'বাংলা' },
  { code: 'mr', name: 'Marathi', native_name: 'मराठी' },
  { code: 'ta', name: 'Tamil', native_name: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native_name: 'తెలుగు' },
  { code: 'ur', name: 'Urdu', native_name: 'اردو' },
  { code: 'ml', name: 'Malayalam', native_name: 'മലയാളം' },
  { code: 'or', name: 'Odia', native_name: 'ଓଡ଼ିଆ' },
  { code: 'pa', name: 'Punjabi', native_name: 'ਪੰਜਾਬੀ' }
];

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
  isRTL: false,
  supportedLanguages: SUPPORTED_LANGUAGES_LIST
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>('en');

  useEffect(() => {
    // Restore saved language from localStorage
    const saved = localStorage.getItem('jansetu_language');
    if (saved && LOCALES[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (langCode: string) => {
    if (LOCALES[langCode]) {
      setLanguageState(langCode);
      localStorage.setItem('jansetu_language', langCode);
    }
  };

  const isRTL = language === 'ur';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language, isRTL]);

  const t = (key: string, fallback?: string): string => {
    const dict = LOCALES[language] || LOCALES['en'];
    if (dict[key]) return dict[key];
    if (LOCALES['en'][key]) return LOCALES['en'][key];
    return fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isRTL,
        supportedLanguages: SUPPORTED_LANGUAGES_LIST
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
