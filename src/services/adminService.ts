import { Story } from '../types/story';
import { AdvertisementSettings, DashboardStats, SiteSettings } from '../types/admin';
import { authService } from './authService';
import { db } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, query, where, orderBy } from 'firebase/firestore';

class AdminService {
  private requireAuth() {
    if (!authService.isAuthenticated()) {
      throw new Error('Unauthorized session. Please log in again.');
    }
  }

  public async getDashboardStats(): Promise<DashboardStats> {
    this.requireAuth();

    try {
      const storiesRef = collection(db, 'stories');
      const snapshot = await getDocs(storiesRef);
      
      let totalStories = 0;
      let publishedStories = 0;
      let draftStories = 0;
      let totalViews = 0;
      
      const stories: Story[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as Story;
        data.id = doc.id;
        stories.push(data);
        
        totalStories++;
        if (data.published) publishedStories++;
        else draftStories++;
        totalViews += (data.views || 0);
      });

      // Sort recent
      stories.sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime());

      // Get ads status
      const adsDoc = await getDoc(doc(db, 'advertisements', 'global'));
      const adsEnabled = adsDoc.exists() ? adsDoc.data().enabled : true;
      const adsPerPage = adsDoc.exists() ? adsDoc.data().adsPerPage : 2;
      const hasGlobalAdCode = adsDoc.exists() ? !!adsDoc.data().globalCode : false;

