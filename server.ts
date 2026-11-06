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

  app.disable('x-powered-by');
  app.use(express.json());

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
