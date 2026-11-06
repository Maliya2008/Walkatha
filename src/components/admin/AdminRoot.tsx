import React, { useState, useEffect } from 'react';
import { Story, Category } from '../../types/story';
import { StoryService } from '../../services/storyService';
import { auth } from '../../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

const ADMIN_CONFIG_EMAIL = 'merlinfiverr0@gmail.com';
const ADMIN_CONFIG_PASS = 'g2jabB80';
const ADMIN_SESSION_KEY = 'walkathawa_admin_session_v1';

interface AdminRootProps {
  onBackToPublic: () => void;
  onViewStoryPublic: (slug: string) => void;
  onDataChanged?: () => void;
}

export const AdminRoot: React.FC<AdminRootProps> = ({
  onBackToPublic,
  onViewStoryPublic,
  onDataChanged,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === ADMIN_CONFIG_EMAIL;
    } catch {
      return false;
    }
  });
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPass, setLoginPass] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [loggingIn, setLoggingIn] = useState<boolean>(false);

  // Admin Tab State
  const [activeTab, setActiveTab] = useState<'stories' | 'categories'>('stories');

  // Data State
  const [stories, setStories] = useState<Story[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [syncStatus, setSyncStatus] = useState<string>('');

  // Story List Filter & Pagination State
  const [search, setSearch] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [adminPage, setAdminPage] = useState<number>(1);
  const STORIES_PER_PAGE = 25;

  // Story Form State (Add & Edit)
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [loadingEditStoryId, setLoadingEditStoryId] = useState<string | null>(null);
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [storySlug, setStorySlug] = useState<string>('');
  const [storyCategory, setStoryCategory] = useState<string>('wife');
  const [storyCoverImage, setStoryCoverImage] = useState<string>('');
  const [storyShortDesc, setStoryShortDesc] = useState<string>('');
  const [storyTags, setStoryTags] = useState<string>('සිංහල වැල කතා, වල් කතා, වැල කතා');
  const [storyContent, setStoryContent] = useState<string>('');
  const [storyFeatured, setStoryFeatured] = useState<boolean>(false);
  const [savingStory, setSavingStory] = useState<boolean>(false);

  // Story Delete Confirmation State
  const [confirmDeleteStoryId, setConfirmDeleteStoryId] = useState<string | null>(null);
  const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null);

  // Category Form State (Add & Delete)
  const [catName, setCatName] = useState<string>('');
  const [catSinhalaName, setCatSinhalaName] = useState<string>('');
  const [catSlug, setCatSlug] = useState<string>('');
  const [catDescription, setCatDescription] = useState<string>('');
  const [savingCat, setSavingCat] = useState<boolean>(false);
  const [confirmDeleteCatKey, setConfirmDeleteCatKey] = useState<string | null>(null);
  const [deletingCatKey, setDeletingCatKey] = useState<string | null>(null);

  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    setTimeout(() => {
      setStatusMsg((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [allStories, allCats] = await Promise.all([
        StoryService.fetchAllLiveStories(true),
        StoryService.getCategories(true),
      ]);
      setStories(allStories);
      setCategories(allCats);
      if (allCats.length > 0 && !storyCategory) {
        setStoryCategory(allCats[0].slug || allCats[0].id);
      }
    } catch {
      showNotice('දත්ත ලබා ගැනීමේදී දෝෂයක් ඇති විය.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPass = loginPass.trim();

    if (
      cleanEmail !== ADMIN_CONFIG_EMAIL.toLowerCase() ||
      cleanPass !== ADMIN_CONFIG_PASS
    ) {
      setLoginError('ඊමේල් ලිපිනය හෝ මුරපදය වැරදියි (Invalid admin email or password).');
      return;
    }

    setLoggingIn(true);
    try {
      // Sign in to Firebase Auth if Email/Password provider is enabled
      await signInWithEmailAndPassword(auth, ADMIN_CONFIG_EMAIL, ADMIN_CONFIG_PASS).catch(
        async () => {
          await createUserWithEmailAndPassword(
            auth,
            ADMIN_CONFIG_EMAIL,
            ADMIN_CONFIG_PASS
          ).catch(() => {});
        }
      );
    } catch {
      // Proceed with configured admin session
    }

    try {
      sessionStorage.setItem(ADMIN_SESSION_KEY, ADMIN_CONFIG_EMAIL);
    } catch {
      // ignore storage errors
    }

    setLoggingIn(false);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      await signOut(auth).catch(() => {});
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setLoginEmail('');
    setLoginPass('');
  };

  const resetStoryForm = () => {
    setEditingStory(null);
    setStoryTitle('');
    setStorySlug('');
    setStoryCoverImage('');
    setStoryShortDesc('');
    setStoryTags('සිංහල වැල කතා, වල් කතා, වැල කතා');
    setStoryContent('');
    setStoryFeatured(false);
  };

  const handleStartEditStory = async (story: Story) => {
    setLoadingEditStoryId(story.id);
    try {
      const fullStory = await StoryService.getStoryBySlug(story.slug || story.id);
      const target = fullStory || story;
      setEditingStory(target);
      setStoryTitle(target.title || '');
      setStorySlug(target.slug || '');
      setStoryCategory(target.category || 'wife');
      setStoryCoverImage(target.coverImage || '');
      setStoryShortDesc(target.shortDescription || target.description || '');
      setStoryTags(
        Array.isArray(target.tags) && target.tags.length > 0
          ? target.tags.join(', ')
          : 'සිංහල වැල කතා, වල් කතා, වැල කතා'
      );
      setStoryContent(target.fullContent || target.content || '');
      setStoryFeatured(Boolean(target.featured));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoadingEditStoryId(null);
    }
  };

  const handleSaveStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyTitle.trim() || !storyContent.trim()) {
      showNotice('කරුණාකර කතාවේ මාතෘකාව සහ සම්පූර්ණ කතාව ඇතුළත් කරන්න.', 'error');
      return;
    }

    setSavingStory(true);
    const parsedTags = storyTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (editingStory) {
        const updated = await StoryService.updateStory(editingStory, {
          title: storyTitle,
          slug: storySlug,
          category: storyCategory,
          coverImage: storyCoverImage,
          shortDescription: storyShortDesc,
          tags: parsedTags,
          fullContent: storyContent,
          featured: storyFeatured,
        });
        setStories((prev) =>
          prev.map((s) => (s.id === editingStory.id || s.slug === editingStory.slug ? updated : s))
        );
        showNotice(`"${updated.title}" කතාව සාර්ථකව යාවත්කාලීන කරන ලදී!`);
        resetStoryForm();
      } else {
        const created = await StoryService.createStory({
          title: storyTitle,
          slug: storySlug,
          category: storyCategory,
          coverImage: storyCoverImage,
          shortDescription: storyShortDesc,
          tags: parsedTags,
          fullContent: storyContent,
          featured: storyFeatured,
        });
        setStories((prev) => [created, ...prev]);
        showNotice(`"${created.title}" නව කතාව සාර්ථකව එක් කරන ලදී!`);
        resetStoryForm();
      }
      if (onDataChanged) onDataChanged();
    } catch {
      showNotice('කතාව සුරැකීමේදී දෝෂයක් ඇති විය.', 'error');
    } finally {
      setSavingStory(false);
    }
  };

  const handleConfirmDeleteStory = async (story: Story) => {
    setDeletingStoryId(story.id);
    try {
      await StoryService.deleteStory(story);
      setStories((prev) => prev.filter((s) => s.id !== story.id && s.slug !== story.slug));
      if (editingStory?.id === story.id) {
        resetStoryForm();
      }
      setConfirmDeleteStoryId(null);
      showNotice(`"${story.title}" කතාව ඉවත් කරන ලදී.`);
      if (onDataChanged) onDataChanged();
    } catch {
      showNotice('කතාව ඉවත් කිරීමේදී දෝෂයක් ඇති විය.', 'error');
    } finally {
      setDeletingStoryId(null);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      showNotice('කරුණාකර වර්ගීකරණයේ නම ඇතුළත් කරන්න.', 'error');
      return;
    }

    setSavingCat(true);
    try {
      const updatedCats = await StoryService.addCategory({
        name: catName,
        sinhalaName: catSinhalaName || catName,
        slug: catSlug,
        description: catDescription,
      });
      setCategories(updatedCats);
      setCatName('');
      setCatSinhalaName('');
      setCatSlug('');
      setCatDescription('');
      showNotice('නව වර්ගීකරණය සාර්ථකව එක් කරන ලදී!');
      if (onDataChanged) onDataChanged();
    } catch {
      showNotice('වර්ගීකරණය එක් කිරීමේදී දෝෂයක් ඇති විය.', 'error');
    } finally {
      setSavingCat(false);
    }
  };

  const handleConfirmDeleteCategory = async (cat: Category) => {
    const key = cat.slug || cat.id;
    setDeletingCatKey(key);
    try {
      const updatedCats = await StoryService.deleteCategory(cat);
      setCategories(updatedCats);
      setConfirmDeleteCatKey(null);
      showNotice(`"${cat.sinhalaName || cat.name}" වර්ගීකරණය ඉවත් කරන ලදී.`);
      if (onDataChanged) onDataChanged();
    } catch {
      showNotice('වර්ගීකරණය ඉවත් කිරීමේදී දෝෂයක් ඇති විය.', 'error');
    } finally {
      setDeletingCatKey(null);
    }
  };

  const handleSyncToPrimaryFirestore = async () => {
    try {
      setSyncStatus('Syncing stories, categories & sitemaps...');
      const res = await StoryService.syncAllToPrimaryFirestore((synced, total) => {
        setSyncStatus(`Synced ${synced}/${total} stories to Firestore...`);
      });
      await fetch('/api/regenerate-sitemap', { method: 'POST' }).catch(() => {});
      setSyncStatus(`සාර්ථකයි! කතා ${res.total} ක් සහ Sitemap යාවත්කාලීන කරන ලදී.`);
    } catch (err: any) {
      setSyncStatus(`Sync Notice: ${err?.message || 'Completed'}`);
    }
  };

  // Render Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#090e1d] text-slate-900 dark:text-slate-100 p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#111a33] border border-slate-200 dark:border-[#1e2d52] rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e2d52] pb-4">
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Walkathawa Admin Login
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                පරිපාලක ගිණුමට පිවිසෙන්න
              </p>
            </div>
            <button
              type="button"
              onClick={onBackToPublic}
              className="text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-[#243763] hover:bg-slate-100 dark:hover:bg-[#162347] cursor-pointer"
            >
              ← වෙබ් අඩවියට
            </button>
          </div>

          {loginError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="merlinfiverr0@gmail.com"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-[#243763] bg-slate-50 dark:bg-[#0d152b] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-[#243763] bg-slate-50 dark:bg-[#0d152b] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-2.5 rounded-lg bg-[#1e3a8a] hover:bg-blue-800 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {loggingIn ? 'පිවිසෙමින්...' : 'පිවිසෙන්න (Sign In)'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filter & Paginate Stories for Admin List
  const filteredStories = stories.filter((s) => {
    const matchesCat =
      filterCategory === 'all' ||
      (s.category || '').toLowerCase() === filterCategory.toLowerCase() ||
      (s.categoryId || '').toLowerCase() === filterCategory.toLowerCase();
    if (!matchesCat) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (s.title || '').toLowerCase().includes(q) ||
      (s.slug || '').toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q) ||
      (s.id || '').toLowerCase().includes(q)
    );
  });

  const totalAdminPages = Math.max(1, Math.ceil(filteredStories.length / STORIES_PER_PAGE));
  const safeAdminPage = Math.min(Math.max(1, adminPage), totalAdminPages);
  const paginatedStories = filteredStories.slice(
    (safeAdminPage - 1) * STORIES_PER_PAGE,
    safeAdminPage * STORIES_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090e1d] text-slate-900 dark:text-slate-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Top Admin Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#111a33] p-4 rounded-lg border border-slate-200 dark:border-[#1e2d52]">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Walkathawa Admin Panel
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Logged in as <span className="font-medium text-blue-600 dark:text-blue-400">{ADMIN_CONFIG_EMAIL}</span> • කතා {stories.length} • වර්ගීකරණ {categories.length}
            </p>
            {syncStatus && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{syncStatus}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSyncToPrimaryFirestore}
              className="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-[#162347] hover:bg-slate-200 dark:hover:bg-[#1e305e] text-xs font-medium cursor-pointer"
            >
              Sync Firestore & Sitemap
            </button>
            <button
              type="button"
              onClick={onBackToPublic}
              className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-[#243763] text-xs font-medium cursor-pointer"
            >
              ← වෙබ් අඩවියට
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-md bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-medium cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Status Notification Banner */}
        {statusMsg && (
          <div
            className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-between ${
              statusMsg.type === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <span>{statusMsg.text}</span>
            <button
              type="button"
              onClick={() => setStatusMsg(null)}
              className="ml-4 underline cursor-pointer"
            >
              Close
            </button>
          </div>
        )}

        {/* Navigation Tabs: Stories vs Categories */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1e2d52] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('stories')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'stories'
                ? 'bg-[#1e3a8a] text-white'
                : 'bg-white dark:bg-[#111a33] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1e2d52]'
            }`}
          >
            කතා කළමනාකරණය (Stories: {stories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-[#1e3a8a] text-white'
                : 'bg-white dark:bg-[#111a33] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1e2d52]'
            }`}
          >
            වර්ගීකරණ කළමනාකරණය (Categories: {categories.length})
          </button>
        </div>

        {/* TAB 1: STORIES MANAGEMENT (ADD, EDIT, DELETE) */}
        {activeTab === 'stories' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Story Add / Edit Form (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#111a33] p-4 rounded-lg border border-slate-200 dark:border-[#1e2d52] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e2d52] pb-2.5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingStory
                    ? `කතාව සංස්කරණය කරන්න (Edit Story)`
                    : 'නව කතාවක් එක් කරන්න (Add New Story)'}
                </h2>
                {editingStory && (
                  <button
                    type="button"
                    onClick={resetStoryForm}
                    className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-[#162347] text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveStory} className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium mb-1">කතාවේ මාතෘකාව (Title) *</label>
                  <input
                    type="text"
                    required
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    placeholder="උදා: අම්මා වල් කතා 2026 - 1 කොටස"
                    className="w-full px-3 py-2 rounded border border-slate-200 dark:border-[#243763] bg-slate-50 dark:bg-[#0d152b]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium mb-1">වර්ගීකරණය (Category) *</label>
                    <select
                      value={storyCategory}
                      onChange={(e) => setStoryCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-slate-200 dark:border-[#243763] bg-slate-50 dark:bg-[#0d152b]"
                    >
                      {categories.map((cat) => (
                        <option key={cat.slug || cat.id} value={cat.slug || cat.id}>
                          {cat.sinhalaName || cat.name} ({cat.slug || cat.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Slug (URL Name - Optional)</label>
                    <input
                      type="text"
                      value={storySlug}
                      onChange={(e) => setStorySlug(e.target.value)}
                      placeholder="auto-generated-from-title"
                      className="w-full px-3 py-2 rounded border border-slate-200 dark:border-[#243763] bg-slate-50 dark:bg-[#0d152b]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1">පින්තූරයේ URL (Cover Image URL)</label>
                  <input
                    type="url"
                    value={storyCoverImage}
                    onChange={(e) => setStoryCoverImage(e.target.value)}
                    placeholder="https://example.com/image.webp"
                    className="w-full px-3 py-2 rounded border border-slate-200 dark:border-[#243763] bg-slate-50 dark:bg-[#0d152b]"
                  />
                  {storyCoverImage && (
                    <div className="mt-2 h-28 w-full rounded overflow-hidden border border-slate-200 dark:border-[#243763] bg-slate-900">
                      <img
                        src={storyCoverImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-medium mb-1">
                    කෙටි විස්තරය (Short SEO Description - Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={storyShortDesc}
                    onChange={(e) => setStoryShortDesc(e.target.value)}
                    placeholder="හිස්ව තැබුවහොත් කතාවේ මුල් කොටසින් ස්වයංක්‍රීයව සැකසේ..."
                    className="w-full px-3 py-2 rounded border border-slate-200 dark:border-[#243763] bg-slate-50 dark:bg-[#0d152b]"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={storyTags}
                    onChange={(e) => setStoryTags(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-slate-200 dark:border-[#243763] bg-slate-50 dark:bg-[#0d152b]"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">සම්පූර්ණ කතාව (Full Story Content) *</label>
                  <textarea
                    rows={10}
                    required
                    value={storyContent}
                    onChange={(e) => setStoryContent(e.target.value)}
                    placeholder="සම්පූර්ණ සිංහල කතාව මෙහි ලියන්න..."
                    className="w-full px-3 py-2 rounded border border-slate-200 dark:border-[#243763] bg-slate-50 dark:bg-[#0d152b] leading-relaxed"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={storyFeatured}
                    onChange={(e) => setStoryFeatured(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span>Featured Story (විශේෂිත කතාවක් ලෙස ලකුණු කරන්න)</span>
                </label>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={savingStory}
                    className="flex-1 py-2.5 rounded bg-[#1e3a8a] hover:bg-blue-800 text-white font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {savingStory
                      ? 'සුරකිමින්...'
                      : editingStory
                      ? 'කතාව යාවත්කාලීන කරන්න (Update Story)'
                      : 'කතාව පළ කරන්න (Add Story)'}
                  </button>
                  {editingStory && (
                    <button
                      type="button"
                      onClick={resetStoryForm}
                      className="px-3 py-2.5 rounded border border-slate-200 dark:border-[#243763] text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      අවලංගු
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Existing Stories List with Search, Category Filter, Edit & Delete (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-[#111a33] p-4 rounded-lg border border-slate-200 dark:border-[#1e2d52] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold">
                  දැනට පවතින කතා ලැයිස්තුව ({filteredStories.length})
                </h2>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={filterCategory}
                    onChange={(e) => {
                      setFilterCategory(e.target.value);
                      setAdminPage(1);
                    }}
                    className="px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-[#243763] bg-slate-50 dark:bg-[#0d152b]"
                  >
                    <option value="all">සියලුම වර්ගීකරණ (All Categories)</option>
                    {categories.map((cat) => (
                      <option key={cat.slug || cat.id} value={cat.slug || cat.id}>
                        {cat.sinhalaName || cat.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="search"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setAdminPage(1);
                    }}
                    placeholder="කතාවක් සොයන්න..."
                    className="px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-[#243763] bg-slate-50 dark:bg-[#0d152b]"
                  />
                </div>
              </div>

              {loading ? (
                <p className="text-xs text-slate-400 py-8 text-center">Loading Firestore stories...</p>
              ) : paginatedStories.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">කතා කිසිවක් හමු නොවීය.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-[#1e2d52]">
                  {paginatedStories.map((story) => {
                    const isConfirmingDelete = confirmDeleteStoryId === story.id;
                    const isDeleting = deletingStoryId === story.id;
                    const isEditingThis = editingStory?.id === story.id;
                    const isLoadingEdit = loadingEditStoryId === story.id;

                    return (
                      <div
                        key={story.id}
                        className={`py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          isEditingThis ? 'bg-blue-500/5 px-2 rounded' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-10 rounded overflow-hidden bg-slate-200 dark:bg-[#0d152b] shrink-0">
                            {story.coverImage ? (
                              <img
                                src={story.coverImage}
                                alt={story.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {story.title}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 truncate">
                              {story.category} • වචන {story.wordCount || 800} • බැලීම් {story.views || 0}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isConfirmingDelete ? (
                            <>
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleConfirmDeleteStory(story)}
                                className="px-2.5 py-1 rounded bg-red-600 text-white font-semibold cursor-pointer disabled:opacity-50"
                              >
                                {isDeleting ? 'මකමින්...' : 'තහවුරු කරන්න'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteStoryId(null)}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-[#243763] cursor-pointer"
                              >
                                අවලංගු
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                disabled={isLoadingEdit}
                                onClick={() => handleStartEditStory(story)}
                                className="px-2.5 py-1 rounded bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 font-medium cursor-pointer"
                              >
                                {isLoadingEdit ? 'Loading...' : 'සංස්කරණය (Edit)'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteStoryId(story.id)}
                                className="px-2.5 py-1 rounded bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-600/20 font-medium cursor-pointer"
                              >
                                මකන්න (Delete)
                              </button>
                              <button
                                type="button"
                                onClick={() => onViewStoryPublic(story.slug)}
                                className="px-2.5 py-1 rounded border border-slate-200 dark:border-[#243763] hover:bg-slate-100 dark:hover:bg-[#162347] cursor-pointer"
                              >
                                කියවන්න
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Admin Stories Pagination */}
              {totalAdminPages > 1 && (
                <div className="pt-3 border-t border-slate-200 dark:border-[#1e2d52] flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    පිටුව {safeAdminPage} / {totalAdminPages} (මුළු කතා {filteredStories.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={safeAdminPage <= 1}
                      onClick={() => setAdminPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1 rounded border border-slate-200 dark:border-[#243763] disabled:opacity-40 cursor-pointer"
                    >
                      ← පෙර
                    </button>
                    <button
                      type="button"
                      disabled={safeAdminPage >= totalAdminPages}
                      onClick={() => setAdminPage((p) => Math.min(totalAdminPages, p + 1))}
                      className="px-3 py-1 rounded border border-slate-200 dark:border-[#243763] disabled:opacity-40 cursor-pointer"
                    >
                      මීළඟ →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORIES MANAGEMENT (ADD & DELETE) */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Add Category Form (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#111a33] p-4 rounded-lg border border-slate-200 dark:border-[#1e2d52] space-y-4">
              <h2 className="text-sm font-bold border-b border-slate-200 dark:border-[#1e2d52] pb-2.5">
                නව වර්ගීකරණයක් එක් කරන්න (Add Category)
              </h2>

              <form onSubmit={handleAddCategory} className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium mb-1">
                    වර්ගීකරණයේ නම (Category Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="උදා: අම්මා කතා (Amma Stories)"
                    className="w-full px-3 py-2 rounded border border-slate-200 dark:border-[#243763] bg-slate-50 dark:bg-[#0d152b]"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">
                    සිංහල නම (Sinhala Display Name)
                  </label>
                  <input
                    type="text"
                    value={catSinhalaName}
                    onChange={(e) => setCatSinhalaName(e.target.value)}
                    placeholder="උදා: අම්මා කතා"
                    className="w-full px-3 py-2 rounded border border-slate-200 dark:border-[#243763] bg-slate-50 dark:bg-[#0d152b]"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Slug (URL Key - Optional)</label>
                  <input
                    type="text"
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    placeholder="උදා: amma-katha"
                    className="w-full px-3 py-2 rounded border border-slate-200 dark:border-[#243763] bg-slate-50 dark:bg-[#0d152b]"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">විස්තරය (SEO Description)</label>
                  <textarea
                    rows={3}
                    value={catDescription}
                    onChange={(e) => setCatDescription(e.target.value)}
                    placeholder="වර්ගීකරණය සඳහා කෙටි විස්තරයක්..."
                    className="w-full px-3 py-2 rounded border border-slate-200 dark:border-[#243763] bg-slate-50 dark:bg-[#0d152b]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingCat}
                  className="w-full py-2.5 rounded bg-[#1e3a8a] hover:bg-blue-800 text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {savingCat ? 'සුරකිමින්...' : 'වර්ගීකරණය එක් කරන්න (Add Category)'}
                </button>
              </form>
            </div>

            {/* Existing Categories List with Delete (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-[#111a33] p-4 rounded-lg border border-slate-200 dark:border-[#1e2d52] space-y-4">
              <h2 className="text-sm font-bold border-b border-slate-200 dark:border-[#1e2d52] pb-2.5">
                දැනට පවතින වර්ගීකරණ ({categories.length})
              </h2>

              {categories.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">වර්ගීකරණ කිසිවක් නොමැත.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-[#1e2d52]">
                  {categories.map((cat) => {
                    const key = cat.slug || cat.id;
                    const isConfirming = confirmDeleteCatKey === key;
                    const isDeleting = deletingCatKey === key;

                    return (
                      <div
                        key={key}
                        className="py-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {cat.sinhalaName || cat.name}{' '}
                            <span className="text-slate-400 font-normal">({key})</span>
                          </p>
                          {cat.description && (
                            <p className="text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {cat.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isConfirming ? (
                            <>
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleConfirmDeleteCategory(cat)}
                                className="px-2.5 py-1 rounded bg-red-600 text-white font-semibold cursor-pointer disabled:opacity-50"
                              >
                                {isDeleting ? 'මකමින්...' : 'තහවුරු කරන්න'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteCatKey(null)}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-[#243763] cursor-pointer"
                              >
                                අවලංගු
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteCatKey(key)}
                              className="px-2.5 py-1 rounded bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-600/20 font-medium cursor-pointer"
                            >
                              මකන්න (Delete)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
