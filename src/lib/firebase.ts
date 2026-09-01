import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "cedar-binder-448501-h7",
  appId: "1:962224124146:web:d311b4ce4093d1ae84a06b",
  apiKey: "AIzaSyC0QRGIKuDcgAVTJ3P2YynIV4hClqw2jic",
  authDomain: "cedar-binder-448501-h7.firebaseapp.com",
  databaseURL: "(default)",
  storageBucket: "cedar-binder-448501-h7.firebasestorage.app",
  messagingSenderId: "962224124146",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-walkathawa-02ef80ec-1ede-4cb8-a1f9-9e6e1fcb951b");
export const storage = getStorage(app);
