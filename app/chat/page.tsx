'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  Send, 
  Mic, 
  HelpCircle, 
  FileText, 
  Maximize2,
  Trash2,
  Database,
  User,
  Plus
} from 'lucide-react';
import { useAppStore } from '../store';
import { getApiUrl } from '../apiConfig';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import PieChart from '../../components/charts/PieChart';

export default function ChatPage() {
  const router = useRouter();
  const { sessionId, chatHistory, addChatMessage, clearChatHistory, primaryMetric } = useAppStore();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeChart, setActiveChart] = useState<any>(null); // For fullscreen/right panel preview
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) {
      router.push('/');
    }
  }, [sessionId, router]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  if (!sessionId) return null;

  const suggestedQuestions = [
    "What is the average salary by department?",
    "Show me record counts grouped by status",
    "Show me metric trends over time",
    `What is causing the shift in ${primaryMetric || 'primary metrics'}?`,
    "Who are the top performers?"
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;
    
    const userMsg = textToSend;
    setInput('');
    setLoading(true);

    // 1. Add user message to local state
    addChatMessage({ role: 'user', content: userMsg });

    try {
      const response = await axios.post(getApiUrl(`/api/chat/${sessionId}`), {
        message: userMsg,
        conversation_history: chatHistory.map(m => ({ role: m.role, content: m.content }))
      });

      const { answer_text, intent, chart_config, filtered_data } = response.data;

      // 2. Add assistant response to state
      addChatMessage({ 
        role: 'assistant', 
        content: answer_text,
        filtered_data,
        chart_config
      });

      // If response has a chart config, set it to the active right panel chart
      if (chart_config) {
        setActiveChart(chart_config);
      }
    } catch (err) {
      console.error("Chat failure", err);
      addChatMessage({ 
        role: 'assistant', 
        content: "Oops, I encountered an issue processing that query. Please make sure the columns and filters match the dataset profiles." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMessagePDF = (content: string) => {
    // Generate a quick local text blob to download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Boardroom_AI_Briefing_Excerpt.txt');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const renderInlineChart = (config: any) => {
    if (!config || !config.data) return null;
    const type = config.chart_type;

    if (type === 'line') {
      return (
        <LineChart
          title={config.title}
          xData={config.data.map((d: any) => d.category)}
          yData={config.data.map((d: any) => d.value)}
          xName={config.x_column}
          yName={config.y_column}
        />
      );
    }
    if (type === 'bar' || type === 'horizontal_bar') {
      return (
        <BarChart
          title={config.title}
          categories={config.data.map((d: any) => d.category)}
          values={config.data.map((d: any) => d.value)}
          xName={config.x_column}
          yName={config.y_column}
          horizontal={type === 'horizontal_bar'}
        />
      );
    }
    if (type === 'pie') {
      return <PieChart title={config.title} data={config.data} />;
    }
    return null;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-10rem)] max-w-7xl mx-auto">
      {/* LEFT CHAT THREAD PANEL (60% width) */}
      <div className="lg:w-[60%] bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-2xl flex flex-col justify-between overflow-hidden shadow-sm h-full">
        {/* Chat Header */}
        <div className="h-14 border-b border-slate-100 dark:border-slate-800/60 px-6 flex items-center justify-between bg-slate-50/50 dark:bg-[#0b0f19]/30">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-500" />
            <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
              Ask AI Database Query
            </h3>
          </div>
          {chatHistory.length > 0 && (
            <button 
              onClick={clearChatHistory}
              className="text-[10px] text-slate-400 hover:text-rose-500 font-bold flex items-center gap-1 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Thread
            </button>
          )}
        </div>

        {/* Suggestion Chips */}
        {chatHistory.length === 0 && (
          <div className="p-6 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Suggested Questions:</span>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="text-left text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-500/5 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-semibold leading-relaxed transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {chatHistory.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={index}
                className={`flex gap-4 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${
                  isUser 
                    ? 'bg-blue-100 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/50 text-blue-600 dark:text-blue-400' 
                    : 'bg-[#1E293B] border-slate-700 text-slate-300'
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
                </div>

                {/* Bubble content */}
                <div className="space-y-3">
                  <div className={`p-4 rounded-2xl shadow-sm text-xs font-semibold leading-relaxed ${
                    isUser 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 rounded-tl-none shadow-slate-100/50'
                  }`}>
                    {/* Render text with safe linebreaks */}
                    <div className="whitespace-pre-line">{msg.content}</div>
                  </div>

                  {/* Render inline chart inside chat thread */}
                  {!isUser && msg.chart_config && (
                    <div className="bg-white dark:bg-[#11192A] border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm max-w-md w-full">
                      {renderInlineChart(msg.chart_config)}
                    </div>
                  )}

                  {/* Quick message controls */}
                  {!isUser && (
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold px-1">
                      <button 
                        onClick={() => handleDownloadMessagePDF(msg.content)}
                        className="hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Save Excerpt
                      </button>
                      {msg.chart_config && (
                        <button 
                          onClick={() => setActiveChart(msg.chart_config)}
                          className="hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1.5"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          Focus Chart
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex gap-4 items-center mr-auto max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-[#1E293B] flex items-center justify-center text-slate-300">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div className="flex gap-1.5 items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Form Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-[#0b0f19]/30 flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="Type a natural language query (e.g. average performance by department)..."
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 dark:text-slate-200"
          />
          <button 
            onClick={() => handleSend(input)}
            className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md shadow-blue-600/10 transition-all hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* RIGHT PREVIEW PANEL: Live Chart Panel (40% width) */}
      <div className="lg:w-[40%] bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm h-full flex flex-col justify-center items-center">
        {activeChart ? (
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                Focused Visual Panel
              </h4>
              <button 
                onClick={() => setActiveChart(null)}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
              >
                Reset Panel
              </button>
            </div>
            <div className="p-2 border border-slate-100 dark:border-slate-800/80 rounded-xl bg-slate-50/30 dark:bg-slate-950/20">
              {renderInlineChart(activeChart)}
            </div>
            <p className="text-[10px] text-slate-400 italic text-center font-medium">
              ECharts dynamic rendering of: "{activeChart.title}"
            </p>
          </div>
        ) : (
          <div className="text-center space-y-3 p-8">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Maximize2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Visual Preview Panel</h4>
            <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
              When queries generate graphs or filters, ECharts widgets load here for interactive focus exploration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
