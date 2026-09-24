import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
  Firestore,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Suppress transient network retry / offline mode connection warnings from cluttering console
try {
  setLogLevel('error');
} catch {
  // Ignore in environments where setLogLevel is restricted
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDWIC_GSMIOliCrhHKPgZgNUAZKUZ96nh4",
  authDomain: "walkathawa-93f80.firebaseapp.com",
  projectId: "walkathawa-93f80",
  storageBucket: "walkathawa-93f80.firebasestorage.app",
  messagingSenderId: "575596307575",
  appId: "1:575596307575:web:daf2ef013ba17b53745272",
  measurementId: "G-E0YMRGV1SK"
};

// Initialize Firebase
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Initialize Firestore with HTTP long-polling to prevent WebSocket connection timeouts / 10s hang in iframes & proxies
function initFirestoreInstance(): Firestore {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      experimentalForceLongPolling: true,
    });
  } catch {
    try {
      return initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });
    } catch {
      return getFirestore(app);
    }
  }
}

export const db: Firestore = initFirestoreInstance();
export const storage = getStorage(app);

export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}
