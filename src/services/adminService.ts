import { Story } from '../types/story';
import { AdvertisementSettings, DashboardStats, SiteSettings } from '../types/admin';
import { authService } from './authService';

class AdminService {
  private getHeaders(): HeadersInit {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }

  public async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch('/api/admin/dashboard/stats', {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        throw new Error('Unauthorized session. Please log in again.');
      }
      throw new Error('Failed to fetch dashboard metrics');
    }

    return res.json();
  }

  public async getStories(params?: { search?: string; category?: string; status?: 'published' | 'draft' | 'all' }): Promise<Story[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.status && params.status !== 'all') query.set('status', params.status);

    const res = await fetch(`/api/admin/stories?${query.toString()}`, {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        throw new Error('Unauthorized session.');
      }
      throw new Error('Failed to fetch stories list');
    }

    const data = await res.json();
    return data.stories || [];
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
    const res = await fetch('/api/admin/stories', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(storyData),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to publish story');
    }

    return res.json();
  }

  public async updateStory(
    id: string,
    updates: Partial<Story> & { author?: any }
  ): Promise<{ message: string; story: Story }> {
    const res = await fetch(`/api/admin/stories/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update story');
    }

    return res.json();
  }

  public async deleteStory(id: string): Promise<void> {
    const res = await fetch(`/api/admin/stories/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete story');
    }
  }

  public async getAdvertisementSettings(): Promise<{
    advertisements: AdvertisementSettings;
    postAdvertisements: Record<string, string>;
  }> {
    const res = await fetch('/api/admin/ads', {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error('Failed to load advertisement settings');
    }

    return res.json();
  }

  public async updateAdvertisementSettings(
    settings: Partial<AdvertisementSettings>
  ): Promise<{ message: string; advertisements: AdvertisementSettings }> {
    const res = await fetch('/api/admin/ads', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update advertisement settings');
    }

    return res.json();
  }

  public async updateStoryAd(storyId: string, adCode: string): Promise<{ message: string }> {
    const res = await fetch(`/api/admin/stories/${storyId}/ad`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ adCode }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update individual story ad code');
    }

    return res.json();
  }

  public async getSiteSettings(): Promise<SiteSettings> {
    const res = await fetch('/api/admin/settings', {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error('Failed to fetch site settings');
    }

    return res.json();
  }

  public async updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    });

    if (!res.ok) {
      throw new Error('Failed to update site settings');
    }

    const data = await res.json();
    return data.settings;
  }
}

export const adminService = new AdminService();
