import React, { useState, useEffect } from 'react';
import { Story } from '../../types/story';
import { StoryService } from '../../services/storyService';
import { SeoService } from '../../services/seoService';
import { StoryCard } from './StoryCard';
import { TripleInlineBanners320x50, SMART_LINK_URL } from '../common/AdUnits';

interface StoryReaderProps {
  slug: string;
  onBack: () => void;
  onSelectStory: (slug: string) => void;
  onSelectCategory: (category: string) => void;
}

const FALLBACK_COVER = '/icon.png';

export const StoryReader: React.FC<StoryReaderProps> = ({
  slug,
  onBack,
  onSelectStory,
  onSelectCategory,
}) => {
  const [story, setStory] = useState<Story | null>(null);
  const [imgSrc, setImgSrc] = useState<string>(FALLBACK_COVER);
  const [relatedStories, setRelatedStories] = useState<Story[]>([]);
  const [prevStory, setPrevStory] = useState<Story | null>(null);
  const [nextStory, setNextStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    const loadStory = async () => {
      setIsLoading(true);
      try {
        const fetched = await StoryService.getStoryBySlug(slug);
        if (!active) return;

        if (fetched) {
          setStory(fetched);
          setImgSrc(
            fetched.coverImage && fetched.coverImage.trim()
              ? fetched.coverImage
              : FALLBACK_COVER
          );
          SeoService.updateStorySeo(fetched);

          const [related, allStories] = await Promise.all([
            StoryService.getRelatedStories(fetched, 6),
            StoryService.fetchAllLiveStories(),
          ]);

          if (!active) return;
          setRelatedStories(related);

          const idx = allStories.findIndex(
            (s) => s.id === fetched.id || s.slug === fetched.slug
          );
          setPrevStory(idx > 0 ? allStories[idx - 1] : null);
          setNextStory(idx >= 0 && idx < allStories.length - 1 ? allStories[idx + 1] : null);
        } else {
          setStory(null);
        }
      } catch {
        if (active) setStory(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadStory();
    return () => {
      active = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-4">
        <div className="h-8 w-2/3 rounded bg-slate-200 dark:bg-[#111a33] animate-pulse" />
        <div className="h-96 rounded-lg bg-white dark:bg-[#111a33] border border-slate-200 dark:border-[#1e2d52] animate-pulse" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center bg-white dark:bg-[#111a33] border border-slate-200 dark:border-[#1e2d52] rounded-lg p-6">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          කතාව හමු නොවීය (Story Not Found)
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
          ඔබ සෙවූ කතාව දැනට ලබාගත නොහැක. වෙනත් සිංහල වැල කතාවක් තෝරාගන්න.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-md bg-[#1e3a8a] text-white text-xs font-semibold cursor-pointer"
        >
          මුල් පිටුවට යන්න
        </button>
      </div>
    );
  }

  const rawContent = story.fullContent || story.content || story.shortDescription || '';
  const paragraphs = rawContent
    .split(/\n\s*\n|\r\n\s*\r\n|\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb Navigation for SEO & UX */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400"
      >
        <a
          href="/"
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey) {
              e.preventDefault();
              onBack();
            }
          }}
          className="hover:text-blue-700 dark:hover:text-blue-400"
        >
          මුල් පිටුව
        </a>
        <span>/</span>
        <a
          href={`/category/${encodeURIComponent(story.category || 'romantic')}`}
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey) {
              e.preventDefault();
              onSelectCategory(story.category || 'romantic');
            }
          }}
          className="hover:text-blue-700 dark:hover:text-blue-400 font-medium"
        >
          {story.categoryName || story.category || 'සිංහල වැල කතා'}
        </a>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200 truncate max-w-xs">
          {story.title}
        </span>
      </nav>

      {/* Main Story Article */}
      <article className="bg-white dark:bg-[#111a33] border border-slate-200 dark:border-[#1e2d52] rounded-lg overflow-hidden">
        {/* Story Top Cover Image */}
        <div className="w-full aspect-[16/9] max-h-96 bg-slate-100 dark:bg-[#0d152b] overflow-hidden border-b border-slate-200 dark:border-[#1e2d52]">
          <img
            src={imgSrc}
            alt={story.title}
            decoding="async"
            onError={() => {
              if (imgSrc !== FALLBACK_COVER) {
                setImgSrc(FALLBACK_COVER);
              }
            }}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-5 sm:p-8">
          <header className="pb-5 mb-6 border-b border-slate-200 dark:border-[#1e2d52]">
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2">
              <a
                href={`/category/${encodeURIComponent(story.category || 'romantic')}`}
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    onSelectCategory(story.category || 'romantic');
                  }
                }}
                className="font-semibold text-blue-700 dark:text-blue-300 hover:underline"
              >
                {story.categoryName || story.category || 'සිංහල වැල කතා'}
              </a>
              <span>•</span>
              <span>විනාඩි {story.readingTime || 5} කියවීමක්</span>
              {story.uploadDate && (
                <>
                  <span>•</span>
                  <time dateTime={story.uploadDate}>
                    {new Date(story.uploadDate).toLocaleDateString('si-LK', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                </>
              )}
            </div>

            <h1 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-snug">
              {story.title}
            </h1>
          </header>

        {/* Story Body Content with inline 3x 320x50 banners in the middle */}
        <div className="space-y-4 text-base sm:text-lg leading-relaxed text-slate-800 dark:text-slate-200 select-text">
          <h2 className="sr-only">{story.title} - සම්පූර්ණ සිංහල කතාව</h2>
          {paragraphs.map((para, idx) => {
            const midpoint = Math.max(1, Math.floor(paragraphs.length / 2));
            return (
              <React.Fragment key={idx}>
                <p className="leading-[1.9] tracking-normal">{para}</p>
                {idx === midpoint - 1 && (
                  <div className="my-6 py-2 border-y border-slate-100 dark:border-[#1a2747]">
                    <TripleInlineBanners320x50 label="reader-middle" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Smart Link CTA */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1a2747] flex justify-center">
          <a
            href={SMART_LINK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-md bg-[#1e3a8a] hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            තවත් විශේෂ සිංහල වැල කතා සහ වීඩියෝ බලන්න →
          </a>
        </div>

        {/* Inline Contextual Internal Links inside Article Footer */}
        {relatedStories.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-[#1e2d52]">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              මෙම කතාවට සමාන තවත් සිංහල වැල කතා:
            </h2>
            <ul className="space-y-1.5 text-xs sm:text-sm">
              {relatedStories.slice(0, 3).map((rel) => (
                <li key={rel.id}>
                  <a
                    href={`/story/${encodeURIComponent(rel.slug)}`}
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        onSelectStory(rel.slug);
                      }
                    }}
                    className="text-blue-700 dark:text-blue-400 hover:underline font-medium"
                  >
                    → {rel.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

          {/* Keyword Tags */}
          {story.tags && story.tags.length > 0 && (
            <footer className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1a2747] flex flex-wrap gap-1.5">
              {story.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-[#162347] text-slate-600 dark:text-slate-300 text-xs"
                >
                  #{tag}
                </span>
              ))}
            </footer>
          )}
        </div>
      </article>

      {/* Previous & Next Story Internal Links */}
      {(prevStory || nextStory) && (
        <nav
          aria-label="පෙර සහ ඊළඟ කතා"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {prevStory ? (
            <a
              href={`/story/${encodeURIComponent(prevStory.slug)}`}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  onSelectStory(prevStory.slug);
                }
              }}
              className="p-3.5 rounded-lg border border-slate-200 dark:border-[#1e2d52] bg-white dark:bg-[#111a33] hover:border-blue-600 dark:hover:border-blue-400 transition-colors"
            >
              <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                ← පෙර කතාව
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                {prevStory.title}
              </span>
            </a>
          ) : (
            <div />
          )}

          {nextStory && (
            <a
              href={`/story/${encodeURIComponent(nextStory.slug)}`}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  onSelectStory(nextStory.slug);
                }
              }}
              className="p-3.5 rounded-lg border border-slate-200 dark:border-[#1e2d52] bg-white dark:bg-[#111a33] hover:border-blue-600 dark:hover:border-blue-400 transition-colors text-right"
            >
              <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                ඊළඟ කතාව →
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                {nextStory.title}
              </span>
            </a>
          )}
        </nav>
      )}

      {/* Related Stories Grid */}
      {relatedStories.length > 0 && (
        <section className="space-y-3 pt-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            තවත් රසවත් සිංහල වැල කතා (Related Stories)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedStories.map((rel) => (
              <StoryCard
                key={rel.id}
                story={rel}
                onSelect={onSelectStory}
                onSelectCategory={onSelectCategory}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
