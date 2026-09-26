import app, { startServer } from '../server';

export default async function handler(req: any, res: any) {
  try {
    // Recover original user-requested path if rewritten by Vercel
    if (req.headers) {
      const forwardedUri = req.headers['x-forwarded-uri'] || req.headers['x-invoke-path'];
      if (typeof forwardedUri === 'string' && forwardedUri.startsWith('/') && !forwardedUri.startsWith('/api/index')) {
        req.url = forwardedUri;
      } else if (req.url && (req.url.startsWith('/api/index') || req.url === '/api')) {
        const matched = req.headers['x-matched-path'];
        if (typeof matched === 'string' && matched.startsWith('/') && !matched.startsWith('/api/index')) {
          req.url = matched;
        }
      }
    }

    await startServer();

    return await new Promise<void>((resolve, reject) => {
      let isSettled = false;

      const timeoutId = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          console.warn('[Vercel Invocation Timeout Safeguard] Resolved before maxDuration to prevent FUNCTION_INVOCATION_FAILED');
          if (!res.headersSent) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end('<!doctype html><html lang="si"><head><!-- Google tag (gtag.js) --><script async src="https://www.googletagmanager.com/gtag/js?id=G-EHBR2EWZCV"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag(\'js\',new Date());gtag(\'config\',\'G-EHBR2EWZCV\');</script><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Walkathawa (වල් කතාව)</title></head><body><div id="root"></div></body></html>');
          }
          resolve();
        }
      }, 9500);

      const done = (err?: any) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timeoutId);
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
      res.statusCode = 200; // Return 200 with HTML rather than 500 to maintain crawler indexing & user experience
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end('<!doctype html><html lang="si"><head><!-- Google tag (gtag.js) --><script async src="https://www.googletagmanager.com/gtag/js?id=G-EHBR2EWZCV"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag(\'js\',new Date());gtag(\'config\',\'G-EHBR2EWZCV\');</script><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Walkathawa (වල් කතාව)</title></head><body><div id="root"></div></body></html>');
    }
  }
}
