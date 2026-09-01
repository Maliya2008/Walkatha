import React from 'react';
import { Sparkles, Calendar, Eye, ArrowRight } from 'lucide-react';
import { Story } from '../../types/story';
import { Badge } from '../common/Badge';

interface FeaturedStoryHeroProps {
  story: Story;
  onRead: (slug: string) => void;
}

export const FeaturedStoryHero: React.FC<FeaturedStoryHeroProps> = ({ story, onRead }) => {
  const formattedDate = new Date(story.uploadDate || story.uploadedDate || 0).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <section
      id="featured-story-hero"
      className="relative w-full rounded-2xl overflow-hidden bg-slate-900 dark:bg-slate-900/90 text-white shadow-md border border-slate-800/80 my-4 transition-colors"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[260px] sm:min-h-[280px]">
        {/* Story Visual Banner */}
        <div
          className="lg:col-span-6 relative h-48 sm:h-56 lg:h-auto overflow-hidden cursor-pointer group"
          onClick={() => onRead(story.slug)}
        >
          <img
            src={story.coverImage}
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-slate-900" />
        </div>

        {/* Content Details */}
        <div className="lg:col-span-6 p-5 sm:p-6 flex flex-col justify-between bg-slate-900 dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                Featured Story
              </span>
              <Badge variant="secondary" size="sm" className="bg-slate-800 text-slate-200">
                {story.categoryName || story.category}
              </Badge>
            </div>

            <h2
              onClick={() => onRead(story.slug)}
              className="text-xl sm:text-2xl font-bold text-white hover:text-amber-300 cursor-pointer transition-colors leading-snug mb-2 font-serif line-clamp-2"
            >
              {story.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed mb-4">
              {story.shortDescription || story.description}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {(story.views || 0).toLocaleString()} views
              </span>
            </div>

            <button
              type="button"
              id="featured-read-hero-btn"
              onClick={() => onRead(story.slug)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              <span>Read Story</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
