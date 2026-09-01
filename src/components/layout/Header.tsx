import React from 'react';
import { BookOpen, Moon, Sun } from 'lucide-react';
import { ReadingTheme } from '../../types/story';

interface HeaderProps {
  onHomeClick: () => void;
  theme: ReadingTheme;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onHomeClick,
  theme,
  onToggleTheme,
}) => {
  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div
          id="brand-logo-btn"
          onClick={onHomeClick}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-400 dark:group-hover:text-white transition-colors shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white block leading-none">
              Walkathawa <span className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold font-serif">(වල් කතාව)</span>
            </span>
            <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-0.5">
              Sinhala Stories Online
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            type="button"
            id="header-theme-toggle-btn"
            onClick={onToggleTheme}
            aria-label="Toggle Color Theme"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-700" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

