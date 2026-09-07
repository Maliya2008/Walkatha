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
  orderBy,
} from 'firebase/firestore';

// --- STORAGE & CACHE CONFIGURATION ---
const STORAGE_STORIES_CACHE_KEY = 'walkathawa_cached_stories_v3';
const STORAGE_CATEGORIES_CACHE_KEY = 'walkathawa_cached_categories_v3';
const STORAGE_STORY_MAP_KEY = 'walkathawa_cached_story_items_v3';

// Cache TTLs
const STORIES_CACHE_TTL_MS = 10 * 60 * 1000;       // 10 minutes
const CATEGORIES_CACHE_TTL_MS = 60 * 60 * 1000;    // 1 hour
const FEATURED_CACHE_TTL_MS = 15 * 60 * 1000;      // 15 minutes
const SINGLE_STORY_CACHE_TTL_MS = 30 * 60 * 1000;  // 30 minutes

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

const BANNED_MOCK_PATTERNS = [
  'rahas-hamuwima',
  'nil-diyawara',
  'madhyama-rathriye',
  'tharu-piri',
  'nodutu-sihinaya',
  'wasi-bindu',
  'the-secret-in-moonlight',
  'story-the-secret-in-moonlight',
  'සඳ එළියේ රහස',
  'රහස් හමුවීම',
  'නිල් දියවර',
  'මධ්‍යම රාත්‍රියේ',
  'තරු පිරි අහස',
  'නොදුටු සිහිනය',
  'වැසි බිඳු අතරින්',
  'නිස්කලංක රාත්‍රියක හමුවූ අමුතු ආගන්තුකයා',
];

export function isMockStory(s: any): boolean {
  if (!s) return false;
  const id = String(s.id || '').toLowerCase();
  const slug = String(s.slug || '').toLowerCase();
  const title = String(s.title || '').toLowerCase();
  return BANNED_MOCK_PATTERNS.some(
    (p) => id.includes(p) || slug.includes(p) || title.includes(p)
  );
}

function normalizeStoryDoc(id: string, data: any): Story {
  return {
    id,
    title: data.title || '',
    slug: data.slug || id,
    coverImage: data.coverImage || '',
    shortDescription: data.shortDescription || data.description || '',
    fullContent: data.fullContent || data.content || '',
    categoryId: data.categoryId || data.category || '',
    category: data.category || '',
    categoryName: data.categoryName || data.category || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    author: data.author || { name: 'Editorial Staff' },
    uploadDate: data.uploadDate || data.uploadedDate || data.createdAt || new Date().toISOString(),
    uploadedDate: data.uploadedDate || data.uploadDate || data.createdAt || new Date().toISOString(),
    updatedDate: data.updatedDate || data.updatedAt || new Date().toISOString(),
    readingTime: Number(data.readingTime || 5),
    views: Number(data.views || 0),
    published: Boolean(data.published),
    featured: Boolean(data.featured),
    directAdLink: data.directAdLink || '',
  };
}

export function isQuotaError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const code = (err.code || '').toLowerCase();
  return (
    code.includes('resource-exhausted') ||
    code.includes('quota') ||
    msg.includes('quota') ||
    msg.includes('resource exhausted') ||
    msg.includes('limit exceeded') ||
    msg.includes('free daily read units')
  );
}

// In-flight request deduplication map
const pendingRequests = new Map<string, Promise<any>>();

// Normalized Story entity cache: storyId/slug -> { story: Story, timestamp: number }
const storyEntityCache = new Map<string, { story: Story; timestamp: number }>();

// List cache: cacheKey -> { data: Story[], total: number, timestamp: number }
const storyListCache = new Map<string, { data: Story[]; total: number; timestamp: number }>();

// Category cache
let categoryCache: { categories: Category[]; timestamp: number } | null = null;

// Featured stories cache
let featuredCache: { stories: Story[]; timestamp: number } | null = null;

// Circuit breaker for Firestore quota
let firestoreQuotaExceededUntil = 0;

class StoryService {
  constructor() {
    this.hydrateFromLocalStorage();
  }

