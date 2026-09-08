import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
  apiKey: 'AIzaSyDWIC_GSMIOliCrhHKPgZgNUAZKUZ96nh4',
  authDomain: 'walkathawa-93f80.firebaseapp.com',
  projectId: 'walkathawa-93f80',
  storageBucket: 'walkathawa-93f80.firebasestorage.app',
  messagingSenderId: '575596307575',
  appId: '1:575596307575:web:daf2ef013ba17b53745272',
  measurementId: 'G-E0YMRGV1SK',
};

const DEFAULT_CATEGORIES: Array<{ id: string; name: string; slug: string; description: string; storyCount: number }> = [
  { id: 'all', name: 'සියලුම කතා (All Stories)', slug: 'all', description: 'සියලුම අලුත් සිංහල කතා සහ රසවත් කතා එකතුව', storyCount: 19 },
  { id: 'wife', name: 'වයිෆ් / බිරිඳ (Wife Stories)', slug: 'wife', description: 'බිරිඳ, වයිෆ් සහ පවුලේ සත්‍ය අත්දැකීම් ඇසුරින් ලියවුණු කතා', storyCount: 12 },
  { id: 'school', name: 'පාසල් කතා (School Stories)', slug: 'school', description: 'පාසල්, පන්ති සහ ගුරු සිසු සබඳතා ඇසුරින් ලියවුණු කතා', storyCount: 3 },
  { id: 'akka-malli', name: 'අක්කා - මල්ලි (Akka Malli)', slug: 'akka-malli', description: 'අක්කා මල්ලි සහ අසල්වැසි සබඳතා පිළිබඳ රසවත් කතා', storyCount: 2 },
  { id: 'romantic', name: 'ආදර කතා (Romantic Stories)', slug: 'romantic', description: 'ආදරය, හැඟීම්බර සහ ආශාවන් පිරි කෙටිකතා', storyCount: 2 },
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function syncAllToFirestore() {
  console.log('🚀 Starting synchronization to Firestore project:', firebaseConfig.projectId);

  const dbFilePath = path.join(process.cwd(), 'data', 'database.json');
  if (!fs.existsSync(dbFilePath)) {
    console.error('❌ database.json file not found at:', dbFilePath);
    process.exit(1);
  }

  const raw = fs.readFileSync(dbFilePath, 'utf-8');
  const localDb = JSON.parse(raw);

  // 1. Sync Categories
  const categoriesToSync = Array.isArray(localDb.categories) && localDb.categories.length > 0
    ? localDb.categories
    : DEFAULT_CATEGORIES.map((c) => ({
        id: c.slug,
        name: c.name,
        slug: c.slug,
        description: c.description,
        storyCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

  console.log(`📦 Syncing ${categoriesToSync.length} categories...`);
  for (const cat of categoriesToSync) {
    const catId = cat.id || cat.slug;
    const catRef = doc(db, 'categories', catId);
    await setDoc(catRef, {
      id: catId,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon: cat.icon || '',
      storyCount: cat.storyCount || 0,
      createdAt: cat.createdAt || new Date().toISOString(),
      updatedAt: cat.updatedAt || new Date().toISOString(),
    }, { merge: true });
  }
  console.log('✅ Categories synchronized successfully.');

  // Also save back to localDb if it was missing
  if (!localDb.categories || localDb.categories.length === 0) {
    localDb.categories = categoriesToSync;
    fs.writeFileSync(dbFilePath, JSON.stringify(localDb, null, 2), 'utf-8');
  }

  // 2. Sync Site Settings
  console.log('⚙️ Syncing site settings...');
  if (localDb.settings) {
    const settingsRef = doc(db, 'settings', 'site');
    await setDoc(settingsRef, {
      siteName: localDb.settings.siteName || 'Walkathawa',
      tagline: localDb.settings.tagline || '',
      description: localDb.settings.description || '',
      contactEmail: localDb.settings.contactEmail || '',
      keywords: localDb.settings.keywords || '',
      metaDescription: localDb.settings.metaDescription || '',
      searchConsoleVerification: localDb.settings.searchConsoleVerification || '',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log('✅ Site settings synchronized successfully.');
  }

  // 3. Sync Advertisement Settings
  console.log('📢 Syncing advertisement settings...');
  if (localDb.adSettings) {
    const adConfigRef = doc(db, 'advertisement_settings', 'config');
    await setDoc(adConfigRef, {
      enabled: Boolean(localDb.adSettings.enabled),
      globalAdCode: localDb.adSettings.globalAdCode || localDb.adSettings.globalDirectLink || '',
      redirectAmount: Number(localDb.adSettings.redirectAmount) || 1,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log('✅ Advertisement settings synchronized successfully.');
  }

  // 4. Sync Stories
  console.log(`📖 Syncing ${localDb.stories?.length || 0} stories...`);
  if (Array.isArray(localDb.stories) && localDb.stories.length > 0) {
    const stories = localDb.stories;
    const batchSize = 20;
    for (let i = 0; i < stories.length; i += batchSize) {
      const chunk = stories.slice(i, i + batchSize);
      const batch = writeBatch(db);

      for (const story of chunk) {
        const storyRef = doc(db, 'stories', story.id);
        const storyPayload = {
          ...story,
          published: story.published !== undefined ? story.published : true,
          views: Number(story.views) || 0,
          updatedDate: story.updatedDate || new Date().toISOString(),
          createdAt: story.createdAt || story.uploadDate || story.uploadedDate || new Date().toISOString(),
        };
        batch.set(storyRef, storyPayload, { merge: true });
      }

      await batch.commit();
      console.log(`  Processed stories ${i + 1} to ${Math.min(i + batchSize, stories.length)} of ${stories.length}...`);
    }
    console.log('✅ All stories synchronized successfully.');
  }

  // 5. Sync Users
  if (Array.isArray(localDb.users) && localDb.users.length > 0) {
    console.log(`👤 Syncing ${localDb.users.length} users to Firestore...`);
    for (const user of localDb.users) {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        role: user.role || 'admin',
        createdAt: user.createdAt || new Date().toISOString(),
      }, { merge: true });
    }
    console.log('✅ Users synchronized successfully.');
  }

  console.log('🎉 Full Firestore synchronization completed successfully!');
  process.exit(0);
}

syncAllToFirestore().catch((err) => {
  console.error('❌ Error during Firestore synchronization:', err);
  process.exit(1);
});
