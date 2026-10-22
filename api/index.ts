import serverBundle from '../build/server.cjs';
import { createRequire } from 'module';
import path from 'path';

// Extract the Express application instance supporting both ESM and CJS bundle shapes
let resolvedApp: any = (serverBundle && (serverBundle.default || (serverBundle as any).app)) || serverBundle;

function getExpressApp(): any {
  if (resolvedApp && typeof resolvedApp === 'function') {
    return resolvedApp;
  }
  try {
    const req = createRequire(import.meta.url);
    const candidatePaths = [
      path.join(process.cwd(), 'build', 'server.cjs'),
      path.resolve(process.cwd(), 'build/server.cjs'),
      '/var/task/build/server.cjs',
    ];
    for (const p of candidatePaths) {
      try {
        const mod = req(p);
        const app = mod.default || mod.app || mod;
        if (typeof app === 'function') {
          resolvedApp = app;
          return resolvedApp;
        }
      } catch {}
    }
  } catch (err) {
    console.warn('[Vite/Vercel Server Resolver Notice]:', err);
  }
  return resolvedApp;
}

// Standard Vercel Serverless Function handler
export default function handler(req: any, res: any) {
  try {
    // If running in AWS Lambda / Vercel Serverless runtime:
    // prevent lambda from hanging waiting for open background event loop handles (like Firestore connections)
    if (req?.context) {
      req.context.callbackWaitsForEmptyEventLoop = false;
    }
    const app = getExpressApp();
    if (typeof app === 'function') {
      return app(req, res);
    }
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Server initialization error: Express application could not be resolved from build/server.cjs');
  } catch (err: any) {
    console.error('[Vercel Serverless Top-Level Handler Error]:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Server Execution Error: ' + (err?.message || 'Unknown error'));
    }
  }
}

export { resolvedApp as app };
