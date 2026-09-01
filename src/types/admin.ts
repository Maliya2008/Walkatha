export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'editor';
  createdAt: string;
}

export interface DirectAdSettings {
  enabled: boolean;
  globalDirectLink: string;
  maxTriggers: 1 | 2 | 3;
  updatedAt?: string;
}

export interface StoryAdvertisement {
  id?: string;
  storyId: string;
  directLink: string;
  enabled: boolean;
  createdAt: string;
}

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
  maxTriggers: number;
  hasGlobalDirectLink: boolean;
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
