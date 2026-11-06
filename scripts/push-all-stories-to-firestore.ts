import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, writeBatch, collection, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import fs from 'fs';

// Primary Firebase Configuration (walkathawa-93f80)
const primaryFirebaseConfig = {
  apiKey: "AIzaSyDWIC_GSMIOliCrhHKPgZgNUAZKUZ96nh4",
  authDomain: "walkathawa-93f80.firebaseapp.com",
  projectId: "walkathawa-93f80",
  storageBucket: "walkathawa-93f80.firebasestorage.app",
  messagingSenderId: "575596307575",
  appId: "1:575596307575:web:daf2ef013ba17b53745272",
  measurementId: "G-E0YMRGV1SK"
};

// Cloud Firestore Dedicated Replica Configuration
const replicaFirebaseConfig = {
  projectId: "cedar-binder-448501-h7",
  appId: "1:962224124146:web:d311b4ce4093d1ae84a06b",
  apiKey: "AIzaSyC0QRGIKuDcgAVTJ3P2YynIV4hClqw2jic",
  authDomain: "cedar-binder-448501-h7.firebaseapp.com",
  storageBucket: "cedar-binder-448501-h7.firebasestorage.app",
  messagingSenderId: "962224124146"
};

const primaryApp = initializeApp(primaryFirebaseConfig, 'primary');
const primaryDb = getFirestore(primaryApp);

const replicaApp = initializeApp(replicaFirebaseConfig, 'replica');
const replicaAuth = getAuth(replicaApp);
const replicaDb = getFirestore(replicaApp, 'ai-studio-walkathawa-02ef80ec-1ede-4cb8-a1f9-9e6e1fcb951b');

