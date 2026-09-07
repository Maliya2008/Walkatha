import React from 'react';
import { BookOpen } from 'lucide-react';
import { Category } from '../../types/story';

interface FooterProps {
  categories: Category[];
  onSelectCategory: (categorySlug: string) => void;
  onSearchKeyword?: (keyword: string) => void;
  onOpenSitemap?: () => void;
}

const POPULAR_KEYWORDS = [
  'walkatha',
  'wal katha',
  'sinhala wal katha',
  'wela katha',
  'aluth wal katha',
  'wal katha 2026',
  'sinhala wela katha',
  'amma wal katha',
  'akka malli wal katha',
  'wife wal katha',
  'teacher wal katha',
  'nanda wal katha',
  'pawule wal katha',
  'sinhala sex katha',
  'rasika katha',
  'hora katha',
];

export const Footer: React.FC<FooterProps> = ({
  categories,
  onSelectCategory,
  onSearchKeyword,
  onOpenSitemap,
}) => {
  return (
    <footer
      id="main-app-footer"
      className="w-full border-t border-slate-200 dark:border-slate-800/80 sepia:border-[#e5d7bc]/60 bg-white dark:bg-slate-950 sepia:bg-[#f4ebd9] text-slate-600 dark:text-slate-400 sepia:text-[#5b4636] py-6 sm:py-8 transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Brand Col */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 sepia:bg-[#36271c] sepia:text-[#fbf7ee]">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white sepia:text-[#36271c]">
                Walkathawa <span className="text-indigo-600 dark:text-indigo-400 text-xs font-serif">(වල් කතාව)</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 sepia:text-[#6e5745] max-w-sm leading-relaxed">
              Walkathawa (වල් කතාව) is a dedicated Sinhala story reading platform. Read high quality fictional short stories, romance, and adventures updated daily.
            </p>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 sepia:text-[#7d6754] font-serif leading-relaxed">
              නවතම සිංහල කෙටිකතා, ආදර කතා, සහ ප්‍රබන්ධ කතා කියවීමට එකතු වන්න.
            </div>
          </div>

          {/* Quick Categories Col */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white sepia:text-[#36271c] mb-2">
              කතා වර්ගීකරණ (Genres)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
              {categories
                .filter((c) => c.slug !== 'all')
                .slice(0, 6)
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.slug)}
                    className="text-left text-slate-600 dark:text-slate-400 sepia:text-[#5b4636] hover:text-indigo-600 dark:hover:text-indigo-400 sepia:hover:text-[#251910] transition-colors py-0.5 cursor-pointer truncate"
                  >
                    • {cat.name}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Popular Search Keywords */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 sepia:border-[#e5d7bc]/40 mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white sepia:text-[#36271c] mb-2">
            ජනප්‍රිය සෙවුම් පද (Popular Keywords)
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_KEYWORDS.map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => onSearchKeyword?.(kw)}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-900/80 sepia:bg-[#ebdcc7] text-slate-600 dark:text-slate-300 sepia:text-[#423326] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
              >
                #{kw}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 sepia:border-[#e5d7bc]/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 sepia:text-[#7d6754]">
          <div>
            © {new Date().getFullYear()} Walkathawa (වල් කතාව). All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/sitemap"
              onClick={(e) => {
                if (onOpenSitemap) {
                  e.preventDefault();
                  onOpenSitemap();
                }
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              සයිට්මැප් (Sitemap)
            </a>
            <span>•</span>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Robots.txt
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
