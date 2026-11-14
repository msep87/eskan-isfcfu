export interface Student {
  studentId: string; // شماره دانشجویی
  nationalId: string; // کد ملی
  fullName: string;
  fieldOfStudy: string; // رشته تحصیلی
  entryTerm: string; // ترم ورود مثلاً ۴۰۲۱
  fatherName: string;
  birthDate: string;
  province: string; // استان محل سکونت
  city: string; // شهر محل سکونت
  phone: string; // تلفن ثابت
  mobile: string; // شماره همراه
  emergencyPhone: string; // شماره تماس ضروری
  parentPhone: string; // شماره والدین
  religion: string; // دین و مذهب
  postalAddress?: string; // نشانی دقیق پستی / محل سکونت
  previousDorm: string; // سرای سال قبل
  previousRoom: string; // اتاق سال قبل
  previousScore: number | string; // امتیاز سال قبل
  photoUrl?: string; // تصویر دانشجو
  avatarColor?: string;
  isProfileCompleted: boolean;
  assignedDormId?: string;
  assignedRoomId?: string;
  assignedBedId?: string;
  assignedDormName?: string; // نام سرای وارد شده از اکسل
  assignedRoomNumber?: string; // شماره اتاق وارد شده از اکسل
  assignedBedNumber?: string | number; // شماره تخت وارد شده از اکسل (فرد: پایین، زوج: بالا)
  assignmentStatus?: 'none' | 'temporary' | 'confirmed'; // وضعیت اسکان: موقت یا قطعی
  // ستون‌ها و فیلدهای سفارشی و پویا که از اکسل اضافه می‌شوند:
  customFields?: Record<string, string | number | boolean>;
}

export interface Dormitory {
  id: string;
  name: string; // نام سرا (مثلاً سرای شهید باهنر - بلوک ۱)
  campus: string; // پردیس (مثلاً پردیس شهید باهنر اصفهان، پردیس فاطمه الزهرا (س))
  gender: 'brothers' | 'sisters';
  totalFloors: number;
  description: string;
  address?: string;
  supervisorName?: string;
}

export interface Bed {
  id: string; // شناسه یکتا مثلاً "b101_1_lower"
  roomId: string;
  dormId: string;
  bunkNumber: number; // شماره تخت (مثلاً تخت ۱، ۲، ۳)
  bedNumber?: number; // شماره ترتیبی تخت در اتاق
  tier: 'lower' | 'upper'; // پایین یا بالا
  label: string; // مثلاً "تخت ۱ (طبقه پایین)"
  studentId?: string | null;
  assignmentStatus?: 'none' | 'temporary' | 'confirmed'; // وضعیت تخصیص: موقت یا قطعی
}

export interface Room {
  id: string;
  dormId: string;
  roomNumber: string; // مثلاً ۱۰۱
  floor: number; // طبقه (۰ = همکف، ۱ = اول، ...)
  capacity: number; // تعداد تخت (۴، ۶، ...)
  representativeStudentId?: string; // نماینده اتاق
  allowedFields?: string[]; // رشته‌های مجاز (خالی = همه رشته‌ها)
  allowedEntryTerms?: string[]; // ترم‌های ورود مجاز (خالی = همه ورودی‌ها)
  facilities: string[]; // امکانات اتاق (یخچال، بالکن، شوفاژ، کولر، کمد دیواری، میز مطالعه)
  notes?: string;
  status?: 'active' | 'maintenance' | 'inactive';
}

export interface RoomWarning {
  id: string;
  dormId: string;
  roomId: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical'; // عادی، اخطار، فوری
  date: string;
  supervisorName: string;
  resolved: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  targetDormId?: string; // 'all' یا شناسه خوابگاه خاص
  priority: 'normal' | 'important' | 'urgent';
  date: string;
  pinned?: boolean;
  showOnHomePage?: boolean; // انتشار در صفحه اول سایت جهت مشاهده عمومی و مراجعین
  imageUrl?: string; // تصویر یا پوستر ضمیمه شده به اطلاعیه (بیس۶۴ یا URL)
}

export type MessageCategory =
  | 'accommodation' // امور اسکان و انتخاب اتاق
  | 'maintenance' // خرابی تأسیسات و تعمیرات
  | 'services_cleaning' // خدمات، نظافت و بهداشت سرا
  | 'rights_violation' // عدم رعایت حقوق دیگران، سر و صدا و مزاحمت
  | 'social_personal' // آسیب‌های فردی و اجتماعی، ناسازگاری و مشاوره
  | 'counseling' // خدمات مشاوره، روانشناختی و سلامت روان مرکز
  | 'discipline' // نظم و انضباط سرا
  | 'request' // درخواست مرخصی و تردد
  | 'other'; // سایر امور

