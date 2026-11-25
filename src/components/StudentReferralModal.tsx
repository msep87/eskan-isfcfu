import React, { useEffect, useMemo, useState } from 'react';
import { PersianDatePicker } from './PersianDatePicker';
import {
  X,
  Send,
  HeartHandshake,
  Gavel,
  ShieldAlert,
  AlertTriangle,
  Building2,
  User,
  Lock,
  CheckCircle2,
  FileText,
  Calendar,
  MapPin,
} from 'lucide-react';
import {
  Dormitory,
  Room,
  Student,
  DisciplinaryViolationType,
  SecurityReportCategory,
  SecurityReportSeverity,
  StaffReferralActorRole,
} from '../types';
import {
  DISCIPLINARY_VIOLATION_PRESETS,
  SECURITY_REPORT_PRESETS,
  Storage,
} from '../utils/storage';

export type ReferralTargetUnit = 'counselor' | 'student_affairs' | 'security';

interface StudentReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  dorms: Dormitory[];
  rooms: Room[];
  actorId: string;
  actorName: string;
  actorRole: StaffReferralActorRole;
  initialTarget?: ReferralTargetUnit;
  onSuccess?: (message: string) => void;
}

const ROLE_LABELS: Record<StaffReferralActorRole, string> = {
  admin: 'مدیر کل سامانه',
  supervisor: 'سرپرست سرا',
  vice_dean: 'معاونت دانشجویی',
  student_affairs: 'اداره امور دانشجویی',
  security: 'واحد حراست و انتظامات',
  counselor: 'مرکز مشاوره و سلامت روان',
  finance: 'واحد امور مالی و حسابداری',
  education: 'واحد آموزش',
  cultural: 'واحد امور فرهنگی',
  maintenance: 'واحد تأسیسات و فنی',
  library: 'کتابخانه و پژوهش',
  smart_campus: 'واحد هوشمندسازی',
  graduation: 'واحد فارغ‌التحصیلان',
  academic_deputy: 'معاونت آموزشی',
};

const COUNSELOR_PRESETS: Array<{ label: string; defaultTitle: string; defaultText: string }> = [
  {
    label: 'مشاوره فردی و روانشناختی',
    defaultTitle: 'ارجاع جهت مشاوره فردی و بررسی وضعیت روحی/خلقی',
    defaultText:
      'با سلام؛ دانشجوی مذکور بر اساس مشاهدات و بررسی‌های اولیه نیازمند گفت‌وگوی تخصصی و حمایت مشاوره‌ای مرکز مشاوره می‌باشد. خواهشمند است وقت جلسه مشاوره هماهنگ و پیگیری لازم انجام شود.',
  },
  {
    label: 'تعارض یا ناسازگاری در اتاق',
    defaultTitle: 'ارجاع بابت تعارضات بین‌فردی و ناسازگاری با هم‌اتاقی‌ها',
    defaultText:
      'گزارش تنش یا عدم سازگاری در روابط هم‌اتاقی‌ها ثبت شده است. لطفاً جهت میانجی‌گری، ارائه راهکار ارتباطی و بررسی انتقال احتمالی اقدام گردد.',
  },
  {
    label: 'افت انگیزشی یا غیبت‌های مکرر',
    defaultTitle: 'ارجاع به دلیل کاهش انگیزه تحصیلی و انزوا',
    defaultText:
      'نشانه‌هایی از انزوا، افت فعالیت روزمره یا نگرانی تحصیلی مشاهده گردیده است. لطفاً بررسی تخصصی مشاوره‌ای صورت پذیرد.',
  },
  {
    label: 'بحران عاطفی / خانوادگی / اضطراب',
    defaultTitle: 'ارجاع فوری جهت حمایت روانی و مدیریت استرس',
    defaultText:
      'دانشجو با فشار روحی، اضطراب یا مشکل خانوادگی مواجه است و نیازمند پیگیری دلسوزانه و محرمانه مشاور مرکز است.',
  },
];

