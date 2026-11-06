import fs from 'fs';
import path from 'path';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const baseUrl = 'https://www.walkathawa.site';
const publicDir = path.join(process.cwd(), 'public');
const cfgPath = path.join(process.cwd(), 'firebase-applet-config.json');

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
  console.log('[Sitemap] Generating live Firestore sitemaps for https://www.walkathawa.site ...');

  let stories = [];
  let categories = [];
  const seen = new Set();

  // 1. Fetch live stories directly from Firestore
  try {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    const app = getApps().length === 0 ? initializeApp(cfg) : getApp();
    const db = getFirestore(app);

    console.log(`[Sitemap] Fetching live stories from Firestore project ${cfg.projectId}...`);
    const snap = await getDocs(collection(db, 'stories'));
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const slug = (data.slug || docSnap.id || '').trim().toLowerCase();
      if (!slug || seen.has(slug)) return;
      seen.add(slug);
      stories.push({
        id: docSnap.id,
        title: data.title || 'Untitled',
        slug: data.slug || docSnap.id,
        category: data.category || 'all',
        coverImage: data.coverImage || '',
        uploadDate: data.uploadDate || data.uploadedDate || new Date().toISOString(),
        updatedDate: data.updatedDate || data.createdAt || new Date().toISOString(),
      });
    });
    console.log(`[Sitemap] Retrieved ${stories.length} stories directly from Firestore.`);

    // Also fetch categories from Firestore
    const catSnap = await getDocs(collection(db, 'categories'));
    catSnap.forEach((docSnap) => {
      const c = docSnap.data();
      if (c.slug && c.slug !== 'all') {
        categories.push({ id: docSnap.id, slug: c.slug, name: c.name || c.slug });
      }
    });
  } catch (err) {
    console.warn('[Sitemap] Firestore fetch error, checking local fallback:', err.message);
  }

  // Fallback default categories if empty
  if (categories.length === 0) {
    categories = [
      { id: 'romantic', slug: 'romantic', name: 'ආදර කතා' },
      { id: 'unconventional', slug: 'unconventional', name: 'අසම්මත කතා' },
      { id: 'short', slug: 'short', name: 'කෙටි කතා' },
      { id: 'suspense', slug: 'suspense', name: 'ත්‍රාසජනක' },
      { id: 'novel', slug: 'novel', name: 'දිගු කතා මාලා' },
    ];
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

  // Also write sitemaps to dist/ if dist/ exists
  const distDir = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), indexXml, 'utf8');
    fs.writeFileSync(path.join(distDir, 'sitemap-main.xml'), mainXml, 'utf8');
    fs.writeFileSync(path.join(distDir, 'sitemap-stories.xml'), storiesXml, 'utf8');
    fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsContent, 'utf8');
    console.log(`[Sitemap] Synced sitemaps and robots.txt to dist/ successfully.`);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('[Sitemap] Error generating sitemap:', err);
  process.exit(1);
});
