import React from 'react';

interface AdSkyscraper160x600Props {
  className?: string;
}

export const AdSkyscraper160x600: React.FC<AdSkyscraper160x600Props> = ({ className = '' }) => {
  return (
    <div
      aria-label="Advertisement"
      className={`flex flex-col items-center justify-center my-2 overflow-hidden ${className}`}
    >
      <span className="text-[10px] tracking-wider uppercase text-slate-400 dark:text-slate-500 mb-1 select-none">
        දැන්වීම්
      </span>
      <div className="w-[160px] h-[600px] bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md overflow-hidden flex items-center justify-center shadow-xs">
        <iframe
          title="Sponsored Skyscraper Advertisement"
          srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"/><style>*{box-sizing:border-box;}body{margin:0;padding:0;display:flex;justify-content:center;align-items:center;background:transparent;overflow:hidden;}</style></head><body><script type="text/javascript">atOptions={'key':'05ee890ed059b98d213910f338ece6d0','format':'iframe','height':600,'width':160,'params':{}};</script><script type="text/javascript" src="https://www.highrevenueformat.com/05ee890ed059b98d213910f338ece6d0/invoke.js"></script></body></html>`}
          width="160"
          height="600"
          style={{ border: 'none', overflow: 'hidden' }}
          scrolling="no"
        />
      </div>
    </div>
  );
};
