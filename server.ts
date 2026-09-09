import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { INITIAL_STORIES, INITIAL_CATEGORIES } from './src/data/seedStories';
import { Story, Category } from './src/types/story';
import { DirectAdSettings, SiteSettings, User } from './src/types/admin';

const app = express();
const PORT = 3000;

// Security & Best Practice Headers Middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Canonical Host Enforcement & Anti-Indexing for Staging/Preview Domains
app.use((req: Request, res: Response, next: NextFunction) => {
  const forwardedHost = (req.headers['x-forwarded-host'] as string) || '';
  const hostHeader = req.get('host') || '';
  const host = (forwardedHost || hostHeader).split(':')[0].toLowerCase();
  const proto = ((req.headers['x-forwarded-proto'] as string) || req.protocol || 'https').toLowerCase();

  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
  const isCanonicalProd = host === 'www.walkathawa.site';
  const isApexProd = host === 'walkathawa.site';

  // 1. If apex domain 'walkathawa.site', permanently (301) redirect to 'https://www.walkathawa.site'
  if (isApexProd) {
    return res.redirect(301, `https://www.walkathawa.site${req.originalUrl}`);
  }

  // 2. If HTTP on canonical domain, redirect to HTTPS
  if (isCanonicalProd && proto === 'http') {
    return res.redirect(301, `https://www.walkathawa.site${req.originalUrl}`);
  }

  // 3. If accessed via Cloud Run domain (*.run.app) or any preview/staging host (not local dev):
  // Strictly prevent search engines from crawling or indexing these staging/dev domains!
  if (!isCanonicalProd && !isLocal) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  next();
});

// Parse incoming JSON requests with generous limit for cover images
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// --- DATABASE PERSISTENCE LAYER ---
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

interface DatabaseSchema {
  users: Array<User & { passwordHash: string; salt: string }>;
  stories: Story[];
  categories?: Category[];
  advertisements: DirectAdSettings;
  postAdvertisements: Record<string, string>; // storyId -> adCode
  settings: SiteSettings;
  activeSessions: Record<string, { userId: string; email: string; role: string; expiresAt: number }>;
}

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@storyhub.com';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminSecurePassword2026!';
const JWT_SECRET = process.env.JWT_SECRET || 'storyhub-prod-secret-signing-key-2026';

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function generateToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): { userId: string; email: string; role: string; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      const decoded = JSON.parse(Buffer.from(body, 'base64url').toString());
      if (decoded.exp && Date.now() > decoded.exp) {
        return null;
      }
      return decoded;
    }

    // Support Firebase ID tokens fallback
    try {
      const decoded = JSON.parse(Buffer.from(body, 'base64url').toString());
      if (decoded && (decoded.user_id || decoded.sub || decoded.email)) {
        if (decoded.exp && Date.now() / 1000 > decoded.exp) {
          return null;
        }
        return {
          userId: decoded.user_id || decoded.sub || decoded.userId || 'admin',
          email: decoded.email || 'admin@walkathawa.site',
          role: 'admin',
          exp: decoded.exp ? decoded.exp * 1000 : Date.now() + 86400000,
        };
      }
    } catch {
      // Ignore
    }

    return null;
  } catch {
    return null;
  }
}

// Initialize Database
let db: DatabaseSchema;

function initDatabase(): void {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {
      // ignore
    }
  }

  const defaultSalt = crypto.randomBytes(16).toString('hex');
  const defaultAdmin: User & { passwordHash: string; salt: string } = {
    uid: 'usr_admin_root',
    email: DEFAULT_ADMIN_EMAIL,
    role: 'admin',
    createdAt: new Date().toISOString(),
    salt: defaultSalt,
    passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD, defaultSalt),
  };

  const defaultStories: Story[] = INITIAL_STORIES.map((s) => ({
    ...s,
    uploadedDate: s.uploadDate,
    directAdLink: '',
  }));

  const defaultAds: DirectAdSettings = {
    globalDirectLink: '',
    enabled: false,
    maxTriggers: 1,
  };

  const defaultSettings: SiteSettings = {
    siteName: 'Walkathawa (වල් කතාව)',
    alternateName: 'වල් කතාව',
    logo: '/icon.png',
    tagline: 'A place to read Sinhala stories online',
    contactEmail: 'contact@walkathawa.com',
    metaTitle: 'Walkathawa (වල් කතාව) | Sinhala Stories Online',
    metaDescription:
      'Walkathawa (වල් කතාව) is a place to read Sinhala stories online. Discover new Sinhala katha, romantic stories, fictional stories, and interesting short stories updated regularly.',
    keywords:
      'walkatha, walakatha, walkathawa, වල් කතා, වල්කතා, sinhala stories, sinhala katha, sinhala short stories, sinhala kathandara, sinhala love stories, sinhala adult stories, sinhala romantic stories, sinhala fictional stories, sinhala novels, new sinhala stories, latest sinhala katha, online sinhala stories, read sinhala stories online',
    ogImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    googleAnalyticsId: '',
    searchConsoleVerification: 'aoXN34vuFG8HPn2ngc_Pmqky8knpnPtglDWTX5qFUd4',
    publisherName: 'Walkathawa (වල් කතාව)',
  };

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(raw);
      if (!db.users || db.users.length === 0) {
        db.users = [defaultAdmin];
      }
      if (!db.stories || db.stories.length === 0) {
        db.stories = defaultStories;
      }
      if (!db.advertisements) {
        db.advertisements = defaultAds;
      }
      if (!db.postAdvertisements) {
        db.postAdvertisements = {};
      }
      if (!db.settings) {
        db.settings = defaultSettings;
      }
      if (!db.activeSessions) {
        db.activeSessions = {};
      }
    } catch {
      db = {
        users: [defaultAdmin],
        stories: defaultStories,
        advertisements: defaultAds,
        postAdvertisements: {},
        settings: defaultSettings,
        activeSessions: {},
      };
      saveDatabase();
    }
  } else {
    db = {
      users: [defaultAdmin],
      stories: defaultStories,
      advertisements: defaultAds,
      postAdvertisements: {},
      settings: defaultSettings,
      activeSessions: {},
    };
    saveDatabase();
  }
}

function saveDatabase(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

initDatabase();

// --- AUTHENTICATION MIDDLEWARE ---
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Token is invalid or has expired' });
  }

  req.user = decoded;
  next();
}

// --- PUBLIC APIS ---

// Public: List Published Stories
app.get('/api/public/stories', (req: Request, res: Response) => {
  const { category, search, tag, sortBy, page = '1', limit = '20' } = req.query;

  let stories = db.stories.filter((s) => s.published);

  if (category && category !== 'all') {
    stories = stories.filter((s) => s.category.toLowerCase() === String(category).toLowerCase());
  }

  if (search && String(search).trim()) {
    const q = String(search).toLowerCase().trim();
    stories = stories.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.shortDescription.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)) ||
        s.author.name.toLowerCase().includes(q)
    );
  }

  if (tag) {
    stories = stories.filter((s) => s.tags.some((t) => t.toLowerCase() === String(tag).toLowerCase()));
  }

  if (sortBy === 'popular') {
    stories.sort((a, b) => b.views - a.views);
  } else if (sortBy === 'readingTime') {
    stories.sort((a, b) => a.readingTime - b.readingTime);
  } else {
    // Default latest
    stories.sort((a, b) => new Date(b.uploadDate || b.uploadedDate || 0).getTime() - new Date(a.uploadDate || a.uploadedDate || 0).getTime());
  }

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.max(1, Math.min(500, parseInt(String(limit), 10) || 20));
  const total = stories.length;
  const totalPages = Math.ceil(total / limitNum) || 1;
  const offset = (pageNum - 1) * limitNum;
  const paginatedStories = stories.slice(offset, offset + limitNum);

  res.json({
    data: paginatedStories,
    total,
    page: pageNum,
    totalPages,
    hasMore: pageNum < totalPages,
  });
});

// Public: Atomic Story View Increment
app.post('/api/public/stories/:id/view', (req: Request, res: Response) => {
  const { id } = req.params;
  const story = db.stories.find((s) => s.id === id || s.slug === id);
  if (story) {
    story.views = (story.views || 0) + 1;
    saveDatabase();
    return res.json({ success: true, views: story.views });
  }
  res.json({ success: false, error: 'Story not found' });
});

// Public: Get Story by Slug with View Increment
app.get('/api/public/stories/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const story = db.stories.find((s) => s.slug === slug || s.id === slug);

  if (!story || (!story.published && req.headers['x-admin-preview'] !== 'true')) {
    return res.status(404).json({ error: 'Story not found' });
  }

  // Increment view counter
  story.views = (story.views || 0) + 1;
  saveDatabase();

  // Attach individual story ad code from postAdvertisements if present
  const directAdLink = db.postAdvertisements[story.id] || story.directAdLink || '';

  // Get 3 related stories
  const relatedStories = db.stories
    .filter((s) => s.published && s.id !== story.id && (s.category === story.category || s.tags.some((t) => story.tags.includes(t))))
    .slice(0, 3);

  res.json({
    story: {
      ...story,
      directAdLink,
    },
    relatedStories,
  });
});

