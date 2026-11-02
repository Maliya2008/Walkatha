import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import firebaseAppletConfig from '../../firebase-applet-config.json';

// Silence internal Firestore stream disconnection notices across client and server
try {
  setLogLevel('silent');
} catch {
  // Ignore in environments where setLogLevel might not be permitted
}

export const firebaseConfig = firebaseAppletConfig;

// Initialize Firebase safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with the provisioned database ID
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

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
