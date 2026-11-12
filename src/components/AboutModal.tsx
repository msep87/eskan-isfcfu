import React from 'react';
import {
  X,
  GraduationCap,
  Sparkles,
  School,
  Building2,
  ShieldCheck,
  Code2,
  Mail,
  UserCheck,
  CheckCircle,
  HeartHandshake,
  Layers,
  FileDown,
  FileText,
} from 'lucide-react';
import { FarhangianEmblem } from './FarhangianEmblem';
import { downloadSystemWordDocument } from '../utils/docExportUtils';

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
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">

        {/* سربرگ مودال */}
        <div className="relative bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 text-white p-6 sm:p-7 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md p-2 border border-white/20 flex items-center justify-center shadow-lg">
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
                  پلتفرم یکپارچه هوشمند خدمات اسکان، پایش، شیفت‌بندی، انبار و تأسیسات سراها
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
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                    طراح، تحلیل‌گر و سازنده سامانه:
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400" dir="ltr">
                    <Mail className="w-3 h-3 text-teal-600" />
                    <span>m.sep87@gmail.com</span>
                  </span>
                </div>
                <h4 className="font-black text-base text-slate-900 dark:text-white">
                  دکتر محمد سپیانی
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                  طراحی و پیاده‌سازی شده با بهره‌گیری از معماری مدرن نرم‌افزاری جهت بهینه‌سازی فرآیندهای زیست دانشجویی و هوشمندسازی مدیریت خوابگاه‌های دانشگاه فرهنگیان.
                </p>
              </div>
            </div>
          </div>

          {/* دکمه اختصاصی دانلود فایل ورد جامع و کامل مستندات سامانه */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  دانلود سند جامع تحلیلی، فنی و راهنمای عملیاتی سامانه (فایل Word)
                </h5>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  فایل کامل و دقیق شامل تشریح تمامی ۱۰ ماژول، ماتریس دسترسی‌ها، ماهیت شبانه‌روزی و مشخصات سازنده
                </p>
              </div>
            </div>

            <button
              onClick={downloadSystemWordDocument}
              className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer shrink-0"
            >
              <FileDown className="w-4 h-4" />
              <span>دانلود فایل ورد (.doc)</span>
            </button>
          </div>

          {/* ۲. درباره دانشگاه فرهنگیان و ویژگی شبانه‌روزی بودن */}
          <div className="space-y-2.5 text-right">
            <div className="flex items-center gap-2">
              <School className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                درباره دانشگاه فرهنگیان و ماهیت شبانه‌روزی سراهای دانشجویی
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-justify bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              دانشگاه فرهنگیان، به عنوان دانشگاه استراتژیک، مادر و مأموریت‌محور در جمهوری اسلامی ایران، عهده‌دار رسالت خطیر تأمین، تربیت و توانمندسازی معلمان و مربیان صالح و شایسته برای نسل آینده کشور است.
              یکی از ویژگی‌های بنیادین و منحصر‌به‌فرد این دانشگاه، <strong className="text-teal-700 dark:text-teal-300 font-bold">شبانه‌روزی بودن</strong> آن است. در دانشگاه فرهنگیان، سراهای دانشجویی صرفاً محلی برای خواب و استراحت فیزیکی نیستند؛ بلکه یک <strong className="text-teal-700 dark:text-teal-300 font-bold">زیست‌بوم تربیتی، فرهنگی، علمی و مهارتی پویا</strong> هستند که در آن منش معلمی، مسئولیت‌پذیری جمعی، اخلاق‌مداری و مهارت‌های همزیستی در بستر تعاملات شبانه‌روزی دانشجومعلمان شکل می‌گیرد.
            </p>
          </div>

          {/* ۳. درباره اهداف و قابلیت‌های سامانه جامع سراها */}
          <div className="space-y-2.5 text-right">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                اهداف و دستاوردهای سامانه جامع سراهای دانشجویی
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>انتخاب اتاق و تخت هوشمند با نمای گرافیکی و رعایت ظرفیت و شرایط رشته‌ها</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>کارت شناسایی اسکان هوشمند در ابعاد استاندارد بانکی (CR80) با کیوآرکد اصالت</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>شیفت‌بندی خودکار و تقویمی سرپرستان سراها همراه با بارگذاری مستقیم فایل اکسل</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>دفتر وقایع روزانه و ثبت گزارش شیفت‌های سرپرستی جهت تبادل پیوسته اطلاعات بین شیفت‌ها</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>زنجیره پیوسته درخواست قطعه تأسیساتی، تأیید سرپرست و صدور حواله کسر از انبار</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>گزارش‌گیری تحلیلی چندحوزه‌ای در بازه‌های زمانی دلخواه با خروجی اکسل و چاپ</span>
              </div>
            </div>
          </div>

        </div>

        {/* نوار پایین مودال */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="text-[11px] text-slate-400">
            سال تحصیلی فعال: ۱۴۰۵-۱۴۰۶ • نسخه جامع مدیریت سراها
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadSystemWordDocument}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>دانلود مستندات (Word)</span>
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
