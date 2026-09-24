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

function normalizeSeriesSlug(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\u0D80-\u0DFF-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'story';
}

function detectSeriesInfo(story) {
  const rawTitle = story.title || '';
  const rawSlug = story.slug || '';
  const title = rawTitle.replace(/\u200B/g, '').replace(/\uFEFF/g, '').replace(/[–—―]/g, '-').trim();
  const slug = rawSlug.replace(/\u200B/g, '').replace(/\uFEFF/g, '').replace(/[–—―]/g, '-').trim();

  // 1. Dinithige Chat Eka (දිනිතිගෙ චැට් එක)
  if (
    title.includes('දිනිතිගෙ චැට්') ||
    slug.includes('දිනිතිගෙ-චැට්') ||
    slug.includes('dinithi') ||
    title.toLowerCase().includes('dinithi')
  ) {
    const epMatch =
      title.match(/(?:–|-|\b)(\d+)(?:–|-|\b)/) ||
      slug.match(/(?:-)(\d+)(?:-|$)/) ||
      title.match(/(\d+)/);
    const ep = epMatch ? parseInt(epMatch[1], 10) : 1;
    return {
      isSeries: true,
      seriesSlug: 'dinithige-chat-eka',
      seriesTitle: 'දිනිතිගෙ චැට් එක (Dinithige Chat Eka)',
      episodeNumber: ep,
    };
  }

  // 2. School Amuthu Padama (ස්කෝලෙ අමුතු පාඩම)
  if (
    title.includes('ස්කෝලෙ අමුතු පාඩම') ||
    slug.includes('ස්කෝලෙ-අමුතු-පාඩම') ||
    slug.includes('school-wal-katha') ||
    title.toLowerCase().includes('school wal katha')
  ) {
    const epMatch =
      title.match(/(?:–|-|\b)(\d+)(?:–|-|\b)/) ||
      slug.match(/(?:-)(\d+)(?:-|$)/) ||
      title.match(/(\d+)/);
    const ep = epMatch ? parseInt(epMatch[1], 10) : 1;
    return {
      isSeries: true,
      seriesSlug: 'school-amuthu-padama',
      seriesTitle: 'ස්කෝලෙ අමුතු පාඩම (School Wal Katha)',
      episodeNumber: ep,
    };
  }

  // 3. Mama Tharuka (මම තරුකා)
  if (
    title.includes('මම තරුකා') ||
    title.includes('මම තාරුකා') ||
    slug.includes('mama-tharuka') ||
    title.toLowerCase().includes('mama tharuka')
  ) {
    const ep = title.includes('මම තාරුකා-sinhala walkatha') ? 2 : 1;
    return {
      isSeries: true,
      seriesSlug: 'mama-tharuka',
      seriesTitle: 'මම තරුකා (Mama Tharuka)',
      episodeNumber: ep,
    };
  }

  // 4. Hithin Kala Adare (හිතින් කළ ආදරේ)
  if (title.includes('හිතින් කළ ආදරේ') || slug.includes('hithin-kala-adare')) {
    const epMatch = title.match(/(?:–|-|\b)(\d+)(?:–|-|\b)/) || title.match(/(\d+)/);
    const ep = epMatch ? parseInt(epMatch[1], 10) : 1;
    return {
      isSeries: true,
      seriesSlug: 'hithin-kala-adare',
      seriesTitle: 'හිතින් කළ ආදරේ (Hithin Kala Adare)',
      episodeNumber: ep,
    };
  }

  // 5. Girls Trip (කෙල්ලො ගත්ත ෆන් එක)
  if (
    title.includes('කෙල්ලො ගත්ත ෆන්') ||
    slug.includes('girls-trip') ||
    title.toLowerCase().includes('girls trip')
  ) {
    const epMatch = title.match(/(?:–|-|\b)(\d+)(?:–|-|\b)/) || title.match(/(\d+)/);
    const ep = epMatch ? parseInt(epMatch[1], 10) : 1;
    return {
      isSeries: true,
      seriesSlug: 'girls-trip',
      seriesTitle: 'කෙල්ලො ගත්ත ෆන් එක (Girls Trip)',
      episodeNumber: ep,
    };
  }

  const patterns = [
    /^(.*?)(?:\s*[-–—:]\s*|\s+)(?:කොටස|episode|ep|part)\s*(\d+)/i,
    /^(.*?)(?:\s*[-–—:]\s*|\s+)(\d+)$/,
    /^(.*?)(?:_|-)(\d+)$/,
  ];

  for (const regex of patterns) {
    const match = title.match(regex);
    if (match) {
      const seriesTitle = match[1].trim();
      const episodeNumber = parseInt(match[2], 10);
      let seriesSlug = normalizeSeriesSlug(seriesTitle);
      if (/^\d+$/.test(seriesSlug) || seriesSlug.length < 2) {
        seriesSlug = slug.replace(/-\d+$/, '');
      }
      return {
        isSeries: true,
        seriesSlug,
        seriesTitle,
        episodeNumber,
      };
    }
  }

  const slugMatch = slug.match(/^(.*?)[-_](\d+)$/);
  if (slugMatch) {
    const seriesSlug = slugMatch[1];
    const episodeNumber = parseInt(slugMatch[2], 10);
    const seriesTitle = title.replace(/\s*[-–—]\s*\d+$/, '').trim();
    return {
      isSeries: true,
      seriesSlug,
      seriesTitle: seriesTitle || title,
      episodeNumber,
    };
  }

  const fallbackSlug = normalizeSeriesSlug(title) || slug;
  return {
    isSeries: false,
    seriesSlug: fallbackSlug,
    seriesTitle: title,
    episodeNumber: 1,
  };
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

  const defaultStableDate = latestStoryDate || '2026-09-08T12:00:00.000Z';

  // Group stories into Series Hubs
  const seriesMap = new Map();
  for (const story of stories) {
    const info = detectSeriesInfo(story);
    if (!seriesMap.has(info.seriesSlug)) {
      seriesMap.set(info.seriesSlug, {
        slug: info.seriesSlug,
        title: info.seriesTitle,
        category: story.category,
        coverImage: story.coverImage,
        latestDate: story.updatedDate || defaultStableDate,
        episodes: [],
      });
    }

    const s = seriesMap.get(info.seriesSlug);
    s.episodes.push({
      episodeNumber: info.episodeNumber,
      story,
    });
    if (story.updatedDate && new Date(story.updatedDate) > new Date(s.latestDate)) {
      s.latestDate = story.updatedDate;
    }
  }

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

  // 2. Latest Stories Hub
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/latest</loc>\n`;
  xml += `    <lastmod>${defaultStableDate}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>0.9</priority>\n`;
  xml += `  </url>\n`;

  // 3. Popular Stories Hub
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/popular</loc>\n`;
  xml += `    <lastmod>${defaultStableDate}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>0.9</priority>\n`;
  xml += `  </url>\n`;

  // 4. Archives (Complete Content Directory)
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/archives</loc>\n`;
  xml += `    <lastmod>${defaultStableDate}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>0.85</priority>\n`;
  xml += `  </url>\n`;

  // 5. Category Pages (Path-based canonical URLs: /category/{slug})
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
    xml += `    <priority>0.85</priority>\n`;
    xml += `  </url>\n`;
  }

  // 6. Story / Series Hubs (Canonical: /posts/{series}/episodes)
  for (const s of seriesMap.values()) {
    const seriesUrl = `${baseUrl}/posts/${encodeURI(s.slug)}/episodes`;
    xml += `  <url>\n`;
    xml += `    <loc>${seriesUrl}</loc>\n`;
    xml += `    <lastmod>${s.latestDate}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    if (s.coverImage) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(s.coverImage)}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(s.title || 'Sinhala Series Hub')}</image:title>\n`;
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n`;
  }

  // 7. Individual Episode Pages (Canonical: /posts/{series}/episodes/{episode})
  for (const s of seriesMap.values()) {
    for (const ep of s.episodes) {
      const epUrl = `${baseUrl}/posts/${encodeURI(s.slug)}/episodes/${ep.episodeNumber}`;
      const epDate = ep.story.updatedDate || defaultStableDate;

      xml += `  <url>\n`;
      xml += `    <loc>${epUrl}</loc>\n`;
      xml += `    <lastmod>${epDate}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      if (ep.story.coverImage) {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${escapeXml(ep.story.coverImage)}</image:loc>\n`;
        xml += `      <image:title>${escapeXml(ep.story.title || 'Sinhala Wal Katha Episode')}</image:title>\n`;
        xml += `    </image:image>\n`;
      }
      xml += `  </url>\n`;
    }
  }

  xml += `</urlset>`;

  // Write canonical sitemap.xml
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf-8');
  console.log(`[Sitemap Generator] Generated public/sitemap.xml with ${seriesMap.size} series and ${stories.length} episodes.`);

  // Generate canonical robots.txt
  const robotsTxt = `# Robots.txt for Walkathawa (වල් කතාව) - Following walakatha.com Architecture
User-agent: *
Allow: /

Disallow: /admin
Disallow: /admin/*
Disallow: /api/admin
Disallow: /api/auth
Disallow: /search

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
