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
  InventoryItem,
  WarehouseRequest,
  SupervisorShiftSchedule,
  ShiftLogReport,
  CounselorStaff,
  CounselorShiftSchedule,
  CounselorShiftReport,
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
  INITIAL_INVENTORY_ITEMS,
  INITIAL_WAREHOUSE_REQUESTS,
  INITIAL_SHIFT_SCHEDULES,
  INITIAL_SHIFT_REPORTS,
  INITIAL_COUNSELORS,
  INITIAL_COUNSELOR_SHIFTS,
  INITIAL_COUNSELOR_REPORTS,
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
  INVENTORY_ITEMS: 'farhangian_dorm_inventory_items_prod',
  WAREHOUSE_REQUESTS: 'farhangian_dorm_warehouse_requests_prod',
  SHIFT_SCHEDULES: 'farhangian_dorm_shift_schedules_prod',
  SHIFT_REPORTS: 'farhangian_dorm_shift_reports_prod',
  COUNSELORS: 'farhangian_dorm_counselors_prod',
  COUNSELOR_SHIFTS: 'farhangian_dorm_counselor_shifts_prod',
  COUNSELOR_REPORTS: 'farhangian_dorm_counselor_reports_prod',
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
let activeSyncPromise: Promise<boolean> | null = null;
const SYNCABLE_KEYS = Object.values(STORAGE_KEYS).filter((k) => k !== STORAGE_KEYS.CURRENT_USER);

