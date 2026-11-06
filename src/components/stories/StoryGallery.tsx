import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Filter, ChevronLeft, ChevronRight, BookOpen, X } from 'lucide-react';
import { Story, Category } from '../../types/story';
import { StoryCard } from '../StoryCard';

interface StoryGalleryProps {
  stories: Story[];
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (catSlug: string) => void;
  searchTerm: string;
  onSearchChange: (q: string) => void;
  sortBy: 'latest' | 'popular' | 'oldest';
  onSortChange: (sort: 'latest' | 'popular' | 'oldest') => void;
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
  onReadStory: (slug: string) => void;
  isLoading: boolean;
  isSearchOpen: boolean;
  onCloseSearch: () => void;
}

export const StoryGallery: React.FC<StoryGalleryProps> = ({
  stories,
  categories,
  selectedCategory,
  onSelectCategory,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  currentPage,
  totalPages,
  total,
  onPageChange,
  onReadStory,
  isLoading,
  isSearchOpen,
  onCloseSearch,
}) => {
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('walkathawa_bookmarks');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleBookmark = (story: Story) => {
    setBookmarks((prev) => {
      const next = prev.includes(story.slug)
        ? prev.filter((s) => s !== story.slug)
        : [...prev, story.slug];
      try {
        localStorage.setItem('walkathawa_bookmarks', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const currentCategoryObj = categories.find((c) => c.slug === selectedCategory || c.id === selectedCategory);
  const categoryTitle = currentCategoryObj?.sinhalaName || currentCategoryObj?.name || 'සියලු කතා';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Search Bar Drawer when activated */}
      {isSearchOpen && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-3 transition-all animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Search className="w-4 h-4 text-rose-500" />
              කතා සෙවුම (Search Stories)
            </h4>
            <button
              onClick={onCloseSearch}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="කතාවේ නම, චරිතය හෝ මාතෘකාව ඇතුළත් කරන්න..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-rose-950/40 border border-slate-800 p-6 md:p-8">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            දිනපතා අලුත්වන සිංහල කතා එකතුව
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            නවතම රස කතා, නවකතා සහ කෙටිකතා
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            ඔබ ප්‍රියකරන සියලුම වර්ගීකරණවල සිංහල කතා පහසුවෙන් කියවන්න. නොමිලේ, පිරිසිදු කියවීමේ අත්දැකීමක් සමග.
          </p>
        </div>
      </section>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => onSelectCategory('all')}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
          }`}
        >
          සියලු කතා
        </button>
        {categories.map((cat) => {
          const isSelected = selectedCategory === (cat.slug || cat.id);
          return (
            <button
              key={cat.id || cat.slug}
              onClick={() => onSelectCategory(cat.slug || cat.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat.sinhalaName || cat.name}
              {cat.storyCount ? ` (${cat.storyCount})` : ''}
            </button>
          );
        })}
      </div>

      {/* Control / Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-rose-500" />
          <h2 className="text-lg font-bold text-slate-100">{categoryTitle}</h2>
          <span className="text-xs text-slate-400">({total} ක් හමුවිය)</span>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">පිළිවෙල:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="latest">නවතම (Latest)</option>
            <option value="popular">ජනප්‍රියතම (Most Views)</option>
            <option value="oldest">පැරණිතම (Oldest)</option>
          </select>
        </div>
      </div>

      {/* Stories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-900/40 border border-slate-800 rounded-2xl p-5 h-56 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-4 bg-slate-800 rounded w-1/4"></div>
                <div className="h-6 bg-slate-800 rounded w-3/4"></div>
                <div className="h-3 bg-slate-800 rounded w-full"></div>
                <div className="h-3 bg-slate-800 rounded w-5/6"></div>
              </div>
              <div className="h-4 bg-slate-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl p-8 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">කතා කිසිවක් හමු නොවීය</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm
              ? `"${searchTerm}" සඳහා ගැළපෙන කතා නොමැත. වෙනත් සෙවුම් පදයක් උත්සාහ කරන්න.`
              : 'මෙම කාණ්ඩය යටතේ දැනට කතා ඇතුළත් වී නොමැත.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stories.map((story) => (
            <StoryCard
              key={story.id || story.slug}
              story={story}
              onSelect={() => onReadStory(story.slug || story.id)}
              isBookmarked={bookmarks.includes(story.slug)}
              onToggleBookmark={() => toggleBookmark(story)}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="පෙර පිටුව"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-900/60 border border-slate-800 rounded-xl">
            පිටුව {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="ඊළඟ පිටුව"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
