import { Category, Story } from '../types/story';

export interface CanonicalCategoryDefinition {
  id: string;
  slug: string;
  name: string;
  sinhalaName: string;
  description: string;
  aliases: string[];
}

export const CANONICAL_CATEGORIES: CanonicalCategoryDefinition[] = [
  {
    id: 'wife',
    slug: 'wife',
    name: 'වයිෆ් / බිරිඳ (Wife Stories)',
    sinhalaName: 'වයිෆ් / බිරිඳ',
    description: 'බිරිඳ, වයිෆ් සහ පවුලේ සත්‍ය අත්දැකීම් ඇසුරින් ලියවුණු කතා',
    aliases: [
      'wife',
      'වයිෆ්-බිරිඳ',
      'වයිෆ් / බිරිඳ (wife stories)',
      'වයිෆ් / බිරිඳ',
      'වයිෆ්',
      'බිරිඳ',
      'wife stories',
      'wife-stories',
    ],
  },
  {
    id: 'akka-malli',
    slug: 'akka-malli',
    name: 'අක්කා - මල්ලි (Akka Malli)',
    sinhalaName: 'අක්කා - මල්ලි',
    description: 'අක්කා මල්ලි සහ අසල්වැසි සබඳතා පිළිබඳ රසවත් කතා',
    aliases: [
      'akka-malli',
      'අක්කා-මල්ලි',
      'අක්කා - මල්ලි (akka malli)',
      'අක්කා - මල්ලි',
      'අක්කා මල්ලි',
      'akka malli',
      'akkamalli',
      'අක්කා',
      'නංගි',
    ],
  },
  {
    id: 'nanda',
    slug: 'nanda',
    name: 'නැන්දා / ඇන්ටි (Nanda Stories)',
    sinhalaName: 'නැන්දා / ඇන්ටි',
    description: 'නැන්දා, ඇන්ටි සහ වැඩිහිටි ආදර කතා එකතුව',
    aliases: [
      'nanda',
      'නැන්දා',
      'ඇන්ටි',
      'aunty',
      'nanda-aunty',
      'නැන්දා / ඇන්ටි',
    ],
  },
  {
    id: 'school',
    slug: 'school',
    name: 'පාසල් සහ කැම්පස් (School & Campus)',
    sinhalaName: 'පාසල් සහ කැම්පස්',
    description: 'පාසල්, පන්ති සහ ගුරු සිසු සබඳතා ඇසුරින් ලියවුණු කතා',
    aliases: [
      'school',
      'පාසල්-කතා',
      'පාසල් කතා (school stories)',
      'පාසල් කතා',
      'පාසල්',
      'කැම්පස්',
      'campus',
      'school stories',
    ],
  },
  {
    id: 'romantic',
    slug: 'romantic',
    name: 'ආදර සහ වෙනත් (Romantic & Other)',
    sinhalaName: 'ආදර සහ වෙනත්',
    description: 'ආදරය, ප්‍රේමය සහ හැඟීම්බර සබඳතා ඇසුරින් ලියවුණු කතා',
    aliases: [
      'romantic',
      'ආදර-කතා',
      'ආදර කතා (romantic stories)',
      'ආදර කතා',
      'ආදර',
      'love',
      'romantic stories',
      'other',
    ],
  },
];

export function normalizeCategorySlug(raw: string | null | undefined): string {
  if (!raw) return 'all';
  let clean = '';
  try {
    clean = decodeURIComponent(raw).trim().toLowerCase();
  } catch {
    clean = raw.trim().toLowerCase();
  }

  if (clean === 'all' || clean === 'සියලුම' || clean === 'සියල්ල') {
    return 'all';
  }

  for (const cat of CANONICAL_CATEGORIES) {
    if (cat.slug === clean || cat.id === clean) {
      return cat.slug;
    }
  }

  for (const cat of CANONICAL_CATEGORIES) {
    if (cat.aliases.some((alias) => alias.toLowerCase() === clean)) {
      return cat.slug;
    }
  }

  if (clean.includes('වයිෆ්') || clean.includes('බිරිඳ') || clean.includes('wife')) return 'wife';
  if (clean.includes('අක්කා') || clean.includes('මල්ලි') || clean.includes('akka')) return 'akka-malli';
  if (clean.includes('නැන්දා') || clean.includes('ඇන්ටි') || clean.includes('nanda') || clean.includes('aunty')) return 'nanda';
  if (clean.includes('පාසල්') || clean.includes('කැම්පස්') || clean.includes('school') || clean.includes('campus')) return 'school';
  if (clean.includes('ආදර') || clean.includes('romantic') || clean.includes('love')) return 'romantic';

  return 'wife';
}

export function isValidCategorySlug(slug: string): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase().trim();
  if (s === 'all') return true;
  return CANONICAL_CATEGORIES.some((c) => c.slug === s);
}

export function getCategoryDefinition(slug: string): CanonicalCategoryDefinition | undefined {
  const norm = normalizeCategorySlug(slug);
  return CANONICAL_CATEGORIES.find((c) => c.slug === norm);
}

export function getCategoryDisplayName(slug: string): string {
  if (!slug || slug === 'all') return 'සියලුම කතා (All Stories)';
  const def = getCategoryDefinition(slug);
  return def ? def.name : slug;
}

export function getStoryCanonicalCategory(story: Story): string {
  if (story.categoryId && isValidCategorySlug(story.categoryId)) {
    return story.categoryId;
  }
  return normalizeCategorySlug(story.category || story.categoryName);
}

export function storyMatchesCategory(story: Story, categoryFilterSlug: string): boolean {
  if (!categoryFilterSlug || categoryFilterSlug === 'all') {
    return true;
  }
  const filterNorm = normalizeCategorySlug(categoryFilterSlug);
  const storyNorm = getStoryCanonicalCategory(story);
  return storyNorm === filterNorm;
}
