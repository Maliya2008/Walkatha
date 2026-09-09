import React from 'react';

interface HorizontalAdBannerProps {
  id?: string;
  className?: string;
  showLabel?: boolean;
}

export const HorizontalAdBanner: React.FC<HorizontalAdBannerProps> = ({
  id = 'horizontal-ad-banner',
  className = '',
  showLabel = false,
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
        'key' : '41fe3a7c5be5b71cd4620d5d0fc4e600',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };
    </script>
    <script type="text/javascript" src="https://www.highrevenueformat.com/41fe3a7c5be5b71cd4620d5d0fc4e600/invoke.js"></script>
  </body>
</html>`;

  return (
    <aside
      id={id}
      aria-label="Advertisement"
      className={`w-full flex flex-col items-center justify-center my-3 select-none ${className}`}
    >
      {showLabel && (
        <span className="text-[10px] tracking-wider uppercase text-slate-400 dark:text-slate-500 font-semibold mb-1">
          Sponsored
        </span>
      )}
      <div className="w-full max-w-[468px] min-h-[60px] rounded-lg overflow-hidden bg-slate-100/40 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-center shadow-2xs">
        <iframe
          title="Sponsored Horizontal Ad"
          srcDoc={adHtml}
          width="468"
          height="60"
          scrolling="no"
          loading="lazy"
          className="w-[468px] h-[60px] max-w-full border-0 overflow-hidden"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </aside>
  );
};
