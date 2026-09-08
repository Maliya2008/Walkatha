import { Story, Category } from '../types/story';
import { AdvertisementSettings, DashboardStats, SiteSettings } from '../types/admin';
import { authService } from './authService';
import { db } from '../lib/firebase';
import { deleteImageFromStorage } from './storageService';
import { adService } from './adService';
import { isQuotaError } from './storyService';
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
  deleteField,
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

let cachedDashboardStats: { data: DashboardStats; timestamp: number } | null = null;
let cachedSiteSettings: { data: SiteSettings; timestamp: number } | null = null;
const ADMIN_STATS_CACHE_TTL = 2 * 60 * 1000;     // 2 minutes
const SITE_SETTINGS_CACHE_TTL = 60 * 60 * 1000;  // 1 hour

class AdminService {
  private requireAuth() {
    if (!authService.isAuthenticated()) {
      throw new Error('Unauthorized session. Please log in again.');
    }
  }

  public invalidateAdminCache() {
    cachedDashboardStats = null;
    cachedSiteSettings = null;
    import('./storyService').then(({ storyService }) => {
      storyService.invalidateCache();
    });
  }

  public async getDashboardStats(): Promise<DashboardStats> {
    this.requireAuth();

    const now = Date.now();
    if (cachedDashboardStats && now - cachedDashboardStats.timestamp < ADMIN_STATS_CACHE_TTL) {
      return cachedDashboardStats.data;
    }

    let totalStories = 0;
    let publishedStories = 0;
    let draftStories = 0;
    let totalViews = 0;
    let totalCategories = 0;
    const stories: Story[] = [];

    // Query stories
    try {
      const storiesRef = collection(db, 'stories');
      const snapshot = await getDocs(storiesRef);
      if (snapshot && !snapshot.empty) {
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Story;
          data.id = docSnap.id;
          stories.push(data);
          
          totalStories++;
          if (data.published) publishedStories++;
          else draftStories++;
          totalViews += (data.views || 0);
        });
      }
    } catch (err: any) {
      // Fallback to local stored stories if quota reached or offline
      const localStories = (await import('./storyService')).storyService.getStoredStoriesSync();
      if (localStories && localStories.length > 0) {
        localStories.forEach((s) => {
          stories.push(s);
          totalStories++;
          if (s.published) publishedStories++;
          else draftStories++;
          totalViews += (s.views || 0);
        });
      } else {
        console.warn('Fallback stats from local store:', err);
      }
    }

    // Query categories
    try {
      const categoriesRef = collection(db, 'categories');
      const snapshot = await getDocs(categoriesRef);
      if (snapshot && !snapshot.empty) {
        totalCategories = snapshot.size;
      }
    } catch {
      totalCategories = 8;
    }

    // Query ads status
    let adsEnabled = false;
    let redirectAmount = 1;
    let hasGlobalAdCode = false;

    try {
      const adsDocRef = doc(db, 'advertisement_settings', 'config');
      let adsDoc = await getDoc(adsDocRef);
      
      if (!adsDoc.exists()) {
        const defaultSettings = {
          enabled: false,
          globalAdCode: '',
          redirectAmount: 1,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(adsDocRef, defaultSettings);
        adsDoc = await getDoc(adsDocRef);
      }

      if (adsDoc.exists()) {
        const adsData = adsDoc.data();
        adsEnabled = typeof adsData.enabled === 'boolean' ? adsData.enabled : false;
        redirectAmount = adsData.redirectAmount || 1;
        hasGlobalAdCode = !!adsData.globalAdCode;
      }
    } catch (err: any) {
      console.error('Firebase Error in getDashboardStats (ads):', {
        code: err?.code,
        message: err?.message,
        details: err
      });
    }

    // Sort recent
    try {
      stories.sort((a, b) => new Date(b.uploadDate || b.uploadedDate || b.createdAt || 0).getTime() - new Date(a.uploadDate || a.uploadedDate || a.createdAt || 0).getTime());
    } catch {
      // ignore sorting error
    }

    const stats: DashboardStats = {
      totalStories,
      totalCategories,
      publishedStories,
      draftStories,
      totalViews,
      adsEnabled,
      redirectAmount,
      hasGlobalAdCode,
      maxTriggers: redirectAmount,
      hasGlobalDirectLink: hasGlobalAdCode,
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

    cachedDashboardStats = { data: stats, timestamp: Date.now() };
    return stats;
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
          description: data.description || data.shortDescription || '',
          shortDescription: data.shortDescription || data.description || '',
          content: data.content || data.fullContent || '',
          fullContent: data.fullContent || data.content || '',
          categoryId: data.categoryId || data.category || '',
          category: data.category || '',
          categoryName: data.categoryName || data.category || '',
          tags: data.tags || [],
          uploadDate: data.uploadDate || data.uploadedDate || data.createdAt || new Date().toISOString(),
          uploadedDate: data.uploadedDate || data.uploadDate || data.createdAt || new Date().toISOString(),
          updatedDate: data.updatedDate || data.updatedAt || new Date().toISOString(),
          views: data.views || 0,
          featured: Boolean(data.featured),
          published: Boolean(data.published),
        } as Story);
      });

      if (params?.category && params.category !== 'all') {
        const catFilter = params.category.toLowerCase();
        stories = stories.filter(
          (s) =>
            s.category?.toLowerCase() === catFilter ||
            s.categoryId?.toLowerCase() === catFilter
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
            s.description?.toLowerCase().includes(q) ||
            s.tags?.some((t) => t.toLowerCase().includes(q))
        );
      }
      
      stories.sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime());
      
      return stories;
    } catch (e: any) {
      console.warn('Falling back to local stories in admin:', e);
      const fallback = (await import('./storyService')).storyService.getStoredStoriesSync();
      return fallback;
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
    published: boolean;
    featured?: boolean;
  }): Promise<{ message: string; story: Story }> {
    this.requireAuth();

    if (storyData.coverImage && storyData.coverImage.startsWith('data:image')) {
      throw new Error('Base64 images are not allowed. Please upload the image to Firebase Storage.');
    }

    const slug = storyData.title
      .toLowerCase()
      .replace(/[^a-z0-9\u0D80-\u0DFF]+/g, '-')
      .replace(/(^-|-$)+/g, '') || `story-${Date.now()}`;

    const nowIso = new Date().toISOString();

    // Find matching category details
    let categorySlug = storyData.category;
    let categoryId = storyData.categoryId || categorySlug;
    let categoryName = storyData.category;

    try {
      const categories = await this.getCategories();
      const matchedCat = categories.find(
        (c) =>
          c.id === storyData.categoryId ||
          c.slug.toLowerCase() === storyData.category.toLowerCase()
      );
      if (matchedCat) {
        categorySlug = matchedCat.slug;
        categoryId = matchedCat.id;
        categoryName = matchedCat.name;
      }
    } catch {
      // Ignore
    }

    const newStory: any = {
      title: storyData.title.trim(),
      slug,
      coverImage: storyData.coverImage.trim(),
      description: storyData.shortDescription.trim(),
      shortDescription: storyData.shortDescription.trim(),
      content: storyData.fullContent.trim(),
      fullContent: storyData.fullContent.trim(),
      categoryId,
      category: categorySlug,
      categoryName,
      tags: storyData.tags || [],
      uploadDate: nowIso,
      uploadedDate: nowIso,
      updatedDate: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
      views: 0,
      published: storyData.published,
      featured: Boolean(storyData.featured),
    };

    let storyId = `story-${Date.now()}`;
    let firestoreSuccess = false;

    try {
      const docRef = await addDoc(collection(db, 'stories'), newStory);
      storyId = docRef.id;
      firestoreSuccess = true;
    } catch (error: any) {
      if (!isQuotaError(error)) {
        console.warn('Firestore createStory notice (fallback to local/server):', error);
      }
    }

    const finalStory: Story = { id: storyId, ...newStory };

    // Update local cache
    const { storyService } = await import('./storyService');
    storyService.upsertLocalStory(finalStory);

    // Sync to backend server
    try {
      const token = authService.getToken();
      await fetch('/api/admin/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(finalStory),
      });
    } catch {
      // Non-fatal
    }

    this.invalidateAdminCache();
    
    return {
      message: firestoreSuccess ? 'Story published successfully' : 'Story published and saved successfully (cached locally & synced)',
      story: finalStory,
    };
  }

  public async updateStory(
    id: string,
    updates: Partial<Story> & { categoryId?: string }
  ): Promise<{ message: string; story: Story }> {
    this.requireAuth();

    if (updates.coverImage && updates.coverImage.startsWith('data:image')) {
      throw new Error('Base64 images are not allowed. Please upload the image to Firebase Storage.');
    }

    const nowIso = new Date().toISOString();

    // Get current story from local store as initial baseline
    const { storyService } = await import('./storyService');
    const localStories = storyService.getStoredStoriesSync();
    let existing: Partial<Story> = localStories.find((s) => s.id === id || s.slug === id) || {};

    let firestoreSuccess = false;

    try {
      const docRef = doc(db, 'stories', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        existing = { ...existing, ...(docSnap.data() as Story) };
      }
      
      // Clean up old cover image from storage if replaced
      if (
        updates.coverImage &&
        existing.coverImage &&
        updates.coverImage !== existing.coverImage
      ) {
        await deleteImageFromStorage(existing.coverImage).catch(() => {});
      }

      // Sync categoryName and categoryId
      let categorySlug = updates.category || existing.category || 'romantic';
      let categoryId = updates.categoryId || (existing as any).categoryId || categorySlug;
      let categoryName = updates.categoryName || existing.categoryName || 'ආදර කතා';

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

      // Ensure slug is populated and valid
      let finalSlug = updates.slug?.trim() || existing.slug;
      if (!finalSlug || !finalSlug.trim()) {
        const titleToUse = updates.title || existing.title || '';
        finalSlug = titleToUse
          .toLowerCase()
          .replace(/[^a-z0-9\u0D80-\u0DFF]+/g, '-')
          .replace(/(^-|-$)+/g, '') || `story-${id}`;
      }

      const finalUpdates: any = {
        ...updates,
        description: updates.shortDescription || updates.description || existing.description || existing.shortDescription,
        shortDescription: updates.shortDescription || updates.description || existing.shortDescription,
        content: updates.fullContent || updates.content || existing.content || existing.fullContent,
        fullContent: updates.fullContent || updates.content || existing.fullContent,
        category: categorySlug,
        categoryId,
        categoryName,
        slug: finalSlug,
        updatedDate: nowIso,
        updatedAt: nowIso,
        categories: deleteField(),
        categoryIds: deleteField(),
      };
      
      delete finalUpdates.id;
      delete finalUpdates.author;
      delete finalUpdates.readingTime;
      delete finalUpdates.directAdLink;

      await updateDoc(docRef, finalUpdates);
      firestoreSuccess = true;
    } catch (error: any) {
      if (!isQuotaError(error)) {
        console.warn('Firestore updateStory notice (fallback to local/server):', error);
      }
    }

    // Compute updated story object
    const finalSlug = updates.slug?.trim() || existing.slug || (updates.title ? updates.title.toLowerCase().replace(/[^a-z0-9\u0D80-\u0DFF]+/g, '-').replace(/(^-|-$)+/g, '') : `story-${id}`);
    const updatedStory: Story = {
      id,
      title: updates.title !== undefined ? updates.title.trim() : (existing.title || ''),
      slug: finalSlug,
      coverImage: updates.coverImage !== undefined ? updates.coverImage.trim() : (existing.coverImage || ''),
      shortDescription: updates.shortDescription !== undefined ? updates.shortDescription.trim() : (existing.shortDescription || existing.description || ''),
      description: updates.shortDescription !== undefined ? updates.shortDescription.trim() : (existing.description || existing.shortDescription || ''),
      fullContent: updates.fullContent !== undefined ? updates.fullContent.trim() : (existing.fullContent || existing.content || ''),
      content: updates.fullContent !== undefined ? updates.fullContent.trim() : (existing.content || existing.fullContent || ''),
      category: updates.category || existing.category || 'romantic',
      categoryId: updates.categoryId || (existing as any).categoryId || updates.category || 'romantic',
      categoryName: updates.categoryName || existing.categoryName || 'ආදර කතා',
      tags: updates.tags || existing.tags || [],
      published: updates.published !== undefined ? Boolean(updates.published) : (existing.published !== undefined ? Boolean(existing.published) : true),
      featured: updates.featured !== undefined ? Boolean(updates.featured) : Boolean(existing.featured),
      uploadDate: existing.uploadDate || existing.uploadedDate || nowIso,
      uploadedDate: existing.uploadedDate || existing.uploadDate || nowIso,
      updatedDate: nowIso,
      views: existing.views || 0,
      readingTime: updates.readingTime || existing.readingTime || 5,
    };

    // Update in local cache
    storyService.upsertLocalStory(updatedStory);

    // Sync to backend server
    try {
      const token = authService.getToken();
      await fetch(`/api/admin/stories/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updatedStory),
      });
    } catch {
      // Non-fatal
    }

    this.invalidateAdminCache();

    return {
      message: firestoreSuccess ? 'Story updated successfully' : 'Story updated and saved successfully (cached locally & synced)',
      story: updatedStory,
    };
  }

  public async deleteStory(id: string): Promise<void> {
    this.requireAuth();

    try {
      const docRef = doc(db, 'stories', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.coverImage) {
          await deleteImageFromStorage(data.coverImage).catch(() => {});
        }
      }

      await deleteDoc(docRef);
    } catch (error: any) {
      if (!isQuotaError(error)) {
        console.warn('Firestore deleteStory notice (fallback to local/server):', error);
      }
    }

    // Delete from local cache
    const { storyService } = await import('./storyService');
    storyService.deleteLocalStory(id);

    // Delete from backend server
    try {
      const token = authService.getToken();
      await fetch(`/api/admin/stories/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch {
      // Non-fatal
    }

    this.invalidateAdminCache();
  }

  public async getAdvertisementSettings(): Promise<{
    advertisements: AdvertisementSettings;
  }> {
    try {
      const docRef = doc(db, 'advertisement_settings', 'config');
      const adsDoc = await getDoc(docRef);

      if (!adsDoc.exists()) {
        const defaultSettings = {
          enabled: false,
          globalAdCode: '',
          redirectAmount: 1,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(docRef, defaultSettings);
        return { advertisements: defaultSettings as any };
      }

      const data = adsDoc.data();
      const ads: AdvertisementSettings = {
        enabled: typeof data.enabled === 'boolean' ? data.enabled : false,
        globalAdCode: data.globalAdCode || '',
        redirectAmount: (data.redirectAmount !== undefined ? data.redirectAmount : 1) as 1 | 2 | 3,
        updatedAt: data.updatedAt || new Date().toISOString(),
      };

      return { advertisements: ads };
    } catch (e: any) {
      console.error('Firebase error fetching advertisement settings:', {
        code: e?.code,
        message: e?.message,
        details: e
      });
      // Fallback instead of throwing to prevent crashing the admin panel
      const fallbackSettings = {
        enabled: false,
        globalAdCode: '',
        redirectAmount: 1 as 1 | 2 | 3,
        updatedAt: new Date().toISOString(),
      };
      return { advertisements: fallbackSettings };
    }
  }

  public async updateAdvertisementSettings(
    settings: Partial<AdvertisementSettings>
  ): Promise<{ message: string; advertisements: AdvertisementSettings }> {
    this.requireAuth();
    const current = (await this.getAdvertisementSettings()).advertisements;
    
    const updated: AdvertisementSettings = {
      enabled: typeof settings.enabled === 'boolean' ? settings.enabled : current.enabled,
      globalAdCode: typeof settings.globalAdCode === 'string' ? settings.globalAdCode : current.globalAdCode,
      redirectAmount: (settings.redirectAmount !== undefined ? settings.redirectAmount : current.redirectAmount || 1) as 1 | 2 | 3,
      updatedAt: new Date().toISOString(),
    };

    let firestoreSuccess = false;
    try {
      await setDoc(doc(db, 'advertisement_settings', 'config'), updated);
      firestoreSuccess = true;
    } catch (error: any) {
      if (!isQuotaError(error)) {
        console.warn('Firebase advertisement settings notice:', error);
      }
    }

    // Update runtime adService config
    adService.updateConfig(updated);
    this.invalidateAdminCache();

    // Sync to backend
    try {
      const token = authService.getToken();
      await fetch('/api/admin/ads', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updated),
      });
    } catch {
      // Non-fatal
    }

    return {
      message: firestoreSuccess ? 'Advertisement settings updated successfully' : 'Advertisement settings saved successfully (cached locally & synced)',
      advertisements: updated,
    };
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
          createdAt: data.createdAt || new Date().toISOString(),
        } as Category);
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
        const cat = (data.category || '').toLowerCase();
        const catId = data.categoryId || '';
        const catSlug = (data.categorySlug || '').toLowerCase();
        if (
          catId === categoryId ||
          cat === categorySlug.toLowerCase() ||
          catSlug === categorySlug.toLowerCase() ||
          docSnap.id === categoryId
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
    slug?: string;
    description?: string;
  }): Promise<{ message: string; category: Category }> {
    this.requireAuth();
    const trimmedName = categoryData.name.trim();
    let generatedSlug = (categoryData.slug || '').toLowerCase().trim();
    if (!generatedSlug) {
      generatedSlug = trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9\u0D80-\u0DFF]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }
    if (!generatedSlug) {
      generatedSlug = `category-${Date.now().toString(36)}`;
    }

    const newCat = {
      name: trimmedName,
      slug: generatedSlug,
      description: categoryData.description?.trim() || `${trimmedName} stories and tales`,
      createdAt: new Date().toISOString(),
      storyCount: 0,
    };

    let catId = `cat-${Date.now()}`;
    let firestoreSuccess = false;

    try {
      const docRef = await addDoc(collection(db, 'categories'), newCat);
      catId = docRef.id;
      firestoreSuccess = true;
    } catch (error: any) {
      if (!isQuotaError(error)) {
        console.warn('Firebase createCategory notice:', error);
      }
    }

    this.invalidateAdminCache();
    return {
      message: firestoreSuccess ? 'Category created successfully' : 'Category created and saved locally',
      category: { id: catId, ...newCat },
    };
  }

  public async updateCategory(
    id: string,
    categoryData: { name: string; slug: string; description?: string }
  ): Promise<{ message: string; category: Category }> {
    this.requireAuth();
    const newSlug = categoryData.slug.toLowerCase().trim();
    const newName = categoryData.name.trim();

    const updates = {
      name: newName,
      slug: newSlug,
      description: categoryData.description?.trim() || '',
      updatedAt: new Date().toISOString(),
    };

    let firestoreSuccess = false;

    try {
      const catRef = doc(db, 'categories', id);
      const oldSnap = await getDoc(catRef);
      const oldSlug = oldSnap.exists() ? oldSnap.data().slug : '';

      await updateDoc(catRef, updates);
      firestoreSuccess = true;

      // If category slug or name changed, batch update stories referencing this category
      if (oldSlug && (oldSlug !== newSlug || oldSnap.data()?.name !== newName)) {
        try {
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
        } catch {
          // Non-fatal
        }
      }
    } catch (error: any) {
      if (!isQuotaError(error)) {
        console.warn('Firebase updateCategory notice:', error);
      }
    }

    this.invalidateAdminCache();

    return {
      message: firestoreSuccess ? 'Category updated successfully' : 'Category updated and saved locally',
      category: { id, ...updates } as Category,
    };
  }

  public async deleteCategory(
    id: string,
    options?: {
      action: 'reassign' | 'uncategorize';
      targetCategoryId?: string;
    }
  ): Promise<{ message: string; affectedStoriesCount: number }> {
    this.requireAuth();
    let affectedCount = 0;

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

      affectedCount = matchingDocs.length;

      // Handle reassignment or uncategorization
      if (matchingDocs.length > 0) {
        const batch = writeBatch(db);

        if (options?.action === 'reassign' && options.targetCategoryId) {
          const targetCatDoc = await getDoc(doc(db, 'categories', options.targetCategoryId));
          if (targetCatDoc.exists()) {
            const targetData = targetCatDoc.data();
            matchingDocs.forEach((item) => {
              batch.update(item.ref, {
                categoryId: targetCatDoc.id,
                category: targetData.slug,
                categoryName: targetData.name,
              });
            });
          }
        } else {
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

      await deleteDoc(catRef);
    } catch (error: any) {
      if (!isQuotaError(error)) {
        console.warn('Firebase deleteCategory notice:', error);
      }
    }

    this.invalidateAdminCache();

    return {
      message: 'Category deleted successfully',
      affectedStoriesCount: affectedCount,
    };
  }

  public async getSiteSettings(): Promise<SiteSettings> {
    const now = Date.now();
    if (cachedSiteSettings && now - cachedSiteSettings.timestamp < SITE_SETTINGS_CACHE_TTL) {
      return cachedSiteSettings.data;
    }

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

    try {
      const docRef = doc(db, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      
      let res = defaultSettings;
      if (docSnap.exists()) {
        res = { ...defaultSettings, ...docSnap.data() };
      }
      cachedSiteSettings = { data: res, timestamp: Date.now() };
      return res;
    } catch {
      cachedSiteSettings = { data: defaultSettings, timestamp: Date.now() };
      return defaultSettings;
    }
  }

  public async updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    this.requireAuth();
    const current = await this.getSiteSettings();
    const updated: SiteSettings = { ...current, ...settings };
    
    try {
      await setDoc(doc(db, 'settings', 'global'), updated);
    } catch (error: any) {
      if (!isQuotaError(error)) {
        console.warn('Firebase updateSiteSettings notice:', error);
      }
    }

    cachedSiteSettings = { data: updated, timestamp: Date.now() };
    this.invalidateAdminCache();
    
    // Sync to backend
    try {
      const token = authService.getToken();
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updated),
      });
    } catch {
      // Non-fatal
    }

    return updated;
  }
  public async migrateStoryCategories(): Promise<number> {
    try {
      const storiesRef = collection(db, 'stories');
      const snapshot = await getDocs(storiesRef);
      let migratedCount = 0;

      const categories = await this.getCategories();

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        let needsUpdate = false;
        let targetCatId = data.categoryId;
        let targetCatSlug = data.category;
        let targetCatName = data.categoryName;

        // Check if categories array exists
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          const firstCat = data.categories[0];
          if (typeof firstCat === 'string') {
            const matched = categories.find(
              (c) => c.id === firstCat || c.slug.toLowerCase() === firstCat.toLowerCase() || c.name.toLowerCase() === firstCat.toLowerCase()
            );
            if (matched) {
              targetCatId = matched.id;
              targetCatSlug = matched.slug;
              targetCatName = matched.name;
            } else {
              targetCatId = firstCat;
              targetCatSlug = firstCat;
              targetCatName = firstCat;
            }
          } else if (firstCat && typeof firstCat === 'object') {
            targetCatId = firstCat.id || firstCat.categoryId || targetCatId;
            targetCatSlug = firstCat.slug || firstCat.category || targetCatSlug;
            targetCatName = firstCat.name || firstCat.categoryName || targetCatName;
          }
          needsUpdate = true;
        }

        // Check if categoryIds array exists
        if (Array.isArray(data.categoryIds) && data.categoryIds.length > 0) {
          const firstId = data.categoryIds[0];
          const matched = categories.find((c) => c.id === firstId || c.slug.toLowerCase() === firstId.toLowerCase());
          if (matched) {
            targetCatId = matched.id;
            targetCatSlug = matched.slug;
            targetCatName = matched.name;
          } else if (!targetCatId) {
            targetCatId = firstId;
          }
          needsUpdate = true;
        }

        // Check if category field is an array
        if (Array.isArray(data.category) && data.category.length > 0) {
          const firstCat = data.category[0];
          const matched = categories.find((c) => c.id === firstCat || c.slug.toLowerCase() === firstCat.toLowerCase());
          if (matched) {
            targetCatId = matched.id;
            targetCatSlug = matched.slug;
            targetCatName = matched.name;
          } else {
            targetCatSlug = String(firstCat);
          }
          needsUpdate = true;
        }

        // Ensure categoryId is set if missing
        if (!targetCatId && targetCatSlug) {
          const matched = categories.find((c) => c.slug.toLowerCase() === targetCatSlug.toLowerCase());
          if (matched) {
            targetCatId = matched.id;
            targetCatName = matched.name;
            needsUpdate = true;
          } else {
            targetCatId = targetCatSlug;
            needsUpdate = true;
          }
        }

        if (needsUpdate || 'categories' in data || 'categoryIds' in data) {
          const updatePayload: any = {
            categoryId: targetCatId || 'romantic',
            category: targetCatSlug || 'romantic',
            categoryName: targetCatName || 'Romantic Stories',
            categories: deleteField(),
            categoryIds: deleteField(),
          };
          await updateDoc(docSnap.ref, updatePayload);
          migratedCount++;
        }
      }

      return migratedCount;
    } catch (err) {
      console.warn('Story category migration notice:', err);
      return 0;
    }
  }

  public async migrateStorySlugs(): Promise<number> {
    try {
      const storiesRef = collection(db, 'stories');
      const snapshot = await getDocs(storiesRef);
      let migratedCount = 0;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (!data.slug || typeof data.slug !== 'string' || !data.slug.trim()) {
          const generated = (data.title || '')
            .toLowerCase()
            .replace(/[^a-z0-9\u0D80-\u0DFF]+/g, '-')
            .replace(/(^-|-$)+/g, '') || `story-${docSnap.id}`;
          
          await updateDoc(docSnap.ref, {
            slug: generated,
            updatedAt: new Date().toISOString(),
          });
          migratedCount++;
        }
      }
      return migratedCount;
    } catch (err) {
      console.warn('Story slug migration notice:', err);
      return 0;
    }
  }

  public async syncAllToFirestore(): Promise<{ storiesCount: number; categoriesCount: number; success: boolean }> {
    this.requireAuth();
    try {
      // 1. Fetch from local backend API to get current database state
      const res = await fetch('/api/public/stories?limit=100');
      const storiesJson = res.ok ? await res.json() : { data: [] };
      const localStories: Story[] = storiesJson.data || [];

      // 2. Fetch categories
      const catRes = await fetch('/api/public/categories');
      const catJson = catRes.ok ? await catRes.json() : { data: [] };
      const localCategories: Category[] = catJson.data || [];

      // 3. Fetch Settings
      const setRes = await fetch('/api/public/settings');
      const settingsJson = setRes.ok ? await setRes.json() : { data: null };

      // 4. Fetch Ads
      const adsRes = await fetch('/api/public/ads/config');
      const adsJson = adsRes.ok ? await adsRes.json() : { data: null };

      // Sync Categories
      const categoriesToSync = localCategories.length > 0
        ? localCategories
        : DEFAULT_CATEGORIES.map((c) => ({
            id: c.slug,
            name: c.name,
            slug: c.slug,
            description: c.description,
            storyCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));

      for (const cat of categoriesToSync) {
        const catId = cat.id || cat.slug;
        const iconVal = 'icon' in cat ? (cat as any).icon || '' : '';
        await setDoc(doc(db, 'categories', catId), {
          id: catId,
          name: cat.name,
          slug: cat.slug,
          description: cat.description || '',
          icon: iconVal,
          storyCount: cat.storyCount || 0,
          createdAt: cat.createdAt || new Date().toISOString(),
          updatedAt: cat.updatedAt || new Date().toISOString(),
        }, { merge: true });
      }

      // Sync Site Settings
      if (settingsJson.data) {
        await setDoc(doc(db, 'settings', 'site'), {
          ...settingsJson.data,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      // Sync Ads
      if (adsJson.data) {
        await setDoc(doc(db, 'advertisement_settings', 'config'), {
          ...adsJson.data,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      // Sync Stories in batches
      if (localStories.length > 0) {
        const batchSize = 20;
        for (let i = 0; i < localStories.length; i += batchSize) {
          const chunk = localStories.slice(i, i + batchSize);
          const batch = writeBatch(db);
          for (const story of chunk) {
            const storyRef = doc(db, 'stories', story.id);
            batch.set(storyRef, {
              ...story,
              published: story.published !== undefined ? story.published : true,
              views: Number(story.views) || 0,
              updatedDate: story.updatedDate || new Date().toISOString(),
              createdAt: story.createdAt || story.uploadDate || story.uploadedDate || new Date().toISOString(),
            }, { merge: true });
          }
          await batch.commit();
        }
      }

      this.invalidateAdminCache();

      return {
        storiesCount: localStories.length,
        categoriesCount: categoriesToSync.length,
        success: true,
      };
    } catch (err: any) {
      console.error('Error syncing data to Firestore:', err);
      throw new Error(err?.message || 'Failed to synchronize data to Firestore');
    }
  }
}

export const adminService = new AdminService();

