import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { useStories } from './hooks/useStories';
import { useStory } from './hooks/useStory';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { StoryGallery } from './components/stories/StoryGallery';
import { SitemapPage } from './components/sitemap/SitemapPage';
import { normalizeCategorySlug, getCategoryDisplayName } from './utils/categoryTaxonomy';

const StoryReader = lazy(() =>
  import('./components/stories/StoryReader').then((m) => ({ default: m.StoryReader }))
);
const AdminRoot = lazy(() =>
  import('./components/admin/AdminRoot').then((m) => ({ default: m.AdminRoot }))
);

export default function App() {
  const { theme, setTheme, fontSize, setFontSize } = useTheme();

  const {
    stories,
    total,
    page,
    totalPages,
    limit,
    categories,
    isLoading: isStoriesLoading,
    params,
    setCategory,
    setSearch,
    setPage,
    setSortBy,
  } = useStories({ limit: 20 }); // 20 posts per view

  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [isSitemapView, setIsSitemapView] = useState<boolean>(false);
  const [currentStorySlug, setCurrentStorySlug] = useState<string | null>(null);

  // Active story hook
  const { story: activeStory, relatedStories, isLoading: isStoryLoading } = useStory(currentStorySlug);

  // Helper for router navigation
  const navigateTo = useCallback((urlPath: string, replace = false) => {
    try {
      if (replace) {
        window.history.replaceState({}, '', urlPath);
      } else {
        window.history.pushState({}, '', urlPath);
      }
    } catch {
      window.location.hash = urlPath;
    }
    window.dispatchEvent(new Event('popstate'));
  }, []);

  // Synchronize route from window.location
  const syncRoute = useCallback(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;

    // 1. Admin route
    if (path.startsWith('/admin') || hash === '#admin' || hash.startsWith('#/admin')) {
      setIsAdminView(true);
      setIsSitemapView(false);
      setCurrentStorySlug(null);
      return;
    }
    setIsAdminView(false);

    // 2. Sitemap / Archives
    if (path === '/sitemap' || path === '/archives' || hash === '#sitemap') {
      setIsSitemapView(true);
      setCurrentStorySlug(null);
      return;
    }
    setIsSitemapView(false);

    // 3. Single Story: /story/:slug or /posts/:slug or legacy /katha/:slug
    const storyMatch = path.match(/^\/(?:story|posts|katha)\/([^/]+)/);
    if (storyMatch && storyMatch[1]) {
      const slug = decodeURIComponent(storyMatch[1]);
      setCurrentStorySlug(slug);
      return;
    }

    // 4. Category: /category/:slug
    const catMatch = path.match(/^\/category\/([^/]+)/);
    if (catMatch && catMatch[1]) {
      const rawSlug = decodeURIComponent(catMatch[1]);
      const norm = normalizeCategorySlug(rawSlug);
      setCategory(norm);
      setCurrentStorySlug(null);
      return;
    }

    // 5. Popular / Latest
    if (path === '/popular') {
      setSortBy('popular');
      setCurrentStorySlug(null);
      return;
    }
    if (path === '/latest') {
      setSortBy('latest');
      setCurrentStorySlug(null);
      return;
    }

    // 6. Root Homepage
    setCurrentStorySlug(null);
  }, [setCategory, setSortBy]);

  useEffect(() => {
    syncRoute();
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, [syncRoute]);

  // Update dynamic document title & canonical meta tags
  useEffect(() => {
    if (isAdminView) {
      document.title = 'Admin Panel | Walkathawa (වල් කතාව)';
      return;
    }

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

    if (currentStorySlug && activeStory) {
      document.title = `${activeStory.title} | Walkathawa (වල් කතාව)`;
      if (canonical) {
        canonical.href = `https://www.walkathawa.site/story/${encodeURIComponent(activeStory.slug)}`;
      }
      return;
    }

    if (isSitemapView) {
      document.title = 'Sitemap & Archives (සියලු කතා සූචිය) | Walkathawa (වල් කතාව)';
      if (canonical) {
        canonical.href = 'https://www.walkathawa.site/sitemap';
      }
      return;
    }

    if (params.category && params.category !== 'all') {
      const catName = getCategoryDisplayName(params.category);
      document.title = `${catName} | Walkathawa (වල් කතාව)`;
      if (canonical) {
        canonical.href = `https://www.walkathawa.site/category/${encodeURIComponent(params.category)}`;
      }
      return;
    }

    document.title = 'Walkathawa (වල් කතාව) | Sinhala Stories Online';
    if (canonical) {
      canonical.href = 'https://www.walkathawa.site/';
    }
  }, [isAdminView, currentStorySlug, activeStory, isSitemapView, params.category]);

  // Compute previous and next stories in current active list
  const { prevStory, nextStory } = useMemo(() => {
    if (!currentStorySlug || stories.length === 0) {
      return { prevStory: null, nextStory: null };
    }
    const idx = stories.findIndex(
      (s) => s.slug === currentStorySlug || s.id === currentStorySlug
    );
    if (idx === -1) {
      return { prevStory: null, nextStory: null };
    }
    return {
      prevStory: idx > 0 ? stories[idx - 1] : null,
      nextStory: idx < stories.length - 1 ? stories[idx + 1] : null,
    };
  }, [currentStorySlug, stories]);

  // Navigation callbacks
  const handleHomeClick = useCallback(() => {
    setCategory('all');
    setSearch('');
    setPage(1);
    setCurrentStorySlug(null);
    setIsSitemapView(false);
    setIsAdminView(false);
    navigateTo('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setCategory, setSearch, setPage, navigateTo]);

  const handleSelectCategory = useCallback(
    (catSlug: string) => {
      setCategory(catSlug);
      setPage(1);
      setCurrentStorySlug(null);
      setIsSitemapView(false);
      setIsAdminView(false);
      if (catSlug === 'all') {
        navigateTo('/');
      } else {
        navigateTo(`/category/${encodeURIComponent(catSlug)}`);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setCategory, setPage, navigateTo]
  );

  const handleReadStory = useCallback(
    (slug: string) => {
      setCurrentStorySlug(slug);
      setIsSitemapView(false);
      setIsAdminView(false);
      navigateTo(`/story/${encodeURIComponent(slug)}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [navigateTo]
  );

  const handleToggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('reader_theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {}
  }, [theme, setTheme]);

  // Render Admin Workspace
  if (isAdminView) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
            පූරණය වෙමින් පවතී...
          </div>
        }
      >
        <AdminRoot
          onBackToPublic={handleHomeClick}
          onViewStoryPublic={handleReadStory}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Header */}
      <Header
        onHomeClick={handleHomeClick}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentStorySlug ? (
          /* Reader View */
          <Suspense
            fallback={
              <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-pulse space-y-4">
                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3 mx-auto" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3 mx-auto" />
                <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              </div>
            }
          >
            {activeStory ? (
              <StoryReader
                story={activeStory}
                relatedStories={relatedStories}
                prevStory={prevStory}
                nextStory={nextStory}
                onBack={handleHomeClick}
                onSelectStory={handleReadStory}
                theme={theme}
                onThemeChange={setTheme}
                fontSize={fontSize}
                onFontSizeChange={setFontSize}
              />
            ) : isStoryLoading ? (
              <div className="py-24 text-center text-slate-400 text-sm">
                කතාව පූරණය වෙමින් පවතී...
              </div>
            ) : (
              <div className="py-24 text-center space-y-4">
                <h2 className="text-xl font-bold">සොයන ලද කතාව හමු නොවීය</h2>
                <button
                  type="button"
                  onClick={handleHomeClick}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold cursor-pointer"
                >
                  මුල් පිටුවට යන්න
                </button>
              </div>
            )}
          </Suspense>
        ) : isSitemapView ? (
          /* Sitemap & Archives View */
          <SitemapPage
            stories={stories}
            categories={categories}
            onSelectStory={handleReadStory}
            onNavigateHome={handleHomeClick}
            onSelectCategory={handleSelectCategory}
          />
        ) : (
          /* Gallery View - At least 20 posts per view */
          <StoryGallery
            stories={stories}
            categories={categories}
            selectedCategory={params.category || 'all'}
            onSelectCategory={handleSelectCategory}
            searchTerm={params.search || ''}
            onSearchChange={setSearch}
            sortBy={params.sortBy || 'latest'}
            onSortChange={setSortBy}
            currentPage={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onReadStory={handleReadStory}
            isLoading={isStoriesLoading}
          />
        )}
      </main>

      {/* Minimal, Simplified Footer */}
      <Footer
        categories={categories}
        onSelectCategory={handleSelectCategory}
        onOpenSitemap={() => {
          setIsSitemapView(true);
          setCurrentStorySlug(null);
          navigateTo('/sitemap');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