// Public: Get Advertisement Configuration
app.get('/api/public/ads/config', (_req: Request, res: Response) => {
  res.json({
    ...db.advertisements,
  });
});

// Public: Get Categories
app.get('/api/public/categories', (_req: Request, res: Response) => {
  res.json(db.categories || INITIAL_CATEGORIES);
});

// Public: Get Public Site & SEO Settings
app.get('/api/public/settings', (_req: Request, res: Response) => {
  res.json({
    siteName: db.settings?.siteName || 'Walkathawa (වල් කතාව)',
    alternateName: db.settings?.alternateName || 'වල් කතාව',
    tagline: db.settings?.tagline || 'A place to read Sinhala stories online',
    logo: db.settings?.logo || '/icon.png',
    metaTitle: db.settings?.metaTitle || 'Walkathawa (වල් කතාව) | Sinhala Stories Online',
    metaDescription: db.settings?.metaDescription || 'Walkathawa (වල් කතාව) is a place to read Sinhala stories online. Discover new Sinhala katha, romantic stories, fictional stories, and interesting short stories updated regularly.',
    keywords: db.settings?.keywords || 'walkatha, walakatha, walkathawa, වල් කතා, වල්කතා, sinhala stories, sinhala katha, sinhala short stories, sinhala kathandara, sinhala love stories, sinhala romantic stories, sinhala novels, new sinhala stories, read sinhala stories online',
    ogImage: db.settings?.ogImage || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    googleAnalyticsId: db.settings?.googleAnalyticsId || '',
    searchConsoleVerification: db.settings?.searchConsoleVerification || '',
    publisherName: db.settings?.publisherName || 'Walkathawa (වල් කතාව)',
  });
});

