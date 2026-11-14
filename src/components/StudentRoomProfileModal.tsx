import React, { useState, useEffect, useMemo } from 'react';
import {
  Student,
  Dormitory,
  Room,
  Bed,
  StudentEvaluation,
  Message,
  MessageCategory,
} from '../types';
import { Storage } from '../utils/storage';
import { toEnglishDigits } from '../utils/excelUtils';
import {
  X,
  User,
  Phone,
  MapPin,
  Building2,
  Bed as BedIcon,
  Award,
  AlertTriangle,
  MessageSquareWarning,
  FileText,
  Send,
  History,
  CheckCircle2,
  Trash2,
  ZoomIn,
  ShieldAlert,
  Sparkles,
  Users,
  Lock,
  MessageSquare,
} from 'lucide-react';

interface StudentRoomProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  dorm?: Dormitory | null;
  room?: Room | null;
  bed?: Bed | null;
  actorName: string;
  actorRole: 'admin' | 'supervisor';
  actorId?: string;
  onDataChanged: () => void;
}

type ModalTab = 'report_warning' | 'evaluation' | 'message' | 'history';

const MESSAGE_CATEGORIES: { value: MessageCategory; label: string }[] = [
  { value: 'accommodation', label: 'امور اسکان و اتاق' },
  { value: 'discipline', label: 'نظم و انضباط سرا' },
  { value: 'services_cleaning', label: 'خدمات، نظافت و بهداشت' },
  { value: 'rights_violation', label: 'رعایت حقوق هم‌اتاقی‌ها' },
  { value: 'counseling', label: 'مشاوره و سلامت روان' },
  { value: 'social_personal', label: 'امور فردی و دانشجویی' },
  { value: 'maintenance', label: 'تأسیسات و تعمیرات' },
  { value: 'request', label: 'مرخصی و تردد' },
  { value: 'other', label: 'سایر موارد' },
];