      return {
        totalStories,
        publishedStories,
        draftStories,
        totalViews,
        adsEnabled,
        adsPerPage,
        hasGlobalAdCode,
        recentUploads: stories.slice(0, 5).map((s) => ({
          id: s.id,
          title: s.title,
          slug: s.slug,
          category: s.category || '',
          uploadedDate: s.uploadDate || s.uploadedDate || new Date().toISOString(),
          views: s.views || 0,
          published: s.published,
        })),
      };
    } catch (err: any) {
      console.error(err);
      throw new Error('Failed to fetch dashboard metrics');
    }
  }

  public async getStories(params?: { search?: string; category?: string; status?: 'published' | 'draft' | 'all' }): Promise<Story[]> {
    this.requireAuth();

    try {
      const storiesRef = collection(db, 'stories');
      const snapshot = await getDocs(storiesRef);
      
      let stories: Story[] = [];
      snapshot.forEach(doc => {
        stories.push({ id: doc.id, ...doc.data() } as Story);
      });

      if (params?.category && params.category !== 'all') {
        stories = stories.filter((s) => s.category?.toLowerCase() === params.category!.toLowerCase());
      }
      if (params?.status && params.status !== 'all') {
        stories = stories.filter((s) => (params.status === 'published' ? s.published : !s.published));
      }
      if (params?.search && params.search.trim()) {
        const q = params.search.toLowerCase().trim();
        stories = stories.filter(
          (s) =>
            s.title?.toLowerCase().includes(q) ||
            s.shortDescription?.toLowerCase().includes(q) ||
            s.tags?.some((t) => t.toLowerCase().includes(q))
        );
      }
      
      stories.sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime());
      
      return stories;
    } catch (e: any) {
      console.error(e);
      throw new Error('Failed to fetch stories list');
    }
  }

  public async createStory(storyData: {
    title: string;
    coverImage: string;
    shortDescription: string;
    fullContent: string;
    category: string;
    tags: string[];
    author: string;
    readingTime?: number;
    published: boolean;
    featured?: boolean;
    individualAdCode?: string;
  }): Promise<{ message: string; story: Story }> {
    this.requireAuth();

    try {
      const slug = storyData.title
        .toLowerCase()
        .replace(/[^a-z0-9\u0D80-\u0DFF]+/g, '-')
        .replace(/(^-|-$)+/g, '') || `story-${Date.now()}`;

      const newStory = {
        title: storyData.title,
        slug,
        coverImage: storyData.coverImage,
        shortDescription: storyData.shortDescription,
        fullContent: storyData.fullContent,
        category: storyData.category,
        tags: storyData.tags || [],
        author: {
          id: authService.getCurrentUser()?.uid || 'auth_admin',
          name: storyData.author || 'Editorial Staff',
        },
        uploadDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        readingTime: storyData.readingTime || Math.max(1, Math.ceil(storyData.fullContent.split(/\s+/).length / 200)),
        views: 0,
        published: storyData.published,
        featured: Boolean(storyData.featured),
        individualAdCode: storyData.individualAdCode || '',
      };

      const docRef = await addDoc(collection(db, 'stories'), newStory);
      
      return {
        message: 'Story created successfully',
        story: { id: docRef.id, ...newStory } as Story,
      };
    } catch (e) {
      console.error(e);
      throw new Error('Failed to publish story');
    }
  }

  public async updateStory(
    id: string,
    updates: Partial<Story> & { author?: any }
  ): Promise<{ message: string; story: Story }> {
    this.requireAuth();

    try {
      const docRef = doc(db, 'stories', id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error('Story not found');
      
      const existing = docSnap.data() as Story;
      const finalUpdates = {
        ...updates,
        updatedDate: new Date().toISOString(),
        author: typeof updates.author === 'string' ? { id: existing.author?.id || 'auth_admin', name: updates.author } : updates.author || existing.author,
      };
      
      // Remove id from updates to prevent writing it into the document fields
      delete finalUpdates.id;

      await updateDoc(docRef, finalUpdates);

      return {
        message: 'Story updated successfully',
        story: { id, ...existing, ...finalUpdates } as Story,
      };
    } catch (e) {
      console.error(e);
      throw new Error('Failed to update story');
    }
  }

  public async deleteStory(id: string): Promise<void> {
    this.requireAuth();
    try {
      await deleteDoc(doc(db, 'stories', id));
    } catch (e) {
      console.error(e);
      throw new Error('Failed to delete story');
    }
  }

  public async getAdvertisementSettings(): Promise<{
    advertisements: AdvertisementSettings;
    postAdvertisements: Record<string, string>;
  }> {
    try {
      const adsDoc = await getDoc(doc(db, 'advertisements', 'global'));
      let ads: AdvertisementSettings = {
        globalAdCode: '',
        adsEnabled: true,
        adsPerPage: 2,
        headerAdCode: '',
        inArticleAdCode: '',
        footerAdCode: '',
        testMode: false,
      };

      if (adsDoc.exists()) {
        ads = { ...ads, ...adsDoc.data() };
      }
      
      // Extract individual ad codes from stories
      const postAdvertisements: Record<string, string> = {};
      const storiesRef = collection(db, 'stories');
      const snapshot = await getDocs(storiesRef);
      snapshot.forEach(d => {
        const data = d.data();
        if (data.individualAdCode) {
          postAdvertisements[d.id] = data.individualAdCode;
        }
      });

      return { advertisements: ads, postAdvertisements };
    } catch (e) {
      console.error(e);
      throw new Error('Failed to load advertisement settings');
    }
  }

  public async updateAdvertisementSettings(
    settings: Partial<AdvertisementSettings>
  ): Promise<{ message: string; advertisements: AdvertisementSettings }> {
    this.requireAuth();
    try {
      const docRef = doc(db, 'advertisements', 'global');
      const docSnap = await getDoc(docRef);
      
      let updated: AdvertisementSettings = {
        globalAdCode: '',
        adsEnabled: true,
        adsPerPage: 2,
        headerAdCode: '',
        inArticleAdCode: '',
        footerAdCode: '',
        testMode: false,
      };

      if (docSnap.exists()) {
        updated = { ...updated, ...docSnap.data() };
      }
      
      updated = { ...updated, ...settings };
      await setDoc(docRef, updated);

      return {
        message: 'Advertisement settings updated successfully',
        advertisements: updated,
      };
    } catch (e) {
      console.error(e);
      throw new Error('Failed to update advertisement settings');
    }
  }

  public async updateStoryAd(storyId: string, adCode: string): Promise<{ message: string }> {
    this.requireAuth();
    try {
      await updateDoc(doc(db, 'stories', storyId), {
        individualAdCode: adCode
      });
      return { message: 'Story ad updated successfully' };
    } catch (e) {
      console.error(e);
      throw new Error('Failed to update individual story ad code');
    }
  }

  public async createCategory(categoryData: { name: string; slug: string; description?: string }): Promise<{ message: string; category: any }> {
    this.requireAuth();
    try {
      const newCat = {
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description || `${categoryData.name} stories and tales`,
        createdAt: new Date().toISOString(),
        storyCount: 0
      };
      const docRef = await addDoc(collection(db, 'categories'), newCat);
      return { message: 'Category created successfully', category: { id: docRef.id, ...newCat } };
    } catch (e) {
      console.error(e);
      throw new Error('Failed to create category');
    }
  }

  public async deleteCategory(id: string): Promise<void> {
    this.requireAuth();
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (e) {
      console.error(e);
      throw new Error('Failed to delete category');
    }
  }

  public async getSiteSettings(): Promise<SiteSettings> {
    try {
      const docRef = doc(db, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      
      const defaultSettings: SiteSettings = {
        siteName: 'Walkathawa (වල් කතාව)',
        alternateName: 'වල් කතාව',
        logo: '/icon.png',
        tagline: 'A place to read Sinhala stories online',
        contactEmail: 'contact@walkathawa.com',
        metaTitle: 'Walkathawa (වල් කතාව) | Sinhala Stories Online',
        metaDescription: 'Walkathawa (වල් කතාව) is a place to read Sinhala stories online. Discover new Sinhala katha, romantic stories, fictional stories, and interesting short stories updated regularly.',
        keywords: 'walkatha, walakatha, walkathawa, වල් කතා, වල්කතා, sinhala stories, sinhala katha, sinhala short stories, sinhala kathandara, sinhala love stories, sinhala adult stories, sinhala romantic stories, sinhala fictional stories, sinhala novels, new sinhala stories, latest sinhala katha, online sinhala stories, read sinhala stories online',
        ogImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
        googleAnalyticsId: '',
        searchConsoleVerification: '',
        publisherName: 'Walkathawa (වල් කතාව)',
      };

      if (docSnap.exists()) {
        return { ...defaultSettings, ...docSnap.data() };
      }
      return defaultSettings;
    } catch (e) {
      console.error(e);
      throw new Error('Failed to fetch site settings');
    }
  }

  public async updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    this.requireAuth();
    try {
      const current = await this.getSiteSettings();
      const updated: SiteSettings = { ...current, ...settings };
      
      await setDoc(doc(db, 'settings', 'global'), updated);
      
      return updated;
    } catch (e) {
      console.error(e);
      throw new Error('Failed to update site settings');
    }
  }
}

export const adminService = new AdminService();
