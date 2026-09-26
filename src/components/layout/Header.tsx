import React, { useState, useRef, useEffect } from 'react';
import { Search, Moon, Sun, Menu, X, Home, FolderTree, Compass, Sparkles } from 'lucide-react';
import { ReadingTheme } from '../../types/story';

interface HeaderProps {
  onHomeClick: () => void;
  onOpenCategories: () => void;
  theme: ReadingTheme;
  onToggleTheme: () => void;
  onOpenSitemap?: () => void;
  onToggleSearch?: () => void;
  isSearchOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onHomeClick,
  onOpenCategories,
  theme,
  onToggleTheme,
  onOpenSitemap,
  onToggleSearch,
  isSearchOpen = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

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
        <div className="relative flex items-center gap-1 sm:gap-1.5 shrink-0">
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

          {/* Menu / Expansion Button in Top Right Corner */}
          <button
            ref={menuBtnRef}
            type="button"
            id="header-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="මෙනුව විවෘත කරන්න (Main Menu)"
            aria-expanded={isMenuOpen}
            className={`p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
              isMenuOpen ? 'bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400' : ''
            }`}
            title="මෙනුව"
          >
            {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Button Expansion Dropdown Menu */}
          {isMenuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl py-2 z-50 animate-fadeIn"
            >
              <div className="px-3 py-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                ප්‍රධාන මෙනුව (Navigation)
              </div>

              {/* 1. Home Redirection Option */}
              <button
                type="button"
                onClick={() => {
                  onHomeClick();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left cursor-pointer group"
              >
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/60 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold leading-tight">මුල් පිටුව</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Home Page</div>
                </div>
              </button>

              {/* 2. Categories Redirection Option */}
              <button
                type="button"
                onClick={() => {
                  onOpenCategories();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left cursor-pointer group"
              >
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/60 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold leading-tight flex items-center gap-1.5">
                    <span>කතා වර්ගීකරණ</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white">Grid</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Categories (5x4 Grids)</div>
                </div>
              </button>

              {/* 3. Sitemap / Archives Option */}
              {onOpenSitemap && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenSitemap();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left cursor-pointer group"
                >
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/60 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold leading-tight">සියලු කතා සූචිය</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Sitemap & Archives</div>
                  </div>
                </button>
              )}

              {/* Divider & Quick Theme Toggle in Menu */}
              <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 px-3.5 py-2 flex items-center justify-between text-xs text-slate-500">
                <span>තේමාව (Theme):</span>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-slate-600" />
                      <span>Dark</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
