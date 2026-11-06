import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  writeBatch,
  setDoc,
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

function normalizeStoryDoc(id: string, data: Record<string, any>): Story {
  const fullBody = String(data.fullContent || data.content || '').trim();
  const rawDesc = String(data.shortDescription || data.description || data.excerpt || '').trim();
  const cleanDesc =
    rawDesc && rawDesc.length >= 30 && !/slpornhub|wal katha lokaya/i.test(rawDesc)
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
    tags: Array.isArray(data.tags) && data.tags.length > 0
      ? data.tags
      : ['සිංහල වැල කතා', 'වල් කතා', 'වැල කතා'],
    coverImage: data.coverImage || '',
    views: Number(data.views) || 12,
    likes: Number(data.likes) || 0,
    featured: Boolean(data.featured),
    published: data.published !== false,
    uploadDate: data.uploadDate || data.uploadedDate || '2026-05-01T00:00:00.000Z',
    uploadedDate: data.uploadedDate || data.uploadDate || '2026-05-01T00:00:00.000Z',
    updatedDate: data.updatedDate || new Date().toISOString(),
  };
}

export class StoryService {
  private static storiesCache: Story[] | null = null;
  private static categoriesCache: Category[] | null = null;
  private static contentByIdCache = new Map<string, Story>();

  /**
   * Loads all published stories exclusively from Firestore collections
   */
  static async fetchAllLiveStories(forceRefresh = false): Promise<Story[]> {
    if (!forceRefresh && this.storiesCache && this.storiesCache.length > 0) {
      return this.storiesCache;
    }

    const mergedById = new Map<string, Story>();

    // 1. Load full story documents from Firestore dedicated content replica
    try {
      const replicaSnap = await getDocs(collection(contentDb, 'stories'));
      replicaSnap.forEach((docSnap) => {
        const story = normalizeStoryDoc(docSnap.id, docSnap.data());
        if (story.published !== false) {
          mergedById.set(story.id, story);
          if (story.fullContent && story.fullContent.length > 50) {
            this.contentByIdCache.set(story.id.toLowerCase(), story);
            this.contentByIdCache.set(story.slug.toLowerCase(), story);
          }
        }
      });
    } catch (err) {
      console.warn('Firestore content replica query notice:', err);
    }

    // 2. Load and merge live stories from primary Firestore (walkathawa-93f80)
    try {
      const primarySnap = await getDocs(collection(db, 'stories'));
      primarySnap.forEach((docSnap) => {
        const incoming = normalizeStoryDoc(docSnap.id, docSnap.data());
        if (incoming.published === false) return;

        const existing = mergedById.get(incoming.id);
        if (existing) {
          const fullBody =
            incoming.fullContent && incoming.fullContent.length > 50
              ? incoming.fullContent
              : existing.fullContent || '';
          const merged: Story = {
            ...existing,
            ...incoming,
            fullContent: fullBody,
            content: fullBody,
            shortDescription:
              existing.shortDescription && existing.shortDescription.length >= 40
                ? existing.shortDescription
                : incoming.shortDescription,
            description:
              existing.description && existing.description.length >= 40
                ? existing.description
                : incoming.description,
            wordCount: existing.wordCount || incoming.wordCount || 0,
            readingTime: existing.readingTime || incoming.readingTime || 5,
            views: Math.max(incoming.views || 0, existing.views || 0),
          };
          mergedById.set(incoming.id, merged);
          if (fullBody.length > 50) {
            this.contentByIdCache.set(merged.id.toLowerCase(), merged);
            this.contentByIdCache.set(merged.slug.toLowerCase(), merged);
          }
        } else {
          mergedById.set(incoming.id, incoming);
          if (incoming.fullContent && incoming.fullContent.length > 50) {
            this.contentByIdCache.set(incoming.id.toLowerCase(), incoming);
            this.contentByIdCache.set(incoming.slug.toLowerCase(), incoming);
          }
        }
      });
    } catch (err) {
      console.warn('Primary Firestore stories query notice:', err);
    }

    const list = Array.from(mergedById.values()).sort(
      (a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime()
    );

    this.storiesCache = list;
    return list;
  }

  /**
   * Loads categories exclusively from Firestore 'categories' collection
   */
  static async getCategories(): Promise<Category[]> {
    if (this.categoriesCache && this.categoriesCache.length > 0) {
      return this.categoriesCache;
    }

    const catMap = new Map<string, Category>();
    for (const def of DEFAULT_CATEGORIES) {
      catMap.set(def.slug || def.id, { ...def });
    }

    try {
      const snap = await getDocs(collection(contentDb, 'categories'));
      snap.forEach((d) => {
        const data = d.data();
        const key = String(data.slug || d.id).trim();
        catMap.set(key, {
          id: d.id,
          slug: key,
          name: data.name || key,
          sinhalaName: data.sinhalaName || data.name || key,
          description: data.description || '',
          storyCount: Number(data.storyCount) || 0,
        });
      });
    } catch {
      // Fallback to primary db categories
    }

    try {
      const primarySnap = await getDocs(collection(db, 'categories'));
      primarySnap.forEach((d) => {
        const data = d.data();
        const key = String(data.slug || d.id).trim();
        const prev = catMap.get(key);
        catMap.set(key, {
          id: d.id,
          slug: key,
          name: prev?.name || data.name || key,
          sinhalaName: prev?.sinhalaName || data.sinhalaName || data.name || key,
          description: prev?.description || data.description || '',
          storyCount: Math.max(Number(prev?.storyCount) || 0, Number(data.storyCount) || 0),
        });
      });
    } catch {
      // Ignore
    }

    this.categoriesCache = Array.from(catMap.values());
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
      const lowerCat = category.toLowerCase();
      filtered = filtered.filter((s) => {
        const sCat = (s.category || '').toLowerCase();
        const sCatId = (s.categoryId || '').toLowerCase();
        const sTags = (s.tags || []).map((t) => t.toLowerCase());
        return sCat === lowerCat || sCatId === lowerCat || sTags.includes(lowerCat);
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
   * Fetches full story content directly from Firestore ('stories' and 'posts' collections)
   */
  static async getStoryBySlug(slug: string): Promise<Story | null> {
    if (!slug) return null;
    const decodedSlug = decodeURIComponent(slug).trim().toLowerCase();

    const cached = this.contentByIdCache.get(decodedSlug);
    if (cached && cached.fullContent && cached.fullContent.length > 50) {
      return cached;
    }

    const all = await this.fetchAllLiveStories();
    const found = all.find(
      (s) =>
        s.slug.toLowerCase() === decodedSlug ||
        s.id.toLowerCase() === decodedSlug ||
        decodeURIComponent(s.slug).toLowerCase() === decodedSlug
    );

    if (found && found.fullContent && found.fullContent.length > 50) {
      return found;
    }

    const targetId = found?.id || decodedSlug;

    // Query Firestore dedicated 'posts' and 'stories' collections directly
    for (const firestoreInstance of [db, contentDb]) {
      for (const colName of ['posts', 'stories']) {
        try {
          const directSnap = await getDoc(doc(firestoreInstance, colName, targetId));
          if (directSnap.exists()) {
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
            const normalized = normalizeStoryDoc(d.id, d.data());
            if (normalized.fullContent && normalized.fullContent.length > 50) {
              const merged = found ? { ...found, ...normalized } : normalized;
              this.contentByIdCache.set(decodedSlug, merged);
              return merged;
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
    const categories = await this.getCategories();

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
