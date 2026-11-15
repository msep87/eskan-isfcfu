import React, { useMemo, useState } from 'react';
import {
  Bed,
  Dormitory,
  FinanceStaff,
  Message,
  Room,
  Student,
  StudentFinancialRecord,
  StudentFinancialStatus,
} from '../types';
import { Storage } from '../utils/storage';
import {
  computeStudentFinancialInfo,
  FINANCIAL_STATUS_LABELS,
  isStudentDormResident,
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
} from '../utils/financeUtils';
import {
  downloadStudentDebtTemplate,
  exportDormStudentsForFinanceExcel,
  ParsedStudentDebtRow,
  parseStudentDebtExcel,
  toEnglishDigits,
} from '../utils/excelUtils';
import {
  AlertCircle,
  BookOpen,
  Building2,
  Calculator,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  FileSpreadsheet,
  Filter,
  Landmark,
  MessageSquare,
  RotateCcw,
  Save,
  Search,
  Send,
  UploadCloud,
  Users,
  Wallet,
  X,
} from 'lucide-react';

interface FinanceDashboardProps {
  staff: FinanceStaff;
  dorms: Dormitory[];
  rooms: Room[];
  beds: Bed[];
  students: Student[];
  studentFinances: StudentFinancialRecord[];
  messages: Message[];
  onRefreshData: () => void;
  onOpenMessages: () => void;
  onOpenUserGuide?: (role?: 'finance') => void;
}

