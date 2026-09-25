import { Story, Category } from '../types/story';
import { DashboardStats, SiteSettings } from '../types/admin';
import { authService } from './authService';
import { normalizeFirestoreStory, StoryService } from './storyService';
import { db } from '../lib/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

class AdminService {
  private requireAuth() {
    if (!authService.isAuthenticated()) {
      throw new Error('Unauthorized session. Please log in again.');
    }
  }

  public async getDashboardStats(): Promise<DashboardStats> {
    this.requireAuth();

    try {
      const stories = await this.getAllStories();
      const categories = await this.getCategories();

      const published = stories.filter((s) => s.published !== false);
      const drafts = stories.filter((s) => s.published === false);

      const recent = [...stories]
        .sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime())
        .slice(0, 5)
        .map((s) => ({
          id: s.id,
          title: s.title,
          slug: s.slug,
          views: 0,
          uploadDate: s.uploadDate,
          category: s.category,
        }));

      return {
        totalStories: stories.length,
        totalCategories: categories.length,
        totalViews: 0,
        publishedStories: published.length,
        draftStories: drafts.length,
        recentUploads: recent,
      };
    } catch {
      // Fallback
    }

    return {
      totalStories: 0,
      totalCategories: 0,
      totalViews: 0,
      publishedStories: 0,
      draftStories: 0,
      recentUploads: [],
    };
  }

  public async getAllStories(): Promise<Story[]> {
    this.requireAuth();

    try {
      const snapshot = await getDocs(collection(db, 'stories'));
      if (!snapshot.empty) {
        const stories: Story[] = [];
        snapshot.forEach((d) => {
          stories.push(normalizeFirestoreStory(d.id, d.data()));
        });
        return stories.sort(
          (a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime()
        );
      }
    } catch {
      // Fallback
    }

    return await StoryService.fetchAllLiveStories();
  }

  public async getStories(filters?: { search?: string; category?: string; status?: 'all' | 'published' | 'draft' }): Promise<Story[]> {
    let stories = await this.getAllStories();
    if (!filters) return stories;

    if (filters.category && filters.category !== 'all') {
      stories = stories.filter((s) => (s.category || '').toLowerCase().includes(filters.category!.toLowerCase()));
    }

    if (filters.status && filters.status !== 'all') {
      const isPub = filters.status === 'published';
      stories = stories.filter((s) => s.published === isPub);
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      stories = stories.filter((s) => (s.title || '').toLowerCase().includes(q) || (s.slug || '').toLowerCase().includes(q));
    }

    return stories;
  }

  public async saveStory(storyData: Partial<Story>): Promise<Story> {
    this.requireAuth();

    const id = storyData.id || `story_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const cleanStory: Story = {
      id,
      title: storyData.title || '',
      slug: storyData.slug || id,
      coverImage: storyData.coverImage || '',
      shortDescription: storyData.shortDescription || storyData.description || '',
      description: storyData.shortDescription || storyData.description || '',
      fullContent: storyData.fullContent || storyData.content || '',
      content: storyData.fullContent || storyData.content || '',
      category: storyData.category || 'all',
      categoryName: storyData.categoryName || '',
      categoryId: storyData.categoryId || storyData.category || 'all',
      tags: storyData.tags || [],
      uploadDate: storyData.uploadDate || now,
      uploadedDate: storyData.uploadDate || now,
      updatedDate: now,
      featured: Boolean(storyData.featured),
      published: storyData.published !== false,
      views: Number(storyData.views || 0),
      readingTime: storyData.readingTime || Math.max(3, Math.ceil((storyData.fullContent || '').length / 450)),
    };

    // Save directly to Firestore
    try {
      await setDoc(doc(db, 'stories', id), {
        ...cleanStory,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      // If direct write fails, try server proxy
      await fetch(`/api/admin/stories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify(cleanStory),
      }).catch(() => {});
    }

    return cleanStory;
  }

  public async createStory(storyData: Partial<Story>): Promise<{ story: Story; message: string }> {
    const story = await this.saveStory(storyData);
    return { story, message: 'Story created successfully' };
  }

  public async updateStory(id: string, storyData: Partial<Story>): Promise<{ story: Story; message: string }> {
    const story = await this.saveStory({ ...storyData, id });
    return { story, message: 'Story updated successfully' };
  }

  public async deleteStory(id: string): Promise<boolean> {
    this.requireAuth();

    try {
      await deleteDoc(doc(db, 'stories', id));
    } catch {
      // Also try API
      await fetch(`/api/admin/stories/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      }).catch(() => {});
    }

    return true;
  }

  public async getCategories(): Promise<Category[]> {
    try {
      const snap = await getDocs(collection(db, 'categories'));
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
        return cats;
      }
    } catch {
      // Fallback
    }
    return await StoryService.getCategories();
  }

  public async saveCategory(catData: Partial<Category>): Promise<Category> {
    this.requireAuth();

    const id = catData.id || catData.slug || `cat_${Date.now()}`;
    const cleanCat: Category = {
      id,
      name: catData.name || '',
      slug: catData.slug || id,
      description: catData.description || '',
      storyCount: catData.storyCount || 0,
    };

    try {
      await setDoc(doc(db, 'categories', id), cleanCat);
    } catch {
      await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify(cleanCat),
      }).catch(() => {});
    }

    return cleanCat;
  }

  public async createCategory(catData: Partial<Category>): Promise<{ category: Category; message: string }> {
    const category = await this.saveCategory(catData);
    return { category, message: 'වර්ගීකරණය සාර්ථකව එකතු කරන ලදී.' };
  }

  public async updateCategory(id: string, catData: Partial<Category>): Promise<{ category: Category; message: string }> {
    const category = await this.saveCategory({ ...catData, id });
    return { category, message: 'වර්ගීකරණය සාර්ථකව යාවත්කාලීන කරන ලදී.' };
  }

  public async deleteCategory(
    id: string,
    _options?: { action?: string; targetCategoryId?: string }
  ): Promise<{ success: boolean; message: string; affectedStoriesCount: number }> {
    this.requireAuth();

    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch {
      await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      }).catch(() => {});
    }

    return { success: true, message: 'වර්ගීකරණය මකා දමන ලදී.', affectedStoriesCount: 0 };
  }

  public async getSiteSettings(): Promise<SiteSettings> {
    try {
      const snap = await getDoc(doc(db, 'settings', 'global'));
      if (snap.exists()) {
        return snap.data() as SiteSettings;
      }
    } catch {
      // Fallback
    }

    return {
      siteName: 'Walkathawa (වල් කතාව)',
      alternateName: 'Walkathawa',
      logo: '/icon.png',
      tagline: 'Sinhala Stories Online | රසවත් සිංහල කතා එකතුව',
      contactEmail: 'mchethiyabandara@gmail.com',
      metaTitle: 'Walkathawa (වල් කතාව) | Sinhala Stories Online',
      metaDescription: 'Walkathawa (වල් කතාව) is a place to read Sinhala stories online.',
      keywords: 'Walkathawa, Sinhala stories, wal katha, සිංහල කතා',
      ogImage: 'https://www.walkathawa.site/icon.png',
    };
  }

  public async saveSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    this.requireAuth();

    try {
      await setDoc(doc(db, 'settings', 'global'), settings, { merge: true });
    } catch {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify(settings),
      }).catch(() => {});
    }

    return await this.getSiteSettings();
  }

  public async updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    return this.saveSiteSettings(settings);
  }
}

export const adminService = new AdminService();
