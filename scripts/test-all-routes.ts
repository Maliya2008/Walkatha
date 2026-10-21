import app from '../api/index';
import http from 'http';
import fs from 'fs';
import path from 'path';

async function runRouteTests() {
  console.log('=== Starting Complete Route Verification Test ===');
  
  // Find a real asset from dist/assets
  const assetsDir = path.join(process.cwd(), 'dist', 'assets');
  let realAsset = 'index-BDy0cJ-D.css';
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    const cssOrJs = files.find(f => f.endsWith('.css') || f.endsWith('.js'));
    if (cssOrJs) realAsset = cssOrJs;
  }

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  // Get first real published story slug
  let validStorySlug = 'දිනිතිගෙ-චැට්-එ-ක-1-sinhala-wala';
  const dbPath = path.join(process.cwd(), 'data', 'database.json');
  if (fs.existsSync(dbPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      if (parsed.stories && parsed.stories.length > 0) {
        validStorySlug = parsed.stories[0].slug;
      }
    } catch {}
  }
  console.log(`Testing with real story slug: "${validStorySlug}"`);

  let passed = 0;
  let failed = 0;

  async function testRoute(
    name: string,
    urlPath: string,
    expectedStatus: number,
    expectedContentType: string,
    contentChecks: Array<(body: string, res: Response) => boolean | string>,
    headers: Record<string, string> = {}
  ) {
    try {
      const res = await fetch(`${baseUrl}${urlPath}`, {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          ...headers,
        },
        redirect: 'manual',
      });

      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();

      if (res.status !== expectedStatus) {
        console.error(`❌ [${name}] Expected status ${expectedStatus}, got ${res.status}`);
        failed++;
        return;
      }

      if (!contentType.includes(expectedContentType)) {
        console.error(`❌ [${name}] Expected Content-Type containing "${expectedContentType}", got "${contentType}"`);
        failed++;
        return;
      }

      for (const check of contentChecks) {
        const result = check(text, res as any);
        if (result !== true) {
          console.error(`❌ [${name}] Content check failed: ${result}`);
          failed++;
          return;
        }
      }

      console.log(`✔ [${name}] Status ${res.status}, Type: ${contentType.split(';')[0]}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [${name}] Request threw error:`, err?.message || err);
      failed++;
    }
  }

  // 1. GET /
  await testRoute('1. GET / (Homepage SSR)', '/', 200, 'text/html', [
    (body) => body.includes('Walkathawa') || 'Title/brand missing',
    (body) => body.includes('<article') || 'Story articles missing in SSR HTML',
    (body) => body.includes('rel="canonical"') || 'Canonical link missing',
  ]);

  // 2. GET /admin (Direct browser navigation)
  await testRoute('2. GET /admin (Admin SPA Direct)', '/admin', 200, 'text/html', [
    (body, res) => res.headers.get('x-robots-tag')?.includes('noindex') || 'Missing x-robots-tag noindex on admin',
    (body) => body.includes('<div id="root">') || 'Missing root div',
  ]);

  // 3. GET /admin/ and nested admin route
  await testRoute('3a. GET /admin/ (Trailing Slash)', '/admin/', 301, '', [
    (_b, res) => (res.headers.get('location') || '').endsWith('/admin') || 'Expected redirect to /admin',
  ]);

  await testRoute('3b. GET /admin/dashboard (Nested Admin)', '/admin/dashboard', 200, 'text/html', [
    (body, res) => res.headers.get('x-robots-tag')?.includes('noindex') || 'Missing x-robots-tag on nested admin',
    (body) => body.includes('<div id="root">') || 'Missing root div',
  ]);

  // 4. GET /story/<an-existing-story-slug>
  const encodedSlug = encodeURIComponent(validStorySlug);
  await testRoute(`4. GET /story/${validStorySlug} (Existing Story SSR)`, `/story/${encodedSlug}`, 200, 'text/html', [
    (body) => body.includes('<article') || 'Missing article tag',
    (body) => body.includes('itemprop="articleBody"') || body.includes('entry-content') || 'Missing story content in SSR',
    (body) => body.includes('/story/') || 'Missing story canonical URL',
    (body) => body.includes('"@type":"Article"') || body.includes('"@type": "Article"') || 'Missing Article JSON-LD Schema',
  ]);

  // 5. GET /story/<a-nonexistent-story-slug>
  await testRoute('5. GET /story/nonexistent-xyz (404 Handling)', '/story/nonexistent-xyz', 404, 'text/html', [
    (body, res) => res.headers.get('x-robots-tag')?.includes('noindex') || 'Missing noindex header on 404',
    (body) => body.includes('404') || body.includes('හමු නොවීය') || 'Missing 404 message in body',
  ]);

  // 6. GET /category/<a-valid-category>
  await testRoute('6. GET /category/wife (Category SSR)', '/category/wife', 200, 'text/html', [
    (body) => body.includes('https://www.walkathawa.site/category/wife') || 'Missing category canonical link',
    (body) => body.includes('වර්ගීකරණය') || body.includes('Category') || body.includes('කතා') || 'Missing category content',
  ]);

  // 7. GET /categories
  await testRoute('7. GET /categories (Categories Directory)', '/categories', 200, 'text/html', [
    (body) => body.includes('https://www.walkathawa.site/categories') || 'Missing categories canonical link',
    (body) => body.includes('/category/') || 'Missing category links',
  ]);

  // 8. GET /sitemap
  await testRoute('8. GET /sitemap (HTML Sitemap & Archives)', '/sitemap', 200, 'text/html', [
    (body) => body.includes('https://www.walkathawa.site/sitemap') || 'Missing sitemap canonical link',
    (body) => body.includes('/story/') || 'Missing story archive links',
  ]);

  // 9. GET /sitemap.xml
  await testRoute('9. GET /sitemap.xml (Sitemap Index XML)', '/sitemap.xml', 200, 'xml', [
    (body) => body.includes('<sitemapindex') || 'Missing sitemapindex root tag',
    (body) => body.includes('/sitemap-main.xml') || 'Missing sitemap-main.xml reference',
    (body) => body.includes('/sitemap-stories.xml') || 'Missing sitemap-stories.xml reference',
  ]);

  // 10. GET /feed.xml
  await testRoute('10. GET /feed.xml (RSS Feed XML)', '/feed.xml', 200, 'xml', [
    (body) => body.includes('<rss') || 'Missing rss root tag',
    (body) => body.includes('<channel>') || 'Missing channel tag',
    (body) => body.includes('<item>') || 'Missing item tags in feed',
  ]);

  // 11. GET /robots.txt
  await testRoute('11. GET /robots.txt', '/robots.txt', 200, 'text/plain', [
    (body) => body.includes('User-agent: *') || 'Missing User-agent',
    (body) => body.includes('Disallow: /admin') || 'Missing Disallow /admin',
    (body) => body.includes('Sitemap: https://www.walkathawa.site/sitemap.xml') || 'Missing sitemap reference',
  ]);

  // 12. GET /assets/<a-real-built-asset>
  await testRoute(`12. GET /assets/${realAsset} (Static Built Asset)`, `/assets/${realAsset}`, 200, realAsset.endsWith('.css') ? 'text/css' : 'javascript', [
    (body, res) => res.headers.get('cache-control')?.includes('immutable') || res.headers.get('cache-control')?.includes('max-age') || 'Missing cache-control on asset',
    (body) => body.length > 50 || 'Asset body is empty',
  ]);

  // 13. Existing /api endpoints
  await testRoute('13a. GET /api/stories', '/api/stories', 200, 'application/json', [
    (body) => {
      try {
        const json = JSON.parse(body);
        return Array.isArray(json.data) && json.data.length > 0 ? true : 'Empty stories array';
      } catch {
        return 'Invalid JSON response';
      }
    },
  ]);

  await testRoute(`13b. GET /api/stories/${validStorySlug}`, `/api/stories/${encodedSlug}`, 200, 'application/json', [
    (body) => {
      try {
        const json = JSON.parse(body);
        return json.id && json.title ? true : 'Invalid story object';
      } catch {
        return 'Invalid JSON response';
      }
    },
  ]);

  await testRoute('13c. GET /api/categories', '/api/categories', 200, 'application/json', [
    (body) => {
      try {
        const json = JSON.parse(body);
        return Array.isArray(json) && json.length > 0 ? true : 'Empty categories array';
      } catch {
        return 'Invalid JSON response';
      }
    },
  ]);

  await testRoute('13d. GET /api/admin/stats', '/api/admin/stats', 200, 'application/json', [
    (body) => {
      try {
        const json = JSON.parse(body);
        return typeof json.totalStories === 'number' ? true : 'Missing totalStories in stats';
      } catch {
        return 'Invalid JSON response';
      }
    },
  ]);

  // Test Simulated Vercel Rewrite with __vercel_url query param
  await testRoute('14. Vercel Rewrite simulation: /api/index?__vercel_url=/admin', '/api/index?__vercel_url=/admin', 200, 'text/html', [
    (body, res) => res.headers.get('x-robots-tag')?.includes('noindex') || 'Expected noindex on rewritten /admin',
    (body) => body.includes('<div id="root">') || 'Missing root div on rewritten /admin',
  ]);

  await testRoute(`15. Vercel Rewrite simulation: /api/index?__vercel_url=/story/${validStorySlug}`, `/api/index?__vercel_url=/story/${encodedSlug}`, 200, 'text/html', [
    (body) => body.includes('<article') || 'Missing article tag on rewritten story URL',
    (body) => body.includes('/story/') || 'Missing canonical link on rewritten story URL',
  ]);

  server.close();

  console.log('\n=========================================');
  console.log(`TOTAL PASSED: ${passed}`);
  console.log(`TOTAL FAILED: ${failed}`);
  console.log('=========================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runRouteTests().catch((e) => {
  console.error('Test runner fatal error:', e);
  process.exit(1);
});
