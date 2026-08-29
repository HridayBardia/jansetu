'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Sparkles, X, Loader2 } from 'lucide-react';
import { streamCivicHelp, JourneyContext } from '@/services/aiHelpService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeContext?: JourneyContext;
}

export const ContextualAiModal: React.FC<Props> = ({ isOpen, onClose, activeContext }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'bot'; text: string; time: string }>>([
    {
      role: 'bot',
      text: 'Hello! I am SetuSahayak. Ask me any question about your active journey requirements, official documents, or government schemes.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages update during streaming
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating]);

  if (!isOpen) return null;

  const defaultSuggestions = activeContext?.activeScheme
    ? ['Why do I need this document?', 'What alternative documents are accepted?', 'Explain in simple Hindi']
    : ['How do I apply for a Passport?', 'Documents needed to buy land in India', 'How to file an online RTI?'];

  const handleSend = async (queryText?: string) => {
    const query = queryText || input;
    if (!query.trim() || isGenerating) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessages = [...messages, { role: 'user' as const, text: query, time: userTime }];
    setMessages(newMessages);
    setInput('');
    setIsGenerating(true);

    const botMessageIndex = newMessages.length;
    // Append placeholder for streaming response
    setMessages((prev) => [
      ...prev,
      { role: 'bot', text: '...', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);

    await streamCivicHelp(query, activeContext, (streamedText) => {
      setMessages((prev) => {
        const updated = [...prev];
        updated[botMessageIndex] = {
          role: 'bot',
          text: streamedText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        return updated;
      });
    });

    setIsGenerating(false);
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 sm:w-[420px] max-w-[95vw] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col z-50 overflow-hidden font-sans">
      {/* Header Area */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">SetuSahayak</h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                Grounded
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Citizen Journey & Scheme Copilot</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="p-4 flex-1 max-h-[420px] overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'bot' && (
              <div className="w-7 h-7 rounded-lg bg-blue-100/60 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-400 shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none font-medium'
                  : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              
              {/* Quick Dynamic Prompt Suggestions (Rendered on initial greeting) */}
              {idx === 0 && (
                <div className="mt-3 flex flex-col gap-1.5">
                  {defaultSuggestions.map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => handleSend(prompt)}
                      className="text-left px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg text-[11px] font-medium transition cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
              <span className={`block mt-1 text-[9px] text-right ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'}`}>
                {msg.time}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask SetuSahayak about documents, rules, or fees..."
            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800 transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            aria-label="Send message"
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContextualAiModal;
