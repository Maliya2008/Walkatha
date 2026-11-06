import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const syncFilePath = path.resolve(process.cwd(), 'server-data', 'firestore-sync.json');

interface SyncStore {
  stories: any[];
  categories: any[];
}

function readSyncStore(): SyncStore {
  try {
    if (fs.existsSync(syncFilePath)) {
      const raw = JSON.parse(fs.readFileSync(syncFilePath, 'utf8'));
      return {
        stories: Array.isArray(raw.stories) ? raw.stories : [],
        categories: Array.isArray(raw.categories) ? raw.categories : [],
      };
    }
  } catch (err) {
    console.error('[Walkathawa Store Read Error]:', err);
  }
  return { stories: [], categories: [] };
}

function writeSyncStore(store: SyncStore): void {
  try {
    const dir = path.dirname(syncFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(syncFilePath, JSON.stringify(store), 'utf8');
  } catch (err) {
    console.error('[Walkathawa Store Write Error]:', err);
  }
}

function triggerSitemapUpdate(): void {
  const scriptPath = path.resolve(process.cwd(), 'scripts', 'generate-sitemap.js');
  if (fs.existsSync(scriptPath)) {
    execFile('node', [scriptPath], { cwd: process.cwd() }, () => {});
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.disable('x-powered-by');
  app.use(express.json({ limit: '10mb' }));

  // Security & Performance Cache Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.path.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Full Firestore Sync & Admin State Endpoints
  app.get('/api/firestore/stories', (_req, res) => {
    const store = readSyncStore();
    const activeStories = store.stories.filter(
      (s) => !s.isDeleted && !s.deleted && s.published !== false
    );
    const activeCategories = store.categories.filter(
      (c) => !c.isDeleted && !c.deleted && c.slug !== 'all'
    );
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      stories: activeStories,
      categories: activeCategories,
    });
  });

  app.get('/api/firestore/story/:slug', (req, res) => {
    const slug = decodeURIComponent(req.params.slug || '').trim().toLowerCase();
    const store = readSyncStore();
    const found = store.stories.find(
      (s) =>
        !s.isDeleted &&
        !s.deleted &&
        s.published !== false &&
        (String(s.slug || '').toLowerCase() === slug ||
          String(s.id || '').toLowerCase() === slug ||
          decodeURIComponent(String(s.slug || '')).toLowerCase() === slug)
    );
    if (!found) {
      return res.status(404).json({ error: 'Story not found' });
    }
    res.setHeader('Cache-Control', 'no-store');
    res.json(found);
  });

  app.post('/api/firestore/story', (req, res) => {
    const incoming = req.body;
    if (!incoming || !incoming.title) {
      return res.status(400).json({ error: 'Invalid story payload' });
    }
    const store = readSyncStore();
    const idx = store.stories.findIndex(
      (s) => s.id === incoming.id || (incoming.slug && s.slug === incoming.slug)
    );
    if (idx >= 0) {
      store.stories[idx] = {
        ...store.stories[idx],
        ...incoming,
        isDeleted: false,
        deleted: false,
        published: true,
      };
    } else {
      store.stories.unshift({
        ...incoming,
        isDeleted: false,
        deleted: false,
        published: true,
      });
    }
    writeSyncStore(store);
    triggerSitemapUpdate();
    res.json({ status: 'ok', story: incoming });
  });

  app.delete('/api/firestore/story/:id', (req, res) => {
    const target = decodeURIComponent(req.params.id || '').trim().toLowerCase();
    const store = readSyncStore();
    store.stories = store.stories.filter(
      (s) =>
        String(s.id || '').toLowerCase() !== target &&
        String(s.slug || '').toLowerCase() !== target
    );
    writeSyncStore(store);
    triggerSitemapUpdate();
    res.json({ status: 'ok' });
  });

  app.post('/api/firestore/category', (req, res) => {
    const incoming = req.body;
    if (!incoming || (!incoming.slug && !incoming.name)) {
      return res.status(400).json({ error: 'Invalid category payload' });
    }
    const store = readSyncStore();
    const key = String(incoming.slug || incoming.id).trim().toLowerCase();
    const idx = store.categories.findIndex(
      (c) =>
        String(c.slug || '').toLowerCase() === key ||
        String(c.id || '').toLowerCase() === key
    );
    if (idx >= 0) {
      store.categories[idx] = { ...store.categories[idx], ...incoming, isDeleted: false };
    } else {
      store.categories.push({ ...incoming, isDeleted: false });
    }
    writeSyncStore(store);
    triggerSitemapUpdate();
    res.json({ status: 'ok', categories: store.categories });
  });

  app.delete('/api/firestore/category/:slug', (req, res) => {
    const target = decodeURIComponent(req.params.slug || '').trim().toLowerCase();
    const store = readSyncStore();
    store.categories = store.categories.filter(
      (c) =>
        String(c.slug || '').toLowerCase() !== target &&
        String(c.id || '').toLowerCase() !== target
    );
    writeSyncStore(store);
    triggerSitemapUpdate();
    res.json({ status: 'ok', categories: store.categories });
  });

  // Dynamic Sitemap Regeneration Endpoint
  app.post('/api/regenerate-sitemap', (_req, res) => {
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'generate-sitemap.js');
    execFile('node', [scriptPath], { cwd: process.cwd() }, (err, stdout) => {
      if (err) {
        return res.status(500).json({ status: 'error', message: err.message });
      }
      res.json({ status: 'ok', output: stdout.trim() });
    });
  });

  // Google Search Console verification file
  app.get('/google0a8bbd03676eca90.html', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send('google-site-verification: google0a8bbd03676eca90.html');
  });

  // Dedicated SEO Sitemap Endpoints
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
        res.setHeader(
          'Cache-Control',
          'public, max-age=600, s-maxage=1800, stale-while-revalidate=86400'
        );
        res.setHeader('X-Robots-Tag', 'all');
        return res.sendFile(filePath);
      }
    }
    res
      .status(404)
      .setHeader('Content-Type', 'text/plain; charset=utf-8')
      .send(`Sitemap ${fileName} not found`);
  };

  app.get(['/sitemap.xml', '/sitmap.xml', '/sitemap_index.xml'], (_req, res) => {
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
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: https://www.walkathawa.site/sitemap.xml\nSitemap: https://www.walkathawa.site/sitemap-main.xml\nSitemap: https://www.walkathawa.site/sitemap-stories.xml\n`
    );
  });

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath, { maxAge: '7d' }));
    app.get('*', (_req, res) => {
      res.setHeader(
        'Cache-Control',
        'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400'
      );
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[Walkathawa Server] running on http://0.0.0.0:${PORT} (Mode: ${
        isProd ? 'production' : 'development'
      })`
    );
  });
}

startServer().catch((err) => {
  console.error('[Walkathawa Server Error]:', err);
  process.exit(1);
});
