import React, { useState } from 'react';
import { Home, Search, BookOpen, AlertCircle } from 'lucide-react';
import { Category } from '../../types/story';

interface NotFoundPageProps {
  onNavigateHome: () => void;
  onSelectCategory: (catSlug: string) => void;
  onSearch: (term: string) => void;
  categories: Category[];
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigateHome,
  onSelectCategory,
  onSearch,
  categories,
}) => {
  const [query, setQuery] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-2">
        <AlertCircle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-4xl font-extrabold text-rose-500">404</span>
        <h1 className="text-2xl font-bold text-white">පිටුව හමු නොවීය (Page Not Found)</h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          ඔබ සොයන කතාව හෝ පිටුව ඉවත් කර හෝ වෙනත් ලිපිනයකට මාරු කර තිබිය හැක.
        </p>
      </div>

      {/* Quick Search */}
      <form onSubmit={handleSubmit} className="max-w-md mx-auto relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="වෙනත් කතාවක් සොයන්න..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
        />
      </form>

      {/* Categories suggestion */}
      <div className="pt-4 space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          ජනප්‍රිය වර්ගීකරණ
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          {categories.slice(0, 6).map((c) => (
            <button
              key={c.id || c.slug}
              onClick={() => onSelectCategory(c.slug || c.id)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer"
            >
              {c.sinhalaName || c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Home button */}
      <div className="pt-4">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-lg shadow-rose-950/30"
        >
          <Home className="w-4 h-4" />
          මුල් පිටුවට යන්න (Go Home)
        </button>
      </div>
    </div>
  );
};
