import React from 'react';
import { Category } from '../../types/story';

interface CategoriesPageProps {
  categories: Category[];
  onSelectCategory: (slug: string) => void;
  onBack: () => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  categories,
  onSelectCategory,
  onBack,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#111a33] border border-slate-200 dark:border-[#1e2d52] rounded-lg p-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            සිංහල වැල කතා වර්ගීකරණ (Story Categories)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            ඔබ කැමතිම වල් කතා සහ සිංහල වැල කතා වර්ගීකරණය තෝරා කියවන්න.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 dark:border-[#243763] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162347] cursor-pointer"
        >
          ← මුල් පිටුවට
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const slug = cat.slug || cat.id;
          return (
            <a
              key={cat.id}
              href={`/category/${encodeURIComponent(slug)}`}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  onSelectCategory(slug);
                }
              }}
              className="p-4 rounded-lg bg-white dark:bg-[#111a33] border border-slate-200 dark:border-[#1e2d52] hover:border-blue-600 dark:hover:border-blue-400 transition-colors block"
            >
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {cat.sinhalaName || cat.name}
                </h2>
                {cat.storyCount !== undefined && (
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    කතා {cat.storyCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {cat.description || `${cat.name} එකතුවෙන් අලුත්ම සිංහල කතා කියවන්න.`}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
};
