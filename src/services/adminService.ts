import { Story } from '../types/story';
import { AdvertisementSettings, DashboardStats, SiteSettings } from '../types/admin';
import { authService } from './authService';
import { INITIAL_STORIES } from '../data/seedStories';

const LOCAL_STORIES_KEY = 'walkatha_stories_store_v1';
const LOCAL_ADS_KEY = 'walkatha_ads_store_v1';
const LOCAL_SETTINGS_KEY = 'walkatha_settings_store_v1';
const LOCAL_POST_ADS_KEY = 'walkatha_post_ads_store_v1';

class AdminService {
  private getHeaders(): HeadersInit {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }

  private getLocalStories(): Story[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORIES_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_STORIES;
  }

  private saveLocalStories(stories: Story[]): void {
    try {
      localStorage.setItem(LOCAL_STORIES_KEY, JSON.stringify(stories));
    } catch {
      // ignore
    }
  }

  public async getDashboardStats(): Promise<DashboardStats> {
    try {
      const res = await fetch('/api/admin/dashboard/stats', {
        headers: this.getHeaders(),
      });

      if (res.ok) {
        return await res.json();
      }
      if (res.status === 401) {
        authService.logout();
        throw new Error('Unauthorized session. Please log in again.');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Unauthorized')) throw err;
    }

    // Static fallback stats calculation
    const stories = this.getLocalStories();
    const totalStories = stories.length;
    const publishedStories = stories.filter((s) => s.published).length;
    const draftStories = stories.filter((s) => !s.published).length;
    const totalViews = stories.reduce((sum, s) => sum + (s.views || 0), 0);

    return {
      totalStories,
      publishedStories,
      draftStories,
      totalViews,
      adsEnabled: true,
      adsPerPage: 2,
      hasGlobalAdCode: true,
      recentUploads: stories.slice(0, 5).map((s) => ({
        id: s.id,
        title: s.title,
        slug: s.slug,
        category: s.category,
        uploadedDate: s.uploadDate || s.uploadedDate || new Date().toISOString(),
        views: s.views || 0,
        published: s.published,
      })),
    };
  }

  public async getStories(params?: { search?: string; category?: string; status?: 'published' | 'draft' | 'all' }): Promise<Story[]> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.category && params.category !== 'all') query.set('category', params.category);
      if (params?.status && params.status !== 'all') query.set('status', params.status);

