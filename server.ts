import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { INITIAL_STORIES, INITIAL_CATEGORIES } from './src/data/seedStories';
import { Story } from './src/types/story';
import { AdvertisementSettings, SiteSettings, User } from './src/types/admin';

const app = express();
const PORT = 3000;

// Parse incoming JSON requests with generous limit for cover images
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// --- DATABASE PERSISTENCE LAYER ---
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

interface DatabaseSchema {
  users: Array<User & { passwordHash: string; salt: string }>;
  stories: Story[];
  advertisements: AdvertisementSettings;
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
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (decoded.exp && Date.now() > decoded.exp) {
      return null;
    }
    return decoded;
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
    individualAdCode: '',
  }));

  const defaultAds: AdvertisementSettings = {
    globalAdCode: '<!-- Monetag Global Tag -->\n<div class="monetag-global-banner p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded text-center text-xs text-amber-800 dark:text-amber-300 font-medium"><a href="https://monetag.com" target="_blank" rel="noopener noreferrer" class="hover:underline flex items-center justify-center gap-1.5">⚡ Sponsored Story Pick — Discover Global Content (Opens in new tab)</a></div>',
    adsEnabled: true,
    adsPerPage: 2,
    headerAdCode: '',
    inArticleAdCode: '',
    footerAdCode: '',
    testMode: true,
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
    searchConsoleVerification: '',
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
  const { category, search, tag, sortBy, page = '1', limit = '9' } = req.query;

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
  const limitNum = Math.max(1, Math.min(50, parseInt(String(limit), 10) || 9));
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
  const individualAdCode = db.postAdvertisements[story.id] || story.individualAdCode || '';

  // Get 3 related stories
  const relatedStories = db.stories
    .filter((s) => s.published && s.id !== story.id && (s.category === story.category || s.tags.some((t) => story.tags.includes(t))))
    .slice(0, 3);

  res.json({
    story: {
      ...story,
      individualAdCode,
    },
    relatedStories,
  });
});

// Public: Get Monetag Advertisement Configuration
app.get('/api/public/ads/config', (_req: Request, res: Response) => {
  res.json({
    ...db.advertisements,
  });
});

// Public: Get Categories
app.get('/api/public/categories', (_req: Request, res: Response) => {
  res.json(INITIAL_CATEGORIES);
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

// --- DYNAMIC SEO SITEMAP.XML ---
app.get('/sitemap.xml', (req: Request, res: Response) => {
  const host = req.get('host') || 'walkatha-amber.vercel.app';
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const publishedStories = db.stories.filter((s) => s.published);
  const nowISO = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // 1. Homepage
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/</loc>\n`;
  xml += `    <lastmod>${nowISO}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // 2. Categories
  INITIAL_CATEGORIES.filter((c) => c.slug !== 'all').forEach((cat) => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/?category=${cat.slug}</loc>\n`;
    xml += `    <lastmod>${nowISO}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  // 3. Published Stories
  publishedStories.forEach((story) => {
    const modTime = story.updatedDate || story.uploadDate || story.uploadedDate || nowISO;
    const storyUrl = `${baseUrl}/story/${story.slug}`;
    xml += `  <url>\n`;
    xml += `    <loc>${storyUrl}</loc>\n`;
    xml += `    <lastmod>${new Date(modTime).toISOString()}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    if (story.coverImage) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${story.coverImage}</image:loc>\n`;
      xml += `      <image:title>${story.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</image:title>\n`;
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// --- ROBOTS.TXT ---
app.get('/robots.txt', (req: Request, res: Response) => {
  const host = req.get('host') || 'walkatha-amber.vercel.app';
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const robots = `# Robots.txt for Walkathawa (වල් කතාව)
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/admin
Disallow: /api/auth

# Sitemap Index
Sitemap: ${baseUrl}/sitemap.xml
`;

  res.header('Content-Type', 'text/plain');
  res.send(robots);
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
    adsEnabled: db.advertisements.adsEnabled,
    adsPerPage: db.advertisements.adsPerPage,
    hasGlobalAdCode: Boolean(db.advertisements.globalAdCode && db.advertisements.globalAdCode.trim()),
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

  // Attach individualAdCode if stored in postAdvertisements mapping
  const enrichedList = list.map((s) => ({
    ...s,
    individualAdCode: db.postAdvertisements[s.id] || s.individualAdCode || '',
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
    individualAdCode,
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
    individualAdCode: individualAdCode || '',
  };

  db.stories.unshift(newStory);

  if (individualAdCode) {
    db.postAdvertisements[id] = individualAdCode;
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
    individualAdCode,
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
    individualAdCode: individualAdCode !== undefined ? individualAdCode : current.individualAdCode,
    updatedDate: now,
  };

  db.stories[index] = updatedStory;

  if (individualAdCode !== undefined) {
    db.postAdvertisements[id] = individualAdCode;
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
  const { globalAdCode, adsEnabled, adsPerPage, headerAdCode, inArticleAdCode, footerAdCode, testMode } = req.body;

  db.advertisements = {
    globalAdCode: globalAdCode !== undefined ? String(globalAdCode) : db.advertisements.globalAdCode,
    adsEnabled: adsEnabled !== undefined ? Boolean(adsEnabled) : db.advertisements.adsEnabled,
    adsPerPage: adsPerPage !== undefined ? (Number(adsPerPage) as 1 | 2 | 3) : db.advertisements.adsPerPage,
    headerAdCode: headerAdCode !== undefined ? String(headerAdCode) : db.advertisements.headerAdCode,
    inArticleAdCode: inArticleAdCode !== undefined ? String(inArticleAdCode) : db.advertisements.inArticleAdCode,
    footerAdCode: footerAdCode !== undefined ? String(footerAdCode) : db.advertisements.footerAdCode,
    testMode: testMode !== undefined ? Boolean(testMode) : db.advertisements.testMode,
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
  story.individualAdCode = adCode || '';
  saveDatabase();

  res.json({
    message: `Ad code for story "${story.title}" saved successfully`,
    storyId: id,
    adCode,
  });
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
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StoryHub Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
