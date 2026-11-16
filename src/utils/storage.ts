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
  EducationStaff,
  AcademicStatusNotice,
  AcademicNoticeType,
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
  VisitReport,
  PeriodicSurvey,
  SurveyResponse,
  SurveyAnswer,
  CulturalStaff,
  CulturalProgram,
  CulturalAssociation,
  AssociationMembership,
  StudentAffairsStaff,
  GuildElection,
  GuildElectionVote,
  DisciplinaryViolationType,
  DisciplinaryReferral,
  DisciplinaryReferralStatus,
  SportsProgram,
  SportsProgramType,
  SportsProgramKind,
  SportsProgramStatus,
  SportsRegistration,
  SportsRegistrationStatus,
  SecurityStaff,
  SecurityReport,
  SecurityReportCategory,
  SecurityReportSeverity,
  SecurityReportStatus,
  SecurityReportStudentSnapshot,
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
  INITIAL_EDUCATION_STAFF,
  INITIAL_ACADEMIC_NOTICES,
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
  INITIAL_VISIT_REPORTS,
  INITIAL_SURVEYS,
  INITIAL_SURVEY_RESPONSES,
  INITIAL_CULTURAL_STAFF,
  INITIAL_CULTURAL_PROGRAMS,
  INITIAL_CULTURAL_ASSOCIATIONS,
  INITIAL_ASSOCIATION_MEMBERSHIPS,
  INITIAL_STUDENT_AFFAIRS_STAFF,
  INITIAL_GUILD_ELECTIONS,
  INITIAL_GUILD_ELECTION_VOTES,
  INITIAL_DISCIPLINARY_REFERRALS,
  INITIAL_SPORTS_PROGRAMS,
  INITIAL_SPORTS_REGISTRATIONS,
  INITIAL_SECURITY_STAFF,
  INITIAL_SECURITY_REPORTS,
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
  EDUCATION_STAFF: 'farhangian_dorm_education_staff_prod',
  ACADEMIC_NOTICES: 'farhangian_dorm_academic_notices_prod',
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
  VISIT_REPORTS: 'farhangian_dorm_visit_reports_prod',
  SURVEYS: 'farhangian_dorm_surveys_prod',
  SURVEY_RESPONSES: 'farhangian_dorm_survey_responses_prod',
  CULTURAL_STAFF: 'farhangian_dorm_cultural_staff_prod',
  CULTURAL_PROGRAMS: 'farhangian_dorm_cultural_programs_prod',
  CULTURAL_ASSOCIATIONS: 'farhangian_dorm_cultural_associations_prod',
  ASSOCIATION_MEMBERSHIPS: 'farhangian_dorm_association_memberships_prod',
  STUDENT_AFFAIRS_STAFF: 'farhangian_dorm_student_affairs_staff_prod',
  GUILD_ELECTIONS: 'farhangian_dorm_guild_elections_prod',
  GUILD_ELECTION_VOTES: 'farhangian_dorm_guild_election_votes_prod',
  DISCIPLINARY_REFERRALS: 'farhangian_dorm_disciplinary_referrals_prod',
  SPORTS_PROGRAMS: 'farhangian_dorm_sports_programs_prod',
  SPORTS_REGISTRATIONS: 'farhangian_dorm_sports_registrations_prod',
  SECURITY_STAFF: 'farhangian_dorm_security_staff_prod',
  SECURITY_REPORTS: 'farhangian_dorm_security_reports_prod',
};

export const SECURITY_REPORT_PRESETS: Array<{
  category: SecurityReportCategory;
  label: string;
  defaultTitle: string;
  defaultDescription: string;
}> = [
  {
    category: 'disciplinary_incident',
    label: 'وقوع تخلف یا حادثه انضباطی و امنیتی',
    defaultTitle: 'گزارش حادثه / تخلف انضباطی جهت بررسی حراست',
    defaultDescription:
      'با احترام، به استحضار واحد محترم حراست و انتظامات می‌رساند مورد انضباطی/امنیتی مرتبط با دانشجو(یان) نامبرده در محدوده سرای دانشجویی مشاهده و ثبت گردیده است. خواهشمند است بررسی و پیگیری حفاظتی لازم معمول گردد.',
  },
  {
    category: 'curfew_entry_exit',
    label: 'تردد غیرمجاز و عدم رعایت ساعت ورود و خروج',
    defaultTitle: 'گزارش تردد خارج از ضوابط و ساعت مقرر سرا',
    defaultDescription:
      'به اطلاع واحد حراست می‌رساند نامبرده(ها) ضوابط ورود و خروج و تردد شبانه سرای دانشجویی را رعایت ننموده‌اند. مراتب جهت ثبت در سوابق و پیگیری انتظامات ارسال می‌گردد.',
  },
  {
    category: 'unauthorized_guest',
    label: 'ورود یا اسکان افراد غیرمجاز و بدون مجوز',
    defaultTitle: 'گزارش حضور یا اسکان مهمان غیرمجاز در سرا',
    defaultDescription:
      'در بررسی‌های انجام‌شده مشخص گردید بدون اخذ مجوز رسمی، فرد غیرساکن در محیط سرا حضور/اسکان یافته است. موضوع جهت بررسی حفاظتی به واحد حراست اعلام می‌گردد.',
  },
  {
    category: 'property_damage_safety',
    label: 'خسارت به اموال عمومی و تأسیسات یا مخاطره ایمنی',
    defaultTitle: 'گزارش خسارت به اموال / تأسیسات و خطر ایمنی سرا',
    defaultDescription:
      'به استحضار می‌رساند آسیب یا دستکاری غیرمجاز در تجهیزات، تأسیسات، قفل‌ها یا اموال عمومی سرا مشاهده شده است که نیازمند بررسی کارشناسی و پیگیری حراست می‌باشد.',
  },
  {
    category: 'conflict_harassment',
    label: 'درگیری، تنش یا سلب آسایش و تهدید امنیت ساکنین',
    defaultTitle: 'گزارش تنش، درگیری یا مزاحمت در سرای دانشجویی',
    defaultDescription:
      'به اطلاع می‌رساند در پی بروز تنش/مزاحمت میان ساکنین و اختلال در آرامش محیط سرا، موضوع جهت وساطت، پیگیری و اتخاذ تدابیر حفاظتی به حراست ارجاع می‌گردد.',
  },
  {
    category: 'facility_security_hazard',
    label: 'موارد حفاظتی، قفل و دوربین‌ها، وسایل خطرناک یا ایمنی',
    defaultTitle: 'گزارش ایمنی و حفاظتی تجهیزات / وسایل پرخطر',
    defaultDescription:
      'گزارش وجود مخاطره ایمنی، استفاده از وسایل برقی/گرمایشی غیرمجاز یا نقص حفاظتی در اتاق/بخش مرتبط جهت اقدام عاجل حراست ارسال می‌شود.',
  },
  {
    category: 'suspicious_activity',
    label: 'موارد مشکوک، گم‌شدن اشیاء یا مسائل نیازمند حراست',
    defaultTitle: 'گزارش مورد مشکوک / مفقودی وسایل در سرای دانشجویی',
    defaultDescription:
      'مورد مشکوک یا گزارش مفقودی/حفاظتی در سرای دانشجویی ثبت شده و جهت بررسی دقیق دوربین‌ها، مستندات و پیگیری به واحد حراست ارسال می‌گردد.',
  },
  {
    category: 'other',
    label: 'سایر گزارش‌های حفاظتی و انتظاماتی',
    defaultTitle: 'گزارش تخصصی به واحد حراست و انتظامات',
    defaultDescription: '',
  },
];

export const DISCIPLINARY_VIOLATION_PRESETS: Array<{
  type: DisciplinaryViolationType;
  label: string;
  defaultText: string;
}> = [
  {
    type: 'curfew_violation',
    label: 'عدم رعایت قوانین و ساعات تردد شبانه',
    defaultText:
      'با احترام، به استحضار می‌رساند نامبرده در تاریخ‌های اخیر علی‌رغم تذکرات قبلی و ابلاغ آیین‌نامه انضباطی سراهای دانشجویی دانشگاه فرهنگیان، ساعت مقرر ورود و خروج شبانه را رعایت ننموده و بدون مجوز قانونی اقدام به تردد خارج از ضوابط کرده است. لذا جهت طرح موضوع و تصمیم‌گیری در جلسه شورای انضباطی به آن واحد محترم معرفی می‌گردد.',
  },
  {
    type: 'disturbing_peace',
    label: 'ایجاد مزاحمت و سلب آسایش هم‌اتاقی‌ها و ساکنین',
    defaultText:
      'با احترام، به استحضار می‌رساند نامبرده بر اساس گزارش‌های مستند سرپرستی و هم‌اتاقی‌ها، با ایجاد سر و صدا در ساعات مطالعه و استراحت یا عدم رعایت حقوق ساکنین موجب سلب آرامش و اختلال در نظم عمومی سرای دانشجویی شده است. خواهشمند است دستور فرمایید پرونده در شورای انضباطی دانشگاه بررسی گردد.',
  },
  {
    type: 'property_damage',
    label: 'تخریب یا آسیب عمدی / بی‌احتیاطی نسبت به اموال و تجهیزات سرا',
    defaultText:
      'با احترام، به استحضار می‌رساند نامبرده در جریان سکونت در سرا، به تجهیزات و اموال عمومی اتاق/خوابگاه خسارت وارد نموده است. مستندات و برآورد فنی خسارت پیوست سوابق بوده و پرونده جهت بررسی جبران خسارت و رسیدگی انضباطی به شورای انضباطی معرفی می‌گردد.',
  },
  {
    type: 'moral_code',
    label: 'عدم رعایت شئونات اخلاقی، تربیتی و منش معلمی',
    defaultText:
      'با احترام، با عنایت به ماهیت شبانه‌روزی دانشگاه فرهنگیان و شأن تربیتی دانشجومعلمان، رفتار نامبرده مغایر با آیین‌نامه انضباطی و موازین اخلاقی محیط سرای دانشجویی گزارش شده است. لذا جهت رسیدگی و تشکیل جلسه شورای انضباطی به واحد امور دانشجویی معرفی می‌گردد.',
  },
  {
    type: 'unauthorized_guest',
    label: 'حضور یا اسکان مهمان غیرمجاز و بدون اخذ مجوز رسمی',
    defaultText:
      'با احترام، به استحضار می‌رساند نامبرده بدون ثبت درخواست و دریافت تأییدیه رسمی سرپرستی سرا، اقدام به ورود یا اسکان فرد غیرمجاز در فضای سرای دانشجویی نموده که مغایر مقررات حفاظتی و انضباطی است. پرونده جهت رسیدگی به شورای انضباطی معرفی می‌شود.',
  },
  {
    type: 'hygiene_neglect',
    label: 'تخلف بهداشتی مکرر و بی‌توجهی به اخطارهای نظافت سرا',
    defaultText:
      'با احترام، نامبرده علی‌رغم ثبت تذکرات مکرر سرپرستی در خصوص رعایت بهداشت فردی و نظافت اجتماعی اتاق، هیچ‌گونه همکاری و اصلاح رفتاری انجام نداده است. لذا جهت تشکیل جلسه بررسی و تذکر انضباطی رسمی به آن شورا معرفی می‌گردد.',
  },
  {
    type: 'other',
    label: 'سایر موارد انضباطی (ثبت متن اختصاصی)',
    defaultText:
      'با احترام، نظر به گزارش و مستندات ثبت‌شده در دفتر وقایع سرای دانشجویی، نامبرده مرتکب تخلف انضباطی گردیده و علی‌رغم تذکر سرپرستی موضوع نیازمند طرح و بررسی در جلسه شورای انضباطی است. مراتب جهت اقدام مقتضی به امور دانشجویی معرفی می‌گردد.',
  },
];


let uniqueIdSeq = 0;
function makeUniqueId(prefix: string): string {
  uniqueIdSeq = (uniqueIdSeq + 1) % 1000000;
  return `${prefix}_${Date.now()}_${uniqueIdSeq}_${Math.random().toString(36).substring(2, 6)}`;
}

// کش درون‌حافظه برای حذف JSON.parse تکراری در حجم بالای داده (با کپی ایمن برای جلوگیری از تداخل ارجاع)
const parsedCache = new Map<string, unknown>();

function cloneValue<T>(val: T): T {
  if (val === null || typeof val !== 'object') return val;
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(val);
    } catch {
      // ادامه به روش JSON در صورت وجود مقدار غیرقابل کلون
    }
  }
  return JSON.parse(JSON.stringify(val)) as T;
}

function safeLocalStorageSet(key: string, serialized: string, parsedValue?: unknown): boolean {
  try {
    localStorage.setItem(key, serialized);
    if (parsedValue !== undefined) {
      parsedCache.set(key, cloneValue(parsedValue));
    } else {
      parsedCache.delete(key);
    }
    return true;
  } catch (e) {
    console.warn(`Failed to write ${key} to localStorage (quota or access):`, e);
    if (parsedValue !== undefined) {
      parsedCache.set(key, cloneValue(parsedValue));
    }
    return false;
  }
}

function setIfMissing(key: string, defaultValue: unknown): void {
  try {
    if (!localStorage.getItem(key)) {
      safeLocalStorageSet(key, JSON.stringify(defaultValue), defaultValue);
    }
  } catch (e) {
    console.warn(`Failed checking/initializing ${key} in localStorage:`, e);
  }
}

// همگام‌سازی کش حافظه در صورت تغییر داده‌ها در تب دیگر مرورگر
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (ev) => {
    if (ev.key === null) {
      parsedCache.clear();
    } else {
      parsedCache.delete(ev.key);
    }
  });
}

