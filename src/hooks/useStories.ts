import { useEffect, useState, useCallback, useRef } from 'react';
import { Category, PaginatedResponse, Story, StoryFilterParams } from '../types/story';
import { storyService } from '../services/storyService';

export function useStories(initialParams: StoryFilterParams = {}) {
  const mergedInitialParams: StoryFilterParams = {
    category: 'all',
    page: 1,
    limit: 20,
    sortBy: 'latest',
    ...initialParams,
  };

  const [params, setParams] = useState<StoryFilterParams>(mergedInitialParams);

  // Synchronously initialize with cached/seed stories on frame 0
  const [response, setResponse] = useState<PaginatedResponse<Story>>(() => {
    return storyService.getInitialPaginatedStories(mergedInitialParams);
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    return storyService.getInitialCategories();
  });

  const [featuredStories, setFeaturedStories] = useState<Story[]>(() => {
    return storyService.getInitialFeaturedStories(3);
  });

  // Zero-delay loading if cached data exists
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const initial = storyService.getInitialPaginatedStories(mergedInitialParams);
    return initial.data.length === 0;
  });

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = useCallback(async (forceLoading = false) => {
    if (forceLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);
    try {
      const result = await storyService.getStories(params);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stories');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [params]);

  // Instantly apply local filtering on parameter changes, then fetch with cache guard
  useEffect(() => {
    const instantFiltered = storyService.filterAndPaginateStories(
      storyService.getStoredStoriesSync(),
      params
    );
    if (instantFiltered.data.length > 0) {
      setResponse(instantFiltered);
    }

    // Shared cached fetch
    fetchStories(false);
  }, [fetchStories, params]);

  // Background metadata synchronization (cached with 1 hour / 15 min TTL)
  useEffect(() => {
    let isMounted = true;
    const loadMeta = async () => {
      try {
        const [cats, featured] = await Promise.all([
          storyService.getCategories(),
          storyService.getFeaturedStories(3),
        ]);
        if (isMounted) {
          if (cats && cats.length > 0) setCategories(cats);
          if (featured && featured.length > 0) setFeaturedStories(featured);
        }
      } catch (err) {
        console.warn('Metadata sync fallback:', err);
      }
    };
    loadMeta();
    return () => {
      isMounted = false;
    };
  }, []);

  const setCategory = useCallback((category: string) => {
    setParams((prev) => (prev.category === category ? prev : { ...prev, category, page: 1 }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setParams((prev) => (prev.search === search ? prev : { ...prev, search, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setParams((prev) => (prev.page === page ? prev : { ...prev, page }));
  }, []);

  const setSortBy = useCallback((sortBy: 'latest' | 'popular' | 'readingTime') => {
    setParams((prev) => (prev.sortBy === sortBy ? prev : { ...prev, sortBy, page: 1 }));
  }, []);

  return {
    stories: response.data,
    total: response.total,
    page: response.page,
    totalPages: response.totalPages,
    hasMore: response.hasMore,
    categories,
    featuredStories,
    isLoading,
    isRefreshing,
    error,
    params,
    setCategory,
    setSearch,
    setPage,
    setSortBy,
    refresh: () => fetchStories(true),
    refreshStories: () => fetchStories(true),
  };
}
