import { Story, Category, StoryQueryParams, PagedResult } from '../types/story';

let cachedStories: Story[] | null = null;
let cachedCategories: Category[] | null = null;

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'all', name: 'All Stories', sinhalaName: 'සියලු කතා', slug: 'all', description: 'සියලුම සිංහල කතා එකතුව' },
  { id: 'wife', name: 'Wife Stories', sinhalaName: 'වයිෆ් / බිරිඳ', slug: 'wife', description: 'බිරිඳ සහ පවුලේ සත්‍ය අත්දැකීම් ඇසුරින් ලියවුණු කතා' },
  { id: 'akka-malli', name: 'Akka Malli', sinhalaName: 'අක්කා - මල්ලි', slug: 'akka-malli', description: 'අක්කා මල්ලි සහ අසල්වැසි සබඳතා පිළිබඳ රසවත් කතා' },
  { id: 'nanda', name: 'Nanda Stories', sinhalaName: 'නැන්දා / ඇන්ටි', slug: 'nanda', description: 'නැන්දා, ඇන්ටි සහ වැඩිහිටි ආදර කතා එකතුව' },
  { id: 'school', name: 'School & Campus', sinhalaName: 'පාසල් සහ කැම්පස්', slug: 'school', description: 'පාසල්, පන්ති සහ ගුරු සිසු සබඳතා ඇසුරින් ලියවුණු කතා' },
  { id: 'romantic', name: 'Romantic Stories', sinhalaName: 'ආදර කතා', slug: 'romantic', description: 'ආදරය, හැඟීම්බර සහ ආශාවන් පිරි කතා' },
  { id: 'unconventional', name: 'Adult & Drama', sinhalaName: 'අසම්මත කතා', slug: 'unconventional', description: 'අසම්මත සහ නාට්‍යමය කතා' },
  { id: 'short', name: 'Short Stories', sinhalaName: 'කෙටි කතා', slug: 'short', description: 'කෙටි රසවත් කතා' },
  { id: 'novel', name: 'Series & Novels', sinhalaName: 'දිගු කතා මාලා', slug: 'novel', description: 'කොටස් වශයෙන් පළවන දීර්ඝ නවකතා' },
];

