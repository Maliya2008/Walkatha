import React from 'react';

export type AdBannerType = '468x60' | '320x50' | '160x600' | 'responsive';

interface AdBannerProps {
  type?: AdBannerType;
  className?: string;
}

const AD_CONFIGS = {
  '468x60': {
    key: '41fe3a7c5be5b71cd4620d5d0fc4e600',
    width: 468,
    height: 60,
  },
  '320x50': {
    key: '2e5f19d0bbe93686082673c139a7b1b1',
    width: 320,
    height: 50,
  },
  '160x600': {
    key: '05ee890ed059b98d213910f338ece6d0',
    width: 160,
    height: 600,
  },
};

export const AdBanner: React.FC<AdBannerProps> = ({ type = 'responsive', className = '' }) => {
  if (type === 'responsive') {
    return (
      <div className={`flex flex-col items-center justify-center my-4 overflow-hidden ${className}`}>
        {/* Desktop / Tablet Banner (468x60) */}
        <div className="hidden sm:flex justify-center items-center">
          <AdIframe config={AD_CONFIGS['468x60']} />
        </div>
        {/* Mobile Banner (320x50) */}
        <div className="flex sm:hidden justify-center items-center">
          <AdIframe config={AD_CONFIGS['320x50']} />
        </div>
      </div>
    );
  }

  const config = AD_CONFIGS[type] || AD_CONFIGS['320x50'];

  return (
    <div className={`flex justify-center items-center my-4 overflow-hidden ${className}`}>
      <AdIframe config={config} />
    </div>
  );
};

const AdIframe: React.FC<{ config: { key: string; width: number; height: number } }> = ({ config }) => {
  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            background: transparent;
          }
        </style>
      </head>
      <body>
        <script type="text/javascript">
          atOptions = {
            'key' : '${config.key}',
            'format' : 'iframe',
            'height' : ${config.height},
            'width' : ${config.width},
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="https://www.highrevenueformat.com/${config.key}/invoke.js"></script>
      </body>
    </html>
  `;

  return (
    <iframe
      title={`Ad ${config.width}x${config.height}`}
      srcDoc={srcDoc}
      width={config.width}
      height={config.height}
      style={{
        border: 'none',
        overflow: 'hidden',
        maxWidth: '100%',
      }}
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
      scrolling="no"
    />
  );
};

export const SMART_LINK_URL = 'https://www.profitableratecpmnetwork.com/b7h3es8fh?key=a42f0d62a73d3849fff5623bad9ff5dd';

interface SmartLinkCalloutProps {
  label?: string;
  sublabel?: string;
  variant?: 'primary' | 'secondary' | 'badge';
  className?: string;
}

export const SmartLinkCallout: React.FC<SmartLinkCalloutProps> = ({
  label = '🔥 නවතම විශේෂ කතා සහ වීඩියෝ බලන්න (Click Here)',
  sublabel = 'දිනපතා අලුත් වන විශේෂ පිටුවට පිවිසෙන්න',
  variant = 'primary',
  className = '',
}) => {
  return (
    <a
      href={SMART_LINK_URL}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={`block my-5 p-3.5 sm:p-4 rounded-xl text-center transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] shadow-sm cursor-pointer ${
        variant === 'primary'
          ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 text-white font-bold hover:shadow-md'
          : 'bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold hover:shadow-md'
      } ${className}`}
    >
      <div className="flex items-center justify-center gap-2 text-sm sm:text-base tracking-wide">
        <span>✨</span>
        <span>{label}</span>
        <span>✨</span>
      </div>
      {sublabel && (
        <div className="text-[11px] sm:text-xs opacity-90 mt-1 font-normal">
          {sublabel}
        </div>
      )}
    </a>
  );
};
