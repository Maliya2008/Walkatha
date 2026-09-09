import React, { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Eye, Bookmark, CheckCircle2, ChevronRight, Home } from 'lucide-react';
import { Story, ReadingTheme, FontSize, FontFamily } from '../../types/story';
import { Badge } from '../common/Badge';
import { ReadingControls } from './ReadingControls';
import { SocialShare } from './SocialShare';
import { RelatedStories } from './RelatedStories';
import { SkyscraperAdBanner } from '../common/SkyscraperAdBanner';
import { HorizontalAdBanner } from '../common/HorizontalAdBanner';

interface StoryReaderProps {
  story: Story;
  relatedStories: Story[];
  prevStory?: Story | null;
  nextStory?: Story | null;
  onBack: () => void;
  onSelectStory: (slug: string) => void;
  theme: ReadingTheme;
  onThemeChange: (theme: ReadingTheme) => void;
  fontSize: FontSize;
  onFontSizeChange: (size: FontSize) => void;
  fontFamily: FontFamily;
  onFontFamilyChange: (family: FontFamily) => void;
}

export const StoryReader: React.FC<StoryReaderProps> = ({
  story,
  relatedStories,
  prevStory,
  nextStory,
  onBack,
  onSelectStory,
  theme,
  onThemeChange,
  fontSize,
  onFontSizeChange,
  fontFamily,
  onFontFamilyChange,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${(totalScroll / (windowHeight || 1)) * 100}`;
      setScrollProgress(Number(scroll));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const contentToRender = story.fullContent || story.content || '';
  const paragraphs = useMemo(() => {
    return contentToRender.split('\n\n').filter((p) => p.trim().length > 0);
  }, [contentToRender]);

  const formattedDate = new Date(story.uploadDate || story.uploadedDate || 0).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const fontSizes = {
    sm: 'text-base leading-relaxed',
    md: 'text-lg leading-relaxed sm:text-[19px]',
    lg: 'text-xl leading-relaxed sm:text-[22px]',
    xl: 'text-2xl leading-relaxed sm:text-[25px]',
  }[fontSize];

  const themeBgClasses = {
    light: 'bg-white text-slate-900',
    sepia: 'bg-[#fbf7ee] text-[#423326]',
    dark: 'bg-slate-950 text-slate-100',
  }[theme];

  const titleTextClasses = {
    light: 'text-slate-900',
    sepia: 'text-[#36271c]',
    dark: 'text-slate-50',
  }[theme];

  const descTextClasses = {
    light: 'text-slate-600',
    sepia: 'text-[#5b4636]',
    dark: 'text-slate-300',
  }[theme];

  const paragraphTextClasses = {
    light: 'text-slate-900',
    sepia: 'text-[#423326]',
    dark: 'text-slate-100',
  }[theme];

  const metaTextClasses = {
    light: 'text-slate-600 border-slate-200',
    sepia: 'text-[#6b5544] border-[#e8dfcf]',
    dark: 'text-slate-400 border-slate-800',
  }[theme];

  const fontFamClass = fontFamily === 'serif' ? 'font-serif' : 'font-sans';

  return (
    <div
      id="story-reader-container"
      className={`min-h-screen transition-colors duration-200 ${themeBgClasses}`}
    >
      <div className="fixed top-0 left-0 right-0 h-1 bg-transparent z-50">
        <div
          className="h-full bg-indigo-600 dark:bg-amber-400 transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Sticky Skyscraper Ad Banner (Right Gutter) on XL screens (1280px+) */}
        <div className="hidden xl:block absolute left-[calc(100%+24px)] 2xl:left-[calc(100%+36px)] top-28 select-none">
          <div className="sticky top-20">
            <SkyscraperAdBanner id="reader-right-skyscraper" />
          </div>
        </div>

        {/* Sticky Skyscraper Ad Banner (Left Gutter) on 2XL screens (1536px+) */}
        <div className="hidden 2xl:block absolute right-[calc(100%+36px)] top-28 select-none">
          <div className="sticky top-20">
            <SkyscraperAdBanner id="reader-left-skyscraper" />
          </div>
        </div>

        {/* Navigation & Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <a
            href="/"
            id="reader-back-btn"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                onBack();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Stories</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="reader-bookmark-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsBookmarked(!isBookmarked);
              }}
              aria-label="Bookmark story"
              className={`p-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isBookmarked
                  ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                  : 'border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400'
              }`}
            >
              {isBookmarked ? <CheckCircle2 className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Breadcrumb Navigation for SEO & Fast Context */}
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          <ol className="flex items-center flex-wrap gap-1.5 list-none p-0 m-0">
            <li>
              <a
                href="/"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    onBack();
                  }
                }}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
              >
                <Home className="w-3 h-3" />
                <span>Home</span>
              </a>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </li>
            {story.category && (
              <>
                <li>
                  <a
                    href={`/?category=${story.category}`}
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        window.location.href = `/?category=${story.category}`;
                      }
                    }}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {story.categoryName || story.category}
                  </a>
                </li>
                <li aria-hidden="true">
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </li>
              </>
            )}
            <li aria-current="page" className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-xs">
              {story.title}
            </li>
          </ol>
        </nav>

        {/* Story Header */}
        <header className="max-w-[750px] mx-auto mt-2 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="accent" size="sm">
              {story.categoryName || story.category}
            </Badge>
          </div>

          <h1
            id="reader-story-title"
            className={`text-2xl sm:text-3xl font-bold tracking-tight mb-3 font-serif leading-snug ${titleTextClasses}`}
          >
            {story.title}
          </h1>

          <p className={`text-sm sm:text-base italic mb-4 leading-relaxed border-l-2 border-indigo-500 pl-3 ${descTextClasses}`}>
            {story.shortDescription || story.description}
          </p>

          <div className={`flex flex-wrap items-center justify-between gap-3 py-2.5 border-y text-xs font-medium ${metaTextClasses}`}>
            <div className="flex items-center gap-4">
              <span id="story-date-display" className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 opacity-75" />
                {formattedDate}
              </span>
              <span id="story-view-count" className="flex items-center gap-1.5 text-indigo-600 dark:text-amber-400 font-semibold">
                <Eye className="w-3.5 h-3.5" />
                {(story.views || 0).toLocaleString()} views
              </span>
            </div>
          </div>
        </header>

        {/* Story Cover Image */}
        <div className="max-w-[750px] mx-auto relative aspect-[16/9] w-full rounded-xl overflow-hidden mb-5 shadow-sm bg-slate-100 dark:bg-slate-800">
          <img
            src={story.coverImage}
            alt={story.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Reading Customization Controls */}
        <div className="max-w-[750px] mx-auto">
          <ReadingControls
            theme={theme}
            onThemeChange={onThemeChange}
            fontSize={fontSize}
            onFontSizeChange={onFontSizeChange}
            fontFamily={fontFamily}
            onFontFamilyChange={onFontFamilyChange}
          />
        </div>

        {/* Main Content Body */}
        <main id="reader-story-body" className={`max-w-[750px] mx-auto my-6 ${fontFamClass} ${fontSizes}`}>
          {paragraphs.map((paragraph, index) => (
            <React.Fragment key={`p-${index}`}>
              <p className={`mb-5 text-left leading-[1.8] sm:leading-loose ${paragraphTextClasses}`}>
                {paragraph}
              </p>
              {paragraphs.length >= 4 && index === Math.floor(paragraphs.length / 2) && (
                <HorizontalAdBanner id={`in-article-ad-${index}`} showLabel={true} className="my-7" />
              )}
            </React.Fragment>
          ))}

          <div className="text-center my-6 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-widest font-semibold">
              <span>- End of Story -</span>
            </div>
          </div>

          {/* Post-Story Horizontal Ad Banner */}
          <HorizontalAdBanner id="reader-post-story-ad" showLabel={true} className="my-6" />

          {story.tags && story.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 my-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400">Tags:</span>
              {story.tags.map((tag) => (
                <Badge key={tag} variant="outline" size="sm">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          <div>
            <SocialShare story={story} />
          </div>

          {/* Previous & Next Story Navigation for SEO crawling and user flow */}
          {(prevStory || nextStory) && (
            <nav aria-label="Adjacent Stories" className="my-8 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-slate-200/80 dark:border-slate-800">
              {prevStory ? (
                <a
                  href={`/story/${prevStory.slug}`}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey) {
                      e.preventDefault();
                      onSelectStory(prevStory.slug);
                    }
                  }}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-xs transition-all flex flex-col group text-left"
                >
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                    <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Previous Story</span>
                  </span>
                  <span className="font-serif font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {prevStory.title}
                  </span>
                </a>
              ) : (
                <div />
              )}
              {nextStory ? (
                <a
                  href={`/story/${nextStory.slug}`}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey) {
                      e.preventDefault();
                      onSelectStory(nextStory.slug);
                    }
                  }}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-xs transition-all flex flex-col sm:items-end group text-left sm:text-right"
                >
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                    <span>Next Story</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                  <span className="font-serif font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {nextStory.title}
                  </span>
                </a>
              ) : (
                <div />
              )}
            </nav>
          )}
        </main>

        <div>
          <RelatedStories stories={relatedStories} onRead={onSelectStory} />
        </div>

        {/* Bottom Horizontal Ad Banner */}
        <HorizontalAdBanner id="reader-bottom-ad" showLabel={true} className="mt-8 mb-4" />
      </div>
    </div>
  );
};

