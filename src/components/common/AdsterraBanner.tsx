import React from 'react';

interface AdsterraBannerProps {
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ align = 'left', className = '' }) => {
  const alignClass = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';

  const iframeContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body {
        margin: 0;
        padding: 0;
        background: transparent;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: flex-start;
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
    <div className={`my-4 flex ${alignClass} overflow-x-auto ${className}`}>
      <iframe
        title="Advertisement"
        srcDoc={iframeContent}
        width="468"
        height="60"
        className="w-[468px] h-[60px] border-0 overflow-hidden bg-transparent"
        scrolling="no"
        loading="lazy"
      />
    </div>
  );
};
