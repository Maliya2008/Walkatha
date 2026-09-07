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

  // If initial response has data, isLoading is false immediately (0ms delay)
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const initial = storyService.getInitialPaginatedStories(mergedInitialParams);
    return initial.data.length === 0;
  });

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstMount = useRef(true);

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

  // Handle params changes: instantly filter locally, then sync in background
  useEffect(() => {
    // Perform instant local filtering on current in-memory cache
    const instantFiltered = storyService.filterAndPaginateStories(
      storyService.getStoredStoriesSync(),
      params
    );
    if (instantFiltered.data.length > 0 || !isFirstMount.current) {
      setResponse(instantFiltered);
    }

    // Background fetch fresh updates from Firestore
    fetchStories(false);
    isFirstMount.current = false;
  }, [fetchStories, params]);

  useEffect(() => {
    // Background metadata synchronization
    const loadMeta = async () => {
      try {
        const [cats, featured] = await Promise.all([
          storyService.getCategories(),
          storyService.getFeaturedStories(3),
        ]);
        if (cats && cats.length > 0) setCategories(cats);
        if (featured && featured.length > 0) setFeaturedStories(featured);
      } catch (err) {
        console.warn('Background meta sync fallback:', err);
      }
    };
    loadMeta();
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

