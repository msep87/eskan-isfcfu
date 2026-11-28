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
  ViceDeanStaff,
  LibraryStaff,
  SmartCampusStaff,
  GraduationStaff,
  AcademicDeputyStaff,
  LibraryBook,
  LibraryBookRequest,
  GraduationClearanceRequest,
  SchedClassroom,
  SchedProgramCohort,
  SchedProfessor,
  SchedEmploymentType,
  SchedProfessorUnitLimit,
  SchedCurriculumCourse,
  SchedCourseOffering,
  SchedMasterGridLayoutSettings,
  SchedMasterPrintSettings,
  SchedRulesSettings,
  SchedCellComment,
} from '../types';
import { DEFAULT_ACADEMIC_DEGREE_LEVELS } from './academicMajors';

export const INITIAL_SETTINGS: AppSettings = {
  selectionActive: true,
  selectionStartDate: '1405/07/01 - 08:00',
  selectionEndDate: '1405/07/15 - 23:59',
  currentAcademicYear: '۱۴۰۵-۱۴۰۶',
  currentSemester: 'نیمسال اول',
  universityName: 'دانشگاه فرهنگیان استان اصفهان',
  announcementBanner: 'سامانه جامع خدمات دانشگاهی دانشگاه فرهنگیان — پیشخوان یکپارچه خدمات آموزشی، برنامه‌ریزی درسی، رفاهی، سراهای دانشجویی، فرهنگی، ورزشی، کتابخانه، مشاوره و هوشمندسازی',
  fontFamily: 'vazir',
  fontSize: 'md',
  fontScale: 100,
  colorTheme: 'turquoise',
  wallpaper: 'pattern-islamic',
  darkMode: false,
  adminPassword: '261',
  studentSecondaryEditEnabled: false,
  academicDegreeLevels: DEFAULT_ACADEMIC_DEGREE_LEVELS,
  approvedMajors: [],
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

// معاونت دانشجویی (کاملاً خالی)
export const INITIAL_VICE_DEAN_STAFF: ViceDeanStaff[] = [];

// مسئولین کتابخانه و پژوهش (کاملاً خالی)
export const INITIAL_LIBRARY_STAFF: LibraryStaff[] = [];

// کاربران واحد هوشمندسازی (کاملاً خالی)
export const INITIAL_SMART_CAMPUS_STAFF: SmartCampusStaff[] = [];

// کارشناسان واحد فارغ‌التحصیلان (کاملاً خالی)
export const INITIAL_GRADUATION_STAFF: GraduationStaff[] = [];

// فهرست کتب موجود کتابخانه (کاملاً خالی)
export const INITIAL_LIBRARY_BOOKS: LibraryBook[] = [];

// درخواست‌ها و سوابق امانت کتاب (کاملاً خالی)
export const INITIAL_LIBRARY_BOOK_REQUESTS: LibraryBookRequest[] = [];

// پرونده‌های تسویه حساب الکترونیک فراغت از تحصیل (کاملاً خالی)
export const INITIAL_GRADUATION_CLEARANCES: GraduationClearanceRequest[] = [];

// کاربران معاونت آموزشی
export const INITIAL_ACADEMIC_DEPUTY_STAFF: AcademicDeputyStaff[] = [];

// داده‌های اولیه برنامه‌ریزی درسی (کلاس‌ها، رشته‌ها/ورودی‌ها، اساتید، دروس، برنامه‌ها)
export const INITIAL_SCHED_CLASSROOMS: SchedClassroom[] = [];
export const INITIAL_SCHED_PROGRAMS: SchedProgramCohort[] = [];
export const INITIAL_SCHED_PROFESSORS: SchedProfessor[] = [];
export const INITIAL_SCHED_COURSES: SchedCurriculumCourse[] = [];
export const INITIAL_SCHED_OFFERINGS: SchedCourseOffering[] = [];
export const INITIAL_SCHED_CELL_COMMENTS: SchedCellComment[] = [];

export const DEFAULT_SCHED_RULES: SchedRulesSettings = {
  activeTerm: '1405-1',
  availableTerms: ['1405-1', '1405-2', '1404-2', '1404-1'],
  hoursPerUnit: {
    theoretical: 1,
    practicalNormalLab: 2,
    practicalWorkshop: 3,
    practicalInternship: 4,
  },
  equivalentPerUnit: {
    theoretical: 1,
    practicalNormalLab: 1.3,
    practicalWorkshop: 1.98,
    practicalInternshipBase: 3,
    internshipMinStudents: 12,
  },
  professorUnitLimits: {
    faculty_member: { minEquivalentUnits: 10, maxEquivalentUnits: 24 },
    mamoor_amoozeshi: { minEquivalentUnits: 0, maxEquivalentUnits: 24 },
    haghol_tadris_ap: { minEquivalentUnits: 0, maxEquivalentUnits: 12 },
    haghol_tadris_free: { minEquivalentUnits: 0, maxEquivalentUnits: 12 },
    staff: { minEquivalentUnits: 0, maxEquivalentUnits: 12 },
    retired: { minEquivalentUnits: 0, maxEquivalentUnits: 12 },
  } as Record<SchedEmploymentType, SchedProfessorUnitLimit>,
  activeDays: ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
  timeSlots: [
    { id: 'slot_1', label: 'سانس اول', startTime: '08:00', endTime: '10:00', order: 1 },
    { id: 'slot_2', label: 'سانس دوم', startTime: '10:00', endTime: '12:00', order: 2 },
    { id: 'slot_3', label: 'سانس سوم', startTime: '12:00', endTime: '14:00', order: 3 },
    { id: 'slot_4', label: 'سانس چهارم', startTime: '14:00', endTime: '16:00', order: 4 },
    { id: 'slot_5', label: 'سانس پنجم', startTime: '16:00', endTime: '18:00', order: 5 },
    { id: 'slot_6', label: 'سانس ششم', startTime: '18:00', endTime: '20:00', order: 6 },
  ],
  examSettings: {
    startDate: '1404/10/20',
    startDayOfWeek: 'saturday',
    daysCount: 12,
    skipFridays: true,
    examDays: [],
    examSlots: [
      { id: 'exam_slot_1', label: 'سانس اول امتحان', startTime: '08:30', endTime: '10:30', order: 1 },
      { id: 'exam_slot_2', label: 'سانس دوم امتحان', startTime: '11:00', endTime: '13:00', order: 2 },
      { id: 'exam_slot_3', label: 'سانس سوم امتحان', startTime: '14:00', endTime: '16:00', order: 3 },
    ],
  },
  examSettingsByTerm: {},
  studentAccessEnabled: false,
  studentAccessScope: 'own_cohort',
  studentPublishedTerms: ['1405-1'],
  programLocks: {
    lockAllChanges: false,
    lockMessage: '',
    lockedMajorCodes: [],
    lockedDays: [],
    lockedSlotIds: [],
    lockedDeptHeadIds: [],
    lockedAcademicDeputyIds: [],
    lockedExpertIds: [],
    blockedViewUserIds: [],
  },
  professorAvailabilityWindow: {
    enabled: false,
    startTime: '00:00',
    endTime: '23:59',
    note: '',
  },
  masterGridLayout: {
    metaColumns: {
      major: { width: 114, headerOrientation: 'horizontal', bodyOrientation: 'horizontal', textFit: 'wrap', textAlign: 'center', verticalAlign: 'middle' },
      entry: { width: 64, headerOrientation: 'horizontal', bodyOrientation: 'horizontal', textFit: 'wrap', textAlign: 'center', verticalAlign: 'middle' },
      totalStudents: { width: 56, headerOrientation: 'horizontal', bodyOrientation: 'horizontal', textFit: 'wrap', textAlign: 'center', verticalAlign: 'middle' },
      section: { width: 104, headerOrientation: 'horizontal', bodyOrientation: 'horizontal', textFit: 'clip', textAlign: 'center', verticalAlign: 'middle' },
    },
    defaultSlotWidth: 168,
    slotWidthsBySlotId: {},
    scheduleCells: {
      headerOrientation: 'horizontal',
      bodyOrientation: 'horizontal',
      textFit: 'wrap',
      textAlign: 'right',
      verticalAlign: 'top',
      compactCards: false,
    },
    columnOverrides: {},
  },
  masterPrintSettings: {
    paperSize: 'A4',
    orientation: 'landscape',
    scalingMode: 'fit_1_page_wide',
    scalePercent: 100,
    fitPagesWide: 1,
    marginsMm: {
      top: 8,
      right: 8,
      bottom: 8,
      left: 8,
    },
    showGridlines: true,
    boldDayBorders: true,
    colorMode: 'color',
    includeColors: true,
    repeatHeaderRows: true,
    avoidRowBreak: true,
    centerHorizontally: true,
    centerVertically: false,
    fontSizePx: 10,
    cellPaddingPx: 4,
    useLayoutWidthsAndOrientations: true,
    includeProfessor: true,
    includeClassroom: true,
    includeExamInfo: true,
    includeSharedTag: true,
    includeComments: false,
    showHeaderBanner: true,
    customTitle: '',
    customSubtitle: '',
    showPrintDate: true,
    showActorName: true,
    footerNote: '',
    showSignatureBlock: false,
    printScope: 'current_view',
  },
};

export const DEFAULT_MASTER_GRID_LAYOUT: SchedMasterGridLayoutSettings =
  DEFAULT_SCHED_RULES.masterGridLayout!;

export const DEFAULT_MASTER_PRINT_SETTINGS: SchedMasterPrintSettings =
  DEFAULT_SCHED_RULES.masterPrintSettings!;


