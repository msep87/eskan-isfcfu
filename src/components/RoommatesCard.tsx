import React, { useState } from 'react';
import { Student, Dormitory, Room, Bed, RoomWarning } from '../types';
import { Storage } from '../utils/storage';
import {
  Users,
  Bed as BedIcon,
  Phone,
  MapPin,
  GraduationCap,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  Building,
  CheckCircle2,
  Calendar,
  Layers,
  Heart,
  Clock,
  FileText,
  Send,
  Check,
  X,
  ArrowUpDown,
} from 'lucide-react';

interface RoommatesCardProps {
  student: Student;
  dorm?: Dormitory;
  room?: Room;
  bed?: Bed;
  roommates: { student: Student; bed: Bed }[];
  roomWarnings: RoomWarning[];
  onSelectBedClick: () => void;
  isSelectionActive: boolean;
}

export const RoommatesCard: React.FC<RoommatesCardProps> = ({
  student,
  dorm,
  room,
  bed,
  roommates,
  roomWarnings,
  onSelectBedClick,
  isSelectionActive,
}) => {
  // فرم درخواست تغییر اتاق و تخت
  const [isChangeRequestModalOpen, setIsChangeRequestModalOpen] = useState(false);
  const [changeReason, setChangeReason] = useState('مسائل جسمانی / پزشکی و نیاز به طبقه پایین');
  const [preferredTier, setPreferredTier] = useState<'lower' | 'upper' | 'any'>('lower');
  const [preferredRoom, setPreferredRoom] = useState('');
  const [changeDetails, setChangeDetails] = useState('');
  const [requestSentFeedback, setRequestSentFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitChangeRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !dorm) return;

    setIsSubmitting(true);
    try {
      const messages = Storage.getMessages();
      const currentBedNum =
        bed?.bedNumber ??
        (bed?.bunkNumber ? (bed.tier === 'lower' ? bed.bunkNumber * 2 - 1 : bed.bunkNumber * 2) : '');

      const newMsg = {
        id: `msg_transfer_${Date.now()}`,
        senderId: student.studentId,
        senderName: student.fullName,
        senderRole: 'student' as const,
        receiverType: 'supervisor' as const,
        subject: `درخواست جابجایی و تغییر اتاق/تخت - دانشجومعلم ${student.fullName} (${student.studentId})`,
        category: 'accommodation' as const,
        content: `درخواست رسمی جابجایی و تغییر اتاق/تخت خوابگاه:
• مشخصات دانشجو: ${student.fullName} | رشته: ${student.fieldOfStudy} | ورودی: ${student.entryTerm}
• شماره دانشجویی: ${student.studentId} | شماره تماس: ${student.mobile || student.phone || '-'}
• اسکان فعلی: ${dorm.name} - اتاق ${room.roomNumber} - ${bed?.label || `تخت شماره ${currentBedNum}`} (${bed?.tier === 'lower' ? 'طبقه پایین' : 'طبقه بالا'})
• علت اصلی درخواست: ${changeReason}
• اولویت طبقه درخواستی: ${preferredTier === 'lower' ? 'طبقه پایین (تخت فرد)' : preferredTier === 'upper' ? 'طبقه بالا (تخت زوج)' : 'فرقی ندارد'}
• اتاق یا سرای پیشنهادی دانشجو: ${preferredRoom.trim() || 'طبق ظرفیت خالی و صلاحدید سرپرستی'}
• توضیحات و ادله متقاضی: ${changeDetails.trim() || 'توضیحات تکمیلی درج نشده است.'}`,
        date: new Date().toLocaleDateString('fa-IR'),
        status: 'pending' as const,
        replies: [],
      };

      messages.unshift(newMsg);
      Storage.setMessages(messages);

      setRequestSentFeedback(
        'درخواست تغییر اتاق و تخت شما با موفقیت ثبت شد و جهت بررسی در کارتابل سرپرست سرا و مدیریت قرار گرفت.'
      );
      setChangeDetails('');
      setPreferredRoom('');
      setTimeout(() => {
        setIsChangeRequestModalOpen(false);
        setRequestSentFeedback('');
      }, 2500);
    } catch (err: any) {
      alert('خطا در ثبت درخواست: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // اگر دانشجو هنوز اتاقی انتخاب نکرده است (مثلاً ستون‌های اسکان در اکسل خالی بوده‌اند)
  if (!student.assignedBedId || !room || !dorm) {
    return (
      <div className="bg-gradient-to-br from-teal-500/10 via-amber-500/5 to-cyan-500/10 dark:from-teal-950/30 dark:via-slate-900 dark:to-slate-900 rounded-3xl p-6 sm:p-8 border border-dashed border-teal-300 dark:border-teal-800 text-center relative overflow-hidden">
        <div className="max-w-xl mx-auto">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/30 mb-4 animate-bounce">
            <BedIcon className="w-8 h-8" />
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-xs font-black mb-3 border border-amber-300 dark:border-amber-700">
            وضعیت: فاقد تخصیص اولیه اتاق (ستون‌های اسکان در اکسل خالی بوده است)
          </div>

          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
            شما باید خودتان اتاق و تخت را انتخاب نمایید!
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
            اطلاعات اسکان شما در فایل اکسل اولیه دانشگاه تعیین نشده است. بنابراین می‌توانید به صورت آنلاین، مستقیم و تعاملی از روی نقشه بصری سراها، اتاق و تخت خالی مورد نظر خود را با مشاهده مشخصات هم‌اتاقی‌ها انتخاب کنید.
          </p>

          <div className="p-3 mb-6 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 flex items-center justify-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-teal-600" />
            <span>
              <strong>قاعده شماره تخت‌ها:</strong> شماره‌های فرد (۱، ۳، ۵، ۷، ...) طبقه پایین و شماره‌های زوج (۲، ۴، ۶، ۸، ...) طبقه بالا هستند.
            </span>
          </div>

          <button
            onClick={onSelectBedClick}
            disabled={!isSelectionActive}
            className={`px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl transition flex items-center justify-center gap-2 mx-auto cursor-pointer ${
              isSelectionActive
                ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/30 hover:scale-105'
                : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isSelectionActive ? 'شروع فرایند انتخاب اتاق و تخت بصری' : 'سامانه انتخاب اتاق در حال حاضر غیرفعال است'}</span>
          </button>
        </div>
      </div>
    );
  }

  const activeWarnings = roomWarnings.filter((w) => !w.resolved);

  return (
    <div className="space-y-6">

      {/* بنر اخطار انضباطی یا بهداشتی اتاق در صورت وجود */}
      {activeWarnings.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 shadow-xs animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-600 text-white shrink-0 mt-0.5 shadow-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-extrabold text-sm sm:text-base text-rose-900 dark:text-rose-100">
                  ⚠️ اخطار سرپرستی به ساکنین اتاق {room.roomNumber}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-bold">
                  نیازمند توجه فوری
                </span>
              </div>
              {activeWarnings.map((warn) => (
                <div key={warn.id} className="text-xs text-rose-800 dark:text-rose-200 mt-1 leading-relaxed">
                  <span className="font-bold">{warn.title}: </span>
                  <span>{warn.description}</span>
                  <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-1">
                    ثبت شده توسط: {warn.supervisorName} • تاریخ: {warn.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* کارت خلاصه اتاق و تخت شما */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-500 text-white flex items-center justify-center text-xl font-black shadow-md shadow-teal-600/20">
              {room.roomNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  اتاق {room.roomNumber} • {dorm.name}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800">
                  {dorm.campus}
                </span>
                {student.assignmentStatus === 'temporary' ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-extrabold border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>تخصیص موقت</span>
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-extrabold border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>تخصیص قطعی</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                <span>طبقه: {room.floor === 0 ? 'همکف' : room.floor}</span>
                <span>•</span>
                <span>ظرفیت: {room.capacity} نفره</span>
                <span>•</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">
                  تخت شما: {bed?.label || 'تخت مشخص شده'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onSelectBedClick}
              disabled={!isSelectionActive}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isSelectionActive
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
              title="تغییر مستقیم تخت از روی نقشه آنلاین سراها"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>تغییر بصری از روی نقشه</span>
            </button>

            <button
              onClick={() => setIsChangeRequestModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shadow-xs"
              title="ارسال فرم رسمی درخواست تغییر اتاق و تخت برای بررسی سرپرستی و مدیریت"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>ثبت فرم درخواست جابجایی</span>
            </button>
          </div>
        </div>

        {/* امکانات اتاق */}
        <div className="pt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">امکانات اتاق:</span>
          {room.facilities.map((fac, idx) => (
            <span
              key={idx}
              className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
            >
              ✓ {fac}
            </span>
          ))}
        </div>
      </div>

      {/* لیست مشخصات هم‌اتاقی‌ها */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
              مشخصات هم‌اتاقی‌های شما در اتاق {room.roomNumber} ({roommates.length} نفر ساکن)
            </h4>
          </div>
          <span className="text-xs text-slate-400">
            {room.capacity - roommates.length} تخت خالی در این اتاق
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roommates.map(({ student: rm, bed: rmBed }) => {
            const isMe = rm.studentId === student.studentId;
            const isRepresentative = room.representativeStudentId === rm.studentId;

            return (
              <div
                key={rm.studentId}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border transition shadow-xs relative overflow-hidden ${
                  isMe
                    ? 'border-teal-400 dark:border-teal-600 ring-2 ring-teal-500/20'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* نشانگر خود دانشجو یا نماینده */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    {isMe && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-600 text-white font-extrabold">
                        پروفایل شما
                      </span>
                    )}
                    {isRepresentative && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                        🌟 نماینده رسمی اتاق
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
                    {rmBed.label}
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  {/* عکس یا آواتار دانشجو */}
                  {rm.photoUrl ? (
                    <img
                      src={rm.photoUrl}
                      alt={rm.fullName}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-sm shrink-0"
                      style={{ backgroundColor: rm.avatarColor || '#0d9488' }}
                    >
                      {rm.fullName.slice(0, 2)}
                    </div>
                  )}

                  {/* مشخصات فردی هم‌اتاقی */}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {rm.fullName}
                    </h5>

                    <div className="mt-1 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">{rm.fieldOfStudy} (ورودی {rm.entryTerm})</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>استان {rm.province}، شهر {rm.city}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span dir="ltr">{rm.mobile}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* فیلدهای سفارشی (گروه خونی، رشته ورزشی و علایق) */}
                {rm.customFields && Object.keys(rm.customFields).length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                    {Object.entries(rm.customFields).map(([key, val]) => (
                      <span
                        key={key}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-medium"
                      >
                        {key}: {String(val)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* مدال ثبت فرم درخواست رسمی تغییر اتاق و تخت */}
      {isChangeRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    فرم درخواست رسمی جابجایی و تغییر اتاق / تخت
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ارسال مستقیم به کارتابل سرپرستی سرا و مدیریت دانشگاه
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChangeRequestModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {requestSentFeedback ? (
              <div className="my-8 p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2 animate-in zoom-in-95">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-100">
                  درخواست شما با موفقیت ثبت شد
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  {requestSentFeedback}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitChangeRequest} className="space-y-4 my-4">
                {/* اسکان فعلی دانشجو */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 text-xs">
                  <span className="text-slate-400 block mb-1">اسکان فعلی شما:</span>
                  <div className="font-black text-slate-800 dark:text-slate-100 flex items-center justify-between">
                    <span>
                      {dorm.name} • اتاق {room.roomNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold">
                      {bed?.label || 'تخت مشخص شده'}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    قاعده تخت‌ها: شماره‌های فرد (۱، ۳، ۵، ۷...) پایین و شماره‌های زوج (۲، ۴، ۶، ۸...) بالا هستند.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    علت اصلی تقاضای جابجایی:
                  </label>
                  <select
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="مسائل جسمانی / پزشکی و نیاز به طبقه پایین">
                      مسائل جسمانی / پزشکی و نیاز به طبقه پایین (تخت فرد)
                    </option>
                    <option value="تقاضای اسکان در کنار هم‌رشته‌ای‌ها یا هم‌ورودی‌ها">
                      تقاضای اسکان در کنار هم‌رشته‌ای‌ها یا هم‌ورودی‌ها
                    </option>
                    <option value="عدم هماهنگی ساعات مطالعه یا سر و صدا در اتاق">
                      عدم هماهنگی ساعات مطالعه یا سر و صدا در اتاق
                    </option>
                    <option value="شرایط محیطی، نورگیری یا تهویه اتاق">
                      شرایط محیطی، نورگیری یا تهویه اتاق
                    </option>
                    <option value="جابجایی توافقی با یکی از هم‌دانشگاهیان">
                      جابجایی توافقی با یکی از هم‌دانشگاهیان
                    </option>
                    <option value="سایر موارد و دلایل تحصیلی/شخصی">سایر موارد و دلایل تحصیلی/شخصی</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اولویت طبقه تخت مورد تقاضا:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPreferredTier('lower')}
                      className={`p-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        preferredTier === 'lower'
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      طبقه پایین ⬇️
                      <span className="block text-[10px] font-normal opacity-80">(تخت فرد ۱،۳،۵...)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredTier('upper')}
                      className={`p-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        preferredTier === 'upper'
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      طبقه بالا ⬆️
                      <span className="block text-[10px] font-normal opacity-80">(تخت زوج ۲،۴،۶...)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredTier('any')}
                      className={`p-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        preferredTier === 'any'
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      فرقی ندارد
                      <span className="block text-[10px] font-normal opacity-80">(هر دو طبقه)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شماره اتاق یا سرای پیشنهادی (اختیاری):
                  </label>
                  <input
                    type="text"
                    value={preferredRoom}
                    onChange={(e) => setPreferredRoom(e.target.value)}
                    placeholder="مثلاً اتاق ۱۰۳ سرای باهنر، یا خالی بگذارید..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    توضیحات و شرح ادله درخواست:
                  </label>
                  <textarea
                    rows={3}
                    value={changeDetails}
                    onChange={(e) => setChangeDetails(e.target.value)}
                    placeholder="لطفاً دلایل تقاضای جابجایی خود را به طور کامل توضیح دهید..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsChangeRequestModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'در حال ارسال...' : 'ارسال رسمی درخواست به سرپرستی'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
