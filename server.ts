import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { Story, Category } from './src/types/story';
import { SiteSettings } from './src/types/admin';
import { INITIAL_STORIES, INITIAL_CATEGORIES } from './src/data/seedStories';
import { normalizeCategorySlug, getCategoryDisplayName } from './src/utils/categoryTaxonomy';
import { db } from './src/lib/firebase';
import { collection, getDocs, doc, getDoc, query, where, limit } from 'firebase/firestore';
import { normalizeFirestoreStory } from './src/services/storyService';

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

  // 3. Search Engine Indexing: Disallow /admin and /api paths, index all public content
  if (req.path.startsWith('/admin') || req.path.startsWith('/api')) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  } else {
    res.setHeader('X-Robots-Tag', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
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

// --- FIRESTORE CONTINUOUS SYNC & DISCOVERY LAYER ---
let lastFirestoreSync = 0;
const SYNC_COOLDOWN_MS = 45 * 1000; // 45s cache window for fresh indexing
const isServerlessEnvironment = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

async function syncStoriesFromFirestore(force = false): Promise<Story[]> {
  const now = Date.now();
  if (!force && now - lastFirestoreSync < SYNC_COOLDOWN_MS && memoryDatabase.stories.length > 0) {
    return memoryDatabase.stories;
  }

  try {
    const fetchPromise = (async () => {
      let snapshot = await getDocs(collection(db, 'stories'));
      if (snapshot.empty) {
        snapshot = await getDocs(collection(db, 'posts'));
      }

      if (!snapshot.empty) {
        const liveStories: Story[] = [];
        snapshot.forEach((docSnap) => {
          liveStories.push(normalizeFirestoreStory(docSnap.id, docSnap.data()));
        });

        if (liveStories.length > 0) {
          liveStories.sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime());
          memoryDatabase.stories = liveStories;
          lastFirestoreSync = Date.now();
          saveDatabase();
          console.log(`[Firestore Sync] Synced ${liveStories.length} live stories from Firestore.`);
        }
      }
      return memoryDatabase.stories;
    })();

    // 2.5 second timeout safeguard so serverless invocation never hangs
    const timeoutPromise = new Promise<Story[]>((resolve) => {
      setTimeout(() => resolve(memoryDatabase.stories), 2500);
    });

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err) {
    console.warn('[Firestore Sync] Non-fatal background sync notice:', err);
    return memoryDatabase.stories;
  }
}

// Background sync job every 2 minutes (only in persistent node servers, never in serverless)
if (!isServerlessEnvironment) {
  setInterval(() => {
    syncStoriesFromFirestore(true).catch(() => {});
  }, 120 * 1000);
  // Kick off initial sync asynchronously
  syncStoriesFromFirestore(true).catch(() => {});
}

async function findStoryBySlugOrId(slugParam: string): Promise<Story | null> {
  if (!slugParam) return null;
  const cleanParam = decodeURIComponent(slugParam).toLowerCase().trim();
  const rawParam = slugParam.trim();

  const matches = (s: Story) => {
    const sSlug = (s.slug || '').toLowerCase().trim();
    const sId = (s.id || '').trim();
    const decodedSlug = decodeURIComponent(s.slug || '').toLowerCase().trim();
    return (
      sSlug === cleanParam ||
      sId.toLowerCase() === cleanParam.toLowerCase() ||
      decodedSlug === cleanParam ||
      sSlug === rawParam.toLowerCase() ||
      sId === rawParam
    );
  };

  let found = memoryDatabase.stories.find(matches);
  if (found) return found;

  // Cache miss: sync immediately with Firestore
  await syncStoriesFromFirestore(true);
  found = memoryDatabase.stories.find(matches);
  if (found) return found;

  // Direct Firestore document check by ID
  try {
    const docRef = doc(db, 'stories', rawParam);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const story = normalizeFirestoreStory(docSnap.id, docSnap.data());
      memoryDatabase.stories.unshift(story);
      saveDatabase();
      return story;
    }

    // Direct Firestore query by slug field
    const q = query(collection(db, 'stories'), where('slug', '==', cleanParam), limit(1));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      const story = normalizeFirestoreStory(querySnap.docs[0].id, querySnap.docs[0].data());
      memoryDatabase.stories.unshift(story);
      saveDatabase();
      return story;
    }
  } catch (err) {
    console.warn('[FindStory] Direct query fallback error:', err);
  }

  return null;
}

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

  return `<!doctype html><html lang="si"><head><!-- Google tag (gtag.js) --><script async src="https://www.googletagmanager.com/gtag/js?id=G-EHBR2EWZCV"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-EHBR2EWZCV');</script><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Walkathawa (වල් කතාව)</title></head><body><div id="root"></div></body></html>`;
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
  const catName = getCategoryDisplayName(story.category);
  const catUrl = `https://www.walkathawa.site/category/${encodeURIComponent(story.category || 'all')}`;

  const schemaJson = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${storyUrl}#article`,
        isPartOf: {
          '@type': 'WebSite',
          '@id': 'https://www.walkathawa.site/#website',
          name: 'Walkathawa',
          alternateName: 'වල් කතාව',
          url: 'https://www.walkathawa.site/',
        },
        headline: story.title,
        description,
        image: story.coverImage && story.coverImage.startsWith('http') ? story.coverImage : 'https://www.walkathawa.site/icon.png',
        datePublished: publishedDate,
        dateModified: modifiedDate,
        inLanguage: 'si',
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': storyUrl,
        },
        author: {
          '@type': 'Organization',
          name: 'Walkathawa (වල් කතාව)',
          url: 'https://www.walkathawa.site/',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Walkathawa (වල් කතාව)',
          url: 'https://www.walkathawa.site/',
          logo: {
            '@type': 'ImageObject',
            url: 'https://www.walkathawa.site/icon.png',
          },
        },
        articleSection: catName,
        articleBody: (story.fullContent || story.content || '').slice(0, 5000),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${storyUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'මුල් පිටුව (Home)',
            item: 'https://www.walkathawa.site/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: catName,
            item: catUrl,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: story.title,
            item: storyUrl,
          },
        ],
      },
    ],
  };

  const paragraphs = (story.fullContent || story.content || '')
    .split(/\n\s*\n/)
    .map((p) => `<p style="margin-bottom: 16px; line-height: 1.8;">${escapeHtml(p.trim())}</p>`)
    .join('\n');

  // Internal link graph: top 6 other stories for search crawler link discovery
  const relatedStories = memoryDatabase.stories
    .filter((s) => s.published !== false && s.id !== story.id)
    .slice(0, 6);

  const relatedHtml = relatedStories
    .map(
      (r) =>
        `<li style="margin-bottom: 12px;"><a href="/story/${encodeURIComponent(r.slug)}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${escapeHtml(r.title)}</a> <span style="color: #64748b; font-size: 13px;">(${escapeHtml(getCategoryDisplayName(r.category))})</span></li>`
    )
    .join('\n');

  const bodyContent = `
    <main style="max-width: 800px; margin: 0 auto; padding: 20px;">
      <nav style="margin-bottom: 20px; font-size: 14px; color: #64748b;">
        <a href="/" style="color: #2563eb; text-decoration: none;">මුල් පිටුව</a> &gt; 
        <a href="/category/${encodeURIComponent(story.category || 'all')}" style="color: #2563eb; text-decoration: none;">${escapeHtml(catName)}</a> &gt; 
        <span>${escapeHtml(story.title)}</span>
      </nav>
      <article>
        <header style="margin: 20px 0;">
          <span style="font-weight: bold; color: #4f46e5;">${escapeHtml(catName)}</span>
          <h1 style="font-size: 28px; margin: 10px 0;">${escapeHtml(story.title)}</h1>
          <time datetime="${escapeHtml(publishedDate)}" style="color: #64748b; font-size: 14px;">${escapeHtml(new Date(publishedDate).toLocaleDateString('si-LK'))}</time>
        </header>
        ${story.coverImage ? `<img src="${escapeHtml(story.coverImage)}" alt="${escapeHtml(story.title)}" style="max-width: 100%; border-radius: 12px; margin-bottom: 20px;" />` : ''}
        <div style="font-size: 18px;">
          ${paragraphs}
        </div>
      </article>

      <section style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
        <h3 style="font-size: 20px; margin-bottom: 16px;">තවත් රසවත් සිංහල කතා (More Sinhala Stories)</h3>
        <ul style="list-style: none; padding: 0;">
          ${relatedHtml}
        </ul>
        <div style="margin-top: 20px;">
          <a href="/sitemap" style="color: #4f46e5; text-decoration: underline; font-size: 14px;">සියලු කතා සූචිය බලන්න (All Stories Directory) →</a>
        </div>
      </section>
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

function renderCategoriesListSeo(template: string): string {
  const catUrl = 'https://www.walkathawa.site/categories';
  const title = 'කතා වර්ගීකරණ (Story Categories) | Walkathawa (වල් කතාව)';
  const description = 'Walkathawa හි ඇති සියලුම සිංහල කතා වර්ගීකරණයන් තෝරා රසවත් කතා පහසුවෙන් කියවන්න.';

  const categoriesHtml = memoryDatabase.categories
    .map(
      (c) => `
      <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; background: #ffffff;">
        <h3 style="margin: 0 0 6px 0;"><a href="/category/${encodeURIComponent(c.slug)}" style="color: #e11d48; text-decoration: none; font-weight: bold;">${escapeHtml(c.name)}</a></h3>
        <p style="margin: 0; color: #64748b; font-size: 14px;">${escapeHtml(c.description || '')}</p>
      </div>`
    )
    .join('\n');

  const bodyContent = `
    <main style="max-width: 1200px; margin: 0 auto; padding: 24px;">
      <nav style="margin-bottom: 20px;"><a href="/" style="color: #2563eb; text-decoration: none;">← මුල් පිටුව (Home)</a></nav>
      <h1>කතා වර්ගීකරණ (Story Categories)</h1>
      <p style="color: #64748b;">${escapeHtml(description)}</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-top: 24px;">
        ${categoriesHtml}
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

