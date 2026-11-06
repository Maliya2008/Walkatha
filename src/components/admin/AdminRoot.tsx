import React, { useState, useEffect } from 'react';
import { ArrowLeft, Database, Plus, Search, Eye, BookOpen, CheckCircle, RefreshCw } from 'lucide-react';
import { Story } from '../../types/story';
import { StoryService } from '../../services/storyService';

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

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    setLoading(true);
    const all = await StoryService.fetchAllLiveStories();
    setStories(all);
    setLoading(false);
  };

  const handleCreateStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      setMessage('කරුණාකර මාතෘකාව සහ කතාවේ අන්තර්ගතය ඇතුළත් කරන්න.');
      return;
    }

    const newSlug = newTitle
      .toLowerCase()
      .replace(/[^\w\s\u0D80-\u0DFF-]/g, '')
      .replace(/\s+/g, '-');

    const createdStory: Story = {
      id: `story_${Date.now()}`,
      title: newTitle,
      slug: newSlug || `story-${Date.now()}`,
      category: newCategory,
      shortDescription: newContent.slice(0, 150) + '...',
      description: newContent.slice(0, 150) + '...',
      fullContent: newContent,
      content: newContent,
      tags: [newCategory],
      views: 1,
      likes: 0,
      readingTime: Math.max(3, Math.ceil(newContent.length / 500)),
      published: true,
      uploadDate: new Date().toISOString(),
    };

    setStories([createdStory, ...stories]);
    setMessage('නව කතාව සාර්ථකව ඇතුළත් විය!');
    setNewTitle('');
    setNewContent('');
    setTimeout(() => setMessage(''), 3000);
  };

  const filtered = stories.filter((s) =>
    (s.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          onClick={onBackToPublic}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          ප්‍රධාන පිටුවට (Back to Public Site)
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
          <Database className="w-3.5 h-3.5" />
          Firestore Live Sync Active (walkathawa-93f80)
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Walkathawa Admin Dashboard</h1>
        <p className="text-sm text-slate-400">කතා කළමනාකරණය සහ දත්ත පරිපාලනය</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400">මුළු කතා සංඛ්‍යාව</span>
          <div className="text-2xl font-bold text-white">{stories.length}</div>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400">දත්ත මූලාශ්‍රය</span>
          <div className="text-2xl font-bold text-rose-400">Firestore + JSON</div>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400">සක්‍රීය තත්ත්වය</span>
          <div className="text-2xl font-bold text-emerald-400">Online</div>
        </div>
      </div>

      {/* Quick Add Story Form */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Plus className="w-4 h-4 text-rose-500" />
          නව කතාවක් එක් කරන්න (Add New Story)
        </h3>

        {message && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {message}
          </div>
        )}

        <form onSubmit={handleCreateStory} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs text-slate-400">කතාවේ මාතෘකාව (Title)</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="උදා: අලුත් ටීචර් 01"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">වර්ගීකරණය (Category)</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="wife">වයිෆ් / බිරිඳ (Wife)</option>
                <option value="akka-malli">අක්කා - මල්ලි (Akka Malli)</option>
                <option value="nanda">නැන්දා / ඇන්ටි (Nanda)</option>
                <option value="school">පාසල් සහ කැම්පස් (School)</option>
                <option value="romantic">ආදර කතා (Romantic)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400">කතාවේ අන්තර්ගතය (Story Content)</label>
            <textarea
              rows={5}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="කතාව මෙතැනට ලියන්න..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs rounded-xl shadow cursor-pointer transition-colors"
          >
            කතාව ප්‍රකාශයට පත් කරන්න
          </button>
        </form>
      </div>

      {/* Stories Table */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <h3 className="text-base font-bold text-slate-200">පවතින කතා ලැයිස්තුව</h3>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="සොයන්න..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">මාතෘකාව (Title)</th>
                <th className="p-4">වර්ගය</th>
                <th className="p-4">කියවීම්</th>
                <th className="p-4">ක්‍රියා</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                    කතා ලබා ගනිමින් පවතී...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    කතා හමු නොවීය
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 30).map((s) => (
                  <tr key={s.id || s.slug} className="hover:bg-slate-800/40">
                    <td className="p-4 font-medium text-slate-100 max-w-xs truncate">
                      {s.title}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {s.category}
                      </span>
                    </td>
                    <td className="p-4">{s.views || 0}</td>
                    <td className="p-4">
                      <button
                        onClick={() => onViewStoryPublic(s.slug || s.id)}
                        className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        බලන්න
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
