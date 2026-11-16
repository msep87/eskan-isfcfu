import React from 'react';
import {
  X,
  School,
  UserCheck,
  CheckCircle,
  Mail,
  Layers,
  FileDown,
  FileText,
  Printer,
  Sparkles,
} from 'lucide-react';
import { FarhangianEmblem } from './FarhangianEmblem';
import { downloadSystemPdfDocument } from '../utils/docExportUtils';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  customLogoUrl?: string;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  customLogoUrl,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">

        {/* سربرگ مودال */}
        <div className="relative bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 text-white p-6 sm:p-7 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md p-2 border border-white/20 flex items-center justify-center shadow-lg shrink-0">
                <FarhangianEmblem size={36} customLogoUrl={customLogoUrl} />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-500/30 text-teal-200 text-[10px] font-bold border border-teal-400/30 mb-1">
                  دانشگاه فرهنگیان استان اصفهان
                </span>
                <h3 className="font-black text-lg sm:text-xl text-white">
                  سامانه جامع سراهای دانشجویی
                </h3>
                <p className="text-xs text-teal-200/90 font-medium">
                  زیست‌بوم هوشمند اسکان، تربیت معلم، امور فرهنگی، دانشجویی، مشاوره، آموزش، مالی و تأسیسات
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* محتوای توضیحات */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[70vh] overflow-y-auto">

          {/* ۱. معرفی طراح و سازنده سامانه */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-teal-500/5 border border-amber-500/20 dark:border-amber-500/30">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1 text-right flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                    طراح، معمار سامانه و تحلیل‌گر ارشد:
                  </span>
                  <a
                    href="mailto:m.sepiani@cfu.ac.ir"
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono text-teal-700 dark:text-teal-300 bg-white/80 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800 hover:underline"
                    dir="ltr"
                  >
                    <Mail className="w-3 h-3 text-teal-600" />
                    <span>m.sepiani@cfu.ac.ir</span>
                  </a>
                </div>
                <h4 className="font-black text-base text-slate-900 dark:text-white">
                  دکتر محمد سپیانی
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                  طراحی و پیاده‌سازی‌شده بر پایه شناخت میدانی زیست‌بوم شبانه‌روزی دانشگاه فرهنگیان، با هدف یکپارچه‌سازی کامل فرآیندهای اسکان، امور تربیتی و فرهنگی، خدمات دانشجویی، سلامت روان، پشتیبانی فنی و شفافیت مدیریتی.
                </p>
              </div>
            </div>
          </div>

          {/* دکمه اختصاصی دانلود فایل PDF سند جامع تحلیلی، فنی و راهنمای عملیاتی سامانه */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-blue-50 to-indigo-50 dark:from-rose-950/30 dark:via-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  دریافت سند جامع تحلیلی، فنی و راهنمای عملیاتی سامانه (فایل PDF)
                </h5>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                  مستند کامل و دسته‌بندی‌شده شامل فلسفه شبانه‌روزی و رسالت تربیت معلم، تشریح ۱۸ ماژول، ماتریس ۱۱ نقش کاربری، سناریوهای عملیاتی و معماری فنی
                </p>
              </div>
            </div>

            <button
              onClick={downloadSystemPdfDocument}
              className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ / ذخیره PDF</span>
            </button>
          </div>

          {/* ۲. درباره دانشگاه فرهنگیان و ویژگی شبانه‌روزی بودن و رسالت تربیت معلم */}
          <div className="space-y-2.5 text-right">
            <div className="flex items-center gap-2">
              <School className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                ماهیت شبانه‌روزی دانشگاه فرهنگیان و رسالت بنیادین تربیت معلم
              </h4>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-justify bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
              <p>
                دانشگاه فرهنگیان به عنوان دانشگاه راهبردی، مادر و مأموریت‌محور کشور در نظام آموزش عالی و سند تحول بنیادین، عهده‌دار خطیرترین مسئولیت ملی یعنی <strong className="text-teal-700 dark:text-teal-300 font-bold">جذب، آموزش و تربیت معلمان و مربیان آینده ایران اسلامی</strong> است.
              </p>
              <p>
                یکی از ارکان هویتی و منحصر‌به‌فرد این دانشگاه، <strong className="text-teal-700 dark:text-teal-300 font-bold">شبانه‌روزی بودن (Boarding Nature)</strong> آن است. در دانشگاه فرهنگیان، سراهای دانشجویی صرفاً خوابگاه یا محل استراحت شبانه نیستند؛ بلکه ادامه طبیعی کلاس تربیت و یک <strong className="text-teal-700 dark:text-teal-300 font-bold">«زیست‌بوم تربیتی، فرهنگی، اخلاقی، اجتماعی و مهارتی پیوسته»</strong> محسوب می‌شوند که در آن منش معلمی، قانون‌مداری، همزیستی مسئولانه، مشارکت فرهنگی و صنفی و سلامت جسم و روان دانشجومعلمان شکل می‌گیرد.
              </p>
            </div>
          </div>

          {/* ۳. درباره اهداف و قابلیت‌های دسته‌بندی‌شده سامانه جامع سراها */}
          <div className="space-y-3 text-right">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                اهداف و منظومه قابلیت‌های یکپارچه سامانه (۱۱ نقش تخصصی)
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>انتخاب گرافیکی اتاق و تخت، حریم خصوصی کامل اطلاعات هم‌اتاقی‌ها، کارت هوشمند CR-80 با کیوآرکد، درخواست جابجایی، مهمان و انصراف</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>مدیریت تفکیکی اتاق‌ها با امتیاز دوگانه انضباط و نظافت، مرکز اقدام بالای هر اتاق، گزارش بازدید سرپرستان و چاپ عمودی/افقی با تنظیم حاشیه</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>کارتابل امور فرهنگی: جدول زمانی هفتگی برنامه‌های فرهنگی (برنامه کلاسی) پس از تأیید، تشکل‌ها و انجمن‌های دانشجویی و پیام‌رسانی بدون دسترسی به اطلاعات شخصی</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>کارتابل امور دانشجویی و تربیت بدنی: پایش دانشجویان خوابگاهی و ترددی، انتخابات شورای صنفی در بازه زمانی فعال، و رسیدگی به پرونده‌های ارجاعی شورای انضباطی</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>کارشناس آموزش (پیام‌رسانی تکی و گروهی به رشته/ورودی و اعلام مرخصی/اخراج به مدیر) و مرکز مشاوره و صیانت محرمانه</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>نظرسنجی‌های دوره‌ای کیفیت خدمات (سراها، سلف، تأسیسات و سرپرستان) با اکسل، اطلاعیه‌های غنی صفحه اول با لایت‌باکس تصویر و بازیابی دوعاملی رمز دانشجو</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2 sm:col-span-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>زنجیره یکپارچه تأسیسات، انبارداری و کارپردازی خرید، واحد امور مالی (۴۵٪ خوابگاهی / ۲۵٪ ترددی و اکسل بدهی)، شیفت‌بندی سرپرستان، دفتر وقایع روزانه و لاگ امنیتی فعالیت‌ها</span>
              </div>
            </div>
          </div>

        </div>

        {/* نوار پایین مودال */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="text-[11px] text-slate-400">
            سال تحصیلی فعال: ۱۴۰۵-۱۴۰۶ • نسخه جامع ۱۱ نقشه مدیریت سراهای دانشگاه فرهنگیان
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadSystemPdfDocument}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>دریافت مستندات (PDF)</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
