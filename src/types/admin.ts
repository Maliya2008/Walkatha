export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'editor';
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
  totalCategories: number;
  totalViews: number;
  publishedStories: number;
  draftStories: number;
  recentUploads: Array<{
    id: string;
    title: string;
    slug: string;
    views: number;
    uploadDate: string;
    category: string;
  }>;
}
