import { Category, PaginatedResponse, Story, StoryFilterParams } from '../types/story';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy, getDoc, doc, limit } from 'firebase/firestore';

class StoryService {
  public async getStories(params: StoryFilterParams = {}): Promise<PaginatedResponse<Story>> {
    try {
      const storiesRef = collection(db, 'stories');
      let q = query(storiesRef, where('published', '==', true));
      
      const snapshot = await getDocs(q);
      let allStories: Story[] = [];
      snapshot.forEach(doc => {
        allStories.push({ id: doc.id, ...doc.data() } as Story);
      });

      // Simple client-side sorting and filtering for public view
      // Order by uploadDate desc
      allStories.sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime());

      if (params.category && params.category !== 'all') {
        allStories = allStories.filter((s) => s.category?.toLowerCase() === params.category!.toLowerCase());
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
      console.error("Error fetching stories:", e);
      return { data: [], total: 0, page: 1, totalPages: 1, hasMore: false };
    }
  }

  public async getStoryBySlug(
    slug: string
  ): Promise<{ story: Story | null; relatedStories: Story[] }> {
    try {
      const storiesRef = collection(db, 'stories');
      const q = query(storiesRef, where('slug', '==', slug), where('published', '==', true), limit(1));
      const snapshot = await getDocs(q);
      
      let story: Story | null = null;
      if (!snapshot.empty) {
        story = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Story;
      } else {
        // Try falling back to looking it up by ID
        const docRef = doc(db, 'stories', slug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().published) {
          story = { id: docSnap.id, ...docSnap.data() } as Story;
        }
      }

      let relatedStories: Story[] = [];
      if (story && story.category) {
        const relatedQ = query(storiesRef, where('category', '==', story.category), where('published', '==', true), limit(4));
        const relatedSnap = await getDocs(relatedQ);
        relatedSnap.forEach(d => {
          if (d.id !== story!.id) {
            relatedStories.push({ id: d.id, ...d.data() } as Story);
          }
        });
      }

      return { story, relatedStories: relatedStories.slice(0, 3) };
    } catch (e) {
      console.error("Error fetching story by slug:", e);
      return { story: null, relatedStories: [] };
    }
  }

  public async getFeaturedStories(limitVal = 3): Promise<Story[]> {
    try {
      const storiesRef = collection(db, 'stories');
      const q = query(storiesRef, where('published', '==', true), where('featured', '==', true), limit(limitVal));
      const snapshot = await getDocs(q);
      
      let featured: Story[] = [];
      snapshot.forEach(d => {
        featured.push({ id: d.id, ...d.data() } as Story);
      });
      
      if (featured.length === 0) {
        const res = await this.getStories({ limit: limitVal });
        return res.data;
      }
      return featured;
    } catch (e) {
      console.error("Error fetching featured stories", e);
      return [];
    }
  }

  public async getCategories(): Promise<Category[]> {
    try {
      const categoriesRef = collection(db, 'categories');
      const snapshot = await getDocs(categoriesRef);
      let categories: Category[] = [];
      snapshot.forEach(doc => {
        categories.push({ id: doc.id, ...doc.data() } as Category);
      });
      
      // Fallback categories if none exist in DB yet
      if (categories.length === 0) {
        categories = [
          { id: '1', slug: 'romantic', name: 'ආදර කතා (Romantic)' },
          { id: '2', slug: 'adventure', name: 'ත්‍රාසජනක (Adventure)' },
          { id: '3', slug: 'fiction', name: 'ප්‍රබන්ධ කතා (Fiction)' },
          { id: '4', slug: 'mystery', name: 'අභිරහස් (Mystery)' }
        ];
      }
      return categories;
    } catch (e) {
      console.error("Error fetching categories:", e);
      return [
          { id: '1', slug: 'romantic', name: 'ආදර කතා (Romantic)' },
          { id: '2', slug: 'adventure', name: 'ත්‍රාසජනක (Adventure)' },
          { id: '3', slug: 'fiction', name: 'ප්‍රබන්ධ කතා (Fiction)' },
          { id: '4', slug: 'mystery', name: 'අභිරහස් (Mystery)' }
      ];
    }
  }
}

export const storyService = new StoryService();
