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
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const loadStory = async () => {
      try {
        const found = await storyService.getStoryBySlug(slug);
        if (!isMounted) return;

        if (!found) {
          setError('Story not found');
          setStory(null);
        } else {
          setStory(found);
          // Increment view
          storyService.incrementStoryViews(found.id).then((newViews) => {
            if (isMounted && newViews) {
              setStory((prev) => (prev ? { ...prev, views: newViews } : prev));
            }
          });

          // Update SEO head
          SEOService.updateHead(SEOService.generateStorySEO(found));

          // Fetch related stories
          const related = await storyService.getRelatedStories(found.category, found.slug, 3);
          if (isMounted) {
            setRelatedStories(related);
          }
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
