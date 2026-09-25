import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { Story, Category } from './src/types/story';
import { SiteSettings } from './src/types/admin';
import { INITIAL_STORIES, INITIAL_CATEGORIES } from './src/data/seedStories';
import { normalizeCategorySlug, getCategoryDisplayName } from './src/utils/categoryTaxonomy';

const app = express();
const PORT = 3000;

// Enable trust proxy for serverless environments (Vercel, Cloud Run)
app.set('trust proxy', true);

// Standard security headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Canonical Host Enforcement & Protocol Detection
app.use((req: Request, res: Response, next: NextFunction) => {
  const forwardedHost = (req.headers['x-forwarded-host'] as string) || '';
  const hostHeader = (typeof req.get === 'function' ? req.get('host') : (req.headers['host'] as string)) || '';
  const host = (forwardedHost || hostHeader).split(':')[0].toLowerCase();

  let proto = 'https';
  const forwardedProto = req.headers['x-forwarded-proto'];
  if (typeof forwardedProto === 'string') {
    proto = forwardedProto.split(',')[0].trim().toLowerCase();
  } else if (Array.isArray(forwardedProto) && forwardedProto.length > 0) {
    proto = forwardedProto[0].trim().toLowerCase();
  }

  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
  const isCanonicalProd = host === 'www.walkathawa.site';
  const isApexProd = host === 'walkathawa.site';

  // 1. Apex to canonical redirect: walkathawa.site -> www.walkathawa.site
  if (isApexProd) {
    return res.redirect(301, `https://www.walkathawa.site${req.originalUrl || req.url || ''}`);
  }

  // 2. HTTP to HTTPS redirect on production domain
  if (isCanonicalProd && proto === 'http') {
    return res.redirect(301, `https://www.walkathawa.site${req.originalUrl || req.url || ''}`);
  }

  // 3. Staging/preview domains: noindex
  if (!isCanonicalProd && !isLocal) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  next();
});

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// --- DATABASE PERSISTENCE LAYER ---
const currentDirname = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

function getDatabaseFilePath(): string {
  const paths = [
    path.join('/tmp', 'database.json'),
    path.join(process.cwd(), 'data', 'database.json'),
    path.join(currentDirname, 'data', 'database.json'),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(process.cwd(), 'data', 'database.json');
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = getDatabaseFilePath();

interface DatabaseSchema {
  users: Array<{ uid: string; email: string; role: string; createdAt: string; salt?: string; passwordHash?: string }>;
  stories: Story[];
  categories: Category[];
  settings: SiteSettings;
}

let memoryDatabase: DatabaseSchema = {
  users: [
    {
      uid: 'usr_admin_root',
      email: 'mchethiyabandara@gmail.com',
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
  ],
  stories: [...INITIAL_STORIES],
  categories: [...INITIAL_CATEGORIES],
  settings: {
    siteName: 'Walkathawa (වල් කතාව)',
    alternateName: 'Walkathawa',
    logo: '/icon.png',
    tagline: 'Sinhala Stories Online | රසවත් සිංහල කතා එකතුව',
    contactEmail: 'mchethiyabandara@gmail.com',
    metaTitle: 'Walkathawa (වල් කතාව) | Sinhala Stories Online',
    metaDescription: 'Walkathawa (වල් කතාව) is a place to read Sinhala stories online. Discover new Sinhala katha, romantic stories, fictional stories, and interesting short stories updated regularly.',
    keywords: 'Walkathawa, Sinhala stories, wal katha, සිංහල කතා, Sinhala novels',
    ogImage: 'https://www.walkathawa.site/icon.png',
    publisherName: 'Walkathawa',
  },
};

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.stories) && parsed.stories.length > 0) {
        memoryDatabase.stories = parsed.stories;
      }
      if (parsed && Array.isArray(parsed.categories) && parsed.categories.length > 0) {
        memoryDatabase.categories = parsed.categories;
      }
      if (parsed && parsed.settings) {
        memoryDatabase.settings = { ...memoryDatabase.settings, ...parsed.settings };
      }
      if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
        memoryDatabase.users = parsed.users;
      }
    }
  } catch (err) {
    console.warn('[DB] Load error, using in-memory default:', err);
  }
  return memoryDatabase;
}

