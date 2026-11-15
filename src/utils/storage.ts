import {
  Student,
  Dormitory,
  Room,
  Bed,
  RoomWarning,
  Announcement,
  Message,
  Supervisor,
  AppSettings,
  CurrentUser,
  MaintenanceStaff,
  MaintenanceTask,
  WarehouseStaff,
  FinanceStaff,
  ProcurementStaff,
  StudentFinancialRecord,
  StudentFinancialStatus,
  InventoryItem,
  InventoryTransaction,
  WarehouseRequest,
  ProcurementRequest,
  ProcurementRequestStatus,
  SupervisorShiftSchedule,
  ShiftLogReport,
  CounselorStaff,
  CounselorShiftSchedule,
  CounselorShiftReport,
  ActivityLog,
  ActivityLogCategory,
  StudentEvaluation,
  GuestRequest,
  GuestEligibilityType,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_DORMITORIES,
  INITIAL_SUPERVISORS,
  INITIAL_STUDENTS,
  INITIAL_WARNINGS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_MESSAGES,
  INITIAL_MAINTENANCE_STAFF,
  INITIAL_MAINTENANCE_TASKS,
  INITIAL_WAREHOUSE_STAFF,
  INITIAL_FINANCE_STAFF,
  INITIAL_PROCUREMENT_STAFF,
  INITIAL_STUDENT_FINANCES,
  INITIAL_INVENTORY_ITEMS,
  INITIAL_INVENTORY_TRANSACTIONS,
  INITIAL_WAREHOUSE_REQUESTS,
  INITIAL_PROCUREMENT_REQUESTS,
  INITIAL_SHIFT_SCHEDULES,
  INITIAL_SHIFT_REPORTS,
  INITIAL_COUNSELORS,
  INITIAL_COUNSELOR_SHIFTS,
  INITIAL_COUNSELOR_REPORTS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_STUDENT_EVALUATIONS,
  INITIAL_GUEST_REQUESTS,
  generateInitialRoomsAndBeds,
} from './sampleData';

const API_BASE_URL = 'https://khabgah-api.vercel.app/api';

const STORAGE_KEYS = {
  SETTINGS: 'farhangian_dorm_settings_prod',
  DORMITORIES: 'farhangian_dorm_dormitories_prod',
  ROOMS: 'farhangian_dorm_rooms_prod',
  BEDS: 'farhangian_dorm_beds_prod',
  STUDENTS: 'farhangian_dorm_students_prod',
  SUPERVISORS: 'farhangian_dorm_supervisors_prod',
  WARNINGS: 'farhangian_dorm_warnings_prod',
  ANNOUNCEMENTS: 'farhangian_dorm_announcements_prod',
  MESSAGES: 'farhangian_dorm_messages_prod',
  CURRENT_USER: 'farhangian_dorm_current_user_prod',
  MAINTENANCE_STAFF: 'farhangian_dorm_maintenance_staff_prod',
  MAINTENANCE_TASKS: 'farhangian_dorm_maintenance_tasks_prod',
  WAREHOUSE_STAFF: 'farhangian_dorm_warehouse_staff_prod',
  FINANCE_STAFF: 'farhangian_dorm_finance_staff_prod',
  PROCUREMENT_STAFF: 'farhangian_dorm_procurement_staff_prod',
  STUDENT_FINANCES: 'farhangian_dorm_student_finances_prod',
  INVENTORY_ITEMS: 'farhangian_dorm_inventory_items_prod',
  INVENTORY_TRANSACTIONS: 'farhangian_dorm_inventory_transactions_prod',
  WAREHOUSE_REQUESTS: 'farhangian_dorm_warehouse_requests_prod',
  PROCUREMENT_REQUESTS: 'farhangian_dorm_procurement_requests_prod',
  SHIFT_SCHEDULES: 'farhangian_dorm_shift_schedules_prod',
  SHIFT_REPORTS: 'farhangian_dorm_shift_reports_prod',
  COUNSELORS: 'farhangian_dorm_counselors_prod',
  COUNSELOR_SHIFTS: 'farhangian_dorm_counselor_shifts_prod',
  COUNSELOR_REPORTS: 'farhangian_dorm_counselor_reports_prod',
  ACTIVITY_LOGS: 'farhangian_dorm_activity_logs_prod',
  STUDENT_EVALUATIONS: 'farhangian_dorm_student_evaluations_prod',
  GUEST_REQUESTS: 'farhangian_dorm_guest_requests_prod',
};