// --- SITEMAP STYLESHEET (XSL) ---
app.get('/sitemap.xsl', (_req: Request, res: Response) => {
  const xsl = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
  xmlns:html="http://www.w3.org/TR/REC-html40"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="si">
      <head>
        <title>XML Sitemap | Walkathawa (වල් කතාව)</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style type="text/css">
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
            background: #090d16;
            color: #cbd5e1;
            margin: 0;
            padding: 30px 20px;
          }
          .container {
            max-width: 1100px;
            margin: 0 auto;
            background: #0f172a;
            border-radius: 16px;
            border: 1px solid #1e293b;
            padding: 30px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
          }
          h1 {
            color: #ffffff;
            font-size: 24px;
            margin-top: 0;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          h1 span {
            color: #818cf8;
            font-size: 16px;
            font-weight: normal;
          }
          p.desc {
            color: #94a3b8;
            font-size: 13px;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .stats {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
          }
          .stat-badge {
            background: #1e293b;
            border: 1px solid #334155;
            padding: 8px 16px;
            border-radius: 10px;
            font-size: 12px;
            color: #e2e8f0;
          }
          .stat-badge strong {
            color: #38bdf8;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            text-align: left;
          }
          th {
            background: #1e293b;
            color: #f8fafc;
            padding: 12px 14px;
            font-weight: 600;
            border-bottom: 1px solid #334155;
          }
          th:first-child { border-top-left-radius: 8px; }
          th:last-child { border-top-right-radius: 8px; }
          td {
            padding: 10px 14px;
            border-bottom: 1px solid #1e293b;
            color: #94a3b8;
          }
          tr:hover td {
            background: #131d33;
            color: #f1f5f9;
          }
          a {
            color: #818cf8;
            text-decoration: none;
            word-break: break-all;
          }
          a:hover {
            text-decoration: underline;
            color: #a5b4fc;
          }
          .priority-tag {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 11px;
            background: #1e293b;
            color: #38bdf8;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Walkathawa XML Sitemap <span>(වල් කතාව සයිට්මැප්)</span></h1>
          <p class="desc">
            This XML sitemap is generated dynamically for search engines like Google, Bing, and web crawlers, indexable at <strong>/sitemap.xml</strong> and <strong>/sitemap</strong>.
          </p>
          <div class="stats">
            <div class="stat-badge">Total URLs: <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong></div>
            <div class="stat-badge">Website: <strong>Walkathawa</strong></div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>URL Location</th>
                <th style="width: 90px;">Priority</th>
                <th style="width: 120px;">Change Freq</th>
                <th style="width: 170px;">Last Modified</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td><xsl:value-of select="position()"/></td>
                  <td>
                    <a href="{sitemap:loc}" target="_blank">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td><span class="priority-tag"><xsl:value-of select="sitemap:priority"/></span></td>
                  <td><xsl:value-of select="sitemap:changefreq"/></td>
                  <td><xsl:value-of select="sitemap:lastmod"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`;

  res.header('Content-Type', 'text/xsl; charset=utf-8');
  res.send(xsl);
});

// Helper to determine base public URL
function getBasePublicUrl(req: Request): string {
  const forwardedHost = req.headers['x-forwarded-host'] as string;
  const host = forwardedHost || req.get('host') || 'www.walkathawa.site';
  const cleanHost = host.split(':')[0]; // Remove port if present for production domain
  const port = host.includes(':') && (host.includes('localhost') || host.includes('127.0.0.1')) ? `:${host.split(':')[1]}` : '';
  const finalHost = cleanHost.includes('walkathawa') || cleanHost.includes('run.app') || cleanHost.includes('localhost')
    ? `${cleanHost}${port}`
    : 'www.walkathawa.site';
  const protocol = req.headers['x-forwarded-proto'] === 'http' ? 'http' : 'https';
  return `${protocol}://${finalHost}`;
}

const BANNED_MOCK_PATTERNS = [
  'rahas-hamuwima',
  'nil-diyawara',
  'madhyama-rathriye',
  'tharu-piri',
  'nodutu-sihinaya',
  'wasi-bindu',
  'the-secret-in-moonlight',
  'story-the-secret-in-moonlight',
  'සඳ එළියේ රහස',
  'රහස් හමුවීම',
  'නිල් දියවර',
  'මධ්‍යම රාත්‍රියේ',
  'තරු පිරි අහස',
  'නොදුටු සිහිනය',
  'වැසි බිඳු අතරින්',
  'නිස්කලංක රාත්‍රියක හමුවූ අමුතු ආගන්තුකයා',
];

function isMockStoryRecord(s: { id?: string; slug?: string; title?: string }): boolean {
  if (!s) return false;
  const id = String(s.id || '').toLowerCase();
  const slug = String(s.slug || '').toLowerCase();
  const title = String(s.title || '').toLowerCase();
  return BANNED_MOCK_PATTERNS.some(
    (p) => id.includes(p) || slug.includes(p) || title.includes(p)
  );
}

// Helper to gather all published stories (local db + Firestore if reachable)
async function getSitemapStoriesList(): Promise<Story[]> {
  const storiesMap = new Map<string, Story>();

  // 1. Seed from local database.json (if available)
  for (const s of db.stories || []) {
    if (s && s.slug && s.published !== false && !isMockStoryRecord(s)) {
      storiesMap.set(s.slug, s);
    }
  }

  // 2. Fetch live data from Firestore as source of truth
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config?.projectId && config?.firestoreDatabaseId && config?.apiKey) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/stories?key=${config.apiKey}&pageSize=300`;
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (resp.ok) {
          const data = (await resp.json()) as any;
          if (data.documents && Array.isArray(data.documents)) {
            for (const doc of data.documents) {
              const fields = doc.fields || {};
              const slug = fields.slug?.stringValue;
              const title = fields.title?.stringValue || '';
              const id = doc.name.split('/').pop() || slug || '';
              if (isMockStoryRecord({ id, slug, title })) {
                continue;
              }
              const published = fields.published?.booleanValue !== false;
              if (!slug || !published) continue;

              const coverImage = fields.coverImage?.stringValue || '';
              const updatedDate =
                fields.updatedDate?.stringValue ||
                fields.uploadDate?.stringValue ||
                fields.uploadedDate?.stringValue ||
                doc.updateTime ||
                doc.createTime;

              const storyObj: Story = {
                id,
                slug,
                title,
                published: true,
                coverImage,
                updatedDate,
                category: fields.category?.stringValue || 'wife',
                categoryName: fields.categoryName?.stringValue || fields.category?.stringValue || 'Wife',
                uploadDate: updatedDate,
                uploadedDate: updatedDate,
                description: fields.description?.stringValue || '',
                shortDescription: fields.shortDescription?.stringValue || fields.description?.stringValue || '',
                fullContent: fields.fullContent?.stringValue || fields.content?.stringValue || '',
                content: fields.fullContent?.stringValue || fields.content?.stringValue || '',
                body: fields.fullContent?.stringValue || fields.content?.stringValue || '',
                author: { name: fields.authorName?.stringValue || 'Walkathawa' },
                views: Number(fields.views?.integerValue || 0),
                likes: Number(fields.likes?.integerValue || 0),
                readingTime: Number(fields.readingTime?.integerValue || 5),
                tags: [],
              } as any;

              storiesMap.set(slug, storyObj);
            }
          }
        }
      }
    }
  } catch {
    // Non-fatal, fall back seamlessly to local db
  }

  return Array.from(storiesMap.values()).filter((s) => !isMockStoryRecord(s));
}

// 301 redirect legacy /sitemap and /sitemap/ to canonical /sitemap.xml
app.get(['/sitemap', '/sitemap/'], (_req: Request, res: Response) => {
  return res.redirect(301, '/sitemap.xml');
});

// --- CANONICAL XML SITEMAP (/sitemap.xml) ---
app.get('/sitemap.xml', async (req: Request, res: Response) => {
  const baseUrl = 'https://www.walkathawa.site';
  const publishedStories = await getSitemapStoriesList();

  // Find latest story updated date for site-level timestamps
  let latestStoryDate: string | null = null;
  for (const s of publishedStories) {
    const rawDate = s.updatedDate || s.uploadDate || s.uploadedDate;
    if (rawDate) {
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          const iso = d.toISOString();
          if (!latestStoryDate || d > new Date(latestStoryDate)) {
            latestStoryDate = iso;
          }
        }
      } catch {
        // ignore
      }
    }
  }

  const defaultStableDate = latestStoryDate || '2026-09-08T12:00:00.000Z';

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // 1. Homepage (Root canonical URL)
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/</loc>\n`;
  xml += `    <lastmod>${defaultStableDate}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // 2. Directory Page (Canonical story directory URL)
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/directory</loc>\n`;
  xml += `    <lastmod>${defaultStableDate}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>0.8</priority>\n`;
  xml += `  </url>\n`;

  // 3. Category Pages (Canonical clean URLs only: /category/{slug})
  INITIAL_CATEGORIES.filter((c) => c.slug !== 'all').forEach((cat) => {
    let catLatestDate: string | null = null;
    for (const s of publishedStories) {
      if (s.category === cat.slug) {
        const rawDate = s.updatedDate || s.uploadDate || s.uploadedDate;
        if (rawDate) {
          try {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) {
              const iso = d.toISOString();
              if (!catLatestDate || d > new Date(catLatestDate)) {
                catLatestDate = iso;
              }
            }
          } catch {
            // ignore
          }
        }
      }
    }
    const catLastMod = catLatestDate || defaultStableDate;

    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/category/${cat.slug}</loc>\n`;
    xml += `    <lastmod>${catLastMod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  // 4. Published Stories (Canonical clean URLs: /story/{slug})
  publishedStories.forEach((story) => {
    const rawModTime = story.updatedDate || story.uploadDate || story.uploadedDate;
    let validModTime = defaultStableDate;
    if (rawModTime) {
      try {
        const d = new Date(rawModTime);
        if (!isNaN(d.getTime())) {
          validModTime = d.toISOString();
        }
      } catch {
        validModTime = defaultStableDate;
      }
    }

    const storyUrl = `${baseUrl}/story/${story.slug}`;
    xml += `  <url>\n`;
    xml += `    <loc>${storyUrl}</loc>\n`;
    xml += `    <lastmod>${validModTime}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    if (story.coverImage) {
      const sanitizedTitle = (story.title || 'Sinhala Wal Katha')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      const sanitizedCover = story.coverImage
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${sanitizedCover}</image:loc>\n`;
      xml += `      <image:title>${sanitizedTitle}</image:title>\n`;
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;

  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.header('Cache-Control', 'public, max-age=1800, s-maxage=3600');
  res.header('X-Robots-Tag', getRobotsTagForRequest(req));
  res.status(200).send(xml);
});

// --- ROBOTS.TXT ---
app.get(['/robots.txt'], (req: Request, res: Response) => {
  const forwardedHost = (req.headers['x-forwarded-host'] as string) || '';
  const hostHeader = req.get('host') || '';
  const host = (forwardedHost || hostHeader).split(':')[0].toLowerCase();
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
  const isCanonicalProd = host === 'www.walkathawa.site';

  // If accessed from non-canonical domains (e.g. *.run.app, staging, test URLs), block all crawlers
  if (!isCanonicalProd && !isLocal) {
    res.header('Content-Type', 'text/plain; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=300');
    res.header('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return res.status(200).send(`# Disallow all crawlers on staging / preview domains\nUser-agent: *\nDisallow: /\n`);
  }

  const robots = `# Robots.txt for Walkathawa (වල් කතාව) - Official Canonical Domain
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/admin
Disallow: /api/auth

# Official Canonical Sitemap
Sitemap: https://www.walkathawa.site/sitemap.xml
`;

  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.header('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.header('X-Robots-Tag', 'all');
  res.status(200).send(robots);
});

// --- AUTHENTICATION APIS ---

// POST /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password, remember } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase().trim());

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const calculatedHash = hashPassword(password, user.salt);
  if (calculatedHash !== user.passwordHash) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Expiration: 30 days if remember is true, else 24 hours
  const expiresInMs = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const expiresAt = Date.now() + expiresInMs;

  const payload = {
    userId: user.uid,
    email: user.email,
    role: user.role,
    exp: expiresAt,
  };

  const token = generateToken(payload);

  db.activeSessions[token] = {
    userId: user.uid,
    email: user.email,
    role: user.role,
    expiresAt,
  };
  saveDatabase();

  res.json({
    token,
    user: {
      uid: user.uid,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    expiresAt,
  });
});

// GET /api/auth/session - Verify session
app.get('/api/auth/session', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = db.users.find((u) => u.uid === req.user?.userId);
  if (!user) {
    return res.status(401).json({ error: 'User account not found' });
  }

  res.json({
    authenticated: true,
    user: {
      uid: user.uid,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    delete db.activeSessions[token];
    saveDatabase();
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// POST /api/auth/reset-password (Simulated secure token issuance)
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase().trim());
  if (user) {
    // In production, an email with a secure reset link would be dispatched.
    // For administration continuity, acknowledge safely without leaking user existence.
  }

  res.json({
    success: true,
    message: 'If the provided email corresponds to an administrative account, a password reset link has been dispatched.',
  });
});

// --- ADMIN PROTECTED APIS ---

// GET /api/admin/dashboard/stats
app.get('/api/admin/dashboard/stats', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const totalStories = db.stories.length;
  const publishedStories = db.stories.filter((s) => s.published).length;
  const draftStories = db.stories.filter((s) => !s.published).length;
  const totalViews = db.stories.reduce((acc, s) => acc + (s.views || 0), 0);

  const recentUploads = [...db.stories]
    .sort((a, b) => new Date(b.uploadDate || b.uploadedDate || 0).getTime() - new Date(a.uploadDate || a.uploadedDate || 0).getTime())
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      category: s.category,
      uploadedDate: s.uploadDate || s.uploadedDate || new Date().toISOString(),
      views: s.views || 0,
      published: s.published,
    }));

  res.json({
    totalStories,
    totalViews,
    publishedStories,
    draftStories,
    enabled: db.advertisements.enabled,
    maxTriggers: db.advertisements.maxTriggers,
    hasGlobalDirectLink: Boolean(db.advertisements.globalDirectLink && db.advertisements.globalDirectLink.trim()),
    recentUploads,
  });
});

// GET /api/admin/stories - Get all stories (both published and drafts)
app.get('/api/admin/stories', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { search, category, status } = req.query;

  let list = [...db.stories];

  if (search && String(search).trim()) {
    const q = String(search).toLowerCase().trim();
    list = list.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.shortDescription.toLowerCase().includes(q) ||
        s.author.name.toLowerCase().includes(q)
    );
  }

  if (category && category !== 'all') {
    list = list.filter((s) => s.category.toLowerCase() === String(category).toLowerCase());
  }

  if (status === 'published') {
    list = list.filter((s) => s.published);
  } else if (status === 'draft') {
    list = list.filter((s) => !s.published);
  }

  list.sort((a, b) => new Date(b.uploadDate || b.uploadedDate || 0).getTime() - new Date(a.uploadDate || a.uploadedDate || 0).getTime());

  // Attach directAdLink if stored in postAdvertisements mapping
  const enrichedList = list.map((s) => ({
    ...s,
    directAdLink: db.postAdvertisements[s.id] || s.directAdLink || '',
  }));

  res.json({
    stories: enrichedList,
    total: enrichedList.length,
  });
});

// Helper: Calculate Reading Time
function calculateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

// Helper: Generate SEO-friendly slug
function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || `story-${Date.now()}`;
}

