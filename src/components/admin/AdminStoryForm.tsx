import React, { useState, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Tag,
  BookOpen,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  FileCode,
  Eye,
} from 'lucide-react';
import { Story } from '../../types/story';
import { adminService } from '../../services/adminService';

interface AdminStoryFormProps {
  storyToEdit?: Story | null;
  onSaved: (story: Story) => void;
  onCancel: () => void;
  onViewPublic: (slug: string) => void;
}

const CATEGORIES = [
  { slug: 'romantic', name: 'ආදර කතා (Romantic Stories)' },
  { slug: 'adventure', name: 'ත්‍රාසජනක (Adventure & Thriller)' },
  { slug: 'fiction', name: 'ප්‍රබන්ධ කතා (Fictional Stories)' },
  { slug: 'mystery', name: 'අභිරහස් (Mystery & Detective)' },
  { slug: 'sci-fi', name: 'විද්‍යා ප්‍රබන්ධ (Science Fiction)' },
  { slug: 'fantasy', name: 'මනඃකල්පිත (Fantasy & Myth)' },
  { slug: 'horror', name: 'හොල්මන් / බියකරු (Supernatural Horror)' },
  { slug: 'inspirational', name: 'ජීවිත ආදර්ශ (Inspirational & Life)' },
];

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
  const [shortDescription, setShortDescription] = useState(storyToEdit?.shortDescription || '');
  const [fullContent, setFullContent] = useState(storyToEdit?.fullContent || '');
  const [category, setCategory] = useState(storyToEdit?.category || 'adventure');
  const [tagsInput, setTagsInput] = useState(storyToEdit?.tags ? storyToEdit.tags.join(', ') : '');
  const [authorName, setAuthorName] = useState(storyToEdit?.author?.name || 'Editorial Staff');
  const [readingTime, setReadingTime] = useState<number>(storyToEdit?.readingTime || 5);
  const [published, setPublished] = useState<boolean>(storyToEdit ? storyToEdit.published : true);
  const [featured, setFeatured] = useState<boolean>(storyToEdit ? storyToEdit.featured : false);
  const [individualAdCode, setIndividualAdCode] = useState(storyToEdit?.individualAdCode || '');

  // UI state
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-calculate reading time when content changes
  useEffect(() => {
    if (fullContent) {
      const words = fullContent.trim().split(/\s+/).filter(Boolean).length;
      const calculated = Math.max(1, Math.ceil(words / 200));
      if (!isEditing || !storyToEdit?.readingTime) {
        setReadingTime(calculated);
      }
    }
  }, [fullContent, isEditing, storyToEdit]);

  // Handle local image file upload to Firebase Storage
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Selected image exceeds 8MB. Please choose a smaller image.');
      return;
    }

    try {
      const { storage } = await import('../../lib/firebase');
      const { ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
      
      const fileName = `covers/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      // We do a simple upload. For progress, could use uploadBytesResumable
      const snapshot = await uploadBytesResumable(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setCoverImage(downloadURL);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to upload image to Storage. Using base64 fallback.');
      
      // Fallback
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCoverImage(event.target.result as string);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
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
      setError('Cover image is required. Please upload an image or provide a valid image URL.');
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
      if (isEditing && storyToEdit) {
        const result = await adminService.updateStory(storyToEdit.id, {
          title: title.trim(),
          slug: slug.trim() || undefined,
          coverImage: coverImage.trim(),
          shortDescription: shortDescription.trim(),
          fullContent: fullContent.trim(),
          category: category.trim(),
          tags: parsedTags,
          author: {
            ...storyToEdit.author,
            name: authorName.trim(),
          },
          readingTime: Number(readingTime),
          published,
          featured,
          individualAdCode: individualAdCode.trim(),
        });
        setSuccessMessage('Story updated successfully!');
        onSaved(result.story);
      } else {
        const result = await adminService.createStory({
          title: title.trim(),
          coverImage: coverImage.trim(),
          shortDescription: shortDescription.trim(),
          fullContent: fullContent.trim(),
          category: category.trim(),
          tags: parsedTags,
          author: authorName.trim(),
          readingTime: Number(readingTime),
          published,
          featured,
          individualAdCode: individualAdCode.trim(),
        });
        setSuccessMessage('Story published successfully! It is now live on the public website.');
        onSaved(result.story);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the story.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-xl bg-slate-900 border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Story List</span>
        </button>

        {isEditing && storyToEdit && storyToEdit.published && (
          <button
            type="button"
            onClick={() => onViewPublic(storyToEdit.slug)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
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
            Fill in the publishing metadata and formatted story text. When published, the story appears immediately for all readers.
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
          {/* SECTION 1: COVER IMAGE */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                Story Cover Image <span className="text-rose-400">*</span>
              </label>
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
                <label className="flex-1 w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl bg-slate-900/60 cursor-pointer transition-colors group text-center">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-400 mb-2 transition-colors" />
                  <span className="text-xs font-semibold text-slate-200">
                    Click to browse or drop an image here
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">
                    Supports JPG, PNG, WebP (Max 8MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
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
                      <CheckCircle2 className="w-3 h-3" /> Image Ready
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

          {/* SECTION 2: TITLE & SLUG */}
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
                placeholder="e.g. The Whispering Forest of Eldoria"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none capitalize"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
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
              placeholder="Paste or write the complete short story paragraphs here..."
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-serif leading-relaxed"
            />
          </div>

          {/* SECTION 5: METADATA ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-5 rounded-2xl bg-slate-950/40 border border-slate-800">
            {/* Author */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Author Name
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Author Name"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Reading Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Reading Time (Minutes)</span>
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={readingTime}
                onChange={(e) => setReadingTime(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tags (comma separated)</span>
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="adventure, magic, journey"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* SECTION 6: INDIVIDUAL POST ADVERTISEMENT CODE */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span>Individual Story Monetag Ad Code (Optional)</span>
              </label>
              <span className="text-[11px] text-slate-400">Story-specific sponsor tag</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              If provided, this Monetag snippet will load exclusively on this story's reading page (overriding or supplementing global ads).
            </p>
            <textarea
              rows={3}
              value={individualAdCode}
              onChange={(e) => setIndividualAdCode(e.target.value)}
              placeholder="<script>/* Monetag Story Zone Tag */</script> or <a href='...' target='_blank'>...</a>"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-amber-300 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* SECTION 7: PUBLISH STATUS & SUBMISSION */}
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
                <span>Feature in Hero Carousel</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                id="submit-story-btn"
                type="submit"
                disabled={isSubmitting}
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
