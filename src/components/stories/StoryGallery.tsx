import React from 'react';
import { Sparkles, SlidersHorizontal, BookOpen, Compass } from 'lucide-react';
import { Category, Story } from '../../types/story';
import { StoryCard } from './StoryCard';
import { FeaturedStoryHero } from './FeaturedStoryHero';
import { SearchBar } from '../common/SearchBar';
import { Pagination } from '../common/Pagination';
import { MonetagAdSlot } from '../ads/MonetagAdSlot';

interface StoryGalleryProps {
  stories: Story[];
  categories: Category[];
  featuredStories: Story[];
  selectedCategory: string;
  onSelectCategory: (catSlug: string) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  sortBy: 'latest' | 'popular' | 'readingTime';
  onSortChange: (sort: 'latest' | 'popular' | 'readingTime') => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onReadStory: (slug: string) => void;
  isLoading: boolean;
}

export const StoryGallery: React.FC<StoryGalleryProps> = ({
  stories,
  categories,
  featuredStories,
  selectedCategory,
  onSelectCategory,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  currentPage,
  totalPages,
  onPageChange,
  onReadStory,
  isLoading,
}) => {
  const showFeaturedHero = currentPage === 1 && !searchTerm && selectedCategory === 'all' && featuredStories.length > 0;

  return (
    <div id="story-gallery-container" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Top Header Sponsor Ad */}
      <div className="mb-6">
        <MonetagAdSlot type="header" slotLabel="Header Sponsor (Monetag Top Leaderboard)" />
      </div>

      {/* Featured Story Hero (Page 1 default) */}
      {showFeaturedHero && (
        <FeaturedStoryHero story={featuredStories[0]} onRead={onReadStory} />
      )}

      {/* Gallery Filter & Search Section */}
      <div className="my-8 flex flex-col gap-4">
        {/* Search Bar & Sorter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:max-w-md">
            <SearchBar
              value={searchTerm}
              onChange={onSearchChange}
              placeholder="Search by title, genre, keyword, or author..."
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </span>
            <select
              id="sort-stories-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
            >
              <option value="latest">Latest Stories</option>
              <option value="popular">Most Popular</option>
              <option value="readingTime">Quick Reads (Time)</option>
            </select>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>All Categories</span>
          </button>

          {categories
            .filter((c) => c.slug !== 'all')
            .map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  id={`category-btn-${cat.slug}`}
                  onClick={() => onSelectCategory(cat.slug)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Gallery Header Title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            <span>
              {searchTerm
                ? `Search Results for "${searchTerm}"`
                : selectedCategory === 'all'
                ? 'Discover Stories'
                : `${categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory} Stories`}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {stories.length} {stories.length === 1 ? 'story' : 'stories'} available to read
          </p>
        </div>
      </div>

      {/* Stories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={`skeleton-${idx}`}
              className="animate-pulse flex flex-col bg-slate-100 dark:bg-slate-800/50 rounded-2xl h-80 p-4 border border-slate-200/50 dark:border-slate-800"
            >
              <div className="w-full h-44 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-1" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 my-6">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No stories found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or selecting a different category from above.
          </p>
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              onSelectCategory('all');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story, index) => (
              <React.Fragment key={story.id}>
                <StoryCard story={story} onRead={onReadStory} />

                {/* Inject a Monetag Native In-Gallery Ad Card after story #3 on larger grids */}
                {index === 2 && stories.length > 3 && (
                  <div className="md:col-span-2 lg:col-span-3 my-2">
                    <MonetagAdSlot
                      type="header"
                      slotLabel="In-Gallery Sponsor (Monetag Native Feed Unit)"
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Pagination Navigation */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      )}

      {/* Bottom Footer Ad */}
      <div className="mt-8">
        <MonetagAdSlot type="footer" slotLabel="Footer Sponsor (Monetag Bottom Leaderboard)" />
      </div>
    </div>
  );
};
