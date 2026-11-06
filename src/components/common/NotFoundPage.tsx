import React from 'react';

interface NotFoundPageProps {
  onGoHome: () => void;
  onBrowseCategories: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onGoHome,
  onBrowseCategories,
}) => {
  return (
    <div className="max-w-xl mx-auto py-12 text-center bg-white dark:bg-[#111a33] border border-slate-200 dark:border-[#1e2d52] rounded-lg p-8 space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        404 — පිටුව හමු නොවීය
      </h1>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
        ඔබ සොයන සිංහල වැල කතාව හෝ පිටුව වෙනත් ලිපිනයකට මාරු කර තිබිය හැක.
      </p>
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onGoHome}
          className="px-4 py-2 rounded-md bg-[#1e3a8a] text-white text-xs font-semibold cursor-pointer"
        >
          මුල් පිටුවට යන්න
        </button>
        <button
          type="button"
          onClick={onBrowseCategories}
          className="px-4 py-2 rounded-md border border-slate-200 dark:border-[#243763] text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
        >
          වර්ගීකරණ බලන්න
        </button>
      </div>
    </div>
  );
};