export const StudentReferralModal: React.FC<StudentReferralModalProps> = ({
  isOpen,
  onClose,
  student,
  dorms,
  rooms,
  actorId,
  actorName,
  actorRole,
  initialTarget = 'counselor',
  onSuccess,
}) => {
  const [targetUnit, setTargetUnit] = useState<ReferralTargetUnit>(initialTarget);

  // مشترک
  const [title, setTitle] = useState('');
  const [reportText, setReportText] = useState('');
  const [urgency, setUrgency] = useState<SecurityReportSeverity>('important');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // مشاور
  const [counselorPresetLabel, setCounselorPresetLabel] = useState(COUNSELOR_PRESETS[0].label);
  const [counselorConfidential, setCounselorConfidential] = useState(true);

  // امور دانشجویی / شورای انضباطی
  const [studentAffairsMode, setStudentAffairsMode] = useState<'disciplinary' | 'general'>('disciplinary');
  const [violationType, setViolationType] = useState<DisciplinaryViolationType>('curfew_violation');
  const [notifyStudentInbox, setNotifyStudentInbox] = useState(true);

  // حراست
  const [secCategory, setSecCategory] = useState<SecurityReportCategory>('disciplinary_incident');
  const [incidentDate, setIncidentDate] = useState(() => new Date().toLocaleDateString('fa-IR'));
  const [locationDetails, setLocationDetails] = useState('');

  const dormObj = useMemo(
    () => (student?.assignedDormId ? dorms.find((d) => d.id === student.assignedDormId) : undefined),
    [dorms, student?.assignedDormId]
  );
  const roomObj = useMemo(
    () => (student?.assignedRoomId ? rooms.find((r) => r.id === student.assignedRoomId) : undefined),
    [rooms, student?.assignedRoomId]
  );

  useEffect(() => {
    if (!isOpen || !student) return;
    setTargetUnit(initialTarget);
    setErrorMsg('');
    setIsSubmitting(false);
    setUrgency('important');
    setCounselorPresetLabel(COUNSELOR_PRESETS[0].label);
    setCounselorConfidential(true);
    setStudentAffairsMode('disciplinary');
    setViolationType('curfew_violation');
    setNotifyStudentInbox(true);
    setSecCategory('disciplinary_incident');
    setIncidentDate(new Date().toLocaleDateString('fa-IR'));
    setLocationDetails('');

    if (initialTarget === 'counselor') {
      setTitle(COUNSELOR_PRESETS[0].defaultTitle);
      setReportText(COUNSELOR_PRESETS[0].defaultText);
    } else if (initialTarget === 'student_affairs') {
      const p = DISCIPLINARY_VIOLATION_PRESETS[0];
      setTitle(p?.label || 'ارجاع پرونده به امور دانشجویی');
      setReportText(p?.defaultText || '');
    } else {
      const sp = SECURITY_REPORT_PRESETS[0];
      setTitle(sp?.defaultTitle || 'گزارش حفاظتی و انتظامات دانشجو');
      setReportText(sp?.defaultDescription || '');
    }
  }, [isOpen, student, initialTarget]);

  if (!isOpen || !student) return null;

  const handleSelectUnit = (unit: ReferralTargetUnit) => {
    setTargetUnit(unit);
    setErrorMsg('');
    if (unit === 'counselor') {
      const preset = COUNSELOR_PRESETS.find((p) => p.label === counselorPresetLabel) || COUNSELOR_PRESETS[0];
      setTitle(preset.defaultTitle);
      setReportText(preset.defaultText);
    } else if (unit === 'student_affairs') {
      if (studentAffairsMode === 'disciplinary') {
        const p =
          DISCIPLINARY_VIOLATION_PRESETS.find((d) => d.type === violationType) ||
          DISCIPLINARY_VIOLATION_PRESETS[0];
        setTitle(p?.label || 'ارجاع به شورای انضباطی');
        setReportText(p?.defaultText || '');
      } else {
        setTitle('ارجاع جهت بررسی و پیگیری امور دانشجویی');
        setReportText('');
      }
    } else {
      const sp =
        SECURITY_REPORT_PRESETS.find((p) => p.category === secCategory) ||
        SECURITY_REPORT_PRESETS[0];
      setTitle(sp?.defaultTitle || 'گزارش حفاظتی دانشجو');
      setReportText(sp?.defaultDescription || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanTitle = title.trim();
    const cleanText = reportText.trim();

    if (!cleanTitle) {
      setErrorMsg('لطفاً عنوان گزارش یا موضوع ارجاع را وارد نمایید.');
      return;
    }
    if (!cleanText) {
      setErrorMsg('لطفاً شرح گزارش و علت ارجاع دانشجو را بنویسید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const dormLabel = dormObj?.name || student.assignedDormName || 'ترددی / فاقد سرا';
      const roomLabel = roomObj?.roomNumber || student.assignedRoomNumber || '-';
      const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
      const urgencyFa =
        urgency === 'urgent' ? 'فوری / اضطراری' : urgency === 'important' ? 'مهم' : 'عادی';

      if (targetUnit === 'counselor') {
        const fullContent = [
          `📌 ارجاع دانشجو از کارتابل ${ROLE_LABELS[actorRole]} (${actorName})`,
          `• نام و نام خانوادگی: ${student.fullName}`,
          `• شماره دانشجویی: ${student.studentId}${student.nationalId ? ` | کد ملی: ${student.nationalId}` : ''}`,
          `• رشته و ورودی: ${student.fieldOfStudy || '-'} (ورودی ${student.entryTerm || '-'})`,
          `• وضعیت اسکان: ${dormLabel}${roomLabel !== '-' ? ` — اتاق ${roomLabel}` : ''}`,
          `• شماره تماس دانشجو: ${student.mobile || '-'}`,
          `• محور ارجاع: ${counselorPresetLabel} | سطح اولویت: ${urgencyFa}`,
          ``,
          `📝 شرح گزارش ارجاع:`,
          cleanText,
        ].join('\n');

        Storage.addMessage({
          senderId: actorId || actorRole,
          senderName: `${actorName} (${ROLE_LABELS[actorRole]})`,
          senderRole: actorRole,
          receiverType: 'counselor',
          subject: `[ارجاع کارتابل] ${cleanTitle} — ${student.fullName} (${student.studentId})`,
          content: fullContent,
          category: 'counseling',
          date: nowStr,
          isConfidential: counselorConfidential,
        });

        Storage.addActivityLog({
          category: 'counseling',
          action: 'ارجاع دانشجو به مرکز مشاوره با ثبت گزارش',
          details: `دانشجو ${student.fullName} (${student.studentId}) با موضوع «${cleanTitle}» توسط ${actorName} (${ROLE_LABELS[actorRole]}) به مرکز مشاوره ارجاع شد.`,
          targetName: student.fullName,
          severity: urgency === 'urgent' ? 'warning' : 'info',
          actorName,
          actorRole,
        });

        await Storage.waitForPendingCloudSync();
        onSuccess?.(`ارجاع و گزارش دانشجو «${student.fullName}» با موفقیت به کارتابل مرکز مشاوره ارسال و ذخیره شد.`);
        onClose();
        return;
      }

      if (targetUnit === 'student_affairs') {
        const effectiveType: DisciplinaryViolationType =
          studentAffairsMode === 'disciplinary' ? violationType : 'other';
        const effectiveLabel =
          studentAffairsMode === 'disciplinary'
            ? cleanTitle
            : `ارجاع امور دانشجویی: ${cleanTitle}`;

        const res = Storage.createDisciplinaryReferral({
          students: [student],
          dorm: dormObj,
          room: roomObj,
          violationType: effectiveType,
          violationLabel: effectiveLabel,
          referralText: `اولیت: ${urgencyFa}\n${cleanText}`,
          referredById: actorId || actorRole,
          referredByName: actorName,
          referredByRole: actorRole,
          notifyStudentInbox: studentAffairsMode === 'disciplinary' ? notifyStudentInbox : false,
        });

        if (!res.success) {
          setErrorMsg(res.message);
          return;
        }

        // همچنین یک رونوشت پیام سازمانی برای امور دانشجویی ثبت شود تا در صندوق پیام نیز قابل ردیابی باشد
        Storage.addMessage({
          senderId: actorId || actorRole,
          senderName: `${actorName} (${ROLE_LABELS[actorRole]})`,
          senderRole: actorRole,
          receiverType: 'student_affairs',
          subject: `[ارجاع دانشجو] ${effectiveLabel} — ${student.fullName} (${student.studentId})`,
          content: `دانشجو: ${student.fullName} (${student.studentId})\nسرا/اتاق: ${dormLabel}${roomLabel !== '-' ? ` - اتاق ${roomLabel}` : ''}\nکد پرونده ارجاعی: ${res.referrals?.[0]?.referralCode || '-'}\nاولویت: ${urgencyFa}\n\nشرح گزارش:\n${cleanText}`,
          category: studentAffairsMode === 'disciplinary' ? 'discipline' : 'social_personal',
          date: nowStr,
          isConfidential: false,
        });

        await Storage.waitForPendingCloudSync();
        onSuccess?.(
          res.message ||
            `ارجاع و گزارش دانشجو «${student.fullName}» با موفقیت در کارتابل امور دانشجویی ثبت گردید.`
        );
        onClose();
        return;
      }

      // واحد حراست و انتظامات
      const res = Storage.createSecurityReport({
        students: [student],
        title: cleanTitle,
        category: secCategory,
        severity: urgency,
        dormId: student.assignedDormId,
        dormName: dormObj?.name || student.assignedDormName,
        roomNumber: roomLabel !== '-' ? roomLabel : undefined,
        locationDetails: locationDetails.trim() || undefined,
        incidentDate: incidentDate.trim() || new Date().toLocaleDateString('fa-IR'),
        description: cleanText,
        reportedById: actorId || actorRole,
        reportedByName: actorName,
        reportedByRole: actorRole,
      });

      if (!res.success) {
        setErrorMsg(res.message);
        return;
      }

      await Storage.waitForPendingCloudSync();
      onSuccess?.(res.message);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* سربرگ */}
        <div
          className={`px-5 py-4 text-white flex items-center justify-between gap-3 shrink-0 bg-gradient-to-l ${
            targetUnit === 'counselor'
              ? 'from-teal-800 via-teal-900 to-slate-900'
              : targetUnit === 'student_affairs'
              ? 'from-indigo-800 via-purple-900 to-slate-900'
              : 'from-rose-900 via-slate-900 to-slate-950'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              {targetUnit === 'counselor' ? (
                <HeartHandshake className="w-6 h-6 text-teal-200" />
              ) : targetUnit === 'student_affairs' ? (
                <Gavel className="w-6 h-6 text-indigo-200" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-rose-200" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-base truncate">
                ارجاع دانشجو و ثبت گزارش تخصصی
              </h3>
              <p className="text-[11px] text-white/80 truncate">
                ارجاع‌دهنده: {actorName} ({ROLE_LABELS[actorRole]})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* کارت خلاصه مشخصات دانشجو */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.fullName}
                  loading="lazy"
                  decoding="async"
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
              ) : (
                <div
                  className="w-11 h-11 rounded-xl text-white font-black text-sm flex items-center justify-center shrink-0"
                  style={{ backgroundColor: student.avatarColor || '#0d9488' }}
                >
                  {(student.fullName || 'د').slice(0, 1)}
                </div>
              )}
              <div>
                <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  <span>{student.fullName}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap gap-2">
                  <span className="font-mono">کد: {student.studentId}</span>
                  <span>•</span>
                  <span>{student.fieldOfStudy || '-'}</span>
                  {student.entryTerm && <span>(ورودی {student.entryTerm})</span>}
                </div>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200">
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                {dormObj
                  ? `${dormObj.name}${roomObj ? ` • اتاق ${roomObj.roomNumber}` : ''}`
                  : 'ترددی / فاقد اتاق'}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* انتخاب واحد مقصد ارجاع */}
          <div>
            <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-2">
              ۱. انتخاب واحد مقصد جهت ارجاع دانشجو:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectUnit('counselor')}
                className={`p-3 rounded-2xl border-2 text-right transition cursor-pointer flex items-center gap-2.5 ${
                  targetUnit === 'counselor'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-100 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-teal-300'
                }`}
              >
                <div className="p-2 rounded-xl bg-teal-600 text-white shrink-0">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-xs">مرکز مشاوره</div>
                  <div className="text-[10px] opacity-75 mt-0.5">حمایت روحی، سازگاری و مشاوره</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectUnit('student_affairs')}
                className={`p-3 rounded-2xl border-2 text-right transition cursor-pointer flex items-center gap-2.5 ${
                  targetUnit === 'student_affairs'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-100 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                }`}
              >
                <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
                  <Gavel className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-xs">امور دانشجویی</div>
                  <div className="text-[10px] opacity-75 mt-0.5">شورای انضباطی و پیگیری امور</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectUnit('security')}
                className={`p-3 rounded-2xl border-2 text-right transition cursor-pointer flex items-center gap-2.5 ${
                  targetUnit === 'security'
                    ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-100 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-rose-300'
                }`}
              >
                <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-xs">حراست و انتظامات</div>
                  <div className="text-[10px] opacity-75 mt-0.5">گزارش حفاظتی، تردد و وقایع</div>
                </div>
              </button>
            </div>
          </div>

          {/* تنظیمات اختصاصی هر واحد */}
          {targetUnit === 'counselor' && (
            <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/25 border border-teal-200 dark:border-teal-800/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-extrabold text-teal-900 dark:text-teal-200">
                  محور ارجاع به مشاور:
                </span>
                <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-800 dark:text-teal-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={counselorConfidential}
                    onChange={(e) => setCounselorConfidential(e.target.checked)}
                    className="rounded border-teal-400 text-teal-600"
                  />
                  <Lock className="w-3.5 h-3.5" />
                  <span>گزارش محرمانه (فقط مشاور و مدیریت)</span>
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COUNSELOR_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setCounselorPresetLabel(preset.label);
                      setTitle(preset.defaultTitle);
                      setReportText(preset.defaultText);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                      counselorPresetLabel === preset.label
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {targetUnit === 'student_affairs' && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/25 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStudentAffairsMode('disciplinary');
                    const p =
                      DISCIPLINARY_VIOLATION_PRESETS.find((d) => d.type === violationType) ||
                      DISCIPLINARY_VIOLATION_PRESETS[0];
                    setTitle(p?.label || 'پرونده شورای انضباطی');
                    setReportText(p?.defaultText || '');
                  }}
                  className={`px-3 py-2 rounded-xl border text-[11px] font-bold cursor-pointer transition ${
                    studentAffairsMode === 'disciplinary'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  تشکیل پرونده در شورای انضباطی
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudentAffairsMode('general');
                    setTitle('ارجاع جهت بررسی و پیگیری امور دانشجویی');
                    setReportText('');
                  }}
                  className={`px-3 py-2 rounded-xl border text-[11px] font-bold cursor-pointer transition ${
                    studentAffairsMode === 'general'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  ارجاع و گزارش عمومی امور دانشجویی (صنفی / رفاهی)
                </button>
              </div>

              {studentAffairsMode === 'disciplinary' && (
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-200">
                    موضوع تخلف / پرونده انضباطی:
                  </label>
                  <select
                    value={violationType}
                    onChange={(e) => {
                      const next = e.target.value as DisciplinaryViolationType;
                      setViolationType(next);
                      const p = DISCIPLINARY_VIOLATION_PRESETS.find((d) => d.type === next);
                      if (p) {
                        setTitle(p.label);
                        if (p.defaultText) setReportText(p.defaultText);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  >
                    {DISCIPLINARY_VIOLATION_PRESETS.map((p) => (
                      <option key={p.type} value={p.type}>
                        {p.label}
                      </option>
                    ))}
                  </select>

                  <label className="inline-flex items-center gap-2 text-[11px] font-bold text-indigo-800 dark:text-indigo-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={notifyStudentInbox}
                      onChange={(e) => setNotifyStudentInbox(e.target.checked)}
                      className="rounded border-indigo-400 text-indigo-600"
                    />
                    <span>ارسال ابلاغیه خودکار به صندوق پیام دانشجو</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {targetUnit === 'security' && (
            <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-800/60 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-rose-900 dark:text-rose-200 mb-1">
                    موضوع / دسته‌بندی گزارش حراست:
                  </label>
                  <select
                    value={secCategory}
                    onChange={(e) => {
                      const nextCat = e.target.value as SecurityReportCategory;
                      setSecCategory(nextCat);
                      const sp = SECURITY_REPORT_PRESETS.find((p) => p.category === nextCat);
                      if (sp) {
                        setTitle(sp.defaultTitle);
                        if (sp.defaultDescription) setReportText(sp.defaultDescription);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  >
                    {SECURITY_REPORT_PRESETS.map((p) => (
                      <option key={p.category} value={p.category}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-rose-900 dark:text-rose-200 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>تاریخ وقوع یا مشاهده:</span>
                  </label>
                  <PersianDatePicker
                    value={incidentDate}
                    onChange={setIncidentDate}
                    placeholder="مثلاً ۱۴۰۵/۰۸/۲۷"
                    digits="fa"
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rose-900 dark:text-rose-200 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>موقعیت دقیق واقعه (اختیاری):</span>
                </label>
                <input
                  type="text"
                  value={locationDetails}
                  onChange={(e) => setLocationDetails(e.target.value)}
                  placeholder="مثلاً ورودی سرای شماره ۱، راهرو طبقه دوم یا حیاط..."
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>
            </div>
          )}

          {/* اولویت و عنوان و متن گزارش */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
                عنوان گزارش / موضوع ارجاع:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان مختصر و گویا..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
                سطح اهمیت / فوریت:
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as SecurityReportSeverity)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              >
                <option value="normal">عادی</option>
                <option value="important">مهم</option>
                <option value="urgent">فوری / اضطراری</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              <span>شرح کامل گزارش و مستندات ارجاع:</span>
            </label>
            <textarea
              rows={5}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="جزئیات کامل علت ارجاع، مشاهدات و اقدامات پیشنهادی را بنویسید..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-white font-extrabold flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-60 ${
                targetUnit === 'counselor'
                  ? 'bg-teal-600 hover:bg-teal-700'
                  : targetUnit === 'student_affairs'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isSubmitting ? (
                <span>در حال ثبت و همگام‌سازی ابری...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    {targetUnit === 'counselor'
                      ? 'ثبت گزارش و ارجاع به مشاور'
                      : targetUnit === 'student_affairs'
                      ? 'ثبت گزارش و ارجاع به امور دانشجویی'
                      : 'ثبت گزارش و ارجاع به حراست'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
