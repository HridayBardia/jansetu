'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, RefreshCw } from 'lucide-react';
import { streamCivicHelp, JourneyContext } from '@/services/aiHelpService';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeContext?: JourneyContext;
}

export const ContextualAiModal: React.FC<Props> = ({ isOpen, onClose, activeContext }) => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'bot'; text: string; time: string }>>([
    {
      role: 'bot',
      text: t('Namaste! I am SetuSahayak. Ask me any question about land, schemes, or civic processes.', 'Namaste! I am SetuSahayak. Ask me any question about land, schemes, or civic processes.'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const query = (queryText || input).trim();
    if (!query || isGenerating) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Append user message + empty bot placeholder
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: query, time },
      { role: 'bot', text: t('Thinking...', 'Thinking...'), time }
    ]);
    
    setInput('');
    setIsGenerating(true);

    try {
      // Directly stream real text from the API
      const fullText = await streamCivicHelp(query, activeContext, (chunkText) => {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: 'bot',
            text: chunkText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          return next;
        });
      });

      if (fullText) {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: 'bot',
            text: fullText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          return next;
        });
      }
    } catch (err: any) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: 'bot',
          text: t('Unable to load guidance right now. Please try asking again.', 'Unable to load guidance right now. Please try asking again.'),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        return next;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="SetuSahayak Floating Copilot"
      className="fixed bottom-5 right-5 z-50 w-[380px] sm:w-[440px] md:w-[480px] max-w-[calc(100vw-1.5rem)] h-[520px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-150"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0f3470] flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">SetuSahayak</h3>
              <span className="text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                {t('Grounded', 'Grounded')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('Citizen Journey Copilot', 'Citizen Journey Copilot')}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          aria-label="Close Assistant"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/30 dark:bg-slate-950/30 text-xs">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'bot' && (
              <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#0f3470] text-white rounded-br-none self-end'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
              }`}
            >
              {/* Standard paragraph rendering */}
              <p className="whitespace-pre-wrap text-[12px] text-slate-700 leading-relaxed font-normal">
                {msg.text}
              </p>

              {/* Suggestions on greeting only */}
              {i === 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1">
                  {[
                    t('What documents are needed to buy land?', 'What documents are needed to buy land?'),
                    t('How to start a hospital in India?', 'How to start a hospital in India?'),
                    t('Explain in simple Hindi', 'Explain in simple Hindi'),
                  ].map((pill, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => handleSend(pill)}
                      className="text-left px-2 py-1 rounded bg-blue-50/70 hover:bg-blue-100 text-blue-800 text-[10px] font-medium border border-blue-200/50 transition cursor-pointer"
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              )}

              <span className={`block mt-2 text-[9px] text-right ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                {msg.time}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('Ask SetuSahayak...', 'Ask SetuSahayak...')}
            className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1.5 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800 transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="p-1.5 bg-[#0f3470] hover:bg-[#0c2957] disabled:opacity-40 text-white rounded-lg transition shadow-xs shrink-0 cursor-pointer"
            aria-label="Send"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContextualAiModal;
