// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getFirestore,
  doc,
  getDocFromServer,
  FirestoreError,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyDWIC_GSMIOliCrhHKPgZgNUAZKUZ96nh4",
  authDomain: "walkathawa-93f80.firebaseapp.com",
  projectId: "walkathawa-93f80",
  storageBucket: "walkathawa-93f80.firebasestorage.app",
  messagingSenderId: "575596307575",
  appId: "1:575596307575:web:daf2ef013ba17b53745272",
  measurementId: "G-E0YMRGV1SK"
};

// Cloud Firestore Dedicated Content Replica Configuration
const contentReplicaConfig = {
  projectId: "cedar-binder-448501-h7",
  appId: "1:962224124146:web:d311b4ce4093d1ae84a06b",
  apiKey: "AIzaSyC0QRGIKuDcgAVTJ3P2YynIV4hClqw2jic",
  authDomain: "cedar-binder-448501-h7.firebaseapp.com",
  storageBucket: "cedar-binder-448501-h7.firebasestorage.app",
  messagingSenderId: "962224124146"
};

// Initialize Firebase
export const app = getApps().some((a) => a.name === '[DEFAULT]')
  ? getApp()
  : initializeApp(firebaseConfig);

export const replicaApp = getApps().some((a) => a.name === 'content-replica')
  ? getApp('content-replica')
  : initializeApp(contentReplicaConfig, 'content-replica');

export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics optional in restricted environments
    });
}

export const db = getFirestore(app);
export const contentDb = getFirestore(
  replicaApp,
  'ai-studio-walkathawa-02ef80ec-1ede-4cb8-a1f9-9e6e1fcb951b'
);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'settings', 'global'));
  } catch (error) {
    if (
      error instanceof FirestoreError &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
