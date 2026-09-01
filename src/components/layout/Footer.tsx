import React from 'react';
import { BookOpen } from 'lucide-react';
import { Category } from '../../types/story';

interface FooterProps {
  categories: Category[];
  onSelectCategory: (categorySlug: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  categories,
  onSelectCategory,
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
            <p className="text-xs text-slate-500 dark:text-slate-400 sepia:text-[#6e5745] max-w-sm leading-relaxed">
              Walkathawa (වල් කතාව) is a dedicated Sinhala story reading platform. Read high quality fictional short stories, romance, and adventures updated daily.
            </p>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 sepia:text-[#7d6754] font-serif leading-relaxed">
              නවතම සිංහල කෙටිකතා, ආදර කතා, සහ ප්‍රබන්ධ කතා කියවීමට එකතු වන්න.
            </div>
          </div>

          {/* Quick Categories Col */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white sepia:text-[#36271c] mb-2">
              කතා වර්ගීකරණ (Genres)
            </h4>
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

        {/* Bottom Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 sepia:border-[#e5d7bc]/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500 sepia:text-[#7d6754]">
          <div>
            © {new Date().getFullYear()} Walkathawa (වල් කතාව). All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
