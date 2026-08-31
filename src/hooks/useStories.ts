import { useEffect, useState, useCallback } from 'react';
import { Category, PaginatedResponse, Story, StoryFilterParams } from '../types/story';
import { storyService } from '../services/storyService';

export function useStories(initialParams: StoryFilterParams = {}) {
  const [params, setParams] = useState<StoryFilterParams>({
    category: 'all',
    page: 1,
    limit: 6,
    sortBy: 'latest',
    ...initialParams,
  });

  const [response, setResponse] = useState<PaginatedResponse<Story>>({
    data: [],
    total: 0,
    page: 1,
    totalPages: 1,
    hasMore: false,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredStories, setFeaturedStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await storyService.getStories(params);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stories');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  useEffect(() => {
    // Initial fetch of categories & featured
    const loadMeta = async () => {
      try {
        const [cats, featured] = await Promise.all([
          storyService.getCategories(),
          storyService.getFeaturedStories(3),
        ]);
        setCategories(cats);
        setFeaturedStories(featured);
      } catch (err) {
        console.error('Failed to load categories/featured', err);
      }
    };
    loadMeta();
  }, []);

  const setCategory = (category: string) => {
    setParams((prev) => ({ ...prev, category, page: 1 }));
  };

  const setSearch = (search: string) => {
    setParams((prev) => ({ ...prev, search, page: 1 }));
  };

  const setPage = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const setSortBy = (sortBy: 'latest' | 'popular' | 'readingTime') => {
    setParams((prev) => ({ ...prev, sortBy, page: 1 }));
  };

  return {
    stories: response.data,
    total: response.total,
    page: response.page,
    totalPages: response.totalPages,
    hasMore: response.hasMore,
    categories,
    featuredStories,
    isLoading,
    error,
    params,
    setCategory,
    setSearch,
    setPage,
    setSortBy,
    refresh: fetchStories,
  };
}
