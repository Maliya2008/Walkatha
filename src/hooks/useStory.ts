import { useEffect, useState } from 'react';
import { Story } from '../types/story';
import { StoryService } from '../services/storyService';
import { INITIAL_STORIES } from '../data/seedStories';

export function useStory(slug: string | null) {
  const [story, setStory] = useState<Story | null>(() => {
    if (!slug) return null;
    const clean = decodeURIComponent(slug).toLowerCase().trim();
    return INITIAL_STORIES.find((s) => s.slug === clean || s.id === clean) || null;
  });
  const [relatedStories, setRelatedStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setStory(null);
      setRelatedStories([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    StoryService.getStoryBySlug(slug)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setStory(data);
          StoryService.getRelatedStories(data, 4).then((rel) => {
            if (isMounted) setRelatedStories(rel);
          });
        } else {
          setError('කතාව සොයාගත නොහැකි විය');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'කතාව පූරණය වීම අසාර්ථක විය');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return {
    story,
    relatedStories,
    isLoading,
    error,
  };
}
