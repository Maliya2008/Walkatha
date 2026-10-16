import http from 'http';
import assert from 'node:assert';
import { app } from '../server.js'; // Note: will test via tsx

async function runTests() {
  console.log('--- Starting Comprehensive SEO & Indexing Verification ---');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const port = address.port;
  console.log(`Test server running on port ${port}`);

  function request(path: string, headers: Record<string, string> = {}): Promise<{
    statusCode: number;
    headers: http.IncomingHttpHeaders;
    body: string;
  }> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
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
    // 1. Apex redirect test
    console.log('Testing: Apex to www redirect...');
    const apexRes = await request('/story/test', { host: 'walkathawa.site' });
    assert.strictEqual(apexRes.statusCode, 301, 'Apex domain should 301 redirect');
    assert.strictEqual(
      apexRes.headers.location,
      'https://www.walkathawa.site/story/test',
      'Apex domain should redirect to canonical www URL'
    );
    console.log('✔ Apex redirect verified');

    // 2. HTTP to HTTPS redirect
    console.log('Testing: HTTP to HTTPS redirect...');
    const httpRes = await request('/category/all', {
      host: 'www.walkathawa.site',
      'x-forwarded-proto': 'http',
    });
    assert.strictEqual(httpRes.statusCode, 301, 'HTTP should 301 redirect to HTTPS');
    assert.strictEqual(
      httpRes.headers.location,
      'https://www.walkathawa.site/category/all',
      'HTTP should redirect to canonical HTTPS URL'
    );
    console.log('✔ HTTP to HTTPS redirect verified');

    // 3. Trailing slash normalization
    console.log('Testing: Trailing slash normalization...');
    const trailingRes = await request('/category/chithra-katha/');
    assert.strictEqual(trailingRes.statusCode, 301, 'Trailing slash should 301 redirect');
    assert.strictEqual(
      trailingRes.headers.location,
      'https://www.walkathawa.site/category/chithra-katha',
      'Trailing slash should redirect to stripped path'
    );
    console.log('✔ Trailing slash normalization verified');

    // 4. Double slash normalization
    console.log('Testing: Double slash normalization...');
    const doubleSlashRes = await request('//story/test');
    assert.strictEqual(doubleSlashRes.statusCode, 301, 'Double slash should 301 redirect');
    assert.strictEqual(
      doubleSlashRes.headers.location,
      'https://www.walkathawa.site/story/test',
      'Double slash should redirect to normalized URL'
    );
    console.log('✔ Double slash normalization verified');

    // 5. Robots.txt
    console.log('Testing: robots.txt...');
    const robotsRes = await request('/robots.txt');
    assert.strictEqual(robotsRes.statusCode, 200, 'robots.txt should return 200');
    assert(robotsRes.headers['content-type']?.includes('text/plain'), 'robots.txt must be text/plain');
    assert(robotsRes.body.includes('Sitemap: https://www.walkathawa.site/sitemap.xml'), 'Must reference sitemap index');
    assert(robotsRes.body.includes('Disallow: /admin'), 'Must disallow /admin');
    console.log('✔ robots.txt verified');

    // 6. Sitemap Index
    console.log('Testing: /sitemap.xml (sitemap index)...');
    const sitemapRes = await request('/sitemap.xml');
    assert.strictEqual(sitemapRes.statusCode, 200, 'sitemap.xml must return 200');
    assert(sitemapRes.headers['content-type']?.includes('xml'), 'sitemap.xml must be XML');
    assert(sitemapRes.body.includes('<sitemapindex'), 'sitemap.xml must contain sitemapindex root');
    assert(sitemapRes.body.includes('https://www.walkathawa.site/sitemap-main.xml'), 'Must reference sitemap-main.xml');
    assert(sitemapRes.body.includes('https://www.walkathawa.site/sitemap-stories.xml'), 'Must reference sitemap-stories.xml');
    console.log('✔ sitemap.xml verified');

    // 7. Sitemap Stories
    console.log('Testing: /sitemap-stories.xml...');
    const sitemapStoriesRes = await request('/sitemap-stories.xml');
    assert.strictEqual(sitemapStoriesRes.statusCode, 200, 'sitemap-stories.xml must return 200');
    assert(sitemapStoriesRes.headers['content-type']?.includes('xml'), 'sitemap-stories.xml must be XML');
    assert(sitemapStoriesRes.body.includes('<urlset'), 'Must contain urlset root');
    assert(sitemapStoriesRes.body.includes('<loc>https://www.walkathawa.site/story/'), 'Must contain story URLs');
    assert(sitemapStoriesRes.body.includes('<lastmod>'), 'Must contain lastmod');
    console.log('✔ sitemap-stories.xml verified');

    // 8. Story SSR 200 with complete metadata and JSON-LD
    console.log('Testing: Story SSR 200...');
    const testSlug = encodeURIComponent('දිනිතිගෙ-චැට්-එ-ක-1-sinhala-wala');
    const storyRes = await request(`/story/${testSlug}`);
    assert.strictEqual(storyRes.statusCode, 200, 'Story page must return 200');
    assert(storyRes.body.includes('<title>දිනිතිගෙ චැට් එ​ක'), 'Story page must include Sinhala title in <title>');
    assert(storyRes.body.includes('rel="canonical" href="https://www.walkathawa.site/story/'), 'Must have self-referencing canonical');
    assert(storyRes.body.includes('@type":"Article') || storyRes.body.includes('"@type": "Article'), 'Must have Article structured data');
    assert(storyRes.body.includes('BreadcrumbList'), 'Must have BreadcrumbList structured data');
    assert(!storyRes.body.includes('content="noindex'), 'Must NOT have noindex tag');
    assert(storyRes.body.includes('<h1'), 'Must have server-rendered H1 tag');
    console.log('✔ Story SSR verified');

    // 9. Non-existent story 404 (anti soft-404)
    console.log('Testing: Non-existent story 404...');
    const notFoundRes = await request('/story/this-story-does-not-exist-12345');
    assert.strictEqual(notFoundRes.statusCode, 404, 'Non-existent story must return HTTP 404');
    assert(notFoundRes.headers['x-robots-tag']?.includes('noindex'), '404 must have noindex header');
    assert(notFoundRes.body.includes('404'), 'Must render custom 404 content');
    console.log('✔ Non-existent story 404 verified');

    // 10. Admin route noindex
    console.log('Testing: Admin route noindex...');
    const adminRes = await request('/admin');
    assert(adminRes.headers['x-robots-tag']?.includes('noindex'), 'Admin page must have noindex in headers');
    console.log('✔ Admin route noindex verified');

    // 11. Feed endpoints
    console.log('Testing: /feed.xml and /atom.xml...');
    const feedRes = await request('/feed.xml');
    assert.strictEqual(feedRes.statusCode, 200, '/feed.xml must return 200');
    assert(feedRes.headers['content-type']?.includes('xml'), '/feed.xml must be XML');
    const atomRes = await request('/atom.xml');
    assert.strictEqual(atomRes.statusCode, 200, '/atom.xml must return 200');
    assert(atomRes.headers['content-type']?.includes('xml'), '/atom.xml must be XML');
    console.log('✔ RSS & Atom feeds verified');

    console.log('\n=========================================');
    console.log('ALL SEO AND INDEXING TESTS PASSED (11/11)');
    console.log('=========================================\n');
    server.close(() => {
      process.exit(0);
    });
  } catch (err) {
    server.close();
    throw err;
  }
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