export interface MessageReply {
  id: string;
  senderName: string;
  senderRole: 'student' | 'supervisor' | 'admin' | 'maintenance' | 'warehouse' | 'counselor';
  content: string;
  date: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'supervisor' | 'admin' | 'maintenance' | 'warehouse' | 'counselor';
  receiverType: 'supervisor' | 'admin' | 'student' | 'maintenance' | 'warehouse' | 'counselor' | 'all';
  receiverId?: string;
  subject: string;
  content: string;
  category: MessageCategory;
  date: string;
  status: 'pending' | 'in_progress' | 'answered';
  replies: MessageReply[];
  isConfidential?: boolean; // گزارش محرمانه (فقط قابل رویت توسط سرپرست سرا، مشاور و مدیریت)
}

export interface Supervisor {
  id: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  assignedDormId?: string; // برای سازگاری با نسخه‌های قبل
  assignedDormIds?: string[]; // امکان انتصاب و نظارت بر چندین سرا
  role: 'supervisor';
}

export interface MaintenanceStaff {
  id: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  mobile?: string;
  specialty: string; // تخصص مانند: لوله‌کشی و موتورخانه، برق و روشنایی، نجاری و قفل، سرمایش/گرمایش
  assignedDormIds?: string[]; // سراهای تحت پوشش یا ['all']
  coveredDormIds?: string[]; // سراهای تحت پوشش
  role: 'maintenance';
  status: 'active' | 'inactive';
  isActive?: boolean;
  notes?: string;
}

export interface WarehouseStaff {
  id: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  mobile?: string;
  role: 'warehouse';
  status: 'active' | 'inactive';
  isActive?: boolean;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  code: string; // کد رهگیری کالا در انبار
  name: string; // نام قطعه یا قلم کالا
  category: 'plumbing' | 'electrical' | 'carpentry' | 'cleaning' | 'general';
  categoryLabel?: string;
  quantity: number; // موجودی فیزیکی انبار
  unit: string; // عدد، متر، قوطی، بسته، جفت
  minStockLevel: number; // حداقل موجودی هشدار
  unitPrice: number; // قیمت واحد به ریال
  location?: string; // قفسه و انبار
  lastRestockedDate?: string;
}

export interface WarehouseRequest {
  id: string;
  requestCode: string; // کد حواله مثلاً W-101
  taskId?: string; // پیوند به مأموریت تأسیساتی
  taskTrackingCode?: string;
  dormId: string;
  dormName: string;
  requestedByStaffId: string;
  requestedByStaffName: string;
  requestedByRole: 'maintenance' | 'supervisor' | 'admin';
  itemTitle: string; // نام قطعه یا موارد درخواستی
  inventoryItemId?: string;
  quantityRequested: number;
  unit: string;
  reason: string; // علت نیاز و محل مصرف
  urgency: 'normal' | 'urgent' | 'emergency';
  requestDate: string;
  status: 'pending_supervisor' | 'pending_warehouse' | 'issued' | 'rejected';
  supervisorApproved?: boolean;
  supervisorApprovedBy?: string;
  supervisorApprovedAt?: string;
  supervisorNotes?: string;
  issuedByStaffId?: string;
  issuedByStaffName?: string;
  issuedAt?: string;
  issuedQuantity?: number;
  unitPrice?: number;
  totalCost?: number;
  warehouseNotes?: string;
}

