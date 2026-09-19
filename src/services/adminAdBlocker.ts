/**
 * Admin Panel Ad Blocker & Shield Service
 *
 * Strictly prevents and neutralizes all forms of advertisements (scripts, popunders,
 * banners, iframes, and window.open redirects) exclusively when within the Admin Panel.
 * Public reader pages continue to serve regular advertisements uninterrupted.
 */

const KNOWN_AD_DOMAINS = [
  'profitableratecpmnetwork.com',
  'highrevenueformat.com',
  'omg10.com',
  'alwingulla.com',
  'adsterra',
  'monetag',
  'hilltopads',
  'popcash',
  'popunder',
  'propellerads',
  'clickadu',
  'exoclick',
  'trafficjunky',
  'yllix',
  'bidvertiser',
];

class AdminAdBlocker {
  private isShieldActive = false;
  private observer: MutationObserver | null = null;
  private originalWindowOpen: typeof window.open | null = null;
  private originalAnchorClick: typeof HTMLAnchorElement.prototype.click | null = null;

  /**
   * Evaluates if the current window location corresponds to the Admin Panel.
   */
  public isAdminRoute(): boolean {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname || '';
    const hash = window.location.hash || '';
    return (
      path.startsWith('/admin') ||
      hash === '#admin' ||
      hash.startsWith('#/admin') ||
      hash.startsWith('#admin')
    );
  }

