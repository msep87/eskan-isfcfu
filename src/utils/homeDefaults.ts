import React from 'react';
import { AppSettings, HomeNoteItem } from '../types';

export const DEFAULT_HOME_NOTES_TITLE =
  'نکات مهم انتخاب اتاق و اسکان در سراهای دانشگاه فرهنگیان اصفهان';

export const DEFAULT_HOME_NOTES: HomeNoteItem[] = [
  {
    id: 'note_1',
    title: '۱. احراز هویت اولیه:',
    body: 'دانشجومعلمان با شماره دانشجویی و کد ملی وارد سامانه شده و در اولین ورود اطلاعات تماس ضروری و تصویر پرسنلی خود را تکمیل می‌نمایند.',
  },
  {
    id: 'note_2',
    title: '۲. انتخاب هوشمند اتاق و تخت:',
    body: 'انتخاب تخت به صورت کاملاً تعاملی و بر اساس سهمیه رشته‌ها و ورودی‌ها انجام می‌پذیرد و مشخصات هم‌اتاقی‌ها قابل مشاهده است.',
  },
  {
    id: 'note_3',
    title: '۳. پشتیبانی و پیام مستقیم:',
    body: 'در صورت نیاز به جابجایی یا گزارش تأسیسات اتاق، ارسال پیام و تیکت مستقیم به سرپرست سرا از درون سامانه مقدور است.',
  },
];

export const HERO_PRESET_COLORS = [
  { label: 'فیروزه‌ای فرهنگیان', hex: '#0f766e' },
  { label: 'سرمه‌ای دانشگاهی', hex: '#1e3a8a' },
  { label: 'زمردی تیره', hex: '#065f46' },
  { label: 'لاجوردی عمیق', hex: '#0369a1' },
  { label: 'بنفش سلطنتی', hex: '#5b21b6' },
  { label: 'زرشکی رسمی', hex: '#9f1239' },
  { label: 'ذغالی مدرن', hex: '#1e293b' },
  { label: 'قهوه‌ای برنزی', hex: '#78350f' },
];

export function resolveHeroBannerStyle(settings: AppSettings): {
  bgClassName: string;
  style?: React.CSSProperties;
  hasImageOverlay: boolean;
} {
  const mode = settings.heroBgMode || 'default';

  if (mode === 'image' && settings.heroBgImageUrl) {
    return {
      bgClassName: 'bg-teal-900',
      style: {
        backgroundImage: `url("${settings.heroBgImageUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      },
      hasImageOverlay: true,
    };
  }

  if (mode === 'color' && settings.heroBgColor) {
    return {
      bgClassName: '',
      style: {
        backgroundColor: settings.heroBgColor,
      },
      hasImageOverlay: false,
    };
  }

  return {
    bgClassName: 'bg-gradient-to-r from-teal-800 via-teal-700 to-cyan-800',
    hasImageOverlay: false,
  };
}
