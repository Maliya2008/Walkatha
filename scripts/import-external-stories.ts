import fs from 'fs';
import path from 'path';
import { db } from '../src/lib/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { Story } from '../src/types/story';
import { normalizeCategorySlug, getCategoryDisplayName } from '../src/utils/categoryTaxonomy';

// HTML Entity Decoder
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8230;/g, '…')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// Clean and categorize story
function determineCategory(title: string, tags: string[], externalCats: string[]): string {
  const combined = (title + ' ' + tags.join(' ') + ' ' + externalCats.join(' ')).toLowerCase();

  if (combined.includes('wife') || combined.includes('වයිෆ්') || combined.includes('බිරිඳ') || combined.includes('husband') || combined.includes('හස්බන්')) {
    return 'wife';
  }
  if (combined.includes('නැන්දා') || combined.includes('නැන්දි') || combined.includes('ඇන්ටි') || combined.includes('aunty') || combined.includes('අම්මා') || combined.includes('අම්මි') || combined.includes('ලොකු අම්මා') || combined.includes('පුංචි')) {
    return 'nanda';
  }
  if (combined.includes('අක්කා') || combined.includes('අක්කි') || combined.includes('මල්ලි') || combined.includes('නංගි') || combined.includes('akka') || combined.includes('malli') || combined.includes('nangi')) {
    return 'akka-malli';
  }
  if (combined.includes('school') || combined.includes('පාසල්') || combined.includes('ස්කෝලෙ') || combined.includes('ටීච') || combined.includes('මිස්') || combined.includes('teacher') || combined.includes('miss') || combined.includes('කැම්පස්') || combined.includes('campus') || combined.includes('tution') || combined.includes('පංති')) {
    return 'school';
  }
  if (combined.includes('office') || combined.includes('කාර්යාල') || combined.includes('රැකියා') || combined.includes('job') || combined.includes('boss') || combined.includes('බොස්')) {
    return 'office';
  }
  if (combined.includes('බෝඩිම') || combined.includes('bodime') || combined.includes('අසල්වැසි') || combined.includes('ගෙදර') || combined.includes('neighbour')) {
    return 'neighbour';
  }
  if (combined.includes('ආදර') || combined.includes('love') || combined.includes('romantic') || combined.includes('ප්‍රේම')) {
    return 'romantic';
  }

  return 'wife'; // default fallback
}

interface RawLinkItem {
  name: string;
  link: string;
}

