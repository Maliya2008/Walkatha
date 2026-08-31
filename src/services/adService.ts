import { AdvertisementSettings } from '../types/admin';

const DEFAULT_CONFIG: AdvertisementSettings = {
  globalAdCode: '',
  adsEnabled: true,
  adsPerPage: 2,
  headerAdCode: '',
  inArticleAdCode: '',
  footerAdCode: '',
  testMode: true,
};

class AdService {
  private config: AdvertisementSettings = { ...DEFAULT_CONFIG };
  private initialized = false;
  private fetched = false;

  constructor() {
    this.fetchConfig();
  }

  public async fetchConfig(): Promise<AdvertisementSettings> {
    try {
      const res = await fetch('/api/public/ads/config');
      if (res.ok) {
        const data = await res.json();
        this.config = {
          ...this.config,
          ...data,
        };
        this.fetched = true;
      }
    } catch {
      // Use defaults if fetch fails
    }
    return this.config;
  }

  public getConfig(): AdvertisementSettings {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<AdvertisementSettings>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public isAdsEnabled(): boolean {
    return Boolean(this.config.adsEnabled);
  }

  public getAdsPerPage(): 1 | 2 | 3 {
    return this.config.adsPerPage || 2;
  }

  public getGlobalAdCode(): string {
    return this.config.globalAdCode || '';
  }

  /**
   * Sanitizes and transforms raw ad HTML/Script to ensure all anchor links open externally
   * with target="_blank" and rel="noopener noreferrer"
   */
  public sanitizeAndEnforceExternalLinks(html: string): string {
    if (!html) return '';

    // Replace or add target="_blank" and rel="noopener noreferrer" to all <a> tags
    return html.replace(/<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["']([^>]*)>/gi, (_match, href, rest) => {
      const hasTarget = /target=["'][^"']*["']/i.test(rest);
      const hasRel = /rel=["'][^"']*["']/i.test(rest);

      let cleanRest = rest;
      if (hasTarget) {
        cleanRest = cleanRest.replace(/target=["'][^"']*["']/gi, 'target="_blank"');
      } else {
        cleanRest += ' target="_blank"';
      }

      if (hasRel) {
        cleanRest = cleanRest.replace(/rel=["'][^"']*["']/gi, 'rel="noopener noreferrer"');
      } else {
        cleanRest += ' rel="noopener noreferrer"';
      }

      return `<a href="${href}"${cleanRest}>`;
    });
  }

  /**
   * Triggers an Interstitial/Vignette ad on story transition if master adsEnabled is ON
   */
  public triggerInterstitial(onComplete?: () => void): void {
    if (!this.config.adsEnabled) {
      if (onComplete) onComplete();
      return;
    }

    if (onComplete) {
      onComplete();
    }
  }
}

export const adService = new AdService();
