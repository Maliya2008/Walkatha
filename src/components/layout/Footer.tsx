import React from 'react';
import { BookOpen, Shield, Lock } from 'lucide-react';
import { Category } from '../../types/story';

interface FooterProps {
  categories: Category[];
  onSelectCategory: (categorySlug: string) => void;
  onOpenSitemap: () => void;
  onOpenCompliance: (type: 'privacy' | 'terms' | 'ads') => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  categories,
  onSelectCategory,
  onOpenSitemap,
  onOpenCompliance,
  onOpenAdmin,
}) => {
  return (
    <footer
      id="main-app-footer"
      className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 py-10 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-slate-900 dark:text-white">
                Short Stories
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              A high-speed, lightweight story publication platform. Designed for immersive short fiction reading with responsive readability and clean Monetag monetization support.
            </p>
          </div>

          {/* Quick Categories Col */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Explore Genres
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {categories
                .filter((c) => c.slug !== 'all')
                .slice(0, 6)
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.slug)}
                    className="text-left text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-0.5"
                  >
                    {cat.name}
                  </button>
                ))}
            </div>
          </div>

          {/* Legal & Compliance Col */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Publisher & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onOpenCompliance('privacy')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Privacy & Cookies Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenCompliance('terms')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenCompliance('ads')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Monetag Ad Integration
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenSitemap}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  XML Sitemap / Index
                </button>
              </li>
              <li className="pt-1">
                <button
                  onClick={onOpenAdmin}
                  className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  <Lock className="w-3 h-3" />
                  <span>Admin Management Portal</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright notice */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <span>© {new Date().getFullYear()} Short Stories. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <span>Fast, lightweight & SEO optimized</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
