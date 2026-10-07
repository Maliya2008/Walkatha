import app from '../server';

export default function handler(req: any, res: any) {
  // Normalize rewritten url if present
  if (req.headers) {
    const forwardedUri = req.headers['x-forwarded-uri'] || req.headers['x-invoke-path'];
    if (typeof forwardedUri === 'string' && forwardedUri.startsWith('/') && !forwardedUri.startsWith('/api/index')) {
      req.url = forwardedUri;
    }
  }
  return app(req, res);
}
