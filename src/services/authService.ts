import { User } from '../types/admin';
import { auth, db } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type AuthListener = (user: User | null) => void;

function formatAuthError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/user-not-found':
      return 'No administrator account was found.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/user-disabled':
      return 'This administrator account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      if (typeof error?.message === 'string' && error.message.trim()) {
        return error.message;
      }
      return 'Authentication failed. Please verify your credentials.';
  }
}

class AuthService {
  private currentUser: User | null = null;
  private listeners: Set<AuthListener> = new Set();
  private sessionChecked = false;
  private token: string | null = null;

  constructor() {
    onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (!userDoc.exists()) {
            // Auto-create initial admin document if user doc doesn't exist yet
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              email: firebaseUser.email || '',
              role: 'admin',
              createdAt: new Date().toISOString(),
            });
            userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          }

          if (userDoc.exists() && userDoc.data()?.role === 'admin') {
            this.currentUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'admin',
              createdAt: userDoc.data()?.createdAt || new Date().toISOString(),
            };
            this.token = await firebaseUser.getIdToken();
          } else {
            // User is not authorized as an admin
            this.currentUser = null;
            this.token = null;
          }
        } catch (e) {
          console.error('Auth authorization error during state change:', e);
          this.currentUser = null;
          this.token = null;
        }
      } else {
        this.currentUser = null;
        this.token = null;
      }
      this.sessionChecked = true;
      this.notify();
    });
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    if (this.sessionChecked) {
      listener(this.currentUser);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.currentUser);
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return Boolean(this.currentUser && this.currentUser.role === 'admin');
  }

  public async login(email: string, password: string, _remember = true): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCredential.user;

      // Verify admin authorization from Firestore user document
      let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          email: firebaseUser.email || '',
          role: 'admin',
          createdAt: new Date().toISOString(),
        });
        userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      }

      if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
        // Sign out non-admin user immediately
        await signOut(auth);
        this.currentUser = null;
        this.token = null;
        this.notify();
        throw new Error('Access denied. Your account is not authorized as an administrator.');
      }

      const user: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        role: 'admin',
        createdAt: userDoc.data()?.createdAt || new Date().toISOString(),
      };

      this.currentUser = user;
      this.token = await firebaseUser.getIdToken();
      this.sessionChecked = true;
      this.notify();

      return user;
    } catch (error: any) {
      if (error.message && error.message.includes('Access denied')) {
        throw error;
      }
      throw new Error(formatAuthError(error));
    }
  }

  public async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return {
        success: true,
        message: 'Password reset link dispatched to your email address.',
      };
    } catch (error: any) {
      throw new Error(formatAuthError(error));
    }
  }

  public async verifySession(): Promise<User | null> {
    if (!this.sessionChecked) {
      await new Promise<void>((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(() => {
          resolve();
          unsubscribe();
        });
      });
    }
    return this.currentUser;
  }

  public async logout(): Promise<void> {
    await signOut(auth);
    this.currentUser = null;
    this.token = null;
    this.notify();
  }
}

export const authService = new AuthService();

