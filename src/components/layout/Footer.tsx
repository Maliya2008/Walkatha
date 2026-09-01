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
      className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 py-10 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Brand Col */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-slate-900 dark:text-white">
                Walkathawa <span className="text-indigo-600 dark:text-indigo-400 text-sm font-serif">(වල් කතාව)</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Walkathawa (වල් කතාව) is a place to read Sinhala stories online. Discover new Sinhala katha, romantic stories, fictional stories, and interesting short stories updated regularly.
            </p>
            <div className="text-[11px] text-slate-400 font-serif leading-relaxed">
              නවතම සිංහල කෙටිකතා, ආදර කතා, සහ ප්‍රබන්ධ කතා කියවීමට හොඳම වෙබ් අඩවිය.
            </div>
          </div>

          {/* Quick Categories Col */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              කතා වර්ගීකරණ (Genres)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {categories
                .filter((c) => c.slug !== 'all')
                .slice(0, 6)
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.slug)}
                    className="text-left text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-0.5 cursor-pointer"
                  >
                    {cat.name}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 text-[11px] text-slate-400">
          <div className="text-center w-full sm:text-left">
            © {new Date().getFullYear()} Walkathawa (වල් කතාව). All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
