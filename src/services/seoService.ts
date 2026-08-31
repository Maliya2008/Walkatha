import { Story } from '../types/story';
import { SiteSettings } from '../types/admin';

export interface SEOData {
  title?: string;
  rawTitle?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
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
    'walkatha, walakatha, walkathawa, වල් කතා, වල්කතා, sinhala stories, sinhala katha, sinhala short stories, sinhala kathandara, sinhala love stories, sinhala adult stories, sinhala romantic stories, sinhala fictional stories, sinhala novels, new sinhala stories, latest sinhala katha, online sinhala stories, read sinhala stories online';
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
    const url = seo.canonicalUrl || window.location.href;

    // Document Title
    document.title = finalTitle;

    // Standard Meta Tags
    this.setMeta('name', 'description', description);
    this.setMeta('name', 'keywords', keywords);
    this.setMeta('name', 'author', siteTitle);
    this.setMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // Open Graph / Facebook
    this.setMeta('property', 'og:site_name', siteTitle);
    this.setMeta('property', 'og:title', seo.ogType === 'article' && seo.title ? `${seo.title} - ${siteTitle}` : (settings?.metaTitle || 'Walkathawa (වල් කතාව) - Sinhala Stories Online'));
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

    // Canonical link tag
    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.rel = 'canonical';
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.href = url;

    // Google Search Console verification meta tag (if provided)
    if (settings?.searchConsoleVerification) {
      this.setMeta('name', 'google-site-verification', settings.searchConsoleVerification);
    }

    // Google Analytics Injection (if provided and valid)
    if (settings?.googleAnalyticsId && /^G-[A-Z0-9]+$/i.test(settings.googleAnalyticsId)) {
      this.injectGoogleAnalytics(settings.googleAnalyticsId);
    }

    // Schema.org Structured Data
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

  private static updateStructuredData(seo: SEOData, settings?: Partial<SiteSettings>): void {
    const scriptId = 'schema-structured-data';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    const siteName = settings?.siteName || this.SITE_NAME;
    const publisherName = settings?.publisherName || siteName;
    const logoUrl = settings?.logo || `${window.location.origin}/icon.png`;

    if (seo.ogType === 'article' && seo.articleData) {
      // Schema.org Article Structured Data + Breadcrumbs
      const articleGraph = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Article',
            '@id': `${seo.canonicalUrl || window.location.href}#article`,
            'isPartOf': {
              '@type': 'WebSite',
              '@id': `${window.location.origin}/#website`,
              'name': siteName,
              'alternateName': this.ALTERNATE_NAME,
              'url': window.location.origin
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
                'url': `${window.location.origin}/?search=${encodeURIComponent(seo.articleData.authorName)}`
              }
            ],
            'publisher': {
              '@type': 'Organization',
              'name': publisherName,
              'alternateName': this.ALTERNATE_NAME,
              'url': window.location.origin,
              'logo': {
                '@type': 'ImageObject',
                'url': logoUrl
              }
            },
            'mainEntityOfPage': {
              '@type': 'WebPage',
              '@id': seo.canonicalUrl || window.location.href
            },
            'articleSection': seo.articleData.section,
            'keywords': seo.articleData.tags.join(', ')
          },
          {
            '@type': 'BreadcrumbList',
            '@id': `${seo.canonicalUrl || window.location.href}#breadcrumb`,
            'itemListElement': [
              {
                '@type': 'ListItem',
                'position': 1,
                'name': 'Home',
                'item': window.location.origin
              },
              {
                '@type': 'ListItem',
                'position': 2,
                'name': seo.articleData.section,
                'item': `${window.location.origin}/?category=${encodeURIComponent(seo.articleData.section.toLowerCase())}`
              },
              {
                '@type': 'ListItem',
                'position': 3,
                'name': seo.title,
                'item': seo.canonicalUrl || window.location.href
              }
            ]
          }
        ]
      };
      script.textContent = JSON.stringify(articleGraph, null, 2);
    } else {
      // Schema.org WebSite Structured Data
      const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${window.location.origin}/#website`,
        'name': 'Walkathawa',
        'alternateName': 'වල් කතාව',
        'url': window.location.origin,
        'description': settings?.metaDescription || this.DEFAULT_DESCRIPTION,
        'inLanguage': 'si',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': {
            '@type': 'EntryPoint',
            'urlTemplate': `${window.location.origin}/?search={search_term_string}`
          },
          'query-input': 'required name=search_term_string'
        }
      };
      script.textContent = JSON.stringify(websiteSchema, null, 2);
    }
  }

  /**
   * Generates dynamic SEO payload for an individual story
   * Sets title: "${story.title}" (which gets suffixed with "| Walkathawa (වල් කතාව)")
   * Sets description: automatically from first 160 characters of story description
   */
  public static generateStorySEO(story: Story): SEOData {
    // Generate clean meta description from the first part of description or content
    const rawDesc = story.shortDescription || story.fullContent.replace(/[\n\r]+/g, ' ').trim();
    const cleanDesc = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;

    // Combine primary keywords with specific story tags
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
      title: story.title, // Rendered as: "${story.title} | Walkathawa (වල් කතාව)"
      rawTitle: story.title,
      description: cleanDesc,
      keywords: storyKeywords,
      canonicalUrl: `${window.location.origin}/story/${story.slug}`,
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
   * Generates SEO payload for home catalog or category view
   */
  public static generateHomeSEO(activeCategoryName?: string, searchQuery?: string): SEOData {
    if (searchQuery) {
      return {
        title: `Search: "${searchQuery}"`,
        description: `Explore Sinhala short stories and katha matching "${searchQuery}" on Walkathawa (වල් කතාව).`,
        canonicalUrl: `${window.location.origin}/?search=${encodeURIComponent(searchQuery)}`,
        ogType: 'website',
      };
    }

    if (activeCategoryName && activeCategoryName !== 'All' && activeCategoryName !== 'All Stories') {
      return {
        title: `${activeCategoryName} Stories`,
        description: `Read the latest ${activeCategoryName} Sinhala stories, katha, and novels on Walkathawa (වල් කතාව). Updated regularly with new collections.`,
        canonicalUrl: `${window.location.origin}/?category=${encodeURIComponent(activeCategoryName.toLowerCase())}`,
        ogType: 'website',
      };
    }

    return {
      description: this.DEFAULT_DESCRIPTION,
      keywords: this.DEFAULT_KEYWORDS,
      canonicalUrl: window.location.origin,
      ogType: 'website',
    };
  }
}
