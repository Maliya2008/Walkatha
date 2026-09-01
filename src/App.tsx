/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useStories } from './hooks/useStories';
import { useStory } from './hooks/useStory';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { StoryGallery } from './components/stories/StoryGallery';
import { StoryReader } from './components/stories/StoryReader';
import { SitemapModal } from './components/common/SitemapModal';
import { PrivacyTermsModal } from './components/common/PrivacyTermsModal';
import { InterstitialAdModal } from './components/ads/InterstitialAdTrigger';
import { AdminRoot } from './components/admin/AdminRoot';
import { SEOService } from './services/seoService';

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

  const [isSitemapOpen, setIsSitemapOpen] = useState(false);
  const [complianceType, setComplianceType] = useState<'privacy' | 'terms' | 'ads' | null>(null);
  const [isInterstitialOpen, setIsInterstitialOpen] = useState(false);

  // Theme & Reading preferences
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
  } = useTheme();

  // Stories list data hook
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

  // Active single story hook
  const {
    story: activeStory,
    relatedStories,
    isLoading: isStoryLoading,
    error: storyError,
  } = useStory(currentSlug);

  // Sync browser History navigation (popstate back/forward)
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

  // Fetch live site settings for SEO & Meta
  useEffect(() => {
    import('./services/adminService').then(({ adminService }) => {
      adminService.getSiteSettings().then((data) => {
        if (data) setSiteSettings(data);
      }).catch(() => {});
    });
  }, []);

  // Update dynamic SEO metadata and Schema.org on route changes
  useEffect(() => {
    if (isAdminView) {
      document.title = 'Admin Portal - Walkathawa (වල් කතාව)';
      return;
    }

    if (currentSlug && activeStory) {
      // Dynamic Story-specific SEO with Article Schema & Breadcrumbs
      SEOService.updateHead(SEOService.generateStorySEO(activeStory), siteSettings);
    } else if (!currentSlug) {
      // Dynamic Catalog / Category / Search SEO
      const catObj = categories.find((c) => c.slug === params.category);
      const catName = catObj ? catObj.name : undefined;
      SEOService.updateHead(SEOService.generateHomeSEO(catName, params.search), siteSettings);
    }
  }, [isAdminView, currentSlug, activeStory, params.category, params.search, categories, siteSettings]);

  const handleReadStory = useCallback((slug: string) => {
    setIsAdminView(false);
    try {
      window.history.pushState({ slug }, '', `/story/${slug}`);
    } catch {
      window.location.hash = `/story/${slug}`;
    }
    setCurrentSlug(slug);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleBackToGallery = useCallback(() => {
    setIsAdminView(false);
    try {
      window.history.pushState({}, '', '/');
    } catch {
      window.location.hash = '';
    }
    setCurrentSlug(null);
    refreshStories();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [refreshStories]);

  const handleOpenAdmin = useCallback(() => {
    setIsAdminView(true);
    setCurrentSlug(null);
    try {
      window.history.pushState({ admin: true }, '', '/admin');
    } catch {
      window.location.hash = '#admin';
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleSelectCategory = (catSlug: string) => {
    setCategory(catSlug);
    if (currentSlug || isAdminView) {
      handleBackToGallery();
    }
  };

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // If Admin View is active, render the full admin experience
  if (isAdminView) {
    return (
      <AdminRoot
        onBackToPublic={handleBackToGallery}
        onViewStoryPublic={(slug) => {
          handleReadStory(slug);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors duration-150">
      {/* Global Header */}
      <Header
        categories={categories}
        selectedCategory={params.category || 'all'}
        onSelectCategory={handleSelectCategory}
        onHomeClick={handleBackToGallery}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenSitemap={() => setIsSitemapOpen(true)}
        onOpenCompliance={(type) => setComplianceType(type)}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* Main Content Router View */}
      <main className="flex-1">
        {currentSlug ? (
          /* Dedicated Story Reading View */
          isStoryLoading ? (
            <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-pulse">
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4 mx-auto mb-4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mx-auto mb-8" />
              <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-2xl w-full mb-8" />
              <div className="space-y-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
              </div>
            </div>
          ) : activeStory ? (
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
          ) : (
            <div className="max-w-md mx-auto my-20 p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Story Not Found
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                The story you are looking for might have been moved or removed.
              </p>
              <button
                type="button"
                onClick={handleBackToGallery}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
              >
                Return to Gallery
              </button>
            </div>
          )
        ) : (
          /* Home Story Gallery View */
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

      {/* Global Footer */}
      <Footer
        categories={categories}
        onSelectCategory={handleSelectCategory}
        onOpenSitemap={() => setIsSitemapOpen(true)}
        onOpenCompliance={(type) => setComplianceType(type)}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* SEO Sitemap & Index Modal */}
      <SitemapModal
        isOpen={isSitemapOpen}
        onClose={() => setIsSitemapOpen(false)}
        stories={stories}
        onSelectStory={handleReadStory}
      />

      {/* Legal & Monetag Compliance Modal */}
      <PrivacyTermsModal
        isOpen={complianceType !== null}
        onClose={() => setComplianceType(null)}
        type={complianceType || 'privacy'}
      />

      {/* Monetag Vignette / Interstitial Ad Simulation */}
      <InterstitialAdModal
        isOpen={isInterstitialOpen}
        onClose={() => setIsInterstitialOpen(false)}
      />
    </div>
  );
}
