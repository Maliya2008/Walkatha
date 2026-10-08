import React from 'react';

interface AdBanner320x50Props {
  className?: string;
}

export const AdBanner320x50: React.FC<AdBanner320x50Props> = ({ className = '' }) => {
  return (
    <div
      aria-label="Advertisement"
      className={`flex flex-col items-center justify-center my-4 overflow-hidden ${className}`}
    >
      <span className="text-[10px] tracking-wider uppercase text-slate-400 dark:text-slate-500 mb-1 select-none">
        දැන්වීම්
      </span>
      <div className="w-[320px] h-[50px] bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md overflow-hidden flex items-center justify-center shadow-xs">
        <iframe
          title="Sponsored Advertisement"
          srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"/><style>*{box-sizing:border-box;}body{margin:0;padding:0;display:flex;justify-content:center;align-items:center;background:transparent;overflow:hidden;}</style></head><body><script type="text/javascript">atOptions={'key':'2e5f19d0bbe93686082673c139a7b1b1','format':'iframe','height':50,'width':320,'params':{}};</script><script type="text/javascript" src="//www.highperformanceformat.com/2e5f19d0bbe93686082673c139a7b1b1/invoke.js"></script></body></html>`}
          width="320"
          height="50"
          style={{ border: 'none', overflow: 'hidden' }}
          scrolling="no"
        />
      </div>
    </div>
  );
};
