import React from 'react';
import { Clock, Eye, Calendar, ArrowRight } from 'lucide-react';
import { Story } from '../../types/story';
import { Badge } from '../common/Badge';

interface StoryCardProps {
  story: Story;
  onRead: (slug: string) => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, onRead }) => {
  const formattedDate = new Date(story.uploadDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article
      id={`story-card-${story.id}`}
      className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 hover:shadow-md"
    >
      {/* Cover Image */}
      <div
        className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer"
        onClick={() => onRead(story.slug)}
      >
        <img
          src={story.coverImage}
          alt={story.title}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <Badge variant="accent" size="sm">
            {story.categoryName || story.category}
          </Badge>
          {story.featured && (
            <Badge variant="primary" size="sm">
              Featured
            </Badge>
          )}
        </div>
      </div>

      {/* Story Details Body */}
      <div className="flex flex-col flex-1 p-5">
        {/* Title */}
        <h3
          id={`story-title-${story.id}`}
          onClick={() => onRead(story.slug)}
          className="text-lg font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors line-clamp-1 mb-2"
        >
          {story.title}
        </h3>

        {/* Short Description */}
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed flex-1">
          {story.shortDescription}
        </p>

        {/* Metadata Section */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{story.readingTime} min read</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
              <Eye className="w-3.5 h-3.5" />
              <span>{story.views.toLocaleString()} views</span>
            </div>

            <button
              type="button"
              id={`read-btn-${story.id}`}
              onClick={() => onRead(story.slug)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-indigo-600 dark:hover:bg-slate-200 text-xs font-semibold transition-colors"
            >
              <span>Read Story</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
