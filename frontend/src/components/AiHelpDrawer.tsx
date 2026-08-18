'use client';

import React, { useState } from 'react';
import { X, Send, Sparkles, ShieldCheck, ExternalLink, Bot, User } from 'lucide-react';
import { WorkflowStep, ChatMessage, SourceProvenance } from '@/types';
import { askAiChatAPI } from '@/lib/api';

interface AiHelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  step: WorkflowStep | null;
  journeyId: string;
  onOpenSource: (src: SourceProvenance) => void;
}

export const AiHelpDrawer: React.FC<AiHelpDrawerProps> = ({
  isOpen,
  onClose,
  step,
  journeyId,
  onOpenSource
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: step
        ? `Hello! I am your Contextual AI Assistant for **${step.title}**. Ask me why this step is required, what alternative documents are accepted, or how official guidelines apply to your context.`
        : 'Hello! Ask me any question about your active journey requirements, official sources, or steps.',
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

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await askAiChatAPI(query, journeyId, step?.id);
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: res.reply,
        sources: (res.sources as any) || [],
        suggested_followups: res.suggested_followups || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  Contextual AI Help
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded font-semibold">
                    Grounded
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                  {step ? step.title : 'Journey Assistance'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 space-y-2 ${
                    m.sender === 'user'
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{m.text}</p>

                  {/* Sources Grounding links */}
                  {m.sources && m.sources.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 text-[11px] space-y-1">
                      <p className="text-slate-400 font-semibold text-[10px] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        Grounded Sources:
                      </p>
                      {m.sources.map((src) => (
                        <button
                          key={src.id}
                          onClick={() => onOpenSource(src)}
                          className="block text-amber-300 hover:underline font-medium truncate"
                        >
                          ⓘ {src.title} ({src.authority})
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Suggested Followups */}
                  {m.suggested_followups && m.suggested_followups.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {m.suggested_followups.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(s)}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] text-amber-300 hover:border-amber-500/50 transition"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="block text-[9px] text-slate-500 text-right">
                    {m.timestamp}
                  </span>
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic bg-slate-950 p-3 rounded-xl border border-slate-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>Checking official government sources...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-slate-800 bg-slate-950">
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
                placeholder="Ask about documents, rules, or fees..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-50 transition"
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