// POST /api/admin/stories - Create new story
app.post('/api/admin/stories', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    coverImage,
    shortDescription,
    fullContent,
    category,
    tags,
    author,
    readingTime,
    published,
    directAdLink,
    featured,
  } = req.body;

  if (!title || !shortDescription || !fullContent || !category) {
    return res.status(400).json({ error: 'Title, description, content, and category are required' });
  }

  let slug = generateSlug(title);
  // Ensure unique slug
  let counter = 1;
  while (db.stories.some((s) => s.slug === slug)) {
    slug = `${generateSlug(title)}-${counter}`;
    counter++;
  }

  const now = new Date().toISOString();
  const id = `story_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const computedReadingTime = readingTime && Number(readingTime) > 0 ? Number(readingTime) : calculateReadingTime(fullContent);

  const newStory: Story = {
    id,
    title: title.trim(),
    slug,
    coverImage: coverImage?.trim() || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
    shortDescription: shortDescription.trim(),
    fullContent: fullContent.trim(),
    category: category.toLowerCase().trim(),
    tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    author: typeof author === 'object' && author?.name ? author : { id: 'admin_author', name: author || 'Editorial Staff', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', bio: 'Staff Writer & Curator' },
    uploadDate: now,
    uploadedDate: now,
    updatedDate: now,
    readingTime: computedReadingTime,
    views: 0,
    featured: Boolean(featured),
    published: Boolean(published),
    directAdLink: directAdLink || '',
  };

  db.stories.unshift(newStory);

  if (directAdLink) {
    db.postAdvertisements[id] = directAdLink;
  }

  saveDatabase();

  res.status(201).json({
    message: 'Story created successfully and live immediately on public website',
    story: newStory,
  });
});

// PUT /api/admin/stories/:id - Update existing story
app.put('/api/admin/stories/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = db.stories.findIndex((s) => s.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Story not found' });
  }

  const current = db.stories[index];
  const {
    title,
    coverImage,
    shortDescription,
    fullContent,
    category,
    tags,
    author,
    readingTime,
    published,
    directAdLink,
    featured,
    slug,
  } = req.body;

  const now = new Date().toISOString();
  const updatedContent = fullContent !== undefined ? fullContent.trim() : current.fullContent;
  const computedReadingTime = readingTime !== undefined ? Number(readingTime) : calculateReadingTime(updatedContent);

  const updatedStory: Story = {
    ...current,
    title: title !== undefined ? title.trim() : current.title,
    slug: slug !== undefined && slug.trim() ? generateSlug(slug) : current.slug,
    coverImage: coverImage !== undefined ? coverImage.trim() : current.coverImage,
    shortDescription: shortDescription !== undefined ? shortDescription.trim() : current.shortDescription,
    fullContent: updatedContent,
    category: category !== undefined ? category.toLowerCase().trim() : current.category,
    tags: tags !== undefined ? (Array.isArray(tags) ? tags : String(tags).split(',').map((t) => t.trim()).filter(Boolean)) : current.tags,
    author: author !== undefined ? (typeof author === 'object' && author?.name ? author : { ...current.author, name: author }) : current.author,
    readingTime: computedReadingTime,
    published: published !== undefined ? Boolean(published) : current.published,
    featured: featured !== undefined ? Boolean(featured) : current.featured,
    directAdLink: directAdLink !== undefined ? directAdLink : current.directAdLink,
    updatedDate: now,
  };

  db.stories[index] = updatedStory;

  if (directAdLink !== undefined) {
    db.postAdvertisements[id] = directAdLink;
  }

  saveDatabase();

  res.json({
    message: 'Story updated successfully',
    story: updatedStory,
  });
});

// DELETE /api/admin/stories/:id - Delete story
app.delete('/api/admin/stories/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const initialLength = db.stories.length;
  db.stories = db.stories.filter((s) => s.id !== id);

  if (db.stories.length === initialLength) {
    return res.status(404).json({ error: 'Story not found' });
  }

  delete db.postAdvertisements[id];
  saveDatabase();

  res.json({ success: true, message: 'Story deleted permanently' });
});

// GET /api/admin/ads - Get Advertisement settings
app.get('/api/admin/ads', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    advertisements: db.advertisements,
    postAdvertisements: db.postAdvertisements,
  });
});

// PUT /api/admin/ads - Update global and master ad settings
app.put('/api/admin/ads', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { globalDirectLink, enabled, maxTriggers } = req.body;

  db.advertisements = {
    globalDirectLink: globalDirectLink !== undefined ? String(globalDirectLink) : db.advertisements.globalDirectLink,
    enabled: enabled !== undefined ? Boolean(enabled) : db.advertisements.enabled,
    maxTriggers: maxTriggers !== undefined ? (Number(maxTriggers) as 1 | 2 | 3) : db.advertisements.maxTriggers,
  };

  saveDatabase();

  res.json({
    message: 'Advertisement configurations updated successfully',
    advertisements: db.advertisements,
  });
});

// PUT /api/admin/stories/:id/ad - Update story specific ad code
app.put('/api/admin/stories/:id/ad', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { adCode } = req.body;

  const story = db.stories.find((s) => s.id === id);
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }

  db.postAdvertisements[id] = adCode || '';
  story.directAdLink = adCode || '';
  saveDatabase();

  res.json({
    message: `Ad code for story "${story.title}" saved successfully`,
    storyId: id,
    adCode,
  });
});

// POST /api/admin/upload - Server image upload fallback
app.post('/api/admin/upload', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { imageBase64, filename } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64' });
    }

    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 string' });
    }

    const ext = matches[1].split('/')[1] || 'png';
    const buffer = Buffer.from(matches[2], 'base64');
    
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeFilename = (filename || `upload-${Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const finalName = `${safeFilename}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, finalName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${finalName}`;
    res.json({ success: true, url: publicUrl });
  } catch (err: any) {
    console.error('Server upload error:', err);
    res.status(500).json({ error: 'Failed to upload image to server' });
  }
});

// GET /api/admin/categories
app.get('/api/admin/categories', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  res.json(db.categories || INITIAL_CATEGORIES);
});

// GET /api/admin/settings
app.get('/api/admin/settings', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  res.json(db.settings);
});

// PUT /api/admin/settings
app.put('/api/admin/settings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const {
    siteName,
    alternateName,
    logo,
    tagline,
    contactEmail,
    metaTitle,
    metaDescription,
    keywords,
    ogImage,
    googleAnalyticsId,
    searchConsoleVerification,
    publisherName,
  } = req.body;

  db.settings = {
    ...db.settings,
    siteName: siteName !== undefined ? siteName : db.settings.siteName,
    alternateName: alternateName !== undefined ? alternateName : db.settings.alternateName,
    logo: logo !== undefined ? logo : db.settings.logo,
    tagline: tagline !== undefined ? tagline : db.settings.tagline,
    contactEmail: contactEmail !== undefined ? contactEmail : db.settings.contactEmail,
    metaTitle: metaTitle !== undefined ? metaTitle : db.settings.metaTitle,
    metaDescription: metaDescription !== undefined ? metaDescription : db.settings.metaDescription,
    keywords: keywords !== undefined ? keywords : db.settings.keywords,
    ogImage: ogImage !== undefined ? ogImage : db.settings.ogImage,
    googleAnalyticsId: googleAnalyticsId !== undefined ? googleAnalyticsId : db.settings.googleAnalyticsId,
    searchConsoleVerification: searchConsoleVerification !== undefined ? searchConsoleVerification : db.settings.searchConsoleVerification,
    publisherName: publisherName !== undefined ? publisherName : db.settings.publisherName,
  };

  saveDatabase();

  res.json({
    message: 'Settings updated successfully',
    settings: db.settings,
  });
});

