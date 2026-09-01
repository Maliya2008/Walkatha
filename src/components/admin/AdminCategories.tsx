import React, { useState, useEffect } from 'react';
import { Tag, Plus, BookOpen, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { Category } from '../../types/story';
import { storyService } from '../../services/storyService';
import { adminService } from '../../services/adminService';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    storyService.getCategories().then((cats) => {
      setCategories(cats.filter((c) => c.slug !== 'all'));
    });
  }

  const handleNameChange = (val: string) => {
    setNewCatName(val);
    setNewCatSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    );
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const { category, message } = await adminService.createCategory({
        name: newCatName.trim(),
        slug: newCatSlug || newCatName.toLowerCase().replace(/\s+/g, '-'),
        description: newCatDescription.trim(),
      });
      setCategories((prev) => [...prev, category]);
      setFeedback({ type: 'success', message });
      setNewCatName('');
      setNewCatSlug('');
      setNewCatDescription('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create category' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the category "${name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await adminService.deleteCategory(id);
      setCategories((prev) => prev.filter(c => c.id !== id));
      setFeedback({ type: 'success', message: 'Category deleted successfully' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete category' });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-white font-serif flex items-center gap-2">
          <Tag className="w-6 h-6 text-indigo-400" />
          <span>Category & Genre Management</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Organize fiction genres and categories for public story discovery.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-start gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Create Category Form */}
        <div className="lg:col-span-5 bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Add New Category</span>
          </h3>

          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Category Name
              </label>
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Cyberpunk, Romance, Horror"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                URL Slug
              </label>
              <input
                type="text"
                required
                value={newCatSlug}
                onChange={(e) => setNewCatSlug(e.target.value)}
                placeholder="e.g. cyberpunk"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-indigo-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Short Description
              </label>
              <textarea
                rows={2}
                value={newCatDescription}
                onChange={(e) => setNewCatDescription(e.target.value)}
                placeholder="Brief summary of this genre..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </button>
          </form>
        </div>

        {/* Existing Categories Table */}
        <div className="lg:col-span-7 bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Existing Categories</span>
            </span>
            <span className="text-xs font-normal text-slate-400">
              {categories.length} registered genres
            </span>
          </h3>

          <div className="divide-y divide-slate-800/80 max-h-[460px] overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.id || cat.slug} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{cat.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono text-[10px]">
                      /{cat.slug}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {cat.description || 'Fiction genre for reader discovery.'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-bold">
                    {cat.storyCount ?? 0} stories
                  </span>
                  <button 
                    type="button" 
                    onClick={() => cat.id && handleDeleteCategory(cat.id, cat.name)}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