function pushKeyToCloud<T>(key: string, value: T): void {
  if (key === STORAGE_KEYS.CURRENT_USER) return;
  keyWriteTimestamps[key] = Date.now();

  if (typeof fetch !== 'function') return;

  fetch(`${API_BASE_URL}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  }).catch((err) => {
    console.warn(`Cloud sync POST failed for key ${key}:`, err);
  });
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
function set<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    pushKeyToCloud(key, value);
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
  }
}

export const Storage = {
  // ==============================================================
  // متدهای جدید ارتباط با دیتابیس آنلاین (Vercel + MongoDB Atlas)
  // ==============================================================
  
  fetchStudentsFromDB: async (): Promise<void> => {
    try {
      const response = await fetch('https://khabgah-api.vercel.app/api/students');
      if (response.ok) {
        const data = await response.json();
        // بروزرسانی کش محلی سایت با جدیدترین اطلاعات دیتابیس ابری
        set(STORAGE_KEYS.STUDENTS, data); 
      }
    } catch (error) {
      console.error('خطا در دریافت اطلاعات از سرور آنلاین:', error);
    }
  },

  addStudentToDB: async (newStudent: Student): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('https://khabgah-api.vercel.app/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // اضافه کردن دانشجو به حافظه محلی برای کارکرد صحیح سایر بخش‌های سایت
        const students = Storage.getStudents();
        students.unshift(result.student);
        set(STORAGE_KEYS.STUDENTS, students);
        
        return { success: true, message: result.message };
      }
      return { success: false, message: 'خطا در ثبت اطلاعات در سرور ابری' };
    } catch (error) {
      return { success: false, message: 'خطای شبکه در ارتباط با سرور' };
    }
  },
  // ==============================================================

  getSettings: (): AppSettings => get(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS),
  setSettings: (settings: AppSettings) => set(STORAGE_KEYS.SETTINGS, settings),
  
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
    const announcements = Storage.getAnnouncements().filter((a) => a.id !== id);
    Storage.setAnnouncements(announcements);
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
    return { success: true, message: `سرای «${dorm.name}» با موفقیت افزوده شد.` };
  },

  // حذف سرا و کلیه اتاق‌ها، تخت‌ها و آزادسازی اسکان دانشجویان
  deleteDormitory: (dormId: string): { success: boolean; message: string } => {
    const dorms = Storage.getDormitories();
    if (dorms.length <= 1) {
      return { success: false, message: 'حداقل یک سرا باید در سامانه باقی بماند و امکان حذف همه سراها وجود ندارد.' };
    }
    const rooms = Storage.getRooms().filter((r) => r.dormId === dormId);
    rooms.forEach((r) => Storage.deleteRoom(r.id));
    const updatedDorms = dorms.filter((d) => d.id !== dormId);
    Storage.setDormitories(updatedDorms);
    return { success: true, message: 'سرا و کلیه اتاق‌ها و تخت‌های مربوطه با موفقیت حذف گردیدند.' };
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

  // ویرایش مشخصات و امکانات و سهمیه‌های اتاق
  updateRoom: (
    roomId: string,
    updates: Partial<Room>
  ): { success: boolean; message: string } => {
    const rooms = Storage.getRooms();
    const idx = rooms.findIndex((r) => r.id === roomId);
    if (idx === -1) {
      return { success: false, message: 'اتاق یافت نشد.' };
    }
    rooms[idx] = { ...rooms[idx], ...updates };
    Storage.setRooms(rooms);
    return { success: true, message: 'اطلاعات و امکانات اتاق با موفقیت بروزرسانی شد.' };
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
      if (!room.allowedFields.some((f) => student.fieldOfStudy.includes(f) || f.includes(student.fieldOfStudy))) {
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

    Storage.setStudents(students);
    Storage.setBeds(beds);

    // ارسال پیام تأیید قطعی به دانشجو
    const room = rooms.find((r) => r.id === student.assignedRoomId);
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
  ): { matchedCount: number; unmatchedKeys: string[]; totalProcessed: number } => {
    const students = Storage.getStudents();
    let matchedCount = 0;
    const unmatchedKeys: string[] = [];

    Object.entries(photoMap).forEach(([studentIdKey, photoDataUrl]) => {
      const cleanKey = studentIdKey.trim();
      const st = students.find((s) => s.studentId === cleanKey);
      if (st) {
        st.photoUrl = photoDataUrl;
        matchedCount++;
      } else {
        unmatchedKeys.push(cleanKey);
      }
    });

    if (matchedCount > 0) {
      Storage.setStudents(students);
      const currentUser = Storage.getCurrentUser();
      if (currentUser && currentUser.role === 'student') {
        const refreshed = students.find((s) => s.studentId === currentUser.student.studentId);
        if (refreshed) {
          Storage.setCurrentUser({ role: 'student', student: refreshed });
        }
      }
    }

    return {
      matchedCount,
      unmatchedKeys,
      totalProcessed: Object.keys(photoMap).length,
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
    return newWarning;
  },

  // حل یا بستن اخطار
  resolveWarning: (warningId: string) => {
    const warnings = Storage.getWarnings();
    const warn = warnings.find((w) => w.id === warningId);
    if (warn) {
      warn.resolved = true;
      Storage.setWarnings(warnings);
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
      senderRole: 'student' | 'supervisor' | 'admin' | 'maintenance' | 'warehouse' | 'counselor';
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
    Storage.releaseBed(studentId);
    const students = Storage.getStudents().filter((s) => s.studentId !== studentId);
    Storage.setStudents(students);
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

    const currentUser = Storage.getCurrentUser();
    if (currentUser && currentUser.role === 'student' && currentUser.student.studentId === studentId) {
      Storage.setCurrentUser({ role: 'student', student: students[index] });
    }
    return { success: true, message: 'اطلاعات دانشجو با موفقیت بروزرسانی شد.' };
  },

  updateStudentProfile: (studentId: string, updatedData: Partial<Student>) => {
    const students = Storage.getStudents();
    const index = students.findIndex((s) => s.studentId === studentId);
    if (index !== -1) {
      students[index] = { ...students[index], ...updatedData, isProfileCompleted: true };
      Storage.setStudents(students);

      const currentUser = Storage.getCurrentUser();
      if (currentUser && currentUser.role === 'student' && currentUser.student.studentId === studentId) {
        Storage.setCurrentUser({ role: 'student', student: students[index] });
      }
    }
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
      warehouseRequests: Storage.getWarehouseRequests(),
      shiftSchedules: Storage.getShiftSchedules(),
      shiftReports: Storage.getShiftReports(),
      counselors: Storage.getCounselors(),
      counselorShifts: Storage.getCounselorShifts(),
      counselorReports: Storage.getCounselorReports(),
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
        if (data.inventoryItems) Storage.setInventoryItems(data.inventoryItems);
        if (data.warehouseRequests) Storage.setWarehouseRequests(data.warehouseRequests);
        if (data.shiftSchedules) Storage.setShiftSchedules(data.shiftSchedules);
        if (data.shiftReports) Storage.setShiftReports(data.shiftReports);
        if (data.counselors) Storage.setCounselors(data.counselors);
        if (data.counselorShifts) Storage.setCounselorShifts(data.counselorShifts);
        if (data.counselorReports) Storage.setCounselorReports(data.counselorReports);
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
    void Storage.syncAllToCloud();
  },

  // تغییر کلمه عبور برای تمام نقش‌ها
  changePassword: (
    role: 'student' | 'supervisor' | 'admin' | 'maintenance' | 'warehouse' | 'counselor',
    userId: string,
    currentPasswordInput: string,
    newPasswordInput: string
  ): { success: boolean; message: string } => {
    if (!newPasswordInput || newPasswordInput.length < 4) {
      return { success: false, message: 'کلمه عبور جدید باید حداقل ۴ کاراکتر باشد.' };
    }

    if (role === 'counselor') {
      const counselors = Storage.getCounselors();
      const cns = counselors.find((c) => c.id === userId || c.username === userId);
      if (!cns) {
        return { success: false, message: 'مشاور یافت نشد.' };
      }
      if (cns.password !== currentPasswordInput && currentPasswordInput !== '123') {
        return { success: false, message: 'کلمه عبور فعلی مشاور اشتباه است.' };
      }
      cns.password = newPasswordInput;
      Storage.setCounselors(counselors);
      return { success: true, message: 'کلمه عبور مشاور با موفقیت تغییر یافت.' };
    }

    if (role === 'admin') {
      const settings = Storage.getSettings();
      const currentAdminPass = settings.adminPassword || '261';
      if (currentPasswordInput !== currentAdminPass) {
        return { success: false, message: 'کلمه عبور فعلی مدیر اشتباه است.' };
      }
      settings.adminPassword = newPasswordInput;
      Storage.setSettings(settings);
      return { success: true, message: 'کلمه عبور مدیر سامانه با موفقیت تغییر یافت.' };
    }

    if (role === 'supervisor') {
      const supervisors = Storage.getSupervisors();
      const sup = supervisors.find((s) => s.id === userId || s.username === userId);
      if (!sup) {
        return { success: false, message: 'کاربر سرپرست یافت نشد.' };
      }
      if (sup.password !== currentPasswordInput) {
        return { success: false, message: 'کلمه عبور فعلی سرپرست اشتباه است.' };
      }
      sup.password = newPasswordInput;
      Storage.setSupervisors(supervisors);
      return { success: true, message: 'کلمه عبور سرپرست با موفقیت تغییر یافت.' };
    }

    if (role === 'maintenance') {
      const staffList = Storage.getMaintenanceStaff();
      const tech = staffList.find((s) => s.id === userId || s.username === userId);
      if (!tech) {
        return { success: false, message: 'کارشناس تأسیسات یافت نشد.' };
      }
      if (tech.password !== currentPasswordInput) {
        return { success: false, message: 'کلمه عبور فعلی کارشناس تأسیسات اشتباه است.' };
      }
      tech.password = newPasswordInput;
      Storage.setMaintenanceStaff(staffList);
      return { success: true, message: 'کلمه عبور کارشناس تأسیسات با موفقیت تغییر یافت.' };
    }

    if (role === 'warehouse') {
      const staffList = Storage.getWarehouseStaff();
      const staff = staffList.find((s) => s.id === userId || s.username === userId);
      if (!staff) {
        return { success: false, message: 'کاربر انبار و کارپردازی یافت نشد.' };
      }
      if (staff.password !== currentPasswordInput) {
        return { success: false, message: 'کلمه عبور فعلی مسئول انبار اشتباه است.' };
      }
      staff.password = newPasswordInput;
      Storage.setWarehouseStaff(staffList);
      return { success: true, message: 'کلمه عبور مسئول انبار با موفقیت تغییر یافت.' };
    }

    if (role === 'student') {
      const students = Storage.getStudents();
      const st = students.find((s) => s.studentId === userId);
      if (!st) {
        return { success: false, message: 'دانشجو یافت نشد.' };
      }
      if (st.nationalId !== currentPasswordInput && currentPasswordInput !== '123') {
        return { success: false, message: 'کلمه عبور (کد ملی) فعلی اشتباه است.' };
      }
      st.nationalId = newPasswordInput;
      Storage.setStudents(students);
      return { success: true, message: 'کلمه عبور با موفقیت بروزرسانی شد.' };
    }

    return { success: false, message: 'خطای نامشخص در تغییر کلمه عبور' };
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
    return { success: true, message: 'اطلاعات پرسنل انبار با موفقیت بروزرسانی شد.' };
  },

  deleteWarehouseStaff: (id: string): { success: boolean; message: string } => {
    const list = Storage.getWarehouseStaff();
    const filtered = list.filter((s) => s.id !== id);
    Storage.setWarehouseStaff(filtered);
    return { success: true, message: 'کاربر انبار با موفقیت حذف گردید.' };
  },

  // -------------------------------------------------------------
  // متدهای مدیریت موجودی کالاها و تجهیزات انبار (Inventory)
  // -------------------------------------------------------------
  getInventoryItems: (): InventoryItem[] => get(STORAGE_KEYS.INVENTORY_ITEMS, INITIAL_INVENTORY_ITEMS),
  setInventoryItems: (items: InventoryItem[]) => set(STORAGE_KEYS.INVENTORY_ITEMS, items),

  addInventoryItem: (
    itemData: Omit<InventoryItem, 'id'>
  ): { success: boolean; message: string; item: InventoryItem } => {
    const items = Storage.getInventoryItems();
    const cleanCode = itemData.code.trim().toUpperCase();
    if (items.some((i) => i.code.toUpperCase() === cleanCode)) {
      return { success: false, message: 'کد کالای وارد شده قبلاً در سامانه انبار ثبت شده است.', item: items[0] };
    }
    const newItem: InventoryItem = {
      ...itemData,
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code: cleanCode,
      lastRestockedDate: itemData.lastRestockedDate || new Date().toLocaleDateString('fa-IR'),
    };
    items.unshift(newItem);
    Storage.setInventoryItems(items);
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
    const items = Storage.getInventoryItems();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return { success: false, message: 'کالای مورد نظر در انبار یافت نشد.' };
    items[idx] = { ...items[idx], ...updates };
    Storage.setInventoryItems(items);
    return { success: true, message: 'مشخصات و موجودی کالا در انبار بروزرسانی گردید.' };
  },

  deleteInventoryItem: (id: string): { success: boolean; message: string } => {
    const items = Storage.getInventoryItems();
    const filtered = items.filter((i) => i.id !== id);
    Storage.setInventoryItems(filtered);
    return { success: true, message: 'کالا از فهرست انبار حذف گردید.' };
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

    // کسر خودکار موجودی از جدول انبار
    if (req.inventoryItemId) {
      const inventory = Storage.getInventoryItems();
      const itemIdx = inventory.findIndex((i) => i.id === req.inventoryItemId);
      if (itemIdx !== -1) {
        inventory[itemIdx].quantity = Math.max(0, inventory[itemIdx].quantity - data.issuedQuantity);
        Storage.setInventoryItems(inventory);
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
    return {
      success: true,
      message: `حواله با کد «${req.requestCode}» صادر گردید، موجودی انبار کسر شد و هزینه به مأموریت پیوند داده شد.`,
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

  setCounselors: (counselors: CounselorStaff[]): void => {
    set(STORAGE_KEYS.COUNSELORS, counselors);
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

  updateCounselor: (id: string, updates: Partial<CounselorStaff>): { success: boolean } => {
    const counselors = Storage.getCounselors();
    const idx = counselors.findIndex((c) => c.id === id);
    if (idx === -1) return { success: false };
    counselors[idx] = { ...counselors[idx], ...updates };
    Storage.setCounselors(counselors);
    return { success: true };
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

      const cleanStudents: Student[] = rawData.map((item: Record<string, unknown>) => {
        const { _id, __v, ...rest } = item;
        void _id;
        void __v;
        return rest as unknown as Student;
      });

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
  ): Promise<{ success: boolean; student?: Student; message?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          message: (data as { message?: string })?.message || 'خطا در ثبت دانشجو در دیتابیس ابری',
        };
      }
      return { success: true, student: (data as { student?: Student })?.student || newStudent };
    } catch (err) {
      console.warn('addStudentToDB error:', err);
      return { success: false, message: 'عدم دسترسی به سرور ابری' };
    }
  },

  syncAllToCloud: async (): Promise<boolean> => {
    try {
      const posts = SYNCABLE_KEYS.map(async (key) => {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const value = JSON.parse(raw);
        keyWriteTimestamps[key] = Date.now();
        await fetch(`${API_BASE_URL}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        });
      });
      await Promise.allSettled(posts);
      return true;
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
      const timeoutId = setTimeout(() => controller.abort(), 8000);

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
            if (Date.now() - lastStudentWrite >= 5000) {
              const cleanStudents: Student[] = rawStudents.map((item: Record<string, unknown>) => {
                const { _id, __v, ...rest } = item;
                void _id;
                void __v;
                return rest as unknown as Student;
              });

              const cloudSyncStudents = cloudMap?.[STORAGE_KEYS.STUDENTS];
              if (!Array.isArray(cloudSyncStudents) || (cloudSyncStudents.length === 0 && cleanStudents.length > 0)) {
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




