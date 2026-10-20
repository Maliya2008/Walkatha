import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { Story, Category } from './src/types/story';
import { SiteSettings } from './src/types/admin';
import { INITIAL_STORIES, INITIAL_CATEGORIES } from './src/data/seedStories';
import {
  normalizeCategorySlug,
  getCategoryDisplayName,
  getStoryCanonicalCategory,
  isValidCategorySlug,
} from './src/utils/categoryTaxonomy';
import { db } from './src/lib/firebase';
import { collection, getDocs, doc, getDoc, query, where, limit, setLogLevel, onSnapshot } from 'firebase/firestore';
import { normalizeFirestoreStory } from './src/services/storyService';

// Process-level unhandled rejection and uncaught exception safeguards to prevent 5xx crashes
process.on('unhandledRejection', (reason) => {
  console.warn('[Process Unhandled Rejection Safeguard]:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Process Uncaught Exception Safeguard]:', err);
});

// Ensure Firestore internal logging is silent to avoid idle gRPC stream cancellation notices in Node
try {
  setLogLevel('silent');
} catch {}

// Suppress benign internal gRPC idle stream disconnection notices
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const isIdleStreamNotice = (args: any[]): boolean => {
  const text = args.map((a) => (typeof a === 'string' ? a : (a?.message || ''))).join(' ');
  return text.includes('Disconnecting idle stream') || text.includes('Timed out waiting for new targets');
};

console.warn = (...args: any[]) => {
  if (isIdleStreamNotice(args)) return;
  originalConsoleWarn.apply(console, args);
};

console.error = (...args: any[]) => {
  if (isIdleStreamNotice(args)) return;
  originalConsoleError.apply(console, args);
};

export const app = express();
const PORT = 3000;

function getHeaderString(val: string | string[] | undefined): string {
  if (!val) return '';
  if (Array.isArray(val)) return val[0] || '';
  return String(val);
}

// Enable trust proxy for serverless environments (Vercel, Cloud Run)
app.set('trust proxy', true);

// URL and Header Normalization for serverless rewrites (Vercel, AWS Lambda, Cloud Run)
app.use((req: Request, _res: Response, next: NextFunction) => {
  try {
    const rawUri =
      req.headers['x-forwarded-uri'] ||
      req.headers['x-vercel-sc-path'] ||
      req.headers['x-original-url'] ||
      req.headers['x-rewrite-url'] ||
      req.headers['x-invoke-path'] ||
      req.headers['x-matched-path'];

    const forwardedUri = getHeaderString(rawUri);

    if (
      forwardedUri &&
      forwardedUri.startsWith('/') &&
      !forwardedUri.startsWith('/api/index')
    ) {
      req.url = forwardedUri;
      (req as any).originalUrl = forwardedUri;
    }
  } catch (e) {
    console.warn('[URL Normalization Notice]:', e);
  }
  next();
});

// Standard security headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Canonical Host Enforcement, Protocol Detection & Clean URL Normalization
app.use((req: Request, res: Response, next: NextFunction) => {
  try {
    const forwardedHost = getHeaderString(req.headers['x-forwarded-host']);
    const hostHeader = (typeof req.get === 'function' ? req.get('host') : getHeaderString(req.headers['host'])) || '';
    const host = (forwardedHost || hostHeader).split(':')[0].toLowerCase().trim();

    let proto = 'https';
    const forwardedProto = getHeaderString(req.headers['x-forwarded-proto']);
    if (forwardedProto) {
      proto = forwardedProto.split(',')[0].trim().toLowerCase();
    }

    const isCanonicalProd = host === 'www.walkathawa.site';
    const isApexProd = host === 'walkathawa.site';

    const rawPath = req.originalUrl || req.url || '/';
    const cleanPath = rawPath.startsWith('/api/index') ? '/' : rawPath;

    // 1. Apex to canonical redirect: walkathawa.site -> www.walkathawa.site
    if (isApexProd) {
      return res.redirect(301, `https://www.walkathawa.site${cleanPath}`);
    }

    // 2. HTTP to HTTPS redirect on production domain
    if (isCanonicalProd && proto === 'http') {
      return res.redirect(301, `https://www.walkathawa.site${cleanPath}`);
    }

    // 3. Double-slash normalization: //story/abc -> /story/abc
    if (req.method === 'GET' && cleanPath.includes('//')) {
      const normalizedPath = cleanPath.replace(/\/+/g, '/');
      return res.redirect(301, `https://www.walkathawa.site${normalizedPath}`);
    }

    // 4. Trailing slash normalization: /story/abc/ -> /story/abc (except root /)
    const [pathOnly, queryPart] = cleanPath.split('?');
    if (req.method === 'GET' && pathOnly.length > 1 && pathOnly.endsWith('/')) {
      const strippedPath = pathOnly.replace(/\/+$/, '');
      const querySuffix = queryPart ? `?${queryPart}` : '';
      return res.redirect(301, `https://www.walkathawa.site${strippedPath}${querySuffix}`);
    }

    // 5. Search Engine Indexing Headers
    if (req.path && (req.path.startsWith('/admin') || req.path.startsWith('/api'))) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    }
  } catch (err) {
    console.warn('[Host Middleware Notice]:', err);
  }

  next();
});

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// --- DATABASE PERSISTENCE LAYER ---
const isServerlessEnvironment = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const currentDirname = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

function safeDecode(str: string): string {
  if (!str) return '';
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
}

