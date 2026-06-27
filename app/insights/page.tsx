'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lightbulb, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle,
  Copy,
  Check,
  TrendingUp,
  Award,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '../store';

export default function InsightsPage() {
  const router = useRouter();
  const { sessionId, insights } = useAppStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      router.push('/');
    }
  }, [sessionId, router]);

  if (!sessionId) return null;

  if (!insights) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Loading narratives...</p>
      </div>
    );
  }

  const { health_score, executive_summary, highlights, concerns, insights: detailedInsights, recommendations, talking_points } = insights;

  const copyTalkingPoints = () => {
    const text = talking_points.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getHealthColor = (score: number) => {
    if (score >= 8.0) return 'text-emerald-500 border-emerald-500';
    if (score >= 6.0) return 'text-amber-500 border-amber-500';
    return 'text-rose-500 border-rose-500';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Page Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Narrative Briefings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
          Automated executive summaries, operational warnings, and statistical insights.
        </p>
      </div>

      {/* Top Section: Health Rating & Executive Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Health Score Badge (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center gap-4 text-center">
          <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest">Business Health Index</h3>
          <div className={`w-28 h-28 border-8 rounded-full flex flex-col items-center justify-center ${getHealthColor(health_score)}`}>
            <span className="text-3xl font-black text-slate-800 dark:text-white">{health_score}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            Weighted index combining duplicate rows, missing entries, outliers, and SLA vectors.
          </p>
        </div>

        {/* Executive Summary (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Executive Summary</span>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {executive_summary}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/50">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Cleaned Metrics</span>
              <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 font-semibold">100% processed</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Analysis Scope</span>
              <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 font-semibold">Pearson Matrix + K-Means</p>
            </div>
          </div>
        </div>
      </div>

      {/* Highlights & Concerns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Highlights */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/50 pb-3">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Key Operational Highlights
          </h3>
          <div className="space-y-3">
            {highlights.map((hl: any, idx: number) => (
              <div key={idx} className="flex gap-3 items-start bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-xl text-xs text-emerald-800 dark:text-emerald-400 font-medium">
                <span className="text-base leading-none">{hl.emoji || '✨'}</span>
                <p className="leading-relaxed">{hl.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Concerns */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/50 pb-3">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            Critical Risks & Warnings
          </h3>
          <div className="space-y-3">
            {concerns.map((con: any, idx: number) => (
              <div key={idx} className="flex gap-3 items-start bg-rose-500/5 dark:bg-rose-500/5 border border-rose-500/10 p-3.5 rounded-xl text-xs text-rose-800 dark:text-rose-400 font-medium">
                <span className="text-base leading-none">{con.emoji || '⚠️'}</span>
                <div>
                  <span className="font-bold uppercase text-[9px] mr-1">[{con.severity}]</span>
                  <p className="inline leading-relaxed">{con.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Insights Row */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider">Deep Analytics Segmentations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {detailedInsights.map((ins: any, idx: number) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 animate-slide-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-100/50 dark:bg-blue-950/20 px-2 py-0.5 rounded">
                  {ins.category}
                </span>
                <h4 className="font-bold text-slate-800 dark:text-white mt-3 text-sm leading-tight">
                  {ins.headline}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 leading-relaxed">
                  {ins.detail}
                </p>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800/40 pt-3 text-[10px] font-bold text-slate-400 uppercase">
                Reference Check: <span className="text-slate-600 dark:text-slate-300 font-mono">{ins.data_point}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategic Actions / Recommendations */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider">Operational Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.map((rec: any, idx: number) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 rounded-full">
                  Priority {rec.priority}
                </span>
                <h4 className="font-bold text-slate-800 dark:text-white text-sm leading-snug">
                  {rec.action}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  <span className="font-bold">Rationale:</span> {rec.rationale}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                Expected Impact: {rec.expected_impact}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Collapsible Meeting Talking Points */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 pb-4">
          <h3 className="font-extrabold text-slate-800 dark:text-white text-sm uppercase tracking-wider">
            Meeting Talking Points Script
          </h3>
          <button
            onClick={copyTalkingPoints}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied Script!' : 'Copy Briefing Script'}
          </button>
        </div>
        <div className="space-y-4">
          {talking_points.map((tp: string, idx: number) => (
            <div key={idx} className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                {idx + 1}
              </span>
              <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-semibold">
                {tp}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
