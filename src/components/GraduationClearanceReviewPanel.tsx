import React, { useMemo, useState } from 'react';
import {
  AppSettings,
  ClearanceUnitRole,
  GraduationClearanceRequest,
} from '../types';
import { CLEARANCE_UNITS_META, Storage, normalizePersianSearch } from '../utils/storage';
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
  /**
   * برای کارشناس آموزش بر اساس رشته: اگر تعریف شده باشد، فقط پرونده‌های دانشجویان رشته‌های تحت پوشش نمایش داده می‌شود.
   */
  allowedFields?: string[];
  /**
   * تفکیک نقش در حوزه آموزش: کارشناس آموزش (دروازه اول) یا مدیر گروه رشته (دروازه دوم - گزارش ۱۰۵۰ گلستان)
   */
  educationSubRole?: 'expert' | 'department_head';
}

export const GraduationClearanceReviewPanel: React.FC<GraduationClearanceReviewPanelProps> = ({
  unitRole,
  reviewerId,
  reviewerName,
  settings,
  onDataChange,
  restrictStudentPrivacy = false,
  allowedFields,
  educationSubRole = 'expert',
}) => {
  const isDeptHeadMode = unitRole === 'education' && educationSubRole === 'department_head';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('pending');
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [report1050ById, setReport1050ById] = useState<Record<string, boolean>>({});
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

  const normalizedAllowedFields = useMemo(
    () => (Array.isArray(allowedFields) ? allowedFields.map((f) => normalizePersianSearch(f)).filter(Boolean) : []),
    [allowedFields]
  );

  const relevantClearances = useMemo(() => {
    const fieldScoped =
      normalizedAllowedFields.length > 0
        ? clearances.filter((c) => normalizedAllowedFields.includes(normalizePersianSearch(c.studentFieldOfStudy)))
        : clearances;
    if (unitRole === 'admin' || unitRole === 'education') {
      return fieldScoped;
    }
    // سایر واحدها فقط پرونده‌هایی را می‌بینند که تایید اولیه واحد آموزش را گرفته‌اند
    return fieldScoped.filter(
      (c) => c.educationGateStatus === 'approved' && (c.status === 'in_clearance' || c.status === 'completed')
    );
  }, [clearances, unitRole, normalizedAllowedFields]);

  const stats = useMemo(() => {
    if (isDeptHeadMode) {
      return {
        pending: relevantClearances.filter((c) => c.status === 'pending_dept_head').length,
        approved: relevantClearances.filter(
          (c) => c.deptHeadGateStatus === 'approved' || c.status === 'in_clearance' || c.status === 'completed'
        ).length,
        rejected: relevantClearances.filter((c) => c.status === 'rejected_dept_head').length,
        completed: relevantClearances.filter((c) => c.status === 'completed').length,
      };
    }
    if (unitRole === 'education') {
      return {
        pending: relevantClearances.filter((c) => c.status === 'pending_education').length,
        approved: relevantClearances.filter((c) => c.educationGateStatus === 'approved').length,
        rejected: relevantClearances.filter(
          (c) => c.status === 'rejected_education' || c.status === 'rejected_dept_head'
        ).length,
        completed: relevantClearances.filter((c) => c.status === 'completed').length,
      };
    }
    if (unitRole === 'admin') {
      return {
        pending: relevantClearances.filter(
          (c) =>
            c.status === 'pending_education' ||
            c.status === 'pending_dept_head' ||
            c.status === 'in_clearance'
        ).length,
        approved: relevantClearances.filter((c) => c.status === 'in_clearance').length,
        rejected: relevantClearances.filter(
          (c) =>
            c.status === 'rejected_education' ||
            c.status === 'rejected_dept_head' ||
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
  }, [relevantClearances, unitRole, isDeptHeadMode]);

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

      if (isDeptHeadMode) {
        if (statusFilter === 'pending') return c.status === 'pending_dept_head';
        if (statusFilter === 'approved') {
          return (
            c.deptHeadGateStatus === 'approved' ||
            c.status === 'in_clearance' ||
            c.status === 'completed'
          );
        }
        if (statusFilter === 'rejected') return c.status === 'rejected_dept_head';
      } else if (unitRole === 'education') {
        if (statusFilter === 'pending') return c.status === 'pending_education';
        if (statusFilter === 'approved') return c.educationGateStatus === 'approved';
        if (statusFilter === 'rejected') {
          return c.status === 'rejected_education' || c.status === 'rejected_dept_head';
        }
      } else if (unitRole === 'admin') {
        if (statusFilter === 'pending') {
          return (
            c.status === 'pending_education' ||
            c.status === 'pending_dept_head' ||
            c.status === 'in_clearance'
          );
        }
        if (statusFilter === 'approved') return c.status === 'in_clearance';
        if (statusFilter === 'rejected') {
          return (
            c.status === 'rejected_education' ||
            c.status === 'rejected_dept_head' ||
            CLEARANCE_UNITS_META.some((u) => c.units?.[u.role]?.status === 'rejected')
          );
        }
      } else {
        const myStatus = c.units?.[unitRole]?.status || 'pending';
        return myStatus === statusFilter;
      }
      return true;
    });
  }, [relevantClearances, searchQuery, statusFilter, unitRole, isDeptHeadMode, restrictStudentPrivacy]);

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

  const handleDeptHeadGateDecision = (c: GraduationClearanceRequest, decision: 'approved' | 'rejected') => {
    const note = (noteById[c.id] || '').trim();
    const res = Storage.reviewGraduationClearanceDeptHeadGate(c.id, {
      decision,
      reviewerId,
      reviewerName,
      report1050Verified: Boolean(report1050ById[c.id]),
      note,
    });
    if (res.success) {
      showFeedback('success', res.message);
      setNoteById((prev) => ({ ...prev, [c.id]: '' }));
      setReport1050ById((prev) => ({ ...prev, [c.id]: false }));
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
                {isDeptHeadMode
                  ? 'دروازه دوم تسویه حساب — تأیید مدیر گروه رشته (گزارش ۱۰۵۰ سامانه گلستان)'
                  : unitRole === 'education'
                  ? 'دروازه اول تایید کارشناس آموزش و گردش کار تسویه حساب فارغ‌التحصیلان'
                  : unitRole === 'admin'
                  ? 'نظارت جامع بر پرونده‌های تسویه حساب الکترونیک فراغت از تحصیل'
                  : `کارتابل تسویه حساب فارغ‌التحصیلان — ${unitMeta?.label || ''}`}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {isDeptHeadMode
                  ? 'پرونده‌هایی که توسط کارشناس آموزش تأیید شده‌اند در اینجا قرار می‌گیرند. پس از بررسی و تأیید گذراندن کلیه واحدهای الزامی سرفصل رشته طبق گزارش ۱۰۵۰ سامانه گلستان، فرم عکس‌دار به‌صورت خودکار به تمامی ۱۲ واحد دانشگاه ارسال می‌گردد.'
                  : unitRole === 'education'
                  ? 'درخواست‌های تسویه حساب ابتدا به کارتابل کارشناس آموزش ارسال می‌شود. پس از تأیید شما، پرونده جهت تأیید انطباق سرفصل با گزارش ۱۰۵۰ سامانه گلستان به مدیر گروه رشته ارجاع شده و سپس در ۱۲ واحد دانشگاه به گردش درمی‌آید.'
                  : unitRole === 'admin'
                  ? 'پایش زنده وضعیت تاییدیه کارشناس آموزش، مدیر گروه رشته (گزارش ۱۰۵۰ گلستان) و کلیه ۱۲ واحد دانشگاه به همراه چاپ فرم نهایی.'
                  : 'فرم‌های عکس‌دار دانشجویانی که تایید کارشناس آموزش و مدیر گروه رشته (گزارش ۱۰۵۰ گلستان) را دریافت کرده‌اند در اینجا نمایش داده می‌شوند.'}
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

            const isEducationStage1 =
              unitRole === 'education' && !isDeptHeadMode && c.status === 'pending_education';
            const isDeptHeadStage2 = isDeptHeadMode && c.status === 'pending_dept_head';
            const canDecideMyUnit =
              unitRole !== 'admin' &&
              unitRole !== 'education' &&
              c.educationGateStatus === 'approved' &&
              (c.status === 'in_clearance' || c.status === 'completed');
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
                            در انتظار تایید کارشناس آموزش (مرحله ۱)
                          </span>
                        ) : c.status === 'pending_dept_head' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-200 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            در انتظار تایید مدیر گروه رشته — گزارش ۱۰۵۰ (مرحله ۲)
                          </span>
                        ) : c.status === 'rejected_education' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            رد شده در مرحله کارشناس آموزش
                          </span>
                        ) : c.status === 'rejected_dept_head' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            رد شده توسط مدیر گروه (نقص گزارش ۱۰۵۰)
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

                {/* نمایش وضعیت تأیید کارشناس آموزش و مدیر گروه (گزارش ۱۰۵۰) */}
                {(c.educationGateStatus === 'approved' || c.deptHeadGateStatus) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {c.educationGateStatus === 'approved' && (
                      <div className="px-3 py-2 rounded-xl bg-teal-50/70 dark:bg-teal-950/25 border border-teal-200 dark:border-teal-800/70 text-teal-900 dark:text-teal-200">
                        <span className="font-black">مرحله ۱ — کارشناس آموزش: </span>
                        <span>تأیید شد</span>
                        {c.educationReviewerName && (
                          <span className="opacity-80 mr-1">
                            ({c.educationReviewerName} • {c.educationReviewedAt})
                          </span>
                        )}
                      </div>
                    )}
                    {c.deptHeadGateStatus === 'approved' ? (
                      <div className="px-3 py-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/25 border border-indigo-200 dark:border-indigo-800/70 text-indigo-900 dark:text-indigo-200">
                        <span className="font-black">مرحله ۲ — مدیر گروه (گزارش ۱۰۵۰ گلستان): </span>
                        <span>تأیید شد</span>
                        {c.deptHeadReviewerName && (
                          <span className="opacity-80 mr-1">
                            ({c.deptHeadReviewerName} • {c.deptHeadReviewedAt})
                          </span>
                        )}
                      </div>
                    ) : c.deptHeadGateStatus === 'rejected' ? (
                      <div className="px-3 py-2 rounded-xl bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-800/70 text-rose-900 dark:text-rose-200">
                        <span className="font-black">مرحله ۲ — مدیر گروه (گزارش ۱۰۵۰): </span>
                        <span>رد شد — {c.deptHeadNote}</span>
                      </div>
                    ) : c.status === 'pending_dept_head' ? (
                      <div className="px-3 py-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-200">
                        <span className="font-black">مرحله ۲ — مدیر گروه رشته: </span>
                        <span>در انتظار بررسی و تأیید گزارش ۱۰۵۰ سامانه گلستان</span>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* بخش اقدام کارشناس آموزش (مرحله اول) */}
                {isEducationStage1 && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                      مرحله ۱ — بررسی اولیه پرونده توسط کارشناس آموزش و ارجاع به مدیر گروه رشته (تأیید گزارش ۱۰۵۰ گلستان):
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
                        <span>تایید و ارجاع به مدیر گروه رشته</span>
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

                {/* بخش اقدام مدیر گروه رشته (مرحله دوم — تأیید گزارش ۱۰۵۰ سامانه گلستان) */}
                {isDeptHeadStage2 && (
                  <div className="pt-3 border-t border-indigo-200 dark:border-indigo-800 space-y-3 bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 rounded-2xl">
                    <div className="text-xs font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>مرحله ۲ — تأییدیه مدیر گروه رشته (تطبیق واحدهای سرفصل با گزارش ۱۰۵۰ سامانه گلستان)</span>
                    </div>

                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(report1050ById[c.id])}
                        onChange={(e) =>
                          setReport1050ById((prev) => ({ ...prev, [c.id]: e.target.checked }))
                        }
                        className="mt-0.5 w-4 h-4 accent-indigo-600 shrink-0"
                      />
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 leading-relaxed">
                        تأیید می‌کنم دانشجو <strong>«{c.studentName}»</strong> تمامی واحدهای الزامی سرفصل رشته{' '}
                        <strong>{c.studentFieldOfStudy}</strong> را طبق{' '}
                        <strong className="text-indigo-700 dark:text-indigo-300">گزارش ۱۰۵۰ سامانه گلستان</strong> با موفقیت گذرانده است.
                      </span>
                    </label>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={noteById[c.id] || ''}
                        onChange={(e) => setNoteById((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        placeholder="توضیحات مدیر گروه (در صورت رد / کسری واحد در گزارش ۱۰۵۰، ذکر علت الزامی است)..."
                        className="flex-1 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeptHeadGateDecision(c, 'approved')}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>تأیید گزارش ۱۰۵۰ و ارسال به ۱۲ واحد</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeptHeadGateDecision(c, 'rejected')}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>رد (نقص سرفصل)</span>
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

                {unitRole === 'admin' && (c.status === 'pending_education' || c.status === 'pending_dept_head') && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      {c.status === 'pending_education'
                        ? 'این پرونده در صف تأیید اولیه کارشناس آموزش (مرحله ۱) قرار دارد.'
                        : 'این پرونده در صف تأیید مدیر گروه رشته جهت انطباق سرفصل با گزارش ۱۰۵۰ سامانه گلستان (مرحله ۲) قرار دارد.'}
                    </span>
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
