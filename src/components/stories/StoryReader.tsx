import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { Story, ReadingTheme, FontSize } from '../../types/story';
import { StoryCard } from './StoryCard';
import { getCategoryDisplayName } from '../../utils/categoryTaxonomy';

interface StoryReaderProps {
  story: Story;
  relatedStories: Story[];
  prevStory?: Story | null;
  nextStory?: Story | null;
  onBack: () => void;
  onSelectStory: (slug: string) => void;
  theme: ReadingTheme;
  onThemeChange?: (theme: ReadingTheme) => void;
  fontSize: FontSize;
  onFontSizeChange: (size: FontSize) => void;
}

export const StoryReader: React.FC<StoryReaderProps> = ({
  story,
  relatedStories,
  prevStory,
  nextStory,
  onBack,
  onSelectStory,
  fontSize,
  onFontSizeChange,
}) => {
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Calculate scroll reading progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Split story content into clean paragraphs
  const paragraphs = useMemo(() => {
    const raw = story.fullContent || story.content || '';
    return raw
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }, [story]);

  const formattedDate = new Date(story.uploadDate || story.uploadedDate || story.createdAt || 0).toLocaleDateString(
    'si-LK',
    {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );

  const readingTime = story.readingTime || Math.max(3, Math.ceil((story.fullContent || story.content || '').length / 450));

  const handleCopyLink = () => {
    try {
      const url = `https://www.walkathawa.site/story/${encodeURIComponent(story.slug)}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShareWhatsApp = () => {
    const url = `https://www.walkathawa.site/story/${encodeURIComponent(story.slug)}`;
    const text = encodeURIComponent(`${story.title}\nකියවන්න: ${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Font size styling
  const fontSizeClass = {
    sm: 'text-base sm:text-lg leading-relaxed sm:leading-loose',
    md: 'text-lg sm:text-xl leading-relaxed sm:leading-loose',
    lg: 'text-xl sm:text-2xl leading-relaxed sm:leading-loose',
    xl: 'text-2xl sm:text-3xl leading-loose',
  }[fontSize] || 'text-lg sm:text-xl leading-relaxed sm:leading-loose';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 z-50">
        <div
          className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* Navigation Breadcrumbs & Back Button */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>නැවත මුල් පිටුවට</span>
          </button>

          {/* Reading Font Size Controls */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-xs">
            <span className="text-xs font-semibold px-2 text-slate-400">අකුරු:</span>
            <button
              type="button"
              onClick={() => onFontSizeChange('sm')}
              className={`px-2 py-1 rounded-lg text-xs font-bold ${
                fontSize === 'sm' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => onFontSizeChange('md')}
              className={`px-2 py-1 rounded-lg text-xs font-bold ${
                fontSize === 'md' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => onFontSizeChange('lg')}
              className={`px-2 py-1 rounded-lg text-xs font-bold ${
                fontSize === 'lg' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              A+
            </button>
          </div>
        </div>

        {/* Story Article Container */}
        <article className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs">
          {/* Header Metadata */}
          <header className="border-b border-slate-100 dark:border-slate-800/80 pb-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                {getCategoryDisplayName(story.category)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {story.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400 pt-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formattedDate}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>කියවීමේ කාලය විනාඩි {readingTime}</span>
                </span>
              </div>

              {/* Share Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Copy link"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'පිටපත් විය!' : 'ලින්ක් එක ගන්න'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                  title="WhatsApp share"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </header>

          {/* Cover Photo (Optional Banner) */}
          {story.coverImage && (
            <div className="my-6 rounded-2xl overflow-hidden aspect-[16/9] max-h-96 bg-slate-100 dark:bg-slate-800">
              <img
                src={story.coverImage}
                alt={story.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Story Body Paragraphs */}
          <div className={`mt-8 text-slate-800 dark:text-slate-200 font-sans space-y-6 ${fontSizeClass}`}>
            {paragraphs.map((para, idx) => (
              <p key={idx} className="indent-4 sm:indent-8">
                {para}
              </p>
            ))}
          </div>

          {/* Story End Marker */}
          <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 tracking-widest uppercase">
              ~ කතාව නිමි ~
            </span>
          </div>
        </article>

        {/* Previous & Next Story Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prevStory ? (
            <button
              type="button"
              onClick={() => onSelectStory(prevStory.slug)}
              className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left hover:border-indigo-500/50 transition-all cursor-pointer group shadow-xs"
            >
              <ChevronLeft className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
              <div className="overflow-hidden">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">කලින් කතාව</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate block group-hover:text-indigo-600">
                  {prevStory.title}
                </span>
              </div>
            </button>
          ) : <div />}

          {nextStory ? (
            <button
              type="button"
              onClick={() => onSelectStory(nextStory.slug)}
              className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-right hover:border-indigo-500/50 transition-all cursor-pointer group shadow-xs sm:col-start-2"
            >
              <div className="overflow-hidden text-right w-full">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ඊළඟ කතාව</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate block group-hover:text-indigo-600">
                  {nextStory.title}
                </span>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
            </button>
          ) : null}
        </div>

        {/* 4 Related Stories Gallery */}
        {relatedStories && relatedStories.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                තවත් රසවත් කතා (Related Stories)
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedStories.map((relStory) => (
                <StoryCard
                  key={relStory.id}
                  story={relStory}
                  onRead={onSelectStory}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
