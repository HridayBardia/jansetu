/**
 * JanSetu IndicTrans2 Full-Stack Client & Object Deep-Translator.
 * High-performance batch translation wrapper with client-side deduplication,
 * token safety, and deep JSON tree localization.
 */

import { UNIVERSAL_PHRASES } from '@/locales/universalDict';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface BatchTranslationOptions {
  sourceLang?: string;
  targetLang: string;
  preserveTokens?: boolean;
}

// In-memory client cache for fast tab-switching and re-renders
const CLIENT_TRANSLATION_CACHE = new Map<string, string>();

/**
 * Translates a list of strings in a single optimized batch API request.
 */
export async function translateBatchStrings(
  texts: string[],
  options: BatchTranslationOptions
): Promise<string[]> {
  const { sourceLang = 'auto', targetLang, preserveTokens = true } = options;

  if (!texts || texts.length === 0) return [];
  if (sourceLang !== 'auto' && sourceLang === targetLang) return texts;

  const normLang = targetLang === 'kok' ? 'gom' : targetLang;
  const results: string[] = new Array(texts.length);
  const uncachedTexts: string[] = [];
  const uncachedIndices: number[] = [];

  // 1. Check Universal Dictionary & client memory cache
  for (let i = 0; i < texts.length; i++) {
    const raw = texts[i];
    if (!raw || !raw.trim()) {
      results[i] = raw;
      continue;
    }
    const trimmed = raw.trim();
    const cacheKey = `${normLang}:${trimmed}`;

    if (UNIVERSAL_PHRASES[trimmed]?.[normLang]) {
      const match = UNIVERSAL_PHRASES[trimmed][normLang];
      CLIENT_TRANSLATION_CACHE.set(cacheKey, match);
      results[i] = match;
    } else if (CLIENT_TRANSLATION_CACHE.has(cacheKey)) {
      results[i] = CLIENT_TRANSLATION_CACHE.get(cacheKey)!;
    } else {
      uncachedTexts.push(trimmed);
      uncachedIndices.push(i);
    }
  }

  if (uncachedTexts.length === 0) {
    return results;
  }

  // 2. Perform Batch Translation Call to Backend
  try {
    const res = await fetch(`${API_BASE}/api/v1/translate-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texts: uncachedTexts,
        source_language: sourceLang,
        target_language: targetLang,
        preserve_tokens: preserveTokens,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const payload = json.data || json;
      const translations: string[] = payload.translations || [];

      for (let j = 0; j < uncachedTexts.length; j++) {
        const originalText = texts[uncachedIndices[j]];
        const translatedText = translations[j] || originalText;
        const cacheKey = `${targetLang}:${uncachedTexts[j]}`;

        CLIENT_TRANSLATION_CACHE.set(cacheKey, translatedText);
        results[uncachedIndices[j]] = translatedText;
      }
      return results;
    }
  } catch (err) {
    console.warn('[IndicTranslator] Batch translation request failed, using original text fallback:', err);
  }

  // Fallback: fill uncached with original text
  for (let k = 0; k < uncachedIndices.length; k++) {
    results[uncachedIndices[k]] = texts[uncachedIndices[k]];
  }
  return results;
}

/**
 * Deeply traverses an arbitrary JavaScript/JSON object or array (e.g., scheme cards,
 * roadmaps, next-best actions) and translates all human-readable string values in a single
 * batch pass while preserving numeric values, boolean flags, URLs, and system IDs.
 */
export async function translateObject<T>(
  data: T,
  targetLang: string,
  sourceLang: string = 'auto',
  skipKeys: string[] = [
    'id', 'key', 'code', 'url', 'href', 'scheme_id', 'user_id', 'status',
    'date', 'created_at', 'updated_at', 'type', 'mime_type', 'icon'
  ]
): Promise<T> {
  if (!data || targetLang === 'en' || typeof data !== 'object') {
    return data;
  }

  const extractedStrings: string[] = [];
  const paths: (string | number)[][] = [];

  const skipSet = new Set(skipKeys.map(k => k.toLowerCase()));

  // Recursive collector
  const traverse = (node: any, currentPath: (string | number)[]) => {
    if (typeof node === 'string') {
      const trimmed = node.trim();
      // Only translate strings that have alphabetical words and are not technical IDs
      if (trimmed.length > 0 && /[a-zA-Z]{2,}/.test(trimmed)) {
        extractedStrings.push(trimmed);
        paths.push([...currentPath]);
      }
    } else if (Array.isArray(node)) {
      node.forEach((item, idx) => traverse(item, [...currentPath, idx]));
    } else if (node !== null && typeof node === 'object') {
      Object.keys(node).forEach((key) => {
        if (!skipSet.has(key.toLowerCase())) {
          traverse(node[key], [...currentPath, key]);
        }
      });
    }
  };

  traverse(data, []);

  if (extractedStrings.length === 0) {
    return data;
  }

  // Batch translate all collected strings
  const translatedStrings = await translateBatchStrings(extractedStrings, {
    targetLang,
    sourceLang,
    preserveTokens: true,
  });

  // Deep clone and replace values
  const cloned = JSON.parse(JSON.stringify(data));
  paths.forEach((path, idx) => {
    let curr = cloned;
    for (let i = 0; i < path.length - 1; i++) {
      curr = curr[path[i]];
    }
    curr[path[path.length - 1]] = translatedStrings[idx];
  });

  return cloned;
}
