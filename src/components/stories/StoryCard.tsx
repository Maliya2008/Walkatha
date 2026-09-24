import React from 'react';
import { Eye, Calendar, ArrowRight, Layers } from 'lucide-react';
import { Story } from '../../types/story';
import { Badge } from '../common/Badge';
import { getCategoryDisplayName } from '../../utils/categoryTaxonomy';
import { detectSeriesInfo, getEpisodeCanonicalUrl } from '../../utils/seriesTaxonomy';

interface StoryCardProps {
  story: Story;
  onRead: (slug: string, seriesSlug?: string, episodeNumber?: number) => void;
  priority?: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, onRead, priority = false }) => {
  const formattedDate = new Date(story.uploadDate || story.uploadedDate || 0).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const seriesInfo = detectSeriesInfo(story);
  const canonicalUrl = getEpisodeCanonicalUrl(story);

  return (
    <article
      id={`story-card-${story.id}`}
      className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 hover:shadow-sm"
    >
      {/* Cover Image */}
      <a
        href={canonicalUrl}
        onClick={(e) => {
          if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
            e.preventDefault();
            onRead(story.slug, seriesInfo.seriesSlug, seriesInfo.episodeNumber);
          }
        }}
        aria-label={`Read ${story.title}`}
        className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer block"
      >
        <img
          src={story.coverImage}
          alt={story.title}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          width={400}
          height={225}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap pointer-events-none">
          <Badge variant="accent" size="sm">
            {getCategoryDisplayName(story.category)}
          </Badge>
          {seriesInfo.isSeries && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600/90 backdrop-blur-xs text-white shadow-xs">
              Ep {seriesInfo.episodeNumber}
            </span>
          )}
          {story.featured && (
            <Badge variant="primary" size="sm">
              Featured
            </Badge>
          )}
        </div>
      </a>

      {/* Story Details Body */}
      <div className="flex flex-col flex-1 p-4">
        {seriesInfo.isSeries && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
            <Layers className="w-3 h-3" />
            <span className="truncate">{seriesInfo.seriesTitle}</span>
          </div>
        )}

        {/* Title */}
        <h3
          id={`story-title-${story.id}`}
          className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors line-clamp-2 mb-1.5 font-serif leading-snug"
        >
          <a
            href={canonicalUrl}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                e.preventDefault();
                onRead(story.slug, seriesInfo.seriesSlug, seriesInfo.episodeNumber);
              }
            }}
          >
            {story.title}
          </a>
        </h3>

        {/* Short Description */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed flex-1">
          {story.shortDescription || story.description}
        </p>

        {/* Metadata Section */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Eye className="w-3 h-3" />
              <span>{(story.views || 0).toLocaleString()}</span>
            </div>
          </div>

          <a
            href={canonicalUrl}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                e.preventDefault();
                onRead(story.slug, seriesInfo.seriesSlug, seriesInfo.episodeNumber);
              }
            }}
            aria-label={`Read ${story.title}`}
            className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline group-hover:translate-x-0.5 transition-transform"
          >
            <span>කියවන්න</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </article>
  );
};