function cleanStoryBody(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/Wal Katha:\s*https?:\/\/[^\s]+/gi, '')
    .replace(/Join with our Sinhala[^\n]+/gi, '')
    .replace(/https?:\/\/(t\.me|slpornhub\.com)[^\s]*/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildNaturalDescription(title: string, rawDesc: string, fullBody: string, categoryName: string): string {
  const cleanTitle = title.replace(/\s*[–-]\s*(Wal|Wela|Sex)\s*Katha.*$/i, '').trim();
  const isStuffed =
    !rawDesc ||
    rawDesc.length < 45 ||
    /slpornhub|pdf|wal katha lokaya|sex katha\s*[–-]|wela katha\s*[–-]|wife sharing/i.test(rawDesc);

  let source = isStuffed ? fullBody : rawDesc;
  source = source.replace(/\s+/g, ' ').trim();

  if (!source) {
    return `${cleanTitle} - ${categoryName || 'සිංහල වැල කතා'} එකතුවෙන් කියවන්න.`.slice(0, 155);
  }

  if (source.length <= 155) {
    return source;
  }

  const truncated = source.slice(0, 152).replace(/\s+\S*$/, '');
  return `${truncated}...`;
}

async function authenticateAdmin() {
  const email = 'sync_master_admin@walkathawa.site';
  const pass = 'SyncAdmin#2026!';
  let uid = '';
  try {
    const cred = await signInWithEmailAndPassword(replicaAuth, email, pass);
    uid = cred.user.uid;
  } catch {
    const cred = await createUserWithEmailAndPassword(replicaAuth, email, pass);
    uid = cred.user.uid;
  }
  await setDoc(doc(replicaDb, 'users', uid), {
    uid,
    email,
    role: 'admin',
    createdAt: new Date().toISOString(),
  }, { merge: true });
  await deleteDoc(doc(replicaDb, 'posts', 'test_post')).catch(() => {});
}

async function pushAllStories() {
  await authenticateAdmin();
  console.log('Authenticated as Firestore Admin.');

  const storyMap = new Map<string, any>();

  // 1. Load existing stories from replicaDb first (614 stories with fullContent)
  const existingReplicaSnap = await getDocs(collection(replicaDb, 'stories'));
  existingReplicaSnap.forEach((d) => {
    storyMap.set(d.id, { ...d.data(), id: d.id });
  });

  // 2. Merge with /tmp/repo/public/api-data/stories.json if present
  const sourcePath = '/tmp/repo/public/api-data/stories.json';
  if (fs.existsSync(sourcePath)) {
    const rawStories: any[] = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    for (const s of rawStories) {
      const id = String(s.id || s.slug).trim();
      const prev = storyMap.get(id) || {};
      storyMap.set(id, {
        ...prev,
        ...s,
        fullContent: s.fullContent || s.content || prev.fullContent || prev.content || '',
      });
    }
  }

  // 3. Merge metadata from primaryDb (views, etc.)
  try {
    const primarySnap = await getDocs(collection(primaryDb, 'stories'));
    primarySnap.forEach((d) => {
      const data = d.data();
      const prev = storyMap.get(d.id) || {};
      storyMap.set(d.id, {
        ...prev,
        ...data,
        id: d.id,
        fullContent: (data.fullContent && data.fullContent.length > 50)
          ? data.fullContent
          : (prev.fullContent || prev.content || ''),
        views: Math.max(Number(data.views) || 0, Number(prev.views) || 12),
      });
    });
  } catch (e) {
    console.warn('Notice reading primaryDb:', e);
  }

  const allStories = Array.from(storyMap.values());
  console.log(`Prepared ${allStories.length} total stories with full content.`);

  // Compute category counts
  const catCounts = new Map<string, number>();
  for (const s of allStories) {
    const cat = s.category || 'romantic';
    catCounts.set(cat, (catCounts.get(cat) || 0) + 1);
  }

  const categories = [
    {
      id: 'wife',
      slug: 'wife',
      name: 'වයිෆ් / බිරිඳ (Wife Stories)',
      sinhalaName: 'වයිෆ් / බිරිඳ කතා',
      description: 'බිරිඳ, පවුලේ ජීවිතය සහ විවාහක අත්දැකීම් ඇසුරින් ලියැවුණු සිංහල වැල කතා එකතුව.',
      storyCount: catCounts.get('wife') || 0,
    },
    {
      id: 'akka-malli',
      slug: 'akka-malli',
      name: 'අක්කා - මල්ලි (Akka Malli)',
      sinhalaName: 'අක්කා - මල්ලි කතා',
      description: 'අක්කා, මල්ලි සහ අසල්වැසි යෞවන සබඳතා ඇසුරින් ලියැවුණු රසවත් සිංහල වල් කතා.',
      storyCount: catCounts.get('akka-malli') || 0,
    },
    {
      id: 'nanda',
      slug: 'nanda',
      name: 'නැන්දා / ඇන්ටි (Aunty Stories)',
      sinhalaName: 'නැන්දා / ඇන්ටි කතා',
      description: 'අම්මා වල් කතා 2026, නැන්දා සහ ඇන්ටි චරිත ඇසුරින් නිර්මාණය වූ සිංහල කතා.',
      storyCount: catCounts.get('nanda') || 0,
    },
    {
      id: 'school',
      slug: 'school',
      name: 'පාසල් සහ කැම්පස් (School & Campus)',
      sinhalaName: 'පාසල් සහ කැම්පස් කතා',
      description: 'කැම්පස්, පාසල් සහ යෞවන ආදර අත්දැකීම් ඇසුරින් ලියැවුණු අලුත්ම සිංහල වැල කතා.',
      storyCount: catCounts.get('school') || 0,
    },
    {
      id: 'romantic',
      slug: 'romantic',
      name: 'ආදර කතා (Romantic Stories)',
      sinhalaName: 'ආදර සහ රස කතා',
      description: 'ආදරණීය හා හැඟීම්බර සිංහල වල් කතා සහ කෙටි කතා එකතුව.',
      storyCount: catCounts.get('romantic') || 0,
    },
  ];

  console.log('1. Syncing categories and settings to Firestore...');
  const catBatch = writeBatch(replicaDb);
  for (const cat of categories) {
    catBatch.set(doc(replicaDb, 'categories', cat.id), {
      ...cat,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }
  await catBatch.commit();

  await setDoc(doc(replicaDb, 'settings', 'global'), {
    siteName: 'Walkathawa (වල් කතාව)',
    alternateName: 'Walkathawa',
    tagline: 'සිංහල වැල කතා | වල් කතා | Sinhala Wal Katha 2026',
    metaTitle: 'සිංහල වැල කතා | වල් කතා හා වැල කතා 2026 - Walkathawa',
    metaDescription: 'අලුත්ම සිංහල වැල කතා, වල් කතා, අම්මා වල් කතා 2026, අක්කා මල්ලි සහ පවුලේ වැල කතා 600කට වැඩි එකතුවක් නොමිලේ කියවන්න.',
    keywords: 'සිංහල වැල කතා, වල් කතා, වැල කතා, Wal Katha, wala katha, wela katha, walkatha9, sinhala wal katha, Wela kathaa, Sex Katha, Sex Stories, Wal Stories, Sinhala Sex, Sinhala Porn, Free Download, Sri Lanka, new wela katha, wal katha 9, sinhala wela katha, wal Katha sinhalen, Ammai Puthai, Paule wela Katha, Sinhala wal wala wela katha, amma katha, family katha, suparima katha, walma, wal katha kari katha, eha gedara, akka katha, malli katha, seeya katha, husband katha, wife katha, hora katha, New Wal Katha blogs, wal chithra katha, wal katha free, sinhala sex katha, sinhala wal katha blog, nangita hukala, campus, amma malli, akka, birinda, wife lingika paula, rasama, rasa wal katha, wal katha fb, අම්මා වල් කතා 2026',
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  console.log('2. Syncing 614 stories and full content to dedicated collections (stories & posts)...');
  const batchSize = 20;
  let synced = 0;

  for (let i = 0; i < allStories.length; i += batchSize) {
    const chunk = allStories.slice(i, i + batchSize);
    const batch = writeBatch(replicaDb);

    for (const s of chunk) {
      const storyId = String(s.id || s.slug || `story_${i}`).trim();
      const body = cleanStoryBody(s.fullContent || s.content || '');
      const words = body ? body.split(/\s+/).length : 0;
      const readingTime = Math.max(3, Math.ceil(words / 180));
      const naturalDesc = buildNaturalDescription(
        s.title || 'සිංහල කතාව',
        s.shortDescription || s.description || '',
        body,
        s.categoryName || ''
      );

      const storyPayload = {
        id: storyId,
        title: (s.title || 'සිංහල කතාව').trim(),
        slug: (s.slug || storyId).trim(),
        shortDescription: naturalDesc,
        description: naturalDesc,
        fullContent: body,
        content: body,
        wordCount: words,
        readingTime,
        category: s.category || 'romantic',
        categoryId: s.categoryId || s.category || 'romantic',
        categoryName: s.categoryName || 'සිංහල කතා',
        tags: Array.isArray(s.tags) && s.tags.length > 0
          ? s.tags.slice(0, 8)
          : ['සිංහල වැල කතා', 'වල් කතා', 'වැල කතා', s.category || 'sinhala wal katha'],
        coverImage: s.coverImage || '',
        views: Number(s.views) || 12,
        likes: Number(s.likes) || 0,
        featured: Boolean(s.featured),
        published: s.published !== false,
        uploadDate: s.uploadDate || s.uploadedDate || '2026-05-01T00:00:00.000Z',
        uploadedDate: s.uploadDate || s.uploadedDate || '2026-05-01T00:00:00.000Z',
        updatedDate: new Date().toISOString(),
      };

      // 1) 'stories' collection (story metadata + content)
      batch.set(doc(replicaDb, 'stories', storyId), storyPayload, { merge: true });

      // 2) 'posts' dedicated collection for full story content
      batch.set(doc(replicaDb, 'posts', storyId), {
        id: storyId,
        slug: storyPayload.slug,
        title: storyPayload.title,
        fullContent: body,
        content: body,
        shortDescription: naturalDesc,
        wordCount: words,
        readingTime,
        category: storyPayload.category,
        tags: storyPayload.tags,
        published: true,
        uploadDate: storyPayload.uploadDate,
        updatedDate: storyPayload.updatedDate,
      }, { merge: true });
    }

    await batch.commit();
    synced += chunk.length;
    if (synced % 100 === 0 || synced === allStories.length) {
      console.log(`Synced ${synced}/${allStories.length} stories & full content documents...`);
    }
  }

  const verifyStories = await getDocs(collection(replicaDb, 'stories'));
  const verifyPosts = await getDocs(collection(replicaDb, 'posts'));
  console.log(
    `Done! Firestore 'stories': ${verifyStories.size}, dedicated content 'posts': ${verifyPosts.size}`
  );
  process.exit(0);
}

pushAllStories().catch((err) => {
  console.error('Error pushing stories:', err);
  process.exit(1);
});
