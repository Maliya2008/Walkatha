import React, { useState } from 'react';
import { X, Search, FileText, ChevronRight } from 'lucide-react';
import { Story } from '../../types/story';

interface SitemapModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: Story[];
  onSelectStory: (slug: string) => void;
}

export const SitemapModal: React.FC<SitemapModalProps> = ({
  isOpen,
  onClose,
  stories,
  onSelectStory,
}) => {
  const [query, setQuery] = useState<string>('');

  if (!isOpen) return null;

  const filtered = stories.filter((s) =>
    (s.title || '').toLowerCase().includes(query.toLowerCase()) ||
    (s.category || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">සියලු කතා ලේඛනාගාරය (Sitemap Archive)</h3>
              <p className="text-xs text-slate-400">කතා {stories.length} ක් අතුරින් පහසුවෙන් සොයාගන්න</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="මාතෘකාව හෝ වර්ගය අනුව සොයන්න..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Story List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-800/50">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">කතා කිසිවක් හමු නොවීය.</div>
          ) : (
            filtered.map((s) => (
              <div
                key={s.id || s.slug}
                onClick={() => {
                  onSelectStory(s.slug || s.id);
                  onClose();
                }}
                className="py-3 px-2 flex items-center justify-between hover:bg-slate-800/40 rounded-xl cursor-pointer group transition-colors"
              >
                <div className="space-y-0.5 max-w-[80%]">
                  <h4 className="text-xs font-semibold text-slate-200 group-hover:text-rose-400 truncate">
                    {s.title}
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    {s.categoryName || s.category} • {s.uploadDate?.slice(0, 10)}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
