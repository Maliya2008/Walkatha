import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Silence internal Firestore stream disconnection notices across client and server
try {
  setLogLevel('silent');
} catch {
  // Ignore in environments where setLogLevel might not be permitted
}

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDWIC_GSMIOliCrhHKPgZgNUAZKUZ96nh4",
  authDomain: "walkathawa-93f80.firebaseapp.com",
  projectId: "walkathawa-93f80",
  storageBucket: "walkathawa-93f80.firebasestorage.app",
  messagingSenderId: "575596307575",
  appId: "1:575596307575:web:daf2ef013ba17b53745272",
  measurementId: "G-E0YMRGV1SK"
};

// Initialize Firebase safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// Initialize client-only services safely to prevent serverless Node runtime crashes
export const auth: any = typeof window !== 'undefined' ? getAuth(app) : ({} as any);
export const storage: any = typeof window !== 'undefined' ? getStorage(app) : ({} as any);

// Initialize Analytics if supported in browser environment
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {});
}
