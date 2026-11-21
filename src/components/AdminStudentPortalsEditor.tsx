import React, { useMemo, useState } from 'react';
import {
  AppSettings,
  StudentPortalColorKey,
  StudentPortalIconKey,
  StudentPortalLink,
} from '../types';
import { Storage } from '../utils/storage';
import {
  DEFAULT_STUDENT_PORTALS,
  PORTAL_COLOR_STYLES,
  PORTAL_ICON_OPTIONS,
  deriveDisplayUrl,
  normalizePortalUrl,
  resolveStudentPortals,
} from '../utils/studentPortalsDefaults';
import {
  Globe,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  GraduationCap,
  UtensilsCrossed,
  Megaphone,
  Cpu,
  Landmark,
  BookOpen,
  Wallet,
  Building2,
  Shield,
  Calendar,
  Link2,
} from 'lucide-react';

interface AdminStudentPortalsEditorProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export function renderPortalIcon(iconKey?: StudentPortalIconKey) {
  switch (iconKey) {
    case 'graduation':
      return GraduationCap;
    case 'dining':
      return UtensilsCrossed;
    case 'megaphone':
      return Megaphone;
    case 'cpu':
      return Cpu;
    case 'landmark':
      return Landmark;
    case 'book':
      return BookOpen;
    case 'wallet':
      return Wallet;
    case 'building':
      return Building2;
    case 'shield':
      return Shield;
    case 'calendar':
      return Calendar;
    case 'link':
      return Link2;
    case 'globe':
    default:
      return Globe;
  }
}

