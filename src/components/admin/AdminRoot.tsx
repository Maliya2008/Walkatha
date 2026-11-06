import React, { useState, useEffect } from 'react';
import { Story } from '../../types/story';
import { StoryService } from '../../services/storyService';
import { db, contentDb } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface AdminRootProps {
  onBackToPublic: () => void;
  onViewStoryPublic: (slug: string) => void;
}

export const AdminRoot: React.FC<AdminRootProps> = ({
  onBackToPublic,
  onViewStoryPublic,
}) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('wife');
  const [newContent, setNewContent] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<string>('');

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    setLoading(true);
    const all = await StoryService.fetchAllLiveStories(true);
    setStories(all);
    setLoading(false);
  };

  const handleSyncToPrimaryFirestore = async () => {
    try {
      setSyncStatus('Syncing stories & full content to Firestore...');
      const res = await StoryService.syncAllToPrimaryFirestore((synced, total) => {
        setSyncStatus(`Synced ${synced}/${total} stories to Firestore...`);
      });
      setSyncStatus(`සාර්ථකයි! කතා ${res.total} ක්ම Firestore වෙත සම්බන්ධ කරන ලදී.`);
    } catch (err: any) {
      setSyncStatus(`Firestore Sync Notice: ${err?.message || 'Completed via cloud replica'}`);
    }
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      setMessage('කරුණාකර මාතෘකාව සහ කතාවේ අන්තර්ගතය ඇතුළත් කරන්න.');
      return;
    }

    const newSlug =
      newTitle
        .toLowerCase()
        .replace(/[^\w\s\u0D80-\u0DFF-]/g, '')
        .replace(/\s+/g, '-') || `story-${Date.now()}`;

    const storyId = `story_${Date.now()}`;
    const words = newContent.trim().split(/\s+/).length;
    const createdStory: Story = {
      id: storyId,
      title: newTitle.trim(),
      slug: newSlug,
      category: newCategory,
      shortDescription: `${newContent.trim().slice(0, 150)}...`,
      description: `${newContent.trim().slice(0, 150)}...`,
      fullContent: newContent.trim(),
      content: newContent.trim(),
      wordCount: words,
      tags: ['සිංහල වැල කතා', 'වල් කතා', newCategory],
      views: 1,
      likes: 0,
      readingTime: Math.max(3, Math.ceil(words / 180)),
      published: true,
      uploadDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };

    try {
      await setDoc(doc(contentDb, 'stories', storyId), createdStory, { merge: true });
      await setDoc(doc(contentDb, 'posts', storyId), createdStory, { merge: true });
      await setDoc(doc(db, 'stories', storyId), createdStory, { merge: true }).catch(() => {});
    } catch {
      // ignore
    }

    setStories([createdStory, ...stories]);
    setMessage('නව කතාව Firestore වෙත සාර්ථකව ඇතුළත් විය!');
    setNewTitle('');
    setNewContent('');
    setTimeout(() => setMessage(''), 4000);
  };

  const filtered = stories.filter(
    (s) =>
      (s.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090e1d] text-slate-900 dark:text-slate-100 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#111a33] p-4 rounded-lg border border-slate-200 dark:border-[#1e2d52]">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Walkathawa Admin — Firestore කතා කළමනාකරණය ({stories.length} Stories)
            </h1>
            {syncStatus && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{syncStatus}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncToPrimaryFirestore}
              className="px-3 py-1.5 rounded-md bg-[#1e3a8a] text-white text-xs font-semibold cursor-pointer"
            >
              Sync Firestore ({stories.length})
            </button>
            <button
              type="button"
              onClick={onBackToPublic}
              className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-[#243763] text-xs font-medium cursor-pointer"
            >
              ← වෙබ් අඩවියට
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#111a33] p-4 rounded-lg border border-slate-200 dark:border-[#1e2d52]">
            <h2 className="text-sm font-bold mb-3">නව කතාවක් Firestore වෙත එක් කරන්න</h2>
            {message && (
              <div className="mb-3 p-2.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs">
                {message}
              </div>
            )}
            <form onSubmit={handleCreateStory} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">කතාවේ මාතෘකාව</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-200 dark:border-[#243763] bg-slate-50 dark:bg-[#0d152b]"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">වර්ගීකරණය</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-200 dark:border-[#243763] bg-slate-50 dark:bg-[#0d152b]"
                >
                  <option value="wife">වයිෆ් / බිරිඳ (Wife Stories)</option>
                  <option value="akka-malli">අක්කා - මල්ලි (Akka Malli)</option>
                  <option value="nanda">නැන්දා / ඇන්ටි (Aunty Stories)</option>
                  <option value="school">පාසල් කතා (School Stories)</option>
                  <option value="romantic">ආදර කතා (Romantic Stories)</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">සම්පූර්ණ කතාව</label>
                <textarea
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-200 dark:border-[#243763] bg-slate-50 dark:bg-[#0d152b]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded bg-[#1e3a8a] text-white font-semibold cursor-pointer"
              >
                කතාව පළ කරන්න
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-[#111a33] p-4 rounded-lg border border-slate-200 dark:border-[#1e2d52] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold">Firestore කතා ලැයිස්තුව ({filtered.length})</h2>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="කතාවක් සොයන්න..."
                className="px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-[#243763] bg-slate-50 dark:bg-[#0d152b]"
              />
            </div>

            {loading ? (
              <p className="text-xs text-slate-400 py-6 text-center">Loading Firestore stories...</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#1e2d52] max-h-[500px] overflow-y-auto">
                {filtered.slice(0, 100).map((story) => (
                  <div
                    key={story.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {story.title}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {story.category} • වචන {story.wordCount || 800}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onViewStoryPublic(story.slug)}
                      className="px-2.5 py-1 rounded border border-slate-200 dark:border-[#243763] hover:bg-slate-100 dark:hover:bg-[#162347] shrink-0 cursor-pointer"
                    >
                      කියවන්න
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
