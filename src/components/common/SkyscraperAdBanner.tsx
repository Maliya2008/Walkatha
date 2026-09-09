import React from 'react';

interface SkyscraperAdBannerProps {
  id?: string;
  className?: string;
}

export const SkyscraperAdBanner: React.FC<SkyscraperAdBannerProps> = ({
  id = 'skyscraper-ad-banner',
  className = '',
}) => {
  const adHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <base target="_blank" />
    <style>
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    <script type="text/javascript">
      atOptions = {
        'key' : '05ee890ed059b98d213910f338ece6d0',
        'format' : 'iframe',
        'height' : 600,
        'width' : 160,
        'params' : {}
      };
    </script>
    <script type="text/javascript" src="https://www.highrevenueformat.com/05ee890ed059b98d213910f338ece6d0/invoke.js"></script>
  </body>
</html>`;

  return (
    <aside
      id={id}
      aria-label="Advertisement"
      className={`w-[160px] flex flex-col items-center select-none ${className}`}
    >
      <span className="text-[10px] tracking-wider uppercase text-slate-400 dark:text-slate-500 font-semibold mb-1">
        Sponsored
      </span>
      <div className="w-[160px] h-[600px] rounded-lg overflow-hidden bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex items-center justify-center">
        <iframe
          title="Sponsored Skyscraper Ad"
          srcDoc={adHtml}
          width="160"
          height="600"
          scrolling="no"
          loading="lazy"
          className="w-[160px] h-[600px] border-0 overflow-hidden"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </aside>
  );
};
