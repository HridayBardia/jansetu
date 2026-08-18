'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchJourneyByIdAPI, completeStepAPI, askAiChatAPI, fetchSourcesAPI, toggleConsentAPI } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  MapPin, CheckCircle2, Lock, ArrowLeft, Network, FileText, ShieldCheck,
  HelpCircle, ExternalLink, AlertTriangle, Sparkles, Send, Loader2, Radio, Check, FileCheck
} from 'lucide-react';

export default function JourneyDetailPage() {
  const params = useParams();
  const journeyId = (params?.id as string) || 'journey_biz_vadodara_1';

  const [journey, setJourney] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'graph' | 'docs' | 'eligibility'>('timeline');
  
  // Real-time WebSocket hook
  const { connectionStatus, lastEvent } = useWebSocket(journeyId);

  // Chat & Drawers state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; citations?: any[] }>>([
    {
      sender: 'ai',
      text: 'Hello! I am your AI Citizen Assistant. Ask me anything about required documents, legal prerequisites, or state subsidies.'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Source drawer state
  const [selectedSource, setSelectedSource] = useState<any | null>(null);

  const loadJourney = useCallback(async () => {
    const data = await fetchJourneyByIdAPI(journeyId);
    if (data) setJourney(data);
  }, [journeyId]);

  useEffect(() => {
    loadJourney();
  }, [loadJourney]);

  // Listen for WebSocket step update events to refetch automatically
  useEffect(() => {
    if (lastEvent && (lastEvent.type === 'journey.step.updated' || lastEvent.type === 'journey.progress')) {
      loadJourney();
    }
  }, [lastEvent, loadJourney]);

  const handleCompleteStep = async (stepKey: string) => {
    const success = await completeStepAPI(journeyId, stepKey);
    if (success) {
      loadJourney();
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatInput('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsChatLoading(true);

    const res = await askAiChatAPI(userText, journeyId);
    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'ai',
        text: res.reply || res.answer || 'Based on official sources, this step is required for compliance.',
        citations: res.citations || []
      }
    ]);
    setIsChatLoading(false);
  };


  if (!journey) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 text-center space-y-4">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Loading personalized citizen journey...</p>
      </div>
    );
  }

  const nba = journey.next_best_action;

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* 1. Header Navigation & Connection Badge */}
      <div className="flex items-center justify-between text-xs">
        <Link href="/" className="inline-flex items-center gap-1 text-slate-400 hover:text-amber-400 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">WebSocket:</span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold ${
            connectionStatus === 'connected'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            <Radio className={`w-3 h-3 ${connectionStatus === 'connected' ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
            {connectionStatus === 'connected' ? '🟢 Live' : '🟡 Reconnecting'}
          </span>
        </div>
      </div>

      {/* 2. Main Journey Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                {journey.goal_category}
              </span>
              <span className="text-xs text-slate-400">📍 {journey.location_state} ({journey.location_city})</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white">{journey.title}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-400">Journey Progress</p>
              <p className="text-2xl font-black text-amber-400">{journey.progress_percentage}%</p>
            </div>
            <button
              onClick={() => setIsChatOpen(true)}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Ask AI Assistant</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${journey.progress_percentage}%` }}
          />
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Timeline Workflow ({journey.steps?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'graph'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Journey Map (DAG)</span>
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'docs'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Document Vault</span>
          </button>
          <button
            onClick={() => setActiveTab('eligibility')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'eligibility'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Eligibility Status</span>
          </button>
        </div>
      </div>

      {/* 3. Next Best Action Card */}
      {nba && (
        <div className="bg-gradient-to-r from-amber-950/40 via-orange-950/20 to-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              ⚡ Recommended Next Step
            </span>
            <span className="text-xs text-slate-400">Est. effort: {nba.estimated_effort}</span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white">{nba.title}</h3>
            <p className="text-xs text-slate-300 mt-1">{nba.reason}</p>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={() => handleCompleteStep(nba.step_key)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20"
            >
              <span>Complete Step</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Tab Content */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300">Step-by-Step Workflow Checklist</h3>
          <div className="space-y-3">
            {journey.steps?.map((step: any, idx: number) => {
              const isCompleted = step.state === 'COMPLETED';
              const isAvailable = step.state === 'AVAILABLE';
              const isLocked = step.state === 'LOCKED';

              return (
                <div
                  key={step.step_key}
                  className={`bg-slate-900 border rounded-xl p-5 transition space-y-3 ${
                    isCompleted
                      ? 'border-emerald-500/30 bg-emerald-950/10'
                      : isAvailable
                      ? 'border-amber-500/50 bg-slate-900'
                      : 'border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                        isCompleted
                          ? 'bg-emerald-500 text-slate-950'
                          : isAvailable
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{step.title}</h4>
                          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isAvailable
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {step.state}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{step.description}</p>
                      </div>
                    </div>

                    {isAvailable && (
                      <button
                        onClick={() => handleCompleteStep(step.step_key)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs shrink-0 transition"
                      >
                        Mark Complete
                      </button>
                    )}

                    {isCompleted && (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-4 h-4" /> Completed
                      </span>
                    )}

                    {isLocked && (
                      <span className="text-xs text-slate-500 flex items-center gap-1 shrink-0">
                        <Lock className="w-3.5 h-3.5" /> Prerequisite Required
                      </span>
                    )}
                  </div>

                  {step.official_portal_url && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>Official Portal:</span>
                      <a
                        href={step.official_portal_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 hover:underline flex items-center gap-1"
                      >
                        Open Government Portal <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'graph' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-amber-400" />
              <span>DAG Dependency Journey Graph</span>
            </h3>
            <span className="text-xs text-slate-400">Prerequisite Topological Sort</span>
          </div>

          <div className="space-y-4">
            {journey.steps?.map((step: any, idx: number) => (
              <div key={step.step_key} className="relative flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 border ${
                  step.state === 'COMPLETED'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : step.state === 'AVAILABLE'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}>
                  S{idx + 1}
                </div>

                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white">{step.title}</h5>
                    <p className="text-[11px] text-slate-400">
                      Prerequisites: {step.prerequisites?.length > 0 ? step.prerequisites.join(', ') : 'None (Root Node)'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    step.state === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {step.state}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Citizen Document Vault</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              DigiLocker Sandbox Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Aadhaar Card</span>
                <span className="text-emerald-400 font-semibold">✓ Verified</span>
              </div>
              <p className="text-[11px] text-slate-400">Fetched via DigiLocker Sandbox API</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">PAN Card</span>
                <span className="text-emerald-400 font-semibold">✓ Verified</span>
              </div>
              <p className="text-[11px] text-slate-400">Fetched via DigiLocker Sandbox API</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Premises Rent Agreement</span>
                <span className="text-amber-400 font-semibold">Pending Upload</span>
              </div>
              <p className="text-[11px] text-slate-400">Required for Shop Act & GSTIN</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'eligibility' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Deterministic Eligibility Breakdown</span>
          </h3>
          <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">Status: VERIFIED_ELIGIBLE</span>
              <span className="text-xs text-slate-400">2 Rules Evaluated</span>
            </div>
            <p className="text-xs text-slate-300">
              Citizen meets standard government regulatory guidelines for this journey location.
            </p>
          </div>
        </div>
      )}

      {/* 5. Contextual AI Chat Side Panel */}
      {isChatOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white">Contextual AI Assistant</h4>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl max-w-[85%] ${
                  msg.sender === 'user'
                    ? 'bg-amber-500/20 text-amber-100 ml-auto border border-amber-500/30'
                    : 'bg-slate-950 text-slate-200 border border-slate-800'
                }`}
              >
                <p>{msg.text}</p>
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                    <span className="text-[10px] text-amber-400 font-semibold">Source Citations:</span>
                    {msg.citations.map((c: any, ci: number) => (
                      <div key={ci} className="text-[10px] text-slate-400 bg-slate-900 p-1.5 rounded">
                        <p className="font-semibold text-slate-300">{c.title}</p>
                        <p>{c.department}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isChatLoading && (
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>AI is verifying official sources...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask why a document is required..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs flex items-center justify-center transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
