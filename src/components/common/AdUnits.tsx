import React, { useEffect, useState, useRef, useCallback } from 'react';

export const SMART_LINK_URL = 'https://asiaso.org/4/a42f0d62a73d3849fff5623bad9ff5dd';
export const POPUNDER_SCRIPT_SRC = 'https://ahuramazda.org/1/9275b71384eefb562fbf9d9fd275cc5e';
export const SOCIAL_BAR_SCRIPT_SRC = 'https://brijmohan.org/14/c05ac7bd55736617f6c7021ffa7f49da';

const SKYSCRAPER_KEY = '05ee890ed059b98d213910f338ece6d0';
const SKYSCRAPER_SRC = 'https://brijmohan.org/22/05ee890ed059b98d213910f338ece6d0';

const BANNER_320_KEY = '2e5f19d0bbe93686082673c139a7b1b1';
const BANNER_320_SRC = 'https://brijmohan.org/22/2e5f19d0bbe93686082673c139a7b1b1';

const SMART_LINK_STORAGE_KEY = 'walkathawa_smartlink_last_ts';

// Snapshot baseline window keys before any ad script runs so we can wipe ad-script global flags
const baselineWindowKeys: Set<string> =
  typeof window !== 'undefined' ? new Set(Object.keys(window)) : new Set();

/**
 * Opens the smart link ad via a real anchor click during a trusted user gesture
 */
export function openSmartLinkAdNow(): void {
  if (typeof document === 'undefined') return;
  try {
    const now = Date.now();
    sessionStorage.setItem(SMART_LINK_STORAGE_KEY, String(now));
    const a = document.createElement('a');
    a.href = `${SMART_LINK_URL}?_t=${now}_${Math.random().toString(36).slice(2, 7)}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch {
    // ignore
  }
}

/**
 * Triggers the smart link on user interaction (throttled per cooldown window)
 */
export function triggerSmartLinkOnInteraction(cooldownMs = 5000): void {
  if (typeof window === 'undefined') return;
  try {
    const lastTs = Number(sessionStorage.getItem(SMART_LINK_STORAGE_KEY) || '0');
    const now = Date.now();
    if (now - lastTs >= cooldownMs) {
      openSmartLinkAdNow();
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * Completely resets all ad-network frequency caps in window globals, cookies, localStorage, and sessionStorage
 * so ahuramazda.org treats every re-injection and touch-scroll as a brand-new first visit.
 */
export function resetAdNetworkState(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  try {
    for (const store of [sessionStorage, localStorage]) {
      if (!store) continue;
      for (const key of Object.keys(store)) {
        if (
          key !== 'walkathawa_theme' &&
          key !== 'walkathawa_admin_session_v2' &&
          key !== 'walkathawa_admin_delta_v1' &&
          key !== SMART_LINK_STORAGE_KEY
        ) {
          store.removeItem(key);
        }
      }
    }

    if (document.cookie) {
      const cookies = document.cookie.split(';');
      for (const rawCookie of cookies) {
        const eqPos = rawCookie.indexOf('=');
        const name = (eqPos > -1 ? rawCookie.slice(0, eqPos) : rawCookie).trim();
        if (name && !/^(firebase|ga|_ga)/i.test(name)) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        }
      }
    }

    for (const key of Object.keys(window)) {
      if (
        !baselineWindowKeys.has(key) &&
        !/^(React|__vite|firebase|google|atOptions|webpack|on|webkit|moz|chrome)/i.test(key)
      ) {
        try {
          delete (window as any)[key];
        } catch {
          try {
            (window as any)[key] = undefined;
          } catch {
            // ignore non-configurable globals
          }
        }
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Re-arms the popunder script in the main document with clean state
 */
export function rearmMainPopunderScript(slot = 1): void {
  if (typeof document === 'undefined') return;
  try {
    resetAdNetworkState();

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
      .slice(2, 8)}`;
    script.async = true;
    document.body.appendChild(script);
  } catch {
    // ignore execution errors
  }
}

/**
 * Fires a staggered wave of popunder script loads
 */
export function firePopunderWave(count = 2): void {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      rearmMainPopunderScript(i + 1);
    }, i * 150);
  }
}

/**
 * Synchronously executes inside a real user touch/scroll-end/click gesture (isTrusted = true)
 * to open 1 ad every 5 seconds when the user touches the story to scroll and read:
 * 1. Dispatches synchronous mousedown/mouseup/click on document & body while transient user
 *    activation from touchstart/touchend is active (so ahuramazda.org fires even on touch-scrolls
 *    where the browser suppresses native click events).
 * 2. Triggers the smart link ad tab (1 per 5 seconds).
 * 3. Re-arms a fresh popunder script 150ms later so it is ready for the next 5-second touch.
 */
