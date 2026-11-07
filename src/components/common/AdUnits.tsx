import React, { useEffect, useState } from 'react';

export const SMART_LINK_URL = 'https://asiaso.org/4/a42f0d62a73d3849fff5623bad9ff5dd';
export const POPUNDER_SCRIPT_SRC = 'https://ahuramazda.org/1/9275b71384eefb562fbf9d9fd275cc5e';
export const SOCIAL_BAR_SCRIPT_SRC = 'https://brijmohan.org/14/c05ac7bd55736617f6c7021ffa7f49da';

const SKYSCRAPER_KEY = '05ee890ed059b98d213910f338ece6d0';
const SKYSCRAPER_SRC = 'https://brijmohan.org/22/05ee890ed059b98d213910f338ece6d0';

const BANNER_320_KEY = '2e5f19d0bbe93686082673c139a7b1b1';
const BANNER_320_SRC = 'https://brijmohan.org/22/2e5f19d0bbe93686082673c139a7b1b1';

const SMART_LINK_STORAGE_KEY = 'walkathawa_smartlink_last_ts';

/**
 * Triggers the smart link on user interaction (throttled to avoid blocking navigation)
 */
export function triggerSmartLinkOnInteraction(cooldownMs = 30000): void {
  if (typeof window === 'undefined') return;
  try {
    const lastTs = Number(sessionStorage.getItem(SMART_LINK_STORAGE_KEY) || '0');
    const now = Date.now();
    if (now - lastTs >= cooldownMs) {
      sessionStorage.setItem(SMART_LINK_STORAGE_KEY, String(now));
      const a = document.createElement('a');
      a.href = SMART_LINK_URL;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * Clears any ad-network frequency cap keys in storage so popunders can fire repeatedly
 */
function clearPopunderCooldownStorage(): void {
  try {
    for (const store of [sessionStorage, localStorage]) {
      if (!store) continue;
      for (const key of Object.keys(store)) {
        if (
          key !== 'walkathawa_theme' &&
          key !== 'walkathawa_admin_session_v2' &&
          /pop|under|tab|ad|timer|interval|cap|freq|ahura|brij/i.test(key)
        ) {
          store.removeItem(key);
        }
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Injects a single fresh popunder script instance and dispatches interaction events
 */
function fireSinglePopunder(slot = 1): void {
  if (typeof document === 'undefined') return;
  try {
    clearPopunderCooldownStorage();

    const selector = `script[data-role="popunder-tag-${slot}"]`;
    const oldScript = document.querySelector(selector);
    if (oldScript && oldScript.parentNode) {
      oldScript.parentNode.removeChild(oldScript);
    }

    const script = document.createElement('script');
    script.setAttribute('data-cfasync', 'false');
    script.setAttribute('data-role', `popunder-tag-${slot}`);
    script.src = `${POPUNDER_SCRIPT_SRC}?_t=${Date.now()}_${slot}_${Math.random()
      .toString(36)
      .slice(2, 7)}`;
    script.async = true;
    document.body.appendChild(script);

    const evNames = ['touchstart', 'touchend', 'mousedown', 'mouseup', 'click'];
    for (const evName of evNames) {
      const ev = new MouseEvent(evName, {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      document.body.dispatchEvent(ev);
    }
  } catch {
    // ignore execution errors
  }
}

/**
 * Fires 2 popunders per 10-second window (Popunder #1 immediately, Popunder #2 at +400ms)
 */
export function fireDoublePopunder(): void {
  fireSinglePopunder(1);
  setTimeout(() => {
    fireSinglePopunder(2);
  }, 400);
}

/**
 * PopunderLoader:
 * - Fires 2 popunders every 10 seconds when the user touches/interacts with the screen
 *   on the Home page and Story pages (up to 2 popunders per 10-second window on touch/click/scroll).
 * - Also runs a 10-second interval that re-arms and fires 2 popunders every 10 seconds.
 * - Loads and refreshes the Social Bar script.
 */
export const PopunderLoader: React.FC<{ routeKey: string }> = ({ routeKey }) => {
  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    // 1. Ensure Social Bar script is active
    const existingSocial = document.querySelector(`script[data-role="social-bar-tag"]`);
    if (!existingSocial) {
      const s = document.createElement('script');
      s.setAttribute('data-cfasync', 'false');
      s.setAttribute('data-role', 'social-bar-tag');
      s.src = `${SOCIAL_BAR_SCRIPT_SRC}?_t=${Date.now()}`;
      s.async = true;
      document.body.appendChild(s);
    }

    // 2. Initial 2x popunder burst on route load
    fireDoublePopunder();

    // 3. Track 10-second sliding window for screen touches (2 popunders every 10 seconds on touch)
    let windowStartTs = Date.now();
    let popCountInWindow = 0;
    let lastSingleTouchTs = 0;

    const handleScreenTouchOrClick = () => {
      const now = Date.now();
      // Reset counter every 10 seconds (10,000 ms)
      if (now - windowStartTs >= 10000) {
        windowStartTs = now;
        popCountInWindow = 0;
      }

      // Allow 2 popunders within every 10-second window when user touches screen
      if (popCountInWindow < 2 && now - lastSingleTouchTs >= 800) {
        lastSingleTouchTs = now;
        popCountInWindow += 2;
        fireDoublePopunder();
      }
    };

    window.addEventListener('touchstart', handleScreenTouchOrClick, { passive: true });
    window.addEventListener('touchend', handleScreenTouchOrClick, { passive: true });
    window.addEventListener('pointerdown', handleScreenTouchOrClick, { passive: true });
    window.addEventListener('click', handleScreenTouchOrClick, { passive: true });

    // 4. Also trigger 2 popunders every 10 seconds automatically
    const interval = setInterval(() => {
      windowStartTs = Date.now();
      popCountInWindow = 0;
      fireDoublePopunder();
    }, 10000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('touchstart', handleScreenTouchOrClick);
      window.removeEventListener('touchend', handleScreenTouchOrClick);
      window.removeEventListener('pointerdown', handleScreenTouchOrClick);
      window.removeEventListener('click', handleScreenTouchOrClick);
    };
  }, [routeKey]);

  return null;
};

interface AdIframeUnitProps {
  adKey: string;
  scriptSrc: string;
  width: number;
  height: number;
  title: string;
  refreshIntervalMs?: number;
}

/**
 * Auto-refreshing AdIframeUnit:
 * Reloads its ad script every 20 seconds (9 cycles in 3 minutes) and uses eager loading
 * so a single user generates 100+ banner impressions within a 3-minute session.
 */
export const AdIframeUnit: React.FC<AdIframeUnitProps> = ({
  adKey,
  scriptSrc,
  width,
  height,
  title,
  refreshIntervalMs = 20000,
}) => {
  const [refreshTick, setRefreshTick] = useState<number>(0);

  useEffect(() => {
    const jitter = Math.floor(Math.random() * 2500);
    const timer = setInterval(() => {
      setRefreshTick((prev) => prev + 1);
    }, refreshIntervalMs + jitter);

    return () => clearInterval(timer);
  }, [refreshIntervalMs]);

  const cacheBuster = `${refreshTick}_${Math.floor(Date.now() / 15000)}`;
  const srcDoc = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; padding: 0; overflow: hidden; background: transparent; display: flex; align-items: center; justify-content: center; }
    </style>
  </head>
  <body>
    <!-- cycle: ${cacheBuster} -->
    <script>
      atOptions = {
        'key' : '${adKey}',
        'format' : 'iframe',
        'height' : ${height},
        'width' : ${width},
        'params' : {}
      };
    </script>
    <script src="${scriptSrc}?_cb=${cacheBuster}"></script>
  </body>
</html>`;

  return (
    <div
      style={{ width: `${width}px`, height: `${height}px` }}
      className="shrink-0 overflow-hidden rounded bg-slate-100/50 dark:bg-[#0d152b]/50 flex items-center justify-center"
    >
      <iframe
        key={`iframe-${title}-${refreshTick}`}
        title={title}
        width={width}
        height={height}
        srcDoc={srcDoc}
        scrolling="no"
        frameBorder="0"
        loading="eager"
        className="w-full h-full border-0 overflow-hidden"
      />
    </div>
  );
};

/**
 * Single 160x600 Vertical Skyscraper Banner
 */
export const SkyscraperBanner160x600: React.FC<{ index?: number; label?: string }> = ({
  index = 1,
  label = 'side',
}) => (
  <AdIframeUnit
    adKey={SKYSCRAPER_KEY}
    scriptSrc={SKYSCRAPER_SRC}
    width={160}
    height={600}
    title={`Banner 160x600 ${label} #${index}`}
  />
);

/**
 * Side Skyscraper Rails for Left or Right side of the page (5 vertically inline on both sides).
 */
export const SideBannerColumn: React.FC<{
  side: 'left' | 'right';
  count?: number;
}> = ({ side, count = 5 }) => {
  return (
    <aside
      aria-label={`${side} advertisement rail`}
      className="hidden xl:flex flex-col items-center w-[160px] shrink-0"
    >
      <div className="sticky top-16 flex flex-col items-center gap-3">
        {Array.from({ length: count }).map((_, idx) => (
          <SkyscraperBanner160x600 key={`${side}-sky-${idx}`} label={side} index={idx + 1} />
        ))}
      </div>
    </aside>
  );
};

/**
 * Two side-by-side 160x600 banners visible on ALL screen sizes (including mobile & tablet)
 */
export const DualSkyscraperInline160x600: React.FC<{ label?: string }> = ({
  label = 'inline-sky',
}) => {
  return (
    <div className="w-full py-2 flex flex-wrap items-center justify-center gap-3">
      <SkyscraperBanner160x600 label={label} index={1} />
      <SkyscraperBanner160x600 label={label} index={2} />
    </div>
  );
};

/**
 * Three inline 320x50 banners
 */
export const TripleInlineBanners320x50: React.FC<{ label?: string }> = ({ label = 'inline' }) => {
  return (
    <div className="w-full py-2 flex flex-wrap items-center justify-center gap-2.5">
      {[1, 2, 3].map((num) => (
        <AdIframeUnit
          key={`${label}-320x50-${num}`}
          adKey={BANNER_320_KEY}
          scriptSrc={BANNER_320_SRC}
          width={320}
          height={50}
          title={`Banner 320x50 ${label} #${num}`}
        />
      ))}
    </div>
  );
};

/**
 * Six inline 320x50 banners (2 rows of 3 banners) for high-impression zones
 */
export const SixInlineBanners320x50: React.FC<{ label?: string }> = ({ label = 'cluster' }) => {
  return (
    <div className="w-full py-2 space-y-2">
      <TripleInlineBanners320x50 label={`${label}-row1`} />
      <TripleInlineBanners320x50 label={`${label}-row2`} />
    </div>
  );
};

/**
 * Persistent Sticky Bottom Banner Bar (stays visible while scrolling on mobile & desktop)
 */
export const StickyBottomBannerBar: React.FC = () => {
  return (
    <div className="sticky bottom-0 z-40 w-full bg-white/95 dark:bg-[#090e1d]/95 backdrop-blur border-t border-slate-200 dark:border-[#1c2b4f] py-1 px-2 shadow-lg">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-2">
        {[1, 2, 3].map((num) => (
          <AdIframeUnit
            key={`sticky-bottom-320x50-${num}`}
            adKey={BANNER_320_KEY}
            scriptSrc={BANNER_320_SRC}
            width={320}
            height={50}
            title={`Sticky Bottom Banner 320x50 #${num}`}
            refreshIntervalMs={18000}
          />
        ))}
      </div>
    </div>
  );
};
