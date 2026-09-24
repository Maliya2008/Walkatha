import app, { startServer } from '../server';

export default async function handler(req: any, res: any) {
  try {
    await startServer();
    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel Serverless Invocation Error]:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!DOCTYPE html><html lang="si"><head><meta charset="UTF-8"><title>Error</title></head><body><h1>Service Temporarily Unavailable</h1><p>කරුණාකර මොහොතකින් නැවත උත්සාහ කරන්න.</p></body></html>');
  }
}

