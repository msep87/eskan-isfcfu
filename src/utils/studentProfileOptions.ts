import { CommuterEligibilityReason, Student } from '../types';

export interface OptionItem<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

export const COMMUTER_ELIGIBILITY_OPTIONS: OptionItem<CommuterEligibilityReason>[] = [
  {
    value: 'isfahan_suburbs_30km',
    label: 'ساکن شهر اصفهان یا حومه تا شعاع ۳۰ کیلومتر',
    description: 'محل سکونت دائمی دانشجو در شهر اصفهان یا مناطق حومه تا فاصله ۳۰ کیلومتری پردیس است.',
  },
  {
    value: 'married',
    label: 'متأهل',
    description: 'دانشجو دارای وضعیت تأهل ثبت‌شده است.',
  },
  {
    value: 'head_of_household',
    label: 'سرپرست خانوار',
    description: 'دانشجو عهده‌دار سرپرستی خانواده است.',
  },
  {
    value: 'special_case',
    label: 'موارد خاص (با ذکر توضیحات)',
    description: 'سایر شرایط ویژه پزشکی، خانوادگی یا اداری که در بخش توضیحات شرح داده می‌شود.',
  },
];

export const ARTISTIC_SKILL_OPTIONS: string[] = [
  'خوشنویسی و نستعلیق',
  'نقاشی و طراحی',
  'گرافیک و طراحی پوستر',
  'عکاسی',
  'فیلم‌سازی و تدوین',
  'تئاتر و نمایش',
  'شعر و نویسندگی',
  'گویندگی و اجرا',
  'تواشیح و هم‌خوانی',
  'مداحی و مرثیه‌سرایی',
  'سرود و موسیقی آوازی/سنتی',
  'صنایع دستی و کاردستی',
  'طراحی و صفحه‌آرایی',
];

export const CULTURAL_ACTIVITY_OPTIONS: string[] = [
  'قرائت و ترتیل قرآن',
  'حفظ قرآن کریم',
  'نهج‌البلاغه و مفاهیم دینی',
  'بسیج دانشجویی',
  'کانون‌های فرهنگی و هنری',
  'انجمن‌های علمی دانشجویی',
  'نشریات و روزنامه‌نگاری',
  'تولید محتوای رسانه‌ای و فضای مجازی',
  'اردوهای جهادی و فعالیت‌های خیریه',
  'هیئت مذهبی و برگزاری مراسم',
  'کتاب‌خوانی و نقد کتاب',
  'فعالیت‌های تربیتی و پرورشی مدارس',
];

export const SPORTS_ACTIVITY_OPTIONS: string[] = [
  'فوتسال',
  'فوتبال',
  'والیبال',
  'بسکتبال',
  'تنیس روی میز (پینگ‌پنگ)',
  'بدمینتون',
  'شطرنج',
  'شنا',
  'دو و میدانی',
  'کشتی و ورزش‌های رزمی',
  'بدنسازی و آمادگی جسمانی',
  'کوهنوردی و طبیعت‌گردی',
  'تیراندازی و دارت',
];

export const TECHNICAL_SKILL_OPTIONS: string[] = [
  'برنامه‌نویسی و طراحی وب',
  'نرم‌افزارهای آفیس (Word / Excel / PowerPoint)',
  'طراحی گرافیک (Photoshop / Illustrator)',
  'تدوین ویدیو و موشن‌گرافیک',
  'هوش مصنوعی و ابزارهای دیجیتال',
  'زبان انگلیسی (مکالمه / ترجمه)',
  'زبان عربی و ترجمه',
  'پژوهش و مقاله‌نویسی علمی',
  'کمک‌های اولیه و امدادگری',
  'تولید محتوای آموزشی و الکترونیکی',
];

export const PHYSICAL_CONDITION_OPTIONS: string[] = [
  'آسم یا مشکلات تنفسی',
  'دیابت',
  'بیماری قلبی یا فشار خون',
  'صرع یا سابقه تشنج',
  'کم‌خونی یا تالاسمی',
  'آلرژی فصلی یا پوستی',
  'حساسیت غذایی یا دارویی',
  'آسیب اسکلتی / کمردرد / زانودرد',
  'ضعف بینایی یا شنوایی',
  'میگرن یا سردرد مزمن',
];