// --- SERVER & VITE INTEGRATION ---
function getRobotsTagForRequest(req: Request): string {
  const forwardedHost = (req.headers['x-forwarded-host'] as string) || '';
  const hostHeader = req.get('host') || '';
  const host = (forwardedHost || hostHeader).split(':')[0].toLowerCase();
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
  const isCanonicalProd = host === 'www.walkathawa.site';

  if (!isCanonicalProd && !isLocal) {
    return 'noindex, nofollow, noarchive';
  }

  // Search result pages or query search parameters must be noindex, follow
  if (req.path === '/search' || req.query.search || req.query.q) {
    return 'noindex, follow';
  }

  return 'all';
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const VALID_CATEGORY_SLUGS = new Set([
  'wife',
  'school',
  'akka-malli',
  'romantic',
  'love',
  'short',
  'family',
  'fantasy',
  'trending',
]);

function isValidCategorySlug(slug: string): boolean {
  if (!slug || slug === 'all') return false;
  let decoded = '';
  try {
    decoded = decodeURIComponent(slug).toLowerCase();
  } catch {
    decoded = slug.toLowerCase();
  }
  if (VALID_CATEGORY_SLUGS.has(decoded)) return true;
  for (const cat of INITIAL_CATEGORIES) {
    if (cat.slug && cat.slug.toLowerCase() === decoded && cat.slug !== 'all') {
      return true;
    }
  }
  if (db.categories && Array.isArray(db.categories)) {
    for (const cat of db.categories) {
      if (cat.slug && cat.slug.toLowerCase() === decoded && cat.slug !== 'all') {
        return true;
      }
    }
  }
  return false;
}

async function findPublishedStory(slug: string): Promise<Story | null> {
  if (!slug) return null;
  let normalizedSlug = '';
  try {
    normalizedSlug = decodeURIComponent(slug).trim().toLowerCase();
  } catch {
    normalizedSlug = slug.trim().toLowerCase();
  }

  // 1. Check in-memory / local db
  const localMatch = (db.stories || []).find((s) => {
    if (!s || s.published === false || isMockStoryRecord(s)) return false;
    const sSlug = String(s.slug || '').trim().toLowerCase();
    const sId = String(s.id || '').trim().toLowerCase();
    return sSlug === normalizedSlug || sId === normalizedSlug;
  });

  if (localMatch) {
    return localMatch;
  }

  // 2. Fetch live from Firestore if not in local cache
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config?.projectId && config?.firestoreDatabaseId && config?.apiKey) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/stories?key=${config.apiKey}&pageSize=200`;
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (resp.ok) {
          const data = (await resp.json()) as any;
          if (data.documents && Array.isArray(data.documents)) {
            for (const doc of data.documents) {
              const fields = doc.fields || {};
              const docSlug = fields.slug?.stringValue || '';
              const docTitle = fields.title?.stringValue || '';
              const docId = doc.name.split('/').pop() || docSlug;
              const isPublished = fields.published?.booleanValue !== false;

              if (isMockStoryRecord({ id: docId, slug: docSlug, title: docTitle })) continue;
              if (!isPublished) continue;

              const docSlugNorm = docSlug.trim().toLowerCase();
              const docIdNorm = docId.trim().toLowerCase();

              if (docSlugNorm === normalizedSlug || docIdNorm === normalizedSlug) {
                const rawDate =
                  fields.updatedDate?.stringValue ||
                  fields.uploadDate?.stringValue ||
                  fields.uploadedDate?.stringValue ||
                  doc.updateTime ||
                  doc.createTime;

                const loadedStory: Story = {
                  id: docId,
                  slug: docSlug || docId,
                  title: docTitle,
                  description: fields.description?.stringValue || '',
                  shortDescription: fields.shortDescription?.stringValue || fields.description?.stringValue || '',
                  fullContent: fields.fullContent?.stringValue || fields.content?.stringValue || '',
                  content: fields.fullContent?.stringValue || fields.content?.stringValue || '',
                  body: fields.fullContent?.stringValue || fields.content?.stringValue || '',
                  category: fields.category?.stringValue || 'wife',
                  categoryName: fields.categoryName?.stringValue || fields.category?.stringValue || 'Wife',
                  coverImage: fields.coverImage?.stringValue || '',
                  author: {
                    name: fields.authorName?.stringValue || 'Walkathawa',
                  },
                  uploadDate: rawDate,
                  uploadedDate: rawDate,
                  updatedDate: rawDate,
                  views: Number(fields.views?.integerValue || 0),
                  likes: Number(fields.likes?.integerValue || 0),
                  readingTime: Number(fields.readingTime?.integerValue || 5),
                  published: true,
                  tags: [],
                } as any;

                // Cache in memory
                const existingIdx = db.stories.findIndex((s) => s.slug === loadedStory.slug);
                if (existingIdx >= 0) {
                  db.stories[existingIdx] = loadedStory;
                } else {
                  db.stories.push(loadedStory);
                }

                return loadedStory;
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[findPublishedStory] Firestore lookup warning:', err);
  }

  return null;
}

function render404Html(rawHtml: string, req: Request, message?: string): string {
  const title = 'පිටුව සොයාගත නොහැක (404 Not Found) | Walkathawa (වල් කතාව)';
  const description = 'ඔබ සොයන පිටුව හෝ කතාව සොයා ගැනීමට නොහැකි විය. කරුණාකර මුල් පිටුවෙන් හෝ කතා නාමාවලියෙන් වෙනත් කතාවක් තෝරාගන්න.';

  let html = rawHtml;

  // 1. Ensure <html lang="si">
  if (/<html[^>]*>/i.test(html)) {
    html = html.replace(/<html[^>]*>/i, '<html lang="si">');
  }

  // 2. Set 404 Title
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

  // 3. Remove any canonical tag on 404
  html = html.replace(/<link\s+[^>]*rel=["']canonical["'][^>]*\/?>/gi, '');

  // 4. Force noindex, nofollow robots meta
  const robotsTag = `<meta name="robots" content="noindex, nofollow, noarchive" />`;
  if (/<meta\s+[^>]*name=["']robots["'][^>]*\/?>/i.test(html)) {
    html = html.replace(/<meta\s+[^>]*name=["']robots["'][^>]*\/?>/i, robotsTag);
  } else {
    html = html.replace('</head>', `  ${robotsTag}\n</head>`);
  }

  // 5. Remove any structured data on 404
  html = html.replace(/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');

  // 6. User-friendly 404 content
  const notFoundContent = `
  <div style="min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #cbd5e1; background-color: #020617;">
    <div style="max-width: 620px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 1rem; padding: 2.5rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
      <h1 style="font-size: 2.75rem; font-weight: 800; color: #f87171; margin-bottom: 0.75rem;">404</h1>
      <h2 style="font-size: 1.5rem; font-weight: 700; color: #ffffff; margin-bottom: 1rem;">කතාව හෝ පිටුව සොයාගත නොහැක</h2>
      <p style="font-size: 1.05rem; color: #94a3b8; line-height: 1.6; margin-bottom: 1.75rem;">
        ${escapeHtml(message || description)}
      </p>
      <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; margin-bottom: 2rem;">
        <a href="/" style="display: inline-block; padding: 0.75rem 1.5rem; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 0.5rem; font-weight: 600;">මුල් පිටුවට (Home)</a>
        <a href="/directory" style="display: inline-block; padding: 0.75rem 1.5rem; background-color: #1e293b; color: #e2e8f0; text-decoration: none; border-radius: 0.5rem; font-weight: 600; border: 1px solid #334155;">සියලු කතා නාමාවලිය (Directory)</a>
      </div>
      <div style="border-top: 1px solid #1e293b; padding-top: 1.5rem;">
        <p style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.75rem;">ප්‍රධාන වර්ගීකරණ (Categories):</p>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center;">
          <a href="/category/wife" style="color: #818cf8; text-decoration: none; font-size: 0.875rem; padding: 0.35rem 0.85rem; background-color: #1e1b4b; border-radius: 0.375rem;">වයිෆ් (Wife)</a>
          <a href="/category/school" style="color: #818cf8; text-decoration: none; font-size: 0.875rem; padding: 0.35rem 0.85rem; background-color: #1e1b4b; border-radius: 0.375rem;">පාසල් (School)</a>
          <a href="/category/akka-malli" style="color: #818cf8; text-decoration: none; font-size: 0.875rem; padding: 0.35rem 0.85rem; background-color: #1e1b4b; border-radius: 0.375rem;">අක්කා-මල්ලි</a>
          <a href="/category/romantic" style="color: #818cf8; text-decoration: none; font-size: 0.875rem; padding: 0.35rem 0.85rem; background-color: #1e1b4b; border-radius: 0.375rem;">ආදර කතා (Romantic)</a>
        </div>
      </div>
    </div>
  </div>`;

  if (html.includes('<div id="root"></div>')) {
    html = html.replace('<div id="root"></div>', `<div id="root">${notFoundContent}</div>`);
  } else {
    html = html.replace('</body>', `${notFoundContent}\n</body>`);
  }

  return html;
}

interface InjectSeoOptions {
  title: string;
  description: string;
  canonicalUrl: string;
  ogType: 'website' | 'article';
  ogImage?: string;
  schema: object;
  ssrContent?: string;
  noscriptContent?: string;
  req?: Request;
  noIndex?: boolean;
}

function applyPageSeo(rawHtml: string, options: InjectSeoOptions): string {
  let html = rawHtml;

  // 1. Ensure <html lang="si">
  if (/<html[^>]*>/i.test(html)) {
    html = html.replace(/<html[^>]*>/i, '<html lang="si">');
  }

  // 2. Replace <title>
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(options.title)}</title>`);

  // 3. Replace or insert meta description
  if (/<meta\s+[^>]*name=["']description["'][^>]*\/?>/i.test(html)) {
    html = html.replace(/<meta\s+[^>]*name=["']description["'][^>]*\/?>/i, `<meta name="description" content="${escapeHtml(options.description)}" />`);
  } else {
    html = html.replace('</head>', `  <meta name="description" content="${escapeHtml(options.description)}" />\n</head>`);
  }

  // 4. Replace or insert canonical link
  if (/<link\s+[^>]*rel=["']canonical["'][^>]*\/?>/i.test(html)) {
    html = html.replace(/<link\s+[^>]*rel=["']canonical["'][^>]*\/?>/i, `<link rel="canonical" href="${options.canonicalUrl}" />`);
  } else {
    html = html.replace('</head>', `  <link rel="canonical" href="${options.canonicalUrl}" />\n</head>`);
  }

  // 5. Ensure robots meta:
  const robotsSetting = options.noIndex ? 'noindex, follow' : (options.req ? getRobotsTagForRequest(options.req) : 'all');
  let robotsTag = `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`;
  if (robotsSetting === 'noindex, follow') {
    robotsTag = `<meta name="robots" content="noindex, follow" />`;
  } else if (robotsSetting !== 'all') {
    robotsTag = `<meta name="robots" content="noindex, nofollow, noarchive" />`;
  }

  if (/<meta\s+[^>]*name=["']robots["'][^>]*\/?>/i.test(html)) {
    html = html.replace(/<meta\s+[^>]*name=["']robots["'][^>]*\/?>/i, robotsTag);
  } else {
    html = html.replace('</head>', `  ${robotsTag}\n</head>`);
  }

  // 6. Replace or insert Open Graph tags
  const defaultImage = 'https://www.walkathawa.site/icon.png';
  const ogTags: Record<string, string> = {
    'og:title': options.title,
    'og:description': options.description,
    'og:url': options.canonicalUrl,
    'og:type': options.ogType,
    'og:site_name': 'Walkathawa (වල් කතාව)',
    'og:locale': 'si_LK',
    'og:image': options.ogImage || defaultImage,
  };

  for (const [prop, val] of Object.entries(ogTags)) {
    const regex = new RegExp(`<meta\\s+[^>]*property=["']${prop}["'][^>]*\\/?>`, 'i');
    const newTag = `<meta property="${prop}" content="${escapeHtml(val)}" />`;
    if (regex.test(html)) {
      html = html.replace(regex, newTag);
    } else {
      html = html.replace('</head>', `  ${newTag}\n</head>`);
    }
  }

  // 7. Replace or insert Twitter tags
  const twitterDesc = options.description.length > 160 ? `${options.description.slice(0, 157)}...` : options.description;
  const twitterTags: Record<string, string> = {
    'twitter:card': 'summary_large_image',
    'twitter:title': options.title,
    'twitter:description': twitterDesc,
    'twitter:image': options.ogImage || defaultImage,
  };

  for (const [name, val] of Object.entries(twitterTags)) {
    const regex = new RegExp(`<meta\\s+[^>]*name=["']${name}["'][^>]*\\/?>`, 'i');
    const newTag = `<meta name="${name}" content="${escapeHtml(val)}" />`;
    if (regex.test(html)) {
      html = html.replace(regex, newTag);
    } else {
      html = html.replace('</head>', `  ${newTag}\n</head>`);
    }
  }

  // 8. Remove ANY existing application/ld+json scripts to guarantee EXACTLY ONE clean schema
  html = html.replace(/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');

  // 9. Inject single clean schema before </head>
  const scriptTag = `  <script type="application/ld+json" id="structured-data">\n${JSON.stringify(options.schema, null, 2)}\n  </script>\n`;
  html = html.replace('</head>', `${scriptTag}</head>`);

  // 10. SSR Content Injection into <div id="root">
  if (options.ssrContent) {
    if (html.includes('<div id="root"></div>')) {
      html = html.replace('<div id="root"></div>', `<div id="root">${options.ssrContent}</div>`);
    }
  }

  // 11. Remove any old injected non-font noscripts and inject noscript fallback
  html = html.replace(/<noscript>(?![\s\S]*?fonts\.googleapis\.com)[\s\S]*?<\/noscript>/gi, '');

  if (options.noscriptContent) {
    html = html.replace('</body>', `${options.noscriptContent}\n</body>`);
  }

  return html;
}

function injectHomeSeo(rawHtml: string, req?: Request): string {
  const isSearch = Boolean(req && (req.query.search || req.query.q || req.path === '/search'));
  const searchQuery = String(req?.query?.search || req?.query?.q || '');
  const title = isSearch
    ? `Search: "${searchQuery}" | Walkathawa (වල් කතාව)`
    : 'Walkathawa (වල් කතාව) | Sinhala Stories Online';
  const description = isSearch
    ? `Explore Sinhala short stories and katha matching "${searchQuery}" on Walkathawa (වල් කතාව).`
    : 'Walkathawa (වල් කතාව) is a place to read Sinhala stories online. Discover new wal katha, romantic tales, and short stories updated regularly.';
  const canonicalUrl = 'https://www.walkathawa.site/';

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://www.walkathawa.site/#website',
        'url': canonicalUrl,
        'name': 'Walkathawa (වල් කතාව)',
        'description': description,
        'inLanguage': 'si',
        'publisher': {
          '@type': 'Organization',
          'name': 'Walkathawa (වල් කතාව)',
          'url': canonicalUrl,
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://www.walkathawa.site/icon.png'
          }
        },
        'potentialAction': {
          '@type': 'SearchAction',
          'target': {
            '@type': 'EntryPoint',
            'urlTemplate': 'https://www.walkathawa.site/?search={search_term_string}'
          },
          'query-input': 'required name=search_term_string'
        }
      }
    ]
  };

  const categoriesHtml = INITIAL_CATEGORIES
    .filter((c) => c.slug !== 'all')
    .map((c) => `<li style="display: inline-block; margin: 0.35rem;"><a href="/category/${c.slug}" style="color: #818cf8; text-decoration: none; padding: 0.4rem 0.85rem; background-color: #1e1b4b; border-radius: 0.375rem; display: inline-block;">${escapeHtml(c.name)}</a></li>`)
    .join('\n');

  const publishedStories = (db.stories || []).filter((s) => s.published && !isMockStoryRecord(s));
  const storiesHtml = publishedStories
    .slice(0, 30)
    .map((s) => `<li style="padding: 0.75rem 1rem; margin-bottom: 0.5rem; background-color: #0f172a; border-radius: 0.5rem; border: 1px solid #1e293b;"><a href="/story/${s.slug}" style="color: #38bdf8; font-weight: 600; text-decoration: none; font-size: 1.1rem;">${escapeHtml(s.title)}</a> <span style="color: #94a3b8; font-size: 0.875rem;">(${escapeHtml(s.categoryName || s.category)})</span></li>`)
    .join('\n');

  const mainContent = `
  <main style="max-width: 900px; margin: 2rem auto; padding: 1.5rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #e2e8f0; background-color: #0b1120; border-radius: 12px; border: 1px solid #1e293b;">
    <header style="margin-bottom: 2rem; border-bottom: 1px solid #1e293b; padding-bottom: 1.5rem;">
      <h1 style="font-size: 2.2rem; font-weight: 800; color: #ffffff; margin-bottom: 0.5rem;">${escapeHtml(title)}</h1>
      <p style="font-size: 1.05rem; color: #94a3b8; line-height: 1.6;">${escapeHtml(description)}</p>
    </header>
    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.25rem; font-weight: 700; color: #f1f5f9; margin-bottom: 1rem;">කතා වර්ගීකරණ (Story Categories)</h2>
      <nav aria-label="Story Categories">
        <ul style="list-style-type: none; padding: 0; display: flex; flex-wrap: wrap;">
          ${categoriesHtml}
        </ul>
      </nav>
    </section>
    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.25rem; font-weight: 700; color: #f1f5f9; margin-bottom: 1rem;">නවතම සිංහල කතා (Latest Sinhala Stories)</h2>
      <ul style="list-style-type: none; padding: 0;">
        ${storiesHtml}
      </ul>
    </section>
    <p style="text-align: center; margin-top: 2rem;">
      <a href="/directory" style="color: #818cf8; font-weight: 600; text-decoration: none; font-size: 1.1rem;">සියලු කතා නාමාවලිය බලන්න (View All Stories Directory) &rarr;</a>
    </p>
  </main>`;

  const noscriptContent = `<noscript>${mainContent}</noscript>`;

  return applyPageSeo(rawHtml, {
    title,
    description,
    canonicalUrl,
    ogType: 'website',
    schema,
    ssrContent: mainContent,
    noscriptContent,
    req,
    noIndex: isSearch,
  });
}

function injectCategorySeo(rawHtml: string, categorySlug: string, req?: Request): string {
  const catObj = INITIAL_CATEGORIES.find((c) => c.slug === categorySlug || c.id === categorySlug);
  const catName = catObj ? catObj.name : categorySlug;
  const canonicalUrl = `https://www.walkathawa.site/category/${encodeURIComponent(categorySlug)}`;
  const title = `${catName} Stories (සිංහල කතා) | Walkathawa (වල් කතාව)`;
  const description = `Read the latest ${catName} Sinhala stories, wal katha, and romantic tales on Walkathawa (වල් කතාව). Updated regularly with new collections.`;

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalUrl}#collection`,
        'url': canonicalUrl,
        'name': title,
        'description': description,
        'isPartOf': {
          '@type': 'WebSite',
          '@id': 'https://www.walkathawa.site/#website',
          'name': 'Walkathawa (වල් කතාව)',
          'url': 'https://www.walkathawa.site'
        },
        'inLanguage': 'si'
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': 'https://www.walkathawa.site/'
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': catName,
            'item': canonicalUrl
          }
        ]
      }
    ]
  };

  const matchingStories = (db.stories || []).filter(
    (s) => s.published && !isMockStoryRecord(s) && (s.category === categorySlug || (s.categoryName && s.categoryName.toLowerCase() === categorySlug.toLowerCase()))
  );
  const storiesHtml = matchingStories.length > 0
    ? matchingStories.map((s) => `<li style="padding: 0.75rem 1rem; margin-bottom: 0.5rem; background-color: #0f172a; border-radius: 0.5rem; border: 1px solid #1e293b;"><a href="/story/${s.slug}" style="color: #38bdf8; font-weight: 600; text-decoration: none; font-size: 1.1rem;">${escapeHtml(s.title)}</a></li>`).join('\n')
    : `<li style="color: #94a3b8; font-style: italic;">කතා තවමත් එකතු කර නොමැත.</li>`;

  const mainContent = `
  <main style="max-width: 900px; margin: 2rem auto; padding: 1.5rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #e2e8f0; background-color: #0b1120; border-radius: 12px; border: 1px solid #1e293b;">
    <nav aria-label="Breadcrumb" style="margin-bottom: 1.5rem; font-size: 0.875rem; color: #94a3b8;">
      <a href="/" style="color: #818cf8; text-decoration: none;">මුල් පිටුව (Home)</a> &gt; 
      <span style="color: #cbd5e1;">${escapeHtml(catName)}</span>
    </nav>
    <header style="margin-bottom: 2rem; border-bottom: 1px solid #1e293b; padding-bottom: 1rem;">
      <h1 style="font-size: 2rem; font-weight: 800; color: #ffffff; margin-bottom: 0.5rem;">${escapeHtml(catName)} Stories (සිංහල කතා)</h1>
      <p style="font-size: 1rem; color: #94a3b8;">${escapeHtml(description)}</p>
    </header>
    <section>
      <h2 style="font-size: 1.25rem; font-weight: 700; color: #f1f5f9; margin-bottom: 1rem;">${escapeHtml(catName)} කතා ලැයිස්තුව</h2>
      <ul style="list-style-type: none; padding: 0;">
        ${storiesHtml}
      </ul>
    </section>
    <footer style="margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid #1e293b; display: flex; justify-content: space-between;">
      <a href="/" style="color: #818cf8; text-decoration: none; font-weight: 600;">&larr; මුල් පිටුවට</a>
      <a href="/directory" style="color: #818cf8; text-decoration: none; font-weight: 600;">සියලු කතා නාමාවලිය &rarr;</a>
    </footer>
  </main>`;

  const noscriptContent = `<noscript>${mainContent}</noscript>`;

  return applyPageSeo(rawHtml, {
    title,
    description,
    canonicalUrl,
    ogType: 'website',
    schema,
    ssrContent: mainContent,
    noscriptContent,
    req,
  });
}