export const AdminStudentPortalsEditor: React.FC<AdminStudentPortalsEditorProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const portals = useMemo(
    () => resolveStudentPortals(settings.studentPortals),
    [settings.studentPortals]
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('سامانه دانشگاهی');
  const [url, setUrl] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [description, setDescription] = useState('');
  const [iconKey, setIconKey] = useState<StudentPortalIconKey>('globe');
  const [colorKey, setColorKey] = useState<StudentPortalColorKey>('teal');
  const [isActive, setIsActive] = useState(true);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmResetDefaults, setConfirmResetDefaults] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const persistPortals = (nextList: StudentPortalLink[], actionLabel: string, detailText: string) => {
    const normalizedList = nextList.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
    const updatedSettings: AppSettings = {
      ...settings,
      studentPortals: normalizedList,
    };
    Storage.setSettings(updatedSettings);
    onUpdateSettings(updatedSettings);
    Storage.addActivityLog({
      category: 'settings',
      action: actionLabel,
      details: detailText,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory('سامانه دانشگاهی');
    setUrl('');
    setCtaLabel('');
    setDescription('');
    setIconKey('globe');
    setColorKey('teal');
    setIsActive(true);
    setIsFormOpen(false);
  };

  const openCreateForm = () => {
    setFeedback(null);
    setConfirmDeleteId(null);
    setConfirmResetDefaults(false);
    setEditingId(null);
    setTitle('');
    setCategory('سامانه دانشگاهی');
    setUrl('https://');
    setCtaLabel('');
    setDescription('');
    setIconKey('globe');
    setColorKey('teal');
    setIsActive(true);
    setIsFormOpen(true);
  };

  const openEditForm = (portal: StudentPortalLink) => {
    setFeedback(null);
    setConfirmDeleteId(null);
    setConfirmResetDefaults(false);
    setEditingId(portal.id);
    setTitle(portal.title);
    setCategory(portal.category || 'سامانه دانشگاهی');
    setUrl(portal.url);
    setCtaLabel(portal.ctaLabel || '');
    setDescription(portal.description || '');
    setIconKey(portal.iconKey || 'globe');
    setColorKey(portal.colorKey || 'teal');
    setIsActive(portal.isActive !== false);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setFeedback({ type: 'error', message: 'لطفاً عنوان سامانه را وارد نمایید.' });
      return;
    }

    const cleanUrl = normalizePortalUrl(url);
    if (!cleanUrl) {
      setFeedback({
        type: 'error',
        message: 'آدرس اینترنتی سامانه نامعتبر است. لطفاً یک آدرس معتبر با http:// یا https:// وارد کنید.',
      });
      return;
    }

    const cleanCategory = category.trim() || 'سامانه دانشگاهی';
    const cleanCta = ctaLabel.trim() || `ورود به ${cleanTitle}`;
    const cleanDesc = description.trim();
    const displayUrl = deriveDisplayUrl(cleanUrl);

    if (editingId) {
      const nextList = portals.map((item) =>
        item.id === editingId
          ? {
              ...item,
              title: cleanTitle,
              category: cleanCategory,
              url: cleanUrl,
              displayUrl,
              ctaLabel: cleanCta,
              description: cleanDesc,
              iconKey,
              colorKey,
              isActive,
            }
          : item
      );
      persistPortals(
        nextList,
        'ویرایش سامانه دانشجویی',
        `سامانه «${cleanTitle}» (${cleanUrl}) توسط مدیر کل ویرایش شد.`
      );
      setFeedback({ type: 'success', message: `سامانه «${cleanTitle}» با موفقیت ویرایش و ذخیره شد.` });
    } else {
      const newPortal: StudentPortalLink = {
        id: `portal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: cleanTitle,
        category: cleanCategory,
        url: cleanUrl,
        displayUrl,
        ctaLabel: cleanCta,
        description: cleanDesc,
        iconKey,
        colorKey,
        isActive,
        order: portals.length + 1,
      };
      persistPortals(
        [...portals, newPortal],
        'ایجاد سامانه دانشجویی جدید',
        `سامانه «${cleanTitle}» (${cleanUrl}) به فهرست سامانه‌های دانشجویان اضافه شد.`
      );
      setFeedback({ type: 'success', message: `سامانه جدید «${cleanTitle}» با موفقیت ایجاد و به پنل دانشجویان اضافه شد.` });
    }

    resetForm();
  };

  const handleToggleActive = (portal: StudentPortalLink) => {
    const nextActive = portal.isActive === false;
    const nextList = portals.map((p) =>
      p.id === portal.id ? { ...p, isActive: nextActive } : p
    );
    persistPortals(
      nextList,
      nextActive ? 'فعال‌سازی سامانه دانشجویی' : 'مخفی‌سازی سامانه دانشجویی',
      `وضعیت نمایش سامانه «${portal.title}» به ${nextActive ? 'فعال' : 'غیرفعال'} تغییر یافت.`
    );
    setFeedback({
      type: 'success',
      message: `سامانه «${portal.title}» ${nextActive ? 'در کارتابل دانشجویان فعال شد' : 'موقتاً از کارتابل دانشجویان مخفی شد'}.`,
    });
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= portals.length) return;
    const copy = [...portals];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    persistPortals(copy, 'تغییر ترتیب سامانه‌های دانشجویی', `ترتیب نمایش «${moved.title}» بروزرسانی شد.`);
  };

  const handleDelete = (portal: StudentPortalLink) => {
    const nextList = portals.filter((p) => p.id !== portal.id);
    persistPortals(
      nextList,
      'حذف سامانه دانشجویی',
      `سامانه «${portal.title}» از فهرست سامانه‌های دانشجویان حذف شد.`
    );
    if (editingId === portal.id) {
      resetForm();
    }
    setConfirmDeleteId(null);
    setFeedback({ type: 'success', message: `سامانه «${portal.title}» با موفقیت حذف گردید.` });
  };

  const handleRestoreDefaults = () => {
    persistPortals(
      DEFAULT_STUDENT_PORTALS.map((p) => ({ ...p })),
      'بازگردانی سامانه‌های پیش‌فرض دانشجویی',
      'فهرست سامانه‌های بخش کاربری دانشجویان به ۵ سامانه پیش‌فرض دانشگاه فرهنگیان بازگردانده شد.'
    );
    setConfirmResetDefaults(false);
    resetForm();
    setFeedback({
      type: 'success',
      message: 'فهرست سامانه‌ها به ۵ درگاه رسمی پیش‌فرض دانشگاه فرهنگیان بازگردانده شد.',
    });
  };

  const activeCount = portals.filter((p) => p.isActive !== false).length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
      {/* سربرگ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white">
              مدیریت بخش «سامانه‌ها» در کارتابل دانشجویان ({activeCount.toLocaleString('fa-IR')} فعال از{' '}
              {portals.length.toLocaleString('fa-IR')})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ایجاد، ویرایش، تغییر ترتیب، مخفی‌سازی یا حذف لینک سامانه‌های دانشگاهی قابل مشاهده در تب «سامانه‌ها» برای دانشجویان
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openCreateForm}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن سامانه جدید</span>
          </button>

          {!confirmResetDefaults ? (
            <button
              type="button"
              onClick={() => setConfirmResetDefaults(true)}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="بازگردانی ۵ سامانه پیش‌فرض (گلستان، کالینان، ایتا، هدف، سجداد)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>بازگردانی پیش‌فرض‌ها</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-[11px]">
              <span className="font-bold text-amber-800 dark:text-amber-200">جایگزینی با ۵ پیش‌فرض؟</span>
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
              >
                بله
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetDefaults(false)}
                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
              >
                انصراف
              </button>
            </div>
          )}
        </div>
      </div>

      {/* پیام بازخورد */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-75 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* فرم ایجاد یا ویرایش سامانه */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-2 border-teal-300/80 dark:border-teal-800 space-y-4 text-xs"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              {editingId ? (
                <Edit3 className="w-4 h-4 text-amber-600" />
              ) : (
                <Plus className="w-4 h-4 text-teal-600" />
              )}
              <span>{editingId ? 'ویرایش مشخصات سامانه دانشجویی' : 'ایجاد سامانه جدید برای دانشجویان'}</span>
            </h4>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                عنوان سامانه *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: سامانه گلستان دانشگاه فرهنگیان"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                برچسب / دسته‌بندی
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="مثال: امور آموزشی، تغذیه و سلف، اطلاع‌رسانی رسمی..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                آدرس اینترنتی (لینک ورود) *
              </label>
              <input
                type="text"
                dir="ltr"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://education.cfu.ac.ir/"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono text-left focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                متن دکمه ورود (اختیاری)
              </label>
              <input
                type="text"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="مثال: ورود به سامانه گلستان"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                آیکون کارت
              </label>
              <select
                value={iconKey}
                onChange={(e) => setIconKey(e.target.value as StudentPortalIconKey)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {PORTAL_ICON_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                رنگ‌بندی کارت و دکمه
              </label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(Object.keys(PORTAL_COLOR_STYLES) as StudentPortalColorKey[]).map((ck) => {
                  const cfg = PORTAL_COLOR_STYLES[ck];
                  const selected = colorKey === ck;
                  return (
                    <button
                      key={ck}
                      type="button"
                      onClick={() => setColorKey(ck)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                        selected
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.swatch}`} />
                      <span>{cfg.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              توضیحات راهنما برای دانشجو
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیح مختصر درباره کاربرد این سامانه برای دانشجو..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <label className="inline-flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded accent-teal-600"
              />
              <span>فعال و قابل مشاهده در کارتابل دانشجویان</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className={`px-5 py-2.5 rounded-xl text-white font-extrabold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                  editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{editingId ? 'ذخیره تغییرات سامانه' : 'ثبت و افزودن سامانه'}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </form>
      )}

      {/* فهرست سامانه‌های ثبت‌شده */}
      {portals.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            هیچ سامانه‌ای برای نمایش به دانشجویان ثبت نشده است.
          </p>
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ایجاد اولین سامانه</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {portals.map((portal, index) => {
            const IconComp = renderPortalIcon(portal.iconKey);
            const colorCfg = PORTAL_COLOR_STYLES[portal.colorKey || 'teal'] || PORTAL_COLOR_STYLES.teal;
            const inactive = portal.isActive === false;

            return (
              <div
                key={portal.id}
                className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                  inactive
                    ? 'bg-slate-100/80 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-75'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-xl border shrink-0 ${colorCfg.accentWrap}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                            {portal.title}
                          </h4>
                          {inactive && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                              مخفی
                            </span>
                          )}
                        </div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${colorCfg.badgeCls}`}>
                          {portal.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMove(index, -1)}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-teal-600 disabled:opacity-35 cursor-pointer"
                        title="انتقال به بالا"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 1)}
                        disabled={index === portals.length - 1}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-teal-600 disabled:opacity-35 cursor-pointer"
                        title="انتقال به پایین"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {portal.description && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      {portal.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900/70 px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate" dir="ltr">
                      {portal.url}
                    </span>
                    <a
                      href={portal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:text-teal-700 shrink-0"
                      title="تست باز شدن لینک در تب جدید"
                    >
                      <span>تست لینک</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(portal)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                      inactive
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {inactive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{inactive ? 'فعال‌سازی نمایش' : 'مخفی کردن'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditForm(portal)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 text-[11px] font-bold transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>ویرایش</span>
                    </button>

                    {confirmDeleteId === portal.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(portal)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
                        >
                          تأیید حذف
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold cursor-pointer"
                        >
                          لغو
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(portal.id)}
                        className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition cursor-pointer"
                        title="حذف سامانه"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
