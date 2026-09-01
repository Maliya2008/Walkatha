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
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    return path.startsWith('/admin') || hash === '#admin' || hash.startsWith('#/admin');
  });

  const [currentSlug, setCurrentSlug] = useState<string | null>(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/story\/([a-zA-Z0-9-_]+)/);
    if (match) return match[1];
    const hash = window.location.hash;
    const hashMatch = hash.match(/^#\/story\/([a-zA-Z0-9-_]+)/);
    if (hashMatch) return hashMatch[1];
    return null;
  });

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

  const {
    story: activeStory,
    relatedStories,
    isLoading: isStoryLoading,
    error: storyError,
  } = useStory(currentSlug);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.startsWith('/admin') || hash === '#admin' || hash.startsWith('#/admin')) {
        setIsAdminView(true);
        setCurrentSlug(null);
        return;
      }
      setIsAdminView(false);
      const match = path.match(/^\/story\/([a-zA-Z0-9-_]+)/);
      if (match) {
        setCurrentSlug(match[1]);
      } else {
        const hashMatch = hash.match(/^#\/story\/([a-zA-Z0-9-_]+)/);
        if (hashMatch) {
          setCurrentSlug(hashMatch[1]);
        } else {
          setCurrentSlug(null);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [siteSettings, setSiteSettings] = useState<any>(null);

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
    setIsAdminView(false);

    const targetStory = stories.find(s => s.slug === slug);
    adService.triggerDirectAd(targetStory?.directAdLink);

    try {
      window.history.pushState({ slug }, '', `/story/${slug}`);
    } catch {
      window.location.hash = `/story/${slug}`;
    }
    setCurrentSlug(slug);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [stories]);

  const handleBackToGallery = useCallback(() => {
    setIsAdminView(false);
    try {
      window.history.pushState({}, '', '/');
    } catch {
      window.location.hash = '/';
    }
    setCurrentSlug(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleSelectCategory = useCallback((catSlug: string) => {
    setIsAdminView(false);
    try {
      window.history.pushState({}, '', '/');
    } catch {
      window.location.hash = '/';
    }
    setCurrentSlug(null);
    setCategory(catSlug);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setCategory]);

  if (isAdminView) {
    return <AdminRoot />;
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${theme === 'dark' ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      <Header
        categories={categories}
        selectedCategory={params.category || 'all'}
        onSelectCategory={handleSelectCategory}
        onHomeClick={handleBackToGallery}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />

      <main className="flex-grow pt-16">
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
            onSelectCategory={setCategory}
            searchTerm={params.search || ''}
            onSearchChange={setSearch}
            sortBy={params.sortBy || 'latest'}
            onSortChange={setSortBy}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
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
