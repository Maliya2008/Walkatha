import React from 'react';
import { Story } from '../../types/story';
import { StoryCard } from './StoryCard';

interface RelatedStoriesProps {
  stories: Story[];
  onRead: (slug: string) => void;
}

export const RelatedStories: React.FC<RelatedStoriesProps> = ({ stories, onRead }) => {
  if (!stories || stories.length === 0) return null;

  return (
    <section id="related-stories-section" className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            More Stories You May Like
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Handpicked recommendations from the same genre
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} onRead={onRead} />
        ))}
      </div>
    </section>
  );
};
