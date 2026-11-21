/**
 * موتور کامل و دقیق تقویم شمسی (جلالی) و تبدیل ساعت/دقیقه بدون نیاز به کتابخانه خارجی
 * الگوریتم استاندارد تبدیل میلادی <-> جلالی (سازگار با سال‌های کبیسه ۱۳۰۰ تا ۱۵۰۰)
 */

export const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

export const PERSIAN_WEEKDAY_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const;

export const PERSIAN_WEEKDAY_FULL = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
] as const;

export interface JalaliDate {
  jy: number;
  jm: number; // 1..12
  jd: number; // 1..31
}

export interface TimeValue {
  hour: number; // 0..23
  minute: number; // 0..59
}

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toEnglishDigits(input: string): string {
  return String(input || '')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)] ?? d);
}

export function formatDigits(input: string | number, digits: 'fa' | 'en' = 'fa'): string {
  const str = String(input);
  return digits === 'fa' ? toPersianDigits(str) : toEnglishDigits(str);
}

function div(a: number, b: number): number {
  return ~~(a / b);
}

function mod(a: number, b: number): number {
  return a - ~~(a / b) * b;
}

const JALALI_BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394,
  2456, 3178,
];

function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const bl = JALALI_BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = JALALI_BREAKS[0];
  let jm = 0;
  let jump = 0;

  for (let i = 1; i < bl; i += 1) {
    jm = JALALI_BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) {
    leapJ += 1;
  }

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) {
    n = n - jump + div(jump + 4, 33) * 33;
  }
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) {
    leap = 4;
  }

  return { leap, gy, march };
}

function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number): JalaliDate {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      const jm = 1 + div(k, 31);
      const jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  const jm = 7 + div(k, 30);
  const jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}

export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  return d2j(g2d(gy, gm, gd));
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  return d2g(j2d(jy, jm, jd));
}

export function isJalaliLeapYear(jy: number): boolean {
  return jalCal(jy).leap === 0;
}

export function getJalaliMonthDays(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

/**
 * روز هفته اولین روز ماه جلالی:
 * 0 = شنبه ، 1 = یکشنبه ، 2 = دوشنبه ، 3 = سه‌شنبه ، 4 = چهارشنبه ، 5 = پنجشنبه ، 6 = جمعه
 */
export function getJalaliMonthStartWeekday(jy: number, jm: number): number {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, 1);
  const jsDay = new Date(gy, gm - 1, gd).getDay(); // 0=Sun .. 6=Sat
  return (jsDay + 1) % 7;
}

