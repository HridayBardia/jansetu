'use client';

import React, { useEffect, useRef } from 'react';
import { useLanguage, resolveTranslation } from '@/context/LanguageContext';
import { UNIVERSAL_PHRASES } from '@/locales/universalDict';
import { translateBatchStrings } from '@/utils/indicTranslator';

// Master WeakMaps to preserve original English source text for 0ms reversibility
const originalTextMap = new WeakMap<Node, string>();
const originalAttrMap = new WeakMap<Element, Record<string, string>>();

/**
 * Punctuation-aware translation resolver
 * Strips and re-attaches trailing markers (*, :, •, etc.)
 */
function translateWithPunctuation(normLang: string, rawText: string): string | null {
  if (!rawText || normLang === 'en') return null;

  const trimmed = rawText.trim();
  if (!trimmed) return null;

  // 1. Direct match
  if (POLICY_EXTENDED_PHRASES[trimmed]?.[normLang]) {
    return POLICY_EXTENDED_PHRASES[trimmed][normLang];
  }
  if (PORTAL_EXTENDED_PHRASES[trimmed]?.[normLang]) {
    return PORTAL_EXTENDED_PHRASES[trimmed][normLang];
  }
  if (UNIVERSAL_PHRASES[trimmed]?.[normLang]) {
    return UNIVERSAL_PHRASES[trimmed][normLang];
  }

  const direct = resolveTranslation(normLang, trimmed, '');
  if (direct && direct !== trimmed) {
    return direct;
  }

  // 2. Trailing punctuation matching (e.g. "12-Digit Aadhaar Number *" -> "12-अंकीय आधार संख्या *")
  const punctMatch = trimmed.match(/^(.+?)\s*([\*\:\.\,\!\?•]+)$/);
  if (punctMatch) {
    const baseText = punctMatch[1].trim();
    const trailingPunct = punctMatch[2];

    const baseTrans = 
      PORTAL_EXTENDED_PHRASES[baseText]?.[normLang] ||
      UNIVERSAL_PHRASES[baseText]?.[normLang] ||
      resolveTranslation(normLang, baseText, '');

    if (baseTrans && baseTrans !== baseText) {
      return `${baseTrans} ${trailingPunct}`;
    }
  }

  // 3. Leading icons/markers matching (e.g. "✓ Verified Record..." -> "✓ ...")
  const iconMatch = trimmed.match(/^([✓⚠️🔔⚡]\s*)(.+)$/);
  if (iconMatch) {
    const icon = iconMatch[1];
    const baseText = iconMatch[2].trim();

    const baseTrans = 
      PORTAL_EXTENDED_PHRASES[baseText]?.[normLang] ||
      UNIVERSAL_PHRASES[baseText]?.[normLang] ||
      resolveTranslation(normLang, baseText, '');

    if (baseTrans && baseTrans !== baseText) {
      return `${icon}${baseTrans}`;
    }
  }

  return null;
}

