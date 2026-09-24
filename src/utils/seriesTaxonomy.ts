import { Story } from '../types/story';
import {
  normalizeCategorySlug,
  getCategoryDisplayName,
} from './categoryTaxonomy';

export interface SeriesEpisode {
  episodeNumber: number;
  story: Story;
  title: string;
  slug: string;
  url: string;
  uploadDate: string;
  views: number;
  readingTime?: number;
}

export interface Series {
  id: string;
  slug: string;
  title: string;
  sinhalaTitle: string;
  description: string;
  category: string;
  categoryName: string;
  coverImage: string;
  episodes: SeriesEpisode[];
  totalEpisodes: number;
  isMultiEpisode: boolean;
  latestEpisodeNumber: number;
  updatedDate: string;
  views: number;
  authorName: string;
  url: string;
}

export interface SeriesDetectionResult {
  seriesId: string;
  seriesSlug: string;
  seriesTitle: string;
  sinhalaTitle: string;
  category: string;
  episodeNumber: number;
  isSeries: boolean;
}

/**
 * Normalizes title string by stripping zero-width spaces and normalizing dashes
 */
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\u200B/g, '')
    .replace(/\uFEFF/g, '')
    .replace(/[–—―]/g, '-')
    .trim();
}

/**
 * Translates or converts text to URL-friendly lowercase slug
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9\u0D80-\u0DFF]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Detects whether a story belongs to a series, extracting the series slug, title, and episode number.
 */
