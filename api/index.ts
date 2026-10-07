import app from '../server';

export default function handler(req: any, res: any) {
  // Normalize rewritten url from Vercel headers if present
  if (req && req.headers) {
    const originalUrl =
      req.headers['x-forwarded-uri'] ||
      req.headers['x-vercel-sc-path'] ||
      req.headers['x-original-url'] ||
      req.headers['x-rewrite-url'] ||
      req.headers['x-invoke-path'];

    if (
      typeof originalUrl === 'string' &&
      originalUrl.startsWith('/') &&
      !originalUrl.startsWith('/api/index') &&
      !originalUrl.startsWith('/api')
    ) {
      req.url = originalUrl;
    }
  }

  // Return a promise that resolves when Express has completed sending the response
  return new Promise<void>((resolve, reject) => {
    res.once('finish', resolve);
    res.once('close', resolve);
    res.once('error', (err: any) => {
      console.error('[Serverless Response Error]:', err);
      resolve(); // resolve to prevent unhandled rejection in serverless runtime
    });

    try {
      app(req, res, (err: any) => {
        if (err) {
          console.error('[Serverless Express Error]:', err);
        }
        resolve();
      });
    } catch (err) {
      console.error('[Serverless Handler Exception]:', err);
      if (!res.headersSent) {
        res.status(200).send('<!doctype html><html><head><title>Walkathawa</title></head><body><div id="root"></div></body></html>');
      }
      resolve();
    }
  });
}

