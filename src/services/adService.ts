import { AdvertisementSettings } from '../types/admin';
import { db } from '../lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

const DEFAULT_CONFIG: AdvertisementSettings = {
  enabled: false,
  globalAdCode: '',
  redirectAmount: 1,
};

const SCRIPT_ELEMENT_ID = 'walkathawa-monetag-script-container';

interface StoryAdState {
  storyId: string;
  redirectsUsed: number;
}

class AdService {
  private config: AdvertisementSettings = { ...DEFAULT_CONFIG };
  private activeStoryState: StoryAdState | null = null;
  private unsubscribeFirestore: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initRealtimeConfig();
    }
  }

  /**
   * Initializes real-time listener for Firestore advertisement settings
   */
  private initRealtimeConfig(): void {
    try {
      const docRef = doc(db, 'advertisement_settings', 'config');
      this.unsubscribeFirestore = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            this.config = {
              enabled: typeof data.enabled === 'boolean' ? data.enabled : false,
              globalAdCode: data.globalAdCode || '',
              redirectAmount: (data.redirectAmount !== undefined ? data.redirectAmount : 1) as 1 | 2 | 3,
              updatedAt: data.updatedAt,
            };
            this.applyGlobalScript();
          }
        },
        (error) => {
          console.warn('AdService: Real-time listener fallback to one-time fetch:', error);
          this.fetchConfig();
        }
      );
    } catch (e) {
      this.fetchConfig();
    }
  }

  /**
   * Explicit one-time fetch for advertisement settings
   */
  public async fetchConfig(): Promise<AdvertisementSettings> {
    try {
      const docRef = doc(db, 'advertisement_settings', 'config');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        this.config = {
          enabled: typeof data.enabled === 'boolean' ? data.enabled : false,
          globalAdCode: data.globalAdCode || '',
          redirectAmount: (data.redirectAmount !== undefined ? data.redirectAmount : 1) as 1 | 2 | 3,
          updatedAt: data.updatedAt,
        };
        this.applyGlobalScript();
      }
    } catch (e) {
      console.warn('AdService: Using fallback default ad config.', e);
    }
    return this.config;
  }

  public getConfig(): AdvertisementSettings {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<AdvertisementSettings>): void {
    this.config = { ...this.config, ...newConfig };
    this.applyGlobalScript();
  }

  public isAdsEnabled(): boolean {
    return Boolean(this.config.enabled);
  }

  public getGlobalAdCode(): string {
    return this.config.globalAdCode || '';
  }

  public getRedirectAmount(): 1 | 2 | 3 {
    return (this.config.redirectAmount || 1) as 1 | 2 | 3;
  }

  /**
   * Extracts the target URL from global advertisement code (direct URL or script tag)
   */
  private extractTargetUrl(): string {
    const rawCode = (this.config.globalAdCode || '').trim();
    if (!rawCode) return '';

    if (/^https?:\/\//i.test(rawCode)) {
      return rawCode.split(/\s+/)[0];
    }

    const urlMatch = rawCode.match(/https?:\/\/[^\s"'`<>]+/i);
    return urlMatch ? urlMatch[0] : '';
  }

  /**
   * Initializes advertisement state specifically for the given storyId/slug.
   * When navigating to a new story, a completely fresh allowance is created with redirectsUsed = 0.
   */
  public initStoryVisit(storyKey: string): void {
    if (!storyKey) return;
    const cleanKey = storyKey.trim();
    if (!cleanKey) return;

    if (!this.activeStoryState || this.activeStoryState.storyId !== cleanKey) {
      this.activeStoryState = {
        storyId: cleanKey,
        redirectsUsed: 0,
      };
    }
  }

  /**
   * Checks if an ad redirect is currently allowed for the given story
   */
  public canRedirectForStory(storyKey: string): boolean {
    if (!this.config.enabled) return false;
    const cleanKey = (storyKey || '').trim();
    if (!cleanKey) return false;

    const targetUrl = this.extractTargetUrl();
    if (!targetUrl) return false;

    // If different story, it will have 0 used
    if (!this.activeStoryState || this.activeStoryState.storyId !== cleanKey) {
      return true;
    }

    const limit = this.config.redirectAmount || 1;
    return this.activeStoryState.redirectsUsed < limit;
  }

  /**
   * Returns how many redirects have been used for the current story
   */
  public getStoryRedirectCount(storyKey: string): number {
    const cleanKey = (storyKey || '').trim();
    if (this.activeStoryState && this.activeStoryState.storyId === cleanKey) {
      return this.activeStoryState.redirectsUsed;
    }
    return 0;
  }

  /**
   * Triggers an ad redirect strictly for the given story post visit.
   * Each story post receives its own independent allowance (1, 2, or 3 redirects).
   * Increment occurs ONLY on an actual redirect action, never on re-render.
   */
  public triggerStoryAd(storyKey: string): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const cleanKey = (storyKey || '').trim();
    if (!cleanKey) {
      return false;
    }

    const targetUrl = this.extractTargetUrl();
    if (!targetUrl) {
      return false;
    }

    // If switching to a new story, reset and create fresh state
    if (!this.activeStoryState || this.activeStoryState.storyId !== cleanKey) {
      this.activeStoryState = {
        storyId: cleanKey,
        redirectsUsed: 0,
      };
    }

    const maxAllowed = this.config.redirectAmount || 1;
    if (this.activeStoryState.redirectsUsed >= maxAllowed) {
      return false;
    }

    try {
      this.activeStoryState.redirectsUsed += 1;
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return true;
    } catch (e) {
      console.warn('AdService: window.open redirect failed or blocked:', e);
      return false;
    }
  }

  /**
   * Legacy trigger helper delegating to the active story
   */
  public triggerDirectAd(storyKey?: string): void {
    const keyToUse = storyKey || (this.activeStoryState ? this.activeStoryState.storyId : '');
    if (keyToUse) {
      this.triggerStoryAd(keyToUse);
    }
  }

  /**
   * Applies any global Monetag script tags if present and enabled
   */
  public applyGlobalScript(): void {
    if (typeof document === 'undefined') return;

    const existing = document.getElementById(SCRIPT_ELEMENT_ID);
    if (existing) {
      existing.remove();
    }

    if (!this.config.enabled || !this.config.globalAdCode.trim()) {
      return;
    }

    const code = this.config.globalAdCode.trim();

    if (code.includes('<script')) {
      try {
        const container = document.createElement('div');
        container.id = SCRIPT_ELEMENT_ID;
        container.style.display = 'none';

        const parser = new DOMParser();
        const parsedDoc = parser.parseFromString(code, 'text/html');
        const scriptTags = parsedDoc.querySelectorAll('script');

        scriptTags.forEach((oldScript) => {
          const newScript = document.createElement('script');
          Array.from(oldScript.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });
          if (oldScript.innerHTML) {
            newScript.innerHTML = oldScript.innerHTML;
          }
          container.appendChild(newScript);
        });

        document.head.appendChild(container);
      } catch (err) {
        console.error('Failed to inject Monetag script code:', err);
      }
    }
  }
}

export const adService = new AdService();


