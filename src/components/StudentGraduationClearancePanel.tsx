import React, { useMemo, useState } from 'react';
import { AppSettings, ClearanceUnitRole, Student } from '../types';
import { CLEARANCE_UNITS_META, Storage } from '../utils/storage';
import { GraduationClearancePrintModal } from './GraduationClearancePrintModal';
import {
  FileCheck2,
  GraduationCap,
  CheckCircle2,
  Clock,
  XCircle,
  Printer,
  Send,
  User,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

interface StudentGraduationClearancePanelProps {
  student: Student;
  dormName?: string;
  roomNumber?: string;
  settings: AppSettings;
  onDataChange: () => void;
}

export const StudentGraduationClearancePanel: React.FC<StudentGraduationClearancePanelProps> = ({
  student,
  dormName,
  roomNumber,
  settings,
  onDataChange,
}) => {
  const [academicYear, setAcademicYear] = useState(settings.currentAcademicYear || '۱۴۰۵-۱۴۰۶');
  const [semester, setSemester] = useState('نیمسال دوم');
  const [phone, setPhone] = useState(student.mobile || student.phone || '');
  const [studentNote, setStudentNote] = useState('');
  const [resubmitNotes, setResubmitNotes] = useState<Record<string, string>>({});
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const myClearance = useMemo(() => {
    void refreshTick;
    return Storage.getGraduationClearances().find((c) => c.studentId === student.studentId);
  }, [student.studentId, refreshTick]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = Storage.submitGraduationClearance({
      student,
      graduationAcademicYear: academicYear,
      graduationSemester: semester,
      studentPhone: phone,
      studentNote,
      dormName,
      roomNumber,
    });
    if (res.success) {
      showToast('success', res.message);
      setStudentNote('');
      setRefreshTick((t) => t + 1);
      onDataChange();
    } else {
      showToast('error', res.message);
    }
  };

  const handleResubmitUnit = (unitRole: ClearanceUnitRole) => {
    if (!myClearance) return;
    const res = Storage.resubmitGraduationClearanceUnit(
      myClearance.id,
      unitRole,
      resubmitNotes[unitRole] || ''
    );
    if (res.success) {
      showToast('success', res.message);
      setResubmitNotes((prev) => ({ ...prev, [unitRole]: '' }));
      setRefreshTick((t) => t + 1);
      onDataChange();
    } else {
      showToast('error', res.message);
    }
  };

  const approvedCount = myClearance
    ? CLEARANCE_UNITS_META.filter((u) => myClearance.units?.[u.role]?.status === 'approved').length
    : 0;
  const totalUnits = CLEARANCE_UNITS_META.length;
  const progressPct = Math.round((approvedCount / totalUnits) * 100);

  return (
    <div className="space-y-5">
      {/* بنر معرفی گردش کار تسویه حساب الکترونیک */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                تسویه حساب الکترونیک فراغت از تحصیل
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                درخواست شما ابتدا جهت تایید گذراندن کلیه واحدهای درسی به کارشناس آموزش ارسال می‌شود. پس از تایید آموزش، فرم عکس‌دار شما به صورت خودکار به تمام ۱۲ واحد دانشگاه ارسال شده و پس از تایید همه واحدها می‌توانید نسخه رسمی را چاپ و به اداره امور فارغ‌التحصیلان تحویل دهید.
              </p>
            </div>
          </div>

          {myClearance?.status === 'completed' && (
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 shadow-sm transition cursor-pointer shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ فرم رسمی تسویه حساب</span>
            </button>
          )}
        </div>

        {/* مراحل سه‌گانه گردش کار */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 ${
              myClearance?.educationGateStatus === 'approved'
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : myClearance?.status === 'pending_education'
                ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-current flex items-center justify-center font-black shrink-0">
              ۱
            </span>
            <div>
              <div className="font-extrabold">تایید کارشناس آموزش</div>
              <div className="text-[11px] opacity-80">بررسی گذراندن کلیه واحدهای درسی</div>
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 ${
              myClearance?.status === 'completed'
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : myClearance?.status === 'in_clearance'
                ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-current flex items-center justify-center font-black shrink-0">
              ۲
            </span>
            <div>
              <div className="font-extrabold">گردش در ۱۲ واحد سامانه</div>
              <div className="text-[11px] opacity-80">سرا، مالی، کتابخانه، هوشمندسازی و ...</div>
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 ${
              myClearance?.status === 'completed'
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-current flex items-center justify-center font-black shrink-0">
              ۳
            </span>
            <div>
              <div className="font-extrabold">چاپ و تحویل نهایی</div>
              <div className="text-[11px] opacity-80">تحویل به اداره امور فارغ‌التحصیلان</div>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* فرم ثبت درخواست (وقتی هنوز ثبت نشده یا توسط آموزش رد شده) */}
      {(!myClearance || myClearance.status === 'rejected_education') && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4"
        >
          {myClearance?.status === 'rejected_education' && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 space-y-1">
              <div className="font-black flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                <span>درخواست قبلی شما توسط واحد آموزش تایید نشد:</span>
              </div>
              <p className="leading-relaxed">{myClearance.educationNote}</p>
              <p className="text-[11px] opacity-80">
                پس از رفع مورد اعلام‌شده، می‌توانید درخواست را مجدداً ارسال نمایید.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="w-20 h-24 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center shrink-0">
              {student.photoUrl ? (
                <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-slate-400 text-center p-1">
                  <User className="w-7 h-7" />
                  <span className="text-[10px] font-bold">بدون عکس</span>
                </div>
              )}
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-black text-sm text-slate-900 dark:text-white">{student.fullName}</div>
              <div className="text-slate-600 dark:text-slate-300">
                شماره دانشجویی: <span className="font-mono font-bold" dir="ltr">{student.studentId}</span> • رشته:{' '}
                <span className="font-bold">{student.fieldOfStudy}</span> • ورودی:{' '}
                <span className="font-bold">{student.entryTerm}</span>
              </div>
              {!student.photoUrl && (
                <p className="text-amber-700 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1 pt-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>توصیه می‌شود پیش از چاپ نهایی، عکس پرسنلی خود را در بخش پروفایل بارگذاری کنید تا روی فرم تسویه درج شود.</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                سال تحصیلی فراغت
              </label>
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="مثلاً ۱۴۰۵-۱۴۰۶"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نیمسال فراغت
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
              >
                <option value="نیمسال اول">نیمسال اول (مهر)</option>
                <option value="نیمسال دوم">نیمسال دوم (بهمن)</option>
                <option value="ترم تابستان">ترم تابستان</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                شماره تماس در دسترس
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xxxxxxxxx"
                dir="ltr"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 text-left"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              توضیحات تکمیلی برای کارشناس آموزش (اختیاری)
            </label>
            <textarea
              rows={2}
              value={studentNote}
              onChange={(e) => setStudentNote(e.target.value)}
              placeholder="در صورت نیاز به توضیح درباره واحدهای گذرانده‌شده یا تاریخ دفاع/کارورزی بنویسید..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {myClearance?.status === 'rejected_education'
                  ? 'ارسال مجدد درخواست به کارشناس آموزش'
                  : 'ثبت و ارسال درخواست به کارشناس آموزش'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* پیگیری زنده پرونده تسویه حساب */}
      {myClearance && myClearance.status !== 'rejected_education' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  وضعیت زنده پرونده تسویه حساب شما
                </h3>
                <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-mono text-xs font-bold" dir="ltr">
                  {myClearance.trackingCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تاریخ ثبت: {myClearance.requestedAt} • سال و نیمسال فراغت: {myClearance.graduationAcademicYear} ({myClearance.graduationSemester})
              </p>
            </div>

            {myClearance.status === 'completed' ? (
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>چاپ فرم جهت تحویل به اداره فارغ‌التحصیلان</span>
              </button>
            ) : myClearance.status === 'pending_education' ? (
              <span className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-bold inline-flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                در انتظار بررسی و تایید کارشناس آموزش
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 text-xs font-bold inline-flex items-center gap-1.5">
                <ArrowLeft className="w-4 h-4" />
                در حال گردش بین واحدها ({approvedCount} از {totalUnits})
              </span>
            )}
          </div>

          {myClearance.status === 'completed' && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-sm">تبریک! تسویه حساب شما در تمامی ۱۲ واحد تایید شد.</div>
                  <p className="mt-0.5 opacity-90">
                    اکنون می‌توانید فرم رسمی عکس‌دار تسویه حساب خود را چاپ کرده و به اداره امور فارغ‌التحصیلان تحویل دهید.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>مشاهده و چاپ فرم</span>
              </button>
            </div>
          )}

          {myClearance.status === 'pending_education' ? (
            <div className="p-5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              پرونده شما با کد رهگیری <span className="font-mono font-bold">{myClearance.trackingCode}</span> به کارتابل <strong>کارشناس آموزش</strong> ارسال شده است. به‌محض تایید گذراندن کلیه واحدهای درسی توسط آموزش، فرم عکس‌دار شما به‌صورت خودکار به تمامی واحدهای دانشگاه ارجاع می‌شود و جدول گردش کار در همین صفحه فعال خواهد شد.
            </div>
          ) : (
            <div className="space-y-4">
              {/* نوار پیشرفت */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  <span>درصد پیشرفت تاییدیه‌های واحدها</span>
                  <span className="tabular-nums text-teal-700 dark:text-teal-300">
                    {approvedCount} از {totalUnits} واحد ({progressPct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      myClearance.status === 'completed' ? 'bg-emerald-500' : 'bg-teal-500'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* کارت‌های ۱۲ واحد */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {CLEARANCE_UNITS_META.map((u) => {
                  const rec = myClearance.units?.[u.role];
                  const st = rec?.status || 'pending';
                  return (
                    <div
                      key={u.role}
                      className={`p-3.5 rounded-xl border space-y-2 ${
                        st === 'approved'
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/70'
                          : st === 'rejected'
                          ? 'bg-rose-50/60 dark:bg-rose-950/25 border-rose-300 dark:border-rose-800'
                          : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white">{u.label}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{u.description}</div>
                        </div>
                        {st === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" /> تایید شد
                          </span>
                        ) : st === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[11px] font-bold shrink-0">
                            <XCircle className="w-3.5 h-3.5" /> دارای نقص
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-[11px] font-bold shrink-0">
                            <Clock className="w-3.5 h-3.5" /> در انتظار
                          </span>
                        )}
                      </div>

                      {rec?.reviewerName && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          مسئول: <span className="font-bold text-slate-700 dark:text-slate-200">{rec.reviewerName}</span>
                          {rec.reviewedAt ? ` • ${rec.reviewedAt}` : ''}
                        </div>
                      )}

                      {rec?.note && (
                        <div className="text-[11px] text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-900/60 rounded-lg px-2.5 py-1.5 border border-slate-200/70 dark:border-slate-700/70">
                          {rec.note}
                        </div>
                      )}

                      {st === 'rejected' && (
                        <div className="pt-1 space-y-1.5">
                          <input
                            type="text"
                            value={resubmitNotes[u.role] || ''}
                            onChange={(e) =>
                              setResubmitNotes((prev) => ({ ...prev, [u.role]: e.target.value }))
                            }
                            placeholder="توضیح رفع نقص (اختیاری)..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => handleResubmitUnit(u.role)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold inline-flex items-center justify-center gap-1 transition cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>اعلام رفع نقص و ارسال مجدد</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {showPrintModal && myClearance && (
        <GraduationClearancePrintModal
          isOpen={true}
          onClose={() => setShowPrintModal(false)}
          clearance={myClearance}
          settings={settings}
        />
      )}
    </div>
  );
};
