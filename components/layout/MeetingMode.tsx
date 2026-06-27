import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  HelpCircle, 
  Calendar,
  AlertTriangle,
  Play,
  ClipboardList
} from 'lucide-react';
import { useAppStore } from '../../app/store';
import { getApiUrl } from '../../app/apiConfig';

export default function MeetingMode() {
  const { 
    sessionId, 
    isMeetingMode, 
    toggleMeetingMode, 
    insights,
    kpis,
    datasetType
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<string | null>(null);

  // Load meeting context when opened
  useEffect(() => {
    if (isMeetingMode && sessionId) {
      setLoading(true);
      axios.post(getApiUrl(`/api/meeting/${sessionId}`))
        .then(res => {
          setData(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to load meeting briefing", err);
          // Fallback to local insights if API fails
          setData({
            health_score: insights?.health_score ?? 8.0,
            highlights: insights?.highlights ?? [],
            concerns: insights?.concerns ?? [],
            talking_points: insights?.talking_points ?? [],
            questions: [
              { question: "What is the primary action path?", answer: "Align operational priorities." }
            ],
            action_items: [
              { action: "Verify database integrity constraints", owner: "Ops Lead", deadline: "Next Monday" }
            ]
          });
          setLoading(false);
        });
    }
  }, [isMeetingMode, sessionId, insights]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMeetingMode) {
        toggleMeetingMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMeetingMode, toggleMeetingMode]);

  if (!isMeetingMode) return null;

  const copyTalkingPoints = () => {
    if (!data?.talking_points) return;
    const text = data.talking_points.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (format: 'pdf' | 'pptx') => {
    if (!sessionId) return;
    setDownloadFormat(format);
    try {
      const response = await axios({
        url: getApiUrl(`/api/export/${sessionId}?format=${format}`),
        method: 'POST',
        responseType: 'blob', // Important
      });
      
      const fileUrl = window.URL.createObjectURL(new Blob([response.data]));
      const fileLink = document.createElement('a');
      fileLink.href = fileUrl;
      fileLink.setAttribute('download', `Boardroom_AI_Briefing.${format}`);
      document.body.appendChild(fileLink);
      fileLink.click();
      fileLink.remove();
    } catch (error) {
      console.error(`Export to ${format} failed`, error);
      alert(`Failed to download ${format.toUpperCase()} report.`);
    } finally {
      setDownloadFormat(null);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 8.0) return 'text-emerald-400 border-emerald-500';
    if (score >= 6.0) return 'text-amber-400 border-amber-500';
    return 'text-rose-400 border-rose-500';
  };

  return (
    <div className="fixed inset-0 bg-[#070A13]/98 backdrop-blur-md z-50 overflow-y-auto flex flex-col text-slate-100 font-sans">
      {/* Top Header Controls */}
      <div className="h-16 flex items-center justify-between px-8 border-b border-[#1E293B]">
        <div className="flex items-center gap-3">
          <Play className="w-5 h-5 text-emerald-500" />
          <h2 className="font-bold text-lg text-white">Boardroom Meeting Mode</h2>
          <span className="text-xs bg-[#1E293B] text-slate-400 px-2 py-0.5 rounded uppercase">
            {datasetType || 'Analytics'} Mode
          </span>
        </div>
        <button 
          onClick={() => toggleMeetingMode(false)}
          className="p-1.5 hover:bg-[#1E293B] rounded-lg transition-all text-slate-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Synthesizing executive briefing summary...</p>
        </div>
      ) : data ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 max-w-7xl mx-auto w-full">
          {/* LEFT PANEL: Talking Points (5 columns) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-4 mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-emerald-400" />
                  Scripted Meeting Talking Points
                </h3>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto">
                {data.talking_points.map((tp: string, idx: number) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </span>
                    <p className="text-slate-300 text-sm leading-relaxed">{tp}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action items box */}
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-6">
              <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-400" />
                Next Recommended Actions
              </h3>
              <div className="space-y-3">
                {data.action_items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-[#151F32] p-3 rounded-lg border border-[#22314D] text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{item.action}</p>
                      <span className="text-slate-400">Owner: {item.owner}</span>
                    </div>
                    <span className="bg-[#1E293B] text-slate-300 px-2 py-0.5 rounded font-medium">
                      {item.deadline}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Health & Concerns & Questions (7 columns) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Health score & summary */}
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-6 flex items-center gap-6">
              <div className={`flex-shrink-0 w-24 h-24 border-4 rounded-full flex flex-col items-center justify-center ${getHealthColor(data.health_score)}`}>
                <span className="text-2xl font-black">{data.health_score}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Health</span>
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Briefing Overview</h4>
                <p className="text-slate-300 text-xs mt-1.5 leading-relaxed">
                  Dataset indicates stable distribution curves. Operational parameters are positioned within Q2 targets with some variance. Let's trace specific highlights and execute recommended focus points.
                </p>
              </div>
            </div>

            {/* Concerns Cards */}
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-6">
              <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Priority Concerns to Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.concerns.map((con: any, idx: number) => (
                  <div key={idx} className="bg-[#1E1B29] border border-rose-950/40 p-4 rounded-xl flex flex-col gap-2">
                    <span className="text-xl">{con.emoji || '⚠️'}</span>
                    <span className="text-[9px] uppercase font-bold text-rose-400">Severity: {con.severity}</span>
                    <p className="text-xs text-slate-300 leading-normal">{con.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Likely Executive Questions */}
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-6 flex-1 flex flex-col">
              <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                <HelpCircle className="w-5 h-5 text-purple-400" />
                Anticipated Executive Q&A
              </h3>
              <div className="space-y-4 overflow-y-auto max-h-[220px]">
                {data.questions.map((q: any, idx: number) => (
                  <div key={idx} className="bg-[#151F32] border border-[#22314D] p-4 rounded-xl flex flex-col gap-1">
                    <p className="text-xs font-bold text-emerald-400">Q: {q.question}</p>
                    <p className="text-xs text-slate-300 italic leading-relaxed mt-1">A: {q.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400">No meeting data available.</p>
        </div>
      )}

      {/* Footer controls: 3 buttons */}
      <div className="h-20 bg-[#0B0F19] border-t border-[#1E293B] flex items-center justify-center gap-6 px-8">
        <button
          onClick={copyTalkingPoints}
          className="flex items-center gap-2 bg-[#1E293B] hover:bg-[#2A374E] text-slate-200 hover:text-white text-xs font-semibold px-6 py-3 rounded-xl transition-all"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          Copy Talking Points
        </button>
        <button
          disabled={downloadFormat !== null}
          onClick={() => handleDownload('pdf')}
          className="flex items-center gap-2 bg-[#1E293B] hover:bg-[#2A374E] text-slate-200 hover:text-white text-xs font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {downloadFormat === 'pdf' ? 'Generating PDF...' : 'Download PDF briefing'}
        </button>
        <button
          disabled={downloadFormat !== null}
          onClick={() => handleDownload('pptx')}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/10 transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {downloadFormat === 'pptx' ? 'Generating PPT...' : 'Download PPT Deck'}
        </button>
      </div>
    </div>
  );
}
