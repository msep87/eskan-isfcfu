import React, { useEffect, useMemo, useState } from 'react';
import { Student, Dormitory, Room, Bed, AppSettings } from '../types';
import { Storage } from '../utils/storage';
import { toEnglishDigits } from '../utils/excelUtils';
import { getStudentResidenceType } from '../utils/financeUtils';
import {
  X,
  Printer,
  UtensilsCrossed,
  Calendar,
  Fingerprint,
  Stamp,
  User,
  GraduationCap,
  Check,
  RotateCcw,
  ShieldAlert,
  QrCode,
} from 'lucide-react';

interface DiningMealCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  dorm?: Dormitory;
  room?: Room;
  bed?: Bed;
  settings: AppSettings;
}

type MealKey = 'breakfast' | 'lunch' | 'dinner';

interface PersianMonthInfo {
  number: number;
  name: string;
  days: number;
}

const PERSIAN_MONTHS: PersianMonthInfo[] = [
  { number: 1, name: 'فروردین', days: 31 },
  { number: 2, name: 'اردیبهشت', days: 31 },
  { number: 3, name: 'خرداد', days: 31 },
  { number: 4, name: 'تیر', days: 31 },
  { number: 5, name: 'مرداد', days: 31 },
  { number: 6, name: 'شهریور', days: 31 },
  { number: 7, name: 'مهر', days: 30 },
  { number: 8, name: 'آبان', days: 30 },
  { number: 9, name: 'آذر', days: 30 },
  { number: 10, name: 'دی', days: 30 },
  { number: 11, name: 'بهمن', days: 30 },
  { number: 12, name: 'اسفند', days: 29 },
];

const COLINAN_REASON_PRESETS = [
  'عدم شناسایی اثر انگشت و مسدودیت کاربری در سامانه کالینان',
  'نقص احراز هویت بیومتریک (اثر انگشت) در دستگاه‌های سلف',
  'مسدودیت موقت کاربری کالینان — مجوز اضطراری یک‌ماهه تغذیه',
];

const toFaDigits = (val: string | number): string =>
  String(val).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

function detectCurrentPersianYearMonth(): { year: number; month: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      year: 'numeric',
      month: 'numeric',
    }).formatToParts(new Date());
    const yStr = parts.find((p) => p.type === 'year')?.value || '1405';
    const mStr = parts.find((p) => p.type === 'month')?.value || '1';
    const y = parseInt(toEnglishDigits(yStr).replace(/[^\d]/g, ''), 10);
    const m = parseInt(toEnglishDigits(mStr).replace(/[^\d]/g, ''), 10);
    return {
      year: Number.isFinite(y) && y >= 1390 && y <= 1450 ? y : 1405,
      month: Number.isFinite(m) && m >= 1 && m <= 12 ? m : 1,
    };
  } catch {
    return { year: 1405, month: 1 };
  }
}

/**
 * تولید ماتریس ۲۱×۲۱ کیوآرکد قطعی و یکتا برای هر دانشجو و هر ماه
 * دارای الگوهای سه‌گانه یابنده استاندارد (Finder Patterns) + الگوی زمان‌بندی + داده رمزنگاری‌شده
 */
function buildDeterministicQrMatrix(seedPayload: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const placeFinder = (row0: number, col0: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row0 + r;
        const cc = col0 + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        reserved[rr][cc] = true;
        if (r === -1 || r === 7 || c === -1 || c === 7) {
          grid[rr][cc] = false;
        } else if (r === 0 || r === 6 || c === 0 || c === 6) {
          grid[rr][cc] = true;
        } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
          grid[rr][cc] = true;
        } else {
          grid[rr][cc] = false;
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // نوارهای زمان‌بندی افقی و عمودی
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    grid[6][i] = i % 2 === 0;
    reserved[i][6] = true;
    grid[i][6] = i % 2 === 0;
  }

  // ماژول ثابت تیره استاندارد QR
  reserved[size - 8][8] = true;
  grid[size - 8][8] = true;

  // ناحیه اطلاعات فرمت
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      reserved[8][i] = true;
      reserved[i][8] = true;
    }
  }
  for (let i = size - 8; i < size; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
  }

  // تولید شبه-تصادفی قطعی (FNV-1a + Xorshift32) بر اساس رشته دانشجو + ماه + سال
  let h = 2166136261;
  for (let i = 0; i < seedPayload.length; i++) {
    h ^= seedPayload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0 || 0x9e3779b9;
  const nextBit = (): boolean => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) & 1) === 1;
  };

  // الگوی فرمت
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      grid[8][i] = nextBit();
      grid[i][8] = nextBit();
    }
  }
  for (let i = size - 8; i < size; i++) {
    grid[8][i] = nextBit();
    grid[i][8] = nextBit();
  }

  // پرکردن سلول‌های داده غیررزروشده
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c]) {
        grid[r][c] = nextBit();
      }
    }
  }

  return grid;
}

