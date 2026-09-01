import { AdvertisementSettings } from '../types/admin';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const DEFAULT_CONFIG: AdvertisementSettings = {
  enabled: true,
  globalAdCode: '',
  redirectAmount: 1,
};

const SESSION_REDIRECT_KEY = 'walkathawa_ad_redirect_count';
const SCRIPT_ELEMENT_ID = 'walkathawa-monetag-script-container';

class AdService {
  private config: AdvertisementSettings = { ...DEFAULT_CONFIG };
  private fetched = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.fetchConfig();
    }
  }

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
        this.fetched = true;
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
   * Applies any global Monetag script tags if present and enabled
   */
  public applyGlobalScript(): void {
    if (typeof document === 'undefined') return;

    // Remove existing script container if present
    const existing = document.getElementById(SCRIPT_ELEMENT_ID);
    if (existing) {
      existing.remove();
    }

    if (!this.config.enabled || !this.config.globalAdCode.trim()) {
      return;
    }

    const code = this.config.globalAdCode.trim();

    // If the code contains <script> tags, parse and execute them
    if (code.includes('<script')) {
      try {
        const container = document.createElement('div');
        container.id = SCRIPT_ELEMENT_ID;
        container.style.display = 'none';

        // Parse scripts
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

  /**
   * Triggers a direct ad redirect if within session limit
   */
  public triggerDirectAd(): void {
    if (!this.config.enabled) return;

    const rawCode = (this.config.globalAdCode || '').trim();
    if (!rawCode) return;

    // Determine destination URL
    let targetUrl = '';
    if (/^https?:\/\//i.test(rawCode)) {
      targetUrl = rawCode.split(/\s+/)[0];
    } else {
      // Find URL inside script or snippet if present
      const urlMatch = rawCode.match(/https?:\/\/[^\s"'`<>]+/i);
      if (urlMatch) {
        targetUrl = urlMatch[0];
      }
    }

    if (!targetUrl) return;

    const currentCount = parseInt(sessionStorage.getItem(SESSION_REDIRECT_KEY) || '0', 10);
    const maxAllowed = this.config.redirectAmount || 1;

    if (currentCount >= maxAllowed) {
      return;
    }

    try {
      sessionStorage.setItem(SESSION_REDIRECT_KEY, (currentCount + 1).toString());
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn('Ad redirect blocked or failed:', e);
    }
  }
}

export const adService = new AdService();
