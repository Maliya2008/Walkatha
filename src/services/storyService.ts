import { Category, PaginatedResponse, Story, StoryFilterParams } from '../types/story';
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

      // Filter and sort
      if (params.category && params.category !== 'all') {
        const catFilter = params.category.toLowerCase();
        allStories = allStories.filter(
          (s) =>
            s.category?.toLowerCase() === catFilter ||
            (s as any).categoryId?.toLowerCase() === catFilter
        );
      }
      if (params.search && params.search.trim()) {
        const queryText = params.search.toLowerCase().trim();
        allStories = allStories.filter(
          (s) =>
            s.title?.toLowerCase().includes(queryText) ||
            s.shortDescription?.toLowerCase().includes(queryText) ||
            s.tags?.some((t) => t.toLowerCase().includes(queryText))
        );
      }

      // Sort by selected criteria
      if (params.sortBy === 'popular') {
        allStories.sort((a, b) => (b.views || 0) - (a.views || 0));
      } else if (params.sortBy === 'readingTime') {
        allStories.sort((a, b) => (a.readingTime || 0) - (b.readingTime || 0));
      } else {
        // Default latest
        allStories.sort(
          (a, b) =>
            new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime()
        );
      }

      const page = params.page || 1;
      const limitVal = params.limit || 9;
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
      return { data: [], total: 0, page: 1, totalPages: 1, hasMore: false };
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
  public async incrementStoryViews(storyId: string): Promise<void> {
    if (!storyId) return;
    try {
      const storyRef = doc(db, 'stories', storyId);
      await updateDoc(storyRef, {
        views: increment(1),
      });
    } catch (error) {
      console.warn('Atomic story view increment notice:', error);
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
        categories.push({ id: docSnap.id, ...docSnap.data() } as Category);
      });
      
      if (categories.length === 0) {
        return DEFAULT_FALLBACK_CATEGORIES;
      }
      return categories;
    } catch (e) {
      console.error('Error fetching categories:', e);
      return DEFAULT_FALLBACK_CATEGORIES;
    }
  }
}

export const storyService = new StoryService();