function saveDatabase(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(memoryDatabase, null, 2), 'utf8');
  } catch (err) {
    console.warn('[DB] Could not save database to disk:', err);
  }
}

// Initial DB load
loadDatabase();

// --- HTML TEMPLATE LOADER ---
function getHtmlTemplate(): string {
  const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const isDev = process.env.NODE_ENV !== 'production' && !isServerless;

  if (isDev) {
    const devPaths = [
      path.join(process.cwd(), 'index.html'),
      path.join(currentDirname, 'index.html'),
    ];
    for (const p of devPaths) {
      if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
    }
  }

  const prodPaths = [
    path.join(process.cwd(), 'dist', 'index.html'),
    path.join(currentDirname, 'dist', 'index.html'),
    path.join(process.cwd(), 'index.html'),
  ];
  for (const p of prodPaths) {
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  }

  return '<!doctype html><html lang="si"><head><meta charset="UTF-8"><title>Walkathawa (වල් කතාව)</title></head><body><div id="root"></div></body></html>';
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --- SEO & METADATA INJECTION HELPERS ---
function injectSeoIntoHtml(
  html: string,
  meta: {
    title: string;
    description: string;
    canonicalUrl: string;
    ogImage?: string;
    schemaJson?: any;
    bodyContent?: string;
  }
): string {
  let result = html;

  // Replace Title
  result = result.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);

  // Replace Description
  result = result.replace(
    /<meta name="description" content=".*?"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`
  );

  // Replace Canonical Link
  result = result.replace(
    /<link rel="canonical" href=".*?"\s*\/?>/i,
    `<link rel="canonical" href="${escapeHtml(meta.canonicalUrl)}" />`
  );

  // Open Graph
  result = result.replace(
    /<meta property="og:title" content=".*?"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`
  );
  result = result.replace(
    /<meta property="og:description" content=".*?"\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`
  );
  result = result.replace(
    /<meta property="og:url" content=".*?"\s*\/?>/i,
    `<meta property="og:url" content="${escapeHtml(meta.canonicalUrl)}" />`
  );

  if (meta.ogImage) {
    result = result.replace(
      /<meta property="og:image" content=".*?"\s*\/?>/i,
      `<meta property="og:image" content="${escapeHtml(meta.ogImage)}" />`
    );
  }

  // Schema.org Structured Data
  if (meta.schemaJson) {
    const jsonStr = JSON.stringify(meta.schemaJson);
    result = result.replace(
      /<script type="application\/ld\+json" id="structured-data">[\s\S]*?<\/script>/i,
      `<script type="application/ld+json" id="structured-data">\n${jsonStr}\n</script>`
    );
  }

  // Pre-rendered HTML inside <div id="root"> for Search Engine Crawlers
  if (meta.bodyContent) {
    result = result.replace(
      /<div id="root"><\/div>/i,
      `<div id="root">${meta.bodyContent}</div>`
    );
  }

  return result;
}

// --- SSR HELPERS FOR SPECIFIC ROUTES ---
function renderHomeSeo(template: string): string {
  const publishedStories = memoryDatabase.stories.filter((s) => s.published !== false);
  const top20 = publishedStories.slice(0, 20);

  // Schema.org ItemList of top stories for Google Rich Snippets
  const schemaJson = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://www.walkathawa.site/#website',
        name: 'Walkathawa',
        alternateName: 'වල් කතාව',
        url: 'https://www.walkathawa.site/',
        description:
          'Walkathawa (වල් කතාව) is a place to read Sinhala stories online. Discover new Sinhala katha, romantic stories, fictional stories, and interesting short stories updated regularly.',
        inLanguage: 'si',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://www.walkathawa.site/?search={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'ItemList',
        itemListElement: top20.map((s, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `https://www.walkathawa.site/story/${encodeURIComponent(s.slug)}`,
          name: s.title,
        })),
      },
    ],
  };

  // SSR HTML fallback for search engines
  const storiesHtml = top20
    .map(
      (s) => `
      <article style="margin-bottom: 24px;">
        <h2><a href="/story/${encodeURIComponent(s.slug)}">${escapeHtml(s.title)}</a></h2>
        <p>${escapeHtml(s.shortDescription || s.description || '')}</p>
        <small>වර්ගීකරණය: ${escapeHtml(getCategoryDisplayName(s.category))}</small>
      </article>`
    )
    .join('\n');

  const bodyContent = `
    <main style="max-width: 1200px; margin: 0 auto; padding: 20px;">
      <h1>Walkathawa (වල් කතාව) | Sinhala Stories Online</h1>
      <p>නවතම සිංහල කතා, ආදර කතා, සහ රසවත් කෙටිකතා එකතුව දිනපතා අලුත් වේ.</p>
      <div style="margin-top: 30px;">
        ${storiesHtml}
      </div>
    </main>`;

  return injectSeoIntoHtml(template, {
    title: 'Walkathawa (වල් කතාව) | Sinhala Stories Online',
    description:
      'Walkathawa (වල් කතාව) is a place to read Sinhala stories online. Discover new Sinhala katha, romantic stories, fictional stories, and interesting short stories updated regularly.',
    canonicalUrl: 'https://www.walkathawa.site/',
    ogImage: 'https://www.walkathawa.site/icon.png',
    schemaJson,
    bodyContent,
  });
}

