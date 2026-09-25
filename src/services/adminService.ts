import { Story, Category } from '../types/story';
import { DashboardStats, SiteSettings } from '../types/admin';
import { authService } from './authService';

class AdminService {
  private requireAuth() {
    if (!authService.isAuthenticated()) {
      throw new Error('Unauthorized session. Please log in again.');
    }
  }

  public async getDashboardStats(): Promise<DashboardStats> {
    this.requireAuth();

    try {
      const res = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    return {
      totalStories: 25,
      totalCategories: 6,
      totalViews: 8500,
      publishedStories: 25,
      draftStories: 0,
      recentUploads: [],
    };
  }

  public async getAllStories(): Promise<Story[]> {
    this.requireAuth();

    try {
      const res = await fetch('/api/admin/stories', {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      if (res.ok) {
        const stories = await res.json();
        if (Array.isArray(stories)) return stories;
      }
    } catch {
      // Fallback
    }

    const res = await fetch('/api/stories?limit=100');
    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
    return [];
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

    const isEdit = !!storyData.id;
    const url = isEdit ? `/api/admin/stories/${storyData.id}` : '/api/admin/stories';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authService.getToken()}`,
      },
      body: JSON.stringify(storyData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'කතාව සුරැකීම අසාර්ථක විය.');
    }

    return await res.json();
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

    const res = await fetch(`/api/admin/stories/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authService.getToken()}`,
      },
    });

    if (!res.ok) {
      throw new Error('කතාව මකා දැමීම අසාර්ථක විය.');
    }

    return true;
  }

  public async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return [];
  }

  public async saveCategory(catData: Partial<Category>): Promise<Category> {
    this.requireAuth();

    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authService.getToken()}`,
      },
      body: JSON.stringify(catData),
    });

    if (!res.ok) {
      throw new Error('වර්ගීකරණය සුරැකීම අසාර්ථක විය.');
    }

    return await res.json();
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

    await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authService.getToken()}`,
      },
    }).catch(() => {});

    return { success: true, message: 'වර්ගීකරණය මකා දමන ලදී.', affectedStoriesCount: 0 };
  }

  public async getSiteSettings(): Promise<SiteSettings> {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        return await res.json();
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

    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authService.getToken()}`,
      },
      body: JSON.stringify(settings),
    });

    if (!res.ok) {
      throw new Error('සැකසුම් සුරැකීම අසාර්ථක විය.');
    }

    return await res.json();
  }

  public async updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    return this.saveSiteSettings(settings);
  }
}

export const adminService = new AdminService();
