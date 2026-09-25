import React, { useRef, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, X, ArrowUpDown, BookOpen } from 'lucide-react';
import { Category, Story } from '../../types/story';
import { StoryCard } from './StoryCard';
import { getCategoryDisplayName } from '../../utils/categoryTaxonomy';
import { cleanCategoryBadgeName } from '../../utils/formatters';

interface StoryGalleryProps {
  stories: Story[];
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (catSlug: string) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  sortBy: 'latest' | 'popular' | 'oldest';
  onSortChange: (sort: 'latest' | 'popular' | 'oldest') => void;
  currentPage: number;
  totalPages: number;
  total: number;
  limit?: number;
  onPageChange: (page: number) => void;
  onReadStory: (slug: string) => void;
  isLoading: boolean;
  isSearchOpen?: boolean;
  onCloseSearch?: () => void;
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
  limit = 20,
  onPageChange,
  onReadStory,
  isLoading,
  isSearchOpen = false,
  onCloseSearch,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when isSearchOpen changes to true
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Determine section heading
  const sectionTitle = searchTerm
    ? `සෙවුම: "${searchTerm}"`
    : selectedCategory === 'all'
    ? 'නවතම කතා'
    : cleanCategoryBadgeName(getCategoryDisplayName(selectedCategory));

  // Compute pagination range to show cleanly on mobile & desktop
  const getPaginationItems = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const items: (number | string)[] = [];
    items.push(1);
    if (currentPage > 3) {
      items.push('...');
    }
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      items.push(i);
    }
    if (currentPage < totalPages - 2) {
      items.push('...');
    }
    items.push(totalPages);
    return items;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* 1. Category Navigation (Horizontally scrollable on mobile, compact on desktop) */}
      <nav aria-label="කතා වර්ගීකරණ" className="relative">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            සියලුම (All)
          </button>

          {categories
            .filter((c) => c.slug !== 'all')
            .map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              const displayName = cleanCategoryBadgeName(cat.name);
              return (
                <button
                  key={cat.id || cat.slug}
                  type="button"
                  onClick={() => onSelectCategory(cat.slug)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {displayName}
                </button>
              );
            })}
        </div>
      </nav>

      {/* 2. Search Input (Expandable or toggleable) */}
      {(isSearchOpen || searchTerm) && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="කතා මාතෘකා හෝ වර්ගීකරණ සොයන්න..."
            className="w-full pl-10 pr-9 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 focus:outline-hidden focus:border-rose-500 dark:focus:border-rose-400 text-slate-900 dark:text-white shadow-xs transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
              aria-label="සෙවුම මකන්න"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 3. Section Heading & Sort Controls */}
      <div className="flex items-center justify-between gap-3 pt-1 border-b border-slate-200/60 dark:border-slate-800/60 pb-2.5">
        <div className="flex items-baseline gap-2">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {sectionTitle}
          </h1>
          {total > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({total})
            </span>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={sortBy === 'popular' ? 'latest' : sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
            aria-label="අනුපිළිවෙල"
          >
            <option value="latest" className="dark:bg-slate-900">අලුත්ම (Latest)</option>
            <option value="oldest" className="dark:bg-slate-900">පැරණිම (Oldest)</option>
          </select>
        </div>
      </div>

      {/* 4. Story Feed (4-columns Gallery Grid Layout with at least 5 rows per page) */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 py-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden animate-pulse flex flex-col h-72"
            >
              <div className="h-28 bg-slate-200 dark:bg-slate-800 w-full shrink-0" />
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-full" />
                </div>
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2 pt-2 border-t border-slate-100 dark:border-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : stories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {stories.map((story, idx) => (
            <StoryCard
              key={story.id}
              story={story}
              onRead={onReadStory}
              onSelectCategory={onSelectCategory}
              priority={idx < 4}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 my-4 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            කතා කිසිවක් හමු නොවීය
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            වෙනත් වචනයක් යොදා සොයන්න හෝ වෙනත් වර්ගීකරණයක් තෝරන්න.
          </p>
          {(searchTerm || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                onSelectCategory('all');
              }}
              className="mt-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
            >
              සියලුම කතා වෙත යන්න
            </button>
          )}
        </div>
      )}

      {/* 5. Simple Accessible Pagination */}
      {totalPages > 1 && (
        <nav
          aria-label="Story Pagination"
          className="flex items-center justify-center gap-1.5 pt-6 pb-4"
        >
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => {
              onPageChange(currentPage - 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-1 min-h-[44px] px-3 rounded-lg text-xs sm:text-sm font-semibold border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden xs:inline">කලින්</span>
          </button>

          <div className="flex items-center gap-1">
            {getPaginationItems().map((item, idx) => {
              if (item === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-8 h-10 flex items-center justify-center text-xs text-slate-400"
                  >
                    ...
                  </span>
                );
              }
              const p = item as number;
              const isActive = p === currentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    onPageChange(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`min-w-[40px] min-h-[44px] px-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => {
              onPageChange(currentPage + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-1 min-h-[44px] px-3 rounded-lg text-xs sm:text-sm font-semibold border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span className="hidden xs:inline">ඊළඟ</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  );
};
