import fs from 'fs';
import path from 'path';

const baseUrl = 'https://www.walkathawa.site';
const publicDir = path.join(process.cwd(), 'public');
const dbPath = path.join(process.cwd(), 'data', 'database.json');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getValidIsoDate(dateVal, fallback) {
  if (!dateVal) return fallback || '2026-09-01T00:00:00.000Z';
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {}
  return fallback || '2026-09-01T00:00:00.000Z';
}

function getStoryDate(story) {
  return getValidIsoDate(story.updatedDate || story.uploadDate || story.createdAt);
}

function getLatestDate(storyList) {
  let latest = 0;
  for (const s of storyList) {
    const t = new Date(getStoryDate(s)).getTime();
    if (!isNaN(t) && t > latest) latest = t;
  }
  return latest > 0 ? new Date(latest).toISOString() : '2026-09-01T00:00:00.000Z';
}

async function run() {
  console.log('[Sitemap] Generating seamless Google sitemap for https://www.walkathawa.site ...');

  let stories = [];
  let categories = [];

  try {
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      const rawStories = (data.stories || []).filter((s) => s.published !== false);
      const seen = new Set();
      for (const s of rawStories) {
        const slug = (s.slug || s.id || '').trim().toLowerCase();
        if (!slug || seen.has(slug)) continue;
        seen.add(slug);
        stories.push(s);
      }
      categories = (data.categories || []).filter((c) => c.slug !== 'all');
    }
  } catch (err) {
    console.warn('[Sitemap] Could not read database.json, attempting fallback:', err);
  }

  const latestStoryMod = getLatestDate(stories);

  // 1. Generate Master Sitemap Index (public/sitemap.xml)
  let indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  indexXml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  indexXml += `  <sitemap>\n    <loc>${baseUrl}/sitemap-main.xml</loc>\n    <lastmod>${latestStoryMod}</lastmod>\n  </sitemap>\n`;
  indexXml += `  <sitemap>\n    <loc>${baseUrl}/sitemap-stories.xml</loc>\n    <lastmod>${latestStoryMod}</lastmod>\n  </sitemap>\n`;
  indexXml += `</sitemapindex>\n`;

  // 2. Generate Main Structural Pages (public/sitemap-main.xml)
  let mainXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  mainXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  mainXml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${latestStoryMod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  mainXml += `  <url>\n    <loc>${baseUrl}/categories</loc>\n    <lastmod>${latestStoryMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
  mainXml += `  <url>\n    <loc>${baseUrl}/sitemap</loc>\n    <lastmod>${latestStoryMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;

  for (const pagePath of ['/privacy', '/terms', '/dmca', '/about']) {
    mainXml += `  <url>\n    <loc>${baseUrl}${pagePath}</loc>\n    <lastmod>${latestStoryMod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
  }

  for (const cat of categories) {
    const catStories = stories.filter((s) => (s.category || '').toLowerCase().includes(cat.slug.toLowerCase()));
    const catMod = catStories.length > 0 ? getLatestDate(catStories) : latestStoryMod;
    mainXml += `  <url>\n    <loc>${baseUrl}/category/${encodeURIComponent(cat.slug)}</loc>\n    <lastmod>${catMod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
  }
  mainXml += `</urlset>\n`;

  // 3. Generate Dedicated Story Sitemap (public/sitemap-stories.xml)
  let storiesXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  storiesXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;
  for (const story of stories) {
    const storyUrl = `${baseUrl}/story/${encodeURIComponent(story.slug)}`;
    const lastMod = getStoryDate(story);
    storiesXml += `  <url>\n    <loc>${storyUrl}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n`;
    if (story.coverImage && story.coverImage.startsWith('http')) {
      storiesXml += `    <image:image>\n      <image:loc>${escapeXml(story.coverImage)}</image:loc>\n      <image:title>${escapeXml(story.title)}</image:title>\n    </image:image>\n`;
    }
    storiesXml += `  </url>\n`;
  }
  storiesXml += `</urlset>\n`;

  // Write static sitemaps to public/
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), indexXml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-main.xml'), mainXml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-stories.xml'), storiesXml, 'utf8');
  console.log(`[Sitemap] Generated sitemap index and sub-sitemaps successfully with ${stories.length} stories.`);

  // Write robots.txt
  const robotsContent = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-stories.xml
Sitemap: ${baseUrl}/sitemap-main.xml
`;
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsContent, 'utf8');
  console.log(`[Sitemap] Generated robots.txt successfully.`);
}

run().catch((err) => {
  console.error('[Sitemap] Error generating sitemap:', err);
});
