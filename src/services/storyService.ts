import { Category, PaginatedResponse, Story, StoryFilterParams } from '../types/story';
import { INITIAL_STORIES } from '../data/seedStories';
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

const DEFAULT_FALLBACK_CATEGORIES: Category[] = [
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

class StoryService {
  public async getStories(params: StoryFilterParams = {}): Promise<PaginatedResponse<Story>> {
    try {
      const storiesRef = collection(db, 'stories');
      const q = query(storiesRef, where('published', '==', true));
      
      const snapshot = await getDocs(q);
      let allStories: Story[] = [];
      snapshot.forEach((docSnap) => {
        allStories.push(normalizeStoryDoc(docSnap.id, docSnap.data()));
      });

      if (allStories.length === 0 && INITIAL_STORIES.length > 0) {
        allStories = [...INITIAL_STORIES];
      }

      // Filter and sort
      if (params.category && params.category !== 'all') {
        const catFilter = params.category.toLowerCase().trim();
        allStories = allStories.filter((s) => {
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
        allStories = allStories.filter((s) => matchesSearchQuery(s, queryText));
      }

      // Sort by selected criteria
      if (params.sortBy === 'popular') {
        allStories.sort((a, b) => (b.views || 0) - (a.views || 0));
      } else {
        // Default latest
        allStories.sort(
          (a, b) =>
            new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime()
        );
      }

      const page = params.page || 1;
      const limitVal = params.limit || 20;
      const total = allStories.length;
      
      return {
        data: allStories.slice((page - 1) * limitVal, page * limitVal),
        total,
        page,
        totalPages: Math.ceil(total / limitVal) || 1,
        hasMore: page < Math.ceil(total / limitVal),
      };
    } catch (e) {
      console.error('Error fetching stories from Firestore:', e);
      let fallback = [...INITIAL_STORIES];
      if (params.category && params.category !== 'all') {
        const catFilter = params.category.toLowerCase().trim();
        fallback = fallback.filter((s) => (s.category || '').toLowerCase().trim() === catFilter);
      }
      if (params.search && params.search.trim()) {
        const queryText = params.search.trim();
        fallback = fallback.filter((s) => matchesSearchQuery(s, queryText));
      }
      const page = params.page || 1;
      const limitVal = params.limit || 20;
      const total = fallback.length;
      return {
        data: fallback.slice((page - 1) * limitVal, page * limitVal),
        total,
        page,
        totalPages: Math.ceil(total / limitVal) || 1,
        hasMore: page < Math.ceil(total / limitVal),
      };
    }
  }

  public async getStoryBySlug(
    slug: string
  ): Promise<{ story: Story | null; relatedStories: Story[] }> {
    try {
      const storiesRef = collection(db, 'stories');
      const q = query(
        storiesRef,
        where('slug', '==', slug),
        where('published', '==', true),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      let story: Story | null = null;
      if (!snapshot.empty) {
        story = normalizeStoryDoc(snapshot.docs[0].id, snapshot.docs[0].data());
      } else {
        // Fallback looking up by document ID
        const docRef = doc(db, 'stories', slug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().published) {
          story = normalizeStoryDoc(docSnap.id, docSnap.data());
        }
      }

      let relatedStories: Story[] = [];
      if (story && story.category) {
        const relatedQ = query(
          storiesRef,
          where('category', '==', story.category),
          where('published', '==', true),
          limit(4)
        );
        const relatedSnap = await getDocs(relatedQ);
        relatedSnap.forEach((d) => {
          if (d.id !== story!.id) {
            relatedStories.push(normalizeStoryDoc(d.id, d.data()));
          }
        });
      }

      return { story, relatedStories: relatedStories.slice(0, 3) };
    } catch (e) {
      console.error('Error fetching story by slug:', e);
      return { story: null, relatedStories: [] };
    }
  }

  /**
   * Atomic Firestore view increment for story views
   * Operates without requiring user login
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
      const storiesRef = collection(db, 'stories');
      const q = query(
        storiesRef,
        where('published', '==', true),
        where('featured', '==', true),
        limit(limitVal)
      );
      const snapshot = await getDocs(q);
      
      let featured: Story[] = [];
      snapshot.forEach((d) => {
        featured.push(normalizeStoryDoc(d.id, d.data()));
      });
      
      if (featured.length === 0) {
        const res = await this.getStories({ limit: limitVal });
        return res.data;
      }
      return featured;
    } catch (e) {
      console.error('Error fetching featured stories:', e);
      return [];
    }
  }

  public async getCategories(): Promise<Category[]> {
    try {
      const categoriesRef = collection(db, 'categories');
      const snapshot = await getDocs(categoriesRef);
      let categories: Category[] = [];

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
          storyCount: data.storyCount || 0,
        });
      });

      if (categories.length === 0) {
        return DEFAULT_FALLBACK_CATEGORIES;
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

      return categories;
    } catch (e) {
      console.error('Error fetching categories:', e);
      return DEFAULT_FALLBACK_CATEGORIES;
    }
  }
}

export const storyService = new StoryService();

