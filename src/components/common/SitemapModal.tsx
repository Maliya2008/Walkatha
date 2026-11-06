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
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0a142c] border border-[#182a55] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#16264c]">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Globe className="w-5 h-5 text-blue-400" />
            <span>SEO Sitemap & Direct Story Index</span>
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
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-blue-200/80">
          <div className="p-3 bg-[#070e1e] rounded-xl border border-[#16264c]">
            <div className="font-semibold text-white mb-1">
              Crawler & Bot Endpoints:
            </div>
            <p className="font-mono text-[11px] text-blue-300">
              /sitemap.xml • /robots.txt
            </p>
          </div>

          <h4 className="font-bold text-white text-sm mt-4">
            Published Story Canonical URLs:
          </h4>

          <div className="divide-y divide-[#16264c] border border-[#16264c] rounded-xl overflow-hidden">
            {stories.map((story) => (
              <div
                key={story.id}
                onClick={() => {
                  onSelectStory(story.slug);
                  onClose();
                }}
                className="p-3 flex items-center justify-between bg-[#0b1633] hover:bg-[#111f44] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-blue-300" />
                  <div>
                    <span className="font-bold text-white block">
                      {story.title}
                    </span>
                    <span className="text-[11px] font-mono text-blue-200/60">
                      /story/{story.slug}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-blue-300" />
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-3 bg-[#070e1e] border-t border-[#16264c] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
