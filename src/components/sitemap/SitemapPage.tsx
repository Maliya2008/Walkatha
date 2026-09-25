import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  Search,
  Copy,
  Check,
  Globe,
  ArrowLeft,
  Calendar,
  BookOpen,
  Rss,
} from 'lucide-react';
import { Story, Category } from '../../types/story';
import { getCategoryDisplayName } from '../../utils/categoryTaxonomy';

interface SitemapPageProps {
  stories: Story[];
  categories: Category[];
  onSelectStory: (slug: string) => void;
  onNavigateHome: () => void;
  onSelectCategory?: (slug: string) => void;
}

export const SitemapPage: React.FC<SitemapPageProps> = ({
  stories,
  categories,
  onSelectStory,
  onNavigateHome,
  onSelectCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [copied, setCopied] = useState(false);

  const filteredStories = useMemo(() => {
    let list = [...stories].filter((s) => s.published !== false);
    if (selectedCat !== 'all') {
      list = list.filter((s) => (s.category || '').toLowerCase().includes(selectedCat.toLowerCase()));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((s) => (s.title || '').toLowerCase().includes(q) || (s.slug || '').toLowerCase().includes(q));
    }
    return list;
  }, [stories, selectedCat, searchQuery]);

  const handleCopySitemapUrl = () => {
    try {
      navigator.clipboard.writeText('https://www.walkathawa.site/sitemap.xml');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>මුල් පිටුවට</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Walkathawa Sitemap & Archives (සියලු කතා සූචිය)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Google Indexing සහ පාඨක පහසුව සඳහා සියලුම සිංහල කතා සහ වර්ගීකරණ නාමාවලිය.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50 hover:bg-rose-100 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>XML Sitemap</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href="/feed.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50 hover:bg-amber-100 transition-colors"
            >
              <Rss className="w-3.5 h-3.5" />
              <span>RSS Feed</span>
            </a>

            <button
              type="button"
              onClick={handleCopySitemapUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'පිටපත් විය!' : 'URL එක ගන්න'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="සූචිය තුළ සොයන්න..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 focus:outline-hidden focus:border-rose-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none py-1">
          <button
            type="button"
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
              selectedCat === 'all'
                ? 'bg-rose-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            සියල්ල ({stories.length})
          </button>
          {categories
            .filter((c) => c.slug !== 'all')
            .map((c) => (
              <button
                key={c.id || c.slug}
                type="button"
                onClick={() => setSelectedCat(c.slug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  selectedCat === c.slug
                    ? 'bg-rose-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {c.name}
              </button>
            ))}
        </div>
      </div>

      {/* Directory Stories List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
          <span>කතා නාමාවලිය ({filteredStories.length})</span>
          <span>වර්ගීකරණය</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredStories.map((story, index) => (
            <div
              key={story.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 font-mono w-6">
                    {index + 1}.
                  </span>
                  <a
                    href={`/story/${encodeURIComponent(story.slug)}`}
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        onSelectStory(story.slug);
                      }
                    }}
                    className="font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {story.title}
                  </a>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-3 pl-8">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(story.uploadDate || 0).toLocaleDateString('si-LK')}</span>
                  </span>
                  <span className="font-mono">/story/{story.slug}</span>
                </div>
              </div>

              <div className="pl-8 sm:pl-0 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {getCategoryDisplayName(story.category)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
