import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { useStories } from './hooks/useStories';
import { useStory } from './hooks/useStory';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { FooterAdBanner } from './components/common/FooterAdBanner';
import { StoryGallery } from './components/stories/StoryGallery';
import { SitemapPage } from './components/sitemap/SitemapPage';
import { SEOService } from './services/seoService';
import { adminAdBlocker } from './services/adminAdBlocker';
import { adService } from './services/adService';
import {
  normalizeCategorySlug,
  getCategoryDisplayName,
  isValidCategorySlug,
} from './utils/categoryTaxonomy';
import {
  groupStoriesIntoSeries,
  findSeriesBySlug,
  findEpisodeInSeries,
  getAdjacentEpisodesInSeries,
  detectSeriesInfo,
  Series,
  SeriesEpisode,
} from './utils/seriesTaxonomy';

// Lazy-load heavy views to keep bundle fast
const StoryReader = lazy(() =>
  import('./components/stories/StoryReader').then((m) => ({ default: m.StoryReader }))
);
const SeriesHub = lazy(() =>
  import('./components/stories/SeriesHub').then((m) => ({ default: m.SeriesHub }))
);
const AdminRoot = lazy(() =>
  import('./components/admin/AdminRoot').then((m) => ({ default: m.AdminRoot }))
);

