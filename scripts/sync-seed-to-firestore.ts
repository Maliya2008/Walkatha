import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { INITIAL_STORIES, INITIAL_CATEGORIES } from '../src/data/seedStories';

async function syncSeedToFirestore() {
  console.log('🚀 Starting sync of stories and categories to Firestore...');

  // 1. Sync Categories
  for (const cat of INITIAL_CATEGORIES) {
    const catId = cat.id || cat.slug;
    await setDoc(
      doc(db, 'categories', catId),
      {
        id: catId,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        storyCount: cat.storyCount || 0,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }
  console.log('✅ Categories synced to Firestore.');

  // 2. Sync Stories
  const batchSize = 15;
  const totalStories = INITIAL_STORIES.length;

  for (let i = 0; i < totalStories; i += batchSize) {
    const chunk = INITIAL_STORIES.slice(i, i + batchSize);
    const batch = writeBatch(db);

    for (const story of chunk) {
      const storyId = story.id || story.slug;
      const storyRef = doc(db, 'stories', storyId);

      const payload = {
        id: storyId,
        title: story.title || 'Untitled',
        slug: story.slug || storyId,
        shortDescription: story.shortDescription || story.description || '',
        description: story.shortDescription || story.description || '',
        fullContent: story.fullContent || story.content || '',
        content: story.fullContent || story.content || '',
        coverImage: story.coverImage || '',
        category: story.category || 'all',
        categoryName: story.categoryName || '',
        categoryId: story.categoryId || story.category || 'all',
        tags: story.tags || [],
        author: story.author || 'Walkathawa',
        published: story.published !== false,
        featured: Boolean(story.featured || story.isFeatured),
        views: Number(story.views || 0),
        likes: Number(story.likes || 0),
        readingTime: Number(story.readingTime || 3),
        updatedDate: story.updatedDate || new Date().toISOString(),
        uploadDate: story.uploadDate || story.uploadedDate || story.createdAt || new Date().toISOString(),
        createdAt: story.createdAt || story.uploadDate || story.uploadedDate || new Date().toISOString(),
      };

      batch.set(storyRef, payload, { merge: true });
    }

    await batch.commit();
    console.log(`✅ Synced ${Math.min(i + batchSize, totalStories)}/${totalStories} stories`);
  }

  console.log('🎉 All stories successfully committed to Firestore!');
  process.exit(0);
}

syncSeedToFirestore().catch((err) => {
  console.error('❌ Error pushing to Firestore:', err);
  process.exit(1);
});
