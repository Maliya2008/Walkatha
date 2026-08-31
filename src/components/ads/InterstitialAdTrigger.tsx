import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { adService } from '../../services/adService';

interface InterstitialAdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InterstitialAdModal: React.FC<InterstitialAdModalProps> = ({ isOpen, onClose }) => {
  const [countdown, setCountdown] = useState(5);
  const config = adService.getConfig();

  React.useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="interstitial-ad-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center">
        {/* Close Button / Countdown */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {countdown > 0 ? (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Skip in {countdown}s
            </span>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          )}
        </div>

        <div className="pt-4 pb-2">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="block text-[11px] uppercase tracking-wider font-bold text-slate-400">
            Sponsored Interstitial
          </span>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">
            Monetag Full-Screen / Vignette Ad Area
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
            This component holds the full-page interstitial or rewarded ad unit. In live production, Monetag Vignette or OnClick scripts automatically render here.
          </p>

          <div className="my-6 p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center">
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
              {config.adsEnabled ? 'Status: Active Monetag Delivery' : 'Status: Ads Disabled'}
            </span>
            <span className="text-[11px] text-slate-400 mt-1">
              High eCPM Interstitial Placement
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-semibold transition-colors"
          >
            Continue to Next Story
          </button>
        </div>
      </div>
    </div>
  );
};
