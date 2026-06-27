'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MeetingMode from './MeetingMode';
import { useAppStore } from '../../app/store';

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useAppStore();

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-800 dark:bg-[#070A13] dark:text-slate-100 transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
      <MeetingMode />
    </div>
  );
}
