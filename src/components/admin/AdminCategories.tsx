import React, { useState, useEffect } from 'react';
import { Tag, Plus, BookOpen, CheckCircle2, AlertCircle, Trash2, Edit2, X, RefreshCw } from 'lucide-react';
import { Category } from '../../types/story';
import { adminService } from '../../services/adminService';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit category modal / state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Delete modal / reassignment state
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteAction, setDeleteAction] = useState<'uncategorize' | 'reassign'>('uncategorize');
  const [targetCategoryId, setTargetCategoryId] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const cats = await adminService.getCategories();
      setCategories(cats.filter((c) => c.slug !== 'all'));
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (val: string) => {
    setNewCatName(val);
    setNewCatSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9\u0D80-\u0DFF]+/g, '-')
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
      loadCategories();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create category' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditDescription(cat.description || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editName.trim()) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const { category, message } = await adminService.updateCategory(editingCategory.id, {
        name: editName.trim(),
        slug: editSlug.trim() || editName.toLowerCase().replace(/\s+/g, '-'),
        description: editDescription.trim(),
      });
      setFeedback({ type: 'success', message });
      setEditingCategory(null);
      loadCategories();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update category' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateDelete = (cat: Category) => {
    setCategoryToDelete(cat);
    setDeleteAction('uncategorize');
    const availableTargets = categories.filter((c) => c.id !== cat.id);
    if (availableTargets.length > 0) {
      setTargetCategoryId(availableTargets[0].id);
    }
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    setFeedback(null);

    try {
      const { message, affectedStoriesCount } = await adminService.deleteCategory(categoryToDelete.id, {
        action: deleteAction,
        targetCategoryId: deleteAction === 'reassign' ? targetCategoryId : undefined,
      });

      const detailMsg =
        affectedStoriesCount > 0
          ? `${message} (${affectedStoriesCount} stories were updated).`
          : message;

      setFeedback({ type: 'success', message: detailMsg });
      setCategoryToDelete(null);
      loadCategories();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete category' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white font-serif flex items-center gap-2">
            <Tag className="w-6 h-6 text-indigo-400" />
            <span>Category & Genre Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Organize fiction genres and categories for public story discovery. Stories will be safely reassigned if a category is removed.
          </p>
        </div>
        <button
          onClick={loadCategories}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Refresh Categories"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
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

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                <span>Edit Category: {editingCategory.name}</span>
              </h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  URL Slug
                </label>
                <input
                  type="text"
                  required
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-indigo-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation & Reassignment Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <span>Delete Category: {categoryToDelete.name}</span>
              </h3>
              <button
                onClick={() => setCategoryToDelete(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This category currently has <strong className="text-white font-mono">{categoryToDelete.storyCount || 0}</strong> associated stories in Firestore.
            </p>

            {(categoryToDelete.storyCount || 0) > 0 && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-slate-200">
                  How should existing stories be handled?
                </label>

                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="deleteAction"
                      value="uncategorize"
                      checked={deleteAction === 'uncategorize'}
                      onChange={() => setDeleteAction('uncategorize')}
                      className="text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                    />
                    <span>Mark stories as <strong>"Uncategorized"</strong></span>
                  </label>

                  {categories.filter((c) => c.id !== categoryToDelete.id).length > 0 && (
                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="deleteAction"
                        value="reassign"
                        checked={deleteAction === 'reassign'}
                        onChange={() => setDeleteAction('reassign')}
                        className="text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                      />
                      <span>Reassign stories to another category</span>
                    </label>
                  )}
                </div>

                {deleteAction === 'reassign' && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Select Destination Category:
                    </label>
                    <select
                      value={targetCategoryId}
                      onChange={(e) => setTargetCategoryId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {categories
                        .filter((c) => c.id !== categoryToDelete.id)
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
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
                placeholder="e.g. ආදර කතා (Romantic Stories)"
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
                placeholder="e.g. romantic"
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
              <span>Existing Categories in Firestore</span>
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
                    onClick={() => startEditCategory(cat)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    title="Edit Category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => initiateDelete(cat)}
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

