import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <nav
      id="pagination-nav"
      aria-label="Stories pagination"
      className={`flex items-center justify-center gap-1.5 py-6 ${className}`}
    >
      {currentPage > 1 ? (
        <a
          href={`/?page=${currentPage - 1}`}
          id="pagination-prev-btn"
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey) {
              e.preventDefault();
              onPageChange(currentPage - 1);
            }
          }}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </a>
      ) : (
        <span
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-700 opacity-40 cursor-not-allowed text-sm"
          aria-hidden="true"
        >
          <ChevronLeft className="w-4 h-4" />
        </span>
      )}

      {pages.map((p, idx) => {
        if (p === '...') {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm"
            >
              ...
            </span>
          );
        }

        const pageNum = Number(p);
        const isActive = pageNum === currentPage;

        return (
          <a
            key={`page-${pageNum}`}
            href={`/?page=${pageNum}`}
            id={`pagination-page-${pageNum}`}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                onPageChange(pageNum);
              }
            }}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
              isActive
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {pageNum}
          </a>
        );
      })}

      {currentPage < totalPages ? (
        <a
          href={`/?page=${currentPage + 1}`}
          id="pagination-next-btn"
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey) {
              e.preventDefault();
              onPageChange(currentPage + 1);
            }
          }}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </a>
      ) : (
        <span
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-700 opacity-40 cursor-not-allowed text-sm"
          aria-hidden="true"
        >
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </nav>
  );
};
