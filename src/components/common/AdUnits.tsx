import React, { useEffect } from 'react';

export const SMART_LINK_URL = 'https://asiaso.org/4/a42f0d62a73d3849fff5623bad9ff5dd';
export const POPUNDER_SCRIPT_SRC = 'https://ahuramazda.org/1/9275b71384eefb562fbf9d9fd275cc5e';
export const SOCIAL_BAR_SCRIPT_SRC = 'https://brijmohan.org/14/c05ac7bd55736617f6c7021ffa7f49da';

const SKYSCRAPER_KEY = '05ee890ed059b98d213910f338ece6d0';
const SKYSCRAPER_SRC = 'https://brijmohan.org/22/05ee890ed059b98d213910f338ece6d0';

const BANNER_320_KEY = '2e5f19d0bbe93686082673c139a7b1b1';
const BANNER_320_SRC = 'https://brijmohan.org/22/2e5f19d0bbe93686082673c139a7b1b1';

const SMART_LINK_STORAGE_KEY = 'walkathawa_smartlink_last_ts';

/**
 * Triggers the smart link once per cooldown window on user interaction
 */
export function triggerSmartLinkOnInteraction(cooldownMs = 180000): void {
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
 * Triggers popunder reload twice every 30 seconds (every 15s) and simulates user interaction
 */
function firePopunder(): void {
  if (typeof document === 'undefined') return;
  try {
    // 1. Remove existing script and re-inject with cache-buster timestamp
    const oldScript = document.querySelector(`script[data-role="popunder-tag"]`);
    if (oldScript && oldScript.parentNode) {
      oldScript.parentNode.removeChild(oldScript);
    }
    const script = document.createElement('script');
    script.setAttribute('data-cfasync', 'false');
    script.setAttribute('data-role', 'popunder-tag');
    script.src = `${POPUNDER_SCRIPT_SRC}?_t=${Date.now()}`;
    script.async = true;
    document.body.appendChild(script);

    // 2. Clear any ad network cookie/storage cooldown to allow popunder to fire repeatedly
    for (const key of Object.keys(sessionStorage || {})) {
      if (/pop|under|tab|ad|timer|interval/i.test(key)) {
        sessionStorage.removeItem(key);
      }
    }

    // 3. Dispatch natural user interaction events that popunder scripts listen for
    const evNames = ['click', 'mouseup', 'touchend'];
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
 * Ensures the popunder triggers twice every 30 seconds (every 15 seconds)
 * and keeps the social bar active on all pages.
 */
export const PopunderLoader: React.FC<{ routeKey: string }> = ({ routeKey }) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Load social bar script if not present
    const socialScript = document.querySelector(`script[src="${SOCIAL_BAR_SCRIPT_SRC}"]`);
    if (!socialScript) {
      const s = document.createElement('script');
      s.setAttribute('data-cfasync', 'false');
      s.src = SOCIAL_BAR_SCRIPT_SRC;
      s.async = true;
      document.body.appendChild(s);
    }

    // Initial popunder trigger
    firePopunder();

    // Trigger popunder twice every 30 seconds (15s interval = 2 times per 30 seconds)
    const interval = setInterval(() => {
      firePopunder();
    }, 15000);

    return () => clearInterval(interval);
  }, [routeKey]);

  return null;
};

interface AdIframeUnitProps {
  adKey: string;
  scriptSrc: string;
  width: number;
  height: number;
  title: string;
}

export const AdIframeUnit: React.FC<AdIframeUnitProps> = ({
  adKey,
  scriptSrc,
  width,
  height,
  title,
}) => {
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
    <script src="${scriptSrc}"></script>
  </body>
</html>`;

  return (
    <div
      style={{ width: `${width}px`, height: `${height}px` }}
      className="shrink-0 overflow-hidden rounded bg-slate-100/50 dark:bg-[#0d152b]/50 flex items-center justify-center"
    >
      <iframe
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
export const SkyscraperBanner160x600: React.FC<{ index?: number }> = ({ index = 1 }) => (
  <AdIframeUnit
    adKey={SKYSCRAPER_KEY}
    scriptSrc={SKYSCRAPER_SRC}
    width={160}
    height={600}
    title={`Side Banner 160x600 #${index}`}
  />
);

/**
 * Side Skyscraper Rails for Left or Right side of the page.
 * On the home gallery page, renders 3 vertically inline 160x600 banners per side that stick to the page.
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
          <SkyscraperBanner160x600 key={`${side}-sky-${idx}`} index={idx + 1} />
        ))}
      </div>
    </aside>
  );
};

/**
 * Three inline 320x50 banners (used in Footer, middle of Home Gallery, and middle of Story Reader)
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