function getDatabaseFilePath(): string {
  if (isServerlessEnvironment) {
    return path.join('/tmp', 'database.json');
  }
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

const DATA_DIR = isServerlessEnvironment ? '/tmp' : path.join(process.cwd(), 'data');
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

function deduplicateStoriesBySlug(stories: Story[]): Story[] {
  const seenSlugs = new Set<string>();
  const deduped: Story[] = [];
  for (const s of stories) {
    if (!s) continue;
    const slugKey = (s.slug || s.id || '').trim().toLowerCase();
    if (!slugKey || seenSlugs.has(slugKey)) {
      continue;
    }
    seenSlugs.add(slugKey);
    deduped.push(s);
  }
  return deduped;
}

function getValidIsoDate(dateVal: any, fallback?: string): string {
  if (!dateVal) return fallback || '2026-09-01T00:00:00.000Z';
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch {}
  return fallback || '2026-09-01T00:00:00.000Z';
}

function getStoryDate(story: Story): string {
  return getValidIsoDate(story.updatedDate || story.uploadDate || story.createdAt);
}

function getLatestStoryDate(stories: Story[]): string {
  if (!stories || stories.length === 0) return '2026-09-01T00:00:00.000Z';
  let latest = 0;
  for (const s of stories) {
    const time = new Date(getStoryDate(s)).getTime();
    if (!isNaN(time) && time > latest) {
      latest = time;
    }
  }
  return latest > 0 ? new Date(latest).toISOString() : '2026-09-01T00:00:00.000Z';
}

function loadDatabase(): DatabaseSchema {
  try {
    const candidatePaths = [
      DB_PATH,
      path.join(process.cwd(), 'data', 'database.json'),
      path.join(currentDirname, 'data', 'database.json'),
      path.join('/tmp', 'database.json'),
    ];
    for (const cp of candidatePaths) {
      if (fs.existsSync(cp)) {
        const raw = fs.readFileSync(cp, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.stories) && parsed.stories.length > 0) {
          memoryDatabase.stories = deduplicateStoriesBySlug(parsed.stories);
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
        break;
      }
    }
  } catch (err) {
    console.warn('[DB] Load error, using in-memory default:', err);
  }
  return memoryDatabase;
}

function saveDatabase(): void {
  try {
    const targetDir = path.dirname(DB_PATH);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(memoryDatabase, null, 2), 'utf8');
  } catch (err) {
    // Read-only filesystem warning in serverless is benign
  }
}

// Initial DB load
loadDatabase();

// --- FIRESTORE CONTINUOUS SYNC & DISCOVERY LAYER ---
let lastFirestoreSync = 0;
let isSyncInProgress = false;
const SYNC_COOLDOWN_MS = 60 * 1000; // 60s cooldown to prevent redundant Firestore queries

async function syncStoriesFromFirestore(force = false): Promise<Story[]> {
  const now = Date.now();
  if (!force && (now - lastFirestoreSync < SYNC_COOLDOWN_MS || isSyncInProgress) && memoryDatabase.stories.length > 0) {
    return memoryDatabase.stories;
  }

  isSyncInProgress = true;

  try {
    const fetchDocs = async (): Promise<Story[]> => {
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
          memoryDatabase.stories = deduplicateStoriesBySlug(liveStories);
          lastFirestoreSync = Date.now();
          saveDatabase();
          console.log(`[Firestore Sync] Synced ${memoryDatabase.stories.length} live stories from Firestore.`);
        }
      }
      return memoryDatabase.stories;
    };

    // Attach catch directly to the promise to prevent any unhandled rejection
    const safePromise = fetchDocs().catch((err: any) => {
      if (err?.code !== 'permission-denied') {
        console.warn('[Firestore Sync] Non-fatal background sync notice:', err?.message || err);
      }
      return memoryDatabase.stories;
    });

    const timeoutPromise = new Promise<Story[]>((resolve) => {
      setTimeout(() => resolve(memoryDatabase.stories), 3500);
    });

    return await Promise.race([safePromise, timeoutPromise]);
  } catch (err: any) {
    return memoryDatabase.stories;
  } finally {
    isSyncInProgress = false;
  }
}

// --- FIRESTORE REAL-TIME SNAPSHOT LISTENER ---
let unsubscribeStoriesListener: (() => void) | null = null;

function setupFirestoreRealtimeListener(): void {
  if (isServerlessEnvironment || unsubscribeStoriesListener) {
    return;
  }

  try {
    const storiesCol = collection(db, 'stories');
    unsubscribeStoriesListener = onSnapshot(
      storiesCol,
      (snapshot) => {
        try {
          if (!snapshot.empty) {
            const liveStories: Story[] = [];
            snapshot.forEach((docSnap) => {
              liveStories.push(normalizeFirestoreStory(docSnap.id, docSnap.data()));
            });

            if (liveStories.length > 0) {
              liveStories.sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime());
              memoryDatabase.stories = deduplicateStoriesBySlug(liveStories);
              lastFirestoreSync = Date.now();
              saveDatabase();
              console.log(`[Firestore Realtime Listener] Updated ${memoryDatabase.stories.length} stories live.`);
            }
          }
        } catch (procErr) {
          console.warn('[Firestore Realtime Listener Process Notice]:', procErr);
        }
      },
      (error) => {
        if (error?.code !== 'permission-denied') {
          console.warn('[Firestore Realtime Listener Notice]:', error?.message || error);
        }
      }
    );
  } catch (err) {
    console.warn('[Firestore Realtime Listener Init Notice]:', err);
  }
}

// Initial background sync check on boot (only in persistent node servers, never in serverless)
if (!isServerlessEnvironment) {
  syncStoriesFromFirestore(false).catch(() => {});
  setupFirestoreRealtimeListener();
}

async function findStoryBySlugOrId(slugParam: string): Promise<Story | null> {
  if (!slugParam) return null;
  const decodedParam = safeDecode(slugParam).toLowerCase().trim();
  const rawParam = slugParam.toLowerCase().trim();

  const matches = (s: Story) => {
    if (!s) return false;
    const sSlug = (s.slug || '').toLowerCase().trim();
    const sId = (s.id || '').toLowerCase().trim();
    const decodedSlug = safeDecode(s.slug || '').toLowerCase().trim();
    return (
      sSlug === decodedParam ||
      sSlug === rawParam ||
      sId === decodedParam ||
      sId === rawParam ||
      decodedSlug === decodedParam ||
      decodedSlug === rawParam
    );
  };

  const found = memoryDatabase.stories.find(matches);
  if (found) return found;

  // Direct Firestore document check by ID or slug with strict try-catch and 3.5s timeout
  try {
    const directFetch = async (): Promise<Story | null> => {
      // 1. Safe doc id lookup in stories and posts
      if (!slugParam.includes('/') && !slugParam.includes('..')) {
        const cleanId = slugParam.trim();
        for (const col of ['stories', 'posts']) {
          try {
            const docRef = doc(db, col, cleanId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const story = normalizeFirestoreStory(docSnap.id, docSnap.data());
              memoryDatabase.stories.unshift(story);
              memoryDatabase.stories = deduplicateStoriesBySlug(memoryDatabase.stories);
              saveDatabase();
              return story;
            }
          } catch (e) {}
        }
      }

      // 2. Direct Firestore query by slug field in stories and posts
      const slugQueries = decodedParam !== rawParam ? [decodedParam, rawParam] : [decodedParam];
      for (const col of ['stories', 'posts']) {
        for (const targetSlug of slugQueries) {
          try {
            const q = query(collection(db, col), where('slug', '==', targetSlug), limit(1));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
              const story = normalizeFirestoreStory(querySnap.docs[0].id, querySnap.docs[0].data());
              memoryDatabase.stories.unshift(story);
              memoryDatabase.stories = deduplicateStoriesBySlug(memoryDatabase.stories);
              saveDatabase();
              return story;
            }
          } catch (e) {}
        }
      }

      return null;
    };

    const safeFetch = directFetch().catch(() => null);
    const timeoutPromise = new Promise<Story | null>((resolve) => setTimeout(() => resolve(null), 3500));
    return await Promise.race([safeFetch, timeoutPromise]);
  } catch (err: any) {
    return null;
  }
}

