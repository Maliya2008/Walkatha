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
  Eye,
  BookOpen,
} from 'lucide-react';
import { Story, ReadingTheme, FontSize } from '../../types/story';
import { StoryCard } from './StoryCard';
import { getCategoryDisplayName } from '../../utils/categoryTaxonomy';
import {
  formatSinhalaDate,
  formatSinhalaTimeAgo,
  formatViewsCount,
  cleanCategoryBadgeName,
} from '../../utils/formatters';

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

  // Calculate reading progress percentage
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

  // Split story into clean paragraphs
  const paragraphs = useMemo(() => {
    const raw = story.fullContent || story.content || '';
    return raw
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }, [story]);

  const dateFormatted = formatSinhalaDate(story.uploadDate || story.uploadedDate || story.createdAt);
  const readingTime = story.readingTime || Math.max(3, Math.ceil((story.fullContent || story.content || '').length / 450));
  const viewsDisplay = formatViewsCount(story.views);
  const categoryName = cleanCategoryBadgeName(story.categoryName || getCategoryDisplayName(story.category));

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

  // Font size styling classes tailored for Sinhala readability
  const fontClass = {
    sm: 'text-[16px] sm:text-[17px] leading-[1.8] sm:leading-[1.9]',
    md: 'text-[18px] sm:text-[19px] leading-[1.85] sm:leading-[1.95]',
    lg: 'text-[20px] sm:text-[21px] leading-[1.9] sm:leading-[2.0]',
    xl: 'text-[22px] sm:text-[24px] leading-[1.95] sm:leading-[2.05]',
  }[fontSize] || 'text-[18px] sm:text-[19px] leading-[1.85] sm:leading-[1.95]';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 z-50">
        <div
          className="h-full bg-rose-600 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Narrow reading column */}
      <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6 space-y-6">
        {/* Top Controls: Back button & Reading Tools */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>මුල් පිටුවට</span>
          </button>

          {/* Reading Font Size Adjustment */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-1 rounded-lg shadow-xs text-xs">
            <span className="px-1 text-[11px] font-medium text-slate-400">අකුරු:</span>
            <button
              type="button"
              onClick={() => onFontSizeChange('sm')}
              className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                fontSize === 'sm'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => onFontSizeChange('md')}
              className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                fontSize === 'md'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => onFontSizeChange('lg')}
              className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                fontSize === 'lg'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              A+
            </button>
          </div>
        </div>

        {/* Story Article Container */}
        <article className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-7 shadow-xs">
          {/* Header Metadata */}
          <header className="border-b border-slate-100 dark:border-slate-800/80 pb-5 space-y-3">
            {/* 1. Category */}
            <div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40 inline-block">
                {categoryName}
              </span>
            </div>

            {/* 2. Story Title */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug break-words">
              {story.title}
            </h1>

            {/* 3. Updated Date / Reading Duration / Views & Share */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{dateFormatted}</span>
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>විනාඩි {readingTime} කියවීමක්</span>
                </span>
                {viewsDisplay && (
                  <span className="flex items-center gap-1 font-medium">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>{viewsDisplay}</span>
                  </span>
                )}
              </div>

              {/* Share Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  title="ලින්ක් එක පිටපත් කරන්න"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'පිටපත් විය' : 'ලින්ක් එක'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                  title="WhatsApp වෙත යවන්න"
                >
                  <Share2 className="w-3 h-3" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </header>

          {/* Optional Story Cover Image */}
          {story.coverImage && (
            <div className="my-5 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
              <img
                src={story.coverImage}
                alt={story.title}
                className="w-full max-h-80 object-cover"
              />
            </div>
          )}

          {/* Story Introduction / Description if available */}
          {(story.shortDescription || story.description) && (
            <div className="my-5 p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-lg border-l-4 border-rose-500 text-sm sm:text-base text-slate-600 dark:text-slate-300 italic leading-relaxed">
              {story.shortDescription || story.description}
            </div>
          )}

          {/* Distraction-Free Story Body */}
          <div className={`mt-6 text-slate-800 dark:text-slate-200 space-y-5 ${fontClass}`}>
            {paragraphs.map((para, idx) => (
              <p key={idx} className="break-words">
                {para}
              </p>
            ))}
          </div>

          {/* Story End Marker */}
          <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <span className="text-xs sm:text-sm font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
              ~ කතාව නිමි ~
            </span>
          </div>
        </article>

        {/* Previous & Next Story Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {prevStory ? (
            <button
              type="button"
              onClick={() => onSelectStory(prevStory.slug)}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-left hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer group shadow-xs"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-colors shrink-0" />
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  කලින් කතාව
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate block group-hover:text-rose-600">
                  {prevStory.title}
                </span>
              </div>
            </button>
          ) : <div />}

          {nextStory ? (
            <button
              type="button"
              onClick={() => onSelectStory(nextStory.slug)}
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-right hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer group shadow-xs sm:col-start-2"
            >
              <div className="overflow-hidden text-right w-full">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  ඊළඟ කතාව
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate block group-hover:text-rose-600">
                  {nextStory.title}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-colors shrink-0" />
            </button>
          ) : null}
        </div>

        {/* Related Stories */}
        {relatedStories && relatedStories.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                තවත් රසවත් කතා
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedStories.slice(0, 4).map((relStory) => (
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