// --- DYNAMIC SITEMAP, ROBOTS, AND RSS/ATOM FEEDS ---

// 1. Master Sitemap XML
app.get('/sitemap.xml', async (_req: Request, res: Response) => {
  const baseUrl = 'https://www.walkathawa.site';
  const stories = await syncStoriesFromFirestore(false);
  const publishedStories = stories.filter((s) => s.published !== false);
  const categories = memoryDatabase.categories.filter((c) => c.slug !== 'all');
  const nowIso = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // 1. Homepage
  xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${nowIso}</lastmod>\n    <changefreq>hourly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

  // 2. Categories Special Directory Page
  xml += `  <url>\n    <loc>${baseUrl}/categories</loc>\n    <lastmod>${nowIso}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;

  // 3. Sitemap / Archives Page
  xml += `  <url>\n    <loc>${baseUrl}/sitemap</loc>\n    <lastmod>${nowIso}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;

  // 3. Category Pages
  for (const cat of categories) {
    xml += `  <url>\n    <loc>${baseUrl}/category/${encodeURIComponent(cat.slug)}</loc>\n    <lastmod>${nowIso}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
  }

  // 4. All Individual Stories
  for (const story of publishedStories) {
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
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=1800');
  res.status(200).send(xml);
});

// 2. Dedicated Stories Sitemap XML
app.get('/sitemap-stories.xml', async (_req: Request, res: Response) => {
  const baseUrl = 'https://www.walkathawa.site';
  const stories = await syncStoriesFromFirestore(false);
  const publishedStories = stories.filter((s) => s.published !== false);
  const nowIso = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  for (const story of publishedStories) {
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
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=1800');
  res.status(200).send(xml);
});

// 3. Robots.txt
app.get('/robots.txt', (_req: Request, res: Response) => {
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://www.walkathawa.site/sitemap.xml
Sitemap: https://www.walkathawa.site/sitemap-stories.xml
`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(robots);
});

// 4. RSS 2.0 Feed
app.get(['/feed.xml', '/rss.xml'], async (_req: Request, res: Response) => {
  const baseUrl = 'https://www.walkathawa.site';
  const stories = await syncStoriesFromFirestore(false);
  const publishedStories = stories.filter((s) => s.published !== false).slice(0, 30);
  const now = new Date().toUTCString();

  let rss = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  rss += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">\n`;
  rss += `  <channel>\n`;
  rss += `    <title>Walkathawa (වල් කතාව)</title>\n`;
  rss += `    <link>${baseUrl}/</link>\n`;
  rss += `    <description>Sinhala Stories Online | රසවත් සිංහල කතා එකතුව</description>\n`;
  rss += `    <language>si</language>\n`;
  rss += `    <lastBuildDate>${now}</lastBuildDate>\n`;
  rss += `    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>\n`;

  for (const s of publishedStories) {
    const itemUrl = `${baseUrl}/story/${encodeURIComponent(s.slug)}`;
    const pubDate = new Date(s.uploadDate || 0).toUTCString();
    rss += `    <item>\n`;
    rss += `      <title>${escapeHtml(s.title)}</title>\n`;
    rss += `      <link>${itemUrl}</link>\n`;
    rss += `      <guid isPermaLink="true">${itemUrl}</guid>\n`;
    rss += `      <pubDate>${pubDate}</pubDate>\n`;
    rss += `      <category>${escapeHtml(getCategoryDisplayName(s.category))}</category>\n`;
    rss += `      <dc:creator>Walkathawa</dc:creator>\n`;
    rss += `      <description>${escapeHtml(s.shortDescription || s.description || '')}</description>\n`;
    rss += `    </item>\n`;
  }

  rss += `  </channel>\n`;
  rss += `</rss>`;

  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=1800');
  res.status(200).send(rss);
});

// 5. Atom 1.0 Feed
app.get('/atom.xml', async (_req: Request, res: Response) => {
  const baseUrl = 'https://www.walkathawa.site';
  const stories = await syncStoriesFromFirestore(false);
  const publishedStories = stories.filter((s) => s.published !== false).slice(0, 30);
  const nowIso = new Date().toISOString();

  let atom = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  atom += `<feed xmlns="http://www.w3.org/2005/Atom">\n`;
  atom += `  <title>Walkathawa (වල් කතාව)</title>\n`;
  atom += `  <subtitle>Sinhala Stories Online | රසවත් සිංහල කතා එකතුව</subtitle>\n`;
  atom += `  <link href="${baseUrl}/" />\n`;
  atom += `  <link href="${baseUrl}/atom.xml" rel="self" type="application/atom+xml" />\n`;
  atom += `  <id>${baseUrl}/</id>\n`;
  atom += `  <updated>${nowIso}</updated>\n`;

  for (const s of publishedStories) {
    const itemUrl = `${baseUrl}/story/${encodeURIComponent(s.slug)}`;
    const updatedIso = s.updatedDate || s.uploadDate || nowIso;
    atom += `  <entry>\n`;
    atom += `    <title>${escapeHtml(s.title)}</title>\n`;
    atom += `    <link href="${itemUrl}" />\n`;
    atom += `    <id>${itemUrl}</id>\n`;
    atom += `    <updated>${updatedIso}</updated>\n`;
    atom += `    <summary>${escapeHtml(s.shortDescription || s.description || '')}</summary>\n`;
    atom += `    <category term="${escapeHtml(s.category)}" label="${escapeHtml(getCategoryDisplayName(s.category))}" />\n`;
    atom += `  </entry>\n`;
  }

  atom += `</feed>`;

  res.setHeader('Content-Type', 'application/atom+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=1800');
  res.status(200).send(atom);
});

// Google Search Console verification files
app.get('/google:id.html', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`google-site-verification: google${req.params.id}.html`);
});

