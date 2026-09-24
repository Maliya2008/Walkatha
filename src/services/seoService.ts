import { Story } from '../types/story';
import { SiteSettings } from '../types/admin';
import { Series, detectSeriesInfo } from '../utils/seriesTaxonomy';
import { getStoryCanonicalCategory, getCategoryDisplayName } from '../utils/categoryTaxonomy';

export const CANONICAL_SITE_URL = 'https://www.walkathawa.site';

export interface SEOData {
  title?: string;
  rawTitle?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  categorySlug?: string;
  categoryName?: string;
  noIndex?: boolean;
  seriesData?: {
    seriesSlug: string;
    seriesTitle: string;
    totalEpisodes: number;
    categorySlug: string;
    categoryName: string;
  };
  articleData?: {
    publishedTime: string;
    modifiedTime: string;
    authorName: string;
    section: string;
    tags: string[];
    slug?: string;
    seriesSlug?: string;
    seriesTitle?: string;
    episodeNumber?: number;
  };
}

export class SEOService {
  public static readonly SITE_NAME = 'Walkathawa (වල් කතාව)';
  public static readonly ALTERNATE_NAME = 'වල් කතාව';
  public static readonly DEFAULT_TITLE = 'Walkathawa (වල් කතාව) | Sinhala Stories Online';
  public static readonly DEFAULT_DESCRIPTION =
    'Walkathawa (වල් කතාව) is a place to read Sinhala stories online. Discover new Sinhala katha, romantic stories, fictional stories, and interesting short stories updated regularly.';
  public static readonly DEFAULT_KEYWORDS =
    'Walkathawa, Sinhala stories, wal katha, wela katha, සිංහල කතා, sinhala short stories';
  public static readonly DEFAULT_IMAGE =
    'https://www.walkathawa.site/icon.png';

  /**
   * Updates HTML Document Head with complete Sinhala SEO, Open Graph, Twitter, and Schema.org Metadata
   */
  public static updateHead(seo: SEOData, settings?: Partial<SiteSettings>): void {
    const siteTitle = settings?.siteName || this.SITE_NAME;
    const finalTitle = seo.title
      ? `${seo.title} | ${siteTitle}`
      : settings?.metaTitle || this.DEFAULT_TITLE;

    const description =
      seo.description || settings?.metaDescription || this.DEFAULT_DESCRIPTION;
    const keywords =
      seo.keywords || settings?.keywords || this.DEFAULT_KEYWORDS;
    const image =
      seo.ogImage || settings?.ogImage || this.DEFAULT_IMAGE;
    const url = seo.canonicalUrl || `${CANONICAL_SITE_URL}/`;

    // Document Title
    document.title = finalTitle;

    // Standard Meta Tags
    this.setMeta('name', 'description', description);
    this.setMeta('name', 'keywords', keywords);

    // Dynamic Robots Tag
    if (seo.noIndex) {
      this.setMeta('name', 'robots', 'noindex, follow');
    } else {
      this.setMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }

    // Open Graph
    this.setMeta('property', 'og:title', finalTitle);
    this.setMeta('property', 'og:description', description);
    this.setMeta('property', 'og:image', image);
    this.setMeta('property', 'og:url', url);
    this.setMeta('property', 'og:type', seo.ogType || 'website');
    this.setMeta('property', 'og:site_name', siteTitle);
    this.setMeta('property', 'og:locale', 'si_LK');

    // Article Specific Open Graph Tags
    if (seo.ogType === 'article' && seo.articleData) {
      this.setMeta('property', 'article:published_time', seo.articleData.publishedTime);
      this.setMeta('property', 'article:modified_time', seo.articleData.modifiedTime);
      this.setMeta('property', 'article:author', seo.articleData.authorName);
      this.setMeta('property', 'article:section', seo.articleData.section);
      if (seo.articleData.tags && seo.articleData.tags.length > 0) {
        this.setMeta('property', 'article:tag', seo.articleData.tags.join(', '));
      }
    } else {
      this.removeMeta('property', 'article:published_time');
      this.removeMeta('property', 'article:modified_time');
      this.removeMeta('property', 'article:author');
      this.removeMeta('property', 'article:section');
      this.removeMeta('property', 'article:tag');
    }

    // Twitter Card
    this.setMeta('name', 'twitter:card', 'summary_large_image');
    this.setMeta('name', 'twitter:title', finalTitle);
    this.setMeta('name', 'twitter:description', description);
    this.setMeta('name', 'twitter:image', image);

    // Canonical Link
    this.setCanonical(url);

    // Schema.org Structured Data
    this.updateStructuredData(seo, settings, url);
  }