export const StudentRoomProfileModal: React.FC<StudentRoomProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  dorm,
  room,
  bed,
  actorName,
  actorRole,
  actorId,
  onDataChanged,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('report_warning');
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  // تب ۱: ثبت گزارش / تذکر / اخطار
  const [recordType, setRecordType] = useState<'report' | 'notice' | 'warning'>('report');
  const [recordScope, setRecordScope] = useState<'individual' | 'room'>('individual');
  const [recordApplyRoommates, setRecordApplyRoommates] = useState(false);
  const [alsoAddRoomWarning, setAlsoAddRoomWarning] = useState(false);
  const [recordTitle, setRecordTitle] = useState('');
  const [recordDesc, setRecordDesc] = useState('');

  // تب ۲: ثبت نمره ارزیابی
  const [evalScope, setEvalScope] = useState<'individual' | 'room'>('individual');
  const [evalApplyRoommates, setEvalApplyRoommates] = useState(false);
  const [evalScore, setEvalScore] = useState('100');
  const [evalTitle, setEvalTitle] = useState('');
  const [evalDesc, setEvalDesc] = useState('');

  // تب ۳: ارسال پیام مستقیم
  const [msgCategory, setMsgCategory] = useState<MessageCategory>('accommodation');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [msgConfidential, setMsgConfidential] = useState(false);

  useEffect(() => {
    if (!isOpen || !student) return;
    setActiveTab('report_warning');
    setIsPhotoZoomed(false);
    setFeedback(null);
    setRecordType('report');
    setRecordScope('individual');
    setRecordApplyRoommates(false);
    setAlsoAddRoomWarning(false);
    setRecordTitle('');
    setRecordDesc('');
    setEvalScope('individual');
    setEvalApplyRoommates(false);
    setEvalScore(String(student.previousScore ?? 100));
    setEvalTitle('');
    setEvalDesc('');
    setMsgCategory('accommodation');
    setMsgSubject('');
    setMsgContent('');
    setMsgConfidential(false);
  }, [isOpen, student?.studentId]);

  const studentEvaluations = useMemo<StudentEvaluation[]>(() => {
    void refreshTick;
    if (!student) return [];
    const all = Storage.getStudentEvaluations();
    return all.filter(
      (e) =>
        e.studentId === student.studentId ||
        (e.scope === 'room' && room?.id && e.roomId === room.id)
    );
  }, [student, room?.id, refreshTick, isOpen]);

  const studentMessages = useMemo<Message[]>(() => {
    void refreshTick;
    if (!student) return [];
    return Storage.getMessages().filter(
      (m) => m.senderId === student.studentId || m.receiverId === student.studentId
    );
  }, [student, refreshTick, isOpen]);

  if (!isOpen || !student) return null;

  const isRepresentative = Boolean(room?.representativeStudentId === student.studentId);
  const effectiveRoleLabel = actorRole === 'admin' ? 'مدیریت کل امور سراها' : 'سرپرست سرا';

  const recordPresets =
    recordType === 'report'
      ? [
          'گزارش وضعیت اسکان و حضور دانشجو',
          'گزارش بازرسی اتاق و وضعیت وسایل',
          'گزارش درخواست یا پیگیری امور دانشجویی',
          'گزارش وضعیت بهداشت و نظم فردی',
        ]
      : recordType === 'notice'
      ? [
          'تذکر رعایت نظافت و بهداشت اتاق',
          'تذکر رعایت ساعت خاموشی و آرامش',
          'تذکر چیدمان و نظم وسایل شخصی',
          'تذکر صرفه‌جویی در مصرف آب و برق',
        ]
      : [
          'اخطار رسمی نقض مقررات انضباطی سرا',
          'اخطار ایجاد مزاحمت و رعایت نکردن آرامش',
          'اخطار آسیب به تجهیزات و اموال سرا',
          'اخطار غیبت غیرموجه یا تأخیر مکرر',
        ];

  const evalPresets =
    evalScope === 'individual'
      ? [
          'ارزیابی نظم و انضباط فردی',
          'ارزیابی بهداشت و نظافت شخصی',
          'ارزیابی تعامل و رعایت حقوق هم‌اتاقی‌ها',
          'ارزیابی پایان‌ترم سرای دانشجویی',
        ]
      : [
          'ارزیابی نظافت و آراستگی اتاق',
          'ارزیابی نظم و نگهداری اموال اتاق',
          'بازرسی دوره‌ای بهداشت محیط اتاق',
        ];

  const msgPresets = [
    'اطلاع‌رسانی درباره وضعیت اسکان / اتاق',
    'دعوت به مراجعه جهت گفتگو با سرپرستی',
    'پیگیری وضعیت نظافت و انضباط اتاق',
    'تذکر محرمانه جهت اصلاح رفتار یا نظم',
  ];

  const handleSubmitReportWarning = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!recordTitle.trim()) {
      setFeedback({ ok: false, msg: 'لطفاً عنوان گزارش، تذکر یا اخطار را وارد نمایید.' });
      return;
    }

    const res = Storage.addStudentEvaluation(
      {
        studentId: student.studentId,
        studentName: student.fullName,
        dormId: dorm?.id || student.assignedDormId,
        dormName: dorm?.name || student.assignedDormName,
        roomId: room?.id || student.assignedRoomId,
        roomNumber: room?.roomNumber || student.assignedRoomNumber,
        type: recordType,
        scope: recordScope,
        title: recordTitle.trim(),
        description: recordDesc.trim() || recordTitle.trim(),
        evaluatorName: actorName || effectiveRoleLabel,
        evaluatorRole: actorRole,
      },
      recordScope === 'room' && recordApplyRoommates
    );

    if (
      recordType === 'warning' &&
      recordScope === 'room' &&
      alsoAddRoomWarning &&
      room &&
      (dorm?.id || student.assignedDormId)
    ) {
      Storage.addRoomWarning({
        dormId: dorm?.id || student.assignedDormId || '',
        roomId: room.id,
        title: recordTitle.trim(),
        description: recordDesc.trim() || `اخطار ثبت‌شده برای اتاق ${room.roomNumber}`,
        severity: 'warning',
        date: new Date().toLocaleDateString('fa-IR'),
        supervisorName: actorName || effectiveRoleLabel,
        resolved: false,
      });
    }

    setFeedback({ ok: res.success, msg: res.message });
    setRecordTitle('');
    setRecordDesc('');
    setAlsoAddRoomWarning(false);
    setRefreshTick((t) => t + 1);
    onDataChanged();
  };

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const parsed = Number(toEnglishDigits(evalScore.trim()));
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      setFeedback({ ok: false, msg: 'نمره ارزیابی باید عددی معتبر بین ۰ تا ۱۰۰ باشد.' });
      return;
    }
    const numericScore = Math.round(parsed * 10) / 10;

    if (!evalTitle.trim()) {
      setFeedback({ ok: false, msg: 'لطفاً عنوان ارزیابی را وارد نمایید.' });
      return;
    }

    const res = Storage.addStudentEvaluation(
      {
        studentId: student.studentId,
        studentName: student.fullName,
        dormId: dorm?.id || student.assignedDormId,
        dormName: dorm?.name || student.assignedDormName,
        roomId: room?.id || student.assignedRoomId,
        roomNumber: room?.roomNumber || student.assignedRoomNumber,
        type: 'evaluation',
        scope: evalScope,
        score: numericScore,
        title: evalTitle.trim(),
        description:
          evalDesc.trim() ||
          `نمره ارزیابی ${evalScope === 'room' ? 'اتاق' : 'فردی'}: ${numericScore} از ۱۰۰`,
        evaluatorName: actorName || effectiveRoleLabel,
        evaluatorRole: actorRole,
      },
      evalScope === 'room' && evalApplyRoommates
    );

    setFeedback({ ok: res.success, msg: res.message });
    setEvalTitle('');
    setEvalDesc('');
    setRefreshTick((t) => t + 1);
    onDataChanged();
  };

  const handleSubmitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!msgSubject.trim() || !msgContent.trim()) {
      setFeedback({ ok: false, msg: 'لطفاً موضوع و متن پیام را به صورت کامل وارد نمایید.' });
      return;
    }

    const nowFa = new Date().toLocaleDateString('fa-IR');
    Storage.addMessage({
      senderId: actorId || actorRole,
      senderName: actorName || effectiveRoleLabel,
      senderRole: actorRole,
      receiverType: 'student',
      receiverId: student.studentId,
      subject: msgSubject.trim(),
      content: msgContent.trim(),
      category: msgCategory,
      date: nowFa,
      isConfidential: msgConfidential,
    });

    Storage.addActivityLog({
      category: 'student',
      action: 'ارسال پیام مستقیم به دانشجو',
      actorName: actorName || effectiveRoleLabel,
      actorRole,
      targetName: `${student.fullName} (${student.studentId})`,
      details: `پیام با موضوع «${msgSubject.trim()}» از نمای اتاق برای دانشجو «${student.fullName}» ارسال گردید.`,
    });

    setFeedback({
      ok: true,
      msg: `پیام با موفقیت به صندوق پیام‌های «${student.fullName}» ارسال و در سرور ذخیره شد.`,
    });
    setMsgSubject('');
    setMsgContent('');
    setMsgConfidential(false);
    setRefreshTick((t) => t + 1);
    onDataChanged();
  };

  const customFieldEntries = student.customFields
    ? Object.entries(student.customFields).filter(
        ([, v]) => v !== undefined && v !== null && String(v).trim() !== ''
      )
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[93vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* دکمه بستن */}
        <button
          type="button"
          onClick={onClose}
          className="sticky top-4 float-left ml-4 mt-4 z-10 p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer shadow-xs"
          title="بستن پنجره"
        >
          <X className="w-5 h-5" />
        </button>

        {/* هدر پرونده دانشجو و عکس */}
        <div className="p-5 sm:p-6 bg-gradient-to-l from-teal-700 via-teal-800 to-slate-900 text-white rounded-t-3xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* عکس دانشجو با قابلیت بزرگ‌نمایی */}
            <div className="relative shrink-0">
              {student.photoUrl ? (
                <button
                  type="button"
                  onClick={() => setIsPhotoZoomed(true)}
                  className="group relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-4 border-white/25 shadow-xl cursor-pointer block"
                  title="کلیک برای بزرگ‌نمایی عکس دانشجو"
                >
                  <img
                    src={student.photoUrl}
                    alt={student.fullName}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                  />
                  <span className="absolute bottom-1.5 left-1.5 p-1 rounded-lg bg-black/60 text-white opacity-90 group-hover:opacity-100">
                    <ZoomIn className="w-3.5 h-3.5" />
                  </span>
                </button>
              ) : (
                <div
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl flex flex-col items-center justify-center text-white font-black text-4xl border-4 border-white/25 shadow-xl"
                  style={{ backgroundColor: student.avatarColor || '#0d9488' }}
                >
                  <span>{(student.fullName || 'د').slice(0, 1)}</span>
                  <span className="text-[10px] font-semibold text-white/80 mt-1">بدون عکس</span>
                </div>
              )}
            </div>

            {/* مشخصات اصلی و موقعیت اتاق */}
            <div className="flex-1 text-center sm:text-right space-y-2.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="font-black text-lg sm:text-xl text-white">
                  {student.fullName}
                </h3>
                {isRepresentative && (
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/90 text-white text-[11px] font-extrabold border border-purple-300/40">
                    🌟 نماینده اتاق
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                    student.isProfileCompleted
                      ? 'bg-emerald-500/25 text-emerald-100 border border-emerald-300/40'
                      : 'bg-amber-500/30 text-amber-100 border border-amber-300/40'
                  }`}
                >
                  {student.isProfileCompleted ? 'پرونده تکمیل‌شده' : 'پرونده در انتظار تکمیل'}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-teal-100">
                <span className="px-2.5 py-1 rounded-xl bg-white/10 font-mono font-bold">
                  کد دانشجویی: {student.studentId}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white/10 font-mono">
                  کد ملی: {student.nationalId || 'ثبت نشده'}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white/10">
                  {student.fieldOfStudy || 'رشته نامشخص'} • ورودی {student.entryTerm || '-'}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 text-white font-bold">
                  <Building2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {dorm?.name || student.assignedDormName || 'سرای نامشخص'} • اتاق{' '}
                    {room?.roomNumber || student.assignedRoomNumber || '-'}
                  </span>
                </span>
                {bed && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 text-white font-bold">
                    <BedIcon className="w-3.5 h-3.5 text-teal-200" />
                    <span>{bed.label}</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/30 border border-emerald-300/40 text-emerald-50 font-black">
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  <span>نمره ارزیابی فعلی: {student.previousScore ?? 100} از ۱۰۰</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* اطلاعات تکمیلی دانشجو */}
        <div className="p-5 sm:p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-100 mb-3">
              <User className="w-4 h-4 text-teal-600" />
              <span>مشخصات فردی، تماس و اسکان دانشجو</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block">نام پدر</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {student.fatherName || 'ثبت نشده'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block">تاریخ تولد</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {student.birthDate || 'ثبت نشده'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block">استان و شهر</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {[student.province, student.city].filter(Boolean).join(' / ') || 'ثبت نشده'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block">دین و مذهب</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {student.religion || 'ثبت نشده'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-teal-600" /> همراه دانشجو
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100" dir="ltr">
                  {student.mobile || 'ثبت نشده'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block">تماس والدین</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100" dir="ltr">
                  {student.parentPhone || 'ثبت نشده'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block">تماس ضروری</span>
                <span className="font-mono font-bold text-rose-700 dark:text-rose-300" dir="ltr">
                  {student.emergencyPhone || 'ثبت نشده'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block">تلفن ثابت</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100" dir="ltr">
                  {student.phone || 'ثبت نشده'}
                </span>
              </div>
              {(student.previousDorm || student.previousRoom) && (
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 col-span-2">
                  <span className="text-[10px] text-slate-400 block">سابقه اسکان سال قبل</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {student.previousDorm || '-'} {student.previousRoom ? `(اتاق ${student.previousRoom})` : ''}
                  </span>
                </div>
              )}
              {student.postalAddress && (
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 col-span-2">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-teal-600" /> نشانی محل سکونت
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {student.postalAddress}
                  </span>
                </div>
              )}
              {customFieldEntries.map(([k, v]) => (
                <div
                  key={k}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700"
                >
                  <span className="text-[10px] text-slate-400 block">{k}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* تب‌های عملیات روی دانشجو */}
          <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('report_warning');
                setFeedback(null);
              }}
              className={`flex-1 min-w-[145px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'report_warning'
                  ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>ثبت گزارش / تذکر / اخطار</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('evaluation');
                setFeedback(null);
              }}
              className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'evaluation'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>ثبت نمره ارزشیابی</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('message');
                setFeedback(null);
              }}
              className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'message'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>ارسال پیام به دانشجو</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('history');
                setFeedback(null);
              }}
              className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
              }`}
            >
              <History className="w-4 h-4" />
              <span>سوابق و پیام‌ها ({studentEvaluations.length + studentMessages.length})</span>
            </button>
          </div>

          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border animate-in fade-in ${
                feedback.ok
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedback.msg}</span>
            </div>
          )}

          {/* تب ۱: ثبت گزارش / تذکر / اخطار */}
          {activeTab === 'report_warning' && (
            <form onSubmit={handleSubmitReportWarning} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    نوع ثبت
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setRecordType('report')}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        recordType === 'report'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>گزارش</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecordType('notice')}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        recordType === 'notice'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
                      }`}
                    >
                      <MessageSquareWarning className="w-3.5 h-3.5" />
                      <span>تذکر</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecordType('warning')}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        recordType === 'warning'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>اخطار رسمی</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    گستره ثبت
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setRecordScope('individual')}
                      className={`py-2 px-3 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        recordScope === 'individual'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>فردی (شخص دانشجو)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecordScope('room')}
                      className={`py-2 px-3 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        recordScope === 'room'
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>اتاق (کل اتاق)</span>
                    </button>
                  </div>
                </div>
              </div>

              {recordScope === 'room' && room && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-teal-800 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 px-3.5 py-2.5 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recordApplyRoommates}
                      onChange={(e) => setRecordApplyRoommates(e.target.checked)}
                      className="rounded border-teal-400 text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span className="font-bold">
                      ثبت همزمان برای همه هم‌اتاقی‌های ساکن در اتاق {room.roomNumber}
                    </span>
                  </label>

                  {recordType === 'warning' && (
                    <label className="flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 px-3.5 py-2.5 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alsoAddRoomWarning}
                        onChange={(e) => setAlsoAddRoomWarning(e.target.checked)}
                        className="rounded border-rose-400 text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                      <span className="font-bold">
                        درج همزمان در جدول اخطارهای انضباطی اتاق
                      </span>
                    </label>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>عناوین آماده:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recordPresets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setRecordTitle(p)}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950/60 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  عنوان {recordType === 'report' ? 'گزارش' : recordType === 'notice' ? 'تذکر' : 'اخطار'} *
                </label>
                <input
                  type="text"
                  value={recordTitle}
                  onChange={(e) => setRecordTitle(e.target.value)}
                  placeholder="عنوان گزارش، تذکر یا اخطار را بنویسید..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  شرح و جزئیات
                </label>
                <textarea
                  rows={3}
                  value={recordDesc}
                  onChange={(e) => setRecordDesc(e.target.value)}
                  placeholder="توضیحات کامل گزارش یا تذکر جهت ثبت در سوابق دانشجو و مشاهده در سرور ابری..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition cursor-pointer ${
                    recordType === 'report'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : recordType === 'notice'
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {recordType === 'report'
                    ? 'ثبت گزارش در پرونده دانشجو'
                    : recordType === 'notice'
                    ? 'ثبت تذکر برای دانشجو'
                    : 'ثبت اخطار رسمی برای دانشجو'}
                </button>
              </div>
            </form>
          )}

          {/* تب ۲: ثبت نمره ارزشیابی */}
          {activeTab === 'evaluation' && (
            <form onSubmit={handleSubmitEvaluation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  گستره نمره ارزشیابی
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl max-w-md">
                  <button
                    type="button"
                    onClick={() => setEvalScope('individual')}
                    className={`py-2 px-3 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      evalScope === 'individual'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>نمره فردی دانشجو</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvalScope('room')}
                    className={`py-2 px-3 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      evalScope === 'room'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>نمره ارزشیابی اتاق</span>
                  </button>
                </div>
              </div>

              {evalScope === 'room' && room && (
                <label className="flex items-center gap-2 text-xs text-teal-800 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 px-3.5 py-2.5 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={evalApplyRoommates}
                    onChange={(e) => setEvalApplyRoommates(e.target.checked)}
                    className="rounded border-teal-400 text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  <span className="font-bold">
                    اعمال همزمان این نمره در پرونده تمامی هم‌اتاقی‌های اتاق {room.roomNumber}
                  </span>
                </label>
              )}

              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200">
                    نمره ارزشیابی (از ۰ تا ۱۰۰):
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[100, 95, 90, 80, 70, 50].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setEvalScore(String(val))}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          Number(toEnglishDigits(evalScore)) === val
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.5"
                  value={evalScore}
                  onChange={(e) => setEvalScore(e.target.value)}
                  className="w-full sm:w-48 px-4 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-sm font-black text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>عناوین آماده ارزشیابی:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {evalPresets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEvalTitle(p)}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  عنوان ارزشیابی *
                </label>
                <input
                  type="text"
                  value={evalTitle}
                  onChange={(e) => setEvalTitle(e.target.value)}
                  placeholder="مثال: ارزیابی دوره‌ای نظم و بهداشت"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  توضیحات تکمیلی (اختیاری)
                </label>
                <textarea
                  rows={3}
                  value={evalDesc}
                  onChange={(e) => setEvalDesc(e.target.value)}
                  placeholder="نکات مثبت یا موارد نیازمند بهبود در ارزیابی دانشجو..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  <span>ثبت نمره ارزشیابی</span>
                </button>
              </div>
            </form>
          )}

          {/* تب ۳: ارسال پیام مستقیم */}
          {activeTab === 'message' && (
            <form onSubmit={handleSubmitMessage} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    دسته‌بندی پیام
                  </label>
                  <select
                    value={msgCategory}
                    onChange={(e) => setMsgCategory(e.target.value as MessageCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {MESSAGE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 px-3.5 py-2.5 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={msgConfidential}
                    onChange={(e) => setMsgConfidential(e.target.checked)}
                    className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-bold">ارسال به صورت پیام محرمانه</span>
                </label>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                  <span>موضوعات پیشنهادی:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {msgPresets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setMsgSubject(p)}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  موضوع پیام *
                </label>
                <input
                  type="text"
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                  placeholder={`ارسال پیام مستقیم به ${student.fullName}...`}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  متن پیام *
                </label>
                <textarea
                  rows={4}
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  placeholder="متن پیام خود را وارد کنید. این پیام بلافاصله در صندوق پیام‌های دانشجو نمایش داده می‌شود..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>ارسال پیام به دانشجو</span>
                </button>
              </div>
            </form>
          )}

          {/* تب ۴: سوابق و پیام‌ها */}
          {activeTab === 'history' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>گزارش‌ها، تذکرات، اخطارها و نمرات ارزیابی ({studentEvaluations.length} مورد)</span>
                </h4>
                {studentEvaluations.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
                    تاکنون گزارشی، تذکری یا نمره ارزیابی برای این دانشجو ثبت نشده است.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {studentEvaluations.map((ev) => (
                      <div
                        key={ev.id}
                        className={`p-3 rounded-2xl border flex items-start justify-between gap-3 text-xs ${
                          ev.type === 'evaluation'
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                            : ev.type === 'report'
                            ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
                            : ev.type === 'warning'
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                            : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                                ev.type === 'evaluation'
                                  ? 'bg-emerald-600 text-white'
                                  : ev.type === 'report'
                                  ? 'bg-blue-600 text-white'
                                  : ev.type === 'warning'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-amber-500 text-white'
                              }`}
                            >
                              {ev.type === 'evaluation'
                                ? `نمره: ${ev.score ?? '-'}`
                                : ev.type === 'report'
                                ? 'گزارش'
                                : ev.type === 'warning'
                                ? 'اخطار رسمی'
                                : 'تذکر'}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                              {ev.scope === 'room' ? 'اتاق' : 'فردی'}
                            </span>
                            <span className="font-extrabold text-slate-800 dark:text-white">{ev.title}</span>
                            {(ev.type === 'notice' || ev.type === 'warning') && (
                              <span
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                  ev.resolved
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                                }`}
                              >
                                {ev.resolved ? 'برطرف شده' : 'فعال'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300">{ev.description}</p>
                          <div className="text-[10px] text-slate-400">
                            ثبت‌کننده: {ev.evaluatorName} • تاریخ: {ev.date}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {(ev.type === 'notice' || ev.type === 'warning') && !ev.resolved && (
                            <button
                              type="button"
                              onClick={() => {
                                Storage.resolveStudentEvaluation(ev.id);
                                setRefreshTick((t) => t + 1);
                                onDataChanged();
                              }}
                              className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition cursor-pointer"
                              title="ثبت به عنوان رفع‌شده"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              Storage.deleteStudentEvaluation(ev.id);
                              setRefreshTick((t) => t + 1);
                              onDataChanged();
                            }}
                            className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 transition cursor-pointer"
                            title="حذف سابقه"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-teal-600" />
                  <span>پیام‌های ردوبدل‌شده با دانشجو ({studentMessages.length} پیام)</span>
                </h4>
                {studentMessages.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
                    هیچ پیام مستقیمی بین دانشجو و کادر سرپرستی/مدیریت ثبت نشده است.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {studentMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 text-xs space-y-1"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                msg.senderId === student.studentId
                                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200'
                                  : 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-200'
                              }`}
                            >
                              {msg.senderId === student.studentId ? 'از طرف دانشجو' : `ارسالی از ${msg.senderName}`}
                            </span>
                            {msg.isConfidential && (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800">
                                محرمانه
                              </span>
                            )}
                            <span className="font-extrabold text-slate-800 dark:text-white">{msg.subject}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{msg.date}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* لایت‌باکس بزرگ‌نمایی عکس دانشجو */}
      {isPhotoZoomed && student.photoUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          onClick={(e) => {
            e.stopPropagation();
            setIsPhotoZoomed(false);
          }}
        >
          <div className="relative max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-3 shadow-2xl">
            <img
              src={student.photoUrl}
              alt={student.fullName}
              className="w-full max-h-[75vh] object-contain rounded-2xl"
            />
            <div className="mt-2 text-center text-xs font-extrabold text-slate-800 dark:text-white">
              {student.fullName} ({student.studentId})
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
