import { Category, PaginatedResponse, Story, StoryFilterParams } from '../types/story';
import { INITIAL_CATEGORIES, INITIAL_STORIES } from '../data/seedStories';

const STORAGE_KEY_STORIES = 'storyhub_stories_v1';
const STORAGE_KEY_CATEGORIES = 'storyhub_categories_v1';
const STORAGE_KEY_VIEWS = 'storyhub_user_views_v1';

/**
 * Story Service Architecture:
 * This service implements the Repository pattern.
 * In Phase 1, it provides local state + seeded persistence.
 * In Phase 2 (Admin Panel / Real Backend), this exact contract connects to
 * Firebase Firestore, Supabase, or Express REST API without modifying any UI component.
 */
class StoryService {
  private stories: Story[] = [];
  private categories: Category[] = [];

  constructor() {
    this.initStorage();
  }

  private initStorage(): void {
    try {
      const storedStories = localStorage.getItem(STORAGE_KEY_STORIES);
      if (storedStories) {
        this.stories = JSON.parse(storedStories);
      } else {
        this.stories = INITIAL_STORIES;
        this.saveStories();
      }

      const storedCategories = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (storedCategories) {
        this.categories = JSON.parse(storedCategories);
      } else {
        this.categories = INITIAL_CATEGORIES;
        this.saveCategories();
      }
    } catch {
      this.stories = INITIAL_STORIES;
      this.categories = INITIAL_CATEGORIES;
    }
  }

  private saveStories(): void {
    try {
      localStorage.setItem(STORAGE_KEY_STORIES, JSON.stringify(this.stories));
    } catch (e) {
      console.warn('Unable to persist stories to localStorage', e);
    }
  }

  private saveCategories(): void {
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(this.categories));
    } catch (e) {
      console.warn('Unable to persist categories to localStorage', e);
    }
  }

  // --- PUBLIC API CONSUMED BY UI (Simulates GET /api/stories) ---

  public async getStories(params: StoryFilterParams = {}): Promise<PaginatedResponse<Story>> {
    // Artificial lightweight micro-delay to simulate network realism
    await new Promise((r) => setTimeout(r, 40));

    let filtered = this.stories.filter((s) => s.published);

    if (params.category && params.category !== 'all') {
      filtered = filtered.filter(
        (s) => s.category.toLowerCase() === params.category!.toLowerCase()
      );
    }

    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.shortDescription.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)) ||
          s.author.name.toLowerCase().includes(q)
      );
    }

    if (params.tag) {
      const tagLower = params.tag.toLowerCase();
      filtered = filtered.filter((s) =>
        s.tags.some((t) => t.toLowerCase() === tagLower)
      );
    }

    if (params.featuredOnly) {
      filtered = filtered.filter((s) => s.featured);
    }

    // Sorting
    if (params.sortBy === 'popular') {
      filtered.sort((a, b) => b.views - a.views);
    } else if (params.sortBy === 'readingTime') {
      filtered.sort((a, b) => a.readingTime - b.readingTime);
    } else {
      // Default: Latest
      filtered.sort(
        (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      );
    }

    const page = params.page || 1;
    const limit = params.limit || 6;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const pagedData = filtered.slice(startIndex, startIndex + limit);

    return {
      data: pagedData,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  public async getStoryBySlug(slug: string): Promise<Story | null> {
    await new Promise((r) => setTimeout(r, 30));
    const story = this.stories.find(
      (s) => s.slug === slug || s.id === slug
    );
    return story ? { ...story } : null;
  }

  public async getFeaturedStories(limit = 3): Promise<Story[]> {
    await new Promise((r) => setTimeout(r, 20));
    return this.stories
      .filter((s) => s.published && s.featured)
      .slice(0, limit);
  }

  public async getLatestStories(limit = 4): Promise<Story[]> {
    await new Promise((r) => setTimeout(r, 20));
    return [...this.stories]
      .filter((s) => s.published)
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
      .slice(0, limit);
  }

  public async getRelatedStories(category: string, currentSlug: string, limit = 3): Promise<Story[]> {
    await new Promise((r) => setTimeout(r, 30));
    const related = this.stories.filter(
      (s) => s.published && s.slug !== currentSlug && (s.category === category || s.category === 'all')
    );

    if (related.length < limit) {
      const others = this.stories.filter(
        (s) => s.published && s.slug !== currentSlug && !related.some((r) => r.id === s.id)
      );
      related.push(...others);
    }

    return related.slice(0, limit);
  }

  public async getCategories(): Promise<Category[]> {
    await new Promise((r) => setTimeout(r, 20));
    return [...this.categories];
  }

  public async incrementStoryViews(idOrSlug: string): Promise<number> {
    const storyIndex = this.stories.findIndex(
      (s) => s.id === idOrSlug || s.slug === idOrSlug
    );
    if (storyIndex === -1) return 0;

    // Check if user already viewed in this browser session to avoid artificial inflation
    try {
      const sessionViews = JSON.parse(sessionStorage.getItem(STORAGE_KEY_VIEWS) || '[]');
      if (!sessionViews.includes(this.stories[storyIndex].id)) {
        this.stories[storyIndex].views += 1;
        this.saveStories();
        sessionViews.push(this.stories[storyIndex].id);
        sessionStorage.setItem(STORAGE_KEY_VIEWS, JSON.stringify(sessionViews));
      }
    } catch {
      this.stories[storyIndex].views += 1;
      this.saveStories();
    }

    return this.stories[storyIndex].views;
  }

  // --- FUTURE ADMIN PANEL API METHODS (Ready for Phase 2 integration) ---

  public async createStory(newStory: Omit<Story, 'id' | 'views' | 'uploadDate' | 'updatedDate'>): Promise<Story> {
    const id = `story-${Date.now()}`;
    const now = new Date().toISOString();
    const created: Story = {
      ...newStory,
      id,
      views: 0,
      uploadDate: now,
      updatedDate: now,
    };
    this.stories.unshift(created);
    this.saveStories();
    return created;
  }

  public async updateStory(id: string, updates: Partial<Story>): Promise<Story | null> {
    const idx = this.stories.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.stories[idx] = {
      ...this.stories[idx],
      ...updates,
      updatedDate: new Date().toISOString(),
    };
    this.saveStories();
    return this.stories[idx];
  }

  public async deleteStory(id: string): Promise<boolean> {
    const initialLen = this.stories.length;
    this.stories = this.stories.filter((s) => s.id !== id);
    this.saveStories();
    return this.stories.length < initialLen;
  }
}

export const storyService = new StoryService();
