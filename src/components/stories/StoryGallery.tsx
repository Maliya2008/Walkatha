import React from 'react';
import { Story, Category } from '../../types/story';
import { StoryCard } from './StoryCard';
import { TripleInlineBanners320x50, SMART_LINK_URL } from '../common/AdUnits';

interface StoryGalleryProps {
  stories: Story[];
  totalStories: number;
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  onSelectStory: (slug: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: 'latest' | 'popular' | 'oldest';
  onSortChange: (sort: 'latest' | 'popular' | 'oldest') => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

export const StoryGallery: React.FC<StoryGalleryProps> = ({
  stories,
  selectedCategory,
  onSelectCategory,
  onSelectStory,
  onSearchChange,
  sortBy,
  onSortChange,
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}) => {
  const pageNumbers: number[] = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const getPageUrl = (page: number) => {
    const base =
      selectedCategory && selectedCategory !== 'all'
        ? `/category/${encodeURIComponent(selectedCategory)}`
        : '/';
    return page > 1 ? `${base}?page=${page}` : base;
  };

  return (
    <div className="space-y-5">
      <h1 className="sr-only">සිංහල වැල කතා | වල් කතා සහ වැල කතා 2026</h1>

      {/* Sorting option & Smart Link below header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <a
          href={SMART_LINK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
        >
          🔥 විශේෂ සිංහල වැල කතා එකතුව (Special Stories) →
        </a>
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-xs font-medium text-slate-600 dark:text-slate-400">
            පෙළගැස්ම:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as 'latest' | 'popular' | 'oldest')}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-[#243763] bg-white dark:bg-[#111a33] text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="latest">අලුත්ම කතා (Latest)</option>
            <option value="popular">ජනප්‍රියම (Popular)</option>
            <option value="oldest">පැරණිම (Oldest)</option>
          </select>
        </div>
      </div>

      {/* Stories Grid: 3 columns, max 10 rows (30 cards) per page */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div
              key={idx}
              className="h-64 rounded-lg bg-white dark:bg-[#111a33] border border-slate-200 dark:border-[#1e2d52] p-4 animate-pulse"
            />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="bg-white dark:bg-[#111a33] border border-slate-200 dark:border-[#1e2d52] rounded-lg p-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
            ඔබ සෙවූ කතාව හමු නොවීය. සියලුම සිංහල වැල කතා පිරික්සන්න.
          </p>
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              onSelectCategory('all');
            }}
            className="px-4 py-2 text-xs font-semibold rounded-md bg-[#1e3a8a] text-white hover:bg-blue-800 cursor-pointer"
          >
            සියලුම කතා පෙන්වන්න
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stories.slice(0, 15).map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onSelect={onSelectStory}
                onSelectCategory={onSelectCategory}
              />
            ))}
          </div>

          {/* Three 320x50 Banners inline in the middle of stories */}
          <TripleInlineBanners320x50 label="gallery-middle" />

          {stories.length > 15 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stories.slice(15, 30).map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onSelect={onSelectStory}
                  onSelectCategory={onSelectCategory}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Crawlable Pagination */}
      {totalPages > 1 && (
        <nav
          aria-label="පිටු අංකනය"
          className="flex items-center justify-center gap-1.5 pt-4 flex-wrap"
        >
          {currentPage > 1 && (
            <a
              href={getPageUrl(currentPage - 1)}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  onPageChange(currentPage - 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 dark:border-[#1e2d52] bg-white dark:bg-[#111a33] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162347]"
            >
              ← කලින්
            </a>
          )}

          {pageNumbers.map((page) => (
            <a
              key={page}
              href={getPageUrl(page)}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  onPageChange(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                page === currentPage
                  ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                  : 'bg-white dark:bg-[#111a33] border-slate-200 dark:border-[#1e2d52] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162347]'
              }`}
            >
              {page}
            </a>
          ))}

          {currentPage < totalPages && (
            <a
              href={getPageUrl(currentPage + 1)}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  onPageChange(currentPage + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 dark:border-[#1e2d52] bg-white dark:bg-[#111a33] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162347]"
            >
              ඊළඟ →
            </a>
          )}
        </nav>
      )}
    </div>
  );
};
