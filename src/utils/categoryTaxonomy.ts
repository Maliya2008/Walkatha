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
    id: 'school',
    slug: 'school',
    name: 'පාසල් කතා (School Stories)',
    sinhalaName: 'පාසල් කතා',
    description: 'පාසල්, පන්ති සහ ගුරු සිසු සබඳතා ඇසුරින් ලියවුණු කතා',
    aliases: [
      'school',
      'පාසල්-කතා',
      'පාසල් කතා (school stories)',
      'පාසල් කතා',
      'පාසල්',
      'school stories',
      'school-stories',
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
    ],
  },
  {
    id: 'romantic',
    slug: 'romantic',
    name: 'ආදර කතා (Romantic Stories)',
    sinhalaName: 'ආදර කතා',
    description: 'ආදරය, ප්‍රේමය සහ හැඟීම්බර සබඳතා ඇසුරින් ලියවුණු කතා',
    aliases: [
      'romantic',
      'ආදර-කතා',
      'ආදර කතා (romantic stories)',
      'ආදර කතා',
      'ආදර',
      'love',
      'romantic stories',
      'romantic-stories',
    ],
  },
];

/**
 * Normalizes any category string (English slug, Sinhala DB value, or alias)
 * to its canonical English URL slug: 'wife' | 'school' | 'akka-malli' | 'romantic'.
 * Defaults to 'wife' if not recognized.
 */
export function normalizeCategorySlug(raw: string | null | undefined): string {
  if (!raw) return 'wife';
  let clean = '';
  try {
    clean = decodeURIComponent(raw).trim().toLowerCase();
  } catch {
    clean = raw.trim().toLowerCase();
  }

  // Exact canonical match
  for (const cat of CANONICAL_CATEGORIES) {
    if (cat.slug === clean || cat.id === clean) {
      return cat.slug;
    }
  }

  // Alias match
  for (const cat of CANONICAL_CATEGORIES) {
    if (cat.aliases.some((alias) => alias.toLowerCase() === clean)) {
      return cat.slug;
    }
  }

  // Substring / partial match fallback
  if (clean.includes('වයිෆ්') || clean.includes('බිරිඳ') || clean.includes('wife')) return 'wife';
  if (clean.includes('පාසල්') || clean.includes('school')) return 'school';
  if (clean.includes('අක්කා') || clean.includes('මල්ලි') || clean.includes('akka')) return 'akka-malli';
  if (clean.includes('ආදර') || clean.includes('romantic') || clean.includes('love')) return 'romantic';

  return 'wife';
}

/**
 * Checks if a given slug is a canonical category slug.
 */
export function isValidCategorySlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  const clean = slug.trim().toLowerCase();
  return CANONICAL_CATEGORIES.some((c) => c.slug === clean);
}

/**
 * If the input slug is an alias or Sinhala representation of a category,
 * returns the canonical slug so callers can issue a 301 Permanent Redirect.
 * If already canonical or completely unknown, returns null.
 */
export function getCategoryCanonicalRedirectSlug(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let clean = '';
  try {
    clean = decodeURIComponent(raw).trim().toLowerCase();
  } catch {
    clean = raw.trim().toLowerCase();
  }

  if (isValidCategorySlug(clean)) {
    return null; // Already canonical, no redirect needed
  }

  for (const cat of CANONICAL_CATEGORIES) {
    if (cat.aliases.some((alias) => alias.toLowerCase() === clean)) {
      return cat.slug;
    }
  }

  // Substring checks for Sinhala URLs
  if (clean.includes('වයිෆ්') || clean.includes('බිරිඳ')) return 'wife';
  if (clean.includes('පාසල්')) return 'school';
  if (clean.includes('අක්කා') || clean.includes('මල්ලි')) return 'akka-malli';
  if (clean.includes('ආදර')) return 'romantic';

  return null;
}

/**
 * Returns full category definition object for a canonical slug or alias.
 */
export function getCategoryDefinition(slugOrAlias: string | null | undefined): CanonicalCategoryDefinition {
  const slug = normalizeCategorySlug(slugOrAlias);
  return CANONICAL_CATEGORIES.find((c) => c.slug === slug) || CANONICAL_CATEGORIES[0];
}

/**
 * Returns clean Sinhala display name for category badges, breadcrumbs, and titles.
 */
export function getCategoryDisplayName(slugOrAlias: string | null | undefined): string {
  const cat = getCategoryDefinition(slugOrAlias);
  return cat.name;
}

/**
 * Returns canonical category slug for a story object, inspecting all category fields.
 */
export function getStoryCanonicalCategory(story: Partial<Story> | null | undefined): string {
  if (!story) return 'wife';
  const candidate = (story as any).categorySlug || story.category || (story as any).categoryId || story.categoryName || '';
  return normalizeCategorySlug(candidate);
}

/**
 * Determines whether a story belongs to a target category.
 */
export function storyMatchesCategory(story: Partial<Story> | null | undefined, targetSlug: string): boolean {
  if (!story) return false;
  if (targetSlug === 'all') return true;
  const storyCategory = getStoryCanonicalCategory(story);
  const targetCategory = normalizeCategorySlug(targetSlug);
  return storyCategory === targetCategory;
}

/**
 * Formats a fully qualified canonical URL according to RFC 3986.
 */
export function formatCanonicalStoryUrl(baseUrl: string, slug: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  let cleanSlug = slug;
  try {
    cleanSlug = decodeURI(slug);
  } catch {
    cleanSlug = slug;
  }
  return `${cleanBase}/story/${encodeURI(cleanSlug)}`;
}

/**
 * Formats a canonical category URL.
 */
export function formatCanonicalCategoryUrl(baseUrl: string, categorySlug: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const canonicalSlug = normalizeCategorySlug(categorySlug);
  return `${cleanBase}/category/${canonicalSlug}`;
}
