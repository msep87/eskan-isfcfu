import React, { useMemo } from 'react';
import { PersianDatePicker } from './PersianDatePicker';
import { PersianTimePicker } from './PersianTimePicker';
import {
  splitJalaliDateTime,
  formatDigits,
} from '../utils/jalaliCalendar';

export interface PersianDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  datePlaceholder?: string;
  timePlaceholder?: string;
  inputClassName?: string;
  required?: boolean;
  disabled?: boolean;
  digits?: 'fa' | 'en';
}

/**
 * انتخابگر ترکیبی تاریخ شمسی (تقویم + تایپ دستی) و ساعت (انتخاب ساعت و دقیقه بدون تایپ)
 * خروجی استاندارد: "1405/07/01 - 08:00"
 */
export const PersianDateTimePicker: React.FC<PersianDateTimePickerProps> = ({
  value,
  onChange,
  datePlaceholder = '1405/07/01',
  timePlaceholder = '08:00',
  inputClassName = 'w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500',
  required = false,
  disabled = false,
  digits = 'en',
}) => {
  const { datePart, timePart } = useMemo(() => splitJalaliDateTime(value), [value]);

  const formattedDate = datePart ? formatDigits(datePart, digits) : '';
  const formattedTime = timePart ? formatDigits(timePart, digits) : '';

  const combine = (d: string, t: string) => {
    const cd = d.trim();
    const ct = t.trim();
    if (!cd && !ct) return '';
    if (cd && ct) return `${cd} - ${ct}`;
    return cd || ct;
  };

  return (
    <div className="grid grid-cols-12 gap-2">
      <div className="col-span-7">
        <PersianDatePicker
          value={formattedDate}
          onChange={(newDate) => onChange(combine(newDate, formattedTime))}
          placeholder={datePlaceholder}
          required={required}
          disabled={disabled}
          digits={digits}
          className={inputClassName}
        />
      </div>
      <div className="col-span-5">
        <PersianTimePicker
          value={formattedTime}
          onChange={(newTime) => onChange(combine(formattedDate, newTime))}
          placeholder={timePlaceholder}
          required={required}
          disabled={disabled}
          digits={digits}
          className={inputClassName}
        />
      </div>
    </div>
  );
};