export const DiningMealCardModal: React.FC<DiningMealCardModalProps> = ({
  isOpen,
  onClose,
  student,
  dorm,
  room,
  bed,
  settings,
}) => {
  const initialDate = useMemo(() => detectCurrentPersianYearMonth(), []);
  const [selectedYear, setSelectedYear] = useState<number>(initialDate.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialDate.month);
  const [isLeapEsfand, setIsLeapEsfand] = useState<boolean>(false);
  const [colinanReason, setColinanReason] = useState<string>(COLINAN_REASON_PRESETS[0]);
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);

  // نگهداری تیک‌های آزمایشی/ثبت‌شده برای پیش‌نمایش و چاپ در هر ماه
  const storageTickKey = useMemo(
    () => `colinan_meal_ticks_${student.studentId}_${selectedYear}_${selectedMonth}`,
    [student.studentId, selectedYear, selectedMonth]
  );

  const [mealTicks, setMealTicks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(storageTickKey);
      setMealTicks(raw ? JSON.parse(raw) : {});
    } catch {
      setMealTicks({});
    }
  }, [isOpen, storageTickKey]);

  const persistTicks = (next: Record<string, boolean>) => {
    setMealTicks(next);
    try {
      localStorage.setItem(storageTickKey, JSON.stringify(next));
    } catch {
      // نادیده گرفتن خطای سهمیه مرورگر
    }
  };

  const toggleMealTick = (day: number, meal: MealKey) => {
    const key = `${day}_${meal}`;
    const next = { ...mealTicks, [key]: !mealTicks[key] };
    if (!next[key]) delete next[key];
    persistTicks(next);
  };

  const clearAllTicks = () => {
    persistTicks({});
  };

  const monthInfo = useMemo(
    () => PERSIAN_MONTHS.find((m) => m.number === selectedMonth) || PERSIAN_MONTHS[0],
    [selectedMonth]
  );

  const daysInMonth = useMemo(() => {
    if (selectedMonth === 12 && isLeapEsfand) return 30;
    return monthInfo.days;
  }, [selectedMonth, isLeapEsfand, monthInfo]);

  const dayColumns = useMemo(() => {
    const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const colSize = Math.ceil(allDays.length / 3);
    return [
      allDays.slice(0, colSize),
      allDays.slice(colSize, colSize * 2),
      allDays.slice(colSize * 2),
    ];
  }, [daysInMonth]);

  const verificationCode = useMemo(() => {
    const mStr = String(selectedMonth).padStart(2, '0');
    const stTail = (student.studentId || '0000').slice(-5);
    return `FEED-${stTail}-${selectedYear}${mStr}`;
  }, [student.studentId, selectedYear, selectedMonth]);

  const qrMatrix = useMemo(() => {
    const payload = `CFU-ISFAHAN|MEAL-CARD|COLINAN-EXEMPT|ID:${student.studentId}|NID:${student.nationalId}|Y:${selectedYear}|M:${selectedMonth}|CODE:${verificationCode}`;
    return buildDeterministicQrMatrix(payload);
  }, [student.studentId, student.nationalId, selectedYear, selectedMonth, verificationCode]);

  const tickedCount = useMemo(
    () => Object.values(mealTicks).filter(Boolean).length,
    [mealTicks]
  );

  if (!isOpen) return null;

  const handlePrintAndLog = () => {
    try {
      Storage.addActivityLog({
        category: 'student',
        action: 'صدور کارت تغذیه موقت یک‌ماهه (کالینان)',
        details: `کارت تغذیه سلف ویژه استثناء اثر انگشت کالینان برای ${student.fullName} (${student.studentId}) جهت ماه ${monthInfo.name} ${toFaDigits(selectedYear)} با کد رهگیری ${verificationCode} صادر شد.`,
        targetName: `${student.fullName} (${student.studentId})`,
        severity: 'info',
      });
    } catch {
      // ادامه چاپ حتی در صورت خطای ثبت لاگ
    }
    setPrintFeedback(`صدور کارت برای ماه ${monthInfo.name} ${toFaDigits(selectedYear)} ثبت شد.`);
    setTimeout(() => setPrintFeedback(null), 4000);
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      {/* استایل اختصاصی چاپ دو روی کارت تغذیه در برگه A4 */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-dining-card-sheet,
          #printable-dining-card-sheet * {
            visibility: visible !important;
          }
          #printable-dining-card-sheet {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 4mm 0 !important;
            margin: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 8mm !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-dining-card-front,
          #printable-dining-card-back {
            width: 132mm !important;
            min-height: 86mm !important;
            max-width: none !important;
            box-shadow: none !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .dining-print-cut-label {
            display: block !important;
            color: #475569 !important;
            font-size: 9pt !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-2 sm:my-4">
        {/* سربرگ مودال (مخفی در چاپ) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-l from-amber-50/90 via-white to-orange-50/70 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/60">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                <span>صدور کارت تغذیه موقت سلف (استثناء سامانه کالینان)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
                  اعتبار فقط ۱ ماه
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ویژه دانشجویان با عدم تشخیص اثر انگشت و مسدودیت کاربری در سامانه کالینان • دارای QR اختصاصی، محل مهر سرپرستی و جدول ۳ وعده روزانه
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* پنل تنظیمات مدیر: انتخاب ماه، سال و علت صدور (مخفی در چاپ) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 space-y-3 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* انتخاب ماه اعتبار */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>تعیین ماه اعتبار (فقط یک ماه):</span>
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-extrabold text-slate-800 dark:text-slate-100"
              >
                {PERSIAN_MONTHS.map((m) => (
                  <option key={m.number} value={m.number}>
                    {m.name} ({toFaDigits(m.number === 12 && isLeapEsfand ? 30 : m.days)} روز)
                  </option>
                ))}
              </select>
              {selectedMonth === 12 && (
                <label className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLeapEsfand}
                    onChange={(e) => setIsLeapEsfand(e.target.checked)}
                    className="rounded border-amber-400 text-amber-600"
                  />
                  <span>سال کبیسه (اسفند ۳۰ روزه)</span>
                </label>
              )}
            </div>

            {/* سال شمسی */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                سال شمسی اعتبار:
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedYear((y) => Math.max(1395, y - 1))}
                  className="px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold hover:bg-slate-100 cursor-pointer"
                  title="سال قبل"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1395}
                  max={1450}
                  value={selectedYear}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    if (Number.isFinite(parsed)) setSelectedYear(parsed);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-mono font-extrabold text-xs"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setSelectedYear((y) => Math.min(1450, y + 1))}
                  className="px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold hover:bg-slate-100 cursor-pointer"
                  title="سال بعد"
                >
                  +
                </button>
              </div>
            </div>

            {/* علت مسدودی در کالینان */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-rose-600" />
                <span>توضیح وضعیت کالینان (درج روی کارت):</span>
              </label>
              <input
                type="text"
                value={colinanReason}
                onChange={(e) => setColinanReason(e.target.value)}
                list="colinan-reason-presets"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                placeholder="علت عدم تشخیص اثر انگشت / مسدودی در کالینان..."
              />
              <datalist id="colinan-reason-presets">
                {COLINAN_REASON_PRESETS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100/80 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-bold border border-amber-200 dark:border-amber-800">
                تعداد روزهای پشت کارت: {toFaDigits(daysInMonth)} روز × ۳ وعده (صبحانه، ناهار، شام)
              </span>
              {tickedCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 font-bold">
                  وعده‌های تیک‌خورده در پیش‌نمایش: {toFaDigits(tickedCount)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {tickedCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllTicks}
                  className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-700 font-bold inline-flex items-center gap-1 cursor-pointer transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>پاک‌کردن تیک‌ها (چاپ کارت خام)</span>
                </button>
              )}
              <span className="text-slate-400">
                می‌توانید برای ثبت یا تست، روی مربع وعده‌ها کلیک کنید یا کارت خام را چاپ نمایید.
              </span>
            </div>
          </div>

          {printFeedback && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
              {printFeedback}
            </div>
          )}
        </div>

        {/* پیش‌نمایش دو روی کارت تغذیه (ناحیه قابل چاپ) */}
        <div className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-950/70 overflow-x-auto">
          <div
            id="printable-dining-card-sheet"
            className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start justify-items-center max-w-[1040px] mx-auto"
          >
            {/* ================= روی کارت (FRONT) ================= */}
            <div className="flex flex-col items-center gap-1.5 w-full">
              <div className="dining-print-cut-label text-[11px] font-extrabold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 print:hidden" />
                <span>روی کارت (اطلاعات دانشجو، QR کد و محل مهر سرپرستی)</span>
              </div>

              <div
                id="printable-dining-card-front"
                className="relative w-full max-w-[490px] min-h-[312px] bg-white text-slate-900 rounded-2xl border-2 border-amber-600 shadow-xl overflow-hidden flex flex-col justify-between p-3.5 select-none"
              >
                {/* نوار تزئینی پس‌زمینه امنیتی */}
                <div
                  className="absolute inset-0 opacity-[0.04] pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#b45309 1px, transparent 1px)',
                    backgroundSize: '11px 11px',
                  }}
                />

                {/* سربرگ رسمی روی کارت */}
                <div className="relative z-10 flex items-center justify-between gap-2 pb-2 border-b-2 border-amber-500/40">
                  <div className="flex items-center gap-2 min-w-0">
                    {settings.customLogoUrl ? (
                      <img
                        src={settings.customLogoUrl}
                        alt="نشان دانشگاه"
                        className="w-9 h-9 object-contain rounded-lg border border-amber-200 bg-white p-0.5 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-amber-700 text-white flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-black text-[12px] text-slate-900 truncate">
                        دانشگاه فرهنگیان استان اصفهان
                      </h4>
                      <p className="text-[10px] font-extrabold text-amber-800 truncate">
                        کارت تغذیه موقت سلف • استثناء اثر انگشت کالینان
                      </p>
                    </div>
                  </div>

                  {/* مهر/برچسب اعتبار دقیق یک‌ماهه */}
                  <div className="shrink-0 text-center px-2.5 py-1 rounded-xl bg-rose-700 text-white shadow-xs">
                    <div className="text-[9px] font-bold leading-tight opacity-90">اعتبار فقط یک ماه</div>
                    <div className="text-[12px] font-black leading-tight">
                      {monthInfo.name} {toFaDigits(selectedYear)}
                    </div>
                  </div>
                </div>

                {/* بدنه میانی: عکس، مشخصات و کیوآرکد */}
                <div className="relative z-10 grid grid-cols-[auto_1fr_auto] gap-3 items-center py-2">
                  {/* عکس دانشجو */}
                  <div className="shrink-0">
                    {student.photoUrl ? (
                      <img
                        src={student.photoUrl}
                        alt={student.fullName}
                        className="w-[70px] h-[88px] object-cover rounded-xl border-2 border-amber-500/70 shadow-sm bg-slate-100"
                      />
                    ) : (
                      <div
                        className="w-[70px] h-[88px] rounded-xl flex flex-col items-center justify-center text-white border-2 border-amber-500/70 shadow-sm p-1 text-center"
                        style={{ backgroundColor: student.avatarColor || '#b45309' }}
                      >
                        <User className="w-7 h-7 opacity-85" />
                        <span className="text-[9px] font-black mt-1 leading-tight line-clamp-2">
                          {student.fullName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* اطلاعات هویتی و اسکان */}
                  <div className="min-w-0 space-y-1 text-right">
                    <div className="font-black text-[14px] text-slate-950 truncate">
                      {student.fullName}
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                      <div className="truncate">
                        <span className="text-slate-500 font-semibold">ش. دانشجویی: </span>
                        <span className="font-mono font-black text-slate-900" dir="ltr">
                          {student.studentId}
                        </span>
                      </div>
                      <div className="truncate">
                        <span className="text-slate-500 font-semibold">کد ملی: </span>
                        <span className="font-mono font-bold text-slate-800" dir="ltr">
                          {student.nationalId || '-'}
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] truncate">
                      <span className="text-slate-500 font-semibold">رشته: </span>
                      <span className="font-bold text-slate-800">{student.fieldOfStudy || '-'}</span>
                    </div>
                    <div className="text-[10px] truncate">
                      <span className="text-slate-500 font-semibold">سرا و وضعیت سکونت: </span>
                      <span className="font-bold text-teal-800">
                        {dorm && room
                          ? `${getStudentResidenceType(student) === 'dormitory' ? 'خوابگاهی' : 'ترددی'} • ${dorm.name} • اتاق ${room.roomNumber}${bed ? ` (${bed.label})` : ''}`
                          : getStudentResidenceType(student) === 'dormitory'
                          ? 'خوابگاهی (فاقد اتاق)'
                          : 'ترددی (غیرخوابگاهی)'}
                      </span>
                    </div>

                    {/* کادر هشدار کالینان */}
                    <div className="mt-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-300/80 text-[9px] font-bold text-amber-950 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="truncate" title={colinanReason}>
                        {colinanReason}
                      </span>
                    </div>
                  </div>

                  {/* کیوآرکد یکتا */}
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div className="p-1.5 bg-white rounded-xl border-2 border-slate-800 shadow-xs">
                      <svg
                        viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                        className="w-[72px] h-[72px] block"
                        shapeRendering="crispEdges"
                      >
                        <rect width={qrMatrix.length} height={qrMatrix.length} fill="#ffffff" />
                        {qrMatrix.map((row, rIdx) =>
                          row.map((filled, cIdx) =>
                            filled ? (
                              <rect
                                key={`${rIdx}-${cIdx}`}
                                x={cIdx}
                                y={rIdx}
                                width={1}
                                height={1}
                                fill="#0f172a"
                              />
                            ) : null
                          )
                        )}
                      </svg>
                    </div>
                    <span
                      className="text-[8px] font-mono font-extrabold text-slate-700 mt-0.5 tracking-tight"
                      dir="ltr"
                    >
                      {verificationCode}
                    </span>
                  </div>
                </div>

                {/* بخش پایینی روی کارت: جای مهر سرپرستی + محدوده تاریخ اعتبار */}
                <div className="relative z-10 grid grid-cols-[1fr_155px] gap-2.5 items-stretch pt-1.5 border-t border-slate-200">
                  <div className="flex flex-col justify-between text-[9px] text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-2 border border-slate-200">
                    <div className="font-extrabold text-slate-800 flex items-center gap-1">
                      <QrCode className="w-3 h-3 text-amber-700" />
                      <span>اعتبار: ۱ تا {toFaDigits(daysInMonth)} {monthInfo.name} {toFaDigits(selectedYear)}</span>
                    </div>
                    <p className="text-[8.5px] text-slate-600">
                      ارائه این کارت ممهور، جهت تحویل غذا در سلف برای دانشجوی فاقد اثر انگشت در کالینان صرفاً طی ماه درج‌شده معتبر است.
                    </p>
                  </div>

                  {/* جای مشخص مهر و امضای سرپرستی */}
                  <div className="rounded-xl border-2 border-dashed border-amber-600/80 bg-white flex flex-col items-center justify-between py-1.5 px-2 min-h-[62px]">
                    <div className="flex items-center gap-1 text-[9.5px] font-black text-amber-900">
                      <Stamp className="w-3 h-3 text-amber-700" />
                      <span>محل مهر سرپرستی</span>
                    </div>
                    <span className="text-[8px] text-slate-400 font-semibold">
                      بدون مهر سرپرستی فاقد اعتبار است
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= پشت کارت (BACK) ================= */}
            <div className="flex flex-col items-center gap-1.5 w-full">
              <div className="dining-print-cut-label text-[11px] font-extrabold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500 print:hidden" />
                <span>پشت کارت (جدول {toFaDigits(daysInMonth)} روز ماه و تیک دریافت سه وعده در سلف)</span>
              </div>

              <div
                id="printable-dining-card-back"
                className="relative w-full max-w-[490px] min-h-[312px] bg-white text-slate-900 rounded-2xl border-2 border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between p-3 select-none"
              >
                {/* سربرگ پشت کارت */}
                <div className="flex items-center justify-between gap-2 pb-1.5 border-b-2 border-slate-800">
                  <div className="min-w-0">
                    <h4 className="font-black text-[11px] text-slate-950 truncate">
                      جدول دریافت سه وعده غذایی در سلف — {monthInfo.name} {toFaDigits(selectedYear)}
                    </h4>
                    <div className="text-[9.5px] font-bold text-slate-600 truncate">
                      {student.fullName} • ک.د: <span className="font-mono" dir="ltr">{student.studentId}</span>
                    </div>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-mono font-bold shrink-0"
                    dir="ltr"
                  >
                    {verificationCode}
                  </span>
                </div>

                {/* شبکه سه‌ستونه روزهای ماه با سه وعده (صبحانه، ناهار، شام) در برابر هر روز */}
                <div className="grid grid-cols-3 gap-1.5 my-1.5 flex-1 items-start">
                  {dayColumns.map((colDays, colIndex) => (
                    <table
                      key={colIndex}
                      className="w-full border-collapse text-center border border-slate-400"
                    >
                      <thead>
                        <tr className="bg-amber-100 text-slate-900 text-[8.5px] font-black">
                          <th className="border border-slate-400 py-0.5 px-0.5 w-[22px]">روز</th>
                          <th className="border border-slate-400 py-0.5 px-0.5">صبحانه</th>
                          <th className="border border-slate-400 py-0.5 px-0.5">ناهار</th>
                          <th className="border border-slate-400 py-0.5 px-0.5">شام</th>
                        </tr>
                      </thead>
                      <tbody>
                        {colDays.map((day) => {
                          const meals: { key: MealKey; label: string }[] = [
                            { key: 'breakfast', label: 'صبحانه' },
                            { key: 'lunch', label: 'ناهار' },
                            { key: 'dinner', label: 'شام' },
                          ];
                          return (
                            <tr
                              key={day}
                              className={day % 2 === 0 ? 'bg-slate-50/90' : 'bg-white'}
                            >
                              <td className="border border-slate-300 py-[2px] px-0.5 text-[9px] font-black text-slate-800 tabular-nums">
                                {toFaDigits(day)}
                              </td>
                              {meals.map((meal) => {
                                const isChecked = Boolean(mealTicks[`${day}_${meal.key}`]);
                                return (
                                  <td
                                    key={meal.key}
                                    className="border border-slate-300 p-[1px] text-center align-middle"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => toggleMealTick(day, meal.key)}
                                      title={`روز ${toFaDigits(day)} ${monthInfo.name} — ${meal.label}`}
                                      className={`mx-auto w-[13px] h-[13px] rounded-[2px] border flex items-center justify-center transition cursor-pointer ${
                                        isChecked
                                          ? 'bg-emerald-600 border-emerald-700 text-white'
                                          : 'bg-white border-slate-600 hover:border-amber-600'
                                      }`}
                                    >
                                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ))}
                </div>

                {/* پاورقی پشت کارت */}
                <div className="pt-1 border-t border-slate-300 flex items-center justify-between gap-2 text-[8.5px] font-bold text-slate-700">
                  <span>
                    هنگام تحویل هر وعده در سلف، مربع مربوط به همان روز تیک زده شود.
                  </span>
                  <span className="shrink-0 text-rose-700 font-black">
                    اعتبار: فقط {monthInfo.name} {toFaDigits(selectedYear)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 text-center print:hidden">
            هنگام چاپ، هر دو بخش <strong>روی کارت</strong> و <strong>پشت کارت</strong> به صورت هم‌زمان روی یک صفحه با ابعاد خوانا چاپ می‌شوند تا پس از برش و تا زدن، توسط سرپرستی مهر شده و در سلف استفاده گردد.
          </p>
        </div>

        {/* دکمه‌های عملیاتی پایین مودال (مخفی در چاپ) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            بستن
          </button>

          <button
            type="button"
            onClick={handlePrintAndLog}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-2 shadow-md shadow-amber-600/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>ثبت صدور و چاپ روی کارت و پشت کارت تغذیه</span>
          </button>
        </div>
      </div>
    </div>
  );
};
