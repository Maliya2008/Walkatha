import { useEffect, useState, useCallback } from 'react';
import { Category, PaginatedResponse, Story, StoryFilterParams } from '../types/story';
import { StoryService } from '../services/storyService';
import { INITIAL_CATEGORIES, INITIAL_STORIES } from '../data/seedStories';

export function useStories(initialParams: StoryFilterParams = {}) {
  const mergedInitialParams: StoryFilterParams = {
    category: 'all',
    page: 1,
    limit: 20, // Default 20 posts per view
    sortBy: 'latest',
    ...initialParams,
  };

  const [params, setParams] = useState<StoryFilterParams>(mergedInitialParams);
  const [response, setResponse] = useState<PaginatedResponse<Story>>({
    data: INITIAL_STORIES.slice(0, 20),
    total: INITIAL_STORIES.length,
    page: 1,
    totalPages: Math.ceil(INITIAL_STORIES.length / 20),
    hasMore: INITIAL_STORIES.length > 20,
    limit: 20,
  });
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await StoryService.getStories(params);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'කතා ලබාගැනීම අසාර්ථක විය');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  useEffect(() => {
    StoryService.getCategories().then((cats) => {
      if (cats && cats.length > 0) setCategories(cats);
    });
  }, []);

  const setCategory = useCallback((category: string) => {
    setParams((prev) => ({ ...prev, category, page: 1 }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setParams((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  const setSortBy = useCallback((sortBy: 'latest' | 'popular' | 'oldest') => {
    setParams((prev) => ({ ...prev, sortBy, page: 1 }));
  }, []);

  return {
    stories: response.data,
    total: response.total,
    page: response.page,
    totalPages: response.totalPages,
    hasMore: response.hasMore,
    limit: response.limit,
    categories,
    isLoading,
    error,
    params,
    setCategory,
    setSearch,
    setPage,
    setSortBy,
    refetch: fetchStories,
  };
}
