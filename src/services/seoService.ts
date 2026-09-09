import { Story } from '../types/story';
import { SiteSettings } from '../types/admin';

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
  articleData?: {
    publishedTime: string;
    modifiedTime: string;
    authorName: string;
    section: string;
    tags: string[];
    slug?: string;
  };
}

export class SEOService {
  public static readonly SITE_NAME = 'Walkathawa (වල් කතාව)';
  public static readonly ALTERNATE_NAME = 'වල් කතාව';
  public static readonly DEFAULT_TITLE = 'Walkathawa (වල් කතාව) | Sinhala Stories Online';
  public static readonly DEFAULT_DESCRIPTION =
    'Walkathawa (වල් කතාව) is a place to read Sinhala stories online. Discover new Sinhala katha, romantic stories, fictional stories, and interesting short stories updated regularly.';
  public static readonly DEFAULT_KEYWORDS =
    'wal katha, walkatha, sinhala wal katha, wela katha, wala katha, sinhala wela katha, walkatha sinhala, sinhala wala katha, walkatha9, wal katha sinhala, new wal katha, aluth wal katha, wal katha 2025, wal katha 2026, sinhala wal katha 2025, sinhala wal katha 2026, wela katha sinhala, wala katha sinhala, walakatha, walkatha new, amma wal katha, wife wal katha, aunty wal katha, nanda wal katha, akka wal katha, malli wal katha, ayya wal katha, teacher wal katha, bus wal katha, family wal katha, pawule wal katha, cuckold wal katha, milf wal katha, hostel wal katha, spa wal katha, hukana katha, sinhala sex katha, sex katha sinhala, badu katha, wal chithra katha, wal katha free, wal katha pdf, sinhala wal katha pdf, wela katha lokaya, wal katha full story, new wela katha, aluthma wal katha, sinhala wal katha blog, වල් කතා, සිංහල වල් කතා, වැල කතා, සිංහල වැල කතා, වලා කතා, අලුත් වල් කතා, අම්මා වල් කතා, වයිෆ් වල් කතා, ඇන්ටි වල් කතා, නැන්දා වල් කතා, amma putha wal katha, akka malli wal katha, ayya nangi wal katha, wife change wal katha, school wal katha, campus wal katha, birinda wal katha, hora katha, rasika katha, walkathawa, sinhala stories, sinhala short stories';
  public static readonly DEFAULT_IMAGE =
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80';

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
    this.setMeta('name', 'author', siteTitle);
    this.setMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // Open Graph / Facebook
    this.setMeta('property', 'og:site_name', siteTitle);
    this.setMeta('property', 'og:title', seo.ogType === 'article' && seo.title ? `${seo.title} - ${siteTitle}` : (seo.title ? `${seo.title} | ${siteTitle}` : (settings?.metaTitle || 'Walkathawa (වල් කතාව) - Sinhala Stories Online')));
    this.setMeta('property', 'og:description', description);
    this.setMeta('property', 'og:image', image);
    this.setMeta('property', 'og:url', url);
    this.setMeta('property', 'og:type', seo.ogType || 'website');
    this.setMeta('property', 'og:locale', 'si_LK');

    // Twitter Cards
    this.setMeta('name', 'twitter:card', 'summary_large_image');
    this.setMeta('name', 'twitter:title', seo.title ? `${seo.title} | ${siteTitle}` : (settings?.siteName || 'Walkathawa (වල් කතාව)'));
    this.setMeta('name', 'twitter:description', seo.description ? (seo.description.length > 160 ? `${seo.description.slice(0, 157)}...` : seo.description) : 'Read Sinhala stories online.');
    this.setMeta('name', 'twitter:image', image);

    // Canonical link tag (guarantee self-referencing canonical URL)
    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.rel = 'canonical';
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.href = url;

    // Google Search Console verification meta tag (guaranteed preservation)
    const rawVerification =
      settings?.searchConsoleVerification !== undefined && settings.searchConsoleVerification !== null
        ? settings.searchConsoleVerification
        : 'aoXN34vuFG8HPn2ngc_Pmqky8knpnPtglDWTX5qFUd4';
    
    if (rawVerification && rawVerification.trim()) {
      let verificationToken = rawVerification.trim();
      if (verificationToken.includes('<meta')) {
        const match = verificationToken.match(/content=["']([^"']+)["']/i);
        if (match && match[1]) {
          verificationToken = match[1];
        }
      }
      this.setMeta('name', 'google-site-verification', verificationToken);
    }

    // Clean up any legacy monetag meta tags if present
    const legacyMonetag = document.querySelector('meta[name="monetag"]');
    if (legacyMonetag) {
      legacyMonetag.remove();
    }

    // Google Analytics Injection (if provided and valid)
    if (settings?.googleAnalyticsId && /^G-[A-Z0-9]+$/i.test(settings.googleAnalyticsId)) {
      this.injectGoogleAnalytics(settings.googleAnalyticsId);
    }

