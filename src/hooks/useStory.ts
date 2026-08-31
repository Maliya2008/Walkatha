import { useEffect, useState } from 'react';
import { Story } from '../types/story';
import { storyService } from '../services/storyService';
import { SEOService } from '../services/seoService';

export function useStory(slug: string | null) {
  const [story, setStory] = useState<Story | null>(null);
  const [relatedStories, setRelatedStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setStory(null);
      setRelatedStories([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const loadStory = async () => {
      try {
        const result = await storyService.getStoryBySlug(slug);
        if (!isMounted) return;

        if (!result.story) {
          setError('Story not found');
          setStory(null);
          setRelatedStories([]);
        } else {
          setStory(result.story);
          setRelatedStories(result.relatedStories || []);

          // Update SEO head metadata
          SEOService.updateHead(SEOService.generateStorySEO(result.story));
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error fetching story');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStory();

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
