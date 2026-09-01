import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Power,
  Layers,
  FileCode,
  Globe,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Save,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { DirectAdSettings } from '../../types/admin';
import { Story } from '../../types/story';

export const AdminAdsManager: React.FC = () => {
  const [adsSettings, setAdsSettings] = useState<DirectAdSettings>({
    globalDirectLink: '',
    enabled: true,
    maxTriggers: 1,
  });

  const [postAds, setPostAds] = useState<Record<string, string>>({});
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<string>('');
  const [directAdLink, setDirectAdLink] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [isSavingPostAd, setIsSavingPostAd] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchAdsData = async () => {
    try {
      setIsLoading(true);
      const [adsData, storiesList] = await Promise.all([
        adminService.getAdvertisementSettings(),
        adminService.getStories(),
      ]);
      setAdsSettings(adsData.advertisements);
      setPostAds(adsData.postAdvertisements || {});
      setStories(storiesList);

      if (storiesList.length > 0) {
        const firstId = storiesList[0].id;
        setSelectedStoryId(firstId);
        setDirectAdLink(adsData.postAdvertisements?.[firstId] || storiesList.find(s => s.id === firstId)?.directAdLink || '');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load ad settings' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdsData();
  }, []);

  const handleStorySelectionChange = (storyId: string) => {
    setSelectedStoryId(storyId);
    const link = postAds[storyId] || stories.find((s) => s.id === storyId)?.directAdLink || '';
    setDirectAdLink(link);
  };

  const handleSaveGlobalAds = async () => {
    setIsSavingGlobal(true);
    setFeedback(null);
    try {
      // Validate URLs
      if (adsSettings.globalDirectLink) {
        new URL(adsSettings.globalDirectLink);
      }
      
      const res = await adminService.updateAdvertisementSettings(adsSettings);
      setAdsSettings(res.advertisements);
      setFeedback({ type: 'success', message: 'Global direct link settings saved successfully!' });
    } catch (err: any) {
      if (err instanceof TypeError) {
        setFeedback({ type: 'error', message: 'Invalid URL format for global direct link.' });
      } else {
        setFeedback({ type: 'error', message: err.message || 'Failed to save settings' });
      }
    } finally {
      setIsSavingGlobal(false);
    }
  };

  const handleSaveIndividualStoryAd = async () => {
    if (!selectedStoryId) return;
    setIsSavingPostAd(true);
    setFeedback(null);
    try {
      if (directAdLink) {
        new URL(directAdLink);
      }

      await adminService.updateStoryAd(selectedStoryId, directAdLink);
      setPostAds((prev) => ({ ...prev, [selectedStoryId]: directAdLink }));
      const targetStory = stories.find((s) => s.id === selectedStoryId);
      
      setFeedback({
        type: 'success',
        message: `Direct link for "${targetStory?.title || 'selected story'}" saved successfully!`,
      });
    } catch (err: any) {
      if (err instanceof TypeError) {
        setFeedback({ type: 'error', message: 'Invalid URL format for story direct link.' });
      } else {
        setFeedback({ type: 'error', message: err.message || 'Failed to save individual ad link' });
      }
    } finally {
      setIsSavingPostAd(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span>Loading Advertisement Configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Megaphone className="w-6 h-6 text-indigo-400" />
            Direct Link Monetization
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your global redirection links, frequency limits, and story-specific overrides.
          </p>
        </div>
        <a
          href="https://monetag.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium bg-indigo-500/10 px-4 py-2 rounded-xl transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Monetag Dashboard
        </a>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-sm">{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Global Settings */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-colors">
            
            <div className="flex items-start gap-4 mb-8 relative z-10">
              <div className="p-3 bg-indigo-500/10 rounded-2xl">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Global Direct Ad Settings</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure default link routing and frequency caps.
                </p>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              {/* Master Switch */}
              <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800/60">
                <div className="flex items-center gap-3">
                  <Power className={`w-5 h-5 ${adsSettings.enabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div>
                    <span className="text-sm font-medium text-white block">Direct Link Ads</span>
                    <span className="text-[11px] text-slate-500">Enable or disable all link redirects globally</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={adsSettings.enabled}
                    onChange={(e) => setAdsSettings({ ...adsSettings, enabled: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Global Link Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  Global Direct Link
                </label>
                <div className="relative">
                  <Globe className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    type="url"
                    value={adsSettings.globalDirectLink}
                    onChange={(e) => setAdsSettings({ ...adsSettings, globalDirectLink: e.target.value })}
                    placeholder="https://example-ad-link.com"
                    className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-slate-800/60 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  This link will be used when no story-specific link is configured.
                </p>
              </div>

              {/* Max Triggers per session */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  Maximum Ad Triggers per User Session
                </label>
                <div className="relative">
                  <Layers className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                  <select
                    value={adsSettings.maxTriggers}
                    onChange={(e) => setAdsSettings({ ...adsSettings, maxTriggers: parseInt(e.target.value, 10) as 1 | 2 | 3 })}
                    className="w-full pl-12 pr-10 py-3 bg-slate-950/50 border border-slate-800/60 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none"
                  >
                    <option value={1}>1 - Only first eligible click redirects</option>
                    <option value={2}>2 - Allow two ad redirects</option>
                    <option value={3}>3 - Allow three ad redirects</option>
                  </select>
                </div>
              </div>

            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSaveGlobalAds}
                disabled={isSavingGlobal}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {isSavingGlobal ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Global Settings
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Per Story Overrides */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-sky-500/10 rounded-xl">
                <FileCode className="w-5 h-5 text-sky-400" />
              </div>
              <h2 className="text-base font-bold text-white">Story Overrides</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Select Story
                </label>
                <select
                  value={selectedStoryId}
                  onChange={(e) => handleStorySelectionChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800/60 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500 transition-all"
                >
                  {stories.length === 0 && <option value="">No stories available</option>}
                  {stories.map((story) => (
                    <option key={story.id} value={story.id}>
                      {story.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Direct Ad Link
                </label>
                <textarea
                  value={directAdLink}
                  onChange={(e) => setDirectAdLink(e.target.value)}
                  placeholder="https://example-story-link.com"
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800/60 rounded-xl text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-all font-mono resize-none leading-relaxed"
                />
                <p className="text-[10px] text-slate-500 mt-2">
                  Use this to override the global link for this specific story. Leave blank to fallback to global.
                </p>
              </div>

              <button
                onClick={handleSaveIndividualStoryAd}
                disabled={!selectedStoryId || isSavingPostAd}
                className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {isSavingPostAd ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4 text-sky-400" />
                )}
                Save Story Override
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
