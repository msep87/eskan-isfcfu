import {
  StudentPortalColorKey,
  StudentPortalIconKey,
  StudentPortalLink,
} from '../types';

export const DEFAULT_STUDENT_PORTALS: StudentPortalLink[] = [
  {
    id: 'golestan',
    title: 'سامانه گلستان دانشگاه فرهنگیان',
    category: 'امور آموزشی',
    description:
      'سامانه جامع آموزشی دانشگاه فرهنگیان جهت انتخاب واحد، مشاهده برنامه کلاسی، کارنامه، ثبت درخواست‌های آموزشی و ارزشیابی اساتید.',
    url: 'https://education.cfu.ac.ir/',
    displayUrl: 'education.cfu.ac.ir',
    ctaLabel: 'ورود به سامانه گلستان',
    iconKey: 'graduation',
    colorKey: 'teal',
    isActive: true,
    order: 1,
  },
  {
    id: 'colinan',
    title: 'سامانه کالینان دانشگاه فرهنگیان شهید باهنر اصفهان',
    category: 'تغذیه و سلف',
    description:
      'سامانه رزرو و مدیریت تغذیه، شارژ اعتبار سلف، انتخاب وعده‌های غذایی و پیگیری امور تغذیه پردیس شهید باهنر اصفهان.',
    url: 'https://t1420.cfu.ac.ir/',
    displayUrl: 't1420.cfu.ac.ir',
    ctaLabel: 'ورود به سامانه کالینان',
    iconKey: 'dining',
    colorKey: 'amber',
    isActive: true,
    order: 2,
  },
  {
    id: 'eitaa',
    title: 'کانال اطلاع‌رسانی دانشگاه فرهنگیان شهید باهنر اصفهان (ایتا)',
    category: 'اطلاع‌رسانی رسمی',
    description:
      'کانال رسمی دانشگاه فرهنگیان شهید باهنر اصفهان در پیام‌رسان ایتا برای دریافت فوری اخبار، اطلاعیه‌ها و بخشنامه‌های دانشجویی.',
    url: 'https://eitaa.com/isfcfu',
    displayUrl: 'eitaa.com/isfcfu',
    ctaLabel: 'ورود به کانال رسمی در ایتا',
    iconKey: 'megaphone',
    colorKey: 'sky',
    isActive: true,
    order: 3,
  },
  {
    id: 'hadaf',
    title: 'سامانه هدف (هوشمندسازی دانشگاه فرهنگیان)',
    category: 'هوشمندسازی دانشگاه',
    description:
      'درگاه یکپارچه هوشمندسازی دانشگاه فرهنگیان شامل زیرسامانه‌های مختلف اداری و دانشجویی از جمله سامانه سجداد (سامانه جامع درآمدهای اختصاصی).',
    url: 'https://hadaf.cfu.ac.ir/',
    displayUrl: 'hadaf.cfu.ac.ir',
    ctaLabel: 'ورود به سامانه هدف',
    iconKey: 'cpu',
    colorKey: 'indigo',
    isActive: true,
    order: 4,
  },
  {
    id: 'sajdad',
    title: 'سامانه سجداد (سامانه جامع درآمدهای اختصاصی)',
    category: 'زیرسامانه هدف • مالی و پرداخت',
    description:
      'ورود مستقیم به سامانه سجداد (از زیرسامانه‌های سامانه هدف) ویژه پرداخت‌ها، ثبت درخواست‌ها و خدمات درآمدهای اختصاصی دانشگاه فرهنگیان.',
    url: 'https://hadaf.cfu.ac.ir/Pages/Sajdad/Public/Default.aspx',
    displayUrl: 'hadaf.cfu.ac.ir/Pages/Sajdad',
    ctaLabel: 'ورود مستقیم به سامانه سجداد',
    iconKey: 'landmark',
    colorKey: 'emerald',
    isActive: true,
    order: 5,
  },
];

export function normalizePortalUrl(rawUrl: string): string {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return '';
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return '';
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return parsed.href;
  } catch {
    return '';
  }
}

