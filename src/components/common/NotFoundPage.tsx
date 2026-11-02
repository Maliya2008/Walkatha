import React, { useState } from 'react';
import { Home, Search, BookOpen, ArrowLeft, FolderTree } from 'lucide-react';
import { Category } from '../../types/story';

interface NotFoundPageProps {
  onNavigateHome: () => void;
  onSelectCategory?: (categorySlug: string) => void;
  onSearch?: (term: string) => void;
  categories?: Category[];
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigateHome,
  onSelectCategory,
  onSearch,
  categories = [],
}) => {
  const [query, setQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query.trim());
      onNavigateHome();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 text-center animate-fadeIn">
      <div className="inline-flex p-4 rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-6">
        <BookOpen className="w-12 h-12" />
      </div>

      <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
        404
      </h1>

      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2 mb-3">
        පිටුව හමු නොවීය (Page Not Found)
      </h2>

      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-8">
        ඔබ සොයන පිටුව හෝ කතාව හමු නොවීය. ලිපිනය වැරදි විය හැක, නැතහොත් එම කතාව ඉවත් කර තිබිය හැක.
      </p>

      {/* Quick Search */}
      <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto mb-8 flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="කතාවක නමක් සොයන්න..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 shadow-xs"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm transition-colors cursor-pointer shadow-xs"
        >
          සොයන්න
        </button>
      </form>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-sm transition-all shadow-xs cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>මුල් පිටුවට (Home)</span>
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>පෙර පිටුවට (Go Back)</span>
        </button>
      </div>

      {/* Popular Categories Links */}
      {categories && categories.length > 0 && (
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-rose-500" />
            <span>ජනප්‍රිය වර්ගීකරණ</span>
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
            {categories
              .filter((c) => c.slug !== 'all')
              .slice(0, 8)
              .map((cat) => (
                <button
                  key={cat.id || cat.slug}
                  onClick={() => onSelectCategory && onSelectCategory(cat.slug)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {cat.name}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
