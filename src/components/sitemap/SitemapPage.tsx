import React, { useState, useMemo, useEffect } from 'react';
import {
  ExternalLink,
  Search,
  Copy,
  Check,
  Globe,
  Layers,
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  BookOpen,
  ListOrdered
} from 'lucide-react';
import { Story, Category } from '../../types/story';
import { HorizontalAdBanner } from '../common/HorizontalAdBanner';
import { SkyscraperAdBanner } from '../common/SkyscraperAdBanner';
import {
  groupStoriesIntoSeries,
  getSeriesCanonicalUrl,
  getEpisodeCanonicalUrl,
  detectSeriesInfo,
} from '../../utils/seriesTaxonomy';
import { getCategoryDisplayName } from '../../utils/categoryTaxonomy';

interface SitemapPageProps {
  stories: Story[];
  categories: Category[];
  onSelectStory: (slug: string, seriesSlug?: string, episodeNumber?: number) => void;
  onNavigateHome: () => void;
  onSelectCategory?: (slug: string) => void;
  onSelectSeries?: (seriesSlug: string) => void;
}

export const SitemapPage: React.FC<SitemapPageProps> = ({
  stories,
  categories,
  onSelectStory,
  onNavigateHome,
  onSelectCategory,
  onSelectSeries,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'Walkathawa Archives & Sitemap (සියලු කතා සූචිය) | Sinhala Stories Directory';

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonical) {
      canonical.href = 'https://www.walkathawa.site/archives';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      document.title = originalTitle;
    };
  }, []);

  const publicBaseUrl = 'https://www.walkathawa.site';
  const xmlSitemapUrl = `${publicBaseUrl}/sitemap.xml`;

  const handleCopyXmlUrl = () => {
    navigator.clipboard.writeText(xmlSitemapUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const seriesList = useMemo(() => {
    return groupStoriesIntoSeries(stories);
  }, [stories]);

  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      if (!story.published) return false;
      const matchesCategory =
        selectedCategory === 'all' ||
        story.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const titleMatch = story.title.toLowerCase().includes(q);
      const slugMatch = story.slug.toLowerCase().includes(q);
      const authorMatch = story.author?.name?.toLowerCase().includes(q);
      const tagMatch = story.tags?.some((t) => t.toLowerCase().includes(q));

      return titleMatch || slugMatch || authorMatch || tagMatch;
    });
  }, [stories, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Side Skyscraper Ad Banners on Wide Screens */}
        <div className="hidden xl:block absolute left-[calc(100%+24px)] top-28 select-none">
          <div className="sticky top-20">
            <SkyscraperAdBanner id="sitemap-right-skyscraper" />
          </div>
        </div>
        <div className="hidden 2xl:block absolute right-[calc(100%+24px)] top-28 select-none">
          <div className="sticky top-20">
            <SkyscraperAdBanner id="sitemap-left-skyscraper" />
          </div>
        </div>

        {/* Back Button & Header */}
        <div className="flex items-center justify-between mb-6">
          <a
            href="/"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                onNavigateHome();
              }
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>මුල් පිටුවට (Back to Home)</span>
          </a>

          <div className="flex items-center gap-2">
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>XML Sitemap</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Hero Title & Description */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Complete Architecture & Content Index</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-serif tracking-tight">
            සියලු කතා සූචිය (Stories & Series Archives)
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 max-w-3xl leading-relaxed">
            Walkathawa වෙබ් අඩවියේ ඇති සියලුම සිංහල කතා මාලා (Series Hubs), කතාංග (Episodes), සහ ප්‍රධාන ප්‍රවර්ග (Categories) සවිස්තරාත්මකව පහතින් සොයාගන්න.
          </p>
        </div>

        {/* Top Horizontal Ad Banner */}
        <HorizontalAdBanner id="sitemap-top-ad" showLabel={true} className="my-6" />

        {/* Section 1: Core Navigation Routes */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-500" />
            ප්‍රධාන පිටු (Core Discovery Pathways)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <a
              href="/"
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  onNavigateHome();
                }
              }}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Home (මුල් පිටුව)
                </span>
                <span className="block text-[11px] font-mono text-slate-400 mt-0.5">/</span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
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
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Latest (නවතම කතා)
                </span>
                <span className="block text-[11px] font-mono text-slate-400 mt-0.5">/latest</span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
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
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Popular (ජනප්‍රිය කතා)
                </span>
                <span className="block text-[11px] font-mono text-slate-400 mt-0.5">/popular</span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
            </a>

            <a
              href="/archives"
              className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-center justify-between"
            >
              <div>
                <span className="font-semibold text-sm">Archives (කතා සූචිය)</span>
                <span className="block text-[11px] font-mono opacity-80 mt-0.5">/archives</span>
              </div>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Section 2: Story / Series Hubs */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-indigo-500" />
            ප්‍රධාන කතා මාලා (Series Hubs Index)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
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
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                        {getCategoryDisplayName(series.category)}
                      </span>
                      <span className="text-slate-400 font-medium">
                        {series.totalEpisodes} Episodes
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {series.title}
                    </h3>
                    <span className="block text-[11px] font-mono text-slate-400 mt-1 truncate">
                      {seriesHubUrl}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Section 3: Categories Index */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-500" />
            ප්‍රවර්ග සූචිය (Categories Directory)
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories
              .filter((cat) => cat.slug !== 'all')
              .map((cat) => {
                const count = stories.filter((s) => s.published && s.category === cat.slug).length;
                return (
                  <a
                    key={cat.id || cat.slug}
                    href={`/category/${cat.slug}`}
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        if (onSelectCategory) {
                          onSelectCategory(cat.slug);
                        } else {
                          window.location.href = `/category/${cat.slug}`;
                        }
                      }
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all group"
                  >
                    <span>{cat.name}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {count}
                    </span>
                  </a>
                );
              })}
          </div>
        </div>

        {/* Section 4: All Published Stories & Episodes */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>සියලුම කතාංග ({filteredStories.length})</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                සෑම කතාවකටම අනන්‍ය වූ Hierarchical Canonical URL එකක් ඇත.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter stories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                />
              </div>

              <select
                aria-label="Filter category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories
                  .filter((c) => c.slug !== 'all')
                  .map((c) => (
                    <option key={c.id || c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Stories List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
            {filteredStories.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                සෙවුම් පදයට ගැළපෙන කතා කිසිවක් හමු නොවීය.
              </div>
            ) : (
              filteredStories.map((story, index) => {
                const info = detectSeriesInfo(story);
                const canonicalUrl = getEpisodeCanonicalUrl(story);
                const dateStr = story.uploadDate || story.uploadedDate;
                const formattedDate = dateStr
                  ? new Date(dateStr).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'Recent';

                return (
                  <a
                    key={story.id || story.slug}
                    href={canonicalUrl}
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        onSelectStory(story.slug, info.seriesSlug, info.episodeNumber);
                      }
                    }}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group block no-underline"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {story.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          <span className="font-mono text-indigo-600 dark:text-indigo-400">
                            {canonicalUrl}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formattedDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {story.readingTime || 5} min read
                          </span>
                          {story.author?.name && (
                            <span>By: {story.author.name}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium capitalize">
                        {getCategoryDisplayName(story.category)}
                      </span>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </a>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Horizontal Ad Banner */}
        <HorizontalAdBanner id="sitemap-bottom-ad" showLabel={true} className="my-8" />
      </div>
    </div>
  );
};
