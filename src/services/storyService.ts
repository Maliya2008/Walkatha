import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  writeBatch,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, contentDb } from '../firebase';
import { Story, Category, StoryQueryParams, PagedResult } from '../types/story';

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'wife',
    slug: 'wife',
    name: 'වයිෆ් / බිරිඳ (Wife Stories)',
    sinhalaName: 'වයිෆ් / බිරිඳ කතා',
    description: 'බිරිඳ, පවුලේ ජීවිතය සහ විවාහක අත්දැකීම් ඇසුරින් ලියැවුණු සිංහල වැල කතා එකතුව.',
  },
  {
    id: 'akka-malli',
    slug: 'akka-malli',
    name: 'අක්කා - මල්ලි (Akka Malli)',
    sinhalaName: 'අක්කා - මල්ලි කතා',
    description: 'අක්කා, මල්ලි සහ අසල්වැසි යෞවන සබඳතා ඇසුරින් ලියැවුණු රසවත් සිංහල වල් කතා.',
  },
  {
    id: 'nanda',
    slug: 'nanda',
    name: 'නැන්දා / ඇන්ටි (Aunty Stories)',
    sinhalaName: 'නැන්දා / ඇන්ටි කතා',
    description: 'අම්මා වල් කතා 2026, නැන්දා සහ ඇන්ටි චරිත ඇසුරින් නිර්මාණය වූ සිංහල කතා.',
  },
  {
    id: 'school',
    slug: 'school',
    name: 'පාසල් සහ කැම්පස් (School & Campus)',
    sinhalaName: 'පාසල් සහ කැම්පස් කතා',
    description: 'කැම්පස්, පාසල් සහ යෞවන ආදර අත්දැකීම් ඇසුරින් ලියැවුණු අලුත්ම සිංහල වැල කතා.',
  },
  {
    id: 'romantic',
    slug: 'romantic',
    name: 'ආදර කතා (Romantic Stories)',
    sinhalaName: 'ආදර සහ රස කතා',
    description: 'ආදරණීය හා හැඟීම්බර සිංහල වල් කතා සහ කෙටි කතා එකතුව.',
  },
];

const ADMIN_DELTA_KEY = 'walkathawa_admin_delta_v1';

interface AdminDeltaStore {
  upsertedStories: Record<string, Story>;
  deletedStoryKeys: string[];
  upsertedCategories: Record<string, Category>;
  deletedCategoryKeys: string[];
}

function readLocalDelta(): AdminDeltaStore {
  if (typeof window === 'undefined') {
    return {
      upsertedStories: {},
      deletedStoryKeys: [],
      upsertedCategories: {},
      deletedCategoryKeys: [],
    };
  }
  try {
    const raw = localStorage.getItem(ADMIN_DELTA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        upsertedStories: parsed.upsertedStories || {},
        deletedStoryKeys: Array.isArray(parsed.deletedStoryKeys) ? parsed.deletedStoryKeys : [],
        upsertedCategories: parsed.upsertedCategories || {},
        deletedCategoryKeys: Array.isArray(parsed.deletedCategoryKeys)
          ? parsed.deletedCategoryKeys
          : [],
      };
    }
  } catch {
    // ignore
  }
  return {
    upsertedStories: {},
    deletedStoryKeys: [],
    upsertedCategories: {},
    deletedCategoryKeys: [],
  };
}

function writeLocalDelta(delta: AdminDeltaStore): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_DELTA_KEY, JSON.stringify(delta));
  } catch {
    // ignore
  }
}

