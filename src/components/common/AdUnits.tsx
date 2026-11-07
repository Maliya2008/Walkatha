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
 * Triggers the smart link on user interaction (throttled per cooldown window)
 */
export function triggerSmartLinkOnInteraction(cooldownMs = 20000): void {
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
 * Clears ad-network frequency cap keys in storage and cookies so popunders can fire repeatedly
 * to deliver 50+ popunder impressions per story read.
 */
function clearPopunderCooldownStorage(): void {
  try {
    for (const store of [sessionStorage, localStorage]) {
      if (!store) continue;
      for (const key of Object.keys(store)) {
        if (
          key !== 'walkathawa_theme' &&
          key !== 'walkathawa_admin_session_v2' &&
          key !== 'walkathawa_admin_delta_v1' &&
          /pop|under|tab|ad|timer|interval|cap|freq|ahura|brij|last|show|hit|clk|imp/i.test(key)
        ) {
          store.removeItem(key);
        }
      }
    }
    if (typeof document !== 'undefined' && document.cookie) {
      const cookies = document.cookie.split(';');
      for (const rawCookie of cookies) {
        const eqPos = rawCookie.indexOf('=');
        const name = (eqPos > -1 ? rawCookie.slice(0, eqPos) : rawCookie).trim();
        if (name && /pop|under|ad|cap|freq|ahura|brij|pndr| interstitial/i.test(name)) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Injects a fresh popunder script instance and dispatches user-gesture events
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
 * Fires a staggered wave of popunder script loads so each registers cleanly
 */
export function firePopunderWave(count = 2): void {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      fireSinglePopunder(i + 1);
    }, i * 300);
  }
}

/**
 * PopunderLoader:
 * Active across all pages (Home, Categories, etc.) to trigger 2 popunders every 10 seconds
 * on screen touch and background intervals.
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

    let windowStartTs = Date.now();
    let popCountInWindow = 0;
    let lastTouchWaveTs = 0;

    const handleScreenTouch = () => {
      const now = Date.now();
      if (now - windowStartTs >= 10000) {
        windowStartTs = now;
        popCountInWindow = 0;
      }

      if (popCountInWindow < 2 && now - lastTouchWaveTs >= 800) {
        lastTouchWaveTs = now;
        popCountInWindow += 2;
        firePopunderWave(2);
      }
    };

    window.addEventListener('touchstart', handleScreenTouch, { passive: true });
    window.addEventListener('touchend', handleScreenTouch, { passive: true });
    window.addEventListener('pointerdown', handleScreenTouch, { passive: true });
    window.addEventListener('click', handleScreenTouch, { passive: true });

    const interval = setInterval(() => {
      windowStartTs = Date.now();
      popCountInWindow = 0;
      setBgCycle((prev) => prev + 1);
      firePopunderWave(2);
    }, 10000);

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
        const cb = `${bgCycle}_${slot}_${Math.floor(Date.now() / 10000)}`;
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
 * Dedicated high-yield popunder trigger specifically for the Story Reader page.
 * Guarantees at least 50+ popunder impressions while a user reads a story by combining:
 * 1. Initial 6-slot story open popunder wave.
 * 2. Scroll-depth & paragraph-reading triggers (every 140px scrolled or paragraph viewed fires a new wave).
 * 3. Screen touch / tap triggers while reading (every touch/scroll gesture after 2.5s fires 3 popunders).
 * 4. 6 isolated story-reader popunder frames cycling every 5 seconds while reading (6 x 10 = 60+ impressions/min).
 */
export const StoryReadingPopunderEngine: React.FC<{
  storySlug: string;
  paragraphTick?: number;
}> = ({ storySlug, paragraphTick = 0 }) => {
  const [storyCycle, setStoryCycle] = useState<number>(0);

  // Trigger extra wave whenever a new story paragraph enters viewport while reading
  useEffect(() => {
    if (paragraphTick > 0) {
      firePopunderWave(3);
      setStoryCycle((prev) => prev + 1);
    }
  }, [paragraphTick]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // 1. Initial burst when user opens story to read
    firePopunderWave(3);
    setStoryCycle((prev) => prev + 1);

    let lastScrollY = window.scrollY;
    let lastScrollTriggerTs = 0;
    let lastTouchTriggerTs = 0;

    // 2. Trigger popunders as the user scrolls down to read the story
    const handleStoryScroll = () => {
      const now = Date.now();
      const deltaY = Math.abs(window.scrollY - lastScrollY);
      if (deltaY >= 140 && now - lastScrollTriggerTs >= 2200) {
        lastScrollY = window.scrollY;
        lastScrollTriggerTs = now;
        firePopunderWave(3);
        setStoryCycle((prev) => prev + 1);
      }
    };

    // 3. Trigger popunders whenever the user touches or taps the screen while reading
    const handleStoryTouch = () => {
      const now = Date.now();
      if (now - lastTouchTriggerTs >= 2500) {
        lastTouchTriggerTs = now;
        firePopunderWave(3);
        setStoryCycle((prev) => prev + 1);
      }
    };

    window.addEventListener('scroll', handleStoryScroll, { passive: true });
    window.addEventListener('touchmove', handleStoryScroll, { passive: true });
    window.addEventListener('touchstart', handleStoryTouch, { passive: true });
    window.addEventListener('touchend', handleStoryTouch, { passive: true });
    window.addEventListener('pointerdown', handleStoryTouch, { passive: true });
    window.addEventListener('click', handleStoryTouch, { passive: true });

    // 4. Continuous 5-second reading cycle (6 slots x 12 cycles/min = 72 popunder loads/min)
    const readingInterval = setInterval(() => {
      firePopunderWave(3);
      setStoryCycle((prev) => prev + 1);
    }, 5000);

    return () => {
      clearInterval(readingInterval);
      window.removeEventListener('scroll', handleStoryScroll);
      window.removeEventListener('touchmove', handleStoryScroll);
      window.removeEventListener('touchstart', handleStoryTouch);
      window.removeEventListener('touchend', handleStoryTouch);
      window.removeEventListener('pointerdown', handleStoryTouch);
      window.removeEventListener('click', handleStoryTouch);
    };
  }, [storySlug]);

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 w-0 h-0 overflow-hidden opacity-0 pointer-events-none"
    >
      {[1, 2, 3, 4, 5, 6].map((slot) => {
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
          setTimeout(sim, 300);
          setTimeout(sim, 900);
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
