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
  FinanceStaff,
  ProcurementStaff,
  EducationStaff,
  AcademicStatusNotice,
  StudentFinancialRecord,
  InventoryItem,
  InventoryTransaction,
  WarehouseRequest,
  ProcurementRequest,
  SupervisorShiftSchedule,
  ShiftLogReport,
  CounselorStaff,
  CounselorShiftSchedule,
  CounselorShiftReport,
  ActivityLog,
  StudentEvaluation,
  GuestRequest,
  VisitReport,
  PeriodicSurvey,
  SurveyResponse,
  CulturalStaff,
  CulturalProgram,
  CulturalAssociation,
  AssociationMembership,
  StudentAffairsStaff,
  GuildElection,
  GuildElectionVote,
  DisciplinaryReferral,
  SportsProgram,
  SportsRegistration,
  SecurityStaff,
  SecurityReport,
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
  studentSecondaryEditEnabled: false,
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

// کاربران امور مالی و حسابداری (کاملاً خالی)
export const INITIAL_FINANCE_STAFF: FinanceStaff[] = [];

// سوابق مالی، بدهی و کسورات دانشجویان (کاملاً خالی)
export const INITIAL_STUDENT_FINANCES: StudentFinancialRecord[] = [];

// پرسنل کارپردازی و خرید (کاملاً خالی)
export const INITIAL_PROCUREMENT_STAFF: ProcurementStaff[] = [];

// ارجاعات و درخواست‌های خرید کارپردازی (کاملاً خالی)
export const INITIAL_PROCUREMENT_REQUESTS: ProcurementRequest[] = [];

// گردش ورودی و خروجی کالاهای انبار (کاملاً خالی)
export const INITIAL_INVENTORY_TRANSACTIONS: InventoryTransaction[] = [];

// درخواست‌های موافقت با مهمان دانشجویان (کاملاً خالی)
export const INITIAL_GUEST_REQUESTS: GuestRequest[] = [];

// گزارش‌های بازدید سرپرستان از سراها و اتاق‌ها (کاملاً خالی)
export const INITIAL_VISIT_REPORTS: VisitReport[] = [];

// کارشناسان آموزش (کاملاً خالی)
export const INITIAL_EDUCATION_STAFF: EducationStaff[] = [];

// اعلامیه‌های مرخصی تحصیلی و اخراج از کارشناس آموزش به مدیر (کاملاً خالی)
export const INITIAL_ACADEMIC_NOTICES: AcademicStatusNotice[] = [];

// نظرسنجی‌های دوره‌ای رضایت‌سنجی از دانشجویان (کاملاً خالی)
export const INITIAL_SURVEYS: PeriodicSurvey[] = [];

// پاسخ‌های ثبت‌شده دانشجویان در نظرسنجی‌ها (کاملاً خالی)
export const INITIAL_SURVEY_RESPONSES: SurveyResponse[] = [];

// کارشناسان امور فرهنگی (کاملاً خالی)
export const INITIAL_CULTURAL_STAFF: CulturalStaff[] = [];

// برنامه‌های فرهنگی زمان‌بندی شده هفتگی (کاملاً خالی)
export const INITIAL_CULTURAL_PROGRAMS: CulturalProgram[] = [];

// تشکل‌ها و انجمن‌های دانشجویی (کاملاً خالی)
export const INITIAL_CULTURAL_ASSOCIATIONS: CulturalAssociation[] = [];

// درخواست‌ها و سوابق عضویت در تشکل‌ها و انجمن‌ها (کاملاً خالی)
export const INITIAL_ASSOCIATION_MEMBERSHIPS: AssociationMembership[] = [];

// کارشناسان امور دانشجویی و تربیت بدنی (کاملاً خالی)
export const INITIAL_STUDENT_AFFAIRS_STAFF: StudentAffairsStaff[] = [];

// دوره‌های انتخابات شورای صنفی دانشجویان (کاملاً خالی)
export const INITIAL_GUILD_ELECTIONS: GuildElection[] = [];

// آرای ثبت‌شده در انتخابات شورای صنفی (کاملاً خالی)
export const INITIAL_GUILD_ELECTION_VOTES: GuildElectionVote[] = [];

// پرونده‌های معرفی‌شده به شورای انضباطی نزد امور دانشجویی (کاملاً خالی)
export const INITIAL_DISCIPLINARY_REFERRALS: DisciplinaryReferral[] = [];

// برنامه‌های ورزشی و تربیت بدنی (کاملاً خالی)
export const INITIAL_SPORTS_PROGRAMS: SportsProgram[] = [];

// ثبت‌نام و حضور و غیاب دانشجویان در برنامه‌های ورزشی (کاملاً خالی)
export const INITIAL_SPORTS_REGISTRATIONS: SportsRegistration[] = [];

// کارشناسان حراست و انتظامات (کاملاً خالی)
export const INITIAL_SECURITY_STAFF: SecurityStaff[] = [];

// گزارش‌های ارسالی به واحد حراست و انتظامات (کاملاً خالی)
export const INITIAL_SECURITY_REPORTS: SecurityReport[] = [];
