import React, { useState, useEffect, useRef } from 'react';
import {
  AppSettings,
  Dormitory,
  Room,
  Bed,
  Student,
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
  HomeNoteItem,
} from '../types';
import { Storage, compressAvatarImageFile } from '../utils/storage';
import { ExcelImportTab } from './ExcelImportModal';
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
  toEnglishDigits,
} from '../utils/excelUtils';
import { FarhangianEmblem } from './FarhangianEmblem';
import { SupervisorRoomManager } from './SupervisorRoomManager';
import { VisualBedPicker } from './VisualBedPicker';
import { RoomWarningModal } from './RoomWarningModal';
import { DormIdCardModal } from './DormIdCardModal';
import { StudentEvaluationModal } from './StudentEvaluationModal';
import { RichTextEditor, RichTextDisplay } from './RichTextEditor';
import { AdminUsersPanel, UserCategoryKey } from './AdminUsersPanel';
import { plainTextToHtml, sanitizeRichHtml } from '../utils/sanitizeHtml';
import { STANDARD_FONTS, readMultipleFontFiles } from '../utils/fonts';
import {
  DEFAULT_HOME_NOTES_TITLE,
  DEFAULT_HOME_NOTES,
  HERO_PRESET_COLORS,
  resolveHeroBannerStyle,
} from '../utils/homeDefaults';
import {
  Settings,
  Calendar,
  Clock,
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
  FolderUp,
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
  onOpenUserGuide?: (role: 'admin' | 'supervisor' | 'maintenance' | 'warehouse' | 'student') => void;
  cloudSyncTick?: number;
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
  cloudSyncTick = 0,
}) => {
  // تب‌های اصلی داشبورد مدیر
  const [mainTab, setMainTab] = useState<'cartable' | 'users' | 'announcements' | 'requests' | 'maintenance' | 'shifts' | 'counseling' | 'activity_log' | 'settings'>('cartable');
  const [usersCategory, setUsersCategory] = useState<UserCategoryKey>('students');

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

  // داده‌های شیفت‌بندی و گزارشات شیفت سرپرستان
  const [shiftSchedules, setShiftSchedules] = useState<SupervisorShiftSchedule[]>(Storage.getShiftSchedules());
  const [shiftReports, setShiftReports] = useState<ShiftLogReport[]>(Storage.getShiftReports());
  const [shiftSearch, setShiftSearch] = useState('');
  const [shiftDormFilter, setShiftDormFilter] = useState('all');
  const [shiftDayFilter, setShiftDayFilter] = useState('all');
  const [shiftFeedback, setShiftFeedback] = useState<string | null>(null);

  // فهرست پرسنل انبار
  const [warehouseStaffList, setWarehouseStaffList] = useState<WarehouseStaff[]>(Storage.getWarehouseStaff());

  const handleUsersRefresh = () => {
    setCounselorsList(Storage.getCounselors());
    setWarehouseStaffList(Storage.getWarehouseStaff());
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
  }, [cloudSyncTick]);

  // فرم ثبت شیفت دستی جدید توسط مدیر
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
  const [newShiftSupId, setNewShiftSupId] = useState(supervisors[0]?.id || '');
  const [newShiftDormId, setNewShiftDormId] = useState(dorms[0]?.id || 'all');
  const [newShiftDay, setNewShiftDay] = useState<DayOfWeek | 'all'>('saturday');
  const [newShiftType, setNewShiftType] = useState<ShiftLogReport['shiftType']>('evening');
  const [newShiftStartTime, setNewShiftStartTime] = useState('۱۵:۰۰');
  const [newShiftEndTime, setNewShiftEndTime] = useState('۲۳:۰۰');
  const [newShiftNotes, setNewShiftNotes] = useState('');
  const [newShiftIsEveryDay, setNewShiftIsEveryDay] = useState(false);

  // زیرتب‌های کارتابل سرپرستی مدیر
  const [cartableSubTab, setCartableSubTab] = useState<'manager' | 'visual_picker' | 'warnings' | 'structure'>('manager');
  const [selectedCartableDormId, setSelectedCartableDormId] = useState<string>('all');
  const [isAdminWarningModalOpen, setIsAdminWarningModalOpen] = useState(false);

  useEffect(() => {
    setActivityLogs(Storage.getActivityLogs());
    setStudentEvaluations(Storage.getStudentEvaluations());
    setCounselorsList(Storage.getCounselors());
    setWarehouseStaffList(Storage.getWarehouseStaff());
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

  useEffect(() => {
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
  }, [supervisors, newShiftSupId]);

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

  // وضعیت آپلود دسته‌جمعی پوشه عکس‌ها
  const [batchPhotoStatus, setBatchPhotoStatus] = useState<{
    type: 'success' | 'error' | 'loading';
    text: string;
    details?: string[];
  } | null>(null);

  // فرم ثبت و انتشار اطلاعیه توسط مدیر
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnContentHtml, setNewAnnContentHtml] = useState('');
  const [annEditorResetKey, setAnnEditorResetKey] = useState(0);
  const [newAnnPriority, setNewAnnPriority] = useState<Announcement['priority']>('normal');
  const [newAnnTargetDormId, setNewAnnTargetDormId] = useState('all');
  const [newAnnShowOnHome, setNewAnnShowOnHome] = useState(true);
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

  useEffect(() => {
    setDraftHomeNotesTitle(settings.homeNotesTitle?.trim() || DEFAULT_HOME_NOTES_TITLE);
    setDraftHomeNotes(
      settings.homeNotes && settings.homeNotes.length > 0
        ? settings.homeNotes
        : DEFAULT_HOME_NOTES
    );
    setHomeNotesEditorKey((k) => k + 1);
  }, [settings.homeNotesTitle, settings.homeNotes]);

  // مدیریت دانشجویان توسط مدیر: افزودن، ویرایش و مشاهده کارت
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewCardStudent, setViewCardStudent] = useState<Student | null>(null);

  // فیلدهای فرم دانشجو
  const [stFormFullName, setStFormFullName] = useState('');
  const [stFormStudentId, setStFormStudentId] = useState('');
  const [stFormNationalId, setStFormNationalId] = useState('');
  const [stFormField, setStFormField] = useState('آموزش ابتدایی');
  const [stFormEntryTerm, setStFormEntryTerm] = useState('۴۰۲۱');
  const [stFormFatherName, setStFormFatherName] = useState('');
  const [stFormMobile, setStFormMobile] = useState('');
  const [stFormEmergency, setStFormEmergency] = useState('');
  const [stFormProvince, setStFormProvince] = useState('اصفهان');
  const [stFormCity, setStFormCity] = useState('اصفهان');
  const [stFormParentPhone, setStFormParentPhone] = useState('');
  const [stFormPostalAddress, setStFormPostalAddress] = useState('');
  const [stFormBirthDate, setStFormBirthDate] = useState('1382/01/01');
  const [stFormPhotoUrl, setStFormPhotoUrl] = useState<string>('');
  const [stFormProfileCompleted, setStFormProfileCompleted] = useState<boolean>(true);
  const [stFormError, setStFormError] = useState<string | null>(null);

  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setStFormFullName('');
    setStFormStudentId('');
    setStFormNationalId('');
    setStFormField('آموزش ابتدایی');
    setStFormEntryTerm('۴۰۲۱');
    setStFormFatherName('');
    setStFormMobile('');
    setStFormEmergency('');
    setStFormProvince('اصفهان');
    setStFormCity('اصفهان');
    setStFormParentPhone('');
    setStFormPostalAddress('');
    setStFormBirthDate('1382/01/01');
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
    setStFormEntryTerm(st.entryTerm);
    setStFormFatherName(st.fatherName || '');
    setStFormMobile(st.mobile || '');
    setStFormEmergency(st.emergencyPhone || '');
    setStFormProvince(st.province || 'اصفهان');
    setStFormCity(st.city || 'اصفهان');
    setStFormParentPhone(st.parentPhone || '');
    setStFormPostalAddress(st.postalAddress || '');
    setStFormBirthDate(st.birthDate || '1382/01/01');
    setStFormPhotoUrl(st.photoUrl || '');
    setStFormProfileCompleted(Boolean(st.isProfileCompleted));
    setStFormError(null);
    setIsAddStudentModalOpen(true);
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
    if (!stFormFullName.trim() || !stFormStudentId.trim() || !stFormNationalId.trim()) {
      setStFormError('لطفاً نام و نام خانوادگی، شماره دانشجویی و کد ملی را تکمیل فرمایید.');
      return;
    }

    const targetStudentId = (editingStudent ? editingStudent.studentId : stFormStudentId).trim();
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

    if (editingStudent) {
      const res = Storage.updateStudentAdmin(editingStudent.studentId, {
        fullName: stFormFullName.trim(),
        nationalId: stFormNationalId.trim(),
        fieldOfStudy: stFormField.trim(),
        entryTerm: stFormEntryTerm.trim(),
        fatherName: stFormFatherName.trim(),
        mobile: stFormMobile.trim(),
        emergencyPhone: stFormEmergency.trim(),
        parentPhone: stFormParentPhone.trim(),
        province: stFormProvince.trim(),
        city: stFormCity.trim(),
        postalAddress: stFormPostalAddress.trim(),
        birthDate: stFormBirthDate.trim() || '1382/01/01',
        photoUrl: resolvedPhotoUrl,
        isProfileCompleted: stFormProfileCompleted,
      });
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
        nationalId: stFormNationalId.trim(),
        fullName: stFormFullName.trim(),
        fieldOfStudy: stFormField.trim(),
        entryTerm: stFormEntryTerm.trim(),
        fatherName: stFormFatherName.trim(),
        birthDate: stFormBirthDate.trim() || '1382/01/01',
        province: stFormProvince.trim(),
        city: stFormCity.trim(),
        postalAddress: stFormPostalAddress.trim(),
        phone: '',
        mobile: stFormMobile.trim(),
        emergencyPhone: stFormEmergency.trim(),
        parentPhone: stFormParentPhone.trim(),
        religion: 'اسلام، شیعه',
        previousDorm: '',
        previousRoom: '',
        previousScore: 100,
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
      await Storage.waitForPendingCloudSync();
      setApprovalFeedback({ type: 'success', message: `${res.message}${photoCloudWarning}` });
    }

    setIsAddStudentModalOpen(false);
    onRefreshData();
    setTimeout(() => setApprovalFeedback(null), 4000);
  };

  const handleDeleteStudent = (st: Student) => {
    if (confirm(`آیا از حذف کامل دانشجو «${st.fullName}» با کد دانشجویی ${st.studentId} از سامانه مطمئن هستید؟ در صورت اسکان، تخت وی آزاد خواهد شد.`)) {
      const res = Storage.deleteStudent(st.studentId);
      setApprovalFeedback({ type: 'success', message: res.message });
      onRefreshData();
      setTimeout(() => setApprovalFeedback(null), 3500);
    }
  };

  // تخلیه دانشجو از اتاق و آزادسازی تخت توسط مدیر
  const handleAdminEvictStudent = (st: Student) => {
    const r = rooms.find((rm) => rm.id === st.assignedRoomId);
    if (
      confirm(
        `آیا از تخلیه و لغو اسکان دانشجو «${st.fullName}» از اتاق ${r?.roomNumber || ''} اطمینان دارید؟\nتخت مربوطه فوراً آزاد گردیده و وضعیت اسکان دانشجو به «فاقد اسکان» تغییر خواهد کرد.`
      )
    ) {
      const res = Storage.releaseBed(st.studentId);
      setApprovalFeedback({ type: 'success', message: res.message });
      onRefreshData();
      setTimeout(() => setApprovalFeedback(null), 3500);
    }
  };

  // باز کردن مدال تخصیص اتاق و تخت به دانشجو
  const handleOpenAssignStudentModal = (st: Student) => {
    setAssigningStudent(st);
    const firstDorm = dorms[0]?.id || '';
    setAssignTargetDormId(firstDorm);
    const dormRooms = rooms.filter((r) => r.dormId === firstDorm);
    const firstRoom = dormRooms[0]?.id || '';
    setAssignTargetRoomId(firstRoom);
    const availableBeds = beds.filter((b) => b.roomId === firstRoom && !b.studentId);
    setAssignTargetBedId(availableBeds[0]?.id || '');
    setAssignIsConfirmed(true);
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
      alert(res.message);
    }
  };

  // حذف سرا توسط مدیر
  const handleDeleteDormitory = (dormId: string, dormName: string) => {
    if (
      confirm(
        `آیا از حذف کامل سرای «${dormName}» به همراه کلیه اتاق‌ها، تخت‌ها و لغو اسکان دانشجویان ساکن در آن اطمینان دارید؟`
      )
    ) {
      const res = Storage.deleteDormitory(dormId);
      setApprovalFeedback({ type: res.success ? 'success' : 'error', message: res.message });
      onRefreshData();
      setTimeout(() => setApprovalFeedback(null), 3500);
    }
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
      alert(res.message);
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
    if (
      confirm(
        `آیا از حذف کامل اتاق ${roomNum} و آزادسازی کلیه تخت‌ها و اسکان دانشجویان آن اطمینان دارید؟`
      )
    ) {
      const res = Storage.deleteRoom(roomId);
      setApprovalFeedback({ type: 'success', message: res.message });
      onRefreshData();
      setTimeout(() => setApprovalFeedback(null), 3500);
    }
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
    if (confirm(`آیا از حذف «${bedLabel}» اطمینان دارید؟ در صورت اسکان دانشجو، تخت آزاد می‌گردد.`)) {
      const res = Storage.deleteBed(bedId);
      setApprovalFeedback({ type: res.success ? 'success' : 'error', message: res.message });
      onRefreshData();
      setTimeout(() => setApprovalFeedback(null), 3500);
    }
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
    setNewAnnPinned(false);
    setNewAnnImage(null);
  };

  const handleAnnImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم عکس اطلاعیه نباید بیشتر از ۵ مگابایت باشد.');
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
    if (
      confirm(
        `آیا از تأیید دسته‌جمعی کلیه درخواست‌های اسکان موقت (${pendingStudents.length} دانشجو) اطمینان دارید؟ وضعیت اسکان همه آنها قطعی خواهد شد.`
      )
    ) {
      const res = Storage.bulkConfirmAllAssignments();
      setApprovalFeedback({ type: 'success', message: res.message });
      onRefreshData();
      setTimeout(() => setApprovalFeedback(null), 4000);
    }
  };

  const handleConfirmSingle = (studentId: string) => {
    const res = Storage.confirmStudentAssignment(studentId);
    setApprovalFeedback({ type: 'success', message: res.message });
    onRefreshData();
    setTimeout(() => setApprovalFeedback(null), 3000);
  };

  const handleRejectSingle = (studentId: string) => {
    const reason = prompt(
      'لطفاً علت عدم تأیید اسکان را وارد نمایید (این پیام به عنوان نوتیفیکیشن برای دانشجو ارسال می‌گردد):',
      'عدم تطابق با ضوابط یا تکمیل ظرفیت'
    );
    if (reason !== null) {
      const res = Storage.rejectStudentAssignment(studentId, reason);
      setApprovalFeedback({ type: 'success', message: res.message });
      onRefreshData();
      setTimeout(() => setApprovalFeedback(null), 3000);
    }
  };

  // ایجاد و انتشار یا ویرایش اطلاعیه توسط مدیر
  const handleAdminCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) {
      alert('لطفاً عنوان و متن اطلاعیه را وارد نمایید.');
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
        author: 'مدیریت کل امور سراهای دانشجویی',
        priority: newAnnPriority,
        date: new Date().toLocaleDateString('fa-IR'),
        targetDormId: newAnnTargetDormId,
        showOnHomePage: newAnnShowOnHome,
        pinned: newAnnPinned,
        imageUrl: newAnnImage || undefined,
      });
      setAnnFeedback('اطلاعیه با موفقیت ثبت شد و در سامانه و صفحه اول سایت منتشر گردید.');
    }

    setNewAnnTitle('');
    setNewAnnContent('');
    setNewAnnContentHtml('');
    setAnnEditorResetKey((k) => k + 1);
    setNewAnnPriority('normal');
    setNewAnnTargetDormId('all');
    setNewAnnShowOnHome(true);
    setNewAnnPinned(false);
    setNewAnnImage(null);
    setTimeout(() => setAnnFeedback(null), 3500);
    onRefreshData();
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (confirm('آیا از حذف این اطلاعیه اطمینان دارید؟')) {
      Storage.deleteAnnouncement(id);
      onRefreshData();
    }
  };

  const handleToggleAnnouncementHome = (id: string) => {
    Storage.toggleAnnouncementHomePage(id);
    onRefreshData();
  };

  // پردازش پوشه عکس‌های دانشجویان بر اساس شماره دانشجویی و بارگذاری ابری
  const handleBatchPhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp)$/i.test(f.name)
    );
    e.target.value = '';

    if (imageFiles.length === 0) {
      setBatchPhotoStatus({ type: 'error', text: 'هیچ فایل تصویری در پوشه انتخاب شده یافت نشد.' });
      return;
    }

    setBatchPhotoStatus({
      type: 'loading',
      text: `در حال بررسی تطبیق ${imageFiles.length} فایل عکس با فهرست دانشجویان...`,
    });

    const normalizeCode = (raw: string) =>
      raw
        .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
        .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
        .trim()
        .toLowerCase();

    const currentStudents = Storage.getStudents();
    const unmatchedKeys: string[] = [];
    const matchedEntries: Array<{ studentId: string; file: File }> = [];

    for (const file of imageFiles) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const cleanBase = normalizeCode(baseName);
      const digitMatch = cleanBase.match(/\d+/)?.[0] || cleanBase;

      const found =
        currentStudents.find((s) => normalizeCode(s.studentId) === cleanBase) ||
        currentStudents.find((s) => normalizeCode(s.studentId) === digitMatch);

      if (found) {
        matchedEntries.push({ studentId: found.studentId.trim(), file });
      } else {
        unmatchedKeys.push(baseName.trim());
      }
    }

    if (matchedEntries.length === 0) {
      setBatchPhotoStatus({
        type: 'error',
        text: 'هیچ عکسی با شماره دانشجویی تطابق پیدا نکرد. لطفاً نام فایل‌ها را بررسی فرمایید (مثال: 4021001.jpg).',
        details: unmatchedKeys.slice(0, 8),
      });
      return;
    }

    setBatchPhotoStatus({
      type: 'loading',
      text: `در حال بهینه‌سازی و بارگذاری ابری ${matchedEntries.length} تصویر منطبق‌شده... لطفاً شکیبا باشید.`,
    });

    const compressedMap: Record<string, string> = {};
    const cloudItems: Array<{ userId: string; dataUrl: string }> = [];

    for (const entry of matchedEntries) {
      try {
        const dataUrl = await compressAvatarImageFile(entry.file);
        compressedMap[entry.studentId] = dataUrl;
        cloudItems.push({ userId: entry.studentId, dataUrl });
      } catch {
        // فایل تصویر خراب نادیده گرفته می‌شود
      }
    }

    const cloudRes = await Storage.uploadPhotosToCloud('student', cloudItems);

    if (cloudRes.supported && cloudRes.ok) {
      const urlPhotoMap: Record<string, string> = {};
      matchedEntries.forEach((entry) => {
        const u = cloudRes.urls[entry.studentId];
        if (u) urlPhotoMap[entry.studentId] = u;
      });

      const result = Storage.batchAssignStudentPhotos(urlPhotoMap);
      const syncRes = await Storage.waitForPendingCloudSync();
      onRefreshData();

      setBatchPhotoStatus({
        type: result.saved && syncRes.success ? 'success' : 'error',
        text: !result.saved
          ? 'ذخیره‌سازی آدرس تصاویر در حافظه مرورگر با خطا مواجه شد.'
          : syncRes.success
          ? `تعداد ${result.matchedCount} عکس با موفقیت در دیتابیس ابری (MongoDB) ذخیره شد و در همه سیستم‌ها قابل مشاهده است.`
          : 'عکس‌ها در سرور ذخیره شدند اما همگام‌سازی لیست دانشجویان با خطا مواجه شد.',
        details:
          unmatchedKeys.length > 0
            ? unmatchedKeys.map((k) => `فایل با شناسه «${k}» در فهرست دانشجویان موجود یافت نشد.`)
            : undefined,
      });
      return;
    }

    if (!cloudRes.supported) {
      const result = Storage.batchAssignStudentPhotos(compressedMap);
      await Storage.waitForPendingCloudSync();
      onRefreshData();

      setBatchPhotoStatus({
        type: 'error',
        text: !result.saved
          ? 'مسیر ذخیره ابری عکس‌ها (/api/photos/batch) در سرور khabgah-api فعال نیست و حافظه مرورگر نیز ظرفیت ذخیره مستقیم تصاویر را ندارد. لطفاً فایل server.js بک‌اند را بروزرسانی کنید.'
          : `هشدار: ${result.matchedCount} عکس فقط در مرورگر فعلی ثبت شد و برای مشاهده در سیستم‌های دیگر باید فایل جدید server.js (شامل /api/photos/batch) را در بک‌اند khabgah-api جایگزین کنید.`,
        details:
          unmatchedKeys.length > 0
            ? unmatchedKeys.map((k) => `فایل با شناسه «${k}» در فهرست دانشجویان موجود یافت نشد.`)
            : undefined,
      });
      return;
    }

    setBatchPhotoStatus({
      type: 'error',
      text:
        cloudRes.errorMessage ||
        'بارگذاری تصاویر در فضای ابری با خطا مواجه شد. لطفاً اتصال اینترنت و وضعیت سرور khabgah-api را بررسی کنید.',
      details:
        unmatchedKeys.length > 0
          ? unmatchedKeys.map((k) => `فایل با شناسه «${k}» در فهرست دانشجویان موجود یافت نشد.`)
          : undefined,
    });
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
        alert('حجم تصویر آرم نباید بیشتر از ۳ مگابایت باشد.');
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
      alert('حجم عکس پس‌زمینه نباید بیشتر از ۵ مگابایت باشد.');
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
      alert('تصویر پس‌زمینه سایت با موفقیت تغییر یافت و فعال شد.');
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

  const handleBackupExport = () => {
    Storage.exportBackupJson();
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const ok = Storage.importBackupJson(text);
        if (ok) {
          const syncRes = await Storage.waitForPendingCloudSync();
          onRefreshData();
          alert(
            syncRes.success
              ? 'اطلاعات نسخه پشتیبان با موفقیت بازیابی و در دیتابیس ابری ذخیره شد.'
              : 'اطلاعات نسخه پشتیبان در مرورگر بازیابی شد، اما همگام‌سازی برخی بخش‌ها با دیتابیس ابری با خطا مواجه شد.'
          );
        } else {
          alert('فایل پشتیبان نامعتبر است.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetDefaults = async () => {
    if (confirm('آیا مایل به بازنشانی پایگاه داده به حالت اولیه دانشگاه فرهنگیان هستید؟ تمام تغییرات به نمونه اولیه برمی‌گردد.')) {
      Storage.resetToDefaults();
      await Storage.syncAllToCloud();
      onRefreshData();
    }
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
      createdByName: 'مدیریت کل سراها',
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
    if (confirm(`آیا از حذف مأموریت تأسیساتی ${code} اطمینان دارید؟`)) {
      Storage.deleteMaintenanceTask(taskId);
      setAdminMaintFeedback(`مأموریت ${code} حذف گردید.`);
      onRefreshData();
      setTimeout(() => setAdminMaintFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6">

      {/* مدال اعلام اخطار برای اتاق توسط مدیر */}
      <RoomWarningModal
        isOpen={isAdminWarningModalOpen}
        onClose={() => setIsAdminWarningModalOpen(false)}
        dorms={dorms}
        rooms={rooms}
        supervisorName="مدیریت کل امور سراها"
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
        evaluatorName="مدیریت کل امور سراها"
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
              <span className="text-xs font-bold text-purple-300">پنل مدیریت کل امور سراهای دانشگاه فرهنگیان</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">مدیریت کل سیستم و کارتابل جامع سراها</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              کارتابل کامل سرپرستی، انتشار اطلاعیه‌ها در صفحه اول، تأیید درخواست‌ها، تعریف سرپرستان چندسرا و تنظیمات
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleToggleSelectionActive}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-md cursor-pointer border ${
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
              onClick={onOpenAppearance}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer"
              title="تغییر والپیپر، فونت و ظاهر سامانه"
            >
              <Palette className="w-4 h-4" />
              <span>شخصی‌سازی ظاهر و فونت</span>
            </button>

            <button
              onClick={onOpenChangePassword}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
              title="تغییر کلمه عبور مدیر"
            >
              <KeyRound className="w-4 h-4" />
              <span>تغییر رمز مدیر</span>
            </button>

            <button
              onClick={() => onOpenExcelModal('students')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ورود اکسل (دانشجویان، سراها و کاربران)</span>
            </button>

            <button
              onClick={onOpenReports}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-600/20 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>گزارش‌ها و خروجی اکسل</span>
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

      {/* نوارهای اصلی ناوبری مدیریت (Tabs) */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl shadow-inner">
        
        {/* ۱. تب کارتابل سرپرستی مدیر کل */}
        <button
          onClick={() => setMainTab('cartable')}
          className={`flex-1 min-w-[200px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'cartable'
              ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4 text-purple-600" />
          <span>کارتابل و مدیریت جامع سراها</span>
        </button>

        {/* ۲. تب مجزای مدیریت کاربران (دانشجویان، سرپرستان، تأسیسات، انبار، مشاوران) */}
        <button
          onClick={() => setMainTab('users')}
          className={`flex-1 min-w-[200px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'users'
              ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-teal-600" />
          <span>مدیریت کاربران سامانه</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-extrabold">
            {students.length + supervisors.length + campusStaff.length + warehouseStaffList.length + counselorsList.length}
          </span>
        </button>

        {/* ۳. تب انتشار اطلاعیه‌های سایت و صفحه اول */}
        <button
          onClick={() => setMainTab('announcements')}
          className={`flex-1 min-w-[190px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'announcements'
              ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4 text-teal-600" />
          <span>اطلاعیه‌های سایت و صفحه اول</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-extrabold">
            {announcements.length}
          </span>
        </button>

        {/* ۴. تب درخواست‌های اسکان و تخصیص موقت */}
        <button
          onClick={() => setMainTab('requests')}
          className={`flex-1 min-w-[180px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'requests'
              ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>درخواست‌های اسکان موقت</span>
          {pendingStudents.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-black animate-pulse">
              {pendingStudents.length}
            </span>
          )}
        </button>

        {/* ۵. تب مدیریت تأسیسات و امور فنی دانشگاه */}
        <button
          onClick={() => setMainTab('maintenance')}
          className={`flex-1 min-w-[180px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'maintenance'
              ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-600" />
          <span>تأسیسات و امور فنی سراها</span>
          {activeCampusMaintCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-black animate-pulse">
              {activeCampusMaintCount}
            </span>
          )}
        </button>

        {/* ۶. تب شیفت‌بندی سرپرستان و حضور و غیاب */}
        <button
          onClick={() => setMainTab('shifts')}
          className={`flex-1 min-w-[190px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'shifts'
              ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 text-teal-600" />
          <span>شیفت‌بندی سرپرستان و گزارش‌ها</span>
        </button>

        {/* ۷. تب مرکز مشاوره، روانشناسان و شیفت‌ها */}
        <button
          onClick={() => setMainTab('counseling')}
          className={`flex-1 min-w-[190px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'counseling'
              ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <HeartHandshake className="w-4 h-4 text-teal-600" />
          <span>مرکز مشاوره و شیفت‌های روانشناسی</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-extrabold">
            {counselorsList.length} مشاور
          </span>
        </button>

        {/* ۸. تب گزارش لاگ فعالیت‌ها و دسترسی‌های کاربران */}
        <button
          onClick={() => {
            setActivityLogs(Storage.getActivityLogs());
            setMainTab('activity_log');
          }}
          className={`flex-1 min-w-[180px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'activity_log'
              ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4 text-rose-600" />
          <span>لاگ فعالیت‌ها و دسترسی‌ها</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold">
            {activityLogs.length}
          </span>
        </button>

        {/* ۹. تب پیکربندی و ظاهر سیستم */}
        <button
          onClick={() => setMainTab('settings')}
          className={`flex-1 min-w-[180px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'settings'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4 text-indigo-600" />
          <span>تنظیمات و ظاهر سامانه</span>
        </button>

      </div>

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
          onRefreshData={handleUsersRefresh}
          onOpenExcelModal={onOpenExcelModal}
          onOpenReports={onOpenReports}
          onAddStudent={handleOpenAddStudent}
          onEditStudent={handleOpenEditStudent}
          onDeleteStudent={handleDeleteStudent}
          onViewStudentCard={(st) => setViewCardStudent(st)}
          onEvaluateStudent={(st) => {
            setEvalTargetStudent(st);
            setIsStudentEvalModalOpen(true);
          }}
          onAssignStudentRoom={handleOpenAssignStudentModal}
          onEvictStudent={handleAdminEvictStudent}
          studentSecondaryEditEnabled={Boolean(localSettings.studentSecondaryEditEnabled)}
          onToggleStudentSecondaryEdit={handleToggleStudentSecondaryEdit}
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

              {/* اکشن‌های سریع سرپرستی برای مدیر */}
              <div className="flex items-center gap-2">
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
              onDataChanged={onRefreshData}
              supervisorDormId={selectedCartableDormId}
              actorName="مدیریت کل امور سراها"
              actorRole="admin"
              actorId="admin"
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
              actorName="مدیریت کل امور سراها"
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
                    {studentEvaluations.map((ev) => (
                      <div
                        key={ev.id}
                        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          ev.type === 'evaluation'
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                            : ev.type === 'report'
                            ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
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
                                  : ev.type === 'warning'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-amber-500 text-white'
                              }`}
                            >
                              {ev.type === 'evaluation'
                                ? `نمره ارزیابی: ${ev.score ?? '-'} از ۱۰۰`
                                : ev.type === 'report'
                                ? 'گزارش'
                                : ev.type === 'warning'
                                ? 'اخطار رسمی'
                                : 'تذکر'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
                              {ev.scope === 'room' ? 'گستره: اتاق' : 'گستره: فردی'}
                            </span>
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
                            {(ev.type === 'notice' || ev.type === 'warning') && ` • وضعیت: ${ev.resolved ? 'برطرف شده' : 'فعال'}`}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {(ev.type === 'notice' || ev.type === 'warning') && !ev.resolved && (
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
                    ))}
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

              {/* فیلتر سرا */}
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

              {/* نمایش اطلاعات و ساختار سراهای فیلترشده */}
              <div className="space-y-6">
                {(structureDormFilter === 'all' ? dorms : dorms.filter((d) => d.id === structureDormFilter)).map((dorm) => {
                  const dormRooms = rooms.filter((r) => r.dormId === dorm.id);
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
                            {dormRooms.length} اتاق • {dormBeds.length} تخت ({dormVacant} خالی)
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
                          هیچ اتاقی در این سرا ثبت نشده است. با کلیک بر روی «ثبت اتاق جدید با تخت‌ها» اقدام به ایجاد اتاق نمایید.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {dormRooms.map((room) => {
                            const roomBeds = beds.filter((b) => b.roomId === room.id);
                            const occupiedBeds = roomBeds.filter((b) => b.studentId);
                            const isFull = occupiedBeds.length >= roomBeds.length;

                            return (
                              <div
                                key={room.id}
                                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
                              >
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                  <div className="flex items-center gap-1.5">
                                    <DoorOpen className="w-4 h-4 text-teal-600" />
                                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                      اتاق {room.roomNumber}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      (طبقه {room.floor === 0 ? 'همکف' : room.floor})
                                    </span>
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

                                    return (
                                      <div
                                        key={bed.id}
                                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
                                          resident
                                            ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                            : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 truncate">
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 shrink-0 font-mono">
                                            تخت {bed.bedNumber ?? (bed.bunkNumber ? (bed.tier === 'lower' ? bed.bunkNumber * 2 - 1 : bed.bunkNumber * 2) : '')} ({bed.tier === 'lower' ? 'پایین ⬇️' : 'بالا ⬆️'})
                                          </span>
                                          {resident ? (
                                            <div className="truncate">
                                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                                {resident.fullName}
                                              </span>
                                              <span className="text-[10px] text-slate-400 mr-1 font-mono">
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
                                                    alert('هیچ دانشجوی فاقد اسکانی در سیستم یافت نشد.');
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
                })}
              </div>
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
                  ثبت و انتشار اطلاعیه رسمی سراهای دانشجویی
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
                  متن و شرح کامل اطلاعیه * (با قابلیت انتخاب فونت، رنگ، اندازه، بُلد و ایتالیک برای هر قسمت از متن)
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
                  placeholder="متن کامل بخشنامه یا اطلاعیه رسمی را درج فرمایید. با انتخاب هر کلمه یا جمله می‌توانید فونت، رنگ، اندازه، بُلد یا ایتالیک آن را تغییر دهید..."
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
                        className="w-12 h-12 object-cover rounded-lg border border-teal-500 shadow-xs cursor-pointer hover:opacity-90"
                        onClick={() => setAnnPreviewImage(newAnnImage)}
                        title="مشاهده بزرگتر"
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
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mr-1">
                          {ann.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* دکمه ویرایش اطلاعیه */}
                        <button
                          onClick={() => handleStartEditAnnouncement(ann)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-300 dark:border-amber-800 transition flex items-center gap-1 cursor-pointer"
                          title="ویرایش متن و مشخصات اطلاعیه"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>ویرایش</span>
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
                    />

                    {ann.imageUrl && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-black/5 max-w-sm">
                        <img
                          src={ann.imageUrl}
                          alt={ann.title}
                          className="w-full max-h-48 object-cover rounded-xl cursor-pointer hover:opacity-90 transition"
                          onClick={() => setAnnPreviewImage(ann.imageUrl || null)}
                          title="کلیک جهت مشاهده در ابعاد بزرگ"
                        />
                      </div>
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
      {/* ۳. تب درخواست‌های اسکان و تخصیص موقت اتاق‌ها */}
      {/* ========================================================= */}
      {mainTab === 'requests' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 animate-in fade-in duration-200">
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
                                <img src={st.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
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

                            {assignedTech?.mobile && (
                              <a
                                href={`tel:${assignedTech.mobile}`}
                                className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                title="تماس مستقیم با تکنسین"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
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
                    ساماندهی نوبت‌های کاری و حضور سرپرستان سراها
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black">
                  شیفت‌بندی کادر سرپرستی، دفتر وقایع و حضور و غیاب سراها
                </h2>
                <p className="text-xs text-teal-200/80 mt-1">
                  تعیین برنامه حضور هفتگی یا ماهانه، بارگذاری مستقیم فایل اکسل، و پایش گزارش‌های تحویل شیفت سرپرستی
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
                  onClick={() => setIsAddShiftModalOpen(true)}
                  className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-teal-500/30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>ثبت شیفت دستی جدید</span>
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

          {/* تب‌ها و فیلترهای بخش شیفت‌بندی */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  جدول نوبت‌های کاری ثبت‌شده سرپرستان ({shiftSchedules.length} نوبت)
                </h3>
              </div>

              {/* دکمه خروجی اکسل گزارشات دفتر وقایع */}
              <button
                onClick={() => exportShiftReportsToExcel(shiftReports)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
                <span>خروجی اکسل دفتر وقایع شیفت‌ها</span>
              </button>
            </div>

            {/* فیلترها و جستجو */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">جستجوی سرپرست یا دستورکار</label>
                <div className="relative">
                  <input
                    type="text"
                    value={shiftSearch}
                    onChange={(e) => setShiftSearch(e.target.value)}
                    placeholder="نام سرپرست، توضیحات..."
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

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">فیلتر روز هفته</label>
                <select
                  value={shiftDayFilter}
                  onChange={(e) => setShiftDayFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">همه روزهای هفته</option>
                  <option value="saturday">شنبه</option>
                  <option value="sunday">یکشنبه</option>
                  <option value="monday">دوشنبه</option>
                  <option value="tuesday">سه‌شنبه</option>
                  <option value="wednesday">چهارشنبه</option>
                  <option value="thursday">پنجشنبه</option>
                  <option value="friday">جمعه</option>
                </select>
              </div>
            </div>

            {/* جدول نوبت‌های شیفت */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3">سرپرست سرا</th>
                    <th className="p-3">سرای مربوطه</th>
                    <th className="p-3">روز هفته</th>
                    <th className="p-3">نوبت شیفت</th>
                    <th className="p-3">ساعات حضور</th>
                    <th className="p-3">توضیحات و دستورکار</th>
                    <th className="p-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {shiftSchedules
                    .filter((s) => {
                      if (shiftDormFilter !== 'all' && s.dormId !== shiftDormFilter && s.dormId !== 'all') return false;
                      if (shiftDayFilter !== 'all' && s.dayOfWeek !== shiftDayFilter && s.dayOfWeek !== 'all') return false;
                      if (shiftSearch.trim()) {
                        const q = shiftSearch.toLowerCase();
                        return s.supervisorName.toLowerCase().includes(q) || (s.notes && s.notes.toLowerCase().includes(q));
                      }
                      return true;
                    })
                    .map((s) => {
                      const dayLabels: Record<string, string> = {
                        saturday: 'شنبه',
                        sunday: 'یکشنبه',
                        monday: 'دوشنبه',
                        tuesday: 'سه‌شنبه',
                        wednesday: 'چهارشنبه',
                        thursday: 'پنجشنبه',
                        friday: 'جمعه',
                        sat: 'شنبه',
                        sun: 'یکشنبه',
                        mon: 'دوشنبه',
                        tue: 'سه‌شنبه',
                        wed: 'چهارشنبه',
                        thu: 'پنجشنبه',
                        fri: 'جمعه',
                        all: 'همه روزها (حضور روزانه)',
                      };
                      const shiftLabels: Record<string, { label: string; color: string }> = {
                        morning: { label: 'شیفت صبح', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
                        evening: { label: 'شیفت عصر', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' },
                        night: { label: 'شیفت شب', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
                        full_day: { label: 'تمام‌وقت / روزانه', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300' },
                      };
                      const sInfo = shiftLabels[s.shiftType] || { label: s.shiftType, color: 'bg-slate-100 text-slate-700' };

                      return (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                              {s.supervisorName.slice(0, 1)}
                            </div>
                            <span>{s.supervisorName}</span>
                          </td>
                          <td className="p-3 font-medium text-slate-600 dark:text-slate-300">
                            {s.dormName}
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${s.isEveryDay ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                              {dayLabels[s.dayOfWeek] || s.dayOfWeek}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${sInfo.color}`}>
                              {sInfo.label}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] dir-ltr text-slate-500 dark:text-slate-400">
                            {s.startTime && s.endTime ? `${s.startTime} الی ${s.endTime}` : 'تمام وقت'}
                          </td>
                          <td className="p-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                            {s.notes || '-'}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                if (confirm(`آیا از حذف شیفت ${s.supervisorName} مطمئن هستید؟`)) {
                                  Storage.deleteShiftSchedule(s.id);
                                  setShiftSchedules(Storage.getShiftSchedules());
                                  setShiftFeedback('شیفت مورد نظر با موفقیت حذف گردید.');
                                }
                              }}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                              title="حذف این شیفت"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* بخش نمایش سرپرستان با حضور پیش‌فرض روزانه */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>کادر سرپرستی دارای وضعیت خودکار «حضور روزانه پیوسته در سرا» (بدون ثبت شیفت خاص):</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {supervisors
                  .filter((sup) => !shiftSchedules.some((s) => s.supervisorId === sup.id && !s.isEveryDay))
                  .map((sup) => (
                    <div
                      key={sup.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <span className="block font-bold text-xs text-slate-800 dark:text-slate-200">
                          {sup.fullName}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          حضور روزانه پیوسته (پیش‌فرض سیستم)
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                        هر روز
                      </span>
                    </div>
                  ))}
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

          {/* مودال ثبت دستی شیفت جدید توسط مدیر */}
          {isAddShiftModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl text-right">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-teal-600" />
                    <span>ثبت دستی شیفت سرپرست سرا</span>
                  </h3>
                  <button onClick={() => setIsAddShiftModalOpen(false)} className="p-1 hover:opacity-75 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const sup = supervisors.find((s) => s.id === newShiftSupId);
                    const dorm = dorms.find((d) => d.id === newShiftDormId);
                    if (!sup) return;

                    const newSchedule: SupervisorShiftSchedule = {
                      id: `shift_${Date.now()}`,
                      supervisorId: sup.id,
                      supervisorName: sup.fullName,
                      dormId: dorm ? dorm.id : 'all',
                      dormName: dorm ? dorm.name : 'سراهای دانشجویی',
                      dayOfWeek: newShiftDay,
                      shiftType: newShiftType,
                      startTime: newShiftStartTime,
                      endTime: newShiftEndTime,
                      notes: newShiftNotes,
                      isEveryDay: newShiftDay === 'all' || newShiftIsEveryDay,
                    };

                    Storage.addShiftSchedule(newSchedule);
                    setShiftSchedules(Storage.getShiftSchedules());
                    setIsAddShiftModalOpen(false);
                    setShiftFeedback(`شیفت جدید برای ${sup.fullName} با موفقیت ثبت شد.`);
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
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">روز هفته *</label>
                      <select
                        value={newShiftDay}
                        onChange={(e) => setNewShiftDay(e.target.value as DayOfWeek | 'all')}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                      >
                        <option value="all">همه روزها (حضور روزانه)</option>
                        <option value="saturday">شنبه</option>
                        <option value="sunday">یکشنبه</option>
                        <option value="monday">دوشنبه</option>
                        <option value="tuesday">سه‌شنبه</option>
                        <option value="wednesday">چهارشنبه</option>
                        <option value="thursday">پنجشنبه</option>
                        <option value="friday">جمعه</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">نوبت شیفت *</label>
                      <select
                        value={newShiftType}
                        onChange={(e) => {
                          const val = e.target.value as ShiftLogReport['shiftType'];
                          setNewShiftType(val);
                          if (val === 'morning') {
                            setNewShiftStartTime('۰۷:۳۰');
                            setNewShiftEndTime('۱۵:۳۰');
                          } else if (val === 'evening') {
                            setNewShiftStartTime('۱۵:۰۰');
                            setNewShiftEndTime('۲۳:۰۰');
                          } else if (val === 'night') {
                            setNewShiftStartTime('۲۲:۰۰');
                            setNewShiftEndTime('۰۷:۳۰');
                          } else {
                            setNewShiftStartTime('۰۸:۰۰');
                            setNewShiftEndTime('۲۰:۰۰');
                          }
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                      >
                        <option value="morning">شیفت صبح</option>
                        <option value="evening">شیفت عصر</option>
                        <option value="night">شیفت شب</option>
                        <option value="full_day">تمام‌وقت / روزانه</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ساعت شروع</label>
                      <input
                        type="text"
                        value={newShiftStartTime}
                        onChange={(e) => setNewShiftStartTime(e.target.value)}
                        placeholder="مثال: ۱۵:۰۰"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ساعت پایان</label>
                      <input
                        type="text"
                        value={newShiftEndTime}
                        onChange={(e) => setNewShiftEndTime(e.target.value)}
                        placeholder="مثال: ۲۳:۰۰"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">دستورکار و توضیحات</label>
                    <textarea
                      rows={2}
                      value={newShiftNotes}
                      onChange={(e) => setNewShiftNotes(e.target.value)}
                      placeholder="نظارت بر سالن مطالعه، گشت شبانه، هماهنگی سرکشی..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>ثبت و ذخیره شیفت</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddShiftModalOpen(false)}
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
                <h2 className="text-xl font-black">مرکز بهداشت روان و مشاوره سراهای دانشجویی</h2>
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
                        if (confirm(`آیا از حذف مشاور «${cns.fullName}» اطمینان دارید؟`)) {
                          Storage.deleteCounselor(cns.id);
                          setCounselorsList(Storage.getCounselors());
                          setCounselorFeedback(`مشاور «${cns.fullName}» حذف گردید.`);
                        }
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
                            alert(res.message);
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
                  مدیریت کل سراها به تمامی پیام‌های مشاوره، ارجاعات و تبادل نظرات مشاوران با دانشجوها دسترسی دارد
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
                  onSubmit={(e) => {
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
                      setCounselorsList(Storage.getCounselors());
                      setIsAddCounselorModalOpen(false);
                      setCounselorFeedback(`مشاور «${res.counselor.fullName}» با موفقیت افزوده شد.`);
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
                      <input
                        type="text"
                        value={newCnsShiftStartTime}
                        onChange={(e) => setNewCnsShiftStartTime(e.target.value)}
                        placeholder="۱۴:۰۰"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ساعت پایان</label>
                      <input
                        type="text"
                        value={newCnsShiftEndTime}
                        onChange={(e) => setNewCnsShiftEndTime(e.target.value)}
                        placeholder="۱۸:۰۰"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-center font-mono"
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
      {/* ۶. تب گزارش لاگ فعالیت‌ها و دسترسی‌های کاربران (Activity Log) */}
      {/* ========================================================= */}
      {mainTab === 'activity_log' && (() => {
        const roleLabelMap: Record<string, string> = {
          admin: 'مدیر کل',
          supervisor: 'سرپرست سرا',
          student: 'دانشجو',
          maintenance: 'تأسیسات',
          warehouse: 'مسئول انبار',
          counselor: 'مشاور',
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
          warning_eval: 'تذکر، اخطار و ارزیابی',
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
      {/* ۹. تب پیکربندی سیستم، ظاهر و صفحه اول */}
      {/* ========================================================= */}
      {mainTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* کارت دسترسی سریع به بخش مجزای مدیریت کاربران */}
          <div className="bg-gradient-to-r from-indigo-50 via-teal-50 to-slate-50 dark:from-indigo-950/30 dark:via-teal-950/30 dark:to-slate-900 rounded-3xl p-5 border border-indigo-200/70 dark:border-indigo-900/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
                { key: 'counselors' as const, label: `مشاوران (${counselorsList.length})` },
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

          {/* بخش تنظیمات سال تحصیلی، نیمسال و بازه زمانی مجاز انتخاب اتاق */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
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
                  متن بنر اطلاع‌رسانی بالای سایت
                </label>
                <input
                  type="text"
                  value={localSettings.announcementBanner || ''}
                  onChange={(e) => setLocalSettings((prev) => ({ ...prev, announcementBanner: e.target.value }))}
                  placeholder="متن پیام کوتاه برای نمایش در بالای تمام صفحات..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
                />
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
                  <input
                    type="text"
                    value={localSettings.selectionStartDate}
                    onChange={(e) => setLocalSettings((prev) => ({ ...prev, selectionStartDate: e.target.value }))}
                    placeholder="مثلاً 1403/07/01 - 08:00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تاریخ و ساعت پایان مهلت انتخاب اتاق
                  </label>
                  <input
                    type="text"
                    value={localSettings.selectionEndDate}
                    onChange={(e) => setLocalSettings((prev) => ({ ...prev, selectionEndDate: e.target.value }))}
                    placeholder="مثلاً 1403/07/15 - 23:59"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
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

          {/* بخش تطبیق و اتصال دسته‌جمعی عکس‌های دانشجویان از روی پوشه */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <FolderUp className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  بارگذاری دسته‌جمعی پوشه عکس‌های دانشجویان
                </h3>
                <p className="text-xs text-slate-400">
                  انتخاب مستقیم کل پوشه عکس‌ها؛ سامانه بر اساس شماره دانشجویی نام فایل، عکس‌ها را به پرونده متصل می‌کند.
                </p>
              </div>
            </div>

            {batchPhotoStatus && (
              <div
                className={`mb-4 p-4 rounded-2xl text-xs ${
                  batchPhotoStatus.type === 'loading'
                    ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                    : batchPhotoStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {batchPhotoStatus.type === 'loading' ? (
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : batchPhotoStatus.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{batchPhotoStatus.text}</span>
                </div>
              </div>
            )}

            <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-dashed border-indigo-300 dark:border-indigo-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-bold text-indigo-900 dark:text-indigo-200">
                  راهنمای بارگذاری پوشه عکس‌ها:
                </div>
                <div>
                  نام هر فایل عکس دقیقاً شماره دانشجویی دانشجو باشد (مثلاً: <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">4021001.jpg</span>).
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <label className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer hover:scale-105">
                  <FolderUp className="w-4 h-4" />
                  <span>انتخاب و بارگذاری کل پوشه عکس‌ها</span>
                  <input
                    type="file"
                    multiple
                    {...({ webkitdirectory: '', directory: '' } as any)}
                    onChange={handleBatchPhotosUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* بخش مدیریت و بارگذاری آرم دانشگاه */}
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

          {/* بخش مدیریت فونت‌های متعدد، انتخاب فونت نمایش و والپیپر اختصاصی */}
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

          {/* بخش شخصی‌سازی پس‌زمینه باکس اصلی (بنر معرفی سامانه) صفحه اول */}
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
                        <div className="text-base font-black">سامانه جامع سراهای دانشجویی</div>
                        <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-teal-900 text-[10px] font-extrabold shadow">
                          ورود به سامانه سراها
                        </div>
                      </div>
                      <Building2 className="w-20 h-20 text-white/20 relative z-10 shrink-0" />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* بخش ویرایش نکات مهم انتخاب اتاق و اسکان در صفحه اول سایت */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
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

          {/* بخش پشتیبان‌گیری و بازنشانی */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-2">
              پشتیبان‌گیری و بازگردانی داده‌های سامانه (Backup & Restore)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              جهت نگهداری دائمی اطلاعات، می‌توانید نسخه پشتیبان JSON دانلود کنید یا در مرورگر دیگر بازگردانی فرمایید.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleBackupExport}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>دانلود فایل پشتیبان کامل سامانه</span>
              </button>

              <label className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>بازیابی نسخه پشتیبان JSON</span>
                <input type="file" accept=".json" onChange={handleBackupImport} className="hidden" />
              </label>

              <button
                onClick={handleResetDefaults}
                className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer mr-auto"
              >
                <RotateCcw className="w-4 h-4" />
                <span>بازنشانی به تنظیمات پیش‌فرض دانشگاه</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* مدال افزودن یا ویرایش دانشجو توسط مدیر */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                <span>{editingStudent ? 'ویرایش مشخصات دانشجومعلم' : 'ثبت و افزودن دانشجومعلم جدید'}</span>
              </h3>
              <button
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

            <form onSubmit={handleSaveStudentSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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
                    disabled={!!editingStudent}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono disabled:opacity-60"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    کد ملی *
                  </label>
                  <input
                    type="text"
                    value={stFormNationalId}
                    onChange={(e) => setStFormNationalId(e.target.value)}
                    placeholder="مثلاً 1270001234"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رشته تحصیلی *
                  </label>
                  <input
                    type="text"
                    value={stFormField}
                    onChange={(e) => setStFormField(e.target.value)}
                    placeholder="آموزش ابتدایی، آموزش ریاضی و..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    required
                  />
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
                    شماره همراه دانشجو
                  </label>
                  <input
                    type="text"
                    value={stFormMobile}
                    onChange={(e) => setStFormMobile(e.target.value)}
                    placeholder="09130000000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono dir-ltr"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تلفن اضطراری / والدین
                  </label>
                  <input
                    type="text"
                    value={stFormEmergency}
                    onChange={(e) => setStFormEmergency(e.target.value)}
                    placeholder="09130000000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono dir-ltr"
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

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شماره تماس والدین / ولی
                  </label>
                  <input
                    type="text"
                    value={stFormParentPhone}
                    onChange={(e) => setStFormParentPhone(e.target.value)}
                    placeholder="09130000000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono dir-ltr"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاریخ تولد
                  </label>
                  <input
                    type="text"
                    value={stFormBirthDate}
                    onChange={(e) => setStFormBirthDate(e.target.value)}
                    placeholder="1382/01/01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono dir-ltr"
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

                {/* تصویر پرسنلی دانشجو (قابل تغییر یا حذف توسط مدیر) */}
                <div className="sm:col-span-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
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
                <div className="sm:col-span-2">
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
                  <span>{editingStudent ? 'ذخیره تغییرات' : 'ثبت دانشجو در سیستم'}</span>
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

      {/* لایت‌باکس بزرگ‌نمایی تصویر اطلاعیه برای مدیر */}
      {annPreviewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs cursor-pointer animate-in fade-in"
          onClick={() => setAnnPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={annPreviewImage}
              alt="پوستر اطلاعیه"
              className="max-h-[80vh] w-auto mx-auto rounded-2xl object-contain"
            />
            <div className="p-3 text-center">
              <button
                onClick={() => setAnnPreviewImage(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مدال تخصیص اتاق و تخت به دانشجو توسط مدیر */}
      {assigningStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <BedIcon className="w-5 h-5 text-teal-600" />
                <span>تخصیص اتاق و تخت به دانشجو</span>
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
                وضعیت فعلی: {assigningStudent.assignedBedId ? 'دارای اتاق (تخصیص مجدد/تغییر)' : 'فاقد اتاق و اسکان'}
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
                    const firstRoom = dormRooms[0]?.id || '';
                    setAssignTargetRoomId(firstRoom);
                    const availableBeds = beds.filter((b) => b.roomId === firstRoom && !b.studentId);
                    setAssignTargetBedId(availableBeds[0]?.id || '');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  {dorms.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.campus})
                    </option>
                  ))}
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
                  <span>تأیید و ثبت تخصیص اسکان</span>
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

    </div>
  );
};
