import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { StoryGallery } from './components/stories/StoryGallery';
import { StoryReader } from './components/stories/StoryReader';
import { CategoriesPage } from './components/categories/CategoriesPage';
import { StaticPage } from './components/common/StaticPage';
import { NotFoundPage } from './components/common/NotFoundPage';
import { AdminRoot } from './components/admin/AdminRoot';
import { Story, Category } from './types/story';
import { StoryService } from './services/storyService';
import { SeoService } from './services/seoService';
import { testConnection } from './firebase';
import {
  SideBannerColumn,
  PopunderLoader,
  triggerSmartLinkOnInteraction,
} from './components/common/AdUnits';

type ViewMode =
  | 'home'
  | 'reader'
  | 'categories'
  | 'about'
  | 'privacy'
  | 'terms'
  | 'contact'
  | 'not-found'
  | 'admin';

export function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [selectedStorySlug, setSelectedStorySlug] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'oldest'>('latest');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [stories, setStories] = useState<Story[]>([]);
  const [totalStories, setTotalStories] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('walkathawa_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  useEffect(() => {
    testConnection();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('walkathawa_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const parseRoute = useCallback(() => {
    const path = decodeURIComponent(window.location.pathname).replace(/\/+$/, '') || '/';
    const searchParams = new URLSearchParams(window.location.search);
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const validPage = !isNaN(pageParam) && pageParam > 0 ? pageParam : 1;
    const qParam = searchParams.get('q') || '';

    if (qParam) {
      setSearchQuery(qParam);
    }

    if (path === '/admin' || path.startsWith('/admin/')) {
      setViewMode('admin');
      return;
    }

    if (path === '/' || path === '') {
      setViewMode('home');
      setSelectedStorySlug(null);
      setSelectedCategory('all');
      setCurrentPage(validPage);
      return;
    }

    if (path === '/categories') {
      setViewMode('categories');
      setSelectedStorySlug(null);
      return;
    }

    if (path === '/about') {
      setViewMode('about');
      return;
    }
    if (path === '/privacy') {
      setViewMode('privacy');
      return;
    }
    if (path === '/terms') {
      setViewMode('terms');
      return;
    }
    if (path === '/contact') {
      setViewMode('contact');
      return;
    }

    if (path.startsWith('/category/')) {
      const catSlug = path.replace('/category/', '').trim();
      if (catSlug) {
        setViewMode('home');
        setSelectedStorySlug(null);
        setSelectedCategory(catSlug);
        setCurrentPage(validPage);
        return;
      }
    }

    if (path.startsWith('/story/')) {
      const slug = path.replace('/story/', '').trim();
      if (slug) {
        setSelectedStorySlug(slug);
        setViewMode('reader');
        return;
      }
    }

    setViewMode('not-found');
  }, []);

  useEffect(() => {
    parseRoute();
    const handlePopState = () => parseRoute();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [parseRoute]);

  useEffect(() => {
    StoryService.getCategories()
      .then((cats) => setCategories(cats))
      .catch(() => setCategories([]));
  }, []);

  const fetchStoriesList = useCallback(async () => {
    if (viewMode !== 'home') return;
    setIsLoading(true);
    try {
      const result = await StoryService.getStories({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery,
        sortBy,
        page: currentPage,
        limit: 30,
      });

      setStories(result.data);
      setTotalStories(result.total);
      setTotalPages(result.totalPages || 1);

      const activeCategoryObj =
        selectedCategory !== 'all'
          ? categories.find((c) => c.slug === selectedCategory || c.id === selectedCategory) || null
          : null;

      SeoService.updateHomeSeo(activeCategoryObj, currentPage);
    } catch {
      setStories([]);
    } finally {
      setIsLoading(false);
    }
  }, [viewMode, selectedCategory, searchQuery, sortBy, currentPage, categories]);

  useEffect(() => {
    fetchStoriesList();
  }, [fetchStoriesList]);

  const navigateTo = (url: string) => {
    window.history.pushState({}, '', url);
    parseRoute();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectStory = (slug: string) => {
    triggerSmartLinkOnInteraction();
    navigateTo(`/story/${encodeURIComponent(slug)}`);
  };

  const handleSelectCategory = (catSlug: string) => {
    setSearchQuery('');
    if (!catSlug || catSlug === 'all') {
      navigateTo('/');
    } else {
      navigateTo(`/category/${encodeURIComponent(catSlug)}`);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const baseUrl =
      selectedCategory && selectedCategory !== 'all'
        ? `/category/${encodeURIComponent(selectedCategory)}`
        : '/';
    const targetUrl = newPage > 1 ? `${baseUrl}?page=${newPage}` : baseUrl;
    window.history.pushState({}, '', targetUrl);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
    if (viewMode !== 'home') {
      setViewMode('home');
      window.history.pushState({}, '', q ? `/?q=${encodeURIComponent(q)}` : '/');
    }
  };

  const refreshAllFromFirestore = useCallback(async () => {
    try {
      const cats = await StoryService.getCategories(true);
      setCategories(cats);
    } catch {
      // ignore
    }
    fetchStoriesList();
  }, [fetchStoriesList]);

  if (viewMode === 'admin') {
    return (
      <AdminRoot
        onBackToPublic={() => {
          refreshAllFromFirestore();
          navigateTo('/');
        }}
        onViewStoryPublic={(slug) => handleSelectStory(slug)}
        onDataChanged={refreshAllFromFirestore}
      />
    );
  }

  const sideBannerCount = viewMode === 'home' ? 5 : 3;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#090e1d] text-[#0f172a] dark:text-slate-100 transition-colors duration-200">
      <PopunderLoader routeKey={`${viewMode}-${selectedCategory}-${selectedStorySlug || ''}-${currentPage}`} />
      <Header
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        theme={theme}
        onToggleTheme={toggleTheme}
        onGoHome={() => {
          setSearchQuery('');
          navigateTo('/');
        }}
        onOpenCategoriesPage={() => navigateTo('/categories')}
      />

      <div className="flex-1 w-full max-w-[1540px] mx-auto px-2 sm:px-4 py-6 flex items-start justify-center gap-4">
        <SideBannerColumn side="left" count={sideBannerCount} />

        <main className="flex-1 min-w-0 max-w-6xl">
        {viewMode === 'home' && (
          <StoryGallery
            stories={stories}
            totalStories={totalStories}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            onSelectStory={handleSelectStory}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            sortBy={sortBy}
            onSortChange={(newSort) => {
              setSortBy(newSort);
              setCurrentPage(1);
            }}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            isLoading={isLoading}
          />
        )}

        {viewMode === 'reader' && selectedStorySlug && (
          <StoryReader
            slug={selectedStorySlug}
            onBack={() => navigateTo('/')}
            onSelectStory={handleSelectStory}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {viewMode === 'categories' && (
          <CategoriesPage
            categories={categories}
            onSelectCategory={handleSelectCategory}
            onBack={() => navigateTo('/')}
          />
        )}

        {(viewMode === 'about' ||
          viewMode === 'privacy' ||
          viewMode === 'terms' ||
          viewMode === 'contact') && (
          <StaticPage page={viewMode} onBack={() => navigateTo('/')} />
        )}

        {viewMode === 'not-found' && (
          <NotFoundPage
            onGoHome={() => navigateTo('/')}
            onBrowseCategories={() => navigateTo('/categories')}
          />
        )}
        </main>

        <SideBannerColumn side="right" count={sideBannerCount} />
      </div>

      <Footer
        categories={categories}
        onSelectCategory={handleSelectCategory}
        onNavigateStatic={(page) => navigateTo(`/${page}`)}
      />
    </div>
  );
}

export default App;
