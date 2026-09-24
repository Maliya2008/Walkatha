import app, { startServer } from '../server';

export default async function handler(req: any, res: any) {
  try {
    // If Vercel rewrote the URL, normalize req.url from x-matched-path
    if (req.headers) {
      const originalPath = req.headers['x-matched-path'] || req.headers['x-now-route-matches'];
      if (typeof originalPath === 'string' && originalPath.startsWith('/')) {
        req.url = originalPath;
      }
    }

    await startServer();

    return await new Promise<void>((resolve, reject) => {
      let isSettled = false;
      const done = (err?: any) => {
        if (!isSettled) {
          isSettled = true;
          if (err) reject(err);
          else resolve();
        }
      };

      if (typeof res.on === 'function') {
        res.on('finish', () => done());
        res.on('close', () => done());
        res.on('error', (err: any) => done(err));
      }

      app(req, res, (err: any) => {
        if (err) done(err);
        else done();
      });
    });
  } catch (err: any) {
    console.error('[Vercel Serverless Invocation Error]:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end('<!DOCTYPE html><html lang="si"><head><meta charset="UTF-8"><title>Error</title></head><body><h1>Service Temporarily Unavailable</h1><p>කරුණාකර මොහොතකින් නැවත උත්සාහ කරන්න.</p></body></html>');
    }
  }
}


