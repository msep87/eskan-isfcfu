import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Clock, ChevronDown, Check, X } from 'lucide-react';
import {
  parseTimeString,
  formatTimeString,
  formatDigits,
  getNowTime,
} from '../utils/jalaliCalendar';

export interface PersianTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  required?: boolean;
  disabled?: boolean;
  digits?: 'fa' | 'en';
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const QUICK_MINUTES = [0, 15, 30, 45];

export const PersianTimePicker: React.FC<PersianTimePickerProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  wrapperClassName = '',
  required = false,
  disabled = false,
  digits = 'fa',
}) => {
  const parsed = useMemo(() => parseTimeString(value), [value]);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number>(() => parsed?.hour ?? 8);
  const [selectedMinute, setSelectedMinute] = useState<number>(() => parsed?.minute ?? 0);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; ready: boolean }>({
    top: 0,
    left: 0,
    ready: false,
  });

  const anchorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (parsed) {
      setSelectedHour(parsed.hour);
      setSelectedMinute(parsed.minute);
    }
  }, [parsed?.hour, parsed?.minute]);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const popWidth = 256;
    const popHeight = 330;
    const margin = 8;

    let top = rect.bottom + 6;
    if (top + popHeight > window.innerHeight - margin && rect.top - popHeight - 6 > margin) {
      top = rect.top - popHeight - 6;
    } else if (top + popHeight > window.innerHeight - margin) {
      top = Math.max(margin, window.innerHeight - popHeight - margin);
    }

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

    // اسکرول خودکار لیست ساعت و دقیقه به مقدار فعلی
    const timer = window.setTimeout(() => {
      const activeHourBtn = hourListRef.current?.querySelector<HTMLButtonElement>('[data-active="true"]');
      if (activeHourBtn && hourListRef.current) {
        hourListRef.current.scrollTop = Math.max(0, activeHourBtn.offsetTop - 72);
      }
      const activeMinBtn = minuteListRef.current?.querySelector<HTMLButtonElement>('[data-active="true"]');
      if (activeMinBtn && minuteListRef.current) {
        minuteListRef.current.scrollTop = Math.max(0, activeMinBtn.offsetTop - 72);
      }
    }, 20);

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
      window.clearTimeout(timer);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  const openPicker = () => {
    if (disabled) return;
    if (parsed) {
      setSelectedHour(parsed.hour);
      setSelectedMinute(parsed.minute);
    } else {
      const now = getNowTime();
      setSelectedHour(now.hour);
      setSelectedMinute(0);
    }
    setIsOpen(true);
  };

  const applyTime = (h: number, m: number) => {
    setSelectedHour(h);
    setSelectedMinute(m);
    onChange(formatTimeString(h, m, digits));
  };

  const handleSelectNow = () => {
    const now = getNowTime();
    applyTime(now.hour, now.minute);
    setIsOpen(false);
  };

  const displayText = value?.trim()
    ? parsed
      ? formatTimeString(parsed.hour, parsed.minute, digits)
      : value
    : '';

  const fallbackPlaceholder = placeholder || formatTimeString(8, 0, digits);

  return (
    <div ref={anchorRef} className={`relative ${wrapperClassName}`}>
      {/* ورودی مخفی برای اعتبارسنجی required فرم‌های HTML */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only pointer-events-none"
        />
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => (isOpen ? setIsOpen(false) : openPicker())}
        className={`${className} flex items-center justify-between gap-2 text-right cursor-pointer disabled:opacity-50`}
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
          <span
            dir="ltr"
            className={`font-mono font-bold truncate ${
              displayText
                ? 'text-slate-800 dark:text-slate-100'
                : 'text-slate-400 dark:text-slate-500 font-normal'
            }`}
          >
            {displayText || fallbackPlaceholder}
          </span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
            isOpen ? 'rotate-180 text-teal-600' : ''
          }`}
        />
      </button>

      {isOpen &&
        popoverPos.ready &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            dir="rtl"
            style={{ top: popoverPos.top, left: popoverPos.left, width: 256 }}
            className="fixed z-[9999] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-3 text-slate-800 dark:text-slate-100 select-none"
          >
            {/* نمایشگر ساعت انتخاب‌شده */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>انتخاب ساعت و دقیقه</span>
              </span>
              <span
                dir="ltr"
                className="px-2.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-mono text-sm font-extrabold tracking-wider"
              >
                {formatTimeString(selectedHour, selectedMinute, 'fa')}
              </span>
            </div>

            {/* دکمه‌های انتخاب سریع دقیقه */}
            <div className="flex items-center justify-between gap-1 mb-2.5">
              <span className="text-[10px] font-bold text-slate-400">دقیقه سریع:</span>
              <div className="flex items-center gap-1" dir="ltr">
                {QUICK_MINUTES.map((qm) => (
                  <button
                    key={qm}
                    type="button"
                    onClick={() => applyTime(selectedHour, qm)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition cursor-pointer ${
                      selectedMinute === qm
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-900/30'
                    }`}
                  >
                    :{formatDigits(String(qm).padStart(2, '0'), 'fa')}
                  </button>
                ))}
              </div>
            </div>

            {/* دو ستون قابل انتخاب ساعت و دقیقه */}
            <div className="grid grid-cols-2 gap-2" dir="ltr">
              {/* ستون ساعت */}
              <div className="flex flex-col">
                <div className="text-[11px] font-extrabold text-center text-slate-500 dark:text-slate-400 pb-1">
                  ساعت (۰۰ تا ۲۳)
                </div>
                <div
                  ref={hourListRef}
                  className="h-44 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-1 space-y-0.5"
                >
                  {HOURS.map((h) => {
                    const active = selectedHour === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        data-active={active ? 'true' : undefined}
                        onClick={() => applyTime(h, selectedMinute)}
                        className={`w-full py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                          active
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                        }`}
                      >
                        {formatDigits(String(h).padStart(2, '0'), 'fa')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ستون دقیقه */}
              <div className="flex flex-col">
                <div className="text-[11px] font-extrabold text-center text-slate-500 dark:text-slate-400 pb-1">
                  دقیقه (۰۰ تا ۵۹)
                </div>
                <div
                  ref={minuteListRef}
                  className="h-44 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-1 space-y-0.5"
                >
                  {MINUTES.map((m) => {
                    const active = selectedMinute === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        data-active={active ? 'true' : undefined}
                        onClick={() => applyTime(selectedHour, m)}
                        className={`w-full py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                          active
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                        }`}
                      >
                        {formatDigits(String(m).padStart(2, '0'), 'fa')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* دکمه‌های پایین */}
            <div className="flex items-center justify-between gap-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={handleSelectNow}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition cursor-pointer"
              >
                اکنون
              </button>

              <div className="flex items-center gap-1">
                {!required && value && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange('');
                      setIsOpen(false);
                    }}
                    className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition cursor-pointer"
                    title="پاک کردن"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    applyTime(selectedHour, selectedMinute);
                    setIsOpen(false);
                  }}
                  className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold inline-flex items-center gap-1 transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>تأیید</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
