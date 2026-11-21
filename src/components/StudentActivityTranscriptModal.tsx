import React, { useMemo, useState, useEffect } from 'react';
import { Student } from '../types';
import { Storage } from '../utils/storage';
import { getStudentResidenceType } from '../utils/financeUtils';
import {
  buildTranscriptPrintHtml,
  computeStudentActivityTranscript,
  loadTranscriptDataContext,
  printHtmlInHiddenIframe,
  StudentActivityTranscript,
} from '../utils/studentTranscriptUtils';
import {
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  Dumbbell,
  FileText,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Vote,
  X,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';

interface StudentActivityTranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** دانشجوی اولیه برای نمایش کارنامه (در حالت دانشجو الزامی و در حالت مدیر/معاون/فرهنگی/دانشجویی اختیاری) */
  initialStudent?: Student | null;
  /** اگر true باشد، امکان جستجو و انتخاب هر دانشجو از لیست وجود دارد (ویژه مدیر، معاون، امور فرهنگی و امور دانشجویی) */
  allowStudentPicker?: boolean;
  /** لیست دلخواه دانشجویان (در صورت عدم ارسال از Storage خوانده می‌شود) */
  studentsList?: Student[];
  viewerRoleLabel?: string;
}

export const StudentActivityTranscriptModal: React.FC<StudentActivityTranscriptModalProps> = ({
  isOpen,
  onClose,
  initialStudent = null,
  allowStudentPicker = false,
  studentsList,
  viewerRoleLabel,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudent?.studentId || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [residenceFilter, setResidenceFilter] = useState<'all' | 'dormitory' | 'commuter'>('all');

  const allStudents = useMemo<Student[]>(() => {
    if (!isOpen) return [];
    return studentsList && studentsList.length > 0 ? studentsList : Storage.getStudents();
  }, [isOpen, studentsList]);

  const dataContext = useMemo(() => {
    if (!isOpen) return null;
    return loadTranscriptDataContext();
  }, [isOpen]);

  const academicYear = useMemo(() => {
    if (!isOpen) return '۱۴۰۴-۱۴۰۵';
    return Storage.getSettings().currentAcademicYear || '۱۴۰۴-۱۴۰۵';
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialStudent?.studentId) {
      setSelectedStudentId(initialStudent.studentId);
    } else if (!selectedStudentId && allStudents.length > 0) {
      setSelectedStudentId(allStudents[0].studentId);
    }
  }, [isOpen, initialStudent?.studentId, allStudents]);

  const filteredStudents = useMemo(() => {
    if (!allowStudentPicker) return [];
    const q = searchQuery.trim().toLowerCase();
    return allStudents.filter((s) => {
      if (residenceFilter !== 'all' && getStudentResidenceType(s) !== residenceFilter) {
        return false;
      }
      if (!q) return true;
      return (
        (s.fullName || '').toLowerCase().includes(q) ||
        (s.studentId || '').toLowerCase().includes(q) ||
        (s.nationalId || '').toLowerCase().includes(q) ||
        (s.fieldOfStudy || '').toLowerCase().includes(q)
      );
    });
  }, [allowStudentPicker, allStudents, searchQuery, residenceFilter]);

  const activeStudent = useMemo<Student | null>(() => {
    if (!allowStudentPicker && initialStudent) return initialStudent;
    if (selectedStudentId) {
      const found = allStudents.find((s) => s.studentId === selectedStudentId);
      if (found) return found;
    }
    return initialStudent || allStudents[0] || null;
  }, [allowStudentPicker, initialStudent, selectedStudentId, allStudents]);

  const transcript = useMemo<StudentActivityTranscript | null>(() => {
    if (!isOpen || !activeStudent || !dataContext) return null;
    return computeStudentActivityTranscript(activeStudent, dataContext);
  }, [isOpen, activeStudent, dataContext]);

  if (!isOpen) return null;

  const handlePrintTranscript = () => {
    if (!transcript) return;
    const html = buildTranscriptPrintHtml(transcript, academicYear);
    printHtmlInHiddenIframe(html);
  };

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'cultural':
        return <Sparkles className="w-4 h-4 text-fuchsia-600" />;
      case 'sports':
        return <Dumbbell className="w-4 h-4 text-emerald-600" />;
      case 'surveys':
        return <ClipboardList className="w-4 h-4 text-violet-600" />;
      case 'elections':
        return <Vote className="w-4 h-4 text-blue-600" />;
      case 'academic_library':
        return <BookOpen className="w-4 h-4 text-amber-600" />;
      case 'dormitory_discipline':
        return <Building2 className="w-4 h-4 text-teal-600" />;
      default:
        return <Award className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* نوار بالای مودال */}
        <div className="px-5 py-4 bg-gradient-to-l from-indigo-900 via-teal-900 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/15 text-amber-300">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg">
                کارنامه جامع فعالیت‌های فرهنگی، اجتماعی، ورزشی و انضباطی دانشجو
              </h2>
              <p className="text-[11px] text-teal-100/90 mt-0.5">
                {viewerRoleLabel
                  ? `دسترسی ${viewerRoleLabel} • محاسبه خودکار امتیاز مشارکت‌ها، تشکل‌ها، ورزش، نظرسنجی، انتخابات و انضباط سرای دانشجویی`
                  : 'محاسبه خودکار امتیاز مشارکت‌های فرهنگی، اجتماعی، ورزشی، صنفی، کتابخانه‌ای و انضباط سرا'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {transcript && (
              <button
                type="button"
                onClick={handlePrintTranscript}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 transition shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>چاپ / دریافت PDF کارنامه (A4)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              aria-label="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* بدنه اصلی: در حالت مدیر/ستادی دو ستونه (انتخابگر دانشجو + کارنامه)، در حالت دانشجو تمام‌صفحه */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {allowStudentPicker && (
            <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-l border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 flex flex-col shrink-0 max-h-60 lg:max-h-none">
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو با نام، شماره دانشجویی، رشته..."
                    className="w-full pr-8 pl-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div className="flex gap-1.5">
                  {(
                    [
                      ['all', 'همه'],
                      ['dormitory', 'خوابگاهی'],
                      ['commuter', 'ترددی'],
                    ] as const
                  ).map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setResidenceFilter(val)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        residenceFilter === val
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-slate-500 font-bold flex items-center justify-between">
                  <span>فهرست دانشجویان ({filteredStudents.length.toLocaleString('fa-IR')} نفر)</span>
                  <span>کلیک برای مشاهده کارنامه</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-200/70 dark:divide-slate-800">
                {filteredStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    دانشجویی با این مشخصات یافت نشد.
                  </div>
                ) : (
                  filteredStudents.slice(0, 120).map((s) => {
                    const isSelected = activeStudent?.studentId === s.studentId;
                    const resType = getStudentResidenceType(s);
                    return (
                      <button
                        key={s.studentId}
                        type="button"
                        onClick={() => setSelectedStudentId(s.studentId)}
                        className={`w-full text-right p-3 transition flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50 dark:bg-teal-950/50 border-r-4 border-teal-600'
                            : 'hover:bg-white dark:hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            {s.fullName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {s.studentId} • {s.fieldOfStudy || '-'}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                            resType === 'dormitory'
                              ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                          }`}
                        >
                          {resType === 'dormitory' ? 'خوابگاهی' : 'ترددی'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* بخش نمایش کارنامه دانشجوی انتخاب‌شده */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/40 dark:bg-slate-950/20">
            {!transcript ? (
              <div className="p-12 text-center text-sm text-slate-400">
                دانشجویی برای نمایش کارنامه انتخاب نشده است.
              </div>
            ) : (
              <>
                {/* کارت هویت دانشجو و امتیاز کل */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    {transcript.student.photoUrl ? (
                      <img
                        src={transcript.student.photoUrl}
                        alt={transcript.student.fullName}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-teal-500/40 shadow-sm shrink-0"
                      />
                    ) : (
                      <div
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-white font-black text-2xl shrink-0 shadow-sm"
                        style={{ backgroundColor: transcript.student.avatarColor || '#0d9488' }}
                      >
                        {(transcript.student.fullName || 'د').slice(0, 1)}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                          {transcript.student.fullName}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                            transcript.residenceType === 'dormitory'
                              ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                          }`}
                        >
                          {transcript.residenceType === 'dormitory'
                            ? 'دانشجوی خوابگاهی'
                            : 'دانشجوی ترددی (غیرخوابگاهی)'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          کد دانشجویی: <strong className="font-mono text-slate-800 dark:text-slate-200">{transcript.student.studentId}</strong>
                        </span>
                        <span>
                          رشته: <strong className="text-slate-800 dark:text-slate-200">{transcript.student.fieldOfStudy || '-'}</strong>
                        </span>
                        <span>
                          ورودی: <strong className="text-slate-800 dark:text-slate-200">{transcript.student.entryTerm || '-'}</strong>
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        {transcript.residenceType === 'dormitory'
                          ? `محل اسکان: ${transcript.dormName} • اتاق ${transcript.roomNumber}${transcript.bedLabel !== '-' ? ` (${transcript.bedLabel})` : ''}`
                          : 'بهره‌مند از کلیه فعالیت‌های فرهنگی، ورزشی، آموزشی، صنفی و کتابخانه‌ای دانشگاه'}
                      </div>
                    </div>
                  </div>

                  {/* باکس نمره تراز و رتبه کیفی */}
                  <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 shrink-0">
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-slate-500 block">امتیاز تراز جامع</span>
                      <div
                        className="text-3xl font-black tabular-nums leading-tight"
                        style={{ color: transcript.gradeColorHex }}
                      >
                        {transcript.normalizedScore100}
                        <span className="text-xs font-bold text-slate-400"> / ۱۰۰</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">
                        مجموع امتیاز: {transcript.totalScore} از {transcript.maxPossibleScore}
                      </span>
                    </div>
                    <div className="h-12 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className="text-right space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold block">رتبه ارزیابی کیفی</span>
                      <span
                        className="inline-block px-3 py-1 rounded-xl text-xs font-black text-white shadow-xs"
                        style={{ backgroundColor: transcript.gradeColorHex }}
                      >
                        {transcript.gradeLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        صدور: {transcript.generatedAtFa}
                      </span>
                    </div>
                  </div>
                </div>

                {/* کارت‌های خلاصه مشارکت‌ها */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center">
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 block">عضویت تشکل‌ها</span>
                    <span className="text-lg font-black text-fuchsia-700 dark:text-fuchsia-300">
                      {transcript.summaryCounts.associations}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 block">برنامه‌های ورزشی</span>
                    <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                      {transcript.summaryCounts.sportsEvents}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 block">مشارکت نظرسنجی</span>
                    <span className="text-lg font-black text-violet-700 dark:text-violet-300">
                      {transcript.summaryCounts.surveys}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 block">مشارکت انتخابات</span>
                    <span className="text-lg font-black text-blue-700 dark:text-blue-300">
                      {transcript.summaryCounts.elections}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 block">امانت کتابخانه</span>
                    <span className="text-lg font-black text-amber-700 dark:text-amber-300">
                      {transcript.summaryCounts.libraryRequests}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 block">توانمندی‌های پرونده</span>
                    <span className="text-lg font-black text-indigo-700 dark:text-indigo-300">
                      {transcript.summaryCounts.skillsTotal}
                    </span>
                  </div>
                </div>

                {/* بخش ویژه دانشجویان خوابگاهی */}
                {transcript.dormitoryDetails && (
                  <div className="p-4 sm:p-5 rounded-3xl bg-teal-50/70 dark:bg-teal-950/25 border border-teal-200 dark:border-teal-800/70 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-teal-900 dark:text-teal-200">
                        <ShieldCheck className="w-5 h-5 text-teal-600" />
                        <span>شاخص‌های نظم، انضباط و رعایت مقررات سرای دانشجویی (ویژه دانشجویان خوابگاهی)</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-teal-600 text-white text-xs font-black">
                        امتیاز خالص خوابگاهی: {transcript.dormitoryDetails.netDormPoints} از {transcript.dormitoryDetails.maxDormPoints}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-teal-200/70 dark:border-teal-800/60">
                        <span className="text-[10px] text-slate-500 block">نمره ارزیابی فردی</span>
                        <strong className="text-base font-black text-slate-900 dark:text-white">
                          {transcript.dormitoryDetails.individualScore100} از ۱۰۰
                        </strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-teal-200/70 dark:border-teal-800/60">
                        <span className="text-[10px] text-slate-500 block">انضباط و رعایت مقررات اتاق</span>
                        <strong className="text-base font-black text-indigo-700 dark:text-indigo-300">
                          {transcript.dormitoryDetails.disciplineScore100} از ۱۰۰
                        </strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-teal-200/70 dark:border-teal-800/60">
                        <span className="text-[10px] text-slate-500 block">نظافت فردی و اجتماعی اتاق</span>
                        <strong className="text-base font-black text-emerald-700 dark:text-emerald-300">
                          {transcript.dormitoryDetails.cleanlinessScore100} از ۱۰۰
                        </strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-teal-200/70 dark:border-teal-800/60">
                        <span className="text-[10px] text-slate-500 block">کسورات اخطار و انضباطی</span>
                        <strong
                          className={`text-base font-black ${
                            transcript.dormitoryDetails.penaltyPoints > 0
                              ? 'text-rose-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {transcript.dormitoryDetails.penaltyPoints > 0
                            ? `-${transcript.dormitoryDetails.penaltyPoints} امتیاز`
                            : 'بدون کسر'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* تفکیک امتیازات محورهای کارنامه */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {transcript.categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                            {getCategoryIcon(cat.id)}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {cat.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">{cat.subtitle}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-xs text-slate-800 dark:text-slate-100 shrink-0 tabular-nums">
                          {cat.score} / {cat.maxScore}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-l ${cat.colorClass} transition-all duration-500`}
                            style={{ width: `${cat.percent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                          <span>میزان تحقق محور</span>
                          <span>{cat.percent}٪</span>
                        </div>
                      </div>

                      <ul className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        {cat.highlights.map((hl, i) => (
                          <li key={i} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-teal-500 shrink-0" />
                            <span>{hl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* جدول ریز سوابق و فعالیت‌ها */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>ریز سوابق مستند فعالیت‌ها، مشارکت‌ها و ارزیابی‌ها ({transcript.activities.length} مورد)</span>
                    </div>
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                  </div>

                  {transcript.activities.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      هنوز سابقه مشارکتی در تشکل‌ها، برنامه‌های ورزشی، نظرسنجی‌ها، انتخابات یا کتابخانه برای این دانشجو ثبت نشده است.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-bold">
                          <tr>
                            <th className="p-3 w-10 text-center">#</th>
                            <th className="p-3">حوزه</th>
                            <th className="p-3">عنوان و شرح فعالیت</th>
                            <th className="p-3 text-center">تاریخ</th>
                            <th className="p-3 text-center">وضعیت</th>
                            <th className="p-3 text-center">امتیاز</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {transcript.activities.map((act, idx) => (
                            <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                              <td className="p-3 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                {act.categoryLabel}
                              </td>
                              <td className="p-3">
                                <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  {act.tone === 'negative' && (
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  )}
                                  <span>{act.title}</span>
                                </div>
                                {act.detail && (
                                  <div className="text-[11px] text-slate-500 mt-0.5">{act.detail}</div>
                                )}
                              </td>
                              <td className="p-3 text-center font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                {act.date}
                              </td>
                              <td className="p-3 text-center whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                                    act.tone === 'positive'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : act.tone === 'negative'
                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  }`}
                                >
                                  {act.statusLabel}
                                </span>
                              </td>
                              <td
                                className={`p-3 text-center font-black tabular-nums ${
                                  act.pointsDelta > 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : act.pointsDelta < 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-slate-500'
                                }`}
                                dir="ltr"
                              >
                                {act.pointsDelta > 0 ? `+${act.pointsDelta}` : act.pointsDelta}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