  /**
   * Determines if a given URL or text snippet originates from an ad network.
   */
  public isAdNetworkUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase().trim();
    if (!lower || lower === 'about:blank') return true; // Block blank popunder targets
    return KNOWN_AD_DOMAINS.some((domain) => lower.includes(domain));
  }

  /**
   * Activates the Admin Ad Shield:
   * 1. Removes all ad scripts, containers, and iframes from the DOM.
   * 2. Overrides window.open to intercept ad popups and redirects.
   * 3. Intercepts programmatic anchor clicks targeting ad URLs.
   * 4. Starts a MutationObserver to instantly drop dynamically injected ad elements.
   */
  public enableAdminShield(): void {
    if (typeof window === 'undefined' || this.isShieldActive) return;

    this.isShieldActive = true;

    // 1. Purge any existing ad DOM elements
    this.purgeAdElementsFromDOM();

    // 2. Intercept window.open
    if (!this.originalWindowOpen) {
      this.originalWindowOpen = window.open;
      const self = this;
      window.open = function (
        url?: string | URL,
        target?: string,
        features?: string
      ): Window | null {
        if (self.isShieldActive) {
          const urlStr = url ? String(url) : '';
          if (self.isAdNetworkUrl(urlStr) || !urlStr || urlStr === 'about:blank') {
            console.warn('[AdminAdBlocker] Blocked unauthorized ad popup/redirect:', urlStr);
            return null;
          }
        }
        if (self.originalWindowOpen) {
          return self.originalWindowOpen.call(window, url, target, features);
        }
        return null;
      };
    }

    // 3. Intercept programmatic anchor clicks
    if (!this.originalAnchorClick && typeof HTMLAnchorElement !== 'undefined') {
      this.originalAnchorClick = HTMLAnchorElement.prototype.click;
      const self = this;
      HTMLAnchorElement.prototype.click = function () {
        if (self.isShieldActive) {
          const href = this.href || '';
          if (self.isAdNetworkUrl(href)) {
            console.warn('[AdminAdBlocker] Blocked programmatic ad click:', href);
            return;
          }
        }
        if (self.originalAnchorClick) {
          return self.originalAnchorClick.apply(this);
        }
      };
    }

    // 4. MutationObserver to purge any newly injected ad elements
    if (!this.observer && typeof MutationObserver !== 'undefined') {
      this.observer = new MutationObserver((mutations) => {
        if (!this.isShieldActive) return;

        for (const mutation of mutations) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              if (this.isAdElement(el)) {
                try {
                  el.remove();
                  console.warn('[AdminAdBlocker] Removed dynamically injected ad element in admin panel:', el);
                } catch {
                  // Ignore
                }
              }
            }
          }
        }
      });

      if (document.documentElement) {
        this.observer.observe(document.documentElement, {
          childList: true,
          subtree: true,
        });
      }
    }

    console.info('[AdminAdBlocker] Admin Ad Shield activated: all ads blocked for admin panel.');
  }

  /**
   * Deactivates the Admin Ad Shield when returning to public reader views.
   */
  public disableAdminShield(): void {
    if (typeof window === 'undefined' || !this.isShieldActive) return;

    this.isShieldActive = false;

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.originalWindowOpen) {
      window.open = this.originalWindowOpen;
      this.originalWindowOpen = null;
    }

    if (this.originalAnchorClick && typeof HTMLAnchorElement !== 'undefined') {
      HTMLAnchorElement.prototype.click = this.originalAnchorClick;
      this.originalAnchorClick = null;
    }

    console.info('[AdminAdBlocker] Admin Ad Shield deactivated: public reader mode restored.');
  }

  /**
   * Checks whether a DOM element is associated with advertisements.
   */
  private isAdElement(el: HTMLElement): boolean {
    if (!el) return false;

    // Check by element ID
    const id = (el.id || '').toLowerCase();
    if (
      id === 'walkathawa-ad-script-container' ||
      id.includes('ad-banner') ||
      id.includes('footer-ad') ||
      id.includes('skyscraper-ad') ||
      id.includes('horizontal-ad')
    ) {
      return true;
    }

    // Check script or iframe source
    const tagName = el.tagName.toLowerCase();
    if (tagName === 'script' || tagName === 'iframe') {
      const src = (el.getAttribute('src') || '').toLowerCase();
      if (this.isAdNetworkUrl(src)) {
        return true;
      }
      if (tagName === 'script') {
        const text = (el.textContent || '').toLowerCase();
        if (
          text.includes('atoptions') ||
          text.includes('profitableratecpmnetwork') ||
          text.includes('highrevenueformat')
        ) {
          return true;
        }
      }
    }

    // Check data attribute marker
    if (el.hasAttribute('data-walkathawa-ad')) {
      return true;
    }

    return false;
  }

  /**
   * Searches and removes all ad-related elements from the current DOM tree.
   */
  public purgeAdElementsFromDOM(): void {
    if (typeof document === 'undefined') return;

    // 1. Remove ad script container
    const globalContainer = document.getElementById('walkathawa-ad-script-container');
    if (globalContainer) {
      globalContainer.remove();
    }

    // 2. Remove script tags with ad URLs
    const scripts = document.querySelectorAll('script');
    scripts.forEach((s) => {
      const src = (s.getAttribute('src') || '').toLowerCase();
      const content = (s.textContent || '').toLowerCase();
      if (
        this.isAdNetworkUrl(src) ||
        content.includes('atoptions') ||
        content.includes('profitableratecpmnetwork') ||
        content.includes('highrevenueformat') ||
        s.hasAttribute('data-walkathawa-ad')
      ) {
        s.remove();
      }
    });

    // 3. Remove iframes with ad sources
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((ifr) => {
      const src = (ifr.getAttribute('src') || '').toLowerCase();
      const srcDoc = (ifr.getAttribute('srcdoc') || '').toLowerCase();
      if (
        this.isAdNetworkUrl(src) ||
        srcDoc.includes('highrevenueformat') ||
        srcDoc.includes('atoptions')
      ) {
        ifr.remove();
      }
    });

    // 4. Remove banner containers if present
    const adContainers = document.querySelectorAll(
      '[id*="ad-banner"], [id*="footer-ad"], [id*="skyscraper-ad"], [id*="horizontal-ad"]'
    );
    adContainers.forEach((el) => el.remove());
  }
}

export const adminAdBlocker = new AdminAdBlocker();
