import { Story, Category } from '../types/story';
import { DirectAdSettings, DashboardStats, SiteSettings } from '../types/admin';
import { authService } from './authService';
import { db } from '../lib/firebase';
import { deleteImageFromStorage } from './storageService';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';

const DEFAULT_CATEGORIES: Array<{ name: string; slug: string; description: string }> = [
  { name: 'ආදර කතා (Romantic Stories)', slug: 'romantic', description: 'Romantic tales, heartfelt emotions, and relationship journeys' },
  { name: 'ත්‍රාසජනක (Adventure & Thriller)', slug: 'adventure', description: 'Action-packed adventures, survival tales, and thrilling journeys' },
  { name: 'ප්‍රබන්ධ කතා (Fictional Stories)', slug: 'fiction', description: 'Creative fiction, moral tales, and contemporary Sinhala literature' },
  { name: 'අභිරහස් (Mystery & Detective)', slug: 'mystery', description: 'Unsolved puzzles, crime investigations, and enigmatic plots' },
  { name: 'විද්‍යා ප්‍රබන්ධ (Science Fiction)', slug: 'sci-fi', description: 'Futuristic narratives, advanced tech, and alternate worlds' },
  { name: 'මනඃකල්පිත (Fantasy & Myth)', slug: 'fantasy', description: 'Magical realms, mythical creatures, and ancient folklore' },
  { name: 'හොල්මන් / බියකරු (Supernatural Horror)', slug: 'horror', description: 'Ghostly sightings, supernatural horror, and eerie mysteries' },
  { name: 'ජීවිත ආදර්ශ (Inspirational & Life)', slug: 'inspirational', description: 'Real-world lessons, life inspirations, and moral stories' },
];

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

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Story;
        data.id = docSnap.id;
        stories.push(data);
        
        totalStories++;
        if (data.published) publishedStories++;
        else draftStories++;
        totalViews += (data.views || 0);
      });

      // Sort recent
      stories.sort((a, b) => new Date(b.uploadDate || b.uploadedDate || b.createdAt || 0).getTime() - new Date(a.uploadDate || a.uploadedDate || a.createdAt || 0).getTime());

      // Get ads status
      const adsDoc = await getDoc(doc(db, 'advertisements', 'settings'));
      const adsEnabled = adsDoc.exists() ? adsDoc.data().enabled : true;
      const maxTriggers = adsDoc.exists() ? (adsDoc.data().maxTriggers || 1) : 1;
      const hasGlobalDirectLink = adsDoc.exists() ? !!adsDoc.data().globalDirectLink : false;

      return {
        totalStories,
        publishedStories,
        draftStories,
        totalViews,
        adsEnabled,
        maxTriggers,
        hasGlobalDirectLink,
        recentUploads: stories.slice(0, 5).map((s) => ({
          id: s.id,
          title: s.title,
          slug: s.slug,
          category: s.category || '',
          uploadedDate: s.uploadDate || s.uploadedDate || s.createdAt || new Date().toISOString(),
          views: s.views || 0,
          published: s.published,
        })),
      };
    } catch (err: any) {
      console.error(err);
      throw new Error('Failed to fetch dashboard metrics');
    }
  }

  public async getStories(params?: {
    search?: string;
    category?: string;
    status?: 'published' | 'draft' | 'all';
  }): Promise<Story[]> {
    this.requireAuth();

    try {
      const storiesRef = collection(db, 'stories');
      const snapshot = await getDocs(storiesRef);
      
      let stories: Story[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        stories.push({
          id: docSnap.id,
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
          views: data.views || 0,
          featured: Boolean(data.featured),
          published: Boolean(data.published),
          directAdLink: data.directAdLink || '',
        } as Story);
      });

      if (params?.category && params.category !== 'all') {
        const catFilter = params.category.toLowerCase();
        stories = stories.filter(
          (s) =>
            s.category?.toLowerCase() === catFilter ||
            (s as any).categoryId?.toLowerCase() === catFilter
        );
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
    categoryId?: string;
    tags: string[];
    author: string;
    readingTime?: number;
    published: boolean;
    featured?: boolean;
    directAdLink?: string;
  }): Promise<{ message: string; story: Story }> {
    this.requireAuth();

    try {
      if (storyData.coverImage.startsWith('data:image')) {
        throw new Error('Base64 images are not allowed. Please upload the image to Firebase Storage.');
      }

      const slug = storyData.title
        .toLowerCase()
        .replace(/[^a-z0-9\u0D80-\u0DFF]+/g, '-')
        .replace(/(^-|-$)+/g, '') || `story-${Date.now()}`;

      const nowIso = new Date().toISOString();

      // Find matching category details
      const categories = await this.getCategories();
      const matchedCat = categories.find(
        (c) =>
          c.id === storyData.categoryId ||
          c.slug.toLowerCase() === storyData.category.toLowerCase()
      );

      const categorySlug = matchedCat?.slug || storyData.category;
      const categoryId = matchedCat?.id || storyData.categoryId || categorySlug;
      const categoryName = matchedCat?.name || storyData.category;

      const newStory = {
        title: storyData.title,
        slug,
        coverImage: storyData.coverImage,
        description: storyData.shortDescription,
        shortDescription: storyData.shortDescription,
        content: storyData.fullContent,
        fullContent: storyData.fullContent,
        categoryId,
        category: categorySlug,
        categoryName,
        tags: storyData.tags || [],
        author: {
          id: authService.getCurrentUser()?.uid || 'auth_admin',
          name: storyData.author || 'Editorial Staff',
        },
        uploadDate: nowIso,
        uploadedDate: nowIso,
        updatedDate: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
        readingTime:
          storyData.readingTime ||
          Math.max(1, Math.ceil(storyData.fullContent.split(/\s+/).length / 200)),
        views: 0,
        published: storyData.published,
        featured: Boolean(storyData.featured),
        directAdLink: storyData.directAdLink || '',
      };

      const docRef = await addDoc(collection(db, 'stories'), newStory);
      
      return {
        message: 'Story published successfully',
        story: { id: docRef.id, ...newStory } as Story,
      };
    } catch (error: any) {
      console.error('Firebase createStory Error:', error);
      throw new Error(`Failed to publish story: ${error?.code || error?.message || 'unknown error'}`);
    }
  }

  public async updateStory(
    id: string,
    updates: Partial<Story> & { author?: any; categoryId?: string }
  ): Promise<{ message: string; story: Story }> {
    this.requireAuth();

    try {
      if (updates.coverImage && updates.coverImage.startsWith('data:image')) {
        throw new Error('Base64 images are not allowed. Please upload the image to Firebase Storage.');
      }

      const docRef = doc(db, 'stories', id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error('Story not found');
      
      const existing = docSnap.data() as Story;
      const nowIso = new Date().toISOString();

      // If cover image was updated and old one was stored in Firebase Storage, clean up old file
      if (
        updates.coverImage &&
        existing.coverImage &&
        updates.coverImage !== existing.coverImage
      ) {
        await deleteImageFromStorage(existing.coverImage);
      }

      // Sync categoryName and categoryId
      let categorySlug = updates.category || existing.category;
      let categoryId = updates.categoryId || (existing as any).categoryId || categorySlug;
      let categoryName = updates.categoryName || existing.categoryName;

      if (updates.category && updates.category !== existing.category) {
        const categories = await this.getCategories();
        const matched = categories.find(
          (c) => c.slug.toLowerCase() === updates.category!.toLowerCase() || c.id === updates.categoryId
        );
        if (matched) {
          categorySlug = matched.slug;
          categoryId = matched.id;
          categoryName = matched.name;
        }
      }

      const finalUpdates: any = {
        ...updates,
        description: updates.shortDescription || updates.description || existing.shortDescription || existing.description,
        shortDescription: updates.shortDescription || updates.description || existing.shortDescription,
        content: updates.fullContent || updates.content || existing.fullContent || existing.content,
        fullContent: updates.fullContent || updates.content || existing.fullContent,
        category: categorySlug,
        categoryId,
        categoryName,
        updatedDate: nowIso,
        updatedAt: nowIso,
        author:
          typeof updates.author === 'string'
            ? { id: existing.author?.id || 'auth_admin', name: updates.author }
            : updates.author || existing.author,
      };
      
      // Prevent writing doc ID into document fields
      delete finalUpdates.id;

      await updateDoc(docRef, finalUpdates);

      return {
        message: 'Story updated successfully',
        story: { id, ...existing, ...finalUpdates } as Story,
      };
    } catch (error: any) {
      console.error('Firebase updateStory Error:', error);
      throw new Error(`Failed to update story: ${error?.code || error?.message || 'unknown error'}`);
    }
  }

  public async deleteStory(id: string): Promise<void> {
    this.requireAuth();
    try {
      const docRef = doc(db, 'stories', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.coverImage) {
          await deleteImageFromStorage(data.coverImage);
        }
      }

      await deleteDoc(docRef);
    } catch (error: any) {
      console.error('Firebase deleteStory Error:', error);
      throw new Error(`Failed to delete story: ${error?.code || error?.message || 'unknown error'}`);
    }
  }

  public async getAdvertisementSettings(): Promise<{
    advertisements: DirectAdSettings;
    postAdvertisements: Record<string, string>;
  }> {
    try {
      const adsDoc = await getDoc(doc(db, 'advertisements', 'settings'));
      let ads: DirectAdSettings = {
        enabled: true,
        globalDirectLink: '',
        maxTriggers: 1,
      };

      if (adsDoc.exists()) {
        ads = { ...ads, ...adsDoc.data() };
      }
      
      // Extract individual ad codes from stories
      const postAdvertisements: Record<string, string> = {};
      const storiesRef = collection(db, 'stories');
      const snapshot = await getDocs(storiesRef);
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.directAdLink) {
          postAdvertisements[d.id] = data.directAdLink;
        }
      });

      return { advertisements: ads, postAdvertisements };
    } catch (e) {
      console.error(e);
      throw new Error('Failed to load advertisement settings');
    }
  }

  public async updateAdvertisementSettings(
    settings: Partial<DirectAdSettings>
  ): Promise<{ message: string; advertisements: DirectAdSettings }> {
    this.requireAuth();
    try {
      const docRef = doc(db, 'advertisements', 'settings');
      const docSnap = await getDoc(docRef);
      
      let updated: DirectAdSettings = {
        enabled: true,
        globalDirectLink: '',
        maxTriggers: 1,
      };

      if (docSnap.exists()) {
        updated = { ...updated, ...docSnap.data() };
      }
      
      updated = { 
        ...updated, 
        ...settings, 
        updatedAt: new Date().toISOString() 
      };
      await setDoc(docRef, updated);

      return {
        message: 'Advertisement settings updated successfully',
        advertisements: updated,
      };
    } catch (error: any) {
      console.error('Firebase Advertisement Update Error:', error);
      const code = error?.code || error?.message || 'unknown error';
      throw new Error(`Failed to update advertisement settings: ${code}`);
    }
  }

  public async updateStoryAd(storyId: string, directLink: string): Promise<{ message: string }> {
    this.requireAuth();
    try {
      await updateDoc(doc(db, 'stories', storyId), {
        directAdLink: directLink
      });
      return { message: 'Story ad updated successfully' };
    } catch (error: any) {
      console.error('Firebase updateStoryAd Error:', error);
      throw new Error(`Failed to update individual story ad code: ${error?.code || error?.message || 'unknown error'}`);
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

      // If categories collection is empty in Firestore, bootstrap default categories
      if (categories.length === 0) {
        for (const cat of DEFAULT_CATEGORIES) {
          try {
            const docRef = await addDoc(categoriesRef, {
              ...cat,
              createdAt: new Date().toISOString(),
              storyCount: 0,
            });
            categories.push({ id: docRef.id, ...cat, storyCount: 0, createdAt: new Date().toISOString() });
          } catch {
            // ignore
          }
        }
      }

      // Count stories dynamically per category for accurate statistics
      try {
        const storiesSnap = await getDocs(collection(db, 'stories'));
        const counts: Record<string, number> = {};
        storiesSnap.forEach((sDoc) => {
          const s = sDoc.data();
          const catKey = (s.category || '').toLowerCase();
          const catId = s.categoryId || '';
          counts[catKey] = (counts[catKey] || 0) + 1;
          if (catId && catId !== catKey) {
            counts[catId] = (counts[catId] || 0) + 1;
          }
        });

        categories = categories.map((c) => ({
          ...c,
          storyCount: counts[c.slug.toLowerCase()] || counts[c.id] || 0,
        }));
      } catch {
        // ignore story count failure
      }

      return categories;
    } catch (error: any) {
      console.error('Failed to get categories from Firestore:', error);
      return DEFAULT_CATEGORIES.map((c, i) => ({ id: `default-${i}`, ...c, storyCount: 0, createdAt: new Date().toISOString() }));
    }
  }

  public async getCategoryStoriesCount(categoryId: string, categorySlug: string): Promise<number> {
    try {
      const storiesRef = collection(db, 'stories');
      const snap = await getDocs(storiesRef);
      let count = 0;
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (
          data.categoryId === categoryId ||
          data.category?.toLowerCase() === categorySlug.toLowerCase()
        ) {
          count++;
        }
      });
      return count;
    } catch {
      return 0;
    }
  }

  public async createCategory(categoryData: {
    name: string;
    slug: string;
    description?: string;
  }): Promise<{ message: string; category: Category }> {
    this.requireAuth();
    try {
      const newCat = {
        name: categoryData.name.trim(),
        slug: categoryData.slug.toLowerCase().trim(),
        description: categoryData.description?.trim() || `${categoryData.name} stories and tales`,
        createdAt: new Date().toISOString(),
        storyCount: 0,
      };
      const docRef = await addDoc(collection(db, 'categories'), newCat);
      return {
        message: 'Category created successfully',
        category: { id: docRef.id, ...newCat },
      };
    } catch (error: any) {
      console.error('Firebase createCategory Error:', error);
      throw new Error(`Failed to create category: ${error?.code || error?.message || 'unknown error'}`);
    }
  }

  public async updateCategory(
    id: string,
    categoryData: { name: string; slug: string; description?: string }
  ): Promise<{ message: string; category: Category }> {
    this.requireAuth();
    try {
      const catRef = doc(db, 'categories', id);
      const oldSnap = await getDoc(catRef);
      if (!oldSnap.exists()) throw new Error('Category not found');

      const oldSlug = oldSnap.data().slug;
      const newSlug = categoryData.slug.toLowerCase().trim();
      const newName = categoryData.name.trim();

      const updates = {
        name: newName,
        slug: newSlug,
        description: categoryData.description?.trim() || '',
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(catRef, updates);

      // If category slug or name changed, batch update stories referencing this category
      if (oldSlug !== newSlug || oldSnap.data().name !== newName) {
        const storiesSnap = await getDocs(collection(db, 'stories'));
        const batch = writeBatch(db);
        let updatedStoriesCount = 0;

        storiesSnap.forEach((docSnap) => {
          const s = docSnap.data();
          if (s.categoryId === id || s.category?.toLowerCase() === oldSlug.toLowerCase()) {
            batch.update(docSnap.ref, {
              categoryId: id,
              category: newSlug,
              categoryName: newName,
            });
            updatedStoriesCount++;
          }
        });

        if (updatedStoriesCount > 0) {
          await batch.commit();
        }
      }

      return {
        message: 'Category updated successfully',
        category: { id, ...oldSnap.data(), ...updates } as Category,
      };
    } catch (error: any) {
      console.error('Firebase updateCategory Error:', error);
      throw new Error(`Failed to update category: ${error?.code || error?.message || 'unknown error'}`);
    }
  }

  public async deleteCategory(
    id: string,
    options?: {
      action: 'reassign' | 'uncategorize';
      targetCategoryId?: string;
    }
  ): Promise<{ message: string; affectedStoriesCount: number }> {
    this.requireAuth();
    try {
      const catRef = doc(db, 'categories', id);
      const catSnap = await getDoc(catRef);
      const categorySlug = catSnap.exists() ? catSnap.data().slug : '';

      // Find all stories belonging to this category
      const storiesSnap = await getDocs(collection(db, 'stories'));
      const matchingDocs: Array<{ ref: any; data: any }> = [];

      storiesSnap.forEach((d) => {
        const data = d.data();
        if (
          data.categoryId === id ||
          (categorySlug && data.category?.toLowerCase() === categorySlug.toLowerCase())
        ) {
          matchingDocs.push({ ref: d.ref, data });
        }
      });

      // Handle reassignment or uncategorization
      if (matchingDocs.length > 0) {
        const batch = writeBatch(db);

        if (options?.action === 'reassign' && options.targetCategoryId) {
          // Reassign to selected destination category
          const targetCatDoc = await getDoc(doc(db, 'categories', options.targetCategoryId));
          if (!targetCatDoc.exists()) {
            throw new Error('Target category for reassignment was not found.');
          }
          const targetData = targetCatDoc.data();
          
          matchingDocs.forEach((item) => {
            batch.update(item.ref, {
              categoryId: targetCatDoc.id,
              category: targetData.slug,
              categoryName: targetData.name,
            });
          });
        } else {
          // Default to uncategorize
          matchingDocs.forEach((item) => {
            batch.update(item.ref, {
              categoryId: 'uncategorized',
              category: 'uncategorized',
              categoryName: 'Uncategorized',
            });
          });
        }

        await batch.commit();
      }

      // Delete the category document
      await deleteDoc(catRef);

      return {
        message: 'Category deleted successfully',
        affectedStoriesCount: matchingDocs.length,
      };
    } catch (error: any) {
      console.error('Firebase deleteCategory Error:', error);
      throw new Error(`Failed to delete category: ${error?.code || error?.message || 'unknown error'}`);
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
    } catch (error: any) {
      console.error('Firebase updateSiteSettings Error:', error);
      throw new Error(`Failed to update site settings: ${error?.code || error?.message || 'unknown error'}`);
    }
  }
}

export const adminService = new AdminService();

