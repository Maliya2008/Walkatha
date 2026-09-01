import { db } from './src/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { storyService } from './src/services/storyService';

async function test() {
  const storiesSnap = await storyService.getStories({ limit: 1 });
  if (storiesSnap.data.length > 0) {
    const story = storiesSnap.data[0];
    console.log('Testing story:', story.id, 'Current views:', story.views);
    
    // Try increment
    try {
      await updateDoc(doc(db, 'stories', story.id), { views: increment(1) });
      console.log('Increment SUCCESS');
    } catch (err) {
      console.error('Increment FAILED:', err);
    }
  } else {
    console.log('No stories found');
  }
}
test();
