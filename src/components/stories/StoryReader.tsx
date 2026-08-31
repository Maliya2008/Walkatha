import React, { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Clock, Calendar, Eye, Bookmark, CheckCircle2 } from 'lucide-react';
import { Story, ReadingTheme, FontSize, FontFamily } from '../../types/story';
import { Badge } from '../common/Badge';
import { ReadingControls } from './ReadingControls';
import { SocialShare } from './SocialShare';
import { RelatedStories } from './RelatedStories';
import { MonetagAdSlot } from '../ads/MonetagAdSlot';

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

  // Reading progress scroll tracker
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        const progress = Math.min(100, Math.max(0, (totalScroll / windowHeight) * 100));
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Split full content into clean paragraphs for safe rendering & between-content monetization insertion
  const paragraphs = useMemo(() => {
    return story.fullContent
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }, [story.fullContent]);

  const formattedDate = new Date(story.uploadDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Typography font size classes
  const fontSizes = {
    sm: 'text-base leading-relaxed',
    md: 'text-lg leading-relaxed sm:text-[19px]',
    lg: 'text-xl leading-relaxed sm:text-[22px]',
    xl: 'text-2xl leading-relaxed sm:text-[25px]',
  }[fontSize];

  // Theme container styling
  const themeBgClasses = {
    light: 'bg-white text-slate-900',
    sepia: 'bg-[#fbf7ee] text-[#423326]',
    dark: 'bg-slate-950 text-slate-100',
  }[theme];

  const fontFamClass = fontFamily === 'serif' ? 'font-serif' : 'font-sans';

  return (
    <div id="story-reader-container" className={`min-h-screen transition-colors duration-200 ${themeBgClasses}`}>
      {/* Top Scroll Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-transparent z-50">
        <div
          className="h-full bg-indigo-600 dark:bg-amber-400 transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Navigation Breadcrumb & Back action */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            type="button"
            id="reader-back-btn"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Stories</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="reader-bookmark-btn"
              onClick={() => setIsBookmarked(!isBookmarked)}
              aria-label="Bookmark story"
              className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                isBookmarked
                  ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                  : 'border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Top Header Ad Placement (Monetag Leaderboard / Banner) */}
        <div className="my-4">
          <MonetagAdSlot type="header" slotLabel="Header Sponsor (Monetag Top Unit)" />
        </div>

        {/* Story Article Header */}
        <header className="mt-4 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="accent" size="md">
              {story.categoryName || story.category}
            </Badge>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Short Fiction
            </span>
          </div>

          <h1
            id="reader-story-title"
            className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white"
          >
            {story.title}
          </h1>

          {/* Excerpt */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 italic mb-6 leading-relaxed border-l-3 border-indigo-500 pl-4">
            {story.shortDescription}
          </p>

          {/* Author & Story Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <img
                src={story.author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                alt={story.author.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              <div>
                <span className="block font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {story.author.name}
                </span>
                <span className="text-[11px] text-slate-400">Published Author</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {story.readingTime} min read
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                {story.views.toLocaleString()} views
              </span>
            </div>
          </div>
        </header>

        {/* Large Story Cover Image */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-6 shadow-md bg-slate-100 dark:bg-slate-800">
          <img
            src={story.coverImage}
            alt={story.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Reading Controls Customization Toolbar (Theme, Font Size, Serif/Sans) */}
        <ReadingControls
          theme={theme}
          onThemeChange={onThemeChange}
          fontSize={fontSize}
          onFontSizeChange={onFontSizeChange}
          fontFamily={fontFamily}
          onFontFamilyChange={onFontFamilyChange}
        />

        {/* Main Story Content Container with Monetag In-Article Ad Placements */}
        <main id="reader-story-body" className={`max-w-2xl mx-auto my-8 ${fontFamClass} ${fontSizes}`}>
          {paragraphs.map((paragraph, index) => {
            return (
              <React.Fragment key={`p-${index}`}>
                <p className="mb-6 text-justify text-slate-800 dark:text-slate-200">
                  {paragraph}
                </p>

                {/* Monetag In-Article Ad Slot: Inserted automatically after paragraph 2 */}
                {index === 1 && paragraphs.length > 2 && (
                  <div className="my-8">
                    <MonetagAdSlot
                      type="in-article"
                      slotLabel="Sponsored Story Break (Monetag Mid-Article Unit 1)"
                    />
                  </div>
                )}

                {/* Second Monetag In-Article Ad Slot for longer stories (after paragraph 4) */}
                {index === 3 && paragraphs.length > 4 && (
                  <div className="my-8">
                    <MonetagAdSlot
                      type="in-article"
                      slotLabel="Sponsored Story Break (Monetag Mid-Article Unit 2)"
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* End of Story Marker */}
          <div className="text-center my-10 flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-0.5 bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-widest font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>End of Story</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-300 dark:bg-slate-700" />
          </div>

          {/* Story Tags */}
          {story.tags && story.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 my-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400">Tags:</span>
              {story.tags.map((tag) => (
                <Badge key={tag} variant="outline" size="sm">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Social Share Bar */}
          <SocialShare title={story.title} />

          {/* Author Card Box */}
          <div className="my-8 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
            <img
              src={story.author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
              alt={story.author.name}
              className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400">
                About the Author
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {story.author.name}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {story.author.bio || 'Author and creative writer sharing short stories on the web.'}
              </p>
            </div>
          </div>
        </main>

        {/* Footer Monetag Ad Placement */}
        <div className="my-6">
          <MonetagAdSlot type="footer" slotLabel="Footer Sponsor (Monetag Bottom Unit)" />
        </div>

        {/* Related Stories Carousel/Grid */}
        <RelatedStories stories={relatedStories} onRead={onSelectStory} />
      </div>
    </div>
  );
};