  private static setMeta(attrName: 'name' | 'property', attrValue: string, content: string): void {
    let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attrName, attrValue);
      document.head.appendChild(element);
    }
    element.content = content;
  }

  private static removeMeta(attrName: 'name' | 'property', attrValue: string): void {
    const element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (element) {
      element.remove();
    }
  }

  private static setCanonical(url: string): void {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
  }

  private static updateStructuredData(seo: SEOData, settings?: Partial<SiteSettings>, canonicalUrl = `${CANONICAL_SITE_URL}/`): void {
    let script = document.getElementById('schema-structured-data') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'schema-structured-data';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    const siteName = settings?.siteName || this.SITE_NAME;
    const publisherName = settings?.siteName || 'Walkathawa (වල් කතාව)';
    const logoUrl = `${CANONICAL_SITE_URL}/icon.png`;

    if (seo.ogType === 'article' && seo.articleData) {
      // Hierarchical Breadcrumbs: Home > Category > Story/Series > Episode
      const section = seo.articleData.section;
      const sectionSlug = encodeURIComponent(section.toLowerCase());
      const hasSeries = Boolean(seo.articleData.seriesSlug);
      const seriesSlug = seo.articleData.seriesSlug || 'story';
      const seriesTitle = seo.articleData.seriesTitle || seo.title;
      const episodeNum = seo.articleData.episodeNumber || 1;

      const breadcrumbItems: any[] = [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Home',
          'item': `${CANONICAL_SITE_URL}/`
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': section,
          'item': `${CANONICAL_SITE_URL}/category/${sectionSlug}`
        }
      ];

      if (hasSeries) {
        breadcrumbItems.push({
          '@type': 'ListItem',
          'position': 3,
          'name': seriesTitle,
          'item': `${CANONICAL_SITE_URL}/posts/${seriesSlug}/episodes`
        });
        breadcrumbItems.push({
          '@type': 'ListItem',
          'position': 4,
          'name': `Episode ${episodeNum}`,
          'item': canonicalUrl
        });
      } else {
        breadcrumbItems.push({
          '@type': 'ListItem',
          'position': 3,
          'name': seo.title,
          'item': canonicalUrl
        });
      }

      const articleGraph = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Article',
            '@id': `${canonicalUrl}#article`,
            'isPartOf': {
              '@type': 'WebSite',
              '@id': `${CANONICAL_SITE_URL}/#website`,
              'name': siteName,
              'alternateName': this.ALTERNATE_NAME,
              'url': `${CANONICAL_SITE_URL}/`
            },
            'headline': seo.title,
            'description': seo.description,
            'image': seo.ogImage || this.DEFAULT_IMAGE,
            'datePublished': seo.articleData.publishedTime,
            'dateModified': seo.articleData.modifiedTime,
            'inLanguage': 'si',
            'author': {
              '@type': 'Person',
              'name': seo.articleData.authorName
            },
            'publisher': {
              '@type': 'Organization',
              '@id': `${CANONICAL_SITE_URL}/#organization`,
              'name': publisherName,
              'alternateName': this.ALTERNATE_NAME,
              'url': `${CANONICAL_SITE_URL}/`,
              'logo': {
                '@type': 'ImageObject',
                'url': logoUrl
              }
            },
            'mainEntityOfPage': {
              '@type': 'WebPage',
              '@id': canonicalUrl
            },
            'articleSection': seo.articleData.section,
            'keywords': seo.articleData.tags.join(', ')
          },
          {
            '@type': 'BreadcrumbList',
            '@id': `${canonicalUrl}#breadcrumb`,
            'itemListElement': breadcrumbItems
          }
        ]
      };
      script.textContent = JSON.stringify(articleGraph, null, 2);
    } else if (seo.seriesData) {
      // Series Hub Schema: CollectionPage + BreadcrumbList + CreativeWorkSeries
      const { seriesSlug, seriesTitle, categorySlug, categoryName } = seo.seriesData;
      const seriesGraph = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': ['CollectionPage', 'CreativeWorkSeries'],
            '@id': `${canonicalUrl}#series`,
            'url': canonicalUrl,
            'name': `${seriesTitle} | ${siteName}`,
            'headline': seriesTitle,
            'description': seo.description,
            'inLanguage': 'si',
            'isPartOf': {
              '@type': 'WebSite',
              '@id': `${CANONICAL_SITE_URL}/#website`,
              'name': siteName,
              'alternateName': this.ALTERNATE_NAME,
              'url': `${CANONICAL_SITE_URL}/`
            }
          },
          {
            '@type': 'BreadcrumbList',
            '@id': `${canonicalUrl}#breadcrumb`,
            'itemListElement': [
              {
                '@type': 'ListItem',
                'position': 1,
                'name': 'Home',
                'item': `${CANONICAL_SITE_URL}/`
              },
              {
                '@type': 'ListItem',
                'position': 2,
                'name': categoryName,
                'item': `${CANONICAL_SITE_URL}/category/${categorySlug}`
              },
              {
                '@type': 'ListItem',
                'position': 3,
                'name': seriesTitle,
                'item': canonicalUrl
              }
            ]
          }
        ]
      };
      script.textContent = JSON.stringify(seriesGraph, null, 2);
    } else if (seo.categorySlug && seo.categorySlug !== 'all') {
      // Category CollectionPage Schema Graph + Breadcrumbs
      const catDisplayName = seo.categoryName || seo.categorySlug;
      const categoryGraph = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CollectionPage',
            '@id': `${canonicalUrl}#webpage`,
            'url': canonicalUrl,
            'name': `${catDisplayName} Stories | ${siteName}`,
            'description': seo.description,
            'inLanguage': 'si',
            'isPartOf': {
              '@type': 'WebSite',
              '@id': `${CANONICAL_SITE_URL}/#website`,
              'name': siteName,
              'alternateName': this.ALTERNATE_NAME,
              'url': `${CANONICAL_SITE_URL}/`
            }
          },
          {
            '@type': 'BreadcrumbList',
            '@id': `${canonicalUrl}#breadcrumb`,
            'itemListElement': [
              {
                '@type': 'ListItem',
                'position': 1,
                'name': 'Home',
                'item': `${CANONICAL_SITE_URL}/`
              },
              {
                '@type': 'ListItem',
                'position': 2,
                'name': catDisplayName,
                'item': canonicalUrl
              }
            ]
          }
        ]
      };
      script.textContent = JSON.stringify(categoryGraph, null, 2);
    } else {
      // Homepage WebSite + Organization Schema Graph
      const websiteGraph = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': `${CANONICAL_SITE_URL}/#website`,
            'name': 'Walkathawa',
            'alternateName': this.ALTERNATE_NAME,
            'url': `${CANONICAL_SITE_URL}/`,
            'description': settings?.metaDescription || this.DEFAULT_DESCRIPTION,
            'inLanguage': 'si',
            'publisher': {
              '@type': 'Organization',
              '@id': `${CANONICAL_SITE_URL}/#organization`,
              'name': publisherName,
              'alternateName': this.ALTERNATE_NAME,
              'url': `${CANONICAL_SITE_URL}/`,
              'logo': {
                '@type': 'ImageObject',
                'url': logoUrl
              }
            },
            'potentialAction': {
              '@type': 'SearchAction',
              'target': {
                '@type': 'EntryPoint',
                'urlTemplate': `${CANONICAL_SITE_URL}/search?q={search_term_string}`
              },
              'query-input': 'required name=search_term_string'
            }
          }
        ]
      };
      script.textContent = JSON.stringify(websiteGraph, null, 2);
    }
  }

  /**
   * Generates dynamic SEO payload for a series hub
   * URL: https://www.walkathawa.site/posts/${series.slug}/episodes
   */
  public static generateSeriesSEO(series: Series): SEOData {
    const rawDesc = series.description || `Read all episodes of ${series.title} on Walkathawa (වල් කතාව).`;
    const cleanDesc = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;

    return {
      title: `${series.title} (සියලු කතාංග - ${series.totalEpisodes})`,
      rawTitle: series.title,
      description: cleanDesc,
      keywords: `${series.title}, ${series.categoryName}, sinhala series, wal katha series, walkathawa`,
      canonicalUrl: `${CANONICAL_SITE_URL}/posts/${series.slug}/episodes`,
      ogImage: series.coverImage || this.DEFAULT_IMAGE,
      ogType: 'website',
      seriesData: {
        seriesSlug: series.slug,
        seriesTitle: series.title,
        totalEpisodes: series.totalEpisodes,
        categorySlug: series.category,
        categoryName: series.categoryName,
      },
    };
  }

  /**
   * Generates dynamic SEO payload for an individual episode
   * URL: https://www.walkathawa.site/posts/${seriesSlug}/episodes/${episodeNumber}
   */
  public static generateEpisodeSEO(story: Story, series?: Series | null, episodeNumber?: number): SEOData {
    const rawDesc = story.shortDescription || story.fullContent.replace(/[\n\r]+/g, ' ').trim();
    const cleanDesc = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;

    const detected = detectSeriesInfo(story);
    const seriesSlug = series ? series.slug : detected.seriesSlug;
    const seriesTitle = series ? series.title : detected.seriesTitle;
    const epNum = episodeNumber || detected.episodeNumber;

    const canonicalCat = getStoryCanonicalCategory(story);
    const catDisplayName = getCategoryDisplayName(canonicalCat);

    const storyKeywords = Array.from(
      new Set([
        ...story.tags,
        catDisplayName,
        seriesTitle,
        `Episode ${epNum}`,
        'walkatha',
        'walakatha',
        'walkathawa',
        'වල් කතා',
        'වල්කතා',
        'sinhala stories',
        'sinhala katha',
      ])
    ).join(', ');

    return {
      title: `${story.title} - Episode ${epNum}`,
      rawTitle: story.title,
      description: cleanDesc,
      keywords: storyKeywords,
      canonicalUrl: `${CANONICAL_SITE_URL}/posts/${seriesSlug}/episodes/${epNum}`,
      ogImage: story.coverImage,
      ogType: 'article',
      articleData: {
        publishedTime: story.uploadDate,
        modifiedTime: story.updatedDate,
        authorName: story.author?.name || 'Walkathawa Author',
        section: catDisplayName,
        tags: story.tags || [],
        slug: story.slug,
        seriesSlug,
        seriesTitle,
        episodeNumber: epNum,
      },
    };
  }

  /**
   * Generates SEO payload for an individual story (fallback)
   */
  public static generateStorySEO(story: Story): SEOData {
    return this.generateEpisodeSEO(story);
  }

  /**
   * Generates SEO payload for home catalog, category view, or directory view
   */
  public static generateHomeSEO(activeCategorySlug?: string, activeCategoryName?: string, searchQuery?: string): SEOData {
    if (searchQuery) {
      return {
        title: `Search: "${searchQuery}"`,
        description: `Explore Sinhala short stories and katha matching "${searchQuery}" on Walkathawa (වල් කතාව).`,
        canonicalUrl: `${CANONICAL_SITE_URL}/search`,
        ogType: 'website',
        noIndex: true,
      };
    }

    if (activeCategorySlug && activeCategorySlug !== 'all') {
      const displayName = activeCategoryName || getCategoryDisplayName(activeCategorySlug);
      return {
        title: `${displayName} Stories (සිංහල කතා)`,
        description: `Read the latest ${displayName} Sinhala stories, wal katha, and romantic tales on Walkathawa (වල් කතාව). Updated regularly with new collections.`,
        canonicalUrl: `${CANONICAL_SITE_URL}/category/${encodeURIComponent(activeCategorySlug)}`,
        ogType: 'website',
        categorySlug: activeCategorySlug,
        categoryName: displayName,
      };
    }

    return {
      description: this.DEFAULT_DESCRIPTION,
      keywords: this.DEFAULT_KEYWORDS,
      canonicalUrl: `${CANONICAL_SITE_URL}/`,
      ogType: 'website',
    };
  }

  public static generateLatestSEO(): SEOData {
    return {
      title: 'Latest Sinhala Stories (නවතම කතා)',
      description: 'Discover the newest Sinhala wal katha, novel episodes, and romantic short stories published recently on Walkathawa.',
      canonicalUrl: `${CANONICAL_SITE_URL}/latest`,
      ogType: 'website',
    };
  }

  public static generatePopularSEO(): SEOData {
    return {
      title: 'Most Popular Sinhala Stories (ජනප්‍රියම කතා)',
      description: 'Explore the highest rated and most read Sinhala stories, top wal katha series, and reader favorites on Walkathawa.',
      canonicalUrl: `${CANONICAL_SITE_URL}/popular`,
      ogType: 'website',
    };
  }

  /**
   * Generates SEO payload for the Archives view
   */
  public static generateArchivesSEO(): SEOData {
    return {
      title: 'All Sinhala Stories Archives (සියලු කතා සූචිය)',
      description: 'Complete directory and archive of Sinhala stories, series hubs, wal katha, and novels on Walkathawa (වල් කතාව). Easily explore by genre, series, or title.',
      canonicalUrl: `${CANONICAL_SITE_URL}/archives`,
      ogType: 'website',
    };
  }

  public static generateDirectorySEO(): SEOData {
    return this.generateArchivesSEO();
  }
}
