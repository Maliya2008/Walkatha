import React from 'react';
import { BookOpen, Shield, Lock, FileCode2, Search } from 'lucide-react';
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
                Walkathawa <span className="text-indigo-600 dark:text-indigo-400 text-sm font-serif">(වල් කතාව)</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Walkathawa (වල් කතාව) is a place to read Sinhala stories online. Discover new Sinhala katha, romantic stories, fictional stories, and interesting short stories updated regularly.
            </p>
            <div className="text-[11px] text-slate-400 font-serif leading-relaxed">
              නවතම සිංහල කෙටිකතා, ආදර කතා, සහ ප්‍රබන්ධ කතා කියවීමට හොඳම වෙබ් අඩවිය.
            </div>
          </div>

          {/* Quick Categories Col */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              කතා වර්ගීකරණ (Genres)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {categories
                .filter((c) => c.slug !== 'all')
                .slice(0, 6)
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.slug)}
                    className="text-left text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-0.5 cursor-pointer"
                  >
                    {cat.name}
                  </button>
                ))}
            </div>
          </div>

          {/* Legal & Compliance Col */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              SEO & Policies
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>XML Sitemap</span>
                </a>
              </li>
              <li>
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>Robots.txt</span>
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenCompliance('privacy')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenCompliance('terms')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenCompliance('ads')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Ad Guidelines
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} Walkathawa (වල් කතාව). All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
