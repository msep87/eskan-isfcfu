import React, { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { toPersianDigits } from '../utils/jalaliCalendar';

interface JalaliLiveClockBarProps {
  academicYear?: string;
  semester?: string;
  compact?: boolean;
  variant?: 'default' | 'compact' | 'ribbon';
}

function formatShamsiFullDate(date: Date): string {
  try {
    const weekday = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      weekday: 'long',
    }).format(date);
    const day = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      day: 'numeric',
    }).format(date);
    const month = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      month: 'long',
    }).format(date);
    const year = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
    }).format(date);
    return `${weekday}، ${day} ${month} ${year}`;
  } catch {
    return toPersianDigits(date.toLocaleDateString('fa-IR'));
  }
}

function formatShamsiNumericDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return toPersianDigits(date.toLocaleDateString('fa-IR'));
  }
}

function formatPersianTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return toPersianDigits(`${hh}:${mm}:${ss}`);
}

export const JalaliLiveClockBar: React.FC<JalaliLiveClockBarProps> = ({
  academicYear,
  semester,
  compact = false,
  variant,
}) => {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const fullDate = formatShamsiFullDate(now);
  const numericDate = formatShamsiNumericDate(now);
  const timeText = formatPersianTime(now);
  const resolvedVariant = variant || (compact ? 'compact' : 'default');

  if (resolvedVariant === 'ribbon') {
    return (
      <div
        className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-lg bg-white/15 backdrop-blur-xs border border-white/25 text-white text-[11px] font-bold shrink-0"
        aria-label="تاریخ شمسی و ساعت زنده"
      >
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          <Calendar className="w-3 h-3 text-amber-200 shrink-0" />
          <span>{fullDate}</span>
        </span>
        <span className="text-white/40">|</span>
        <span className="inline-flex items-center gap-1 font-mono font-extrabold text-amber-100 tabular-nums whitespace-nowrap" dir="ltr">
          <Clock className="w-3 h-3 text-amber-200 shrink-0" />
          <span>{timeText}</span>
        </span>
      </div>
    );
  }

  if (resolvedVariant === 'compact') {
    return (
      <div
        className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-xl bg-white/85 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 shadow-2xs text-[11px] text-slate-600 dark:text-slate-300"
        aria-label="تاریخ شمسی و ساعت زنده"
      >
        <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
          <Calendar className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>{fullDate}</span>
        </span>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <span className="inline-flex items-center gap-1 font-mono font-extrabold text-teal-700 dark:text-teal-300 tabular-nums" dir="ltr">
          <Clock className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>{timeText}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs text-xs">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-slate-700 dark:text-slate-200">
        <div className="inline-flex items-center gap-1.5 font-extrabold text-teal-800 dark:text-teal-300">
          <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>امروز: {fullDate}</span>
        </div>
        <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
        <span
          className="hidden sm:inline font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400"
          dir="ltr"
        >
          {numericDate}
        </span>
        {(academicYear || semester) && (
          <>
            <span className="hidden md:inline text-slate-300 dark:text-slate-600">•</span>
            <span className="hidden md:inline text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              سال تحصیلی {academicYear || '۱۴۰۵-۱۴۰۶'}
              {semester ? ` (${semester})` : ''}
            </span>
          </>
        )}
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/70 text-teal-800 dark:text-teal-200 font-black">
        <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
        <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300">ساعت:</span>
        <span className="font-mono text-xs sm:text-[13px] tracking-wider tabular-nums" dir="ltr">
          {timeText}
        </span>
      </div>
    </div>
  );
};
