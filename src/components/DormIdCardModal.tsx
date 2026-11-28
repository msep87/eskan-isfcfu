import React, { useEffect, useRef, useState } from 'react';
import { Student, Dormitory, Room, Bed, AppSettings } from '../types';
import {
  generateQrCodeDataUrl,
  getStudentCardBarcodeValue,
  getStudentCardQrPayload,
  renderCode128ToSvg,
} from '../utils/dormBarcodeUtils';
import {
  X,
  Printer,
  ShieldCheck,
  User,
  GraduationCap,
  CheckCircle2,
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
  const barcodeSvgRef = useRef<SVGSVGElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const barcodeValue = getStudentCardBarcodeValue(student);
  const qrPayload = getStudentCardQrPayload(student);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    void generateQrCodeDataUrl(qrPayload, 160)
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, qrPayload]);

  useEffect(() => {
    if (!isOpen) return;
    renderCode128ToSvg(barcodeSvgRef.current, barcodeValue, {
      width: 1.35,
      height: 22,
      displayValue: false,
      margin: 3,
    });
  }, [isOpen, barcodeValue]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const academicYear = settings.currentAcademicYear || '۱۴۰۵-۱۴۰۶';

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
                کارت شناسایی اسکان (دارای بارکد واقعی ۱بعدی و QR)
              </h3>
              <p className="text-[10px] text-slate-400">
                ابعاد استاندارد جیبی (CR80) قابل قرائت با انواع دستگاه بارکدخوان لیزری و دوربین
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
            className="relative w-[388px] sm:w-[416px] h-[252px] bg-gradient-to-br from-teal-900 via-teal-950 to-slate-950 text-white rounded-2xl p-3 shadow-2xl border border-teal-500/40 overflow-hidden flex flex-col justify-between select-none"
            style={{
              boxShadow: '0 15px 35px -5px rgba(13, 148, 136, 0.3), 0 0 0 1px rgba(20, 184, 166, 0.2)',
            }}
          >
            {/* واترماک و خطوط موج امنیتی پس‌زمینه کارت بانکی */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:12px_12px]" />
            <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-teal-500/20 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />

            {/* ردیف سربرگ کارت */}
            <div className="flex items-center justify-between pb-1.5 border-b border-teal-500/30 relative z-10">
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
                    سامانه جامع خدمات دانشگاهی • کارت تردد و اسکان سرای دانشجویی
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
            <div className="flex items-center gap-2.5 py-1 relative z-10">
              {/* عکس پرسنلی */}
              <div className="relative shrink-0">
                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={student.fullName}
                    className="w-15 h-19 sm:w-[64px] sm:h-[82px] object-cover rounded-xl border border-teal-400/60 shadow-md bg-slate-900"
                  />
                ) : (
                  <div
                    className="w-15 h-19 sm:w-[64px] sm:h-[82px] rounded-xl flex flex-col items-center justify-center border border-teal-400/60 shadow-md p-1"
                    style={{ backgroundColor: student.avatarColor || '#0d9488' }}
                  >
                    <User className="w-6 h-6 opacity-80" />
                    <span className="text-[8.5px] font-black text-center mt-1 leading-none">{student.fullName}</span>
                  </div>
                )}
                <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
              </div>

              {/* مشخصات کلیدی و بدون زواید */}
              <div className="flex-1 min-w-0 space-y-1 text-right">
                <div className="flex items-baseline justify-between gap-1">
                  <h2 className="font-extrabold text-xs sm:text-sm text-white truncate">
                    {student.fullName}
                  </h2>
                  <span className="text-[9px] text-teal-300 font-mono shrink-0" dir="ltr">
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
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="px-2 py-0.5 rounded-lg bg-teal-800/80 border border-teal-600/40 text-[9.5px] font-bold text-white">
                    اتاق {room?.roomNumber || '---'}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-900/80 border border-emerald-600/40 text-[9.5px] font-bold text-emerald-200">
                    {bed?.label || 'تخت مصوب'}
                  </span>
                </div>
              </div>

              {/* کیوآرکد واقعی استاندارد ۲بعدی برای اسکن سریع */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className="w-16 h-16 bg-white rounded-lg p-1 border border-teal-200/90 shadow-xs flex items-center justify-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR ${barcodeValue}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-[8px] font-mono text-slate-400">QR</span>
                  )}
                </div>
                <span className="text-[8px] font-mono text-teal-200 mt-0.5 font-bold" dir="ltr">
                  {qrPayload}
                </span>
              </div>
            </div>

            {/* نوار پایین کارت: بارکد خطی واقعی Code-128 قابل قرائت با بارکدخوان لیزری + کد دانشجویی */}
            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-teal-500/30 text-[9px] relative z-10">
              <div className="bg-white rounded-md px-1.5 py-0.5 flex items-center shadow-xs shrink-0">
                <svg
                  ref={barcodeSvgRef}
                  className="h-6 max-w-[195px] block"
                  aria-label={`Code128 ${barcodeValue}`}
                />
              </div>

              <div className="text-left min-w-0">
                <div className="font-mono font-extrabold text-[10px] text-amber-300 truncate" dir="ltr">
                  {barcodeValue}
                </div>
                <div className="text-[8px] font-semibold text-teal-200/90 truncate">
                  بارکد واقعی حضور و تردد
                </div>
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
