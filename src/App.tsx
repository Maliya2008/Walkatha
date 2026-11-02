import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { StoryGallery } from './components/stories/StoryGallery';
import { StoryReader } from './components/stories/StoryReader';
import { CategoriesPage } from './components/categories/CategoriesPage';
import { AdminRoot } from './components/admin/AdminRoot';
import { SitemapModal } from './components/common/SitemapModal';
import { DesktopSideSkyscrapers } from './components/common/DesktopSideSkyscrapers';
import { NotFoundPage } from './components/common/NotFoundPage';
import { StaticPage } from './components/common/StaticPage';
import { StoryService } from './services/storyService';
import { SEOService } from './services/seoService';
import { Category, FontSize, ReadingTheme, Story } from './types/story';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [relatedStories, setRelatedStories] = useState<Story[]>([]);
  const [prevStory, setPrevStory] = useState<Story | null>(null);
  const [nextStory, setNextStory] = useState<Story | null>(null);

  // Gallery Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'oldest'>('latest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalStoriesCount, setTotalStoriesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Page States
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [staticPageType, setStaticPageType] = useState<'privacy' | 'terms' | 'dmca' | 'about' | 'contact' | 'disclaimer' | null>(null);

  // Modals & UI States
  const [isSitemapOpen, setIsSitemapOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<ReadingTheme>('dark');
  const [fontSize, setFontSize] = useState<FontSize>('md');

  // Handle URL Location Routing
  const navigateTo = useCallback((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Popstate Listener (Browser Back / Forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Theme Class Toggle on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Load Categories on Initial Boot
  useEffect(() => {
    StoryService.getCategories().then((cats) => {
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    });
  }, []);

  // Parse Path & Load Relevant Content
  useEffect(() => {
    let isCancelled = false;

    const routeApp = async () => {
      setIsLoading(true);
      setIsNotFound(false);
      setStaticPageType(null);

      const path = currentPath;

      // 1. Admin Route
      if (path.startsWith('/admin')) {
        SEOService.updateHead({ title: 'Admin Control Center', noIndex: true });
        setIsLoading(false);
        return;
      }

      // 2. Categories Route
      if (path === '/categories') {
        SEOService.updateHead({
          title: 'කතා වර්ගීකරණ (Categories)',
          description: 'Explore all category grids on Walkathawa (වල් කතාව).',
          canonicalUrl: `${window.location.origin}/categories`,
        });
        setIsLoading(false);
        return;
      }

      // 3. Static Informational Pages
      if (path === '/privacy') {
        setStaticPageType('privacy');
        SEOService.updateHead({ title: 'Privacy Policy | Walkathawa', description: 'Privacy Policy & Cookie Policy' });
        setIsLoading(false);
        return;
      }
      if (path === '/terms') {
        setStaticPageType('terms');
        SEOService.updateHead({ title: 'Terms and Conditions | Walkathawa', description: 'Terms of Service' });
        setIsLoading(false);
        return;
      }
      if (path === '/dmca') {
        setStaticPageType('dmca');
        SEOService.updateHead({ title: 'DMCA Copyright Notice | Walkathawa', description: 'DMCA Takedown and Copyright Notices' });
        setIsLoading(false);
        return;
      }
      if (path === '/about') {
        setStaticPageType('about');
        SEOService.updateHead({ title: 'About Us | Walkathawa', description: 'About Walkathawa Sinhala Stories' });
        setIsLoading(false);
        return;
      }
      if (path === '/contact') {
        setStaticPageType('contact');
        SEOService.updateHead({ title: 'Contact Us | Walkathawa', description: 'Contact Walkathawa Editorial Desk' });
        setIsLoading(false);
        return;
      }
      if (path === '/disclaimer') {
        setStaticPageType('disclaimer');
        SEOService.updateHead({ title: 'Disclaimer | Walkathawa', description: 'Disclaimer & Advertising Policy' });
        setIsLoading(false);
        return;
      }

      // 4. Sitemap / Archives Route
      if (path === '/sitemap' || path === '/archives') {
        setIsSitemapOpen(true);
        SEOService.updateHead(SEOService.generateArchivesSEO());
      }

      // 5. Single Story View: /story/:slug or /posts/:slug
      if (path.startsWith('/story/') || path.startsWith('/posts/')) {
        const prefix = path.startsWith('/story/') ? '/story/' : '/posts/';
        const rawSlug = path.replace(prefix, '').split('?')[0];
        const slug = decodeURIComponent(rawSlug);

        if (slug) {
          const storyData = await StoryService.getStoryBySlug(slug);
          if (!isCancelled) {
            if (storyData) {
              setActiveStory(storyData);
              SEOService.updateHead(SEOService.generateStorySEO(storyData));

              // Load related, prev & next stories
              const related = await StoryService.getRelatedStories(storyData, 4);
              const allLive = await StoryService.fetchAllLiveStories();
              const currIdx = allLive.findIndex((s) => s.id === storyData.id || s.slug === storyData.slug);

              setRelatedStories(related);
              setPrevStory(currIdx > 0 ? allLive[currIdx - 1] : null);
              setNextStory(currIdx >= 0 && currIdx < allLive.length - 1 ? allLive[currIdx + 1] : null);
              setIsLoading(false);
              return;
            } else {
              // Story not found in database
              setActiveStory(null);
              setIsNotFound(true);
              SEOService.updateHead({ title: '404 - කතාව හමු නොවීය | Walkathawa', noIndex: true });
              setIsLoading(false);
              return;
            }
          }
        }
      }

      // 6. Category Route: /category/:categorySlug
      let categorySlug = 'all';
      if (path.startsWith('/category/')) {
        categorySlug = decodeURIComponent(path.replace('/category/', '').split('?')[0]);
      } else if (path !== '/' && path !== '/posts' && path !== '/latest' && path !== '/popular' && path !== '/sitemap' && path !== '/archives') {
        // Unknown route -> 404
        setIsNotFound(true);
        SEOService.updateHead({ title: '404 - පිටුව හමු නොවීය | Walkathawa', noIndex: true });
        setIsLoading(false);
        return;
      }

      // Extract query parameters (?page=2)
      const urlParams = new URLSearchParams(window.location.search);
      const pageNum = parseInt(urlParams.get('page') || '1', 10);

      setSelectedCategory(categorySlug);
      setCurrentPage(pageNum);
      setActiveStory(null);

      // Fetch Paged Stories
      const pagedResult = await StoryService.getStories({
        category: categorySlug,
        search: searchTerm,
        sortBy: sortBy,
        page: pageNum,
        limit: 20,
      });

      if (!isCancelled) {
        setStories(pagedResult.data);
        setTotalPages(pagedResult.totalPages);
        setTotalStoriesCount(pagedResult.total);
        setIsLoading(false);

        // Update SEO
        SEOService.updateHead(SEOService.generateHomeSEO(categorySlug, undefined, searchTerm));
      }
    };

    routeApp();

    return () => {
      isCancelled = true;
    };
  }, [currentPath, searchTerm, sortBy]);

  // Handlers for Navigation Actions
  const handleSelectStory = (slug: string) => {
    navigateTo(`/story/${encodeURIComponent(slug)}`);
  };

  const handleSelectCategory = (catSlug: string) => {
    setSelectedCategory(catSlug);
    setSearchTerm('');
    setCurrentPage(1);
    if (catSlug === 'all') {
      navigateTo('/');
    } else {
      navigateTo(`/category/${encodeURIComponent(catSlug)}`);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const basePath = selectedCategory === 'all' ? '' : `/category/${encodeURIComponent(selectedCategory)}`;
    const pageQuery = page > 1 ? `?page=${page}` : '';
    navigateTo(`${basePath || '/'}${pageQuery}`);
  };

  // Render Admin View
  if (currentPath.startsWith('/admin')) {
    return (
      <AdminRoot
        onBackToPublic={() => navigateTo('/')}
        onViewStoryPublic={(slug) => navigateTo(`/story/${encodeURIComponent(slug)}`)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-rose-600 selection:text-white">
      {/* Edge Skyscrapers for HD Desktop Screens */}
      <DesktopSideSkyscrapers />

      {/* Main App Header */}
      <Header
        onHomeClick={() => {
          setSelectedCategory('all');
          setSearchTerm('');
          setActiveStory(null);
          setIsNotFound(false);
          setStaticPageType(null);
          navigateTo('/');
        }}
        onOpenCategories={() => navigateTo('/categories')}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onOpenSitemap={() => setIsSitemapOpen(true)}
        onToggleSearch={() => setIsSearchOpen((s) => !s)}
        isSearchOpen={isSearchOpen}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {isNotFound ? (
          /* 1. 404 Page Not Found */
          <NotFoundPage
            onNavigateHome={() => {
              setIsNotFound(false);
              navigateTo('/');
            }}
            onSelectCategory={handleSelectCategory}
            onSearch={(term) => {
              setSearchTerm(term);
              setIsNotFound(false);
            }}
            categories={categories}
          />
        ) : staticPageType ? (
          /* 2. Static Informational Page */
          <StaticPage
            pageType={staticPageType}
            onNavigateHome={() => {
              setStaticPageType(null);
              navigateTo('/');
            }}
          />
        ) : activeStory ? (
          /* 3. Story Reader View */
          <StoryReader
            story={activeStory}
            relatedStories={relatedStories}
            prevStory={prevStory}
            nextStory={nextStory}
            onBack={() => {
              setActiveStory(null);
              if (selectedCategory && selectedCategory !== 'all') {
                navigateTo(`/category/${encodeURIComponent(selectedCategory)}`);
              } else {
                navigateTo('/');
              }
            }}
            onSelectStory={handleSelectStory}
            onSelectCategory={handleSelectCategory}
            theme={theme}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
          />
        ) : currentPath === '/categories' ? (
          /* 4. Categories Grid Page */
          <CategoriesPage
            categories={categories}
            onSelectCategory={handleSelectCategory}
            onNavigateHome={() => navigateTo('/')}
          />
        ) : (
          /* 5. Story Feed / Gallery View */
          <StoryGallery
            stories={stories}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            onSortChange={setSortBy}
            currentPage={currentPage}
            totalPages={totalPages}
            total={totalStoriesCount}
            limit={20}
            onPageChange={handlePageChange}
            onReadStory={handleSelectStory}
            isLoading={isLoading}
            isSearchOpen={isSearchOpen}
            onCloseSearch={() => setIsSearchOpen(false)}
          />
        )}
      </main>

      {/* Sitemap / Archive Index Modal */}
      <SitemapModal
        isOpen={isSitemapOpen}
        onClose={() => setIsSitemapOpen(false)}
        stories={stories}
        onSelectStory={handleSelectStory}
      />

      {/* Main App Footer */}
      <Footer
        categories={categories}
        onSelectCategory={handleSelectCategory}
        onOpenSitemap={() => setIsSitemapOpen(true)}
      />
    </div>
  );
}

export default App;
