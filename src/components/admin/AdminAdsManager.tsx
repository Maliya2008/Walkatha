import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Power,
  Layers,
  Code2,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Save,
  Sparkles,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { AdvertisementSettings } from '../../types/admin';

export const AdminAdsManager: React.FC = () => {
  const [adsSettings, setAdsSettings] = useState<AdvertisementSettings>({
    enabled: true,
    globalAdCode: '',
    redirectAmount: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchAdsData = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getAdvertisementSettings();
      setAdsSettings(data.advertisements);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load advertisement settings' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdsData();
  }, []);

  const handleSaveAds = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await adminService.updateAdvertisementSettings(adsSettings);
      setAdsSettings(res.advertisements);
      setFeedback({
        type: 'success',
        message: 'Global advertisement settings saved successfully in the database!',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to save advertisement settings',
      });
    } finally {
      setIsSaving(false);
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
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Megaphone className="w-6 h-6 text-indigo-400" />
            Global Monetag Advertisement System
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure the single global advertisement code and session redirection limit for all stories across the website.
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

      {/* Main Global Advertisement Settings Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-indigo-500/10 rounded-2xl">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Global Advertisement Configuration</h2>
            <p className="text-xs text-slate-400 mt-1">
              Settings configured here apply automatically to all stories, story pages, and visitors.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveAds} className="space-y-6">
          {/* Master ON/OFF Switch */}
          <div className="flex items-center justify-between p-5 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <Power className={`w-6 h-6 ${adsSettings.enabled ? 'text-emerald-400' : 'text-slate-500'}`} />
              <div>
                <span className="text-sm font-bold text-white block">
                  Advertisements: {adsSettings.enabled ? 'ON' : 'OFF'}
                </span>
                <span className="text-xs text-slate-400">
                  {adsSettings.enabled
                    ? 'Monetag code and direct redirects are active'
                    : 'All advertisements and redirects are completely disabled'}
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={adsSettings.enabled}
                onChange={(e) => setAdsSettings({ ...adsSettings, enabled: e.target.checked })}
              />
              <div className="w-12 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Global Advertisement Code Textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span>Global Advertisement Code / Direct Link</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Monetag Direct Link URL or Script Tag
              </span>
            </div>
            <textarea
              rows={6}
              value={adsSettings.globalAdCode}
              onChange={(e) => setAdsSettings({ ...adsSettings, globalAdCode: e.target.value })}
              placeholder="Paste your Monetag direct link (e.g. https://...) or JavaScript snippet code here..."
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-xs text-amber-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed resize-y"
            />
            <p className="text-[11px] text-slate-400 mt-2">
              This code will automatically be executed for all stories and pages across the website when advertisements are turned ON.
            </p>
          </div>

          {/* Advertisement Redirection Amount Dropdown */}
          <div>
            <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Advertisement Redirection Amount</span>
            </label>
            <select
              value={adsSettings.redirectAmount}
              onChange={(e) =>
                setAdsSettings({
                  ...adsSettings,
                  redirectAmount: parseInt(e.target.value, 10) as 1 | 2 | 3,
                })
              }
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value={1}>1 - Redirect once per user session</option>
              <option value={2}>2 - Redirect twice per user session</option>
              <option value={3}>3 - Redirect three times per user session</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-2">
              Controls how many times an individual user is automatically redirected to the advertisement direct link during their session.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Settings...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Advertisement Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
