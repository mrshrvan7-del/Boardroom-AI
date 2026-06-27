'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Lock, X, FileText, Database, ShieldAlert, Eye, Calendar, HardDrive } from 'lucide-react';
import { getApiUrl } from '../../app/apiConfig';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [customApiUrl, setCustomApiUrl] = useState('');

  // Clear state when closed, and load custom URL
  useEffect(() => {
    if (!isOpen) {
      setUsername('');
      setPassword('');
      setIsLogged(false);
      setError('');
      setLogs([]);
      setExpandedRow(null);
    } else {
      setCustomApiUrl(localStorage.getItem('BOARDROOM_API_URL') || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const saveApiUrl = () => {
    if (customApiUrl.trim()) {
      localStorage.setItem('BOARDROOM_API_URL', customApiUrl.trim());
    } else {
      localStorage.removeItem('BOARDROOM_API_URL');
    }
    alert('API Endpoint URL updated successfully!');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(getApiUrl('/api/admin/logs'), {
        username,
        password
      });

      if (res.data.status === 'success') {
        setIsLogged(true);
        setLogs(res.data.logs || []);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 text-xs">
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-500 animate-pulse" />
            <div>
              <h2 className="font-extrabold text-white text-sm uppercase tracking-wider">
                {isLogged ? 'Auditing Vault Logs' : 'Admin Security Access Required'}
              </h2>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                {isLogged ? 'Private record tracker' : 'Authorized administrator decryption panel'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/50 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isLogged ? (
            // Phase 1: Login Form
            <form onSubmit={handleLogin} className="max-w-sm mx-auto my-12 space-y-5">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">Secure Audit Login</h3>
                <p className="text-[10px] text-slate-500 font-medium max-w-xs mx-auto">
                  Credentials verify against backend system policies. All attempts are signed locally.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 font-bold text-center">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 text-white"
                  />
                </div>
                
                <div className="pt-2 border-t border-slate-800/60 mt-4 space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Custom API Endpoint URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. https://api.boardroomai.xyz"
                      value={customApiUrl}
                      onChange={(e) => setCustomApiUrl(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      onClick={saveApiUrl}
                      className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold px-4 rounded-xl text-xs transition-all border border-slate-800"
                    >
                      Save
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                    Leave blank to automatically connect to your local backend at port 8000.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs"
              >
                {loading ? 'Decrypting Vault...' : 'Access Audits'}
              </button>
            </form>
          ) : (
            // Phase 2: Logs Table
            <div className="space-y-6">
              {logs.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-500">
                    <Database className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-300">No Audits Logged</h4>
                  <p className="text-slate-500 text-[10px] max-w-xs mx-auto">
                    Uploaded dataset records will appear here as auditing logs once sessions are generated.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
                  <table className="min-w-full divide-y divide-slate-800">
                    <thead className="bg-slate-900/60">
                      <tr className="text-slate-400 text-left font-bold uppercase tracking-wider">
                        <th className="px-5 py-3">Timestamp</th>
                        <th className="px-5 py-3">Source Name</th>
                        <th className="px-5 py-3">File Size</th>
                        <th className="px-5 py-3">Dimensions</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                      {logs.map((log, index) => {
                        const dateStr = new Date(log.timestamp).toLocaleString();
                        const isExpanded = expandedRow === index;
                        return (
                          <React.Fragment key={index}>
                            <tr className="hover:bg-slate-900/40">
                              <td className="px-5 py-3.5 flex items-center gap-2 truncate max-w-[170px]">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                {dateStr}
                              </td>
                              <td className="px-5 py-3.5 truncate max-w-[150px] font-bold text-white">
                                {log.filename}
                              </td>
                              <td className="px-5 py-3.5">
                                <HardDrive className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                                {log.file_size}
                              </td>
                              <td className="px-5 py-3.5 text-slate-400">
                                {log.rows} Rows x {log.columns} Columns
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <button
                                  onClick={() => setExpandedRow(isExpanded ? null : index)}
                                  className="text-rose-400 hover:underline font-bold flex items-center gap-1 ml-auto"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  {isExpanded ? 'Hide Details' : 'View Schema'}
                                </button>
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-slate-900/20">
                                <td colSpan={5} className="px-5 py-4 border-t border-slate-800 text-slate-400 font-semibold">
                                  <div className="space-y-4">
                                    {/* Dimensions & Columns */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                                          Detected Columns ({log.column_names.length})
                                        </span>
                                        <div className="flex flex-wrap gap-1">
                                          {log.column_names.map((name: string) => (
                                            <span key={name} className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-800">
                                              {name}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                                          Column Types / Layout Profile
                                        </span>
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[10px]">
                                          {Object.entries(log.dtypes).map(([col, dtype]: [any, any]) => (
                                            <div key={col} className="flex justify-between border-b border-slate-900 pb-0.5">
                                              <span className="text-slate-400 truncate">{col}</span>
                                              <span className="text-slate-500 font-mono">{dtype}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
