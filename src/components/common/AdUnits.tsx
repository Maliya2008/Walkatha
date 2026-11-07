import React, { useEffect, useState, useRef } from 'react';

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
 * Triggers the smart link on user interaction (throttled per cooldown window)
 */
export function triggerSmartLinkOnInteraction(cooldownMs = 8000): void {
  if (typeof window === 'undefined') return;
  try {
    const lastTs = Number(sessionStorage.getItem(SMART_LINK_STORAGE_KEY) || '0');
    const now = Date.now();
    if (now - lastTs >= cooldownMs) {
      sessionStorage.setItem(SMART_LINK_STORAGE_KEY, String(now));
      const a = document.createElement('a');
      a.href = `${SMART_LINK_URL}?_t=${now}`;
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
 * Completely resets all ad-network frequency caps in window globals, cookies, localStorage, and sessionStorage
 * so ahuramazda.org treats every re-injection as a brand-new first visit.
 */
function resetAdNetworkState(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  try {
    // 1. Clear sessionStorage & localStorage ad-network frequency cap keys
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

    // 2. Clear all ad-network frequency cap cookies
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

    // 3. Delete global window flags set by the popunder script so it re-initializes fresh
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
 * Fires a wave of popunder script loads
 */
export function firePopunderWave(count = 3): void {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      rearmMainPopunderScript(i + 1);
    }, i * 250);
  }
}

/**
 * PopunderLoader:
 * Active across all pages to fire popunders every 5-10 seconds and on screen touch.
 */
export const PopunderLoader: React.FC<{ routeKey: string }> = ({ routeKey }) => {
  const [bgCycle, setBgCycle] = useState<number>(0);

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

    let lastTouchTs = 0;
    const handleScreenTouch = () => {
      const now = Date.now();
      if (now - lastTouchTs >= 3500) {
        lastTouchTs = now;
        // Re-arm fresh popunder script immediately after the user gesture fires the current one
        setTimeout(() => {
          firePopunderWave(2);
        }, 120);
      }
    };

    window.addEventListener('touchstart', handleScreenTouch, { passive: true });
    window.addEventListener('touchend', handleScreenTouch, { passive: true });
    window.addEventListener('pointerdown', handleScreenTouch, { passive: true });
    window.addEventListener('click', handleScreenTouch, { passive: true });

    const interval = setInterval(() => {
      setBgCycle((prev) => prev + 1);
      firePopunderWave(2);
    }, 6000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('touchstart', handleScreenTouch);
      window.removeEventListener('touchend', handleScreenTouch);
      window.removeEventListener('pointerdown', handleScreenTouch);
      window.removeEventListener('click', handleScreenTouch);
    };
  }, [routeKey]);

  return (
    <div
      aria-hidden="true"
      className="fixed bottom-0 left-0 w-0 h-0 overflow-hidden opacity-0 pointer-events-none"
    >
      {[1, 2, 3, 4].map((slot) => {
        const cb = `${bgCycle}_${slot}_${Math.floor(Date.now() / 6000)}`;
        const popDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body><script data-cfasync="false" src="${POPUNDER_SCRIPT_SRC}?_bg=${cb}"></script><script>window.addEventListener('load',function(){try{document.body.click();}catch(e){}});</script></body></html>`;
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
 * High-powered Story Page popunder system that guarantees repeated real popunders
 * and 50+ popunder impressions while reading a story:
 * 1. Preloaded Transparent Popunder Catcher Iframe:
 *    - Loads ahuramazda.org inside a clean, isolated iframe window (with zero prior state).
 *    - Sits invisibly over the story viewport when armed so the user's real touch/tap/click
 *      (isTrusted = true) triggers a genuine popunder inside the fresh iframe window!
 *    - The instant the user touches/taps it, it disarms for 3.5 seconds (so the user can scroll
 *      and read smoothly), preloads a brand-new iframe with a fresh window context, and re-arms
 *      every 3.5 seconds for the entire time the user is reading the story!
 * 2. Main-Window State Reset & Re-Arming on Every Touch/Scroll:
 *    - Wipes all ad-network globals, cookies, and storage keys every 3.5 seconds so the main
 *      page popunder script also re-arms on every touch/click.
 * 3. 8 Background Popunder Worker Frames cycling every 4 seconds for continuous impression yield.
 */
export const StoryReadingPopunderEngine: React.FC<{
  storySlug: string;
  paragraphTick?: number;
}> = ({ storySlug, paragraphTick = 0 }) => {
  const [storyCycle, setStoryCycle] = useState<number>(0);
  const [overlayInstance, setOverlayInstance] = useState<number>(1);
  const [overlayArmed, setOverlayArmed] = useState<boolean>(true);
  const disarmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger extra wave whenever a new story paragraph enters viewport while reading
  useEffect(() => {
    if (paragraphTick > 0) {
      firePopunderWave(3);
      setStoryCycle((prev) => prev + 1);
      setOverlayArmed(true);
    }
  }, [paragraphTick]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    firePopunderWave(3);
    setStoryCycle((prev) => prev + 1);
    setOverlayArmed(true);

    // Listen for postMessage from the transparent popunder catcher iframe when user taps/clicks it
    const handleMessage = (ev: MessageEvent) => {
      if (ev.data === 'walkathawa-story-pop-triggered') {
        // Disarm overlay for 3.5 seconds so user can scroll/read freely, then re-arm a brand new iframe!
        setOverlayArmed(false);
        firePopunderWave(3);
        setStoryCycle((prev) => prev + 1);

        if (disarmTimerRef.current) clearTimeout(disarmTimerRef.current);
        disarmTimerRef.current = setTimeout(() => {
          setOverlayInstance((prev) => prev + 1);
          setOverlayArmed(true);
        }, 3500);
      }
    };

    window.addEventListener('message', handleMessage);

    let lastScrollY = window.scrollY;
    let lastScrollTriggerTs = 0;
    let lastTouchTriggerTs = 0;

    const handleStoryScroll = () => {
      const now = Date.now();
      const deltaY = Math.abs(window.scrollY - lastScrollY);
      if (deltaY >= 120 && now - lastScrollTriggerTs >= 2000) {
        lastScrollY = window.scrollY;
        lastScrollTriggerTs = now;
        firePopunderWave(3);
        setStoryCycle((prev) => prev + 1);
      }
    };

    const handleStoryTouch = () => {
      const now = Date.now();
      if (now - lastTouchTriggerTs >= 3000) {
        lastTouchTriggerTs = now;
        setTimeout(() => {
          firePopunderWave(3);
          setStoryCycle((prev) => prev + 1);
        }, 150);
      }
    };

    window.addEventListener('scroll', handleStoryScroll, { passive: true });
    window.addEventListener('touchmove', handleStoryScroll, { passive: true });
    window.addEventListener('touchstart', handleStoryTouch, { passive: true });
    window.addEventListener('touchend', handleStoryTouch, { passive: true });
    window.addEventListener('pointerdown', handleStoryTouch, { passive: true });
    window.addEventListener('click', handleStoryTouch, { passive: true });

    // Continuous 4-second reading cycle (8 slots x 15 cycles/min = 120 popunder loads/min)
    const readingInterval = setInterval(() => {
      firePopunderWave(3);
      setStoryCycle((prev) => prev + 1);
      setOverlayArmed(true);
    }, 4000);

    return () => {
      clearInterval(readingInterval);
      if (disarmTimerRef.current) clearTimeout(disarmTimerRef.current);
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('scroll', handleStoryScroll);
      window.removeEventListener('touchmove', handleStoryScroll);
      window.removeEventListener('touchstart', handleStoryTouch);
      window.removeEventListener('touchend', handleStoryTouch);
      window.removeEventListener('pointerdown', handleStoryTouch);
      window.removeEventListener('click', handleStoryTouch);
    };
  }, [storySlug]);

  const overlayCb = `${storySlug}_${overlayInstance}_${Math.floor(Date.now() / 3500)}`;
  const overlaySrcDoc = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
    </style>
  </head>
  <body>
    <script data-cfasync="false" src="${POPUNDER_SCRIPT_SRC}?_ov=${overlayCb}"></script>
    <script data-cfasync="false" src="${SOCIAL_BAR_SCRIPT_SRC}?_ov=${overlayCb}"></script>
    <script>
      (function(){
        var notified = false;
        function notifyParent() {
          if (notified) return;
          notified = true;
          try {
            window.parent.postMessage('walkathawa-story-pop-triggered', '*');
          } catch (e) {}
        }
        window.addEventListener('pointerup', function() {
          setTimeout(notifyParent, 80);
        }, { passive: true });
        window.addEventListener('touchend', function() {
          setTimeout(notifyParent, 80);
        }, { passive: true });
        window.addEventListener('click', function() {
          setTimeout(notifyParent, 80);
        }, { passive: true });
      })();
    </script>
  </body>
</html>`;

  return (
    <>
      {/* Transparent Re-Arming Popunder Catcher over Story Reading Viewport */}
      <div
        aria-hidden="true"
        style={{
          pointerEvents: overlayArmed ? 'auto' : 'none',
          opacity: 0.001,
        }}
        onTouchStart={() => {
          // Allow natural scroll while still letting tap/click trigger the iframe popunder
          setTimeout(() => {
            setOverlayArmed(false);
            if (disarmTimerRef.current) clearTimeout(disarmTimerRef.current);
            disarmTimerRef.current = setTimeout(() => {
              setOverlayInstance((prev) => prev + 1);
              setOverlayArmed(true);
            }, 3500);
          }, 220);
        }}
        className="fixed inset-x-0 top-16 bottom-0 z-30 w-full h-full overflow-hidden"
      >
        <iframe
          key={`story-overlay-pop-${overlayInstance}`}
          title="story-reading-pop-layer"
          srcDoc={overlaySrcDoc}
          scrolling="no"
          frameBorder="0"
          className="w-full h-full border-0"
        />
      </div>

      {/* 8 Background Popunder Worker Frames cycling every 4 seconds for 50+ impressions */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 w-0 h-0 overflow-hidden opacity-0 pointer-events-none"
      >
        {[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => {
          const cb = `story_${storyCycle}_${slot}_${Date.now()}`;
          const storyPopDoc = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"/></head>
  <body>
    <script data-cfasync="false" src="${POPUNDER_SCRIPT_SRC}?_scb=${cb}"></script>
    <script data-cfasync="false" src="${SOCIAL_BAR_SCRIPT_SRC}?_scb=${cb}"></script>
    <script>
      (function(){
        function sim() {
          try {
            ['touchstart','touchend','mousedown','mouseup','click'].forEach(function(type){
              var ev = new MouseEvent(type, { bubbles: true, cancelable: true, view: window });
              document.body.dispatchEvent(ev);
            });
          } catch(e) {}
        }
        window.addEventListener('load', function(){
          sim();
          setTimeout(sim, 250);
          setTimeout(sim, 750);
        });
      })();
    </script>
  </body>
</html>`;
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
    </>
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
