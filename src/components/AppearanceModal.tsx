import React, { useState } from 'react';
import { AppSettings, CustomFont } from '../types';
import { Palette, Type, Image as ImageIcon, X, Check, Upload, Trash2, Plus, AlertCircle, Percent, Sliders } from 'lucide-react';

interface AppearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const AppearanceModal: React.FC<AppearanceModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [newFontName, setNewFontName] = useState('');
  const [fontError, setFontError] = useState('');
  const [fontSuccess, setFontSuccess] = useState('');

  if (!isOpen) return null;

  const standardWallpapers = [
    { id: 'pattern-islamic', name: 'طرح اسلیمی و کاشی‌کاری اصفهان', preview: 'linear-gradient(135deg, #0d9488 0%, #083344 100%)' },
    { id: 'pattern-dots', name: 'الگوی مدرن هندسی', preview: 'radial-gradient(#0284c7 1px, transparent 1px)' },
    { id: 'gradient-teal', name: 'گرادیانت فیروزه‌ای فرهنگیان', preview: 'linear-gradient(to bottom right, #14b8a6, #0f766e)' },
    { id: 'gradient-navy', name: 'سرمه‌ای دانشگاهی', preview: 'linear-gradient(to bottom right, #1e3a8a, #0f172a)' },
    { id: 'gradient-emerald', name: 'زمردی پردیس سبز', preview: 'linear-gradient(to bottom right, #059669, #064e3b)' },
    { id: 'clean-slate', name: 'ساده و مینیمال (روشن)', preview: '#f8fafc' },
  ];

  const standardFonts = [
    { id: 'vazir', name: 'وزیرمتن (استاندارد وب و رسمی)' },
    { id: 'shabnam', name: 'شبنم (خوانا و نرم)' },
    { id: 'sahel', name: 'ساحل (کلاسیک و زیبا)' },
    { id: 'system', name: 'فونت پیش‌فرض سیستم' },
  ];

  const colorThemes = [
    { id: 'turquoise', name: 'فیروزه‌ای اصفهان', colorClass: 'bg-teal-600', ringClass: 'ring-teal-500' },
    { id: 'navy', name: 'سرمه‌ای دانشگاهی', colorClass: 'bg-blue-700', ringClass: 'ring-blue-600' },
    { id: 'emerald', name: 'سبز زمردی', colorClass: 'bg-emerald-600', ringClass: 'ring-emerald-500' },
    { id: 'violet', name: 'بنفش رویال', colorClass: 'bg-purple-600', ringClass: 'ring-purple-500' },
    { id: 'amber', name: 'کهربایی زرین', colorClass: 'bg-amber-600', ringClass: 'ring-amber-500' },
  ];

  const fontSizes = [
    { id: 'sm', name: 'کوچک و فشرده' },
    { id: 'md', name: 'متوسط و استاندارد' },
    { id: 'lg', name: 'بزرگ و خوانا' },
  ];

  // آپلود فونت جدید (TTF, WOFF, WOFF2, OTF)
  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFontError('');
    setFontSuccess('');

    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setFontError('حجم فایل فونت نباید بیشتر از ۸ مگابایت باشد.');
      return;
    }

    const ext = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase();
    let format = 'truetype';
    if (ext === 'woff') format = 'woff';
    else if (ext === 'woff2') format = 'woff2';
    else if (ext === 'otf') format = 'opentype';

    const displayName = newFontName.trim() || file.name.substring(0, file.name.lastIndexOf('.')) || 'فونت سفارشی';
    const fontId = `custom_font_${Date.now()}`;
    const fontCssFamily = `CF_${Date.now()}`;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        setFontError('خطا در خواندن فایل فونت.');
        return;
      }

      const newCustomFont: CustomFont = {
        id: fontId,
        name: displayName,
        fontFamily: fontCssFamily,
        dataUrl,
        format,
      };

      const existingFonts = settings.customFonts || [];
      const updatedFonts = [...existingFonts, newCustomFont];

      const updatedSettings: AppSettings = {
        ...settings,
        customFonts: updatedFonts,
        fontFamily: fontCssFamily, // فعال‌سازی بلافاصله
        activeCustomFontId: fontId,
      };

      onUpdateSettings(updatedSettings);
      setNewFontName('');
      setFontSuccess(`فونت «${displayName}» با موفقیت افزوده و فعال شد.`);
      setTimeout(() => setFontSuccess(''), 3000);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // حذف فونت سفارشی
  const handleDeleteCustomFont = (fontId: string, fontCssFamily: string) => {
    const existingFonts = settings.customFonts || [];
    const updatedFonts = existingFonts.filter((f) => f.id !== fontId);
    let newFontFamily = settings.fontFamily;
    if (settings.fontFamily === fontCssFamily) {
      newFontFamily = 'vazir';
    }

    onUpdateSettings({
      ...settings,
      customFonts: updatedFonts,
      fontFamily: newFontFamily,
      activeCustomFontId: undefined,
    });
  };

  // آپلود عکس پس‌زمینه سایت
  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('حجم عکس پس‌زمینه نباید بیشتر از ۵ مگابایت باشد.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onUpdateSettings({
        ...settings,
        customWallpaperUrl: dataUrl,
        wallpaper: 'custom',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // حذف عکس پس‌زمینه سفارشی
  const handleDeleteCustomWallpaper = () => {
    onUpdateSettings({
      ...settings,
      customWallpaperUrl: undefined,
      wallpaper: 'pattern-islamic',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">شخصی‌سازی نمای سامانه</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">افزودن فونت TTF، عکس پس‌زمینه اختصاصی، تم رنگی و اندازه قلم</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* تم رنگی */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4 text-teal-600" />
            تم رنگی سامانه
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {colorThemes.map((ct) => (
              <button
                key={ct.id}
                onClick={() => onUpdateSettings({ ...settings, colorTheme: ct.id as any })}
                className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-xs font-medium transition cursor-pointer ${
                  settings.colorTheme === ct.id
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className={`w-4 h-4 rounded-full ${ct.colorClass} shadow-sm shrink-0`} />
                <span className="truncate">{ct.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* انتخاب و افزودن فونت (TTF / WOFF) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Type className="w-4 h-4 text-teal-600" />
              <span>فونت متن سامانه (نامحدود با امکان افزودن TTF)</span>
            </label>
            <span className="text-[11px] text-teal-600 dark:text-teal-400 font-bold">
              {(settings.customFonts?.length || 0) + standardFonts.length} فونت در دسترس
            </span>
          </div>

          {/* لیست فونت‌های استاندارد */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {standardFonts.map((f) => (
              <button
                key={f.id}
                onClick={() => onUpdateSettings({ ...settings, fontFamily: f.id as any })}
                className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-medium transition text-right cursor-pointer ${
                  settings.fontFamily === f.id
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span>{f.name}</span>
                {settings.fontFamily === f.id && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
              </button>
            ))}
          </div>

          {/* لیست فونت‌های سفارشی بارگذاری شده توسط مدیر */}
          {settings.customFonts && settings.customFonts.length > 0 && (
            <div className="mb-3 space-y-2">
              <span className="text-xs font-bold text-slate-500 block mb-1">فونت‌های سفارشی شما:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {settings.customFonts.map((cf) => (
                  <div
                    key={cf.id}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border text-xs transition ${
                      settings.fontFamily === cf.fontFamily
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <button
                      onClick={() => onUpdateSettings({ ...settings, fontFamily: cf.fontFamily })}
                      className="flex-1 text-right flex items-center gap-2 cursor-pointer font-bold truncate"
                      style={{ fontFamily: `'${cf.fontFamily}', sans-serif` }}
                    >
                      <Check className={`w-3.5 h-3.5 shrink-0 ${settings.fontFamily === cf.fontFamily ? 'text-teal-600 opacity-100' : 'opacity-0'}`} />
                      <span className="truncate">{cf.name}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteCustomFont(cf.id, cf.fontFamily)}
                      className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer transition shrink-0"
                      title="حذف فونت"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* باکس بارگذاری فونت جدید TTF توسط مدیر */}
          <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-dashed border-teal-300 dark:border-teal-800 space-y-2.5">
            <div className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>بارگذاری فایل فونت جدید (TTF, WOFF, WOFF2, OTF):</span>
            </div>

            {fontError && (
              <div className="p-2 rounded-xl bg-rose-50 text-rose-700 text-[11px] font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fontError}</span>
              </div>
            )}
            {fontSuccess && (
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 text-[11px] font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{fontSuccess}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newFontName}
                onChange={(e) => setNewFontName(e.target.value)}
                placeholder="نام نمایشی فونت (اختیاری)"
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              />
              <label className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>انتخاب فایل TTF / WOFF</span>
                <input
                  type="file"
                  accept=".ttf,.woff,.woff2,.otf"
                  onChange={handleFontUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[10px] text-slate-400">
              با انتخاب فایل، فونت بارگذاری شده بلافاصله در کل سامانه اعمال و در لیست فونت‌ها ذخیره می‌شود.
            </p>
          </div>
        </div>

        {/* اندازه متن و مقیاس درصدی فونت‌ها */}
        <div className="mb-6 p-4 rounded-2xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Percent className="w-4 h-4 text-teal-600" />
              <span>اندازه و مقیاس درصدی تمام فونت‌های سامانه</span>
            </label>

            {/* جعبه ورودی مستقیم درصد فونت */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">مقدار درصد:</span>
              <div className="relative inline-flex items-center">
                <input
                  type="number"
                  min="50"
                  max="250"
                  step="5"
                  value={settings.fontScale || 100}
                  onChange={(e) => {
                    const val = Math.max(50, Math.min(250, Number(e.target.value) || 100));
                    onUpdateSettings({ ...settings, fontScale: val });
                  }}
                  className="w-20 px-2.5 py-1.5 pl-6 text-center rounded-xl border border-teal-400 dark:border-teal-700 bg-white dark:bg-slate-800 text-teal-900 dark:text-teal-100 font-black text-sm focus:ring-2 focus:ring-teal-500"
                />
                <span className="absolute left-2 text-xs font-bold text-teal-600 pointer-events-none">٪</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-teal-900 dark:text-teal-200 font-medium mb-3 leading-relaxed">
            💡 تعیین اندازه به صورت درصدی نسبت به حالت پیش‌فرض: مثلاً اگر بنویسید <strong>150</strong> درصد، اندازه کلیه فونت‌ها و نوشته‌های سامانه ۵۰٪ بزرگتر از حالت استاندارد خواهد شد.
          </p>

          {/* اسلایدر تنظیم درصدی سریع */}
          <div className="mb-4 px-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span>۷۵٪ (کوچک)</span>
              <span className="font-extrabold text-teal-700 dark:text-teal-300 text-xs">
                {settings.fontScale || 100}٪ {settings.fontScale === 150 ? '(۵۰٪ بیشتر از پیش‌فرض)' : settings.fontScale === 100 ? '(پیش‌فرض ۱۰۰٪)' : ''}
              </span>
              <span>۲۰۰٪ (بسیار بزرگ)</span>
            </div>
            <input
              type="range"
              min="70"
              max="200"
              step="5"
              value={settings.fontScale || 100}
              onChange={(e) => onUpdateSettings({ ...settings, fontScale: Number(e.target.value) })}
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>

          {/* دکمه‌های آماده درصدی */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-3">
            {[
              { val: 85, label: '۸۵٪ ریز' },
              { val: 100, label: '۱۰۰٪ پیش‌فرض' },
              { val: 115, label: '۱۱۵٪ خوانا' },
              { val: 125, label: '۱۲۵٪ بزرگ' },
              { val: 150, label: '۱۵۰٪ (+۵۰٪)' },
              { val: 175, label: '۱۷۵٪ درشت' },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => onUpdateSettings({ ...settings, fontScale: p.val })}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                  (settings.fontScale || 100) === p.val
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* کادر پیش‌نمایش زنده متن با اندازه جدید */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] text-slate-400 mb-1">پیش‌نمایش زنده در سامانه ({settings.fontScale || 100}٪):</div>
            <div className="text-slate-800 dark:text-slate-100 font-bold" style={{ fontSize: `${((settings.fontScale || 100) / 100) * 0.9}rem` }}>
              دانشگاه فرهنگیان استان اصفهان - سامانه اسکان و سراهای دانشجویی
            </div>
            <div className="text-slate-500 text-[11px] mt-0.5" style={{ fontSize: `${((settings.fontScale || 100) / 100) * 0.75}rem` }}>
              متن نمونه جهت مشاهده و ارزیابی وضوح و ابعاد فونت‌ها در تمامی بخش‌ها و جداول.
            </div>
          </div>
        </div>

        {/* طرح و تصویر پس‌زمینه (با امکان بارگذاری عکس دلخواه) */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-teal-600" />
            طرح و تصویر پس‌زمینه سایت
          </label>

          {/* اگر کاربر عکس اختصاصی بارگذاری کرده باشد */}
          {settings.customWallpaperUrl && (
            <div className="mb-3 p-3 rounded-2xl border border-teal-500/40 bg-teal-50/30 dark:bg-teal-950/30 flex items-center justify-between gap-3">
              <div
                onClick={() => onUpdateSettings({ ...settings, wallpaper: 'custom' })}
                className="flex items-center gap-3 cursor-pointer flex-1"
              >
                <img
                  src={settings.customWallpaperUrl}
                  alt="پس‌زمینه اختصاصی"
                  className="w-12 h-10 object-cover rounded-xl border border-slate-300 shadow-xs"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                    عکس پس‌زمینه بارگذاری شده توسط مدیر
                  </span>
                  <span className="text-[11px] text-teal-600 font-medium">
                    {settings.wallpaper === 'custom' ? '✓ در حال حاضر فعال است' : 'کلیک برای فعال‌سازی'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleDeleteCustomWallpaper}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                title="حذف تصویر پس‌زمینه"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* دکمه بارگذاری تصویر اختصاصی پس‌زمینه */}
          <div className="mb-3">
            <label className="w-full py-2.5 px-4 rounded-2xl border border-dashed border-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 text-teal-700 dark:text-teal-300 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>بارگذاری عکس پس‌زمینه اختصاصی از سیستم (JPG / PNG / WebP)</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleWallpaperUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {standardWallpapers.map((wp) => (
              <button
                key={wp.id}
                onClick={() => onUpdateSettings({ ...settings, wallpaper: wp.id })}
                className={`p-3 rounded-2xl border text-right transition flex items-center gap-3 cursor-pointer ${
                  settings.wallpaper === wp.id
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div
                  className="w-7 h-7 rounded-xl shrink-0 shadow-inner border border-black/10"
                  style={{ background: wp.preview }}
                />
                <span className="text-xs font-medium truncate">{wp.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* حالت شب و روز */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 mb-6">
          <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">حالت شب (Dark Mode)</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">بهینه‌سازی نور صفحه برای کار در محیط تاریک</div>
          </div>
          <button
            onClick={() => onUpdateSettings({ ...settings, darkMode: !settings.darkMode })}
            className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
              settings.darkMode ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition" />
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-semibold shadow-lg shadow-teal-600/20 transition cursor-pointer"
        >
          ذخیره و اعمال تنظیمات
        </button>
      </div>
    </div>
  );
};
