import React, { useState, useMemo, useDeferredValue } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Users,
  FileText,
  Award,
  AlertTriangle,
  MessageSquare,
  Building2,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Printer,
  FileSpreadsheet,
  X,
  UserCheck,
  Gavel,
  Info,
  BookOpen,
  Send,
  GraduationCap,
  MessagesSquare,
} from 'lucide-react';
import {
  Bed,
  DisciplinaryReferral,
  Dormitory,
  Room,
  RoomWarning,
  SecurityReport,
  SecurityReportSeverity,
  SecurityReportStatus,
  SecurityStaff,
  Student,
  StudentEvaluation,
} from '../types';
import { Storage } from '../utils/storage';
import { toEnglishDigits } from '../utils/excelUtils';
import { escapeHtml } from '../utils/sanitizeHtml';
import { isStudentDormResident } from '../utils/financeUtils';
import { StudentReferralModal } from './StudentReferralModal';
import { GraduationClearanceReviewPanel } from './GraduationClearanceReviewPanel';
import { CommunityChatHub } from './CommunityChatHub';
import { CollapsibleMenuGrid } from './CollapsibleMenuGrid';
import {
  StudentListPaginationBar,
  DEFAULT_STUDENT_PAGE_SIZE,
  getPaginationMeta,
} from './StudentListPaginationBar';

interface SecurityDashboardProps {
  securityStaff: SecurityStaff;
  students: Student[];
  dorms: Dormitory[];
  rooms: Room[];
  beds: Bed[];
  messagesCount: number;
  onOpenMessages: () => void;
  onRefreshData: () => void;
  onOpenUserGuide?: (role?: 'security') => void;
}

const REPORT_STATUS_META: Record<
  SecurityReportStatus,
  { label: string; badgeCls: string }
