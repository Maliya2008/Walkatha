import { Category, PaginatedResponse, Story, StoryFilterParams } from '../types/story';
import { INITIAL_STORIES, INITIAL_CATEGORIES } from '../data/seedStories';
import {
  normalizeCategorySlug,
  storyMatchesCategory,
  getStoryCanonicalCategory,
} from '../utils/categoryTaxonomy';

const STORAGE_CACHE_KEY = 'walkathawa_cached_stories_v4';

function matchesSearchQuery(s: Story, queryText: string): boolean {
  if (!queryText) return true;
  const q = queryText.toLowerCase().trim();
  const title = (s.title || '').toLowerCase();
  const desc = (s.shortDescription || s.description || '').toLowerCase();
  const cat = (s.categoryName || s.category || '').toLowerCase();
  const tags = (s.tags || []).map((t) => t.toLowerCase());

  if (title.includes(q) || desc.includes(q) || cat.includes(q) || tags.some((t) => t.includes(q))) {
    return true;
  }

  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((token) => {
    return title.includes(token) || desc.includes(token) || cat.includes(token) || tags.some((t) => t.includes(token));
  });
}

export class StoryService {
  private static memoryStories: Story[] = [...INITIAL_STORIES];

  public static async getStories(params: StoryFilterParams = {}): Promise<PaginatedResponse<Story>> {
    const page = Math.max(1, params.page || 1);
    const limit = params.limit || 20; // Default 20 posts per view
    const category = params.category || 'all';
    const search = params.search || '';
    const sortBy = params.sortBy || 'latest';

    // Attempt to fetch from backend API
    try {
      const urlParams = new URLSearchParams();
      urlParams.set('page', String(page));
      urlParams.set('limit', String(limit));
      if (category && category !== 'all') urlParams.set('category', category);
      if (search) urlParams.set('search', search);
      if (sortBy) urlParams.set('sortBy', sortBy);

      const res = await fetch(`/api/stories?${urlParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          // Cache in memory
          return {
            data: json.data,
            total: json.total,
            page: json.page,
            totalPages: json.totalPages,
            hasMore: json.page < json.totalPages,
            limit: json.limit || limit,
          };
        }
      }
    } catch {
      // Fallback to local memory / seed data
    }

    // Fallback: local filtering
    let all = [...this.memoryStories].filter((s) => s.published !== false);

    if (category && category !== 'all') {
      all = all.filter((s) => storyMatchesCategory(s, category));
    }

    if (search.trim()) {
      all = all.filter((s) => matchesSearchQuery(s, search));
    }

    if (sortBy === 'oldest') {
      all.sort((a, b) => new Date(a.uploadDate || 0).getTime() - new Date(b.uploadDate || 0).getTime());
    } else {
      // latest (default)
      all.sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime());
    }

    const total = all.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paged = all.slice(startIndex, startIndex + limit);

    return {
      data: paged,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
      limit,
    };
  }

  public static async getStoryBySlug(slug: string): Promise<Story | null> {
    if (!slug) return null;
    const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();

    try {
      const res = await fetch(`/api/stories/${encodeURIComponent(cleanSlug)}`);
      if (res.ok) {
        const story = await res.json();
        if (story && story.id) {
          return story;
        }
      }
    } catch {
      // Fallback
    }

    // Local fallback
    const found = this.memoryStories.find(
      (s) => (s.slug || '').toLowerCase() === cleanSlug || s.id === cleanSlug
    );
    if (found) {
      found.views = (found.views || 0) + 1;
      return found;
    }

    return null;
  }

  public static async getRelatedStories(currentStory: Story, limit = 4): Promise<Story[]> {
    if (!currentStory) return [];
    try {
      const res = await fetch(`/api/stories/${encodeURIComponent(currentStory.slug)}/related?limit=${limit}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          return json;
        }
      }
    } catch {
      // Fallback
    }

    const currentCat = getStoryCanonicalCategory(currentStory);
    const related = this.memoryStories.filter(
      (s) => s.id !== currentStory.id && storyMatchesCategory(s, currentCat)
    );

    if (related.length >= limit) {
      return related.slice(0, limit);
    }

    // Fill with other stories
    const others = this.memoryStories.filter(
      (s) => s.id !== currentStory.id && !related.some((r) => r.id === s.id)
    );
    return [...related, ...others].slice(0, limit);
  }

  public static async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const cats = await res.json();
        if (Array.isArray(cats) && cats.length > 0) {
          return cats;
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_CATEGORIES;
  }
}
