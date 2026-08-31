export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'editor';
  createdAt: string;
}

export interface AdvertisementSettings {
  globalAdCode: string;
  adsEnabled: boolean;
  adsPerPage: 1 | 2 | 3;
  headerAdCode?: string;
  inArticleAdCode?: string;
  footerAdCode?: string;
  interstitialCode?: string;
  testMode?: boolean;
}

export interface PostAdvertisement {
  storyId: string;
  adCode: string;
  enabled: boolean;
  updatedAt: string;
}

export interface SiteSettings {
  siteName: string;
  logo: string;
  tagline: string;
  contactEmail: string;
  defaultSettings?: Record<string, unknown>;
}

export interface DashboardStats {
  totalStories: number;
  totalViews: number;
  publishedStories: number;
  draftStories: number;
  adsEnabled: boolean;
  adsPerPage: number;
  hasGlobalAdCode: boolean;
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
