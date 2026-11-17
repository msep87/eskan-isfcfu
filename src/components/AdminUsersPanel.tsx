import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  Student,
  Dormitory,
  Room,
  Bed,
  Supervisor,
  MaintenanceStaff,
  WarehouseStaff,
  CounselorStaff,
  FinanceStaff,
  ProcurementStaff,
  EducationStaff,
  CulturalStaff,
  StudentAffairsStaff,
  SecurityStaff,
  ViceDeanStaff,
} from '../types';
import { Storage, compressAvatarImageFile } from '../utils/storage';
import { toEnglishDigits } from '../utils/excelUtils';
import { compareStudents } from '../utils/studentSearchSort';
import { ExcelImportTab } from './ExcelImportModal';
import { StudentRoomProfileModal } from './StudentRoomProfileModal';
import {
  Users,
  GraduationCap,
  Shield,
  ShieldCheck,
  Wrench,
  Package,
  HeartHandshake,
  Search,
  Filter,
  RotateCcw,
  UserPlus,
  FileSpreadsheet,
  Edit3,
  KeyRound,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  QrCode,
  Award,
  UserMinus,
  UserCheck,
  Bed as BedIcon,
  X,
  Save,
  Check,
  Download,
  SlidersHorizontal,
  Lock,
  Unlock,
  Camera,
  FolderUp,
  ImagePlus,
  Upload,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Wallet,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Landmark,
} from 'lucide-react';

export type UserCategoryKey =
  | 'students'
  | 'supervisors'
  | 'maintenance'
  | 'warehouse'
  | 'procurement'
  | 'counselors'
  | 'finance'
  | 'education'
  | 'cultural'
  | 'student_affairs'
  | 'security'
  | 'vice_dean';

interface AdminUsersPanelProps {
  activeCategory: UserCategoryKey;
  onCategoryChange: (cat: UserCategoryKey) => void;
  students: Student[];
  dorms: Dormitory[];
  rooms: Room[];
  beds: Bed[];
  supervisors: Supervisor[];
  maintenanceStaff: MaintenanceStaff[];
  warehouseStaff: WarehouseStaff[];
  counselors: CounselorStaff[];
  financeStaff: FinanceStaff[];
  procurementStaff: ProcurementStaff[];
  educationStaff: EducationStaff[];
  culturalStaff?: CulturalStaff[];
  studentAffairsStaff?: StudentAffairsStaff[];
  securityStaff?: SecurityStaff[];
  viceDeanStaff?: ViceDeanStaff[];
  onRefreshData: () => void;
  onOpenExcelModal: (tab: ExcelImportTab) => void;
  onOpenReports: () => void;
  onAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  onViewStudentCard: (student: Student) => void;
  onEvaluateStudent: (student: Student) => void;
  onAssignStudentRoom: (student: Student) => void;
  onEvictStudent: (student: Student) => void;
  studentSecondaryEditEnabled?: boolean;
  onToggleStudentSecondaryEdit?: () => void;
}

type StaffRole =
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
  | 'vice_dean';
type StudentSortKey =
  | 'default'
  | 'lastName'
  | 'fullName'
  | 'studentId'
  | 'fieldOfStudy'
  | 'entryTerm'
  | 'roomName';