      const res = await fetch(`/api/admin/stories?${query.toString()}`, {
        headers: this.getHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        const serverStories = data.stories || [];
        this.saveLocalStories(serverStories);
        return serverStories;
      }
      if (res.status === 401) {
        authService.logout();
        throw new Error('Unauthorized session.');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Unauthorized')) throw err;
    }

    // Static fallback
    let stories = this.getLocalStories();
    if (params?.category && params.category !== 'all') {
      stories = stories.filter((s) => s.category.toLowerCase() === params.category!.toLowerCase());
    }
    if (params?.status && params.status !== 'all') {
      stories = stories.filter((s) => (params.status === 'published' ? s.published : !s.published));
    }
    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      stories = stories.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.shortDescription.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return stories;
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
    try {
      const res = await fetch('/api/admin/stories', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(storyData),
      });

      if (res.ok) {
        const data = await res.json();
        const current = this.getLocalStories();
        this.saveLocalStories([data.story, ...current]);
        return data;
      }
      if (res.status === 400 || res.status === 401) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to publish story');
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch') && !err.message.includes('Failed to fetch')) {
        throw err;
      }
    }

    // Static fallback creation
    const slug = storyData.title
      .toLowerCase()
      .replace(/[^a-z0-9\u0D80-\u0DFF]+/g, '-')
      .replace(/(^-|-$)+/g, '') || `story-${Date.now()}`;

    const newStory: Story = {
      id: `story-${Date.now()}`,
      title: storyData.title,
      slug,
      coverImage: storyData.coverImage,
      shortDescription: storyData.shortDescription,
      fullContent: storyData.fullContent,
      category: storyData.category,
      tags: storyData.tags,
      author: {
        id: 'auth_admin',
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

    const current = this.getLocalStories();
    this.saveLocalStories([newStory, ...current]);

    return {
      message: 'Story created successfully (Saved to store)',
      story: newStory,
    };
  }

  public async updateStory(
    id: string,
    updates: Partial<Story> & { author?: any }
  ): Promise<{ message: string; story: Story }> {
    try {
      const res = await fetch(`/api/admin/stories/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const data = await res.json();
        const current = this.getLocalStories();
        this.saveLocalStories(current.map((s) => (s.id === id ? data.story : s)));
        return data;
      }
      if (res.status === 400 || res.status === 401) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update story');
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch') && !err.message.includes('Failed to fetch')) {
        throw err;
      }
    }

    // Static fallback update
    const current = this.getLocalStories();
    const existing = current.find((s) => s.id === id);
    if (!existing) throw new Error('Story not found');

    const updated: Story = {
      ...existing,
      ...updates,
      author: typeof updates.author === 'string' ? { name: updates.author } : updates.author || existing.author,
    };

    this.saveLocalStories(current.map((s) => (s.id === id ? updated : s)));
    return {
      message: 'Story updated successfully',
      story: updated,
    };
  }

  public async deleteStory(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/admin/stories/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (res.ok) {
        const current = this.getLocalStories();
        this.saveLocalStories(current.filter((s) => s.id !== id));
        return;
      }
    } catch {
      // ignore
    }

    const current = this.getLocalStories();
    this.saveLocalStories(current.filter((s) => s.id !== id));
  }

  public async getAdvertisementSettings(): Promise<{
    advertisements: AdvertisementSettings;
    postAdvertisements: Record<string, string>;
  }> {
    try {
      const res = await fetch('/api/admin/ads', {
        headers: this.getHeaders(),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }

    // Static fallback ads
    let ads: AdvertisementSettings = {
      globalAdCode: '<!-- Monetag Global Tag -->\n<div class="monetag-global-banner p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded text-center text-xs text-amber-800 dark:text-amber-300 font-medium"><a href="https://monetag.com" target="_blank" rel="noopener noreferrer" class="hover:underline flex items-center justify-center gap-1.5">⚡ Sponsored Story Pick — Discover Global Content (Opens in new tab)</a></div>',
      adsEnabled: true,
      adsPerPage: 2,
      headerAdCode: '',
      inArticleAdCode: '',
      footerAdCode: '',
      testMode: true,
    };
    try {
      const stored = localStorage.getItem(LOCAL_ADS_KEY);
      if (stored) ads = JSON.parse(stored);
    } catch {}

    let postAds: Record<string, string> = {};
    try {
      const stored = localStorage.getItem(LOCAL_POST_ADS_KEY);
      if (stored) postAds = JSON.parse(stored);
    } catch {}

    return { advertisements: ads, postAdvertisements: postAds };
  }

  public async updateAdvertisementSettings(
    settings: Partial<AdvertisementSettings>
  ): Promise<{ message: string; advertisements: AdvertisementSettings }> {
    try {
      const res = await fetch('/api/admin/ads', {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        const data = await res.json();
        try {
          localStorage.setItem(LOCAL_ADS_KEY, JSON.stringify(data.advertisements));
        } catch {}
        return data;
      }
    } catch {
      // ignore
    }

    const { advertisements: current } = await this.getAdvertisementSettings();
    const updated: AdvertisementSettings = {
      ...current,
      ...settings,
    };
    try {
      localStorage.setItem(LOCAL_ADS_KEY, JSON.stringify(updated));
    } catch {}

    return {
      message: 'Advertisement settings updated successfully',
      advertisements: updated,
    };
  }

  public async updateStoryAd(storyId: string, adCode: string): Promise<{ message: string }> {
    try {
      const res = await fetch(`/api/admin/stories/${storyId}/ad`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ adCode }),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }

    let postAds: Record<string, string> = {};
    try {
      const stored = localStorage.getItem(LOCAL_POST_ADS_KEY);
      if (stored) postAds = JSON.parse(stored);
    } catch {}

    postAds[storyId] = adCode;
    try {
      localStorage.setItem(LOCAL_POST_ADS_KEY, JSON.stringify(postAds));
    } catch {}

    return { message: 'Story ad updated successfully' };
  }

  public async getSiteSettings(): Promise<SiteSettings> {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: this.getHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        try {
          localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(data));
        } catch {}
        return data;
      }
    } catch {
      // ignore
    }

    try {
      const stored = localStorage.getItem(LOCAL_SETTINGS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}

    return {
      siteName: 'Walkathawa (වල් කතාව)',
      alternateName: 'වල් කතාව',
      logo: '/icon.png',
      tagline: 'A place to read Sinhala stories online',
      contactEmail: 'contact@walkathawa.com',
      metaTitle: 'Walkathawa (වල් කතාව) | Sinhala Stories Online',
      metaDescription:
        'Walkathawa (වල් කතාව) is a place to read Sinhala stories online. Discover new Sinhala katha, romantic stories, fictional stories, and interesting short stories updated regularly.',
      keywords:
        'walkatha, walakatha, walkathawa, වල් කතා, වල්කතා, sinhala stories, sinhala katha, sinhala short stories, sinhala kathandara, sinhala love stories, sinhala adult stories, sinhala romantic stories, sinhala fictional stories, sinhala novels, new sinhala stories, latest sinhala katha, online sinhala stories, read sinhala stories online',
      ogImage:
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      googleAnalyticsId: '',
      searchConsoleVerification: '',
      publisherName: 'Walkathawa (වල් කතාව)',
    };
  }

  public async updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        const data = await res.json();
        try {
          localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(data.settings));
        } catch {}
        return data.settings;
      }
    } catch {
      // ignore
    }

    const current = await this.getSiteSettings();
    const updated: SiteSettings = {
      ...current,
      ...settings,
    };
    try {
      localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(updated));
    } catch {}
    return updated;
  }
}

export const adminService = new AdminService();

