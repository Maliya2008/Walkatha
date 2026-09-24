import React, { useMemo } from 'react';
import {
  Sparkles,
  Flame,
  Clock,
  Archive,
  Layers,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { Category, Story } from '../../types/story';
import { StoryCard } from './StoryCard';
import { SearchBar } from '../common/SearchBar';
import { Pagination } from '../common/Pagination';
import { HorizontalAdBanner } from '../common/HorizontalAdBanner';
import { SkyscraperAdBanner } from '../common/SkyscraperAdBanner';
import {
  groupStoriesIntoSeries,
  getSeriesCanonicalUrl,
} from '../../utils/seriesTaxonomy';
import {
  getCategoryDefinition,
  getCategoryDisplayName,
} from '../../utils/categoryTaxonomy';

interface StoryGalleryProps {
  stories: Story[];
  allStories?: Story[];
  categories: Category[];
  featuredStories: Story[];
  selectedCategory: string;
  onSelectCategory: (catSlug: string) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  sortBy: 'latest' | 'popular';
  onSortChange: (sort: 'latest' | 'popular') => void;
  currentPage: number;
  totalPages: number;
  total?: number;
  onPageChange: (page: number) => void;
  onReadStory: (slug: string, seriesSlug?: string, episodeNumber?: number) => void;
  onSelectSeries?: (seriesSlug: string) => void;
  isLoading: boolean;
  viewMode?: 'home' | 'latest' | 'popular' | 'category' | 'series' | 'archives';
}

export const StoryGallery: React.FC<StoryGalleryProps> = ({
  stories,
  allStories = [],
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
  total,
  onPageChange,
  onReadStory,
  onSelectSeries,
  isLoading,
  viewMode = 'home',
}) => {
  // Extract all series for the Series Hub discovery section
  const seriesList = useMemo(() => {
    const sourceStories = allStories.length > 0 ? allStories : stories;
    const all = groupStoriesIntoSeries(sourceStories);
    if (selectedCategory && selectedCategory !== 'all') {
      return all.filter((s) => s.category === selectedCategory && s.isMultiEpisode);
    }
    return all.filter((s) => s.isMultiEpisode);
  }, [allStories, stories, selectedCategory]);

  const categoryDef = useMemo(() => {
    if (selectedCategory && selectedCategory !== 'all') {
      return getCategoryDefinition(selectedCategory);
    }
    return null;
  }, [selectedCategory]);

  return (
    <div id="story-gallery-container" className="relative max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      {/* Side Skyscraper Ad Banners on Ultra-Wide Screens */}
      <div className="hidden min-[1680px]:block absolute left-[calc(100%+24px)] top-28 select-none">
        <div className="sticky top-20">
          <SkyscraperAdBanner id="gallery-right-skyscraper" />
        </div>
      </div>
      <div className="hidden min-[1920px]:block absolute right-[calc(100%+24px)] top-28 select-none">
        <div className="sticky top-20">
          <SkyscraperAdBanner id="gallery-left-skyscraper" />
        </div>
      </div>

      {/* Discovery Pathways Navigation (Target Architecture: Home | Latest | Popular | Series | Archives) */}
      <nav aria-label="Main Sections" className="mb-4 flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200/60 dark:border-slate-800/80 pt-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <a
            href="/"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                onSelectCategory('all');
                onSortChange('latest');
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              viewMode === 'home' && selectedCategory === 'all' && sortBy === 'latest'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>මුල් පිටුව (Home)</span>
          </a>

          <a
            href="/latest"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                window.history.pushState({}, '', '/latest');
                window.dispatchEvent(new Event('popstate'));
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              viewMode === 'latest' || (sortBy === 'latest' && selectedCategory === 'all' && viewMode !== 'home')
                ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>නවතම කතා (Latest)</span>
          </a>

          <a
            href="/popular"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                window.history.pushState({}, '', '/popular');
                window.dispatchEvent(new Event('popstate'));
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              viewMode === 'popular' || sortBy === 'popular'
                ? 'bg-amber-600 text-white shadow-xs dark:bg-amber-500'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>ජනප්‍රිය කතා (Popular)</span>
          </a>

          <a
            href="/archives"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                window.history.pushState({}, '', '/archives');
                window.dispatchEvent(new Event('popstate'));
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              viewMode === 'archives'
                ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-500'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Archive className="w-3.5 h-3.5 text-emerald-500" />
            <span>කතා සූචිය (Archives)</span>
          </a>
        </div>
      </nav>

      {/* Gallery Filter & Search Section */}
      <div className="mb-4 flex flex-col gap-3">
        {/* Search Bar & Sorter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:max-w-md">
            <SearchBar
              value={searchTerm}
              onChange={onSearchChange}
              placeholder="Search by title, genre, keyword..."
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <label
              htmlFor="sort-stories-select"
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 cursor-pointer"
            >
              <span>Sort:</span>
            </label>
            <select
              id="sort-stories-select"
              aria-label="Sort stories"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
            >
              <option value="latest">Latest Stories</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Category Pills Navigation (Crawlable /category/{slug} URLs) */}
        <nav aria-label="Categories" className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <a
            href="/"
            id="category-btn-all"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                onSelectCategory('all');
              }
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all' || !selectedCategory
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <span>සියලු වර්ගීකරණ (All)</span>
          </a>

          {categories
            .filter((c) => c.slug !== 'all')
            .map((cat) => {
              const catKey = cat.slug || cat.id;
              const isSelected =
                selectedCategory !== 'all' &&
                Boolean(selectedCategory) &&
                (
                  (Boolean(cat.slug) && selectedCategory.toLowerCase() === cat.slug.toLowerCase()) ||
                  (Boolean(cat.id) && selectedCategory.toLowerCase() === cat.id.toLowerCase())
                );

              return (
                <a
                  key={cat.id || cat.slug}
                  href={`/category/${catKey}`}
                  id={`category-btn-${catKey}`}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey) {
                      e.preventDefault();
                      onSelectCategory(catKey);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{cat.name}</span>
                </a>
              );
            })}
        </nav>
      </div>

      {/* Top Horizontal Ad Banner */}
      <HorizontalAdBanner id="gallery-top-ad" showLabel={true} className="my-3 sm:my-4" />

      {/* Category Landing Hero (When on /category/:slug) */}
      {categoryDef && selectedCategory !== 'all' && (
        <section className="mb-6 bg-gradient-to-br from-indigo-500/10 via-slate-100 dark:via-slate-900/60 to-purple-500/10 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Category Hub • වර්ගීකරණය
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-serif mt-1">
                {categoryDef.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {categoryDef.description}
              </p>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
              {total || stories.length} කතා එකතුවක්
            </div>
          </div>
        </section>
      )}

      {/* Story / Series Hubs Showcase Section (Hierarchy: Series Hubs -> Episodes) */}
      {seriesList.length > 0 && !searchTerm && currentPage === 1 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>ප්‍රධාන කතා මාලා (Story Series Hubs)</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {seriesList.length} කතා මාලා
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {seriesList.map((series) => {
              const seriesHubUrl = getSeriesCanonicalUrl(series.slug);

              return (
                <a
                  key={series.slug}
                  href={seriesHubUrl}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey) {
                      e.preventDefault();
                      if (onSelectSeries) {
                        onSelectSeries(series.slug);
                      } else {
                        window.location.href = seriesHubUrl;
                      }
                    }
                  }}
                  className="group p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 rounded-xl transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 uppercase tracking-wider">
                        {getCategoryDisplayName(series.category)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {series.totalEpisodes} කතාංග (Episodes)
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-base text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-1 mb-1 transition-colors">
                      {series.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {series.description || 'සියලු කතාංග එකම පිටුවකින් කියවන්න.'}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <span>කතා මාලාව කියවන්න</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Gallery Header Title */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>
              {searchTerm
                ? `Search Results for "${searchTerm}"`
                : viewMode === 'latest'
                ? 'නවතම කතා (Latest Stories)'
                : viewMode === 'popular'
                ? 'ජනප්‍රියම කතා (Popular Stories)'
                : selectedCategory === 'all'
                ? 'Discover Stories (කතා එකතුව)'
                : `${categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory} Stories`}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {typeof total === 'number' && total > stories.length
              ? `Showing ${stories.length} of ${total} stories`
              : `${stories.length} ${stories.length === 1 ? 'story' : 'stories'} available`}
            {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
          </p>
        </div>
      </div>

      {/* Stories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 py-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
            <div
              key={`skeleton-${idx}`}
              className="animate-pulse flex flex-col bg-slate-100 dark:bg-slate-800/50 rounded-xl h-72 p-4 border border-slate-200/50 dark:border-slate-800"
            />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 my-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {stories.map((story, index) => (
              <StoryCard
                key={story.id}
                story={story}
                onRead={onReadStory}
                priority={index === 0}
              />
            ))}
          </div>

          {/* Bottom Horizontal Ad Banner */}
          <HorizontalAdBanner id="gallery-bottom-ad" showLabel={true} className="mt-8 mb-4" />

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