    // Schema.org Structured Data (deduplicated clean single implementation)
    this.updateStructuredData(seo, settings);
  }

  private static setMeta(attrName: 'name' | 'property', attrValue: string, content: string): void {
    let meta = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attrName, attrValue);
      document.head.appendChild(meta);
    }
    meta.content = content;
  }

  private static injectGoogleAnalytics(gaId: string): void {
    const scriptId = 'google-analytics-gtag';
    if (!document.getElementById(scriptId)) {
      const scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.async = true;
      scriptTag.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(scriptTag);

      const initScript = document.createElement('script');
      initScript.id = 'google-analytics-init';
      initScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
      `;
      document.head.appendChild(initScript);
    }
  }

  /**
   * Maintains exactly ONE clean Schema.org application/ld+json tag in the document,
   * removing any duplicate, orphan, or conflicting scripts.
   */
  private static updateStructuredData(seo: SEOData, settings?: Partial<SiteSettings>): void {
    const allLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    let script: HTMLScriptElement;

    if (allLdScripts.length > 0) {
      script = allLdScripts[0] as HTMLScriptElement;
      for (let i = 1; i < allLdScripts.length; i++) {
        allLdScripts[i].remove();
      }
    } else {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.id = 'structured-data';

    const siteName = settings?.siteName || this.SITE_NAME;
    const publisherName = settings?.publisherName || siteName;
    const logoUrl = settings?.logo || `${CANONICAL_SITE_URL}/icon.png`;
    const canonicalUrl = seo.canonicalUrl || `${CANONICAL_SITE_URL}/`;

    if (seo.ogType === 'article' && seo.articleData) {
      // Story Article Schema Graph + Breadcrumbs
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
            'image': [seo.ogImage || this.DEFAULT_IMAGE],
            'datePublished': seo.articleData.publishedTime,
            'dateModified': seo.articleData.modifiedTime,
            'inLanguage': 'si',
            'author': [
              {
                '@type': 'Person',
                'name': seo.articleData.authorName,
                'url': `${CANONICAL_SITE_URL}/?search=${encodeURIComponent(seo.articleData.authorName)}`
              }
            ],
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
                'name': seo.articleData.section,
                'item': `${CANONICAL_SITE_URL}/category/${encodeURIComponent(seo.articleData.section.toLowerCase())}`
              },
              {
                '@type': 'ListItem',
                'position': 3,
                'name': seo.title,
                'item': canonicalUrl
              }
            ]
          }
        ]
      };
      script.textContent = JSON.stringify(articleGraph, null, 2);
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
                'urlTemplate': `${CANONICAL_SITE_URL}/?search={search_term_string}`
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
   * Generates dynamic SEO payload for an individual story
   * Sets self-referencing canonical URL: https://www.walkathawa.site/story/${story.slug}
   */
  public static generateStorySEO(story: Story): SEOData {
    const rawDesc = story.shortDescription || story.fullContent.replace(/[\n\r]+/g, ' ').trim();
    const cleanDesc = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;

    const storyKeywords = Array.from(
      new Set([
        ...story.tags,
        story.categoryName || story.category,
        'walkatha',
        'walakatha',
        'walkathawa',
        'වල් කතා',
        'වල්කතා',
        'sinhala stories',
        'sinhala katha',
        'sinhala short stories'
      ])
    ).join(', ');

    return {
      title: story.title,
      rawTitle: story.title,
      description: cleanDesc,
      keywords: storyKeywords,
      canonicalUrl: `${CANONICAL_SITE_URL}/story/${story.slug}`,
      ogImage: story.coverImage,
      ogType: 'article',
      articleData: {
        publishedTime: story.uploadDate,
        modifiedTime: story.updatedDate,
        authorName: story.author?.name || 'Walkathawa Author',
        section: story.categoryName || story.category,
        tags: story.tags || [],
        slug: story.slug,
      },
    };
  }

  /**
   * Generates SEO payload for home catalog, category view, or directory view
   */
  public static generateHomeSEO(activeCategorySlug?: string, activeCategoryName?: string, searchQuery?: string): SEOData {
    if (searchQuery) {
      return {
        title: `Search: "${searchQuery}"`,
        description: `Explore Sinhala short stories and katha matching "${searchQuery}" on Walkathawa (වල් කතාව).`,
        canonicalUrl: `${CANONICAL_SITE_URL}/?search=${encodeURIComponent(searchQuery)}`,
        ogType: 'website',
      };
    }

    if (activeCategorySlug && activeCategorySlug !== 'all') {
      const displayName = activeCategoryName || activeCategorySlug;
      return {
        title: `${displayName} Stories (සිංහල කතා)`,
        description: `Read the latest ${displayName} Sinhala stories, wal katha, and romantic tales on Walkathawa (වල් කතාව). Updated regularly with new collections.`,
        canonicalUrl: `${CANONICAL_SITE_URL}/category/${encodeURIComponent(activeCategorySlug)}`,
        ogType: 'website',
        categorySlug: activeCategorySlug,
        categoryName: displayName,
      };
    }

    // Root URL canonical is always https://www.walkathawa.site/
    return {
      description: this.DEFAULT_DESCRIPTION,
      keywords: this.DEFAULT_KEYWORDS,
      canonicalUrl: `${CANONICAL_SITE_URL}/`,
      ogType: 'website',
    };
  }

  /**
   * Generates SEO payload for the Directory / Sitemap view
   */
  public static generateDirectorySEO(): SEOData {
    return {
      title: 'All Sinhala Stories Directory (සියලු කතා සූචිය)',
      description: 'Complete directory and archive of Sinhala stories, wal katha, and novels on Walkathawa (වල් කතාව). Easily explore by genre, author, or title.',
      canonicalUrl: `${CANONICAL_SITE_URL}/directory`,
      ogType: 'website',
    };
  }
}

