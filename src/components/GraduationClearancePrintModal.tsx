import React from 'react';
import { AppSettings, GraduationClearanceRequest } from '../types';
import { CLEARANCE_UNITS_META } from '../utils/storage';
import {
  X,
  Printer,
  GraduationCap,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  User,
  FileCheck2,
} from 'lucide-react';

interface GraduationClearancePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  clearance: GraduationClearanceRequest;
  settings: AppSettings;
}

export const GraduationClearancePrintModal: React.FC<GraduationClearancePrintModalProps> = ({
  isOpen,
  onClose,
  clearance,
  settings,
}) => {
  if (!isOpen) return null;

  const approvedCount = CLEARANCE_UNITS_META.filter(
    (u) => clearance.units?.[u.role]?.status === 'approved'
  ).length;
  const isCompleted = clearance.status === 'completed' || approvedCount === CLEARANCE_UNITS_META.length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-graduation-clearance,
          #printable-graduation-clearance * {
            visibility: visible !important;
          }
          #printable-graduation-clearance {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 8mm !important;
            background: #ffffff !important;
            color: #0f172a !important;
            border: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-4">
        {/* نوار کنترل غیرقابل چاپ */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                فرم رسمی تسویه حساب الکترونیک فراغت از تحصیل (نسخه چاپی A4)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                جهت چاپ و تحویل به اداره امور فارغ‌التحصیلان دانشگاه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ فرم تسویه حساب</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 transition cursor-pointer"
              title="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* بدنه قابل چاپ */}
        <div className="p-4 sm:p-6 bg-slate-100/70 dark:bg-slate-950/60 max-h-[82vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 print:bg-white">
          <div
            id="printable-graduation-clearance"
            dir="rtl"
            className="bg-white text-slate-900 rounded-xl border-2 border-slate-800 p-5 sm:p-7 shadow-sm space-y-5"
          >
            {/* سربرگ رسمی دانشگاه */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b-2 border-slate-800">
              <div className="flex items-center gap-3">
                {settings.customLogoUrl ? (
                  <img
                    src={settings.customLogoUrl}
                    alt="نشان دانشگاه"
                    className="w-16 h-16 object-contain rounded-lg border border-slate-200 p-1"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-teal-50 border-2 border-teal-700 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-9 h-9 text-teal-800" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-slate-600">جمهوری اسلامی ایران • وزارت آموزش و پرورش</p>
                  <h1 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                    دانشگاه فرهنگیان استان اصفهان
                  </h1>
                  <p className="text-xs font-bold text-teal-800 mt-0.5">
                    سامانه جامع خدمات دانشگاهی — برگ تسویه حساب الکترونیک فراغت از تحصیل
                  </p>
                </div>
              </div>

              <div className="text-left text-xs space-y-1 shrink-0 border border-slate-300 rounded-lg p-2.5 bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 font-bold">کد رهگیری:</span>
                  <span className="font-mono font-black text-slate-900" dir="ltr">
                    {clearance.trackingCode}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 font-bold">تاریخ ثبت:</span>
                  <span className="font-bold text-slate-800">{clearance.requestedAt}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 font-bold">تاریخ تکمیل:</span>
                  <span className="font-bold text-emerald-700">
                    {clearance.completedAt || 'در حال تکمیل'}
                  </span>
                </div>
              </div>
            </div>

            {/* مشخصات دانش‌آموخته به همراه عکس پرسنلی */}
            <div className="flex flex-col sm:flex-row items-stretch gap-4 p-3.5 rounded-xl border border-slate-300 bg-slate-50/70">
              <div className="w-24 h-32 sm:w-28 sm:h-36 rounded-xl border-2 border-slate-400 bg-white overflow-hidden flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                {clearance.studentPhotoUrl ? (
                  <img
                    src={clearance.studentPhotoUrl}
                    alt={clearance.studentName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                    <User className="w-8 h-8 mb-1" />
                    <span className="text-[10px] font-bold">محل الصاق عکس</span>
                  </div>
                )}
              </div>

              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">نام و نام خانوادگی:</span>
                  <span className="font-black text-slate-900 text-sm">{clearance.studentName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">شماره دانشجویی:</span>
                  <span className="font-mono font-black text-slate-900" dir="ltr">
                    {clearance.studentId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">کد ملی:</span>
                  <span className="font-mono font-bold text-slate-800" dir="ltr">
                    {clearance.studentNationalId || '---'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">نام پدر:</span>
                  <span className="font-bold text-slate-800">{clearance.studentFatherName || '---'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">رشته تحصیلی:</span>
                  <span className="font-bold text-slate-900">{clearance.studentFieldOfStudy}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">ورودی:</span>
                  <span className="font-bold text-slate-800">{clearance.studentEntryTerm}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">سال و نیمسال فراغت:</span>
                  <span className="font-bold text-teal-800">
                    {clearance.graduationAcademicYear} — {clearance.graduationSemester}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">شماره تماس:</span>
                  <span className="font-mono font-bold text-slate-800" dir="ltr">
                    {clearance.studentPhone || '---'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">سرا / اتاق (در صورت اسکان):</span>
                  <span className="font-bold text-slate-800">
                    {clearance.dormName
                      ? `${clearance.dormName}${clearance.roomNumber ? ` - اتاق ${clearance.roomNumber}` : ''}`
                      : 'غیرساکن / تخلیه شده'}
                  </span>
                </div>
              </div>
            </div>

            {/* وضعیت تاییدیه واحد آموزش و مدیر گروه رشته (گزارش ۱۰۵۰ گلستان) */}
            <div className="space-y-2">
              <div className="px-3.5 py-2.5 rounded-lg border border-teal-300 bg-teal-50/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
                  <span className="font-extrabold text-teal-950">
                    مرحله ۱ — تاییدیه کارشناس آموزش (بررسی اولیه پرونده):
                  </span>
                  <span className="font-bold text-teal-800">
                    {clearance.educationGateStatus === 'approved' ? 'تایید شده' : 'در انتظار تایید'}
                  </span>
                </div>
                {clearance.educationReviewerName && (
                  <span className="text-[11px] text-teal-900 font-bold">
                    کارشناس آموزش: {clearance.educationReviewerName} ({clearance.educationReviewedAt})
                  </span>
                )}
              </div>

              <div className="px-3.5 py-2.5 rounded-lg border border-indigo-300 bg-indigo-50/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-700 shrink-0" />
                  <span className="font-extrabold text-indigo-950">
                    مرحله ۲ — تاییدیه مدیر گروه رشته (گذراندن واحدهای الزامی سرفصل طبق گزارش ۱۰۵۰ سامانه گلستان):
                  </span>
                  <span className="font-bold text-indigo-800">
                    {clearance.deptHeadGateStatus === 'approved' || clearance.deptHeadReport1050Verified
                      ? 'تایید شده (انطباق گزارش ۱۰۵۰)'
                      : clearance.status === 'in_clearance' || clearance.status === 'completed'
                      ? 'تایید شده (پرونده پیشین)'
                      : clearance.deptHeadGateStatus === 'rejected'
                      ? 'رد شده (نقص سرفصل)'
                      : 'در انتظار تایید مدیر گروه'}
                  </span>
                </div>
                {clearance.deptHeadReviewerName && (
                  <span className="text-[11px] text-indigo-900 font-bold">
                    مدیر گروه: {clearance.deptHeadReviewerName} ({clearance.deptHeadReviewedAt})
                  </span>
                )}
              </div>
            </div>

            {/* جدول تاییدیه کلیه واحدهای سامانه */}
            <div>
              <h2 className="text-xs font-black text-slate-800 mb-2 flex items-center justify-between">
                <span>جدول تاییدیه‌های الکترونیک واحدهای دانشگاهی ({approvedCount} از {CLEARANCE_UNITS_META.length} واحد تایید شده)</span>
                <span className={isCompleted ? 'text-emerald-700' : 'text-amber-700'}>
                  {isCompleted ? 'وضعیت نهایی: تسویه کامل تایید شده' : 'وضعیت: در حال تکمیل'}
                </span>
              </h2>
              <table className="w-full border-collapse border border-slate-400 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-400 px-2 py-1.5 text-center w-8">ردیف</th>
                    <th className="border border-slate-400 px-2.5 py-1.5 text-right">نام واحد</th>
                    <th className="border border-slate-400 px-2 py-1.5 text-center w-24">وضعیت</th>
                    <th className="border border-slate-400 px-2.5 py-1.5 text-right">مسئول تاییدکننده</th>
                    <th className="border border-slate-400 px-2 py-1.5 text-center w-28">تاریخ بررسی</th>
                    <th className="border border-slate-400 px-2.5 py-1.5 text-right">توضیحات</th>
                  </tr>
                </thead>
                <tbody>
                  {CLEARANCE_UNITS_META.map((u, index) => {
                    const rec = clearance.units?.[u.role];
                    const st = rec?.status || 'pending';
                    return (
                      <tr key={u.role} className={index % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                        <td className="border border-slate-400 px-2 py-1.5 text-center font-mono font-bold">
                          {index + 1}
                        </td>
                        <td className="border border-slate-400 px-2.5 py-1.5 font-extrabold text-slate-900">
                          {u.label}
                        </td>
                        <td className="border border-slate-400 px-2 py-1.5 text-center font-bold">
                          {st === 'approved' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              تایید شد
                            </span>
                          ) : st === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 text-rose-700">
                              <XCircle className="w-3.5 h-3.5" />
                              دارای نقص
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700">
                              <Clock className="w-3.5 h-3.5" />
                              در انتظار
                            </span>
                          )}
                        </td>
                        <td className="border border-slate-400 px-2.5 py-1.5 text-slate-800 font-medium">
                          {rec?.reviewerName || '---'}
                        </td>
                        <td className="border border-slate-400 px-2 py-1.5 text-center text-[10px] text-slate-700">
                          {rec?.reviewedAt || '---'}
                        </td>
                        <td className="border border-slate-400 px-2.5 py-1.5 text-slate-700">
                          {rec?.note || '---'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* بخش امضا و تحویل به اداره امور فارغ‌التحصیلان */}
            <div className="pt-3 border-t-2 border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="border border-slate-300 rounded-lg p-3 min-h-[76px] flex flex-col justify-between">
                <p className="font-bold text-slate-700">امضاء و اثر انگشت دانش‌آموخته:</p>
                <p className="text-[10px] text-slate-500">
                  اینجانب {clearance.studentName} صحت کلیه مندرجات فوق را تایید می‌نمایم.
                </p>
              </div>
              <div className="border border-slate-300 rounded-lg p-3 min-h-[76px] flex flex-col justify-between">
                <p className="font-bold text-slate-700">مهر و امضاء معاونت دانشجویی / آموزش:</p>
                <p className="text-[10px] text-slate-500">
                  صحت تاییدیه‌های الکترونیک سامانه جامع خدمات دانشگاهی تایید می‌گردد.
                </p>
              </div>
              <div className={`border rounded-lg p-3 min-h-[76px] flex flex-col justify-between ${clearance.graduationFinalized ? 'border-emerald-500 bg-emerald-50/70' : 'border-slate-300'}`}>
                <div className="flex items-center justify-between gap-1">
                  <p className="font-bold text-slate-800">تحویل و ثبت در اداره امور فارغ‌التحصیلان:</p>
                  {clearance.graduationFinalized && (
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded">
                      خاتمه‌یافته
                    </span>
                  )}
                </div>
                {clearance.graduationFinalized ? (
                  <div className="text-[10px] text-slate-700 space-y-0.5 mt-1">
                    <p>
                      <span className="font-bold">کارشناس تاییدکننده:</span> {clearance.graduationFinalizedBy || '---'}
                    </p>
                    <p>
                      <span className="font-bold">تاریخ خاتمه:</span> {clearance.graduationFinalizedAt || '---'} •{' '}
                      <span className="font-bold">شماره بایگانی:</span>{' '}
                      <span className="font-mono font-black" dir="ltr">
                        {clearance.graduationArchiveNumber || '---'}
                      </span>
                    </p>
                    {clearance.graduationFinalNote && (
                      <p className="text-[9.5px] text-slate-600">{clearance.graduationFinalNote}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500">
                    تاریخ تحویل: ...... / ...... / 140.... • شماره پرونده: ............
                  </p>
                )}
              </div>
            </div>

            <p className="text-[10px] text-center text-slate-500 pt-1">
              این فرم به صورت الکترونیک در «سامانه جامع خدمات دانشگاهی دانشگاه فرهنگیان استان اصفهان» صادر شده و با کد رهگیری{' '}
              <span className="font-mono font-bold">{clearance.trackingCode}</span> قابل استعلام می‌باشد.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
