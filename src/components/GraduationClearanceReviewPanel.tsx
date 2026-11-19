import React, { useMemo, useState } from 'react';
import {
  AppSettings,
  ClearanceUnitRole,
  GraduationClearanceRequest,
} from '../types';
import { CLEARANCE_UNITS_META, Storage } from '../utils/storage';
import { GraduationClearancePrintModal } from './GraduationClearancePrintModal';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  User,
  Printer,
  AlertTriangle,
  BookOpen,
  Wallet,
  Building2,
  Send,
  ShieldCheck,
  Eye,
} from 'lucide-react';

interface GraduationClearanceReviewPanelProps {
  unitRole: ClearanceUnitRole | 'admin';
  reviewerId: string;
  reviewerName: string;
  settings: AppSettings;
  onDataChange: () => void;
  /**
   * برای کاربران کتابخانه و هوشمندسازی فعال می‌شود تا کد ملی، نام پدر و جزئیات سرای دانشجو مخفی بماند
   * و صرفاً اطلاعات مجاز به همراه عکس پرسنلی فرم تسویه نمایش داده شود.
   */
  restrictStudentPrivacy?: boolean;
}

export const GraduationClearanceReviewPanel: React.FC<GraduationClearanceReviewPanelProps> = ({
  unitRole,
  reviewerId,
  reviewerName,
  settings,
  onDataChange,
  restrictStudentPrivacy = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('pending');
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [printTarget, setPrintTarget] = useState<GraduationClearanceRequest | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const clearances = useMemo(() => {
    void refreshTick;
    return Storage.getGraduationClearances();
  }, [refreshTick]);

  // بررسی‌های کمکی خودکار متناسب با هر واحد
  const libraryRequests = useMemo(() => {
    void refreshTick;
    return unitRole === 'library' || unitRole === 'admin' ? Storage.getLibraryBookRequests() : [];
  }, [unitRole, refreshTick]);

  const studentFinances = useMemo(() => {
    void refreshTick;
    return unitRole === 'finance' || unitRole === 'admin' ? Storage.getStudentFinances() : [];
  }, [unitRole, refreshTick]);

  const unitMeta = useMemo(
    () => CLEARANCE_UNITS_META.find((u) => u.role === unitRole),
    [unitRole]
  );

  const relevantClearances = useMemo(() => {
    if (unitRole === 'admin' || unitRole === 'education') {
      return clearances;
    }
    // سایر واحدها فقط پرونده‌هایی را می‌بینند که تایید اولیه واحد آموزش را گرفته‌اند
    return clearances.filter(
      (c) => c.educationGateStatus === 'approved' && (c.status === 'in_clearance' || c.status === 'completed')
    );
  }, [clearances, unitRole]);

  const stats = useMemo(() => {
    if (unitRole === 'education') {
      return {
        pending: relevantClearances.filter((c) => c.status === 'pending_education').length,
        approved: relevantClearances.filter((c) => c.educationGateStatus === 'approved').length,
        rejected: relevantClearances.filter((c) => c.status === 'rejected_education').length,
        completed: relevantClearances.filter((c) => c.status === 'completed').length,
      };
    }
    if (unitRole === 'admin') {
      return {
        pending: relevantClearances.filter((c) => c.status === 'pending_education' || c.status === 'in_clearance').length,
        approved: relevantClearances.filter((c) => c.status === 'in_clearance').length,
        rejected: relevantClearances.filter((c) =>
          c.status === 'rejected_education' ||
          CLEARANCE_UNITS_META.some((u) => c.units?.[u.role]?.status === 'rejected')
        ).length,
        completed: relevantClearances.filter((c) => c.status === 'completed').length,
      };
    }
    return {
      pending: relevantClearances.filter((c) => (c.units?.[unitRole]?.status || 'pending') === 'pending').length,
      approved: relevantClearances.filter((c) => c.units?.[unitRole]?.status === 'approved').length,
      rejected: relevantClearances.filter((c) => c.units?.[unitRole]?.status === 'rejected').length,
      completed: relevantClearances.filter((c) => c.status === 'completed').length,
    };
  }, [relevantClearances, unitRole]);

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return relevantClearances.filter((c) => {
      if (q) {
        const hay = [
          c.trackingCode,
          c.studentName,
          c.studentId,
          c.studentFieldOfStudy,
          c.studentEntryTerm,
          c.studentPhone,
          restrictStudentPrivacy ? '' : c.studentNationalId || '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (statusFilter === 'all') return true;
      if (statusFilter === 'completed') return c.status === 'completed';

      if (unitRole === 'education') {
        if (statusFilter === 'pending') return c.status === 'pending_education';
        if (statusFilter === 'approved') return c.educationGateStatus === 'approved';
        if (statusFilter === 'rejected') return c.status === 'rejected_education';
      } else if (unitRole === 'admin') {
        if (statusFilter === 'pending') return c.status === 'pending_education' || c.status === 'in_clearance';
        if (statusFilter === 'approved') return c.status === 'in_clearance';
        if (statusFilter === 'rejected') {
          return (
            c.status === 'rejected_education' ||
            CLEARANCE_UNITS_META.some((u) => c.units?.[u.role]?.status === 'rejected')
          );
        }
      } else {
        const myStatus = c.units?.[unitRole]?.status || 'pending';
        return myStatus === statusFilter;
      }
      return true;
    });
  }, [relevantClearances, searchQuery, statusFilter, unitRole, restrictStudentPrivacy]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleEducationGateDecision = (c: GraduationClearanceRequest, decision: 'approved' | 'rejected') => {
    const note = (noteById[c.id] || '').trim();
    const res = Storage.reviewGraduationClearanceEducationGate(c.id, {
      decision,
      reviewerId,
      reviewerName,
      note,
    });
    if (res.success) {
      showFeedback('success', res.message);
      setNoteById((prev) => ({ ...prev, [c.id]: '' }));
      setRefreshTick((t) => t + 1);
      onDataChange();
    } else {
      showFeedback('error', res.message);
    }
  };

  const handleUnitDecision = (
    c: GraduationClearanceRequest,
    targetRole: ClearanceUnitRole,
    decision: 'approved' | 'rejected'
  ) => {
    const note = (noteById[c.id] || '').trim();
    const res = Storage.reviewGraduationClearanceUnit(c.id, {
      unitRole: targetRole,
      decision,
      reviewerId,
      reviewerName,
      note,
    });
    if (res.success) {
      showFeedback('success', res.message);
      setNoteById((prev) => ({ ...prev, [c.id]: '' }));
      setRefreshTick((t) => t + 1);
      onDataChange();
    } else {
      showFeedback('error', res.message);
    }
  };

  const getApprovedCount = (c: GraduationClearanceRequest) =>
    CLEARANCE_UNITS_META.filter((u) => c.units?.[u.role]?.status === 'approved').length;

  return (
    <div className="space-y-5">
      {/* سربرگ بخش تسویه حساب */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {unitRole === 'education'
                  ? 'دروازه تایید آموزش و گردش کار تسویه حساب فارغ‌التحصیلان'
                  : unitRole === 'admin'
                  ? 'نظارت جامع بر پرونده‌های تسویه حساب الکترونیک فراغت از تحصیل'
                  : `کارتابل تسویه حساب فارغ‌التحصیلان — ${unitMeta?.label || ''}`}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {unitRole === 'education'
                  ? 'درخواست‌های تسویه حساب ابتدا جهت تایید گذراندن کلیه واحدهای درسی به کارتابل شما ارسال می‌شود. پس از تایید، فرم عکس‌دار دانشجو به تمامی ۱۲ واحد سامانه ارسال می‌گردد.'
                  : unitRole === 'admin'
                  ? 'پایش زنده وضعیت تاییدیه کلیه واحدها، مشاهده جزئیات هر پرونده و امکان چاپ فرم نهایی تسویه حساب.'
                  : 'فرم‌های عکس‌دار دانشجویانی که تایید واحد آموزش را دریافت کرده‌اند در اینجا نمایش داده می‌شوند. وضعیت تسویه را تایید یا با ذکر توضیحات رد نمایید.'}
              </p>
            </div>
          </div>

          {/* آمار فشرده */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
            <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 text-center">
              <div className="text-lg font-black tabular-nums text-amber-700 dark:text-amber-300">
                {stats.pending.toLocaleString('fa-IR')}
              </div>
              <div className="text-[11px] font-bold text-amber-800/80 dark:text-amber-400">در انتظار بررسی</div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 text-center">
              <div className="text-lg font-black tabular-nums text-emerald-700 dark:text-emerald-300">
                {stats.approved.toLocaleString('fa-IR')}
              </div>
              <div className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-400">
                {unitRole === 'admin' ? 'در حال گردش' : 'تاییدشده'}
              </div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/60 text-center">
              <div className="text-lg font-black tabular-nums text-rose-700 dark:text-rose-300">
                {stats.rejected.toLocaleString('fa-IR')}
              </div>
              <div className="text-[11px] font-bold text-rose-800/80 dark:text-rose-400">دارای نقص / ردشده</div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-800/60 text-center">
              <div className="text-lg font-black tabular-nums text-teal-700 dark:text-teal-300">
                {stats.completed.toLocaleString('fa-IR')}
              </div>
              <div className="text-[11px] font-bold text-teal-800/80 dark:text-teal-400">تسویه کامل</div>
            </div>
          </div>
        </div>

        {/* نوار جستجو و فیلتر */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو با نام دانشجو، شماره دانشجویی، کد رهگیری یا رشته..."
              className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'pending', label: 'در انتظار بررسی' },
                { id: 'approved', label: unitRole === 'admin' ? 'در حال گردش' : 'تاییدشده' },
                { id: 'rejected', label: 'ردشده / دارای نقص' },
                { id: 'completed', label: 'تکمیل‌شده' },
                { id: 'all', label: 'همه پرونده‌ها' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
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

      {/* فهرست پرونده‌ها */}
      {filteredList.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
          <FileCheck2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2.5" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            پرونده تسویه حسابی در این فیلتر وجود ندارد.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {unitRole === 'education'
              ? 'به‌محض ثبت درخواست تسویه توسط دانشجویان فارغ‌التحصیل، پرونده در اینجا نمایش داده می‌شود.'
              : 'پرونده‌های تاییدشده توسط واحد آموزش به‌صورت خودکار در کارتابل شما قرار می‌گیرند.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((c) => {
            const approvedCount = getApprovedCount(c);
            const totalUnits = CLEARANCE_UNITS_META.length;
            const progressPct = Math.round((approvedCount / totalUnits) * 100);
            const myDecision = unitRole !== 'admin' ? c.units?.[unitRole] : undefined;

            // هشدارهای هوشمند واحدها
            const activeBooksCount =
              unitRole === 'library' || unitRole === 'admin'
                ? libraryRequests.filter((r) => r.studentId === c.studentId && r.status === 'approved').length
                : 0;
            const unpaidBillsCount =
              unitRole === 'finance' || unitRole === 'admin'
                ? studentFinances.filter(
                    (f) =>
                      f.studentId === c.studentId &&
                      ((f.debtAmount || 0) > 0 || f.financialStatus === 'debtor' || f.financialStatus === 'pending_payment')
                  ).length
                : 0;

            const isEducationStage1 = unitRole === 'education' && c.status === 'pending_education';
            const canDecideMyUnit =
              unitRole !== 'admin' &&
              unitRole !== 'education' &&
              c.educationGateStatus === 'approved';
            const isExpanded = expandedId === c.id;

            return (
              <div
                key={c.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col lg:flex-row items-start gap-4">
                  {/* عکس پرسنلی دانشجو روی فرم تسویه */}
                  <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                    {c.studentPhotoUrl ? (
                      <img
                        src={c.studentPhotoUrl}
                        alt={c.studentName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 text-center p-1">
                        <User className="w-7 h-7" />
                        <span className="text-[10px] font-bold mt-1">بدون عکس</span>
                      </div>
                    )}
                  </div>

                  {/* اطلاعات فرم تسویه */}
                  <div className="flex-1 min-w-0 space-y-2.5 w-full">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                          {c.studentName}
                        </h3>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono text-xs font-bold" dir="ltr">
                          {c.studentId}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-mono text-xs font-bold border border-teal-200 dark:border-teal-800" dir="ltr">
                          {c.trackingCode}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {c.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            تسویه کامل ({totalUnits}/{totalUnits})
                          </span>
                        ) : c.status === 'pending_education' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            در انتظار تایید واحدهای درسی (آموزش)
                          </span>
                        ) : c.status === 'rejected_education' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            رد شده در مرحله آموزش
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            در حال گردش ({approvedCount} از {totalUnits})
                          </span>
                        )}

                        {(unitRole === 'admin' || unitRole === 'education') && (
                          <button
                            type="button"
                            onClick={() => setPrintTarget(c)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                            title="مشاهده و چاپ فرم رسمی تسویه حساب"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>فرم چاپی</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400">رشته: </span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{c.studentFieldOfStudy}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">ورودی: </span>
                        <span className="font-bold">{c.studentEntryTerm}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">تلفن تماس: </span>
                        <span className="font-mono font-bold" dir="ltr">{c.studentPhone || '---'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">فراغت: </span>
                        <span className="font-bold text-teal-700 dark:text-teal-300">
                          {c.graduationAcademicYear} ({c.graduationSemester})
                        </span>
                      </div>
                      {!restrictStudentPrivacy && c.studentNationalId && (
                        <div>
                          <span className="text-slate-400">کد ملی: </span>
                          <span className="font-mono font-bold" dir="ltr">{c.studentNationalId}</span>
                        </div>
                      )}
                      {!restrictStudentPrivacy && c.dormName && (
                        <div className="inline-flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold">
                            {c.dormName}
                            {c.roomNumber ? ` - اتاق ${c.roomNumber}` : ''}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400">تاریخ ثبت: </span>
                        <span className="font-medium">{c.requestedAt}</span>
                      </div>
                    </div>

                    {c.studentNote && (
                      <div className="text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                        <span className="font-bold text-slate-500">توضیح دانشجو: </span>
                        {c.studentNote}
                      </div>
                    )}

                    {/* هشدارهای خودکار کتابخانه و مالی */}
                    <div className="flex flex-wrap gap-2">
                      {activeBooksCount > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>
                            هشدار کتابخانه: این دانشجو هم‌اکنون {activeBooksCount.toLocaleString('fa-IR')} جلد کتاب امانی تحویل‌نداده دارد!
                          </span>
                        </div>
                      )}
                      {unitRole === 'library' && activeBooksCount === 0 && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>کتاب امانی تسویه‌نشده در سامانه ندارد.</span>
                        </div>
                      )}
                      {unpaidBillsCount > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
                          <Wallet className="w-3.5 h-3.5" />
                          <span>
                            هشدار مالی: {unpaidBillsCount.toLocaleString('fa-IR')} قبض / بدهی پرداخت‌نشده برای این دانشجو ثبت شده است.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* نوار پیشرفت کلی */}
                    {c.educationGateStatus === 'approved' && (
                      <div className="pt-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                          <span>پیشرفت تاییدیه کلیه واحدهای سامانه</span>
                          <span className="tabular-nums text-teal-700 dark:text-teal-300">
                            {approvedCount} از {totalUnits} ({progressPct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              c.status === 'completed' ? 'bg-emerald-500' : 'bg-teal-500'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* وضعیت تصمیم فعلی این واحد */}
                {myDecision && c.educationGateStatus === 'approved' && unitRole !== 'education' && (
                  <div
                    className={`px-3.5 py-2.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
                      myDecision.status === 'approved'
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : myDecision.status === 'rejected'
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                        : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                    }`}
                  >
                    <div>
                      <span className="font-black">وضعیت در واحد شما ({unitMeta?.label}): </span>
                      <span className="font-bold">
                        {myDecision.status === 'approved'
                          ? 'تایید شده'
                          : myDecision.status === 'rejected'
                          ? 'رد شده (در انتظار رفع نقص دانشجو)'
                          : 'در انتظار اعلام نظر شما'}
                      </span>
                      {myDecision.note && (
                        <span className="mr-2 opacity-90">— {myDecision.note}</span>
                      )}
                    </div>
                    {myDecision.reviewerName && (
                      <span className="text-[11px] opacity-80">
                        توسط {myDecision.reviewerName} ({myDecision.reviewedAt})
                      </span>
                    )}
                  </div>
                )}

                {/* بخش اقدام کارشناس آموزش (مرحله اول) */}
                {isEducationStage1 && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                      بررسی گذراندن کلیه واحدهای درسی و ارسال فرم عکس‌دار به تمام واحدهای سامانه:
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={noteById[c.id] || ''}
                        onChange={(e) => setNoteById((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        placeholder="توضیحات کارشناس آموزش (در صورت رد درخواست، ذکر علت الزامی است)..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleEducationGateDecision(c, 'approved')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>تایید واحدها و ارسال به کلیه واحدها</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEducationGateDecision(c, 'rejected')}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>رد درخواست</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* بخش اقدام هر واحد پس از تایید آموزش */}
                {canDecideMyUnit && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={noteById[c.id] || ''}
                        onChange={(e) => setNoteById((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        placeholder="توضیحات واحد شما (مثلاً: تحویل کامل کتاب‌ها / تسویه مالی / علت رد در صورت وجود نقص)..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleUnitDecision(c, unitRole, 'approved')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تایید تسویه</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUnitDecision(c, unitRole, 'rejected')}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>رد با توضیحات</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* نمایش جزئیات گردش کار کل ۱۲ واحد */}
                {c.educationGateStatus === 'approved' && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isExpanded ? 'بستن وضعیت تفکیکی ۱۲ واحد' : 'مشاهده وضعیت تفکیکی کلیه واحدها (۱۲ واحد)'}</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {CLEARANCE_UNITS_META.map((u) => {
                          const rec = c.units?.[u.role];
                          const st = rec?.status || 'pending';
                          return (
                            <div
                              key={u.role}
                              className={`p-2.5 rounded-xl border text-xs ${
                                st === 'approved'
                                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/70'
                                  : st === 'rejected'
                                  ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/70'
                                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-extrabold text-slate-800 dark:text-slate-100">{u.label}</span>
                                {st === 'approved' ? (
                                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3" /> تایید شد
                                  </span>
                                ) : st === 'rejected' ? (
                                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-0.5">
                                    <XCircle className="w-3 h-3" /> رد شد
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-0.5">
                                    <Clock className="w-3 h-3" /> در انتظار
                                  </span>
                                )}
                              </div>
                              {rec?.reviewerName && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                  {rec.reviewerName} • {rec.reviewedAt}
                                </div>
                              )}
                              {rec?.note && (
                                <div className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 leading-snug">
                                  {rec.note}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {unitRole === 'admin' && c.status === 'pending_education' && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>این پرونده در صف تایید اولیه کارشناس آموزش (بررسی گذراندن واحدهای درسی) قرار دارد.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {printTarget && (
        <GraduationClearancePrintModal
          isOpen={true}
          onClose={() => setPrintTarget(null)}
          clearance={printTarget}
          settings={settings}
        />
      )}
    </div>
  );
};
