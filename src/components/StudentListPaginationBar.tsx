import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface StudentListPaginationBarProps {
  totalItems: number;
  currentPage: number;
  pageSize: number | 'all';
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number | 'all') => void;
  itemLabel?: string;
  showPageSizeSelector?: boolean;
  compact?: boolean;
}

export const DEFAULT_STUDENT_PAGE_SIZE = 50;

export function getPaginationMeta(
  totalItems: number,
  currentPage: number,
  pageSize: number | 'all'
) {
  const effectivePageSize =
    pageSize === 'all' ? Math.max(1, totalItems) : Math.max(1, pageSize);
  const totalPages =
    pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = pageSize === 'all' ? 0 : (safePage - 1) * effectivePageSize;
  const endIndex =
    pageSize === 'all'
      ? totalItems
      : Math.min(totalItems, startIndex + effectivePageSize);

  return {
    effectivePageSize,
    totalPages,
    safePage,
    startIndex,
    endIndex,
  };
}

export function getPageNumberTokens(
  safePage: number,
  totalPages: number
): Array<number | string> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: Array<number | string> = [1];
  const left = Math.max(2, safePage - 1);
  const right = Math.min(totalPages - 1, safePage + 1);
  if (left > 2) pages.push('ellipsis-left');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push('ellipsis-right');
  pages.push(totalPages);
  return pages;
}

export const StudentListPaginationBar: React.FC<StudentListPaginationBarProps> = ({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'دانشجو',
  showPageSizeSelector = true,
  compact = false,
}) => {
  const { totalPages, safePage, startIndex, endIndex } = getPaginationMeta(
    totalItems,
    currentPage,
    pageSize
  );
  const pageTokens = getPageNumberTokens(safePage, totalPages);

  if (totalItems === 0 && !showPageSizeSelector) return null;

  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        compact ? 'px-3.5 py-2' : 'px-4 py-3'
      } rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs`}
    >
      <div className="flex flex-wrap items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
        {totalItems === 0 ? (
          <span>۰ {itemLabel}</span>
        ) : (
          <span>
            نمایش{' '}
            <span className="text-teal-700 dark:text-teal-300 font-black">
              {(startIndex + 1).toLocaleString('fa-IR')}
            </span>{' '}
            تا{' '}
            <span className="text-teal-700 dark:text-teal-300 font-black">
              {endIndex.toLocaleString('fa-IR')}
            </span>{' '}
            از{' '}
            <span className="font-black">
              {totalItems.toLocaleString('fa-IR')}
            </span>{' '}
            {itemLabel}
          </span>
        )}
        {pageSize !== 'all' && totalPages > 1 && (
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            (صفحه {safePage.toLocaleString('fa-IR')} از{' '}
            {totalPages.toLocaleString('fa-IR')})
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {showPageSizeSelector && (
          <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <span>تعداد در صفحه:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value;
                onPageSizeChange(val === 'all' ? 'all' : Number(val));
                onPageChange(1);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <option value={25}>۲۵ {itemLabel}</option>
              <option value={50}>۵۰ {itemLabel} (پیش‌فرض)</option>
              <option value={100}>۱۰۰ {itemLabel}</option>
              <option value={200}>۲۰۰ {itemLabel}</option>
              <option value={500}>۵۰۰ {itemLabel}</option>
              <option value="all">
                همه ({totalItems.toLocaleString('fa-IR')})
              </option>
            </select>
          </label>
        )}

        {totalPages > 1 && (
          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => onPageChange(1)}
              disabled={safePage <= 1}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
              title="صفحه اول"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, safePage - 1))}
              disabled={safePage <= 1}
              className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition inline-flex items-center gap-1 font-bold text-[11px]"
              title="صفحه قبلی"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>قبلی</span>
            </button>

            <div className="hidden sm:flex items-center gap-1">
              {pageTokens.map((item) =>
                typeof item === 'string' ? (
                  <span
                    key={item}
                    className="px-1.5 text-slate-400 select-none font-bold"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onPageChange(item)}
                    className={`min-w-[28px] h-7 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      item === safePage
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.toLocaleString('fa-IR')}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
              disabled={safePage >= totalPages}
              className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition inline-flex items-center gap-1 font-bold text-[11px]"
              title="صفحه بعدی"
            >
              <span>بعدی</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              disabled={safePage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
              title="صفحه آخر"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
