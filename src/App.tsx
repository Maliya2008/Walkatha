import React, { useState, useEffect, useCallback } from 'react';
import { useStories } from './hooks/useStories';
import { useStory } from './hooks/useStory';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { StoryGallery } from './components/stories/StoryGallery';
import { StoryReader } from './components/stories/StoryReader';
import { AdminRoot } from './components/admin/AdminRoot';
import { SEOService } from './services/seoService';
import { adService } from './services/adService';

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
    refreshStories,
  } = useStories();

  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);

  const {
    story: activeStory,
    relatedStories,
    isLoading: isStoryLoading,
    error: storyError,
  } = useStory(currentSlug);

  const [siteSettings, setSiteSettings] = useState<any>(null);

  // Helper to change URL and trigger route sync
  const navigateTo = useCallback((urlPath: string, searchParams?: Record<string, string>) => {
    let finalUrl = urlPath;
    if (searchParams) {
      const queryStr = new URLSearchParams(searchParams).toString();
      if (queryStr) {
        finalUrl += `?${queryStr}`;
      }
    }
    try {
      window.history.pushState({}, '', finalUrl);
    } catch {
      window.location.hash = finalUrl;
    }
    // Dispatch popstate to notify our route listener
    window.dispatchEvent(new Event('popstate'));
  }, []);

  // Unified routing parser
  const syncRoute = useCallback(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);

    // 1. Admin Gating
    const isAdmin = path.startsWith('/admin') || hash === '#admin' || hash.startsWith('#/admin');
    setIsAdminView(isAdmin);

    if (isAdmin) {
      setCurrentSlug(null);
      return;
    }

    // 2. Story Reader Check
    let storySlug: string | null = null;
    const storyMatch = path.match(/^\/story\/([^/]+)/);
    if (storyMatch) {
      try {
        storySlug = decodeURIComponent(storyMatch[1]);
      } catch {
        storySlug = storyMatch[1];
      }
    } else {
      const hashStoryMatch = hash.match(/^#\/story\/([^/]+)/);
      if (hashStoryMatch) {
        try {
          storySlug = decodeURIComponent(hashStoryMatch[1]);
        } catch {
          storySlug = hashStoryMatch[1];
        }
      }
    }
    setCurrentSlug(storySlug);

    // 3. Category Page Check
    let categorySlug = 'all';
    const categoryMatch = path.match(/^\/category\/([^/]+)/);
    if (categoryMatch) {
      try {
        categorySlug = decodeURIComponent(categoryMatch[1]);
      } catch {
        categorySlug = categoryMatch[1];
      }
    } else {
      const hashCategoryMatch = hash.match(/^#\/category\/([^/]+)/);
      if (hashCategoryMatch) {
        try {
          categorySlug = decodeURIComponent(hashCategoryMatch[1]);
        } catch {
          categorySlug = hashCategoryMatch[1];
        }
      }
    }

    // 4. Search Query Check
    let searchVal = '';
    const isSearchRoute = path.startsWith('/search') || hash.startsWith('#/search') || hash === '#search';
    if (isSearchRoute) {
      searchVal = searchParams.get('q') || '';
    } else {
      searchVal = searchParams.get('q') || '';
    }

    // 5. Page Number Check
    let pageNum = 1;
    const pageParam = searchParams.get('page');
    if (pageParam) {
      pageNum = parseInt(pageParam, 10) || 1;
    }

    // Synchronize useStories parameters to prevent double fetches
    if (params.category !== categorySlug) {
      setCategory(categorySlug);
    }
    if ((params.search || '') !== searchVal) {
      setSearch(searchVal);
    }
    if (page !== pageNum) {
      setPage(pageNum);
    }
  }, [params.category, params.search, page, setCategory, setSearch, setPage]);

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

  useEffect(() => {
    if (isAdminView) {
      document.title = 'Admin Portal - Walkathawa (වල් කතාව)';
      return;
    }
    if (currentSlug && activeStory) {
      SEOService.updateHead(SEOService.generateStorySEO(activeStory), siteSettings);
    } else if (!currentSlug) {
      const catObj = categories.find((c) => c.slug === params.category);
      const catName = catObj ? catObj.name : undefined;
      SEOService.updateHead(SEOService.generateHomeSEO(catName, params.search), siteSettings);
    }
  }, [isAdminView, currentSlug, activeStory, params.category, params.search, categories, siteSettings]);

  const handleReadStory = useCallback((slug: string) => {
    adService.triggerStoryAd(slug);
    navigateTo(`/story/${slug}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [navigateTo]);

  const handleBackToGallery = useCallback(() => {
    navigateTo('/');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [navigateTo]);

  const handleSelectCategory = useCallback((catSlug: string) => {
    const targetPath = catSlug === 'all' ? '/' : `/category/${catSlug}`;
    navigateTo(targetPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigateTo]);

  if (isAdminView) {
    return <AdminRoot />;
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
        onHomeClick={handleBackToGallery}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />

      <main className="flex-grow">
        {currentSlug ? (
          activeStory ? (
            <StoryReader
              story={activeStory}
              relatedStories={relatedStories}
              onBack={handleBackToGallery}
              onSelectStory={handleReadStory}
              theme={theme}
              onThemeChange={setTheme}
              fontSize={fontSize}
              onFontSizeChange={setFontSize}
              fontFamily={fontFamily}
              onFontFamilyChange={setFontFamily}
            />
          ) : isStoryLoading ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="text-center py-20 px-4">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                {storyError || 'Story not found'}
              </h2>
              <button
                type="button"
                onClick={handleBackToGallery}
                className="mt-6 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Return to Home
              </button>
            </div>
          )
        ) : (
          <StoryGallery
            stories={stories}
            categories={categories}
            featuredStories={featuredStories}
            selectedCategory={params.category || 'all'}
            onSelectCategory={handleSelectCategory}
            searchTerm={params.search || ''}
            onSearchChange={(val) => {
              if (val) {
                navigateTo('/search', { q: val });
              } else {
                navigateTo(params.category && params.category !== 'all' ? `/category/${params.category}` : '/');
              }
            }}
            sortBy={params.sortBy || 'latest'}
            onSortChange={setSortBy}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(pageNum) => {
              const currentPath = window.location.pathname;
              const queryObj: Record<string, string> = { page: String(pageNum) };
              if (params.search) {
                queryObj.q = params.search;
              }
              navigateTo(currentPath, queryObj);
            }}
            onReadStory={handleReadStory}
            isLoading={isStoriesLoading}
          />
        )}
      </main>

      <Footer
        categories={categories}
        onSelectCategory={handleSelectCategory}
      />
    </div>
  );
}
