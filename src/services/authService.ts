import { User, AuthSession } from '../types/admin';

const TOKEN_KEY = 'storyhub_admin_token_v1';
const USER_KEY = 'storyhub_admin_user_v1';

type AuthListener = (user: User | null) => void;

class AuthService {
  private token: string | null = null;
  private currentUser: User | null = null;
  private listeners: Set<AuthListener> = new Set();
  private sessionChecked = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        this.token = storedToken;
        this.currentUser = JSON.parse(storedUser);
      }
    } catch {
      this.token = null;
      this.currentUser = null;
    }
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    listener(this.currentUser);
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
    return Boolean(this.token && this.currentUser);
  }

  public async login(email: string, password: string, remember = true): Promise<User> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, remember }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Authentication failed. Please verify your credentials.');
    }

    const data: AuthSession = await res.json();
    this.token = data.token;
    this.currentUser = data.user;
    this.sessionChecked = true;

    try {
      localStorage.setItem(TOKEN_KEY, this.token);
      localStorage.setItem(USER_KEY, JSON.stringify(this.currentUser));
    } catch {
      // ignore
    }

    this.notify();
    return this.currentUser;
  }

  public async verifySession(): Promise<User | null> {
    if (!this.token) {
      this.currentUser = null;
      this.notify();
      return null;
    }

    try {
      const res = await fetch('/api/auth/session', {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!res.ok) {
        this.logout();
        return null;
      }

      const data = await res.json();
      this.currentUser = data.user;
      this.sessionChecked = true;
      this.notify();
      return this.currentUser;
    } catch {
      // In case of offline/network, if token exists allow temporary local verification
      return this.currentUser;
    }
  }

  public async logout(): Promise<void> {
    if (this.token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
      } catch {
        // ignore
      }
    }

    this.token = null;
    this.currentUser = null;
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
    this.notify();
  }

  public async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to submit password reset request');
    }

    return res.json();
  }
}

export const authService = new AuthService();
