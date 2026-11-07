import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
  doc,
  getDoc,
  Firestore,
  FirestoreError,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Suppress noisy WebChannel 10s connection warnings in proxied/iframe environments
try {
  setLogLevel('silent');
} catch {
  // ignore
}

export const firebaseConfig = {
  apiKey: 'AIzaSyDWIC_GSMIOliCrhHKPgZgNUAZKUZ96nh4',
  authDomain: 'walkathawa-93f80.firebaseapp.com',
  projectId: 'walkathawa-93f80',
  storageBucket: 'walkathawa-93f80.firebasestorage.app',
  messagingSenderId: '575596307575',
  appId: '1:575596307575:web:daf2ef013ba17b53745272',
  measurementId: 'G-E0YMRGV1SK',
};

const contentReplicaConfig = {
  projectId: 'advance-sandbox-gmzf6',
  appId: '1:448261670736:web:b9c2a2ffea58dfe8ce0e55',
  apiKey: 'AIzaSyC52g5zyvwkpuqYuP2SlW9yqU50KXxm3DE',
  authDomain: 'advance-sandbox-gmzf6.firebaseapp.com',
  storageBucket: 'advance-sandbox-gmzf6.firebasestorage.app',
  messagingSenderId: '448261670736',
};

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

function initFirestoreSafe(targetApp: ReturnType<typeof getApp>, databaseId?: string): Firestore {
  try {
    return databaseId
      ? initializeFirestore(
          targetApp,
          { experimentalAutoDetectLongPolling: true },
          databaseId
        )
      : initializeFirestore(targetApp, { experimentalAutoDetectLongPolling: true });
  } catch {
    return databaseId ? getFirestore(targetApp, databaseId) : getFirestore(targetApp);
  }
}

export const db = initFirestoreSafe(app);
export const contentDb = initFirestoreSafe(
  replicaApp,
  'ai-studio-walkatha-f5f7438d-1626-498d-ab41-6bcb7c299cae'
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
    await Promise.race([
      getDoc(doc(contentDb, 'stories', '_health')),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch (error) {
    if (
      error instanceof FirestoreError &&
      error.message.includes('the client is offline')
    ) {
      // Handled gracefully by offline/static sync cache
    }
  }
}
