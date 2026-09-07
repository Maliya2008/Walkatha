import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  ExternalLink,
  Search,
  Copy,
  Check,
  Globe,
  Layers,
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { Story, Category } from '../../types/story';

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
  onSelectCategory
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copied, setCopied] = useState(false);

  // Update Page Title and SEO Tags for Sitemap
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'Walkathawa Sitemap (වල් කතාව සයිට්මැප්) | All Sinhala Stories Directory';
    
    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonical) {
      canonical.href = 'https://www.walkathawa.site/directory';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      document.title = originalTitle;
    };
  }, []);

  const publicBaseUrl = 'https://www.walkathawa.site';
  const xmlSitemapUrl = `${publicBaseUrl}/sitemap.xml`;

  const handleCopyXmlUrl = () => {
    navigator.clipboard.writeText(xmlSitemapUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      if (!story.published) return false;
      const matchesCategory =
        selectedCategory === 'all' ||
        story.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const titleMatch = story.title.toLowerCase().includes(q);
      const slugMatch = story.slug.toLowerCase().includes(q);
      const authorMatch = story.author?.name?.toLowerCase().includes(q);
      const tagMatch = story.tags?.some((t) => t.toLowerCase().includes(q));

      return titleMatch || slugMatch || authorMatch || tagMatch;
    });
  }, [stories, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Navigation & Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
            <button
              type="button"
              onClick={onNavigateHome}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              මුල් පිටුව (Home)
            </button>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold">
              සයිට්මැප් (Sitemap)
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Walkathawa Sitemap
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    වල් කතාව සියලුම කතා හා ප්‍රවර්ග සූචිය (Complete Sinhala Stories Index)
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-xs text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                <span>XML Sitemap (/sitemap.xml)</span>
              </a>

              <button
                type="button"
                onClick={handleCopyXmlUrl}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-600/20 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copied URL!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy XML URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span>ප්‍රකාශිත කතා (Stories)</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stories.filter((s) => s.published).length}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
              <Layers className="w-4 h-4 text-emerald-500" />
              <span>ප්‍රවර්ග (Categories)</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {categories.filter((c) => c.slug !== 'all').length}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
              <Globe className="w-4 h-4 text-amber-500" />
              <span>Google Index Status</span>
            </div>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Indexable Ready
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Domain Authority</span>
            </div>
            <div className="text-sm font-mono text-slate-700 dark:text-slate-300 mt-1 truncate">
              walkathawa.site
            </div>
          </div>
        </div>

        {/* Section 1: Main Platform Pages */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-500" />
            ප්‍රධාන පිටු (Core Site Pages)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome();
              }}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <span className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  මුල් පිටුව (Homepage)
                </span>
                <span className="block text-[11px] font-mono text-slate-400 mt-0.5">
                  https://www.walkathawa.site/
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            </a>

            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <span className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  XML Sitemap File
                </span>
                <span className="block text-[11px] font-mono text-slate-400 mt-0.5">
                  /sitemap.xml
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            </a>

            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <span className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Robots Directive
                </span>
                <span className="block text-[11px] font-mono text-slate-400 mt-0.5">
                  /robots.txt
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            </a>
          </div>
        </div>

        {/* Section 2: Categories Index */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-500" />
            ප්‍රවර්ග සූචිය (Categories Directory)
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories
              .filter((cat) => cat.slug !== 'all')
              .map((cat) => {
                const count = stories.filter((s) => s.published && s.category === cat.slug).length;
                return (
                  <button
                    key={cat.id || cat.slug}
                    type="button"
                    onClick={() => {
                      if (onSelectCategory) {
                        onSelectCategory(cat.slug);
                      } else {
                        window.location.href = `/?category=${cat.slug}`;
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <span>{cat.name}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500">
                      {count}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Section 3: Stories Directory */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                සියලුම සිංහල කතා (All Stories)
                <span className="text-xs font-normal text-slate-400">
                  ({filteredStories.length})
                </span>
              </h2>
            </div>

            {/* Search Filter */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="සොයන්න (Filter stories)..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Stories List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredStories.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                ගැලපෙන කතා කිසිවක් හමු නොවීය (No matching stories found).
              </div>
            ) : (
              filteredStories.map((story, index) => {
                const dateStr = story.updatedDate || story.uploadDate || story.uploadedDate;
                const formattedDate = dateStr
                  ? new Date(dateStr).toLocaleDateString('si-LK', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'නවතම';

                return (
                  <div
                    key={story.id || story.slug}
                    onClick={() => onSelectStory(story.slug)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {story.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          <span className="font-mono text-indigo-600 dark:text-indigo-400">
                            /story/{story.slug}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formattedDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {story.readingTime || 5} min read
                          </span>
                          {story.author?.name && (
                            <span>By: {story.author.name}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium capitalize">
                        {story.category}
                      </span>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* XML Sitemap Submission Instructions for Webmasters */}
        <div className="mt-12 p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
          <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Google Search Console වෙත Sitemap ඇතුළත් කිරීම
          </h3>
          <p className="text-xs text-indigo-900/70 dark:text-indigo-300/70 leading-relaxed mb-4">
            නව සිංහල වල් කතා සහ යාවත්කාලීන ඉක්මනින් Google Search හි පෙන්වීමට Search Console හි Sitemaps කොටසට පහත ලිපිනය ඇතුළත් කර Submit කරන්න:
          </p>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 font-mono text-xs text-indigo-600 dark:text-indigo-400">
            <span>https://www.walkathawa.site/sitemap.xml</span>
            <button
              type="button"
              onClick={handleCopyXmlUrl}
              className="p-1 hover:text-indigo-800 dark:hover:text-white transition-colors cursor-pointer"
              title="Copy"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
