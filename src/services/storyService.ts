import { Category, PaginatedResponse, Story, StoryFilterParams } from '../types/story';
import { INITIAL_STORIES, INITIAL_CATEGORIES } from '../data/seedStories';
import { db } from '../lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  getDoc,
  doc,
  limit,
  updateDoc,
  increment,
} from 'firebase/firestore';

const STORAGE_STORIES_CACHE_KEY = 'walkathawa_cached_stories_v2';
const STORAGE_CATEGORIES_CACHE_KEY = 'walkathawa_cached_categories_v2';
const CACHE_TTL_MS = 60 * 1000; // 1 minute fresh cache in memory

export const DEFAULT_FALLBACK_CATEGORIES: Category[] = [
  ...INITIAL_CATEGORIES,
  { id: 'cat-romantic', slug: 'romantic', name: 'ආදර කතා (Romantic)', description: 'Romantic tales and emotions', storyCount: 0 },
  { id: 'cat-adventure', slug: 'adventure', name: 'ත්‍රාසජනක (Adventure)', description: 'Adventures and thrillers', storyCount: 0 },
  { id: 'cat-fiction', slug: 'fiction', name: 'ප්‍රබන්ධ කතා (Fiction)', description: 'Creative fiction and literature', storyCount: 0 },
  { id: 'cat-mystery', slug: 'mystery', name: 'අභිරහස් (Mystery)', description: 'Mystery and detective stories', storyCount: 0 },
  { id: 'cat-scifi', slug: 'sci-fi', name: 'විද්‍යා ප්‍රබන්ධ (Sci-Fi)', description: 'Science fiction and future tales', storyCount: 0 },
  { id: 'cat-fantasy', slug: 'fantasy', name: 'මනඃකල්පිත (Fantasy)', description: 'Fantasy, magic, and folklore', storyCount: 0 },
  { id: 'cat-horror', slug: 'horror', name: 'හොල්මන් / බියකරු (Horror)', description: 'Horror and supernatural mysteries', storyCount: 0 },
  { id: 'cat-inspirational', slug: 'inspirational', name: 'ජීවිත ආදර්ශ (Inspirational)', description: 'Inspirational and moral life stories', storyCount: 0 },
];

const SYNONYMS: Record<string, string[]> = {
  amma: ['අම්මා', 'මව'],
  putha: ['පුතා'],
  akka: ['අක්කා'],
  malli: ['මල්ලි'],
  ayya: ['අයියා'],
  nangi: ['නංගි'],
  wife: ['වයිෆ්', 'බිරිඳ', 'birinda'],
  birinda: ['බිරිඳ', 'වයිෆ්', 'wife'],
  nanda: ['නැන්දා', 'aunty', 'ඇන්ටි'],
  aunty: ['ඇන්ටි', 'නැන්දා'],
  teacher: ['ටීචර්', 'ගුරුතුමී', 'teacher'],
  bus: ['බස්', 'bus'],
  family: ['පවුලේ', 'pawule'],
  pawule: ['පවුලේ', 'family'],
  aluth: ['අලුත්', 'new', 'නවතම', 'aluthma'],
  aluthma: ['අලුත්', 'new', 'නවතම', 'aluth'],
  new: ['අලුත්', 'aluth', 'නවතම'],
  wal: ['වල්', 'වැල', 'wela', 'wala', 'walkatha'],
  wela: ['වැල', 'වල්', 'wal', 'wala'],
  wala: ['වලා', 'වල්', 'වැල', 'wal'],
  walakatha: ['walkatha', 'වල් කතා', 'වැල කතා'],
  walkatha: ['wal katha', 'වල් කතා', 'වැල කතා'],
  katha: ['කතා', 'කතාව', 'story', 'stories'],
  chithra: ['චිත්‍ර', 'chithra'],
  pdf: ['pdf', 'පොත්'],
  full: ['සම්පූර්ණ', 'full'],
};

function matchesSearchQuery(s: Story, queryText: string): boolean {
  if (!queryText) return true;
  const rawQuery = queryText.toLowerCase().trim();
  const title = (s.title || '').toLowerCase();
  const desc = (s.shortDescription || s.description || '').toLowerCase();
  const category = (s.categoryName || s.category || '').toLowerCase();
  const tags = (s.tags || []).map((t) => t.toLowerCase());

  if (
    title.includes(rawQuery) ||
    desc.includes(rawQuery) ||
    category.includes(rawQuery) ||
    tags.some((t) => t.includes(rawQuery))
  ) {
    return true;
  }

  const tokens = rawQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  return tokens.every((token) => {
    if (token === '2025' || token === '2026' || token === 'free') return true;
    const equivalents = [token, ...(SYNONYMS[token] || [])];
    return equivalents.some(
      (eq) =>
        title.includes(eq) ||
        desc.includes(eq) ||
        category.includes(eq) ||
        tags.some((t) => t.includes(eq))
    );
  });
}

