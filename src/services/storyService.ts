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

function isDocDeleted(data: Record<string, any> | undefined): boolean {
  if (!data) return false;
  return Boolean(data.isDeleted === true || data.deleted === true || data.published === false);
}

function normalizeStoryDoc(id: string, data: Record<string, any>): Story {
  const fullBody = String(data.fullContent || data.content || '').trim();
  const rawDesc = String(data.shortDescription || data.description || data.excerpt || '').trim();
  const cleanDesc =
    rawDesc && rawDesc.length >= 20 && !/slpornhub|wal katha lokaya/i.test(rawDesc)
      ? rawDesc.slice(0, 158)
      : fullBody
      ? `${fullBody.replace(/\s+/g, ' ').slice(0, 152)}...`
      : `${data.title || 'සිංහල කතාව'} - සිංහල වැල කතා සහ වල් කතා එකතුවෙන් කියවන්න.`;

  const words = data.wordCount || (fullBody ? fullBody.split(/\s+/).length : 0);
  const readingTime = Number(data.readingTime) || Math.max(3, Math.ceil(words / 180));

  return {
    id: data.id || id,
    title: String(data.title || 'සිංහල කතාව').trim(),
    slug: String(data.slug || id).trim(),
    shortDescription: cleanDesc,
    description: cleanDesc,
    fullContent: fullBody,
    content: fullBody,
    wordCount: words,
    readingTime,
    category: String(data.category || 'romantic').trim(),
    categoryId: String(data.categoryId || data.category || 'romantic').trim(),
    categoryName: String(data.categoryName || 'සිංහල කතා').trim(),
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
  };
}

export class StoryService {
  private static storiesCache: Story[] | null = null;
  private static categoriesCache: Category[] | null = null;
  private static contentByIdCache = new Map<string, Story>();

  static clearCache(): void {
    this.storiesCache = null;
    this.categoriesCache = null;
    this.contentByIdCache.clear();
  }

  private static triggerSitemapRegeneration(): void {
    if (typeof window !== 'undefined') {
      fetch('/api/regenerate-sitemap', { method: 'POST' }).catch(() => {});
    }
  }

