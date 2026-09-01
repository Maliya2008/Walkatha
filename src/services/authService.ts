import { User, AuthSession } from '../types/admin';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type AuthListener = (user: User | null) => void;

class AuthService {
  private currentUser: User | null = null;
  private listeners: Set<AuthListener> = new Set();
  private sessionChecked = false;
  private token: string | null = null;

  constructor() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Try to get user details from Firestore or fallback
        let role = 'admin';
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            role = userDoc.data().role || 'admin';
          } else {
             // Create initial admin user document if not exists
             await setDoc(doc(db, 'users', firebaseUser.uid), {
                email: firebaseUser.email,
                role: 'admin',
                createdAt: new Date().toISOString()
             });
          }
        } catch (e) {
           console.error("Auth sync error", e);
        }

        this.currentUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          role,
          createdAt: new Date().toISOString(),
        };
        this.token = await firebaseUser.getIdToken();
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
    return Boolean(this.currentUser);
  }

  public async login(email: string, password: string, remember = true): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCredential.user;
      
      const user: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      
      this.currentUser = user;
      this.token = await firebaseUser.getIdToken();
      this.sessionChecked = true;
      this.notify();
      
      return user;
    } catch (error: any) {
      throw new Error(error.message || 'Authentication failed. Please verify your credentials.');
    }
  }

  public async verifySession(): Promise<User | null> {
    // Session is automatically verified by onAuthStateChanged.
    // Wait for initial check.
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