function normalizeStoryDoc(id: string, data: any): Story {
  return {
    id,
    title: data.title || '',
    slug: data.slug || '',
    coverImage: data.coverImage || '',
    shortDescription: data.shortDescription || data.description || '',
    fullContent: data.fullContent || data.content || '',
    categoryId: data.categoryId || data.category || '',
    category: data.category || '',
    categoryName: data.categoryName || data.category || '',
    tags: data.tags || [],
    author: data.author || { name: 'Editorial Staff' },
    uploadDate: data.uploadDate || data.uploadedDate || data.createdAt || new Date().toISOString(),
    uploadedDate: data.uploadedDate || data.uploadDate || data.createdAt || new Date().toISOString(),
    updatedDate: data.updatedDate || data.updatedAt || new Date().toISOString(),
    readingTime: data.readingTime || 5,
    views: Number(data.views || 0),
    published: Boolean(data.published),
    featured: Boolean(data.featured),
    directAdLink: data.directAdLink || '',
  };
}

// Module-level memory cache for instantaneous responses
let memoryStoriesCache: Story[] | null = null;
let memoryCategoriesCache: Category[] | null = null;
let lastFetchTime = 0;
let inFlightFetchPromise: Promise<Story[]> | null = null;

class StoryService {
  /**
   * Helper to load cached stories synchronously from memory or localStorage
   */
  public getStoredStoriesSync(): Story[] {
    if (memoryStoriesCache && memoryStoriesCache.length > 0) {
      return memoryStoriesCache;
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_STORIES_CACHE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            memoryStoriesCache = parsed;
            return parsed;
          }
        }
      }
    } catch {
      // Fallback
    }
    memoryStoriesCache = [...INITIAL_STORIES];
    return memoryStoriesCache;
  }

  /**
   * Helper to load cached categories synchronously
   */
  public getInitialCategories(): Category[] {
    if (memoryCategoriesCache && memoryCategoriesCache.length > 0) {
      return memoryCategoriesCache;
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_CATEGORIES_CACHE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            memoryCategoriesCache = parsed;
            return parsed;
          }
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_FALLBACK_CATEGORIES;
  }

  /**
   * Helper to load cached featured stories synchronously
   */
  public getInitialFeaturedStories(count = 3): Story[] {
    const all = this.getStoredStoriesSync();
    const featured = all.filter((s) => s.featured);
    if (featured.length > 0) {
      return featured.slice(0, count);
    }
    return all.slice(0, count);
  }

  /**
   * Synchronous filter, sort, and pagination of an array of stories
   */
  public filterAndPaginateStories(
    allStories: Story[],
    params: StoryFilterParams = {}
  ): PaginatedResponse<Story> {
    let filtered = [...allStories];

    if (params.category && params.category !== 'all') {
      const catFilter = params.category.toLowerCase().trim();
      filtered = filtered.filter((s) => {
        const cat = (s.category || '').toLowerCase().trim();
        const catId = ((s as any).categoryId || '').toLowerCase().trim();
        const catName = ((s as any).categoryName || '').toLowerCase().trim();
        const catSlug = ((s as any).categorySlug || '').toLowerCase().trim();
        return (
          cat === catFilter ||
          catId === catFilter ||
          catName === catFilter ||
          catSlug === catFilter
        );
      });
    }

    if (params.search && params.search.trim()) {
      const queryText = params.search.trim();
      filtered = filtered.filter((s) => matchesSearchQuery(s, queryText));
    }

    if (params.sortBy === 'popular') {
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else {
      filtered.sort(
        (a, b) =>
          new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime()
      );
    }

    const page = params.page || 1;
    const limitVal = params.limit || 20;
    const total = filtered.length;

    return {
      data: filtered.slice((page - 1) * limitVal, page * limitVal),
      total,
      page,
      totalPages: Math.ceil(total / limitVal) || 1,
      hasMore: page < Math.ceil(total / limitVal),
    };
  }

  /**
   * Provides immediate paginated stories synchronously on frame 0
   */
  public getInitialPaginatedStories(params: StoryFilterParams = {}): PaginatedResponse<Story> {
    const stories = this.getStoredStoriesSync();
    return this.filterAndPaginateStories(stories, params);
  }

  /**
   * Fetch all published stories with caching and deduplication
   */
  private async fetchAllStoriesFromFirestore(): Promise<Story[]> {
    const now = Date.now();
    if (memoryStoriesCache && memoryStoriesCache.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
      return memoryStoriesCache;
    }

    if (inFlightFetchPromise) {
      return inFlightFetchPromise;
    }

    inFlightFetchPromise = (async () => {
      try {
        const storiesRef = collection(db, 'stories');
        const q = query(storiesRef, where('published', '==', true));

        // 3-second timeout protection to avoid blocking when offline or slow connection
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore timeout')), 3000)
        );

        const snapshot = (await Promise.race([getDocs(q), timeoutPromise])) as any;
        const stories: Story[] = [];
        snapshot.forEach((docSnap: any) => {
          stories.push(normalizeStoryDoc(docSnap.id, docSnap.data()));
        });

        if (stories.length > 0) {
          memoryStoriesCache = stories;
          lastFetchTime = Date.now();
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem(STORAGE_STORIES_CACHE_KEY, JSON.stringify(stories));
            }
          } catch {
            // Ignore quota exceeded
          }
          return stories;
        }

        return this.getStoredStoriesSync();
      } catch (err) {
        console.warn('Background Firestore fetch fallback:', err);
        return this.getStoredStoriesSync();
      } finally {
        inFlightFetchPromise = null;
      }
    })();

    return inFlightFetchPromise;
  }

  public async getStories(params: StoryFilterParams = {}): Promise<PaginatedResponse<Story>> {
    try {
      const allStories = await this.fetchAllStoriesFromFirestore();
      return this.filterAndPaginateStories(allStories, params);
    } catch {
      const fallback = this.getStoredStoriesSync();
      return this.filterAndPaginateStories(fallback, params);
    }
  }

  public async getStoryBySlug(
    slug: string
  ): Promise<{ story: Story | null; relatedStories: Story[] }> {
    try {
      // First check in-memory cache for instant open
      const cached = this.getStoredStoriesSync();
      let story = cached.find((s) => s.slug === slug || s.id === slug) || null;

      if (!story) {
        // Fetch from Firestore
        const storiesRef = collection(db, 'stories');
        const q = query(
          storiesRef,
          where('slug', '==', slug),
          where('published', '==', true),
          limit(1)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          story = normalizeStoryDoc(snapshot.docs[0].id, snapshot.docs[0].data());
        } else {
          const docRef = doc(db, 'stories', slug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().published) {
            story = normalizeStoryDoc(docSnap.id, docSnap.data());
          }
        }
      }

      let relatedStories: Story[] = [];
      if (story && story.category) {
        const cat = story.category.toLowerCase().trim();
        relatedStories = cached
          .filter((s) => s.id !== story!.id && (s.category || '').toLowerCase().trim() === cat)
          .slice(0, 3);
      }

      if (relatedStories.length === 0) {
        relatedStories = cached.filter((s) => s.id !== (story ? story.id : '')).slice(0, 3);
      }

      return { story, relatedStories };
    } catch (e) {
      console.error('Error fetching story by slug:', e);
      const fallback = this.getStoredStoriesSync();
      const story = fallback.find((s) => s.slug === slug || s.id === slug) || null;
      const relatedStories = fallback.filter((s) => s.id !== slug).slice(0, 3);
      return { story, relatedStories };
    }
  }

  /**
   * Atomic Firestore view increment for story views
   */
  public async incrementStoryViews(storyId: string): Promise<boolean> {
    if (!storyId) return false;
    try {
      const storyRef = doc(db, 'stories', storyId);
      await updateDoc(storyRef, {
        views: increment(1),
      });
      return true;
    } catch (error) {
      console.warn('[StoryView] Atomic story view increment warning:', error);
      return false;
    }
  }

  public async getFeaturedStories(limitVal = 3): Promise<Story[]> {
    try {
      const all = await this.fetchAllStoriesFromFirestore();
      const featured = all.filter((s) => s.featured);
      if (featured.length > 0) {
        return featured.slice(0, limitVal);
      }
      return all.slice(0, limitVal);
    } catch {
      return this.getInitialFeaturedStories(limitVal);
    }
  }

  public async getCategories(): Promise<Category[]> {
    try {
      const categoriesRef = collection(db, 'categories');
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Categories timeout')), 2500)
      );
      const snapshot = (await Promise.race([getDocs(categoriesRef), timeoutPromise])) as any;
      let categories: Category[] = [];

      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data();
        let rawSlug = (data.slug || '').toString().trim();
        if (!rawSlug || rawSlug === 'all') {
          rawSlug = docSnap.id;
        }
        categories.push({
          id: docSnap.id,
          name: (data.name || 'Category').toString().trim(),
          slug: rawSlug,
          description: data.description || '',
          storyCount: data.storyCount || 0,
        });
      });

      if (categories.length === 0) {
        return this.getInitialCategories();
      }

      // Ensure every category has a strictly unique slug
      const seenSlugs = new Set<string>();
      categories = categories.map((cat) => {
        let uniqueSlug = cat.slug;
        let counter = 1;
        while (seenSlugs.has(uniqueSlug.toLowerCase())) {
          counter++;
          uniqueSlug = `${cat.slug}-${cat.id ? cat.id.substring(0, 4) : counter}`;
        }
        seenSlugs.add(uniqueSlug.toLowerCase());
        return { ...cat, slug: uniqueSlug };
      });

      memoryCategoriesCache = categories;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(STORAGE_CATEGORIES_CACHE_KEY, JSON.stringify(categories));
        }
      } catch {
        // Ignore
      }

      return categories;
    } catch {
      return this.getInitialCategories();
    }
  }
}

export const storyService = new StoryService();


