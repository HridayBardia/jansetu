'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchJourneyByIdAPI, completeStepAPI, askAiChatAPI } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useLiveSync } from '@/context/LiveSyncContext';
import {
  MapPin, CheckCircle2, Lock, ArrowLeft, Network, FileText, ShieldCheck,
  HelpCircle, ExternalLink, AlertTriangle, Sparkles, Send, Loader2, Radio, Check, FileCheck,
  Clock, ArrowRight, RefreshCw, RotateCcw, Award, CheckSquare
} from 'lucide-react';

export default function JourneyDetailPage() {
  const params = useParams();
  const journeyId = (params?.id as string) || 'jrn_001';
  const { updateJourney } = useLiveSync();

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
  const [actionNotice, setActionNotice] = useState<string | null>(null);

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

  // Helper to synchronize journey state to all persistence layers
  const syncJourneyUpdates = (updatedJourney: any) => {
    // 1. LiveSyncContext
    updateJourney(journeyId, {
      steps: updatedJourney.steps,
      progress: updatedJourney.progress_percentage,
      progress_percentage: updatedJourney.progress_percentage,
      currentStage: updatedJourney.currentStage,
      status: updatedJourney.progress_percentage === 100 ? 'Completed' : 'In Progress'
    });

    // 2. localStorage dual caching
    if (typeof window !== 'undefined') {
      try {
        const cached = JSON.parse(localStorage.getItem('jansetu_active_journeys') || '[]');
        let found = false;
        const newCache = cached.map((j: any) => {
          if (j.id === journeyId || j.journey_id === journeyId) {
            found = true;
            return {
              ...j,
              steps: updatedJourney.steps,
              progress: updatedJourney.progress_percentage,
              progress_percentage: updatedJourney.progress_percentage,
              currentStage: updatedJourney.currentStage,
              status: updatedJourney.progress_percentage === 100 ? 'Completed' : 'In Progress'
            };
          }
          return j;
        });
        if (!found) {
          newCache.push({
            ...updatedJourney,
            id: journeyId,
            status: updatedJourney.progress_percentage === 100 ? 'Completed' : 'In Progress'
          });
        }
        localStorage.setItem('jansetu_active_journeys', JSON.stringify(newCache));
        localStorage.setItem('jansetu_journeys', JSON.stringify(newCache));
      } catch (e) {
        console.error("Failed to sync journey to cache", e);
      }
    }
  };

  // Direct instant step completion or toggle
  const completeStepDirectly = (targetStep: any) => {
    setJourney((prev: any) => {
      if (!prev || !Array.isArray(prev.steps)) return prev;

      const key = typeof targetStep === 'string' ? targetStep : (targetStep.step_key || targetStep.id || targetStep.title);
      let targetIndex = -1;

      const updatedSteps = prev.steps.map((s: any, idx: number) => {
        const isMatch =
          s.step_key === key ||
          s.id === key ||
          s.title === key ||
          `step_${idx + 1}` === key ||
          idx.toString() === key;

        if (isMatch) {
          targetIndex = idx;
          return {
            ...s,
            state: 'COMPLETED',
            status: 'COMPLETED'
          };
        }
        return s;
      });

      // Unlock next subsequent step if it was pending
      let firstUncompletedFound = false;
      for (let i = 0; i < updatedSteps.length; i++) {
        if (updatedSteps[i].state === 'COMPLETED' || updatedSteps[i].status === 'COMPLETED') {
          continue;
        }
        if (!firstUncompletedFound) {
          updatedSteps[i] = {
            ...updatedSteps[i],
            state: 'IN_PROGRESS',
            status: 'IN_PROGRESS'
          };
          firstUncompletedFound = true;
        }
      }

      const totalSteps = updatedSteps.length;
      const completedSteps = updatedSteps.filter((s: any) => s.state === 'COMPLETED' || s.status === 'COMPLETED').length;
      const newPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

      const nextPending = updatedSteps.find((s: any) => s.state !== 'COMPLETED' && s.status !== 'COMPLETED');
      const stepTitle = (targetIndex !== -1 && prev.steps[targetIndex]?.title) || 'Milestone';

      const updatedJourney = {
        ...prev,
        steps: updatedSteps,
        progress_percentage: newPct,
        progress: newPct,
        currentStage: nextPending ? nextPending.title : 'All Milestones Completed',
        next_best_action: nextPending ? {
          action_type: "NEXT_STEP",
          description: nextPending.description || `Proceed with next milestone: ${nextPending.title}`,
          priority: "HIGH",
          step_key: nextPending.step_key || nextPending.id,
          step_title: nextPending.title,
          estimated_effort: nextPending.estimated_effort || "1-2 business days"
        } : {
          action_type: "COMPLETED",
          description: "All statutory steps for this citizen service journey have been successfully completed.",
          priority: "LOW",
          step_key: "done",
          step_title: "Journey Fully Completed"
        }
      };

      syncJourneyUpdates(updatedJourney);

      setActionNotice(`✓ Completed: ${stepTitle} (${newPct}% Progress)`);
      setTimeout(() => setActionNotice(null), 3500);

      // Call backend in background
      completeStepAPI(journeyId, key).catch(() => {});

      return updatedJourney;
    });
  };

  // Reopen or mark step incomplete
  const handleReverifyStep = (targetStep: any) => {
    setJourney((prev: any) => {
      if (!prev || !Array.isArray(prev.steps)) return prev;

      const key = typeof targetStep === 'string' ? targetStep : (targetStep.step_key || targetStep.id || targetStep.title);
      let targetIndex = -1;

      const updatedSteps = prev.steps.map((s: any, idx: number) => {
        const isMatch = 
          s.step_key === key ||
          s.id === key ||
          s.title === key ||
          `step_${idx + 1}` === key ||
          idx.toString() === key;

        if (isMatch) {
          targetIndex = idx;
          return {
            ...s,
            state: 'IN_PROGRESS',
            status: 'IN_PROGRESS'
          };
        }
        return s;
      });

      // Relock all subsequent steps after the reopened step
      if (targetIndex !== -1) {
        for (let i = targetIndex + 1; i < updatedSteps.length; i++) {
          updatedSteps[i] = {
            ...updatedSteps[i],
            state: 'PENDING',
            status: 'PENDING'
          };
        }
      }

      const totalSteps = updatedSteps.length;
      const completedSteps = updatedSteps.filter((s: any) => s.state === 'COMPLETED' || s.status === 'COMPLETED').length;
      const newPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
      const stepTitle = (targetIndex !== -1 && prev.steps[targetIndex]?.title) || 'Milestone';

      const updatedJourney = {
        ...prev,
        steps: updatedSteps,
        progress_percentage: newPct,
        progress: newPct,
        currentStage: stepTitle,
        next_best_action: {
          action_type: "REVERIFY_STEP",
          description: `Re-verify documents and identity attributes for: ${stepTitle}`,
          priority: "HIGH",
          step_key: key,
          step_title: stepTitle,
          estimated_effort: "1 business day"
        }
      };

      syncJourneyUpdates(updatedJourney);

      setActionNotice(`↺ Reopened: ${stepTitle} (Progress updated to ${newPct}%)`);
      setTimeout(() => setActionNotice(null), 3500);

      return updatedJourney;
    });
  };

  // Reset entire workflow back to initial state
  const handleResetWorkflow = () => {
    if (!confirm('Are you sure you want to reset all steps in this workflow to pending?')) return;

    setJourney((prev: any) => {
      if (!prev || !Array.isArray(prev.steps)) return prev;

      const updatedSteps = prev.steps.map((s: any, idx: number) => ({
        ...s,
        state: idx === 0 ? 'IN_PROGRESS' : 'PENDING',
        status: idx === 0 ? 'IN_PROGRESS' : 'PENDING'
      }));

      const firstStep = updatedSteps[0] || {};
      const updatedJourney = {
        ...prev,
        steps: updatedSteps,
        progress_percentage: 0,
        progress: 0,
        currentStage: firstStep.title || 'Initial Milestone',
        next_best_action: {
          action_type: "NEXT_STEP",
          description: firstStep.description || `Start with first milestone: ${firstStep.title}`,
          priority: "HIGH",
          step_key: firstStep.step_key || firstStep.id,
          step_title: firstStep.title,
          estimated_effort: firstStep.estimated_effort || "1-2 business days"
        }
      };

      syncJourneyUpdates(updatedJourney);
      setActionNotice('Workflow has been reset to initial state (0% Progress).');
      setTimeout(() => setActionNotice(null), 3500);

      return updatedJourney;
    });
  };

  // Open Consent Modal for official flow
  const handleOpenConsentForStep = (stepOrKey: any) => {
    const key = typeof stepOrKey === 'string' ? stepOrKey : (stepOrKey?.step_key || stepOrKey?.id || stepOrKey?.title || 'step');
    setPendingStepKey(key);
    setIsConsentOpen(true);
  };

  const confirmCompleteStep = async () => {
    if (!pendingStepKey) return;
    const currentStepKey = pendingStepKey;
    setIsConsentOpen(false);
    setPendingStepKey(null);
    completeStepDirectly(currentStepKey);
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

  // Dynamic progress calculation directly derived from steps array
  const calculatedProgress = useMemo(() => {
    if (!journey || !Array.isArray(journey.steps) || journey.steps.length === 0) {
      return journey?.progress_percentage ?? journey?.progress ?? 0;
    }
    const completed = journey.steps.filter((s: any) => 
      s.state === 'COMPLETED' || s.status === 'COMPLETED' || (typeof s.state === 'string' && s.state.toUpperCase() === 'COMPLETED')
    ).length;
    return Math.round((completed / journey.steps.length) * 100);
  }, [journey]);

  const stepsList = useMemo(() => {
    return Array.isArray(journey?.steps) ? journey.steps : [];
  }, [journey]);

  const completedCount = useMemo(() => {
    return stepsList.filter((s: any) => 
      s.state === 'COMPLETED' || s.status === 'COMPLETED' || (typeof s.state === 'string' && s.state.toUpperCase() === 'COMPLETED')
    ).length;
  }, [stepsList]);

  const totalCount = stepsList.length;

  // Next pending step for quick button
  const nextPendingStep = useMemo(() => {
    return stepsList.find((s: any) => 
      s.state !== 'COMPLETED' && s.status !== 'COMPLETED' && (typeof s.state !== 'string' || s.state.toUpperCase() !== 'COMPLETED')
    );
  }, [stepsList]);

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
            href="/citizen/dashboard?tab=journeys" 
            className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 hover:text-[#133E87] dark:hover:text-blue-400 py-1.5 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-2xs font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Active Journeys</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Live Gateway:</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
              connectionStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
                : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50'
            }`}>
              <Radio className={`w-3 h-3 ${connectionStatus === 'connected' ? 'animate-pulse text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
              {connectionStatus === 'connected' ? 'Mesh Synced' : 'Connected'}
            </span>
          </div>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-xl p-3.5 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-sm animate-fadeIn">
            <span className="font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              {actionNotice}
            </span>
            <button 
              onClick={() => setActionNotice(null)}
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* 2. Main Journey Header Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 border-l-4 border-l-[#133E87] dark:border-l-blue-500 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#133E87] dark:text-blue-300 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                  {journey.goal_category || journey.category || 'Governance Service'}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  📍 {journey.location_state || journey.location || 'National'} {journey.location_city ? `(${journey.location_city})` : ''}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                {journey.title}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Progress Rate</p>
                <p className="text-2xl font-black text-[#133E87] dark:text-blue-400 font-mono">{calculatedProgress}%</p>
              </div>
              <button
                onClick={() => setIsChatOpen(true)}
                className="bg-blue-50 hover:bg-[#0B2545] hover:text-white dark:bg-blue-950/50 dark:hover:bg-blue-600 text-[#0B2545] dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-2xs cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-[#133E87] dark:text-blue-400" />
                <span>Ask AI</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>{completedCount} of {totalCount} Milestones Fulfilled</span>
              <span className="font-mono font-bold text-[#133E87] dark:text-blue-400">{calculatedProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-300 dark:border-slate-700">
              <div
                className="bg-gradient-to-r from-[#133E87] via-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${calculatedProgress}%` }}
              />
            </div>
          </div>

          {/* Live Interactive Actions Strip */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-700 dark:text-slate-300">Phase:</span>
              <span className="font-bold text-[#133E87] dark:text-blue-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800">
                {journey.currentStage || (nextPendingStep ? nextPendingStep.title : 'All Milestones Completed')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {nextPendingStep && (
                <button
                  onClick={() => completeStepDirectly(nextPendingStep)}
                  className="bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Advance Next Step</span>
                </button>
              )}
              {completedCount > 0 && (
                <button
                  onClick={handleResetWorkflow}
                  className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                  title="Reset all milestones"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
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
              <span>Timeline Workflow ({stepsList.length})</span>
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
              <span>DAG Journey Map ({completedCount}/{totalCount})</span>
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

        {/* 100% Completion Celebration Banner */}
        {calculatedProgress === 100 && (
          <div className="bg-gradient-to-r from-emerald-950 to-slate-900 border-2 border-emerald-500/60 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/50 flex items-center justify-center font-black text-xl shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-emerald-300">100% Milestones Fulfilled!</h3>
                <p className="text-xs text-slate-300">All statutory prerequisites and verification dossiers have been approved across the government mesh.</p>
              </div>
            </div>
            <Link
              href="/citizen/dashboard?tab=applications"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition shrink-0 text-center"
            >
              View in My Applications
            </Link>
          </div>
        )}

        {/* 3. Next Best Action Card */}
        {nba && calculatedProgress < 100 && (
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

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                onClick={() => completeStepDirectly(nba.step_key || nextPendingStep || 'step_1')}
                className="bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <span>Mark Step Complete</span>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </button>
              <button
                onClick={() => handleOpenConsentForStep(nba.step_key || nextPendingStep || 'step_1')}
                className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Authorize via Consent</span>
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
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {completedCount} Completed / {totalCount - completedCount} Incomplete
              </span>
            </div>

            <div className="space-y-3">
              {stepsList.map((step: any, idx: number) => {
                const isCompleted = step.state === 'COMPLETED' || step.status === 'COMPLETED' || (typeof step.state === 'string' && step.state.toUpperCase() === 'COMPLETED');
                const isAvailable = !isCompleted && (step.state === 'AVAILABLE' || step.state === 'IN_PROGRESS' || step.status === 'IN_PROGRESS' || idx === 0 || (stepsList[idx - 1] && (stepsList[idx - 1].state === 'COMPLETED' || stepsList[idx - 1].status === 'COMPLETED')));
                const isUpcoming = !isCompleted && !isAvailable;

                return (
                  <div
                    key={step.step_key || step.id || idx}
                    className={`rounded-xl p-5 transition space-y-3 shadow-2xs border ${
                      isCompleted
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/30 border-l-4 border-l-emerald-500'
                        : isAvailable
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/40 border-l-4 border-l-amber-500'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 border-l-4 border-l-slate-400 opacity-90'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-2xs ${
                          isCompleted
                            ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                            : isAvailable
                            ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                        }`}>
                          {isCompleted ? '✓' : idx + 1}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{step.title}</h4>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                : isAvailable
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}>
                              {isCompleted ? 'Completed' : isAvailable ? 'Current Milestone' : 'Upcoming Milestone'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{step.description}</p>
                        </div>
                      </div>

                      {/* Interactive Step Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-start shrink-0 pt-1 sm:pt-0">
                        {isCompleted && (
                          <>
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Fulfilled
                            </span>
                            <button
                              onClick={() => handleReverifyStep(step)}
                              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 font-bold px-2.5 py-1.5 rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Re-open this step and make it incomplete"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reopen</span>
                            </button>
                          </>
                        )}

                        {isAvailable && (
                          <>
                            <button
                              onClick={() => completeStepDirectly(step)}
                              className="bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition shadow-2xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Mark Complete</span>
                            </button>
                            <button
                              onClick={() => handleOpenConsentForStep(step)}
                              className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold px-2.5 py-1.5 rounded-lg text-[11px] transition cursor-pointer shadow-2xs"
                              title="Authorize with electronic consent"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                            </button>
                          </>
                        )}

                        {isUpcoming && (
                          <button
                            onClick={() => completeStepDirectly(step)}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-2xs flex items-center gap-1"
                          >
                            <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                            <span>Mark Complete</span>
                          </button>
                        )}
                      </div>
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

        {/* 5. DAG Journey Map Graph Tab */}
        {activeTab === 'graph' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm border-l-4 border-l-indigo-600 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                  <Network className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>DAG Execution Engine & Topological Mesh</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Click any milestone node to instantly toggle fulfillment.</p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 self-start sm:self-auto">
                Nodes Resolved: {completedCount}/{totalCount} ({calculatedProgress}%)
              </span>
            </div>

            <div className="space-y-3">
              {stepsList.map((step: any, idx: number) => {
                const isCompleted = step.state === 'COMPLETED' || step.status === 'COMPLETED' || (typeof step.state === 'string' && step.state.toUpperCase() === 'COMPLETED');
                const isAvailable = !isCompleted && (step.state === 'AVAILABLE' || step.state === 'IN_PROGRESS' || step.status === 'IN_PROGRESS' || idx === 0 || (stepsList[idx - 1] && (stepsList[idx - 1].state === 'COMPLETED' || stepsList[idx - 1].status === 'COMPLETED')));

                return (
                  <div key={step.step_key || step.id || idx} className="relative flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 border shadow-2xs ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40'
                        : isAvailable
                        ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40'
                        : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-950 dark:text-slate-500 dark:border-slate-800'
                    }`}>
                      {isCompleted ? '✓' : `S${idx + 1}`}
                    </div>

                    <div className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">{step.title}</h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{step.category || 'Core Verification'}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isCompleted 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' 
                            : isAvailable 
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {isCompleted ? 'RESOLVED' : isAvailable ? 'IN_PROGRESS' : 'PENDING'}
                        </span>
                        
                        <button
                          onClick={() => isCompleted ? handleReverifyStep(step) : completeStepDirectly(step)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition shadow-2xs cursor-pointer ${
                            isCompleted
                              ? 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                              : 'bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white'
                          }`}
                        >
                          {isCompleted ? '↺ Reopen' : '✓ Resolve'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. Document Dossier Tab */}
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
                    docName.toLowerCase().includes('voter') ? 'https://voters.eci.gov.in' :
                    docName.toLowerCase().includes('aadhaar') ? 'https://myaadhaar.uidai.gov.in' :
                    docName.toLowerCase().includes('income') || docName.toLowerCase().includes('domicile') || docName.toLowerCase().includes('ration') ? 'https://services.india.gov.in' :
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

        {/* 7. Eligibility Rules Tab */}
        {activeTab === 'eligibility' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm border-l-4 border-l-emerald-500 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Deterministic Eligibility Breakdown</span>
            </h3>
            <div className="bg-slate-50 dark:bg-slate-950 border border-emerald-300 dark:border-emerald-500/30 rounded-xl p-4 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Status: VERIFIED_ELIGIBLE</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Statutory Rules Evaluated</span>
              </div>
              <div className="space-y-3">
                {(Array.isArray(journey.eligibility_criteria) && journey.eligibility_criteria.length > 0) ? journey.eligibility_criteria.map((criteria: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${criteria.satisfied ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{criteria.criterion}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{criteria.note}</p>
                    </div>
                  </div>
                )) : (
                  <>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Identity & Residency</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Verified state residency and Aadhaar KYC authentication.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Statutory Pre-requisites</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Citizen profile meets standard government regulatory guidelines for this service.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 8. Contextual AI Chat Side Panel */}
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

        {/* 9. Consent Interceptor Modal */}
        {isConsentOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/50 rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <ShieldCheck className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">Statutory Consent Required</h3>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Under the Digital Personal Data Protection (DPDP) Act 2023, you are granting purpose-bound verification access for this milestone.
                </p>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-lg space-y-1">
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">Gateway: <span className="text-slate-900 dark:text-white font-bold">JanSetu NDEF Interop Node</span></p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">Attributes: <span className="text-slate-900 dark:text-white font-bold">Verified e-KYC & Document Hashes</span></p>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-400/90 italic pt-2">
                  You retain the right to revoke or restrict access at any time in your Privacy Center.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={confirmCompleteStep}
                  className="flex-1 bg-[#0B2545] hover:bg-[#133E87] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-xs cursor-pointer"
                >
                  [Allow] Authorize & Complete
                </button>
                <button
                  onClick={denyCompleteStep}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold py-2.5 rounded-xl text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