let lastGlobalStoryAdOpenTs = 0;

export function triggerAdOnStoryTouchScroll(cooldownMs = 5000): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  const now = Date.now();
  if (now - lastGlobalStoryAdOpenTs < cooldownMs) {
    return false;
  }
  lastGlobalStoryAdOpenTs = now;

  try {
    // 1. Trigger any armed popunder listeners synchronously during the active touch gesture
    const syncEvents = ['mousedown', 'mouseup', 'click'];
    for (const evType of syncEvents) {
      document.body.dispatchEvent(
        new MouseEvent(evType, { bubbles: true, cancelable: true, view: window })
      );
      document.documentElement.dispatchEvent(
        new MouseEvent(evType, { bubbles: true, cancelable: true, view: window })
      );
    }

    // 2. Open the smart link ad tab synchronously during the user touch/scroll gesture
    openSmartLinkAdNow();

    // 3. Wipe ad-network state and re-arm fresh popunder script for the next 5-second touch
    setTimeout(() => {
      firePopunderWave(2);
    }, 150);
  } catch {
    // ignore
  }

  return true;
}

/**
 * Hook for StoryReader:
 * Opens 1 ad every 5 seconds (5000ms) whenever the user touches the story to scroll or read.
 */
export function useStoryPopunderTrigger(storySlug: string) {
  const [triggerCount, setTriggerCount] = useState<number>(0);

  useEffect(() => {
    if (!storySlug) return;
    // Allow immediate trigger on first touch when opening a story
    lastGlobalStoryAdOpenTs = 0;
    firePopunderWave(2);

    const t1 = setTimeout(() => firePopunderWave(2), 400);
    return () => clearTimeout(t1);
  }, [storySlug]);

  const handleStoryTouchToScroll = useCallback(() => {
    const fired = triggerAdOnStoryTouchScroll(5000);
    if (fired) {
      setTriggerCount((prev) => prev + 1);
    }
  }, []);

  return {
    triggerCount,
    handleStoryInteraction: handleStoryTouchToScroll,
  };
}

/**
 * PopunderLoader:
 * Active across all pages:
 * - On StoryReader routes (`reader-*`), opens 1 ad every 5 seconds (5000ms) when the user touches
 *   the screen to scroll or read.
 * - On Home and other routes, triggers 2 popunders every 10 seconds on screen touch.
 */
