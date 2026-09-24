import React from 'react';
import {
  ChevronRight,
  Home,
  BookOpen,
  Calendar,
  Eye,
  ArrowRight,
  ListOrdered,
  Sparkles,
  Share2,
} from 'lucide-react';
import { Series, SeriesEpisode } from '../../utils/seriesTaxonomy';
import { Story, ReadingTheme } from '../../types/story';
import { Badge } from '../common/Badge';
import { HorizontalAdBanner } from '../common/HorizontalAdBanner';
import { SkyscraperAdBanner } from '../common/SkyscraperAdBanner';
import { RelatedStories } from './RelatedStories';
import { getCategoryDisplayName } from '../../utils/categoryTaxonomy';

interface SeriesHubProps {
  series: Series;
  relatedStories: Story[];
  theme: ReadingTheme;
  onReadEpisode: (seriesSlug: string, episodeNumber: number) => void;
  onSelectCategory: (catSlug: string) => void;
  onNavigateHome: () => void;
}

export const SeriesHub: React.FC<SeriesHubProps> = ({
  series,
  relatedStories,
  theme,
  onReadEpisode,
  onSelectCategory,
  onNavigateHome,
}) => {
  const firstEpisode = series.episodes[0];
  const latestEpisode = series.episodes[series.episodes.length - 1];

  const formattedDate = new Date(series.updatedDate || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const categoryName = getCategoryDisplayName(series.category);

  return (
    <div
      id="series-hub-container"
      className="relative max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8"
    >
      {/* Skyscraper ad banners on ultra-wide screens */}
      <div className="hidden min-[1680px]:block absolute left-[calc(100%+24px)] top-28 select-none">
        <div className="sticky top-20">
          <SkyscraperAdBanner id="series-hub-right-skyscraper" />
        </div>
      </div>
      <div className="hidden min-[1920px]:block absolute right-[calc(100%+24px)] top-28 select-none">
        <div className="sticky top-20">
          <SkyscraperAdBanner id="series-hub-left-skyscraper" />
        </div>
      </div>

      {/* Hierarchical Breadcrumbs: Home > Category > Series */}
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        <ol className="flex items-center flex-wrap gap-1.5 list-none p-0 m-0">
          <li>
            <a
              href="/"
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  onNavigateHome();
                }
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
            >
              <Home className="w-3 h-3" />
              <span>Home</span>
            </a>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </li>
          <li>
            <a
              href={`/category/${series.category}`}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  onSelectCategory(series.category);
                }
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
            >
              {categoryName}
            </a>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </li>
          <li
            aria-current="page"
            className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[240px] sm:max-w-md"
          >
            {series.title}
          </li>
        </ol>
      </nav>

      {/* Series Hero Section */}
      <header className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xs mb-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Cover Image */}
          <div className="relative aspect-[16/9] sm:aspect-[4/3] w-full sm:w-64 sm:shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-800">
            <img
              src={series.coverImage}
              alt={series.title}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute top-2.5 left-2.5">
              <Badge variant="accent" size="sm">
                {categoryName}
              </Badge>
            </div>
            {series.isMultiEpisode && (
              <div className="absolute bottom-2.5 right-2.5">
                <span className="px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-xs text-white text-[11px] font-semibold">
                  {series.totalEpisodes} Episodes
                </span>
              </div>
            )}
          </div>

          {/* Series Meta & Action */}
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" size="sm" className="font-semibold text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30">
                <ListOrdered className="w-3 h-3 mr-1" />
                කතා මාලාව (Series)
              </Badge>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                යාවත්කාලීන කළේ: {formattedDate}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Eye className="w-3 h-3 text-slate-400" />
                {series.views.toLocaleString()} views
              </span>
            </div>

            <h1
              id="series-hub-title"
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3 font-serif tracking-tight leading-snug"
            >
              {series.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {series.description || 'මෙම කතා මාලාවේ සියලුම කතාංග (Episodes) පහතින් පිළිවෙළින් කියවන්න.'}
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              {firstEpisode && (
                <a
                  href={`/posts/${series.slug}/episodes/${firstEpisode.episodeNumber}`}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey) {
                      e.preventDefault();
                      onReadEpisode(series.slug, firstEpisode.episodeNumber);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>කතාංගය 1 සිට කියවන්න</span>
                </a>
              )}

              {series.totalEpisodes > 1 && latestEpisode && (
                <a
                  href={`/posts/${series.slug}/episodes/${latestEpisode.episodeNumber}`}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey) {
                      e.preventDefault();
                      onReadEpisode(series.slug, latestEpisode.episodeNumber);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>නවතම කතාංගය ({latestEpisode.episodeNumber})</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: series.title,
                      text: series.description,
                      url: window.location.href,
                    }).catch(() => {});
                  }
                }}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                aria-label="Share Series"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Top Horizontal Ad Banner */}
      <HorizontalAdBanner id="series-hub-top-ad" showLabel={true} className="my-4" />

      {/* Episodes List Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
              <span>කතාංග ලැයිස්තුව (All Episodes)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-sans text-slate-600 dark:text-slate-400 font-semibold">
                {series.totalEpisodes}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              මෙම කතා මාලාවේ සියලුම කොටස් අනුපිළිවෙළින්
            </p>
          </div>
        </div>

        {/* Episodes Grid / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {series.episodes.map((ep) => {
            const isFirst = ep.episodeNumber === 1;
            const isLatest = ep.episodeNumber === series.latestEpisodeNumber && series.totalEpisodes > 1;

            return (
              <a
                key={ep.episodeNumber}
                href={`/posts/${series.slug}/episodes/${ep.episodeNumber}`}
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    onReadEpisode(series.slug, ep.episodeNumber);
                  }
                }}
                className="group p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 rounded-xl transition-all duration-200 flex items-start gap-3.5 shadow-xs hover:shadow-sm"
              >
                {/* Episode Number Icon */}
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 group-hover:text-white">
                    {ep.episodeNumber}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Episode {ep.episodeNumber}
                    </span>
                    {isFirst && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                        ආරම්භය (Start)
                      </span>
                    )}
                    {isLatest && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                        නවතම (Latest)
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-1 mb-1 transition-colors">
                    {ep.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
                    {ep.story.shortDescription || ep.story.description || 'කතාව කියවීමට මෙතැන ක්ලික් කරන්න.'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(ep.uploadDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                      <span>කියවන්න</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* Bottom Horizontal Ad Banner */}
      <HorizontalAdBanner id="series-hub-bottom-ad" showLabel={true} className="my-6" />

      {/* Related Stories in Same Category */}
      {relatedStories.length > 0 && (
        <section className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <RelatedStories
            stories={relatedStories}
            onRead={(slug) => {
              // Navigates via parent
              window.location.href = `/story/${slug}`;
            }}
          />
        </section>
      )}
    </div>
  );
};
