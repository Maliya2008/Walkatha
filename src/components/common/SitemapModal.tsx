import React from 'react';
import { X, Globe, FileText, ExternalLink } from 'lucide-react';
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
  if (!isOpen) return null;

  return (
    <div
      id="sitemap-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Globe className="w-5 h-5 text-indigo-500" />
            <span>SEO Sitemap & Direct Story Index</span>
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
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Crawler & Bot Endpoints:
            </div>
            <p className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
              /sitemap.xml • /robots.txt
            </p>
          </div>

          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-4">
            Published Story Canonical URLs:
          </h4>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {stories.map((story) => (
              <div
                key={story.id}
                onClick={() => {
                  onSelectStory(story.slug);
                  onClose();
                }}
                className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">
                      {story.title}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      /story/{story.slug}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
