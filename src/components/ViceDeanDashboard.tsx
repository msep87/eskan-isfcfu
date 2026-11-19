import React, { useMemo, useState, useDeferredValue } from 'react';
import {
  ViceDeanStaff,
  Dormitory,
  Room,
  Bed,
  Student,
  Announcement,
  RoomWarning,
  AppSettings,
  MaintenanceTask,
  MaintenanceStaff,
  Supervisor,
  StudentAffairsStaff,
  CulturalStaff,
  Message,
} from '../types';
import { Storage, normalizePersianSearch } from '../utils/storage';
import { toEnglishDigits } from '../utils/excelUtils';
import { isStudentDormResident } from '../utils/financeUtils';
import { escapeHtml } from '../utils/sanitizeHtml';
import { SupervisorDashboard } from './SupervisorDashboard';
import { StudentAffairsDashboard } from './StudentAffairsDashboard';
import { CulturalDashboard } from './CulturalDashboard';
import { SendSecurityReportModal } from './SendSecurityReportModal';
import { StudentReferralModal } from './StudentReferralModal';
import { GraduationClearanceReviewPanel } from './GraduationClearanceReviewPanel';
import {
  StudentListPaginationBar,
  DEFAULT_STUDENT_PAGE_SIZE,
  getPaginationMeta,
} from './StudentListPaginationBar';
import {
  Landmark,
  ShieldCheck,
  Award,
  Sparkles,
  BarChart3,
  MessageSquare,
  ShieldAlert,
  FileSpreadsheet,
  Printer,
  KeyRound,
  BookOpen,
  Search,
  Filter,
  RotateCcw,
  Users,
  Building2,
  Bed as BedIcon,
  Lock,
  Eye,
  Clock,
  CheckCircle2,
  ArrowUpDown,
  Wrench,
  Dumbbell,
  Vote,
  AlertTriangle,
  ClipboardCheck,
  Send,
  GraduationCap,
} from 'lucide-react';

interface ViceDeanDashboardProps {
  staff: ViceDeanStaff;
  dorms: Dormitory[];
  rooms: Room[];
  beds: Bed[];
  students: Student[];
  announcements: Announcement[];
  warnings: RoomWarning[];
  settings: AppSettings;
  maintenanceTasks?: MaintenanceTask[];
  maintenanceStaff?: MaintenanceStaff[];
  cloudSyncTick?: number;
  onRefreshData: () => void;
  onOpenReports: () => void;
  onOpenMessages: () => void;
  onOpenExcelModal: () => void;
  onOpenChangePassword: () => void;
  onOpenUserGuide?: (role: 'vice_dean') => void;
}

type ViceDeanTab =
  | 'supervisor'
  | 'student_affairs'
  | 'cultural'
  | 'detailed_reports'
  | 'messages_monitor'
  | 'clearance';

type ReportSortKey =
  | 'fullName'
  | 'studentId'
  | 'fieldOfStudy'
  | 'entryTerm'
  | 'dormName'
  | 'previousScore'
  | 'assignmentStatus';

const ROLE_LABELS_FA: Record<string, string> = {
  student: 'دانشجو',
  supervisor: 'سرپرست سرا',
  admin: 'مدیریت کل',
  maintenance: 'تأسیسات و فنی',
  warehouse: 'انبار و تجهیزات',
  procurement: 'کارپردازی و خرید',
  counselor: 'مرکز مشاوره',
  finance: 'امور مالی',
  education: 'کارشناس آموزش',
  cultural: 'امور فرهنگی',
  student_affairs: 'امور دانشجویی و تربیت بدنی',
  security: 'حراست و انتظامات',
  vice_dean: 'معاونت دانشجویی',
  library: 'کتابخانه و پژوهش',
  smart_campus: 'واحد هوشمندسازی',
  all: 'همه واحدها',
};

const MSG_CATEGORY_LABELS_FA: Record<string, string> = {
  security: 'حراست و انتظامات',
  education: 'امور آموزشی',
  cultural: 'امور فرهنگی',
  student_affairs: 'امور دانشجویی و ورزشی',
  financial: 'امور مالی',
  counseling: 'مشاوره و روانشناسی',
  library: 'کتابخانه و پژوهش',
  smart_campus: 'واحد هوشمندسازی',
  accommodation: 'امور اسکان و اتاق',
  maintenance: 'تأسیسات و تعمیرات',
  services_cleaning: 'خدمات و نظافت',
  rights_violation: 'عدم رعایت حقوق دیگران',
  social_personal: 'آسیب‌های فردی/اجتماعی',
  discipline: 'انضباطی',
  request: 'مرخصی و تردد',
  other: 'سایر امور',
};