async function scrapeSingleStory(item: RawLinkItem, attempt = 1): Promise<Story | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(item.link, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,si;q=0.8',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();

    // 1. Title
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    let title = h1Match ? decodeHtmlEntities(h1Match[1].replace(/<[^>]+>/g, '')) : decodeHtmlEntities(item.name);
    if (!title || title.length < 3) title = decodeHtmlEntities(item.name);

    // 2. Cover Image
    let coverImage = '';
    const ogImgMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i);
    if (ogImgMatch && ogImgMatch[1]) {
      coverImage = ogImgMatch[1];
    } else {
      const coverDivMatch = html.match(/class=["']reader-cover["'][\s\S]*?<img[^>]+src=["'](.*?)["']/i);
      if (coverDivMatch && coverDivMatch[1]) {
        coverImage = coverDivMatch[1];
      }
    }
    if (!coverImage) {
      coverImage = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYpXdw0tRUaXvrY9irLKCxXKjMMlc-05tpZDxz8rmhsQCB70keglb1HdU5&s=10';
    }

    // 3. Slug from URL
    let cleanSlug = '';
    try {
      const parsedUrl = new URL(item.link);
      const pathname = parsedUrl.pathname.replace(/\/+$/, '');
      const rawSeg = pathname.split('/').pop() || '';
      cleanSlug = decodeURIComponent(rawSeg);
    } catch {
      cleanSlug = title.toLowerCase().replace(/[^a-zA-Z0-9\u0D80-\u0DFF]+/g, '-').replace(/^-|-$/g, '');
    }
    if (!cleanSlug) {
      cleanSlug = `story_${Date.now()}`;
    }

    // 4. Categories & Tags
    const tags: string[] = [];
    const tagMatches = html.matchAll(/rel=["']tag["'][^>]*>([^<]+)<\/a>/gi);
    for (const tm of tagMatches) {
      tags.push(decodeHtmlEntities(tm[1]));
    }

    const extCats: string[] = [];
    const catMatches = html.matchAll(/rel=["']category tag["'][^>]*>([^<]+)<\/a>/gi);
    for (const cm of catMatches) {
      extCats.push(decodeHtmlEntities(cm[1]));
    }

    const categoryKey = determineCategory(title, tags, extCats);
    const categoryName = getCategoryDisplayName(categoryKey);

    // 5. Date
    let uploadDate = new Date().toISOString();
    const dateMetaMatch = html.match(/property=["']article:published_time["']\s+content=["'](.*?)["']/i);
    if (dateMetaMatch && dateMetaMatch[1]) {
      const d = new Date(dateMetaMatch[1]);
      if (!isNaN(d.getTime())) {
        uploadDate = d.toISOString();
      }
    }

    // 6. Content Body
    let fullContent = '';
    const contentMatch = html.match(/<div class=["']story-content["']\s+id=["']story-text["']>([\s\S]*?)<\/div>/i);
    if (contentMatch) {
      let rawContent = contentMatch[1];

      // Remove post-views widget and endings
      rawContent = rawContent.replace(/<div class=["']post-views[\s\S]*$/i, '');
      // Remove promo boilerplate sentences
      rawContent = rawContent.replace(/With each new chapter, the excitement only intensifies[\s\S]*?$/i, '');

      // Replace <br> and <p> with newlines
      fullContent = rawContent
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      fullContent = decodeHtmlEntities(fullContent);
    }

    if (!fullContent || fullContent.length < 50) {
      // Fallback: try standard article content
      const articleMatch = html.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i);
      if (articleMatch) {
        fullContent = decodeHtmlEntities(
          articleMatch[1]
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        );
      }
    }

    if (!fullContent || fullContent.length < 50) {
      console.warn(`[Skip] Insufficient content for: "${title}" (${item.link})`);
      return null;
    }

    // 7. Short Description
    const firstPara = fullContent.split('\n\n')[0] || fullContent;
    const shortDescription = firstPara.slice(0, 280).trim() + (firstPara.length > 280 ? '...' : '');

    const id = `story_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      id,
      title,
      slug: cleanSlug,
      coverImage,
      shortDescription,
      description: shortDescription,
      fullContent,
      content: fullContent,
      category: categoryKey,
      categoryName,
      categoryId: categoryKey,
      tags,
      uploadDate,
      uploadedDate: uploadDate,
      updatedDate: uploadDate,
      createdAt: uploadDate,
      published: true,
      featured: false,
      views: Math.floor(Math.random() * 45) + 5,
      readingTime: Math.max(3, Math.ceil(fullContent.length / 450)),
    };
  } catch (err: any) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 1000 * attempt));
      return scrapeSingleStory(item, attempt + 1);
    }
    console.warn(`[Failed after 3 attempts]: ${item.link} - ${err?.message || err}`);
    return null;
  }
}

async function runImport() {
  console.log('=== STARTING BULK IMPORT OF EXTERNAL STORIES ===\n');

  // 1. Read input HTML attachment
  const htmlPath = path.join(process.cwd(), 'public', 'assets', 'aistudio', 'file-vlt_6efa5b03.html');
  if (!fs.existsSync(htmlPath)) {
    console.error('File not found:', htmlPath);
    process.exit(1);
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const regex = /<tr><td>(.*?)<\/td><td><a href=["'](.*?)["']>/g;
  let match;
  const items: RawLinkItem[] = [];
  const seenUrls = new Set<string>();

  while ((match = regex.exec(html)) !== null) {
    const rawName = match[1].trim();
    const rawLink = match[2].trim();
    if (!seenUrls.has(rawLink)) {
      seenUrls.add(rawLink);
      items.push({ name: rawName, link: rawLink });
    }
  }

  console.log(`Parsed ${items.length} unique story links from HTML attachment.\n`);

  // 2. Load existing Walkathawa stories
  const dbPath = path.join(process.cwd(), 'data', 'database.json');
  let localDb: any = { stories: [] };
  if (fs.existsSync(dbPath)) {
    try {
      localDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch {}
  }
  const existingStories: Story[] = localDb.stories || [];
  const existingSlugs = new Set<string>();
  const existingTitles = new Set<string>();

  for (const s of existingStories) {
    if (s.slug) existingSlugs.add(s.slug.toLowerCase().trim());
    if (s.title) existingTitles.add(s.title.toLowerCase().trim());
  }

  console.log(`Current Walkathawa database has ${existingStories.length} existing stories.`);

  // Filter items that already exist
  const toScrape = items.filter((item) => {
    let cleanSlug = '';
    try {
      const pathname = new URL(item.link).pathname.replace(/\/+$/, '');
      cleanSlug = decodeURIComponent(pathname.split('/').pop() || '').toLowerCase().trim();
    } catch {}
    const cleanTitle = decodeHtmlEntities(item.name).toLowerCase().trim();
    return !existingSlugs.has(cleanSlug) && !existingTitles.has(cleanTitle);
  });

  console.log(`Stories to import: ${toScrape.length} (filtered out ${items.length - toScrape.length} already present).\n`);

  // Load cache of previously scraped stories if available
  const cachePath = path.join(process.cwd(), 'data', 'scraped_stories_cache.json');
  let scrapedStories: Story[] = [];
  if (fs.existsSync(cachePath)) {
    try {
      scrapedStories = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      console.log(`Loaded ${scrapedStories.length} stories from previous cache.`);
    } catch {}
  }

  const scrapedSlugs = new Set(scrapedStories.map((s) => s.slug.toLowerCase().trim()));
  const remainingToScrape = toScrape.filter((item) => {
    try {
      const pathname = new URL(item.link).pathname.replace(/\/+$/, '');
      const s = decodeURIComponent(pathname.split('/').pop() || '').toLowerCase().trim();
      return !scrapedSlugs.has(s);
    } catch {
      return true;
    }
  });

  console.log(`Remaining to fetch over network: ${remainingToScrape.length} stories.\n`);

  // 3. Scrape in batches with concurrency
  const CONCURRENCY = 12;
  let completed = 0;
  const total = remainingToScrape.length;

  for (let i = 0; i < remainingToScrape.length; i += CONCURRENCY) {
    const chunk = remainingToScrape.slice(i, i + CONCURRENCY);
    const results = await Promise.all(chunk.map((item) => scrapeSingleStory(item)));

    for (const story of results) {
      if (story) {
        scrapedStories.push(story);
      }
    }

    completed += chunk.length;
    if (completed % 24 === 0 || completed === total) {
      console.log(`Progress: ${completed}/${total} links processed (${scrapedStories.length} valid stories captured)...`);
      // Save interim cache
      fs.writeFileSync(cachePath, JSON.stringify(scrapedStories, null, 2), 'utf8');
    }
  }

  console.log(`\n✔ Finished scraping. Total valid newly scraped stories: ${scrapedStories.length}`);

  // 4. Merge with existing stories
  const mergedStories: Story[] = [...existingStories];
  const mergedSlugs = new Set<string>(existingStories.map((s) => s.slug.toLowerCase().trim()));

  for (const s of scrapedStories) {
    const key = (s.slug || s.id).toLowerCase().trim();
    if (!mergedSlugs.has(key)) {
      mergedSlugs.add(key);
      mergedStories.push(s);
    }
  }

  // Sort latest first
  mergedStories.sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime());

  console.log(`\nTotal merged Walkathawa story library: ${mergedStories.length} stories!`);

  // 5. Save to local data/database.json
  localDb.stories = mergedStories;
  fs.writeFileSync(dbPath, JSON.stringify(localDb, null, 2), 'utf8');
  console.log(`✔ Successfully updated ${dbPath} with ${mergedStories.length} stories.`);

  // 6. Save to src/data/seedStories.ts
  const seedPath = path.join(process.cwd(), 'src', 'data', 'seedStories.ts');
  const catCode = fs.readFileSync(seedPath, 'utf8');
  const catMatch = catCode.match(/export const INITIAL_CATEGORIES: Category\[\] = (\[[\s\S]*?\]);/);
  const categoriesJson = catMatch ? catMatch[1] : '[]';

  const newSeedCode = `import { Category, Story } from "../types/story";

export const INITIAL_CATEGORIES: Category[] = ${categoriesJson};

export const INITIAL_STORIES: Story[] = ${JSON.stringify(mergedStories, null, 2)};
`;

  fs.writeFileSync(seedPath, newSeedCode, 'utf8');
  console.log(`✔ Successfully updated ${seedPath} with ${mergedStories.length} stories.`);

  // 7. Batch upload new stories to Firestore
  console.log(`\n🔥 Syncing newly imported stories to Firestore database...`);
  const FIRESTORE_BATCH_SIZE = 300;
  for (let i = 0; i < scrapedStories.length; i += FIRESTORE_BATCH_SIZE) {
    const batchChunk = scrapedStories.slice(i, i + FIRESTORE_BATCH_SIZE);
    const batch = writeBatch(db);

    for (const story of batchChunk) {
      const storyRef = doc(db, 'stories', story.id);
      batch.set(
        storyRef,
        {
          ...story,
          published: true,
          views: Number(story.views) || 0,
          updatedDate: story.updatedDate || new Date().toISOString(),
          createdAt: story.createdAt || story.uploadDate || new Date().toISOString(),
        },
        { merge: true }
      );
    }

    await batch.commit();
    console.log(`  Committed Firestore batch: stories ${i + 1} to ${Math.min(i + FIRESTORE_BATCH_SIZE, scrapedStories.length)} of ${scrapedStories.length}`);
  }

  console.log('✔ All new stories successfully committed to Firestore!');

  // Clean up cache file on success
  try {
    fs.unlinkSync(cachePath);
  } catch {}

  console.log('\n======================================================');
  console.log(`IMPORT COMPLETED SUCCESSFULLY! Added ${scrapedStories.length} new stories.`);
  console.log('======================================================\n');
}

runImport().catch((err) => {
  console.error('Import error:', err);
  process.exit(1);
});
