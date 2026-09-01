export interface Author {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  storyCount?: number;
}

export interface Story {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  shortDescription: string;
  fullContent: string; // Markdown or clean formatted HTML/paragraphs
  category: string; // Category slug or ID
  categoryName?: string;
  tags: string[];
  author: Author;
  uploadDate: string; // ISO String format (e.g. 2026-08-31T09:00:00Z)
  uploadedDate?: string; // Database field alias
  updatedDate: string;
  readingTime: number; // in minutes
  views: number;
  featured: boolean;
  published: boolean;
  directAdLink?: string; // Direct link URL for this specific story
  metaTitle?: string;
  metaDescription?: string;
}

export interface StoryFilterParams {
  category?: string;
  search?: string;
  tag?: string;
  featuredOnly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'latest' | 'popular' | 'readingTime';
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
