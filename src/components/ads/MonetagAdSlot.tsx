import React, { useEffect, useRef, useState } from 'react';
import { adService } from '../../services/adService';

export type AdSlotType = 'header' | 'in-article' | 'footer' | 'sidebar';

interface MonetagAdSlotProps {
  type: AdSlotType;
  zoneId?: string;
  customAdCode?: string; // Story-specific individual ad code or custom snippet
  slotIndex?: number; // 1 = First ad slot, 2 = Second ad slot, 3 = Third ad slot
  className?: string;
  slotLabel?: string;
}

const SLOT_CONFIGS: Record<AdSlotType, { widthClass: string; minHeightClass: string; defaultLabel: string; standardSize: string }> = {
  header: {
    widthClass: 'w-full max-w-[728px] mx-auto my-4',
    minHeightClass: 'min-h-[90px]',
    defaultLabel: 'Header Sponsor (728x90 Leaderboard)',
    standardSize: '728x90',
  },
  'in-article': {
    widthClass: 'w-full max-w-[650px] mx-auto my-8',
    minHeightClass: 'min-h-[250px]',
    defaultLabel: 'In-Article Native Sponsor (300x250 Native)',
    standardSize: '300x250',
  },
  footer: {
    widthClass: 'w-full max-w-[728px] mx-auto my-6',
    minHeightClass: 'min-h-[90px]',
    defaultLabel: 'Footer Sponsor (728x90 Bottom Banner)',
    standardSize: '728x90',
  },
  sidebar: {
    widthClass: 'w-full max-w-[300px] mx-auto my-4',
    minHeightClass: 'min-h-[250px]',
    defaultLabel: 'Sidebar Sponsor (300x250)',
    standardSize: '300x250',
  },
};

export const MonetagAdSlot: React.FC<MonetagAdSlotProps> = ({
  type,
  zoneId,
  customAdCode,
  slotIndex = 1,
  className = '',
  slotLabel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState(adService.getConfig());

  useEffect(() => {
    adService.fetchConfig().then(setConfig);
  }, []);

  // 1. MASTER SWITCH: When advertisements are OFF, nothing renders
  if (!config.adsEnabled) {
    return null;
  }

  // 2. AMOUNT CONTROL: Limit number of ads per page (1, 2, or 3)
  const maxAllowed = config.adsPerPage || 2;
  const slotOrder: Record<AdSlotType, number> = {
    header: 1,
    'in-article': 2,
    footer: 3,
    sidebar: 2,
  };

  const currentSlotNumber = slotIndex || slotOrder[type] || 1;
  if (currentSlotNumber > maxAllowed) {
    return null;
  }

  const slotDetails = SLOT_CONFIGS[type];
  const finalZoneId = zoneId || `monetag-${type}-zone`;

  // Select code priority: Custom Story Specific Ad Code -> Global Ad Code
  const activeSnippet = customAdCode && customAdCode.trim() ? customAdCode : config.globalAdCode;
  const safeSnippetHtml = activeSnippet ? adService.sanitizeAndEnforceExternalLinks(activeSnippet) : null;

  return (
    <div
      id={`ad-slot-${type}-${slotIndex}`}
      className={`monetag-ad-wrapper relative flex flex-col items-center justify-center overflow-hidden my-3 transition-all ${slotDetails.widthClass} ${className}`}
      data-ad-type={type}
      data-ad-slot-number={currentSlotNumber}
      data-monetag-zone={finalZoneId}
    >
      {/* Label indicator for advertising transparency */}
      <div className="w-full flex items-center justify-between px-2 mb-1 text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500">
        <span>Advertisement ({currentSlotNumber} of {maxAllowed})</span>
        {customAdCode && <span className="text-indigo-500 font-normal">Story Sponsor</span>}
      </div>

      {/* Target Container for Monetag Script / Custom Code */}
      {safeSnippetHtml ? (
        <div
          ref={containerRef}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-2 overflow-hidden shadow-xs"
          dangerouslySetInnerHTML={{ __html: safeSnippetHtml }}
          onClick={(e) => {
            // Safety handler: Ensure any dynamic links in ad click bubbles open externally
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');
            if (anchor && anchor.href) {
              anchor.target = '_blank';
              anchor.rel = 'noopener noreferrer';
            }
          }}
        />
      ) : (
        <div
          ref={containerRef}
          className={`w-full ${slotDetails.minHeightClass} flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-4 text-center`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{slotLabel || slotDetails.defaultLabel}</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
            Monetag Container &bull; Target: <code className="font-mono text-slate-600 dark:text-slate-300">_blank (external)</code>
          </p>
        </div>
      )}
    </div>
  );
};
