import React from 'react';
import { ArrowLeft, BookOpen, ChevronRight, Grid } from 'lucide-react';
import { Category } from '../../types/story';

interface CategoriesPageProps {
  categories: Category[];
  onSelectCategory: (catSlug: string) => void;
  onNavigateHome: () => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  categories,
  onSelectCategory,
  onNavigateHome,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header & Back */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          මුල් පිටුවට (Home)
        </button>
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <Grid className="w-3.5 h-3.5" />
          කතා වර්ගීකරණය
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          සියලු කතා වර්ගීකරණ (All Categories)
        </h1>
        <p className="text-sm text-slate-400">
          ඔබ කැමති ශානරය තෝරාගෙන ඒ යටතේ ඇති සියලුම සිංහල කතා පහසුවෙන් කියවන්න.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-4">
        {categories.map((cat) => (
          <div
            key={cat.id || cat.slug}
            onClick={() => onSelectCategory(cat.slug || cat.id)}
            className="group p-6 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-rose-950/20 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                {cat.storyCount ? (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
                    {cat.storyCount} කතා
                  </span>
                ) : null}
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-100 group-hover:text-rose-400 transition-colors">
                  {cat.sinhalaName || cat.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {cat.description || `${cat.name} කාණ්ඩයට අදාළ රසවත් කතා`}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-rose-400 font-medium">
              <span>කතා කියවන්න</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