// مقداردهی اولیه پایگاه داده درون‌مرورگر
export function initializeStorageIfNeeded(): void {
  setIfMissing(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  setIfMissing(STORAGE_KEYS.DORMITORIES, INITIAL_DORMITORIES);
  setIfMissing(STORAGE_KEYS.SUPERVISORS, INITIAL_SUPERVISORS);
  setIfMissing(STORAGE_KEYS.WARNINGS, INITIAL_WARNINGS);
  setIfMissing(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  setIfMissing(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
  setIfMissing(STORAGE_KEYS.MAINTENANCE_STAFF, INITIAL_MAINTENANCE_STAFF);
  setIfMissing(STORAGE_KEYS.MAINTENANCE_TASKS, INITIAL_MAINTENANCE_TASKS);
  setIfMissing(STORAGE_KEYS.WAREHOUSE_STAFF, INITIAL_WAREHOUSE_STAFF);
  setIfMissing(STORAGE_KEYS.INVENTORY_ITEMS, INITIAL_INVENTORY_ITEMS);
  setIfMissing(STORAGE_KEYS.WAREHOUSE_REQUESTS, INITIAL_WAREHOUSE_REQUESTS);
  setIfMissing(STORAGE_KEYS.SHIFT_SCHEDULES, INITIAL_SHIFT_SCHEDULES);
  setIfMissing(STORAGE_KEYS.SHIFT_REPORTS, INITIAL_SHIFT_REPORTS);
  setIfMissing(STORAGE_KEYS.COUNSELORS, INITIAL_COUNSELORS);
  setIfMissing(STORAGE_KEYS.COUNSELOR_SHIFTS, INITIAL_COUNSELOR_SHIFTS);
  setIfMissing(STORAGE_KEYS.COUNSELOR_REPORTS, INITIAL_COUNSELOR_REPORTS);
  setIfMissing(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
  setIfMissing(STORAGE_KEYS.STUDENT_EVALUATIONS, INITIAL_STUDENT_EVALUATIONS);
  setIfMissing(STORAGE_KEYS.FINANCE_STAFF, INITIAL_FINANCE_STAFF);
  setIfMissing(STORAGE_KEYS.PROCUREMENT_STAFF, INITIAL_PROCUREMENT_STAFF);
  setIfMissing(STORAGE_KEYS.EDUCATION_STAFF, INITIAL_EDUCATION_STAFF);
  setIfMissing(STORAGE_KEYS.ACADEMIC_NOTICES, INITIAL_ACADEMIC_NOTICES);
  setIfMissing(STORAGE_KEYS.STUDENT_FINANCES, INITIAL_STUDENT_FINANCES);
  setIfMissing(STORAGE_KEYS.INVENTORY_TRANSACTIONS, INITIAL_INVENTORY_TRANSACTIONS);
  setIfMissing(STORAGE_KEYS.PROCUREMENT_REQUESTS, INITIAL_PROCUREMENT_REQUESTS);
  setIfMissing(STORAGE_KEYS.GUEST_REQUESTS, INITIAL_GUEST_REQUESTS);
  setIfMissing(STORAGE_KEYS.VISIT_REPORTS, INITIAL_VISIT_REPORTS);
  setIfMissing(STORAGE_KEYS.SURVEYS, INITIAL_SURVEYS);
  setIfMissing(STORAGE_KEYS.SURVEY_RESPONSES, INITIAL_SURVEY_RESPONSES);
  setIfMissing(STORAGE_KEYS.CULTURAL_STAFF, INITIAL_CULTURAL_STAFF);
  setIfMissing(STORAGE_KEYS.CULTURAL_PROGRAMS, INITIAL_CULTURAL_PROGRAMS);
  setIfMissing(STORAGE_KEYS.CULTURAL_ASSOCIATIONS, INITIAL_CULTURAL_ASSOCIATIONS);
  setIfMissing(STORAGE_KEYS.ASSOCIATION_MEMBERSHIPS, INITIAL_ASSOCIATION_MEMBERSHIPS);
  setIfMissing(STORAGE_KEYS.STUDENT_AFFAIRS_STAFF, INITIAL_STUDENT_AFFAIRS_STAFF);
  setIfMissing(STORAGE_KEYS.GUILD_ELECTIONS, INITIAL_GUILD_ELECTIONS);
  setIfMissing(STORAGE_KEYS.GUILD_ELECTION_VOTES, INITIAL_GUILD_ELECTION_VOTES);
  setIfMissing(STORAGE_KEYS.DISCIPLINARY_REFERRALS, INITIAL_DISCIPLINARY_REFERRALS);
  setIfMissing(STORAGE_KEYS.SPORTS_PROGRAMS, INITIAL_SPORTS_PROGRAMS);
  setIfMissing(STORAGE_KEYS.SPORTS_REGISTRATIONS, INITIAL_SPORTS_REGISTRATIONS);
  setIfMissing(STORAGE_KEYS.SECURITY_STAFF, INITIAL_SECURITY_STAFF);
  setIfMissing(STORAGE_KEYS.SECURITY_REPORTS, INITIAL_SECURITY_REPORTS);

  try {
    if (!localStorage.getItem(STORAGE_KEYS.ROOMS) || !localStorage.getItem(STORAGE_KEYS.BEDS)) {
      const { rooms, beds } = generateInitialRoomsAndBeds();
      const bedById = new Map(beds.map((b) => [b.id, b]));

      // همگام‌سازی تخت‌های رزرو شده دانشجویان اولیه
      INITIAL_STUDENTS.forEach((st) => {
        if (st.assignedBedId) {
          const foundBed = bedById.get(st.assignedBedId);
          if (foundBed) {
            foundBed.studentId = st.studentId;
          }
        }
      });

      safeLocalStorageSet(STORAGE_KEYS.ROOMS, JSON.stringify(rooms), rooms);
      safeLocalStorageSet(STORAGE_KEYS.BEDS, JSON.stringify(beds), beds);
    }
  } catch (e) {
    console.warn('Failed initializing rooms/beds:', e);
  }

  setIfMissing(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
}

// مدیریت زمان و وضعیت همگام‌سازی ابری با تجمیع نوشتن‌های پیاپی برای سرعت بیشتر و جلوگیری از تداخل
const keyWriteTimestamps: Record<string, number> = {};
const pendingCloudRequests: Record<string, Promise<boolean> | undefined> = {};
const pendingCloudTimers: Record<string, ReturnType<typeof setTimeout> | undefined> = {};
const pendingCloudValues: Record<string, unknown> = {};
let activeSyncPromise: Promise<boolean> | null = null;
const SYNCABLE_KEYS = Object.values(STORAGE_KEYS).filter((k) => k !== STORAGE_KEYS.CURRENT_USER);
const CLOUD_SYNC_DEBOUNCE_MS = 120;

function flushKeyToCloud(key: string, keepalive = false): void {
  const timer = pendingCloudTimers[key];
  if (timer !== undefined) {
    clearTimeout(timer);
    delete pendingCloudTimers[key];
  }
  if (!(key in pendingCloudValues)) return;

  const value = pendingCloudValues[key];
  delete pendingCloudValues[key];
  keyWriteTimestamps[key] = Date.now();

  if (typeof fetch !== 'function') return;

  let bodyStr: string;
  try {
    bodyStr = JSON.stringify({ key, value });
  } catch {
    return;
  }

  const reqOptions: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: bodyStr,
  };
  if (keepalive && bodyStr.length < 60000) {
    reqOptions.keepalive = true;
  }

  const reqPromise = fetch(`${API_BASE_URL}/sync`, reqOptions)
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

function flushAllPendingCloudTimers(keepalive = false): void {
  const keys = Object.keys(pendingCloudValues);
  keys.forEach((k) => flushKeyToCloud(k, keepalive));
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('beforeunload', () => {
    flushAllPendingCloudTimers(true);
  });
}

function pushKeyToCloud<T>(key: string, value: T): void {
  if (key === STORAGE_KEYS.CURRENT_USER) return;
  keyWriteTimestamps[key] = Date.now();
  pendingCloudValues[key] = value;

  if (typeof fetch !== 'function') {
    delete pendingCloudValues[key];
    return;
  }

  const prevTimer = pendingCloudTimers[key];
  if (prevTimer !== undefined) {
    clearTimeout(prevTimer);
  }
  pendingCloudTimers[key] = setTimeout(() => {
    flushKeyToCloud(key);
  }, CLOUD_SYNC_DEBOUNCE_MS);
}

function normalizeLookupKey(raw: string | number | null | undefined): string {
  return String(raw ?? '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .trim()
    .toLowerCase();
}

export function normalizeAsciiDigits(raw: string | number | null | undefined): string {
  return String(raw ?? '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .trim();
}

export function normalizePersianSearch(raw: string | number | null | undefined): string {
  return normalizeAsciiDigits(raw)
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[ۀة]/g, 'ه')
    .replace(/\u200c/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function doesStudentMatchMessage(student: Student, msg: Message): boolean {
  const sid = normalizeAsciiDigits(student.studentId);
  if (sid && (normalizeAsciiDigits(msg.senderId) === sid || normalizeAsciiDigits(msg.receiverId) === sid)) {
    return true;
  }
  if (msg.receiverType === 'student') {
    if (msg.targetScope === 'field' && msg.targetFieldOfStudy) {
      return (
        normalizePersianSearch(msg.targetFieldOfStudy) !== '' &&
        normalizePersianSearch(msg.targetFieldOfStudy) === normalizePersianSearch(student.fieldOfStudy)
      );
    }
    if (msg.targetScope === 'entry_term' && msg.targetEntryTerm) {
      return (
        normalizeAsciiDigits(msg.targetEntryTerm) !== '' &&
        normalizeAsciiDigits(msg.targetEntryTerm) === normalizeAsciiDigits(student.entryTerm)
      );
    }
  }
  return false;
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
    password: r.password ? String(r.password) : undefined,
    isProfileCompleted: Boolean(r.isProfileCompleted),
    assignmentStatus: r.assignmentStatus || 'none',
  };
}

// تابع کمکی برای خواندن از کش حافظه و localStorage
function get<T>(key: string, defaultValue: T): T {
  try {
    if (parsedCache.has(key)) {
      return cloneValue(parsedCache.get(key) as T);
    }
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    const parsed = JSON.parse(item) as T;
    parsedCache.set(key, cloneValue(parsed));
    return parsed;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return defaultValue;
  }
}

// تابع کمکی برای نوشتن در localStorage و ارسال غیرهمگام تجمیع‌شده به سرور ابری
function set<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value);
    const written = safeLocalStorageSet(key, serialized, value);
    pushKeyToCloud(key, value);
    return written;
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

  // حذف سرا و کلیه اتاق‌ها، تخت‌ها و آزادسازی اسکان دانشجویان به صورت یکجا
  deleteDormitory: (dormId: string): { success: boolean; message: string } => {
    const dorms = Storage.getDormitories();
    if (dorms.length <= 1) {
      return { success: false, message: 'حداقل یک سرا باید در سامانه باقی بماند و امکان حذف همه سراها وجود ندارد.' };
    }
    const targetDorm = dorms.find((d) => d.id === dormId);
    const rooms = Storage.getRooms();
    const beds = Storage.getBeds();
    const students = Storage.getStudents();

    const deletedRoomIds = new Set(rooms.filter((r) => r.dormId === dormId).map((r) => r.id));
    const affectedStudentIds = new Set<string>();
    beds.forEach((b) => {
      if ((b.dormId === dormId || deletedRoomIds.has(b.roomId)) && b.studentId) {
        affectedStudentIds.add(b.studentId);
      }
    });

    let stChanged = false;
    students.forEach((st) => {
      if (
        affectedStudentIds.has(st.studentId) ||
        st.assignedDormId === dormId ||
        (st.assignedRoomId && deletedRoomIds.has(st.assignedRoomId))
      ) {
        st.assignedDormId = undefined;
        st.assignedDormName = undefined;
        st.assignedRoomId = undefined;
        st.assignedRoomNumber = undefined;
        st.assignedBedId = undefined;
        st.assignmentStatus = 'none';
        stChanged = true;
      }
    });

    const updatedBeds = beds.filter((b) => b.dormId !== dormId && !deletedRoomIds.has(b.roomId));
    const updatedRooms = rooms.filter((r) => r.dormId !== dormId);
    const updatedDorms = dorms.filter((d) => d.id !== dormId);

    if (stChanged) {
      Storage.setStudents(students);
    }
    Storage.setBeds(updatedBeds);
    Storage.setRooms(updatedRooms);
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

      const guestReqs = Storage.getGuestRequests();
      let grChanged = false;
      guestReqs.forEach((gr) => {
        if (gr.dormId === dormId) {
          gr.dormName = cleanName;
          grChanged = true;
        }
      });
      if (grChanged) Storage.setGuestRequests(guestReqs);

      const visitReports = Storage.getVisitReports();
      let vrChanged = false;
      visitReports.forEach((vr) => {
        if (vr.dormId === dormId) {
          vr.dormName = cleanName;
          vrChanged = true;
        }
      });
      if (vrChanged) Storage.setVisitReports(visitReports);

      const culturalPrograms = Storage.getCulturalPrograms();
      let cpChanged = false;
      culturalPrograms.forEach((cp) => {
        if (cp.dormId === dormId) {
          cp.dormName = cleanName;
          cpChanged = true;
        }
      });
      if (cpChanged) Storage.setCulturalPrograms(culturalPrograms);

      const culturalAssocs = Storage.getCulturalAssociations();
      let caChanged = false;
      culturalAssocs.forEach((ca) => {
        if (ca.dormId === dormId) {
          ca.dormName = cleanName;
          caChanged = true;
        }
      });
      if (caChanged) Storage.setCulturalAssociations(culturalAssocs);

      const discRefs = Storage.getDisciplinaryReferrals();
      let drChanged = false;
      discRefs.forEach((dr) => {
        if (dr.dormId === dormId) {
          dr.dormName = cleanName;
          drChanged = true;
        }
      });
      if (drChanged) Storage.setDisciplinaryReferrals(discRefs);

      const sportsPrograms = Storage.getSportsPrograms();
      let spChanged = false;
      sportsPrograms.forEach((sp) => {
        if (sp.dormId === dormId) {
          sp.dormName = cleanName;
          spChanged = true;
        }
      });
      if (spChanged) Storage.setSportsPrograms(sportsPrograms);
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

      const discRefs = Storage.getDisciplinaryReferrals();
      let drChanged = false;
      discRefs.forEach((dr) => {
        if (dr.roomId === roomId) {
          dr.roomNumber = cleanRoomNumber;
          drChanged = true;
        }
      });
      if (drChanged) Storage.setDisciplinaryReferrals(discRefs);

      const guestReqs = Storage.getGuestRequests();
      let grChanged = false;
      guestReqs.forEach((gr) => {
        if (gr.roomId === roomId) {
          gr.roomNumber = cleanRoomNumber;
          grChanged = true;
        }
      });
      if (grChanged) Storage.setGuestRequests(guestReqs);

      const visitReports = Storage.getVisitReports();
      let vrChanged = false;
      visitReports.forEach((vr) => {
        if (vr.roomId === roomId) {
          vr.roomNumber = cleanRoomNumber;
          vrChanged = true;
        }
      });
      if (vrChanged) Storage.setVisitReports(visitReports);

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

    const occupantIds = new Set<string>();
    beds.forEach((b) => {
      if (b.roomId === roomId && b.studentId) {
        occupantIds.add(b.studentId);
      }
    });

    // آزادسازی دانشجویان ساکن در این اتاق
    let stChanged = false;
    students.forEach((st) => {
      if (occupantIds.has(st.studentId) || st.assignedRoomId === roomId) {
        st.assignedDormId = undefined;
        st.assignedDormName = undefined;
        st.assignedRoomId = undefined;
        st.assignedRoomNumber = undefined;
        st.assignedBedId = undefined;
        st.assignmentStatus = 'none';
        stChanged = true;
      }
    });

    const updatedBeds = beds.filter((b) => b.roomId !== roomId);
    const updatedRooms = rooms.filter((r) => r.id !== roomId);

    if (stChanged) {
      Storage.setStudents(students);
    }
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
    const dorms = Storage.getDormitories();

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
    const dorm = dorms.find((d) => d.id === targetBed.dormId);

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
    student.assignedDormName = dorm?.name;
    student.assignedRoomId = targetBed.roomId;
    student.assignedRoomNumber = room?.roomNumber;
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
      id: makeUniqueId('msg_sys_confirm'),
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
          id: makeUniqueId(`msg_sys_bulk_${s.studentId}`),
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
    student.assignedDormName = undefined;
    student.assignedRoomId = undefined;
    student.assignedRoomNumber = undefined;
    student.assignedBedId = undefined;
    student.assignmentStatus = 'none';

    // پیام به دانشجو
    const messages = Storage.getMessages();
    messages.unshift({
      id: makeUniqueId('msg_sys_reject'),
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
      student.assignedDormName = undefined;
      student.assignedRoomId = undefined;
      student.assignedRoomNumber = undefined;
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
        id: makeUniqueId('msg_sys_move'),
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
    const studentByNormId = new Map<string, Student>();
    students.forEach((s) => {
      const key = normalizeLookupKey(s.studentId);
      if (key && !studentByNormId.has(key)) studentByNormId.set(key, s);
    });

    let matchedCount = 0;
    const unmatchedKeys: string[] = [];

    Object.entries(photoMap).forEach(([studentIdKey, photoDataUrl]) => {
      const cleanKey = normalizeLookupKey(studentIdKey);
      const digitMatch = cleanKey.match(/\d+/)?.[0] || cleanKey;
      const st = studentByNormId.get(cleanKey) || studentByNormId.get(digitMatch);
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
    role: 'supervisor' | 'maintenance' | 'warehouse' | 'counselor' | 'finance' | 'procurement' | 'education' | 'cultural' | 'student_affairs' | 'security',
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
    } else if (role === 'education') {
      const list = Storage.getEducationStaff();
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
        saved = Storage.setEducationStaff(list);
        const cu = Storage.getCurrentUser();
        if (saved && cu && cu.role === 'education') {
          const ref = list.find((e) => e.id === cu.staff.id);
          if (ref) Storage.setCurrentUser({ role: 'education', staff: ref });
        }
      }
    } else if (role === 'cultural') {
      const list = Storage.getCulturalStaff();
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
        saved = Storage.setCulturalStaff(list);
        const cu = Storage.getCurrentUser();
        if (saved && cu && cu.role === 'cultural') {
          const ref = list.find((c) => c.id === cu.staff.id);
          if (ref) Storage.setCurrentUser({ role: 'cultural', staff: ref });
        }
      }
    } else if (role === 'student_affairs') {
      const list = Storage.getStudentAffairsStaff();
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
        saved = Storage.setStudentAffairsStaff(list);
        const cu = Storage.getCurrentUser();
        if (saved && cu && cu.role === 'student_affairs') {
          const ref = list.find((sa) => sa.id === cu.staff.id);
          if (ref) Storage.setCurrentUser({ role: 'student_affairs', staff: ref });
        }
      }
    } else if (role === 'security') {
      const list = Storage.getSecurityStaff();
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
        saved = Storage.setSecurityStaff(list);
        const cu = Storage.getCurrentUser();
        if (saved && cu && cu.role === 'security') {
          const ref = list.find((sec) => sec.id === cu.staff.id);
          if (ref) Storage.setCurrentUser({ role: 'security', staff: ref });
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
        education: 'کارشناسان آموزش',
        cultural: 'کارشناسان امور فرهنگی',
        student_affairs: 'کارشناسان امور دانشجویی و تربیت بدنی',
        security: 'کارشناسان حراست و انتظامات',
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
      id: makeUniqueId('warn'),
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
      id: makeUniqueId('msg'),
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
      senderRole: 'student' | 'supervisor' | 'admin' | 'maintenance' | 'warehouse' | 'counselor' | 'finance' | 'procurement' | 'education' | 'cultural' | 'student_affairs' | 'security';
      content: string;
      date: string;
    }
  ): { success: boolean } => {
    const messages = Storage.getMessages();
    const msg = messages.find((m) => m.id === messageId);
    if (msg) {
      msg.replies.push({
        ...reply,
        id: makeUniqueId('rep'),
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

  // ویرایش اطلاعات دانشجو توسط مدیر (پشتیبانی از تغییر کلیه فیلدها از جمله شماره دانشجویی)
  updateStudentAdmin: (studentId: string, updatedData: Partial<Student>): { success: boolean; message: string } => {
    const students = Storage.getStudents();
    const index = students.findIndex((s) => s.studentId === studentId);
    if (index === -1) {
      return { success: false, message: 'دانشجو یافت نشد.' };
    }

    const nextStudentId =
      updatedData.studentId !== undefined ? updatedData.studentId.trim() : studentId;
    if (!nextStudentId) {
      return { success: false, message: 'شماره دانشجویی نمی‌تواند خالی باشد.' };
    }

    const isStudentIdChanged = nextStudentId !== studentId;
    if (
      isStudentIdChanged &&
      students.some((s, i) => i !== index && s.studentId.trim() === nextStudentId)
    ) {
      return { success: false, message: `شماره دانشجویی «${nextStudentId}» قبلاً برای دانشجوی دیگری ثبت شده است.` };
    }

    const updatedStudent: Student = {
      ...students[index],
      ...updatedData,
      studentId: nextStudentId,
    };
    students[index] = updatedStudent;
    Storage.setStudents(students);

    // همگام‌سازی وضعیت تخت یا شماره دانشجویی در ارجاعات مرتبط
    if (isStudentIdChanged || updatedData.assignmentStatus !== undefined) {
      const beds = Storage.getBeds();
      let bedsChanged = false;
      const nextBeds = beds.map((b) => {
        if (b.studentId === studentId) {
          bedsChanged = true;
          return {
            ...b,
            studentId: nextStudentId,
            assignmentStatus:
              updatedData.assignmentStatus !== undefined
                ? updatedData.assignmentStatus
                : b.assignmentStatus,
          };
        }
        return b;
      });
      if (bedsChanged) Storage.setBeds(nextBeds);
    }

    if (isStudentIdChanged) {
      const rooms = Storage.getRooms();
      let roomsChanged = false;
      const nextRooms = rooms.map((r) => {
        if (r.representativeStudentId === studentId) {
          roomsChanged = true;
          return { ...r, representativeStudentId: nextStudentId };
        }
        return r;
      });
      if (roomsChanged) Storage.setRooms(nextRooms);

      const finances = Storage.getStudentFinances();
      let finChanged = false;
      const nextFinances = finances.map((f) => {
        if (f.studentId === studentId) {
          finChanged = true;
          return { ...f, studentId: nextStudentId };
        }
        return f;
      });
      if (finChanged) Storage.setStudentFinances(nextFinances);

      const evals = Storage.getStudentEvaluations();
      let evalChanged = false;
      const nextEvals = evals.map((ev) => {
        if (ev.studentId === studentId) {
          evalChanged = true;
          return { ...ev, studentId: nextStudentId };
        }
        return ev;
      });
      if (evalChanged) Storage.setStudentEvaluations(nextEvals);

      const guests = Storage.getGuestRequests();
      let guestChanged = false;
      const nextGuests = guests.map((g) => {
        if (g.studentId === studentId) {
          guestChanged = true;
          return { ...g, studentId: nextStudentId };
        }
        return g;
      });
      if (guestChanged) Storage.setGuestRequests(nextGuests);

      const msgs = Storage.getMessages();
      let msgChanged = false;
      const nextMsgs = msgs.map((m) => {
        if (m.senderId === studentId || m.receiverId === studentId) {
          msgChanged = true;
          return {
            ...m,
            senderId: m.senderId === studentId ? nextStudentId : m.senderId,
            receiverId: m.receiverId === studentId ? nextStudentId : m.receiverId,
          };
        }
        return m;
      });
      if (msgChanged) Storage.setMessages(nextMsgs);

      const mTasks = Storage.getMaintenanceTasks();
      let taskChanged = false;
      const nextTasks = mTasks.map((t) => {
        if (t.sourceStudentId === studentId) {
          taskChanged = true;
          return { ...t, sourceStudentId: nextStudentId };
        }
        return t;
      });
      if (taskChanged) Storage.setMaintenanceTasks(nextTasks);

      const academicNotices = Storage.getAcademicNotices();
      let anChanged = false;
      academicNotices.forEach((n) => {
        if (n.studentId === studentId) {
          n.studentId = nextStudentId;
          anChanged = true;
        }
      });
      if (anChanged) Storage.setAcademicNotices(academicNotices);

      const surveyResponses = Storage.getSurveyResponses();
      let srChanged = false;
      surveyResponses.forEach((r) => {
        if (r.studentId === studentId) {
          r.studentId = nextStudentId;
          srChanged = true;
        }
      });
      if (srChanged) Storage.setSurveyResponses(surveyResponses);

      const assocMemberships = Storage.getAssociationMemberships();
      let amChanged = false;
      assocMemberships.forEach((m) => {
        if (m.studentId === studentId) {
          m.studentId = nextStudentId;
          amChanged = true;
        }
      });
      if (amChanged) Storage.setAssociationMemberships(assocMemberships);

      const electionVotes = Storage.getGuildElectionVotes();
      let evChanged = false;
      electionVotes.forEach((v) => {
        if (v.studentId === studentId) {
          v.studentId = nextStudentId;
          evChanged = true;
        }
      });
      if (evChanged) Storage.setGuildElectionVotes(electionVotes);

      const discRefs = Storage.getDisciplinaryReferrals();
      let drChanged = false;
      discRefs.forEach((d) => {
        if (d.studentId === studentId) {
          d.studentId = nextStudentId;
          drChanged = true;
        }
      });
      if (drChanged) Storage.setDisciplinaryReferrals(discRefs);

      const sportsRegs = Storage.getSportsRegistrations();
      let spRegChanged = false;
      sportsRegs.forEach((reg) => {
        if (reg.studentId === studentId) {
          reg.studentId = nextStudentId;
          spRegChanged = true;
        }
      });
      if (spRegChanged) Storage.setSportsRegistrations(sportsRegs);
    }

    Storage.addActivityLog({
      category: 'student',
      action: 'ویرایش اطلاعات دانشجو',
      details: isStudentIdChanged
        ? `مشخصات دانشجو ${updatedStudent.fullName} (تغییر کد از ${studentId} به ${nextStudentId}) ویرایش شد.`
        : `مشخصات دانشجو ${updatedStudent.fullName} (${nextStudentId}) ویرایش شد.`,
      targetName: `${updatedStudent.fullName} (${nextStudentId})`,
    });

    const currentUser = Storage.getCurrentUser();
    if (currentUser && currentUser.role === 'student' && currentUser.student.studentId === studentId) {
      Storage.setCurrentUser({ role: 'student', student: updatedStudent });
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
      educationStaff: Storage.getEducationStaff(),
      academicNotices: Storage.getAcademicNotices(),
      guestRequests: Storage.getGuestRequests(),
      visitReports: Storage.getVisitReports(),
      surveys: Storage.getSurveys(),
      surveyResponses: Storage.getSurveyResponses(),
      culturalStaff: Storage.getCulturalStaff(),
      culturalPrograms: Storage.getCulturalPrograms(),
      culturalAssociations: Storage.getCulturalAssociations(),
      associationMemberships: Storage.getAssociationMemberships(),
      studentAffairsStaff: Storage.getStudentAffairsStaff(),
      guildElections: Storage.getGuildElections(),
      guildElectionVotes: Storage.getGuildElectionVotes(),
      disciplinaryReferrals: Storage.getDisciplinaryReferrals(),
      sportsPrograms: Storage.getSportsPrograms(),
      sportsRegistrations: Storage.getSportsRegistrations(),
      securityStaff: Storage.getSecurityStaff(),
      securityReports: Storage.getSecurityReports(),
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

  // بازیابی نسخه پشتیبان از فایل JSON (همراه با اعتبارسنجی ساختار و حذف کلیدهای مخرب)
  importBackupJson: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString, (key, value) =>
        key === '__proto__' || key === 'constructor' || key === 'prototype' ? undefined : value
      );
      if (
        !data ||
        typeof data !== 'object' ||
        Array.isArray(data) ||
        !Array.isArray(data.students) ||
        !Array.isArray(data.rooms) ||
        !Array.isArray(data.beds)
      ) {
        return false;
      }

      if (data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)) {
        Storage.setSettings(data.settings);
      }
      if (Array.isArray(data.dormitories)) Storage.setDormitories(data.dormitories);
      Storage.setRooms(data.rooms);
      Storage.setBeds(data.beds);
      Storage.setStudents(
        data.students
          .filter((s: unknown): s is Record<string, unknown> => Boolean(s && typeof s === 'object'))
          .map((s: Record<string, unknown>) => normalizeStudentRecord(s))
      );
      if (Array.isArray(data.supervisors)) Storage.setSupervisors(data.supervisors);
      if (Array.isArray(data.warnings)) Storage.setWarnings(data.warnings);
      if (Array.isArray(data.announcements)) Storage.setAnnouncements(data.announcements);
      if (Array.isArray(data.messages)) Storage.setMessages(data.messages);
      if (Array.isArray(data.maintenanceStaff)) Storage.setMaintenanceStaff(data.maintenanceStaff);
      if (Array.isArray(data.maintenanceTasks)) Storage.setMaintenanceTasks(data.maintenanceTasks);
      if (Array.isArray(data.warehouseStaff)) Storage.setWarehouseStaff(data.warehouseStaff);
      if (Array.isArray(data.inventoryItems)) set(STORAGE_KEYS.INVENTORY_ITEMS, data.inventoryItems);
      if (Array.isArray(data.inventoryTransactions)) Storage.setInventoryTransactions(data.inventoryTransactions);
      if (Array.isArray(data.warehouseRequests)) Storage.setWarehouseRequests(data.warehouseRequests);
      if (Array.isArray(data.procurementStaff)) Storage.setProcurementStaff(data.procurementStaff);
      if (Array.isArray(data.procurementRequests)) Storage.setProcurementRequests(data.procurementRequests);
      if (Array.isArray(data.shiftSchedules)) Storage.setShiftSchedules(data.shiftSchedules);
      if (Array.isArray(data.shiftReports)) Storage.setShiftReports(data.shiftReports);
      if (Array.isArray(data.counselors)) Storage.setCounselors(data.counselors);
      if (Array.isArray(data.counselorShifts)) Storage.setCounselorShifts(data.counselorShifts);
      if (Array.isArray(data.counselorReports)) Storage.setCounselorReports(data.counselorReports);
      if (Array.isArray(data.activityLogs)) Storage.setActivityLogs(data.activityLogs);
      if (Array.isArray(data.studentEvaluations)) Storage.setStudentEvaluations(data.studentEvaluations);
      if (Array.isArray(data.financeStaff)) Storage.setFinanceStaff(data.financeStaff);
      if (Array.isArray(data.studentFinances)) Storage.setStudentFinances(data.studentFinances);
      if (Array.isArray(data.educationStaff)) Storage.setEducationStaff(data.educationStaff);
      if (Array.isArray(data.academicNotices)) Storage.setAcademicNotices(data.academicNotices);
      if (Array.isArray(data.guestRequests)) Storage.setGuestRequests(data.guestRequests);
      if (Array.isArray(data.visitReports)) Storage.setVisitReports(data.visitReports);
      if (Array.isArray(data.surveys)) Storage.setSurveys(data.surveys);
      if (Array.isArray(data.surveyResponses)) Storage.setSurveyResponses(data.surveyResponses);
      if (Array.isArray(data.culturalStaff)) Storage.setCulturalStaff(data.culturalStaff);
      if (Array.isArray(data.culturalPrograms)) Storage.setCulturalPrograms(data.culturalPrograms);
      if (Array.isArray(data.culturalAssociations)) Storage.setCulturalAssociations(data.culturalAssociations);
      if (Array.isArray(data.associationMemberships)) Storage.setAssociationMemberships(data.associationMemberships);
      if (Array.isArray(data.studentAffairsStaff)) Storage.setStudentAffairsStaff(data.studentAffairsStaff);
      if (Array.isArray(data.guildElections)) Storage.setGuildElections(data.guildElections);
      if (Array.isArray(data.guildElectionVotes)) Storage.setGuildElectionVotes(data.guildElectionVotes);
      if (Array.isArray(data.disciplinaryReferrals)) Storage.setDisciplinaryReferrals(data.disciplinaryReferrals);
      if (Array.isArray(data.sportsPrograms)) Storage.setSportsPrograms(data.sportsPrograms);
      if (Array.isArray(data.sportsRegistrations)) Storage.setSportsRegistrations(data.sportsRegistrations);
      if (Array.isArray(data.securityStaff)) Storage.setSecurityStaff(data.securityStaff);
      if (Array.isArray(data.securityReports)) Storage.setSecurityReports(data.securityReports);

      Storage.addActivityLog({
        category: 'backup',
        action: 'بازیابی نسخه پشتیبان JSON',
        details: 'فایل پشتیبان اطلاعات سامانه با موفقیت بازیابی شد.',
        severity: 'warning',
      });
      return true;
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
    const normalizedUpdates = { ...updates };
    if (normalizedUpdates.username !== undefined) {
      const cleanU = normalizedUpdates.username.trim().toLowerCase();
      if (!cleanU) return { success: false, message: 'نام کاربری نمی‌تواند خالی باشد.' };
      if (list.some((s) => s.id !== id && s.username.trim().toLowerCase() === cleanU)) {
        return { success: false, message: 'این نام کاربری قبلاً برای کارشناس تأسیسات دیگری ثبت شده است.' };
      }
      normalizedUpdates.username = cleanU;
    }
    list[idx] = { ...list[idx], ...normalizedUpdates };
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
          id: makeUniqueId('rep_done'),
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
        id: makeUniqueId('rep_auto_maint'),
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
    Object.keys(pendingCloudTimers).forEach((k) => {
      const t = pendingCloudTimers[k];
      if (t !== undefined) clearTimeout(t);
      delete pendingCloudTimers[k];
      delete pendingCloudValues[k];
    });
    parsedCache.clear();
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
    role: 'student' | 'supervisor' | 'admin' | 'maintenance' | 'warehouse' | 'counselor' | 'finance' | 'procurement' | 'education' | 'cultural' | 'student_affairs' | 'security',
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

    if (role === 'education') {
      const staffList = Storage.getEducationStaff();
      const staff = staffList.find((s) => s.id === userId || s.username === userId);
      if (!staff) {
        return { success: false, message: 'کارشناس آموزش یافت نشد.' };
      }
      if (normalizeDigits(staff.password) !== cleanCurrentPass) {
        return { success: false, message: 'کلمه عبور فعلی کارشناس آموزش اشتباه است.' };
      }
      staff.password = cleanNewPass;
      Storage.setEducationStaff(staffList);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر کلمه عبور کارشناس آموزش',
        details: `کلمه عبور کارشناس آموزش ${staff.fullName} تغییر یافت.`,
        targetName: staff.fullName,
      });
      return { success: true, message: 'کلمه عبور کارشناس آموزش با موفقیت تغییر یافت.' };
    }

    if (role === 'cultural') {
      const staffList = Storage.getCulturalStaff();
      const staff = staffList.find((s) => s.id === userId || s.username === userId);
      if (!staff) {
        return { success: false, message: 'کاربر امور فرهنگی یافت نشد.' };
      }
      if (normalizeDigits(staff.password) !== cleanCurrentPass) {
        return { success: false, message: 'کلمه عبور فعلی کاربر امور فرهنگی اشتباه است.' };
      }
      staff.password = cleanNewPass;
      Storage.setCulturalStaff(staffList);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر کلمه عبور امور فرهنگی',
        details: `کلمه عبور کارشناس امور فرهنگی ${staff.fullName} تغییر یافت.`,
        targetName: staff.fullName,
      });
      return { success: true, message: 'کلمه عبور امور فرهنگی با موفقیت تغییر یافت.' };
    }

    if (role === 'student_affairs') {
      const staffList = Storage.getStudentAffairsStaff();
      const staff = staffList.find((s) => s.id === userId || s.username === userId);
      if (!staff) {
        return { success: false, message: 'کاربر امور دانشجویی یافت نشد.' };
      }
      if (normalizeDigits(staff.password) !== cleanCurrentPass) {
        return { success: false, message: 'کلمه عبور فعلی امور دانشجویی اشتباه است.' };
      }
      staff.password = cleanNewPass;
      Storage.setStudentAffairsStaff(staffList);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر کلمه عبور امور دانشجویی',
        details: `کلمه عبور کارشناس امور دانشجویی ${staff.fullName} تغییر یافت.`,
        targetName: staff.fullName,
      });
      return { success: true, message: 'کلمه عبور امور دانشجویی با موفقیت تغییر یافت.' };
    }

    if (role === 'security') {
      const staffList = Storage.getSecurityStaff();
      const staff = staffList.find((s) => s.id === userId || s.username === userId);
      if (!staff) {
        return { success: false, message: 'کاربر حراست یافت نشد.' };
      }
      if (normalizeDigits(staff.password) !== cleanCurrentPass) {
        return { success: false, message: 'کلمه عبور فعلی حراست اشتباه است.' };
      }
      staff.password = cleanNewPass;
      Storage.setSecurityStaff(staffList);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر کلمه عبور حراست',
        details: `کلمه عبور کارشناس حراست ${staff.fullName} تغییر یافت.`,
        targetName: staff.fullName,
      });
      return { success: true, message: 'کلمه عبور حراست با موفقیت تغییر یافت.' };
    }

    if (role === 'student') {
      const students = Storage.getStudents();
      const idx = students.findIndex((s) => s.studentId === userId);
      if (idx === -1) {
        return { success: false, message: 'دانشجو یافت نشد.' };
      }
      const st = students[idx];
      const effectivePass = normalizeDigits(st.password || st.nationalId);
      if (effectivePass !== cleanCurrentPass) {
        return { success: false, message: 'کلمه عبور فعلی اشتباه است.' };
      }
      const cleanNat = normalizeDigits(st.nationalId);
      const updatedStudent: Student = { ...st };
      if (cleanNat && cleanNewPass === cleanNat) {
        delete updatedStudent.password;
      } else {
        updatedStudent.password = cleanNewPass;
      }
      students[idx] = updatedStudent;
      Storage.setStudents(students);
      const currentUser = Storage.getCurrentUser();
      if (currentUser && currentUser.role === 'student' && currentUser.student.studentId === updatedStudent.studentId) {
        Storage.setCurrentUser({ role: 'student', student: updatedStudent });
      }
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

  // تولید دو سوال امنیتی سه‌گزینه‌ای (نام پدر و تاریخ تولد) جهت بازیابی رمز عبور دانشجو
  getStudentRecoveryQuestions: (
    studentIdInput: string
  ): {
    success: boolean;
    message: string;
    studentId?: string;
    studentFullName?: string;
    fatherOptions?: string[];
    birthDateOptions?: string[];
  } => {
    const toAsciiDigits = (val: string) =>
      val
        .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
        .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
        .trim();

    const normPersian = (val: string) =>
      val
        .replace(/[ي]/g, 'ی')
        .replace(/[ك]/g, 'ک')
        .replace(/[ۀة]/g, 'ه')
        .replace(/\u200c/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const normDate = (val: string) => {
      const ascii = toAsciiDigits(val).replace(/[-.]/g, '/');
      const m = ascii.match(/^(\d{2,4})\/(\d{1,2})\/(\d{1,2})$/);
      if (!m) return ascii.replace(/\s+/g, '');
      const y = m[1].length === 2 ? `13${m[1]}` : m[1];
      const mo = String(Number(m[2])).padStart(2, '0');
      const da = String(Number(m[3])).padStart(2, '0');
      return `${y}/${mo}/${da}`;
    };

    const shuffleArray = <T,>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const cleanSid = toAsciiDigits(studentIdInput);
    if (!cleanSid) {
      return { success: false, message: 'لطفاً شماره دانشجویی خود را وارد نمایید.' };
    }

    const students = Storage.getStudents();
    const student = students.find((s) => toAsciiDigits(String(s.studentId || '')) === cleanSid);
    if (!student) {
      return { success: false, message: 'دانشجویی با این شماره دانشجویی در سامانه یافت نشد.' };
    }

    if (!toAsciiDigits(String(student.nationalId || ''))) {
      return {
        success: false,
        message: 'کد ملی برای این دانشجو در سامانه ثبت نشده است. لطفاً با سرپرست سرا یا مدیر سامانه تماس بگیرید.',
      };
    }

    const correctFather = normPersian(String(student.fatherName || ''));
    const rawBirthDate = String(student.birthDate || '').trim();
    const correctBirthDate = normDate(rawBirthDate);

    if (correctFather.length < 2 || !correctBirthDate) {
      return {
        success: false,
        message:
          'اطلاعات هویتی (نام پدر یا تاریخ تولد) برای این دانشجو در سامانه تکمیل نشده است. لطفاً از طریق مدیر سامانه یا سرپرست سرا رمز خود را بازنشانی نمایید.',
      };
    }

    // گزینه‌های نام پدر (۱ صحیح + ۲ گزینه انحرافی معتبر)
    const fallbackFatherNames = [
      'محمد',
      'علی',
      'حسین',
      'رضا',
      'حسن',
      'مهدی',
      'احمد',
      'اکبر',
      'محمود',
      'جواد',
      'جعفر',
      'حمید',
      'ناصر',
      'مسعود',
      'کریم',
      'صادق',
      'مجید',
      'سعید',
      'عباس',
      'ابراهیم',
      'اسماعیل',
      'مصطفی',
      'مرتضی',
      'باقر',
    ];
    const studentFatherPool = shuffleArray(
      students
        .map((s) => normPersian(String(s.fatherName || '')))
        .filter((f) => f.length >= 2 && f !== correctFather)
    );
    const mergedFatherCandidates = [...studentFatherPool, ...shuffleArray(fallbackFatherNames)];
    const fatherSet = new Set<string>([correctFather]);
    const fatherDistractors: string[] = [];
    for (const candidate of mergedFatherCandidates) {
      const cleanCand = normPersian(candidate);
      if (cleanCand.length >= 2 && !fatherSet.has(cleanCand)) {
        fatherSet.add(cleanCand);
        fatherDistractors.push(cleanCand);
        if (fatherDistractors.length === 2) break;
      }
    }
    const fatherOptions = shuffleArray([correctFather, ...fatherDistractors]);

    // گزینه‌های تاریخ تولد (۱ صحیح + ۲ گزینه انحرافی نزدیک و واقعی)
    const birthSet = new Set<string>([correctBirthDate]);
    const birthDistractors: string[] = [];
    const parsedMatch = correctBirthDate.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
    const baseYear = parsedMatch ? Number(parsedMatch[1]) : 1383;
    const baseMonth = parsedMatch ? Number(parsedMatch[2]) : 4;
    const baseDay = parsedMatch ? Number(parsedMatch[3]) : 15;

    const candidateBirthPool = shuffleArray(
      students
        .map((s) => normDate(String(s.birthDate || '')))
        .filter((d) => /^\d{4}\/\d{2}\/\d{2}$/.test(d) && d !== correctBirthDate)
    );

    const syntheticBirthCandidates: string[] = [];
    const yearOffsets = shuffleArray([-2, -1, 1, 2]);
    const monthOffsets = shuffleArray([1, 2, 3, 5, 7, 9]);
    const dayOffsets = shuffleArray([3, 6, 9, 12, 16, 21]);
    for (let i = 0; i < 6; i++) {
      const y = Math.min(1388, Math.max(1372, baseYear + yearOffsets[i % yearOffsets.length]));
      const mo = ((baseMonth - 1 + monthOffsets[i % monthOffsets.length]) % 12) + 1;
      const da = ((baseDay - 1 + dayOffsets[i % dayOffsets.length]) % 28) + 1;
      syntheticBirthCandidates.push(
        `${y}/${String(mo).padStart(2, '0')}/${String(da).padStart(2, '0')}`
      );
    }

    for (const candidate of [...syntheticBirthCandidates, ...candidateBirthPool]) {
      const cleanDate = normDate(candidate);
      if (cleanDate && !birthSet.has(cleanDate)) {
        birthSet.add(cleanDate);
        birthDistractors.push(cleanDate);
        if (birthDistractors.length === 2) break;
      }
    }
    const birthDateOptions = shuffleArray([correctBirthDate, ...birthDistractors]);

    return {
      success: true,
      message: 'سوالات امنیتی با موفقیت آماده شد.',
      studentId: student.studentId,
      studentFullName: student.fullName,
      fatherOptions,
      birthDateOptions,
    };
  },

  // بررسی پاسخ دو سوال امنیتی و بازنشانی رمز عبور دانشجو به همان کد ملی
  recoverStudentPassword: (
    studentIdInput: string,
    selectedFatherName: string,
    selectedBirthDate: string
  ): { success: boolean; message: string } => {
    const toAsciiDigits = (val: string) =>
      val
        .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
        .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
        .trim();

    const normPersian = (val: string) =>
      val
        .replace(/[ي]/g, 'ی')
        .replace(/[ك]/g, 'ک')
        .replace(/[ۀة]/g, 'ه')
        .replace(/\u200c/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const normDate = (val: string) => {
      const ascii = toAsciiDigits(val).replace(/[-.]/g, '/');
      const m = ascii.match(/^(\d{2,4})\/(\d{1,2})\/(\d{1,2})$/);
      if (!m) return ascii.replace(/\s+/g, '');
      const y = m[1].length === 2 ? `13${m[1]}` : m[1];
      const mo = String(Number(m[2])).padStart(2, '0');
      const da = String(Number(m[3])).padStart(2, '0');
      return `${y}/${mo}/${da}`;
    };

    const cleanSid = toAsciiDigits(studentIdInput);
    const students = Storage.getStudents();
    const idx = students.findIndex((s) => toAsciiDigits(String(s.studentId || '')) === cleanSid);

    if (idx === -1) {
      return { success: false, message: 'دانشجویی با این شماره دانشجویی یافت نشد.' };
    }

    const student = students[idx];
    const cleanNationalId = toAsciiDigits(String(student.nationalId || ''));
    if (!cleanNationalId) {
      return {
        success: false,
        message: 'کد ملی برای این دانشجو ثبت نشده است. لطفاً با مدیر سامانه تماس بگیرید.',
      };
    }

    const fatherMatched =
      normPersian(selectedFatherName) !== '' &&
      normPersian(selectedFatherName) === normPersian(String(student.fatherName || ''));
    const birthDateMatched =
      normDate(selectedBirthDate) !== '' &&
      normDate(selectedBirthDate) === normDate(String(student.birthDate || ''));

    if (!fatherMatched || !birthDateMatched) {
      Storage.addActivityLog({
        category: 'auth',
        action: 'تلاش ناموفق بازیابی رمز دانشجو',
        details: `پاسخ نادرست به سوالات امنیتی برای بازیابی رمز دانشجو ${student.fullName} (${student.studentId}) ثبت شد.`,
        targetName: `${student.fullName} (${student.studentId})`,
        severity: 'warning',
        actorName: 'کاربر مهمان',
        actorRole: 'system',
        actorUsername: student.studentId,
      });
      return {
        success: false,
        message: 'پاسخ سوالات امنیتی صحیح نیست. لطفاً گزینه‌ها را با دقت بررسی و مجدداً تلاش نمایید.',
      };
    }

    const updatedStudent: Student = { ...student };
    delete updatedStudent.password;
    students[idx] = updatedStudent;
    Storage.setStudents(students);

    const currentUser = Storage.getCurrentUser();
    if (currentUser && currentUser.role === 'student' && currentUser.student.studentId === updatedStudent.studentId) {
      Storage.setCurrentUser({ role: 'student', student: updatedStudent });
    }

    Storage.addActivityLog({
      category: 'auth',
      action: 'بازیابی موفق رمز عبور دانشجو به کد ملی',
      details: `دانشجو ${student.fullName} (${student.studentId}) پس از پاسخ صحیح به سوالات امنیتی، رمز عبور خود را به کد ملی بازنشانی کرد.`,
      targetName: `${student.fullName} (${student.studentId})`,
      actorName: student.fullName,
      actorRole: 'student',
      actorUsername: student.studentId,
    });

    return {
      success: true,
      message:
        'هویت شما با موفقیت تأیید شد و رمز عبور حساب شما به «کد ملی» تغییر یافت. اکنون می‌توانید با شماره دانشجویی و کد ملی وارد سامانه شوید.',
    };
  },

  // تغییر یا ریست مستقیم رمز عبور کاربران توسط مدیر کل (بدون نیاز به رمز قبلی)
  adminResetUserPassword: (
    role: 'student' | 'supervisor' | 'maintenance' | 'warehouse' | 'counselor' | 'finance' | 'procurement' | 'education' | 'cultural' | 'student_affairs' | 'security',
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
      const cleanNat = normalize(String(students[idx].nationalId || ''));
      const updatedStudent: Student = { ...students[idx] };
      if (cleanNat && cleanPass === cleanNat) {
        delete updatedStudent.password;
      } else {
        updatedStudent.password = cleanPass;
      }
      students[idx] = updatedStudent;
      Storage.setStudents(students);
      const currentUser = Storage.getCurrentUser();
      if (currentUser && currentUser.role === 'student' && currentUser.student.studentId === updatedStudent.studentId) {
        Storage.setCurrentUser({ role: 'student', student: updatedStudent });
      }
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر / ریست رمز دانشجو توسط مدیر',
        details: `کلمه عبور دانشجو ${students[idx].fullName} (${students[idx].studentId}) توسط مدیر تنظیم شد.`,
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

    if (role === 'education') {
      const list = Storage.getEducationStaff();
      const idx = list.findIndex((s) => s.id === idOrStudentId);
      if (idx === -1) return { success: false, message: 'کارشناس آموزش یافت نشد.' };
      list[idx] = { ...list[idx], password: cleanPass };
      Storage.setEducationStaff(list);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر / ریست رمز کارشناس آموزش توسط مدیر',
        details: `کلمه عبور کارشناس آموزش ${list[idx].fullName} (${list[idx].username}) توسط مدیر تغییر یافت.`,
        targetName: list[idx].fullName,
        severity: 'warning',
      });
      return {
        success: true,
        message: `رمز عبور کارشناس آموزش «${list[idx].fullName}» به «${cleanPass}» تغییر یافت.`,
      };
    }

    if (role === 'cultural') {
      const list = Storage.getCulturalStaff();
      const idx = list.findIndex((s) => s.id === idOrStudentId);
      if (idx === -1) return { success: false, message: 'کاربر امور فرهنگی یافت نشد.' };
      list[idx] = { ...list[idx], password: cleanPass };
      Storage.setCulturalStaff(list);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر / ریست رمز امور فرهنگی توسط مدیر',
        details: `کلمه عبور کارشناس امور فرهنگی ${list[idx].fullName} (${list[idx].username}) توسط مدیر تغییر یافت.`,
        targetName: list[idx].fullName,
        severity: 'warning',
      });
      return {
        success: true,
        message: `رمز عبور امور فرهنگی «${list[idx].fullName}» به «${cleanPass}» تغییر یافت.`,
      };
    }

    if (role === 'student_affairs') {
      const list = Storage.getStudentAffairsStaff();
      const idx = list.findIndex((s) => s.id === idOrStudentId);
      if (idx === -1) return { success: false, message: 'کاربر امور دانشجویی یافت نشد.' };
      list[idx] = { ...list[idx], password: cleanPass };
      Storage.setStudentAffairsStaff(list);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر / ریست رمز امور دانشجویی توسط مدیر',
        details: `کلمه عبور کارشناس امور دانشجویی ${list[idx].fullName} (${list[idx].username}) توسط مدیر تغییر یافت.`,
        targetName: list[idx].fullName,
        severity: 'warning',
      });
      return {
        success: true,
        message: `رمز عبور امور دانشجویی «${list[idx].fullName}» به «${cleanPass}» تغییر یافت.`,
      };
    }

    if (role === 'security') {
      const list = Storage.getSecurityStaff();
      const idx = list.findIndex((s) => s.id === idOrStudentId);
      if (idx === -1) return { success: false, message: 'کاربر حراست یافت نشد.' };
      list[idx] = { ...list[idx], password: cleanPass };
      Storage.setSecurityStaff(list);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر / ریست رمز حراست توسط مدیر',
        details: `کلمه عبور کارشناس حراست ${list[idx].fullName} (${list[idx].username}) توسط مدیر تغییر یافت.`,
        targetName: list[idx].fullName,
        severity: 'warning',
      });
      return {
        success: true,
        message: `رمز عبور حراست «${list[idx].fullName}» به «${cleanPass}» تغییر یافت.`,
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
    const normalizedUpdates = { ...updates };
    if (normalizedUpdates.username !== undefined) {
      const cleanU = normalizedUpdates.username.trim().toLowerCase();
      if (!cleanU) return { success: false, message: 'نام کاربری نمی‌تواند خالی باشد.' };
      if (list.some((s) => s.id !== id && s.username.trim().toLowerCase() === cleanU)) {
        return { success: false, message: 'این نام کاربری قبلاً برای کاربر انبار دیگری ثبت شده است.' };
      }
      normalizedUpdates.username = cleanU;
    }
    list[idx] = { ...list[idx], ...normalizedUpdates };
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
    const studentBySid = new Map<string, Student>();
    const studentByNid = new Map<string, Student>();
    students.forEach((s) => {
      const sk = normalizeLookupKey(s.studentId);
      const nk = normalizeLookupKey(s.nationalId);
      if (sk && !studentBySid.has(sk)) studentBySid.set(sk, s);
      if (nk && !studentByNid.has(nk)) studentByNid.set(nk, s);
    });

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
        (sidKey && studentBySid.get(sidKey)) ||
        (nidKey && studentByNid.get(nidKey));

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
      } else if (currentUser.role === 'education') {
        actorName = currentUser.staff.fullName;
        actorRole = 'education';
        actorUsername = currentUser.staff.username;
      } else if (currentUser.role === 'cultural') {
        actorName = currentUser.staff.fullName;
        actorRole = 'cultural';
        actorUsername = currentUser.staff.username;
      } else if (currentUser.role === 'student_affairs') {
        actorName = currentUser.staff.fullName;
        actorRole = 'student_affairs';
        actorUsername = currentUser.staff.username;
      } else if (currentUser.role === 'security') {
        actorName = currentUser.staff.fullName;
        actorRole = 'security';
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
        } else if (data.type === 'negative_score' && typeof data.negativePoints === 'number' && data.negativePoints > 0) {
          const prevNumeric = Number(st.previousScore ?? 100);
          const safePrev = Number.isNaN(prevNumeric) ? 100 : prevNumeric;
          st.previousScore = Math.max(0, Math.round((safePrev - data.negativePoints) * 10) / 10);
        }
      });
      Storage.setStudentEvaluations(items);
      if (
        (data.type === 'evaluation' && typeof data.score === 'number') ||
        (data.type === 'negative_score' && typeof data.negativePoints === 'number' && data.negativePoints > 0)
      ) {
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
        : data.type === 'negative_score'
        ? `نمره منفی (${data.negativePoints ?? 0}- امتیاز)`
        : data.type === 'summons'
        ? `فراخوانی به ${
            data.summonsTarget === 'disciplinary_council'
              ? 'شورای انضباطی'
              : data.summonsTarget === 'security'
              ? 'حراست'
              : 'سرپرستی'
          }`
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
      severity: data.type === 'warning' || data.type === 'summons' || data.type === 'negative_score' ? 'warning' : 'info',
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
  // نمرات دوگانه اتاق (انضباط/مقررات سکونت و نظافت فردی/اجتماعی) و گزارش‌های بازدید سرپرستی
  // -------------------------------------------------------------
  updateRoomScores: (
    roomId: string,
    scores: { disciplineScore?: number; cleanlinessScore?: number },
    actorName = 'سرپرست / مدیر سرا',
    actorRole: 'admin' | 'supervisor' = 'supervisor'
  ): { success: boolean; message: string } => {
    const rooms = Storage.getRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) {
      return { success: false, message: 'اتاق مورد نظر یافت نشد.' };
    }
    const clamp = (val: number) => Math.max(0, Math.min(100, Math.round(val * 10) / 10));
    if (typeof scores.disciplineScore === 'number' && !Number.isNaN(scores.disciplineScore)) {
      room.disciplineScore = clamp(scores.disciplineScore);
    }
    if (typeof scores.cleanlinessScore === 'number' && !Number.isNaN(scores.cleanlinessScore)) {
      room.cleanlinessScore = clamp(scores.cleanlinessScore);
    }
    Storage.setRooms(rooms);

    const dorm = Storage.getDormitories().find((d) => d.id === room.dormId);
    Storage.addActivityLog({
      category: 'warning_eval',
      action: 'بروزرسانی نمرات انضباط و نظافت اتاق',
      details: `نمرات اتاق ${room.roomNumber} (${dorm?.name || ''}) ثبت شد: انضباط و مقررات سکونت ${room.disciplineScore ?? 100}/100 و نظافت فردی و اجتماعی ${room.cleanlinessScore ?? 100}/100.`,
      targetName: `اتاق ${room.roomNumber}`,
      actorName,
      actorRole,
    });

    return {
      success: true,
      message: `نمرات اتاق ${room.roomNumber} با موفقیت بروزرسانی شد.`,
    };
  },

  applyRoomNegativeScore: (params: {
    roomId: string;
    category: 'discipline' | 'cleanliness' | 'both';
    negativePoints: number;
    targetStudentIds?: string[];
    title: string;
    description: string;
    actorName: string;
    actorRole: 'admin' | 'supervisor';
    actorId?: string;
    sendMessage?: boolean;
  }): { success: boolean; message: string } => {
    const pts = Math.max(0.5, Math.min(100, Math.round(params.negativePoints * 10) / 10));
    const rooms = Storage.getRooms();
    const room = rooms.find((r) => r.id === params.roomId);
    if (!room) {
      return { success: false, message: 'اتاق مورد نظر یافت نشد.' };
    }

    const dorm = Storage.getDormitories().find((d) => d.id === room.dormId);
    const curDiscipline = room.disciplineScore ?? 100;
    const curCleanliness = room.cleanlinessScore ?? 100;

    if (params.category === 'discipline' || params.category === 'both') {
      room.disciplineScore = Math.max(0, Math.round((curDiscipline - pts) * 10) / 10);
    }
    if (params.category === 'cleanliness' || params.category === 'both') {
      room.cleanlinessScore = Math.max(0, Math.round((curCleanliness - pts) * 10) / 10);
    }
    Storage.setRooms(rooms);

    const students = Storage.getStudents();
    const beds = Storage.getBeds();
    const roomOccupants = beds
      .filter((b) => b.roomId === room.id && b.studentId)
      .map((b) => students.find((s) => s.studentId === b.studentId))
      .filter((s): s is Student => Boolean(s));

    const targeted =
      params.targetStudentIds && params.targetStudentIds.length > 0
        ? roomOccupants.filter((s) => params.targetStudentIds!.includes(s.studentId))
        : roomOccupants;

    const nowFa = new Date().toLocaleDateString('fa-IR');
    const scoreCategory: 'discipline' | 'cleanliness' | 'general' =
      params.category === 'discipline'
        ? 'discipline'
        : params.category === 'cleanliness'
        ? 'cleanliness'
        : 'general';

    targeted.forEach((st) => {
      Storage.addStudentEvaluation(
        {
          studentId: st.studentId,
          studentName: st.fullName,
          dormId: room.dormId,
          dormName: dorm?.name || st.assignedDormName,
          roomId: room.id,
          roomNumber: room.roomNumber,
          type: 'negative_score',
          scope: targeted.length === roomOccupants.length ? 'room' : 'individual',
          scoreCategory,
          negativePoints: pts,
          title: params.title,
          description: params.description,
          evaluatorName: params.actorName,
          evaluatorRole: params.actorRole,
        },
        false
      );

      if (params.sendMessage) {
        Storage.addMessage({
          senderId: params.actorId || params.actorRole,
          senderName: params.actorName,
          senderRole: params.actorRole,
          receiverType: 'student',
          receiverId: st.studentId,
          subject: `ثبت نمره منفی (${pts}-): ${params.title}`,
          content: `${params.description}\n(سرا: ${dorm?.name || '-'} | اتاق ${room.roomNumber})`,
          category: params.category === 'cleanliness' ? 'services_cleaning' : 'discipline',
          date: nowFa,
        });
      }
    });

    if (targeted.length === 0) {
      Storage.addActivityLog({
        category: 'warning_eval',
        action: `ثبت نمره منفی اتاق (${pts}-)`,
        details: `نمره منفی ${pts}- برای اتاق ${room.roomNumber} (${dorm?.name || ''}) ثبت شد: ${params.title}`,
        targetName: `اتاق ${room.roomNumber}`,
        severity: 'warning',
        actorName: params.actorName,
        actorRole: params.actorRole,
      });
    }

    return {
      success: true,
      message: `نمره منفی (${pts}- امتیاز) برای اتاق ${room.roomNumber}${targeted.length > 0 ? ` و ${targeted.length} دانشجو` : ''} با موفقیت ثبت شد.`,
    };
  },

  getVisitReports: (): VisitReport[] => {
    return get<VisitReport[]>(STORAGE_KEYS.VISIT_REPORTS, INITIAL_VISIT_REPORTS);
  },

  setVisitReports: (items: VisitReport[]): void => {
    set(STORAGE_KEYS.VISIT_REPORTS, items);
  },

  addVisitReport: (
    payload: Omit<VisitReport, 'id' | 'reportCode' | 'createdAt'>,
    applyScoresToRoom = true
  ): { success: boolean; message: string; report?: VisitReport } => {
    if (!payload.dormId || !payload.summary.trim()) {
      return { success: false, message: 'انتخاب سرا و شرح گزارش بازدید الزامی است.' };
    }
    if (payload.scope === 'room' && !payload.roomId) {
      return { success: false, message: 'برای گزارش بازدید اتاق، انتخاب اتاق الزامی است.' };
    }

    const reports = Storage.getVisitReports();
    const now = new Date();
    const createdAt = `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const newReport: VisitReport = {
      ...payload,
      id: `visit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reportCode: `VR-${101 + reports.length}`,
      summary: payload.summary.trim(),
      recommendations: payload.recommendations?.trim() || undefined,
      residentPresenceSummary: payload.residentPresenceSummary?.trim() || undefined,
      createdAt,
    };

    reports.unshift(newReport);
    Storage.setVisitReports(reports);

    if (payload.scope === 'room' && payload.roomId) {
      const rooms = Storage.getRooms();
      const targetRoom = rooms.find((r) => r.id === payload.roomId);
      if (targetRoom) {
        targetRoom.lastVisitAt = `${payload.visitDate} (${payload.visitTime})`;
        targetRoom.lastVisitBy = payload.inspectorName;
        if (applyScoresToRoom) {
          if (typeof payload.disciplineScore === 'number' && !Number.isNaN(payload.disciplineScore)) {
            targetRoom.disciplineScore = Math.max(0, Math.min(100, payload.disciplineScore));
          }
          if (typeof payload.cleanlinessScore === 'number' && !Number.isNaN(payload.cleanlinessScore)) {
            targetRoom.cleanlinessScore = Math.max(0, Math.min(100, payload.cleanlinessScore));
          }
        }
        Storage.setRooms(rooms);
      }
    }

    Storage.addActivityLog({
      category: 'visit_report',
      action:
        payload.scope === 'room'
          ? `ثبت گزارش بازدید اتاق ${payload.roomNumber || ''}`
          : 'ثبت گزارش بازدید کلی سرا',
      details: `گزارش بازدید ${newReport.reportCode} توسط ${payload.inspectorName} برای ${payload.dormName}${
        payload.scope === 'room' ? ` - اتاق ${payload.roomNumber}` : ''
      } ثبت شد.`,
      targetName:
        payload.scope === 'room'
          ? `${payload.dormName} - اتاق ${payload.roomNumber}`
          : payload.dormName,
      severity:
        payload.cleanlinessCondition === 'poor' || payload.facilitiesCondition === 'urgent_repair'
          ? 'warning'
          : 'info',
      actorName: payload.inspectorName,
      actorRole: payload.inspectorRole,
    });

    return {
      success: true,
      message: `گزارش بازدید با کد ${newReport.reportCode} با موفقیت ثبت شد.`,
      report: newReport,
    };
  },

  deleteVisitReport: (id: string): void => {
    const reports = Storage.getVisitReports();
    const target = reports.find((r) => r.id === id);
    Storage.setVisitReports(reports.filter((r) => r.id !== id));
    if (target) {
      Storage.addActivityLog({
        category: 'visit_report',
        action: 'حذف گزارش بازدید سرپرستی',
        details: `گزارش بازدید ${target.reportCode} مربوط به ${target.dormName}${target.roomNumber ? ` اتاق ${target.roomNumber}` : ''} حذف شد.`,
        targetName: target.reportCode,
        severity: 'warning',
      });
    }
  },

  // -------------------------------------------------------------
  // متدهای مدیریت کاربران کارشناس آموزش و اعلامیه‌های مرخصی/اخراج به مدیر
  // -------------------------------------------------------------
  getEducationStaff: (): EducationStaff[] =>
    get<EducationStaff[]>(STORAGE_KEYS.EDUCATION_STAFF, INITIAL_EDUCATION_STAFF),

  setEducationStaff: (staff: EducationStaff[]): boolean =>
    set(STORAGE_KEYS.EDUCATION_STAFF, staff),

  addEducationStaff: (
    staffData: Omit<EducationStaff, 'id'>
  ): { success: boolean; message: string; staff?: EducationStaff } => {
    const list = Storage.getEducationStaff();
    const cleanUsername = normalizeAsciiDigits(staffData.username).toLowerCase();
    if (!cleanUsername) {
      return { success: false, message: 'نام کاربری کارشناس آموزش نمی‌تواند خالی باشد.' };
    }
    if (list.some((s) => normalizeAsciiDigits(s.username).toLowerCase() === cleanUsername)) {
      return { success: false, message: 'این نام کاربری قبلاً برای کارشناس آموزش دیگری ثبت شده است.' };
    }
    const newStaff: EducationStaff = {
      ...staffData,
      id: makeUniqueId('edu'),
      username: cleanUsername,
      role: 'education',
      department: staffData.department?.trim() || 'واحد آموزش و امور دانشجویی',
      status: staffData.status || 'active',
      isActive: staffData.isActive !== false,
    };
    list.push(newStaff);
    Storage.setEducationStaff(list);
    Storage.addActivityLog({
      category: 'staff',
      action: 'ثبت کارشناس آموزش',
      details: `کارشناس آموزش «${newStaff.fullName}» (${newStaff.username}) در سامانه ثبت شد.`,
      targetName: newStaff.fullName,
    });
    return {
      success: true,
      message: `کارشناس آموزش «${newStaff.fullName}» با موفقیت افزوده شد.`,
      staff: newStaff,
    };
  },

  updateEducationStaff: (
    id: string,
    updates: Partial<EducationStaff>
  ): { success: boolean; message: string } => {
    const list = Storage.getEducationStaff();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false, message: 'کارشناس آموزش یافت نشد.' };
    const normalizedUpdates = { ...updates };
    if (normalizedUpdates.username !== undefined) {
      const cleanU = normalizeAsciiDigits(normalizedUpdates.username).toLowerCase();
      if (!cleanU) return { success: false, message: 'نام کاربری نمی‌تواند خالی باشد.' };
      if (list.some((e) => e.id !== id && normalizeAsciiDigits(e.username).toLowerCase() === cleanU)) {
        return { success: false, message: 'این نام کاربری قبلاً برای کارشناس آموزش دیگری ثبت شده است.' };
      }
      normalizedUpdates.username = cleanU;
    }
    list[idx] = { ...list[idx], ...normalizedUpdates };
    Storage.setEducationStaff(list);
    const cu = Storage.getCurrentUser();
    if (cu && cu.role === 'education' && cu.staff.id === id) {
      Storage.setCurrentUser({ role: 'education', staff: list[idx] });
    }
    return { success: true, message: 'اطلاعات کارشناس آموزش با موفقیت بروزرسانی شد.' };
  },

  deleteEducationStaff: (id: string): { success: boolean; message: string } => {
    const list = Storage.getEducationStaff();
    const target = list.find((s) => s.id === id);
    Storage.setEducationStaff(list.filter((s) => s.id !== id));
    if (target) {
      Storage.addActivityLog({
        category: 'staff',
        action: 'حذف کارشناس آموزش',
        details: `حساب کاربری کارشناس آموزش «${target.fullName}» حذف گردید.`,
        targetName: target.fullName,
        severity: 'warning',
      });
    }
    return { success: true, message: 'کارشناس آموزش با موفقیت حذف گردید.' };
  },

  getAcademicNotices: (): AcademicStatusNotice[] =>
    get<AcademicStatusNotice[]>(STORAGE_KEYS.ACADEMIC_NOTICES, INITIAL_ACADEMIC_NOTICES),

  setAcademicNotices: (items: AcademicStatusNotice[]): boolean =>
    set(STORAGE_KEYS.ACADEMIC_NOTICES, items),

  addAcademicNotice: (payload: {
    student: Student;
    noticeType: AcademicNoticeType;
    academicYear: string;
    semester: string;
    effectiveDate?: string;
    letterNumber?: string;
    description: string;
    reportedByStaffId: string;
    reportedByStaffName: string;
  }): { success: boolean; message: string; notice?: AcademicStatusNotice } => {
    if (!payload.student || !payload.description.trim()) {
      return { success: false, message: 'انتخاب دانشجو و ثبت شرح وضعیت تحصیلی الزامی است.' };
    }
    const notices = Storage.getAcademicNotices();
    const now = new Date();
    const createdAt = `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const newNotice: AcademicStatusNotice = {
      id: makeUniqueId('acad'),
      noticeCode: `EDU-${101 + notices.length}`,
      studentId: payload.student.studentId,
      studentName: payload.student.fullName,
      studentNationalId: payload.student.nationalId,
      studentFieldOfStudy: payload.student.fieldOfStudy,
      studentEntryTerm: payload.student.entryTerm,
      noticeType: payload.noticeType,
      academicYear: payload.academicYear,
      semester: payload.semester,
      effectiveDate: payload.effectiveDate?.trim() || undefined,
      letterNumber: payload.letterNumber?.trim() || undefined,
      description: payload.description.trim(),
      reportedByStaffId: payload.reportedByStaffId,
      reportedByStaffName: payload.reportedByStaffName,
      createdAt,
      status: 'pending',
    };
    notices.unshift(newNotice);
    Storage.setAcademicNotices(notices);

    const typeFa = payload.noticeType === 'expulsion' ? 'اخراج / محرومیت از تحصیل' : 'مرخصی تحصیلی';
    Storage.addActivityLog({
      category: 'education',
      action: `اعلام وضعیت ${typeFa} به مدیر`,
      details: `کارشناس آموزش ${payload.reportedByStaffName} وضعیت «${typeFa}» دانشجو ${payload.student.fullName} (${payload.student.studentId}) را برای ${payload.semester} (${payload.academicYear}) به مدیر سامانه اعلام کرد.`,
      targetName: `${payload.student.fullName} (${payload.student.studentId})`,
      severity: payload.noticeType === 'expulsion' ? 'critical' : 'warning',
      actorName: payload.reportedByStaffName,
      actorRole: 'education',
    });

    return {
      success: true,
      message: `اعلامیه ${typeFa} برای «${payload.student.fullName}» با کد ${newNotice.noticeCode} به مدیر سامانه ارسال شد.`,
      notice: newNotice,
    };
  },

  updateAcademicNoticeStatus: (
    id: string,
    status: AcademicStatusNotice['status'],
    adminNote?: string,
    reviewedBy = 'مدیر کل سامانه'
  ): { success: boolean; message: string } => {
    const notices = Storage.getAcademicNotices();
    const idx = notices.findIndex((n) => n.id === id);
    if (idx === -1) return { success: false, message: 'اعلامیه مورد نظر یافت نشد.' };
    const now = new Date();
    const reviewedAt = `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    notices[idx] = {
      ...notices[idx],
      status,
      adminNote: adminNote?.trim() || notices[idx].adminNote,
      reviewedBy,
      reviewedAt,
    };
    Storage.setAcademicNotices(notices);
    Storage.addActivityLog({
      category: 'education',
      action: 'بررسی اعلامیه آموزشی توسط مدیر',
      details: `اعلامیه ${notices[idx].noticeCode} (${notices[idx].studentName}) به وضعیت «${
        status === 'action_taken' ? 'اقدام و اعمال شد' : status === 'reviewed' ? 'بررسی‌شده' : 'در انتظار بررسی'
      }» تغییر یافت.`,
      targetName: notices[idx].studentName,
    });
    return { success: true, message: 'وضعیت اعلامیه آموزشی با موفقیت بروزرسانی شد.' };
  },

  deleteAcademicNotice: (id: string): { success: boolean; message: string } => {
    const notices = Storage.getAcademicNotices();
    Storage.setAcademicNotices(notices.filter((n) => n.id !== id));
    return { success: true, message: 'اعلامیه آموزشی حذف شد.' };
  },

  // -------------------------------------------------------------
  // نظرسنجی‌های دوره‌ای دانشجویان (خدمات سراها، تأسیسات، نظافت، سلف و سرپرستان)
  // -------------------------------------------------------------
  getSurveys: (): PeriodicSurvey[] =>
    get<PeriodicSurvey[]>(STORAGE_KEYS.SURVEYS, INITIAL_SURVEYS),

  setSurveys: (items: PeriodicSurvey[]): boolean =>
    set(STORAGE_KEYS.SURVEYS, items),

  addSurvey: (
    payload: Omit<PeriodicSurvey, 'id' | 'surveyCode' | 'createdAt'>
  ): { success: boolean; message: string; survey?: PeriodicSurvey } => {
    if (!payload.title.trim() || !payload.questions || payload.questions.length === 0) {
      return { success: false, message: 'عنوان نظرسنجی و حداقل یک سوال الزامی است.' };
    }
    const surveys = Storage.getSurveys();
    const now = new Date();
    const createdAt = `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const newSurvey: PeriodicSurvey = {
      ...payload,
      id: makeUniqueId('srv'),
      surveyCode: `SRV-${101 + surveys.length}`,
      createdAt,
    };
    surveys.unshift(newSurvey);
    Storage.setSurveys(surveys);
    Storage.addActivityLog({
      category: 'survey',
      action: 'ایجاد نظرسنجی دوره‌ای جدید',
      details: `نظرسنجی «${newSurvey.title}» (${newSurvey.surveyCode}) برای دوره ${newSurvey.periodLabel} با ${newSurvey.questions.length} سوال توسط مدیر ثبت شد.`,
      targetName: newSurvey.title,
    });
    return { success: true, message: `نظرسنجی دوره‌ای «${newSurvey.title}» با کد ${newSurvey.surveyCode} با موفقیت ایجاد شد.`, survey: newSurvey };
  },

  updateSurvey: (id: string, updates: Partial<PeriodicSurvey>): { success: boolean; message: string } => {
    const surveys = Storage.getSurveys();
    const idx = surveys.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false, message: 'نظرسنجی مورد نظر یافت نشد.' };
    surveys[idx] = { ...surveys[idx], ...updates };
    Storage.setSurveys(surveys);
    Storage.addActivityLog({
      category: 'survey',
      action: 'ویرایش نظرسنجی دوره‌ای',
      details: `نظرسنجی «${surveys[idx].title}» (${surveys[idx].surveyCode}) بروزرسانی شد.`,
      targetName: surveys[idx].title,
    });
    return { success: true, message: 'نظرسنجی با موفقیت بروزرسانی شد.' };
  },

  toggleSurveyStatus: (id: string, status: PeriodicSurvey['status']): { success: boolean; message: string } => {
    const surveys = Storage.getSurveys();
    const idx = surveys.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false, message: 'نظرسنجی یافت نشد.' };
    surveys[idx] = { ...surveys[idx], status };
    Storage.setSurveys(surveys);
    return {
      success: true,
      message: status === 'active' ? 'نظرسنجی برای دانشجویان فعال شد.' : status === 'closed' ? 'نظرسنجی بسته شد.' : 'نظرسنجی به حالت پیش‌نویس تغییر یافت.',
    };
  },

  deleteSurvey: (id: string): { success: boolean; message: string } => {
    const surveys = Storage.getSurveys();
    const target = surveys.find((s) => s.id === id);
    Storage.setSurveys(surveys.filter((s) => s.id !== id));
    const responses = Storage.getSurveyResponses();
    Storage.setSurveyResponses(responses.filter((r) => r.surveyId !== id));
    if (target) {
      Storage.addActivityLog({
        category: 'survey',
        action: 'حذف نظرسنجی دوره‌ای',
        details: `نظرسنجی «${target.title}» (${target.surveyCode}) و پاسخ‌های آن حذف گردید.`,
        targetName: target.title,
        severity: 'warning',
      });
    }
    return { success: true, message: 'نظرسنجی و پاسخ‌های مرتبط حذف شد.' };
  },

  getSurveyResponses: (): SurveyResponse[] =>
    get<SurveyResponse[]>(STORAGE_KEYS.SURVEY_RESPONSES, INITIAL_SURVEY_RESPONSES),

  setSurveyResponses: (items: SurveyResponse[]): boolean =>
    set(STORAGE_KEYS.SURVEY_RESPONSES, items),

  getResponsesBySurvey: (surveyId: string): SurveyResponse[] =>
    Storage.getSurveyResponses().filter((r) => r.surveyId === surveyId),

  hasStudentRespondedToSurvey: (surveyId: string, studentId: string): boolean =>
    Storage.getSurveyResponses().some((r) => r.surveyId === surveyId && r.studentId === studentId),

  submitSurveyResponse: (payload: {
    survey: PeriodicSurvey;
    student: Student;
    answers: SurveyAnswer[];
    overallComment?: string;
    targetSupervisorId?: string;
    targetSupervisorName?: string;
    targetMaintenanceId?: string;
    targetMaintenanceName?: string;
  }): { success: boolean; message: string; response?: SurveyResponse } => {
    const { survey, student, answers } = payload;
    if (survey.status !== 'active') {
      return { success: false, message: 'این نظرسنجی در حال حاضر فعال نیست.' };
    }
    const existing = Storage.getSurveyResponses();
    if (existing.some((r) => r.surveyId === survey.id && r.studentId === student.studentId)) {
      return { success: false, message: 'شما پیش‌تر در این نظرسنجی شرکت کرده‌اید.' };
    }

    const ratings = answers
      .filter((a) => a.type === 'rating_5' && typeof a.ratingValue === 'number' && a.ratingValue > 0)
      .map((a) => a.ratingValue as number);
    const overallRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((acc, val) => acc + val, 0) / ratings.length) * 100) / 100
        : undefined;

    const dorms = Storage.getDormitories();
    const rooms = Storage.getRooms();
    const dormName = student.assignedDormId
      ? dorms.find((d) => d.id === student.assignedDormId)?.name || student.assignedDormName
      : undefined;
    const roomNumber = student.assignedRoomId
      ? rooms.find((r) => r.id === student.assignedRoomId)?.roomNumber || student.assignedRoomNumber
      : undefined;

    const now = new Date();
    const submittedAt = `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const newResp: SurveyResponse = {
      id: makeUniqueId('sres'),
      surveyId: survey.id,
      studentId: student.studentId,
      studentName: student.fullName,
      studentFieldOfStudy: student.fieldOfStudy,
      studentEntryTerm: student.entryTerm,
      dormId: student.assignedDormId || undefined,
      dormName,
      roomNumber,
      targetSupervisorId: payload.targetSupervisorId,
      targetSupervisorName: payload.targetSupervisorName,
      targetMaintenanceId: payload.targetMaintenanceId,
      targetMaintenanceName: payload.targetMaintenanceName,
      overallRating,
      answers,
      overallComment: payload.overallComment?.trim() || undefined,
      submittedAt,
    };

    existing.unshift(newResp);
    Storage.setSurveyResponses(existing);

    Storage.addActivityLog({
      category: 'survey',
      action: 'ثبت پاسخ دانشجو در نظرسنجی',
      details: `پاسخ نظرسنجی «${survey.title}» (${survey.surveyCode}) ثبت گردید.`,
      targetName: survey.title,
      actorName: survey.isAnonymous ? 'دانشجوی شرکت‌کننده (ناشناس)' : student.fullName,
      actorRole: 'student',
      actorUsername: survey.isAnonymous ? undefined : student.studentId,
    });

    return { success: true, message: 'پاسخ شما با موفقیت ثبت شد. از مشارکت ارزشمند شما سپاسگزاریم!', response: newResp };
  },

  // -------------------------------------------------------------
  // متدهای مدیریت کاربران امور فرهنگی، جدول زمانی هفتگی برنامه‌ها و تشکل‌ها
  // -------------------------------------------------------------
  getCulturalStaff: (): CulturalStaff[] =>
    get<CulturalStaff[]>(STORAGE_KEYS.CULTURAL_STAFF, INITIAL_CULTURAL_STAFF),

  setCulturalStaff: (staff: CulturalStaff[]): boolean =>
    set(STORAGE_KEYS.CULTURAL_STAFF, staff),

  addCulturalStaff: (
    staffData: Omit<CulturalStaff, 'id'>
  ): { success: boolean; message: string; staff?: CulturalStaff } => {
    const list = Storage.getCulturalStaff();
    const cleanUsername = normalizeAsciiDigits(staffData.username).toLowerCase();
    if (!cleanUsername) {
      return { success: false, message: 'نام کاربری کارشناس امور فرهنگی نمی‌تواند خالی باشد.' };
    }
    if (list.some((s) => normalizeAsciiDigits(s.username).toLowerCase() === cleanUsername)) {
      return { success: false, message: 'این نام کاربری قبلاً برای کارشناس امور فرهنگی دیگری ثبت شده است.' };
    }
    const newStaff: CulturalStaff = {
      ...staffData,
      id: makeUniqueId('cul'),
      username: cleanUsername,
      role: 'cultural',
      department: staffData.department?.trim() || 'واحد امور فرهنگی و اجتماعی سراها',
      status: staffData.status || 'active',
      isActive: staffData.isActive !== false,
    };
    list.push(newStaff);
    Storage.setCulturalStaff(list);
    Storage.addActivityLog({
      category: 'staff',
      action: 'ثبت کارشناس امور فرهنگی',
      details: `کارشناس امور فرهنگی «${newStaff.fullName}» (${newStaff.username}) در سامانه ثبت شد.`,
      targetName: newStaff.fullName,
    });
    return {
      success: true,
      message: `کارشناس امور فرهنگی «${newStaff.fullName}» با موفقیت افزوده شد.`,
      staff: newStaff,
    };
  },

  updateCulturalStaff: (
    id: string,
    updates: Partial<CulturalStaff>
  ): { success: boolean; message: string } => {
    const list = Storage.getCulturalStaff();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false, message: 'کاربر امور فرهنگی یافت نشد.' };
    const normalizedUpdates = { ...updates };
    if (normalizedUpdates.username !== undefined) {
      const cleanU = normalizeAsciiDigits(normalizedUpdates.username).toLowerCase();
      if (!cleanU) return { success: false, message: 'نام کاربری نمی‌تواند خالی باشد.' };
      if (list.some((c) => c.id !== id && normalizeAsciiDigits(c.username).toLowerCase() === cleanU)) {
        return { success: false, message: 'این نام کاربری قبلاً برای کاربر امور فرهنگی دیگری ثبت شده است.' };
      }
      normalizedUpdates.username = cleanU;
    }
    list[idx] = { ...list[idx], ...normalizedUpdates };
    Storage.setCulturalStaff(list);
    const cu = Storage.getCurrentUser();
    if (cu && cu.role === 'cultural' && cu.staff.id === id) {
      Storage.setCurrentUser({ role: 'cultural', staff: list[idx] });
    }
    return { success: true, message: 'اطلاعات کارشناس امور فرهنگی با موفقیت بروزرسانی شد.' };
  },

  deleteCulturalStaff: (id: string): { success: boolean; message: string } => {
    const list = Storage.getCulturalStaff();
    const target = list.find((s) => s.id === id);
    Storage.setCulturalStaff(list.filter((s) => s.id !== id));
    if (target) {
      Storage.addActivityLog({
        category: 'staff',
        action: 'حذف کارشناس امور فرهنگی',
        details: `حساب کاربری امور فرهنگی «${target.fullName}» حذف گردید.`,
        targetName: target.fullName,
        severity: 'warning',
      });
    }
    return { success: true, message: 'کارشناس امور فرهنگی با موفقیت حذف گردید.' };
  },

  getCulturalPrograms: (): CulturalProgram[] =>
    get<CulturalProgram[]>(STORAGE_KEYS.CULTURAL_PROGRAMS, INITIAL_CULTURAL_PROGRAMS),

  setCulturalPrograms: (items: CulturalProgram[]): boolean =>
    set(STORAGE_KEYS.CULTURAL_PROGRAMS, items),

  addCulturalProgram: (
    payload: Omit<CulturalProgram, 'id' | 'programCode' | 'createdAt'>
  ): { success: boolean; message: string; program?: CulturalProgram } => {
    if (!payload.title.trim() || !payload.startTime.trim() || !payload.endTime.trim()) {
      return { success: false, message: 'عنوان برنامه، ساعت شروع و ساعت پایان الزامی است.' };
    }
    const items = Storage.getCulturalPrograms();
    const now = new Date();
    const createdAt = `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const newItem: CulturalProgram = {
      ...payload,
      id: makeUniqueId('cprg'),
      programCode: `CL-${101 + items.length}`,
      createdAt,
      approvedAt: payload.status === 'approved' ? createdAt : undefined,
      approvedBy: payload.status === 'approved' ? payload.createdByName : undefined,
    };
    items.unshift(newItem);
    Storage.setCulturalPrograms(items);
    Storage.addActivityLog({
      category: 'cultural',
      action: 'ثبت برنامه فرهنگی در جدول زمانی هفتگی',
      details: `برنامه «${newItem.title}» (${newItem.programCode}) برای ${newItem.dormName} ثبت شد (${newItem.status === 'approved' ? 'تأیید و منتشرشده' : 'پیش‌نویس'}).`,
      targetName: newItem.title,
    });
    return {
      success: true,
      message: `برنامه فرهنگی «${newItem.title}» با کد ${newItem.programCode} ثبت شد.`,
      program: newItem,
    };
  },

  updateCulturalProgram: (
    id: string,
    updates: Partial<CulturalProgram>
  ): { success: boolean; message: string } => {
    const items = Storage.getCulturalPrograms();
    const idx = items.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false, message: 'برنامه فرهنگی یافت نشد.' };
    items[idx] = { ...items[idx], ...updates };
    Storage.setCulturalPrograms(items);
    return { success: true, message: 'برنامه فرهنگی با موفقیت بروزرسانی شد.' };
  },

  toggleCulturalProgramApproval: (
    id: string,
    actorName = 'واحد امور فرهنگی'
  ): { success: boolean; message: string; status?: CulturalProgram['status'] } => {
    const items = Storage.getCulturalPrograms();
    const idx = items.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false, message: 'برنامه فرهنگی یافت نشد.' };
    const nextStatus: CulturalProgram['status'] =
      items[idx].status === 'approved' ? 'draft' : 'approved';
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    items[idx] = {
      ...items[idx],
      status: nextStatus,
      approvedAt: nextStatus === 'approved' ? nowStr : undefined,
      approvedBy: nextStatus === 'approved' ? actorName : undefined,
    };
    Storage.setCulturalPrograms(items);
    Storage.addActivityLog({
      category: 'cultural',
      action: nextStatus === 'approved' ? 'تأیید و انتشار برنامه فرهنگی' : 'لغو انتشار برنامه فرهنگی',
      details: `وضعیت برنامه «${items[idx].title}» (${items[idx].programCode}) به «${
        nextStatus === 'approved' ? 'تأییدشده (نمایش برای دانشجویان)' : 'پیش‌نویس'
      }» تغییر یافت.`,
      targetName: items[idx].title,
    });
    return {
      success: true,
      status: nextStatus,
      message:
        nextStatus === 'approved'
          ? 'برنامه تأیید شد و اکنون در جدول هفتگی کارتابل دانشجویان نمایش داده می‌شود.'
          : 'برنامه به حالت پیش‌نویس بازگشت و از کارتابل دانشجویان پنهان شد.',
    };
  },

  deleteCulturalProgram: (id: string): { success: boolean; message: string } => {
    const items = Storage.getCulturalPrograms();
    const target = items.find((p) => p.id === id);
    Storage.setCulturalPrograms(items.filter((p) => p.id !== id));
    if (target) {
      Storage.addActivityLog({
        category: 'cultural',
        action: 'حذف برنامه فرهنگی',
        details: `برنامه «${target.title}» (${target.programCode}) حذف گردید.`,
        targetName: target.title,
        severity: 'warning',
      });
    }
    return { success: true, message: 'برنامه فرهنگی حذف شد.' };
  },

  getCulturalAssociations: (): CulturalAssociation[] =>
    get<CulturalAssociation[]>(STORAGE_KEYS.CULTURAL_ASSOCIATIONS, INITIAL_CULTURAL_ASSOCIATIONS),

  setCulturalAssociations: (items: CulturalAssociation[]): boolean =>
    set(STORAGE_KEYS.CULTURAL_ASSOCIATIONS, items),

  addCulturalAssociation: (
    payload: Omit<CulturalAssociation, 'id' | 'associationCode' | 'createdAt'>
  ): { success: boolean; message: string; association?: CulturalAssociation } => {
    if (!payload.name.trim()) {
      return { success: false, message: 'نام تشکل یا انجمن نمی‌تواند خالی باشد.' };
    }
    const items = Storage.getCulturalAssociations();
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const newAssoc: CulturalAssociation = {
      ...payload,
      id: makeUniqueId('assoc'),
      associationCode: `AS-${101 + items.length}`,
      createdAt: nowStr,
    };
    items.unshift(newAssoc);
    Storage.setCulturalAssociations(items);
    Storage.addActivityLog({
      category: 'cultural',
      action: 'ایجاد تشکل / انجمن دانشجویی جدید',
      details: `تشکل «${newAssoc.name}» (${newAssoc.associationCode}) توسط واحد امور فرهنگی ثبت شد.`,
      targetName: newAssoc.name,
    });
    return {
      success: true,
      message: `تشکل / انجمن «${newAssoc.name}» با موفقیت ایجاد شد.`,
      association: newAssoc,
    };
  },

  updateCulturalAssociation: (
    id: string,
    updates: Partial<CulturalAssociation>
  ): { success: boolean; message: string } => {
    const items = Storage.getCulturalAssociations();
    const idx = items.findIndex((a) => a.id === id);
    if (idx === -1) return { success: false, message: 'تشکل یافت نشد.' };
    items[idx] = { ...items[idx], ...updates };
    Storage.setCulturalAssociations(items);
    return { success: true, message: 'اطلاعات تشکل / انجمن بروزرسانی شد.' };
  },

  deleteCulturalAssociation: (id: string): { success: boolean; message: string } => {
    const items = Storage.getCulturalAssociations();
    const target = items.find((a) => a.id === id);
    Storage.setCulturalAssociations(items.filter((a) => a.id !== id));
    const mems = Storage.getAssociationMemberships();
    Storage.setAssociationMemberships(mems.filter((m) => m.associationId !== id));
    if (target) {
      Storage.addActivityLog({
        category: 'cultural',
        action: 'حذف تشکل / انجمن',
        details: `تشکل «${target.name}» و سوابق عضویت آن حذف گردید.`,
        targetName: target.name,
        severity: 'warning',
      });
    }
    return { success: true, message: 'تشکل و سوابق عضویت مرتبط حذف شد.' };
  },

  getAssociationMemberships: (): AssociationMembership[] =>
    get<AssociationMembership[]>(STORAGE_KEYS.ASSOCIATION_MEMBERSHIPS, INITIAL_ASSOCIATION_MEMBERSHIPS),

  setAssociationMemberships: (items: AssociationMembership[]): boolean =>
    set(STORAGE_KEYS.ASSOCIATION_MEMBERSHIPS, items),

  requestOrJoinAssociation: (payload: {
    association: CulturalAssociation;
    student: Student;
    dormName?: string;
    requestNote?: string;
  }): { success: boolean; message: string; membership?: AssociationMembership } => {
    const { association, student, dormName, requestNote } = payload;
    if (association.status !== 'active') {
      return { success: false, message: 'عضویت در این تشکل در حال حاضر غیرفعال است.' };
    }
    const list = Storage.getAssociationMemberships();
    const existing = list.find(
      (m) => m.associationId === association.id && m.studentId === student.studentId && m.status !== 'rejected'
    );
    if (existing) {
      return {
        success: false,
        message:
          existing.status === 'approved'
            ? 'شما هم‌اکنون عضو این تشکل هستید.'
            : 'درخواست عضویت شما قبلاً ثبت شده و در انتظار تأیید امور فرهنگی است.',
      };
    }

    if (association.maxCapacity && association.maxCapacity > 0) {
      const approvedCount = list.filter(
        (m) => m.associationId === association.id && m.status === 'approved'
      ).length;
      if (approvedCount >= association.maxCapacity) {
        return { success: false, message: 'ظرفیت عضویت این تشکل تکمیل شده است.' };
      }
    }

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const isInstant = association.membershipMode === 'open_instant';
    const membership: AssociationMembership = {
      id: makeUniqueId('amem'),
      associationId: association.id,
      associationName: association.name,
      studentId: student.studentId,
      studentName: student.fullName,
      studentFieldOfStudy: student.fieldOfStudy,
      studentEntryTerm: student.entryTerm,
      dormName: dormName || student.assignedDormName || 'دانشجوی ترددی / فاقد سرا',
      status: isInstant ? 'approved' : 'pending',
      requestNote: requestNote?.trim() || undefined,
      requestedAt: nowStr,
      reviewedAt: isInstant ? nowStr : undefined,
      reviewedBy: isInstant ? 'عضویت خودکار (تشکل آزاد)' : undefined,
    };
    list.unshift(membership);
    Storage.setAssociationMemberships(list);
    Storage.addActivityLog({
      category: 'cultural',
      action: isInstant ? 'عضویت مستقیم در تشکل' : 'ثبت درخواست عضویت در تشکل',
      details: `${student.fullName} (${student.studentId}) برای تشکل «${association.name}» ${
        isInstant ? 'عضو شد' : 'درخواست عضویت ثبت کرد'
      }.`,
      targetName: association.name,
      actorName: student.fullName,
      actorRole: 'student',
      actorUsername: student.studentId,
    });
    return {
      success: true,
      message: isInstant
        ? `عضویت شما در «${association.name}» با موفقیت ثبت شد.`
        : `درخواست عضویت شما در «${association.name}» ثبت و جهت تأیید به کارتابل امور فرهنگی ارسال شد.`,
      membership,
    };
  },

  reviewAssociationMembership: (
    membershipId: string,
    decision: 'approved' | 'rejected',
    reviewerName: string,
    reviewNote?: string
  ): { success: boolean; message: string } => {
    const list = Storage.getAssociationMemberships();
    const idx = list.findIndex((m) => m.id === membershipId);
    if (idx === -1) return { success: false, message: 'درخواست عضویت یافت نشد.' };
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    list[idx] = {
      ...list[idx],
      status: decision,
      reviewNote: reviewNote?.trim() || undefined,
      reviewedAt: nowStr,
      reviewedBy: reviewerName,
    };
    Storage.setAssociationMemberships(list);

    const messages = Storage.getMessages();
    messages.unshift({
      id: makeUniqueId('msg_cul_mem'),
      senderId: 'cultural',
      senderName: `${reviewerName} (امور فرهنگی)`,
      senderRole: 'cultural',
      receiverType: 'student',
      receiverId: list[idx].studentId,
      subject:
        decision === 'approved'
          ? `تأیید عضویت در «${list[idx].associationName}»`
          : `نتیجه بررسی عضویت در «${list[idx].associationName}»`,
      content:
        decision === 'approved'
          ? `دانشجوی گرامی ${list[idx].studentName}، درخواست عضویت شما در تشکل/انجمن «${list[idx].associationName}» تأیید شد.${
              reviewNote?.trim() ? `\nتوضیحات: ${reviewNote.trim()}` : ''
            }`
          : `دانشجوی گرامی ${list[idx].studentName}، درخواست عضویت شما در تشکل/انجمن «${list[idx].associationName}» مورد تأیید قرار نگرفت.${
              reviewNote?.trim() ? `\nعلت/توضیحات: ${reviewNote.trim()}` : ''
            }`,
      category: 'cultural',
      date: nowStr,
      status: 'answered',
      replies: [],
    });
    Storage.setMessages(messages);

    Storage.addActivityLog({
      category: 'cultural',
      action: decision === 'approved' ? 'تأیید عضویت دانشجو در تشکل' : 'رد درخواست عضویت در تشکل',
      details: `درخواست ${list[idx].studentName} برای عضویت در «${list[idx].associationName}» ${
        decision === 'approved' ? 'تأیید' : 'رد'
      } شد.`,
      targetName: list[idx].associationName,
    });
    return {
      success: true,
      message:
        decision === 'approved'
          ? 'عضویت دانشجو با موفقیت تأیید و پیام اطلاع‌رسانی ارسال شد.'
          : 'درخواست عضویت رد و نتیجه به دانشجو اطلاع داده شد.',
    };
  },

  // -------------------------------------------------------------
  // متدهای مدیریت کاربران امور دانشجویی و تربیت بدنی، انتخابات شورای صنفی و شورای انضباطی
  // -------------------------------------------------------------
  getStudentAffairsStaff: (): StudentAffairsStaff[] =>
    get<StudentAffairsStaff[]>(STORAGE_KEYS.STUDENT_AFFAIRS_STAFF, INITIAL_STUDENT_AFFAIRS_STAFF),

  setStudentAffairsStaff: (staff: StudentAffairsStaff[]): boolean =>
    set(STORAGE_KEYS.STUDENT_AFFAIRS_STAFF, staff),

  addStudentAffairsStaff: (
    staffData: Omit<StudentAffairsStaff, 'id'>
  ): { success: boolean; message: string; staff?: StudentAffairsStaff } => {
    const list = Storage.getStudentAffairsStaff();
    const cleanUsername = normalizeAsciiDigits(staffData.username).toLowerCase();
    if (!cleanUsername) {
      return { success: false, message: 'نام کاربری کارشناس امور دانشجویی نمی‌تواند خالی باشد.' };
    }
    if (list.some((s) => normalizeAsciiDigits(s.username).toLowerCase() === cleanUsername)) {
      return { success: false, message: 'این نام کاربری قبلاً برای کاربر امور دانشجویی دیگری ثبت شده است.' };
    }
    const newStaff: StudentAffairsStaff = {
      ...staffData,
      id: makeUniqueId('sa'),
      username: cleanUsername,
      role: 'student_affairs',
      department: staffData.department?.trim() || 'اداره امور دانشجویی، تربیت بدنی و رفاهی',
      status: staffData.status || 'active',
      isActive: staffData.isActive !== false,
    };
    list.push(newStaff);
    Storage.setStudentAffairsStaff(list);
    Storage.addActivityLog({
      category: 'staff',
      action: 'ثبت کارشناس امور دانشجویی و تربیت بدنی',
      details: `کارشناس امور دانشجویی «${newStaff.fullName}» (${newStaff.username}) در سامانه ثبت شد.`,
      targetName: newStaff.fullName,
    });
    return {
      success: true,
      message: `کارشناس امور دانشجویی «${newStaff.fullName}» با موفقیت افزوده شد.`,
      staff: newStaff,
    };
  },

  updateStudentAffairsStaff: (
    id: string,
    updates: Partial<StudentAffairsStaff>
  ): { success: boolean; message: string } => {
    const list = Storage.getStudentAffairsStaff();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false, message: 'کاربر امور دانشجویی یافت نشد.' };
    const normalizedUpdates = { ...updates };
    if (normalizedUpdates.username !== undefined) {
      const cleanU = normalizeAsciiDigits(normalizedUpdates.username).toLowerCase();
      if (!cleanU) return { success: false, message: 'نام کاربری نمی‌تواند خالی باشد.' };
      if (list.some((sa) => sa.id !== id && normalizeAsciiDigits(sa.username).toLowerCase() === cleanU)) {
        return { success: false, message: 'این نام کاربری قبلاً برای کاربر امور دانشجویی دیگری ثبت شده است.' };
      }
      normalizedUpdates.username = cleanU;
    }
    list[idx] = { ...list[idx], ...normalizedUpdates };
    Storage.setStudentAffairsStaff(list);
    const cu = Storage.getCurrentUser();
    if (cu && cu.role === 'student_affairs' && cu.staff.id === id) {
      Storage.setCurrentUser({ role: 'student_affairs', staff: list[idx] });
    }
    return { success: true, message: 'اطلاعات کارشناس امور دانشجویی با موفقیت بروزرسانی شد.' };
  },

  deleteStudentAffairsStaff: (id: string): { success: boolean; message: string } => {
    const list = Storage.getStudentAffairsStaff();
    const target = list.find((s) => s.id === id);
    Storage.setStudentAffairsStaff(list.filter((s) => s.id !== id));
    if (target) {
      Storage.addActivityLog({
        category: 'staff',
        action: 'حذف کارشناس امور دانشجویی',
        details: `حساب کاربری امور دانشجویی «${target.fullName}» حذف گردید.`,
        targetName: target.fullName,
        severity: 'warning',
      });
    }
    return { success: true, message: 'کارشناس امور دانشجویی با موفقیت حذف گردید.' };
  },

  getGuildElections: (): GuildElection[] =>
    get<GuildElection[]>(STORAGE_KEYS.GUILD_ELECTIONS, INITIAL_GUILD_ELECTIONS),

  setGuildElections: (items: GuildElection[]): boolean =>
    set(STORAGE_KEYS.GUILD_ELECTIONS, items),

  addGuildElection: (
    payload: Omit<GuildElection, 'id' | 'electionCode' | 'createdAt'>
  ): { success: boolean; message: string; election?: GuildElection } => {
    if (!payload.title.trim() || payload.candidates.length === 0) {
      return { success: false, message: 'عنوان انتخابات و معرفی حداقل یک کاندیدا الزامی است.' };
    }
    const items = Storage.getGuildElections();
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const newElection: GuildElection = {
      ...payload,
      id: makeUniqueId('elec'),
      electionCode: `EL-${101 + items.length}`,
      createdAt: nowStr,
      announcedAt: payload.isActiveWindow ? nowStr : undefined,
    };
    items.unshift(newElection);
    Storage.setGuildElections(items);
    Storage.addActivityLog({
      category: 'election',
      action: 'ایجاد دوره انتخابات شورای صنفی',
      details: `انتخابات «${newElection.title}» (${newElection.electionCode}) با ${newElection.candidates.length} کاندیدا ایجاد شد.`,
      targetName: newElection.title,
    });
    return {
      success: true,
      message: `انتخابات «${newElection.title}» با کد ${newElection.electionCode} ثبت شد.`,
      election: newElection,
    };
  },

  updateGuildElection: (
    id: string,
    updates: Partial<GuildElection>
  ): { success: boolean; message: string } => {
    const items = Storage.getGuildElections();
    const idx = items.findIndex((e) => e.id === id);
    if (idx === -1) return { success: false, message: 'دوره انتخابات یافت نشد.' };
    items[idx] = { ...items[idx], ...updates };
    Storage.setGuildElections(items);
    return { success: true, message: 'اطلاعات انتخابات با موفقیت بروزرسانی شد.' };
  },

  toggleGuildElectionWindow: (
    electionId: string,
    isActive: boolean,
    actorName: string,
    publishAnnouncement = true
  ): { success: boolean; message: string } => {
    const items = Storage.getGuildElections();
    const idx = items.findIndex((e) => e.id === electionId);
    if (idx === -1) return { success: false, message: 'دوره انتخابات یافت نشد.' };
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    items[idx] = {
      ...items[idx],
      isActiveWindow: isActive,
      announcedAt: isActive ? nowStr : items[idx].announcedAt,
    };
    Storage.setGuildElections(items);

    if (isActive && publishAnnouncement) {
      const el = items[idx];
      Storage.addAnnouncement({
        title: `فراخوان و آغاز بازه رأی‌گیری: ${el.title}`,
        content:
          (el.noticeText?.trim() ? `${el.noticeText.trim()}\n` : '') +
          `بازه زمانی مجاز رأی‌گیری: ${el.startDate} ${el.startTime || ''} تا ${el.endDate} ${el.endTime || ''}. دانشجویان گرامی می‌توانند از تب «انتخابات شورای صنفی» در کارتابل خود رأی خود را ثبت نمایند.`,
        author: `${actorName} (امور دانشجویی و تربیت بدنی)`,
        targetDormId: 'all',
        priority: 'important',
        date: nowStr,
        pinned: true,
        showOnHomePage: true,
      });
    }

    Storage.addActivityLog({
      category: 'election',
      action: isActive ? 'فعال‌سازی و اطلاع‌رسانی بازه رأی‌گیری شورای صنفی' : 'بستن بازه رأی‌گیری شورای صنفی',
      details: `بازه رأی‌گیری «${items[idx].title}» (${items[idx].electionCode}) توسط ${actorName} ${
        isActive ? 'فعال و اطلاع‌رسانی' : 'بسته'
      } شد.`,
      targetName: items[idx].title,
    });

    return {
      success: true,
      message: isActive
        ? 'بازه رأی‌گیری فعال شد و در صورت انتخاب، اطلاعیه رسمی برای دانشجویان منتشر گردید.'
        : 'بازه رأی‌گیری بسته شد و امکان ثبت رأی جدید متوقف گردید.',
    };
  },

  deleteGuildElection: (id: string): { success: boolean; message: string } => {
    const items = Storage.getGuildElections();
    const target = items.find((e) => e.id === id);
    Storage.setGuildElections(items.filter((e) => e.id !== id));
    const votes = Storage.getGuildElectionVotes();
    Storage.setGuildElectionVotes(votes.filter((v) => v.electionId !== id));
    if (target) {
      Storage.addActivityLog({
        category: 'election',
        action: 'حذف دوره انتخابات شورای صنفی',
        details: `انتخابات «${target.title}» و آرای آن حذف گردید.`,
        targetName: target.title,
        severity: 'warning',
      });
    }
    return { success: true, message: 'دوره انتخابات و آرای مرتبط حذف شد.' };
  },

  getGuildElectionVotes: (): GuildElectionVote[] =>
    get<GuildElectionVote[]>(STORAGE_KEYS.GUILD_ELECTION_VOTES, INITIAL_GUILD_ELECTION_VOTES),

  setGuildElectionVotes: (items: GuildElectionVote[]): boolean =>
    set(STORAGE_KEYS.GUILD_ELECTION_VOTES, items),

  hasStudentVotedInElection: (electionId: string, studentId: string): boolean =>
    Storage.getGuildElectionVotes().some(
      (v) => v.electionId === electionId && v.studentId === studentId
    ),

  castGuildElectionVote: (payload: {
    election: GuildElection;
    student: Student;
    candidateIds: string[];
    dormName?: string;
  }): { success: boolean; message: string; vote?: GuildElectionVote } => {
    const { election, student, candidateIds, dormName } = payload;
    if (!election.isActiveWindow) {
      return {
        success: false,
        message:
          'بازه زمانی رأی‌گیری این انتخابات در حال حاضر توسط واحد امور دانشجویی فعال نیست و ثبت رأی امکان‌پذیر نمی‌باشد.',
      };
    }
    const isDormResident = Boolean(student.assignedBedId && student.assignmentStatus !== 'none');
    if (election.targetEligibility === 'dorm_only' && !isDormResident) {
      return {
        success: false,
        message: 'این انتخابات ویژه دانشجویان خوابگاهی تعریف شده است.',
      };
    }
    const uniqueSelected = Array.from(new Set(candidateIds)).filter((cid) =>
      election.candidates.some((c) => c.id === cid)
    );
    if (uniqueSelected.length === 0) {
      return { success: false, message: 'لطفاً حداقل یک کاندیدا را انتخاب نمایید.' };
    }
    if (uniqueSelected.length > Math.max(1, election.maxSelections)) {
      return {
        success: false,
        message: `حداکثر تعداد انتخاب مجاز در این انتخابات ${election.maxSelections} نفر است.`,
      };
    }
    const votes = Storage.getGuildElectionVotes();
    if (votes.some((v) => v.electionId === election.id && v.studentId === student.studentId)) {
      return { success: false, message: 'رأی شما پیش‌تر در این انتخابات ثبت شده است.' };
    }

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const newVote: GuildElectionVote = {
      id: makeUniqueId('vote'),
      electionId: election.id,
      studentId: student.studentId,
      studentName: student.fullName,
      isDormResident,
      dormName: dormName || student.assignedDormName || undefined,
      candidateIds: uniqueSelected,
      castAt: nowStr,
    };
    votes.unshift(newVote);
    Storage.setGuildElectionVotes(votes);
    Storage.addActivityLog({
      category: 'election',
      action: 'ثبت رأی دانشجو در انتخابات شورای صنفی',
      details: `رأی دانشجو در انتخابات «${election.title}» (${election.electionCode}) ثبت گردید.`,
      targetName: election.title,
      actorName: student.fullName,
      actorRole: 'student',
      actorUsername: student.studentId,
    });
    return {
      success: true,
      message: 'رأی شما با موفقیت در صندوق الکترونیکی انتخابات شورای صنفی ثبت گردید.',
      vote: newVote,
    };
  },

  // معرفی دانشجویان متخلف به شورای انضباطی نزد امور دانشجویی و مدیریت جلسات شورا
  getDisciplinaryReferrals: (): DisciplinaryReferral[] =>
    get<DisciplinaryReferral[]>(STORAGE_KEYS.DISCIPLINARY_REFERRALS, INITIAL_DISCIPLINARY_REFERRALS),

  setDisciplinaryReferrals: (items: DisciplinaryReferral[]): boolean =>
    set(STORAGE_KEYS.DISCIPLINARY_REFERRALS, items),

  createDisciplinaryReferral: (payload: {
    students: Student[];
    dorm?: Dormitory;
    room?: Room;
    violationType: DisciplinaryViolationType;
    violationLabel?: string;
    referralText: string;
    referredById: string;
    referredByName: string;
    referredByRole: 'supervisor' | 'admin';
    notifyStudentInbox?: boolean;
  }): { success: boolean; message: string; referrals?: DisciplinaryReferral[] } => {
    if (!payload.students || payload.students.length === 0) {
      return { success: false, message: 'حداقل یک دانشجو برای معرفی به شورای انضباطی باید انتخاب شود.' };
    }
    if (!payload.referralText.trim()) {
      return { success: false, message: 'متن معرفی‌نامه تخلف انضباطی نمی‌تواند خالی باشد.' };
    }

    const list = Storage.getDisciplinaryReferrals();
    const dorms = Storage.getDormitories();
    const rooms = Storage.getRooms();
    const preset = DISCIPLINARY_VIOLATION_PRESETS.find((p) => p.type === payload.violationType);
    const resolvedLabel = payload.violationLabel?.trim() || preset?.label || 'تخلف انضباطی';
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const created: DisciplinaryReferral[] = [];

    payload.students.forEach((st, idx) => {
      const stDorm = payload.dorm || dorms.find((d) => d.id === st.assignedDormId);
      const stRoom = payload.room || rooms.find((r) => r.id === st.assignedRoomId);
      const isDormResident = Boolean(st.assignedBedId && st.assignmentStatus !== 'none');

      const ref: DisciplinaryReferral = {
        id: makeUniqueId('dref'),
        referralCode: `DC-${101 + list.length + idx}`,
        studentId: st.studentId,
        studentName: st.fullName,
        studentNationalId: st.nationalId,
        studentMobile: st.mobile,
        studentFieldOfStudy: st.fieldOfStudy,
        studentEntryTerm: st.entryTerm,
        isDormResident,
        dormId: stDorm?.id || st.assignedDormId,
        dormName: stDorm?.name || st.assignedDormName,
        roomId: stRoom?.id || st.assignedRoomId,
        roomNumber: stRoom?.roomNumber || st.assignedRoomNumber,
        violationType: payload.violationType,
        violationLabel: resolvedLabel,
        referralText: payload.referralText.trim(),
        referredById: payload.referredById,
        referredByName: payload.referredByName,
        referredByRole: payload.referredByRole,
        referredAt: nowStr,
        status: 'pending_review',
      };
      created.push(ref);
    });

    const updatedList = [...created, ...list];
    Storage.setDisciplinaryReferrals(updatedList);

    if (payload.notifyStudentInbox !== false) {
      const messages = Storage.getMessages();
      created.forEach((ref) => {
        messages.unshift({
          id: makeUniqueId('msg_disc_ref'),
          senderId: payload.referredById || payload.referredByRole,
          senderName: payload.referredByName,
          senderRole: payload.referredByRole,
          receiverType: 'student',
          receiverId: ref.studentId,
          subject: `ابلاغ معرفی به شورای انضباطی (${ref.referralCode})`,
          content: `دانشجوی گرامی ${ref.studentName}، پرونده شما با موضوع «${ref.violationLabel}» جهت تشکیل جلسه و بررسی به شورای انضباطی (واحد امور دانشجویی) معرفی گردید.\nشرح گزارش:\n${ref.referralText}`,
          category: 'discipline',
          date: nowStr,
          status: 'answered',
          replies: [],
        });
      });
      Storage.setMessages(messages);
    }

    Storage.addActivityLog({
      category: 'disciplinary',
      action: 'معرفی دانشجو به شورای انضباطی (امور دانشجویی)',
      details: `${created.length} دانشجو (${created.map((c) => c.studentName).join('، ')}) با موضوع «${resolvedLabel}» توسط ${payload.referredByName} به کارتابل امور دانشجویی معرفی شد.`,
      targetName: created.length === 1 ? created[0].studentName : `${created.length} دانشجو`,
      severity: 'warning',
      actorName: payload.referredByName,
      actorRole: payload.referredByRole,
    });

    return {
      success: true,
      message: `${created.length} معرفی‌نامه شورای انضباطی با موفقیت به کارتابل امور دانشجویی ارسال شد.`,
      referrals: created,
    };
  },

  updateDisciplinaryReferral: (
    id: string,
    updates: Partial<DisciplinaryReferral>,
    actorName = 'واحد امور دانشجویی',
    notifyStudent = false
  ): { success: boolean; message: string } => {
    const list = Storage.getDisciplinaryReferrals();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) return { success: false, message: 'پرونده ارجاعی یافت نشد.' };
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    list[idx] = {
      ...list[idx],
      ...updates,
      handledByStaffName: actorName,
      updatedAt: nowStr,
    };
    Storage.setDisciplinaryReferrals(list);

    if (notifyStudent) {
      const ref = list[idx];
      const statusFa: Record<DisciplinaryReferralStatus, string> = {
        pending_review: 'در انتظار بررسی',
        session_scheduled: 'تعیین وقت جلسه شورای انضباطی',
        verdict_issued: 'صدور رأی / تصمیم شورای انضباطی',
        closed: 'مختومه‌شده',
      };
      const messages = Storage.getMessages();
      messages.unshift({
        id: makeUniqueId('msg_disc_upd'),
        senderId: 'student_affairs',
        senderName: `${actorName} (امور دانشجویی و شورای انضباطی)`,
        senderRole: 'student_affairs',
        receiverType: 'student',
        receiverId: ref.studentId,
        subject: `وضعیت پرونده شورای انضباطی ${ref.referralCode}: ${statusFa[ref.status]}`,
        content:
          `دانشجوی گرامی ${ref.studentName}، آخرین وضعیت پرونده انضباطی شما (${ref.referralCode}):\n` +
          `وضعیت: ${statusFa[ref.status]}` +
          (ref.sessionDate ? `\nتاریخ و ساعت جلسه: ${ref.sessionDate} ${ref.sessionTime || ''}` : '') +
          (ref.sessionLocation ? `\nمحل برگزاری: ${ref.sessionLocation}` : '') +
          (ref.verdict ? `\nرأی / تصمیم شورا: ${ref.verdict}` : '') +
          (ref.councilNotes ? `\nتوضیحات شورا: ${ref.councilNotes}` : ''),
        category: 'student_affairs',
        date: nowStr,
        status: 'answered',
        replies: [],
      });
      Storage.setMessages(messages);
    }

    Storage.addActivityLog({
      category: 'disciplinary',
      action: 'بروزرسانی پرونده شورای انضباطی',
      details: `پرونده ${list[idx].referralCode} (${list[idx].studentName}) توسط ${actorName} بروزرسانی شد.`,
      targetName: list[idx].studentName,
    });
    return { success: true, message: 'پرونده شورای انضباطی با موفقیت بروزرسانی شد.' };
  },

  deleteDisciplinaryReferral: (id: string): { success: boolean; message: string } => {
    const list = Storage.getDisciplinaryReferrals();
    Storage.setDisciplinaryReferrals(list.filter((r) => r.id !== id));
    return { success: true, message: 'پرونده ارجاعی حذف شد.' };
  },

  // -------------------------------------------------------------
  // برنامه‌ریزی ورزشی و تربیت بدنی (کارتابل امور دانشجویی و تربیت بدنی)
  // -------------------------------------------------------------
  getSportsPrograms: (): SportsProgram[] =>
    get<SportsProgram[]>(STORAGE_KEYS.SPORTS_PROGRAMS, INITIAL_SPORTS_PROGRAMS),

  setSportsPrograms: (items: SportsProgram[]): boolean =>
    set(STORAGE_KEYS.SPORTS_PROGRAMS, items),

  addSportsProgram: (payload: {
    title: string;
    sportType: SportsProgramType;
    programKind: SportsProgramKind;
    genderScope: 'all' | 'brothers' | 'sisters';
    dormId: string;
    dormName: string;
    dayOfWeek?: SportsProgram['dayOfWeek'];
    scheduleDate?: string;
    startTime: string;
    endTime: string;
    venue: string;
    coachName?: string;
    maxCapacity?: number;
    eligibility?: string;
    equipmentNeeded?: string;
    description?: string;
    status?: SportsProgramStatus;
    isPublishedToStudents?: boolean;
    createdById: string;
    createdByName: string;
  }): { success: boolean; message: string; program?: SportsProgram } => {
    if (!payload.title.trim() || !payload.venue.trim()) {
      return { success: false, message: 'عنوان برنامه ورزشی و مکان برگزاری الزامی است.' };
    }
    const list = Storage.getSportsPrograms();
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const newProgram: SportsProgram = {
      id: makeUniqueId('sp'),
      programCode: `SP-${101 + list.length}`,
      title: payload.title.trim(),
      sportType: payload.sportType,
      programKind: payload.programKind,
      genderScope: payload.genderScope,
      dormId: payload.dormId || 'all',
      dormName: payload.dormName || 'کلیه سراها و پردیس',
      dayOfWeek: payload.dayOfWeek,
      scheduleDate: payload.scheduleDate?.trim() || undefined,
      startTime: payload.startTime.trim() || '۱۶:۰۰',
      endTime: payload.endTime.trim() || '۱۷:۳۰',
      venue: payload.venue.trim(),
      coachName: payload.coachName?.trim() || undefined,
      maxCapacity:
        payload.maxCapacity && Number(payload.maxCapacity) > 0
          ? Number(payload.maxCapacity)
          : undefined,
      eligibility: payload.eligibility?.trim() || undefined,
      equipmentNeeded: payload.equipmentNeeded?.trim() || undefined,
      description: payload.description?.trim() || undefined,
      status: payload.status || 'registration_open',
      isPublishedToStudents: payload.isPublishedToStudents !== false,
      createdById: payload.createdById,
      createdByName: payload.createdByName,
      createdAt: nowStr,
    };
    list.unshift(newProgram);
    Storage.setSportsPrograms(list);
    Storage.addActivityLog({
      category: 'sports',
      action: 'ثبت برنامه ورزشی و تربیت بدنی جدید',
      details: `برنامه «${newProgram.title}» (${newProgram.programCode}) در ${newProgram.venue} توسط ${payload.createdByName} ثبت شد.`,
      targetName: newProgram.title,
      actorName: payload.createdByName,
      actorRole: 'student_affairs',
    });
    return {
      success: true,
      message: `برنامه ورزشی «${newProgram.title}» با کد ${newProgram.programCode} با موفقیت ثبت شد.`,
      program: newProgram,
    };
  },

  updateSportsProgram: (
    id: string,
    updates: Partial<SportsProgram>,
    actorName = 'امور دانشجویی و تربیت بدنی'
  ): { success: boolean; message: string } => {
    const list = Storage.getSportsPrograms();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false, message: 'برنامه ورزشی یافت نشد.' };
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    list[idx] = {
      ...list[idx],
      ...updates,
      updatedAt: nowStr,
    };
    Storage.setSportsPrograms(list);

    if (updates.title && updates.title.trim()) {
      const regs = Storage.getSportsRegistrations();
      let regsChanged = false;
      regs.forEach((r) => {
        if (r.programId === id && r.programTitle !== updates.title!.trim()) {
          r.programTitle = updates.title!.trim();
          regsChanged = true;
        }
      });
      if (regsChanged) Storage.setSportsRegistrations(regs);
    }

    Storage.addActivityLog({
      category: 'sports',
      action: 'بروزرسانی برنامه ورزشی',
      details: `برنامه «${list[idx].title}» (${list[idx].programCode}) توسط ${actorName} بروزرسانی شد.`,
      targetName: list[idx].title,
      actorName,
      actorRole: 'student_affairs',
    });
    return { success: true, message: 'برنامه ورزشی با موفقیت بروزرسانی شد.' };
  },

  toggleSportsProgramPublish: (
    id: string,
    isPublishedToStudents: boolean,
    actorName = 'امور دانشجویی و تربیت بدنی'
  ): { success: boolean; message: string } => {
    return Storage.updateSportsProgram(id, { isPublishedToStudents }, actorName);
  },

  deleteSportsProgram: (id: string): { success: boolean; message: string } => {
    const list = Storage.getSportsPrograms();
    const target = list.find((p) => p.id === id);
    Storage.setSportsPrograms(list.filter((p) => p.id !== id));
    const regs = Storage.getSportsRegistrations();
    Storage.setSportsRegistrations(regs.filter((r) => r.programId !== id));
    if (target) {
      Storage.addActivityLog({
        category: 'sports',
        action: 'حذف برنامه ورزشی',
        details: `برنامه ورزشی «${target.title}» (${target.programCode}) حذف گردید.`,
        targetName: target.title,
        severity: 'warning',
        actorRole: 'student_affairs',
      });
    }
    return { success: true, message: 'برنامه ورزشی و ثبت‌نام‌های مرتبط حذف گردید.' };
  },

  getSportsRegistrations: (): SportsRegistration[] =>
    get<SportsRegistration[]>(STORAGE_KEYS.SPORTS_REGISTRATIONS, INITIAL_SPORTS_REGISTRATIONS),

  setSportsRegistrations: (items: SportsRegistration[]): boolean =>
    set(STORAGE_KEYS.SPORTS_REGISTRATIONS, items),

  registerForSportsProgram: (payload: {
    program: SportsProgram;
    student: Student;
    dormName?: string;
    roomNumber?: string;
    skillLevel?: SportsRegistration['skillLevel'];
    healthConfirmed: boolean;
    note?: string;
  }): { success: boolean; message: string; registration?: SportsRegistration } => {
    const { program, student, dormName, roomNumber, skillLevel, healthConfirmed, note } = payload;
    if (!program.isPublishedToStudents || program.status === 'cancelled' || program.status === 'completed') {
      return { success: false, message: 'امکان ثبت‌نام در این برنامه ورزشی در حال حاضر فعال نیست.' };
    }
    if (program.status === 'planned') {
      return { success: false, message: 'ثبت‌نام این برنامه هنوز آغاز نشده است.' };
    }
    if (!healthConfirmed) {
      return { success: false, message: 'تأیید آمادگی جسمانی و سلامت برای ثبت‌نام ورزشی الزامی است.' };
    }

    const regs = Storage.getSportsRegistrations();
    const existingActive = regs.find(
      (r) => r.programId === program.id && r.studentId === student.studentId && r.status !== 'cancelled'
    );
    if (existingActive) {
      return { success: false, message: 'شما پیش‌تر در این برنامه ورزشی ثبت‌نام کرده‌اید.' };
    }

    const activeCount = regs.filter(
      (r) => r.programId === program.id && r.status !== 'cancelled'
    ).length;
    if (program.maxCapacity && program.maxCapacity > 0 && activeCount >= program.maxCapacity) {
      return { success: false, message: 'ظرفیت این برنامه ورزشی تکمیل شده است.' };
    }

    const isDormResident = Boolean(student.assignedBedId && student.assignmentStatus !== 'none');
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const newReg: SportsRegistration = {
      id: makeUniqueId('spreg'),
      programId: program.id,
      programTitle: program.title,
      studentId: student.studentId,
      studentName: student.fullName,
      studentNationalId: student.nationalId,
      studentMobile: student.mobile || student.phone,
      studentFieldOfStudy: student.fieldOfStudy,
      studentEntryTerm: student.entryTerm,
      isDormResident,
      dormName: dormName || student.assignedDormName || undefined,
      roomNumber: roomNumber || student.assignedRoomNumber || undefined,
      skillLevel: skillLevel || 'beginner',
      healthConfirmed: true,
      note: note?.trim() || undefined,
      status: 'registered',
      registeredAt: nowStr,
    };
    regs.unshift(newReg);
    Storage.setSportsRegistrations(regs);
    Storage.addActivityLog({
      category: 'sports',
      action: 'ثبت‌نام دانشجو در برنامه ورزشی',
      details: `دانشجو ${student.fullName} در برنامه «${program.title}» (${program.programCode}) ثبت‌نام کرد.`,
      targetName: program.title,
      actorName: student.fullName,
      actorRole: 'student',
      actorUsername: student.studentId,
    });
    return {
      success: true,
      message: `ثبت‌نام شما در برنامه ورزشی «${program.title}» با موفقیت انجام شد.`,
      registration: newReg,
    };
  },

  cancelSportsRegistration: (
    programId: string,
    studentId: string
  ): { success: boolean; message: string } => {
    const regs = Storage.getSportsRegistrations();
    const idx = regs.findIndex(
      (r) => r.programId === programId && r.studentId === studentId && r.status !== 'cancelled'
    );
    if (idx === -1) return { success: false, message: 'ثبت‌نام فعالی برای لغو یافت نشد.' };
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    regs[idx] = { ...regs[idx], status: 'cancelled', updatedAt: nowStr };
    Storage.setSportsRegistrations(regs);
    return { success: true, message: 'انصراف شما از برنامه ورزشی ثبت شد.' };
  },

  updateSportsRegistrationStatus: (
    regId: string,
    status: SportsRegistrationStatus
  ): { success: boolean; message: string } => {
    const regs = Storage.getSportsRegistrations();
    const idx = regs.findIndex((r) => r.id === regId);
    if (idx === -1) return { success: false, message: 'رکورد ثبت‌نام یافت نشد.' };
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    regs[idx] = { ...regs[idx], status, updatedAt: nowStr };
    Storage.setSportsRegistrations(regs);
    return { success: true, message: 'وضعیت حضور و ثبت‌نام دانشجو بروزرسانی شد.' };
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
        safeLocalStorageSet(STORAGE_KEYS.STUDENTS, JSON.stringify(cleanStudents), cleanStudents);
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
      const savedStudent = normalizeStudentRecord(rawReturned);

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
    role: 'student' | 'supervisor' | 'maintenance' | 'warehouse' | 'counselor' | 'finance' | 'procurement' | 'education' | 'cultural' | 'student_affairs' | 'security',
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
    role: 'student' | 'supervisor' | 'maintenance' | 'warehouse' | 'counselor' | 'finance' | 'procurement' | 'education' | 'cultural' | 'student_affairs' | 'security',
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
    flushAllPendingCloudTimers(false);
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
      flushAllPendingCloudTimers(false);
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

        let hasRemoteChanges = false;
        let cloudMap: Record<string, unknown> | null = null;

        if (syncResult.status === 'fulfilled' && syncResult.value.ok) {
          const parsed = await syncResult.value.json();
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            cloudMap = parsed as Record<string, unknown>;

            for (const [key, val] of Object.entries(cloudMap)) {
              if (!SYNCABLE_KEYS.includes(key)) continue;
              if (val === undefined || val === null) continue;
              if (pendingCloudRequests[key] || pendingCloudTimers[key] !== undefined) continue;
              const lastLocalWrite = keyWriteTimestamps[key] || 0;
              if (Date.now() - lastLocalWrite < 5000) continue;
              const serialized = JSON.stringify(val);
              if (localStorage.getItem(key) !== serialized) {
                safeLocalStorageSet(key, serialized, val);
                hasRemoteChanges = true;
              }
            }
          }
        }

        if (studentsResult.status === 'fulfilled' && studentsResult.value.ok) {
          const rawStudents = await studentsResult.value.json();
          if (Array.isArray(rawStudents)) {
            const lastStudentWrite = keyWriteTimestamps[STORAGE_KEYS.STUDENTS] || 0;
            if (
              !pendingCloudRequests[STORAGE_KEYS.STUDENTS] &&
              pendingCloudTimers[STORAGE_KEYS.STUDENTS] === undefined &&
              Date.now() - lastStudentWrite >= 5000
            ) {
              const cleanStudents: Student[] = rawStudents.map((item: Record<string, unknown>) =>
                normalizeStudentRecord(item)
              );

              const cloudSyncStudents = cloudMap?.[STORAGE_KEYS.STUDENTS];
              if (!Array.isArray(cloudSyncStudents) && cleanStudents.length > 0) {
                const serializedStudents = JSON.stringify(cleanStudents);
                if (localStorage.getItem(STORAGE_KEYS.STUDENTS) !== serializedStudents) {
                  safeLocalStorageSet(STORAGE_KEYS.STUDENTS, serializedStudents, cleanStudents);
                  hasRemoteChanges = true;
                }
              }
            }
          }
        }

        return hasRemoteChanges;
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

  authenticateStaffByCredentials: (
    rawUsername: string,
    rawPassword: string
  ): {
    success: boolean;
    message?: string;
    user?: NonNullable<CurrentUser>;
    roleLabel?: string;
  } => {
    const normalizeDigits = (val: string) =>
      String(val || '')
        .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
        .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
        .trim();

    const cleanU = normalizeDigits(rawUsername).toLowerCase();
    const cleanP = normalizeDigits(rawPassword);

    if (!cleanU || !cleanP) {
      return {
        success: false,
        message: 'لطفاً نام کاربری و کلمه عبور خود را وارد نمایید.',
      };
    }

    type StaffCandidate = {
      role:
        | 'supervisor'
        | 'counselor'
        | 'maintenance'
        | 'warehouse'
        | 'procurement'
        | 'finance'
        | 'education'
        | 'cultural'
        | 'student_affairs'
        | 'security';
      roleLabel: string;
      fullName: string;
      username: string;
      password: string;
      isInactive: boolean;
      user: NonNullable<CurrentUser>;
    };

    const candidates: StaffCandidate[] = [
      ...Storage.getSupervisors().map((s) => ({
        role: 'supervisor' as const,
        roleLabel: 'سرپرست سرا',
        fullName: s.fullName,
        username: s.username,
        password: s.password,
        isInactive: false,
        user: { role: 'supervisor' as const, supervisor: s },
      })),
      ...Storage.getCounselors().map((c) => ({
        role: 'counselor' as const,
        roleLabel: 'کارشناس مشاور و روانشناس',
        fullName: c.fullName,
        username: c.username,
        password: c.password,
        isInactive: c.status === 'inactive' || c.isActive === false,
        user: { role: 'counselor' as const, counselor: c },
      })),
      ...Storage.getMaintenanceStaff().map((m) => ({
        role: 'maintenance' as const,
        roleLabel: 'کارشناس تأسیسات و فنی',
        fullName: m.fullName,
        username: m.username,
        password: m.password,
        isInactive: m.status === 'inactive' || m.isActive === false,
        user: { role: 'maintenance' as const, technician: m },
      })),
      ...Storage.getWarehouseStaff().map((w) => ({
        role: 'warehouse' as const,
        roleLabel: 'مسئول انبار و تجهیزات',
        fullName: w.fullName,
        username: w.username,
        password: w.password,
        isInactive: w.status === 'inactive' || w.isActive === false,
        user: { role: 'warehouse' as const, staff: w },
      })),
      ...Storage.getProcurementStaff().map((p) => ({
        role: 'procurement' as const,
        roleLabel: 'کارپرداز و خرید',
        fullName: p.fullName,
        username: p.username,
        password: p.password,
        isInactive: p.status === 'inactive' || p.isActive === false,
        user: { role: 'procurement' as const, staff: p },
      })),
      ...Storage.getFinanceStaff().map((f) => ({
        role: 'finance' as const,
        roleLabel: 'امور مالی و حسابداری',
        fullName: f.fullName,
        username: f.username,
        password: f.password,
        isInactive: f.status === 'inactive' || f.isActive === false,
        user: { role: 'finance' as const, staff: f },
      })),
      ...Storage.getEducationStaff().map((e) => ({
        role: 'education' as const,
        roleLabel: 'کارشناس آموزش',
        fullName: e.fullName,
        username: e.username,
        password: e.password,
        isInactive: e.status === 'inactive' || e.isActive === false,
        user: { role: 'education' as const, staff: e },
      })),
      ...Storage.getCulturalStaff().map((c) => ({
        role: 'cultural' as const,
        roleLabel: 'کارشناس امور فرهنگی',
        fullName: c.fullName,
        username: c.username,
        password: c.password,
        isInactive: c.status === 'inactive' || c.isActive === false,
        user: { role: 'cultural' as const, staff: c },
      })),
      ...Storage.getStudentAffairsStaff().map((sa) => ({
        role: 'student_affairs' as const,
        roleLabel: 'امور دانشجویی و تربیت بدنی',
        fullName: sa.fullName,
        username: sa.username,
        password: sa.password,
        isInactive: sa.status === 'inactive' || sa.isActive === false,
        user: { role: 'student_affairs' as const, staff: sa },
      })),
      ...Storage.getSecurityStaff().map((sec) => ({
        role: 'security' as const,
        roleLabel: 'حراست و انتظامات',
        fullName: sec.fullName,
        username: sec.username,
        password: sec.password,
        isInactive: sec.status === 'inactive' || sec.isActive === false,
        user: { role: 'security' as const, staff: sec },
      })),
    ];

    const matched = candidates.filter(
      (c) =>
        normalizeDigits(c.username).toLowerCase() === cleanU &&
        normalizeDigits(c.password) === cleanP
    );

    const activeMatch = matched.find((m) => !m.isInactive);
    if (activeMatch) {
      Storage.addActivityLog({
        category: 'auth',
        action: `ورود موفق ${activeMatch.roleLabel}`,
        details: `${activeMatch.roleLabel} ${activeMatch.fullName} (${activeMatch.username}) از بخش ورود کارکنان وارد سامانه شد.`,
        targetName: activeMatch.fullName,
        actorName: activeMatch.fullName,
        actorRole: activeMatch.role,
        actorUsername: activeMatch.username,
      });
      return {
        success: true,
        user: activeMatch.user,
        roleLabel: activeMatch.roleLabel,
      };
    }

    const inactiveMatch = matched.find((m) => m.isInactive);
    if (inactiveMatch) {
      Storage.addActivityLog({
        category: 'auth',
        action: `تلاش ورود حساب غیرفعال ${inactiveMatch.roleLabel}`,
        details: `${inactiveMatch.roleLabel} ${inactiveMatch.fullName} (${inactiveMatch.username}) با حساب غیرفعال تلاش به ورود کرد.`,
        targetName: inactiveMatch.fullName,
        severity: 'warning',
        actorName: inactiveMatch.fullName,
        actorRole: inactiveMatch.role,
        actorUsername: inactiveMatch.username,
      });
      return {
        success: false,
        message: `حساب کاربری ${inactiveMatch.roleLabel} غیرفعال است. لطفاً با مدیر سامانه تماس بگیرید.`,
      };
    }

    if (cleanU === 'admin') {
      return {
        success: false,
        message: 'حساب مدیریت کل در بخش «مدیر» قرار دارد. لطفاً تب «مدیر» را انتخاب نمایید.',
      };
    }

    Storage.addActivityLog({
      category: 'auth',
      action: 'تلاش ناموفق ورود کارکنان',
      details: `تلاش ناموفق ورود کارکنان با نام کاربری «${cleanU || '-'}» ثبت شد.`,
      targetName: cleanU || '-',
      severity: 'warning',
      actorName: 'کاربر مهمان',
      actorRole: 'system',
      actorUsername: cleanU,
    });

    return {
      success: false,
      message: 'نام کاربری یا کلمه عبور کارکنان نادرست است.',
    };
  },

  // -------------------------------------------------------------
  // متدهای مدیریت کاربران حراست و انتظامات و گزارش‌های ارسالی به حراست
  // -------------------------------------------------------------
  getSecurityStaff: (): SecurityStaff[] =>
    get<SecurityStaff[]>(STORAGE_KEYS.SECURITY_STAFF, INITIAL_SECURITY_STAFF),

  setSecurityStaff: (staff: SecurityStaff[]): boolean =>
    set(STORAGE_KEYS.SECURITY_STAFF, staff),

  addSecurityStaff: (
    staffData: Omit<SecurityStaff, 'id'>
  ): { success: boolean; message: string; staff?: SecurityStaff } => {
    const list = Storage.getSecurityStaff();
    const cleanUsername = normalizeAsciiDigits(staffData.username).toLowerCase();
    if (!cleanUsername) {
      return { success: false, message: 'نام کاربری کارشناس حراست نمی‌تواند خالی باشد.' };
    }
    if (list.some((s) => normalizeAsciiDigits(s.username).toLowerCase() === cleanUsername)) {
      return { success: false, message: 'این نام کاربری قبلاً برای کاربر حراست دیگری ثبت شده است.' };
    }
    const newStaff: SecurityStaff = {
      ...staffData,
      id: makeUniqueId('sec'),
      username: cleanUsername,
      role: 'security',
      department: staffData.department?.trim() || 'واحد حراست و انتظامات پردیس / سراها',
      status: staffData.status || 'active',
      isActive: staffData.isActive !== false,
    };
    list.push(newStaff);
    Storage.setSecurityStaff(list);
    Storage.addActivityLog({
      category: 'staff',
      action: 'ثبت کارشناس حراست و انتظامات',
      details: `کارشناس حراست «${newStaff.fullName}» (${newStaff.username}) در سامانه ثبت شد.`,
      targetName: newStaff.fullName,
    });
    return {
      success: true,
      message: `کارشناس حراست «${newStaff.fullName}» با موفقیت افزوده شد.`,
      staff: newStaff,
    };
  },

  updateSecurityStaff: (
    id: string,
    updates: Partial<SecurityStaff>
  ): { success: boolean; message: string } => {
    const list = Storage.getSecurityStaff();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false, message: 'کاربر حراست یافت نشد.' };
    const normalizedUpdates = { ...updates };
    if (normalizedUpdates.username !== undefined) {
      const cleanU = normalizeAsciiDigits(normalizedUpdates.username).toLowerCase();
      if (!cleanU) return { success: false, message: 'نام کاربری نمی‌تواند خالی باشد.' };
      if (list.some((s) => s.id !== id && normalizeAsciiDigits(s.username).toLowerCase() === cleanU)) {
        return { success: false, message: 'این نام کاربری قبلاً برای کاربر حراست دیگری ثبت شده است.' };
      }
      normalizedUpdates.username = cleanU;
    }
    list[idx] = { ...list[idx], ...normalizedUpdates };
    Storage.setSecurityStaff(list);
    const cu = Storage.getCurrentUser();
    if (cu && cu.role === 'security' && cu.staff.id === id) {
      Storage.setCurrentUser({ role: 'security', staff: list[idx] });
    }
    return { success: true, message: 'اطلاعات کارشناس حراست با موفقیت بروزرسانی شد.' };
  },

  deleteSecurityStaff: (id: string): { success: boolean; message: string } => {
    const list = Storage.getSecurityStaff();
    const target = list.find((s) => s.id === id);
    Storage.setSecurityStaff(list.filter((s) => s.id !== id));
    if (target) {
      Storage.addActivityLog({
        category: 'staff',
        action: 'حذف کارشناس حراست',
        details: `حساب کاربری حراست «${target.fullName}» حذف گردید.`,
        targetName: target.fullName,
        severity: 'warning',
      });
    }
    return { success: true, message: 'کارشناس حراست با موفقیت حذف گردید.' };
  },

  getSecurityReports: (): SecurityReport[] =>
    get<SecurityReport[]>(STORAGE_KEYS.SECURITY_REPORTS, INITIAL_SECURITY_REPORTS),

  setSecurityReports: (items: SecurityReport[]): boolean =>
    set(STORAGE_KEYS.SECURITY_REPORTS, items),

  createSecurityReport: (payload: {
    students: Student[];
    title: string;
    category: SecurityReportCategory;
    categoryLabel?: string;
    severity: SecurityReportSeverity;
    dormId?: string;
    dormName?: string;
    roomNumber?: string;
    locationDetails?: string;
    incidentDate?: string;
    description: string;
    reportedById: string;
    reportedByName: string;
    reportedByRole: 'supervisor' | 'admin' | 'maintenance' | 'student_affairs';
  }): { success: boolean; message: string; report?: SecurityReport } => {
    if (!payload.students || payload.students.length === 0) {
      return { success: false, message: 'لطفاً حداقل یک دانشجو برای ارسال گزارش به حراست انتخاب نمایید.' };
    }
    if (!payload.title.trim() || !payload.description.trim()) {
      return { success: false, message: 'عنوان و شرح کامل گزارش به حراست الزامی است.' };
    }

    const list = Storage.getSecurityReports();
    const dorms = Storage.getDormitories();
    const rooms = Storage.getRooms();
    const dormMap = new Map(dorms.map((d) => [d.id, d.name]));
    const roomMap = new Map(rooms.map((r) => [r.id, r.roomNumber]));
    const preset = SECURITY_REPORT_PRESETS.find((p) => p.category === payload.category);
    const resolvedCategoryLabel = payload.categoryLabel?.trim() || preset?.label || 'گزارش حفاظتی';

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const snapshots: SecurityReportStudentSnapshot[] = payload.students.map((st) => ({
      studentId: st.studentId,
      fullName: st.fullName,
      nationalId: st.nationalId,
      mobile: st.mobile,
      fieldOfStudy: st.fieldOfStudy,
      entryTerm: st.entryTerm,
      dormName: (st.assignedDormId ? dormMap.get(st.assignedDormId) : undefined) || st.assignedDormName || 'فاقد سرا',
      roomNumber: (st.assignedRoomId ? roomMap.get(st.assignedRoomId) : undefined) || st.assignedRoomNumber || '-',
    }));

    const firstSnap = snapshots[0];
    const resolvedDormName =
      payload.dormName?.trim() ||
      (payload.dormId ? dormMap.get(payload.dormId) : undefined) ||
      (firstSnap?.dormName && firstSnap.dormName !== 'فاقد سرا' ? firstSnap.dormName : 'سراهای دانشجویی');

    const newReport: SecurityReport = {
      id: makeUniqueId('secrep'),
      reportCode: `SEC-${101 + list.length}`,
      title: payload.title.trim(),
      category: payload.category,
      categoryLabel: resolvedCategoryLabel,
      severity: payload.severity,
      dormId: payload.dormId || payload.students[0]?.assignedDormId,
      dormName: resolvedDormName,
      roomNumber: payload.roomNumber?.trim() || (firstSnap?.roomNumber !== '-' ? firstSnap?.roomNumber : undefined),
      locationDetails: payload.locationDetails?.trim() || undefined,
      incidentDate: payload.incidentDate?.trim() || new Date().toLocaleDateString('fa-IR'),
      description: payload.description.trim(),
      studentIds: snapshots.map((s) => s.studentId),
      studentsSnapshot: snapshots,
      reportedById: payload.reportedById,
      reportedByName: payload.reportedByName,
      reportedByRole: payload.reportedByRole,
      reportedAt: nowStr,
      status: 'pending',
    };

    list.unshift(newReport);
    Storage.setSecurityReports(list);

    const roleFa: Record<'supervisor' | 'admin' | 'maintenance' | 'student_affairs', string> = {
      supervisor: 'سرپرست سرا',
      admin: 'مدیر کل سامانه',
      maintenance: 'واحد تأسیسات',
      student_affairs: 'امور دانشجویی',
    };

    Storage.addActivityLog({
      category: 'security',
      action: 'ارسال گزارش جدید به واحد حراست و انتظامات',
      details: `گزارش «${newReport.title}» (${newReport.reportCode}) برای ${snapshots.length} دانشجو (${snapshots.map((s) => s.fullName).slice(0, 4).join('، ')}${snapshots.length > 4 ? ' و...' : ''}) توسط ${payload.reportedByName} (${roleFa[payload.reportedByRole]}) به حراست ارسال شد.`,
      targetName: newReport.reportCode,
      severity: payload.severity === 'urgent' ? 'critical' : 'warning',
      actorName: payload.reportedByName,
      actorRole: payload.reportedByRole,
    });

    return {
      success: true,
      message: `گزارش با کد رهگیری «${newReport.reportCode}» برای ${snapshots.length} دانشجو با موفقیت به واحد حراست ارسال گردید.`,
      report: newReport,
    };
  },

  updateSecurityReport: (
    id: string,
    updates: {
      status?: SecurityReportStatus;
      securityNotes?: string;
      actionTaken?: string;
      reviewedBy?: string;
    }
  ): { success: boolean; message: string } => {
    const list = Storage.getSecurityReports();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) return { success: false, message: 'گزارش مورد نظر یافت نشد.' };

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    list[idx] = {
      ...list[idx],
      ...updates,
      reviewedAt: updates.reviewedBy ? nowStr : list[idx].reviewedAt,
      updatedAt: nowStr,
    };
    Storage.setSecurityReports(list);

    Storage.addActivityLog({
      category: 'security',
      action: 'بروزرسانی و بررسی گزارش حراست',
      details: `وضعیت گزارش ${list[idx].reportCode} توسط ${updates.reviewedBy || 'واحد حراست'} به «${list[idx].status}» تغییر یافت.`,
      targetName: list[idx].reportCode,
    });

    return { success: true, message: `گزارش ${list[idx].reportCode} با موفقیت بروزرسانی شد.` };
  },

  deleteSecurityReport: (id: string): { success: boolean; message: string } => {
    const list = Storage.getSecurityReports();
    const target = list.find((r) => r.id === id);
    Storage.setSecurityReports(list.filter((r) => r.id !== id));
    if (target) {
      Storage.addActivityLog({
        category: 'security',
        action: 'حذف گزارش حراست',
        details: `گزارش حراست ${target.reportCode} («${target.title}») حذف گردید.`,
        targetName: target.reportCode,
        severity: 'warning',
      });
    }
    return { success: true, message: 'گزارش حراست با موفقیت حذف شد.' };
  },
};






