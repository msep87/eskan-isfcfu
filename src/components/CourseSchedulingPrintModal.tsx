import React, { useMemo, useState } from 'react';
import {
  SchedMasterPrintSettings,
  SchedPaperSize,
  SchedPrintScalingMode,
} from '../types';
import { SCHED_PAPER_SIZES_MM } from '../utils/schedulingUtils';
import {
  AlignCenter,
  Check,
  FileText,
  Grid,
  LayoutTemplate,
  Maximize2,
  Printer,
  RotateCcw,
  Save,
  Sliders,
  X,
} from 'lucide-react';

export interface PrintPreviewSummary {
  rowsCount: number;
  daysCount: number;
  slotsCount: number;
  totalTableWidthPx: number;
  computedScalePercent: number;
  estimatedPages: number;
  dayLabels: string[];
  slotHeaders: string[];
  sampleRows: Array<{
    major: string;
    entry: string;
    total: string;
    section: string;
    cells: string[];
  }>;
}

interface CourseSchedulingPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchedMasterPrintSettings;
  onChangeSettings: (next: SchedMasterPrintSettings) => void;
  onResetSettings: () => void;
  onSaveAsDefault?: (next: SchedMasterPrintSettings) => void;
  canSaveDefault?: boolean;
  onPrintNow: (effective: SchedMasterPrintSettings) => void;
  activeTerm: string;
  actorName: string;
  previewMeta: PrintPreviewSummary;
}

type PrintTab = 'page' | 'margins_sheet' | 'content_header';

const MARGIN_PRESETS: Array<{
  label: string;
  desc: string;
  margins: SchedMasterPrintSettings['marginsMm'];
}> = [
  { label: 'خیلی باریک (۳mm)', desc: 'حداکثر فضای چاپ جدول', margins: { top: 3, right: 3, bottom: 3, left: 3 } },
  { label: 'باریک (۶mm)', desc: 'پیشنهادی شیت‌های عریض', margins: { top: 6, right: 6, bottom: 6, left: 6 } },
  { label: 'استاندارد (۱۰mm)', desc: 'معمول و متوازن', margins: { top: 10, right: 10, bottom: 10, left: 10 } },
  { label: 'عریض (۱۸mm)', desc: 'مناسب صحافی و زونکن', margins: { top: 18, right: 18, bottom: 18, left: 18 } },
];

