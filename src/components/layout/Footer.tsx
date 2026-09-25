import React, { useState } from 'react';
import { Category } from '../../types/story';
import { PrivacyTermsModal } from '../common/PrivacyTermsModal';
import { cleanCategoryBadgeName } from '../../utils/formatters';

interface FooterProps {
  categories: Category[];
  onSelectCategory: (categorySlug: string) => void;
  onOpenSitemap?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  categories,
  onSelectCategory,
  onOpenSitemap,
}) => {
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'ads' | null>(null);

  return (
    <>
      <footer
        id="main-app-footer"
        className="w-full border-t border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 py-8 transition-colors duration-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Main Info Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Walkathawa</span>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-serif">
                  (වල් කතාව)
                </span>
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                නවතම සිංහල කෙටිකතා, ප්‍රබන්ධ සහ ආදර කතා කියවීමට නිර්මාණය කළ සරල වෙබ් අඩවිය.
              </p>
            </div>

            {/* Quick Category Chips */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {categories
                .filter((c) => c.slug !== 'all')
                .slice(0, 5)
                .map((cat) => (
                  <button
                    key={cat.id || cat.slug}
                    type="button"
                    onClick={() => onSelectCategory(cat.slug)}
                    className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer text-[11px]"
                  >
                    {cleanCategoryBadgeName(cat.name)}
                  </button>
                ))}
            </div>
          </div>

          {/* Legal & Navigation Links */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-850/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <button
                type="button"
                onClick={() => setModalType('privacy')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setModalType('terms')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Terms & Conditions
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setModalType('ads')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Disclaimer
              </button>
              <span>·</span>
              <a
                href="/admin"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
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
