import React, { useEffect } from 'react';
import { Sun, Moon, Presentation, Info } from 'lucide-react';
import { useAppStore } from '../../app/store';

export default function Header() {
  const { 
    filename, 
    insights, 
    isDarkMode, 
    toggleDarkMode, 
    toggleMeetingMode 
  } = useAppStore();

  const healthScore = insights?.health_score ?? null;

  // Track key shortcuts: D = Dashboard, I = Insights, C = Chat, E = Export, M = Meeting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input/textarea
      const activeEl = document.activeElement?.tagName;
      if (activeEl === 'INPUT' || activeEl === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      if (key === 'm') {
        e.preventDefault();
        toggleMeetingMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMeetingMode]);

  // Handle dark mode CSS class injection
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const getHealthColor = (score: number) => {
    if (score >= 8.0) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50';
    if (score >= 6.0) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50';
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50';
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] sticky top-0 z-30 flex items-center justify-between px-8 transition-colors duration-200">
      {/* Title / Session Info */}
      <div className="flex items-center gap-4">
        {filename ? (
          <>
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[280px]">
              {filename}
            </h2>
            {healthScore !== null && (
              <div className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${getHealthColor(healthScore)}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                Health Score: {healthScore}/10
              </div>
            )}
          </>
        ) : (
          <h2 className="font-semibold text-slate-400 dark:text-slate-500 text-sm">
            No active dataset loaded
          </h2>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-4">
        {filename && (
          <button
            onClick={() => toggleMeetingMode(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-md shadow-emerald-600/10 hover:shadow-emerald-500/20 active:scale-95 transition-all duration-200 animate-pulse-slow"
          >
            <Presentation className="w-4 h-4" />
            Prepare for Meeting
          </button>
        )}

        {/* Dark Mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
