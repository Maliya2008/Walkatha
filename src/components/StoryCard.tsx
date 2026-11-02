import React from 'react';
import { Eye, Heart, Clock, User, Bookmark } from 'lucide-react';
import { Story } from '../types/story';

interface StoryCardProps {
  story: Story;
  onSelect: (story: Story) => void;
  isBookmarked: boolean;
  onToggleBookmark: (story: Story) => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onSelect,
  isBookmarked,
  onToggleBookmark,
}) => {
  return (
    <article className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-rose-950/20">
      <div>
        {/* Header Tags & Bookmark */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            {story.tags[0] || story.category}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(story);
            }}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-rose-600 text-white border-rose-500'
                : 'text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800'
            }`}
            title={isBookmarked ? 'සුරැකුම් ලැයිස්තුවෙන් ඉවත් කරන්න' : 'සුරැකුම් ලැයිස්තුවට එක් කරන්න'}
          >
            <Bookmark className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelect(story)}
          className="text-lg font-bold text-slate-100 group-hover:text-rose-400 transition-colors cursor-pointer line-clamp-1 mb-2 tracking-tight"
        >
          {story.title}
        </h3>

        {/* Excerpt */}
        <p
          onClick={() => onSelect(story)}
          className="text-sm text-slate-400 line-clamp-3 leading-relaxed mb-4 cursor-pointer"
        >
          {story.excerpt}
        </p>
      </div>

      {/* Meta Footer */}
      <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{story.author}</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            {story.readTime}
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <Eye className="w-3.5 h-3.5" />
            {story.views}
          </span>
          <span className="flex items-center gap-1 text-rose-400/80">
            <Heart className="w-3.5 h-3.5" />
            {story.likes}
          </span>
        </div>
      </div>
    </article>
  );
};
