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
  ActivityLog,
  StudentEvaluation,
} from '../types';

export const INITIAL_SETTINGS: AppSettings = {
  selectionActive: true,
  selectionStartDate: '1405/07/01 - 08:00',
  selectionEndDate: '1405/07/15 - 23:59',
  currentAcademicYear: '۱۴۰۵-۱۴۰۶',
  currentSemester: 'نیمسال اول',
  universityName: 'دانشگاه فرهنگیان استان اصفهان',
  announcementBanner: 'سامانه جامع سراهای دانشجویی - ورود به سامانه جهت انتخاب اتاق و خدمات اسکان',
  fontFamily: 'vazir',
  fontSize: 'md',
  fontScale: 100,
  colorTheme: 'turquoise',
  wallpaper: 'pattern-islamic',
  darkMode: false,
  adminPassword: '261',
};

// سراهای دانشجویی اولیه (کاملاً خالی برای نسخه نهایی انتشار)
export const INITIAL_DORMITORIES: Dormitory[] = [];

// سرپرستان خوابگاه اولیه (کاملاً خالی)
export const INITIAL_SUPERVISORS: Supervisor[] = [];

// تولید اتاق‌ها و تخت‌ها (کاملاً خالی)
export function generateInitialRoomsAndBeds(): { rooms: Room[]; beds: Bed[] } {
  return { rooms: [], beds: [] };
}

// دانشجویان اولیه (کاملاً خالی)
export const INITIAL_STUDENTS: Student[] = [];

// اخطارها و تذکرات اولیه (کاملاً خالی)
export const INITIAL_WARNINGS: RoomWarning[] = [];

// اطلاعیه‌ها و بخشنامه‌های اولیه (کاملاً خالی)
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

// پیام‌ها و تیکت‌های اولیه (کاملاً خالی)
export const INITIAL_MESSAGES: Message[] = [];

// کارشناسان و تکنسین‌های تأسیسات (کاملاً خالی)
export const INITIAL_MAINTENANCE_STAFF: MaintenanceStaff[] = [];

// سفارش‌ها و مأموریت‌های تأسیسات (کاملاً خالی)
export const INITIAL_MAINTENANCE_TASKS: MaintenanceTask[] = [];

// پرسنل انبار و کارپردازی (کاملاً خالی)
export const INITIAL_WAREHOUSE_STAFF: WarehouseStaff[] = [];

// اقلام کاتالوگ انبار و قطعات (کاملاً خالی)
export const INITIAL_INVENTORY_ITEMS: InventoryItem[] = [];

// درخواست‌های کالا و حواله انبار (کاملاً خالی)
export const INITIAL_WAREHOUSE_REQUESTS: WarehouseRequest[] = [];

// جدول شیفت‌بندی سرپرستان (کاملاً خالی)
export const INITIAL_SHIFT_SCHEDULES: SupervisorShiftSchedule[] = [];

// دفتر وقایع و گزارشات شیفت سرپرستان (کاملاً خالی)
export const INITIAL_SHIFT_REPORTS: ShiftLogReport[] = [];

// کارشناسان مشاور و روانشناسی (کاملاً خالی)
export const INITIAL_COUNSELORS: CounselorStaff[] = [];

// شیفت‌های کاری مشاوران (کاملاً خالی)
export const INITIAL_COUNSELOR_SHIFTS: CounselorShiftSchedule[] = [];

// گزارشات شیفت مشاوران (کاملاً خالی)
export const INITIAL_COUNSELOR_REPORTS: CounselorShiftReport[] = [];

// لاگ فعالیت‌ها و دسترسی‌های کاربران (کاملاً خالی)
export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];

// تذکرات، اخطارها و نمرات ارزیابی فردی و اتاق دانشجویان (کاملاً خالی)
export const INITIAL_STUDENT_EVALUATIONS: StudentEvaluation[] = [];

