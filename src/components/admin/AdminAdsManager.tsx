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
  Sparkles,
  AlertCircle,
  Save,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { AdvertisementSettings } from '../../types/admin';
import { Story } from '../../types/story';

export const AdminAdsManager: React.FC = () => {
  const [adsSettings, setAdsSettings] = useState<AdvertisementSettings>({
    globalAdCode: '',
    adsEnabled: true,
    adsPerPage: 2,
    headerAdCode: '',
    inArticleAdCode: '',
    footerAdCode: '',
    testMode: true,
  });

  const [postAds, setPostAds] = useState<Record<string, string>>({});
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<string>('');
  const [individualAdCode, setIndividualAdCode] = useState<string>('');

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
        setIndividualAdCode(adsData.postAdvertisements?.[firstId] || storiesList[0].individualAdCode || '');
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
    const code = postAds[storyId] || stories.find((s) => s.id === storyId)?.individualAdCode || '';
    setIndividualAdCode(code);
  };

  const handleSaveGlobalAds = async () => {
    setIsSavingGlobal(true);
    setFeedback(null);
    try {
      const res = await adminService.updateAdvertisementSettings(adsSettings);
      setAdsSettings(res.advertisements);
      setFeedback({ type: 'success', message: 'Global Monetag settings saved successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save settings' });
    } finally {
      setIsSavingGlobal(false);
    }
  };

  const handleSaveIndividualStoryAd = async () => {
    if (!selectedStoryId) return;
    setIsSavingPostAd(true);
    setFeedback(null);
    try {
      await adminService.updateStoryAd(selectedStoryId, individualAdCode);
      setPostAds((prev) => ({ ...prev, [selectedStoryId]: individualAdCode }));
      const targetStory = stories.find((s) => s.id === selectedStoryId);
      setFeedback({
        type: 'success',
        message: `Ad code for "${targetStory?.title || 'selected story'}" saved successfully!`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save individual ad code' });
    } finally {
      setIsSavingPostAd(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span>Loading Monetag Advertisement Configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-serif flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-indigo-400" />
            <span>Monetag Monetization Hub</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure global Monetag scripts, control ads-per-page quantity, and assign individual post sponsors.
          </p>
        </div>

        {/* Master ON/OFF Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              adsSettings.adsEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {adsSettings.adsEnabled ? '● Monetization Active' : '○ Ads Disabled'}
          </span>
        </div>
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

      {/* SECTION 1: MASTER CONTROLS (ON/OFF & AMOUNT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option D: Master Switch */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Master Ads Switch</h3>
                <p className="text-[11px] text-slate-400">Global killswitch for all Monetag containers</p>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={adsSettings.adsEnabled}
                  onChange={(e) => setAdsSettings((prev) => ({ ...prev, adsEnabled: e.target.checked }))}
                  className="sr-only"
                />
                <div
                  className={`block w-14 h-8 rounded-full transition-colors ${
                    adsSettings.adsEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                />
                <div
                  className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                    adsSettings.adsEnabled ? 'transform translate-x-6' : ''
                  }`}
                />
              </div>
            </label>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
            {adsSettings.adsEnabled ? (
              <span className="text-emerald-400 font-medium">
                ✓ Enabled: Monetag containers and dynamic scripts will load across the website according to your quantity settings.
              </span>
            ) : (
              <span className="text-rose-400 font-medium">
                ✗ Disabled: No Monetag scripts load and all ad containers are completely hidden from readers.
              </span>
            )}
          </p>
        </div>

        {/* Option C: Number of ads loaded per page */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Ad Quantity Per Page</h3>
              <p className="text-[11px] text-slate-400">Dynamically load exact advertisement count</p>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Maximum Ads Rendered:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setAdsSettings((prev) => ({ ...prev, adsPerPage: num as 1 | 2 | 3 }))}
                  className={`py-3 px-4 rounded-xl text-center border font-bold text-xs transition-all cursor-pointer ${
                    adsSettings.adsPerPage === num
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <div className="text-lg font-mono">{num}</div>
                  <div className="text-[10px] font-normal uppercase tracking-wider">
                    {num === 1 ? 'Header only' : num === 2 ? 'Header + Mid' : 'Full (3 slots)'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: GLOBAL WEBSITE ADS (Option B) */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Global Website Advertisement Code</h3>
              <p className="text-xs text-slate-400">
                This code runs across all pages (Homepage, Story Gallery, and Story Readers)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveGlobalAds}
            disabled={isSavingGlobal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSavingGlobal ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Global Settings</span>
              </>
            )}
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
            Global Monetag Script / Banner HTML Tag:
          </label>
          <textarea
            rows={5}
            value={adsSettings.globalAdCode}
            onChange={(e) => setAdsSettings((prev) => ({ ...prev, globalAdCode: e.target.value }))}
            placeholder="<!-- Paste Monetag Script Tag or HTML Banner code here -->"
            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-xs text-amber-300 font-mono placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
          />
        </div>

        {/* Security & External Window Rule Notice */}
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 flex items-start gap-3 text-xs text-indigo-200">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Automatic Link Safety Enforced:</strong> All ad links and scripts automatically execute with{' '}
            <code className="bg-slate-900 px-1 py-0.5 rounded text-white font-mono">target="_blank"</code> and{' '}
            <code className="bg-slate-900 px-1 py-0.5 rounded text-white font-mono">rel="noopener noreferrer"</code>{' '}
            to ensure users never lose their story reading place when clicking an advertisement.
          </div>
        </div>
      </div>

      {/* SECTION 3: INDIVIDUAL POST ADS (Option A) */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Individual Story Advertisements</h3>
              <p className="text-xs text-slate-400">
                Assign customized advertisement code to specific story pages
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveIndividualStoryAd}
            disabled={isSavingPostAd || !selectedStoryId}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-xs font-bold shadow-lg shadow-amber-600/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSavingPostAd ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Story Ad Code</span>
              </>
            )}
          </button>
        </div>

        {/* Story Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Story:
            </label>
            <select
              value={selectedStoryId}
              onChange={(e) => handleStorySelectionChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {stories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-8">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Story Ad Code (Exclusive to this story):
            </label>
            <textarea
              rows={3}
              value={individualAdCode}
              onChange={(e) => setIndividualAdCode(e.target.value)}
              placeholder="<!-- Monetag Story-Specific Tag -->"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-amber-300 font-mono placeholder-slate-600 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <p className="text-[11px] text-slate-400 italic">
          Tip: If individual story ad code is blank, the public website automatically falls back to the Global Advertisement Code.
        </p>
      </div>
    </div>
  );
};