function renderStorySeo(template: string, story: Story): string {
  const storyUrl = `https://www.walkathawa.site/story/${encodeURIComponent(story.slug)}`;
  const title = `${story.title} | Walkathawa (වල් කතාව)`;
  const description = story.shortDescription || story.description || story.title;
  const publishedDate = story.uploadDate || story.createdAt || new Date().toISOString();
  const modifiedDate = story.updatedDate || story.updatedAt || publishedDate;

  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': storyUrl,
    },
    headline: story.title,
    description,
    image: story.coverImage || 'https://www.walkathawa.site/icon.png',
    datePublished: publishedDate,
    dateModified: modifiedDate,
    inLanguage: 'si',
    publisher: {
      '@type': 'Organization',
      name: 'Walkathawa (වල් කතාව)',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.walkathawa.site/icon.png',
      },
    },
    articleBody: (story.fullContent || story.content || '').slice(0, 5000),
  };

  const paragraphs = (story.fullContent || story.content || '')
    .split(/\n\s*\n/)
    .map((p) => `<p style="margin-bottom: 16px; line-height: 1.8;">${escapeHtml(p.trim())}</p>`)
    .join('\n');

  const bodyContent = `
    <main style="max-width: 800px; margin: 0 auto; padding: 20px;">
      <nav><a href="/">← නැවත මුල් පිටුවට</a></nav>
      <article>
        <header style="margin: 20px 0;">
          <span style="font-weight: bold; color: #4f46e5;">${escapeHtml(getCategoryDisplayName(story.category))}</span>
          <h1 style="font-size: 28px; margin: 10px 0;">${escapeHtml(story.title)}</h1>
          <time datetime="${escapeHtml(publishedDate)}">${escapeHtml(new Date(publishedDate).toLocaleDateString('si-LK'))}</time>
        </header>
        ${story.coverImage ? `<img src="${escapeHtml(story.coverImage)}" alt="${escapeHtml(story.title)}" style="max-width: 100%; border-radius: 12px; margin-bottom: 20px;" />` : ''}
        <div style="font-size: 18px;">
          ${paragraphs}
        </div>
      </article>
    </main>`;

  return injectSeoIntoHtml(template, {
    title,
    description,
    canonicalUrl: storyUrl,
    ogImage: story.coverImage || 'https://www.walkathawa.site/icon.png',
    schemaJson,
    bodyContent,
  });
}