> = {
  pending: {
    label: 'جدید / در انتظار بررسی حراست',
    badgeCls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
  },
  reviewing: {
    label: 'در دست بررسی و پیگیری',
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  resolved: {
    label: 'رسیدگی و مختومه‌شده',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  },
  archived: {
    label: 'بایگانی‌شده',
    badgeCls: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
};

const REPORT_SEVERITY_META: Record<
  SecurityReportSeverity,
  { label: string; badgeCls: string }
> = {
  normal: {
    label: 'عادی',
    badgeCls: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
  important: {
    label: 'مهم',
    badgeCls: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  },
  urgent: {
    label: 'فوری / اضطراری',
    badgeCls: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
  },
};

const REPORTER_ROLE_LABELS: Record<SecurityReport['reportedByRole'], string> = {
  supervisor: 'سرپرست سرا',
  admin: 'مدیر کل سامانه',
  maintenance: 'واحد تأسیسات و فنی',
  student_affairs: 'امور دانشجویی',
  vice_dean: 'معاونت دانشجویی',
  security: 'واحد حراست و انتظامات',
  counselor: 'مرکز مشاوره',
  finance: 'امور مالی و حسابداری',
  education: 'امور آموزش',
  cultural: 'امور فرهنگی',
  library: 'کتابخانه و پژوهش',
  smart_campus: 'واحد هوشمندسازی',
  graduation: 'واحد فارغ‌التحصیلان',
};

const EVAL_TYPE_LABELS: Record<StudentEvaluation['type'], { label: string; cls: string }> = {
  evaluation: {
    label: 'نمره و ارزیابی',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  notice: {
    label: 'تذکر',
    cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300',
  },
  warning: {
    label: 'اخطار',
    cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
  },
  report: {
    label: 'گزارش سرپرستی',
    cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300',
  },
  summons: {
    label: 'فراخوانی',
    cls: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300',
  },
  negative_score: {
    label: 'نمره منفی',
    cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300',
  },
};

function printHtmlViaHiddenIframe(html: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) document.body.removeChild(iframe);
      }, 1000);
    }
  }, 250);
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  securityStaff,
  students,
  dorms,
  rooms,
  beds,
  messagesCount,
  onOpenMessages,
  onRefreshData,
  onOpenUserGuide,
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'student_records' | 'students' | 'clearance' | 'community_chat' | null>(null);

  // داده‌های زنده
  const securityReports = Storage.getSecurityReports();
  const studentEvaluations = Storage.getStudentEvaluations();
  const roomWarnings = Storage.getWarnings();
  const disciplinaryReferrals = Storage.getDisciplinaryReferrals();

  const dormMap = useMemo(() => new Map(dorms.map((d) => [d.id, d])), [dorms]);
  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);
  const bedMap = useMemo(() => new Map(beds.map((b) => [b.id, b])), [beds]);
  const studentByIdMap = useMemo(() => new Map(students.map((s) => [s.studentId, s])), [students]);

  // فیلترهای تب گزارش‌های ارسالی به حراست
  const [reportSearch, setReportSearch] = useState('');
  const deferredReportSearch = useDeferredValue(reportSearch);
  const [reportSenderFilter, setReportSenderFilter] = useState<'all' | SecurityReport['reportedByRole']>('all');
  const [reportSeverityFilter, setReportSeverityFilter] = useState<'all' | SecurityReportSeverity>('all');
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | SecurityReportStatus>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // مودال بررسی گزارش حراست
  const [reviewingReport, setReviewingReport] = useState<SecurityReport | null>(null);
  const [reviewStatus, setReviewStatus] = useState<SecurityReportStatus>('reviewing');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewActionTaken, setReviewActionTaken] = useState('');

  // فیلترهای تب سوابق، امتیازات و اخطارهای دانشجویان
  const [recordScopeFilter, setRecordScopeFilter] = useState<'all' | 'evaluations' | 'room_warnings' | 'disciplinary'>('all');
  const [recordSearch, setRecordSearch] = useState('');
  const deferredRecordSearch = useDeferredValue(recordSearch);
  const [recordDormFilter, setRecordDormFilter] = useState<string>('all');

  // فیلترها و صفحه‌بندی بانک اطلاعات دانشجویان (پیش‌فرض ۵۰ نفر در صفحه)
  const [studentSearch, setStudentSearch] = useState('');
  const deferredStudentSearch = useDeferredValue(studentSearch);
  const [studentDormFilter, setStudentDormFilter] = useState<string>('all');
  const [studentPage, setStudentPage] = useState(1);
  const [studentPageSize, setStudentPageSize] = useState<number | 'all'>(DEFAULT_STUDENT_PAGE_SIZE);

  // مودال پرونده جامع دانشجو و ارجاع
  const [dossierStudent, setDossierStudent] = useState<Student | null>(null);
  const [referralTargetStudent, setReferralTargetStudent] = useState<Student | null>(null);

  const filteredReports = useMemo(() => {
    const q = toEnglishDigits(deferredReportSearch.trim().toLowerCase());
    return securityReports.filter((rep) => {
      if (reportSenderFilter !== 'all' && rep.reportedByRole !== reportSenderFilter) return false;
      if (reportSeverityFilter !== 'all' && rep.severity !== reportSeverityFilter) return false;
      if (reportStatusFilter !== 'all' && rep.status !== reportStatusFilter) return false;
      if (!q) return true;
      const studentsHay = rep.studentsSnapshot
        .map((s) => `${s.fullName} ${s.studentId} ${s.nationalId || ''} ${s.roomNumber || ''}`)
        .join(' ');
      const hay = toEnglishDigits(
        `${rep.reportCode} ${rep.title} ${rep.categoryLabel} ${rep.description} ${rep.dormName || ''} ${rep.roomNumber || ''} ${rep.reportedByName} ${studentsHay}`
      ).toLowerCase();
      return hay.includes(q);
    });
  }, [securityReports, deferredReportSearch, reportSenderFilter, reportSeverityFilter, reportStatusFilter]);

  const filteredEvaluations = useMemo(() => {
    if (recordScopeFilter !== 'all' && recordScopeFilter !== 'evaluations') return [];
    const q = toEnglishDigits(deferredRecordSearch.trim().toLowerCase());
    return studentEvaluations.filter((ev) => {
      if (recordDormFilter !== 'all' && ev.dormId !== recordDormFilter) return false;
      if (!q) return true;
      const hay = toEnglishDigits(
        `${ev.studentName} ${ev.studentId} ${ev.title} ${ev.description} ${ev.dormName || ''} ${ev.roomNumber || ''} ${ev.evaluatorName}`
      ).toLowerCase();
      return hay.includes(q);
    });
  }, [studentEvaluations, recordScopeFilter, deferredRecordSearch, recordDormFilter]);

  const filteredRoomWarnings = useMemo(() => {
    if (recordScopeFilter !== 'all' && recordScopeFilter !== 'room_warnings') return [];
    const q = toEnglishDigits(deferredRecordSearch.trim().toLowerCase());
    return roomWarnings.filter((w) => {
      if (recordDormFilter !== 'all' && w.dormId !== recordDormFilter) return false;
      if (!q) return true;
      const rObj = roomMap.get(w.roomId);
      const dObj = dormMap.get(w.dormId);
      const hay = toEnglishDigits(
        `${w.title} ${w.description} ${w.supervisorName} ${rObj?.roomNumber || ''} ${dObj?.name || ''}`
      ).toLowerCase();
      return hay.includes(q);
    });
  }, [roomWarnings, recordScopeFilter, deferredRecordSearch, recordDormFilter, roomMap, dormMap]);

  const filteredDisciplinary = useMemo(() => {
    if (recordScopeFilter !== 'all' && recordScopeFilter !== 'disciplinary') return [];
    const q = toEnglishDigits(deferredRecordSearch.trim().toLowerCase());
    return disciplinaryReferrals.filter((ref) => {
      if (recordDormFilter !== 'all' && ref.dormId !== recordDormFilter) return false;
      if (!q) return true;
      const hay = toEnglishDigits(
        `${ref.referralCode} ${ref.studentName} ${ref.studentId} ${ref.studentNationalId || ''} ${ref.violationLabel} ${ref.referralText} ${ref.dormName || ''} ${ref.roomNumber || ''}`
      ).toLowerCase();
      return hay.includes(q);
    });
  }, [disciplinaryReferrals, recordScopeFilter, deferredRecordSearch, recordDormFilter]);

  // محاسبه خلاصه سوابق هر دانشجو برای جدول بانک اطلاعات
  const studentStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        evalCount: number;
        warningCount: number;
        negPoints: number;
        avgScore: number | null;
        secRepCount: number;
        discCount: number;
      }
    >();

    const ensure = (sid: string) => {
      let cur = map.get(sid);
      if (!cur) {
        cur = { evalCount: 0, warningCount: 0, negPoints: 0, avgScore: null, secRepCount: 0, discCount: 0 };
        map.set(sid, cur);
      }
      return cur;
    };

    const scoreLists = new Map<string, number[]>();

    studentEvaluations.forEach((ev) => {
      const st = ensure(ev.studentId);
      st.evalCount += 1;
      if (ev.type === 'warning' || ev.type === 'notice' || ev.type === 'summons' || ev.type === 'report') {
        st.warningCount += 1;
      }
      if (typeof ev.negativePoints === 'number' && ev.negativePoints > 0) {
        st.negPoints += ev.negativePoints;
      }
      if (typeof ev.score === 'number') {
        const arr = scoreLists.get(ev.studentId) || [];
        arr.push(ev.score);
        scoreLists.set(ev.studentId, arr);
      }
    });

    scoreLists.forEach((scores, sid) => {
      const st = ensure(sid);
      st.avgScore = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
    });

    securityReports.forEach((rep) => {
      rep.studentIds.forEach((sid) => {
        ensure(sid).secRepCount += 1;
      });
    });

    disciplinaryReferrals.forEach((ref) => {
      ensure(ref.studentId).discCount += 1;
    });

    return map;
  }, [studentEvaluations, securityReports, disciplinaryReferrals]);

  const filteredStudents = useMemo(() => {
    const q = toEnglishDigits(deferredStudentSearch.trim().toLowerCase());
    return students.filter((s) => {
      if (studentDormFilter === 'commuter') {
        if (isStudentDormResident(s)) return false;
      } else if (studentDormFilter !== 'all') {
        if (s.assignedDormId !== studentDormFilter) return false;
      }
      if (!q) return true;
      const dName = s.assignedDormId ? dormMap.get(s.assignedDormId)?.name || '' : s.assignedDormName || '';
      const rNum = s.assignedRoomId ? roomMap.get(s.assignedRoomId)?.roomNumber || '' : s.assignedRoomNumber || '';
      const hay = toEnglishDigits(
        `${s.fullName} ${s.fatherName} ${s.studentId} ${s.nationalId} ${s.fieldOfStudy} ${s.entryTerm} ${s.mobile} ${dName} ${rNum}`
      ).toLowerCase();
      return hay.includes(q);
    });
  }, [students, deferredStudentSearch, studentDormFilter, dormMap, roomMap]);

  const { totalPages: totalStudentPages, safePage: safeStudentPage, startIndex: secStartIdx, endIndex: secEndIdx } =
    getPaginationMeta(filteredStudents.length, studentPage, studentPageSize);
  const paginatedStudents = useMemo(() => {
    if (studentPageSize === 'all') return filteredStudents;
    return filteredStudents.slice(secStartIdx, secEndIdx);
  }, [filteredStudents, studentPageSize, secStartIdx, secEndIdx]);

  const pendingSecurityReportsCount = securityReports.filter(
    (r) => r.status === 'pending' || r.status === 'reviewing'
  ).length;
  const totalStudentRecordsCount =
    studentEvaluations.length + roomWarnings.length + disciplinaryReferrals.length;

  const openReviewModal = (rep: SecurityReport) => {
    setReviewingReport(rep);
    setReviewStatus(rep.status);
    setReviewNotes(rep.securityNotes || '');
    setReviewActionTaken(rep.actionTaken || '');
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingReport) return;
    const res = Storage.updateSecurityReport(reviewingReport.id, {
      status: reviewStatus,
      securityNotes: reviewNotes.trim() || undefined,
      actionTaken: reviewActionTaken.trim() || undefined,
      reviewedBy: securityStaff.fullName,
    });
    if (res.success) {
      setFeedbackMsg(res.message);
      setReviewingReport(null);
      onRefreshData();
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleExportSecurityReportsExcel = async () => {
    const XLSX = await import('xlsx');
    const rows = filteredReports.map((r, i) => ({
      'ردیف': i + 1,
      'کد گزارش': r.reportCode,
      'عنوان گزارش': r.title,
      'دسته‌بندی': r.categoryLabel,
      'فوریت': REPORT_SEVERITY_META[r.severity]?.label || r.severity,
      'وضعیت حراست': REPORT_STATUS_META[r.status]?.label || r.status,
      'ارسال‌کننده': `${r.reportedByName} (${REPORTER_ROLE_LABELS[r.reportedByRole] || r.reportedByRole})`,
      'تاریخ ثبت': r.reportedAt,
      'تاریخ وقوع': r.incidentDate,
      'سرا و محل': `${r.dormName || '-'} ${r.roomNumber ? `اتاق ${r.roomNumber}` : ''} ${r.locationDetails || ''}`.trim(),
      'دانشجویان مرتبط':
        r.studentsSnapshot.length > 0
          ? r.studentsSnapshot.map((s) => `${s.fullName} (${s.studentId})`).join(' | ')
          : 'مربوط به سرا / محوطه (بدون دانشجو)',
      'شرح گزارش': r.description,
      'نتیجه و اقدام حراست': [r.actionTaken, r.securityNotes].filter(Boolean).join(' - ') || '-',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'گزارش‌های حراست');
    XLSX.writeFile(wb, `گزارش_واحد_حراست_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportEvaluationsExcel = async () => {
    const XLSX = await import('xlsx');
    const rows = filteredEvaluations.map((ev, i) => ({
      'ردیف': i + 1,
      'نام دانشجو': ev.studentName,
      'شماره دانشجویی': ev.studentId,
      'نوع سابقه': EVAL_TYPE_LABELS[ev.type]?.label || ev.type,
      'عنوان': ev.title,
      'نمره ارزیابی': typeof ev.score === 'number' ? ev.score : '-',
      'نمره منفی': typeof ev.negativePoints === 'number' ? ev.negativePoints : 0,
      'سرا / اتاق': `${ev.dormName || '-'} ${ev.roomNumber ? `اتاق ${ev.roomNumber}` : ''}`.trim(),
      'ثبت‌کننده': ev.evaluatorName,
      'تاریخ': ev.date,
      'توضیحات': ev.description,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سوابق و امتیازات دانشجویان');
    XLSX.writeFile(wb, `گزارش_امتیازات_و_اخطارها_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handlePrintSecurityReport = (rep: SecurityReport) => {
    const studentsRows = rep.studentsSnapshot
      .map(
        (s, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(s.fullName)}</td>
          <td>${escapeHtml(s.studentId)}</td>
          <td>${escapeHtml(s.nationalId || '-')}</td>
          <td>${escapeHtml(s.fieldOfStudy || '-')}</td>
          <td>${escapeHtml(s.dormName || '-')}${s.roomNumber && s.roomNumber !== '-' ? ` (اتاق ${escapeHtml(s.roomNumber)})` : ''}</td>
          <td>${escapeHtml(s.mobile || '-')}</td>
        </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
<meta charset="utf-8" />
<title>گزارش حراست - ${escapeHtml(rep.reportCode)}</title>
<style>
  @page { size: A4 portrait; margin: 14mm; }
  body { font-family: Tahoma, Arial, sans-serif; color: #0f172a; font-size: 12px; line-height: 1.8; }
  .header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
  .title { font-size: 16px; font-weight: bold; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f8fafc; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 14px; }
  .box { border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; margin-bottom: 14px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-size: 11px; }
  th { background: #f1f5f9; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">گزارش رسمی واحد حراست و انتظامات سراهای دانشجویی</div>
      <div>دانشگاه فرهنگیان استان اصفهان</div>
    </div>
    <div>
      <div>کد گزارش: <strong>${escapeHtml(rep.reportCode)}</strong></div>
      <div>تاریخ ثبت: ${escapeHtml(rep.reportedAt)}</div>
    </div>
  </div>
  <div class="meta">
    <div><strong>عنوان:</strong> ${escapeHtml(rep.title)}</div>
    <div><strong>دسته‌بندی:</strong> ${escapeHtml(rep.categoryLabel)}</div>
    <div><strong>ارسال‌کننده:</strong> ${escapeHtml(rep.reportedByName)} (${escapeHtml(REPORTER_ROLE_LABELS[rep.reportedByRole])})</div>
    <div><strong>فوریت / وضعیت:</strong> ${escapeHtml(REPORT_SEVERITY_META[rep.severity].label)} / ${escapeHtml(REPORT_STATUS_META[rep.status].label)}</div>
    <div><strong>محل وقوع:</strong> ${escapeHtml(rep.dormName || '-')} ${rep.roomNumber ? `- اتاق ${escapeHtml(rep.roomNumber)}` : ''} ${rep.locationDetails ? `(${escapeHtml(rep.locationDetails)})` : ''}</div>
    <div><strong>تاریخ وقوع:</strong> ${escapeHtml(rep.incidentDate)}</div>
  </div>
  <div class="box">
    <strong>شرح واقعه و گزارش:</strong>
    <p>${escapeHtml(rep.description).replace(/\n/g, '<br/>')}</p>
  </div>
  <div class="box">
    ${
      rep.studentsSnapshot.length > 0
        ? `<strong>فهرست دانشجویان مرتبط (${rep.studentsSnapshot.length} نفر):</strong>
    <table>
      <thead>
        <tr><th>#</th><th>نام و نام خانوادگی</th><th>شماره دانشجویی</th><th>کد ملی</th><th>رشته</th><th>سرا / اتاق</th><th>همراه</th></tr>
      </thead>
      <tbody>${studentsRows}</tbody>
    </table>`
        : `<strong>حوزه گزارش:</strong>
    <p>گزارش مربوط به وضعیت سرا، ساختمان یا محوطه (بدون انتساب به دانشجوی خاص)</p>`
    }
  </div>
  <div class="box">
    <strong>نتیجه بررسی و اقدامات حراست:</strong>
    <p><strong>اقدام انجام‌شده:</strong> ${escapeHtml(rep.actionTaken || 'در دست بررسی')}</p>
    <p><strong>یادداشت کارشناس حراست:</strong> ${escapeHtml(rep.securityNotes || '-')}</p>
    <p><strong>بررسی‌کننده:</strong> ${escapeHtml(rep.reviewedBy || securityStaff.fullName)} ${rep.reviewedAt ? `(${escapeHtml(rep.reviewedAt)})` : ''}</p>
  </div>
</body>
</html>`;
    printHtmlViaHiddenIframe(html);
  };

  // محاسبه سوابق پرونده دانشجوی انتخاب‌شده در مودال
  const dossierData = useMemo(() => {
    if (!dossierStudent) return null;
    const sid = dossierStudent.studentId;
    const dObj = dossierStudent.assignedDormId ? dormMap.get(dossierStudent.assignedDormId) : undefined;
    const rObj = dossierStudent.assignedRoomId ? roomMap.get(dossierStudent.assignedRoomId) : undefined;
    const bObj = dossierStudent.assignedBedId ? bedMap.get(dossierStudent.assignedBedId) : undefined;
    const evals = studentEvaluations.filter((e) => e.studentId === sid);
    const secReps = securityReports.filter((r) => r.studentIds.includes(sid));
    const discRefs = disciplinaryReferrals.filter((d) => d.studentId === sid);
    const rWarnings = dossierStudent.assignedRoomId
      ? roomWarnings.filter((w) => w.roomId === dossierStudent.assignedRoomId)
      : [];
    const scores = evals.filter((e) => typeof e.score === 'number').map((e) => e.score as number);
    const avgEval = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : null;
    const totalNegPoints = evals.reduce((sum, e) => sum + (e.negativePoints || 0), 0);

    return { dObj, rObj, bObj, evals, secReps, discRefs, rWarnings, avgEval, totalNegPoints };
  }, [dossierStudent, dormMap, roomMap, bedMap, studentEvaluations, securityReports, disciplinaryReferrals, roomWarnings]);

  return (
    <div dir="rtl" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* بنر معرفی کارتابل حراست */}
      <div className="rounded-3xl bg-gradient-to-l from-slate-900 via-slate-800 to-rose-950 text-white p-5 sm:p-6 shadow-xl border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {securityStaff.photoUrl ? (
            <img
              src={securityStaff.photoUrl}
              alt={securityStaff.fullName}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-rose-400/50 shadow-md shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-8 h-8 text-rose-300" />
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-rose-200 font-bold mb-1">
              <span>{securityStaff.department || 'واحد حراست و انتظامات پردیس / سراها'}</span>
              {securityStaff.badgeCode && (
                <>
                  <span>·</span>
                  <span className="font-mono">کد سازمانی: {securityStaff.badgeCode}</span>
                </>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-black">
              کارتابل نظارتی واحد حراست و انتظامات ({securityStaff.fullName})
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              پایش متمرکز گزارش‌های ارسالی، پرونده اطلاعات دانشجویان، امتیازات و اخطارها و ارتباط مستقیم با دانشجویان و سایر واحدها
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenUserGuide && (
            <button
              type="button"
              onClick={() => onOpenUserGuide('security')}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4 text-teal-400" />
              <span>راهنمای کاربری (PDF)</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenMessages}
            className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg cursor-pointer whitespace-nowrap"
          >
            <MessageSquare className="w-4 h-4" />
            <span>صندوق پیام با دانشجویان و کارکنان</span>
            {messagesCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[11px] tabular-nums">
                {messagesCount.toLocaleString('fa-IR')}
              </span>
            )}
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button type="button" onClick={() => setFeedbackMsg(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* کارت‌های خلاصه آمار */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>گزارش‌های ارسالی به حراست</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 tabular-nums">
            {securityReports.length.toLocaleString('fa-IR')}
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1 tabular-nums">
            {pendingSecurityReportsCount.toLocaleString('fa-IR')} مورد نیازمند بررسی
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>امتیازات، اخطارها و شورا</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 tabular-nums">
            {totalStudentRecordsCount.toLocaleString('fa-IR')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
            {studentEvaluations.length.toLocaleString('fa-IR')} ارزیابی/تذکر · {disciplinaryReferrals.length.toLocaleString('fa-IR')} ارجاع انضباطی
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>بانک پرونده دانشجویان</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 tabular-nums">
            {students.length.toLocaleString('fa-IR')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
            {dorms.length.toLocaleString('fa-IR')} سرای فعال تحت نظارت
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>پیام‌ها و مکاتبات خوانده‌نشده</span>
            <MessageSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 tabular-nums">
            {messagesCount.toLocaleString('fa-IR')}
          </div>
          <button
            type="button"
            onClick={onOpenMessages}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline mt-1 cursor-pointer"
          >
            ورود به بخش پیام‌رسانی
          </button>
        </div>
      </div>

      {/* منوی دسته‌بندی‌شده و بازشونده کارتابل حراست */}
      <CollapsibleMenuGrid<'reports' | 'student_records' | 'students' | 'clearance' | 'community_chat'>
        activeKey={activeTab}
        onToggle={(key) => setActiveTab((prev) => (prev === key ? null : key))}
        onCloseActive={() => setActiveTab(null)}
        title="منوی بخش‌های کارتابل حراست و انتظامات (برای باز یا بسته شدن کلیک کنید)"
        emptyPrompt="برای مشاهده هر بخش، روی دکمه مربوطه در منوی بالا کلیک کنید. با کلیک مجدد، همان بخش بسته می‌شود."
        categories={[
          {
            title: 'گزارش‌ها و پرونده‌های حراستی',
            items: [
              {
                id: 'reports',
                label: 'گزارش‌های ارسالی به حراست',
                subtitle: 'گزارش‌های دانشجویی، سراها و محوطه',
                icon: <ShieldAlert className="w-4 h-4" />,
                badge: securityReports.length,
                badgeTone: 'rose',
                activeClass: 'bg-rose-600 text-white border-rose-600 shadow-md',
              },
              {
                id: 'student_records',
                label: 'سوابق، امتیازات و اخطارها',
                subtitle: 'ارزیابی‌ها، اخطار اتاق و ارجاعات انضباطی',
                icon: <AlertTriangle className="w-4 h-4" />,
                badge: totalStudentRecordsCount,
                badgeTone: 'amber',
                activeClass: 'bg-amber-600 text-white border-amber-600 shadow-md',
              },
              {
                id: 'students',
                label: 'پرونده و اطلاعات دانشجویان',
                subtitle: 'جستجو و مشاهده سوابق کل دانشجویان',
                icon: <Users className="w-4 h-4" />,
                badge: students.length,
                badgeTone: 'teal',
                activeClass: 'bg-teal-600 text-white border-teal-600 shadow-md',
              },
            ],
          },
          {
            title: 'نظارت، تالارها و تسویه',
            items: [
              {
                id: 'community_chat',
                label: 'نظارت چت و تأیید تالارهای گفتگو',
                subtitle: 'گفتگوی همکاران، تأیید تالار و تخلفات چت',
                icon: <MessagesSquare className="w-4 h-4" />,
                badge:
                  Storage.getCommunityForums().filter(
                    (f) => !f.isPublicForum && f.status === 'pending' && f.securityApproval.status === 'pending'
                  ).length + Storage.getCommunityChatReports().filter((r) => r.status === 'pending').length,
                badgeTone: 'rose',
                activeClass: 'bg-emerald-700 text-white border-emerald-700 shadow-md',
              },
              {
                id: 'clearance',
                label: 'تسویه حساب فارغ‌التحصیلان',
                subtitle: 'بررسی و صدور تأییدیه حراست',
                icon: <GraduationCap className="w-4 h-4" />,
                badge: Storage.getGraduationClearances().filter(
                  (c) =>
                    c.educationGateStatus === 'approved' &&
                    c.status === 'in_clearance' &&
                    (c.units?.security?.status || 'pending') === 'pending'
                ).length,
                badgeTone: 'rose',
                activeClass: 'bg-sky-700 text-white border-sky-700 shadow-md',
              },
            ],
          },
        ]}
      />

      {/* تب ۱: گزارش‌های ارسالی به حراست */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 flex-1">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  placeholder="جستجو کد گزارش، دانشجو، عنوان..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={reportSenderFilter}
                onChange={(e) => setReportSenderFilter(e.target.value as typeof reportSenderFilter)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="all">همه فرستندگان</option>
                <option value="supervisor">ارسالی از سرپرست سرا</option>
                <option value="admin">ارسالی از مدیر سامانه</option>
                <option value="maintenance">ارسالی از واحد تأسیسات</option>
                <option value="student_affairs">ارسالی از امور دانشجویی</option>
              </select>

              <select
                value={reportSeverityFilter}
                onChange={(e) => setReportSeverityFilter(e.target.value as typeof reportSeverityFilter)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="all">همه سطوح فوریت</option>
                <option value="urgent">فوری / اضطراری</option>
                <option value="important">مهم</option>
                <option value="normal">عادی</option>
              </select>

              <select
                value={reportStatusFilter}
                onChange={(e) => setReportStatusFilter(e.target.value as typeof reportStatusFilter)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="pending">در انتظار بررسی</option>
                <option value="reviewing">در دست بررسی</option>
                <option value="resolved">رسیدگی و مختومه‌شده</option>
                <option value="archived">بایگانی‌شده</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleExportSecurityReportsExcel}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>خروجی اکسل گزارش‌ها</span>
            </button>
          </div>

          {filteredReports.length === 0 ? (
            <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <ShieldCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="font-bold text-sm text-slate-700 dark:text-slate-300">
                گزارشی برای نمایش یافت نشد
              </div>
              <p className="text-xs text-slate-400">
                گزارش‌هایی که سرپرستان، مدیریت کل، تأسیسات یا امور دانشجویی برای یک یا چند دانشجو به حراست ارسال کنند در این بخش نمایش داده می‌شوند.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((rep) => {
                const stMeta = REPORT_STATUS_META[rep.status];
                const sevMeta = REPORT_SEVERITY_META[rep.severity];
                return (
                  <div
                    key={rep.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {rep.reportCode}
                          </span>
                          <span>·</span>
                          <span>{rep.categoryLabel}</span>
                          <span>·</span>
                          <span className={`px-2 py-0.5 rounded-md border font-bold ${sevMeta.badgeCls}`}>
                            {sevMeta.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md border font-bold ${stMeta.badgeCls}`}>
                            {stMeta.label}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                          {rep.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handlePrintSecurityReport(rep)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>چاپ گزارش</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openReviewModal(rep)}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ثبت بررسی و اقدام</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        فرستنده: <strong>{rep.reportedByName}</strong> ({REPORTER_ROLE_LABELS[rep.reportedByRole]})
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        محل: {rep.dormName || '-'}
                        {rep.roomNumber ? ` · اتاق ${rep.roomNumber}` : ''}
                        {rep.locationDetails ? ` (${rep.locationDetails})` : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        تاریخ وقوع: {rep.incidentDate} · ثبت: {rep.reportedAt}
                      </span>
                    </div>

                    <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      {rep.description}
                    </p>

                    {/* دانشجویان مرتبط یا نشان گزارش سرایی/محوطه */}
                    {rep.studentsSnapshot.length > 0 ? (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-500">
                          دانشجویان مرتبط با این گزارش ({rep.studentsSnapshot.length.toLocaleString('fa-IR')} نفر — کلیک جهت مشاهده پرونده کامل):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {rep.studentsSnapshot.map((snap) => {
                            const liveStudent = studentByIdMap.get(snap.studentId);
                            return (
                              <button
                                key={snap.studentId}
                                type="button"
                                onClick={() => {
                                  if (liveStudent) setDossierStudent(liveStudent);
                                }}
                                disabled={!liveStudent}
                                className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{snap.fullName}</span>
                                <span className="font-mono text-[10px] opacity-80">({snap.studentId})</span>
                                {snap.roomNumber && snap.roomNumber !== '-' && (
                                  <span className="text-[10px] opacity-75">· اتاق {snap.roomNumber}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-[11px] font-bold">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span>گزارش مربوط به سرا / محوطه (بدون انتساب به دانشجوی خاص)</span>
                      </div>
                    )}

                    {(rep.actionTaken || rep.securityNotes) && (
                      <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                        {rep.actionTaken && (
                          <div>
                            <strong>اقدام حراست:</strong> {rep.actionTaken}
                          </div>
                        )}
                        {rep.securityNotes && (
                          <div>
                            <strong>یادداشت و جمع‌بندی:</strong> {rep.securityNotes}
                          </div>
                        )}
                        {rep.reviewedBy && (
                          <div className="text-[11px] opacity-80">
                            بررسی توسط {rep.reviewedBy} {rep.reviewedAt ? `در تاریخ ${rep.reviewedAt}` : ''}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* تب ۲: گزارش‌ها، امتیازات و اخطارهای ثبت‌شده دانشجویان */}
      {activeTab === 'student_records' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={recordSearch}
                  onChange={(e) => setRecordSearch(e.target.value)}
                  placeholder="جستجو دانشجو، عنوان، اتاق، کد ملی..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={recordScopeFilter}
                onChange={(e) => setRecordScopeFilter(e.target.value as typeof recordScopeFilter)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="all">همه سوابق و گزارش‌ها</option>
                <option value="evaluations">ارزیابی‌ها، امتیازات، تذکرات و اخطارهای فردی</option>
                <option value="room_warnings">اخطارهای ثبت‌شده اتاق‌ها</option>
                <option value="disciplinary">پرونده‌های معرفی‌شده به شورای انضباطی</option>
              </select>

              <select
                value={recordDormFilter}
                onChange={(e) => setRecordDormFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="all">همه سراهای دانشجویی</option>
                {dorms.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleExportEvaluationsExcel}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>خروجی اکسل امتیازات و تذکرات</span>
            </button>
          </div>

          {/* ارزیابی‌ها، امتیازات و اخطارهای فردی */}
          {filteredEvaluations.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>امتیازات، تذکرات، اخطارها و گزارش‌های ثبت‌شده دانشجویان ({filteredEvaluations.length.toLocaleString('fa-IR')})</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="px-3 py-2.5">دانشجو</th>
                      <th className="px-3 py-2.5">نوع سابقه</th>
                      <th className="px-3 py-2.5">عنوان و شرح</th>
                      <th className="px-3 py-2.5">امتیاز / نمره منفی</th>
                      <th className="px-3 py-2.5">محل</th>
                      <th className="px-3 py-2.5">ثبت‌کننده و تاریخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredEvaluations.slice(0, 150).map((ev) => {
                      const meta = EVAL_TYPE_LABELS[ev.type] || EVAL_TYPE_LABELS.report;
                      const st = studentByIdMap.get(ev.studentId);
                      return (
                        <tr key={ev.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => st && setDossierStudent(st)}
                              disabled={!st}
                              className="font-bold text-teal-700 dark:text-teal-300 hover:underline text-right cursor-pointer disabled:opacity-60"
                            >
                              {ev.studentName}
                            </button>
                            <div className="text-[10px] text-slate-400 font-mono">{ev.studentId}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-block px-2 py-0.5 rounded-md border font-bold text-[11px] ${meta.cls}`}>
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 max-w-md">
                            <div className="font-bold text-slate-800 dark:text-slate-100">{ev.title}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{ev.description}</div>
                          </td>
                          <td className="px-3 py-2.5 tabular-nums">
                            {typeof ev.score === 'number' && (
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 block">
                                نمره: {ev.score}
                              </span>
                            )}
                            {typeof ev.negativePoints === 'number' && ev.negativePoints > 0 && (
                              <span className="font-bold text-rose-600 dark:text-rose-400 block">
                                -{ev.negativePoints} نمره منفی
                              </span>
                            )}
                            {typeof ev.score !== 'number' && !(ev.negativePoints && ev.negativePoints > 0) && '-'}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                            {ev.dormName || '-'} {ev.roomNumber ? `· اتاق ${ev.roomNumber}` : ''}
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-slate-500">
                            <div>{ev.evaluatorName}</div>
                            <div className="tabular-nums">{ev.date}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* پرونده‌های شورای انضباطی */}
          {filteredDisciplinary.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-rose-600" />
                  <span>پرونده‌های معرفی‌شده به شورای انضباطی ({filteredDisciplinary.length.toLocaleString('fa-IR')})</span>
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDisciplinary.map((ref) => {
                  const st = studentByIdMap.get(ref.studentId);
                  return (
                    <div key={ref.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-rose-700 dark:text-rose-400">{ref.referralCode}</span>
                          <span>·</span>
                          <button
                            type="button"
                            onClick={() => st && setDossierStudent(st)}
                            className="font-extrabold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                          >
                            {ref.studentName} ({ref.studentId})
                          </button>
                          <span>·</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">{ref.violationLabel}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{ref.referralText}</p>
                        {ref.verdict && (
                          <div className="text-emerald-700 dark:text-emerald-300 font-bold">
                            رأی / نتیجه شورا: {ref.verdict}
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 shrink-0 text-left">
                        <div>ارجاع توسط: {ref.referredByName}</div>
                        <div>{ref.referredAt}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* اخطارهای اتاق */}
          {filteredRoomWarnings.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span>اخطارهای ثبت‌شده برای اتاق‌ها ({filteredRoomWarnings.length.toLocaleString('fa-IR')})</span>
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRoomWarnings.map((w) => {
                  const rObj = roomMap.get(w.roomId);
                  const dObj = dormMap.get(w.dormId);
                  return (
                    <div key={w.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {w.title}{' '}
                          <span className="text-slate-500 font-normal">
                            ({dObj?.name || 'سرا'} · اتاق {rObj?.roomNumber || '-'})
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{w.description}</p>
                      </div>
                      <div className="text-[11px] text-slate-500 shrink-0 text-left">
                        <div>{w.supervisorName} · {w.date}</div>
                        <div className={w.resolved ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                          {w.resolved ? 'رفع و بسته‌شده' : 'اخطار فعال'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredEvaluations.length === 0 && filteredRoomWarnings.length === 0 && filteredDisciplinary.length === 0 && (
            <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              هیچ سابقه، امتیاز یا اخطاری با فیلتر فعلی ثبت نشده است.
            </div>
          )}
        </div>
      )}

      {/* تب ۳: مشاهده اطلاعات و پرونده کامل دانشجویان */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setStudentPage(1);
                  }}
                  placeholder="جستجو نام، شماره دانشجویی، کد ملی، رشته، شماره اتاق..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={studentDormFilter}
                onChange={(e) => {
                  setStudentDormFilter(e.target.value);
                  setStudentPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="all">همه دانشجویان ({students.length.toLocaleString('fa-IR')})</option>
                {dorms.map((d) => (
                  <option key={d.id} value={d.id}>
                    ساکنین سرای {d.name}
                  </option>
                ))}
                <option value="commuter">دانشجویان ترددی / بدون اتاق</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">تعداد در صفحه:</span>
              <select
                value={studentPageSize}
                onChange={(e) => {
                  const val = e.target.value;
                  setStudentPageSize(val === 'all' ? 'all' : Number(val));
                  setStudentPage(1);
                }}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                {[25, 50, 100, 200, 500].map((n) => (
                  <option key={n} value={n}>
                    {n.toLocaleString('fa-IR')} {n === 50 ? '(پیش‌فرض)' : ''}
                  </option>
                ))}
                <option value="all">همه ({filteredStudents.length.toLocaleString('fa-IR')})</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="px-3 py-3">#</th>
                    <th className="px-3 py-3">مشخصات دانشجو</th>
                    <th className="px-3 py-3">رشته و ورودی</th>
                    <th className="px-3 py-3">تماس و محل سکونت</th>
                    <th className="px-3 py-3">وضعیت سرا / اتاق</th>
                    <th className="px-3 py-3">امتیازات و اخطارها</th>
                    <th className="px-3 py-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedStudents.map((st, idx) => {
                    const rowIndex = secStartIdx + idx + 1;
                    const dName = st.assignedDormId ? dormMap.get(st.assignedDormId)?.name : st.assignedDormName;
                    const rNum = st.assignedRoomId ? roomMap.get(st.assignedRoomId)?.roomNumber : st.assignedRoomNumber;
                    const stats = studentStatsMap.get(st.studentId);
                    return (
                      <tr key={st.studentId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-2.5 tabular-nums text-slate-400">
                          {rowIndex.toLocaleString('fa-IR')}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            {st.photoUrl ? (
                              <img
                                src={st.photoUrl}
                                alt={st.fullName}
                                loading="lazy"
                                decoding="async"
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold shrink-0">
                                {st.fullName.slice(0, 1)}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{st.fullName}</div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {st.studentId} · ملی: {st.nationalId || '-'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{st.fieldOfStudy || '-'}</div>
                          <div className="text-[11px] text-slate-400">ورودی {st.entryTerm || '-'}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-mono text-slate-700 dark:text-slate-200" dir="ltr">
                            {st.mobile || '-'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {st.province || '-'} / {st.city || '-'}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          {dName ? (
                            <div>
                              <span className="font-bold text-teal-700 dark:text-teal-300">{dName}</span>
                              {rNum && <div className="text-[11px] text-slate-500">اتاق {rNum}</div>}
                            </div>
                          ) : isStudentDormResident(st) ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-bold text-[11px]">
                              خوابگاهی (بدون اتاق)
                            </span>
                          ) : (
                            <span className="text-slate-400">ترددی / بدون اتاق</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-[11px] tabular-nums">
                          <div>امتیاز سال قبل: <strong>{st.previousScore ?? '-'}</strong></div>
                          {stats ? (
                            <div className="text-slate-500">
                              {stats.avgScore !== null && `میانگین: ${stats.avgScore} · `}
                              تذکر/اخطار: {stats.warningCount} · حراست: {stats.secRepCount}
                            </div>
                          ) : (
                            <div className="text-slate-400">بدون سابقه اخطار</div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setDossierStudent(st)}
                              className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>پرونده</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setReferralTargetStudent(st)}
                              className="px-2.5 py-1.5 rounded-xl bg-fuchsia-50 hover:bg-fuchsia-100 dark:bg-fuchsia-950/50 text-fuchsia-800 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                              title="ارجاع دانشجو به مشاور، امور دانشجویی یا حراست با ثبت گزارش"
                            >
                              <Send className="w-3 h-3" />
                              <span>ارجاع</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800">
              <StudentListPaginationBar
                totalItems={filteredStudents.length}
                currentPage={safeStudentPage}
                pageSize={studentPageSize}
                onPageChange={setStudentPage}
                onPageSizeChange={setStudentPageSize}
                showPageSizeSelector={false}
                compact
              />
            </div>
          </div>
        </div>
      )}

      {/* مودال بررسی و تغییر وضعیت گزارش ارسالی به حراست */}
      {reviewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  رسیدگی و ثبت نتیجه گزارش ({reviewingReport.reportCode})
                </h3>
                <p className="text-[11px] text-slate-400 truncate">{reviewingReport.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingReport(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveReview} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  وضعیت پیگیری حراست
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as SecurityReportStatus)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="pending">جدید / در انتظار بررسی</option>
                  <option value="reviewing">در دست بررسی و پیگیری</option>
                  <option value="resolved">رسیدگی و مختومه‌شده</option>
                  <option value="archived">بایگانی‌شده</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اقدام حفاظتی انجام‌شده
                </label>
                <input
                  type="text"
                  value={reviewActionTaken}
                  onChange={(e) => setReviewActionTaken(e.target.value)}
                  placeholder="مثلاً دعوت دانشجو و اخذ تعهد، بازبینی دوربین‌ها، هماهنگی با سرپرستی..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات و یادداشت کارشناس حراست
                </label>
                <textarea
                  rows={4}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="نتیجه بررسی، اظهارات و جمع‌بندی نهایی واحد حراست..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingReport(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  ذخیره نتیجه بررسی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال پرونده کامل دانشجو (اطلاعات فردی، اسکان، امتیازات، اخطارها و گزارش‌های حراست) */}
      {dossierStudent && dossierData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 max-h-[92vh] flex flex-col">
            <div className="bg-gradient-to-l from-teal-800 to-slate-900 text-white p-5 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                {dossierStudent.photoUrl ? (
                  <img
                    src={dossierStudent.photoUrl}
                    alt={dossierStudent.fullName}
                    loading="lazy"
                    decoding="async"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-xl font-black shrink-0">
                    {dossierStudent.fullName.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-black text-base sm:text-lg truncate">
                    پرونده جامع دانشجو: {dossierStudent.fullName}
                  </h3>
                  <div className="text-xs text-teal-100 flex flex-wrap gap-2 mt-0.5">
                    <span className="font-mono">شماره دانشجویی: {dossierStudent.studentId}</span>
                    <span>·</span>
                    <span className="font-mono">کدملی: {dossierStudent.nationalId || '-'}</span>
                    <span>·</span>
                    <span>{dossierStudent.fieldOfStudy || '-'}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDossierStudent(null)}
                className="p-2 rounded-xl text-white/75 hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* اطلاعات هویتی، تماس و اسکان */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-teal-600" />
                    <span>مشخصات فردی، تماس و نشانی</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                    <div>نام پدر: <strong>{dossierStudent.fatherName || '-'}</strong></div>
                    <div>تاریخ تولد: <strong>{dossierStudent.birthDate || '-'}</strong></div>
                    <div>ورودی: <strong>{dossierStudent.entryTerm || '-'}</strong></div>
                    <div>دین/مذهب: <strong>{dossierStudent.religion || '-'}</strong></div>
                    <div>استان/شهر: <strong>{dossierStudent.province || '-'} / {dossierStudent.city || '-'}</strong></div>
                    <div>همراه: <strong dir="ltr">{dossierStudent.mobile || '-'}</strong></div>
                    <div>تلفن والدین: <strong dir="ltr">{dossierStudent.parentPhone || '-'}</strong></div>
                    <div>شماره ضروری: <strong dir="ltr">{dossierStudent.emergencyPhone || '-'}</strong></div>
                  </div>
                  {dossierStudent.postalAddress && (
                    <div className="text-slate-600 dark:text-slate-300 pt-1">
                      نشانی: <strong>{dossierStudent.postalAddress}</strong>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>وضعیت اسکان فعلی و امتیازات</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                    <div>سرای فعلی: <strong>{dossierData.dObj?.name || dossierStudent.assignedDormName || 'ترددی / بدون سرا'}</strong></div>
                    <div>اتاق / تخت: <strong>{dossierData.rObj ? `اتاق ${dossierData.rObj.roomNumber}` : '-'} {dossierData.bObj ? `(${dossierData.bObj.label})` : ''}</strong></div>
                    <div>سرای سال قبل: <strong>{dossierStudent.previousDorm || '-'}</strong></div>
                    <div>امتیاز سال قبل: <strong>{dossierStudent.previousScore ?? '-'}</strong></div>
                    <div>میانگین نمرات ارزیابی: <strong>{dossierData.avgEval !== null ? dossierData.avgEval : '-'}</strong></div>
                    <div>مجموع نمره منفی: <strong className="text-rose-600">{dossierData.totalNegPoints}</strong></div>
                  </div>
                </div>
              </div>

              {/* گزارش‌های ارسالی به حراست برای این دانشجو */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>گزارش‌های ارسالی به حراست مرتبط با دانشجو ({dossierData.secReps.length})</span>
                </h4>
                {dossierData.secReps.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-400">
                    گزارش حراستی برای این دانشجو ثبت نشده است.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dossierData.secReps.map((sr) => (
                      <div key={sr.id} className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span>{sr.reportCode} · {sr.title}</span>
                          <span>{REPORT_STATUS_META[sr.status].label}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{sr.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* امتیازات، اخطارها و تذکرات */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>سوابق امتیاز، تذکر، اخطار و گزارش‌های سرپرستی ({dossierData.evals.length})</span>
                </h4>
                {dossierData.evals.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-400">
                    سابقه‌ای برای این دانشجو ثبت نشده است.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dossierData.evals.map((ev) => (
                      <div key={ev.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            [{EVAL_TYPE_LABELS[ev.type]?.label || ev.type}] {ev.title}
                          </div>
                          <div className="text-slate-600 dark:text-slate-300 mt-0.5">{ev.description}</div>
                        </div>
                        <div className="text-[11px] text-slate-500 shrink-0 text-left">
                          {typeof ev.score === 'number' && <div className="font-bold text-emerald-600">نمره: {ev.score}</div>}
                          {typeof ev.negativePoints === 'number' && ev.negativePoints > 0 && (
                            <div className="font-bold text-rose-600">-{ev.negativePoints} منفی</div>
                          )}
                          <div>{ev.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* معرفی‌نامه‌های شورای انضباطی و اخطارهای اتاق */}
              {(dossierData.discRefs.length > 0 || dossierData.rWarnings.length > 0) && (
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Gavel className="w-4 h-4 text-indigo-600" />
                    <span>پرونده‌های شورای انضباطی و اخطارهای اتاق</span>
                  </h4>
                  {dossierData.discRefs.map((d) => (
                    <div key={d.id} className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50">
                      <div className="font-bold">{d.referralCode} · {d.violationLabel} ({d.referredAt})</div>
                      <p className="text-slate-600 dark:text-slate-300 mt-1">{d.referralText}</p>
                    </div>
                  ))}
                  {dossierData.rWarnings.map((w) => (
                    <div key={w.id} className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                      <div className="font-bold">اخطار اتاق: {w.title} ({w.date})</div>
                      <p className="text-slate-600 dark:text-slate-300 mt-1">{w.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setDossierStudent(null);
                  onOpenMessages();
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>ارسال پیام به دانشجو یا همکاران</span>
              </button>
              <button
                type="button"
                onClick={() => setDossierStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                بستن پرونده
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'clearance' && (
        <GraduationClearanceReviewPanel
          unitRole="security"
          reviewerId={securityStaff.id}
          reviewerName={securityStaff.fullName}
          settings={Storage.getSettings()}
          onDataChange={onRefreshData}
        />
      )}

      {activeTab === 'community_chat' && (
        <CommunityChatHub
          currentUser={{ role: 'security', staff: securityStaff }}
          students={students}
          mode="embedded"
          initialView="moderation"
          onRefreshGlobalData={onRefreshData}
        />
      )}

      <StudentReferralModal
        isOpen={Boolean(referralTargetStudent)}
        onClose={() => setReferralTargetStudent(null)}
        student={referralTargetStudent}
        dorms={dorms}
        rooms={rooms}
        actorId={securityStaff.id}
        actorName={securityStaff.fullName}
        actorRole="security"
        onSuccess={(msg) => {
          setFeedbackMsg(msg);
          setTimeout(() => setFeedbackMsg(null), 4000);
          onRefreshData();
        }}
      />
    </div>
  );
};
