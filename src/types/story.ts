export interface Story {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  excerpt?: string;
  content?: string;
  fullContent?: string;
  wordCount?: number;
  category: string;
  categoryName?: string;
  categoryId?: string;
  tags: string[];
  coverImage?: string;
  views: number;
  likes?: number;
  readingTime?: number;
  readTime?: string;
  author?: string | { name: string; avatar?: string };
  featured?: boolean;
  published?: boolean;
  uploadDate?: string;
  uploadedDate?: string;
  updatedDate?: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  sinhalaName?: string;
  slug?: string;
  description?: string;
  storyCount?: number;
  icon?: string;
}

export type ReadingTheme = 'light' | 'dark' | 'sepia';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';

export interface StoryQueryParams {
  category?: string;
  search?: string;
  sortBy?: 'latest' | 'popular' | 'oldest';
  page?: number;
  limit?: number;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
}
