import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, writeBatch, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Firebase configuration for walkathawa-93f80
const firebaseConfig = {
  apiKey: "AIzaSyDWIC_GSMIOliCrhHKPgZgNUAZKUZ96nh4",
  authDomain: "walkathawa-93f80.firebaseapp.com",
  projectId: "walkathawa-93f80",
  storageBucket: "walkathawa-93f80.firebasestorage.app",
  messagingSenderId: "575596307575",
  appId: "1:575596307575:web:daf2ef013ba17b53745272",
  measurementId: "G-E0YMRGV1SK"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

async function pushAllStories() {
  console.log('========================================================');
  console.log('🚀 PUSHING ALL STORIES TO FIRESTORE (walkathawa-93f80)');
  console.log('========================================================');

  const dbFilePath = path.join(process.cwd(), 'data', 'database.json');
  if (!fs.existsSync(dbFilePath)) {
    console.error('❌ database.json not found at:', dbFilePath);
    process.exit(1);
  }

  const dbData = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
  const stories = dbData.stories || [];
  const categories = dbData.categories || [];

  console.log(`📚 Total stories in database.json: ${stories.length}`);
  console.log(`📁 Total categories in database.json: ${categories.length}`);

  // 1. Sync Categories first
  if (categories.length > 0) {
    console.log(`\n📦 Uploading ${categories.length} categories...`);
    const catBatch = writeBatch(db);
    for (const cat of categories) {
      const catId = cat.id || cat.slug;
      const ref = doc(db, 'categories', catId);
      catBatch.set(ref, {
        id: catId,
        name: cat.name || catId,
        slug: cat.slug || catId,
        sinhalaName: cat.sinhalaName || cat.name || '',
        description: cat.description || '',
        icon: cat.icon || 'BookOpen',
        storyCount: Number(cat.storyCount) || 0,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
    await catBatch.commit();
    console.log('✅ Categories successfully written to Firestore.');
  }

  // 2. Sync All 613 Stories in batches of 25
  const batchSize = 25;
  const total = stories.length;
  let successCount = 0;

  console.log(`\n📖 Uploading ${total} stories to Firestore collection: 'stories'...`);

  for (let i = 0; i < total; i += batchSize) {
    const chunk = stories.slice(i, i + batchSize);
    const batch = writeBatch(db);

    for (const s of chunk) {
      const storyId = (s.id || s.slug || `story_${Date.now()}`).trim();
      const ref = doc(db, 'stories', storyId);

      const payload = {
        id: storyId,
        title: s.title || 'Untitled Story',
        slug: s.slug || storyId,
        shortDescription: s.shortDescription || s.description || '',
        description: s.shortDescription || s.description || '',
        fullContent: s.fullContent || s.content || '',
        content: s.fullContent || s.content || '',
        category: s.category || 'all',
        categoryName: s.categoryName || '',
        categoryId: s.categoryId || s.category || 'all',
        tags: Array.isArray(s.tags) ? s.tags : [],
        coverImage: s.coverImage || '',
        views: Number(s.views) || 0,
        likes: Number(s.likes) || 0,
        readingTime: Number(s.readingTime) || Math.max(3, Math.ceil((s.fullContent || s.content || '').length / 450)),
        featured: Boolean(s.featured),
        published: s.published !== false,
        uploadDate: s.uploadDate || s.uploadedDate || new Date().toISOString(),
        uploadedDate: s.uploadDate || s.uploadedDate || new Date().toISOString(),
        updatedDate: s.updatedDate || new Date().toISOString(),
        createdAt: s.uploadDate || s.uploadedDate || new Date().toISOString(),
      };

      batch.set(ref, payload, { merge: true });
    }

    await batch.commit();
    successCount += chunk.length;
    console.log(`  ✓ Synced stories ${i + 1} to ${Math.min(i + batchSize, total)} of ${total} (${Math.round((successCount / total) * 100)}%)`);
  }

  console.log('\n========================================================');
  console.log(`🎉 SUCCESS: All ${successCount} stories are now live in Firestore!`);
  console.log('Project: walkathawa-93f80 | Collection: stories');
  console.log('========================================================');
  process.exit(0);
}

pushAllStories().catch((err) => {
  console.error('\n❌ Firestore push failed:', err.message || err);
  if (err.code === 'permission-denied') {
    console.error('\n⚠️ REASON: Firestore Security Rules on walkathawa-93f80 are blocking writes.');
    console.error('Please update the rules in Firebase Console to allow write access:');
    console.error('https://console.firebase.google.com/project/walkathawa-93f80/firestore/rules\n');
  }
  process.exit(1);
});