const PAGE_SIZE = 25;

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  staff,
  dorms,
  rooms,
  students,
  studentFinances,
  messages,
  onRefreshData,
  onOpenMessages,
  onOpenUserGuide,
}) => {
  // جستجو و فیلترهای کارتابل مالی
  const [searchQuery, setSearchQuery] = useState('');
  const [residenceFilter, setResidenceFilter] = useState<'dorm_only' | 'all' | 'commuter'>('dorm_only');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | PaymentMethod>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | StudentFinancialStatus>('all');
  const [dormFilter, setDormFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // پیام بازخورد
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // مدال ویرایش وضعیت مالی و بدهی دانشجو
  const [editTargetStudent, setEditTargetStudent] = useState<Student | null>(null);
  const [formDeductionRate, setFormDeductionRate] = useState<45 | 25>(45);
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('auto_payroll');
  const [formFinancialStatus, setFormFinancialStatus] = useState<StudentFinancialStatus>('auto_deducting');
  const [formDebtAmount, setFormDebtAmount] = useState<string>('0');
  const [formPaidAmount, setFormPaidAmount] = useState<string>('0');
  const [formDocNumber, setFormDocNumber] = useState<string>('');
  const [formFiscalNote, setFormFiscalNote] = useState<string>('');
  const [isSavingFinance, setIsSavingFinance] = useState(false);

  // مدال ارسال پیام مستقیم به دانشجو
  const [msgTargetStudent, setMsgTargetStudent] = useState<Student | null>(null);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // مدال پیش‌نمایش و ثبت اکسل بدهی
  const [debtExcelPreview, setDebtExcelPreview] = useState<{
    rows: ParsedStudentDebtRow[];
    skippedRows: number;
  } | null>(null);
  const [isUploadingDebtExcel, setIsUploadingDebtExcel] = useState(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
  };

  const financeMap = useMemo(() => {
    const map = new Map<string, StudentFinancialRecord>();
    studentFinances.forEach((f) => map.set(f.studentId, f));
    return map;
  }, [studentFinances]);

  const unreadFinanceMessagesCount = useMemo(() => {
    return messages.filter(
      (m) =>
        (m.receiverType === 'finance' || m.category === 'financial' || m.senderRole === 'finance') &&
        m.status !== 'answered'
    ).length;
  }, [messages]);

  // ساخت ردیف‌های مجاز و پردازش‌شده (صرفاً با ۱۰ فیلد مجاز دانشجو + داده‌های مالی)
  const enrichedRows = useMemo(() => {
    return students.map((st) => {
      const dorm = dorms.find((d) => d.id === st.assignedDormId);
      const room = rooms.find((r) => r.id === st.assignedRoomId);
      const rec = financeMap.get(st.studentId);
      const fin = computeStudentFinancialInfo(st, rec);
      const dormName = dorm?.name || st.assignedDormName || '';
      const roomNumber = room?.roomNumber || st.assignedRoomNumber || '';
      const prevDormStr = st.previousDorm && st.previousDorm !== '-' ? st.previousDorm : '';
      const prevRoomStr = st.previousRoom && st.previousRoom !== '-' ? `اتاق ${st.previousRoom}` : '';
      const previousAccommodationLabel =
        prevDormStr || prevRoomStr
          ? [prevDormStr, prevRoomStr].filter(Boolean).join(' - ')
          : 'فاقد اسکان سال قبل';

      return {
        student: st,
        dormName,
        roomNumber,
        previousAccommodationLabel,
        fin,
      };
    });
  }, [students, dorms, rooms, financeMap]);

  // شاخص‌های کلیدی بالای کارتابل
  const kpiStats = useMemo(() => {
    let dormResidents = 0;
    let commuters = 0;
    let outOfProvinceDorm = 0;
    let debtorsCount = 0;
    let totalDebt = 0;

    enrichedRows.forEach(({ fin }) => {
      if (fin.isDormResident) dormResidents++;
      else commuters++;

      if (fin.isDormResident && fin.paymentMethod === 'in_person_accounting') {
        outOfProvinceDorm++;
      }

      if (fin.debtAmount > 0 || fin.financialStatus === 'debtor') {
        debtorsCount++;
        totalDebt += fin.debtAmount;
      }
    });

    return {
      dormResidents,
      commuters,
      outOfProvinceDorm,
      debtorsCount,
      totalDebt,
    };
  }, [enrichedRows]);

  const filteredRows = useMemo(() => {
    const q = toEnglishDigits(searchQuery.trim().toLowerCase());

    return enrichedRows.filter(({ student: st, dormName, roomNumber, fin }) => {
      if (residenceFilter === 'dorm_only' && !fin.isDormResident) return false;
      if (residenceFilter === 'commuter' && fin.isDormResident) return false;

      if (dormFilter !== 'all') {
        if (st.assignedDormId !== dormFilter) return false;
      }

      if (paymentMethodFilter !== 'all' && fin.paymentMethod !== paymentMethodFilter) {
        return false;
      }

      if (statusFilter !== 'all' && fin.financialStatus !== statusFilter) {
        return false;
      }

      if (q) {
        const hay = toEnglishDigits(
          [
            st.studentId,
            st.nationalId,
            st.fullName,
            st.fatherName,
            st.fieldOfStudy,
            st.entryTerm,
            dormName,
            roomNumber,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
        );
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [enrichedRows, residenceFilter, dormFilter, paymentMethodFilter, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, safePage]);

  const resetFilters = () => {
    setSearchQuery('');
    setResidenceFilter('dorm_only');
    setPaymentMethodFilter('all');
    setStatusFilter('all');
    setDormFilter('all');
    setCurrentPage(1);
  };

  // باز کردن مدال ویرایش وضعیت مالی دانشجو
  const handleOpenFinanceModal = (st: Student) => {
    const fin = computeStudentFinancialInfo(st, financeMap.get(st.studentId));
    setEditTargetStudent(st);
    setFormDeductionRate(fin.deductionRate);
    setFormPaymentMethod(fin.paymentMethod);
    setFormFinancialStatus(fin.financialStatus);
    setFormDebtAmount(String(fin.debtAmount || 0));
    setFormPaidAmount(String(fin.paidAmount || 0));
    setFormDocNumber(fin.documentNumber || '');
    setFormFiscalNote(fin.fiscalNote || '');
  };

  const handleSaveFinanceModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTargetStudent) return;
    setIsSavingFinance(true);
    try {
      const debt = Math.max(0, Number(toEnglishDigits(formDebtAmount).replace(/[^\d]/g, '')) || 0);
      const paid = Math.max(0, Number(toEnglishDigits(formPaidAmount).replace(/[^\d]/g, '')) || 0);

      Storage.upsertStudentFinance({
        studentId: editTargetStudent.studentId,
        deductionRate: formDeductionRate,
        paymentMethod: formPaymentMethod,
        financialStatus: formFinancialStatus,
        debtAmount: debt,
        paidAmount: paid,
        documentNumber: formDocNumber.trim() || undefined,
        fiscalNote: formFiscalNote.trim() || undefined,
        updatedBy: staff.fullName,
      });

      const syncRes = await Storage.waitForPendingCloudSync();
      onRefreshData();
      setEditTargetStudent(null);
      showToast(
        syncRes.success ? 'success' : 'error',
        syncRes.success
          ? `وضعیت مالی «${editTargetStudent.fullName}» با موفقیت ثبت و در فضای ابری ذخیره شد.`
          : `وضعیت مالی در مرورگر ثبت شد اما همگام‌سازی ابری با تأخیر مواجه گردید.`
      );
    } finally {
      setIsSavingFinance(false);
    }
  };

  // باز کردن مدال ارسال پیام به دانشجو
  const handleOpenMessageModal = (st: Student) => {
    const fin = computeStudentFinancialInfo(st, financeMap.get(st.studentId));
    setMsgTargetStudent(st);
    setMsgSubject(
      fin.debtAmount > 0
        ? 'اطلاع‌رسانی بدهی و تسویه حساب مالی سرا'
        : fin.paymentMethod === 'in_person_accounting'
        ? 'اطلاع‌رسانی مراجعه حضوری به امور مالی و حسابداری'
        : 'اطلاعیه واحد امور مالی و حسابداری'
    );
    setMsgContent(
      fin.paymentMethod === 'in_person_accounting'
        ? `دانشجومعلم گرامی ${st.fullName}، با توجه به ثبت وضعیت شما به عنوان دانشجوی خارج از استان اصفهان (${fin.deductionRate}٪ کسورات قانونی)، لطفاً جهت بررسی و تسویه حساب به واحد امور مالی و حسابداری مراجعه فرمایید.`
        : ''
    );
  };

  const handleSendStudentMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgTargetStudent || !msgSubject.trim() || !msgContent.trim()) return;
    setIsSendingMsg(true);
    try {
      Storage.addMessage({
        senderId: staff.id,
        senderName: `${staff.fullName} (امور مالی و حسابداری)`,
        senderRole: 'finance',
        receiverType: 'student',
        receiverId: msgTargetStudent.studentId,
        subject: msgSubject.trim(),
        content: msgContent.trim(),
        category: 'financial',
        date:
          new Date().toLocaleDateString('fa-IR') +
          ' - ' +
          new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      });

      Storage.addActivityLog({
        category: 'finance',
        action: 'ارسال پیام مالی به دانشجو',
        details: `پیام مالی با عنوان «${msgSubject.trim()}» به ${msgTargetStudent.fullName} (${msgTargetStudent.studentId}) ارسال شد.`,
        targetName: `${msgTargetStudent.fullName} (${msgTargetStudent.studentId})`,
        actorName: staff.fullName,
        actorRole: 'finance',
        actorUsername: staff.username,
      });

      await Storage.waitForPendingCloudSync();
      onRefreshData();
      setMsgTargetStudent(null);
      showToast('success', `پیام به کارتابل «${msgTargetStudent.fullName}» ارسال شد.`);
    } finally {
      setIsSendingMsg(false);
    }
  };

  // بارگذاری فایل اکسل بدهی‌ها
  const handleDebtExcelSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const parsed = await parseStudentDebtExcel(file);
      setDebtExcelPreview(parsed);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'خطا در خواندن فایل اکسل بدهی‌ها.');
    }
  };

  const handleConfirmDebtExcelUpload = async () => {
    if (!debtExcelPreview) return;
    setIsUploadingDebtExcel(true);
    try {
      const res = Storage.batchUpdateStudentDebtsFromExcel(debtExcelPreview.rows, staff.fullName);
      const syncRes = await Storage.waitForPendingCloudSync();
      onRefreshData();
      setDebtExcelPreview(null);

      if (res.matchedCount === 0) {
        showToast('error', 'هیچ‌یک از کدهای دانشجویی یا کد ملی‌های فایل اکسل در سامانه یافت نشد.');
      } else {
        const unmatchedPart =
          res.unmatchedKeys.length > 0 ? ` (${res.unmatchedKeys.length} ردیف یافت نشد)` : '';
        showToast(
          syncRes.success ? 'success' : 'error',
          `میزان بدهی برای ${res.matchedCount} دانشجو با موفقیت ثبت شد${unmatchedPart}.`
        );
      }
    } finally {
      setIsUploadingDebtExcel(false);
    }
  };

  const previewMatches = useMemo(() => {
    if (!debtExcelPreview) return { matched: [], unmatched: [] as ParsedStudentDebtRow[] };
    const normKey = (v?: string) => toEnglishDigits(String(v ?? '')).trim().toLowerCase();
    const matched: Array<{
      row: ParsedStudentDebtRow;
      student: Student;
      prevDebt: number;
      isDorm: boolean;
    }> = [];
    const unmatched: ParsedStudentDebtRow[] = [];

    debtExcelPreview.rows.forEach((row) => {
      const sk = normKey(row.studentId);
      const nk = normKey(row.nationalId);
      const found =
        (sk && students.find((s) => normKey(s.studentId) === sk)) ||
        (nk && students.find((s) => normKey(s.nationalId) === nk));
      if (found) {
        matched.push({
          row,
          student: found,
          prevDebt: financeMap.get(found.studentId)?.debtAmount || 0,
          isDorm: isStudentDormResident(found),
        });
      } else {
        unmatched.push(row);
      }
    });

    return { matched, unmatched };
  }, [debtExcelPreview, students, financeMap]);

  const statusBadgeClass = (st: StudentFinancialStatus) => {
    switch (st) {
      case 'settled':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'debtor':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'pending_payment':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'auto_deducting':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* سربرگ کارتابل ساده و روان امور مالی و حسابداری */}
      <div className="bg-gradient-to-l from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-emerald-700/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {staff.photoUrl ? (
              <img
                src={staff.photoUrl}
                alt={staff.fullName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-300/60 shadow-md shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-300/40 flex items-center justify-center shrink-0">
                <Landmark className="w-8 h-8 text-emerald-300" />
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold">
                  واحد امور مالی و حسابداری
                </span>
                {staff.department && (
                  <span className="text-xs text-teal-100/80">{staff.department}</span>
                )}
              </div>
              <h1 className="text-lg sm:text-xl font-black mt-1">
                خوش آمدید، {staff.fullName}
              </h1>
              <p className="text-xs text-teal-100/80 mt-0.5">
                بررسی وضعیت اسکان دانشجویان، کسورات قانونی حقوق (۴۵٪ خوابگاهی / ۲۵٪ ترددی)، بدهی‌ها و ارسال پیام مالی
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenMessages}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-300" />
              <span>صندوق پیام‌ها</span>
              {unreadFinanceMessagesCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black">
                  {unreadFinanceMessagesCount}
                </span>
              )}
            </button>

            {onOpenUserGuide && (
              <button
                type="button"
                onClick={() => onOpenUserGuide('finance')}
                className="px-4 py-2.5 rounded-xl bg-indigo-500/25 hover:bg-indigo-500/40 text-indigo-100 text-xs font-bold border border-indigo-400/30 transition flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-indigo-300" />
                <span>راهنمای کاربری (PDF)</span>
              </button>
            )}
          </div>
        </div>

        {/* نوار قوانین مالی دانشگاه فرهنگیان */}
        <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-amber-300 shrink-0" />
            <div>
              <span className="font-extrabold text-amber-200">نرخ کسر حقوق دانشگاه فرهنگیان: </span>
              <span className="text-teal-50">
                دانشجویان خوابگاهی <strong>۴۵٪</strong> و دانشجویان ترددی (غیرخوابگاهی) <strong>۲۵٪</strong> از حقوق دریافتی.
              </span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-2.5">
            <Wallet className="w-5 h-5 text-emerald-300 shrink-0" />
            <div>
              <span className="font-extrabold text-emerald-200">ضابطه پرداخت استانی: </span>
              <span className="text-teal-50">
                درون استان اصفهان <strong>کسر خودکار از حقوق</strong> • خارج از استان اصفهان <strong>مراجعه حضوری به حسابداری</strong>.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* پیام بازخورد */}
      {toast && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
          <button type="button" onClick={() => setToast(null)} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* کارت‌های شاخص خلاصه */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">دانشجویان خوابگاهی (۴۵٪ کسر)</div>
          <div className="text-2xl font-black text-teal-700 dark:text-teal-300 mt-1 tabular-nums">
            {kpiStats.dormResidents.toLocaleString('fa-IR')} نفر
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">ترددی غیرخوابگاهی (۲۵٪ کسر)</div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1 tabular-nums">
            {kpiStats.commuters.toLocaleString('fa-IR')} نفر
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-amber-200 dark:border-amber-900/50 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300">خارج استان اصفهان (مراجعه حضوری)</div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1 tabular-nums">
            {kpiStats.outOfProvinceDorm.toLocaleString('fa-IR')} نفر
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-rose-200 dark:border-rose-900/50 shadow-xs">
          <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
            جمع بدهی ثبت‌شده ({kpiStats.debtorsCount.toLocaleString('fa-IR')} بدهکار)
          </div>
          <div className="text-xl font-black text-rose-700 dark:text-rose-300 mt-1 tabular-nums">
            {kpiStats.totalDebt.toLocaleString('fa-IR')} <span className="text-xs font-bold">ریال</span>
          </div>
        </div>
      </div>

      {/* نوار ابزار گزارش اکسل خوابگاهی و بارگذاری اکسل بدهی */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>گزارش اکسل دانشجویان خوابگاهی و بارگذاری بدهی‌ها</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            خروجی اکسل منحصراً شامل دانشجویان خوابگاهی با فیلدهای هویتی/اسکان مجاز و وضعیت کسورات است.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => exportDormStudentsForFinanceExcel(students, dorms, rooms, studentFinances)}
            disabled={kpiStats.dormResidents === 0}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>خروجی اکسل دانشجویان خوابگاهی ({kpiStats.dormResidents})</span>
          </button>

          <button
            type="button"
            onClick={downloadStudentDebtTemplate}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>دانلود نمونه اکسل بدهی</span>
          </button>

          <label className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer">
            <UploadCloud className="w-4 h-4" />
            <span>بارگذاری اکسل میزان بدهی دانشجویان</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleDebtExcelSelect}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* بخش جستجو و جدول دانشجویان (محدود به فیلدهای مجاز امور مالی) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        {/* تب‌های تفکیک خوابگاهی / همه / ترددی */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setResidenceFilter('dorm_only');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                residenceFilter === 'dorm_only'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>فقط دانشجویان خوابگاهی ({kpiStats.dormResidents}) — ۴۵٪</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setResidenceFilter('all');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                residenceFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>همه دانشجویان (تشخیص خوابگاهی / ترددی)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setResidenceFilter('commuter');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                residenceFilter === 'commuter'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>فقط ترددی غیرخوابگاهی ({kpiStats.commuters}) — ۲۵٪</span>
            </button>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-bold text-slate-500 hover:text-teal-600 flex items-center gap-1 cursor-pointer self-end sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازنشانی فیلترها</span>
          </button>
        </div>

        {/* کادر جستجو و فیلترهای سریع */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="relative lg:col-span-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="جستجو بر اساس کد دانشجویی، کد ملی، نام، نام پدر، رشته یا اتاق..."
              className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={dormFilter}
              onChange={(e) => {
                setDormFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            >
              <option value="all">همه سراها</option>
              {dorms.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={paymentMethodFilter}
            onChange={(e) => {
              setPaymentMethodFilter(e.target.value as 'all' | PaymentMethod);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
          >
            <option value="all">همه روش‌های پرداخت</option>
            <option value="auto_payroll">درون استانی (کسر خودکار)</option>
            <option value="in_person_accounting">خارج از استان (مراجعه به حسابداری)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | StudentFinancialStatus);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
          >
            <option value="all">همه وضعیت‌های مالی</option>
            <option value="debtor">بدهکار</option>
            <option value="pending_payment">در انتظار مراجعه به حسابداری</option>
            <option value="auto_deducting">کسر خودکار از حقوق</option>
            <option value="settled">تسویه شده</option>
            <option value="unreviewed">نیازمند بررسی مالی</option>
          </select>
        </div>

        {/* جدول ساده و خلوت اطلاعات مجاز دانشجویان برای امور مالی */}
        {paginatedRows.length === 0 ? (
          <div className="p-10 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-400">
            هیچ دانشجویی مطابق فیلترهای انتخابی یافت نشد.
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                <tr>
                  <th className="p-3">مشخصات دانشجو (نام / نام پدر)</th>
                  <th className="p-3">کد دانشجویی و کد ملی</th>
                  <th className="p-3">رشته و ورودی</th>
                  <th className="p-3">وضعیت اسکان و نام اتاق</th>
                  <th className="p-3">اسکان سال قبل</th>
                  <th className="p-3">نرخ کسر و نحوه پرداخت</th>
                  <th className="p-3">بدهی و وضعیت مالی</th>
                  <th className="p-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedRows.map(({ student: st, dormName, roomNumber, previousAccommodationLabel, fin }) => (
                  <tr key={st.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    {/* ۱. عکس + نام و نام خانوادگی + نام پدر */}
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        {st.photoUrl ? (
                          <img
                            src={st.photoUrl}
                            alt={st.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0"
                            style={{ backgroundColor: st.avatarColor || '#0d9488' }}
                          >
                            {(st.fullName || 'د').slice(0, 1)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{st.fullName}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            نام پدر: {st.fatherName || '-'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ۲. کد دانشجویی و کد ملی */}
                    <td className="p-3 font-mono tabular-nums">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{st.studentId}</div>
                      <div className="text-[11px] text-slate-500">کد ملی: {st.nationalId || '-'}</div>
                    </td>

                    {/* ۳. رشته و ورودی */}
                    <td className="p-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {st.fieldOfStudy || '-'}
                      </div>
                      <div className="text-[11px] text-slate-500">ورودی {st.entryTerm || '-'}</div>
                    </td>

                    {/* ۴. وضعیت اسکان و نام اتاق */}
                    <td className="p-3">
                      {fin.isDormResident ? (
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                            {st.assignmentStatus === 'temporary' ? 'خوابگاهی (موقت)' : 'خوابگاهی (قطعی)'}
                          </span>
                          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mt-1">
                            {dormName ? `${dormName} • ` : ''}
                            {roomNumber ? `اتاق ${roomNumber}` : 'اتاق نامشخص'}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          ترددی (غیرخوابگاهی)
                        </span>
                      )}
                    </td>

                    {/* ۵. وضعیت اسکان سال قبل */}
                    <td className="p-3 text-[11px] text-slate-600 dark:text-slate-300">
                      {previousAccommodationLabel}
                    </td>

                    {/* ۶. نرخ کسر قانونی و نحوه پرداخت */}
                    <td className="p-3 space-y-1">
                      <div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold tabular-nums ${
                            fin.deductionRate === 45
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          کسر حقوق: {fin.deductionRate}٪
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold">
                        {fin.provinceOrigin === 'unknown' && !financeMap.get(st.studentId)?.paymentMethod ? (
                          <span className="text-slate-400">وضعیت استان نامشخص</span>
                        ) : fin.paymentMethod === 'in_person_accounting' ? (
                          <span className="text-amber-700 dark:text-amber-300">
                            خارج از استان • مراجعه حضوری به حسابداری
                          </span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-300">
                            درون استان اصفهان • کسر خودکار
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ۷. میزان بدهی و وضعیت مالی */}
                    <td className="p-3 space-y-1">
                      <div className="font-black text-slate-900 dark:text-white tabular-nums">
                        {fin.debtAmount > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            بدهی: {fin.debtAmount.toLocaleString('fa-IR')} ریال
                          </span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400">بدهی: ۰ ریال</span>
                        )}
                      </div>
                      <div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeClass(
                            fin.financialStatus
                          )}`}
                        >
                          {FINANCIAL_STATUS_LABELS[fin.financialStatus]}
                        </span>
                      </div>
                      {fin.paidAmount > 0 && (
                        <div className="text-[10px] text-slate-500 tabular-nums">
                          پرداختی: {fin.paidAmount.toLocaleString('fa-IR')} ریال
                        </div>
                      )}
                    </td>

                    {/* ۸. عملیات */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenFinanceModal(st)}
                          className="px-2.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>وضعیت مالی</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenMessageModal(st)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>پیام</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* صفحه‌بندی */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="tabular-nums">
              نمایش {((safePage - 1) * PAGE_SIZE + 1).toLocaleString('fa-IR')} تا{' '}
              {Math.min(safePage * PAGE_SIZE, filteredRows.length).toLocaleString('fa-IR')} از{' '}
              {filteredRows.length.toLocaleString('fa-IR')} دانشجو
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="font-bold tabular-nums">
                صفحه {safePage.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* مدال ویرایش وضعیت مالی و کسورات دانشجو */}
      {editTargetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    ثبت و بروزرسانی وضعیت مالی دانشجو
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editTargetStudent.fullName} • کد دانشجویی {editTargetStudent.studentId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditTargetStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFinanceModal} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نرخ کسر قانونی از حقوق
                  </label>
                  <select
                    value={formDeductionRate}
                    onChange={(e) => setFormDeductionRate(Number(e.target.value) === 25 ? 25 : 45)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  >
                    <option value={45}>۴۵٪ حقوق دریافتی (دانشجوی خوابگاهی)</option>
                    <option value={25}>۲۵٪ حقوق دریافتی (ترددی غیرخوابگاهی)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    روش پرداخت (درون / خارج استان)
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  >
                    <option value="auto_payroll">{PAYMENT_METHOD_LABELS.auto_payroll}</option>
                    <option value="in_person_accounting">{PAYMENT_METHOD_LABELS.in_person_accounting}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  وضعیت تسویه و کسورات
                </label>
                <select
                  value={formFinancialStatus}
                  onChange={(e) => setFormFinancialStatus(e.target.value as StudentFinancialStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value="auto_deducting">کسر خودکار از حقوق</option>
                  <option value="pending_payment">در انتظار مراجعه به حسابداری</option>
                  <option value="debtor">بدهکار</option>
                  <option value="settled">تسویه شده</option>
                  <option value="unreviewed">نیازمند بررسی مالی</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    میزان بدهی باقی‌مانده (ریال)
                  </label>
                  <input
                    type="text"
                    value={formDebtAmount}
                    onChange={(e) => setFormDebtAmount(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مبلغ پرداختی / کسرشده (ریال)
                  </label>
                  <input
                    type="text"
                    value={formPaidAmount}
                    onChange={(e) => setFormPaidAmount(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شماره سند یا فیش مالی (اختیاری)
                </label>
                <input
                  type="text"
                  value={formDocNumber}
                  onChange={(e) => setFormDocNumber(e.target.value)}
                  placeholder="مثلاً F-1405-104"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات مالی (قابل مشاهده برای دانشجو)
                </label>
                <textarea
                  rows={2}
                  value={formFiscalNote}
                  onChange={(e) => setFormFiscalNote(e.target.value)}
                  placeholder="توضیحات درباره بدهی، مهلت مراجعه یا کسر حقوق..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditTargetStudent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSavingFinance}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingFinance ? 'در حال ثبت...' : 'ذخیره وضعیت مالی'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال ارسال پیام مستقیم به دانشجو */}
      {msgTargetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    ارسال پیام مالی به دانشجو
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    گیرنده: {msgTargetStudent.fullName} ({msgTargetStudent.studentId})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMsgTargetStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendStudentMessage} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  موضوع پیام *
                </label>
                <input
                  type="text"
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  متن پیام *
                </label>
                <textarea
                  rows={4}
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  placeholder="متن پیام مالی جهت نمایش در کارتابل دانشجو..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMsgTargetStudent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSendingMsg}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSendingMsg ? 'در حال ارسال...' : 'ارسال پیام به دانشجو'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال پیش‌نمایش و تأیید اکسل بدهی دانشجویان */}
      {debtExcelPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    پیش‌نمایش بارگذاری اکسل میزان بدهی دانشجویان
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {previewMatches.matched.length} دانشجو تطبیق داده شد
                    {previewMatches.unmatched.length > 0
                      ? ` • ${previewMatches.unmatched.length} ردیف در سامانه یافت نشد`
                      : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDebtExcelPreview(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-2xl">
              {previewMatches.matched.length === 0 ? (
                <div className="p-8 text-center text-xs text-rose-600 font-bold">
                  هیچ‌یک از کدهای دانشجویی یا کد ملی‌های فایل با دانشجویان سامانه مطابقت نداشت.
                </div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">کد دانشجویی</th>
                      <th className="p-2.5">نام و نام خانوادگی</th>
                      <th className="p-2.5">وضعیت اسکان</th>
                      <th className="p-2.5">بدهی قبلی</th>
                      <th className="p-2.5">بدهی جدید (ریال)</th>
                      <th className="p-2.5">وضعیت جدید</th>
                      <th className="p-2.5">توضیحات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewMatches.matched.slice(0, 60).map(({ row, student, prevDebt, isDorm }) => (
                      <tr key={student.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2.5 font-mono tabular-nums">{student.studentId}</td>
                        <td className="p-2.5 font-bold">{student.fullName}</td>
                        <td className="p-2.5">
                          {isDorm ? 'خوابگاهی (۴۵٪)' : 'ترددی (۲۵٪)'}
                        </td>
                        <td className="p-2.5 font-mono tabular-nums text-slate-500">
                          {prevDebt.toLocaleString('fa-IR')}
                        </td>
                        <td className="p-2.5 font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
                          {row.debtAmount.toLocaleString('fa-IR')}
                        </td>
                        <td className="p-2.5">
                          {row.financialStatus
                            ? FINANCIAL_STATUS_LABELS[row.financialStatus]
                            : row.debtAmount > 0
                            ? 'بدهکار'
                            : 'تسویه شده'}
                        </td>
                        <td className="p-2.5 text-slate-500">{row.fiscalNote || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {previewMatches.unmatched.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200">
                شناسه ردیف‌های تطبیق‌نیافته:{' '}
                <span className="font-mono">
                  {previewMatches.unmatched
                    .slice(0, 10)
                    .map((u) => u.studentId || u.nationalId || u.fullNameHint || '؟')
                    .join(' ، ')}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDebtExcelPreview(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isUploadingDebtExcel || previewMatches.matched.length === 0}
                onClick={handleConfirmDebtExcelUpload}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {isUploadingDebtExcel
                    ? 'در حال ثبت و همگام‌سازی...'
                    : `تأیید و ثبت نهایی بدهی (${previewMatches.matched.length} نفر)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
