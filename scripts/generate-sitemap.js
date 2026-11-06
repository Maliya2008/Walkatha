import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const baseUrl = 'https://www.walkathawa.site';
const publicDir = path.join(process.cwd(), 'public');
const syncFilePath = path.join(process.cwd(), 'server-data', 'firestore-sync.json');

const primaryConfig = {
  apiKey: 'AIzaSyDWIC_GSMIOliCrhHKPgZgNUAZKUZ96nh4',
  authDomain: 'walkathawa-93f80.firebaseapp.com',
  projectId: 'walkathawa-93f80',
  storageBucket: 'walkathawa-93f80.firebasestorage.app',
  messagingSenderId: '575596307575',
  appId: '1:575596307575:web:daf2ef013ba17b53745272',
};

const contentReplicaConfig = {
  projectId: 'advance-sandbox-gmzf6',
  appId: '1:448261670736:web:b9c2a2ffea58dfe8ce0e55',
  apiKey: 'AIzaSyC52g5zyvwkpuqYuP2SlW9yqU50KXxm3DE',
  authDomain: 'advance-sandbox-gmzf6.firebaseapp.com',
  storageBucket: 'advance-sandbox-gmzf6.firebasestorage.app',
  messagingSenderId: '448261670736',
};

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

function stripZeroWidth(str) {
  if (!str) return '';
  return String(str).replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

function escapeXml(str) {
  if (!str) return '';
  return stripZeroWidth(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatW3CDate(dateVal) {
  const fallback = '2025-05-01';
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      const iso = d.toISOString().split('T')[0];
      if (iso > '2025-05-15') return '2025-05-15';
      return iso;
    }
  } catch {}
  return fallback;
}

function isDeleted(data) {
  if (!data) return false;
  return Boolean(data.isDeleted === true || data.deleted === true || data.published === false);
}

async function run() {
  console.log('[Sitemap] Generating complete flat sitemap.xml & robots.txt for https://www.walkathawa.site ...');

  const storiesMap = new Map();
  const deletedSlugs = new Set();
  const categoriesMap = new Map();
  const deletedCats = new Set();

  const defaultCats = [
    { id: 'wife', slug: 'wife', name: 'වයිෆ් / බිරිඳ (Wife Stories)' },
    { id: 'akka-malli', slug: 'akka-malli', name: 'අක්කා - මල්ලි (Akka Malli)' },
    { id: 'nanda', slug: 'nanda', name: 'නැන්දා / ඇන්ටි (Aunty Stories)' },
    { id: 'school', slug: 'school', name: 'පාසල් සහ කැම්පස් (School & Campus)' },
    { id: 'romantic', slug: 'romantic', name: 'ආදර කතා (Romantic Stories)' },
  ];
  for (const c of defaultCats) {
    categoriesMap.set(c.slug, c);
  }

  // 1. Load from server-data/firestore-sync.json first
  if (fs.existsSync(syncFilePath)) {
    try {
      const syncData = JSON.parse(fs.readFileSync(syncFilePath, 'utf8'));
      const syncStories = Array.isArray(syncData.stories) ? syncData.stories : [];
      const syncCats = Array.isArray(syncData.categories) ? syncData.categories : [];

      for (const s of syncStories) {
        const rawSlug = stripZeroWidth(s.slug || s.id || '');
        const key = rawSlug.toLowerCase();
        if (!key) continue;
        if (isDeleted(s)) {
          deletedSlugs.add(key);
          continue;
        }
        storiesMap.set(key, {
          id: s.id || rawSlug,
          title: stripZeroWidth(s.title || 'සිංහල වැල කතා'),
          slug: rawSlug,
          category: stripZeroWidth(s.category || 'romantic'),
          coverImage: stripZeroWidth(s.coverImage || ''),
          uploadDate: s.uploadDate || s.uploadedDate || '2025-05-01',
          updatedDate: s.updatedDate || s.uploadDate || '2025-05-01',
        });
      }

      for (const c of syncCats) {
        const slug = stripZeroWidth(c.slug || c.id || '');
        if (!slug || slug === 'all') continue;
        if (isDeleted(c)) {
          deletedCats.add(slug.toLowerCase());
          categoriesMap.delete(slug);
          continue;
        }
        categoriesMap.set(slug, {
          id: c.id || slug,
          slug,
          name: stripZeroWidth(c.sinhalaName || c.name || slug),
        });
      }
    } catch (err) {
      console.warn('[Sitemap] Sync file read notice:', err.message);
    }
  }

  // 2. Also merge live Firestore if sync store was empty
  if (storiesMap.size === 0) {
    const primaryApp = getApps().some((a) => a.name === 'sitemap-primary')
      ? getApp('sitemap-primary')
      : initializeApp(primaryConfig, 'sitemap-primary');
    const replicaApp = getApps().some((a) => a.name === 'sitemap-replica')
      ? getApp('sitemap-replica')
      : initializeApp(contentReplicaConfig, 'sitemap-replica');

    const primaryDb = getFirestore(primaryApp);
    const replicaDb = getFirestore(
      replicaApp,
      'ai-studio-walkatha-f5f7438d-1626-498d-ab41-6bcb7c299cae'
    );

    for (const dbInstance of [primaryDb, replicaDb]) {
      try {
        const snap = await getDocs(collection(dbInstance, 'stories'));
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const rawSlug = stripZeroWidth(data.slug || docSnap.id || '');
          const key = rawSlug.toLowerCase();
          if (!key) return;

          if (isDeleted(data)) {
            deletedSlugs.add(key);
            storiesMap.delete(key);
            return;
          }
          if (deletedSlugs.has(key)) return;

          storiesMap.set(key, {
            id: docSnap.id,
            title: stripZeroWidth(data.title || 'සිංහල වැල කතා'),
            slug: rawSlug,
            category: stripZeroWidth(data.category || 'romantic'),
            coverImage: stripZeroWidth(data.coverImage || ''),
            uploadDate: data.uploadDate || '2025-05-01',
            updatedDate: data.updatedDate || '2025-05-01',
          });
        });
      } catch {}
    }
  }

  const stories = Array.from(storiesMap.values());
  const categories = Array.from(categoriesMap.values());
  const todayMod = '2025-05-15';

  // Build Main URLs XML entries
  let mainEntries = '';
  mainEntries += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${todayMod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  mainEntries += `  <url>\n    <loc>${baseUrl}/categories</loc>\n    <lastmod>${todayMod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
  mainEntries += `  <url>\n    <loc>${baseUrl}/sitemap</loc>\n    <lastmod>${todayMod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;

  for (const pagePath of ['/about', '/privacy', '/terms', '/contact']) {
    mainEntries += `  <url>\n    <loc>${baseUrl}${pagePath}</loc>\n    <lastmod>${todayMod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
  }

  for (const cat of categories) {
    mainEntries += `  <url>\n    <loc>${baseUrl}/category/${encodeURIComponent(cat.slug)}</loc>\n    <lastmod>${todayMod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
  }

  // Build Story URLs XML entries
  let storyEntries = '';
  for (const story of stories) {
    const cleanSlug = stripZeroWidth(story.slug);
    const storyUrl = `${baseUrl}/story/${encodeURIComponent(cleanSlug)}`;
    const lastMod = formatW3CDate(story.updatedDate || story.uploadDate);
    storyEntries += `  <url>\n    <loc>${escapeXml(storyUrl)}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n`;
    if (story.coverImage && story.coverImage.startsWith('http')) {
      storyEntries += `    <image:image>\n      <image:loc>${escapeXml(story.coverImage)}</image:loc>\n      <image:title>${escapeXml(story.title)}</image:title>\n    </image:image>\n`;
    }
    storyEntries += `  </url>\n`;
  }

  // 1. Primary Flat Sitemap (public/sitemap.xml & public/sitmap.xml) containing ALL 626+ URLs directly!
  let fullUrlsetXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  fullUrlsetXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;
  fullUrlsetXml += mainEntries;
  fullUrlsetXml += storyEntries;
  fullUrlsetXml += `</urlset>\n`;

  // 2. Sub-sitemaps (sitemap-main.xml, sitemap-stories.xml, sitemap_index.xml)
  const mainXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${mainEntries}</urlset>\n`;
  const storiesXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${storyEntries}</urlset>\n`;
  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap>\n    <loc>${baseUrl}/sitemap-main.xml</loc>\n    <lastmod>${todayMod}</lastmod>\n  </sitemap>\n  <sitemap>\n    <loc>${baseUrl}/sitemap-stories.xml</loc>\n    <lastmod>${todayMod}</lastmod>\n  </sitemap>\n</sitemapindex>\n`;

  // 3. SEO-optimized robots.txt
  const robotsContent = `User-agent: *
Allow: /
Allow: /story/
Allow: /category/
Allow: /categories
Allow: /sitemap
Disallow: /admin
Disallow: /api/

User-agent: Googlebot
Allow: /
Disallow: /admin
Disallow: /api/

User-agent: Googlebot-Image
Allow: /

Host: ${baseUrl}
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-stories.xml
Sitemap: ${baseUrl}/sitemap-main.xml
`;

  // Write to public/
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), fullUrlsetXml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitmap.xml'), fullUrlsetXml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap_index.xml'), indexXml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-main.xml'), mainXml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-stories.xml'), storiesXml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsContent, 'utf8');

  // Sync to dist/ if present
  const distDir = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), fullUrlsetXml, 'utf8');
    fs.writeFileSync(path.join(distDir, 'sitmap.xml'), fullUrlsetXml, 'utf8');
    fs.writeFileSync(path.join(distDir, 'sitemap_index.xml'), indexXml, 'utf8');
    fs.writeFileSync(path.join(distDir, 'sitemap-main.xml'), mainXml, 'utf8');
    fs.writeFileSync(path.join(distDir, 'sitemap-stories.xml'), storiesXml, 'utf8');
    fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsContent, 'utf8');
  }

  // 4. Inject static crawlable SEO directory into index.html so external sitemap crawlers (xml-sitemaps.com, etc.) discover all 625+ URLs on the very first crawl
  const indexHtmlPath = path.join(process.cwd(), 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    let html = fs.readFileSync(indexHtmlPath, 'utf8');
    const catLinks = categories
      .map((c) => `<a href="/category/${encodeURIComponent(c.slug)}">${escapeXml(c.name)}</a>`)
      .join(' ');
    const storyLinks = stories
      .map((s) => `<a href="/story/${encodeURIComponent(stripZeroWidth(s.slug))}">${escapeXml(s.title)}</a>`)
      .join(' ');
    const seoNavBlock = `<!-- SEO_DIRECTORY_START --><nav aria-label="Full Site Story Directory" class="sr-only"><a href="/">මුල් පිටුව</a> <a href="/categories">වර්ගීකරණ</a> <a href="/sitemap">Sitemap</a> <a href="/about">අප ගැන</a> <a href="/privacy">පෞද්ගලිකත්ව ප්‍රතිපත්තිය</a> <a href="/terms">කොන්දේසි</a> <a href="/contact">සම්බන්ධ වන්න</a> ${catLinks} ${storyLinks}</nav><!-- SEO_DIRECTORY_END -->`;

    if (html.includes('<!-- SEO_DIRECTORY_START -->')) {
      html = html.replace(/<!-- SEO_DIRECTORY_START -->[\s\S]*?<!-- SEO_DIRECTORY_END -->/, seoNavBlock);
    } else {
      html = html.replace('<div id="root"></div>', `<div id="root"></div>\n    ${seoNavBlock}`);
    }
    fs.writeFileSync(indexHtmlPath, html, 'utf8');
  }

  const totalUrls = (fullUrlsetXml.match(/<url>/g) || []).length;
  console.log(`[Sitemap] Successfully generated flat sitemap.xml with ${totalUrls} direct <url> entries (${stories.length} stories + ${categories.length} categories + static pages) and injected SEO crawl directory.`);
  process.exit(0);
}

run().catch((err) => {
  console.error('[Sitemap] Error generating sitemap:', err);
  process.exit(1);
});
