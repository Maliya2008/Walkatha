import { Story } from '../types/story';

export interface SEOData {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  articleData?: {
    publishedTime: string;
    modifiedTime: string;
    authorName: string;
    section: string;
    tags: string[];
  };
}

export class SEOService {
  private static defaultTitle = 'Short Stories - Read Modern Short Stories Online';
  private static defaultDescription = 'A fast, mobile-friendly platform for reading engaging short stories across sci-fi, mystery, fantasy, and adventure.';
  private static defaultImage = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80';

  public static updateHead(seo: SEOData): void {
    const title = seo.title ? `${seo.title} | Short Stories` : this.defaultTitle;
    const description = seo.description || this.defaultDescription;
    const image = seo.ogImage || this.defaultImage;
    const url = seo.canonicalUrl || window.location.href;

    // Document Title
    document.title = title;

    // Meta Description
    this.setMeta('name', 'description', description);

    // Open Graph
    this.setMeta('property', 'og:title', title);
    this.setMeta('property', 'og:description', description);
    this.setMeta('property', 'og:image', image);
    this.setMeta('property', 'og:url', url);
    this.setMeta('property', 'og:type', seo.ogType || 'website');

    // Twitter Card
    this.setMeta('name', 'twitter:card', 'summary_large_image');
    this.setMeta('name', 'twitter:title', title);
    this.setMeta('name', 'twitter:description', description);
    this.setMeta('name', 'twitter:image', image);

    // Canonical link
    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.rel = 'canonical';
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.href = url;

    // Schema.org Article Structured Data (JSON-LD)
    this.updateStructuredData(seo);
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

  private static updateStructuredData(seo: SEOData): void {
    const scriptId = 'schema-structured-data';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    if (seo.ogType === 'article' && seo.articleData) {
      const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': seo.title,
        'description': seo.description,
        'image': [seo.ogImage || this.defaultImage],
        'datePublished': seo.articleData.publishedTime,
        'dateModified': seo.articleData.modifiedTime,
        'author': [{
          '@type': 'Person',
          'name': seo.articleData.authorName
        }],
        'publisher': {
          '@type': 'Organization',
          'name': 'Short Stories',
          'logo': {
            '@type': 'ImageObject',
            'url': `${window.location.origin}/favicon.ico`
          }
        },
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': seo.canonicalUrl || window.location.href
        },
        'articleSection': seo.articleData.section,
        'keywords': seo.articleData.tags.join(', ')
      };
      script.textContent = JSON.stringify(articleSchema, null, 2);
    } else {
      const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'Short Stories',
        'url': window.location.origin,
        'description': this.defaultDescription,
        'potentialAction': {
          '@type': 'SearchAction',
          'target': `${window.location.origin}/?search={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      };
      script.textContent = JSON.stringify(websiteSchema, null, 2);
    }
  }

  public static generateStorySEO(story: Story): SEOData {
    return {
      title: story.metaTitle || story.title,
      description: story.metaDescription || story.shortDescription,
      canonicalUrl: `${window.location.origin}/story/${story.slug}`,
      ogImage: story.coverImage,
      ogType: 'article',
      articleData: {
        publishedTime: story.uploadDate,
        modifiedTime: story.updatedDate,
        authorName: story.author.name,
        section: story.categoryName || story.category,
        tags: story.tags,
      },
    };
  }
}
