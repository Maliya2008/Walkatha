import React, { useState } from 'react';
import { Clock, Eye, ArrowRight, BookOpen } from 'lucide-react';
import { Story } from '../../types/story';
import { getCategoryDisplayName, getStoryCanonicalCategory } from '../../utils/categoryTaxonomy';
import { formatSinhalaTimeAgo, formatViewsCount, cleanCategoryBadgeName } from '../../utils/formatters';

interface StoryCardProps {
  story: Story;
  onRead: (slug: string) => void;
  onSelectCategory?: (categorySlug: string) => void;
  priority?: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onRead,
  onSelectCategory,
  priority = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const timeAgo = formatSinhalaTimeAgo(story.uploadDate || story.uploadedDate || story.createdAt);
  const viewsDisplay = formatViewsCount(story.views);
  const storyUrl = `/story/${encodeURIComponent(story.slug)}`;
  const canonicalCategorySlug = getStoryCanonicalCategory(story);
  const categoryName = cleanCategoryBadgeName(story.categoryName || getCategoryDisplayName(canonicalCategorySlug));

  const handleTitleOrCardClick = (e: React.MouseEvent) => {
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      onRead(story.slug);
    }
  };

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectCategory) {
      e.preventDefault();
      onSelectCategory(canonicalCategorySlug);
    }
  };

  const excerpt = story.shortDescription || story.description || '';
  const hasCoverImage = Boolean(story.coverImage && !imgError);

  return (
    <article
      id={`story-card-${story.id}`}
      className="group flex flex-col h-full bg-[#0b1633] border border-[#16264c] rounded-xl overflow-hidden shadow-xs hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-950/40 transition-all duration-200"
    >
      {/* 1. Gallery Cover / Header Area */}
      {hasCoverImage ? (
        <div className="relative block w-full aspect-16/10 overflow-hidden bg-[#070e1e]">
          <a
            href={storyUrl}
            onClick={handleTitleOrCardClick}
            className="block w-full h-full cursor-pointer"
            aria-label={story.title}
          >
            <img
              src={story.coverImage}
              alt={story.title}
              loading={priority ? 'eager' : 'lazy'}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </a>
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
            <a
              href={`/category/${canonicalCategorySlug}`}
              onClick={handleCategoryClick}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#0b1633]/90 text-rose-400 backdrop-blur-xs shadow-xs border border-rose-900/50 hover:bg-[#122045] transition-colors cursor-pointer select-none"
            >
              {categoryName}
            </a>
            {story.featured && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500 text-white shadow-xs uppercase tracking-wider">
                විශේෂාංග
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="relative w-full h-20 sm:h-24 bg-gradient-to-br from-rose-950/20 via-[#0b1633] to-[#070e1e] border-b border-[#16264c] p-3 flex flex-col justify-between overflow-hidden">
          <div className="absolute -right-3 -bottom-3 opacity-10 transform rotate-12 pointer-events-none">
            <BookOpen className="w-20 h-20 text-rose-500" />
          </div>
          <div className="flex items-center gap-1.5 z-10">
            <a
              href={`/category/${canonicalCategorySlug}`}
              onClick={handleCategoryClick}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#0b1633] text-rose-400 shadow-2xs border border-rose-900/50 hover:bg-[#122045] transition-colors cursor-pointer select-none"
            >
              {categoryName}
            </a>
            {story.featured && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-950/80 text-amber-300 uppercase tracking-wider border border-amber-800/40">
                විශේෂාංග
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. Card Content (Title, excerpt, footer) */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Story Title */}
          <h2 className="font-bold text-sm sm:text-base text-white leading-snug line-clamp-2 mb-1.5">
            <a
              href={storyUrl}
              onClick={handleTitleOrCardClick}
              className="hover:text-rose-400 transition-colors block text-white"
              title={story.title}
            >
              {story.title}
            </a>
          </h2>

          {/* Short Excerpt */}
          {excerpt && (
            <p className="text-xs text-[#cbd5e1] line-clamp-2 leading-relaxed font-normal">
              {excerpt}
            </p>
          )}
        </div>

        {/* 3. Metadata & Read Action */}
        <div className="mt-3.5 pt-2.5 border-t border-[#16264c] flex items-center justify-between gap-2 text-xs text-blue-200/80">
          <div className="flex items-center gap-2.5 min-w-0 truncate">
            {timeAgo && (
              <span className="flex items-center gap-1 font-medium truncate text-blue-200/80" title={timeAgo}>
                <Clock className="w-3 h-3 text-blue-300/70 shrink-0" />
                <span className="truncate">{timeAgo}</span>
              </span>
            )}

            {viewsDisplay && (
              <span className="flex items-center gap-1 font-medium shrink-0 text-blue-200/80">
                <Eye className="w-3 h-3 text-blue-300/70 shrink-0" />
                <span>{viewsDisplay}</span>
              </span>
            )}
          </div>

          <a
            href={storyUrl}
            onClick={handleTitleOrCardClick}
            className="inline-flex items-center gap-1 font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer shrink-0 group-hover:translate-x-0.5"
          >
            <span>කියවන්න</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </article>
  );
};
