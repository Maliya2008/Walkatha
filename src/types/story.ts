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
  author?: any;
  readingTime?: number;
}

export interface StoryFilterParams {
  category?: string;
  search?: string;
  tag?: string;
  featuredOnly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'latest' | 'popular' | 'oldest';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  limit: number;
}

export type ReadingTheme = 'light' | 'sepia' | 'dark';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';
export type FontFamily = 'serif' | 'sans';
