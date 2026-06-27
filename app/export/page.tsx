'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  FileText, 
  Presentation, 
  FileSpreadsheet, 
  ArrowRight,
  Download,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../store';

export default function ExportPage() {
  const router = useRouter();
  const { sessionId, filename } = useAppStore();

  const [downloading, setDownloading] = useState<string | null>(null);
  const [stepMsg, setStepMsg] = useState('');

  useEffect(() => {
    if (!sessionId) {
      router.push('/');
    }
  }, [sessionId, router]);

  if (!sessionId) return null;

  const exportTypes = [
    {
      format: 'pdf',
      name: 'PDF Executive Report',
      icon: FileText,
      color: 'text-rose-500 bg-rose-500/10 border-rose-200 dark:border-rose-950',
      description: 'Polished, reader-friendly document containing executive summaries, KPI tables, and full narrative cards. Perfect for corporate print-outs.',
      details: 'Estimated Page Count: 6 Pages',
    },
    {
      format: 'pptx',
      name: 'PowerPoint Briefing Deck',
      icon: Presentation,
      color: 'text-amber-500 bg-amber-500/10 border-amber-200 dark:border-amber-950',
      description: 'Fully structured widescreen slides featuring summary bullets, KPI layouts, action targets, and speaker notes attached to each slide.',
      details: 'Estimated Slide Count: 6 Slides',
    },
    {
      format: 'xlsx',
      name: 'Excel Cleaned Database',
      icon: FileSpreadsheet,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-200 dark:border-emerald-950',
      description: 'Multi-sheet workbook mapping raw cleaned data alongside descriptive statistics tables and KPI summaries. Color-coded for readability.',
      details: 'Estimated Workbook Sheets: 3 Sheets',
    }
  ];

  const handleDownload = async (format: string) => {
    setDownloading(format);
    
    // Simulate multi-step export processing for realistic feel
    setStepMsg('Scanning dataset profiles...');
    await new Promise(r => setTimeout(r, 1000));
    setStepMsg('Generating document canvas...');
    await new Promise(r => setTimeout(r, 1000));
    setStepMsg('Packaging binary streams...');

    try {
      const response = await axios({
        url: `http://127.0.0.1:8000/api/export/${sessionId}?format=${format}`,
        method: 'POST',
        responseType: 'blob', // Important
      });
      
      const fileUrl = window.URL.createObjectURL(new Blob([response.data]));
      const fileLink = document.createElement('a');
      fileLink.href = fileUrl;
      
      let finalName = `Boardroom_AI_${filename ? filename.split('.')[0] : 'Report'}`;
      if (format === 'pdf') finalName += '.pdf';
      else if (format === 'pptx') finalName += '.pptx';
      else finalName += '.xlsx';
      
      fileLink.setAttribute('download', finalName);
      document.body.appendChild(fileLink);
      fileLink.click();
      fileLink.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to export. Please verify backend is running on port 8000.");
    } finally {
      setDownloading(null);
      setStepMsg('');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Export Center</h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
          Download executive-grade reports and database files in standard corporate formats.
        </p>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {exportTypes.map((item) => {
          const Icon = item.icon;
          const isCurrent = downloading === item.format;
          return (
            <div 
              key={item.format}
              className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-base leading-tight">
                    {item.name}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
                    {item.details}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {item.description}
                </p>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/40 mt-6 pt-5">
                {isCurrent ? (
                  <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 flex items-center gap-3 text-xs font-semibold text-slate-500">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                    <span>{stepMsg}</span>
                  </div>
                ) : (
                  <button
                    disabled={downloading !== null}
                    onClick={() => handleDownload(item.format)}
                    className="w-full bg-[#1E293B] hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
