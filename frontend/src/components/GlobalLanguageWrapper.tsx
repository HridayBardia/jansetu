'use client';

import React, { useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { UNIVERSAL_PHRASES } from '@/locales/universalDict';
import { translateBatchStrings } from '@/utils/indicTranslator';

// Master in-memory reverse lookup map built once for lightning-fast 0ms DOM translations
const originalTextMap = new WeakMap<Node, string>();
const originalAttrMap = new WeakMap<Element, Record<string, string>>();
const pendingTranslationNodes = new Set<string>();

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
            // Save original English text if not saved yet or if it has Latin characters
            if (!originalTextMap.has(currentNode) && (normLang === 'en' || /[a-zA-Z]{2,}/.test(rawText))) {
              originalTextMap.set(currentNode, rawText);
            }

            const original = originalTextMap.get(currentNode) || rawText;
            const originalTrimmed = original.trim();

            if (normLang === 'en') {
              // Restore original English text
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

        // Also translate placeholders and titles on inputs and buttons
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
            if (og.placeholder) {
              const phTrim = og.placeholder.trim();
              const transPh = UNIVERSAL_PHRASES[phTrim]?.[normLang] || t(phTrim);
              if (transPh && transPh !== phTrim) {
                el.setAttribute('placeholder', transPh);
              }
            }
            if (og.title) {
              const tTrim = og.title.trim();
              const transT = UNIVERSAL_PHRASES[tTrim]?.[normLang] || t(tTrim);
              if (transT && transT !== tTrim) {
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

    // Initial translation run
    translateDOM();

    // Debounced MutationObserver
    const observer = new MutationObserver((mutations) => {
      let hasRelevantChanges = false;
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          hasRelevantChanges = true;
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
      observer.disconnect();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [language, t]);

  return <>{children}</>;
};

export default GlobalLanguageWrapper;
