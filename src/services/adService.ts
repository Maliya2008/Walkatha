import { DirectAdSettings } from '../types/admin';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const DEFAULT_CONFIG: DirectAdSettings = {
  globalDirectLink: '',
  enabled: true,
  maxTriggers: 1,
};

class AdService {
  private config: DirectAdSettings = { ...DEFAULT_CONFIG };
  private fetched = false;

  constructor() {
    this.fetchConfig();
  }

  public async fetchConfig(): Promise<DirectAdSettings> {
    try {
      const docRef = doc(db, 'advertisements', 'settings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        this.config = {
          ...this.config,
          ...docSnap.data(),
        };
        this.fetched = true;
      }
    } catch {
      // Use defaults if fetch fails
    }
    return this.config;
  }

  public getConfig(): DirectAdSettings {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<DirectAdSettings>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public isAdsEnabled(): boolean {
    return Boolean(this.config.enabled);
  }

  public getGlobalDirectLink(): string {
    return this.config.globalDirectLink || '';
  }

  public triggerDirectAd(storySpecificLink?: string): void {
    if (!this.config.enabled) return;
    
    const adUrl = (storySpecificLink || this.config.globalDirectLink || '').trim();
    if (!adUrl) return;

    const SESSION_KEY = 'walkathawa_ad_triggers';
    const currentTriggers = parseInt(sessionStorage.getItem(SESSION_KEY) || '0', 10);
    const maxTriggers = this.config.maxTriggers || 1;

    if (currentTriggers >= maxTriggers) {
      return; 
    }

    try {
      sessionStorage.setItem(SESSION_KEY, (currentTriggers + 1).toString());
      window.open(adUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn("Popup blocked or failed to open ad.", e);
    }
  }
}

export const adService = new AdService();
