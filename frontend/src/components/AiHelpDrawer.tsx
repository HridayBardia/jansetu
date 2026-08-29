'use client';

import React, { useState } from 'react';
import { X, Send, Sparkles, ShieldCheck, ExternalLink, Bot, User } from 'lucide-react';
import { WorkflowStep, ChatMessage, SourceProvenance } from '@/types';
import { askAiChatAPI } from '@/lib/api';
import { streamCivicHelp } from '@/services/aiHelpService';

interface AiHelpDrawerProps {
  isOpen?: boolean;
  onClose: () => void;
  step?: WorkflowStep | null;
  journeyId?: string;
  onOpenSource: (src: SourceProvenance) => void;
}

export const AiHelpDrawer: React.FC<AiHelpDrawerProps> = ({
  isOpen = true,
  onClose,
  step = null,
  journeyId = 'general_navigator',
  onOpenSource
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: step
        ? `Hello! I am SetuSahayak for **${step.title}**. Ask me why this step is required, what alternative documents are accepted, or how official guidelines apply to your context.`
        : 'Hello! I am SetuSahayak. Ask me any question about your active journey requirements, official documents, or government schemes.',
      sources: step?.official_sources || [],
      suggested_followups: [
        'Why do I need this document?',
        'What alternative documents are accepted?',
        'Explain in simple Hindi'
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const aiMsgId = `ai_${Date.now()}`;
    const initialAiMsg: ChatMessage = {
      id: aiMsgId,
      sender: 'ai',
      text: '...',
      sources: step?.official_sources || [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg, initialAiMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      // Build context for streaming service
      const context = {
        activeScheme: journeyId.replace(/_/g, ' ').toUpperCase(),
        currentStep: step?.title || 'Document & Verification Step',
        requiredDocuments: step?.required_documents || []
      };

      await streamCivicHelp(query, context, (streamedText) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId ? { ...msg, text: streamedText } : msg
          )
        );
      });
    } catch (e) {
      console.error('Error in AiHelpDrawer stream:', e);
      try {
        const res = await askAiChatAPI(query, journeyId, step?.id);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  text: res.reply,
                  sources: (res.sources as any) || [],
                  suggested_followups: res.suggested_followups || []
                }
              : msg
          )
        );
      } catch (fallbackErr) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  text: 'Unable to connect to AI help service. Please check network connection and try again.'
                }
              : msg
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 dark:bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-300 dark:border-slate-800 shadow-2xl flex flex-col justify-between transition-colors">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-amber-500/10 border border-blue-200 dark:border-amber-500/30 flex items-center justify-center text-[#133E87] dark:text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  SetuSahayak
                  <span className="text-[10px] bg-emerald-50 dark:bg-amber-500/10 text-emerald-700 dark:text-amber-400 border border-emerald-200 dark:border-amber-500/20 px-1.5 py-0.2 rounded font-semibold">
                    Grounded
                  </span>
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                  {step ? step.title : 'Citizen Journey & Scheme Copilot'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m, mIdx) => (
              <div
                key={m.id ? `${m.id}_${mIdx}` : `msg_${mIdx}`}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-amber-500/10 border border-blue-200 dark:border-amber-500/30 flex items-center justify-center text-[#133E87] dark:text-amber-400 shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl leading-relaxed max-w-[85%] ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* Follow-up suggestions on initial greeting */}
                  {mIdx === 0 && m.suggested_followups && m.suggested_followups.length > 0 && (
                    <div className="mt-3 flex flex-col gap-1.5">
                      {m.suggested_followups.map((f, fIdx) => (
                        <button
                          key={fIdx}
                          onClick={() => handleSend(f)}
                          className="text-left px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg text-[11px] font-medium transition cursor-pointer"
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Sources Grounding links */}
                  {m.sources && m.sources.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] space-y-1 mt-2">
                      <p className="text-slate-600 dark:text-slate-400 font-semibold text-[10px] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Grounded Sources:
                      </p>
                      {m.sources.map((src, sIdx) => (
                        <button
                          key={src.id ? `${src.id}_${sIdx}` : `src_${mIdx}_${sIdx}`}
                          onClick={() => onOpenSource(src)}
                          className="block text-[#133E87] dark:text-amber-300 hover:underline font-medium truncate cursor-pointer"
                        >
                          ⓘ {src.title} ({src.authority})
                        </button>
                      ))}
                    </div>
                  )}

                  <span className={`block mt-1.5 text-[9px] text-right ${m.sender === 'user' ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'}`}>
                    {m.timestamp}
                  </span>
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <Sparkles className="w-3.5 h-3.5 text-[#133E87] dark:text-amber-400 animate-spin" />
                <span>Checking official government sources...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
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
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#133E87] dark:focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 rounded-xl bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white disabled:opacity-50 transition cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
