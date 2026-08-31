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
    <section id="related-stories-section" className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            More Stories You May Like
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Handpicked recommendations from the same genre
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} onRead={onRead} />
        ))}
      </div>
    </section>
  );
};