export function getTodayJalali(): JalaliDate {
  const now = new Date();
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function getNowTime(): TimeValue {
  const now = new Date();
  return { hour: now.getHours(), minute: now.getMinutes() };
}

export function isValidJalaliDate(jy: number, jm: number, jd: number): boolean {
  if (!Number.isInteger(jy) || !Number.isInteger(jm) || !Number.isInteger(jd)) return false;
  if (jy < 1250 || jy > 1550) return false;
  if (jm < 1 || jm > 12) return false;
  const maxDay = getJalaliMonthDays(jy, jm);
  return jd >= 1 && jd <= maxDay;
}

export function formatJalaliDate(
  jy: number,
  jm: number,
  jd: number,
  digits: 'fa' | 'en' = 'fa'
): string {
  const raw = `${String(jy).padStart(4, '0')}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
  return formatDigits(raw, digits);
}

export function parseJalaliDate(value: string): JalaliDate | null {
  const clean = toEnglishDigits(value || '').trim();
  if (!clean) return null;
  const match = clean.match(/^(\d{4})[\/\-.\s](\d{1,2})[\/\-.\s](\d{1,2})$/);
  if (!match) return null;
  const jy = parseInt(match[1], 10);
  const jm = parseInt(match[2], 10);
  const jd = parseInt(match[3], 10);
  if (!isValidJalaliDate(jy, jm, jd)) return null;
  return { jy, jm, jd };
}

export function formatTimeString(
  hour: number,
  minute: number,
  digits: 'fa' | 'en' = 'fa'
): string {
  const h = Math.max(0, Math.min(23, Math.floor(hour)));
  const m = Math.max(0, Math.min(59, Math.floor(minute)));
  const raw = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return formatDigits(raw, digits);
}

export function parseTimeString(value: string): TimeValue | null {
  const clean = toEnglishDigits(value || '').trim();
  if (!clean) return null;
  const match = clean.match(/(\d{1,2})\s*[:：]\s*(\d{1,2})/);
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export function parseTimeRangeString(
  value: string
): { start: TimeValue; end: TimeValue } | null {
  const clean = toEnglishDigits(value || '').trim();
  if (!clean) return null;
  const matches = [...clean.matchAll(/(\d{1,2})\s*[:：]\s*(\d{1,2})/g)];
  if (matches.length < 2) return null;
  const sh = parseInt(matches[0][1], 10);
  const sm = parseInt(matches[0][2], 10);
  const eh = parseInt(matches[1][1], 10);
  const em = parseInt(matches[1][2], 10);
  if (
    sh < 0 || sh > 23 || sm < 0 || sm > 59 ||
    eh < 0 || eh > 23 || em < 0 || em > 59
  ) {
    return null;
  }
  return {
    start: { hour: sh, minute: sm },
    end: { hour: eh, minute: em },
  };
}

export function formatTimeRangeString(
  start: TimeValue,
  end: TimeValue,
  digits: 'fa' | 'en' = 'fa'
): string {
  return `${formatTimeString(start.hour, start.minute, digits)} الی ${formatTimeString(end.hour, end.minute, digits)}`;
}

export function splitJalaliDateTime(value: string): { datePart: string; timePart: string } {
  const raw = (value || '').trim();
  if (!raw) return { datePart: '', timePart: '' };
  const eng = toEnglishDigits(raw);
  const dateMatch = eng.match(/(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/);
  const timeMatch = eng.match(/(\d{1,2}:\d{1,2})/);
  return {
    datePart: dateMatch ? dateMatch[1] : raw,
    timePart: timeMatch ? timeMatch[1] : '',
  };
}

export type JalaliDayOfWeekKey =
  | 'saturday'
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday';

const DAY_KEYS_BY_INDEX: JalaliDayOfWeekKey[] = [
  'saturday',
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
];

/**
 * محاسبه کلید روز هفته (saturday..friday) برای یک تاریخ شمسی مشخص
 */
export function getJalaliDayOfWeekKey(jy: number, jm: number, jd: number): JalaliDayOfWeekKey {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  const jsDay = new Date(gy, gm - 1, gd).getDay(); // 0=Sun..6=Sat
  const idx = (jsDay + 1) % 7; // 0=Sat..6=Fri
  return DAY_KEYS_BY_INDEX[idx];
}

export function getJalaliWeekdayLabelFromDate(dateStr: string): string {
  const parsed = parseJalaliDate(dateStr);
  if (!parsed) return '';
  const { gy, gm, gd } = jalaliToGregorian(parsed.jy, parsed.jm, parsed.jd);
  const jsDay = new Date(gy, gm - 1, gd).getDay();
  const idx = (jsDay + 1) % 7;
  return PERSIAN_WEEKDAY_FULL[idx] || '';
}

/**
 * اضافه کردن N روز به یک تاریخ شمسی (مثلاً +1 برای تاریخ روز بعد در شیفت ۲۴ ساعته)
 */
export function addDaysToJalaliDate(
  dateStr: string,
  daysToAdd: number,
  digits: 'fa' | 'en' = 'fa'
): string {
  const parsed = parseJalaliDate(dateStr);
  if (!parsed) return '';
  const { gy, gm, gd } = jalaliToGregorian(parsed.jy, parsed.jm, parsed.jd);
  const next = new Date(gy, gm - 1, gd + daysToAdd);
  const nextJ = gregorianToJalali(next.getFullYear(), next.getMonth() + 1, next.getDate());
  return formatJalaliDate(nextJ.jy, nextJ.jm, nextJ.jd, digits);
}

/**
 * استخراج کلید ماه شمسی به فرمت استاندارد انگلیسی YYYY/MM (مثلاً 1405/08)
 */
export function getJalaliMonthKey(dateStr?: string): string {
  if (!dateStr) return '';
  const parsed = parseJalaliDate(dateStr);
  if (!parsed) return '';
  return `${String(parsed.jy).padStart(4, '0')}/${String(parsed.jm).padStart(2, '0')}`;
}

/**
 * محاسبه طول شیفت بر حسب ساعت (با پشتیبانی از شیفت ۲۴ ساعته کامل مثل ۰۷:۰۰ تا ۰۷:۰۰ روز بعد)
 */
export function calculateShiftDurationHours(
  startTime?: string,
  endTime?: string,
  endsNextDay?: boolean
): number | null {
  const s = parseTimeString(startTime || '');
  const e = parseTimeString(endTime || '');
  if (!s || !e) return null;
  const startMin = s.hour * 60 + s.minute;
  let endMin = e.hour * 60 + e.minute;
  if (endsNextDay || endMin <= startMin) {
    endMin += 24 * 60;
  }
  const diffMin = endMin - startMin;
  return Math.round((diffMin / 60) * 10) / 10;
}

