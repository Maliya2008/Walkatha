import http from 'http';
import assert from 'node:assert';
import handler, { app } from '../api/index';

async function runVercelRouteTests() {
  console.log('=== VERIFYING VERCEL ENTRY POINT & DIRECT URL / REFRESH ROUTES ===\n');

  // Verify exported handler
  assert(typeof handler === 'function', 'handler must be a callable function');
  assert(typeof app === 'function', 'app must be resolved Express instance');
  console.log('✔ Handler & Express App resolution confirmed from build/server.cjs');

  // Create an HTTP server using the exact Vercel handler
  const server = http.createServer((req, res) => {
    // Attach simulated Vercel context
    const context: any = { callbackWaitsForEmptyEventLoop: true };
    (req as any).context = context;
    handler(req, res);
    assert.strictEqual(context.callbackWaitsForEmptyEventLoop, false, 'Handler must set callbackWaitsForEmptyEventLoop to false');
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const port = address.port;
  console.log(`✔ Simulated Vercel runtime server listening on port ${port}\n`);

  function testRequest(urlPath: string, headers: Record<string, string> = {}): Promise<{
    statusCode: number;
    headers: http.IncomingHttpHeaders;
    body: string;
  }> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: urlPath,
          method: 'GET',
          headers: {
            host: 'www.walkathawa.site',
            'x-forwarded-proto': 'https',
            ...headers,
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode || 0,
              headers: res.headers,
              body: data,
            });
          });
        }
      );
      req.on('error', reject);
      req.end();
    });
  }

  try {
    // 1. GET / (Homepage)
    console.log('1. Testing GET / (Homepage direct navigation / refresh)...');
    const homeRes = await testRequest('/');
    assert.strictEqual(homeRes.statusCode, 200, 'Homepage must return 200');
    assert(homeRes.headers['content-type']?.includes('text/html'), 'Homepage must return text/html');
    assert(homeRes.body.includes('<title>'), 'Homepage must contain HTML <title>');
    assert(homeRes.body.includes('<div id="root">'), 'Homepage must contain #root container');
    console.log('✔ Homepage direct navigation passed');

    // 2. GET /admin (Admin root)
    console.log('2. Testing GET /admin (Admin panel direct navigation / refresh)...');
    const adminRes = await testRequest('/admin');
    assert.strictEqual(adminRes.statusCode, 200, 'Admin page must return 200');
    assert(adminRes.headers['content-type']?.includes('text/html'), 'Admin page must return text/html');
    assert(adminRes.headers['x-robots-tag']?.includes('noindex'), 'Admin page must have noindex');
    assert(adminRes.body.includes('<div id="root">'), 'Admin page must contain SPA root');
    console.log('✔ Admin page direct navigation passed');

    // 3. GET /admin/login (Admin nested route)
    console.log('3. Testing GET /admin/login (Nested admin direct navigation / refresh)...');
    const adminLoginRes = await testRequest('/admin/login');
    assert.strictEqual(adminLoginRes.statusCode, 200, 'Admin login must return 200');
    assert(adminLoginRes.headers['content-type']?.includes('text/html'), 'Admin login must return text/html');
    assert(adminLoginRes.headers['x-robots-tag']?.includes('noindex'), 'Admin login must have noindex');
    console.log('✔ Admin nested route direct navigation passed');

    // 4. GET /story/:slug (Existing story)
    console.log('4. Testing GET /story/:slug (Story page direct navigation / refresh)...');
    const testSlug = encodeURIComponent('දිනිතිගෙ-චැට්-එ-ක-1-sinhala-wala');
    const storyRes = await testRequest(`/story/${testSlug}`);
    assert.strictEqual(storyRes.statusCode, 200, 'Existing story must return 200');
    assert(storyRes.headers['content-type']?.includes('text/html'), 'Story page must return text/html');
    assert(storyRes.body.includes('<h1'), 'Story page must contain server-rendered H1');
    assert(storyRes.body.includes('canonical'), 'Story page must contain canonical tag');
    console.log('✔ Existing story direct navigation passed');

    // 5. GET /story/:slug (Non-existent story)
    console.log('5. Testing GET /story/:slug (Non-existent story 404)...');
    const notFoundStoryRes = await testRequest('/story/completely-non-existent-story-999');
    assert.strictEqual(notFoundStoryRes.statusCode, 404, 'Non-existent story must return 404');
    assert(notFoundStoryRes.headers['x-robots-tag']?.includes('noindex'), '404 must have noindex');
    assert(notFoundStoryRes.body.includes('404'), '404 must render custom 404 UI');
    console.log('✔ Non-existent story 404 passed');

    // 6. GET /category/:slug (Valid category)
    console.log('6. Testing GET /category/:slug (Valid category direct navigation / refresh)...');
    const catRes = await testRequest('/category/wife');
    assert.strictEqual(catRes.statusCode, 200, 'Valid category must return 200');
    assert(catRes.headers['content-type']?.includes('text/html'), 'Category must return text/html');
    assert(catRes.body.includes('canonical'), 'Category must contain canonical');
    console.log('✔ Valid category direct navigation passed');

    // 7. GET /categories
    console.log('7. Testing GET /categories (Directory direct navigation / refresh)...');
    const catsRes = await testRequest('/categories');
    assert.strictEqual(catsRes.statusCode, 200, 'Categories directory must return 200');
    assert(catsRes.body.includes('canonical'), 'Categories directory must contain canonical');
    console.log('✔ Categories directory direct navigation passed');

    // 8. GET /sitemap
    console.log('8. Testing GET /sitemap (HTML sitemap direct navigation / refresh)...');
    const sitemapHtmlRes = await testRequest('/sitemap');
    assert.strictEqual(sitemapHtmlRes.statusCode, 200, 'HTML sitemap must return 200');
    console.log('✔ HTML sitemap direct navigation passed');

    // 9. GET /sitemap.xml
    console.log('9. Testing GET /sitemap.xml...');
    const sitemapXmlRes = await testRequest('/sitemap.xml');
    assert.strictEqual(sitemapXmlRes.statusCode, 200, 'sitemap.xml must return 200');
    assert(sitemapXmlRes.headers['content-type']?.includes('xml'), 'sitemap.xml must return XML');
    console.log('✔ sitemap.xml passed');

    // 10. GET /feed.xml
    console.log('10. Testing GET /feed.xml...');
    const feedRes = await testRequest('/feed.xml');
    assert.strictEqual(feedRes.statusCode, 200, 'feed.xml must return 200');
    assert(feedRes.headers['content-type']?.includes('xml'), 'feed.xml must return XML');
    console.log('✔ feed.xml passed');

    // 11. GET /robots.txt
    console.log('11. Testing GET /robots.txt...');
    const robotsRes = await testRequest('/robots.txt');
    assert.strictEqual(robotsRes.statusCode, 200, 'robots.txt must return 200');
    assert(robotsRes.headers['content-type']?.includes('text/plain'), 'robots.txt must be text/plain');
    console.log('✔ robots.txt passed');

    // 12. GET /assets/:file
    console.log('12. Testing GET /assets/index-BDy0cJ-D.css...');
    const assetRes = await testRequest('/assets/index-BDy0cJ-D.css');
    assert.strictEqual(assetRes.statusCode, 200, 'Built CSS asset must return 200');
    assert(assetRes.headers['content-type']?.includes('text/css'), 'CSS asset must return text/css');
    console.log('✔ Built asset request passed');

    // 13. API endpoint GET /api/stories
    console.log('13. Testing GET /api/stories...');
    const apiStoriesRes = await testRequest('/api/stories');
    assert.strictEqual(apiStoriesRes.statusCode, 200, '/api/stories must return 200');
    assert(apiStoriesRes.headers['content-type']?.includes('application/json'), 'API must return JSON');
    const storiesData = JSON.parse(apiStoriesRes.body);
    const storiesList = Array.isArray(storiesData) ? storiesData : storiesData.data;
    assert(Array.isArray(storiesList) && storiesList.length > 0, 'Must return stories array');
    console.log(`✔ API /api/stories passed (${storiesList.length} stories returned)`);

    // 14. Vercel rewrite simulation (__vercel_url query parameter)
    console.log('14. Testing Vercel rewrite with __vercel_url query (/api/index?__vercel_url=/admin)...');
    const rewriteRes = await testRequest('/api/index?__vercel_url=/admin');
    assert.strictEqual(rewriteRes.statusCode, 200, 'Vercel rewritten URL must return 200');
    assert(rewriteRes.headers['content-type']?.includes('text/html'), 'Must return HTML for rewritten /admin');
    assert(rewriteRes.headers['x-robots-tag']?.includes('noindex'), 'Must retain /admin route headers');
    console.log('✔ Vercel rewrite simulation passed');

    // 15. Verify build/server.cjs is NOT exposed in dist/
    console.log('15. Verifying build/server.cjs is NOT exposed publicly in dist/...');
    const serverFileRes = await testRequest('/server.cjs');
    assert(!serverFileRes.body.includes('__toCommonJS') && !serverFileRes.body.includes('INITIAL_STORIES'), 'server.cjs source code must NOT be leaked');
    assert(!serverFileRes.headers['content-type']?.includes('javascript'), 'server.cjs must NOT be served as a JS file');
    console.log('✔ Private server bundle isolation verified (no source leakage)');

    console.log('\n======================================================');
    console.log('ALL VERCEL DIRECT-URL & ROUTING CHECKS PASSED (15/15)!');
    console.log('======================================================\n');

    server.close(() => process.exit(0));
  } catch (err) {
    server.close();
    console.error('Test error:', err);
    process.exit(1);
  }
}

runVercelRouteTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
