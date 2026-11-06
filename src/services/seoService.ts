import { Story, Category } from '../types/story';

const SITE_URL = 'https://www.walkathawa.site';
const SITE_NAME = 'Walkathawa';
const DEFAULT_OG_IMAGE = `${SITE_URL}/icon.png`;

// Research-backed target keywords requested for Walkathawa
export const PRIMARY_SINHALA_KEYWORDS = [
  'සිංහල වැල කතා',
  'වල් කතා',
  'වැල කතා',
];

export const TARGET_SITE_KEYWORDS = [
  'සිංහල වැල කතා',
  'වල් කතා',
  'වැල කතා',
  'අම්මා වල් කතා 2026',
  'Wal Katha',
  'wala katha',
  'wela katha',
  'walkatha9',
  'sinhala wal katha',
  'Wela kathaa',
  'Sex Katha',
  'Sex Stories',
  'Wal Stories',
  'Sinhala Sex',
  'Sinhala Porn',
  'Free Download',
  'Sri Lanka',
  'new wela katha',
  'wal katha 9',
  'sinhala wela katha',
  'wal Katha sinhalen',
  'Ammai Puthai',
  'Paule wela Katha',
  'Sinhala wal wala wela katha',
  'amma katha',
  'family katha',
  'suparima katha',
  'walma',
  'wal katha kari katha',
  'eha gedara',
  'akka katha',
  'malli katha',
  'seeya katha',
  'husband katha',
  'wife katha',
  'hora katha',
  'New Wal Katha blogs',
  'wal chithra katha',
  'wal katha free',
  'sinhala sex katha',
  'sinhala wal katha blog',
  'nangita hukala',
  'campus',
  'amma malli',
  'akka',
  'birinda',
  'wife lingika paula',
  'rasama',
  'rasa wal katha',
  'wal katha fb',
];

/**
 * Enforces natural, non-stuffed titles strictly <= 60 characters
 */
export function formatCleanTitle(rawTitle: string): string {
  const cleaned = rawTitle
    .replace(/\s*[–|-]\s*(Sinhala\s+)?(Wal|Wela|Wala|Sex)\s+Katha.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  const suffix = ' | සිංහල වැල කතා';
  if (cleaned.length + suffix.length <= 60) {
    return `${cleaned}${suffix}`;
  }
  if (cleaned.length <= 60) {
    return cleaned;
  }
  return `${cleaned.slice(0, 57).replace(/\s+\S*$/, '')}...`;
}

/**
 * Enforces natural, non-stuffed meta descriptions strictly <= 160 characters
 */
export function formatCleanDescription(rawDesc: string, fallbackTitle?: string): string {
  const cleaned = (rawDesc || '')
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned || cleaned.length < 35) {
    const base = fallbackTitle
      ? `${fallbackTitle} - අලුත්ම සිංහල වැල කතා සහ වල් කතා එකතුවෙන් කියවන්න.`
      : 'අලුත්ම සිංහල වැල කතා, වල් කතා, අම්මා වල් කතා 2026 සහ පවුලේ වැල කතා 600කට වැඩි එකතුවක් නොමිලේ කියවන්න.';
    return base.slice(0, 158);
  }

  if (cleaned.length <= 158) {
    return cleaned;
  }

  return `${cleaned.slice(0, 155).replace(/\s+\S*$/, '')}...`;
}

export class SeoService {
  private static setMetaTag(attrName: 'name' | 'property', attrValue: string, content: string) {
    if (typeof document === 'undefined') return;
    let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attrName, attrValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  }

  private static setCanonical(url: string) {
    if (typeof document === 'undefined') return;
    const secureUrl = url.replace(/^http:\/\//i, 'https://');
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', secureUrl);
  }

  private static setJsonLd(id: string, schemaData: Record<string, any>) {
    if (typeof document === 'undefined') return;
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schemaData);
  }

