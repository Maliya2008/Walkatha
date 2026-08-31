import { MonetagAdConfig } from '../types/story';

/**
 * Monetag Ad Service
 * Configures zone IDs, placeholder rendering, and provides future script injection hooks.
 * Does not hardcode fake or spam ads; provides dedicated container components
 * conforming to Monetag banner & in-page specifications.
 */

const DEFAULT_CONFIG: MonetagAdConfig = {
  headerZoneId: 'monetag-header-zone-728x90',
  inArticleZoneId: 'monetag-inarticle-zone-300x250',
  sidebarZoneId: 'monetag-sidebar-zone-300x600',
  footerZoneId: 'monetag-footer-zone-728x90',
  interstitialZoneId: 'monetag-interstitial-zone-vignette',
  enabled: true,
  testMode: true, // In testMode, subtle clean developer placeholders show where Monetag scripts render
};

class AdService {
  private config: MonetagAdConfig = { ...DEFAULT_CONFIG };
  private initialized = false;

  public getConfig(): MonetagAdConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<MonetagAdConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public toggleTestMode(): boolean {
    this.config.testMode = !this.config.testMode;
    return this.config.testMode;
  }

  /**
   * Initializes Monetag SDK when real zone IDs are provided in production.
   */
  public initMonetagSdk(): void {
    if (this.initialized || !this.config.enabled || this.config.testMode) return;
    
    // In production with live Monetag scripts:
    // e.g., dynamically loads Monetag script tag <script src="//monetag-sdk-url..."></script>
    this.initialized = true;
    console.info('[Monetag SDK] Initialized with zones:', this.config);
  }

  /**
   * Triggers an Interstitial ad on story transition if enabled
   */
  public triggerInterstitial(onComplete?: () => void): void {
    if (!this.config.enabled) {
      if (onComplete) onComplete();
      return;
    }

    // In production, invoke Monetag interstitial show function:
    // window.showMonetagInterstitial?.()
    if (onComplete) {
      onComplete();
    }
  }
}

export const adService = new AdService();
