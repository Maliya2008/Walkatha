import fs from 'fs';
import path from 'path';

const baseUrl = 'https://www.walkathawa.site';
const publicDir = path.join(process.cwd(), 'public');
const dbPath = path.join(process.cwd(), 'data', 'database.json');
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Remove any legacy /sitemap file if it exists to prevent collision with 301 redirect
const legacySitemapPath = path.join(publicDir, 'sitemap');
if (fs.existsSync(legacySitemapPath)) {
  try {
    fs.unlinkSync(legacySitemapPath);
  } catch {
    // ignore
  }
}

const BANNED_MOCK_PATTERNS = [
  'rahas-hamuwima',
  'nil-diyawara',
  'madhyama-rathriye',
  'tharu-piri',
  'nodutu-sihinaya',
  'wasi-bindu',
  'the-secret-in-moonlight',
  'story-the-secret-in-moonlight',
  'සඳ එළියේ රහස',
  'රහස් හමුවීම',
  'නිල් දියවර',
  'මධ්‍යම රාත්‍රියේ',
  'තරු පිරි අහස',
  'නොදුටු සිහිනය',
  'වැසි බිඳු අතරින්',
  'නිස්කලංක රාත්‍රියක හමුවූ අමුතු ආගන්තුකයා',
];

function isMockStory(s) {
  if (!s) return false;
  const id = String(s.id || '').toLowerCase();
  const slug = String(s.slug || '').toLowerCase();
  const title = String(s.title || '').toLowerCase();
  return BANNED_MOCK_PATTERNS.some(
    (p) => id.includes(p) || slug.includes(p) || title.includes(p)
  );
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

function parseValidIsoDate(val) {
  if (!val) return null;
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch {
    // ignore
  }
  return null;
}

// Canonical categories definition
const categories = [
  { slug: 'wife', name: 'වයිෆ් / බිරිඳ (Wife Stories)' },
  { slug: 'school', name: 'පාසල් කතා (School Stories)' },
  { slug: 'akka-malli', name: 'අක්කා - මල්ලි (Akka Malli)' },
  { slug: 'romantic', name: 'ආදර කතා (Romantic Stories)' },
];

function normalizeCategory(raw) {
  if (!raw) return 'wife';
  const clean = String(raw).toLowerCase().trim();
  if (clean.includes('වයිෆ්') || clean.includes('බිරිඳ') || clean.includes('wife')) return 'wife';
  if (clean.includes('පාසල්') || clean.includes('school')) return 'school';
  if (clean.includes('අක්කා') || clean.includes('මල්ලි') || clean.includes('akka')) return 'akka-malli';
  if (clean.includes('ආදර') || clean.includes('romantic') || clean.includes('love')) return 'romantic';
  return 'wife';
}

function formatCanonicalStoryUrl(slug) {
  let cleanSlug = slug;
  try {
    cleanSlug = decodeURI(slug);
  } catch {
    cleanSlug = slug;
  }
  return `${baseUrl}/story/${encodeURI(cleanSlug)}`;
}

async function loadAllPublishedStories() {
  const storiesMap = new Map();

  // 1. First seed with local database.json (if available)
  if (fs.existsSync(dbPath)) {
    try {
      const raw = fs.readFileSync(dbPath, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.stories)) {
        for (const s of data.stories) {
          if (s && s.slug && s.published !== false && !isMockStory(s)) {
            storiesMap.set(s.slug, {
              id: s.id || s.slug,
              slug: s.slug,
              title: s.title || '',
              category: normalizeCategory(s.category),
              published: true,
              coverImage: s.coverImage || '',
              updatedDate: parseValidIsoDate(s.updatedDate) || parseValidIsoDate(s.uploadDate) || parseValidIsoDate(s.uploadedDate),
            });
          }
        }
      }
    } catch (err) {
      console.warn('[Sitemap Generator] Notice: local database.json read warning:', err.message);
    }
  }

  // 2. Fetch live data from Firestore as source of truth with full pagination
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config?.projectId && config?.firestoreDatabaseId && config?.apiKey) {
        let pageToken = '';
        let pageCount = 0;
        const maxPages = 50;
        do {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const pageParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
          const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/stories?key=${config.apiKey}&pageSize=100${pageParam}`;

          const resp = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!resp.ok) {
            console.warn(`[Sitemap Generator] Firestore HTTP ${resp.status}: fallback to local db`);
            break;
          }

          const data = await resp.json();
          if (data.documents && Array.isArray(data.documents)) {
            for (const doc of data.documents) {
              const fields = doc.fields || {};
              const slug = fields.slug?.stringValue;
              const title = fields.title?.stringValue || '';
              const id = doc.name.split('/').pop() || slug || '';
              const published = fields.published?.booleanValue !== false;

              if (!slug || !published || isMockStory({ id, slug, title })) {
                continue;
              }

              const coverImage = fields.coverImage?.stringValue || '';
              const rawCategory = fields.category?.stringValue || fields.categoryName?.stringValue || '';
              const category = normalizeCategory(rawCategory);
              const rawDate =
                fields.updatedDate?.stringValue ||
                fields.uploadDate?.stringValue ||
                fields.uploadedDate?.stringValue ||
                doc.updateTime ||
                doc.createTime;
              const updatedDate = parseValidIsoDate(rawDate);

              storiesMap.set(slug, {
                id,
                slug,
                title,
                category,
                published: true,
                coverImage,
                updatedDate,
              });
            }
          }

          pageToken = data.nextPageToken || '';
          pageCount++;
        } while (pageToken && pageCount < maxPages);
      }
    } catch (err) {
      console.warn('[Sitemap Generator] Notice: Firestore fetch timed out or unavailable, using fallback:', err.message);
    }
  }

  return Array.from(storiesMap.values());
}

async function generate() {
  const stories = await loadAllPublishedStories();

  // Determine latest modified timestamp from all stories for site-level pages
  let latestStoryDate = null;
  for (const s of stories) {
    if (s.updatedDate) {
      if (!latestStoryDate || new Date(s.updatedDate) > new Date(latestStoryDate)) {
        latestStoryDate = s.updatedDate;
      }
    }
  }

  // Fallback to a stable release date if no story dates exist
  const defaultStableDate = latestStoryDate || '2026-09-08T12:00:00.000Z';

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // 1. Homepage (Root canonical URL)
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/</loc>\n`;
  xml += `    <lastmod>${defaultStableDate}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // 2. Story Directory (Single indexable directory URL)
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/directory</loc>\n`;
  xml += `    <lastmod>${defaultStableDate}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>0.8</priority>\n`;
  xml += `  </url>\n`;

  // 3. Category Pages (Path-based canonical URLs ONLY: /category/{slug})
  for (const cat of categories) {
    let catLatestDate = null;
    for (const s of stories) {
      if (s.category === cat.slug && s.updatedDate) {
        if (!catLatestDate || new Date(s.updatedDate) > new Date(catLatestDate)) {
          catLatestDate = s.updatedDate;
        }
      }
    }
    const catLastMod = catLatestDate || defaultStableDate;

    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/category/${cat.slug}</loc>\n`;
    xml += `    <lastmod>${catLastMod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  }

  // 4. Published Story Pages (Canonical /story/{slug} URLs with RFC 3986 encoding)
  for (const story of stories) {
    const storyUrl = formatCanonicalStoryUrl(story.slug);
    const storyDate = story.updatedDate || defaultStableDate;

    xml += `  <url>\n`;
    xml += `    <loc>${storyUrl}</loc>\n`;
    xml += `    <lastmod>${storyDate}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;

    if (story.coverImage) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(story.coverImage)}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(story.title || 'Sinhala Wal Katha')}</image:title>\n`;
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;

  // Write canonical sitemap.xml
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf-8');
  console.log(`[Sitemap Generator] Generated public/sitemap.xml with ${stories.length} stories.`);

  // Generate canonical robots.txt
  const robotsTxt = `# Robots.txt for Walkathawa (වල් කතාව)
User-agent: *
Allow: /

Disallow: /admin
Disallow: /api/admin
Disallow: /api/auth

# Official Canonical Sitemap
Sitemap: ${baseUrl}/sitemap.xml
`;

  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf-8');
  console.log('[Sitemap Generator] Generated public/robots.txt.');
}

generate().catch((err) => {
  console.error('[Sitemap Generator] Fatal error:', err);
  process.exit(1);
});
