import React, { useState } from 'react';
import { Story } from '../../types/story';

interface StoryCardProps {
  story: Story;
  onSelect: (slug: string) => void;
  onSelectCategory?: (category: string) => void;
}

const FALLBACK_COVER = '/icon.png';

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onSelect,
  onSelectCategory,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(
    story.coverImage && story.coverImage.trim() ? story.coverImage : FALLBACK_COVER
  );

  const excerpt =
    story.shortDescription ||
    story.description ||
    (story.fullContent ? `${story.fullContent.slice(0, 140)}...` : '');

  const storyHref = `/story/${encodeURIComponent(story.slug)}`;
  const categorySlug = story.category || 'romantic';

  return (
    <article className="bg-white dark:bg-[#111a33] rounded-lg border border-slate-200 dark:border-[#1e2d52] overflow-hidden hover:border-blue-600 dark:hover:border-blue-400 transition-colors flex flex-col justify-between">
      <div>
        <a
          href={storyHref}
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey) {
              e.preventDefault();
              onSelect(story.slug);
            }
          }}
          className="block relative aspect-[16/10] w-full bg-slate-100 dark:bg-[#0d152b] overflow-hidden"
        >
          <img
            src={imgSrc}
            alt={story.title}
            loading="lazy"
            decoding="async"
            onError={() => {
              if (imgSrc !== FALLBACK_COVER) {
                setImgSrc(FALLBACK_COVER);
              }
            }}
            className="w-full h-full object-cover"
          />
        </a>

        <div className="p-4">
          <div className="flex items-center justify-between gap-2 mb-2 text-xs text-slate-500 dark:text-slate-400">
            <a
              href={`/category/${encodeURIComponent(categorySlug)}`}
              onClick={(e) => {
                if (onSelectCategory && !e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  onSelectCategory(categorySlug);
                }
              }}
              className="font-semibold text-blue-700 dark:text-blue-300 hover:underline"
            >
              {story.categoryName || story.category || 'සිංහල කතා'}
            </a>
            <span>විනාඩි {story.readingTime || 5}</span>
          </div>

          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5 leading-snug line-clamp-2">
            <a
              href={storyHref}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  onSelect(story.slug);
                }
              }}
              className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
            >
              {story.title}
            </a>
          </h2>

          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {excerpt}
          </p>
        </div>
      </div>

      <div className="px-4 py-2.5 border-t border-slate-100 dark:border-[#1a2747] flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">
          {story.uploadDate
            ? new Date(story.uploadDate).toLocaleDateString('si-LK', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : '2026'}
        </span>
        <a
          href={storyHref}
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey) {
              e.preventDefault();
              onSelect(story.slug);
            }
          }}
          className="font-semibold text-blue-700 dark:text-blue-400 hover:underline"
        >
          කතාව කියවන්න →
        </a>
      </div>
    </article>
  );
};

export default StoryCard;