  /**
   * Loads all published stories with complete fullContent from Firestore & server Firestore sync cache
   */
  static async fetchAllLiveStories(forceRefresh = false): Promise<Story[]> {
    if (!forceRefresh && this.storiesCache && this.storiesCache.length > 0) {
      return this.storiesCache;
    }

    const mergedById = new Map<string, Story>();
    const deletedIds = new Set<string>();
    const deletedSlugs = new Set<string>();

    // 1. Load complete 614-story Firestore sync cache from backend first (fast, 0 quota cost, 100% fullContent)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/firestore/stories');
        if (res.ok) {
          const payload = await res.json();
          const serverStories: any[] = Array.isArray(payload.stories) ? payload.stories : [];
          for (const raw of serverStories) {
            if (isDocDeleted(raw)) continue;
            const story = normalizeStoryDoc(raw.id || raw.slug, raw);
            mergedById.set(story.id, story);
            if (story.fullContent && story.fullContent.length > 50) {
              this.contentByIdCache.set(story.id.toLowerCase(), story);
              this.contentByIdCache.set(story.slug.toLowerCase(), story);
            }
          }
        }
      } catch {
        // Fallback to direct Firestore below
      }
    }

    // 2. If server sync cache was empty or forceRefresh, also check Firestore collections directly
    if (mergedById.size === 0) {
      for (const firestoreInstance of [contentDb, db]) {
        try {
          const snap = await getDocs(collection(firestoreInstance, 'stories'));
          snap.forEach((docSnap) => {
            const raw = docSnap.data();
            const docId = String(raw.id || docSnap.id).trim();
            const docSlug = String(raw.slug || docId).trim();

            if (isDocDeleted(raw)) {
              deletedIds.add(docId.toLowerCase());
              deletedIds.add(docSnap.id.toLowerCase());
              deletedSlugs.add(docSlug.toLowerCase());
              mergedById.delete(docId);
              return;
            }

            const incoming = normalizeStoryDoc(docSnap.id, raw);
            if (
              deletedIds.has(incoming.id.toLowerCase()) ||
              deletedSlugs.has(incoming.slug.toLowerCase())
            ) {
              return;
            }

            const existing = mergedById.get(incoming.id);
            if (existing) {
              const bestBody =
                (incoming.fullContent || '').length >= (existing.fullContent || '').length
                  ? incoming.fullContent || ''
                  : existing.fullContent || '';
              const merged: Story = {
                ...existing,
                ...incoming,
                fullContent: bestBody,
                content: bestBody,
              };
              mergedById.set(incoming.id, merged);
              this.contentByIdCache.set(merged.id.toLowerCase(), merged);
              this.contentByIdCache.set(merged.slug.toLowerCase(), merged);
            } else {
              mergedById.set(incoming.id, incoming);
              if (incoming.fullContent && incoming.fullContent.length > 50) {
                this.contentByIdCache.set(incoming.id.toLowerCase(), incoming);
                this.contentByIdCache.set(incoming.slug.toLowerCase(), incoming);
              }
            }
          });
        } catch {
          // continue
        }
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
   * Loads categories from Firestore & server Firestore sync cache
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
      try {
        const res = await fetch('/api/firestore/stories');
        if (res.ok) {
          const payload = await res.json();
          const serverCats: any[] = Array.isArray(payload.categories) ? payload.categories : [];
          if (serverCats.length > 0) {
            catMap.clear();
            for (const c of serverCats) {
              if (isDocDeleted(c)) continue;
              const key = String(c.slug || c.id).trim();
              if (!key || key === 'all') continue;
              catMap.set(key, {
                id: c.id || key,
                slug: key,
                name: c.name || key,
                sinhalaName: c.sinhalaName || c.name || key,
                description: c.description || '',
                storyCount: Number(c.storyCount) || 0,
              });
            }
            this.categoriesCache = Array.from(catMap.values());
            return this.categoriesCache;
          }
        }
      } catch {
        // Fallback to direct Firestore below
      }
    }

    for (const firestoreInstance of [db, contentDb]) {
      try {
        const snap = await getDocs(collection(firestoreInstance, 'categories'));
        snap.forEach((d) => {
          const data = d.data();
          const key = String(data.slug || d.id).trim();
          if (!key || key === 'all') return;
          if (isDocDeleted(data)) {
            deletedKeys.add(key.toLowerCase());
            deletedKeys.add(d.id.toLowerCase());
            catMap.delete(key);
            catMap.delete(d.id);
            return;
          }
          if (deletedKeys.has(key.toLowerCase()) || deletedKeys.has(d.id.toLowerCase())) {
            return;
          }
          const prev = catMap.get(key);
          catMap.set(key, {
            id: d.id,
            slug: key,
            name: data.name || prev?.name || key,
            sinhalaName: data.sinhalaName || data.name || prev?.sinhalaName || key,
            description: data.description || prev?.description || '',
            storyCount: Math.max(Number(prev?.storyCount) || 0, Number(data.storyCount) || 0),
          });
        });
      } catch {
        // Ignore individual replica error
      }
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
      const lowerCat = decodeURIComponent(category).trim().toLowerCase();
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
      const q = search.trim().toLowerCase();
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
   * Fetches full story content from server Firestore sync cache & Firestore
   */
  static async getStoryBySlug(slug: string): Promise<Story | null> {
    if (!slug) return null;
    const decodedSlug = decodeURIComponent(slug).trim().toLowerCase();

    const cached = this.contentByIdCache.get(decodedSlug);
    if (cached && cached.fullContent && cached.fullContent.length > 200) {
      return cached;
    }

    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/firestore/story/${encodeURIComponent(decodedSlug)}`);
        if (res.ok) {
          const raw = await res.json();
          const story = normalizeStoryDoc(raw.id || decodedSlug, raw);
          if (story.fullContent && story.fullContent.length > 50) {
            this.contentByIdCache.set(decodedSlug, story);
            this.contentByIdCache.set(story.id.toLowerCase(), story);
            return story;
          }
        }
      } catch {
        // Fallback below
      }
    }

    const all = await this.fetchAllLiveStories();
    const found = all.find(
      (s) =>
        s.slug.toLowerCase() === decodedSlug ||
        s.id.toLowerCase() === decodedSlug ||
        decodeURIComponent(s.slug).toLowerCase() === decodedSlug
    );

    if (found && found.fullContent && found.fullContent.length > 200) {
      return found;
    }

    const targetId = found?.id || decodedSlug;

    for (const firestoreInstance of [contentDb, db]) {
      for (const colName of ['stories', 'posts']) {
        try {
          const directSnap = await getDoc(doc(firestoreInstance, colName, targetId));
          if (directSnap.exists() && !isDocDeleted(directSnap.data())) {
            const normalized = normalizeStoryDoc(directSnap.id, directSnap.data());
            if (normalized.fullContent && normalized.fullContent.length > 50) {
              const merged = found ? { ...found, ...normalized } : normalized;
              this.contentByIdCache.set(decodedSlug, merged);
              return merged;
            }
          }

          const q = query(
            collection(firestoreInstance, colName),
            where('slug', '==', found?.slug || slug)
          );
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            const d = qSnap.docs[0];
            if (!isDocDeleted(d.data())) {
              const normalized = normalizeStoryDoc(d.id, d.data());
              if (normalized.fullContent && normalized.fullContent.length > 50) {
                const merged = found ? { ...found, ...normalized } : normalized;
                this.contentByIdCache.set(decodedSlug, merged);
                return merged;
              }
            }
          }
        } catch {
          // Continue to next Firestore collection
        }
      }
    }

    return found || null;
  }

  /**
   * Create a new story in Firestore and server sync store
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
    const cleanTitle = input.title.trim();
    const cleanContent = input.fullContent.trim();
    const generatedSlug =
      (input.slug || cleanTitle)
        .trim()
        .toLowerCase()
        .replace(/[^\w\s\u0D80-\u0DFF-]/g, '')
        .replace(/\s+/g, '-') || `story-${Date.now()}`;

    const storyId = `story_${Date.now()}`;
    const words = cleanContent ? cleanContent.split(/\s+/).length : 0;
    const desc =
      input.shortDescription && input.shortDescription.trim().length > 0
        ? input.shortDescription.trim().slice(0, 158)
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
      readingTime: Math.max(3, Math.ceil(words / 180)),
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

    if (typeof window !== 'undefined') {
      await fetch('/api/firestore/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStory),
      }).catch(() => {});
    }

    for (const instance of [contentDb, db]) {
      try {
        await setDoc(doc(instance, 'stories', storyId), newStory, { merge: true });
      } catch {
        // continue
      }
    }

    if (this.storiesCache) {
      this.storiesCache = [newStory, ...this.storiesCache.filter((s) => s.id !== storyId)];
    }
    this.contentByIdCache.set(storyId.toLowerCase(), newStory);
    this.contentByIdCache.set(generatedSlug.toLowerCase(), newStory);

    return newStory;
  }

  /**
   * Update an existing story in Firestore and server sync store
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
    const cleanTitle = updates.title.trim();
    const cleanContent = updates.fullContent.trim();
    const cleanSlug = (updates.slug || existingStory.slug || storyId).trim();
    const words = cleanContent ? cleanContent.split(/\s+/).length : existingStory.wordCount || 0;
    const desc =
      updates.shortDescription && updates.shortDescription.trim().length > 0
        ? updates.shortDescription.trim().slice(0, 158)
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
      readingTime: Math.max(3, Math.ceil(words / 180)),
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

    if (typeof window !== 'undefined') {
      await fetch('/api/firestore/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStory),
      }).catch(() => {});
    }

    for (const instance of [contentDb, db]) {
      try {
        await setDoc(doc(instance, 'stories', storyId), updatedStory, { merge: true });
      } catch {
        // continue
      }
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
   * Delete an existing story from Firestore and server sync store
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

    if (typeof window !== 'undefined') {
      await fetch(`/api/firestore/story/${encodeURIComponent(storyId)}`, {
        method: 'DELETE',
      }).catch(() => {});
    }

    for (const instance of [contentDb, db]) {
      try {
        await setDoc(doc(instance, 'stories', storyId), tombstone, { merge: true });
      } catch {
        // ignore
      }
    }
    try {
      await deleteDoc(doc(db, 'stories', storyId));
    } catch {
      // ignore
    }

    if (this.storiesCache) {
      this.storiesCache = this.storiesCache.filter(
        (s) => s.id !== storyId && s.slug !== story.slug
      );
    }
    this.contentByIdCache.delete(storyId.toLowerCase());
    this.contentByIdCache.delete((story.slug || '').toLowerCase());
  }

  /**
   * Add a new category to Firestore and server sync store
   */
  static async addCategory(input: {
    name: string;
    sinhalaName?: string;
    slug?: string;
    description?: string;
  }): Promise<Category[]> {
    const cleanName = input.name.trim();
    const cleanSinhala = (input.sinhalaName || cleanName).trim();
    const cleanSlug =
      (input.slug || cleanName)
        .trim()
        .toLowerCase()
        .replace(/[^\w\s\u0D80-\u0DFF-]/g, '')
        .replace(/\s+/g, '-') || `cat-${Date.now()}`;

    const catDoc = {
      id: cleanSlug,
      slug: cleanSlug,
      name: cleanName,
      sinhalaName: cleanSinhala,
      description:
        (input.description || '').trim() ||
        `${cleanSinhala} - සිංහල වැල කතා සහ වල් කතා එකතුව.`,
      storyCount: 0,
      isDeleted: false,
      deleted: false,
    };

    if (typeof window !== 'undefined') {
      await fetch('/api/firestore/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catDoc),
      }).catch(() => {});
    }

    for (const instance of [contentDb, db]) {
      try {
        await setDoc(doc(instance, 'categories', cleanSlug), catDoc, { merge: true });
      } catch {
        // ignore
      }
    }

    this.categoriesCache = null;
    return this.getCategories(true);
  }

  /**
   * Delete a category from Firestore and server sync store
   */
  static async deleteCategory(category: Category): Promise<Category[]> {
    const keysToDelete = Array.from(
      new Set([category.id, category.slug].filter(Boolean) as string[])
    );

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
        try {
          await setDoc(doc(instance, 'categories', key), tombstone, { merge: true });
        } catch {
          // ignore
        }
      }
      try {
        await deleteDoc(doc(db, 'categories', key));
      } catch {
        // ignore
      }
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
        score += 15; // Same multi-part series
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
   * when an authorized admin triggers sync or creates a story.
   */
  static async syncAllToPrimaryFirestore(
    onProgress?: (synced: number, total: number) => void
  ): Promise<{ total: number }> {
    const all = await this.fetchAllLiveStories(true);
    const categories = await this.getCategories(true);

    for (const cat of categories) {
      await setDoc(doc(db, 'categories', cat.id || cat.slug || 'romantic'), cat, { merge: true });
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
      await batch.commit();
      synced += chunk.length;
      if (onProgress) onProgress(synced, all.length);
    }

    return { total: all.length };
  }
}
