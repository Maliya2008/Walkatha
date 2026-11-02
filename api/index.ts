export default async function handler(req: any, res: any) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  // Health check
  if (pathname === '/api/health' || pathname === '/api') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  }

  // Categories
  if (pathname === '/api/categories') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        categories: [
          { id: 'all', name: 'All Stories', sinhalaName: 'සියලු කතා' },
          { id: 'romantic', name: 'Romantic', sinhalaName: 'ආදර කතා' },
          { id: 'unconventional', name: 'Adult & Drama', sinhalaName: 'අසම්මත කතා' },
          { id: 'short', name: 'Short Stories', sinhalaName: 'කෙටි කතා' },
          { id: 'suspense', name: 'Suspense & Mystery', sinhalaName: 'ත්‍රාසජනක' },
          { id: 'novel', name: 'Series & Novels', sinhalaName: 'දිගු කතා මාලා' },
        ],
      })
    );
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ status: 'ok', message: 'Walkathawa API endpoint' }));
}