  /**
   * Hydrates memory caches from localStorage on initialization
   */
  private hydrateFromLocalStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      // 1. Stories entity cache
      const storedMap = localStorage.getItem(STORAGE_STORY_MAP_KEY);
      if (storedMap) {
        const parsed: Record<string, Story> = JSON.parse(storedMap);
        let changed = false;
        Object.entries(parsed).forEach(([key, story]) => {
          if (isMockStory(story) || isMockStory({ id: key, slug: key })) {
            delete parsed[key];
            changed = true;
            return;
          }
          storyEntityCache.set(key, { story, timestamp: Date.now() });
          if (story.slug) storyEntityCache.set(story.slug, { story, timestamp: Date.now() });
          if (story.id) storyEntityCache.set(story.id, { story, timestamp: Date.now() });
        });
        if (changed) {
          localStorage.setItem(STORAGE_STORY_MAP_KEY, JSON.stringify(parsed));
        }
      }

      // 2. Categories
      const storedCats = localStorage.getItem(STORAGE_CATEGORIES_CACHE_KEY);
      if (storedCats) {
        const parsed = JSON.parse(storedCats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          categoryCache = { categories: parsed, timestamp: Date.now() };
        }
      }

      // 3. Fallback stories array
      const storedStories = localStorage.getItem(STORAGE_STORIES_CACHE_KEY);
      if (storedStories) {
        const parsed: Story[] = JSON.parse(storedStories);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleanParsed = parsed.filter((s) => !isMockStory(s));
          storyListCache.set('all_default', {
            data: cleanParsed,
            total: cleanParsed.length,
            timestamp: Date.now(),
          });
          cleanParsed.forEach((s) => {
            if (s.id) storyEntityCache.set(s.id, { story: s, timestamp: Date.now() });
            if (s.slug) storyEntityCache.set(s.slug, { story: s, timestamp: Date.now() });
          });
          if (cleanParsed.length !== parsed.length) {
            localStorage.setItem(STORAGE_STORIES_CACHE_KEY, JSON.stringify(cleanParsed));
          }
        }
      }
    } catch {
      // Ignore storage hydration errors
    }

    // Seed defaults if entity cache is still empty
    if (storyEntityCache.size === 0) {
      INITIAL_STORIES.filter((s) => !isMockStory(s)).forEach((s) => {
        const normalized = normalizeStoryDoc(s.id, s);
        storyEntityCache.set(s.id, { story: normalized, timestamp: Date.now() });
        if (s.slug) storyEntityCache.set(s.slug, { story: normalized, timestamp: Date.now() });
      });
    }
  }

  private persistStoryToStorage(story: Story): void {
    if (typeof window === 'undefined' || !window.localStorage || isMockStory(story)) return;
    try {
      const storedMap = localStorage.getItem(STORAGE_STORY_MAP_KEY);
      const parsed: Record<string, Story> = storedMap ? JSON.parse(storedMap) : {};
      parsed[story.id] = story;
      if (story.slug) parsed[story.slug] = story;
      // Keep storage bounded to recent 200 items to avoid quota
      const keys = Object.keys(parsed);
      if (keys.length > 200) {
        keys.slice(0, keys.length - 200).forEach((k) => delete parsed[k]);
      }
      localStorage.setItem(STORAGE_STORY_MAP_KEY, JSON.stringify(parsed));
    } catch {
      // Ignore
    }
  }

  /**
   * Helper to load cached stories synchronously from memory or localStorage
   */
  public getStoredStoriesSync(): Story[] {
    const list = storyListCache.get('all_default');
    if (list && list.data.length > 0) {
      return list.data;
    }

    const uniqueStories = new Map<string, Story>();
    storyEntityCache.forEach((item) => {
      uniqueStories.set(item.story.id, item.story);
    });

    if (uniqueStories.size > 0) {
      const arr = Array.from(uniqueStories.values());
      storyListCache.set('all_default', { data: arr, total: arr.length, timestamp: Date.now() });
      return arr;
    }

    return [...INITIAL_STORIES];
  }

  /**
   * Helper to load cached categories synchronously
   */
  public getInitialCategories(): Category[] {
    if (categoryCache && categoryCache.categories.length > 0) {
      return categoryCache.categories;
    }
    return DEFAULT_FALLBACK_CATEGORIES;
  }

  /**
   * Helper to load cached featured stories synchronously
   */
  public getInitialFeaturedStories(count = 3): Story[] {
    if (featuredCache && featuredCache.stories.length > 0) {
      return featuredCache.stories.slice(0, count);
    }
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
   * Invalidate caches (e.g. after admin updates)
   */
  public invalidateCache(): void {
    storyListCache.clear();
    categoryCache = null;
    featuredCache = null;
    pendingRequests.clear();
  }

  /**
   * Fetch paginated stories with multi-tiered caching & minimum Firestore queries
   */
  public async getStories(params: StoryFilterParams = {}): Promise<PaginatedResponse<Story>> {
    const cacheKey = `stories_${params.category || 'all'}_${params.page || 1}_${params.limit || 20}_${params.sortBy || 'latest'}_${params.search || ''}`;

    // 1. Check in-memory list cache
    const cached = storyListCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < STORIES_CACHE_TTL_MS) {
      return this.filterAndPaginateStories(cached.data, params);
    }

    // 2. Request deduplication for concurrent identical queries
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!;
    }

    const fetchPromise = (async (): Promise<PaginatedResponse<Story>> => {
      // Step A: Fetch via fast Node Server Public API (consumes 0 Firestore reads)
      try {
        const queryParams = new URLSearchParams();
        if (params.category && params.category !== 'all') queryParams.set('category', params.category);
        if (params.search) queryParams.set('search', params.search);
        if (params.page) queryParams.set('page', String(params.page));
        if (params.limit) queryParams.set('limit', String(params.limit));
        if (params.sortBy) queryParams.set('sortBy', params.sortBy);

        const res = await fetch(`/api/public/stories?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json && Array.isArray(json.data) && json.data.length > 0) {
            const fetchedStories: Story[] = json.data;
            fetchedStories.forEach((s) => {
              storyEntityCache.set(s.id, { story: s, timestamp: Date.now() });
              if (s.slug) storyEntityCache.set(s.slug, { story: s, timestamp: Date.now() });
            });
            storyListCache.set(cacheKey, {
              data: fetchedStories,
              total: json.total || fetchedStories.length,
              timestamp: Date.now(),
            });
            return {
              data: fetchedStories,
              total: json.total || fetchedStories.length,
              page: json.page || params.page || 1,
              totalPages: json.totalPages || Math.ceil((json.total || fetchedStories.length) / (params.limit || 20)),
              hasMore: Boolean(json.hasMore),
            };
          }
        }
      } catch {
        // Fall through to Firestore
      }

      // Step B: Target Firestore query with strict LIMIT (NOT full collection download)
      if (Date.now() > firestoreQuotaExceededUntil) {
        try {
          const storiesRef = collection(db, 'stories');
          const limitCount = params.limit || 20;

          // Build minimal, indexed query with strict limit
          let q;
          if (params.category && params.category !== 'all') {
            q = query(
              storiesRef,
              where('published', '==', true),
              where('category', '==', params.category),
              limit(limitCount)
            );
          } else {
            q = query(
              storiesRef,
              where('published', '==', true),
              limit(limitCount)
            );
          }

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Firestore timeout')), 3500)
          );

          const snapshot = (await Promise.race([getDocs(q), timeoutPromise])) as any;
          const fetchedDocs: Story[] = [];
          snapshot.forEach((docSnap: any) => {
            const story = normalizeStoryDoc(docSnap.id, docSnap.data());
            fetchedDocs.push(story);
            storyEntityCache.set(story.id, { story, timestamp: Date.now() });
            if (story.slug) storyEntityCache.set(story.slug, { story, timestamp: Date.now() });
            this.persistStoryToStorage(story);
          });

          if (fetchedDocs.length > 0) {
            storyListCache.set(cacheKey, {
              data: fetchedDocs,
              total: fetchedDocs.length,
              timestamp: Date.now(),
            });
            return this.filterAndPaginateStories(fetchedDocs, params);
          }
        } catch (err: any) {
          if (isQuotaError(err)) {
            firestoreQuotaExceededUntil = Date.now() + 60 * 60 * 1000;
          }
        }
      }

      // Step C: Fallback to cached sync data
      const fallback = this.getStoredStoriesSync();
      return this.filterAndPaginateStories(fallback, params);
    })().finally(() => {
      pendingRequests.delete(cacheKey);
    });

    pendingRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  /**
   * Fetch single story with maximum cache reuse & zero duplicate reads
   */
  public async getStoryBySlug(
    slug: string
  ): Promise<{ story: Story | null; relatedStories: Story[] }> {
    if (!slug) return { story: null, relatedStories: [] };

    const now = Date.now();

    // 1. Check normalized memory cache first (0 network calls, 0 Firestore reads)
    const memCached = storyEntityCache.get(slug);
    if (memCached && now - memCached.timestamp < SINGLE_STORY_CACHE_TTL_MS) {
      const related = this.getRelatedStoriesSync(memCached.story);
      return { story: memCached.story, relatedStories: related };
    }

    // 2. Check in-flight promise for this exact slug (Deduplicates concurrent requests)
    const requestKey = `story_${slug}`;
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey)!;
    }

    const fetchPromise = (async () => {
      let story: Story | null = null;

      // Step A: Try fast Server Public API (0 Firestore reads)
      try {
        const res = await fetch(`/api/public/stories/${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.story) {
            story = data.story;
            storyEntityCache.set(story.id, { story, timestamp: Date.now() });
            if (story.slug) storyEntityCache.set(story.slug, { story, timestamp: Date.now() });
            this.persistStoryToStorage(story);
            const related = Array.isArray(data.relatedStories) && data.relatedStories.length > 0
              ? data.relatedStories
              : this.getRelatedStoriesSync(story);
            return { story, relatedStories: related };
          }
        }
      } catch {
        // Fall through
      }

      // Step B: Target Firestore with single document query: limit(1)
      if (Date.now() > firestoreQuotaExceededUntil) {
        try {
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
            // Direct ID lookup fallback
            const docRef = doc(db, 'stories', slug);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().published) {
              story = normalizeStoryDoc(docSnap.id, docSnap.data());
            }
          }

          if (story) {
            storyEntityCache.set(story.id, { story, timestamp: Date.now() });
            if (story.slug) storyEntityCache.set(story.slug, { story, timestamp: Date.now() });
            this.persistStoryToStorage(story);
          }
        } catch (err: any) {
          if (isQuotaError(err)) {
            firestoreQuotaExceededUntil = Date.now() + 60 * 60 * 1000;
          }
        }
      }

      // Step C: Fallback to sync memory/seed data
      if (!story) {
        const fallback = this.getStoredStoriesSync();
        story = fallback.find((s) => s.slug === slug || s.id === slug) || null;
      }

      const related = story ? this.getRelatedStoriesSync(story) : [];
      return { story, relatedStories: related };
    })().finally(() => {
      pendingRequests.delete(requestKey);
    });

    pendingRequests.set(requestKey, fetchPromise);
    return fetchPromise;
  }

  private getRelatedStoriesSync(story: Story): Story[] {
    const all = this.getStoredStoriesSync();
    if (story.category) {
      const cat = story.category.toLowerCase().trim();
      const match = all
        .filter((s) => s.id !== story.id && (s.category || '').toLowerCase().trim() === cat)
        .slice(0, 3);
      if (match.length > 0) return match;
    }
    return all.filter((s) => s.id !== story.id).slice(0, 3);
  }

  /**
   * Atomic story view increment with session deduplication
   */
  public async incrementStoryViews(storyId: string): Promise<boolean> {
    if (!storyId) return false;

    // Session-based deduplication: do not increment multiple times in same browser session
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const sessionKey = `viewed_${storyId}`;
        if (sessionStorage.getItem(sessionKey)) {
          return true; // Already recorded in this user session
        }
        sessionStorage.setItem(sessionKey, '1');
      }
    } catch {
      // Ignore
    }

    // 1. Try server backend endpoint first (0 Firestore reads/writes)
    try {
      const res = await fetch(`/api/public/stories/${encodeURIComponent(storyId)}/view`, {
        method: 'POST',
      });
      if (res.ok) {
        const item = storyEntityCache.get(storyId);
        if (item) item.story.views = (item.story.views || 0) + 1;
        return true;
      }
    } catch {
      // Fall through
    }

    // 2. Direct Firestore update if within quota
    if (Date.now() > firestoreQuotaExceededUntil) {
      try {
        const storyRef = doc(db, 'stories', storyId);
        await updateDoc(storyRef, { views: increment(1) });
        return true;
      } catch (err: any) {
        if (isQuotaError(err)) {
          firestoreQuotaExceededUntil = Date.now() + 60 * 60 * 1000;
        }
        return false;
      }
    }

    return false;
  }

  /**
   * Fetch featured stories with 15-minute caching & deduplication
   */
  public async getFeaturedStories(limitVal = 3): Promise<Story[]> {
    const now = Date.now();
    if (featuredCache && now - featuredCache.timestamp < FEATURED_CACHE_TTL_MS) {
      return featuredCache.stories.slice(0, limitVal);
    }

    const requestKey = `featured_${limitVal}`;
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey)!;
    }

    const fetchPromise = (async (): Promise<Story[]> => {
      // 1. Extract from already cached stories if available
      const cachedAll = this.getStoredStoriesSync();
      const cachedFeatured = cachedAll.filter((s) => s.featured);
      if (cachedFeatured.length >= limitVal) {
        featuredCache = { stories: cachedFeatured, timestamp: Date.now() };
        return cachedFeatured.slice(0, limitVal);
      }

      // 2. Firestore query with strict limit(limitVal)
      if (Date.now() > firestoreQuotaExceededUntil) {
        try {
          const storiesRef = collection(db, 'stories');
          const q = query(
            storiesRef,
            where('published', '==', true),
            where('featured', '==', true),
            limit(limitVal)
          );
          const snapshot = await getDocs(q);
          const featured: Story[] = [];
          snapshot.forEach((docSnap) => {
            const story = normalizeStoryDoc(docSnap.id, docSnap.data());
            featured.push(story);
            storyEntityCache.set(story.id, { story, timestamp: Date.now() });
            if (story.slug) storyEntityCache.set(story.slug, { story, timestamp: Date.now() });
          });

          if (featured.length > 0) {
            featuredCache = { stories: featured, timestamp: Date.now() };
            return featured.slice(0, limitVal);
          }
        } catch (err: any) {
          if (isQuotaError(err)) {
            firestoreQuotaExceededUntil = Date.now() + 60 * 60 * 1000;
          }
        }
      }

      return this.getInitialFeaturedStories(limitVal);
    })().finally(() => {
      pendingRequests.delete(requestKey);
    });

    pendingRequests.set(requestKey, fetchPromise);
    return fetchPromise;
  }

  /**
   * Fetch categories with 1-hour aggressive caching
   */
  public async getCategories(): Promise<Category[]> {
    const now = Date.now();
    if (categoryCache && now - categoryCache.timestamp < CATEGORIES_CACHE_TTL_MS) {
      return categoryCache.categories;
    }

    const requestKey = 'categories_all';
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey)!;
    }

    const fetchPromise = (async (): Promise<Category[]> => {
      // 1. Try server public API (0 Firestore reads)
      try {
        const res = await fetch('/api/public/categories');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            categoryCache = { categories: data, timestamp: Date.now() };
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(STORAGE_CATEGORIES_CACHE_KEY, JSON.stringify(data));
              }
            } catch {
              // Ignore
            }
            return data;
          }
        }
      } catch {
        // Fall through
      }

      // 2. Query Firestore categories with limit(50)
      if (Date.now() > firestoreQuotaExceededUntil) {
        try {
          const categoriesRef = collection(db, 'categories');
          const q = query(categoriesRef, limit(50));
          const snapshot = await getDocs(q);
          const categories: Category[] = [];

          snapshot.forEach((docSnap) => {
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
              storyCount: Number(data.storyCount || 0),
            });
          });

          if (categories.length > 0) {
            categoryCache = { categories, timestamp: Date.now() };
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(STORAGE_CATEGORIES_CACHE_KEY, JSON.stringify(categories));
              }
            } catch {
              // Ignore
            }
            return categories;
          }
        } catch (err: any) {
          if (isQuotaError(err)) {
            firestoreQuotaExceededUntil = Date.now() + 60 * 60 * 1000;
          }
        }
      }

      return this.getInitialCategories();
    })().finally(() => {
      pendingRequests.delete(requestKey);
    });

    pendingRequests.set(requestKey, fetchPromise);
    return fetchPromise;
  }
}

export const storyService = new StoryService();
