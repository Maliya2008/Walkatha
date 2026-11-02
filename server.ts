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

  // API route: Categories
  app.get('/api/categories', (_req, res) => {
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
