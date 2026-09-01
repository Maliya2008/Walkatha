import React from 'react';
import { Category, Story } from '../../types/story';
import { StoryCard } from './StoryCard';
import { FeaturedStoryHero } from './FeaturedStoryHero';
import { SearchBar } from '../common/SearchBar';
import { Pagination } from '../common/Pagination';

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
            </div>
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 my-6">
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
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} onRead={onReadStory} />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  );
};
