import React from 'react';
import { Search, Sun, Moon, X } from 'lucide-react';
import { Category } from '../../types/story';

interface HeaderProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onGoHome: () => void;
  onOpenCategoriesPage: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  theme,
  onToggleTheme,
  onGoHome,
  onOpenCategoriesPage,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0d152b]/95 backdrop-blur border-b border-slate-200 dark:border-[#1e2d52] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-3">
          {/* Brand link */}
          <a
            href="/"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                onGoHome();
              }
            }}
            className="flex items-baseline gap-2 shrink-0"
          >
            <span className="text-lg font-bold tracking-tight text-[#0f172a] dark:text-white">
              Walkathawa
            </span>
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400 hidden sm:inline">
              සිංහල වැල කතා
            </span>
          </a>

          {/* Search input */}
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="සිංහල වැල කතා, වල් කතා සොයන්න..."
              aria-label="සිංහල වැල කතා සොයන්න"
              className="w-full pl-9 pr-8 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-[#131f3e] text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 border border-slate-200 dark:border-[#243763] focus:outline-none focus:border-blue-600 dark:focus:border-blue-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Minimal Actions: Categories link + Navy/Light Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/categories"
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  onOpenCategoriesPage();
                }
              }}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162347] transition-colors"
            >
              වර්ගීකරණ
            </a>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Navy Theme'}
              className="p-2 rounded-lg border border-slate-200 dark:border-[#243763] bg-slate-100 dark:bg-[#131f3e] text-slate-700 dark:text-blue-300 hover:bg-slate-200 dark:hover:bg-[#1a2b52] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
