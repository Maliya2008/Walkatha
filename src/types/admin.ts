export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'editor';
  createdAt: string;
}

export interface AdvertisementSettings {
  id?: string;
  enabled: boolean;
  globalAdCode: string;
  redirectAmount: 1 | 2 | 3;
  updatedAt?: string;
  globalDirectLink?: string;
  maxTriggers?: 1 | 2 | 3;
}

// Backward-compatible alias
export type DirectAdSettings = {
  enabled: boolean;
  globalAdCode?: string;
  redirectAmount?: 1 | 2 | 3;
  globalDirectLink?: string;
  maxTriggers?: 1 | 2 | 3;
  id?: string;
  updatedAt?: string;
};

export interface SiteSettings {
  siteName: string;
  alternateName?: string;
  logo: string;
  tagline: string;
  contactEmail: string;
  // SEO Configuration
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  ogImage: string;
  googleAnalyticsId?: string;
  searchConsoleVerification?: string;
  publisherName?: string;
  defaultSettings?: Record<string, unknown>;
}

export interface DashboardStats {
  totalStories: number;
  totalViews: number;
  publishedStories: number;
  draftStories: number;
  adsEnabled: boolean;
  redirectAmount: number;
  hasGlobalAdCode: boolean;
  maxTriggers?: number;
  hasGlobalDirectLink?: boolean;
  recentUploads: Array<{
    id: string;
    title: string;
    slug: string;
    category: string;
    uploadedDate: string;
    views: number;
    published: boolean;
  }>;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: number;
}
