import React, { useState, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Tag,
  BookOpen,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Eye,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import { Category, Story } from '../../types/story';
import { adminService } from '../../services/adminService';
import { uploadStoryCover, validateImageFile } from '../../services/storageService';

interface AdminStoryFormProps {
  storyToEdit?: Story | null;
  onSaved: (story: Story) => void;
  onCancel: () => void;
  onViewPublic: (slug: string) => void;
}

export const AdminStoryForm: React.FC<AdminStoryFormProps> = ({
  storyToEdit,
  onSaved,
  onCancel,
  onViewPublic,
}) => {
  const isEditing = Boolean(storyToEdit);

  // Form Fields
  const [title, setTitle] = useState(storyToEdit?.title || '');
  const [slug, setSlug] = useState(storyToEdit?.slug || '');
  const [coverImage, setCoverImage] = useState(storyToEdit?.coverImage || '');
  const [shortDescription, setShortDescription] = useState(storyToEdit?.description || storyToEdit?.shortDescription || '');
  const [fullContent, setFullContent] = useState(storyToEdit?.content || storyToEdit?.fullContent || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    storyToEdit?.categoryId || storyToEdit?.category || ''
  );
  const [tagsInput, setTagsInput] = useState(storyToEdit?.tags ? storyToEdit.tags.join(', ') : '');
  const [published, setPublished] = useState<boolean>(storyToEdit ? storyToEdit.published : true);
  const [featured, setFeatured] = useState<boolean>(storyToEdit ? storyToEdit.featured : false);

  // Dynamic Categories State
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Image Upload State
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Category Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [categoryModalError, setCategoryModalError] = useState<string | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Helper to generate a unique safe slug
  const generateUniqueSlug = (name: string, existingCats: Category[]) => {
    let baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\u0D80-\u0DFF]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    if (!baseSlug) {
      baseSlug = 'category';
    }
    let slug = baseSlug;
    let counter = 1;
    while (existingCats.some((c) => c.slug.toLowerCase() === slug.toLowerCase() || c.id.toLowerCase() === slug.toLowerCase())) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }
    return slug;
  };

  const handleCreateCategoryInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setCategoryModalError('Category name is required.');
      return;
    }

    const trimmedName = newCategoryName.trim();
    // Case-insensitive check
    const duplicate = categoriesList.find(
      (c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicate) {
      setCategoryModalError('That category already exists.');
      // Auto-select the existing category
      setSelectedCategoryId(duplicate.id);
      setTimeout(() => {
        setIsCategoryModalOpen(false);
        setCategoryModalError(null);
      }, 1500);
      return;
    }

    setIsCreatingCategory(true);
    setCategoryModalError(null);

    try {
      const generatedSlug = generateUniqueSlug(trimmedName, categoriesList);
      const result = await adminService.createCategory({
        name: trimmedName,
        slug: generatedSlug,
        description: newCategoryDescription.trim(),
      });

      // Update local state categoriesList
      const createdCat = result.category;
      setCategoriesList((prev) => [...prev, createdCat]);

      // Automatically select the new category
      setSelectedCategoryId(createdCat.id);

      // Close modal
      setIsCategoryModalOpen(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
    } catch (err: any) {
      console.error('Failed to create category inline:', err);
      setCategoryModalError(err?.message || 'Failed to create category. Please check your network and privileges.');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Fetch categories dynamically from Firestore
  const fetchCategories = async () => {
    setIsCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const cats = await adminService.getCategories();
      const validCats = cats.filter((c) => c.slug !== 'all');
      setCategoriesList(validCats);

      // Auto-select category if editing or if only one category exists
      if (storyToEdit) {
        const found = validCats.find(
          (c) =>
            c.id === storyToEdit.categoryId ||
            c.slug.toLowerCase() === (storyToEdit.category || '').toLowerCase() ||
            c.name.toLowerCase() === (storyToEdit.categoryName || '').toLowerCase()
        );
        if (found) {
          setSelectedCategoryId(found.id);
        } else if (storyToEdit.categoryId) {
          setSelectedCategoryId(storyToEdit.categoryId);
        }
      } else if (validCats.length > 0 && !selectedCategoryId) {
        // Default to first category if user hasn't chosen one
        setSelectedCategoryId(validCats[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load categories dynamically from Firestore:', err);
      setCategoriesError('Failed to load categories from database. Please check your connection.');
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  useEffect(() => {
    if (storyToEdit) {
      setTitle(storyToEdit.title || '');
      setSlug(storyToEdit.slug || '');
      setCoverImage(storyToEdit.coverImage || '');
      setShortDescription(storyToEdit.description || storyToEdit.shortDescription || '');
      setFullContent(storyToEdit.content || storyToEdit.fullContent || '');
      setSelectedCategoryId(storyToEdit.categoryId || storyToEdit.category || '');
      setTagsInput(storyToEdit.tags ? storyToEdit.tags.join(', ') : '');
      setPublished(storyToEdit.published);
      setFeatured(storyToEdit.featured);
    }
    fetchCategories();
  }, [storyToEdit]);

  // Handle local image file upload directly to Firebase Storage
  const handleImageFileChange = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid image file.');
      return;
    }

    try {
      setIsUploadingImage(true);
      setUploadProgress(0);
      setError(null);

      const downloadUrl = await uploadStoryCover(file, (progress) => {
        setUploadProgress(progress);
      });

      setCoverImage(downloadUrl);
      setError(null);
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setError(`Failed to upload image to Firebase Storage: ${err?.message || 'Please check network connection.'}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFileChange(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!shortDescription.trim()) {
      setError('Short description is required.');
      return;
    }
    if (!fullContent.trim()) {
      setError('Story content is required.');
      return;
    }
    if (!coverImage.trim()) {
      setError('Cover image is required. Please upload an image to Firebase Storage or provide a valid URL.');
      return;
    }
    if (coverImage.startsWith('data:image')) {
      setError('Base64 image data is not allowed. Please upload a file to Firebase Storage.');
      return;
    }
    if (!selectedCategoryId) {
      setError('Please select a category from the dropdown.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const matchedCat = categoriesList.find(
        (c) => c.id === selectedCategoryId || c.slug.toLowerCase() === selectedCategoryId.toLowerCase()
      );

      const categorySlug = matchedCat ? matchedCat.slug : selectedCategoryId;
      const categoryId = matchedCat ? matchedCat.id : selectedCategoryId;
      const categoryName = matchedCat ? matchedCat.name : categorySlug;

      if (isEditing && storyToEdit) {
        const result = await adminService.updateStory(storyToEdit.id, {
          title: title.trim(),
          slug: slug.trim() || undefined,
          coverImage: coverImage.trim(),
          shortDescription: shortDescription.trim(),
          description: shortDescription.trim(),
          fullContent: fullContent.trim(),
          content: fullContent.trim(),
          category: categorySlug,
          categoryId: categoryId,
          categoryName: categoryName,
          tags: parsedTags,
          published,
          featured,
        });
        setSuccessMessage('Story updated successfully in database!');
        setTimeout(() => {
          onSaved(result.story);
        }, 600);
      } else {
        const result = await adminService.createStory({
          title: title.trim(),
          coverImage: coverImage.trim(),
          shortDescription: shortDescription.trim(),
          fullContent: fullContent.trim(),
          category: categorySlug,
          categoryId: categoryId,
          tags: parsedTags,
          published,
          featured,
        });
        setSuccessMessage('Story published successfully in database!');
        setTimeout(() => {
          onSaved(result.story);
        }, 600);
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred while saving the story.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Category Creation Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                <span>Create New Category</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setCategoryModalError(null);
                }}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategoryInline} className="space-y-4">
              {categoryModalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{categoryModalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Horror"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Eerie tales and supernatural stories"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setCategoryModalError(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCategory}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isCreatingCategory ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Category</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Story List</span>
        </button>

        {isEditing && storyToEdit && storyToEdit.published && (
          <button
            type="button"
            onClick={() => onViewPublic(storyToEdit.slug)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Preview on Public Site</span>
          </button>
        )}
      </div>

      {/* Main Story Form Card */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-serif flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <span>{isEditing ? `Edit Story: "${storyToEdit?.title}"` : 'Create & Post New Story'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Fill in the story title, category, and formatted text. When published, the story appears immediately for all readers.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: COVER IMAGE VIA FIREBASE STORAGE */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider">
                  Story Cover Image <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Firebase Storage or External URL
                </span>
              </div>
              <div className="flex rounded-lg bg-slate-800 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setImageTab('upload')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    imageTab === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('url')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    imageTab === 'url' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Image URL
                </button>
              </div>
            </div>

            {imageTab === 'upload' ? (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <label className="flex-1 w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl bg-slate-900/60 cursor-pointer transition-colors group text-center relative overflow-hidden">
                  {isUploadingImage ? (
                    <div className="flex flex-col items-center justify-center py-2 space-y-2">
                      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                      <span className="text-xs font-semibold text-slate-200">
                        Uploading to Firebase Storage ({uploadProgress}%)...
                      </span>
                      <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-400 mb-2 transition-colors" />
                      <span className="text-xs font-semibold text-slate-200">
                        Click to browse or drop an image file
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1">
                        Supports JPEG, PNG, WebP, AVIF (Max 8MB)
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                    disabled={isUploadingImage}
                    onChange={handleImageInputChange}
                    className="hidden"
                  />
                </label>

                {coverImage && (
                  <div className="w-full sm:w-48 shrink-0 flex flex-col items-center">
                    <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-700 shadow-md relative bg-slate-900">
                      <img
                        src={coverImage}
                        alt="Cover Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Storage URL Saved
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {coverImage && (
                  <div className="w-48 aspect-video rounded-xl overflow-hidden border border-slate-700">
                    <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 2: TITLE & DYNAMIC CATEGORY */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8">
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
                Story Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. සඳ පහන් වූ රැයක (A Moonlit Night Tale)"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-white uppercase tracking-wider">
                  Category <span className="text-rose-400">*</span>
                </label>
                {isCategoriesLoading && (
                  <span className="text-[10px] text-indigo-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                  </span>
                )}
              </div>

              {categoriesError ? (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-rose-400 flex items-center justify-between">
                    <span>{categoriesError}</span>
                    <button
                      type="button"
                      onClick={fetchCategories}
                      className="text-indigo-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                  </div>
                  <select
                    disabled
                    className="w-full px-4 py-3 bg-slate-950/50 border border-rose-500/50 rounded-xl text-xs text-slate-500 opacity-60"
                  >
                    <option>Categories unavailable</option>
                  </select>
                </div>
              ) : (
                <select
                  required
                  value={selectedCategoryId}
                  onChange={(e) => {
                    if (e.target.value === 'CREATE_NEW_CATEGORY') {
                      setIsCategoryModalOpen(true);
                      setNewCategoryName('');
                      setNewCategoryDescription('');
                      setCategoryModalError(null);
                    } else {
                      setSelectedCategoryId(e.target.value);
                    }
                  }}
                  disabled={isCategoriesLoading}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                >
                  {isCategoriesLoading ? (
                    <option value="">Loading categories from database...</option>
                  ) : (
                    <>
                      <option value="">Choose category</option>
                      {categoriesList.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                      <option value="CREATE_NEW_CATEGORY" className="text-indigo-400 font-semibold bg-slate-900">
                        + Create New Category
                      </option>
                    </>
                  )}
                </select>
              )}
            </div>
          </div>

          {/* SECTION 3: SHORT DESCRIPTION */}
          <div>
            <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
              Short Description (Synopsis / Hook) <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="A brief 1-2 sentence hook summarizing the core plot or theme..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* SECTION 4: FULL STORY CONTENT */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                Story Content (Full Text) <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Word count: {fullContent.trim() ? fullContent.trim().split(/\s+/).length : 0} words
              </span>
            </div>
            <textarea
              rows={14}
              required
              value={fullContent}
              onChange={(e) => setFullContent(e.target.value)}
              placeholder="Paste or write the complete story paragraphs here..."
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-serif leading-relaxed"
            />
          </div>

          {/* SECTION 5: TAGS */}
          <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tags (comma separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="adventure, magic, journey, romance"
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* SECTION 6: PUBLISH STATUS & SUBMISSION */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-800">
            <div className="flex flex-wrap items-center gap-6">
              {/* Published Switch */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`block w-12 h-7 rounded-full transition-colors ${
                      published ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  />
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${
                      published ? 'transform translate-x-5' : ''
                    }`}
                  />
                </div>
                <span className="text-xs font-bold text-white">
                  {published ? 'Publish Immediately (Live)' : 'Save as Draft (Hidden)'}
                </span>
              </label>

              {/* Featured toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Feature in Hero Section</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="submit-story-btn"
                type="submit"
                disabled={isSubmitting || isUploadingImage || isCategoriesLoading}
                className="flex-1 sm:flex-initial px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Story...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isEditing ? 'UPDATE STORY' : 'POST STORY'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