function injectStorySeo(rawHtml: string, story: Story, req?: Request): string {
  const title = `${story.title} | Walkathawa (වල් කතාව)`;
  const rawDesc = story.shortDescription || story.description || (story.fullContent ? story.fullContent.slice(0, 160) : '');
  const cleanDesc = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc;
  const canonicalUrl = `https://www.walkathawa.site/story/${story.slug}`;
  const coverImage = story.coverImage || 'https://www.walkathawa.site/icon.png';
  const publishedTime = new Date(story.uploadDate || story.uploadedDate || Date.now()).toISOString();
  const modifiedTime = new Date(story.updatedDate || story.uploadDate || story.uploadedDate || Date.now()).toISOString();
  const catSlug = story.category || 'other';
  const catName = story.categoryName || story.category || 'Sinhala Stories';
  const categoryUrl = `https://www.walkathawa.site/category/${encodeURIComponent(catSlug)}`;

  // Schema.org Article & BreadcrumbList
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${canonicalUrl}#article`,
        'isPartOf': {
          '@type': 'WebSite',
          '@id': 'https://www.walkathawa.site/#website',
          'name': 'Walkathawa (වල් කතාව)',
          'url': 'https://www.walkathawa.site'
        },
        'headline': story.title,
        'description': cleanDesc,
        'image': coverImage,
        'datePublished': publishedTime,
        'dateModified': modifiedTime,
        'author': {
          '@type': 'Person',
          'name': story.author?.name || 'Walkathawa'
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'Walkathawa (වල් කතාව)',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://www.walkathawa.site/icon.png'
          }
        },
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': canonicalUrl
        },
        'articleSection': catName,
        'inLanguage': 'si'
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': 'https://www.walkathawa.site/'
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': catName,
            'item': categoryUrl
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': story.title,
            'item': canonicalUrl
          }
        ]
      }
    ]
  };

  const paragraphsHtml = (story.fullContent || story.content || '')
    .split('\n\n')
    .filter((p) => p.trim().length > 0)
    .map((p) => `<p style="margin-bottom: 1.25rem;">${escapeHtml(p)}</p>`)
    .join('\n');

  const mainContent = `
  <article style="max-width: 850px; margin: 2rem auto; padding: 1.5rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; color: #e2e8f0; background-color: #0b1120; border-radius: 12px; border: 1px solid #1e293b;">
    <nav aria-label="Breadcrumb" style="margin-bottom: 1.5rem; font-size: 0.875rem; color: #94a3b8;">
      <a href="/" style="color: #818cf8; text-decoration: none;">මුල් පිටුව</a> &gt; 
      <a href="${categoryUrl}" style="color: #818cf8; text-decoration: none;">${escapeHtml(catName)}</a> &gt; 
      <span style="color: #cbd5e1;">${escapeHtml(story.title)}</span>
    </nav>
    <header style="margin-bottom: 2rem; border-bottom: 1px solid #1e293b; padding-bottom: 1.5rem;">
      <h1 style="font-size: 2.2rem; font-weight: 800; color: #ffffff; line-height: 1.3; margin-bottom: 1rem;">${escapeHtml(story.title)}</h1>
      <div style="font-size: 0.875rem; color: #94a3b8; display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;">
        <span><strong>කර්තෘ:</strong> ${escapeHtml(story.author?.name || 'Walkathawa')}</span>
        <span>•</span>
        <span><strong>වර්ගීකරණය:</strong> <a href="${categoryUrl}" style="color: #818cf8; text-decoration: none;">${escapeHtml(catName)}</a></span>
        <span>•</span>
        <time datetime="${publishedTime}"><strong>දිනය:</strong> ${escapeHtml(new Date(publishedTime).toLocaleDateString())}</time>
      </div>
      ${cleanDesc ? `<p style="margin-top: 1rem; font-size: 1rem; font-style: italic; color: #94a3b8; background-color: #0f172a; padding: 1rem; border-radius: 8px; border-left: 4px solid #6366f1;">${escapeHtml(cleanDesc)}</p>` : ''}
    </header>
    <div style="font-size: 1.125rem; color: #e2e8f0; line-height: 1.85;">
      ${paragraphsHtml}
    </div>
    <footer style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #1e293b;">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; align-items: center;">
        <a href="${categoryUrl}" style="color: #818cf8; text-decoration: none; font-weight: 600;">&larr; තවත් ${escapeHtml(catName)} කතා කියවන්න</a>
        <a href="/directory" style="color: #818cf8; text-decoration: none; font-weight: 600;">සියලු කතා නාමාවලිය &rarr;</a>
      </div>
    </footer>
  </article>`;

  const noscriptContent = `<noscript>${mainContent}</noscript>`;

  return applyPageSeo(rawHtml, {
    title,
    description: cleanDesc,
    canonicalUrl,
    ogType: 'article',
    ogImage: coverImage,
    schema,
    ssrContent: mainContent,
    noscriptContent,
    req,
  });
}

