import fs from 'fs';
import path from 'path';

const baseUrl = 'https://www.walkathawa.site';
const dbPath = path.join(process.cwd(), 'data', 'database.json');
const publicDir = path.join(process.cwd(), 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
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

let stories = [];
if (fs.existsSync(dbPath)) {
  try {
    const raw = fs.readFileSync(dbPath, 'utf-8');
    const data = JSON.parse(raw);
    stories = (data.stories || []).filter((s) => s.published && !isMockStory(s));
  } catch (err) {
    console.error('Error reading database.json for sitemap:', err);
  }
}

const nowISO = new Date().toISOString();

const categories = [
  { slug: 'wife', name: 'වයිෆ් / බිරිඳ (Wife Stories)' },
  { slug: 'school', name: 'පාසල් කතා (School Stories)' },
  { slug: 'akka-malli', name: 'අක්කා - මල්ලි (Akka Malli)' },
  { slug: 'romantic', name: 'ආදර කතා (Romantic Stories)' },
];

// Generate XML Sitemap
let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

// 1. Homepage
xml += `  <url>\n`;
xml += `    <loc>${baseUrl}/</loc>\n`;
xml += `    <lastmod>${nowISO}</lastmod>\n`;
xml += `    <changefreq>daily</changefreq>\n`;
xml += `    <priority>1.0</priority>\n`;
xml += `  </url>\n`;

// 2. Categories
categories.forEach((cat) => {
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/?category=${cat.slug}</loc>\n`;
  xml += `    <lastmod>${nowISO}</lastmod>\n`;
  xml += `    <changefreq>weekly</changefreq>\n`;
  xml += `    <priority>0.8</priority>\n`;
  xml += `  </url>\n`;
});

// 4. Published Stories
stories.forEach((story) => {
  const rawModTime = story.updatedDate || story.uploadDate || story.uploadedDate || nowISO;
  let validModTime = nowISO;
  try {
    validModTime = new Date(rawModTime).toISOString();
  } catch {
    validModTime = nowISO;
  }

  const storyUrl = `${baseUrl}/story/${story.slug}`;
  xml += `  <url>\n`;
  xml += `    <loc>${storyUrl}</loc>\n`;
  xml += `    <lastmod>${validModTime}</lastmod>\n`;
  xml += `    <changefreq>weekly</changefreq>\n`;
  xml += `    <priority>0.9</priority>\n`;
  if (story.coverImage) {
    const sanitizedTitle = (story.title || 'Sinhala Wal Katha')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    xml += `    <image:image>\n`;
    xml += `      <image:loc>${story.coverImage.replace(/&/g, '&amp;')}</image:loc>\n`;
    xml += `      <image:title>${sanitizedTitle}</image:title>\n`;
    xml += `    </image:image>\n`;
  }
  xml += `  </url>\n`;
});

xml += `</urlset>`;

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'sitemap'), xml, 'utf-8');
console.log(`[Sitemap Generator] Generated public/sitemap.xml and public/sitemap with ${stories.length} stories.`);

// Generate robots.txt
const robotsTxt = `# Robots.txt for Walkathawa (වල් කතාව)
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/admin
Disallow: /api/auth

# Sitemap Endpoints
Sitemap: ${baseUrl}/sitemap.xml
`;

fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf-8');
console.log('[Sitemap Generator] Generated public/robots.txt.');

// Generate sitemap.xsl
const sitemapXsl = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
  xmlns:html="http://www.w3.org/TR/REC-html40"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="si">
      <head>
        <title>XML Sitemap | Walkathawa (වල් කතාව)</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style type="text/css">
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
            background: #090d16;
            color: #cbd5e1;
            margin: 0;
            padding: 30px 20px;
          }
          .container {
            max-width: 1100px;
            margin: 0 auto;
            background: #0f172a;
            border-radius: 16px;
            border: 1px solid #1e293b;
            padding: 30px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
          }
          h1 {
            color: #ffffff;
            font-size: 24px;
            margin-top: 0;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          h1 span {
            color: #818cf8;
            font-size: 16px;
            font-weight: normal;
          }
          p.desc {
            color: #94a3b8;
            font-size: 13px;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .stats {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
          }
          .stat-badge {
            background: #1e293b;
            border: 1px solid #334155;
            padding: 8px 16px;
            border-radius: 10px;
            font-size: 12px;
            color: #e2e8f0;
          }
          .stat-badge strong {
            color: #38bdf8;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            text-align: left;
          }
          th {
            background: #1e293b;
            color: #f8fafc;
            padding: 12px 14px;
            font-weight: 600;
            border-bottom: 1px solid #334155;
          }
          th:first-child { border-top-left-radius: 8px; }
          th:last-child { border-top-right-radius: 8px; }
          td {
            padding: 10px 14px;
            border-bottom: 1px solid #1e293b;
            color: #94a3b8;
          }
          tr:hover td {
            background: #131d33;
            color: #f1f5f9;
          }
          a {
            color: #818cf8;
            text-decoration: none;
            word-break: break-all;
          }
          a:hover {
            text-decoration: underline;
            color: #a5b4fc;
          }
          .priority-tag {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 11px;
            background: #1e293b;
            color: #38bdf8;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Walkathawa XML Sitemap <span>(වල් කතාව සයිට්මැප්)</span></h1>
          <p class="desc">
            This XML sitemap is generated dynamically for search engines like Google, Bing, and web crawlers, indexable at <strong>/sitemap.xml</strong> and <strong>/sitemap</strong>.
          </p>
          <div class="stats">
            <div class="stat-badge">Total URLs: <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong></div>
            <div class="stat-badge">Website: <strong>Walkathawa</strong></div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>URL Location</th>
                <th style="width: 90px;">Priority</th>
                <th style="width: 120px;">Change Freq</th>
                <th style="width: 170px;">Last Modified</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td><xsl:value-of select="position()"/></td>
                  <td>
                    <a href="{sitemap:loc}" target="_blank">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td><span class="priority-tag"><xsl:value-of select="sitemap:priority"/></span></td>
                  <td><xsl:value-of select="sitemap:changefreq"/></td>
                  <td><xsl:value-of select="sitemap:lastmod"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`;

fs.writeFileSync(path.join(publicDir, 'sitemap.xsl'), sitemapXsl, 'utf-8');
console.log('[Sitemap Generator] Generated public/sitemap.xsl.');
