import React from 'react';
import { BookOpen, Shield, Heart, FileText, Lock } from 'lucide-react';
import { Category } from '../../types/story';

interface FooterProps {
  categories: Category[];
  onSelectCategory: (slug: string) => void;
  onOpenSitemap: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  categories,
  onSelectCategory,
  onOpenSitemap,
}) => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/90 text-slate-400 py-12 px-4 mt-16 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-200 text-base">Walkathawa (වල් කතාව)</h4>
              <p className="text-xs text-slate-400">ශ්‍රී ලාංකික සිංහල කතා රසිකයන්ගේ ප්‍රමුඛතම කියවීමේ අවකාශය</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <button
              onClick={onOpenSitemap}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              සමස්ත ලේඛනාගාරය (Sitemap)
            </button>
            <a
              href="/admin"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            >
              <Lock className="w-3 h-3 text-slate-500" />
              කළමනාකරණය
            </a>
          </div>
        </div>

        {/* Categories Bar */}
        {categories && categories.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">ප්‍රධාන වර්ගීකරණ</h5>
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 10).map((cat) => (
                <button
                  key={cat.id || cat.slug}
                  onClick={() => onSelectCategory(cat.slug || cat.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800/80 transition-colors cursor-pointer"
                >
                  {cat.sinhalaName || cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Legal & Compliance Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 text-xs text-slate-500 border-t border-slate-900">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-rose-400/90 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
              <Shield className="w-3.5 h-3.5" />
              18+ වැඩිහිටි සාහිත්‍ය කෘති අඩංගු වේ
            </span>
            <span className="text-slate-600">•</span>
            <span>සම්පූර්ණ ප්‍රකාශන හිමිකම සුරක්ෂිතයි.</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="/dmca" className="hover:text-slate-300 transition-colors">DMCA</a>
            <a href="/about" className="hover:text-slate-300 transition-colors">About</a>
            <a href="/contact" className="hover:text-slate-300 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
