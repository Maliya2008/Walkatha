import { Category, PaginatedResponse, Story, StoryFilterParams } from '../types/story';
import { INITIAL_CATEGORIES } from '../data/seedStories';
import {
  storyMatchesCategory,
  getStoryCanonicalCategory,
  getCategoryDisplayName,
} from '../utils/categoryTaxonomy';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';

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

export function normalizeFirestoreStory(id: string, data: any): Story {
  let uploadDate = new Date().toISOString();
  if (data.uploadDate) {
    if (typeof data.uploadDate.toDate === 'function') {
      uploadDate = data.uploadDate.toDate().toISOString();
    } else if (typeof data.uploadDate === 'string') {
      uploadDate = data.uploadDate;
    }
  } else if (data.createdAt) {
    if (typeof data.createdAt.toDate === 'function') {
      uploadDate = data.createdAt.toDate().toISOString();
    } else if (typeof data.createdAt === 'string') {
      uploadDate = data.createdAt;
    }
  } else if (data.uploadedDate) {
    if (typeof data.uploadedDate.toDate === 'function') {
      uploadDate = data.uploadedDate.toDate().toISOString();
    } else if (typeof data.uploadedDate === 'string') {
      uploadDate = data.uploadedDate;
    }
  }

  const fullContent = data.fullContent || data.content || data.body || '';
  const shortDescription = data.shortDescription || data.description || data.synopsis || '';
  const slug = data.slug || id;

  return {
    id: id || data.id || slug,
    title: data.title || 'Untitled Story',
    slug,
    coverImage: data.coverImage || data.image || data.thumbnail || '',
    shortDescription,
    description: shortDescription,
    fullContent,
    content: fullContent,
    category: data.category || 'all',
    categoryName: data.categoryName || getCategoryDisplayName(data.category || 'all'),
    categoryId: data.categoryId || data.category,
    tags: Array.isArray(data.tags) ? data.tags : [],
    uploadDate,
    uploadedDate: uploadDate,
    updatedDate: data.updatedDate || uploadDate,
    featured: Boolean(data.featured),
    published: data.published !== false,
    views: Number(data.views || 0),
    readingTime: data.readingTime || Math.max(3, Math.ceil(fullContent.length / 450)),
  };
}

export class StoryService {
  private static memoryStories: Story[] = [];
  private static firestoreLoaded = false;

  /**
   * Fetches all live stories directly from Firestore ('stories' or 'posts' collection)
   */
  public static async fetchAllLiveStories(): Promise<Story[]> {
    const mergedMap = new Map<string, Story>();

    // Fetch live stories directly from Firestore
    try {
      let snapshot = await getDocs(collection(db, 'stories'));
      if (snapshot.empty) {
        snapshot = await getDocs(collection(db, 'posts'));
      }
      if (!snapshot.empty) {
        snapshot.forEach((docSnap) => {
          const fsStory = normalizeFirestoreStory(docSnap.id, docSnap.data());
          const key = (fsStory.slug || fsStory.id || '').trim().toLowerCase();
          if (key) mergedMap.set(key, fsStory);
        });
        this.firestoreLoaded = true;
      }
    } catch (err) {
      console.warn('Firestore fetch notice:', err);
    }

    // 3. Sort latest first
    const merged = Array.from(mergedMap.values());
    merged.sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime());
    this.memoryStories = merged;
    return merged;
  }

  public static async getStories(params: StoryFilterParams = {}): Promise<PaginatedResponse<Story>> {
    const page = Math.max(1, params.page || 1);
    const limit = params.limit || 20; // Default 20 posts per view
    const category = params.category || 'all';
    const search = params.search || '';
    const sortBy = params.sortBy || 'latest';

    const allLive = await this.fetchAllLiveStories();
    let all = allLive.filter((s) => s.published !== false);

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

    // Check memory first if full content is already present
    const cached = this.memoryStories.find(
      (s) => (s.slug || '').toLowerCase() === cleanSlug || (s.id || '').toLowerCase() === cleanSlug
    );
    if (cached && (cached.fullContent || cached.content)) {
      return cached;
    }

    // Direct Firestore queries
    try {
      const docSnap = await getDoc(doc(db, 'stories', cleanSlug));
      if (docSnap.exists()) {
        const story = normalizeFirestoreStory(docSnap.id, docSnap.data());
        if (cached) Object.assign(cached, story);
        return story;
      }

      const q = query(collection(db, 'stories'), where('slug', '==', cleanSlug));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const firstDoc = qSnap.docs[0];
        const story = normalizeFirestoreStory(firstDoc.id, firstDoc.data());
        if (cached) Object.assign(cached, story);
        return story;
      }

      const postSnap = await getDoc(doc(db, 'posts', cleanSlug));
      if (postSnap.exists()) {
        const story = normalizeFirestoreStory(postSnap.id, postSnap.data());
        if (cached) Object.assign(cached, story);
        return story;
      }
    } catch {
      // Fallback
    }

    // Reload catalog and try matching
    const all = await this.fetchAllLiveStories();
    const found = all.find(
      (s) => (s.slug || '').toLowerCase() === cleanSlug || (s.id || '').toLowerCase() === cleanSlug
    );
    if (found) return found;

    return null;
  }

  public static async getRelatedStories(currentStory: Story, limit = 4): Promise<Story[]> {
    if (!currentStory) return [];
    const all = this.memoryStories.length > 0 ? this.memoryStories : await this.fetchAllLiveStories();
    const currentCat = getStoryCanonicalCategory(currentStory);
    const related = all.filter(
      (s) => s.id !== currentStory.id && s.published !== false && storyMatchesCategory(s, currentCat)
    );

    if (related.length >= limit) {
      return related.slice(0, limit);
    }

    const others = all.filter(
      (s) => s.id !== currentStory.id && s.published !== false && !related.some((r) => r.id === s.id)
    );
    return [...related, ...others].slice(0, limit);
  }

  public static async getCategories(): Promise<Category[]> {
    try {
      const catRef = collection(db, 'categories');
      const snap = await getDocs(catRef);
      if (!snap.empty) {
        const cats: Category[] = [];
        snap.forEach((d) => {
          const data = d.data();
          cats.push({
            id: d.id,
            name: data.name || d.id,
            slug: data.slug || d.id,
            description: data.description || '',
            storyCount: data.storyCount || 0,
          });
        });
        if (cats.length > 0) {
          if (!cats.some((c) => c.slug === 'all')) {
            cats.unshift({
              id: 'all',
              name: 'සියලුම කතා (All Stories)',
              slug: 'all',
              description: 'සියලුම අලුත් සිංහල කතා සහ රසවත් කතා එකතුව',
            });
          }
          return cats;
        }
      }
    } catch {
      // Fallback
    }

    return INITIAL_CATEGORIES;
  }
}
