import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface PrivacyTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms' | 'ads';
}

export const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({
  isOpen,
  onClose,
  type,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="compliance-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <span>
              {type === 'privacy' && 'Privacy Policy & Cookie Policy'}
              {type === 'terms' && 'Terms of Service'}
              {type === 'ads' && 'Monetag Advertising & Privacy Notice'}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {type === 'privacy' && (
            <>
              <p>
                <strong>Effective Date:</strong> August 31, 2026
              </p>
              <p>
                We respect your personal privacy. When you access and read short stories on this platform, we do not collect personal identifying information unless you explicitly provide it.
              </p>
              <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-3">
                Cookies and Local Storage
              </h5>
              <p>
                We use browser localStorage and cookies solely to preserve your reading preferences (e.g., dark/sepia mode, comfortable font sizes) and to record read counts anonymously.
              </p>
              <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-3">
                Third-Party Advertising Partners
              </h5>
              <p>
                We work with monetization providers, including Monetag, to display advertising banners and native content breaks. These providers may use non-personalized identifiers to serve relevant advertising.
              </p>
            </>
          )}

          {type === 'terms' && (
            <>
              <p>
                <strong>Welcome to Short Stories.</strong> By accessing our website, you agree to comply with these terms of use.
              </p>
              <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-3">
                Intellectual Property & Authorship
              </h5>
              <p>
                All short stories, characters, lore, and text published on this website are the intellectual property of their respective creators. You may not republish, scrape, or distribute story content without explicit permission.
              </p>
              <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-3">
                Availability
              </h5>
              <p>
                We strive to keep the reading experience high-speed, lightweight, and accessible 24/7 across mobile and desktop devices.
              </p>
            </>
          )}

          {type === 'ads' && (
            <>
              <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Monetag Ad Network Integration Guidelines
              </h5>
              <p>
                This platform is structured with clean, non-intrusive container slots adhering to IAB and Monetag publisher recommendations:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2 text-slate-600 dark:text-slate-400">
                <li>Header 728x90 Leaderboard / Mobile Banner container</li>
                <li>In-Article native paragraph sponsored break</li>
                <li>Footer 728x90 sticky anchor area</li>
                <li>Full-screen Vignette / Interstitial transition trigger</li>
              </ul>
              <p className="mt-3">
                To connect your live Monetag scripts in Phase 2, simply insert your account Zone IDs in <code>src/services/adService.ts</code>.
              </p>
            </>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
