export interface Story {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  shortDescription?: string;
  description?: string;
  fullContent?: string;
  content: string;
  coverImage?: string;
  category: string;
  categoryName?: string;
  categoryId?: string;
  author?: string | { name: string };
  date?: string;
  uploadDate?: string;
  uploadedDate?: string;
  updatedDate?: string;
  createdAt?: string;
  readTime?: string;
  readingTime?: number;
  views: number;
  likes?: number;
  tags: string[];
  isFeatured?: boolean;
  featured?: boolean;
  published?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  storyCount?: number;
  icon?: string;
  sinhalaName?: string;
}

export interface StoryCategory extends Category {
  sinhalaName: string;
  icon: string;
  count: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  limit: number;
}

export interface StoryFilterParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sortBy?: 'latest' | 'popular' | 'oldest';
}

export type ReadingTheme = 'navy' | 'dark' | 'light' | 'sepia';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';
export type FontFamily = 'sans' | 'serif' | 'sinhala';
