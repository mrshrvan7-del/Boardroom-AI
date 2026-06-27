'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  Users, 
  DollarSign, 
  Award, 
  Smile, 
  TrendingDown, 
  Calendar, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  TrendingUp,
  Inbox,
  Activity,
  Percent,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { useAppStore } from '../store';
import ChartCard from '../../components/charts/ChartCard';
import InsightsSidePanel from '../../components/insights/InsightsSidePanel';

export default function DashboardPage() {
  const router = useRouter();
  const { 
    sessionId, 
    filename, 
    datasetType, 
    confidence, 
    domainContext,
    kpis, 
    cleaningReport, 
    profile, 
    analysis, 
    insights,
    setUnderstandingInfo,
    setAnalysisInfo,
    setInsightsInfo
  } = useAppStore();

  const [loadingOverride, setLoadingOverride] = useState(false);
  const [showRawTable, setShowRawTable] = useState(false);
  const [rawRows, setRawRows] = useState<any[]>([]);

  // If no session, route back to upload page
  useEffect(() => {
    if (!sessionId) {
      router.push('/');
    } else {
      // Fetch some sample rows for our expandable raw table
      axios.get(`http://127.0.0.1:8000/api/session/${sessionId}`)
        .then(res => {
          setRawRows(res.data.preview_rows || []);
        })
        .catch(err => console.error("Failed to load table rows", err));
    }
  }, [sessionId, router]);

  if (!sessionId) return null;

  const handleOverrideType = async (type: string) => {
    setLoadingOverride(true);
    try {
      // 1. Recalculate context & KPIs
      const understandRes = await axios.post(`http://127.0.0.1:8000/api/understand/${sessionId}?override_type=${type}`);
      setUnderstandingInfo({
        dataset_type: understandRes.data.dataset_type,
        confidence: understandRes.data.confidence,
        domain_context: understandRes.data.domain_context,
        kpis: understandRes.data.kpis,
        primary_metric: understandRes.data.primary_metric,
        time_series: understandRes.data.time_series,
        geographic: understandRes.data.geographic
      });

      // 2. Re-run analysis (updating primary metric relationships)
      const analyzeRes = await axios.post(`http://127.0.0.1:8000/api/analyze/${sessionId}`);
      setAnalysisInfo(analyzeRes.data);

      // 3. Re-run insights
      const insightsRes = await axios.post(`http://127.0.0.1:8000/api/insights/${sessionId}`);
      setInsightsInfo(insightsRes.data);
    } catch (err) {
      console.error("Override failed", err);
    } finally {
      setLoadingOverride(false);
    }
  };

  const getKPIIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users': return <Users className="w-5 h-5" />;
      case 'DollarSign': return <DollarSign className="w-5 h-5" />;
      case 'Award': return <Award className="w-5 h-5" />;
      case 'Smile': return <Smile className="w-5 h-5" />;
      case 'TrendingDown': return <TrendingDown className="w-5 h-5" />;
      case 'Calendar': return <Calendar className="w-5 h-5" />;
      case 'Inbox': return <Inbox className="w-5 h-5" />;
      case 'Percent': return <Percent className="w-5 h-5" />;
      case 'Activity': return <Activity className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getKPIColor = (colorName: string) => {
    switch (colorName) {
      case 'blue': return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
      case 'green': return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
      case 'purple': return 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400';
      case 'pink': return 'bg-pink-500/10 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400';
      case 'red': return 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400';
      case 'indigo': return 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400';
      default: return 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400';
    }
  };

  const getQualityRingColor = (score: number) => {
    if (score >= 80) return 'stroke-emerald-500';
    if (score >= 60) return 'stroke-amber-500';
    return 'stroke-rose-500';
  };

  const qualityScore = cleaningReport?.data_quality_score ?? 95;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Banner / Header Controls */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs px-2.5 py-1 rounded">
              {datasetType} Dataset
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {confidence}% Classifier Confidence
            </span>
            {loadingOverride && <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white mt-1 leading-tight">
            {domainContext}
          </h1>
        </div>

        {/* Override dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Classification Override:</label>
          <select
            value={datasetType || 'Custom'}
            onChange={(e) => handleOverrideType(e.target.value)}
            disabled={loadingOverride}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="HR">HR & Payroll</option>
            <option value="Sales">Sales & Revenue</option>
            <option value="Support">Customer Support</option>
            <option value="Finance">Corporate Finance</option>
            <option value="Custom">Custom / General</option>
          </select>
        </div>
      </div>

      {/* KPI Cards section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, index) => (
          <div 
            key={index} 
            className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.name}</span>
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1.5 tracking-tight">
                  {kpi.value}
                </h3>
              </div>
              <div className={`p-2.5 rounded-lg ${getKPIColor(kpi.color)}`}>
                {getKPIIcon(kpi.icon)}
              </div>
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-800/40 mt-4 pt-3 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate max-w-[170px]" title={kpi.insight}>{kpi.insight}</span>
              <span className={`font-semibold flex items-center gap-0.5 ${
                kpi.trend === 'up' 
                  ? 'text-emerald-500' 
                  : kpi.trend === 'down' 
                    ? 'text-rose-500' 
                    : 'text-slate-400'
              }`}>
                {kpi.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : kpi.trend === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> : ''}
                {kpi.trend.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard Main Grid (Split charts and insights sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CHARTS CONTAINER (8 columns) */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile?.understanding?.recommended_charts ? (
              profile.understanding.recommended_charts.map((config: any, index: number) => (
                <ChartCard key={index} config={config} />
              ))
            ) : (
              // Fallback to plotting the first 4 computed charts
              profile?.column_profiles?.slice(0, 4).map((col: any, index: number) => (
                <ChartCard 
                  key={index} 
                  config={{
                    chart_type: col.semantic_type === 'Date' ? 'line' : 'bar',
                    title: `Visual Analysis: ${col.name}`,
                    x_column: col.name,
                    y_column: profile.numeric_columns[0] || 'count',
                    description: `Automated visual rendering of ${col.name} distribution curves.`
                  }} 
                />
              ))
            )}
          </div>
        </div>

        {/* INSIGHTS SIDEBAR (4 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Data Quality Card */}
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex items-center gap-6">
            {/* SVG Circle Gauge */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`transition-all duration-500 ease-out ${getQualityRingColor(qualityScore)}`}
                  strokeDasharray={`${qualityScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-black text-slate-800 dark:text-white leading-none">{qualityScore}%</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Score</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">Data Integrity Health</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  Cleaned: {cleaningReport?.duplicates_removed ?? 0} dups
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  Imputed: {cleaningReport?.missing_fixed ?? 0} nulls
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  Outliers: {cleaningReport?.outliers_found ?? 0} found
                </span>
              </div>
            </div>
          </div>

          <InsightsSidePanel />
        </div>
      </div>

      {/* Expandable Cleaned Data Table */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
        <button
          onClick={() => setShowRawTable(!showRawTable)}
          className="w-full flex items-center justify-between font-extrabold text-slate-800 dark:text-white text-sm uppercase tracking-wider"
        >
          <span className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-500" />
            Inspect Cleaned Dataset Records ({profile?.total_rows?.toLocaleString() ?? 0} Rows)
          </span>
          {showRawTable ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {showRawTable && (
          <div className="mt-6 space-y-4">
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="min-w-full text-xs font-mono">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    {profile?.column_profiles?.map((col: any) => (
                      <th key={col.name} className="px-5 py-3 text-left font-bold tracking-wider">
                        <div className="flex flex-col">
                          <span className="text-slate-800 dark:text-slate-200">{col.name}</span>
                          <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
                            {col.semantic_type}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rawRows.map((row: any, rIdx: number) => (
                    <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      {profile?.column_profiles?.map((col: any) => (
                        <td key={col.name} className="px-5 py-3 text-slate-600 dark:text-slate-300 truncate max-w-[160px]">
                          {row[col.name] !== null ? String(row[col.name]) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 italic text-right font-medium">
              Showing first {rawRows.length} preview rows of the cleaned database.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
