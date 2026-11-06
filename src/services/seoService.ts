import { Story } from '../types/story';

export interface SEOHeadOptions {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  ogImage?: string;
  jsonLd?: any;
}

export class SEOService {
  private static defaultTitle = 'Walkathawa (වල් කතාව) - රස කතා එකතුව';
  private static defaultDescription = 'Walkathawa (වල් කතාව) is a place to read Sinhala stories online. Discover new Sinhala katha, romantic stories, fictional stories, and interesting short stories updated regularly.';

  static updateHead(options: SEOHeadOptions) {
    if (typeof document === 'undefined') return;

    const title = options.title ? `${options.title} | Walkathawa` : this.defaultTitle;
    document.title = title;

    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', options.description || this.defaultDescription);

    // OpenGraph
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', options.title || this.defaultTitle);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', options.description || this.defaultDescription);

    // Robots noindex
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (options.noIndex) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
    } else if (robotsMeta) {
      robotsMeta.parentNode?.removeChild(robotsMeta);
    }

    // Canonical URL
    if (options.canonicalUrl) {
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', options.canonicalUrl);
    }

    // JSON-LD
    if (options.jsonLd) {
      let script = document.getElementById('jsonld-seo');
      if (!script) {
        script = document.createElement('script');
        script.id = 'jsonld-seo';
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(options.jsonLd);
    }
  }

  static generateHomeSEO(categorySlug = 'all', page = 1, search = ''): SEOHeadOptions {
    let title = 'Walkathawa (වල් කතාව) - සිංහල කතා එකතුව';
    let description = this.defaultDescription;

    if (search) {
      title = `"${search}" සෙවුම් ප්‍රතිඵල`;
      description = `Walkathawa හි "${search}" සඳහා සොයාගත් සිංහල කතා.`;
    } else if (categorySlug && categorySlug !== 'all') {
      title = `${categorySlug.toUpperCase()} කතා`;
      description = `Walkathawa වෙතින් ${categorySlug} කාණ්ඩයේ නවතම රසවත් සිංහල කතා කියවන්න.`;
    }

    if (page > 1) {
      title += ` - පිටුව ${page}`;
    }

    return {
      title,
      description,
      canonicalUrl: typeof window !== 'undefined' ? window.location.href : 'https://www.walkathawa.site',
    };
  }

  static generateStorySEO(story: Story): SEOHeadOptions {
    const authorName = typeof story.author === 'string' ? story.author : story.author?.name || 'Walkathawa';
    const excerpt = story.shortDescription || story.description || story.excerpt || 'Walkathawa වෙතින් නවතම සිංහල කතාව කියවන්න.';

    return {
      title: story.title,
      description: excerpt.slice(0, 160),
      canonicalUrl: typeof window !== 'undefined' ? `${window.location.origin}/story/${encodeURIComponent(story.slug)}` : `https://www.walkathawa.site/story/${encodeURIComponent(story.slug)}`,
      ogImage: story.coverImage,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: story.title,
        description: excerpt,
        author: {
          '@type': 'Person',
          name: authorName,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Walkathawa',
          url: 'https://www.walkathawa.site',
        },
        inLanguage: 'si',
        wordCount: (story.fullContent || story.content || '').split(/\s+/).length,
      },
    };
  }

  static generateArchivesSEO(): SEOHeadOptions {
    return {
      title: 'සියලු කතා ලේඛනාගාරය (Story Archives & Sitemap)',
      description: 'Explore the full story archive and category sitemap index for Walkathawa.',
      canonicalUrl: 'https://www.walkathawa.site/sitemap',
    };
  }
}
