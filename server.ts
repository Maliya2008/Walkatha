import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // In-memory stories cache from data/database.json
  let databaseStories: any[] = [];
  let databaseCategories: any[] = [];
  const storySlugMap = new Map<string, any>();

  try {
    const dbFilePath = path.resolve(process.cwd(), 'data', 'database.json');
    if (fs.existsSync(dbFilePath)) {
      const dbData = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
      databaseStories = dbData.stories || [];
      databaseCategories = dbData.categories || [];
      for (const s of databaseStories) {
        if (s.slug) storySlugMap.set(String(s.slug).trim().toLowerCase(), s);
        if (s.id) storySlugMap.set(String(s.id).trim().toLowerCase(), s);
      }
      console.log(`[Database Loaded] ${databaseStories.length} stories, ${databaseCategories.length} categories.`);
    }
  } catch (err) {
    console.warn('[Database Load Warning]:', err);
  }

  // API route: Stories catalog
  app.get('/api/stories', (req, res) => {
    const limit = parseInt(String(req.query.limit || '1000'), 10);
    const category = String(req.query.category || 'all');
    let list = databaseStories;
    if (category && category !== 'all') {
      list = list.filter((s) => (s.category || '').toLowerCase().includes(category.toLowerCase()));
    }
    res.json({
      total: list.length,
      data: list.slice(0, limit),
    });
  });

  // API route: Single story by slug or id
  app.get('/api/story/:slug', (req, res) => {
    const raw = req.params.slug;
    const clean = decodeURIComponent(raw).trim().toLowerCase();
    const story = storySlugMap.get(clean);
    if (story) {
      return res.json({ story });
    }
    res.status(404).json({ error: 'Story not found' });
  });

  // API route: Categories
  app.get('/api/categories', (_req, res) => {
    if (databaseCategories.length > 0) {
      return res.json({ categories: databaseCategories });
    }
    res.json({
      categories: [
        { id: 'all', name: 'All Stories', sinhalaName: 'සියලු කතා' },
        { id: 'romantic', name: 'Romantic', sinhalaName: 'ආදර කතා' },
        { id: 'unconventional', name: 'Adult & Drama', sinhalaName: 'අසම්මත කතා' },
        { id: 'short', name: 'Short Stories', sinhalaName: 'කෙටි කතා' },
        { id: 'suspense', name: 'Suspense & Mystery', sinhalaName: 'ත්‍රාසජනක' },
        { id: 'novel', name: 'Series & Novels', sinhalaName: 'දිගු කතා මාලා' },
      ],
    });
  });

  // Dedicated SEO Endpoints
  const serveXml = (fileName: string, res: express.Response) => {
    const candidates = [
      path.resolve(process.cwd(), 'public', fileName),
      path.resolve(process.cwd(), 'dist', fileName),
      path.resolve(__dirname, 'public', fileName),
      path.resolve(__dirname, 'dist', fileName),
    ];
    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=1800, stale-while-revalidate=86400');
        res.setHeader('X-Robots-Tag', 'all');
        return res.sendFile(filePath);
      }
    }
    res.status(404).setHeader('Content-Type', 'text/plain; charset=utf-8').send(`Sitemap ${fileName} not found`);
  };

  app.get(['/sitemap.xml', '/sitemap_index.xml'], (_req, res) => {
    serveXml('sitemap.xml', res);
  });

  app.get('/sitemap-main.xml', (_req, res) => {
    serveXml('sitemap-main.xml', res);
  });

  app.get('/sitemap-stories.xml', (_req, res) => {
    serveXml('sitemap-stories.xml', res);
  });

  app.get('/robots.txt', (_req, res) => {
    const candidates = [
      path.resolve(process.cwd(), 'public', 'robots.txt'),
      path.resolve(process.cwd(), 'dist', 'robots.txt'),
      path.resolve(__dirname, 'public', 'robots.txt'),
      path.resolve(__dirname, 'dist', 'robots.txt'),
    ];
    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
        res.setHeader('X-Robots-Tag', 'all');
        return res.sendFile(filePath);
      }
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: https://www.walkathawa.site/sitemap.xml\nSitemap: https://www.walkathawa.site/sitemap-stories.xml\nSitemap: https://www.walkathawa.site/sitemap-main.xml\n`
    );
  });

  if (!isProd) {
    // Development mode: Vite middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Walkathawa Server] running on http://0.0.0.0:${PORT} (Mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[Walkathawa Server Error]:', err);
  process.exit(1);
});