  /**
   * Home & Category Page SEO (Title < 60 chars, Description < 160 chars, Schema.org CollectionPage + WebSite)
   */
  static updateHomeSeo(category?: Category | null, page = 1) {
    const isCategory = Boolean(category && category.slug && category.slug !== 'all');
    const pageSuffix = page > 1 ? ` - පිටුව ${page}` : '';

    const rawTitle = isCategory
      ? `${category?.sinhalaName || category?.name} | සිංහල වැල කතා${pageSuffix}`
      : `සිංහල වැල කතා | වල් කතා හා වැල කතා 2026${pageSuffix}`;

    const title = rawTitle.length <= 60 ? rawTitle : `${rawTitle.slice(0, 57)}...`;

    const rawDesc = isCategory
      ? `${category?.description || ''} අලුත්ම ${category?.sinhalaName || 'සිංහල වැල කතා'} සහ වල් කතා නොමිලේ කියවන්න.`
      : 'අලුත්ම සිංහල වැල කතා, වල් කතා, අම්මා වල් කතා 2026, අක්කා මල්ලි සහ පවුලේ වැල කතා 600කට වැඩි එකතුවක් නොමිලේ කියවන්න.';

    const description = formatCleanDescription(rawDesc);

    const basePath = isCategory
      ? `${SITE_URL}/category/${encodeURIComponent(category!.slug || category!.id)}`
      : SITE_URL;
    const canonicalUrl = page > 1 ? `${basePath}?page=${page}` : basePath;

    if (typeof document !== 'undefined') {
      document.title = title;
    }

    this.setMetaTag('name', 'description', description);
    this.setMetaTag('name', 'keywords', TARGET_SITE_KEYWORDS.join(', '));
    this.setMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1');

    this.setMetaTag('property', 'og:type', 'website');
    this.setMetaTag('property', 'og:site_name', SITE_NAME);
    this.setMetaTag('property', 'og:locale', 'si_LK');
    this.setMetaTag('property', 'og:title', title);
    this.setMetaTag('property', 'og:description', description);
    this.setMetaTag('property', 'og:url', canonicalUrl);
    this.setMetaTag('property', 'og:image', DEFAULT_OG_IMAGE);

    this.setMetaTag('name', 'twitter:card', 'summary_large_image');
    this.setMetaTag('name', 'twitter:title', title);
    this.setMetaTag('name', 'twitter:description', description);
    this.setMetaTag('name', 'twitter:image', DEFAULT_OG_IMAGE);

    this.setCanonical(canonicalUrl);

    this.setJsonLd('structured-data-jsonld', {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          url: SITE_URL,
          name: 'Walkathawa - සිංහල වැල කතා සහ වල් කතා',
          alternateName: ['සිංහල වැල කතා', 'වල් කතා', 'වැල කතා', 'Sinhala Wal Katha'],
          inLanguage: 'si-LK',
          description,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_URL}/?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
        {
          '@type': 'CollectionPage',
          '@id': `${canonicalUrl}#collection`,
          url: canonicalUrl,
          name: title,
          description,
          inLanguage: 'si-LK',
          isPartOf: { '@id': `${SITE_URL}/#website` },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: isCategory
            ? [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'මුල් පිටුව (සිංහල වැල කතා)',
                  item: SITE_URL,
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: category?.sinhalaName || category?.name || 'වර්ගීකරණය',
                  item: basePath,
                },
              ]
            : [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'මුල් පිටුව (සිංහල වැල කතා)',
                  item: SITE_URL,
                },
              ],
        },
      ],
    });
  }

  /**
   * Individual Story Page SEO (Title < 60 chars, Description < 160 chars, Schema.org Article + BreadcrumbList)
   */
  static updateStorySeo(story: Story) {
    const title = formatCleanTitle(story.title);
    const bodyText = story.fullContent || story.content || '';
    const description = formatCleanDescription(
      story.shortDescription || story.description || bodyText.slice(0, 160),
      story.title
    );
    const canonicalUrl = `${SITE_URL}/story/${encodeURIComponent(story.slug)}`;
    const imageUrl = story.coverImage || DEFAULT_OG_IMAGE;

    const storyKeywords = Array.from(
      new Set([
        ...PRIMARY_SINHALA_KEYWORDS,
        ...(story.tags || []),
        story.category || 'sinhala wal katha',
        'අම්මා වල් කතා 2026',
        'sinhala wela katha',
        'wal katha sinhalen',
      ])
    ).join(', ');

    const wordCount = story.wordCount || (bodyText ? bodyText.split(/\s+/).length : 800);
    const readingMinutes = story.readingTime || Math.max(3, Math.ceil(wordCount / 180));

    if (typeof document !== 'undefined') {
      document.title = title;
    }

    this.setMetaTag('name', 'description', description);
    this.setMetaTag('name', 'keywords', storyKeywords);
    this.setMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1');

    this.setMetaTag('property', 'og:type', 'article');
    this.setMetaTag('property', 'og:site_name', SITE_NAME);
    this.setMetaTag('property', 'og:locale', 'si_LK');
    this.setMetaTag('property', 'og:title', title);
    this.setMetaTag('property', 'og:description', description);
    this.setMetaTag('property', 'og:url', canonicalUrl);
    this.setMetaTag('property', 'og:image', imageUrl);

    this.setMetaTag('name', 'twitter:card', 'summary_large_image');
    this.setMetaTag('name', 'twitter:title', title);
    this.setMetaTag('name', 'twitter:description', description);
    this.setMetaTag('name', 'twitter:image', imageUrl);

    this.setCanonical(canonicalUrl);

    this.setJsonLd('structured-data-jsonld', {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          '@id': `${canonicalUrl}#article`,
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonicalUrl,
          },
          headline: title,
          name: story.title,
          description,
          inLanguage: 'si-LK',
          wordCount,
          timeRequired: `PT${readingMinutes}M`,
          articleSection: story.categoryName || story.category || 'සිංහල වැල කතා',
          keywords: storyKeywords,
          image: [imageUrl],
          datePublished: story.uploadDate || '2026-05-01T00:00:00.000Z',
          dateModified: story.updatedDate || story.uploadDate || new Date().toISOString(),
          author: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
          },
          publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            logo: {
              '@type': 'ImageObject',
              url: DEFAULT_OG_IMAGE,
            },
          },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'මුල් පිටුව (සිංහල වැල කතා)',
              item: SITE_URL,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: story.categoryName || story.category || 'වල් කතා',
              item: `${SITE_URL}/category/${encodeURIComponent(story.category || 'romantic')}`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: story.title,
              item: canonicalUrl,
            },
          ],
        },
      ],
    });
  }
}
