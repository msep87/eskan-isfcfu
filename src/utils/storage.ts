import {
  Student,
  Dormitory,
  Room,
  RoomAssetItem,
  RoomAssetStatus,
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
  WarehouseRequesterRole,
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
  ViceDeanStaff,
  LibraryStaff,
  SmartCampusStaff,
  GraduationStaff,
  AcademicDeputyStaff,
  SchedClassroom,
  SchedProgramCohort,
  SchedProfessor,
  SchedEmploymentType,
  SchedProfessorUnitLimit,
  SchedCurriculumCourse,
  SchedCourseOffering,
  SchedRulesSettings,
  LibraryBook,
  LibraryBookRequest,
  ClearanceUnitRole,
  ClearanceUnitApproval,
  GraduationClearanceRequest,
  AcademicWorkflowRequest,
  AcademicWorkflowRequestCategory,
  AcademicWorkflowStage,
  AcademicWorkflowInitiatorRole,
  AcademicWorkflowTargetMode,
  AcademicWorkflowActorRole,
  AcademicWorkflowStep,
  CommunityChatSettings,
  CommunityForum,
  CommunityForumCategory,
  CommunityResidenceScope,
  CommunityChatMessage,
  CommunityChatRoomType,
  CommunityChatBan,
  CommunityChatReport,
  CommunityUserChatPrefs,
  PublicStudentChatProfile,
  StaffChatDirectoryItem,
  SchedCellComment,
  SchedUserHistoryState,
  SchedProfessorProposal,
  AcademicDegreeLevel,
  ApprovedAcademicMajor,
  AcademicChatRoom,
  AcademicChatMessage,
  AcademicChatParticipant,
  AcademicChatForumTopic,
  AcademicChatMemberRole,
  DormAttendanceStatus,
  DormAttendanceScanMethod,
  DormAttendanceStateRecord,
  DormAttendanceLogEntry,
} from '../types';
import {
  formatProfessorDegreeFull,
  getNextTemporaryProfessorCode,
  getSchedSlotTitle,
  isTemporaryProfessorCode,
  normalizeProfessorCodeInput,
  normalizeSchedCode,
  syncProfessorMetadataInOfferings,
} from './schedulingUtils';
import {
  DEFAULT_ACADEMIC_DEGREE_LEVELS,
  normalizeMajorCode,
  normalizeMajorText,
} from './academicMajors';

export const DEFAULT_COMMON_ROOM_ASSETS: string[] = [
  'یخچال',
  'شوفاژ',
  'کمد دیواری',
  'چوب لباسی',
  'میز مطالعه',
  'صندلی',
  'پرده',
  'موکت / فرش',
  'کولر',
  'آینه',
  'چراغ مطالعه',
  'جاکفشی',
  'سطل زباله',
  'قفل کمد',
];

export function getEffectiveRoomAssets(room: Room): RoomAssetItem[] {
  if (Array.isArray(room.assets)) {
    return room.assets;
  }
  const baseFacilities = Array.isArray(room.facilities) ? room.facilities : [];
  return baseFacilities
    .map((f) => String(f || '').trim())
    .filter(Boolean)
    .map((name, idx) => ({
      id: `asset_${room.id}_${idx}`,
      name,
      quantity: 1,
      status: 'healthy' as RoomAssetStatus,
    }));
}
import {
  DEFAULT_COMMUNITY_CHAT_SETTINGS,
  INITIAL_PUBLIC_FORUM,
  PUBLIC_FORUM_ID,
  makeDmRoomId,
  isStaffDmRoomId,
  isAnonymousDmRoomId,
  getAnonymousDmTargetRole,
  getAnonymousStudentAlias,
} from './communityStickers';
import { getStudentAdmissionStatus, isStudentDormResident } from './financeUtils';
import {
  timingSafeEqual,
  verifyPasswordCompatible,
  sanitizeCurrentUserForStorage,
  validateStoredCurrentUser,
  stripCredentialsFromStaffArray,
  computeAuditChainHash,
} from './securityHardening';
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
  INITIAL_VICE_DEAN_STAFF,
  INITIAL_LIBRARY_STAFF,
  INITIAL_SMART_CAMPUS_STAFF,
  INITIAL_GRADUATION_STAFF,
  INITIAL_ACADEMIC_DEPUTY_STAFF,
  INITIAL_SCHED_CLASSROOMS,
  INITIAL_SCHED_PROGRAMS,
  INITIAL_SCHED_PROFESSORS,
  INITIAL_SCHED_COURSES,
  INITIAL_SCHED_OFFERINGS,
  INITIAL_SCHED_CELL_COMMENTS,
  DEFAULT_SCHED_RULES,
  INITIAL_LIBRARY_BOOKS,
  INITIAL_LIBRARY_BOOK_REQUESTS,
  INITIAL_GRADUATION_CLEARANCES,
  generateInitialRoomsAndBeds,
} from './sampleData';

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL?.trim()) ||
  'https://psbojmuzoekqdvpsugdc.supabase.co';
const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY?.trim()) ||
  'sb_publishable_BMYJ-KKPSy3eBJsGcc9MPA_k0Onu5oJ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const SUPABASE_AVATARS_BUCKET = 'avatars';
const SUPABASE_STUDENTS_UPSERT_CHUNK = 200;
const SUPABASE_STUDENTS_PAGE_SIZE = 1000;
const AVATAR_UPLOAD_CONCURRENCY = 15;

const ENV_SYNC_TOKEN = '';
const API_BASE_URL = SUPABASE_URL;

export type AvatarUploadRole =
  | 'student'
  | 'supervisor'
  | 'maintenance'
  | 'warehouse'
  | 'counselor'
  | 'finance'
  | 'procurement'
  | 'education'
  | 'cultural'
  | 'student_affairs'
  | 'security'
  | 'vice_dean'
  | 'library'
  | 'smart_campus'
  | 'graduation'
  | 'academic_deputy'
  | 'professor';

export const CLEARANCE_UNITS_META: Array<{ role: ClearanceUnitRole; label: string; description: string }> = [
  { role: 'education', label: 'واحد آموزش', description: 'تایید گذراندن کلیه واحدهای درسی و پرونده آموزشی' },
  { role: 'supervisor', label: 'امور سراهای دانشجویی', description: 'تحویل اتاق، تخت، کلید و اموال خوابگاه' },
  { role: 'finance', label: 'امور مالی و حسابداری', description: 'تسویه بدهی، کسورات و صندوق رفاه دانشجویی' },
  { role: 'library', label: 'کتابخانه و پژوهش', description: 'تحویل کتب امانی، جرایم و امور پژوهشی' },
  { role: 'smart_campus', label: 'واحد هوشمندسازی', description: 'تحویل کارت هوشمند، تردد و حساب‌های کاربری' },
  { role: 'student_affairs', label: 'امور دانشجویی و تربیت بدنی', description: 'امور رفاهی، تربیت بدنی و شورای انضباطی' },
  { role: 'cultural', label: 'امور فرهنگی و اجتماعی', description: 'تسویه تشکل‌ها، کانون‌ها و اموال فرهنگی' },
  { role: 'counselor', label: 'مرکز مشاوره و سلامت روان', description: 'بررسی پرونده‌های مشاوره و سلامت روان' },
  { role: 'security', label: 'واحد حراست و انتظامات', description: 'استعلام و تسویه حفاظتی و انتظامات' },
  { role: 'warehouse', label: 'انبار و اموال', description: 'تحویل تجهیزات و اقلام امانی انبار' },
  { role: 'maintenance', label: 'واحد تأسیسات و فنی', description: 'بررسی نبود خسارت به تجهیزات و تأسیسات' },
  { role: 'vice_dean', label: 'معاونت دانشجویی', description: 'تایید نهایی معاونت دانشجویی دانشگاه' },
];

const DISALLOWED_PROTO_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function sanitizePlainValue<T>(value: T, depth = 0): T {
  if (depth > 30 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizePlainValue(item, depth + 1)) as unknown as T;
  }
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (DISALLOWED_PROTO_KEYS.has(k) || k.startsWith('$')) continue;
    clean[k] = sanitizePlainValue(v, depth + 1);
  }
  return clean as T;
}

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
  VICE_DEAN_STAFF: 'farhangian_dorm_vice_dean_staff_prod',
  LIBRARY_STAFF: 'farhangian_dorm_library_staff_prod',
  SMART_CAMPUS_STAFF: 'farhangian_dorm_smart_campus_staff_prod',
  GRADUATION_STAFF: 'farhangian_dorm_graduation_staff_prod',
  ACADEMIC_DEPUTY_STAFF: 'farhangian_dorm_academic_deputy_staff_prod',
  SCHED_CLASSROOMS: 'farhangian_sched_classrooms_prod',
  SCHED_PROGRAMS: 'farhangian_sched_programs_prod',
  SCHED_PROFESSORS: 'farhangian_sched_professors_prod',
  SCHED_COURSES: 'farhangian_sched_courses_prod',
  SCHED_OFFERINGS: 'farhangian_sched_offerings_prod',
  SCHED_CELL_COMMENTS: 'farhangian_sched_cell_comments_prod',
  SCHED_RULES: 'farhangian_sched_rules_prod',
  SCHED_PROFESSOR_PROPOSALS: 'farhangian_sched_professor_proposals_prod',
  LIBRARY_BOOKS: 'farhangian_dorm_library_books_prod',
  LIBRARY_BOOK_REQUESTS: 'farhangian_dorm_library_book_requests_prod',
  GRADUATION_CLEARANCES: 'farhangian_dorm_graduation_clearances_prod',
  ACADEMIC_WORKFLOW_REQUESTS: 'farhangian_dorm_academic_workflow_requests_prod',
  COMMUNITY_CHAT_SETTINGS: 'farhangian_dorm_community_chat_settings_prod',
  COMMUNITY_FORUMS: 'farhangian_dorm_community_forums_prod',
  COMMUNITY_CHAT_MESSAGES: 'farhangian_dorm_community_chat_messages_prod',
  COMMUNITY_CHAT_BANS: 'farhangian_dorm_community_chat_bans_prod',
  COMMUNITY_CHAT_REPORTS: 'farhangian_dorm_community_chat_reports_prod',
  COMMUNITY_USER_PREFS: 'farhangian_dorm_community_user_prefs_prod',
  ACADEMIC_CHAT_ROOMS: 'farhangian_academic_chat_rooms_prod',
  ACADEMIC_CHAT_MESSAGES: 'farhangian_academic_chat_messages_prod',
  DORM_ATTENDANCE_STATES: 'farhangian_dorm_attendance_states_prod',
  DORM_ATTENDANCE_LOGS: 'farhangian_dorm_attendance_logs_prod',
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
    category: 'campus_dorm_environment',
    label: 'موارد مربوط به سراها، ساختمان، ورودی و محوطه (بدون نیاز به دانشجو)',
    defaultTitle: 'گزارش وضعیت حفاظتی / ایمنی سرا یا محوطه',
    defaultDescription:
      'با احترام، به استحضار واحد محترم حراست و انتظامات می‌رساند مورد حفاظتی، ایمنی یا انتظاماتی در محدوده سرای دانشجویی / محوطه مشاهده گردیده است. خواهشمند است بررسی و اقدامات لازم معمول گردد.',
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
const lastAppliedSerializedByKey = new Map<string, string>();
const NON_CRITICAL_EVICTABLE_KEYS = [
  STORAGE_KEYS.ANNOUNCEMENTS,
  STORAGE_KEYS.ACTIVITY_LOGS,
];

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
  lastAppliedSerializedByKey.set(key, serialized);
  if (parsedValue !== undefined) {
    parsedCache.set(key, cloneValue(parsedValue));
  } else {
    parsedCache.delete(key);
  }
  try {
    localStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    // در موبایل/سافاری (سقف ۵MB): اگر کلید حیاتی مثل تنظیمات، کاربران یا دانشجویان جا نشد،
    // کلیدهای حجیم غیرحیاتی (مثل عکس اطلاعیه‌ها) فقط از localStorage آزاد می‌شوند اما در RAM باقی می‌مانند.
    if (!NON_CRITICAL_EVICTABLE_KEYS.includes(key)) {
      for (const evictKey of NON_CRITICAL_EVICTABLE_KEYS) {
        if (evictKey === key) continue;
        try {
          if (localStorage.getItem(evictKey) !== null) {
            localStorage.removeItem(evictKey);
            removePersistedCloudKeyTimestamp(evictKey);
          }
          localStorage.setItem(key, serialized);
          return true;
        } catch {
          // ادامه به کلید قابل تخلیه بعدی
        }
      }
    }
    console.warn(`Failed to write ${key} to localStorage (quota or access):`, e);
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
  setIfMissing(STORAGE_KEYS.VICE_DEAN_STAFF, INITIAL_VICE_DEAN_STAFF);
  setIfMissing(STORAGE_KEYS.LIBRARY_STAFF, INITIAL_LIBRARY_STAFF);
  setIfMissing(STORAGE_KEYS.SMART_CAMPUS_STAFF, INITIAL_SMART_CAMPUS_STAFF);
  setIfMissing(STORAGE_KEYS.GRADUATION_STAFF, INITIAL_GRADUATION_STAFF);
  setIfMissing(STORAGE_KEYS.ACADEMIC_DEPUTY_STAFF, INITIAL_ACADEMIC_DEPUTY_STAFF);
  setIfMissing(STORAGE_KEYS.SCHED_CLASSROOMS, INITIAL_SCHED_CLASSROOMS);
  setIfMissing(STORAGE_KEYS.SCHED_PROGRAMS, INITIAL_SCHED_PROGRAMS);
  setIfMissing(STORAGE_KEYS.SCHED_PROFESSORS, INITIAL_SCHED_PROFESSORS);
  setIfMissing(STORAGE_KEYS.SCHED_COURSES, INITIAL_SCHED_COURSES);
  setIfMissing(STORAGE_KEYS.SCHED_OFFERINGS, INITIAL_SCHED_OFFERINGS);
  setIfMissing(STORAGE_KEYS.SCHED_CELL_COMMENTS, INITIAL_SCHED_CELL_COMMENTS);
  setIfMissing(STORAGE_KEYS.SCHED_RULES, DEFAULT_SCHED_RULES);
  setIfMissing(STORAGE_KEYS.SCHED_PROFESSOR_PROPOSALS, []);
  setIfMissing(STORAGE_KEYS.DORM_ATTENDANCE_STATES, []);
  setIfMissing(STORAGE_KEYS.DORM_ATTENDANCE_LOGS, []);
  setIfMissing(STORAGE_KEYS.LIBRARY_BOOKS, INITIAL_LIBRARY_BOOKS);
  setIfMissing(STORAGE_KEYS.LIBRARY_BOOK_REQUESTS, INITIAL_LIBRARY_BOOK_REQUESTS);
  setIfMissing(STORAGE_KEYS.GRADUATION_CLEARANCES, INITIAL_GRADUATION_CLEARANCES);
  setIfMissing(STORAGE_KEYS.ACADEMIC_WORKFLOW_REQUESTS, []);
  setIfMissing(STORAGE_KEYS.COMMUNITY_CHAT_SETTINGS, DEFAULT_COMMUNITY_CHAT_SETTINGS);
  setIfMissing(STORAGE_KEYS.COMMUNITY_FORUMS, [INITIAL_PUBLIC_FORUM]);
  setIfMissing(STORAGE_KEYS.COMMUNITY_CHAT_MESSAGES, []);
  setIfMissing(STORAGE_KEYS.COMMUNITY_CHAT_BANS, []);
  setIfMissing(STORAGE_KEYS.COMMUNITY_CHAT_REPORTS, []);
  setIfMissing(STORAGE_KEYS.COMMUNITY_USER_PREFS, { rulesAcceptedUserIds: [], blockedByUser: {} });

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

// مدیریت زمان و وضعیت همگام‌سازی ابری با تجمیع هوشمند، بازپخش خودکار خطا، صف پایدار و کنترل ETag/Version
const keyWriteTimestamps: Record<string, number> = {};
const pendingCloudRequests: Record<string, Promise<boolean> | undefined> = {};
const pendingCloudValues: Record<string, unknown> = {};
const failedCloudRetryQueue: Record<string, unknown> = {};
const activeStudentMirrorPromises = new Set<Promise<boolean>>();
let coalescedFlushTimer: ReturnType<typeof setTimeout> | undefined;
let coalescedFlushDueAt = 0;
let failedRetryTimer: ReturnType<typeof setTimeout> | undefined;
let failedRetryAttempts = 0;
let initialSyncRetryTimer: ReturnType<typeof setTimeout> | undefined;
let activeSyncPromise: Promise<boolean> | null = null;
let batchEndpointSupported: boolean | null = null;
let versionEndpointSupported: boolean | null = null;
let manifestEndpointSupported: boolean | null = null;
let lastSyncRevision: string | number | null = null;
let lastSyncEtag: string | null = null;
let lastStudentsEtag: string | null = null;
const SYNCABLE_KEYS = Object.values(STORAGE_KEYS).filter((k) => k !== STORAGE_KEYS.CURRENT_USER);
const CLOUD_SYNC_DEBOUNCE_MS = 350;
const CLOUD_SYNC_IMMEDIATE_MS = 25;
const MAX_RETRY_QUEUE_KEYS = 45;
const MAX_AUTO_RETRY_CYCLES = 5;

// متادیتای زمان بروزرسانی هر جدول همگام‌سازی‌شده برای جلوگیری از دانلود مجدد کلیدهای حجیمِ بدون تغییر
const CLOUD_SYNC_META_STORAGE_KEY = 'farhangian_dorm_cloud_sync_meta_v2';
const DIRTY_CLOUD_KEYS_STORAGE_KEY = 'farhangian_dorm_dirty_keys_v1';
const persistedDirtyKeys = new Set<string>();
const memoryKeyUpdatedAt: Record<string, string> = {};
const cloudDataChangedSubscribers = new Set<() => void>();
let cloudDataNotifyScheduled = false;

interface PersistedCloudSyncMeta {
  revision?: string | number | null;
  hydrated?: boolean;
  keyUpdatedAt?: Record<string, string>;
}

function readPersistedCloudSyncMeta(): PersistedCloudSyncMeta {
  try {
    const raw = localStorage.getItem(CLOUD_SYNC_META_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistedCloudSyncMeta;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writePersistedCloudSyncMeta(meta: PersistedCloudSyncMeta): void {
  try {
    localStorage.setItem(CLOUD_SYNC_META_STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // نادیده گرفتن در صورت پر بودن حافظه
  }
}

function savePersistedDirtyKeys(): void {
  try {
    if (persistedDirtyKeys.size === 0) {
      localStorage.removeItem(DIRTY_CLOUD_KEYS_STORAGE_KEY);
    } else {
      localStorage.setItem(
        DIRTY_CLOUD_KEYS_STORAGE_KEY,
        JSON.stringify(Array.from(persistedDirtyKeys))
      );
    }
  } catch {
    // نادیده گرفتن در صورت پر بودن حافظه
  }
}

function markKeyDirtyForCloud(key: string): void {
  if (!SYNCABLE_KEYS.includes(key)) return;
  if (!persistedDirtyKeys.has(key)) {
    persistedDirtyKeys.add(key);
    savePersistedDirtyKeys();
  }
}

function clearKeyDirtyForCloud(key: string): void {
  if (persistedDirtyKeys.has(key)) {
    persistedDirtyKeys.delete(key);
    savePersistedDirtyKeys();
  }
}

function updateLocalCloudKeyTimestamp(key: string, updatedAtIso?: string | null): void {
  if (!updatedAtIso || typeof updatedAtIso !== 'string') return;
  memoryKeyUpdatedAt[key] = updatedAtIso;
  try {
    if (localStorage.getItem(key) !== null) {
      const meta = readPersistedCloudSyncMeta();
      const nextMap = { ...(meta.keyUpdatedAt || {}), [key]: updatedAtIso };
      writePersistedCloudSyncMeta({
        revision: lastSyncRevision !== null ? lastSyncRevision : meta.revision ?? null,
        hydrated: Boolean(meta.hydrated),
        keyUpdatedAt: nextMap,
      });
    }
  } catch {
    // ignore
  }
}

function removePersistedCloudKeyTimestamp(key: string): void {
  try {
    const meta = readPersistedCloudSyncMeta();
    if (meta.keyUpdatedAt && key in meta.keyUpdatedAt) {
      delete meta.keyUpdatedAt[key];
      writePersistedCloudSyncMeta(meta);
    }
  } catch {
    // ignore
  }
}

// بارگذاری متادیتای کلیدهای ذخیره‌شده و تغییرات ارسال‌نشده قبلی هنگام شروع جلسه مرورگر
(function hydrateInitialCloudMeta() {
  if (typeof localStorage === 'undefined') return;
  const meta = readPersistedCloudSyncMeta();
  if (meta.keyUpdatedAt && typeof meta.keyUpdatedAt === 'object') {
    for (const [k, ts] of Object.entries(meta.keyUpdatedAt)) {
      try {
        if (typeof ts === 'string' && ts && localStorage.getItem(k) !== null) {
          memoryKeyUpdatedAt[k] = ts;
        }
      } catch {
        // ignore
      }
    }
  }
  // تنها زمانی revision ذخیره شده را معتبر می‌دانیم که کلیدهای کلیدی واقعاً در localStorage موجود باشند
  if (
    meta.hydrated &&
    meta.revision !== undefined &&
    meta.revision !== null &&
    memoryKeyUpdatedAt[STORAGE_KEYS.SETTINGS] &&
    memoryKeyUpdatedAt[STORAGE_KEYS.STUDENTS] &&
    memoryKeyUpdatedAt[STORAGE_KEYS.SUPERVISORS] &&
    memoryKeyUpdatedAt[STORAGE_KEYS.ANNOUNCEMENTS]
  ) {
    lastSyncRevision = meta.revision;
  }

  // بازیابی تغییرات محلی که در نشست قبلی به دلیل قطع اینترنت یا بسته شدن صفحه هنوز به سرور ابری نرسیده بودند
  try {
    const rawDirty = localStorage.getItem(DIRTY_CLOUD_KEYS_STORAGE_KEY);
    if (rawDirty) {
      const list = JSON.parse(rawDirty);
      if (Array.isArray(list)) {
        for (const k of list) {
          if (typeof k === 'string' && SYNCABLE_KEYS.includes(k)) {
            const rawVal = localStorage.getItem(k);
            if (rawVal) {
              try {
                const parsedVal = sanitizePlainValue(JSON.parse(rawVal));
                persistedDirtyKeys.add(k);
                failedCloudRetryQueue[k] = parsedVal;
              } catch {
                // ignore malformed entry
              }
            }
          }
        }
        savePersistedDirtyKeys();
      }
    }
  } catch {
    // ignore
  }
})();

function notifyCloudDataChanged(): void {
  if (cloudDataChangedSubscribers.size === 0 || cloudDataNotifyScheduled) return;
  cloudDataNotifyScheduled = true;
  const run = () => {
    cloudDataNotifyScheduled = false;
    cloudDataChangedSubscribers.forEach((cb) => {
      try {
        cb();
      } catch {
        // ignore callback error
      }
    });
  };
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(run);
  } else {
    setTimeout(run, 0);
  }
}

// کلیدهای حجیم که همیشه باید به‌صورت مجزا و اختصاصی (Solo) دریافت و ارسال شوند تا هرگز باعث Timeout کلیدهای دیگر نشوند
const SOLO_HEAVY_KEYS = new Set<string>([
  STORAGE_KEYS.SETTINGS,
  STORAGE_KEYS.BEDS,
  STORAGE_KEYS.STUDENTS,
  STORAGE_KEYS.ANNOUNCEMENTS,
]);

// کلیدهای احراز هویت کلیه کارکنان و سرپرستان (بسیار کم‌حجم؛ زیر ۵۰KB و دریافت در ~۱ ثانیه)
const STAFF_AUTH_KEYS: string[] = [
  STORAGE_KEYS.SUPERVISORS,
  STORAGE_KEYS.MAINTENANCE_STAFF,
  STORAGE_KEYS.WAREHOUSE_STAFF,
  STORAGE_KEYS.FINANCE_STAFF,
  STORAGE_KEYS.PROCUREMENT_STAFF,
  STORAGE_KEYS.EDUCATION_STAFF,
  STORAGE_KEYS.COUNSELORS,
  STORAGE_KEYS.CULTURAL_STAFF,
  STORAGE_KEYS.STUDENT_AFFAIRS_STAFF,
  STORAGE_KEYS.SECURITY_STAFF,
  STORAGE_KEYS.VICE_DEAN_STAFF,
  STORAGE_KEYS.LIBRARY_STAFF,
  STORAGE_KEYS.SMART_CAMPUS_STAFF,
  STORAGE_KEYS.GRADUATION_STAFF,
  STORAGE_KEYS.ACADEMIC_DEPUTY_STAFF,
  STORAGE_KEYS.SCHED_PROFESSORS,
];

// کلیدهای بحرانی (ایجاد/ویرایش هر نوع کاربر و تنظیمات) که بلافاصله و بدون معطلی به سرور ابری ارسال می‌شوند
const IMMEDIATE_CLOUD_KEYS = new Set<string>([
  ...STAFF_AUTH_KEYS,
  STORAGE_KEYS.STUDENTS,
  STORAGE_KEYS.SETTINGS,
  STORAGE_KEYS.COMMUNITY_CHAT_SETTINGS,
  STORAGE_KEYS.COMMUNITY_FORUMS,
  STORAGE_KEYS.COMMUNITY_CHAT_MESSAGES,
  STORAGE_KEYS.COMMUNITY_CHAT_BANS,
  STORAGE_KEYS.COMMUNITY_CHAT_REPORTS,
  STORAGE_KEYS.COMMUNITY_USER_PREFS,
  STORAGE_KEYS.ACADEMIC_CHAT_ROOMS,
  STORAGE_KEYS.ACADEMIC_CHAT_MESSAGES,
  STORAGE_KEYS.SCHED_PROFESSOR_PROPOSALS,
  STORAGE_KEYS.DORM_ATTENDANCE_STATES,
  STORAGE_KEYS.DORM_ATTENDANCE_LOGS,
]);

// پنجره ادغام درخواست‌های همگام‌سازی غیرضروری و نشانگر آخرین تغییر جدول students برای Delta Sync
const SYNC_COALESCE_WINDOW_MS = 10000;
const lastCompletedSyncAtByScope: Record<string, number> = {};
let lastStudentsDeltaSyncIso: string | null = null;

// کلیدهای عمومی قابل کش در sessionStorage به مدت ۵ دقیقه (جلوگیری از فراخوانی تکراری Supabase در هر رفرش)
const PUBLIC_CACHE_TTL_MS = 5 * 60 * 1000;
const PUBLIC_CACHE_META_SESSION_KEY = 'farhangian_public_cache_meta_v1';
const PUBLIC_CACHE_VAL_SESSION_PREFIX = 'farhangian_public_cache_val_v1_';
const PUBLIC_CACHEABLE_KEYS: string[] = [
  STORAGE_KEYS.SETTINGS,
  STORAGE_KEYS.ANNOUNCEMENTS,
  STORAGE_KEYS.DORMITORIES,
  STORAGE_KEYS.LIBRARY_BOOKS,
];
const PUBLIC_CACHEABLE_KEY_SET = new Set<string>(PUBLIC_CACHEABLE_KEYS);

// کلیدهای عملیاتی مورد نیاز کارتابل دانشجو (بدون کلیدهای پرسنلی و گزارش‌های داخلی مدیریت)
const STUDENT_OPERATIONAL_KEYS: string[] = [
  STORAGE_KEYS.ROOMS,
  STORAGE_KEYS.BEDS,
  STORAGE_KEYS.WARNINGS,
  STORAGE_KEYS.MESSAGES,
  STORAGE_KEYS.STUDENT_EVALUATIONS,
  STORAGE_KEYS.STUDENT_FINANCES,
  STORAGE_KEYS.GUEST_REQUESTS,
  STORAGE_KEYS.SURVEYS,
  STORAGE_KEYS.SURVEY_RESPONSES,
  STORAGE_KEYS.CULTURAL_PROGRAMS,
  STORAGE_KEYS.CULTURAL_ASSOCIATIONS,
  STORAGE_KEYS.ASSOCIATION_MEMBERSHIPS,
  STORAGE_KEYS.GUILD_ELECTIONS,
  STORAGE_KEYS.GUILD_ELECTION_VOTES,
  STORAGE_KEYS.SPORTS_PROGRAMS,
  STORAGE_KEYS.SPORTS_REGISTRATIONS,
  STORAGE_KEYS.LIBRARY_BOOK_REQUESTS,
  STORAGE_KEYS.GRADUATION_CLEARANCES,
  STORAGE_KEYS.ACADEMIC_WORKFLOW_REQUESTS,
  STORAGE_KEYS.SHIFT_SCHEDULES,
  STORAGE_KEYS.COUNSELOR_SHIFTS,
  STORAGE_KEYS.COUNSELORS,
  STORAGE_KEYS.COMMUNITY_CHAT_SETTINGS,
  STORAGE_KEYS.COMMUNITY_FORUMS,
  STORAGE_KEYS.COMMUNITY_CHAT_MESSAGES,
  STORAGE_KEYS.COMMUNITY_CHAT_BANS,
  STORAGE_KEYS.COMMUNITY_CHAT_REPORTS,
  STORAGE_KEYS.COMMUNITY_USER_PREFS,
];

// کلیدهای app_storage که هرگز نباید رشته تصویری Base64 (data:image) در آن‌ها ذخیره شود
const MEDIA_ALLOWED_APP_STORAGE_KEYS = new Set<string>([
  STORAGE_KEYS.SETTINGS,
  STORAGE_KEYS.ANNOUNCEMENTS,
  STORAGE_KEYS.COMMUNITY_CHAT_MESSAGES,
]);

interface PublicSessionCacheMeta {
  cachedAt: number;
  keys: string[];
}

function readPublicSessionCacheMeta(): PublicSessionCacheMeta | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PUBLIC_CACHE_META_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PublicSessionCacheMeta>;
    if (
      typeof parsed?.cachedAt === 'number' &&
      Number.isFinite(parsed.cachedAt) &&
      Array.isArray(parsed.keys)
    ) {
      return { cachedAt: parsed.cachedAt, keys: parsed.keys.map(String) };
    }
    return null;
  } catch {
    return null;
  }
}

function isPublicSessionCacheFresh(): boolean {
  const meta = readPublicSessionCacheMeta();
  if (!meta) return false;
  if (Date.now() - meta.cachedAt >= PUBLIC_CACHE_TTL_MS) return false;
  // اطمینان از اینکه داده‌های کش‌شده واقعاً در sessionStorage یا localStorage موجود هستند
  for (const key of PUBLIC_CACHEABLE_KEYS) {
    let hasKey = parsedCache.has(key);
    if (!hasKey && typeof sessionStorage !== 'undefined') {
      try {
        hasKey = sessionStorage.getItem(PUBLIC_CACHE_VAL_SESSION_PREFIX + key) !== null;
      } catch {
        hasKey = false;
      }
    }
    if (!hasKey && typeof localStorage !== 'undefined') {
      try {
        hasKey = localStorage.getItem(key) !== null;
      } catch {
        hasKey = false;
      }
    }
    if (!hasKey) return false;
  }
  return true;
}

function hydratePublicKeysFromSessionCache(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  let hydratedAny = false;
  for (const key of PUBLIC_CACHEABLE_KEYS) {
    if (
      pendingCloudRequests[key] ||
      key in pendingCloudValues ||
      key in failedCloudRetryQueue ||
      persistedDirtyKeys.has(key)
    ) {
      continue;
    }
    try {
      const raw = sessionStorage.getItem(PUBLIC_CACHE_VAL_SESSION_PREFIX + key);
      if (!raw) continue;
      if (lastAppliedSerializedByKey.get(key) === raw && parsedCache.has(key)) continue;
      let parsed = sanitizePlainValue(JSON.parse(raw));
      let finalRaw = raw;
      // حفظ رمز مدیر محلی هنگام بازیابی تنظیمات از کش عمومی (که عمداً بدون adminPassword ذخیره می‌شود)
      if (
        key === STORAGE_KEYS.SETTINGS &&
        parsed &&
        typeof parsed === 'object' &&
        !('adminPassword' in (parsed as Record<string, unknown>))
      ) {
        const existingSettings = get<Record<string, unknown> | null>(STORAGE_KEYS.SETTINGS, null);
        if (
          existingSettings &&
          typeof existingSettings.adminPassword === 'string' &&
          existingSettings.adminPassword
        ) {
          parsed = {
            ...(parsed as Record<string, unknown>),
            adminPassword: existingSettings.adminPassword,
          };
          finalRaw = JSON.stringify(parsed);
        }
      }
      safeLocalStorageSet(key, finalRaw, parsed);
      hydratedAny = true;
    } catch {
      // نادیده گرفتن ورودی معیوب کش
    }
  }
  return hydratedAny;
}

function writePublicKeysToSessionCache(
  entries: Array<{ key: string; serialized: string }>
): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    for (const entry of entries) {
      if (!PUBLIC_CACHEABLE_KEY_SET.has(entry.key)) continue;
      try {
        let cacheSerialized = entry.serialized;
        // حذف رمز مدیر از کش sessionStorage عمومی برای کاهش سطح افشا در مرورگر
        if (entry.key === STORAGE_KEYS.SETTINGS) {
          try {
            const parsedSettings = JSON.parse(entry.serialized);
            if (
              parsedSettings &&
              typeof parsedSettings === 'object' &&
              'adminPassword' in parsedSettings
            ) {
              const { adminPassword: _omittedAdminPass, ...safePublicSettings } =
                parsedSettings as Record<string, unknown>;
              cacheSerialized = JSON.stringify(safePublicSettings);
            }
          } catch {
            // fallback به رشته اصلی
          }
        }
        sessionStorage.setItem(PUBLIC_CACHE_VAL_SESSION_PREFIX + entry.key, cacheSerialized);
      } catch {
        // در صورت حجم بالای تصویر بنر/اطلاعیه، صرفاً از تکرار در sessionStorage صرف‌نظر می‌شود
        // و متادیتای زمان انقضای ۵ دقیقه‌ای همچنان با پشتوانه localStorage معتبر می‌ماند
        try {
          sessionStorage.removeItem(PUBLIC_CACHE_VAL_SESSION_PREFIX + entry.key);
        } catch {
          // ignore
        }
      }
    }
    const meta: PublicSessionCacheMeta = {
      cachedAt: Date.now(),
      keys: [...PUBLIC_CACHEABLE_KEYS],
    };
    sessionStorage.setItem(PUBLIC_CACHE_META_SESSION_KEY, JSON.stringify(meta));
  } catch {
    // نادیده گرفتن محدودیت sessionStorage
  }
}

function invalidatePublicSessionCache(specificKey?: string): void {
  if (specificKey && !PUBLIC_CACHEABLE_KEY_SET.has(specificKey)) return;
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(PUBLIC_CACHE_META_SESSION_KEY);
    if (specificKey) {
      sessionStorage.removeItem(PUBLIC_CACHE_VAL_SESSION_PREFIX + specificKey);
    } else {
      for (const k of PUBLIC_CACHEABLE_KEYS) {
        sessionStorage.removeItem(PUBLIC_CACHE_VAL_SESSION_PREFIX + k);
      }
    }
  } catch {
    // ignore
  }
}

// موج اول سریع (کارکنان + سراها + اتاق‌ها + اخطارها و پیام‌ها)
const FAST_BOOTSTRAP_KEYS: string[] = [
  ...STAFF_AUTH_KEYS,
  STORAGE_KEYS.DORMITORIES,
  STORAGE_KEYS.ROOMS,
  STORAGE_KEYS.WARNINGS,
  STORAGE_KEYS.MESSAGES,
];

const utf8Encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
function getUtf8ByteLength(str: string): number {
  if (!str) return 0;
  if (utf8Encoder) return utf8Encoder.encode(str).length;
  return str.length * 2;
}

export type CloudTrafficDirection = 'up' | 'down' | 'probe';

export interface CloudTrafficEvent {
  id: string;
  timestamp: string;
  timeShort: string;
  direction: CloudTrafficDirection;
  endpoint: string;
  method: 'GET' | 'POST' | 'DELETE';
  status: number | null;
  ok: boolean;
  durationMs: number;
  bytes: number;
  detail: string;
}

export interface CloudLiveMetrics {
  apiBaseUrl: string;
  hasSyncToken: boolean;
  browserOnline: boolean;
  lastSyncRevision: string | number | null;
  lastSyncAt: string | null;
  lastHealthLatencyMs: number | null;
  lastHealthOk: boolean | null;
  lastDbName: string | null;
  lastServerCounts: { syncKv: number; students: number; photos: number } | null;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  bytesSentUtf8: number;
  bytesReceivedUtf8: number;
  pendingKeysCount: number;
  inFlightKeysCount: number;
  failedRetryQueueKeys: string[];
  endpointCapabilities: {
    version: boolean | null;
    manifest: boolean | null;
    batch: boolean | null;
  };
  lastError: {
    timestamp: string;
    endpoint: string;
    status: number | null;
    message: string;
  } | null;
  recentEvents: CloudTrafficEvent[];
}

export type CloudDiagnosticCheckStatus = 'pass' | 'warn' | 'fail';

export interface CloudDiagnosticCheckItem {
  id: string;
  title: string;
  category: 'network' | 'server' | 'database' | 'sync' | 'traffic';
  status: CloudDiagnosticCheckStatus;
  latencyMs: number | null;
  summary: string;
  details: string[];
}

export interface LocalCloudKeyAuditItem {
  key: string;
  label: string;
  bytesUtf8: number;
  percentOfVercelLimit: number;
  nearLimit: boolean;
  overLimit: boolean;
}

export interface LocalCloudPayloadSummary {
  presentKeysCount: number;
  totalSyncableKeys: number;
  totalBytesUtf8: number;
  oversizedKeys: LocalCloudKeyAuditItem[];
  nearLimitKeys: LocalCloudKeyAuditItem[];
  topKeys: LocalCloudKeyAuditItem[];
}

export interface CloudDiagnosticReport {
  checkedAt: string;
  overallStatus: CloudDiagnosticCheckStatus;
  totalDurationMs: number;
  apiBaseUrl: string;
  serverHealthy: boolean;
  dbName: string | null;
  serverCounts: { syncKv: number; students: number; photos: number } | null;
  serverRevision: string | number | null;
  serverUpdatedAt: string | null;
  throughputKbps: number | null;
  manifestKeysCount: number | null;
  manifestTotalBytes: number | null;
  missingOnServerKeys: string[];
  oversizedOnServerKeys: Array<{ key: string; sizeBytes: number }>;
  localSummary: LocalCloudPayloadSummary;
  checks: CloudDiagnosticCheckItem[];
  recommendations: string[];
}

const FRIENDLY_SYNC_KEY_LABELS: Record<string, string> = {
  [STORAGE_KEYS.SETTINGS]: 'تنظیمات عمومی، فونت‌ها، تصاویر و درباره ما',
  [STORAGE_KEYS.STUDENTS]: 'پرونده دانشجویان',
  [STORAGE_KEYS.DORMITORIES]: 'سراهای دانشجویی',
  [STORAGE_KEYS.ROOMS]: 'اتاق‌ها',
  [STORAGE_KEYS.BEDS]: 'تخت‌ها',
  [STORAGE_KEYS.SUPERVISORS]: 'کاربران سرپرستان سرا',
  [STORAGE_KEYS.MAINTENANCE_STAFF]: 'کاربران تأسیسات و فنی',
  [STORAGE_KEYS.WAREHOUSE_STAFF]: 'کاربران انبار و تجهیزات',
  [STORAGE_KEYS.FINANCE_STAFF]: 'کاربران امور مالی',
  [STORAGE_KEYS.PROCUREMENT_STAFF]: 'کاربران کارپردازی و خرید',
  [STORAGE_KEYS.EDUCATION_STAFF]: 'کاربران کارشناسان آموزش',
  [STORAGE_KEYS.COUNSELORS]: 'کاربران مشاوران و روانشناسان',
  [STORAGE_KEYS.CULTURAL_STAFF]: 'کاربران امور فرهنگی',
  [STORAGE_KEYS.STUDENT_AFFAIRS_STAFF]: 'کاربران امور دانشجویی و تربیت بدنی',
  [STORAGE_KEYS.SECURITY_STAFF]: 'کاربران حراست و انتظامات',
  [STORAGE_KEYS.VICE_DEAN_STAFF]: 'کاربران معاونت دانشجویی',
  [STORAGE_KEYS.LIBRARY_STAFF]: 'کاربران کتابخانه و پژوهش',
  [STORAGE_KEYS.SMART_CAMPUS_STAFF]: 'کاربران واحد هوشمندسازی',
  [STORAGE_KEYS.GRADUATION_STAFF]: 'کاربران واحد فارغ‌التحصیلان',
  [STORAGE_KEYS.ACADEMIC_DEPUTY_STAFF]: 'کاربران معاونت آموزشی',
  [STORAGE_KEYS.SCHED_CLASSROOMS]: 'کلاس‌های فیزیکی برنامه‌ریزی درسی',
  [STORAGE_KEYS.SCHED_PROGRAMS]: 'رشته‌ها، ورودی‌ها و شعبه‌های برنامه‌ریزی',
  [STORAGE_KEYS.SCHED_PROFESSORS]: 'اساتید و حساب‌های کاربری اساتید',
  [STORAGE_KEYS.SCHED_COURSES]: 'فهرست کل دروس رشته‌ها (۷ رقمی)',
  [STORAGE_KEYS.SCHED_OFFERINGS]: 'برنامه هفتگی و دروس ارائه‌شده',
  [STORAGE_KEYS.SCHED_CELL_COMMENTS]: 'یادداشت‌ها و کامنت‌های برنامه جامع درسی',
  [STORAGE_KEYS.SCHED_RULES]: 'تنظیمات ضرایب و سانس‌های برنامه‌ریزی',
  [STORAGE_KEYS.SCHED_PROFESSOR_PROPOSALS]: 'درخواست‌های ثبت استاد جدید مدیران گروه',
  [STORAGE_KEYS.DORM_ATTENDANCE_STATES]: 'وضعیت حضور و غیاب لحظه‌ای ساکنان سراها',
  [STORAGE_KEYS.DORM_ATTENDANCE_LOGS]: 'تاریخچه تردد و اسکن بارکد سراهای دانشجویی',
  [STORAGE_KEYS.LIBRARY_BOOKS]: 'فهرست کتب کتابخانه',
  [STORAGE_KEYS.LIBRARY_BOOK_REQUESTS]: 'درخواست‌ها و امانات کتابخانه',
  [STORAGE_KEYS.GRADUATION_CLEARANCES]: 'تسویه حساب الکترونیک فارغ‌التحصیلان',
  [STORAGE_KEYS.ACADEMIC_WORKFLOW_REQUESTS]: 'درخواست‌ها و گردش کار حوزه معاونت آموزشی',
  [STORAGE_KEYS.ANNOUNCEMENTS]: 'اطلاعیه‌ها و اخبار',
  [STORAGE_KEYS.MESSAGES]: 'پیام‌ها و مکاتبات',
  [STORAGE_KEYS.WARNINGS]: 'اخطارهای انضباطی و اتاق',
  [STORAGE_KEYS.ACTIVITY_LOGS]: 'گزارش فعالیت‌ها (Audit Log)',
  [STORAGE_KEYS.MAINTENANCE_TASKS]: 'درخواست‌ها و امور تأسیسات',
  [STORAGE_KEYS.STUDENT_EVALUATIONS]: 'ارزیابی دانشجویان',
  [STORAGE_KEYS.SECURITY_REPORTS]: 'گزارش‌های حراست و انتظامات',
  [STORAGE_KEYS.DISCIPLINARY_REFERRALS]: 'ارجاعات شورای انضباطی',
  [STORAGE_KEYS.SPORTS_PROGRAMS]: 'برنامه‌های ورزشی',
  [STORAGE_KEYS.SPORTS_REGISTRATIONS]: 'ثبت‌نام‌های ورزشی',
  [STORAGE_KEYS.CULTURAL_PROGRAMS]: 'برنامه‌های فرهنگی',
  [STORAGE_KEYS.CULTURAL_ASSOCIATIONS]: 'انجمن‌ها و کانون‌های فرهنگی',
  [STORAGE_KEYS.ASSOCIATION_MEMBERSHIPS]: 'عضویت‌های کانون‌های فرهنگی',
  [STORAGE_KEYS.STUDENT_FINANCES]: 'سوابق مالی دانشجویان',
  [STORAGE_KEYS.INVENTORY_ITEMS]: 'اقلام انبار و تجهیزات',
  [STORAGE_KEYS.INVENTORY_TRANSACTIONS]: 'تراکنش‌های انبار',
  [STORAGE_KEYS.WAREHOUSE_REQUESTS]: 'درخواست‌های انبار',
  [STORAGE_KEYS.PROCUREMENT_REQUESTS]: 'درخواست‌های کارپردازی',
  [STORAGE_KEYS.ACADEMIC_NOTICES]: 'اعلامیه‌های وضعیت تحصیلی',
  [STORAGE_KEYS.SHIFT_SCHEDULES]: 'برنامه شیفت سرپرستان',
  [STORAGE_KEYS.SHIFT_REPORTS]: 'گزارش‌های شیفت سرپرستان',
  [STORAGE_KEYS.COUNSELOR_SHIFTS]: 'برنامه شیفت مشاوران',
  [STORAGE_KEYS.COUNSELOR_REPORTS]: 'گزارش‌های مشاوره',
  [STORAGE_KEYS.GUEST_REQUESTS]: 'درخواست‌های مهمان',
  [STORAGE_KEYS.VISIT_REPORTS]: 'گزارش‌های بازدید اتاق‌ها',
  [STORAGE_KEYS.SURVEYS]: 'نظرسنجی‌های دوره‌ای',
  [STORAGE_KEYS.SURVEY_RESPONSES]: 'پاسخ‌های نظرسنجی',
  [STORAGE_KEYS.GUILD_ELECTIONS]: 'انتخابات شورای صنفی',
  [STORAGE_KEYS.GUILD_ELECTION_VOTES]: 'آرای انتخابات شورای صنفی',
  [STORAGE_KEYS.COMMUNITY_CHAT_SETTINGS]: 'تنظیمات تالارهای گفتگو و پیام‌رسان دانشجویی',
  [STORAGE_KEYS.COMMUNITY_FORUMS]: 'تالارها و گروه‌های گفتگوی تخصصی',
  [STORAGE_KEYS.COMMUNITY_CHAT_MESSAGES]: 'پیام‌های تالارها و پیام‌رسان دانشجویی',
  [STORAGE_KEYS.COMMUNITY_CHAT_BANS]: 'فهرست مسدودشدگان پیام‌رسان دانشجویی',
  [STORAGE_KEYS.COMMUNITY_CHAT_REPORTS]: 'گزارش‌های تخلف پیام‌رسان دانشجویی',
  [STORAGE_KEYS.COMMUNITY_USER_PREFS]: 'تنظیمات و تعهدنامه‌های کاربران در پیام‌رسان',
  [STORAGE_KEYS.ACADEMIC_CHAT_ROOMS]: 'اتاق‌های گفتگو و تالارهای مشترک معاونت آموزش',
  [STORAGE_KEYS.ACADEMIC_CHAT_MESSAGES]: 'پیام‌های چت آنلاین و تالارهای مشترک معاونت آموزش',
};

const cloudTelemetryState = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  bytesSentUtf8: 0,
  bytesReceivedUtf8: 0,
  lastSyncAt: null as string | null,
  lastHealthLatencyMs: null as number | null,
  lastHealthOk: null as boolean | null,
  lastDbName: null as string | null,
  lastServerCounts: null as { syncKv: number; students: number; photos: number } | null,
  lastError: null as CloudLiveMetrics['lastError'],
  recentEvents: [] as CloudTrafficEvent[],
};

const cloudMetricsSubscribers = new Set<(metrics: CloudLiveMetrics) => void>();
let metricsNotifyScheduled = false;

function buildCloudLiveMetricsSnapshot(): CloudLiveMetrics {
  const failedUnion = new Set<string>(Object.keys(failedCloudRetryQueue));
  persistedDirtyKeys.forEach((k) => {
    if (!pendingCloudRequests[k] && !(k in pendingCloudValues)) {
      failedUnion.add(k);
    }
  });
  return {
    apiBaseUrl: API_BASE_URL,
    hasSyncToken: Boolean(SUPABASE_ANON_KEY),
    browserOnline: typeof navigator !== 'undefined' ? navigator.onLine !== false : true,
    lastSyncRevision,
    lastSyncAt: cloudTelemetryState.lastSyncAt,
    lastHealthLatencyMs: cloudTelemetryState.lastHealthLatencyMs,
    lastHealthOk: cloudTelemetryState.lastHealthOk,
    lastDbName: cloudTelemetryState.lastDbName,
    lastServerCounts: cloudTelemetryState.lastServerCounts
      ? { ...cloudTelemetryState.lastServerCounts }
      : null,
    totalRequests: cloudTelemetryState.totalRequests,
    successfulRequests: cloudTelemetryState.successfulRequests,
    failedRequests: cloudTelemetryState.failedRequests,
    bytesSentUtf8: cloudTelemetryState.bytesSentUtf8,
    bytesReceivedUtf8: cloudTelemetryState.bytesReceivedUtf8,
    pendingKeysCount: Object.keys(pendingCloudValues).length,
    inFlightKeysCount: Object.keys(pendingCloudRequests).length,
    failedRetryQueueKeys: Array.from(failedUnion),
    endpointCapabilities: {
      version: versionEndpointSupported,
      manifest: manifestEndpointSupported,
      batch: batchEndpointSupported,
    },
    lastError: cloudTelemetryState.lastError ? { ...cloudTelemetryState.lastError } : null,
    recentEvents: cloudTelemetryState.recentEvents.map((ev) => ({ ...ev })),
  };
}

function notifyCloudMetricsSubscribers(): void {
  if (cloudMetricsSubscribers.size === 0 || metricsNotifyScheduled) return;
  metricsNotifyScheduled = true;
  const run = () => {
    metricsNotifyScheduled = false;
    const snap = buildCloudLiveMetricsSnapshot();
    cloudMetricsSubscribers.forEach((cb) => {
      try {
        cb(snap);
      } catch {
        // ignore subscriber callback error
      }
    });
  };
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(run);
  } else {
    setTimeout(run, 0);
  }
}

function recordCloudTrafficEvent(ev: {
  direction: CloudTrafficDirection;
  endpoint: string;
  method: 'GET' | 'POST' | 'DELETE';
  status: number | null;
  ok: boolean;
  durationMs: number;
  bytes: number;
  detail: string;
  errorMessage?: string;
}): void {
  const now = new Date();
  const timeShort = now.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const iso = now.toISOString();

  cloudTelemetryState.totalRequests += 1;
  if (ev.ok) {
    cloudTelemetryState.successfulRequests += 1;
    cloudTelemetryState.lastSyncAt = iso;
  } else {
    cloudTelemetryState.failedRequests += 1;
    cloudTelemetryState.lastError = {
      timestamp: timeShort,
      endpoint: ev.endpoint,
      status: ev.status,
      message: ev.errorMessage || ev.detail,
    };
  }

  if (ev.direction === 'up') {
    cloudTelemetryState.bytesSentUtf8 += Math.max(0, ev.bytes);
  } else {
    cloudTelemetryState.bytesReceivedUtf8 += Math.max(0, ev.bytes);
  }

  cloudTelemetryState.recentEvents.unshift({
    id: makeUniqueId('cev'),
    timestamp: iso,
    timeShort,
    direction: ev.direction,
    endpoint: ev.endpoint,
    method: ev.method,
    status: ev.status,
    ok: ev.ok,
    durationMs: Math.max(0, Math.round(ev.durationMs)),
    bytes: Math.max(0, Math.round(ev.bytes)),
    detail: ev.detail,
  });

  if (cloudTelemetryState.recentEvents.length > 25) {
    cloudTelemetryState.recentEvents.length = 25;
  }

  notifyCloudMetricsSubscribers();
}

function computeUploadTimeoutMs(utf8Bytes: number): number {
  if (utf8Bytes > 1_200_000) return 75000;
  if (utf8Bytes > 400_000) return 48000;
  return 25000;
}

function scheduleFailedRetryTimer(): void {
  if (failedRetryTimer !== undefined) return;
  if (Object.keys(failedCloudRetryQueue).length === 0) return;
  if (failedRetryAttempts >= MAX_AUTO_RETRY_CYCLES) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  if (typeof setTimeout !== 'function') return;

  const delays = [3000, 7000, 15000, 30000, 45000];
  const baseWait = delays[Math.min(failedRetryAttempts, delays.length - 1)];
  const jitterMs = Math.floor(Math.random() * 1400);
  const waitMs = baseWait + jitterMs;
  failedRetryTimer = setTimeout(() => {
    failedRetryTimer = undefined;
    failedRetryAttempts += 1;
    flushFailedRetryQueue();
  }, waitMs);
}

function enqueueFailedWrite(key: string, value: unknown): void {
  if (Object.keys(failedCloudRetryQueue).length >= MAX_RETRY_QUEUE_KEYS && !(key in failedCloudRetryQueue)) {
    const oldestKey = Object.keys(failedCloudRetryQueue)[0];
    if (oldestKey) delete failedCloudRetryQueue[oldestKey];
  }
  failedCloudRetryQueue[key] = value;
  markKeyDirtyForCloud(key);
  notifyCloudMetricsSubscribers();
  scheduleFailedRetryTimer();
}

// -------------------------------------------------------------
// لایه ابری Supabase (Storage WebP + صف پس‌زمینه ۱۵تایی + جدول students و app_storage)
// -------------------------------------------------------------

const STAFF_KEY_TO_AVATAR_ROLE: Record<string, AvatarUploadRole> = {
  [STORAGE_KEYS.SUPERVISORS]: 'supervisor',
  [STORAGE_KEYS.MAINTENANCE_STAFF]: 'maintenance',
  [STORAGE_KEYS.WAREHOUSE_STAFF]: 'warehouse',
  [STORAGE_KEYS.COUNSELORS]: 'counselor',
  [STORAGE_KEYS.FINANCE_STAFF]: 'finance',
  [STORAGE_KEYS.PROCUREMENT_STAFF]: 'procurement',
  [STORAGE_KEYS.EDUCATION_STAFF]: 'education',
  [STORAGE_KEYS.CULTURAL_STAFF]: 'cultural',
  [STORAGE_KEYS.STUDENT_AFFAIRS_STAFF]: 'student_affairs',
  [STORAGE_KEYS.SECURITY_STAFF]: 'security',
  [STORAGE_KEYS.VICE_DEAN_STAFF]: 'vice_dean',
  [STORAGE_KEYS.LIBRARY_STAFF]: 'library',
  [STORAGE_KEYS.SMART_CAMPUS_STAFF]: 'smart_campus',
  [STORAGE_KEYS.GRADUATION_STAFF]: 'graduation',
  [STORAGE_KEYS.ACADEMIC_DEPUTY_STAFF]: 'academic_deputy',
  [STORAGE_KEYS.SCHED_PROFESSORS]: 'professor',
};

function sanitizeStorageSegment(raw: string): string {
  const normalized = String(raw ?? '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '_');
  return normalized.slice(0, 80) || `id_${Date.now()}`;
}

function isBase64ImageDataUrl(val: unknown): val is string {
  return typeof val === 'string' && val.trim().startsWith('data:image/');
}

function dataUrlToRawBlob(dataUrl: string): Blob | null {
  try {
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) return null;
    const header = dataUrl.slice(0, commaIdx);
    const base64Body = dataUrl.slice(commaIdx + 1);
    const mimeMatch = header.match(/data:([^;]+);base64/i);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const binary = atob(base64Body);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

async function compressBase64ToWebpBlob(
  dataUrl: string,
  maxDim = 400,
  quality = 0.8
): Promise<{ blob: Blob; contentType: string; ext: string } | null> {
  if (!isBase64ImageDataUrl(dataUrl)) return null;
  if (dataUrl.slice(0, 48).toLowerCase().includes('image/svg+xml')) {
    return null;
  }

  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    const raw = dataUrlToRawBlob(dataUrl);
    if (!raw) return null;
    return {
      blob: raw,
      contentType: raw.type || 'image/webp',
      ext: raw.type.includes('webp') ? 'webp' : 'jpg',
    };
  }

  return await new Promise<{ blob: Blob; contentType: string; ext: string } | null>((resolve) => {
    const img = new Image();
    img.onerror = () => {
      const fallbackBlob = dataUrlToRawBlob(dataUrl);
      if (fallbackBlob) {
        resolve({
          blob: fallbackBlob,
          contentType: fallbackBlob.type || 'image/jpeg',
          ext: fallbackBlob.type.includes('webp') ? 'webp' : 'jpg',
        });
      } else {
        resolve(null);
      }
    };
    img.onload = () => {
      let width = img.naturalWidth || img.width || maxDim;
      let height = img.naturalHeight || img.height || maxDim;
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
        const fallbackBlob = dataUrlToRawBlob(dataUrl);
        resolve(
          fallbackBlob
            ? { blob: fallbackBlob, contentType: fallbackBlob.type || 'image/jpeg', ext: 'jpg' }
            : null
        );
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const finishWithFallback = () => {
        canvas.toBlob(
          (jpgBlob) => {
            if (jpgBlob) {
              resolve({ blob: jpgBlob, contentType: 'image/jpeg', ext: 'jpg' });
            } else {
              const raw = dataUrlToRawBlob(dataUrl);
              resolve(raw ? { blob: raw, contentType: raw.type || 'image/jpeg', ext: 'jpg' } : null);
            }
          },
          'image/jpeg',
          quality
        );
      };

      if (typeof canvas.toBlob === 'function') {
        canvas.toBlob(
          (webpBlob) => {
            if (webpBlob && webpBlob.size > 0 && webpBlob.type === 'image/webp') {
              resolve({ blob: webpBlob, contentType: 'image/webp', ext: 'webp' });
            } else if (webpBlob && webpBlob.size > 0) {
              resolve({
                blob: webpBlob,
                contentType: webpBlob.type || 'image/jpeg',
                ext: webpBlob.type.includes('webp') ? 'webp' : 'jpg',
              });
            } else {
              finishWithFallback();
            }
          },
          'image/webp',
          quality
        );
      } else {
        const raw = dataUrlToRawBlob(canvas.toDataURL('image/webp', quality));
        resolve(raw ? { blob: raw, contentType: raw.type || 'image/webp', ext: 'webp' } : null);
      }
    };
    img.src = dataUrl;
  });
}

async function uploadBase64ToSupabaseAvatar(
  role: AvatarUploadRole,
  userId: string,
  dataUrl: string
): Promise<{ ok: boolean; publicUrl?: string; errorMessage?: string }> {
  if (!isBase64ImageDataUrl(dataUrl)) {
    return { ok: true, publicUrl: dataUrl };
  }
  if (dataUrl.slice(0, 48).toLowerCase().includes('image/svg+xml')) {
    return {
      ok: false,
      errorMessage: 'فرمت SVG مجاز نیست. لطفاً تصویر JPG، PNG یا WebP بارگذاری کنید.',
    };
  }

  const compressed = await compressBase64ToWebpBlob(dataUrl, 400, 0.8);
  if (!compressed) {
    return { ok: false, errorMessage: 'خطا در فشرده‌سازی تصویر به فرمت WebP.' };
  }

  const safeId = sanitizeStorageSegment(userId);
  const filePath = `${role}_${safeId}.${compressed.ext}`;
  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();

  let lastErrMsg = '';
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const { error } = await supabase.storage
        .from(SUPABASE_AVATARS_BUCKET)
        .upload(filePath, compressed.blob, {
          upsert: true,
          contentType: compressed.contentType,
          cacheControl: '3600',
        });

      const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;

      if (!error) {
        const { data: urlData } = supabase.storage
          .from(SUPABASE_AVATARS_BUCKET)
          .getPublicUrl(filePath);
        const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;
        recordCloudTrafficEvent({
          direction: 'up',
          endpoint: `/storage/avatars/${filePath}`,
          method: 'POST',
          status: 200,
          ok: true,
          durationMs: dur,
          bytes: compressed.blob.size,
          detail: `آپلود تصویر WebP (${Math.max(1, Math.round(compressed.blob.size / 1024))} KB)`,
        });
        return { ok: true, publicUrl };
      }

      lastErrMsg = error.message || 'خطا در بارگذاری تصویر در Supabase Storage';
      recordCloudTrafficEvent({
        direction: 'up',
        endpoint: `/storage/avatars/${filePath}`,
        method: 'POST',
        status: 500,
        ok: false,
        durationMs: dur,
        bytes: compressed.blob.size,
        detail: `خطا در آپلود تصویر ${filePath}`,
        errorMessage: lastErrMsg,
      });
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 600));
      }
    } catch (err) {
      const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;
      lastErrMsg = err instanceof Error ? err.message : 'خطای شبکه در آپلود تصویر';
      recordCloudTrafficEvent({
        direction: 'up',
        endpoint: `/storage/avatars/${filePath}`,
        method: 'POST',
        status: null,
        ok: false,
        durationMs: dur,
        bytes: compressed.blob.size,
        detail: `وقفه در آپلود تصویر ${filePath}`,
        errorMessage: lastErrMsg,
      });
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }
  }

  return { ok: false, errorMessage: lastErrMsg || 'آپلود تصویر در Supabase Storage ناموفق بود.' };
}

async function runConcurrentQueue<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<void> {
  if (items.length === 0) return;
  const limit = Math.max(1, Math.min(concurrency, items.length));
  let cursor = 0;
  const runners = Array.from({ length: limit }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      await worker(items[idx], idx);
    }
  });
  await Promise.all(runners);
}

interface BackgroundAvatarTask {
  role: AvatarUploadRole;
  userId: string;
  dataUrl: string;
  storageKey: string;
}

const backgroundAvatarQueueMap = new Map<string, BackgroundAvatarTask>();
let backgroundAvatarWorkerActive = false;
let backgroundAvatarStats = {
  queued: 0,
  completed: 0,
  failed: 0,
  inProgress: false,
};

function getCurrentLocalCollection<T>(key: string): T | null {
  if (parsedCache.has(key)) {
    return cloneValue(parsedCache.get(key) as T);
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return sanitizePlainValue(JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

function enqueueBackgroundAvatarTasks(tasks: BackgroundAvatarTask[]): void {
  if (tasks.length === 0) return;
  for (const t of tasks) {
    if (!t.userId || !isBase64ImageDataUrl(t.dataUrl)) continue;
    backgroundAvatarQueueMap.set(`${t.role}:${t.userId}`, t);
  }
  backgroundAvatarStats.queued = backgroundAvatarQueueMap.size;
  if (!backgroundAvatarWorkerActive && backgroundAvatarQueueMap.size > 0) {
    void processBackgroundAvatarQueue();
  }
}

async function processBackgroundAvatarQueue(): Promise<void> {
  if (backgroundAvatarWorkerActive) return;
  backgroundAvatarWorkerActive = true;
  backgroundAvatarStats.inProgress = true;

  try {
    while (backgroundAvatarQueueMap.size > 0) {
      const wave: BackgroundAvatarTask[] = [];
      for (const [k, task] of backgroundAvatarQueueMap.entries()) {
        wave.push(task);
        backgroundAvatarQueueMap.delete(k);
        if (wave.length >= AVATAR_UPLOAD_CONCURRENCY) break;
      }
      if (wave.length === 0) break;

      const uploadedStudents = new Map<string, string>();
      const uploadedStaffByKey = new Map<string, Map<string, string>>();

      await runConcurrentQueue(wave, AVATAR_UPLOAD_CONCURRENCY, async (task) => {
        const res = await uploadBase64ToSupabaseAvatar(task.role, task.userId, task.dataUrl);
        if (res.ok && res.publicUrl) {
          backgroundAvatarStats.completed += 1;
          if (task.role === 'student') {
            uploadedStudents.set(task.userId, res.publicUrl);
          } else {
            const m = uploadedStaffByKey.get(task.storageKey) || new Map<string, string>();
            m.set(task.userId, res.publicUrl);
            uploadedStaffByKey.set(task.storageKey, m);
          }
        } else {
          backgroundAvatarStats.failed += 1;
        }
      });

      // جایگزینی لینک‌های عمومی جدید در حافظه محلی و دیتابیس Supabase
      if (uploadedStudents.size > 0) {
        const localStudents = getCurrentLocalCollection<Student[]>(STORAGE_KEYS.STUDENTS);
        if (Array.isArray(localStudents)) {
          const updatedRows: Student[] = [];
          const nextStudents = localStudents.map((st) => {
            const newUrl = uploadedStudents.get(st.studentId);
            if (newUrl) {
              const updated = { ...st, photoUrl: newUrl };
              updatedRows.push(updated);
              return updated;
            }
            return st;
          });
          if (updatedRows.length > 0) {
            safeLocalStorageSet(STORAGE_KEYS.STUDENTS, JSON.stringify(nextStudents), nextStudents);
            await upsertStudentRowsToSupabase(updatedRows);
            notifyCloudDataChanged();
          }
        }
      }

      for (const [sKey, idUrlMap] of uploadedStaffByKey.entries()) {
        const list = getCurrentLocalCollection<Array<Record<string, unknown>>>(sKey);
        if (Array.isArray(list)) {
          let changed = false;
          const nextList = list.map((item) => {
            const id = String(item?.id || '').trim();
            const newUrl = idUrlMap.get(id);
            if (newUrl) {
              changed = true;
              return { ...item, photoUrl: newUrl };
            }
            return item;
          });
          if (changed) {
            safeLocalStorageSet(sKey, JSON.stringify(nextList), nextList);
            void sendSingleKeyPost(sKey, nextList, false, 2);
            notifyCloudDataChanged();
          }
        }
      }

      backgroundAvatarStats.queued = backgroundAvatarQueueMap.size;
      // تنفس کوتاه برای آزاد نگه‌داشتن رابط کاربری هنگام آپلود هزاران تصویر
      if (backgroundAvatarQueueMap.size > 0) {
        await new Promise((r) => setTimeout(r, 40));
      }
    }
  } finally {
    backgroundAvatarWorkerActive = false;
    backgroundAvatarStats.inProgress = false;
    backgroundAvatarStats.queued = backgroundAvatarQueueMap.size;
  }
}

function buildSupabaseStudentRow(student: Student): {
  id: string;
  national_code: string | null;
  data: Student;
  avatar_url: string | null;
  updated_at: string;
} {
  const id = String(student.studentId || '').trim();
  const nationalCode = String(student.nationalId || '').trim() || null;
  const rawPhoto = typeof student.photoUrl === 'string' ? student.photoUrl.trim() : '';
  // هرگز رشته حجیم Base64 داخل جدول students ذخیره نمی‌شود
  const cleanPhotoUrl = rawPhoto && !rawPhoto.startsWith('data:image/') ? rawPhoto : null;
  const cleanStudent: Student = {
    ...student,
    studentId: id,
    photoUrl: cleanPhotoUrl || undefined,
  };
  return {
    id,
    national_code: nationalCode,
    data: cleanStudent,
    avatar_url: cleanPhotoUrl,
    updated_at: new Date().toISOString(),
  };
}

function mapSupabaseRowToStudent(row: Record<string, unknown>): Student {
  const rawData =
    row.data && typeof row.data === 'object' && !Array.isArray(row.data)
      ? (row.data as Record<string, unknown>)
      : {};
  const avatarUrl =
    typeof row.avatar_url === 'string' && row.avatar_url.trim()
      ? row.avatar_url.trim()
      : typeof rawData.photoUrl === 'string' && rawData.photoUrl.trim()
      ? rawData.photoUrl.trim()
      : undefined;

  return normalizeStudentRecord(
    sanitizePlainValue({
      ...rawData,
      studentId: String(rawData.studentId || row.id || '').trim(),
      nationalId: String(rawData.nationalId || row.national_code || '').trim(),
      photoUrl: avatarUrl,
    })
  );
}

function stripBase64ImageStringsDeep<T>(value: T, depth = 0): T {
  if (depth > 25 || value === null || value === undefined) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('data:image')) {
      return '' as unknown as T;
    }
    if (trimmed.includes('data:image/')) {
      return trimmed.replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, '') as unknown as T;
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => stripBase64ImageStringsDeep(item, depth + 1)) as unknown as T;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof v === 'string' && v.trim().startsWith('data:image')) {
        // حذف کامل رشته‌های data:image از کلیدهای عملیاتی app_storage (کتابخانه، هوشمندسازی، تسویه حساب، پیام‌ها و...)
        continue;
      }
      out[k] = stripBase64ImageStringsDeep(v, depth + 1);
    }
    return out as T;
  }
  return value;
}

function sanitizeValueForAppStorage(key: string, value: unknown): unknown {
  const staffRole = STAFF_KEY_TO_AVATAR_ROLE[key];
  if (staffRole && Array.isArray(value)) {
    const bgTasks: BackgroundAvatarTask[] = [];
    const cleaned = value.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const rec = item as Record<string, unknown>;
      const id = String(rec.id || '').trim();
      const photo = rec.photoUrl;
      if (isBase64ImageDataUrl(photo)) {
        if (id) {
          bgTasks.push({ role: staffRole, userId: id, dataUrl: photo, storageKey: key });
        }
        return { ...rec, photoUrl: undefined };
      }
      return rec;
    });
    if (bgTasks.length > 0) {
      enqueueBackgroundAvatarTasks(bgTasks);
    }
    return stripBase64ImageStringsDeep(cleaned);
  }
  if (!MEDIA_ALLOWED_APP_STORAGE_KEYS.has(key)) {
    return stripBase64ImageStringsDeep(value);
  }
  return value;
}

async function upsertStudentRowsToSupabase(studentsChunk: Student[]): Promise<boolean> {
  const rows = studentsChunk
    .filter((s) => Boolean(s && String(s.studentId || '').trim()))
    .map((s) => buildSupabaseStudentRow(s));
  if (rows.length === 0) return true;

  const payloadBytes = getUtf8ByteLength(JSON.stringify(rows));
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
    try {
      const { error } = await supabase.from('students').upsert(rows, { onConflict: 'id' });
      const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;
      if (!error) {
        recordCloudTrafficEvent({
          direction: 'up',
          endpoint: '/supabase/students',
          method: 'POST',
          status: 200,
          ok: true,
          durationMs: dur,
          bytes: payloadBytes,
          detail: `ثبت دسته‌ای ${rows.length.toLocaleString('fa-IR')} دانشجو در Supabase`,
        });
        return true;
      }
      recordCloudTrafficEvent({
        direction: 'up',
        endpoint: '/supabase/students',
        method: 'POST',
        status: 500,
        ok: false,
        durationMs: dur,
        bytes: payloadBytes,
        detail: `خطا در ثبت ${rows.length.toLocaleString('fa-IR')} دانشجو در Supabase`,
        errorMessage: error.message,
      });
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 700));
        continue;
      }
      return false;
    } catch (err) {
      const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;
      recordCloudTrafficEvent({
        direction: 'up',
        endpoint: '/supabase/students',
        method: 'POST',
        status: null,
        ok: false,
        durationMs: dur,
        bytes: payloadBytes,
        detail: 'وقفه شبکه در ثبت جدول students در Supabase',
        errorMessage: err instanceof Error ? err.message : 'Network error',
      });
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 700));
        continue;
      }
      return false;
    }
  }
  return false;
}

async function deleteStudentFromSupabase(studentId: string): Promise<boolean> {
  const cleanId = String(studentId || '').trim();
  if (!cleanId) return false;
  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
  try {
    const { error } = await supabase.from('students').delete().eq('id', cleanId);
    const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;
    recordCloudTrafficEvent({
      direction: 'up',
      endpoint: `/supabase/students/${cleanId}`,
      method: 'DELETE',
      status: error ? 500 : 200,
      ok: !error,
      durationMs: dur,
      bytes: cleanId.length,
      detail: error
        ? `خطا در حذف دانشجو (${cleanId}) از Supabase`
        : `حذف فوری دانشجو (${cleanId}) از Supabase`,
      errorMessage: error?.message,
    });
    return !error;
  } catch (err) {
    const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;
    recordCloudTrafficEvent({
      direction: 'up',
      endpoint: `/supabase/students/${cleanId}`,
      method: 'DELETE',
      status: null,
      ok: false,
      durationMs: dur,
      bytes: 0,
      detail: `خطای شبکه در حذف دانشجو (${cleanId})`,
      errorMessage: err instanceof Error ? err.message : 'Network error',
    });
    return false;
  }
}

function mirrorSingleStudentToCloud(student: Student): Promise<boolean> {
  if (!student?.studentId) {
    return Promise.resolve(false);
  }

  const runPromise = (async (): Promise<boolean> => {
    let targetStudent = student;
    if (isBase64ImageDataUrl(student.photoUrl)) {
      const uploadRes = await uploadBase64ToSupabaseAvatar('student', student.studentId, student.photoUrl);
      if (uploadRes.ok && uploadRes.publicUrl) {
        targetStudent = { ...student, photoUrl: uploadRes.publicUrl };
        const localList = getCurrentLocalCollection<Student[]>(STORAGE_KEYS.STUDENTS);
        if (Array.isArray(localList)) {
          const idx = localList.findIndex((s) => s.studentId === student.studentId);
          if (idx !== -1) {
            localList[idx] = { ...localList[idx], photoUrl: uploadRes.publicUrl };
            safeLocalStorageSet(STORAGE_KEYS.STUDENTS, JSON.stringify(localList), localList);
            notifyCloudDataChanged();
          }
        }
      }
    }

    const ok = await upsertStudentRowsToSupabase([targetStudent]);
    if (ok) {
      const ts = new Date().toISOString();
      lastSyncRevision = ts;
      updateLocalCloudKeyTimestamp(STORAGE_KEYS.STUDENTS, ts);
      delete failedCloudRetryQueue[STORAGE_KEYS.STUDENTS];
      clearKeyDirtyForCloud(STORAGE_KEYS.STUDENTS);
    }
    return ok;
  })().finally(() => {
    activeStudentMirrorPromises.delete(runPromise);
    notifyCloudMetricsSubscribers();
  });

  activeStudentMirrorPromises.add(runPromise);
  return runPromise;
}

async function mirrorStudentsCollectionToCloud(
  studentsList: Student[],
  options?: { replaceAll?: boolean; onProgress?: (message: string) => void }
): Promise<{ ok: boolean; count: number; revision: string | number | null }> {
  if (!Array.isArray(studentsList)) {
    return { ok: true, count: 0, revision: null };
  }

  // استخراج تصاویر Base64 برای آپلود در صف پس‌زمینه ۱۵تایی بدون قفل شدن رابط کاربری
  const bgTasks: BackgroundAvatarTask[] = [];
  for (const st of studentsList) {
    if (st?.studentId && isBase64ImageDataUrl(st.photoUrl)) {
      bgTasks.push({
        role: 'student',
        userId: st.studentId,
        dataUrl: st.photoUrl,
        storageKey: STORAGE_KEYS.STUDENTS,
      });
    }
  }
  if (bgTasks.length > 0) {
    enqueueBackgroundAvatarTasks(bgTasks);
  }

  const chunkSize = SUPABASE_STUDENTS_UPSERT_CHUNK;
  const totalChunks = Math.ceil(studentsList.length / chunkSize);
  let syncedCount = 0;
  let allChunksOk = true;

  for (let idx = 0; idx < totalChunks; idx += 1) {
    const chunk = studentsList.slice(idx * chunkSize, (idx + 1) * chunkSize);
    options?.onProgress?.(
      `در حال ثبت دسته‌ای دانشجویان در Supabase (دسته ${(idx + 1).toLocaleString('fa-IR')} از ${totalChunks.toLocaleString('fa-IR')} — هر دسته ۲۰۰ نفر)...`
    );
    const ok = await upsertStudentRowsToSupabase(chunk);
    if (ok) {
      syncedCount += chunk.length;
    } else {
      allChunksOk = false;
    }
  }

  // در حالت هم‌ترازی کامل (replaceAll)، رکوردهای حذف‌شده از مرورگر را از جدول students پاک می‌کنیم
  if (options?.replaceAll && allChunksOk) {
    try {
      const keepIdSet = new Set(
        studentsList.map((s) => String(s?.studentId || '').trim()).filter(Boolean)
      );
      const remoteIds: string[] = [];
      let from = 0;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from('students')
          .select('id')
          .order('id', { ascending: true })
          .range(from, from + SUPABASE_STUDENTS_PAGE_SIZE - 1);
        if (error || !Array.isArray(data)) {
          hasMore = false;
          break;
        }
        for (const r of data) {
          if (r && typeof r.id === 'string') remoteIds.push(r.id);
        }
        hasMore = data.length === SUPABASE_STUDENTS_PAGE_SIZE;
        from += SUPABASE_STUDENTS_PAGE_SIZE;
      }

      const idsToDelete = remoteIds.filter((id) => !keepIdSet.has(id));
      for (let i = 0; i < idsToDelete.length; i += chunkSize) {
        const delBatch = idsToDelete.slice(i, i + chunkSize);
        await supabase.from('students').delete().in('id', delBatch);
      }
    } catch {
      // ادامه بدون توقف در صورت خطای پاکسازی
    }
  }

  const latestRevision = allChunksOk ? new Date().toISOString() : null;
  if (allChunksOk && latestRevision) {
    lastSyncRevision = latestRevision;
    updateLocalCloudKeyTimestamp(STORAGE_KEYS.STUDENTS, latestRevision);
    delete failedCloudRetryQueue[STORAGE_KEYS.STUDENTS];
    clearKeyDirtyForCloud(STORAGE_KEYS.STUDENTS);
  }
  return { ok: allChunksOk, count: syncedCount, revision: latestRevision };
}

function sendSingleKeyPost(
  key: string,
  value: unknown,
  keepalive = false,
  maxAttempts = 3
): Promise<boolean> {
  // کلید دانشجویان منحصراً در جدول اختصاصی students ذخیره می‌شود (نه در app_storage)
  if (key === STORAGE_KEYS.STUDENTS) {
    const reqPromise = (async (): Promise<boolean> => {
      const list = Array.isArray(value) ? (value as Student[]) : [];
      const res = await mirrorStudentsCollectionToCloud(list, { replaceAll: false });
      if (!res.ok) {
        enqueueFailedWrite(key, value);
      }
      return res.ok;
    })().finally(() => {
      if (pendingCloudRequests[key] === reqPromise) {
        delete pendingCloudRequests[key];
      }
      notifyCloudMetricsSubscribers();
      if (key in pendingCloudValues && !keepalive) {
        setTimeout(() => flushAllPendingCloudTimers(false), 10);
      }
    });
    pendingCloudRequests[key] = reqPromise;
    notifyCloudMetricsSubscribers();
    return reqPromise;
  }

  const sanitizedVal = sanitizeValueForAppStorage(key, value);
  let payloadBytes = 0;
  try {
    payloadBytes = getUtf8ByteLength(JSON.stringify(sanitizedVal));
  } catch {
    return Promise.resolve(false);
  }

  const attemptsToRun = keepalive ? 1 : Math.max(1, maxAttempts);

  const reqPromise = (async (): Promise<boolean> => {
    for (let attempt = 1; attempt <= attemptsToRun; attempt += 1) {
      const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const updatedAt = new Date().toISOString();
      try {
        const { error } = await supabase
          .from('app_storage')
          .upsert({ key, value: sanitizedVal, updated_at: updatedAt }, { onConflict: 'key' });
        const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;

        if (!error) {
          lastSyncRevision = updatedAt;
          updateLocalCloudKeyTimestamp(key, updatedAt);
          delete failedCloudRetryQueue[key];
          clearKeyDirtyForCloud(key);
          failedRetryAttempts = 0;
          recordCloudTrafficEvent({
            direction: 'up',
            endpoint: `/supabase/app_storage/${FRIENDLY_SYNC_KEY_LABELS[key] || key}`,
            method: 'POST',
            status: 200,
            ok: true,
            durationMs: dur,
            bytes: payloadBytes,
            detail: `ذخیره فوری ${FRIENDLY_SYNC_KEY_LABELS[key] || key} در Supabase`,
          });
          return true;
        }

        const retryable = !keepalive && attempt < attemptsToRun;
        recordCloudTrafficEvent({
          direction: 'up',
          endpoint: '/supabase/app_storage',
          method: 'POST',
          status: 500,
          ok: false,
          durationMs: dur,
          bytes: payloadBytes,
          detail: retryable
            ? `خطا در ارسال ${FRIENDLY_SYNC_KEY_LABELS[key] || key} (تلاش مجدد ${attempt + 1}/${attemptsToRun})`
            : `خطا در ثبت ${FRIENDLY_SYNC_KEY_LABELS[key] || key} در Supabase`,
          errorMessage: error.message,
        });

        if (retryable) {
          await new Promise((r) => setTimeout(r, attempt === 1 ? 650 : 1500));
          continue;
        }

        enqueueFailedWrite(key, value);
        return false;
      } catch (err) {
        const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;
        const retryable = !keepalive && attempt < attemptsToRun;
        recordCloudTrafficEvent({
          direction: 'up',
          endpoint: '/supabase/app_storage',
          method: 'POST',
          status: null,
          ok: false,
          durationMs: dur,
          bytes: payloadBytes,
          detail: retryable
            ? `وقفه شبکه در ارسال ${FRIENDLY_SYNC_KEY_LABELS[key] || key} (تلاش مجدد ${attempt + 1}/${attemptsToRun})`
            : `عدم پاسخ در ارسال ${FRIENDLY_SYNC_KEY_LABELS[key] || key}`,
          errorMessage: err instanceof Error ? err.message : 'خطای شبکه',
        });

        if (retryable) {
          await new Promise((r) => setTimeout(r, attempt === 1 ? 650 : 1500));
          continue;
        }

        enqueueFailedWrite(key, value);
        return false;
      }
    }
    enqueueFailedWrite(key, value);
    return false;
  })().finally(() => {
    if (pendingCloudRequests[key] === reqPromise) {
      delete pendingCloudRequests[key];
    }
    notifyCloudMetricsSubscribers();
    if (key in pendingCloudValues && !keepalive) {
      setTimeout(() => {
        flushAllPendingCloudTimers(false);
      }, 10);
    }
  });

  pendingCloudRequests[key] = reqPromise;
  notifyCloudMetricsSubscribers();
  return reqPromise;
}

function sendCompactBatchWithFallback(
  batchEntries: Array<{ key: string; value: unknown; byteEstimate: number }>,
  keepalive = false
): void {
  const nonStudentEntries = batchEntries.filter((e) => e.key !== STORAGE_KEYS.STUDENTS);
  const studentEntries = batchEntries.filter((e) => e.key === STORAGE_KEYS.STUDENTS);
  studentEntries.forEach((e) => {
    void sendSingleKeyPost(e.key, e.value, keepalive, 2);
  });

  if (nonStudentEntries.length === 0) return;
  if (nonStudentEntries.length === 1) {
    void sendSingleKeyPost(nonStudentEntries[0].key, nonStudentEntries[0].value, keepalive, 3);
    return;
  }

  const updatedAt = new Date().toISOString();
  const rows = nonStudentEntries.map((e) => ({
    key: e.key,
    value: sanitizeValueForAppStorage(e.key, e.value),
    updated_at: updatedAt,
  }));

  let payloadBytes = 0;
  try {
    payloadBytes = getUtf8ByteLength(JSON.stringify(rows));
  } catch {
    nonStudentEntries.forEach((e) => {
      void sendSingleKeyPost(e.key, e.value, keepalive, 3);
    });
    return;
  }

  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const batchPromise = (async (): Promise<boolean> => {
    try {
      const { error } = await supabase.from('app_storage').upsert(rows, { onConflict: 'key' });
      const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;
      if (!error) {
        batchEndpointSupported = true;
        lastSyncRevision = updatedAt;
        nonStudentEntries.forEach((e) => {
          updateLocalCloudKeyTimestamp(e.key, updatedAt);
          delete failedCloudRetryQueue[e.key];
          clearKeyDirtyForCloud(e.key);
        });
        failedRetryAttempts = 0;
        recordCloudTrafficEvent({
          direction: 'up',
          endpoint: '/supabase/app_storage (batch)',
          method: 'POST',
          status: 200,
          ok: true,
          durationMs: dur,
          bytes: payloadBytes,
          detail: `ذخیره دسته‌ای ${nonStudentEntries.length} جدول در Supabase`,
        });
        return true;
      }

      recordCloudTrafficEvent({
        direction: 'up',
        endpoint: '/supabase/app_storage (batch)',
        method: 'POST',
        status: 500,
        ok: false,
        durationMs: dur,
        bytes: payloadBytes,
        detail: `خطا در ارسال دسته‌ای (${nonStudentEntries.length} جدول) — ارسال تفکیکی خودکار`,
        errorMessage: error.message,
      });
      if (!keepalive) {
        const fallbacks = await Promise.all(
          nonStudentEntries.map((e) => sendSingleKeyPost(e.key, e.value, false, 2))
        );
        return fallbacks.every(Boolean);
      }
      nonStudentEntries.forEach((e) => enqueueFailedWrite(e.key, e.value));
      return false;
    } catch (err) {
      const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;
      recordCloudTrafficEvent({
        direction: 'up',
        endpoint: '/supabase/app_storage (batch)',
        method: 'POST',
        status: null,
        ok: false,
        durationMs: dur,
        bytes: payloadBytes,
        detail: `وقفه در ارسال دسته‌ای (${nonStudentEntries.length} جدول) — ارسال تفکیکی خودکار`,
        errorMessage: err instanceof Error ? err.message : 'خطای شبکه',
      });
      if (!keepalive) {
        const fallbacks = await Promise.all(
          nonStudentEntries.map((e) => sendSingleKeyPost(e.key, e.value, false, 2))
        );
        return fallbacks.every(Boolean);
      }
      nonStudentEntries.forEach((e) => enqueueFailedWrite(e.key, e.value));
      return false;
    }
  })().finally(() => {
    let hasChainedWrite = false;
    nonStudentEntries.forEach((e) => {
      if (pendingCloudRequests[e.key] === batchPromise) {
        delete pendingCloudRequests[e.key];
      }
      if (e.key in pendingCloudValues) {
        hasChainedWrite = true;
      }
    });
    notifyCloudMetricsSubscribers();
    if (hasChainedWrite && !keepalive) {
      setTimeout(() => {
        flushAllPendingCloudTimers(false);
      }, 10);
    }
  });

  nonStudentEntries.forEach((e) => {
    pendingCloudRequests[e.key] = batchPromise;
  });
  notifyCloudMetricsSubscribers();
}

function flushAllPendingCloudTimers(keepalive = false): void {
  if (coalescedFlushTimer !== undefined) {
    clearTimeout(coalescedFlushTimer);
    coalescedFlushTimer = undefined;
    coalescedFlushDueAt = 0;
  }

  const readyEntries: Array<{ key: string; value: unknown; byteEstimate: number }> = [];
  for (const k of Object.keys(pendingCloudValues)) {
    if (!keepalive && pendingCloudRequests[k]) {
      continue;
    }
    const val = pendingCloudValues[k];
    delete pendingCloudValues[k];
    keyWriteTimestamps[k] = Date.now();
    let byteEstimate = 0;
    try {
      byteEstimate = getUtf8ByteLength(JSON.stringify(val));
    } catch {
      byteEstimate = 0;
    }
    readyEntries.push({ key: k, value: val, byteEstimate });
  }

  if (readyEntries.length === 0) return;

  const soloEntries: Array<{ key: string; value: unknown; byteEstimate: number }> = [];
  const compactEntries: Array<{ key: string; value: unknown; byteEstimate: number }> = [];

  for (const entry of readyEntries) {
    if (entry.key === STORAGE_KEYS.STUDENTS || SOLO_HEAVY_KEYS.has(entry.key) || entry.byteEstimate > 400_000) {
      soloEntries.push(entry);
    } else {
      compactEntries.push(entry);
    }
  }

  for (const solo of soloEntries) {
    void sendSingleKeyPost(solo.key, solo.value, keepalive, 3);
  }

  if (compactEntries.length > 0) {
    const MAX_COMPACT_BATCH_BYTES = 1_200_000;
    let currentBatch: Array<{ key: string; value: unknown; byteEstimate: number }> = [];
    let currentBytes = 0;

    for (const item of compactEntries) {
      if (
        currentBatch.length > 0 &&
        (currentBatch.length >= 10 || currentBytes + item.byteEstimate > MAX_COMPACT_BATCH_BYTES)
      ) {
        sendCompactBatchWithFallback(currentBatch, keepalive);
        currentBatch = [];
        currentBytes = 0;
      }
      currentBatch.push(item);
      currentBytes += item.byteEstimate;
    }
    if (currentBatch.length > 0) {
      sendCompactBatchWithFallback(currentBatch, keepalive);
    }
  }
}

function flushFailedRetryQueue(): void {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  if (failedRetryTimer !== undefined) {
    clearTimeout(failedRetryTimer);
    failedRetryTimer = undefined;
  }
  const retryKeys = Object.keys(failedCloudRetryQueue);
  if (retryKeys.length === 0) return;
  for (const k of retryKeys) {
    if (!(k in pendingCloudValues)) {
      pendingCloudValues[k] = failedCloudRetryQueue[k];
    }
    delete failedCloudRetryQueue[k];
  }
  flushAllPendingCloudTimers(false);
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('beforeunload', () => {
    flushAllPendingCloudTimers(true);
  });
  window.addEventListener('pagehide', () => {
    flushAllPendingCloudTimers(true);
  });
  window.addEventListener('online', () => {
    failedRetryAttempts = 0;
    notifyCloudMetricsSubscribers();
    flushFailedRetryQueue();
  });
  window.addEventListener('offline', () => {
    notifyCloudMetricsSubscribers();
  });
  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushAllPendingCloudTimers(true);
      } else if (document.visibilityState === 'visible') {
        failedRetryAttempts = 0;
        flushFailedRetryQueue();
      }
    });
  }
  // اگر تغییرات ارسال‌نشده از نشست قبلی در حافظه مانده بود، بلافاصله پس از بارگذاری به سرور ابری ارسال شوند
  if (Object.keys(failedCloudRetryQueue).length > 0) {
    setTimeout(() => {
      flushFailedRetryQueue();
    }, 1200);
  }
}

function pushKeyToCloud<T>(key: string, value: T): void {
  if (key === STORAGE_KEYS.CURRENT_USER) return;
  keyWriteTimestamps[key] = Date.now();
  pendingCloudValues[key] = value;
  markKeyDirtyForCloud(key);
  failedRetryAttempts = 0;

  if (typeof fetch !== 'function') {
    delete pendingCloudValues[key];
    return;
  }

  // ثبت/ویرایش هر نوع کاربر و تنظیمات با اولویت فوری (15ms) به سرور ابری ارسال می‌شود
  const desiredDelay = IMMEDIATE_CLOUD_KEYS.has(key) ? CLOUD_SYNC_IMMEDIATE_MS : CLOUD_SYNC_DEBOUNCE_MS;
  const now = Date.now();
  const targetDueAt = now + desiredDelay;

  if (coalescedFlushTimer !== undefined) {
    // اگر تایمر فعلی زودتر از زمان جدید منقضی می‌شود، آن را به تعویق نمی‌اندازیم تا نوشتن فوری کاربر معطل نشود
    if (coalescedFlushDueAt > 0 && coalescedFlushDueAt <= targetDueAt) {
      notifyCloudMetricsSubscribers();
      return;
    }
    clearTimeout(coalescedFlushTimer);
  }

  coalescedFlushDueAt = targetDueAt;
  coalescedFlushTimer = setTimeout(() => {
    flushAllPendingCloudTimers(false);
  }, desiredDelay);
  notifyCloudMetricsSubscribers();
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

export function normalizeAssignedFieldsList(fields?: string[]): string[] {
  if (!Array.isArray(fields)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of fields) {
    const trimmed = String(raw || '').trim();
    const key = normalizePersianSearch(trimmed);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

export function isEducationDepartmentHead(
  staff?: Pick<EducationStaff, 'educationRole'> | null
): boolean {
  return staff?.educationRole === 'department_head';
}

export function getEducationStaffRoleLabel(
  staff?: Pick<EducationStaff, 'educationRole'> | null
): string {
  return isEducationDepartmentHead(staff) ? 'مدیر گروه آموزشی' : 'کارشناس آموزش';
}

export function doesEducationStaffCoverField(
  staff: EducationStaff,
  fieldOfStudy?: string
): boolean {
  const assigned = normalizeAssignedFieldsList(staff.assignedFields);
  if (assigned.length === 0) return true; // کارشناس عمومی (همه رشته‌ها)
  const target = normalizePersianSearch(fieldOfStudy || '');
  if (!target) return false;
  return assigned.some((f) => normalizePersianSearch(f) === target);
}

export function doEducationStaffShareField(a: EducationStaff, b: EducationStaff): boolean {
  const fieldsA = normalizeAssignedFieldsList(a.assignedFields);
  const fieldsB = normalizeAssignedFieldsList(b.assignedFields);
  if (fieldsA.length === 0 || fieldsB.length === 0) return true;
  const setA = new Set(fieldsA.map((f) => normalizePersianSearch(f)));
  return fieldsB.some((f) => setA.has(normalizePersianSearch(f)));
}

export function getRelatedEducationColleagues(
  staff: EducationStaff,
  allEducationStaff: EducationStaff[]
): EducationStaff[] {
  const activeOthers = allEducationStaff.filter(
    (e) => e.id !== staff.id && e.status !== 'inactive' && e.isActive !== false
  );
  const staffIsHead = isEducationDepartmentHead(staff);
  // برای مدیر گروه: اولویت با کارشناسان آموزش هم‌رشته؛ برای کارشناس آموزش: اولویت با مدیران گروه هم‌رشته
  const targetRoleList = activeOthers.filter((e) =>
    staffIsHead ? !isEducationDepartmentHead(e) : isEducationDepartmentHead(e)
  );
  const matched = targetRoleList.filter((e) => doEducationStaffShareField(staff, e));
  return matched.length > 0 ? matched : targetRoleList;
}

export function resolveEducationStaffForField(
  fieldOfStudy: string | undefined,
  allEducationStaff: EducationStaff[],
  roleFilter: 'all' | 'expert' | 'department_head' = 'all'
): EducationStaff[] {
  const roleScoped = allEducationStaff.filter((e) => {
    if (roleFilter === 'department_head') return isEducationDepartmentHead(e);
    if (roleFilter === 'expert') return !isEducationDepartmentHead(e);
    return true;
  });
  const activeStaff = roleScoped.filter(
    (e) => e.status !== 'inactive' && e.isActive !== false
  );
  const pool = activeStaff.length > 0 ? activeStaff : roleScoped;
  const target = normalizePersianSearch(fieldOfStudy || '');
  if (target) {
    const dedicated = pool.filter((e) => {
      const assigned = normalizeAssignedFieldsList(e.assignedFields);
      return assigned.length > 0 && assigned.some((f) => normalizePersianSearch(f) === target);
    });
    if (dedicated.length > 0) return dedicated;
  }
  const general = pool.filter((e) => normalizeAssignedFieldsList(e.assignedFields).length === 0);
  if (general.length > 0) return general;
  return pool;
}

export function doesEducationStaffMatchMessage(
  staff: EducationStaff,
  msg: Message,
  allEducationStaff: EducationStaff[],
  students: Student[]
): boolean {
  if (!staff || !msg) return false;
  // پیام‌هایی که خود همین کاربر آموزش (کارشناس یا مدیر گروه) ارسال کرده همیشه برای خودش قابل مشاهده است
  if (msg.senderId === staff.id) return true;

  // اگر پیام اختصاصاً به یک کارشناس آموزش یا مدیر گروه مشخص ارجاع شده باشد
  if (msg.targetEducationStaffId) {
    return msg.targetEducationStaffId === staff.id;
  }

  const isToEducation = msg.receiverType === 'education' || msg.category === 'education';
  const isFromEducation = msg.senderRole === 'education';
  const isBroadcastAll = msg.receiverType === 'all';
  if (!isToEducation && !isFromEducation && !isBroadcastAll) return false;

  const assigned = normalizeAssignedFieldsList(staff.assignedFields);

  // پیام‌های ارسال‌شده توسط دانشجو به واحد آموزش بر اساس رشته تحصیلی به کارشناس و مدیر گروه مربوطه ارجاع می‌شوند
  if (msg.senderRole === 'student' && (msg.receiverType === 'education' || msg.category === 'education')) {
    let studentField = (msg.senderFieldOfStudy || '').trim();
    if (!studentField) {
      const sid = normalizeAsciiDigits(msg.senderId);
      const found = students.find((s) => normalizeAsciiDigits(s.studentId) === sid);
      studentField = (found?.fieldOfStudy || '').trim();
    }
    if (studentField) {
      const matchedSpecialists = resolveEducationStaffForField(studentField, allEducationStaff, 'all');
      if (matchedSpecialists.length > 0) {
        return matchedSpecialists.some((s) => s.id === staff.id);
      }
      if (assigned.length > 0) {
        return doesEducationStaffCoverField(staff, studentField);
      }
    }
    // اگر رشته دانشجو ثبت نشده باشد، کارشناسان عمومی یا همه می‌بینند
    return assigned.length === 0 || allEducationStaff.every((e) => normalizeAssignedFieldsList(e.assignedFields).length > 0);
  }

  // پیام‌های ارسال‌شده توسط یک کاربر آموزش دیگر (کارشناس ↔ مدیر گروه یا ارسال به دانشجو/رشته)
  if (msg.senderRole === 'education' && msg.senderId !== staff.id) {
    if (msg.receiverType === 'education') {
      const senderStaff = allEducationStaff.find((e) => e.id === msg.senderId);
      if (senderStaff) {
        return doEducationStaffShareField(staff, senderStaff);
      }
      return true;
    }
    if (msg.targetScope === 'field' && msg.targetFieldOfStudy) {
      return doesEducationStaffCoverField(staff, msg.targetFieldOfStudy);
    }
    if (msg.receiverType === 'student' && msg.receiverId) {
      const sid = normalizeAsciiDigits(msg.receiverId);
      const found = students.find((s) => normalizeAsciiDigits(s.studentId) === sid);
      if (found?.fieldOfStudy) {
        const matched = resolveEducationStaffForField(found.fieldOfStudy, allEducationStaff, 'all');
        return matched.some((s) => s.id === staff.id);
      }
    }
    return false;
  }

  // سایر مکاتبات اداری (مدیر/سرپرست/سایر واحدها به واحد آموزش)
  return isToEducation || isBroadcastAll;
}

export function compressAvatarImageFile(
  file: File,
  maxDim = 400,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/') || file.type.toLowerCase().includes('svg')) {
      reject(new Error('فرمت فایل باید تصویر استاندارد (JPG / PNG / WebP) باشد.'));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      reject(new Error('حجم فایل تصویر بیش از حد مجاز است (حداکثر ۱۲ مگابایت).'));
      return;
    }
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
          const webpUrl = canvas.toDataURL('image/webp', quality);
          if (webpUrl && webpUrl.startsWith('data:image/webp')) {
            resolve(webpUrl);
          } else {
            resolve(canvas.toDataURL('image/jpeg', quality));
          }
        } catch {
          try {
            resolve(canvas.toDataURL('image/jpeg', quality));
          } catch {
            resolve(rawUrl);
          }
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
  const assignmentStatus = r.assignmentStatus || 'none';
  const hasDorm = Boolean(
    (r.assignedBedId && assignmentStatus !== 'none') ||
      r.assignedRoomId ||
      r.assignedDormId ||
      assignmentStatus === 'confirmed' ||
      assignmentStatus === 'temporary'
  );
  const resolvedResidenceType: Student['residenceType'] =
    r.residenceType === 'dormitory' || r.residenceType === 'commuter'
      ? r.residenceType
      : hasDorm
      ? 'dormitory'
      : undefined;
  const resolvedAdmissionStatus: Student['admissionStatus'] =
    r.admissionStatus === 'admitted' || r.admissionStatus === 'not_admitted'
      ? r.admissionStatus
      : hasDorm || Boolean(r.isProfileCompleted)
      ? 'admitted'
      : 'not_admitted';

  return {
    ...r,
    studentId: String(r.studentId ?? ''),
    nationalId: String(r.nationalId ?? ''),
    fullName: String(r.fullName ?? ''),
    fieldOfStudy: String(r.fieldOfStudy ?? ''),
    majorCode: r.majorCode ? normalizeMajorCode(String(r.majorCode)) : undefined,
    degreeLevel: r.degreeLevel ? String(r.degreeLevel).trim() : undefined,
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
    assignmentStatus,
    residenceType: resolvedResidenceType,
    admissionStatus: resolvedAdmissionStatus,
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
    const parsed = sanitizePlainValue(JSON.parse(item) as T);
    parsedCache.set(key, cloneValue(parsed));
    return parsed;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return defaultValue;
  }
}

// ذخیره صرفاً محلی لیست دانشجویان (برای ویرایش‌های تک‌ردیفی که از طریق mirrorSingleStudentToCloud همگام می‌شوند)
function saveStudentsLocalOnly(students: Student[]): boolean {
  try {
    const serialized = JSON.stringify(students);
    keyWriteTimestamps[STORAGE_KEYS.STUDENTS] = Date.now();
    return safeLocalStorageSet(STORAGE_KEYS.STUDENTS, serialized, students);
  } catch (e) {
    console.error('Error writing local students cache:', e);
    return false;
  }
}

// درج یا بروزرسانی یک ردیف دانشجو در حافظه محلی (در نشست دانشجو فقط همان دانشجو نگه داشته می‌شود)
function upsertLocalSingleStudent(student: Student, replaceWithSingleOnly = false): void {
  const normalized = normalizeStudentRecord(student as unknown as Record<string, unknown>);
  if (replaceWithSingleOnly) {
    saveStudentsLocalOnly([normalized]);
    return;
  }
  const currentList = getCurrentLocalCollection<Student[]>(STORAGE_KEYS.STUDENTS);
  if (!Array.isArray(currentList) || currentList.length === 0) {
    saveStudentsLocalOnly([normalized]);
    return;
  }
  const idx = currentList.findIndex(
    (s) => normalizeAsciiDigits(s.studentId) === normalizeAsciiDigits(normalized.studentId)
  );
  if (idx !== -1) {
    currentList[idx] = normalized;
  } else {
    currentList.unshift(normalized);
  }
  saveStudentsLocalOnly(currentList);
}

// تابع کمکی برای نوشتن در localStorage و ارسال غیرهمگام تجمیع‌شده به سرور ابری
function set<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value);
    if (
      lastAppliedSerializedByKey.get(key) === serialized &&
      parsedCache.has(key) &&
      !(key in pendingCloudValues) &&
      !(key in failedCloudRetryQueue) &&
      !persistedDirtyKeys.has(key)
    ) {
      return true;
    }
    if (PUBLIC_CACHEABLE_KEY_SET.has(key)) {
      invalidatePublicSessionCache(key);
    }
    const written = safeLocalStorageSet(key, serialized, value);
    pushKeyToCloud(key, value);
    return written;
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
    return false;
  }
}

export const Storage = {
  getSettings: (): AppSettings => {
    const raw = get(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    const normalizedMajors = Array.isArray(raw?.approvedMajors) ? raw.approvedMajors : [];
    const normalizedLevels =
      Array.isArray(raw?.academicDegreeLevels) && raw.academicDegreeLevels.length > 0
        ? raw.academicDegreeLevels
        : DEFAULT_ACADEMIC_DEGREE_LEVELS;
    const normalizedEightTermPlans =
      raw?.majorEightTermPlans && typeof raw.majorEightTermPlans === 'object'
        ? raw.majorEightTermPlans
        : {};
    const banner = (raw?.announcementBanner || '').trim();
    if (
      banner &&
      (banner.includes('سامانه جامع سراهای دانشجویی') ||
        banner.includes('ورود به سامانه جهت') ||
        banner.startsWith('سامانه جامع خدمات دانشجویی دانشگاه فرهنگیان — پیشخوان یکپارچه'))
    ) {
      return {
        ...raw,
        announcementBanner: INITIAL_SETTINGS.announcementBanner,
        academicDegreeLevels: normalizedLevels,
        approvedMajors: normalizedMajors,
        majorEightTermPlans: normalizedEightTermPlans,
      };
    }
    return {
      ...raw,
      academicDegreeLevels: normalizedLevels,
      approvedMajors: normalizedMajors,
      majorEightTermPlans: normalizedEightTermPlans,
    };
  },
  setSettings: (settings: AppSettings): boolean => set(STORAGE_KEYS.SETTINGS, settings),

  getAcademicDegreeLevels: (includeInactive = false): AcademicDegreeLevel[] => {
    const list = Storage.getSettings().academicDegreeLevels || DEFAULT_ACADEMIC_DEGREE_LEVELS;
    return includeInactive ? list : list.filter((d) => d.isActive !== false);
  },

  getApprovedMajors: (includeInactive = false): ApprovedAcademicMajor[] => {
    const list = Storage.getSettings().approvedMajors || [];
    const filtered = includeInactive ? list : list.filter((m) => m.isActive !== false);
    return [...filtered].sort((a, b) => {
      const degCmp = (a.degreeLevelName || '').localeCompare(b.degreeLevelName || '', 'fa');
      if (degCmp !== 0) return degCmp;
      return (a.name || '').localeCompare(b.name || '', 'fa');
    });
  },

  standardizeLegacyAcademicMajors: (params: {
    mappings: Array<{ legacyText: string; targetMajorId: string }>;
    syncEducationStaff?: boolean;
    syncScheduling?: boolean;
    syncRelatedRecords?: boolean;
    saveAliases?: boolean;
  }): {
    updatedStudentsCount: number;
    updatedStaffCount: number;
    updatedProgramsCount: number;
    updatedCoursesCount: number;
    updatedOfferingsCount: number;
    updatedRelatedCount: number;
  } => {
    const settings = Storage.getSettings();
    const majors = settings.approvedMajors || [];
    const majorById = new Map(majors.map((m) => [m.id, m]));
    const normMap = new Map<string, ApprovedAcademicMajor>();
    const rawAliasAdditions = new Map<string, Set<string>>();

    for (const item of params.mappings) {
      const target = majorById.get(item.targetMajorId);
      const rawLegacy = String(item.legacyText || '').trim();
      if (!target || !rawLegacy) continue;
      const normKey = normalizeMajorText(rawLegacy);
      if (normKey) normMap.set(normKey, target);
      if (params.saveAliases !== false && normalizeMajorText(target.name) !== normKey) {
        if (!rawAliasAdditions.has(target.id)) rawAliasAdditions.set(target.id, new Set());
        rawAliasAdditions.get(target.id)!.add(rawLegacy);
      }
    }

    const resolveTargetForText = (
      rawField?: string | null,
      rawCode?: string | null
    ): ApprovedAcademicMajor | undefined => {
      const key = normalizeMajorText(rawField);
      if (key && normMap.has(key)) return normMap.get(key);
      const cleanCode = normalizeMajorCode(rawCode);
      if (cleanCode) {
        const byCode = majors.find((m) => normalizeMajorCode(m.code) === cleanCode);
        if (byCode) return byCode;
      }
      if (key) {
        const byName = majors.find(
          (m) =>
            normalizeMajorText(m.name) === key ||
            (m.aliases || []).some((a) => normalizeMajorText(a) === key)
        );
        if (byName) return byName;
      }
      return undefined;
    };

    let updatedStudentsCount = 0;
    const students = Storage.getStudents();
    const nextStudents = students.map((st) => {
      const target = resolveTargetForText(st.fieldOfStudy, st.majorCode);
      if (!target) return st;
      const needsUpdate =
        st.fieldOfStudy !== target.name ||
        normalizeMajorCode(st.majorCode) !== normalizeMajorCode(target.code) ||
        (target.degreeLevelName && st.degreeLevel !== target.degreeLevelName);
      if (!needsUpdate) return st;
      updatedStudentsCount++;
      return {
        ...st,
        fieldOfStudy: target.name,
        majorCode: normalizeMajorCode(target.code),
        degreeLevel: target.degreeLevelName || st.degreeLevel,
      };
    });
    if (updatedStudentsCount > 0) {
      Storage.setStudents(nextStudents);
    }

    let updatedStaffCount = 0;
    if (params.syncEducationStaff !== false) {
      const eduList = Storage.getEducationStaff();
      const nextEduList = eduList.map((edu) => {
        if (!Array.isArray(edu.assignedFields) || edu.assignedFields.length === 0) return edu;
        let changed = false;
        const mappedFields = edu.assignedFields.map((fld) => {
          const target = resolveTargetForText(fld);
          if (target && target.name !== fld.trim()) {
            changed = true;
            return target.name;
          }
          return fld;
        });
        const deduped = normalizeAssignedFieldsList(mappedFields);
        if (changed || deduped.length !== edu.assignedFields.length) {
          updatedStaffCount++;
          return { ...edu, assignedFields: deduped };
        }
        return edu;
      });
      if (updatedStaffCount > 0) {
        Storage.setEducationStaff(nextEduList);
      }
    }

    let updatedProgramsCount = 0;
    let updatedCoursesCount = 0;
    let updatedOfferingsCount = 0;
    if (params.syncScheduling) {
      const programs = Storage.getSchedPrograms();
      const nextPrograms = programs.map((p) => {
        const target = resolveTargetForText(p.majorName, p.majorCode);
        if (!target) return p;
        const targetCode = normalizeMajorCode(target.code);
        if (p.majorName !== target.name || (targetCode && p.majorCode !== targetCode)) {
          updatedProgramsCount++;
          return {
            ...p,
            majorName: target.name,
            majorCode: targetCode || p.majorCode,
          };
        }
        return p;
      });
      if (updatedProgramsCount > 0) Storage.setSchedPrograms(nextPrograms);

      const courses = Storage.getSchedCourses();
      const nextCourses = courses.map((c) => {
        const target = resolveTargetForText(c.majorName, c.majorCode);
        if (!target) return c;
        const targetCode = normalizeMajorCode(target.code);
        if (c.majorName !== target.name || (targetCode && c.majorCode !== targetCode)) {
          updatedCoursesCount++;
          return {
            ...c,
            majorName: target.name,
            majorCode: targetCode || c.majorCode,
          };
        }
        return c;
      });
      if (updatedCoursesCount > 0) Storage.setSchedCourses(nextCourses);

      const offerings = Storage.getSchedOfferings();
      const nextOfferings = offerings.map((o) => {
        let changed = false;
        const target = resolveTargetForText(o.ownerMajorName, o.ownerMajorCode);
        let nextOwnerMajorName = o.ownerMajorName;
        let nextOwnerMajorCode = o.ownerMajorCode;
        if (target) {
          const targetCode = normalizeMajorCode(target.code);
          if (o.ownerMajorName !== target.name || (targetCode && o.ownerMajorCode !== targetCode)) {
            nextOwnerMajorName = target.name;
            nextOwnerMajorCode = targetCode || o.ownerMajorCode;
            changed = true;
          }
        }
        let nextShared = o.sharedWithTargets;
        if (Array.isArray(o.sharedWithTargets) && o.sharedWithTargets.length > 0) {
          nextShared = o.sharedWithTargets.map((sh) => {
            const shTarget = resolveTargetForText(sh.majorName, sh.majorCode);
            if (!shTarget) return sh;
            const shCode = normalizeMajorCode(shTarget.code);
            if (sh.majorName !== shTarget.name || (shCode && sh.majorCode !== shCode)) {
              changed = true;
              return { ...sh, majorName: shTarget.name, majorCode: shCode || sh.majorCode };
            }
            return sh;
          });
        }
        if (changed) {
          updatedOfferingsCount++;
          return {
            ...o,
            ownerMajorName: nextOwnerMajorName,
            ownerMajorCode: nextOwnerMajorCode,
            sharedWithTargets: nextShared,
          };
        }
        return o;
      });
      if (updatedOfferingsCount > 0) Storage.setSchedOfferings(nextOfferings);
    }

    let updatedRelatedCount = 0;
    if (params.syncRelatedRecords) {
      const notices = Storage.getAcademicNotices();
      let noticesChanged = false;
      const nextNotices = notices.map((n) => {
        const target = resolveTargetForText(n.studentFieldOfStudy);
        if (target && n.studentFieldOfStudy !== target.name) {
          noticesChanged = true;
          updatedRelatedCount++;
          return { ...n, studentFieldOfStudy: target.name };
        }
        return n;
      });
      if (noticesChanged) Storage.setAcademicNotices(nextNotices);

      const refs = Storage.getDisciplinaryReferrals();
      let refsChanged = false;
      const nextRefs = refs.map((r) => {
        const target = resolveTargetForText(r.studentFieldOfStudy);
        if (target && r.studentFieldOfStudy !== target.name) {
          refsChanged = true;
          updatedRelatedCount++;
          return { ...r, studentFieldOfStudy: target.name };
        }
        return r;
      });
      if (refsChanged) Storage.setDisciplinaryReferrals(nextRefs);

      const wfList = Storage.getAcademicWorkflowRequests();
      let wfChanged = false;
      const nextWf = wfList.map((w) => {
        const target = resolveTargetForText(w.studentFieldOfStudy);
        if (target && w.studentFieldOfStudy !== target.name) {
          wfChanged = true;
          updatedRelatedCount++;
          return { ...w, studentFieldOfStudy: target.name };
        }
        return w;
      });
      if (wfChanged) Storage.setAcademicWorkflowRequests(nextWf);

      const elections = Storage.getGuildElections();
      let elChanged = false;
      const nextElections = elections.map((el) => {
        let candChanged = false;
        const nextCands = el.candidates.map((c) => {
          const target = resolveTargetForText(c.fieldOfStudy);
          if (target && c.fieldOfStudy !== target.name) {
            candChanged = true;
            updatedRelatedCount++;
            return { ...c, fieldOfStudy: target.name };
          }
          return c;
        });
        if (candChanged) {
          elChanged = true;
          return { ...el, candidates: nextCands };
        }
        return el;
      });
      if (elChanged) Storage.setGuildElections(nextElections);

      const msgs = Storage.getMessages();
      let msgChanged = false;
      const nextMsgs = msgs.map((m) => {
        let mUpdated = false;
        let nextSenderField = m.senderFieldOfStudy;
        let nextTargetField = m.targetFieldOfStudy;
        if (m.senderFieldOfStudy) {
          const t1 = resolveTargetForText(m.senderFieldOfStudy);
          if (t1 && t1.name !== m.senderFieldOfStudy) {
            nextSenderField = t1.name;
            mUpdated = true;
          }
        }
        if (m.targetFieldOfStudy) {
          const t2 = resolveTargetForText(m.targetFieldOfStudy);
          if (t2 && t2.name !== m.targetFieldOfStudy) {
            nextTargetField = t2.name;
            mUpdated = true;
          }
        }
        if (mUpdated) {
          msgChanged = true;
          updatedRelatedCount++;
          return { ...m, senderFieldOfStudy: nextSenderField, targetFieldOfStudy: nextTargetField };
        }
        return m;
      });
      if (msgChanged) Storage.setMessages(nextMsgs);
    }

    if (params.saveAliases !== false && rawAliasAdditions.size > 0) {
      let aliasesUpdated = false;
      const nextMajors = majors.map((m) => {
        const additions = rawAliasAdditions.get(m.id);
        if (!additions || additions.size === 0) return m;
        const existingNorms = new Set(
          [m.name, ...(m.aliases || [])].map((x) => normalizeMajorText(x)).filter(Boolean)
        );
        const mergedAliases = [...(m.aliases || [])];
        additions.forEach((rawAlias) => {
          const k = normalizeMajorText(rawAlias);
          if (k && !existingNorms.has(k)) {
            existingNorms.add(k);
            mergedAliases.push(rawAlias);
            aliasesUpdated = true;
          }
        });
        return { ...m, aliases: mergedAliases };
      });
      if (aliasesUpdated) {
        Storage.setSettings({
          ...settings,
          approvedMajors: nextMajors,
        });
      }
    }

    Storage.addActivityLog({
      category: 'settings',
      action: 'استانداردسازی و یکسان‌سازی رشته‌های تحصیلی',
      details: `${updatedStudentsCount} دانشجو، ${updatedStaffCount} کاربر آموزش، ${updatedProgramsCount + updatedCoursesCount + updatedOfferingsCount} رکورد برنامه درسی و ${updatedRelatedCount} رکورد مرتبط به رشته‌های مصوب استاندارد تبدیل شدند.`,
      targetName: 'رشته‌های تحصیلی مصوب',
    });

    return {
      updatedStudentsCount,
      updatedStaffCount,
      updatedProgramsCount,
      updatedCoursesCount,
      updatedOfferingsCount,
      updatedRelatedCount,
    };
  },
  
  getDormitories: (): Dormitory[] => get(STORAGE_KEYS.DORMITORIES, INITIAL_DORMITORIES),
  setDormitories: (dorms: Dormitory[]) => set(STORAGE_KEYS.DORMITORIES, dorms),

  getRooms: (): Room[] => get(STORAGE_KEYS.ROOMS, []),
  setRooms: (rooms: Room[]) => set(STORAGE_KEYS.ROOMS, rooms),

  getBeds: (): Bed[] => get(STORAGE_KEYS.BEDS, []),
  setBeds: (beds: Bed[]) => set(STORAGE_KEYS.BEDS, beds),

  getStudents: (): Student[] => get(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS),
  setStudents: (students: Student[]) => {
    const saved = set(STORAGE_KEYS.STUDENTS, students);
    const activeIds = new Set(
      students.map((s) => normalizeAsciiDigits(s.studentId || '').trim()).filter(Boolean)
    );
    const beds = Storage.getBeds();
    let bedsChanged = false;
    const nextBeds = beds.map((b) => {
      if (b.studentId && !activeIds.has(normalizeAsciiDigits(b.studentId).trim())) {
        bedsChanged = true;
        return { ...b, studentId: null, assignmentStatus: undefined };
      }
      return b;
    });
    if (bedsChanged) {
      Storage.setBeds(nextBeds);
    }
    return saved;
  },

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

  toggleAnnouncementNotifications: (id: string) => {
    const announcements = Storage.getAnnouncements();
    const ann = announcements.find((a) => a.id === id);
    if (ann) {
      ann.publishInNotifications = !ann.publishInNotifications;
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
      facilities: ['یخچال', 'شوفاژ', 'کمد دیواری', 'چوب لباسی'],
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

  updateRoomAssets: (
    roomId: string,
    nextAssets: RoomAssetItem[],
    actorName = 'سرپرست / مدیر سرا',
    actorRole: 'admin' | 'supervisor' = 'supervisor',
    options?: {
      notifyOccupants?: boolean;
      actorId?: string;
      changeSummary?: string;
    }
  ): { success: boolean; message: string; assets?: RoomAssetItem[] } => {
    const rooms = Storage.getRooms();
    const idx = rooms.findIndex((r) => r.id === roomId);
    if (idx === -1) {
      return { success: false, message: 'اتاق مورد نظر یافت نشد.' };
    }

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const validStatuses: RoomAssetStatus[] = ['healthy', 'damaged', 'missing', 'unavailable'];
    const cleanedAssets: RoomAssetItem[] = nextAssets
      .map((item, i) => {
        const cleanName = String(item.name || '').trim();
        if (!cleanName) return null;
        const status: RoomAssetStatus = validStatuses.includes(item.status) ? item.status : 'healthy';
        const qty =
          typeof item.quantity === 'number' && !Number.isNaN(item.quantity) && item.quantity >= 1
            ? Math.round(item.quantity)
            : 1;
        return {
          id: item.id || `asset_${roomId}_${Date.now()}_${i}`,
          name: cleanName,
          quantity: qty,
          status,
          note: item.note?.trim() || undefined,
          updatedBy: item.updatedBy || actorName,
          updatedAt: item.updatedAt || nowStr,
        } as RoomAssetItem;
      })
      .filter((x): x is RoomAssetItem => Boolean(x));

    const room = rooms[idx];
    const syncedFacilities = cleanedAssets
      .filter((a) => a.status === 'healthy' || a.status === 'damaged')
      .map((a) => a.name);

    rooms[idx] = {
      ...room,
      assets: cleanedAssets,
      facilities: syncedFacilities,
    };
    Storage.setRooms(rooms);

    const dorm = Storage.getDormitories().find((d) => d.id === room.dormId);
    const damagedCount = cleanedAssets.filter((a) => a.status === 'damaged').length;
    const missingCount = cleanedAssets.filter((a) => a.status === 'missing').length;
    const unavailableCount = cleanedAssets.filter((a) => a.status === 'unavailable').length;

    const issueParts = [
      damagedCount > 0 ? `${damagedCount} مورد خراب/شکسته` : '',
      missingCount > 0 ? `${missingCount} مورد مفقود` : '',
      unavailableCount > 0 ? `${unavailableCount} مورد غیرفعال/ندارد` : '',
    ].filter(Boolean);

    Storage.addActivityLog({
      category: 'dorm_structure',
      action: `بروزرسانی لیست اموال و تجهیزات اتاق ${room.roomNumber}`,
      details:
        options?.changeSummary ||
        `فهرست اموال اتاق ${room.roomNumber} (${dorm?.name || ''}) توسط ${actorName} بروزرسانی شد (${cleanedAssets.length} قلم${
          issueParts.length > 0 ? `؛ وضعیت خاص: ${issueParts.join('، ')}` : ''
        }).`,
      targetName: `اتاق ${room.roomNumber}`,
      severity: damagedCount > 0 || missingCount > 0 ? 'warning' : 'info',
      actorName,
      actorRole,
    });

    if (options?.notifyOccupants) {
      const problemAssets = cleanedAssets.filter((a) => a.status === 'damaged' || a.status === 'missing');
      if (problemAssets.length > 0) {
        const nowFa = new Date().toLocaleDateString('fa-IR');
        const problemLines = problemAssets
          .map((a) => {
            const stLabel = a.status === 'damaged' ? 'خراب / شکسته' : 'مفقودشده';
            return `• ${a.name} (${stLabel})${a.note ? ` — توضیح: ${a.note}` : ''}`;
          })
          .join('\n');

        const occupants = Storage.getBeds()
          .filter((b) => b.roomId === room.id && b.studentId)
          .map((b) => Storage.getStudents().find((s) => s.studentId === b.studentId))
          .filter((s): s is Student => Boolean(s));

        occupants.forEach((st) => {
          Storage.addMessage({
            senderId: options?.actorId || actorRole,
            senderName: actorName,
            senderRole: actorRole,
            receiverType: 'student',
            receiverId: st.studentId,
            subject: `گزارش وضعیت اموال و تجهیزات اتاق ${room.roomNumber}`,
            content: `در بررسی و بازدید سرپرستی، وضعیت زیر در اموال اتاق ${room.roomNumber} (${dorm?.name || 'سرا'}) ثبت گردید:\n${problemLines}\nلطفاً جهت پیگیری یا ارائه توضیحات به دفتر سرپرستی مراجعه نمایید.`,
            category: 'discipline',
            date: nowFa,
          });
        });

        Storage.addRoomWarning({
          dormId: room.dormId,
          roomId: room.id,
          title: `گزارش خرابی/مفقودی اموال اتاق ${room.roomNumber}`,
          description: problemLines,
          severity: 'warning',
          date: nowFa,
          supervisorName: actorName,
          resolved: false,
        });
      }
    }

    return {
      success: true,
      message: `لیست اموال اتاق ${room.roomNumber} با موفقیت ذخیره شد.`,
      assets: cleanedAssets,
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

  getCurrentUser: (): CurrentUser => validateStoredCurrentUser(get(STORAGE_KEYS.CURRENT_USER, null)),
  setCurrentUser: (user: CurrentUser) =>
    set(STORAGE_KEYS.CURRENT_USER, sanitizeCurrentUserForStorage(user)),

  // نگهداری نشست مدیر کل هنگام ورود مستقیم به کارتابل سایر کاربران (در sessionStorage تب جاری)
  getAdminImpersonator: (): { role: 'admin'; name: string; username: string } | null => {
    try {
      if (typeof sessionStorage === 'undefined') return null;
      const raw = sessionStorage.getItem('farhangian_admin_impersonator_v1');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.role === 'admin' && typeof parsed.username === 'string') {
        return {
          role: 'admin',
          name: typeof parsed.name === 'string' ? parsed.name : 'مدیر کل سامانه جامع خدمات دانشگاهی',
          username: parsed.username,
        };
      }
      return null;
    } catch {
      return null;
    }
  },
  setAdminImpersonator: (admin: { role: 'admin'; name: string; username: string } | null): void => {
    try {
      if (typeof sessionStorage === 'undefined') return;
      if (!admin) {
        sessionStorage.removeItem('farhangian_admin_impersonator_v1');
      } else {
        sessionStorage.setItem('farhangian_admin_impersonator_v1', JSON.stringify(admin));
      }
    } catch {
      // ignore sessionStorage quota/privacy errors
    }
  },
  clearAdminImpersonator: (): void => {
    try {
      if (typeof sessionStorage === 'undefined') return;
      sessionStorage.removeItem('farhangian_admin_impersonator_v1');
    } catch {
      // ignore
    }
  },

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
    student.residenceType = 'dormitory';
    student.admissionStatus = 'admitted';

    Storage.setBeds(beds);
    saveStudentsLocalOnly(students);
    void mirrorSingleStudentToCloud(student);

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
    student.admissionStatus = 'admitted';
    const bed = beds.find((b) => b.id === student.assignedBedId);
    if (bed) {
      bed.assignmentStatus = 'confirmed';
    }

    const room = rooms.find((r) => r.id === student.assignedRoomId);

    saveStudentsLocalOnly(students);
    Storage.setBeds(beds);
    void mirrorSingleStudentToCloud(student);
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

    saveStudentsLocalOnly(students);
    Storage.setBeds(beds);
    Storage.setMessages(messages);
    void mirrorSingleStudentToCloud(student);
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
    const normTargetId = normalizeAsciiDigits(studentId || '').trim();
    const student = students.find(
      (s) => s.studentId === studentId || normalizeAsciiDigits(s.studentId || '').trim() === normTargetId
    );
    const targetBedId = student?.assignedBedId;

    beds.forEach((b) => {
      const normBedStudentId = b.studentId ? normalizeAsciiDigits(b.studentId).trim() : '';
      if (
        (normBedStudentId && normBedStudentId === normTargetId) ||
        (targetBedId && b.id === targetBedId)
      ) {
        b.studentId = null;
        b.assignmentStatus = undefined;
      }
    });

    if (student) {
      student.assignedDormId = undefined;
      student.assignedDormName = undefined;
      student.assignedRoomId = undefined;
      student.assignedRoomNumber = undefined;
      student.assignedBedId = undefined;
      student.assignmentStatus = 'none';
    }

    Storage.setBeds(beds);
    saveStudentsLocalOnly(students);
    if (student) {
      void mirrorSingleStudentToCloud(student);
    }

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
    role: 'supervisor' | 'maintenance' | 'warehouse' | 'counselor' | 'finance' | 'procurement' | 'education' | 'cultural' | 'student_affairs' | 'security' | 'vice_dean' | 'library' | 'smart_campus' | 'graduation' | 'academic_deputy',
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
    } else if (role === 'vice_dean') {
      const list = Storage.getViceDeanStaff();
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
        saved = Storage.setViceDeanStaff(list);
        const cu = Storage.getCurrentUser();
        if (saved && cu && cu.role === 'vice_dean') {
          const ref = list.find((vd) => vd.id === cu.staff.id);
          if (ref) Storage.setCurrentUser({ role: 'vice_dean', staff: ref });
        }
      }
    } else if (role === 'library') {
      const list = Storage.getLibraryStaff();
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
        saved = Storage.setLibraryStaff(list);
        const cu = Storage.getCurrentUser();
        if (saved && cu && cu.role === 'library') {
          const ref = list.find((lb) => lb.id === cu.staff.id);
          if (ref) Storage.setCurrentUser({ role: 'library', staff: ref });
        }
      }
    } else if (role === 'smart_campus') {
      const list = Storage.getSmartCampusStaff();
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
        saved = Storage.setSmartCampusStaff(list);
        const cu = Storage.getCurrentUser();
        if (saved && cu && cu.role === 'smart_campus') {
          const ref = list.find((sc) => sc.id === cu.staff.id);
          if (ref) Storage.setCurrentUser({ role: 'smart_campus', staff: ref });
        }
      }
    } else if (role === 'graduation') {
      const list = Storage.getGraduationStaff();
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
        saved = Storage.setGraduationStaff(list);
        const cu = Storage.getCurrentUser();
        if (saved && cu && cu.role === 'graduation') {
          const ref = list.find((gr) => gr.id === cu.staff.id);
          if (ref) Storage.setCurrentUser({ role: 'graduation', staff: ref });
        }
      }
    } else if (role === 'academic_deputy') {
      const list = Storage.getAcademicDeputyStaff();
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
        saved = Storage.setAcademicDeputyStaff(list);
        const cu = Storage.getCurrentUser();
        if (saved && cu && cu.role === 'academic_deputy') {
          const ref = list.find((ad) => ad.id === cu.staff.id);
          if (ref) Storage.setCurrentUser({ role: 'academic_deputy', staff: ref });
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
        vice_dean: 'کاربران معاونت دانشجویی',
        library: 'کاربران کتابخانه و پژوهش',
        smart_campus: 'کاربران واحد هوشمندسازی',
        graduation: 'کاربران واحد فارغ‌التحصیلان',
        academic_deputy: 'کاربران معاونت آموزشی',
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
      senderRole: 'student' | 'supervisor' | 'admin' | 'maintenance' | 'warehouse' | 'counselor' | 'finance' | 'procurement' | 'education' | 'cultural' | 'student_affairs' | 'security' | 'vice_dean' | 'library' | 'smart_campus' | 'graduation' | 'academic_deputy' | 'professor';
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
    saveStudentsLocalOnly(students);
    void mirrorSingleStudentToCloud(newStudent);
    return { success: true, message: 'دانشجو با موفقیت ثبت و به سامانه اضافه گردید.' };
  },

  // حذف دانشجو توسط مدیر (آزادسازی خودکار تخت و حذف فوری از Supabase)
  deleteStudent: (studentId: string): { success: boolean; message: string } => {
    const normTargetId = normalizeAsciiDigits(studentId || '').trim();
    const allStudents = Storage.getStudents();
    const target = allStudents.find(
      (s) => s.studentId === studentId || normalizeAsciiDigits(s.studentId || '').trim() === normTargetId
    );
    const canonicalId = target?.studentId || studentId;
    const targetBedId = target?.assignedBedId;

    // ۱. آزادسازی قطعی تخت(های) منتسب به دانشجو (چه با شماره دانشجویی و چه با شناسه تخت)
    const beds = Storage.getBeds();
    let bedsChanged = false;
    const nextBeds = beds.map((b) => {
      const normBedSt = b.studentId ? normalizeAsciiDigits(b.studentId).trim() : '';
      if ((normBedSt && normBedSt === normTargetId) || (targetBedId && b.id === targetBedId)) {
        bedsChanged = true;
        return { ...b, studentId: null, assignmentStatus: undefined };
      }
      return b;
    });
    if (bedsChanged) {
      Storage.setBeds(nextBeds);
    }

    // ۲. پاک‌سازی نمایندگی اتاق در صورت انتساب به دانشجوی حذف‌شده
    const rooms = Storage.getRooms();
    let roomsChanged = false;
    const nextRooms = rooms.map((r) => {
      if (
        r.representativeStudentId &&
        normalizeAsciiDigits(r.representativeStudentId).trim() === normTargetId
      ) {
        roomsChanged = true;
        return { ...r, representativeStudentId: undefined };
      }
      return r;
    });
    if (roomsChanged) {
      Storage.setRooms(nextRooms);
    }

    // ۳. حذف از لیست دانشجویان و همگام‌سازی حذف ابری بدون تداخل upsert
    const students = allStudents.filter(
      (s) => s.studentId !== canonicalId && normalizeAsciiDigits(s.studentId || '').trim() !== normTargetId
    );
    saveStudentsLocalOnly(students);
    void deleteStudentFromSupabase(canonicalId);

    const currentUser = Storage.getCurrentUser();
    if (
      currentUser &&
      currentUser.role === 'student' &&
      normalizeAsciiDigits(currentUser.student.studentId || '').trim() === normTargetId
    ) {
      Storage.setCurrentUser(null);
    }

    Storage.addActivityLog({
      category: 'student',
      action: 'حذف پرونده دانشجو و آزادسازی تخت',
      details: `پرونده دانشجو ${target?.fullName || ''} (${canonicalId}) حذف و تخت مربوطه در صورت اسکان آزاد شد.`,
      targetName: `${target?.fullName || canonicalId}`,
      severity: 'warning',
    });
    return { success: true, message: 'دانشجو حذف و تخت وی با موفقیت خالی و آزاد شد.' };
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
    saveStudentsLocalOnly(students);
    void mirrorSingleStudentToCloud(updatedStudent);
    if (isStudentIdChanged) {
      void deleteStudentFromSupabase(studentId);
    }

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

    students[index] = {
      ...students[index],
      ...updatedData,
      isProfileCompleted: true,
      admissionStatus: 'admitted',
    };
    saveStudentsLocalOnly(students);
    void mirrorSingleStudentToCloud(students[index]);
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

  // جمع‌آوری کامل کلیه ۴۵ مجموعه داده‌ای سامانه جهت پشتیبان‌گیری استاندارد و کامل
  _collectAllBackupDataSnapshot: () => ({
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
    viceDeanStaff: Storage.getViceDeanStaff(),
    libraryStaff: Storage.getLibraryStaff(),
    smartCampusStaff: Storage.getSmartCampusStaff(),
    graduationStaff: Storage.getGraduationStaff(),
    academicDeputyStaff: Storage.getAcademicDeputyStaff(),
    schedClassrooms: Storage.getSchedClassrooms(),
    schedPrograms: Storage.getSchedPrograms(),
    schedProfessors: Storage.getSchedProfessors(),
    schedCourses: Storage.getSchedCourses(),
    schedOfferings: Storage.getSchedOfferings(),
    schedCellComments: Storage.getSchedCellComments(),
    schedRules: Storage.getSchedRules(),
    schedProfessorProposals: Storage.getSchedProfessorProposals(),
    libraryBooks: Storage.getLibraryBooks(),
    libraryBookRequests: Storage.getLibraryBookRequests(),
    graduationClearances: Storage.getGraduationClearances(),
    academicWorkflowRequests: Storage.getAcademicWorkflowRequests(),
    academicChatRooms: Storage.getAcademicChatRooms(),
    academicChatMessages: Storage.getAcademicChatMessages(),
    dormAttendanceStates: Storage.getDormAttendanceStates(),
    dormAttendanceLogs: Storage.getDormAttendanceLogs(),
    exportedAt: new Date().toISOString(),
    appName: 'سامانه جامع خدمات دانشگاهی دانشگاه فرهنگیان اصفهان',
  }),

  // پشتیبان‌گیری سریع از داده‌ها به صورت فایل JSON
  exportBackupJson: () => {
    const fullBackup = Storage._collectAllBackupDataSnapshot();
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `پشتیبان_سامانه_جامع_خدمات_دانشگاهی_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2500);
  },

  // پشتیبان‌گیری کامل و مستقل (شامل تمامی داده‌ها، فایل‌های ضمیمه، فونت‌ها، تصاویر اطلاعیه‌ها/تنظیمات و تمام عکس‌های ابری کاربران)
  exportFullSnapshotBackupJson: async (
    onProgress?: (message: string) => void
  ): Promise<{
    success: boolean;
    totalStudents: number;
    totalStaff: number;
    embeddedPhotosCount: number;
    embeddedFilesCount: number;
    fontsCount: number;
    attachmentsCount: number;
    sizeKb: number;
    errorMessage?: string;
  }> => {
    type PhotoRole =
      | 'student'
      | 'supervisor'
      | 'maintenance'
      | 'warehouse'
      | 'counselor'
      | 'finance'
      | 'procurement'
      | 'education'
      | 'cultural'
      | 'student_affairs'
      | 'security'
      | 'vice_dean'
      | 'library'
      | 'smart_campus'
      | 'graduation'
      | 'academic_deputy'
      | 'professor';

    interface ArchivedPhotoRecord {
      role: PhotoRole;
      userId: string;
      originalUrl?: string;
      dataUrl: string;
    }

    const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
    const resolveAssetUrl = (raw: string): string => {
      const trimmed = String(raw || '').trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
        return trimmed;
      }
      if (trimmed.startsWith('/api/')) return `${apiOrigin}${trimmed}`;
      if (trimmed.startsWith('api/')) return `${apiOrigin}/${trimmed}`;
      if (trimmed.startsWith('/') && typeof window !== 'undefined' && window.location?.origin) {
        return `${window.location.origin}${trimmed}`;
      }
      return trimmed;
    };

    const isFetchableUrl = (raw?: string): boolean => {
      if (!raw || typeof raw !== 'string') return false;
      const t = raw.trim();
      if (!t || t.startsWith('data:')) return false;
      return (
        t.startsWith('http://') ||
        t.startsWith('https://') ||
        t.startsWith('/api/') ||
        t.startsWith('api/') ||
        t.startsWith('blob:') ||
        t.startsWith('/')
      );
    };

    const fetchUrlAsDataUrl = async (rawUrl: string): Promise<string | null> => {
      const resolved = resolveAssetUrl(rawUrl);
      if (!resolved) return null;
      const controller = typeof AbortController === 'function' ? new AbortController() : undefined;
      const timer = controller ? setTimeout(() => controller.abort(), 10000) : undefined;
      try {
        const res = await fetch(resolved, {
          method: 'GET',
          signal: controller?.signal,
        });
        if (!res.ok) return null;
        const blob = await res.blob();
        if (!blob || blob.size === 0) return null;
        return await new Promise<string | null>((resolve) => {
          const reader = new FileReader();
          reader.onerror = () => resolve(null);
          reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : null;
            resolve(result);
          };
          reader.readAsDataURL(blob);
        });
      } catch {
        return null;
      } finally {
        if (timer !== undefined) clearTimeout(timer);
      }
    };

    const runWithConcurrency = async <T,>(
      items: T[],
      limit: number,
      worker: (item: T, index: number) => Promise<void>
    ): Promise<void> => {
      if (items.length === 0) return;
      let cursor = 0;
      const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (cursor < items.length) {
          const idx = cursor++;
          await worker(items[idx], idx);
        }
      });
      await Promise.all(workers);
    };

    try {
      onProgress?.('در حال گردآوری اطلاعات پایگاه داده و تنظیمات سامانه...');
      const baseData = Storage._collectAllBackupDataSnapshot();

      const photoMap = new Map<string, ArchivedPhotoRecord>();
      const allowedRolesSet = new Set<PhotoRole>([
        'student',
        'supervisor',
        'maintenance',
        'warehouse',
        'counselor',
        'finance',
        'procurement',
        'education',
        'cultural',
        'student_affairs',
        'security',
        'vice_dean',
        'library',
        'smart_campus',
        'graduation',
        'academic_deputy',
        'professor',
      ]);

      // گام ۱: جمع‌آوری عکس‌های کاربران (لینک‌های عمومی Supabase Storage و تصاویر درون‌خطی) برای همه ۱۲ نقش کاربری
      const missingPhotoFetchQueue: Array<{ role: PhotoRole; userId: string; rawUrl: string }> = [];
      const registerUserPhotos = (
        role: PhotoRole,
        records: Array<{ id?: string; studentId?: string; photoUrl?: string }>
      ) => {
        for (const rec of records) {
          const userId = String(role === 'student' ? rec.studentId || '' : rec.id || '').trim();
          const photoUrl = String(rec.photoUrl || '').trim();
          if (!userId || !photoUrl) continue;
          const key = `${role}:${userId}`;
          const existing = photoMap.get(key);
          if (existing) {
            if (!existing.originalUrl) existing.originalUrl = photoUrl;
            continue;
          }
          if (photoUrl.startsWith('data:image/')) {
            photoMap.set(key, { role, userId, originalUrl: photoUrl, dataUrl: photoUrl });
          } else if (isFetchableUrl(photoUrl)) {
            missingPhotoFetchQueue.push({ role, userId, rawUrl: photoUrl });
          }
        }
      };

      registerUserPhotos('student', baseData.students);
      registerUserPhotos('supervisor', baseData.supervisors);
      registerUserPhotos('maintenance', baseData.maintenanceStaff);
      registerUserPhotos('warehouse', baseData.warehouseStaff);
      registerUserPhotos('counselor', baseData.counselors);
      registerUserPhotos('finance', baseData.financeStaff);
      registerUserPhotos('procurement', baseData.procurementStaff);
      registerUserPhotos('education', baseData.educationStaff);
      registerUserPhotos('cultural', baseData.culturalStaff);
      registerUserPhotos('student_affairs', baseData.studentAffairsStaff);
      registerUserPhotos('security', baseData.securityStaff);
      registerUserPhotos('vice_dean', baseData.viceDeanStaff);
      registerUserPhotos('library', baseData.libraryStaff);
      registerUserPhotos('smart_campus', baseData.smartCampusStaff);
      registerUserPhotos('graduation', baseData.graduationStaff);
      registerUserPhotos('academic_deputy', baseData.academicDeputyStaff);
      registerUserPhotos('professor', baseData.schedProfessors);

      if (missingPhotoFetchQueue.length > 0) {
        onProgress?.(`در حال دریافت و ضمیمه‌کردن ${missingPhotoFetchQueue.length.toLocaleString('fa-IR')} تصویر از Supabase Storage...`);
        await runWithConcurrency(missingPhotoFetchQueue, AVATAR_UPLOAD_CONCURRENCY, async (task) => {
          const dataUrl = await fetchUrlAsDataUrl(task.rawUrl);
          if (dataUrl && dataUrl.startsWith('data:image/')) {
            photoMap.set(`${task.role}:${task.userId}`, {
              role: task.role,
              userId: task.userId,
              originalUrl: task.rawUrl,
              dataUrl,
            });
          }
        });
      }

      // گام ۳: جمع‌آوری تمامی فایل‌های خارجی داخل تنظیمات، فونت‌ها، پیوست‌های درباره ما و اطلاعیه‌ها
      const urlSet = new Set<string>();
      const collectUrl = (candidate?: string) => {
        if (candidate && isFetchableUrl(candidate)) {
          urlSet.add(candidate.trim());
        }
      };
      const collectHtmlUrls = (html?: string) => {
        if (!html || typeof html !== 'string') return;
        const regex = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(html)) !== null) {
          if (match[1] && isFetchableUrl(match[1]) && /\.(png|jpe?g|webp|gif|svg|pdf|woff2?|ttf|otf)(\?|$)/i.test(match[1]) || (match[1] && match[1].includes('/api/photo/'))) {
            collectUrl(match[1]);
          }
        }
      };

      const st = baseData.settings;
      collectUrl(st.customLogoUrl);
      collectUrl(st.customWallpaperUrl);
      collectUrl(st.heroBgImageUrl);
      if (st.wallpaper && isFetchableUrl(st.wallpaper)) collectUrl(st.wallpaper);
      if (Array.isArray(st.customFonts)) {
        st.customFonts.forEach((f) => collectUrl(f?.dataUrl));
      }
      if (Array.isArray(st.homeNotes)) {
        st.homeNotes.forEach((n) => collectHtmlUrls(n?.bodyHtml));
      }
      if (st.aboutContent) {
        collectHtmlUrls(st.aboutContent.designerBioHtml);
        collectHtmlUrls(st.aboutContent.boardingSectionHtml);
        collectHtmlUrls(st.aboutContent.extraSectionHtml);
        if (Array.isArray(st.aboutContent.attachments)) {
          st.aboutContent.attachments.forEach((att) => collectUrl(att?.dataUrl));
        }
      }
      if (Array.isArray(baseData.announcements)) {
        baseData.announcements.forEach((ann) => {
          collectUrl(ann?.imageUrl);
          collectHtmlUrls(ann?.contentHtml);
        });
      }

      const embeddedFiles: Record<string, string> = {};
      const externalAssets = Array.from(urlSet);
      if (externalAssets.length > 0) {
        onProgress?.(`در حال دریافت و ضمیمه‌سازی ${externalAssets.length} فایل و تصویر رسانه‌ای...`);
        await runWithConcurrency(externalAssets, 5, async (origUrl) => {
          const dataUrl = await fetchUrlAsDataUrl(origUrl);
          if (dataUrl) {
            embeddedFiles[origUrl] = dataUrl;
          }
        });
      }

      const totalStaff =
        baseData.supervisors.length +
        baseData.maintenanceStaff.length +
        baseData.warehouseStaff.length +
        baseData.counselors.length +
        baseData.financeStaff.length +
        baseData.procurementStaff.length +
        baseData.educationStaff.length +
        baseData.culturalStaff.length +
        baseData.studentAffairsStaff.length +
        baseData.securityStaff.length +
        baseData.viceDeanStaff.length +
        baseData.libraryStaff.length +
        baseData.smartCampusStaff.length +
        baseData.graduationStaff.length;

      const fontsCount = Array.isArray(st.customFonts) ? st.customFonts.length : 0;
      const attachmentsCount = Array.isArray(st.aboutContent?.attachments)
        ? st.aboutContent.attachments.length
        : 0;
      const cloudPhotos = Array.from(photoMap.values());

      const fullArchive = {
        ...baseData,
        backupFormat: 'full_archive_v2' as const,
        version: '2.0',
        cloudPhotos,
        embeddedFiles,
        archiveSummary: {
          totalStudents: baseData.students.length,
          totalStaff,
          embeddedPhotosCount: cloudPhotos.length,
          embeddedFilesCount: Object.keys(embeddedFiles).length,
          fontsCount,
          attachmentsCount,
        },
      };

      onProgress?.('در حال بسته‌بندی نهایی و آماده‌سازی دانلود فایل پشتیبان کامل...');
      const serialized = JSON.stringify(fullArchive);
      const blob = new Blob([serialized], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `پشتیبان_کامل_سامانه_خوابگاه_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 3000);

      Storage.addActivityLog({
        category: 'backup',
        action: 'تهیه نسخه پشتیبان کامل سامانه (تمام داده‌ها، عکس‌ها و فایل‌ها)',
        details: `${baseData.students.length} دانشجو، ${cloudPhotos.length} تصویر پروفایل، ${fontsCount} فونت و ${attachmentsCount} فایل ضمیمه بسته‌بندی شد.`,
        severity: 'info',
      });

      return {
        success: true,
        totalStudents: baseData.students.length,
        totalStaff,
        embeddedPhotosCount: cloudPhotos.length,
        embeddedFilesCount: Object.keys(embeddedFiles).length,
        fontsCount,
        attachmentsCount,
        sizeKb: Math.max(1, Math.round(serialized.length / 1024)),
      };
    } catch (err) {
      console.error('exportFullSnapshotBackupJson failed:', err);
      return {
        success: false,
        totalStudents: 0,
        totalStaff: 0,
        embeddedPhotosCount: 0,
        embeddedFilesCount: 0,
        fontsCount: 0,
        attachmentsCount: 0,
        sizeKb: 0,
        errorMessage: 'خطا در تهیه نسخه پشتیبان کامل سامانه. لطفاً دوباره تلاش نمایید.',
      };
    }
  },

  // اعمال کلیه مجموعه‌های پشتیبان در حافظه محلی بدون ارسال تایمرهای تکراری (برای استفاده هم‌زمان در sync/async)
  _applyParsedBackupCollections: (
    data: Record<string, unknown>,
    options: { queueCloudSync: boolean }
  ): void => {
    const writeCollection = (key: string, value: unknown) => {
      if (options.queueCloudSync) {
        set(key, value);
      } else {
        keyWriteTimestamps[key] = Date.now();
        safeLocalStorageSet(key, JSON.stringify(value), value);
      }
    };

    if (data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)) {
      writeCollection(STORAGE_KEYS.SETTINGS, data.settings as AppSettings);
    }
    if (Array.isArray(data.dormitories)) writeCollection(STORAGE_KEYS.DORMITORIES, data.dormitories);
    if (Array.isArray(data.rooms)) writeCollection(STORAGE_KEYS.ROOMS, data.rooms);
    if (Array.isArray(data.beds)) writeCollection(STORAGE_KEYS.BEDS, data.beds);
    if (Array.isArray(data.students)) {
      writeCollection(
        STORAGE_KEYS.STUDENTS,
        data.students
          .filter((s: unknown): s is Record<string, unknown> => Boolean(s && typeof s === 'object'))
          .map((s: Record<string, unknown>) => normalizeStudentRecord(s))
      );
    }
    if (Array.isArray(data.supervisors)) writeCollection(STORAGE_KEYS.SUPERVISORS, data.supervisors);
    if (Array.isArray(data.warnings)) writeCollection(STORAGE_KEYS.WARNINGS, data.warnings);
    if (Array.isArray(data.announcements)) writeCollection(STORAGE_KEYS.ANNOUNCEMENTS, data.announcements);
    if (Array.isArray(data.messages)) writeCollection(STORAGE_KEYS.MESSAGES, data.messages);
    if (Array.isArray(data.maintenanceStaff)) writeCollection(STORAGE_KEYS.MAINTENANCE_STAFF, data.maintenanceStaff);
    if (Array.isArray(data.maintenanceTasks)) writeCollection(STORAGE_KEYS.MAINTENANCE_TASKS, data.maintenanceTasks);
    if (Array.isArray(data.warehouseStaff)) writeCollection(STORAGE_KEYS.WAREHOUSE_STAFF, data.warehouseStaff);
    if (Array.isArray(data.inventoryItems)) writeCollection(STORAGE_KEYS.INVENTORY_ITEMS, data.inventoryItems);
    if (Array.isArray(data.inventoryTransactions)) writeCollection(STORAGE_KEYS.INVENTORY_TRANSACTIONS, data.inventoryTransactions);
    if (Array.isArray(data.warehouseRequests)) writeCollection(STORAGE_KEYS.WAREHOUSE_REQUESTS, data.warehouseRequests);
    if (Array.isArray(data.procurementStaff)) writeCollection(STORAGE_KEYS.PROCUREMENT_STAFF, data.procurementStaff);
    if (Array.isArray(data.procurementRequests)) writeCollection(STORAGE_KEYS.PROCUREMENT_REQUESTS, data.procurementRequests);
    if (Array.isArray(data.shiftSchedules)) writeCollection(STORAGE_KEYS.SHIFT_SCHEDULES, data.shiftSchedules);
    if (Array.isArray(data.shiftReports)) writeCollection(STORAGE_KEYS.SHIFT_REPORTS, data.shiftReports);
    if (Array.isArray(data.counselors)) writeCollection(STORAGE_KEYS.COUNSELORS, data.counselors);
    if (Array.isArray(data.counselorShifts)) writeCollection(STORAGE_KEYS.COUNSELOR_SHIFTS, data.counselorShifts);
    if (Array.isArray(data.counselorReports)) writeCollection(STORAGE_KEYS.COUNSELOR_REPORTS, data.counselorReports);
    if (Array.isArray(data.activityLogs)) writeCollection(STORAGE_KEYS.ACTIVITY_LOGS, data.activityLogs);
    if (Array.isArray(data.studentEvaluations)) writeCollection(STORAGE_KEYS.STUDENT_EVALUATIONS, data.studentEvaluations);
    if (Array.isArray(data.financeStaff)) writeCollection(STORAGE_KEYS.FINANCE_STAFF, data.financeStaff);
    if (Array.isArray(data.studentFinances)) writeCollection(STORAGE_KEYS.STUDENT_FINANCES, data.studentFinances);
    if (Array.isArray(data.educationStaff)) writeCollection(STORAGE_KEYS.EDUCATION_STAFF, data.educationStaff);
    if (Array.isArray(data.academicNotices)) writeCollection(STORAGE_KEYS.ACADEMIC_NOTICES, data.academicNotices);
    if (Array.isArray(data.guestRequests)) writeCollection(STORAGE_KEYS.GUEST_REQUESTS, data.guestRequests);
    if (Array.isArray(data.visitReports)) writeCollection(STORAGE_KEYS.VISIT_REPORTS, data.visitReports);
    if (Array.isArray(data.surveys)) writeCollection(STORAGE_KEYS.SURVEYS, data.surveys);
    if (Array.isArray(data.surveyResponses)) writeCollection(STORAGE_KEYS.SURVEY_RESPONSES, data.surveyResponses);
    if (Array.isArray(data.culturalStaff)) writeCollection(STORAGE_KEYS.CULTURAL_STAFF, data.culturalStaff);
    if (Array.isArray(data.culturalPrograms)) writeCollection(STORAGE_KEYS.CULTURAL_PROGRAMS, data.culturalPrograms);
    if (Array.isArray(data.culturalAssociations)) writeCollection(STORAGE_KEYS.CULTURAL_ASSOCIATIONS, data.culturalAssociations);
    if (Array.isArray(data.associationMemberships)) writeCollection(STORAGE_KEYS.ASSOCIATION_MEMBERSHIPS, data.associationMemberships);
    if (Array.isArray(data.studentAffairsStaff)) writeCollection(STORAGE_KEYS.STUDENT_AFFAIRS_STAFF, data.studentAffairsStaff);
    if (Array.isArray(data.guildElections)) writeCollection(STORAGE_KEYS.GUILD_ELECTIONS, data.guildElections);
    if (Array.isArray(data.guildElectionVotes)) writeCollection(STORAGE_KEYS.GUILD_ELECTION_VOTES, data.guildElectionVotes);
    if (Array.isArray(data.disciplinaryReferrals)) writeCollection(STORAGE_KEYS.DISCIPLINARY_REFERRALS, data.disciplinaryReferrals);
    if (Array.isArray(data.sportsPrograms)) writeCollection(STORAGE_KEYS.SPORTS_PROGRAMS, data.sportsPrograms);
    if (Array.isArray(data.sportsRegistrations)) writeCollection(STORAGE_KEYS.SPORTS_REGISTRATIONS, data.sportsRegistrations);
    if (Array.isArray(data.securityStaff)) writeCollection(STORAGE_KEYS.SECURITY_STAFF, data.securityStaff);
    if (Array.isArray(data.securityReports)) writeCollection(STORAGE_KEYS.SECURITY_REPORTS, data.securityReports);
    if (Array.isArray(data.viceDeanStaff)) writeCollection(STORAGE_KEYS.VICE_DEAN_STAFF, data.viceDeanStaff);
    if (Array.isArray(data.libraryStaff)) writeCollection(STORAGE_KEYS.LIBRARY_STAFF, data.libraryStaff);
    if (Array.isArray(data.smartCampusStaff)) writeCollection(STORAGE_KEYS.SMART_CAMPUS_STAFF, data.smartCampusStaff);
    if (Array.isArray(data.graduationStaff)) writeCollection(STORAGE_KEYS.GRADUATION_STAFF, data.graduationStaff);
    if (Array.isArray(data.academicDeputyStaff)) writeCollection(STORAGE_KEYS.ACADEMIC_DEPUTY_STAFF, data.academicDeputyStaff);
    if (Array.isArray(data.schedClassrooms)) writeCollection(STORAGE_KEYS.SCHED_CLASSROOMS, data.schedClassrooms);
    if (Array.isArray(data.schedPrograms)) writeCollection(STORAGE_KEYS.SCHED_PROGRAMS, data.schedPrograms);
    if (Array.isArray(data.schedProfessors)) writeCollection(STORAGE_KEYS.SCHED_PROFESSORS, data.schedProfessors);
    if (Array.isArray(data.schedCourses)) writeCollection(STORAGE_KEYS.SCHED_COURSES, data.schedCourses);
    if (Array.isArray(data.schedOfferings)) writeCollection(STORAGE_KEYS.SCHED_OFFERINGS, data.schedOfferings);
    if (Array.isArray(data.schedCellComments)) writeCollection(STORAGE_KEYS.SCHED_CELL_COMMENTS, data.schedCellComments);
    if (data.schedRules && typeof data.schedRules === 'object' && !Array.isArray(data.schedRules)) {
      writeCollection(STORAGE_KEYS.SCHED_RULES, data.schedRules);
    }
    if (Array.isArray(data.schedProfessorProposals)) {
      writeCollection(STORAGE_KEYS.SCHED_PROFESSOR_PROPOSALS, data.schedProfessorProposals);
    }
    if (Array.isArray(data.libraryBooks)) writeCollection(STORAGE_KEYS.LIBRARY_BOOKS, data.libraryBooks);
    if (Array.isArray(data.libraryBookRequests)) writeCollection(STORAGE_KEYS.LIBRARY_BOOK_REQUESTS, data.libraryBookRequests);
    if (Array.isArray(data.graduationClearances)) writeCollection(STORAGE_KEYS.GRADUATION_CLEARANCES, data.graduationClearances);
    if (Array.isArray(data.academicWorkflowRequests)) writeCollection(STORAGE_KEYS.ACADEMIC_WORKFLOW_REQUESTS, data.academicWorkflowRequests);
    if (Array.isArray(data.academicChatRooms)) writeCollection(STORAGE_KEYS.ACADEMIC_CHAT_ROOMS, data.academicChatRooms);
    if (Array.isArray(data.academicChatMessages)) writeCollection(STORAGE_KEYS.ACADEMIC_CHAT_MESSAGES, data.academicChatMessages);
    if (Array.isArray(data.dormAttendanceStates)) writeCollection(STORAGE_KEYS.DORM_ATTENDANCE_STATES, data.dormAttendanceStates);
    if (Array.isArray(data.dormAttendanceLogs)) writeCollection(STORAGE_KEYS.DORM_ATTENDANCE_LOGS, data.dormAttendanceLogs);
  },

  // بازیابی نسخه پشتیبان همگام (سازگاری با فراخوانی‌های قدیمی)
  importBackupJson: (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString, (key, value) =>
        key === '__proto__' || key === 'constructor' || key === 'prototype' ? undefined : value
      );
      const data = sanitizePlainValue(parsed) as Record<string, unknown>;
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

      Storage._applyParsedBackupCollections(data, { queueCloudSync: true });
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

  // بازیابی کامل و خودکفا از فایل پشتیبان (پشتیبانی از بازیابی کامل حتی پس از ریست یا پاک‌شدن کامل سرور و دیتابیس)
  importFullBackupJsonAsync: async (
    jsonString: string,
    onProgress?: (message: string) => void
  ): Promise<{
    ok: boolean;
    isFullArchive: boolean;
    cloudSynced: boolean;
    studentsSynced: boolean;
    restoredPhotosCount: number;
    uploadedPhotosToCloudCount: number;
    restoredFilesCount: number;
    failedSyncKeys?: string[];
    oversizedKeys?: string[];
    errorMessage?: string;
  }> => {
    type PhotoRole =
      | 'student'
      | 'supervisor'
      | 'maintenance'
      | 'warehouse'
      | 'counselor'
      | 'finance'
      | 'procurement'
      | 'education'
      | 'cultural'
      | 'student_affairs'
      | 'security'
      | 'vice_dean'
      | 'library'
      | 'smart_campus'
      | 'graduation'
      | 'academic_deputy'
      | 'professor';

    try {
      onProgress?.('در حال خواندن و اعتبارسنجی ساختار فایل پشتیبان...');
      const rawParsed = JSON.parse(jsonString, (key, value) =>
        key === '__proto__' || key === 'constructor' || key === 'prototype' ? undefined : value
      );
      const data = sanitizePlainValue(rawParsed) as Record<string, unknown>;

      if (
        !data ||
        typeof data !== 'object' ||
        Array.isArray(data) ||
        !Array.isArray(data.students) ||
        !Array.isArray(data.rooms) ||
        !Array.isArray(data.beds)
      ) {
        return {
          ok: false,
          isFullArchive: false,
          cloudSynced: false,
          studentsSynced: false,
          restoredPhotosCount: 0,
          uploadedPhotosToCloudCount: 0,
          restoredFilesCount: 0,
          errorMessage: 'ساختار فایل پشتیبان انتخاب‌شده معتبر نیست یا فاقد داده‌های پایه است.',
        };
      }

      // لغو تایمرهای معلق قبلی تا داده‌های قدیمی روی بازیابی جدید بازنویسی نشوند
      if (coalescedFlushTimer !== undefined) {
        clearTimeout(coalescedFlushTimer);
        coalescedFlushTimer = undefined;
      }
      for (const k of Object.keys(pendingCloudValues)) delete pendingCloudValues[k];
      for (const k of Object.keys(failedCloudRetryQueue)) delete failedCloudRetryQueue[k];
      lastSyncRevision = null;
      lastSyncEtag = null;
      lastStudentsEtag = null;

      const isFullArchive =
        data.backupFormat === 'full_archive_v2' ||
        Array.isArray(data.cloudPhotos) ||
        Boolean(data.embeddedFiles && typeof data.embeddedFiles === 'object');

      // گام ۱: بازیابی فایل‌های رسانه‌ای، فونت‌ها، تصاویر اطلاعیه‌ها و لوگو/پس‌زمینه
      const embeddedFilesMap: Record<string, string> = {};
      if (data.embeddedFiles && typeof data.embeddedFiles === 'object' && !Array.isArray(data.embeddedFiles)) {
        for (const [origUrl, dUrl] of Object.entries(data.embeddedFiles as Record<string, unknown>)) {
          if (typeof dUrl === 'string' && dUrl.startsWith('data:')) {
            embeddedFilesMap[origUrl] = dUrl;
          }
        }
      }

      let restoredFilesCount = Object.keys(embeddedFilesMap).length;
      const resolveEmbeddedUrl = (val?: unknown): string | undefined => {
        if (typeof val !== 'string') return undefined;
        return embeddedFilesMap[val] || val;
      };
      const replaceHtmlUrls = (html?: unknown): string | undefined => {
        if (typeof html !== 'string') return undefined;
        let out = html;
        for (const [origUrl, dUrl] of Object.entries(embeddedFilesMap)) {
          if (out.includes(origUrl)) {
            out = out.split(origUrl).join(dUrl);
          }
        }
        return out;
      };

      if (data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)) {
        const st = { ...(data.settings as Record<string, unknown>) };
        if (typeof st.customLogoUrl === 'string') st.customLogoUrl = resolveEmbeddedUrl(st.customLogoUrl);
        if (typeof st.customWallpaperUrl === 'string') {
          st.customWallpaperUrl = resolveEmbeddedUrl(st.customWallpaperUrl);
        }
        if (typeof st.heroBgImageUrl === 'string') st.heroBgImageUrl = resolveEmbeddedUrl(st.heroBgImageUrl);
        if (typeof st.wallpaper === 'string') st.wallpaper = resolveEmbeddedUrl(st.wallpaper);
        if (Array.isArray(st.customFonts)) {
          const mappedFonts = st.customFonts.map((f) => {
            if (!f || typeof f !== 'object') return f;
            const fontObj = f as Record<string, unknown>;
            return { ...fontObj, dataUrl: resolveEmbeddedUrl(fontObj.dataUrl) ?? fontObj.dataUrl };
          });
          st.customFonts = mappedFonts;
          restoredFilesCount += mappedFonts.length;
        }
        if (Array.isArray(st.homeNotes)) {
          st.homeNotes = st.homeNotes.map((n) => {
            if (!n || typeof n !== 'object') return n;
            const noteObj = n as Record<string, unknown>;
            return typeof noteObj.bodyHtml === 'string'
              ? { ...noteObj, bodyHtml: replaceHtmlUrls(noteObj.bodyHtml) }
              : noteObj;
          });
        }
        if (st.aboutContent && typeof st.aboutContent === 'object' && !Array.isArray(st.aboutContent)) {
          const ac = { ...(st.aboutContent as Record<string, unknown>) };
          if (typeof ac.designerBioHtml === 'string') ac.designerBioHtml = replaceHtmlUrls(ac.designerBioHtml);
          if (typeof ac.boardingSectionHtml === 'string') {
            ac.boardingSectionHtml = replaceHtmlUrls(ac.boardingSectionHtml);
          }
          if (typeof ac.extraSectionHtml === 'string') ac.extraSectionHtml = replaceHtmlUrls(ac.extraSectionHtml);
          if (Array.isArray(ac.attachments)) {
            const mappedAttachments = ac.attachments.map((att) => {
              if (!att || typeof att !== 'object') return att;
              const attObj = att as Record<string, unknown>;
              return { ...attObj, dataUrl: resolveEmbeddedUrl(attObj.dataUrl) ?? attObj.dataUrl };
            });
            ac.attachments = mappedAttachments;
            restoredFilesCount += mappedAttachments.length;
          }
          st.aboutContent = ac;
        }
        data.settings = st;
      }

      if (Array.isArray(data.announcements)) {
        data.announcements = data.announcements.map((ann) => {
          if (!ann || typeof ann !== 'object') return ann;
          const aObj = { ...(ann as Record<string, unknown>) };
          if (typeof aObj.imageUrl === 'string') aObj.imageUrl = resolveEmbeddedUrl(aObj.imageUrl);
          if (typeof aObj.contentHtml === 'string') aObj.contentHtml = replaceHtmlUrls(aObj.contentHtml);
          return aObj;
        });
      }

      // گام ۲: جمع‌آوری، بارگذاری مجدد به سرور ابری و بازنشانی لینک عکس‌های تمامی ۱۲ نقش کاربری
      const photoByKey = new Map<string, { role: PhotoRole; userId: string; dataUrl: string }>();
      const allowedRolesSet = new Set<PhotoRole>([
        'student',
        'supervisor',
        'maintenance',
        'warehouse',
        'counselor',
        'finance',
        'procurement',
        'education',
        'cultural',
        'student_affairs',
        'security',
        'vice_dean',
        'library',
        'smart_campus',
        'graduation',
        'academic_deputy',
        'professor',
      ]);

      if (Array.isArray(data.cloudPhotos)) {
        for (const item of data.cloudPhotos) {
          if (!item || typeof item !== 'object') continue;
          const obj = item as { role?: unknown; userId?: unknown; dataUrl?: unknown };
          const role = String(obj.role || '').trim() as PhotoRole;
          const userId = String(obj.userId || '').trim();
          const dataUrl = String(obj.dataUrl || '').trim();
          if (allowedRolesSet.has(role) && userId && dataUrl.startsWith('data:image/')) {
            photoByKey.set(`${role}:${userId}`, { role, userId, dataUrl });
          }
        }
      }

      const roleArrayPairs: Array<{ role: PhotoRole; prop: string }> = [
        { role: 'student', prop: 'students' },
        { role: 'supervisor', prop: 'supervisors' },
        { role: 'maintenance', prop: 'maintenanceStaff' },
        { role: 'warehouse', prop: 'warehouseStaff' },
        { role: 'counselor', prop: 'counselors' },
        { role: 'finance', prop: 'financeStaff' },
        { role: 'procurement', prop: 'procurementStaff' },
        { role: 'education', prop: 'educationStaff' },
        { role: 'cultural', prop: 'culturalStaff' },
        { role: 'student_affairs', prop: 'studentAffairsStaff' },
        { role: 'security', prop: 'securityStaff' },
        { role: 'vice_dean', prop: 'viceDeanStaff' },
        { role: 'library', prop: 'libraryStaff' },
        { role: 'smart_campus', prop: 'smartCampusStaff' },
        { role: 'graduation', prop: 'graduationStaff' },
        { role: 'academic_deputy', prop: 'academicDeputyStaff' },
        { role: 'professor', prop: 'schedProfessors' },
      ];

      for (const { role, prop } of roleArrayPairs) {
        const list = data[prop];
        if (!Array.isArray(list)) continue;
        for (const rawRec of list) {
          if (!rawRec || typeof rawRec !== 'object') continue;
          const rec = rawRec as Record<string, unknown>;
          const userId = String(role === 'student' ? rec.studentId || '' : rec.id || '').trim();
          const photoUrl = String(rec.photoUrl || '').trim();
          if (!userId) continue;
          if (!photoByKey.has(`${role}:${userId}`) && photoUrl.startsWith('data:image/')) {
            photoByKey.set(`${role}:${userId}`, { role, userId, dataUrl: photoUrl });
          }
        }
      }

      const restoredPhotosCount = photoByKey.size;
      let uploadedPhotosToCloudCount = 0;
      const resolvedUrlByKey = new Map<string, string>();
      const roleToStorageKey: Record<PhotoRole, string> = {
        student: STORAGE_KEYS.STUDENTS,
        supervisor: STORAGE_KEYS.SUPERVISORS,
        maintenance: STORAGE_KEYS.MAINTENANCE_STAFF,
        warehouse: STORAGE_KEYS.WAREHOUSE_STAFF,
        counselor: STORAGE_KEYS.COUNSELORS,
        finance: STORAGE_KEYS.FINANCE_STAFF,
        procurement: STORAGE_KEYS.PROCUREMENT_STAFF,
        education: STORAGE_KEYS.EDUCATION_STAFF,
        cultural: STORAGE_KEYS.CULTURAL_STAFF,
        student_affairs: STORAGE_KEYS.STUDENT_AFFAIRS_STAFF,
        security: STORAGE_KEYS.SECURITY_STAFF,
        vice_dean: STORAGE_KEYS.VICE_DEAN_STAFF,
        library: STORAGE_KEYS.LIBRARY_STAFF,
        smart_campus: STORAGE_KEYS.SMART_CAMPUS_STAFF,
        graduation: STORAGE_KEYS.GRADUATION_STAFF,
        academic_deputy: STORAGE_KEYS.ACADEMIC_DEPUTY_STAFF,
        professor: STORAGE_KEYS.SCHED_PROFESSORS,
      };

      const useBackgroundPhotoQueue = restoredPhotosCount > 45;

      if (restoredPhotosCount > 0 && !useBackgroundPhotoQueue) {
        const allPhotoItems = Array.from(photoByKey.values());
        let doneSoFar = 0;
        onProgress?.(
          `در حال فشرده‌سازی WebP و بارگذاری ${restoredPhotosCount.toLocaleString('fa-IR')} تصویر در Supabase Storage (دسته‌های ۱۵تایی)...`
        );
        await runConcurrentQueue(allPhotoItems, AVATAR_UPLOAD_CONCURRENCY, async (item) => {
          const up = await uploadBase64ToSupabaseAvatar(item.role, item.userId, item.dataUrl);
          doneSoFar += 1;
          const key = `${item.role}:${item.userId}`;
          if (up.ok && up.publicUrl) {
            resolvedUrlByKey.set(key, up.publicUrl);
            uploadedPhotosToCloudCount += 1;
          } else {
            resolvedUrlByKey.set(key, item.dataUrl);
          }
          if (doneSoFar % 15 === 0 || doneSoFar === allPhotoItems.length) {
            onProgress?.(
              `آپلود تصاویر در Supabase Storage: ${doneSoFar.toLocaleString('fa-IR')} از ${allPhotoItems.length.toLocaleString('fa-IR')}...`
            );
          }
        });
      }

      if (restoredPhotosCount > 0) {
        for (const { role, prop } of roleArrayPairs) {
          const list = data[prop];
          if (!Array.isArray(list)) continue;
          data[prop] = list.map((rawRec) => {
            if (!rawRec || typeof rawRec !== 'object') return rawRec;
            const rec = { ...(rawRec as Record<string, unknown>) };
            const userId = String(role === 'student' ? rec.studentId || '' : rec.id || '').trim();
            if (!userId) return rec;
            const resolved = resolvedUrlByKey.get(`${role}:${userId}`);
            if (resolved) {
              rec.photoUrl = resolved;
            } else if (useBackgroundPhotoQueue && photoByKey.has(`${role}:${userId}`)) {
              // تصویر تا اتمام صف پس‌زمینه ۱۵تایی به‌صورت موقت در مرورگر نمایش داده می‌شود و هرگز داخل دیتابیس ذخیره نمی‌شود
              rec.photoUrl = photoByKey.get(`${role}:${userId}`)!.dataUrl;
            } else if (typeof rec.photoUrl === 'string' && embeddedFilesMap[rec.photoUrl]) {
              rec.photoUrl = embeddedFilesMap[rec.photoUrl];
            }
            return rec;
          });
        }
      }

      // گام ۳: ثبت تمامی ۴۵ مجموعه داده در حافظه مرورگر بدون فعال‌سازی تایمرهای موازی
      onProgress?.('در حال ثبت کامل جداول و اطلاعات سامانه در حافظه داخلی...');
      Storage._applyParsedBackupCollections(data, { queueCloudSync: false });
      Storage.addActivityLog({
        category: 'backup',
        action: isFullArchive
          ? 'بازیابی نسخه پشتیبان کامل سامانه (داده، فایل و عکس)'
          : 'بازیابی نسخه پشتیبان JSON',
        details: `${data.students.length} دانشجو، ${restoredPhotosCount} تصویر پروفایل و ${restoredFilesCount} فایل ضمیمه بازیابی شد.`,
        severity: 'warning',
      });

      // گام ۴: همگام‌سازی کامل با Supabase (app_storage + جدول students در دسته‌های ۲۰۰تایی بدون Base64)
      onProgress?.('در حال بازسازی و همگام‌سازی کامل پایگاه داده Supabase...');
      const detailedSync = await Storage.syncAllToCloudDetailed(onProgress);
      const cloudSynced = detailedSync.ok;
      const studentsSynced = detailedSync.studentsMirrorOk;

      // اگر تعداد عکس‌ها زیاد باشد (>۴۵)، صف پس‌زمینه ۱۵تایی به‌صورت غیرمسدودکننده شروع به آپلود به Supabase Storage می‌کند
      if (useBackgroundPhotoQueue && restoredPhotosCount > 0) {
        const bgTasks: BackgroundAvatarTask[] = Array.from(photoByKey.values()).map((it) => ({
          role: it.role,
          userId: it.userId,
          dataUrl: it.dataUrl,
          storageKey: roleToStorageKey[it.role],
        }));
        enqueueBackgroundAvatarTasks(bgTasks);
        uploadedPhotosToCloudCount = restoredPhotosCount;
      }

      await Storage.waitForPendingCloudSync();

      return {
        ok: true,
        isFullArchive,
        cloudSynced,
        studentsSynced,
        restoredPhotosCount,
        uploadedPhotosToCloudCount,
        restoredFilesCount,
        failedSyncKeys: detailedSync.failedKeys,
        oversizedKeys: detailedSync.oversizedKeys,
      };
    } catch (e) {
      console.error('importFullBackupJsonAsync failed:', e);
      return {
        ok: false,
        isFullArchive: false,
        cloudSynced: false,
        studentsSynced: false,
        restoredPhotosCount: 0,
        uploadedPhotosToCloudCount: 0,
        restoredFilesCount: 0,
        errorMessage: 'خطا در خواندن یا پردازش فایل پشتیبان انتخاب‌شده.',
      };
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
    if (coalescedFlushTimer !== undefined) {
      clearTimeout(coalescedFlushTimer);
      coalescedFlushTimer = undefined;
    }
    Object.keys(pendingCloudValues).forEach((k) => {
      delete pendingCloudValues[k];
    });
    Object.keys(failedCloudRetryQueue).forEach((k) => {
      delete failedCloudRetryQueue[k];
    });
    lastSyncRevision = null;
    lastSyncEtag = null;
    lastStudentsEtag = null;
    Object.keys(memoryKeyUpdatedAt).forEach((k) => {
      delete memoryKeyUpdatedAt[k];
    });
    lastAppliedSerializedByKey.clear();
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
    role: 'student' | 'supervisor' | 'admin' | 'maintenance' | 'warehouse' | 'counselor' | 'finance' | 'procurement' | 'education' | 'cultural' | 'student_affairs' | 'security' | 'vice_dean' | 'library' | 'smart_campus' | 'graduation' | 'academic_deputy' | 'professor',
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

    if (role === 'vice_dean') {
      const staffList = Storage.getViceDeanStaff();
      const staff = staffList.find((s) => s.id === userId || s.username === userId);
      if (!staff) {
        return { success: false, message: 'کاربر معاونت دانشجویی یافت نشد.' };
      }
      if (normalizeDigits(staff.password) !== cleanCurrentPass) {
        return { success: false, message: 'کلمه عبور فعلی معاونت دانشجویی اشتباه است.' };
      }
      staff.password = cleanNewPass;
      Storage.setViceDeanStaff(staffList);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر کلمه عبور معاونت دانشجویی',
        details: `کلمه عبور معاونت دانشجویی ${staff.fullName} تغییر یافت.`,
        targetName: staff.fullName,
      });
      return { success: true, message: 'کلمه عبور معاونت دانشجویی با موفقیت تغییر یافت.' };
    }

    if (role === 'library') {
      const staffList = Storage.getLibraryStaff();
      const staff = staffList.find((s) => s.id === userId || s.username === userId);
      if (!staff) return { success: false, message: 'کاربر کتابخانه یافت نشد.' };
      if (normalizeDigits(staff.password) !== cleanCurrentPass) {
        return { success: false, message: 'کلمه عبور فعلی کتابخانه اشتباه است.' };
      }
      staff.password = cleanNewPass;
      Storage.setLibraryStaff(staffList);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر کلمه عبور کتابخانه و پژوهش',
        details: `کلمه عبور مسئول کتابخانه ${staff.fullName} تغییر یافت.`,
        targetName: staff.fullName,
      });
      return { success: true, message: 'کلمه عبور کتابخانه با موفقیت تغییر یافت.' };
    }

    if (role === 'smart_campus') {
      const staffList = Storage.getSmartCampusStaff();
      const staff = staffList.find((s) => s.id === userId || s.username === userId);
      if (!staff) return { success: false, message: 'کاربر واحد هوشمندسازی یافت نشد.' };
      if (normalizeDigits(staff.password) !== cleanCurrentPass) {
        return { success: false, message: 'کلمه عبور فعلی واحد هوشمندسازی اشتباه است.' };
      }
      staff.password = cleanNewPass;
      Storage.setSmartCampusStaff(staffList);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر کلمه عبور واحد هوشمندسازی',
        details: `کلمه عبور کاربر هوشمندسازی ${staff.fullName} تغییر یافت.`,
        targetName: staff.fullName,
      });
      return { success: true, message: 'کلمه عبور واحد هوشمندسازی با موفقیت تغییر یافت.' };
    }

    if (role === 'graduation') {
      const staffList = Storage.getGraduationStaff();
      const staff = staffList.find((s) => s.id === userId || s.username === userId);
      if (!staff) return { success: false, message: 'کاربر واحد فارغ‌التحصیلان یافت نشد.' };
      if (normalizeDigits(staff.password) !== cleanCurrentPass) {
        return { success: false, message: 'کلمه عبور فعلی واحد فارغ‌التحصیلان اشتباه است.' };
      }
      staff.password = cleanNewPass;
      Storage.setGraduationStaff(staffList);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر کلمه عبور واحد فارغ‌التحصیلان',
        details: `کلمه عبور کارشناس فارغ‌التحصیلان ${staff.fullName} تغییر یافت.`,
        targetName: staff.fullName,
      });
      return { success: true, message: 'کلمه عبور واحد فارغ‌التحصیلان با موفقیت تغییر یافت.' };
    }

    if (role === 'academic_deputy') {
      const staffList = Storage.getAcademicDeputyStaff();
      const staff = staffList.find((s) => s.id === userId || s.username === userId);
      if (!staff) return { success: false, message: 'کاربر معاونت آموزشی یافت نشد.' };
      if (normalizeDigits(staff.password) !== cleanCurrentPass) {
        return { success: false, message: 'کلمه عبور فعلی معاونت آموزشی اشتباه است.' };
      }
      staff.password = cleanNewPass;
      Storage.setAcademicDeputyStaff(staffList);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر کلمه عبور معاونت آموزشی',
        details: `کلمه عبور معاونت آموزشی ${staff.fullName} تغییر یافت.`,
        targetName: staff.fullName,
      });
      return { success: true, message: 'کلمه عبور معاونت آموزشی با موفقیت تغییر یافت.' };
    }

    if (role === 'professor') {
      const profList = Storage.getSchedProfessors();
      const prof = profList.find((p) => p.id === userId || normalizeDigits(p.professorCode) === normalizeDigits(userId));
      if (!prof) return { success: false, message: 'استاد یافت نشد.' };
      const effectivePass = normalizeDigits(prof.password || prof.nationalId);
      if (effectivePass !== cleanCurrentPass) {
        return { success: false, message: 'کلمه عبور فعلی استاد اشتباه است.' };
      }
      prof.password = cleanNewPass;
      Storage.setSchedProfessors(profList);
      const cu = Storage.getCurrentUser();
      if (cu && cu.role === 'professor' && cu.professor.id === prof.id) {
        Storage.setCurrentUser({ role: 'professor', professor: prof });
      }
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر کلمه عبور استاد',
        details: `کلمه عبور استاد ${prof.fullName} (${prof.professorCode}) تغییر یافت.`,
        targetName: prof.fullName,
      });
      return { success: true, message: 'کلمه عبور استاد با موفقیت تغییر یافت.' };
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
      saveStudentsLocalOnly(students);
      void mirrorSingleStudentToCloud(updatedStudent);
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
    saveStudentsLocalOnly(students);
    void mirrorSingleStudentToCloud(updatedStudent);

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
    role: 'student' | 'supervisor' | 'maintenance' | 'warehouse' | 'counselor' | 'finance' | 'procurement' | 'education' | 'academic_deputy' | 'professor' | 'cultural' | 'student_affairs' | 'security' | 'vice_dean' | 'library' | 'smart_campus' | 'graduation',
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
      saveStudentsLocalOnly(students);
      void mirrorSingleStudentToCloud(updatedStudent);
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

    if (role === 'vice_dean') {
      const list = Storage.getViceDeanStaff();
      const idx = list.findIndex((s) => s.id === idOrStudentId);
      if (idx === -1) return { success: false, message: 'کاربر معاونت دانشجویی یافت نشد.' };
      list[idx] = { ...list[idx], password: cleanPass };
      Storage.setViceDeanStaff(list);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر / ریست رمز معاونت دانشجویی توسط مدیر',
        details: `کلمه عبور معاونت دانشجویی ${list[idx].fullName} (${list[idx].username}) توسط مدیر تغییر یافت.`,
        targetName: list[idx].fullName,
        severity: 'warning',
      });
      return {
        success: true,
        message: `رمز عبور معاونت دانشجویی «${list[idx].fullName}» به «${cleanPass}» تغییر یافت.`,
      };
    }

    if (role === 'library') {
      const list = Storage.getLibraryStaff();
      const idx = list.findIndex((s) => s.id === idOrStudentId);
      if (idx === -1) return { success: false, message: 'کاربر کتابخانه یافت نشد.' };
      list[idx] = { ...list[idx], password: cleanPass };
      Storage.setLibraryStaff(list);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر / ریست رمز کتابخانه توسط مدیر',
        details: `کلمه عبور مسئول کتابخانه ${list[idx].fullName} (${list[idx].username}) توسط مدیر تغییر یافت.`,
        targetName: list[idx].fullName,
        severity: 'warning',
      });
      return {
        success: true,
        message: `رمز عبور کتابخانه «${list[idx].fullName}» به «${cleanPass}» تغییر یافت.`,
      };
    }

    if (role === 'smart_campus') {
      const list = Storage.getSmartCampusStaff();
      const idx = list.findIndex((s) => s.id === idOrStudentId);
      if (idx === -1) return { success: false, message: 'کاربر هوشمندسازی یافت نشد.' };
      list[idx] = { ...list[idx], password: cleanPass };
      Storage.setSmartCampusStaff(list);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر / ریست رمز هوشمندسازی توسط مدیر',
        details: `کلمه عبور کاربر هوشمندسازی ${list[idx].fullName} (${list[idx].username}) توسط مدیر تغییر یافت.`,
        targetName: list[idx].fullName,
        severity: 'warning',
      });
      return {
        success: true,
        message: `رمز عبور واحد هوشمندسازی «${list[idx].fullName}» به «${cleanPass}» تغییر یافت.`,
      };
    }

    if (role === 'graduation') {
      const list = Storage.getGraduationStaff();
      const idx = list.findIndex((s) => s.id === idOrStudentId);
      if (idx === -1) return { success: false, message: 'کاربر واحد فارغ‌التحصیلان یافت نشد.' };
      list[idx] = { ...list[idx], password: cleanPass };
      Storage.setGraduationStaff(list);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر / ریست رمز واحد فارغ‌التحصیلان توسط مدیر',
        details: `کلمه عبور کارشناس فارغ‌التحصیلان ${list[idx].fullName} (${list[idx].username}) توسط مدیر تغییر یافت.`,
        targetName: list[idx].fullName,
        severity: 'warning',
      });
      return {
        success: true,
        message: `رمز عبور واحد فارغ‌التحصیلان «${list[idx].fullName}» به «${cleanPass}» تغییر یافت.`,
      };
    }

    if (role === 'academic_deputy') {
      const list = Storage.getAcademicDeputyStaff();
      const idx = list.findIndex((s) => s.id === idOrStudentId);
      if (idx === -1) return { success: false, message: 'کاربر معاونت آموزشی یافت نشد.' };
      list[idx] = { ...list[idx], password: cleanPass };
      Storage.setAcademicDeputyStaff(list);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر / ریست رمز معاونت آموزشی توسط مدیر',
        details: `کلمه عبور معاونت آموزشی ${list[idx].fullName} (${list[idx].username}) توسط مدیر تغییر یافت.`,
        targetName: list[idx].fullName,
        severity: 'warning',
      });
      return {
        success: true,
        message: `رمز عبور معاونت آموزشی «${list[idx].fullName}» به «${cleanPass}» تغییر یافت.`,
      };
    }

    if (role === 'professor') {
      const list = Storage.getSchedProfessors();
      const idx = list.findIndex((p) => p.id === idOrStudentId || p.professorCode === idOrStudentId);
      if (idx === -1) return { success: false, message: 'استاد یافت نشد.' };
      list[idx] = { ...list[idx], password: cleanPass };
      Storage.setSchedProfessors(list);
      Storage.addActivityLog({
        category: 'auth',
        action: 'تغییر / ریست رمز استاد توسط مدیر',
        details: `کلمه عبور استاد ${list[idx].fullName} (${list[idx].professorCode}) توسط مدیر تغییر یافت.`,
        targetName: list[idx].fullName,
        severity: 'warning',
      });
      return {
        success: true,
        message: `رمز عبور استاد «${list[idx].fullName}» به «${cleanPass}» تغییر یافت.`,
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
      requesterDepartment?: string;
      requestLocation?: string;
      requestedByStaffId: string;
      requestedByStaffName: string;
      requestedByRole: WarehouseRequesterRole;
      itemTitle: string;
      itemCategory?: string;
      isCustomItem?: boolean;
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

    // درخواست‌های مستقیم کارکنان، سرپرستان و مدیر مستقیماً به کارتابل انبار ارسال می‌شوند؛
    // فقط درخواست‌های متصل به مأموریت تأسیسات ابتدا جهت تأیید سرپرست ارسال می‌گردند
    const isAutoApproved =
      requestData.requestedByRole !== 'maintenance' || !requestData.taskId;

    const newReq: WarehouseRequest = {
      id: `wreq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      requestCode,
      taskId: requestData.taskId,
      taskTrackingCode: requestData.taskTrackingCode,
      dormId: requestData.dormId,
      dormName: requestData.dormName,
      requesterDepartment: requestData.requesterDepartment?.trim() || undefined,
      requestLocation: requestData.requestLocation?.trim() || undefined,
      requestedByStaffId: requestData.requestedByStaffId,
      requestedByStaffName: requestData.requestedByStaffName,
      requestedByRole: requestData.requestedByRole,
      itemTitle: requestData.itemTitle.trim(),
      itemCategory: requestData.itemCategory?.trim() || undefined,
      isCustomItem: Boolean(requestData.isCustomItem),
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

    Storage.addActivityLog({
      category: 'warehouse',
      action: 'ثبت درخواست اقلام از انبار',
      details: `درخواست ${requestCode} برای «${newReq.itemTitle}» (${newReq.quantityRequested} ${newReq.unit}) توسط ${newReq.requestedByStaffName}${newReq.requestLocation ? ` — محل: ${newReq.requestLocation}` : ''} ثبت شد.`,
      targetName: requestCode,
    });

    return {
      success: true,
      message: isAutoApproved
        ? `درخواست به انبار با کد رهگیری «${requestCode}» ثبت و مستقیماً به کارتابل انبار ارسال شد.`
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
        startTime: '۰۷:۰۰',
        endTime: '۰۷:۰۰',
        endsNextDay: true,
        notes: 'حضور پیوسته در سرا (پیش‌فرض خودکار سیستم در صورت نبود برنامه ماهانه)',
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
      } else if (currentUser.role === 'vice_dean') {
        actorName = currentUser.staff.fullName;
        actorRole = 'vice_dean';
        actorUsername = currentUser.staff.username;
      } else if (currentUser.role === 'library') {
        actorName = currentUser.staff.fullName;
        actorRole = 'library';
        actorUsername = currentUser.staff.username;
      } else if (currentUser.role === 'smart_campus') {
        actorName = currentUser.staff.fullName;
        actorRole = 'smart_campus';
        actorUsername = currentUser.staff.username;
      } else if (currentUser.role === 'graduation') {
        actorName = currentUser.staff.fullName;
        actorRole = 'graduation';
        actorUsername = currentUser.staff.username;
      }
    }

    const logs = Storage.getActivityLogs();
    const now = new Date();
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const logTimestamp = now.toISOString();
    const newLog: ActivityLog = {
      id: logId,
      timestamp: logTimestamp,
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
      integrityHash: computeAuditChainHash(logs[0]?.integrityHash, {
        id: logId,
        timestamp: logTimestamp,
        actorRole,
        actorUsername,
        category: entry.category,
        action: entry.action,
        details: entry.details,
      }),
    };

    const updated = [newLog, ...logs].slice(0, 500);
    if (memoryKeyUpdatedAt[STORAGE_KEYS.ACTIVITY_LOGS]) {
      Storage.setActivityLogs(updated);
    } else {
      safeLocalStorageSet(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(updated), updated);
    }
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
        saveStudentsLocalOnly(students);
        if (targetStudents.length > 0) {
          void upsertStudentRowsToSupabase(targetStudents);
        }
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
    const normalizedFields = normalizeAssignedFieldsList(staffData.assignedFields);
    const eduRole: 'expert' | 'department_head' =
      staffData.educationRole === 'department_head' ? 'department_head' : 'expert';
    const roleLabel = eduRole === 'department_head' ? 'مدیر گروه آموزشی' : 'کارشناس آموزش';
    const newStaff: EducationStaff = {
      ...staffData,
      id: makeUniqueId('edu'),
      username: cleanUsername,
      role: 'education',
      educationRole: eduRole,
      department:
        staffData.department?.trim() ||
        (eduRole === 'department_head' ? 'گروه آموزشی' : 'واحد آموزش و امور دانشجویی'),
      assignedFields: normalizedFields.length > 0 ? normalizedFields : undefined,
      status: staffData.status || 'active',
      isActive: staffData.isActive !== false,
    };
    list.push(newStaff);
    Storage.setEducationStaff(list);
    Storage.addActivityLog({
      category: 'staff',
      action: `ثبت ${roleLabel}`,
      details: `${roleLabel} «${newStaff.fullName}» (${newStaff.username})${normalizedFields.length > 0 ? ` — رشته‌ها: ${normalizedFields.join('، ')}` : ' — همه رشته‌ها'} در سامانه ثبت شد.`,
      targetName: newStaff.fullName,
    });
    return {
      success: true,
      message: `${roleLabel} «${newStaff.fullName}» با موفقیت افزوده شد.`,
      staff: newStaff,
    };
  },

  updateEducationStaff: (
    id: string,
    updates: Partial<EducationStaff>
  ): { success: boolean; message: string } => {
    const list = Storage.getEducationStaff();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false, message: 'کاربر حوزه آموزش یافت نشد.' };
    const normalizedUpdates = { ...updates };
    if (normalizedUpdates.username !== undefined) {
      const cleanU = normalizeAsciiDigits(normalizedUpdates.username).toLowerCase();
      if (!cleanU) return { success: false, message: 'نام کاربری نمی‌تواند خالی باشد.' };
      if (list.some((e) => e.id !== id && normalizeAsciiDigits(e.username).toLowerCase() === cleanU)) {
        return { success: false, message: 'این نام کاربری قبلاً برای کاربر آموزش دیگری ثبت شده است.' };
      }
      normalizedUpdates.username = cleanU;
    }
    if ('assignedFields' in normalizedUpdates) {
      const cleanFields = normalizeAssignedFieldsList(normalizedUpdates.assignedFields);
      normalizedUpdates.assignedFields = cleanFields.length > 0 ? cleanFields : undefined;
    }
    list[idx] = { ...list[idx], ...normalizedUpdates };
    Storage.setEducationStaff(list);
    const cu = Storage.getCurrentUser();
    if (cu && cu.role === 'education' && cu.staff.id === id) {
      Storage.setCurrentUser({ role: 'education', staff: list[idx] });
    }
    const roleLabel = getEducationStaffRoleLabel(list[idx]);
    return { success: true, message: `اطلاعات ${roleLabel} با موفقیت بروزرسانی شد.` };
  },

  deleteEducationStaff: (id: string): { success: boolean; message: string } => {
    const list = Storage.getEducationStaff();
    const target = list.find((s) => s.id === id);
    Storage.setEducationStaff(list.filter((s) => s.id !== id));
    if (target) {
      const roleLabel = getEducationStaffRoleLabel(target);
      Storage.addActivityLog({
        category: 'staff',
        action: `حذف ${roleLabel}`,
        details: `حساب کاربری ${roleLabel} «${target.fullName}» حذف گردید.`,
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
    const isDormResident =
      student.residenceType === 'dormitory' || student.residenceType === 'commuter'
        ? student.residenceType === 'dormitory'
        : Boolean(student.assignedBedId && student.assignmentStatus !== 'none');
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
    referredByRole:
      | 'supervisor'
      | 'admin'
      | 'vice_dean'
      | 'student_affairs'
      | 'security'
      | 'counselor'
      | 'finance'
      | 'education'
      | 'cultural'
      | 'maintenance'
      | 'library'
      | 'smart_campus'
      | 'graduation'
      | 'academic_deputy';
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
      const isDormResident =
        st.residenceType === 'dormitory' || st.residenceType === 'commuter'
          ? st.residenceType === 'dormitory'
          : Boolean(st.assignedBedId && st.assignmentStatus !== 'none');

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

    const isDormResident =
      student.residenceType === 'dormitory' || student.residenceType === 'commuter'
        ? student.residenceType === 'dormitory'
        : Boolean(student.assignedBedId && student.assignmentStatus !== 'none');
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
  // توابع همگام‌سازی دوطرفه مقیاس‌پذیر با Supabase (PostgreSQL + Storage)
  // -------------------------------------------------------------
  fetchStudentsFromDB: async (): Promise<Student[] | null> => {
    try {
      const pageSize = SUPABASE_STUDENTS_PAGE_SIZE;
      const collected: Student[] = [];
      let maxRowUpdatedAt: string | null = null;
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const to = from + pageSize - 1;
        const { data, error } = await supabase
          .from('students')
          .select('id, national_code, data, avatar_url, updated_at')
          .order('id', { ascending: true })
          .range(from, to);

        const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;

        if (error) {
          recordCloudTrafficEvent({
            direction: 'down',
            endpoint: `/supabase/students?range=${from}-${to}`,
            method: 'GET',
            status: 500,
            ok: false,
            durationMs: dur,
            bytes: 0,
            detail: 'خطا در دریافت صفحه دانشجویان از Supabase',
            errorMessage: error.message,
          });
          return null;
        }

        const rows = Array.isArray(data) ? data : [];
        const rxBytes = getUtf8ByteLength(JSON.stringify(rows));

        for (const row of rows) {
          if (row && typeof row === 'object') {
            const rec = row as Record<string, unknown>;
            if (typeof rec.updated_at === 'string' && (!maxRowUpdatedAt || rec.updated_at > maxRowUpdatedAt)) {
              maxRowUpdatedAt = rec.updated_at;
            }
            collected.push(mapSupabaseRowToStudent(rec));
          }
        }

        recordCloudTrafficEvent({
          direction: 'down',
          endpoint: `/supabase/students?range=${from}-${to}`,
          method: 'GET',
          status: 200,
          ok: true,
          durationMs: dur,
          bytes: rxBytes,
          detail: `دریافت ${rows.length.toLocaleString('fa-IR')} پرونده دانشجو از Supabase (مجموع ${collected.length.toLocaleString('fa-IR')})`,
        });

        hasMore = rows.length === pageSize;
        from += pageSize;
      }

      if (maxRowUpdatedAt) {
        lastStudentsDeltaSyncIso = maxRowUpdatedAt;
      }

      const lastLocalWrite = keyWriteTimestamps[STORAGE_KEYS.STUDENTS] || 0;
      if (Date.now() - lastLocalWrite > 5000 && collected.length > 0) {
        safeLocalStorageSet(STORAGE_KEYS.STUDENTS, JSON.stringify(collected), collected);
      }
      return collected;
    } catch (err) {
      console.warn('fetchStudentsFromDB error:', err);
      return null;
    }
  },

  // دریافت دقیق و سبک فقط یک دانشجو از Supabase با فیلتر id (کد دانشجویی) یا national_code (بدون دانلود کل جدول students)
  fetchSingleStudentFromDB: async (params: {
    studentId?: string;
    nationalCode?: string;
  }): Promise<{ ok: boolean; student: Student | null; networkError?: boolean }> => {
    const cleanStudentId = normalizeAsciiDigits(params.studentId || '');
    const cleanNationalCode = normalizeAsciiDigits(params.nationalCode || '');
    if (!cleanStudentId && !cleanNationalCode) {
      return { ok: true, student: null };
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return { ok: false, student: null, networkError: true };
    }

    const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
    try {
      let matchedRow: Record<string, unknown> | null = null;

      // ۱. جستجوی مستقیم و ایندکس‌شده بر اساس کد دانشجویی (ستون id)
      if (cleanStudentId) {
        const { data, error } = await supabase
          .from('students')
          .select('id, national_code, data, avatar_url, updated_at')
          .eq('id', cleanStudentId)
          .maybeSingle();

        if (error) {
          const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;
          recordCloudTrafficEvent({
            direction: 'down',
            endpoint: `/supabase/students?id=${cleanStudentId}`,
            method: 'GET',
            status: 500,
            ok: false,
            durationMs: dur,
            bytes: 0,
            detail: 'خطا در استعلام تک‌ردیفی دانشجو از Supabase',
            errorMessage: error.message,
          });
          return { ok: false, student: null, networkError: true };
        }
        if (data && typeof data === 'object') {
          matchedRow = data as Record<string, unknown>;
        }
      }

      // ۲. در صورت نیافتن با کد دانشجویی (یا ورود با کد ملی)، فیلتر دقیق با ستون national_code
      if (!matchedRow && cleanNationalCode) {
        const { data, error } = await supabase
          .from('students')
          .select('id, national_code, data, avatar_url, updated_at')
          .eq('national_code', cleanNationalCode)
          .limit(5);

        if (error) {
          const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;
          recordCloudTrafficEvent({
            direction: 'down',
            endpoint: '/supabase/students?national_code=***',
            method: 'GET',
            status: 500,
            ok: false,
            durationMs: dur,
            bytes: 0,
            detail: 'خطا در استعلام تک‌ردیفی دانشجو با کد ملی از Supabase',
            errorMessage: error.message,
          });
          return { ok: false, student: null, networkError: true };
        }

        if (Array.isArray(data) && data.length > 0) {
          const found = cleanStudentId
            ? data.find(
                (r) =>
                  normalizeAsciiDigits(
                    String((r as Record<string, unknown>)?.id || '')
                  ) === cleanStudentId
              )
            : data[0];
          if (found && typeof found === 'object') {
            matchedRow = found as Record<string, unknown>;
          }
        }
      }

      const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;
      const mapped = matchedRow ? mapSupabaseRowToStudent(matchedRow) : null;
      const rxBytes = mapped ? getUtf8ByteLength(JSON.stringify(matchedRow)) : 0;

      recordCloudTrafficEvent({
        direction: 'down',
        endpoint: '/supabase/students (single)',
        method: 'GET',
        status: 200,
        ok: true,
        durationMs: dur,
        bytes: rxBytes,
        detail: mapped
          ? `دریافت تک‌ردیفی پرونده دانشجو (${mapped.studentId}) بدون دانلود کل جدول`
          : 'استعلام تک‌ردیفی دانشجو (رکوردی یافت نشد)',
      });

      return { ok: true, student: mapped };
    } catch (err) {
      const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;
      recordCloudTrafficEvent({
        direction: 'down',
        endpoint: '/supabase/students (single)',
        method: 'GET',
        status: null,
        ok: false,
        durationMs: dur,
        bytes: 0,
        detail: 'وقفه شبکه در استعلام تک‌ردیفی دانشجو',
        errorMessage: err instanceof Error ? err.message : 'Network error',
      });
      return { ok: false, student: null, networkError: true };
    }
  },

  // احراز هویت بهینه دانشجو: فقط ردیف خود دانشجو را از Supabase می‌خواند و هرگز کل جدول students را دانلود نمی‌کند
  authenticateStudentFromCloud: async (
    rawStudentId: string,
    rawPasswordOrNationalId: string
  ): Promise<{ matched: boolean; student?: Student }> => {
    const cleanId = normalizeAsciiDigits(rawStudentId);
    const cleanPass = normalizeAsciiDigits(rawPasswordOrNationalId);
    if (!cleanId || !cleanPass) {
      return { matched: false };
    }

    const matchesPassword = async (s: Student): Promise<boolean> => {
      if (normalizeAsciiDigits(s.studentId) !== cleanId) return false;
      const rawStored = String(s.password || s.nationalId || '').trim();
      if (!rawStored) return false;
      return verifyPasswordCompatible(cleanPass, rawStored);
    };

    // گام ۱: استعلام تک‌ردیفی مستقیم از Supabase (بسیار کم‌حجم؛ زیر ۱ کیلوبایت)
    const remoteRes = await Storage.fetchSingleStudentFromDB({
      studentId: cleanId,
      nationalCode: cleanPass,
    });

    if (remoteRes.ok && remoteRes.student) {
      if (await matchesPassword(remoteRes.student)) {
        // در نشست دانشجو فقط پرونده خود همان دانشجو در حافظه محلی نگهداری می‌شود
        upsertLocalSingleStudent(remoteRes.student, true);
        notifyCloudDataChanged();
        return { matched: true, student: remoteRes.student };
      }
      // دانشجو در دیتابیس ابری وجود دارد اما رمز عبور/کد ملی مطابقت نداشت
      return { matched: false };
    }

    // گام ۲: فقط در حالت آفلاین یا داده‌های نمونه محلی (بدون دانلود کل جدول)، بررسی حافظه محلی
    const localList = Storage.getStudents();
    for (const candidate of localList) {
      if (await matchesPassword(candidate)) {
        upsertLocalSingleStudent(candidate, true);
        return { matched: true, student: candidate };
      }
    }

    return { matched: false };
  },

  invalidatePublicCache: (): void => {
    invalidatePublicSessionCache();
  },

  getPublicCacheStatus: (): { isFresh: boolean; cachedAt: number | null; ttlMs: number } => {
    const meta = readPublicSessionCacheMeta();
    return {
      isFresh: isPublicSessionCacheFresh(),
      cachedAt: meta?.cachedAt ?? null,
      ttlMs: PUBLIC_CACHE_TTL_MS,
    };
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

    let preparedStudent: Student = normalizeStudentRecord(newStudent as unknown as Record<string, unknown>);
    preparedStudent = {
      ...preparedStudent,
      residenceType: preparedStudent.residenceType || newStudent.residenceType,
      admissionStatus: newStudent.admissionStatus || preparedStudent.admissionStatus,
    };

    if (isBase64ImageDataUrl(preparedStudent.photoUrl)) {
      const up = await uploadBase64ToSupabaseAvatar('student', preparedStudent.studentId, preparedStudent.photoUrl);
      if (up.ok && up.publicUrl) {
        preparedStudent = { ...preparedStudent, photoUrl: up.publicUrl };
      }
    }

    const ok = await upsertStudentRowsToSupabase([preparedStudent]);
    if (!ok) {
      return {
        success: false,
        message: 'عدم امکان ثبت دانشجو در پایگاه داده Supabase. لطفاً اتصال اینترنت و دسترسی جدول students را بررسی نمایید.',
      };
    }

    const updatedStudents = [preparedStudent, ...currentStudents];
    const serialized = JSON.stringify(updatedStudents);
    keyWriteTimestamps[STORAGE_KEYS.STUDENTS] = Date.now();
    safeLocalStorageSet(STORAGE_KEYS.STUDENTS, serialized, updatedStudents);
    const ts = new Date().toISOString();
    lastSyncRevision = ts;
    updateLocalCloudKeyTimestamp(STORAGE_KEYS.STUDENTS, ts);
    clearKeyDirtyForCloud(STORAGE_KEYS.STUDENTS);

    Storage.addActivityLog({
      category: 'student',
      action: 'ثبت دانشجوی جدید در Supabase',
      details: `دانشجو ${preparedStudent.fullName} (${preparedStudent.studentId}) ثبت شد.`,
      targetName: `${preparedStudent.fullName} (${preparedStudent.studentId})`,
    });

    return {
      success: true,
      student: preparedStudent,
      message: 'دانشجو با موفقیت در پایگاه داده ابری Supabase ثبت شد.',
    };
  },

  uploadPhotosToCloud: async (
    role: AvatarUploadRole,
    items: Array<{ userId: string; dataUrl: string }>,
    onProgress?: (done: number, total: number) => void
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
    let failedCount = 0;
    let lastErrorMessage = '';
    let completed = 0;

    await runConcurrentQueue(validItems, AVATAR_UPLOAD_CONCURRENCY, async (it) => {
      const uid = it.userId.trim();
      const res = await uploadBase64ToSupabaseAvatar(role, uid, it.dataUrl);
      completed += 1;
      onProgress?.(completed, validItems.length);
      if (res.ok && res.publicUrl) {
        urls[uid] = res.publicUrl;
      } else {
        failedCount += 1;
        if (res.errorMessage) lastErrorMessage = res.errorMessage;
      }
    });

    return {
      supported: true,
      ok: failedCount === 0,
      urls,
      errorMessage:
        failedCount > 0
          ? lastErrorMessage || `${failedCount.toLocaleString('fa-IR')} تصویر در Supabase Storage بارگذاری نشد.`
          : undefined,
    };
  },

  uploadSinglePhotoToCloud: async (
    role: AvatarUploadRole,
    userId: string,
    dataUrl: string
  ): Promise<{ supported: boolean; ok: boolean; url: string; errorMessage?: string }> => {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      return { supported: true, ok: true, url: dataUrl };
    }
    if (dataUrl.slice(0, 40).toLowerCase().includes('image/svg+xml')) {
      return {
        supported: true,
        ok: false,
        url: '',
        errorMessage: 'فرمت SVG مجاز نیست. لطفاً تصویر JPG، PNG یا WebP بارگذاری کنید.',
      };
    }
    const res = await uploadBase64ToSupabaseAvatar(role, userId.trim(), dataUrl);
    return {
      supported: true,
      ok: res.ok,
      url: res.publicUrl || dataUrl,
      errorMessage: res.errorMessage,
    };
  },

  getBackgroundAvatarQueueStatus: () => ({ ...backgroundAvatarStats }),

  getFriendlySyncKeyLabel: (key: string): string => FRIENDLY_SYNC_KEY_LABELS[key] || key,

  syncStudentsCollectionToCloud: async (
    studentsList: Student[],
    replaceAll = false,
    onProgress?: (message: string) => void
  ): Promise<{ ok: boolean; count: number; revision: string | number | null }> => {
    return mirrorStudentsCollectionToCloud(studentsList, { replaceAll, onProgress });
  },

  retryFailedCloudQueueNow: async (): Promise<{ success: boolean; failedKeys: string[] }> => {
    failedRetryAttempts = 0;
    flushFailedRetryQueue();
    return Storage.waitForPendingCloudSync();
  },

  waitForPendingCloudSync: async (): Promise<{ success: boolean; failedKeys: string[] }> => {
    const failedSet = new Set<string>();
    for (let pass = 0; pass < 3; pass += 1) {
      flushFailedRetryQueue();
      flushAllPendingCloudTimers(false);

      const entries = Object.entries(pendingCloudRequests).filter(
        (entry): entry is [string, Promise<boolean>] => Boolean(entry[1])
      );
      const mirrorList = Array.from(activeStudentMirrorPromises);

      if (entries.length === 0 && mirrorList.length === 0) {
        break;
      }

      const [kvResults] = await Promise.all([
        Promise.all(entries.map(async ([key, promise]) => ({ key, ok: await promise }))),
        Promise.all(mirrorList),
      ]);

      for (const r of kvResults) {
        if (!r.ok) failedSet.add(r.key);
        else failedSet.delete(r.key);
      }

      if (Object.keys(pendingCloudValues).length === 0 && Object.keys(pendingCloudRequests).length === 0) {
        break;
      }
    }

    for (const k of Object.keys(failedCloudRetryQueue)) {
      failedSet.add(k);
    }
    const failedKeys = Array.from(failedSet);
    return { success: failedKeys.length === 0, failedKeys };
  },

  syncAllToCloudDetailed: async (
    onProgress?: (message: string) => void
  ): Promise<{
    ok: boolean;
    syncedCount: number;
    totalCount: number;
    settingsSynced: boolean;
    studentsMirroredCount: number;
    studentsMirrorOk: boolean;
    latestRevision: string | number | null;
    totalBytesSent: number;
    failedKeys: string[];
    oversizedKeys: string[];
  }> => {
    const failedKeys: string[] = [];
    const oversizedKeys: string[] = [];
    let syncedCount = 0;
    let settingsSynced = false;
    let studentsMirroredCount = 0;
    let studentsMirrorOk = true;
    let latestRevision: string | number | null = null;
    let totalBytesSent = 0;

    try {
      onProgress?.('در حال آماده‌سازی تمام جداول، کاربران و تنظیمات برای انتقال به Supabase...');
      flushAllPendingCloudTimers(false);
      const inflightInitial = Object.values(pendingCloudRequests).filter(
        (p): p is Promise<boolean> => Boolean(p)
      );
      if (inflightInitial.length > 0) {
        await Promise.all(inflightInitial);
      }

      // جمع‌آوری همه کلیدهای app_storage (به‌جز جدول students که در جدول اختصاصی خود ذخیره می‌شود)
      const kvEntries: Array<{ key: string; value: unknown; byteEstimate: number }> = [];
      for (const key of SYNCABLE_KEYS) {
        if (key === STORAGE_KEYS.STUDENTS) continue;
        let parsedVal: unknown = undefined;
        if (parsedCache.has(key)) {
          parsedVal = cloneValue(parsedCache.get(key));
        } else {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          try {
            parsedVal = JSON.parse(raw);
          } catch {
            continue;
          }
        }
        if (parsedVal !== undefined) {
          const cleaned = sanitizeValueForAppStorage(key, parsedVal);
          let byteEstimate = 0;
          try {
            byteEstimate = getUtf8ByteLength(JSON.stringify(cleaned));
          } catch {
            byteEstimate = 0;
          }
          kvEntries.push({ key, value: cleaned, byteEstimate });
          keyWriteTimestamps[key] = Date.now();
        }
      }

      const totalCount = kvEntries.length;

      // دسته‌بندی ایمن برای upsert سریع در جدول app_storage
      const batches: Array<Array<{ key: string; value: unknown; byteEstimate: number }>> = [];
      let curBatch: Array<{ key: string; value: unknown; byteEstimate: number }> = [];
      let curBytes = 0;

      for (const entry of kvEntries) {
        if (entry.byteEstimate > 450_000 || entry.key === STORAGE_KEYS.SETTINGS) {
          batches.push([entry]);
          continue;
        }
        if (curBatch.length >= 10 || curBytes + entry.byteEstimate > 1_200_000) {
          batches.push(curBatch);
          curBatch = [];
          curBytes = 0;
        }
        curBatch.push(entry);
        curBytes += entry.byteEstimate;
      }
      if (curBatch.length > 0) batches.push(curBatch);

      for (let bIdx = 0; bIdx < batches.length; bIdx += 1) {
        const chunk = batches[bIdx];
        onProgress?.(
          chunk.length === 1
            ? `در حال ذخیره «${FRIENDLY_SYNC_KEY_LABELS[chunk[0].key] || chunk[0].key}» در Supabase (${(bIdx + 1).toLocaleString('fa-IR')}/${batches.length.toLocaleString('fa-IR')})...`
            : `در حال انتقال جداول به Supabase (دسته ${(bIdx + 1).toLocaleString('fa-IR')} از ${batches.length.toLocaleString('fa-IR')})...`
        );

        const updatedAt = new Date().toISOString();
        const rows = chunk.map((c) => ({
          key: c.key,
          value: c.value,
          updated_at: updatedAt,
        }));
        const chunkBytes = getUtf8ByteLength(JSON.stringify(rows));
        const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();

        let chunkOk = false;
        for (let attempt = 1; attempt <= 2 && !chunkOk; attempt += 1) {
          const { error } = await supabase.from('app_storage').upsert(rows, { onConflict: 'key' });
          const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;
          if (!error) {
            chunkOk = true;
            latestRevision = updatedAt;
            syncedCount += chunk.length;
            totalBytesSent += chunkBytes;
            chunk.forEach((c) => {
              if (c.key === STORAGE_KEYS.SETTINGS) settingsSynced = true;
              updateLocalCloudKeyTimestamp(c.key, updatedAt);
              delete failedCloudRetryQueue[c.key];
              clearKeyDirtyForCloud(c.key);
            });
            recordCloudTrafficEvent({
              direction: 'up',
              endpoint: '/supabase/app_storage',
              method: 'POST',
              status: 200,
              ok: true,
              durationMs: dur,
              bytes: chunkBytes,
              detail: `انتقال دسته ${bIdx + 1}/${batches.length} (${chunk.length} جدول) به Supabase`,
            });
          } else {
            recordCloudTrafficEvent({
              direction: 'up',
              endpoint: '/supabase/app_storage',
              method: 'POST',
              status: 500,
              ok: false,
              durationMs: dur,
              bytes: chunkBytes,
              detail: `خطا در ارسال دسته ${bIdx + 1}/${batches.length}`,
              errorMessage: error.message,
            });
            if (attempt < 2) {
              await new Promise((r) => setTimeout(r, 700));
            }
          }
        }

        if (!chunkOk) {
          // تلاش تکی برای شناسایی دقیق کلید مشکل‌دار
          for (const item of chunk) {
            const singleOk = await sendSingleKeyPost(item.key, item.value, false, 2);
            if (singleOk) {
              syncedCount += 1;
              totalBytesSent += item.byteEstimate;
              if (item.key === STORAGE_KEYS.SETTINGS) settingsSynced = true;
            } else {
              failedKeys.push(item.key);
            }
          }
        }
      }

      // هم‌ترازی کامل جدول اختصاصی students در Supabase در دسته‌های ۲۰۰تایی
      const currentStudents = Storage.getStudents();
      if (currentStudents.length > 0) {
        const mirrorRes = await mirrorStudentsCollectionToCloud(currentStudents, {
          replaceAll: true,
          onProgress,
        });
        studentsMirroredCount = mirrorRes.count;
        studentsMirrorOk = mirrorRes.ok;
        totalBytesSent += getUtf8ByteLength(JSON.stringify(currentStudents.map(buildSupabaseStudentRow)));
        if (mirrorRes.revision !== null) {
          latestRevision = mirrorRes.revision;
        }
      }

      if (failedKeys.length === 0 && latestRevision !== null) {
        lastSyncRevision = latestRevision;
        failedRetryAttempts = 0;
      }

      notifyCloudMetricsSubscribers();

      return {
        ok: failedKeys.length === 0 && studentsMirrorOk,
        syncedCount,
        totalCount,
        settingsSynced,
        studentsMirroredCount,
        studentsMirrorOk,
        latestRevision,
        totalBytesSent,
        failedKeys,
        oversizedKeys,
      };
    } catch (err) {
      console.warn('syncAllToCloudDetailed error:', err);
      return {
        ok: false,
        syncedCount,
        totalCount: 0,
        settingsSynced,
        studentsMirroredCount,
        studentsMirrorOk: false,
        latestRevision,
        totalBytesSent,
        failedKeys,
        oversizedKeys,
      };
    }
  },

  syncAllToCloud: async (): Promise<boolean> => {
    const res = await Storage.syncAllToCloudDetailed();
    return res.ok;
  },

  subscribeCloudDataChanged: (listener: () => void): (() => void) => {
    cloudDataChangedSubscribers.add(listener);
    return () => {
      cloudDataChangedSubscribers.delete(listener);
    };
  },

  hasCloudHydrated: (): boolean => {
    if (memoryKeyUpdatedAt[STORAGE_KEYS.SETTINGS] && memoryKeyUpdatedAt[STORAGE_KEYS.SUPERVISORS]) {
      return true;
    }
    const meta = readPersistedCloudSyncMeta();
    return Boolean(meta.hydrated && meta.keyUpdatedAt?.[STORAGE_KEYS.SETTINGS]);
  },

  // همگام‌سازی فوری و هدفمند پیش از ورود کاربر در دستگاه‌های تازه از Supabase
  ensureCloudDataForAuth: async (
    scope: 'student' | 'staff' | 'admin',
    options?: { studentId?: string; nationalCode?: string }
  ): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return false;
    }

    const fetchKeysFromSupabase = async (keys: string[]): Promise<boolean> => {
      const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
      try {
        const { data, error } = await supabase
          .from('app_storage')
          .select('key, value, updated_at')
          .in('key', keys);
        const dur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;
        if (error || !Array.isArray(data)) {
          recordCloudTrafficEvent({
            direction: 'down',
            endpoint: `/supabase/app_storage?auth=${scope}`,
            method: 'GET',
            status: 500,
            ok: false,
            durationMs: dur,
            bytes: 0,
            detail: `خطا در همگام‌سازی فوری احراز هویت (${scope})`,
            errorMessage: error?.message,
          });
          return false;
        }
        const rxBytes = getUtf8ByteLength(JSON.stringify(data));
        recordCloudTrafficEvent({
          direction: 'down',
          endpoint: `/supabase/app_storage?auth=${scope}`,
          method: 'GET',
          status: 200,
          ok: true,
          durationMs: dur,
          bytes: rxBytes,
          detail: `همگام‌سازی فوری احراز هویت (${scope}) از Supabase`,
        });

        let updatedAny = false;
        for (const row of data) {
          const k = String(row.key || '');
          const v = sanitizePlainValue(row.value);
          if (!SYNCABLE_KEYS.includes(k) || v === undefined || v === null) continue;
          const ser = JSON.stringify(v);
          if (lastAppliedSerializedByKey.get(k) !== ser) {
            safeLocalStorageSet(k, ser, v);
            updatedAny = true;
          }
          if (typeof row.updated_at === 'string') {
            memoryKeyUpdatedAt[k] = row.updated_at;
          }
        }
        if (updatedAny) notifyCloudDataChanged();
        return data.length > 0;
      } catch {
        return false;
      }
    };

    if (scope === 'staff') {
      return fetchKeysFromSupabase(STAFF_AUTH_KEYS);
    }

    if (scope === 'admin') {
      return fetchKeysFromSupabase([STORAGE_KEYS.SETTINGS]);
    }

    // برای دانشجو هرگز کل جدول students دانلود نمی‌شود؛ فقط ردیف همان دانشجو با فیلتر دقیق خوانده می‌شود
    if (options?.studentId || options?.nationalCode) {
      const singleRes = await Storage.fetchSingleStudentFromDB(options);
      if (singleRes.ok && singleRes.student) {
        upsertLocalSingleStudent(singleRes.student, true);
        notifyCloudDataChanged();
        return true;
      }
    }
    return false;
  },

  syncFromCloud: async (options?: {
    force?: boolean;
    roleScope?: 'guest' | 'student' | 'staff';
  }): Promise<boolean> => {
    const force = Boolean(options?.force);
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return false;
    }
    if (force) {
      invalidatePublicSessionCache();
    }
    if (activeSyncPromise && !force) {
      return activeSyncPromise;
    }
    if (activeSyncPromise && force) {
      try {
        await activeSyncPromise;
      } catch {
        // ادامه با همگام‌سازی اجباری جدید
      }
    }

    if (initialSyncRetryTimer !== undefined) {
      clearTimeout(initialSyncRetryTimer);
      initialSyncRetryTimer = undefined;
    }

    flushFailedRetryQueue();

    const currentUser = Storage.getCurrentUser();
    const effectiveScope: 'guest' | 'student' | 'staff' =
      options?.roleScope ||
      (!currentUser ? 'guest' : currentUser.role === 'student' ? 'student' : 'staff');

    // جلوگیری از فراخوانی‌های تکراری متوالی در بازه بسیار کوتاه (مگر در حالت force)
    const lastScopeSyncAt = lastCompletedSyncAtByScope[effectiveScope] || 0;
    if (!force && lastScopeSyncAt > 0 && Date.now() - lastScopeSyncAt < SYNC_COALESCE_WINDOW_MS) {
      return false;
    }

    activeSyncPromise = (async () => {
      try {
        let hasRemoteChanges = false;
        let hadFetchError = false;
        let newestUpdatedAt: string | null = null;
        const persistedMeta = readPersistedCloudSyncMeta();
        const persistedKeyUpdatedAt: Record<string, string> = {
          ...(persistedMeta.keyUpdatedAt || {}),
        };
        let persistedMetaDirty = false;
        const isImpersonating = Boolean(Storage.getAdminImpersonator());

        const bumpNewest = (ts?: string | null) => {
          if (!ts || typeof ts !== 'string') return;
          if (!newestUpdatedAt || ts > newestUpdatedAt) {
            newestUpdatedAt = ts;
          }
        };

        // بررسی کش ۵ دقیقه‌ای sessionStorage برای داده‌های عمومی (اطلاعیه‌ها، سراها، تنظیمات، کتاب‌های کتابخانه)
        const publicCacheFresh = !force && isPublicSessionCacheFresh();
        if (publicCacheFresh) {
          const hydratedFromSession = hydratePublicKeysFromSessionCache();
          if (hydratedFromSession) {
            hasRemoteChanges = true;
            notifyCloudDataChanged();
          }
        }

        // در صفحه اصلی (مهمان) اگر کش ۵ دقیقه‌ای عمومی معتبر باشد، هیچ فراخوانی به Supabase انجام نمی‌شود
        if (effectiveScope === 'guest' && publicCacheFresh) {
          lastCompletedSyncAtByScope[effectiveScope] = Date.now();
          return hasRemoteChanges;
        }

        // تعیین دقیق کلیدهای app_storage مورد نیاز بر اساس نقش کاربر و وضعیت کش عمومی
        let kvKeysToFetch: string[] | null = null;
        if (effectiveScope === 'guest') {
          kvKeysToFetch = [...PUBLIC_CACHEABLE_KEYS];
        } else if (effectiveScope === 'student') {
          kvKeysToFetch = publicCacheFresh
            ? [...STUDENT_OPERATIONAL_KEYS]
            : [...PUBLIC_CACHEABLE_KEYS, ...STUDENT_OPERATIONAL_KEYS];
        } else {
          // مدیر و کارشناسان: اگر کش عمومی ۵ دقیقه‌ای معتبر باشد، فقط جداول غیرعمومی را تازه کن
          kvKeysToFetch = publicCacheFresh
            ? SYNCABLE_KEYS.filter(
                (k) => k !== STORAGE_KEYS.STUDENTS && !PUBLIC_CACHEABLE_KEY_SET.has(k)
              )
            : null; // null = دریافت کامل app_storage
        }

        const shouldUpdatePublicCache = !publicCacheFresh;

        // گام ۱: همگام‌سازی دوفاز تفاضلی (2-Phase Delta Sync) برای app_storage جهت صرفه‌جویی شدید در پهنای باند و افزایش سرعت
        const kvStartedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
        try {
          const allKvRows: Array<{ key: string; value: unknown; updated_at?: string | null }> = [];
          const hasLocalTsBaseline =
            Object.keys(memoryKeyUpdatedAt).length > 0 ||
            Object.keys(persistedKeyUpdatedAt).length > 0;
          let usedDeltaSync = false;
          let deltaHadZeroChanges = false;
          let deltaKeysToFetch: string[] | null = kvKeysToFetch;

          if (!force && hasLocalTsBaseline) {
            const metaQuery =
              kvKeysToFetch !== null
                ? supabase
                    .from('app_storage')
                    .select('key, updated_at')
                    .in('key', kvKeysToFetch)
                : supabase.from('app_storage').select('key, updated_at').range(0, 999);

            const { data: metaRows, error: metaError } = await metaQuery;
            if (!metaError && Array.isArray(metaRows)) {
              usedDeltaSync = true;
              const changedKeys: string[] = [];
              for (const mRow of metaRows) {
                const key = String((mRow as { key?: unknown }).key || '');
                if (!SYNCABLE_KEYS.includes(key) || key === STORAGE_KEYS.STUDENTS) continue;
                const srvTs =
                  typeof (mRow as { updated_at?: unknown }).updated_at === 'string'
                    ? ((mRow as { updated_at?: string }).updated_at as string)
                    : '';
                bumpNewest(srvTs);

                const localTs = memoryKeyUpdatedAt[key] || persistedKeyUpdatedAt[key] || '';
                let hasLocalCopy = parsedCache.has(key);
                if (!hasLocalCopy) {
                  try {
                    hasLocalCopy = localStorage.getItem(key) !== null;
                  } catch {
                    hasLocalCopy = false;
                  }
                }
                const needsStaffCounselorRehydrate =
                  effectiveScope === 'staff' &&
                  key === STORAGE_KEYS.COUNSELORS &&
                  Storage.getCounselors().some((c) => !c.username);
                if (!hasLocalCopy || !srvTs || !localTs || srvTs > localTs || needsStaffCounselorRehydrate) {
                  changedKeys.push(key);
                }
              }

              if (changedKeys.length === 0) {
                deltaHadZeroChanges = true;
                const dur =
                  (typeof performance !== 'undefined' ? performance.now() : Date.now()) - kvStartedAt;
                const metaBytes = getUtf8ByteLength(JSON.stringify(metaRows));
                recordCloudTrafficEvent({
                  direction: 'down',
                  endpoint: `/supabase/app_storage (delta:${effectiveScope})`,
                  method: 'GET',
                  status: 200,
                  ok: true,
                  durationMs: dur,
                  bytes: metaBytes,
                  detail: 'بررسی سریع تغییرات (Delta Sync) — همه جداول به‌روز هستند (بدون دانلود تکراری)',
                });
              } else {
                deltaKeysToFetch = changedKeys;
              }
            }
          }

          if (!deltaHadZeroChanges) {
            if (deltaKeysToFetch !== null) {
              if (deltaKeysToFetch.length > 0) {
                const { data, error } = await supabase
                  .from('app_storage')
                  .select('key, value, updated_at')
                  .in('key', deltaKeysToFetch);
                if (error) {
                  hadFetchError = true;
                  const dur =
                    (typeof performance !== 'undefined' ? performance.now() : Date.now()) -
                    kvStartedAt;
                  recordCloudTrafficEvent({
                    direction: 'down',
                    endpoint: `/supabase/app_storage (${effectiveScope})`,
                    method: 'GET',
                    status: 500,
                    ok: false,
                    durationMs: dur,
                    bytes: 0,
                    detail: `خطا در دریافت جداول app_storage (${effectiveScope})`,
                    errorMessage: error.message,
                  });
                } else if (Array.isArray(data)) {
                  for (const r of data) {
                    allKvRows.push(r as { key: string; value: unknown; updated_at?: string | null });
                  }
                }
              }
            } else {
              let from = 0;
              let hasMoreKv = true;
              while (hasMoreKv) {
                const { data, error } = await supabase
                  .from('app_storage')
                  .select('key, value, updated_at')
                  .range(from, from + 999);
                if (error) {
                  hadFetchError = true;
                  const dur =
                    (typeof performance !== 'undefined' ? performance.now() : Date.now()) -
                    kvStartedAt;
                  recordCloudTrafficEvent({
                    direction: 'down',
                    endpoint: '/supabase/app_storage',
                    method: 'GET',
                    status: 500,
                    ok: false,
                    durationMs: dur,
                    bytes: 0,
                    detail: 'خطا در دریافت جداول app_storage از Supabase',
                    errorMessage: error.message,
                  });
                  break;
                }
                const pageRows = Array.isArray(data) ? data : [];
                for (const r of pageRows) {
                  allKvRows.push(r as { key: string; value: unknown; updated_at?: string | null });
                }
                hasMoreKv = pageRows.length === 1000;
                from += 1000;
              }
            }
          }

          if (!hadFetchError && !deltaHadZeroChanges) {
            const dur =
              (typeof performance !== 'undefined' ? performance.now() : Date.now()) - kvStartedAt;
            const rxBytes = getUtf8ByteLength(JSON.stringify(allKvRows));
            recordCloudTrafficEvent({
              direction: 'down',
              endpoint: usedDeltaSync
                ? `/supabase/app_storage (delta:${effectiveScope})`
                : effectiveScope === 'staff'
                ? '/supabase/app_storage'
                : `/supabase/app_storage (${effectiveScope})`,
              method: 'GET',
              status: 200,
              ok: true,
              durationMs: dur,
              bytes: rxBytes,
              detail: usedDeltaSync
                ? `دریافت تفاضلی ${allKvRows.length.toLocaleString('fa-IR')} جدول تغییریافته (Delta Sync)`
                : `دریافت ${allKvRows.length.toLocaleString('fa-IR')} جدول (${
                    effectiveScope === 'guest'
                      ? 'عمومی صفحه اصلی'
                      : effectiveScope === 'student'
                      ? 'عملیاتی دانشجو'
                      : 'پنل مدیریت'
                  }) از Supabase`,
            });

            let batchChanged = false;
            const publicCacheEntries: Array<{ key: string; serialized: string }> = [];

            for (const row of allKvRows) {
              const key = String(row.key || '');
              if (!SYNCABLE_KEYS.includes(key) || key === STORAGE_KEYS.STUDENTS) continue;
              let val = sanitizePlainValue(row.value);
              if (val === undefined || val === null) continue;

              // در نشست واقعی دانشجو، فیلدهای ورود مشاوران پیش از ذخیره در مرورگر پاکسازی می‌شوند
              if (
                effectiveScope === 'student' &&
                !isImpersonating &&
                key === STORAGE_KEYS.COUNSELORS &&
                Array.isArray(val)
              ) {
                val = stripCredentialsFromStaffArray(val);
              }

              const srvTs = typeof row.updated_at === 'string' ? row.updated_at : '';
              bumpNewest(srvTs);

              if (
                pendingCloudRequests[key] ||
                key in pendingCloudValues ||
                key in failedCloudRetryQueue ||
                persistedDirtyKeys.has(key)
              ) {
                continue;
              }
              const lastLocalWrite = keyWriteTimestamps[key] || 0;
              if (!force && Date.now() - lastLocalWrite < 10000) continue;

              const serialized = JSON.stringify(val);
              if (PUBLIC_CACHEABLE_KEY_SET.has(key)) {
                publicCacheEntries.push({ key, serialized });
              }

              let currentLs: string | null = null;
              try {
                currentLs = localStorage.getItem(key);
              } catch {
                currentLs = null;
              }
              const alreadyApplied =
                lastAppliedSerializedByKey.get(key) === serialized || currentLs === serialized;

              let persistedOk = currentLs === serialized;
              if (!alreadyApplied) {
                persistedOk = safeLocalStorageSet(key, serialized, val);
                hasRemoteChanges = true;
                batchChanged = true;
              } else {
                lastAppliedSerializedByKey.set(key, serialized);
                if (!parsedCache.has(key)) {
                  parsedCache.set(key, cloneValue(val));
                }
              }

              if (srvTs) {
                memoryKeyUpdatedAt[key] = srvTs;
                if (persistedOk && persistedKeyUpdatedAt[key] !== srvTs) {
                  persistedKeyUpdatedAt[key] = srvTs;
                  persistedMetaDirty = true;
                }
              }
            }

            // ذخیره داده‌های عمومی در کش ۵ دقیقه‌ای sessionStorage
            if (shouldUpdatePublicCache && publicCacheEntries.length > 0) {
              writePublicKeysToSessionCache(publicCacheEntries);
            }

            if (batchChanged) {
              notifyCloudDataChanged();
            }
          }
        } catch (err) {
          hadFetchError = true;
          const dur =
            (typeof performance !== 'undefined' ? performance.now() : Date.now()) - kvStartedAt;
          recordCloudTrafficEvent({
            direction: 'down',
            endpoint: '/supabase/app_storage',
            method: 'GET',
            status: null,
            ok: false,
            durationMs: dur,
            bytes: 0,
            detail: 'خطای شبکه در دریافت app_storage از Supabase',
            errorMessage: err instanceof Error ? err.message : 'Network error',
          });
        }

        // گام ۲: جداسازی کامل بارگذاری جدول students بر اساس نقش کاربر (+ Delta Sync هوشمند برای پنل مدیریت)
        const lastStudentWrite = keyWriteTimestamps[STORAGE_KEYS.STUDENTS] || 0;
        const canApplyRemoteStudents =
          !pendingCloudRequests[STORAGE_KEYS.STUDENTS] &&
          !(STORAGE_KEYS.STUDENTS in pendingCloudValues) &&
          !(STORAGE_KEYS.STUDENTS in failedCloudRetryQueue) &&
          !persistedDirtyKeys.has(STORAGE_KEYS.STUDENTS) &&
          activeStudentMirrorPromises.size === 0 &&
          (force || Date.now() - lastStudentWrite >= 10000);

        if (effectiveScope === 'student' && currentUser?.role === 'student' && canApplyRemoteStudents) {
          // برای دانشجو: فقط و فقط ردیف خود همین دانشجو با فیلتر دقیق از Supabase دریافت می‌شود (هرگز کل جدول دانلود نمی‌شود)
          const singleRes = await Storage.fetchSingleStudentFromDB({
            studentId: currentUser.student.studentId,
            nationalCode: currentUser.student.nationalId,
          });
          if (!singleRes.ok) {
            hadFetchError = true;
          } else if (singleRes.student) {
            if (isImpersonating) {
              // در حالت ورود مدیر به کارتابل دانشجو، فهرست کامل دانشجویان محلی مدیر حفظ شده و فقط همین ردیف بروزرسانی می‌شود
              upsertLocalSingleStudent(singleRes.student, false);
              hasRemoteChanges = true;
              notifyCloudDataChanged();
            } else {
              const singleArray = [singleRes.student];
              const serializedSingle = JSON.stringify(singleArray);
              const changed = lastAppliedSerializedByKey.get(STORAGE_KEYS.STUDENTS) !== serializedSingle;
              if (changed) {
                safeLocalStorageSet(STORAGE_KEYS.STUDENTS, serializedSingle, singleArray);
                hasRemoteChanges = true;
                notifyCloudDataChanged();
              }
            }
          }
        } else if (effectiveScope === 'staff' && currentUser?.role !== 'professor' && canApplyRemoteStudents) {
          // همگام‌سازی تفاضلی هوشمند دانشجویان در پنل مدیر/کارشناسان؛ فقط در صورت حذف یا اولین بار کل جدول دریافت می‌شود
          let resolvedViaStudentsDelta = false;
          const localStudentsBefore = Storage.getStudents();
          if (!force && lastStudentsDeltaSyncIso && localStudentsBefore.length > 0) {
            const deltaStartedAt =
              typeof performance !== 'undefined' ? performance.now() : Date.now();
            try {
              const [countRes, deltaRes] = await Promise.all([
                supabase.from('students').select('id', { count: 'exact', head: true }),
                supabase
                  .from('students')
                  .select('id, national_code, data, avatar_url, updated_at')
                  .gt('updated_at', lastStudentsDeltaSyncIso)
                  .limit(500),
              ]);

              if (
                !countRes.error &&
                !deltaRes.error &&
                typeof countRes.count === 'number' &&
                Array.isArray(deltaRes.data) &&
                deltaRes.data.length < 500
              ) {
                const mergedMap = new Map<string, Student>();
                for (const st of localStudentsBefore) {
                  const keyId = normalizeAsciiDigits(st.studentId);
                  if (keyId) mergedMap.set(keyId, st);
                }

                let maxDeltaTs = lastStudentsDeltaSyncIso;
                for (const rawRow of deltaRes.data) {
                  if (!rawRow || typeof rawRow !== 'object') continue;
                  const rec = rawRow as Record<string, unknown>;
                  if (typeof rec.updated_at === 'string' && rec.updated_at > maxDeltaTs) {
                    maxDeltaTs = rec.updated_at;
                  }
                  const mapped = mapSupabaseRowToStudent(rec);
                  const keyId = normalizeAsciiDigits(mapped.studentId);
                  if (keyId) mergedMap.set(keyId, mapped);
                }

                if (mergedMap.size === countRes.count) {
                  resolvedViaStudentsDelta = true;
                  const dur =
                    (typeof performance !== 'undefined' ? performance.now() : Date.now()) -
                    deltaStartedAt;
                  const rxBytes = getUtf8ByteLength(JSON.stringify(deltaRes.data));
                  recordCloudTrafficEvent({
                    direction: 'down',
                    endpoint: '/supabase/students (delta)',
                    method: 'GET',
                    status: 200,
                    ok: true,
                    durationMs: dur,
                    bytes: rxBytes,
                    detail:
                      deltaRes.data.length === 0
                        ? 'بررسی سریع دانشجویان (Delta Sync) — بدون تغییر جدید'
                        : `دریافت تفاضلی ${deltaRes.data.length.toLocaleString('fa-IR')} پرونده دانشجوی تغییریافته`,
                  });

                  if (deltaRes.data.length > 0) {
                    const mergedList = Array.from(mergedMap.values());
                    const serializedMerged = JSON.stringify(mergedList);
                    safeLocalStorageSet(STORAGE_KEYS.STUDENTS, serializedMerged, mergedList);
                    hasRemoteChanges = true;
                    notifyCloudDataChanged();
                    lastStudentsDeltaSyncIso = maxDeltaTs;
                  }

                  const nowTs = new Date().toISOString();
                  memoryKeyUpdatedAt[STORAGE_KEYS.STUDENTS] = nowTs;
                  persistedKeyUpdatedAt[STORAGE_KEYS.STUDENTS] = nowTs;
                  persistedMetaDirty = true;
                  bumpNewest(nowTs);
                }
              }
            } catch {
              // در صورت خطا در بررسی تفاضلی، به دریافت کامل ایمن برمی‌گردد
            }
          }

          if (!resolvedViaStudentsDelta) {
            const fetchedStudents = await Storage.fetchStudentsFromDB();
            if (fetchedStudents === null) {
              hadFetchError = true;
            } else if (fetchedStudents.length > 0) {
              const serializedStudents = JSON.stringify(fetchedStudents);
              let currentStudentsLs: string | null = null;
              try {
                currentStudentsLs = localStorage.getItem(STORAGE_KEYS.STUDENTS);
              } catch {
                currentStudentsLs = null;
              }
              const studentsChanged =
                lastAppliedSerializedByKey.get(STORAGE_KEYS.STUDENTS) !== serializedStudents &&
                currentStudentsLs !== serializedStudents;
              if (studentsChanged) {
                safeLocalStorageSet(STORAGE_KEYS.STUDENTS, serializedStudents, fetchedStudents);
                hasRemoteChanges = true;
                notifyCloudDataChanged();
              } else {
                lastAppliedSerializedByKey.set(STORAGE_KEYS.STUDENTS, serializedStudents);
                if (!parsedCache.has(STORAGE_KEYS.STUDENTS)) {
                  parsedCache.set(STORAGE_KEYS.STUDENTS, cloneValue(fetchedStudents));
                }
              }
              const nowTs = new Date().toISOString();
              memoryKeyUpdatedAt[STORAGE_KEYS.STUDENTS] = nowTs;
              persistedKeyUpdatedAt[STORAGE_KEYS.STUDENTS] = nowTs;
              persistedMetaDirty = true;
              bumpNewest(nowTs);
            }
          }
        }
        // در حالت مهمان (صفحه اصلی): جدول students اصلاً فراخوانی نمی‌شود

        if (!hadFetchError) {
          lastCompletedSyncAtByScope[effectiveScope] = Date.now();
          if (newestUpdatedAt) {
            lastSyncRevision = newestUpdatedAt;
          }
          if (persistedMetaDirty || newestUpdatedAt) {
            writePersistedCloudSyncMeta({
              revision: newestUpdatedAt || persistedMeta.revision || null,
              hydrated: true,
              keyUpdatedAt: persistedKeyUpdatedAt,
            });
          }
        } else if (typeof setTimeout === 'function') {
          const jitterMs = Math.floor(Math.random() * 3000);
          initialSyncRetryTimer = setTimeout(() => {
            initialSyncRetryTimer = undefined;
            void Storage.syncFromCloud();
          }, 7000 + jitterMs);
        }

        return hasRemoteChanges;
      } catch (err) {
        console.warn('syncFromCloud error:', err);
        return false;
      } finally {
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
        | 'security'
        | 'vice_dean'
        | 'library'
        | 'smart_campus'
        | 'graduation'
        | 'academic_deputy'
        | 'professor';
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
        roleLabel: getEducationStaffRoleLabel(e),
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
      ...Storage.getViceDeanStaff().map((vd) => ({
        role: 'vice_dean' as const,
        roleLabel: 'معاونت دانشجویی',
        fullName: vd.fullName,
        username: vd.username,
        password: vd.password,
        isInactive: vd.status === 'inactive' || vd.isActive === false,
        user: { role: 'vice_dean' as const, staff: vd },
      })),
      ...Storage.getLibraryStaff().map((lb) => ({
        role: 'library' as const,
        roleLabel: 'کتابخانه و پژوهش',
        fullName: lb.fullName,
        username: lb.username,
        password: lb.password,
        isInactive: lb.status === 'inactive' || lb.isActive === false,
        user: { role: 'library' as const, staff: lb },
      })),
      ...Storage.getSmartCampusStaff().map((sc) => ({
        role: 'smart_campus' as const,
        roleLabel: 'واحد هوشمندسازی',
        fullName: sc.fullName,
        username: sc.username,
        password: sc.password,
        isInactive: sc.status === 'inactive' || sc.isActive === false,
        user: { role: 'smart_campus' as const, staff: sc },
      })),
      ...Storage.getGraduationStaff().map((gr) => ({
        role: 'graduation' as const,
        roleLabel: 'واحد فارغ‌التحصیلان',
        fullName: gr.fullName,
        username: gr.username,
        password: gr.password,
        isInactive: gr.status === 'inactive' || gr.isActive === false,
        user: { role: 'graduation' as const, staff: gr },
      })),
      ...Storage.getAcademicDeputyStaff().map((ad) => ({
        role: 'academic_deputy' as const,
        roleLabel: 'معاونت آموزشی',
        fullName: ad.fullName,
        username: ad.username,
        password: ad.password,
        isInactive: ad.status === 'inactive' || ad.isActive === false,
        user: { role: 'academic_deputy' as const, staff: ad },
      })),
      ...Storage.getSchedProfessors().map((prof) => ({
        role: 'professor' as const,
        roleLabel: 'استاد / عضو هیات علمی',
        fullName: prof.fullName,
        username: prof.professorCode,
        password: prof.password || prof.nationalId,
        isInactive: prof.isActive === false,
        user: { role: 'professor' as const, professor: prof },
      })),
    ];

    const matched = candidates.filter(
      (c) =>
        normalizeDigits(c.username).toLowerCase() === cleanU &&
        Boolean(c.password) &&
        timingSafeEqual(normalizeDigits(c.password), cleanP)
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
    students?: Student[];
    reportScope?: 'student' | 'facility_campus';
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
    reportedByRole:
      | 'supervisor'
      | 'admin'
      | 'vice_dean'
      | 'student_affairs'
      | 'security'
      | 'counselor'
      | 'finance'
      | 'education'
      | 'cultural'
      | 'maintenance'
      | 'library'
      | 'smart_campus'
      | 'graduation'
      | 'academic_deputy';
  }): { success: boolean; message: string; report?: SecurityReport } => {
    const studentList = Array.isArray(payload.students) ? payload.students : [];
    const resolvedScope: 'student' | 'facility_campus' =
      payload.reportScope || (studentList.length > 0 ? 'student' : 'facility_campus');

    if (resolvedScope === 'student' && studentList.length === 0) {
      return {
        success: false,
        message:
          'لطفاً حداقل یک دانشجو انتخاب کنید یا نوع گزارش را روی «مربوط به سراها و محوطه (بدون دانشجو)» قرار دهید.',
      };
    }
    if (
      resolvedScope === 'facility_campus' &&
      !payload.dormId &&
      !payload.dormName?.trim() &&
      !payload.locationDetails?.trim() &&
      !payload.roomNumber?.trim()
    ) {
      return {
        success: false,
        message: 'برای گزارش‌های مربوط به سرا یا محوطه، لطفاً سرای محل وقوع یا جزئیات مکانی را وارد نمایید.',
      };
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

    const snapshots: SecurityReportStudentSnapshot[] =
      resolvedScope === 'facility_campus'
        ? []
        : studentList.map((st) => ({
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
      (firstSnap?.dormName && firstSnap.dormName !== 'فاقد سرا'
        ? firstSnap.dormName
        : resolvedScope === 'facility_campus'
        ? 'محوطه / سراهای دانشجویی'
        : 'سراهای دانشجویی');

    const newReport: SecurityReport = {
      id: makeUniqueId('secrep'),
      reportCode: `SEC-${101 + list.length}`,
      reportScope: resolvedScope,
      title: payload.title.trim(),
      category: payload.category,
      categoryLabel: resolvedCategoryLabel,
      severity: payload.severity,
      dormId: payload.dormId || (resolvedScope === 'student' ? studentList[0]?.assignedDormId : undefined),
      dormName: resolvedDormName,
      roomNumber: payload.roomNumber?.trim() || (firstSnap?.roomNumber && firstSnap.roomNumber !== '-' ? firstSnap.roomNumber : undefined),
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

    const roleFa: Record<
      | 'supervisor'
      | 'admin'
      | 'vice_dean'
      | 'student_affairs'
      | 'security'
      | 'counselor'
      | 'finance'
      | 'education'
      | 'cultural'
      | 'maintenance'
      | 'library'
      | 'smart_campus'
      | 'graduation'
      | 'academic_deputy',
      string
    > = {
      supervisor: 'سرپرست سرا',
      admin: 'مدیر کل سامانه',
      maintenance: 'واحد تأسیسات',
      student_affairs: 'امور دانشجویی',
      vice_dean: 'معاونت دانشجویی',
      security: 'واحد حراست',
      counselor: 'مرکز مشاوره',
      finance: 'امور مالی و حسابداری',
      education: 'امور آموزش',
      cultural: 'امور فرهنگی',
      library: 'کتابخانه و پژوهش',
      smart_campus: 'واحد هوشمندسازی',
      graduation: 'واحد فارغ‌التحصیلان',
      academic_deputy: 'معاونت آموزشی',
    };

    const targetDesc =
      snapshots.length > 0
        ? `برای ${snapshots.length} دانشجو (${snapshots.map((s) => s.fullName).slice(0, 4).join('، ')}${snapshots.length > 4 ? ' و...' : ''})`
        : `مربوط به سرا / محوطه (${resolvedDormName}${newReport.locationDetails ? ` - ${newReport.locationDetails}` : ''})`;

    Storage.addActivityLog({
      category: 'security',
      action: 'ارسال گزارش جدید به واحد حراست و انتظامات',
      details: `گزارش «${newReport.title}» (${newReport.reportCode}) ${targetDesc} توسط ${payload.reportedByName} (${roleFa[payload.reportedByRole]}) به حراست ارسال شد.`,
      targetName: newReport.reportCode,
      severity: payload.severity === 'urgent' ? 'critical' : 'warning',
      actorName: payload.reportedByName,
      actorRole: payload.reportedByRole,
    });

    return {
      success: true,
      message:
        snapshots.length > 0
          ? `گزارش با کد رهگیری «${newReport.reportCode}» برای ${snapshots.length} دانشجو با موفقیت به واحد حراست ارسال گردید.`
          : `گزارش سرایی/محوطه با کد رهگیری «${newReport.reportCode}» با موفقیت به واحد حراست ارسال گردید.`,
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

  // -------------------------------------------------------------
  // متدهای مدیریت کاربران معاونت دانشجویی
  // -------------------------------------------------------------
  getViceDeanStaff: (): ViceDeanStaff[] =>
    get<ViceDeanStaff[]>(STORAGE_KEYS.VICE_DEAN_STAFF, INITIAL_VICE_DEAN_STAFF),

  setViceDeanStaff: (staff: ViceDeanStaff[]): boolean =>
    set(STORAGE_KEYS.VICE_DEAN_STAFF, staff),

  addViceDeanStaff: (
    staffData: Omit<ViceDeanStaff, 'id'>
  ): { success: boolean; message: string; staff?: ViceDeanStaff } => {
    const list = Storage.getViceDeanStaff();
    const cleanUsername = normalizeAsciiDigits(staffData.username).toLowerCase();
    if (!cleanUsername) {
      return { success: false, message: 'نام کاربری معاونت دانشجویی نمی‌تواند خالی باشد.' };
    }
    if (list.some((s) => normalizeAsciiDigits(s.username).toLowerCase() === cleanUsername)) {
      return { success: false, message: 'این نام کاربری قبلاً برای کاربر معاونت دانشجویی دیگری ثبت شده است.' };
    }
    const newStaff: ViceDeanStaff = {
      ...staffData,
      id: makeUniqueId('vd'),
      username: cleanUsername,
      role: 'vice_dean',
      department: staffData.department?.trim() || 'معاونت دانشجویی دانشگاه فرهنگیان',
      title: staffData.title?.trim() || 'معاون دانشجویی',
      status: staffData.status || 'active',
      isActive: staffData.isActive !== false,
    };
    list.push(newStaff);
    Storage.setViceDeanStaff(list);
    Storage.addActivityLog({
      category: 'staff',
      action: 'ثبت کاربر معاونت دانشجویی',
      details: `کاربر معاونت دانشجویی «${newStaff.fullName}» (${newStaff.username}) در سامانه ثبت شد.`,
      targetName: newStaff.fullName,
    });
    return {
      success: true,
      message: `کاربر معاونت دانشجویی «${newStaff.fullName}» با موفقیت افزوده شد.`,
      staff: newStaff,
    };
  },

  updateViceDeanStaff: (
    id: string,
    updates: Partial<ViceDeanStaff>
  ): { success: boolean; message: string } => {
    const list = Storage.getViceDeanStaff();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false, message: 'کاربر معاونت دانشجویی یافت نشد.' };
    const normalizedUpdates = { ...updates };
    if (normalizedUpdates.username !== undefined) {
      const cleanU = normalizeAsciiDigits(normalizedUpdates.username).toLowerCase();
      if (!cleanU) return { success: false, message: 'نام کاربری نمی‌تواند خالی باشد.' };
      if (list.some((s) => s.id !== id && normalizeAsciiDigits(s.username).toLowerCase() === cleanU)) {
        return { success: false, message: 'این نام کاربری قبلاً برای کاربر معاونت دانشجویی دیگری ثبت شده است.' };
      }
      normalizedUpdates.username = cleanU;
    }
    list[idx] = { ...list[idx], ...normalizedUpdates };
    Storage.setViceDeanStaff(list);
    const cu = Storage.getCurrentUser();
    if (cu && cu.role === 'vice_dean' && cu.staff.id === id) {
      Storage.setCurrentUser({ role: 'vice_dean', staff: list[idx] });
    }
    return { success: true, message: 'اطلاعات کاربر معاونت دانشجویی با موفقیت بروزرسانی شد.' };
  },

  deleteViceDeanStaff: (id: string): { success: boolean; message: string } => {
    const list = Storage.getViceDeanStaff();
    const target = list.find((s) => s.id === id);
    Storage.setViceDeanStaff(list.filter((s) => s.id !== id));
    if (target) {
      Storage.addActivityLog({
        category: 'staff',
        action: 'حذف کاربر معاونت دانشجویی',
        details: `حساب کاربری معاونت دانشجویی «${target.fullName}» حذف گردید.`,
        targetName: target.fullName,
        severity: 'warning',
      });
    }
    return { success: true, message: 'کاربر معاونت دانشجویی با موفقیت حذف گردید.' };
  },

  // -------------------------------------------------------------
  // متدهای مدیریت کاربران کتابخانه و پژوهش، کتب و امانات
  // -------------------------------------------------------------
  getLibraryStaff: (): LibraryStaff[] =>
    get<LibraryStaff[]>(STORAGE_KEYS.LIBRARY_STAFF, INITIAL_LIBRARY_STAFF),

  setLibraryStaff: (staff: LibraryStaff[]): boolean =>
    set(STORAGE_KEYS.LIBRARY_STAFF, staff),

  addLibraryStaff: (
    staffData: Omit<LibraryStaff, 'id'>
  ): { success: boolean; message: string; staff?: LibraryStaff } => {
    const list = Storage.getLibraryStaff();
    const cleanUsername = normalizeAsciiDigits(staffData.username).toLowerCase();
    if (!cleanUsername) {
      return { success: false, message: 'نام کاربری مسئول کتابخانه نمی‌تواند خالی باشد.' };
    }
    if (list.some((s) => normalizeAsciiDigits(s.username).toLowerCase() === cleanUsername)) {
      return { success: false, message: 'این نام کاربری قبلاً برای کاربر کتابخانه دیگری ثبت شده است.' };
    }
    const newStaff: LibraryStaff = {
      ...staffData,
      id: makeUniqueId('lib'),
      username: cleanUsername,
      role: 'library',
      department: staffData.department?.trim() || 'واحد کتابخانه و پژوهش',
      status: staffData.status || 'active',
      isActive: staffData.isActive !== false,
    };
    list.push(newStaff);
    Storage.setLibraryStaff(list);
    Storage.addActivityLog({
      category: 'staff',
      action: 'ثبت کاربر کتابخانه و پژوهش',
      details: `کاربر کتابخانه «${newStaff.fullName}» (${newStaff.username}) در سامانه ثبت شد.`,
      targetName: newStaff.fullName,
    });
    return {
      success: true,
      message: `کاربر کتابخانه «${newStaff.fullName}» با موفقیت افزوده شد.`,
      staff: newStaff,
    };
  },

  updateLibraryStaff: (
    id: string,
    updates: Partial<LibraryStaff>
  ): { success: boolean; message: string } => {
    const list = Storage.getLibraryStaff();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false, message: 'کاربر کتابخانه یافت نشد.' };
    const normalizedUpdates = { ...updates };
    if (normalizedUpdates.username !== undefined) {
      const cleanU = normalizeAsciiDigits(normalizedUpdates.username).toLowerCase();
      if (!cleanU) return { success: false, message: 'نام کاربری نمی‌تواند خالی باشد.' };
      if (list.some((s) => s.id !== id && normalizeAsciiDigits(s.username).toLowerCase() === cleanU)) {
        return { success: false, message: 'این نام کاربری قبلاً برای کاربر کتابخانه دیگری ثبت شده است.' };
      }
      normalizedUpdates.username = cleanU;
    }
    list[idx] = { ...list[idx], ...normalizedUpdates };
    Storage.setLibraryStaff(list);
    const cu = Storage.getCurrentUser();
    if (cu && cu.role === 'library' && cu.staff.id === id) {
      Storage.setCurrentUser({ role: 'library', staff: list[idx] });
    }
    return { success: true, message: 'اطلاعات کاربر کتابخانه با موفقیت بروزرسانی شد.' };
  },

  deleteLibraryStaff: (id: string): { success: boolean; message: string } => {
    const list = Storage.getLibraryStaff();
    const target = list.find((s) => s.id === id);
    Storage.setLibraryStaff(list.filter((s) => s.id !== id));
    if (target) {
      Storage.addActivityLog({
        category: 'staff',
        action: 'حذف کاربر کتابخانه و پژوهش',
        details: `حساب کاربری کتابخانه «${target.fullName}» حذف گردید.`,
        targetName: target.fullName,
        severity: 'warning',
      });
    }
    return { success: true, message: 'کاربر کتابخانه با موفقیت حذف گردید.' };
  },

  // کتب موجود کتابخانه
  getLibraryBooks: (): LibraryBook[] =>
    get<LibraryBook[]>(STORAGE_KEYS.LIBRARY_BOOKS, INITIAL_LIBRARY_BOOKS),

  setLibraryBooks: (books: LibraryBook[]): boolean =>
    set(STORAGE_KEYS.LIBRARY_BOOKS, books),

  addLibraryBook: (
    bookData: Omit<LibraryBook, 'id' | 'createdAt' | 'code'> & { code?: string }
  ): { success: boolean; message: string; book?: LibraryBook } => {
    if (!bookData.title.trim()) {
      return { success: false, message: 'عنوان کتاب الزامی است.' };
    }
    const list = Storage.getLibraryBooks();
    const total = Math.max(1, Math.floor(Number(bookData.totalCopies) || 1));
    const avail = Math.min(total, Math.max(0, Math.floor(Number(bookData.availableCopies ?? total))));
    const nowStr = new Date().toLocaleDateString('fa-IR');
    const newBook: LibraryBook = {
      id: makeUniqueId('book'),
      code: (bookData.code || '').trim() || `BK-${101 + list.length}`,
      title: bookData.title.trim(),
      author: (bookData.author || '').trim() || 'نامشخص',
      isbn: (bookData.isbn || '').trim() || undefined,
      category: (bookData.category || '').trim() || 'عمومی',
      publisher: (bookData.publisher || '').trim() || undefined,
      publishYear: (bookData.publishYear || '').trim() || undefined,
      totalCopies: total,
      availableCopies: avail,
      shelfLocation: (bookData.shelfLocation || '').trim() || undefined,
      notes: (bookData.notes || '').trim() || undefined,
      createdAt: nowStr,
    };
    list.unshift(newBook);
    Storage.setLibraryBooks(list);
    Storage.addActivityLog({
      category: 'library',
      action: 'ثبت کتاب جدید در کتابخانه',
      details: `کتاب «${newBook.title}» (${newBook.code}) با ${newBook.totalCopies} نسخه در فهرست کتابخانه ثبت شد.`,
      targetName: newBook.title,
    });
    return { success: true, message: `کتاب «${newBook.title}» با موفقیت ثبت شد.`, book: newBook };
  },

  updateLibraryBook: (
    id: string,
    updates: Partial<LibraryBook>
  ): { success: boolean; message: string } => {
    const list = Storage.getLibraryBooks();
    const idx = list.findIndex((b) => b.id === id);
    if (idx === -1) return { success: false, message: 'کتاب مورد نظر یافت نشد.' };
    const nextTotal =
      updates.totalCopies !== undefined
        ? Math.max(1, Math.floor(Number(updates.totalCopies) || 1))
        : list[idx].totalCopies;
    const nextAvail =
      updates.availableCopies !== undefined
        ? Math.min(nextTotal, Math.max(0, Math.floor(Number(updates.availableCopies) || 0)))
        : Math.min(nextTotal, list[idx].availableCopies);
    list[idx] = {
      ...list[idx],
      ...updates,
      totalCopies: nextTotal,
      availableCopies: nextAvail,
      updatedAt: new Date().toLocaleDateString('fa-IR'),
    };
    Storage.setLibraryBooks(list);
    return { success: true, message: 'اطلاعات کتاب با موفقیت بروزرسانی شد.' };
  },

  deleteLibraryBook: (id: string): { success: boolean; message: string } => {
    const list = Storage.getLibraryBooks();
    const target = list.find((b) => b.id === id);
    Storage.setLibraryBooks(list.filter((b) => b.id !== id));
    if (target) {
      Storage.addActivityLog({
        category: 'library',
        action: 'حذف کتاب از فهرست کتابخانه',
        details: `کتاب «${target.title}» (${target.code}) از فهرست حذف شد.`,
        targetName: target.title,
        severity: 'warning',
      });
    }
    return { success: true, message: 'کتاب با موفقیت حذف شد.' };
  },

  bulkImportLibraryBooks: (
    rows: Array<{
      code?: string;
      title: string;
      author?: string;
      isbn?: string;
      category?: string;
      publisher?: string;
      publishYear?: string;
      totalCopies?: number;
      shelfLocation?: string;
      notes?: string;
    }>
  ): { success: boolean; addedCount: number; updatedCount: number; message: string } => {
    const list = Storage.getLibraryBooks();
    const nowStr = new Date().toLocaleDateString('fa-IR');
    let addedCount = 0;
    let updatedCount = 0;

    for (const row of rows) {
      const title = String(row.title || '').trim();
      if (!title) continue;
      const code = String(row.code || '').trim();
      const isbn = String(row.isbn || '').trim();
      const totalCopies = Math.max(1, Math.floor(Number(row.totalCopies) || 1));

      const existingIdx = list.findIndex(
        (b) =>
          (code && normalizeLookupKey(b.code) === normalizeLookupKey(code)) ||
          (isbn && b.isbn && normalizeLookupKey(b.isbn) === normalizeLookupKey(isbn)) ||
          (normalizePersianSearch(b.title) === normalizePersianSearch(title) &&
            normalizePersianSearch(b.author) === normalizePersianSearch(String(row.author || 'نامشخص')))
      );

      if (existingIdx !== -1) {
        const cur = list[existingIdx];
        const borrowedCount = Math.max(0, cur.totalCopies - cur.availableCopies);
        const nextTotal = Math.max(borrowedCount, totalCopies);
        list[existingIdx] = {
          ...cur,
          author: String(row.author || '').trim() || cur.author,
          isbn: isbn || cur.isbn,
          category: String(row.category || '').trim() || cur.category,
          publisher: String(row.publisher || '').trim() || cur.publisher,
          publishYear: String(row.publishYear || '').trim() || cur.publishYear,
          shelfLocation: String(row.shelfLocation || '').trim() || cur.shelfLocation,
          notes: String(row.notes || '').trim() || cur.notes,
          totalCopies: nextTotal,
          availableCopies: Math.max(0, nextTotal - borrowedCount),
          updatedAt: nowStr,
        };
        updatedCount++;
      } else {
        list.unshift({
          id: makeUniqueId('book'),
          code: code || `BK-${101 + list.length}`,
          title,
          author: String(row.author || '').trim() || 'نامشخص',
          isbn: isbn || undefined,
          category: String(row.category || '').trim() || 'عمومی',
          publisher: String(row.publisher || '').trim() || undefined,
          publishYear: String(row.publishYear || '').trim() || undefined,
          totalCopies,
          availableCopies: totalCopies,
          shelfLocation: String(row.shelfLocation || '').trim() || undefined,
          notes: String(row.notes || '').trim() || undefined,
          createdAt: nowStr,
        });
        addedCount++;
      }
    }

    Storage.setLibraryBooks(list);
    if (addedCount > 0 || updatedCount > 0) {
      Storage.addActivityLog({
        category: 'library',
        action: 'ورود اکسل فهرست کتب کتابخانه',
        details: `${addedCount} کتاب جدید افزوده شد و ${updatedCount} کتاب بروزرسانی گردید.`,
        targetName: `${addedCount + updatedCount} عنوان کتاب`,
      });
    }
    return {
      success: true,
      addedCount,
      updatedCount,
      message: `${addedCount} کتاب جدید ثبت و ${updatedCount} کتاب بروزرسانی شد.`,
    };
  },

  // درخواست‌ها و امانات کتابخانه
  getLibraryBookRequests: (): LibraryBookRequest[] =>
    get<LibraryBookRequest[]>(STORAGE_KEYS.LIBRARY_BOOK_REQUESTS, INITIAL_LIBRARY_BOOK_REQUESTS),

  setLibraryBookRequests: (items: LibraryBookRequest[]): boolean =>
    set(STORAGE_KEYS.LIBRARY_BOOK_REQUESTS, items),

  createLibraryBookRequest: (payload: {
    bookId: string;
    student: Pick<Student, 'studentId' | 'fullName' | 'fieldOfStudy' | 'entryTerm' | 'mobile' | 'phone'>;
    requestNote?: string;
  }): { success: boolean; message: string; request?: LibraryBookRequest } => {
    const books = Storage.getLibraryBooks();
    const book = books.find((b) => b.id === payload.bookId);
    if (!book) return { success: false, message: 'کتاب انتخاب‌شده یافت نشد.' };
    if (book.availableCopies <= 0) {
      return { success: false, message: 'در حال حاضر نسخه آزادی از این کتاب موجود نیست.' };
    }
    const reqs = Storage.getLibraryBookRequests();
    const alreadyOpen = reqs.find(
      (r) =>
        r.studentId === payload.student.studentId &&
        r.bookId === book.id &&
        (r.status === 'pending' || r.status === 'approved')
    );
    if (alreadyOpen) {
      return {
        success: false,
        message: 'شما هم‌اکنون درخواست فعال یا امانت جاری برای این کتاب دارید.',
      };
    }

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const newReq: LibraryBookRequest = {
      id: makeUniqueId('libreq'),
      requestCode: `LIB-${101 + reqs.length}`,
      bookId: book.id,
      bookCode: book.code,
      bookTitle: book.title,
      bookAuthor: book.author,
      studentId: payload.student.studentId,
      studentName: payload.student.fullName,
      studentFieldOfStudy: payload.student.fieldOfStudy,
      studentEntryTerm: payload.student.entryTerm,
      studentPhone: payload.student.mobile || payload.student.phone || '',
      requestedAt: nowStr,
      status: 'pending',
      requestNote: (payload.requestNote || '').trim() || undefined,
    };
    reqs.unshift(newReq);
    Storage.setLibraryBookRequests(reqs);
    Storage.addActivityLog({
      category: 'library',
      action: 'ثبت درخواست امانت کتاب',
      details: `دانشجو ${payload.student.fullName} درخواست امانت کتاب «${book.title}» (${newReq.requestCode}) را ثبت کرد.`,
      targetName: newReq.requestCode,
    });
    return {
      success: true,
      message: `درخواست امانت کتاب «${book.title}» با کد ${newReq.requestCode} ثبت شد و به مسئول کتابخانه ارسال گردید.`,
      request: newReq,
    };
  },

  approveLibraryBookRequest: (
    requestId: string,
    options: { librarianId: string; librarianName: string; dueDate?: string; librarianNote?: string }
  ): { success: boolean; message: string } => {
    const reqs = Storage.getLibraryBookRequests();
    const idx = reqs.findIndex((r) => r.id === requestId);
    if (idx === -1) return { success: false, message: 'درخواست مورد نظر یافت نشد.' };
    if (reqs[idx].status !== 'pending') {
      return { success: false, message: 'این درخواست قبلاً تعیین تکلیف شده است.' };
    }
    const books = Storage.getLibraryBooks();
    const bIdx = books.findIndex((b) => b.id === reqs[idx].bookId);
    if (bIdx !== -1) {
      if (books[bIdx].availableCopies <= 0) {
        return { success: false, message: 'موجودی آزاد این کتاب به اتمام رسیده است.' };
      }
      books[bIdx] = { ...books[bIdx], availableCopies: Math.max(0, books[bIdx].availableCopies - 1) };
      Storage.setLibraryBooks(books);
    }

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const defaultDue = new Date(Date.now() + 14 * 24 * 3600 * 1000).toLocaleDateString('fa-IR');

    reqs[idx] = {
      ...reqs[idx],
      status: 'approved',
      approvedAt: nowStr,
      dueDate: (options.dueDate || '').trim() || defaultDue,
      librarianId: options.librarianId,
      librarianName: options.librarianName,
      librarianNote: (options.librarianNote || '').trim() || undefined,
    };
    Storage.setLibraryBookRequests(reqs);

    Storage.addMessage({
      senderId: options.librarianId,
      senderName: `${options.librarianName} (کتابخانه و پژوهش)`,
      senderRole: 'library',
      receiverType: 'student',
      receiverId: reqs[idx].studentId,
      receiverName: reqs[idx].studentName,
      targetScope: 'single',
      category: 'library',
      subject: `تایید درخواست امانت کتاب: ${reqs[idx].bookTitle}`,
      content: `درخواست امانت کتاب «${reqs[idx].bookTitle}» (${reqs[idx].requestCode}) تایید شد.\nموعد بازگشت: ${reqs[idx].dueDate}${options.librarianNote ? `\nتوضیحات کتابخانه: ${options.librarianNote}` : ''}`,
      date: nowStr,
    });

    return { success: true, message: `امانت کتاب «${reqs[idx].bookTitle}» تایید شد.` };
  },

  rejectLibraryBookRequest: (
    requestId: string,
    options: { librarianId: string; librarianName: string; rejectionReason: string }
  ): { success: boolean; message: string } => {
    const reqs = Storage.getLibraryBookRequests();
    const idx = reqs.findIndex((r) => r.id === requestId);
    if (idx === -1) return { success: false, message: 'درخواست مورد نظر یافت نشد.' };
    const reason = options.rejectionReason.trim() || 'عدم امکان تحویل در زمان فعلی';
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    reqs[idx] = {
      ...reqs[idx],
      status: 'rejected',
      librarianId: options.librarianId,
      librarianName: options.librarianName,
      rejectionReason: reason,
    };
    Storage.setLibraryBookRequests(reqs);

    Storage.addMessage({
      senderId: options.librarianId,
      senderName: `${options.librarianName} (کتابخانه و پژوهش)`,
      senderRole: 'library',
      receiverType: 'student',
      receiverId: reqs[idx].studentId,
      receiverName: reqs[idx].studentName,
      targetScope: 'single',
      category: 'library',
      subject: `نتیجه درخواست کتاب: ${reqs[idx].bookTitle}`,
      content: `درخواست کتاب «${reqs[idx].bookTitle}» (${reqs[idx].requestCode}) تایید نشد.\nتوضیحات مسئول کتابخانه: ${reason}`,
      date: nowStr,
    });

    return { success: true, message: 'درخواست رد شد و به دانشجو اطلاع‌رسانی گردید.' };
  },

  returnLibraryBook: (
    requestId: string,
    options: { librarianName: string; librarianNote?: string }
  ): { success: boolean; message: string } => {
    const reqs = Storage.getLibraryBookRequests();
    const idx = reqs.findIndex((r) => r.id === requestId);
    if (idx === -1) return { success: false, message: 'سابقه امانت یافت نشد.' };
    if (reqs[idx].status !== 'approved') {
      return { success: false, message: 'این کتاب در وضعیت امانت جاری نیست.' };
    }
    const books = Storage.getLibraryBooks();
    const bIdx = books.findIndex((b) => b.id === reqs[idx].bookId);
    if (bIdx !== -1) {
      books[bIdx] = {
        ...books[bIdx],
        availableCopies: Math.min(books[bIdx].totalCopies, books[bIdx].availableCopies + 1),
      };
      Storage.setLibraryBooks(books);
    }
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    reqs[idx] = {
      ...reqs[idx],
      status: 'returned',
      returnedAt: nowStr,
      librarianNote: (options.librarianNote || '').trim() || reqs[idx].librarianNote,
    };
    Storage.setLibraryBookRequests(reqs);
    Storage.addActivityLog({
      category: 'library',
      action: 'ثبت عودت کتاب امانی',
      details: `کتاب «${reqs[idx].bookTitle}» توسط دانشجو ${reqs[idx].studentName} به کتابخانه بازگردانده شد (${options.librarianName}).`,
      targetName: reqs[idx].requestCode,
    });
    return { success: true, message: `عودت کتاب «${reqs[idx].bookTitle}» با موفقیت ثبت شد.` };
  },

  createDirectLibraryLoan: (payload: {
    bookId: string;
    student: Pick<Student, 'studentId' | 'fullName' | 'fieldOfStudy' | 'entryTerm' | 'mobile' | 'phone'>;
    dueDate?: string;
    librarianId: string;
    librarianName: string;
    librarianNote?: string;
  }): { success: boolean; message: string; request?: LibraryBookRequest } => {
    const books = Storage.getLibraryBooks();
    const bIdx = books.findIndex((b) => b.id === payload.bookId);
    if (bIdx === -1) return { success: false, message: 'کتاب انتخاب‌شده یافت نشد.' };
    if (books[bIdx].availableCopies <= 0) {
      return { success: false, message: 'نسخه آزادی از این کتاب موجود نیست.' };
    }
    books[bIdx] = { ...books[bIdx], availableCopies: Math.max(0, books[bIdx].availableCopies - 1) };
    Storage.setLibraryBooks(books);

    const reqs = Storage.getLibraryBookRequests();
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const defaultDue = new Date(Date.now() + 14 * 24 * 3600 * 1000).toLocaleDateString('fa-IR');

    const newReq: LibraryBookRequest = {
      id: makeUniqueId('libreq'),
      requestCode: `LIB-${101 + reqs.length}`,
      bookId: books[bIdx].id,
      bookCode: books[bIdx].code,
      bookTitle: books[bIdx].title,
      bookAuthor: books[bIdx].author,
      studentId: payload.student.studentId,
      studentName: payload.student.fullName,
      studentFieldOfStudy: payload.student.fieldOfStudy,
      studentEntryTerm: payload.student.entryTerm,
      studentPhone: payload.student.mobile || payload.student.phone || '',
      requestedAt: nowStr,
      approvedAt: nowStr,
      dueDate: (payload.dueDate || '').trim() || defaultDue,
      status: 'approved',
      librarianId: payload.librarianId,
      librarianName: payload.librarianName,
      librarianNote: (payload.librarianNote || '').trim() || undefined,
    };
    reqs.unshift(newReq);
    Storage.setLibraryBookRequests(reqs);

    Storage.addActivityLog({
      category: 'library',
      action: 'ثبت مستقیم امانت کتاب',
      details: `کتاب «${books[bIdx].title}» به نام دانشجو ${payload.student.fullName} (${payload.student.studentId}) ثبت امانت شد.`,
      targetName: newReq.requestCode,
    });

    return {
      success: true,
      message: `امانت کتاب «${books[bIdx].title}» برای «${payload.student.fullName}» ثبت شد.`,
      request: newReq,
    };
  },

  // -------------------------------------------------------------
  // متدهای مدیریت کاربران واحد هوشمندسازی
  // -------------------------------------------------------------
  getSmartCampusStaff: (): SmartCampusStaff[] =>
    get<SmartCampusStaff[]>(STORAGE_KEYS.SMART_CAMPUS_STAFF, INITIAL_SMART_CAMPUS_STAFF),

  setSmartCampusStaff: (staff: SmartCampusStaff[]): boolean =>
    set(STORAGE_KEYS.SMART_CAMPUS_STAFF, staff),

  addSmartCampusStaff: (
    staffData: Omit<SmartCampusStaff, 'id'>
  ): { success: boolean; message: string; staff?: SmartCampusStaff } => {
    const list = Storage.getSmartCampusStaff();
    const cleanUsername = normalizeAsciiDigits(staffData.username).toLowerCase();
    if (!cleanUsername) {
      return { success: false, message: 'نام کاربری واحد هوشمندسازی نمی‌تواند خالی باشد.' };
    }
    if (list.some((s) => normalizeAsciiDigits(s.username).toLowerCase() === cleanUsername)) {
      return { success: false, message: 'این نام کاربری قبلاً برای کاربر هوشمندسازی دیگری ثبت شده است.' };
    }
    const newStaff: SmartCampusStaff = {
      ...staffData,
      id: makeUniqueId('smart'),
      username: cleanUsername,
      role: 'smart_campus',
      department: staffData.department?.trim() || 'واحد هوشمندسازی و فناوری اطلاعات',
      status: staffData.status || 'active',
      isActive: staffData.isActive !== false,
    };
    list.push(newStaff);
    Storage.setSmartCampusStaff(list);
    Storage.addActivityLog({
      category: 'staff',
      action: 'ثبت کاربر واحد هوشمندسازی',
      details: `کاربر واحد هوشمندسازی «${newStaff.fullName}» (${newStaff.username}) در سامانه ثبت شد.`,
      targetName: newStaff.fullName,
    });
    return {
      success: true,
      message: `کاربر واحد هوشمندسازی «${newStaff.fullName}» با موفقیت افزوده شد.`,
      staff: newStaff,
    };
  },

  updateSmartCampusStaff: (
    id: string,
    updates: Partial<SmartCampusStaff>
  ): { success: boolean; message: string } => {
    const list = Storage.getSmartCampusStaff();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false, message: 'کاربر واحد هوشمندسازی یافت نشد.' };
    const normalizedUpdates = { ...updates };
    if (normalizedUpdates.username !== undefined) {
      const cleanU = normalizeAsciiDigits(normalizedUpdates.username).toLowerCase();
      if (!cleanU) return { success: false, message: 'نام کاربری نمی‌تواند خالی باشد.' };
      if (list.some((s) => s.id !== id && normalizeAsciiDigits(s.username).toLowerCase() === cleanU)) {
        return { success: false, message: 'این نام کاربری قبلاً برای کاربر هوشمندسازی دیگری ثبت شده است.' };
      }
      normalizedUpdates.username = cleanU;
    }
    list[idx] = { ...list[idx], ...normalizedUpdates };
    Storage.setSmartCampusStaff(list);
    const cu = Storage.getCurrentUser();
    if (cu && cu.role === 'smart_campus' && cu.staff.id === id) {
      Storage.setCurrentUser({ role: 'smart_campus', staff: list[idx] });
    }
    return { success: true, message: 'اطلاعات کاربر واحد هوشمندسازی با موفقیت بروزرسانی شد.' };
  },

  deleteSmartCampusStaff: (id: string): { success: boolean; message: string } => {
    const list = Storage.getSmartCampusStaff();
    const target = list.find((s) => s.id === id);
    Storage.setSmartCampusStaff(list.filter((s) => s.id !== id));
    if (target) {
      Storage.addActivityLog({
        category: 'staff',
        action: 'حذف کاربر واحد هوشمندسازی',
        details: `حساب کاربری واحد هوشمندسازی «${target.fullName}» حذف گردید.`,
        targetName: target.fullName,
        severity: 'warning',
      });
    }
    return { success: true, message: 'کاربر واحد هوشمندسازی با موفقیت حذف گردید.' };
  },

  // -------------------------------------------------------------
  // متدهای مدیریت کاربران واحد فارغ‌التحصیلان
  // -------------------------------------------------------------
  getGraduationStaff: (): GraduationStaff[] =>
    get<GraduationStaff[]>(STORAGE_KEYS.GRADUATION_STAFF, INITIAL_GRADUATION_STAFF),

  setGraduationStaff: (staff: GraduationStaff[]): boolean =>
    set(STORAGE_KEYS.GRADUATION_STAFF, staff),

  addGraduationStaff: (
    staffData: Omit<GraduationStaff, 'id'>
  ): { success: boolean; message: string; staff?: GraduationStaff } => {
    const list = Storage.getGraduationStaff();
    const cleanUsername = normalizeAsciiDigits(staffData.username).toLowerCase();
    if (!cleanUsername) {
      return { success: false, message: 'نام کاربری واحد فارغ‌التحصیلان نمی‌تواند خالی باشد.' };
    }
    if (list.some((s) => normalizeAsciiDigits(s.username).toLowerCase() === cleanUsername)) {
      return { success: false, message: 'این نام کاربری قبلاً برای کاربر فارغ‌التحصیلان دیگری ثبت شده است.' };
    }
    const newStaff: GraduationStaff = {
      ...staffData,
      id: makeUniqueId('grad'),
      username: cleanUsername,
      role: 'graduation',
      department: staffData.department?.trim() || 'اداره امور فارغ‌التحصیلان',
      status: staffData.status || 'active',
      isActive: staffData.isActive !== false,
    };
    list.push(newStaff);
    Storage.setGraduationStaff(list);
    Storage.addActivityLog({
      category: 'staff',
      action: 'ثبت کارشناس واحد فارغ‌التحصیلان',
      details: `کارشناس واحد فارغ‌التحصیلان «${newStaff.fullName}» (${newStaff.username}) در سامانه ثبت شد.`,
      targetName: newStaff.fullName,
    });
    return {
      success: true,
      message: `کارشناس واحد فارغ‌التحصیلان «${newStaff.fullName}» با موفقیت افزوده شد.`,
      staff: newStaff,
    };
  },

  updateGraduationStaff: (
    id: string,
    updates: Partial<GraduationStaff>
  ): { success: boolean; message: string } => {
    const list = Storage.getGraduationStaff();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false, message: 'کاربر واحد فارغ‌التحصیلان یافت نشد.' };
    const normalizedUpdates = { ...updates };
    if (normalizedUpdates.username !== undefined) {
      const cleanU = normalizeAsciiDigits(normalizedUpdates.username).toLowerCase();
      if (!cleanU) return { success: false, message: 'نام کاربری نمی‌تواند خالی باشد.' };
      if (list.some((s) => s.id !== id && normalizeAsciiDigits(s.username).toLowerCase() === cleanU)) {
        return { success: false, message: 'این نام کاربری قبلاً برای کاربر فارغ‌التحصیلان دیگری ثبت شده است.' };
      }
      normalizedUpdates.username = cleanU;
    }
    list[idx] = { ...list[idx], ...normalizedUpdates };
    Storage.setGraduationStaff(list);
    const cu = Storage.getCurrentUser();
    if (cu && cu.role === 'graduation' && cu.staff.id === id) {
      Storage.setCurrentUser({ role: 'graduation', staff: list[idx] });
    }
    return { success: true, message: 'اطلاعات کارشناس واحد فارغ‌التحصیلان با موفقیت بروزرسانی شد.' };
  },

  deleteGraduationStaff: (id: string): { success: boolean; message: string } => {
    const list = Storage.getGraduationStaff();
    const target = list.find((s) => s.id === id);
    Storage.setGraduationStaff(list.filter((s) => s.id !== id));
    if (target) {
      Storage.addActivityLog({
        category: 'staff',
        action: 'حذف کارشناس واحد فارغ‌التحصیلان',
        details: `حساب کاربری واحد فارغ‌التحصیلان «${target.fullName}» حذف گردید.`,
        targetName: target.fullName,
        severity: 'warning',
      });
    }
    return { success: true, message: 'کارشناس واحد فارغ‌التحصیلان با موفقیت حذف گردید.' };
  },

  // -------------------------------------------------------------
  // متدهای مدیریت کاربران معاونت آموزشی (نقش اختصاصی academic_deputy)
  // -------------------------------------------------------------
  getAcademicDeputyStaff: (): AcademicDeputyStaff[] =>
    get<AcademicDeputyStaff[]>(STORAGE_KEYS.ACADEMIC_DEPUTY_STAFF, INITIAL_ACADEMIC_DEPUTY_STAFF),

  setAcademicDeputyStaff: (staff: AcademicDeputyStaff[]): boolean =>
    set(STORAGE_KEYS.ACADEMIC_DEPUTY_STAFF, staff),

  addAcademicDeputyStaff: (
    staffData: Omit<AcademicDeputyStaff, 'id'>
  ): { success: boolean; message: string; staff?: AcademicDeputyStaff } => {
    const list = Storage.getAcademicDeputyStaff();
    const cleanUsername = normalizeAsciiDigits(staffData.username).toLowerCase();
    if (!cleanUsername) {
      return { success: false, message: 'نام کاربری معاونت آموزشی نمی‌تواند خالی باشد.' };
    }
    if (list.some((s) => normalizeAsciiDigits(s.username).toLowerCase() === cleanUsername)) {
      return { success: false, message: 'این نام کاربری قبلاً برای کاربر معاونت آموزشی دیگری ثبت شده است.' };
    }
    const newStaff: AcademicDeputyStaff = {
      ...staffData,
      id: makeUniqueId('acdep'),
      username: cleanUsername,
      role: 'academic_deputy',
      department: staffData.department?.trim() || 'معاونت آموزشی پردیس',
      status: staffData.status || 'active',
      isActive: staffData.isActive !== false,
    };
    list.push(newStaff);
    Storage.setAcademicDeputyStaff(list);
    Storage.addActivityLog({
      category: 'staff',
      action: 'ثبت کاربر معاونت آموزشی',
      details: `کاربر معاونت آموزشی «${newStaff.fullName}» (${newStaff.username}) در سامانه ثبت شد.`,
      targetName: newStaff.fullName,
    });
    return {
      success: true,
      message: `کاربر معاونت آموزشی «${newStaff.fullName}» با موفقیت افزوده شد.`,
      staff: newStaff,
    };
  },

  updateAcademicDeputyStaff: (
    id: string,
    updates: Partial<AcademicDeputyStaff>
  ): { success: boolean; message: string } => {
    const list = Storage.getAcademicDeputyStaff();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false, message: 'کاربر معاونت آموزشی یافت نشد.' };
    const normalizedUpdates = { ...updates };
    if (normalizedUpdates.username !== undefined) {
      const cleanU = normalizeAsciiDigits(normalizedUpdates.username).toLowerCase();
      if (!cleanU) return { success: false, message: 'نام کاربری نمی‌تواند خالی باشد.' };
      if (list.some((s) => s.id !== id && normalizeAsciiDigits(s.username).toLowerCase() === cleanU)) {
        return { success: false, message: 'این نام کاربری قبلاً برای کاربر معاونت آموزشی دیگری ثبت شده است.' };
      }
      normalizedUpdates.username = cleanU;
    }
    list[idx] = { ...list[idx], ...normalizedUpdates };
    Storage.setAcademicDeputyStaff(list);
    const cu = Storage.getCurrentUser();
    if (cu && cu.role === 'academic_deputy' && cu.staff.id === id) {
      Storage.setCurrentUser({ role: 'academic_deputy', staff: list[idx] });
    }
    return { success: true, message: 'اطلاعات کاربر معاونت آموزشی با موفقیت بروزرسانی شد.' };
  },

  deleteAcademicDeputyStaff: (id: string): { success: boolean; message: string } => {
    const list = Storage.getAcademicDeputyStaff();
    const target = list.find((s) => s.id === id);
    Storage.setAcademicDeputyStaff(list.filter((s) => s.id !== id));
    if (target) {
      Storage.addActivityLog({
        category: 'staff',
        action: 'حذف کاربر معاونت آموزشی',
        details: `حساب کاربری معاونت آموزشی «${target.fullName}» حذف گردید.`,
        targetName: target.fullName,
        severity: 'warning',
      });
    }
    return { success: true, message: 'کاربر معاونت آموزشی با موفقیت حذف گردید.' };
  },

  // -------------------------------------------------------------
  // متدهای مدیریت داده‌های سامانه برنامه‌ریزی درسی
  // -------------------------------------------------------------
  getSchedClassrooms: (): SchedClassroom[] =>
    get<SchedClassroom[]>(STORAGE_KEYS.SCHED_CLASSROOMS, INITIAL_SCHED_CLASSROOMS),
  setSchedClassrooms: (items: SchedClassroom[]): boolean =>
    set(STORAGE_KEYS.SCHED_CLASSROOMS, items),

  getSchedPrograms: (): SchedProgramCohort[] =>
    get<SchedProgramCohort[]>(STORAGE_KEYS.SCHED_PROGRAMS, INITIAL_SCHED_PROGRAMS),
  setSchedPrograms: (items: SchedProgramCohort[]): boolean =>
    set(STORAGE_KEYS.SCHED_PROGRAMS, items),

  getSchedProfessors: (): SchedProfessor[] =>
    get<SchedProfessor[]>(STORAGE_KEYS.SCHED_PROFESSORS, INITIAL_SCHED_PROFESSORS),
  setSchedProfessors: (items: SchedProfessor[]): boolean =>
    set(STORAGE_KEYS.SCHED_PROFESSORS, items),

  getSchedCourses: (): SchedCurriculumCourse[] =>
    get<SchedCurriculumCourse[]>(STORAGE_KEYS.SCHED_COURSES, INITIAL_SCHED_COURSES),
  setSchedCourses: (items: SchedCurriculumCourse[]): boolean =>
    set(STORAGE_KEYS.SCHED_COURSES, items),

  getSchedOfferings: (): SchedCourseOffering[] =>
    get<SchedCourseOffering[]>(STORAGE_KEYS.SCHED_OFFERINGS, INITIAL_SCHED_OFFERINGS),
  setSchedOfferings: (items: SchedCourseOffering[]): boolean =>
    set(STORAGE_KEYS.SCHED_OFFERINGS, items),

  getSchedCellComments: (): SchedCellComment[] =>
    get<SchedCellComment[]>(STORAGE_KEYS.SCHED_CELL_COMMENTS, INITIAL_SCHED_CELL_COMMENTS),
  setSchedCellComments: (items: SchedCellComment[]): boolean =>
    set(STORAGE_KEYS.SCHED_CELL_COMMENTS, items),

  getSchedRules: (): SchedRulesSettings => {
    const stored = get<Partial<SchedRulesSettings> | null>(STORAGE_KEYS.SCHED_RULES, null);
    if (!stored || typeof stored !== 'object') return DEFAULT_SCHED_RULES;
    return {
      activeTerm: stored.activeTerm || DEFAULT_SCHED_RULES.activeTerm,
      availableTerms:
        Array.isArray(stored.availableTerms) && stored.availableTerms.length > 0
          ? stored.availableTerms
          : DEFAULT_SCHED_RULES.availableTerms,
      hoursPerUnit: { ...DEFAULT_SCHED_RULES.hoursPerUnit, ...(stored.hoursPerUnit || {}) },
      equivalentPerUnit: { ...DEFAULT_SCHED_RULES.equivalentPerUnit, ...(stored.equivalentPerUnit || {}) },
      professorUnitLimits: (() => {
        const def = DEFAULT_SCHED_RULES.professorUnitLimits!;
        const s = stored.professorUnitLimits;
        const result = { ...def } as Record<SchedEmploymentType, SchedProfessorUnitLimit>;
        (Object.keys(def) as SchedEmploymentType[]).forEach((empKey) => {
          const item = s?.[empKey];
          result[empKey] = {
            minEquivalentUnits:
              item && typeof item.minEquivalentUnits === 'number' && Number.isFinite(item.minEquivalentUnits) && item.minEquivalentUnits >= 0
                ? item.minEquivalentUnits
                : def[empKey].minEquivalentUnits,
            maxEquivalentUnits:
              item && typeof item.maxEquivalentUnits === 'number' && Number.isFinite(item.maxEquivalentUnits) && item.maxEquivalentUnits >= 0
                ? item.maxEquivalentUnits
                : def[empKey].maxEquivalentUnits,
          };
        });
        return result;
      })(),
      activeDays:
        Array.isArray(stored.activeDays) && stored.activeDays.length > 0
          ? stored.activeDays
          : DEFAULT_SCHED_RULES.activeDays,
      timeSlots: (
        Array.isArray(stored.timeSlots) && stored.timeSlots.length > 0
          ? stored.timeSlots
          : DEFAULT_SCHED_RULES.timeSlots
      ).map((slot, idx) => ({
        ...slot,
        label: getSchedSlotTitle(slot, idx),
      })),
      examSettings: stored.examSettings || DEFAULT_SCHED_RULES.examSettings,
      examSettingsByTerm: stored.examSettingsByTerm || {},
      studentAccessEnabled: Boolean(stored.studentAccessEnabled),
      studentAccessScope:
        stored.studentAccessScope === 'own_cohort' ||
        stored.studentAccessScope === 'own_major' ||
        stored.studentAccessScope === 'all_programs'
          ? stored.studentAccessScope
          : 'own_cohort',
      studentPublishedTerms:
        Array.isArray(stored.studentPublishedTerms) && stored.studentPublishedTerms.length > 0
          ? stored.studentPublishedTerms
          : [stored.activeTerm || DEFAULT_SCHED_RULES.activeTerm],
      programLocks: {
        lockAllChanges: Boolean(stored.programLocks?.lockAllChanges),
        lockMessage: stored.programLocks?.lockMessage || '',
        lockedMajorCodes: Array.isArray(stored.programLocks?.lockedMajorCodes)
          ? stored.programLocks!.lockedMajorCodes
          : [],
        lockedDays: Array.isArray(stored.programLocks?.lockedDays)
          ? stored.programLocks!.lockedDays
          : [],
        lockedSlotIds: Array.isArray(stored.programLocks?.lockedSlotIds)
          ? stored.programLocks!.lockedSlotIds
          : [],
        lockedDeptHeadIds: Array.isArray(stored.programLocks?.lockedDeptHeadIds)
          ? stored.programLocks!.lockedDeptHeadIds
          : [],
        lockedAcademicDeputyIds: Array.isArray(stored.programLocks?.lockedAcademicDeputyIds)
          ? stored.programLocks!.lockedAcademicDeputyIds
          : [],
        lockedExpertIds: Array.isArray(stored.programLocks?.lockedExpertIds)
          ? stored.programLocks!.lockedExpertIds
          : [],
        blockedViewUserIds: Array.isArray(stored.programLocks?.blockedViewUserIds)
          ? stored.programLocks!.blockedViewUserIds
          : [],
      },
      professorAvailabilityWindow: stored.professorAvailabilityWindow
        ? {
            enabled: Boolean(stored.professorAvailabilityWindow.enabled),
            startDate: stored.professorAvailabilityWindow.startDate || '',
            startTime: stored.professorAvailabilityWindow.startTime || '00:00',
            endDate: stored.professorAvailabilityWindow.endDate || '',
            endTime: stored.professorAvailabilityWindow.endTime || '23:59',
            note: stored.professorAvailabilityWindow.note || '',
          }
        : DEFAULT_SCHED_RULES.professorAvailabilityWindow,
      masterGridLayout: (() => {
        const def = DEFAULT_SCHED_RULES.masterGridLayout!;
        const s = stored.masterGridLayout;
        if (!s || typeof s !== 'object') return def;
        return {
          metaColumns: {
            degreeLevel: { ...def.metaColumns.degreeLevel, ...(s.metaColumns?.degreeLevel || {}) },
            major: { ...def.metaColumns.major, ...(s.metaColumns?.major || {}) },
            entry: { ...def.metaColumns.entry, ...(s.metaColumns?.entry || {}) },
            totalStudents: { ...def.metaColumns.totalStudents, ...(s.metaColumns?.totalStudents || {}) },
            section: { ...def.metaColumns.section, ...(s.metaColumns?.section || {}) },
          },
          showDegreeLevelColumn: Boolean(s.showDegreeLevelColumn),
          mergeMetaColumns: {
            degreeLevel: s.mergeMetaColumns?.degreeLevel ?? true,
            major: s.mergeMetaColumns?.major ?? true,
            entry: s.mergeMetaColumns?.entry ?? true,
          },
          defaultSlotWidth:
            typeof s.defaultSlotWidth === 'number' && s.defaultSlotWidth >= 60
              ? s.defaultSlotWidth
              : def.defaultSlotWidth,
          slotWidthsBySlotId:
            s.slotWidthsBySlotId && typeof s.slotWidthsBySlotId === 'object'
              ? s.slotWidthsBySlotId
              : {},
          scheduleCells: {
            ...def.scheduleCells,
            ...(s.scheduleCells || {}),
          },
          columnOverrides:
            s.columnOverrides && typeof s.columnOverrides === 'object'
              ? s.columnOverrides
              : {},
        };
      })(),
      masterPrintSettings: (() => {
        const def = DEFAULT_SCHED_RULES.masterPrintSettings!;
        const s = stored.masterPrintSettings;
        if (!s || typeof s !== 'object') return def;
        return {
          ...def,
          ...s,
          marginsMm: {
            ...def.marginsMm,
            ...(s.marginsMm || {}),
          },
        };
      })(),
      termOfferedCoursesByCohort:
        stored.termOfferedCoursesByCohort &&
        typeof stored.termOfferedCoursesByCohort === 'object'
          ? stored.termOfferedCoursesByCohort
          : {},
    };
  },
  setSchedRules: (rules: SchedRulesSettings): boolean =>
    set(STORAGE_KEYS.SCHED_RULES, rules),

  getSchedUserHistory: (actorId: string): SchedUserHistoryState => {
    if (!actorId) return { undoStack: [], redoStack: [] };
    const stored = get<Partial<SchedUserHistoryState> | null>(
      `sched_user_history_${actorId}`,
      null
    );
    if (!stored || typeof stored !== 'object') return { undoStack: [], redoStack: [] };
    return {
      undoStack: Array.isArray(stored.undoStack) ? stored.undoStack : [],
      redoStack: Array.isArray(stored.redoStack) ? stored.redoStack : [],
    };
  },
  setSchedUserHistory: (actorId: string, state: SchedUserHistoryState): boolean => {
    if (!actorId) return false;
    return set(`sched_user_history_${actorId}`, {
      undoStack: state.undoStack.slice(-50),
      redoStack: state.redoStack.slice(-50),
    });
  },

  // -------------------------------------------------------------
  // درخواست‌های ثبت استاد جدید (مدیر گروه ← تأیید مدیر سامانه با کد موقت new001 تا new999 و قابل اصلاح به کد گلستان)
  // -------------------------------------------------------------
  getSchedProfessorProposals: (): SchedProfessorProposal[] =>
    get<SchedProfessorProposal[]>(STORAGE_KEYS.SCHED_PROFESSOR_PROPOSALS, []),
  setSchedProfessorProposals: (items: SchedProfessorProposal[]): boolean =>
    set(STORAGE_KEYS.SCHED_PROFESSOR_PROPOSALS, items),

  submitSchedProfessorProposal: (
    payload: Omit<
      SchedProfessorProposal,
      'id' | 'status' | 'createdAt' | 'updatedAt'
    >
  ): { success: boolean; message: string; proposal?: SchedProfessorProposal } => {
    const firstName = (payload.firstName || '').trim();
    const lastName = (payload.lastName || '').trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || payload.fullName.trim();
    const nationalId = normalizeSchedCode(payload.nationalId);
    if (!fullName || !nationalId) {
      return { success: false, message: 'نام، نام خانوادگی و کد ملی استاد الزامی است.' };
    }

    const existingProfs = Storage.getSchedProfessors();
    const existingProposals = Storage.getSchedProfessorProposals();

    const matchedProfByNat = existingProfs.find(
      (p) => normalizeSchedCode(p.nationalId) === nationalId
    );
    if (matchedProfByNat) {
      return {
        success: false,
        message: `استاد با کد ملی ${nationalId} هم‌اکنون با نام «${matchedProfByNat.fullName}» و کد «${matchedProfByNat.professorCode}» در بانک اساتید ثبت شده است.`,
      };
    }

    const duplicatePendingNat = existingProposals.find(
      (pr) => pr.status === 'pending' && normalizeSchedCode(pr.nationalId) === nationalId
    );
    if (duplicatePendingNat) {
      return {
        success: false,
        message: `درخواست ثبت استاد با کد ملی ${nationalId} پیش‌تر توسط «${duplicatePendingNat.requestedByName}» ثبت شده و در انتظار تأیید مدیر سامانه است.`,
      };
    }

    const rawProposedCode = normalizeProfessorCodeInput(payload.proposedProfessorCode);
    const suggestedTempCode =
      rawProposedCode || getNextTemporaryProfessorCode(existingProfs, existingProposals) || undefined;

    if (
      suggestedTempCode &&
      existingProfs.some(
        (p) => normalizeProfessorCodeInput(p.professorCode).toLowerCase() === suggestedTempCode.toLowerCase()
      )
    ) {
      return {
        success: false,
        message: `کد استاد «${suggestedTempCode}» قبلاً در بانک اساتید استفاده شده است.`,
      };
    }

    const nowIso = new Date().toISOString();
    const level = (payload.degreeLevel || '').trim();
    const field = (payload.degreeField || '').trim();
    const spec = (payload.degreeSpecialization || '').trim();
    const degreeFull = formatProfessorDegreeFull(level, field, spec) || level || undefined;

    const item: SchedProfessorProposal = {
      ...payload,
      id: `profprop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      firstName: firstName || fullName,
      lastName,
      fullName,
      nationalId,
      degreeLevel: level || undefined,
      degreeField: field || undefined,
      degreeSpecialization: spec || undefined,
      degreeFull,
      mobile: normalizeSchedCode(payload.mobile) || undefined,
      landlinePhone: normalizeSchedCode(payload.landlinePhone) || undefined,
      bankAccount: normalizeSchedCode(payload.bankAccount) || undefined,
      proposedProfessorCode: suggestedTempCode,
      status: 'pending',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    Storage.setSchedProfessorProposals([item, ...existingProposals]);
    Storage.addActivityLog({
      category: 'settings',
      action: 'درخواست ثبت استاد جدید توسط مدیر گروه',
      details: `فرم اطلاعات استاد «${item.fullName}» (کد ملی: ${item.nationalId}${item.proposedProfessorCode ? ` · کد پیشنهادی: ${item.proposedProfessorCode}` : ''}) توسط ${item.requestedByName} برای تأیید مدیر سامانه ارسال شد.`,
      targetName: item.fullName,
      actorName: item.requestedByName,
    });
    return {
      success: true,
      message: `فرم اطلاعات استاد «${item.fullName}» برای تأیید به مدیر کل سامانه ارسال گردید.`,
      proposal: item,
    };
  },

  approveSchedProfessorProposal: (params: {
    proposalId: string;
    reviewerId: string;
    reviewerName: string;
    assignedCode?: string;
    overrides?: Partial<SchedProfessorProposal>;
  }): {
    success: boolean;
    message: string;
    professor?: SchedProfessor;
    proposal?: SchedProfessorProposal;
  } => {
    const proposals = Storage.getSchedProfessorProposals();
    const idx = proposals.findIndex((p) => p.id === params.proposalId);
    if (idx === -1) {
      return { success: false, message: 'درخواست مورد نظر یافت نشد.' };
    }
    const target = { ...proposals[idx], ...(params.overrides || {}) };
    if (target.status !== 'pending') {
      return { success: false, message: 'این درخواست پیش‌تر بررسی و تعیین تکلیف شده است.' };
    }

    const existingProfs = Storage.getSchedProfessors();
    let finalCode = normalizeProfessorCodeInput(
      params.assignedCode !== undefined ? params.assignedCode : target.proposedProfessorCode
    );
    if (!finalCode) {
      finalCode = getNextTemporaryProfessorCode(existingProfs, proposals) || '';
    }
    if (!finalCode) {
      return {
        success: false,
        message: 'کد استاد مشخص نشد و ظرفیت کدهای موقت new001 تا new999 تکمیل است. لطفاً کد مشخصه را به صورت دستی وارد کنید.',
      };
    }

    const dupCode = existingProfs.find(
      (p) => normalizeProfessorCodeInput(p.professorCode).toLowerCase() === finalCode.toLowerCase()
    );
    if (dupCode) {
      return {
        success: false,
        message: `کد استاد «${finalCode}» قبلاً برای «${dupCode.fullName}» ثبت شده است. لطفاً کد یکتای دیگری وارد کنید.`,
      };
    }

    const cleanNat = normalizeSchedCode(target.nationalId) || finalCode;
    const dupNat = existingProfs.find((p) => normalizeSchedCode(p.nationalId) === cleanNat);
    if (dupNat) {
      return {
        success: false,
        message: `استادی با کد ملی ${cleanNat} («${dupNat.fullName}» با کد ${dupNat.professorCode}) هم‌اکنون در بانک اساتید موجود است.`,
      };
    }

    const isTemp = isTemporaryProfessorCode(finalCode);
    const nowIso = new Date().toISOString();
    const cleanFirst = (target.firstName || '').trim();
    const cleanLast = (target.lastName || '').trim();
    const cleanFull = [cleanFirst, cleanLast].filter(Boolean).join(' ').trim() || target.fullName.trim();
    const cleanLevel = (target.degreeLevel || '').trim();
    const cleanField = (target.degreeField || '').trim();
    const cleanSpec = (target.degreeSpecialization || '').trim();
    const cleanDegreeFull =
      formatProfessorDegreeFull(cleanLevel, cleanField, cleanSpec) || cleanLevel || undefined;
    const cleanMobile = normalizeSchedCode(target.mobile) || undefined;
    const cleanLandline = normalizeSchedCode(target.landlinePhone) || undefined;

    const newProfessor: SchedProfessor = {
      id: `prof_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      professorCode: finalCode,
      firstName: cleanFirst || undefined,
      lastName: cleanLast || undefined,
      fullName: cleanFull,
      gender: target.gender || undefined,
      fatherName: target.fatherName || undefined,
      nationalId: cleanNat,
      departmentName: target.departmentName || undefined,
      unitCenterName: target.unitCenterName || undefined,
      degreeLevel: cleanLevel || undefined,
      degreeField: cleanField || undefined,
      degreeSpecialization: cleanSpec || undefined,
      degreeFull: cleanDegreeFull,
      academicStep: target.academicStep || undefined,
      academicRank: target.academicRank || undefined,
      employmentType: target.employmentType,
      employmentStatusRaw: target.employmentStatusRaw || undefined,
      phone: cleanMobile || cleanLandline || undefined,
      mobile: cleanMobile,
      landlinePhone: cleanLandline,
      bankName: target.bankName || undefined,
      bankAccount: normalizeSchedCode(target.bankAccount) || undefined,
      minEquivalentUnitsOverride: target.minEquivalentUnitsOverride,
      maxEquivalentUnitsOverride: target.maxEquivalentUnitsOverride,
      isTemporaryCode: isTemp,
      codeUpdatedAt: nowIso,
      proposalId: target.id,
      isActive: true,
      unavailableKeys: [],
      notes: target.notes || undefined,
    };

    const updatedProposal: SchedProfessorProposal = {
      ...target,
      fullName: cleanFull,
      status: 'approved',
      assignedProfessorCode: finalCode,
      temporaryProfessorCode: isTemp ? finalCode : target.temporaryProfessorCode,
      approvedProfessorId: newProfessor.id,
      reviewedById: params.reviewerId,
      reviewedByName: params.reviewerName,
      reviewedAt: nowIso,
      updatedAt: nowIso,
    };

    Storage.setSchedProfessors([...existingProfs, newProfessor]);
    proposals[idx] = updatedProposal;
    Storage.setSchedProfessorProposals(proposals);

    Storage.addActivityLog({
      category: 'settings',
      action: 'تأیید و افزودن استاد جدید از درخواست مدیر گروه',
      details: `استاد «${newProfessor.fullName}» با کد ${finalCode}${isTemp ? ' (کد موقت در انتظار کد گلستان)' : ''} تأیید و به بانک اساتید اضافه شد.`,
      targetName: newProfessor.fullName,
      actorName: params.reviewerName,
    });

    return {
      success: true,
      message: `استاد «${newProfessor.fullName}» با کد «${finalCode}» تأیید و به بانک اساتید اضافه شد.`,
      professor: newProfessor,
      proposal: updatedProposal,
    };
  },

  rejectSchedProfessorProposal: (params: {
    proposalId: string;
    reviewerId: string;
    reviewerName: string;
    reason: string;
  }): { success: boolean; message: string; proposal?: SchedProfessorProposal } => {
    const proposals = Storage.getSchedProfessorProposals();
    const idx = proposals.findIndex((p) => p.id === params.proposalId);
    if (idx === -1) {
      return { success: false, message: 'درخواست مورد نظر یافت نشد.' };
    }
    const target = proposals[idx];
    if (target.status !== 'pending') {
      return { success: false, message: 'این درخواست قبلاً بررسی شده است.' };
    }
    const nowIso = new Date().toISOString();
    const updated: SchedProfessorProposal = {
      ...target,
      status: 'rejected',
      rejectionReason: params.reason.trim() || 'نیاز به اصلاح یا عدم تأیید مشخصات توسط مدیر سامانه',
      reviewedById: params.reviewerId,
      reviewedByName: params.reviewerName,
      reviewedAt: nowIso,
      updatedAt: nowIso,
    };
    proposals[idx] = updated;
    Storage.setSchedProfessorProposals(proposals);

    Storage.addActivityLog({
      category: 'settings',
      action: 'رد درخواست ثبت استاد جدید',
      details: `درخواست ثبت استاد «${target.fullName}» به دلیل «${updated.rejectionReason}» توسط ${params.reviewerName} رد شد.`,
      targetName: target.fullName,
      actorName: params.reviewerName,
      severity: 'warning',
    });

    return {
      success: true,
      message: `درخواست ثبت استاد «${target.fullName}» رد شد.`,
      proposal: updated,
    };
  },

  updateSchedProfessorAndSync: (params: {
    professorId: string;
    updatedFields: Partial<SchedProfessor>;
    actorName?: string;
  }): {
    success: boolean;
    message: string;
    professor?: SchedProfessor;
    updatedOfferingsCount: number;
  } => {
    const profList = Storage.getSchedProfessors();
    const idx = profList.findIndex((p) => p.id === params.professorId);
    if (idx === -1) {
      return { success: false, message: 'استاد مورد نظر یافت نشد.', updatedOfferingsCount: 0 };
    }
    const prevProf = profList[idx];
    const nextCodeRaw =
      params.updatedFields.professorCode !== undefined
        ? params.updatedFields.professorCode
        : prevProf.professorCode;
    const cleanCode = normalizeProfessorCodeInput(nextCodeRaw);
    if (!cleanCode) {
      return { success: false, message: 'کد استاد نمی‌تواند خالی باشد.', updatedOfferingsCount: 0 };
    }
    const dup = profList.find(
      (p) =>
        p.id !== prevProf.id &&
        normalizeProfessorCodeInput(p.professorCode).toLowerCase() === cleanCode.toLowerCase()
    );
    if (dup) {
      return {
        success: false,
        message: `کد استاد «${cleanCode}» قبلاً برای «${dup.fullName}» ثبت شده است.`,
        updatedOfferingsCount: 0,
      };
    }

    const codeChanged = prevProf.professorCode !== cleanCode;
    const wasTemporary =
      Boolean(prevProf.isTemporaryCode) || isTemporaryProfessorCode(prevProf.professorCode);
    const nowIsTemporary = isTemporaryProfessorCode(cleanCode);
    const nowIso = new Date().toISOString();

    const updatedProf: SchedProfessor = {
      ...prevProf,
      ...params.updatedFields,
      professorCode: cleanCode,
      isTemporaryCode: nowIsTemporary,
      previousTemporaryCode:
        codeChanged && wasTemporary && !nowIsTemporary
          ? prevProf.professorCode
          : prevProf.previousTemporaryCode,
      codeUpdatedAt: codeChanged ? nowIso : prevProf.codeUpdatedAt,
    };

    const nextProfs = profList.map((p, i) => (i === idx ? updatedProf : p));
    Storage.setSchedProfessors(nextProfs);

    // همگام‌سازی خودکار کد و نام استاد در تمامی دروس برنامه‌ریزی‌شده
    const offerings = Storage.getSchedOfferings();
    const { nextOfferings, updatedCount } = syncProfessorMetadataInOfferings(offerings, updatedProf);
    if (updatedCount > 0) {
      Storage.setSchedOfferings(nextOfferings);
    }

    // همگام‌سازی کد جدید با درخواست اولیه ثبت استاد در صورت وجود
    const proposals = Storage.getSchedProfessorProposals();
    let propChanged = false;
    const nextProposals = proposals.map((pr) => {
      if (pr.approvedProfessorId === updatedProf.id || (updatedProf.proposalId && pr.id === updatedProf.proposalId)) {
        propChanged = true;
        return {
          ...pr,
          assignedProfessorCode: cleanCode,
          temporaryProfessorCode:
            pr.temporaryProfessorCode || (wasTemporary ? prevProf.professorCode : undefined),
          updatedAt: nowIso,
        };
      }
      return pr;
    });
    if (propChanged) {
      Storage.setSchedProfessorProposals(nextProposals);
    }

    // اگر کاربر فعلی همین استاد است، سشن را نیز به‌روز کنیم
    const cu = Storage.getCurrentUser();
    if (cu && cu.role === 'professor' && cu.professor.id === updatedProf.id) {
      Storage.setCurrentUser({ role: 'professor', professor: updatedProf });
    }

    if (codeChanged) {
      Storage.addActivityLog({
        category: 'settings',
        action: 'اصلاح کد استاد و همگام‌سازی با برنامه درسی',
        details: `کد استاد «${updatedProf.fullName}» از «${prevProf.professorCode}» به «${cleanCode}» تغییر یافت${updatedCount > 0 ? ` و در ${updatedCount} درس ارائه‌شده به‌روز شد.` : '.'}`,
        targetName: updatedProf.fullName,
        actorName: params.actorName || 'مدیر کل سامانه',
      });
    }

    return {
      success: true,
      message:
        codeChanged && updatedCount > 0
          ? `مشخصات استاد «${updatedProf.fullName}» و کد «${cleanCode}» بروزرسانی و در ${updatedCount.toLocaleString('fa-IR')} درس جدول برنامه همگام‌سازی شد.`
          : `اطلاعات استاد «${updatedProf.fullName}» بروزرسانی شد.`,
      professor: updatedProf,
      updatedOfferingsCount: updatedCount,
    };
  },

  // -------------------------------------------------------------
  // متدهای گردش کار و ارجاعات یکپارچه حوزه معاونت آموزشی
  // (دانشجو ↔ مدیر گروه تخصصی/رشته ↔ کارشناس آموزش ↔ کارشناس فارغ‌التحصیلان)
  // -------------------------------------------------------------
  getAcademicWorkflowRequests: (): AcademicWorkflowRequest[] =>
    get<AcademicWorkflowRequest[]>(STORAGE_KEYS.ACADEMIC_WORKFLOW_REQUESTS, []),

  setAcademicWorkflowRequests: (items: AcademicWorkflowRequest[]): boolean =>
    set(STORAGE_KEYS.ACADEMIC_WORKFLOW_REQUESTS, items),

  createAcademicWorkflowRequest: (payload: {
    student: Student;
    category: AcademicWorkflowRequestCategory;
    subject: string;
    description: string;
    courseTitle?: string;
    initiatorRole: AcademicWorkflowInitiatorRole;
    initiatorId: string;
    initiatorName: string;
    targetMode: AcademicWorkflowTargetMode;
    targetDeptHeadId?: string;
    targetDeptHeadName?: string;
    targetExpertId?: string;
    targetExpertName?: string;
    autoRouteToGraduationOnDeptApproval?: boolean;
    initialNote?: string;
  }): { success: boolean; message: string; request?: AcademicWorkflowRequest } => {
    const subject = (payload.subject || '').trim();
    const description = (payload.description || '').trim();
    if (!subject || !description) {
      return { success: false, message: 'لطفاً موضوع و شرح کامل درخواست را وارد نمایید.' };
    }

    const list = Storage.getAcademicWorkflowRequests();
    const allEduStaff = Storage.getEducationStaff().filter(
      (e) => e.status !== 'inactive' && e.isActive !== false
    );
    const deptHeads = allEduStaff.filter((e) => isEducationDepartmentHead(e));
    const experts = allEduStaff.filter((e) => !isEducationDepartmentHead(e));

    // تطبیق هوشمند مدیر گروه یا کارشناس رشته دانشجو در صورت عدم انتخاب دستی
    let assignedDeptHeadId = payload.targetDeptHeadId;
    let assignedDeptHeadName = payload.targetDeptHeadName;
    let assignedExpertId = payload.targetExpertId;
    let assignedExpertName = payload.targetExpertName;

    if (assignedDeptHeadId && !assignedDeptHeadName) {
      const dh = deptHeads.find((e) => e.id === assignedDeptHeadId);
      if (dh) assignedDeptHeadName = dh.fullName;
    }
    if (assignedExpertId && !assignedExpertName) {
      const ex = experts.find((e) => e.id === assignedExpertId);
      if (ex) assignedExpertName = ex.fullName;
    }

    if (
      (payload.targetMode === 'major_dept_head' || payload.targetMode === 'course_dept_head') &&
      !assignedDeptHeadId
    ) {
      const matchedDh =
        deptHeads.find((dh) => doesEducationStaffCoverField(dh, payload.student.fieldOfStudy)) ||
        deptHeads[0];
      if (matchedDh) {
        assignedDeptHeadId = matchedDh.id;
        assignedDeptHeadName = matchedDh.fullName;
      }
    }

    if (payload.initiatorRole === 'education_expert') {
      assignedExpertId = assignedExpertId || payload.initiatorId;
      assignedExpertName = assignedExpertName || payload.initiatorName;
    } else if (!assignedExpertId) {
      const matchedEx =
        experts.find((ex) => doesEducationStaffCoverField(ex, payload.student.fieldOfStudy)) ||
        experts[0];
      if (matchedEx) {
        assignedExpertId = matchedEx.id;
        assignedExpertName = matchedEx.fullName;
      }
    }

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const initialStage: AcademicWorkflowStage =
      payload.targetMode === 'education_expert' ? 'pending_expert_action' : 'pending_dept_head';

    const actorRole: AcademicWorkflowActorRole =
      payload.initiatorRole === 'student'
        ? 'student'
        : payload.initiatorRole === 'department_head'
        ? 'department_head'
        : 'education_expert';

    const actionLabel =
      payload.initiatorRole === 'education_expert'
        ? payload.autoRouteToGraduationOnDeptApproval
          ? 'ثبت و ارجاع درخواست توسط کارشناس آموزش به مدیر گروه (ارسال خودکار به فارغ‌التحصیلان پس از تأیید)'
          : 'ثبت و ارجاع درخواست توسط کارشناس آموزش به مدیر گروه'
        : payload.targetMode === 'course_dept_head'
        ? `ثبت درخواست دانشجو به مدیر گروه تخصصی درس${payload.courseTitle ? ` «${payload.courseTitle.trim()}»` : ''}`
        : payload.targetMode === 'major_dept_head'
        ? 'ثبت درخواست دانشجو به مدیر گروه رشته'
        : 'ثبت درخواست دانشجو به کارشناس آموزش رشته';

    const firstStep: AcademicWorkflowStep = {
      id: makeUniqueId('acws'),
      timestamp: nowStr,
      actorRole,
      actorId: payload.initiatorId,
      actorName: payload.initiatorName,
      actionLabel,
      toStage: initialStage,
      targetStaffId:
        initialStage === 'pending_dept_head' ? assignedDeptHeadId : assignedExpertId,
      targetStaffName:
        initialStage === 'pending_dept_head'
          ? assignedDeptHeadName || 'مدیر گروه مربوطه'
          : assignedExpertName || 'کارشناس آموزش رشته',
      note: (payload.initialNote || '').trim() || undefined,
    };

    const newReq: AcademicWorkflowRequest = {
      id: makeUniqueId('acw'),
      trackingCode: `ACW-${101 + list.length}`,
      studentId: payload.student.studentId,
      studentName: payload.student.fullName,
      studentFieldOfStudy: payload.student.fieldOfStudy || 'نامشخص',
      studentEntryTerm: payload.student.entryTerm || '-',
      studentPhone: payload.student.mobile || payload.student.phone || '',
      category: payload.category,
      subject,
      description,
      courseTitle: (payload.courseTitle || '').trim() || undefined,
      initiatorRole: payload.initiatorRole,
      initiatorId: payload.initiatorId,
      initiatorName: payload.initiatorName,
      initialTargetMode: payload.targetMode,
      autoRouteToGraduationOnDeptApproval:
        payload.autoRouteToGraduationOnDeptApproval ??
        payload.initiatorRole === 'education_expert',
      currentStage: initialStage,
      assignedDeptHeadId,
      assignedDeptHeadName,
      assignedExpertId,
      assignedExpertName,
      createdAt: nowStr,
      updatedAt: nowStr,
      steps: [firstStep],
    };

    list.unshift(newReq);
    Storage.setAcademicWorkflowRequests(list);

    Storage.addActivityLog({
      category: 'education',
      action: 'ثبت درخواست در گردش کار حوزه معاونت آموزشی',
      details: `درخواست ${newReq.trackingCode} (${subject}) برای دانشجو ${payload.student.fullName} توسط ${payload.initiatorName} ثبت شد.`,
      targetName: newReq.trackingCode,
    });

    if (payload.initiatorRole !== 'student') {
      Storage.addMessage({
        senderId: payload.initiatorId,
        senderName: payload.initiatorName,
        senderRole: 'education',
        receiverType: 'student',
        receiverId: payload.student.studentId,
        receiverName: payload.student.fullName,
        targetScope: 'single',
        category: 'education',
        subject: `ثبت و ارجاع درخواست آموزشی (${newReq.trackingCode})`,
        content: `درخواست «${subject}» با کد رهگیری ${newReq.trackingCode} توسط ${payload.initiatorName} ثبت و به «${assignedDeptHeadName || 'مدیر گروه مربوطه'}» ارجاع شد. گردش کار آن در بخش «درخواست‌های آموزشی» کارتابل شما قابل مشاهده است.`,
        date: nowStr,
      });
    }

    return {
      success: true,
      message: `درخواست با کد رهگیری «${newReq.trackingCode}» ثبت و به کارتابل «${firstStep.targetStaffName}» ارسال شد.`,
      request: newReq,
    };
  },

  transitionAcademicWorkflowRequest: (
    requestId: string,
    payload: {
      action:
        | 'refer_to_dept_head'
        | 'dept_head_approve_to_graduation'
        | 'dept_head_directive_to_expert'
        | 'dept_head_complete'
        | 'expert_forward_to_graduation'
        | 'expert_complete'
        | 'graduation_complete'
        | 'return_to_expert'
        | 'reject';
      actorRole: AcademicWorkflowActorRole;
      actorId: string;
      actorName: string;
      targetStaffId?: string;
      targetStaffName?: string;
      directive?: string;
      note?: string;
      finalLetterNumber?: string;
      autoRouteToGraduation?: boolean;
    }
  ): { success: boolean; message: string; request?: AcademicWorkflowRequest } => {
    const list = Storage.getAcademicWorkflowRequests();
    const idx = list.findIndex((r) => r.id === requestId);
    if (idx === -1) return { success: false, message: 'درخواست مورد نظر یافت نشد.' };

    const cur = list[idx];
    const note = (payload.note || '').trim();
    const directive = (payload.directive || '').trim();
    const finalLetterNumber = (payload.finalLetterNumber || '').trim();

    if (payload.action === 'dept_head_directive_to_expert' && !directive) {
      return {
        success: false,
        message: 'لطفاً دستور اجرایی لازم برای کارشناس آموزش رشته را بنویسید.',
      };
    }
    if ((payload.action === 'reject' || payload.action === 'return_to_expert') && !note) {
      return {
        success: false,
        message: 'لطفاً علت یا توضیحات لازم را وارد نمایید.',
      };
    }

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const allEduStaff = Storage.getEducationStaff().filter(
      (e) => e.status !== 'inactive' && e.isActive !== false
    );
    const deptHeads = allEduStaff.filter((e) => isEducationDepartmentHead(e));
    const experts = allEduStaff.filter((e) => !isEducationDepartmentHead(e));
    const gradStaff = Storage.getGraduationStaff().filter(
      (g) => g.status !== 'inactive' && g.isActive !== false
    );

    let nextStage: AcademicWorkflowStage = cur.currentStage;
    let actionLabel = '';
    let nextDeptHeadId = cur.assignedDeptHeadId;
    let nextDeptHeadName = cur.assignedDeptHeadName;
    let nextExpertId = cur.assignedExpertId;
    let nextExpertName = cur.assignedExpertName;
    let nextGradId = cur.assignedGraduationStaffId;
    let nextGradName = cur.assignedGraduationStaffName;
    let nextAutoRoute = cur.autoRouteToGraduationOnDeptApproval;
    let targetStaffId = payload.targetStaffId;
    let targetStaffName = payload.targetStaffName;
    let studentNoticeTitle = '';
    let studentNoticeBody = '';

    switch (payload.action) {
      case 'refer_to_dept_head': {
        const pickedDh =
          (targetStaffId && deptHeads.find((d) => d.id === targetStaffId)) ||
          deptHeads.find((d) => doesEducationStaffCoverField(d, cur.studentFieldOfStudy)) ||
          deptHeads[0];
        nextDeptHeadId = pickedDh?.id || targetStaffId;
        nextDeptHeadName = pickedDh?.fullName || targetStaffName || 'مدیر گروه رشته';
        targetStaffId = nextDeptHeadId;
        targetStaffName = nextDeptHeadName;
        nextExpertId = cur.assignedExpertId || payload.actorId;
        nextExpertName = cur.assignedExpertName || payload.actorName;
        nextAutoRoute = payload.autoRouteToGraduation ?? true;
        nextStage = 'pending_dept_head';
        actionLabel = nextAutoRoute
          ? 'ارجاع کارشناس آموزش به مدیر گروه (با ارسال خودکار به فارغ‌التحصیلان پس از تأیید)'
          : 'ارجاع کارشناس آموزش به مدیر گروه جهت بررسی و صدور دستور';
        studentNoticeTitle = `ارجاع درخواست آموزشی به مدیر گروه (${cur.trackingCode})`;
        studentNoticeBody = `درخواست شما («${cur.subject}») توسط کارشناس آموزش (${payload.actorName}) به مدیر گروه مربوطه (${nextDeptHeadName}) ارجاع گردید.${note ? `\nتوضیحات: ${note}` : ''}`;
        break;
      }
      case 'dept_head_approve_to_graduation': {
        const pickedGrad =
          (targetStaffId && gradStaff.find((g) => g.id === targetStaffId)) || gradStaff[0];
        nextGradId = pickedGrad?.id || targetStaffId;
        nextGradName = pickedGrad?.fullName || targetStaffName || 'کارشناس واحد فارغ‌التحصیلان';
        targetStaffId = nextGradId;
        targetStaffName = nextGradName;
        nextStage = 'pending_graduation';
        actionLabel = 'تأیید مدیر گروه و ارسال خودکار به کارتابل کارشناس فارغ‌التحصیلان';
        studentNoticeTitle = `تأیید مدیر گروه و ارسال به واحد فارغ‌التحصیلان (${cur.trackingCode})`;
        studentNoticeBody = `درخواست «${cur.subject}» توسط مدیر گروه (${payload.actorName}) تأیید شد و به‌صورت خودکار جهت اقدام نهایی در کارتابل واحد فارغ‌التحصیلان قرار گرفت.${note ? `\nتوضیحات مدیر گروه: ${note}` : ''}`;
        break;
      }
      case 'dept_head_directive_to_expert': {
        const pickedEx =
          (targetStaffId && experts.find((e) => e.id === targetStaffId)) ||
          experts.find((e) => doesEducationStaffCoverField(e, cur.studentFieldOfStudy)) ||
          experts[0];
        nextExpertId = pickedEx?.id || targetStaffId;
        nextExpertName = pickedEx?.fullName || targetStaffName || 'کارشناس آموزش رشته';
        targetStaffId = nextExpertId;
        targetStaffName = nextExpertName;
        nextStage = 'pending_expert_action';
        actionLabel = 'صدور دستور مدیر گروه و ارجاع به کارشناس آموزش رشته جهت اقدام';
        studentNoticeTitle = `صدور دستور مدیر گروه و ارجاع به کارشناس رشته (${cur.trackingCode})`;
        studentNoticeBody = `مدیر گروه (${payload.actorName}) دستور لازم را برای درخواست «${cur.subject}» ثبت و جهت اجرا به کارشناس آموزش (${nextExpertName}) ارسال نمود.\nدستور مدیر گروه: ${directive}`;
        break;
      }
      case 'dept_head_complete': {
        nextStage = 'completed';
        actionLabel = 'رسیدگی و تکمیل مستقیم توسط مدیر گروه';
        studentNoticeTitle = `تکمیل درخواست آموزشی (${cur.trackingCode})`;
        studentNoticeBody = `درخواست «${cur.subject}» توسط مدیر گروه (${payload.actorName}) بررسی و تکمیل شد.${note ? `\nنتیجه: ${note}` : ''}`;
        break;
      }
      case 'expert_forward_to_graduation': {
        const pickedGrad =
          (targetStaffId && gradStaff.find((g) => g.id === targetStaffId)) || gradStaff[0];
        nextGradId = pickedGrad?.id || targetStaffId;
        nextGradName = pickedGrad?.fullName || targetStaffName || 'کارشناس واحد فارغ‌التحصیلان';
        targetStaffId = nextGradId;
        targetStaffName = nextGradName;
        nextStage = 'pending_graduation';
        actionLabel = 'اجرای دستور توسط کارشناس آموزش و ارسال به واحد فارغ‌التحصیلان';
        studentNoticeTitle = `ارسال درخواست به واحد فارغ‌التحصیلان (${cur.trackingCode})`;
        studentNoticeBody = `کارشناس آموزش (${payload.actorName}) اقدام لازم را انجام داد و پرونده «${cur.subject}» جهت اقدام نهایی به واحد فارغ‌التحصیلان ارسال گردید.${note ? `\nتوضیحات: ${note}` : ''}`;
        break;
      }
      case 'expert_complete': {
        nextStage = 'completed';
        actionLabel = 'انجام اقدام لازم و تکمیل درخواست توسط کارشناس آموزش';
        studentNoticeTitle = `تکمیل و اجرای درخواست آموزشی (${cur.trackingCode})`;
        studentNoticeBody = `اقدام لازم برای درخواست «${cur.subject}» توسط کارشناس آموزش (${payload.actorName}) انجام و پرونده تکمیل گردید.${note ? `\nتوضیحات: ${note}` : ''}`;
        break;
      }
      case 'graduation_complete': {
        nextStage = 'completed';
        nextGradId = payload.actorId;
        nextGradName = payload.actorName;
        actionLabel = 'اقدام نهایی و خاتمه درخواست در واحد فارغ‌التحصیلان';
        studentNoticeTitle = `اقدام نهایی واحد فارغ‌التحصیلان انجام شد (${cur.trackingCode})`;
        studentNoticeBody = `درخواست «${cur.subject}» توسط واحد فارغ‌التحصیلان (${payload.actorName}) با موفقیت نهایی شد.${finalLetterNumber ? `\nشماره نامه / پیگیری: ${finalLetterNumber}` : ''}${note ? `\nتوضیحات نهایی: ${note}` : ''}`;
        break;
      }
      case 'return_to_expert': {
        const pickedEx =
          (targetStaffId && experts.find((e) => e.id === targetStaffId)) ||
          (cur.assignedExpertId && experts.find((e) => e.id === cur.assignedExpertId)) ||
          experts.find((e) => doesEducationStaffCoverField(e, cur.studentFieldOfStudy)) ||
          experts[0];
        nextExpertId = pickedEx?.id || cur.assignedExpertId;
        nextExpertName = pickedEx?.fullName || cur.assignedExpertName || 'کارشناس آموزش رشته';
        targetStaffId = nextExpertId;
        targetStaffName = nextExpertName;
        nextStage = 'pending_expert_action';
        actionLabel = 'عودت درخواست از واحد فارغ‌التحصیلان به کارشناس آموزش جهت تکمیل';
        studentNoticeTitle = `عودت درخواست جهت بررسی تکمیلی آموزش (${cur.trackingCode})`;
        studentNoticeBody = `درخواست «${cur.subject}» جهت بررسی تکمیلی از واحد فارغ‌التحصیلان به کارشناس آموزش (${nextExpertName}) بازگردانده شد.\nتوضیحات: ${note}`;
        break;
      }
      case 'reject': {
        nextStage = 'rejected';
        actionLabel =
          payload.actorRole === 'department_head'
            ? 'عدم تأیید / رد درخواست توسط مدیر گروه'
            : payload.actorRole === 'graduation'
            ? 'عدم تأیید / رد درخواست توسط واحد فارغ‌التحصیلان'
            : 'عدم تأیید / رد درخواست توسط کارشناس آموزش';
        studentNoticeTitle = `نتیجه بررسی درخواست آموزشی (${cur.trackingCode})`;
        studentNoticeBody = `درخواست «${cur.subject}» توسط ${payload.actorName} تأیید نشد.\nعلت / توضیحات: ${note}`;
        break;
      }
    }

    const newStep: AcademicWorkflowStep = {
      id: makeUniqueId('acws'),
      timestamp: nowStr,
      actorRole: payload.actorRole,
      actorId: payload.actorId,
      actorName: payload.actorName,
      actionLabel,
      fromStage: cur.currentStage,
      toStage: nextStage,
      targetStaffId,
      targetStaffName,
      directive: directive || undefined,
      note: note || undefined,
    };

    const updated: AcademicWorkflowRequest = {
      ...cur,
      currentStage: nextStage,
      assignedDeptHeadId: nextDeptHeadId,
      assignedDeptHeadName: nextDeptHeadName,
      assignedExpertId: nextExpertId,
      assignedExpertName: nextExpertName,
      assignedGraduationStaffId: nextGradId,
      assignedGraduationStaffName: nextGradName,
      autoRouteToGraduationOnDeptApproval: nextAutoRoute,
      deptHeadDirective: directive || cur.deptHeadDirective,
      finalActionNote:
        nextStage === 'completed' || nextStage === 'rejected'
          ? note || cur.finalActionNote
          : cur.finalActionNote,
      finalLetterNumber: finalLetterNumber || cur.finalLetterNumber,
      updatedAt: nowStr,
      steps: [...(cur.steps || []), newStep],
    };

    list[idx] = updated;
    Storage.setAcademicWorkflowRequests(list);

    Storage.addActivityLog({
      category: 'education',
      action: actionLabel,
      details: `درخواست ${cur.trackingCode} (${cur.studentName}) توسط ${payload.actorName} بروزرسانی شد.`,
      targetName: cur.trackingCode,
      severity: nextStage === 'rejected' ? 'warning' : 'info',
    });

    if (studentNoticeTitle) {
      Storage.addMessage({
        senderId: payload.actorId,
        senderName: payload.actorName,
        senderRole: payload.actorRole === 'graduation' ? 'graduation' : 'education',
        receiverType: 'student',
        receiverId: cur.studentId,
        receiverName: cur.studentName,
        targetScope: 'single',
        category: payload.actorRole === 'graduation' ? 'graduation' : 'education',
        subject: studentNoticeTitle,
        content: studentNoticeBody,
        date: nowStr,
      });
    }

    return {
      success: true,
      message: `${actionLabel} با موفقیت ثبت شد.`,
      request: updated,
    };
  },

  // -------------------------------------------------------------
  // متدهای گردش کار تسویه حساب الکترونیک فراغت از تحصیل
  // -------------------------------------------------------------
  getGraduationClearances: (): GraduationClearanceRequest[] =>
    get<GraduationClearanceRequest[]>(STORAGE_KEYS.GRADUATION_CLEARANCES, INITIAL_GRADUATION_CLEARANCES),

  setGraduationClearances: (items: GraduationClearanceRequest[]): boolean =>
    set(STORAGE_KEYS.GRADUATION_CLEARANCES, items),

  submitGraduationClearance: (payload: {
    student: Student;
    graduationAcademicYear: string;
    graduationSemester: string;
    studentPhone?: string;
    studentNote?: string;
    dormName?: string;
    roomNumber?: string;
  }): { success: boolean; message: string; request?: GraduationClearanceRequest } => {
    const list = Storage.getGraduationClearances();
    const existing = list.find((r) => r.studentId === payload.student.studentId);
    if (existing && existing.status !== 'rejected_education' && existing.status !== 'rejected_dept_head') {
      return {
        success: false,
        message: 'شما قبلاً درخواست تسویه حساب فراغت از تحصیل ثبت کرده‌اید و پرونده شما در حال گردش است.',
      };
    }

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const initialUnits = {} as Record<ClearanceUnitRole, ClearanceUnitApproval>;
    CLEARANCE_UNITS_META.forEach((u) => {
      initialUnits[u.role] = {
        unitRole: u.role,
        unitLabel: u.label,
        status: 'pending',
      };
    });

    const safeStudentPhotoUrl =
      payload.student.photoUrl && !isBase64ImageDataUrl(payload.student.photoUrl)
        ? payload.student.photoUrl
        : undefined;
    const safeExistingPhotoUrl =
      existing?.studentPhotoUrl && !isBase64ImageDataUrl(existing.studentPhotoUrl)
        ? existing.studentPhotoUrl
        : undefined;

    if (existing && (existing.status === 'rejected_education' || existing.status === 'rejected_dept_head')) {
      const isDeptHeadResubmit = existing.status === 'rejected_dept_head';
      const updatedReq: GraduationClearanceRequest = {
        ...existing,
        studentPhone: (payload.studentPhone || '').trim() || payload.student.mobile || payload.student.phone || '',
        studentPhotoUrl: safeStudentPhotoUrl || safeExistingPhotoUrl,
        graduationAcademicYear: payload.graduationAcademicYear.trim(),
        graduationSemester: payload.graduationSemester.trim(),
        studentNote: (payload.studentNote || '').trim() || undefined,
        status: isDeptHeadResubmit ? 'pending_dept_head' : 'pending_education',
        educationGateStatus: isDeptHeadResubmit ? 'approved' : 'pending',
        deptHeadGateStatus: isDeptHeadResubmit ? 'pending' : undefined,
        deptHeadReport1050Verified: false,
        updatedAt: nowStr,
      };
      const next = list.map((r) => (r.id === existing.id ? updatedReq : r));
      Storage.setGraduationClearances(next);
      Storage.addActivityLog({
        category: 'graduation_clearance',
        action: isDeptHeadResubmit
          ? 'ارسال مجدد درخواست تسویه حساب به مدیر گروه رشته (گزارش ۱۰۵۰)'
          : 'ارسال مجدد درخواست تسویه حساب به کارشناس آموزش',
        details: `دانشجو ${payload.student.fullName} (${payload.student.studentId}) درخواست تسویه حساب ${updatedReq.trackingCode} را مجدداً به ${isDeptHeadResubmit ? 'مدیر گروه رشته' : 'واحد آموزش'} ارسال کرد.`,
        targetName: updatedReq.trackingCode,
      });
      return {
        success: true,
        message: isDeptHeadResubmit
          ? `درخواست تسویه حساب شما (${updatedReq.trackingCode}) مجدداً جهت بررسی گزارش ۱۰۵۰ به مدیر گروه رشته ارسال شد.`
          : `درخواست تسویه حساب شما (${updatedReq.trackingCode}) مجدداً برای کارشناس آموزش ارسال شد.`,
        request: updatedReq,
      };
    }

    const newReq: GraduationClearanceRequest = {
      id: makeUniqueId('clr'),
      trackingCode: `CLR-${101 + list.length}`,
      studentId: payload.student.studentId,
      studentName: payload.student.fullName,
      studentNationalId: payload.student.nationalId,
      studentFatherName: payload.student.fatherName,
      studentFieldOfStudy: payload.student.fieldOfStudy,
      studentEntryTerm: payload.student.entryTerm,
      studentPhone: (payload.studentPhone || '').trim() || payload.student.mobile || payload.student.phone || '',
      studentPhotoUrl: safeStudentPhotoUrl,
      dormName: payload.dormName || payload.student.assignedDormName,
      roomNumber: payload.roomNumber || payload.student.assignedRoomNumber,
      graduationAcademicYear: payload.graduationAcademicYear.trim(),
      graduationSemester: payload.graduationSemester.trim(),
      studentNote: (payload.studentNote || '').trim() || undefined,
      requestedAt: nowStr,
      updatedAt: nowStr,
      status: 'pending_education',
      educationGateStatus: 'pending',
      units: initialUnits,
    };

    list.unshift(newReq);
    Storage.setGraduationClearances(list);
    Storage.addActivityLog({
      category: 'graduation_clearance',
      action: 'ثبت درخواست تسویه حساب الکترونیک فراغت از تحصیل',
      details: `دانشجو ${payload.student.fullName} (${payload.student.studentId}) درخواست تسویه حساب ${newReq.trackingCode} را جهت بررسی واحدهای درسی به کارشناس آموزش ارسال کرد.`,
      targetName: newReq.trackingCode,
    });
    return {
      success: true,
      message: `درخواست تسویه حساب شما با کد رهگیری «${newReq.trackingCode}» ثبت شد و ابتدا به کارشناس آموزش و سپس جهت تأیید سرفصل (گزارش ۱۰۵۰ گلستان) به مدیر گروه رشته ارسال می‌گردد.`,
      request: newReq,
    };
  },

  reviewGraduationClearanceEducationGate: (
    clearanceId: string,
    payload: {
      decision: 'approved' | 'rejected';
      reviewerId: string;
      reviewerName: string;
      note?: string;
    }
  ): { success: boolean; message: string } => {
    const list = Storage.getGraduationClearances();
    const idx = list.findIndex((r) => r.id === clearanceId);
    if (idx === -1) return { success: false, message: 'پرونده تسویه حساب یافت نشد.' };

    const note = (payload.note || '').trim();
    if (payload.decision === 'rejected' && !note) {
      return { success: false, message: 'لطفاً علت رد درخواست را در بخش توضیحات ذکر نمایید.' };
    }

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const cur = list[idx];
    const nextUnits: Record<ClearanceUnitRole, ClearanceUnitApproval> = { ...cur.units };
    CLEARANCE_UNITS_META.forEach((u) => {
      if (!nextUnits[u.role]) {
        nextUnits[u.role] = { unitRole: u.role, unitLabel: u.label, status: 'pending' };
      }
    });

    if (payload.decision === 'approved') {
      nextUnits.education = {
        unitRole: 'education',
        unitLabel: 'واحد آموزش',
        status: 'approved',
        reviewerId: payload.reviewerId,
        reviewerName: payload.reviewerName,
        reviewedAt: nowStr,
        note:
          note ||
          'بررسی اولیه کارشناس آموزش تایید و پرونده جهت تایید سرفصل (گزارش ۱۰۵۰ گلستان) به مدیر گروه رشته ارجاع شد.',
      };
      list[idx] = {
        ...cur,
        status: 'pending_dept_head',
        educationGateStatus: 'approved',
        educationReviewerId: payload.reviewerId,
        educationReviewerName: payload.reviewerName,
        educationReviewedAt: nowStr,
        educationNote: note || 'بررسی اولیه کارشناس آموزش تایید شد.',
        deptHeadGateStatus: 'pending',
        deptHeadReport1050Verified: false,
        units: nextUnits,
        updatedAt: nowStr,
      };
    } else {
      nextUnits.education = {
        unitRole: 'education',
        unitLabel: 'واحد آموزش',
        status: 'rejected',
        reviewerId: payload.reviewerId,
        reviewerName: payload.reviewerName,
        reviewedAt: nowStr,
        note,
      };
      list[idx] = {
        ...cur,
        status: 'rejected_education',
        educationGateStatus: 'rejected',
        educationReviewerId: payload.reviewerId,
        educationReviewerName: payload.reviewerName,
        educationReviewedAt: nowStr,
        educationNote: note,
        units: nextUnits,
        updatedAt: nowStr,
      };
    }

    Storage.setGraduationClearances(list);
    Storage.addActivityLog({
      category: 'graduation_clearance',
      action:
        payload.decision === 'approved'
          ? 'تایید کارشناس آموزش و ارجاع تسویه حساب به مدیر گروه رشته (گزارش ۱۰۵۰)'
          : 'رد اولیه درخواست تسویه حساب توسط کارشناس آموزش',
      details: `پرونده ${cur.trackingCode} (${cur.studentName}) توسط ${payload.reviewerName} بررسی شد.`,
      targetName: cur.trackingCode,
      severity: payload.decision === 'rejected' ? 'warning' : 'info',
    });

    Storage.addMessage({
      senderId: payload.reviewerId,
      senderName: `${payload.reviewerName} (کارشناس آموزش)`,
      senderRole: 'education',
      receiverType: 'student',
      receiverId: cur.studentId,
      receiverName: cur.studentName,
      targetScope: 'single',
      category: 'education',
      subject:
        payload.decision === 'approved'
          ? `تایید کارشناس آموزش و ارجاع به مدیر گروه رشته (${cur.trackingCode})`
          : `نقص پرونده آموزشی تسویه حساب (${cur.trackingCode})`,
      content:
        payload.decision === 'approved'
          ? `بررسی اولیه کارشناس آموزش برای درخواست تسویه حساب شما تایید شد و پرونده جهت تایید گذراندن کلیه واحدهای الزامی سرفصل طبق گزارش ۱۰۵۰ سامانه گلستان به «مدیر گروه رشته» ارسال گردید.${note ? `\nتوضیحات کارشناس آموزش: ${note}` : ''}`
          : `درخواست تسویه حساب فراغت از تحصیل شما توسط کارشناس آموزش تایید نشد.\nعلت / توضیحات: ${note}`,
      date: nowStr,
    });

    return {
      success: true,
      message:
        payload.decision === 'approved'
          ? `تایید کارشناس آموزش ثبت شد و پرونده «${cur.studentName}» جهت بررسی گزارش ۱۰۵۰ گلستان به کارتابل مدیر گروه رشته ارجاع گردید.`
          : `درخواست تسویه حساب «${cur.studentName}» با ذکر توضیحات رد شد.`,
    };
  },

  reviewGraduationClearanceDeptHeadGate: (
    clearanceId: string,
    payload: {
      decision: 'approved' | 'rejected';
      reviewerId: string;
      reviewerName: string;
      report1050Verified?: boolean;
      note?: string;
    }
  ): { success: boolean; message: string } => {
    const list = Storage.getGraduationClearances();
    const idx = list.findIndex((r) => r.id === clearanceId);
    if (idx === -1) return { success: false, message: 'پرونده تسویه حساب یافت نشد.' };

    const cur = list[idx];
    if (cur.status !== 'pending_dept_head' && cur.status !== 'rejected_dept_head') {
      return {
        success: false,
        message: 'این پرونده در مرحله بررسی مدیر گروه رشته قرار ندارد.',
      };
    }

    const note = (payload.note || '').trim();
    if (payload.decision === 'approved' && !payload.report1050Verified) {
      return {
        success: false,
        message: 'پیش از تایید، تیک تأیید گذراندن کلیه واحدهای الزامی سرفصل طبق گزارش ۱۰۵۰ سامانه گلستان الزامی است.',
      };
    }
    if (payload.decision === 'rejected' && !note) {
      return {
        success: false,
        message: 'لطفاً علت رد یا کسری واحدهای سرفصل (گزارش ۱۰۵۰) را در بخش توضیحات ذکر نمایید.',
      };
    }

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const nextUnits: Record<ClearanceUnitRole, ClearanceUnitApproval> = { ...cur.units };
    CLEARANCE_UNITS_META.forEach((u) => {
      if (!nextUnits[u.role]) {
        nextUnits[u.role] = { unitRole: u.role, unitLabel: u.label, status: 'pending' };
      }
    });

    if (payload.decision === 'approved') {
      nextUnits.education = {
        ...nextUnits.education,
        unitRole: 'education',
        unitLabel: 'واحد آموزش',
        status: 'approved',
        reviewerId: cur.educationReviewerId || payload.reviewerId,
        reviewerName: cur.educationReviewerName || payload.reviewerName,
        reviewedAt: cur.educationReviewedAt || nowStr,
        note:
          cur.educationNote ||
          'گذراندن واحدهای درسی تایید شد (تایید نهایی سرفصل و گزارش ۱۰۵۰ توسط مدیر گروه انجام گردید).',
      };
      list[idx] = {
        ...cur,
        status: 'in_clearance',
        deptHeadGateStatus: 'approved',
        deptHeadReviewerId: payload.reviewerId,
        deptHeadReviewerName: payload.reviewerName,
        deptHeadReviewedAt: nowStr,
        deptHeadReport1050Verified: true,
        deptHeadNote:
          note ||
          'تایید شد: دانشجو کلیه واحدهای الزامی سرفصل رشته را طبق گزارش ۱۰۵۰ سامانه گلستان با موفقیت گذرانده است.',
        units: nextUnits,
        updatedAt: nowStr,
      };
    } else {
      list[idx] = {
        ...cur,
        status: 'rejected_dept_head',
        deptHeadGateStatus: 'rejected',
        deptHeadReviewerId: payload.reviewerId,
        deptHeadReviewerName: payload.reviewerName,
        deptHeadReviewedAt: nowStr,
        deptHeadReport1050Verified: false,
        deptHeadNote: note,
        units: nextUnits,
        updatedAt: nowStr,
      };
    }

    Storage.setGraduationClearances(list);
    Storage.addActivityLog({
      category: 'graduation_clearance',
      action:
        payload.decision === 'approved'
          ? 'تایید مدیر گروه رشته (گزارش ۱۰۵۰ گلستان) و ارسال فرم تسویه به کلیه واحدها'
          : 'رد پرونده تسویه حساب توسط مدیر گروه رشته (نقص سرفصل / گزارش ۱۰۵۰)',
      details: `پرونده ${cur.trackingCode} (${cur.studentName}) توسط مدیر گروه ${payload.reviewerName} بررسی شد.`,
      targetName: cur.trackingCode,
      severity: payload.decision === 'rejected' ? 'warning' : 'info',
    });

    Storage.addMessage({
      senderId: payload.reviewerId,
      senderName: `${payload.reviewerName} (مدیر گروه رشته)`,
      senderRole: 'education',
      receiverType: 'student',
      receiverId: cur.studentId,
      receiverName: cur.studentName,
      targetScope: 'single',
      category: 'education',
      subject:
        payload.decision === 'approved'
          ? `تایید مدیر گروه (گزارش ۱۰۵۰ گلستان) و آغاز گردش تسویه حساب (${cur.trackingCode})`
          : `نقص سرفصل / گزارش ۱۰۵۰ در تسویه حساب (${cur.trackingCode})`,
      content:
        payload.decision === 'approved'
          ? `مدیر گروه رشته گذراندن کلیه واحدهای الزامی سرفصل شما را طبق گزارش ۱۰۵۰ سامانه گلستان تایید کرد و فرم عکس‌دار تسویه حساب شما به‌صورت خودکار به تمامی ۱۲ واحد دانشگاه ارسال گردید.${note ? `\nتوضیحات مدیر گروه: ${note}` : ''}`
          : `درخواست تسویه حساب شما در مرحله بررسی مدیر گروه رشته (انطباق گزارش ۱۰۵۰ گلستان) تایید نشد.\nعلت / توضیحات: ${note}`,
      date: nowStr,
    });

    return {
      success: true,
      message:
        payload.decision === 'approved'
          ? `تایید مدیر گروه (گزارش ۱۰۵۰ گلستان) ثبت شد و فرم تسویه «${cur.studentName}» به تمامی ۱۲ واحد دانشگاه ارسال گردید.`
          : `درخواست تسویه حساب «${cur.studentName}» با ذکر علت نقص گزارش ۱۰۵۰ رد شد.`,
    };
  },

  reviewGraduationClearanceUnit: (
    clearanceId: string,
    payload: {
      unitRole: ClearanceUnitRole;
      decision: 'approved' | 'rejected';
      reviewerId: string;
      reviewerName: string;
      note?: string;
    }
  ): { success: boolean; message: string; isNowCompleted?: boolean } => {
    const list = Storage.getGraduationClearances();
    const idx = list.findIndex((r) => r.id === clearanceId);
    if (idx === -1) return { success: false, message: 'پرونده تسویه حساب یافت نشد.' };

    const cur = list[idx];
    if (cur.status !== 'in_clearance' && cur.status !== 'completed') {
      return {
        success: false,
        message: 'این پرونده هنوز تایید کارشناس آموزش و مدیر گروه رشته (گزارش ۱۰۵۰ گلستان) را تکمیل نکرده است.',
      };
    }

    const note = (payload.note || '').trim();
    if (payload.decision === 'rejected' && !note) {
      return { success: false, message: 'در صورت رد تسویه، ذکر توضیحات و علت نقص الزامی است.' };
    }

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const unitMeta = CLEARANCE_UNITS_META.find((u) => u.role === payload.unitRole);
    const nextUnits: Record<ClearanceUnitRole, ClearanceUnitApproval> = { ...cur.units };
    CLEARANCE_UNITS_META.forEach((u) => {
      if (!nextUnits[u.role]) {
        nextUnits[u.role] = { unitRole: u.role, unitLabel: u.label, status: 'pending' };
      }
    });

    nextUnits[payload.unitRole] = {
      unitRole: payload.unitRole,
      unitLabel: unitMeta?.label || payload.unitRole,
      status: payload.decision,
      reviewerId: payload.reviewerId,
      reviewerName: payload.reviewerName,
      reviewedAt: nowStr,
      note: note || (payload.decision === 'approved' ? 'بلامانع و تسویه کامل تایید گردید.' : ''),
    };

    const allApproved = CLEARANCE_UNITS_META.every((u) => nextUnits[u.role]?.status === 'approved');

    list[idx] = {
      ...cur,
      units: nextUnits,
      status: allApproved ? 'completed' : 'in_clearance',
      completedAt: allApproved ? nowStr : undefined,
      updatedAt: nowStr,
    };

    Storage.setGraduationClearances(list);
    Storage.addActivityLog({
      category: 'graduation_clearance',
      action:
        payload.decision === 'approved'
          ? `تایید تسویه حساب توسط ${unitMeta?.label || payload.unitRole}`
          : `رد تسویه حساب توسط ${unitMeta?.label || payload.unitRole}`,
      details: `پرونده ${cur.trackingCode} (${cur.studentName}) توسط ${payload.reviewerName} ${payload.decision === 'approved' ? 'تایید' : 'رد'} شد.${note ? ` (${note})` : ''}`,
      targetName: cur.trackingCode,
      severity: payload.decision === 'rejected' ? 'warning' : 'info',
    });

    return {
      success: true,
      isNowCompleted: allApproved,
      message: allApproved
        ? `تایید ${unitMeta?.label} ثبت شد. تمامی واحدها تسویه «${cur.studentName}» را تایید کردند و فرم آماده چاپ است.`
        : payload.decision === 'approved'
        ? `تسویه حساب «${cur.studentName}» توسط ${unitMeta?.label} تایید شد.`
        : `تسویه حساب «${cur.studentName}» توسط ${unitMeta?.label} با ذکر توضیحات رد شد.`,
    };
  },

  resubmitGraduationClearanceUnit: (
    clearanceId: string,
    unitRole: ClearanceUnitRole,
    studentNote?: string
  ): { success: boolean; message: string } => {
    const list = Storage.getGraduationClearances();
    const idx = list.findIndex((r) => r.id === clearanceId);
    if (idx === -1) return { success: false, message: 'پرونده تسویه حساب یافت نشد.' };
    const cur = list[idx];
    const targetUnit = cur.units[unitRole];
    if (!targetUnit || targetUnit.status !== 'rejected') {
      return { success: false, message: 'این واحد در وضعیت رد شده قرار ندارد.' };
    }
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const nextUnits = { ...cur.units };
    nextUnits[unitRole] = {
      ...targetUnit,
      status: 'pending',
      resubmittedAt: nowStr,
      note: (studentNote || '').trim()
        ? `اعلام رفع نقص دانشجو: ${(studentNote || '').trim()}`
        : 'اعلام رفع نقص و درخواست بررسی مجدد توسط دانشجو',
    };
    list[idx] = {
      ...cur,
      units: nextUnits,
      status: 'in_clearance',
      updatedAt: nowStr,
    };
    Storage.setGraduationClearances(list);
    return {
      success: true,
      message: `درخواست بررسی مجدد به «${targetUnit.unitLabel}» ارسال شد.`,
    };
  },

  finalizeGraduationClearance: (
    clearanceId: string,
    payload: {
      staffId: string;
      staffName: string;
      archiveNumber?: string;
      note?: string;
    }
  ): { success: boolean; message: string; request?: GraduationClearanceRequest } => {
    const list = Storage.getGraduationClearances();
    const idx = list.findIndex((r) => r.id === clearanceId);
    if (idx === -1) return { success: false, message: 'پرونده تسویه حساب یافت نشد.' };
    const cur = list[idx];
    if (cur.status !== 'completed') {
      return {
        success: false,
        message: 'این پرونده هنوز تایید تمامی واحدهای تسویه را تکمیل نکرده و قابل خاتمه نیست.',
      };
    }

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const archiveNumber = (payload.archiveNumber || '').trim() || cur.graduationArchiveNumber || `GRD-${cur.trackingCode.replace(/^CLR-?/i, '')}`;
    const note = (payload.note || '').trim() || 'برگه تسویه حساب دریافت و فرآیند تسویه در اداره امور فارغ‌التحصیلان خاتمه یافت.';

    const updated: GraduationClearanceRequest = {
      ...cur,
      graduationFinalized: true,
      graduationFinalizedAt: nowStr,
      graduationFinalizedBy: payload.staffName,
      graduationFinalizedById: payload.staffId,
      graduationArchiveNumber: archiveNumber,
      graduationFinalNote: note,
      updatedAt: nowStr,
    };

    list[idx] = updated;
    Storage.setGraduationClearances(list);
    Storage.addActivityLog({
      category: 'graduation_clearance',
      action: 'خاتمه نهایی فرآیند تسویه توسط واحد فارغ‌التحصیلان',
      details: `پرونده تسویه ${cur.trackingCode} (${cur.studentName}) با شماره پرونده «${archiveNumber}» توسط ${payload.staffName} خاتمه و بایگانی شد.`,
      targetName: cur.trackingCode,
    });

    Storage.addMessage({
      senderId: payload.staffId,
      senderName: `${payload.staffName} (واحد فارغ‌التحصیلان)`,
      senderRole: 'graduation',
      receiverType: 'student',
      receiverId: cur.studentId,
      receiverName: cur.studentName,
      targetScope: 'single',
      category: 'graduation',
      subject: `خاتمه نهایی فرآیند تسویه حساب فراغت از تحصیل (${cur.trackingCode})`,
      content: `فرآیند تسویه حساب فراغت از تحصیل شما در اداره امور فارغ‌التحصیلان با موفقیت تایید، دریافت و خاتمه یافت.\nشماره پرونده / بایگانی: ${archiveNumber}\nتوضیحات واحد فارغ‌التحصیلان: ${note}`,
      date: nowStr,
    });

    return {
      success: true,
      message: `فرآیند تسویه حساب «${cur.studentName}» (${cur.trackingCode}) با شماره بایگانی «${archiveNumber}» با موفقیت خاتمه یافت.`,
      request: updated,
    };
  },

  bulkFinalizeGraduationClearances: (
    clearanceIds: string[],
    payload: {
      staffId: string;
      staffName: string;
      note?: string;
    }
  ): { success: boolean; message: string; finalizedCount: number; skippedCount: number } => {
    if (!Array.isArray(clearanceIds) || clearanceIds.length === 0) {
      return { success: false, message: 'هیچ پرونده‌ای برای خاتمه یکجا انتخاب نشده است.', finalizedCount: 0, skippedCount: 0 };
    }
    const idSet = new Set(clearanceIds);
    const list = Storage.getGraduationClearances();
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const note = (payload.note || '').trim() || 'دریافت یکجا و خاتمه نهایی فرآیند تسویه در اداره امور فارغ‌التحصیلان.';
    let finalizedCount = 0;
    let skippedCount = 0;
    const finalizedStudents: GraduationClearanceRequest[] = [];

    const updatedList = list.map((cur) => {
      if (!idSet.has(cur.id)) return cur;
      if (cur.status !== 'completed' || cur.graduationFinalized) {
        skippedCount += 1;
        return cur;
      }
      const archiveNumber = cur.graduationArchiveNumber || `GRD-${cur.trackingCode.replace(/^CLR-?/i, '')}`;
      const next: GraduationClearanceRequest = {
        ...cur,
        graduationFinalized: true,
        graduationFinalizedAt: nowStr,
        graduationFinalizedBy: payload.staffName,
        graduationFinalizedById: payload.staffId,
        graduationArchiveNumber: archiveNumber,
        graduationFinalNote: note,
        updatedAt: nowStr,
      };
      finalizedCount += 1;
      finalizedStudents.push(next);
      return next;
    });

    if (finalizedCount === 0) {
      return {
        success: false,
        message: 'هیچ پرونده واجد شرایطی (تکمیل‌شده و خاتمه‌نیافته) در موارد انتخاب‌شده یافت نشد.',
        finalizedCount: 0,
        skippedCount,
      };
    }

    Storage.setGraduationClearances(updatedList);
    Storage.addActivityLog({
      category: 'graduation_clearance',
      action: 'خاتمه یکجای فرآیند تسویه توسط واحد فارغ‌التحصیلان',
      details: `تعداد ${finalizedCount} پرونده تسویه حساب تکمیل‌شده به‌صورت یکجا توسط ${payload.staffName} دریافت و خاتمه یافت.`,
      targetName: `${finalizedCount} پرونده`,
    });

    // ارسال پیام اطلاع‌رسانی خاتمه تسویه برای دانشجویان مربوطه
    const messages = Storage.getMessages();
    finalizedStudents.forEach((cur) => {
      messages.unshift({
        id: makeUniqueId('msg'),
        senderId: payload.staffId,
        senderName: `${payload.staffName} (واحد فارغ‌التحصیلان)`,
        senderRole: 'graduation',
        receiverType: 'student',
        receiverId: cur.studentId,
        receiverName: cur.studentName,
        targetScope: 'single',
        category: 'graduation',
        subject: `خاتمه نهایی فرآیند تسویه حساب فراغت از تحصیل (${cur.trackingCode})`,
        content: `فرآیند تسویه حساب فراغت از تحصیل شما در اداره امور فارغ‌التحصیلان تایید و خاتمه یافت.\nشماره بایگانی: ${cur.graduationArchiveNumber}\nتوضیحات: ${note}`,
        date: nowStr,
        status: 'pending',
        replies: [],
      });
    });
    Storage.setMessages(messages);

    return {
      success: true,
      message: `تعداد ${finalizedCount.toLocaleString('fa-IR')} پرونده تسویه حساب تکمیل‌شده با موفقیت خاتمه و بایگانی شد.`,
      finalizedCount,
      skippedCount,
    };
  },

  reopenGraduationClearanceFinalization: (
    clearanceId: string,
    payload: { staffName: string }
  ): { success: boolean; message: string } => {
    const list = Storage.getGraduationClearances();
    const idx = list.findIndex((r) => r.id === clearanceId);
    if (idx === -1) return { success: false, message: 'پرونده تسویه حساب یافت نشد.' };
    const cur = list[idx];
    if (!cur.graduationFinalized) {
      return { success: false, message: 'این پرونده در وضعیت خاتمه‌یافته قرار ندارد.' };
    }
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    list[idx] = {
      ...cur,
      graduationFinalized: false,
      updatedAt: nowStr,
    };
    Storage.setGraduationClearances(list);
    Storage.addActivityLog({
      category: 'graduation_clearance',
      action: 'بازگشایی وضعیت خاتمه تسویه توسط واحد فارغ‌التحصیلان',
      details: `وضعیت خاتمه پرونده ${cur.trackingCode} (${cur.studentName}) توسط ${payload.staffName} به حالت آماده خاتمه بازگردانده شد.`,
      targetName: cur.trackingCode,
      severity: 'warning',
    });
    return {
      success: true,
      message: `وضعیت خاتمه پرونده «${cur.studentName}» بازگشایی شد.`,
    };
  },

  // -------------------------------------------------------------
  // ابزارهای پایش زنده، ممیزی حجم محلی و عیب‌یابی کامل سرور ابری و دیتابیس
  // -------------------------------------------------------------
  getCloudLiveMetrics: (): CloudLiveMetrics => buildCloudLiveMetricsSnapshot(),

  subscribeCloudMetrics: (listener: (metrics: CloudLiveMetrics) => void): (() => void) => {
    cloudMetricsSubscribers.add(listener);
    try {
      listener(buildCloudLiveMetricsSnapshot());
    } catch {
      // ignore initial listener error
    }
    return () => {
      cloudMetricsSubscribers.delete(listener);
    };
  },

  getLocalCloudPayloadSummary: (): LocalCloudPayloadSummary => {
    const auditItems: LocalCloudKeyAuditItem[] = [];
    let totalBytesUtf8 = 0;

    for (const key of SYNCABLE_KEYS) {
      let rawStr: string | null = null;
      if (parsedCache.has(key)) {
        try {
          rawStr = JSON.stringify(parsedCache.get(key));
        } catch {
          rawStr = null;
        }
      } else {
        try {
          rawStr = localStorage.getItem(key);
        } catch {
          rawStr = null;
        }
      }
      if (!rawStr) continue;
      const bytesUtf8 = getUtf8ByteLength(rawStr);
      totalBytesUtf8 += bytesUtf8;
      const percentOfVercelLimit = Math.round((bytesUtf8 / 10_000_000) * 1000) / 10;
      auditItems.push({
        key,
        label: FRIENDLY_SYNC_KEY_LABELS[key] || key.replace('farhangian_dorm_', '').replace('_prod', ''),
        bytesUtf8,
        percentOfVercelLimit,
        nearLimit: false,
        overLimit: false,
      });
    }

    auditItems.sort((a, b) => b.bytesUtf8 - a.bytesUtf8);
    return {
      presentKeysCount: auditItems.length,
      totalSyncableKeys: SYNCABLE_KEYS.length,
      totalBytesUtf8,
      oversizedKeys: [],
      nearLimitKeys: [],
      topKeys: auditItems.slice(0, 8),
    };
  },

  pollCloudLiveHealth: async (): Promise<{
    ok: boolean;
    latencyMs: number;
    dbName: string | null;
    counts: { syncKv: number; students: number; photos: number } | null;
    revision: string | number | null;
    updatedAt: string | null;
    errorMessage?: string;
  }> => {
    const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
    try {
      const [kvRes, stRes, avatarsRes] = await Promise.all([
        supabase.from('app_storage').select('key, updated_at', { count: 'exact' }),
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.storage.from(SUPABASE_AVATARS_BUCKET).list('', { limit: 1000 }),
      ]);
      const latencyMs = Math.round(
        (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt
      );

      const ok = !kvRes.error && !stRes.error;
      const errMsg = kvRes.error?.message || stRes.error?.message || avatarsRes.error?.message;
      const dbName = 'Supabase PostgreSQL';
      const syncKvCount = typeof kvRes.count === 'number' ? kvRes.count : kvRes.data?.length || 0;
      const studentsCount = typeof stRes.count === 'number' ? stRes.count : 0;
      const photosCount = Array.isArray(avatarsRes.data) ? avatarsRes.data.length : 0;
      const counts = ok ? { syncKv: syncKvCount, students: studentsCount, photos: photosCount } : null;

      let latestTs: string | null = null;
      if (Array.isArray(kvRes.data)) {
        for (const r of kvRes.data) {
          if (typeof r.updated_at === 'string' && (!latestTs || r.updated_at > latestTs)) {
            latestTs = r.updated_at;
          }
        }
      }

      versionEndpointSupported = true;
      manifestEndpointSupported = true;
      batchEndpointSupported = true;

      cloudTelemetryState.lastHealthLatencyMs = latencyMs;
      cloudTelemetryState.lastHealthOk = ok;
      cloudTelemetryState.lastDbName = ok ? dbName : null;
      cloudTelemetryState.lastServerCounts = counts;

      recordCloudTrafficEvent({
        direction: 'probe',
        endpoint: '/supabase/health',
        method: 'GET',
        status: ok ? 200 : 500,
        ok,
        durationMs: latencyMs,
        bytes: getUtf8ByteLength(JSON.stringify(kvRes.data || [])),
        detail: ok
          ? `پایش زنده Supabase فعال (${latencyMs}ms)`
          : `پایش زنده Supabase ناموفق`,
        errorMessage: ok ? undefined : errMsg,
      });

      return {
        ok,
        latencyMs,
        dbName: ok ? dbName : null,
        counts,
        revision: latestTs || lastSyncRevision,
        updatedAt: latestTs,
        errorMessage: ok ? undefined : errMsg || 'خطا در برقراری ارتباط با Supabase',
      };
    } catch (err) {
      const latencyMs = Math.round(
        (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt
      );
      cloudTelemetryState.lastHealthLatencyMs = latencyMs;
      cloudTelemetryState.lastHealthOk = false;
      const msg = err instanceof Error ? err.message : 'عدم دسترسی به پایگاه داده Supabase';
      recordCloudTrafficEvent({
        direction: 'probe',
        endpoint: '/supabase/health',
        method: 'GET',
        status: null,
        ok: false,
        durationMs: latencyMs,
        bytes: 0,
        detail: 'خطای اتصال در پایش زنده Supabase',
        errorMessage: msg,
      });
      return {
        ok: false,
        latencyMs,
        dbName: null,
        counts: null,
        revision: lastSyncRevision,
        updatedAt: null,
        errorMessage: msg,
      };
    }
  },

  runCloudDiagnostics: async (
    onStep?: (stepMessage: string) => void
  ): Promise<CloudDiagnosticReport> => {
    const overallStartedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const checks: CloudDiagnosticCheckItem[] = [];
    const recommendations: string[] = [];

    const localSummary = Storage.getLocalCloudPayloadSummary();
    let serverHealthy = false;
    let dbName: string | null = null;
    let serverCounts: { syncKv: number; students: number; photos: number } | null = null;
    let serverRevision: string | number | null = null;
    let serverUpdatedAt: string | null = null;
    let throughputKbps: number | null = null;
    let manifestKeysCount: number | null = null;
    let manifestTotalBytes: number | null = null;
    let missingOnServerKeys: string[] = [];
    const oversizedOnServerKeys: Array<{ key: string; sizeBytes: number }> = [];

    // ۱. بررسی وضعیت شبکه مرورگر و اطلاعات اتصال Supabase
    onStep?.('۱/۶ بررسی اتصال شبکه مرورگر و پیکربندی Supabase...');
    const isBrowserOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
    const navConn =
      typeof navigator !== 'undefined'
        ? (navigator as unknown as {
            connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean };
          }).connection
        : undefined;
    const netDetails: string[] = [
      `وضعیت آنلاین مرورگر: ${isBrowserOnline ? 'متصل' : 'قطع (Offline)'}`,
      `نشانی پروژه Supabase: ${SUPABASE_URL}`,
      `باکت ذخیره‌سازی تصاویر: ${SUPABASE_AVATARS_BUCKET} (Public WebP)`,
    ];
    if (navConn) {
      if (navConn.effectiveType) netDetails.push(`نوع شبکه مرورگر: ${navConn.effectiveType.toUpperCase()}`);
      if (typeof navConn.downlink === 'number') netDetails.push(`پهنای باند تخمینی: ${navConn.downlink} Mbps`);
      if (typeof navConn.rtt === 'number') netDetails.push(`تأخیر پایه شبکه: ${navConn.rtt} ms`);
    }
    checks.push({
      id: 'browser_network',
      title: 'شبکه مرورگر و پیکربندی Supabase',
      category: 'network',
      status: isBrowserOnline ? 'pass' : 'fail',
      latencyMs: typeof navConn?.rtt === 'number' ? navConn.rtt : null,
      summary: isBrowserOnline
        ? 'مرورگر به شبکه متصل است و پیکربندی پروژه Supabase معتبر است.'
        : 'مرورگر در حالت آفلاین است و امکان برقراری ارتباط وجود ندارد.',
      details: netDetails,
    });
    if (!isBrowserOnline) {
      recommendations.push('اتصال اینترنت دستگاه را بررسی و سپس آزمایش را تکرار نمایید.');
    }

    // ۲. بررسی سلامت پایگاه داده Supabase (PostgreSQL) و جداول app_storage / students
    onStep?.('۲/۶ بررسی سلامت پایگاه داده Supabase و جداول app_storage و students...');
    const healthStarted = typeof performance !== 'undefined' ? performance.now() : Date.now();
    let kvRows: Array<{ key: string; updated_at?: string | null }> = [];
    try {
      const [kvRes, stRes] = await Promise.all([
        supabase.from('app_storage').select('key, updated_at', { count: 'exact' }),
        supabase.from('students').select('id', { count: 'exact', head: true }),
      ]);
      const hLat = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - healthStarted);

      if (!kvRes.error && !stRes.error) {
        serverHealthy = true;
        dbName = 'Supabase PostgreSQL';
        kvRows = Array.isArray(kvRes.data)
          ? (kvRes.data as Array<{ key: string; updated_at?: string | null }>)
          : [];
        const syncKvCount = typeof kvRes.count === 'number' ? kvRes.count : kvRows.length;
        const studentsCount = typeof stRes.count === 'number' ? stRes.count : 0;
        serverCounts = { syncKv: syncKvCount, students: studentsCount, photos: 0 };
        cloudTelemetryState.lastHealthLatencyMs = hLat;
        cloudTelemetryState.lastHealthOk = true;
        cloudTelemetryState.lastDbName = dbName;
        cloudTelemetryState.lastServerCounts = serverCounts;

        for (const r of kvRows) {
          if (typeof r.updated_at === 'string' && (!serverUpdatedAt || r.updated_at > serverUpdatedAt)) {
            serverUpdatedAt = r.updated_at;
          }
        }
        serverRevision = serverUpdatedAt || 'active';

        recordCloudTrafficEvent({
          direction: 'probe',
          endpoint: '/supabase/health',
          method: 'GET',
          status: 200,
          ok: true,
          durationMs: hLat,
          bytes: getUtf8ByteLength(JSON.stringify(kvRows)),
          detail: `تست سلامت Supabase موفق (${hLat}ms)`,
        });
        checks.push({
          id: 'api_and_db_health',
          title: 'سلامت پایگاه داده ابری Supabase (PostgreSQL)',
          category: 'database',
          status: hLat > 4000 ? 'warn' : 'pass',
          latencyMs: hLat,
          summary: `ارتباط مستقیم با Supabase برقرار است و در ${hLat.toLocaleString('fa-IR')} میلی‌ثانیه پاسخ داد.`,
          details: [
            `پایگاه داده متصل: ${dbName}`,
            `تعداد جداول در app_storage: ${syncKvCount.toLocaleString('fa-IR')}`,
            `تعداد پرونده‌های ثبت‌شده در جدول students: ${studentsCount.toLocaleString('fa-IR')}`,
          ],
        });
      } else {
        cloudTelemetryState.lastHealthOk = false;
        const msg = kvRes.error?.message || stRes.error?.message || 'خطا در اتصال به جداول Supabase';
        recordCloudTrafficEvent({
          direction: 'probe',
          endpoint: '/supabase/health',
          method: 'GET',
          status: 500,
          ok: false,
          durationMs: hLat,
          bytes: 0,
          detail: 'خطا در بررسی سلامت جداول Supabase',
          errorMessage: msg,
        });
        checks.push({
          id: 'api_and_db_health',
          title: 'سلامت پایگاه داده ابری Supabase (PostgreSQL)',
          category: 'database',
          status: 'fail',
          latencyMs: hLat,
          summary: `خطا در دسترسی به جداول Supabase: ${msg}`,
          details: [
            'بررسی کنید جداول app_storage و students در Supabase ایجاد شده و RLS/Policy دسترسی برای نقش anon باز باشد.',
          ],
        });
        recommendations.push('سیاست‌های دسترسی (RLS Policies) جداول app_storage و students را در پنل Supabase بررسی کنید.');
      }
    } catch (err) {
      const hLat = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - healthStarted);
      cloudTelemetryState.lastHealthOk = false;
      const errMsg = err instanceof Error ? err.message : 'عدم دسترسی شبکه‌ای به Supabase';
      checks.push({
        id: 'api_and_db_health',
        title: 'سلامت پایگاه داده ابری Supabase (PostgreSQL)',
        category: 'database',
        status: 'fail',
        latencyMs: hLat,
        summary: errMsg,
        details: [`نشانی آزمایش‌شده: ${SUPABASE_URL}`],
      });
      recommendations.push('اتصال اینترنت و در دسترس بودن پروژه Supabase را بررسی نمایید.');
    }

    // ۳. بررسی دسترسی و وضعیت Supabase Storage (باکت avatars)
    onStep?.('۳/۶ بررسی فضای ذخیره‌سازی تصاویر Supabase Storage (avatars)...');
    const stgStarted = typeof performance !== 'undefined' ? performance.now() : Date.now();
    try {
      const { data: avatarFiles, error: avatarErr } = await supabase.storage
        .from(SUPABASE_AVATARS_BUCKET)
        .list('', { limit: 1000 });
      const sLat = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - stgStarted);
      if (!avatarErr && Array.isArray(avatarFiles)) {
        const photosCount = avatarFiles.length;
        if (serverCounts) {
          serverCounts.photos = photosCount;
          cloudTelemetryState.lastServerCounts = { ...serverCounts };
        }
        recordCloudTrafficEvent({
          direction: 'probe',
          endpoint: '/storage/avatars',
          method: 'GET',
          status: 200,
          ok: true,
          durationMs: sLat,
          bytes: getUtf8ByteLength(JSON.stringify(avatarFiles)),
          detail: `باکت avatars فعال (${photosCount.toLocaleString('fa-IR')} فایل)`,
        });
        checks.push({
          id: 'sync_version',
          title: 'فضای ذخیره‌سازی نامحدود تصاویر (Supabase Storage - avatars)',
          category: 'sync',
          status: 'pass',
          latencyMs: sLat,
          summary: `باکت عمومی avatars در ${sLat.toLocaleString('fa-IR')}ms پاسخ داد (${photosCount.toLocaleString('fa-IR')} تصویر ذخیره شده).`,
          details: [
            'فشرده‌سازی خودکار تصاویر به فرمت سبک WebP (حداکثر 400px، کیفیت 0.8، ~15KB)',
            'صف آپلود پس‌زمینه ۱۵تایی (Concurrency Batching) بدون قفل شدن مرورگر',
            `زمان آخرین تغییر در دیتابیس: ${serverUpdatedAt ? new Date(serverUpdatedAt).toLocaleString('fa-IR') : 'ثبت نشده'}`,
          ],
        });
      } else {
        checks.push({
          id: 'sync_version',
          title: 'فضای ذخیره‌سازی نامحدود تصاویر (Supabase Storage - avatars)',
          category: 'sync',
          status: 'warn',
          latencyMs: sLat,
          summary: `خطا در خواندن باکت avatars: ${avatarErr?.message || 'نامشخص'}`,
          details: ['بررسی کنید باکت avatars به‌صورت Public و با دسترسی SELECT/INSERT/UPDATE/DELETE ساخته شده باشد.'],
        });
        recommendations.push('سیاست دسترسی باکت avatars در بخش Storage پنل Supabase را بررسی نمایید.');
      }
    } catch {
      const sLat = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - stgStarted);
      checks.push({
        id: 'sync_version',
        title: 'فضای ذخیره‌سازی نامحدود تصاویر (Supabase Storage - avatars)',
        category: 'sync',
        status: 'fail',
        latencyMs: sLat,
        summary: 'ارتباط با باکت avatars با خطا مواجه شد.',
        details: [],
      });
    }

    // ۴. بررسی تطابق ۴۴ جدول app_storage با حافظه مرورگر
    onStep?.('۴/۶ ممیزی تطابق جداول مرورگر با جدول app_storage در Supabase...');
    const serverKeySet = new Set(kvRows.map((k) => k.key));
    manifestKeysCount = kvRows.length;
    manifestTotalBytes = localSummary.totalBytesUtf8;
    missingOnServerKeys = SYNCABLE_KEYS.filter(
      (k) => k !== STORAGE_KEYS.STUDENTS && localStorage.getItem(k) && !serverKeySet.has(k)
    );
    const manifestStatus: CloudDiagnosticCheckStatus =
      !serverHealthy ? 'fail' : missingOnServerKeys.length > 0 ? 'warn' : 'pass';
    checks.push({
      id: 'sync_manifest',
      title: 'تطابق جداول محلی با app_storage و students در Supabase',
      category: 'sync',
      status: manifestStatus,
      latencyMs: null,
      summary: `${manifestKeysCount.toLocaleString('fa-IR')} جدول در app_storage و ${(serverCounts?.students ?? 0).toLocaleString('fa-IR')} دانشجو در جدول students ثبت شده است.`,
      details: [
        `جداول موجود در مرورگر: ${localSummary.presentKeysCount.toLocaleString('fa-IR')} از ${localSummary.totalSyncableKeys.toLocaleString('fa-IR')}`,
        `جداول ثبت‌شده در Supabase app_storage: ${manifestKeysCount.toLocaleString('fa-IR')}`,
        missingOnServerKeys.length > 0
          ? `جداول موجود در مرورگر ولی غایب در Supabase (${missingOnServerKeys.length.toLocaleString('fa-IR')} مورد): ${missingOnServerKeys.slice(0, 5).map((k) => FRIENDLY_SYNC_KEY_LABELS[k] || k).join('، ')}`
          : 'تمام جداول فعال مرورگر روی Supabase ثبت شده‌اند.',
      ],
    });
    if (missingOnServerKeys.length > 0) {
      recommendations.push(
        `${missingOnServerKeys.length.toLocaleString('fa-IR')} جدول در مرورگر شما ذخیره است که هنوز روی Supabase ثبت نشده؛ از دکمه «انتقال داده‌ها و تنظیمات فعلی به سرور ابری و دیتابیس» استفاده کنید.`
      );
    }

    // ۵. آزمایش سرعت خواندن صفحه‌بندی‌شده از جدول students
    onStep?.('۵/۶ آزمایش سرعت انتقال داده و صفحه‌بندی جدول students در Supabase...');
    const trStarted = typeof performance !== 'undefined' ? performance.now() : Date.now();
    try {
      const { data: sampleStudents, error: sampleErr } = await supabase
        .from('students')
        .select('id, national_code, data, avatar_url')
        .range(0, 49);
      const tLat = Math.max(
        1,
        Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - trStarted)
      );
      const sampleText = JSON.stringify(sampleStudents || []);
      const totalSampleBytes = getUtf8ByteLength(sampleText);
      throughputKbps = Math.round(((totalSampleBytes / 1024) / (tLat / 1000)) * 10) / 10;

      recordCloudTrafficEvent({
        direction: 'down',
        endpoint: '/supabase/students?range=0-49',
        method: 'GET',
        status: sampleErr ? 500 : 200,
        ok: !sampleErr,
        durationMs: tLat,
        bytes: totalSampleBytes,
        detail: `آزمایش انتقال Supabase: ${Math.round(totalSampleBytes / 1024).toLocaleString('fa-IR')} KB در ${tLat}ms`,
        errorMessage: sampleErr?.message,
      });

      checks.push({
        id: 'data_transfer_speed',
        title: 'آزمایش سرعت انتقال داده و صفحه‌بندی نامحدود (.range)',
        category: 'traffic',
        status: sampleErr ? 'fail' : 'pass',
        latencyMs: tLat,
        summary: !sampleErr
          ? `انتقال نمونه (${Math.round(totalSampleBytes / 1024).toLocaleString('fa-IR')} کیلوبایت) در ${tLat.toLocaleString('fa-IR')}ms بدون محدودیت حجم انجام شد.`
          : `تست دریافت نمونه دانشجویان با خطا مواجه شد: ${sampleErr.message}`,
        details: [
          'ذخیره‌سازی دسته‌ای دانشجویان (Batch Upsert ۲۰۰تایی)',
          'خواندن کامل نامحدود دانشجویان با حلقه صفحه‌بندی ۱۰۰۰تایی (.range)',
          `سرعت انتقال اندازه‌گیری‌شده: ${throughputKbps.toLocaleString('fa-IR')} کیلوبایت بر ثانیه`,
        ],
      });
    } catch {
      const tLat = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - trStarted);
      checks.push({
        id: 'data_transfer_speed',
        title: 'آزمایش سرعت انتقال داده و صفحه‌بندی نامحدود (.range)',
        category: 'traffic',
        status: 'fail',
        latencyMs: tLat,
        summary: 'آزمایش انتقال داده از Supabase با خطای شبکه متوقف شد.',
        details: [],
      });
    }

    // ۶. بررسی صف همگام‌سازی و صف پس‌زمینه آپلود تصاویر
    onStep?.('۶/۶ بررسی صف همگام‌سازی و صف پس‌زمینه آپلود تصاویر...');
    const pendingCount = Object.keys(pendingCloudValues).length;
    const inFlightCount = Object.keys(pendingCloudRequests).length;
    const failedKeys = Object.keys(failedCloudRetryQueue);
    const localQueueStatus: CloudDiagnosticCheckStatus = failedKeys.length > 0 ? 'warn' : 'pass';

    checks.push({
      id: 'local_payload_and_queue',
      title: 'صف همگام‌سازی Supabase و صف پس‌زمینه تصاویر',
      category: 'traffic',
      status: localQueueStatus,
      latencyMs: null,
      summary:
        failedKeys.length > 0
          ? `${failedKeys.length.toLocaleString('fa-IR')} جدول در صف تلاش مجدد ارسال قرار دارند.`
          : `بدون محدودیت ۴.۵MB سرور — تمام ${localSummary.presentKeysCount.toLocaleString('fa-IR')} جدول محلی آماده و صف خطا خالی است.`,
      details: [
        `حجم کل جداول در مرورگر (UTF-8): ${Math.round(localSummary.totalBytesUtf8 / 1024).toLocaleString('fa-IR')} کیلوبایت`,
        `در انتظار ارسال: ${pendingCount.toLocaleString('fa-IR')} | در حال ارسال: ${inFlightCount.toLocaleString('fa-IR')} | صف خطا: ${failedKeys.length.toLocaleString('fa-IR')}`,
        `صف پس‌زمینه تصاویر WebP: ${backgroundAvatarStats.queued.toLocaleString('fa-IR')} در صف | ${backgroundAvatarStats.completed.toLocaleString('fa-IR')} تکمیل‌شده`,
      ],
    });
    if (failedKeys.length > 0) {
      recommendations.push(
        `در حال حاضر ${failedKeys.length.toLocaleString('fa-IR')} مورد در صف خطای ارسال قرار دارد؛ با کلیک روی «ارسال مجدد صف معوق» صف را تخلیه کنید.`
      );
    }

    const totalDurationMs = Math.round(
      (typeof performance !== 'undefined' ? performance.now() : Date.now()) - overallStartedAt
    );
    const hasFail = checks.some((c) => c.status === 'fail');
    const hasWarn = checks.some((c) => c.status === 'warn');
    const overallStatus: CloudDiagnosticCheckStatus = hasFail ? 'fail' : hasWarn ? 'warn' : 'pass';

    if (recommendations.length === 0) {
      recommendations.push('اتصال به پایگاه داده Supabase، فضای ذخیره‌سازی avatars و تمام صف‌های همگام‌سازی در وضعیت کاملاً مطلوب قرار دارند.');
    }

    return {
      checkedAt: new Date().toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      overallStatus,
      totalDurationMs,
      apiBaseUrl: SUPABASE_URL,
      serverHealthy,
      dbName,
      serverCounts,
      serverRevision,
      serverUpdatedAt,
      throughputKbps,
      manifestKeysCount,
      manifestTotalBytes,
      missingOnServerKeys,
      oversizedOnServerKeys,
      localSummary,
      checks,
      recommendations,
    };
  },

  // -------------------------------------------------------------
  // تالار گفتگوی عمومی، پیام‌رسان دانشجویی و تالارها/گروه‌های تخصصی تحت نظارت
  // -------------------------------------------------------------
  getCommunityChatSettings: (): CommunityChatSettings => {
    const raw = get<Partial<CommunityChatSettings>>(
      STORAGE_KEYS.COMMUNITY_CHAT_SETTINGS,
      DEFAULT_COMMUNITY_CHAT_SETTINGS
    );
    return {
      ...DEFAULT_COMMUNITY_CHAT_SETTINGS,
      ...raw,
      bannedKeywords: Array.isArray(raw?.bannedKeywords)
        ? raw.bannedKeywords
        : DEFAULT_COMMUNITY_CHAT_SETTINGS.bannedKeywords,
      rulesText:
        typeof raw?.rulesText === 'string' && raw.rulesText.trim()
          ? raw.rulesText
          : DEFAULT_COMMUNITY_CHAT_SETTINGS.rulesText,
    };
  },

  setCommunityChatSettings: (
    next: CommunityChatSettings,
    actorName = 'مدیر کل سامانه'
  ): boolean => {
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const payload: CommunityChatSettings = {
      ...DEFAULT_COMMUNITY_CHAT_SETTINGS,
      ...next,
      updatedAt: nowStr,
      updatedBy: actorName,
    };
    const ok = set(STORAGE_KEYS.COMMUNITY_CHAT_SETTINGS, payload);
    Storage.addActivityLog({
      category: 'community_chat',
      action: 'بروزرسانی تنظیمات پیام‌رسان و تالارهای گفتگو',
      details: `تنظیمات سامانه چت (کل سامانه: ${payload.isChatSystemEnabled ? 'باز' : 'بسته'} | تالار عمومی: ${
        payload.isPublicForumOpen ? 'باز' : 'بسته'
      } | چت خصوصی: ${payload.isPrivateChatEnabled ? 'باز' : 'بسته'} | عکس تالار: ${
        payload.allowPhotosInForums ? 'مجاز' : 'ممنوع'
      } | استیکر: ${payload.allowStickers ? 'مجاز' : 'ممنوع'}) توسط ${actorName} ذخیره شد.`,
      targetName: 'تنظیمات پیام‌رسان',
      severity: 'info',
    });
    return ok;
  },

  getCommunityForums: (): CommunityForum[] => {
    const list = get<CommunityForum[]>(STORAGE_KEYS.COMMUNITY_FORUMS, [INITIAL_PUBLIC_FORUM]);
    const safeList = Array.isArray(list) ? [...list] : [];
    const hasPublic = safeList.some((f) => f.id === PUBLIC_FORUM_ID || f.isPublicForum);
    if (!hasPublic) {
      safeList.unshift({ ...INITIAL_PUBLIC_FORUM });
    }
    return safeList;
  },

  setCommunityForums: (forums: CommunityForum[]): boolean => {
    const safeList = Array.isArray(forums) ? [...forums] : [];
    if (!safeList.some((f) => f.id === PUBLIC_FORUM_ID || f.isPublicForum)) {
      safeList.unshift({ ...INITIAL_PUBLIC_FORUM });
    }
    return set(STORAGE_KEYS.COMMUNITY_FORUMS, safeList);
  },

  getAllStaffChatDirectory: (): StaffChatDirectoryItem[] => {
    const items: StaffChatDirectoryItem[] = [
      {
        id: 'admin',
        fullName: 'مدیر کل سامانه',
        role: 'admin',
        roleLabel: 'مدیر کل سامانه',
        department: 'مدیریت کل پردیس',
      },
      ...Storage.getViceDeanStaff()
        .filter((s) => s.status !== 'inactive' && s.isActive !== false)
        .map((s) => ({
          id: s.id,
          fullName: s.fullName,
          role: 'vice_dean',
          roleLabel: 'معاونت دانشجویی',
          department: s.department || 'معاونت دانشجویی',
          photoUrl: s.photoUrl,
        })),
      ...Storage.getSecurityStaff()
        .filter((s) => s.status !== 'inactive' && s.isActive !== false)
        .map((s) => ({
          id: s.id,
          fullName: s.fullName,
          role: 'security',
          roleLabel: 'حراست و انتظامات',
          department: s.department || 'حراست',
          photoUrl: s.photoUrl,
        })),
      ...Storage.getSupervisors().map((s) => ({
        id: s.id,
        fullName: s.fullName,
        role: 'supervisor',
        roleLabel: 'سرپرست سرا',
        department: 'سرپرستی سراهای دانشجویی',
        photoUrl: s.photoUrl,
      })),
      ...Storage.getStudentAffairsStaff()
        .filter((s) => s.status !== 'inactive' && s.isActive !== false)
        .map((s) => ({
          id: s.id,
          fullName: s.fullName,
          role: 'student_affairs',
          roleLabel: 'امور دانشجویی و تربیت بدنی',
          department: s.department || 'امور دانشجویی',
          photoUrl: s.photoUrl,
        })),
      ...Storage.getCulturalStaff()
        .filter((s) => s.status !== 'inactive' && s.isActive !== false)
        .map((s) => ({
          id: s.id,
          fullName: s.fullName,
          role: 'cultural',
          roleLabel: 'کارشناس امور فرهنگی',
          department: s.department || 'امور فرهنگی',
          photoUrl: s.photoUrl,
        })),
      ...Storage.getEducationStaff()
        .filter((s) => s.status !== 'inactive' && s.isActive !== false)
        .map((s) => {
          const fields = normalizeAssignedFieldsList(s.assignedFields);
          const roleLabel = getEducationStaffRoleLabel(s);
          const deptBase =
            s.department || (isEducationDepartmentHead(s) ? 'گروه آموزشی' : 'واحد آموزش');
          return {
            id: s.id,
            fullName: s.fullName,
            role: 'education',
            roleLabel,
            department: fields.length > 0 ? `${deptBase} (${fields.join('، ')})` : deptBase,
            photoUrl: s.photoUrl,
          };
        }),
      ...Storage.getCounselors()
        .filter((s) => s.status !== 'inactive' && s.isActive !== false)
        .map((s) => ({
          id: s.id,
          fullName: s.fullName,
          role: 'counselor',
          roleLabel: 'مرکز مشاوره',
          department: s.specialty || 'مرکز مشاوره',
          photoUrl: s.photoUrl,
        })),
      ...Storage.getFinanceStaff()
        .filter((s) => s.status !== 'inactive' && s.isActive !== false)
        .map((s) => ({
          id: s.id,
          fullName: s.fullName,
          role: 'finance',
          roleLabel: 'امور مالی و حسابداری',
          department: s.department || 'امور مالی',
          photoUrl: s.photoUrl,
        })),
      ...Storage.getLibraryStaff()
        .filter((s) => s.status !== 'inactive' && s.isActive !== false)
        .map((s) => ({
          id: s.id,
          fullName: s.fullName,
          role: 'library',
          roleLabel: 'کتابخانه و پژوهش',
          department: s.department || 'کتابخانه',
          photoUrl: s.photoUrl,
        })),
      ...Storage.getSmartCampusStaff()
        .filter((s) => s.status !== 'inactive' && s.isActive !== false)
        .map((s) => ({
          id: s.id,
          fullName: s.fullName,
          role: 'smart_campus',
          roleLabel: 'واحد هوشمندسازی',
          department: s.department || 'هوشمندسازی',
          photoUrl: s.photoUrl,
        })),
      ...Storage.getGraduationStaff()
        .filter((s) => s.status !== 'inactive' && s.isActive !== false)
        .map((s) => ({
          id: s.id,
          fullName: s.fullName,
          role: 'graduation',
          roleLabel: 'واحد فارغ‌التحصیلان',
          department: s.department || 'فارغ‌التحصیلان',
          photoUrl: s.photoUrl,
        })),
      ...Storage.getAcademicDeputyStaff()
        .filter((s) => s.status !== 'inactive' && s.isActive !== false)
        .map((s) => ({
          id: s.id,
          fullName: s.fullName,
          role: 'academic_deputy',
          roleLabel: 'معاونت آموزشی',
          department: s.department || 'معاونت آموزشی پردیس',
          photoUrl: s.photoUrl,
        })),
      ...Storage.getSchedProfessors()
        .filter((p) => p.isActive !== false)
        .map((p) => ({
          id: p.id,
          fullName: p.fullName,
          role: 'professor',
          roleLabel: 'استاد مدرس',
          department: p.departmentName || p.degreeFull || `کد استاد: ${p.professorCode}`,
          photoUrl: p.photoUrl,
        })),
      ...Storage.getMaintenanceStaff()
        .filter((s) => s.status !== 'inactive' && s.isActive !== false)
        .map((s) => ({
          id: s.id,
          fullName: s.fullName,
          role: 'maintenance',
          roleLabel: 'تأسیسات و فنی',
          department: s.specialty || 'تأسیسات و فنی',
          photoUrl: s.photoUrl,
        })),
      ...Storage.getWarehouseStaff()
        .filter((s) => s.status !== 'inactive' && s.isActive !== false)
        .map((s) => ({
          id: s.id,
          fullName: s.fullName,
          role: 'warehouse',
          roleLabel: 'انبار و تجهیزات',
          department: 'انبار و تجهیزات',
          photoUrl: s.photoUrl,
        })),
      ...Storage.getProcurementStaff()
        .filter((s) => s.status !== 'inactive' && s.isActive !== false)
        .map((s) => ({
          id: s.id,
          fullName: s.fullName,
          role: 'procurement',
          roleLabel: 'کارپردازی و خرید',
          department: s.department || 'کارپردازی',
          photoUrl: s.photoUrl,
        })),
    ];

    const seen = new Set<string>();
    return items.filter((item) => {
      const key = `${item.role}:${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  createCommunityForumRequest: (payload: {
    title: string;
    description: string;
    category: CommunityForumCategory;
    tags: string[];
    creatorId: string;
    creatorName: string;
    creatorRole: string;
    allowedFields: string[];
    allowedEntryTerms: string[];
    allowedResidence: CommunityResidenceScope;
    audienceType?: 'students_all' | 'staff_only';
    allowedStaffRoles?: string[];
    rulesAcceptedByCreator: boolean;
    directPublishByAdmin?: boolean;
  }): { success: boolean; message: string; forum?: CommunityForum } => {
    const settings = Storage.getCommunityChatSettings();
    const isAdmin = payload.creatorRole === 'admin';
    const isStaffOnly = payload.audienceType === 'staff_only' && payload.creatorRole !== 'student';

    if (!isAdmin && !settings.isChatSystemEnabled) {
      return { success: false, message: 'سامانه پیام‌رسان و تالارهای گفتگو در حال حاضر توسط مدیر بسته شده است.' };
    }
    if (isStaffOnly && !isAdmin && settings.isStaffChatEnabled === false) {
      return { success: false, message: 'ایجاد گروه و گفتگوی داخلی کارکنان در حال حاضر توسط مدیر غیرفعال شده است.' };
    }
    if (!isAdmin && !isStaffOnly && !settings.isGroupCreationEnabled) {
      return { success: false, message: 'ثبت درخواست ایجاد تالار تخصصی و گروه در حال حاضر توسط مدیر غیرفعال شده است.' };
    }
    if (!payload.rulesAcceptedByCreator) {
      return {
        success: false,
        message: 'مطالعه و پذیرش تعهدنامه قوانین (ممنوعیت مباحث سیاسی، توهین و تخلفات) الزامی است.',
      };
    }

    const title = payload.title.trim();
    const description = payload.description.trim();
    if (title.length < 3) {
      return { success: false, message: 'عنوان تالار یا گروه باید حداقل ۳ کاراکتر باشد.' };
    }
    if (description.length < 10) {
      return { success: false, message: 'توضیحات و هدف تشکیل تالار باید حداقل ۱۰ کاراکتر باشد.' };
    }

    if (payload.creatorRole === 'student') {
      const ban = Storage.getActiveStudentChatBan(payload.creatorId);
      if (ban) {
        return {
          success: false,
          message: `دسترسی شما به پیام‌رسان توسط ${ban.bannedByName} مسدود شده است. علت: ${ban.reason}`,
        };
      }
    }

    const cleanTags = Array.from(
      new Set(
        (payload.tags || [])
          .map((t) => t.replace(/^#+/, '').trim())
          .filter(Boolean)
          .slice(0, 8)
      )
    );

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const autoActive = Boolean((isAdmin && payload.directPublishByAdmin) || isStaffOnly);

    const newForum: CommunityForum = {
      id: makeUniqueId('forum'),
      title,
      description,
      category: payload.category || (isStaffOnly ? 'other' : 'scientific'),
      tags: cleanTags,
      creatorId: payload.creatorId,
      creatorName: payload.creatorName,
      creatorRole: payload.creatorRole,
      status: autoActive ? 'active' : 'pending',
      isClosed: false,
      adminApproval: autoActive
        ? { status: 'approved', byId: payload.creatorId, byName: isStaffOnly && !isAdmin ? 'تالار داخلی کارکنان (تأیید خودکار)' : payload.creatorName, at: nowStr }
        : { status: 'pending' },
      securityApproval: autoActive
        ? { status: 'approved', byId: 'system', byName: isStaffOnly ? 'گروه داخلی همکاران (تحت نظارت)' : 'ایجاد مستقیم توسط مدیر سامانه', at: nowStr }
        : { status: 'pending' },
      allowedFields: isStaffOnly
        ? []
        : Array.from(new Set((payload.allowedFields || []).map((x) => x.trim()).filter(Boolean))),
      allowedEntryTerms: isStaffOnly
        ? []
        : Array.from(new Set((payload.allowedEntryTerms || []).map((x) => x.trim()).filter(Boolean))),
      allowedResidence: isStaffOnly ? 'all' : payload.allowedResidence || 'all',
      audienceType: isStaffOnly ? 'staff_only' : 'students_all',
      allowedStaffRoles: isStaffOnly
        ? Array.from(new Set((payload.allowedStaffRoles || []).map((r) => r.trim()).filter(Boolean)))
        : undefined,
      memberIds: [payload.creatorId],
      rulesAcceptedByCreator: true,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    const list = Storage.getCommunityForums();
    Storage.setCommunityForums([list[0], newForum, ...list.slice(1)]);

    Storage.addActivityLog({
      category: 'community_chat',
      action: isStaffOnly
        ? 'ایجاد گروه / تالار گفتگوی ویژه کارکنان'
        : autoActive
        ? 'ایجاد تالار گفتگوی تخصصی توسط مدیر'
        : 'ثبت درخواست ایجاد تالار گفتگوی تخصصی',
      details: `${isStaffOnly ? 'گروه ویژه کارکنان' : 'تالار'} «${title}» توسط ${payload.creatorName} ثبت شد (${
        autoActive ? 'فعال و منتشر شده' : 'در انتظار تأیید مدیر و حراست'
      }).`,
      targetName: title,
      severity: 'info',
    });

    return {
      success: true,
      forum: newForum,
      message: isStaffOnly
        ? `گروه / تالار ویژه کارکنان «${title}» با موفقیت ایجاد و برای همکاران مجاز فعال شد.`
        : autoActive
        ? `تالار تخصصی «${title}» با موفقیت ایجاد و برای دانشجویان واجد شرایط فعال شد.`
        : `درخواست ایجاد تالار «${title}» ثبت شد و پس از تأیید «مدیر سامانه» و «واحد حراست» به‌صورت رسمی فعال و قابل مشاهده خواهد شد.`,
    };
  },

  reviewCommunityForumRequest: (
    forumId: string,
    payload: {
      reviewerRole: 'admin' | 'security';
      reviewerId: string;
      reviewerName: string;
      decision: 'approved' | 'rejected';
      note?: string;
    }
  ): { success: boolean; message: string; forum?: CommunityForum } => {
    const list = Storage.getCommunityForums();
    const idx = list.findIndex((f) => f.id === forumId);
    if (idx === -1) return { success: false, message: 'تالار مورد نظر یافت نشد.' };

    const cur = list[idx];
    if (cur.isPublicForum || cur.id === PUBLIC_FORUM_ID) {
      return { success: false, message: 'تالار گفتگوی عمومی نیازی به بررسی تأیید ندارد.' };
    }

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const note = (payload.note || '').trim();
    if (payload.decision === 'rejected' && !note) {
      return { success: false, message: 'در صورت رد درخواست تالار، وارد کردن علت الزامی است.' };
    }

    const nextAdmin =
      payload.reviewerRole === 'admin'
        ? {
            status: payload.decision,
            byId: payload.reviewerId,
            byName: payload.reviewerName,
            at: nowStr,
            note: note || undefined,
          }
        : cur.adminApproval;

    const nextSecurity =
      payload.reviewerRole === 'security'
        ? {
            status: payload.decision,
            byId: payload.reviewerId,
            byName: payload.reviewerName,
            at: nowStr,
            note: note || undefined,
          }
        : cur.securityApproval;

    let nextStatus: CommunityForum['status'] = 'pending';
    if (nextAdmin.status === 'rejected' || nextSecurity.status === 'rejected') {
      nextStatus = 'rejected';
    } else if (nextAdmin.status === 'approved' && nextSecurity.status === 'approved') {
      nextStatus = 'active';
    } else {
      nextStatus = 'pending';
    }

    const updated: CommunityForum = {
      ...cur,
      adminApproval: nextAdmin,
      securityApproval: nextSecurity,
      status: nextStatus,
      updatedAt: nowStr,
    };

    list[idx] = updated;
    Storage.setCommunityForums(list);

    const roleTitle = payload.reviewerRole === 'admin' ? 'مدیر سامانه' : 'واحد حراست';
    Storage.addActivityLog({
      category: 'community_chat',
      action:
        payload.decision === 'approved'
          ? `تأیید تالار تخصصی توسط ${roleTitle}`
          : `رد درخواست تالار تخصصی توسط ${roleTitle}`,
      details: `تالار «${cur.title}» توسط ${payload.reviewerName} (${roleTitle}) ${
        payload.decision === 'approved' ? 'تأیید' : 'رد'
      } شد. وضعیت فعلی: ${
        nextStatus === 'active'
          ? 'فعال و منتشر شده'
          : nextStatus === 'rejected'
          ? 'رد شده'
          : 'در انتظار تأیید مرجع دوم'
      }.${note ? ` (${note})` : ''}`,
      targetName: cur.title,
      severity: payload.decision === 'rejected' ? 'warning' : 'info',
    });

    return {
      success: true,
      forum: updated,
      message:
        nextStatus === 'active'
          ? `تالار «${cur.title}» با تأیید هر دو مرجع (مدیر و حراست) اکنون فعال و برای دانشجویان واجد شرایط قابل ورود است.`
          : nextStatus === 'rejected'
          ? `درخواست تالار «${cur.title}» رد شد.`
          : `تأیید ${roleTitle} ثبت شد. پس از تأیید ${
              payload.reviewerRole === 'admin' ? 'واحد حراست' : 'مدیر سامانه'
            }، تالار فعال خواهد شد.`,
    };
  },

  toggleCommunityForumLock: (
    forumId: string,
    payload: { isClosed: boolean; actorName: string; reason?: string }
  ): { success: boolean; message: string } => {
    const list = Storage.getCommunityForums();
    const idx = list.findIndex((f) => f.id === forumId);
    if (idx === -1) return { success: false, message: 'تالار یافت نشد.' };

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    list[idx] = {
      ...list[idx],
      isClosed: payload.isClosed,
      closedBy: payload.isClosed ? payload.actorName : undefined,
      closedReason: payload.isClosed ? (payload.reason || '').trim() || undefined : undefined,
      updatedAt: nowStr,
    };
    Storage.setCommunityForums(list);

    // همگام‌سازی خودکار با تنظیم تالار گفتگوی عمومی
    if (forumId === PUBLIC_FORUM_ID) {
      const curSettings = Storage.getCommunityChatSettings();
      if (curSettings.isPublicForumOpen === payload.isClosed) {
        Storage.setCommunityChatSettings(
          { ...curSettings, isPublicForumOpen: !payload.isClosed },
          payload.actorName
        );
      }
    }

    return {
      success: true,
      message: payload.isClosed
        ? `ارسال پیام در «${list[idx].title}» بسته شد.`
        : `ارسال پیام در «${list[idx].title}» مجدداً باز شد.`,
    };
  },

  updateCommunityForumStatus: (
    forumId: string,
    status: 'active' | 'suspended' | 'rejected',
    actorName: string
  ): { success: boolean; message: string } => {
    if (forumId === PUBLIC_FORUM_ID) {
      return { success: false, message: 'تالار عمومی قابل تعلیق نیست؛ می‌توانید ارسال پیام آن را ببندید.' };
    }
    const list = Storage.getCommunityForums();
    const idx = list.findIndex((f) => f.id === forumId);
    if (idx === -1) return { success: false, message: 'تالار یافت نشد.' };
    list[idx] = {
      ...list[idx],
      status,
      updatedAt: new Date().toLocaleDateString('fa-IR'),
    };
    Storage.setCommunityForums(list);
    Storage.addActivityLog({
      category: 'community_chat',
      action: `تغییر وضعیت تالار «${list[idx].title}»`,
      details: `وضعیت تالار به ${status === 'active' ? 'فعال' : status === 'suspended' ? 'معلق/مسدود' : 'رد شده'} توسط ${actorName} تغییر یافت.`,
      targetName: list[idx].title,
      severity: status === 'suspended' ? 'warning' : 'info',
    });
    return {
      success: true,
      message: `وضعیت تالار «${list[idx].title}» بروزرسانی شد.`,
    };
  },

  joinCommunityForum: (forumId: string, studentId: string): { success: boolean; message: string } => {
    const list = Storage.getCommunityForums();
    const idx = list.findIndex((f) => f.id === forumId);
    if (idx === -1) return { success: false, message: 'تالار یافت نشد.' };
    if (list[idx].status !== 'active') {
      return { success: false, message: 'این تالار هنوز فعال نشده است.' };
    }
    const members = Array.isArray(list[idx].memberIds) ? list[idx].memberIds : [];
    if (!members.includes(studentId)) {
      list[idx] = { ...list[idx], memberIds: [...members, studentId] };
      Storage.setCommunityForums(list);
    }
    return { success: true, message: `عضویت شما در «${list[idx].title}» ثبت شد.` };
  },

  leaveCommunityForum: (forumId: string, studentId: string): { success: boolean; message: string } => {
    const list = Storage.getCommunityForums();
    const idx = list.findIndex((f) => f.id === forumId);
    if (idx === -1) return { success: false, message: 'تالار یافت نشد.' };
    list[idx] = {
      ...list[idx],
      memberIds: (list[idx].memberIds || []).filter((id) => id !== studentId),
    };
    Storage.setCommunityForums(list);
    return { success: true, message: `از تالار «${list[idx].title}» خارج شدید.` };
  },

  deleteCommunityForum: (forumId: string, actorName: string): { success: boolean; message: string } => {
    if (forumId === PUBLIC_FORUM_ID) {
      return { success: false, message: 'تالار گفتگوی عمومی قابل حذف نیست.' };
    }
    const list = Storage.getCommunityForums();
    const target = list.find((f) => f.id === forumId);
    if (!target) return { success: false, message: 'تالار یافت نشد.' };
    Storage.setCommunityForums(list.filter((f) => f.id !== forumId));
    const msgs = Storage.getCommunityChatMessages();
    Storage.setCommunityChatMessages(msgs.filter((m) => m.roomId !== forumId));
    Storage.addActivityLog({
      category: 'community_chat',
      action: 'حذف تالار گفتگوی تخصصی',
      details: `تالار «${target.title}» و پیام‌های آن توسط ${actorName} حذف شد.`,
      targetName: target.title,
      severity: 'warning',
    });
    return { success: true, message: `تالار «${target.title}» با موفقیت حذف شد.` };
  },

  getCommunityChatMessages: (): CommunityChatMessage[] => {
    const list = get<CommunityChatMessage[]>(STORAGE_KEYS.COMMUNITY_CHAT_MESSAGES, []);
    return Array.isArray(list) ? list : [];
  },

  setCommunityChatMessages: (messages: CommunityChatMessage[]): boolean => {
    // نگهداری حداکثر 1200 پیام آخر برای حفظ سرعت و حجم بهینه
    const trimmed = Array.isArray(messages) ? messages.slice(-1200) : [];
    return set(STORAGE_KEYS.COMMUNITY_CHAT_MESSAGES, trimmed);
  },

  sendCommunityChatMessage: (payload: {
    id?: string;
    roomType: CommunityChatRoomType;
    roomId: string;
    dmParticipants?: [string, string];
    dmParticipantNames?: [string, string];
    senderId: string;
    senderName: string;
    senderRole: string;
    senderFieldOfStudy?: string;
    senderAvatarUrl?: string;
    text: string;
    imageUrl?: string;
    audioUrl?: string;
    audioDurationSec?: number;
    stickerId?: string;
    replyToId?: string;
    replyToSenderName?: string;
    replyToText?: string;
    isModeratorMessage?: boolean;
    isWarningMessage?: boolean;
    isAnonymousStudent?: boolean;
    anonymousAlias?: string;
  }): { success: boolean; message: string; chatMessage?: CommunityChatMessage } => {
    const settings = Storage.getCommunityChatSettings();
    const isMod =
      payload.senderRole === 'admin' ||
      payload.senderRole === 'security' ||
      payload.senderRole === 'vice_dean';
    const isStaffDm = payload.roomType === 'dm' && isStaffDmRoomId(payload.roomId);
    const isAnonDm = payload.roomType === 'dm' && isAnonymousDmRoomId(payload.roomId);
    const anonTargetRole = isAnonDm ? getAnonymousDmTargetRole(payload.roomId) : null;

    const cleanText = (payload.text || '').trim();
    const hasImage = Boolean(payload.imageUrl);
    const hasAudio = Boolean(payload.audioUrl);
    const hasSticker = Boolean(payload.stickerId);

    if (!cleanText && !hasImage && !hasSticker && !hasAudio) {
      return { success: false, message: 'متن پیام، صوت، استیکر یا تصویر را وارد نمایید.' };
    }
    if (cleanText.length > 1500) {
      return { success: false, message: 'حداکثر طول مجاز هر پیام ۱۵۰۰ کاراکتر است.' };
    }

    // بررسی قوانین سراسری برای کاربران غیرناظر
    if (!isMod) {
      if (!settings.isChatSystemEnabled) {
        return {
          success: false,
          message: 'سامانه پیام‌رسان و تالارهای گفتگو هم‌اکنون توسط مدیر سامانه بسته شده است.',
        };
      }

      if (payload.roomType === 'public') {
        const pubForum = Storage.getCommunityForums().find((f) => f.id === PUBLIC_FORUM_ID);
        if (!settings.isPublicForumOpen || pubForum?.isClosed) {
          return {
            success: false,
            message: 'ارسال پیام در تالار گفتگوی عمومی توسط مدیر سامانه بسته شده است.',
          };
        }
      }

      if (payload.roomType === 'forum') {
        const forum = Storage.getCommunityForums().find((f) => f.id === payload.roomId);
        if (!forum || forum.status !== 'active') {
          return { success: false, message: 'این تالار فعال نیست یا به تأیید کامل نرسیده است.' };
        }
        if (forum.audienceType === 'staff_only' && payload.senderRole === 'student') {
          return { success: false, message: 'این تالار صرفاً ویژه کارکنان دانشگاه است.' };
        }
        if (forum.isClosed) {
          return {
            success: false,
            message: `ارسال پیام در این تالار توسط ${forum.closedBy || 'مدیریت'} موقتاً بسته شده است.`,
          };
        }
      }

      if (payload.roomType === 'dm') {
        if (isAnonDm) {
          if (anonTargetRole === 'counselor' && !settings.allowAnonymousCounselorChat) {
            return {
              success: false,
              message: 'امکان چت ناشناس دانشجو با مشاوران هم‌اکنون توسط مدیر سامانه فعال نشده است.',
            };
          }
          if (anonTargetRole === 'supervisor' && !settings.allowAnonymousSupervisorChat) {
            return {
              success: false,
              message: 'امکان چت ناشناس دانشجو با سرپرستان سراها هم‌اکنون توسط مدیر سامانه فعال نشده است.',
            };
          }
          if (
            payload.senderRole !== 'student' &&
            payload.senderRole !== anonTargetRole &&
            payload.senderRole !== 'admin'
          ) {
            return {
              success: false,
              message: 'این گفتگوی ناشناس صرفاً میان دانشجو و مشاور/سرپرست مخاطب برقرار است.',
            };
          }
        } else if (isStaffDm) {
          if (payload.senderRole === 'student') {
            return { success: false, message: 'این گفتگوی خصوصی ویژه کارکنان است.' };
          }
          if (settings.isStaffChatEnabled === false) {
            return {
              success: false,
              message: 'امکان گفتگوی خصوصی کارکنان هم‌اکنون توسط مدیر سامانه بسته شده است.',
            };
          }
        } else {
          if (!settings.isPrivateChatEnabled) {
            return {
              success: false,
              message: 'امکان ارسال پیام خصوصی بین دانشجویان هم‌اکنون توسط مدیر سامانه بسته شده است.',
            };
          }
          if (payload.dmParticipants) {
            const [p1, p2] = payload.dmParticipants;
            if (Storage.isStudentBlockedBetween(p1, p2)) {
              return {
                success: false,
                message: 'امکان ارسال پیام در این گفتگوی خصوصی وجود ندارد (یکی از طرفین دیگری را مسدود کرده است).',
              };
            }
          }
        }
      }

      // بررسی مسدودیت دانشجو توسط مدیر/حراست
      if (payload.senderRole === 'student') {
        const ban = Storage.getActiveStudentChatBan(payload.senderId);
        if (ban) {
          const blockedHere =
            ban.scope === 'all' ||
            (ban.scope === 'private_only' && payload.roomType === 'dm') ||
            (ban.scope === 'forums_only' && payload.roomType !== 'dm');
          if (blockedHere) {
            return {
              success: false,
              message: `امکان ارسال پیام برای شما توسط ${ban.bannedByName} مسدود شده است. علت: ${ban.reason}`,
            };
          }
        }
      }

      // بررسی مجوز ارسال تصویر، صوت و استیکر
      if (hasImage && !isStaffDm) {
        if (payload.roomType === 'dm' && !settings.allowPhotosInPrivateChat) {
          return {
            success: false,
            message: 'ارسال عکس در گفتگوی خصوصی توسط مدیر سامانه غیرفعال است.',
          };
        }
        if (payload.roomType !== 'dm' && !settings.allowPhotosInForums) {
          return {
            success: false,
            message: 'ارسال عکس در تالارها و گروه‌ها صرفاً با فعال‌سازی و مجوز مدیر سامانه امکان‌پذیر است.',
          };
        }
      }

      if (hasAudio && settings.allowVoiceMessages === false) {
        return {
          success: false,
          message: 'ارسال پیام صوتی در حال حاضر توسط مدیر سامانه غیرفعال است.',
        };
      }

      if (hasSticker && !settings.allowStickers && !isStaffDm) {
        return {
          success: false,
          message: 'ارسال استیکر در حال حاضر توسط مدیر سامانه غیرفعال است.',
        };
      }

      // فیلتر هوشمند کلمات ممنوعه
      if (cleanText && settings.bannedKeywords.length > 0) {
        const normalizedText = normalizePersianSearch(cleanText);
        const hitWord = settings.bannedKeywords.find((kw) => {
          const cleanKw = normalizePersianSearch(kw);
          return cleanKw.length >= 2 && normalizedText.includes(cleanKw);
        });
        if (hitWord) {
          Storage.addActivityLog({
            category: 'community_chat',
            action: 'مسدودسازی خودکار پیام حاوی واژه غیرمجاز',
            details: `تلاش کاربر ${payload.senderName} (${payload.senderId}) برای ارسال پیام حاوی واژه فیلترشده در اتاق ${payload.roomId} مسدود شد.`,
            targetName: payload.senderName,
            severity: 'warning',
          });
          return {
            success: false,
            message: 'پیام شما به دلیل مغایرت با فیلتر واژگان مجاز و ضوابط اخلاقی سامانه ارسال نشد.',
          };
        }
      }
    }

    const existingList = Storage.getCommunityChatMessages();
    const msgId = payload.id || makeUniqueId('cmsg');
    if (existingList.some((m) => m.id === msgId)) {
      return { success: true, message: 'پیام ثبت شده است.' };
    }

    const nowDate = new Date();
    const nowStr = `${nowDate.toLocaleDateString('fa-IR')} - ${nowDate.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const safeAvatar =
      payload.senderAvatarUrl && !isBase64ImageDataUrl(payload.senderAvatarUrl)
        ? payload.senderAvatarUrl
        : undefined;

    const newMsg: CommunityChatMessage = {
      id: msgId,
      roomType: payload.roomType,
      roomId: payload.roomId,
      dmParticipants: payload.dmParticipants,
      dmParticipantNames: payload.dmParticipantNames,
      senderId: payload.senderId,
      senderName: payload.senderName,
      senderRole: payload.senderRole,
      senderFieldOfStudy: payload.senderFieldOfStudy,
      senderAvatarUrl: safeAvatar,
      text: cleanText,
      imageUrl: payload.imageUrl,
      audioUrl: payload.audioUrl,
      audioDurationSec: payload.audioDurationSec,
      stickerId: payload.stickerId,
      replyToId: payload.replyToId,
      replyToSenderName: payload.replyToSenderName,
      replyToText: payload.replyToText ? payload.replyToText.slice(0, 140) : undefined,
      isModeratorMessage: Boolean(isMod && (payload.isModeratorMessage || payload.isWarningMessage)),
      isWarningMessage: Boolean(isMod && payload.isWarningMessage),
      isAnonymousStudent: Boolean(isAnonDm && payload.senderRole === 'student'),
      anonymousAlias:
        isAnonDm && payload.senderRole === 'student'
          ? payload.anonymousAlias || getAnonymousStudentAlias(payload.senderId)
          : undefined,
      createdAt: nowStr,
      createdAtIso: nowDate.toISOString(),
    };

    Storage.setCommunityChatMessages([...existingList, newMsg]);

    if (newMsg.isWarningMessage) {
      Storage.addActivityLog({
        category: 'community_chat',
        action: 'ثبت اخطار رسمی ناظر در گفتگو',
        details: `${payload.senderName} در اتاق ${payload.roomId} اخطار رسمی ثبت کرد: «${cleanText.slice(0, 120)}»`,
        targetName: payload.roomId,
        severity: 'warning',
      });
    }

    return { success: true, message: 'پیام ارسال شد.', chatMessage: newMsg };
  },

  deleteCommunityChatMessage: (
    messageId: string,
    payload: { actorName: string; reason?: string }
  ): { success: boolean; message: string } => {
    const list = Storage.getCommunityChatMessages();
    const idx = list.findIndex((m) => m.id === messageId);
    if (idx === -1) return { success: false, message: 'پیام یافت نشد.' };

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    list[idx] = {
      ...list[idx],
      isDeleted: true,
      deletedBy: payload.actorName,
      deletedAt: nowStr,
      deleteReason: (payload.reason || '').trim() || 'حذف‌شده توسط ناظر سامانه به دلیل مغایرت با قوانین',
      text: '',
      imageUrl: undefined,
      audioUrl: undefined,
      audioDurationSec: undefined,
      stickerId: undefined,
    };
    Storage.setCommunityChatMessages(list);
    Storage.addActivityLog({
      category: 'community_chat',
      action: 'حذف پیام توسط ناظر پیام‌رسان',
      details: `پیام کاربر ${list[idx].senderName} توسط ${payload.actorName} حذف شد.`,
      targetName: list[idx].senderName,
      severity: 'warning',
    });
    return { success: true, message: 'پیام با موفقیت حذف و از دید کاربران مخفی شد.' };
  },

  editCommunityChatMessage: (
    messageId: string,
    payload: { editorId: string; editorRole: string; editorName: string; newText: string }
  ): { success: boolean; message: string; chatMessage?: CommunityChatMessage } => {
    const list = Storage.getCommunityChatMessages();
    const idx = list.findIndex((m) => m.id === messageId);
    if (idx === -1) return { success: false, message: 'پیام مورد نظر یافت نشد.' };

    const target = list[idx];
    if (target.isDeleted) {
      return { success: false, message: 'پیام حذف‌شده قابل ویرایش نیست.' };
    }
    if (target.senderId !== payload.editorId || target.senderRole !== payload.editorRole) {
      return { success: false, message: 'فقط فرستنده پیام مجاز به ویرایش پیام خود است.' };
    }

    const cleanText = (payload.newText || '').trim();
    if (!cleanText && !target.imageUrl && !target.stickerId && !target.audioUrl) {
      return { success: false, message: 'متن پیام نمی‌تواند خالی باشد.' };
    }
    if (cleanText.length > 1500) {
      return { success: false, message: 'حداکثر طول مجاز پیام ۱۵۰۰ کاراکتر است.' };
    }

    const isMod =
      payload.editorRole === 'admin' ||
      payload.editorRole === 'security' ||
      payload.editorRole === 'vice_dean';
    const settings = Storage.getCommunityChatSettings();

    if (!isMod) {
      if (!settings.isChatSystemEnabled) {
        return { success: false, message: 'سامانه پیام‌رسان هم‌اکنون توسط مدیر بسته شده است.' };
      }
      if (payload.editorRole === 'student') {
        const ban = Storage.getActiveStudentChatBan(payload.editorId);
        if (ban) {
          return {
            success: false,
            message: `به دلیل مسدودیت فعال، امکان ویرایش پیام ندارید. علت: ${ban.reason}`,
          };
        }
      }
      if (cleanText && settings.bannedKeywords.length > 0) {
        const normalizedText = normalizePersianSearch(cleanText);
        const hitWord = settings.bannedKeywords.find((kw) => {
          const cleanKw = normalizePersianSearch(kw);
          return cleanKw.length >= 2 && normalizedText.includes(cleanKw);
        });
        if (hitWord) {
          return {
            success: false,
            message: 'متن ویرایش‌شده حاوی واژه غیرمجاز است و ثبت نشد.',
          };
        }
      }
    }

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const updated: CommunityChatMessage = {
      ...target,
      text: cleanText,
      isEdited: true,
      editedAt: nowStr,
    };
    list[idx] = updated;
    Storage.setCommunityChatMessages(list);
    return { success: true, message: 'پیام با موفقیت ویرایش شد.', chatMessage: updated };
  },

  deleteOwnCommunityChatMessage: (
    messageId: string,
    payload: { actorId: string; actorRole: string }
  ): { success: boolean; message: string } => {
    const list = Storage.getCommunityChatMessages();
    const target = list.find((m) => m.id === messageId);
    if (!target) return { success: false, message: 'پیام یافت نشد.' };

    const isAdmin = payload.actorRole === 'admin';
    const isOwner = target.senderId === payload.actorId && target.senderRole === payload.actorRole;
    if (!isOwner && !isAdmin) {
      return { success: false, message: 'شما فقط مجاز به حذف پیام‌های خود هستید.' };
    }

    // حذف فیزیکی کامل از حافظه و دیتابیس برای جلوگیری از ایجاد بار اضافی
    Storage.setCommunityChatMessages(list.filter((m) => m.id !== messageId));
    return { success: true, message: 'پیام به‌طور کامل حذف شد.' };
  },

  clearCommunityRoomMessages: (
    roomId: string,
    payload: { actorName: string; roomTitle?: string }
  ): { success: boolean; removedCount: number; message: string } => {
    const list = Storage.getCommunityChatMessages();
    const remaining = list.filter((m) => m.roomId !== roomId);
    const removedCount = list.length - remaining.length;
    Storage.setCommunityChatMessages(remaining);

    // پاکسازی گزارش‌های مرتبط با پیام‌های حذف‌شده این اتاق
    const reports = Storage.getCommunityChatReports();
    const remainingReports = reports.filter((r) => r.roomId !== roomId);
    if (remainingReports.length !== reports.length) {
      Storage.setCommunityChatReports(remainingReports);
    }

    Storage.addActivityLog({
      category: 'community_chat',
      action: 'پاکسازی کامل پیام‌های گفتگو/تالار توسط مدیر',
      details: `${removedCount.toLocaleString('fa-IR')} پیام از «${payload.roomTitle || roomId}» توسط ${payload.actorName} پاکسازی شد.`,
      targetName: payload.roomTitle || roomId,
      severity: 'warning',
    });

    return {
      success: true,
      removedCount,
      message:
        removedCount > 0
          ? `${removedCount.toLocaleString('fa-IR')} پیام از «${payload.roomTitle || 'این گفتگو'}» به‌طور کامل پاکسازی شد.`
          : 'این گفتگو پیامی برای پاکسازی نداشت.',
    };
  },

  purgeCommunityChatData: (
    scope:
      | 'public_messages'
      | 'all_dm_messages'
      | 'all_messages'
      | 'all_specialized_forums'
      | 'all_chat_and_forums',
    actorName: string
  ): { success: boolean; message: string } => {
    const msgs = Storage.getCommunityChatMessages();
    const forums = Storage.getCommunityForums();
    const reports = Storage.getCommunityChatReports();

    if (scope === 'public_messages') {
      const remaining = msgs.filter((m) => m.roomId !== PUBLIC_FORUM_ID && m.roomType !== 'public');
      const count = msgs.length - remaining.length;
      Storage.setCommunityChatMessages(remaining);
      Storage.setCommunityChatReports(reports.filter((r) => r.roomId !== PUBLIC_FORUM_ID));
      Storage.addActivityLog({
        category: 'community_chat',
        action: 'پاکسازی پیام‌های تالار گفتگوی عمومی',
        details: `${count.toLocaleString('fa-IR')} پیام تالار عمومی توسط ${actorName} پاکسازی شد.`,
        targetName: 'تالار گفتگوی عمومی',
        severity: 'warning',
      });
      return {
        success: true,
        message: `${count.toLocaleString('fa-IR')} پیام از تالار گفتگوی عمومی به‌طور کامل پاک شد.`,
      };
    }

    if (scope === 'all_dm_messages') {
      const remaining = msgs.filter((m) => m.roomType !== 'dm');
      const count = msgs.length - remaining.length;
      Storage.setCommunityChatMessages(remaining);
      Storage.setCommunityChatReports(reports.filter((r) => r.roomType !== 'dm'));
      Storage.addActivityLog({
        category: 'community_chat',
        action: 'پاکسازی کامل تمام چت‌های خصوصی دانشجویان',
        details: `${count.toLocaleString('fa-IR')} پیام از چت‌های خصوصی توسط ${actorName} حذف شد.`,
        targetName: 'چت‌های خصوصی',
        severity: 'warning',
      });
      return {
        success: true,
        message: `کل چت‌های خصوصی دانشجویان (${count.toLocaleString('fa-IR')} پیام) به‌طور کامل حذف شد.`,
      };
    }

    if (scope === 'all_messages') {
      const count = msgs.length;
      Storage.setCommunityChatMessages([]);
      Storage.setCommunityChatReports([]);
      Storage.addActivityLog({
        category: 'community_chat',
        action: 'پاکسازی تمام پیام‌های همه چت‌ها و تالارها',
        details: `تمامی ${count.toLocaleString('fa-IR')} پیام پیام‌رسان و تالارها توسط ${actorName} پاکسازی شد.`,
        targetName: 'کل پیام‌های چت',
        severity: 'critical',
      });
      return {
        success: true,
        message: `تمامی ${count.toLocaleString('fa-IR')} پیام در کل تالارها و چت‌های خصوصی با موفقیت پاکسازی شد.`,
      };
    }

    if (scope === 'all_specialized_forums') {
      const specializedCount = forums.filter((f) => !f.isPublicForum && f.id !== PUBLIC_FORUM_ID).length;
      const publicOnly = forums.filter((f) => f.isPublicForum || f.id === PUBLIC_FORUM_ID);
      Storage.setCommunityForums(publicOnly.length > 0 ? publicOnly : [{ ...INITIAL_PUBLIC_FORUM }]);
      const remainingMsgs = msgs.filter((m) => m.roomType !== 'forum');
      const removedMsgs = msgs.length - remainingMsgs.length;
      Storage.setCommunityChatMessages(remainingMsgs);
      Storage.setCommunityChatReports(reports.filter((r) => r.roomType !== 'forum'));
      Storage.addActivityLog({
        category: 'community_chat',
        action: 'حذف کامل تمام تالارها و گروه‌های تخصصی',
        details: `${specializedCount.toLocaleString('fa-IR')} تالار تخصصی و ${removedMsgs.toLocaleString('fa-IR')} پیام مرتبط توسط ${actorName} حذف شد.`,
        targetName: 'تالارهای تخصصی',
        severity: 'critical',
      });
      return {
        success: true,
        message: `${specializedCount.toLocaleString('fa-IR')} تالار/گروه تخصصی همراه با ${removedMsgs.toLocaleString('fa-IR')} پیام مرتبط به‌طور کامل حذف شد.`,
      };
    }

    // all_chat_and_forums: پاکسازی کامل کل پیام‌ها، کل تالارهای تخصصی و گزارش‌ها
    const specializedCount = forums.filter((f) => !f.isPublicForum && f.id !== PUBLIC_FORUM_ID).length;
    const totalMsgs = msgs.length;
    const publicOnly = forums.filter((f) => f.isPublicForum || f.id === PUBLIC_FORUM_ID);
    Storage.setCommunityForums(publicOnly.length > 0 ? publicOnly : [{ ...INITIAL_PUBLIC_FORUM }]);
    Storage.setCommunityChatMessages([]);
    Storage.setCommunityChatReports([]);
    Storage.addActivityLog({
      category: 'community_chat',
      action: 'پاکسازی و تخلیه کامل دیتابیس پیام‌رسان و تالارها',
      details: `${totalMsgs.toLocaleString('fa-IR')} پیام و ${specializedCount.toLocaleString('fa-IR')} تالار تخصصی توسط ${actorName} برای آزادسازی فضای سرور پاکسازی شد.`,
      targetName: 'کل فضای پیام‌رسان',
      severity: 'critical',
    });
    return {
      success: true,
      message: `پاکسازی کامل انجام شد: ${totalMsgs.toLocaleString('fa-IR')} پیام و ${specializedCount.toLocaleString('fa-IR')} تالار تخصصی حذف و فضای دیتابیس آزاد گردید.`,
    };
  },

  getCommunityChatBans: (): CommunityChatBan[] => {
    const list = get<CommunityChatBan[]>(STORAGE_KEYS.COMMUNITY_CHAT_BANS, []);
    return Array.isArray(list) ? list : [];
  },

  setCommunityChatBans: (bans: CommunityChatBan[]): boolean =>
    set(STORAGE_KEYS.COMMUNITY_CHAT_BANS, Array.isArray(bans) ? bans : []),

  getActiveStudentChatBan: (studentId: string): CommunityChatBan | undefined => {
    const clean = normalizeAsciiDigits(studentId).trim();
    return Storage.getCommunityChatBans().find(
      (b) => b.isActive && normalizeAsciiDigits(b.studentId).trim() === clean
    );
  },

  banStudentFromChat: (payload: {
    studentId: string;
    studentName: string;
    studentFieldOfStudy?: string;
    reason: string;
    scope: 'all' | 'private_only' | 'forums_only';
    bannedById: string;
    bannedByName: string;
    bannedByRole: 'admin' | 'security' | 'vice_dean';
  }): { success: boolean; message: string } => {
    const reason = (payload.reason || '').trim();
    if (!reason) {
      return { success: false, message: 'لطفاً علت مسدودسازی دانشجو را وارد کنید.' };
    }
    const cleanId = normalizeAsciiDigits(payload.studentId).trim();
    const list = Storage.getCommunityChatBans().map((b) =>
      normalizeAsciiDigits(b.studentId).trim() === cleanId && b.isActive
        ? { ...b, isActive: false }
        : b
    );
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const ban: CommunityChatBan = {
      id: makeUniqueId('cban'),
      studentId: cleanId,
      studentName: payload.studentName,
      studentFieldOfStudy: payload.studentFieldOfStudy,
      reason,
      scope: payload.scope || 'all',
      bannedById: payload.bannedById,
      bannedByName: payload.bannedByName,
      bannedByRole: payload.bannedByRole,
      createdAt: nowStr,
      isActive: true,
    };
    Storage.setCommunityChatBans([ban, ...list]);
    Storage.addActivityLog({
      category: 'community_chat',
      action: 'مسدودسازی دانشجو در پیام‌رسان و تالارها',
      details: `دسترسی ${payload.studentName} (${cleanId}) توسط ${payload.bannedByName} مسدود شد. علت: ${reason}`,
      targetName: payload.studentName,
      severity: 'critical',
    });
    return {
      success: true,
      message: `دسترسی «${payload.studentName}» در پیام‌رسان با موفقیت مسدود شد.`,
    };
  },

  unbanStudentFromChat: (banId: string, actorName: string): { success: boolean; message: string } => {
    const list = Storage.getCommunityChatBans();
    const idx = list.findIndex((b) => b.id === banId);
    if (idx === -1) return { success: false, message: 'رکورد مسدودیت یافت نشد.' };
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    list[idx] = {
      ...list[idx],
      isActive: false,
      unbannedAt: nowStr,
      unbannedBy: actorName,
    };
    Storage.setCommunityChatBans(list);
    Storage.addActivityLog({
      category: 'community_chat',
      action: 'رفع مسدودیت دانشجو در پیام‌رسان',
      details: `مسدودیت ${list[idx].studentName} (${list[idx].studentId}) توسط ${actorName} رفع شد.`,
      targetName: list[idx].studentName,
      severity: 'info',
    });
    return {
      success: true,
      message: `مسدودیت «${list[idx].studentName}» با موفقیت رفع شد.`,
    };
  },

  getCommunityChatReports: (): CommunityChatReport[] => {
    const list = get<CommunityChatReport[]>(STORAGE_KEYS.COMMUNITY_CHAT_REPORTS, []);
    return Array.isArray(list) ? list : [];
  },

  setCommunityChatReports: (reports: CommunityChatReport[]): boolean =>
    set(STORAGE_KEYS.COMMUNITY_CHAT_REPORTS, Array.isArray(reports) ? reports : []),

  reportCommunityChatMessage: (payload: {
    message: CommunityChatMessage;
    roomTitle: string;
    reportedById: string;
    reportedByName: string;
    reason: string;
  }): { success: boolean; message: string } => {
    const reason = (payload.reason || '').trim();
    if (!reason) return { success: false, message: 'لطفاً علت گزارش تخلف را وارد کنید.' };
    const list = Storage.getCommunityChatReports();
    const duplicate = list.some(
      (r) =>
        r.messageId === payload.message.id &&
        r.reportedById === payload.reportedById &&
        r.status === 'pending'
    );
    if (duplicate) {
      return { success: false, message: 'شما قبلاً این پیام را گزارش کرده‌اید و در دست بررسی است.' };
    }
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const report: CommunityChatReport = {
      id: makeUniqueId('crep'),
      messageId: payload.message.id,
      roomId: payload.message.roomId,
      roomType: payload.message.roomType,
      roomTitle: payload.roomTitle,
      offenderId: payload.message.senderId,
      offenderName: payload.message.senderName,
      messageText: payload.message.text || (payload.message.imageUrl ? '[تصویر پیوست]' : '[استیکر]'),
      messageImageUrl: payload.message.imageUrl,
      reportedById: payload.reportedById,
      reportedByName: payload.reportedByName,
      reason,
      status: 'pending',
      createdAt: nowStr,
    };
    Storage.setCommunityChatReports([report, ...list]);
    Storage.addActivityLog({
      category: 'community_chat',
      action: 'ثبت گزارش تخلف در پیام‌رسان دانشجویی',
      details: `${payload.reportedByName} پیام ${payload.message.senderName} در «${payload.roomTitle}» را گزارش کرد: ${reason}`,
      targetName: payload.message.senderName,
      severity: 'warning',
    });
    return {
      success: true,
      message: 'گزارش تخلف با موفقیت برای مدیر سامانه، معاونت دانشجویی و واحد حراست ارسال شد.',
    };
  },

  resolveCommunityChatReport: (
    reportId: string,
    payload: { status: 'reviewed' | 'dismissed'; reviewerName: string; reviewNote?: string }
  ): { success: boolean; message: string } => {
    const list = Storage.getCommunityChatReports();
    const idx = list.findIndex((r) => r.id === reportId);
    if (idx === -1) return { success: false, message: 'گزارش یافت نشد.' };
    const nowStr = `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    list[idx] = {
      ...list[idx],
      status: payload.status,
      reviewedBy: payload.reviewerName,
      reviewedAt: nowStr,
      reviewNote: (payload.reviewNote || '').trim() || undefined,
    };
    Storage.setCommunityChatReports(list);
    return { success: true, message: 'وضعیت گزارش تخلف بروزرسانی شد.' };
  },

  getCommunityUserPrefs: (): CommunityUserChatPrefs => {
    const raw = get<Partial<CommunityUserChatPrefs>>(STORAGE_KEYS.COMMUNITY_USER_PREFS, {
      rulesAcceptedUserIds: [],
      blockedByUser: {},
    });
    return {
      rulesAcceptedUserIds: Array.isArray(raw?.rulesAcceptedUserIds) ? raw.rulesAcceptedUserIds : [],
      blockedByUser:
        raw?.blockedByUser && typeof raw.blockedByUser === 'object' ? raw.blockedByUser : {},
    };
  },

  acceptCommunityChatRules: (userId: string): boolean => {
    const prefs = Storage.getCommunityUserPrefs();
    if (!prefs.rulesAcceptedUserIds.includes(userId)) {
      prefs.rulesAcceptedUserIds = [...prefs.rulesAcceptedUserIds, userId];
      return set(STORAGE_KEYS.COMMUNITY_USER_PREFS, prefs);
    }
    return true;
  },

  hasAcceptedCommunityChatRules: (userId: string): boolean => {
    const prefs = Storage.getCommunityUserPrefs();
    return prefs.rulesAcceptedUserIds.includes(userId);
  },

  toggleBlockStudentInChat: (
    myStudentId: string,
    targetStudentId: string
  ): { blocked: boolean; message: string } => {
    const prefs = Storage.getCommunityUserPrefs();
    const myList = Array.isArray(prefs.blockedByUser[myStudentId])
      ? [...prefs.blockedByUser[myStudentId]]
      : [];
    const exists = myList.includes(targetStudentId);
    const nextList = exists
      ? myList.filter((id) => id !== targetStudentId)
      : [...myList, targetStudentId];
    prefs.blockedByUser = { ...prefs.blockedByUser, [myStudentId]: nextList };
    set(STORAGE_KEYS.COMMUNITY_USER_PREFS, prefs);
    return {
      blocked: !exists,
      message: !exists
        ? 'این دانشجو مسدود شد و دیگر امکان ارسال پیام خصوصی به شما را نخواهد داشت.'
        : 'مسدودیت شخصی این دانشجو برداشته شد.',
    };
  },

  isStudentBlockedBetween: (studentIdA: string, studentIdB: string): boolean => {
    const prefs = Storage.getCommunityUserPrefs();
    const aBlocked = prefs.blockedByUser[studentIdA] || [];
    const bBlocked = prefs.blockedByUser[studentIdB] || [];
    return aBlocked.includes(studentIdB) || bBlocked.includes(studentIdA);
  },

  /**
   * جستجوی امن و حریم‌خصوصی‌محور دانشجو صرفاً بر اساس «شماره دانشجویی» جهت شروع چت خصوصی
   * (هرگز شماره تماس، کد ملی یا اطلاعات محرمانه بازگردانده نمی‌شود)
   */
  lookupStudentPublicProfileById: async (
    rawStudentId: string
  ): Promise<{ found: boolean; profile?: PublicStudentChatProfile; error?: string }> => {
    const cleanId = normalizeAsciiDigits(rawStudentId).trim();
    if (!cleanId || cleanId.length < 4) {
      return { found: false, error: 'لطفاً شماره دانشجویی معتبر وارد کنید.' };
    }

    const toPublicProfile = (st: Student): PublicStudentChatProfile => ({
      studentId: st.studentId,
      fullName: st.fullName,
      fieldOfStudy: st.fieldOfStudy || 'نامشخص',
      entryTerm: st.entryTerm || 'نامشخص',
      isDormResident: isStudentDormResident(st),
      dormId: st.assignedDormId,
      photoUrl: st.photoUrl && !isBase64ImageDataUrl(st.photoUrl) ? st.photoUrl : undefined,
      admissionStatus: getStudentAdmissionStatus(st),
    });

    const localMatch = Storage.getStudents().find(
      (s) => normalizeAsciiDigits(s.studentId).trim() === cleanId
    );
    if (localMatch) {
      return { found: true, profile: toPublicProfile(localMatch) };
    }

    try {
      const remoteRes = await Storage.fetchSingleStudentFromDB({ studentId: cleanId });
      if (remoteRes.ok && remoteRes.student) {
        return { found: true, profile: toPublicProfile(remoteRes.student) };
      }
      if (!remoteRes.ok) {
        return { found: false, error: 'خطا در برقراری ارتباط با سرور برای استعلام شماره دانشجویی.' };
      }
      return { found: false, error: 'دانشجویی با این شماره دانشجویی در سامانه یافت نشد.' };
    } catch {
      return { found: false, error: 'خطای شبکه در استعلام شماره دانشجویی.' };
    }
  },

  makeCommunityDmRoomId: (studentIdA: string, studentIdB: string): string =>
    makeDmRoomId(studentIdA, studentIdB),

  // -------------------------------------------------------------
  // سیستم چت آنلاین دو به دو / چندنفره و تالارهای مشترک معاونت آموزش
  // -------------------------------------------------------------
  getAcademicChatRoleLabel: (role: AcademicChatMemberRole): string => {
    switch (role) {
      case 'academic_deputy':
        return 'معاون آموزشی';
      case 'department_head':
        return 'مدیر گروه آموزشی';
      case 'education_expert':
        return 'کارشناس آموزش';
      case 'graduation':
        return 'کارشناس واحد فارغ‌التحصیلان';
      case 'admin':
      default:
        return 'مدیر کل سامانه';
    }
  },

  getAcademicChatParticipants: (): AcademicChatParticipant[] => {
    const list: AcademicChatParticipant[] = [];
    const seenIds = new Set<string>();

    const pushItem = (item: AcademicChatParticipant) => {
      if (!item.id || seenIds.has(item.id)) return;
      seenIds.add(item.id);
      list.push(item);
    };

    const deputies = Storage.getAcademicDeputyStaff().filter(
      (a) => a.status !== 'inactive' && a.isActive !== false
    );
    for (const d of deputies) {
      pushItem({
        id: d.id,
        name: d.fullName,
        role: 'academic_deputy',
        roleLabel: d.title || 'معاون آموزشی',
        department: d.department || 'معاونت آموزشی پردیس',
        photoUrl: d.photoUrl,
      });
    }

    const eduList = Storage.getEducationStaff().filter(
      (e) => e.status !== 'inactive' && e.isActive !== false
    );
    for (const e of eduList) {
      const isHead = isEducationDepartmentHead(e);
      pushItem({
        id: e.id,
        name: e.fullName,
        role: isHead ? 'department_head' : 'education_expert',
        roleLabel: getEducationStaffRoleLabel(e),
        assignedFields: normalizeAssignedFieldsList(e.assignedFields),
        department: e.department,
        photoUrl: e.photoUrl,
      });
    }

    const gradList = Storage.getGraduationStaff().filter(
      (g) => g.status !== 'inactive' && g.isActive !== false
    );
    for (const g of gradList) {
      pushItem({
        id: g.id,
        name: g.fullName,
        role: 'graduation',
        roleLabel: 'کارشناس واحد فارغ‌التحصیلان',
        department: g.department || 'واحد فارغ‌التحصیلان',
        photoUrl: g.photoUrl,
      });
    }

    pushItem({
      id: 'admin',
      name: 'مدیر کل سامانه',
      role: 'admin',
      roleLabel: 'مدیر کل سامانه',
      department: 'مدیریت کل',
    });

    return list;
  },

  getAcademicChatRooms: (): AcademicChatRoom[] => {
    const stored = get<AcademicChatRoom[]>(STORAGE_KEYS.ACADEMIC_CHAT_ROOMS, []);
    const defaultForum: AcademicChatRoom = {
      id: 'forum_academic_general_curriculum',
      type: 'forum',
      title: 'تالار مشترک هماهنگی برنامه درسی و مسائل آموزشی معاونت',
      description:
        'تالار گفتگوی عمومی میان معاونت آموزشی، مدیران گروه، کارشناسان آموزش و کارشناسان فارغ‌التحصیلان برای طرح مسائل برنامه درسی، کمبود کلاس/استاد، سرفصل‌ها و پیشنهادات.',
      topic: 'curriculum',
      creatorId: 'system',
      creatorName: 'معاونت آموزشی',
      creatorRoleLabel: 'تالار پیش‌فرض معاونت',
      memberIds: [],
      isPinned: true,
      createdAt: new Date().toLocaleDateString('fa-IR'),
      createdAtIso: '2026-01-01T00:00:00.000Z',
      updatedAtIso: '2026-01-01T00:00:00.000Z',
    };
    if (!Array.isArray(stored) || stored.length === 0) {
      return [defaultForum];
    }
    return stored;
  },

  setAcademicChatRooms: (rooms: AcademicChatRoom[]): boolean => {
    return set(STORAGE_KEYS.ACADEMIC_CHAT_ROOMS, rooms);
  },

  upsertAcademicChatRoom: (room: AcademicChatRoom): AcademicChatRoom[] => {
    const current = [...Storage.getAcademicChatRooms()];
    const idx = current.findIndex(
      (r) =>
        r.id === room.id ||
        (room.type === 'dm' && room.dmPairKey && r.type === 'dm' && r.dmPairKey === room.dmPairKey)
    );
    if (idx !== -1) {
      const mergedMemberIds = Array.from(
        new Set([...(current[idx].memberIds || []), ...(room.memberIds || [])])
      );
      current[idx] = {
        ...current[idx],
        ...room,
        memberIds: mergedMemberIds,
      };
    } else {
      current.push(room);
    }
    Storage.setAcademicChatRooms(current);
    return current;
  },

  createOrGetAcademicDmRoom: (
    actor: { id: string; name: string; role: AcademicChatMemberRole },
    target: AcademicChatParticipant
  ): { room: AcademicChatRoom; created: boolean } => {
    const pairKey = [actor.id, target.id].sort().join('__');
    const existing = Storage.getAcademicChatRooms().find(
      (r) => r.type === 'dm' && (r.dmPairKey === pairKey || r.id === `adm_${pairKey}`)
    );
    if (existing) {
      return { room: existing, created: false };
    }
    const nowIso = new Date().toISOString();
    const room: AcademicChatRoom = {
      id: `adm_${pairKey}`,
      type: 'dm',
      title: `${actor.name} و ${target.name}`,
      creatorId: actor.id,
      creatorName: actor.name,
      creatorRoleLabel: Storage.getAcademicChatRoleLabel(actor.role),
      memberIds: [actor.id, target.id],
      dmPairKey: pairKey,
      createdAt: new Date().toLocaleDateString('fa-IR'),
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    };
    Storage.upsertAcademicChatRoom(room);
    return { room, created: true };
  },

  createAcademicGroupRoom: (params: {
    title: string;
    description?: string;
    creator: { id: string; name: string; role: AcademicChatMemberRole };
    memberIds: string[];
  }): AcademicChatRoom => {
    const nowIso = new Date().toISOString();
    const cleanMembers = Array.from(new Set([params.creator.id, ...params.memberIds].filter(Boolean)));
    const room: AcademicChatRoom = {
      id: makeUniqueId('acgrp'),
      type: 'group',
      title: params.title.trim(),
      description: params.description?.trim() || undefined,
      creatorId: params.creator.id,
      creatorName: params.creator.name,
      creatorRoleLabel: Storage.getAcademicChatRoleLabel(params.creator.role),
      memberIds: cleanMembers,
      createdAt: new Date().toLocaleDateString('fa-IR'),
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    };
    Storage.upsertAcademicChatRoom(room);
    return room;
  },

  createAcademicSharedForum: (params: {
    title: string;
    description?: string;
    topic: AcademicChatForumTopic;
    isPinned?: boolean;
    creator: { id: string; name: string; role: AcademicChatMemberRole };
  }): AcademicChatRoom => {
    const nowIso = new Date().toISOString();
    const room: AcademicChatRoom = {
      id: makeUniqueId('acfrm'),
      type: 'forum',
      title: params.title.trim(),
      description: params.description?.trim() || undefined,
      topic: params.topic,
      creatorId: params.creator.id,
      creatorName: params.creator.name,
      creatorRoleLabel: Storage.getAcademicChatRoleLabel(params.creator.role),
      memberIds: [],
      isPinned: Boolean(params.isPinned),
      createdAt: new Date().toLocaleDateString('fa-IR'),
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    };
    Storage.upsertAcademicChatRoom(room);
    return room;
  },

  updateAcademicGroupMembers: (roomId: string, nextMemberIds: string[]): AcademicChatRoom | null => {
    const rooms = [...Storage.getAcademicChatRooms()];
    const idx = rooms.findIndex((r) => r.id === roomId && r.type === 'group');
    if (idx === -1) return null;
    const clean = Array.from(new Set([rooms[idx].creatorId, ...nextMemberIds].filter(Boolean)));
    rooms[idx] = {
      ...rooms[idx],
      memberIds: clean,
      updatedAtIso: new Date().toISOString(),
    };
    Storage.setAcademicChatRooms(rooms);
    return rooms[idx];
  },

  togglePinAcademicForum: (roomId: string): AcademicChatRoom | null => {
    const rooms = [...Storage.getAcademicChatRooms()];
    const idx = rooms.findIndex((r) => r.id === roomId && r.type === 'forum');
    if (idx === -1) return null;
    rooms[idx] = {
      ...rooms[idx],
      isPinned: !rooms[idx].isPinned,
    };
    Storage.setAcademicChatRooms(rooms);
    return rooms[idx];
  },

  getAcademicChatMessages: (): AcademicChatMessage[] => {
    return get<AcademicChatMessage[]>(STORAGE_KEYS.ACADEMIC_CHAT_MESSAGES, []);
  },

  setAcademicChatMessages: (messages: AcademicChatMessage[]): boolean => {
    return set(STORAGE_KEYS.ACADEMIC_CHAT_MESSAGES, messages);
  },

  upsertAcademicChatMessage: (msg: AcademicChatMessage): AcademicChatMessage[] => {
    const current = [...Storage.getAcademicChatMessages()];
    const idx = current.findIndex((m) => m.id === msg.id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...msg };
    } else {
      current.push(msg);
      const rooms = [...Storage.getAcademicChatRooms()];
      const rIdx = rooms.findIndex((r) => r.id === msg.roomId);
      if (rIdx !== -1 && (!rooms[rIdx].updatedAtIso || msg.createdAtIso > rooms[rIdx].updatedAtIso)) {
        rooms[rIdx] = { ...rooms[rIdx], updatedAtIso: msg.createdAtIso };
        Storage.setAcademicChatRooms(rooms);
      }
    }
    current.sort((a, b) => (a.createdAtIso || '').localeCompare(b.createdAtIso || ''));
    Storage.setAcademicChatMessages(current);
    return current;
  },

  sendAcademicChatMessage: (params: {
    roomId: string;
    sender: {
      id: string;
      name: string;
      role: AcademicChatMemberRole;
      assignedFields?: string[];
    };
    text: string;
    issueTag?: string;
    replyTo?: { id: string; senderName: string; text: string };
  }): AcademicChatMessage => {
    const nowIso = new Date().toISOString();
    const nowFa = new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    }) + ' • ' + new Date().toLocaleDateString('fa-IR');

    // اطمینان از ثبت اتاق (از جمله تالار پیش‌فرض) در فهرست ذخیره‌شده
    const rooms = [...Storage.getAcademicChatRooms()];
    const roomIdx = rooms.findIndex((r) => r.id === params.roomId);
    if (roomIdx !== -1) {
      rooms[roomIdx] = { ...rooms[roomIdx], updatedAtIso: nowIso };
      Storage.setAcademicChatRooms(rooms);
    }

    const msg: AcademicChatMessage = {
      id: makeUniqueId('acmsg'),
      roomId: params.roomId,
      senderId: params.sender.id,
      senderName: params.sender.name,
      senderRole: params.sender.role,
      senderRoleLabel: Storage.getAcademicChatRoleLabel(params.sender.role),
      senderFields: params.sender.assignedFields?.length ? params.sender.assignedFields : undefined,
      text: params.text.trim(),
      issueTag: params.issueTag?.trim() || undefined,
      replyToId: params.replyTo?.id,
      replyToSenderName: params.replyTo?.senderName,
      replyToText: params.replyTo?.text ? params.replyTo.text.slice(0, 120) : undefined,
      createdAt: nowFa,
      createdAtIso: nowIso,
    };

    const current = [...Storage.getAcademicChatMessages(), msg];
    Storage.setAcademicChatMessages(current);
    return msg;
  },

  editAcademicChatMessage: (messageId: string, newText: string): AcademicChatMessage | null => {
    const current = [...Storage.getAcademicChatMessages()];
    const idx = current.findIndex((m) => m.id === messageId);
    if (idx === -1) return null;
    const editedAt =
      new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) +
      ' • ' +
      new Date().toLocaleDateString('fa-IR');
    current[idx] = {
      ...current[idx],
      text: newText.trim(),
      isEdited: true,
      editedAt,
    };
    Storage.setAcademicChatMessages(current);
    return current[idx];
  },

  deleteAcademicChatMessage: (messageId: string): boolean => {
    const current = Storage.getAcademicChatMessages();
    const next = current.filter((m) => m.id !== messageId);
    if (next.length === current.length) return false;
    Storage.setAcademicChatMessages(next);
    return true;
  },

  // -------------------------------------------------------------
  // سیستم حضور و غیاب و تردد بارکدی دانشجویان خوابگاهی
  // (پیش‌فرض: همه دانشجویان خوابگاهی در سرا حضور دارند)
  // -------------------------------------------------------------
  getDormAttendanceStates: (): DormAttendanceStateRecord[] =>
    get<DormAttendanceStateRecord[]>(STORAGE_KEYS.DORM_ATTENDANCE_STATES, []),

  setDormAttendanceStates: (items: DormAttendanceStateRecord[]): boolean =>
    set(STORAGE_KEYS.DORM_ATTENDANCE_STATES, items),

  getDormAttendanceLogs: (): DormAttendanceLogEntry[] =>
    get<DormAttendanceLogEntry[]>(STORAGE_KEYS.DORM_ATTENDANCE_LOGS, []),

  setDormAttendanceLogs: (items: DormAttendanceLogEntry[]): boolean =>
    set(STORAGE_KEYS.DORM_ATTENDANCE_LOGS, items),

  recordDormAttendanceChange: (params: {
    student: Student;
    dormName: string;
    roomNumber?: string;
    bedLabel?: string;
    nextStatus: DormAttendanceStatus;
    method: DormAttendanceScanMethod;
    scannedCode?: string;
    actionLabel: string;
    actorId: string;
    actorName: string;
    actorRole: 'admin' | 'supervisor';
    jalaliDate: string;
    timeLabel: string;
    leaveUntilDate?: string;
    note?: string;
  }): {
    previousStatus: DormAttendanceStatus;
    stateRecord: DormAttendanceStateRecord;
    logEntry: DormAttendanceLogEntry;
  } => {
    const nowIso = new Date().toISOString();
    const states = Storage.getDormAttendanceStates();
    const existingIdx = states.findIndex((r) => r.studentId === params.student.studentId);
    const previousStatus: DormAttendanceStatus =
      existingIdx >= 0 ? states[existingIdx].status : 'present';

    const stateRecord: DormAttendanceStateRecord = {
      studentId: params.student.studentId,
      dormId: params.student.assignedDormId || '',
      roomId: params.student.assignedRoomId || undefined,
      status: params.nextStatus,
      lastBarcodeScanned: params.scannedCode || states[existingIdx]?.lastBarcodeScanned,
      lastUpdatedAt: nowIso,
      lastJalaliDate: params.jalaliDate,
      lastTimeLabel: params.timeLabel,
      updatedById: params.actorId,
      updatedByName: params.actorName,
      method: params.method,
      leaveUntilDate: params.nextStatus === 'leave' ? params.leaveUntilDate : undefined,
      note: params.note?.trim() || undefined,
    };

    const nextStates =
      existingIdx >= 0
        ? states.map((r, i) => (i === existingIdx ? stateRecord : r))
        : [...states, stateRecord];
    Storage.setDormAttendanceStates(nextStates);

    const logEntry: DormAttendanceLogEntry = {
      id: makeUniqueId('datt'),
      studentId: params.student.studentId,
      studentName: params.student.fullName,
      nationalId: params.student.nationalId,
      dormId: params.student.assignedDormId || '',
      dormName: params.dormName,
      roomNumber: params.roomNumber,
      bedLabel: params.bedLabel,
      previousStatus,
      nextStatus: params.nextStatus,
      actionLabel: params.actionLabel,
      method: params.method,
      scannedCode: params.scannedCode,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      timestamp: nowIso,
      jalaliDate: params.jalaliDate,
      timeLabel: params.timeLabel,
      leaveUntilDate: params.nextStatus === 'leave' ? params.leaveUntilDate : undefined,
      note: params.note?.trim() || undefined,
    };

    const logs = Storage.getDormAttendanceLogs();
    const nextLogs = [logEntry, ...logs].slice(0, 5000);
    Storage.setDormAttendanceLogs(nextLogs);

    return { previousStatus, stateRecord, logEntry };
  },

  resetDormAttendanceToDefault: (params: {
    students: Student[];
    dormMap: Map<string, string>;
    roomMap: Map<string, string>;
    actorId: string;
    actorName: string;
    actorRole: 'admin' | 'supervisor';
    jalaliDate: string;
    timeLabel: string;
    dormScopeLabel: string;
  }): number => {
    const targetIds = new Set(params.students.map((s) => s.studentId));
    if (targetIds.size === 0) return 0;

    const states = Storage.getDormAttendanceStates();
    const nowIso = new Date().toISOString();
    let changedCount = 0;
    const addedLogs: DormAttendanceLogEntry[] = [];

    const nextStates = states.filter((st) => !targetIds.has(st.studentId));
    states.forEach((st) => {
      if (targetIds.has(st.studentId) && st.status !== 'present') {
        const studentObj = params.students.find((s) => s.studentId === st.studentId);
        if (studentObj) {
          changedCount += 1;
          addedLogs.push({
            id: makeUniqueId('datt'),
            studentId: studentObj.studentId,
            studentName: studentObj.fullName,
            nationalId: studentObj.nationalId,
            dormId: studentObj.assignedDormId || '',
            dormName: params.dormMap.get(studentObj.assignedDormId || '') || 'سرا',
            roomNumber: studentObj.assignedRoomId
              ? params.roomMap.get(studentObj.assignedRoomId)
              : undefined,
            previousStatus: st.status,
            nextStatus: 'present',
            actionLabel: 'بازنشانی گروهی به پیش‌فرض (حاضر در سرا)',
            method: 'batch_reset',
            actorId: params.actorId,
            actorName: params.actorName,
            actorRole: params.actorRole,
            timestamp: nowIso,
            jalaliDate: params.jalaliDate,
            timeLabel: params.timeLabel,
          });
        }
      }
    });

    Storage.setDormAttendanceStates(nextStates);
    if (addedLogs.length > 0) {
      const logs = Storage.getDormAttendanceLogs();
      Storage.setDormAttendanceLogs([...addedLogs, ...logs].slice(0, 5000));
    }

    Storage.addActivityLog({
      category: 'settings',
      action: 'بازنشانی حضور و غیاب سراها به حالت پیش‌فرض',
      details: `وضعیت حضور ساکنان در محدوده «${params.dormScopeLabel}» به حالت پیش‌فرض (حاضر در سرا) بازنشانی شد (${changedCount} تغییر وضعیت).`,
      targetName: params.dormScopeLabel,
      actorName: params.actorName,
    });

    return changedCount;
  },
};






