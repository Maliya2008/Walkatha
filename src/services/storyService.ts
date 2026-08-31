import { Category, PaginatedResponse, Story, StoryFilterParams } from '../types/story';
import { INITIAL_CATEGORIES, INITIAL_STORIES } from '../data/seedStories';

class StoryService {
  public async getStories(params: StoryFilterParams = {}): Promise<PaginatedResponse<Story>> {
    try {
      const query = new URLSearchParams();
      if (params.category && params.category !== 'all') query.set('category', params.category);
      if (params.search) query.set('search', params.search);
      if (params.tag) query.set('tag', params.tag);
      if (params.sortBy) query.set('sortBy', params.sortBy);
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));

      const res = await fetch(`/api/public/stories?${query.toString()}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    // Client-side fallback if server is loading
    let filtered = INITIAL_STORIES.filter((s) => s.published);
    if (params.category && params.category !== 'all') {
      filtered = filtered.filter((s) => s.category.toLowerCase() === params.category!.toLowerCase());
    }
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.shortDescription.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    const page = params.page || 1;
    const limit = params.limit || 9;
    const total = filtered.length;
    return {
      data: filtered.slice((page - 1) * limit, page * limit),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      hasMore: page < Math.ceil(total / limit),
    };
  }

  public async getStoryBySlug(
    slug: string
  ): Promise<{ story: Story | null; relatedStories: Story[] }> {
    try {
      const res = await fetch(`/api/public/stories/${encodeURIComponent(slug)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const story = INITIAL_STORIES.find((s) => s.slug === slug || s.id === slug) || null;
    const relatedStories = INITIAL_STORIES.filter(
      (s) => story && s.id !== story.id && s.category === story.category
    ).slice(0, 3);

    return { story, relatedStories };
  }

  public async getFeaturedStories(limit = 3): Promise<Story[]> {
    const res = await this.getStories({ limit: 10 });
    const featured = res.data.filter((s) => s.featured);
    return featured.length > 0 ? featured.slice(0, limit) : res.data.slice(0, limit);
  }

  public async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch('/api/public/categories');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    return INITIAL_CATEGORIES;
  }
}

export const storyService = new StoryService();
