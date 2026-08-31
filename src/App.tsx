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
import { SEOService } from './services/seoService';

export default function App() {
  const [currentSlug, setCurrentSlug] = useState<string | null>(() => {
    // Check initial path (e.g. /story/the-lost-kingdom or #/story/the-lost-kingdom)
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
      const match = path.match(/^\/story\/([a-zA-Z0-9-_]+)/);
      if (match) {
        setCurrentSlug(match[1]);
      } else {
        const hashMatch = window.location.hash.match(/^#\/story\/([a-zA-Z0-9-_]+)/);
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

  // Update default SEO tags when on Home / Gallery
  useEffect(() => {
    if (!currentSlug) {
      SEOService.updateHead({
        title: params.category && params.category !== 'all'
          ? `${params.category.toUpperCase()} Short Stories - Read Free Online`
          : 'Short Stories - Read Modern Short Stories Online',
        description:
          'A modern, lightweight, responsive short story platform designed for seamless reading and monetization readiness.',
        ogType: 'website',
        canonicalUrl: window.location.origin,
      });
    }
  }, [currentSlug, params.category]);

  const handleReadStory = useCallback((slug: string) => {
    // Clean URL pushState
    try {
      window.history.pushState({ slug }, '', `/story/${slug}`);
    } catch {
      window.location.hash = `/story/${slug}`;
    }
    setCurrentSlug(slug);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleBackToGallery = useCallback(() => {
    try {
      window.history.pushState({}, '', '/');
    } catch {
      window.location.hash = '';
    }
    setCurrentSlug(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleSelectCategory = (catSlug: string) => {
    setCategory(catSlug);
    if (currentSlug) {
      handleBackToGallery();
    }
  };

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

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
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold"
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