// --- HTML TEMPLATE LOADER ---
let cachedHtmlTemplate: string | null = null;

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

  if (cachedHtmlTemplate) {
    return cachedHtmlTemplate;
  }

  const prodPaths = [
    path.join(process.cwd(), 'dist', 'index.html'),
    path.join(currentDirname, 'dist', 'index.html'),
    path.join(process.cwd(), 'index.html'),
  ];
  for (const p of prodPaths) {
    if (fs.existsSync(p)) {
      cachedHtmlTemplate = fs.readFileSync(p, 'utf8');
      return cachedHtmlTemplate;
    }
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

// --- SEARCH ENGINE CRAWLER & AD ISOLATION HELPERS ---
export function isSearchEngineCrawler(userAgent?: string): boolean {
  if (!userAgent) return false;
  const botPattern = /googlebot|bingbot|google-inspectiontool|chrome-lighthouse|yandexbot|duckduckbot|slurp|baiduspider|feedfetcher-google|mediapartners-google/i;
  return botPattern.test(userAgent);
}

export function stripAdScriptsForCrawlers(html: string): string {
  let cleaned = html;
  // Safely strip third-party CPM ad scripts without ever spanning across other scripts
  cleaned = cleaned.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (match) => {
    if (
      match.includes('profitableratecpmnetwork') ||
      match.includes('highperformanceformat')
    ) {
      return '<!-- [Ad Script Disabled for Search Engine Crawler] -->';
    }
    return match;
  });

  // Hide 320x50 container to eliminate CLS and crawler confusion
  cleaned = cleaned.replace(
    /<div id="ad-banner-320x50"[\s\S]*?<\/div>/gi,
    '<div id="ad-banner-320x50" style="display:none;" aria-hidden="true"></div>'
  );
  return cleaned;
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
    initialDataScript?: string;
    noindex?: boolean;
    isBot?: boolean;
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

  // Robots meta tag: strictly synchronize with noindex flag
  if (meta.noindex) {
    result = result.replace(
      /<meta name="robots" content=".*?"\s*\/?>/i,
      '<meta name="robots" content="noindex, nofollow, noarchive" />'
    );
  } else {
    result = result.replace(
      /<meta name="robots" content=".*?"\s*\/?>/i,
      '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />'
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

  // Strip third-party ads and popunders when serving to search engine crawlers
  if (meta.isBot) {
    result = stripAdScriptsForCrawlers(result);
  }

  return result;
}

// --- SSR HELPERS FOR SPECIFIC ROUTES ---
function renderNotFound(template: string, requestedPath = '', message = 'සොයන ලද කතාව හෝ පිටුව හමු නොවීය.'): string {
  const notFoundBody = `
    <main style="max-width: 800px; margin: 40px auto; padding: 24px; text-align: center; font-family: system-ui, -apple-system, sans-serif;">
      <h1 style="font-size: 32px; color: #e11d48; margin-bottom: 12px;">404 - කතාව හමු නොවීය</h1>
      <p style="font-size: 16px; color: #64748b; line-height: 1.6; margin-bottom: 24px;">
        ${escapeHtml(message)} (The requested story or page does not exist or may have been removed.)
      </p>
      <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
        <a href="/" style="display: inline-block; padding: 10px 20px; background: #e11d48; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">මුල් පිටුවට (Home)</a>
        <a href="/categories" style="display: inline-block; padding: 10px 20px; background: #f1f5f9; color: #334155; text-decoration: none; border-radius: 8px; font-weight: 500;">කතා වර්ගීකරණ (Categories)</a>
        <a href="/sitemap" style="display: inline-block; padding: 10px 20px; background: #f1f5f9; color: #334155; text-decoration: none; border-radius: 8px; font-weight: 500;">සියලු කතා සූචිය (Directory)</a>
      </div>
    </main>`;

  let result = injectSeoIntoHtml(template, {
    title: 'කතාව හමු නොවීය (404 Not Found) | Walkathawa (වල් කතාව)',
    description: 'සොයන ලද කතාව හෝ පිටුව හමු නොවීය. Walkathawa හි ඇති වෙනත් රසවත් සිංහල කතා කියවීමට පිවිසෙන්න.',
    canonicalUrl: 'https://www.walkathawa.site/',
    ogImage: 'https://www.walkathawa.site/icon.png',
    bodyContent: notFoundBody,
  });

  result = result.replace(
    /<meta name="robots" content=".*?"\s*\/?>/i,
    '<meta name="robots" content="noindex, nofollow" />'
  );

  return result;
}

function renderHomeSeo(template: string, page = 1, isBot = false): string {
  const publishedStories = deduplicateStoriesBySlug(
    memoryDatabase.stories.filter((s) => s.published !== false)
  );
  const pageSize = 20;
  const totalPages = Math.ceil(publishedStories.length / pageSize) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * pageSize;
  const pageStories = publishedStories.slice(startIndex, startIndex + pageSize);

  const canonicalUrl = currentPage > 1 ? `https://www.walkathawa.site/?page=${currentPage}` : 'https://www.walkathawa.site/';
  const title = currentPage > 1
    ? `Walkathawa (වල් කතාව) - පිටුව ${currentPage} | Sinhala Stories Online`
    : 'Walkathawa (වල් කතාව) | Sinhala Stories Online';
  const description = currentPage > 1
    ? `Walkathawa (වල් කතාව) පිටුව ${currentPage}. නවතම සිංහල කතා, ආදර කතා, සහ රසවත් කෙටිකතා එකතුව දිනපතා අලුත් වේ.`
    : (memoryDatabase.settings.metaDescription || 'Walkathawa (වල් කතාව) is a place to read Sinhala stories online. Discover new Sinhala katha, romantic stories, fictional stories, and interesting short stories updated regularly.');

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
        itemListElement: pageStories.map((s, index) => ({
          '@type': 'ListItem',
          position: startIndex + index + 1,
          url: `https://www.walkathawa.site/story/${encodeURIComponent(s.slug)}`,
          name: s.title,
        })),
      },
    ],
  };

  // SSR HTML fallback for search engines
  const storiesHtml = pageStories
    .map((s) => {
      const sCatSlug = getStoryCanonicalCategory(s);
      return `
      <article style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
        <h2><a href="/story/${encodeURIComponent(s.slug)}" style="color: #0f172a; text-decoration: none;">${escapeHtml(s.title)}</a></h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">${escapeHtml(s.shortDescription || s.description || '')}</p>
        <small style="color: #64748b;">වර්ගීකරණය: <a href="/category/${sCatSlug}" style="color: #e11d48; text-decoration: none;">${escapeHtml(getCategoryDisplayName(sCatSlug))}</a></small>
      </article>`;
    })
    .join('\n');

  // Pagination crawlable links
  let paginationHtml = '';
  if (totalPages > 1) {
    const pageLinks = [];
    for (let p = 1; p <= totalPages; p++) {
      const pUrl = p === 1 ? '/' : `/?page=${p}`;
      const isCurr = p === currentPage;
      pageLinks.push(
        `<a href="${pUrl}" style="display: inline-block; padding: 6px 12px; margin: 0 4px; border-radius: 6px; text-decoration: none; font-weight: bold; ${
          isCurr ? 'background: #e11d48; color: #ffffff;' : 'background: #f1f5f9; color: #334155;'
        }">${p}</a>`
      );
    }
    paginationHtml = `
      <nav aria-label="Pagination" style="margin: 30px 0; text-align: center;">
        <span style="margin-right: 8px; color: #64748b; font-size: 14px;">පිටු (Pages):</span>
        ${pageLinks.join('\n')}
      </nav>`;
  }

  const bodyContent = `
    <main style="max-width: 1200px; margin: 0 auto; padding: 20px;">
      <h1>Walkathawa (වල් කතාව) | Sinhala Stories Online</h1>
      <p style="color: #64748b;">නවතම සිංහල කතා, ආදර කතා, සහ රසවත් කෙටිකතා එකතුව දිනපතා අලුත් වේ.</p>
      <div style="margin-top: 30px;">
        ${storiesHtml}
      </div>
      ${paginationHtml}
    </main>`;

  return injectSeoIntoHtml(template, {
    title,
    description,
    canonicalUrl,
    ogImage: 'https://www.walkathawa.site/icon.png',
    schemaJson,
    bodyContent,
    isBot,
  });
}