export interface MaintenanceTask {
  id: string;
  trackingCode: string; // کد رهگیری عددی یا ترکیبی مثلاً M-101
  title: string;
  description: string;
  dormId: string;
  dormName: string;
  roomNumber?: string;
  locationDetails?: string; // مثلاً راهرو، سرویس بهداشتی، آشپزخانه، موتورخانه، نمازخانه
  priority: 'normal' | 'urgent' | 'emergency'; // عادی، فوری، اضطراری
  category?: 'plumbing' | 'electrical' | 'carpentry' | 'facilities' | 'cleaning' | 'other' | string;
  source: 'student_report' | 'supervisor_observed' | 'admin_observed' | 'supervisor_direct'; // منبع گزارش خرابی
  sourceStudentId?: string;
  sourceStudentName?: string;
  sourceStudentPhone?: string;
  sourceMessageId?: string; // پیوند به تیکت/پیام دانشجو در صورت ارجاع
  createdById: string; // شناسه سرپرست یا مدیر ثبت‌کننده
  createdByName: string;
  createdByRole: 'supervisor' | 'admin';
  createdAt: string; // تاریخ و ساعت ثبت
  assignedToStaffId?: string; // شناسه تکنسین ارجاع شده
  assignedToStaffName?: string;
  assignedAt?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'waiting_parts' | 'parts_needed' | 'resolved' | 'closed' | 'cancelled';
  technicianNotes?: string; // توضیحات تکنسین و گزارش کار
  actionNotes?: string;
  resolvedAt?: string;
  cost?: number; // برآورد یا هزینه قطعات
  estimatedCost?: number;
  partsUsed?: string; // قطعات مصرفی
  partsReplaced?: string;
  supervisorVerified?: boolean; // تایید نهایی کیفیت کار توسط سرپرست سرا
  supervisorVerifiedAt?: string;
  supervisorVerificationNotes?: string;
  hasWarehouseRequisition?: boolean;
  warehouseRequestId?: string;
}

export interface CustomFont {
  id: string; // شناسه یکتا
  name: string; // نام نمایشی فونت (مثلاً ایران‌یکان، کلمه، ...)
  fontFamily: string; // نام فونت در CSS
  dataUrl: string; // محتوای بیس۶۴ فونت
  format: string; // فرمت truetype, woff, woff2, opentype
}

export interface AppSettings {
  selectionActive: boolean; // فعال بودن امکان انتخاب اتاق
  selectionStartDate: string; // تاریخ و ساعت شروع
  selectionEndDate: string; // تاریخ و ساعت پایان
  currentAcademicYear: string; // سال تحصیلی مثلاً ۱۴۰۳-۱۴۰۴
  currentSemester: string; // نیمسال تحصیلی
  universityName: string; // دانشگاه فرهنگیان اصفهان
  announcementBanner?: string;
  fontFamily: 'vazir' | 'shabnam' | 'sahel' | 'system' | string;
  fontSize: 'sm' | 'md' | 'lg';
  fontScale?: number; // درصد اندازه فونت‌ها نسبت به حالت پیش‌فرض (مثلاً 100، 120، 150)
  colorTheme: 'turquoise' | 'navy' | 'emerald' | 'amber' | 'violet';
  wallpaper: string; // کلید والپیپر یا آدرس URL دلخواه
  darkMode: boolean;
  adminPassword?: string; // رمز عبور مدیر سامانه
  customLogoUrl?: string; // تصویر آرم بارگذاری شده توسط مدیر سامانه
  customWallpaperUrl?: string; // عکس پس‌زمینه بارگذاری شده توسط مدیر
  customFonts?: CustomFont[]; // لیست فونت‌های بارگذاری شده توسط مدیر
  activeCustomFontId?: string; // شناسه فونت سفارشی فعال
}

export interface CounselorStaff {
  id: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  mobile?: string;
  specialty: string; // مشاوره فردی، بالینی، روانشناسی تربیتی، بهداشت روان
  educationLevel?: string; // دکتری روانشناسی، کارشناسی ارشد مشاوره
  roomNumber?: string; // اتاق مشاوره در پردیس / سرا
  campusName?: string; // پردیس شهید باهنر اصفهان / پردیس فاطمه‌الزهرا
  officeLocation?: string; // دفتر مشاوره
  assignedDormIds?: string[]; // سراهای تحت پوشش
  role: 'counselor';
  status: 'active' | 'inactive';
  isActive?: boolean;
  notes?: string;
}

export type CurrentUser =
  | { role: 'student'; student: Student }
  | { role: 'supervisor'; supervisor: Supervisor }
  | { role: 'admin'; name: string; username: string }
  | { role: 'maintenance'; technician: MaintenanceStaff }
  | { role: 'warehouse'; staff: WarehouseStaff }
  | { role: 'counselor'; counselor: CounselorStaff }
  | null;

export type DayOfWeek = 'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export interface SupervisorShiftSchedule {
  id: string;
  supervisorId: string;
  supervisorName: string;
  dormId: string;
  dormName: string;
  dayOfWeek: DayOfWeek | 'all'; // شنبه تا جمعه یا همه روزها
  shiftType: 'morning' | 'evening' | 'night' | 'full_day'; // صبح، عصر، شب، ۲۴ ساعته
  startTime?: string; // مثلاً ۰۷:۳۰
  endTime?: string; // مثلاً ۱۵:۳۰
  notes?: string;
  isEveryDay?: boolean; // اگر شیفتی تعیین نشود یعنی هر روز حضور دارند
}

