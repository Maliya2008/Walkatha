import React, { useState } from 'react';
import { BookOpen, Moon, Sun, Search, Sparkles } from 'lucide-react';
import { Category, ReadingTheme } from '../../types/story';

interface HeaderProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onHomeClick: () => void;
  theme: ReadingTheme;
  onToggleTheme: () => void;
  onOpenSitemap: () => void;
  onOpenCompliance: (type: 'privacy' | 'terms' | 'ads') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onHomeClick,
  theme,
  onToggleTheme,
  onOpenSitemap,
  onOpenCompliance,
}) => {
  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div
          id="brand-logo-btn"
          onClick={onHomeClick}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-400 dark:group-hover:text-white transition-colors shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white block leading-none">
              Short Stories
            </span>
            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mt-0.5">
              Read & Discover
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Ad Network Specs / Docs button */}
          <button
            type="button"
            id="header-monetag-info-btn"
            onClick={() => onOpenCompliance('ads')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Monetag Ready</span>
          </button>

          {/* Quick Sitemap Index */}
          <button
            type="button"
            id="header-sitemap-btn"
            onClick={onOpenSitemap}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Sitemap
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            id="header-theme-toggle-btn"
            onClick={onToggleTheme}
            aria-label="Toggle theme mode"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