function renderNotFoundSeo(template: string, requestedUrl = '', isBot = false): string {
  const title = 'පිටුව හමු නොවීය (Page Not Found - 404) | Walkathawa (වල් කතාව)';
  const description = 'ඔබ සොයන කතාව හෝ පිටුව අප සතුව සොයාගත නොහැකි විය. වෙනත් රසවත් සිංහල කතා කියවීමට මුල් පිටුවට පිවිසෙන්න.';
  const bodyContent = `
    <main style="max-width: 800px; margin: 40px auto; padding: 24px; text-align: center;">
      <h1 style="font-size: 32px; color: #e11d48; margin-bottom: 16px;">404 - පිටුව හමු නොවීය</h1>
      <p style="color: #64748b; font-size: 16px; margin-bottom: 24px;">ඔබ සොයන කතාව ඉවත් කර හෝ වෙනත් ලිපිනයකට මාරු කර ඇත.</p>
      <div style="margin-top: 24px;">
        <a href="/" style="display: inline-block; background: #e11d48; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">← මුල් පිටුවට යන්න (Go to Home)</a>
      </div>
      <div style="margin-top: 16px;">
        <a href="/sitemap" style="color: #4f46e5; text-decoration: underline; font-size: 14px;">සියලු කතා නාමාවලිය (Story Directory)</a>
      </div>
    </main>`;

  return injectSeoIntoHtml(template, {
    title,
    description,
    canonicalUrl: requestedUrl || 'https://www.walkathawa.site/404',
    ogImage: 'https://www.walkathawa.site/icon.png',
    bodyContent,
    noindex: true,
    isBot,
  });
}

