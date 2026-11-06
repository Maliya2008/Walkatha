import React, { useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Eye,
  Heart,
  Share2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  Check,
} from 'lucide-react';
import { Story, FontSize, ReadingTheme } from '../../types/story';
import { StoryCard } from '../StoryCard';

interface StoryReaderProps {
  story: Story;
  relatedStories: Story[];
  prevStory: Story | null;
  nextStory: Story | null;
  onBack: () => void;
  onSelectStory: (slug: string) => void;
  onSelectCategory: (cat: string) => void;
  theme: ReadingTheme;
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
  onSelectCategory,
  fontSize,
  onFontSizeChange,
}) => {
  const [likesCount, setLikesCount] = useState<number>(story.likes || 0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('walkathawa_bookmarks');
      if (stored) {
        const arr = JSON.parse(stored);
        return arr.includes(story.slug);
      }
    } catch {}
    return false;
  });

  const handleLike = () => {
    if (!hasLiked) {
      setLikesCount((c) => c + 1);
      setHasLiked(true);
    }
  };

  const handleBookmark = () => {
    try {
      const stored = localStorage.getItem('walkathawa_bookmarks');
      const arr: string[] = stored ? JSON.parse(stored) : [];
      let updated: string[];
      if (arr.includes(story.slug)) {
        updated = arr.filter((s) => s !== story.slug);
        setIsBookmarked(false);
      } else {
        updated = [...arr, story.slug];
        setIsBookmarked(true);
      }
      localStorage.setItem('walkathawa_bookmarks', JSON.stringify(updated));
    } catch {}
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: story.title,
          text: story.shortDescription || story.description,
          url,
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {}
  };

  const authorName = typeof story.author === 'string' ? story.author : story.author?.name || 'Walkathawa කර්තෘ මණ්ඩලය';
  const storyBody = story.fullContent || story.content || story.description || story.shortDescription || '';

  const fontSizeClass = {
    sm: 'text-sm sm:text-base leading-relaxed sm:leading-loose',
    md: 'text-base sm:text-lg leading-relaxed sm:leading-loose',
    lg: 'text-lg sm:text-xl leading-relaxed sm:leading-loose',
    xl: 'text-xl sm:text-2xl leading-relaxed sm:leading-loose',
  }[fontSize];

  return (
    <article className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Top Breadcrumb & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          ආපසු (Back)
        </button>

        {/* Font Size Adjusters */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
          <span className="text-slate-400 px-2">අකුරු ප්‍රමාණය:</span>
          {(['sm', 'md', 'lg', 'xl'] as FontSize[]).map((size) => (
            <button
              key={size}
              onClick={() => onFontSizeChange(size)}
              className={`px-2.5 py-1 rounded-lg uppercase font-semibold transition-all cursor-pointer ${
                fontSize === size
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Story Header */}
      <header className="space-y-4">
        {/* Category & Tags */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSelectCategory(story.category || 'all')}
            className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 cursor-pointer"
          >
            {story.categoryName || story.category}
          </button>
          {(story.tags || []).map((t, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 rounded-full text-xs bg-slate-800/80 text-slate-400 border border-slate-700/60"
            >
              #{t}
            </span>
          ))}
        </div>

        {/* Story H1 */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight leading-snug">
          {story.title}
        </h1>

        {/* Metadata stats */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
          <span>කර්තෘ: <strong className="text-slate-200">{authorName}</strong></span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            කියවීමට ගතවන කාලය: {story.readingTime || 10} මිනිත්තු
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            කියවීම්: {story.views || 0}
          </span>
        </div>
      </header>

      {/* Story Content Reader Surface */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-xl">
        <div className={`text-slate-200 font-sans tracking-normal whitespace-pre-line ${fontSizeClass}`}>
          {storyBody}
        </div>
      </div>

      {/* Interaction Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              hasLiked
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-950/40'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            <Heart className="w-4 h-4" fill={hasLiked ? 'currentColor' : 'none'} />
            <span>{likesCount} කැමැත්ත පළකරන්න</span>
          </button>

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-950/40'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
            <span>{isBookmarked ? 'සුරකින ලදි' : 'පසු කියවීම සඳහා සුරකින්න'}</span>
          </button>
        </div>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
        >
          {copiedShare ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>ලින්ක් එක කොපි විය!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-slate-400" />
              <span>බෙදාගන්න (Share)</span>
            </>
          )}
        </button>
      </div>

      {/* Previous / Next Navigation */}
      {(prevStory || nextStory) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
          {prevStory ? (
            <button
              onClick={() => onSelectStory(prevStory.slug || prevStory.id)}
              className="flex flex-col items-start p-4 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-2xl text-left transition-all cursor-pointer group"
            >
              <span className="flex items-center gap-1 text-xs text-slate-400 mb-1 group-hover:text-rose-400">
                <ChevronLeft className="w-3.5 h-3.5" /> පෙර කතාව
              </span>
              <span className="text-sm font-semibold text-slate-200 line-clamp-1 group-hover:text-white">
                {prevStory.title}
              </span>
            </button>
          ) : <div />}

          {nextStory && (
            <button
              onClick={() => onSelectStory(nextStory.slug || nextStory.id)}
              className="flex flex-col items-end p-4 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-2xl text-right transition-all cursor-pointer group"
            >
              <span className="flex items-center gap-1 text-xs text-slate-400 mb-1 group-hover:text-rose-400">
                ඊළඟ කතාව <ChevronRight className="w-3.5 h-3.5" />
              </span>
              <span className="text-sm font-semibold text-slate-200 line-clamp-1 group-hover:text-white">
                {nextStory.title}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Related Stories Section */}
      {relatedStories && relatedStories.length > 0 && (
        <section className="space-y-4 pt-8 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <h3 className="text-lg font-bold text-slate-100">තවත් රසවත් සිංහල කතා (Related Stories)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedStories.map((rel) => (
              <StoryCard
                key={rel.id || rel.slug}
                story={rel}
                onSelect={() => onSelectStory(rel.slug || rel.id)}
                isBookmarked={false}
                onToggleBookmark={() => {}}
              />
            ))}
          </div>
        </section>
      )}
    </article>
  );
};