// Search Console Ping
app.all('/api/ping-indexing', async (_req: Request, res: Response) => {
  try {
    const sitemapUrl = encodeURIComponent('https://www.walkathawa.site/sitemap.xml');
    await fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`).catch(() => {});
    res.json({ success: true, message: 'Google sitemap ping dispatched successfully', timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: 'Ping failed', details: err?.message });
  }
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
app.get('/api/stories/:slug', async (req: Request, res: Response) => {
  const story = await findStoryBySlugOrId(req.params.slug);

  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }

  res.json(story);
});

// GET /api/stories/:slug/related
app.get('/api/stories/:slug/related', async (req: Request, res: Response) => {
  const current = await findStoryBySlugOrId(req.params.slug);
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
      try {
        await syncStoriesFromFirestore(false);
        let template = getHtmlTemplate();
        template = await vite.transformIndexHtml(req.originalUrl, template);
        const rendered = renderHomeSeo(template);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(rendered);
      } catch (err) {
        console.error('[Dev / error]:', err);
        let template = getHtmlTemplate();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(template);
      }
    });

    app.get('/story/:slug', async (req: Request, res: Response) => {
      try {
        const story = await findStoryBySlugOrId(req.params.slug);
        let template = getHtmlTemplate();
        template = await vite.transformIndexHtml(req.originalUrl, template);

        if (!story) {
          return res.status(404).send(renderHomeSeo(template));
        }

        const rendered = renderStorySeo(template, story);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(rendered);
      } catch (err) {
        console.error('[Dev /story error]:', err);
        let template = getHtmlTemplate();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(template);
      }
    });

    app.get('/category/:slug', async (req: Request, res: Response) => {
      try {
        await syncStoriesFromFirestore(false);
        let template = getHtmlTemplate();
        template = await vite.transformIndexHtml(req.originalUrl, template);
        const rendered = renderCategorySeo(template, req.params.slug);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(rendered);
      } catch (err) {
        console.error('[Dev /category error]:', err);
        let template = getHtmlTemplate();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(template);
      }
    });

    app.get('/categories', async (req: Request, res: Response) => {
      try {
        await syncStoriesFromFirestore(false);
        let template = getHtmlTemplate();
        template = await vite.transformIndexHtml(req.originalUrl, template);
        const rendered = renderCategoriesListSeo(template);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(rendered);
      } catch (err) {
        console.error('[Dev /categories error]:', err);
        let template = getHtmlTemplate();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(template);
      }
    });

    app.get(['/sitemap', '/archives'], async (req: Request, res: Response) => {
      try {
        await syncStoriesFromFirestore(false);
        let template = getHtmlTemplate();
        template = await vite.transformIndexHtml(req.originalUrl, template);

        const allStoriesList = memoryDatabase.stories
          .filter((s) => s.published !== false)
          .map(
            (s) =>
              `<li style="margin-bottom: 12px;"><a href="/story/${encodeURIComponent(s.slug)}" style="color: #2563eb; font-weight: 500;">${escapeHtml(s.title)}</a> <span style="color: #64748b; font-size: 13px;">(${escapeHtml(getCategoryDisplayName(s.category))})</span></li>`
          )
          .join('\n');

        const archiveBody = `
          <main style="max-width: 1000px; margin: 0 auto; padding: 24px;">
            <nav style="margin-bottom: 20px;"><a href="/">← නැවත මුල් පිටුවට</a></nav>
            <h1>Walkathawa Archives & Sitemap (සියලු කතා සූචිය)</h1>
            <p>සියලුම සිංහල කතා, ආදර කතා සහ වර්ගීකරණ නාමාවලිය.</p>
            <ul style="list-style: none; padding: 0; margin-top: 24px;">
              ${allStoriesList}
            </ul>
          </main>`;

        const rendered = injectSeoIntoHtml(template, {
          title: 'Walkathawa Archives & Sitemap (සියලු කතා සූචිය)',
          description: 'Google Indexing සහ පාඨක පහසුව සඳහා සියලුම සිංහල කතා සහ වර්ගීකරණ නාමාවලිය.',
          canonicalUrl: 'https://www.walkathawa.site/sitemap',
          bodyContent: archiveBody,
        });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(rendered);
      } catch (err) {
        console.error('[Dev /sitemap error]:', err);
        let template = getHtmlTemplate();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(template);
      }
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
    app.get('/', async (_req: Request, res: Response) => {
      try {
        await syncStoriesFromFirestore(false);
        const template = getHtmlTemplate();
        const rendered = renderHomeSeo(template);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=1800');
        return res.status(200).send(rendered);
      } catch (err) {
        console.error('[Prod / error]:', err);
        const template = getHtmlTemplate();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(template);
      }
    });

    app.get('/story/:slug', async (req: Request, res: Response) => {
      try {
        const story = await findStoryBySlugOrId(req.params.slug);
        const template = getHtmlTemplate();

        if (!story) {
          return res.status(404).send(renderHomeSeo(template));
        }

        const rendered = renderStorySeo(template, story);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=1800');
        return res.status(200).send(rendered);
      } catch (err) {
        console.error('[Prod /story error]:', err);
        const template = getHtmlTemplate();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(template);
      }
    });

    app.get('/category/:slug', async (req: Request, res: Response) => {
      try {
        await syncStoriesFromFirestore(false);
        const template = getHtmlTemplate();
        const rendered = renderCategorySeo(template, req.params.slug);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=1800');
        return res.status(200).send(rendered);
      } catch (err) {
        console.error('[Prod /category error]:', err);
        const template = getHtmlTemplate();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(template);
      }
    });

    app.get('/categories', async (_req: Request, res: Response) => {
      try {
        await syncStoriesFromFirestore(false);
        const template = getHtmlTemplate();
        const rendered = renderCategoriesListSeo(template);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=1800');
        return res.status(200).send(rendered);
      } catch (err) {
        console.error('[Prod /categories error]:', err);
        const template = getHtmlTemplate();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(template);
      }
    });

    app.get(['/sitemap', '/archives'], async (_req: Request, res: Response) => {
      try {
        await syncStoriesFromFirestore(false);
        const template = getHtmlTemplate();

        const allStoriesList = memoryDatabase.stories
          .filter((s) => s.published !== false)
          .map(
            (s) =>
              `<li style="margin-bottom: 12px;"><a href="/story/${encodeURIComponent(s.slug)}" style="color: #2563eb; font-weight: 500;">${escapeHtml(s.title)}</a> <span style="color: #64748b; font-size: 13px;">(${escapeHtml(getCategoryDisplayName(s.category))})</span></li>`
          )
          .join('\n');

        const archiveBody = `
          <main style="max-width: 1000px; margin: 0 auto; padding: 24px;">
            <nav style="margin-bottom: 20px;"><a href="/">← නැවත මුල් පිටුවට</a></nav>
            <h1>Walkathawa Archives & Sitemap (සියලු කතා සූචිය)</h1>
            <p>සියලුම සිංහල කතා, ආදර කතා සහ වර්ගීකරණ නාමාවලිය.</p>
            <ul style="list-style: none; padding: 0; margin-top: 24px;">
              ${allStoriesList}
            </ul>
          </main>`;

        const rendered = injectSeoIntoHtml(template, {
          title: 'Walkathawa Archives & Sitemap (සියලු කතා සූචිය)',
          description: 'Google Indexing සහ පාඨක පහසුව සඳහා සියලුම සිංහල කතා සහ වර්ගීකරණ නාමාවලිය.',
          canonicalUrl: 'https://www.walkathawa.site/sitemap',
          bodyContent: archiveBody,
        });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=1800');
        return res.status(200).send(rendered);
      } catch (err) {
        console.error('[Prod /sitemap error]:', err);
        const template = getHtmlTemplate();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(template);
      }
    });

    app.get(['/admin', '/admin/*'], (_req: Request, res: Response) => {
      const template = getHtmlTemplate();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(template);
    });

    // Fallback for direct serverless rewrite destination /api/index
    app.all(['/api/index', '/api/index.ts'], (_req: Request, res: Response) => {
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
