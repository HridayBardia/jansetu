'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Import all available locale files
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
import as from '../locales/as.json';
import ne from '../locales/ne.json';
import sa from '../locales/sa.json';
import mai from '../locales/mai.json';
import sat from '../locales/sat.json';
import ks from '../locales/ks.json';
import sd from '../locales/sd.json';
import gom from '../locales/gom.json';
import brx from '../locales/brx.json';
import doi from '../locales/doi.json';
import mni from '../locales/mni.json';

const LOCALES: Record<string, Record<string, string>> = {
  en, hi, gu, kn, ur, bn, mr, ta, te, ml, or, pa,
  as, ne, sa, mai, sat, ks, sd, gom, brx, doi, mni,
};

// RTL language codes
const RTL_CODES = new Set(['ur', 'ks', 'sd']);

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, fallback?: string) => string;
  isRTL: boolean;
  supportedLanguages: { code: string; name: string; native_name: string; is_rtl: boolean }[];
  translationStatus: 'ready' | 'degraded' | 'unavailable';
}

const SUPPORTED_LANGUAGES_LIST = [
  { code: 'en', name: 'English', native_name: 'English', is_rtl: false },
  { code: 'hi', name: 'Hindi', native_name: 'हिन्दी', is_rtl: false },
  { code: 'bn', name: 'Bengali', native_name: 'বাংলা', is_rtl: false },
  { code: 'te', name: 'Telugu', native_name: 'తెలుగు', is_rtl: false },
  { code: 'mr', name: 'Marathi', native_name: 'मराठी', is_rtl: false },
  { code: 'ta', name: 'Tamil', native_name: 'தமிழ்', is_rtl: false },
  { code: 'gu', name: 'Gujarati', native_name: 'ગુજરાતી', is_rtl: false },
  { code: 'ur', name: 'Urdu', native_name: 'اردو', is_rtl: true },
  { code: 'kn', name: 'Kannada', native_name: 'ಕನ್ನಡ', is_rtl: false },
  { code: 'ml', name: 'Malayalam', native_name: 'മലയാളം', is_rtl: false },
  { code: 'or', name: 'Odia', native_name: 'ଓଡ଼ିଆ', is_rtl: false },
  { code: 'pa', name: 'Punjabi', native_name: 'ਪੰਜਾਬੀ', is_rtl: false },
  { code: 'as', name: 'Assamese', native_name: 'অসমীয়া', is_rtl: false },
  { code: 'ne', name: 'Nepali', native_name: 'नेपाली', is_rtl: false },
  { code: 'sa', name: 'Sanskrit', native_name: 'संस्कृतम्', is_rtl: false },
  { code: 'mai', name: 'Maithili', native_name: 'मैथिली', is_rtl: false },
  { code: 'sat', name: 'Santali', native_name: 'ᱥᱟᱱᱛᱟᱲᱤ', is_rtl: false },
  { code: 'ks', name: 'Kashmiri', native_name: 'कॉशुर', is_rtl: true },
  { code: 'sd', name: 'Sindhi', native_name: 'سنڌي', is_rtl: true },
  { code: 'gom', name: 'Konkani', native_name: 'कोंकणी', is_rtl: false },
  { code: 'brx', name: 'Bodo', native_name: 'बड़ो', is_rtl: false },
  { code: 'doi', name: 'Dogri', native_name: 'डोगरी', is_rtl: false },
  { code: 'mni', name: 'Manipuri', native_name: 'মৈতৈলোন্', is_rtl: false },
];

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
  isRTL: false,
  supportedLanguages: SUPPORTED_LANGUAGES_LIST,
  translationStatus: 'ready',
});

/**
 * Resolve a translation key with fallback chain:
 * 1. Try exact key in current language (dot-notation: "goalPlanner.understandGoal")
 * 2. Try last segment of dot-notation key in current language ("understandGoal")
 * 3. Try exact key in English
 * 4. Try last segment in English
 * 5. Return fallback or the key itself
 */
function resolveKey(
  currentDict: Record<string, string>,
  key: string,
  enDict: Record<string, string>,
  fallback?: string
): string {
  // 1. Try exact key in current language
  if (currentDict[key] !== undefined) return currentDict[key];

  // 2. Try last segment (flat key) in current language
  const lastSegment = key.includes('.') ? key.split('.').pop()! : key;
  if (lastSegment !== key && currentDict[lastSegment] !== undefined) return currentDict[lastSegment];

  // 3. Try exact key in English
  if (enDict[key] !== undefined) return enDict[key];

  // 4. Try last segment in English
  if (lastSegment !== key && enDict[lastSegment] !== undefined) return enDict[lastSegment];

  // 5. Return fallback or the key itself
  return fallback || key;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>('en');

  useEffect(() => {
    // Restore saved language from localStorage
    const saved = localStorage.getItem('jansetu_language');
    if (saved && LOCALES[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = useCallback((langCode: string) => {
    if (LOCALES[langCode]) {
      setLanguageState(langCode);
      localStorage.setItem('jansetu_language', langCode);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = langCode;
      }
    }
  }, []);

  const isRTL = RTL_CODES.has(language);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language, isRTL]);

  // Translation function with fallback chain
  const t = useCallback((key: string, fallback?: string): string => {
    const currentDict = LOCALES[language] || LOCALES['en'];
    const enDict = LOCALES['en'];
    return resolveKey(currentDict, key, enDict, fallback);
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isRTL,
        supportedLanguages: SUPPORTED_LANGUAGES_LIST,
        translationStatus: 'ready',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