export const ViceDeanDashboard: React.FC<ViceDeanDashboardProps> = ({
  staff,
  dorms,
  rooms,
  beds,
  students,
  announcements,
  warnings,
  settings,
  maintenanceTasks = [],
  maintenanceStaff = [],
  cloudSyncTick = 0,
  onRefreshData,
  onOpenReports,
  onOpenMessages,
  onOpenExcelModal,
  onOpenChangePassword,
  onOpenUserGuide,
}) => {
  const [activeTab, setActiveTab] = useState<ViceDeanTab>('supervisor');
  const [isSendSecurityModalOpen, setIsSendSecurityModalOpen] = useState(false);
  const [securityBanner, setSecurityBanner] = useState<string | null>(null);

  // فیلترهای گزارش مفصل معاونت دانشجویی
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);
  const [dormFilter, setDormFilter] = useState<string>('all'); // 'all' | 'commuter' | dorm.id
  const [genderFilter, setGenderFilter] = useState<'all' | 'brothers' | 'sisters'>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'confirmed' | 'temporary' | 'none'>('all');
  const [fieldFilter, setFieldFilter] = useState<string>('all');
  const [entryTermFilter, setEntryTermFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [profileFilter, setProfileFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [flagFilter, setFlagFilter] = useState<
    'all' | 'has_security' | 'has_disciplinary' | 'has_warning_eval' | 'has_guest'
  >('all');
  const [sortKey, setSortKey] = useState<ReportSortKey>('fullName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState<number | 'all'>(DEFAULT_STUDENT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [referralTargetStudent, setReferralTargetStudent] = useState<Student | null>(null);

  // فیلترهای پایش پیام‌های کل سامانه
  const [msgDomainFilter, setMsgDomainFilter] = useState<string>('all');
  const [msgCategoryFilter, setMsgCategoryFilter] = useState<string>('all');
  const [msgStatusFilter, setMsgStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'answered'>('all');
  const [msgConfFilter, setMsgConfFilter] = useState<'all' | 'confidential' | 'normal'>('all');
  const [msgSearch, setMsgSearch] = useState('');
  const [selectedMonitorMsgId, setSelectedMonitorMsgId] = useState<string | null>(null);

  // تطبیق پروفایل ترکیبی معاونت دانشجویی برای دسترسی کامل به ۳ کارتابل زیرمجموعه
  const syntheticSupervisor: Supervisor = useMemo(
    () => ({
      id: staff.id,
      username: staff.username,
      password: staff.password,
      fullName: `${staff.fullName} (معاونت دانشجویی)`,
      phone: staff.phone || staff.mobile || '',
      photoUrl: staff.photoUrl,
      assignedDormId: 'all',
      assignedDormIds: dorms.map((d) => d.id),
      role: 'supervisor',
    }),
    [staff, dorms]
  );

  const syntheticStudentAffairs: StudentAffairsStaff = useMemo(
    () => ({
      id: staff.id,
      username: staff.username,
      password: staff.password,
      fullName: `${staff.fullName} (معاونت دانشجویی)`,
      phone: staff.phone || staff.mobile || '',
      mobile: staff.mobile,
      photoUrl: staff.photoUrl,
      department: staff.department || 'معاونت دانشجویی دانشگاه فرهنگیان',
      role: 'student_affairs',
      status: staff.status,
      isActive: staff.isActive,
      notes: staff.notes,
    }),
    [staff]
  );

  const syntheticCultural: CulturalStaff = useMemo(
    () => ({
      id: staff.id,
      username: staff.username,
      password: staff.password,
      fullName: `${staff.fullName} (معاونت دانشجویی)`,
      phone: staff.phone || staff.mobile || '',
      mobile: staff.mobile,
      photoUrl: staff.photoUrl,
      department: staff.department || 'معاونت دانشجویی دانشگاه فرهنگیان',
      role: 'cultural',
      status: staff.status,
      isActive: staff.isActive,
      notes: staff.notes,
    }),
    [staff]
  );

  // خواندن داده‌های تحلیلی از Storage (به‌روزرسانی همزمان با تغییرات یا همگام‌سازی ابری)
  const crossDomainData = useMemo(() => {
    void cloudSyncTick;
    return {
      messages: Storage.getMessages(),
      surveys: Storage.getSurveys(),
      surveyResponses: Storage.getSurveyResponses(),
      evaluations: Storage.getStudentEvaluations(),
      securityReports: Storage.getSecurityReports(),
      guestRequests: Storage.getGuestRequests(),
      disciplinaryReferrals: Storage.getDisciplinaryReferrals(),
      culturalPrograms: Storage.getCulturalPrograms(),
      culturalAssociations: Storage.getCulturalAssociations(),
      associationMemberships: Storage.getAssociationMemberships(),
      sportsPrograms: Storage.getSportsPrograms(),
      sportsRegistrations: Storage.getSportsRegistrations(),
      guildElections: Storage.getGuildElections(),
      guildVotes: Storage.getGuildElectionVotes(),
    };
  }, [cloudSyncTick, students.length, warnings.length, maintenanceTasks.length, activeTab]);

  // نگاشت‌های سریع سرا / اتاق / سوابق برای رندر و فیلتر با کارایی بالا
  const dormMap = useMemo(() => new Map(dorms.map((d) => [d.id, d])), [dorms]);
  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);

  const studentFlagsMap = useMemo(() => {
    const secCount = new Map<string, number>();
    const discCount = new Map<string, number>();
    const evalCount = new Map<string, number>();
    const guestCount = new Map<string, number>();

    crossDomainData.securityReports.forEach((rep) => {
      (rep.studentIds || []).forEach((sid) => {
        secCount.set(sid, (secCount.get(sid) || 0) + 1);
      });
    });
    crossDomainData.disciplinaryReferrals.forEach((ref) => {
      discCount.set(ref.studentId, (discCount.get(ref.studentId) || 0) + 1);
    });
    crossDomainData.evaluations.forEach((ev) => {
      if (ev.type === 'warning' || ev.type === 'negative_score' || ev.type === 'summons' || ev.type === 'report') {
        evalCount.set(ev.studentId, (evalCount.get(ev.studentId) || 0) + 1);
      }
    });
    crossDomainData.guestRequests.forEach((g) => {
      guestCount.set(g.studentId, (guestCount.get(g.studentId) || 0) + 1);
    });

    return { secCount, discCount, evalCount, guestCount };
  }, [crossDomainData]);

  // مقادیر یکتا برای فیلترهای گزارش
  const uniqueFields = useMemo(
    () =>
      Array.from(new Set(students.map((s) => (s.fieldOfStudy || '').trim()).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'fa')
      ),
    [students]
  );
  const uniqueEntryTerms = useMemo(
    () =>
      Array.from(new Set(students.map((s) => (s.entryTerm || '').trim()).filter(Boolean))).sort((a, b) =>
        b.localeCompare(a, 'fa')
      ),
    [students]
  );
  const uniqueProvinces = useMemo(
    () =>
      Array.from(new Set(students.map((s) => (s.province || '').trim()).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'fa')
      ),
    [students]
  );

  // آمار کلان هدر
  const overviewStats = useMemo(() => {
    const occupiedBeds = beds.filter((b) => Boolean(b.studentId)).length;
    const totalBeds = beds.length;
    const dormResidents = students.filter((s) => isStudentDormResident(s)).length;
    const commuters = Math.max(0, students.length - dormResidents);
    const activeWarnings = warnings.filter((w) => !w.resolved).length;
    const openMaintenance = maintenanceTasks.filter((t) => t.status !== 'resolved' && t.status !== 'closed' && t.status !== 'cancelled').length;
    const openSecurity = crossDomainData.securityReports.filter((r) => r.status === 'pending' || r.status === 'reviewing').length;
    const activeDisciplinary = crossDomainData.disciplinaryReferrals.filter((r) => r.status !== 'closed').length;
    const staffMessagesCount = crossDomainData.messages.filter(
      (m) => m.senderRole !== 'student' && m.receiverType !== 'student'
    ).length;

    return {
      totalStudents: students.length,
      dormResidents,
      commuters,
      occupiedBeds,
      totalBeds,
      occupancyPercent: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      activeWarnings,
      openMaintenance,
      openSecurity,
      activeDisciplinary,
      approvedCulturalPrograms: crossDomainData.culturalPrograms.filter((p) => p.status === 'approved').length,
      activeSportsPrograms: crossDomainData.sportsPrograms.filter((p) => p.status !== 'cancelled').length,
      totalMessages: crossDomainData.messages.length,
      staffMessagesCount,
    };
  }, [beds, students, warnings, maintenanceTasks, crossDomainData]);

  // فیلتر و مرتب‌سازی جدول گزارش مفصل دانشجویان
  const filteredReportStudents = useMemo(() => {
    const q = normalizePersianSearch(deferredSearch);
    const qEn = toEnglishDigits(deferredSearch).toLowerCase().trim();

    const filtered = students.filter((s) => {
      const resident = isStudentDormResident(s);
      const dormObj = s.assignedDormId ? dormMap.get(s.assignedDormId) : undefined;

      if (dormFilter === 'commuter') {
        if (resident) return false;
      } else if (dormFilter !== 'all') {
        if (s.assignedDormId !== dormFilter) return false;
      }

      if (genderFilter !== 'all') {
        if (!dormObj || dormObj.gender !== genderFilter) return false;
      }

      if (assignmentFilter !== 'all') {
        const status = s.assignmentStatus || 'none';
        if (assignmentFilter !== status) return false;
      }

      if (fieldFilter !== 'all' && (s.fieldOfStudy || '').trim() !== fieldFilter) return false;
      if (entryTermFilter !== 'all' && (s.entryTerm || '').trim() !== entryTermFilter) return false;
      if (provinceFilter !== 'all' && (s.province || '').trim() !== provinceFilter) return false;

      if (profileFilter === 'completed' && !s.isProfileCompleted) return false;
      if (profileFilter === 'incomplete' && s.isProfileCompleted) return false;

      if (flagFilter === 'has_security' && !(studentFlagsMap.secCount.get(s.studentId) || 0)) return false;
      if (flagFilter === 'has_disciplinary' && !(studentFlagsMap.discCount.get(s.studentId) || 0)) return false;
      if (flagFilter === 'has_warning_eval' && !(studentFlagsMap.evalCount.get(s.studentId) || 0)) return false;
      if (flagFilter === 'has_guest' && !(studentFlagsMap.guestCount.get(s.studentId) || 0)) return false;

      if (q) {
        const hay = normalizePersianSearch(
          `${s.fullName} ${s.studentId} ${s.nationalId} ${s.fieldOfStudy} ${s.entryTerm} ${s.province} ${s.city} ${s.mobile} ${dormObj?.name || ''}`
        );
        const idMatch =
          toEnglishDigits(s.studentId || '').toLowerCase().includes(qEn) ||
          toEnglishDigits(s.nationalId || '').toLowerCase().includes(qEn);
        if (!hay.includes(q) && !idMatch) return false;
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'previousScore') {
        const sa = Number(a.previousScore) || 0;
        const sb = Number(b.previousScore) || 0;
        return (sa - sb) * mul;
      }
      if (sortKey === 'dormName') {
        const da = (a.assignedDormId ? dormMap.get(a.assignedDormId)?.name : a.assignedDormName) || 'ترددی';
        const db = (b.assignedDormId ? dormMap.get(b.assignedDormId)?.name : b.assignedDormName) || 'ترددی';
        return da.localeCompare(db, 'fa') * mul;
      }
      if (sortKey === 'studentId') {
        return toEnglishDigits(a.studentId).localeCompare(toEnglishDigits(b.studentId), 'en') * mul;
      }
      if (sortKey === 'assignmentStatus') {
        return String(a.assignmentStatus || 'none').localeCompare(String(b.assignmentStatus || 'none')) * mul;
      }
      const va = String(a[sortKey] || '');
      const vb = String(b[sortKey] || '');
      return va.localeCompare(vb, 'fa') * mul;
    });

    return sorted;
  }, [
    students,
    deferredSearch,
    dormFilter,
    genderFilter,
    assignmentFilter,
    fieldFilter,
    entryTermFilter,
    provinceFilter,
    profileFilter,
    flagFilter,
    sortKey,
    sortDir,
    dormMap,
    studentFlagsMap,
  ]);

  const { totalPages: totalReportPages, safePage: safeReportPage, startIndex: vdStartIdx, endIndex: vdEndIdx } =
    getPaginationMeta(filteredReportStudents.length, currentPage, pageSize);
  const paginatedReportStudents = useMemo(() => {
    if (pageSize === 'all') return filteredReportStudents;
    return filteredReportStudents.slice(vdStartIdx, vdEndIdx);
  }, [filteredReportStudents, pageSize, vdStartIdx, vdEndIdx]);

  // آمار تفکیکی بر اساس سرا
  const dormBreakdown = useMemo(() => {
    return dorms.map((d) => {
      const dBeds = beds.filter((b) => b.dormId === d.id);
      const dRooms = rooms.filter((r) => r.dormId === d.id);
      const occupiedConfirmed = dBeds.filter((b) => b.studentId && b.assignmentStatus !== 'temporary').length;
      const occupiedTemp = dBeds.filter((b) => b.studentId && b.assignmentStatus === 'temporary').length;
      const totalOccupied = occupiedConfirmed + occupiedTemp;
      const freeBeds = Math.max(0, dBeds.length - totalOccupied);
      const activeWarnCount = warnings.filter((w) => w.dormId === d.id && !w.resolved).length;
      const openMaintCount = maintenanceTasks.filter(
        (t) => t.dormId === d.id && t.status !== 'resolved' && t.status !== 'closed' && t.status !== 'cancelled'
      ).length;
      const discScores = dRooms.map((r) => r.disciplineScore).filter((v): v is number => typeof v === 'number');
      const cleanScores = dRooms.map((r) => r.cleanlinessScore).filter((v): v is number => typeof v === 'number');
      const avgDisc = discScores.length ? Math.round(discScores.reduce((a, b) => a + b, 0) / discScores.length) : 100;
      const avgClean = cleanScores.length ? Math.round(cleanScores.reduce((a, b) => a + b, 0) / cleanScores.length) : 100;
      return {
        dorm: d,
        roomCount: dRooms.length,
        totalBeds: dBeds.length,
        occupiedConfirmed,
        occupiedTemp,
        totalOccupied,
        freeBeds,
        occupancyPct: dBeds.length ? Math.round((totalOccupied / dBeds.length) * 100) : 0,
        activeWarnCount,
        openMaintCount,
        avgDisc,
        avgClean,
      };
    });
  }, [dorms, beds, rooms, warnings, maintenanceTasks]);

  // آمار تفکیکی رشته‌های تحصیلی (مطابق فیلتر انتخابی)
  const fieldBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { field: string; total: number; residents: number; commuters: number; confirmed: number; scoreSum: number }
    >();
    filteredReportStudents.forEach((s) => {
      const key = (s.fieldOfStudy || 'نامشخص').trim() || 'نامشخص';
      const entry = map.get(key) || {
        field: key,
        total: 0,
        residents: 0,
        commuters: 0,
        confirmed: 0,
        scoreSum: 0,
      };
      entry.total += 1;
      if (isStudentDormResident(s)) entry.residents += 1;
      else entry.commuters += 1;
      if (s.assignmentStatus === 'confirmed') entry.confirmed += 1;
      entry.scoreSum += Number(s.previousScore) || 0;
      map.set(key, entry);
    });
    return Array.from(map.values())
      .map((item) => ({
        ...item,
        avgScore: item.total ? Math.round(item.scoreSum / item.total) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredReportStudents]);

  // فیلتر پیام‌های کل حوزه‌ها برای پایش
  const monitoredMessages = useMemo(() => {
    const q = normalizePersianSearch(msgSearch);
    return [...crossDomainData.messages]
      .sort((a, b) => b.id.localeCompare(a.id))
      .filter((m) => {
        if (msgDomainFilter !== 'all') {
          if (m.senderRole !== msgDomainFilter && m.receiverType !== msgDomainFilter) return false;
        }
        if (msgCategoryFilter !== 'all' && m.category !== msgCategoryFilter) return false;
        if (msgStatusFilter !== 'all' && m.status !== msgStatusFilter) return false;
        if (msgConfFilter === 'confidential' && !m.isConfidential) return false;
        if (msgConfFilter === 'normal' && m.isConfidential) return false;
        if (q) {
          const hay = normalizePersianSearch(
            `${m.senderName} ${m.receiverName || ''} ${m.subject} ${m.content} ${m.replies.map((r) => r.content).join(' ')}`
          );
          if (!hay.includes(q)) return false;
        }
        return true;
      });
  }, [crossDomainData.messages, msgDomainFilter, msgCategoryFilter, msgStatusFilter, msgConfFilter, msgSearch]);

  const selectedMonitorMsg: Message | null = useMemo(
    () => monitoredMessages.find((m) => m.id === selectedMonitorMsgId) || monitoredMessages[0] || null,
    [monitoredMessages, selectedMonitorMsgId]
  );

  const toggleSort = (key: ReportSortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const resetReportFilters = () => {
    setSearchQuery('');
    setDormFilter('all');
    setGenderFilter('all');
    setAssignmentFilter('all');
    setFieldFilter('all');
    setEntryTermFilter('all');
    setProvinceFilter('all');
    setProfileFilter('all');
    setFlagFilter('all');
    setCurrentPage(1);
  };

  const handleExportDetailedExcel = async () => {
    setIsExportingExcel(true);
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // شیت ۱: لیست تفصیلی دانشجویان مطابق فیلترهای فعال
      const studentRows = filteredReportStudents.map((s, idx) => {
        const dormObj = s.assignedDormId ? dormMap.get(s.assignedDormId) : undefined;
        const roomObj = s.assignedRoomId ? roomMap.get(s.assignedRoomId) : undefined;
        const resident = isStudentDormResident(s);
        return {
          'ردیف': idx + 1,
          'شماره دانشجویی': s.studentId,
          'کد ملی': s.nationalId,
          'نام و نام خانوادگی': s.fullName,
          'رشته تحصیلی': s.fieldOfStudy || '-',
          'ورودی': s.entryTerm || '-',
          'استان': s.province || '-',
          'شهر': s.city || '-',
          'تلفن همراه': s.mobile || s.phone || '-',
          'نوع دانشجو': resident ? 'خوابگاهی' : 'ترددی',
          'وضعیت اسکان':
            s.assignmentStatus === 'confirmed'
              ? 'اسکان قطعی'
              : s.assignmentStatus === 'temporary'
              ? 'اسکان موقت'
              : 'بدون اتاق',
          'سرای محل اسکان': dormObj?.name || s.assignedDormName || 'ترددی / نامشخص',
          'جنسیت سرا': dormObj ? (dormObj.gender === 'brothers' ? 'برادران' : 'خواهران') : '-',
          'شماره اتاق': roomObj?.roomNumber || s.assignedRoomNumber || '-',
          'وضعیت پرونده': s.isProfileCompleted ? 'تکمیل‌شده' : 'ناقص',
          'امتیاز سابقه': s.previousScore ?? '-',
          'گزارش‌های حراستی': studentFlagsMap.secCount.get(s.studentId) || 0,
          'ارجاع انضباطی': studentFlagsMap.discCount.get(s.studentId) || 0,
          'اخطار / نمره منفی': studentFlagsMap.evalCount.get(s.studentId) || 0,
          'درخواست مهمان': studentFlagsMap.guestCount.get(s.studentId) || 0,
        };
      });
      const wsStudents = XLSX.utils.json_to_sheet(studentRows);
      XLSX.utils.book_append_sheet(wb, wsStudents, 'گزارش جامع دانشجویان');

      // شیت ۲: وضعیت تفکیکی سراها
      const dormRows = dormBreakdown.map((d, idx) => ({
        'ردیف': idx + 1,
        'نام سرا': d.dorm.name,
        'پردیس': d.dorm.campus,
        'جنسیت': d.dorm.gender === 'brothers' ? 'برادران' : 'خواهران',
        'تعداد اتاق': d.roomCount,
        'ظرفیت کل تخت': d.totalBeds,
        'اسکان قطعی': d.occupiedConfirmed,
        'اسکان موقت': d.occupiedTemp,
        'تخت خالی': d.freeBeds,
        'درصد اشغال': `${d.occupancyPct}%`,
        'میانگین امتیاز انضباط': d.avgDisc,
        'میانگین امتیاز نظافت': d.avgClean,
        'اخطارهای باز': d.activeWarnCount,
        'تعمیرات باز': d.openMaintCount,
      }));
      const wsDorms = XLSX.utils.json_to_sheet(dormRows);
      XLSX.utils.book_append_sheet(wb, wsDorms, 'آمار سراها و اتاق‌ها');

      // شیت ۳: تفکیک رشته‌های تحصیلی
      const fieldRows = fieldBreakdown.map((f, idx) => ({
        'ردیف': idx + 1,
        'رشته تحصیلی': f.field,
        'تعداد کل': f.total,
        'خوابگاهی': f.residents,
        'ترددی': f.commuters,
        'اسکان قطعی': f.confirmed,
        'میانگین امتیاز سابقه': f.avgScore,
      }));
      const wsFields = XLSX.utils.json_to_sheet(fieldRows);
      XLSX.utils.book_append_sheet(wb, wsFields, 'آمار رشته‌ها');

      // شیت ۴: شاخص‌های کلان حوزه‌های معاونت دانشجویی
      const kpiRows = [
        { 'بخش': 'جمعیت دانشجویی', 'شاخص': 'کل دانشجویان فیلترشده / کل سامانه', 'مقدار': `${filteredReportStudents.length} / ${students.length}` },
        { 'بخش': 'اسکان', 'شاخص': 'تخت‌های اشغال‌شده / کل تخت‌ها', 'مقدار': `${overviewStats.occupiedBeds} / ${overviewStats.totalBeds} (${overviewStats.occupancyPercent}%)` },
        { 'بخش': 'امور فرهنگی', 'شاخص': 'برنامه‌های تاییدشده / کل تشکل‌ها', 'مقدار': `${overviewStats.approvedCulturalPrograms} برنامه / ${crossDomainData.culturalAssociations.length} تشکل (${crossDomainData.associationMemberships.filter((m) => m.status === 'approved').length} عضو)` },
        { 'بخش': 'تربیت بدنی', 'شاخص': 'برنامه‌های ورزشی / ثبت‌نام‌ها', 'مقدار': `${overviewStats.activeSportsPrograms} برنامه / ${crossDomainData.sportsRegistrations.length} ثبت‌نام` },
        { 'بخش': 'شورای صنفی', 'شاخص': 'انتخابات تعریف‌شده / کل آرای ثبت‌شده', 'مقدار': `${crossDomainData.guildElections.length} دوره / ${crossDomainData.guildVotes.length} رأی` },
        { 'بخش': 'حراست و انضباط', 'شاخص': 'گزارش‌های حراست / پرونده‌های شورای انضباطی', 'مقدار': `${crossDomainData.securityReports.length} گزارش / ${crossDomainData.disciplinaryReferrals.length} پرونده` },
        { 'بخش': 'نظرسنجی‌های دوره‌ای', 'شاخص': 'تعداد نظرسنجی‌ها / پاسخ‌های ثبت‌شده', 'مقدار': `${crossDomainData.surveys.length} نظرسنجی / ${crossDomainData.surveyResponses.length} پاسخ` },
        { 'بخش': 'تأسیسات و مهمان', 'شاخص': 'مأموریت‌های باز / درخواست‌های مهمان', 'مقدار': `${overviewStats.openMaintenance} مأموریت باز / ${crossDomainData.guestRequests.length} درخواست مهمان` },
      ];
      const wsKpi = XLSX.utils.json_to_sheet(kpiRows);
      XLSX.utils.book_append_sheet(wb, wsKpi, 'شاخص‌های میان‌بخش');

      XLSX.writeFile(wb, `vice-dean-comprehensive-report-${Date.now()}.xlsx`);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handlePrintDetailedReport = () => {
    const sampleRows = filteredReportStudents.slice(0, 250);
    const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<title>گزارش جامع معاونت دانشجویی</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: Tahoma, Arial, sans-serif; color: #0f172a; font-size: 11px; line-height: 1.5; }
  .header { border-bottom: 2px solid #0f766e; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
  .title { font-size: 16px; font-weight: bold; color: #134e4a; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
  .kpi { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; background: #f8fafc; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #cbd5e1; padding: 5px 6px; text-align: right; }
  th { background: #e2e8f0; font-weight: bold; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">گزارش جامع تحلیلی و مدیریتی معاونت دانشجویی — ${escapeHtml(settings.universityName)}</div>
      <div>سال تحصیلی: ${escapeHtml(settings.currentAcademicYear)} (${escapeHtml(settings.currentSemester)}) | تنظیم‌کننده: ${escapeHtml(staff.fullName)}</div>
    </div>
    <div>تاریخ چاپ: ${escapeHtml(new Date().toLocaleDateString('fa-IR'))}</div>
  </div>
  <div class="kpis">
    <div class="kpi"><strong>تعداد دانشجویان فیلترشده:</strong> ${filteredReportStudents.length} نفر</div>
    <div class="kpi"><strong>تخت‌های اشغال / کل:</strong> ${overviewStats.occupiedBeds} / ${overviewStats.totalBeds} (${overviewStats.occupancyPercent}٪)</div>
    <div class="kpi"><strong>پرونده حراست / انضباطی:</strong> ${crossDomainData.securityReports.length} / ${crossDomainData.disciplinaryReferrals.length}</div>
    <div class="kpi"><strong>برنامه فرهنگی / ورزشی:</strong> ${overviewStats.approvedCulturalPrograms} / ${overviewStats.activeSportsPrograms}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>شماره دانشجویی</th>
        <th>نام و نام خانوادگی</th>
        <th>رشته تحصیلی</th>
        <th>ورودی</th>
        <th>استان</th>
        <th>نوع / اسکان</th>
        <th>سرا و اتاق</th>
        <th>حراست / انضباط / اخطار</th>
      </tr>
    </thead>
    <tbody>
      ${sampleRows
        .map((s, idx) => {
          const dormObj = s.assignedDormId ? dormMap.get(s.assignedDormId) : undefined;
          const roomObj = s.assignedRoomId ? roomMap.get(s.assignedRoomId) : undefined;
          const resident = isStudentDormResident(s);
          const secC = studentFlagsMap.secCount.get(s.studentId) || 0;
          const discC = studentFlagsMap.discCount.get(s.studentId) || 0;
          const evalC = studentFlagsMap.evalCount.get(s.studentId) || 0;
          return `<tr>
            <td>${idx + 1}</td>
            <td>${escapeHtml(s.studentId)}</td>
            <td>${escapeHtml(s.fullName)}</td>
            <td>${escapeHtml(s.fieldOfStudy || '-')}</td>
            <td>${escapeHtml(s.entryTerm || '-')}</td>
            <td>${escapeHtml(s.province || '-')}</td>
            <td>${resident ? (s.assignmentStatus === 'confirmed' ? 'خوابگاهی (قطعی)' : 'خوابگاهی (موقت)') : 'ترددی'}</td>
            <td>${escapeHtml(dormObj?.name || s.assignedDormName || '-')} ${roomObj?.roomNumber ? `اتاق ${escapeHtml(roomObj.roomNumber)}` : ''}</td>
            <td>${secC} / ${discC} / ${evalC}</td>
          </tr>`;
        })
        .join('')}
    </tbody>
  </table>
  ${filteredReportStudents.length > 250 ? `<p style="margin-top:8px;color:#64748b;">توجه: برای صرفه‌جویی در کاغذ، ۲۵۰ ردیف نخست چاپ شده است. برای کل ${filteredReportStudents.length} ردیف از خروجی اکسل استفاده نمایید.</p>` : ''}
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => iframe.remove(), 1200);
      }, 250);
    } else {
      iframe.remove();
    }
  };

  return (
    <div className="space-y-6">
      {/* هدر اصلی معاونت دانشجویی */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-700/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-extrabold">
              <Landmark className="w-4 h-4 text-teal-300" />
              <span>کارتابل جامع معاونت دانشجویی ({staff.title || 'معاونت دانشجویی دانشگاه فرهنگیان'})</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              خوش آمدید، {staff.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              تجمیع کامل اختیارات <strong className="text-white">سرپرستی سراها</strong>،{' '}
              <strong className="text-white">امور دانشجویی و تربیت بدنی</strong> و{' '}
              <strong className="text-white">امور فرهنگی</strong> همراه با گزارش‌گیری تحلیلی چندبُعدی، پایش پیام‌های تمام حوزه‌های سامانه و مکاتبه مستقیم با کلیه کارکنان و واحدها (بجز دانشجو).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenReports}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-cyan-300" />
              <span>نمودارها و گزارش فوری</span>
            </button>
            <button
              type="button"
              onClick={onOpenMessages}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              <span>پیام‌رسان کارکنان (بجز دانشجو)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSendSecurityModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>گزارش به حراست</span>
            </button>
            <button
              type="button"
              onClick={onOpenChangePassword}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>تغییر رمز</span>
            </button>
            {onOpenUserGuide && (
              <button
                type="button"
                onClick={() => onOpenUserGuide('vice_dean')}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>راهنمای کاربری</span>
              </button>
            )}
          </div>
        </div>

        {/* نوار آمار کلان معاونت */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
            <div className="text-[11px] text-slate-300">کل دانشجویان</div>
            <div className="text-lg font-black mt-0.5">{overviewStats.totalStudents}</div>
            <div className="text-[10px] text-teal-200">{overviewStats.dormResidents} خوابگاهی • {overviewStats.commuters} ترددی</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
            <div className="text-[11px] text-slate-300">ظرفیت اشغال سراها</div>
            <div className="text-lg font-black mt-0.5">{overviewStats.occupancyPercent}٪</div>
            <div className="text-[10px] text-cyan-200">{overviewStats.occupiedBeds} از {overviewStats.totalBeds} تخت</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
            <div className="text-[11px] text-slate-300">فرهنگی و ورزشی</div>
            <div className="text-lg font-black mt-0.5">{overviewStats.approvedCulturalPrograms + overviewStats.activeSportsPrograms}</div>
            <div className="text-[10px] text-fuchsia-200">{overviewStats.approvedCulturalPrograms} فرهنگی • {overviewStats.activeSportsPrograms} ورزشی</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
            <div className="text-[11px] text-slate-300">پرونده حراست و انضباط</div>
            <div className="text-lg font-black mt-0.5">{overviewStats.openSecurity + overviewStats.activeDisciplinary}</div>
            <div className="text-[10px] text-amber-200">{overviewStats.openSecurity} حراست • {overviewStats.activeDisciplinary} انضباطی</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
            <div className="text-[11px] text-slate-300">اخطار و تعمیرات باز</div>
            <div className="text-lg font-black mt-0.5">{overviewStats.activeWarnings + overviewStats.openMaintenance}</div>
            <div className="text-[10px] text-rose-200">{overviewStats.activeWarnings} اخطار • {overviewStats.openMaintenance} تعمیر</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
            <div className="text-[11px] text-slate-300">پایش کل مکاتبات</div>
            <div className="text-lg font-black mt-0.5">{overviewStats.totalMessages}</div>
            <div className="text-[10px] text-indigo-200">{overviewStats.staffMessagesCount} پیام بین‌واحدی</div>
          </div>
        </div>
      </div>

      {securityBanner && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between">
          <span>{securityBanner}</span>
          <button type="button" onClick={() => setSecurityBanner(null)} className="text-emerald-600 cursor-pointer">
            بستن
          </button>
        </div>
      )}

      {/* تب‌های پنج‌گانه کارتابل معاونت دانشجویی */}
      <div className="flex flex-wrap gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('supervisor')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'supervisor'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>امور سرپرستی سراها</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('student_affairs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'student_affairs'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>امور دانشجویی، ورزش و شوراها</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cultural')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'cultural'
              ? 'bg-fuchsia-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>امور فرهنگی و تشکل‌ها</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('detailed_reports')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'detailed_reports'
              ? 'bg-cyan-700 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>گزارش‌های جامع و تحلیلی ({filteredReportStudents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('messages_monitor')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'messages_monitor'
              ? 'bg-slate-900 dark:bg-indigo-700 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>پایش پیام‌های تمام حوزه‌ها ({crossDomainData.messages.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clearance')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'clearance'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>تسویه حساب فارغ‌التحصیلان</span>
          {Storage.getGraduationClearances().filter((c) => c.educationGateStatus === 'approved' && (c.units?.vice_dean?.status || 'pending') === 'pending').length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
              {Storage.getGraduationClearances().filter((c) => c.educationGateStatus === 'approved' && (c.units?.vice_dean?.status || 'pending') === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* تب ۱: تمامی امکانات سرپرستی */}
      {activeTab === 'supervisor' && (
        <SupervisorDashboard
          supervisor={syntheticSupervisor}
          dorms={dorms}
          rooms={rooms}
          beds={beds}
          students={students}
          announcements={announcements}
          warnings={warnings}
          settings={settings}
          maintenanceTasks={maintenanceTasks}
          maintenanceStaff={maintenanceStaff}
          onRefreshData={onRefreshData}
          onOpenReports={onOpenReports}
          onOpenMessages={onOpenMessages}
          onOpenExcelModal={onOpenExcelModal}
          embeddedMode
        />
      )}

      {/* تب ۲: تمامی امکانات امور دانشجویی و تربیت بدنی */}
      {activeTab === 'student_affairs' && (
        <StudentAffairsDashboard
          staff={syntheticStudentAffairs}
          students={students}
          dorms={dorms}
          rooms={rooms}
          cloudSyncTick={cloudSyncTick}
          onRefreshData={onRefreshData}
          onOpenReports={onOpenReports}
          onOpenMessages={onOpenMessages}
          onOpenChangePassword={onOpenChangePassword}
          embeddedMode
        />
      )}

      {/* تب ۳: تمامی امکانات امور فرهنگی */}
      {activeTab === 'cultural' && (
        <CulturalDashboard
          staff={syntheticCultural}
          dorms={dorms}
          cloudSyncTick={cloudSyncTick}
          onRefreshData={onRefreshData}
          onOpenMessages={onOpenMessages}
          onOpenChangePassword={onOpenChangePassword}
          embeddedMode
        />
      )}

      {/* تب ۴: گزارش‌های جامع و تحلیلی با فیلترهای متعدد */}
      {activeTab === 'detailed_reports' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* فیلترهای پیشرفته */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300">
                  <Filter className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-black text-base text-slate-900 dark:text-white">
                    گزارش‌ساز تحلیلی و دقیق معاونت دانشجویی
                  </h2>
                  <p className="text-xs text-slate-500">
                    فیلتر همزمان بر اساس سرا، جنسیت، وضعیت اسکان، رشته، ورودی، استان و پرونده‌های انضباطی/حراستی با خروجی اکسل چندبرگ و چاپ A4
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={resetReportFilters}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>پاک‌کردن فیلترها</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintDetailedReport}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپ گزارش A4</span>
                </button>
                <button
                  type="button"
                  disabled={isExportingExcel}
                  onClick={handleExportDetailedExcel}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{isExportingExcel ? 'در حال تولید اکسل...' : 'خروجی اکسل کامل (۴ شیت)'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="جستجوی دانشجو (نام، شماره دانشجویی، کد ملی، رشته، موبایل، نام سرا)..."
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <select
                value={dormFilter}
                onChange={(e) => {
                  setDormFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
              >
                <option value="all">سرا: همه دانشجویان (خوابگاهی + ترددی)</option>
                <option value="commuter">فقط دانشجویان ترددی / فاقد اتاق</option>
                {dorms.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={genderFilter}
                onChange={(e) => {
                  setGenderFilter(e.target.value as typeof genderFilter);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
              >
                <option value="all">جنسیت سرا: همه</option>
                <option value="brothers">سراهای برادران</option>
                <option value="sisters">سراهای خواهران</option>
              </select>

              <select
                value={assignmentFilter}
                onChange={(e) => {
                  setAssignmentFilter(e.target.value as typeof assignmentFilter);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="all">وضعیت اسکان: همه</option>
                <option value="confirmed">اسکان قطعی (Confirmed)</option>
                <option value="temporary">اسکان موقت (Temporary)</option>
                <option value="none">بدون تخصیص اتاق (None)</option>
              </select>

              <select
                value={fieldFilter}
                onChange={(e) => {
                  setFieldFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="all">رشته تحصیلی: همه ({uniqueFields.length})</option>
                {uniqueFields.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>

              <select
                value={entryTermFilter}
                onChange={(e) => {
                  setEntryTermFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="all">ترم / سال ورود: همه ({uniqueEntryTerms.length})</option>
                {uniqueEntryTerms.map((t) => (
                  <option key={t} value={t}>
                    ورودی {t}
                  </option>
                ))}
              </select>

              <select
                value={provinceFilter}
                onChange={(e) => {
                  setProvinceFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="all">استان سکونت: همه ({uniqueProvinces.length})</option>
                {uniqueProvinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <select
                value={profileFilter}
                onChange={(e) => {
                  setProfileFilter(e.target.value as typeof profileFilter);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="all">وضعیت پروفایل: همه</option>
                <option value="completed">پرونده تکمیل‌شده</option>
                <option value="incomplete">پرونده ناقص / تکمیل‌نشده</option>
              </select>

              <select
                value={flagFilter}
                onChange={(e) => {
                  setFlagFilter(e.target.value as typeof flagFilter);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold sm:col-span-2 lg:col-span-3"
              >
                <option value="all">فیلتر سوابق و وضعیت خاص: همه دانشجویان</option>
                <option value="has_security">دارای گزارش ثبت‌شده در واحد حراست و انتظامات</option>
                <option value="has_disciplinary">معرفی‌شده به شورای انضباطی</option>
                <option value="has_warning_eval">دارای اخطار، فراخوانی یا نمره منفی سرپرستی</option>
                <option value="has_guest">دارای سابقه درخواست مهمان</option>
              </select>
            </div>
          </div>

          {/* شاخص‌های میان‌بخش + تفکیک سراها */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* جدول تفکیکی وضعیت سراها */}
            <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>گزارش تحلیلی ظرفیت، اسکان و شاخص‌های هر سرا</span>
                </h3>
                <span className="text-[11px] text-slate-500">{dormBreakdown.length} سرا</span>
              </div>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-2.5">نام سرا</th>
                      <th className="p-2.5">جنسیت</th>
                      <th className="p-2.5">اتاق / تخت</th>
                      <th className="p-2.5">اشغال (قطعی / موقت)</th>
                      <th className="p-2.5">تخت خالی</th>
                      <th className="p-2.5">انضباط / نظافت</th>
                      <th className="p-2.5">اخطار / تعمیر باز</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dormBreakdown.map((item) => (
                      <tr key={item.dorm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">{item.dorm.name}</td>
                        <td className="p-2.5">{item.dorm.gender === 'brothers' ? 'برادران' : 'خواهران'}</td>
                        <td className="p-2.5">{item.roomCount} اتاق / {item.totalBeds} تخت</td>
                        <td className="p-2.5">
                          <span className="font-extrabold text-teal-700 dark:text-teal-300">{item.occupancyPct}٪</span>{' '}
                          <span className="text-[11px] text-slate-500">
                            ({item.occupiedConfirmed} قطعی / {item.occupiedTemp} موقت)
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-emerald-700 dark:text-emerald-400">{item.freeBeds}</td>
                        <td className="p-2.5">
                          <span className="font-mono">{item.avgDisc} / {item.avgClean}</span>
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                            {item.activeWarnCount} اخطار • {item.openMaintCount} تعمیر
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* کارت خلاصه حوزه‌های فرهنگی، ورزشی، شوراها و نظرسنجی */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                <span>شاخص‌های میان‌بخش سامانه</span>
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-fuchsia-50/70 dark:bg-fuchsia-950/20 border border-fuchsia-200/70 dark:border-fuchsia-900/40 flex items-center justify-between">
                  <span className="font-bold text-fuchsia-900 dark:text-fuchsia-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-fuchsia-600" />
                    امور فرهنگی و تشکل‌ها
                  </span>
                  <span className="font-extrabold text-fuchsia-700 dark:text-fuchsia-300">
                    {overviewStats.approvedCulturalPrograms} برنامه / {crossDomainData.culturalAssociations.length} تشکل
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200/70 dark:border-sky-900/40 flex items-center justify-between">
                  <span className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                    <Dumbbell className="w-4 h-4 text-sky-600" />
                    تربیت بدنی و ورزش
                  </span>
                  <span className="font-extrabold text-sky-700 dark:text-sky-300">
                    {overviewStats.activeSportsPrograms} برنامه / {crossDomainData.sportsRegistrations.length} ثبت‌نام
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/40 flex items-center justify-between">
                  <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <Vote className="w-4 h-4 text-indigo-600" />
                    انتخابات شورای صنفی
                  </span>
                  <span className="font-extrabold text-indigo-700 dark:text-indigo-300">
                    {crossDomainData.guildElections.length} دوره / {crossDomainData.guildVotes.length} رأی
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 flex items-center justify-between">
                  <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    حراست و شورای انضباطی
                  </span>
                  <span className="font-extrabold text-amber-700 dark:text-amber-300">
                    {crossDomainData.securityReports.length} حراست / {crossDomainData.disciplinaryReferrals.length} انضباطی
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-900/40 flex items-center justify-between">
                  <span className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-teal-600" />
                    نظرسنجی، مهمان و تأسیسات
                  </span>
                  <span className="font-extrabold text-teal-700 dark:text-teal-300">
                    {crossDomainData.surveyResponses.length} نظرسنجی / {crossDomainData.guestRequests.length} مهمان
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* آمار تفکیکی بر اساس رشته تحصیلی مطابق فیلتر فعال */}
          {fieldBreakdown.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>توزیع جمعیت فیلترشده بر اساس رشته تحصیلی ({fieldBreakdown.length} رشته)</span>
                </h3>
                <span className="text-[11px] text-slate-500">جمع فیلترشده: {filteredReportStudents.length} نفر</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                {fieldBreakdown.slice(0, 12).map((fb) => (
                  <div
                    key={fb.field}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col gap-1"
                  >
                    <div className="font-bold text-slate-900 dark:text-white truncate">{fb.field}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                      <span>کل: <strong>{fb.total}</strong></span>
                      <span className="text-teal-700 dark:text-teal-300">{fb.residents} خوابگاهی</span>
                      <span className="text-amber-700 dark:text-amber-300">{fb.commuters} ترددی</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* جدول تفصیلی دانشجویان فیلترشده با مرتب‌سازی و صفحه‌بندی */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <BedIcon className="w-4 h-4 text-teal-600" />
                <span>فهرست تفصیلی دانشجویان مطابق فیلترهای اعمال‌شده ({filteredReportStudents.length} نفر)</span>
              </h3>
            </div>

            <StudentListPaginationBar
              totalItems={filteredReportStudents.length}
              currentPage={safeReportPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">
                      <button type="button" onClick={() => toggleSort('fullName')} className="inline-flex items-center gap-1 cursor-pointer hover:text-teal-600">
                        <span>نام و نام خانوادگی</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-2.5">
                      <button type="button" onClick={() => toggleSort('studentId')} className="inline-flex items-center gap-1 cursor-pointer hover:text-teal-600">
                        <span>شماره دانشجویی</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-2.5">
                      <button type="button" onClick={() => toggleSort('fieldOfStudy')} className="inline-flex items-center gap-1 cursor-pointer hover:text-teal-600">
                        <span>رشته / ورودی</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-2.5">استان</th>
                    <th className="p-2.5">
                      <button type="button" onClick={() => toggleSort('dormName')} className="inline-flex items-center gap-1 cursor-pointer hover:text-teal-600">
                        <span>سرا و اتاق</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-2.5">
                      <button type="button" onClick={() => toggleSort('assignmentStatus')} className="inline-flex items-center gap-1 cursor-pointer hover:text-teal-600">
                        <span>اسکان / پرونده</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-2.5">
                      <button type="button" onClick={() => toggleSort('previousScore')} className="inline-flex items-center gap-1 cursor-pointer hover:text-teal-600">
                        <span>امتیاز</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-2.5">سوابق (حراست/انضباط/اخطار)</th>
                    <th className="p-2.5 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedReportStudents.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        دانشجویی با این ترکیب فیلتر یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    paginatedReportStudents.map((s, idx) => {
                      const rowNum = vdStartIdx + idx + 1;
                      const dormObj = s.assignedDormId ? dormMap.get(s.assignedDormId) : undefined;
                      const roomObj = s.assignedRoomId ? roomMap.get(s.assignedRoomId) : undefined;
                      const secC = studentFlagsMap.secCount.get(s.studentId) || 0;
                      const discC = studentFlagsMap.discCount.get(s.studentId) || 0;
                      const evalC = studentFlagsMap.evalCount.get(s.studentId) || 0;

                      return (
                        <tr key={s.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 text-slate-400">{rowNum}</td>
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white">{s.fullName}</td>
                          <td className="p-2.5 font-mono" dir="ltr">{s.studentId}</td>
                          <td className="p-2.5">
                            <div>{s.fieldOfStudy || '-'}</div>
                            <div className="text-[10px] text-slate-400">ورودی {s.entryTerm || '-'}</div>
                          </td>
                          <td className="p-2.5">{s.province || '-'}</td>
                          <td className="p-2.5">
                            {isStudentDormResident(s) ? (
                              <div>
                                <div className="font-semibold">{dormObj?.name || s.assignedDormName || 'سرا'}</div>
                                <div className="text-[10px] text-slate-500">
                                  اتاق {roomObj?.roomNumber || s.assignedRoomNumber || '-'}
                                </div>
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                                ترددی / بدون اتاق
                              </span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-block w-fit px-2 py-0.5 rounded text-[10px] font-bold ${
                                  s.assignmentStatus === 'confirmed'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : s.assignmentStatus === 'temporary'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                              >
                                {s.assignmentStatus === 'confirmed'
                                  ? 'اسکان قطعی'
                                  : s.assignmentStatus === 'temporary'
                                  ? 'اسکان موقت'
                                  : 'بدون تخصیص'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                پرونده: {s.isProfileCompleted ? 'تکمیل' : 'ناقص'}
                              </span>
                            </div>
                          </td>
                          <td className="p-2.5 font-mono font-bold">{s.previousScore ?? '-'}</td>
                          <td className="p-2.5">
                            <div className="flex flex-wrap gap-1 text-[10px] font-bold">
                              {secC > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                  {secC} حراست
                                </span>
                              )}
                              {discC > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                  {discC} انضباطی
                                </span>
                              )}
                              {evalC > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                  {evalC} اخطار/نمره
                                </span>
                              )}
                              {secC === 0 && discC === 0 && evalC === 0 && (
                                <span className="text-emerald-600 dark:text-emerald-400">فاقد سابقه منفی</span>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => setReferralTargetStudent(s)}
                              className="px-2.5 py-1 rounded-xl bg-fuchsia-50 hover:bg-fuchsia-100 dark:bg-fuchsia-950/60 text-fuchsia-800 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              title="ارجاع دانشجو به مشاور، امور دانشجویی یا حراست با ثبت گزارش"
                            >
                              <Send className="w-3 h-3" />
                              <span>ارجاع / گزارش</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <StudentListPaginationBar
              totalItems={filteredReportStudents.length}
              currentPage={safeReportPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              showPageSizeSelector={false}
              compact
            />
          </div>
        </div>
      )}

      {/* تب ۵: پایش جامع پیام‌ها و مکاتبات تمام حوزه‌ها */}
      {activeTab === 'messages_monitor' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <h2 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                <span>پایش متمرکز پیام‌ها و مکاتبات تمام حوزه‌های سامانه</span>
              </h2>
              <p className="text-xs text-slate-500">
                دسترسی نظارتی کامل به تمامی پیام‌های ارسال‌شده بین دانشجویان، سرپرستان، تأسیسات، حراست، آموزش، فرهنگی، مشاوره، مالی، انبار و مدیریت.
                <strong className="text-indigo-700 dark:text-indigo-300"> ارسال پیام یا پاسخ توسط معاونت صرفاً با کارکنان و واحدهای اداری (بجز دانشجو) فعال است.</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenMessages}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold transition flex items-center gap-2 cursor-pointer shrink-0 shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>ارسال / پاسخ پیام با کارکنان و واحدها</span>
            </button>
          </div>

          {/* نوار فیلتر پایش پیام‌ها */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={msgSearch}
                onChange={(e) => setMsgSearch(e.target.value)}
                placeholder="جستجو در عنوان، متن، نام فرستنده یا گیرنده..."
                className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <select
              value={msgDomainFilter}
              onChange={(e) => setMsgDomainFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
            >
              <option value="all">همه نقش‌ها و حوزه‌ها ({crossDomainData.messages.length})</option>
              {Object.entries(ROLE_LABELS_FA).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={msgCategoryFilter}
              onChange={(e) => setMsgCategoryFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              <option value="all">همه موضوعات</option>
              {Object.entries(MSG_CATEGORY_LABELS_FA).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <select
                value={msgStatusFilter}
                onChange={(e) => setMsgStatusFilter(e.target.value as typeof msgStatusFilter)}
                className="flex-1 px-2.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="all">وضعیت: همه</option>
                <option value="pending">در انتظار پاسخ</option>
                <option value="in_progress">در حال بررسی</option>
                <option value="answered">پاسخ‌داده‌شده</option>
              </select>
              <select
                value={msgConfFilter}
                onChange={(e) => setMsgConfFilter(e.target.value as typeof msgConfFilter)}
                className="flex-1 px-2.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="all">محرمانگی: همه</option>
                <option value="confidential">محرمانه</option>
                <option value="normal">عادی</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* لیست پیام‌ها */}
            <div className="lg:col-span-1 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 space-y-2 max-h-[520px] overflow-y-auto">
              {monitoredMessages.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  پیامی با فیلتر انتخاب‌شده یافت نشد.
                </div>
              ) : (
                monitoredMessages.map((msg) => {
                  const active = selectedMonitorMsg?.id === msg.id;
                  return (
                    <button
                      key={msg.id}
                      type="button"
                      onClick={() => setSelectedMonitorMsgId(msg.id)}
                      className={`w-full text-right p-3 rounded-2xl border transition cursor-pointer ${
                        active
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-extrabold text-slate-900 dark:text-white truncate">
                          {msg.senderName}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            msg.status === 'answered'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {msg.status === 'answered' ? 'پاسخ‌داده‌شده' : 'در انتظار'}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 truncate">
                        {msg.isConfidential ? '🔒 ' : ''}
                        {msg.subject}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                        <span>
                          {ROLE_LABELS_FA[msg.senderRole] || msg.senderRole} ← {ROLE_LABELS_FA[msg.receiverType] || msg.receiverType}
                        </span>
                        <span>{msg.date.split('-')[0]}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* جزئیات پیام */}
            <div className="lg:col-span-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-800/30">
              {selectedMonitorMsg ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          فرستنده: {selectedMonitorMsg.senderName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-bold">
                          {ROLE_LABELS_FA[selectedMonitorMsg.senderRole] || selectedMonitorMsg.senderRole}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 text-[10px] font-bold">
                          گیرنده: {selectedMonitorMsg.receiverName || ROLE_LABELS_FA[selectedMonitorMsg.receiverType] || selectedMonitorMsg.receiverType}
                        </span>
                        {selectedMonitorMsg.isConfidential && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-extrabold inline-flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            محرمانه
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {selectedMonitorMsg.date}
                      </span>
                    </div>

                    <div className="text-sm font-black text-indigo-900 dark:text-indigo-200">
                      موضوع: {selectedMonitorMsg.subject}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedMonitorMsg.content}
                    </p>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedMonitorMsg.replies.length === 0 ? (
                      <div className="text-xs text-slate-400 p-3 text-center">هنوز پاسخی در این گفتگو ثبت نشده است.</div>
                    ) : (
                      selectedMonitorMsg.replies.map((rep) => (
                        <div
                          key={rep.id}
                          className="p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-bold text-teal-900 dark:text-teal-200">
                            <span>{rep.senderName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{rep.date}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{rep.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    {selectedMonitorMsg.senderRole === 'student' || selectedMonitorMsg.receiverType === 'student' ? (
                      <span className="text-indigo-900 dark:text-indigo-200 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        حالت پایش فقط-خواندنی: پیام‌های دانشجویی برای معاونت دانشجویی فقط جهت نظارت نمایش داده می‌شوند و پاسخ‌دهی مستقیم به دانشجو غیرفعال است.
                      </span>
                    ) : (
                      <>
                        <span className="text-indigo-900 dark:text-indigo-200 font-bold">
                          این گفتگو میان کارکنان و واحدهای سامانه است و می‌توانید در پیام‌رسان به آن پاسخ دهید.
                        </span>
                        <button
                          type="button"
                          onClick={onOpenMessages}
                          className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shrink-0 cursor-pointer"
                        >
                          باز کردن پیام‌رسان کارکنان
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                  یک گفتگو را از ستون سمت راست انتخاب کنید.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* تب ۶: تسویه حساب الکترونیک فارغ‌التحصیلان */}
      {activeTab === 'clearance' && (
        <GraduationClearanceReviewPanel
          unitRole="vice_dean"
          reviewerId={staff.id}
          reviewerName={staff.fullName}
          settings={settings}
          onDataChange={onRefreshData}
        />
      )}

      {/* مودال ارسال گزارش به حراست */}
      <SendSecurityReportModal
        isOpen={isSendSecurityModalOpen}
        onClose={() => setIsSendSecurityModalOpen(false)}
        reporterRole="vice_dean"
        reporterId={staff.id}
        reporterName={staff.fullName}
        students={students}
        dorms={dorms}
        rooms={rooms}
        onSuccess={(msg) => {
          setSecurityBanner(msg);
          onRefreshData();
        }}
      />

      <StudentReferralModal
        isOpen={Boolean(referralTargetStudent)}
        onClose={() => setReferralTargetStudent(null)}
        student={referralTargetStudent}
        dorms={dorms}
        rooms={rooms}
        actorId={staff.id}
        actorName={staff.fullName}
        actorRole="vice_dean"
        onSuccess={(msg) => {
          setSecurityBanner(msg);
          setTimeout(() => setSecurityBanner(null), 4000);
          onRefreshData();
        }}
      />
    </div>
  );
};
