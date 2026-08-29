'use client';

import React, { useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { UNIVERSAL_PHRASES } from '@/locales/universalDict';

// Master in-memory reverse lookup map built once for lightning-fast 0ms DOM translations
const originalTextMap = new WeakMap<Node, string>();
const originalAttrMap = new WeakMap<Element, Record<string, string>>();
const pendingTranslationNodes = new Set<string>();

export const GlobalLanguageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, t, translateDynamicText } = useLanguage();
  const isTranslatingRef = useRef(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const normLang = language === 'kok' ? 'gom' : language;

    const translateDOM = () => {
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
              // Skip script and style tags
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
              const tag = parent.tagName.toLowerCase();
              if (tag === 'script' || tag === 'style' || tag === 'noscript') {
                return NodeFilter.FILTER_REJECT;
              }
              // Skip code blocks that are literal code
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
              // 1. Direct Universal Phrase match
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
                  // 3. Dynamic Indic Translation for longer paragraphs / descriptions
                  const targetNode = currentNode;
                  const nodeKey = `${normLang}:${originalTrimmed}`;
                  if (!pendingTranslationNodes.has(nodeKey)) {
                    pendingTranslationNodes.add(nodeKey);
                    translateDynamicText(originalTrimmed, normLang).then((dynTranslated) => {
                      if (dynTranslated && dynTranslated !== originalTrimmed && targetNode.nodeValue) {
                        targetNode.nodeValue = original.replace(originalTrimmed, dynTranslated);
                      }
                    }).catch(() => {});
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
      } catch (err) {
        // Safe fail
      } finally {
        isTranslatingRef.current = false;
      }
    };

    // Initial translation run
    translateDOM();

    // MutationObserver to watch for client-side state changes, tab switches, and live updates
    const observer = new MutationObserver((mutations) => {
      let hasRelevantChanges = false;
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          hasRelevantChanges = true;
          break;
        }
      }
      if (hasRelevantChanges) {
        translateDOM();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false
    });

    return () => {
      observer.disconnect();
    };
  }, [language, t, translateDynamicText]);

  return <>{children}</>;
};

export default GlobalLanguageWrapper;