// مقداردهی اولیه پایگاه داده درون‌مرورگر
export function initializeStorageIfNeeded(): void {
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.DORMITORIES)) {
    localStorage.setItem(STORAGE_KEYS.DORMITORIES, JSON.stringify(INITIAL_DORMITORIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUPERVISORS)) {
    localStorage.setItem(STORAGE_KEYS.SUPERVISORS, JSON.stringify(INITIAL_SUPERVISORS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.WARNINGS)) {
    localStorage.setItem(STORAGE_KEYS.WARNINGS, JSON.stringify(INITIAL_WARNINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(INITIAL_MESSAGES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MAINTENANCE_STAFF)) {
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE_STAFF, JSON.stringify(INITIAL_MAINTENANCE_STAFF));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MAINTENANCE_TASKS)) {
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE_TASKS, JSON.stringify(INITIAL_MAINTENANCE_TASKS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.WAREHOUSE_STAFF)) {
    localStorage.setItem(STORAGE_KEYS.WAREHOUSE_STAFF, JSON.stringify(INITIAL_WAREHOUSE_STAFF));
  }
  if (!localStorage.getItem(STORAGE_KEYS.INVENTORY_ITEMS)) {
    localStorage.setItem(STORAGE_KEYS.INVENTORY_ITEMS, JSON.stringify(INITIAL_INVENTORY_ITEMS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.WAREHOUSE_REQUESTS)) {
    localStorage.setItem(STORAGE_KEYS.WAREHOUSE_REQUESTS, JSON.stringify(INITIAL_WAREHOUSE_REQUESTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SHIFT_SCHEDULES)) {
    localStorage.setItem(STORAGE_KEYS.SHIFT_SCHEDULES, JSON.stringify(INITIAL_SHIFT_SCHEDULES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SHIFT_REPORTS)) {
    localStorage.setItem(STORAGE_KEYS.SHIFT_REPORTS, JSON.stringify(INITIAL_SHIFT_REPORTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COUNSELORS)) {
    localStorage.setItem(STORAGE_KEYS.COUNSELORS, JSON.stringify(INITIAL_COUNSELORS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COUNSELOR_SHIFTS)) {
    localStorage.setItem(STORAGE_KEYS.COUNSELOR_SHIFTS, JSON.stringify(INITIAL_COUNSELOR_SHIFTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COUNSELOR_REPORTS)) {
    localStorage.setItem(STORAGE_KEYS.COUNSELOR_REPORTS, JSON.stringify(INITIAL_COUNSELOR_REPORTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(INITIAL_ACTIVITY_LOGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STUDENT_EVALUATIONS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENT_EVALUATIONS, JSON.stringify(INITIAL_STUDENT_EVALUATIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.FINANCE_STAFF)) {
    localStorage.setItem(STORAGE_KEYS.FINANCE_STAFF, JSON.stringify(INITIAL_FINANCE_STAFF));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROCUREMENT_STAFF)) {
    localStorage.setItem(STORAGE_KEYS.PROCUREMENT_STAFF, JSON.stringify(INITIAL_PROCUREMENT_STAFF));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STUDENT_FINANCES)) {
    localStorage.setItem(STORAGE_KEYS.STUDENT_FINANCES, JSON.stringify(INITIAL_STUDENT_FINANCES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.INVENTORY_TRANSACTIONS)) {
    localStorage.setItem(STORAGE_KEYS.INVENTORY_TRANSACTIONS, JSON.stringify(INITIAL_INVENTORY_TRANSACTIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROCUREMENT_REQUESTS)) {
    localStorage.setItem(STORAGE_KEYS.PROCUREMENT_REQUESTS, JSON.stringify(INITIAL_PROCUREMENT_REQUESTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.GUEST_REQUESTS)) {
    localStorage.setItem(STORAGE_KEYS.GUEST_REQUESTS, JSON.stringify(INITIAL_GUEST_REQUESTS));
  }

  if (!localStorage.getItem(STORAGE_KEYS.ROOMS) || !localStorage.getItem(STORAGE_KEYS.BEDS)) {
    const { rooms, beds } = generateInitialRoomsAndBeds();

    // همگام‌سازی تخت‌های رزرو شده دانشجویان اولیه
    INITIAL_STUDENTS.forEach((st) => {
      if (st.assignedBedId) {
        const foundBed = beds.find((b) => b.id === st.assignedBedId);
        if (foundBed) {
          foundBed.studentId = st.studentId;
        }
      }
    });

    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
    localStorage.setItem(STORAGE_KEYS.BEDS, JSON.stringify(beds));
  }

  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  }
}

// مدیریت زمان و وضعیت همگام‌سازی ابری برای جلوگیری از تداخل نوشتن و خواندن
const keyWriteTimestamps: Record<string, number> = {};
const pendingCloudRequests: Record<string, Promise<boolean> | undefined> = {};
let activeSyncPromise: Promise<boolean> | null = null;
const SYNCABLE_KEYS = Object.values(STORAGE_KEYS).filter((k) => k !== STORAGE_KEYS.CURRENT_USER);

function pushKeyToCloud<T>(key: string, value: T): void {
  if (key === STORAGE_KEYS.CURRENT_USER) return;
  keyWriteTimestamps[key] = Date.now();

  if (typeof fetch !== 'function') return;

  const reqPromise = fetch(`${API_BASE_URL}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  })
    .then((res) => {
      if (!res.ok) {
        console.warn(`Cloud sync POST non-OK (${res.status}) for key ${key}`);
        return false;
      }
      return true;
    })
    .catch((err) => {
      console.warn(`Cloud sync POST failed for key ${key}:`, err);
      return false;
    })
    .finally(() => {
      if (pendingCloudRequests[key] === reqPromise) {
        delete pendingCloudRequests[key];
      }
    });

  pendingCloudRequests[key] = reqPromise;
}

function normalizeLookupKey(raw: string | number | null | undefined): string {
  return String(raw ?? '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .trim()
    .toLowerCase();
}

export function compressAvatarImageFile(
  file: File,
  maxDim = 360,
  quality = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('خطا در خواندن فایل تصویر.'));
    reader.onload = (ev) => {
      const rawUrl = ev.target?.result as string;
      if (!rawUrl) {
        reject(new Error('فایل تصویر معتبر نیست.'));
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error('فرمت فایل تصویر پشتیبانی نمی‌شود.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.max(1, Math.round((height * maxDim) / width));
            width = maxDim;
          } else {
            width = Math.max(1, Math.round((width * maxDim) / height));
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawUrl);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(rawUrl);
        }
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  });
}

function normalizeStudentRecord(raw: Record<string, unknown>): Student {
  const { _id, __v, createdAt, updatedAt, ...rest } = raw;
  void _id;
  void __v;
  void createdAt;
  void updatedAt;
  const r = rest as Partial<Student>;
  return {
    ...r,
    studentId: String(r.studentId ?? ''),
    nationalId: String(r.nationalId ?? ''),
    fullName: String(r.fullName ?? ''),
    fieldOfStudy: String(r.fieldOfStudy ?? ''),
    entryTerm: String(r.entryTerm ?? ''),
    fatherName: String(r.fatherName ?? ''),
    birthDate: String(r.birthDate ?? ''),
    province: String(r.province ?? ''),
    city: String(r.city ?? ''),
    phone: String(r.phone ?? ''),
    mobile: String(r.mobile ?? ''),
    emergencyPhone: String(r.emergencyPhone ?? ''),
    parentPhone: String(r.parentPhone ?? ''),
    religion: String(r.religion ?? 'اسلام، شیعه'),
    previousDorm: String(r.previousDorm ?? ''),
    previousRoom: String(r.previousRoom ?? ''),
    previousScore: typeof r.previousScore === 'number' ? r.previousScore : 100,
    isProfileCompleted: Boolean(r.isProfileCompleted),
    assignmentStatus: r.assignmentStatus || 'none',
  };
}

// تابع کمکی برای خواندن از localStorage
function get<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return defaultValue;
  }
}

// تابع کمکی برای نوشتن در localStorage و ارسال غیرهمگام به سرور ابری
function set<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    pushKeyToCloud(key, value);
    return true;
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
    return false;
  }
}

export const Storage = {
  getSettings: (): AppSettings => get(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS),
  setSettings: (settings: AppSettings): boolean => set(STORAGE_KEYS.SETTINGS, settings),
  
  getDormitories: (): Dormitory[] => get(STORAGE_KEYS.DORMITORIES, INITIAL_DORMITORIES),
  setDormitories: (dorms: Dormitory[]) => set(STORAGE_KEYS.DORMITORIES, dorms),

  getRooms: (): Room[] => get(STORAGE_KEYS.ROOMS, []),
  setRooms: (rooms: Room[]) => set(STORAGE_KEYS.ROOMS, rooms),

  getBeds: (): Bed[] => get(STORAGE_KEYS.BEDS, []),
  setBeds: (beds: Bed[]) => set(STORAGE_KEYS.BEDS, beds),

  getStudents: (): Student[] => get(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS),
  setStudents: (students: Student[]) => set(STORAGE_KEYS.STUDENTS, students),

  getSupervisors: (): Supervisor[] => get(STORAGE_KEYS.SUPERVISORS, INITIAL_SUPERVISORS),
  setSupervisors: (supervisors: Supervisor[]) => set(STORAGE_KEYS.SUPERVISORS, supervisors),

  updateSupervisor: (
    id: string,
    updates: Partial<Supervisor>
  ): { success: boolean; message: string } => {
    const list = Storage.getSupervisors();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false, message: 'کاربر سرپرست یافت نشد.' };
    if (updates.username) {
      const cleanU = updates.username.trim().toLowerCase();
      if (list.some((s) => s.id !== id && s.username.trim().toLowerCase() === cleanU)) {
        return { success: false, message: 'این نام کاربری قبلاً برای سرپرست دیگری ثبت شده است.' };
      }
    }
    list[idx] = { ...list[idx], ...updates };
    Storage.setSupervisors(list);
    const currentUser = Storage.getCurrentUser();
    if (currentUser && currentUser.role === 'supervisor' && currentUser.supervisor.id === id) {
      Storage.setCurrentUser({ role: 'supervisor', supervisor: list[idx] });
    }
    return { success: true, message: 'مشخصات سرپرست با موفقیت بروزرسانی شد.' };
  },

  getWarnings: (): RoomWarning[] => get(STORAGE_KEYS.WARNINGS, INITIAL_WARNINGS),
  setWarnings: (warnings: RoomWarning[]) => set(STORAGE_KEYS.WARNINGS, warnings),

  getAnnouncements: (): Announcement[] => get(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS),
  setAnnouncements: (announcements: Announcement[]) => set(STORAGE_KEYS.ANNOUNCEMENTS, announcements),

  addAnnouncement: (announcement: Omit<Announcement, 'id'>) => {
    const announcements = Storage.getAnnouncements();
    const newAnn: Announcement = {
      ...announcement,
      id: `ann_${Date.now()}`,
    };
    announcements.unshift(newAnn);
    Storage.setAnnouncements(announcements);
    Storage.addActivityLog({
      category: 'settings',
      action: 'انتشار اطلاعیه جدید',
      details: `اطلاعیه «${newAnn.title}» ثبت شد.`,
      targetName: newAnn.title,
    });
    return newAnn;
  },

  updateAnnouncement: (id: string, updated: Partial<Announcement>): boolean => {
    const announcements = Storage.getAnnouncements();
    const idx = announcements.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    announcements[idx] = { ...announcements[idx], ...updated };
    Storage.setAnnouncements(announcements);
    return true;
  },

  deleteAnnouncement: (id: string) => {
    const target = Storage.getAnnouncements().find((a) => a.id === id);
    const announcements = Storage.getAnnouncements().filter((a) => a.id !== id);
    Storage.setAnnouncements(announcements);
    Storage.addActivityLog({
      category: 'settings',
      action: 'حذف اطلاعیه',
      details: `اطلاعیه «${target?.title || id}» حذف شد.`,
      targetName: target?.title || id,
    });
  },

  toggleAnnouncementHomePage: (id: string) => {
    const announcements = Storage.getAnnouncements();
    const ann = announcements.find((a) => a.id === id);
    if (ann) {
      ann.showOnHomePage = ann.showOnHomePage === false ? true : false;
      Storage.setAnnouncements(announcements);
    }
  },

  // ایجاد اتاق و تخت‌های آن توسط مدیر
  addRoomWithBeds: (
    dormId: string,
    roomNumber: string,
    floor: number,
    capacity: number
  ): { success: boolean; message: string } => {
    const rooms = Storage.getRooms();
    const beds = Storage.getBeds();

    // بررسی تکراری نبودن شماره اتاق در سرا
    if (rooms.some((r) => r.dormId === dormId && r.roomNumber === roomNumber)) {
      return { success: false, message: `اتاق شماره ${roomNumber} قبلاً در این سرا ثبت شده است.` };
    }

    const roomId = `room_${dormId}_${roomNumber}_${Date.now()}`;
    const newRoom: Room = {
      id: roomId,
      dormId,
      roomNumber,
      floor,
      capacity,
      facilities: ['یخچال', 'شوفاژ', 'کمد دیواری'],
      status: 'active',
    };

    const newBeds: Bed[] = [];
    const pairsCount = Math.ceil(capacity / 2);
    let bedIndex = 1;

    for (let p = 1; p <= pairsCount; p++) {
      if (bedIndex <= capacity) {
        newBeds.push({
          id: `bed_${roomId}_${bedIndex}`,
          roomId,
          dormId,
          bedNumber: bedIndex,
          label: `تخت ${bedIndex} (طبقه پایین)`,
          tier: 'lower',
          studentId: null,
          bunkNumber: p,
        });
        bedIndex++;
      }
      if (bedIndex <= capacity) {
        newBeds.push({
          id: `bed_${roomId}_${bedIndex}`,
          roomId,
          dormId,
          bedNumber: bedIndex,
          label: `تخت ${bedIndex} (طبقه بالا)`,
          tier: 'upper',
          studentId: null,
          bunkNumber: p,
        });
        bedIndex++;
      }
    }

    rooms.push(newRoom);
    beds.push(...newBeds);

    Storage.setRooms(rooms);
    Storage.setBeds(beds);
    Storage.addActivityLog({
      category: 'dorm_structure',
      action: 'ایجاد اتاق جدید',
      details: `اتاق ${roomNumber} با ظرفیت ${capacity} تخت ایجاد شد.`,
      targetName: `اتاق ${roomNumber}`,
    });

    return {
      success: true,
      message: `اتاق ${roomNumber} با ظرفیت ${capacity} تخت با موفقیت در سرا ایجاد گردید.`,
    };
  },

  // حذف اتاق و آزادسازی کلیه تخت‌های آن
  // ایجاد سرای جدید توسط مدیر
  addDormitory: (dorm: Dormitory): { success: boolean; message: string } => {
    const dorms = Storage.getDormitories();
    if (dorms.some((d) => d.id === dorm.id || d.name.trim() === dorm.name.trim())) {
      return { success: false, message: 'سرایی با این نام یا شناسه قبلاً ثبت شده است.' };
    }
    dorms.push(dorm);
    Storage.setDormitories(dorms);
    Storage.addActivityLog({
      category: 'dorm_structure',
      action: 'ایجاد سرای جدید',
      details: `سرای «${dorm.name}» در پردیس ${dorm.campus} ثبت شد.`,
      targetName: dorm.name,
    });
    return { success: true, message: `سرای «${dorm.name}» با موفقیت افزوده شد.` };
  },

  // حذف سرا و کلیه اتاق‌ها، تخت‌ها و آزادسازی اسکان دانشجویان
  deleteDormitory: (dormId: string): { success: boolean; message: string } => {
    const dorms = Storage.getDormitories();
    if (dorms.length <= 1) {
      return { success: false, message: 'حداقل یک سرا باید در سامانه باقی بماند و امکان حذف همه سراها وجود ندارد.' };
    }
    const targetDorm = dorms.find((d) => d.id === dormId);
    const rooms = Storage.getRooms().filter((r) => r.dormId === dormId);
    rooms.forEach((r) => Storage.deleteRoom(r.id));
    const updatedDorms = dorms.filter((d) => d.id !== dormId);
    Storage.setDormitories(updatedDorms);
    Storage.addActivityLog({
      category: 'dorm_structure',
      action: 'حذف سرا',
      details: `سرای «${targetDorm?.name || dormId}» و کلیه اتاق‌ها و تخت‌های آن حذف شد.`,
      targetName: targetDorm?.name || dormId,
      severity: 'warning',
    });
    return { success: true, message: 'سرا و کلیه اتاق‌ها و تخت‌های مربوطه با موفقیت حذف گردیدند.' };
  },

  // ویرایش و تغییر نام سرای دانشجویی
  updateDormitory: (
    dormId: string,
    updates: Partial<Dormitory>
  ): { success: boolean; message: string } => {
    const dorms = Storage.getDormitories();
    const idx = dorms.findIndex((d) => d.id === dormId);
    if (idx === -1) {
      return { success: false, message: 'سرای مورد نظر یافت نشد.' };
    }

    const oldDorm = dorms[idx];
    const cleanName = updates.name !== undefined ? updates.name.trim() : oldDorm.name;
    if (!cleanName) {
      return { success: false, message: 'نام سرا نمی‌تواند خالی باشد.' };
    }

    if (dorms.some((d) => d.id !== dormId && d.name.trim() === cleanName)) {
      return { success: false, message: `سرایی با نام «${cleanName}» قبلاً در سامانه ثبت شده است.` };
    }

    const updatedDorm: Dormitory = {
      ...oldDorm,
      ...updates,
      name: cleanName,
      campus: updates.campus !== undefined ? updates.campus.trim() : oldDorm.campus,
    };
    dorms[idx] = updatedDorm;
    Storage.setDormitories(dorms);

    if (cleanName !== oldDorm.name) {
      // بروزرسانی نام سرا در پرونده دانشجویان
      const students = Storage.getStudents();
      let stChanged = false;
      students.forEach((s) => {
        if (s.assignedDormId === dormId) {
          s.assignedDormName = cleanName;
          stChanged = true;
        }
      });
      if (stChanged) Storage.setStudents(students);

      // بروزرسانی در ارزیابی‌ها و تذکرات
      const evals = Storage.getStudentEvaluations();
      let evChanged = false;
      evals.forEach((ev) => {
        if (ev.dormId === dormId) {
          ev.dormName = cleanName;
          evChanged = true;
        }
      });
      if (evChanged) Storage.setStudentEvaluations(evals);

      // بروزرسانی در مأموریت‌های تأسیساتی
      const tasks = Storage.getMaintenanceTasks();
      let tChanged = false;
      tasks.forEach((t) => {
        if (t.dormId === dormId) {
          t.dormName = cleanName;
          tChanged = true;
        }
      });
      if (tChanged) set(STORAGE_KEYS.MAINTENANCE_TASKS, tasks);

      // بروزرسانی در حواله‌های انبار
      const reqs = Storage.getWarehouseRequests();
      let wChanged = false;
      reqs.forEach((w) => {
        if (w.dormId === dormId) {
          w.dormName = cleanName;
          wChanged = true;
        }
      });
      if (wChanged) set(STORAGE_KEYS.WAREHOUSE_REQUESTS, reqs);

      // بروزرسانی در شیفت‌ها و گزارش شیفت‌ها
      const schedules = Storage.getShiftSchedules();
      let scChanged = false;
      schedules.forEach((sc) => {
        if (sc.dormId === dormId) {
          sc.dormName = cleanName;
          scChanged = true;
        }
      });
      if (scChanged) Storage.setShiftSchedules(schedules);

      const shiftReports = Storage.getShiftReports();
      let srChanged = false;
      shiftReports.forEach((sr) => {
        if (sr.dormId === dormId) {
          sr.dormName = cleanName;
          srChanged = true;
        }
      });
      if (srChanged) set(STORAGE_KEYS.SHIFT_REPORTS, shiftReports);
    }

    Storage.addActivityLog({
      category: 'dorm_structure',
      action: cleanName !== oldDorm.name ? 'تغییر نام و ویرایش سرا' : 'ویرایش مشخصات سرا',
      details:
        cleanName !== oldDorm.name
          ? `نام سرا از «${oldDorm.name}» به «${cleanName}» تغییر یافت.`
          : `مشخصات سرای «${cleanName}» بروزرسانی شد.`,
      targetName: cleanName,
    });

    return {
      success: true,
      message:
        cleanName !== oldDorm.name
          ? `نام سرا با موفقیت به «${cleanName}» تغییر یافت.`
          : `مشخصات سرای «${cleanName}» با موفقیت بروزرسانی شد.`,
    };
  },

  // افزودن تخت مجزا به اتاق
  addBedToRoom: (
    roomId: string,
    tier: 'lower' | 'upper' = 'lower'
  ): { success: boolean; message: string; bed?: Bed } => {
    const rooms = Storage.getRooms();
    const beds = Storage.getBeds();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) {
      return { success: false, message: 'اتاق یافت نشد.' };
    }

    const roomBeds = beds.filter((b) => b.roomId === roomId);
    const nextBedNumber = roomBeds.length + 1;
    const bunkNum = Math.ceil(nextBedNumber / 2);
    const newBedId = `bed_${roomId}_${Date.now()}_${nextBedNumber}`;
    const finalTier: 'lower' | 'upper' = tier || (nextBedNumber % 2 === 1 ? 'lower' : 'upper');

    const newBed: Bed = {
      id: newBedId,
      roomId,
      dormId: room.dormId,
      bedNumber: nextBedNumber,
      label: `تخت ${nextBedNumber} (${finalTier === 'lower' ? 'طبقه پایین' : 'طبقه بالا'})`,
      tier: finalTier,
      studentId: null,
      bunkNumber: bunkNum,
    };

    beds.push(newBed);
    room.capacity = (room.capacity || 0) + 1;

    Storage.setBeds(beds);
    Storage.setRooms(rooms);

    return {
      success: true,
      message: `تخت جدید با موفقیت به اتاق ${room.roomNumber} اضافه گردید (ظرفیت فعلی: ${room.capacity} تخت).`,
      bed: newBed,
    };
  },

  // حذف تخت و آزادسازی دانشجو در صورت اسکان
  deleteBed: (bedId: string): { success: boolean; message: string } => {
    const beds = Storage.getBeds();
    const rooms = Storage.getRooms();
    const students = Storage.getStudents();

    const bedIndex = beds.findIndex((b) => b.id === bedId);
    if (bedIndex === -1) {
      return { success: false, message: 'تخت مورد نظر یافت نشد.' };
    }

    const targetBed = beds[bedIndex];
    if (targetBed.studentId) {
      const st = students.find((s) => s.studentId === targetBed.studentId);
      if (st) {
        st.assignedDormId = undefined;
        st.assignedRoomId = undefined;
        st.assignedBedId = undefined;
        st.assignmentStatus = 'none';
      }
      Storage.setStudents(students);
    }

    const room = rooms.find((r) => r.id === targetBed.roomId);
    if (room && room.capacity > 0) {
      room.capacity -= 1;
      Storage.setRooms(rooms);
    }

    const updatedBeds = beds.filter((b) => b.id !== bedId);
    Storage.setBeds(updatedBeds);

    return { success: true, message: 'تخت با موفقیت حذف گردید.' };
  },

  // ویرایش مشخصات، تغییر نام/شماره و امکانات و سهمیه‌های اتاق
  updateRoom: (
    roomId: string,
    updates: Partial<Room>
  ): { success: boolean; message: string } => {
    const rooms = Storage.getRooms();
    const idx = rooms.findIndex((r) => r.id === roomId);
    if (idx === -1) {
      return { success: false, message: 'اتاق یافت نشد.' };
    }

    const oldRoom = rooms[idx];
    const cleanRoomNumber =
      updates.roomNumber !== undefined ? updates.roomNumber.trim() : oldRoom.roomNumber;
    if (!cleanRoomNumber) {
      return { success: false, message: 'نام یا شماره اتاق نمی‌تواند خالی باشد.' };
    }

    if (
      cleanRoomNumber !== oldRoom.roomNumber &&
      rooms.some((r) => r.dormId === oldRoom.dormId && r.id !== roomId && r.roomNumber.trim() === cleanRoomNumber)
    ) {
      return {
        success: false,
        message: `اتاقی با شماره/نام «${cleanRoomNumber}» در این سرا از قبل وجود دارد.`,
      };
    }

    rooms[idx] = { ...oldRoom, ...updates, roomNumber: cleanRoomNumber };
    Storage.setRooms(rooms);

    if (cleanRoomNumber !== oldRoom.roomNumber) {
      // بروزرسانی نام/شماره اتاق در پرونده دانشجویان
      const students = Storage.getStudents();
      let stChanged = false;
      students.forEach((s) => {
        if (s.assignedRoomId === roomId) {
          s.assignedRoomNumber = cleanRoomNumber;
          stChanged = true;
        }
      });
      if (stChanged) Storage.setStudents(students);

      // بروزرسانی در ارزیابی‌ها و تذکرات
      const evals = Storage.getStudentEvaluations();
      let evChanged = false;
      evals.forEach((ev) => {
        if (ev.roomId === roomId) {
          ev.roomNumber = cleanRoomNumber;
          evChanged = true;
        }
      });
      if (evChanged) Storage.setStudentEvaluations(evals);

      // بروزرسانی در مأموریت‌های تأسیساتی
      const tasks = Storage.getMaintenanceTasks();
      let tChanged = false;
      tasks.forEach((t) => {
        if (t.dormId === oldRoom.dormId && t.roomNumber === oldRoom.roomNumber) {
          t.roomNumber = cleanRoomNumber;
          tChanged = true;
        }
      });
      if (tChanged) set(STORAGE_KEYS.MAINTENANCE_TASKS, tasks);

      Storage.addActivityLog({
        category: 'dorm_structure',
        action: 'تغییر نام / شماره اتاق',
        details: `نام/شماره اتاق از «${oldRoom.roomNumber}» به «${cleanRoomNumber}» تغییر یافت.`,
        targetName: `اتاق ${cleanRoomNumber}`,
      });
    }

    return {
      success: true,
      message:
        cleanRoomNumber !== oldRoom.roomNumber
          ? `نام/شماره اتاق با موفقیت از «${oldRoom.roomNumber}» به «${cleanRoomNumber}» تغییر یافت.`
          : 'اطلاعات و امکانات اتاق با موفقیت بروزرسانی شد.',
    };
  },

  deleteRoom: (roomId: string): { success: boolean; message: string } => {
    const rooms = Storage.getRooms();
    const beds = Storage.getBeds();
    const students = Storage.getStudents();

    const roomIndex = rooms.findIndex((r) => r.id === roomId);
    if (roomIndex === -1) {
      return { success: false, message: 'اتاق مورد نظر یافت نشد.' };
    }

    // آزادسازی دانشجویان ساکن در این اتاق
    beds.forEach((b) => {
      if (b.roomId === roomId && b.studentId) {
        const st = students.find((s) => s.studentId === b.studentId);
        if (st) {
          st.assignedDormId = undefined;
          st.assignedRoomId = undefined;
          st.assignedBedId = undefined;
          st.assignmentStatus = 'none';
        }
      }
    });

    const updatedBeds = beds.filter((b) => b.roomId !== roomId);
    const updatedRooms = rooms.filter((r) => r.id !== roomId);

    Storage.setStudents(students);
    Storage.setBeds(updatedBeds);
    Storage.setRooms(updatedRooms);

    return { success: true, message: 'اتاق و تخت‌های آن حذف و دانشجویان مرتبط آزاد شدند.' };
  },

  getMessages: (): Message[] => get(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES),
  setMessages: (messages: Message[]) => set(STORAGE_KEYS.MESSAGES, messages),

  getCurrentUser: (): CurrentUser => get(STORAGE_KEYS.CURRENT_USER, null),
  setCurrentUser: (user: CurrentUser) => set(STORAGE_KEYS.CURRENT_USER, user),

  // تخصیص تخت به دانشجو (توسط دانشجو: موقت | توسط سرپرست یا مدیر: قطعی)
  assignBedToStudent: (
    studentId: string,
    bedId: string,
    isConfirmed: boolean = false
  ): { success: boolean; message: string } => {
    const beds = Storage.getBeds();
    const students = Storage.getStudents();
    const rooms = Storage.getRooms();

    const targetBed = beds.find((b) => b.id === bedId);
    if (!targetBed) {
      return { success: false, message: 'تخت مورد نظر یافت نشد.' };
    }

    if (targetBed.studentId && targetBed.studentId !== studentId) {
      return { success: false, message: 'این تخت توسط دانشجوی دیگری انتخاب و رزرو شده است.' };
    }

    const studentIndex = students.findIndex((s) => s.studentId === studentId);
    if (studentIndex === -1) {
      return { success: false, message: 'دانشجو یافت نشد.' };
    }

    const student = students[studentIndex];
    const room = rooms.find((r) => r.id === targetBed.roomId);

    // بررسی سهمیه رشته
    if (room?.allowedFields && room.allowedFields.length > 0) {
      const stField = student.fieldOfStudy || '';
      if (!room.allowedFields.some((f) => stField.includes(f) || (stField && f.includes(stField)))) {
        return { success: false, message: `این اتاق ویژه رشته‌های [${room.allowedFields.join('، ')}] می‌باشد.` };
      }
    }

    // بررسی سهمیه ترم ورود
    if (room?.allowedEntryTerms && room.allowedEntryTerms.length > 0) {
      if (!room.allowedEntryTerms.includes(student.entryTerm)) {
        return { success: false, message: `این اتاق ویژه ورودی‌های [${room.allowedEntryTerms.join('، ')}] می‌باشد.` };
      }
    }

    // آزادسازی تخت قبلی اگر دانشجو تختی داشت
    beds.forEach((b) => {
      if (b.studentId === studentId) {
        b.studentId = null;
        b.assignmentStatus = undefined;
      }
    });

    // تخصیص تخت جدید با وضعیت موقت یا قطعی
    const finalStatus = isConfirmed ? 'confirmed' : 'temporary';
    targetBed.studentId = studentId;
    targetBed.assignmentStatus = finalStatus;

    student.assignedDormId = targetBed.dormId;
    student.assignedRoomId = targetBed.roomId;
    student.assignedBedId = targetBed.id;
    student.assignmentStatus = finalStatus;

    Storage.setBeds(beds);
    Storage.setStudents(students);

    Storage.addActivityLog({
      category: 'accommodation',
      action: isConfirmed ? 'تخصیص قطعی تخت' : 'درخواست انتخاب تخت (موقت)',
      details: `تخت ${targetBed.label} در اتاق ${room?.roomNumber || '-'} برای دانشجو ${student.fullName} (${student.studentId}) ثبت شد.`,
      targetName: `${student.fullName} (${student.studentId})`,
    });

    // بروزرسانی کاربر فعال اگر دانشجو لاگین است
    const currentUser = Storage.getCurrentUser();
    if (currentUser && currentUser.role === 'student' && currentUser.student.studentId === studentId) {
      Storage.setCurrentUser({ role: 'student', student });
    }

    return {
      success: true,
      message: isConfirmed
        ? 'تخت با موفقیت تخصیص یافته و اسکان قطعی شد.'
        : 'درخواست انتخاب اتاق با موفقیت ثبت شد و به صورت موقت رزرو گردید. پس از تأیید سرپرست یا مدیر سرا، اسکان شما قطعی خواهد شد.',
    };
  },

  // تأیید قطعی درخواست اسکان موقت توسط سرپرست یا مدیر
  confirmStudentAssignment: (studentId: string): { success: boolean; message: string } => {
    const students = Storage.getStudents();
    const beds = Storage.getBeds();
    const rooms = Storage.getRooms();

    const student = students.find((s) => s.studentId === studentId);
    if (!student || !student.assignedBedId) {
      return { success: false, message: 'دانشجو یا تخت انتخابی یافت نشد.' };
    }

    student.assignmentStatus = 'confirmed';
    const bed = beds.find((b) => b.id === student.assignedBedId);
    if (bed) {
      bed.assignmentStatus = 'confirmed';
    }

    const room = rooms.find((r) => r.id === student.assignedRoomId);

    Storage.setStudents(students);
    Storage.setBeds(beds);
    Storage.addActivityLog({
      category: 'accommodation',
      action: 'تأیید قطعی اسکان دانشجو',
      details: `اسکان دانشجو ${student.fullName} (${student.studentId}) در اتاق ${room?.roomNumber || '-'} تأیید قطعی شد.`,
      targetName: `${student.fullName} (${student.studentId})`,
    });

    // ارسال پیام تأیید قطعی به دانشجو
    const messages = Storage.getMessages();
    messages.unshift({
      id: `msg_sys_confirm_${Date.now()}`,
      senderId: 'supervisor',
      senderName: 'سرپرستی و اداره سراهای دانشجویی',
      senderRole: 'supervisor',
      receiverType: 'student',
      receiverId: studentId,
      subject: 'تأیید قطعی اسکان در خوابگاه',
      content: `دانشجوی گرامی ${student.fullName}، درخواست اسکان موقت شما در اتاق ${room?.roomNumber || ''} و ${bed?.label || ''} بررسی و توسط سرپرستی/مدیریت سرا تأیید قطعی شد.`,
      category: 'accommodation',
      date: new Date().toLocaleDateString('fa-IR'),
      status: 'answered',
      replies: [],
    });
    Storage.setMessages(messages);

    const currentUser = Storage.getCurrentUser();
    if (currentUser && currentUser.role === 'student' && currentUser.student.studentId === studentId) {
      Storage.setCurrentUser({ role: 'student', student });
    }

    return { success: true, message: `اسکان دانشجو ${student.fullName} با موفقیت تأیید قطعی شد.` };
  },

  // تأیید دسته‌جمعی همه درخواست‌های اسکان موقت (ویژه مدیر کل سامانه یا سرپرست سرا)
  bulkConfirmAllAssignments: (dormId?: string | string[]): { success: boolean; confirmedCount: number; message: string } => {
    const students = Storage.getStudents();
    const beds = Storage.getBeds();
    const rooms = Storage.getRooms();
    const messages = Storage.getMessages();
    let count = 0;

    const allowedDormIds = Array.isArray(dormId)
      ? dormId.filter((d) => d !== 'all')
      : dormId && dormId !== 'all'
      ? [dormId]
      : null;

    students.forEach((s) => {
      if (s.assignedBedId && s.assignmentStatus === 'temporary') {
        if (allowedDormIds && allowedDormIds.length > 0 && (!s.assignedDormId || !allowedDormIds.includes(s.assignedDormId))) {
          return;
        }
        s.assignmentStatus = 'confirmed';
        const bed = beds.find((b) => b.id === s.assignedBedId);
        if (bed) {
          bed.assignmentStatus = 'confirmed';
        }
        const room = rooms.find((r) => r.id === s.assignedRoomId);
        messages.unshift({
          id: `msg_sys_bulk_confirm_${Date.now()}_${s.studentId}`,
          senderId: dormId ? 'supervisor' : 'admin',
          senderName: dormId ? 'سرپرستی سراهای دانشجویی' : 'مدیریت کل سراهای دانشگاه فرهنگیان',
          senderRole: dormId ? 'supervisor' : 'admin',
          receiverType: 'student',
          receiverId: s.studentId,
          subject: 'تأیید دسته‌جمعی اسکان خوابگاه',
          content: `دانشجوی گرامی ${s.fullName}، اسکان شما در اتاق ${room?.roomNumber || ''} و ${bed?.label || ''} توسط مسئولان سرا تأیید قطعی شد.`,
          category: 'accommodation',
          date: new Date().toLocaleDateString('fa-IR'),
          status: 'answered',
          replies: [],
        });
        count++;
      }
    });

    if (count > 0) {
      Storage.setStudents(students);
      Storage.setBeds(beds);
      Storage.setMessages(messages);
      Storage.addActivityLog({
        category: 'accommodation',
        action: 'تأیید دسته‌جمعی اسکان دانشجویان',
        details: `تعداد ${count} درخواست اسکان موقت به صورت دسته‌جمعی تأیید قطعی شد.`,
        targetName: `${count} دانشجو`,
      });
    }

    return {
      success: true,
      confirmedCount: count,
      message:
        count > 0
          ? `تعداد ${count} درخواست اسکان موقت با موفقیت به صورت دسته‌جمعی تأیید قطعی شدند.`
          : 'در حال حاضر هیچ درخواست اسکان موقتی در انتظار تأیید وجود ندارد.',
    };
  },

  // رد درخواست اسکان موقت و آزادسازی تخت
  rejectStudentAssignment: (studentId: string, reason?: string): { success: boolean; message: string } => {
    const students = Storage.getStudents();
    const beds = Storage.getBeds();
    const rooms = Storage.getRooms();

    const student = students.find((s) => s.studentId === studentId);
    if (!student || !student.assignedBedId) {
      return { success: false, message: 'دانشجو یا تخت انتخابی یافت نشد.' };
    }

    const room = rooms.find((r) => r.id === student.assignedRoomId);
    const bed = beds.find((b) => b.id === student.assignedBedId);

    if (bed) {
      bed.studentId = null;
      bed.assignmentStatus = undefined;
    }

    student.assignedDormId = undefined;
    student.assignedRoomId = undefined;
    student.assignedBedId = undefined;
    student.assignmentStatus = 'none';

    // پیام به دانشجو
    const messages = Storage.getMessages();
    messages.unshift({
      id: `msg_sys_reject_${Date.now()}`,
      senderId: 'supervisor',
      senderName: 'سرپرستی سراهای دانشجویی',
      senderRole: 'supervisor',
      receiverType: 'student',
      receiverId: studentId,
      subject: 'عدم تأیید درخواست انتخاب اتاق',
      content: `دانشجوی گرامی ${student.fullName}، اسکان موقت شما در اتاق ${room?.roomNumber || ''} به علت «${reason || 'تصمیم سرپرستی سراها یا عدم احراز شرایط'}» تأیید نشد و تخت آزاد گردید. لطفاً نسبت به انتخاب اتاق جدید اقدام نمایید.`,
      category: 'accommodation',
      date: new Date().toLocaleDateString('fa-IR'),
      status: 'answered',
      replies: [],
    });

    Storage.setStudents(students);
    Storage.setBeds(beds);
    Storage.setMessages(messages);
    Storage.addActivityLog({
      category: 'accommodation',
      action: 'رد درخواست اسکان موقت',
      details: `درخواست اسکان دانشجو ${student.fullName} (${student.studentId}) رد و تخت آزاد شد.`,
      targetName: `${student.fullName} (${student.studentId})`,
      severity: 'warning',
    });

    const currentUser = Storage.getCurrentUser();
    if (currentUser && currentUser.role === 'student' && currentUser.student.studentId === studentId) {
      Storage.setCurrentUser({ role: 'student', student });
    }

    return { success: true, message: `درخواست اسکان دانشجو ${student.fullName} رد و تخت آزاد گردید.` };
  },

  // لغو یا آزادسازی تخت دانشجو
  releaseBed: (studentId: string): { success: boolean; message: string } => {
    const beds = Storage.getBeds();
    const students = Storage.getStudents();

    beds.forEach((b) => {
      if (b.studentId === studentId) {
        b.studentId = null;
        b.assignmentStatus = undefined;
      }
    });

    const student = students.find((s) => s.studentId === studentId);
    if (student) {
      student.assignedDormId = undefined;
      student.assignedRoomId = undefined;
      student.assignedBedId = undefined;
      student.assignmentStatus = 'none';
    }

    Storage.setBeds(beds);
    Storage.setStudents(students);

    if (student) {
      Storage.addActivityLog({
        category: 'accommodation',
        action: 'تخلیه و آزادسازی تخت',
        details: `تخت دانشجو ${student.fullName} (${student.studentId}) آزاد شد.`,
        targetName: `${student.fullName} (${student.studentId})`,
      });
    }

    const currentUser = Storage.getCurrentUser();
    if (currentUser && currentUser.role === 'student' && currentUser.student.studentId === studentId && student) {
      Storage.setCurrentUser({ role: 'student', student });
    }

    return { success: true, message: 'تخت با موفقیت آزاد شد.' };
  },

  // جابجایی دستی دانشجو توسط سرپرست (به صورت قطعی)
  moveStudentBySupervisor: (
    studentId: string,
    targetBedId: string,
    reason: string
  ): { success: boolean; message: string } => {
    const result = Storage.assignBedToStudent(studentId, targetBedId, true);
    if (result.success) {
      // ثبت پیام اطلاع‌رسانی به دانشجو
      const messages = Storage.getMessages();
      const student = Storage.getStudents().find((s) => s.studentId === studentId);
      messages.unshift({
        id: `msg_sys_${Date.now()}`,
        senderId: 'supervisor',
        senderName: 'سرپرستی سراهای دانشجویی',
        senderRole: 'supervisor',
        receiverType: 'student',
        receiverId: studentId,
        subject: 'اطلاع‌رسانی جابجایی و تثبیت اتاق/تخت',
        content: `دانشجوی گرامی ${student?.fullName || ''}، شما توسط سرپرست خوابگاه به تخت جدید منتقل و اسکان شما قطعی گردید. علت: ${reason || 'تصمیم سرپرستی'}`,
        category: 'accommodation',
        date: new Date().toLocaleDateString('fa-IR'),
        status: 'answered',
        replies: [],
      });
      Storage.setMessages(messages);
    }
    return result;
  },

  // تطبیق و اتصال دسته‌جمعی عکس‌های دانشجویان از روی پوشه و نام فایل (کد دانشجویی)
  batchAssignStudentPhotos: (
    photoMap: Record<string, string>
  ): { matchedCount: number; unmatchedKeys: string[]; totalProcessed: number; saved: boolean } => {
    const students = Storage.getStudents();
    let matchedCount = 0;
    const unmatchedKeys: string[] = [];

    Object.entries(photoMap).forEach(([studentIdKey, photoDataUrl]) => {
      const cleanKey = normalizeLookupKey(studentIdKey);
      const digitMatch = cleanKey.match(/\d+/)?.[0] || cleanKey;
      const st =
        students.find((s) => normalizeLookupKey(s.studentId) === cleanKey) ||
        students.find((s) => normalizeLookupKey(s.studentId) === digitMatch);
      if (st) {
        st.photoUrl = photoDataUrl;
        matchedCount++;
      } else {
        unmatchedKeys.push(studentIdKey.trim());
      }
    });

    let saved = true;
    if (matchedCount > 0) {
      saved = Storage.setStudents(students);
      if (saved) {
        Storage.addActivityLog({
          category: 'student',
          action: 'بارگذاری دسته‌جمعی عکس دانشجویان',
          details: `تعداد ${matchedCount} تصویر پرسنلی از طریق تطبیق کد دانشجویی به پرونده دانشجویان متصل شد.`,
          targetName: `${matchedCount} دانشجو`,
        });
        const currentUser = Storage.getCurrentUser();
        if (currentUser && currentUser.role === 'student') {
          const refreshed = students.find((s) => s.studentId === currentUser.student.studentId);
          if (refreshed) {
            Storage.setCurrentUser({ role: 'student', student: refreshed });
          }
        }
      }
    }

    return {
      matchedCount,
      unmatchedKeys,
      totalProcessed: Object.keys(photoMap).length,
      saved,
    };
  },

  // تطبیق و اتصال دسته‌جمعی عکس‌های پرسنل و کادر بر اساس نام/کد کاربری
  batchAssignStaffPhotos: (
    role: 'supervisor' | 'maintenance' | 'warehouse' | 'counselor' | 'finance' | 'procurement',
    photoMap: Record<string, string>
  ): { matchedCount: number; unmatchedKeys: string[]; totalProcessed: number; saved: boolean } => {
    let matchedCount = 0;
    const unmatchedKeys: string[] = [];
    let saved = true;

    const findMatch = <T extends { id: string; username: string; photoUrl?: string }>(
      list: T[],
      rawKey: string
    ): T | undefined => {
      const cleanKey = normalizeLookupKey(rawKey);
      return (
        list.find((u) => normalizeLookupKey(u.username) === cleanKey) ||
        list.find((u) => normalizeLookupKey(u.id) === cleanKey)
      );
    };

    if (role === 'supervisor') {
      const list = Storage.getSupervisors();
      Object.entries(photoMap).forEach(([key, dataUrl]) => {
        const match = findMatch(list, key);
        if (match) {
          match.photoUrl = dataUrl;
          matchedCount++;
        } else {
          unmatchedKeys.push(key.trim());
        }
      });
      if (matchedCount > 0) {
        saved = Storage.setSupervisors(list);
        const cu = Storage.getCurrentUser();
        if (saved && cu && cu.role === 'supervisor') {
          const ref = list.find((s) => s.id === cu.supervisor.id);
          if (ref) Storage.setCurrentUser({ role: 'supervisor', supervisor: ref });
        }
      }
    } else if (role === 'maintenance') {
      const list = Storage.getMaintenanceStaff();
      Object.entries(photoMap).forEach(([key, dataUrl]) => {
        const match = findMatch(list, key);
        if (match) {
          match.photoUrl = dataUrl;
          matchedCount++;
        } else {
          unmatchedKeys.push(key.trim());
        }
      });
      if (matchedCount > 0) {
        saved = Storage.setMaintenanceStaff(list);
        const cu = Storage.getCurrentUser();
        if (saved && cu && cu.role === 'maintenance') {
          const ref = list.find((t) => t.id === cu.technician.id);
          if (ref) Storage.setCurrentUser({ role: 'maintenance', technician: ref });
        }
      }
    } else if (role === 'warehouse') {
      const list = Storage.getWarehouseStaff();
      Object.entries(photoMap).forEach(([key, dataUrl]) => {
        const match = findMatch(list, key);
        if (match) {
          match.photoUrl = dataUrl;
          matchedCount++;
        } else {
          unmatchedKeys.push(key.trim());
        }
      });
      if (matchedCount > 0) {
        saved = Storage.setWarehouseStaff(list);
        const cu = Storage.getCurrentUser();
        if (saved && cu && cu.role === 'warehouse') {
          const ref = list.find((w) => w.id === cu.staff.id);
          if (ref) Storage.setCurrentUser({ role: 'warehouse', staff: ref });
        }
      }
    } else if (role === 'counselor') {
      const list = Storage.getCounselors();
      Object.entries(photoMap).forEach(([key, dataUrl]) => {
        const match = findMatch(list, key);
        if (match) {
          match.photoUrl = dataUrl;
          matchedCount++;
        } else {
          unmatchedKeys.push(key.trim());
        }
      });
      if (matchedCount > 0) {
        saved = Storage.setCounselors(list);
        const cu = Storage.getCurrentUser();
        if (saved && cu && cu.role === 'counselor') {
          const ref = list.find((c) => c.id === cu.counselor.id);
          if (ref) Storage.setCurrentUser({ role: 'counselor', counselor: ref });
        }
      }
    } else if (role === 'finance') {
      const list = Storage.getFinanceStaff();
      Object.entries(photoMap).forEach(([key, dataUrl]) => {
        const match = findMatch(list, key);
        if (match) {
          match.photoUrl = dataUrl;
          matchedCount++;
        } else {
          unmatchedKeys.push(key.trim());
        }
      });
      if (matchedCount > 0) {
        saved = Storage.setFinanceStaff(list);
        const cu = Storage.getCurrentUser();
        if (saved && cu && cu.role === 'finance') {
          const ref = list.find((f) => f.id === cu.staff.id);
          if (ref) Storage.setCurrentUser({ role: 'finance', staff: ref });
        }
      }
    } else if (role === 'procurement') {
      const list = Storage.getProcurementStaff();
      Object.entries(photoMap).forEach(([key, dataUrl]) => {
        const match = findMatch(list, key);
        if (match) {
          match.photoUrl = dataUrl;
          matchedCount++;
        } else {
          unmatchedKeys.push(key.trim());
        }
      });
      if (matchedCount > 0) {
        saved = Storage.setProcurementStaff(list);
        const cu = Storage.getCurrentUser();
        if (saved && cu && cu.role === 'procurement') {
          const ref = list.find((p) => p.id === cu.staff.id);
          if (ref) Storage.setCurrentUser({ role: 'procurement', staff: ref });
        }
      }
    }

    if (matchedCount > 0 && saved) {
      const roleFa: Record<typeof role, string> = {
        supervisor: 'سرپرستان',
        maintenance: 'پرسنل تأسیسات',
        warehouse: 'پرسنل انبار',
        counselor: 'مشاوران',
        finance: 'امور مالی و حسابداری',
        procurement: 'کارپرداز و خرید',
      };
      Storage.addActivityLog({
        category: 'staff',
        action: `بارگذاری دسته‌جمعی عکس ${roleFa[role]}`,
        details: `تعداد ${matchedCount} تصویر بر اساس نام/کد کاربری به حساب ${roleFa[role]} متصل شد.`,
        targetName: `${matchedCount} کاربر`,
      });
    }

    return {
      matchedCount,
      unmatchedKeys,
      totalProcessed: Object.keys(photoMap).length,
      saved,
    };
  },

  // انتصاب نماینده اتاق
  setRoomRepresentative: (roomId: string, studentId?: string) => {
    const rooms = Storage.getRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      room.representativeStudentId = studentId;
      Storage.setRooms(rooms);
    }
  },

  // ثبت اخطار به اتاق
  addRoomWarning: (warning: Omit<RoomWarning, 'id'>) => {
    const warnings = Storage.getWarnings();
    const newWarning: RoomWarning = {
      ...warning,
      id: `warn_${Date.now()}`,
    };
    warnings.unshift(newWarning);
    Storage.setWarnings(warnings);
    Storage.addActivityLog({
      category: 'warning_eval',
      action: 'ثبت اخطار اتاق',
      details: `اخطار «${newWarning.title}» با سطح ${newWarning.severity} توسط ${newWarning.supervisorName} ثبت شد.`,
      targetName: `اتاق ${newWarning.roomId}`,
      severity: newWarning.severity === 'critical' ? 'critical' : 'warning',
    });
    return newWarning;
  },

  // حل یا بستن اخطار
  resolveWarning: (warningId: string) => {
    const warnings = Storage.getWarnings();
    const warn = warnings.find((w) => w.id === warningId);
    if (warn) {
      warn.resolved = true;
      Storage.setWarnings(warnings);
      Storage.addActivityLog({
        category: 'warning_eval',
        action: 'بستن و رفع اخطار اتاق',
        details: `اخطار «${warn.title}» برطرف و بسته شد.`,
        targetName: warn.title,
      });
    }
  },

  // ثبت پیام جدید
  addMessage: (message: Omit<Message, 'id' | 'replies' | 'status'>) => {
    const messages = Storage.getMessages();
    const newMsg: Message = {
      ...message,
      id: `msg_${Date.now()}`,
      status: 'pending',
      replies: [],
    };
    messages.unshift(newMsg);
    Storage.setMessages(messages);
    return newMsg;
  },

  // پاسخ به پیام
  replyToMessage: (
    messageId: string,
    reply: {
      senderName: string;
      senderRole: 'student' | 'supervisor' | 'admin' | 'maintenance' | 'warehouse' | 'counselor' | 'finance' | 'procurement';
      content: string;
      date: string;
    }
  ): { success: boolean } => {
    const messages = Storage.getMessages();
    const msg = messages.find((m) => m.id === messageId);
    if (msg) {
      msg.replies.push({
        ...reply,
        id: `rep_${Date.now()}`,
      });
      msg.status = 'answered';
      Storage.setMessages(messages);
      return { success: true };
    }
    return { success: false };
  },

  // بروزرسانی پروفایل دانشجو
  // ایجاد دانشجو توسط مدیر
  addStudent: (newStudent: Student): { success: boolean; message: string } => {
    const students = Storage.getStudents();
    if (students.some((s) => s.studentId === newStudent.studentId)) {
      return { success: false, message: 'دانشجویی با این شماره دانشجویی قبلاً ثبت شده است.' };
    }
    students.unshift(newStudent);
    Storage.setStudents(students);
    return { success: true, message: 'دانشجو با موفقیت ثبت و به سامانه اضافه گردید.' };
  },

  // حذف دانشجو توسط مدیر (آزادسازی خودکار تخت)
  deleteStudent: (studentId: string): { success: boolean; message: string } => {
    const target = Storage.getStudents().find((s) => s.studentId === studentId);
    Storage.releaseBed(studentId);
    const students = Storage.getStudents().filter((s) => s.studentId !== studentId);
    Storage.setStudents(students);
    if (typeof fetch === 'function') {
      fetch(`${API_BASE_URL}/students/${encodeURIComponent(studentId)}`, { method: 'DELETE' }).catch(() => {});
    }
    Storage.addActivityLog({
      category: 'student',
      action: 'حذف پرونده دانشجو',
      details: `پرونده دانشجو ${target?.fullName || ''} (${studentId}) از سامانه حذف شد.`,
      targetName: `${target?.fullName || studentId}`,
      severity: 'warning',
    });
    return { success: true, message: 'دانشجو و سوابق اسکان وی با موفقیت از سیستم حذف شد.' };
  },

  // ویرایش اطلاعات دانشجو توسط مدیر
  updateStudentAdmin: (studentId: string, updatedData: Partial<Student>): { success: boolean; message: string } => {
    const students = Storage.getStudents();
    const index = students.findIndex((s) => s.studentId === studentId);
    if (index === -1) {
      return { success: false, message: 'دانشجو یافت نشد.' };
    }
    students[index] = { ...students[index], ...updatedData };
    Storage.setStudents(students);
    Storage.addActivityLog({
      category: 'student',
      action: 'ویرایش اطلاعات دانشجو',
      details: `مشخصات دانشجو ${students[index].fullName} (${studentId}) ویرایش شد.`,
      targetName: `${students[index].fullName} (${studentId})`,
    });

    const currentUser = Storage.getCurrentUser();
    if (currentUser && currentUser.role === 'student' && currentUser.student.studentId === studentId) {
      Storage.setCurrentUser({ role: 'student', student: students[index] });
    }
    return { success: true, message: 'اطلاعات دانشجو با موفقیت بروزرسانی شد.' };
  },

  updateStudentProfile: (
    studentId: string,
    updatedData: Partial<Student>
  ): { success: boolean; message: string } => {
    const students = Storage.getStudents();
    const index = students.findIndex((s) => s.studentId === studentId);
    if (index === -1) {
      return { success: false, message: 'پرونده دانشجو یافت نشد.' };
    }

    const currentSettings = Storage.getSettings();
    if (students[index].isProfileCompleted && !currentSettings.studentSecondaryEditEnabled) {
      return {
        success: false,
        message: 'دسترسی ویرایش ثانویه اطلاعات و تغییر عکس توسط مدیر سامانه بسته شده است.',
      };
    }

    students[index] = { ...students[index], ...updatedData, isProfileCompleted: true };
    Storage.setStudents(students);
    Storage.addActivityLog({
      category: 'student',
      action: 'تکمیل/ویرایش پروفایل دانشجو',
      details: `پروفایل دانشجو ${students[index].fullName} (${studentId}) تکمیل و ذخیره شد.`,
      targetName: `${students[index].fullName} (${studentId})`,
    });

    const currentUser = Storage.getCurrentUser();
    if (currentUser && currentUser.role === 'student' && currentUser.student.studentId === studentId) {
      Storage.setCurrentUser({ role: 'student', student: students[index] });
    }

    return { success: true, message: 'اطلاعات پرونده با موفقیت ثبت و ذخیره شد.' };
  },

  // پشتیبان‌گیری کامل از داده‌ها به صورت فایل JSON
  exportBackupJson: () => {
    const fullBackup = {
      settings: Storage.getSettings(),
      dormitories: Storage.getDormitories(),
      rooms: Storage.getRooms(),
      beds: Storage.getBeds(),
      students: Storage.getStudents(),
      supervisors: Storage.getSupervisors(),
      warnings: Storage.getWarnings(),
      announcements: Storage.getAnnouncements(),
      messages: Storage.getMessages(),
      maintenanceStaff: Storage.getMaintenanceStaff(),
      maintenanceTasks: Storage.getMaintenanceTasks(),
      warehouseStaff: Storage.getWarehouseStaff(),
      inventoryItems: Storage.getInventoryItems(),
      inventoryTransactions: Storage.getInventoryTransactions(),
      warehouseRequests: Storage.getWarehouseRequests(),
      procurementStaff: Storage.getProcurementStaff(),
      procurementRequests: Storage.getProcurementRequests(),
      shiftSchedules: Storage.getShiftSchedules(),
      shiftReports: Storage.getShiftReports(),
      counselors: Storage.getCounselors(),
      counselorShifts: Storage.getCounselorShifts(),
      counselorReports: Storage.getCounselorReports(),
      activityLogs: Storage.getActivityLogs(),
      studentEvaluations: Storage.getStudentEvaluations(),
      financeStaff: Storage.getFinanceStaff(),
      studentFinances: Storage.getStudentFinances(),
      guestRequests: Storage.getGuestRequests(),
      exportedAt: new Date().toISOString(),
      appName: 'سامانه جامع سراهای دانشجویی دانشگاه فرهنگیان اصفهان',
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `پشتیبان_سامانه_خوابگاه_فرهنگیان_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // بازیابی نسخه پشتیبان از فایل JSON
  importBackupJson: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.students && data.rooms && data.beds) {
        if (data.settings) Storage.setSettings(data.settings);
        if (data.dormitories) Storage.setDormitories(data.dormitories);
        if (data.rooms) Storage.setRooms(data.rooms);
        if (data.beds) Storage.setBeds(data.beds);
        if (data.students) Storage.setStudents(data.students);
        if (data.supervisors) Storage.setSupervisors(data.supervisors);
        if (data.warnings) Storage.setWarnings(data.warnings);
        if (data.announcements) Storage.setAnnouncements(data.announcements);
        if (data.messages) Storage.setMessages(data.messages);
        if (data.maintenanceStaff) Storage.setMaintenanceStaff(data.maintenanceStaff);
        if (data.maintenanceTasks) Storage.setMaintenanceTasks(data.maintenanceTasks);
        if (data.warehouseStaff) Storage.setWarehouseStaff(data.warehouseStaff);
        if (data.inventoryItems) set(STORAGE_KEYS.INVENTORY_ITEMS, data.inventoryItems);
        if (data.inventoryTransactions) Storage.setInventoryTransactions(data.inventoryTransactions);
        if (data.warehouseRequests) Storage.setWarehouseRequests(data.warehouseRequests);
        if (data.procurementStaff) Storage.setProcurementStaff(data.procurementStaff);
        if (data.procurementRequests) Storage.setProcurementRequests(data.procurementRequests);
        if (data.shiftSchedules) Storage.setShiftSchedules(data.shiftSchedules);
        if (data.shiftReports) Storage.setShiftReports(data.shiftReports);
        if (data.counselors) Storage.setCounselors(data.counselors);
        if (data.counselorShifts) Storage.setCounselorShifts(data.counselorShifts);
        if (data.counselorReports) Storage.setCounselorReports(data.counselorReports);
        if (data.activityLogs) Storage.setActivityLogs(data.activityLogs);
        if (data.studentEvaluations) Storage.setStudentEvaluations(data.studentEvaluations);
        if (data.financeStaff) Storage.setFinanceStaff(data.financeStaff);
        if (data.studentFinances) Storage.setStudentFinances(data.studentFinances);
        if (data.guestRequests) Storage.setGuestRequests(data.guestRequests);
        Storage.addActivityLog({
          category: 'backup',
          action: 'بازیابی نسخه پشتیبان JSON',
          details: 'فایل پشتیبان اطلاعات سامانه با موفقیت بازیابی شد.',
          severity: 'warning',
        });
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to restore backup', e);
      return false;
    }
  },

  // متدهای مدیریت امور تأسیسات و تکنسین‌های فنی
  getMaintenanceStaff: (): MaintenanceStaff[] => get(STORAGE_KEYS.MAINTENANCE_STAFF, INITIAL_MAINTENANCE_STAFF),
  setMaintenanceStaff: (staff: MaintenanceStaff[]) => set(STORAGE_KEYS.MAINTENANCE_STAFF, staff),

  addMaintenanceStaff: (
    staffData: Omit<MaintenanceStaff, 'id'>
  ): { success: boolean; message: string; staff?: MaintenanceStaff } => {
    const list = Storage.getMaintenanceStaff();
    const cleanUsername = staffData.username.trim().toLowerCase();
    if (list.some((s) => s.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: 'این نام کاربری قبلاً برای تکنسین دیگری ثبت شده است.' };
    }
    const newStaff: MaintenanceStaff = {
      ...staffData,
      id: `tech_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: cleanUsername,
      role: 'maintenance',
      status: staffData.status || 'active',
    };
    list.push(newStaff);
    Storage.setMaintenanceStaff(list);
    return {
      success: true,
      message: `کارشناس تأسیسات «${newStaff.fullName}» با موفقیت افزوده شد.`,
      staff: newStaff,
    };
  },

  updateMaintenanceStaff: (
    id: string,
    updates: Partial<MaintenanceStaff>
  ): { success: boolean; message: string } => {
    const list = Storage.getMaintenanceStaff();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false, message: 'کاربر تأسیسات یافت نشد.' };
    list[idx] = { ...list[idx], ...updates };
    Storage.setMaintenanceStaff(list);
    const cu = Storage.getCurrentUser();
    if (cu && cu.role === 'maintenance' && cu.technician.id === id) {
      Storage.setCurrentUser({ role: 'maintenance', technician: list[idx] });
    }
    return { success: true, message: 'اطلاعات کارشناس تأسیسات با موفقیت بروزرسانی شد.' };
  },

  deleteMaintenanceStaff: (id: string): { success: boolean; message: string } => {
    const list = Storage.getMaintenanceStaff();
    const filtered = list.filter((s) => s.id !== id);
    Storage.setMaintenanceStaff(filtered);
    return { success: true, message: 'کاربر تأسیسات با موفقیت حذف گردید.' };
  },

  getMaintenanceTasks: (): MaintenanceTask[] => get(STORAGE_KEYS.MAINTENANCE_TASKS, INITIAL_MAINTENANCE_TASKS),
  setMaintenanceTasks: (tasks: MaintenanceTask[]) => set(STORAGE_KEYS.MAINTENANCE_TASKS, tasks),

  addMaintenanceTask: (
    taskData: Omit<MaintenanceTask, 'id' | 'trackingCode' | 'createdAt'>
  ): { success: boolean; message: string; task: MaintenanceTask } => {
    const tasks = Storage.getMaintenanceTasks();
    const codeNum = tasks.length + 101;
    const newTask: MaintenanceTask = {
      ...taskData,
      id: `mtask_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      trackingCode: `M-${codeNum}`,
      createdAt:
        new Date().toLocaleDateString('fa-IR') +
        ' - ' +
        new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };
    tasks.unshift(newTask);
    Storage.setMaintenanceTasks(tasks);
    Storage.addActivityLog({
      category: 'maintenance',
      action: 'ثبت درخواست/مأموریت تأسیسات',
      details: `گزارش «${newTask.title}» (${newTask.trackingCode}) در ${newTask.dormName} ثبت شد.`,
      targetName: newTask.trackingCode,
    });
    return {
      success: true,
      message: `سفارش کار و مأموریت تأسیساتی با کد رهگیری «${newTask.trackingCode}» با موفقیت ثبت شد.`,
      task: newTask,
    };
  },

  updateMaintenanceTask: (
    id: string,
    updates: Partial<MaintenanceTask>
  ): { success: boolean; message: string } => {
    const tasks = Storage.getMaintenanceTasks();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return { success: false, message: 'سفارش کار تأسیسات یافت نشد.' };
    tasks[idx] = { ...tasks[idx], ...updates };
    Storage.setMaintenanceTasks(tasks);
    Storage.addActivityLog({
      category: 'maintenance',
      action: 'بروزرسانی وضعیت مأموریت تأسیسات',
      details: `سفارش کار ${tasks[idx].trackingCode} به وضعیت «${tasks[idx].status}» تغییر یافت.`,
      targetName: tasks[idx].trackingCode,
    });

    // اگر تسک دارای پیام دانشجو بود و رفع شد، به دانشجو پیام خودکار بده
    if (updates.status === 'resolved' && tasks[idx].sourceMessageId) {
      const messages = Storage.getMessages();
      const msg = messages.find((m) => m.id === tasks[idx].sourceMessageId);
      if (msg) {
        msg.status = 'answered';
        msg.replies.push({
          id: `rep_done_${Date.now()}`,
          senderName: `${tasks[idx].assignedToStaffName || 'واحد تأسیسات سرا'}`,
          senderRole: 'maintenance',
          content: `عملیات رفع نقص با کد رهگیری «${tasks[idx].trackingCode}» انجام و تکمیل گردید.${updates.technicianNotes ? ` گزارش کار: ${updates.technicianNotes}` : ''}`,
          date:
            new Date().toLocaleDateString('fa-IR') +
            ' - ' +
            new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        });
        Storage.setMessages(messages);
      }
    }

    return { success: true, message: 'وضعیت سفارش کار تأسیسات با موفقیت بروزرسانی شد.' };
  },

  deleteMaintenanceTask: (id: string): { success: boolean; message: string } => {
    const tasks = Storage.getMaintenanceTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    Storage.setMaintenanceTasks(filtered);
    return { success: true, message: 'سفارش کار تأسیسات با موفقیت حذف گردید.' };
  },

  referMessageToMaintenance: (
    messageId: string,
    taskData: {
      title: string;
      description: string;
      dormId: string;
      dormName: string;
      roomNumber?: string;
      locationDetails?: string;
      priority: 'normal' | 'urgent' | 'emergency';
      assignedToStaffId?: string;
      assignedToStaffName?: string;
      createdById: string;
      createdByName: string;
      createdByRole: 'supervisor' | 'admin';
      studentId?: string;
      studentName?: string;
      studentPhone?: string;
    }
  ): { success: boolean; message: string; task: MaintenanceTask } => {
    const tasks = Storage.getMaintenanceTasks();
    const codeNum = tasks.length + 101;
    const trackingCode = `M-${codeNum}`;

    const newTask: MaintenanceTask = {
      id: `mtask_ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      trackingCode,
      title: taskData.title,
      description: taskData.description,
      dormId: taskData.dormId,
      dormName: taskData.dormName,
      roomNumber: taskData.roomNumber,
      locationDetails: taskData.locationDetails,
      priority: taskData.priority,
      source: 'student_report',
      sourceStudentId: taskData.studentId,
      sourceStudentName: taskData.studentName,
      sourceStudentPhone: taskData.studentPhone,
      sourceMessageId: messageId,
      createdById: taskData.createdById,
      createdByName: taskData.createdByName,
      createdByRole: taskData.createdByRole,
      createdAt:
        new Date().toLocaleDateString('fa-IR') +
        ' - ' +
        new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      assignedToStaffId: taskData.assignedToStaffId,
      assignedToStaffName: taskData.assignedToStaffName,
      assignedAt: taskData.assignedToStaffId ? new Date().toLocaleDateString('fa-IR') : undefined,
      status: taskData.assignedToStaffId ? 'assigned' : 'pending',
    };

    tasks.unshift(newTask);
    Storage.setMaintenanceTasks(tasks);

    // پاسخ خودکار به تیکت دانشجو مبنی بر ارجاع به تأسیسات
    const messages = Storage.getMessages();
    const msg = messages.find((m) => m.id === messageId);
    if (msg) {
      msg.status = 'in_progress';
      msg.replies.push({
        id: `rep_auto_maint_${Date.now()}`,
        senderName: `${taskData.createdByName} (${taskData.createdByRole === 'admin' ? 'مدیریت کل' : 'سرپرست سرا'})`,
        senderRole: taskData.createdByRole,
        content: `این گزارش بررسی و با کد رهگیری «${trackingCode}» مستقیماً به واحد تأسیسات و تعمیرات سرا ارجاع داده شد.${taskData.assignedToStaffName ? ` کارشناس فنی محول شده: ${taskData.assignedToStaffName}` : ' در انتظار اعزام تکنسین.'}`,
        date:
          new Date().toLocaleDateString('fa-IR') +
          ' - ' +
          new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      });
      Storage.setMessages(messages);
    }

    return {
      success: true,
      message: `خرابی با کد رهگیری ${trackingCode} به واحد تأسیسات ارجاع داده شد و پاسخ خودکار در پیام دانشجو ثبت گردید.`,
      task: newTask,
    };
  },

  // بازنشانی به داده‌های اولیه و همگام‌سازی با دیتابیس ابری
  resetToDefaults: () => {
    localStorage.clear();
    initializeStorageIfNeeded();
    Storage.addActivityLog({
      category: 'backup',
      action: 'بازنشانی کل داده‌های سامانه',
      details: 'اطلاعات سامانه به وضعیت پیش‌فرض کارخانه بازنشانی شد.',
      severity: 'critical',
    });
    void Storage.syncAllToCloud();
  },

  // تغییر کلمه عبور برای تمام نقش‌ها
  changePassword: (
    role: 'student' | 'supervisor' | 'admin' | 'maintenance' | 'warehouse' | 'counselor' | 'finance' | 'procurement',
    userId: string,
    currentPasswordInput: string,
    newPasswordInput: string
  ): { success: boolean; message: string } => {
    const normalizeDigits = (val: string) =>
      val
        .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
        .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
        .trim();

    const cleanCurrentPass = normalizeDigits(currentPasswordInput);
    const cleanNewPass = normalizeDigits(newPasswordInput);

    if (!cleanNewPass || cleanNewPass.length < 4) {
      return { success: false, message: 'کلمه عبور جدید باید حداقل ۴ کاراکتر باشد.' };
    }

    if (role === 'counselor') {
      const counselors = Storage.getCounselors();
      const cns = counselors.find((c) => c.id === userId || c.username === userId);
      if (!cns) {
        return { success: false, message: 'مشاور یافت نشد.' };
      }
      if (normalizeDigits(cns.password) !== cleanCurrentPass) {
        return { success: false, message: 'کلمه عبور فعلی مشاور اشتباه است.' };
      }
      cns.password = cleanNewPass;
      Storage.setCounselors(counselors);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر کلمه عبور مشاور',
        details: `کلمه عبور کارشناس مشاور ${cns.fullName} تغییر یافت.`,
        targetName: cns.fullName,
      });
      return { success: true, message: 'کلمه عبور مشاور با موفقیت تغییر یافت.' };
    }

    if (role === 'admin') {
      const settings = Storage.getSettings();
      const currentAdminPass = normalizeDigits(settings.adminPassword || '261');
      if (cleanCurrentPass !== currentAdminPass) {
        return { success: false, message: 'کلمه عبور فعلی مدیر اشتباه است.' };
      }
      settings.adminPassword = cleanNewPass;
      Storage.setSettings(settings);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر کلمه عبور مدیر کل',
        details: 'کلمه عبور حساب مدیر کل سامانه با موفقیت تغییر یافت.',
        targetName: 'admin',
        severity: 'warning',
      });
      return { success: true, message: 'کلمه عبور مدیر سامانه با موفقیت تغییر یافت.' };
    }

    if (role === 'supervisor') {
      const supervisors = Storage.getSupervisors();
      const sup = supervisors.find((s) => s.id === userId || s.username === userId);
      if (!sup) {
        return { success: false, message: 'کاربر سرپرست یافت نشد.' };
      }
      if (normalizeDigits(sup.password) !== cleanCurrentPass) {
        return { success: false, message: 'کلمه عبور فعلی سرپرست اشتباه است.' };
      }
      sup.password = cleanNewPass;
      Storage.setSupervisors(supervisors);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر کلمه عبور سرپرست',
        details: `کلمه عبور سرپرست ${sup.fullName} تغییر یافت.`,
        targetName: sup.fullName,
      });
      return { success: true, message: 'کلمه عبور سرپرست با موفقیت تغییر یافت.' };
    }

    if (role === 'maintenance') {
      const staffList = Storage.getMaintenanceStaff();
      const tech = staffList.find((s) => s.id === userId || s.username === userId);
      if (!tech) {
        return { success: false, message: 'کارشناس تأسیسات یافت نشد.' };
      }
      if (normalizeDigits(tech.password) !== cleanCurrentPass) {
        return { success: false, message: 'کلمه عبور فعلی کارشناس تأسیسات اشتباه است.' };
      }
      tech.password = cleanNewPass;
      Storage.setMaintenanceStaff(staffList);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر کلمه عبور تأسیسات',
        details: `کلمه عبور کارشناس تأسیسات ${tech.fullName} تغییر یافت.`,
        targetName: tech.fullName,
      });
      return { success: true, message: 'کلمه عبور کارشناس تأسیسات با موفقیت تغییر یافت.' };
    }

    if (role === 'warehouse') {
      const staffList = Storage.getWarehouseStaff();
      const staff = staffList.find((s) => s.id === userId || s.username === userId);
      if (!staff) {
        return { success: false, message: 'کاربر انبار و کارپردازی یافت نشد.' };
      }
      if (normalizeDigits(staff.password) !== cleanCurrentPass) {
        return { success: false, message: 'کلمه عبور فعلی مسئول انبار اشتباه است.' };
      }
      staff.password = cleanNewPass;
      Storage.setWarehouseStaff(staffList);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر کلمه عبور انباردار',
        details: `کلمه عبور مسئول انبار ${staff.fullName} تغییر یافت.`,
        targetName: staff.fullName,
      });
      return { success: true, message: 'کلمه عبور مسئول انبار با موفقیت تغییر یافت.' };
    }

    if (role === 'finance') {
      const staffList = Storage.getFinanceStaff();
      const staff = staffList.find((s) => s.id === userId || s.username === userId);
      if (!staff) {
        return { success: false, message: 'کاربر امور مالی و حسابداری یافت نشد.' };
      }
      if (normalizeDigits(staff.password) !== cleanCurrentPass) {
        return { success: false, message: 'کلمه عبور فعلی امور مالی اشتباه است.' };
      }
      staff.password = cleanNewPass;
      Storage.setFinanceStaff(staffList);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر کلمه عبور امور مالی',
        details: `کلمه عبور کارشناس امور مالی ${staff.fullName} تغییر یافت.`,
        targetName: staff.fullName,
      });
      return { success: true, message: 'کلمه عبور کارشناس امور مالی با موفقیت تغییر یافت.' };
    }

    if (role === 'procurement') {
      const staffList = Storage.getProcurementStaff();
      const staff = staffList.find((s) => s.id === userId || s.username === userId);
      if (!staff) {
        return { success: false, message: 'کاربر کارپرداز یافت نشد.' };
      }
      if (normalizeDigits(staff.password) !== cleanCurrentPass) {
        return { success: false, message: 'کلمه عبور فعلی کارپرداز اشتباه است.' };
      }
      staff.password = cleanNewPass;
      Storage.setProcurementStaff(staffList);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر کلمه عبور کارپرداز',
        details: `کلمه عبور کارپرداز ${staff.fullName} تغییر یافت.`,
        targetName: staff.fullName,
      });
      return { success: true, message: 'کلمه عبور کارپرداز با موفقیت تغییر یافت.' };
    }

    if (role === 'student') {
      const students = Storage.getStudents();
      const st = students.find((s) => s.studentId === userId);
      if (!st) {
        return { success: false, message: 'دانشجو یافت نشد.' };
      }
      if (normalizeDigits(st.nationalId) !== cleanCurrentPass) {
        return { success: false, message: 'کلمه عبور (کد ملی) فعلی اشتباه است.' };
      }
      st.nationalId = cleanNewPass;
      Storage.setStudents(students);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر کلمه عبور دانشجو',
        details: `کلمه عبور دانشجو ${st.fullName} (${st.studentId}) تغییر یافت.`,
        targetName: `${st.fullName} (${st.studentId})`,
      });
      return { success: true, message: 'کلمه عبور با موفقیت بروزرسانی شد.' };
    }

    return { success: false, message: 'خطای نامشخص در تغییر کلمه عبور' };
  },

  // تغییر یا ریست مستقیم رمز عبور کاربران توسط مدیر کل (بدون نیاز به رمز قبلی)
  adminResetUserPassword: (
    role: 'student' | 'supervisor' | 'maintenance' | 'warehouse' | 'counselor' | 'finance' | 'procurement',
    idOrStudentId: string,
    newPasswordInput: string
  ): { success: boolean; message: string } => {
    const normalize = (val: string) =>
      val
        .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
        .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
        .trim();

    const cleanPass = normalize(newPasswordInput);
    if (!cleanPass || cleanPass.length < 4) {
      return { success: false, message: 'کلمه عبور جدید باید حداقل ۴ کاراکتر باشد.' };
    }

    if (role === 'student') {
      const students = Storage.getStudents();
      const idx = students.findIndex((s) => s.studentId === idOrStudentId);
      if (idx === -1) return { success: false, message: 'دانشجو یافت نشد.' };
      students[idx] = { ...students[idx], nationalId: cleanPass };
      Storage.setStudents(students);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر / ریست رمز دانشجو توسط مدیر',
        details: `کلمه عبور (کد ملی ورود) دانشجو ${students[idx].fullName} (${students[idx].studentId}) توسط مدیر تنظیم شد.`,
        targetName: `${students[idx].fullName} (${students[idx].studentId})`,
        severity: 'warning',
      });
      return {
        success: true,
        message: `رمز ورود دانشجو «${students[idx].fullName}» به «${cleanPass}» تغییر یافت.`,
      };
    }

    if (role === 'supervisor') {
      const list = Storage.getSupervisors();
      const idx = list.findIndex((s) => s.id === idOrStudentId);
      if (idx === -1) return { success: false, message: 'سرپرست یافت نشد.' };
      list[idx] = { ...list[idx], password: cleanPass };
      Storage.setSupervisors(list);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر / ریست رمز سرپرست توسط مدیر',
        details: `کلمه عبور سرپرست ${list[idx].fullName} (${list[idx].username}) توسط مدیر تغییر یافت.`,
        targetName: list[idx].fullName,
        severity: 'warning',
      });
      return {
        success: true,
        message: `رمز عبور سرپرست «${list[idx].fullName}» به «${cleanPass}» تغییر یافت.`,
      };
    }

    if (role === 'maintenance') {
      const list = Storage.getMaintenanceStaff();
      const idx = list.findIndex((s) => s.id === idOrStudentId);
      if (idx === -1) return { success: false, message: 'کارشناس تأسیسات یافت نشد.' };
      list[idx] = { ...list[idx], password: cleanPass };
      Storage.setMaintenanceStaff(list);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر / ریست رمز تأسیسات توسط مدیر',
        details: `کلمه عبور تکنسین ${list[idx].fullName} (${list[idx].username}) توسط مدیر تغییر یافت.`,
        targetName: list[idx].fullName,
        severity: 'warning',
      });
      return {
        success: true,
        message: `رمز عبور تکنسین «${list[idx].fullName}» به «${cleanPass}» تغییر یافت.`,
      };
    }

    if (role === 'warehouse') {
      const list = Storage.getWarehouseStaff();
      const idx = list.findIndex((s) => s.id === idOrStudentId);
      if (idx === -1) return { success: false, message: 'کاربر انبار یافت نشد.' };
      list[idx] = { ...list[idx], password: cleanPass };
      Storage.setWarehouseStaff(list);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر / ریست رمز انباردار توسط مدیر',
        details: `کلمه عبور کاربر انبار ${list[idx].fullName} (${list[idx].username}) توسط مدیر تغییر یافت.`,
        targetName: list[idx].fullName,
        severity: 'warning',
      });
      return {
        success: true,
        message: `رمز عبور کاربر انبار «${list[idx].fullName}» به «${cleanPass}» تغییر یافت.`,
      };
    }

    if (role === 'counselor') {
      const list = Storage.getCounselors();
      const idx = list.findIndex((s) => s.id === idOrStudentId);
      if (idx === -1) return { success: false, message: 'مشاور یافت نشد.' };
      list[idx] = { ...list[idx], password: cleanPass };
      Storage.setCounselors(list);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر / ریست رمز مشاور توسط مدیر',
        details: `کلمه عبور مشاور ${list[idx].fullName} (${list[idx].username}) توسط مدیر تغییر یافت.`,
        targetName: list[idx].fullName,
        severity: 'warning',
      });
      return {
        success: true,
        message: `رمز عبور مشاور «${list[idx].fullName}» به «${cleanPass}» تغییر یافت.`,
      };
    }

    if (role === 'finance') {
      const list = Storage.getFinanceStaff();
      const idx = list.findIndex((s) => s.id === idOrStudentId);
      if (idx === -1) return { success: false, message: 'کاربر امور مالی یافت نشد.' };
      list[idx] = { ...list[idx], password: cleanPass };
      Storage.setFinanceStaff(list);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر / ریست رمز امور مالی توسط مدیر',
        details: `کلمه عبور کاربر امور مالی ${list[idx].fullName} (${list[idx].username}) توسط مدیر تغییر یافت.`,
        targetName: list[idx].fullName,
        severity: 'warning',
      });
      return {
        success: true,
        message: `رمز عبور کاربر امور مالی «${list[idx].fullName}» به «${cleanPass}» تغییر یافت.`,
      };
    }

    if (role === 'procurement') {
      const list = Storage.getProcurementStaff();
      const idx = list.findIndex((s) => s.id === idOrStudentId);
      if (idx === -1) return { success: false, message: 'کاربر کارپرداز یافت نشد.' };
      list[idx] = { ...list[idx], password: cleanPass };
      Storage.setProcurementStaff(list);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر / ریست رمز کارپرداز توسط مدیر',
        details: `کلمه عبور کارپرداز ${list[idx].fullName} (${list[idx].username}) توسط مدیر تغییر یافت.`,
        targetName: list[idx].fullName,
        severity: 'warning',
      });
      return {
        success: true,
        message: `رمز عبور کارپرداز «${list[idx].fullName}» به «${cleanPass}» تغییر یافت.`,
      };
    }

    return { success: false, message: 'نقش کاربری معتبر نیست.' };
  },

  // -------------------------------------------------------------
  // متدهای مدیریت پرسنل انبار و کارپردازی
  // -------------------------------------------------------------
  getWarehouseStaff: (): WarehouseStaff[] => get(STORAGE_KEYS.WAREHOUSE_STAFF, INITIAL_WAREHOUSE_STAFF),
  setWarehouseStaff: (staff: WarehouseStaff[]) => set(STORAGE_KEYS.WAREHOUSE_STAFF, staff),

  addWarehouseStaff: (
    staffData: Omit<WarehouseStaff, 'id'>
  ): { success: boolean; message: string; staff?: WarehouseStaff } => {
    const list = Storage.getWarehouseStaff();
    const cleanUsername = staffData.username.trim().toLowerCase();
    if (list.some((s) => s.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: 'این نام کاربری قبلاً برای پرسنل انبار دیگری ثبت شده است.' };
    }
    const newStaff: WarehouseStaff = {
      ...staffData,
      id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: cleanUsername,
      role: 'warehouse',
      status: staffData.status || 'active',
      isActive: staffData.isActive !== false,
    };
    list.push(newStaff);
    Storage.setWarehouseStaff(list);
    return {
      success: true,
      message: `مسئول انبار «${newStaff.fullName}» با موفقیت افزوده شد.`,
      staff: newStaff,
    };
  },

  updateWarehouseStaff: (
    id: string,
    updates: Partial<WarehouseStaff>
  ): { success: boolean; message: string } => {
    const list = Storage.getWarehouseStaff();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false, message: 'کاربر انبار یافت نشد.' };
    list[idx] = { ...list[idx], ...updates };
    Storage.setWarehouseStaff(list);
    const cu = Storage.getCurrentUser();
    if (cu && cu.role === 'warehouse' && cu.staff.id === id) {
      Storage.setCurrentUser({ role: 'warehouse', staff: list[idx] });
    }
    return { success: true, message: 'اطلاعات پرسنل انبار با موفقیت بروزرسانی شد.' };
  },

  deleteWarehouseStaff: (id: string): { success: boolean; message: string } => {
    const list = Storage.getWarehouseStaff();
    const filtered = list.filter((s) => s.id !== id);
    Storage.setWarehouseStaff(filtered);
    return { success: true, message: 'کاربر انبار با موفقیت حذف گردید.' };
  },

  // -------------------------------------------------------------
  // متدهای مدیریت کاربران امور مالی و حسابداری و سوابق مالی دانشجویان
  // -------------------------------------------------------------
  getFinanceStaff: (): FinanceStaff[] => get(STORAGE_KEYS.FINANCE_STAFF, INITIAL_FINANCE_STAFF),
  setFinanceStaff: (staff: FinanceStaff[]) => set(STORAGE_KEYS.FINANCE_STAFF, staff),

  addFinanceStaff: (
    staffData: Omit<FinanceStaff, 'id'>
  ): { success: boolean; message: string; staff?: FinanceStaff } => {
    const list = Storage.getFinanceStaff();
    const cleanUsername = staffData.username.trim().toLowerCase();
    if (list.some((s) => s.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: 'این نام کاربری قبلاً برای کاربر امور مالی دیگری ثبت شده است.' };
    }
    const newStaff: FinanceStaff = {
      ...staffData,
      id: `fin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: cleanUsername,
      role: 'finance',
      status: staffData.status || 'active',
      isActive: staffData.isActive !== false,
    };
    list.push(newStaff);
    Storage.setFinanceStaff(list);
    Storage.addActivityLog({
      category: 'staff',
      action: 'ثبت کاربر امور مالی',
      details: `کاربر امور مالی و حسابداری «${newStaff.fullName}» (${newStaff.username}) در سامانه ثبت شد.`,
      targetName: newStaff.fullName,
    });
    return {
      success: true,
      message: `کاربر امور مالی «${newStaff.fullName}» با موفقیت افزوده شد.`,
      staff: newStaff,
    };
  },

  updateFinanceStaff: (
    id: string,
    updates: Partial<FinanceStaff>
  ): { success: boolean; message: string } => {
    const list = Storage.getFinanceStaff();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false, message: 'کاربر امور مالی یافت نشد.' };
    if (updates.username) {
      const cleanU = updates.username.trim().toLowerCase();
      if (list.some((f) => f.id !== id && f.username.trim().toLowerCase() === cleanU)) {
        return { success: false, message: 'این نام کاربری قبلاً برای کاربر امور مالی دیگری ثبت شده است.' };
      }
    }
    list[idx] = { ...list[idx], ...updates };
    Storage.setFinanceStaff(list);
    const cu = Storage.getCurrentUser();
    if (cu && cu.role === 'finance' && cu.staff.id === id) {
      Storage.setCurrentUser({ role: 'finance', staff: list[idx] });
    }
    return { success: true, message: 'اطلاعات کاربر امور مالی با موفقیت بروزرسانی شد.' };
  },

  deleteFinanceStaff: (id: string): { success: boolean; message: string } => {
    const list = Storage.getFinanceStaff();
    const target = list.find((s) => s.id === id);
    const filtered = list.filter((s) => s.id !== id);
    Storage.setFinanceStaff(filtered);
    if (target) {
      Storage.addActivityLog({
        category: 'staff',
        action: 'حذف کاربر امور مالی',
        details: `حساب کاربری امور مالی «${target.fullName}» حذف گردید.`,
        targetName: target.fullName,
        severity: 'warning',
      });
    }
    return { success: true, message: 'کاربر امور مالی با موفقیت حذف گردید.' };
  },

  getStudentFinances: (): StudentFinancialRecord[] =>
    get<StudentFinancialRecord[]>(STORAGE_KEYS.STUDENT_FINANCES, INITIAL_STUDENT_FINANCES),

  setStudentFinances: (records: StudentFinancialRecord[]): boolean =>
    set(STORAGE_KEYS.STUDENT_FINANCES, records),

  upsertStudentFinance: (
    record: Omit<StudentFinancialRecord, 'updatedAt'>
  ): StudentFinancialRecord => {
    const list = Storage.getStudentFinances();
    const nowStr =
      new Date().toLocaleDateString('fa-IR') +
      ' - ' +
      new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const fullRecord: StudentFinancialRecord = {
      ...record,
      updatedAt: nowStr,
    };
    const idx = list.findIndex((r) => r.studentId === record.studentId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...fullRecord };
    } else {
      list.unshift(fullRecord);
    }
    Storage.setStudentFinances(list);

    const st = Storage.getStudents().find((s) => s.studentId === record.studentId);
    Storage.addActivityLog({
      category: 'finance',
      action: 'بروزرسانی وضعیت مالی دانشجو',
      details: `وضعیت مالی ${st ? st.fullName : record.studentId} (${record.studentId}) ثبت شد. بدهی: ${Number(record.debtAmount || 0).toLocaleString('fa-IR')} ریال`,
      targetName: st ? `${st.fullName} (${st.studentId})` : record.studentId,
    });

    return fullRecord;
  },

  batchUpdateStudentDebtsFromExcel: (
    rows: Array<{
      studentId?: string;
      nationalId?: string;
      debtAmount: number;
      paidAmount?: number;
      financialStatus?: StudentFinancialStatus;
      fiscalNote?: string;
      documentNumber?: string;
    }>,
    actorName: string
  ): { matchedCount: number; unmatchedKeys: string[] } => {
    const students = Storage.getStudents();
    const currentList = Storage.getStudentFinances();
    const map = new Map<string, StudentFinancialRecord>();
    currentList.forEach((rec) => map.set(rec.studentId, rec));

    const nowStr =
      new Date().toLocaleDateString('fa-IR') +
      ' - ' +
      new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    let matchedCount = 0;
    const unmatchedKeys: string[] = [];

    rows.forEach((row) => {
      const sidKey = normalizeLookupKey(row.studentId);
      const nidKey = normalizeLookupKey(row.nationalId);

      const matchedStudent =
        (sidKey && students.find((s) => normalizeLookupKey(s.studentId) === sidKey)) ||
        (nidKey && students.find((s) => normalizeLookupKey(s.nationalId) === nidKey));

      if (!matchedStudent) {
        const missingLabel = (row.studentId || row.nationalId || 'نامشخص').trim();
        unmatchedKeys.push(missingLabel);
        return;
      }

      const prev = map.get(matchedStudent.studentId);
      const debt = Math.max(0, Number(row.debtAmount) || 0);
      const paid = row.paidAmount !== undefined ? Math.max(0, Number(row.paidAmount) || 0) : prev?.paidAmount;

      const resolvedStatus: StudentFinancialStatus =
        row.financialStatus ||
        (debt > 0 ? 'debtor' : prev?.financialStatus === 'debtor' ? 'settled' : prev?.financialStatus || 'settled');

      map.set(matchedStudent.studentId, {
        ...(prev || {}),
        studentId: matchedStudent.studentId,
        debtAmount: debt,
        paidAmount: paid,
        financialStatus: resolvedStatus,
        fiscalNote: row.fiscalNote !== undefined ? row.fiscalNote : prev?.fiscalNote,
        documentNumber: row.documentNumber !== undefined ? row.documentNumber : prev?.documentNumber,
        updatedAt: nowStr,
        updatedBy: actorName,
      });
      matchedCount++;
    });

    if (matchedCount > 0) {
      Storage.setStudentFinances(Array.from(map.values()));
      Storage.addActivityLog({
        category: 'finance',
        action: 'بارگذاری گروهی اکسل بدهی دانشجویان',
        details: `میزان بدهی و وضعیت مالی ${matchedCount} دانشجو از طریق فایل اکسل توسط امور مالی ثبت و همگام‌سازی شد.`,
        targetName: `${matchedCount} دانشجو`,
      });
    }

    return { matchedCount, unmatchedKeys };
  },

  // -------------------------------------------------------------
  // متدهای مدیریت کاربران کارپردازی و خرید (Procurement Staff)
  // -------------------------------------------------------------
  getProcurementStaff: (): ProcurementStaff[] => get(STORAGE_KEYS.PROCUREMENT_STAFF, INITIAL_PROCUREMENT_STAFF),
  setProcurementStaff: (staff: ProcurementStaff[]) => set(STORAGE_KEYS.PROCUREMENT_STAFF, staff),

  addProcurementStaff: (
    staffData: Omit<ProcurementStaff, 'id'>
  ): { success: boolean; message: string; staff?: ProcurementStaff } => {
    const list = Storage.getProcurementStaff();
    const cleanUsername = staffData.username.trim().toLowerCase();
    if (list.some((s) => s.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: 'این نام کاربری قبلاً برای کارپرداز دیگری ثبت شده است.' };
    }
    const newStaff: ProcurementStaff = {
      ...staffData,
      id: `proc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: cleanUsername,
      role: 'procurement',
      status: staffData.status || 'active',
      isActive: staffData.isActive !== false,
    };
    list.push(newStaff);
    Storage.setProcurementStaff(list);
    Storage.addActivityLog({
      category: 'staff',
      action: 'ثبت کاربر کارپرداز',
      details: `کاربر کارپردازی و خرید «${newStaff.fullName}» (${newStaff.username}) در سامانه ثبت شد.`,
      targetName: newStaff.fullName,
    });
    return {
      success: true,
      message: `کارپرداز «${newStaff.fullName}» با موفقیت افزوده شد.`,
      staff: newStaff,
    };
  },

  updateProcurementStaff: (
    id: string,
    updates: Partial<ProcurementStaff>
  ): { success: boolean; message: string } => {
    const list = Storage.getProcurementStaff();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false, message: 'کاربر کارپرداز یافت نشد.' };
    if (updates.username) {
      const cleanU = updates.username.trim().toLowerCase();
      if (list.some((p) => p.id !== id && p.username.trim().toLowerCase() === cleanU)) {
        return { success: false, message: 'این نام کاربری قبلاً برای کارپرداز دیگری ثبت شده است.' };
      }
    }
    list[idx] = { ...list[idx], ...updates };
    Storage.setProcurementStaff(list);
    const cu = Storage.getCurrentUser();
    if (cu && cu.role === 'procurement' && cu.staff.id === id) {
      Storage.setCurrentUser({ role: 'procurement', staff: list[idx] });
    }
    return { success: true, message: 'اطلاعات کاربر کارپرداز با موفقیت بروزرسانی شد.' };
  },

  deleteProcurementStaff: (id: string): { success: boolean; message: string } => {
    const list = Storage.getProcurementStaff();
    const target = list.find((s) => s.id === id);
    const filtered = list.filter((s) => s.id !== id);
    Storage.setProcurementStaff(filtered);
    if (target) {
      Storage.addActivityLog({
        category: 'staff',
        action: 'حذف کاربر کارپرداز',
        details: `حساب کاربری کارپرداز «${target.fullName}» حذف گردید.`,
        targetName: target.fullName,
        severity: 'warning',
      });
    }
    return { success: true, message: 'کاربر کارپرداز با موفقیت حذف گردید.' };
  },

  // -------------------------------------------------------------
  // متدهای مدیریت موجودی کالاها و تجهیزات انبار (Inventory)
  // نکته امنیتی: به جز کاربر انبار، هیچ نقشی مجاز به تغییر لیست یا موجودی انبار نیست
  // -------------------------------------------------------------
  getInventoryItems: (): InventoryItem[] => get(STORAGE_KEYS.INVENTORY_ITEMS, INITIAL_INVENTORY_ITEMS),
  setInventoryItems: (items: InventoryItem[]) => {
    const cu = Storage.getCurrentUser();
    if (cu && cu.role !== 'warehouse') {
      return false;
    }
    return set(STORAGE_KEYS.INVENTORY_ITEMS, items);
  },

  getInventoryTransactions: (): InventoryTransaction[] =>
    get<InventoryTransaction[]>(STORAGE_KEYS.INVENTORY_TRANSACTIONS, INITIAL_INVENTORY_TRANSACTIONS),
  setInventoryTransactions: (txs: InventoryTransaction[]) => set(STORAGE_KEYS.INVENTORY_TRANSACTIONS, txs),

  addInventoryItem: (
    itemData: Omit<InventoryItem, 'id'>,
    actor?: { id: string; name: string }
  ): { success: boolean; message: string; item?: InventoryItem } => {
    const cu = Storage.getCurrentUser();
    if (cu && cu.role !== 'warehouse') {
      return { success: false, message: 'فقط کاربر انبار مجاز به ثبت یا تغییر موجودی کالاهای انبار است.' };
    }
    const items = Storage.getInventoryItems();
    const cleanCode = itemData.code.trim().toUpperCase();
    if (items.some((i) => i.code.toUpperCase() === cleanCode)) {
      return { success: false, message: 'کد کالای وارد شده قبلاً در سامانه انبار ثبت شده است.' };
    }
    const newItem: InventoryItem = {
      ...itemData,
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code: cleanCode,
      lastRestockedDate: itemData.lastRestockedDate || new Date().toLocaleDateString('fa-IR'),
    };
    items.unshift(newItem);
    set(STORAGE_KEYS.INVENTORY_ITEMS, items);

    if (newItem.quantity > 0) {
      const now = new Date();
      const txs = Storage.getInventoryTransactions();
      txs.unshift({
        id: `itx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        inventoryItemId: newItem.id,
        itemCode: newItem.code,
        itemName: newItem.name,
        unit: newItem.unit,
        type: 'in',
        quantity: newItem.quantity,
        previousQuantity: 0,
        newQuantity: newItem.quantity,
        unitPrice: newItem.unitPrice,
        totalValue: newItem.quantity * (newItem.unitPrice || 0),
        reason: 'موجودی اولیه هنگام تعریف کالا در انبار',
        actorId: actor?.id || (cu?.role === 'warehouse' ? cu.staff.id : 'warehouse'),
        actorName: actor?.name || (cu?.role === 'warehouse' ? cu.staff.fullName : 'مسئول انبار'),
        date: `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
        timestamp: now.toISOString(),
      });
      Storage.setInventoryTransactions(txs.slice(0, 1000));
    }

    Storage.addActivityLog({
      category: 'warehouse',
      action: 'ثبت کالای جدید در انبار',
      details: `کالای «${newItem.name}» (${newItem.code}) با موجودی ${newItem.quantity} ${newItem.unit} ثبت شد.`,
      targetName: newItem.name,
    });

    return {
      success: true,
      message: `کالای «${newItem.name}» با موفقیت در انبار ثبت گردید.`,
      item: newItem,
    };
  },

  updateInventoryItem: (
    id: string,
    updates: Partial<InventoryItem>
  ): { success: boolean; message: string } => {
    const cu = Storage.getCurrentUser();
    if (cu && cu.role !== 'warehouse') {
      return { success: false, message: 'فقط کاربر انبار مجاز به ویرایش مشخصات یا موجودی کالاهای انبار است.' };
    }
    const items = Storage.getInventoryItems();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return { success: false, message: 'کالای مورد نظر در انبار یافت نشد.' };

    const prevItem = items[idx];
    const cleanCode = updates.code !== undefined ? updates.code.trim().toUpperCase() : prevItem.code;
    if (cleanCode !== prevItem.code && items.some((i) => i.id !== id && i.code.toUpperCase() === cleanCode)) {
      return { success: false, message: 'کد کالای وارد شده برای کالای دیگری ثبت شده است.' };
    }

    const updatedItem: InventoryItem = {
      ...prevItem,
      ...updates,
      code: cleanCode,
    };

    // اگر مقدار موجودی مستقیماً در ویرایش تغییر کرده باشد، تراکنش تعدیل ثبت کن
    if (updates.quantity !== undefined && updates.quantity !== prevItem.quantity) {
      const diff = updates.quantity - prevItem.quantity;
      const now = new Date();
      const txs = Storage.getInventoryTransactions();
      txs.unshift({
        id: `itx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        inventoryItemId: updatedItem.id,
        itemCode: updatedItem.code,
        itemName: updatedItem.name,
        unit: updatedItem.unit,
        type: diff >= 0 ? 'in' : 'out',
        quantity: Math.abs(diff),
        previousQuantity: prevItem.quantity,
        newQuantity: updates.quantity,
        unitPrice: updatedItem.unitPrice,
        totalValue: Math.abs(diff) * (updatedItem.unitPrice || 0),
        reason: 'ویرایش و تعدیل مستقیم موجودی کالا توسط مسئول انبار',
        actorId: cu?.role === 'warehouse' ? cu.staff.id : 'warehouse',
        actorName: cu?.role === 'warehouse' ? cu.staff.fullName : 'مسئول انبار',
        date: `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
        timestamp: now.toISOString(),
      });
      Storage.setInventoryTransactions(txs.slice(0, 1000));
    }

    items[idx] = updatedItem;
    set(STORAGE_KEYS.INVENTORY_ITEMS, items);
    return { success: true, message: 'مشخصات و موجودی کالا در انبار بروزرسانی گردید.' };
  },

  deleteInventoryItem: (id: string): { success: boolean; message: string } => {
    const cu = Storage.getCurrentUser();
    if (cu && cu.role !== 'warehouse') {
      return { success: false, message: 'فقط کاربر انبار مجاز به حذف کالا از فهرست انبار است.' };
    }
    const items = Storage.getInventoryItems();
    const target = items.find((i) => i.id === id);
    const filtered = items.filter((i) => i.id !== id);
    set(STORAGE_KEYS.INVENTORY_ITEMS, filtered);
    if (target) {
      Storage.addActivityLog({
        category: 'warehouse',
        action: 'حذف کالا از انبار',
        details: `کالای «${target.name}» (${target.code}) توسط مسئول انبار حذف شد.`,
        targetName: target.name,
        severity: 'warning',
      });
    }
    return { success: true, message: 'کالا از فهرست انبار حذف گردید.' };
  },

  // ثبت ورودی یا خروجی موجودی کالا توسط مسئول انبار
  adjustInventoryStock: (
    itemId: string,
    payload: {
      type: 'in' | 'out';
      quantity: number;
      unitPrice?: number;
      reason: string;
      referenceCode?: string;
      dormName?: string;
      actorId: string;
      actorName: string;
    }
  ): { success: boolean; message: string; item?: InventoryItem } => {
    const cu = Storage.getCurrentUser();
    if (cu && cu.role !== 'warehouse') {
      return { success: false, message: 'فقط کاربر انبار مجاز به ثبت ورودی و خروجی کالاهای انبار است.' };
    }
    const qty = Number(payload.quantity);
    if (!qty || qty <= 0) {
      return { success: false, message: 'مقدار ورودی یا خروجی باید عددی بزرگ‌تر از صفر باشد.' };
    }
    const items = Storage.getInventoryItems();
    const idx = items.findIndex((i) => i.id === itemId);
    if (idx === -1) {
      return { success: false, message: 'کالای مورد نظر در انبار یافت نشد.' };
    }
    const item = items[idx];
    const prevQty = Number(item.quantity) || 0;
    if (payload.type === 'out' && qty > prevQty) {
      return {
        success: false,
        message: `موجودی فعلی (${prevQty.toLocaleString('fa-IR')} ${item.unit}) کمتر از مقدار خروجی درخواستی است.`,
      };
    }

    const newQty = payload.type === 'in' ? prevQty + qty : Math.max(0, prevQty - qty);
    const effectivePrice =
      payload.unitPrice !== undefined && payload.unitPrice >= 0 ? payload.unitPrice : item.unitPrice;
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    items[idx] = {
      ...item,
      quantity: newQty,
      unitPrice: effectivePrice,
      lastRestockedDate: payload.type === 'in' ? now.toLocaleDateString('fa-IR') : item.lastRestockedDate,
    };
    set(STORAGE_KEYS.INVENTORY_ITEMS, items);

    const txs = Storage.getInventoryTransactions();
    txs.unshift({
      id: `itx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      inventoryItemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      unit: item.unit,
      type: payload.type,
      quantity: qty,
      previousQuantity: prevQty,
      newQuantity: newQty,
      unitPrice: effectivePrice,
      totalValue: qty * (effectivePrice || 0),
      reason: payload.reason.trim() || (payload.type === 'in' ? 'ورود کالا به انبار' : 'خروج کالا از انبار'),
      referenceCode: payload.referenceCode?.trim() || undefined,
      dormName: payload.dormName?.trim() || undefined,
      actorId: payload.actorId,
      actorName: payload.actorName,
      date: dateStr,
      timestamp: now.toISOString(),
    });
    Storage.setInventoryTransactions(txs.slice(0, 1000));

    Storage.addActivityLog({
      category: 'warehouse',
      action: payload.type === 'in' ? 'ثبت ورودی کالا به انبار' : 'ثبت خروجی کالا از انبار',
      details: `${payload.type === 'in' ? 'ورود' : 'خروج'} ${qty} ${item.unit} از «${item.name}» (${item.code}) | موجودی جدید: ${newQty} ${item.unit} | بابت: ${payload.reason}`,
      targetName: item.name,
    });

    return {
      success: true,
      message: `${payload.type === 'in' ? 'ورودی' : 'خروجی'} ${qty.toLocaleString('fa-IR')} ${item.unit} «${item.name}» ثبت شد. موجودی جدید: ${newQty.toLocaleString('fa-IR')} ${item.unit}`,
      item: items[idx],
    };
  },

  // ورود دسته‌جمعی یا اکسل لیست مواد و وسایل انبار (فقط کاربر انبار)
  bulkImportInventoryItems: (
    rows: Array<Omit<InventoryItem, 'id'>>,
    actor: { id: string; name: string },
    mode: 'merge' | 'add_stock' = 'add_stock'
  ): { success: boolean; message: string; addedCount: number; updatedCount: number } => {
    const cu = Storage.getCurrentUser();
    if (cu && cu.role !== 'warehouse') {
      return {
        success: false,
        message: 'فقط کاربر انبار مجاز به وارد کردن یا تغییر لیست کالاهای انبار است.',
        addedCount: 0,
        updatedCount: 0,
      };
    }

    const items = Storage.getInventoryItems();
    const txs = Storage.getInventoryTransactions();
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    let addedCount = 0;
    let updatedCount = 0;

    rows.forEach((raw, rIdx) => {
      const cleanName = (raw.name || '').trim();
      if (!cleanName) return;

      const cleanCode = (raw.code || '').trim().toUpperCase() || `INV-${Date.now().toString().slice(-4)}-${rIdx + 1}`;
      const existingIdx = items.findIndex(
        (i) => i.code.toUpperCase() === cleanCode || i.name.trim() === cleanName
      );
      const qty = Math.max(0, Number(raw.quantity) || 0);
      const unitPrice = Math.max(0, Number(raw.unitPrice) || 0);

      if (existingIdx !== -1) {
        const prev = items[existingIdx];
        const prevQty = Number(prev.quantity) || 0;
        const newQty = mode === 'add_stock' ? prevQty + qty : qty;
        items[existingIdx] = {
          ...prev,
          name: cleanName,
          category: raw.category || prev.category,
          categoryLabel: raw.categoryLabel || prev.categoryLabel,
          quantity: newQty,
          unit: raw.unit?.trim() || prev.unit,
          minStockLevel: raw.minStockLevel ?? prev.minStockLevel,
          unitPrice: unitPrice > 0 ? unitPrice : prev.unitPrice,
          location: raw.location?.trim() || prev.location,
          lastRestockedDate: now.toLocaleDateString('fa-IR'),
        };
        if (newQty !== prevQty) {
          txs.unshift({
            id: `itx_${Date.now()}_${rIdx}_${Math.random().toString(36).substring(2, 5)}`,
            inventoryItemId: prev.id,
            itemCode: prev.code,
            itemName: cleanName,
            unit: items[existingIdx].unit,
            type: newQty >= prevQty ? 'in' : 'out',
            quantity: Math.abs(newQty - prevQty),
            previousQuantity: prevQty,
            newQuantity: newQty,
            unitPrice: items[existingIdx].unitPrice,
            totalValue: Math.abs(newQty - prevQty) * (items[existingIdx].unitPrice || 0),
            reason:
              mode === 'add_stock'
                ? 'ورود گروهی / بروزرسانی لیست موجودی انبار'
                : 'تنظیم گروهی موجودی انبار از فایل لیست',
            actorId: actor.id,
            actorName: actor.name,
            date: dateStr,
            timestamp: now.toISOString(),
          });
        }
        updatedCount++;
      } else {
        const newItem: InventoryItem = {
          id: `item_${Date.now()}_${rIdx}_${Math.random().toString(36).substring(2, 6)}`,
          code: cleanCode,
          name: cleanName,
          category: raw.category || 'general',
          categoryLabel: raw.categoryLabel,
          quantity: qty,
          unit: raw.unit?.trim() || 'عدد',
          minStockLevel: Math.max(0, Number(raw.minStockLevel) || 2),
          unitPrice,
          location: raw.location?.trim() || 'انبار مرکزی',
          lastRestockedDate: now.toLocaleDateString('fa-IR'),
        };
        items.unshift(newItem);
        if (qty > 0) {
          txs.unshift({
            id: `itx_${Date.now()}_${rIdx}_${Math.random().toString(36).substring(2, 5)}`,
            inventoryItemId: newItem.id,
            itemCode: newItem.code,
            itemName: newItem.name,
            unit: newItem.unit,
            type: 'in',
            quantity: qty,
            previousQuantity: 0,
            newQuantity: qty,
            unitPrice,
            totalValue: qty * unitPrice,
            reason: 'ورود اولیه از طریق ثبت لیست گروهی انبار',
            actorId: actor.id,
            actorName: actor.name,
            date: dateStr,
            timestamp: now.toISOString(),
          });
        }
        addedCount++;
      }
    });

    set(STORAGE_KEYS.INVENTORY_ITEMS, items);
    Storage.setInventoryTransactions(txs.slice(0, 1000));

    Storage.addActivityLog({
      category: 'warehouse',
      action: 'ورود گروهی لیست مواد و اقلام انبار',
      details: `${addedCount} کالای جدید اضافه و ${updatedCount} کالا بروزرسانی شد.`,
      targetName: `${addedCount + updatedCount} قلم کالا`,
    });

    return {
      success: true,
      message: `عملیات لیست انبار با موفقیت انجام شد: ${addedCount} کالای جدید ثبت و ${updatedCount} کالا بروزرسانی گردید.`,
      addedCount,
      updatedCount,
    };
  },

  // -------------------------------------------------------------
  // متدهای گردش کار حواله و درخواست‌های قطعه (Warehouse Requests)
  // -------------------------------------------------------------
  getWarehouseRequests: (): WarehouseRequest[] => get(STORAGE_KEYS.WAREHOUSE_REQUESTS, INITIAL_WAREHOUSE_REQUESTS),
  setWarehouseRequests: (requests: WarehouseRequest[]) => set(STORAGE_KEYS.WAREHOUSE_REQUESTS, requests),

  createWarehouseRequest: (
    requestData: {
      taskId?: string;
      taskTrackingCode?: string;
      dormId: string;
      dormName: string;
      requestedByStaffId: string;
      requestedByStaffName: string;
      requestedByRole: 'maintenance' | 'supervisor' | 'admin';
      itemTitle: string;
      inventoryItemId?: string;
      quantityRequested: number;
      unit: string;
      reason: string;
      urgency: 'normal' | 'urgent' | 'emergency';
    }
  ): { success: boolean; message: string; request: WarehouseRequest } => {
    const requests = Storage.getWarehouseRequests();
    const codeNum = requests.length + 101;
    const requestCode = `W-${codeNum}`;

    // اگر درخواست مستقیماً توسط سرپرست یا مدیر صادر شده باشد، نیازی به تأیید مجدد سرپرست نیست
    const isAutoApproved = requestData.requestedByRole === 'supervisor' || requestData.requestedByRole === 'admin';

    const newReq: WarehouseRequest = {
      id: `wreq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      requestCode,
      taskId: requestData.taskId,
      taskTrackingCode: requestData.taskTrackingCode,
      dormId: requestData.dormId,
      dormName: requestData.dormName,
      requestedByStaffId: requestData.requestedByStaffId,
      requestedByStaffName: requestData.requestedByStaffName,
      requestedByRole: requestData.requestedByRole,
      itemTitle: requestData.itemTitle,
      inventoryItemId: requestData.inventoryItemId,
      quantityRequested: requestData.quantityRequested,
      unit: requestData.unit,
      reason: requestData.reason,
      urgency: requestData.urgency,
      requestDate:
        new Date().toLocaleDateString('fa-IR') +
        ' - ' +
        new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      status: isAutoApproved ? 'pending_warehouse' : 'pending_supervisor',
      supervisorApproved: isAutoApproved,
      supervisorApprovedBy: isAutoApproved ? requestData.requestedByStaffName : undefined,
      supervisorApprovedAt: isAutoApproved ? new Date().toLocaleDateString('fa-IR') : undefined,
    };

    requests.unshift(newReq);
    Storage.setWarehouseRequests(requests);

    // اگر به یک سفارش کار تأسیسات متصل است، وضعیت آن را به waiting_parts بروزرسانی کن
    if (requestData.taskId) {
      const tasks = Storage.getMaintenanceTasks();
      const tIdx = tasks.findIndex((t) => t.id === requestData.taskId);
      if (tIdx !== -1) {
        tasks[tIdx].hasWarehouseRequisition = true;
        tasks[tIdx].warehouseRequestId = newReq.id;
        if (tasks[tIdx].status !== 'resolved') {
          tasks[tIdx].status = 'waiting_parts';
          tasks[tIdx].technicianNotes =
            (tasks[tIdx].technicianNotes ? tasks[tIdx].technicianNotes + '\n' : '') +
            `درخواست قطعه با کد ${requestCode} به انبار و کارپردازی ارجاع شد (${requestData.itemTitle} به مقدار ${requestData.quantityRequested} ${requestData.unit}).`;
        }
        Storage.setMaintenanceTasks(tasks);
      }
    }

    return {
      success: true,
      message: isAutoApproved
        ? `درخواست به انبار با کد رهگیری «${requestCode}» صادر و مستقیماً به کارتابل انبار ارسال شد.`
        : `درخواست کالا با کد رهگیری «${requestCode}» ثبت و جهت تأیید اولیه به کارتابل سرپرست ارسال گردید.`,
      request: newReq,
    };
  },

  approveWarehouseRequest: (
    requestId: string,
    supervisorName: string,
    notes?: string
  ): { success: boolean; message: string } => {
    const requests = Storage.getWarehouseRequests();
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) return { success: false, message: 'درخواست انبار یافت نشد.' };

    requests[idx].status = 'pending_warehouse';
    requests[idx].supervisorApproved = true;
    requests[idx].supervisorApprovedBy = supervisorName;
    requests[idx].supervisorApprovedAt =
      new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    if (notes) requests[idx].supervisorNotes = notes;

    Storage.setWarehouseRequests(requests);
    return { success: true, message: `درخواست ${requests[idx].requestCode} تأیید و جهت تحویل به انبار ارجاع شد.` };
  },

  rejectWarehouseRequest: (
    requestId: string,
    reason: string
  ): { success: boolean; message: string } => {
    const requests = Storage.getWarehouseRequests();
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) return { success: false, message: 'درخواست انبار یافت نشد.' };

    requests[idx].status = 'rejected';
    requests[idx].supervisorApproved = false;
    requests[idx].supervisorNotes = reason;

    Storage.setWarehouseRequests(requests);
    return { success: true, message: `درخواست ${requests[idx].requestCode} رد شد.` };
  },

  issueWarehouseRequest: (
    requestId: string,
    data: {
      warehouseStaffId: string;
      warehouseStaffName: string;
      issuedQuantity: number;
      unitPrice: number;
      warehouseNotes?: string;
    }
  ): { success: boolean; message: string } => {
    const requests = Storage.getWarehouseRequests();
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) return { success: false, message: 'درخواست انبار یافت نشد.' };

    const req = requests[idx];
    const totalCost = data.issuedQuantity * data.unitPrice;

    req.status = 'issued';
    req.issuedByStaffId = data.warehouseStaffId;
    req.issuedByStaffName = data.warehouseStaffName;
    req.issuedQuantity = data.issuedQuantity;
    req.unitPrice = data.unitPrice;
    req.totalCost = totalCost;
    req.issuedAt =
      new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    if (data.warehouseNotes) req.warehouseNotes = data.warehouseNotes;

    // کسر خودکار موجودی از جدول انبار و ثبت تراکنش خروجی
    if (req.inventoryItemId) {
      const inventory = Storage.getInventoryItems();
      const itemIdx = inventory.findIndex((i) => i.id === req.inventoryItemId);
      if (itemIdx !== -1) {
        const prevQty = Number(inventory[itemIdx].quantity) || 0;
        const newQty = Math.max(0, prevQty - data.issuedQuantity);
        inventory[itemIdx].quantity = newQty;
        set(STORAGE_KEYS.INVENTORY_ITEMS, inventory);

        const now = new Date();
        const txs = Storage.getInventoryTransactions();
        txs.unshift({
          id: `itx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          inventoryItemId: inventory[itemIdx].id,
          itemCode: inventory[itemIdx].code,
          itemName: inventory[itemIdx].name,
          unit: inventory[itemIdx].unit,
          type: 'out',
          quantity: data.issuedQuantity,
          previousQuantity: prevQty,
          newQuantity: newQty,
          unitPrice: data.unitPrice,
          totalValue: totalCost,
          reason: `تحویل با حواله انبار ${req.requestCode}${req.dormName ? ` (${req.dormName})` : ''}`,
          referenceCode: req.requestCode,
          dormName: req.dormName,
          actorId: data.warehouseStaffId,
          actorName: data.warehouseStaffName,
          date: `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
          timestamp: now.toISOString(),
        });
        Storage.setInventoryTransactions(txs.slice(0, 1000));
      }
    }

    // اتصال مجدد و بروزرسانی هزینه و قطعه در سفارش کار تأسیسات مرتبط
    if (req.taskId) {
      const tasks = Storage.getMaintenanceTasks();
      const tIdx = tasks.findIndex((t) => t.id === req.taskId);
      if (tIdx !== -1) {
        const itemDesc = `${req.itemTitle} (${data.issuedQuantity} ${req.unit})`;
        tasks[tIdx].partsUsed = tasks[tIdx].partsUsed ? `${tasks[tIdx].partsUsed}، ${itemDesc}` : itemDesc;
        tasks[tIdx].cost = (tasks[tIdx].cost || 0) + totalCost;
        if (tasks[tIdx].status === 'waiting_parts') {
          tasks[tIdx].status = 'in_progress';
        }
        tasks[tIdx].technicianNotes =
          (tasks[tIdx].technicianNotes ? tasks[tIdx].technicianNotes + '\n' : '') +
          `قطعه مورد نیاز توسط انباردار (${data.warehouseStaffName}) به صورت حواله ${req.requestCode} تحویل شد. هزینه فاکتور: ${totalCost.toLocaleString('fa-IR')} ریال.`;
        Storage.setMaintenanceTasks(tasks);
      }
    }

    Storage.setWarehouseRequests(requests);
    Storage.addActivityLog({
      category: 'warehouse',
      action: 'صدور حواله و تحویل کالا از انبار',
      details: `حواله ${req.requestCode} برای «${req.itemTitle}» به تعداد ${data.issuedQuantity} ${req.unit} صادر شد.`,
      targetName: req.requestCode,
    });
    return {
      success: true,
      message: `حواله با کد «${req.requestCode}» صادر گردید، موجودی انبار کسر شد و هزینه به مأموریت پیوند داده شد.`,
    };
  },

  // -------------------------------------------------------------
  // متدهای ارجاع خرید از انبار به کارپرداز و تأیید انتقال به انبار
  // -------------------------------------------------------------
  getProcurementRequests: (): ProcurementRequest[] =>
    get<ProcurementRequest[]>(STORAGE_KEYS.PROCUREMENT_REQUESTS, INITIAL_PROCUREMENT_REQUESTS),
  setProcurementRequests: (reqs: ProcurementRequest[]) => set(STORAGE_KEYS.PROCUREMENT_REQUESTS, reqs),

  createProcurementRequest: (data: {
    warehouseRequestId?: string;
    inventoryItemId?: string;
    itemTitle: string;
    itemCode?: string;
    category?: InventoryItem['category'];
    requestedQuantity: number;
    unit: string;
    urgency: 'normal' | 'urgent' | 'emergency';
    reason?: string;
    dormId?: string;
    dormName?: string;
    referredByStaffId: string;
    referredByStaffName: string;
    assignedProcurementId?: string;
    assignedProcurementName?: string;
  }): { success: boolean; message: string; procurementRequest?: ProcurementRequest } => {
    const cu = Storage.getCurrentUser();
    if (cu && cu.role !== 'warehouse') {
      return { success: false, message: 'فقط مسئول انبار مجاز به ارجاع کسری کالا به کارپرداز است.' };
    }
    const list = Storage.getProcurementRequests();
    const codeNum = list.length + 101;
    const trackingCode = `P-${codeNum}`;
    const now = new Date();
    const nowStr = `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    let warehouseRequestCode: string | undefined;
    if (data.warehouseRequestId) {
      const wReqs = Storage.getWarehouseRequests();
      const wIdx = wReqs.findIndex((r) => r.id === data.warehouseRequestId);
      if (wIdx !== -1) {
        warehouseRequestCode = wReqs[wIdx].requestCode;
      }
    }

    const newProc: ProcurementRequest = {
      id: `preq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      trackingCode,
      warehouseRequestId: data.warehouseRequestId,
      warehouseRequestCode,
      inventoryItemId: data.inventoryItemId,
      itemTitle: data.itemTitle.trim(),
      itemCode: data.itemCode?.trim(),
      category: data.category || 'general',
      requestedQuantity: Math.max(1, Number(data.requestedQuantity) || 1),
      unit: data.unit.trim() || 'عدد',
      urgency: data.urgency || 'normal',
      reason: data.reason?.trim() || 'عدم موجودی در انبار - ارجاع جهت خرید',
      dormId: data.dormId,
      dormName: data.dormName,
      referredByStaffId: data.referredByStaffId,
      referredByStaffName: data.referredByStaffName,
      referredAt: nowStr,
      assignedProcurementId: data.assignedProcurementId,
      assignedProcurementName: data.assignedProcurementName,
      status: 'pending_purchase',
      deliveryStatus: 'not_delivered',
    };

    list.unshift(newProc);
    Storage.setProcurementRequests(list);

    if (data.warehouseRequestId) {
      const wReqs = Storage.getWarehouseRequests();
      const wIdx = wReqs.findIndex((r) => r.id === data.warehouseRequestId);
      if (wIdx !== -1) {
        wReqs[wIdx].status = 'referred_to_procurement';
        wReqs[wIdx].procurementRequestId = newProc.id;
        wReqs[wIdx].procurementTrackingCode = trackingCode;
        wReqs[wIdx].referredToProcurementAt = nowStr;
        wReqs[wIdx].warehouseNotes =
          (wReqs[wIdx].warehouseNotes ? wReqs[wIdx].warehouseNotes + ' | ' : '') +
          `به دلیل کسری موجودی با کد ${trackingCode} به کارپرداز ارجاع شد.`;
        Storage.setWarehouseRequests(wReqs);
      }
    }

    Storage.addActivityLog({
      category: 'procurement',
      action: 'ارجاع کسری کالا از انبار به کارپرداز',
      details: `درخواست خرید «${newProc.itemTitle}» (${newProc.requestedQuantity} ${newProc.unit}) با کد ${trackingCode} به کارپرداز ارجاع شد.`,
      targetName: trackingCode,
    });

    return {
      success: true,
      message: `درخواست خرید با کد رهگیری «${trackingCode}» به کارتابل کارپرداز ارجاع گردید.`,
      procurementRequest: newProc,
    };
  },

  updateProcurementPurchase: (
    procurementId: string,
    payload: {
      status: ProcurementRequestStatus;
      purchasedQuantity?: number;
      purchasedItemCount?: number;
      unitPrice?: number;
      totalPrice?: number;
      supplierName?: string;
      invoiceNumber?: string;
      purchaseDate?: string;
      procurementNotes?: string;
      deliveryStatus: 'not_delivered' | 'delivered';
      actorId: string;
      actorName: string;
    }
  ): { success: boolean; message: string; request?: ProcurementRequest } => {
    const list = Storage.getProcurementRequests();
    const idx = list.findIndex((p) => p.id === procurementId);
    if (idx === -1) {
      return { success: false, message: 'درخواست خرید مورد نظر یافت نشد.' };
    }
    const existing = list[idx];
    if (existing.status === 'warehouse_confirmed' || existing.warehouseConfirmed) {
      return {
        success: false,
        message: 'این خرید قبلاً توسط مسئول انبار تأیید و به موجودی انبار منتقل شده و قابل تغییر نیست.',
      };
    }

    const now = new Date();
    const nowStr = `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const isDelivered = payload.deliveryStatus === 'delivered';
    const nextStatus: ProcurementRequestStatus = isDelivered
      ? 'delivered_to_warehouse'
      : payload.status === 'delivered_to_warehouse'
      ? 'purchased'
      : payload.status;

    const purchasedQty =
      payload.purchasedQuantity !== undefined
        ? Math.max(0, Number(payload.purchasedQuantity) || 0)
        : existing.purchasedQuantity;
    const unitPrice =
      payload.unitPrice !== undefined ? Math.max(0, Number(payload.unitPrice) || 0) : existing.unitPrice;
    const computedTotal =
      payload.totalPrice !== undefined
        ? Math.max(0, Number(payload.totalPrice) || 0)
        : purchasedQty !== undefined && unitPrice !== undefined
        ? purchasedQty * unitPrice
        : existing.totalPrice;

    const updated: ProcurementRequest = {
      ...existing,
      status: nextStatus,
      purchasedQuantity: purchasedQty,
      purchasedItemCount:
        payload.purchasedItemCount !== undefined
          ? Math.max(0, Number(payload.purchasedItemCount) || 0)
          : existing.purchasedItemCount,
      unitPrice,
      totalPrice: computedTotal,
      supplierName: payload.supplierName !== undefined ? payload.supplierName.trim() : existing.supplierName,
      invoiceNumber: payload.invoiceNumber !== undefined ? payload.invoiceNumber.trim() : existing.invoiceNumber,
      purchaseDate:
        payload.purchaseDate !== undefined
          ? payload.purchaseDate.trim()
          : existing.purchaseDate || now.toLocaleDateString('fa-IR'),
      procurementNotes:
        payload.procurementNotes !== undefined ? payload.procurementNotes.trim() : existing.procurementNotes,
      deliveryStatus: payload.deliveryStatus,
      deliveredAt: isDelivered ? existing.deliveredAt || nowStr : undefined,
      updatedByProcurementId: payload.actorId,
      updatedByProcurementName: payload.actorName,
      updatedAt: nowStr,
    };

    list[idx] = updated;
    Storage.setProcurementRequests(list);

    Storage.addActivityLog({
      category: 'procurement',
      action: isDelivered ? 'ثبت خرید و تحویل به انبار توسط کارپرداز' : 'بروزرسانی وضعیت خرید کارپرداز',
      details: `درخواست خرید ${updated.trackingCode} («${updated.itemTitle}») توسط کارپرداز ${payload.actorName} بروزرسانی شد. وضعیت تحویل: ${isDelivered ? 'تحویل به انبار (در انتظار تأیید انبار)' : 'عدم تحویل'}.`,
      targetName: updated.trackingCode,
    });

    return {
      success: true,
      message: isDelivered
        ? `اطلاعات خرید و تحویل «${updated.trackingCode}» ثبت شد و جهت تأیید و ورود به موجودی به کارتابل مسئول انبار ارسال گردید.`
        : `وضعیت خرید «${updated.trackingCode}» با موفقیت بروزرسانی شد.`,
      request: updated,
    };
  },

  confirmProcurementDeliveryToWarehouse: (
    procurementId: string,
    payload: {
      warehouseStaffId: string;
      warehouseStaffName: string;
      targetInventoryItemId?: string;
      newItemCode?: string;
      newItemCategory?: InventoryItem['category'];
      newItemLocation?: string;
      newItemMinStock?: number;
      confirmedQuantity?: number;
      unitPrice?: number;
      confirmNotes?: string;
    }
  ): { success: boolean; message: string; inventoryItem?: InventoryItem } => {
    const cu = Storage.getCurrentUser();
    if (cu && cu.role !== 'warehouse') {
      return {
        success: false,
        message: 'فقط کاربر انبار مجاز به تأیید تحویل کالا و انتقال آن به موجودی انبار است.',
      };
    }

    const list = Storage.getProcurementRequests();
    const idx = list.findIndex((p) => p.id === procurementId);
    if (idx === -1) {
      return { success: false, message: 'سفارش خرید کارپرداز یافت نشد.' };
    }
    const req = list[idx];
    if (req.warehouseConfirmed || req.status === 'warehouse_confirmed') {
      return { success: false, message: 'این خرید قبلاً تأیید و به موجودی انبار منتقل شده است.' };
    }
    if (req.deliveryStatus !== 'delivered') {
      return { success: false, message: 'کارپرداز هنوز وضعیت «تحویل به انبار» را برای این خرید ثبت نکرده است.' };
    }

    const qtyToStock = Math.max(
      1,
      Number(payload.confirmedQuantity ?? req.purchasedQuantity ?? req.requestedQuantity) || 1
    );
    const effectivePrice =
      payload.unitPrice !== undefined && payload.unitPrice >= 0
        ? payload.unitPrice
        : req.unitPrice || 0;

    const now = new Date();
    const nowStr = `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const inventory = Storage.getInventoryItems();
    const matchedId = payload.targetInventoryItemId || req.inventoryItemId;
    let invIdx = matchedId ? inventory.findIndex((i) => i.id === matchedId) : -1;
    if (invIdx === -1 && req.itemCode) {
      invIdx = inventory.findIndex((i) => i.code.toUpperCase() === req.itemCode!.toUpperCase());
    }
    if (invIdx === -1) {
      invIdx = inventory.findIndex((i) => i.name.trim() === req.itemTitle.trim());
    }

    let stockedItem: InventoryItem;
    let prevQty = 0;

    if (invIdx !== -1) {
      prevQty = Number(inventory[invIdx].quantity) || 0;
      inventory[invIdx] = {
        ...inventory[invIdx],
        quantity: prevQty + qtyToStock,
        unitPrice: effectivePrice > 0 ? effectivePrice : inventory[invIdx].unitPrice,
        lastRestockedDate: now.toLocaleDateString('fa-IR'),
      };
      stockedItem = inventory[invIdx];
    } else {
      const cat = payload.newItemCategory || req.category || 'general';
      const catLabels: Record<InventoryItem['category'], string> = {
        plumbing: 'تأسیسات و لوله‌کشی',
        electrical: 'برق و روشنایی',
        carpentry: 'نجاری و قفل',
        cleaning: 'بهداشت و نظافت',
        general: 'تجهیزات عمومی',
      };
      const baseCode = (payload.newItemCode || req.itemCode || '').trim().toUpperCase();
      const uniqueCode =
        baseCode && !inventory.some((i) => i.code.toUpperCase() === baseCode)
          ? baseCode
          : `PRC-${req.trackingCode.replace(/[^A-Za-z0-9]/g, '')}-${Date.now().toString().slice(-3)}`;

      stockedItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        code: uniqueCode,
        name: req.itemTitle,
        category: cat,
        categoryLabel: catLabels[cat],
        quantity: qtyToStock,
        unit: req.unit || 'عدد',
        minStockLevel: Math.max(0, Number(payload.newItemMinStock ?? 2)),
        unitPrice: effectivePrice,
        location: payload.newItemLocation?.trim() || 'انبار مرکزی',
        lastRestockedDate: now.toLocaleDateString('fa-IR'),
      };
      inventory.unshift(stockedItem);
    }

    set(STORAGE_KEYS.INVENTORY_ITEMS, inventory);

    // ثبت تراکنش ورودی انبار
    const txs = Storage.getInventoryTransactions();
    txs.unshift({
      id: `itx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      inventoryItemId: stockedItem.id,
      itemCode: stockedItem.code,
      itemName: stockedItem.name,
      unit: stockedItem.unit,
      type: 'in',
      quantity: qtyToStock,
      previousQuantity: prevQty,
      newQuantity: stockedItem.quantity,
      unitPrice: effectivePrice,
      totalValue: qtyToStock * effectivePrice,
      reason: `تحویل خرید کارپرداز (${req.updatedByProcurementName || req.assignedProcurementName || 'واحد کارپردازی'})${req.invoiceNumber ? ` - فاکتور ${req.invoiceNumber}` : ''}`,
      referenceCode: req.trackingCode,
      dormName: req.dormName,
      actorId: payload.warehouseStaffId,
      actorName: payload.warehouseStaffName,
      date: nowStr,
      timestamp: now.toISOString(),
    });
    Storage.setInventoryTransactions(txs.slice(0, 1000));

    // بروزرسانی پرونده خرید کارپردازی
    list[idx] = {
      ...req,
      status: 'warehouse_confirmed',
      warehouseConfirmed: true,
      warehouseConfirmedBy: payload.warehouseStaffName,
      warehouseConfirmedAt: nowStr,
      warehouseConfirmNotes: payload.confirmNotes?.trim(),
      transferredInventoryItemId: stockedItem.id,
    };
    Storage.setProcurementRequests(list);

    // بازگرداندن حواله متصل‌شده به صف آماده تحویل انبار
    if (req.warehouseRequestId) {
      const wReqs = Storage.getWarehouseRequests();
      const wIdx = wReqs.findIndex((r) => r.id === req.warehouseRequestId);
      if (wIdx !== -1 && wReqs[wIdx].status === 'referred_to_procurement') {
        wReqs[wIdx].status = 'pending_warehouse';
        wReqs[wIdx].inventoryItemId = stockedItem.id;
        wReqs[wIdx].unitPrice = effectivePrice > 0 ? effectivePrice : wReqs[wIdx].unitPrice;
        wReqs[wIdx].warehouseNotes =
          (wReqs[wIdx].warehouseNotes ? wReqs[wIdx].warehouseNotes + ' | ' : '') +
          `خرید (${req.trackingCode}) تحویل انبار و تأیید شد؛ آماده صدور حواله.`;
        Storage.setWarehouseRequests(wReqs);
      }
    }

    Storage.addActivityLog({
      category: 'warehouse',
      action: 'تأیید تحویل کارپرداز و انتقال به موجودی انبار',
      details: `خرید ${req.trackingCode} («${stockedItem.name}» به مقدار ${qtyToStock} ${stockedItem.unit}) توسط مسئول انبار تأیید و به موجودی انبار منتقل شد.`,
      targetName: stockedItem.name,
    });

    return {
      success: true,
      message: `تحویل خرید «${req.trackingCode}» تأیید شد و ${qtyToStock.toLocaleString('fa-IR')} ${stockedItem.unit} به موجودی کالای «${stockedItem.name}» در انبار منتقل گردید.`,
      inventoryItem: stockedItem,
    };
  },

  rejectProcurementDeliveryByWarehouse: (
    procurementId: string,
    reason: string,
    warehouseStaffName: string
  ): { success: boolean; message: string } => {
    const cu = Storage.getCurrentUser();
    if (cu && cu.role !== 'warehouse') {
      return { success: false, message: 'فقط کاربر انبار مجاز به رد تحویل خرید است.' };
    }
    const list = Storage.getProcurementRequests();
    const idx = list.findIndex((p) => p.id === procurementId);
    if (idx === -1) return { success: false, message: 'سفارش خرید یافت نشد.' };

    list[idx] = {
      ...list[idx],
      status: 'purchased',
      deliveryStatus: 'not_delivered',
      deliveredAt: undefined,
      warehouseConfirmed: false,
      warehouseConfirmNotes: `عدم تأیید تحویل توسط انبار (${warehouseStaffName}): ${reason || 'مغایرت کالا یا تعداد'}`,
    };
    Storage.setProcurementRequests(list);
    Storage.addActivityLog({
      category: 'warehouse',
      action: 'عدم تأیید تحویل کارپرداز توسط انبار',
      details: `تحویل سفارش ${list[idx].trackingCode} توسط مسئول انبار رد شد. علت: ${reason}`,
      targetName: list[idx].trackingCode,
      severity: 'warning',
    });
    return {
      success: true,
      message: `تحویل سفارش ${list[idx].trackingCode} تأیید نشد و به کارتابل کارپرداز بازگردانده شد.`,
    };
  },

  // -------------------------------------------------------------
  // متد جامع گزارش‌گیری چندحوزه‌ای با بازه زمانی دلخواه
  // -------------------------------------------------------------
  getDomainReportSummary: (filters: {
    domain: 'all' | 'maintenance' | 'services_cleaning' | 'warehouse' | 'accommodation' | 'rights_violation' | 'social_personal' | 'discipline';
    dormId?: string; // 'all' or specific dorm ID
    startDate?: string; // فرمت شمسی مثلاً ۱۴۰۳/۰۶/۰۱
    endDate?: string; // فرمت شمسی مثلاً ۱۴۰۳/۰۷/۱۵
  }) => {
    const tasks = Storage.getMaintenanceTasks();
    const requests = Storage.getWarehouseRequests();
    const messages = Storage.getMessages();
    const dorms = Storage.getDormitories();

    const dormMap = new Map(dorms.map((d) => [d.id, d.name]));

    // فیلتر زمانی کمکی
    const isInDateRange = (dateStr?: string) => {
      if (!dateStr) return true;
      const cleanDate = dateStr.slice(0, 10);
      if (filters.startDate && cleanDate < filters.startDate) return false;
      if (filters.endDate && cleanDate > filters.endDate) return false;
      return true;
    };

    // ۱. کارهای تأسیسات و تعمیرات
    const filteredTasks = tasks.filter((t) => {
      if (filters.dormId && filters.dormId !== 'all' && t.dormId !== filters.dormId) return false;
      if (!isInDateRange(t.createdAt)) return false;
      return true;
    });

    // ۲. درخواست‌ها و حواله‌های انبار
    const filteredRequests = requests.filter((r) => {
      if (filters.dormId && filters.dormId !== 'all' && r.dormId !== filters.dormId) return false;
      if (!isInDateRange(r.requestDate)) return false;
      return true;
    });

    // ۳. پیام‌ها و تیکت‌های دسته‌بندی‌شده
    const filteredMessages = messages.filter((m) => {
      if (!isInDateRange(m.date)) return false;
      if (filters.domain !== 'all' && m.category !== filters.domain) return false;
      return true;
    });

    // آمار تأسیسات
    const maintTotal = filteredTasks.length;
    const maintResolved = filteredTasks.filter((t) => t.status === 'resolved').length;
    const maintInProgress = filteredTasks.filter((t) => t.status === 'in_progress').length;
    const maintPending = filteredTasks.filter((t) => t.status === 'pending' || t.status === 'assigned').length;
    const maintWaitingParts = filteredTasks.filter((t) => t.status === 'waiting_parts').length;
    const maintTotalCost = filteredTasks.reduce((sum, t) => sum + (t.cost || 0), 0);

    // آمار انبار
    const whTotal = filteredRequests.length;
    const whIssued = filteredRequests.filter((r) => r.status === 'issued').length;
    const whPending = filteredRequests.filter((r) => r.status === 'pending_warehouse' || r.status === 'pending_supervisor').length;
    const whTotalCost = filteredRequests.reduce((sum, r) => sum + (r.totalCost || 0), 0);

    // آمار خدمات و نظافت (از تیکت‌ها)
    const cleaningMessages = filteredMessages.filter((m) => m.category === 'services_cleaning');
    // آمار حقوق دیگران
    const rightsMessages = filteredMessages.filter((m) => m.category === 'rights_violation');
    // آمار آسیب‌های فردی و اجتماعی
    const socialMessages = filteredMessages.filter((m) => m.category === 'social_personal');

    return {
      filters,
      summary: {
        maintTotal,
        maintResolved,
        maintInProgress,
        maintPending,
        maintWaitingParts,
        maintTotalCost,
        maintCompletionRate: maintTotal > 0 ? Math.round((maintResolved / maintTotal) * 100) : 0,
        whTotal,
        whIssued,
        whPending,
        whTotalCost,
        cleaningTotal: cleaningMessages.length,
        rightsTotal: rightsMessages.length,
        socialTotal: socialMessages.length,
      },
      filteredTasks,
      filteredRequests,
      filteredMessages,
    };
  },

  // -------------------------------------------------------------
  // مدیریت شیفت‌بندی سرپرستان سراها (Shift Scheduling)
  // -------------------------------------------------------------
  getShiftSchedules: (): SupervisorShiftSchedule[] => {
    return get<SupervisorShiftSchedule[]>(STORAGE_KEYS.SHIFT_SCHEDULES, INITIAL_SHIFT_SCHEDULES);
  },

  setShiftSchedules: (schedules: SupervisorShiftSchedule[]): void => {
    set(STORAGE_KEYS.SHIFT_SCHEDULES, schedules);
  },

  addShiftSchedule: (data: Omit<SupervisorShiftSchedule, 'id'>): { success: boolean; schedule: SupervisorShiftSchedule } => {
    const schedules = Storage.getShiftSchedules();
    const newSchedule: SupervisorShiftSchedule = {
      ...data,
      id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    schedules.push(newSchedule);
    Storage.setShiftSchedules(schedules);
    return { success: true, schedule: newSchedule };
  },

  updateShiftSchedule: (id: string, updates: Partial<SupervisorShiftSchedule>): { success: boolean } => {
    const schedules = Storage.getShiftSchedules();
    const idx = schedules.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false };
    schedules[idx] = { ...schedules[idx], ...updates };
    Storage.setShiftSchedules(schedules);
    return { success: true };
  },

  deleteShiftSchedule: (id: string): { success: boolean } => {
    const schedules = Storage.getShiftSchedules();
    const filtered = schedules.filter((s) => s.id !== id);
    Storage.setShiftSchedules(filtered);
    return { success: true };
  },

  // دریافت شیفت‌های معتبر یک سرپرست با قانون پیش‌فرض (اگر تعیین نشود یعنی هر روز حضور دارند)
  getSupervisorEffectiveShifts: (supervisorId: string, supervisorName?: string): SupervisorShiftSchedule[] => {
    const schedules = Storage.getShiftSchedules();
    const supervisorShifts = schedules.filter((s) => s.supervisorId === supervisorId);
    if (supervisorShifts.length > 0) {
      return supervisorShifts;
    }
    // اگر تعیین نشده باشد، یعنی هر روز حضور دارد (پیش‌فرض سیستم)
    return [
      {
        id: `default_${supervisorId}`,
        supervisorId,
        supervisorName: supervisorName || 'سرپرست محترم سرا',
        dormId: 'all',
        dormName: 'سرای تحت سرپرستی',
        dayOfWeek: 'all',
        shiftType: 'full_day',
        startTime: '۰۸:۰۰',
        endTime: '۲۰:۰۰',
        notes: 'حضور روزانه پیوسته در سرا (پیش‌فرض خودکار سیستم)',
        isEveryDay: true,
      },
    ];
  },

  // -------------------------------------------------------------
  // ثبت و پایش گزارش‌های شیفت سرپرستان (Shift Handover & Logbook)
  // -------------------------------------------------------------
  getShiftReports: (): ShiftLogReport[] => {
    return get<ShiftLogReport[]>(STORAGE_KEYS.SHIFT_REPORTS, INITIAL_SHIFT_REPORTS);
  },

  setShiftReports: (reports: ShiftLogReport[]): void => {
    set(STORAGE_KEYS.SHIFT_REPORTS, reports);
  },

  addShiftReport: (data: Omit<ShiftLogReport, 'id' | 'reportCode' | 'createdAt'>): { success: boolean; report: ShiftLogReport } => {
    const reports = Storage.getShiftReports();
    const now = new Date();
    const codeSeq = (reports.length + 1).toString().padStart(2, '0');
    const newReport: ShiftLogReport = {
      ...data,
      id: `sr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reportCode: `REP-${now.getFullYear() % 100}${codeSeq}`,
      createdAt: `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
    };
    reports.unshift(newReport);
    Storage.setShiftReports(reports);
    return { success: true, report: newReport };
  },

  deleteShiftReport: (id: string): { success: boolean } => {
    const reports = Storage.getShiftReports();
    const filtered = reports.filter((r) => r.id !== id);
    Storage.setShiftReports(filtered);
    return { success: true };
  },

  // -------------------------------------------------------------
  // مدیریت کارشناسان مشاور (Counselors Management)
  // -------------------------------------------------------------
  getCounselors: (): CounselorStaff[] => {
    return get<CounselorStaff[]>(STORAGE_KEYS.COUNSELORS, INITIAL_COUNSELORS);
  },

  setCounselors: (counselors: CounselorStaff[]): boolean => {
    return set(STORAGE_KEYS.COUNSELORS, counselors);
  },

  addCounselor: (counselor: Omit<CounselorStaff, 'id'>): { success: boolean; counselor: CounselorStaff } => {
    const counselors = Storage.getCounselors();
    const newCounselor: CounselorStaff = {
      ...counselor,
      id: `cns_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    counselors.push(newCounselor);
    Storage.setCounselors(counselors);
    return { success: true, counselor: newCounselor };
  },

  updateCounselor: (
    id: string,
    updates: Partial<CounselorStaff>
  ): { success: boolean; message: string } => {
    const counselors = Storage.getCounselors();
    const idx = counselors.findIndex((c) => c.id === id);
    if (idx === -1) return { success: false, message: 'کاربر مشاور یافت نشد.' };
    if (updates.username) {
      const cleanU = updates.username.trim().toLowerCase();
      if (counselors.some((c) => c.id !== id && c.username.trim().toLowerCase() === cleanU)) {
        return { success: false, message: 'این نام کاربری قبلاً برای مشاور دیگری ثبت شده است.' };
      }
    }
    counselors[idx] = { ...counselors[idx], ...updates };
    Storage.setCounselors(counselors);
    const cu = Storage.getCurrentUser();
    if (cu && cu.role === 'counselor' && cu.counselor.id === id) {
      Storage.setCurrentUser({ role: 'counselor', counselor: counselors[idx] });
    }
    return { success: true, message: 'مشخصات مشاور با موفقیت بروزرسانی شد.' };
  },

  deleteCounselor: (id: string): { success: boolean } => {
    const counselors = Storage.getCounselors();
    const filtered = counselors.filter((c) => c.id !== id);
    Storage.setCounselors(filtered);
    return { success: true };
  },

  // -------------------------------------------------------------
  // شیفت‌های کاری مشاوران (Counselor Shift Schedules)
  // -------------------------------------------------------------
  getCounselorShifts: (): CounselorShiftSchedule[] => {
    return get<CounselorShiftSchedule[]>(STORAGE_KEYS.COUNSELOR_SHIFTS, INITIAL_COUNSELOR_SHIFTS);
  },

  setCounselorShifts: (shifts: CounselorShiftSchedule[]): void => {
    set(STORAGE_KEYS.COUNSELOR_SHIFTS, shifts);
  },

  addCounselorShift: (data: Omit<CounselorShiftSchedule, 'id'>): { success: boolean; shift: CounselorShiftSchedule } => {
    const shifts = Storage.getCounselorShifts();
    const newShift: CounselorShiftSchedule = {
      ...data,
      id: `cshift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    shifts.push(newShift);
    Storage.setCounselorShifts(shifts);
    return { success: true, shift: newShift };
  },

  updateCounselorShift: (id: string, updates: Partial<CounselorShiftSchedule>): { success: boolean } => {
    const shifts = Storage.getCounselorShifts();
    const idx = shifts.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false };
    shifts[idx] = { ...shifts[idx], ...updates };
    Storage.setCounselorShifts(shifts);
    return { success: true };
  },

  deleteCounselorShift: (id: string): { success: boolean } => {
    const shifts = Storage.getCounselorShifts();
    const filtered = shifts.filter((s) => s.id !== id);
    Storage.setCounselorShifts(filtered);
    return { success: true };
  },

  // -------------------------------------------------------------
  // گزارش‌نویسی و فعالیت‌های شیفت مشاوران (Counselor Shift Reports)
  // -------------------------------------------------------------
  getCounselorReports: (): CounselorShiftReport[] => {
    return get<CounselorShiftReport[]>(STORAGE_KEYS.COUNSELOR_REPORTS, INITIAL_COUNSELOR_REPORTS);
  },

  setCounselorReports: (reports: CounselorShiftReport[]): void => {
    set(STORAGE_KEYS.COUNSELOR_REPORTS, reports);
  },

  addCounselorReport: (data: Omit<CounselorShiftReport, 'id' | 'reportCode' | 'createdAt'>): { success: boolean; report: CounselorShiftReport } => {
    const reports = Storage.getCounselorReports();
    const now = new Date();
    const codeSeq = (reports.length + 1).toString().padStart(2, '0');
    const newReport: CounselorShiftReport = {
      ...data,
      id: `cr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reportCode: `CNS-${now.getFullYear() % 100}${codeSeq}`,
      createdAt: `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
    };
    reports.unshift(newReport);
    Storage.setCounselorReports(reports);
    return { success: true, report: newReport };
  },

  deleteCounselorReport: (id: string): { success: boolean } => {
    const reports = Storage.getCounselorReports();
    const filtered = reports.filter((r) => r.id !== id);
    Storage.setCounselorReports(filtered);
    return { success: true };
  },

  // -------------------------------------------------------------
  // سیستم ثبت و گزارش‌گیری لاگ فعالیت‌ها و دسترسی‌های کاربران (Activity Log)
  // -------------------------------------------------------------
  getActivityLogs: (): ActivityLog[] => {
    return get<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
  },

  setActivityLogs: (logs: ActivityLog[]): void => {
    set(STORAGE_KEYS.ACTIVITY_LOGS, logs);
  },

  addActivityLog: (entry: {
    category: ActivityLogCategory;
    action: string;
    details: string;
    targetName?: string;
    severity?: 'info' | 'warning' | 'critical';
    actorName?: string;
    actorRole?: ActivityLog['actorRole'];
    actorUsername?: string;
  }): ActivityLog => {
    const currentUser = Storage.getCurrentUser();
    let actorName = entry.actorName;
    let actorRole: ActivityLog['actorRole'] = entry.actorRole || 'system';
    let actorUsername = entry.actorUsername;

    if (!actorName && currentUser) {
      if (currentUser.role === 'admin') {
        actorName = currentUser.name;
        actorRole = 'admin';
        actorUsername = currentUser.username;
      } else if (currentUser.role === 'supervisor') {
        actorName = currentUser.supervisor.fullName;
        actorRole = 'supervisor';
        actorUsername = currentUser.supervisor.username;
      } else if (currentUser.role === 'student') {
        actorName = currentUser.student.fullName;
        actorRole = 'student';
        actorUsername = currentUser.student.studentId;
      } else if (currentUser.role === 'maintenance') {
        actorName = currentUser.technician.fullName;
        actorRole = 'maintenance';
        actorUsername = currentUser.technician.username;
      } else if (currentUser.role === 'warehouse') {
        actorName = currentUser.staff.fullName;
        actorRole = 'warehouse';
        actorUsername = currentUser.staff.username;
      } else if (currentUser.role === 'counselor') {
        actorName = currentUser.counselor.fullName;
        actorRole = 'counselor';
        actorUsername = currentUser.counselor.username;
      } else if (currentUser.role === 'finance') {
        actorName = currentUser.staff.fullName;
        actorRole = 'finance';
        actorUsername = currentUser.staff.username;
      } else if (currentUser.role === 'procurement') {
        actorName = currentUser.staff.fullName;
        actorRole = 'procurement';
        actorUsername = currentUser.staff.username;
      }
    }

    const now = new Date();
    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now.toISOString(),
      date: `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}`,
      actorName: actorName || 'سیستم / کاربر مهمان',
      actorRole,
      actorUsername,
      category: entry.category,
      action: entry.action,
      details: entry.details,
      targetName: entry.targetName,
      severity: entry.severity || 'info',
    };

    const logs = Storage.getActivityLogs();
    const updated = [newLog, ...logs].slice(0, 500);
    Storage.setActivityLogs(updated);
    return newLog;
  },

  clearActivityLogs: (): void => {
    Storage.setActivityLogs([]);
  },

  // -------------------------------------------------------------
  // تذکرات، اخطارها و نمرات ارزیابی فردی و اتاق دانشجویان
  // -------------------------------------------------------------
  getStudentEvaluations: (): StudentEvaluation[] => {
    return get<StudentEvaluation[]>(STORAGE_KEYS.STUDENT_EVALUATIONS, INITIAL_STUDENT_EVALUATIONS);
  },

  setStudentEvaluations: (items: StudentEvaluation[]): void => {
    set(STORAGE_KEYS.STUDENT_EVALUATIONS, items);
  },

  addStudentEvaluation: (
    data: Omit<StudentEvaluation, 'id' | 'date'>,
    applyToRoommates = false
  ): { success: boolean; createdCount: number; message: string } => {
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const items = Storage.getStudentEvaluations();
    const students = Storage.getStudents();
    const beds = Storage.getBeds();

    const targetStudents: Student[] = [];
    const primaryStudent = students.find((s) => s.studentId === data.studentId);
    if (primaryStudent) {
      targetStudents.push(primaryStudent);
    }

    if (applyToRoommates && data.scope === 'room' && data.roomId) {
      const roomOccupantIds = beds
        .filter((b) => b.roomId === data.roomId && b.studentId && b.studentId !== data.studentId)
        .map((b) => b.studentId as string);
      roomOccupantIds.forEach((occId) => {
        const occ = students.find((s) => s.studentId === occId);
        if (occ && !targetStudents.some((t) => t.studentId === occ.studentId)) {
          targetStudents.push(occ);
        }
      });
    }

    if (targetStudents.length === 0) {
      const single: StudentEvaluation = {
        ...data,
        id: `eval_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        date: dateStr,
        resolved: data.type === 'evaluation' || data.type === 'report' ? true : false,
      };
      items.unshift(single);
      Storage.setStudentEvaluations(items);
    } else {
      targetStudents.forEach((st, idx) => {
        const record: StudentEvaluation = {
          ...data,
          studentId: st.studentId,
          studentName: st.fullName,
          id: `eval_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          date: dateStr,
          resolved: data.type === 'evaluation' || data.type === 'report' ? true : false,
        };
        items.unshift(record);

        if (data.type === 'evaluation' && typeof data.score === 'number') {
          st.previousScore = data.score;
        }
      });
      Storage.setStudentEvaluations(items);
      if (data.type === 'evaluation' && typeof data.score === 'number') {
        Storage.setStudents(students);
        const currentUser = Storage.getCurrentUser();
        if (currentUser && currentUser.role === 'student') {
          const updatedSelf = students.find((s) => s.studentId === currentUser.student.studentId);
          if (updatedSelf) {
            Storage.setCurrentUser({ role: 'student', student: updatedSelf });
          }
        }
      }
    }

    const typeLabel =
      data.type === 'evaluation'
        ? `نمره ارزیابی (${data.score ?? '-'} از ۱۰۰)`
        : data.type === 'warning'
        ? 'اخطار رسمی'
        : data.type === 'report'
        ? 'گزارش'
        : 'تذکر';
    const scopeLabel = data.scope === 'room' ? 'اتاق' : 'فردی';
    Storage.addActivityLog({
      category: 'warning_eval',
      action: `ثبت ${typeLabel} (${scopeLabel})`,
      details: `${typeLabel} با عنوان «${data.title}» برای ${targetStudents.length > 1 ? `${targetStudents.length} نفر از ساکنین اتاق ${data.roomNumber || ''}` : data.studentName} ثبت شد.`,
      targetName: data.studentName,
      severity: data.type === 'warning' ? 'warning' : 'info',
      actorName: data.evaluatorName,
      actorRole: data.evaluatorRole,
    });

    const createdCount = Math.max(1, targetStudents.length);
    return {
      success: true,
      createdCount,
      message:
        createdCount > 1
          ? `${typeLabel} (${scopeLabel}) برای ${createdCount} دانشجوی هم‌اتاقی با موفقیت ثبت شد.`
          : `${typeLabel} (${scopeLabel}) برای ${data.studentName} با موفقیت ثبت شد.`,
    };
  },

  resolveStudentEvaluation: (id: string): void => {
    const items = Storage.getStudentEvaluations();
    const target = items.find((e) => e.id === id);
    if (target) {
      target.resolved = true;
      target.resolvedAt = new Date().toLocaleDateString('fa-IR');
      Storage.setStudentEvaluations(items);
      Storage.addActivityLog({
        category: 'warning_eval',
        action: 'رفع تذکر/اخطار دانشجو',
        details: `مورد «${target.title}» مربوط به ${target.studentName} برطرف شده ثبت شد.`,
        targetName: target.studentName,
      });
    }
  },

  deleteStudentEvaluation: (id: string): void => {
    const items = Storage.getStudentEvaluations();
    const target = items.find((e) => e.id === id);
    Storage.setStudentEvaluations(items.filter((e) => e.id !== id));
    if (target) {
      Storage.addActivityLog({
        category: 'warning_eval',
        action: 'حذف سابقه ارزیابی/تذکر دانشجو',
        details: `سابقه «${target.title}» برای ${target.studentName} حذف شد.`,
        targetName: target.studentName,
        severity: 'warning',
      });
    }
  },

  // -------------------------------------------------------------
  // درخواست‌های موافقت با مهمان دانشجو (ارسال به سرپرست و پیگیری تحویل مدارک)
  // -------------------------------------------------------------
  getGuestRequests: (): GuestRequest[] => {
    return get<GuestRequest[]>(STORAGE_KEYS.GUEST_REQUESTS, INITIAL_GUEST_REQUESTS);
  },

  setGuestRequests: (items: GuestRequest[]): void => {
    set(STORAGE_KEYS.GUEST_REQUESTS, items);
  },

  createGuestRequest: (payload: {
    studentId: string;
    eligibilityType: GuestEligibilityType;
    relationshipToStudent: string;
    guestFullName: string;
    guestNationalId: string;
    guestFatherName: string;
    guestPhone: string;
    guestProvince: string;
    guestCity: string;
    guestStudentId?: string;
    guestUniversityName?: string;
    guestFieldOfStudy?: string;
    stayDuration: string;
    arrivalDate: string;
    arrivalTime: string;
    departureDate: string;
    departureTime: string;
    visitReason?: string;
    fullResponsibilityAccepted: boolean;
    noSelfFoodAccepted: boolean;
    roommatesConsentConfirmed: boolean;
  }): { success: boolean; message: string; request?: GuestRequest } => {
    const students = Storage.getStudents();
    const dorms = Storage.getDormitories();
    const rooms = Storage.getRooms();

    const student = students.find((s) => s.studentId === payload.studentId);
    if (!student) {
      return { success: false, message: 'اطلاعات دانشجو در سامانه یافت نشد.' };
    }
    if (!student.isProfileCompleted) {
      return { success: false, message: 'ابتدا باید فرم پرونده اسکان خود را تکمیل نمایید.' };
    }
    if (!student.assignedDormId || !student.assignedRoomId) {
      return {
        success: false,
        message: 'ثبت درخواست مهمان تنها برای دانشجویان دارای اتاق و سرای تخصیص‌یافته امکان‌پذیر است.',
      };
    }

    // شرط قطعی احراز مهمان
    if (
      payload.eligibilityType !== 'first_degree_relative' &&
      payload.eligibilityType !== 'other_province_farhangian'
    ) {
      return {
        success: false,
        message:
          'طبق مقررات، مهمان حتماً باید از اقوام درجه یک دانشجو یا دانشجوی دانشگاه فرهنگیان استان دیگری باشد. در غیر این صورت امکان درخواست وجود ندارد.',
      };
    }

    const normProvince = payload.guestProvince.replace(/ي/g, 'ی').replace(/ك/g, 'ک').trim();
    if (payload.eligibilityType === 'other_province_farhangian') {
      if (!normProvince || normProvince.includes('اصفهان')) {
        return {
          success: false,
          message:
            'در حالت دانشجوی دانشگاه فرهنگیان، مهمان باید از استانی غیراز استان اصفهان باشد. برای استان اصفهان امکان ثبت درخواست وجود ندارد.',
        };
      }
      if (!payload.guestStudentId?.trim() || !payload.guestUniversityName?.trim()) {
        return {
          success: false,
          message: 'برای مهمان دانشجوی فرهنگیان استان دیگر، وارد کردن کد دانشجویی و نام پردیس/دانشگاه مبدأ الزامی است.',
        };
      }
    }

    if (
      !payload.fullResponsibilityAccepted ||
      !payload.noSelfFoodAccepted ||
      !payload.roommatesConsentConfirmed
    ) {
      return {
        success: false,
        message:
          'تأیید هر سه تعهد الزامی (مسئولیت کامل مهمان، عدم تعلق غذای سلف و رضایت ساکنین اتاق) جهت ثبت درخواست ضروری است.',
      };
    }

    const cleanGuestName = payload.guestFullName.trim();
    const cleanNationalId = payload.guestNationalId.trim();
    const cleanFather = payload.guestFatherName.trim();
    const cleanPhone = payload.guestPhone.trim();
    const cleanRelation = payload.relationshipToStudent.trim();

    if (!cleanGuestName || !cleanNationalId || !cleanFather || !cleanPhone || !cleanRelation) {
      return {
        success: false,
        message: 'لطفاً تمامی مشخصات هویتی و نسبت مهمان را به صورت کامل وارد نمایید.',
      };
    }

    if (
      !payload.stayDuration.trim() ||
      !payload.arrivalDate.trim() ||
      !payload.arrivalTime.trim() ||
      !payload.departureDate.trim() ||
      !payload.departureTime.trim()
    ) {
      return {
        success: false,
        message: 'تعیین مدت اقامت و تاریخ و زمان دقیق ورود و خروج مهمان الزامی است.',
      };
    }

    const dorm = dorms.find((d) => d.id === student.assignedDormId);
    const room = rooms.find((r) => r.id === student.assignedRoomId);
    const requests = Storage.getGuestRequests();

    const now = new Date();
    const dateStr = `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const newReq: GuestRequest = {
      id: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      trackingCode: `G-${101 + requests.length}`,
      studentId: student.studentId,
      studentName: student.fullName,
      studentNationalId: student.nationalId,
      studentPhone: student.mobile || student.phone || '-',
      dormId: student.assignedDormId,
      dormName: dorm?.name || student.assignedDormName || 'سرای دانشجویی',
      roomId: student.assignedRoomId,
      roomNumber: room?.roomNumber || student.assignedRoomNumber || '-',
      eligibilityType: payload.eligibilityType,
      relationshipToStudent: cleanRelation,
      guestFullName: cleanGuestName,
      guestNationalId: cleanNationalId,
      guestFatherName: cleanFather,
      guestPhone: cleanPhone,
      guestProvince: normProvince || payload.guestProvince.trim(),
      guestCity: payload.guestCity.trim(),
      guestStudentId: payload.guestStudentId?.trim() || undefined,
      guestUniversityName: payload.guestUniversityName?.trim() || undefined,
      guestFieldOfStudy: payload.guestFieldOfStudy?.trim() || undefined,
      stayDuration: payload.stayDuration.trim(),
      arrivalDate: payload.arrivalDate.trim(),
      arrivalTime: payload.arrivalTime.trim(),
      departureDate: payload.departureDate.trim(),
      departureTime: payload.departureTime.trim(),
      visitReason: payload.visitReason?.trim() || undefined,
      fullResponsibilityAccepted: true,
      noSelfFoodAccepted: true,
      roommatesConsentConfirmed: true,
      status: 'pending_supervisor',
      createdAt: dateStr,
      documentsSubmittedToSupervisor: false,
    };

    requests.unshift(newReq);
    Storage.setGuestRequests(requests);

    Storage.addActivityLog({
      category: 'guest',
      action: 'ثبت درخواست موافقت با مهمان',
      details: `درخواست مهمان (${newReq.trackingCode}) توسط ${student.fullName} برای «${newReq.guestFullName}» (${newReq.relationshipToStudent}) در ${newReq.dormName} اتاق ${newReq.roomNumber} به کارتابل سرپرستی ارسال شد.`,
      targetName: `${newReq.guestFullName} (${newReq.trackingCode})`,
      actorName: student.fullName,
      actorRole: 'student',
      actorUsername: student.studentId,
    });

    return {
      success: true,
      message: `درخواست مهمان با کد رهگیری ${newReq.trackingCode} ثبت و جهت بررسی و موافقت به کارتابل سرپرست سرا ارسال شد.`,
      request: newReq,
    };
  },

  approveGuestRequest: (
    id: string,
    supervisorName: string,
    supervisorNotes?: string
  ): { success: boolean; message: string } => {
    const requests = Storage.getGuestRequests();
    const target = requests.find((r) => r.id === id);
    if (!target) {
      return { success: false, message: 'درخواست مهمان یافت نشد.' };
    }
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    target.status = 'approved';
    target.reviewedBy = supervisorName;
    target.reviewedAt = dateStr;
    target.supervisorNotes =
      supervisorNotes?.trim() ||
      'درخواست مهمان مورد موافقت قرار گرفت. دانشجو می‌تواند با در دست داشتن مدارک شناسایی/دانشجویی به دفتر سرپرستی مراجعه و مدارک را تحویل دهد.';
    target.rejectionReason = undefined;
    Storage.setGuestRequests(requests);

    Storage.addActivityLog({
      category: 'guest',
      action: 'موافقت سرپرست با درخواست مهمان',
      details: `درخواست مهمان ${target.trackingCode} (${target.guestFullName}، مهمان ${target.studentName}) توسط ${supervisorName} تأیید شد.`,
      targetName: `${target.studentName} (${target.trackingCode})`,
      actorName: supervisorName,
      actorRole: 'supervisor',
    });

    return {
      success: true,
      message: `با درخواست مهمان ${target.trackingCode} موافقت شد و پیام مراجعه جهت تحویل مدارک به سرپرستی برای دانشجو فعال گردید.`,
    };
  },

  rejectGuestRequest: (
    id: string,
    supervisorName: string,
    rejectionReason: string
  ): { success: boolean; message: string } => {
    const cleanReason = rejectionReason.trim();
    if (!cleanReason) {
      return { success: false, message: 'ذکر علت رد درخواست مهمان الزامی است.' };
    }
    const requests = Storage.getGuestRequests();
    const target = requests.find((r) => r.id === id);
    if (!target) {
      return { success: false, message: 'درخواست مهمان یافت نشد.' };
    }
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    target.status = 'rejected';
    target.reviewedBy = supervisorName;
    target.reviewedAt = dateStr;
    target.rejectionReason = cleanReason;
    Storage.setGuestRequests(requests);

    Storage.addActivityLog({
      category: 'guest',
      action: 'رد درخواست مهمان توسط سرپرست',
      details: `درخواست مهمان ${target.trackingCode} (${target.guestFullName}، مهمان ${target.studentName}) به علت «${cleanReason}» رد شد.`,
      targetName: `${target.studentName} (${target.trackingCode})`,
      severity: 'warning',
      actorName: supervisorName,
      actorRole: 'supervisor',
    });

    return {
      success: true,
      message: `درخواست مهمان ${target.trackingCode} با ثبت علت رد شد.`,
    };
  },

  markGuestDocumentsSubmitted: (
    id: string,
    supervisorName: string,
    submitted = true
  ): { success: boolean; message: string } => {
    const requests = Storage.getGuestRequests();
    const target = requests.find((r) => r.id === id);
    if (!target) {
      return { success: false, message: 'درخواست مهمان یافت نشد.' };
    }
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    target.documentsSubmittedToSupervisor = submitted;
    target.documentsSubmittedAt = submitted ? dateStr : undefined;
    Storage.setGuestRequests(requests);

    Storage.addActivityLog({
      category: 'guest',
      action: submitted ? 'ثبت تحویل مدارک مهمان به سرپرستی' : 'لغو وضعیت تحویل مدارک مهمان',
      details: `وضعیت تحویل مدارک برای درخواست ${target.trackingCode} (${target.guestFullName} - مهمان ${target.studentName}) توسط ${supervisorName} بروزرسانی شد.`,
      targetName: `${target.guestFullName} (${target.trackingCode})`,
      actorName: supervisorName,
      actorRole: 'supervisor',
    });

    return {
      success: true,
      message: submitted
        ? 'تحویل حضوری مدارک مهمان به دفتر سرپرستی ثبت شد.'
        : 'وضعیت تحویل مدارک به حالت در انتظار بازگردانده شد.',
    };
  },

  cancelGuestRequest: (id: string, studentId: string): { success: boolean; message: string } => {
    const requests = Storage.getGuestRequests();
    const target = requests.find((r) => r.id === id && r.studentId === studentId);
    if (!target) {
      return { success: false, message: 'درخواست مهمان یافت نشد.' };
    }
    if (target.status !== 'pending_supervisor') {
      return { success: false, message: 'تنها درخواست‌های در انتظار بررسی سرپرست قابل لغو هستند.' };
    }
    target.status = 'cancelled';
    Storage.setGuestRequests(requests);

    Storage.addActivityLog({
      category: 'guest',
      action: 'لغو درخواست مهمان توسط دانشجو',
      details: `دانشجو ${target.studentName} درخواست مهمان ${target.trackingCode} را لغو کرد.`,
      targetName: `${target.guestFullName} (${target.trackingCode})`,
      actorName: target.studentName,
      actorRole: 'student',
      actorUsername: studentId,
    });

    return { success: true, message: 'درخواست مهمان لغو شد.' };
  },

  // -------------------------------------------------------------
  // توابع همگام‌سازی دوطرفه با دیتابیس ابری MongoDB Atlas
  // -------------------------------------------------------------
  fetchStudentsFromDB: async (): Promise<Student[] | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_BASE_URL}/students`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const rawData = await res.json();
      if (!Array.isArray(rawData)) return null;

      const cleanStudents: Student[] = rawData.map((item: Record<string, unknown>) =>
        normalizeStudentRecord(item)
      );

      const lastLocalWrite = keyWriteTimestamps[STORAGE_KEYS.STUDENTS] || 0;
      if (Date.now() - lastLocalWrite > 5000 && cleanStudents.length > 0) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(cleanStudents));
      }
      return cleanStudents;
    } catch (err) {
      console.warn('fetchStudentsFromDB error:', err);
      return null;
    }
  },

  addStudentToDB: async (
    newStudent: Student
  ): Promise<{ success: boolean; student?: Student; message: string }> => {
    const currentStudents = Storage.getStudents();
    if (currentStudents.some((s) => s.studentId === newStudent.studentId)) {
      return {
        success: false,
        message: 'دانشجویی با این شماره دانشجویی قبلاً ثبت شده است.',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok) {
        return {
          success: false,
          message:
            (data as { message?: string })?.message || 'خطا در ثبت دانشجو در دیتابیس ابری',
        };
      }

      const rawReturned = ((data as { student?: Record<string, unknown> })?.student ||
        newStudent) as Record<string, unknown>;
      const { _id, __v, createdAt, updatedAt, ...cleanObj } = rawReturned;
      void _id;
      void __v;
      void createdAt;
      void updatedAt;
      const savedStudent = cleanObj as unknown as Student;

      const updatedStudents = [savedStudent, ...currentStudents];
      set(STORAGE_KEYS.STUDENTS, updatedStudents);
      Storage.addActivityLog({
        category: 'student',
        action: 'ثبت دانشجوی جدید در دیتابیس ابری',
        details: `دانشجو ${savedStudent.fullName} (${savedStudent.studentId}) ثبت شد.`,
        targetName: `${savedStudent.fullName} (${savedStudent.studentId})`,
      });

      return {
        success: true,
        student: savedStudent,
        message:
          (data as { message?: string })?.message ||
          'دانشجو با موفقیت در دیتابیس ابری ثبت شد.',
      };
    } catch (err: unknown) {
      console.warn('addStudentToDB error:', err);
      const isTimeout = err instanceof Error && err.name === 'AbortError';
      return {
        success: false,
        message: isTimeout
          ? 'زمان انتظار پاسخ از سرور ابری به پایان رسید. لطفاً چند لحظه بعد دوباره تلاش نمایید.'
          : 'عدم امکان برقراری ارتباط با سرور ابری (khabgah-api). لطفاً وضعیت سرور بک‌اند در Vercel و اتصال اینترنت را بررسی نمایید.',
      };
    }
  },

  uploadPhotosToCloud: async (
    role: 'student' | 'supervisor' | 'maintenance' | 'warehouse' | 'counselor' | 'finance' | 'procurement',
    items: Array<{ userId: string; dataUrl: string }>
  ): Promise<{
    supported: boolean;
    ok: boolean;
    urls: Record<string, string>;
    errorMessage?: string;
  }> => {
    const validItems = items.filter((it) => it.userId && it.dataUrl);
    if (validItems.length === 0) {
      return { supported: true, ok: true, urls: {} };
    }

    const urls: Record<string, string> = {};
    const chunkSize = 20;

    for (let i = 0; i < validItems.length; i += chunkSize) {
      const chunk = validItems.slice(i, i + chunkSize).map((it) => ({
        role,
        userId: it.userId.trim(),
        dataUrl: it.dataUrl,
      }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      try {
        const res = await fetch(`${API_BASE_URL}/photos/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: chunk }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.status === 404 || res.status === 405) {
          return {
            supported: false,
            ok: false,
            urls: {},
            errorMessage:
              'مسیر ذخیره ابری عکس‌ها (/api/photos/batch) در بک‌اند khabgah-api فعال نیست.',
          };
        }

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          return {
            supported: true,
            ok: false,
            urls,
            errorMessage: `خطای سرور ابری (${res.status}): ${errText || 'خطا در ذخیره عکس‌ها'}`,
          };
        }

        const data = (await res.json().catch(() => ({}))) as {
          urls?: Record<string, string>;
        };
        if (data?.urls && typeof data.urls === 'object') {
          Object.assign(urls, data.urls);
        } else {
          const ts = Date.now();
          chunk.forEach((c) => {
            urls[c.userId] = `${API_BASE_URL}/photo/${encodeURIComponent(role)}/${encodeURIComponent(
              c.userId
            )}?v=${ts}`;
          });
        }
      } catch (err) {
        clearTimeout(timeoutId);
        return {
          supported: true,
          ok: false,
          urls,
          errorMessage:
            err instanceof Error && err.name === 'AbortError'
              ? 'زمان اتصال به سرور ابری برای بارگذاری عکس‌ها به پایان رسید.'
              : 'عدم امکان اتصال به سرور ابری (khabgah-api) هنگام بارگذاری عکس‌ها.',
        };
      }
    }

    return { supported: true, ok: true, urls };
  },

  uploadSinglePhotoToCloud: async (
    role: 'student' | 'supervisor' | 'maintenance' | 'warehouse' | 'counselor' | 'finance' | 'procurement',
    userId: string,
    dataUrl: string
  ): Promise<{ supported: boolean; ok: boolean; url: string; errorMessage?: string }> => {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      return { supported: true, ok: true, url: dataUrl };
    }
    const res = await Storage.uploadPhotosToCloud(role, [{ userId, dataUrl }]);
    return {
      supported: res.supported,
      ok: res.ok,
      url: res.urls[userId.trim()] || dataUrl,
      errorMessage: res.errorMessage,
    };
  },

  waitForPendingCloudSync: async (): Promise<{ success: boolean; failedKeys: string[] }> => {
    const entries = Object.entries(pendingCloudRequests).filter(
      (entry): entry is [string, Promise<boolean>] => Boolean(entry[1])
    );
    if (entries.length === 0) {
      return { success: true, failedKeys: [] };
    }
    const results = await Promise.all(
      entries.map(async ([key, promise]) => ({ key, ok: await promise }))
    );
    const failedKeys = results.filter((r) => !r.ok).map((r) => r.key);
    return { success: failedKeys.length === 0, failedKeys };
  },

  syncAllToCloud: async (): Promise<boolean> => {
    try {
      const posts = SYNCABLE_KEYS.map(async (key) => {
        const raw = localStorage.getItem(key);
        if (!raw) return true;
        const value = JSON.parse(raw);
        keyWriteTimestamps[key] = Date.now();
        const res = await fetch(`${API_BASE_URL}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        });
        return res.ok;
      });
      const results = await Promise.all(posts);
      return results.every(Boolean);
    } catch (err) {
      console.warn('syncAllToCloud error:', err);
      return false;
    }
  },

  syncFromCloud: async (): Promise<boolean> => {
    if (activeSyncPromise) {
      return activeSyncPromise;
    }

    activeSyncPromise = (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      try {
        const [syncResult, studentsResult] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/sync`, { method: 'GET', cache: 'no-store', signal: controller.signal }),
          fetch(`${API_BASE_URL}/students`, { method: 'GET', cache: 'no-store', signal: controller.signal }),
        ]);

        let syncedAny = false;
        let cloudMap: Record<string, unknown> | null = null;

        if (syncResult.status === 'fulfilled' && syncResult.value.ok) {
          const parsed = await syncResult.value.json();
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            cloudMap = parsed as Record<string, unknown>;
            syncedAny = true;

            for (const [key, val] of Object.entries(cloudMap)) {
              if (!SYNCABLE_KEYS.includes(key)) continue;
              if (val === undefined || val === null) continue;
              if (pendingCloudRequests[key]) continue;
              const lastLocalWrite = keyWriteTimestamps[key] || 0;
              if (Date.now() - lastLocalWrite < 5000) continue;
              localStorage.setItem(key, JSON.stringify(val));
            }
          }
        }

        if (studentsResult.status === 'fulfilled' && studentsResult.value.ok) {
          const rawStudents = await studentsResult.value.json();
          if (Array.isArray(rawStudents)) {
            syncedAny = true;
            const lastStudentWrite = keyWriteTimestamps[STORAGE_KEYS.STUDENTS] || 0;
            if (!pendingCloudRequests[STORAGE_KEYS.STUDENTS] && Date.now() - lastStudentWrite >= 5000) {
              const cleanStudents: Student[] = rawStudents.map((item: Record<string, unknown>) =>
                normalizeStudentRecord(item)
              );

              const cloudSyncStudents = cloudMap?.[STORAGE_KEYS.STUDENTS];
              if (!Array.isArray(cloudSyncStudents) && cleanStudents.length > 0) {
                localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(cleanStudents));
              }
            }
          }
        }

        return syncedAny;
      } catch (err) {
        console.warn('syncFromCloud error:', err);
        return false;
      } finally {
        clearTimeout(timeoutId);
        activeSyncPromise = null;
      }
    })();

    return activeSyncPromise;
  },
};