function injectDirectorySeo(rawHtml: string, req?: Request): string {
  const title = 'All Sinhala Stories Directory (සියලු කතා සූචිය) | Walkathawa (වල් කතාව)';
  const description = 'Browse the complete collection and archive of Sinhala stories, wal katha, and romantic novels on Walkathawa. Updated regularly with easy navigation.';
  const canonicalUrl = 'https://www.walkathawa.site/directory';

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalUrl}#collection`,
        'url': canonicalUrl,
        'name': title,
        'description': description,
        'isPartOf': {
          '@type': 'WebSite',
          '@id': 'https://www.walkathawa.site/#website',
          'name': 'Walkathawa (වල් කතාව)',
          'url': 'https://www.walkathawa.site'
        },
        'inLanguage': 'si'
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': 'https://www.walkathawa.site/'
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Directory',
            'item': canonicalUrl
          }
        ]
      }
    ]
  };

  const categoriesListHtml = INITIAL_CATEGORIES
    .filter((c) => c.slug !== 'all')
    .map((c) => `<li style="display: inline-block; margin: 0.35rem;"><a href="/category/${c.slug}" style="color: #818cf8; text-decoration: none; padding: 0.4rem 0.85rem; background-color: #1e1b4b; border-radius: 0.375rem; display: inline-block;">${escapeHtml(c.name)}</a></li>`)
    .join('\n');

  const publishedStories = (db.stories || []).filter((s) => s.published && !isMockStoryRecord(s));
  const storiesList = publishedStories
    .map((s) => `<li style="padding: 0.75rem 1rem; margin-bottom: 0.5rem; background-color: #0f172a; border-radius: 0.5rem; border: 1px solid #1e293b;"><a href="/story/${s.slug}" style="color: #38bdf8; font-weight: 600; text-decoration: none; font-size: 1.1rem;">${escapeHtml(s.title)}</a> <span style="color: #94a3b8; font-size: 0.875rem;">(<a href="/category/${encodeURIComponent(s.category)}" style="color: #818cf8; text-decoration: none;">${escapeHtml(s.categoryName || s.category)}</a>)</span></li>`)
    .join('\n');

  const mainContent = `
  <main style="max-width: 900px; margin: 2rem auto; padding: 1.5rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #e2e8f0; background-color: #0b1120; border-radius: 12px; border: 1px solid #1e293b;">
    <nav aria-label="Breadcrumb" style="margin-bottom: 1.5rem; font-size: 0.875rem; color: #94a3b8;">
      <a href="/" style="color: #818cf8; text-decoration: none;">මුල් පිටුව</a> &gt; 
      <span style="color: #cbd5e1;">කතා නාමාවලිය (Directory)</span>
    </nav>
    <header style="margin-bottom: 2rem; border-bottom: 1px solid #1e293b; padding-bottom: 1rem;">
      <h1 style="font-size: 2rem; font-weight: 800; color: #ffffff; margin-bottom: 0.5rem;">${escapeHtml(title)}</h1>
      <p style="font-size: 1rem; color: #94a3b8;">${escapeHtml(description)}</p>
    </header>
    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.25rem; font-weight: 700; color: #f1f5f9; margin-bottom: 1rem;">ප්‍රධාන කතා වර්ගීකරණ (Categories)</h2>
      <ul style="list-style-type: none; padding: 0; display: flex; flex-wrap: wrap;">
        ${categoriesListHtml}
      </ul>
    </section>
    <section>
      <h2 style="font-size: 1.25rem; font-weight: 700; color: #f1f5f9; margin-bottom: 1rem;">සියලුම පළකළ කතා (${publishedStories.length})</h2>
      <ul style="list-style-type: none; padding: 0;">
        ${storiesList}
      </ul>
    </section>
    <footer style="margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid #1e293b;">
      <a href="/" style="color: #818cf8; text-decoration: none; font-weight: 600;">&larr; මුල් පිටුවට</a>
    </footer>
  </main>`;

  const noscriptContent = `<noscript>${mainContent}</noscript>`;

  return applyPageSeo(rawHtml, {
    title,
    description,
    canonicalUrl,
    ogType: 'website',
    schema,
    ssrContent: mainContent,
    noscriptContent,
    req,
  });
}

