import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  AlertCircle,
  Globe,
  Mail,
  Search,
  Share2,
  BarChart3,
  ShieldCheck,
  FileCode2,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { SiteSettings } from '../../types/admin';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'Walkathawa (වල් කතාව)',
    alternateName: 'වල් කතාව',
    logo: '/icon.png',
    tagline: 'A place to read Sinhala stories online',
    contactEmail: 'contact@walkathawa.com',
    metaTitle: 'Walkathawa (වල් කතාව) | Sinhala Stories Online',
    metaDescription:
      'Walkathawa (වල් කතාව) is a place to read Sinhala stories online. Discover new Sinhala katha, romantic stories, fictional stories, and interesting short stories updated regularly.',
    keywords:
      'walkatha, walakatha, walkathawa, වල් කතා, වල්කතා, sinhala stories, sinhala katha, sinhala short stories, sinhala kathandara, sinhala love stories, sinhala adult stories, sinhala romantic stories, sinhala fictional stories, sinhala novels, new sinhala stories, latest sinhala katha, online sinhala stories, read sinhala stories online',
    ogImage:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    googleAnalyticsId: '',
    searchConsoleVerification: '',
    publisherName: 'Walkathawa (වල් කතාව)',
  });

  const [activeSubTab, setActiveSubTab] = useState<'general' | 'seo' | 'analytics' | 'tools'>('seo');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    adminService
      .getSiteSettings()
      .then((data) => {
        setSettings((prev) => ({
          ...prev,
          ...data,
        }));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      const updated = await adminService.updateSiteSettings(settings);
      setSettings(updated);
      setFeedback({ type: 'success', message: 'SEO and Website configurations saved and deployed successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span>Loading SEO and site settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-serif flex items-center gap-2">
            <Search className="w-6 h-6 text-indigo-400" />
            <span>SEO & Website Settings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Optimize Walkathawa (වල් කතාව) for organic Google search discovery, social media sharing, and analytics.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('seo')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'seo' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>SEO Metadata</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('general')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'general' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Site Identity</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('analytics')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics & Verification</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('tools')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'tools' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Sitemap & Robots</span>
          </button>
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* --- SUBTAB: SEO METADATA --- */}
        {activeSubTab === 'seo' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-400" />
                  <span>Search Engine Optimization (SEO)</span>
                </h3>

                {/* Primary Meta Title */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Main Site Title (SEO Title)
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {settings.metaTitle.length}/60 chars
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={settings.metaTitle}
                    onChange={(e) => setSettings((prev) => ({ ...prev, metaTitle: e.target.value }))}
                    placeholder="Walkathawa (වල් කතාව) | Sinhala Stories Online"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Appears in Google search headlines and browser tab titles.
                  </p>
                </div>

                {/* Meta Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Main Meta Description
                    </label>
                    <span
                      className={`text-[10px] font-mono ${
                        settings.metaDescription.length > 160 ? 'text-amber-400' : 'text-slate-500'
                      }`}
                    >
                      {settings.metaDescription.length}/160 chars
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={settings.metaDescription}
                    onChange={(e) => setSettings((prev) => ({ ...prev, metaDescription: e.target.value }))}
                    placeholder="Walkathawa (වල් කතාව) is a place to read Sinhala stories online..."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Crucial snippet text shown under your site link in organic Google search listings.
                  </p>
                </div>

                {/* Keywords */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Meta Keywords (Sinhala & English)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          keywords:
                            'walkatha, walakatha, walkathawa, වල් කතා, වල්කතා, sinhala stories, sinhala katha, sinhala short stories, sinhala kathandara, sinhala love stories, sinhala adult stories, sinhala romantic stories, sinhala fictional stories, sinhala novels, new sinhala stories, latest sinhala katha, online sinhala stories, read sinhala stories online',
                        }))
                      }
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Reset Standard Keywords</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={settings.keywords}
                    onChange={(e) => setSettings((prev) => ({ ...prev, keywords: e.target.value }))}
                    placeholder="walkatha, walakatha, වල් කතා, sinhala stories..."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Comma-separated keywords targeting Sinhala story reader searches.
                  </p>
                </div>

                {/* Social Share Image (OG Image) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Social Share Image (Open Graph / Twitter Card)</span>
                  </label>
                  <input
                    type="url"
                    value={settings.ogImage}
                    onChange={(e) => setSettings((prev) => ({ ...prev, ogImage: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Preview image generated when sharing the homepage on Facebook, Twitter, WhatsApp, or Telegram.
                  </p>
                </div>
              </div>
            </div>

            {/* Google Search Live SERP Simulator */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Google Search Live Preview</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  How Walkathawa appears to users searching on Google and search engines:
                </p>

                {/* SERP Card */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 font-sans">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] text-white font-bold">
                      W
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      https://walkatha-amber.vercel.app
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-indigo-400 hover:underline cursor-pointer line-clamp-1">
                    {settings.metaTitle || 'Walkathawa (වල් කතාව) | Sinhala Stories Online'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {settings.metaDescription ||
                      'Walkathawa (වල් කතාව) is a place to read Sinhala stories online. Discover new Sinhala katha...'}
                  </p>
                </div>

                {/* Social Share Preview Card */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Facebook / WhatsApp Link Preview
                  </div>
                  {settings.ogImage && (
                    <img
                      src={settings.ogImage}
                      alt="Social share preview"
                      className="w-full h-28 object-cover rounded-xl border border-slate-800"
                    />
                  )}
                  <div className="space-y-0.5">
                    <div className="text-[10px] uppercase font-mono text-slate-500">WALKATHAWA.COM</div>
                    <div className="text-xs font-bold text-white line-clamp-1">{settings.siteName}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-2">{settings.metaDescription}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- SUBTAB: SITE IDENTITY --- */}
        {activeSubTab === 'general' && (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-indigo-400" />
              <span>Publication & Brand Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Primary Publication Name
                </label>
                <input
                  type="text"
                  required
                  value={settings.siteName}
                  onChange={(e) => setSettings((prev) => ({ ...prev, siteName: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Sinhala Alternate Name (Schema.org)
                </label>
                <input
                  type="text"
                  value={settings.alternateName || 'වල් කතාව'}
                  onChange={(e) => setSettings((prev) => ({ ...prev, alternateName: e.target.value }))}
                  placeholder="වල් කතාව"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Brand Tagline
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings((prev) => ({ ...prev, tagline: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Logo Path or URL</span>
                </label>
                <input
                  type="text"
                  value={settings.logo}
                  onChange={(e) => setSettings((prev) => ({ ...prev, logo: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Editorial Contact Email</span>
                </label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings((prev) => ({ ...prev, contactEmail: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* --- SUBTAB: ANALYTICS & VERIFICATION --- */}
        {activeSubTab === 'analytics' && (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Google Analytics & Search Console Integration</span>
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google Analytics 4 Measurement ID</span>
                </label>
                <input
                  type="text"
                  value={settings.googleAnalyticsId || ''}
                  onChange={(e) => setSettings((prev) => ({ ...prev, googleAnalyticsId: e.target.value.trim() }))}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-indigo-300 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter your GA4 Measurement ID to track real-time reader traffic, story pageviews, and bounce rates.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Google Search Console Verification Code</span>
                </label>
                <input
                  type="text"
                  value={settings.searchConsoleVerification || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, searchConsoleVerification: e.target.value.trim() }))
                  }
                  placeholder="e.g. 4vJ9mK8xY2Lz1nP0..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Paste the verification token provided by Google Search Console to claim and verify site ownership.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- SUBTAB: SITEMAP & ROBOTS --- */}
        {activeSubTab === 'tools' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-indigo-400" />
                  <span>XML Sitemap</span>
                </h3>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
                >
                  <span>View Live</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-400">
                Automatically generated XML sitemap indexing all published Sinhala stories, categories, and tags.
              </p>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between font-mono text-xs text-slate-300">
                <span>/sitemap.xml</span>
                <button
                  type="button"
                  onClick={() => handleCopy(`${window.location.origin}/sitemap.xml`, 'sitemap')}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedItem === 'sitemap' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="text-[11px] text-slate-500">
                Submit this URL to Google Search Console to expedite indexation of new Sinhala stories.
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-emerald-400" />
                  <span>Robots.txt</span>
                </h3>
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
                >
                  <span>View Live</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-400">
                Directs search engine crawlers to public story routes while shielding admin workspaces.
              </p>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between font-mono text-xs text-slate-300">
                <span>/robots.txt</span>
                <button
                  type="button"
                  onClick={() => handleCopy(`${window.location.origin}/robots.txt`, 'robots')}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedItem === 'robots' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="text-[11px] text-slate-500">
                Configured with <code className="text-indigo-400 font-mono">Allow: /</code> and protected{' '}
                <code className="text-rose-400 font-mono">Disallow: /admin</code>.
              </div>
            </div>
          </div>
        )}

        {/* Submit Bar */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving & Deploying...' : 'Save & Deploy SEO Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
