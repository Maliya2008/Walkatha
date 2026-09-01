import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  ArrowUpRight,
  Filter,
  CheckCircle,
  Clock,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';
import { Category, Story } from '../../types/story';
import { adminService } from '../../services/adminService';

interface AdminStoriesListProps {
  onNewStory: () => void;
  onEditStory: (storyId: string) => void;
  onViewPublicStory: (slug: string) => void;
}

export const AdminStoriesList: React.FC<AdminStoriesListProps> = ({
  onNewStory,
  onEditStory,
  onViewPublicStory,
}) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    adminService.getCategories().then((cats) => {
      setCategories(cats.filter((c) => c.slug !== 'all'));
    }).catch(() => {});
  }, []);

  const fetchStories = async () => {
    try {
      setIsLoading(true);
      const list = await adminService.getStories({
        search,
        category: categoryFilter,
        status: statusFilter,
      });
      setStories(list);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [search, categoryFilter, statusFilter]);

  const handleTogglePublished = async (story: Story) => {
    try {
      const updated = await adminService.updateStory(story.id, {
        published: !story.published,
      });
      setStories((prev) =>
        prev.map((s) => (s.id === story.id ? { ...s, published: updated.story.published } : s))
      );
    } catch {
      // ignore
    }
  };

  const handleDeleteConfirm = async () => {
    if (!storyToDelete) return;
    setIsDeleting(true);
    try {
      await adminService.deleteStory(storyToDelete.id);
      setStories((prev) => prev.filter((s) => s.id !== storyToDelete.id));
      setStoryToDelete(null);
    } catch {
      // ignore
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-serif flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <span>Story Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse, search, edit, and organize all published stories and draft manuscripts.
          </p>
        </div>

        <button
          onClick={onNewStory}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Story</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stories by title, synopsis, author..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
          >
            <option value="all">සියලුම වර්ග (All Categories)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts Only</option>
          </select>
        </div>
      </div>

      {/* Stories Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading stories repository...</span>
          </div>
        ) : stories.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <BookOpen className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-white">No stories match your filters.</p>
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('all');
                setStatusFilter('all');
              }}
              className="text-xs text-indigo-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Story & Cover</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Views</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Uploaded</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stories.map((story) => (
                  <tr key={story.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Story Title & Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={story.coverImage}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-white line-clamp-1">{story.title}</div>
                          <div className="text-[10px] text-slate-500 font-mono">/story/{story.slug}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 capitalize text-[11px]">
                        {story.categoryName || story.category}
                      </span>
                    </td>

                    {/* Views */}
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {story.views.toLocaleString()}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleTogglePublished(story)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                          story.published
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                        }`}
                        title="Click to toggle publication status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            story.published ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                        />
                        {story.published ? 'Published' : 'Draft'}
                      </button>
                    </td>

                    {/* Upload Date */}
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(story.uploadDate || story.uploadedDate || 0).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => onEditStory(story.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                          title="Edit story"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {story.published && (
                          <button
                            onClick={() => onViewPublicStory(story.slug)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors"
                            title="Open in public reader"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setStoryToDelete(story)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors"
                          title="Delete story"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {storyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Delete Story Permanently?</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{storyToDelete.title}"</strong>? This will permanently remove the story and any associated individual ad code from the website.
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setStoryToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
