'use client';

import React from 'react';
import { 
  Lightbulb, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../../app/store';

export default function InsightsSidePanel() {
  const { insights, toggleMeetingMode } = useAppStore();

  if (!insights) {
    return (
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
        <div className="h-20 bg-slate-100 dark:bg-slate-900/50 rounded-xl"></div>
        <div className="h-10 bg-slate-100 dark:bg-slate-900/50 rounded-xl"></div>
      </div>
    );
  }

  const { executive_summary, highlights, concerns } = insights;

  return (
    <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-6">
      <div className="space-y-6">
        {/* Title */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">
            AI Narrative Insights
          </h3>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Executive Overview</h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {executive_summary}
          </p>
        </div>

        {/* Highlights */}
        {highlights && highlights.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Key Highlights</h4>
            <div className="space-y-2">
              {highlights.slice(0, 3).map((hl: any, i: number) => (
                <div key={i} className="flex gap-2.5 items-start bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-400">
                  <span className="text-sm leading-none">{hl.emoji || '✨'}</span>
                  <p className="leading-tight font-medium">{hl.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Concerns */}
        {concerns && concerns.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Priority Issues</h4>
            <div className="space-y-2">
              {concerns.slice(0, 2).map((con: any, i: number) => {
                const isHigh = con.severity === 'high';
                return (
                  <div key={i} className={`flex gap-2.5 items-start p-2.5 rounded-lg text-[11px] border ${
                    isHigh
                      ? 'bg-rose-500/5 border-rose-500/15 text-rose-800 dark:text-rose-400'
                      : 'bg-amber-500/5 border-amber-500/15 text-amber-800 dark:text-amber-400'
                  }`}>
                    <span className="text-sm leading-none">{con.emoji || '⚠️'}</span>
                    <p className="leading-tight font-medium">
                      <span className="font-bold uppercase text-[9px] mr-1">[{con.severity}]</span>
                      {con.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Button to open meeting mode */}
      <button
        onClick={() => toggleMeetingMode(true)}
        className="w-full bg-[#1E293B] hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all active:scale-[0.98]"
      >
        Open Boardroom Briefing
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
