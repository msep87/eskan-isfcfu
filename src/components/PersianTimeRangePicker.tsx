import React, { useMemo } from 'react';
import { PersianTimePicker } from './PersianTimePicker';
import {
  parseTimeRangeString,
  formatTimeString,
  formatTimeRangeString,
  parseTimeString,
} from '../utils/jalaliCalendar';

export interface PersianTimeRangePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  digits?: 'fa' | 'en';
  defaultStart?: string;
  defaultEnd?: string;
}

/**
 * انتخابگر بازه زمانی (از ساعت ... الی ...) با انتخاب جداگانه ساعت و دقیقه شروع و پایان
 * بدون نیاز به تایپ کردن
 */
export const PersianTimeRangePicker: React.FC<PersianTimeRangePickerProps> = ({
  value,
  onChange,
  className = 'w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs',
  required = false,
  disabled = false,
  digits = 'fa',
  defaultStart = '۱۴:۰۰',
  defaultEnd = '۱۸:۰۰',
}) => {
  const parsedRange = useMemo(() => parseTimeRangeString(value), [value]);

  const startVal = parsedRange
    ? formatTimeString(parsedRange.start.hour, parsedRange.start.minute, digits)
    : '';
  const endVal = parsedRange
    ? formatTimeString(parsedRange.end.hour, parsedRange.end.minute, digits)
    : '';

  const handleStartChange = (newStart: string) => {
    if (!newStart && !endVal) {
      onChange('');
      return;
    }
    const s = parseTimeString(newStart) || parseTimeString(defaultStart) || { hour: 14, minute: 0 };
    const e = parsedRange?.end || parseTimeString(defaultEnd) || { hour: 18, minute: 0 };
    onChange(formatTimeRangeString(s, e, digits));
  };

  const handleEndChange = (newEnd: string) => {
    if (!newEnd && !startVal) {
      onChange('');
      return;
    }
    const s = parsedRange?.start || parseTimeString(defaultStart) || { hour: 14, minute: 0 };
    const e = parseTimeString(newEnd) || parseTimeString(defaultEnd) || { hour: 18, minute: 0 };
    onChange(formatTimeRangeString(s, e, digits));
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 min-w-0">
        <PersianTimePicker
          value={startVal}
          onChange={handleStartChange}
          placeholder={defaultStart}
          required={required}
          disabled={disabled}
          digits={digits}
          className={className}
        />
      </div>
      <span className="text-[11px] font-bold text-slate-400 shrink-0">الی</span>
      <div className="flex-1 min-w-0">
        <PersianTimePicker
          value={endVal}
          onChange={handleEndChange}
          placeholder={defaultEnd}
          required={required}
          disabled={disabled}
          digits={digits}
          className={className}
        />
      </div>
    </div>
  );
};
