export interface Story {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  views: number;
  likes: number;
  tags: string[];
  isFeatured?: boolean;
}

export interface StoryCategory {
  id: string;
  name: string;
  sinhalaName: string;
  description: string;
  icon: string;
  count: number;
}
