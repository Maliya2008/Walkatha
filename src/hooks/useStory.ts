import { useEffect, useState, useRef } from 'react';
import { Story } from '../types/story';
import { storyService } from '../services/storyService';
import { authService } from '../services/authService';
import { SEOService } from '../services/seoService';

// Module-level variables to track the last incremented story and prevent duplicate increments from React StrictMode/re-renders
let lastIncrementedStoryId: string | null = null;
let lastIncrementTime: number = 0;

export function useStory(slug: string | null) {
  const [story, setStory] = useState<Story | null>(null);
  const [relatedStories, setRelatedStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const activeSlugRef = useRef<string | null>(null);

  useEffect(() => {
    if (!slug) {
      activeSlugRef.current = null;
      setStory(null);
      setRelatedStories([]);
      setIsLoading(false);
      return;
    }

    activeSlugRef.current = slug;
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const loadStory = async () => {
      try {
        const result = await storyService.getStoryBySlug(slug);
        if (!isMounted || activeSlugRef.current !== slug) return;

        if (!result.story) {
          setError('Story not found');
          setStory(null);
          setRelatedStories([]);
        } else {
          const loadedStory: Story = {
            ...result.story,
            views: typeof result.story.views === 'number' && !isNaN(result.story.views) ? result.story.views : 0,
          };

          const realDocId = loadedStory.id;
          const isAdmin = authService.isAuthenticated();
          const isPublished = Boolean(loadedStory.published);

          // Atomic public view increment: Only for public visitors on published stories
          // Protected against duplicate React renders / StrictMode via realDocId tracking
          if (!isAdmin && isPublished && realDocId) {
            const now = Date.now();
            // Count as a duplicate render if it's the exact same story incremented within the last 5 seconds
            const isDuplicateRender = lastIncrementedStoryId === realDocId && (now - lastIncrementTime < 5000);

            if (!isDuplicateRender) {
              lastIncrementedStoryId = realDocId;
              lastIncrementTime = now;

              // Immediately update displayed count on the story screen
              loadedStory.views = (loadedStory.views || 0) + 1;

              // Atomically increment the Firestore counter in the background
              storyService.incrementStoryViews(realDocId).catch((err) => {
                console.warn('[StoryView] Background view increment error:', err);
              });
            }
          }

          setStory(loadedStory);
          setRelatedStories(result.relatedStories || []);

          // Update SEO head metadata
          SEOService.updateHead(SEOService.generateStorySEO(loadedStory));
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