export class StoryService {
  /**
   * Fetch all categories
   */
  static async getCategories(): Promise<Category[]> {
    if (cachedCategories && cachedCategories.length > 0) {
      return cachedCategories;
    }

    try {
      const res = await fetch('/api-data/categories.json');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Merge with default categories if needed
          const catMap = new Map<string, Category>();
          DEFAULT_CATEGORIES.forEach((c) => catMap.set(c.id, c));
          data.forEach((c: any) => {
            const id = c.id || c.slug;
            catMap.set(id, {
              id,
              name: c.name || id,
              sinhalaName: c.sinhalaName || c.name || id,
              slug: c.slug || id,
              description: c.description || '',
              storyCount: c.storyCount || 0,
            });
          });
          cachedCategories = Array.from(catMap.values());
          return cachedCategories;
        }
      }
    } catch {
      // ignore network errors and fallback
    }

    cachedCategories = DEFAULT_CATEGORIES;
    return cachedCategories;
  }

  /**
   * Fetch all live stories (cached in memory)
   */
  static async fetchAllLiveStories(): Promise<Story[]> {
    if (cachedStories && cachedStories.length > 0) {
      return cachedStories;
    }

    try {
      const res = await fetch('/api-data/catalog.json');
      if (res.ok) {
        const rawList = await res.json();
        if (Array.isArray(rawList)) {
          cachedStories = rawList.map((s: any) => ({
            id: s.id || s.slug,
            title: s.title || 'නමක් නැති කතාව',
            slug: s.slug || s.id,
            shortDescription: s.shortDescription || s.description || '',
            description: s.description || s.shortDescription || '',
            excerpt: s.shortDescription || s.description || '',
            content: s.content || s.fullContent || '',
            fullContent: s.fullContent || s.content || '',
            category: s.category || 'all',
            categoryName: s.categoryName || '',
            categoryId: s.categoryId || s.category || 'all',
            tags: Array.isArray(s.tags) ? s.tags : [],
            coverImage: s.coverImage || '',
            views: Number(s.views) || 0,
            likes: Number(s.likes) || 0,
            readingTime: Number(s.readingTime) || 10,
            readTime: `${Number(s.readingTime) || 10} min`,
            author: s.author || 'Walkathawa',
            featured: Boolean(s.featured),
            published: s.published !== false,
            uploadDate: s.uploadDate || s.uploadedDate || '2026-01-01',
          }));
          return cachedStories;
        }
      }
    } catch (e) {
      console.warn('Failed to load /api-data/catalog.json:', e);
    }

    cachedStories = [];
    return cachedStories;
  }

  /**
   * Filtered & paginated query for stories
   */
  static async getStories(params: StoryQueryParams = {}): Promise<PagedResult<Story>> {
    const all = await this.fetchAllLiveStories();
    const { category = 'all', search = '', sortBy = 'latest', page = 1, limit = 20 } = params;

    let filtered = [...all];

    // Filter by category
    if (category && category !== 'all') {
      const lowerCat = category.toLowerCase();
      filtered = filtered.filter((s) => {
        const sCat = (s.category || '').toLowerCase();
        const sCatId = (s.categoryId || '').toLowerCase();
        const sTags = (s.tags || []).map((t) => t.toLowerCase());
        return sCat === lowerCat || sCatId === lowerCat || sTags.includes(lowerCat);
      });
    }

    // Filter by search query
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((s) => {
        const inTitle = (s.title || '').toLowerCase().includes(q);
        const inDesc = (s.shortDescription || s.description || '').toLowerCase().includes(q);
        const inTags = (s.tags || []).some((t) => t.toLowerCase().includes(q));
        const inAuthor = typeof s.author === 'string' ? s.author.toLowerCase().includes(q) : s.author?.name?.toLowerCase().includes(q);
        return inTitle || inDesc || inTags || inAuthor;
      });
    }

    // Sort
    if (sortBy === 'popular') {
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.uploadDate || 0).getTime() - new Date(b.uploadDate || 0).getTime());
    } else {
      // latest
      filtered.sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime());
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return {
      data,
      total,
      totalPages,
      currentPage: safePage,
    };
  }

  /**
   * Get story details by its slug or ID
   */
  static async getStoryBySlug(slug: string): Promise<Story | null> {
    const all = await this.fetchAllLiveStories();
    const decodedSlug = decodeURIComponent(slug).trim().toLowerCase();

    const found = all.find(
      (s) =>
        s.slug.toLowerCase() === decodedSlug ||
        s.id.toLowerCase() === decodedSlug ||
        decodeURIComponent(s.slug).toLowerCase() === decodedSlug
    );

    let baseStory = found ? { ...found } : null;

    // Fetch full story body from /api-data/story/${slug}.json if needed
    try {
      const candidates = [
        `/api-data/story/${encodeURIComponent(slug)}.json`,
        `/api-data/story/${slug}.json`,
      ];
      if (found) {
        candidates.unshift(`/api-data/story/${encodeURIComponent(found.slug)}.json`);
        candidates.unshift(`/api-data/story/${found.slug}.json`);
        candidates.unshift(`/api-data/story/${found.id}.json`);
      }

      for (const url of candidates) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const fullData = await res.json();
            if (fullData && (fullData.fullContent || fullData.content)) {
              baseStory = {
                ...(baseStory || {}),
                ...fullData,
                fullContent: fullData.fullContent || fullData.content,
                content: fullData.fullContent || fullData.content,
              } as Story;
              break;
            }
          }
        } catch {
          // try next candidate
        }
      }
    } catch (e) {
      console.warn('Error reading story JSON:', e);
    }

    return baseStory;
  }

  /**
   * Get related stories
   */
  static async getRelatedStories(story: Story, limit = 4): Promise<Story[]> {
    const all = await this.fetchAllLiveStories();
    const currentId = story.id;
    const currentCat = (story.category || '').toLowerCase();
    const currentTags = (story.tags || []).map((t) => t.toLowerCase());

    const candidates = all.filter((s) => s.id !== currentId && s.slug !== story.slug);

    // Score candidates based on category match and common tags
    const scored = candidates.map((cand) => {
      let score = 0;
      if (cand.category && cand.category.toLowerCase() === currentCat) score += 5;
      if (Array.isArray(cand.tags)) {
        cand.tags.forEach((t) => {
          if (currentTags.includes(t.toLowerCase())) score += 2;
        });
      }
      return { story: cand, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.story);
  }
}
