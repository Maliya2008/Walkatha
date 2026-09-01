import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import defaultConfig from '../../firebase-applet-config.json';

const getEnv = (key: string): string | undefined => {
  const metaEnv = (import.meta as any).env;
  if (metaEnv && metaEnv[key]) {
    return metaEnv[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

const firebaseConfig = {
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || defaultConfig.projectId,
  appId: getEnv('VITE_FIREBASE_APP_ID') || defaultConfig.appId,
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || defaultConfig.apiKey,
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || defaultConfig.authDomain,
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || defaultConfig.storageBucket,
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || defaultConfig.messagingSenderId,
};

const databaseId = getEnv('VITE_FIREBASE_DATABASE_ID') || defaultConfig.firestoreDatabaseId;

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app, databaseId);
export const storage = getStorage(app);
