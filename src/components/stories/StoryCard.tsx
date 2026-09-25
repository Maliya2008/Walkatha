import React, { useState } from 'react';
import { Calendar, Clock, BookOpen, ArrowRight } from 'lucide-react';
import { Story } from '../../types/story';
import { getCategoryDisplayName } from '../../utils/categoryTaxonomy';

interface StoryCardProps {
  story: Story;
  onRead: (slug: string) => void;
  priority?: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, onRead, priority = false }) => {
  const [imgError, setImgError] = useState(false);

  const formattedDate = new Date(story.uploadDate || story.uploadedDate || story.createdAt || 0).toLocaleDateString(
    'si-LK',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );

  const readingTime = story.readingTime || Math.max(3, Math.ceil((story.fullContent || story.content || '').length / 450));
  const storyUrl = `/story/${encodeURIComponent(story.slug)}`;

  return (
    <article
      id={`story-card-${story.id}`}
      className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
    >
      {/* Cover Image Container */}
      <a
        href={storyUrl}
        onClick={(e) => {
          if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
            e.preventDefault();
            onRead(story.slug);
          }
        }}
        aria-label={`කියවන්න: ${story.title}`}
        className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer block select-none"
      >
        {!imgError && story.coverImage ? (
          <img
            src={story.coverImage}
            alt={story.title}
            loading={priority ? 'eager' : 'lazy'}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600/90 via-purple-600/90 to-slate-900 text-white p-4 text-center">
            <BookOpen className="w-8 h-8 mb-2 opacity-80" />
            <span className="font-bold text-sm line-clamp-1">{story.title}</span>
            <span className="text-[11px] opacity-75 mt-1 font-serif">Walkathawa</span>
          </div>
        )}

        {/* Category Pill Tag */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap pointer-events-none">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            {getCategoryDisplayName(story.category)}
          </span>
        </div>

        {story.featured && (
          <div className="absolute top-3 right-3 pointer-events-none">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm uppercase tracking-wide">
              Featured
            </span>
          </div>
        )}
      </a>

      {/* Content Section */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            <a
              href={storyUrl}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                  e.preventDefault();
                  onRead(story.slug);
                }
              }}
            >
              {story.title}
            </a>
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {story.shortDescription || story.description}
          </p>
        </div>

        {/* Card Footer Metadata */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>විනාඩි {readingTime}</span>
            </span>
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
            <span>කියවන්න</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </article>
  );
};
