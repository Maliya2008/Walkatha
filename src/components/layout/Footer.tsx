import React, { useState } from 'react';
import { Category } from '../../types/story';
import { PrivacyTermsModal } from '../common/PrivacyTermsModal';
import { AdBanner320x50 } from '../common/AdBanner320x50';
import { cleanCategoryBadgeName } from '../../utils/formatters';

interface FooterProps {
  categories?: Category[];
  onSelectCategory?: (categorySlug: string) => void;
  onOpenSitemap?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  categories = [],
  onSelectCategory,
  onOpenSitemap,
}) => {
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'ads' | null>(null);

  return (
    <>
      <footer
        id="main-app-footer"
        className="w-full border-t border-[#16264c] bg-[#050b18] text-blue-200/80 py-8 transition-colors duration-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Main Info Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-extrabold text-sm sm:text-base text-white flex items-center gap-1.5">
                <span>Walkathawa</span>
                <span className="text-xs text-rose-400 font-serif">
                  (වල් කතාව)
                </span>
              </span>
              <p className="text-xs text-blue-200/70 max-w-md leading-relaxed">
                නවතම සිංහල කෙටිකතා, ප්‍රබන්ධ සහ ආදර කතා කියවීමට නිර්මාණය කළ සරල වෙබ් අඩවිය.
              </p>
            </div>

            {/* Quick Category Chips */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 text-xs">
                {categories
                  .filter((c) => c.slug !== 'all')
                  .slice(0, 5)
                  .map((cat) => (
                    <a
                      key={cat.id || cat.slug}
                      href={`/category/${encodeURIComponent(cat.slug)}`}
                      onClick={(e) => {
                        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && onSelectCategory) {
                          e.preventDefault();
                          onSelectCategory(cat.slug);
                        }
                      }}
                      className="px-2.5 py-1 rounded-md bg-[#0b1633] hover:bg-[#122045] text-white border border-[#1a2c56] transition-colors cursor-pointer text-[11px]"
                    >
                      {cleanCategoryBadgeName(cat.name)}
                    </a>
                  ))}
              </div>
            )}
          </div>

          {/* Sponsored Special Direct Link */}
          <div className="flex justify-center">
            <a
              href="https://asiaso.org/4/a42f0d62a73d3849fff5623bad9ff5dd"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>🔥</span>
              <span>නවතම විශේෂ කතා සහ වීඩියෝ (Special Stories & Videos)</span>
              <span>✨</span>
            </a>
          </div>

          {/* 320x50 In-Page Footer Ad Banner */}
          <AdBanner320x50 />

          {/* Legal & Navigation Links */}
          <div className="pt-4 border-t border-[#16264c] flex flex-wrap items-center justify-between gap-3 text-xs text-blue-200/80">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <button
                type="button"
                onClick={() => setModalType('privacy')}
                className="text-blue-200 hover:text-white transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setModalType('terms')}
                className="text-blue-200 hover:text-white transition-colors cursor-pointer"
              >
                Terms & Conditions
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setModalType('ads')}
                className="text-blue-200 hover:text-white transition-colors cursor-pointer"
              >
                Disclaimer
              </button>
              <span>·</span>
              <a
                href="/admin"
                className="text-blue-200 hover:text-white transition-colors"
              >
                Send Your Story
              </a>
              <span>·</span>
              <a
                href="/archives"
                onClick={(e) => {
                  if (onOpenSitemap) {
                    e.preventDefault();
                    onOpenSitemap();
                  }
                }}
                className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                කතා සූචිය (Archives)
              </a>
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-500">
              © {new Date().getFullYear()} Walkathawa. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Compliance Modal */}
      {modalType && (
        <PrivacyTermsModal
          isOpen={Boolean(modalType)}
          onClose={() => setModalType(null)}
          type={modalType}
        />
      )}
    </>
  );
};