export const AdminUsersPanel: React.FC<AdminUsersPanelProps> = ({
  activeCategory,
  onCategoryChange,
  students,
  dorms,
  rooms,
  beds,
  supervisors,
  maintenanceStaff,
  warehouseStaff,
  counselors,
  financeStaff,
  procurementStaff,
  educationStaff,
  culturalStaff = [],
  studentAffairsStaff = [],
  securityStaff = [],
  viceDeanStaff = [],
  onRefreshData,
  onOpenExcelModal,
  onOpenReports,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onViewStudentCard,
  onEvaluateStudent,
  onAssignStudentRoom,
  onEvictStudent,
  studentSecondaryEditEnabled = false,
  onToggleStudentSecondaryEdit,
}) => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // جستجوی پیشرفته دانشجویان
  const [showAdvancedStudentFilters, setShowAdvancedStudentFilters] = useState(true);
  const [stQuery, setStQuery] = useState('');
  const [stFieldFilter, setStFieldFilter] = useState('all');
  const [stEntryFilter, setStEntryFilter] = useState('all');
  const [stDormFilter, setStDormFilter] = useState('all');
  const [stRoomFilter, setStRoomFilter] = useState('');
  const [stAssignFilter, setStAssignFilter] = useState<'all' | 'confirmed' | 'temporary' | 'none'>('all');
  const [stProfileFilter, setStProfileFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [stLocationFilter, setStLocationFilter] = useState('');

  // مرتب‌سازی و صفحه‌بندی دانشجویان (پیش‌فرض ۵۰ دانشجو در هر صفحه برای بارگذاری سریع)
  const [stSortBy, setStSortBy] = useState<StudentSortKey>('default');
  const [stSortDir, setStSortDir] = useState<'asc' | 'desc'>('asc');
  const [studentPageSize, setStudentPageSize] = useState<number | 'all'>(50);
  const [studentCurrentPage, setStudentCurrentPage] = useState<number>(1);

  const deferredStQuery = useDeferredValue(stQuery);
  const deferredStRoomFilter = useDeferredValue(stRoomFilter);
  const deferredStLocationFilter = useDeferredValue(stLocationFilter);

  // مدال پرونده کامل دانشجو با کلیک روی نام (عکس، اخطار، تذکر، پیام، ارزیابی فردی و اتاق)
  const [profileModalStudentId, setProfileModalStudentId] = useState<string | null>(null);

  // جستجوی پیشرفته کارکنان (سرپرست، تأسیسات، انبار، مشاور)
  const [staffQuery, setStaffQuery] = useState('');
  const [staffDormFilter, setStaffDormFilter] = useState('all');
  const [staffStatusFilter, setStaffStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // مدال افزودن یا ویرایش کاربر (سرپرست، تأسیسات، انبار، مشاور)
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffModalRole, setStaffModalRole] = useState<StaffRole>('supervisor');
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [formFullName, setFormFullName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSpecialty, setFormSpecialty] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formOfficeLocation, setFormOfficeLocation] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formDormIds, setFormDormIds] = useState<string[]>([]);
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formError, setFormError] = useState('');

  // وضعیت بارگذاری جمعی عکس‌ها (پوشه یا چند فایل)
  const [batchPhotoStatus, setBatchPhotoStatus] = useState<{
    type: 'loading' | 'success' | 'error';
    text: string;
    unmatchedKeys?: string[];
  } | null>(null);

  // مدال تغییر یا ریست رمز عبور برای تمام نقش‌ها (از جمله دانشجو)
  const [passwordModalTarget, setPasswordModalTarget] = useState<{
    role: 'student' | StaffRole;
    id: string;
    fullName: string;
    usernameOrCode: string;
    defaultResetValue: string;
    defaultResetLabel: string;
  } | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // مدال تأیید حذف برای پرسنل (جلوگیری از window.confirm)
  const [deleteTarget, setDeleteTarget] = useState<{
    role: StaffRole;
    id: string;
    fullName: string;
  } | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setFeedback(null), 4000);
  };

  // تغییر/افزودن فوری عکس یک کاربر (تکی) از ردیف جدول با ارسال به فضای ابری
  const handleQuickSinglePhotoUpload = async (
    role: 'student' | StaffRole,
    id: string,
    fullName: string,
    e: React.ChangeEvent<HTMLInputElement>,
    cloudPhotoKey?: string
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      showToast('error', 'حجم تصویر انتخاب‌شده نباید بیشتر از ۶ مگابایت باشد.');
      return;
    }
    try {
      const compressed = await compressAvatarImageFile(file);
      const targetKey = (cloudPhotoKey || id).trim();
      const cloudRes = await Storage.uploadSinglePhotoToCloud(role, targetKey, compressed);
      const finalUrl = cloudRes.supported && cloudRes.ok ? cloudRes.url : compressed;

      if (role === 'student') {
        Storage.updateStudentAdmin(id, { photoUrl: finalUrl });
      } else if (role === 'supervisor') {
        const res = Storage.updateSupervisor(id, { photoUrl: finalUrl });
        if (!res.success) {
          showToast('error', res.message);
          return;
        }
      } else if (role === 'maintenance') {
        const res = Storage.updateMaintenanceStaff(id, { photoUrl: finalUrl });
        if (!res.success) {
          showToast('error', res.message);
          return;
        }
      } else if (role === 'warehouse') {
        const res = Storage.updateWarehouseStaff(id, { photoUrl: finalUrl });
        if (!res.success) {
          showToast('error', res.message);
          return;
        }
      } else if (role === 'counselor') {
        const res = Storage.updateCounselor(id, { photoUrl: finalUrl });
        if (!res.success) {
          showToast('error', res.message);
          return;
        }
      } else if (role === 'finance') {
        const res = Storage.updateFinanceStaff(id, { photoUrl: finalUrl });
        if (!res.success) {
          showToast('error', res.message);
          return;
        }
      } else if (role === 'procurement') {
        const res = Storage.updateProcurementStaff(id, { photoUrl: finalUrl });
        if (!res.success) {
          showToast('error', res.message);
          return;
        }
      } else if (role === 'education') {
        const res = Storage.updateEducationStaff(id, { photoUrl: finalUrl });
        if (!res.success) {
          showToast('error', res.message);
          return;
        }
      } else if (role === 'cultural') {
        const res = Storage.updateCulturalStaff(id, { photoUrl: finalUrl });
        if (!res.success) {
          showToast('error', res.message);
          return;
        }
      } else if (role === 'student_affairs') {
        const res = Storage.updateStudentAffairsStaff(id, { photoUrl: finalUrl });
        if (!res.success) {
          showToast('error', res.message);
          return;
        }
      } else if (role === 'security') {
        const res = Storage.updateSecurityStaff(id, { photoUrl: finalUrl });
        if (!res.success) {
          showToast('error', res.message);
          return;
        }
      } else if (role === 'vice_dean') {
        const res = Storage.updateViceDeanStaff(id, { photoUrl: finalUrl });
        if (!res.success) {
          showToast('error', res.message);
          return;
        }
      }

      const syncRes = await Storage.waitForPendingCloudSync();
      onRefreshData();

      if (!cloudRes.supported) {
        showToast(
          'error',
          `عکس «${fullName}» فعلاً فقط در این مرورگر ثبت شد؛ برای نمایش در سیستم‌های دیگر، فایل جدید server.js را در بک‌اند khabgah-api قرار دهید.`
        );
      } else if (!cloudRes.ok || !syncRes.success) {
        showToast(
          'error',
          cloudRes.errorMessage || `عکس «${fullName}» در مرورگر ثبت شد اما همگام‌سازی ابری با خطا مواجه گردید.`
        );
      } else {
        showToast('success', `تصویر «${fullName}» با موفقیت در فضای ابری ذخیره و همگام‌سازی شد.`);
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'خطا در پردازش تصویر.');
    }
  };

  // پردازش جمعی پوشه یا چند فایل عکس برای دانشجویان (بر اساس کد دانشجویی) و سایر کاربران (بر اساس نام/کد کاربری)
  const handleBatchPhotosImport = async (
    targetRole: 'student' | StaffRole,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp)$/i.test(f.name)
    );
    e.target.value = '';

    if (imageFiles.length === 0) {
      setBatchPhotoStatus({
        type: 'error',
        text: 'هیچ فایل تصویری معتبری (JPG / PNG / WebP) در انتخاب شما یافت نشد.',
      });
      return;
    }

    setBatchPhotoStatus({
      type: 'loading',
      text: `در حال خواندن و تطبیق ${imageFiles.length} فایل تصویر با لیست کاربران...`,
    });

    const normKey = (v: string) => toEnglishDigits(v).trim().toLowerCase();
    const matchedEntries: Array<{
      lookupKey: string;
      cloudUserId: string;
      file: File;
    }> = [];
    const unmatchedKeys: string[] = [];

    for (const file of imageFiles) {
      const dotIdx = file.name.lastIndexOf('.');
      const rawBase = dotIdx > 0 ? file.name.substring(0, dotIdx) : file.name;
      const cleanBase = toEnglishDigits(rawBase).trim();
      const key =
        targetRole === 'student' ? cleanBase.match(/\d+/)?.[0] || cleanBase : cleanBase;
      if (!key) continue;

      if (targetRole === 'student') {
        const nk = normKey(key);
        const found = students.find((s) => normKey(s.studentId) === nk);
        if (found) {
          matchedEntries.push({ lookupKey: found.studentId, cloudUserId: found.studentId, file });
        } else {
          unmatchedKeys.push(rawBase.trim());
        }
      } else {
        const nk = normKey(key);
        const pool: Array<{ id: string; username: string }> =
          targetRole === 'supervisor'
            ? supervisors
            : targetRole === 'maintenance'
            ? maintenanceStaff
            : targetRole === 'warehouse'
            ? warehouseStaff
            : targetRole === 'procurement'
            ? procurementStaff
            : targetRole === 'finance'
            ? financeStaff
            : targetRole === 'education'
            ? educationStaff
            : targetRole === 'cultural'
            ? culturalStaff
            : targetRole === 'student_affairs'
            ? studentAffairsStaff
            : targetRole === 'security'
            ? securityStaff
            : targetRole === 'vice_dean'
            ? viceDeanStaff
            : counselors;
        const found = pool.find((u) => normKey(u.username) === nk || normKey(u.id) === nk);
        if (found) {
          matchedEntries.push({
            lookupKey: found.username || found.id,
            cloudUserId: (found.username || found.id).trim(),
            file,
          });
        } else {
          unmatchedKeys.push(rawBase.trim());
        }
      }
    }

    const identifierHint =
      targetRole === 'student' ? 'شماره دانشجویی' : 'نام/کد کاربری';

    if (matchedEntries.length === 0) {
      setBatchPhotoStatus({
        type: 'error',
        text: `هیچ‌یک از ${imageFiles.length} تصویر با ${identifierHint} کاربران موجود مطابقت نداشت.`,
        unmatchedKeys: unmatchedKeys.slice(0, 12),
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
        compressedMap[entry.lookupKey] = dataUrl;
        cloudItems.push({ userId: entry.cloudUserId, dataUrl });
      } catch {
        // فایل تصویر خراب نادیده گرفته می‌شود
      }
    }

    const cloudRes = await Storage.uploadPhotosToCloud(targetRole, cloudItems);

    if (cloudRes.supported && cloudRes.ok) {
      const urlPhotoMap: Record<string, string> = {};
      matchedEntries.forEach((entry) => {
        const u = cloudRes.urls[entry.cloudUserId];
        if (u) urlPhotoMap[entry.lookupKey] = u;
      });

      const result =
        targetRole === 'student'
          ? Storage.batchAssignStudentPhotos(urlPhotoMap)
          : Storage.batchAssignStaffPhotos(targetRole, urlPhotoMap);

      const syncRes = await Storage.waitForPendingCloudSync();
      onRefreshData();

      if (!result.saved) {
        setBatchPhotoStatus({
          type: 'error',
          text: 'ذخیره‌سازی آدرس تصاویر در حافظه مرورگر با خطا مواجه شد.',
        });
      } else {
        setBatchPhotoStatus({
          type: syncRes.success ? 'success' : 'error',
          text: syncRes.success
            ? `تعداد ${result.matchedCount} عکس با موفقیت در دیتابیس ابری (MongoDB) ذخیره شد و در همه سیستم‌ها قابل مشاهده است.`
            : `عکس‌ها در سرور ذخیره شدند اما همگام‌سازی لیست با خطا مواجه شد.`,
          unmatchedKeys: unmatchedKeys.slice(0, 12),
        });
      }
      return;
    }

    if (!cloudRes.supported) {
      // سرور بک‌اند هنوز مسیر /api/photos/batch را ندارد: تلاش برای ذخیره موقت محلی با هشدار صریح
      const result =
        targetRole === 'student'
          ? Storage.batchAssignStudentPhotos(compressedMap)
          : Storage.batchAssignStaffPhotos(targetRole, compressedMap);
      const syncRes = await Storage.waitForPendingCloudSync();
      onRefreshData();

      if (!result.saved) {
        setBatchPhotoStatus({
          type: 'error',
          text: 'مسیر ذخیره ابری عکس‌ها (/api/photos/batch) در سرور khabgah-api فعال نیست و حافظه مرورگر نیز ظرفیت ذخیره مستقیم این تصاویر را ندارد. لطفاً فایل server.js بک‌اند را بروزرسانی کنید.',
          unmatchedKeys: unmatchedKeys.slice(0, 12),
        });
      } else {
        setBatchPhotoStatus({
          type: syncRes.success ? 'error' : 'error',
          text: `هشدار: ${result.matchedCount} عکس فقط در مرورگر فعلی ثبت شد و برای مشاهده در سیستم‌های دیگر باید فایل جدید server.js (شامل /api/photos/batch) را در بک‌اند khabgah-api جایگزین کنید.`,
          unmatchedKeys: unmatchedKeys.slice(0, 12),
        });
      }
      return;
    }

    setBatchPhotoStatus({
      type: 'error',
      text:
        cloudRes.errorMessage ||
        'بارگذاری تصاویر در فضای ابری با خطا مواجه شد. لطفاً اتصال اینترنت و وضعیت سرور khabgah-api را بررسی کنید.',
      unmatchedKeys: unmatchedKeys.slice(0, 12),
    });
  };

  const toggleRevealPassword = (key: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const norm = (v?: string | number | null) =>
    toEnglishDigits(String(v ?? '')).trim().toLowerCase();

  // استخراج مقادیر یکتا برای فیلترهای دانشجویی
  const uniqueFields = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.fieldOfStudy?.trim()) set.add(s.fieldOfStudy.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  const uniqueEntryTerms = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.entryTerm?.trim()) set.add(s.entryTerm.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  const dormLookupMap = useMemo(() => new Map(dorms.map((dm) => [dm.id, dm])), [dorms]);
  const roomLookupMap = useMemo(() => new Map(rooms.map((rm) => [rm.id, rm])), [rooms]);
  const bedLookupMap = useMemo(() => new Map(beds.map((bd) => [bd.id, bd])), [beds]);

  // ایندکس پیش‌محاسبه‌شده جستجوی دانشجویان برای فیلتر سریع بدون کندی تایپ
  const studentSearchIndex = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((st) => {
      const blob = [
        st.fullName,
        st.studentId,
        st.nationalId,
        st.mobile,
        st.phone,
        st.emergencyPhone,
        st.parentPhone,
        st.fatherName,
        st.fieldOfStudy,
        st.city,
        st.province,
        st.postalAddress,
      ]
        .map(norm)
        .join(' ');
      map.set(st.studentId, blob);
    });
    return map;
  }, [students]);

  // فیلتر پیشرفته دانشجویان
  const filteredStudents = useMemo(() => {
    const q = norm(deferredStQuery);
    const roomQ = norm(deferredStRoomFilter);
    const locQ = norm(deferredStLocationFilter);

    return students.filter((st) => {
      if (q) {
        const haystack = studentSearchIndex.get(st.studentId) || '';
        if (!haystack.includes(q)) return false;
      }

      if (stFieldFilter !== 'all' && (st.fieldOfStudy || '').trim() !== stFieldFilter) {
        return false;
      }

      if (stEntryFilter !== 'all' && (st.entryTerm || '').trim() !== stEntryFilter) {
        return false;
      }

      if (stDormFilter === 'unassigned') {
        if (st.assignedBedId && st.assignmentStatus !== 'none') return false;
      } else if (stDormFilter !== 'all') {
        if (st.assignedDormId !== stDormFilter) return false;
      }

      if (roomQ) {
        const r = st.assignedRoomId ? roomLookupMap.get(st.assignedRoomId) : undefined;
        const roomNumberStr = norm(r?.roomNumber || st.assignedRoomNumber);
        if (!roomNumberStr.includes(roomQ)) return false;
      }

      if (stAssignFilter !== 'all') {
        const status = st.assignedBedId ? st.assignmentStatus || 'temporary' : 'none';
        if (status !== stAssignFilter) return false;
      }

      if (stProfileFilter === 'completed' && !st.isProfileCompleted) return false;
      if (stProfileFilter === 'incomplete' && st.isProfileCompleted) return false;

      if (locQ) {
        const locStr = `${norm(st.province)} ${norm(st.city)} ${norm(st.postalAddress)}`;
        if (!locStr.includes(locQ)) return false;
      }

      return true;
    });
  }, [
    students,
    studentSearchIndex,
    roomLookupMap,
    deferredStQuery,
    stFieldFilter,
    stEntryFilter,
    stDormFilter,
    deferredStRoomFilter,
    stAssignFilter,
    stProfileFilter,
    deferredStLocationFilter,
  ]);

  const sortedStudents = useMemo(() => {
    if (stSortBy === 'default') return filteredStudents;
    const list = [...filteredStudents];
    list.sort((a, b) => compareStudents(a, b, stSortBy, stSortDir, rooms, dorms));
    return list;
  }, [filteredStudents, stSortBy, stSortDir, rooms, dorms]);

  // بازنشانی به صفحه ۱ هنگام تغییر فیلتر، مرتب‌سازی یا تعداد نمایش در صفحه
  useEffect(() => {
    setStudentCurrentPage(1);
  }, [
    deferredStQuery,
    stFieldFilter,
    stEntryFilter,
    stDormFilter,
    deferredStRoomFilter,
    stAssignFilter,
    stProfileFilter,
    deferredStLocationFilter,
    stSortBy,
    stSortDir,
    studentPageSize,
  ]);

  const totalStudentsCount = sortedStudents.length;
  const effectiveStudentPageSize =
    studentPageSize === 'all' ? Math.max(1, totalStudentsCount) : studentPageSize;
  const totalStudentPages =
    studentPageSize === 'all'
      ? 1
      : Math.max(1, Math.ceil(totalStudentsCount / effectiveStudentPageSize));
  const safeStudentPage = Math.min(Math.max(1, studentCurrentPage), totalStudentPages);
  const studentStartIndex =
    studentPageSize === 'all' ? 0 : (safeStudentPage - 1) * effectiveStudentPageSize;
  const studentEndIndex =
    studentPageSize === 'all'
      ? totalStudentsCount
      : Math.min(totalStudentsCount, studentStartIndex + effectiveStudentPageSize);

  const paginatedStudents = useMemo(() => {
    if (studentPageSize === 'all') return sortedStudents;
    return sortedStudents.slice(studentStartIndex, studentEndIndex);
  }, [sortedStudents, studentPageSize, studentStartIndex, studentEndIndex]);

  const studentPageNumbers = useMemo(() => {
    if (totalStudentPages <= 1) return [] as Array<number | 'ellipsis-start' | 'ellipsis-end'>;
    if (totalStudentPages <= 7) {
      return Array.from({ length: totalStudentPages }, (_, i) => i + 1);
    }
    const pages: Array<number | 'ellipsis-start' | 'ellipsis-end'> = [1];
    const windowStart = Math.max(2, safeStudentPage - 1);
    const windowEnd = Math.min(totalStudentPages - 1, safeStudentPage + 1);
    if (windowStart > 2) pages.push('ellipsis-start');
    for (let p = windowStart; p <= windowEnd; p += 1) {
      pages.push(p);
    }
    if (windowEnd < totalStudentPages - 1) pages.push('ellipsis-end');
    pages.push(totalStudentPages);
    return pages;
  }, [totalStudentPages, safeStudentPage]);

  const toggleStudentSort = (key: Exclude<StudentSortKey, 'default'>) => {
    if (stSortBy === key) {
      setStSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setStSortBy(key);
      setStSortDir('asc');
    }
  };

  const renderSortIcon = (key: Exclude<StudentSortKey, 'default'>) => {
    if (stSortBy !== key) return <ArrowUpDown className="w-3.5 h-3.5 opacity-45 shrink-0" />;
    return stSortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
    );
  };

  const hasActiveStudentFilters =
    Boolean(stQuery.trim()) ||
    stFieldFilter !== 'all' ||
    stEntryFilter !== 'all' ||
    stDormFilter !== 'all' ||
    Boolean(stRoomFilter.trim()) ||
    stAssignFilter !== 'all' ||
    stProfileFilter !== 'all' ||
    Boolean(stLocationFilter.trim()) ||
    stSortBy !== 'default';

  const resetStudentFilters = () => {
    setStQuery('');
    setStFieldFilter('all');
    setStEntryFilter('all');
    setStDormFilter('all');
    setStRoomFilter('');
    setStAssignFilter('all');
    setStProfileFilter('all');
    setStLocationFilter('');
    setStSortBy('default');
    setStSortDir('asc');
  };

  // فیلتر کارکنان
  const filteredSupervisors = useMemo(() => {
    const q = norm(staffQuery);
    return supervisors.filter((sup) => {
      if (q) {
        const txt = `${norm(sup.fullName)} ${norm(sup.username)} ${norm(sup.phone)}`;
        if (!txt.includes(q)) return false;
      }
      if (staffDormFilter !== 'all') {
        const ids =
          sup.assignedDormIds && sup.assignedDormIds.length > 0
            ? sup.assignedDormIds
            : sup.assignedDormId && sup.assignedDormId !== 'all'
            ? [sup.assignedDormId]
            : dorms.map((d) => d.id);
        if (!ids.includes(staffDormFilter)) return false;
      }
      return true;
    });
  }, [supervisors, dorms, staffQuery, staffDormFilter]);

  const filteredMaintenance = useMemo(() => {
    const q = norm(staffQuery);
    return maintenanceStaff.filter((tech) => {
      const isActive = tech.status !== 'inactive' && tech.isActive !== false;
      if (staffStatusFilter === 'active' && !isActive) return false;
      if (staffStatusFilter === 'inactive' && isActive) return false;

      if (q) {
        const txt = `${norm(tech.fullName)} ${norm(tech.username)} ${norm(tech.specialty)} ${norm(
          tech.mobile || tech.phone
        )}`;
        if (!txt.includes(q)) return false;
      }

      if (staffDormFilter !== 'all') {
        const ids = tech.coveredDormIds || tech.assignedDormIds || [];
        if (!ids.includes(staffDormFilter) && !ids.includes('all')) return false;
      }

      return true;
    });
  }, [maintenanceStaff, staffQuery, staffDormFilter, staffStatusFilter]);

  const filteredWarehouse = useMemo(() => {
    const q = norm(staffQuery);
    return warehouseStaff.filter((wh) => {
      const isActive = wh.status !== 'inactive' && wh.isActive !== false;
      if (staffStatusFilter === 'active' && !isActive) return false;
      if (staffStatusFilter === 'inactive' && isActive) return false;

      if (q) {
        const txt = `${norm(wh.fullName)} ${norm(wh.username)} ${norm(wh.mobile || wh.phone)} ${norm(
          wh.notes
        )}`;
        if (!txt.includes(q)) return false;
      }
      return true;
    });
  }, [warehouseStaff, staffQuery, staffStatusFilter]);

  const filteredCounselors = useMemo(() => {
    const q = norm(staffQuery);
    return counselors.filter((cns) => {
      const isActive = cns.status !== 'inactive' && cns.isActive !== false;
      if (staffStatusFilter === 'active' && !isActive) return false;
      if (staffStatusFilter === 'inactive' && isActive) return false;

      if (q) {
        const txt = `${norm(cns.fullName)} ${norm(cns.username)} ${norm(cns.specialty)} ${norm(
          cns.officeLocation
        )} ${norm(cns.mobile || cns.phone)}`;
        if (!txt.includes(q)) return false;
      }

      if (staffDormFilter !== 'all') {
        const ids = cns.assignedDormIds || [];
        if (!ids.includes(staffDormFilter) && !ids.includes('all')) return false;
      }
      return true;
    });
  }, [counselors, staffQuery, staffDormFilter, staffStatusFilter]);

  const filteredFinance = useMemo(() => {
    const q = norm(staffQuery);
    return financeStaff.filter((fin) => {
      const isActive = fin.status !== 'inactive' && fin.isActive !== false;
      if (staffStatusFilter === 'active' && !isActive) return false;
      if (staffStatusFilter === 'inactive' && isActive) return false;

      if (q) {
        const txt = `${norm(fin.fullName)} ${norm(fin.username)} ${norm(fin.mobile || fin.phone)} ${norm(
          fin.department
        )} ${norm(fin.notes)}`;
        if (!txt.includes(q)) return false;
      }
      return true;
    });
  }, [financeStaff, staffQuery, staffStatusFilter]);

  const filteredProcurement = useMemo(() => {
    const q = norm(staffQuery);
    return procurementStaff.filter((proc) => {
      const isActive = proc.status !== 'inactive' && proc.isActive !== false;
      if (staffStatusFilter === 'active' && !isActive) return false;
      if (staffStatusFilter === 'inactive' && isActive) return false;

      if (q) {
        const txt = `${norm(proc.fullName)} ${norm(proc.username)} ${norm(proc.mobile || proc.phone)} ${norm(
          proc.department
        )} ${norm(proc.notes)}`;
        if (!txt.includes(q)) return false;
      }
      return true;
    });
  }, [procurementStaff, staffQuery, staffStatusFilter]);

  const filteredEducation = useMemo(() => {
    const q = norm(staffQuery);
    return educationStaff.filter((edu) => {
      const isActive = edu.status !== 'inactive' && edu.isActive !== false;
      if (staffStatusFilter === 'active' && !isActive) return false;
      if (staffStatusFilter === 'inactive' && isActive) return false;

      if (q) {
        const txt = `${norm(edu.fullName)} ${norm(edu.username)} ${norm(edu.mobile || edu.phone)} ${norm(
          edu.department
        )} ${norm(edu.notes)}`;
        if (!txt.includes(q)) return false;
      }
      return true;
    });
  }, [educationStaff, staffQuery, staffStatusFilter]);

  const filteredCultural = useMemo(() => {
    const q = norm(staffQuery);
    return culturalStaff.filter((cul) => {
      const isActive = cul.status !== 'inactive' && cul.isActive !== false;
      if (staffStatusFilter === 'active' && !isActive) return false;
      if (staffStatusFilter === 'inactive' && isActive) return false;

      if (q) {
        const txt = `${norm(cul.fullName)} ${norm(cul.username)} ${norm(cul.mobile || cul.phone)} ${norm(
          cul.department
        )} ${norm(cul.notes)}`;
        if (!txt.includes(q)) return false;
      }
      return true;
    });
  }, [culturalStaff, staffQuery, staffStatusFilter]);

  const filteredStudentAffairs = useMemo(() => {
    const q = norm(staffQuery);
    return studentAffairsStaff.filter((sa) => {
      const isActive = sa.status !== 'inactive' && sa.isActive !== false;
      if (staffStatusFilter === 'active' && !isActive) return false;
      if (staffStatusFilter === 'inactive' && isActive) return false;

      if (q) {
        const txt = `${norm(sa.fullName)} ${norm(sa.username)} ${norm(sa.mobile || sa.phone)} ${norm(
          sa.department
        )} ${norm(sa.notes)}`;
        if (!txt.includes(q)) return false;
      }
      return true;
    });
  }, [studentAffairsStaff, staffQuery, staffStatusFilter]);

  const filteredSecurity = useMemo(() => {
    const q = norm(staffQuery);
    return securityStaff.filter((sec) => {
      const isActive = sec.status !== 'inactive' && sec.isActive !== false;
      if (staffStatusFilter === 'active' && !isActive) return false;
      if (staffStatusFilter === 'inactive' && isActive) return false;

      if (staffDormFilter !== 'all') {
        const ids = sec.coveredDormIds || ['all'];
        if (!ids.includes('all') && !ids.includes(staffDormFilter)) return false;
      }

      if (q) {
        const txt = `${norm(sec.fullName)} ${norm(sec.username)} ${norm(sec.mobile || sec.phone)} ${norm(
          sec.department
        )} ${norm(sec.badgeCode)} ${norm(sec.notes)}`;
        if (!txt.includes(q)) return false;
      }
      return true;
    });
  }, [securityStaff, staffQuery, staffStatusFilter, staffDormFilter]);

  const filteredViceDean = useMemo(() => {
    const q = norm(staffQuery);
    return viceDeanStaff.filter((vd) => {
      const isActive = vd.status !== 'inactive' && vd.isActive !== false;
      if (staffStatusFilter === 'active' && !isActive) return false;
      if (staffStatusFilter === 'inactive' && isActive) return false;
      if (q) {
        const txt = `${norm(vd.fullName)} ${norm(vd.username)} ${norm(vd.mobile || vd.phone)} ${norm(
          vd.department
        )} ${norm(vd.title)} ${norm(vd.notes)}`;
        if (!txt.includes(q)) return false;
      }
      return true;
    });
  }, [viceDeanStaff, staffQuery, staffStatusFilter]);

  // باز کردن مدال افزودن کاربر پرسنل
  const openAddStaffModal = (role: StaffRole) => {
    setStaffModalRole(role);
    setEditingStaffId(null);
    setFormFullName('');
    setFormUsername('');
    setFormPassword('');
    setFormPhone('');
    setFormSpecialty('');
    setFormDepartment(
      role === 'finance'
        ? 'واحد امور مالی و حسابداری'
        : role === 'procurement'
        ? 'واحد کارپردازی و خرید'
        : role === 'education'
        ? 'واحد امور آموزشی'
        : role === 'cultural'
        ? 'واحد امور فرهنگی و اجتماعی سراها'
        : role === 'student_affairs'
        ? 'اداره امور دانشجویی، تربیت بدنی و رفاهی'
        : role === 'security'
        ? 'واحد حراست و انتظامات'
        : role === 'vice_dean'
        ? 'معاونت دانشجویی دانشگاه فرهنگیان'
        : ''
    );
    setFormOfficeLocation(role === 'vice_dean' ? 'معاون دانشجویی' : '');
    setFormNotes('');
    setFormActive(true);
    setFormPhotoUrl('');
    setFormDormIds(
      role === 'supervisor'
        ? dorms[0]?.id
          ? [dorms[0].id]
          : []
        : dorms.map((d) => d.id)
    );
    setFormError('');
    setStaffModalOpen(true);
  };

  // باز کردن مدال ویرایش کاربر پرسنل
  const openEditStaffModal = (
    role: StaffRole,
    user:
      | Supervisor
      | MaintenanceStaff
      | WarehouseStaff
      | CounselorStaff
      | FinanceStaff
      | ProcurementStaff
      | EducationStaff
      | CulturalStaff
      | StudentAffairsStaff
      | SecurityStaff
      | ViceDeanStaff
  ) => {
    setStaffModalRole(role);
    setEditingStaffId(user.id);
    setFormFullName(user.fullName || '');
    setFormUsername(user.username || '');
    setFormPassword(user.password || '');
    setFormPhone(('mobile' in user && user.mobile) || user.phone || '');
    setFormPhotoUrl(user.photoUrl || '');
    setFormError('');

    if (role === 'supervisor') {
      const sup = user as Supervisor;
      const ids =
        sup.assignedDormIds && sup.assignedDormIds.length > 0
          ? sup.assignedDormIds
          : sup.assignedDormId && sup.assignedDormId !== 'all'
          ? [sup.assignedDormId]
          : dorms.map((d) => d.id);
      setFormDormIds(ids);
      setFormActive(true);
    } else if (role === 'maintenance') {
      const tech = user as MaintenanceStaff;
      setFormSpecialty(tech.specialty || '');
      setFormNotes(tech.notes || '');
      setFormActive(tech.status !== 'inactive' && tech.isActive !== false);
      const rawIds = tech.coveredDormIds || tech.assignedDormIds || [];
      setFormDormIds(rawIds.length === 0 || rawIds.includes('all') ? dorms.map((d) => d.id) : rawIds);
    } else if (role === 'warehouse') {
      const wh = user as WarehouseStaff;
      setFormNotes(wh.notes || '');
      setFormActive(wh.status !== 'inactive' && wh.isActive !== false);
    } else if (role === 'counselor') {
      const cns = user as CounselorStaff;
      setFormSpecialty(cns.specialty || '');
      setFormOfficeLocation(cns.officeLocation || '');
      setFormNotes(cns.notes || '');
      setFormActive(cns.status !== 'inactive' && cns.isActive !== false);
      const rawIds = cns.assignedDormIds || [];
      setFormDormIds(rawIds.length === 0 || rawIds.includes('all') ? dorms.map((d) => d.id) : rawIds);
    } else if (role === 'finance') {
      const fin = user as FinanceStaff;
      setFormDepartment(fin.department || 'واحد امور مالی و حسابداری');
      setFormNotes(fin.notes || '');
      setFormActive(fin.status !== 'inactive' && fin.isActive !== false);
    } else if (role === 'procurement') {
      const proc = user as ProcurementStaff;
      setFormDepartment(proc.department || 'واحد کارپردازی و خرید');
      setFormNotes(proc.notes || '');
      setFormActive(proc.status !== 'inactive' && proc.isActive !== false);
    } else if (role === 'education') {
      const edu = user as EducationStaff;
      setFormDepartment(edu.department || 'واحد امور آموزشی');
      setFormNotes(edu.notes || '');
      setFormActive(edu.status !== 'inactive' && edu.isActive !== false);
    } else if (role === 'cultural') {
      const cul = user as CulturalStaff;
      setFormDepartment(cul.department || 'واحد امور فرهنگی و اجتماعی سراها');
      setFormNotes(cul.notes || '');
      setFormActive(cul.status !== 'inactive' && cul.isActive !== false);
    } else if (role === 'student_affairs') {
      const sa = user as StudentAffairsStaff;
      setFormDepartment(sa.department || 'اداره امور دانشجویی، تربیت بدنی و رفاهی');
      setFormNotes(sa.notes || '');
      setFormActive(sa.status !== 'inactive' && sa.isActive !== false);
    } else if (role === 'security') {
      const sec = user as SecurityStaff;
      setFormDepartment(sec.department || 'واحد حراست و انتظامات');
      setFormOfficeLocation(sec.badgeCode || '');
      setFormNotes(sec.notes || '');
      setFormActive(sec.status !== 'inactive' && sec.isActive !== false);
      const rawIds = sec.coveredDormIds || [];
      setFormDormIds(rawIds.length === 0 || rawIds.includes('all') ? dorms.map((d) => d.id) : rawIds);
    } else if (role === 'vice_dean') {
      const vd = user as ViceDeanStaff;
      setFormDepartment(vd.department || 'معاونت دانشجویی دانشگاه فرهنگیان');
      setFormOfficeLocation(vd.title || 'معاون دانشجویی');
      setFormNotes(vd.notes || '');
      setFormActive(vd.status !== 'inactive' && vd.isActive !== false);
    }

    setStaffModalOpen(true);
  };

  const handleModalStaffPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setFormError('حجم تصویر انتخاب‌شده نباید بیشتر از ۶ مگابایت باشد.');
      return;
    }
    try {
      const compressed = await compressAvatarImageFile(file);
      setFormPhotoUrl(compressed);
      setFormError('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'خطا در بارگذاری تصویر.');
    }
  };

  const handleSaveStaffModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanName = formFullName.trim();
    const cleanUser = toEnglishDigits(formUsername.trim()).toLowerCase();
    const cleanPass = toEnglishDigits(formPassword.trim());
    const cleanPhone = toEnglishDigits(formPhone.trim()) || '09130000000';

    if (!cleanName || !cleanUser || !cleanPass) {
      setFormError('لطفاً نام و نام خانوادگی، نام کاربری و کلمه عبور را وارد نمایید.');
      return;
    }

    let resolvedPhotoUrl = formPhotoUrl;
    if (resolvedPhotoUrl && resolvedPhotoUrl.startsWith('data:image/')) {
      const cloudRes = await Storage.uploadSinglePhotoToCloud(
        staffModalRole,
        cleanUser,
        resolvedPhotoUrl
      );
      if (cloudRes.supported && cloudRes.ok) {
        resolvedPhotoUrl = cloudRes.url;
      }
    }

    if (staffModalRole === 'supervisor') {
      const dormIds = formDormIds.length > 0 ? formDormIds : dorms[0]?.id ? [dorms[0].id] : ['all'];
      if (editingStaffId) {
        const res = Storage.updateSupervisor(editingStaffId, {
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          assignedDormIds: dormIds,
          assignedDormId: dormIds[0] || 'all',
        });
        if (!res.success) {
          setFormError(res.message);
          return;
        }
        showToast('success', res.message);
      } else {
        const list = Storage.getSupervisors();
        if (list.some((s) => s.username.trim().toLowerCase() === cleanUser)) {
          setFormError('این نام کاربری قبلاً برای سرپرست دیگری ثبت شده است.');
          return;
        }
        list.push({
          id: `sup_${Date.now()}`,
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          assignedDormId: dormIds[0] || 'all',
          assignedDormIds: dormIds,
          role: 'supervisor',
        });
        Storage.setSupervisors(list);
        showToast('success', `سرپرست «${cleanName}» با موفقیت ثبت شد.`);
      }
    } else if (staffModalRole === 'maintenance') {
      const dormIds = formDormIds.length > 0 ? formDormIds : dorms.map((d) => d.id);
      const spec = formSpecialty.trim() || 'تأسیسات عمومی و فنی';
      if (editingStaffId) {
        const res = Storage.updateMaintenanceStaff(editingStaffId, {
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          mobile: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          specialty: spec,
          coveredDormIds: dormIds,
          assignedDormIds: dormIds,
          status: formActive ? 'active' : 'inactive',
          isActive: formActive,
          notes: formNotes.trim() || undefined,
        });
        if (!res.success) {
          setFormError(res.message);
          return;
        }
        showToast('success', res.message);
      } else {
        const res = Storage.addMaintenanceStaff({
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          mobile: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          specialty: spec,
          coveredDormIds: dormIds,
          assignedDormIds: dormIds,
          role: 'maintenance',
          status: formActive ? 'active' : 'inactive',
          isActive: formActive,
          notes: formNotes.trim() || undefined,
        });
        if (!res.success) {
          setFormError(res.message);
          return;
        }
        showToast('success', res.message);
      }
    } else if (staffModalRole === 'warehouse') {
      if (editingStaffId) {
        const res = Storage.updateWarehouseStaff(editingStaffId, {
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          mobile: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          status: formActive ? 'active' : 'inactive',
          isActive: formActive,
          notes: formNotes.trim() || undefined,
        });
        if (!res.success) {
          setFormError(res.message);
          return;
        }
        showToast('success', res.message);
      } else {
        const res = Storage.addWarehouseStaff({
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          mobile: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          role: 'warehouse',
          status: formActive ? 'active' : 'inactive',
          isActive: formActive,
          notes: formNotes.trim() || undefined,
        });
        if (!res.success) {
          setFormError(res.message);
          return;
        }
        showToast('success', res.message);
      }
    } else if (staffModalRole === 'counselor') {
      const dormIds = formDormIds.length > 0 ? formDormIds : dorms.map((d) => d.id);
      const spec = formSpecialty.trim() || 'مشاوره و سلامت روان';
      if (editingStaffId) {
        const res = Storage.updateCounselor(editingStaffId, {
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          mobile: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          specialty: spec,
          officeLocation: formOfficeLocation.trim() || 'مرکز مشاوره پردیس',
          assignedDormIds: dormIds,
          status: formActive ? 'active' : 'inactive',
          isActive: formActive,
          notes: formNotes.trim() || undefined,
        });
        if (!res.success) {
          setFormError(res.message);
          return;
        }
        showToast('success', res.message || `مشخصات مشاور «${cleanName}» با موفقیت بروزرسانی شد.`);
      } else {
        const existing = Storage.getCounselors();
        if (existing.some((c) => c.username.trim().toLowerCase() === cleanUser)) {
          setFormError('این نام کاربری قبلاً برای مشاور دیگری ثبت شده است.');
          return;
        }
        Storage.addCounselor({
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          mobile: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          specialty: spec,
          officeLocation: formOfficeLocation.trim() || 'مرکز مشاوره پردیس',
          assignedDormIds: dormIds,
          role: 'counselor',
          status: formActive ? 'active' : 'inactive',
          isActive: formActive,
          notes: formNotes.trim() || undefined,
        });
        showToast('success', `مشاور «${cleanName}» با موفقیت ثبت شد.`);
      }
    } else if (staffModalRole === 'finance') {
      if (editingStaffId) {
        const res = Storage.updateFinanceStaff(editingStaffId, {
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          mobile: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          department: formDepartment.trim() || 'واحد امور مالی و حسابداری',
          status: formActive ? 'active' : 'inactive',
          isActive: formActive,
          notes: formNotes.trim() || undefined,
        });
        if (!res.success) {
          setFormError(res.message);
          return;
        }
        showToast('success', res.message);
      } else {
        const res = Storage.addFinanceStaff({
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          mobile: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          department: formDepartment.trim() || 'واحد امور مالی و حسابداری',
          role: 'finance',
          status: formActive ? 'active' : 'inactive',
          isActive: formActive,
          notes: formNotes.trim() || undefined,
        });
        if (!res.success) {
          setFormError(res.message);
          return;
        }
        showToast('success', res.message);
      }
    } else if (staffModalRole === 'procurement') {
      if (editingStaffId) {
        const res = Storage.updateProcurementStaff(editingStaffId, {
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          mobile: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          department: formDepartment.trim() || 'واحد کارپردازی و خرید',
          status: formActive ? 'active' : 'inactive',
          isActive: formActive,
          notes: formNotes.trim() || undefined,
        });
        if (!res.success) {
          setFormError(res.message);
          return;
        }
        showToast('success', res.message);
      } else {
        const res = Storage.addProcurementStaff({
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          mobile: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          department: formDepartment.trim() || 'واحد کارپردازی و خرید',
          role: 'procurement',
          status: formActive ? 'active' : 'inactive',
          isActive: formActive,
          notes: formNotes.trim() || undefined,
        });
        if (!res.success) {
          setFormError(res.message);
          return;
        }
        showToast('success', res.message);
      }
    } else if (staffModalRole === 'education') {
      if (editingStaffId) {
        const res = Storage.updateEducationStaff(editingStaffId, {
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          mobile: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          department: formDepartment.trim() || 'واحد امور آموزشی',
          status: formActive ? 'active' : 'inactive',
          isActive: formActive,
          notes: formNotes.trim() || undefined,
        });
        if (!res.success) {
          setFormError(res.message);
          return;
        }
        showToast('success', res.message);
      } else {
        const res = Storage.addEducationStaff({
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          mobile: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          department: formDepartment.trim() || 'واحد امور آموزشی',
          role: 'education',
          status: formActive ? 'active' : 'inactive',
          isActive: formActive,
          notes: formNotes.trim() || undefined,
        });
        if (!res.success) {
          setFormError(res.message);
          return;
        }
        showToast('success', res.message);
      }
    } else if (staffModalRole === 'cultural') {
      if (editingStaffId) {
        const res = Storage.updateCulturalStaff(editingStaffId, {
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          mobile: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          department: formDepartment.trim() || 'واحد امور فرهنگی و اجتماعی سراها',
          status: formActive ? 'active' : 'inactive',
          isActive: formActive,
          notes: formNotes.trim() || undefined,
        });
        if (!res.success) {
          setFormError(res.message);
          return;
        }
        showToast('success', res.message);
      } else {
        const res = Storage.addCulturalStaff({
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          mobile: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          department: formDepartment.trim() || 'واحد امور فرهنگی و اجتماعی سراها',
          role: 'cultural',
          status: formActive ? 'active' : 'inactive',
          isActive: formActive,
          notes: formNotes.trim() || undefined,
        });
        if (!res.success) {
          setFormError(res.message);
          return;
        }
        showToast('success', res.message);
      }
    } else if (staffModalRole === 'student_affairs') {
      if (editingStaffId) {
        const res = Storage.updateStudentAffairsStaff(editingStaffId, {
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          mobile: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          department: formDepartment.trim() || 'اداره امور دانشجویی، تربیت بدنی و رفاهی',
          status: formActive ? 'active' : 'inactive',
          isActive: formActive,
          notes: formNotes.trim() || undefined,
        });
        if (!res.success) {
          setFormError(res.message);
          return;
        }
        showToast('success', res.message);
      } else {
        const res = Storage.addStudentAffairsStaff({
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          mobile: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          department: formDepartment.trim() || 'اداره امور دانشجویی، تربیت بدنی و رفاهی',
          role: 'student_affairs',
          status: formActive ? 'active' : 'inactive',
          isActive: formActive,
          notes: formNotes.trim() || undefined,
        });
        if (!res.success) {
          setFormError(res.message);
          return;
        }
        showToast('success', res.message);
      }
    } else if (staffModalRole === 'security') {
      const dormIds = formDormIds.length > 0 ? formDormIds : ['all'];
      if (editingStaffId) {
        const res = Storage.updateSecurityStaff(editingStaffId, {
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          mobile: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          department: formDepartment.trim() || 'واحد حراست و انتظامات',
          badgeCode: formOfficeLocation.trim() || undefined,
          coveredDormIds: dormIds,
          status: formActive ? 'active' : 'inactive',
          isActive: formActive,
          notes: formNotes.trim() || undefined,
        });
        if (!res.success) {
          setFormError(res.message);
          return;
        }
        showToast('success', res.message);
      } else {
        const res = Storage.addSecurityStaff({
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          mobile: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          department: formDepartment.trim() || 'واحد حراست و انتظامات',
          badgeCode: formOfficeLocation.trim() || undefined,
          coveredDormIds: dormIds,
          role: 'security',
          status: formActive ? 'active' : 'inactive',
          isActive: formActive,
          notes: formNotes.trim() || undefined,
        });
        if (!res.success) {
          setFormError(res.message);
          return;
        }
        showToast('success', res.message);
      }
    } else if (staffModalRole === 'vice_dean') {
      if (editingStaffId) {
        const res = Storage.updateViceDeanStaff(editingStaffId, {
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          mobile: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          department: formDepartment.trim() || 'معاونت دانشجویی دانشگاه فرهنگیان',
          title: formOfficeLocation.trim() || 'معاون دانشجویی',
          status: formActive ? 'active' : 'inactive',
          isActive: formActive,
          notes: formNotes.trim() || undefined,
        });
        if (!res.success) {
          setFormError(res.message);
          return;
        }
        showToast('success', res.message);
      } else {
        const res = Storage.addViceDeanStaff({
          fullName: cleanName,
          username: cleanUser,
          password: cleanPass,
          phone: cleanPhone,
          mobile: cleanPhone,
          photoUrl: resolvedPhotoUrl || undefined,
          department: formDepartment.trim() || 'معاونت دانشجویی دانشگاه فرهنگیان',
          title: formOfficeLocation.trim() || 'معاون دانشجویی',
          role: 'vice_dean',
          status: formActive ? 'active' : 'inactive',
          isActive: formActive,
          notes: formNotes.trim() || undefined,
        });
        if (!res.success) {
          setFormError(res.message);
          return;
        }
        showToast('success', res.message);
      }
    }

    await Storage.waitForPendingCloudSync();
    setStaffModalOpen(false);
    onRefreshData();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalTarget) return;
    setPasswordError('');
    const res = Storage.adminResetUserPassword(
      passwordModalTarget.role,
      passwordModalTarget.id,
      newPasswordInput
    );
    if (!res.success) {
      setPasswordError(res.message);
      return;
    }
    setPasswordModalTarget(null);
    setNewPasswordInput('');
    onRefreshData();
    showToast('success', res.message);
  };

  const handleQuickResetPassword = () => {
    if (!passwordModalTarget) return;
    const res = Storage.adminResetUserPassword(
      passwordModalTarget.role,
      passwordModalTarget.id,
      passwordModalTarget.defaultResetValue
    );
    if (!res.success) {
      setPasswordError(res.message);
      return;
    }
    setPasswordModalTarget(null);
    setNewPasswordInput('');
    onRefreshData();
    showToast('success', res.message);
  };

  const handleConfirmDeleteStaff = () => {
    if (!deleteTarget) return;
    if (deleteTarget.role === 'supervisor') {
      const updated = Storage.getSupervisors().filter((s) => s.id !== deleteTarget.id);
      Storage.setSupervisors(updated);
      showToast('success', `سرپرست «${deleteTarget.fullName}» حذف گردید.`);
    } else if (deleteTarget.role === 'maintenance') {
      const res = Storage.deleteMaintenanceStaff(deleteTarget.id);
      showToast('success', res.message);
    } else if (deleteTarget.role === 'warehouse') {
      const res = Storage.deleteWarehouseStaff(deleteTarget.id);
      showToast('success', res.message);
    } else if (deleteTarget.role === 'counselor') {
      Storage.deleteCounselor(deleteTarget.id);
      showToast('success', `مشاور «${deleteTarget.fullName}» حذف گردید.`);
    } else if (deleteTarget.role === 'finance') {
      const res = Storage.deleteFinanceStaff(deleteTarget.id);
      showToast('success', res.message);
    } else if (deleteTarget.role === 'procurement') {
      const res = Storage.deleteProcurementStaff(deleteTarget.id);
      showToast('success', res.message);
    } else if (deleteTarget.role === 'education') {
      const res = Storage.deleteEducationStaff(deleteTarget.id);
      showToast('success', res.message);
    } else if (deleteTarget.role === 'cultural') {
      const res = Storage.deleteCulturalStaff(deleteTarget.id);
      showToast('success', res.message);
    } else if (deleteTarget.role === 'student_affairs') {
      const res = Storage.deleteStudentAffairsStaff(deleteTarget.id);
      showToast('success', res.message);
    } else if (deleteTarget.role === 'security') {
      const res = Storage.deleteSecurityStaff(deleteTarget.id);
      showToast('success', res.message);
    } else if (deleteTarget.role === 'vice_dean') {
      const res = Storage.deleteViceDeanStaff(deleteTarget.id);
      showToast('success', res.message);
    }
    setDeleteTarget(null);
    onRefreshData();
  };

  const roleCategories = [
    {
      key: 'students' as const,
      title: 'دانشجویان (دانشجومعلمان)',
      subtitle: 'مشاهده، جستجوی پیشرفته، ویرایش، ریست رمز و اسکان',
      count: students.length,
      icon: GraduationCap,
      activeBg: 'bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-600/25',
      badgeBg: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
    },
    {
      key: 'supervisors' as const,
      title: 'سرپرستان سراها',
      subtitle: 'تعیین سراهای تحت نظارت، ویرایش و تغییر رمز',
      count: supervisors.length,
      icon: ShieldCheck,
      activeBg: 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/25',
      badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
    },
    {
      key: 'maintenance' as const,
      title: 'پرسنل تأسیسات و فنی',
      subtitle: 'تخصص‌ها، محدوده سراها، فعال‌سازی و رمز عبور',
      count: maintenanceStaff.length,
      icon: Wrench,
      activeBg: 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-600/25',
      badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    },
    {
      key: 'warehouse' as const,
      title: 'مسئولان انبار',
      subtitle: 'مدیریت موجودی انبار، حواله‌ها و ارجاع خرید',
      count: warehouseStaff.length,
      icon: Package,
      activeBg: 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-600/25',
      badgeBg: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
    },
    {
      key: 'procurement' as const,
      title: 'کارپردازی و خرید',
      subtitle: 'خرید اقلام ناموجود، قیمت‌گذاری و تحویل به انبار',
      count: procurementStaff.length,
      icon: ShoppingBag,
      activeBg: 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-600/25',
      badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
    },
    {
      key: 'counselors' as const,
      title: 'مشاوران و روانشناسان',
      subtitle: 'مشاوران مرکز بهداشت روان، دفتر و دسترسی‌ها',
      count: counselors.length,
      icon: HeartHandshake,
      activeBg: 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-600/25',
      badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    },
    {
      key: 'finance' as const,
      title: 'امور مالی و حسابداری',
      subtitle: 'کارشناسان مالی، کسورات، اکسل بدهی و پیام',
      count: financeStaff.length,
      icon: Wallet,
      activeBg: 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/25',
      badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    },
    {
      key: 'education' as const,
      title: 'کارشناس آموزش',
      subtitle: 'پیام‌های آموزشی دانشجویان و اعلام مرخصی/اخراج به مدیر',
      count: educationStaff.length,
      icon: GraduationCap,
      activeBg: 'bg-sky-600 text-white border-sky-600 shadow-lg shadow-sky-600/25',
      badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
    },
    {
      key: 'cultural' as const,
      title: 'امور فرهنگی',
      subtitle: 'جدول کلاسی هفتگی برنامه‌ها، تشکل‌ها، انجمن‌ها و پیام‌ها',
      count: culturalStaff.length,
      icon: FileText,
      activeBg: 'bg-fuchsia-600 text-white border-fuchsia-600 shadow-lg shadow-fuchsia-600/25',
      badgeBg: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300',
    },
    {
      key: 'student_affairs' as const,
      title: 'امور دانشجویی و تربیت بدنی',
      subtitle: 'مشاهده خوابگاهی/ترددی، انتخابات شورای صنفی و شورای انضباطی',
      count: studentAffairsStaff.length,
      icon: Award,
      activeBg: 'bg-indigo-700 text-white border-indigo-700 shadow-lg shadow-indigo-700/25',
      badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
    },
    {
      key: 'security' as const,
      title: 'حراست و انتظامات',
      subtitle: 'دریافت گزارش‌های حراستی، مشاهده اطلاعات، امتیازات و اخطارها',
      count: securityStaff.length,
      icon: Shield,
      activeBg: 'bg-slate-800 text-amber-300 border-slate-700 shadow-lg shadow-slate-900/25',
      badgeBg: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-amber-300',
    },
    {
      key: 'vice_dean' as const,
      title: 'معاونت دانشجویی',
      subtitle: 'تجمیع سرپرستی، امور دانشجویی و فرهنگی، گزارش جامع و پایش پیام‌ها',
      count: viceDeanStaff.length,
      icon: Landmark,
      activeBg: 'bg-indigo-900 text-cyan-200 border-indigo-700 shadow-lg shadow-indigo-900/25',
      badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-cyan-300',
    },
  ];

  const roleLabels: Record<StaffRole, string> = {
    supervisor: 'سرپرست سرا',
    maintenance: 'کارشناس تأسیسات',
    warehouse: 'مسئول انبار',
    procurement: 'کارپرداز و خرید',
    counselor: 'کارشناس مشاوره و روانشناسی',
    finance: 'کارشناس امور مالی و حسابداری',
    education: 'کارشناس آموزش',
    cultural: 'کارشناس امور فرهنگی',
    student_affairs: 'کارشناس امور دانشجویی و تربیت بدنی',
    security: 'کارشناس حراست و انتظامات',
    vice_dean: 'معاونت دانشجویی',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* سربرگ بخش جامع مدیریت کاربران */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-teal-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/15 shrink-0">
              <Users className="w-7 h-7 text-teal-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black">
                مدیریت متمرکز و تفکیکی کاربران سامانه
              </h2>
              <p className="text-xs text-teal-100/80 mt-1">
                بخش کاربر مورد نظر را انتخاب کنید تا امکان مشاهده، جستجوی پیشرفته، ویرایش، تغییر یا ریست رمز عبور و ورود تکی/گروهی با اکسل در اختیارتان قرار گیرد.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-4 py-2.5 rounded-2xl border border-white/10 shrink-0">
            <span>مجموع کل کاربران:</span>
            <span className="text-base font-black text-teal-300">
              {students.length +
                supervisors.length +
                maintenanceStaff.length +
                warehouseStaff.length +
                procurementStaff.length +
                counselors.length +
                financeStaff.length +
                educationStaff.length +
                culturalStaff.length +
                studentAffairsStaff.length +
                securityStaff.length +
                viceDeanStaff.length}
            </span>
          </div>
        </div>

        {/* دکمه‌های تفکیکی انتخاب نوع کاربر */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-5 pt-5 border-t border-white/15">
          {roleCategories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                  onClick={() => {
                  onCategoryChange(cat.key);
                  setStaffQuery('');
                  setStaffDormFilter('all');
                  setStaffStatusFilter('all');
                  setBatchPhotoStatus(null);
                }}
                className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between gap-2 cursor-pointer ${
                  isActive
                    ? cat.activeBg
                    : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
                }`}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="p-2 rounded-xl bg-white/15 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/25 text-white' : 'bg-black/25 text-teal-200'
                    }`}
                  >
                    {cat.count} نفر
                  </span>
                </div>
                <div>
                  <div className="font-extrabold text-xs sm:text-sm">{cat.title}</div>
                  <div
                    className={`text-[10px] mt-0.5 line-clamp-2 ${
                      isActive ? 'text-white/90' : 'text-slate-300'
                    }`}
                  >
                    {cat.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* پیام بازخورد عملیات کاربران */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-2 text-xs font-bold border animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* پیام بازخورد بارگذاری جمعی عکس‌ها */}
      {batchPhotoStatus && (
        <div
          className={`p-4 rounded-2xl text-xs border animate-in fade-in space-y-2 ${
            batchPhotoStatus.type === 'loading'
              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800'
              : batchPhotoStatus.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold">
              {batchPhotoStatus.type === 'loading' ? (
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
              ) : batchPhotoStatus.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{batchPhotoStatus.text}</span>
            </div>
            {batchPhotoStatus.type !== 'loading' && (
              <button
                type="button"
                onClick={() => setBatchPhotoStatus(null)}
                className="p-1 hover:opacity-75 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {batchPhotoStatus.unmatchedKeys && batchPhotoStatus.unmatchedKeys.length > 0 && (
            <div className="text-[11px] opacity-90 pt-1 border-t border-current/15">
              <span>موارد تطبیق‌نیافته: </span>
              <span className="font-mono" dir="ltr">
                {batchPhotoStatus.unmatchedKeys.join(' ، ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* ۱. بخش دانشجویان (با جستجوی پیشرفته چندفیلدی) */}
      {/* ========================================================= */}
      {activeCategory === 'students' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          {/* نوار ابزار بالا */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  مدیریت دانشجویان ({filteredStudents.length} از {students.length} دانشجو)
                </h3>
                <p className="text-xs text-slate-400">
                  جستجوی پیشرفته بر اساس نام، کد دانشجویی، کد ملی، رشته، ورودی، سرا، اتاق، وضعیت اسکان و محل سکونت
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onToggleStudentSecondaryEdit && (
                <button
                  type="button"
                  onClick={onToggleStudentSecondaryEdit}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border shadow-xs ${
                    studentSecondaryEditEnabled
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 hover:bg-amber-100'
                  }`}
                  title="باز یا بسته کردن امکان ویرایش مجدد اطلاعات و تغییر عکس توسط دانشجو پس از ثبت اولیه"
                >
                  {studentSecondaryEditEnabled ? (
                    <Unlock className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Lock className="w-4 h-4 text-amber-600" />
                  )}
                  <span>
                    {studentSecondaryEditEnabled
                      ? 'ویرایش ثانویه و تغییر عکس دانشجو: باز (کلیک برای بستن)'
                      : 'ویرایش ثانویه و تغییر عکس دانشجو: بسته (کلیک برای باز کردن)'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={onAddStudent}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>افزودن دانشجوی تکی</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenExcelModal('students')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>ورود گروهی با اکسل</span>
              </button>

              <label
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="انتخاب پوشه شامل تصاویر دانشجویان با نام کد دانشجویی (مثلاً 40214545.jpg یا 40214545.png)"
              >
                <FolderUp className="w-4 h-4" />
                <span>وارد کردن پوشه عکس‌ها</span>
                <input
                  type="file"
                  multiple
                  {...({ webkitdirectory: '', directory: '' } as any)}
                  onChange={(e) => handleBatchPhotosImport('student', e)}
                  className="hidden"
                />
              </label>

              <label
                className="px-3.5 py-2 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-700 dark:text-sky-200 border border-sky-200 dark:border-sky-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="انتخاب چند فایل عکس هم‌زمان با نام شماره دانشجویی (مثلاً 40214545.jpg)"
              >
                <ImagePlus className="w-4 h-4" />
                <span>انتخاب چند عکس</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleBatchPhotosImport('student', e)}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={onOpenReports}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>خروجی اکسل جامع</span>
              </button>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/20 border border-cyan-200/80 dark:border-cyan-900/40 text-[11px] text-cyan-900 dark:text-cyan-200 flex flex-wrap items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
            <span>
              <strong>ثبت عکس دانشجویان:</strong> برای ثبت جمعی از دکمه «وارد کردن پوشه عکس‌ها» استفاده کنید؛ نام هر فایل باید شماره دانشجویی باشد (مثلاً{' '}
              <span className="font-mono font-bold" dir="ltr">40214545.jpg</span> یا{' '}
              <span className="font-mono font-bold" dir="ltr">40214545.png</span>). برای ثبت تکی از دکمه دوربین هر ردیف یا دکمه ویرایش استفاده نمایید.
            </span>
          </div>

          {/* پنل جستجوی پیشرفته دانشجویان */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="جستجوی فوری در نام، شماره دانشجویی، کد ملی، شماره همراه، نام پدر، شهر یا نشانی..."
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

              {hasActiveStudentFilters && (
                <button
                  type="button"
                  onClick={resetStudentFilters}
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
                    رشته تحصیلی:
                  </label>
                  <select
                    value={stFieldFilter}
                    onChange={(e) => setStFieldFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="all">همه رشته‌ها ({uniqueFields.length})</option>
                    {uniqueFields.map((f) => (
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
                    <option value="all">همه ورودی‌ها ({uniqueEntryTerms.length})</option>
                    {uniqueEntryTerms.map((term) => (
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
                    <option value="unassigned">فقط دانشجویان فاقد اسکان</option>
                    {dorms.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

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
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="all">همه وضعیت‌ها</option>
                    <option value="confirmed">اسکان قطعی (تأیید شده)</option>
                    <option value="temporary">اسکان موقت (در انتظار تأیید)</option>
                    <option value="none">فاقد اتاق و تخت</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    وضعیت تکمیل پرونده:
                  </label>
                  <select
                    value={stProfileFilter}
                    onChange={(e) => setStProfileFilter(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="all">همه پرونده‌ها</option>
                    <option value="completed">تکمیل شده</option>
                    <option value="incomplete">پرونده ناقص</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    استان، شهر یا نشانی محل سکونت:
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً اصفهان، کاشان، شهرضا..."
                    value={stLocationFilter}
                    onChange={(e) => setStLocationFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                {/* کنترل‌های مرتب‌سازی جدول دانشجویان */}
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
                      <option value="fieldOfStudy">رشته تحصیلی</option>
                      <option value="entryTerm">سال / ترم ورودی</option>
                      <option value="roomName">نام / شماره اتاق</option>
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
                  </div>

                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    نکته: با کلیک بر روی <strong className="text-teal-700 dark:text-teal-300">نام هر دانشجو</strong>، فرم کامل اطلاعات، عکس، اخطار، تذکر، پیام و نمره ارزیابی باز می‌شود.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* جدول دانشجویان + نوار صفحه‌بندی سریع */}
          {filteredStudents.length === 0 ? (
            <div className="p-10 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-400 space-y-2">
              <p>هیچ دانشجویی با معیارهای جستجوی انتخاب‌شده یافت نشد.</p>
              {hasActiveStudentFilters && (
                <button
                  type="button"
                  onClick={resetStudentFilters}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 text-white font-bold cursor-pointer"
                >
                  نمایش همه دانشجویان
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* نوار صفحه‌بندی و تنظیم تعداد نمایش در صفحه (بالای جدول) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
                  <span>
                    نمایش{' '}
                    <span className="text-teal-700 dark:text-teal-300 font-black">
                      {(studentStartIndex + 1).toLocaleString('fa-IR')}
                    </span>{' '}
                    تا{' '}
                    <span className="text-teal-700 dark:text-teal-300 font-black">
                      {studentEndIndex.toLocaleString('fa-IR')}
                    </span>{' '}
                    از{' '}
                    <span className="font-black">
                      {totalStudentsCount.toLocaleString('fa-IR')}
                    </span>{' '}
                    دانشجو
                  </span>
                  {studentPageSize !== 'all' && (
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      (صفحه {safeStudentPage.toLocaleString('fa-IR')} از{' '}
                      {totalStudentPages.toLocaleString('fa-IR')})
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <span>تعداد در صفحه:</span>
                    <select
                      value={studentPageSize}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStudentPageSize(val === 'all' ? 'all' : Number(val));
                        setStudentCurrentPage(1);
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
                    >
                      <option value={25}>۲۵ دانشجو</option>
                      <option value={50}>۵۰ دانشجو (پیش‌فرض)</option>
                      <option value={100}>۱۰۰ دانشجو</option>
                      <option value={200}>۲۰۰ دانشجو</option>
                      <option value={500}>۵۰۰ دانشجو</option>
                      <option value="all">
                        همه دانشجویان ({totalStudentsCount.toLocaleString('fa-IR')} نفر)
                      </option>
                    </select>
                  </label>

                  {totalStudentPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setStudentCurrentPage(1)}
                        disabled={safeStudentPage <= 1}
                        className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                        title="صفحه اول"
                      >
                        <ChevronsRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safeStudentPage <= 1}
                        className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition inline-flex items-center gap-1 font-bold text-[11px]"
                        title="صفحه قبلی"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span>قبلی</span>
                      </button>

                      <div className="hidden sm:flex items-center gap-1">
                        {studentPageNumbers.map((item) =>
                          typeof item === 'string' ? (
                            <span
                              key={item}
                              className="px-1.5 text-slate-400 select-none font-bold"
                            >
                              ...
                            </span>
                          ) : (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setStudentCurrentPage(item)}
                              className={`min-w-[28px] h-7 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                                item === safeStudentPage
                                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              {item.toLocaleString('fa-IR')}
                            </button>
                          )
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setStudentCurrentPage((p) => Math.min(totalStudentPages, p + 1))
                        }
                        disabled={safeStudentPage >= totalStudentPages}
                        className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition inline-flex items-center gap-1 font-bold text-[11px]"
                        title="صفحه بعدی"
                      >
                        <span>بعدی</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentCurrentPage(totalStudentPages)}
                        disabled={safeStudentPage >= totalStudentPages}
                        className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                        title="صفحه آخر"
                      >
                        <ChevronsLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-3 w-12 text-center">ردیف</th>
                      <th className="p-3">
                        <button
                          type="button"
                          onClick={() => toggleStudentSort('studentId')}
                          className="inline-flex items-center gap-1 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer transition"
                          title="مرتب‌سازی بر اساس کد دانشجویی"
                        >
                          <span>شماره دانشجویی</span>
                          {renderSortIcon('studentId')}
                        </button>
                      </th>
                      <th className="p-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => toggleStudentSort('lastName')}
                            className="inline-flex items-center gap-1 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer transition"
                            title="مرتب‌سازی بر اساس نام خانوادگی"
                          >
                            <span>نام و نام خانوادگی</span>
                            {renderSortIcon('lastName')}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStudentSort('lastName')}
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
                      <th className="p-3">کد ملی / رمز ورود</th>
                      <th className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => toggleStudentSort('fieldOfStudy')}
                            className="inline-flex items-center gap-1 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer transition"
                            title="مرتب‌سازی بر اساس رشته تحصیلی"
                          >
                            <span>رشته</span>
                            {renderSortIcon('fieldOfStudy')}
                          </button>
                          <span className="text-slate-300 dark:text-slate-600">/</span>
                          <button
                            type="button"
                            onClick={() => toggleStudentSort('entryTerm')}
                            className="inline-flex items-center gap-1 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer transition"
                            title="مرتب‌سازی بر اساس سال/ترم ورودی"
                          >
                            <span>ورودی</span>
                            {renderSortIcon('entryTerm')}
                          </button>
                        </div>
                      </th>
                      <th className="p-3">وضعیت پرونده</th>
                      <th className="p-3">
                        <button
                          type="button"
                          onClick={() => toggleStudentSort('roomName')}
                          className="inline-flex items-center gap-1 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer transition"
                          title="مرتب‌سازی بر اساس نام / شماره اتاق"
                        >
                          <span>خوابگاه / اتاق و تخت</span>
                          {renderSortIcon('roomName')}
                        </button>
                      </th>
                      <th className="p-3">تماس و شهر</th>
                      <th className="p-3 text-center">عملیات و مدیریت حساب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedStudents.map((st, rowIdx) => {
                      const d = st.assignedDormId ? dormLookupMap.get(st.assignedDormId) : undefined;
                      const r = st.assignedRoomId ? roomLookupMap.get(st.assignedRoomId) : undefined;
                      const b = st.assignedBedId ? bedLookupMap.get(st.assignedBedId) : undefined;
                      const passKey = `student_${st.studentId}`;
                      const isShown = revealedPasswords[passKey];

                      return (
                        <tr key={st.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 text-center text-[11px] font-bold text-slate-400 tabular-nums">
                            {(studentStartIndex + rowIdx + 1).toLocaleString('fa-IR')}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                            {st.studentId}
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <button
                              type="button"
                              onClick={() => setProfileModalStudentId(st.studentId)}
                              className="flex items-center gap-2 text-right group cursor-pointer rounded-xl p-1 -m-1 hover:bg-teal-50/80 dark:hover:bg-teal-950/40 transition w-full"
                              title="مشاهده کامل اطلاعات و عکس دانشجو، ثبت اخطار، تذکر، پیام و نمره ارزیابی"
                            >
                              {st.photoUrl ? (
                                <img
                                  src={st.photoUrl}
                                  alt={st.fullName}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-transparent group-hover:ring-teal-500 transition"
                                />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 ring-2 ring-transparent group-hover:ring-teal-500 transition"
                                  style={{ backgroundColor: st.avatarColor || '#0d9488' }}
                                >
                                  {(st.fullName || 'د').slice(0, 1)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 underline decoration-dotted decoration-teal-500/50 underline-offset-4 transition">
                                  {st.fullName}
                                </div>
                                {st.fatherName && (
                                  <div className="text-[10px] text-slate-400 font-normal">
                                    فرزند {st.fatherName}
                                  </div>
                                )}
                              </div>
                            </button>
                          </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              {isShown ? (st.password || st.nationalId || '-') : '••••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleRevealPassword(passKey)}
                              className="p-1 text-slate-400 hover:text-teal-600 cursor-pointer"
                              title={isShown ? 'مخفی کردن' : 'نمایش کد ملی / رمز ورود'}
                            >
                              {isShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{st.fieldOfStudy || '-'}</div>
                          <div className="text-[10px] text-slate-400">ورودی {st.entryTerm || '-'}</div>
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
                              پرونده ناقص
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {d && r && b ? (
                            <div>
                              <span className="font-bold text-teal-600">اتاق {r.roomNumber}</span>
                              <span className="text-[11px] text-slate-400 block">
                                {d.name} - {b.label}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">فاقد اسکان</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-mono text-[11px]" dir="ltr">
                            {st.mobile || '-'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {[st.province, st.city].filter(Boolean).join(' - ') || '-'}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setProfileModalStudentId(st.studentId)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-teal-100 hover:text-teal-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                              title="مشاهده پرونده کامل، عکس، ثبت اخطار، تذکر، پیام و نمره ارزیابی"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            <label
                              className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 border border-cyan-200 dark:border-cyan-800 transition cursor-pointer"
                              title="بارگذاری یا تغییر سریع عکس دانشجو"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleQuickSinglePhotoUpload('student', st.studentId, st.fullName, e)
                                }
                                className="hidden"
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => onEditStudent(st)}
                              className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                              title="ویرایش مشخصات دانشجو"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setPasswordError('');
                                setNewPasswordInput('');
                                setPasswordModalTarget({
                                  role: 'student',
                                  id: st.studentId,
                                  fullName: st.fullName,
                                  usernameOrCode: st.studentId,
                                  defaultResetValue: st.nationalId || st.studentId,
                                  defaultResetLabel: st.nationalId
                                    ? `ریست رمز به کد ملی (${st.nationalId})`
                                    : `ریست رمز به شماره دانشجویی (${st.studentId})`,
                                });
                              }}
                              className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                              title="تغییر یا ریست رمز ورود دانشجو"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onViewStudentCard(st)}
                              className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border border-teal-200 dark:border-teal-800 transition cursor-pointer"
                              title="کارت شناسایی و اسکان سرا"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onEvaluateStudent(st)}
                              className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 transition cursor-pointer"
                              title="ثبت تذکر، اخطار یا نمره ارزیابی"
                            >
                              <Award className="w-3.5 h-3.5" />
                            </button>

                            {st.assignedBedId && st.assignmentStatus !== 'none' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onAssignStudentRoom(st)}
                                  className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 hover:bg-sky-100 border border-sky-200 dark:border-sky-800 transition cursor-pointer"
                                  title="تغییر اتاق یا تخت"
                                >
                                  <BedIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onEvictStudent(st)}
                                  className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 transition cursor-pointer"
                                  title="تخلیه اتاق و آزادسازی تخت"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onAssignStudentRoom(st)}
                                className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                                title="تخصیص اتاق و تخت"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => onDeleteStudent(st)}
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition cursor-pointer"
                              title="حذف کامل پرونده دانشجو"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>

              {/* نوار صفحه‌بندی پایین جدول */}
              {totalStudentPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="text-slate-600 dark:text-slate-300 font-bold">
                    صفحه {safeStudentPage.toLocaleString('fa-IR')} از{' '}
                    {totalStudentPages.toLocaleString('fa-IR')} (نمایش{' '}
                    {(studentStartIndex + 1).toLocaleString('fa-IR')} تا{' '}
                    {studentEndIndex.toLocaleString('fa-IR')})
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setStudentCurrentPage(1)}
                      disabled={safeStudentPage <= 1}
                      className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                      title="صفحه اول"
                    >
                      <ChevronsRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safeStudentPage <= 1}
                      className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition inline-flex items-center gap-1 font-bold text-[11px]"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                      <span>قبلی</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {studentPageNumbers.map((item) =>
                        typeof item === 'string' ? (
                          <span
                            key={`bottom-${item}`}
                            className="px-1.5 text-slate-400 select-none font-bold"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={`bottom-${item}`}
                            type="button"
                            onClick={() => setStudentCurrentPage(item)}
                            className={`min-w-[28px] h-7 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                              item === safeStudentPage
                                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {item.toLocaleString('fa-IR')}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setStudentCurrentPage((p) => Math.min(totalStudentPages, p + 1))
                      }
                      disabled={safeStudentPage >= totalStudentPages}
                      className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition inline-flex items-center gap-1 font-bold text-[11px]"
                    >
                      <span>بعدی</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentCurrentPage(totalStudentPages)}
                      disabled={safeStudentPage >= totalStudentPages}
                      className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                      title="صفحه آخر"
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* ۲. بخش سرپرستان، تأسیسات، انبارداری و مشاوران (جستجوی پیشرفته + مدیریت کامل) */}
      {/* ========================================================= */}
      {activeCategory !== 'students' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          {/* هدر و دکمه‌های ثبت تکی و اکسل */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                {activeCategory === 'supervisors' && <ShieldCheck className="w-5 h-5" />}
                {activeCategory === 'maintenance' && <Wrench className="w-5 h-5" />}
                {activeCategory === 'warehouse' && <Package className="w-5 h-5" />}
                {activeCategory === 'procurement' && <ShoppingBag className="w-5 h-5 text-orange-600" />}
                {activeCategory === 'counselors' && <HeartHandshake className="w-5 h-5" />}
                {activeCategory === 'finance' && <Wallet className="w-5 h-5 text-emerald-600" />}
                {activeCategory === 'education' && <GraduationCap className="w-5 h-5 text-sky-600" />}
                {activeCategory === 'cultural' && <FileText className="w-5 h-5 text-fuchsia-600" />}
                {activeCategory === 'student_affairs' && <Award className="w-5 h-5 text-indigo-700" />}
                {activeCategory === 'security' && <Shield className="w-5 h-5 text-amber-600" />}
                {activeCategory === 'vice_dean' && <Landmark className="w-5 h-5 text-indigo-700" />}
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {activeCategory === 'supervisors' && `مدیریت سرپرستان سراها (${filteredSupervisors.length} از ${supervisors.length})`}
                  {activeCategory === 'maintenance' && `مدیریت پرسنل تأسیسات و فنی (${filteredMaintenance.length} از ${maintenanceStaff.length})`}
                  {activeCategory === 'warehouse' && `مدیریت کاربران انبار (${filteredWarehouse.length} از ${warehouseStaff.length})`}
                  {activeCategory === 'procurement' && `مدیریت کاربران کارپردازی و خرید (${filteredProcurement.length} از ${procurementStaff.length})`}
                  {activeCategory === 'counselors' && `مدیریت مشاوران و روانشناسان (${filteredCounselors.length} از ${counselors.length})`}
                  {activeCategory === 'finance' && `مدیریت کاربران امور مالی و حسابداری (${filteredFinance.length} از ${financeStaff.length})`}
                  {activeCategory === 'education' && `مدیریت کارشناسان آموزش (${filteredEducation.length} از ${educationStaff.length})`}
                  {activeCategory === 'cultural' && `مدیریت کاربران امور فرهنگی (${filteredCultural.length} از ${culturalStaff.length})`}
                  {activeCategory === 'student_affairs' && `مدیریت کاربران امور دانشجویی و تربیت بدنی (${filteredStudentAffairs.length} از ${studentAffairsStaff.length})`}
                  {activeCategory === 'security' && `مدیریت کارشناسان حراست و انتظامات (${filteredSecurity.length} از ${securityStaff.length})`}
                  {activeCategory === 'vice_dean' && `مدیریت کاربران معاونت دانشجویی (${filteredViceDean.length} از ${viceDeanStaff.length})`}
                </h3>
                <p className="text-xs text-slate-400">
                  مشاهده، جستجوی پیشرفته، ویرایش مشخصات، تغییر یا ریست رمز عبور و ورود تکی یا گروهی
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  openAddStaffModal(
                    activeCategory === 'supervisors'
                      ? 'supervisor'
                      : activeCategory === 'maintenance'
                      ? 'maintenance'
                      : activeCategory === 'warehouse'
                      ? 'warehouse'
                      : activeCategory === 'procurement'
                      ? 'procurement'
                      : activeCategory === 'finance'
                      ? 'finance'
                      : activeCategory === 'education'
                      ? 'education'
                      : activeCategory === 'cultural'
                      ? 'cultural'
                      : activeCategory === 'student_affairs'
                      ? 'student_affairs'
                      : activeCategory === 'security'
                      ? 'security'
                      : activeCategory === 'vice_dean'
                      ? 'vice_dean'
                      : 'counselor'
                  )
                }
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>
                  {activeCategory === 'supervisors' && 'افزودن سرپرست جدید'}
                  {activeCategory === 'maintenance' && 'افزودن تکنسین جدید'}
                  {activeCategory === 'warehouse' && 'افزودن کاربر انبار جدید'}
                  {activeCategory === 'procurement' && 'افزودن کارپرداز جدید'}
                  {activeCategory === 'counselors' && 'افزودن مشاور جدید'}
                  {activeCategory === 'finance' && 'افزودن کاربر امور مالی جدید'}
                  {activeCategory === 'education' && 'افزودن کارشناس آموزش جدید'}
                  {activeCategory === 'cultural' && 'افزودن کاربر امور فرهنگی جدید'}
                  {activeCategory === 'student_affairs' && 'افزودن کاربر امور دانشجویی جدید'}
                  {activeCategory === 'security' && 'افزودن کاربر حراست جدید'}
                  {activeCategory === 'vice_dean' && 'افزودن کاربر معاونت دانشجویی'}
                </span>
              </button>

              {activeCategory !== 'cultural' &&
                activeCategory !== 'student_affairs' &&
                activeCategory !== 'security' &&
                activeCategory !== 'vice_dean' && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenExcelModal(
                      activeCategory === 'supervisors'
                        ? 'supervisors'
                        : activeCategory === 'maintenance'
                        ? 'maintenance'
                        : activeCategory === 'warehouse'
                        ? 'warehouse'
                        : activeCategory === 'procurement'
                        ? 'procurement'
                        : activeCategory === 'finance'
                        ? 'finance'
                        : activeCategory === 'education'
                        ? 'education'
                        : 'counselors'
                    )
                  }
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>ثبت گروهی با اکسل</span>
                </button>
              )}

              {(() => {
                const currentStaffRole: StaffRole =
                  activeCategory === 'supervisors'
                    ? 'supervisor'
                    : activeCategory === 'maintenance'
                    ? 'maintenance'
                    : activeCategory === 'warehouse'
                    ? 'warehouse'
                    : activeCategory === 'procurement'
                    ? 'procurement'
                    : activeCategory === 'finance'
                    ? 'finance'
                    : activeCategory === 'education'
                    ? 'education'
                    : activeCategory === 'cultural'
                    ? 'cultural'
                    : activeCategory === 'student_affairs'
                    ? 'student_affairs'
                    : activeCategory === 'security'
                    ? 'security'
                    : activeCategory === 'vice_dean'
                    ? 'vice_dean'
                    : 'counselor';
                return (
                  <>
                    <label
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="انتخاب پوشه عکس‌ها بر اساس نام/کد کاربری (مثلاً username.jpg یا 1001.png)"
                    >
                      <FolderUp className="w-4 h-4" />
                      <span>وارد کردن پوشه عکس‌ها</span>
                      <input
                        type="file"
                        multiple
                        {...({ webkitdirectory: '', directory: '' } as any)}
                        onChange={(e) => handleBatchPhotosImport(currentStaffRole, e)}
                        className="hidden"
                      />
                    </label>

                    <label
                      className="px-3.5 py-2 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-700 dark:text-sky-200 border border-sky-200 dark:border-sky-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="انتخاب چند فایل عکس هم‌زمان با نام کاربری"
                    >
                      <ImagePlus className="w-4 h-4" />
                      <span>انتخاب چند عکس</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleBatchPhotosImport(currentStaffRole, e)}
                        className="hidden"
                      />
                    </label>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/20 border border-cyan-200/80 dark:border-cyan-900/40 text-[11px] text-cyan-900 dark:text-cyan-200 flex flex-wrap items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
            <span>
              <strong>ثبت عکس پرسنلی (تکی یا جمعی):</strong> برای ثبت جمعی، نام فایل هر تصویر باید مطابق نام/کد کاربری باشد (مثلاً{' '}
              <span className="font-mono font-bold" dir="ltr">username.jpg</span> یا{' '}
              <span className="font-mono font-bold" dir="ltr">username.png</span>). برای ثبت تکی از دکمه دوربین هر ردیف یا پنجره افزودن/ویرایش استفاده کنید.
            </span>
          </div>

          {/* نوار جستجوی پیشرفته برای کارکنان */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="relative lg:col-span-2">
              <input
                type="text"
                placeholder="جستجو بر اساس نام، نام کاربری، شماره تماس، تخصص یا توضیحات..."
                value={staffQuery}
                onChange={(e) => setStaffQuery(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-9 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>

            {activeCategory !== 'warehouse' &&
              activeCategory !== 'finance' &&
              activeCategory !== 'procurement' &&
              activeCategory !== 'education' &&
              activeCategory !== 'cultural' &&
              activeCategory !== 'student_affairs' &&
              activeCategory !== 'vice_dean' && (
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={staffDormFilter}
                  onChange={(e) => setStaffDormFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="all">فیلتر سرا: همه سراها</option>
                  {dorms.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeCategory !== 'supervisors' && (
              <div>
                <select
                  value={staffStatusFilter}
                  onChange={(e) => setStaffStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="all">وضعیت حساب: همه</option>
                  <option value="active">فقط حساب‌های فعال</option>
                  <option value="inactive">فقط حساب‌های غیرفعال</option>
                </select>
              </div>
            )}
          </div>

          {/* جدول نمایش لیست کاربران دسته انتخاب‌شده */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                <tr>
                  <th className="p-3">نام و نام خانوادگی</th>
                  <th className="p-3">نام کاربری</th>
                  <th className="p-3">رمز عبور</th>
                  <th className="p-3">شماره تماس</th>
                  {activeCategory !== 'warehouse' &&
                    activeCategory !== 'finance' &&
                    activeCategory !== 'procurement' &&
                    activeCategory !== 'education' &&
                    activeCategory !== 'cultural' &&
                    activeCategory !== 'student_affairs' &&
                    activeCategory !== 'vice_dean' && (
                    <th className="p-3">محدوده سرا / تخصص</th>
                  )}
                  {(activeCategory === 'warehouse' ||
                    activeCategory === 'finance' ||
                    activeCategory === 'procurement' ||
                    activeCategory === 'education' ||
                    activeCategory === 'cultural' ||
                    activeCategory === 'student_affairs' ||
                    activeCategory === 'vice_dean') && (
                    <th className="p-3">بخش / سمت و توضیحات</th>
                  )}
                  {activeCategory !== 'supervisors' && <th className="p-3">وضعیت</th>}
                  <th className="p-3 text-center">عملیات مدیریت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeCategory === 'supervisors' &&
                  (filteredSupervisors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        هیچ سرپرستی با مشخصات جستجوشده یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredSupervisors.map((sup) => {
                      const assignedIds =
                        sup.assignedDormIds && sup.assignedDormIds.length > 0
                          ? sup.assignedDormIds
                          : sup.assignedDormId && sup.assignedDormId !== 'all'
                          ? [sup.assignedDormId]
                          : dorms.map((d) => d.id);
                      const passKey = `sup_${sup.id}`;
                      const isShown = revealedPasswords[passKey];

                      return (
                        <tr key={sup.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              {sup.photoUrl ? (
                                <img
                                  src={sup.photoUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover border border-indigo-200 dark:border-indigo-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {(sup.fullName || 'س').slice(0, 1)}
                                </div>
                              )}
                              <span>{sup.fullName}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300" dir="ltr">
                            {sup.username}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {isShown ? sup.password : '••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRevealPassword(passKey)}
                                className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                                title={isShown ? 'مخفی کردن رمز' : 'نمایش رمز'}
                              >
                                {isShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 font-mono" dir="ltr">
                            {sup.phone || '-'}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {dorms
                                .filter((d) => assignedIds.includes(d.id))
                                .map((d) => (
                                  <span
                                    key={d.id}
                                    className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 text-[10px] font-bold border border-teal-200 dark:border-teal-800"
                                  >
                                    {d.name}
                                  </span>
                                ))}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <label
                                className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 border border-cyan-200 dark:border-cyan-800 transition cursor-pointer"
                                title="بارگذاری یا تغییر عکس سرپرست"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleQuickSinglePhotoUpload('supervisor', sup.id, sup.fullName, e, sup.username)
                                  }
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => openEditStaffModal('supervisor', sup)}
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                                title="ویرایش مشخصات و سراهای تحت نظارت"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPasswordError('');
                                  setNewPasswordInput('');
                                  setPasswordModalTarget({
                                    role: 'supervisor',
                                    id: sup.id,
                                    fullName: sup.fullName,
                                    usernameOrCode: sup.username,
                                    defaultResetValue: '123456',
                                    defaultResetLabel: 'ریست فوری به 123456',
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                                title="تغییر یا ریست رمز عبور"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    role: 'supervisor',
                                    id: sup.id,
                                    fullName: sup.fullName,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition cursor-pointer"
                                title="حذف سرپرست"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ))}

                {activeCategory === 'maintenance' &&
                  (filteredMaintenance.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        هیچ تکنسینی با مشخصات جستجوشده یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredMaintenance.map((tech) => {
                      const isActive = tech.status !== 'inactive' && tech.isActive !== false;
                      const coveredIds = tech.coveredDormIds || tech.assignedDormIds || [];
                      const passKey = `tech_${tech.id}`;
                      const isShown = revealedPasswords[passKey];

                      return (
                        <tr key={tech.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              {tech.photoUrl ? (
                                <img
                                  src={tech.photoUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover border border-amber-200 dark:border-amber-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {(tech.fullName || 'ت').slice(0, 1)}
                                </div>
                              )}
                              <span>{tech.fullName}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300" dir="ltr">
                            {tech.username}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {isShown ? tech.password : '••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRevealPassword(passKey)}
                                className="p-1 text-slate-400 hover:text-amber-600 cursor-pointer"
                                title={isShown ? 'مخفی کردن رمز' : 'نمایش رمز'}
                              >
                                {isShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 font-mono" dir="ltr">
                            {tech.mobile || tech.phone || '-'}
                          </td>
                          <td className="p-3 space-y-1">
                            <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                              {tech.specialty || 'تأسیسات'}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {coveredIds.includes('all') || (dorms.length > 0 && coveredIds.length >= dorms.length) ? (
                                <span className="px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/50 text-[10px] font-bold text-teal-700 dark:text-teal-300">
                                  همه سراها
                                </span>
                              ) : (
                                dorms
                                  .filter((d) => coveredIds.includes(d.id))
                                  .map((d) => (
                                    <span
                                      key={d.id}
                                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300"
                                    >
                                      {d.name}
                                    </span>
                                  ))
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus = isActive ? 'inactive' : 'active';
                                Storage.updateMaintenanceStaff(tech.id, {
                                  status: nextStatus,
                                  isActive: nextStatus === 'active',
                                });
                                onRefreshData();
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {isActive ? 'فعال' : 'غیرفعال'}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <label
                                className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 border border-cyan-200 dark:border-cyan-800 transition cursor-pointer"
                                title="بارگذاری یا تغییر عکس کارشناس"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleQuickSinglePhotoUpload('maintenance', tech.id, tech.fullName, e, tech.username)
                                  }
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => openEditStaffModal('maintenance', tech)}
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                                title="ویرایش مشخصات تکنسین"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPasswordError('');
                                  setNewPasswordInput('');
                                  setPasswordModalTarget({
                                    role: 'maintenance',
                                    id: tech.id,
                                    fullName: tech.fullName,
                                    usernameOrCode: tech.username,
                                    defaultResetValue: '123456',
                                    defaultResetLabel: 'ریست فوری به 123456',
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                                title="تغییر یا ریست رمز عبور"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    role: 'maintenance',
                                    id: tech.id,
                                    fullName: tech.fullName,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition cursor-pointer"
                                title="حذف تکنسین"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ))}

                {activeCategory === 'warehouse' &&
                  (filteredWarehouse.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        هیچ کاربر انباری با مشخصات جستجوشده یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredWarehouse.map((wh) => {
                      const isActive = wh.status !== 'inactive' && wh.isActive !== false;
                      const passKey = `wh_${wh.id}`;
                      const isShown = revealedPasswords[passKey];

                      return (
                        <tr key={wh.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              {wh.photoUrl ? (
                                <img
                                  src={wh.photoUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover border border-violet-200 dark:border-violet-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-violet-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {(wh.fullName || 'ا').slice(0, 1)}
                                </div>
                              )}
                              <span>{wh.fullName}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300" dir="ltr">
                            {wh.username}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {isShown ? wh.password : '••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRevealPassword(passKey)}
                                className="p-1 text-slate-400 hover:text-violet-600 cursor-pointer"
                                title={isShown ? 'مخفی کردن رمز' : 'نمایش رمز'}
                              >
                                {isShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 font-mono" dir="ltr">
                            {wh.mobile || wh.phone || '-'}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{wh.notes || 'مسئول انبار و کارپردازی'}</td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus = isActive ? 'inactive' : 'active';
                                Storage.updateWarehouseStaff(wh.id, {
                                  status: nextStatus,
                                  isActive: nextStatus === 'active',
                                });
                                onRefreshData();
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {isActive ? 'فعال' : 'غیرفعال'}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <label
                                className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 border border-cyan-200 dark:border-cyan-800 transition cursor-pointer"
                                title="بارگذاری یا تغییر عکس کاربر انبار"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleQuickSinglePhotoUpload('warehouse', wh.id, wh.fullName, e, wh.username)
                                  }
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => openEditStaffModal('warehouse', wh)}
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                                title="ویرایش مشخصات کاربر انبار"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPasswordError('');
                                  setNewPasswordInput('');
                                  setPasswordModalTarget({
                                    role: 'warehouse',
                                    id: wh.id,
                                    fullName: wh.fullName,
                                    usernameOrCode: wh.username,
                                    defaultResetValue: '123456',
                                    defaultResetLabel: 'ریست فوری به 123456',
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                                title="تغییر یا ریست رمز عبور"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    role: 'warehouse',
                                    id: wh.id,
                                    fullName: wh.fullName,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition cursor-pointer"
                                title="حذف کاربر انبار"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ))}

                {activeCategory === 'counselors' &&
                  (filteredCounselors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        هیچ مشاوری با مشخصات جستجوشده یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredCounselors.map((cns) => {
                      const isActive = cns.status !== 'inactive' && cns.isActive !== false;
                      const assignedIds = cns.assignedDormIds || [];
                      const passKey = `cns_${cns.id}`;
                      const isShown = revealedPasswords[passKey];

                      return (
                        <tr key={cns.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              {cns.photoUrl ? (
                                <img
                                  src={cns.photoUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover border border-rose-200 dark:border-rose-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {(cns.fullName || 'م').slice(0, 1)}
                                </div>
                              )}
                              <span>{cns.fullName}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300" dir="ltr">
                            {cns.username}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {isShown ? cns.password : '••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRevealPassword(passKey)}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title={isShown ? 'مخفی کردن رمز' : 'نمایش رمز'}
                              >
                                {isShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 font-mono" dir="ltr">
                            {cns.mobile || cns.phone || '-'}
                          </td>
                          <td className="p-3 space-y-1">
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold">
                                {cns.specialty || 'مشاوره'}
                              </span>
                              {cns.officeLocation && (
                                <span className="text-[10px] text-slate-500">({cns.officeLocation})</span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {assignedIds.includes('all') || (dorms.length > 0 && assignedIds.length >= dorms.length) ? (
                                <span className="px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/50 text-[10px] font-bold text-teal-700 dark:text-teal-300">
                                  همه سراها
                                </span>
                              ) : (
                                dorms
                                  .filter((d) => assignedIds.includes(d.id))
                                  .map((d) => (
                                    <span
                                      key={d.id}
                                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300"
                                    >
                                      {d.name}
                                    </span>
                                  ))
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus = isActive ? 'inactive' : 'active';
                                Storage.updateCounselor(cns.id, {
                                  status: nextStatus,
                                  isActive: nextStatus === 'active',
                                });
                                onRefreshData();
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {isActive ? 'فعال' : 'غیرفعال'}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <label
                                className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 border border-cyan-200 dark:border-cyan-800 transition cursor-pointer"
                                title="بارگذاری یا تغییر عکس مشاور"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleQuickSinglePhotoUpload('counselor', cns.id, cns.fullName, e, cns.username)
                                  }
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => openEditStaffModal('counselor', cns)}
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                                title="ویرایش مشخصات مشاور"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPasswordError('');
                                  setNewPasswordInput('');
                                  setPasswordModalTarget({
                                    role: 'counselor',
                                    id: cns.id,
                                    fullName: cns.fullName,
                                    usernameOrCode: cns.username,
                                    defaultResetValue: '123456',
                                    defaultResetLabel: 'ریست فوری به 123456',
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                                title="تغییر یا ریست رمز عبور"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    role: 'counselor',
                                    id: cns.id,
                                    fullName: cns.fullName,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition cursor-pointer"
                                title="حذف مشاور"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ))}

                {activeCategory === 'finance' &&
                  (filteredFinance.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        هیچ کاربر امور مالی با مشخصات جستجوشده یافت نشد. برای ثبت کاربر از دکمه «افزودن کاربر امور مالی جدید» یا «ثبت گروهی با اکسل» استفاده کنید.
                      </td>
                    </tr>
                  ) : (
                    filteredFinance.map((fin) => {
                      const isActive = fin.status !== 'inactive' && fin.isActive !== false;
                      const passKey = `fin_${fin.id}`;
                      const isShown = revealedPasswords[passKey];

                      return (
                        <tr key={fin.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              {fin.photoUrl ? (
                                <img
                                  src={fin.photoUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover border border-emerald-200 dark:border-emerald-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {(fin.fullName || 'م').slice(0, 1)}
                                </div>
                              )}
                              <span>{fin.fullName}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300" dir="ltr">
                            {fin.username}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {isShown ? fin.password : '••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRevealPassword(passKey)}
                                className="p-1 text-slate-400 hover:text-emerald-600 cursor-pointer"
                                title={isShown ? 'مخفی کردن رمز' : 'نمایش رمز'}
                              >
                                {isShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 font-mono" dir="ltr">
                            {fin.mobile || fin.phone || '-'}
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-emerald-700 dark:text-emerald-300">
                              {fin.department || 'واحد امور مالی و حسابداری'}
                            </div>
                            {fin.notes && <div className="text-[11px] text-slate-400">{fin.notes}</div>}
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus = isActive ? 'inactive' : 'active';
                                Storage.updateFinanceStaff(fin.id, {
                                  status: nextStatus,
                                  isActive: nextStatus === 'active',
                                });
                                onRefreshData();
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {isActive ? 'فعال' : 'غیرفعال'}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <label
                                className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 border border-cyan-200 dark:border-cyan-800 transition cursor-pointer"
                                title="بارگذاری یا تغییر عکس کاربر امور مالی"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleQuickSinglePhotoUpload('finance', fin.id, fin.fullName, e, fin.username)
                                  }
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => openEditStaffModal('finance', fin)}
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                                title="ویرایش مشخصات کاربر امور مالی"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPasswordError('');
                                  setNewPasswordInput('');
                                  setPasswordModalTarget({
                                    role: 'finance',
                                    id: fin.id,
                                    fullName: fin.fullName,
                                    usernameOrCode: fin.username,
                                    defaultResetValue: '123456',
                                    defaultResetLabel: 'ریست فوری به 123456',
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                                title="تغییر یا ریست رمز عبور"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    role: 'finance',
                                    id: fin.id,
                                    fullName: fin.fullName,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition cursor-pointer"
                                title="حذف کاربر امور مالی"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ))}

                {activeCategory === 'procurement' &&
                  (filteredProcurement.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        هیچ کارپردازی با مشخصات جستجوشده یافت نشد. برای ثبت کاربر از دکمه «افزودن کارپرداز جدید» یا «ثبت گروهی با اکسل» استفاده کنید.
                      </td>
                    </tr>
                  ) : (
                    filteredProcurement.map((proc) => {
                      const isActive = proc.status !== 'inactive' && proc.isActive !== false;
                      const passKey = `proc_${proc.id}`;
                      const isShown = revealedPasswords[passKey];

                      return (
                        <tr key={proc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              {proc.photoUrl ? (
                                <img
                                  src={proc.photoUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover border border-orange-200 dark:border-orange-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-orange-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {(proc.fullName || 'ک').slice(0, 1)}
                                </div>
                              )}
                              <span>{proc.fullName}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300" dir="ltr">
                            {proc.username}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {isShown ? proc.password : '••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRevealPassword(passKey)}
                                className="p-1 text-slate-400 hover:text-orange-600 cursor-pointer"
                                title={isShown ? 'مخفی کردن رمز' : 'نمایش رمز'}
                              >
                                {isShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 font-mono" dir="ltr">
                            {proc.mobile || proc.phone || '-'}
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-orange-700 dark:text-orange-300">
                              {proc.department || 'واحد کارپردازی و خرید'}
                            </div>
                            {proc.notes && <div className="text-[11px] text-slate-400">{proc.notes}</div>}
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus = isActive ? 'inactive' : 'active';
                                Storage.updateProcurementStaff(proc.id, {
                                  status: nextStatus,
                                  isActive: nextStatus === 'active',
                                });
                                onRefreshData();
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {isActive ? 'فعال' : 'غیرفعال'}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <label
                                className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 border border-cyan-200 dark:border-cyan-800 transition cursor-pointer"
                                title="بارگذاری یا تغییر عکس کارپرداز"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleQuickSinglePhotoUpload('procurement', proc.id, proc.fullName, e, proc.username)
                                  }
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => openEditStaffModal('procurement', proc)}
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                                title="ویرایش مشخصات کارپرداز"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPasswordError('');
                                  setNewPasswordInput('');
                                  setPasswordModalTarget({
                                    role: 'procurement',
                                    id: proc.id,
                                    fullName: proc.fullName,
                                    usernameOrCode: proc.username,
                                    defaultResetValue: '123456',
                                    defaultResetLabel: 'ریست فوری به 123456',
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                                title="تغییر یا ریست رمز عبور"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    role: 'procurement',
                                    id: proc.id,
                                    fullName: proc.fullName,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition cursor-pointer"
                                title="حذف کارپرداز"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ))}

                {activeCategory === 'education' &&
                  (filteredEducation.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        هیچ کارشناس آموزشی با مشخصات جستجوشده یافت نشد. برای ثبت کاربر از دکمه «افزودن کارشناس آموزش جدید» یا «ثبت گروهی با اکسل» استفاده کنید.
                      </td>
                    </tr>
                  ) : (
                    filteredEducation.map((edu) => {
                      const isActive = edu.status !== 'inactive' && edu.isActive !== false;
                      const passKey = `edu_${edu.id}`;
                      const isShown = revealedPasswords[passKey];

                      return (
                        <tr key={edu.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              {edu.photoUrl ? (
                                <img
                                  src={edu.photoUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover border border-sky-200 dark:border-sky-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-sky-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {(edu.fullName || 'آ').slice(0, 1)}
                                </div>
                              )}
                              <span>{edu.fullName}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300" dir="ltr">
                            {edu.username}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {isShown ? edu.password : '••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRevealPassword(passKey)}
                                className="p-1 text-slate-400 hover:text-sky-600 cursor-pointer"
                                title={isShown ? 'مخفی کردن رمز' : 'نمایش رمز'}
                              >
                                {isShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 font-mono" dir="ltr">
                            {edu.mobile || edu.phone || '-'}
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-sky-700 dark:text-sky-300">
                              {edu.department || 'واحد امور آموزشی'}
                            </div>
                            {edu.notes && <div className="text-[11px] text-slate-400">{edu.notes}</div>}
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus = isActive ? 'inactive' : 'active';
                                Storage.updateEducationStaff(edu.id, {
                                  status: nextStatus,
                                  isActive: nextStatus === 'active',
                                });
                                onRefreshData();
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {isActive ? 'فعال' : 'غیرفعال'}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <label
                                className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 border border-cyan-200 dark:border-cyan-800 transition cursor-pointer"
                                title="بارگذاری یا تغییر عکس کارشناس آموزش"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleQuickSinglePhotoUpload('education', edu.id, edu.fullName, e, edu.username)
                                  }
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => openEditStaffModal('education', edu)}
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                                title="ویرایش مشخصات کارشناس آموزش"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPasswordError('');
                                  setNewPasswordInput('');
                                  setPasswordModalTarget({
                                    role: 'education',
                                    id: edu.id,
                                    fullName: edu.fullName,
                                    usernameOrCode: edu.username,
                                    defaultResetValue: '123456',
                                    defaultResetLabel: 'ریست فوری به 123456',
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                                title="تغییر یا ریست رمز عبور"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    role: 'education',
                                    id: edu.id,
                                    fullName: edu.fullName,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition cursor-pointer"
                                title="حذف کارشناس آموزش"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ))}

                {activeCategory === 'cultural' &&
                  (filteredCultural.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        هیچ کاربر امور فرهنگی با مشخصات جستجوشده یافت نشد. برای ثبت از دکمه «افزودن کاربر امور فرهنگی جدید» استفاده کنید.
                      </td>
                    </tr>
                  ) : (
                    filteredCultural.map((cul) => {
                      const isActive = cul.status !== 'inactive' && cul.isActive !== false;
                      const passKey = `cul_${cul.id}`;
                      const isShown = revealedPasswords[passKey];

                      return (
                        <tr key={cul.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              {cul.photoUrl ? (
                                <img
                                  src={cul.photoUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover border border-fuchsia-200 dark:border-fuchsia-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-fuchsia-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {(cul.fullName || 'ف').slice(0, 1)}
                                </div>
                              )}
                              <span>{cul.fullName}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300" dir="ltr">
                            {cul.username}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {isShown ? cul.password : '••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRevealPassword(passKey)}
                                className="p-1 text-slate-400 hover:text-fuchsia-600 cursor-pointer"
                                title={isShown ? 'مخفی کردن رمز' : 'نمایش رمز'}
                              >
                                {isShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 font-mono" dir="ltr">
                            {cul.mobile || cul.phone || '-'}
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-fuchsia-700 dark:text-fuchsia-300">
                              {cul.department || 'واحد امور فرهنگی و اجتماعی سراها'}
                            </div>
                            {cul.notes && <div className="text-[11px] text-slate-400">{cul.notes}</div>}
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus = isActive ? 'inactive' : 'active';
                                Storage.updateCulturalStaff(cul.id, {
                                  status: nextStatus,
                                  isActive: nextStatus === 'active',
                                });
                                onRefreshData();
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {isActive ? 'فعال' : 'غیرفعال'}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <label
                                className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 border border-cyan-200 dark:border-cyan-800 transition cursor-pointer"
                                title="بارگذاری یا تغییر عکس امور فرهنگی"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleQuickSinglePhotoUpload('cultural', cul.id, cul.fullName, e, cul.username)
                                  }
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => openEditStaffModal('cultural', cul)}
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                                title="ویرایش مشخصات امور فرهنگی"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPasswordError('');
                                  setNewPasswordInput('');
                                  setPasswordModalTarget({
                                    role: 'cultural',
                                    id: cul.id,
                                    fullName: cul.fullName,
                                    usernameOrCode: cul.username,
                                    defaultResetValue: '123456',
                                    defaultResetLabel: 'ریست فوری به 123456',
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                                title="تغییر یا ریست رمز عبور"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    role: 'cultural',
                                    id: cul.id,
                                    fullName: cul.fullName,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition cursor-pointer"
                                title="حذف کاربر امور فرهنگی"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ))}

                {activeCategory === 'student_affairs' &&
                  (filteredStudentAffairs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        هیچ کاربر امور دانشجویی و تربیت بدنی با مشخصات جستجوشده یافت نشد. برای ثبت از دکمه «افزودن کاربر امور دانشجویی جدید» استفاده کنید.
                      </td>
                    </tr>
                  ) : (
                    filteredStudentAffairs.map((sa) => {
                      const isActive = sa.status !== 'inactive' && sa.isActive !== false;
                      const passKey = `sa_${sa.id}`;
                      const isShown = revealedPasswords[passKey];

                      return (
                        <tr key={sa.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              {sa.photoUrl ? (
                                <img
                                  src={sa.photoUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover border border-indigo-200 dark:border-indigo-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-700 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {(sa.fullName || 'د').slice(0, 1)}
                                </div>
                              )}
                              <span>{sa.fullName}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300" dir="ltr">
                            {sa.username}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {isShown ? sa.password : '••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRevealPassword(passKey)}
                                className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                                title={isShown ? 'مخفی کردن رمز' : 'نمایش رمز'}
                              >
                                {isShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 font-mono" dir="ltr">
                            {sa.mobile || sa.phone || '-'}
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-indigo-700 dark:text-indigo-300">
                              {sa.department || 'اداره امور دانشجویی، تربیت بدنی و رفاهی'}
                            </div>
                            {sa.notes && <div className="text-[11px] text-slate-400">{sa.notes}</div>}
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus = isActive ? 'inactive' : 'active';
                                Storage.updateStudentAffairsStaff(sa.id, {
                                  status: nextStatus,
                                  isActive: nextStatus === 'active',
                                });
                                onRefreshData();
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {isActive ? 'فعال' : 'غیرفعال'}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <label
                                className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 border border-cyan-200 dark:border-cyan-800 transition cursor-pointer"
                                title="بارگذاری یا تغییر عکس امور دانشجویی"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleQuickSinglePhotoUpload('student_affairs', sa.id, sa.fullName, e, sa.username)
                                  }
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => openEditStaffModal('student_affairs', sa)}
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                                title="ویرایش مشخصات امور دانشجویی"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPasswordError('');
                                  setNewPasswordInput('');
                                  setPasswordModalTarget({
                                    role: 'student_affairs',
                                    id: sa.id,
                                    fullName: sa.fullName,
                                    usernameOrCode: sa.username,
                                    defaultResetValue: '123456',
                                    defaultResetLabel: 'ریست فوری به 123456',
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                                title="تغییر یا ریست رمز عبور"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    role: 'student_affairs',
                                    id: sa.id,
                                    fullName: sa.fullName,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition cursor-pointer"
                                title="حذف کاربر امور دانشجویی"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ))}

                {activeCategory === 'security' &&
                  (filteredSecurity.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        هیچ کاربر حراست و انتظاماتی با مشخصات جستجوشده یافت نشد. برای ثبت از دکمه «افزودن کاربر حراست جدید» استفاده کنید.
                      </td>
                    </tr>
                  ) : (
                    filteredSecurity.map((sec) => {
                      const isActive = sec.status !== 'inactive' && sec.isActive !== false;
                      const coveredIds = sec.coveredDormIds || ['all'];
                      const passKey = `sec_${sec.id}`;
                      const isShown = revealedPasswords[passKey];

                      return (
                        <tr key={sec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              {sec.photoUrl ? (
                                <img
                                  src={sec.photoUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover border border-amber-300 dark:border-amber-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-800 text-amber-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {(sec.fullName || 'ح').slice(0, 1)}
                                </div>
                              )}
                              <span>{sec.fullName}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300" dir="ltr">
                            {sec.username}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {isShown ? sec.password : '••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRevealPassword(passKey)}
                                className="p-1 text-slate-400 hover:text-amber-600 cursor-pointer"
                                title={isShown ? 'مخفی کردن رمز' : 'نمایش رمز'}
                              >
                                {isShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 font-mono" dir="ltr">
                            {sec.mobile || sec.phone || '-'}
                          </td>
                          <td className="p-3 space-y-1">
                            <div className="font-semibold text-slate-800 dark:text-amber-300">
                              {sec.department || 'واحد حراست و انتظامات'}
                              {sec.badgeCode && <span className="text-[10px] mr-1.5 font-mono">({sec.badgeCode})</span>}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {coveredIds.includes('all') || (dorms.length > 0 && coveredIds.length >= dorms.length) ? (
                                <span className="px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/50 text-[10px] font-bold text-teal-700 dark:text-teal-300">
                                  همه سراها
                                </span>
                              ) : (
                                dorms
                                  .filter((d) => coveredIds.includes(d.id))
                                  .map((d) => (
                                    <span
                                      key={d.id}
                                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300"
                                    >
                                      {d.name}
                                    </span>
                                  ))
                              )}
                            </div>
                            {sec.notes && <div className="text-[11px] text-slate-400">{sec.notes}</div>}
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus = isActive ? 'inactive' : 'active';
                                Storage.updateSecurityStaff(sec.id, {
                                  status: nextStatus,
                                  isActive: nextStatus === 'active',
                                });
                                onRefreshData();
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {isActive ? 'فعال' : 'غیرفعال'}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <label
                                className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 border border-cyan-200 dark:border-cyan-800 transition cursor-pointer"
                                title="بارگذاری یا تغییر عکس کارشناس حراست"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleQuickSinglePhotoUpload('security', sec.id, sec.fullName, e, sec.username)
                                  }
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => openEditStaffModal('security', sec)}
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                                title="ویرایش مشخصات کاربر حراست"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPasswordError('');
                                  setNewPasswordInput('');
                                  setPasswordModalTarget({
                                    role: 'security',
                                    id: sec.id,
                                    fullName: sec.fullName,
                                    usernameOrCode: sec.username,
                                    defaultResetValue: '123456',
                                    defaultResetLabel: 'ریست فوری به 123456',
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                                title="تغییر یا ریست رمز عبور"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    role: 'security',
                                    id: sec.id,
                                    fullName: sec.fullName,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition cursor-pointer"
                                title="حذف کاربر حراست"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ))}

                {activeCategory === 'vice_dean' &&
                  (filteredViceDean.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        هیچ کاربر معاونت دانشجویی با مشخصات جستجوشده یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredViceDean.map((vd) => {
                      const isActive = vd.status !== 'inactive' && vd.isActive !== false;
                      const passKey = `vd_${vd.id}`;
                      const isShown = revealedPasswords[passKey];

                      return (
                        <tr key={vd.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              {vd.photoUrl ? (
                                <img
                                  src={vd.photoUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover border border-indigo-300 dark:border-indigo-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-900 text-cyan-200 text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {(vd.fullName || 'م').slice(0, 1)}
                                </div>
                              )}
                              <span>{vd.fullName}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300" dir="ltr">
                            {vd.username}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {isShown ? vd.password : '••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRevealPassword(passKey)}
                                className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                                title={isShown ? 'مخفی کردن رمز' : 'نمایش رمز'}
                              >
                                {isShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 font-mono" dir="ltr">
                            {vd.mobile || vd.phone || '-'}
                          </td>
                          <td className="p-3 space-y-1">
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 text-[10px] font-bold">
                                {vd.title || 'معاون دانشجویی'}
                              </span>
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                {vd.department || 'معاونت دانشجویی دانشگاه فرهنگیان'}
                              </span>
                            </div>
                            {vd.notes && <div className="text-[11px] text-slate-500">{vd.notes}</div>}
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus = isActive ? 'inactive' : 'active';
                                Storage.updateViceDeanStaff(vd.id, {
                                  status: nextStatus,
                                  isActive: nextStatus === 'active',
                                });
                                onRefreshData();
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {isActive ? 'فعال' : 'غیرفعال'}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <label
                                className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 border border-cyan-200 dark:border-cyan-800 transition cursor-pointer"
                                title="بارگذاری یا تغییر عکس کاربر معاونت"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleQuickSinglePhotoUpload('vice_dean', vd.id, vd.fullName, e, vd.username)
                                  }
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => openEditStaffModal('vice_dean', vd)}
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                                title="ویرایش مشخصات معاونت دانشجویی"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPasswordError('');
                                  setNewPasswordInput('');
                                  setPasswordModalTarget({
                                    role: 'vice_dean',
                                    id: vd.id,
                                    fullName: vd.fullName,
                                    usernameOrCode: vd.username,
                                    defaultResetValue: '123456',
                                    defaultResetLabel: 'ریست فوری به 123456',
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                                title="تغییر یا ریست رمز عبور"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    role: 'vice_dean',
                                    id: vd.id,
                                    fullName: vd.fullName,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition cursor-pointer"
                                title="حذف کاربر معاونت دانشجویی"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* مدال افزودن یا ویرایش کاربر پرسنل (سرپرست، تأسیسات، انبار، مشاور) */}
      {/* ========================================================= */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                {editingStaffId ? <Edit3 className="w-5 h-5 text-amber-500" /> : <UserPlus className="w-5 h-5 text-teal-600" />}
                <span>
                  {editingStaffId
                    ? `ویرایش مشخصات ${roleLabels[staffModalRole]}`
                    : `افزودن ${roleLabels[staffModalRole]} جدید`}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStaffModal} className="space-y-4 text-xs">
              {/* بخش انتخاب یا تغییر عکس پرسنلی کاربر */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
                {formPhotoUrl ? (
                  <img
                    src={formPhotoUrl}
                    alt="عکس پرسنلی"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-500 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <Camera className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-[180px] space-y-1.5">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    تصویر پرسنلی {roleLabels[staffModalRole]}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] transition cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{formPhotoUrl ? 'تغییر عکس' : 'انتخاب عکس'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleModalStaffPhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {formPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormPhotoUrl('')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-[11px] hover:bg-rose-100 transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>حذف عکس</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نام و نام خانوادگی *
                  </label>
                  <input
                    type="text"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نام کاربری (انگلیسی) *
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    کلمه عبور *
                  </label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شماره تماس / همراه
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    dir="ltr"
                    placeholder="09130000000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>

                {(staffModalRole === 'maintenance' || staffModalRole === 'counselor') && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      تخصص
                    </label>
                    <input
                      type="text"
                      value={formSpecialty}
                      onChange={(e) => setFormSpecialty(e.target.value)}
                      placeholder={
                        staffModalRole === 'maintenance'
                          ? 'لوله‌کشی، برق، نجاری...'
                          : 'روانشناسی بالینی، مشاوره تحصیلی...'
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    />
                  </div>
                )}

                {(staffModalRole === 'counselor' || staffModalRole === 'security' || staffModalRole === 'vice_dean') && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {staffModalRole === 'security'
                        ? 'کد پرسنلی / شناسه سازمانی حراست (اختیاری)'
                        : staffModalRole === 'vice_dean'
                        ? 'عنوان سازمانی (مثلاً معاون دانشجویی)'
                        : 'دفتر / اتاق مشاوره'}
                    </label>
                    <input
                      type="text"
                      value={formOfficeLocation}
                      onChange={(e) => setFormOfficeLocation(e.target.value)}
                      placeholder={
                        staffModalRole === 'security'
                          ? 'مثلاً SEC-101'
                          : staffModalRole === 'vice_dean'
                          ? 'معاون دانشجویی'
                          : 'مرکز مشاوره پردیس'
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    />
                  </div>
                )}

                {(staffModalRole === 'finance' ||
                  staffModalRole === 'procurement' ||
                  staffModalRole === 'education' ||
                  staffModalRole === 'cultural' ||
                  staffModalRole === 'student_affairs' ||
                  staffModalRole === 'security' ||
                  staffModalRole === 'vice_dean') && (
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {staffModalRole === 'procurement'
                        ? 'بخش / واحد کارپردازی'
                        : staffModalRole === 'education'
                        ? 'بخش / واحد آموزش'
                        : staffModalRole === 'cultural'
                        ? 'بخش / واحد امور فرهنگی'
                        : staffModalRole === 'student_affairs'
                        ? 'بخش / اداره امور دانشجویی و تربیت بدنی'
                        : staffModalRole === 'security'
                        ? 'بخش / واحد حراست و انتظامات'
                        : staffModalRole === 'vice_dean'
                        ? 'حوزه / معاونت دانشجویی'
                        : 'بخش / واحد مالی'}
                    </label>
                    <input
                      type="text"
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      placeholder={
                        staffModalRole === 'procurement'
                          ? 'واحد کارپردازی و تدارکات سراها'
                          : staffModalRole === 'education'
                          ? 'واحد امور آموزشی و ثبت‌نام'
                          : staffModalRole === 'cultural'
                          ? 'واحد امور فرهنگی و اجتماعی سراها'
                          : staffModalRole === 'student_affairs'
                          ? 'اداره امور دانشجویی، تربیت بدنی و رفاهی'
                          : staffModalRole === 'security'
                          ? 'واحد حراست و انتظامات پردیس'
                          : staffModalRole === 'vice_dean'
                          ? 'معاونت دانشجویی دانشگاه فرهنگیان'
                          : 'واحد امور مالی و حسابداری پردیس'
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    />
                  </div>
                )}

                {staffModalRole !== 'supervisor' && (
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      سمت / توضیحات (اختیاری)
                    </label>
                    <input
                      type="text"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder={
                        staffModalRole === 'finance'
                          ? 'کارشناس بررسی کسورات ۴۵٪ و ۲۵٪ / حسابدار...'
                          : staffModalRole === 'procurement'
                          ? 'کارپرداز خرید تجهیزات و قطعات مصرفی سراها...'
                          : staffModalRole === 'education'
                          ? 'کارشناس آموزش رشته‌های کارشناسی / پیگیری وضعیت تحصیلی...'
                          : staffModalRole === 'cultural'
                          ? 'مسئول برنامه‌ریزی فرهنگی، تشکل‌ها و کانون‌های دانشجویی...'
                          : staffModalRole === 'student_affairs'
                          ? 'کارشناس امور دانشجویی، شورای صنفی و شورای انضباطی...'
                          : staffModalRole === 'security'
                          ? 'کارشناس حراست و انتظامات / شیفت گشت و صیانت سراها...'
                          : staffModalRole === 'vice_dean'
                          ? 'معاونت دانشجویی — نظارت جامع بر سراها، امور دانشجویی و فرهنگی...'
                          : staffModalRole === 'maintenance'
                          ? 'سرپرست شیفت تأسیسات / تکنسین فنی...'
                          : staffModalRole === 'counselor'
                          ? 'ساعات حضور یا توضیحات پرونده مشاوره...'
                          : 'مسئول انبار مرکزی...'
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    />
                  </div>
                )}
              </div>

              {staffModalRole !== 'warehouse' &&
                staffModalRole !== 'finance' &&
                staffModalRole !== 'procurement' &&
                staffModalRole !== 'education' &&
                staffModalRole !== 'cultural' &&
                staffModalRole !== 'student_affairs' &&
                staffModalRole !== 'vice_dean' &&
                dorms.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      سراهای تحت پوشش / نظارت:
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormDormIds(dorms.map((d) => d.id))}
                      className="text-[11px] font-bold text-teal-600 hover:underline cursor-pointer"
                    >
                      انتخاب همه سراها
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {dorms.map((d) => {
                      const checked = formDormIds.includes(d.id);
                      return (
                        <label
                          key={d.id}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                            checked
                              ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-400 text-teal-900 dark:text-teal-200 font-bold'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormDormIds((prev) => [...prev, d.id]);
                              } else if (formDormIds.length > 1) {
                                setFormDormIds((prev) => prev.filter((id) => id !== d.id));
                              }
                            }}
                            className="w-4 h-4 rounded text-teal-600 cursor-pointer"
                          />
                          <span>{d.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {staffModalRole !== 'supervisor' && (
                <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                  />
                  <span>حساب کاربری فعال و مجاز به ورود باشد</span>
                </label>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingStaffId ? 'ذخیره تغییرات' : 'ثبت کاربر'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* مدال تغییر یا ریست رمز عبور برای تمام کاربران */}
      {/* ========================================================= */}
      {passwordModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <span>تغییر و ریست رمز عبور کاربر</span>
              </h3>
              <button
                type="button"
                onClick={() => setPasswordModalTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
              <div>
                <span className="text-slate-500">کاربر: </span>
                <strong className="text-slate-900 dark:text-white">{passwordModalTarget.fullName}</strong>
              </div>
              <div>
                <span className="text-slate-500">شناسه / نام کاربری: </span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {passwordModalTarget.usernameOrCode}
                </span>
              </div>
              {passwordModalTarget.role === 'student' && (
                <p className="text-[11px] text-amber-700 dark:text-amber-300 pt-1">
                  نکته: رمز پیش‌فرض دانشجو همان کد ملی وی است؛ با تغییر یا ریست رمز، کد ملی اصلی دانشجو در سامانه ثابت می‌ماند.
                </p>
              )}
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تعیین رمز عبور جدید دلخواه (حداقل ۴ کاراکتر):
                </label>
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="رمز جدید را وارد کنید..."
                  dir="ltr"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono text-sm"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>ذخیره رمز جدید</span>
                </button>
                <button
                  type="button"
                  onClick={handleQuickResetPassword}
                  className="flex-1 py-2.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{passwordModalTarget.defaultResetLabel}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* مدال تأیید حذف کاربر */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>تأیید حذف کاربر</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              آیا از حذف کامل حساب کاربری «<strong>{deleteTarget.fullName}</strong>» ({roleLabels[deleteTarget.role]}) اطمینان دارید؟
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStaff}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
              >
                حذف نهایی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* مدال پرونده کامل دانشجو (اطلاعات، عکس، اخطار، تذکر، پیام و ارزیابی فردی/اتاق) */}
      {/* ========================================================= */}
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
            actorName="مدیریت کل امور سراها"
            actorRole="admin"
            actorId="admin"
            onDataChanged={onRefreshData}
            onEditStudent={onEditStudent}
          />
        );
      })()}
    </div>
  );
};