export const MENTAL_HEALTH_TOPIC_OPTIONS: string[] = [
  'استرس و اضطراب تحصیلی',
  'سازگاری با محیط دانشگاه و دلتنگی خانواده',
  'مدیریت زمان و برنامه‌ریزی درسی',
  'مهارت‌های ارتباطی و روابط بین‌فردی',
  'مسائل خانوادگی یا اقتصادی',
  'افت انگیزه یا خلق پایین',
  'مشکلات خواب',
  'مسیر شغلی و هویت معلمی',
];

export const MARITAL_STATUS_LABELS: Record<'single' | 'married', string> = {
  single: 'مجرد',
  married: 'متأهل',
};

export const HOUSING_STATUS_LABELS: Record<
  'owned' | 'rented' | 'organizational' | 'relatives' | 'other',
  string
> = {
  owned: 'ملکی (شخصی)',
  rented: 'استیجاری',
  organizational: 'سازمانی',
  relatives: 'منزل اقوام / مشترک',
  other: 'سایر',
};

export const ECONOMIC_STATUS_LABELS: Record<'good' | 'moderate' | 'needs_support', string> = {
  good: 'مناسب',
  moderate: 'متوسط',
  needs_support: 'نیازمند حمایت و تسهیلات',
};

export const PHYSICAL_HEALTH_STATUS_LABELS: Record<
  'healthy' | 'needs_attention' | 'chronic_condition',
  string
> = {
  healthy: 'کاملاً سالم (بدون مشکل خاص)',
  needs_attention: 'دارای ملاحظه یا نیاز به مراقبت مقطعی',
  chronic_condition: 'دارای بیماری خاص / نیاز به مراقبت مستمر',
};

export const MENTAL_HEALTH_STATUS_LABELS: Record<
  'good' | 'mild_stress' | 'needs_counseling' | 'under_treatment',
  string
> = {
  good: 'مطلوب و متعادل',
  mild_stress: 'استرس یا فشار روانی خفیف',
  needs_counseling: 'نیازمند همراهی و مشاوره تخصصی',
  under_treatment: 'تحت نظر مشاور یا پزشک متخصص',
};

export function getCommuterReasonLabel(reason: CommuterEligibilityReason): string {
  return COMMUTER_ELIGIBILITY_OPTIONS.find((item) => item.value === reason)?.label || reason;
}

export function formatCommuterReasons(reasons?: CommuterEligibilityReason[]): string {
  if (!reasons || reasons.length === 0) return '';
  return reasons.map(getCommuterReasonLabel).join('، ');
}

export function joinSkillList(items?: string[], other?: string): string {
  const cleaned = [...(items || []).filter(Boolean)];
  const trimmedOther = (other || '').trim();
  if (trimmedOther) cleaned.push(trimmedOther);
  return cleaned.join('، ');
}

export function formatParentOccupation(alive?: boolean, occupation?: string): string {
  if (alive === false) return 'مرحوم (فوت شده)';
  const trimmed = (occupation || '').trim();
  if (trimmed) return trimmed;
  if (alive === true) return 'در قید حیات (ثبت نشده)';
  return 'ثبت نشده';
}

export function getStudentBloodType(student: Student): string {
  return (
    student.bloodType ||
    String(student.customFields?.['گروه خونی'] || '').trim() ||
    'ثبت نشده'
  );
}

export function getStudentSpecialConditionSummary(student: Student): string {
  const parts: string[] = [];
  if (student.physicalConditions && student.physicalConditions.length > 0) {
    parts.push(...student.physicalConditions);
  }
  const legacy = String(student.customFields?.['بیماری خاص'] || '').trim();
  if (legacy && legacy !== 'ندارد' && legacy !== '-' && legacy !== 'خیر' && !parts.includes(legacy)) {
    parts.push(legacy);
  }
  if (student.medicalDetails && student.medicalDetails.trim() && !parts.includes(student.medicalDetails.trim())) {
    parts.push(student.medicalDetails.trim());
  }
  return parts.length > 0 ? parts.join('، ') : 'ندارد';
}