function renderCategorySeo(template: string, categorySlug: string): string {
  const norm = normalizeCategorySlug(categorySlug);
  const catName = getCategoryDisplayName(norm);
  const catUrl = `https://www.walkathawa.site/category/${encodeURIComponent(norm)}`;
  const title = `${catName} | Walkathawa (වල් කතාව)`;
  const description = `${catName} යටතේ ඇති නවතම සිංහල කතා එකතුව කියවන්න.`;

  const stories = memoryDatabase.stories.filter(
    (s) => s.published !== false && (s.category || '').toLowerCase().includes(norm.toLowerCase())
  );

  const storiesHtml = stories
    .map(
      (s) => `
      <article style="margin-bottom: 20px;">
        <h2><a href="/story/${encodeURIComponent(s.slug)}">${escapeHtml(s.title)}</a></h2>
        <p>${escapeHtml(s.shortDescription || '')}</p>
      </article>`
    )
    .join('\n');

  const bodyContent = `
    <main style="max-width: 1200px; margin: 0 auto; padding: 20px;">
      <nav><a href="/">← සියලුම කතා</a></nav>
      <h1>${escapeHtml(catName)}</h1>
      <p>${escapeHtml(description)}</p>
      <div style="margin-top: 30px;">
        ${storiesHtml}
      </div>
    </main>`;

  return injectSeoIntoHtml(template, {
    title,
    description,
    canonicalUrl: catUrl,
    ogImage: 'https://www.walkathawa.site/icon.png',
    bodyContent,
  });
}

// --- DYNAMIC SITEMAP, ROBOTS, AND RSS FEED ---
app.get('/sitemap.xml', (_req: Request, res: Response) => {
  const baseUrl = 'https://www.walkathawa.site';
  const stories = memoryDatabase.stories.filter((s) => s.published !== false);
  const categories = memoryDatabase.categories.filter((c) => c.slug !== 'all');
  const nowIso = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // 1. Homepage
  xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${nowIso}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

  // 2. Sitemap / Archives
  xml += `  <url>\n    <loc>${baseUrl}/sitemap</loc>\n    <lastmod>${nowIso}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;

  // 3. Categories
  for (const cat of categories) {
    xml += `  <url>\n    <loc>${baseUrl}/category/${encodeURIComponent(cat.slug)}</loc>\n    <lastmod>${nowIso}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
  }

  // 4. All Stories
  for (const story of stories) {
    const storyUrl = `${baseUrl}/story/${encodeURIComponent(story.slug)}`;
    const lastMod = story.updatedDate || story.uploadDate || nowIso;
    xml += `  <url>\n    <loc>${storyUrl}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n`;
    if (story.coverImage && story.coverImage.startsWith('http')) {
      xml += `    <image:image>\n      <image:loc>${escapeHtml(story.coverImage)}</image:loc>\n      <image:title>${escapeHtml(story.title)}</image:title>\n    </image:image>\n`;
    }
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(xml);
});

