import React, { useEffect, useMemo, useState } from 'react';
import { PersianDatePicker } from './PersianDatePicker';
import { PersianTimeRangePicker } from './PersianTimeRangePicker';
import {
  getTodayJalali,
  formatJalaliDate,
  getJalaliWeekdayLabelFromDate,
  addDaysToJalaliDate,
  toEnglishDigits as toEnDigitsCal,
} from '../utils/jalaliCalendar';
import {
  Supervisor,
  Dormitory,
  Room,
  Bed,
  Student,
  Announcement,
  RoomWarning,
  AppSettings,
  MaintenanceTask,
  MaintenanceStaff,
  SupervisorShiftSchedule,
  ShiftLogReport,
  StudentEvaluation,
} from '../types';
import { Storage } from '../utils/storage';
import { exportShiftReportsToExcel } from '../utils/excelUtils';
import { compareStudents, normSearchText, StudentSortKey } from '../utils/studentSearchSort';
import { SupervisorRoomManager } from './SupervisorRoomManager';
import { VisualBedPicker } from './VisualBedPicker';
import { RoomWarningModal } from './RoomWarningModal';
import { DormIdCardModal } from './DormIdCardModal';
import { StudentEvaluationModal } from './StudentEvaluationModal';
import { StudentRoomProfileModal } from './StudentRoomProfileModal';
import { SupervisorGuestRequestsPanel } from './SupervisorGuestRequestsPanel';
import { RichTextDisplay } from './RichTextEditor';
import { ImageLightboxModal, AnnouncementImageBox } from './ImageLightboxModal';
import { SendSecurityReportModal } from './SendSecurityReportModal';
import { StudentReferralModal } from './StudentReferralModal';
import { GraduationClearanceReviewPanel } from './GraduationClearanceReviewPanel';
import { CollapsibleMenuGrid } from './CollapsibleMenuGrid';
import { MaintenanceQuickCommButtons } from './MaintenanceQuickCommButtons';
import {
  StudentListPaginationBar,
  DEFAULT_STUDENT_PAGE_SIZE,
  getPaginationMeta,
} from './StudentListPaginationBar';
import {
  Building2,
  Users,
  Bed as BedIcon,
  Shield,
  ShieldAlert,
  Bell,
  Sparkles,
  BarChart3,
  MessageSquare,
  Plus,
  CheckCircle,
  AlertTriangle,
  ArrowRightLeft,
  X,
  FileSpreadsheet,
  Clock,
  XCircle,
  CheckCheck,
  QrCode,
  UserMinus,
  UserPlus,
  Save,
  Wrench,
  Search,
  CheckCircle2,
  Phone,
  Tag,
  AlertCircle,
  Package,
  PackagePlus,
  Boxes,
  BookOpen,
  Printer,
  Award,
  SlidersHorizontal,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Send,
  GraduationCap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SupervisorDashboardProps {
  supervisor: Supervisor;
  dorms: Dormitory[];
  rooms: Room[];
  beds: Bed[];
  students: Student[];
  announcements: Announcement[];
  warnings: RoomWarning[];
  settings: AppSettings;
  maintenanceTasks?: MaintenanceTask[];
  maintenanceStaff?: MaintenanceStaff[];
  onRefreshData: () => void;
  onOpenReports: () => void;
  onOpenMessages: () => void;
  onOpenExcelModal: () => void;
  onOpenUserGuide?: (role: 'supervisor') => void;
  embeddedMode?: boolean;
}

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({
  supervisor,
  dorms,
  rooms,
  beds,
  students,
  announcements,
  warnings,
  settings,
  maintenanceTasks,
  maintenanceStaff,
  onRefreshData,
  onOpenReports,
  onOpenMessages,
  onOpenExcelModal,
  onOpenUserGuide,
  embeddedMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<'manager' | 'visual_picker' | 'announcements' | 'students' | 'guest_requests' | 'maintenance' | 'warehouse' | 'shifts' | 'clearance' | null>(null);
  const [isPendingApprovalsOpen, setIsPendingApprovalsOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [isStudentEvalModalOpen, setIsStudentEvalModalOpen] = useState(false);
  const [isSendSecurityModalOpen, setIsSendSecurityModalOpen] = useState(false);
  const [evalTargetStudent, setEvalTargetStudent] = useState<Student | null>(null);
  const [evalRefreshTick, setEvalRefreshTick] = useState(0);

  // فرم ثبت گزارش شیفت و دفتر وقایع روزانه
  const [isAddShiftReportModalOpen, setIsAddShiftReportModalOpen] = useState(false);
  const [repShiftDate, setRepShiftDate] = useState(() => {
    const t = getTodayJalali();
    return formatJalaliDate(t.jy, t.jm, t.jd, 'fa');
  });
  const [repShiftDormId, setRepShiftDormId] = useState('');
  const [repShiftType, setRepShiftType] = useState<ShiftLogReport['shiftType']>('full_day');
  const [repShiftTime, setRepShiftTime] = useState('۰۷:۰۰ الی ۰۷:۰۰');
  const [repStudentCount, setRepStudentCount] = useState<number>(85);
  const [repInspections, setRepInspections] = useState('');
  const [repIncidents, setRepIncidents] = useState('');
  const [repHandover, setRepHandover] = useState('');

  // فیلترهای گزارش‌گیری از شیفت‌ها
  const [repFilterDorm, setRepFilterDorm] = useState('all');
  const [repFilterSupervisor, setRepFilterSupervisor] = useState('all');
  const [repFilterType, setRepFilterType] = useState('all');
  const [repSearchQuery, setRepSearchQuery] = useState('');

  // بزرگ‌نمایی تصویر اطلاعیه (فقط مشاهده)
  const [previewAnnImage, setPreviewAnnImage] = useState<string | null>(null);
  const [viewCardStudent, setViewCardStudent] = useState<Student | null>(null);
  const [profileModalStudentId, setProfileModalStudentId] = useState<string | null>(null);
  const [rejectWarehouseTarget, setRejectWarehouseTarget] = useState<{ id: string; code: string; title: string } | null>(null);
  const [rejectWarehouseReason, setRejectWarehouseReason] = useState('');

  // جستجوی پیشرفته و مرتب‌سازی تب فهرست دانشجویان
  const [showAdvancedStudentFilters, setShowAdvancedStudentFilters] = useState(true);
  const [stQuery, setStQuery] = useState('');
  const [stNameFilter, setStNameFilter] = useState('');
  const [stNationalIdFilter, setStNationalIdFilter] = useState('');
  const [stStudentIdFilter, setStStudentIdFilter] = useState('');
  const [stLocationFilter, setStLocationFilter] = useState('');
  const [stFieldFilter, setStFieldFilter] = useState('all');
  const [stEntryFilter, setStEntryFilter] = useState('all');
  const [stDormFilter, setStDormFilter] = useState('all');
  const [stRoomFilter, setStRoomFilter] = useState('');
  const [stAssignFilter, setStAssignFilter] = useState<'all' | 'confirmed' | 'temporary' | 'none'>('all');
  const [stProfileFilter, setStProfileFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [stSortBy, setStSortBy] = useState<StudentSortKey>('default');
  const [stSortDir, setStSortDir] = useState<'asc' | 'desc'>('asc');
  const [studentPageSize, setStudentPageSize] = useState<number | 'all'>(DEFAULT_STUDENT_PAGE_SIZE);
  const [studentCurrentPage, setStudentCurrentPage] = useState<number>(1);
  const [referralTargetStudent, setReferralTargetStudent] = useState<Student | null>(null);

  useEffect(() => {
    setStudentCurrentPage(1);
  }, [
    stQuery,
    stNameFilter,
    stNationalIdFilter,
    stStudentIdFilter,
    stLocationFilter,
    stFieldFilter,
    stEntryFilter,
    stDormFilter,
    stRoomFilter,
    stAssignFilter,
    stProfileFilter,
    stSortBy,
    stSortDir,
  ]);

  // فرم ثبت مستقیم خرابی تأسیسات توسط سرپرست
  const [isAddMaintenanceModalOpen, setIsAddMaintenanceModalOpen] = useState(false);
  const [maintTitle, setMaintTitle] = useState('');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintDormId, setMaintDormId] = useState('');
  const [maintRoomNumber, setMaintRoomNumber] = useState('');
  const [maintPriority, setMaintPriority] = useState<MaintenanceTask['priority']>('normal');
  const [maintCategory, setMaintCategory] = useState<MaintenanceTask['category']>('plumbing');
  const [maintStaffId, setMaintStaffId] = useState('');
  const [maintSearchQuery, setMaintSearchQuery] = useState('');
  const [maintStatusFilter, setMaintStatusFilter] = useState<string>('all');
  const [maintFeedback, setMaintFeedback] = useState<string | null>(null);

  // تخصیص تخت به دانشجوی فاقد اسکان از جدول
  const [assigningStudent, setAssigningStudent] = useState<Student | null>(null);
  const [targetBedForStudent, setTargetBedForStudent] = useState('');

  // حذف دانشجو از اتاق / آزادسازی تخت
  const handleEvictStudent = (st: Student) => {
    setSupConfirmDialog({
      title: 'لغو اسکان و آزادسازی تخت',
      message: `آیا از لغو اسکان و حذف دانشجو «${st.fullName}» از اتاق اطمینان دارید؟ پرونده دانشجو در سیستم حفظ شده و وضعیت وی به «فاقد اسکان» تغییر می‌یابد و تخت آزاد می‌گردد.`,
      confirmLabel: 'تأیید و لغو اسکان',
      onConfirm: () => {
        const res = Storage.releaseBed(st.studentId);
        setActionFeedback(res.message);
        onRefreshData();
        setTimeout(() => setActionFeedback(null), 3000);
      },
    });
  };

  // تخصیص دانشجو از جدول به تخت
  const handleAssignStudentFromTable = () => {
    if (!assigningStudent || !targetBedForStudent) return;
    const res = Storage.assignBedToStudent(assigningStudent.studentId, targetBedForStudent, true);
    setActionFeedback(res.message);
    setAssigningStudent(null);
    setTargetBedForStudent('');
    onRefreshData();
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // سراهای تحت نظارت این سرپرست
  const myAssignedDormIds: string[] =
    supervisor.assignedDormIds && supervisor.assignedDormIds.length > 0
      ? supervisor.assignedDormIds
      : supervisor.assignedDormId && supervisor.assignedDormId !== 'all'
      ? [supervisor.assignedDormId]
      : dorms.map((d) => d.id);

  const myDorms = dorms.filter((d) => myAssignedDormIds.includes(d.id));

  // انتخاب سرای فعال برای فیلتر یا مشاهده همه سراهای تحت نظارت
  const [selectedDormId, setSelectedDormId] = useState<string>(
    myDorms.length === 1 ? myDorms[0].id : 'all'
  );

  const activeDormIds = selectedDormId === 'all' ? myAssignedDormIds : [selectedDormId];
  const dormBeds = beds.filter((b) => activeDormIds.includes(b.dormId));
  const totalBeds = dormBeds.length;
  const occupiedBeds = dormBeds.filter((b) => b.studentId).length;
  const vacantBeds = totalBeds - occupiedBeds;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const currentDorm = dorms.find((d) => d.id === selectedDormId) || myDorms[0] || dorms[0];

  const uniqueStudentFields = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.fieldOfStudy?.trim()) set.add(s.fieldOfStudy.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fa'));
  }, [students]);

  const uniqueStudentEntryTerms = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.entryTerm?.trim()) set.add(s.entryTerm.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  const roomLookupMap = useMemo(() => new Map(rooms.map((rm) => [rm.id, rm])), [rooms]);
  const dormLookupMap = useMemo(() => new Map(dorms.map((dm) => [dm.id, dm])), [dorms]);
  const bedLookupMap = useMemo(() => new Map(beds.map((bd) => [bd.id, bd])), [beds]);

  const filteredTabStudents = useMemo(() => {
    const q = normSearchText(stQuery);
    const nameQ = normSearchText(stNameFilter);
    const nidQ = normSearchText(stNationalIdFilter);
    const sidQ = normSearchText(stStudentIdFilter);
    const locQ = normSearchText(stLocationFilter);
    const roomQ = normSearchText(stRoomFilter);

    return students.filter((st) => {
      const r = st.assignedRoomId ? roomLookupMap.get(st.assignedRoomId) : undefined;
      const d = st.assignedDormId ? dormLookupMap.get(st.assignedDormId) : undefined;
      const roomNum = r?.roomNumber || st.assignedRoomNumber || '';
      const dormTitle = d?.name || st.assignedDormName || '';

      if (q) {
        const haystack = [
          st.fullName,
          st.studentId,
          st.nationalId,
          st.fatherName,
          st.fieldOfStudy,
          st.entryTerm,
          st.mobile,
          st.phone,
          st.emergencyPhone,
          st.parentPhone,
          st.province,
          st.city,
          st.postalAddress,
          dormTitle,
          roomNum,
        ]
          .map(normSearchText)
          .join(' ');
        if (!haystack.includes(q)) return false;
      }

      if (nameQ && !normSearchText(`${st.fullName} ${st.fatherName || ''}`).includes(nameQ)) {
        return false;
      }

      if (nidQ && !normSearchText(st.nationalId).includes(nidQ)) {
        return false;
      }

      if (sidQ && !normSearchText(st.studentId).includes(sidQ)) {
        return false;
      }

      if (locQ) {
        const locStr = normSearchText(`${st.province || ''} ${st.city || ''} ${st.postalAddress || ''}`);
        if (!locStr.includes(locQ)) return false;
      }

      if (stFieldFilter !== 'all' && (st.fieldOfStudy || '').trim() !== stFieldFilter) {
        return false;
      }

      if (stEntryFilter !== 'all' && (st.entryTerm || '').trim() !== stEntryFilter) {
        return false;
      }

      if (stDormFilter === 'my_dorms') {
        if (!st.assignedDormId || !myAssignedDormIds.includes(st.assignedDormId)) return false;
      } else if (stDormFilter === 'unassigned') {
        if (st.assignedBedId && st.assignmentStatus !== 'none') return false;
      } else if (stDormFilter !== 'all') {
        if (st.assignedDormId !== stDormFilter) return false;
      }

      if (roomQ && !normSearchText(roomNum).includes(roomQ)) {
        return false;
      }

      if (stAssignFilter !== 'all') {
        const status = st.assignedBedId ? st.assignmentStatus || 'temporary' : 'none';
        if (status !== stAssignFilter) return false;
      }

      if (stProfileFilter === 'completed' && !st.isProfileCompleted) return false;
      if (stProfileFilter === 'incomplete' && st.isProfileCompleted) return false;

      return true;
    });
  }, [
    students,
    roomLookupMap,
    dormLookupMap,
    myAssignedDormIds,
    stQuery,
    stNameFilter,
    stNationalIdFilter,
    stStudentIdFilter,
    stLocationFilter,
    stFieldFilter,
    stEntryFilter,
    stDormFilter,
    stRoomFilter,
    stAssignFilter,
    stProfileFilter,
  ]);

  const sortedTabStudents = useMemo(() => {
    if (stSortBy === 'default') return filteredTabStudents;
    const list = [...filteredTabStudents];
    list.sort((a, b) => compareStudents(a, b, stSortBy, stSortDir, rooms, dorms));
    return list;
  }, [filteredTabStudents, stSortBy, stSortDir, rooms, dorms]);

  const toggleSupStudentSort = (key: Exclude<StudentSortKey, 'default' | 'debtAmount'>) => {
    if (stSortBy === key) {
      setStSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setStSortBy(key);
      setStSortDir('asc');
    }
  };

  const renderSupSortIcon = (key: Exclude<StudentSortKey, 'default' | 'debtAmount'>) => {
    if (stSortBy !== key) return <ArrowUpDown className="w-3.5 h-3.5 opacity-45 shrink-0" />;
    return stSortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
    );
  };

  const hasActiveSupStudentFilters =
    Boolean(stQuery.trim()) ||
    Boolean(stNameFilter.trim()) ||
    Boolean(stNationalIdFilter.trim()) ||
    Boolean(stStudentIdFilter.trim()) ||
    Boolean(stLocationFilter.trim()) ||
    stFieldFilter !== 'all' ||
    stEntryFilter !== 'all' ||
    stDormFilter !== 'all' ||
    Boolean(stRoomFilter.trim()) ||
    stAssignFilter !== 'all' ||
    stProfileFilter !== 'all' ||
    stSortBy !== 'default';

  const resetSupStudentFilters = () => {
    setStQuery('');
    setStNameFilter('');
    setStNationalIdFilter('');
    setStStudentIdFilter('');
    setStLocationFilter('');
    setStFieldFilter('all');
    setStEntryFilter('all');
    setStDormFilter('all');
    setStRoomFilter('');
    setStAssignFilter('all');
    setStProfileFilter('all');
    setStSortBy('default');
    setStSortDir('asc');
  };

  // دانشجویان با تخصیص موقت در این خوابگاه
  const pendingStudentsInMyDorm = students.filter(
    (s) =>
      s.assignedBedId &&
      s.assignmentStatus === 'temporary' &&
      activeDormIds.includes(s.assignedDormId || '')
  );
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [supConfirmDialog, setSupConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    isPositive?: boolean;
    onConfirm: () => void;
  } | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{
    studentId: string;
    reason: string;
  } | null>(null);

  const handleBulkApprove = () => {
    if (pendingStudentsInMyDorm.length === 0) return;
    setSupConfirmDialog({
      title: 'تأیید دسته‌جمعی اسکان موقت',
      message: `آیا از تأیید دسته‌جمعی درخواست‌های اسکان موقت (${pendingStudentsInMyDorm.length} دانشجو) اطمینان دارید؟`,
      confirmLabel: 'تأیید دسته‌جمعی',
      isPositive: true,
      onConfirm: () => {
        const res = Storage.bulkConfirmAllAssignments(activeDormIds);
        setActionFeedback(res.message);
        onRefreshData();
        setTimeout(() => setActionFeedback(null), 4000);
      },
    });
  };

  const handleConfirmSingle = (studentId: string) => {
    const res = Storage.confirmStudentAssignment(studentId);
    setActionFeedback(res.message);
    onRefreshData();
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleRejectSingle = (studentId: string) => {
    setRejectDialog({
      studentId,
      reason: 'عدم تطابق با شرایط سرا یا تغییر برنامه اسکان',
    });
  };

  const handleResolveWarning = (warningId: string) => {
    Storage.resolveWarning(warningId);
    onRefreshData();
  };

  // وظایف تأسیساتی سراهای این سرپرست
  const allTasks = maintenanceTasks || Storage.getMaintenanceTasks();
  const allStaff = (maintenanceStaff || Storage.getMaintenanceStaff()).filter(
    (s) => s.status === 'active' || s.isActive !== false
  );
  const myMaintenanceTasks = allTasks.filter(
    (t) => activeDormIds.includes(t.dormId) || (selectedDormId === 'all' && myAssignedDormIds.includes(t.dormId))
  );
  const activeMaintTasksCount = myMaintenanceTasks.filter(
    (t) => t.status !== 'resolved' && t.status !== 'closed' && t.status !== 'cancelled'
  ).length;

  const handleCreateDirectMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintTitle.trim() || !maintDormId) return;

    const dormObj = dorms.find((d) => d.id === maintDormId);
    const dormName = dormObj ? dormObj.name : 'سرای دانشجویی';
    const staffObj = allStaff.find((s) => s.id === maintStaffId);

    const res = Storage.addMaintenanceTask({
      title: maintTitle.trim(),
      description: maintDesc.trim(),
      dormId: maintDormId,
      dormName,
      roomNumber: maintRoomNumber.trim() || undefined,
      locationDetails: maintRoomNumber.trim() ? `اتاق ${maintRoomNumber.trim()}` : undefined,
      priority: maintPriority,
      category: maintCategory,
      source: 'supervisor_direct',
      createdById: supervisor.id,
      createdByName: supervisor.fullName,
      createdByRole: 'supervisor',
      assignedToStaffId: staffObj?.id,
      assignedToStaffName: staffObj?.fullName,
      status: staffObj?.id ? 'assigned' : 'pending',
    });

    setMaintFeedback(`خرابی تأسیسات با کد رهگیری ${res.task.trackingCode} با موفقیت ثبت و ارجاع گردید.`);
    setMaintTitle('');
    setMaintDesc('');
    setMaintRoomNumber('');
    setIsAddMaintenanceModalOpen(false);
    onRefreshData();
    setTimeout(() => setMaintFeedback(null), 4000);
  };

  const handleVerifyResolvedTask = (taskId: string) => {
    Storage.updateMaintenanceTask(taskId, {
      supervisorVerified: true,
      supervisorVerifiedAt: new Date().toLocaleDateString('fa-IR'),
    });
    setMaintFeedback('رفع نقص تأسیساتی با موفقیت توسط سرپرست تأیید گردید.');
    onRefreshData();
    setTimeout(() => setMaintFeedback(null), 3000);
  };

  const handleSupervisorAssignTech = (taskId: string, staffId: string) => {
    const staffObj = allStaff.find((s) => s.id === staffId);
    if (!staffObj) return;
    Storage.updateMaintenanceTask(taskId, {
      assignedToStaffId: staffObj.id,
      assignedToStaffName: staffObj.fullName,
      status: 'assigned',
      assignedAt: new Date().toLocaleDateString('fa-IR'),
    });
    setMaintFeedback(`مأموریت با موفقیت به «${staffObj.fullName}» تخصیص داده شد.`);
    onRefreshData();
    setTimeout(() => setMaintFeedback(null), 3000);
  };

  const handleCreateShiftReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repInspections.trim() || !repHandover.trim()) {
      setActionFeedback('خطا: لطفاً خلاصه بازرسی و نکات تحویل به شیفت بعد را وارد فرمایید.');
      setTimeout(() => setActionFeedback(null), 4000);
      return;
    }
    const targetDorm = dorms.find((d) => d.id === (repShiftDormId || currentDorm?.id));
    const dormName = targetDorm ? targetDorm.name : (currentDorm?.name || 'سراهای دانشجویی');

    Storage.addShiftReport({
      supervisorId: supervisor.id,
      supervisorName: supervisor.fullName,
      dormId: targetDorm?.id || currentDorm?.id || 'all',
      dormName,
      shiftDate: repShiftDate.trim() || new Date().toLocaleDateString('fa-IR'),
      shiftType: repShiftType,
      shiftTime: repShiftTime.trim() || undefined,
      inspectionsSummary: repInspections.trim(),
      incidentsSummary: repIncidents.trim() || undefined,
      handoverNotes: repHandover.trim(),
      presentStudentCount: Number(repStudentCount) || undefined,
    });

    setActionFeedback('گزارش شیفت و وقایع روزانه با موفقیت در دفتر وقایع ثبت شد و در دسترس همه سرپرستان قرار گرفت.');
    setIsAddShiftReportModalOpen(false);
    setRepInspections('');
    setRepIncidents('');
    setRepHandover('');
    onRefreshData();
    setTimeout(() => setActionFeedback(null), 3500);
  };

  return (
    <div className="space-y-6">

      <RoomWarningModal
        isOpen={isWarningModalOpen}
        onClose={() => setIsWarningModalOpen(false)}
        dorms={myDorms.length > 0 ? myDorms : dorms}
        rooms={rooms}
        supervisorName={supervisor.fullName}
        onWarningAdded={onRefreshData}
      />

      <StudentEvaluationModal
        isOpen={isStudentEvalModalOpen}
        onClose={() => {
          setIsStudentEvalModalOpen(false);
          setEvalTargetStudent(null);
        }}
        students={students}
        dorms={myDorms.length > 0 ? myDorms : dorms}
        rooms={rooms}
        initialStudent={evalTargetStudent}
        evaluatorName={supervisor.fullName}
        evaluatorRole="supervisor"
        onSaved={() => {
          setEvalRefreshTick((t) => t + 1);
          onRefreshData();
        }}
      />

      {/* بنر سرپرستی و آمار */}
      {!embeddedMode ? (
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-teal-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
                <Building2 className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-teal-300">پنل مدیریت سرپرستی سرا</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">{supervisor.fullName}</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              سراهای تحت نظارت ({myDorms.length} سرا):{' '}
              <span className="font-bold text-teal-200">
                {myDorms.map((d) => d.name).join(' • ')}
              </span>
            </p>
          </div>

          {/* شاخص‌های آماری سرا */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs text-center border border-white/10">
              <span className="block text-[11px] text-teal-200">کل ظرفیت تخت‌ها</span>
              <span className="text-lg font-black text-white">{totalBeds}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs text-center border border-white/10">
              <span className="block text-[11px] text-teal-200">تخت‌های اشغال شده</span>
              <span className="text-lg font-black text-white">{occupiedBeds}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs text-center border border-white/10">
              <span className="block text-[11px] text-emerald-300">تخت‌های خالی</span>
              <span className="text-lg font-black text-emerald-400">{vacantBeds}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs text-center border border-white/10">
              <span className="block text-[11px] text-teal-200">درصد اشغال</span>
              <span className="text-lg font-black text-teal-300">٪{occupancyRate}</span>
            </div>
          </div>
        </div>

        {/* نوار انتخاب سرا در صورتی که سرپرست چند سرا داشته باشد */}
        {myDorms.length > 1 && (
          <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-teal-200">انتخاب سرا جهت مدیریت:</span>
            <button
              onClick={() => setSelectedDormId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedDormId === 'all'
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-teal-100'
              }`}
            >
              همه سراهای من ({myDorms.length} سرا)
            </button>
            {myDorms.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDormId(d.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedDormId === d.id
                    ? 'bg-teal-500 text-white shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-teal-100'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        )}

        {/* دکمه‌های اقدام سریع */}
        <div className="flex flex-wrap items-center gap-2.5 mt-6 pt-5 border-t border-white/10">
          <button
            onClick={() => setIsWarningModalOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>اعلام اخطار به اتاق</span>
          </button>

          <button
            onClick={() => {
              setEvalTargetStudent(null);
              setIsStudentEvalModalOpen(true);
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>تذکر / نمره ارزیابی دانشجو</span>
          </button>

          <button
            onClick={onOpenReports}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-600/20 cursor-pointer"
          >
            <BarChart3 className="w-4 h-4" />
            <span>گزارش تخت‌های خالی و آمار</span>
          </button>

          <button
            onClick={onOpenMessages}
            className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>صندوق پیام‌ها و تیکت‌ها</span>
          </button>

          {onOpenUserGuide && (
            <button
              onClick={() => onOpenUserGuide('supervisor')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
              title="مشاهده و چاپ دفترچه راهنمای جامع سرپرست سرا (PDF)"
            >
              <BookOpen className="w-4 h-4" />
              <span>راهنمای سرپرست (PDF)</span>
            </button>
          )}

          <button
            onClick={() => {
              setMaintDormId(selectedDormId === 'all' ? (myDorms[0]?.id || '') : selectedDormId);
              setMaintStaffId(allStaff[0]?.id || '');
              setIsAddMaintenanceModalOpen(true);
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer"
          >
            <Wrench className="w-4 h-4" />
            <span>ثبت خرابی تأسیسات</span>
          </button>

          <button
            onClick={() => setIsSendSecurityModalOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
            title="ارسال گزارش مستقیم برای یک یا چند دانشجو به واحد حراست و انتظامات"
          >
            <Shield className="w-4 h-4" />
            <span>گزارش به حراست</span>
          </button>
        </div>
      </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
          {myDorms.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">انتخاب سرا جهت مدیریت:</span>
              <button
                onClick={() => setSelectedDormId('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedDormId === 'all'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                همه سراها ({myDorms.length} سرا)
              </button>
              {myDorms.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDormId(d.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedDormId === d.id
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsWarningModalOpen(true)}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>اعلام اخطار به اتاق</span>
            </button>
            <button
              onClick={() => {
                setEvalTargetStudent(null);
                setIsStudentEvalModalOpen(true);
              }}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span>تذکر / نمره ارزیابی دانشجو</span>
            </button>
            <button
              onClick={() => {
                setMaintDormId(selectedDormId === 'all' ? (myDorms[0]?.id || '') : selectedDormId);
                setMaintStaffId(allStaff[0]?.id || '');
                setIsAddMaintenanceModalOpen(true);
              }}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>ثبت خرابی تأسیسات</span>
            </button>
            <button
              onClick={() => setIsSendSecurityModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>گزارش به حراست</span>
            </button>
          </div>
        </div>
      )}

      {/* پیام بازخورد تأیید یا رد */}
      {actionFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* بخش درخواست‌های اسکان موقت در خوابگاه تحت نظارت (به‌صورت دکمه بازشونده) */}
      {pendingStudentsInMyDorm.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-300 dark:border-amber-800 shadow-xs overflow-hidden">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsPendingApprovalsOpen((p) => !p)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsPendingApprovalsOpen((p) => !p);
              }
            }}
            className="w-full px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                    درخواست‌های انتخاب اتاق موقت نیازمند تأیید سرپرستی
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                    {pendingStudentsInMyDorm.length.toLocaleString('fa-IR')} مورد
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isPendingApprovalsOpen
                    ? 'برای بستن فهرست درخواست‌ها دوباره کلیک کنید'
                    : 'برای مشاهده و تأیید درخواست‌های اسکان موقت کلیک کنید'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBulkApprove();
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                title="تأیید قطعی همه درخواست‌های این سرا"
              >
                <CheckCheck className="w-4 h-4" />
                <span>تأیید همه ({pendingStudentsInMyDorm.length})</span>
              </button>
              <span className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                {isPendingApprovalsOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </span>
            </div>
          </div>

          {isPendingApprovalsOpen && (
            <div className="p-5 pt-4 space-y-2.5 border-t border-amber-200/70 dark:border-amber-800/70">
              {pendingStudentsInMyDorm.map((st) => {
                const room = st.assignedRoomId ? roomLookupMap.get(st.assignedRoomId) : undefined;
                const bed = st.assignedBedId ? bedLookupMap.get(st.assignedBedId) : undefined;

                return (
                  <div
                    key={st.studentId}
                    className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {st.photoUrl ? (
                        <img src={st.photoUrl} alt={st.fullName} loading="lazy" decoding="async" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
                          style={{ backgroundColor: st.avatarColor || '#0d9488' }}
                        >
                          {st.fullName.slice(0, 1)}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{st.fullName}</div>
                        <div className="text-[10px] text-slate-500">
                          کد دانشجویی: {st.studentId} • {st.fieldOfStudy} • ورودی {st.entryTerm} • {st.city}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200/50">
                      <div className="text-left sm:text-right">
                        <span className="font-bold text-teal-700 dark:text-teal-300 block">
                          اتاق {room?.roomNumber || '—'}
                        </span>
                        <span className="text-[10px] text-slate-400">{bed?.label || '—'}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleConfirmSingle(st.studentId)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>تأیید قطعی</span>
                        </button>
                        <button
                          onClick={() => handleRejectSingle(st.studentId)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-rose-200 dark:border-rose-900"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>رد</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* منوی دسته‌بندی‌شده و بازشونده بخش‌های کارتابل سرپرستی */}
      {(() => {
        const activeWarningsCount = warnings.filter((w) => !w.resolved).length;
        const pendingGuestsCount = Storage.getGuestRequests().filter(
          (g) => activeDormIds.includes(g.dormId) && g.status === 'pending_supervisor'
        ).length;
        const pendingWarehouseCount = Storage.getWarehouseRequests().filter(
          (r) =>
            (selectedDormId === 'all' || r.dormId === selectedDormId) &&
            r.status === 'pending_supervisor'
        ).length;
        const shiftReportsCount = Storage.getShiftReports().length;
        const pendingClearanceCount = Storage.getGraduationClearances().filter(
          (c) => c.educationGateStatus === 'approved' && c.status === 'in_clearance' && (c.units?.supervisor?.status || 'pending') === 'pending'
        ).length;

        return (
          <CollapsibleMenuGrid
            title="منوی بخش‌های سرپرستی سراها (با کلیک باز و با کلیک مجدد بسته می‌شود)"
            activeKey={activeTab}
            onToggle={(tab) => setActiveTab((prev) => (prev === tab ? null : tab))}
            onCloseActive={() => setActiveTab(null)}
            categories={[
              {
                title: 'امور اسکان، اتاق‌ها و مهمان',
                items: [
                  {
                    id: 'manager',
                    label: 'مدیریت اتاق‌ها، جابجایی و نماینده',
                    subtitle: 'تخصیص تخت، انتقال دانشجو و تعیین نماینده اتاق',
                    icon: <Building2 className="w-4 h-4" />,
                    activeClass: 'bg-teal-600 text-white border-teal-600 shadow-md',
                  },
                  {
                    id: 'visual_picker',
                    label: 'نقشه بصری چیدمان تخت‌ها',
                    subtitle: 'نمای گرافیکی ظرفیت و اشغال تخت‌های سرا',
                    icon: <BedIcon className="w-4 h-4" />,
                    activeClass: 'bg-teal-600 text-white border-teal-600 shadow-md',
                  },
                  {
                    id: 'guest_requests',
                    label: 'درخواست‌های مهمان',
                    subtitle: 'بررسی و تأیید پذیرش مهمان در اتاق‌ها',
                    icon: <UserPlus className="w-4 h-4" />,
                    badge: pendingGuestsCount,
                    badgeTone: 'rose',
                    activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-md',
                  },
                ],
              },
              {
                title: 'دانشجویان، انضباط و تسویه حساب',
                items: [
                  {
                    id: 'students',
                    label: 'فهرست دانشجویان و تماس ضروری',
                    subtitle: 'جستجوی پیشرفته و مشخصات ساکنین',
                    icon: <Users className="w-4 h-4" />,
                    badge: students.length,
                    badgeTone: 'teal',
                    activeClass: 'bg-teal-600 text-white border-teal-600 shadow-md',
                  },
                  {
                    id: 'announcements',
                    label: 'اطلاعیه‌ها، اخطارها و ارزیابی‌ها',
                    subtitle: 'مشاهده اخطارهای فعال اتاق‌ها و تذکرات فردی',
                    icon: <ShieldAlert className="w-4 h-4" />,
                    badge: activeWarningsCount,
                    badgeTone: 'rose',
                    activeClass: 'bg-rose-600 text-white border-rose-600 shadow-md',
                  },
                  {
                    id: 'clearance',
                    label: 'تسویه حساب فارغ‌التحصیلان',
                    subtitle: 'بررسی و تأیید تسویه خوابگاهی دانشجویان',
                    icon: <GraduationCap className="w-4 h-4" />,
                    badge: pendingClearanceCount,
                    badgeTone: 'rose',
                    activeClass: 'bg-sky-700 text-white border-sky-700 shadow-md',
                  },
                ],
              },
              {
                title: 'تأسیسات، انبار و گزارش شیفت‌ها',
                items: [
                  {
                    id: 'maintenance',
                    label: 'تأسیسات و تعمیرات سرا',
                    subtitle: 'ثبت و پیگیری خرابی‌های فنی اتاق‌ها',
                    icon: <Wrench className="w-4 h-4" />,
                    badge: activeMaintTasksCount,
                    badgeTone: 'rose',
                    activeClass: 'bg-amber-600 text-white border-amber-600 shadow-md',
                  },
                  {
                    id: 'warehouse',
                    label: 'تأییدیه قطعات و حواله انبار',
                    subtitle: 'بررسی درخواست‌های قطعات و تجهیزات انبار',
                    icon: <Boxes className="w-4 h-4" />,
                    badge: pendingWarehouseCount,
                    badgeTone: 'amber',
                    activeClass: 'bg-violet-600 text-white border-violet-600 shadow-md',
                  },
                  {
                    id: 'shifts',
                    label: 'دفتر وقایع و گزارش شیفت‌ها',
                    subtitle: 'ثبت گزارش تحویل شیفت و سوابق روزانه',
                    icon: <Clock className="w-4 h-4" />,
                    badge: shiftReportsCount,
                    badgeTone: 'teal',
                    activeClass: 'bg-teal-700 text-white border-teal-700 shadow-md',
                  },
                ],
              },
            ]}
          />
        );
      })()}

      {/* محتوای تب‌ها */}
      {activeTab === 'manager' && (
        <SupervisorRoomManager
          dorms={myDorms.length > 0 ? myDorms : dorms}
          rooms={rooms}
          beds={beds}
          students={students}
          settings={settings}
          onDataChanged={onRefreshData}
          supervisorDormId={selectedDormId}
          actorName={supervisor.fullName}
          actorRole="supervisor"
          actorId={supervisor.id}
        />
      )}

      {activeTab === 'visual_picker' && (
        <VisualBedPicker
          dorms={myDorms.length > 0 ? myDorms : dorms}
          rooms={rooms}
          beds={beds}
          students={students}
          settings={settings}
          onBedSelected={onRefreshData}
          isSupervisorMode={true}
          actorName={supervisor.fullName}
          actorRole="supervisor"
          actorId={supervisor.id}
        />
      )}

      {activeTab === 'announcements' && (
        <div className="space-y-6">
          {/* لیست اطلاعیه‌های فعال سرا (فقط قابل مشاهده توسط سرپرست؛ ثبت و انتشار اطلاعیه منحصراً در اختیار مدیر سامانه است) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  اطلاعیه‌های سراهای دانشجویی ({announcements.length})
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                ثبت و انتشار اطلاعیه‌ها منحصراً در اختیار مدیر سامانه است
              </span>
            </div>

            {announcements.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">هیچ اطلاعیه‌ای ثبت نشده است.</div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pl-1">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {ann.priority === 'urgent' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold">
                            فوری
                          </span>
                        ) : ann.priority === 'important' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold">
                            مهم
                          </span>
                        ) : null}
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{ann.title}</h4>
                      </div>
                    </div>

                    <RichTextDisplay
                      html={ann.contentHtml}
                      fallbackText={ann.content}
                      className="text-slate-600 dark:text-slate-300 leading-relaxed"
                      onImageClick={(src) => setPreviewAnnImage(src)}
                    />

                    {ann.imageUrl && (
                      <AnnouncementImageBox
                        src={ann.imageUrl}
                        alt={ann.title}
                        onClick={(src) => setPreviewAnnImage(src)}
                        maxWidthClass="max-w-md"
                        heightClass="h-44 sm:h-52"
                      />
                    )}

                    <div className="text-[10px] text-slate-400 pt-1 flex justify-between">
                      <span>صادرکننده: {ann.author}</span>
                      <span>تاریخ: {ann.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* اخطارها */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>فهرست اخطارها و تذکرات صادره برای اتاق‌ها</span>
            </h3>

            {warnings.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">هیچ اخطاری ثبت نشده است.</div>
            ) : (
              <div className="space-y-3">
                {warnings.map((warn) => {
                  const r = rooms.find((rm) => rm.id === warn.roomId);
                  const d = dorms.find((dm) => dm.id === warn.dormId);

                  return (
                    <div
                      key={warn.id}
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        warn.resolved
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 opacity-70'
                          : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            اتاق {r?.roomNumber} ({d?.name})
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                              warn.resolved ? 'bg-slate-200 text-slate-600' : 'bg-rose-600 text-white'
                            }`}
                          >
                            {warn.resolved ? 'برطرف شده' : 'فعال'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{warn.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{warn.description}</p>
                        <span className="text-[10px] text-slate-400 mt-2 block">
                          ثبت توسط: {warn.supervisorName} • {warn.date}
                        </span>
                      </div>

                      {!warn.resolved && (
                        <button
                          onClick={() => handleResolveWarning(warn.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 self-start sm:self-center transition"
                        >
                          ثبت رفع تخلف و بستن اخطار
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* تذکرات، اخطارها و ارزیابی‌های فردی و اتاق دانشجویان */}
          {(() => {
            void evalRefreshTick;
            const myDormIds = (myDorms.length > 0 ? myDorms : dorms).map((d) => d.id);
            const studentEvals: StudentEvaluation[] = Storage.getStudentEvaluations().filter(
              (ev) => !ev.dormId || myDormIds.includes(ev.dormId)
            );
            return (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <span>تذکرات، اخطارها و نمرات ارزیابی دانشجویان ({studentEvals.length})</span>
                  </h3>
                  <button
                    onClick={() => {
                      setEvalTargetStudent(null);
                      setIsStudentEvalModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ثبت مورد جدید</span>
                  </button>
                </div>

                {studentEvals.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    هنوز تذکر یا نمره ارزیابی فردی/اتاقی برای دانشجویان ثبت نشده است.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {studentEvals.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
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
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">
                              {ev.scope === 'room' ? 'اتاق' : 'فردی'}
                            </span>
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                              {ev.studentName} ({ev.studentId})
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{ev.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{ev.description}</div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            ثبت توسط: {ev.evaluatorName} • {ev.date}
                          </div>
                        </div>

                        {(ev.type === 'notice' || ev.type === 'warning') && !ev.resolved && (
                          <button
                            onClick={() => {
                              Storage.resolveStudentEvaluation(ev.id);
                              setEvalRefreshTick((t) => t + 1);
                              onRefreshData();
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                          >
                            ثبت رفع مورد
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === 'students' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                <span>
                  فهرست دانشجومعلمان و مشخصات تماس اضطراری ({sortedTabStudents.length} از {students.length} دانشجو)
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                جستجوی پیشرفته بر اساس نام و نام خانوادگی، کد ملی، کد دانشجویی، شهر و استان، رشته، ورودی، سرا و اتاق
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenReports}
              className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer self-start sm:self-auto"
            >
              مشاهده گزارش و خروجی اکسل
            </button>
          </div>

          {/* پنل جستجوی پیشرفته و مرتب‌سازی دانشجویان */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="جستجوی فوری در نام و نام خانوادگی، کد ملی، کد دانشجویی، شهر و استان، رشته، ورودی یا تماس..."
                  value={stQuery}
                  onChange={(e) => setStQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pr-9 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-teal-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>

              <button
                type="button"
                onClick={() => setShowAdvancedStudentFilters((v) => !v)}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  showAdvancedStudentFilters
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>فیلترهای پیشرفته</span>
              </button>

              {hasActiveSupStudentFilters && (
                <button
                  type="button"
                  onClick={resetSupStudentFilters}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold hover:bg-rose-100 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>پاک کردن فیلترها</span>
                </button>
              )}
            </div>

            {showAdvancedStudentFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-700/70 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    نام و نام خانوادگی:
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً رضایی یا علی"
                    value={stNameFilter}
                    onChange={(e) => setStNameFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    کد دانشجویی:
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً 4021..."
                    value={stStudentIdFilter}
                    onChange={(e) => setStStudentIdFilter(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-right font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    کد ملی:
                  </label>
                  <input
                    type="text"
                    placeholder="شماره ملی دانشجو"
                    value={stNationalIdFilter}
                    onChange={(e) => setStNationalIdFilter(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-right font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    استان و شهر سکونت:
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً اصفهان، کاشان، شهرضا..."
                    value={stLocationFilter}
                    onChange={(e) => setStLocationFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    رشته تحصیلی:
                  </label>
                  <select
                    value={stFieldFilter}
                    onChange={(e) => setStFieldFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="all">همه رشته‌ها ({uniqueStudentFields.length})</option>
                    {uniqueStudentFields.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    دوره / سال ورودی:
                  </label>
                  <select
                    value={stEntryFilter}
                    onChange={(e) => setStEntryFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="all">همه ورودی‌ها ({uniqueStudentEntryTerms.length})</option>
                    {uniqueStudentEntryTerms.map((term) => (
                      <option key={term} value={term}>
                        ورودی {term}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    سرای محل اسکان:
                  </label>
                  <select
                    value={stDormFilter}
                    onChange={(e) => setStDormFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="all">همه سراها و فاقد اسکان</option>
                    {myDorms.length > 0 && <option value="my_dorms">فقط سراهای تحت نظارت من</option>}
                    <option value="unassigned">فقط دانشجویان فاقد اسکان</option>
                    {dorms.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      شماره اتاق:
                    </label>
                    <input
                      type="text"
                      placeholder="مثلاً ۱۰۱"
                      value={stRoomFilter}
                      onChange={(e) => setStRoomFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      وضعیت اسکان:
                    </label>
                    <select
                      value={stAssignFilter}
                      onChange={(e) => setStAssignFilter(e.target.value as any)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="all">همه</option>
                      <option value="confirmed">قطعی</option>
                      <option value="temporary">موقت</option>
                      <option value="none">فاقد اتاق</option>
                    </select>
                  </div>
                </div>

                {/* کنترل‌های مرتب‌سازی و وضعیت پرونده */}
                <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center justify-between gap-2.5 pt-2.5 mt-1 border-t border-slate-200/70 dark:border-slate-700/70">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
                      <ArrowUpDown className="w-3.5 h-3.5 text-teal-600" />
                      <span>مرتب‌سازی بر اساس:</span>
                    </span>
                    <select
                      value={stSortBy}
                      onChange={(e) => setStSortBy(e.target.value as StudentSortKey)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="default">ترتیب پیش‌فرض ثبت</option>
                      <option value="lastName">نام خانوادگی</option>
                      <option value="fullName">نام و نام خانوادگی (کامل)</option>
                      <option value="studentId">کد دانشجویی</option>
                      <option value="nationalId">کد ملی</option>
                      <option value="fieldOfStudy">رشته تحصیلی</option>
                      <option value="entryTerm">سال / ترم ورودی</option>
                      <option value="roomName">نام / شماره اتاق</option>
                      <option value="cityProvince">استان و شهر سکونت</option>
                    </select>

                    {stSortBy !== 'default' && (
                      <button
                        type="button"
                        onClick={() => setStSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                        className="px-3 py-1.5 rounded-xl border border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-900/50 transition"
                      >
                        {stSortDir === 'asc' ? (
                          <>
                            <ArrowUp className="w-3.5 h-3.5" />
                            <span>صعودی (الف←ی / کم←زیاد)</span>
                          </>
                        ) : (
                          <>
                            <ArrowDown className="w-3.5 h-3.5" />
                            <span>نزولی (ی←الف / زیاد←کم)</span>
                          </>
                        )}
                      </button>
                    )}

                    <select
                      value={stProfileFilter}
                      onChange={(e) => setStProfileFilter(e.target.value as any)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold"
                    >
                      <option value="all">همه پرونده‌ها</option>
                      <option value="completed">پرونده تکمیل‌شده</option>
                      <option value="incomplete">پرونده ناقص</option>
                    </select>
                  </div>

                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    نکته: با کلیک بر روی <strong className="text-teal-700 dark:text-teal-300">نام هر دانشجو</strong>، فرم کامل اطلاعات، عکس، اخطار، تذکر، پیام و ارزیابی باز می‌شود.
                  </span>
                </div>
              </div>
            )}
          </div>

          {sortedTabStudents.length === 0 ? (
            <div className="p-10 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-400 space-y-2">
              <p>هیچ دانشجویی با معیارهای جستجوی انتخاب‌شده یافت نشد.</p>
              {hasActiveSupStudentFilters && (
                <button
                  type="button"
                  onClick={resetSupStudentFilters}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 text-white font-bold cursor-pointer"
                >
                  نمایش همه دانشجویان
                </button>
              )}
            </div>
          ) : (() => {
            const { safePage: safeSupPage, startIndex: supStartIdx, endIndex: supEndIdx } =
              getPaginationMeta(sortedTabStudents.length, studentCurrentPage, studentPageSize);
            const paginatedTabStudents =
              studentPageSize === 'all'
                ? sortedTabStudents
                : sortedTabStudents.slice(supStartIdx, supEndIdx);

            return (
              <div className="space-y-3">
                <StudentListPaginationBar
                  totalItems={sortedTabStudents.length}
                  currentPage={safeSupPage}
                  pageSize={studentPageSize}
                  onPageChange={setStudentCurrentPage}
                  onPageSizeChange={setStudentPageSize}
                />
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3">
                      <button
                        type="button"
                        onClick={() => toggleSupStudentSort('studentId')}
                        className="inline-flex items-center gap-1 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer transition"
                        title="مرتب‌سازی بر اساس کد دانشجویی"
                      >
                        <span>کد دانشجویی</span>
                        {renderSupSortIcon('studentId')}
                      </button>
                    </th>
                    <th className="p-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => toggleSupStudentSort('lastName')}
                          className="inline-flex items-center gap-1 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer transition"
                          title="مرتب‌سازی بر اساس نام خانوادگی"
                        >
                          <span>نام و نام خانوادگی</span>
                          {renderSupSortIcon('lastName')}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSupStudentSort('lastName')}
                          className={`text-[10px] px-1.5 py-0.5 rounded border cursor-pointer transition ${
                            stSortBy === 'lastName'
                              ? 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border-teal-300 dark:border-teal-700'
                              : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                          }`}
                        >
                          فامیلی
                        </button>
                      </div>
                    </th>
                    <th className="p-3">
                      <button
                        type="button"
                        onClick={() => toggleSupStudentSort('nationalId')}
                        className="inline-flex items-center gap-1 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer transition"
                        title="مرتب‌سازی بر اساس کد ملی"
                      >
                        <span>کد ملی</span>
                        {renderSupSortIcon('nationalId')}
                      </button>
                    </th>
                    <th className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => toggleSupStudentSort('fieldOfStudy')}
                          className="inline-flex items-center gap-1 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer transition"
                          title="مرتب‌سازی بر اساس رشته تحصیلی"
                        >
                          <span>رشته</span>
                          {renderSupSortIcon('fieldOfStudy')}
                        </button>
                        <span className="text-slate-300 dark:text-slate-600">/</span>
                        <button
                          type="button"
                          onClick={() => toggleSupStudentSort('entryTerm')}
                          className="inline-flex items-center gap-1 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer transition"
                          title="مرتب‌سازی بر اساس سال/ترم ورودی"
                        >
                          <span>ورودی</span>
                          {renderSupSortIcon('entryTerm')}
                        </button>
                      </div>
                    </th>
                    <th className="p-3">وضعیت پرونده</th>
                    <th className="p-3">
                      <button
                        type="button"
                        onClick={() => toggleSupStudentSort('roomName')}
                        className="inline-flex items-center gap-1 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer transition"
                        title="مرتب‌سازی بر اساس نام / شماره اتاق"
                      >
                        <span>سرا و اتاق/تخت</span>
                        {renderSupSortIcon('roomName')}
                      </button>
                    </th>
                    <th className="p-3">شماره همراه</th>
                    <th className="p-3">شماره اضطراری</th>
                    <th className="p-3">
                      <button
                        type="button"
                        onClick={() => toggleSupStudentSort('cityProvince')}
                        className="inline-flex items-center gap-1 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer transition"
                        title="مرتب‌سازی بر اساس استان و شهر سکونت"
                      >
                        <span>استان و شهر</span>
                        {renderSupSortIcon('cityProvince')}
                      </button>
                    </th>
                    <th className="p-3 text-center">عملیات / کارت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedTabStudents.map((st) => {
                    const d = dorms.find((dm) => dm.id === st.assignedDormId);
                    const r = rooms.find((rm) => rm.id === st.assignedRoomId);
                    const b = beds.find((bd) => bd.id === st.assignedBedId);

                    return (
                      <tr key={st.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-bold font-mono tabular-nums">{st.studentId}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {st.photoUrl ? (
                              <img
                                src={st.photoUrl}
                                alt={st.fullName}
                                loading="lazy"
                                decoding="async"
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0"
                                style={{ backgroundColor: st.avatarColor || '#0d9488' }}
                              >
                                {(st.fullName || 'د').slice(0, 1)}
                              </div>
                            )}
                            <div>
                              <button
                                type="button"
                                onClick={() => setProfileModalStudentId(st.studentId)}
                                className="font-bold text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 hover:underline text-right cursor-pointer"
                                title="مشاهده پرونده کامل، اخطار، تذکر، پیام و ارزیابی"
                              >
                                {st.fullName}
                              </button>
                              {st.fatherName && (
                                <div className="text-[10px] text-slate-400">فرزند {st.fatherName}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                          {st.nationalId || '-'}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {st.fieldOfStudy || '-'}
                          </div>
                          <div className="text-[11px] text-slate-400">ورودی {st.entryTerm || '-'}</div>
                        </td>
                        <td className="p-3">
                          {st.isProfileCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              تکمیل شده
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              ناقص
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {r && b ? (
                            <div>
                              <div className="text-teal-600 dark:text-teal-400 font-bold">
                                اتاق {r.roomNumber} ({b.tier === 'lower' ? 'پایین' : 'بالا'})
                              </div>
                              {d && <div className="text-[10px] text-slate-400">{d.name}</div>}
                            </div>
                          ) : (
                            <span className="text-slate-400">فاقد اتاق</span>
                          )}
                        </td>
                        <td className="p-3 font-mono tabular-nums" dir="ltr">
                          {st.mobile || '-'}
                        </td>
                        <td className="p-3 text-rose-600 font-mono tabular-nums" dir="ltr">
                          {st.emergencyPhone || '-'}
                        </td>
                        <td className="p-3">
                          {[st.province, st.city].filter(Boolean).join(' - ') || '-'}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEvalTargetStudent(st);
                                setIsStudentEvalModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 transition cursor-pointer"
                              title="ثبت تذکر، اخطار یا نمره ارزیابی دانشجو"
                            >
                              <Award className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setReferralTargetStudent(st)}
                              className="px-2 py-1 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-950/70 text-fuchsia-800 dark:text-fuchsia-300 hover:bg-fuchsia-100 border border-fuchsia-200 dark:border-fuchsia-800 transition cursor-pointer inline-flex items-center gap-1 text-[10px] font-extrabold"
                              title="ارجاع دانشجو به مشاور، امور دانشجویی یا حراست با ثبت گزارش"
                            >
                              <Send className="w-3.5 h-3.5 shrink-0" />
                              <span>ارجاع / گزارش</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewCardStudent(st)}
                              className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border border-teal-200 dark:border-teal-800 transition cursor-pointer"
                              title="مشاهده و چاپ کارت شناسایی و اسکان سرا"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <StudentListPaginationBar
              totalItems={sortedTabStudents.length}
              currentPage={safeSupPage}
              pageSize={studentPageSize}
              onPageChange={setStudentCurrentPage}
              onPageSizeChange={setStudentPageSize}
              showPageSizeSelector={false}
              compact
            />
          </div>
            );
          })()}
        </div>
      )}

      {/* تب تأسیسات و تعمیرات سرا */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* کارت آمار و خلاصه وضعیت تأسیسات این سرا */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] text-slate-400 block mb-1">کل گزارش‌های تأسیساتی</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">{myMaintenanceTasks.length}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 shadow-xs">
              <span className="text-[11px] text-amber-600 dark:text-amber-400 block mb-1">در حال اقدام یا تعمیر</span>
              <span className="text-xl font-black text-amber-600">
                {myMaintenanceTasks.filter((t) => t.status === 'in_progress').length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/40 shadow-xs">
              <span className="text-[11px] text-purple-600 dark:text-purple-400 block mb-1">در انتظار قطعه</span>
              <span className="text-xl font-black text-purple-600">
                {myMaintenanceTasks.filter((t) => t.status === 'parts_needed').length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mb-1">رفع عیب و تکمیل شده</span>
              <span className="text-xl font-black text-emerald-600">
                {myMaintenanceTasks.filter((t) => t.status === 'resolved' || t.status === 'closed').length}
              </span>
            </div>
          </div>

          {/* نوار جستجو و فیلترها و دکمه ثبت مستقیم */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="جستجو با کد رهگیری، شماره اتاق، عنوان یا نام دانشجو..."
                  value={maintSearchQuery}
                  onChange={(e) => setMaintSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <select
                value={maintStatusFilter}
                onChange={(e) => setMaintStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="pending">در انتظار تخصیص</option>
                <option value="assigned">ارجاع شده به تکنسین</option>
                <option value="in_progress">در حال تعمیر و اقدام</option>
                <option value="parts_needed">نیازمند تأمین قطعه</option>
                <option value="resolved">رفع نقص شده (نیازمند تأیید سرپرست)</option>
              </select>
            </div>

            <button
              onClick={() => {
                setMaintDormId(selectedDormId === 'all' ? (myDorms[0]?.id || '') : selectedDormId);
                setMaintStaffId(allStaff[0]?.id || '');
                setIsAddMaintenanceModalOpen(true);
              }}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ ثبت مستقیم خرابی توسط سرپرست</span>
            </button>
          </div>

          {/* پیام بازخورد عملیات تأسیساتی */}
          {maintFeedback && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{maintFeedback}</span>
            </div>
          )}

          {/* فهرست مأموریت‌های تأسیساتی */}
          {myMaintenanceTasks
            .filter((t) => {
              if (maintStatusFilter !== 'all' && t.status !== maintStatusFilter) return false;
              if (!maintSearchQuery.trim()) return true;
              const q = maintSearchQuery.toLowerCase();
              return (
                t.trackingCode.toLowerCase().includes(q) ||
                t.title.toLowerCase().includes(q) ||
                (t.roomNumber && t.roomNumber.includes(q)) ||
                (t.sourceStudentName && t.sourceStudentName.toLowerCase().includes(q)) ||
                (t.assignedToStaffName && t.assignedToStaffName.toLowerCase().includes(q))
              );
            })
            .length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              هیچ مورد تأسیساتی با فیلترهای انتخابی در این سرا یافت نشد.
            </div>
          ) : (
            <div className="space-y-3.5">
              {myMaintenanceTasks
                .filter((t) => {
                  if (maintStatusFilter !== 'all' && t.status !== maintStatusFilter) return false;
                  if (!maintSearchQuery.trim()) return true;
                  const q = maintSearchQuery.toLowerCase();
                  return (
                    t.trackingCode.toLowerCase().includes(q) ||
                    t.title.toLowerCase().includes(q) ||
                    (t.roomNumber && t.roomNumber.includes(q)) ||
                    (t.sourceStudentName && t.sourceStudentName.toLowerCase().includes(q)) ||
                    (t.assignedToStaffName && t.assignedToStaffName.toLowerCase().includes(q))
                  );
                })
                .map((task) => {
                  const assignedTech = allStaff.find((s) => s.id === task.assignedToStaffId);

                  return (
                    <div
                      key={task.id}
                      className={`p-5 rounded-3xl border transition shadow-xs ${
                        task.status === 'resolved'
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                          : task.priority === 'emergency'
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                          : task.status === 'in_progress'
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-white font-mono text-xs font-black">
                            {task.trackingCode}
                          </span>

                          {task.priority === 'emergency' && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                              اورژانسی و اضطراری
                            </span>
                          )}
                          {task.priority === 'urgent' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                              فوری
                            </span>
                          )}

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                              task.status === 'resolved'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : task.status === 'in_progress'
                                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                : task.status === 'parts_needed'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : task.status === 'assigned'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {task.status === 'resolved'
                              ? 'رفع نقص و انجام شده'
                              : task.status === 'in_progress'
                              ? 'در حال تعمیر و اقدام'
                              : task.status === 'parts_needed'
                              ? 'در انتظار تأمین قطعه'
                              : task.status === 'assigned'
                              ? 'ارجاع شده به تکنسین'
                              : 'در انتظار تعیین تکنسین'}
                          </span>

                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mr-1">
                            {task.dormName} {task.roomNumber ? `• اتاق ${task.roomNumber}` : ''}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400">
                          ثبت: {task.createdAt}
                        </div>
                      </div>

                      <div className="py-3">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>{task.title}</span>
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {task.description}
                        </p>
                      </div>

                      {/* گزارش فنی تکنسین یا قطعات مصرفی */}
                      {(task.actionNotes || task.partsReplaced) && (
                        <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-xs space-y-1 mb-3">
                          <span className="font-bold text-amber-900 dark:text-amber-200 block">
                            گزارش و یادداشت فنی تکنسین:
                          </span>
                          {task.actionNotes && (
                            <p className="text-slate-700 dark:text-slate-300">{task.actionNotes}</p>
                          )}
                          {task.partsReplaced && (
                            <p className="text-slate-500 text-[11px]">
                              قطعات مصرفی: {task.partsReplaced}
                              {task.estimatedCost ? ` (هزینه تقریبی: ${Number(task.estimatedCost).toLocaleString('fa-IR')} ریال)` : ''}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="pt-3 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-3">
                          {/* مشخصات منبع گزارش (دانشجو یا سرپرست) */}
                          {task.sourceStudentName ? (
                            <span className="text-slate-500">
                              گزارش‌دهنده: <strong className="text-slate-700 dark:text-slate-200">{task.sourceStudentName}</strong>
                              {task.sourceStudentPhone && ` (${task.sourceStudentPhone})`}
                            </span>
                          ) : (
                            <span className="text-slate-500">
                              ثبت توسط: <strong>{task.createdByName}</strong>
                            </span>
                          )}

                          {/* تکنسین مسئول یا امکان ارجاع مستقیم */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">تکنسین مسئول:</span>
                            <select
                              value={task.assignedToStaffId || ''}
                              onChange={(e) => handleSupervisorAssignTech(task.id, e.target.value)}
                              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="">انتخاب / تغییر تکنسین...</option>
                              {allStaff.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.fullName} ({s.specialty})
                                </option>
                              ))}
                            </select>

                            {assignedTech && (
                              <MaintenanceQuickCommButtons
                                technician={assignedTech}
                                contextNote={task.title}
                              />
                            )}
                          </div>
                        </div>

                        {/* دکمه‌های اقدام سرپرست */}
                        <div className="flex items-center gap-2 self-end md:self-auto">
                          {task.status === 'resolved' && (
                            task.supervisorVerified ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl font-bold text-xs">
                                <CheckCircle className="w-3.5 h-3.5" />
                                تأیید شده توسط سرپرست
                              </span>
                            ) : (
                              <button
                                onClick={() => handleVerifyResolvedTask(task.id)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                تأیید نهایی رفع عیب
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* تب تأییدیه و کارتابل حواله‌های انبار برای سرپرست */}
      {activeTab === 'warehouse' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* آمار درخواست‌های انبار این سرا */}
          {(() => {
            const allReqs = Storage.getWarehouseRequests().filter(
              (r) => selectedDormId === 'all' || r.dormId === selectedDormId
            );
            const pendingSup = allReqs.filter((r) => r.status === 'pending_supervisor');
            const pendingWh = allReqs.filter((r) => r.status === 'pending_warehouse');
            const referredProc = allReqs.filter((r) => r.status === 'referred_to_procurement');
            const issued = allReqs.filter((r) => r.status === 'issued');
            const totalCost = issued.reduce((sum, r) => sum + (r.totalCost || 0), 0);

            return (
              <>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-teal-600" />
                      <span>بخش انبار، حواله‌ها و تأییدیه اقلام سرای دانشجویی</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      بررسی و تأیید درخواست‌های تکنسین‌ها یا ثبت مستقیم درخواست کالا و ملزومات از انبار مرکزی
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('cfuis:open-warehouse-request'))}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center gap-2 shadow-sm transition cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <PackagePlus className="w-4 h-4" />
                    <span>ثبت درخواست از انبار</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 shadow-xs">
                    <span className="text-[11px] text-amber-600 block mb-1 font-bold">نیازمند تأیید سرپرست</span>
                    <span className="text-xl font-black text-amber-600">{pendingSup.length}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">درخواست‌های تکنسین‌ها</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-900/40 shadow-xs">
                    <span className="text-[11px] text-violet-600 block mb-1 font-bold">در انتظار تحویل انبار</span>
                    <span className="text-xl font-black text-violet-600">{pendingWh.length}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">تأییدشده و در دست انباردار</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/40 shadow-xs">
                    <span className="text-[11px] text-orange-600 block mb-1 font-bold">ارجاع به کارپرداز</span>
                    <span className="text-xl font-black text-orange-600">{referredProc.length}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">در حال خرید و تأمین</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
                    <span className="text-[11px] text-emerald-600 block mb-1 font-bold">تحویل‌شده و بسته</span>
                    <span className="text-xl font-black text-emerald-600">{issued.length}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">اقلام دریافت‌شده سرا</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-slate-500 block mb-1 font-bold">هزینه فاکتور اقلام</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white truncate">
                      {Number(totalCost).toLocaleString('fa-IR')} ریال
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">مجموع خروجی انبار</span>
                  </div>
                </div>

                {/* فهرست درخواست‌های قطعه */}
                {allReqs.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                      هیچ درخواست قطعه‌ای برای این سرا ثبت نشده است.
                    </h4>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allReqs.map((req) => {
                      const isPendingSup = req.status === 'pending_supervisor';
                      const isPendingWh = req.status === 'pending_warehouse';
                      const isReferredProc = req.status === 'referred_to_procurement';
                      const isIssued = req.status === 'issued';

                      return (
                        <div
                          key={req.id}
                          className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition shadow-xs flex flex-col justify-between ${
                            isPendingSup
                              ? 'border-amber-400 ring-2 ring-amber-400/20'
                              : isReferredProc
                              ? 'border-orange-300 dark:border-orange-800'
                              : isIssued
                              ? 'border-emerald-200 dark:border-emerald-900/60'
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-violet-50 text-violet-700 border border-violet-200">
                                {req.requestCode}
                              </span>
                              {isPendingSup ? (
                                <span className="text-[11px] px-2 py-0.5 rounded-xl bg-amber-100 text-amber-800 font-extrabold animate-pulse">
                                  در انتظار تأیید سرپرست
                                </span>
                              ) : isPendingWh ? (
                                <span className="text-[11px] px-2 py-0.5 rounded-xl bg-violet-100 text-violet-800 font-bold">
                                  ارجاع به انبار
                                </span>
                              ) : isReferredProc ? (
                                <span className="text-[11px] px-2 py-0.5 rounded-xl bg-orange-100 text-orange-800 font-bold">
                                  ارجاع به کارپرداز جهت خرید
                                </span>
                              ) : isIssued ? (
                                <span className="text-[11px] px-2 py-0.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                                  تحویل داده شد
                                </span>
                              ) : (
                                <span className="text-[11px] px-2 py-0.5 rounded-xl bg-rose-100 text-rose-800 font-bold">
                                  رد شده
                                </span>
                              )}
                            </div>

                            <h4 className="font-black text-sm text-slate-900 dark:text-white mb-2">
                              {req.itemTitle}
                            </h4>

                            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl text-xs space-y-1 mb-2">
                              <div className="flex justify-between">
                                <span className="text-slate-500">مقدار نیاز:</span>
                                <span className="font-bold text-violet-700">{req.quantityRequested} {req.unit}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">متقاضی:</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">{req.requestedByStaffName}</span>
                              </div>
                              {req.taskTrackingCode && (
                                <div className="flex justify-between text-amber-700 font-bold">
                                  <span>کد سفارش کار:</span>
                                  <span>{req.taskTrackingCode}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-[11px] text-slate-400">
                                <span>تاریخ ثبت:</span>
                                <span>{req.requestDate}</span>
                              </div>
                            </div>

                            {req.reason && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                <strong>علت نیاز: </strong>
                                {req.reason}
                              </p>
                            )}

                            {isReferredProc && (
                              <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-[11px] text-orange-800 dark:text-orange-200 mb-2">
                                به‌دلیل کمبود موجودی در انبار، توسط مسئول انبار به کارپرداز ارجاع شد تا خریداری و تحویل انبار گردد.
                              </div>
                            )}

                            {isIssued && (
                              <div className="p-2 rounded-xl bg-emerald-50 text-xs text-emerald-900 mb-2">
                                <div className="font-bold">تحویل قطعی: {req.issuedQuantity} {req.unit} به مبلغ {Number(req.totalCost || 0).toLocaleString('fa-IR')} ریال</div>
                                <div className="text-[10px] text-emerald-700">توسط: {req.issuedByStaffName} ({req.issuedAt})</div>
                              </div>
                            )}
                          </div>

                          {/* دکمه‌های اقدام سرپرست */}
                          {isPendingSup && (
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                              <button
                                onClick={() => {
                                  const res = Storage.approveWarehouseRequest(req.id, supervisor.fullName, 'تأیید سرپرست سرا جهت اقدام انبار');
                                  if (res.success) {
                                    onRefreshData();
                                  }
                                }}
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>تأیید و ارسال به انبار</span>
                              </button>

                              <button
                                onClick={() => {
                                  setRejectWarehouseReason('');
                                  setRejectWarehouseTarget({
                                    id: req.id,
                                    code: req.requestCode,
                                    title: req.itemTitle,
                                  });
                                }}
                                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>رد</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {rejectWarehouseTarget && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          رد درخواست قطعه {rejectWarehouseTarget.code}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setRejectWarehouseTarget(null)}
                          className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        قلم درخواستی: <strong>{rejectWarehouseTarget.title}</strong>
                      </p>
                      <textarea
                        rows={3}
                        value={rejectWarehouseReason}
                        onChange={(e) => setRejectWarehouseReason(e.target.value)}
                        placeholder="علت عدم تأیید درخواست را وارد نمایید..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setRejectWarehouseTarget(null)}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                        >
                          انصراف
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!rejectWarehouseReason.trim()) return;
                            Storage.rejectWarehouseRequest(rejectWarehouseTarget.id, rejectWarehouseReason.trim());
                            setRejectWarehouseTarget(null);
                            onRefreshData();
                          }}
                          disabled={!rejectWarehouseReason.trim()}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                        >
                          ثبت رد درخواست
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* تب بررسی و موافقت با درخواست‌های مهمان دانشجویان */}
      {activeTab === 'guest_requests' && (
        <SupervisorGuestRequestsPanel
          activeDormIds={activeDormIds}
          actorName={supervisor.fullName}
          onDataChanged={onRefreshData}
        />
      )}

      {/* تب دفتر وقایع، شیفت‌بندی و گزارشات شیفت سرپرستی */}
      {activeTab === 'shifts' && (
        <div className="space-y-6">
          {/* کارت وضعیت شیفت فعال این سرپرست */}
          {(() => {
            const mySchedules = Storage.getSupervisorEffectiveShifts(supervisor.id, supervisor.fullName);
            const isDefaultEveryDay = mySchedules.some((s) => s.isEveryDay);
            const allShiftReports = Storage.getShiftReports();

            // فیلتر کردن گزارش‌ها
            const filteredReports = allShiftReports.filter((r) => {
              if (repFilterDorm !== 'all' && r.dormId !== repFilterDorm) return false;
              if (repFilterSupervisor !== 'all' && r.supervisorId !== repFilterSupervisor) return false;
              if (repFilterType !== 'all' && r.shiftType !== repFilterType) return false;
              if (repSearchQuery.trim()) {
                const q = repSearchQuery.toLowerCase().trim();
                const text = `${r.reportCode} ${r.supervisorName} ${r.dormName} ${r.inspectionsSummary} ${r.incidentsSummary || ''} ${r.handoverNotes}`.toLowerCase();
                if (!text.includes(q)) return false;
              }
              return true;
            });

            const dayFaMap: Record<string, string> = {
              saturday: 'شنبه',
              sunday: 'یکشنبه',
              monday: 'دوشنبه',
              tuesday: 'سه‌شنبه',
              wednesday: 'چهارشنبه',
              thursday: 'پنج‌شنبه',
              friday: 'جمعه',
              all: 'تمام روزهای هفته',
            };

            const shiftFaMap: Record<string, string> = {
              morning: 'شیفت صبح',
              evening: 'شیفت عصر',
              night: 'شیفت شب',
              full_day: 'شیفت ۲۴ ساعته کامل',
            };

            const sortedMySchedules = [...mySchedules].sort((a, b) =>
              toEnDigitsCal(a.shiftDate || '9999/99/99').localeCompare(
                toEnDigitsCal(b.shiftDate || '9999/99/99')
              )
            );

            return (
              <>
                {/* بنر وضعیت شیفت و دکمه‌های اقدام سریع */}
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white shadow-xl border border-teal-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-300">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-white">
                          برنامه شیفت‌بندی ماهانه و دفتر وقایع سرپرستان
                        </h3>
                        <p className="text-xs text-teal-200/90">
                          سرپرست حاضر: <strong className="text-amber-300 font-bold">{supervisor.fullName}</strong> • سرا: {currentDorm?.name || 'همه سراها'}
                        </p>
                      </div>
                    </div>

                    {/* برچسب شیفت‌های ماهانه این سرپرست */}
                    <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-300">برنامه شیفت‌های ماهانه شما:</span>
                      {isDefaultEveryDay ? (
                        <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 font-bold flex items-center gap-1.5 shadow-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>حضور پیوسته (برنامه ماهانه مشخصی ثبت نشده است)</span>
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {sortedMySchedules.map((sch) => {
                            const wd = sch.shiftDate
                              ? getJalaliWeekdayLabelFromDate(sch.shiftDate)
                              : dayFaMap[sch.dayOfWeek] || sch.dayOfWeek;
                            const isNextDay = Boolean(
                              sch.endsNextDay || sch.shiftType === 'full_day' || sch.shiftType === 'night'
                            );
                            const nextDate =
                              sch.shiftDate && isNextDay ? addDaysToJalaliDate(sch.shiftDate, 1, 'fa') : '';
                            const timeText =
                              sch.startTime && sch.endTime
                                ? `${sch.startTime} تا ${sch.endTime}${isNextDay ? ' فردا' : ''}`
                                : '';
                            return (
                              <span
                                key={sch.id}
                                title={nextDate ? `تا تاریخ ${nextDate} ساعت ${sch.endTime || ''}` : sch.notes || ''}
                                className="px-2.5 py-1 rounded-lg bg-teal-700/60 text-teal-100 border border-teal-500/40 text-[11px] font-semibold flex items-center gap-1.5"
                              >
                                <span className="font-mono font-extrabold text-amber-200">
                                  {sch.shiftDate || wd}
                                </span>
                                {sch.shiftDate && wd && <span className="opacity-80">({wd})</span>}
                                <span>• {shiftFaMap[sch.shiftType] || sch.shiftType}</span>
                                {timeText && (
                                  <span className="font-mono text-teal-200 text-[10px]">({timeText})</span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* دکمه‌های اکشن */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setRepShiftDate(new Date().toLocaleDateString('fa-IR'));
                        setRepShiftDormId(selectedDormId === 'all' ? (myDorms[0]?.id || '') : selectedDormId);
                        setIsAddShiftReportModalOpen(true);
                      }}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-2xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-500/25 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>ثبت گزارش شیفت و دفتر وقایع</span>
                    </button>

                    <button
                      onClick={() => exportShiftReportsToExcel(filteredReports)}
                      className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      title="دانلود خروجی اکسل گزارش‌ها"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="hidden sm:inline">خروجی اکسل</span>
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition cursor-pointer"
                      title="چاپ دفتر وقایع شیفت"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* نوار فیلتر و جستجوی گزارش‌های شیفت */}
                <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span>گزارش‌گیری و پایش دفتر وقایع ({filteredReports.length} گزارش ثبت‌شده)</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* فیلتر سرپرست */}
                      <select
                        value={repFilterSupervisor}
                        onChange={(e) => setRepFilterSupervisor(e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <option value="all">همه سرپرستان</option>
                        {Storage.getSupervisors().map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.fullName}
                          </option>
                        ))}
                      </select>

                      {/* فیلتر سرا */}
                      <select
                        value={repFilterDorm}
                        onChange={(e) => setRepFilterDorm(e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <option value="all">همه سراها</option>
                        {dorms.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>

                      {/* فیلتر نوع شیفت */}
                      <select
                        value={repFilterType}
                        onChange={(e) => setRepFilterType(e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <option value="all">همه نوبت‌های شیفت</option>
                        <option value="morning">شیفت صبح</option>
                        <option value="evening">شیفت عصر</option>
                        <option value="night">شیفت شب</option>
                        <option value="full_day">شیفت ۲۴ ساعته / روزانه</option>
                      </select>
                    </div>
                  </div>

                  {/* نوار جستجوی متنی */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="جستجو در شرح بازرسی‌ها، حوادث، نکات تحویل شیفت یا کد گزارش..."
                      value={repSearchQuery}
                      onChange={(e) => setRepSearchQuery(e.target.value)}
                      className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* فهرست دفتر وقایع روزانه (قابل مشاهده توسط همه سرپرستان) */}
                {filteredReports.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      هیچ گزارش شیفتی مطابق فیلترهای تعیین‌شده یافت نشد.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      می‌توانید با زدن دکمه «ثبت گزارش شیفت و دفتر وقایع»، اولین گزارش شیفت این سرا را ثبت نمایید.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReports.map((report) => {
                      const isMyReport = report.supervisorId === supervisor.id;

                      return (
                        <div
                          key={report.id}
                          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-teal-500/50 transition"
                        >
                          {/* سربرگ کارت گزارش */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center font-bold text-teal-700 dark:text-teal-300 text-xs shrink-0">
                                {report.supervisorName.slice(0, 2)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                    {report.supervisorName}
                                  </h4>
                                  {isMyReport && (
                                    <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 text-[10px] font-bold">
                                      گزارش شما
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400">
                                  {report.dormName} • زمان ثبت سیستمی: {report.createdAt}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold" dir="ltr">
                                {report.reportCode}
                              </span>

                              <span className="px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold">
                                📅 {report.shiftDate} ({shiftFaMap[report.shiftType] || report.shiftType})
                              </span>

                              {report.shiftTime && (
                                <span className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 text-[11px] font-mono">
                                  ⏰ {report.shiftTime}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* محتوای گزارش شیفت */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            {/* خلاصه بازرسی‌ها */}
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                              <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                                <span>🔍 خلاصه بازرسی اتاق‌ها و وضعیت عمومی سرا:</span>
                              </span>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-justify">
                                {report.inspectionsSummary}
                              </p>
                              {report.presentStudentCount && (
                                <span className="inline-block mt-1 text-[10px] font-bold text-slate-400">
                                  تعداد ساکنین حاضر در شیفت: {report.presentStudentCount} دانشجو
                                </span>
                              )}
                            </div>

                            {/* حوادث یا وضعیت آرامش */}
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                <span>⚠️ حوادث، فوریت‌ها یا موارد انضباطی:</span>
                              </span>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-justify">
                                {report.incidentsSummary || 'در طول این شیفت هیچ‌گونه حادثه، فوریت پزشکی یا تخلف انضباطی رخ نداد و آرامش کامل برقرار بود.'}
                              </p>
                            </div>
                          </div>

                          {/* بخش برجسته: تحویل به شیفت بعدی (Handover Notes) */}
                          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-800 text-xs space-y-1">
                            <span className="font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                              <span>🤝 نکات کلیدی جهت تحویل به سرپرست شیفت بعد:</span>
                            </span>
                            <p className="text-amber-950 dark:text-amber-100 font-medium leading-relaxed">
                              {report.handoverNotes}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* تب تسویه حساب فارغ‌التحصیلان */}
      {activeTab === 'clearance' && (
        <GraduationClearanceReviewPanel
          unitRole="supervisor"
          reviewerId={supervisor.id}
          reviewerName={supervisor.fullName}
          settings={settings}
          onDataChange={onRefreshData}
        />
      )}

      {/* مدال ثبت گزارش شیفت و دفتر وقایع روزانه */}
      {isAddShiftReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-teal-500/40 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    ثبت گزارش شیفت و دفتر وقایع روزانه سرپرستی
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    این گزارش در دفتر وقایع ذخیره شده و برای اطلاع سایر سرپرستان شیفت‌های بعد قابل مشاهده خواهد بود.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddShiftReportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateShiftReport} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    سرای محل حضور:
                  </label>
                  <select
                    value={repShiftDormId || currentDorm?.id || ''}
                    onChange={(e) => setRepShiftDormId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    required
                  >
                    {myDorms.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاریخ شیفت (شمسی):
                  </label>
                  <PersianDatePicker
                    placeholder="مثال: ۱۴۰۵/۰۷/۱۵"
                    value={repShiftDate}
                    onChange={setRepShiftDate}
                    digits="fa"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نوبت شیفت:
                  </label>
                  <select
                    value={repShiftType}
                    onChange={(e) => {
                      const val = e.target.value as ShiftLogReport['shiftType'];
                      setRepShiftType(val);
                      if (val === 'full_day') setRepShiftTime('۰۷:۰۰ الی ۰۷:۰۰');
                      else if (val === 'morning') setRepShiftTime('۰۷:۰۰ الی ۱۵:۰۰');
                      else if (val === 'evening') setRepShiftTime('۱۵:۰۰ الی ۲۳:۰۰');
                      else setRepShiftTime('۲۲:۰۰ الی ۰۷:۰۰');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="full_day">شیفت ۲۴ ساعته کامل (۰۷:۰۰ الی ۰۷:۰۰ روز بعد)</option>
                    <option value="morning">شیفت صبح (۰۷:۰۰ الی ۱۵:۰۰)</option>
                    <option value="evening">شیفت عصر (۱۵:۰۰ الی ۲۳:۰۰)</option>
                    <option value="night">شیفت شب (۲۲:۰۰ الی ۰۷:۰۰ روز بعد)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ساعت دقیق حضور یا بازه شیفت {repShiftType === 'full_day' || repShiftType === 'night' ? '(تا روز بعد)' : ''}:
                  </label>
                  <PersianTimeRangePicker
                    value={repShiftTime}
                    onChange={setRepShiftTime}
                    digits="fa"
                    defaultStart="۰۷:۰۰"
                    defaultEnd="۰۷:۰۰"
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تعداد تخمینی دانشجومعلمان حاضر در سرا:
                </label>
                <input
                  type="number"
                  value={repStudentCount}
                  onChange={(e) => setRepStudentCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  خلاصه بازرسی اتاق‌ها، سالن مطالعه و وضعیت عمومی سرا:
                </label>
                <textarea
                  rows={3}
                  placeholder="شرح بازدید از طبقات، وضعیت نظافت مشاعات، روشنایی و تأسیسات، آرامش ساعات استراحت..."
                  value={repInspections}
                  onChange={(e) => setRepInspections(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  حوادث، فوریت‌های پزشکی یا موارد انضباطی (در صورت وجود):
                </label>
                <textarea
                  rows={2}
                  placeholder="در صورت عدم وجود مورد خاص، خالی بگذارید یا بنویسید: آرامش کامل برقرار بود."
                  value={repIncidents}
                  onChange={(e) => setRepIncidents(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-amber-700 dark:text-amber-400 mb-1">
                  نکات کلیدی جهت تحویل به سرپرست شیفت بعد (الزامی):
                </label>
                <textarea
                  rows={3}
                  placeholder="کلیدهای تحویلی، مأموریت‌های در دست پیگیری تأسیسات، مرخصی‌های دارای تأخیر، هماهنگی‌های لازم با همکار شیفت بعد..."
                  value={repHandover}
                  onChange={(e) => setRepHandover(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddShiftReportModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>ثبت در دفتر وقایع سرا</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال ثبت مستقیم خرابی تأسیساتی توسط سرپرست */}
      {isAddMaintenanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 dark:border-amber-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    ثبت مستقیم خرابی و ارجاع به تأسیسات
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    صدور مأموریت جدید کارشناسان تأسیسات برای سرای تحت نظارت
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMaintenanceModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDirectMaintenance} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان نقص یا خرابی تأسیساتی
                </label>
                <input
                  type="text"
                  placeholder="مثلاً نشت آب شیر روشویی، قطعی برق اتاق، خرابی قفل..."
                  value={maintTitle}
                  onChange={(e) => setMaintTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    سرای دانشجویی
                  </label>
                  <select
                    value={maintDormId}
                    onChange={(e) => setMaintDormId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    {myDorms.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شماره اتاق یا موقعیت
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً 305 یا راهرو طبقه اول"
                    value={maintRoomNumber}
                    onChange={(e) => setMaintRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    حوزه تخصصی
                  </label>
                  <select
                    value={maintCategory}
                    onChange={(e) => setMaintCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="plumbing">لوله کشی، شیرآلات، فاضلاب و موتورخانه</option>
                    <option value="electrical">برق، روشنایی، آسانسور و کلیدپریز</option>
                    <option value="carpentry">نجاری، درب، پنجره، قفل و کمد</option>
                    <option value="facilities">سرمایش، گرمایش، شوفاژ و کولر</option>
                    <option value="other">سایر امور فنی و ساختمانی</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اولویت رسیدگی
                  </label>
                  <select
                    value={maintPriority}
                    onChange={(e) => setMaintPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="normal">عادی</option>
                    <option value="urgent">فوری</option>
                    <option value="emergency">اضطراری و بحرانی (اورژانسی)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تکنسین مسئول (ارجاع مستقیم)
                </label>
                <select
                  value={maintStaffId}
                  onChange={(e) => setMaintStaffId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">بدون انتصاب مستقیم (ارجاع به سرپرست واحد تأسیسات)</option>
                  {allStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شرح دقیق مشکل و نکات مورد نیاز
                </label>
                <textarea
                  rows={3}
                  placeholder="جزئیات خرابی، وسایل احتمالی مورد نیاز..."
                  value={maintDesc}
                  onChange={(e) => setMaintDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Wrench className="w-4 h-4" />
                  <span>ثبت و صدور مأموریت تأسیسات</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddMaintenanceModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال مشاهده و پرینت کارت خوابگاه توسط سرپرست */}
      {viewCardStudent && (
        <DormIdCardModal
          isOpen={!!viewCardStudent}
          onClose={() => setViewCardStudent(null)}
          student={viewCardStudent}
          dorm={dorms.find((d) => d.id === viewCardStudent.assignedDormId)}
          room={rooms.find((r) => r.id === viewCardStudent.assignedRoomId)}
          bed={beds.find((b) => b.id === viewCardStudent.assignedBedId)}
          settings={settings}
        />
      )}

      {/* مدال پرونده کامل دانشجو با کلیک روی نام */}
      {(() => {
        const profileStudent = profileModalStudentId
          ? students.find((s) => s.studentId === profileModalStudentId) || null
          : null;
        const profileDorm = profileStudent?.assignedDormId
          ? dorms.find((dm) => dm.id === profileStudent.assignedDormId) || null
          : null;
        const profileRoom = profileStudent?.assignedRoomId
          ? rooms.find((rm) => rm.id === profileStudent.assignedRoomId) || null
          : null;
        const profileBed = profileStudent?.assignedBedId
          ? beds.find((bd) => bd.id === profileStudent.assignedBedId) || null
          : null;
        const roomOccs = profileRoom
          ? beds
              .filter((bd) => bd.roomId === profileRoom.id && bd.studentId)
              .map((bd) => students.find((s) => s.studentId === bd.studentId))
              .filter((s): s is Student => Boolean(s))
          : [];
        const hasExplicitRep = Boolean(
          profileRoom?.representativeStudentId &&
            roomOccs.some((s) => s.studentId === profileRoom.representativeStudentId)
        );
        const effectiveRepId = hasExplicitRep
          ? profileRoom?.representativeStudentId
          : roomOccs[0]?.studentId;
        const isProfileRep = Boolean(profileStudent && effectiveRepId === profileStudent.studentId);
        const isProfileDefaultRep = Boolean(isProfileRep && !hasExplicitRep);

        return (
          <StudentRoomProfileModal
            isOpen={Boolean(profileStudent)}
            onClose={() => setProfileModalStudentId(null)}
            student={profileStudent}
            dorm={profileDorm}
            room={profileRoom}
            bed={profileBed}
            isRoomRepresentative={isProfileRep}
            isDefaultRepresentative={isProfileDefaultRep}
            actorName={supervisor.fullName}
            actorRole="supervisor"
            actorId={supervisor.id}
            onDataChanged={onRefreshData}
          />
        );
      })()}

      {/* مدال تأیید عملیات سرپرست */}
      {supConfirmDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 shrink-0 ${supConfirmDialog.isPositive ? 'text-emerald-600' : 'text-rose-600'}`} />
              <span>{supConfirmDialog.title}</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{supConfirmDialog.message}</p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSupConfirmDialog(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  const fn = supConfirmDialog.onConfirm;
                  setSupConfirmDialog(null);
                  fn();
                }}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-sm cursor-pointer ${
                  supConfirmDialog.isPositive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {supConfirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مدال ثبت علت رد تخصیص موقت */}
      {rejectDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = Storage.rejectStudentAssignment(rejectDialog.studentId, rejectDialog.reason.trim() || 'عدم تأیید سرپرست');
              setRejectDialog(null);
              setActionFeedback(res.message);
              onRefreshData();
              setTimeout(() => setActionFeedback(null), 3500);
            }}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">ثبت علت عدم تأیید اسکان</h3>
            <p className="text-xs text-slate-500">این پیام به عنوان اعلان رسمی برای دانشجو ارسال می‌گردد:</p>
            <textarea
              rows={3}
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog((prev) => (prev ? { ...prev, reason: e.target.value } : null))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              required
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRejectDialog(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                تأیید و لغو اسکان موقت
              </button>
            </div>
          </form>
        </div>
      )}

      <ImageLightboxModal
        src={previewAnnImage}
        alt="تصویر اطلاعیه"
        onClose={() => setPreviewAnnImage(null)}
      />

      <SendSecurityReportModal
        isOpen={isSendSecurityModalOpen}
        onClose={() => setIsSendSecurityModalOpen(false)}
        reporterRole="supervisor"
        reporterId={supervisor.id}
        reporterName={supervisor.fullName}
        students={students}
        dorms={dorms}
        rooms={rooms}
        defaultDormId={selectedDormId !== 'all' ? selectedDormId : myDorms[0]?.id}
        onSuccess={(msg) => {
          setActionFeedback(msg);
          setTimeout(() => setActionFeedback(null), 4000);
          onRefreshData();
        }}
      />

      <StudentReferralModal
        isOpen={Boolean(referralTargetStudent)}
        onClose={() => setReferralTargetStudent(null)}
        student={referralTargetStudent}
        dorms={dorms}
        rooms={rooms}
        actorId={supervisor.id}
        actorName={supervisor.fullName}
        actorRole="supervisor"
        onSuccess={(msg) => {
          setActionFeedback(msg);
          setTimeout(() => setActionFeedback(null), 4000);
          onRefreshData();
        }}
      />

    </div>
  );
};
