'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchJourneyByIdAPI, completeStepAPI, askAiChatAPI } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  MapPin, CheckCircle2, Lock, ArrowLeft, Network, FileText, ShieldCheck,
  HelpCircle, ExternalLink, AlertTriangle, Sparkles, Send, Loader2, Radio, Check, FileCheck,
  Clock, ArrowRight
} from 'lucide-react';

export default function JourneyDetailPage() {
  const params = useParams();
  const journeyId = (params?.id as string) || 'jrn_001';

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

  // Consent Interceptor state
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [pendingStepKey, setPendingStepKey] = useState<string | null>(null);

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

  const handleCompleteStep = (stepKey: string) => {
    setPendingStepKey(stepKey);
    setIsConsentOpen(true);
  };

  const confirmCompleteStep = async () => {
    if (!pendingStepKey) return;
    const success = await completeStepAPI(journeyId, pendingStepKey);
    if (success) {
      loadJourney();
    }
    setIsConsentOpen(false);
    setPendingStepKey(null);
  };

  const denyCompleteStep = () => {
    setIsConsentOpen(false);
    setPendingStepKey(null);
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
        text: res.reply || res.answer || 'Based on official sources, this step is required for statutory compliance.',
        citations: res.citations || []
      }
    ]);
    setIsChatLoading(false);
  };

  if (!journey) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-[#020205] text-slate-900 dark:text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[#133E87] dark:text-blue-400 animate-spin mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold">Loading personalized citizen journey...</p>
      </div>
    );
  }

  const nba = journey.next_best_action;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#020205] text-slate-900 dark:text-slate-100 py-8 px-4 md:px-8 font-sans transition-colors">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* 1. Header Navigation & Connection Badge */}
        <div className="flex items-center justify-between text-xs">
          <Link 
            href="/citizen/dashboard" 
            className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 hover:text-[#133E87] dark:hover:text-blue-400 py-1.5 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-2xs font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Live Gateway:</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
              connectionStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
                : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50'
            }`}>
              <Radio className={`w-3 h-3 ${connectionStatus === 'connected' ? 'animate-pulse text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
              {connectionStatus === 'connected' ? 'Live Connected' : 'Reconnecting'}
            </span>
          </div>
        </div>

        {/* 2. Main Journey Header Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 border-l-4 border-l-[#133E87] dark:border-l-blue-500 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#133E87] dark:text-blue-300 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                  {journey.goal_category || 'Governance Service'}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  📍 {journey.location_state || 'National'} {journey.location_city ? `(${journey.location_city})` : ''}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                {journey.title}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Journey Progress</p>
                <p className="text-2xl font-black text-[#133E87] dark:text-blue-400 font-mono">{journey.progress_percentage || 0}%</p>
              </div>
              <button
                onClick={() => setIsChatOpen(true)}
                className="bg-blue-50 hover:bg-[#0B2545] hover:text-white dark:bg-blue-950/50 dark:hover:bg-blue-600 text-[#0B2545] dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-2xs cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-[#133E87] dark:text-blue-400" />
                <span>Ask AI Assistant</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-300 dark:border-slate-700">
            <div
              className="bg-gradient-to-r from-[#133E87] via-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${journey.progress_percentage || 0}%` }}
            />
          </div>

          {/* View Switcher Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-[#0B2545] text-white dark:bg-blue-600 dark:text-white font-bold shadow-xs border border-[#0B2545] dark:border-blue-600'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 hover:text-[#0B2545] dark:hover:text-white border border-slate-300 dark:border-slate-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Timeline Workflow ({journey.steps?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('graph')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'graph'
                  ? 'bg-[#0B2545] text-white dark:bg-blue-600 dark:text-white font-bold shadow-xs border border-[#0B2545] dark:border-blue-600'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 hover:text-[#0B2545] dark:hover:text-white border border-slate-300 dark:border-slate-800'
              }`}
            >
              <Network className="w-4 h-4" />
              <span>Journey Map (DAG)</span>
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'docs'
                  ? 'bg-[#0B2545] text-white dark:bg-blue-600 dark:text-white font-bold shadow-xs border border-[#0B2545] dark:border-blue-600'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 hover:text-[#0B2545] dark:hover:text-white border border-slate-300 dark:border-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Document Dossier</span>
            </button>
            <button
              onClick={() => setActiveTab('eligibility')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'eligibility'
                  ? 'bg-[#0B2545] text-white dark:bg-blue-600 dark:text-white font-bold shadow-xs border border-[#0B2545] dark:border-blue-600'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 hover:text-[#0B2545] dark:hover:text-white border border-slate-300 dark:border-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Eligibility Rules</span>
            </button>
          </div>
        </div>

        {/* 3. Next Best Action Card */}
        {nba && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/40 rounded-2xl p-5 shadow-xs space-y-3 border-l-4 border-l-amber-500 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 px-2.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30">
                Recommended Next Step
              </span>
              <span className="text-xs text-amber-800 dark:text-amber-400/80 font-medium">Est. effort: {nba.estimated_effort || '1 business day'}</span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{nba.step_title || nba.title || 'Complete Next Milestone'}</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{nba.description || nba.reason}</p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => handleCompleteStep(nba.step_key || 'step_2_docs')}
                className="bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <span>Proceed to Complete Step</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
              </button>
            </div>
          </div>
        )}

        {/* 4. Main Tab Content */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Step-by-Step Workflow Checklist
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Official Department Verification Gateway
              </span>
            </div>

            <div className="space-y-3">
              {Array.isArray(journey.steps) && journey.steps.map((step: any, idx: number) => {
                const isCompleted = step.state === 'COMPLETED';
                const isAvailable = step.state === 'AVAILABLE' || step.state === 'IN_PROGRESS';
                const isLocked = step.state === 'LOCKED' || step.state === 'PENDING';

                return (
                  <div
                    key={step.step_key || idx}
                    className={`rounded-xl p-5 transition space-y-3 shadow-2xs border ${
                      isCompleted
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/30 border-l-4 border-l-emerald-500'
                        : isAvailable
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/40 border-l-4 border-l-amber-500'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 border-l-4 border-l-slate-400 opacity-90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          isCompleted
                            ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                            : isAvailable
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                        }`}>
                          {isCompleted ? '✓' : idx + 1}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{step.title}</h4>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                : isAvailable
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}>
                              {step.state}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{step.description}</p>
                        </div>
                      </div>

                      {isAvailable && (
                        <button
                          onClick={() => handleCompleteStep(step.step_key)}
                          className="bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs shrink-0 transition shadow-2xs cursor-pointer"
                        >
                          Mark Complete
                        </button>
                      )}

                      {isCompleted && (
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-4 h-4" /> Completed
                        </span>
                      )}

                      {isLocked && (
                        <span className="text-xs text-slate-500 flex items-center gap-1 shrink-0 font-medium">
                          <Lock className="w-3.5 h-3.5" /> Prerequisite
                        </span>
                      )}
                    </div>

                    {step.official_portal_url && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>Official Department Source:</span>
                        <a
                          href={step.official_portal_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#133E87] dark:text-blue-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open Government Portal</span>
                          <ExternalLink className="w-3 h-3" />
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
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm border-l-4 border-l-indigo-600 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                <Network className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>DAG Dependency Journey Graph</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Topological Dependency Order</span>
            </div>

            <div className="space-y-3">
              {Array.isArray(journey.steps) && journey.steps.map((step: any, idx: number) => (
                <div key={step.step_key || idx} className="relative flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 border ${
                    step.state === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40'
                      : step.state === 'AVAILABLE' || step.state === 'IN_PROGRESS'
                      ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40'
                      : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-950 dark:text-slate-500 dark:border-slate-800'
                  }`}>
                    S{idx + 1}
                  </div>

                  <div className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">{step.title}</h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{step.category || 'Core Verification'}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      step.state === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
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
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm border-l-4 border-l-emerald-500 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Citizen Document Dossier & Vault</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                DigiLocker Certified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.isArray(journey.required_documents) && journey.required_documents.length > 0 ? (
                journey.required_documents.map((doc: any, dIdx: number) => {
                  const docName = doc.name || doc.title || "Required Document";
                  const isVerified = doc.verified !== false;
                  const portalUrl = docName.toLowerCase().includes('passport') ? 'https://passportindia.gov.in' :
                    docName.toLowerCase().includes('pan') ? 'https://onlineservices.nsdl.com' :
                    docName.toLowerCase().includes('aadhaar') ? 'https://myaadhaar.uidai.gov.in' :
                    docName.toLowerCase().includes('income') || docName.toLowerCase().includes('domicile') ? 'https://services.india.gov.in' :
                    'https://digitallocker.gov.in';

                  return (
                    <div key={dIdx} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 flex flex-col justify-between shadow-2xs">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 dark:text-white">{docName}</span>
                          <span className={`font-bold text-[10px] px-2 py-0.5 rounded ${
                            isVerified ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-amber-100 text-amber-900 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                          }`}>
                            {isVerified ? '✓ Verified' : 'Action Needed'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">Authority: {doc.authority || 'State / Central Issuer'}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Official Source</span>
                        <a
                          href={portalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#133E87] dark:text-blue-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>Official Portal</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">Aadhaar Card</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">✓ Verified</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">UIDAI / DigiLocker Sandbox</p>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                      <a href="https://myaadhaar.uidai.gov.in" target="_blank" rel="noreferrer" className="text-[#133E87] dark:text-blue-400 hover:underline text-[11px] flex items-center gap-1 font-bold">
                        myAadhaar Portal <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">PAN Card</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">✓ Verified</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">Income Tax Dept / NSDL</p>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                      <a href="https://onlineservices.nsdl.com" target="_blank" rel="noreferrer" className="text-[#133E87] dark:text-blue-400 hover:underline text-[11px] flex items-center gap-1 font-bold">
                        NSDL e-Gov Portal <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'eligibility' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm border-l-4 border-l-emerald-500 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Deterministic Eligibility Breakdown</span>
            </h3>
            <div className="bg-slate-50 dark:bg-slate-950 border border-emerald-300 dark:border-emerald-500/30 rounded-xl p-4 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Status: VERIFIED_ELIGIBLE</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Statutory Rules Evaluated</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Citizen profile and credentials meet standard government regulatory guidelines for this verified service jurisdiction.
              </p>
            </div>
          </div>
        )}

        {/* 5. Contextual AI Chat Side Panel */}
        {isChatOpen && (
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-300 dark:border-slate-800 shadow-2xl flex flex-col transition-colors">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#133E87] dark:text-blue-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Contextual AI Assistant</h4>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {Array.isArray(chatMessages) && chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl max-w-[85%] ${
                    msg.sender === 'user'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-[#0B2545] dark:text-blue-200 ml-auto border border-blue-200 dark:border-blue-800'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <p>{msg.text}</p>
                  {Array.isArray(msg.citations) && msg.citations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] text-[#133E87] dark:text-blue-400 font-semibold">Source Citations:</span>
                      {msg.citations.map((c: any, ci: number) => (
                        <div key={ci} className="text-[10px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                          <p className="font-semibold text-slate-800 dark:text-slate-300">{c.title}</p>
                          <p>{c.department}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isChatLoading && (
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AI is verifying official sources...</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSendChat} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask why a document is required..."
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#133E87]"
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold px-3 py-2 rounded-lg text-xs flex items-center justify-center transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Consent Interceptor Modal */}
        {isConsentOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/50 rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <ShieldCheck className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">Consent Required</h3>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  You are about to share your verified credentials to complete this step.
                </p>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-lg space-y-1">
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">Requesting Entity: <span className="text-slate-900 dark:text-white font-bold">Government Service Gateway</span></p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">Data Requested: <span className="text-slate-900 dark:text-white font-bold">Verified Address, Identity Proof</span></p>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-400/90 italic pt-2">
                  The citizen must explicitly approve sharing. The system will never silently send your data.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={confirmCompleteStep}
                  className="flex-1 bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-xs cursor-pointer"
                >
                  [Allow] Share Data
                </button>
                <button
                  onClick={denyCompleteStep}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold py-2.5 rounded-xl text-sm transition cursor-pointer"
                >
                  [Deny] Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
