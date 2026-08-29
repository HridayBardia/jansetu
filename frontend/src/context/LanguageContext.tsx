'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Import all 23 official locale JSON dictionaries into memory for instant 0ms client-side execution
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

import { MASTER_TRANSLATIONS } from '../locales/translations';
import { UNIVERSAL_PHRASES } from '../locales/universalDict';

const LOCALES: Record<string, Record<string, string>> = {
  en, hi, gu, kn, ur, bn, mr, ta, te, ml, or, pa,
  as, ne, sa, mai, sat, ks, sd, gom, kok: gom, brx, doi, mni,
};

// Build reverse English index for instant raw text translation (e.g. 'System Overview' -> 'admin.systemOverview')
const EN_VALUE_TO_KEY: Record<string, string> = {};
if (typeof en === 'object') {
  for (const [k, v] of Object.entries(en)) {
    if (typeof v === 'string') {
      EN_VALUE_TO_KEY[v.trim().toLowerCase()] = k;
    }
  }
}

// RTL scripts (Urdu, Kashmiri, Sindhi)
const RTL_CODES = new Set(['ur', 'ks', 'sd']);

export interface SupportedLanguage {
  code: string;
  name: string;
  native_name: string;
  is_rtl: boolean;
}

export const SUPPORTED_LANGUAGES_LIST: SupportedLanguage[] = [
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
  { code: 'kok', name: 'Konkani', native_name: 'कोंकणी', is_rtl: false },
  { code: 'brx', name: 'Bodo', native_name: 'बड़ो', is_rtl: false },
  { code: 'doi', name: 'Dogri', native_name: 'डोगरी', is_rtl: false },
  { code: 'mni', name: 'Manipuri', native_name: 'মৈতৈলোন্', is_rtl: false },
];

export interface LanguageContextType {
  language: string;
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  t: (key: string, fallback?: string) => string;
  translateInputToEnglish: (userInputText: string) => Promise<string>;
  translateDynamic: (text: string, targetLang?: string) => Promise<string>;
  translateDynamicText: (text: string, targetLang?: string) => Promise<string>;
  isRTL: boolean;
  supportedLanguages: SupportedLanguage[];
  translationStatus: 'ready' | 'degraded' | 'unavailable';
}

const TRANS_CACHE_KEY = 'jansetu_trans_cache';

function getCached(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TRANS_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    return cache[key] || null;
  } catch (e) {
    return null;
  }
}