export function detectSeriesInfo(story: Partial<Story>): SeriesDetectionResult {
  const title = cleanText(story.title || '');
  const slug = cleanText(story.slug || '');
  const rawCat = story.category || (story as any)?.categorySlug || '';
  const canonicalCat = normalizeCategorySlug(rawCat);

  // 1. Dinithige Chat Eka (දිනිතිගෙ චැට් එක)
  if (
    title.includes('දිනිතිගෙ චැට්') ||
    slug.includes('දිනිතිගෙ-චැට්') ||
    slug.includes('dinithi') ||
    title.toLowerCase().includes('dinithi')
  ) {
    const epMatch =
      title.match(/(?:–|-|\b)(\d+)(?:–|-|\b)/) ||
      slug.match(/(?:-)(\d+)(?:-|$)/) ||
      title.match(/(\d+)/);
    const ep = epMatch ? parseInt(epMatch[1], 10) : 1;
    return {
      seriesId: 'dinithige-chat-eka',
      seriesSlug: 'dinithige-chat-eka',
      seriesTitle: 'දිනිතිගෙ චැට් එක (Dinithige Chat Eka)',
      sinhalaTitle: 'දිනිතිගෙ චැට් එක',
      category: 'wife',
      episodeNumber: ep,
      isSeries: true,
    };
  }

  // 2. School Amuthu Padama (ස්කෝලෙ අමුතු පාඩම)
  if (
    title.includes('ස්කෝලෙ අමුතු පාඩම') ||
    slug.includes('ස්කෝලෙ-අමුතු-පාඩම') ||
    slug.includes('school-wal-katha') ||
    title.toLowerCase().includes('school wal katha')
  ) {
    const epMatch =
      title.match(/(?:–|-|\b)(\d+)(?:–|-|\b)/) ||
      slug.match(/(?:-)(\d+)(?:-|$)/) ||
      title.match(/(\d+)/);
    const ep = epMatch ? parseInt(epMatch[1], 10) : 1;
    return {
      seriesId: 'school-amuthu-padama',
      seriesSlug: 'school-amuthu-padama',
      seriesTitle: 'ස්කෝලෙ අමුතු පාඩම (School Wal Katha)',
      sinhalaTitle: 'ස්කෝලෙ අමුතු පාඩම',
      category: 'school',
      episodeNumber: ep,
      isSeries: true,
    };
  }

  // 3. Mama Tharuka (මම තරුකා)
  if (
    title.includes('මම තරුකා') ||
    title.includes('මම තාරුකා') ||
    slug.includes('mama-tharuka') ||
    title.toLowerCase().includes('mama tharuka')
  ) {
    const ep = title.includes('මම තාරුකා-sinhala walkatha') ? 2 : 1;
    return {
      seriesId: 'mama-tharuka',
      seriesSlug: 'mama-tharuka',
      seriesTitle: 'මම තරුකා (Mama Tharuka)',
      sinhalaTitle: 'මම තරුකා',
      category: 'romantic',
      episodeNumber: ep,
      isSeries: true,
    };
  }

  // 4. Hithin Kala Adare (හිතින් කළ ආදරේ)
  if (title.includes('හිතින් කළ ආදරේ') || slug.includes('hithin-kala-adare')) {
    const epMatch = title.match(/(?:–|-|\b)(\d+)(?:–|-|\b)/) || title.match(/(\d+)/);
    const ep = epMatch ? parseInt(epMatch[1], 10) : 1;
    return {
      seriesId: 'hithin-kala-adare',
      seriesSlug: 'hithin-kala-adare',
      seriesTitle: 'හිතින් කළ ආදරේ (Hithin Kala Adare)',
      sinhalaTitle: 'හිතින් කළ ආදරේ',
      category: 'romantic',
      episodeNumber: ep,
      isSeries: true,
    };
  }

  // 5. Girls Trip (කෙල්ලො ගත්ත ෆන් එක)
  if (
    title.includes('කෙල්ලො ගත්ත ෆන්') ||
    slug.includes('girls-trip') ||
    title.toLowerCase().includes('girls trip')
  ) {
    const epMatch = title.match(/(?:–|-|\b)(\d+)(?:–|-|\b)/) || title.match(/(\d+)/);
    const ep = epMatch ? parseInt(epMatch[1], 10) : 1;
    return {
      seriesId: 'girls-trip',
      seriesSlug: 'girls-trip',
      seriesTitle: 'කෙල්ලො ගත්ත ෆන් එක (Girls Trip)',
      sinhalaTitle: 'කෙල්ලො ගත්ත ෆන් එක',
      category: 'akka-malli',
      episodeNumber: ep,
      isSeries: true,
    };
  }

  // 6. Generic pattern matching for other numbered series:
  // e.g. "Series Title - 2 - Extra" or "Series Title 2"
  const dashNumPattern = title.match(/^(.*?)\s*[-–]\s*(\d+)(?:\s*[-–]\s*(.*))?$/);
  if (dashNumPattern) {
    const baseName = dashNumPattern[1].trim();
    const ep = parseInt(dashNumPattern[2], 10);
    const baseSlug = slugify(baseName);
    return {
      seriesId: baseSlug,
      seriesSlug: baseSlug,
      seriesTitle: baseName,
      sinhalaTitle: baseName,
      category: canonicalCat,
      episodeNumber: ep,
      isSeries: true,
    };
  }

  const pipeNumPattern = title.match(/^(.*?)\s*(\d+)\s*\|\s*(.*?)\s*(\d+)$/);
  if (pipeNumPattern && pipeNumPattern[2] === pipeNumPattern[4]) {
    const baseName = `${pipeNumPattern[1].trim()} - ${pipeNumPattern[3].trim()}`;
    const ep = parseInt(pipeNumPattern[2], 10);
    const baseSlug = slugify(pipeNumPattern[1].trim());
    return {
      seriesId: baseSlug,
      seriesSlug: baseSlug,
      seriesTitle: baseName,
      sinhalaTitle: pipeNumPattern[1].trim(),
      category: canonicalCat,
      episodeNumber: ep,
      isSeries: true,
    };
  }

  // 7. Standalone story (single episode)
  const standaloneSlug = slugify(slug || title);
  return {
    seriesId: standaloneSlug,
    seriesSlug: standaloneSlug,
    seriesTitle: title,
    sinhalaTitle: title,
    category: canonicalCat,
    episodeNumber: 1,
    isSeries: false,
  };
}

/**
 * Returns canonical episode URL for a story
 * Format: /posts/{seriesSlug}/episodes/{episodeNumber}
 */
export function getEpisodeCanonicalUrl(story: Partial<Story>, baseUrl = ''): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const info = detectSeriesInfo(story);
  return `${cleanBase}/posts/${info.seriesSlug}/episodes/${info.episodeNumber}`;
}

/**
 * Returns canonical series hub URL
 * Format: /posts/{seriesSlug}/episodes
 */