export const CourseSchedulingPrintModal: React.FC<CourseSchedulingPrintModalProps> = ({
  isOpen,
  onClose,
  settings,
  onChangeSettings,
  onResetSettings,
  onSaveAsDefault,
  canSaveDefault = false,
  onPrintNow,
  activeTerm,
  actorName,
  previewMeta,
}) => {
  const [activeTab, setActiveTab] = useState<PrintTab>('page');

  const paperInfo = useMemo(() => {
    const spec = SCHED_PAPER_SIZES_MM[settings.paperSize] || SCHED_PAPER_SIZES_MM.A4;
    const isLand = settings.orientation === 'landscape';
    const wMm = isLand ? spec.heightMm : spec.widthMm;
    const hMm = isLand ? spec.widthMm : spec.heightMm;
    return { wMm, hMm, spec };
  }, [settings.paperSize, settings.orientation]);

  if (!isOpen) return null;

  const update = (patch: Partial<SchedMasterPrintSettings>) => {
    onChangeSettings({ ...settings, ...patch });
  };

  const updateMargin = (side: keyof SchedMasterPrintSettings['marginsMm'], val: number) => {
    const clamped = Math.max(0, Math.min(40, Number.isFinite(val) ? val : 0));
    onChangeSettings({
      ...settings,
      marginsMm: {
        ...settings.marginsMm,
        [side]: clamped,
      },
    });
  };

  // نسبت نمایش کاغذ در پیش‌نمایش
  const previewMaxW = 330;
  const aspectRatio = paperInfo.hMm / Math.max(1, paperInfo.wMm);
  const sheetW = settings.orientation === 'landscape' ? previewMaxW : Math.round(previewMaxW * 0.72);
  const sheetH = Math.min(340, Math.round(sheetW * aspectRatio));
  const pxPerMm = sheetW / Math.max(1, paperInfo.wMm);

  const resolvedTitle = settings.customTitle.trim() || `برنامه جامع و فراگیر ترم ${activeTerm}`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[118] flex items-center justify-center bg-black/65 backdrop-blur-sm p-2 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl max-h-[93%] border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden text-xs"
      >
        {/* هدر مودال */}
        <div className="shrink-0 px-4 sm:px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm">
                تنظیمات حرفه‌ای چاپ برنامه (مشابه Page Setup اکسل)
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5">
                انتخاب اندازه کاغذ، جهت افقی/عمودی، حاشیه‌ها، مقیاس جاگذاری روی ۱ صفحه، خطوط شبکه، رنگ‌بندی و سرصفحه/پاصفحه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onPrintNow(settings);
              }}
              className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ نهایی / خروجی PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-600 text-white cursor-pointer transition"
              title="بستن (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* بدنه دو ستونی: سمت راست تنظیمات + سمت چپ پیش‌نمایش زنده برگه */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* ستون تنظیمات (۷ ستون) */}
          <div className="lg:col-span-7 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-l border-slate-200 dark:border-slate-800">
            {/* تب‌ها */}
            <div className="shrink-0 px-4 pt-3 pb-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'page', label: '۱. کاغذ، جهت و مقیاس (Page)', icon: Maximize2 },
                  { id: 'margins_sheet', label: '۲. حاشیه‌ها و شیت (Margins & Sheet)', icon: Grid },
                  { id: 'content_header', label: '۳. محتوا، سرصفحه و امضا', icon: FileText },
                ] as const
              ).map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`px-3 py-1.5 rounded-xl font-extrabold inline-flex items-center gap-1.5 cursor-pointer border transition ${
                      active
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* محتوای تب فعال */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === 'page' && (
                <>
                  {/* جهت صفحه */}
                  <div className="space-y-1.5">
                    <span className="font-black text-slate-800 dark:text-slate-100 block">
                      جهت صفحه چاپ (Orientation)
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => update({ orientation: 'landscape' })}
                        className={`p-3 rounded-xl border text-right flex items-center gap-3 cursor-pointer transition ${
                          settings.orientation === 'landscape'
                            ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-600 text-teal-900 dark:text-teal-100 ring-1 ring-teal-500'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="w-8 h-5 rounded border-2 border-current shrink-0" />
                        <div>
                          <div className="font-black">افقی (Landscape)</div>
                          <div className="text-[10px] text-slate-500">پیشنهادی برای کل روزهای هفته</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => update({ orientation: 'portrait' })}
                        className={`p-3 rounded-xl border text-right flex items-center gap-3 cursor-pointer transition ${
                          settings.orientation === 'portrait'
                            ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-600 text-teal-900 dark:text-teal-100 ring-1 ring-teal-500'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="w-5 h-7 rounded border-2 border-current shrink-0 mx-1.5" />
                        <div>
                          <div className="font-black">عمودی (Portrait)</div>
                          <div className="text-[10px] text-slate-500">مناسب فیلتر ۱ رشته یا چاپ عمودی</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* اندازه کاغذ */}
                  <div className="space-y-1.5">
                    <span className="font-black text-slate-800 dark:text-slate-100 block">
                      اندازه کاغذ (Paper Size)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(Object.keys(SCHED_PAPER_SIZES_MM) as SchedPaperSize[]).map((sz) => {
                        const info = SCHED_PAPER_SIZES_MM[sz];
                        const active = settings.paperSize === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => update({ paperSize: sz })}
                            className={`p-2 rounded-xl border text-center cursor-pointer transition ${
                              active
                                ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-xs'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-400 font-bold'
                            }`}
                          >
                            <div className="font-mono text-xs">{sz}</div>
                            <div
                              className={`text-[9.5px] font-mono ${
                                active ? 'text-indigo-100' : 'text-slate-400'
                              }`}
                              dir="ltr"
                            >
                              {info.widthMm}×{info.heightMm}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* مقیاس و جاگذاری در صفحه (Scaling) */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-teal-600" />
                        <span>مقیاس و جاگذاری جدول در صفحه (Scaling)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-mono text-[11px] font-black">
                        مقیاس مؤثر: {previewMeta.computedScalePercent}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(
                        [
                          {
                            id: 'fit_1_page_wide',
                            title: 'جاگذاری همه ستون‌ها در ۱ صفحه افقی',
                            desc: 'Fit All Columns on One Page (بدون برش ستون‌ها)',
                          },
                          {
                            id: 'fit_1_page',
                            title: 'جاگذاری کل برنامه در یک صفحه تکی',
                            desc: 'Fit Sheet on One Page (کل عرض و ارتفاع در ۱ برگ)',
                          },
                          {
                            id: 'fit_n_pages_wide',
                            title: 'تقسیم عرض جدول در N صفحه',
                            desc: 'مناسب چاپ خوانا و درشت روی چند برگه افقی',
                          },
                          {
                            id: 'custom_percent',
                            title: 'درصد بزرگنمایی دلخواه',
                            desc: 'تعیین دقیق درصد مقیاس چاپ (٪۳۰ تا ٪۱۵۰)',
                          },
                        ] as Array<{ id: SchedPrintScalingMode; title: string; desc: string }>
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => update({ scalingMode: opt.id })}
                          className={`p-2.5 rounded-xl border text-right cursor-pointer transition ${
                            settings.scalingMode === opt.id
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                          }`}
                        >
                          <div className="font-extrabold">{opt.title}</div>
                          <div
                            className={`text-[10px] mt-0.5 ${
                              settings.scalingMode === opt.id ? 'text-teal-100' : 'text-slate-500'
                            }`}
                          >
                            {opt.desc}
                          </div>
                        </button>
                      ))}
                    </div>

                    {settings.scalingMode === 'custom_percent' && (
                      <div className="flex items-center gap-3 pt-1">
                        <span className="font-bold">درصد مقیاس:</span>
                        <input
                          type="range"
                          min={30}
                          max={150}
                          step={5}
                          value={settings.scalePercent}
                          onChange={(e) => update({ scalePercent: Number(e.target.value) || 100 })}
                          className="flex-1 accent-teal-600"
                        />
                        <input
                          type="number"
                          min={25}
                          max={180}
                          value={settings.scalePercent}
                          onChange={(e) =>
                            update({
                              scalePercent: Math.max(25, Math.min(180, Number(e.target.value) || 100)),
                            })
                          }
                          className="w-16 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center"
                        />
                        <span>%</span>
                      </div>
                    )}

                    {settings.scalingMode === 'fit_n_pages_wide' && (
                      <div className="flex items-center gap-3 pt-1">
                        <span className="font-bold">تعداد صفحات در عرض جدول:</span>
                        <input
                          type="number"
                          min={1}
                          max={6}
                          value={settings.fitPagesWide}
                          onChange={(e) =>
                            update({
                              fitPagesWide: Math.max(1, Math.min(6, Number(e.target.value) || 1)),
                            })
                          }
                          className="w-16 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center"
                        />
                        <span className="text-[11px] text-slate-500">صفحه در عرض</span>
                      </div>
                    )}
                  </div>

                  {/* محدوده چاپ */}
                  <div className="space-y-1.5">
                    <span className="font-black text-slate-800 dark:text-slate-100 block">
                      محدوده چاپ داده‌ها (Print Area / Scope)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'current_view', label: 'مطابق فیلتر و نمای فعلی' },
                          { id: 'populated_only', label: 'فقط روزها و سطرهای دارای درس' },
                          { id: 'all_rows_and_days', label: 'کل رشته‌ها و همه روزهای فعال' },
                        ] as const
                      ).map((sc) => (
                        <button
                          key={sc.id}
                          type="button"
                          onClick={() => update({ printScope: sc.id })}
                          className={`px-3 py-2 rounded-xl border font-bold cursor-pointer transition ${
                            settings.printScope === sc.id
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {sc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'margins_sheet' && (
                <>
                  {/* الگوهای سریع حاشیه */}
                  <div className="space-y-2">
                    <span className="font-black text-slate-800 dark:text-slate-100 block">
                      حاشیه‌های صفحه بر حسب میلی‌متر (Margins - mm)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {MARGIN_PRESETS.map((mp) => (
                        <button
                          key={mp.label}
                          type="button"
                          onClick={() => update({ marginsMm: { ...mp.margins } })}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-teal-500 text-right cursor-pointer transition"
                        >
                          <div className="font-extrabold text-[11px]">{mp.label}</div>
                          <div className="text-[9.5px] text-slate-500 mt-0.5">{mp.desc}</div>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      {(
                        [
                          { key: 'top', label: 'حاشیه بالا (mm)' },
                          { key: 'right', label: 'حاشیه راست (mm)' },
                          { key: 'bottom', label: 'حاشیه پایین (mm)' },
                          { key: 'left', label: 'حاشیه چپ (mm)' },
                        ] as const
                      ).map((m) => (
                        <label key={m.key} className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            {m.label}
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={40}
                            step={1}
                            value={settings.marginsMm[m.key]}
                            onChange={(e) => updateMargin(m.key, Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center font-bold"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* وسط‌چین و رنگ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="font-black flex items-center gap-1.5">
                        <AlignCenter className="w-3.5 h-3.5 text-teal-600" />
                        <span>تراز صفحه (Center on Page)</span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={settings.centerHorizontally}
                          onChange={(e) => update({ centerHorizontally: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>وسط‌چین افقی جدول در صفحه</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={settings.centerVertically}
                          onChange={(e) => update({ centerVertically: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>وسط‌چین عمودی در صفحه</span>
                      </label>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="font-black">کیفیت و رنگ چاپ</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => update({ colorMode: 'color' })}
                          className={`py-1.5 rounded-lg border font-bold cursor-pointer ${
                            settings.colorMode === 'color'
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          چاپ رنگی
                        </button>
                        <button
                          type="button"
                          onClick={() => update({ colorMode: 'grayscale' })}
                          className={`py-1.5 rounded-lg border font-bold cursor-pointer ${
                            settings.colorMode === 'grayscale'
                              ? 'bg-slate-800 text-white border-slate-800'
                              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          سیاه‌وسفید
                        </button>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer font-bold pt-0.5">
                        <input
                          type="checkbox"
                          checked={settings.includeColors}
                          onChange={(e) => update({ includeColors: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>رنگ متمایز رشته‌ها و روزها در پس‌زمینه</span>
                      </label>
                    </div>
                  </div>

                  {/* گزینه‌های شیت و فونت */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="font-black">خطوط جدول، شکست صفحه و فونت چاپ</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={settings.showGridlines}
                          onChange={(e) => update({ showGridlines: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>چاپ خطوط شبکه سلول‌ها (Gridlines)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={settings.boldDayBorders}
                          onChange={(e) => update({ boldDayBorders: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>خط جداکننده ضخیم بین روزهای هفته</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={settings.repeatHeaderRows}
                          onChange={(e) => update({ repeatHeaderRows: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>تکرار سرستون روز و سانس در همه صفحات</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={settings.avoidRowBreak}
                          onChange={(e) => update({ avoidRowBreak: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>جلوگیری از دو نیم شدن ردیف‌ها هنگام برش</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold sm:col-span-2">
                        <input
                          type="checkbox"
                          checked={settings.useLayoutWidthsAndOrientations}
                          onChange={(e) =>
                            update({ useLayoutWidthsAndOrientations: e.target.checked })
                          }
                          className="rounded text-teal-600"
                        />
                        <span>
                          اعمال پهنای ستون‌ها و جهت عمودی/افقی تنظیم‌شده در برنامه جامع
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <label className="space-y-1">
                        <span className="text-[11px] font-bold">اندازه فونت پایه چاپ (px)</span>
                        <input
                          type="number"
                          min={7}
                          max={15}
                          value={settings.fontSizePx}
                          onChange={(e) =>
                            update({
                              fontSizePx: Math.max(7, Math.min(15, Number(e.target.value) || 10)),
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center font-bold"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-bold">فاصله داخلی سلول‌ها (px)</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={settings.cellPaddingPx}
                          onChange={(e) =>
                            update({
                              cellPaddingPx: Math.max(1, Math.min(10, Number(e.target.value) || 4)),
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center font-bold"
                        />
                      </label>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'content_header' && (
                <>
                  {/* اقلام درون سلول‌ها */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="font-black">جزئیات نمایش‌داده‌شده در هر سلول درسی</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={settings.includeProfessor}
                          onChange={(e) => update({ includeProfessor: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>نام استاد درس</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={settings.includeClassroom}
                          onChange={(e) => update({ includeClassroom: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>نام کلاس فیزیکی</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={settings.includeExamInfo}
                          onChange={(e) => update({ includeExamInfo: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>تاریخ و سانس امتحان پایان ترم</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={settings.includeSharedTag}
                          onChange={(e) => update({ includeSharedTag: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>برچسب درس مشترک با سایر رشته‌ها</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold sm:col-span-2">
                        <input
                          type="checkbox"
                          checked={settings.includeComments}
                          onChange={(e) => update({ includeComments: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>چاپ یادداشت‌ها و کامنت‌های ثبت‌شده روی سلول‌ها</span>
                      </label>
                    </div>
                  </div>

                  {/* سرصفحه و پاصفحه */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="font-black">سرصفحه و پاصفحه (Header & Footer)</div>

                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={settings.showHeaderBanner}
                          onChange={(e) => update({ showHeaderBanner: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>نمایش سربرگ بالای صفحه</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={settings.showPrintDate}
                          onChange={(e) => update({ showPrintDate: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>درج تاریخ چاپ</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={settings.showActorName}
                          onChange={(e) => update({ showActorName: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>درج نام چاپ‌کننده ({actorName})</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <label className="space-y-1">
                        <span className="text-[11px] font-bold">عنوان اصلی سربرگ</span>
                        <input
                          type="text"
                          value={settings.customTitle}
                          onChange={(e) => update({ customTitle: e.target.value })}
                          placeholder={`برنامه جامع و فراگیر ترم ${activeTerm}`}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-bold">زیرعنوان / توضیح بالای جدول</span>
                        <input
                          type="text"
                          value={settings.customSubtitle}
                          onChange={(e) => update({ customSubtitle: e.target.value })}
                          placeholder="مثلاً: نسخه نهایی ابلاغی به گروه‌های آموزشی"
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </label>
                    </div>

                    <label className="space-y-1 block">
                      <span className="text-[11px] font-bold">متن پاصفحه / تذکر انتهای برگه</span>
                      <input
                        type="text"
                        value={settings.footerNote}
                        onChange={(e) => update({ footerNote: e.target.value })}
                        placeholder="مثلاً: مسئولیت عدم تداخل ساعات و تکمیل ظرفیت بر عهده مدیر گروه محترم است."
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold pt-1">
                      <input
                        type="checkbox"
                        checked={settings.showSignatureBlock}
                        onChange={(e) => update({ showSignatureBlock: e.target.checked })}
                        className="rounded text-teal-600"
                      />
                      <span>درج کادر امضاهای پایان برگه (مدیر گروه / معاونت آموزشی / ریاست)</span>
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ستون پیش‌نمایش زنده برگه چاپ (۵ ستون) */}
          <div className="lg:col-span-5 bg-slate-100 dark:bg-slate-950/70 p-4 flex flex-col items-center justify-between gap-3 overflow-y-auto">
            <div className="w-full flex items-center justify-between text-[11px]">
              <span className="font-black text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
                <LayoutTemplate className="w-3.5 h-3.5 text-teal-600" />
                <span>پیش‌نمایش زنده چیدمان برگه</span>
              </span>
              <span className="font-mono text-slate-500" dir="ltr">
                {settings.paperSize} · {Math.round(paperInfo.wMm)}×{Math.round(paperInfo.hMm)} mm
              </span>
            </div>

            {/* صفحه کاغذ شبیه‌سازی‌شده */}
            <div className="flex-1 w-full flex items-center justify-center py-2">
              <div
                style={{
                  width: `${sheetW}px`,
                  height: `${sheetH}px`,
                  paddingTop: `${Math.max(4, Math.round(settings.marginsMm.top * pxPerMm))}px`,
                  paddingRight: `${Math.max(4, Math.round(settings.marginsMm.right * pxPerMm))}px`,
                  paddingBottom: `${Math.max(4, Math.round(settings.marginsMm.bottom * pxPerMm))}px`,
                  paddingLeft: `${Math.max(4, Math.round(settings.marginsMm.left * pxPerMm))}px`,
                  filter: settings.colorMode === 'grayscale' ? 'grayscale(100%)' : undefined,
                }}
                className={`bg-white text-slate-900 rounded-md shadow-xl border border-slate-300 flex flex-col overflow-hidden transition-all ${
                  settings.centerVertically ? 'justify-center' : 'justify-start'
                }`}
              >
                <div className="w-full h-full border border-dashed border-sky-300/80 p-1.5 flex flex-col overflow-hidden">
                  {settings.showHeaderBanner && (
                    <div className="border-b border-slate-800 pb-1 mb-1 flex items-center justify-between gap-2 text-[7.5px]">
                      <div className="min-w-0">
                        <div className="font-black truncate">{resolvedTitle}</div>
                        {settings.customSubtitle && (
                          <div className="text-[6.5px] text-slate-500 truncate">
                            {settings.customSubtitle}
                          </div>
                        )}
                      </div>
                      <div className="text-[6px] text-slate-500 shrink-0 text-left">
                        {settings.showPrintDate && <div>{new Date().toLocaleDateString('fa-IR')}</div>}
                        {settings.showActorName && <div className="truncate max-w-[70px]">{actorName}</div>}
                      </div>
                    </div>
                  )}

                  {/* نمونه جدول با اعمال خطوط، رنگ و جهت */}
                  <div
                    className={`overflow-hidden ${
                      settings.centerHorizontally ? 'mx-auto w-full' : 'w-full'
                    }`}
                  >
                    <table className="w-full border-collapse text-[6px]">
                      <thead>
                        <tr>
                          <th
                            rowSpan={2}
                            className={`p-0.5 bg-slate-200 font-black ${
                              settings.showGridlines ? 'border border-slate-400' : ''
                            }`}
                          >
                            رشته
                          </th>
                          <th
                            rowSpan={2}
                            className={`p-0.5 bg-slate-200 font-black ${
                              settings.showGridlines ? 'border border-slate-400' : ''
                            }`}
                          >
                            ورودی
                          </th>
                          <th
                            rowSpan={2}
                            className={`p-0.5 bg-slate-200 font-black ${
                              settings.showGridlines ? 'border border-slate-400' : ''
                            }`}
                          >
                            شعبه
                          </th>
                          {previewMeta.dayLabels.slice(0, 3).map((dLbl, i) => (
                            <th
                              key={`pd_${i}`}
                              colSpan={Math.min(2, Math.max(1, previewMeta.slotsCount))}
                              className={`p-0.5 font-black ${
                                settings.includeColors
                                  ? i % 2 === 0
                                    ? 'bg-sky-100 text-sky-950'
                                    : 'bg-emerald-100 text-emerald-950'
                                  : 'bg-slate-100'
                              } ${settings.showGridlines ? 'border border-slate-400' : ''} ${
                                settings.boldDayBorders ? 'border-r-2 border-r-slate-800' : ''
                              }`}
                            >
                              {dLbl}
                            </th>
                          ))}
                        </tr>
                        <tr>
                          {previewMeta.dayLabels.slice(0, 3).flatMap((_, dIdx) =>
                            previewMeta.slotHeaders.slice(0, 2).map((sLbl, sIdx) => (
                              <th
                                key={`ps_${dIdx}_${sIdx}`}
                                className={`p-0.5 bg-slate-50 font-bold truncate max-w-[36px] ${
                                  settings.showGridlines ? 'border border-slate-300' : ''
                                }`}
                              >
                                {sLbl}
                              </th>
                            ))
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {(previewMeta.sampleRows.length > 0
                          ? previewMeta.sampleRows.slice(0, 5)
                          : [
                              {
                                major: 'آموزش ابتدایی',
                                entry: '۴۰۳۱',
                                total: '۳۲',
                                section: 'گروه ۱',
                                cells: ['مبانی تعلیم', '', 'روانشناسی', ''],
                              },
                              {
                                major: 'الهیات',
                                entry: '۴۰۲۱',
                                total: '۲۸',
                                section: 'گروه ۱',
                                cells: ['', 'فقه ۱', '', 'تفسیر'],
                              },
                            ]
                        ).map((r, rIdx) => (
                          <tr key={`pr_${rIdx}`}>
                            <td
                              className={`p-0.5 text-center font-bold ${
                                settings.includeColors
                                  ? rIdx % 2 === 0
                                    ? 'bg-fuchsia-50'
                                    : 'bg-sky-50'
                                  : ''
                              } ${settings.showGridlines ? 'border border-slate-300' : ''}`}
                            >
                              {r.major}
                            </td>
                            <td
                              className={`p-0.5 text-center font-mono ${
                                settings.showGridlines ? 'border border-slate-300' : ''
                              }`}
                            >
                              {r.entry}
                            </td>
                            <td
                              className={`p-0.5 text-center ${
                                settings.showGridlines ? 'border border-slate-300' : ''
                              }`}
                            >
                              {r.section}
                            </td>
                            {Array.from({
                              length: Math.min(3, Math.max(1, previewMeta.dayLabels.length)) *
                                Math.min(2, Math.max(1, previewMeta.slotsCount)),
                            }).map((_, cIdx) => {
                              const txt = r.cells[cIdx] || '';
                              return (
                                <td
                                  key={`pc_${cIdx}`}
                                  className={`p-0.5 align-top ${
                                    settings.showGridlines ? 'border border-slate-300' : ''
                                  }`}
                                >
                                  {txt && (
                                    <div
                                      className={`rounded px-0.5 py-0.2 truncate ${
                                        settings.includeColors
                                          ? 'bg-teal-50 border border-teal-200'
                                          : 'bg-slate-50 border border-slate-300'
                                      }`}
                                    >
                                      {txt}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {(settings.footerNote || settings.showSignatureBlock) && (
                    <div className="mt-auto pt-1 border-t border-slate-300 text-[6px] text-slate-600 space-y-1">
                      {settings.footerNote && <div className="truncate">{settings.footerNote}</div>}
                      {settings.showSignatureBlock && (
                        <div className="grid grid-cols-3 gap-2 text-center pt-1 font-bold">
                          <div className="border-t border-dashed border-slate-400 pt-0.5">مدیر گروه</div>
                          <div className="border-t border-dashed border-slate-400 pt-0.5">معاونت آموزشی</div>
                          <div className="border-t border-dashed border-slate-400 pt-0.5">ریاست پردیس</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* آمار برگه */}
            <div className="w-full grid grid-cols-3 gap-2 text-center text-[10.5px]">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-400">ابعاد جدول</div>
                <div className="font-black text-slate-800 dark:text-slate-100">
                  {previewMeta.rowsCount.toLocaleString('fa-IR')} ردیف ×{' '}
                  {previewMeta.daysCount.toLocaleString('fa-IR')} روز
                </div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-400">مقیاس محاسبه‌شده</div>
                <div className="font-black text-teal-600 font-mono">
                  {previewMeta.computedScalePercent}%
                </div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-400">تخمین صفحات</div>
                <div className="font-black text-indigo-600">
                  {previewMeta.estimatedPages.toLocaleString('fa-IR')} صفحه
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* فوتر مودال */}
        <div className="shrink-0 px-4 sm:px-5 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onResetSettings}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>بازنشانی پیش‌فرض</span>
            </button>
            {canSaveDefault && onSaveAsDefault && (
              <button
                type="button"
                onClick={() => onSaveAsDefault(settings)}
                className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-100 font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>ذخیره به‌عنوان پیش‌فرض سامانه</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 font-bold cursor-pointer"
            >
              بستن
            </button>
            <button
              type="button"
              onClick={() => onPrintNow(settings)}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>تأیید و چاپ برنامه</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
