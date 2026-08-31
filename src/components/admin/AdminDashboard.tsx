import React, { useEffect, useState } from 'react';
import { BookOpen, Eye, CheckCircle, FileText, Megaphone, Plus, ArrowUpRight, TrendingUp, Sparkles } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { DashboardStats } from '../../types/admin';

interface AdminDashboardProps {
  onNavigate: (tab: 'stories' | 'new-story' | 'ads' | 'settings') => void;
  onEditStory: (storyId: string) => void;
  onViewPublicStory: (slug: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  onEditStory,
  onViewPublicStory,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-slate-800/60 rounded-2xl border border-slate-700/50" />
          ))}
        </div>
        <div className="h-64 bg-slate-800/40 rounded-2xl border border-slate-700/50" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700 text-center">
        <p className="text-rose-400 text-sm mb-4">{error || 'Unable to retrieve statistics'}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-serif flex items-center gap-2">
            <span>Publication Overview</span>
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytics, public story visibility, and Monetag ad revenue status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('new-story')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Story</span>
          </button>
        </div>
      </div>

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Stories */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Stories</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{stats.totalStories}</span>
            <span className="text-[10px] text-slate-400">items</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">In repository archive</div>
        </div>

        {/* Total Views */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Views</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">
              {stats.totalViews.toLocaleString()}
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 text-[11px] text-emerald-400/90 font-medium">Public readership traffic</div>
        </div>

        {/* Published Stories */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Published</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{stats.publishedStories}</span>
            <span className="text-[10px] text-emerald-400">Live</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">Visible to readers</div>
        </div>

        {/* Draft Stories */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Drafts</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{stats.draftStories}</span>
            <span className="text-[10px] text-amber-400">Unpublished</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">Work in progress</div>
        </div>

        {/* Monetag Ad Status */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monetag Ads</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <Megaphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                stats.adsEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {stats.adsEnabled ? 'ACTIVE (ON)' : 'DISABLED (OFF)'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {stats.adsPerPage} ads / page &bull; {stats.hasGlobalAdCode ? 'Tag Set' : 'No Tag'}
          </div>
        </div>
      </div>

      {/* Recent Uploads Section */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Recent Uploads</h2>
            <p className="text-xs text-slate-400">Latest story additions and publishing changes</p>
          </div>
          <button
            onClick={() => onNavigate('stories')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>View All Stories</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Views</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Uploaded</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {stats.recentUploads.map((story) => (
                <tr key={story.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-white line-clamp-1">{story.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">/story/{story.slug}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 capitalize text-[11px]">
                      {story.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {story.views.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    {story.published ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(story.uploadedDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onEditStory(story.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      {story.published && (
                        <button
                          onClick={() => onViewPublicStory(story.slug)}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors"
                          title="Open public reader"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
