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

async function run() {
  console.log('[Sitemap] Generating seamless Google sitemap for https://www.walkathawa.site ...');

  let stories = [];
  let categories = [];

  try {
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      stories = (data.stories || []).filter((s) => s.published !== false);
      categories = (data.categories || []).filter((c) => c.slug !== 'all');
    }
  } catch (err) {
    console.warn('[Sitemap] Could not read database.json, attempting fallback:', err);
  }

  const nowIso = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // 1. Homepage
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/</loc>\n`;
  xml += `    <lastmod>${nowIso}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // 2. Sitemap / Archives Page
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/sitemap</loc>\n`;
  xml += `    <lastmod>${nowIso}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>0.8</priority>\n`;
  xml += `  </url>\n`;

  // 3. Category Pages
  for (const cat of categories) {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/category/${encodeURIComponent(cat.slug)}</loc>\n`;
    xml += `    <lastmod>${nowIso}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.85</priority>\n`;
    xml += `  </url>\n`;
  }

  // 4. All Story Pages
  for (const story of stories) {
    const storyUrl = `${baseUrl}/story/${encodeURIComponent(story.slug)}`;
    const lastMod = story.updatedDate || story.uploadDate || nowIso;

    xml += `  <url>\n`;
    xml += `    <loc>${storyUrl}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;

    if (story.coverImage && story.coverImage.startsWith('http')) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(story.coverImage)}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(story.title)}</image:title>\n`;
      xml += `    </image:image>\n`;
    }

    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;

  // Write to public/sitemap.xml
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log(`[Sitemap] Generated ${sitemapPath} successfully with ${stories.length} stories.`);

  // Write dedicated stories sitemap public/sitemap-stories.xml
  let storiesXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  storiesXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;
  for (const story of stories) {
    const storyUrl = `${baseUrl}/story/${encodeURIComponent(story.slug)}`;
    const lastMod = story.updatedDate || story.uploadDate || nowIso;
    storiesXml += `  <url>\n    <loc>${storyUrl}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n`;
    if (story.coverImage && story.coverImage.startsWith('http')) {
      storiesXml += `    <image:image>\n      <image:loc>${escapeXml(story.coverImage)}</image:loc>\n      <image:title>${escapeXml(story.title)}</image:title>\n    </image:image>\n`;
    }
    storiesXml += `  </url>\n`;
  }
  storiesXml += `</urlset>\n`;
  const storiesSitemapPath = path.join(publicDir, 'sitemap-stories.xml');
  fs.writeFileSync(storiesSitemapPath, storiesXml, 'utf8');
  console.log(`[Sitemap] Generated ${storiesSitemapPath} successfully.`);

  // Write clean robots.txt
  const robotsContent = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-stories.xml
`;
  const robotsPath = path.join(publicDir, 'robots.txt');
  fs.writeFileSync(robotsPath, robotsContent, 'utf8');
  console.log(`[Sitemap] Generated ${robotsPath} successfully.`);
}

run().catch((err) => {
  console.error('[Sitemap] Error generating sitemap:', err);
});