function renderStorySeo(template: string, story: Story, isBot = false): string {
  const storyUrl = `https://www.walkathawa.site/story/${encodeURIComponent(story.slug)}`;
  const title = `${story.title} | Walkathawa (වල් කතාව)`;
  const description = story.shortDescription || story.description || story.title;
  const publishedDate = getStoryDate(story);
  const modifiedDate = getValidIsoDate(story.updatedDate || story.updatedAt, publishedDate);
  const canonicalCat = getStoryCanonicalCategory(story);
  const catName = getCategoryDisplayName(canonicalCat);
  const catUrl = `https://www.walkathawa.site/category/${canonicalCat}`;

  const storyText = (story.fullContent || story.content || '').trim();
  const wordCount = storyText ? storyText.split(/\s+/).filter(Boolean).length : 250;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));

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
        wordCount,
        timeRequired: `PT${readingTimeMinutes}M`,
        keywords: `${story.title}, ${catName}, සිංහල කතා, walkathawa, sinhala katha, sinhala stories, wal katha, aluth katha`,
        genre: 'Sinhala Stories / Fiction / Romance',
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

  // Internal link graph: previous, next, and same-category contextual related stories
  const allStories = deduplicateStoriesBySlug(
    memoryDatabase.stories.filter((s) => s.published !== false)
  );
  const currentIndex = allStories.findIndex((s) => s.id === story.id || s.slug === story.slug);
  const prevStory = currentIndex > 0 ? allStories[currentIndex - 1] : null;
  const nextStory = currentIndex >= 0 && currentIndex < allStories.length - 1 ? allStories[currentIndex + 1] : null;

  // Prioritize related stories in the exact same category, backfilled by other categories
  const sameCategoryStories = allStories.filter(
    (s) => s.id !== story.id && s.slug !== story.slug && normalizeCategorySlug(s.category) === canonicalCat
  );
  const otherStories = allStories.filter(
    (s) => s.id !== story.id && s.slug !== story.slug && normalizeCategorySlug(s.category) !== canonicalCat
  );
  const relatedStories = [...sameCategoryStories, ...otherStories].slice(0, 6);

  const relatedHtml = relatedStories
    .map(
      (r) =>
        `<li style="margin-bottom: 12px;"><a href="/story/${encodeURIComponent(r.slug)}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${escapeHtml(r.title)}</a> <span style="color: #64748b; font-size: 13px;">(${escapeHtml(getCategoryDisplayName(r.category))})</span></li>`
    )
    .join('\n');

  const prevNextHtml = `
    <nav aria-label="Story Navigation" style="margin-top: 32px; padding: 16px 0; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
      ${
        prevStory
          ? `<a href="/story/${encodeURIComponent(prevStory.slug)}" style="color: #2563eb; text-decoration: none; font-weight: bold;">← ${escapeHtml(prevStory.title)} (කලින් කතාව)</a>`
          : '<span></span>'
      }
      ${
        nextStory
          ? `<a href="/story/${encodeURIComponent(nextStory.slug)}" style="color: #2563eb; text-decoration: none; font-weight: bold;">${escapeHtml(nextStory.title)} (ඊළඟ කතාව) →</a>`
          : '<span></span>'
      }
    </nav>`;

  const bodyContent = `
    <main style="max-width: 800px; margin: 0 auto; padding: 20px;">
      <nav style="margin-bottom: 20px; font-size: 14px; color: #64748b;">
        <a href="/" style="color: #2563eb; text-decoration: none;">මුල් පිටුව</a> &gt; 
        <a href="/category/${canonicalCat}" style="color: #2563eb; text-decoration: none;">${escapeHtml(catName)}</a> &gt; 
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

      ${prevNextHtml}

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

  const initialDataScript = `<script>window.__INITIAL_STORY__ = ${JSON.stringify(story).replace(/</g, '\\u003c')};</script>`;

  return injectSeoIntoHtml(template, {
    title,
    description,
    canonicalUrl: storyUrl,
    ogImage: story.coverImage || 'https://www.walkathawa.site/icon.png',
    schemaJson,
    bodyContent,
    initialDataScript,
    isBot,
  });
}

function renderCategorySeo(template: string, categorySlug: string, page = 1, isBot = false): string {
  const norm = normalizeCategorySlug(categorySlug);
  const catName = getCategoryDisplayName(norm);
  const canonicalUrl = page > 1 ? `https://www.walkathawa.site/category/${norm}?page=${page}` : `https://www.walkathawa.site/category/${norm}`;
  const title = page > 1 ? `${catName} - පිටුව ${page} | Walkathawa (වල් කතාව)` : `${catName} | Walkathawa (වල් කතාව)`;
  const description = `${catName} යටතේ ඇති නවතම සිංහල කතා එකතුව කියවන්න.`;

  const allCatStories = deduplicateStoriesBySlug(
    memoryDatabase.stories.filter(
      (s) => s.published !== false && normalizeCategorySlug(s.category) === norm
    )
  );

  const pageSize = 20;
  const totalPages = Math.ceil(allCatStories.length / pageSize) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * pageSize;
  const stories = allCatStories.slice(startIndex, startIndex + pageSize);

  const storiesHtml = stories
    .map(
      (s) => `
      <article style="margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">
        <h2><a href="/story/${encodeURIComponent(s.slug)}" style="color: #0f172a; text-decoration: none;">${escapeHtml(s.title)}</a></h2>
        <p style="color: #475569; font-size: 14px;">${escapeHtml(s.shortDescription || '')}</p>
      </article>`
    )
    .join('\n');

  let paginationHtml = '';
  if (totalPages > 1) {
    const pageLinks = [];
    for (let p = 1; p <= totalPages; p++) {
      const pUrl = p === 1 ? `/category/${norm}` : `/category/${norm}?page=${p}`;
      const isCurr = p === currentPage;
      pageLinks.push(
        `<a href="${pUrl}" style="display: inline-block; padding: 6px 12px; margin: 0 4px; border-radius: 6px; text-decoration: none; font-weight: bold; ${
          isCurr ? 'background: #e11d48; color: #ffffff;' : 'background: #f1f5f9; color: #334155;'
        }">${p}</a>`
      );
    }
    paginationHtml = `
      <nav aria-label="Pagination" style="margin: 30px 0; text-align: center;">
        <span style="margin-right: 8px; color: #64748b; font-size: 14px;">පිටු (Pages):</span>
        ${pageLinks.join('\n')}
      </nav>`;
  }

  const bodyContent = `
    <main style="max-width: 1200px; margin: 0 auto; padding: 20px;">
      <nav style="margin-bottom: 16px;"><a href="/" style="color: #2563eb; text-decoration: none;">← සියලුම කතා (All Stories)</a></nav>
      <h1>${escapeHtml(catName)}</h1>
      <p style="color: #64748b;">${escapeHtml(description)}</p>
      <div style="margin-top: 30px;">
        ${storiesHtml.length > 0 ? storiesHtml : '<p>මෙම වර්ගීකරණය යටතේ දැනට කතා නොමැත.</p>'}
      </div>
      ${paginationHtml}
    </main>`;

  const schemaJson = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalUrl}#collection`,
        url: canonicalUrl,
        name: title,
        description,
        inLanguage: 'si',
        isPartOf: {
          '@type': 'WebSite',
          '@id': 'https://www.walkathawa.site/#website',
          name: 'Walkathawa',
          url: 'https://www.walkathawa.site/',
        },
      },
      {
        '@type': 'BreadcrumbList',
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
            name: 'කතා වර්ගීකරණ (Categories)',
            item: 'https://www.walkathawa.site/categories',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: catName,
            item: `https://www.walkathawa.site/category/${norm}`,
          },
        ],
      },
      {
        '@type': 'ItemList',
        itemListElement: stories.map((s, index) => ({
          '@type': 'ListItem',
          position: startIndex + index + 1,
          url: `https://www.walkathawa.site/story/${encodeURIComponent(s.slug)}`,
          name: s.title,
        })),
      },
    ],
  };

  return injectSeoIntoHtml(template, {
    title,
    description,
    canonicalUrl,
    ogImage: 'https://www.walkathawa.site/icon.png',
    schemaJson,
    bodyContent,
    noindex: page > 1,
    isBot,
  });
}

function renderCategoriesListSeo(template: string, isBot = false): string {
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
    isBot,
  });
}

function renderPageSeo(
  template: string,
  title: string,
  description: string,
  urlPath: string,
  heading: string,
  bodyHtml: string
): string {
  const canonicalUrl = `https://www.walkathawa.site${urlPath}`;
  const bodyContent = `
    <main style="max-width: 860px; margin: 0 auto; padding: 24px; line-height: 1.8;">
      <nav style="margin-bottom: 20px;"><a href="/" style="color: #2563eb; text-decoration: none;">← මුල් පිටුව (Home)</a></nav>
      <article>
        <h1 style="font-size: 26px; margin-bottom: 16px;">${escapeHtml(heading)}</h1>
        <div style="color: #334155; font-size: 16px;">
          ${bodyHtml}
        </div>
      </article>
    </main>`;

  return injectSeoIntoHtml(template, {
    title: `${title} | Walkathawa (වල් කතාව)`,
    description,
    canonicalUrl,
    ogImage: 'https://www.walkathawa.site/icon.png',
    bodyContent,
  });
}

