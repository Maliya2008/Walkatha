import express from 'express';
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
