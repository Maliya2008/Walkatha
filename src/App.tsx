import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { StoryCard } from './components/StoryCard';
import { StoryReader } from './components/StoryReader';
import { Footer } from './components/Footer';
import { CATEGORIES, SAMPLE_STORIES } from './data/initialStories';
import { Story } from './types/story';
import { Sparkles, BookOpen, Bookmark, X, Flame } from 'lucide-react';

export function App() {
  const [stories, setStories] = useState<Story[]>(SAMPLE_STORIES);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('walkathawa_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [likedStories, setLikedStories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('walkathawa_likes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showBookmarksDrawer, setShowBookmarksDrawer] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  // Sync bookmarks
  useEffect(() => {
    try {
      localStorage.setItem('walkathawa_bookmarks', JSON.stringify(bookmarks));
    } catch (e) {
      console.warn(e);
    }
  }, [bookmarks]);

  // Sync likes
  useEffect(() => {
    try {
      localStorage.setItem('walkathawa_likes', JSON.stringify(likedStories));
    } catch (e) {
      console.warn(e);
    }
  }, [likedStories]);

  // Handle URL hash for sharing or direct links
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const found = stories.find((s) => s.slug === hash || s.id === hash);
        if (found) {
          setSelectedStory(found);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [stories]);

  const toggleBookmark = (story: Story) => {
    setBookmarks((prev) =>
      prev.includes(story.id) ? prev.filter((id) => id !== story.id) : [...prev, story.id]
    );
  };

  const handleLike = (story: Story) => {
    if (likedStories.includes(story.id)) return;
    setLikedStories((prev) => [...prev, story.id]);
    setStories((prev) =>
      prev.map((s) => (s.id === story.id ? { ...s, likes: s.likes + 1 } : s))
    );
    if (selectedStory && selectedStory.id === story.id) {
      setSelectedStory((prev) => (prev ? { ...prev, likes: prev.likes + 1 } : null));
    }
  };

  const openStory = (story: Story) => {
    // Increment views
    setStories((prev) =>
      prev.map((s) => (s.id === story.id ? { ...s, views: s.views + 1 } : s))
    );
    setSelectedStory({ ...story, views: story.views + 1 });
    window.location.hash = story.slug;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeStory = () => {
    setSelectedStory(null);
    history.pushState(null, '', window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered stories
  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      const matchesCategory =
        selectedCategory === 'all' || story.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        story.title.toLowerCase().includes(q) ||
        story.excerpt.toLowerCase().includes(q) ||
        story.author.toLowerCase().includes(q) ||
        story.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [stories, selectedCategory, searchQuery]);

  const bookmarkedStoriesList = useMemo(() => {
    return stories.filter((s) => bookmarks.includes(s.id));
  }, [stories, bookmarks]);

  const featuredStories = useMemo(() => {
    return stories.filter((s) => s.isFeatured);
  }, [stories]);

  return (
    <div className={`min-h-screen flex flex-col ${isDarkTheme ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        bookmarkCount={bookmarks.length}
        onOpenBookmarks={() => setShowBookmarksDrawer(true)}
        onGoHome={closeStory}
        isDarkTheme={isDarkTheme}
        setIsDarkTheme={setIsDarkTheme}
      />

      {/* Main Body */}
      <main className="flex-1">
        {selectedStory ? (
          <StoryReader
            story={selectedStory}
            onBack={closeStory}
            isBookmarked={bookmarks.includes(selectedStory.id)}
            onToggleBookmark={() => toggleBookmark(selectedStory)}
            onLike={() => handleLike(selectedStory)}
            hasLiked={likedStories.includes(selectedStory.id)}
          />
        ) : (
          <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Hero Banner */}
            <section className="mb-10 relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/40 border border-slate-800/80 p-8 sm:p-12">
              <div className="relative z-10 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  නවතම සිංහල කතා එකතුව
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
                  සිත් ඇදගන්නා <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">සිංහල කතා</span> රසවිඳින්න
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
                  ආදර කතා, අසම්මත කතා, කෙටි කතා සහ දිගු කතා මාලා දිනපතා නැවුම්ව එකම තැනකින් නොමිලේ කියවන්න.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {CATEGORIES.slice(1, 4).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs sm:text-sm font-medium text-slate-200 border border-slate-700/60 transition-all cursor-pointer"
                    >
                      {cat.sinhalaName}
                    </button>
                  ))}
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
            </section>

            {/* Categories bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                  }`}
                >
                  {cat.sinhalaName}
                </button>
              ))}
            </div>

            {/* Stories Grid */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-rose-500" />
                <span>
                  {CATEGORIES.find((c) => c.id === selectedCategory)?.sinhalaName || 'සියලු කතා'}
                </span>
                <span className="text-xs font-normal text-slate-400 ml-1">
                  ({filteredStories.length} ක් සොයාගැනිණි)
                </span>
              </h2>
            </div>

            {filteredStories.length === 0 ? (
              <div className="text-center py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-3xl">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-300">කිසිදු කතාවක් හමු නොවීය</h3>
                <p className="text-xs text-slate-500 mt-1">කරුණාකර වෙනත් කාණ්ඩයක් හෝ සෙවුම් වචනයක් උත්සාහ කරන්න.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700 transition cursor-pointer"
                >
                  සියලු කතා පෙන්වන්න
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStories.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    onSelect={openStory}
                    isBookmarked={bookmarks.includes(story.id)}
                    onToggleBookmark={toggleBookmark}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bookmarks Drawer Modal */}
      {showBookmarksDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-slate-100 text-lg">සුරකින ලද කතා</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {bookmarkedStoriesList.length}
                </span>
              </div>
              <button
                onClick={() => setShowBookmarksDrawer(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {bookmarkedStoriesList.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Bookmark className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm">තවමත් ඔබ විසින් කිසිදු කතාවක් සුරැක නැත.</p>
                </div>
              ) : (
                bookmarkedStoriesList.map((story) => (
                  <div
                    key={story.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 group hover:border-slate-700 transition"
                  >
                    <div
                      onClick={() => {
                        setShowBookmarksDrawer(false);
                        openStory(story);
                      }}
                      className="flex-1 cursor-pointer"
                    >
                      <h4 className="font-bold text-slate-200 text-sm group-hover:text-rose-400 transition truncate">
                        {story.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{story.author} • {story.readTime}</p>
                    </div>
                    <button
                      onClick={() => toggleBookmark(story)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                      title="ඉවත් කරන්න"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
export default App;