app.get('/robots.txt', (_req: Request, res: Response) => {
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://www.walkathawa.site/sitemap.xml
`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).send(robots);
});

app.get(['/feed.xml', '/rss.xml'], (_req: Request, res: Response) => {
  const baseUrl = 'https://www.walkathawa.site';
  const stories = memoryDatabase.stories.filter((s) => s.published !== false).slice(0, 25);
  const now = new Date().toUTCString();

  let rss = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  rss += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n`;
  rss += `  <channel>\n`;
  rss += `    <title>Walkathawa (වල් කතාව)</title>\n`;
  rss += `    <link>${baseUrl}/</link>\n`;
  rss += `    <description>Sinhala Stories Online | රසවත් සිංහල කතා එකතුව</description>\n`;
  rss += `    <language>si</language>\n`;
  rss += `    <lastBuildDate>${now}</lastBuildDate>\n`;
  rss += `    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>\n`;

  for (const s of stories) {
    const itemUrl = `${baseUrl}/story/${encodeURIComponent(s.slug)}`;
    const pubDate = new Date(s.uploadDate || 0).toUTCString();
    rss += `    <item>\n`;
    rss += `      <title>${escapeHtml(s.title)}</title>\n`;
    rss += `      <link>${itemUrl}</link>\n`;
    rss += `      <guid isPermaLink="true">${itemUrl}</guid>\n`;
    rss += `      <pubDate>${pubDate}</pubDate>\n`;
    rss += `      <description>${escapeHtml(s.shortDescription || s.description || '')}</description>\n`;
    rss += `    </item>\n`;
  }

  rss += `  </channel>\n`;
  rss += `</rss>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.status(200).send(rss);
});

// Google verification file
app.get('/google0a8bbd03676eca90.html', (_req: Request, res: Response) => {
  res.send('google-site-verification: google0a8bbd03676eca90.html');
});

// --- REST API ENDPOINTS ---

// GET /api/stories (Paginated, filtered, sorted)
app.get('/api/stories', (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 20); // 20 posts per view
  const category = (req.query.category as string) || 'all';
  const search = ((req.query.search as string) || '').toLowerCase().trim();
  const sortBy = (req.query.sortBy as string) || 'latest';

  let list = memoryDatabase.stories.filter((s) => s.published !== false);

  if (category && category !== 'all') {
    const norm = normalizeCategorySlug(category);
    list = list.filter((s) => (s.category || '').toLowerCase().includes(norm.toLowerCase()));
  }

  if (search) {
    list = list.filter(
      (s) =>
        (s.title || '').toLowerCase().includes(search) ||
        (s.shortDescription || s.description || '').toLowerCase().includes(search) ||
        (s.slug || '').toLowerCase().includes(search)
    );
  }

  if (sortBy === 'oldest') {
    list.sort((a, b) => new Date(a.uploadDate || 0).getTime() - new Date(b.uploadDate || 0).getTime());
  } else {
    // latest (default)
    list.sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime());
  }

  const total = list.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const data = list.slice(startIndex, startIndex + limit);

  res.json({
    data,
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
    limit,
  });
});

// GET /api/stories/:slug
app.get('/api/stories/:slug', (req: Request, res: Response) => {
  const cleanSlug = decodeURIComponent(req.params.slug).toLowerCase().trim();
  const found = memoryDatabase.stories.find(
    (s) => (s.slug || '').toLowerCase() === cleanSlug || s.id === cleanSlug
  );

  if (!found) {
    return res.status(404).json({ error: 'Story not found' });
  }

  res.json(found);
});

// GET /api/stories/:slug/related
app.get('/api/stories/:slug/related', (req: Request, res: Response) => {
  const cleanSlug = decodeURIComponent(req.params.slug).toLowerCase().trim();
  const current = memoryDatabase.stories.find(
    (s) => (s.slug || '').toLowerCase() === cleanSlug || s.id === cleanSlug
  );

  const limit = parseInt(req.query.limit as string, 10) || 4;
  const all = memoryDatabase.stories.filter((s) => s.published !== false && s.id !== current?.id);

  if (!current) {
    return res.json(all.slice(0, limit));
  }

  const cat = (current.category || '').toLowerCase();
  const matched = all.filter((s) => (s.category || '').toLowerCase() === cat);

  if (matched.length >= limit) {
    return res.json(matched.slice(0, limit));
  }

  const others = all.filter((s) => (s.category || '').toLowerCase() !== cat);
  return res.json([...matched, ...others].slice(0, limit));
});

// GET /api/categories
app.get('/api/categories', (_req: Request, res: Response) => {
  const stories = memoryDatabase.stories.filter((s) => s.published !== false);

  const categories = memoryDatabase.categories.map((c) => {
    if (c.slug === 'all') {
      return { ...c, storyCount: stories.length };
    }
    const count = stories.filter((s) =>
      (s.category || '').toLowerCase().includes(c.slug.toLowerCase())
    ).length;
    return { ...c, storyCount: count };
  });

  res.json(categories);
});

// GET /api/settings
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json(memoryDatabase.settings);
});

// --- ADMIN API ENDPOINTS ---
app.get('/api/admin/stats', (_req: Request, res: Response) => {
  const stories = memoryDatabase.stories;
  const published = stories.filter((s) => s.published !== false);
  const drafts = stories.filter((s) => s.published === false);
  const totalViews = stories.reduce((sum, s) => sum + (s.views || 0), 0);

  const recent = [...stories]
    .sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime())
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      views: s.views || 0,
      uploadDate: s.uploadDate,
      category: s.category,
      published: s.published !== false,
    }));

  res.json({
    totalStories: stories.length,
    totalCategories: memoryDatabase.categories.length,
    totalViews,
    publishedStories: published.length,
    draftStories: drafts.length,
    recentUploads: recent,
  });
});

app.get('/api/admin/stories', (_req: Request, res: Response) => {
  res.json(memoryDatabase.stories);
});

app.post('/api/admin/stories', (req: Request, res: Response) => {
  const data = req.body;
  const id = data.id || `story_${Date.now()}`;
  const slug =
    data.slug ||
    data.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\u0D80-\u0DFF-]/g, '')
      .replace(/\s+/g, '-');

  const newStory: Story = {
    ...data,
    id,
    slug,
    uploadDate: data.uploadDate || new Date().toISOString(),
    updatedDate: new Date().toISOString(),
    views: data.views || 0,
    published: data.published !== false,
    featured: !!data.featured,
  };

  memoryDatabase.stories.unshift(newStory);
  saveDatabase();

  res.status(201).json(newStory);
});

app.put('/api/admin/stories/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const index = memoryDatabase.stories.findIndex((s) => s.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Story not found' });
  }

  const updated: Story = {
    ...memoryDatabase.stories[index],
    ...req.body,
    updatedDate: new Date().toISOString(),
  };

  memoryDatabase.stories[index] = updated;
  saveDatabase();

  res.json(updated);
});

app.delete('/api/admin/stories/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  memoryDatabase.stories = memoryDatabase.stories.filter((s) => s.id !== id);
  saveDatabase();

  res.json({ success: true });
});

app.post('/api/admin/categories', (req: Request, res: Response) => {
  const data = req.body;
  const newCat: Category = {
    id: data.id || data.slug || `cat_${Date.now()}`,
    name: data.name,
    slug: data.slug,
    description: data.description || '',
    storyCount: 0,
  };

  memoryDatabase.categories.push(newCat);
  saveDatabase();

  res.status(201).json(newCat);
});

app.put('/api/admin/settings', (req: Request, res: Response) => {
  memoryDatabase.settings = {
    ...memoryDatabase.settings,
    ...req.body,
  };
  saveDatabase();

  res.json(memoryDatabase.settings);
});

// --- 301 PERMANENT REDIRECTS FOR LEGACY / MIGRATED PATHS ---
app.get(['/posts/:story/episodes/:episode', '/posts/:story/episodes'], (req: Request, res: Response) => {
  const story = req.params.story;
  return res.redirect(301, `/story/${encodeURIComponent(story)}`);
});

app.get(['/posts/:story', '/katha/:story'], (req: Request, res: Response) => {
  return res.redirect(301, `/story/${encodeURIComponent(req.params.story)}`);
});

// --- SERVER SETUP & SPA SSR ROUTING ---
let isServerStarted = false;
let httpServer: http.Server | null = null;

export async function startServer(): Promise<http.Server> {
  if (isServerStarted && httpServer) {
    return httpServer;
  }
  isServerStarted = true;

  const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const isDev = process.env.NODE_ENV !== 'production' && !isServerless;

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer! },
      },
      appType: 'spa',
    });

    // Development SSR Routes
    app.get('/', async (req: Request, res: Response) => {
      let template = getHtmlTemplate();
      template = await vite.transformIndexHtml(req.originalUrl, template);
      const rendered = renderHomeSeo(template);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(rendered);
    });

    app.get('/story/:slug', async (req: Request, res: Response) => {
      const slug = decodeURIComponent(req.params.slug).toLowerCase().trim();
      const story = memoryDatabase.stories.find(
        (s) => (s.slug || '').toLowerCase() === slug || s.id === slug
      );

      let template = getHtmlTemplate();
      template = await vite.transformIndexHtml(req.originalUrl, template);

      if (!story) {
        return res.status(404).send(renderHomeSeo(template));
      }

      const rendered = renderStorySeo(template, story);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(rendered);
    });

    app.get('/category/:slug', async (req: Request, res: Response) => {
      let template = getHtmlTemplate();
      template = await vite.transformIndexHtml(req.originalUrl, template);
      const rendered = renderCategorySeo(template, req.params.slug);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(rendered);
    });

    app.get(['/sitemap', '/archives'], async (req: Request, res: Response) => {
      let template = getHtmlTemplate();
      template = await vite.transformIndexHtml(req.originalUrl, template);
      const rendered = injectSeoIntoHtml(template, {
        title: 'Walkathawa Archives & Sitemap (සියලු කතා සූචිය)',
        description: 'Google Indexing සහ පාඨක පහසුව සඳහා සියලුම සිංහල කතා සහ වර්ගීකරණ නාමාවලිය.',
        canonicalUrl: 'https://www.walkathawa.site/sitemap',
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(rendered);
    });

    app.get(['/admin', '/admin/*'], async (req: Request, res: Response) => {
      let template = getHtmlTemplate();
      template = await vite.transformIndexHtml(req.originalUrl, template);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(template);
    });

    app.use(vite.middlewares);
  } else {
    // Production & Serverless static assets
    const distPath = path.join(process.cwd(), 'dist');

    if (fs.existsSync(path.join(distPath, 'assets'))) {
      app.use(
        '/assets',
        express.static(path.join(distPath, 'assets'), {
          maxAge: '1y',
          immutable: true,
        })
      );
    }
    if (fs.existsSync(distPath)) {
      app.use(
        express.static(distPath, {
          maxAge: '1h',
        })
      );
    }

    // Production SSR Routes
    app.get('/', (_req: Request, res: Response) => {
      const template = getHtmlTemplate();
      const rendered = renderHomeSeo(template);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
      return res.status(200).send(rendered);
    });

    app.get('/story/:slug', (req: Request, res: Response) => {
      const slug = decodeURIComponent(req.params.slug).toLowerCase().trim();
      const story = memoryDatabase.stories.find(
        (s) => (s.slug || '').toLowerCase() === slug || s.id === slug
      );

      const template = getHtmlTemplate();
      if (!story) {
        return res.status(404).send(renderHomeSeo(template));
      }

      const rendered = renderStorySeo(template, story);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
      return res.status(200).send(rendered);
    });

    app.get('/category/:slug', (req: Request, res: Response) => {
      const template = getHtmlTemplate();
      const rendered = renderCategorySeo(template, req.params.slug);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
      return res.status(200).send(rendered);
    });

    app.get(['/sitemap', '/archives'], (_req: Request, res: Response) => {
      const template = getHtmlTemplate();
      const rendered = injectSeoIntoHtml(template, {
        title: 'Walkathawa Archives & Sitemap (සියලු කතා සූචිය)',
        description: 'Google Indexing සහ පාඨක පහසුව සඳහා සියලුම සිංහල කතා සහ වර්ගීකරණ නාමාවලිය.',
        canonicalUrl: 'https://www.walkathawa.site/sitemap',
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(rendered);
    });

    app.get(['/admin', '/admin/*'], (_req: Request, res: Response) => {
      const template = getHtmlTemplate();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(template);
    });

    // Fallback SPA catch-all
    app.get('*', (_req: Request, res: Response) => {
      const template = getHtmlTemplate();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(template);
    });
  }

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Express Uncaught Error]:', err);
    if (!res.headersSent) {
      res.status(500).setHeader('Content-Type', 'text/html; charset=utf-8').send(
        '<!DOCTYPE html><html lang="si"><head><meta charset="UTF-8"><title>Error</title></head><body><h1>සේවාව තාවකාලිකව කාර්යබහුලයි</h1><p>කරුණාකර මොහොතකින් නැවත පිවිසෙන්න.</p></body></html>'
      );
    }
  });

  return new Promise<http.Server>((resolve) => {
    if (isServerless) {
      httpServer = http.createServer(app);
      resolve(httpServer);
    } else {
      httpServer = app.listen(PORT, () => {
        console.log(`[Walkathawa Server] Listening on http://localhost:${PORT}`);
        resolve(httpServer!);
      });
    }
  });
}

// Auto-start when executed directly
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer().catch((err) => {
    console.error('Fatal server boot error:', err);
  });
}

export default app;
