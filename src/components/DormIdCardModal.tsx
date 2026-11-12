import React, { useRef } from 'react';
import { Student, Dormitory, Room, Bed, AppSettings } from '../types';
import {
  X,
  Printer,
  ShieldCheck,
  User,
  GraduationCap,
  Building,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface DormIdCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  dorm?: Dormitory;
  room?: Room;
  bed?: Bed;
  settings: AppSettings;
}

export const DormIdCardModal: React.FC<DormIdCardModalProps> = ({
  isOpen,
  onClose,
  student,
  dorm,
  room,
  bed,
  settings,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const academicYear = settings.currentAcademicYear || '۱۴۰۵-۱۴۰۶';
  const verificationCode = `FAR-${student.studentId.slice(-4)}-${room?.roomNumber || '00'}`;

  // کیوآرکد هندسی دقیق و اصیل برای اعتبارسنجی کارت
  const renderQrCodeSvg = () => (
    <svg viewBox="0 0 100 100" className="w-16 h-16 bg-white p-1 rounded-lg border border-teal-200/80 shadow-xs shrink-0">
      {/* گوشه بالا راست */}
      <rect x="5" y="5" width="26" height="26" fill="#0d9488" rx="4" />
      <rect x="9" y="9" width="18" height="18" fill="#ffffff" rx="2" />
      <rect x="13" y="13" width="10" height="10" fill="#0d9488" rx="2" />

      {/* گوشه بالا چپ */}
      <rect x="69" y="5" width="26" height="26" fill="#0d9488" rx="4" />
      <rect x="73" y="9" width="18" height="18" fill="#ffffff" rx="2" />
      <rect x="77" y="13" width="10" height="10" fill="#0d9488" rx="2" />

      {/* گوشه پایین راست */}
      <rect x="5" y="69" width="26" height="26" fill="#0d9488" rx="4" />
      <rect x="9" y="73" width="18" height="18" fill="#ffffff" rx="2" />
      <rect x="13" y="77" width="10" height="10" fill="#0d9488" rx="2" />

      {/* نقاط داده داخلی */}
      <rect x="36" y="8" width="6" height="6" fill="#0f766e" />
      <rect x="48" y="8" width="6" height="6" fill="#0f766e" />
      <rect x="58" y="14" width="6" height="6" fill="#0f766e" />
      <rect x="36" y="24" width="8" height="8" fill="#0f766e" />
      <rect x="50" y="24" width="6" height="6" fill="#0f766e" />
      <rect x="10" y="38" width="8" height="8" fill="#0f766e" />
      <rect x="24" y="38" width="6" height="6" fill="#0f766e" />
      <rect x="36" y="38" width="10" height="10" fill="#0f766e" />
      <rect x="52" y="38" width="8" height="8" fill="#0f766e" />
      <rect x="68" y="38" width="6" height="6" fill="#0f766e" />
      <rect x="82" y="38" width="8" height="8" fill="#0f766e" />
      <rect x="14" y="52" width="6" height="6" fill="#0f766e" />
      <rect x="38" y="52" width="6" height="6" fill="#0f766e" />
      <rect x="50" y="52" width="10" height="10" fill="#0f766e" />
      <rect x="74" y="52" width="8" height="8" fill="#0f766e" />
      <rect x="38" y="68" width="8" height="8" fill="#0f766e" />
      <rect x="54" y="68" width="6" height="6" fill="#0f766e" />
      <rect x="72" y="68" width="6" height="6" fill="#0f766e" />
      <rect x="84" y="68" width="8" height="8" fill="#0f766e" />
      <rect x="38" y="82" width="6" height="6" fill="#0f766e" />
      <rect x="52" y="82" width="8" height="8" fill="#0f766e" />
      <rect x="70" y="82" width="6" height="6" fill="#0f766e" />
      <rect x="86" y="82" width="6" height="6" fill="#0f766e" />
    </svg>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      {/* سبک چاپ اختصاصی در ابعاد دقیق کارت بانکی CR-80 */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-dorm-card, #printable-dorm-card * {
            visibility: visible;
          }
          #printable-dorm-card {
            position: fixed;
            left: 20mm;
            top: 20mm;
            width: 85.6mm !important;
            height: 53.98mm !important;
            margin: 0 !important;
            padding: 3mm !important;
            border-radius: 3.18mm !important;
            box-shadow: none !important;
            border: 1px solid #0d9488 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4">
        {/* سربرگ مودال */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                کارت شناسایی اسکان (ابعاد استاندارد کارت شناسایی / بانکی)
              </h3>
              <p className="text-[10px] text-slate-400">
                ابعاد استاندارد جیبی (CR80) با کیوآرکد هوشمند اعتبارسنجی
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* پیش‌نمایش کارت */}
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-slate-100/70 dark:bg-slate-950/50">
          <div
            ref={cardRef}
            id="printable-dorm-card"
            className="relative w-[380px] sm:w-[410px] h-[245px] bg-gradient-to-br from-teal-900 via-teal-950 to-slate-950 text-white rounded-2xl p-3.5 shadow-2xl border border-teal-500/40 overflow-hidden flex flex-col justify-between select-none"
            style={{
              boxShadow: '0 15px 35px -5px rgba(13, 148, 136, 0.3), 0 0 0 1px rgba(20, 184, 166, 0.2)',
            }}
          >
            {/* واترماک و خطوط موج امنیتی پس‌زمینه کارت بانکی */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:12px_12px]" />
            <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-teal-500/20 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />

            {/* ردیف سربرگ کارت */}
            <div className="flex items-center justify-between pb-2 border-b border-teal-500/30 relative z-10">
              <div className="flex items-center gap-2">
                {settings.customLogoUrl ? (
                  <img
                    src={settings.customLogoUrl}
                    alt="نشان دانشگاه"
                    className="w-7 h-7 object-contain bg-white rounded-md p-0.5"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-md bg-teal-600/60 border border-teal-400/40 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-amber-300" />
                  </div>
                )}
                <div>
                  <h4 className="font-black text-[11px] leading-tight text-teal-100 tracking-tight">
                    دانشگاه فرهنگیان استان اصفهان
                  </h4>
                  <span className="text-[9px] text-teal-300/90 font-medium">
                    سامانه جامع سراهای دانشجویی • کارت اسکان
                  </span>
                </div>
              </div>

              {/* برچسب سال تحصیلی */}
              <div className="text-left font-mono">
                <span className="px-1.5 py-0.5 rounded-md bg-teal-800/80 border border-teal-600/50 text-[9px] font-bold text-teal-200">
                  {academicYear}
                </span>
              </div>
            </div>

            {/* بدنه اطلاعات دانشجو در ابعاد فشرده کارت بانکی */}
            <div className="flex items-center gap-3 py-1.5 relative z-10">
              {/* عکس پرسنلی */}
              <div className="relative shrink-0">
                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={student.fullName}
                    className="w-16 h-20 sm:w-[68px] sm:h-[86px] object-cover rounded-xl border border-teal-400/60 shadow-md bg-slate-900"
                  />
                ) : (
                  <div
                    className="w-16 h-20 sm:w-[68px] sm:h-[86px] rounded-xl flex flex-col items-center justify-center border border-teal-400/60 shadow-md p-1"
                    style={{ backgroundColor: student.avatarColor || '#0d9488' }}
                  >
                    <User className="w-7 h-7 opacity-80" />
                    <span className="text-[9px] font-black text-center mt-1 leading-none">{student.fullName}</span>
                  </div>
                )}
                <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
              </div>

              {/* مشخصات کلیدی و بدون زواید */}
              <div className="flex-1 min-w-0 space-y-1 text-right">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-extrabold text-xs sm:text-sm text-white truncate">
                    {student.fullName}
                  </h2>
                  <span className="text-[9px] text-teal-300 font-mono" dir="ltr">
                    {student.nationalId}
                  </span>
                </div>

                <div className="text-[10px] text-teal-200/90 truncate">
                  رشته: <span className="font-bold text-white">{student.fieldOfStudy}</span>
                </div>

                <div className="text-[10px] text-teal-200/90 truncate">
                  سرا: <span className="font-bold text-amber-200">{dorm?.name || 'سرای دانشجویی'}</span>
                </div>

                {/* موقعیت اسکان: اتاق و تخت */}
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="px-2 py-0.5 rounded-lg bg-teal-800/80 border border-teal-600/40 text-[10px] font-bold text-white">
                    اتاق {room?.roomNumber || '---'}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-900/80 border border-emerald-600/40 text-[10px] font-bold text-emerald-200">
                    {bed?.label || 'تخت مصوب'}
                  </span>
                </div>
              </div>

              {/* کیوآرکد برای اصالت و اسکن کارت */}
              <div className="flex flex-col items-center justify-center shrink-0">
                {renderQrCodeSvg()}
                <span className="text-[8px] font-mono text-teal-300/80 mt-1" dir="ltr">
                  {verificationCode}
                </span>
              </div>
            </div>

            {/* نوار پایین کارت: شبیه‌ساز چیپ امنیتی و بارکد شماره دانشجویی */}
            <div className="flex items-center justify-between pt-1.5 border-t border-teal-500/30 text-[9px] relative z-10">
              <div className="flex items-center gap-1.5 text-teal-300">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[9px] font-semibold text-teal-200">
                  کارت رسمی معتبر دارای کیوآرکد اصالت
                </span>
              </div>

              <div className="font-mono font-bold text-[10px] text-amber-300" dir="ltr">
                کد: {student.studentId}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 text-center">
            این کارت در ابعاد استاندارد جیبی (بانکی) طراحی شده و با چاپ آن، آماده قرارگیری در جاکارتی یا پرس است.
          </p>
        </div>

        {/* دکمه‌های عملیاتی مودال */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            بستن
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-600/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ در اندازه کارت بانکی (Print)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
