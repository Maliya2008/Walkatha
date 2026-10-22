import http from 'http';
import assert from 'node:assert';
import handler, { app } from '../api/index';

async function runVercelRouteTests() {
  console.log('=== VERIFYING VERCEL ENTRY POINT, DIRECT URLS, REFRESHES & SEO ===\n');

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
    assert(homeRes.body.includes('/assets/'), 'Homepage MUST contain bundled /assets/ script and CSS links');
    console.log('✔ Homepage direct navigation passed (with assets)');

    // 2. GET /admin (Admin root)
    console.log('2. Testing GET /admin (Admin panel direct navigation / refresh)...');
    const adminRes = await testRequest('/admin');
    assert.strictEqual(adminRes.statusCode, 200, 'Admin page must return 200');
    assert(adminRes.headers['content-type']?.includes('text/html'), 'Admin page must return text/html');
    assert(adminRes.headers['x-robots-tag']?.includes('noindex'), 'Admin page must have noindex');
    assert(adminRes.body.includes('<div id="root">'), 'Admin page must contain SPA root');
    assert(adminRes.body.includes('/assets/'), 'Admin page MUST contain bundled React JS and CSS assets');
    console.log('✔ Admin page direct navigation passed (with full React assets)');

    // 3. GET /admin/dashboard
    console.log('3. Testing GET /admin/dashboard (Admin subroute direct navigation / refresh)...');
    const adminDashRes = await testRequest('/admin/dashboard');
    assert.strictEqual(adminDashRes.statusCode, 200, 'Admin dashboard must return 200');
    assert(adminDashRes.body.includes('/assets/'), 'Admin dashboard must contain React assets');
    console.log('✔ Admin dashboard direct navigation passed');

    // 4. GET /admin/stories
    console.log('4. Testing GET /admin/stories...');
    const adminStoriesRes = await testRequest('/admin/stories');
    assert.strictEqual(adminStoriesRes.statusCode, 200, 'Admin stories must return 200');
    assert(adminStoriesRes.body.includes('/assets/'), 'Admin stories must contain React assets');
    console.log('✔ Admin stories direct navigation passed');

    // 5. GET /admin/categories
    console.log('5. Testing GET /admin/categories...');
    const adminCatsRes = await testRequest('/admin/categories');
    assert.strictEqual(adminCatsRes.statusCode, 200, 'Admin categories must return 200');
    assert(adminCatsRes.body.includes('/assets/'), 'Admin categories must contain React assets');
    console.log('✔ Admin categories direct navigation passed');

    // 6. GET /admin/advertisements
    console.log('6. Testing GET /admin/advertisements...');
    const adminAdsRes = await testRequest('/admin/advertisements');
    assert.strictEqual(adminAdsRes.statusCode, 200, 'Admin advertisements must return 200');
    assert(adminAdsRes.body.includes('/assets/'), 'Admin advertisements must contain React assets');
    console.log('✔ Admin advertisements direct navigation passed');

    // 7. GET /search
    console.log('7. Testing GET /search (Search page direct navigation / refresh)...');
    const searchRes = await testRequest('/search');
    assert.strictEqual(searchRes.statusCode, 200, 'Search page must return 200');
    assert(searchRes.body.includes('/assets/'), 'Search page must contain React assets');
    console.log('✔ Search page direct navigation passed');

    // 8. GET /story/:slug with percent-encoded Sinhala slug
    console.log('8. Testing GET /story/:slug (Encoded Sinhala slug)...');
    const encodedSlug = encodeURIComponent('දිනිතිගෙ-චැට්-එ-ක-1-sinhala-wala');
    const storyRes = await testRequest(`/story/${encodedSlug}`);
    assert.strictEqual(storyRes.statusCode, 200, 'Existing story must return 200');
    assert(storyRes.headers['content-type']?.includes('text/html'), 'Story page must return text/html');
    assert(storyRes.body.includes('<h1'), 'Story page must contain server-rendered H1');
    assert(storyRes.body.includes('canonical'), 'Story page must contain canonical tag');
    assert(storyRes.body.includes('/assets/'), 'Story page must contain React assets');
    console.log('✔ Encoded story page direct navigation passed (with SEO & assets)');

    // 9. Vercel rewrite with raw Sinhala slug in query parameter (?__vercel_url=/story/...)
    console.log('9. Testing Vercel rewrite with Sinhala characters (?__vercel_url=/story/දිනිතිගෙ...)...');
    const rewriteSinhalaRes = await testRequest(`/api/index?__vercel_url=${encodeURIComponent('/story/දිනිතිගෙ-චැට්-එ-ක-1-sinhala-wala')}`);
    assert.strictEqual(rewriteSinhalaRes.statusCode, 200, 'Vercel rewrite with Sinhala characters must return 200');
    assert(rewriteSinhalaRes.body.includes('<h1'), 'Rewritten story must contain server-rendered H1');
    assert(rewriteSinhalaRes.body.includes('/assets/'), 'Rewritten story must contain React assets');
    console.log('✔ Vercel rewrite with Sinhala characters passed without ERR_UNESCAPED_CHARACTERS');

    // 10. GET /story/:slug (Non-existent story 404)
    console.log('10. Testing GET /story/:slug (Non-existent story 404)...');
    const notFoundStoryRes = await testRequest('/story/completely-non-existent-story-999');
    assert.strictEqual(notFoundStoryRes.statusCode, 404, 'Non-existent story must return 404');
    assert(notFoundStoryRes.headers['x-robots-tag']?.includes('noindex'), '404 must have noindex');
    assert(notFoundStoryRes.body.includes('404'), '404 must render custom 404 UI');
    assert(notFoundStoryRes.body.includes('/assets/'), '404 page must contain React assets so client can navigate');
    console.log('✔ Non-existent story 404 passed (with React assets)');

    // 11. GET /category/:slug
    console.log('11. Testing GET /category/wife (Category direct navigation / refresh)...');
    const catRes = await testRequest('/category/wife');
    assert.strictEqual(catRes.statusCode, 200, 'Valid category must return 200');
    assert(catRes.headers['content-type']?.includes('text/html'), 'Category must return text/html');
    assert(catRes.body.includes('canonical'), 'Category must contain canonical');
    assert(catRes.body.includes('/assets/'), 'Category must contain React assets');
    console.log('✔ Valid category direct navigation passed');

    // 12. GET /categories
    console.log('12. Testing GET /categories (Directory direct navigation / refresh)...');
    const catsRes = await testRequest('/categories');
    assert.strictEqual(catsRes.statusCode, 200, 'Categories directory must return 200');
    assert(catsRes.body.includes('canonical'), 'Categories directory must contain canonical');
    assert(catsRes.body.includes('/assets/'), 'Categories directory must contain React assets');
    console.log('✔ Categories directory direct navigation passed');

    // 13. Sitemaps, Feeds, and robots.txt
    console.log('13. Testing /sitemap.xml, /feed.xml, /robots.txt...');
    const sitemapXmlRes = await testRequest('/sitemap.xml');
    assert.strictEqual(sitemapXmlRes.statusCode, 200, 'sitemap.xml must return 200');
    assert(sitemapXmlRes.headers['content-type']?.includes('xml'), 'sitemap.xml must return XML');

    const feedRes = await testRequest('/feed.xml');
    assert.strictEqual(feedRes.statusCode, 200, 'feed.xml must return 200');
    assert(feedRes.headers['content-type']?.includes('xml'), 'feed.xml must return XML');

    const robotsRes = await testRequest('/robots.txt');
    assert.strictEqual(robotsRes.statusCode, 200, 'robots.txt must return 200');
    assert(robotsRes.headers['content-type']?.includes('text/plain'), 'robots.txt must be text/plain');
    console.log('✔ Sitemaps, feeds, and robots.txt passed');

    // 14. API endpoint /api/stories
    console.log('14. Testing API /api/stories...');
    const apiStoriesRes = await testRequest('/api/stories');
    assert.strictEqual(apiStoriesRes.statusCode, 200, '/api/stories must return 200');
    const storiesData = JSON.parse(apiStoriesRes.body);
    const storiesList = Array.isArray(storiesData) ? storiesData : storiesData.data;
    assert(Array.isArray(storiesList) && storiesList.length > 0, 'Must return stories array');
    console.log(`✔ API /api/stories passed (${storiesList.length} stories returned)`);

    // 15. Verify private server bundle isolation
    console.log('15. Verifying build/server.cjs is NOT exposed publicly in dist/...');
    const serverFileRes = await testRequest('/server.cjs');
    assert(!serverFileRes.body.includes('__toCommonJS') && !serverFileRes.body.includes('INITIAL_STORIES'), 'server.cjs source code must NOT be leaked');
    assert(!serverFileRes.headers['content-type']?.includes('javascript'), 'server.cjs must NOT be served as a JS file');
    console.log('✔ Private server bundle isolation verified (no source leakage)');

    console.log('\n========================================================================');
    console.log('ALL PRODUCTION DIRECT-URL, REFRESH, ADMIN & SEO CHECKS PASSED (15/15)!');
    console.log('========================================================================\n');

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
