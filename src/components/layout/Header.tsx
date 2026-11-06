import React from 'react';
import { BookOpen, Search, Moon, Sun, Grid, FileText } from 'lucide-react';
import { ReadingTheme } from '../../types/story';

interface HeaderProps {
  onHomeClick: () => void;
  onOpenCategories: () => void;
  theme: ReadingTheme;
  onToggleTheme: () => void;
  onOpenSitemap: () => void;
  onToggleSearch: () => void;
  isSearchOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onHomeClick,
  onOpenCategories,
  theme,
  onToggleTheme,
  onOpenSitemap,
  onToggleSearch,
  isSearchOpen,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          onClick={onHomeClick}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-950/40 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-lg text-slate-100 tracking-tight leading-none">
              <span>Walkathawa</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-medium">සිංහල</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">වල් කතාව - රස කතා එකතුව</p>
          </div>
        </button>

        {/* Desktop Quick Nav Links */}
        <nav className="hidden md:flex items-center gap-3 text-sm font-medium">
          <button
            onClick={onHomeClick}
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            මුල් පිටුව
          </button>
          <button
            onClick={onOpenCategories}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Grid className="w-4 h-4 text-rose-400" />
            වර්ගීකරණ
          </button>
          <button
            onClick={onOpenSitemap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            සමස්ත ලේඛනාගාරය
          </button>
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          {/* Toggle Search */}
          <button
            onClick={onToggleSearch}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isSearchOpen
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-950/30'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60'
            }`}
            title="කතා සොයන්න"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Categories for mobile */}
          <button
            onClick={onOpenCategories}
            className="md:hidden p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
            title="වර්ගීකරණ"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
            title="වර්ණ සැකසුම් (Dark / Light)"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </div>
    </header>
  );
};
