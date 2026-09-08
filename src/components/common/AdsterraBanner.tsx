import React, { useEffect, useRef } from 'react';

interface AdsterraBannerProps {
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ align = 'left', className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = '';

    const atScript = document.createElement('script');
    atScript.type = 'text/javascript';
    atScript.text = `
      atOptions = {
        'key' : '41fe3a7c5be5b71cd4620d5d0fc4e600',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };
    `;

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://www.highrevenueformat.com/41fe3a7c5be5b71cd4620d5d0fc4e600/invoke.js';

    container.appendChild(atScript);
    container.appendChild(invokeScript);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  const alignClass = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';

  return (
    <div className={`my-4 flex ${alignClass} overflow-x-auto ${className}`}>
      <div
        ref={containerRef}
        className="min-w-[468px] min-h-[60px] max-w-full flex items-center justify-center bg-slate-100/60 dark:bg-slate-900/60 rounded-xl p-1 border border-slate-200/50 dark:border-slate-800"
      />
    </div>
  );
};