export const GlobalLanguageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, t } = useLanguage();
  const isTranslatingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const normLang = language === 'kok' ? 'gom' : language;
    pendingTranslationNodes.clear();

    const translateDOM = async () => {
      if (isTranslatingRef.current) return;
      isTranslatingRef.current = true;

      try {
        const root = document.body;
        if (!root) return;

        // TreeWalker to traverse all visible text nodes in the DOM
        const walker = document.createTreeWalker(
          root,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode(node) {
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
              const tag = parent.tagName.toLowerCase();
              if (tag === 'script' || tag === 'style' || tag === 'noscript') {
                return NodeFilter.FILTER_REJECT;
              }
              // Skip code blocks that are literal technical tokens
              if (parent.classList.contains('font-mono') && (
                parent.textContent?.startsWith('SHA256') || 
                parent.textContent?.startsWith('KA-') || 
                parent.textContent?.startsWith('PID-') ||
                parent.textContent?.startsWith('http')
              )) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );

        const dynamicNodesToTranslate: Array<{ node: Node; original: string; textToTranslate: string }> = [];

        let currentNode = walker.nextNode();
        while (currentNode) {
          const rawText = currentNode.nodeValue || '';
          const trimmed = rawText.trim();

          if (trimmed.length > 0) {
            // Save original English text
            if (!originalTextMap.has(currentNode) && (normLang === 'en' || /[a-zA-Z]{2,}/.test(rawText))) {
              originalTextMap.set(currentNode, rawText);
            }

            const original = originalTextMap.get(currentNode) || rawText;
            const originalTrimmed = original.trim();

            if (normLang === 'en') {
              if (currentNode.nodeValue !== original) {
                currentNode.nodeValue = original;
              }
            } else {
              // 1. Direct Universal Phrase match (0ms)
              if (UNIVERSAL_PHRASES[originalTrimmed]?.[normLang]) {
                const translated = UNIVERSAL_PHRASES[originalTrimmed][normLang];
                const newText = original.replace(originalTrimmed, translated);
                if (currentNode.nodeValue !== newText) {
                  currentNode.nodeValue = newText;
                }
              } else {
                // 2. Check if t(...) has a translation for this exact phrase
                const resolved = t(originalTrimmed);
                if (resolved && resolved !== originalTrimmed) {
                  const newText = original.replace(originalTrimmed, resolved);
                  if (currentNode.nodeValue !== newText) {
                    currentNode.nodeValue = newText;
                  }
                } else if (/[a-zA-Z]{2,}/.test(originalTrimmed) && originalTrimmed.length > 3) {
                  // 3. Queue for batched IndicTrans2 translation
                  const nodeKey = `${normLang}:${originalTrimmed}`;
                  if (!pendingTranslationNodes.has(nodeKey)) {
                    pendingTranslationNodes.add(nodeKey);
                    dynamicNodesToTranslate.push({
                      node: currentNode,
                      original,
                      textToTranslate: originalTrimmed,
                    });
                  }
                }
              }
            }
          }
          currentNode = walker.nextNode();
        }

        // Also translate placeholders and titles on inputs and buttons (0ms)
        const elementsWithAttrs = document.querySelectorAll<HTMLElement>('[placeholder], [title]');
        elementsWithAttrs.forEach((el) => {
          if (!originalAttrMap.has(el)) {
            originalAttrMap.set(el, {
              placeholder: el.getAttribute('placeholder') || '',
              title: el.getAttribute('title') || ''
            });
          }

          const og = originalAttrMap.get(el);
          if (!og) return;

          if (normLang === 'en') {
            if (og.placeholder && el.getAttribute('placeholder') !== og.placeholder) {
              el.setAttribute('placeholder', og.placeholder);
            }
            if (og.title && el.getAttribute('title') !== og.title) {
              el.setAttribute('title', og.title);
            }
          } else {
            if (og.placeholder && og.placeholder.trim()) {
              const phTrim = og.placeholder.trim();
              const transPh = translateWithPunctuation(normLang, phTrim);
              if (transPh && transPh !== phTrim && el.getAttribute('placeholder') !== transPh) {
                el.setAttribute('placeholder', transPh);
              }
            }
            if (og.title && og.title.trim()) {
              const tTrim = og.title.trim();
              const transT = translateWithPunctuation(normLang, tTrim);
              if (transT && transT !== tTrim && el.getAttribute('title') !== transT) {
                el.setAttribute('title', transT);
              }
            }
          }
        });

        // Execute dynamic batch translation for all queued nodes in ONE request
        if (dynamicNodesToTranslate.length > 0 && normLang !== 'en') {
          const uniqueTexts = Array.from(new Set(dynamicNodesToTranslate.map(d => d.textToTranslate)));
          const translations = await translateBatchStrings(uniqueTexts, {
            targetLang: normLang,
            sourceLang: 'auto',
            preserveTokens: true,
          });

          const transMap = new Map<string, string>();
          uniqueTexts.forEach((txt, idx) => {
            if (translations[idx]) {
              transMap.set(txt, translations[idx]);
            }
          });

          // Apply translations to DOM text nodes
          dynamicNodesToTranslate.forEach(({ node, original, textToTranslate }) => {
            const translated = transMap.get(textToTranslate);
            if (translated && translated !== textToTranslate && node.nodeValue) {
              node.nodeValue = original.replace(textToTranslate, translated);
            }
          });
        }
      } catch (err) {
        // Fail-safe pass
      } finally {
        isTranslatingRef.current = false;
      }
    };

    // Instant initial run
    translateDOM();

    // Debounced MutationObserver
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          scheduleTranslate();
          break;
        }
      }
      if (hasRelevantChanges) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          translateDOM();
        }, 60);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false
    });

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      observer.disconnect();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [language, t]);

  return <>{children}</>;
};

export default GlobalLanguageWrapper;