// Helper to get index.html template (works in dev and prod)
function getHtmlTemplate(): string {
  const isProd = process.env.NODE_ENV === 'production';
  const distIndex = path.join(process.cwd(), 'dist', 'index.html');
  const srcIndex = path.join(process.cwd(), 'index.html');

  if (isProd && fs.existsSync(distIndex)) {
    return fs.readFileSync(distIndex, 'utf-8');
  }
  if (fs.existsSync(srcIndex)) {
    return fs.readFileSync(srcIndex, 'utf-8');
  }
  if (fs.existsSync(distIndex)) {
    return fs.readFileSync(distIndex, 'utf-8');
  }
  return '<!DOCTYPE html><html lang="si"><head><meta charset="UTF-8" /></head><body><div id="root"></div></body></html>';
}

async function startServer() {
  const httpServer = http.createServer(app);

  // 1. 301 Permanent Redirects for legacy directory routes
  app.get(
    ['/stories-directory', '/stories-directory/', '/sitemap.html', '/sitemap-index', '/sitemap-index/'],
    (_req: Request, res: Response) => {
      return res.redirect(301, '/directory');
    }
  );

  if (process.env.NODE_ENV !== 'production') {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });

    // 2. Canonical SEO routes in development
    app.get('/', async (req: Request, res: Response) => {
      if (req.query.category && typeof req.query.category === 'string') {
        const cat = req.query.category;
        return res.redirect(301, cat === 'all' ? '/' : `/category/${encodeURIComponent(cat)}`);
      }
      let template = getHtmlTemplate();
      template = await vite.transformIndexHtml(req.originalUrl, template);
      const rendered = injectHomeSeo(template, req);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Robots-Tag', getRobotsTagForRequest(req));
      return res.status(200).send(rendered);
    });

    app.get('/search', async (req: Request, res: Response) => {
      let template = getHtmlTemplate();
      template = await vite.transformIndexHtml(req.originalUrl, template);
      const rendered = injectHomeSeo(template, req);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Robots-Tag', 'noindex, follow');
      return res.status(200).send(rendered);
    });

    app.get('/category/:slug', async (req: Request, res: Response) => {
      const categorySlug = req.params.slug;
      let template = getHtmlTemplate();
      template = await vite.transformIndexHtml(req.originalUrl, template);

      if (!isValidCategorySlug(categorySlug)) {
        const notFoundHtml = render404Html(template, req, `"${categorySlug}" වර්ගීකරණය සොයාගත නොහැක.`);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        return res.status(404).send(notFoundHtml);
      }

      const rendered = injectCategorySeo(template, categorySlug, req);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Robots-Tag', getRobotsTagForRequest(req));
      return res.status(200).send(rendered);
    });

    app.get('/story/:slug', async (req: Request, res: Response) => {
      const slug = req.params.slug;
      let template = getHtmlTemplate();
      template = await vite.transformIndexHtml(req.originalUrl, template);

      const story = await findPublishedStory(slug);
      if (!story || !story.published) {
        const notFoundHtml = render404Html(template, req, 'ඔබ සොයන කතාව සොයා ගැනීමට නොහැකි විය.');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        return res.status(404).send(notFoundHtml);
      }

      const rendered = injectStorySeo(template, story, req);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Robots-Tag', getRobotsTagForRequest(req));
      return res.status(200).send(rendered);
    });

    app.get('/directory', async (req: Request, res: Response) => {
      let template = getHtmlTemplate();
      template = await vite.transformIndexHtml(req.originalUrl, template);
      const rendered = injectDirectorySeo(template, req);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Robots-Tag', getRobotsTagForRequest(req));
      return res.status(200).send(rendered);
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');

    // Long-lived caching for immutable hashed assets
    app.use('/assets', express.static(path.join(distPath, 'assets'), {
      maxAge: '1y',
      immutable: true,
    }));
    app.use(express.static(distPath, {
      maxAge: '1h',
    }));

    // Production Server-Side SEO Render for Homepage
    app.get('/', (req: Request, res: Response) => {
      if (req.query.category && typeof req.query.category === 'string') {
        const cat = req.query.category;
        return res.redirect(301, cat === 'all' ? '/' : `/category/${encodeURIComponent(cat)}`);
      }

      if (fs.existsSync(indexPath)) {
        const raw = fs.readFileSync(indexPath, 'utf-8');
        const rendered = injectHomeSeo(raw, req);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
        res.setHeader('X-Robots-Tag', getRobotsTagForRequest(req));
        return res.status(200).send(rendered);
      }
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(indexPath);
    });

    // Production Search page (noindex, follow)
    app.get('/search', (req: Request, res: Response) => {
      if (fs.existsSync(indexPath)) {
        const raw = fs.readFileSync(indexPath, 'utf-8');
        const rendered = injectHomeSeo(raw, req);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
        res.setHeader('X-Robots-Tag', 'noindex, follow');
        return res.status(200).send(rendered);
      }
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(indexPath);
    });

    // Production Server-Side SEO Render for Category Pages
    app.get('/category/:slug', (req: Request, res: Response) => {
      const categorySlug = req.params.slug;
      if (fs.existsSync(indexPath)) {
        const raw = fs.readFileSync(indexPath, 'utf-8');
        if (!isValidCategorySlug(categorySlug)) {
          const notFoundHtml = render404Html(raw, req, `"${categorySlug}" වර්ගීකරණය සොයාගත නොහැක.`);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
          return res.status(404).send(notFoundHtml);
        }
        const rendered = injectCategorySeo(raw, categorySlug, req);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
        res.setHeader('X-Robots-Tag', getRobotsTagForRequest(req));
        return res.status(200).send(rendered);
      }
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(indexPath);
    });

    // Production Server-Side SEO Render for Story Readers
    app.get('/story/:slug', async (req: Request, res: Response) => {
      const slug = req.params.slug;
      if (fs.existsSync(indexPath)) {
        const raw = fs.readFileSync(indexPath, 'utf-8');
        const story = await findPublishedStory(slug);
        if (!story || !story.published) {
          const notFoundHtml = render404Html(raw, req, 'ඔබ සොයන කතාව සොයා ගැනීමට නොහැකි විය.');
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
          return res.status(404).send(notFoundHtml);
        }
        const rendered = injectStorySeo(raw, story, req);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
        res.setHeader('X-Robots-Tag', getRobotsTagForRequest(req));
        return res.status(200).send(rendered);
      }
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(indexPath);
    });

    // Production Server-Side SEO Render for Directory
    app.get('/directory', (req: Request, res: Response) => {
      if (fs.existsSync(indexPath)) {
        const raw = fs.readFileSync(indexPath, 'utf-8');
        const rendered = injectDirectorySeo(raw, req);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
        res.setHeader('X-Robots-Tag', getRobotsTagForRequest(req));
        return res.status(200).send(rendered);
      }
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(indexPath);
    });

    app.get('*', (req: Request, res: Response) => {
      if (fs.existsSync(indexPath)) {
        const raw = fs.readFileSync(indexPath, 'utf-8');
        const notFoundHtml = render404Html(raw, req);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        return res.status(404).send(notFoundHtml);
      }
      res.setHeader('Cache-Control', 'no-cache');
      res.status(404).send('Not Found');
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[StoryHub Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