export function deriveDisplayUrl(rawUrl: string): string {
  const safe = normalizePortalUrl(rawUrl);
  if (!safe) return rawUrl.trim();
  return safe.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

export function resolveStudentPortals(portals?: StudentPortalLink[]): StudentPortalLink[] {
  const source = Array.isArray(portals) ? portals : DEFAULT_STUDENT_PORTALS;
  return source
    .filter((p) => p && typeof p.title === 'string' && p.title.trim().length > 0)
    .map((p, idx) => {
      const safeUrl = normalizePortalUrl(p.url) || p.url;
      return {
        ...p,
        id: p.id || `portal_${idx + 1}`,
        title: p.title.trim(),
        category: (p.category || 'سامانه دانشگاهی').trim(),
        description: (p.description || '').trim(),
        url: safeUrl,
        displayUrl: (p.displayUrl || '').trim() || deriveDisplayUrl(safeUrl),
        ctaLabel: (p.ctaLabel || '').trim() || `ورود به ${p.title.trim()}`,
        iconKey: p.iconKey || 'globe',
        colorKey: p.colorKey || 'teal',
        isActive: p.isActive !== false,
        order: typeof p.order === 'number' ? p.order : idx + 1,
      };
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export const PORTAL_COLOR_STYLES: Record<
  StudentPortalColorKey,
  {
    label: string;
    swatch: string;
    accentWrap: string;
    badgeCls: string;
    btnCls: string;
  }
> = {
  teal: {
    label: 'فیروزه‌ای (آموزشی)',
    swatch: 'bg-teal-600',
    accentWrap: 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    badgeCls: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
    btnCls: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20',
  },
  amber: {
    label: 'کهربایی (تغذیه و رفاهی)',
    swatch: 'bg-amber-600',
    accentWrap: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    badgeCls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    btnCls: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
  },
  sky: {
    label: 'آبی آسمانی (اطلاع‌رسانی)',
    swatch: 'bg-sky-600',
    accentWrap: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    badgeCls: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
    btnCls: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20',
  },
  indigo: {
    label: 'نیلی (هوشمندسازی)',
    swatch: 'bg-indigo-600',
    accentWrap: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    badgeCls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
    btnCls: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20',
  },
  emerald: {
    label: 'زمردی (مالی و پرداخت)',
    swatch: 'bg-emerald-600',
    accentWrap: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    badgeCls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    btnCls: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
  },
  cyan: {
    label: 'فیروزه‌ای روشن (پورتال وب)',
    swatch: 'bg-cyan-600',
    accentWrap: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    badgeCls: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300',
    btnCls: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-600/20',
  },
  violet: {
    label: 'بنفش (فرهنگی و پژوهش)',
    swatch: 'bg-violet-600',
    accentWrap: 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
    badgeCls: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
    btnCls: 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/20',
  },
  rose: {
    label: 'قرمز گلی (مهم و ویژه)',
    swatch: 'bg-rose-600',
    accentWrap: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    badgeCls: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    btnCls: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20',
  },
};

export const PORTAL_ICON_OPTIONS: Array<{ key: StudentPortalIconKey; label: string }> = [
  { key: 'graduation', label: 'کلاه فارغ‌التحصیلی (آموزش)' },
  { key: 'dining', label: 'تغذیه و سلف' },
  { key: 'megaphone', label: 'اطلاع‌رسانی و کانال' },
  { key: 'cpu', label: 'هوشمندسازی و فناوری' },
  { key: 'landmark', label: 'بانکی و مالی' },
  { key: 'globe', label: 'وب‌سایت و درگاه اینترنتی' },
  { key: 'book', label: 'کتابخانه و پژوهش' },
  { key: 'wallet', label: 'پرداخت و کیف پول' },
  { key: 'building', label: 'ساختمان و سراها' },
  { key: 'shield', label: 'امنیت و احراز هویت' },
  { key: 'calendar', label: 'تقویم و برنامه‌ریزی' },
  { key: 'link', label: 'پیوند عمومی' },
];