function stripZeroWidth(val: unknown): string {
  return String(val || '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
}

function isDocDeleted(data: Record<string, any> | undefined): boolean {
  if (!data) return false;
  return Boolean(data.isDeleted === true || data.deleted === true || data.published === false);
}

function normalizeStoryDoc(id: string, data: Record<string, any>): Story & { chunkIndex?: number } {
  const fullBody = stripZeroWidth(data.fullContent || data.content || '');
  const rawDesc = stripZeroWidth(data.shortDescription || data.description || data.excerpt || '');
  const cleanTitle = stripZeroWidth(data.title || 'සිංහල කතාව');
  const cleanId = stripZeroWidth(data.id || id);
  const cleanSlug = stripZeroWidth(data.slug || cleanId);

  const cleanDesc =
    rawDesc && rawDesc.length >= 20 && !/slpornhub|wal katha lokaya|view fullscreen/i.test(rawDesc)
      ? rawDesc.slice(0, 158)
      : fullBody
      ? `${fullBody.replace(/\s+/g, ' ').slice(0, 152)}...`
      : `${cleanTitle} - සිංහල වැල කතා සහ වල් කතා එකතුවෙන් කියවන්න.`;

  const words = Number(data.wordCount) || (fullBody ? fullBody.split(/\s+/).length : 0);
  const readingTime = Number(data.readingTime) || Math.max(4, Math.ceil(words / 180));

  return {
    id: cleanId,
    title: cleanTitle,
    slug: cleanSlug,
    shortDescription: cleanDesc,
    description: cleanDesc,
    fullContent: fullBody,
    content: fullBody,
    wordCount: words,
    readingTime,
    category: stripZeroWidth(data.category || 'romantic') || 'romantic',
    categoryId: stripZeroWidth(data.categoryId || data.category || 'romantic') || 'romantic',
    categoryName: stripZeroWidth(data.categoryName || 'සිංහල කතා') || 'සිංහල කතා',
    tags:
      Array.isArray(data.tags) && data.tags.length > 0
        ? data.tags
        : ['සිංහල වැල කතා', 'වල් කතා', 'වැල කතා'],
    coverImage: data.coverImage || '',
    views: Number(data.views) || 12,
    likes: Number(data.likes) || 0,
    featured: Boolean(data.featured),
    published: !isDocDeleted(data),
    uploadDate: data.uploadDate || data.uploadedDate || '2026-05-01T00:00:00.000Z',
    uploadedDate: data.uploadedDate || data.uploadDate || '2026-05-01T00:00:00.000Z',
    updatedDate: data.updatedDate || new Date().toISOString(),
    chunkIndex: typeof data.chunkIndex === 'number' ? data.chunkIndex : undefined,
  };
}

async function fetchJsonSafe(url: string): Promise<any | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('text/html')) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function withTimeout<T>(promise: Promise<T>, ms = 3000): Promise<T | null> {
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
    ]);
  } catch {
    return null;
  }
}

export class StoryService {
  private static storiesCache: (Story & { chunkIndex?: number })[] | null = null;
  private static categoriesCache: Category[] | null = null;
  private static contentByIdCache = new Map<string, Story>();
  private static loadedChunks = new Set<number>();

  static clearCache(): void {
    this.storiesCache = null;
    this.categoriesCache = null;
    this.contentByIdCache.clear();
    this.loadedChunks.clear();
  }

