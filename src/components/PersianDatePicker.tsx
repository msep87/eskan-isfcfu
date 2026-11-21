import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronRight, ChevronLeft, X } from 'lucide-react';
import {
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEKDAY_SHORT,
  getTodayJalali,
  getJalaliMonthDays,
  getJalaliMonthStartWeekday,
  parseJalaliDate,
  formatJalaliDate,
  formatDigits,
} from '../utils/jalaliCalendar';

export interface PersianDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  required?: boolean;
  disabled?: boolean;
  digits?: 'fa' | 'en';
  /** سال پیش‌فرض در صورت خالی بودن مقدار (مثلاً 1382 برای تاریخ تولد) */
  defaultYear?: number;
  minYear?: number;
  maxYear?: number;
  dir?: 'ltr' | 'rtl';
}

export const PersianDatePicker: React.FC<PersianDatePickerProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  wrapperClassName = '',
  required = false,
  disabled = false,
  digits = 'fa',
  defaultYear,
  minYear = 1330,
  maxYear = 1425,
  dir = 'ltr',
}) => {
  const today = useMemo(() => getTodayJalali(), []);
  const parsed = useMemo(() => parseJalaliDate(value), [value]);

  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(() => parsed?.jy ?? defaultYear ?? today.jy);
  const [viewMonth, setViewMonth] = useState<number>(() => parsed?.jm ?? (defaultYear ? 1 : today.jm));
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; ready: boolean }>({
    top: 0,
    left: 0,
    ready: false,
  });

  const anchorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // همگام‌سازی سال و ماه تقویم با مقدار واردشده دستی
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.jy);
      setViewMonth(parsed.jm);
    }
  }, [parsed?.jy, parsed?.jm]);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const popWidth = 296;
    const popHeight = 342;
    const margin = 8;

    let top = rect.bottom + 6;
    if (top + popHeight > window.innerHeight - margin && rect.top - popHeight - 6 > margin) {
      top = rect.top - popHeight - 6;
    } else if (top + popHeight > window.innerHeight - margin) {
      top = Math.max(margin, window.innerHeight - popHeight - margin);
    }

    // تراز از راست به چپ متناسب با المان ورودی
    let left = rect.right - popWidth;
    if (left < margin) left = margin;
    if (left + popWidth > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - popWidth - margin);
    }

    setPopoverPos({ top, left, ready: true });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = () => updatePosition();
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        anchorRef.current &&
        !anchorRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  const openCalendar = () => {
    if (disabled) return;
    if (parsed) {
      setViewYear(parsed.jy);
      setViewMonth(parsed.jm);
    } else if (defaultYear && !value.trim()) {
      setViewYear(defaultYear);
      setViewMonth(1);
    } else {
      setViewYear(today.jy);
      setViewMonth(today.jm);
    }
    setIsOpen(true);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      if (viewYear > minYear) {
        setViewYear((y) => y - 1);
        setViewMonth(12);
      }
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      if (viewYear < maxYear) {
        setViewYear((y) => y + 1);
        setViewMonth(1);
      }
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    onChange(formatJalaliDate(viewYear, viewMonth, day, digits));
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    setViewYear(today.jy);
    setViewMonth(today.jm);
    onChange(formatJalaliDate(today.jy, today.jm, today.jd, digits));
    setIsOpen(false);
  };

  const daysInMonth = getJalaliMonthDays(viewYear, viewMonth);
  const startWeekday = getJalaliMonthStartWeekday(viewYear, viewMonth);

  const yearsList = useMemo(() => {
    const arr: number[] = [];
    for (let y = maxYear; y >= minYear; y -= 1) {
      arr.push(y);
    }
    return arr;
  }, [minYear, maxYear]);

  const calendarCells = useMemo(() => {
    const cells: Array<number | null> = [];
    for (let i = 0; i < startWeekday; i += 1) cells.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
    return cells;
  }, [startWeekday, daysInMonth]);

  const effectivePlaceholder =
    placeholder || formatJalaliDate(defaultYear || today.jy, today.jm, today.jd, digits);

  return (
    <div ref={anchorRef} className={`relative ${wrapperClassName}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={() => {
          if (!isOpen && !disabled) openCalendar();
        }}
        onFocus={() => {
          if (!isOpen && !disabled) openCalendar();
        }}
        placeholder={effectivePlaceholder}
        required={required}
        disabled={disabled}
        dir={dir}
        autoComplete="off"
        className={`${className} pl-8 cursor-pointer focus:cursor-text`}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isOpen) setIsOpen(false);
          else openCalendar();
        }}
        title="باز کردن تقویم شمسی"
        aria-label="باز کردن تقویم شمسی"
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition cursor-pointer disabled:opacity-40"
      >
        <Calendar className="w-3.5 h-3.5" />
      </button>

      {isOpen &&
        popoverPos.ready &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            dir="rtl"
            style={{ top: popoverPos.top, left: popoverPos.left, width: 296 }}
            className="fixed z-[9999] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-3 text-slate-800 dark:text-slate-100 select-none"
          >
            {/* هدر انتخاب ماه و سال */}
            <div className="flex items-center justify-between gap-1.5 pb-2.5 mb-2 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="ماه قبل"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 flex-1 justify-center">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  aria-label="انتخاب ماه شمسی"
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-extrabold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  {PERSIAN_MONTH_NAMES.map((mName, idx) => (
                    <option key={mName} value={idx + 1}>
                      {mName}
                    </option>
                  ))}
                </select>

                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  aria-label="انتخاب سال شمسی"
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-extrabold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  {yearsList.map((yr) => (
                    <option key={yr} value={yr}>
                      {formatDigits(yr, 'fa')}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                title="ماه بعد"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* عناوین روزهای هفته */}
            <div className="grid grid-cols-7 gap-1 mb-1.5 text-center">
              {PERSIAN_WEEKDAY_SHORT.map((dayName, i) => (
                <div
                  key={dayName}
                  className={`text-[11px] font-extrabold py-1 ${
                    i === 6
                      ? 'text-rose-500 dark:text-rose-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* شبکه روزهای ماه */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-8" />;
                }
                const isToday =
                  viewYear === today.jy && viewMonth === today.jm && day === today.jd;
                const isSelected =
                  parsed !== null &&
                  parsed.jy === viewYear &&
                  parsed.jm === viewMonth &&
                  parsed.jd === day;
                const isFriday = idx % 7 === 6;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`h-8 w-full rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-500/30'
                        : isToday
                        ? 'bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500 font-extrabold hover:bg-teal-100 dark:hover:bg-teal-900/60'
                        : isFriday
                        ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {formatDigits(day, 'fa')}
                  </button>
                );
              })}
            </div>

            {/* پاورقی تقویم */}
            <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={handleSelectToday}
                className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 font-bold transition cursor-pointer"
              >
                امروز ({formatJalaliDate(today.jy, today.jm, today.jd, 'fa')})
              </button>

              <div className="flex items-center gap-1">
                {!required && value && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange('');
                      setIsOpen(false);
                    }}
                    className="px-2 py-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 font-bold transition cursor-pointer"
                  >
                    پاک کردن
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="بستن"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