export default function App() {
  const { theme, setTheme, fontSize, setFontSize, fontFamily, setFontFamily } = useTheme();

  const {
    stories,
    total,
    page,
    totalPages,
    categories,
    featuredStories,
    isLoading: isStoriesLoading,
    params,
    setCategory,
    setSearch,
    setPage,
    setSortBy,
  } = useStories();

  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [isArchivesView, setIsArchivesView] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'home' | 'latest' | 'popular' | 'category' | 'archives'>('home');
  const [currentSeriesSlug, setCurrentSeriesSlug] = useState<string | null>(null);
  const [currentEpisodeNum, setCurrentEpisodeNum] = useState<number | null>(null);
  const [currentStorySlug, setCurrentStorySlug] = useState<string | null>(null);

  // Group all stories into Series hierarchy
  const allSeries = useMemo(() => {
    return groupStoriesIntoSeries(stories);
  }, [stories]);

  // Look up active series if in series hub or episode view
  const activeSeries: Series | null = useMemo(() => {
    if (!currentSeriesSlug) return null;
    return findSeriesBySlug(currentSeriesSlug, stories);
  }, [currentSeriesSlug, stories]);

  // Look up active episode in series
  const activeSeriesEpisode: SeriesEpisode | null = useMemo(() => {
    if (!activeSeries || currentEpisodeNum === null) return null;
    return findEpisodeInSeries(activeSeries, currentEpisodeNum);
  }, [activeSeries, currentEpisodeNum]);

  // Compute adjacent episodes within the series
  const { prevEpisode, nextEpisode } = useMemo(() => {
    if (!activeSeries || currentEpisodeNum === null) {
      return { prev: null, next: null };
    }
    return getAdjacentEpisodesInSeries(activeSeries, currentEpisodeNum);
  }, [activeSeries, currentEpisodeNum]);

  // Active story slug for useStory hook
  const activeStorySlug = useMemo(() => {
    if (activeSeriesEpisode) {
      return activeSeriesEpisode.story.slug;
    }
    return currentStorySlug;
  }, [activeSeriesEpisode, currentStorySlug]);

  const {
    story: fetchedStory,
    relatedStories,
    isLoading: isStoryLoading,
    error: storyError,
  } = useStory(activeStorySlug);

  // The resolved story to display in reader
  const activeStory = useMemo(() => {
    if (activeSeriesEpisode) {
      return {
        ...activeSeriesEpisode.story,
        ...(fetchedStory || {}),
      };
    }
    return fetchedStory;
  }, [activeSeriesEpisode, fetchedStory]);

  const [siteSettings, setSiteSettings] = useState<any>(null);

  // Helper to change URL and trigger route sync
  const navigateTo = useCallback((urlPath: string, searchParams?: Record<string, string>, replace = false) => {
    let finalUrl = urlPath;
    if (searchParams) {
      const queryStr = new URLSearchParams(searchParams).toString();
      if (queryStr) {
        finalUrl += `?${queryStr}`;
      }
    }
    try {
      if (replace) {
        window.history.replaceState({}, '', finalUrl);
      } else {
        window.history.pushState({}, '', finalUrl);
      }
    } catch {
      window.location.hash = finalUrl;
    }
    window.dispatchEvent(new Event('popstate'));
  }, []);

  // Unified routing parser matching walakatha.com architecture
  const syncRoute = useCallback(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);

    // 1. Admin Gating
    const isAdmin = path.startsWith('/admin') || hash === '#admin' || hash.startsWith('#/admin');
    setIsAdminView(isAdmin);

    if (isAdmin) {
      adminAdBlocker.enableAdminShield();
      adService.setAdminMode(true);
      setIsArchivesView(false);
      setCurrentSeriesSlug(null);
      setCurrentEpisodeNum(null);
      setCurrentStorySlug(null);
      return;
    } else {
      adminAdBlocker.disableAdminShield();
      adService.setAdminMode(false);
    }

    // 2. Legacy /directory & alias redirect -> 301 to /archives
    if (
      path === '/directory' ||
      path === '/stories-directory' ||
      path === '/sitemap-index' ||
      path === '/sitemap.html' ||
      hash === '#directory' ||
      hash === '#sitemap' ||
      hash === '#/directory'
    ) {
      window.history.replaceState(null, '', '/archives');
      setIsArchivesView(true);
      setViewMode('archives');
      setCurrentSeriesSlug(null);
      setCurrentEpisodeNum(null);
      setCurrentStorySlug(null);
      return;
    }

    if (path === '/archives' || hash === '#archives') {
      setIsArchivesView(true);
      setViewMode('archives');
      setCurrentSeriesSlug(null);
      setCurrentEpisodeNum(null);
      setCurrentStorySlug(null);
      return;
    }
    setIsArchivesView(false);

    // 3. Series Hub & Episode Routing:
    // Route 3A: /posts/:story/episodes/:episode (Episode Reader)
    const episodeMatch = path.match(/^\/posts\/([^/]+)\/episodes\/(\d+)/);
    if (episodeMatch) {
      const sSlug = decodeURIComponent(episodeMatch[1]);
      const epNum = parseInt(episodeMatch[2], 10);
      setCurrentSeriesSlug(sSlug);
      setCurrentEpisodeNum(epNum);
      setCurrentStorySlug(null);
      return;
    }

    // Route 3B: /posts/:story/episodes (Series Hub)
    const seriesHubMatch = path.match(/^\/posts\/([^/]+)\/episodes\/?$/);
    if (seriesHubMatch) {
      const sSlug = decodeURIComponent(seriesHubMatch[1]);
      setCurrentSeriesSlug(sSlug);
      setCurrentEpisodeNum(null);
      setCurrentStorySlug(null);
      return;
    }

    // Route 3C: /posts/:story (Redirect to /posts/:story/episodes)
    const bareSeriesMatch = path.match(/^\/posts\/([^/]+)\/?$/);
    if (bareSeriesMatch) {
      const sSlug = decodeURIComponent(bareSeriesMatch[1]);
      window.history.replaceState(null, '', `/posts/${encodeURIComponent(sSlug)}/episodes`);
      setCurrentSeriesSlug(sSlug);
      setCurrentEpisodeNum(null);
      setCurrentStorySlug(null);
      return;
    }

    // 4. Legacy /story/:slug URL -> 301 direct redirect to /posts/:series/episodes/:episode
    const legacyStoryMatch = path.match(/^\/story\/([^/]+)/);
    if (legacyStoryMatch) {
      const rawSlug = decodeURIComponent(legacyStoryMatch[1]);
      const info = detectSeriesInfo({ slug: rawSlug, title: rawSlug });
      const targetUrl = `/posts/${info.seriesSlug}/episodes/${info.episodeNumber}`;
      window.history.replaceState(null, '', targetUrl);
      setCurrentSeriesSlug(info.seriesSlug);
      setCurrentEpisodeNum(info.episodeNumber);
      setCurrentStorySlug(rawSlug);
      return;
    }

    // Reset series & episode states if on regular views
    setCurrentSeriesSlug(null);
    setCurrentEpisodeNum(null);
    setCurrentStorySlug(null);

    // 5. Discovery Pathways: /latest and /popular
    if (path === '/latest' || hash === '#latest') {
      setViewMode('latest');
      setSortBy('latest');
      setCategory('all');
      setSearch('');
      return;
    }

    if (path === '/popular' || hash === '#popular') {
      setViewMode('popular');
      setSortBy('popular');
      setCategory('all');
      setSearch('');
      return;
    }

    // 6. Category Page Check
    let categorySlug = 'all';
    const categoryMatch = path.match(/^\/category\/([^/]+)/);
    if (categoryMatch) {
      try {
        categorySlug = decodeURIComponent(categoryMatch[1]);
      } catch {
        categorySlug = categoryMatch[1];
      }
      const canonical = normalizeCategorySlug(categorySlug);
      if (categorySlug !== canonical) {
        window.history.replaceState(null, '', `/category/${canonical}`);
      }
      categorySlug = canonical;
      setViewMode('category');
    } else {
      setViewMode('home');
    }

    // 7. Search Query Check
    const searchVal = searchParams.get('q') || '';

    // 8. Page Number Check
    let pageNum = 1;
    const pageParam = searchParams.get('page');
    if (pageParam) {
      pageNum = parseInt(pageParam, 10) || 1;
    }

    // Synchronize useStories state
    setCategory(categorySlug);
    setSearch(searchVal);
    setPage(pageNum);
  }, [setCategory, setSearch, setPage, setSortBy]);

  // Sync on mount and popstate
  useEffect(() => {
    syncRoute();
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, [syncRoute]);

  useEffect(() => {
    import('./services/adminService').then(({ adminService }) => {
      adminService.getSiteSettings().then((data) => {
        if (data) setSiteSettings(data);
      }).catch(() => {});
    });
  }, []);

  // Synchronize SEO & Open Graph Tags
  useEffect(() => {
    if (isAdminView) {
      document.title = 'Admin Portal - Walkathawa (වල් කතාව)';
      return;
    }

    if (isArchivesView) {
      SEOService.updateHead(SEOService.generateArchivesSEO(), siteSettings);
      return;
    }

    if (currentSeriesSlug && currentEpisodeNum !== null && activeStory) {
      // Episode View SEO
      SEOService.updateHead(
        SEOService.generateEpisodeSEO(activeStory, activeSeries, currentEpisodeNum),
        siteSettings
      );
      return;
    }

    if (currentSeriesSlug && currentEpisodeNum === null && activeSeries) {
      // Series Hub SEO
      SEOService.updateHead(
        SEOService.generateSeriesSEO(activeSeries),
        siteSettings
      );
      return;
    }

    if (viewMode === 'latest') {
      SEOService.updateHead(SEOService.generateLatestSEO(), siteSettings);
      return;
    }

    if (viewMode === 'popular') {
      SEOService.updateHead(SEOService.generatePopularSEO(), siteSettings);
      return;
    }

    if (params.category && params.category !== 'all') {
      const catObj = categories.find((c) => c.slug === params.category);
      const catName = catObj ? catObj.name : undefined;
      const seoPayload = SEOService.generateHomeSEO(params.category, catName, params.search);
      if (params.page && params.page > 1) {
        seoPayload.noIndex = true;
      }
      SEOService.updateHead(seoPayload, siteSettings);
      return;
    }

    // Default Homepage SEO
    const homeSEO = SEOService.generateHomeSEO(undefined, undefined, params.search);
    if (params.page && params.page > 1) {
      homeSEO.noIndex = true;
    }
    SEOService.updateHead(homeSEO, siteSettings);
  }, [
    isAdminView,
    isArchivesView,
    currentSeriesSlug,
    currentEpisodeNum,
    activeStory,
    activeSeries,
    viewMode,
    params.category,
    params.search,
    params.page,
    categories,
    siteSettings,
  ]);

  // Handlers for navigation across the site hierarchy
  const handleReadEpisode = useCallback((sSlug: string, epNum: number) => {
    setIsArchivesView(false);
    navigateTo(`/posts/${encodeURIComponent(sSlug)}/episodes/${epNum}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [navigateTo]);

  const handleSelectSeries = useCallback((sSlug: string) => {
    setIsArchivesView(false);
    navigateTo(`/posts/${encodeURIComponent(sSlug)}/episodes`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [navigateTo]);

  const handleReadStory = useCallback((slug: string, sSlug?: string, epNum?: number) => {
    setIsArchivesView(false);
    if (sSlug && epNum) {
      handleReadEpisode(sSlug, epNum);
    } else {
      const info = detectSeriesInfo({ slug, title: slug });
      handleReadEpisode(info.seriesSlug, info.episodeNumber);
    }
  }, [handleReadEpisode]);

  const handleBackToHome = useCallback(() => {
    setIsArchivesView(false);
    setCurrentSeriesSlug(null);
    setCurrentEpisodeNum(null);
    setCurrentStorySlug(null);
    navigateTo('/');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [navigateTo]);

  const handleSelectCategory = useCallback((catSlug: string) => {
    setIsArchivesView(false);
    setCurrentSeriesSlug(null);
    setCurrentEpisodeNum(null);
    setCurrentStorySlug(null);
    const targetCat = catSlug === 'all' ? 'all' : normalizeCategorySlug(catSlug);
    const targetPath = targetCat === 'all' ? '/' : `/category/${targetCat}`;
    navigateTo(targetPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigateTo]);

  const handleSearchChange = useCallback((val: string) => {
    if (val) {
      navigateTo('/search', { q: val });
    } else {
      navigateTo(params.category && params.category !== 'all' ? `/category/${params.category}` : '/');
    }
  }, [navigateTo, params.category]);

  const handlePageChange = useCallback((pageNum: number) => {
    const currentPath = window.location.pathname;
    const queryObj: Record<string, string> = { page: String(pageNum) };
    if (params.search) {
      queryObj.q = params.search;
    }
    navigateTo(currentPath, queryObj);
  }, [navigateTo, params.search]);

  if (isAdminView) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <AdminRoot />
      </Suspense>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      theme === 'dark'
        ? 'dark bg-slate-950 text-slate-100'
        : theme === 'sepia'
        ? 'bg-[#fbf7ee] text-[#423326]'
        : 'bg-slate-50 text-slate-900'
    }`}>
      <Header
        onHomeClick={handleBackToHome}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />

      <main className="flex-grow">
        {isArchivesView ? (
          <SitemapPage
            stories={stories}
            categories={categories}
            onSelectStory={handleReadStory}
            onNavigateHome={handleBackToHome}
            onSelectCategory={handleSelectCategory}
            onSelectSeries={handleSelectSeries}
          />
        ) : currentSeriesSlug && currentEpisodeNum === null && activeSeries ? (
          /* Series Hub View: /posts/:story/episodes */
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <SeriesHub
              series={activeSeries}
              relatedStories={stories.filter((s) => s.category === activeSeries.category).slice(0, 4)}
              theme={theme}
              onReadEpisode={handleReadEpisode}
              onSelectCategory={handleSelectCategory}
              onNavigateHome={handleBackToHome}
            />
          </Suspense>
        ) : currentSeriesSlug && currentEpisodeNum !== null ? (
          /* Episode Reader View: /posts/:story/episodes/:episode */
          activeStory ? (
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-[50vh]">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              <StoryReader
                story={activeStory}
                series={activeSeries}
                episodeNumber={currentEpisodeNum}
                prevEpisode={prevEpisode}
                nextEpisode={nextEpisode}
                relatedStories={relatedStories}
                onBack={handleBackToHome}
                onSelectStory={handleReadStory}
                onSelectEpisode={handleReadEpisode}
                onNavigateSeries={handleSelectSeries}
                theme={theme}
                onThemeChange={setTheme}
                fontSize={fontSize}
                onFontSizeChange={setFontSize}
                fontFamily={fontFamily}
                onFontFamilyChange={setFontFamily}
              />
            </Suspense>
          ) : isStoryLoading ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="text-center py-20 px-4">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                {storyError || 'Episode not found'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                මෙම කතාංගය සොයාගත නොහැකි විය. කරුණාකර කතා මාලාවේ අනෙකුත් කොටස් පරීක්ෂා කරන්න.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                {activeSeries && (
                  <button
                    type="button"
                    onClick={() => handleSelectSeries(activeSeries.slug)}
                    className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors text-xs"
                  >
                    කතා මාලාවට යන්න (Series Hub)
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleBackToHome}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
                >
                  Return to Home
                </button>
              </div>
            </div>
          )
        ) : (
          /* Homepage, Category, Latest, or Popular Gallery View */
          <StoryGallery
            stories={stories}
            allStories={stories}
            categories={categories}
            featuredStories={featuredStories}
            selectedCategory={params.category || 'all'}
            onSelectCategory={handleSelectCategory}
            searchTerm={params.search || ''}
            onSearchChange={handleSearchChange}
            sortBy={params.sortBy || 'latest'}
            onSortChange={setSortBy}
            currentPage={page}
            totalPages={totalPages}
            total={total}
            onPageChange={handlePageChange}
            onReadStory={handleReadStory}
            onSelectSeries={handleSelectSeries}
            isLoading={isStoriesLoading}
            viewMode={viewMode}
          />
        )}
      </main>

      <FooterAdBanner />

      <Footer
        categories={categories}
        onSelectCategory={handleSelectCategory}
        onOpenSitemap={() => {
          setIsArchivesView(true);
          navigateTo('/archives');
          window.scrollTo({ top: 0, behavior: 'instant' });
        }}
        onSearchKeyword={(kw) => {
          setIsArchivesView(false);
          handleSelectCategory('all');
          handleSearchChange(kw);
          if (currentSeriesSlug || currentEpisodeNum) {
            handleBackToHome();
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
