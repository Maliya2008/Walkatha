import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Calendar, Eye, Bookmark, CheckCircle2 } from 'lucide-react';
import { Story, ReadingTheme, FontSize, FontFamily } from '../../types/story';
import { Badge } from '../common/Badge';
import { ReadingControls } from './ReadingControls';
import { SocialShare } from './SocialShare';
import { RelatedStories } from './RelatedStories';
import { adService } from '../../services/adService';

interface StoryReaderProps {
  story: Story;
  relatedStories: Story[];
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

  const storyKey = story.slug || story.id;

  // Initialize ad frequency state for this story
  useEffect(() => {
    if (storyKey) {
      adService.initStoryVisit(storyKey);
    }
  }, [storyKey]);

  // Optional subtle interaction trigger for subsequent redirects up to the post limit
  const handleReaderInteraction = useCallback(() => {
    if (storyKey && adService.canRedirectForStory(storyKey)) {
      adService.triggerStoryAd(storyKey);
    }
  }, [storyKey]);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${(totalScroll / (windowHeight || 1)) * 100}`;
      setScrollProgress(Number(scroll));
    };

    window.addEventListener('scroll', handleScroll);
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

  const fontFamClass = fontFamily === 'serif' ? 'font-serif' : 'font-sans';

  return (
    <div
      id="story-reader-container"
      className={`min-h-screen transition-colors duration-200 ${themeBgClasses}`}
      onClick={handleReaderInteraction}
    >
      <div className="fixed top-0 left-0 right-0 h-1 bg-transparent z-50">
        <div
          className="h-full bg-indigo-600 dark:bg-amber-400 transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Navigation & Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <button
            type="button"
            id="reader-back-btn"
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Stories</span>
          </button>

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

          <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 border-y border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
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
        <div className="max-w-[750px] mx-auto" onClick={(e) => e.stopPropagation()}>
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
            <p key={`p-${index}`} className={`mb-5 text-left leading-[1.8] sm:leading-loose ${paragraphTextClasses}`}>
              {paragraph}
            </p>
          ))}

          <div className="text-center my-8 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-widest font-semibold">
              <span>- End of Story -</span>
            </div>
          </div>

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

          <div onClick={(e) => e.stopPropagation()}>
            <SocialShare story={story} />
          </div>
        </main>

        <div onClick={(e) => e.stopPropagation()}>
          <RelatedStories stories={relatedStories} onRead={onSelectStory} />
        </div>
      </div>
    </div>
  );
};

