import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Clock, FileText, Globe, Award, DollarSign, Target } from 'lucide-react';

export const ImpactDashboard = () => {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    // In a real implementation, this would fetch from GET /api/v1/admin/impact
    setMetrics({
      portals_avoided: 12450,
      documents_avoided: 34200,
      manual_fields_avoided: 184500,
      processing_time_saved_hours: 84000,
      citizen_satisfaction: 98.4,
      bureaucratic_cost_saved: 12500000 // In rupees
    });
  }, []);

  if (!metrics) return <div className="text-white p-8 animate-pulse text-center">Loading Impact Data...</div>;

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <span>National Impact Metrics</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Real-time quantification of citizen friction reduced across India.</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
          <div className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest text-center">Satisfaction Score</div>
          <div className="text-2xl font-black text-emerald-400 text-center">{metrics.citizen_satisfaction}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-xl">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Globe className="w-32 h-32 text-blue-500" />
          </div>
          <div className="bg-blue-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-blue-500/30">
            <Globe className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-4xl font-black text-white mb-1">{metrics.portals_avoided.toLocaleString()}</div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Portals Bypassed</div>
          <p className="text-xs text-slate-500 mt-2">Times a citizen didn't have to create a new account.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-xl">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <FileText className="w-32 h-32 text-pink-500" />
          </div>
          <div className="bg-pink-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-pink-500/30">
            <FileText className="w-6 h-6 text-pink-400" />
          </div>
          <div className="text-4xl font-black text-white mb-1">{metrics.documents_avoided.toLocaleString()}</div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Docs Avoided</div>
          <p className="text-xs text-slate-500 mt-2">Redundant uploads prevented via API fetching.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-xl">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Target className="w-32 h-32 text-amber-500" />
          </div>
          <div className="bg-amber-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-amber-500/30">
            <Target className="w-6 h-6 text-amber-400" />
          </div>
          <div className="text-4xl font-black text-white mb-1">{metrics.manual_fields_avoided.toLocaleString()}</div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Fields Autofilled</div>
          <p className="text-xs text-slate-500 mt-2">Keystrokes saved through the Canonical Data Model.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-xl">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Clock className="w-32 h-32 text-indigo-500" />
          </div>
          <div className="bg-indigo-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-indigo-500/30">
            <Clock className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="text-4xl font-black text-white mb-1">{metrics.processing_time_saved_hours.toLocaleString()}</div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Hours Saved</div>
          <p className="text-xs text-slate-500 mt-2">Cumulative time saved in application processing.</p>
        </div>

      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center mt-12 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-slate-900 to-emerald-500/5" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-slate-950 p-4 rounded-full border border-slate-800 mb-6">
            <Award className="w-12 h-12 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-300 mb-2">Estimated Economic Impact</h3>
          <div className="text-6xl font-black text-white mb-4 tracking-tighter">
            <span className="text-emerald-500">₹</span>{((metrics.bureaucratic_cost_saved) / 100000).toFixed(1)} <span className="text-emerald-500">Lakhs</span>
          </div>
          <p className="text-slate-400 max-w-lg mx-auto leading-relaxed">
            Saved by Government departments through automated verification, reduced manual data entry, and lower document storage requirements.
          </p>
        </div>
      </div>
    </div>
  );
};
