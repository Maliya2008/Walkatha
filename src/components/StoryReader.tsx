import React, { useState } from 'react';
import { ArrowLeft, Bookmark, Heart, Share2, Eye, Clock, User, Calendar, Check } from 'lucide-react';
import { Story } from '../types/story';

interface StoryReaderProps {
  story: Story;
  onBack: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onLike: () => void;
  hasLiked: boolean;
}

export const StoryReader: React.FC<StoryReaderProps> = ({
  story,
  onBack,
  isBookmarked,
  onToggleBookmark,
  onLike,
  hasLiked,
}) => {
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [copied, setCopied] = useState(false);

  const authorName = typeof story.author === 'string' ? story.author : story.author?.name || 'Walkathawa';

  const fontSizeClasses = {
    sm: 'text-base leading-relaxed',
    md: 'text-lg leading-loose',
    lg: 'text-xl leading-loose',
    xl: 'text-2xl leading-loose font-medium',
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>කතා ලැයිස්තුවට</span>
        </button>

        {/* Reader Controls */}
        <div className="flex items-center gap-2">
          {/* Font size control */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setFontSize('sm')}
              className={`px-2 py-1 rounded-lg transition-all ${fontSize === 'sm' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              title="කුඩා අකුරු"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('md')}
              className={`px-2 py-1 rounded-lg transition-all ${fontSize === 'md' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              title="මධ්‍යම අකුරු"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-2 py-1 rounded-lg transition-all ${fontSize === 'lg' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              title="විශාල අකුරු"
            >
              A+
            </button>
          </div>

          {/* Bookmark */}
          <button
            onClick={onToggleBookmark}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:bg-slate-800'
            }`}
            title={isBookmarked ? 'සුරැකුමෙන් ඉවත් කරන්න' : 'සුරකින්න'}
          >
            <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-800 transition-all cursor-pointer relative"
            title="බෙදාහරින්න"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Story Header */}
      <header className="mb-8 pb-6 border-b border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {story.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20"
            >
              #{tag}
            </span>
          ))}
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight leading-snug mb-4">
          {story.title}
        </h1>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-slate-400">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <User className="w-4 h-4 text-rose-400" />
            {authorName}
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <Calendar className="w-4 h-4" />
            {story.date || story.uploadDate || '2026'}
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <Clock className="w-4 h-4" />
            {story.readTime || '3 min'} කියවීමක්
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <Eye className="w-4 h-4" />
            {story.views} වාරයක්
          </span>
        </div>
      </header>

      {/* Story Content */}
      <main className={`bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 sm:p-10 mb-10 ${fontSizeClasses[fontSize]}`}>
        <div className="text-slate-200 whitespace-pre-line tracking-wide">
          {story.fullContent || story.content}
        </div>
      </main>

      {/* Footer Like & Feedback */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-semibold text-slate-100 text-base">ඔබ මේ කතාව රසවින්දාද?</h4>
          <p className="text-xs text-slate-400 mt-0.5">ඔබේ කැමැත්ත ප්‍රකාශ කර ලේඛකයා දිරිමත් කරන්න.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onLike}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              hasLiked
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                : 'bg-slate-800 hover:bg-rose-500/10 text-slate-200 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30'
            }`}
          >
            <Heart className="w-4 h-4" fill={hasLiked ? 'currentColor' : 'none'} />
            <span>{hasLiked ? 'කැමැත්ත පළ කළා' : 'කැමතියි'}</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-950/40">
              {story.likes || 0}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
