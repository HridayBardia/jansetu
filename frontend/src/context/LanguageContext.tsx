'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

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

// IndicTrans2 language codes mapping
const INDICTRANS_CODES: Record<string, string> = {
  en: 'eng_Latn',
  hi: 'hin_Deva',
  bn: 'ben_Beng',
  te: 'tel_Telu',
  mr: 'mar_Deva',
  ta: 'tam_Taml',
  gu: 'guj_Gujr',
  ur: 'urd_Arab',
  kn: 'kan_Knda',
  ml: 'mal_Mlym',
  or: 'ory_Orya',
  pa: 'pan_Guru',
  as: 'asm_Beng',
  mai: 'mai_Deva',
  sat: 'sat_Olck',
  ks: 'kas_Arab',
  sd: 'snd_Arab',
  ne: 'npi_Deva',
  sa: 'san_Deva',
  gom: 'gom_Deva',
  brx: 'brx_Deva',
  doi: 'doi_Deva',
  mni: 'mni_Beng',
};

// RTL language codes
const RTL_CODES = new Set(['ur', 'ks', 'sd']);

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, fallback?: string) => string;
  isRTL: boolean;
  supportedLanguages: { code: string; name: string; native_name: string; is_rtl: boolean }[];
  // Backend translation API
  translateDynamic: (text: string, targetLang?: string) => Promise<string>;
  translateBatch: (items: { text: string; target_language: string }[]) => Promise<string[]>;
  detectLanguage: (text: string) => Promise<{ language: string; confidence: number }>;
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
  translateDynamic: async (text) => text,
  translateBatch: async (items) => items.map(i => i.text),
  detectLanguage: async () => ({ language: 'en', confidence: 0 }),
  translationStatus: 'ready',
});

const API_BASE = typeof window !== 'undefined'
  ? (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? `${window.location.protocol}//${window.location.host}/api/backend`
    : 'http://localhost:8000/api/v1')
  : '';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>('en');
  const [translationStatus, setTranslationStatus] = useState<'ready' | 'degraded' | 'unavailable'>('ready');
  const translationCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    // Restore saved language from localStorage
    const saved = localStorage.getItem('jansetu_language');
    if (saved && LOCALES[saved]) {
      setLanguageState(saved);
    }

    // Check translation engine health
    checkTranslationHealth();
  }, []);

  const checkTranslationHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/translation/health`);
      if (res.ok) {
        const json = await res.json();
        const status = json?.data?.engine_status || 'DEGRADED';
        setTranslationStatus(status === 'HEALTHY' ? 'ready' : 'degraded');
      } else {
        setTranslationStatus('degraded');
      }
    } catch {
      setTranslationStatus('degraded');
    }
  };

  const setLanguage = useCallback((langCode: string) => {
    if (LOCALES[langCode]) {
      setLanguageState(langCode);
      localStorage.setItem('jansetu_language', langCode);
      // Persist in session for next login
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

  // Static translation using locale JSON files (fast, no API call)
  const t = useCallback((key: string, fallback?: string): string => {
    const dict = LOCALES[language] || LOCALES['en'];
    if (dict[key]) return dict[key];
    if (LOCALES['en'][key]) return LOCALES['en'][key];
    return fallback || key;
  }, [language]);

  // Dynamic translation using backend API (for AI-generated content)
  const translateDynamic = useCallback(async (text: string, targetLang?: string): Promise<string> => {
    if (!text || !text.trim()) return text;
    const target = targetLang || language;
    if (target === 'en') return text;

    // Check frontend cache first
    const cacheKey = `${target}:${text}`;
    if (translationCacheRef.current.has(cacheKey)) {
      return translationCacheRef.current.get(cacheKey)!;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('citizen_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/translation/translate`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          text,
          source_language: 'auto',
          target_language: target,
          category: 'dynamic',
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const translated = json?.data?.translated_text || text;
        translationCacheRef.current.set(cacheKey, translated);
        return translated;
      }
    } catch (err) {
      console.warn('[Translation] Dynamic translation failed:', err);
    }

    return text;
  }, [language]);

  // Batch translation
  const translateBatch = useCallback(async (items: { text: string; target_language: string }[]): Promise<string[]> => {
    if (!items.length) return [];

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('citizen_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/translation/translate/batch`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          items: items.map(i => ({
            text: i.text,
            source_language: 'auto',
            target_language: i.target_language,
          })),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const results = json?.data?.results || [];
        return results.map((r: any) => r.translated_text || r.original_text || '');
      }
    } catch (err) {
      console.warn('[Translation] Batch translation failed:', err);
    }

    return items.map(i => i.text);
  }, []);

  // Language detection
  const detectLanguage = useCallback(async (text: string): Promise<{ language: string; confidence: number }> => {
    if (!text || !text.trim()) return { language: 'en', confidence: 0 };

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('citizen_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/translation/detect`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          text,
          fallback_language: language,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        return {
          language: json?.data?.detected_language || 'en',
          confidence: json?.data?.confidence || 0,
        };
      }
    } catch (err) {
      console.warn('[Translation] Language detection failed:', err);
    }

    return { language: 'en', confidence: 0 };
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isRTL,
        supportedLanguages: SUPPORTED_LANGUAGES_LIST,
        translateDynamic,
        translateBatch,
        detectLanguage,
        translationStatus,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
