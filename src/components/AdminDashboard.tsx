import React, { useState, useEffect, useRef } from 'react';
import { PersianDatePicker } from './PersianDatePicker';
import { PersianTimePicker } from './PersianTimePicker';
import { PersianDateTimePicker } from './PersianDateTimePicker';
import { MaintenanceQuickCommButtons } from './MaintenanceQuickCommButtons';
import {
  PERSIAN_MONTH_NAMES,
  getTodayJalali,
  getJalaliMonthDays,
  getJalaliMonthStartWeekday,
  formatJalaliDate,
  parseJalaliDate,
  getJalaliDayOfWeekKey,
  getJalaliWeekdayLabelFromDate,
  addDaysToJalaliDate,
  getJalaliMonthKey,
  formatDigits,
  calculateShiftDurationHours,
  toEnglishDigits as toEnDigitsCal,
} from '../utils/jalaliCalendar';
import {
  AppSettings,
  Dormitory,
  Room,
  Bed,
  Student,
  StudentResidenceType,
  StudentAdmissionStatus,
  CommuterEligibilityReason,
  Supervisor,
  Announcement,
  RoomWarning,
  CustomFont,
  MaintenanceTask,
  MaintenanceStaff,
  SupervisorShiftSchedule,
  ShiftLogReport,
  DayOfWeek,
  CounselorStaff,
  CounselorShiftSchedule,
  CounselorShiftReport,
  ActivityLog,
  StudentEvaluation,
  WarehouseStaff,
  FinanceStaff,
  ProcurementStaff,
  InventoryItem,
  InventoryTransaction,
  WarehouseRequest,
  ProcurementRequest,
  HomeNoteItem,
  EducationStaff,
  CulturalStaff,
  StudentAffairsStaff,
  AcademicStatusNotice,
  SecurityStaff,
  ViceDeanStaff,
  LibraryStaff,
  SmartCampusStaff,
  GraduationStaff,
  AcademicDeputyStaff,
  AboutCapabilityItem,
  AboutAttachmentFile,
  AboutContentSettings,
  CurrentUser,
} from '../types';
import { Storage, compressAvatarImageFile } from '../utils/storage';
import { ExcelImportTab } from './ExcelImportModal';
import { StudentActivityTranscriptModal } from './StudentActivityTranscriptModal';
import {
  exportShiftScheduleToExcel,
  exportShiftTemplateToExcel,
  importShiftScheduleFromExcel,
  exportShiftReportsToExcel,
  exportCounselorShiftScheduleToExcel,
  exportCounselorShiftTemplateToExcel,
  importCounselorShiftScheduleFromExcel,
  exportCounselorReportsToExcel,
  exportActivityLogsToExcel,
  exportInventoryToExcel,
  toEnglishDigits,
} from '../utils/excelUtils';
import { FarhangianEmblem } from './FarhangianEmblem';
import { SupervisorRoomManager } from './SupervisorRoomManager';
import { VisualBedPicker } from './VisualBedPicker';
import { RoomWarningModal } from './RoomWarningModal';
import { DormIdCardModal } from './DormIdCardModal';
import { DiningMealCardModal } from './DiningMealCardModal';
import { StudentEvaluationModal } from './StudentEvaluationModal';
import { RoomRosterPrintModal } from './RoomRosterPrintModal';
import { SupervisorGuestRequestsPanel } from './SupervisorGuestRequestsPanel';
import { RichTextEditor, RichTextDisplay } from './RichTextEditor';
import { AnnouncementImageBox, ImageLightboxModal } from './ImageLightboxModal';
import { AdminUsersPanel, UserCategoryKey } from './AdminUsersPanel';
import { AdminSurveyManager } from './AdminSurveyManager';
import { SendSecurityReportModal } from './SendSecurityReportModal';
import { CloudConnectionDiagnosticsPanel } from './CloudConnectionDiagnosticsPanel';
import { GraduationClearanceReviewPanel } from './GraduationClearanceReviewPanel';
import { CommunityChatHub } from './CommunityChatHub';
import { AdminStudentPortalsEditor } from './AdminStudentPortalsEditor';
import { AdminAcademicMajorsSettings } from './AdminAcademicMajorsSettings';
import { CourseSchedulingWorkspace } from './CourseSchedulingWorkspace';
import { getStudentResidenceType, getStudentAdmissionStatus } from '../utils/financeUtils';
import {
  findClosestApprovedMajor,
  findExactApprovedMajorForStudent,
  formatApprovedMajorLabel,
  getEffectiveApprovedMajors,
  normalizeMajorCode,
} from '../utils/academicMajors';
import {
  ARTISTIC_SKILL_OPTIONS,
  COMMUTER_ELIGIBILITY_OPTIONS,
  CULTURAL_ACTIVITY_OPTIONS,
  ECONOMIC_STATUS_LABELS,
  HOUSING_STATUS_LABELS,
  MENTAL_HEALTH_STATUS_LABELS,
  MENTAL_HEALTH_TOPIC_OPTIONS,
  PHYSICAL_CONDITION_OPTIONS,
  PHYSICAL_HEALTH_STATUS_LABELS,
  SPORTS_ACTIVITY_OPTIONS,
  TECHNICAL_SKILL_OPTIONS,
  formatCommuterReasons,
  formatParentOccupation,
  joinSkillList,
} from '../utils/studentProfileOptions';
import { normSearchText } from '../utils/studentSearchSort';
import { plainTextToHtml, sanitizeRichHtml } from '../utils/sanitizeHtml';
import { STANDARD_FONTS, readMultipleFontFiles } from '../utils/fonts';
import {
  DEFAULT_HOME_NOTES_TITLE,
  DEFAULT_HOME_NOTES,
  HERO_PRESET_COLORS,
  resolveHeroBannerStyle,
} from '../utils/homeDefaults';
import {
  DEFAULT_ABOUT_CONTENT,
  resolveAboutContent,
  ResolvedAboutContent,
} from '../utils/aboutDefaults';
import {
  Settings,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  FileSpreadsheet,
  Users,
  Building2,
  Shield,
  Save,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Palette,
  KeyRound,
  GraduationCap,
  Image as ImageIcon,
  Percent,
  CheckCheck,
  Camera,
  AlertTriangle,
  XCircle,
  Type,
  Bell,
  Eye,
  EyeOff,
  Pin,
  ShieldAlert,
  Sparkles,
  Bed as BedIcon,
  Search,
  Check,
  Layers,
  Phone,
  MapPin,
  ExternalLink,
  Edit3,
  QrCode,
  Printer,
  UserPlus,
  UserMinus,
  UserCheck,
  DoorOpen,
  ArrowUpDown,
  Wrench,
  CheckCircle2,
  PhoneCall,
  X,
  BookOpen,
  FileDown,
  ArrowRight,
  HeartHandshake,
  MessageSquare,
  Activity,
  Award,
  Package,
  Info,
  AlertCircle,
  FileWarning,
  ClipboardList,
  Paperclip,
  Database,
  Loader2,
  ChevronDown,
  Home,
  Bus,
  Server,
  Globe,
  PanelRight,
  PanelLeft,
  PanelTop,
  PinOff,
  Menu,
  MessagesSquare,
  PackagePlus,
} from 'lucide-react';

interface AdminDashboardProps {
  settings: AppSettings;
  dorms: Dormitory[];
  rooms: Room[];
  beds: Bed[];
  students: Student[];
  supervisors: Supervisor[];
  announcements: Announcement[];
  warnings: RoomWarning[];
  maintenanceTasks?: MaintenanceTask[];
  maintenanceStaff?: MaintenanceStaff[];
  onRefreshData: () => void;
  onOpenExcelModal: (tab?: ExcelImportTab) => void;
  onOpenReports: () => void;
  onOpenAppearance: () => void;
  onOpenChangePassword: () => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onOpenUserGuide?: (
    role:
      | 'admin'
      | 'supervisor'
      | 'maintenance'
      | 'warehouse'
      | 'procurement'
      | 'counselor'
      | 'finance'
      | 'education'
      | 'cultural'
      | 'student_affairs'
      | 'security'
      | 'vice_dean'
      | 'academic_deputy'
      | 'professor'
      | 'student'
  ) => void;
  onImpersonateUser?: (user: NonNullable<CurrentUser>) => void;
  onOpenWarehouseRequest?: () => void;
  myPendingWarehouseRequestsCount?: number;
  cloudSyncTick?: number;
  focusAboutEditorTick?: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  settings,
  dorms,
  rooms,
  beds,
  students,
  supervisors,
  announcements,
  warnings,
  maintenanceTasks,
  maintenanceStaff,
  onRefreshData,
  onOpenExcelModal,
  onOpenReports,
  onOpenAppearance,
  onOpenChangePassword,
  onUpdateSettings,
  onOpenUserGuide,
  onImpersonateUser,
  onOpenWarehouseRequest,
  myPendingWarehouseRequestsCount = 0,
  cloudSyncTick = 0,
  focusAboutEditorTick = 0,
}) => {
  // تب‌های اصلی داشبورد مدیر (در بدو ورود هیچ بخشی باز نباشد تا صفحه سریع بارگذاری شود)
  type AdminMainTabKey =
    | 'cartable'
    | 'users'
    | 'announcements'
    | 'requests'
    | 'maintenance'
    | 'warehouse'
    | 'warehouse_request'
    | 'shifts'
    | 'counseling'
    | 'surveys'
    | 'clearance'
    | 'course_scheduling'
    | 'community_chat'
    | 'activity_log'
    | 'settings';
  type AdminMenuLayoutMode = 'top_cards' | 'sidebar_right' | 'sidebar_left';

  const [mainTab, setMainTab] = useState<AdminMainTabKey | null>(null);
  const [tabHistory, setTabHistory] = useState<AdminMainTabKey[]>([]);
  const [adminMenuLayout, setAdminMenuLayout] = useState<AdminMenuLayoutMode>(() => {
    try {
      const saved = localStorage.getItem('cfu_admin_menu_layout');
      if (saved === 'top_cards' || saved === 'sidebar_right' || saved === 'sidebar_left') {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return 'top_cards';
  });
  const [adminSidebarAutoHide, setAdminSidebarAutoHide] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cfu_admin_sidebar_autohide') === 'true';
    } catch {
      return false;
    }
  });
  const [isAutoHideExpanded, setIsAutoHideExpanded] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [isCourseSchedulingOpen, setIsCourseSchedulingOpen] = useState(false);
  const [usersCategory, setUsersCategory] = useState<UserCategoryKey>('students');

  useEffect(() => {
    try {
      localStorage.setItem('cfu_admin_menu_layout', adminMenuLayout);
    } catch {
      // ignore
    }
  }, [adminMenuLayout]);

  useEffect(() => {
    try {
      localStorage.setItem('cfu_admin_sidebar_autohide', String(adminSidebarAutoHide));
    } catch {
      // ignore
    }
  }, [adminSidebarAutoHide]);

  const handleToggleOrSelectTab = (tab: AdminMainTabKey) => {
    if (tab === 'course_scheduling') {
      setIsCourseSchedulingOpen(true);
      setIsMobileSidebarOpen(false);
      if (adminSidebarAutoHide) {
        setIsAutoHideExpanded(false);
      }
      return;
    }
    if (tab === 'warehouse_request') {
      onOpenWarehouseRequest?.();
      setIsMobileSidebarOpen(false);
      if (adminSidebarAutoHide) {
        setIsAutoHideExpanded(false);
      }
      return;
    }
    if (tab === 'activity_log') {
      setActivityLogs(Storage.getActivityLogs());
    }
    setMainTab((current) => {
      if (current === tab) {
        // کلیک مجدد روی منوی باز باعث بسته شدن آن می‌شود
        return null;
      }
      if (current !== null) {
        setTabHistory((prev) => [...prev.slice(-14), current]);
      }
      return tab;
    });
    setIsMobileSidebarOpen(false);
    if (adminSidebarAutoHide) {
      setIsAutoHideExpanded(false);
    }
  };

  const handleGoBackTab = () => {
    setTabHistory((prev) => {
      if (prev.length === 0) {
        setMainTab(null);
        return prev;
      }
      const nextHistory = prev.slice(0, -1);
      const targetTab = prev[prev.length - 1];
      if (targetTab === 'activity_log') {
        setActivityLogs(Storage.getActivityLogs());
      }
      setMainTab(targetTab);
      return nextHistory;
    });
  };

  // وضعیت مشاهده فقط-خواندنی انبار و کارپردازی برای مدیر کل
  const [adminWhSubTab, setAdminWhSubTab] = useState<'inventory' | 'transactions' | 'requests' | 'procurement'>('inventory');
  const [adminWhSearch, setAdminWhSearch] = useState('');
  const [adminWhCatFilter, setAdminWhCatFilter] = useState<string>('all');

  // لاگ فعالیت‌ها و تذکرات / ارزیابی‌های دانشجویان
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(Storage.getActivityLogs());
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logCategoryFilter, setLogCategoryFilter] = useState<string>('all');
  const [logRoleFilter, setLogRoleFilter] = useState<string>('all');
  const [logSeverityFilter, setLogSeverityFilter] = useState<string>('all');
  const [confirmClearLogs, setConfirmClearLogs] = useState(false);

  const [studentEvaluations, setStudentEvaluations] = useState<StudentEvaluation[]>(Storage.getStudentEvaluations());
  const [isStudentEvalModalOpen, setIsStudentEvalModalOpen] = useState(false);
  const [evalTargetStudent, setEvalTargetStudent] = useState<Student | null>(null);

  // داده‌های مشاوران و شیفت‌ها و پیام‌ها
  const [counselorsList, setCounselorsList] = useState<CounselorStaff[]>(Storage.getCounselors());
  const [counselorShifts, setCounselorShifts] = useState<CounselorShiftSchedule[]>(Storage.getCounselorShifts());
  const [counselorReports, setCounselorReports] = useState<CounselorShiftReport[]>(Storage.getCounselorReports());
  const [counselorFeedback, setCounselorFeedback] = useState<string | null>(null);

  // زیرتب‌های بخش مشاوره در پنل مدیر
  const [counselingSubTab, setCounselingSubTab] = useState<'counselors' | 'shifts' | 'messages' | 'reports'>('counselors');

  // فرم ثبت مشاور جدید توسط مدیر
  const [isAddCounselorModalOpen, setIsAddCounselorModalOpen] = useState(false);
  const [newCnsFullName, setNewCnsFullName] = useState('');
  const [newCnsUsername, setNewCnsUsername] = useState('');
  const [newCnsPassword, setNewCnsPassword] = useState('');
  const [newCnsPhone, setNewCnsPhone] = useState('');
  const [newCnsSpecialty, setNewCnsSpecialty] = useState('روانشناسی بالینی و تربیتی');
  const [newCnsOffice, setNewCnsOffice] = useState('دفتر مشاوره و روانشناسی');

  // فرم ثبت شیفت دستی مشاور توسط مدیر
  const [isAddCounselorShiftModalOpen, setIsAddCounselorShiftModalOpen] = useState(false);
  const [newCnsShiftCounselorId, setNewCnsShiftCounselorId] = useState(counselorsList[0]?.id || '');
  const [newCnsShiftDay, setNewCnsShiftDay] = useState<DayOfWeek | 'all'>('saturday');
  const [newCnsShiftStartTime, setNewCnsShiftStartTime] = useState('۱۴:۰۰');
  const [newCnsShiftEndTime, setNewCnsShiftEndTime] = useState('۱۸:۰۰');
  const [newCnsShiftDormId, setNewCnsShiftDormId] = useState(dorms[0]?.id || 'all');
  const [newCnsShiftRoom, setNewCnsShiftRoom] = useState('اتاق مشاوره');
  const [newCnsShiftNotes, setNewCnsShiftNotes] = useState('');

  // داده‌های شیفت‌بندی ماهانه و گزارشات شیفت سرپرستان
  const todayJalali = getTodayJalali();
  const [shiftSchedules, setShiftSchedules] = useState<SupervisorShiftSchedule[]>(Storage.getShiftSchedules());
  const [shiftReports, setShiftReports] = useState<ShiftLogReport[]>(Storage.getShiftReports());
  const [shiftSearch, setShiftSearch] = useState('');
  const [shiftDormFilter, setShiftDormFilter] = useState('all');
  const [shiftViewMode, setShiftViewMode] = useState<'calendar' | 'table'>('calendar');
  const [shiftViewYear, setShiftViewYear] = useState<number>(todayJalali.jy);
  const [shiftViewMonth, setShiftViewMonth] = useState<number>(todayJalali.jm);
  const [shiftShowAllMonths, setShiftShowAllMonths] = useState<boolean>(false);
  const [shiftFeedback, setShiftFeedback] = useState<string | null>(null);

  // فهرست پرسنل انبار، کارپردازی، امور مالی، کارشناسان آموزش، امور فرهنگی و امور دانشجویی
  const [warehouseStaffList, setWarehouseStaffList] = useState<WarehouseStaff[]>(Storage.getWarehouseStaff());
  const [procurementStaffList, setProcurementStaffList] = useState<ProcurementStaff[]>(Storage.getProcurementStaff());
  const [financeStaffList, setFinanceStaffList] = useState<FinanceStaff[]>(Storage.getFinanceStaff());
  const [educationStaffList, setEducationStaffList] = useState<EducationStaff[]>(Storage.getEducationStaff());
  const [culturalStaffList, setCulturalStaffList] = useState<CulturalStaff[]>(Storage.getCulturalStaff());
  const [studentAffairsStaffList, setStudentAffairsStaffList] = useState<StudentAffairsStaff[]>(Storage.getStudentAffairsStaff());
  const [securityStaffList, setSecurityStaffList] = useState<SecurityStaff[]>(Storage.getSecurityStaff());
  const [viceDeanStaffList, setViceDeanStaffList] = useState<ViceDeanStaff[]>(Storage.getViceDeanStaff());
  const [libraryStaffList, setLibraryStaffList] = useState<LibraryStaff[]>(Storage.getLibraryStaff());
  const [smartCampusStaffList, setSmartCampusStaffList] = useState<SmartCampusStaff[]>(Storage.getSmartCampusStaff());
  const [graduationStaffList, setGraduationStaffList] = useState<GraduationStaff[]>(Storage.getGraduationStaff());
  const [academicDeputyStaffList, setAcademicDeputyStaffList] = useState<AcademicDeputyStaff[]>(
    Storage.getAcademicDeputyStaff()
  );
  const [isSendSecurityModalOpen, setIsSendSecurityModalOpen] = useState(false);
  const [academicNotices, setAcademicNotices] = useState<AcademicStatusNotice[]>(Storage.getAcademicNotices());
  const [academicNoticeFilter, setAcademicNoticeFilter] = useState<'all' | 'pending' | 'reviewed' | 'action_taken'>('all');
  const [academicNoticeNotes, setAcademicNoticeNotes] = useState<Record<string, string>>({});

  const handleUsersRefresh = () => {
    setCounselorsList(Storage.getCounselors());
    setWarehouseStaffList(Storage.getWarehouseStaff());
    setProcurementStaffList(Storage.getProcurementStaff());
    setFinanceStaffList(Storage.getFinanceStaff());
    setEducationStaffList(Storage.getEducationStaff());
    setCulturalStaffList(Storage.getCulturalStaff());
    setStudentAffairsStaffList(Storage.getStudentAffairsStaff());
    setSecurityStaffList(Storage.getSecurityStaff());
    setViceDeanStaffList(Storage.getViceDeanStaff());
    setLibraryStaffList(Storage.getLibraryStaff());
    setSmartCampusStaffList(Storage.getSmartCampusStaff());
    setGraduationStaffList(Storage.getGraduationStaff());
    setAcademicDeputyStaffList(Storage.getAcademicDeputyStaff());
    setAcademicNotices(Storage.getAcademicNotices());
    onRefreshData();
  };

  // همگام‌سازی فهرست‌های داخلی مدیر هنگام دریافت داده جدید از سرور ابری
  useEffect(() => {
    if (!cloudSyncTick) return;
    setCounselorsList(Storage.getCounselors());
    setCounselorShifts(Storage.getCounselorShifts());
    setCounselorReports(Storage.getCounselorReports());
    setShiftSchedules(Storage.getShiftSchedules());
    setShiftReports(Storage.getShiftReports());
    setActivityLogs(Storage.getActivityLogs());
    setStudentEvaluations(Storage.getStudentEvaluations());
    setWarehouseStaffList(Storage.getWarehouseStaff());
    setProcurementStaffList(Storage.getProcurementStaff());
    setFinanceStaffList(Storage.getFinanceStaff());
    setEducationStaffList(Storage.getEducationStaff());
    setCulturalStaffList(Storage.getCulturalStaff());
    setStudentAffairsStaffList(Storage.getStudentAffairsStaff());
    setSecurityStaffList(Storage.getSecurityStaff());
    setViceDeanStaffList(Storage.getViceDeanStaff());
    setLibraryStaffList(Storage.getLibraryStaff());
    setSmartCampusStaffList(Storage.getSmartCampusStaff());
    setGraduationStaffList(Storage.getGraduationStaff());
    setAcademicDeputyStaffList(Storage.getAcademicDeputyStaff());
    setAcademicNotices(Storage.getAcademicNotices());
  }, [cloudSyncTick]);

  const todayFaDate = formatJalaliDate(todayJalali.jy, todayJalali.jm, todayJalali.jd, 'fa');

  // فرم ثبت و ویرایش دستی نوبت کاری ماهانه سرپرستان توسط مدیر
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [newShiftSupId, setNewShiftSupId] = useState(supervisors[0]?.id || '');
  const [newShiftDormId, setNewShiftDormId] = useState(dorms[0]?.id || 'all');
  const [newShiftDate, setNewShiftDate] = useState<string>(todayFaDate);
  const [newShiftType, setNewShiftType] = useState<ShiftLogReport['shiftType']>('full_day');
  const [newShiftStartTime, setNewShiftStartTime] = useState('۰۷:۰۰');
  const [newShiftEndTime, setNewShiftEndTime] = useState('۰۷:۰۰');
  const [newShiftEndsNextDay, setNewShiftEndsNextDay] = useState<boolean>(true);
  const [newShiftNotes, setNewShiftNotes] = useState('');

  // فرم ثبت سریع تک‌به‌تک نوبت کاری ماهانه مستقیماً در بالای برنامه
  const [quickShiftSupId, setQuickShiftSupId] = useState(supervisors[0]?.id || '');
  const [quickShiftDormId, setQuickShiftDormId] = useState(dorms[0]?.id || 'all');
  const [quickShiftDate, setQuickShiftDate] = useState<string>(todayFaDate);
  const [quickShiftType, setQuickShiftType] = useState<ShiftLogReport['shiftType']>('full_day');
  const [quickShiftStartTime, setQuickShiftStartTime] = useState('۰۷:۰۰');
  const [quickShiftEndTime, setQuickShiftEndTime] = useState('۰۷:۰۰');
  const [quickShiftEndsNextDay, setQuickShiftEndsNextDay] = useState<boolean>(true);
  const [quickShiftNotes, setQuickShiftNotes] = useState('');

  const getDefaultShiftHours = (
    type: ShiftLogReport['shiftType']
  ): { start: string; end: string; endsNextDay: boolean } => {
    if (type === 'full_day') return { start: '۰۷:۰۰', end: '۰۷:۰۰', endsNextDay: true };
    if (type === 'morning') return { start: '۰۷:۰۰', end: '۱۵:۰۰', endsNextDay: false };
    if (type === 'evening') return { start: '۱۵:۰۰', end: '۲۳:۰۰', endsNextDay: false };
    return { start: '۲۲:۰۰', end: '۰۷:۰۰', endsNextDay: true };
  };

  const buildMonthlyShiftPayload = (params: {
    supId: string;
    dormId: string;
    dateStr: string;
    shiftType: ShiftLogReport['shiftType'];
    startTime: string;
    endTime: string;
    endsNextDay: boolean;
    notes: string;
  }): Omit<SupervisorShiftSchedule, 'id'> | null => {
    const sup = supervisors.find((s) => s.id === params.supId);
    if (!sup) return null;
    const dorm = params.dormId === 'all' ? null : dorms.find((d) => d.id === params.dormId);
    const parsed = parseJalaliDate(params.dateStr);
    const formattedDate = parsed
      ? formatJalaliDate(parsed.jy, parsed.jm, parsed.jd, 'fa')
      : params.dateStr.trim() || todayFaDate;
    const derivedDay: DayOfWeek | 'all' = parsed
      ? getJalaliDayOfWeekKey(parsed.jy, parsed.jm, parsed.jd)
      : 'all';
    const monthKey = getJalaliMonthKey(formattedDate);

    return {
      supervisorId: sup.id,
      supervisorName: sup.fullName,
      dormId: dorm ? dorm.id : 'all',
      dormName: dorm ? dorm.name : 'کلیه سراهای دانشجویی پردیس',
      shiftDate: formattedDate,
      monthKey: monthKey || undefined,
      dayOfWeek: derivedDay,
      shiftType: params.shiftType,
      startTime: params.startTime.trim(),
      endTime: params.endTime.trim(),
      endsNextDay: params.endsNextDay,
      notes: params.notes.trim(),
      isEveryDay: false,
    };
  };

  const openCreateShiftModal = (presetDate?: string) => {
    setEditingShiftId(null);
    setNewShiftSupId(supervisors[0]?.id || '');
    setNewShiftDormId(dorms[0]?.id || 'all');
    setNewShiftDate(
      presetDate || formatJalaliDate(shiftViewYear, shiftViewMonth, 1, 'fa')
    );
    setNewShiftType('full_day');
    setNewShiftStartTime('۰۷:۰۰');
    setNewShiftEndTime('۰۷:۰۰');
    setNewShiftEndsNextDay(true);
    setNewShiftNotes('');
    setIsAddShiftModalOpen(true);
  };

  const openEditShiftModal = (sched: SupervisorShiftSchedule) => {
    const matchedSup =
      supervisors.find((s) => s.id === sched.supervisorId) ||
      supervisors.find((s) => s.fullName === sched.supervisorName) ||
      supervisors[0];
    const matchedDormId =
      sched.dormId === 'all'
        ? 'all'
        : dorms.some((d) => d.id === sched.dormId)
        ? sched.dormId
        : dorms.find((d) => d.name === sched.dormName)?.id || 'all';
    const normalizedType: ShiftLogReport['shiftType'] =
      sched.shiftType === 'morning' ||
      sched.shiftType === 'evening' ||
      sched.shiftType === 'night' ||
      sched.shiftType === 'full_day'
        ? sched.shiftType
        : 'full_day';
    const fallbackHours = getDefaultShiftHours(normalizedType);

    setEditingShiftId(sched.id);
    setNewShiftSupId(matchedSup?.id || '');
    setNewShiftDormId(matchedDormId);
    setNewShiftDate(sched.shiftDate || todayFaDate);
    setNewShiftType(normalizedType);
    setNewShiftStartTime(sched.startTime || fallbackHours.start);
    setNewShiftEndTime(sched.endTime || fallbackHours.end);
    setNewShiftEndsNextDay(
      sched.endsNextDay !== undefined ? Boolean(sched.endsNextDay) : fallbackHours.endsNextDay
    );
    setNewShiftNotes(sched.notes || '');
    setIsAddShiftModalOpen(true);
  };

  // زیرتب‌های کارتابل سرپرستی مدیر
  const [cartableSubTab, setCartableSubTab] = useState<'manager' | 'visual_picker' | 'warnings' | 'structure'>('manager');
  const [selectedCartableDormId, setSelectedCartableDormId] = useState<string>('all');
  const [isAdminWarningModalOpen, setIsAdminWarningModalOpen] = useState(false);
  const [isAdminRoomPrintModalOpen, setIsAdminRoomPrintModalOpen] = useState(false);

  useEffect(() => {
    setActivityLogs(Storage.getActivityLogs());
    setStudentEvaluations(Storage.getStudentEvaluations());
    setCounselorsList(Storage.getCounselors());
    setWarehouseStaffList(Storage.getWarehouseStaff());
    setProcurementStaffList(Storage.getProcurementStaff());
    setFinanceStaffList(Storage.getFinanceStaff());
    setAcademicDeputyStaffList(Storage.getAcademicDeputyStaff());
  }, [students, warnings, announcements, rooms, beds, mainTab, cartableSubTab]);

  // وضعیت‌های مدیریت تأسیسات در پنل مدیر کل
  const [adminMaintDormFilter, setAdminMaintDormFilter] = useState<string>('all');
  const [adminMaintStatusFilter, setAdminMaintStatusFilter] = useState<string>('all');
  const [adminMaintPriorityFilter, setAdminMaintPriorityFilter] = useState<string>('all');
  const [adminMaintSearch, setAdminMaintSearch] = useState<string>('');
  const [adminMaintFeedback, setAdminMaintFeedback] = useState<string | null>(null);

  // فرم ثبت مأموریت تأسیساتی توسط مدیر
  const [showAdminAddMaintModal, setShowAdminAddMaintModal] = useState(false);
  const [adminNewMaintTitle, setAdminNewMaintTitle] = useState('');
  const [adminNewMaintDesc, setAdminNewMaintDesc] = useState('');
  const [adminNewMaintDormId, setAdminNewMaintDormId] = useState(dorms[0]?.id || '');
  const [adminNewMaintRoom, setAdminNewMaintRoom] = useState('');
  const [adminNewMaintPriority, setAdminNewMaintPriority] = useState<MaintenanceTask['priority']>('normal');
  const [adminNewMaintCategory, setAdminNewMaintCategory] = useState<MaintenanceTask['category']>('plumbing');
  const [adminNewMaintStaffId, setAdminNewMaintStaffId] = useState('');

  // تخصیص مستقیم دانشجوی فاقد اتاق به اتاق و تخت خالی توسط مدیر
  const [assigningStudent, setAssigningStudent] = useState<Student | null>(null);
  const [assignTargetDormId, setAssignTargetDormId] = useState<string>('');
  const [assignTargetRoomId, setAssignTargetRoomId] = useState<string>('');
  const [assignTargetBedId, setAssignTargetBedId] = useState<string>('');
  const [assignIsConfirmed, setAssignIsConfirmed] = useState<boolean>(true);
  const [assignFeedback, setAssignFeedback] = useState<string | null>(null);

  // ثبت سرای جدید توسط مدیر
  const [isAddDormModalOpen, setIsAddDormModalOpen] = useState(false);
  const [newDormName, setNewDormName] = useState('');
  const [newDormCampus, setNewDormCampus] = useState('پردیس شهید باهنر اصفهان');
  const [newDormGender, setNewDormGender] = useState<'brothers' | 'sisters'>('brothers');
  const [newDormFloors, setNewDormFloors] = useState(3);
  const [newDormDesc, setNewDormDesc] = useState('');
  const [newDormAddress, setNewDormAddress] = useState('');
  const [newDormSupervisor, setNewDormSupervisor] = useState('');

  // ثبت اتاق جدید با تخت‌ها توسط مدیر
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [roomDormId, setRoomDormId] = useState(dorms[0]?.id || '');
  const [roomNumberInput, setRoomNumberInput] = useState('');
  const [roomFloorInput, setRoomFloorInput] = useState(1);
  const [roomCapacityInput, setRoomCapacityInput] = useState(4);
  const [structureDormFilter, setStructureDormFilter] = useState<string>(dorms[0]?.id || 'all');
  const [structureSearchQuery, setStructureSearchQuery] = useState<string>('');

  // ویرایش و تغییر نام سرا و اتاق توسط مدیر
  const [editingDorm, setEditingDorm] = useState<Dormitory | null>(null);
  const [editDormName, setEditDormName] = useState('');
  const [editDormCampus, setEditDormCampus] = useState('');
  const [editDormGender, setEditDormGender] = useState<'brothers' | 'sisters'>('brothers');
  const [editDormFloors, setEditDormFloors] = useState(3);
  const [editDormSupervisor, setEditDormSupervisor] = useState('');
  const [editDormAddress, setEditDormAddress] = useState('');
  const [editDormError, setEditDormError] = useState<string | null>(null);

  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editRoomNumber, setEditRoomNumber] = useState('');
  const [editRoomFloor, setEditRoomFloor] = useState(1);
  const [editRoomError, setEditRoomError] = useState<string | null>(null);

  // فرم تنظیمات بازه زمانی و سال تحصیلی
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const localSettingsRef = useRef<AppSettings>(localSettings);
  localSettingsRef.current = localSettings;
  const [saveStatus, setSaveStatus] = useState(false);

  const lastSyncedSettingsJsonRef = useRef<string>(JSON.stringify(settings));
  useEffect(() => {
    const incomingJson = JSON.stringify(settings);
    if (incomingJson === lastSyncedSettingsJsonRef.current) return;
    lastSyncedSettingsJsonRef.current = incomingJson;
    localSettingsRef.current = { ...settings };
    setLocalSettings({ ...settings });
  }, [settings]);

  // اطمینان از انتخاب خودکار اولین سرای/سرپرست/مشاور معتبر پس از بارگذاری یا ایجاد داده‌ها
  useEffect(() => {
    if (dorms.length > 0) {
      if (!roomDormId || !dorms.some((d) => d.id === roomDormId)) {
        setRoomDormId(dorms[0].id);
      }
      if (!adminNewMaintDormId || !dorms.some((d) => d.id === adminNewMaintDormId)) {
        setAdminNewMaintDormId(dorms[0].id);
      }
    }
  }, [dorms, roomDormId, adminNewMaintDormId]);

  useEffect(() => {
    if (supervisors.length > 0 && (!newShiftSupId || !supervisors.some((s) => s.id === newShiftSupId))) {
      setNewShiftSupId(supervisors[0].id);
    }
    if (supervisors.length > 0 && (!quickShiftSupId || !supervisors.some((s) => s.id === quickShiftSupId))) {
      setQuickShiftSupId(supervisors[0].id);
    }
  }, [supervisors, newShiftSupId, quickShiftSupId]);

  useEffect(() => {
    if (counselorsList.length > 0 && (!newCnsShiftCounselorId || !counselorsList.some((c) => c.id === newCnsShiftCounselorId))) {
      setNewCnsShiftCounselorId(counselorsList[0].id);
    }
  }, [counselorsList, newCnsShiftCounselorId]);

  // مدیریت درخواست‌های اسکان موقت
  const pendingStudents = students.filter(
    (s) => s.assignedBedId && s.assignmentStatus === 'temporary'
  );
  const [approvalFeedback, setApprovalFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [adminConfirmDialog, setAdminConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    isPositive?: boolean;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [adminRejectDialog, setAdminRejectDialog] = useState<{
    studentId: string;
    reason: string;
  } | null>(null);
  const [adminNoticeDialog, setAdminNoticeDialog] = useState<{
    title: string;
    message: string;
    tone: 'success' | 'error';
  } | null>(null);

  // فرم ثبت و انتشار اطلاعیه توسط مدیر
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnContentHtml, setNewAnnContentHtml] = useState('');
  const [annEditorResetKey, setAnnEditorResetKey] = useState(0);
  const [newAnnPriority, setNewAnnPriority] = useState<Announcement['priority']>('normal');
  const [newAnnTargetDormId, setNewAnnTargetDormId] = useState('all');
  const [newAnnShowOnHome, setNewAnnShowOnHome] = useState(true);
  const [newAnnPublishInNotifications, setNewAnnPublishInNotifications] = useState(false);
  const [newAnnPinned, setNewAnnPinned] = useState(false);
  const [newAnnImage, setNewAnnImage] = useState<string | null>(null);
  const [annPreviewImage, setAnnPreviewImage] = useState<string | null>(null);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [annFeedback, setAnnFeedback] = useState<string | null>(null);

  // وضعیت آپلود چندتایی و انتخاب فونت نمایش سامانه در تب تنظیمات
  const [adminFontName, setAdminFontName] = useState('');
  const [adminActivateFontOnUpload, setAdminActivateFontOnUpload] = useState(false);
  const [adminFontFeedback, setAdminFontFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // وضعیت ویرایش باکس بنر اصلی و نکات مهم صفحه اول سایت
  const [heroBgFeedback, setHeroBgFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [draftHomeNotesTitle, setDraftHomeNotesTitle] = useState(
    settings.homeNotesTitle?.trim() || DEFAULT_HOME_NOTES_TITLE
  );
  const [draftHomeNotes, setDraftHomeNotes] = useState<HomeNoteItem[]>(
    settings.homeNotes && settings.homeNotes.length > 0
      ? settings.homeNotes
      : DEFAULT_HOME_NOTES
  );
  const [homeNotesEditorKey, setHomeNotesEditorKey] = useState(0);
  const [homeNotesFeedback, setHomeNotesFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const lastSyncedHomeNotesJsonRef = useRef<string>(
    JSON.stringify({ t: settings.homeNotesTitle || '', n: settings.homeNotes || [] })
  );
  useEffect(() => {
    const incomingJson = JSON.stringify({
      t: settings.homeNotesTitle || '',
      n: settings.homeNotes || [],
    });
    if (incomingJson === lastSyncedHomeNotesJsonRef.current) return;
    lastSyncedHomeNotesJsonRef.current = incomingJson;
    setDraftHomeNotesTitle(settings.homeNotesTitle?.trim() || DEFAULT_HOME_NOTES_TITLE);
    setDraftHomeNotes(
      settings.homeNotes && settings.homeNotes.length > 0
        ? settings.homeNotes
        : DEFAULT_HOME_NOTES
    );
    setHomeNotesEditorKey((k) => k + 1);
  }, [settings.homeNotesTitle, settings.homeNotes]);

  // وضعیت ویرایش بخش «درباره ما» و فایل‌های پیوست توسط مدیر کل
  const [draftAbout, setDraftAbout] = useState<ResolvedAboutContent>(() =>
    resolveAboutContent(settings.aboutContent)
  );
  const [aboutEditorResetKey, setAboutEditorResetKey] = useState(0);
  const [aboutFeedback, setAboutFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const lastSyncedAboutJsonRef = useRef<string>(JSON.stringify(settings.aboutContent || null));

  useEffect(() => {
    const incomingJson = JSON.stringify(settings.aboutContent || null);
    if (incomingJson === lastSyncedAboutJsonRef.current) return;
    lastSyncedAboutJsonRef.current = incomingJson;
    setDraftAbout(resolveAboutContent(settings.aboutContent));
    setAboutEditorResetKey((k) => k + 1);
  }, [settings.aboutContent]);

  // بخش بازشده در تب تنظیمات مدیر (با کلیک روی هر دکمه، فقط همان بخش نمایش داده می‌شود)
  type AdminSettingsSectionKey =
    | 'general'
    | 'appearance'
    | 'cloud'
    | 'backup'
    | 'home_notes'
    | 'student_portals'
    | 'academic_majors'
    | 'about'
    | 'quick_users';
  const [openSettingsSection, setOpenSettingsSection] = useState<AdminSettingsSectionKey | null>(null);
  const [appearanceSubTab, setAppearanceSubTab] = useState<'all' | 'logo' | 'fonts_bg' | 'hero'>('all');

  useEffect(() => {
    if (!focusAboutEditorTick) return;
    setMainTab('settings');
    setOpenSettingsSection('about');
    window.setTimeout(() => {
      const el = document.getElementById('admin-about-editor');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  }, [focusAboutEditorTick]);

  // مدیریت دانشجویان توسط مدیر: افزودن، ویرایش و مشاهده کارت
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewCardStudent, setViewCardStudent] = useState<Student | null>(null);
  const [diningCardStudent, setDiningCardStudent] = useState<Student | null>(null);

  // فیلدهای فرم دانشجو
  const [stFormFullName, setStFormFullName] = useState('');
  const [stFormStudentId, setStFormStudentId] = useState('');
  const [stFormNationalId, setStFormNationalId] = useState('');
  const [stFormField, setStFormField] = useState('آموزش ابتدایی');
  const [stFormMajorCode, setStFormMajorCode] = useState('');
  const [stFormDegreeLevel, setStFormDegreeLevel] = useState('');
  const [stFormEntryTerm, setStFormEntryTerm] = useState('۴۰۲۱');
  const [stFormFatherName, setStFormFatherName] = useState('');
  const [stFormMobile, setStFormMobile] = useState('');
  const [stFormEmergency, setStFormEmergency] = useState('');
  const [stFormProvince, setStFormProvince] = useState('اصفهان');
  const [stFormCity, setStFormCity] = useState('اصفهان');
  const [stFormParentPhone, setStFormParentPhone] = useState('');
  const [stFormPostalAddress, setStFormPostalAddress] = useState('');
  const [stFormBirthDate, setStFormBirthDate] = useState('1382/01/01');
  const [stFormPhone, setStFormPhone] = useState('');
  const [stFormReligion, setStFormReligion] = useState('اسلام / شیعه');
  const [stFormPreviousDorm, setStFormPreviousDorm] = useState('');
  const [stFormPreviousRoom, setStFormPreviousRoom] = useState('');
  const [stFormPreviousScore, setStFormPreviousScore] = useState('100');
  const [stFormResidenceType, setStFormResidenceType] = useState<StudentResidenceType>('dormitory');
  const [stFormAdmissionStatus, setStFormAdmissionStatus] = useState<StudentAdmissionStatus>('not_admitted');
  const [stFormCommuterReasons, setStFormCommuterReasons] = useState<CommuterEligibilityReason[]>([]);
  const [stFormCommuterNotes, setStFormCommuterNotes] = useState('');
  const [stFormDormNotes, setStFormDormNotes] = useState('');
  const [stFormMaritalStatus, setStFormMaritalStatus] = useState<'single' | 'married'>('single');
  const [stFormHeadOfHousehold, setStFormHeadOfHousehold] = useState(false);
  const [stFormFatherAlive, setStFormFatherAlive] = useState(true);
  const [stFormFatherOcc, setStFormFatherOcc] = useState('');
  const [stFormMotherAlive, setStFormMotherAlive] = useState(true);
  const [stFormMotherOcc, setStFormMotherOcc] = useState('');
  const [stFormFamilyMembers, setStFormFamilyMembers] = useState('');
  const [stFormHousingStatus, setStFormHousingStatus] = useState<NonNullable<Student['housingStatus']>>('owned');
  const [stFormEconomicStatus, setStFormEconomicStatus] = useState<NonNullable<Student['economicStatus']>>('moderate');
  const [stFormLivingNotes, setStFormLivingNotes] = useState('');
  const [stFormArtistic, setStFormArtistic] = useState<string[]>([]);
  const [stFormArtisticOther, setStFormArtisticOther] = useState('');
  const [stFormCultural, setStFormCultural] = useState<string[]>([]);
  const [stFormCulturalOther, setStFormCulturalOther] = useState('');
  const [stFormSports, setStFormSports] = useState<string[]>([]);
  const [stFormSportsOther, setStFormSportsOther] = useState('');
  const [stFormTechnical, setStFormTechnical] = useState<string[]>([]);
  const [stFormTechnicalOther, setStFormTechnicalOther] = useState('');
  const [stFormPhysicalStatus, setStFormPhysicalStatus] = useState<NonNullable<Student['physicalHealthStatus']>>('healthy');
  const [stFormPhysicalConditions, setStFormPhysicalConditions] = useState<string[]>([]);
  const [stFormAllergies, setStFormAllergies] = useState('');
  const [stFormMedications, setStFormMedications] = useState('');
  const [stFormMentalStatus, setStFormMentalStatus] = useState<NonNullable<Student['mentalHealthStatus']>>('good');
  const [stFormMentalTopics, setStFormMentalTopics] = useState<string[]>([]);
  const [stFormWantsCounseling, setStFormWantsCounseling] = useState(false);
  const [stFormMentalNotes, setStFormMentalNotes] = useState('');
  const [stFormAssignmentStatus, setStFormAssignmentStatus] = useState<'none' | 'temporary' | 'confirmed'>('none');
  const [stFormBloodGroup, setStFormBloodGroup] = useState('O+');
  const [stFormSpecialCondition, setStFormSpecialCondition] = useState('ندارد');
  const [stFormCustomFields, setStFormCustomFields] = useState<Record<string, string>>({});
  const [stFormNewCustomKey, setStFormNewCustomKey] = useState('');
  const [stFormNewCustomVal, setStFormNewCustomVal] = useState('');
  const [stFormPhotoUrl, setStFormPhotoUrl] = useState<string>('');
  const [stFormProfileCompleted, setStFormProfileCompleted] = useState<boolean>(true);
  const [stFormError, setStFormError] = useState<string | null>(null);

  const activeApprovedMajorsList = getEffectiveApprovedMajors(localSettings, false);

  const handleOpenAddStudent = () => {
    const firstMajor = activeApprovedMajorsList[0];
    setEditingStudent(null);
    setStFormFullName('');
    setStFormStudentId('');
    setStFormNationalId('');
    setStFormField(firstMajor ? firstMajor.name : '');
    setStFormMajorCode(firstMajor ? normalizeMajorCode(firstMajor.code) : '');
    setStFormDegreeLevel(firstMajor ? firstMajor.degreeLevelName : '');
    setStFormEntryTerm('۴۰۲۱');
    setStFormFatherName('');
    setStFormMobile('');
    setStFormPhone('');
    setStFormEmergency('');
    setStFormProvince('اصفهان');
    setStFormCity('اصفهان');
    setStFormParentPhone('');
    setStFormPostalAddress('');
    setStFormBirthDate('1382/01/01');
    setStFormReligion('اسلام / شیعه');
    setStFormPreviousDorm('');
    setStFormPreviousRoom('');
    setStFormPreviousScore('100');
    setStFormResidenceType('dormitory');
    setStFormAdmissionStatus('not_admitted');
    setStFormCommuterReasons([]);
    setStFormCommuterNotes('');
    setStFormDormNotes('');
    setStFormMaritalStatus('single');
    setStFormHeadOfHousehold(false);
    setStFormFatherAlive(true);
    setStFormFatherOcc('');
    setStFormMotherAlive(true);
    setStFormMotherOcc('');
    setStFormFamilyMembers('');
    setStFormHousingStatus('owned');
    setStFormEconomicStatus('moderate');
    setStFormLivingNotes('');
    setStFormArtistic([]);
    setStFormArtisticOther('');
    setStFormCultural([]);
    setStFormCulturalOther('');
    setStFormSports([]);
    setStFormSportsOther('');
    setStFormTechnical([]);
    setStFormTechnicalOther('');
    setStFormPhysicalStatus('healthy');
    setStFormPhysicalConditions([]);
    setStFormAllergies('');
    setStFormMedications('');
    setStFormMentalStatus('good');
    setStFormMentalTopics([]);
    setStFormWantsCounseling(false);
    setStFormMentalNotes('');
    setStFormAssignmentStatus('none');
    setStFormBloodGroup('O+');
    setStFormSpecialCondition('ندارد');
    setStFormCustomFields({});
    setStFormNewCustomKey('');
    setStFormNewCustomVal('');
    setStFormPhotoUrl('');
    setStFormProfileCompleted(false);
    setStFormError(null);
    setIsAddStudentModalOpen(true);
  };

  const handleOpenEditStudent = (st: Student) => {
    setEditingStudent(st);
    setStFormFullName(st.fullName);
    setStFormStudentId(st.studentId);
    setStFormNationalId(st.nationalId);
    setStFormField(st.fieldOfStudy);
    setStFormMajorCode(st.majorCode || '');
    setStFormDegreeLevel(st.degreeLevel || '');
    setStFormEntryTerm(st.entryTerm);
    setStFormFatherName(st.fatherName || '');
    setStFormMobile(st.mobile || '');
    setStFormPhone(st.phone || '');
    setStFormEmergency(st.emergencyPhone || '');
    setStFormProvince(st.province || 'اصفهان');
    setStFormCity(st.city || 'اصفهان');
    setStFormParentPhone(st.parentPhone || '');
    setStFormPostalAddress(st.postalAddress || '');
    setStFormBirthDate(st.birthDate || '1382/01/01');
    setStFormReligion(st.religion || 'اسلام / شیعه');
    setStFormPreviousDorm(st.previousDorm || '');
    setStFormPreviousRoom(st.previousRoom || '');
    setStFormPreviousScore(String(st.previousScore ?? 100));
    setStFormResidenceType(getStudentResidenceType(st));
    setStFormAdmissionStatus(getStudentAdmissionStatus(st));
    setStFormCommuterReasons([...(st.commuterEligibilityReasons || [])]);
    setStFormCommuterNotes(st.commuterRequestNotes || '');
    setStFormDormNotes(st.dormitoryRequestNotes || '');
    setStFormMaritalStatus(st.maritalStatus || 'single');
    setStFormHeadOfHousehold(Boolean(st.isHeadOfHousehold));
    setStFormFatherAlive(st.fatherAlive !== undefined ? st.fatherAlive : true);
    setStFormFatherOcc(st.fatherOccupation || '');
    setStFormMotherAlive(st.motherAlive !== undefined ? st.motherAlive : true);
    setStFormMotherOcc(st.motherOccupation || '');
    setStFormFamilyMembers(st.familyMembersCount || '');
    setStFormHousingStatus(st.housingStatus || 'owned');
    setStFormEconomicStatus(st.economicStatus || 'moderate');
    setStFormLivingNotes(st.livingSituationNotes || '');
    setStFormArtistic([...(st.artisticSkills || [])]);
    setStFormArtisticOther(st.artisticOther || '');
    setStFormCultural([...(st.culturalActivities || [])]);
    setStFormCulturalOther(st.culturalOther || '');
    setStFormSports([...(st.sportsActivities || [])]);
    setStFormSportsOther(st.sportsOther || '');
    setStFormTechnical([...(st.technicalSkills || [])]);
    setStFormTechnicalOther(st.technicalOther || '');
    setStFormPhysicalStatus(st.physicalHealthStatus || 'healthy');
    setStFormPhysicalConditions([...(st.physicalConditions || [])]);
    setStFormAllergies(st.foodOrDrugAllergies || '');
    setStFormMedications(st.regularMedications || '');
    setStFormMentalStatus(st.mentalHealthStatus || 'good');
    setStFormMentalTopics([...(st.mentalHealthTopics || [])]);
    setStFormWantsCounseling(Boolean(st.wantsCounselingContact));
    setStFormMentalNotes(st.mentalHealthNotes || '');
    setStFormAssignmentStatus(st.assignmentStatus || (st.assignedBedId ? 'temporary' : 'none'));
    const rawCustom = st.customFields || {};
    setStFormBloodGroup(st.bloodType || String(rawCustom['گروه خونی'] || 'ثبت نشده'));
    setStFormSpecialCondition(st.medicalDetails || String(rawCustom['بیماری خاص'] || 'ندارد'));
    const otherCustom: Record<string, string> = {};
    const skipKeys = new Set([
      'گروه خونی',
      'بیماری خاص',
      'وضعیت سکونت',
      'علت ترددی',
      'شغل پدر',
      'شغل مادر',
      'رشته‌های هنری',
      'فعالیت‌های فرهنگی',
      'رشته‌های ورزشی',
      'مهارت‌های علمی و فنی',
      'وضعیت سلامت جسمی',
      'وضعیت سلامت روان',
    ]);
    Object.entries(rawCustom).forEach(([k, v]) => {
      if (!skipKeys.has(k)) {
        otherCustom[k] = String(v ?? '');
      }
    });
    setStFormCustomFields(otherCustom);
    setStFormNewCustomKey('');
    setStFormNewCustomVal('');
    setStFormPhotoUrl(st.photoUrl || '');
    setStFormProfileCompleted(Boolean(st.isProfileCompleted));
    setStFormError(null);
    setIsAddStudentModalOpen(true);
  };

  const handleAddStudentCustomField = () => {
    const key = stFormNewCustomKey.trim();
    if (!key) return;
    if (key === 'گروه خونی') {
      setStFormBloodGroup(stFormNewCustomVal.trim() || 'ثبت نشده');
    } else if (key === 'بیماری خاص') {
      setStFormSpecialCondition(stFormNewCustomVal.trim() || 'ندارد');
    } else {
      setStFormCustomFields((prev) => ({
        ...prev,
        [key]: stFormNewCustomVal.trim(),
      }));
    }
    setStFormNewCustomKey('');
    setStFormNewCustomVal('');
  };

  const handleAdminStudentPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setStFormError('حجم فایل عکس نباید بیشتر از ۵ مگابایت باشد.');
      return;
    }
    try {
      const compressed = await compressAvatarImageFile(file);
      setStFormPhotoUrl(compressed);
      setStFormError(null);
    } catch (err) {
      setStFormError(err instanceof Error ? err.message : 'خطا در پردازش تصویر انتخاب شده.');
    }
  };

  const handleSaveStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStFormError(null);
    if (!stFormFullName.trim() || !stFormStudentId.trim() || !stFormNationalId.trim()) {
      setStFormError('لطفاً نام و نام خانوادگی، شماره دانشجویی و کد ملی را تکمیل فرمایید.');
      return;
    }

    const targetStudentId = toEnglishDigits(stFormStudentId.trim());
    let resolvedPhotoUrl = stFormPhotoUrl || undefined;
    let photoCloudWarning = '';

    if (resolvedPhotoUrl && resolvedPhotoUrl.startsWith('data:image/')) {
      setApprovalFeedback({ type: 'success', message: '⏳ در حال بارگذاری تصویر پرسنلی در دیتابیس ابری...' });
      const cloudPhotoRes = await Storage.uploadSinglePhotoToCloud(
        'student',
        targetStudentId,
        resolvedPhotoUrl
      );
      if (cloudPhotoRes.supported && cloudPhotoRes.ok) {
        resolvedPhotoUrl = cloudPhotoRes.url;
      } else if (cloudPhotoRes.supported && !cloudPhotoRes.ok) {
        setApprovalFeedback(null);
        setStFormError(cloudPhotoRes.errorMessage || 'خطا در بارگذاری ابری تصویر پرسنلی.');
        return;
      } else {
        photoCloudWarning =
          ' (توجه: مسیر /api/photos/batch در server.js فعال نیست؛ عکس به صورت موقت ذخیره شد.)';
      }
    }

    const artisticSummary = joinSkillList(stFormArtistic, stFormArtisticOther);
    const culturalSummary = joinSkillList(stFormCultural, stFormCulturalOther);
    const sportsSummary = joinSkillList(stFormSports, stFormSportsOther);
    const technicalSummary = joinSkillList(stFormTechnical, stFormTechnicalOther);
    const specialHealthSummary = [
      ...stFormPhysicalConditions,
      stFormSpecialCondition.trim() !== 'ندارد' ? stFormSpecialCondition.trim() : '',
    ]
      .filter(Boolean)
      .join('، ');

    const mergedCustomFields: Record<string, string | number | boolean> = {
      ...stFormCustomFields,
      'گروه خونی': stFormBloodGroup || 'ثبت نشده',
      'بیماری خاص': specialHealthSummary || 'ندارد',
      'وضعیت سکونت':
        stFormResidenceType === 'commuter'
          ? 'ترددی (عدم نیاز به خوابگاه)'
          : 'متقاضی خوابگاه (خوابگاهی)',
      'شغل پدر': formatParentOccupation(stFormFatherAlive, stFormFatherOcc),
      'شغل مادر': formatParentOccupation(stFormMotherAlive, stFormMotherOcc),
      'وضعیت سلامت جسمی': PHYSICAL_HEALTH_STATUS_LABELS[stFormPhysicalStatus],
      'وضعیت سلامت روان': MENTAL_HEALTH_STATUS_LABELS[stFormMentalStatus],
    };
    if (stFormResidenceType === 'commuter' && stFormCommuterReasons.length > 0) {
      mergedCustomFields['علت ترددی'] = formatCommuterReasons(stFormCommuterReasons);
    }
    if (artisticSummary) mergedCustomFields['رشته‌های هنری'] = artisticSummary;
    if (culturalSummary) mergedCustomFields['فعالیت‌های فرهنگی'] = culturalSummary;
    if (sportsSummary) mergedCustomFields['رشته‌های ورزشی'] = sportsSummary;
    if (technicalSummary) mergedCustomFields['مهارت‌های علمی و فنی'] = technicalSummary;

    const structuredFields: Partial<Student> = {
      dormitoryRequestStatus:
        stFormResidenceType === 'commuter' ? 'not_needed_commuter' : 'requested',
      commuterEligibilityReasons: stFormCommuterReasons,
      commuterRequestNotes: stFormCommuterNotes.trim(),
      dormitoryRequestNotes: stFormDormNotes.trim(),
      maritalStatus: stFormMaritalStatus,
      isHeadOfHousehold: stFormHeadOfHousehold,
      fatherAlive: stFormFatherAlive,
      fatherOccupation: stFormFatherAlive ? stFormFatherOcc.trim() : '',
      motherAlive: stFormMotherAlive,
      motherOccupation: stFormMotherAlive ? stFormMotherOcc.trim() : '',
      familyMembersCount: stFormFamilyMembers.trim(),
      housingStatus: stFormHousingStatus,
      economicStatus: stFormEconomicStatus,
      livingSituationNotes: stFormLivingNotes.trim(),
      artisticSkills: stFormArtistic,
      artisticOther: stFormArtisticOther.trim(),
      culturalActivities: stFormCultural,
      culturalOther: stFormCulturalOther.trim(),
      sportsActivities: stFormSports,
      sportsOther: stFormSportsOther.trim(),
      technicalSkills: stFormTechnical,
      technicalOther: stFormTechnicalOther.trim(),
      bloodType: stFormBloodGroup || 'ثبت نشده',
      physicalHealthStatus: stFormPhysicalStatus,
      physicalConditions: stFormPhysicalConditions,
      foodOrDrugAllergies: stFormAllergies.trim(),
      regularMedications: stFormMedications.trim(),
      medicalDetails: stFormSpecialCondition.trim() === 'ندارد' ? '' : stFormSpecialCondition.trim(),
      mentalHealthStatus: stFormMentalStatus,
      mentalHealthTopics: stFormMentalTopics,
      wantsCounselingContact: stFormWantsCounseling,
      mentalHealthNotes: stFormMentalNotes.trim(),
    };

    const parsedScoreNum = Number(toEnglishDigits(stFormPreviousScore.trim()));
    const normalizedScore =
      stFormPreviousScore.trim() === ''
        ? 100
        : Number.isFinite(parsedScoreNum)
        ? parsedScoreNum
        : stFormPreviousScore.trim();

    let resolvedFieldName = stFormField.trim();
    let resolvedMajorCode = normalizeMajorCode(stFormMajorCode) || undefined;
    let resolvedDegreeLevel = stFormDegreeLevel.trim() || undefined;

    if (activeApprovedMajorsList.length > 0) {
      const matchedApproved = findExactApprovedMajorForStudent(
        { fieldOfStudy: resolvedFieldName, majorCode: resolvedMajorCode },
        activeApprovedMajorsList
      );
      if (!matchedApproved) {
        setStFormError('لطفاً یکی از رشته‌های تحصیلی مصوب ثبت‌شده در تنظیمات کل سامانه را انتخاب نمایید.');
        return;
      }
      resolvedFieldName = matchedApproved.name;
      resolvedMajorCode = normalizeMajorCode(matchedApproved.code);
      resolvedDegreeLevel = matchedApproved.degreeLevelName || resolvedDegreeLevel;
    }

    if (editingStudent) {
      const res = Storage.updateStudentAdmin(editingStudent.studentId, {
        studentId: targetStudentId,
        fullName: stFormFullName.trim(),
        nationalId: toEnglishDigits(stFormNationalId.trim()),
        fieldOfStudy: resolvedFieldName,
        majorCode: resolvedMajorCode,
        degreeLevel: resolvedDegreeLevel,
        entryTerm: stFormEntryTerm.trim(),
        fatherName: stFormFatherName.trim(),
        mobile: stFormMobile.trim(),
        phone: stFormPhone.trim(),
        emergencyPhone: stFormEmergency.trim(),
        parentPhone: stFormParentPhone.trim(),
        province: stFormProvince.trim(),
        city: stFormCity.trim(),
        postalAddress: stFormPostalAddress.trim(),
        birthDate: stFormBirthDate.trim() || '1382/01/01',
        religion: stFormReligion.trim() || 'اسلام / شیعه',
        previousDorm: stFormPreviousDorm.trim(),
        previousRoom: stFormPreviousRoom.trim(),
        previousScore: normalizedScore,
        residenceType: stFormResidenceType,
        admissionStatus: stFormAdmissionStatus,
        ...structuredFields,
        assignmentStatus: editingStudent.assignedBedId ? stFormAssignmentStatus : editingStudent.assignmentStatus,
        customFields: mergedCustomFields,
        photoUrl: resolvedPhotoUrl,
        isProfileCompleted: stFormProfileCompleted,
      });
      if (!res.success) {
        setApprovalFeedback(null);
        setStFormError(res.message);
        return;
      }
      setApprovalFeedback({ type: 'success', message: '⏳ در حال همگام‌سازی ویرایش در دیتابیس ابری...' });
      const syncRes = await Storage.waitForPendingCloudSync();
      setApprovalFeedback({
        type: syncRes.success ? 'success' : 'error',
        message: syncRes.success
          ? `${res.message}${photoCloudWarning}`
          : `${res.message} (هشدار: همگام‌سازی با سرور ابری با خطا مواجه شد.)`,
      });
    } else {
      const newSt: Student = {
        studentId: targetStudentId,
        nationalId: toEnglishDigits(stFormNationalId.trim()),
        fullName: stFormFullName.trim(),
        fieldOfStudy: resolvedFieldName,
        majorCode: resolvedMajorCode,
        degreeLevel: resolvedDegreeLevel,
        entryTerm: stFormEntryTerm.trim(),
        fatherName: stFormFatherName.trim(),
        birthDate: stFormBirthDate.trim() || '1382/01/01',
        province: stFormProvince.trim(),
        city: stFormCity.trim(),
        postalAddress: stFormPostalAddress.trim(),
        phone: stFormPhone.trim(),
        mobile: stFormMobile.trim(),
        emergencyPhone: stFormEmergency.trim(),
        parentPhone: stFormParentPhone.trim(),
        religion: stFormReligion.trim() || 'اسلام / شیعه',
        previousDorm: stFormPreviousDorm.trim(),
        previousRoom: stFormPreviousRoom.trim(),
        previousScore: normalizedScore,
        residenceType: stFormResidenceType,
        admissionStatus: stFormAdmissionStatus,
        ...structuredFields,
        customFields: mergedCustomFields,
        photoUrl: resolvedPhotoUrl,
        isProfileCompleted: stFormProfileCompleted,
        assignmentStatus: 'none',
      };
      setApprovalFeedback({ type: 'success', message: '⏳ در حال ارسال به دیتابیس ابری...' });
      const res = await Storage.addStudentToDB(newSt);
      if (!res.success) {
        setApprovalFeedback(null);
        setStFormError(res.message);
        return;
      }
      const syncRes = await Storage.waitForPendingCloudSync();
      setApprovalFeedback({
        type: syncRes.success ? 'success' : 'error',
        message: syncRes.success
          ? `${res.message} و با تمام جداول ابری همگام شد.${photoCloudWarning}`
          : `${res.message} اما همگام‌سازی جدول کل دانشجویان با تأخیر مواجه شد و به‌صورت خودکار مجدداً ارسال خواهد شد.${photoCloudWarning}`,
      });
    }

    setIsAddStudentModalOpen(false);
    onRefreshData();
    setTimeout(() => setApprovalFeedback(null), 4000);
  };

  const handleDeleteStudent = (st: Student) => {
    setAdminConfirmDialog({
      title: 'حذف کامل دانشجو',
      message: `آیا از حذف کامل دانشجو «${st.fullName}» با کد دانشجویی ${st.studentId} از سامانه مطمئن هستید؟ در صورت اسکان، تخت وی آزاد خواهد شد.`,
      confirmLabel: 'تأیید و حذف دانشجو',
      onConfirm: () => {
        const res = Storage.deleteStudent(st.studentId);
        setApprovalFeedback({ type: 'success', message: res.message });
        onRefreshData();
        setTimeout(() => setApprovalFeedback(null), 3500);
      },
    });
  };

  // تخلیه دانشجو از اتاق و آزادسازی تخت توسط مدیر
  const handleAdminEvictStudent = (st: Student) => {
    const r = rooms.find((rm) => rm.id === st.assignedRoomId);
    setAdminConfirmDialog({
      title: 'تخلیه و لغو اسکان دانشجو',
      message: `آیا از تخلیه و لغو اسکان دانشجو «${st.fullName}» از اتاق ${r?.roomNumber || ''} اطمینان دارید؟ تخت مربوطه فوراً آزاد گردیده و وضعیت اسکان دانشجو به «فاقد اسکان» تغییر خواهد کرد.`,
      confirmLabel: 'تأیید و آزادسازی تخت',
      onConfirm: () => {
        const res = Storage.releaseBed(st.studentId);
        setApprovalFeedback({ type: 'success', message: res.message });
        onRefreshData();
        setTimeout(() => setApprovalFeedback(null), 3500);
      },
    });
  };

  // باز کردن مدال تعیین یا جابجایی اتاق و تخت دانشجو
  const handleOpenAssignStudentModal = (st: Student) => {
    setAssigningStudent(st);
    const vacantBedByRoomId = new Map<string, Bed[]>();
    beds.forEach((b) => {
      if (!b.studentId) {
        const list = vacantBedByRoomId.get(b.roomId) || [];
        list.push(b);
        vacantBedByRoomId.set(b.roomId, list);
      }
    });

    const preferredDorm =
      (st.assignedDormId && dorms.find((d) => d.id === st.assignedDormId)) ||
      dorms.find((d) =>
        rooms.some((r) => r.dormId === d.id && (vacantBedByRoomId.get(r.id)?.length || 0) > 0)
      ) ||
      dorms[0];

    const firstDorm = preferredDorm?.id || '';
    setAssignTargetDormId(firstDorm);

    const dormRooms = rooms.filter((r) => r.dormId === firstDorm);
    const firstRoomWithVacancy =
      dormRooms.find((r) => (vacantBedByRoomId.get(r.id)?.length || 0) > 0) || dormRooms[0];
    const firstRoom = firstRoomWithVacancy?.id || '';
    setAssignTargetRoomId(firstRoom);

    const availableBeds = beds.filter((b) => b.roomId === firstRoom && !b.studentId);
    setAssignTargetBedId(availableBeds[0]?.id || '');
    setAssignIsConfirmed(st.assignmentStatus === 'temporary' ? false : true);
    setAssignFeedback(null);
  };

  // تأیید تخصیص اتاق و تخت خالی به دانشجو توسط مدیر
  const handleConfirmStudentBedAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningStudent) return;
    if (!assignTargetBedId) {
      setAssignFeedback('لطفاً یک تخت خالی را انتخاب فرمایید.');
      return;
    }

    const res = Storage.assignBedToStudent(assigningStudent.studentId, assignTargetBedId, assignIsConfirmed);
    if (res.success) {
      setApprovalFeedback({ type: 'success', message: res.message });
      setAssigningStudent(null);
      onRefreshData();
      setTimeout(() => setApprovalFeedback(null), 3500);
    } else {
      setAssignFeedback(res.message);
    }
  };

  // ثبت سرای دانشجویی جدید توسط مدیر
  const handleAddDormitorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDormName.trim()) return;
    const newDormId = `dorm_${Date.now()}`;
    const res = Storage.addDormitory({
      id: newDormId,
      name: newDormName.trim(),
      campus: newDormCampus.trim(),
      gender: newDormGender,
      totalFloors: newDormFloors,
      description: newDormDesc.trim(),
      address: newDormAddress.trim(),
      supervisorName: newDormSupervisor.trim() || undefined,
    });
    if (res.success) {
      setApprovalFeedback({ type: 'success', message: res.message });
      setIsAddDormModalOpen(false);
      setNewDormName('');
      setNewDormDesc('');
      setNewDormAddress('');
      setNewDormSupervisor('');
      onRefreshData();
      setTimeout(() => setApprovalFeedback(null), 3500);
    } else {
      setAdminNoticeDialog({ title: 'خطا در ثبت سرا', message: res.message, tone: 'error' });
    }
  };

  // حذف سرا توسط مدیر
  const handleDeleteDormitory = (dormId: string, dormName: string) => {
    setAdminConfirmDialog({
      title: `حذف سرای «${dormName}»`,
      message: `آیا از حذف کامل سرای «${dormName}» به همراه کلیه اتاق‌ها، تخت‌ها و لغو اسکان دانشجویان ساکن در آن اطمینان دارید؟`,
      confirmLabel: 'تأیید و حذف کامل سرا',
      onConfirm: () => {
        const res = Storage.deleteDormitory(dormId);
        setApprovalFeedback({ type: res.success ? 'success' : 'error', message: res.message });
        onRefreshData();
        setTimeout(() => setApprovalFeedback(null), 3500);
      },
    });
  };

  // ثبت اتاق جدید با تخت‌های دوطبقه توسط مدیر
  const handleAddRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumberInput.trim() || !roomDormId) return;
    const res = Storage.addRoomWithBeds(roomDormId, roomNumberInput.trim(), roomFloorInput, roomCapacityInput);
    if (res.success) {
      setApprovalFeedback({ type: 'success', message: res.message });
      setIsAddRoomModalOpen(false);
      setRoomNumberInput('');
      onRefreshData();
      setTimeout(() => setApprovalFeedback(null), 3500);
    } else {
      setAdminNoticeDialog({ title: 'خطا در ثبت اتاق', message: res.message, tone: 'error' });
    }
  };

  // باز کردن مدال ویرایش و تغییر نام سرا
  const handleOpenEditDorm = (dorm: Dormitory) => {
    setEditingDorm(dorm);
    setEditDormName(dorm.name);
    setEditDormCampus(dorm.campus || '');
    setEditDormGender(dorm.gender);
    setEditDormFloors(dorm.totalFloors || 1);
    setEditDormSupervisor(dorm.supervisorName || '');
    setEditDormAddress(dorm.address || '');
    setEditDormError(null);
  };

  const handleEditDormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDorm) return;
    const res = Storage.updateDormitory(editingDorm.id, {
      name: editDormName.trim(),
      campus: editDormCampus.trim(),
      gender: editDormGender,
      totalFloors: editDormFloors,
      supervisorName: editDormSupervisor.trim() || undefined,
      address: editDormAddress.trim() || undefined,
    });
    if (res.success) {
      setApprovalFeedback({ type: 'success', message: res.message });
      setEditingDorm(null);
      onRefreshData();
      setTimeout(() => setApprovalFeedback(null), 3500);
    } else {
      setEditDormError(res.message);
    }
  };

  // باز کردن مدال ویرایش و تغییر نام / شماره اتاق
  const handleOpenEditRoom = (room: Room) => {
    setEditingRoom(room);
    setEditRoomNumber(room.roomNumber);
    setEditRoomFloor(room.floor ?? 1);
    setEditRoomError(null);
  };

  const handleEditRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    const res = Storage.updateRoom(editingRoom.id, {
      roomNumber: editRoomNumber.trim(),
      floor: editRoomFloor,
    });
    if (res.success) {
      setApprovalFeedback({ type: 'success', message: res.message });
      setEditingRoom(null);
      onRefreshData();
      setTimeout(() => setApprovalFeedback(null), 3500);
    } else {
      setEditRoomError(res.message);
    }
  };

  // حذف اتاق توسط مدیر
  const handleDeleteRoom = (roomId: string, roomNum: string) => {
    setAdminConfirmDialog({
      title: `حذف کامل اتاق ${roomNum}`,
      message: `آیا از حذف کامل اتاق ${roomNum} و آزادسازی کلیه تخت‌ها و اسکان دانشجویان آن اطمینان دارید؟`,
      confirmLabel: 'تأیید و حذف اتاق',
      onConfirm: () => {
        const res = Storage.deleteRoom(roomId);
        setApprovalFeedback({ type: 'success', message: res.message });
        onRefreshData();
        setTimeout(() => setApprovalFeedback(null), 3500);
      },
    });
  };

  // افزودن تخت مجزا به اتاق
  const handleAddBedToRoom = (roomId: string, tier: 'lower' | 'upper') => {
    const res = Storage.addBedToRoom(roomId, tier);
    setApprovalFeedback({ type: res.success ? 'success' : 'error', message: res.message });
    onRefreshData();
    setTimeout(() => setApprovalFeedback(null), 3500);
  };

  // حذف یک تخت توسط مدیر
  const handleDeleteBed = (bedId: string, bedLabel: string) => {
    setAdminConfirmDialog({
      title: `حذف ${bedLabel}`,
      message: `آیا از حذف «${bedLabel}» اطمینان دارید؟ در صورت اسکان دانشجو، تخت آزاد می‌گردد.`,
      confirmLabel: 'تأیید و حذف تخت',
      onConfirm: () => {
        const res = Storage.deleteBed(bedId);
        setApprovalFeedback({ type: res.success ? 'success' : 'error', message: res.message });
        onRefreshData();
        setTimeout(() => setApprovalFeedback(null), 3500);
      },
    });
  };

  const handleStartEditAnnouncement = (ann: Announcement) => {
    setEditingAnnId(ann.id);
    setNewAnnTitle(ann.title);
    setNewAnnContent(ann.content);
    setNewAnnContentHtml(ann.contentHtml || plainTextToHtml(ann.content));
    setAnnEditorResetKey((k) => k + 1);
    setNewAnnPriority(ann.priority);
    setNewAnnTargetDormId(ann.targetDormId || 'all');
    setNewAnnShowOnHome(ann.showOnHomePage !== false);
    setNewAnnPublishInNotifications(Boolean(ann.publishInNotifications));
    setNewAnnPinned(ann.pinned || false);
    setNewAnnImage(ann.imageUrl || null);
    setMainTab('announcements');
  };

  const handleCancelEditAnnouncement = () => {
    setEditingAnnId(null);
    setNewAnnTitle('');
    setNewAnnContent('');
    setNewAnnContentHtml('');
    setAnnEditorResetKey((k) => k + 1);
    setNewAnnPriority('normal');
    setNewAnnTargetDormId('all');
    setNewAnnShowOnHome(true);
    setNewAnnPublishInNotifications(false);
    setNewAnnPinned(false);
    setNewAnnImage(null);
  };

  const handleAnnImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAdminNoticeDialog({
        title: 'حجم تصویر بیش از حد مجاز',
        message: 'حجم عکس اطلاعیه نباید بیشتر از ۵ مگابایت باشد.',
        tone: 'error',
      });
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewAnnImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // محاسبه آمار سراها برای کارتابل سرپرستی مدیر
  const activeCartableDormIds = selectedCartableDormId === 'all'
    ? dorms.map((d) => d.id)
    : [selectedCartableDormId];

  const cartableDorms = selectedCartableDormId === 'all'
    ? dorms
    : dorms.filter((d) => d.id === selectedCartableDormId);

  const cartableBeds = beds.filter((b) => activeCartableDormIds.includes(b.dormId));
  const cartableTotalBeds = cartableBeds.length;
  const cartableOccupiedBeds = cartableBeds.filter((b) => b.studentId).length;
  const cartableVacantBeds = cartableTotalBeds - cartableOccupiedBeds;
  const cartableOccupancyRate = cartableTotalBeds > 0 ? Math.round((cartableOccupiedBeds / cartableTotalBeds) * 100) : 0;

  // فیلتر اخطارهای کارتابل
  const cartableWarnings = warnings.filter((w) =>
    selectedCartableDormId === 'all' ? true : w.dormId === selectedCartableDormId
  );

  const handleBulkApprove = () => {
    if (pendingStudents.length === 0) return;
    setAdminConfirmDialog({
      title: 'تأیید دسته‌جمعی اسکان موقت',
      message: `آیا از تأیید دسته‌جمعی کلیه درخواست‌های اسکان موقت (${pendingStudents.length} دانشجو) اطمینان دارید؟ وضعیت اسکان همه آنها قطعی خواهد شد.`,
      confirmLabel: 'تأیید دسته‌جمعی',
      isPositive: true,
      onConfirm: () => {
        const res = Storage.bulkConfirmAllAssignments();
        setApprovalFeedback({ type: 'success', message: res.message });
        onRefreshData();
        setTimeout(() => setApprovalFeedback(null), 4000);
      },
    });
  };

  const handleConfirmSingle = (studentId: string) => {
    const res = Storage.confirmStudentAssignment(studentId);
    setApprovalFeedback({ type: 'success', message: res.message });
    onRefreshData();
    setTimeout(() => setApprovalFeedback(null), 3000);
  };

  const handleRejectSingle = (studentId: string) => {
    setAdminRejectDialog({
      studentId,
      reason: 'عدم تطابق با ضوابط یا تکمیل ظرفیت',
    });
  };

  // ایجاد و انتشار یا ویرایش اطلاعیه توسط مدیر
  const handleAdminCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) {
      setAdminNoticeDialog({
        title: 'اطلاعات ناقص اطلاعیه',
        message: 'لطفاً عنوان و متن اطلاعیه را وارد نمایید.',
        tone: 'error',
      });
      return;
    }

    const sanitizedHtml = sanitizeRichHtml(newAnnContentHtml) || plainTextToHtml(newAnnContent.trim());

    if (editingAnnId) {
      const allAnnouncements = Storage.getAnnouncements();
      const idx = allAnnouncements.findIndex((a) => a.id === editingAnnId);
      if (idx !== -1) {
        allAnnouncements[idx] = {
          ...allAnnouncements[idx],
          title: newAnnTitle.trim(),
          content: newAnnContent.trim(),
          contentHtml: sanitizedHtml,
          priority: newAnnPriority,
          targetDormId: newAnnTargetDormId,
          showOnHomePage: newAnnShowOnHome,
          publishInNotifications: newAnnPublishInNotifications,
          pinned: newAnnPinned,
          imageUrl: newAnnImage || undefined,
        };
        Storage.setAnnouncements(allAnnouncements);
      }
      setEditingAnnId(null);
      setAnnFeedback('اطلاعیه با موفقیت ویرایش و بروزرسانی گردید.');
    } else {
      Storage.addAnnouncement({
        title: newAnnTitle.trim(),
        content: newAnnContent.trim(),
        contentHtml: sanitizedHtml,
        author: 'مدیریت کل سامانه جامع خدمات دانشجویی',
        priority: newAnnPriority,
        date: new Date().toLocaleDateString('fa-IR'),
        targetDormId: newAnnTargetDormId,
        showOnHomePage: newAnnShowOnHome,
        publishInNotifications: newAnnPublishInNotifications,
        pinned: newAnnPinned,
        imageUrl: newAnnImage || undefined,
      });
      setAnnFeedback(
        newAnnPublishInNotifications
          ? 'اطلاعیه با موفقیت ثبت شد و در نوتیفیکیشن کاربران نیز منتشر گردید.'
          : 'اطلاعیه با موفقیت ثبت شد (بدون ارسال در نوتیفیکیشن کاربران).'
      );
    }

    setNewAnnTitle('');
    setNewAnnContent('');
    setNewAnnContentHtml('');
    setAnnEditorResetKey((k) => k + 1);
    setNewAnnPriority('normal');
    setNewAnnTargetDormId('all');
    setNewAnnShowOnHome(true);
    setNewAnnPublishInNotifications(false);
    setNewAnnPinned(false);
    setNewAnnImage(null);
    setTimeout(() => setAnnFeedback(null), 3500);
    onRefreshData();
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAdminConfirmDialog({
      title: 'حذف اطلاعیه',
      message: 'آیا از حذف این اطلاعیه اطمینان دارید؟',
      confirmLabel: 'حذف اطلاعیه',
      onConfirm: () => {
        Storage.deleteAnnouncement(id);
        setAnnFeedback('اطلاعیه با موفقیت حذف شد.');
        setTimeout(() => setAnnFeedback(null), 3000);
        onRefreshData();
      },
    });
  };

  const handleToggleAnnouncementHome = (id: string) => {
    Storage.toggleAnnouncementHomePage(id);
    onRefreshData();
  };

  const handleToggleAnnouncementNotifications = (id: string) => {
    Storage.toggleAnnouncementNotifications(id);
    onRefreshData();
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    Storage.setSettings(localSettings);
    Storage.addActivityLog({
      category: 'settings',
      action: 'بروزرسانی تنظیمات سال تحصیلی و سامانه',
      details: `سال تحصیلی: ${localSettings.currentAcademicYear}، وضعیت انتخاب اتاق: ${localSettings.selectionActive ? 'فعال' : 'غیرفعال'}`,
      targetName: localSettings.currentAcademicYear,
    });
    setActivityLogs(Storage.getActivityLogs());
    onUpdateSettings(localSettings);
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 3000);
  };

  // دکمه فوری باز یا بسته کردن امکان انتخاب اتاق و تخت برای دانشجویان
  const handleToggleSelectionActive = () => {
    const nextActive = !settings.selectionActive;
    const updated: AppSettings = {
      ...settings,
      selectionActive: nextActive,
    };
    setLocalSettings(updated);
    Storage.setSettings(updated);
    Storage.addActivityLog({
      category: 'settings',
      action: nextActive ? 'باز کردن امکان انتخاب اتاق و تخت' : 'بستن امکان انتخاب اتاق و تخت',
      details: nextActive
        ? 'امکان انتخاب و جابجایی اتاق و تخت توسط مدیر سامانه برای دانشجویان باز (فعال) شد.'
        : 'امکان انتخاب و جابجایی اتاق و تخت توسط مدیر سامانه برای دانشجویان بسته (غیرفعال) شد.',
      targetName: nextActive ? 'انتخاب اتاق: باز' : 'انتخاب اتاق: بسته',
      severity: nextActive ? 'info' : 'warning',
    });
    setActivityLogs(Storage.getActivityLogs());
    onUpdateSettings(updated);
    setApprovalFeedback({
      type: 'success',
      message: nextActive
        ? 'امکان انتخاب اتاق و تخت برای دانشجویان با موفقیت باز (فعال) و در سرور ذخیره شد.'
        : 'امکان انتخاب اتاق و تخت برای دانشجویان با موفقیت بسته (غیرفعال) و در سرور ذخیره شد.',
    });
    setTimeout(() => setApprovalFeedback(null), 4000);
  };

  // دکمه فوری باز یا بسته کردن دسترسی ویرایش ثانویه اطلاعات و تغییر عکس توسط دانشجویان
  const handleToggleStudentSecondaryEdit = () => {
    const nextEnabled = !Boolean(localSettings.studentSecondaryEditEnabled);
    const updated: AppSettings = {
      ...localSettings,
      studentSecondaryEditEnabled: nextEnabled,
    };
    setLocalSettings(updated);
    Storage.setSettings(updated);
    Storage.addActivityLog({
      category: 'settings',
      action: nextEnabled
        ? 'باز کردن دسترسی ویرایش ثانویه اطلاعات دانشجویان'
        : 'بستن دسترسی ویرایش ثانویه اطلاعات دانشجویان',
      details: nextEnabled
        ? 'امکان ویرایش مجدد اطلاعات و تغییر عکس پرسنلی برای دانشجویانی که پرونده خود را تکمیل کرده‌اند باز شد.'
        : 'پس از ثبت اولیه پرونده، دسترسی ویرایش مجدد اطلاعات و تغییر عکس توسط دانشجو بسته شد.',
      targetName: nextEnabled ? 'ویرایش ثانویه دانشجو: باز' : 'ویرایش ثانویه دانشجو: بسته',
      severity: nextEnabled ? 'info' : 'warning',
    });
    setActivityLogs(Storage.getActivityLogs());
    onUpdateSettings(updated);
    setApprovalFeedback({
      type: 'success',
      message: nextEnabled
        ? 'دسترسی ویرایش ثانویه اطلاعات و تغییر عکس برای دانشجویان باز شد.'
        : 'دسترسی ویرایش ثانویه اطلاعات و تغییر عکس برای دانشجویان بسته (قفل) شد.',
    });
    setTimeout(() => setApprovalFeedback(null), 4000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setAdminNoticeDialog({
          title: 'حجم تصویر بیش از حد مجاز',
          message: 'حجم تصویر آرم نباید بیشتر از ۳ مگابایت باشد.',
          tone: 'error',
        });
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const updated = { ...localSettings, customLogoUrl: base64 };
        setLocalSettings(updated);
        Storage.setSettings(updated);
        onUpdateSettings(updated);
        setSaveStatus(true);
        setTimeout(() => setSaveStatus(false), 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    const updated = { ...localSettings, customLogoUrl: undefined };
    setLocalSettings(updated);
    Storage.setSettings(updated);
    onUpdateSettings(updated);
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const handleAdminFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const { added: parsedFonts, errors } = await readMultipleFontFiles(files, adminFontName);
    e.target.value = '';

    if (parsedFonts.length === 0) {
      setAdminFontFeedback({
        type: 'error',
        message: errors[0] || 'فایل فونت معتبری انتخاب نشد.',
      });
      setTimeout(() => setAdminFontFeedback(null), 4500);
      return;
    }

    const existingFonts = localSettings.customFonts || [];
    const updatedFonts = [...existingFonts, ...parsedFonts];
    const shouldActivateFirst = adminActivateFontOnUpload;
    const firstUploaded = parsedFonts[0];

    const updatedSettings: AppSettings = {
      ...localSettings,
      customFonts: updatedFonts,
      ...(shouldActivateFirst
        ? {
            fontFamily: firstUploaded.fontFamily,
            activeCustomFontId: firstUploaded.id,
          }
        : {}),
    };

    setLocalSettings(updatedSettings);
    Storage.setSettings(updatedSettings);
    onUpdateSettings(updatedSettings);
    setAdminFontName('');

    const countText =
      parsedFonts.length === 1
        ? `فونت «${firstUploaded.name}»`
        : `${parsedFonts.length} فونت جدید`;
    const activeNote = shouldActivateFirst
      ? ' و به عنوان فونت نمایش سایت فعال شد.'
      : ' به لیست فونت‌های سامانه اضافه شد (از فهرست زیر قابل انتخاب است).';
    const warningNote = errors.length > 0 ? ` (${errors.length} فایل نامعتبر نادیده گرفته شد)` : '';

    setAdminFontFeedback({
      type: 'success',
      message: `${countText}${activeNote}${warningNote}`,
    });
    setTimeout(() => setAdminFontFeedback(null), 5000);
  };

  const handleSelectSiteFont = (fontFamily: AppSettings['fontFamily'], customFontId?: string) => {
    const updatedSettings: AppSettings = {
      ...localSettings,
      fontFamily,
      activeCustomFontId: customFontId,
    };
    setLocalSettings(updatedSettings);
    Storage.setSettings(updatedSettings);
    onUpdateSettings(updatedSettings);
    setAdminFontFeedback({
      type: 'success',
      message: 'فونت نمایش کل سامانه با موفقیت تغییر یافت.',
    });
    setTimeout(() => setAdminFontFeedback(null), 3000);
  };

  const handleDeleteAdminCustomFont = (fontId: string, fontCssFamily: string) => {
    const remainingFonts = (localSettings.customFonts || []).filter((f) => f.id !== fontId);
    const wasActive =
      localSettings.activeCustomFontId === fontId || localSettings.fontFamily === fontCssFamily;
    const updatedSettings: AppSettings = {
      ...localSettings,
      customFonts: remainingFonts,
      ...(wasActive ? { fontFamily: 'vazir', activeCustomFontId: undefined } : {}),
    };
    setLocalSettings(updatedSettings);
    Storage.setSettings(updatedSettings);
    onUpdateSettings(updatedSettings);
    setAdminFontFeedback({
      type: 'success',
      message: 'فونت سفارشی حذف گردید.',
    });
    setTimeout(() => setAdminFontFeedback(null), 3000);
  };

  const handleAdminWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAdminNoticeDialog({
        title: 'حجم تصویر بیش از حد مجاز',
        message: 'حجم عکس پس‌زمینه نباید بیشتر از ۵ مگابایت باشد.',
        tone: 'error',
      });
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const updated: AppSettings = {
        ...localSettings,
        customWallpaperUrl: dataUrl,
        wallpaper: 'custom',
      };
      setLocalSettings(updated);
      Storage.setSettings(updated);
      onUpdateSettings(updated);
      setAdminNoticeDialog({
        title: 'تغییر تصویر پس‌زمینه',
        message: 'تصویر پس‌زمینه سایت با موفقیت تغییر یافت و فعال شد.',
        tone: 'success',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAdminDeleteWallpaper = () => {
    const updated: AppSettings = {
      ...localSettings,
      customWallpaperUrl: undefined,
      wallpaper: 'pattern-islamic',
    };
    setLocalSettings(updated);
    Storage.setSettings(updated);
    onUpdateSettings(updated);
  };

  // شخصی‌سازی پس‌زمینه کادر بنر اصلی صفحه اول سایت
  const applyHeroSettings = (patch: Partial<AppSettings>, message: string) => {
    const updated: AppSettings = {
      ...localSettingsRef.current,
      ...patch,
    };
    const saved = Storage.setSettings(updated);
    if (!saved) {
      setHeroBgFeedback({
        type: 'error',
        message:
          'ذخیره تصویر پس‌زمینه در حافظه مرورگر با خطا مواجه شد (حجم ذخیره‌سازی پر است). لطفاً تصویر سبک‌تری انتخاب کنید.',
      });
      setTimeout(() => setHeroBgFeedback(null), 5000);
      return;
    }
    localSettingsRef.current = updated;
    setLocalSettings(updated);
    onUpdateSettings(updated);
    setHeroBgFeedback({ type: 'success', message });
    setTimeout(() => setHeroBgFeedback(null), 3500);
  };

  const compressHeroBannerImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('خطا در خواندن فایل تصویر.'));
      reader.onload = (ev) => {
        const rawDataUrl = ev.target?.result as string;
        if (!rawDataUrl) {
          reject(new Error('فایل تصویر معتبر نیست.'));
          return;
        }
        const img = new Image();
        img.onerror = () => reject(new Error('فرمت این تصویر توسط مرورگر پشتیبانی نمی‌شود.'));
        img.onload = () => {
          const encodeWithLimit = (maxW: number, maxH: number, quality: number): string => {
            let targetW = img.naturalWidth || img.width || 1200;
            let targetH = img.naturalHeight || img.height || 600;
            if (targetW > maxW || targetH > maxH) {
              const ratio = Math.min(maxW / targetW, maxH / targetH);
              targetW = Math.max(1, Math.round(targetW * ratio));
              targetH = Math.max(1, Math.round(targetH * ratio));
            }
            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            if (!ctx) return rawDataUrl;
            ctx.fillStyle = '#0f766e';
            ctx.fillRect(0, 0, targetW, targetH);
            ctx.drawImage(img, 0, 0, targetW, targetH);
            return canvas.toDataURL('image/jpeg', quality);
          };

          try {
            let compressed = encodeWithLimit(1400, 700, 0.82);
            if (compressed.length > 280_000) {
              compressed = encodeWithLimit(1200, 600, 0.7);
            }
            if (compressed.length > 280_000) {
              compressed = encodeWithLimit(960, 480, 0.58);
            }
            resolve(compressed);
          } catch {
            resolve(rawDataUrl);
          }
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleHeroBgModeChange = (mode: 'default' | 'color' | 'image') => {
    if (mode === 'default') {
      applyHeroSettings(
        { heroBgMode: 'default' },
        'پس‌زمینه کادر بنر صفحه اول به حالت پیش‌فرض سامانه بازگشت.'
      );
      return;
    }
    if (mode === 'color') {
      applyHeroSettings(
        {
          heroBgMode: 'color',
          heroBgColor: localSettingsRef.current.heroBgColor || HERO_PRESET_COLORS[0].hex,
        },
        'حالت رنگ دلخواه برای پس‌زمینه بنر صفحه اول انتخاب شد.'
      );
      return;
    }
    applyHeroSettings(
      { heroBgMode: 'image' },
      localSettingsRef.current.heroBgImageUrl
        ? 'تصویر بارگذاری‌شده برای پس‌زمینه بنر صفحه اول فعال شد.'
        : 'اکنون یک تصویر از کادر زیر برای پس‌زمینه بنر صفحه اول انتخاب کنید.'
    );
  };

  const handleHeroBgColorChange = (hex: string) => {
    applyHeroSettings(
      { heroBgMode: 'color', heroBgColor: hex },
      'رنگ پس‌زمینه بنر اصلی صفحه اول ذخیره و اعمال شد.'
    );
  };

  const handleHeroBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setHeroBgFeedback({
        type: 'error',
        message: 'حجم فایل تصویر بنر نباید بیشتر از ۱۰ مگابایت باشد.',
      });
      setTimeout(() => setHeroBgFeedback(null), 4000);
      return;
    }
    try {
      const compressedDataUrl = await compressHeroBannerImage(file);
      applyHeroSettings(
        { heroBgMode: 'image', heroBgImageUrl: compressedDataUrl },
        'تصویر پس‌زمینه بنر اصلی صفحه اول با موفقیت بارگذاری و فعال شد.'
      );
    } catch (err) {
      setHeroBgFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'بارگذاری تصویر با خطا مواجه شد. لطفاً فایل تصویر دیگری امتحان کنید.',
      });
      setTimeout(() => setHeroBgFeedback(null), 4500);
    }
  };

  const handleResetHeroBg = () => {
    applyHeroSettings(
      { heroBgMode: 'default', heroBgColor: undefined, heroBgImageUrl: undefined },
      'پس‌زمینه بنر صفحه اول به حالت پیش‌فرض اولیه بازنشانی شد.'
    );
  };

  // ویرایش بخش نکات مهم انتخاب اتاق و اسکان در صفحه اول
  const handleUpdateHomeNote = (id: string, patch: Partial<HomeNoteItem>) => {
    setDraftHomeNotes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const handleAddHomeNote = () => {
    const newIndex = draftHomeNotes.length + 1;
    setDraftHomeNotes((prev) => [
      ...prev,
      {
        id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: `${newIndex.toLocaleString('fa-IR')}. نکته جدید:`,
        body: 'متن توضیحی نکته جدید را در اینجا بنویسید...',
      },
    ]);
    setHomeNotesEditorKey((k) => k + 1);
  };

  const handleDeleteHomeNote = (id: string) => {
    if (draftHomeNotes.length <= 1) {
      setHomeNotesFeedback({
        type: 'error',
        message: 'حداقل یک کارت نکته باید در این بخش وجود داشته باشد.',
      });
      setTimeout(() => setHomeNotesFeedback(null), 3500);
      return;
    }
    setDraftHomeNotes((prev) => prev.filter((item) => item.id !== id));
    setHomeNotesEditorKey((k) => k + 1);
  };

  const handleSaveHomeNotes = () => {
    const cleanTitle = draftHomeNotesTitle.trim() || DEFAULT_HOME_NOTES_TITLE;
    const cleanedNotes: HomeNoteItem[] = draftHomeNotes
      .map((item) => ({
        id: item.id,
        title: item.title.trim(),
        body: item.body.trim(),
        bodyHtml: item.bodyHtml ? sanitizeRichHtml(item.bodyHtml) : undefined,
      }))
      .filter((item) => item.title || item.body);

    if (cleanedNotes.length === 0) {
      setHomeNotesFeedback({
        type: 'error',
        message: 'لطفاً حداقل یک نکته با عنوان یا متن معتبر وارد فرمایید.',
      });
      setTimeout(() => setHomeNotesFeedback(null), 3500);
      return;
    }

    const updated: AppSettings = {
      ...localSettings,
      homeNotesTitle: cleanTitle,
      homeNotes: cleanedNotes,
    };
    setLocalSettings(updated);
    Storage.setSettings(updated);
    Storage.addActivityLog({
      category: 'settings',
      action: 'ویرایش نکات مهم انتخاب اتاق صفحه اول',
      details: `عنوان بخش: ${cleanTitle} (${cleanedNotes.length} کارت)`,
      targetName: cleanTitle,
    });
    setActivityLogs(Storage.getActivityLogs());
    onUpdateSettings(updated);
    setHomeNotesFeedback({
      type: 'success',
      message: 'متن و کارت‌های بخش «نکات مهم انتخاب اتاق و اسکان» با موفقیت در صفحه اول ذخیره و منتشر شد.',
    });
    setTimeout(() => setHomeNotesFeedback(null), 4000);
  };

  const handleResetHomeNotes = () => {
    const updated: AppSettings = {
      ...localSettings,
      homeNotesTitle: undefined,
      homeNotes: undefined,
    };
    setDraftHomeNotesTitle(DEFAULT_HOME_NOTES_TITLE);
    setDraftHomeNotes(DEFAULT_HOME_NOTES);
    setHomeNotesEditorKey((k) => k + 1);
    setLocalSettings(updated);
    Storage.setSettings(updated);
    onUpdateSettings(updated);
    setHomeNotesFeedback({
      type: 'success',
      message: 'بخش نکات مهم انتخاب اتاق و اسکان به متن پیش‌فرض سامانه بازگردانی شد.',
    });
    setTimeout(() => setHomeNotesFeedback(null), 3500);
  };

  // توابع مدیریت و ویرایش بخش «درباره ما» و فایل‌های پیوست
  const handleUpdateDraftAbout = (patch: Partial<ResolvedAboutContent>) => {
    setDraftAbout((prev) => ({ ...prev, ...patch }));
  };

  const handleUpdateAboutCapability = (id: string, patch: Partial<AboutCapabilityItem>) => {
    setDraftAbout((prev) => ({
      ...prev,
      capabilities: prev.capabilities.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  };

  const handleAddAboutCapability = () => {
    setDraftAbout((prev) => ({
      ...prev,
      capabilities: [
        ...prev.capabilities,
        {
          id: `cap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          text: 'امکان جدید سامانه...',
          highlight: false,
        },
      ],
    }));
  };

  const handleDeleteAboutCapability = (id: string) => {
    setDraftAbout((prev) => {
      if (prev.capabilities.length <= 1) {
        setAboutFeedback({
          type: 'error',
          message: 'حداقل یک مورد در فهرست امکانات بخش درباره ما باید باقی بماند.',
        });
        setTimeout(() => setAboutFeedback(null), 3500);
        return prev;
      }
      return {
        ...prev,
        capabilities: prev.capabilities.filter((c) => c.id !== id),
      };
    });
  };

  const handleUploadAboutAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const MAX_BYTES = 3.5 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      setAboutFeedback({
        type: 'error',
        message: 'حجم فایل انتخاب‌شده بیش از حد مجاز (۳.۵ مگابایت) است.',
      });
      setTimeout(() => setAboutFeedback(null), 4000);
      return;
    }

    try {
      let dataUrl = '';
      if (file.type.startsWith('image/')) {
        dataUrl = await compressAvatarImageFile(file, 1400, 0.85);
      } else {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('خطا در خواندن فایل انتخاب‌شده'));
          reader.readAsDataURL(file);
        });
      }

      const newAtt: AboutAttachmentFile = {
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: file.name.replace(/\.[^.]+$/, '') || 'فایل پیوست جدید',
        description: '',
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        dataUrl,
        uploadedAt: new Date().toLocaleDateString('fa-IR'),
      };

      setDraftAbout((prev) => ({
        ...prev,
        attachments: [...prev.attachments, newAtt],
      }));
      setAboutFeedback({
        type: 'success',
        message: `فایل «${file.name}» با موفقیت پیوست شد. برای انتشار نهایی دکمه «ذخیره تغییرات بخش درباره ما» را بزنید.`,
      });
      setTimeout(() => setAboutFeedback(null), 4000);
    } catch (err) {
      setAboutFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'خطا در پیوست کردن فایل.',
      });
      setTimeout(() => setAboutFeedback(null), 4000);
    }
  };

  const handleUpdateAboutAttachment = (id: string, patch: Partial<AboutAttachmentFile>) => {
    setDraftAbout((prev) => ({
      ...prev,
      attachments: prev.attachments.map((att) => (att.id === id ? { ...att, ...patch } : att)),
    }));
  };

  const handleDeleteAboutAttachment = (id: string) => {
    setDraftAbout((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((att) => att.id !== id),
    }));
  };

  const handleSaveAboutContent = () => {
    const cleanedCapabilities: AboutCapabilityItem[] = draftAbout.capabilities
      .map((c) => ({ ...c, text: c.text.trim() }))
      .filter((c) => Boolean(c.text));

    if (cleanedCapabilities.length === 0) {
      setAboutFeedback({
        type: 'error',
        message: 'حداقل یک مورد معتبر در فهرست قابلیت‌ها باید ثبت شده باشد.',
      });
      setTimeout(() => setAboutFeedback(null), 3500);
      return;
    }

    const savedAbout: AboutContentSettings = {
      universityBadge: draftAbout.universityBadge.trim() || DEFAULT_ABOUT_CONTENT.universityBadge,
      headerTitle: draftAbout.headerTitle.trim() || DEFAULT_ABOUT_CONTENT.headerTitle,
      headerSubtitle: draftAbout.headerSubtitle.trim() || DEFAULT_ABOUT_CONTENT.headerSubtitle,
      designerBadge: draftAbout.designerBadge.trim() || DEFAULT_ABOUT_CONTENT.designerBadge,
      designerName: draftAbout.designerName.trim() || DEFAULT_ABOUT_CONTENT.designerName,
      designerEmail: draftAbout.designerEmail.trim() || DEFAULT_ABOUT_CONTENT.designerEmail,
      designerBio: draftAbout.designerBio.trim() || DEFAULT_ABOUT_CONTENT.designerBio,
      designerBioHtml: draftAbout.designerBioHtml
        ? sanitizeRichHtml(draftAbout.designerBioHtml)
        : DEFAULT_ABOUT_CONTENT.designerBioHtml,
      pdfCardTitle: draftAbout.pdfCardTitle.trim() || DEFAULT_ABOUT_CONTENT.pdfCardTitle,
      pdfCardDescription:
        draftAbout.pdfCardDescription.trim() || DEFAULT_ABOUT_CONTENT.pdfCardDescription,
      boardingSectionTitle:
        draftAbout.boardingSectionTitle.trim() || DEFAULT_ABOUT_CONTENT.boardingSectionTitle,
      boardingSectionHtml: draftAbout.boardingSectionHtml
        ? sanitizeRichHtml(draftAbout.boardingSectionHtml)
        : DEFAULT_ABOUT_CONTENT.boardingSectionHtml,
      boardingSectionText:
        draftAbout.boardingSectionText.trim() || DEFAULT_ABOUT_CONTENT.boardingSectionText,
      capabilitiesSectionTitle:
        draftAbout.capabilitiesSectionTitle.trim() || DEFAULT_ABOUT_CONTENT.capabilitiesSectionTitle,
      capabilities: cleanedCapabilities,
      extraSectionTitle:
        draftAbout.extraSectionTitle.trim() || DEFAULT_ABOUT_CONTENT.extraSectionTitle,
      extraSectionHtml: draftAbout.extraSectionHtml
        ? sanitizeRichHtml(draftAbout.extraSectionHtml)
        : '',
      extraSectionText: draftAbout.extraSectionText.trim(),
      attachmentsTitle: draftAbout.attachmentsTitle.trim() || DEFAULT_ABOUT_CONTENT.attachmentsTitle,
      attachments: draftAbout.attachments,
      footerNote: draftAbout.footerNote.trim() || DEFAULT_ABOUT_CONTENT.footerNote,
      updatedAt: new Date().toLocaleDateString('fa-IR'),
    };

    const updated: AppSettings = {
      ...localSettings,
      aboutContent: savedAbout,
    };
    lastSyncedAboutJsonRef.current = JSON.stringify(savedAbout);
    setLocalSettings(updated);
    Storage.setSettings(updated);
    Storage.addActivityLog({
      category: 'settings',
      action: 'ویرایش محتوا و فایل‌های بخش درباره ما',
      details: `${savedAbout.capabilities?.length || 0} قابلیت و ${savedAbout.attachments?.length || 0} فایل پیوست ذخیره شد.`,
      targetName: 'بخش درباره ما',
    });
    setActivityLogs(Storage.getActivityLogs());
    onUpdateSettings(updated);
    setAboutFeedback({
      type: 'success',
      message: 'محتوا، توضیحات و فایل‌های بخش «درباره ما» با موفقیت ذخیره و در سامانه اعمال شد.',
    });
    setTimeout(() => setAboutFeedback(null), 4000);
  };

  const handleResetAboutContent = () => {
    const updated: AppSettings = {
      ...localSettings,
      aboutContent: undefined,
    };
    lastSyncedAboutJsonRef.current = JSON.stringify(null);
    setDraftAbout(DEFAULT_ABOUT_CONTENT);
    setAboutEditorResetKey((k) => k + 1);
    setLocalSettings(updated);
    Storage.setSettings(updated);
    onUpdateSettings(updated);
    setAboutFeedback({
      type: 'success',
      message: 'محتوای بخش «درباره ما» به نسخه استاندارد ۱۳ نقشه پیش‌فرض بازگردانی شد.',
    });
    setTimeout(() => setAboutFeedback(null), 3500);
  };

  const [isFullBackupExporting, setIsFullBackupExporting] = useState(false);
  const [isBackupRestoring, setIsBackupRestoring] = useState(false);
  const [backupProgressMessage, setBackupProgressMessage] = useState<string | null>(null);

  const handleBackupExport = () => {
    Storage.exportBackupJson();
  };

  const handleFullBackupExport = async () => {
    if (isFullBackupExporting || isBackupRestoring) return;
    setIsFullBackupExporting(true);
    setBackupProgressMessage('در حال آماده‌سازی فایل پشتیبان کامل سامانه...');
    try {
      const result = await Storage.exportFullSnapshotBackupJson((msg) => {
        setBackupProgressMessage(msg);
      });
      if (result.success) {
        setAdminNoticeDialog({
          title: 'نسخه پشتیبان کامل با موفقیت آماده و دانلود شد',
          message:
            `فایل پشتیبان کامل (حجم تقریبی ${result.sizeKb.toLocaleString('fa-IR')} کیلوبایت) شامل ${result.totalStudents.toLocaleString('fa-IR')} پرونده دانشجو، ${result.totalStaff.toLocaleString('fa-IR')} کاربری پرسنل، ${result.embeddedPhotosCount.toLocaleString('fa-IR')} تصویر پروفایل، ${result.fontsCount.toLocaleString('fa-IR')} فونت سفارشی و ${result.attachmentsCount.toLocaleString('fa-IR')} فایل ضمیمه دریافت شد. حتی در صورت ریست یا پاک‌شدن کامل سرور، با بارگذاری مجدد همین فایل تمام سامانه به همین وضعیت بازگردانده می‌شود.`,
          tone: 'success',
        });
      } else {
        setAdminNoticeDialog({
          title: 'خطا در تهیه پشتیبان کامل',
          message: result.errorMessage || 'تهیه فایل پشتیبان کامل با خطا مواجه شد.',
          tone: 'error',
        });
      }
    } finally {
      setIsFullBackupExporting(false);
      setBackupProgressMessage(null);
    }
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isFullBackupExporting || isBackupRestoring) {
        e.target.value = '';
        return;
      }
      setIsBackupRestoring(true);
      setBackupProgressMessage('در حال خواندن فایل پشتیبان...');
      const reader = new FileReader();
      reader.onerror = () => {
        setIsBackupRestoring(false);
        setBackupProgressMessage(null);
        setAdminNoticeDialog({
          title: 'خطا در خواندن فایل',
          message: 'امکان خواندن فایل پشتیبان انتخاب‌شده وجود ندارد.',
          tone: 'error',
        });
      };
      reader.onload = async (event) => {
        try {
          const text = String(event.target?.result || '');
          const res = await Storage.importFullBackupJsonAsync(text, (msg) => {
            setBackupProgressMessage(msg);
          });
          if (res.ok) {
            onRefreshData();
            const fullySynced = res.cloudSynced && res.studentsSynced;
            const oversizedCount = res.oversizedKeys?.length || 0;
            const failedCount = res.failedSyncKeys?.length || 0;
            const partialDetails: string[] = [];
            if (!res.cloudSynced) {
              const otherFailed = Math.max(0, failedCount - oversizedCount);
              partialDetails.push(
                otherFailed > 0
                  ? `${otherFailed.toLocaleString('fa-IR')} جدول سامانه`
                  : 'داده‌های سامانه'
              );
            }
            if (!res.studentsSynced) {
              partialDetails.push('فهرست دانشجویان');
            }
            setAdminNoticeDialog({
              title: res.isFullArchive
                ? 'بازیابی کامل سامانه با موفقیت انجام شد'
                : 'بازیابی نسخه پشتیبان JSON',
              message: fullySynced
                ? `تمام اطلاعات، تنظیمات${res.restoredPhotosCount > 0 ? `، ${res.restoredPhotosCount.toLocaleString('fa-IR')} تصویر پروفایل (${res.uploadedPhotosToCloudCount.toLocaleString('fa-IR')} تصویر در صف/فضای Supabase Storage)` : ''}${res.restoredFilesCount > 0 ? ` و ${res.restoredFilesCount.toLocaleString('fa-IR')} فایل/فونت و رسانه` : ''} با موفقیت بازیابی و در پایگاه داده ابری Supabase بازسازی شد.`
                : `اطلاعات${res.restoredPhotosCount > 0 ? ` و ${res.restoredPhotosCount.toLocaleString('fa-IR')} تصویر` : ''} در مرورگر بازیابی شد، اما همگام‌سازی کامل با Supabase (${partialDetails.join(' و ')}) با خطا مواجه شد. لطفاً پس از اطمینان از اتصال اینترنت و دسترسی جداول Supabase دوباره بررسی فرمایید.`,
              tone: fullySynced ? 'success' : 'error',
            });
          } else {
            setAdminNoticeDialog({
              title: 'خطا در فایل پشتیبان',
              message: res.errorMessage || 'فایل پشتیبان انتخاب‌شده نامعتبر است.',
              tone: 'error',
            });
          }
        } finally {
          setIsBackupRestoring(false);
          setBackupProgressMessage(null);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleResetDefaults = () => {
    setAdminConfirmDialog({
      title: 'بازنشانی کامل پایگاه داده',
      message: 'آیا مایل به بازنشانی پایگاه داده به حالت اولیه دانشگاه فرهنگیان هستید؟ تمام تغییرات به نمونه اولیه برمی‌گردد.',
      confirmLabel: 'تأیید و بازنشانی کامل',
      onConfirm: async () => {
        Storage.resetToDefaults();
        await Storage.syncAllToCloud();
        onRefreshData();
        setAdminNoticeDialog({
          title: 'بازنشانی انجام شد',
          message: 'پایگاه داده با موفقیت به وضعیت اولیه بازگردانی و با سرور ابری همگام‌سازی شد.',
          tone: 'success',
        });
      },
    });
  };

  // وظایف و پرسنل تأسیساتی سراسر دانشگاه
  const campusTasks = maintenanceTasks || Storage.getMaintenanceTasks();
  const campusStaff = maintenanceStaff || Storage.getMaintenanceStaff();
  const activeCampusMaintCount = campusTasks.filter(
    (t) => t.status !== 'resolved' && t.status !== 'closed' && t.status !== 'cancelled'
  ).length;

  const handleAdminCreateMaintTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNewMaintTitle.trim() || !adminNewMaintDormId) return;

    const dormObj = dorms.find((d) => d.id === adminNewMaintDormId);
    const dormName = dormObj ? dormObj.name : 'سرای دانشجویی';
    const staffObj = campusStaff.find((s) => s.id === adminNewMaintStaffId);

    const res = Storage.addMaintenanceTask({
      title: adminNewMaintTitle.trim(),
      description: adminNewMaintDesc.trim(),
      dormId: adminNewMaintDormId,
      dormName,
      roomNumber: adminNewMaintRoom.trim() || undefined,
      locationDetails: adminNewMaintRoom.trim() ? `اتاق ${adminNewMaintRoom.trim()}` : undefined,
      priority: adminNewMaintPriority,
      category: adminNewMaintCategory,
      source: 'supervisor_direct',
      createdById: 'admin',
      createdByName: 'مدیریت کل سامانه',
      createdByRole: 'admin',
      assignedToStaffId: staffObj?.id,
      assignedToStaffName: staffObj?.fullName,
      status: staffObj?.id ? 'assigned' : 'pending',
    });

    setAdminMaintFeedback(`مأموریت فنی با کد رهگیری ${res.task.trackingCode} با موفقیت صادر و ثبت شد.`);
    setAdminNewMaintTitle('');
    setAdminNewMaintDesc('');
    setAdminNewMaintRoom('');
    setShowAdminAddMaintModal(false);
    onRefreshData();
    setTimeout(() => setAdminMaintFeedback(null), 3500);
  };

  const handleAdminReassignTask = (taskId: string, staffId: string) => {
    const staffObj = campusStaff.find((s) => s.id === staffId);
    if (!staffObj) return;
    Storage.updateMaintenanceTask(taskId, {
      assignedToStaffId: staffObj.id,
      assignedToStaffName: staffObj.fullName,
      status: 'assigned',
      assignedAt: new Date().toLocaleDateString('fa-IR'),
    });
    setAdminMaintFeedback(`مأموریت با موفقیت به تکنسین «${staffObj.fullName}» تخصیص داده شد.`);
    onRefreshData();
    setTimeout(() => setAdminMaintFeedback(null), 3000);
  };

  const handleAdminDeleteTask = (taskId: string, code: string) => {
    setAdminConfirmDialog({
      title: `حذف مأموریت تأسیساتی ${code}`,
      message: `آیا از حذف مأموریت تأسیساتی ${code} اطمینان دارید؟`,
      confirmLabel: 'تأیید و حذف مأموریت',
      onConfirm: () => {
        Storage.deleteMaintenanceTask(taskId);
        setAdminMaintFeedback(`مأموریت ${code} حذف گردید.`);
        onRefreshData();
        setTimeout(() => setAdminMaintFeedback(null), 3000);
      },
    });
  };

  return (
    <div className="space-y-6">

      {/* مدال اعلام اخطار برای اتاق توسط مدیر */}
      <RoomWarningModal
        isOpen={isAdminWarningModalOpen}
        onClose={() => setIsAdminWarningModalOpen(false)}
        dorms={dorms}
        rooms={rooms}
        supervisorName="مدیریت کل سامانه جامع خدمات دانشجویی"
        onWarningAdded={onRefreshData}
      />

      {/* مدال ثبت تذکر، اخطار و نمره ارزیابی فردی/اتاق برای دانشجو */}
      <StudentEvaluationModal
        isOpen={isStudentEvalModalOpen}
        onClose={() => {
          setIsStudentEvalModalOpen(false);
          setEvalTargetStudent(null);
        }}
        students={students}
        dorms={dorms}
        rooms={rooms}
        initialStudent={evalTargetStudent}
        evaluatorName="مدیریت کل سامانه جامع خدمات دانشجویی"
        evaluatorRole="admin"
        onSaved={() => {
          setStudentEvaluations(Storage.getStudentEvaluations());
          setActivityLogs(Storage.getActivityLogs());
          onRefreshData();
        }}
      />

      {/* سربرگ مدیریت کل */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-purple-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                <Shield className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-purple-300">
                پنل مدیریت کل سامانه جامع خدمات دانشجویی دانشگاه فرهنگیان
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">
              مدیریت کل پیشخوان جامع خدمات دانشجویی
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              مدیریت یکپارچه امور دانشجویی، آموزش، سراهای دانشجویی، مالی، فرهنگی، ورزشی، مشاوره، کتابخانه، هوشمندسازی و تنظیمات کل سامانه
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setIsTranscriptModalOpen(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-amber-500/25 cursor-pointer"
              title="مشاهده و چاپ کارنامه جامع فعالیت‌های فرهنگی، اجتماعی، ورزشی و انضباطی هر دانشجو"
            >
              <Award className="w-4 h-4" />
              <span>کارنامه فعالیت‌های دانشجو</span>
            </button>

            <button
              onClick={() => setIsSendSecurityModalOpen(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
              title="ثبت گزارش حفاظتی/انضباطی برای یک یا چند دانشجو و ارسال مستقیم به حراست"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>ارسال گزارش به حراست</span>
            </button>

            {onOpenUserGuide && (
              <button
                onClick={() => onOpenUserGuide('admin')}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer"
                title="مشاهده و چاپ دفترچه راهنمای جامع مدیر کل (PDF)"
              >
                <BookOpen className="w-4 h-4" />
                <span>راهنمای کاربری (PDF)</span>
              </button>
            )}
          </div>
        </div>

        {/* نوار انتخاب چیدمان منوی کاربردی (بالا، عمودی راست، عمودی چپ + حالت ثابت یا اتوهاید) */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-purple-300" />
              <span>چیدمان منوی کاربردی:</span>
            </span>
            <div className="inline-flex items-center p-1 rounded-xl bg-white/10 border border-white/15 gap-1">
              <button
                type="button"
                onClick={() => setAdminMenuLayout('top_cards')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  adminMenuLayout === 'top_cards'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <PanelTop className="w-3.5 h-3.5" />
                <span>کارتی بالا</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminMenuLayout('sidebar_right')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  adminMenuLayout === 'sidebar_right'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <PanelRight className="w-3.5 h-3.5" />
                <span>داشبورد عمودی راست</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminMenuLayout('sidebar_left')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  adminMenuLayout === 'sidebar_left'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <PanelLeft className="w-3.5 h-3.5" />
                <span>داشبورد عمودی چپ</span>
              </button>
            </div>

            {adminMenuLayout !== 'top_cards' && (
              <div className="inline-flex items-center p-1 rounded-xl bg-white/10 border border-white/15 gap-1">
                <button
                  type="button"
                  onClick={() => setAdminSidebarAutoHide(false)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                    !adminSidebarAutoHide
                      ? 'bg-emerald-400 text-slate-950 shadow-sm'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                  title="منوی عمودی همیشه کنار صفحه در دسترس باشد"
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>همیشه در دسترس</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminSidebarAutoHide(true)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                    adminSidebarAutoHide
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                  title="منوی عمودی به‌صورت خودکار مخفی شود و با بردن ماوس یا کلیک باز گردد"
                >
                  <PinOff className="w-3.5 h-3.5" />
                  <span>مخفی خودکار (Auto-Hide)</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-teal-200 font-bold">
              {students.length.toLocaleString('fa-IR')} دانشجو
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-indigo-200 font-bold">
              {dorms.length.toLocaleString('fa-IR')} سرا ({rooms.length.toLocaleString('fa-IR')} اتاق)
            </span>
            {adminMenuLayout !== 'top_cards' && (
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden px-3 py-1.5 rounded-lg bg-white text-slate-900 font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Menu className="w-3.5 h-3.5" />
                <span>فهرست منوها</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* پیام بازخورد تأیید یا رد اسکان */}
      {approvalFeedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-2 text-xs font-bold animate-in fade-in duration-200 ${
            approvalFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{approvalFeedback.message}</span>
          </div>
          <button onClick={() => setApprovalFeedback(null)} className="p-1 hover:opacity-75 cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* ناوبری یکپارچه و قابل تنظیم مدیریت کل (کارتی بالا / عمودی راست / عمودی چپ / اتوهاید) */}
      {/* ========================================================= */}
      {(() => {
        const totalUsersCount =
          students.length +
          supervisors.length +
          campusStaff.length +
          warehouseStaffList.length +
          procurementStaffList.length +
          counselorsList.length +
          financeStaffList.length +
          educationStaffList.length +
          culturalStaffList.length +
          studentAffairsStaffList.length +
          securityStaffList.length +
          viceDeanStaffList.length +
          libraryStaffList.length +
          smartCampusStaffList.length +
          graduationStaffList.length +
          academicDeputyStaffList.length;

        const pendingRequestsTotal =
          pendingStudents.length +
          Storage.getGuestRequests().filter((g) => g.status === 'pending_supervisor').length +
          academicNotices.filter((n) => n.status === 'pending').length;

        const activeSurveysTotal = Storage.getSurveys().filter((s) => s.status === 'active').length;
        const activeClearancesTotal = Storage.getGraduationClearances().filter(
          (c) => c.status === 'pending_education' || c.status === 'in_clearance'
        ).length;

        const adminMenuItems: Array<{
          key: AdminMainTabKey;
          title: string;
          desc: string;
          icon: React.ComponentType<{ className?: string }>;
          iconTone: string;
          activeRing: string;
          badge?: string;
          badgePulse?: boolean;
          badgeClass?: string;
        }> = [
          {
            key: 'cartable',
            title: 'کارتابل و مدیریت جامع سراها',
            desc: 'اتاق‌ها و تخت‌ها، باز/بسته انتخاب اتاق و ورود سرا (تکی/اکسل)',
            icon: Building2,
            iconTone: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800',
            activeRing: 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 shadow-md shadow-purple-500/10',
          },
          {
            key: 'users',
            title: 'مدیریت کاربران سامانه',
            desc: 'دانشجویان (خوابگاهی/ترددی)، سرپرستان و واحدهای دانشگاهی',
            icon: Users,
            iconTone: 'text-teal-600 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800',
            activeRing: 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 shadow-md shadow-teal-500/10',
            badge: totalUsersCount.toLocaleString('fa-IR'),
            badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900/70 dark:text-teal-200',
          },
          {
            key: 'announcements',
            title: 'اطلاعیه‌های سایت و صفحه اول',
            desc: 'انتشار و مدیریت اطلاعیه‌های عمومی و فوری پیشخوان',
            icon: Bell,
            iconTone: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800',
            activeRing: 'border-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/40 shadow-md shadow-cyan-500/10',
            badge: announcements.length.toLocaleString('fa-IR'),
            badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/70 dark:text-cyan-200',
          },
          {
            key: 'requests',
            title: 'درخواست‌های اسکان، مهمان و آموزش',
            desc: 'بررسی و تأیید درخواست‌های اسکان موقت، مهمان و مکاتبات',
            icon: Clock,
            iconTone: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
            activeRing: 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 shadow-md shadow-amber-500/10',
            badge: pendingRequestsTotal > 0 ? pendingRequestsTotal.toLocaleString('fa-IR') : undefined,
            badgePulse: pendingRequestsTotal > 0,
            badgeClass: 'bg-amber-500 text-white',
          },
          {
            key: 'maintenance',
            title: 'تأسیسات و امور فنی سراها',
            desc: 'ارجاع، پیگیری و گزارش تعمیرات و وضعیت فنی سراها',
            icon: Wrench,
            iconTone: 'text-orange-600 bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800',
            activeRing: 'border-orange-500 bg-orange-50/70 dark:bg-orange-950/40 shadow-md shadow-orange-500/10',
            badge: activeCampusMaintCount > 0 ? activeCampusMaintCount.toLocaleString('fa-IR') : undefined,
            badgePulse: activeCampusMaintCount > 0,
            badgeClass: 'bg-rose-600 text-white',
          },
          {
            key: 'warehouse',
            title: 'انبار و کارپردازی (مشاهده)',
            desc: 'پایش موجودی انبار، تراکنش‌ها، وضعیت خرید کارپرداز و درخواست اقلام',
            icon: Package,
            iconTone: 'text-violet-600 bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800',
            activeRing: 'border-violet-500 bg-violet-50/70 dark:bg-violet-950/40 shadow-md shadow-violet-500/10',
          },
          {
            key: 'warehouse_request',
            title: 'درخواست اقلام از انبار',
            desc: 'ثبت درخواست اقلام مصرفی و اداری از انبار و پیگیری وضعیت تحویل',
            icon: PackagePlus,
            iconTone: 'text-violet-700 bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800',
            activeRing: 'border-violet-500 bg-violet-50/70 dark:bg-violet-950/40 shadow-md shadow-violet-500/10',
            badge:
              myPendingWarehouseRequestsCount > 0
                ? `${myPendingWarehouseRequestsCount.toLocaleString('fa-IR')} جاری`
                : undefined,
            badgePulse: myPendingWarehouseRequestsCount > 0,
            badgeClass: 'bg-violet-600 text-white',
          },
          {
            key: 'shifts',
            title: 'شیفت‌بندی ماهانه سرپرستان',
            desc: 'برنامه نوبت‌کاری ماهانه، ورود تکی/اکسل و گزارش تحویل شیفت',
            icon: Calendar,
            iconTone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
            activeRing: 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-md shadow-emerald-500/10',
          },
          {
            key: 'counseling',
            title: 'مرکز مشاوره و روانشناسی',
            desc: 'مدیریت مشاوران، شیفت‌های مشاوره و گزارش‌های مرکز',
            icon: HeartHandshake,
            iconTone: 'text-teal-600 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800',
            activeRing: 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 shadow-md shadow-teal-500/10',
            badge: `${counselorsList.length} مشاور`,
            badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900/70 dark:text-teal-200',
          },
          {
            key: 'surveys',
            title: 'نظرسنجی‌های دوره‌ای',
            desc: 'ایجاد، مدیریت و تحلیل نتایج نظرسنجی‌های دانشجویی',
            icon: ClipboardList,
            iconTone: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
            activeRing: 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-md shadow-indigo-500/10',
            badge: activeSurveysTotal > 0 ? `${activeSurveysTotal} فعال` : undefined,
            badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/70 dark:text-indigo-200',
          },
          {
            key: 'clearance',
            title: 'تسویه حساب فارغ‌التحصیلان',
            desc: 'نظارت جامع بر فرآیند تسویه حساب واحدهای دانشگاهی',
            icon: GraduationCap,
            iconTone: 'text-sky-600 bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800',
            activeRing: 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 shadow-md shadow-sky-500/10',
            badge: activeClearancesTotal > 0 ? `${activeClearancesTotal} در جریان` : undefined,
            badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-900/70 dark:text-sky-200',
          },
          {
            key: 'course_scheduling',
            title: 'برنامه‌ریزی درسی جامع (تمام‌صفحه)',
            desc: 'تنظیمات ترم، اطلاعات پایه، ثبت دروس، چیدمان هوشمند و ۷ گزارش تحلیلی',
            icon: BookOpen,
            iconTone: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
            activeRing: 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-md shadow-indigo-500/10',
            badge: 'تمام‌صفحه',
            badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/70 dark:text-indigo-200',
          },
          {
            key: 'community_chat',
            title: 'پیام‌رسان و تالارهای گفتگو',
            desc: 'تنظیمات کامل چت، باز/بسته کردن تالار عمومی، تأیید گروه‌ها، مسدودسازی و نظارت',
            icon: MessagesSquare,
            iconTone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
            activeRing: 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-md shadow-emerald-500/10',
            badge: (() => {
              const p =
                Storage.getCommunityForums().filter(
                  (f) => !f.isPublicForum && f.status === 'pending' && f.adminApproval.status === 'pending'
                ).length + Storage.getCommunityChatReports().filter((r) => r.status === 'pending').length;
              return p > 0 ? `${p} منتظر بررسی` : undefined;
            })(),
            badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/70 dark:text-rose-200',
          },
          {
            key: 'activity_log',
            title: 'لاگ فعالیت‌ها و دسترسی‌ها',
            desc: 'تاریخچه عملیات کاربران، رخدادهای سیستمی و پایش امنیتی',
            icon: Activity,
            iconTone: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800',
            activeRing: 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 shadow-md shadow-rose-500/10',
            badge: activityLogs.length.toLocaleString('fa-IR'),
            badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/70 dark:text-rose-200',
          },
          {
            key: 'settings',
            title: 'تنظیمات و ظاهر سامانه',
            desc: 'شخصی‌سازی ظاهر و فونت، سامانه‌ها، پشتیبان‌گیری و سرور ابری',
            icon: Settings,
            iconTone: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
            activeRing: 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-md shadow-indigo-500/10',
          },
        ];

        const activeMenuItem = adminMenuItems.find((item) => item.key === mainTab) || null;
        const previousTabKey = tabHistory.length > 0 ? tabHistory[tabHistory.length - 1] : null;
        const previousMenuItem = previousTabKey
          ? adminMenuItems.find((item) => item.key === previousTabKey) || null
          : null;

        const renderMenuCard = (item: (typeof adminMenuItems)[number], compactVertical = false) => {
          const IconComp = item.icon;
          const isOpen = mainTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleToggleOrSelectTab(item.key)}
              title={isOpen ? `کلیک مجدد برای بستن «${item.title}»` : `باز کردن «${item.title}»`}
              className={`group text-right rounded-2xl border transition-all duration-150 cursor-pointer w-full ${
                compactVertical ? 'p-3' : 'p-4'
              } ${
                isOpen
                  ? `${item.activeRing} ring-1 ring-inset ring-black/5 dark:ring-white/10`
                  : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-md shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`${
                      compactVertical ? 'w-8 h-8 rounded-xl' : 'w-10 h-10 rounded-xl'
                    } border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${item.iconTone}`}
                  >
                    <IconComp className={compactVertical ? 'w-4 h-4' : 'w-5 h-5'} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span
                        className={`font-extrabold leading-snug ${
                          compactVertical ? 'text-xs' : 'text-xs sm:text-sm'
                        } ${isOpen ? 'text-slate-950 dark:text-white' : 'text-slate-800 dark:text-slate-100'}`}
                      >
                        {item.title}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                            item.badgeClass || 'bg-slate-100 text-slate-700'
                          } ${item.badgePulse ? 'animate-pulse' : ''}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1 ${
                        compactVertical ? 'line-clamp-1' : 'line-clamp-2'
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 mt-1 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-teal-600 dark:text-teal-400' : 'text-slate-400 group-hover:text-teal-600'
                  }`}
                />
              </div>
              {isOpen && (
                <div className="mt-2 pt-1.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[10px] font-bold text-teal-700 dark:text-teal-300">
                  <span>بخش فعال است</span>
                  <span>کلیک مجدد برای بستن</span>
                </div>
              )}
            </button>
          );
        };

        const renderVerticalSidebarBody = (forFloatingAutoHide = false) => (
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl flex flex-col max-h-[calc(100vh-6.5rem)] overflow-hidden">
            <div className="px-3.5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/80 dark:bg-slate-800/50 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <LayoutGrid className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="font-black text-xs text-slate-800 dark:text-white truncate">
                  منوی کاربردی مدیریت
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setAdminSidebarAutoHide((prev) => !prev)}
                  className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                    adminSidebarAutoHide
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}
                  title={
                    adminSidebarAutoHide
                      ? 'تثبیت دائمی منوی عمودی (خروج از Auto-Hide)'
                      : 'تبدیل به حالت مخفی خودکار (Auto-Hide)'
                  }
                >
                  {adminSidebarAutoHide ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAdminMenuLayout((prev) =>
                      prev === 'sidebar_right' ? 'sidebar_left' : 'sidebar_right'
                    )
                  }
                  className="p-1.5 rounded-lg bg-slate-200/70 dark:bg-slate-700/70 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  title="انتقال داشبورد عمودی به سمت مقابل"
                >
                  {adminMenuLayout === 'sidebar_right' ? (
                    <PanelLeft className="w-3.5 h-3.5" />
                  ) : (
                    <PanelRight className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setAdminMenuLayout('top_cards')}
                  className="p-1.5 rounded-lg bg-slate-200/70 dark:bg-slate-700/70 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  title="تغییر به چیدمان کارتی بالا"
                >
                  <PanelTop className="w-3.5 h-3.5" />
                </button>
                {forFloatingAutoHide && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAutoHideExpanded(false);
                      setIsMobileSidebarOpen(false);
                    }}
                    className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 cursor-pointer"
                    title="جمع کردن منو"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-2.5 space-y-2 overflow-y-auto flex-1">
              {adminMenuItems.map((item) => renderMenuCard(item, true))}
            </div>
          </div>
        );

        return (
          <>
            {/* حالت ۱: منوی کارتی یکپارچه در بالای صفحه (بدون تکرار منو در پایین) */}
            {adminMenuLayout === 'top_cards' && (
              <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-200">
                    <LayoutGrid className="w-4 h-4 text-purple-600" />
                    <span>منوی کاربردی مدیریت کل (روی هر بخش کلیک کنید تا باز یا بسته شود)</span>
                  </div>
                  {mainTab && (
                    <div className="flex items-center gap-1.5">
                      {previousMenuItem && (
                        <button
                          type="button"
                          onClick={handleGoBackTab}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>بازگشت به «{previousMenuItem.title}»</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setMainTab(null)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>بستن بخش بازشده</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {adminMenuItems.map((item) => renderMenuCard(item, false))}
                </div>
              </div>
            )}

            {/* حالت ۲: داشبورد عمودی Auto-Hide در سمت راست یا چپ صفحه */}
            {adminMenuLayout !== 'top_cards' && adminSidebarAutoHide && (
              <div
                onMouseEnter={() => setIsAutoHideExpanded(true)}
                onMouseLeave={() => setIsAutoHideExpanded(false)}
                className={`hidden lg:flex fixed top-24 z-40 items-start transition-all duration-200 ${
                  adminMenuLayout === 'sidebar_right' ? 'right-2' : 'left-2'
                }`}
              >
                {!isAutoHideExpanded ? (
                  <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl p-1.5 flex flex-col items-center gap-1.5 max-h-[calc(100vh-7rem)] overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => setIsAutoHideExpanded(true)}
                      className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm cursor-pointer"
                      title="باز کردن منوی عمودی مدیریت"
                    >
                      <Menu className="w-4 h-4" />
                    </button>
                    {adminMenuItems.map((item) => {
                      const IconComp = item.icon;
                      const isOpen = mainTab === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleToggleOrSelectTab(item.key)}
                          title={item.title}
                          className={`relative w-10 h-10 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                            isOpen
                              ? `${item.iconTone} ring-2 ring-teal-500 shadow-sm`
                              : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-400'
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                          {item.badgePulse && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="w-80 animate-in fade-in duration-150">
                    {renderVerticalSidebarBody(true)}
                  </div>
                )}
              </div>
            )}

            {/* کشوی موبایل برای حالت داشبورد عمودی در نمایشگرهای کوچک */}
            {adminMenuLayout !== 'top_cards' && isMobileSidebarOpen && (
              <div
                className="lg:hidden fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex p-3"
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <div
                  className={`w-80 max-w-[90vw] ${adminMenuLayout === 'sidebar_left' ? 'mr-auto' : 'ml-auto'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {renderVerticalSidebarBody(true)}
                </div>
              </div>
            )}

            {/* نوار بازگشت و کنترل بخش فعال (در همه چیدمان‌ها هنگام باز بودن یک بخش) */}
            {activeMenuItem && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl px-4 py-3 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${activeMenuItem.iconTone}`}>
                    <activeMenuItem.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {activeMenuItem.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {activeMenuItem.desc}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGoBackTab}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>
                      {previousMenuItem
                        ? `بازگشت به ${previousMenuItem.title}`
                        : 'بازگشت به منوی اصلی'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMainTab(null)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>بستن بخش</span>
                  </button>
                </div>
              </div>
            )}

            {/* ظرف چیدمان سایدبار عمودی ثابت (سمت راست یا چپ) در کنار محتوای بخش فعال */}
            {adminMenuLayout !== 'top_cards' && !adminSidebarAutoHide && (
              <div className="hidden" aria-hidden="true" />
            )}
          </>
        );
      })()}

      {/* ظرف اصلی محتوا همراه با سایدبار عمودی ثابت (در صورت انتخاب چیدمان عمودی همیشه در دسترس) */}
      <div
        className={
          adminMenuLayout !== 'top_cards' && !adminSidebarAutoHide
            ? `flex flex-col lg:flex-row ${
                adminMenuLayout === 'sidebar_left' ? 'lg:flex-row-reverse' : ''
              } gap-5 items-start`
            : 'space-y-6'
        }
      >
        {adminMenuLayout !== 'top_cards' && !adminSidebarAutoHide && (
          <aside className="hidden lg:block w-72 xl:w-80 shrink-0 sticky top-20">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col max-h-[calc(100vh-6rem)] overflow-hidden">
              <div className="px-3.5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/80 dark:bg-slate-800/50 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <LayoutGrid className="w-4 h-4 text-purple-600 shrink-0" />
                  <span className="font-black text-xs text-slate-800 dark:text-white truncate">
                    داشبورد عمودی مدیریت
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAdminSidebarAutoHide(true)}
                    className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-800 dark:text-amber-300 transition cursor-pointer"
                    title="تبدیل به مخفی خودکار (Auto-Hide)"
                  >
                    <PinOff className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAdminMenuLayout((prev) =>
                        prev === 'sidebar_right' ? 'sidebar_left' : 'sidebar_right'
                      )
                    }
                    className="p-1.5 rounded-lg bg-slate-200/70 dark:bg-slate-700/70 hover:bg-slate-300 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                    title="انتقال به سمت مقابل صفحه"
                  >
                    {adminMenuLayout === 'sidebar_right' ? (
                      <PanelLeft className="w-3.5 h-3.5" />
                    ) : (
                      <PanelRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminMenuLayout('top_cards')}
                    className="p-1.5 rounded-lg bg-slate-200/70 dark:bg-slate-700/70 hover:bg-slate-300 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                    title="تغییر به چیدمان کارتی بالا"
                  >
                    <PanelTop className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-2.5 space-y-2 overflow-y-auto flex-1">
                {(
                  [
                    {
                      key: 'cartable' as const,
                      title: 'کارتابل و مدیریت جامع سراها',
                      desc: 'اتاق‌ها، باز/بسته انتخاب اتاق و ورود سرا',
                      icon: Building2,
                      iconTone: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800',
                      activeRing: 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40',
                    },
                    {
                      key: 'users' as const,
                      title: 'مدیریت کاربران سامانه',
                      desc: 'دانشجویان، سرپرستان و واحدهای دانشگاه',
                      icon: Users,
                      iconTone: 'text-teal-600 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800',
                      activeRing: 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40',
                      badge: (
                        students.length +
                        supervisors.length +
                        campusStaff.length +
                        warehouseStaffList.length +
                        procurementStaffList.length +
                        counselorsList.length +
                        financeStaffList.length +
                        educationStaffList.length +
                        culturalStaffList.length +
                        studentAffairsStaffList.length +
                        securityStaffList.length +
                        viceDeanStaffList.length +
                        libraryStaffList.length +
                        smartCampusStaffList.length +
                        graduationStaffList.length +
                        academicDeputyStaffList.length
                      ).toLocaleString('fa-IR'),
                      badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900/70 dark:text-teal-200',
                    },
                    {
                      key: 'announcements' as const,
                      title: 'اطلاعیه‌های سایت و صفحه اول',
                      desc: 'انتشار اطلاعیه‌های عمومی و فوری',
                      icon: Bell,
                      iconTone: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800',
                      activeRing: 'border-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/40',
                      badge: announcements.length.toLocaleString('fa-IR'),
                      badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/70 dark:text-cyan-200',
                    },
                    {
                      key: 'requests' as const,
                      title: 'درخواست‌های اسکان، مهمان و آموزش',
                      desc: 'بررسی اسکان موقت، مهمان و مکاتبات',
                      icon: Clock,
                      iconTone: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
                      activeRing: 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40',
                      badge:
                        pendingStudents.length +
                          Storage.getGuestRequests().filter((g) => g.status === 'pending_supervisor').length +
                          academicNotices.filter((n) => n.status === 'pending').length >
                        0
                          ? (
                              pendingStudents.length +
                              Storage.getGuestRequests().filter((g) => g.status === 'pending_supervisor').length +
                              academicNotices.filter((n) => n.status === 'pending').length
                            ).toLocaleString('fa-IR')
                          : undefined,
                      badgeClass: 'bg-amber-500 text-white',
                    },
                    {
                      key: 'maintenance' as const,
                      title: 'تأسیسات و امور فنی سراها',
                      desc: 'ارجاع و پیگیری خرابی‌ها و تعمیرات',
                      icon: Wrench,
                      iconTone: 'text-orange-600 bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800',
                      activeRing: 'border-orange-500 bg-orange-50/70 dark:bg-orange-950/40',
                      badge: activeCampusMaintCount > 0 ? activeCampusMaintCount.toLocaleString('fa-IR') : undefined,
                      badgeClass: 'bg-rose-600 text-white',
                    },
                    {
                      key: 'warehouse' as const,
                      title: 'انبار و کارپردازی (مشاهده)',
                      desc: 'موجودی انبار، وضعیت خرید و درخواست اقلام',
                      icon: Package,
                      iconTone: 'text-violet-600 bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800',
                      activeRing: 'border-violet-500 bg-violet-50/70 dark:bg-violet-950/40',
                    },
                    {
                      key: 'warehouse_request' as const,
                      title: 'درخواست اقلام از انبار',
                      desc: 'ثبت درخواست اقلام اداری/مصرفی از انبار',
                      icon: PackagePlus,
                      iconTone: 'text-violet-700 bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800',
                      activeRing: 'border-violet-500 bg-violet-50/70 dark:bg-violet-950/40',
                      badge:
                        myPendingWarehouseRequestsCount > 0
                          ? `${myPendingWarehouseRequestsCount.toLocaleString('fa-IR')} جاری`
                          : undefined,
                      badgeClass: 'bg-violet-600 text-white',
                    },
                    {
                      key: 'shifts' as const,
                      title: 'شیفت‌بندی ماهانه سرپرستان',
                      desc: 'جدول ماهانه، ورود تکی/اکسل و گزارش‌ها',
                      icon: Calendar,
                      iconTone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
                      activeRing: 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40',
                    },
                    {
                      key: 'counseling' as const,
                      title: 'مرکز مشاوره و روانشناسی',
                      desc: 'مشاوران، شیفت‌ها و گزارش‌های مرکز',
                      icon: HeartHandshake,
                      iconTone: 'text-teal-600 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800',
                      activeRing: 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40',
                      badge: `${counselorsList.length} مشاور`,
                      badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900/70 dark:text-teal-200',
                    },
                    {
                      key: 'surveys' as const,
                      title: 'نظرسنجی‌های دوره‌ای',
                      desc: 'ایجاد و تحلیل نظرسنجی‌های دانشجویی',
                      icon: ClipboardList,
                      iconTone: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
                      activeRing: 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40',
                    },
                    {
                      key: 'clearance' as const,
                      title: 'تسویه حساب فارغ‌التحصیلان',
                      desc: 'نظارت بر فرآیند تسویه حساب واحدها',
                      icon: GraduationCap,
                      iconTone: 'text-sky-600 bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800',
                      activeRing: 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40',
                    },
                    {
                      key: 'course_scheduling' as const,
                      title: 'برنامه‌ریزی درسی جامع',
                      desc: 'ورود اطلاعات پایه، برنامه کلاس‌ها و گزارش‌های درسی',
                      icon: BookOpen,
                      iconTone: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
                      activeRing: 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40',
                      badge: 'تمام‌صفحه',
                      badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/70 dark:text-indigo-200',
                    },
                    {
                      key: 'community_chat' as const,
                      title: 'پیام‌رسان و تالارهای گفتگو',
                      desc: 'تنظیمات کامل چت، تالار عمومی، تأیید گروه‌ها و نظارت',
                      icon: MessagesSquare,
                      iconTone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
                      activeRing: 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40',
                    },
                    {
                      key: 'activity_log' as const,
                      title: 'لاگ فعالیت‌ها و دسترسی‌ها',
                      desc: 'تاریخچه عملیات و پایش امنیتی سامانه',
                      icon: Activity,
                      iconTone: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800',
                      activeRing: 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40',
                      badge: activityLogs.length.toLocaleString('fa-IR'),
                      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/70 dark:text-rose-200',
                    },
                    {
                      key: 'settings' as const,
                      title: 'تنظیمات و ظاهر سامانه',
                      desc: 'شخصی‌سازی ظاهر و فونت، سامانه‌ها و بکاپ',
                      icon: Settings,
                      iconTone: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
                      activeRing: 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40',
                    },
                  ] as Array<{
                    key: AdminMainTabKey;
                    title: string;
                    desc: string;
                    icon: React.ComponentType<{ className?: string }>;
                    iconTone: string;
                    activeRing: string;
                    badge?: string;
                    badgeClass?: string;
                  }>
                ).map((item) => {
                  const IconComp = item.icon;
                  const isOpen = mainTab === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleToggleOrSelectTab(item.key)}
                      title={isOpen ? `کلیک مجدد برای بستن «${item.title}»` : `باز کردن «${item.title}»`}
                      className={`group text-right p-3 rounded-2xl border transition-all duration-150 cursor-pointer w-full ${
                        isOpen
                          ? `${item.activeRing} shadow-sm`
                          : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:border-teal-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${item.iconTone}`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center flex-wrap gap-1">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white leading-snug">
                                {item.title}
                              </span>
                              {item.badge && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${item.badgeClass || ''}`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-3.5 h-3.5 shrink-0 mt-1 transition-transform ${
                            isOpen ? 'rotate-180 text-teal-600' : 'text-slate-400'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        )}

        <div className="flex-1 min-w-0 space-y-6">
          {/* پیام سبک راهنما زمانی که هیچ بخشی باز نیست و منو در حالت عمودی قرار دارد */}
          {mainTab === null && adminMenuLayout !== 'top_cards' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <h3 className="font-black text-sm sm:text-base text-slate-800 dark:text-white">
                بخشی برای نمایش انتخاب نشده است
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {adminSidebarAutoHide
                  ? `برای شروع، نشانگر را روی نوار عمودی سمت ${adminMenuLayout === 'sidebar_right' ? 'راست' : 'چپ'} صفحه ببرید یا روی آیکون منو کلیک کنید تا بخش مورد نظر باز شود.`
                  : `برای شروع، یکی از بخش‌های مدیریتی را از داشبورد عمودی سمت ${adminMenuLayout === 'sidebar_right' ? 'راست' : 'چپ'} انتخاب کنید. با کلیک مجدد روی هر بخش، بسته می‌شود.`}
              </p>
            </div>
          )}

      {/* ========================================================= */}
      {/* بخش مجزا و منظم مدیریت کاربران سامانه */}
      {/* ========================================================= */}
      {mainTab === 'users' && (
        <AdminUsersPanel
          activeCategory={usersCategory}
          onCategoryChange={setUsersCategory}
          students={students}
          dorms={dorms}
          rooms={rooms}
          beds={beds}
          supervisors={supervisors}
          maintenanceStaff={campusStaff}
          warehouseStaff={warehouseStaffList}
          counselors={counselorsList}
          financeStaff={financeStaffList}
          procurementStaff={procurementStaffList}
          educationStaff={educationStaffList}
          culturalStaff={culturalStaffList}
          studentAffairsStaff={studentAffairsStaffList}
          securityStaff={securityStaffList}
          viceDeanStaff={viceDeanStaffList}
          libraryStaff={libraryStaffList}
          smartCampusStaff={smartCampusStaffList}
          graduationStaff={graduationStaffList}
          academicDeputyStaff={academicDeputyStaffList}
          settings={localSettings}
          onRefreshData={handleUsersRefresh}
          onOpenExcelModal={onOpenExcelModal}
          onOpenReports={onOpenReports}
          onAddStudent={handleOpenAddStudent}
          onEditStudent={handleOpenEditStudent}
          onDeleteStudent={handleDeleteStudent}
          onViewStudentCard={(st) => setViewCardStudent(st)}
          onOpenDiningMealCard={(st) => setDiningCardStudent(st)}
          onEvaluateStudent={(st) => {
            setEvalTargetStudent(st);
            setIsStudentEvalModalOpen(true);
          }}
          onAssignStudentRoom={handleOpenAssignStudentModal}
          onEvictStudent={handleAdminEvictStudent}
          studentSecondaryEditEnabled={Boolean(localSettings.studentSecondaryEditEnabled)}
          onToggleStudentSecondaryEdit={handleToggleStudentSecondaryEdit}
          actorId="admin"
          actorName="مدیر کل سامانه"
          actorRole="admin"
          onImpersonateUser={onImpersonateUser}
        />
      )}

      {/* بخش نظارت و مدیریت تسویه حساب فارغ‌التحصیلان */}
      {mainTab === 'clearance' && (
        <GraduationClearanceReviewPanel
          unitRole="admin"
          reviewerId="admin"
          reviewerName="مدیر کل سامانه"
          settings={localSettings}
          onDataChange={onRefreshData}
        />
      )}

      {/* بخش مدیریت کامل پیام‌رسان دانشجویی، تالار گفتگوی عمومی و گروه‌های تخصصی */}
      {mainTab === 'community_chat' && (
        <CommunityChatHub
          currentUser={{ role: 'admin', name: 'مدیر کل سامانه', username: 'admin' }}
          students={students}
          mode="embedded"
          initialView="moderation"
          cloudSyncTick={cloudSyncTick}
          onRefreshGlobalData={onRefreshData}
        />
      )}

      {/* ========================================================= */}
      {/* ۱. تب کارتابل و مدیریت جامع سراها (امکانات کامل سرپرستی برای مدیر) */}
      {/* ========================================================= */}
      {mainTab === 'cartable' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* کارت سربرگ کارتابل سرپرستی با انتخاب سرا و آمار */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-indigo-800/40">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-indigo-300">کارتابل جامع سرپرستی سراها (اختیارات کامل مدیر)</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black">
                  {selectedCartableDormId === 'all'
                    ? 'نظارت و مدیریت جامع تمامی سراهای دانشجویی'
                    : dorms.find((d) => d.id === selectedCartableDormId)?.name}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  مدیریت مستقیم اتاق‌ها، جابجایی دستی دانشجو، نقشه بصری، اخطارهای انضباطی و فهرست کامل دانشجومعلمان
                </p>
              </div>

              {/* آمار خلاصه سراها */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs text-center border border-white/10 min-w-[90px]">
                  <span className="block text-[11px] text-indigo-200">کل ظرفیت تخت</span>
                  <span className="text-lg font-black text-white">{cartableTotalBeds}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs text-center border border-white/10 min-w-[90px]">
                  <span className="block text-[11px] text-indigo-200">اشغال شده</span>
                  <span className="text-lg font-black text-white">{cartableOccupiedBeds}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs text-center border border-white/10 min-w-[90px]">
                  <span className="block text-[11px] text-emerald-300">تخت‌های خالی</span>
                  <span className="text-lg font-black text-emerald-400">{cartableVacantBeds}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs text-center border border-white/10 min-w-[90px]">
                  <span className="block text-[11px] text-indigo-200">درصد اشغال</span>
                  <span className="text-lg font-black text-indigo-300">٪{cartableOccupancyRate}</span>
                </div>
              </div>
            </div>

            {/* سوئیچر انتخاب سرا جهت فیلتر و مدیریت */}
            <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-indigo-200">انتخاب سرای مورد نظر:</span>
                <button
                  onClick={() => setSelectedCartableDormId('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedCartableDormId === 'all'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-indigo-100'
                  }`}
                >
                  همه سراهای دانشگاه ({dorms.length} سرا)
                </button>
                {dorms.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedCartableDormId(d.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedCartableDormId === d.id
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white/10 hover:bg-white/20 text-indigo-100'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>

              {/* اکشن‌های سریع سرپرستی و مدیریت سراها برای مدیر */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleSelectionActive}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-md cursor-pointer border ${
                    settings.selectionActive
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-400/50 shadow-emerald-600/25'
                      : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-400/50 shadow-rose-600/25'
                  }`}
                  title="کلیک برای باز کردن یا بستن فوری امکان انتخاب اتاق و تخت توسط دانشجویان"
                >
                  {settings.selectionActive ? (
                    <Unlock className="w-4 h-4 shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 shrink-0" />
                  )}
                  <span>
                    {settings.selectionActive
                      ? 'انتخاب اتاق و تخت: باز (کلیک برای بستن)'
                      : 'انتخاب اتاق و تخت: بسته (کلیک برای باز کردن)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddDormModalOpen(true)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/25 cursor-pointer"
                  title="ثبت تکی سرای دانشجویی جدید با تنظیمات طبقات و اتاق‌ها"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن سرا (تکی)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenExcelModal('dorms')}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-600/25 cursor-pointer"
                  title="ورود دسته‌جمعی سراها، اتاق‌ها و تخت‌ها از طریق فایل اکسل"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>ورود سراها از اکسل</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAdminRoomPrintModalOpen(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/25 cursor-pointer"
                  title="چاپ لیست تصویری دانشجویان اتاق‌ها در قطع A4 یا A5 با قابلیت انتخاب فیلدها و اتاق‌ها"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپ لیست دانشجویان اتاق‌ها (A4 / A5)</span>
                </button>
                <button
                  onClick={() => setIsAdminWarningModalOpen(true)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>صدور اخطار انضباطی به اتاق</span>
                </button>
              </div>
            </div>
          </div>

          {/* زیرتب‌های کارتابل سرپرستی */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              onClick={() => setCartableSubTab('manager')}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 ${
                cartableSubTab === 'manager'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <BedIcon className="w-4 h-4" />
              <span>مدیریت تفکیکی اتاق‌ها، نماینده و جابجایی دستی دانشجو</span>
            </button>

            <button
              onClick={() => setCartableSubTab('visual_picker')}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 ${
                cartableSubTab === 'visual_picker'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>نقشه بصری و تعاملی تخت‌ها (حالت سرپرستی)</span>
            </button>

            <button
              onClick={() => setCartableSubTab('warnings')}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 ${
                cartableSubTab === 'warnings'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>فهرست اخطارها و تذکرات انضباطی ({cartableWarnings.length})</span>
            </button>

            <button
              onClick={() => setCartableSubTab('structure')}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 ${
                cartableSubTab === 'structure'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>ثبت و مدیریت سراها، اتاق‌ها و تخت‌ها</span>
            </button>

            <button
              onClick={() => {
                setUsersCategory('students');
                setMainTab('users');
              }}
              className="px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 mr-auto"
            >
              <Users className="w-4 h-4" />
              <span>مدیریت دانشجویان ({students.length})</span>
            </button>
          </div>

          {/* محتوای زیرتب‌ها */}
          {cartableSubTab === 'manager' && (
            <SupervisorRoomManager
              dorms={cartableDorms}
              rooms={rooms}
              beds={beds}
              students={students}
              settings={settings}
              onDataChanged={onRefreshData}
              supervisorDormId={selectedCartableDormId}
              actorName="مدیریت کل سامانه جامع خدمات دانشجویی"
              actorRole="admin"
              actorId="admin"
              onEditStudent={handleOpenEditStudent}
              onImpersonateStudent={
                onImpersonateUser
                  ? (st) => onImpersonateUser({ role: 'student', student: st })
                  : undefined
              }
            />
          )}

          {cartableSubTab === 'visual_picker' && (
            <VisualBedPicker
              dorms={cartableDorms}
              rooms={rooms}
              beds={beds}
              students={students}
              settings={settings}
              onBedSelected={onRefreshData}
              isSupervisorMode={true}
              actorName="مدیریت کل سامانه جامع خدمات دانشجویی"
              actorRole="admin"
              actorId="admin"
            />
          )}

          {cartableSubTab === 'warnings' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      فهرست اخطارهای انضباطی صادره برای اتاق‌ها
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setEvalTargetStudent(null);
                        setIsStudentEvalModalOpen(true);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Award className="w-4 h-4" />
                      <span>ثبت تذکر / اخطار / نمره ارزیابی دانشجو</span>
                    </button>
                    <button
                      onClick={() => setIsAdminWarningModalOpen(true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>ثبت اخطار جدید به اتاق</span>
                    </button>
                  </div>
                </div>

                {cartableWarnings.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                    هیچ اخطاری برای سراهای انتخابی ثبت نشده است.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartableWarnings.map((warn) => {
                      const r = rooms.find((rm) => rm.id === warn.roomId);
                      const d = dorms.find((dm) => dm.id === warn.dormId);

                      return (
                        <div
                          key={warn.id}
                          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            warn.resolved
                              ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-70'
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
                                  warn.resolved ? 'bg-slate-200 text-slate-700' : 'bg-rose-600 text-white'
                                }`}
                              >
                                {warn.resolved ? 'برطرف شده' : 'فعال'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-800 dark:text-slate-200 font-bold">{warn.title}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{warn.description}</p>
                            <span className="text-[10px] text-slate-400 mt-2 block">
                              صادرکننده: {warn.supervisorName} • تاریخ: {warn.date}
                            </span>
                          </div>

                          {!warn.resolved && (
                            <button
                              onClick={() => {
                                Storage.resolveWarning(warn.id);
                                onRefreshData();
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 transition cursor-pointer shadow-xs"
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

              {/* فهرست تذکرات، اخطارها و نمرات ارزیابی فردی و اتاق دانشجویان */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        سوابق تذکر، اخطار و نمرات ارزیابی فردی / اتاق دانشجویان ({studentEvaluations.length})
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        کلیه موارد ثبت‌شده مستقیماً در کارتابل شخصی دانشجو قابل مشاهده هستند.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEvalTargetStudent(null);
                      setIsStudentEvalModalOpen(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ثبت مورد جدید برای دانشجو</span>
                  </button>
                </div>

                {studentEvaluations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                    تاکنون هیچ تذکر، اخطار یا نمره ارزیابی فردی/اتاقی برای دانشجویان ثبت نشده است.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {studentEvaluations.map((ev) => {
                      const summonsTargetLabel =
                        ev.summonsTarget === 'disciplinary_council'
                          ? 'شورای انضباطی'
                          : ev.summonsTarget === 'security'
                          ? 'حراست دانشگاه'
                          : 'سرپرستی سرا';
                      const scoreCategoryLabel =
                        ev.scoreCategory === 'discipline'
                          ? 'انضباط و مقررات سکونت و رفت و آمد'
                          : ev.scoreCategory === 'cleanliness'
                          ? 'نظافت فردی و اجتماعی'
                          : null;
                      return (
                      <div
                        key={ev.id}
                        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          ev.type === 'evaluation'
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                            : ev.type === 'report'
                            ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
                            : ev.type === 'summons'
                            ? 'bg-purple-50/60 dark:bg-purple-950/25 border-purple-200 dark:border-purple-900/50'
                            : ev.type === 'negative_score'
                            ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                            : ev.type === 'warning'
                            ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                            : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold ${
                                ev.type === 'evaluation'
                                  ? 'bg-emerald-600 text-white'
                                  : ev.type === 'report'
                                  ? 'bg-blue-600 text-white'
                                  : ev.type === 'summons'
                                  ? 'bg-purple-700 text-white'
                                  : ev.type === 'negative_score'
                                  ? 'bg-rose-700 text-white'
                                  : ev.type === 'warning'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-amber-500 text-white'
                              }`}
                            >
                              {ev.type === 'evaluation'
                                ? `نمره ارزیابی: ${ev.score ?? '-'} از ۱۰۰`
                                : ev.type === 'report'
                                ? 'گزارش'
                                : ev.type === 'summons'
                                ? `فراخوانی به ${summonsTargetLabel}`
                                : ev.type === 'negative_score'
                                ? `نمره منفی (${ev.negativePoints ?? 0}- امتیاز)`
                                : ev.type === 'warning'
                                ? 'اخطار رسمی'
                                : 'تذکر'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
                              {ev.scope === 'room' ? 'گستره: اتاق' : 'گستره: فردی'}
                            </span>
                            {scoreCategoryLabel && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-100/80 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 font-bold">
                                بخش: {scoreCategoryLabel}
                              </span>
                            )}
                            {ev.type === 'summons' && ev.summonsSchedule && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 font-bold">
                                زمان مراجعه: {ev.summonsSchedule}
                              </span>
                            )}
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {ev.studentName} ({ev.studentId})
                            </span>
                            {ev.dormName && (
                              <span className="text-[11px] text-slate-500">
                                • {ev.dormName} {ev.roomNumber ? `(اتاق ${ev.roomNumber})` : ''}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{ev.title}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">{ev.description}</div>
                          <div className="text-[10px] text-slate-400">
                            ثبت‌کننده: {ev.evaluatorName} • تاریخ: {ev.date}
                            {(ev.type === 'notice' || ev.type === 'warning' || ev.type === 'summons') &&
                              ` • وضعیت: ${ev.resolved ? 'برطرف شده' : 'فعال'}`}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {(ev.type === 'notice' || ev.type === 'warning' || ev.type === 'summons') && !ev.resolved && (
                            <button
                              onClick={() => {
                                Storage.resolveStudentEvaluation(ev.id);
                                setStudentEvaluations(Storage.getStudentEvaluations());
                                setActivityLogs(Storage.getActivityLogs());
                                onRefreshData();
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              رفع مورد
                            </button>
                          )}
                          <button
                            onClick={() => {
                              Storage.deleteStudentEvaluation(ev.id);
                              setStudentEvaluations(Storage.getStudentEvaluations());
                              setActivityLogs(Storage.getActivityLogs());
                              onRefreshData();
                            }}
                            className="p-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 transition cursor-pointer"
                            title="حذف سابقه"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* زیرتب مدیریت و ثبت ساختار سراها، اتاق‌ها و تخت‌ها */}
          {cartableSubTab === 'structure' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      ثبت و مدیریت ساختار سراها، اتاق‌ها و تخت‌ها (اختیارات کامل مدیر)
                    </h3>
                    <p className="text-xs text-slate-400">
                      تعریف سرای جدید، ایجاد اتاق با ظرفیت دلخواه، افزودن و حذف تخت و مدیریت مستقیم اسکان
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsAddDormModalOpen(true)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ثبت سرای دانشجویی جدید</span>
                  </button>

                  <button
                    onClick={() => {
                      setRoomDormId(structureDormFilter !== 'all' ? structureDormFilter : dorms[0]?.id || '');
                      setIsAddRoomModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ثبت اتاق جدید با تخت‌ها</span>
                  </button>
                </div>
              </div>

              {/* راهنمای قاعده شماره‌گذاری زوج بالا و فرد پایین */}
              <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold">
                  <ArrowUpDown className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>قاعده کشوری چیدمان و شماره تخت‌ها در سراهای دانشجویی:</span>
                  <span className="font-normal text-teal-800 dark:text-teal-300">
                    شماره‌های <strong className="font-black text-teal-950 dark:text-teal-100">فرد (۱، ۳، ۵، ۷، ...)</strong> طبقه پایین و شماره‌های <strong className="font-black text-teal-950 dark:text-teal-100">زوج (۲، ۴، ۶، ۸، ...)</strong> طبقه بالا هستند.
                  </span>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-teal-200/70 dark:bg-teal-900 text-teal-900 dark:text-teal-100 font-extrabold shrink-0 self-start sm:self-auto">
                  مثلاً ۸ تخته: ۱، ۳، ۵، ۷ پایین | ۲، ۴، ۶، ۸ بالا
                </span>
              </div>

              {/* فیلتر سرا و جستجوی اتاق / دانشجو */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">مشاهده ساختار سرا:</span>
                  <button
                    onClick={() => setStructureDormFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      structureDormFilter === 'all'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    همه سراها ({dorms.length})
                  </button>
                  {dorms.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setStructureDormFilter(d.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        structureDormFilter === d.id
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>

                <div className="relative w-full lg:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={structureSearchQuery}
                    onChange={(e) => setStructureSearchQuery(e.target.value)}
                    placeholder="جستجوی اتاق یا نام، کد دانشجویی، کد ملی دانشجو..."
                    className="w-full pr-9 pl-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  {structureSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setStructureSearchQuery('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title="پاک کردن جستجو"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* نمایش اطلاعات و ساختار سراهای فیلترشده */}
              {(() => {
                const q = normSearchText(structureSearchQuery);
                const doesResidentMatch = (st?: Student) => {
                  if (!q || !st) return false;
                  return [
                    st.fullName,
                    st.studentId,
                    st.nationalId,
                    st.mobile,
                    st.fieldOfStudy,
                    st.city,
                    st.province,
                  ]
                    .map(normSearchText)
                    .join(' ')
                    .includes(q);
                };

                const otherDormHits = q
                  ? dorms
                      .filter((d) => structureDormFilter !== 'all' && d.id !== structureDormFilter)
                      .map((d) => {
                        const dRooms = rooms.filter((r) => r.dormId === d.id);
                        let matchedRoomCount = 0;
                        let sampleLabel = '';
                        dRooms.forEach((rm) => {
                          const rmBeds = beds.filter((b) => b.roomId === rm.id);
                          const matchedStudents = rmBeds
                            .map((b) => (b.studentId ? students.find((s) => s.studentId === b.studentId) : undefined))
                            .filter((st): st is Student => doesResidentMatch(st));
                          if (normSearchText(rm.roomNumber).includes(q) || matchedStudents.length > 0) {
                            matchedRoomCount += 1;
                            if (!sampleLabel && matchedStudents[0]) {
                              sampleLabel = `${matchedStudents[0].fullName} (اتاق ${rm.roomNumber})`;
                            }
                          }
                        });
                        return { dorm: d, matchedRoomCount, sampleLabel };
                      })
                      .filter((x) => x.matchedRoomCount > 0)
                  : [];

                const visibleDorms = (
                  structureDormFilter === 'all' ? dorms : dorms.filter((d) => d.id === structureDormFilter)
                ).filter((dorm) => {
                  if (!q || structureDormFilter !== 'all') return true;
                  const dormRooms = rooms.filter((r) => r.dormId === dorm.id);
                  return dormRooms.some((room) => {
                    if (normSearchText(room.roomNumber).includes(q)) return true;
                    const roomBeds = beds.filter((b) => b.roomId === room.id);
                    return roomBeds.some((b) => {
                      const resident = b.studentId
                        ? students.find((s) => s.studentId === b.studentId)
                        : undefined;
                      return doesResidentMatch(resident);
                    });
                  });
                });

                return (
                  <div className="space-y-6">
                    {otherDormHits.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                          <Search className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>نتایج جستجو در سایر سراها نیز یافت شد:</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {otherDormHits.map((hit) => (
                            <button
                              key={hit.dorm.id}
                              type="button"
                              onClick={() => setStructureDormFilter(hit.dorm.id)}
                              className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition cursor-pointer shadow-xs"
                            >
                              {hit.dorm.name} ({hit.matchedRoomCount} اتاق{hit.sampleLabel ? ` — ${hit.sampleLabel}` : ''})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {visibleDorms.length === 0 ? (
                      <div className="p-10 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 space-y-2">
                        <p>هیچ اتاق یا دانشجویی مطابق جستجو در سراها یافت نشد.</p>
                        <button
                          type="button"
                          onClick={() => setStructureSearchQuery('')}
                          className="px-3.5 py-1.5 rounded-xl bg-teal-600 text-white font-bold cursor-pointer"
                        >
                          پاک کردن جستجو
                        </button>
                      </div>
                    ) : (
                      visibleDorms.map((dorm) => {
                        const allDormRooms = rooms.filter((r) => r.dormId === dorm.id);
                        const dormRooms = q
                          ? allDormRooms.filter((room) => {
                              if (normSearchText(room.roomNumber).includes(q)) return true;
                              const roomBeds = beds.filter((b) => b.roomId === room.id);
                              return roomBeds.some((b) => {
                                const resident = b.studentId
                                  ? students.find((s) => s.studentId === b.studentId)
                                  : undefined;
                                return doesResidentMatch(resident);
                              });
                            })
                          : allDormRooms;
                        const dormBeds = beds.filter((b) => b.dormId === dorm.id);
                        const dormOccupied = dormBeds.filter((b) => b.studentId).length;
                        const dormVacant = dormBeds.length - dormOccupied;

                        return (
                          <div
                            key={dorm.id}
                            className="p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4"
                          >
                            {/* سربرگ سرا */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700/60">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                                    <Building2 className="w-4 h-4" />
                                  </span>
                                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                                    {dorm.name}
                                  </h4>
                                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                    {dorm.gender === 'brothers' ? 'برادران' : 'خواهران'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  {dorm.campus} • تعداد طبقات: {dorm.totalFloors} • سرپرست: {dorm.supervisorName || 'تعیین نشده'}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                                  {allDormRooms.length} اتاق • {dormBeds.length} تخت ({dormVacant} خالی)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditDorm(dorm)}
                                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="تغییر نام و ویرایش مشخصات این سرا"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>تغییر نام / ویرایش سرا</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteDormitory(dorm.id, dorm.name)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                  title="حذف کامل این سرا"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* لیست اتاق‌های این سرا */}
                            {dormRooms.length === 0 ? (
                              <div className="p-6 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                {q
                                  ? 'اتاق یا دانشجویی مطابق جستجو در این سرا یافت نشد.'
                                  : 'هیچ اتاقی در این سرا ثبت نشده است. با کلیک بر روی «ثبت اتاق جدید با تخت‌ها» اقدام به ایجاد اتاق نمایید.'}
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {dormRooms.map((room) => {
                                  const roomBeds = beds.filter((b) => b.roomId === room.id);
                                  const occupiedBeds = roomBeds.filter((b) => b.studentId);
                                  const isFull = occupiedBeds.length >= roomBeds.length;
                                  const matchedResidentCount = q
                                    ? roomBeds.filter((b) => {
                                        const resident = b.studentId
                                          ? students.find((s) => s.studentId === b.studentId)
                                          : undefined;
                                        return doesResidentMatch(resident);
                                      }).length
                                    : 0;
                                  const isRoomHighlighted = Boolean(q) && matchedResidentCount > 0;

                                  return (
                                    <div
                                      key={room.id}
                                      className={`bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs space-y-3 transition ${
                                        isRoomHighlighted
                                          ? 'border-2 border-amber-500 dark:border-amber-400 ring-2 ring-amber-400/35 shadow-md'
                                          : 'border border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-1 flex-wrap">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <DoorOpen className="w-4 h-4 text-teal-600" />
                                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                            اتاق {room.roomNumber}
                                          </span>
                                          <span className="text-[10px] text-slate-400">
                                            (طبقه {room.floor === 0 ? 'همکف' : room.floor})
                                          </span>
                                          {isRoomHighlighted && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black">
                                              {matchedResidentCount} نتیجه
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <span
                                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                              isFull
                                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                            }`}
                                          >
                                            {occupiedBeds.length} از {roomBeds.length} تخت پر
                                          </span>

                                          <button
                                            type="button"
                                            onClick={() => handleOpenEditRoom(room)}
                                            className="p-1 text-slate-400 hover:text-amber-600 transition cursor-pointer"
                                            title="تغییر نام / شماره و طبقه اتاق"
                                          >
                                            <Edit3 className="w-3.5 h-3.5" />
                                          </button>

                                          <button
                                            onClick={() => handleDeleteRoom(room.id, room.roomNumber)}
                                            className="p-1 text-slate-300 hover:text-rose-600 transition cursor-pointer"
                                            title="حذف کامل اتاق و تخت‌های آن"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* لیست تخت‌های این اتاق */}
                                      <div className="space-y-1.5 text-xs">
                                        {roomBeds.map((bed) => {
                                          const resident = students.find((s) => s.studentId === bed.studentId);
                                          const isResidentHighlighted = doesResidentMatch(resident);

                                          return (
                                            <div
                                              key={bed.id}
                                              className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition ${
                                                isResidentHighlighted
                                                  ? 'bg-amber-100/95 dark:bg-amber-950/75 border-2 border-amber-500 dark:border-amber-400 ring-2 ring-amber-400/50 shadow-xs'
                                                  : resident
                                                  ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                                  : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                                              }`}
                                            >
                                              <div className="flex items-center gap-1.5 truncate">
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 shrink-0 font-mono">
                                                  تخت {bed.bedNumber ?? (bed.bunkNumber ? (bed.tier === 'lower' ? bed.bunkNumber * 2 - 1 : bed.bunkNumber * 2) : '')} ({bed.tier === 'lower' ? 'پایین ⬇️' : 'بالا ⬆️'})
                                                </span>
                                                {resident ? (
                                                  <div className="truncate flex items-center gap-1">
                                                    {isResidentHighlighted && (
                                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black shrink-0">
                                                        نتیجه جستجو
                                                      </span>
                                                    )}
                                                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                                      {resident.fullName}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mr-0.5 font-mono shrink-0">
                                                      ({resident.studentId})
                                                    </span>
                                                  </div>
                                                ) : (
                                                  <span className="text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                                                    (خالی و آماده اسکان)
                                                  </span>
                                                )}
                                              </div>

                                              <div className="flex items-center gap-1 shrink-0">
                                                {resident ? (
                                                  <button
                                                    onClick={() => handleAdminEvictStudent(resident)}
                                                    className="p-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[10px] font-bold transition cursor-pointer"
                                                    title="تخلیه دانشجو از این تخت"
                                                  >
                                                    <UserMinus className="w-3 h-3" />
                                                  </button>
                                                ) : (
                                                  <>
                                                    <button
                                                      onClick={() => {
                                                        const unassigned = students.find((s) => !s.assignedBedId || s.assignmentStatus === 'none');
                                                        if (unassigned) {
                                                          handleOpenAssignStudentModal(unassigned);
                                                          setAssignTargetDormId(dorm.id);
                                                          setAssignTargetRoomId(room.id);
                                                          setAssignTargetBedId(bed.id);
                                                        } else {
                                                          setAdminNoticeDialog({
                                                            title: 'عدم وجود دانشجوی فاقد اسکان',
                                                            message: 'در حال حاضر هیچ دانشجوی فاقد اسکانی در سیستم یافت نشد.',
                                                            tone: 'error',
                                                          });
                                                        }
                                                      }}
                                                      className="p-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold transition cursor-pointer"
                                                      title="تخصیص به دانشجو"
                                                    >
                                                      <UserCheck className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                      onClick={() => handleDeleteBed(bed.id, bed.label)}
                                                      className="p-1 text-slate-300 hover:text-rose-500 transition cursor-pointer"
                                                      title="حذف این تخت"
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                    </button>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* افزودن تخت به اتاق با رعایت قاعده زوج بالا / فرد پایین */}
                                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                                        <span className="text-slate-500 font-medium">
                                          تخت بعدی: شماره {roomBeds.length + 1} ({(roomBeds.length + 1) % 2 === 1 ? 'طبقه پایین ⬇️' : 'طبقه بالا ⬆️'})
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleAddBedToRoom(room.id, (roomBeds.length + 1) % 2 === 1 ? 'lower' : 'upper')}
                                          className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer transition shadow-xs"
                                        >
                                          + افزودن تخت شماره {roomBeds.length + 1} ({(roomBeds.length + 1) % 2 === 1 ? 'پایین' : 'بالا'})
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* ۲. تب ثبت و انتشار اطلاعیه‌های سایت و صفحه اول */}
      {/* ========================================================= */}
      {mainTab === 'announcements' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {annFeedback && (
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{annFeedback}</span>
            </div>
          )}

          {/* فرم ثبت اطلاعیه جدید */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  ثبت و انتشار اطلاعیه رسمی سامانه جامع خدمات دانشجویی
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  امکان تنظیم انتشار در صفحه اول سایت جهت مشاهده عمومی و مراجعین قبل از ورود، یا اختصاصی دانشجویان سراها
                </p>
              </div>
            </div>

            <form onSubmit={handleAdminCreateAnnouncement} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    عنوان اطلاعیه *
                  </label>
                  <input
                    type="text"
                    value={newAnnTitle}
                    onChange={(e) => setNewAnnTitle(e.target.value)}
                    placeholder="مثلاً آغاز فرآیند انتخاب اتاق و تخت سراهای دانشجویی برای نیمسال اول..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    درجه اهمیت و اولویت
                  </label>
                  <select
                    value={newAnnPriority}
                    onChange={(e) => setNewAnnPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="normal">عادی (اطلاع‌رسانی عمومی)</option>
                    <option value="important">مهم (دستورالعمل‌ها و زمان‌بندی)</option>
                    <option value="urgent">فوری و الزامی (هشدارها و اطلاعیه‌های ویژه)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  متن و شرح کامل اطلاعیه * (با امکان انتخاب فونت، رنگ، اندازه، تراز وسط/چپ/راست، بولت‌های متنوع، جدول و تصویر در متن)
                </label>
                <RichTextEditor
                  valueHtml={newAnnContentHtml}
                  onChange={(html, plain) => {
                    setNewAnnContentHtml(html);
                    setNewAnnContent(plain);
                  }}
                  customFonts={localSettings.customFonts}
                  resetKey={annEditorResetKey}
                  minHeightClass="min-h-[160px]"
                  placeholder="متن کامل بخشنامه یا اطلاعیه رسمی را درج فرمایید. می‌توانید متن را وسط‌چین/راست‌چین/چپ‌چین کنید، بولت‌های متنوع، جدول یا تصویر در داخل متن اضافه کنید..."
                />
              </div>

              {/* امکان افزودن عکس و تصویر به اطلاعیه */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-teal-600" />
                  <span>پوستر یا تصویر ضمیمه اطلاعیه (اختیاری)</span>
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs">
                    <Upload className="w-4 h-4 text-teal-600" />
                    <span>بارگذاری تصویر (PNG / JPG / WebP)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAnnImageUpload}
                      className="hidden"
                    />
                  </label>

                  {newAnnImage && (
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-700">
                      <img
                        src={newAnnImage}
                        alt="پیش‌نمایش تصویر اطلاعیه"
                        className="w-16 h-16 object-contain bg-white dark:bg-slate-900 rounded-lg border border-teal-500 shadow-xs cursor-pointer hover:opacity-90"
                        onClick={() => setAnnPreviewImage(newAnnImage)}
                        title="مشاهده در ابعاد واقعی و بزرگ"
                      />
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-teal-900 dark:text-teal-200 block">
                          تصویر متصل شد
                        </span>
                        <button
                          type="button"
                          onClick={() => setNewAnnImage(null)}
                          className="text-[10px] text-rose-600 font-bold hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          حذف عکس
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40">
                <div>
                  <label className="block text-xs font-bold text-teal-900 dark:text-teal-200 mb-1.5">
                    مخاطب اطلاعیه / سرای هدف:
                  </label>
                  <select
                    value={newAnnTargetDormId}
                    onChange={(e) => setNewAnnTargetDormId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="all">تمامی سراها و دانشجویان</option>
                    {dorms.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center sm:pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAnnShowOnHome}
                      onChange={(e) => setNewAnnShowOnHome(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
                      ★ انتشار در صفحه اول سایت (مشاهده عمومی قبل از ورود)
                    </span>
                  </label>
                </div>

                <div className="flex items-center sm:pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAnnPinned}
                      onChange={(e) => setNewAnnPinned(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
                      سنجاق کردن در بالای لیست اطلاعیه‌ها
                    </span>
                  </label>
                </div>

                <div className="sm:col-span-2 lg:col-span-3 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/70">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAnnPublishInNotifications}
                      onChange={(e) => setNewAnnPublishInNotifications(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-amber-900 dark:text-amber-200 block">
                        انتشار در نوتیفیکیشن و اعلان‌های کاربران
                      </span>
                      <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed block mt-0.5">
                        اطلاعیه‌های صفحه اول به‌صورت پیش‌فرض در نوتیفیکیشن کاربران ارسال نمی‌شوند؛ تنها در صورت زدن این تیک، به‌عنوان اعلان جدید در زنگوله نوتیفیکیشن کاربران نمایش داده خواهند شد.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {editingAnnId && (
                  <button
                    type="button"
                    onClick={handleCancelEditAnnouncement}
                    className="px-5 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-xs font-bold transition cursor-pointer"
                  >
                    انصراف از ویرایش
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-teal-600/25 transition cursor-pointer flex items-center gap-2 hover:scale-105"
                >
                  {editingAnnId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingAnnId ? 'ذخیره تغییرات اطلاعیه' : 'ثبت و انتشار فوری اطلاعیه'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* فهرست کلیه اطلاعیه‌ها با امکان کنترل انتشار در صفحه اول */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <span>اطلاعیه‌های فعال سامانه ({announcements.length})</span>
              </h4>
              <span className="text-xs text-slate-400">
                با کلیک روی دکمه چشم می‌توانید انتشار در صفحه اول را فعال یا غیرفعال فرمایید.
              </span>
            </div>

            {announcements.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                در حال حاضر هیچ اطلاعیه‌ای ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition ${
                      ann.priority === 'urgent'
                        ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                        : ann.priority === 'important'
                        ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {ann.priority === 'urgent' && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-extrabold">
                            فوری
                          </span>
                        )}
                        {ann.priority === 'important' && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-extrabold">
                            مهم
                          </span>
                        )}
                        {ann.pinned && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold flex items-center gap-1">
                            <Pin className="w-3 h-3" /> سنجاق شده
                          </span>
                        )}
                        {ann.showOnHomePage !== false ? (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            منتشر شده در صفحه اول
                          </span>
                        ) : (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-bold flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            مخفی از صفحه اول
                          </span>
                        )}
                        {ann.publishInNotifications ? (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                            <Bell className="w-3 h-3" />
                            ارسال در نوتیفیکیشن
                          </span>
                        ) : (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-bold">
                            بدون نوتیفیکیشن
                          </span>
                        )}
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mr-1">
                          {ann.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {/* دکمه ویرایش اطلاعیه */}
                        <button
                          onClick={() => handleStartEditAnnouncement(ann)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-300 dark:border-amber-800 transition flex items-center gap-1 cursor-pointer"
                          title="ویرایش متن و مشخصات اطلاعیه"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>ویرایش</span>
                        </button>

                        {/* دکمه تغییر وضعیت انتشار در نوتیفیکیشن */}
                        <button
                          onClick={() => handleToggleAnnouncementNotifications(ann.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            ann.publishInNotifications
                              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-xs'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                          }`}
                          title="تغییر وضعیت انتشار در نوتیفیکیشن کاربران"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>{ann.publishInNotifications ? 'نوتیفیکیشن: فعال' : 'نوتیفیکیشن: غیرفعال'}</span>
                        </button>

                        {/* دکمه تغییر وضعیت انتشار در صفحه اول */}
                        <button
                          onClick={() => handleToggleAnnouncementHome(ann.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            ann.showOnHomePage !== false
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                          }`}
                          title="تغییر وضعیت نمایش در صفحه اول سایت"
                        >
                          {ann.showOnHomePage !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{ann.showOnHomePage !== false ? 'در صفحه اول: فعال' : 'در صفحه اول: غیرفعال'}</span>
                        </button>

                        {/* دکمه حذف */}
                        <button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="حذف اطلاعیه"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <RichTextDisplay
                      html={ann.contentHtml}
                      fallbackText={ann.content}
                      className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
                      onImageClick={(src) => setAnnPreviewImage(src)}
                    />

                    {ann.imageUrl && (
                      <AnnouncementImageBox
                        src={ann.imageUrl}
                        alt={ann.title}
                        onClick={(src) => setAnnPreviewImage(src)}
                        maxWidthClass="max-w-md"
                        heightClass="h-48 sm:h-56"
                      />
                    )}

                    <div className="text-[11px] text-slate-400 mt-2.5 flex items-center justify-between">
                      <span>صادرکننده: {ann.author}</span>
                      <span>تاریخ: {ann.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* ۳. تب درخواست‌های اسکان، تخصیص موقت و مهمان */}
      {/* ========================================================= */}
      {mainTab === 'requests' && (
        <div className="space-y-6 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    درخواست‌های اسکان و تخصیص موقت اتاق‌ها
                  </h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      pendingStudents.length > 0
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {pendingStudents.length} درخواست در انتظار بررسی
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  تخصیص‌های اولیه دانشجویان ابتدا موقت بوده و پس از تأیید مدیر یا سرپرست، قطعی می‌گردد.
                </p>
              </div>
            </div>

            {/* دکمه تأیید دسته‌جمعی */}
            {pendingStudents.length > 0 && (
              <button
                onClick={handleBulkApprove}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer hover:scale-105 shrink-0"
                title="تأیید قطعی همه درخواست‌های اسکان با یک کلیک"
              >
                <CheckCheck className="w-4 h-4" />
                <span>تأیید دسته‌جمعی همه درخواست‌ها ({pendingStudents.length})</span>
              </button>
            )}
          </div>

          {pendingStudents.length === 0 ? (
            <div className="p-10 text-center bg-slate-50/60 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
              <div className="font-bold text-sm text-slate-700 dark:text-slate-200">
                تمامی اسکان‌ها قطعی بوده و درخواست موقتی در انتظار تأیید نیست.
              </div>
              <p className="text-xs text-slate-400 mt-1">
                به محض اینکه دانشجویی اتاقی را انتخاب نماید، درخواست موقت او در این بخش برای تصمیم‌گیری قرار می‌گیرد.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3">دانشجومعلم</th>
                      <th className="py-2.5 px-3">کد دانشجویی / رشته</th>
                      <th className="py-2.5 px-3">خوابگاه و سرا</th>
                      <th className="py-2.5 px-3">اتاق و تخت انتخابی</th>
                      <th className="py-2.5 px-3 text-center">عملیات تأیید اسکان</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pendingStudents.map((st) => {
                      const dorm = dorms.find((d) => d.id === st.assignedDormId);
                      const room = rooms.find((r) => r.id === st.assignedRoomId);
                      const bed = beds.find((b) => b.id === st.assignedBedId);

                      return (
                        <tr key={st.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              {st.photoUrl ? (
                                <img src={st.photoUrl} alt={st.fullName} loading="lazy" decoding="async" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                  style={{ backgroundColor: st.avatarColor || '#0d9488' }}
                                >
                                  {st.fullName.slice(0, 1)}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-800 dark:text-slate-100">{st.fullName}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-slate-400">{st.city || 'شهر ثبت نشده'} ({st.province || 'استان ثبت نشده'})</span>
                                  {st.isProfileCompleted ? (
                                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-bold">
                                      پرونده کامل
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1.5 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded font-bold animate-pulse">
                                      پرونده ناقص
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{st.studentId}</span>
                            <div className="text-[10px] text-slate-400">{st.fieldOfStudy} (ورودی {st.entryTerm})</div>
                          </td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                            {dorm?.name || '—'}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-teal-600 dark:text-teal-400">اتاق {room?.roomNumber || '—'}</div>
                            <div className="text-[10px] text-slate-400">{bed?.label || '—'}</div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleConfirmSingle(st.studentId)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                                title="تأیید قطعی اسکان دانشجو"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>تأیید قطعی</span>
                              </button>

                              <button
                                onClick={() => handleRejectSingle(st.studentId)}
                                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                title="رد درخواست و آزادسازی تخت"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>رد درخواست</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <SupervisorGuestRequestsPanel
          activeDormIds={dorms.map((d) => d.id)}
          actorName="مدیر کل سامانه"
          onDataChanged={onRefreshData}
        />

        {/* اعلامیه‌های مرخصی تحصیلی و اخراج دانشجویان ارسالی از کارشناس آموزش */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <FileWarning className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    اعلامیه‌های مرخصی تحصیلی و اخراج (از کارشناس آموزش)
                  </h3>
                  {academicNotices.filter((n) => n.status === 'pending').length > 0 && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold animate-pulse">
                      {academicNotices.filter((n) => n.status === 'pending').length} اعلامیه جدید
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  گزارش‌های وضعیت تحصیلی (مرخصی ترم یا اخراج) اعلام‌شده توسط کارشناس آموزش جهت بررسی و لغو/بروزرسانی اسکان
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
              {(
                [
                  { key: 'all', label: `همه (${academicNotices.length})` },
                  { key: 'pending', label: 'در انتظار بررسی' },
                  { key: 'reviewed', label: 'بررسی شد' },
                  { key: 'action_taken', label: 'اقدام نهایی شد' },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setAcademicNoticeFilter(item.key)}
                  className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                    academicNoticeFilter === item.key
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const visibleNotices = academicNotices.filter(
              (n) => academicNoticeFilter === 'all' || n.status === academicNoticeFilter
            );
            if (visibleNotices.length === 0) {
              return (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/60 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  اعلامیه مرخصی تحصیلی یا اخراجی در این دسته ثبت نشده است.
                </div>
              );
            }
            return (
              <div className="space-y-3">
                {visibleNotices.map((notice) => {
                  const st = students.find((s) => s.studentId === notice.studentId);
                  const room = st?.assignedRoomId ? rooms.find((r) => r.id === st.assignedRoomId) : undefined;
                  const dorm = st?.assignedDormId ? dorms.find((d) => d.id === st.assignedDormId) : undefined;
                  const noteValue =
                    academicNoticeNotes[notice.id] !== undefined
                      ? academicNoticeNotes[notice.id]
                      : notice.adminNote || '';

                  return (
                    <div
                      key={notice.id}
                      className={`p-4 rounded-2xl border text-xs space-y-3 ${
                        notice.noticeType === 'expulsion'
                          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                          : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {notice.noticeCode}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-extrabold text-[11px] ${
                              notice.noticeType === 'expulsion'
                                ? 'bg-rose-600 text-white'
                                : 'bg-amber-500 text-white'
                            }`}
                          >
                            {notice.noticeType === 'expulsion' ? 'اخراج / محرومیت از تحصیل' : 'مرخصی تحصیلی در ترم'}
                          </span>
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {notice.studentName}
                          </span>
                          <span className="font-mono text-slate-500">({notice.studentId})</span>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            notice.status === 'action_taken'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : notice.status === 'reviewed'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {notice.status === 'action_taken'
                            ? 'اقدام نهایی شد'
                            : notice.status === 'reviewed'
                            ? 'بررسی شد'
                            : 'در انتظار بررسی'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 dark:text-slate-300">
                        <span>اعلام‌کننده: {notice.reportedByStaffName} (کارشناس آموزش)</span>
                        <span>رشته: {notice.studentFieldOfStudy || '-'}</span>
                        <span>ورودی: {notice.studentEntryTerm || '-'}</span>
                        <span>
                          سال و نیمسال: {notice.academicYear} ({notice.semester})
                        </span>
                        <span>تاریخ اجرا: {notice.effectiveDate}</span>
                        {notice.letterNumber && <span>شماره نامه: {notice.letterNumber}</span>}
                        {st?.assignedBedId ? (
                          <span className="font-bold text-teal-700 dark:text-teal-300">
                            اسکان فعلی: {dorm?.name || 'سرا'} - اتاق {room?.roomNumber || '—'}
                          </span>
                        ) : (
                          <span className="text-slate-400">وضعیت فعلی: فاقد تخت خوابگاهی</span>
                        )}
                      </div>

                      <p className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {notice.description}
                      </p>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={noteValue}
                          onChange={(e) =>
                            setAcademicNoticeNotes((prev) => ({
                              ...prev,
                              [notice.id]: e.target.value,
                            }))
                          }
                          placeholder="یادداشت یا نتیجه اقدام مدیر برای کارشناس آموزش..."
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              Storage.updateAcademicNoticeStatus(
                                notice.id,
                                'reviewed',
                                noteValue.trim() || undefined,
                                'مدیر کل سامانه'
                              );
                              setAcademicNotices(Storage.getAcademicNotices());
                              onRefreshData();
                            }}
                            className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer"
                          >
                            ثبت بررسی شد
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              Storage.updateAcademicNoticeStatus(
                                notice.id,
                                'action_taken',
                                noteValue.trim() || undefined,
                                'مدیر کل سامانه'
                              );
                              setAcademicNotices(Storage.getAcademicNotices());
                              onRefreshData();
                            }}
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                          >
                            ثبت اقدام نهایی
                          </button>
                          {st?.assignedBedId && (
                            <button
                              type="button"
                              onClick={() => handleAdminEvictStudent(st)}
                              className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                              title="آزادسازی فوری تخت دانشجو به دلیل مرخصی تحصیلی یا اخراج"
                            >
                              آزادسازی تخت و لغو اسکان
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ۴. تب مدیریت تأسیسات و امور فنی دانشگاه */}
      {/* ========================================================= */}
      {mainTab === 'maintenance' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* کارت سربرگ و آمار کلی */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] text-slate-400 block mb-1">کل گزارش‌های فنی</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">{campusTasks.length}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 shadow-xs">
              <span className="text-[11px] text-amber-600 dark:text-amber-400 block mb-1">در حال تعمیر و اقدام</span>
              <span className="text-xl font-black text-amber-600">
                {campusTasks.filter((t) => t.status === 'in_progress').length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/40 shadow-xs">
              <span className="text-[11px] text-purple-600 dark:text-purple-400 block mb-1">نیازمند قطعه</span>
              <span className="text-xl font-black text-purple-600">
                {campusTasks.filter((t) => t.status === 'parts_needed').length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mb-1">رفع عیب و تکمیل شده</span>
              <span className="text-xl font-black text-emerald-600">
                {campusTasks.filter((t) => t.status === 'resolved' || t.status === 'closed').length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/40 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 block mb-1">برآورد کل هزینه‌ها</span>
              <span className="text-base font-black text-indigo-700 dark:text-indigo-300">
                {campusTasks.reduce((acc, t) => acc + (t.estimatedCost || 0), 0).toLocaleString('fa-IR')} ریال
              </span>
            </div>
          </div>

          {/* نوار فیلتر و جستجو و دکمه صدور مأموریت جدید */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="جستجو با کد رهگیری، شماره اتاق، عنوان، دانشجو یا تکنسین..."
                  value={adminMaintSearch}
                  onChange={(e) => setAdminMaintSearch(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <select
                value={adminMaintDormFilter}
                onChange={(e) => setAdminMaintDormFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">همه سراهای دانشجویی</option>
                {dorms.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={adminMaintStatusFilter}
                onChange={(e) => setAdminMaintStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="pending">در انتظار تخصیص</option>
                <option value="assigned">ارجاع شده به تکنسین</option>
                <option value="in_progress">در حال تعمیر و اقدام</option>
                <option value="parts_needed">نیازمند تأمین قطعه</option>
                <option value="resolved">رفع نقص شده</option>
              </select>
            </div>

            <button
              onClick={() => {
                setAdminNewMaintDormId(dorms[0]?.id || '');
                setAdminNewMaintStaffId(campusStaff[0]?.id || '');
                setShowAdminAddMaintModal(true);
              }}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ صدور مأموریت فنی جدید توسط مدیر</span>
            </button>
          </div>

          {/* پیام بازخورد مدیریت تأسیسات */}
          {adminMaintFeedback && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{adminMaintFeedback}</span>
            </div>
          )}

          {/* لیست مأموریت‌های تأسیساتی دانشگاه */}
          {campusTasks
            .filter((t) => {
              if (adminMaintDormFilter !== 'all' && t.dormId !== adminMaintDormFilter) return false;
              if (adminMaintStatusFilter !== 'all' && t.status !== adminMaintStatusFilter) return false;
              if (!adminMaintSearch.trim()) return true;
              const q = adminMaintSearch.toLowerCase();
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
              هیچ مأموریت تأسیساتی مطابق با فیلترهای انتخابی یافت نشد.
            </div>
          ) : (
            <div className="space-y-3.5">
              {campusTasks
                .filter((t) => {
                  if (adminMaintDormFilter !== 'all' && t.dormId !== adminMaintDormFilter) return false;
                  if (adminMaintStatusFilter !== 'all' && t.status !== adminMaintStatusFilter) return false;
                  if (!adminMaintSearch.trim()) return true;
                  const q = adminMaintSearch.toLowerCase();
                  return (
                    t.trackingCode.toLowerCase().includes(q) ||
                    t.title.toLowerCase().includes(q) ||
                    (t.roomNumber && t.roomNumber.includes(q)) ||
                    (t.sourceStudentName && t.sourceStudentName.toLowerCase().includes(q)) ||
                    (t.assignedToStaffName && t.assignedToStaffName.toLowerCase().includes(q))
                  );
                })
                .map((task) => {
                  const assignedTech = campusStaff.find((s) => s.id === task.assignedToStaffId);

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

                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>ثبت: {task.createdAt}</span>
                          <button
                            onClick={() => handleAdminDeleteTask(task.id, task.trackingCode)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                            title="حذف مأموریت"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
                          {task.sourceStudentName ? (
                            <span className="text-slate-500">
                              گزارش‌دهنده: <strong className="text-slate-700 dark:text-slate-200">{task.sourceStudentName}</strong>
                              {task.sourceStudentPhone && ` (${task.sourceStudentPhone})`}
                            </span>
                          ) : (
                            <span className="text-slate-500">
                              ثبت توسط: <strong>{task.createdByName}</strong> ({task.createdByRole === 'supervisor' ? 'سرپرست' : 'مدیر'})
                            </span>
                          )}

                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">تکنسین مسئول:</span>
                            <select
                              value={task.assignedToStaffId || ''}
                              onChange={(e) => handleAdminReassignTask(task.id, e.target.value)}
                              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="">انتخاب / تغییر تکنسین...</option>
                              {campusStaff.map((s) => (
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

                        <div className="flex items-center gap-2">
                          {task.supervisorVerified && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl font-bold text-xs">
                              <CheckCircle className="w-3.5 h-3.5" />
                              تأیید سرپرست سرا انجام شده
                            </span>
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

      {/* مدال ثبت مأموریت فنی توسط مدیر */}
      {showAdminAddMaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 dark:border-amber-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    صدور مأموریت فنی جدید توسط مدیر کل
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    ارجاع مأموریت تعمیرات یا بازدید دوره‌ای به تکنسین‌های تأسیسات
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminAddMaintModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminCreateMaintTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان مأموریت یا مشکل
                </label>
                <input
                  type="text"
                  placeholder="مثلاً سرویس دوره‌ای آسانسور، بازدید موتورخانه، رفع خرابی شیرآلات..."
                  value={adminNewMaintTitle}
                  onChange={(e) => setAdminNewMaintTitle(e.target.value)}
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
                    value={adminNewMaintDormId}
                    onChange={(e) => setAdminNewMaintDormId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    {dorms.map((d) => (
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
                    placeholder="مثلاً 204، موتورخانه یا طبقه همکف"
                    value={adminNewMaintRoom}
                    onChange={(e) => setAdminNewMaintRoom(e.target.value)}
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
                    value={adminNewMaintCategory}
                    onChange={(e) => setAdminNewMaintCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="plumbing">لوله کشی و موتورخانه</option>
                    <option value="electrical">برق، روشنایی و آسانسور</option>
                    <option value="carpentry">نجاری، درب و قفل</option>
                    <option value="facilities">سرمایش و گرمایش</option>
                    <option value="other">سایر امور فنی</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اولویت رسیدگی
                  </label>
                  <select
                    value={adminNewMaintPriority}
                    onChange={(e) => setAdminNewMaintPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="normal">عادی</option>
                    <option value="urgent">فوری</option>
                    <option value="emergency">اضطراری و بحرانی</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تکنسین مسئول (ارجاع مستقیم)
                </label>
                <select
                  value={adminNewMaintStaffId}
                  onChange={(e) => setAdminNewMaintStaffId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">بدون انتصاب (در انتظار بررسی سرپرست تأسیسات)</option>
                  {campusStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شرح کامل مأموریت
                </label>
                <textarea
                  rows={3}
                  placeholder="شرح دقیق دستور کار و نکات لازم..."
                  value={adminNewMaintDesc}
                  onChange={(e) => setAdminNewMaintDesc(e.target.value)}
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
                  <span>صدور و ابلاغ مأموریت</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdminAddMaintModal(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ۵. تب شیفت‌بندی کادر سرپرستی، دفتر وقایع و مدیریت حضور */}
      {/* ========================================================= */}
      {mainTab === 'shifts' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* کارت سربرگ و آمار کلی شیفت‌ها */}
          <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-teal-800/40">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-teal-300">
                    ساماندهی ماهانه نوبت‌های کاری و حضور سرپرستان سراها
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black">
                  شیفت‌بندی ماهانه کادر سرپرستی و دفتر وقایع سراها
                </h2>
                <p className="text-xs text-teal-200/80 mt-1">
                  برنامه‌ریزی ماهانه با تاریخ شمسی (شامل شیفت ۲۴ ساعته کامل از ۷ صبح تا ۷ صبح فردا)، بارگذاری اکسل و پایش گزارش‌های تحویل شیفت
                </p>
              </div>

              {/* دکمه‌های عملیاتی اکسل و افزودن شیفت */}
              <div className="flex flex-wrap items-center gap-2">
                {/* بارگذاری فایل اکسل شیفت‌ها */}
                <label className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>بارگذاری برنامه از اکسل</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const res = await importShiftScheduleFromExcel(file, supervisors, dorms);
                      if (res.success && res.schedules.length > 0) {
                        Storage.setShiftSchedules(res.schedules);
                        setShiftSchedules(Storage.getShiftSchedules());
                        const syncRes = await Storage.waitForPendingCloudSync();
                        setShiftFeedback(
                          syncRes.success
                            ? `${res.message} (ذخیره‌شده در دیتابیس ابری)`
                            : `${res.message} (هشدار: همگام‌سازی ابری با تأخیر یا خطا مواجه شد)`
                        );
                      } else {
                        setShiftFeedback(res.message || 'خطا در بارگذاری فایل اکسل');
                      }
                      e.target.value = '';
                    }}
                  />
                </label>

                {/* دانلود فایل نمونه اکسل شیفت‌ها */}
                <button
                  onClick={() => exportShiftTemplateToExcel()}
                  className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-teal-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
                  title="دانلود قالب اکسل جهت تکمیل و بارگذاری شیفت‌ها"
                >
                  <Download className="w-4 h-4" />
                  <span>قالب نمونه اکسل</span>
                </button>

                {/* خروجی اکسل برنامه فعلی شیفت‌ها */}
                <button
                  onClick={() => exportShiftScheduleToExcel(shiftSchedules)}
                  className="px-3.5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-700/20 cursor-pointer"
                  title="دانلود خروجی اکسل کامل شیفت‌های تعیین‌شده"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>خروجی اکسل برنامه</span>
                </button>

                {/* دکمه افزودن دستی شیفت جدید */}
                <button
                  type="button"
                  onClick={() => openCreateShiftModal()}
                  className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-teal-500/30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>ثبت شیفت ماهانه جدید</span>
                </button>
              </div>
            </div>
          </div>

          {/* پیام بازخورد اکسل یا تغییرات */}
          {shiftFeedback && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{shiftFeedback}</span>
              </div>
              <button onClick={() => setShiftFeedback(null)} className="p-1 hover:opacity-75 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* بنر قانون سازمان: اگر تعیین نشود یعنی هر روز حضور دارند */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-200 dark:border-teal-800/60 shadow-xs flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-teal-600 text-white shrink-0 mt-0.5 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-right">
              <h4 className="font-extrabold text-sm text-teal-900 dark:text-teal-200">
                قانون سیستمی حضور کادر سرپرستی سراها:
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                بر اساس ضوابط جامع سراهای دانشجویی دانشگاه فرهنگیان، <strong>چنانچه برای سرپرستی شیفت خاصی در سامانه تعیین نشود، وضعیت او به صورت خودکار «حضور روزانه (هر روز)» در نظر گرفته می‌شود</strong> و در کارتابل سرپرست و گزارش‌های نظارتی با وضعیت حضور پیوسته فعال خواهد بود. تعیین شیفت برای تفکیک نوبت‌های عصر، شب و روزهای خاص است.
              </p>
            </div>
          </div>

          {/* بخش اول: تقویم و جدول ماهانه شیفت‌بندی سرپرستان */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    برنامه شیفت‌بندی ماهانه سرپرستان — {PERSIAN_MONTH_NAMES[shiftViewMonth - 1]} {formatDigits(shiftViewYear, 'fa')}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    کل نوبت‌های ثبت‌شده در سامانه: {formatDigits(shiftSchedules.length, 'fa')} نوبت (پشتیبانی از شیفت ۲۴ ساعته کامل تا روز بعد)
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* انتخابگر ماه و سال شمسی */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShiftShowAllMonths(false);
                      if (shiftViewMonth === 1) {
                        setShiftViewYear((y) => y - 1);
                        setShiftViewMonth(12);
                      } else {
                        setShiftViewMonth((m) => m - 1);
                      }
                    }}
                    title="ماه قبل"
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <select
                    value={shiftViewMonth}
                    onChange={(e) => {
                      setShiftShowAllMonths(false);
                      setShiftViewMonth(Number(e.target.value));
                    }}
                    className="bg-transparent text-xs font-extrabold text-slate-800 dark:text-slate-100 px-1.5 py-1 focus:outline-none cursor-pointer"
                  >
                    {PERSIAN_MONTH_NAMES.map((mName, idx) => (
                      <option key={mName} value={idx + 1} className="bg-white dark:bg-slate-900">
                        {mName}
                      </option>
                    ))}
                  </select>
                  <select
                    value={shiftViewYear}
                    onChange={(e) => {
                      setShiftShowAllMonths(false);
                      setShiftViewYear(Number(e.target.value));
                    }}
                    className="bg-transparent text-xs font-extrabold text-slate-800 dark:text-slate-100 px-1.5 py-1 focus:outline-none cursor-pointer"
                  >
                    {Array.from({ length: 10 }, (_, idx) => todayJalali.jy - 2 + idx).map((yr) => (
                      <option key={yr} value={yr} className="bg-white dark:bg-slate-900">
                        {formatDigits(yr, 'fa')}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setShiftShowAllMonths(false);
                      if (shiftViewMonth === 12) {
                        setShiftViewYear((y) => y + 1);
                        setShiftViewMonth(1);
                      } else {
                        setShiftViewMonth((m) => m + 1);
                      }
                    }}
                    title="ماه بعد"
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                {/* تغییر نما بین تقویم ماهانه و جدول ماهانه */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setShiftViewMode('calendar');
                      setShiftShowAllMonths(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer ${
                      shiftViewMode === 'calendar'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>تقویم ماهانه</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShiftViewMode('table')}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer ${
                      shiftViewMode === 'table'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>نمای جدولی</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => exportShiftReportsToExcel(shiftReports)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
                  <span>خروجی دفتر وقایع</span>
                </button>
              </div>
            </div>

            {/* فرم ثبت سریع دستی و تک‌به‌تک نوبت کاری ماهانه */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const payload = buildMonthlyShiftPayload({
                  supId: quickShiftSupId,
                  dormId: quickShiftDormId,
                  dateStr: quickShiftDate,
                  shiftType: quickShiftType,
                  startTime: quickShiftStartTime,
                  endTime: quickShiftEndTime,
                  endsNextDay: quickShiftEndsNextDay,
                  notes: quickShiftNotes,
                });
                if (!payload) {
                  setShiftFeedback('لطفاً ابتدا حداقل یک سرپرست سرا در بخش مدیریت کاربران ثبت نمایید.');
                  return;
                }
                Storage.addShiftSchedule(payload);
                setShiftSchedules(Storage.getShiftSchedules());
                // همگام‌سازی ماه نمایش با تاریخ ثبت‌شده و آماده کردن روز بعد برای ثبت سریع متوالی
                const parsedAdded = parseJalaliDate(payload.shiftDate || '');
                if (parsedAdded) {
                  setShiftViewYear(parsedAdded.jy);
                  setShiftViewMonth(parsedAdded.jm);
                  const nextDayStr = addDaysToJalaliDate(payload.shiftDate || '', 1, 'fa');
                  if (nextDayStr) setQuickShiftDate(nextDayStr);
                }
                setQuickShiftNotes('');
                setShiftFeedback(
                  `شیفت تاریخ ${payload.shiftDate} برای «${payload.supervisorName}» با موفقیت ثبت شد.`
                );
              }}
              className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/25 border border-teal-200/80 dark:border-teal-800/60 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-black text-teal-900 dark:text-teal-200">
                  <Plus className="w-4 h-4 text-teal-600" />
                  <span>ثبت سریع نوبت کاری ماهانه (تک‌به‌تک با تاریخ شمسی)</span>
                </div>
                <span className="text-[11px] text-teal-700/85 dark:text-teal-300/85 font-semibold">
                  مثال شیفت ۲۴ ساعته: ۰۷:۰۰ تا ۰۷:۰۰ روز بعد • پس از ثبت، تاریخ به‌صورت خودکار به روز بعد می‌رود
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">سرپرست سرا *</label>
                  <select
                    value={quickShiftSupId}
                    onChange={(e) => setQuickShiftSupId(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    {supervisors.length === 0 && <option value="">سرپرستی ثبت نشده است</option>}
                    {supervisors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">سرای مربوطه *</label>
                  <select
                    value={quickShiftDormId}
                    onChange={(e) => setQuickShiftDormId(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">کلیه سراهای دانشجویی پردیس</option>
                    {dorms.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    تاریخ شروع شیفت (شمسی) *
                  </label>
                  <PersianDatePicker
                    value={quickShiftDate}
                    onChange={setQuickShiftDate}
                    digits="fa"
                    required
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">نوع شیفت *</label>
                  <select
                    value={quickShiftType}
                    onChange={(e) => {
                      const val = e.target.value as ShiftLogReport['shiftType'];
                      setQuickShiftType(val);
                      const defHours = getDefaultShiftHours(val);
                      setQuickShiftStartTime(defHours.start);
                      setQuickShiftEndTime(defHours.end);
                      setQuickShiftEndsNextDay(defHours.endsNextDay);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="full_day">شیفت ۲۴ ساعته کامل (تا روز بعد)</option>
                    <option value="morning">شیفت صبح</option>
                    <option value="evening">شیفت عصر</option>
                    <option value="night">شیفت شب (تا صبح فردا)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs items-end">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">ساعت شروع</label>
                  <PersianTimePicker
                    value={quickShiftStartTime}
                    onChange={(val) => {
                      setQuickShiftStartTime(val);
                      if (quickShiftType === 'full_day') {
                        setQuickShiftEndTime(val);
                        setQuickShiftEndsNextDay(true);
                      }
                    }}
                    placeholder="۰۷:۰۰"
                    digits="fa"
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    ساعت پایان {quickShiftEndsNextDay ? '(فردا)' : ''}
                  </label>
                  <PersianTimePicker
                    value={quickShiftEndTime}
                    onChange={setQuickShiftEndTime}
                    placeholder="۰۷:۰۰"
                    digits="fa"
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="sm:col-span-3 flex items-center">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={quickShiftEndsNextDay}
                      onChange={(e) => setQuickShiftEndsNextDay(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">
                      پایان در روز بعد
                      {(() => {
                        const dur = calculateShiftDurationHours(
                          quickShiftStartTime,
                          quickShiftEndTime,
                          quickShiftEndsNextDay
                        );
                        return dur ? ` (${formatDigits(dur, 'fa')} ساعت)` : '';
                      })()}
                    </span>
                  </label>
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">توضیحات</label>
                  <input
                    type="text"
                    value={quickShiftNotes}
                    onChange={(e) => setQuickShiftNotes(e.target.value)}
                    placeholder="دستورکار یا تحویل شیفت..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={supervisors.length === 0}
                    className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ثبت شیفت</span>
                  </button>
                </div>
              </div>
            </form>

            {/* فیلترها و جستجو */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">جستجوی سرپرست، تاریخ یا دستورکار</label>
                <div className="relative">
                  <input
                    type="text"
                    value={shiftSearch}
                    onChange={(e) => setShiftSearch(e.target.value)}
                    placeholder="نام سرپرست، تاریخ شمسی، توضیحات..."
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">فیلتر سرای دانشجویی</label>
                <select
                  value={shiftDormFilter}
                  onChange={(e) => setShiftDormFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">همه سراهای دانشجویی</option>
                  {dorms.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    if (shiftViewMode === 'calendar') {
                      setShiftViewMode('table');
                      setShiftShowAllMonths(true);
                    } else {
                      setShiftShowAllMonths((v) => !v);
                    }
                  }}
                  className={`w-full px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    shiftShowAllMonths && shiftViewMode === 'table'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {shiftShowAllMonths && shiftViewMode === 'table'
                    ? 'در حال نمایش همه ماه‌ها (کلیک برای فیلتر ماه جاری)'
                    : 'نمایش لیست کل ماه‌های ثبت‌شده'}
                </button>
              </div>
            </div>

            {(() => {
              const activeMonthKey = `${String(shiftViewYear).padStart(4, '0')}/${String(shiftViewMonth).padStart(2, '0')}`;
              const shiftLabels: Record<string, { label: string; shortLabel: string; color: string }> = {
                full_day: {
                  label: 'شیفت ۲۴ ساعته کامل',
                  shortLabel: '۲۴ ساعته',
                  color: 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border-teal-300/70 dark:border-teal-800',
                },
                morning: {
                  label: 'شیفت صبح',
                  shortLabel: 'صبح',
                  color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300/70 dark:border-amber-800',
                },
                evening: {
                  label: 'شیفت عصر',
                  shortLabel: 'عصر',
                  color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300/70 dark:border-indigo-800',
                },
                night: {
                  label: 'شیفت شب',
                  shortLabel: 'شب',
                  color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300/70 dark:border-purple-800',
                },
              };

              const baseFiltered = shiftSchedules.filter((s) => {
                if (shiftDormFilter !== 'all' && s.dormId !== shiftDormFilter && s.dormId !== 'all') return false;
                if (shiftSearch.trim()) {
                  const q = shiftSearch.toLowerCase();
                  const qEn = toEnDigitsCal(q);
                  const dateEn = toEnDigitsCal(s.shiftDate || '');
                  const match =
                    s.supervisorName.toLowerCase().includes(q) ||
                    (s.dormName && s.dormName.toLowerCase().includes(q)) ||
                    (s.notes && s.notes.toLowerCase().includes(q)) ||
                    (s.shiftDate && (s.shiftDate.includes(q) || dateEn.includes(qEn)));
                  if (!match) return false;
                }
                return true;
              });

              const monthFiltered = baseFiltered
                .filter((s) => {
                  if (shiftViewMode === 'table' && shiftShowAllMonths) return true;
                  const mk = s.monthKey || getJalaliMonthKey(s.shiftDate);
                  if (!mk) return shiftViewMode === 'table'; // رکوردهای قدیمی بدون تاریخ در جدول قابل مشاهده و ویرایش باشند
                  return mk === activeMonthKey;
                })
                .sort((a, b) => toEnDigitsCal(a.shiftDate || '9999/99/99').localeCompare(toEnDigitsCal(b.shiftDate || '9999/99/99')));

              if (shiftViewMode === 'calendar') {
                const daysCount = getJalaliMonthDays(shiftViewYear, shiftViewMonth);
                const startWd = getJalaliMonthStartWeekday(shiftViewYear, shiftViewMonth);
                const cells: Array<number | null> = [];
                for (let i = 0; i < startWd; i += 1) cells.push(null);
                for (let d = 1; d <= daysCount; d += 1) cells.push(d);

                const shiftsByDayNum = new Map<number, SupervisorShiftSchedule[]>();
                monthFiltered.forEach((s) => {
                  const p = parseJalaliDate(s.shiftDate || '');
                  if (p && p.jy === shiftViewYear && p.jm === shiftViewMonth) {
                    const list = shiftsByDayNum.get(p.jd) || [];
                    list.push(s);
                    shiftsByDayNum.set(p.jd, list);
                  }
                });

                const legacyNoDateCount = baseFiltered.filter((s) => !parseJalaliDate(s.shiftDate || '')).length;

                return (
                  <div className="space-y-3">
                    {legacyNoDateCount > 0 && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2">
                        <span>
                          تعداد {formatDigits(legacyNoDateCount, 'fa')} نوبت قدیمی بدون تاریخ شمسی وجود دارد. برای اختصاص تاریخ ماهانه به آن‌ها، به «نمای جدولی» بروید و ویرایش کنید.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShiftViewMode('table');
                            setShiftShowAllMonths(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] cursor-pointer"
                        >
                          مشاهده در جدول
                        </button>
                      </div>
                    )}

                    {/* شبکه تقویم ماهانه شمسی */}
                    <div className="overflow-x-auto">
                      <div className="min-w-[680px]">
                        <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center">
                          {['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'].map((wName, i) => (
                            <div
                              key={wName}
                              className={`py-2 rounded-xl text-xs font-extrabold ${
                                i === 6
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {wName}
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1.5">
                          {cells.map((dayNum, idx) => {
                            if (dayNum === null) {
                              return (
                                <div
                                  key={`empty-${idx}`}
                                  className="min-h-[104px] rounded-2xl bg-slate-50/40 dark:bg-slate-800/20 border border-dashed border-slate-200/60 dark:border-slate-800/60"
                                />
                              );
                            }

                            const cellDateFa = formatJalaliDate(shiftViewYear, shiftViewMonth, dayNum, 'fa');
                            const isTodayCell =
                              shiftViewYear === todayJalali.jy &&
                              shiftViewMonth === todayJalali.jm &&
                              dayNum === todayJalali.jd;
                            const isFriday = idx % 7 === 6;
                            const dayShifts = shiftsByDayNum.get(dayNum) || [];

                            return (
                              <div
                                key={dayNum}
                                className={`min-h-[108px] rounded-2xl border p-2 flex flex-col gap-1.5 transition ${
                                  isTodayCell
                                    ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/30 ring-1 ring-teal-500/30'
                                    : isFriday
                                    ? 'border-rose-200/70 dark:border-rose-900/50 bg-rose-50/25 dark:bg-rose-950/15'
                                    : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`text-xs font-black px-1.5 py-0.5 rounded-lg ${
                                      isTodayCell
                                        ? 'bg-teal-600 text-white'
                                        : isFriday
                                        ? 'text-rose-600 dark:text-rose-400'
                                        : 'text-slate-700 dark:text-slate-200'
                                    }`}
                                  >
                                    {formatDigits(dayNum, 'fa')}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => openCreateShiftModal(cellDateFa)}
                                    title={`ثبت شیفت برای ${cellDateFa}`}
                                    className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-teal-600 hover:text-white text-slate-500 flex items-center justify-center transition cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="space-y-1 flex-1">
                                  {dayShifts.map((sh) => {
                                    const sInfo = shiftLabels[sh.shiftType] || shiftLabels.full_day;
                                    const isNextDay = Boolean(
                                      sh.endsNextDay || sh.shiftType === 'full_day' || sh.shiftType === 'night'
                                    );
                                    return (
                                      <button
                                        key={sh.id}
                                        type="button"
                                        onClick={() => openEditShiftModal(sh)}
                                        title={`${sh.supervisorName} — ${sh.dormName} — ${sh.startTime || ''} الی ${sh.endTime || ''}${isNextDay ? ' (روز بعد)' : ''} (کلیک برای ویرایش)`}
                                        className={`w-full text-right p-1.5 rounded-xl border text-[10px] leading-tight transition hover:brightness-95 cursor-pointer ${sInfo.color}`}
                                      >
                                        <div className="font-extrabold truncate">{sh.supervisorName}</div>
                                        <div className="flex items-center justify-between gap-1 mt-0.5 opacity-90">
                                          <span className="font-bold">{sInfo.shortLabel}</span>
                                          <span className="font-mono" dir="ltr">
                                            {sh.startTime || '۰۷:۰۰'}-{sh.endTime || '۰۷:۰۰'}
                                            {isNextDay ? '⁺¹' : ''}
                                          </span>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span>برای ثبت شیفت در هر روز روی «+» همان روز، و برای ویرایش روی کارت شیفت کلیک کنید.</span>
                      <span>علامت «⁺¹» نشان‌دهنده ادامه شیفت تا صبح روز بعد (مانند شیفت ۲۴ ساعته ۰۷:۰۰ تا ۰۷:۰۰ فردا) است.</span>
                    </div>
                  </div>
                );
              }

              // نمای جدولی ماهانه
              return (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="p-3">تاریخ شمسی و روز</th>
                        <th className="p-3">سرپرست سرا</th>
                        <th className="p-3">سرای مربوطه</th>
                        <th className="p-3">نوع شیفت</th>
                        <th className="p-3">ساعات حضور (شروع تا پایان)</th>
                        <th className="p-3">توضیحات و دستورکار</th>
                        <th className="p-3 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {monthFiltered.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            هیچ نوبت کاری برای {shiftShowAllMonths ? 'این فیلتر' : `${PERSIAN_MONTH_NAMES[shiftViewMonth - 1]} ${formatDigits(shiftViewYear, 'fa')}`} ثبت نشده است. می‌توانید از فرم بالا به صورت دستی ثبت کنید یا فایل اکسل بارگذاری نمایید.
                          </td>
                        </tr>
                      ) : (
                        monthFiltered.map((s) => {
                          const sInfo = shiftLabels[s.shiftType] || {
                            label: s.shiftType,
                            shortLabel: s.shiftType,
                            color: 'bg-slate-100 text-slate-700',
                          };
                          const weekdayLabel = s.shiftDate ? getJalaliWeekdayLabelFromDate(s.shiftDate) : '';
                          const isNextDay = Boolean(
                            s.endsNextDay || s.shiftType === 'full_day' || s.shiftType === 'night'
                          );
                          const nextDateLabel =
                            s.shiftDate && isNextDay ? addDaysToJalaliDate(s.shiftDate, 1, 'fa') : '';
                          const durationHrs = calculateShiftDurationHours(s.startTime, s.endTime, isNextDay);

                          return (
                            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                              <td className="p-3 whitespace-nowrap">
                                {s.shiftDate ? (
                                  <div className="space-y-0.5">
                                    <div className="font-mono font-extrabold text-slate-900 dark:text-white">
                                      {s.shiftDate}{' '}
                                      {weekdayLabel && (
                                        <span className="font-sans text-[11px] font-bold text-teal-700 dark:text-teal-300">
                                          ({weekdayLabel})
                                        </span>
                                      )}
                                    </div>
                                    {nextDateLabel && (
                                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                        تا روز بعد: <span className="font-mono">{nextDateLabel}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                                    بدون تاریخ (نیاز به ویرایش)
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-bold text-slate-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                                    {s.supervisorName.slice(0, 1)}
                                  </div>
                                  <span>{s.supervisorName}</span>
                                </div>
                              </td>
                              <td className="p-3 font-medium text-slate-600 dark:text-slate-300">
                                {s.dormName}
                              </td>
                              <td className="p-3">
                                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${sInfo.color}`}>
                                  {sInfo.label}
                                </span>
                              </td>
                              <td className="p-3 text-[11px] text-slate-600 dark:text-slate-300">
                                <div className="font-mono font-bold">
                                  {s.startTime && s.endTime
                                    ? `${s.startTime} الی ${s.endTime}${isNextDay ? ' (فردا)' : ''}`
                                    : '۲۴ ساعته کامل'}
                                </div>
                                {durationHrs !== null && (
                                  <div className="text-[10px] text-teal-600 dark:text-teal-400 font-bold mt-0.5">
                                    مدت: {formatDigits(durationHrs, 'fa')} ساعت
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={s.notes || ''}>
                                {s.notes || '-'}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditShiftModal(s)}
                                    className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                                    title="ویرایش و اصلاح این نوبت کاری"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAdminConfirmDialog({
                                        title: 'حذف برنامه شیفت',
                                        message: `آیا از حذف شیفت ${s.supervisorName}${s.shiftDate ? ` در تاریخ ${s.shiftDate}` : ''} مطمئن هستید؟`,
                                        confirmLabel: 'تأیید و حذف شیفت',
                                        onConfirm: () => {
                                          Storage.deleteShiftSchedule(s.id);
                                          setShiftSchedules(Storage.getShiftSchedules());
                                          setShiftFeedback('شیفت مورد نظر با موفقیت حذف گردید.');
                                        },
                                      });
                                    }}
                                    className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 transition cursor-pointer"
                                    title="حذف این شیفت"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* بخش نمایش سرپرستان بدون نوبت ثبت‌شده در ماه جاری */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>کادر سرپرستی بدون شیفت ثبت‌شده در {PERSIAN_MONTH_NAMES[shiftViewMonth - 1]} {formatDigits(shiftViewYear, 'fa')}:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(() => {
                  const activeMonthKey = `${String(shiftViewYear).padStart(4, '0')}/${String(shiftViewMonth).padStart(2, '0')}`;
                  const unscheduled = supervisors.filter(
                    (sup) =>
                      !shiftSchedules.some(
                        (s) =>
                          s.supervisorId === sup.id &&
                          !s.isEveryDay &&
                          (s.monthKey === activeMonthKey || getJalaliMonthKey(s.shiftDate) === activeMonthKey)
                      )
                  );
                  if (unscheduled.length === 0) {
                    return (
                      <div className="sm:col-span-3 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                        برای تمامی سرپرستان در این ماه حداقل یک نوبت شیفت ثبت شده است.
                      </div>
                    );
                  }
                  return unscheduled.map((sup) => (
                    <div
                      key={sup.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <span className="block font-bold text-xs text-slate-800 dark:text-slate-200">
                          {sup.fullName}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          حضور پیوسته (پیش‌فرض سیستم)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingShiftId(null);
                          setNewShiftSupId(sup.id);
                          setNewShiftDormId(dorms[0]?.id || 'all');
                          setNewShiftDate(formatJalaliDate(shiftViewYear, shiftViewMonth, 1, 'fa'));
                          setNewShiftType('full_day');
                          setNewShiftStartTime('۰۷:۰۰');
                          setNewShiftEndTime('۰۷:۰۰');
                          setNewShiftEndsNextDay(true);
                          setNewShiftNotes('');
                          setIsAddShiftModalOpen(true);
                        }}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 hover:bg-teal-200 font-bold cursor-pointer"
                      >
                        + ثبت شیفت
                      </button>
                    </div>
                  ));
                })()}
              </div>
            </div>

          </div>

          {/* بخش دوم: دفتر وقایع و گزارشات ثبت‌شده توسط سرپرستان */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    دفتر وقایع و گزارشات شیفت ثبت‌شده توسط سرپرستان ({shiftReports.length} گزارش)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    پایش گزارش‌های بازدید، حضور و غیاب شبانه و نکات کلیدی تحویل به شیفت بعد
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {shiftReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3 text-right"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {report.supervisorName}
                      </span>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="text-xs text-teal-700 dark:text-teal-300 font-bold">
                        {report.dormName}
                      </span>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {report.shiftDate} ({report.shiftTime})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">
                        کد: {report.reportCode}
                      </span>
                      {report.presentStudentCount && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                          حاضرین: {report.presentStudentCount} نفر
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        خلاصه بازرسی اتاق‌ها و سرا:
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {report.inspectionsSummary || '-'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        حوادث و موارد انضباطی:
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {report.incidentsSummary || 'مورد خاصی گزارش نشد.'}
                      </p>
                    </div>
                  </div>

                  {/* بخش نکات کلیدی تحویل شیفت */}
                  {report.handoverNotes && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>نکات کلیدی جهت تحویل به سرپرست شیفت بعد:</span>
                      </div>
                      <p className="leading-relaxed pr-5">
                        {report.handoverNotes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* مودال ثبت دستی یا ویرایش نوبت کاری سرپرست توسط مدیر */}
          {isAddShiftModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl text-right">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                    {editingShiftId ? (
                      <Edit3 className="w-5 h-5 text-amber-600" />
                    ) : (
                      <Calendar className="w-5 h-5 text-teal-600" />
                    )}
                    <span>
                      {editingShiftId ? 'ویرایش و اصلاح نوبت کاری سرپرست سرا' : 'ثبت دستی نوبت کاری سرپرست سرا'}
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddShiftModalOpen(false);
                      setEditingShiftId(null);
                    }}
                    className="p-1 hover:opacity-75 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const payload = buildMonthlyShiftPayload({
                      supId: newShiftSupId,
                      dormId: newShiftDormId,
                      dateStr: newShiftDate,
                      shiftType: newShiftType,
                      startTime: newShiftStartTime,
                      endTime: newShiftEndTime,
                      endsNextDay: newShiftEndsNextDay,
                      notes: newShiftNotes,
                    });
                    if (!payload) return;

                    if (editingShiftId) {
                      Storage.updateShiftSchedule(editingShiftId, payload);
                      setShiftSchedules(Storage.getShiftSchedules());
                      setIsAddShiftModalOpen(false);
                      setEditingShiftId(null);
                      setShiftFeedback(`نوبت کاری تاریخ ${payload.shiftDate} برای «${payload.supervisorName}» ویرایش و ذخیره شد.`);
                    } else {
                      Storage.addShiftSchedule(payload);
                      setShiftSchedules(Storage.getShiftSchedules());
                      const parsed = parseJalaliDate(payload.shiftDate || '');
                      if (parsed) {
                        setShiftViewYear(parsed.jy);
                        setShiftViewMonth(parsed.jm);
                      }
                      setNewShiftNotes('');
                      setIsAddShiftModalOpen(false);
                      setShiftFeedback(`شیفت تاریخ ${payload.shiftDate} برای «${payload.supervisorName}» با موفقیت ثبت شد.`);
                    }
                  }}
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">انتخاب سرپرست *</label>
                    <select
                      value={newShiftSupId}
                      onChange={(e) => setNewShiftSupId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                      required
                    >
                      {supervisors.map((s) => (
                        <option key={s.id} value={s.id}>{s.fullName} ({s.username})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">سرای دانشجویی محل خدمت *</label>
                    <select
                      value={newShiftDormId}
                      onChange={(e) => setNewShiftDormId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="all">کلیه سراهای دانشجویی پردیس</option>
                      {dorms.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        تاریخ شروع شیفت (شمسی) *
                      </label>
                      <PersianDatePicker
                        value={newShiftDate}
                        onChange={setNewShiftDate}
                        digits="fa"
                        required
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">نوع شیفت *</label>
                      <select
                        value={newShiftType}
                        onChange={(e) => {
                          const val = e.target.value as ShiftLogReport['shiftType'];
                          setNewShiftType(val);
                          const defHours = getDefaultShiftHours(val);
                          setNewShiftStartTime(defHours.start);
                          setNewShiftEndTime(defHours.end);
                          setNewShiftEndsNextDay(defHours.endsNextDay);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                      >
                        <option value="full_day">شیفت ۲۴ ساعته کامل (تا روز بعد)</option>
                        <option value="morning">شیفت صبح</option>
                        <option value="evening">شیفت عصر</option>
                        <option value="night">شیفت شب (تا صبح فردا)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ساعت شروع</label>
                      <PersianTimePicker
                        value={newShiftStartTime}
                        onChange={(val) => {
                          setNewShiftStartTime(val);
                          if (newShiftType === 'full_day') {
                            setNewShiftEndTime(val);
                            setNewShiftEndsNextDay(true);
                          }
                        }}
                        placeholder="۰۷:۰۰"
                        digits="fa"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        ساعت پایان {newShiftEndsNextDay ? '(روز بعد)' : ''}
                      </label>
                      <PersianTimePicker
                        value={newShiftEndTime}
                        onChange={setNewShiftEndTime}
                        placeholder="۰۷:۰۰"
                        digits="fa"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/60 space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newShiftEndsNextDay}
                        onChange={(e) => setNewShiftEndsNextDay(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span className="font-bold text-teal-900 dark:text-teal-200">
                        پایان شیفت در روز بعد است (مناسب شیفت ۲۴ ساعته کامل مثل ۰۷:۰۰ تا ۰۷:۰۰ فردا یا شیفت شب)
                      </span>
                    </label>
                    {(() => {
                      const dur = calculateShiftDurationHours(
                        newShiftStartTime,
                        newShiftEndTime,
                        newShiftEndsNextDay
                      );
                      const endDatePreview = newShiftEndsNextDay
                        ? addDaysToJalaliDate(newShiftDate, 1, 'fa')
                        : newShiftDate;
                      return (
                        <div className="text-[11px] text-teal-700 dark:text-teal-300 font-medium pr-6">
                          بازه نهایی: از <strong className="font-mono">{newShiftDate}</strong> ساعت{' '}
                          <strong className="font-mono">{newShiftStartTime}</strong> تا{' '}
                          <strong className="font-mono">{endDatePreview || newShiftDate}</strong> ساعت{' '}
                          <strong className="font-mono">{newShiftEndTime}</strong>
                          {dur !== null && (
                            <span className="mr-1.5 px-1.5 py-0.5 rounded bg-teal-600 text-white font-bold">
                              {formatDigits(dur, 'fa')} ساعت
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">دستورکار و توضیحات</label>
                    <textarea
                      rows={2}
                      value={newShiftNotes}
                      onChange={(e) => setNewShiftNotes(e.target.value)}
                      placeholder="نظارت ۲۴ ساعته، تحویل شیفت صبح فردا، گشت شبانه..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="submit"
                      className={`flex-1 py-2.5 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                        editingShiftId
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-teal-600 hover:bg-teal-700'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingShiftId ? 'ذخیره تغییرات نوبت کاری' : 'ثبت و ذخیره شیفت'}</span>
                    </button>
                    {!editingShiftId && (
                      <button
                        type="button"
                        onClick={() => {
                          const payload = buildMonthlyShiftPayload({
                            supId: newShiftSupId,
                            dormId: newShiftDormId,
                            dateStr: newShiftDate,
                            shiftType: newShiftType,
                            startTime: newShiftStartTime,
                            endTime: newShiftEndTime,
                            endsNextDay: newShiftEndsNextDay,
                            notes: newShiftNotes,
                          });
                          if (!payload) return;
                          Storage.addShiftSchedule(payload);
                          setShiftSchedules(Storage.getShiftSchedules());
                          const nextDate = addDaysToJalaliDate(payload.shiftDate || '', 1, 'fa');
                          if (nextDate) setNewShiftDate(nextDate);
                          setNewShiftNotes('');
                          setShiftFeedback(`شیفت ${payload.shiftDate} ثبت شد. تاریخ روی روز بعد (${nextDate || ''}) تنظیم شد.`);
                        }}
                        className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>ثبت و رفتن به روز بعد</span>
                      </button>
                    )}
                    {editingShiftId && (
                      <button
                        type="button"
                        onClick={() => {
                          const idToDelete = editingShiftId;
                          setIsAddShiftModalOpen(false);
                          setEditingShiftId(null);
                          setAdminConfirmDialog({
                            title: 'حذف برنامه شیفت',
                            message: `آیا از حذف این نوبت کاری در تاریخ ${newShiftDate} مطمئن هستید؟`,
                            confirmLabel: 'تأیید و حذف شیفت',
                            onConfirm: () => {
                              Storage.deleteShiftSchedule(idToDelete);
                              setShiftSchedules(Storage.getShiftSchedules());
                              setShiftFeedback('شیفت مورد نظر با موفقیت حذف گردید.');
                            },
                          });
                        }}
                        className="px-3.5 py-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-900 rounded-xl font-bold hover:bg-rose-100 cursor-pointer"
                      >
                        حذف
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddShiftModalOpen(false);
                        setEditingShiftId(null);
                      }}
                      className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-100 cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* ۶. تب مرکز مشاوره، روانشناسان و شیفت‌های کاری */}
      {/* ========================================================= */}
      {mainTab === 'counseling' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* بنر سربرگ بخش مشاوره */}
          <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-white/10 text-teal-200 border border-white/20">
                <HeartHandshake className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-black">مرکز بهداشت روان و مشاوره دانشگاه (سامانه جامع خدمات دانشجویی)</h2>
                <p className="text-xs text-teal-100 mt-1">
                  مدیریت روانشناسان و مشاوران، برنامه‌ریزی شیفت‌های کاری با اکسل، پایش تمام پیام‌ها و گزارش‌های فعالیت
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => exportCounselorShiftScheduleToExcel(counselorShifts)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>اکسل شیفت‌های مشاوران</span>
              </button>
              <button
                onClick={() => exportCounselorReportsToExcel(counselorReports)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>اکسل گزارش‌های فعالیت</span>
              </button>
            </div>
          </div>

          {/* پیام فیدبک */}
          {counselorFeedback && (
            <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 text-xs font-bold flex items-center justify-between border border-teal-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{counselorFeedback}</span>
              </div>
              <button onClick={() => setCounselorFeedback(null)} className="p-1 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* زیرتب‌های بخش مشاوره */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setCounselingSubTab('counselors')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                counselingSubTab === 'counselors'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>فهرست مشاوران مرکز ({counselorsList.length})</span>
            </button>

            <button
              onClick={() => setCounselingSubTab('shifts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                counselingSubTab === 'shifts'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>شیفت‌بندی مشاوران و ورود اکسل ({counselorShifts.length})</span>
            </button>

            <button
              onClick={() => setCounselingSubTab('messages')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                counselingSubTab === 'messages'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>پایش تمام درخواست‌ها و پیام‌های مشاوره دانشجوها</span>
            </button>

            <button
              onClick={() => setCounselingSubTab('reports')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                counselingSubTab === 'reports'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>گزارش‌های فعالیت و اقدامات بالینی ({counselorReports.length})</span>
            </button>
          </div>

          {/* ۱. زیرتب مشاوران */}
          {counselingSubTab === 'counselors' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    مشاوران و کارشناسان سلامت روان فعال در سراها
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تعریف حساب کاربری مشاوران به صورت تکی یا گروهی با فایل اکسل
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUsersCategory('counselors');
                      setMainTab('users');
                    }}
                    className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>مدیریت کامل و تغییر رمز در بخش کاربران</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenExcelModal('counselors')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>ثبت گروهی با اکسل مشاوران</span>
                  </button>
                  <button
                    onClick={() => setIsAddCounselorModalOpen(true)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ افزودن مشاور جدید</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {counselorsList.map((cns) => (
                  <div
                    key={cns.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-300 transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 flex items-center justify-center font-black text-sm">
                        {cns.fullName.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{cns.fullName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600">
                            نام کاربری: {cns.username}
                          </span>
                        </div>
                        <div className="text-xs text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
                          {cns.specialty || 'روانشناسی و مشاوره'}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                          <span>دفتر: {cns.officeLocation || 'مرکز مشاوره'}</span>
                          <span>•</span>
                          <span dir="ltr">{cns.phone}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setAdminConfirmDialog({
                          title: `حذف مشاور «${cns.fullName}»`,
                          message: `آیا از حذف مشاور «${cns.fullName}» اطمینان دارید؟`,
                          confirmLabel: 'تأیید و حذف مشاور',
                          onConfirm: () => {
                            Storage.deleteCounselor(cns.id);
                            setCounselorsList(Storage.getCounselors());
                            setCounselorFeedback(`مشاور «${cns.fullName}» حذف گردید.`);
                          },
                        });
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="حذف مشاور"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ۲. زیرتب شیفت‌بندی مشاوران و ورود اکسل */}
          {counselingSubTab === 'shifts' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    برنامه شیفت‌های کاری مشاوران (روزهای هفته و بازه زمانی)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    شیفت‌ها می‌توانند چند ساعت در برخی روزها باشند و از طریق اکسل یا دستی قابل تنظیم هستند
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => exportCounselorShiftTemplateToExcel()}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>دانلود فایل خام (Template)</span>
                  </button>

                  <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>بارگذاری فایل اکسل شیفت‌ها</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const res = await importCounselorShiftScheduleFromExcel(file, counselorsList, dorms);
                          if (res.success) {
                            const current = Storage.getCounselorShifts();
                            const merged = [...current, ...res.schedules];
                            Storage.setCounselorShifts(merged);
                            setCounselorShifts(merged);
                            const syncRes = await Storage.waitForPendingCloudSync();
                            setCounselorFeedback(
                              syncRes.success
                                ? `${res.message} (ذخیره‌شده در دیتابیس ابری)`
                                : `${res.message} (هشدار: همگام‌سازی ابری با خطا مواجه شد)`
                            );
                          } else {
                            setAdminNoticeDialog({
                              title: 'خطا در فایل اکسل شیفت‌ها',
                              message: res.message,
                              tone: 'error',
                            });
                          }
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>

                  <button
                    onClick={() => setIsAddCounselorShiftModalOpen(true)}
                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ ثبت دستی شیفت</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {counselorShifts.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-xs text-slate-400">
                    هیچ شیفتی برای مشاوران ثبت نشده است. از دکمه‌های بالا برای افزودن شیفت استفاده فرمایید.
                  </div>
                ) : (
                  counselorShifts.map((sh) => (
                    <div
                      key={sh.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-300 transition"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-xs text-teal-700 dark:text-teal-300">
                          {sh.counselorName}
                        </span>
                        <button
                          onClick={() => {
                            Storage.deleteCounselorShift(sh.id);
                            setCounselorShifts(Storage.getCounselorShifts());
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-2.5 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          <span>روز: {sh.dayOfWeek === 'all' ? 'همه روزها' : sh.dayOfWeek}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>ساعت حضور: {sh.startTime} الی {sh.endTime}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          محل: {sh.dormName || 'مرکز مشاوره'} ({sh.roomNumber || 'دفتر مشاوره'})
                        </div>
                        {sh.notes && (
                          <div className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg mt-1.5">
                            {sh.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ۳. زیرتب پایش تمام درخواست‌ها و پیام‌های مشاوره توسط مدیر */}
          {counselingSubTab === 'messages' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  نظارت و اشراف کامل مدیر بر پیام‌ها و درخواست‌های مشاوره
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  مدیریت کل سامانه به تمامی پیام‌های مشاوره، ارجاعات و تبادل نظرات مشاوران با دانشجوها دسترسی دارد
                </p>
              </div>

              <div className="space-y-3">
                {Storage.getMessages()
                  .filter(
                    (m) =>
                      m.category === 'counseling' ||
                      m.receiverType === 'counselor' ||
                      m.subject.includes('مشاوره') ||
                      m.subject.includes('روانشناس')
                  )
                  .map((msg) => (
                    <div
                      key={msg.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-teal-700 dark:text-teal-300">
                            دانشجو: {msg.senderName}
                          </span>
                          <span className="text-slate-400">• {msg.date}</span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 font-bold">
                          {msg.subject}
                        </span>
                      </div>

                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>

                      {msg.replies && msg.replies.length > 0 && (
                        <div className="mt-2 p-2.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-100 text-[11px] text-teal-900 dark:text-teal-200 space-y-1">
                          <span className="font-bold">پاسخ مشاور:</span>
                          {msg.replies.map((rep) => (
                            <div key={rep.id}>
                              <strong>{rep.senderName}:</strong> {rep.content}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ۴. زیرتب گزارش‌های بالینی و اقدامات مشاوران */}
          {counselingSubTab === 'reports' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    دفترچه گزارش‌های فعالیت و اقدامات مشاوران سراها
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    بررسی آمار مراجعین، بحران‌های ارجاعی و پیشنهادات مشاوران به مدیریت
                  </p>
                </div>
                <button
                  onClick={() => exportCounselorReportsToExcel(counselorReports)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود خروجی اکسل</span>
                </button>
              </div>

              <div className="space-y-3">
                {counselorReports.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-800">
                          {r.reportCode}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          مشاور: {r.counselorName}
                        </span>
                        <span className="text-slate-400">({r.shiftDate})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold">
                          {r.totalSessionsCount} مراجعه‌کننده
                        </span>
                        {r.urgentCasesCount && r.urgentCasesCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                            {r.urgentCasesCount} ارجاع فوری
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      <strong>شرح اقدامات:</strong> {r.interventionsSummary}
                    </p>

                    {r.recommendationsToAdmin && (
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                        <strong>پیشنهاد مشاور به مدیریت:</strong> {r.recommendationsToAdmin}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* مدال افزودن مشاور جدید */}
          {isAddCounselorModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl text-right">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <HeartHandshake className="w-5 h-5 text-teal-600" />
                    <span>تعریف حساب کاربری مشاور جدید</span>
                  </h3>
                  <button onClick={() => setIsAddCounselorModalOpen(false)} className="p-1 hover:opacity-75 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newCnsFullName.trim() || !newCnsUsername.trim() || !newCnsPassword.trim()) return;

                    const res = Storage.addCounselor({
                      fullName: newCnsFullName.trim(),
                      username: newCnsUsername.trim(),
                      password: newCnsPassword.trim(),
                      phone: newCnsPhone.trim() || '09130000000',
                      specialty: newCnsSpecialty.trim(),
                      officeLocation: newCnsOffice.trim(),
                      role: 'counselor',
                      status: 'active',
                    });

                    if (res.success) {
                      const syncRes = await Storage.waitForPendingCloudSync();
                      setCounselorsList(Storage.getCounselors());
                      setIsAddCounselorModalOpen(false);
                      setCounselorFeedback(
                        syncRes.success
                          ? `مشاور «${res.counselor.fullName}» با موفقیت افزوده و بلافاصله در سرور ابری و دیتابیس ثبت شد.`
                          : `مشاور «${res.counselor.fullName}» در مرورگر ثبت شد اما ارسال به سرور ابری در صف تلاش مجدد قرار گرفت.`
                      );
                      setNewCnsFullName('');
                      setNewCnsUsername('');
                      setNewCnsPassword('');
                    }
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">نام و نام خانوادگی مشاور *</label>
                    <input
                      type="text"
                      required
                      value={newCnsFullName}
                      onChange={(e) => setNewCnsFullName(e.target.value)}
                      placeholder="مثال: دکتر احمدی"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">نام کاربری *</label>
                      <input
                        type="text"
                        required
                        value={newCnsUsername}
                        onChange={(e) => setNewCnsUsername(e.target.value)}
                        placeholder="ahmadi"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">کلمه عبور *</label>
                      <input
                        type="password"
                        required
                        value={newCnsPassword}
                        onChange={(e) => setNewCnsPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">رشته و زمینه تخصصی</label>
                    <input
                      type="text"
                      value={newCnsSpecialty}
                      onChange={(e) => setNewCnsSpecialty(e.target.value)}
                      placeholder="روانشناسی بالینی، مشاوره تحصیلی..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">تلفن تماس</label>
                      <input
                        type="text"
                        value={newCnsPhone}
                        onChange={(e) => setNewCnsPhone(e.target.value)}
                        placeholder="0913..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">دفتر استقرار</label>
                      <input
                        type="text"
                        value={newCnsOffice}
                        onChange={(e) => setNewCnsOffice(e.target.value)}
                        placeholder="دفتر مشاوره پردیس"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>ثبت مشاور</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddCounselorModalOpen(false)}
                      className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-100 cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* مدال ثبت دستی شیفت مشاور */}
          {isAddCounselorShiftModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl text-right">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-teal-600" />
                    <span>ثبت دستی شیفت کاری مشاور</span>
                  </h3>
                  <button onClick={() => setIsAddCounselorShiftModalOpen(false)} className="p-1 hover:opacity-75 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const cns = counselorsList.find((c) => c.id === newCnsShiftCounselorId) || counselorsList[0];
                    const dorm = dorms.find((d) => d.id === newCnsShiftDormId);
                    if (!cns) return;

                    const res = Storage.addCounselorShift({
                      counselorId: cns.id,
                      counselorName: cns.fullName,
                      dormId: dorm ? dorm.id : 'all',
                      dormName: dorm ? dorm.name : 'مرکز مشاوره مرکزی',
                      dayOfWeek: newCnsShiftDay,
                      startTime: newCnsShiftStartTime,
                      endTime: newCnsShiftEndTime,
                      roomNumber: newCnsShiftRoom,
                      notes: newCnsShiftNotes,
                    });

                    if (res.success) {
                      setCounselorShifts(Storage.getCounselorShifts());
                      setIsAddCounselorShiftModalOpen(false);
                      setCounselorFeedback(`شیفت مشاور ${cns.fullName} ثبت گردید.`);
                    }
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">انتخاب مشاور *</label>
                    <select
                      value={newCnsShiftCounselorId}
                      onChange={(e) => setNewCnsShiftCounselorId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      required
                    >
                      {counselorsList.map((c) => (
                        <option key={c.id} value={c.id}>{c.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">روز هفته *</label>
                      <select
                        value={newCnsShiftDay}
                        onChange={(e) => setNewCnsShiftDay(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      >
                        <option value="saturday">شنبه</option>
                        <option value="sunday">یکشنبه</option>
                        <option value="monday">دوشنبه</option>
                        <option value="tuesday">سه‌شنبه</option>
                        <option value="wednesday">چهارشنبه</option>
                        <option value="thursday">پنج‌شنبه</option>
                        <option value="friday">جمعه</option>
                        <option value="all">همه روزها</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">سرا / مرکز مستقر</label>
                      <select
                        value={newCnsShiftDormId}
                        onChange={(e) => setNewCnsShiftDormId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      >
                        <option value="all">مرکز مشاوره مرکزی</option>
                        {dorms.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ساعت شروع</label>
                      <PersianTimePicker
                        value={newCnsShiftStartTime}
                        onChange={setNewCnsShiftStartTime}
                        placeholder="۱۴:۰۰"
                        digits="fa"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ساعت پایان</label>
                      <PersianTimePicker
                        value={newCnsShiftEndTime}
                        onChange={setNewCnsShiftEndTime}
                        placeholder="۱۸:۰۰"
                        digits="fa"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">توضیحات و زمینه تخصصی</label>
                    <input
                      type="text"
                      value={newCnsShiftNotes}
                      onChange={(e) => setNewCnsShiftNotes(e.target.value)}
                      placeholder="جلسات مشاوره فردی و اضطراب..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>ثبت شیفت مشاور</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddCounselorShiftModalOpen(false)}
                      className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-100 cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* ۵-ب. تب مشاهده لیست انبار، گردش کالا و کارپردازی (فقط مشاهده برای مدیر کل) */}
      {/* ========================================================= */}
      {mainTab === 'warehouse' && (() => {
        const invItems: InventoryItem[] = Storage.getInventoryItems();
        const invTxs: InventoryTransaction[] = Storage.getInventoryTransactions();
        const whReqs: WarehouseRequest[] = Storage.getWarehouseRequests();
        const procReqs: ProcurementRequest[] = Storage.getProcurementRequests();
        const lowStockCount = invItems.filter((i) => i.quantity <= i.minStockLevel).length;
        const activeProcCount = procReqs.filter(
          (p) => p.status !== 'warehouse_confirmed' && p.status !== 'cancelled'
        ).length;

        const qNorm = toEnglishDigits(adminWhSearch.trim().toLowerCase());
        const filteredInv = invItems.filter((it) => {
          if (adminWhCatFilter !== 'all' && it.category !== adminWhCatFilter) return false;
          if (qNorm) {
            const hay = toEnglishDigits(`${it.code} ${it.name} ${it.location || ''}`).toLowerCase();
            if (!hay.includes(qNorm)) return false;
          }
          return true;
        });

        const filteredTxs = invTxs.filter((tx) => {
          if (!qNorm) return true;
          const hay = toEnglishDigits(`${tx.itemCode} ${tx.itemName} ${tx.actorName} ${tx.reason || ''}`).toLowerCase();
          return hay.includes(qNorm);
        });

        const filteredWhReqs = whReqs.filter((r) => {
          if (!qNorm) return true;
          const hay = toEnglishDigits(`${r.requestCode} ${r.itemTitle} ${r.dormName} ${r.requestedByStaffName}`).toLowerCase();
          return hay.includes(qNorm);
        });

        const filteredProcReqs = procReqs.filter((p) => {
          if (!qNorm) return true;
          const hay = toEnglishDigits(`${p.trackingCode} ${p.itemTitle} ${p.dormName || ''} ${p.supplierName || ''} ${p.invoiceNumber || ''}`).toLowerCase();
          return hay.includes(qNorm);
        });

        const catMap: Record<string, string> = {
          plumbing: 'تأسیسات و لوله‌کشی',
          electrical: 'برق و روشنایی',
          carpentry: 'نجاری و در و پنجره',
          cleaning: 'مواد شوینده و بهداشتی',
          general: 'عمومی و متفرقه',
        };

        const procStatusMap: Record<string, { label: string; cls: string }> = {
          pending_purchase: { label: 'در انتظار خرید', cls: 'bg-amber-100 text-amber-800' },
          purchasing: { label: 'در حال خرید', cls: 'bg-blue-100 text-blue-800' },
          purchased: { label: 'خریداری شده', cls: 'bg-indigo-100 text-indigo-800' },
          delivered_to_warehouse: { label: 'تحویل به انبار (منتظر تأیید)', cls: 'bg-orange-100 text-orange-800' },
          warehouse_confirmed: { label: 'تأیید و وارد انبار شد', cls: 'bg-emerald-100 text-emerald-800' },
          cancelled: { label: 'لغو شده', cls: 'bg-rose-100 text-rose-800' },
        };

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* هشدار دسترسی فقط-مشاهده */}
            <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 text-xs text-violet-900 dark:text-violet-200">
                <Lock className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold">حالت مشاهده لیست انبار و کارپردازی (فقط خواندنی)</div>
                  <p className="text-[11px] text-violet-700 dark:text-violet-300 mt-0.5">
                    مطابق سطح دسترسی سامانه، افزودن، ویرایش، حذف و ثبت ورود/خروج اقلام منحصراً در اختیار <strong>کاربر مسئول انبار</strong> است و مدیریت کل تنها امکان مشاهده گزارش و دریافت اکسل دارد.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {onOpenWarehouseRequest && (
                  <button
                    type="button"
                    onClick={onOpenWarehouseRequest}
                    className="relative px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                  >
                    <PackagePlus className="w-4 h-4" />
                    <span>درخواست اقلام از انبار</span>
                    {myPendingWarehouseRequestsCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-white/25 text-white text-[10px] font-black">
                        {myPendingWarehouseRequestsCount.toLocaleString('fa-IR')}
                      </span>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => exportInventoryToExcel(invItems, invTxs)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>خروجی اکسل موجودی و گردش</span>
                </button>
              </div>
            </div>

            {/* کارت‌های آماری */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] text-slate-500 font-bold block">تنوع اقلام موجود در انبار</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{invItems.length}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 shadow-xs">
                <span className="text-[11px] text-rose-600 font-bold block">اقلام زیر حد نصاب / ناموجود</span>
                <span className="text-2xl font-black text-rose-600 mt-1 block">{lowStockCount}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/40 shadow-xs">
                <span className="text-[11px] text-orange-600 font-bold block">سفارشات باز کارپردازی</span>
                <span className="text-2xl font-black text-orange-600 mt-1 block">{activeProcCount}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/40 shadow-xs">
                <span className="text-[11px] text-indigo-600 font-bold block">تعداد تراکنش‌های ورودی/خروجی</span>
                <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1 block">{invTxs.length}</span>
              </div>
            </div>

            {/* زیرتب‌ها و جستجو */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'inventory' as const, label: `فهرست موجودی انبار (${invItems.length})` },
                    { id: 'transactions' as const, label: `دفتر ورود و خروج (${invTxs.length})` },
                    { id: 'requests' as const, label: `حواله‌های سرا (${whReqs.length})` },
                    { id: 'procurement' as const, label: `ارجاعات خرید کارپرداز (${procReqs.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAdminWhSubTab(tab.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        adminWhSubTab === tab.id
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={adminWhSearch}
                      onChange={(e) => setAdminWhSearch(e.target.value)}
                      placeholder="جستجو بر اساس کد، نام کالا، سرا یا فاکتور..."
                      className="pr-9 pl-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs w-64"
                    />
                  </div>
                  {adminWhSubTab === 'inventory' && (
                    <select
                      value={adminWhCatFilter}
                      onChange={(e) => setAdminWhCatFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="all">همه دسته‌ها</option>
                      {Object.entries(catMap).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* ۱. لیست موجودی انبار (فقط مشاهده) */}
              {adminWhSubTab === 'inventory' && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="p-3">کد کالا</th>
                        <th className="p-3">نام کالا / تجهیز</th>
                        <th className="p-3">دسته‌بندی</th>
                        <th className="p-3">موجودی فعلی</th>
                        <th className="p-3">حداقل نصاب</th>
                        <th className="p-3">قیمت واحد</th>
                        <th className="p-3">قفسه / محل</th>
                        <th className="p-3 text-center">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredInv.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            هیچ کالایی مطابق با جستجوی شما یافت نشد.
                          </td>
                        </tr>
                      ) : (
                        filteredInv.map((item) => {
                          const isOut = item.quantity <= 0;
                          const isLow = item.quantity > 0 && item.quantity <= item.minStockLevel;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{item.code}</td>
                              <td className="p-3 font-bold text-slate-900 dark:text-white">{item.name}</td>
                              <td className="p-3 text-slate-500">{catMap[item.category] || item.category}</td>
                              <td className="p-3 font-black text-violet-700 dark:text-violet-300">
                                {item.quantity.toLocaleString('fa-IR')} {item.unit}
                              </td>
                              <td className="p-3 text-slate-500">{item.minStockLevel} {item.unit}</td>
                              <td className="p-3 font-mono">
                                {item.unitPrice ? `${item.unitPrice.toLocaleString('fa-IR')} ریال` : '-'}
                              </td>
                              <td className="p-3 text-slate-500">{item.location || '-'}</td>
                              <td className="p-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isOut
                                      ? 'bg-rose-100 text-rose-800'
                                      : isLow
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {isOut ? 'ناموجود' : isLow ? 'نزدیک به اتمام' : 'موجود'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ۲. دفتر گردش ورود و خروج (فقط مشاهده) */}
              {adminWhSubTab === 'transactions' && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="p-3">تاریخ</th>
                        <th className="p-3">نوع تراکنش</th>
                        <th className="p-3">کد و نام کالا</th>
                        <th className="p-3">تغییر موجودی</th>
                        <th className="p-3">موجودی قبل ← بعد</th>
                        <th className="p-3">ثبت‌کننده</th>
                        <th className="p-3">شرح و مرجع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredTxs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            تراکنش انباری ثبت نشده است.
                          </td>
                        </tr>
                      ) : (
                        filteredTxs.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3 font-mono text-[11px]">{tx.date}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                  tx.type === 'in'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : tx.type === 'out'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {tx.type === 'in' ? 'ورودی به انبار' : tx.type === 'out' ? 'خروجی از انبار' : 'تعدیل موجودی'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="font-mono text-slate-400 ml-1">[{tx.itemCode}]</span>
                              <span className="font-bold text-slate-900 dark:text-white">{tx.itemName}</span>
                            </td>
                            <td className="p-3 font-black" dir="ltr">
                              {tx.type === 'in' ? `+${tx.quantity}` : tx.type === 'out' ? `-${tx.quantity}` : tx.quantity} {tx.unit}
                            </td>
                            <td className="p-3 font-mono text-slate-500">
                              {tx.previousQuantity} ← <strong className="text-slate-900 dark:text-white">{tx.newQuantity}</strong>
                            </td>
                            <td className="p-3">{tx.actorName}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-300">{tx.reason || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ۳. حواله‌های درخواست کالا (فقط مشاهده) */}
              {adminWhSubTab === 'requests' && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="p-3">کد حواله</th>
                        <th className="p-3">قلم درخواستی</th>
                        <th className="p-3">مقدار</th>
                        <th className="p-3">سرا / متقاضی</th>
                        <th className="p-3">تاریخ</th>
                        <th className="p-3">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredWhReqs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            درخواست حواله‌ای ثبت نشده است.
                          </td>
                        </tr>
                      ) : (
                        filteredWhReqs.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3 font-mono font-bold">{req.requestCode}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{req.itemTitle}</td>
                            <td className="p-3">{req.quantityRequested} {req.unit}</td>
                            <td className="p-3">{req.dormName} • {req.requestedByStaffName}</td>
                            <td className="p-3 font-mono text-[11px]">{req.requestDate}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                                {req.status === 'pending_supervisor'
                                  ? 'در انتظار تأیید سرپرست'
                                  : req.status === 'pending_warehouse'
                                  ? 'در انتظار اقدام انبار'
                                  : req.status === 'referred_to_procurement'
                                  ? 'ارجاع به کارپرداز جهت خرید'
                                  : req.status === 'issued'
                                  ? 'تحویل داده شد'
                                  : 'رد شده'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ۴. سفارشات کارپردازی و خرید (فقط مشاهده) */}
              {adminWhSubTab === 'procurement' && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="p-3">کد کارپردازی</th>
                        <th className="p-3">کالا / قطعه</th>
                        <th className="p-3">درخواست / خریداری‌شده</th>
                        <th className="p-3">مبلغ کل خرید</th>
                        <th className="p-3">فروشنده / فاکتور</th>
                        <th className="p-3">وضعیت خرید و تحویل انبار</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredProcReqs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            هنوز سفارشی به کارپردازی ارجاع نشده است.
                          </td>
                        </tr>
                      ) : (
                        filteredProcReqs.map((p) => {
                          const meta = procStatusMap[p.status] || { label: p.status, cls: 'bg-slate-100 text-slate-800' };
                          return (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-3 font-mono font-bold text-orange-700">{p.trackingCode}</td>
                              <td className="p-3 font-bold text-slate-900 dark:text-white">
                                {p.itemTitle}
                                {p.dormName && <div className="text-[10px] text-slate-400 font-normal">{p.dormName}</div>}
                              </td>
                              <td className="p-3">
                                <div>نیاز: {p.requestedQuantity} {p.unit}</div>
                                {p.purchasedQuantity != null && (
                                  <div className="text-[11px] font-bold text-emerald-700">
                                    خرید: {p.purchasedQuantity} {p.unit} ({p.purchasedItemCount || 1} بسته/عدد)
                                  </div>
                                )}
                              </td>
                              <td className="p-3 font-mono font-bold">
                                {p.totalPrice ? `${p.totalPrice.toLocaleString('fa-IR')} ریال` : '-'}
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-300">
                                {p.supplierName || '-'} {p.invoiceNumber ? `(فاکتور ${p.invoiceNumber})` : ''}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${meta.cls}`}>
                                  {meta.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* ۷-ب. تب نظرسنجی‌های دوره‌ای دانشجویان (خدمات، سلف، تأسیسات، سرپرستان) */}
      {/* ========================================================= */}
      {mainTab === 'surveys' && (
        <AdminSurveyManager
          dorms={dorms}
          supervisors={supervisors}
          maintenanceStaff={campusStaff}
          settings={settings}
          onRefreshData={onRefreshData}
        />
      )}

      {/* ========================================================= */}
      {/* ۶. تب گزارش لاگ فعالیت‌ها و دسترسی‌های کاربران (Activity Log) */}
      {/* ========================================================= */}
      {mainTab === 'activity_log' && (() => {
        const roleLabelMap: Record<string, string> = {
          admin: 'مدیر کل',
          vice_dean: 'معاونت دانشجویی',
          supervisor: 'سرپرست سرا',
          student: 'دانشجو',
          maintenance: 'تأسیسات',
          warehouse: 'مسئول انبار',
          procurement: 'کارپرداز و خرید',
          counselor: 'مشاور',
          finance: 'امور مالی و حسابداری',
          education: 'کارشناس آموزش',
          cultural: 'امور فرهنگی',
          student_affairs: 'امور دانشجویی و تربیت بدنی',
          security: 'حراست و انتظامات',
          system: 'سیستم / مهمان',
        };
        const categoryLabelMap: Record<string, string> = {
          auth: 'ورود و دسترسی‌ها',
          student: 'پرونده دانشجویان',
          accommodation: 'اسکان و تخت‌ها',
          dorm_structure: 'ساختار سرا و اتاق',
          staff: 'پرسنل و کاربران',
          maintenance: 'امور تأسیسات',
          warehouse: 'انبار و تجهیزات',
          procurement: 'کارپردازی و خرید',
          finance: 'امور مالی و کسورات',
          warning_eval: 'تذکر، اخطار و ارزیابی',
          visit_report: 'گزارش بازدید سرپرستی',
          guest: 'درخواست مهمان',
          survey: 'نظرسنجی‌های دوره‌ای',
          cultural: 'امور فرهنگی و تشکل‌ها',
          education: 'امور آموزشی',
          sports: 'امور ورزشی و تربیت بدنی',
          election: 'انتخابات شورای صنفی',
          disciplinary: 'شورای انضباطی',
          security: 'حراست و انتظامات',
          settings: 'تنظیمات و اطلاعیه‌ها',
          backup: 'پشتیبان و بازنشانی',
          excel: 'ورود اطلاعات اکسل',
        };

        const q = toEnglishDigits(logSearchQuery.trim().toLowerCase());
        const filteredLogs = activityLogs.filter((l) => {
          if (logCategoryFilter !== 'all' && l.category !== logCategoryFilter) return false;
          if (logRoleFilter !== 'all' && l.actorRole !== logRoleFilter) return false;
          if (logSeverityFilter !== 'all' && (l.severity || 'info') !== logSeverityFilter) return false;
          if (q) {
            const hay = toEnglishDigits(
              `${l.actorName} ${l.actorUsername || ''} ${l.action} ${l.details} ${l.targetName || ''}`.toLowerCase()
            );
            if (!hay.includes(q)) return false;
          }
          return true;
        });

        const authLogsCount = activityLogs.filter((l) => l.category === 'auth').length;
        const alertLogsCount = activityLogs.filter(
          (l) => l.severity === 'warning' || l.severity === 'critical'
        ).length;
        const housingStudentLogsCount = activityLogs.filter(
          (l) => l.category === 'accommodation' || l.category === 'student' || l.category === 'warning_eval'
        ).length;

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* کارت‌های شاخص لاگ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="text-[11px] font-bold text-slate-500">کل رویدادهای ثبت‌شده</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{activityLogs.length}</div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-900/50 shadow-xs">
                <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">ورود، خروج و دسترسی‌ها</div>
                <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">{authLogsCount}</div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-rose-200 dark:border-rose-900/50 shadow-xs">
                <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400">رویدادهای هشدار و حساس</div>
                <div className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">{alertLogsCount}</div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-teal-200 dark:border-teal-900/50 shadow-xs">
                <div className="text-[11px] font-bold text-teal-600 dark:text-teal-400">تغییرات اسکان، دانشجو و ارزیابی</div>
                <div className="text-2xl font-black text-teal-700 dark:text-teal-300 mt-1">{housingStudentLogsCount}</div>
              </div>
            </div>

            {/* فیلترها و جدول لاگ */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      تاریخچه فعالیت‌ها، تغییرات و دسترسی‌های کاربران (Activity Log)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ثبت خودکار ورود/خروج کاربران، تغییرات اسکان، تذکرات و ارزیابی‌ها، اکسل و پیکربندی (ذخیره در فضای ابری)
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActivityLogs(Storage.getActivityLogs())}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>بروزرسانی</span>
                  </button>

                  <button
                    onClick={() => exportActivityLogsToExcel(filteredLogs)}
                    disabled={filteredLogs.length === 0}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>خروجی اکسل ({filteredLogs.length})</span>
                  </button>

                  {!confirmClearLogs ? (
                    <button
                      onClick={() => setConfirmClearLogs(true)}
                      disabled={activityLogs.length === 0}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 disabled:opacity-50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>پاک‌سازی لاگ‌ها</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-2.5 py-1 rounded-xl">
                      <span className="text-[11px] font-bold text-rose-800 dark:text-rose-200">مطمئن هستید؟</span>
                      <button
                        onClick={() => {
                          Storage.clearActivityLogs();
                          setActivityLogs([]);
                          setConfirmClearLogs(false);
                        }}
                        className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                      >
                        بله، پاک کن
                      </button>
                      <button
                        onClick={() => setConfirmClearLogs(false)}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold cursor-pointer"
                      >
                        انصراف
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* نوار فیلترها */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    placeholder="جستجو در نام کاربر، اقدام، جزئیات یا شناسه..."
                    className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <select
                  value={logCategoryFilter}
                  onChange={(e) => setLogCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="all">همه دسته‌بندی‌ها</option>
                  {Object.entries(categoryLabelMap).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>

                <select
                  value={logRoleFilter}
                  onChange={(e) => setLogRoleFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="all">همه نقش‌های کاربری</option>
                  {Object.entries(roleLabelMap).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>

                <select
                  value={logSeverityFilter}
                  onChange={(e) => setLogSeverityFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="all">همه سطوح اهمیت</option>
                  <option value="info">عادی (Info)</option>
                  <option value="warning">هشدار (Warning)</option>
                  <option value="critical">حساس / بحرانی (Critical)</option>
                </select>
              </div>

              {/* جدول اختصاصی لاگ فعالیت‌ها */}
              {filteredLogs.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  هیچ رویدادی مطابق با فیلترهای انتخابی یافت نشد.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto max-h-[540px] overflow-y-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0 z-10">
                      <tr>
                        <th className="p-3">ردیف</th>
                        <th className="p-3">تاریخ و ساعت</th>
                        <th className="p-3">کاربر و نقش</th>
                        <th className="p-3">دسته‌بندی</th>
                        <th className="p-3">عنوان اقدام</th>
                        <th className="p-3">هدف / شناسه</th>
                        <th className="p-3">شرح و جزئیات</th>
                        <th className="p-3 text-center">سطح</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredLogs.map((log, idx) => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-3 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {log.date}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900 dark:text-white">{log.actorName}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                                {roleLabelMap[log.actorRole] || log.actorRole}
                              </span>
                              {log.actorUsername && (
                                <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                                  ({log.actorUsername})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800">
                              {categoryLabelMap[log.category] || log.category}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{log.action}</td>
                          <td className="p-3 text-teal-700 dark:text-teal-300 font-semibold">{log.targetName || '-'}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs leading-relaxed">
                            {log.details}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                log.severity === 'critical'
                                  ? 'bg-rose-600 text-white'
                                  : log.severity === 'warning'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {log.severity === 'critical' ? 'حساس' : log.severity === 'warning' ? 'هشدار' : 'عادی'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* ۹. تب پیکربندی سیستم، ظاهر و صفحه اول (دسته‌بندی‌شده با دکمه‌های بازشونده) */}
      {/* ========================================================= */}
      {mainTab === 'settings' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* فهرست دکمه‌های بازشونده دسته‌بندی تنظیمات (نمایش فقط بخش انتخاب‌شده) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    مرکز تنظیمات و پیکربندی سامانه
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    روی هر دکمه کلیک کنید تا فقط همان بخش تنظیمات باز شود و بدون نیاز به اسکرول طولانی آن را مدیریت نمایید.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenAppearance}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="تغییر والپیپر، تم رنگی، فونت و ظاهر سامانه"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>شخصی‌سازی ظاهر و فونت</span>
                </button>

                {openSettingsSection && (
                  <button
                    type="button"
                    onClick={() => setOpenSettingsSection(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>بستن بخش بازشده</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {(
                [
                  {
                    key: 'general' as const,
                    title: 'سال تحصیلی و انتخاب اتاق',
                    desc: 'سال، نیمسال، بازه رزرو، دسترسی‌ها و مقیاس متن',
                    icon: Calendar,
                  },
                  {
                    key: 'appearance' as const,
                    title: 'تنظیمات ظاهری سایت',
                    desc: 'آرم و لوگو، فونت‌ها، تصاویر پس‌زمینه و بنر صفحه اول',
                    icon: Palette,
                  },
                  {
                    key: 'cloud' as const,
                    title: 'اتصال سرور ابری و دیتابیس',
                    desc: 'بررسی اتصال، ترافیک آنلاین و همگام‌سازی',
                    icon: Server,
                  },
                  {
                    key: 'backup' as const,
                    title: 'پشتیبان‌گیری و بازیابی کامل',
                    desc: 'فایل پشتیبان کامل با عکس‌ها، بازیابی و بازنشانی',
                    icon: Database,
                  },
                  {
                    key: 'home_notes' as const,
                    title: 'نکات مهم صفحه اول',
                    desc: 'ویرایش کارت‌های راهنما و نکات انتخاب اتاق',
                    icon: Info,
                  },
                  {
                    key: 'academic_majors' as const,
                    title: 'مقاطع و رشته‌های تحصیلی مصوب',
                    desc: 'ثبت مقاطع، کد رشته‌ها و یکسان‌سازی داده‌های قبلی دانشجویان',
                    icon: GraduationCap,
                  },
                  {
                    key: 'student_portals' as const,
                    title: 'سامانه‌های دانشجویان',
                    desc: 'ایجاد، ویرایش، ترتیب‌بندی و حذف لینک‌های تب «سامانه‌ها»',
                    icon: Globe,
                  },
                  {
                    key: 'about' as const,
                    title: 'محتوا و فایل‌های «درباره ما»',
                    desc: 'متن‌ها، طراح، ۱۳ نقش و فایل‌های پیوست',
                    icon: Edit3,
                  },
                  {
                    key: 'quick_users' as const,
                    title: 'دسترسی سریع کاربران',
                    desc: 'ورود مستقیم به بخش‌های مختلف مدیریت کاربران',
                    icon: Users,
                  },
                ] as const
              ).map((item) => {
                const IconComp = item.icon;
                const isOpen = openSettingsSection === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      setOpenSettingsSection((prev) => (prev === item.key ? null : item.key))
                    }
                    className={`group text-right p-3 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-2 ${
                      isOpen
                        ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20'
                        : 'bg-slate-50/90 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-950/30'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`p-2 rounded-xl shrink-0 transition ${
                          isOpen
                            ? 'bg-white/20 text-white'
                            : 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 border border-slate-200/80 dark:border-slate-700'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs leading-snug truncate">
                          {item.title}
                        </div>
                        <div
                          className={`text-[10px] mt-0.5 line-clamp-2 leading-relaxed ${
                            isOpen ? 'text-teal-50/90' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 mt-0.5 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-white' : 'text-slate-400 group-hover:text-teal-600'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {!openSettingsSection && (
              <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                برای مشاهده و ویرایش هر گروه از تنظیمات، روی یکی از دکمه‌های بالا کلیک کنید.
              </div>
            )}
          </div>

          {/* مدیریت مقاطع و رشته‌های تحصیلی مصوب دانشگاه */}
          {openSettingsSection === 'academic_majors' && (
            <div className="animate-in fade-in duration-150">
              <AdminAcademicMajorsSettings
                settings={localSettings}
                students={students}
                onUpdateSettings={(updated) => {
                  setLocalSettings(updated);
                  onUpdateSettings(updated);
                }}
                onRefreshData={onRefreshData}
              />
            </div>
          )}

          {/* مدیریت سامانه‌ها و درگاه‌های بیرونی در کارتابل دانشجویان */}
          {openSettingsSection === 'student_portals' && (
            <div className="animate-in fade-in duration-150">
              <AdminStudentPortalsEditor
                settings={localSettings}
                onUpdateSettings={(updated) => {
                  setLocalSettings(updated);
                  onUpdateSettings(updated);
                }}
              />
            </div>
          )}

          {/* ۱. دسترسی سریع به مدیریت کاربران */}
          {openSettingsSection === 'quick_users' && (
          <div className="bg-gradient-to-r from-indigo-50 via-teal-50 to-slate-50 dark:from-indigo-950/30 dark:via-teal-950/30 dark:to-slate-900 rounded-3xl p-5 border border-indigo-200/70 dark:border-indigo-900/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-teal-600 text-white shadow-sm shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  مدیریت کاربران به بخش مجزای «مدیریت کاربران سامانه» منتقل شد
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  برای مشاهده، جستجوی پیشرفته، ویرایش، تغییر/ریست رمز و ثبت تکی یا اکسل کاربران روی دسته دلخواه کلیک کنید:
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: 'students' as const, label: `دانشجویان (${students.length})` },
                { key: 'supervisors' as const, label: `سرپرستان (${supervisors.length})` },
                { key: 'maintenance' as const, label: `تأسیسات (${campusStaff.length})` },
                { key: 'warehouse' as const, label: `انبار (${warehouseStaffList.length})` },
                { key: 'procurement' as const, label: `کارپرداز (${procurementStaffList.length})` },
                { key: 'counselors' as const, label: `مشاوران (${counselorsList.length})` },
                { key: 'finance' as const, label: `امور مالی (${financeStaffList.length})` },
                {
                  key: 'education' as const,
                  label: `حوزه معاونت آموزشی (${educationStaffList.length + graduationStaffList.length + academicDeputyStaffList.length})`,
                },
                { key: 'cultural' as const, label: `امور فرهنگی (${culturalStaffList.length})` },
                { key: 'student_affairs' as const, label: `امور دانشجویی (${studentAffairsStaffList.length})` },
                { key: 'security' as const, label: `حراست (${securityStaffList.length})` },
                { key: 'vice_dean' as const, label: `معاونت دانشجویی (${viceDeanStaffList.length})` },
                { key: 'library' as const, label: `کتابخانه و پژوهش (${libraryStaffList.length})` },
                { key: 'smart_campus' as const, label: `واحد هوشمندسازی (${smartCampusStaffList.length})` },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setUsersCategory(item.key);
                    setMainTab('users');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-teal-600 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* ۲. پنل بررسی اتصال به سرور ابری، دیتابیس و گزارش آنلاین ترافیک */}
          {openSettingsSection === 'cloud' && (
            <div className="animate-in fade-in duration-150">
              <CloudConnectionDiagnosticsPanel onRefreshData={onRefreshData} />
            </div>
          )}

          {/* ۳. بخش تنظیمات سال تحصیلی، نیمسال و بازه زمانی مجاز انتخاب اتاق */}
          {openSettingsSection === 'general' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    تنظیمات سال تحصیلی و بازه مجاز انتخاب اتاق
                  </h3>
                  <p className="text-xs text-slate-400">
                    تعیین سال تحصیلی، نیمسال، متن پیام بالای سایت و زمان شروع و پایان رزرو خوابگاه
                  </p>
                </div>
              </div>

              {saveStatus && (
                <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold animate-fade-in flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  تنظیمات با موفقیت ذخیره شد
                </span>
              )}
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    سال تحصیلی فعال
                  </label>
                  <input
                    type="text"
                    value={localSettings.currentAcademicYear}
                    onChange={(e) => setLocalSettings((prev) => ({ ...prev, currentAcademicYear: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نیمسال تحصیلی
                  </label>
                  <select
                    value={localSettings.currentSemester}
                    onChange={(e) => setLocalSettings((prev) => ({ ...prev, currentSemester: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="نیمسال اول">نیمسال اول (مهرماه)</option>
                    <option value="نیمسال دوم">نیمسال دوم (بهمن‌ماه)</option>
                    <option value="دوره تابستان">دوره تابستان</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نام دانشگاه
                  </label>
                  <input
                    type="text"
                    value={localSettings.universityName}
                    onChange={(e) => setLocalSettings((prev) => ({ ...prev, universityName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* متن بنر سراسری */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  متن بنر اطلاع‌رسانی بالای پنل کاربران (پس از ورود)
                </label>
                <input
                  type="text"
                  value={localSettings.announcementBanner || ''}
                  onChange={(e) => setLocalSettings((prev) => ({ ...prev, announcementBanner: e.target.value }))}
                  placeholder="متن پیام کوتاه برای نمایش در بالای کارتابل کاربران پس از ورود..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* عنوان بخش اطلاعیه‌ها در صفحه اصلی سامانه */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان بخش اطلاعیه‌ها در صفحه اصلی سامانه
                </label>
                <input
                  type="text"
                  value={localSettings.homeAnnouncementsTitle || ''}
                  onChange={(e) => setLocalSettings((prev) => ({ ...prev, homeAnnouncementsTitle: e.target.value }))}
                  placeholder="اطلاعیه‌ها، بخشنامه‌ها و زمان‌بندی سامانه جامع خدمات دانشجویی و سراها"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  در صورت خالی گذاشتن، عنوان پیش‌فرض «اطلاعیه‌ها، بخشنامه‌ها و زمان‌بندی سامانه جامع خدمات دانشجویی و سراها» نمایش داده می‌شود.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    وضعیت کلی امکان انتخاب اتاق برای دانشجویان
                  </div>
                  <div className="text-xs text-slate-500">
                    با خاموش کردن این گزینه، هیچ دانشجویی قادر به رزرو یا جابجایی تخت نخواهد بود.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setLocalSettings((prev) => ({ ...prev, selectionActive: !prev.selectionActive }))}
                  className={`w-14 h-7 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                    localSettings.selectionActive ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <div className="bg-white w-5 h-5 rounded-full shadow-md transform transition" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    {localSettings.studentSecondaryEditEnabled ? (
                      <Unlock className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>دسترسی ویرایش ثانویه اطلاعات و تغییر عکس توسط دانشجویان</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    در صورت بسته بودن، دانشجو پس از تکمیل بار اول پرونده دیگر قادر به تغییر اطلاعات یا بارگذاری مجدد عکس نیست (ویرایش از پنل مدیر همیشه مجاز است).
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleStudentSecondaryEdit}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer shrink-0 shadow-xs ${
                    localSettings.studentSecondaryEditEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  {localSettings.studentSecondaryEditEnabled ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>باز است (کلیک برای بستن)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>بسته است (کلیک برای باز کردن)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تاریخ و ساعت شروع انتخاب اتاق
                  </label>
                  <PersianDateTimePicker
                    value={localSettings.selectionStartDate}
                    onChange={(val) => setLocalSettings((prev) => ({ ...prev, selectionStartDate: val }))}
                    datePlaceholder="1405/07/01"
                    timePlaceholder="08:00"
                    digits="en"
                    inputClassName="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تاریخ و ساعت پایان مهلت انتخاب اتاق
                  </label>
                  <PersianDateTimePicker
                    value={localSettings.selectionEndDate}
                    onChange={(val) => setLocalSettings((prev) => ({ ...prev, selectionEndDate: val }))}
                    datePlaceholder="1405/07/15"
                    timePlaceholder="23:59"
                    digits="en"
                    inputClassName="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* تنظیم درصدی اندازه فونت‌های کل سامانه */}
              <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-teal-600" />
                      <span>اندازه و مقیاس درصدی تمام فونت‌های سامانه (نسبت به پیش‌فرض ۱۰۰٪)</span>
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      اگر عدد ۱۵۰ را بنویسید، اندازه تمامی فونت‌های سامانه ۵۰ درصد بیشتر از حالت پیش‌فرض خواهد شد.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">مقدار درصد:</span>
                    <div className="relative inline-flex items-center">
                      <input
                        type="number"
                        min="50"
                        max="250"
                        step="5"
                        value={localSettings.fontScale || 100}
                        onChange={(e) => {
                          const val = Math.max(50, Math.min(250, Number(e.target.value) || 100));
                          setLocalSettings((prev) => ({ ...prev, fontScale: val }));
                          document.documentElement.style.fontSize = `${val}%`;
                        }}
                        className="w-20 px-2 py-1.5 pl-6 text-center rounded-xl border border-teal-400 dark:border-teal-700 bg-white dark:bg-slate-800 text-teal-950 dark:text-teal-100 font-black text-sm"
                      />
                      <span className="absolute left-2 text-xs font-bold text-teal-600 pointer-events-none">٪</span>
                    </div>
                  </div>
                </div>

                {/* پیش‌فرض‌های آماده درصدی */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { val: 85, label: '۸۵٪ (کوچک)' },
                    { val: 100, label: '۱۰۰٪ (پیش‌فرض استاندارد)' },
                    { val: 115, label: '۱۱۵٪ (خوانا)' },
                    { val: 125, label: '۱۲۵٪ (بزرگ)' },
                    { val: 150, label: '۱۵۰٪ (۵۰٪ بزرگتر)' },
                    { val: 175, label: '۱۷۵٪ (خیلی بزرگ)' },
                    { val: 200, label: '۲۰۰٪ (دوبرابر)' },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => {
                        setLocalSettings((prev) => ({ ...prev, fontScale: p.val }));
                        document.documentElement.style.fontSize = `${p.val}%`;
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        (localSettings.fontScale || 100) === p.val
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره کلیه تنظیمات سال تحصیلی و بازه زمانی</span>
              </button>
            </form>
          </div>
          )}

          {/* ۴. دسته یکپارچه تنظیمات ظاهری سایت (آرم و لوگو، فونت‌ها، تصاویر پس‌زمینه و بنر صفحه اول) */}
          {openSettingsSection === 'appearance' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    تنظیمات ظاهری سایت (آرم، فونت‌ها و تصاویر پس‌زمینه)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    تمامی بخش‌های ظاهری سامانه شامل آرم دانشگاه، فونت‌ها، والپیپر صفحات و پس‌زمینه بنر اصلی به‌صورت یکجا در این دسته قرار دارند.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'all' as const, label: 'همه بخش‌های ظاهری' },
                    { id: 'logo' as const, label: 'آرم و لوگو' },
                    { id: 'fonts_bg' as const, label: 'فونت‌ها و پس‌زمینه سایت' },
                    { id: 'hero' as const, label: 'پس‌زمینه بنر صفحه اول' },
                  ] as const
                ).map((tab) => {
                  const active = appearanceSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAppearanceSubTab(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        active
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

          {/* ۴-۱. بخش مدیریت و بارگذاری آرم دانشگاه */}
          {(appearanceSubTab === 'all' || appearanceSubTab === 'logo') && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <ImageIcon className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  بارگذاری و مدیریت آرم (لوگوی) دانشگاه
                </h3>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center min-w-[90px] min-h-[90px]">
                {localSettings.customLogoUrl ? (
                  <FarhangianEmblem size={76} customLogoUrl={localSettings.customLogoUrl} />
                ) : (
                  <div className="text-center text-slate-400 p-2">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                    <span className="text-[10px] block font-bold text-slate-500 dark:text-slate-400">فاقد آرم</span>
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-right space-y-2">
                <div className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {localSettings.customLogoUrl ? 'آرم بارگذاری شده فعال است' : 'هنوز هیچ آرمی بارگذاری نشده است'}
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                  <label className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-600/20 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>{localSettings.customLogoUrl ? 'بارگذاری تصویر آرم جایگزین' : 'بارگذاری فایل آرم دانشگاه'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  {localSettings.customLogoUrl && (
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف آرم</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          )}

          {/* ۴-۲. بخش مدیریت فونت‌های متعدد، انتخاب فونت نمایش و والپیپر اختصاصی */}
          {(appearanceSubTab === 'all' || appearanceSubTab === 'fonts_bg') && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    مدیریت فونت‌های سامانه و تصویر پس‌زمینه
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    امکان افزودن همزمان چند فونت دلخواه، انتخاب فونت فعال کل سامانه و استفاده در ویرایشگر اطلاعیه‌ها
                  </p>
                </div>
              </div>
              <button
                onClick={onOpenAppearance}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                پالت کامل تم و فونت
              </button>
            </div>

            {adminFontFeedback && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
                  adminFontFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                }`}
              >
                {adminFontFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{adminFontFeedback.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* کارت آپلود یک یا چند فونت همزمان */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-indigo-600" />
                  <span>افزودن یک یا چند فونت جدید (TTF / WOFF / WOFF2 / OTF)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  می‌توانید چند فایل فونت را همزمان انتخاب و بارگذاری کنید تا در فهرست فونت‌های سامانه ذخیره شوند و هر زمان خواستید بین آن‌ها انتخاب انجام دهید.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={adminFontName}
                    onChange={(e) => setAdminFontName(e.target.value)}
                    placeholder="نام نمایشی (اختیاری در آپلود تکی، مثلاً ایران‌سنس)"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                  />
                  <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>انتخاب فایل فونت (تکی یا چندتایی)</span>
                    <input
                      type="file"
                      multiple
                      accept=".ttf,.woff,.woff2,.otf"
                      onChange={handleAdminFontUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <label className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adminActivateFontOnUpload}
                    onChange={(e) => setAdminActivateFontOnUpload(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>پس از بارگذاری، بلافاصله به عنوان فونت نمایش کل سایت فعال شود</span>
                </label>
              </div>

              {/* کارت عکس پس‌زمینه */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-teal-600" />
                    <span>آپلود عکس اختصاصی برای پس‌زمینه سایت</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">بارگذاری عکس دلخواه برای پس‌زمینه تمام صفحات وب‌سایت.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>آپلود عکس پس‌زمینه</span>
                    <input type="file" accept="image/*" onChange={handleAdminWallpaperUpload} className="hidden" />
                  </label>
                  {localSettings.customWallpaperUrl && (
                    <button
                      type="button"
                      onClick={handleAdminDeleteWallpaper}
                      className="px-3 py-2 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
                    >
                      حذف پس‌زمینه
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* فهرست انتخاب فونت نمایش کل سامانه (استاندارد + فونت‌های بارگذاری‌شده) */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-teal-600" />
                  <span>انتخاب فونت نمایش سامانه ({STANDARD_FONTS.length + (localSettings.customFonts?.length || 0)} فونت در دسترس)</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  روی هر فونت کلیک کنید تا فونت کل سایت تغییر کند
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {STANDARD_FONTS.map((f) => {
                  const isActive =
                    localSettings.fontFamily === f.id && !localSettings.activeCustomFontId;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleSelectSiteFont(f.id, undefined)}
                      className={`p-3 rounded-2xl border text-right transition flex items-center justify-between gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/40'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {f.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                            پیش‌فرض
                          </span>
                        </div>
                        <p
                          className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate"
                          style={{ fontFamily: f.cssFamily }}
                        >
                          نمونه متن سراهای دانشجویی ۱۲۳
                        </p>
                      </div>
                      {isActive && (
                        <span className="p-1 rounded-full bg-teal-600 text-white shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </button>
                  );
                })}

                {(localSettings.customFonts || []).map((cf) => {
                  const isActive =
                    localSettings.activeCustomFontId === cf.id ||
                    localSettings.fontFamily === cf.fontFamily;
                  return (
                    <div
                      key={cf.id}
                      className={`p-3 rounded-2xl border transition flex items-center justify-between gap-2 ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/40'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectSiteFont(cf.fontFamily, cf.id)}
                        className="flex-1 text-right min-w-0 cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 truncate">
                            {cf.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold shrink-0">
                            سفارشی
                          </span>
                        </div>
                        <p
                          className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate"
                          style={{ fontFamily: cf.fontFamily }}
                        >
                          نمونه متن فونت بارگذاری‌شده ۱۲۳
                        </p>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        {isActive && (
                          <span className="p-1 rounded-full bg-indigo-600 text-white">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteAdminCustomFont(cf.id, cf.fontFamily)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="حذف این فونت"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          )}

          {/* ۴-۳. بخش شخصی‌سازی پس‌زمینه باکس اصلی (بنر معرفی سامانه) صفحه اول */}
          {(appearanceSubTab === 'all' || appearanceSubTab === 'hero') && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    پس‌زمینه بنر اصلی صفحه اول سایت (کادر معرفی سامانه)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    انتخاب بین حالت پیش‌فرض سامانه، رنگ دلخواه یا تصویر اختصاصی برای پس‌زمینه باکس اصلی صفحه اول
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetHeroBg}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بازگشت به حالت پیش‌فرض</span>
              </button>
            </div>

            {heroBgFeedback && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
                  heroBgFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                }`}
              >
                {heroBgFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{heroBgFeedback.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              <div className="space-y-4">
                {/* انتخاب نوع پس‌زمینه */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'default' as const, label: 'پیش‌فرض (گرادیانت)' },
                    { id: 'color' as const, label: 'رنگ دلخواه' },
                    { id: 'image' as const, label: 'تصویر دلخواه' },
                  ].map((opt) => {
                    const active = (localSettings.heroBgMode || 'default') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleHeroBgModeChange(opt.id)}
                        className={`px-3 py-2.5 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                          active
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* تنظیمات رنگ دلخواه */}
                {(localSettings.heroBgMode || 'default') === 'color' && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        انتخاب رنگ پس‌زمینه بنر:
                      </span>
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 cursor-pointer text-xs font-bold">
                        <input
                          type="color"
                          value={localSettings.heroBgColor || '#0f766e'}
                          onChange={(e) => handleHeroBgColorChange(e.target.value)}
                          className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer rounded"
                        />
                        <span dir="ltr" className="text-slate-700 dark:text-slate-200">
                          {localSettings.heroBgColor || '#0f766e'}
                        </span>
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {HERO_PRESET_COLORS.map((c) => {
                        const isSelected = (localSettings.heroBgColor || '').toLowerCase() === c.hex.toLowerCase();
                        return (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => handleHeroBgColorChange(c.hex)}
                            title={c.label}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                              isSelected
                                ? 'border-teal-600 bg-white dark:bg-slate-900 ring-2 ring-teal-500/30'
                                : 'border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800 hover:border-teal-400'
                            }`}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span className="text-slate-700 dark:text-slate-200">{c.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* تنظیمات تصویر دلخواه */}
                {(localSettings.heroBgMode || 'default') === 'image' && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      یک تصویر افقی باکیفیت (PNG / JPG / WebP) انتخاب کنید؛ تصویر به صورت خودکار بهینه‌سازی شده و یک لایه تیره ملایم جهت خوانایی کامل متن سفید روی آن اعمال می‌شود.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{localSettings.heroBgImageUrl ? 'تغییر تصویر پس‌زمینه بنر' : 'بارگذاری تصویر پس‌زمینه بنر'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleHeroBgImageUpload}
                          className="hidden"
                        />
                      </label>
                      {localSettings.heroBgImageUrl && (
                        <button
                          type="button"
                          onClick={handleResetHeroBg}
                          className="px-3 py-2 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold hover:bg-rose-100 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف و بازگشت به پیش‌فرض</span>
                        </button>
                      )}
                    </div>
                    {localSettings.heroBgImageUrl && (
                      <div className="flex items-center gap-3 pt-1">
                        <img
                          src={localSettings.heroBgImageUrl}
                          alt="تصویر فعلی بنر"
                          className="w-24 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                        />
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                          تصویر پس‌زمینه هم‌اکنون در بنر فعال است.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {(localSettings.heroBgMode || 'default') === 'default' && (
                  <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 text-xs text-teal-800 dark:text-teal-200">
                    بنر اصلی صفحه اول در حالت <strong>پیش‌فرض استاندارد سامانه</strong> (طیف رنگی فیروزه‌ای دانشگاه فرهنگیان) قرار دارد. برای تغییر می‌توانید «رنگ دلخواه» یا «تصویر دلخواه» را انتخاب کنید.
                  </div>
                )}
              </div>

              {/* پیش‌نمایش زنده بنر اصلی */}
              {(() => {
                const previewBanner = resolveHeroBannerStyle(localSettings);
                return (
                  <div className="space-y-1.5">
                    <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      پیش‌نمایش زنده بنر صفحه اول:
                    </span>
                    <div
                      className={`relative rounded-2xl overflow-hidden ${previewBanner.bgClassName} text-white p-5 shadow-lg min-h-[155px] flex items-center justify-between`}
                      style={previewBanner.style}
                    >
                      {previewBanner.imageUrl && (
                        <img
                          src={previewBanner.imageUrl}
                          alt="پیش‌نمایش پس‌زمینه بنر اصلی"
                          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
                        />
                      )}
                      {previewBanner.hasImageOverlay && (
                        <div className="absolute inset-0 bg-gradient-to-l from-slate-950/75 via-slate-950/55 to-slate-950/35 pointer-events-none" />
                      )}
                      <div className="relative z-10 space-y-2 max-w-xs">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-bold border border-white/20">
                          {localSettings.universityName}
                        </div>
                        <div className="text-base font-black">سامانه جامع خدمات دانشجویی</div>
                        <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-teal-900 text-[10px] font-extrabold shadow">
                          ورود به سامانه جامع
                        </div>
                      </div>
                      <Building2 className="w-20 h-20 text-white/20 relative z-10 shrink-0" />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          )}
          </div>
          )}

          {/* ۸. بخش ویرایش نکات مهم انتخاب اتاق و اسکان در صفحه اول سایت */}
          {openSettingsSection === 'home_notes' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    ویرایش بخش «نکات مهم انتخاب اتاق و اسکان» صفحه اول سایت
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    مدیر سامانه می‌تواند عنوان بخش، عنوان هر کارت و متن کامل آن (حتی با تغییر فونت، رنگ، اندازه، بُلد و ایتالیک) را ویرایش یا کارت جدید اضافه کند.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetHomeNotes}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بازگردانی متن پیش‌فرض</span>
              </button>
            </div>

            {homeNotesFeedback && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
                  homeNotesFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                }`}
              >
                {homeNotesFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{homeNotesFeedback.message}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                عنوان اصلی بخش در صفحه اول:
              </label>
              <input
                type="text"
                value={draftHomeNotesTitle}
                onChange={(e) => setDraftHomeNotesTitle(e.target.value)}
                placeholder={DEFAULT_HOME_NOTES_TITLE}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-4">
              {draftHomeNotes.map((note, idx) => (
                <div
                  key={note.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-teal-700 dark:text-teal-300">
                      کارت شماره {(idx + 1).toLocaleString('fa-IR')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteHomeNote(note.id)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف کارت</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      عنوان کارت:
                    </label>
                    <input
                      type="text"
                      value={note.title}
                      onChange={(e) => handleUpdateHomeNote(note.id, { title: e.target.value })}
                      placeholder="مثلاً ۱. احراز هویت اولیه:"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      متن کامل کارت:
                    </label>
                    <RichTextEditor
                      valueHtml={note.bodyHtml || plainTextToHtml(note.body)}
                      onChange={(html, plain) =>
                        handleUpdateHomeNote(note.id, { bodyHtml: html, body: plain })
                      }
                      customFonts={localSettings.customFonts}
                      resetKey={`${homeNotesEditorKey}_${note.id}`}
                      minHeightClass="min-h-[95px]"
                      placeholder="متن نکته را بنویسید..."
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleAddHomeNote}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-teal-600" />
                <span>افزودن کارت نکته جدید</span>
              </button>

              <button
                type="button"
                onClick={handleSaveHomeNotes}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره تغییرات نکات صفحه اول</span>
              </button>
            </div>
          </div>
          )}

          {/* ۹. بخش ویرایش کامل محتوا، کارت‌ها و فایل‌های پیوست بخش «درباره ما» */}
          {openSettingsSection === 'about' && (
          <div
            id="admin-about-editor"
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 animate-in fade-in duration-150"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    ویرایش کامل محتوا و فایل‌های بخش «درباره ما»
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    مدیر کل می‌تواند تمام متن‌ها، معرفی طراح، فلسفه شبانه‌روزی، فهرست قابلیت‌ها، بخش تکمیلی و فایل‌های پیوست PDF/تصویر/آیین‌نامه در پنجره «درباره ما» را ویرایش و مدیریت کند.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetAboutContent}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بازگردانی پیش‌فرض (۱۳ نقشه)</span>
              </button>
            </div>

            {aboutFeedback && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
                  aboutFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                }`}
              >
                {aboutFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{aboutFeedback.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان/نشان دانشگاه در سربرگ:
                </label>
                <input
                  type="text"
                  value={draftAbout.universityBadge}
                  onChange={(e) => handleUpdateDraftAbout({ universityBadge: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تیتر اصلی پنجره «درباره ما»:
                </label>
                <input
                  type="text"
                  value={draftAbout.headerTitle}
                  onChange={(e) => handleUpdateDraftAbout({ headerTitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  زیرتیتر توصیفی سربرگ:
                </label>
                <input
                  type="text"
                  value={draftAbout.headerSubtitle}
                  onChange={(e) => handleUpdateDraftAbout({ headerSubtitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            {/* معرفی طراح و معمار */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="text-xs font-extrabold text-teal-700 dark:text-teal-300">
                اطلاعات طراح و پشتیبانی علمی/فنی
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    عنوان سمت:
                  </label>
                  <input
                    type="text"
                    value={draftAbout.designerBadge}
                    onChange={(e) => handleUpdateDraftAbout({ designerBadge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    نام کامل:
                  </label>
                  <input
                    type="text"
                    value={draftAbout.designerName}
                    onChange={(e) => handleUpdateDraftAbout({ designerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    ایمیل رسمی تماس:
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={draftAbout.designerEmail}
                    onChange={(e) => handleUpdateDraftAbout({ designerEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-left"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  متن معرفی طراح و هدف طراحی سامانه:
                </label>
                <RichTextEditor
                  valueHtml={draftAbout.designerBioHtml || plainTextToHtml(draftAbout.designerBio)}
                  onChange={(html, plain) =>
                    handleUpdateDraftAbout({ designerBioHtml: html, designerBio: plain })
                  }
                  customFonts={localSettings.customFonts}
                  resetKey={`about_designer_${aboutEditorResetKey}`}
                  minHeightClass="min-h-[85px]"
                />
              </div>
            </div>

            {/* باکس سند PDF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/40">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان کارت دانلود سند PDF سامانه:
                </label>
                <input
                  type="text"
                  value={draftAbout.pdfCardTitle}
                  onChange={(e) => handleUpdateDraftAbout({ pdfCardTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات زیرعنوان کارت PDF:
                </label>
                <input
                  type="text"
                  value={draftAbout.pdfCardDescription}
                  onChange={(e) => handleUpdateDraftAbout({ pdfCardDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            {/* ماهیت شبانه‌روزی دانشگاه فرهنگیان */}
            <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان بخش ماهیت شبانه‌روزی و رسالت تربیت معلم:
                </label>
                <input
                  type="text"
                  value={draftAbout.boardingSectionTitle}
                  onChange={(e) => handleUpdateDraftAbout({ boardingSectionTitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  متن کامل بخش (با قابلیت ویرایش پیشرفته):
                </label>
                <RichTextEditor
                  valueHtml={draftAbout.boardingSectionHtml}
                  onChange={(html, plain) =>
                    handleUpdateDraftAbout({
                      boardingSectionHtml: html,
                      boardingSectionText: plain,
                    })
                  }
                  customFonts={localSettings.customFonts}
                  resetKey={`about_boarding_${aboutEditorResetKey}`}
                  minHeightClass="min-h-[120px]"
                />
              </div>
            </div>

            {/* فهرست قابلیت‌ها و نقش‌ها */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex-1 min-w-[220px]">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان بخش فهرست امکانات و ۱۳ نقش سامانه:
                  </label>
                  <input
                    type="text"
                    value={draftAbout.capabilitiesSectionTitle}
                    onChange={(e) =>
                      handleUpdateDraftAbout({ capabilitiesSectionTitle: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddAboutCapability}
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer mt-4"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن مورد جدید</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {draftAbout.capabilities.map((cap, idx) => (
                  <div
                    key={cap.id}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold text-teal-700 dark:text-teal-300">
                        بند شماره {(idx + 1).toLocaleString('fa-IR')}
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(cap.highlight)}
                            onChange={(e) =>
                              handleUpdateAboutCapability(cap.id, { highlight: e.target.checked })
                            }
                            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span>نمایش ویژه (تمام‌عرض متمایز)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleDeleteAboutCapability(cap.id)}
                          className="text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={cap.text}
                      onChange={(e) =>
                        handleUpdateAboutCapability(cap.id, { text: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* بخش توضیحات تکمیلی دلخواه مدیر */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان بخش توضیحات تکمیلی / آیین‌نامه‌ها (در صورت خالی بودن متن نمایش داده نمی‌شود):
                </label>
                <input
                  type="text"
                  value={draftAbout.extraSectionTitle}
                  onChange={(e) => handleUpdateDraftAbout({ extraSectionTitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <RichTextEditor
                valueHtml={draftAbout.extraSectionHtml || ''}
                onChange={(html, plain) =>
                  handleUpdateDraftAbout({ extraSectionHtml: html, extraSectionText: plain })
                }
                customFonts={localSettings.customFonts}
                resetKey={`about_extra_${aboutEditorResetKey}`}
                minHeightClass="min-h-[90px]"
                placeholder="در صورت نیاز متن، آیین‌نامه یا پیام تکمیلی مدیر را اینجا وارد نمایید..."
              />
            </div>

            {/* مدیریت فایل‌های پیوست بخش درباره ما */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-[220px]">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان بخش فایل‌ها و مستندات پیوست‌شده:
                  </label>
                  <input
                    type="text"
                    value={draftAbout.attachmentsTitle}
                    onChange={(e) => handleUpdateDraftAbout({ attachmentsTitle: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
                <label className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm mt-4">
                  <Paperclip className="w-4 h-4" />
                  <span>افزودن فایل (PDF، تصویر، Word، Excel)</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.webp"
                    onChange={handleUploadAboutAttachment}
                    className="hidden"
                  />
                </label>
              </div>

              {draftAbout.attachments.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
                  هنوز فایلی برای نمایش و دانلود در بخش «درباره ما» پیوست نشده است.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {draftAbout.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center gap-3"
                    >
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={att.title}
                          onChange={(e) =>
                            handleUpdateAboutAttachment(att.id, { title: e.target.value })
                          }
                          placeholder="عنوان نمایشی فایل..."
                          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                        />
                        <input
                          type="text"
                          value={att.description || ''}
                          onChange={(e) =>
                            handleUpdateAboutAttachment(att.id, { description: e.target.value })
                          }
                          placeholder="توضیح کوتاه فایل (اختیاری)..."
                          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 text-[11px] text-slate-500">
                        <span className="max-w-[160px] truncate" dir="ltr">
                          {att.fileName}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAboutAttachment(att.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 hover:bg-rose-100 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                متن پاورقی (Footer) پنجره «درباره ما»:
              </label>
              <input
                type="text"
                value={draftAbout.footerNote}
                onChange={(e) => handleUpdateDraftAbout({ footerNote: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSaveAboutContent}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره تغییرات بخش «درباره ما»</span>
              </button>
            </div>
          </div>
          )}

          {/* ۱۰. بخش پشتیبان‌گیری و بازنشانی */}
          {openSettingsSection === 'backup' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 animate-in fade-in duration-150">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <span>پشتیبان‌گیری و بازگردانی کامل سامانه (Backup & Restore)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                با استفاده از گزینه «فایل پشتیبان کامل»، علاوه بر تمامی اطلاعات ۴۵ بخش پایگاه داده، همه فایل‌های ضمیمه، فونت‌ها، تصاویر اطلاعیه‌ها/تنظیمات و تمام عکس‌های ابری دانشجویان و کارکنان در یک فایل یکپارچه ذخیره می‌شوند؛ به‌طوری که حتی اگر سرور و دیتابیس کاملاً ریست یا پاک شده باشد، با بارگذاری مجدد این فایل تمام سایت دقیقاً به همین وضعیت برمی‌گردد.
              </p>
            </div>

            {backupProgressMessage && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>{backupProgressMessage}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleFullBackupExport}
                disabled={isFullBackupExporting || isBackupRestoring}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
              >
                {isFullBackupExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                <span>دانلود فایل پشتیبان کامل (تمام فایل‌ها، عکس‌ها و اطلاعات)</span>
              </button>

              <button
                type="button"
                onClick={handleBackupExport}
                disabled={isFullBackupExporting || isBackupRestoring}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>دانلود پشتیبان سریع داده‌ها (JSON)</span>
              </button>

              <label
                className={`px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isFullBackupExporting || isBackupRestoring ? 'opacity-60 pointer-events-none' : 'cursor-pointer'
                }`}
              >
                {isBackupRestoring ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>بازیابی نسخه پشتیبان (کامل / JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleBackupImport}
                  disabled={isFullBackupExporting || isBackupRestoring}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleResetDefaults}
                disabled={isFullBackupExporting || isBackupRestoring}
                className="px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer mr-auto"
              >
                <RotateCcw className="w-4 h-4" />
                <span>بازنشانی به تنظیمات پیش‌فرض دانشگاه</span>
              </button>
            </div>
          </div>
          )}

        </div>
      )}

        </div>
      </div>

      {/* مدال افزودن یا ویرایش کامل همه اطلاعات دانشجو توسط مدیر */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                <span>
                  {editingStudent
                    ? `ویرایش کامل همه اطلاعات دانشجومعلم (${editingStudent.fullName})`
                    : 'ثبت و افزودن دانشجومعلم جدید (پرونده کامل)'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddStudentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {stFormError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{stFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStudentSubmit} className="space-y-4 text-xs">
              {/* بخش ۱: مشخصات هویتی و آموزشی */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="font-extrabold text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" />
                  <span>مشخصات هویتی، آموزشی و ورود به سامانه</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      نام و نام خانوادگی *
                    </label>
                    <input
                      type="text"
                      value={stFormFullName}
                      onChange={(e) => setStFormFullName(e.target.value)}
                      placeholder="مثلاً علی رضایی"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      شماره دانشجویی *
                    </label>
                    <input
                      type="text"
                      value={stFormStudentId}
                      onChange={(e) => setStFormStudentId(e.target.value)}
                      placeholder="مثلاً 4021008"
                      dir="ltr"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      کد ملی / رمز ورود *
                    </label>
                    <input
                      type="text"
                      value={stFormNationalId}
                      onChange={(e) => setStFormNationalId(e.target.value)}
                      placeholder="مثلاً 1270001234"
                      dir="ltr"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      رشته تحصیلی *
                    </label>
                    {activeApprovedMajorsList.length > 0 ? (
                      (() => {
                        const exactMatched = findExactApprovedMajorForStudent(
                          { fieldOfStudy: stFormField, majorCode: stFormMajorCode },
                          activeApprovedMajorsList
                        );
                        const closest = !exactMatched && stFormField.trim()
                          ? findClosestApprovedMajor(stFormField, activeApprovedMajorsList, stFormMajorCode)
                          : null;
                        return (
                          <div className="space-y-1.5">
                            <select
                              value={exactMatched ? exactMatched.id : ''}
                              onChange={(e) => {
                                const picked = activeApprovedMajorsList.find((m) => m.id === e.target.value);
                                if (picked) {
                                  setStFormField(picked.name);
                                  setStFormMajorCode(normalizeMajorCode(picked.code));
                                  setStFormDegreeLevel(picked.degreeLevelName || '');
                                }
                              }}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                              required
                            >
                              <option value="">-- انتخاب رشته تحصیلی مصوب --</option>
                              {activeApprovedMajorsList.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {formatApprovedMajorLabel(m)}
                                </option>
                              ))}
                            </select>
                            {exactMatched ? (
                              <div className="text-[10px] text-teal-700 dark:text-teal-300 font-bold flex items-center gap-2">
                                <span>کد رشته: {exactMatched.code}</span>
                                <span>•</span>
                                <span>مقطع: {exactMatched.degreeLevelName}</span>
                              </div>
                            ) : stFormField.trim() ? (
                              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[10px] text-amber-800 dark:text-amber-200 space-y-1">
                                <div>
                                  رشته قبلی ثبت‌شده: <span className="font-bold">{stFormField}</span> (ناهمگون با لیست مصوب)
                                </div>
                                {closest && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStFormField(closest.major.name);
                                      setStFormMajorCode(normalizeMajorCode(closest.major.code));
                                      setStFormDegreeLevel(closest.major.degreeLevelName || '');
                                    }}
                                    className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                                  >
                                    انتخاب نزدیک‌ترین رشته ({closest.major.name} - {closest.score}٪)
                                  </button>
                                )}
                              </div>
                            ) : null}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={stFormField}
                          onChange={(e) => setStFormField(e.target.value)}
                          placeholder="آموزش ابتدایی، آموزش ریاضی و..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddStudentModalOpen(false);
                            setMainTab('settings');
                            setOpenSettingsSection('academic_majors');
                          }}
                          className="text-[10px] font-bold text-teal-600 hover:underline cursor-pointer"
                        >
                          تعریف رشته‌های مصوب در تنظیمات کل سامانه →
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      دوره / سال ورودی *
                    </label>
                    <input
                      type="text"
                      value={stFormEntryTerm}
                      onChange={(e) => setStFormEntryTerm(e.target.value)}
                      placeholder="مثلاً ۴۰۲۱ یا ۱۴۰۲"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      نام پدر
                    </label>
                    <input
                      type="text"
                      value={stFormFatherName}
                      onChange={(e) => setStFormFatherName(e.target.value)}
                      placeholder="نام پدر"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      تاریخ تولد
                    </label>
                    <PersianDatePicker
                      value={stFormBirthDate}
                      onChange={setStFormBirthDate}
                      placeholder="1382/01/01"
                      digits="en"
                      defaultYear={1382}
                      dir="ltr"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      دین و مذهب
                    </label>
                    <input
                      type="text"
                      value={stFormReligion}
                      onChange={(e) => setStFormReligion(e.target.value)}
                      placeholder="اسلام / شیعه"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* بخش ۲: اطلاعات تماس و نشانی محل سکونت */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="font-extrabold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  <span>شماره‌های تماس و نشانی محل سکونت</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      شماره همراه دانشجو
                    </label>
                    <input
                      type="text"
                      value={stFormMobile}
                      onChange={(e) => setStFormMobile(e.target.value)}
                      placeholder="09130000000"
                      dir="ltr"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      تلفن ثابت منزل
                    </label>
                    <input
                      type="text"
                      value={stFormPhone}
                      onChange={(e) => setStFormPhone(e.target.value)}
                      placeholder="03130000000"
                      dir="ltr"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      تلفن تماس اضطراری
                    </label>
                    <input
                      type="text"
                      value={stFormEmergency}
                      onChange={(e) => setStFormEmergency(e.target.value)}
                      placeholder="09130000000"
                      dir="ltr"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      شماره تماس والدین / ولی
                    </label>
                    <input
                      type="text"
                      value={stFormParentPhone}
                      onChange={(e) => setStFormParentPhone(e.target.value)}
                      placeholder="09130000000"
                      dir="ltr"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      استان محل سکونت
                    </label>
                    <input
                      type="text"
                      value={stFormProvince}
                      onChange={(e) => setStFormProvince(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      شهر محل سکونت
                    </label>
                    <input
                      type="text"
                      value={stFormCity}
                      onChange={(e) => setStFormCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      نشانی دقیق پستی / محل سکونت
                    </label>
                    <input
                      type="text"
                      value={stFormPostalAddress}
                      onChange={(e) => setStFormPostalAddress(e.target.value)}
                      placeholder="استان، شهر، خیابان، کوچه، پلاک..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* بخش ۳: سوابق اسکان سال قبل و وضعیت اسکان فعلی */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-extrabold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    <span>سوابق اسکان سال قبل، امتیاز و وضعیت اتاق فعلی</span>
                  </div>
                  {editingStudent && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddStudentModalOpen(false);
                        handleOpenAssignStudentModal(editingStudent);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold hover:bg-indigo-100 cursor-pointer"
                    >
                      <BedIcon className="w-3.5 h-3.5" />
                      <span>تخصیص / تغییر اتاق و تخت</span>
                    </button>
                  )}
                </div>

                {/* برچسب وضعیت پذیرش دانشجو: پذیرش شده یا پذیرش نشده */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <label className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">
                      وضعیت پذیرش دانشجو (پذیرش شده / پذیرش نشده) *
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      دانشجویان جدیدالورود تا تکمیل اطلاعات «پذیرش نشده» و دانشجویان دارای خوابگاه پیش‌فرض «پذیرش شده» هستند
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStFormAdmissionStatus('admitted')}
                      className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex items-center gap-2.5 ${
                        stFormAdmissionStatus === 'admitted'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500/40'
                          : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          stFormAdmissionStatus === 'admitted'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs">پذیرش شده</div>
                        <div className="text-[10px] opacity-75">ورود و تکمیل اطلاعات یا دارای خوابگاه</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStFormAdmissionStatus('not_admitted')}
                      className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex items-center gap-2.5 ${
                        stFormAdmissionStatus === 'not_admitted'
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-100 ring-1 ring-rose-500/40'
                          : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-300'
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          stFormAdmissionStatus === 'not_admitted'
                            ? 'bg-rose-600 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs">پذیرش نشده</div>
                        <div className="text-[10px] opacity-75">جدیدالورود در انتظار ورود اول و تکمیل پرونده</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* برچسب نوع سکونت دانشجو: خوابگاهی یا ترددی */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <label className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">
                      برچسب نوع سکونت دانشجو (خوابگاهی / ترددی) *
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      دانشجوی دارای اتاق به‌صورت پیش‌فرض «خوابگاهی» است
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStFormResidenceType('dormitory')}
                      className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex items-center gap-2.5 ${
                        stFormResidenceType === 'dormitory'
                          ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-900 dark:text-teal-100 ring-1 ring-teal-500/40'
                          : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-300'
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          stFormResidenceType === 'dormitory'
                            ? 'bg-teal-600 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Home className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs">دانشجوی خوابگاهی</div>
                        <div className="text-[10px] opacity-75">ساکن سرا یا متقاضی اسکان خوابگاهی</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStFormResidenceType('commuter')}
                      className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex items-center gap-2.5 ${
                        stFormResidenceType === 'commuter'
                          ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-900 dark:text-amber-100 ring-1 ring-amber-500/40'
                          : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-300'
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          stFormResidenceType === 'commuter'
                            ? 'bg-amber-600 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Bus className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs">دانشجوی ترددی</div>
                        <div className="text-[10px] opacity-75">غیرخوابگاهی / تردد روزانه</div>
                      </div>
                    </button>
                  </div>

                  {/* علت و توضیحات ترددی / درخواست خوابگاه */}
                  {stFormResidenceType === 'commuter' ? (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                        شرایط و علل قانونی ترددی بودن:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {COMMUTER_ELIGIBILITY_OPTIONS.map((opt) => {
                          const checked = stFormCommuterReasons.includes(opt.value);
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                setStFormCommuterReasons((prev) =>
                                  prev.includes(opt.value)
                                    ? prev.filter((r) => r !== opt.value)
                                    : [...prev, opt.value]
                                )
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                checked
                                  ? 'bg-amber-600 text-white border-amber-600'
                                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {checked ? '✓ ' : '+ '}
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                      <input
                        type="text"
                        value={stFormCommuterNotes}
                        onChange={(e) => setStFormCommuterNotes(e.target.value)}
                        placeholder="توضیحات عدم نیاز به خوابگاه / ترددی بودن..."
                        className="w-full px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-slate-800 text-xs"
                      />
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <input
                        type="text"
                        value={stFormDormNotes}
                        onChange={(e) => setStFormDormNotes(e.target.value)}
                        placeholder="توضیحات تکمیلی درخواست خوابگاه (اختیاری)..."
                        className="w-full px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/30 dark:bg-slate-800 text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* وضعیت خانواده، تأهل، شغل والدین و وضعیت زندگی */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="font-extrabold text-indigo-700 dark:text-indigo-300 text-xs">
                    وضعیت تأهل، خانواده، شغل والدین و شرایط زندگی
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                        وضعیت تأهل
                      </label>
                      <select
                        value={stFormMaritalStatus}
                        onChange={(e) => setStFormMaritalStatus(e.target.value as 'single' | 'married')}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="single">مجرد</option>
                        <option value="married">متأهل</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                        تعداد اعضای خانواده
                      </label>
                      <input
                        type="text"
                        value={stFormFamilyMembers}
                        onChange={(e) => setStFormFamilyMembers(e.target.value)}
                        placeholder="مثلاً ۴ نفر"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                        وضعیت مسکن
                      </label>
                      <select
                        value={stFormHousingStatus}
                        onChange={(e) =>
                          setStFormHousingStatus(e.target.value as NonNullable<Student['housingStatus']>)
                        }
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        {Object.entries(HOUSING_STATUS_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                        وضعیت معیشتی
                      </label>
                      <select
                        value={stFormEconomicStatus}
                        onChange={(e) =>
                          setStFormEconomicStatus(e.target.value as NonNullable<Student['economicStatus']>)
                        }
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        {Object.entries(ECONOMIC_STATUS_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                      <label className="flex items-center gap-2 text-[11px] font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stFormFatherAlive}
                          onChange={(e) => {
                            setStFormFatherAlive(e.target.checked);
                            if (!e.target.checked) setStFormFatherOcc('');
                          }}
                          className="rounded text-teal-600"
                        />
                        <span>پدر در قید حیات است</span>
                      </label>
                      {stFormFatherAlive && (
                        <input
                          type="text"
                          value={stFormFatherOcc}
                          onChange={(e) => setStFormFatherOcc(e.target.value)}
                          placeholder="شغل پدر (مثلاً فرهنگی، آزاد، کارمند...)"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        />
                      )}
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                      <label className="flex items-center gap-2 text-[11px] font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stFormMotherAlive}
                          onChange={(e) => {
                            setStFormMotherAlive(e.target.checked);
                            if (!e.target.checked) setStFormMotherOcc('');
                          }}
                          className="rounded text-teal-600"
                        />
                        <span>مادر در قید حیات است</span>
                      </label>
                      {stFormMotherAlive && (
                        <input
                          type="text"
                          value={stFormMotherOcc}
                          onChange={(e) => setStFormMotherOcc(e.target.value)}
                          placeholder="شغل مادر (مثلاً خانه‌دار، فرهنگی، کارمند...)"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 text-[11px] font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stFormHeadOfHousehold}
                        onChange={(e) => setStFormHeadOfHousehold(e.target.checked)}
                        className="rounded text-teal-600"
                      />
                      <span>سرپرست خانوار</span>
                    </label>
                    <input
                      type="text"
                      value={stFormLivingNotes}
                      onChange={(e) => setStFormLivingNotes(e.target.value)}
                      placeholder="توضیحات تکمیلی وضعیت زندگی..."
                      className="flex-1 min-w-[200px] px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      سرای سال قبل
                    </label>
                    <input
                      type="text"
                      value={stFormPreviousDorm}
                      onChange={(e) => setStFormPreviousDorm(e.target.value)}
                      placeholder="مثلاً سرای شهید باهنر یا نداشت"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      اتاق سال قبل
                    </label>
                    <input
                      type="text"
                      value={stFormPreviousRoom}
                      onChange={(e) => setStFormPreviousRoom(e.target.value)}
                      placeholder="مثلاً ۱۰۲"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      نمره ارزیابی / امتیاز سال قبل
                    </label>
                    <input
                      type="text"
                      value={stFormPreviousScore}
                      onChange={(e) => setStFormPreviousScore(e.target.value)}
                      placeholder="100"
                      dir="ltr"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>

                {editingStudent && editingStudent.assignedBedId && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      تخت فعلی:{' '}
                      <span className="text-teal-700 dark:text-teal-300">
                        {dorms.find((d) => d.id === editingStudent.assignedDormId)?.name || editingStudent.assignedDormName || 'سرا'}{' '}
                        - اتاق {rooms.find((r) => r.id === editingStudent.assignedRoomId)?.roomNumber || editingStudent.assignedRoomNumber || '-'}{' '}
                        ({beds.find((b) => b.id === editingStudent.assignedBedId)?.label || 'تخت تخصیص‌یافته'})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500">وضعیت اسکان:</span>
                      <select
                        value={stFormAssignmentStatus}
                        onChange={(e) =>
                          setStFormAssignmentStatus(e.target.value as 'none' | 'temporary' | 'confirmed')
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-[11px] font-bold"
                      >
                        <option value="confirmed">اسکان قطعی (تأیید شده)</option>
                        <option value="temporary">اسکان موقت (در انتظار تأیید)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* بخش ۴: پرونده سلامت و فیلدهای سفارشی (رشته ورزشی، علایق و...) */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="font-extrabold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  <span>پرونده سلامت و مشخصات تکمیلی / سفارشی (محرمانه در کارتابل مدیریت)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      گروه خونی
                    </label>
                    <select
                      value={stFormBloodGroup}
                      onChange={(e) => setStFormBloodGroup(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="O+">O+ (اُ مثبت)</option>
                      <option value="O-">O- (اُ منفی)</option>
                      <option value="A+">A+ (آ مثبت)</option>
                      <option value="A-">A- (آ منفی)</option>
                      <option value="B+">B+ (ب مثبت)</option>
                      <option value="B-">B- (ب منفی)</option>
                      <option value="AB+">AB+ (آ ب مثبت)</option>
                      <option value="AB-">AB- (آ ب منفی)</option>
                      <option value="ثبت نشده">نامشخص / ثبت نشده</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      وضعیت سلامت جسمی
                    </label>
                    <select
                      value={stFormPhysicalStatus}
                      onChange={(e) =>
                        setStFormPhysicalStatus(
                          e.target.value as NonNullable<Student['physicalHealthStatus']>
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      {Object.entries(PHYSICAL_HEALTH_STATUS_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      بیماری خاص / توضیحات پزشکی
                    </label>
                    <input
                      type="text"
                      value={stFormSpecialCondition}
                      onChange={(e) => setStFormSpecialCondition(e.target.value)}
                      placeholder="مثلاً ندارد / حساسیت فصلی / آسم خفیف..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      وضعیت سلامت روان (محرمانه)
                    </label>
                    <select
                      value={stFormMentalStatus}
                      onChange={(e) =>
                        setStFormMentalStatus(
                          e.target.value as NonNullable<Student['mentalHealthStatus']>
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      {Object.entries(MENTAL_HEALTH_STATUS_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* موارد جسمی، حساسیت، دارو و نیاز مشاوره‌ای */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={stFormAllergies}
                    onChange={(e) => setStFormAllergies(e.target.value)}
                    placeholder="حساسیت‌های غذایی یا دارویی..."
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <input
                    type="text"
                    value={stFormMedications}
                    onChange={(e) => setStFormMedications(e.target.value)}
                    placeholder="داروهای مصرفی مستمر..."
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {PHYSICAL_CONDITION_OPTIONS.map((opt) => {
                    const active = stFormPhysicalConditions.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setStFormPhysicalConditions((prev) =>
                            prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
                          )
                        }
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                          active
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {opt}
                      </button>
                    );
                  })}
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/50 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-200">
                      محورهای سلامت روان و مشاوره:
                    </span>
                    <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-800 dark:text-indigo-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stFormWantsCounseling}
                        onChange={(e) => setStFormWantsCounseling(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <span>متقاضی ارتباط با مرکز مشاوره</span>
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {MENTAL_HEALTH_TOPIC_OPTIONS.map((opt) => {
                      const active = stFormMentalTopics.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setStFormMentalTopics((prev) =>
                              prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
                            )
                          }
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                            active
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {active ? '✓ ' : '+ '}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={stFormMentalNotes}
                    onChange={(e) => setStFormMentalNotes(e.target.value)}
                    placeholder="توضیحات محرمانه سلامت روان و مشاوره..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                {/* توانمندی‌ها و علایق جداگانه (هنری، فرهنگی، ورزشی، علمی و فنی) */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="font-extrabold text-fuchsia-700 dark:text-fuchsia-300 text-xs">
                    توانمندی‌ها و علایق جداگانه دانشجو (قابل گزارش‌گیری)
                  </div>
                  {[
                    {
                      title: 'رشته‌های هنری',
                      opts: ARTISTIC_SKILL_OPTIONS,
                      vals: stFormArtistic,
                      setVals: setStFormArtistic,
                      other: stFormArtisticOther,
                      setOther: setStFormArtisticOther,
                      activeCls: 'bg-pink-600 text-white border-pink-600',
                    },
                    {
                      title: 'فعالیت‌های فرهنگی و قرآنی',
                      opts: CULTURAL_ACTIVITY_OPTIONS,
                      vals: stFormCultural,
                      setVals: setStFormCultural,
                      other: stFormCulturalOther,
                      setOther: setStFormCulturalOther,
                      activeCls: 'bg-violet-600 text-white border-violet-600',
                    },
                    {
                      title: 'رشته‌ها و فعالیت‌های ورزشی',
                      opts: SPORTS_ACTIVITY_OPTIONS,
                      vals: stFormSports,
                      setVals: setStFormSports,
                      other: stFormSportsOther,
                      setOther: setStFormSportsOther,
                      activeCls: 'bg-emerald-600 text-white border-emerald-600',
                    },
                    {
                      title: 'مهارت‌های علمی، فنی و دیجیتال',
                      opts: TECHNICAL_SKILL_OPTIONS,
                      vals: stFormTechnical,
                      setVals: setStFormTechnical,
                      other: stFormTechnicalOther,
                      setOther: setStFormTechnicalOther,
                      activeCls: 'bg-sky-600 text-white border-sky-600',
                    },
                  ].map((group) => (
                    <div key={group.title} className="space-y-1">
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {group.title}:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {group.opts.map((opt) => {
                          const active = group.vals.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                group.setVals((prev) =>
                                  prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
                                )
                              }
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                                active
                                  ? group.activeCls
                                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {active ? '✓ ' : '+ '}
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      <input
                        type="text"
                        value={group.other}
                        onChange={(e) => group.setOther(e.target.value)}
                        placeholder={`سایر موارد ${group.title}...`}
                        className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-[11px]"
                      />
                    </div>
                  ))}
                </div>

                {/* فیلدهای سفارشی موجود */}
                {Object.keys(stFormCustomFields).length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-bold text-slate-500">
                      فیلدهای سفارشی ثبت‌شده (رشته ورزشی، علایق فرهنگی و...):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(stFormCustomFields).map(([key, val]) => (
                        <div
                          key={key}
                          className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        >
                          <span className="font-bold text-teal-700 dark:text-teal-300 shrink-0 text-[11px]">
                            {key}:
                          </span>
                          <input
                            type="text"
                            value={val}
                            onChange={(e) =>
                              setStFormCustomFields((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setStFormCustomFields((prev) => {
                                const next = { ...prev };
                                delete next[key];
                                return next;
                              })
                            }
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer shrink-0"
                            title="حذف فیلد سفارشی"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* افزودن فیلد سفارشی جدید */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="text"
                    value={stFormNewCustomKey}
                    onChange={(e) => setStFormNewCustomKey(e.target.value)}
                    placeholder="عنوان فیلد جدید (مثلاً رشته ورزشی، علایق فرهنگی...)"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <input
                    type="text"
                    value={stFormNewCustomVal}
                    onChange={(e) => setStFormNewCustomVal(e.target.value)}
                    placeholder="مقدار (مثلاً والیبال، مطالعه...)"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddStudentCustomField}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center justify-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن فیلد</span>
                  </button>
                </div>
              </div>

              {/* تصویر پرسنلی دانشجو (قابل تغییر یا حذف توسط مدیر) */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {stFormPhotoUrl ? (
                    <img
                      src={stFormPhotoUrl}
                      alt="تصویر دانشجو"
                      className="w-12 h-12 rounded-xl object-cover border border-teal-500"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-teal-600/15 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                      <Camera className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      عکس پرسنلی دانشجو
                    </div>
                    <div className="text-[11px] text-slate-400">
                      مدیر در هر زمان امکان بارگذاری یا تغییر عکس دانشجو را دارد.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{stFormPhotoUrl ? 'تغییر عکس' : 'آپلود عکس'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAdminStudentPhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {stFormPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setStFormPhotoUrl('')}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 font-bold cursor-pointer"
                    >
                      حذف عکس
                    </button>
                  )}
                </div>
              </div>

              {/* وضعیت تکمیل پرونده */}
              <div>
                <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={stFormProfileCompleted}
                    onChange={(e) => setStFormProfileCompleted(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 cursor-pointer"
                  />
                  <span>پرونده دانشجو در وضعیت «تکمیل شده» باشد (در صورت برداشتن تیک، دانشجو در ورود بعدی ملزم به تکمیل اولیه خواهد بود)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingStudent ? 'ذخیره کلیه تغییرات' : 'ثبت دانشجو در سیستم'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال مشاهده و پرینت کارت خوابگاه توسط مدیر */}
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

      {/* مدال مشاهده و پرینت کارت تغذیه موقت یک‌ماهه سلف (استثناء کالینان) */}
      {diningCardStudent && (
        <DiningMealCardModal
          isOpen={!!diningCardStudent}
          onClose={() => setDiningCardStudent(null)}
          student={diningCardStudent}
          dorm={dorms.find((d) => d.id === diningCardStudent.assignedDormId)}
          room={rooms.find((r) => r.id === diningCardStudent.assignedRoomId)}
          bed={beds.find((b) => b.id === diningCardStudent.assignedBedId)}
          settings={settings}
        />
      )}

      {/* لایت‌باکس بزرگ‌نمایی و نمایش در ابعاد واقعی تصویر اطلاعیه برای مدیر */}
      <ImageLightboxModal
        src={annPreviewImage}
        alt="پوستر / تصویر اطلاعیه"
        onClose={() => setAnnPreviewImage(null)}
      />

      {/* مدال تعیین یا جابجایی اتاق و تخت دانشجو توسط مدیر */}
      {assigningStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <BedIcon className="w-5 h-5 text-teal-600" />
                <span>
                  {assigningStudent.assignedBedId && assigningStudent.assignmentStatus !== 'none'
                    ? 'تعیین و جابجایی اتاق و تخت دانشجو'
                    : 'تعیین اتاق و تخت دانشجوی فاقد اسکان'}
                </span>
              </h3>
              <button
                onClick={() => setAssigningStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* کارت مشخصات دانشجو */}
            <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 text-xs space-y-1">
              <div className="font-extrabold text-sm text-teal-950 dark:text-teal-100">
                {assigningStudent.fullName}
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                شماره دانشجویی: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{assigningStudent.studentId}</span> • رشته: {assigningStudent.fieldOfStudy} (ورودی {assigningStudent.entryTerm})
              </div>
              <div className="text-[11px] text-teal-700 dark:text-teal-300 font-semibold">
                {(() => {
                  const curDorm = dorms.find((d) => d.id === assigningStudent.assignedDormId);
                  const curRoom = rooms.find((r) => r.id === assigningStudent.assignedRoomId);
                  const curBed = beds.find((b) => b.id === assigningStudent.assignedBedId);
                  if (curDorm && curRoom && curBed && assigningStudent.assignmentStatus !== 'none') {
                    return `اسکان فعلی (آماده جابجایی): ${curDorm.name} • اتاق ${curRoom.roomNumber} • ${curBed.label}`;
                  }
                  return 'وضعیت فعلی: فاقد اتاق و اسکان (آماده تعیین اتاق)';
                })()}
              </div>
            </div>

            {assignFeedback && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200">
                {assignFeedback}
              </div>
            )}

            <form onSubmit={handleConfirmStudentBedAssignment} className="space-y-4 text-xs">
              {/* انتخاب خوابگاه */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  انتخاب سرای دانشجویی:
                </label>
                <select
                  value={assignTargetDormId}
                  onChange={(e) => {
                    const newDormId = e.target.value;
                    setAssignTargetDormId(newDormId);
                    const dormRooms = rooms.filter((r) => r.dormId === newDormId);
                    const firstRoomWithVacancy =
                      dormRooms.find((r) => beds.some((b) => b.roomId === r.id && !b.studentId)) ||
                      dormRooms[0];
                    const firstRoom = firstRoomWithVacancy?.id || '';
                    setAssignTargetRoomId(firstRoom);
                    const availableBeds = beds.filter((b) => b.roomId === firstRoom && !b.studentId);
                    setAssignTargetBedId(availableBeds[0]?.id || '');
                    setAssignFeedback(null);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  {dorms.map((d) => {
                    const dormVacant = beds.filter((b) => b.dormId === d.id && !b.studentId).length;
                    return (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.campus}) — {dormVacant} تخت خالی
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* انتخاب اتاق */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  انتخاب اتاق:
                </label>
                <select
                  value={assignTargetRoomId}
                  onChange={(e) => {
                    const newRoomId = e.target.value;
                    setAssignTargetRoomId(newRoomId);
                    const availableBeds = beds.filter((b) => b.roomId === newRoomId && !b.studentId);
                    setAssignTargetBedId(availableBeds[0]?.id || '');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  {rooms
                    .filter((r) => r.dormId === assignTargetDormId)
                    .map((r) => {
                      const roomBeds = beds.filter((b) => b.roomId === r.id);
                      const vacantCount = roomBeds.filter((b) => !b.studentId).length;
                      return (
                        <option key={r.id} value={r.id}>
                          اتاق {r.roomNumber} (طبقه {r.floor === 0 ? 'همکف' : r.floor}) - {vacantCount} تخت خالی
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* انتخاب تخت خالی در این اتاق */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  انتخاب تخت خالی مورد نظر:
                </label>
                {(() => {
                  const availableBeds = beds.filter((b) => b.roomId === assignTargetRoomId && !b.studentId);
                  if (availableBeds.length === 0) {
                    return (
                      <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-center font-bold">
                        متأسفانه هیچ تخت خالی در این اتاق وجود ندارد. لطفاً اتاق دیگری را انتخاب فرمایید.
                      </div>
                    );
                  }
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {availableBeds.map((bed) => (
                        <label
                          key={bed.id}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                            assignTargetBedId === bed.id
                              ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 font-bold text-teal-900 dark:text-teal-200'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="assignBedSelection"
                            value={bed.id}
                            checked={assignTargetBedId === bed.id}
                            onChange={() => setAssignTargetBedId(bed.id)}
                            className="text-teal-600 focus:ring-teal-500"
                          />
                          <span>{bed.label}</span>
                        </label>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* نوع اسکان */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  وضعیت اسکان:
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="assignStatusType"
                      checked={assignIsConfirmed === true}
                      onChange={() => setAssignIsConfirmed(true)}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">اسکان قطعی (تأیید نهایی)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="assignStatusType"
                      checked={assignIsConfirmed === false}
                      onChange={() => setAssignIsConfirmed(false)}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-bold text-amber-700 dark:text-amber-300">اسکان موقت (نیازمند تأیید بعدی)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssigningStudent(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!assignTargetBedId}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {assigningStudent.assignedBedId && assigningStudent.assignmentStatus !== 'none'
                      ? 'ثبت جابجایی اتاق و تخت'
                      : 'تأیید و تعیین اتاق دانشجو'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال ثبت سرای دانشجویی جدید توسط مدیر */}
      {isAddDormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>ثبت سرای دانشجویی جدید</span>
              </h3>
              <button
                onClick={() => setIsAddDormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDormitorySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام کامل سرا *
                </label>
                <input
                  type="text"
                  placeholder="مثلاً سرای شهید رجایی - بلوک ۳"
                  value={newDormName}
                  onChange={(e) => setNewDormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  پردیس مربوطه
                </label>
                <input
                  type="text"
                  value={newDormCampus}
                  onChange={(e) => setNewDormCampus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    جنسیت
                  </label>
                  <select
                    value={newDormGender}
                    onChange={(e) => setNewDormGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="brothers">برادران</option>
                    <option value="sisters">خواهران</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تعداد طبقات
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newDormFloors}
                    onChange={(e) => setNewDormFloors(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام سرپرست مسئول سرا (اختیاری)
                </label>
                <input
                  type="text"
                  placeholder="مثلاً استاد حسینی"
                  value={newDormSupervisor}
                  onChange={(e) => setNewDormSupervisor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نشانی یا موقعیت در پردیس
                </label>
                <input
                  type="text"
                  placeholder="مثلاً جنب سالن ورزشی پردیس"
                  value={newDormAddress}
                  onChange={(e) => setNewDormAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddDormModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>ثبت و ایجاد سرا</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال ثبت اتاق جدید با تخت‌ها توسط مدیر */}
      {isAddRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-teal-600" />
                <span>ثبت اتاق جدید با تخت‌های دوطبقه</span>
              </h3>
              <button
                onClick={() => setIsAddRoomModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRoomSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  انتخاب سرا جهت احداث اتاق *
                </label>
                <select
                  value={roomDormId}
                  onChange={(e) => setRoomDormId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  required
                >
                  {dorms.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.campus})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شماره اتاق *
                </label>
                <input
                  type="text"
                  placeholder="مثلاً 204"
                  value={roomNumberInput}
                  onChange={(e) => setRoomNumberInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    طبقه
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={roomFloorInput}
                    onChange={(e) => setRoomFloorInput(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">0 = همکف، 1 = طبقه اول</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ظرفیت تخت اتاق
                  </label>
                  <select
                    value={roomCapacityInput}
                    onChange={(e) => setRoomCapacityInput(Number(e.target.value) || 4)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value={2}>۲ تخت (۱ دوطبقه)</option>
                    <option value={4}>۴ تخت (۲ دوطبقه)</option>
                    <option value={6}>۶ تخت (۳ دوطبقه)</option>
                    <option value={8}>۸ تخت (۴ دوطبقه)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl text-[11px] text-teal-800 dark:text-teal-300">
                با ثبت اتاق، به تعداد ظرفیت انتخابی تخت‌های دوطبقه (طبقه بالا و طبقه پایین) به صورت خودکار تولید و آماده رزرو می‌شوند.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRoomModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>ثبت اتاق و ساخت تخت‌ها</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال ویرایش و تغییر نام سرای دانشجویی توسط مدیر */}
      {editingDorm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <span>تغییر نام و ویرایش سرای دانشجویی</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingDorm(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditDormSubmit} className="space-y-3 text-xs">
              {editDormError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 font-bold">
                  {editDormError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام کامل سرا *
                </label>
                <input
                  type="text"
                  value={editDormName}
                  onChange={(e) => setEditDormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  پردیس مربوطه
                </label>
                <input
                  type="text"
                  value={editDormCampus}
                  onChange={(e) => setEditDormCampus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    جنسیت
                  </label>
                  <select
                    value={editDormGender}
                    onChange={(e) => setEditDormGender(e.target.value as 'brothers' | 'sisters')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="brothers">برادران</option>
                    <option value="sisters">خواهران</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تعداد طبقات
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={editDormFloors}
                    onChange={(e) => setEditDormFloors(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام سرپرست مسئول سرا
                </label>
                <input
                  type="text"
                  value={editDormSupervisor}
                  onChange={(e) => setEditDormSupervisor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نشانی یا موقعیت
                </label>
                <input
                  type="text"
                  value={editDormAddress}
                  onChange={(e) => setEditDormAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDorm(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>ذخیره تغییرات سرا</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال ویرایش و تغییر نام / شماره اتاق توسط مدیر */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <span>تغییر نام / شماره اتاق ({editingRoom.roomNumber})</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditRoomSubmit} className="space-y-3.5 text-xs">
              {editRoomError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 font-bold">
                  {editRoomError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شماره یا نام جدید اتاق *
                </label>
                <input
                  type="text"
                  value={editRoomNumber}
                  onChange={(e) => setEditRoomNumber(e.target.value)}
                  placeholder="مثال: 105 یا اتاق مطالعه"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  طبقه
                </label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={editRoomFloor}
                  onChange={(e) => setEditRoomFloor(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">۰ = همکف، ۱ = طبقه اول</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>ثبت نام جدید اتاق</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال جامع چاپ لیست دانشجویان اتاق‌ها برای مدیر */}
      <RoomRosterPrintModal
        isOpen={isAdminRoomPrintModalOpen}
        onClose={() => setIsAdminRoomPrintModalOpen(false)}
        dorms={dorms}
        rooms={rooms}
        beds={beds}
        students={students}
        settings={settings}
        initialDormId={selectedCartableDormId}
        actorTitle="مدیریت کل سامانه جامع خدمات دانشجویی"
      />

      {/* مدال تأیید عملیات حساس مدیر */}
      {adminConfirmDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 shrink-0 ${adminConfirmDialog.isPositive ? 'text-emerald-600' : 'text-rose-600'}`} />
              <span>{adminConfirmDialog.title}</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{adminConfirmDialog.message}</p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAdminConfirmDialog(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  const fn = adminConfirmDialog.onConfirm;
                  setAdminConfirmDialog(null);
                  void fn();
                }}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-sm cursor-pointer ${
                  adminConfirmDialog.isPositive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {adminConfirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مدال ثبت علت رد تخصیص موقت توسط مدیر */}
      {adminRejectDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = Storage.rejectStudentAssignment(
                adminRejectDialog.studentId,
                adminRejectDialog.reason.trim() || 'عدم تأیید مدیریت'
              );
              setAdminRejectDialog(null);
              setApprovalFeedback({ type: 'success', message: res.message });
              onRefreshData();
              setTimeout(() => setApprovalFeedback(null), 3500);
            }}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">ثبت علت عدم تأیید اسکان</h3>
            <p className="text-xs text-slate-500">این پیام به عنوان اعلان رسمی برای دانشجو ارسال می‌گردد:</p>
            <textarea
              rows={3}
              value={adminRejectDialog.reason}
              onChange={(e) => setAdminRejectDialog((prev) => (prev ? { ...prev, reason: e.target.value } : null))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              required
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAdminRejectDialog(null)}
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

      {/* مدال اعلان پیام/خطای مدیر */}
      {adminNoticeDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              {adminNoticeDialog.tone === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{adminNoticeDialog.title}</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{adminNoticeDialog.message}</p>
            <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAdminNoticeDialog(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}

      <SendSecurityReportModal
        isOpen={isSendSecurityModalOpen}
        onClose={() => setIsSendSecurityModalOpen(false)}
        reporterRole="admin"
        reporterId="admin"
        reporterName="مدیر کل امور سراها"
        students={students}
        dorms={dorms}
        rooms={rooms}
        onSuccess={() => {
          onRefreshData();
          setActivityLogs(Storage.getActivityLogs());
        }}
      />

      <StudentActivityTranscriptModal
        isOpen={isTranscriptModalOpen}
        onClose={() => setIsTranscriptModalOpen(false)}
        allowStudentPicker={true}
        studentsList={students}
        viewerRoleLabel="مدیریت کل سامانه"
      />

      <CourseSchedulingWorkspace
        isOpen={isCourseSchedulingOpen}
        onClose={() => setIsCourseSchedulingOpen(false)}
        userRole="admin"
        actor={{ id: 'admin', name: 'مدیر کل سامانه' }}
        onDataUpdated={onRefreshData}
      />

    </div>
  );
};
