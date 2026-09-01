export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  storyCount?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface Story {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  shortDescription: string;
  description?: string;
  fullContent: string;
  content?: string;
  categoryId?: string;
  category: string; // Category slug
  categoryName?: string;
  tags: string[];
  uploadDate: string; // ISO String format
  uploadedDate?: string;
  updatedDate: string;
  createdAt?: any;
  updatedAt?: any;
  views: number;
  featured: boolean;
  published: boolean;
  metaTitle?: string;
  metaDescription?: string;
  // Optional backwards-compatible fields for external seed data
  author?: any;
  readingTime?: number;
  directAdLink?: string;
}

export interface StoryFilterParams {
  category?: string;
  search?: string;
  tag?: string;
  featuredOnly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'latest' | 'popular';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export type ReadingTheme = 'light' | 'sepia' | 'dark';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';
export type FontFamily = 'serif' | 'sans';

export interface MonetagAdConfig {
  headerZoneId?: string;
  inArticleZoneId?: string;
  sidebarZoneId?: string;
  footerZoneId?: string;
  interstitialZoneId?: string;
  enabled: boolean;
  testMode: boolean;
}