// --- DYNAMIC SITEMAP, ROBOTS, AND RSS/ATOM FEEDS ---

// 1. Master Sitemap Index XML
app.get('/sitemap.xml', async (_req: Request, res: Response) => {
  const baseUrl = 'https://www.walkathawa.site';
  const stories = await syncStoriesFromFirestore(false);
  const publishedStories = deduplicateStoriesBySlug(stories.filter((s) => s.published !== false));
  const latestStoryMod = getLatestStoryDate(publishedStories);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  xml += `  <sitemap>\n`;
  xml += `    <loc>${baseUrl}/sitemap-main.xml</loc>\n`;
  xml += `    <lastmod>${latestStoryMod}</lastmod>\n`;
  xml += `  </sitemap>\n`;
  xml += `  <sitemap>\n`;
  xml += `    <loc>${baseUrl}/sitemap-stories.xml</loc>\n`;
  xml += `    <lastmod>${latestStoryMod}</lastmod>\n`;
  xml += `  </sitemap>\n`;
  xml += `</sitemapindex>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=1800');
  res.setHeader('X-Robots-Tag', 'all');
  res.status(200).send(xml);
});

// 2. Main Structural & Category Sitemap XML
app.get('/sitemap-main.xml', async (_req: Request, res: Response) => {
  const baseUrl = 'https://www.walkathawa.site';
  const stories = await syncStoriesFromFirestore(false);
  const publishedStories = deduplicateStoriesBySlug(stories.filter((s) => s.published !== false));
  const categories = memoryDatabase.categories.filter((c) => c.slug !== 'all');
  const latestOverallDate = getLatestStoryDate(publishedStories);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // 1. Homepage
  xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${latestOverallDate}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

  // 2. Categories Special Directory Page
  xml += `  <url>\n    <loc>${baseUrl}/categories</loc>\n    <lastmod>${latestOverallDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;

  // 3. Sitemap / Archives Page
  xml += `  <url>\n    <loc>${baseUrl}/sitemap</loc>\n    <lastmod>${latestOverallDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;

  // 4. Policy Pages
  const staticPages = ['/privacy', '/terms', '/dmca', '/about'];
  for (const pagePath of staticPages) {
    xml += `  <url>\n    <loc>${baseUrl}${pagePath}</loc>\n    <lastmod>${latestOverallDate}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
  }

  // 5. Category Pages with accurate content-derived lastmod (only valid non-empty categories)
  for (const cat of categories) {
    const catStories = publishedStories.filter((s) => normalizeCategorySlug(s.category) === cat.slug);
    if (catStories.length === 0) continue;
    const catLastMod = getLatestStoryDate(catStories);
    xml += `  <url>\n    <loc>${baseUrl}/category/${cat.slug}</loc>\n    <lastmod>${catLastMod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
  }

  xml += `</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=1800');
  res.setHeader('X-Robots-Tag', 'all');
  res.status(200).send(xml);
});

// 3. Dedicated Stories Sitemap XML (Zero Duplication with Main Sitemap)
app.get('/sitemap-stories.xml', async (_req: Request, res: Response) => {
  const baseUrl = 'https://www.walkathawa.site';
  const stories = await syncStoriesFromFirestore(false);
  const publishedStories = deduplicateStoriesBySlug(stories.filter((s) => s.published !== false));

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  for (const story of publishedStories) {
    const storyUrl = `${baseUrl}/story/${encodeURIComponent(story.slug)}`;
    const lastMod = getStoryDate(story);
    xml += `  <url>\n    <loc>${storyUrl}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n`;
    if (story.coverImage && story.coverImage.startsWith('http')) {
      xml += `    <image:image>\n      <image:loc>${escapeHtml(story.coverImage)}</image:loc>\n      <image:title>${escapeHtml(story.title)}</image:title>\n    </image:image>\n`;
    }
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=1800');
  res.setHeader('X-Robots-Tag', 'all');
  res.status(200).send(xml);
});

// 4. Robots.txt
app.get('/robots.txt', (_req: Request, res: Response) => {
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/admin
Disallow: /api/auth

Sitemap: https://www.walkathawa.site/sitemap.xml
Sitemap: https://www.walkathawa.site/sitemap-stories.xml
Sitemap: https://www.walkathawa.site/sitemap-main.xml
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
app.get('/api/stories', async (req: Request, res: Response) => {
  await syncStoriesFromFirestore(false);
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
  await syncStoriesFromFirestore(false);
  const story = await findStoryBySlugOrId(req.params.slug);

  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }

  res.json(story);
});

// GET /api/stories/:slug/related
app.get('/api/stories/:slug/related', async (req: Request, res: Response) => {
  await syncStoriesFromFirestore(false);
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
    const newStory: Story = {
      id,
      slug: req.body.slug || id,
      title: req.body.title || '',
      category: req.body.category || 'all',
      content: req.body.content || req.body.fullContent || '',
      fullContent: req.body.fullContent || req.body.content || '',
      shortDescription: req.body.shortDescription || req.body.description || '',
      description: req.body.description || req.body.shortDescription || '',
      uploadDate: req.body.uploadDate || new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      published: req.body.published !== false,
      featured: !!req.body.featured,
      views: req.body.views || 0,
      ...req.body,
    };
    memoryDatabase.stories.unshift(newStory);
    memoryDatabase.stories = deduplicateStoriesBySlug(memoryDatabase.stories);
    saveDatabase();
    return res.status(200).json(newStory);
  }

  const updated: Story = {
    ...memoryDatabase.stories[index],
    ...req.body,
    updatedDate: new Date().toISOString(),
  };

  memoryDatabase.stories[index] = updated;
  memoryDatabase.stories = deduplicateStoriesBySlug(memoryDatabase.stories);
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
  return res.redirect(301, `https://www.walkathawa.site/story/${encodeURIComponent(story)}`);
});

app.get(['/posts/:story', '/katha/:story'], (req: Request, res: Response) => {
  return res.redirect(301, `https://www.walkathawa.site/story/${encodeURIComponent(req.params.story)}`);
});

// --- STATIC ASSETS & SSR ROUTING ---
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const isDev = process.env.NODE_ENV !== 'production' && !isServerless;
const distPath = path.join(process.cwd(), 'dist');

if (!isDev) {
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
}

let viteInstance: any = null;

async function getTransformedHtml(url: string): Promise<string> {
  let template = getHtmlTemplate();
  if (viteInstance && typeof viteInstance.transformIndexHtml === 'function') {
    try {
      template = await viteInstance.transformIndexHtml(url, template);
    } catch (err) {
      console.warn('[Vite Transform Warning]:', err);
    }
  }
  return template;
}

// 1. Homepage SSR
app.get('/', async (req: Request, res: Response) => {
  try {
    await syncStoriesFromFirestore(false);
    const isBot = isSearchEngineCrawler(req.headers['user-agent'] as string);
    const pageNum = parseInt(String(req.query.page || '1'), 10) || 1;
    const template = await getTransformedHtml(req.originalUrl || '/');
    const rendered = renderHomeSeo(template, pageNum, isBot);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400');
    return res.status(200).send(rendered);
  } catch (err) {
    console.error('[SSR / error]:', err);
    const template = getHtmlTemplate();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(template);
  }
});

// 2. Story Detail SSR
app.get('/story/:slug', async (req: Request, res: Response) => {
  try {
    await syncStoriesFromFirestore(false);
    const isBot = isSearchEngineCrawler(req.headers['user-agent'] as string);
    const story = await findStoryBySlugOrId(req.params.slug);
    const template = await getTransformedHtml(req.originalUrl);

    if (!story) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
      return res.status(404).send(renderNotFoundSeo(template, `https://www.walkathawa.site/story/${encodeURIComponent(req.params.slug)}`, isBot));
    }

    const rendered = renderStorySeo(template, story, isBot);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400');
    return res.status(200).send(rendered);
  } catch (err) {
    console.error('[SSR /story error]:', err);
    const template = getHtmlTemplate();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(template);
  }
});

// 3. Category Filter SSR
app.get('/category/:slug', async (req: Request, res: Response) => {
  try {
    await syncStoriesFromFirestore(false);
    const isBot = isSearchEngineCrawler(req.headers['user-agent'] as string);
    const rawSlug = req.params.slug || '';
    const norm = normalizeCategorySlug(rawSlug);
    const pageNum = parseInt(String(req.query.page || '1'), 10) || 1;

    // Check if category exists in canonical taxonomy, database categories, or has matching stories
    const catExists =
      norm === 'all' ||
      isValidCategorySlug(norm) ||
      memoryDatabase.categories.some((c) => c.slug.toLowerCase() === norm.toLowerCase()) ||
      memoryDatabase.stories.some((s) => normalizeCategorySlug(s.category) === norm);

    if (!catExists) {
      const template = await getTransformedHtml(req.originalUrl);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
      return res.status(404).send(renderNotFoundSeo(template, `https://www.walkathawa.site/category/${encodeURIComponent(rawSlug)}`, isBot));
    }

    // 301 Permanent Redirect non-canonical category alias URLs (e.g., Sinhala aliases like /category/පාසල්-කතා -> /category/school)
    if (rawSlug !== norm && isValidCategorySlug(norm)) {
      const targetQuery = req.query.page ? `?page=${encodeURIComponent(String(req.query.page))}` : '';
      return res.redirect(301, `/category/${norm}${targetQuery}`);
    }

    const template = await getTransformedHtml(req.originalUrl);
    const rendered = renderCategorySeo(template, norm, pageNum, isBot);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400');
    return res.status(200).send(rendered);
  } catch (err) {
    console.error('[SSR /category error]:', err);
    const template = getHtmlTemplate();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(template);
  }
});

// 4. Categories Directory SSR
app.get('/categories', async (req: Request, res: Response) => {
  try {
    await syncStoriesFromFirestore(false);
    const isBot = isSearchEngineCrawler(req.headers['user-agent'] as string);
    const template = await getTransformedHtml(req.originalUrl);
    const rendered = renderCategoriesListSeo(template, isBot);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400');
    return res.status(200).send(rendered);
  } catch (err) {
    console.error('[SSR /categories error]:', err);
    const template = getHtmlTemplate();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(template);
  }
});

// 5. Sitemap & Archives SSR
app.get(['/sitemap', '/archives'], async (req: Request, res: Response) => {
  try {
    await syncStoriesFromFirestore(false);
    const isBot = isSearchEngineCrawler(req.headers['user-agent'] as string);
    const template = await getTransformedHtml(req.originalUrl);

    const allStoriesList = memoryDatabase.stories
      .filter((s) => s.published !== false)
      .map(
        (s) =>
          `<li style="margin-bottom: 12px;"><a href="/story/${encodeURIComponent(s.slug)}" style="color: #2563eb; font-weight: 500;">${escapeHtml(s.title)}</a> <span style="color: #64748b; font-size: 13px;">(${escapeHtml(getCategoryDisplayName(s.category))})</span></li>`
      )
      .join('\n');

    const archiveBody = `
      <main style="max-width: 1000px; margin: 0 auto; padding: 24px;">
        <nav style="margin-bottom: 20px;"><a href="/" style="color: #2563eb; text-decoration: none;">← නැවත මුල් පිටුවට</a></nav>
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
      isBot,
    });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400');
    return res.status(200).send(rendered);
  } catch (err) {
    console.error('[SSR /sitemap error]:', err);
    const template = getHtmlTemplate();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(template);
  }
});

// 6. Privacy Policy SSR
app.get('/privacy', async (req: Request, res: Response) => {
  try {
    const template = await getTransformedHtml(req.originalUrl);
    const content = `
      <p>Walkathawa (වල් කතාව) වෙබ් අඩවිය භාවිතා කරන ඔබගේ පෞද්ගලිකත්වය ආරක්ෂා කිරීම අපගේ ප්‍රමුඛතාවයයි.</p>
      <h2 style="font-size: 20px; margin-top: 20px;">1. තොරතුරු රැස්කිරීම</h2>
      <p>අපගේ වෙබ් අඩවියේ කතා කියවීම සඳහා කිසිදු පෞද්ගලික තොරතුරක් ඇතුළත් කිරීම අවශ්‍ය නොවේ. Google Analytics හරහා වෙබ් අඩවියේ ක්‍රියාකාරිත්වය පිළිබඳ නිර්නාමික සංඛ්‍යාලේඛන පමණක් විශ්ලේෂණය කරනු ලැබේ.</p>
      <h2 style="font-size: 20px; margin-top: 20px;">2. කුකීස් (Cookies)</h2>
      <p>පරිශීලක අත්දැකීම වැඩිදියුණු කිරීම සහ වෙබ් අඩවියේ තේමා තේරීම් සුරැකීමට බ්‍රවුසරයේ Local Storage සහ කුකීස් භාවිතා වේ.</p>
    `;
    const rendered = renderPageSeo(
      template,
      'Privacy Policy (පෞද්ගලිකත්ව ප්‍රතිපත්තිය)',
      'Walkathawa පෞද්ගලිකත්ව ප්‍රතිපත්තිය සහ දත්ත ආරක්ෂණ මාර්ගෝපදේශ.',
      '/privacy',
      'Privacy Policy (පෞද්ගලිකත්ව ප්‍රතිපත්තිය)',
      content
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(rendered);
  } catch (err) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(getHtmlTemplate());
  }
});

// 7. Terms & Conditions SSR
app.get('/terms', async (req: Request, res: Response) => {
  try {
    const template = await getTransformedHtml(req.originalUrl);
    const content = `
      <p>Walkathawa (වල් කතාව) වෙබ් අඩවියට පිවිසීමෙන් ඔබ මෙම කොන්දේසි වලට එකඟ වේ.</p>
      <h2 style="font-size: 20px; margin-top: 20px;">1. අන්තර්ගත භාවිතය</h2>
      <p>මෙහි පළවන සියලුම නිර්මාණ සහ කතා කියවීම සඳහා පමණක් වන අතර කතුවරුන්ගේ අවසරයකින් තොරව වෙනත් මාධ්‍යවල නැවත පළකිරීම තහනම් වේ.</p>
      <h2 style="font-size: 20px; margin-top: 20px;">2. වයස් සීමාව</h2>
      <p>අඩවියේ අන්තර්ගත ඇතැම් කතා වැඩිහිටි පාඨකයින් සඳහා පමණක් අදහස් කෙරේ.</p>
    `;
    const rendered = renderPageSeo(
      template,
      'Terms & Conditions (භාවිත නියමයන්)',
      'Walkathawa වෙබ් අඩවියේ භාවිත නියමයන් සහ කොන්දේසි.',
      '/terms',
      'Terms & Conditions (භාවිත නියමයන්)',
      content
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(rendered);
  } catch (err) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(getHtmlTemplate());
  }
});

// 8. DMCA / Copyright SSR
app.get('/dmca', async (req: Request, res: Response) => {
  try {
    const template = await getTransformedHtml(req.originalUrl);
    const content = `
      <p>Walkathawa respects the intellectual property rights of others. If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement, please contact us with the details.</p>
      <p>Contact: <a href="mailto:mchethiyabandara@gmail.com" style="color: #2563eb;">mchethiyabandara@gmail.com</a></p>
    `;
    const rendered = renderPageSeo(
      template,
      'DMCA & Copyright Policy',
      'Digital Millennium Copyright Act (DMCA) policy for Walkathawa.',
      '/dmca',
      'DMCA & Copyright Policy',
      content
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(rendered);
  } catch (err) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(getHtmlTemplate());
  }
});

// 9. About Us SSR
app.get('/about', async (req: Request, res: Response) => {
  try {
    const template = await getTransformedHtml(req.originalUrl);
    const content = `
      <p>Walkathawa (වල් කතාව) යනු සිංහල භාෂාවෙන් නිර්මාණය වූ නවකතා, කෙටිකතා සහ ආදර කතා කියවීමට නිර්මාණය කළ සරල, වේගවත් අන්තර්ජාල එකතුවකි.</p>
      <p>අපගේ අරමුණ පාඨකයින්ට පහසුවෙන් රසවත් නිර්මාණ රසවිඳීමට මෙන්ම නවක නිර්මාණකරුවන්ට තම කතා පළකිරීමට සුදුසු වේදිකාවක් සැපයීමයි.</p>
    `;
    const rendered = renderPageSeo(
      template,
      'About Us (අප ගැන)',
      'Walkathawa (වල් කතාව) පිළිබඳ තොරතුරු සහ අපගේ සේවාව.',
      '/about',
      'About Us (අප ගැන)',
      content
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(rendered);
  } catch (err) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(getHtmlTemplate());
  }
});

// 10. Popular & Latest aliases
app.get(['/popular', '/latest'], async (req: Request, res: Response) => {
  try {
    await syncStoriesFromFirestore(false);
    const template = await getTransformedHtml(req.originalUrl);
    const rendered = renderHomeSeo(template);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(rendered);
  } catch (err) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(getHtmlTemplate());
  }
});

// 11. Admin SPA routes
app.get(['/admin', '/admin/*'], async (req: Request, res: Response) => {
  const template = await getTransformedHtml(req.originalUrl);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(template);
});

// 7. Serverless destination fallback /api/index
app.all(['/api/index', '/api/index.ts'], (_req: Request, res: Response) => {
  const template = getHtmlTemplate();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(template);
});

// 8. Fallback SPA catch-all
app.get('*', async (req: Request, res: Response) => {
  const template = await getTransformedHtml(req.originalUrl);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(template);
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Express Uncaught Error]:', err);
  if (!res.headersSent) {
    res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(
      getHtmlTemplate()
    );
  }
});

// --- SERVER LIFECYCLE (LOCAL DEV & STANDALONE) ---
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
    try {
      const { createServer: createViteServer } = await import('vite');
      const isHmrDisabled = process.env.DISABLE_HMR === 'true';
      viteInstance = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: isHmrDisabled ? false : { server: httpServer! },
        },
        appType: 'spa',
      });
      app.use(viteInstance.middlewares);
    } catch (e) {
      console.warn('[Vite Dev Server Init Notice]:', e);
    }
  }

  return new Promise<http.Server>((resolve) => {
    if (isServerless) {
      httpServer = http.createServer(app);
      resolve(httpServer);
    } else {
      httpServer = app.listen(PORT, () => {
        console.log(`[Walkathawa Server] Listening on http://localhost:${PORT}`);
        resolve(httpServer!);
      });
      httpServer.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`[Walkathawa Server] Port ${PORT} already active.`);
          resolve(httpServer!);
        } else {
          console.error('[Walkathawa Server] Server error:', err);
        }
      });
    }
  });
}

// Auto-start only when executed as the main entrypoint
const isDirectExecution =
  Boolean(
    process.argv[1] &&
      (process.argv[1].endsWith('server.ts') ||
        process.argv[1].endsWith('server.js') ||
        process.argv[1].endsWith('server.cjs'))
  );

if (
  isDirectExecution &&
  !process.env.VERCEL &&
  !process.env.AWS_LAMBDA_FUNCTION_NAME &&
  !process.env.NOW_REGION
) {
  startServer().catch((err) => {
    console.warn('[Server Startup Warning]:', err);
  });
}

export default app;