  /**
   * Loads all published stories rapidly from Express API or Cloudflare Pages static catalog.json,
   * without triggering slow 614-document Firestore WebChannel scans.
   */
  static async fetchAllLiveStories(forceRefresh = false): Promise<Story[]> {
    if (!forceRefresh && this.storiesCache && this.storiesCache.length > 0) {
      return this.storiesCache;
    }

    const mergedById = new Map<string, Story & { chunkIndex?: number }>();
    const deletedIds = new Set<string>();
    const deletedSlugs = new Set<string>();

    // 1. Load from Express API (/api/firestore/stories) or Cloudflare Pages static catalog (/api-data/catalog.json)
    if (typeof window !== 'undefined') {
      let payload = await fetchJsonSafe('/api/firestore/stories');
      if (!payload || !Array.isArray(payload.stories) || payload.stories.length === 0) {
        payload = await fetchJsonSafe('/api-data/catalog.json');
      }

      if (payload && Array.isArray(payload.stories)) {
        for (const raw of payload.stories) {
          if (isDocDeleted(raw)) {
            const delId = stripZeroWidth(raw.id || raw.slug).toLowerCase();
            const delSlug = stripZeroWidth(raw.slug || raw.id).toLowerCase();
            deletedIds.add(delId);
            deletedSlugs.add(delSlug);
            continue;
          }
          const story = normalizeStoryDoc(raw.id || raw.slug, raw);
          mergedById.set(story.id, story);
          if (story.fullContent && story.fullContent.length > 500) {
            this.contentByIdCache.set(story.id.toLowerCase(), story);
            this.contentByIdCache.set(story.slug.toLowerCase(), story);
          }
        }
      }
    }

    // 2. Only scan Firestore directly if static/server catalog wasn't available
    if (mergedById.size === 0) {
      for (const firestoreInstance of [contentDb, db]) {
        const snap = await withTimeout(getDocs(collection(firestoreInstance, 'stories')), 4000);
        if (!snap) continue;
        snap.forEach((docSnap) => {
          const raw = docSnap.data();
          const docId = stripZeroWidth(raw.id || docSnap.id);
          const docSlug = stripZeroWidth(raw.slug || docId);

          if (isDocDeleted(raw)) {
            deletedIds.add(docId.toLowerCase());
            deletedSlugs.add(docSlug.toLowerCase());
            mergedById.delete(docId);
            return;
          }

          const incoming = normalizeStoryDoc(docSnap.id, raw);
          mergedById.set(incoming.id, incoming);
          if (incoming.fullContent && incoming.fullContent.length > 500) {
            this.contentByIdCache.set(incoming.id.toLowerCase(), incoming);
            this.contentByIdCache.set(incoming.slug.toLowerCase(), incoming);
          }
        });
      }
    }

    // 3. Apply any Admin Panel delta changes saved locally
    const delta = readLocalDelta();
    for (const delKey of delta.deletedStoryKeys) {
      const k = delKey.toLowerCase();
      deletedIds.add(k);
      deletedSlugs.add(k);
    }
    for (const upserted of Object.values(delta.upsertedStories)) {
      const norm = normalizeStoryDoc(upserted.id, upserted);
      mergedById.set(norm.id, norm);
      if (norm.fullContent && norm.fullContent.length > 50) {
        this.contentByIdCache.set(norm.id.toLowerCase(), norm);
        this.contentByIdCache.set(norm.slug.toLowerCase(), norm);
      }
    }

    const list = Array.from(mergedById.values())
      .filter(
        (s) =>
          !deletedIds.has(s.id.toLowerCase()) && !deletedSlugs.has(s.slug.toLowerCase())
      )
      .sort(
        (a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime()
      );

    this.storiesCache = list;
    return list;
  }

  /**
   * Loads categories from Express or Cloudflare Pages static catalog.json
   */
  static async getCategories(forceRefresh = false): Promise<Category[]> {
    if (!forceRefresh && this.categoriesCache && this.categoriesCache.length > 0) {
      return this.categoriesCache;
    }

    const catMap = new Map<string, Category>();
    const deletedKeys = new Set<string>();

    for (const def of DEFAULT_CATEGORIES) {
      catMap.set(def.slug || def.id, { ...def });
    }

    if (typeof window !== 'undefined') {
      let payload = await fetchJsonSafe('/api/firestore/stories');
      if (!payload || !Array.isArray(payload.categories)) {
        payload = await fetchJsonSafe('/api-data/catalog.json');
      }
      if (payload && Array.isArray(payload.categories) && payload.categories.length > 0) {
        catMap.clear();
        for (const c of payload.categories) {
          if (isDocDeleted(c)) continue;
          const key = stripZeroWidth(c.slug || c.id);
          if (!key || key === 'all') continue;
          catMap.set(key, {
            id: stripZeroWidth(c.id || key),
            slug: key,
            name: stripZeroWidth(c.name || key),
            sinhalaName: stripZeroWidth(c.sinhalaName || c.name || key),
            description: stripZeroWidth(c.description || ''),
            storyCount: Number(c.storyCount) || 0,
          });
        }
      }
    }

    const delta = readLocalDelta();
    for (const delKey of delta.deletedCategoryKeys) {
      deletedKeys.add(delKey.toLowerCase());
      catMap.delete(delKey);
    }
    for (const [k, cat] of Object.entries(delta.upsertedCategories)) {
      catMap.set(k, cat);
    }

    this.categoriesCache = Array.from(catMap.values()).filter(
      (c) =>
        !deletedKeys.has((c.slug || '').toLowerCase()) &&
        !deletedKeys.has((c.id || '').toLowerCase())
    );
    return this.categoriesCache;
  }

  /**
   * Query stories with filtering, search, sorting, and pagination
   */
  static async getStories(params: StoryQueryParams = {}): Promise<PagedResult<Story>> {
    const {
      category = 'all',
      search = '',
      sortBy = 'latest',
      page = 1,
      limit = 30,
    } = params;

    const all = await this.fetchAllLiveStories();
    let filtered = [...all];

    if (category && category !== 'all') {
      const lowerCat = stripZeroWidth(decodeURIComponent(category)).toLowerCase();
      filtered = filtered.filter((s) => {
        const sCat = (s.category || '').toLowerCase();
        const sCatId = (s.categoryId || '').toLowerCase();
        const sCatName = (s.categoryName || '').toLowerCase();
        const sTags = (s.tags || []).map((t) => t.toLowerCase());
        return (
          sCat === lowerCat ||
          sCatId === lowerCat ||
          sCatName.includes(lowerCat) ||
          sTags.includes(lowerCat)
        );
      });
    }

    if (search.trim()) {
      const q = stripZeroWidth(search).toLowerCase();
      filtered = filtered.filter((s) => {
        const inTitle = (s.title || '').toLowerCase().includes(q);
        const inDesc = (s.shortDescription || s.description || '').toLowerCase().includes(q);
        const inTags = (s.tags || []).some((t) => t.toLowerCase().includes(q));
        return inTitle || inDesc || inTags;
      });
    }

    if (sortBy === 'popular') {
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortBy === 'oldest') {
      filtered.sort(
        (a, b) => new Date(a.uploadDate || 0).getTime() - new Date(b.uploadDate || 0).getTime()
      );
    } else {
      filtered.sort(
        (a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime()
      );
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
   * Fetches complete, multi-paragraph story content on both Cloudflare Pages (via 2MB chunks) and Express
   */
  static async getStoryBySlug(slug: string): Promise<Story | null> {
    if (!slug) return null;
    const decodedSlug = stripZeroWidth(decodeURIComponent(slug)).toLowerCase();

    const cached = this.contentByIdCache.get(decodedSlug);
    if (cached && cached.fullContent && cached.fullContent.length > 1500) {
      return cached;
    }

    // 1. Try Express API endpoint first (if running with server.ts)
    if (typeof window !== 'undefined') {
      const raw = await fetchJsonSafe(`/api/firestore/story/${encodeURIComponent(decodedSlug)}`);
      if (raw && (raw.fullContent || raw.content)) {
        const story = normalizeStoryDoc(raw.id || decodedSlug, raw);
        if (story.fullContent && story.fullContent.length > 500) {
          this.contentByIdCache.set(decodedSlug, story);
          this.contentByIdCache.set(story.id.toLowerCase(), story);
          this.contentByIdCache.set(story.slug.toLowerCase(), story);
          return story;
        }
      }
    }

    // 2. Find story metadata + chunkIndex in catalog
    const all = (await this.fetchAllLiveStories()) as (Story & { chunkIndex?: number })[];
    const found = all.find(
      (s) =>
        stripZeroWidth(s.slug).toLowerCase() === decodedSlug ||
        stripZeroWidth(s.id).toLowerCase() === decodedSlug ||
        stripZeroWidth(decodeURIComponent(s.slug)).toLowerCase() === decodedSlug
    );

    if (found && found.fullContent && found.fullContent.length > 1500) {
      this.contentByIdCache.set(decodedSlug, found);
      return found;
    }

    // 3. On Cloudflare Pages: load from static chunk (/api-data/chunks/chunk-N.json)
    if (typeof window !== 'undefined') {
      const chunksToCheck =
        typeof found?.chunkIndex === 'number'
          ? [found.chunkIndex]
          : [0, 1, 2, 3, 4, 5];

      for (const cIdx of chunksToCheck) {
        if (!this.loadedChunks.has(cIdx)) {
          const chunkPayload = await fetchJsonSafe(`/api-data/chunks/chunk-${cIdx}.json`);
          if (chunkPayload && Array.isArray(chunkPayload.stories)) {
            this.loadedChunks.add(cIdx);
            for (const raw of chunkPayload.stories) {
              const norm = normalizeStoryDoc(raw.id || raw.slug, raw);
              if (norm.fullContent && norm.fullContent.length > 500) {
                this.contentByIdCache.set(norm.id.toLowerCase(), norm);
                this.contentByIdCache.set(norm.slug.toLowerCase(), norm);
              }
            }
          }
        }
        const fromChunk =
          this.contentByIdCache.get(decodedSlug) ||
          (found ? this.contentByIdCache.get(found.id.toLowerCase()) : undefined);
        if (fromChunk && fromChunk.fullContent && fromChunk.fullContent.length > 500) {
          return found
            ? {
                ...found,
                ...fromChunk,
                fullContent: fromChunk.fullContent,
                content: fromChunk.fullContent,
              }
            : fromChunk;
        }
      }
    }

    // 4. Fallback to Firestore with a strict 2.5s timeout for newly created admin stories
    const targetId = found?.id || decodedSlug;
    let bestFirestoreStory: Story | null = found || null;

    for (const firestoreInstance of [contentDb, db]) {
      const directSnap = await withTimeout(
        getDoc(doc(firestoreInstance, 'stories', targetId)),
        2500
      );
      if (directSnap && directSnap.exists() && !isDocDeleted(directSnap.data())) {
        const normalized = normalizeStoryDoc(directSnap.id, directSnap.data());
        const prevLen = (bestFirestoreStory?.fullContent || '').length;
        if ((normalized.fullContent || '').length > prevLen) {
          bestFirestoreStory = bestFirestoreStory
            ? {
                ...bestFirestoreStory,
                ...normalized,
                fullContent: normalized.fullContent,
                content: normalized.fullContent,
              }
            : normalized;
        }
      }
    }

    if (bestFirestoreStory && bestFirestoreStory.fullContent) {
      this.contentByIdCache.set(decodedSlug, bestFirestoreStory);
    }

    return bestFirestoreStory;
  }

  /**
   * Create a new story in Firestore, local delta store, and server sync store
   */
  static async createStory(input: {
    title: string;
    slug?: string;
    category: string;
    coverImage?: string;
    shortDescription?: string;
    tags?: string[];
    fullContent: string;
    featured?: boolean;
  }): Promise<Story> {
    const cleanTitle = stripZeroWidth(input.title);
    const cleanContent = stripZeroWidth(input.fullContent);
    const generatedSlug =
      stripZeroWidth(input.slug || cleanTitle)
        .toLowerCase()
        .replace(/[^\w\s\u0D80-\u0DFF-]/g, '')
        .replace(/\s+/g, '-') || `story-${Date.now()}`;

    const storyId = `story_${Date.now()}`;
    const words = cleanContent ? cleanContent.split(/\s+/).length : 0;
    const desc =
      input.shortDescription && input.shortDescription.trim().length > 0
        ? stripZeroWidth(input.shortDescription).slice(0, 158)
        : `${cleanContent.replace(/\s+/g, ' ').slice(0, 150)}...`;

    const tags =
      input.tags && input.tags.length > 0
        ? input.tags
        : ['සිංහල වැල කතා', 'වල් කතා', 'වැල කතා', input.category];

    const now = new Date().toISOString();
    const newStory: Story & { isDeleted?: boolean } = {
      id: storyId,
      title: cleanTitle,
      slug: generatedSlug,
      category: input.category || 'romantic',
      categoryId: input.category || 'romantic',
      shortDescription: desc,
      description: desc,
      fullContent: cleanContent,
      content: cleanContent,
      wordCount: words,
      readingTime: Math.max(4, Math.ceil(words / 180)),
      coverImage: (input.coverImage || '').trim(),
      tags,
      views: 1,
      likes: 0,
      featured: Boolean(input.featured),
      published: true,
      isDeleted: false,
      uploadDate: now,
      uploadedDate: now,
      updatedDate: now,
    };

    const delta = readLocalDelta();
    delta.upsertedStories[storyId] = newStory;
    writeLocalDelta(delta);

    if (typeof window !== 'undefined') {
      await fetch('/api/firestore/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStory),
      }).catch(() => {});
    }

    for (const instance of [contentDb, db]) {
      await withTimeout(setDoc(doc(instance, 'stories', storyId), newStory, { merge: true }), 2500);
    }

    if (this.storiesCache) {
      this.storiesCache = [newStory, ...this.storiesCache.filter((s) => s.id !== storyId)];
    }
    this.contentByIdCache.set(storyId.toLowerCase(), newStory);
    this.contentByIdCache.set(generatedSlug.toLowerCase(), newStory);

    return newStory;
  }

  /**
   * Update an existing story in Firestore, local delta store, and server sync store
   */
  static async updateStory(
    existingStory: Story,
    updates: {
      title: string;
      slug?: string;
      category: string;
      coverImage?: string;
      shortDescription?: string;
      tags?: string[];
      fullContent: string;
      featured?: boolean;
      views?: number;
    }
  ): Promise<Story> {
    const storyId = existingStory.id;
    const cleanTitle = stripZeroWidth(updates.title);
    const cleanContent = stripZeroWidth(updates.fullContent);
    const cleanSlug = stripZeroWidth(updates.slug || existingStory.slug || storyId);
    const words = cleanContent ? cleanContent.split(/\s+/).length : existingStory.wordCount || 0;
    const desc =
      updates.shortDescription && updates.shortDescription.trim().length > 0
        ? stripZeroWidth(updates.shortDescription).slice(0, 158)
        : cleanContent
        ? `${cleanContent.replace(/\s+/g, ' ').slice(0, 150)}...`
        : existingStory.shortDescription || '';

    const updatedStory: Story & { isDeleted?: boolean } = {
      ...existingStory,
      id: storyId,
      title: cleanTitle,
      slug: cleanSlug,
      category: updates.category || existingStory.category || 'romantic',
      categoryId: updates.category || existingStory.categoryId || 'romantic',
      coverImage:
        updates.coverImage !== undefined
          ? updates.coverImage.trim()
          : existingStory.coverImage || '',
      shortDescription: desc,
      description: desc,
      fullContent: cleanContent,
      content: cleanContent,
      wordCount: words,
      readingTime: Math.max(4, Math.ceil(words / 180)),
      tags:
        updates.tags && updates.tags.length > 0
          ? updates.tags
          : existingStory.tags || ['සිංහල වැල කතා', 'වල් කතා'],
      featured:
        updates.featured !== undefined ? Boolean(updates.featured) : Boolean(existingStory.featured),
      views:
        updates.views !== undefined ? Number(updates.views) : Number(existingStory.views || 12),
      published: true,
      isDeleted: false,
      updatedDate: new Date().toISOString(),
    };

    const delta = readLocalDelta();
    delta.upsertedStories[storyId] = updatedStory;
    writeLocalDelta(delta);

    if (typeof window !== 'undefined') {
      await fetch('/api/firestore/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStory),
      }).catch(() => {});
    }

    for (const instance of [contentDb, db]) {
      await withTimeout(
        setDoc(doc(instance, 'stories', storyId), updatedStory, { merge: true }),
        2500
      );
    }

    if (this.storiesCache) {
      this.storiesCache = this.storiesCache.map((s) =>
        s.id === storyId || s.slug === existingStory.slug ? updatedStory : s
      );
    }
    this.contentByIdCache.set(storyId.toLowerCase(), updatedStory);
    this.contentByIdCache.set(cleanSlug.toLowerCase(), updatedStory);

    return updatedStory;
  }

  /**
   * Delete an existing story from Firestore, local delta store, and server sync store
   */
  static async deleteStory(story: Story): Promise<void> {
    const storyId = story.id;
    const tombstone = {
      id: storyId,
      slug: story.slug,
      title: story.title || 'Deleted Story',
      isDeleted: true,
      deleted: true,
      published: false,
      updatedDate: new Date().toISOString(),
    };

    const delta = readLocalDelta();
    delete delta.upsertedStories[storyId];
    if (!delta.deletedStoryKeys.includes(storyId)) {
      delta.deletedStoryKeys.push(storyId);
    }
    if (story.slug && !delta.deletedStoryKeys.includes(story.slug)) {
      delta.deletedStoryKeys.push(story.slug);
    }
    writeLocalDelta(delta);

    if (typeof window !== 'undefined') {
      await fetch(`/api/firestore/story/${encodeURIComponent(storyId)}`, {
        method: 'DELETE',
      }).catch(() => {});
    }

    for (const instance of [contentDb, db]) {
      await withTimeout(setDoc(doc(instance, 'stories', storyId), tombstone, { merge: true }), 2000);
    }
    await withTimeout(deleteDoc(doc(db, 'stories', storyId)), 2000);

    if (this.storiesCache) {
      this.storiesCache = this.storiesCache.filter(
        (s) => s.id !== storyId && s.slug !== story.slug
      );
    }
    this.contentByIdCache.delete(storyId.toLowerCase());
    this.contentByIdCache.delete((story.slug || '').toLowerCase());
  }

  /**
   * Add a new category to Firestore, local delta store, and server sync store
   */
  static async addCategory(input: {
    name: string;
    sinhalaName?: string;
    slug?: string;
    description?: string;
  }): Promise<Category[]> {
    const cleanName = stripZeroWidth(input.name);
    const cleanSinhala = stripZeroWidth(input.sinhalaName || cleanName);
    const cleanSlug =
      stripZeroWidth(input.slug || cleanName)
        .toLowerCase()
        .replace(/[^\w\s\u0D80-\u0DFF-]/g, '')
        .replace(/\s+/g, '-') || `cat-${Date.now()}`;

    const catDoc = {
      id: cleanSlug,
      slug: cleanSlug,
      name: cleanName,
      sinhalaName: cleanSinhala,
      description:
        stripZeroWidth(input.description || '') ||
        `${cleanSinhala} - සිංහල වැල කතා සහ වල් කතා එකතුව.`,
      storyCount: 0,
      isDeleted: false,
      deleted: false,
    };

    const delta = readLocalDelta();
    delta.upsertedCategories[cleanSlug] = catDoc;
    delta.deletedCategoryKeys = delta.deletedCategoryKeys.filter((k) => k !== cleanSlug);
    writeLocalDelta(delta);

    if (typeof window !== 'undefined') {
      await fetch('/api/firestore/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catDoc),
      }).catch(() => {});
    }

    for (const instance of [contentDb, db]) {
      await withTimeout(setDoc(doc(instance, 'categories', cleanSlug), catDoc, { merge: true }), 2000);
    }

    this.categoriesCache = null;
    return this.getCategories(true);
  }

  /**
   * Delete a category from Firestore, local delta store, and server sync store
   */
  static async deleteCategory(category: Category): Promise<Category[]> {
    const keysToDelete = Array.from(
      new Set([category.id, category.slug].filter(Boolean) as string[])
    );

    const delta = readLocalDelta();
    for (const key of keysToDelete) {
      delete delta.upsertedCategories[key];
      if (!delta.deletedCategoryKeys.includes(key)) {
        delta.deletedCategoryKeys.push(key);
      }
    }
    writeLocalDelta(delta);

    for (const key of keysToDelete) {
      if (typeof window !== 'undefined') {
        await fetch(`/api/firestore/category/${encodeURIComponent(key)}`, {
          method: 'DELETE',
        }).catch(() => {});
      }

      const tombstone = {
        id: key,
        slug: category.slug || key,
        name: category.name || key,
        isDeleted: true,
        deleted: true,
      };
      for (const instance of [contentDb, db]) {
        await withTimeout(setDoc(doc(instance, 'categories', key), tombstone, { merge: true }), 2000);
      }
      await withTimeout(deleteDoc(doc(db, 'categories', key)), 2000);
    }

    this.categoriesCache = null;
    return this.getCategories(true);
  }

  /**
   * Internal linking engine: finds top related stories by series prefix, category, and shared tags
   */
  static async getRelatedStories(story: Story, limit = 6): Promise<Story[]> {
    const all = await this.fetchAllLiveStories();
    const currentId = story.id;
    const currentCat = (story.category || '').toLowerCase();
    const currentTags = (story.tags || []).map((t) => t.toLowerCase());
    const baseTitlePrefix = (story.title || '')
      .replace(/[\s–-]+\d+.*$/, '')
      .trim()
      .toLowerCase();

    const candidates = all.filter((s) => s.id !== currentId && s.slug !== story.slug);

    const scored = candidates.map((cand) => {
      let score = 0;
      const candTitle = (cand.title || '').toLowerCase();
      if (baseTitlePrefix.length > 4 && candTitle.startsWith(baseTitlePrefix)) {
        score += 15;
      }
      if ((cand.category || '').toLowerCase() === currentCat) {
        score += 6;
      }
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

  /**
   * Synchronizes all 614+ stories and full content into primary Firestore (walkathawa-93f80)
   */
  static async syncAllToPrimaryFirestore(
    onProgress?: (synced: number, total: number) => void
  ): Promise<{ total: number }> {
    const all = await this.fetchAllLiveStories(true);
    const categories = await this.getCategories(true);

    for (const cat of categories) {
      await withTimeout(
        setDoc(doc(db, 'categories', cat.id || cat.slug || 'romantic'), cat, { merge: true }),
        3000
      );
    }

    const batchSize = 20;
    let synced = 0;
    for (let i = 0; i < all.length; i += batchSize) {
      const chunk = all.slice(i, i + batchSize);
      const batch = writeBatch(db);
      for (const s of chunk) {
        batch.set(doc(db, 'stories', s.id), s, { merge: true });
        batch.set(
          doc(db, 'posts', s.id),
          {
            id: s.id,
            slug: s.slug,
            title: s.title,
            fullContent: s.fullContent || s.content || '',
            content: s.fullContent || s.content || '',
            shortDescription: s.shortDescription || s.description || '',
            wordCount: s.wordCount || 0,
            readingTime: s.readingTime || 5,
            category: s.category,
            tags: s.tags,
            published: true,
            uploadDate: s.uploadDate,
            updatedDate: new Date().toISOString(),
          },
          { merge: true }
        );
      }
      await withTimeout(batch.commit(), 5000);
      synced += chunk.length;
      if (onProgress) onProgress(synced, all.length);
    }

    return { total: all.length };
  }
}