function setCached(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(TRANS_CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    cache[key] = value;
    const keys = Object.keys(cache);
    if (keys.length > 500) {
      delete cache[keys[0]];
    }
    localStorage.setItem(TRANS_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {}
}

/**
 * Universal Key & Text Resolver supporting:
 * 0. UNIVERSAL_PHRASES 23-language phrase index (0ms)
 * 1. Exact dotted key in JSON locale
 * 2. Reverse English Value -> Key -> Target Locale match
 * 3. MASTER_TRANSLATIONS namespaces (`nav.home`, `auth.aadhaar_number`, etc.)
 * 4. Fallback chain to English
 */
function resolveTranslation(lang: string, key: string, fallback?: string): string {
  if (!key) return fallback || '';
  const normLang = lang === 'kok' ? 'gom' : lang;
  const currentDict = LOCALES[normLang] || LOCALES['en'];
  const enDict = LOCALES['en'];
  const trimmedKey = key.trim();

  // 0. Direct Universal Phrase Match (0ms)
  if (UNIVERSAL_PHRASES[trimmedKey]?.[normLang]) {
    return UNIVERSAL_PHRASES[trimmedKey][normLang];
  }

  // 1. Direct JSON lookup
  if (currentDict && currentDict[key] !== undefined) {
    return currentDict[key];
  }

  // 2. Reverse English text matching (e.g. key is 'System Overview')
  const lowerKey = trimmedKey.toLowerCase();
  const matchedJsonKey = EN_VALUE_TO_KEY[lowerKey];
  if (matchedJsonKey && currentDict && currentDict[matchedJsonKey] !== undefined) {
    return currentDict[matchedJsonKey];
  }

  // 3. Namespaced Master Translation lookup
  if (key.includes('.')) {
    const parts = key.split('.');
    const namespace = parts[0];
    const itemKey = parts.slice(1).join('.');

    // Try current lang in MASTER_TRANSLATIONS
    const masterLang = MASTER_TRANSLATIONS[normLang] || MASTER_TRANSLATIONS['en'];
    if (masterLang && (masterLang as any)[namespace]) {
      const nsObj = (masterLang as any)[namespace];
      if (nsObj[itemKey] !== undefined) return nsObj[itemKey];

      // Try camelCase / snake_case alternative
      const snakeKey = itemKey.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (nsObj[snakeKey] !== undefined) return nsObj[snakeKey];

      const camelKey = itemKey.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (nsObj[camelKey] !== undefined) return nsObj[camelKey];
    }
  }

  // 4. Fallback to English direct JSON lookup
  if (enDict && enDict[key] !== undefined) {
    return enDict[key];
  }

  // 5. Fallback to English Master Translation
  if (key.includes('.')) {
    const parts = key.split('.');
    const namespace = parts[0];
    const itemKey = parts.slice(1).join('.');
    const enMaster = MASTER_TRANSLATIONS['en'];
    if (enMaster && (enMaster as any)[namespace]) {
      const nsObj = (enMaster as any)[namespace];
      if (nsObj[itemKey] !== undefined) return nsObj[itemKey];
    }
  }

  // 6. Try segment lookup
  const lastSegment = key.includes('.') ? key.split('.').pop()! : key;
  if (currentDict && currentDict[lastSegment] !== undefined) {
    return currentDict[lastSegment];
  }
  if (enDict && enDict[lastSegment] !== undefined) {
    return enDict[lastSegment];
  }

  return fallback !== undefined ? fallback : key;
}

/**
 * Common script keyword maps for zero-latency normalization
 */
const INDIC_SEARCH_TERMS: Array<{ keywords: string[]; english: string }> = [
  { keywords: ['दुकान', 'व्यापार', 'व्यवसाय', 'धंधा', 'business', 'dukan', 'vyapar', 'karobar', 'વેપાર', 'ਧੰਦਾ', 'ವ್ಯಾಪಾರ', 'வியாபாரம்'], english: 'business shop' },
  { keywords: ['वडोदरा', 'vadodara', 'baroda', 'વડોદરા'], english: 'Vadodara Gujarat' },
  { keywords: ['ऑस्ट्रेलिया', 'australia', 'masters', 'विदेश', 'परदेश', 'বিদেশ', 'வெளிநாடு'], english: 'masters higher education Australia' },
  { keywords: ['छात्रवृत्ति', 'scholarship', 'पढ़ाई', 'शिक्षा', 'શિક્ષણ', 'கல்வி'], english: 'scholarship education' },
  { keywords: ['राजस्थान', 'rajasthan', 'राजस्थान', 'ਰਾਜਸਥਾਨ'], english: 'Rajasthan' },
  { keywords: ['किसान', 'खेती', 'कृषि', 'kisan', 'kheti', 'farmer', 'ખેતી', 'விவசாயி'], english: 'farmer agriculture PM-KISAN' },
  { keywords: ['कर्ज', 'लोन', 'loan', 'subsidy', 'कल्याण'], english: 'loan subsidy welfare' },
  { keywords: ['ड्राइविंग', 'लाइसेंस', 'license', 'driving', 'dl', 'वाहन'], english: 'driving license' },
  { keywords: ['पासपोर्ट', 'passport', 'visa'], english: 'passport visa' },
  { keywords: ['घर', 'मकान', 'जमीन', 'land', 'property', 'plot', 'આવાસ'], english: 'property land registration' }
];

/**
 * Indic-LLM Input Normalizer:
 * Translates queries in Hindi, Bengali, Gujarati, Tamil, Hinglish, etc. into clean English for search & DAG matching
 */
export async function translateInputToEnglish(userInputText: string): Promise<string> {
  if (!userInputText || !userInputText.trim()) return '';

  const inputTrimmed = userInputText.trim();
  const cacheKey = `in_en:${inputTrimmed}`;

  // 1. Check local cache
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // 2. Fast Rule-Based / Keyword Mapping (0ms)
  const lower = inputTrimmed.toLowerCase();
  const matchedTokens: string[] = [];
  for (const entry of INDIC_SEARCH_TERMS) {
    if (entry.keywords.some(kw => lower.includes(kw.toLowerCase()))) {
      matchedTokens.push(entry.english);
    }
  }

  if (matchedTokens.length > 0) {
    const normalized = `${inputTrimmed} (${matchedTokens.join(' ')})`;
    setCached(cacheKey, normalized);
    return normalized;
  }

  // 3. Backend Translation Service Bridge
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/api/v1/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: inputTrimmed,
        target_language: 'en',
        source_language: 'auto'
      })
    });
    if (res.ok) {
      const data = await res.json();
      const translated = data?.data?.translated_text || data?.translated_text;
      if (translated && translated !== inputTrimmed) {
        setCached(cacheKey, translated);
        return translated;
      }
    }
  } catch (e) {}

  // 4. Indic-LLM API Normalization if key available
  try {
    const apiKey = (typeof window !== 'undefined' && ((window as any).__ENV__?.VITE_GEMINI_API_KEY || (window as any).__ENV__?.VITE_AI_API_KEY)) ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
      process.env.VITE_GEMINI_API_KEY ||
      process.env.VITE_AI_API_KEY;

    if (apiKey) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate this citizen goal/query into a concise English query suitable for government scheme search:\n\n${inputTrimmed}`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 64
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (translated) {
          setCached(cacheKey, translated);
          return translated;
        }
      }
    }
  } catch (e) {}

  return inputTrimmed;
}

/**
 * Indic-LLM Dynamic Output Translator:
 * Translates dynamic roadmaps or backend responses into the target language with client-side caching
 */
export async function translateDynamicText(
  text: string,
  targetLang: string = 'en'
): Promise<string> {
  if (!text || !text.trim() || targetLang === 'en') {
    return text;
  }

  const normLang = targetLang === 'kok' ? 'gom' : targetLang;
  const trimmed = text.trim();
  const cacheKey = `${normLang}:${trimmed}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  // 0. Check Universal Dictionary
  if (UNIVERSAL_PHRASES[trimmed]?.[normLang]) {
    const val = UNIVERSAL_PHRASES[trimmed][normLang];
    setCached(cacheKey, val);
    return val;
  }

  // 1. In-memory dictionary lookup
  const dict = LOCALES[normLang] || LOCALES['en'];
  if (dict) {
    for (const [, val] of Object.entries(dict)) {
      if (typeof val === 'string' && val.toLowerCase() === trimmed.toLowerCase()) {
        setCached(cacheKey, val);
        return val;
      }
    }
  }

  // 2. Backend Translation Service Bridge
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/api/v1/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: trimmed,
        target_language: normLang,
        source_language: 'auto'
      })
    });
    if (res.ok) {
      const data = await res.json();
      const translated = data?.data?.translated_text || data?.translated_text;
      if (translated && translated !== trimmed) {
        setCached(cacheKey, translated);
        return translated;
      }
    }
  } catch (e) {}

  // 3. Indic-LLM API Dynamic Translation
  try {
    const apiKey = (typeof window !== 'undefined' && ((window as any).__ENV__?.VITE_GEMINI_API_KEY || (window as any).__ENV__?.VITE_AI_API_KEY)) ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
      process.env.VITE_GEMINI_API_KEY ||
      process.env.VITE_AI_API_KEY;

    if (apiKey) {
      const targetLangName = SUPPORTED_LANGUAGES_LIST.find(l => l.code === normLang || l.code === targetLang)?.name || targetLang;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate the following official government/citizen text accurately into ${targetLangName} (${normLang}). Output only the translation without any quotes or commentary:\n\n${trimmed}`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (translated) {
          setCached(cacheKey, translated);
          return translated;
        }
      }
    }
  } catch (e) {}

  return text;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  currentLanguage: 'en',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback !== undefined ? fallback : key,
  translateInputToEnglish: async (text: string) => text,
  translateDynamic: async (text: string) => text,
  translateDynamicText: async (text: string) => text,
  isRTL: false,
  supportedLanguages: SUPPORTED_LANGUAGES_LIST,
  translationStatus: 'ready',
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>('en');

  useEffect(() => {
    // Read from localStorage (support both 'jansetu_lang' and 'jansetu_language')
    const saved = localStorage.getItem('jansetu_lang') || localStorage.getItem('jansetu_language');
    if (saved && (LOCALES[saved] || saved === 'kok')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = useCallback((langCode: string) => {
    const validCode = langCode === 'kok' ? 'gom' : langCode;
    if (LOCALES[validCode] || langCode === 'kok') {
      setLanguageState(langCode);
      localStorage.setItem('jansetu_lang', langCode);
      localStorage.setItem('jansetu_language', langCode);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = langCode;
        document.documentElement.dir = RTL_CODES.has(langCode) ? 'rtl' : 'ltr';
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

  const t = useCallback((key: string, fallback?: string): string => {
    return resolveTranslation(language, key, fallback);
  }, [language]);

  const translateDynamic = useCallback(async (text: string, targetLang?: string): Promise<string> => {
    return await translateDynamicText(text, targetLang || language);
  }, [language]);

  const handleTranslateInputToEnglish = useCallback(async (userInputText: string): Promise<string> => {
    return await translateInputToEnglish(userInputText);
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        language,
        currentLanguage: language,
        setLanguage,
        t,
        translateInputToEnglish: handleTranslateInputToEnglish,
        translateDynamic,
        translateDynamicText: translateDynamic,
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
