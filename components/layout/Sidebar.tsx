import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Upload, 
  LayoutDashboard, 
  Lightbulb, 
  MessageSquare, 
  Download, 
  Settings, 
  Database,
  Users
} from 'lucide-react';
import { useAppStore } from '../../app/store';

export default function Sidebar() {
  const pathname = usePathname();
  const { sessionId, datasetType } = useAppStore();


  const navItems = [
    { name: 'Upload', path: '/', icon: Upload, disabled: false },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, disabled: !sessionId },
    { name: 'Insights', path: '/insights', icon: Lightbulb, disabled: !sessionId },
    { name: 'Ask AI', path: '/chat', icon: MessageSquare, disabled: !sessionId },
    { name: 'Export', path: '/export', icon: Download, disabled: !sessionId },
  ];

  return (
    <aside className="w-64 bg-[#0F172A] text-[#F1F5F9] flex flex-col h-screen sticky top-0 border-r border-[#1E293B]">
      {/* Title / Logo */}
      <div 
        className="p-6 border-b border-[#1E293B] flex items-center gap-3 cursor-pointer select-none hover:bg-slate-900/30 transition-all"
      >
        <Database className="w-6 h-6 text-[#2563EB]" />
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-wide text-white">Boardroom-AI</h1>
          <span className="text-xs text-[#94A3B8]">Analytics Platform</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          if (item.disabled) {
            return (
              <div
                key={item.name}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#475569] cursor-not-allowed text-sm font-medium"
                title="Upload a dataset first to unlock this page"
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-lg shadow-[#2563eb]/20'
                  : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer info */}
      {sessionId && (
        <div className="p-4 border-t border-[#1E293B] bg-[#0B0F19]">
          <div className="flex items-center gap-2 text-xs text-[#94A3B8] mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Active Session
          </div>
          <p className="text-xs font-semibold truncate text-white max-w-[200px]">
            {datasetType ? `${datasetType} Mode` : 'Custom Dataset'}
          </p>
        </div>
      )}
      
    </aside>
  );
}
