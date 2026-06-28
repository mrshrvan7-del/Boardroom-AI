'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { 
  FileSpreadsheet, 
  FileCode, 
  FileText, 
  Upload, 
  AlertCircle,
  Database,
  ArrowRight,
  RefreshCw,
  Edit2
} from 'lucide-react';
import { useAppStore } from './store';
import { getApiUrl } from './apiConfig';

export default function UploadPage() {
  const router = useRouter();
  const { 
    setSessionInfo, 
    setProcessingInfo, 
    setUnderstandingInfo, 
    setAnalysisInfo,
    resetStore
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState('');

  // Uploaded session info (before full analysis)
  const [tempSession, setTempSession] = useState<any>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'text/tab-separated-values': ['.tsv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    onDrop: async (acceptedFiles, fileRejections) => {
      setError(null);
      setTempSession(null);
      
      if (fileRejections.length > 0) {
        const rej = fileRejections[0];
        if (rej.errors[0].code === 'file-too-large') {
          setError('File too large. Maximum supported size is 50MB.');
        } else {
          setError('Unsupported file type. Please upload CSV, TSV, Excel, or TXT.');
        }
        return;
      }

      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      await handleUpload(file, null);
    }
  });

  const handleUpload = async (file: File | null, text: string | null) => {
    setLoading(true);
    setProgress(15);
    setLoadingPhase('Parsing dataset structures...');
    setError(null);

    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    } else if (text) {
      formData.append('raw_text', text);
    }

    try {
      const uploadRes = await axios.post(getApiUrl('/api/upload'), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 30) / progressEvent.total);
            setProgress(15 + percent);
          }
        }
      });
      
      setProgress(50);
      setTempSession(uploadRes.data);
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Failed to parse file. Verify formatting and encoding.';
      if (!err.response || err.response.status === 404 || err.code === 'ERR_NETWORK') {
        errMsg = 'Backend connection failed. Please ensure the backend server is running.';
      } else if (err.response?.data?.detail) {
        errMsg = err.response.data.detail;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      setError('Please paste some text data first.');
      return;
    }
    handleUpload(null, pastedText);
  };

  const triggerAnalysis = async () => {
    if (!tempSession) return;
    const { session_id } = tempSession;

    setLoading(true);
    setError(null);
    
    try {
      // Phase 1: Data Cleaning and Profiling
      setLoadingPhase('Auto-cleaning duplicates, dates, percentages & profiling...');
      setProgress(20);
      const processRes = await axios.post(getApiUrl(`/api/process/${session_id}`));
      
      // Phase 2: Domain understanding & KPIs
      setLoadingPhase('Classifying business context and mapping KPIs...');
      setProgress(50);
      const understandRes = await axios.post(getApiUrl(`/api/understand/${session_id}`));
      
      // Phase 3: Detailed statistics
      setLoadingPhase('Executing deep correlations, clustering & regression forecasts...');
      setProgress(80);
      const analyzeRes = await axios.post(getApiUrl(`/api/analyze/${session_id}`));
      
      // Update state
      setProgress(100);
      setLoadingPhase('Finalizing dashboards...');
      
      // Commit session data
      setSessionInfo({
        session_id: tempSession.session_id,
        filename: tempSession.filename,
        file_size: tempSession.file_size,
        rows: tempSession.rows,
        columns: tempSession.columns,
        column_names: tempSession.column_names,
        dtypes: tempSession.dtypes,
        preview_rows: tempSession.preview_rows
      });
      setProcessingInfo({
        cleaning_report: processRes.data.cleaning_report,
        profile: processRes.data.profile
      });
      setUnderstandingInfo({
        dataset_type: understandRes.data.dataset_type,
        confidence: understandRes.data.confidence,
        domain_context: understandRes.data.domain_context,
        kpis: understandRes.data.kpis,
        primary_metric: understandRes.data.primary_metric,
        time_series: understandRes.data.time_series,
        geographic: understandRes.data.geographic
      });
      setAnalysisInfo(analyzeRes.data);
      
      // Fetch insights on background and transition
      try {
        const insightsRes = await axios.post(getApiUrl(`/api/insights/${session_id}`));
        // Wait list/state update
        useAppStore.getState().setInsightsInfo(insightsRes.data);
      } catch (e) {
        console.error("Failed to load insights on-the-fly", e);
      }
      
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      let errMsg = 'An error occurred during dataset analysis. Please retry.';
      if (!err.response || err.response.status === 404 || err.code === 'ERR_NETWORK') {
        errMsg = 'Backend connection lost during analysis. Please ensure the backend server is running.';
      } else if (err.response?.data?.detail) {
        errMsg = err.response.data.detail;
      }
      setError(errMsg);
      setLoading(false);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') return <FileSpreadsheet className="w-10 h-10 text-emerald-500" />;
    if (ext === 'json') return <FileCode className="w-10 h-10 text-amber-500" />;
    return <FileText className="w-10 h-10 text-blue-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4">
      {/* Platform Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Executive Data Analytics & Intelligence
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-lg mx-auto">
          No SQL. No configurations. Drag and drop any corporate dataset to auto-clean, profile, segment, and present briefings.
        </p>
      </div>

      {/* Main Drag-Drop / Paste Box */}
      {!tempSession && !loading && (
        <div className="w-full bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl transition-all duration-200">
          {/* Paste Toggle */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setPasteMode(!pasteMode); setError(null); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Edit2 className="w-3.5 h-3.5" />
              {pasteMode ? 'Or drag & drop file' : 'Or paste raw data as text'}
            </button>
          </div>

          {pasteMode ? (
            <div className="space-y-4">
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste CSV comma-separated or tab-separated text rows here..."
                rows={8}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handlePasteSubmit}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-blue-600/15 transition-all"
              >
                Load Pasted Data
              </button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                isDragActive 
                  ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/5' 
                  : 'border-slate-300 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500'
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/40 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-900/30">
                <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                Drag & drop your business dataset here
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Supports CSV, TSV, XLSX, XLS, TXT (Up to 50MB)
              </p>
              
              <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Secure Offline Decryption Pipeline Active
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Loader */}
      {loading && (
        <div className="w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <span className="text-slate-700 dark:text-slate-200 font-bold text-sm text-center">
            {loadingPhase}
          </span>
          {progress > 0 && (
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-4 overflow-hidden max-w-sm shimmer">
              <div 
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Upload Success Preview Card */}
      {tempSession && !loading && (
        <div className="w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            {getFileIcon(tempSession.filename)}
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white leading-tight">
                {tempSession.filename}
              </h3>
              <span className="text-xs text-slate-400">
                Size: {tempSession.file_size}  |  Rows: {tempSession.rows.toLocaleString()}  |  Cols: {tempSession.columns}
              </span>
            </div>
            <button
              onClick={() => { setTempSession(null); resetStore(); }}
              className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-500 dark:text-slate-300 font-semibold"
            >
              Change File
            </button>
          </div>

          {/* Sample preview table (3 rows) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Data Preview (First 3 Rows)
            </h4>
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/20 max-h-52">
              <table className="min-w-full text-xs font-mono">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    {tempSession.column_names.slice(0, 6).map((col: string) => (
                      <th key={col} className="px-4 py-2 text-left font-bold truncate max-w-[120px]">
                        {col}
                      </th>
                    ))}
                    {tempSession.column_names.length > 6 && <th className="px-4 py-2 text-left">...</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tempSession.preview_rows.map((row: any, rIdx: number) => (
                    <tr key={rIdx} className="hover:bg-slate-200/20 dark:hover:bg-slate-800/10">
                      {tempSession.column_names.slice(0, 6).map((col: string) => (
                        <td key={col} className="px-4 py-2 text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                          {row[col] !== null ? String(row[col]) : ''}
                        </td>
                      ))}
                      {tempSession.column_names.length > 6 && <td className="px-4 py-2 text-slate-400">...</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={triggerAnalysis}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/15 hover:shadow-blue-500/30 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
          >
            Analyze This Data
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Friendly error card */}
      {error && (
        <div className="w-full max-w-md bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl p-4 mt-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-rose-800 dark:text-rose-300 text-sm">Upload Failure</h4>
            <p className="text-rose-600 dark:text-rose-400 text-xs mt-1 leading-relaxed">
              {error}
            </p>
            <button
              onClick={() => { setError(null); setTempSession(null); }}
              className="mt-3 flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-900/50 px-3 py-1.5 rounded-lg transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
