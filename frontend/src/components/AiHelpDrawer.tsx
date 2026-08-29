'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, ShieldCheck, Bot, User, RefreshCw, Maximize2, Minimize2, Copy, Check } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: step
        ? `Hello! I am SetuSahayak for **${step.title}**. Ask me why this step is required, what alternative documents are accepted, or how official guidelines apply to your context.`
        : 'Namaste! I am SetuSahayak. Ask me any question about your active journey requirements, official documents, or government schemes.',
      sources: step?.official_sources || [],
      suggested_followups: [
        'Why do I need this document?',
        'What alternative documents are accepted?',
        'Explain in simple Hindi'
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `user_${Date.now()}_${Math.random()}`;
    const aiMsgId = `ai_${Date.now()}_${Math.random()}`;

    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: time
    };

    const initialAiMsg: ChatMessage = {
      id: aiMsgId,
      sender: 'ai',
      text: 'Thinking...',
      sources: step?.official_sources || [],
      timestamp: time
    };

    setMessages((prev) => [...prev, userMsg, initialAiMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      // Build context for streaming service
      const context = {
        activeScheme: journeyId.replace(/_/g, ' ').toUpperCase(),
        currentStep: step?.title || 'Document & Verification Step',
        requiredDocuments: (step?.required_documents || []).map((doc: any) => typeof doc === 'string' ? doc : (doc.name || doc.title || doc.id || 'Document'))
      };

      const finalAnswer = await streamCivicHelp(query, context, (streamedText) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId ? { ...msg, text: streamedText } : msg
          )
        );
      });

      if (finalAnswer) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId ? { ...msg, text: finalAnswer } : msg
          )
        );
      }
    } catch (e) {
      console.error('Error in AiHelpDrawer stream:', e);
      try {
        const res = await askAiChatAPI(query, journeyId, step?.id);
        const reply = res.reply || res.answer || 'Based on official government guidelines, this step ensures verified compliance before license issuance or benefit sanction.';
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  text: reply,
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
                  text: 'I am here to help you navigate your citizen journey. Please try asking your question again.'
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
    /* Floating Chatbot Widget with Expand / Minimize Support */
    <div
      role="dialog"
      aria-label="SetuSahayak Floating Copilot"
      className={`fixed z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-200 ${
        isExpanded
          ? 'inset-4 sm:inset-10 md:inset-16 max-w-5xl mx-auto h-auto'
          : 'bottom-5 right-5 w-[380px] sm:w-[460px] md:w-[500px] max-w-[calc(100vw-1.5rem)] h-[560px] max-h-[88vh]'
      }`}
    >
      {/* Header Bar */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#0f3470] flex items-center justify-center text-white shadow-sm shrink-0">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">SetuSahayak</h3>
              <span className="text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                Grounded
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
              {step ? step.title : 'Citizen Journey & Scheme Copilot'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            aria-label={isExpanded ? "Collapse" : "Expand"}
            title={isExpanded ? "Restore standard size" : "Expand to wide view"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            aria-label="Close SetuSahayak"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Log */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 bg-slate-50/40 dark:bg-slate-950/30 text-xs">
        {messages.map((m, mIdx) => (
          <div
            key={m.id ? `${m.id}_${mIdx}` : `msg_${mIdx}`}
            className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'ai' && (
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0 mt-0.5 shadow-2xs">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`p-3.5 rounded-2xl max-w-[94%] leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-[#0f3470] text-white rounded-br-none font-normal'
                  : 'bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-sm w-full'
              }`}
            >
              {/* Message Content with proper contrasting text colors */}
              <div
                className={`text-[12px] leading-relaxed whitespace-pre-wrap font-normal ${
                  m.sender === 'user' ? 'text-white font-medium' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                {m.text || (m.sender === 'ai' ? 'Thinking...' : '')}
              </div>

              {/* Follow-up suggestions on initial greeting */}
              {mIdx === 0 && m.suggested_followups && m.suggested_followups.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-1.5">
                  {m.suggested_followups.map((f, fIdx) => (
                    <button
                      key={fIdx}
                      onClick={() => handleSend(f)}
                      className="text-left px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-300 text-[11px] font-medium border border-blue-200/60 dark:border-blue-800/60 transition cursor-pointer"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}

              {/* Sources Grounding links */}
              {m.sources && m.sources.length > 0 && m.text && m.text !== 'Thinking...' && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-[10px] space-y-1 mt-2">
                  <p className="text-slate-500 dark:text-slate-400 font-semibold text-[10px] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Verified Official Sources:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {m.sources.map((src, sIdx) => (
                      <button
                        key={src.id ? `${src.id}_${sIdx}` : `src_${mIdx}_${sIdx}`}
                        onClick={() => onOpenSource(src)}
                        className="text-blue-600 dark:text-amber-300 hover:underline font-medium truncate cursor-pointer text-left px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 block"
                      >
                        ⓘ {src.title} ({src.authority})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer actions: 1-Click Copy and Timestamp */}
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/80 dark:border-slate-700/60 text-[9px]">
                {m.sender === 'ai' && m.text && m.text !== 'Thinking...' ? (
                  <button
                    onClick={() => handleCopy(m.text, m.id)}
                    className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-amber-300 font-semibold py-0.5 px-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                    title="Copy full advisory"
                  >
                    {copiedId === m.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Advisory</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span />
                )}
                <span className={m.sender === 'user' ? 'text-blue-200 font-medium' : 'text-slate-400 dark:text-slate-500'}>
                  {m.timestamp}
                </span>
              </div>
            </div>

            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs italic bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/70 shadow-2xs">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-amber-400 animate-spin" />
            <span>Consulting official land registries and legal statutes...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
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
            placeholder="Ask SetuSahayak any question about land, schemes, or citizen processes..."
            className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800 transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 bg-[#0f3470] hover:bg-[#0c2957] disabled:opacity-40 text-white rounded-xl transition shadow-xs shrink-0 cursor-pointer flex items-center gap-1 px-3"
            aria-label="Send"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline text-xs font-semibold">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiHelpDrawer;