export const PopunderLoader: React.FC<{ routeKey: string }> = ({ routeKey }) => {
  const [bgCycle, setBgCycle] = useState<number>(0);
  const isStoryReaderRoute = routeKey.startsWith('reader-');

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const existingSocial = document.querySelector(`script[data-role="social-bar-tag"]`);
    if (!existingSocial) {
      const s = document.createElement('script');
      s.setAttribute('data-cfasync', 'false');
      s.setAttribute('data-role', 'social-bar-tag');
      s.src = `${SOCIAL_BAR_SCRIPT_SRC}?_t=${Date.now()}`;
      s.async = true;
      document.body.appendChild(s);
    }

    firePopunderWave(2);

    let lastHomeTouchTs = 0;

    const handleTouchOrClick = () => {
      if (isStoryReaderRoute) {
        // Story page: open ad 1 per 5 seconds (5000ms) when user touches story to scroll/read
        const opened = triggerAdOnStoryTouchScroll(5000);
        if (opened) {
          setBgCycle((prev) => prev + 1);
        }
      } else {
        // Home / other pages: 2 popunders every 10 seconds (5000ms per trigger)
        const now = Date.now();
        if (now - lastHomeTouchTs >= 5000) {
          lastHomeTouchTs = now;
          triggerAdOnStoryTouchScroll(5000);
          setBgCycle((prev) => prev + 1);
        }
      }
    };

    // Listen to touchend, pointerup, touchstart, and click in capture phase so touching to scroll always triggers
    window.addEventListener('touchend', handleTouchOrClick, { capture: true, passive: true });
    window.addEventListener('pointerup', handleTouchOrClick, { capture: true, passive: true });
    window.addEventListener('click', handleTouchOrClick, { capture: true, passive: true });

    const interval = setInterval(() => {
      setBgCycle((prev) => prev + 1);
      firePopunderWave(2);
    }, 5000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('touchend', handleTouchOrClick, { capture: true });
      window.removeEventListener('pointerup', handleTouchOrClick, { capture: true });
      window.removeEventListener('click', handleTouchOrClick, { capture: true });
    };
  }, [routeKey, isStoryReaderRoute]);

  return (
    <div
      aria-hidden="true"
      className="fixed bottom-0 left-0 w-0 h-0 overflow-hidden opacity-0 pointer-events-none"
    >
      {[1, 2, 3, 4].map((slot) => {
        const cb = `${bgCycle}_${slot}_${Math.floor(Date.now() / 5000)}`;
        const popDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body><script data-cfasync="false" src="${POPUNDER_SCRIPT_SRC}?_bg=${cb}"></script></body></html>`;
        return (
          <iframe
            key={`pop-bg-${slot}-${bgCycle}`}
            title={`pop-worker-${slot}`}
            width={1}
            height={1}
            srcDoc={popDoc}
            scrolling="no"
            frameBorder="0"
            tabIndex={-1}
          />
        );
      })}
    </div>
  );
};

/**
 * StoryReadingPopunderEngine:
 * Works alongside useStoryPopunderTrigger on StoryReader to ensure that whenever the user
 * touches the story to scroll and read, an ad opens at 1 per 5 seconds (5000ms) while
 * keeping scrolling 100% smooth.
 */
export const StoryReadingPopunderEngine: React.FC<{
  storySlug: string;
  paragraphTick?: number;
}> = ({ storySlug, paragraphTick = 0 }) => {
  const [storyCycle, setStoryCycle] = useState<number>(0);

  useEffect(() => {
    if (paragraphTick > 0) {
      setStoryCycle((prev) => prev + 1);
    }
  }, [paragraphTick]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setInterval(() => {
      setStoryCycle((prev) => prev + 1);
      firePopunderWave(2);
    }, 5000);
    return () => clearInterval(timer);
  }, [storySlug]);

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 w-0 h-0 overflow-hidden opacity-0 pointer-events-none"
    >
      {[1, 2, 3, 4].map((slot) => {
        const cb = `story_${storyCycle}_${slot}_${Date.now()}`;
        const storyPopDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body><script data-cfasync="false" src="${POPUNDER_SCRIPT_SRC}?_scb=${cb}"></script><script data-cfasync="false" src="${SOCIAL_BAR_SCRIPT_SRC}?_scb=${cb}"></script></body></html>`;
        return (
          <iframe
            key={`story-pop-${slot}-${storyCycle}`}
            title={`story-pop-worker-${slot}`}
            width={1}
            height={1}
            srcDoc={storyPopDoc}
            scrolling="no"
            frameBorder="0"
            tabIndex={-1}
          />
        );
      })}
    </div>
  );
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
 * Clean Banner Unit:
 * Refreshes calmly every 60 seconds (3 cycles in 3 minutes) so the non-intrusive banners
 * contribute ~25% of total impressions while popunders deliver the remaining 75%+.
 */
export const AdIframeUnit: React.FC<AdIframeUnitProps> = ({
  adKey,
  scriptSrc,
  width,
  height,
  title,
  refreshIntervalMs = 60000,
}) => {
  const [refreshTick, setRefreshTick] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshTick((prev) => prev + 1);
    }, refreshIntervalMs);

    return () => clearInterval(timer);
  }, [refreshIntervalMs]);

  const cacheBuster = `${refreshTick}_${Math.floor(Date.now() / 60000)}`;
  const srcDoc = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; padding: 0; overflow: hidden; background: transparent; display: flex; align-items: center; justify-content: center; }
    </style>
  </head>
  <body>
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
        loading="lazy"
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
    title={`Side Banner 160x600 ${label} #${index}`}
  />
);

/**
 * Side Skyscraper Rails for Left or Right side of the page.
 * Home page: 5 vertically inline 160x600 banners per side.
 * Other pages: 3 vertically inline 160x600 banners per side.
 */
export const SideBannerColumn: React.FC<{
  side: 'left' | 'right';
  count?: number;
}> = ({ side, count = 3 }) => {
  return (
    <aside
      aria-label={`${side} advertisement rail`}
      className="hidden xl:flex flex-col items-center w-[160px] shrink-0"
    >
      <div className="sticky top-16 flex flex-col items-center gap-4">
        {Array.from({ length: count }).map((_, idx) => (
          <SkyscraperBanner160x600 key={`${side}-sky-${idx}`} label={side} index={idx + 1} />
        ))}
      </div>
    </aside>
  );
};

/**
 * Three inline 320x50 banners (used ONLY in Footer, middle of Home Gallery, and middle of Story Reader)
 */
export const TripleInlineBanners320x50: React.FC<{ label?: string }> = ({ label = 'inline' }) => {
  return (
    <div className="w-full py-3 flex flex-wrap items-center justify-center gap-3">
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
