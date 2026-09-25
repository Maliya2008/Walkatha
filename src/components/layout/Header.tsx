import React, { useState } from 'react';
import { Search, Moon, Sun, Menu, X } from 'lucide-react';
import { ReadingTheme, Category } from '../../types/story';
import { cleanCategoryBadgeName } from '../../utils/formatters';

interface HeaderProps {
  onHomeClick: () => void;
  theme: ReadingTheme;
  onToggleTheme: () => void;
  categories?: Category[];
  selectedCategory?: string;
  onSelectCategory?: (categorySlug: string) => void;
  onToggleSearch?: () => void;
  isSearchOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onHomeClick,
  theme,
  onToggleTheme,
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
  onToggleSearch,
  isSearchOpen = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-40 w-full border-b border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xs transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-13 sm:h-14 flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <a
          href="/"
          id="brand-logo-btn"
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey) {
              e.preventDefault();
              onHomeClick();
              setIsMenuOpen(false);
            }
          }}
          className="flex items-center gap-2.5 cursor-pointer select-none text-inherit no-underline min-w-0"
        >
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
            <img
              src="/icon.svg"
              alt="Walkathawa Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/icon.png';
              }}
            />
          </div>
          <div className="truncate">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white leading-none flex items-center gap-1.5">
              <span>Walkathawa</span>
              <span className="text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 font-serif">
                (වල් කතාව)
              </span>
            </span>
          </div>
        </a>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Search Trigger */}
          {onToggleSearch && (
            <button
              type="button"
              id="header-search-btn"
              onClick={onToggleSearch}
              aria-label="සොයන්න (Search)"
              className={`p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                isSearchOpen ? 'bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400' : ''
              }`}
              title="කතා සොයන්න"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            id="header-theme-toggle-btn"
            onClick={onToggleTheme}
            aria-label="Toggle Color Theme"
            className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Menu / Categories Toggle Button */}
          {categories.length > 0 && onSelectCategory && (
            <button
              type="button"
              id="header-menu-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="වර්ගීකරණ මෙනුව (Categories Menu)"
              className={`p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                isMenuOpen ? 'bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400' : ''
              }`}
              title="වර්ගීකරණ"
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile/Compact Category Drawer when Menu opened */}
      {isMenuOpen && categories.length > 0 && onSelectCategory && (
        <div className="border-t border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 shadow-lg">
          <div className="max-w-4xl mx-auto space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider pb-1">
              <span>කතා වර්ගීකරණ (Categories)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onSelectCategory('all');
                  setIsMenuOpen(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                සියලුම කතා (All)
              </button>
              {categories
                .filter((c) => c.slug !== 'all')
                .map((cat) => {
                  const isSelected = selectedCategory === cat.slug;
                  return (
                    <button
                      key={cat.id || cat.slug}
                      type="button"
                      onClick={() => {
                        onSelectCategory(cat.slug);
                        setIsMenuOpen(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cleanCategoryBadgeName(cat.name)}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
