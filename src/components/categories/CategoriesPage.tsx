import React, { useState } from 'react';
import {
  BookOpen,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  Heart,
  Users,
  GraduationCap,
  Briefcase,
  Home,
  Flame,
  Sparkles,
  MapPin,
  Compass,
  Smile,
  ShieldAlert,
  MessageCircle,
  Tv,
  Clock,
  TrendingUp,
  Bookmark
} from 'lucide-react';
import { Category } from '../../types/story';
import { cleanCategoryBadgeName } from '../../utils/formatters';

interface CategoriesPageProps {
  categories: Category[];
  onSelectCategory: (categorySlug: string) => void;
  onNavigateHome: () => void;
}

// Icon mapping helper for categories
function getCategoryIcon(slug: string) {
  switch (slug) {
    case 'all':
      return <BookOpen className="w-5 h-5 text-rose-500" />;
    case 'wife':
      return <Heart className="w-5 h-5 text-pink-500" />;
    case 'akka-malli':
      return <Users className="w-5 h-5 text-indigo-500" />;
    case 'nanda':
      return <Flame className="w-5 h-5 text-amber-500" />;
    case 'school':
      return <GraduationCap className="w-5 h-5 text-emerald-500" />;
    case 'romantic':
      return <Sparkles className="w-5 h-5 text-purple-500" />;
    case 'office':
      return <Briefcase className="w-5 h-5 text-blue-500" />;
    case 'neighbour':
      return <Home className="w-5 h-5 text-teal-500" />;
    case 'series':
      return <Tv className="w-5 h-5 text-orange-500" />;
    case 'short-stories':
      return <Bookmark className="w-5 h-5 text-cyan-500" />;
    case 'boarding':
      return <Home className="w-5 h-5 text-lime-500" />;
    case 'travel':
      return <Compass className="w-5 h-5 text-sky-500" />;
    case 'family':
      return <Users className="w-5 h-5 text-amber-600" />;
    case 'true-story':
      return <ShieldAlert className="w-5 h-5 text-red-500" />;
    case 'mystery':
      return <MapPin className="w-5 h-5 text-violet-500" />;
    case 'chat':
      return <MessageCircle className="w-5 h-5 text-green-500" />;
    case 'fantasy':
      return <Sparkles className="w-5 h-5 text-fuchsia-500" />;
    case 'drama':
      return <Smile className="w-5 h-5 text-yellow-500" />;
    case 'classic':
      return <Clock className="w-5 h-5 text-slate-500" />;
    case 'popular':
      return <TrendingUp className="w-5 h-5 text-rose-600" />;
    default:
      return <FolderTree className="w-5 h-5 text-rose-500" />;
  }
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  categories,
  onSelectCategory,
  onNavigateHome,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFilter, setSearchFilter] = useState('');

  // 5 rows x 4 columns = 20 items per page
  const ITEMS_PER_PAGE = 20;

  // Filter categories by search term if provided
  const filteredCategories = categories.filter((cat) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase().trim();
    return (
      cat.name.toLowerCase().includes(term) ||
      (cat.description && cat.description.toLowerCase().includes(term)) ||
      cat.slug.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / ITEMS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const currentCategories = filteredCategories.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 animate-fadeIn">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        <button
          type="button"
          onClick={onNavigateHome}
          className="hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>මුල් පිටුව (Home)</span>
        </button>
        <span>/</span>
        <span className="text-slate-900 dark:text-slate-100 font-medium">කතා වර්ගීකරණ (Categories)</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400">
              <FolderTree className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                කතා වර්ගීකරණ (Categories)
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                ඔබ කැමති ඕනෑම වර්ගීකරණයක් තෝරා රසවත් සිංහල කතා පහසුවෙන් කියවන්න.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Search inside Categories */}
        <div className="w-full sm:w-72">
          <input
            type="search"
            value={searchFilter}
            onChange={(e) => {
              setSearchFilter(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="වර්ගීකරණය සොයන්න..."
            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Grid: 5 rows by 4 columns (20 items per page on large screens) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {currentCategories.map((category) => {
          const icon = getCategoryIcon(category.slug);
          const cleanName = cleanCategoryBadgeName(category.name);

          return (
            <div
              key={category.id || category.slug}
              onClick={() => onSelectCategory(category.slug)}
              className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-rose-500/50 dark:hover:border-rose-500/50 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
            >
              {/* Subtle accent hover background */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-bl-full pointer-events-none transition-transform duration-300 group-hover:scale-125" />

              <div>
                {/* Category Icon & Story Count */}
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-colors group-hover:bg-rose-50 dark:group-hover:bg-rose-950/40 group-hover:border-rose-200 dark:group-hover:border-rose-900/40">
                    {icon}
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-rose-100 dark:group-hover:bg-rose-950/60 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    {typeof category.storyCount === 'number' ? `${category.storyCount} කතා` : 'කියවන්න'}
                  </span>
                </div>

                {/* Category Titles */}
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-1">
                  {cleanName}
                </h2>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mt-0.5">
                  {category.name}
                </span>

                {/* Category Description */}
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                  {category.description || 'මෙම වර්ගීකරණය යටතේ ඇති නවතම සිංහල කතා කියවන්න.'}
                </p>
              </div>

              {/* Action Link Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400">
                <span>කතා බලන්න</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {currentCategories.length === 0 && (
        <div className="text-center py-16 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <FolderTree className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">කිසිදු වර්ගීකරණයක් හමු නොවීය</h3>
          <p className="text-sm text-slate-500 mt-1">කරුණාකර වෙනත් සෙවුම් පදයක් භාවිතා කරන්න.</p>
          <button
            type="button"
            onClick={() => setSearchFilter('')}
            className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            සියල්ල පෙන්වන්න
          </button>
        </div>
      )}

      {/* Pagination Controls (5 rows by 4 columns = 20 items per page) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            disabled={activePage <= 1}
            onClick={() => {
              setCurrentPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>පෙර පිටුව</span>
          </button>

          <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
            පිටුව {activePage} / {totalPages} (එක් පිටුවකට වර්ග 20ක්)
          </span>

          <button
            type="button"
            disabled={activePage >= totalPages}
            onClick={() => {
              setCurrentPage((p) => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <span>මීළඟ පිටුව</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
