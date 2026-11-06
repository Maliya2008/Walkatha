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
  const authorName = typeof story.author === 'string' ? story.author : story.author?.name || 'Walkathawa';

  return (
    <article className="group bg-white dark:bg-[#111a33] hover:bg-slate-50/80 dark:hover:bg-[#152244] border border-slate-200 dark:border-[#1e2c52] hover:border-rose-300 dark:hover:border-[#2b3e70] rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md dark:shadow-none">
      <div>
        {/* Header Tags & Bookmark */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
            {story.tags[0] || story.category}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(story);
            }}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-white border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isBookmarked ? 'සුරැකුම් ලැයිස්තුවෙන් ඉවත් කරන්න' : 'සුරැකුම් ලැයිස්තුවට එක් කරන්න'}
          >
            <Bookmark className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelect(story)}
          className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors cursor-pointer line-clamp-1 mb-2 tracking-tight"
        >
          {story.title}
        </h3>

        {/* Excerpt */}
        <p
          onClick={() => onSelect(story)}
          className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4 cursor-pointer"
        >
          {story.excerpt || story.shortDescription || story.description}
        </p>
      </div>

      {/* Meta Footer */}
      <div className="pt-4 border-t border-slate-100 dark:border-[#1e2c52] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <span className="truncate">{authorName}</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {story.readTime || '3 min'}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {story.views}
          </span>
          <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400">
            <Heart className="w-3.5 h-3.5" />
            {story.likes || 0}
          </span>
        </div>
      </div>
    </article>
  );
};
