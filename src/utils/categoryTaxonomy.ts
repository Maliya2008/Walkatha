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
    id: 'all',
    slug: 'all',
    name: 'සියලුම කතා (All Stories)',
    sinhalaName: 'සියලුම කතා',
    description: 'Walkathawa හි ඇති සියලුම අලුත් සහ රසවත් සිංහල කතා එකතුව',
    aliases: ['all', 'සියලුම', 'සියල්ල', 'all stories', 'all-stories'],
  },
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
    description: 'අක්කා මල්ලි සහ සමීප සබඳතා පිළිබඳ රසවත් කතා',
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
    name: 'ආදර සහ ප්‍රේම (Romantic Stories)',
    sinhalaName: 'ආදර සහ ප්‍රේම',
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
  {
    id: 'office',
    slug: 'office',
    name: 'කාර්යාල සහ රැකියා (Office Stories)',
    sinhalaName: 'කාර්යාල සහ රැකියා',
    description: 'කාර්යාලීය පරිසරයන් සහ රැකියා ස්ථානවල රසවත් සිදුවීම්',
    aliases: ['office', 'කාර්යාල', 'රැකියා', 'office stories', 'workplace'],
  },
  {
    id: 'neighbour',
    slug: 'neighbour',
    name: 'අසල්වැසි සහ ගම්බද (Neighbour Stories)',
    sinhalaName: 'අසල්වැසි සහ ගම්බද',
    description: 'අසල්වැසි ගෙවල් සහ ගම්බද පරිසරයන් ආශ්‍රිත කතා',
    aliases: ['neighbour', 'අසල්වැසි', 'ගම්බද', 'neighbor', 'village'],
  },
  {
    id: 'series',
    slug: 'series',
    name: 'දීර්ඝ කතා මාලා (Story Series)',
    sinhalaName: 'දීර්ඝ කතා මාලා',
    description: 'කොටස් වශයෙන් ලියැවෙන රසවත් දීර්ඝ සිංහල කතා මාලා',
    aliases: ['series', 'කතා මාලා', 'දීර්ඝ කතා', 'episodes', 'novel'],
  },
  {
    id: 'short-stories',
    slug: 'short-stories',
    name: 'කෙටිකතා එකතුව (Short Stories)',
    sinhalaName: 'කෙටිකතා එකතුව',
    description: 'එකවර කියවා රසවිඳිය හැකි අපූරු සිංහල කෙටිකතා',
    aliases: ['short-stories', 'කෙටිකතා', 'short', 'short stories'],
  },
  {
    id: 'boarding',
    slug: 'boarding',
    name: 'බෝඩිං ජීවිතේ (Boarding Stories)',
    sinhalaName: 'බෝඩිං ජීවිතේ',
    description: 'බෝඩිං කාමර සහ නවාතැන්පොළවල අමතක නොවන අත්දැකීම්',
    aliases: ['boarding', 'බෝඩිං', 'bodim', 'hostel'],
  },
  {
    id: 'travel',
    slug: 'travel',
    name: 'චාරිකා සහ විනෝද (Travel Stories)',
    sinhalaName: 'චාරිකා සහ විනෝද',
    description: 'ට්‍රිප්, විනෝද චාරිකා සහ ගමන් බිමන් වලදී වූ සිදුවීම්',
    aliases: ['travel', 'චාරිකා', 'ට්‍රිප්', 'trip'],
  },
  {
    id: 'family',
    slug: 'family',
    name: 'පවුලේ කතාන්දර (Family Stories)',
    sinhalaName: 'පවුලේ කතාන්දර',
    description: 'පවුලේ විවිධ සබඳතා සහ ගෙදරදොර සිදුවීම්',
    aliases: ['family', 'පවුලේ', 'family stories'],
  },
  {
    id: 'true-story',
    slug: 'true-story',
    name: 'සත්‍ය අත්දැකීම් (True Experiences)',
    sinhalaName: 'සත්‍ය අත්දැකීම්',
    description: 'පාඨකයන් අප වෙත එවූ සත්‍ය ජීවිත අත්දැකීම්',
    aliases: ['true-story', 'සත්‍ය', 'real', 'true', 'experience'],
  },
  {
    id: 'mystery',
    slug: 'mystery',
    name: 'අභිරහස් සහ ත්‍රාසජනක (Mystery Stories)',
    sinhalaName: 'අභිරහස් සහ ත්‍රාසජනක',
    description: 'කුතුහලය සහ ත්‍රාසය පිරි අපූරු අභිරහස් කතා',
    aliases: ['mystery', 'අභිරහස්', 'ත්‍රාසජනක', 'thriller'],
  },
  {
    id: 'chat',
    slug: 'chat',
    name: 'චැට් සහ දුරකථන (Chat Stories)',
    sinhalaName: 'චැට් සහ දුරකථන',
    description: 'සමාජ මාධ්‍ය සහ දුරකථන සංවාද ඔස්සේ ගෙතුණු කතා',
    aliases: ['chat', 'චැට්', 'දුරකථන', 'phone', 'messaging'],
  },
  {
    id: 'fantasy',
    slug: 'fantasy',
    name: 'මනඃකල්පිත කතා (Fantasy & Fiction)',
    sinhalaName: 'මනඃකල්පිත කතා',
    description: 'කල්පනා ලෝකයේ රසබර අත්දැකීම් ගෙනෙන කතා',
    aliases: ['fantasy', 'මනඃකල්පිත', 'fiction'],
  },
  {
    id: 'drama',
    slug: 'drama',
    name: 'සමාජ හා නාට්‍යමය (Drama & Life)',
    sinhalaName: 'සමාජ හා නාට්‍යමය',
    description: 'සමාජයේ නොදුටු පැතිකඩ හෙළිදරව් කරන කතා',
    aliases: ['drama', 'සමාජ', 'නාට්‍යමය', 'life'],
  },
  {
    id: 'classic',
    slug: 'classic',
    name: 'සම්භාව්‍ය සහ පැරණි (Classic Tales)',
    sinhalaName: 'සම්භාව්‍ය සහ පැරණි',
    description: 'ඉතිහාසයේ රසවත් පැරණි සිංහල කතා එකතුව',
    aliases: ['classic', 'සම්භාව්‍ය', 'පැරණි', 'old'],
  },
  {
    id: 'popular',
    slug: 'popular',
    name: 'ජනප්‍රියම කතා (Most Popular)',
    sinhalaName: 'ජනප්‍රියම කතා',
    description: 'වැඩිම පිරිසක් කියවා ප්‍රිය කළ ජනප්‍රිය කතා',
    aliases: ['popular', 'ජනප්‍රිය', 'trending', 'top'],
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
