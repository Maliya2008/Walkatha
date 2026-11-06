import React from 'react';
import { Category } from '../../types/story';
import { TripleInlineBanners320x50, SMART_LINK_URL } from '../common/AdUnits';

interface FooterProps {
  categories: Category[];
  onSelectCategory: (slug: string) => void;
  onNavigateStatic: (page: 'about' | 'privacy' | 'terms' | 'contact' | 'admin') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateStatic }) => {
  return (
    <footer className="bg-white dark:bg-[#0b1224] border-t border-slate-200 dark:border-[#1c2b4f] mt-12 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Three 320x50 Banners in Footer */}
        <TripleInlineBanners320x50 label="footer" />

        <div className="text-xs text-slate-600 dark:text-slate-400">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Walkathawa — සිංහල වැල කතා සහ වල් කතා
            </h2>
            <p className="leading-relaxed">
              ශ්‍රී ලංකාවේ විශාලතම සිංහල වැල කතා (Sinhala Wal Katha), වල් කතා, අම්මා වල් කතා 2026,
              අක්කා මල්ලි කතා සහ පවුලේ වැල කතා එකතුව. දිනපතා අලුත් වන රසවත් සිංහල කතා 600කට වැඩි
              ප්‍රමාණයක් නොමිලේ කියවන්න.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-[#1c2b4f] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <p>© {new Date().getFullYear()} Walkathawa. සියලුම හිමිකම් ඇවිරිණි.</p>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-slate-400"
            >
              Sitemap
            </a>
            <a
              href="/admin"
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  onNavigateStatic('admin');
                }
              }}
              className="hover:underline text-slate-400"
            >
              Admin
            </a>
          </div>
          <a
            href={SMART_LINK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 dark:text-blue-400 hover:underline font-medium"
          >
            සිංහල වැල කතා • වල් කතා • වැල කතා • Sinhala Wal Katha 2026
          </a>
        </div>
      </div>
    </footer>
  );
};