export function getSeriesCanonicalUrl(seriesSlug: string, baseUrl = ''): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/posts/${seriesSlug}/episodes`;
}

/**
 * Groups an array of stories into structured Series objects with ordered episodes.
 */
export function groupStoriesIntoSeries(stories: Story[]): Series[] {
  const seriesMap = new Map<string, Series>();

  for (const story of stories) {
    if (!story || story.published === false) continue;

    const info = detectSeriesInfo(story);
    const normCat = normalizeCategorySlug(info.category || story.category);

    let series = seriesMap.get(info.seriesSlug);
    if (!series) {
      series = {
        id: info.seriesId,
        slug: info.seriesSlug,
        title: info.seriesTitle,
        sinhalaTitle: info.sinhalaTitle,
        description: story.shortDescription || story.description || '',
        category: normCat,
        categoryName: getCategoryDisplayName(normCat),
        coverImage: story.coverImage || 'https://www.walkathawa.site/icon.png',
        episodes: [],
        totalEpisodes: 0,
        isMultiEpisode: false,
        latestEpisodeNumber: info.episodeNumber,
        updatedDate: story.updatedDate || story.uploadDate || story.uploadedDate || new Date().toISOString(),
        views: 0,
        authorName: story.author?.name || 'Walkathawa',
        url: getSeriesCanonicalUrl(info.seriesSlug),
      };
      seriesMap.set(info.seriesSlug, series);
    }

    const episodeUrl = getEpisodeCanonicalUrl(story);
    const existingEpIndex = series.episodes.findIndex((e) => e.episodeNumber === info.episodeNumber);

    const seriesEpisode: SeriesEpisode = {
      episodeNumber: info.episodeNumber,
      story: {
        ...story,
        category: normCat,
        categoryName: getCategoryDisplayName(normCat),
      },
      title: story.title,
      slug: story.slug,
      url: episodeUrl,
      uploadDate: story.uploadDate || story.uploadedDate || story.updatedDate || new Date().toISOString(),
      views: Number(story.views || 0),
      readingTime: story.readingTime || 5,
    };

    if (existingEpIndex >= 0) {
      series.episodes[existingEpIndex] = seriesEpisode;
    } else {
      series.episodes.push(seriesEpisode);
    }

    series.views += Number(story.views || 0);

    // Keep the best cover image (e.g. from Episode 1 or non-empty)
    if (info.episodeNumber === 1 && story.coverImage) {
      series.coverImage = story.coverImage;
      if (story.shortDescription) {
        series.description = story.shortDescription;
      }
    }

    // Keep updated date latest
    const storyDate = new Date(story.updatedDate || story.uploadDate || 0).getTime();
    const seriesDate = new Date(series.updatedDate || 0).getTime();
    if (storyDate > seriesDate) {
      series.updatedDate = story.updatedDate || story.uploadDate || series.updatedDate;
    }
  }

  // Post-process each series: sort episodes, update total count
  const result: Series[] = [];
  for (const series of seriesMap.values()) {
    series.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
    series.totalEpisodes = series.episodes.length;
    series.isMultiEpisode = series.totalEpisodes > 1;
    series.latestEpisodeNumber =
      series.episodes.length > 0
        ? series.episodes[series.episodes.length - 1].episodeNumber
        : 1;

    result.push(series);
  }

  // Sort series by latest updated date descending
  return result.sort((a, b) => {
    const da = new Date(a.updatedDate || 0).getTime();
    const db = new Date(b.updatedDate || 0).getTime();
    return db - da;
  });
}

/**
 * Finds a series by its slug or Sinhala slug
 */
export function findSeriesBySlug(arg1: string | Series[] | Story[], arg2?: string | Series[] | Story[]): Series | null {
  let seriesSlug = '';
  let items: any[] = [];

  if (typeof arg1 === 'string') {
    seriesSlug = arg1;
    items = Array.isArray(arg2) ? arg2 : [];
  } else if (typeof arg2 === 'string') {
    seriesSlug = arg2;
    items = Array.isArray(arg1) ? arg1 : [];
  }

  if (!seriesSlug) return null;
  const decoded = decodeURIComponent(seriesSlug).toLowerCase().trim();

  // If items already are Series objects (they have 'episodes' property)
  const allSeries: Series[] = items.length > 0 && 'episodes' in items[0]
    ? (items as Series[])
    : groupStoriesIntoSeries(items as Story[]);

  return (
    allSeries.find(
      (s) =>
        s.slug.toLowerCase() === decoded ||
        s.id.toLowerCase() === decoded ||
        slugify(s.title) === decoded ||
        slugify(s.sinhalaTitle) === decoded
    ) || null
  );
}

/**
 * Finds a specific episode in a series by episode number
 */
export function findEpisodeInSeries(series: Series, episodeNumber: number): SeriesEpisode | null {
  if (!series || !series.episodes) return null;
  return series.episodes.find((e) => e.episodeNumber === episodeNumber) || null;
}

/**
 * Finds adjacent episodes (prev, next) in the same series
 */
export function getAdjacentEpisodesInSeries(
  series: Series,
  currentEpisodeNumber: number
): { prev: SeriesEpisode | null; next: SeriesEpisode | null } {
  if (!series || !series.episodes || series.episodes.length === 0) {
    return { prev: null, next: null };
  }

  const sorted = [...series.episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);
  const idx = sorted.findIndex((e) => e.episodeNumber === currentEpisodeNumber);

  if (idx === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: idx > 0 ? sorted[idx - 1] : null,
    next: idx < sorted.length - 1 ? sorted[idx + 1] : null,
  };
}