export interface ShiftLogReport {
  id: string;
  reportCode: string; // کد رهگیری شیفت مثلاً SR-101
  supervisorId: string;
  supervisorName: string;
  dormId: string;
  dormName: string;
  shiftDate: string; // تاریخ شمسی حضور مثلاً ۱۴۰۵/۰۷/۱۵
  shiftType: 'morning' | 'evening' | 'night' | 'full_day';
  shiftTime?: string; // ساعت شروع و پایان
  inspectionsSummary: string; // گزارش بازرسی اتاق‌ها و وضعیت عمومی
  incidentsSummary?: string; // حوادث، موارد پزشکی یا انضباطی
  handoverNotes: string; // نکات تحویل به سرپرست شیفت بعدی
  presentStudentCount?: number; // تخمین حضور دانشجویان
  createdAt: string;
}

export interface CounselorShiftSchedule {
  id: string;
  counselorId: string;
  counselorName: string;
  campusOrDormName?: string; // مثلاً مرکز مشاوره پردیس باهنر یا سرای فارابی
  dormId?: string;
  dormName?: string;
  roomNumber?: string;
  dayOfWeek: DayOfWeek | 'all';
  date?: string; // تاریخ تقویمی در صورت شیفت روز معین
  startTime: string; // مثلاً ۱۴:۰۰
  endTime: string; // مثلاً ۱۸:۰۰
  shiftTitle?: string; // مثلاً مشاوره فردی و سلامت روان
  notes?: string;
}

export interface CounselorShiftReport {
  id: string;
  reportCode: string; // مثلاً CR-201
  counselorId: string;
  counselorName: string;
  date?: string; // تاریخ شمسی شیفت مثلاً ۱۴۰۵/۰۷/۱۶
  shiftDate?: string;
  dayOfWeek?: DayOfWeek | string;
  startTime?: string; // ساعت شروع شیفت
  endTime?: string; // ساعت پایان شیفت
  shiftTimeWindow?: string;
  location?: string; // محل خدمت: مرکز مشاوره پردیس یا سرای دانشجویی
  dormId?: string;
  dormName?: string;
  sessionsCount?: number; // تعداد جلسات مشاوره برگزار شده
  totalSessionsCount?: number;
  studentAttendeesCount?: number; // تعداد دانشجومعلمان حاضر
  urgentCasesCount?: number;
  caseTypes?: string[]; // ناسازگاری هم‌اتاقی، افت تحصیلی، اضطراب و استرس، دلتنگی، خانوادگی، آسیب‌های فردی
  caseCategories?: string[];
  summary?: string; // شرح تفصیلی اقدامات و مشاوره‌های ارائه‌شده
  interventionsSummary?: string;
  urgentReferrals?: string; // ارجاعات اورژانسی (روانپزشک، بهداری، مددکاری یا پیگیری مدیریت)
  urgentReferralDetails?: string;
  recommendationsForDorm?: string; // توصیه‌های کاربردی به سرپرستان خوابگاه
  recommendationsToAdmin?: string;
  createdAt: string;
}

export type ActivityLogCategory =
  | 'auth'
  | 'student'
  | 'accommodation'
  | 'dorm_structure'
  | 'staff'
  | 'maintenance'
  | 'warehouse'
  | 'warning_eval'
  | 'settings'
  | 'backup'
  | 'excel';

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO string برای مرتب‌سازی دقیق
  date: string; // تاریخ و ساعت شمسی خوانا
  actorName: string;
  actorRole: 'admin' | 'supervisor' | 'student' | 'maintenance' | 'warehouse' | 'counselor' | 'system';
  actorUsername?: string;
  category: ActivityLogCategory;
  action: string;
  details: string;
  targetName?: string;
  severity?: 'info' | 'warning' | 'critical';
}

export interface StudentEvaluation {
  id: string;
  studentId: string;
  studentName: string;
  dormId?: string;
  dormName?: string;
  roomId?: string;
  roomNumber?: string;
  type: 'evaluation' | 'notice' | 'warning' | 'report';
  scope: 'individual' | 'room';
  score?: number; // نمره ارزیابی بین ۰ تا ۱۰۰
  title: string;
  description: string;
  evaluatorName: string;
  evaluatorRole: 'admin' | 'supervisor';
  date: string;
  resolved?: boolean;
  resolvedAt?: string;
}
