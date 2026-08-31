import React from 'react';
import { Sparkles, Clock, Calendar, Eye, ArrowRight } from 'lucide-react';
import { Story } from '../../types/story';
import { Badge } from '../common/Badge';

interface FeaturedStoryHeroProps {
  story: Story;
  onRead: (slug: string) => void;
}

export const FeaturedStoryHero: React.FC<FeaturedStoryHeroProps> = ({ story, onRead }) => {
  const formattedDate = new Date(story.uploadDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <section
      id="featured-story-hero"
      className="relative w-full rounded-2xl overflow-hidden bg-slate-900 text-white shadow-lg border border-slate-800 my-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[360px]">
        {/* Story Visual Banner */}
        <div
          className="lg:col-span-7 relative h-64 lg:h-auto overflow-hidden cursor-pointer group"
          onClick={() => onRead(story.slug)}
        >
          <img
            src={story.coverImage}
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-slate-900" />
        </div>

        {/* Content Details */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-slate-900">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full">
                <Sparkles className="w-3 h-3" />
                Featured Story of the Week
              </span>
              <Badge variant="secondary" size="sm" className="bg-slate-800 text-slate-200">
                {story.categoryName || story.category}
              </Badge>
            </div>

            <h2
              onClick={() => onRead(story.slug)}
              className="text-2xl sm:text-3xl font-extrabold text-white hover:text-amber-300 cursor-pointer transition-colors leading-tight mb-3"
            >
              {story.title}
            </h2>

            <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed mb-6">
              {story.shortDescription}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {story.readingTime} min read
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {story.views} views
              </span>
            </div>

            <button
              type="button"
              id="featured-read-hero-btn"
              onClick={() => onRead(story.slug)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-colors shadow-sm"
            >
              <span>Read Story</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
