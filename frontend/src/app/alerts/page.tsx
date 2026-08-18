'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAlertsAPI, SystemAlert } from '@/lib/api';
import { Bell, ArrowRight, ExternalLink, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchAlertsAPI(filter === 'all' ? undefined : filter).then((data) => setAlerts(data));
  }, [filter]);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
              <Bell className="w-3.5 h-3.5" />
              <span>Personalized Impact Engine</span>
            </div>
            <h1 className="text-2xl font-black text-white">What Affects You?</h1>
            <p className="text-xs text-slate-400 mt-1">
              Official regulatory changes and policy updates mapped directly to your active citizen journeys.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1 border border-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                filter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('business')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                filter === 'business' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Business
            </button>
            <button
              onClick={() => setFilter('education')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                filter === 'education' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Education
            </button>
          </div>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
            No active regulatory alerts found for your filter.
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 space-y-3 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      {alert.journey_category}
                    </span>
                    <span className="text-xs text-slate-400">Effective: {alert.effective_date}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1.5">{alert.title}</h3>
                </div>
                <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  High Priority
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 space-y-1">
                <span className="text-[11px] font-bold text-amber-300">Why this matters to you:</span>
                <p className="text-xs text-slate-300">{alert.impact_summary}</p>
              </div>

              {alert.action_required && (
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-400 font-medium">Recommended Action: {alert.action_required}</span>
                  <button
                    onClick={() => router.push(alert.journey_category === 'business' ? '/journeys/journey_biz_vadodara_1' : '/journeys/journey_edu_gujarat_1')}
                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                  >
                    <span>Review Step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
