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
      <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl bg-[#0a142c] border border-[#182a55] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#16264c]">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <span>
              {type === 'privacy' && 'Privacy Policy & Cookie Policy'}
              {type === 'terms' && 'Terms of Service'}
              {type === 'ads' && 'Advertising & Privacy Notice'}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-blue-100/90 leading-relaxed">
          {type === 'privacy' && (
            <>
              <p>
                <strong className="text-white">Effective Date:</strong> August 31, 2026
              </p>
              <p>
                We respect your personal privacy. When you access and read short stories on this platform, we do not collect personal identifying information unless you explicitly provide it.
              </p>
              <h5 className="font-bold text-white text-sm mt-3">
                Cookies and Local Storage
              </h5>
              <p>
                We use browser localStorage and cookies solely to preserve your reading preferences (e.g., navy/dark mode, comfortable font sizes) and to record read counts anonymously.
              </p>
              <h5 className="font-bold text-white text-sm mt-3">
                Third-Party Advertising Partners
              </h5>
              <p>
                We work with authorized advertising networks to display relevant advertisements. These third-party partners may use cookies or non-personalized identifiers to deliver and measure ad performance.
              </p>
            </>
          )}

          {type === 'terms' && (
            <>
              <p>
                <strong className="text-white">Welcome to Short Stories.</strong> By accessing our website, you agree to comply with these terms of use.
              </p>
              <h5 className="font-bold text-white text-sm mt-3">
                Intellectual Property & Authorship
              </h5>
              <p>
                All short stories, characters, lore, and text published on this website are the intellectual property of their respective creators. You may not republish, scrape, or distribute story content without explicit permission.
              </p>
              <h5 className="font-bold text-white text-sm mt-3">
                Availability
              </h5>
              <p>
                We strive to keep the reading experience high-speed, lightweight, and accessible 24/7 across mobile and desktop devices.
              </p>
            </>
          )}

          {type === 'ads' && (
            <>
              <h5 className="font-bold text-white text-sm">
                Advertising Guidelines & Disclosures
              </h5>
              <p>
                This platform is structured to ensure high readability while supporting content creators through ad monetization:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2 text-blue-200/80">
                <li>Advertisements comply with standard digital publishing policies</li>
                <li>Popunders and direct sponsorships trigger responsibly with frequency limits</li>
                <li>Content reading areas remain uninterrupted for optimal user experience</li>
              </ul>
            </>
          )}
        </div>

        <div className="px-6 py-3 bg-[#070e1e] border-t border-[#16264c] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
