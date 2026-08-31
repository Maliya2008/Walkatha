import React, { useEffect, useRef } from 'react';
import { adService } from '../../services/adService';

export type AdSlotType = 'header' | 'in-article' | 'sidebar' | 'footer';

interface MonetagAdSlotProps {
  type: AdSlotType;
  zoneId?: string;
  className?: string;
  slotLabel?: string;
}

const SLOT_CONFIGS: Record<AdSlotType, { widthClass: string; minHeightClass: string; defaultLabel: string; standardSize: string }> = {
  header: {
    widthClass: 'w-full max-w-[728px] mx-auto',
    minHeightClass: 'min-h-[90px]',
    defaultLabel: 'Header Sponsor (728x90 Leaderboard / Responsive)',
    standardSize: '728x90',
  },
  'in-article': {
    widthClass: 'w-full max-w-[600px] mx-auto my-8',
    minHeightClass: 'min-h-[250px]',
    defaultLabel: 'Story Content Sponsor (300x250 / In-Article Native)',
    standardSize: '300x250',
  },
  sidebar: {
    widthClass: 'w-full max-w-[300px]',
    minHeightClass: 'min-h-[250px] lg:min-h-[600px]',
    defaultLabel: 'Sidebar Sponsor (300x250 / 300x600 Half Page)',
    standardSize: '300x600',
  },
  footer: {
    widthClass: 'w-full max-w-[728px] mx-auto my-6',
    minHeightClass: 'min-h-[90px]',
    defaultLabel: 'Footer Sponsor (728x90 / Responsive Anchor)',
    standardSize: '728x90',
  },
};

export const MonetagAdSlot: React.FC<MonetagAdSlotProps> = ({
  type,
  zoneId,
  className = '',
  slotLabel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const config = adService.getConfig();
  const slotDetails = SLOT_CONFIGS[type];
  const finalZoneId = zoneId || config[`${type === 'in-article' ? 'inArticle' : type}ZoneId` as keyof typeof config] as string;

  useEffect(() => {
    // When live in production with a Monetag Script Tag:
    // Window/Script insertion into containerRef.current
    if (config.enabled && !config.testMode && containerRef.current) {
      // In production, execute Monetag Zone tag:
      // (window.monetag = window.monetag || []).push({ zoneId: finalZoneId, container: containerRef.current });
    }
  }, [config.enabled, config.testMode, finalZoneId]);

  if (!config.enabled) {
    return null;
  }

  return (
    <div
      id={`ad-slot-${type}-${finalZoneId || 'default'}`}
      className={`monetag-ad-wrapper relative flex flex-col items-center justify-center overflow-hidden transition-all ${slotDetails.widthClass} ${slotDetails.minHeightClass} ${className}`}
      data-ad-type={type}
      data-monetag-zone={finalZoneId}
    >
      {/* Label indicator for advertising disclosure / standards */}
      <div className="w-full text-center mb-1">
        <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500">
          Advertisement
        </span>
      </div>

      {/* Target Container for Monetag Script Attachment */}
      <div
        ref={containerRef}
        className="w-full h-full flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 text-center"
      >
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>{slotLabel || slotDetails.defaultLabel}</span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
          Monetag Ad Slot Zone ID: <code className="font-mono text-slate-600 dark:text-slate-400">{finalZoneId}</code>
        </p>
      </div>
    </div>
  );
};
