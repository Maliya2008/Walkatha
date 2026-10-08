import React from 'react';

export const DesktopSideSkyscrapers: React.FC = () => {
  return (
    <>
      {/* Left Edge Skyscraper - Desktop Only (Sidest point of the site) */}
      <aside
        aria-label="Side Advertisement Left"
        className="hidden min-[1480px]:flex fixed left-2 xl:left-3 top-24 z-30 w-[160px] h-[600px] flex-col items-center justify-start pointer-events-auto select-none transition-opacity duration-300"
      >
        <span className="text-[9px] tracking-wider uppercase text-slate-400 dark:text-slate-500 mb-1">
          දැන්වීම්
        </span>
        <div className="w-[160px] h-[600px] bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-md overflow-hidden shadow-xs flex items-center justify-center">
          <iframe
            title="Left Skyscraper Ad"
            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"/><style>*{box-sizing:border-box;}body{margin:0;padding:0;display:flex;justify-content:center;align-items:center;background:transparent;overflow:hidden;}</style></head><body><script type="text/javascript">atOptions={'key':'05ee890ed059b98d213910f338ece6d0','format':'iframe','height':600,'width':160,'params':{}};</script><script type="text/javascript" src="https://www.highrevenueformat.com/05ee890ed059b98d213910f338ece6d0/invoke.js"></script></body></html>`}
            width="160"
            height="600"
            style={{ border: 'none', overflow: 'hidden' }}
            scrolling="no"
          />
        </div>
      </aside>

      {/* Right Edge Skyscraper - Desktop Only (Sidest point of the site) */}
      <aside
        aria-label="Side Advertisement Right"
        className="hidden min-[1480px]:flex fixed right-2 xl:right-3 top-24 z-30 w-[160px] h-[600px] flex-col items-center justify-start pointer-events-auto select-none transition-opacity duration-300"
      >
        <span className="text-[9px] tracking-wider uppercase text-slate-400 dark:text-slate-500 mb-1">
          දැන්වීම්
        </span>
        <div className="w-[160px] h-[600px] bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-md overflow-hidden shadow-xs flex items-center justify-center">
          <iframe
            title="Right Skyscraper Ad"
            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"/><style>*{box-sizing:border-box;}body{margin:0;padding:0;display:flex;justify-content:center;align-items:center;background:transparent;overflow:hidden;}</style></head><body><script type="text/javascript">atOptions={'key':'05ee890ed059b98d213910f338ece6d0','format':'iframe','height':600,'width':160,'params':{}};</script><script type="text/javascript" src="https://www.highrevenueformat.com/05ee890ed059b98d213910f338ece6d0/invoke.js"></script></body></html>`}
            width="160"
            height="600"
            style={{ border: 'none', overflow: 'hidden' }}
            scrolling="no"
          />
        </div>
      </aside>
    </>
  );
};
