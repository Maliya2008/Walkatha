import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const baseUrl = 'https://www.walkathawa.site';
const publicDir = path.join(process.cwd(), 'public');

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
  return latest > 0 ? new Date(latest).toISOString() : new Date().toISOString();
}

function isDeleted(data) {
  if (!data) return false;
  return Boolean(data.isDeleted === true || data.deleted === true || data.published === false);
}

async function run() {
  console.log('[Sitemap] Generating live Firestore sitemaps & robots.txt for https://www.walkathawa.site ...');

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
        const rawSlug = String(data.slug || docSnap.id || '').trim();
        const key = rawSlug.toLowerCase();
        if (!key) return;

        if (isDeleted(data)) {
          deletedSlugs.add(key);
          deletedSlugs.add(docSnap.id.toLowerCase());
          storiesMap.delete(key);
          return;
        }
        if (deletedSlugs.has(key) || deletedSlugs.has(docSnap.id.toLowerCase())) {
          return;
        }

        const prev = storiesMap.get(key);
        storiesMap.set(key, {
          id: docSnap.id,
          title: data.title || prev?.title || 'සිංහල වැල කතා',
          slug: rawSlug,
          category: data.category || prev?.category || 'romantic',
          coverImage: data.coverImage || prev?.coverImage || '',
          uploadDate:
            data.uploadDate || data.uploadedDate || prev?.uploadDate || '2026-09-01T00:00:00.000Z',
          updatedDate:
            data.updatedDate || data.uploadDate || prev?.updatedDate || '2026-09-01T00:00:00.000Z',
        });
      });
    } catch (err) {
      console.warn('[Sitemap] Story fetch notice:', err.message);
    }

    try {
      const catSnap = await getDocs(collection(dbInstance, 'categories'));
      catSnap.forEach((docSnap) => {
        const c = docSnap.data();
        const slug = String(c.slug || docSnap.id || '').trim();
        if (!slug || slug === 'all') return;
        const lower = slug.toLowerCase();

        if (isDeleted(c)) {
          deletedCats.add(lower);
          categoriesMap.delete(slug);
          return;
        }
        if (deletedCats.has(lower)) return;

        categoriesMap.set(slug, {
          id: docSnap.id,
          slug,
          name: c.sinhalaName || c.name || slug,
        });
      });
    } catch (err) {
      console.warn('[Sitemap] Category fetch notice:', err.message);
    }
  }

  const stories = Array.from(storiesMap.values()).sort(
    (a, b) => new Date(getStoryDate(b)).getTime() - new Date(getStoryDate(a)).getTime()
  );
  const categories = Array.from(categoriesMap.values());
  const latestStoryMod = getLatestDate(stories);

  console.log(`[Sitemap] Synced ${stories.length} active stories and ${categories.length} categories from Firestore.`);

  // 1. Generate Master Sitemap Index (public/sitemap.xml & public/sitmap.xml)
  let indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  indexXml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  indexXml += `  <sitemap>\n    <loc>${baseUrl}/sitemap-main.xml</loc>\n    <lastmod>${latestStoryMod}</lastmod>\n  </sitemap>\n`;
  indexXml += `  <sitemap>\n    <loc>${baseUrl}/sitemap-stories.xml</loc>\n    <lastmod>${latestStoryMod}</lastmod>\n  </sitemap>\n`;
  indexXml += `</sitemapindex>\n`;

  // 2. Generate Main Structural Pages & Categories Sitemap (public/sitemap-main.xml)
  let mainXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  mainXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  mainXml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${latestStoryMod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  mainXml += `  <url>\n    <loc>${baseUrl}/categories</loc>\n    <lastmod>${latestStoryMod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;

  for (const pagePath of ['/about', '/privacy', '/terms', '/contact']) {
    mainXml += `  <url>\n    <loc>${baseUrl}${pagePath}</loc>\n    <lastmod>${latestStoryMod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
  }

  for (const cat of categories) {
    const catStories = stories.filter((s) =>
      String(s.category || '').toLowerCase().includes(String(cat.slug || '').toLowerCase())
    );
    const catMod = catStories.length > 0 ? getLatestDate(catStories) : latestStoryMod;
    mainXml += `  <url>\n    <loc>${baseUrl}/category/${encodeURIComponent(cat.slug)}</loc>\n    <lastmod>${catMod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
  }
  mainXml += `</urlset>\n`;

  // 3. Generate Dedicated Story Sitemap with Google Image Tags (public/sitemap-stories.xml)
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

  // 4. Generate SEO-optimized robots.txt
  const robotsContent = `User-agent: *
Allow: /
Allow: /story/
Allow: /category/
Allow: /categories
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
Sitemap: ${baseUrl}/sitemap-main.xml
Sitemap: ${baseUrl}/sitemap-stories.xml
`;

  // Write to public/
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), indexXml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitmap.xml'), indexXml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-main.xml'), mainXml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-stories.xml'), storiesXml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsContent, 'utf8');

  // Also sync to dist/ if present
  const distDir = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), indexXml, 'utf8');
    fs.writeFileSync(path.join(distDir, 'sitmap.xml'), indexXml, 'utf8');
    fs.writeFileSync(path.join(distDir, 'sitemap-main.xml'), mainXml, 'utf8');
    fs.writeFileSync(path.join(distDir, 'sitemap-stories.xml'), storiesXml, 'utf8');
    fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsContent, 'utf8');
  }

  console.log('[Sitemap] Successfully wrote sitemap.xml, sitmap.xml, sitemap-main.xml, sitemap-stories.xml, and robots.txt.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[Sitemap] Error generating sitemap:', err);
  process.exit(1);
});
