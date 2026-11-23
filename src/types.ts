export type StudentResidenceType = 'dormitory' | 'commuter';

export type StudentAdmissionStatus = 'admitted' | 'not_admitted';

export type CommuterEligibilityReason =
  | 'isfahan_suburbs_30km'
  | 'married'
  | 'head_of_household'
  | 'special_case';

export interface Student {
  studentId: string; // شماره دانشجویی
  nationalId: string; // کد ملی
  password?: string; // کلمه عبور اختیاری (در صورت عدم تنظیم یا ریست، همان کد ملی خواهد بود)
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
  residenceType?: StudentResidenceType; // برچسب وضعیت سکونت: خوابگاهی یا ترددی (دانشجوی دارای اتاق پیش‌فرض خوابگاهی است)
  admissionStatus?: StudentAdmissionStatus; // برچسب وضعیت پذیرش: پذیرش شده یا پذیرش نشده (دانشجوی دارای خوابگاه پیش‌فرض پذیرش شده است و جدیدالورودها تا زمان تکمیل اطلاعات پذیرش نشده هستند)
  dormitoryRequestStatus?: 'requested' | 'not_needed_commuter'; // انتخاب دانشجو در بدو ورود: درخواست خوابگاه یا عدم نیاز (ترددی)
  commuterEligibilityReasons?: CommuterEligibilityReason[]; // علل قانونی ترددی بودن (اصفهان تا ۳۰ کیلومتر، متأهل، سرپرست خانوار، موارد خاص)
  commuterRequestNotes?: string; // توضیحات دانشجو برای ترددی بودن / عدم نیاز به خوابگاه
  dormitoryRequestNotes?: string; // توضیحات تکمیلی درخواست خوابگاه
  // وضعیت خانواده، تأهل، زندگی و شغل والدین
  maritalStatus?: 'single' | 'married';
  isHeadOfHousehold?: boolean;
  fatherAlive?: boolean;
  fatherOccupation?: string;
  motherAlive?: boolean;
  motherOccupation?: string;
  familyMembersCount?: string;
  housingStatus?: 'owned' | 'rented' | 'organizational' | 'relatives' | 'other';
  economicStatus?: 'good' | 'moderate' | 'needs_support';
  livingSituationNotes?: string;
  // توانمندی‌ها، مهارت‌ها و علایق قابل گزارش‌گیری (جداگانه)
  artisticSkills?: string[];
  artisticOther?: string;
  culturalActivities?: string[];
  culturalOther?: string;
  sportsActivities?: string[];
  sportsOther?: string;
  technicalSkills?: string[];
  technicalOther?: string;
  // پرونده کامل سلامت جسمی و روانی
  bloodType?: string;
  physicalHealthStatus?: 'healthy' | 'needs_attention' | 'chronic_condition';
  physicalConditions?: string[];
  regularMedications?: string;
  foodOrDrugAllergies?: string;
  medicalDetails?: string;
  mentalHealthStatus?: 'good' | 'mild_stress' | 'needs_counseling' | 'under_treatment';
  mentalHealthTopics?: string[];
  wantsCounselingContact?: boolean;
  mentalHealthNotes?: string;
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
  disciplineScore?: number; // نمره انضباط و رعایت مقررات سکونت و رفت و آمد (۰ تا ۱۰۰)
  cleanlinessScore?: number; // نمره رعایت نظافت فردی و اجتماعی اتاق (۰ تا ۱۰۰)
  lastVisitAt?: string; // تاریخ آخرین بازدید سرپرستی
  lastVisitBy?: string;
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
  contentHtml?: string; // محتوای قالب‌بندی‌شده اطلاعیه (فونت، رنگ، اندازه، بلد، ایتالیک)
  author: string;
  targetDormId?: string; // 'all' یا شناسه خوابگاه خاص
  priority: 'normal' | 'important' | 'urgent';
  date: string;
  pinned?: boolean;
  showOnHomePage?: boolean; // انتشار در صفحه اول سایت جهت مشاهده عمومی و مراجعین
  publishInNotifications?: boolean; // انتشار در نوتیفیکیشن کاربران (برای اطلاعیه‌های صفحه اول به‌صورت پیش‌فرض غیرفعال)
  imageUrl?: string; // تصویر یا پوستر ضمیمه شده به اطلاعیه (بیس۶۴ یا URL)
}

export type MessageCategory =
  | 'education' // امور آموزشی، مرخصی تحصیلی، انتخاب واحد و مسائل دانشجویی
  | 'cultural' // امور فرهنگی، فوق‌برنامه، تشکل‌ها و انجمن‌های دانشجویی
  | 'student_affairs' // امور دانشجویی، تربیت بدنی، شورای صنفی و شورای انضباطی
  | 'security' // امور حراست، انتظامات و گزارش‌های حفاظتی
  | 'library' // امور کتابخانه، پژوهش و امانت کتب
  | 'smart_campus' // امور هوشمندسازی، کارت هوشمند و سامانه‌ها
  | 'graduation' // امور فارغ‌التحصیلان و خاتمه تسویه
  | 'accommodation' // امور اسکان و انتخاب اتاق
  | 'maintenance' // خرابی تأسیسات و تعمیرات
  | 'services_cleaning' // خدمات، نظافت و بهداشت سرا
  | 'rights_violation' // عدم رعایت حقوق دیگران، سر و صدا و مزاحمت
  | 'social_personal' // آسیب‌های فردی و اجتماعی، ناسازگاری و مشاوره
  | 'counseling' // خدمات مشاوره، روانشناختی و سلامت روان مرکز
  | 'financial' // امور مالی، بدهی و کسورات خوابگاه
  | 'discipline' // نظم و انضباط سرا
  | 'request' // درخواست مرخصی و تردد
  | 'other'; // سایر امور

export interface MessageReply {
  id: string;
  senderName: string;
  senderRole: 'student' | 'supervisor' | 'admin' | 'maintenance' | 'warehouse' | 'counselor' | 'finance' | 'procurement' | 'education' | 'cultural' | 'student_affairs' | 'security' | 'vice_dean' | 'library' | 'smart_campus' | 'graduation';
  content: string;
  date: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'supervisor' | 'admin' | 'maintenance' | 'warehouse' | 'counselor' | 'finance' | 'procurement' | 'education' | 'cultural' | 'student_affairs' | 'security' | 'vice_dean' | 'library' | 'smart_campus' | 'graduation';
  receiverType: 'supervisor' | 'admin' | 'student' | 'maintenance' | 'warehouse' | 'counselor' | 'finance' | 'procurement' | 'education' | 'cultural' | 'student_affairs' | 'security' | 'vice_dean' | 'library' | 'smart_campus' | 'graduation' | 'all';
  receiverId?: string;
  receiverName?: string;
  senderFieldOfStudy?: string; // رشته تحصیلی دانشجوی ارسال‌کننده جهت ارجاع خودکار به کارشناس آموزش مربوطه
  targetEducationStaffId?: string; // شناسه کارشناس آموزش اختصاصی رشته (در صورت ارجاع مستقیم)
  targetEducationStaffName?: string; // نام کارشناس آموزش اختصاصی رشته
  targetScope?: 'single' | 'field' | 'entry_term';
  targetFieldOfStudy?: string;
  targetEntryTerm?: string;
  recipientCount?: number;
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
  photoUrl?: string; // تصویر پروفایل سرپرست
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
  photoUrl?: string; // تصویر پروفایل پرسنل تأسیسات
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
  photoUrl?: string; // تصویر پروفایل مسئول انبار
  role: 'warehouse';
  status: 'active' | 'inactive';
  isActive?: boolean;
  notes?: string;
}

export interface FinanceStaff {
  id: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  mobile?: string;
  photoUrl?: string; // تصویر پروفایل کاربر امور مالی
  department?: string; // عنوان بخش یا واحد حسابداری
  role: 'finance';
  status: 'active' | 'inactive';
  isActive?: boolean;
  notes?: string;
}

export interface ProcurementStaff {
  id: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  mobile?: string;
  photoUrl?: string; // تصویر پروفایل کاربر کارپرداز
  department?: string; // واحد کارپردازی و خرید
  role: 'procurement';
  status: 'active' | 'inactive';
  isActive?: boolean;
  notes?: string;
}

export interface EducationStaff {
  id: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  mobile?: string;
  photoUrl?: string; // تصویر پروفایل کارشناس آموزش
  department?: string; // واحد آموزش و امور دانشجویی
  assignedFields?: string[]; // رشته‌های تحصیلی تحت پوشش کارشناس (خالی = همه رشته‌ها / کارشناس عمومی)
  role: 'education';
  status: 'active' | 'inactive';
  isActive?: boolean;
  notes?: string;
}

export interface CulturalStaff {
  id: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  mobile?: string;
  photoUrl?: string; // تصویر پروفایل کارشناس امور فرهنگی
  department?: string; // واحد امور فرهنگی و اجتماعی سراها
  role: 'cultural';
  status: 'active' | 'inactive';
  isActive?: boolean;
  notes?: string;
}

export interface StudentAffairsStaff {
  id: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  mobile?: string;
  photoUrl?: string; // تصویر پروفایل کارشناس امور دانشجویی و تربیت بدنی
  department?: string; // اداره امور دانشجویی، تربیت بدنی و رفاهی
  role: 'student_affairs';
  status: 'active' | 'inactive';
  isActive?: boolean;
  notes?: string;
}

export interface SecurityStaff {
  id: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  mobile?: string;
  photoUrl?: string; // تصویر پروفایل کارشناس حراست و انتظامات
  department?: string; // واحد حراست و انتظامات پردیس / سراها
  badgeCode?: string; // کد سازمانی / گشت حفاظتی
  coveredDormIds?: string[]; // سراهای تحت پوشش (خالی = همه سراها)
  role: 'security';
  status: 'active' | 'inactive';
  isActive?: boolean;
  notes?: string;
}

export interface ViceDeanStaff {
  id: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  mobile?: string;
  photoUrl?: string; // تصویر پروفایل معاونت دانشجویی
  department?: string; // معاونت دانشجویی دانشگاه فرهنگیان
  title?: string; // عنوان سازمانی (معاون دانشجویی / سرپرست معاونت دانشجویی)
  role: 'vice_dean';
  status: 'active' | 'inactive';
  isActive?: boolean;
  notes?: string;
}

export interface LibraryStaff {
  id: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  mobile?: string;
  photoUrl?: string; // تصویر پروفایل مسئول کتابخانه و پژوهش
  department?: string; // واحد کتابخانه و پژوهش
  role: 'library';
  status: 'active' | 'inactive';
  isActive?: boolean;
  notes?: string;
}

export interface SmartCampusStaff {
  id: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  mobile?: string;
  photoUrl?: string; // تصویر پروفایل کاربر هوشمندسازی
  department?: string; // واحد هوشمندسازی و فناوری اطلاعات
  role: 'smart_campus';
  status: 'active' | 'inactive';
  isActive?: boolean;
  notes?: string;
}

export interface GraduationStaff {
  id: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  mobile?: string;
  photoUrl?: string; // تصویر پروفایل کارشناس امور فارغ‌التحصیلان
  department?: string; // اداره امور فارغ‌التحصیلان
  role: 'graduation';
  status: 'active' | 'inactive';
  isActive?: boolean;
  notes?: string;
}

export type SecurityReportCategory =
  | 'disciplinary_incident'
  | 'curfew_entry_exit'
  | 'unauthorized_guest'
  | 'property_damage_safety'
  | 'conflict_harassment'
  | 'facility_security_hazard'
  | 'campus_dorm_environment'
  | 'suspicious_activity'
  | 'other';

export type SecurityReportSeverity = 'normal' | 'important' | 'urgent';
export type SecurityReportStatus = 'pending' | 'reviewing' | 'resolved' | 'archived';

export interface SecurityReportStudentSnapshot {
  studentId: string;
  fullName: string;
  nationalId?: string;
  mobile?: string;
  fieldOfStudy?: string;
  entryTerm?: string;
  dormName?: string;
  roomNumber?: string;
}

export type StaffReferralActorRole =
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
  | 'graduation';

export interface SecurityReport {
  id: string;
  reportCode: string; // مثلاً SEC-101
  reportScope?: 'student' | 'facility_campus'; // گزارش مرتبط با دانشجو یا مربوط به خود سراها و محوطه بدون انتخاب دانشجو
  title: string;
  category: SecurityReportCategory;
  categoryLabel: string;
  severity: SecurityReportSeverity;
  dormId?: string;
  dormName?: string;
  roomNumber?: string;
  locationDetails?: string;
  incidentDate: string;
  description: string;
  studentIds: string[];
  studentsSnapshot: SecurityReportStudentSnapshot[];
  reportedById: string;
  reportedByName: string;
  reportedByRole: StaffReferralActorRole;
  reportedAt: string;
  status: SecurityReportStatus;
  securityNotes?: string;
  actionTaken?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  updatedAt?: string;
}

export type AcademicNoticeType = 'academic_leave' | 'expulsion';

export interface AcademicStatusNotice {
  id: string;
  noticeCode: string; // مثلاً EDU-101
  studentId: string;
  studentName: string;
  studentNationalId?: string;
  studentFieldOfStudy?: string;
  studentEntryTerm?: string;
  noticeType: AcademicNoticeType;
  academicYear: string;
  semester: string;
  effectiveDate?: string;
  letterNumber?: string;
  description: string;
  reportedByStaffId: string;
  reportedByStaffName: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'action_taken';
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type StudentFinancialStatus =
  | 'auto_deducting'
  | 'pending_payment'
  | 'debtor'
  | 'settled'
  | 'unreviewed';

export interface StudentFinancialRecord {
  studentId: string;
  deductionRate?: 45 | 25;
  paymentMethod?: 'auto_payroll' | 'in_person_accounting';
  debtAmount: number;
  paidAmount?: number;
  financialStatus: StudentFinancialStatus;
  fiscalNote?: string;
  documentNumber?: string;
  updatedAt: string;
  updatedBy: string;
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
  status: 'pending_supervisor' | 'pending_warehouse' | 'referred_to_procurement' | 'issued' | 'rejected';
  supervisorApproved?: boolean;
  supervisorApprovedBy?: string;
  supervisorApprovedAt?: string;
  supervisorNotes?: string;
  procurementRequestId?: string;
  procurementTrackingCode?: string;
  referredToProcurementAt?: string;
  issuedByStaffId?: string;
  issuedByStaffName?: string;
  issuedAt?: string;
  issuedQuantity?: number;
  unitPrice?: number;
  totalCost?: number;
  warehouseNotes?: string;
}

export type ProcurementRequestStatus =
  | 'pending_purchase'
  | 'purchasing'
  | 'purchased'
  | 'delivered_to_warehouse'
  | 'warehouse_confirmed'
  | 'cancelled';

export interface ProcurementRequest {
  id: string;
  trackingCode: string; // کد رهگیری خرید مثلاً P-101
  warehouseRequestId?: string; // پیوند به حواله یا درخواست انبار
  warehouseRequestCode?: string;
  inventoryItemId?: string; // پیوند به کالای موجود در انبار (در صورت شارژ مجدد)
  itemTitle: string; // نام کالا یا قطعه جهت خرید
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
  referredAt: string;
  assignedProcurementId?: string;
  assignedProcurementName?: string;
  status: ProcurementRequestStatus;
  purchasedQuantity?: number; // مقدار خریداری‌شده (بر حسب واحد کالا)
  purchasedItemCount?: number; // تعداد اقلام / بسته خریداری‌شده
  unitPrice?: number; // قیمت واحد (ریال)
  totalPrice?: number; // مبلغ کل خرید (ریال)
  supplierName?: string; // نام فروشنده / فروشگاه
  invoiceNumber?: string; // شماره فاکتور
  purchaseDate?: string;
  procurementNotes?: string;
  deliveryStatus: 'not_delivered' | 'delivered';
  deliveredAt?: string;
  updatedByProcurementId?: string;
  updatedByProcurementName?: string;
  updatedAt?: string;
  warehouseConfirmed?: boolean;
  warehouseConfirmedBy?: string;
  warehouseConfirmedAt?: string;
  warehouseConfirmNotes?: string;
  transferredInventoryItemId?: string;
}

export interface InventoryTransaction {
  id: string;
  inventoryItemId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  unitPrice?: number;
  totalValue?: number;
  reason: string;
  referenceCode?: string;
  dormName?: string;
  actorId: string;
  actorName: string;
  date: string;
  timestamp: string;
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

export interface HomeNoteItem {
  id: string;
  title: string;
  body: string;
  bodyHtml?: string;
}

export interface AboutCapabilityItem {
  id: string;
  text: string;
  highlight?: boolean;
}

export interface AboutAttachmentFile {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  dataUrl: string;
  uploadedAt: string;
}

export interface AboutContentSettings {
  universityBadge?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  designerBadge?: string;
  designerName?: string;
  designerEmail?: string;
  designerBio?: string;
  designerBioHtml?: string;
  pdfCardTitle?: string;
  pdfCardDescription?: string;
  boardingSectionTitle?: string;
  boardingSectionHtml?: string;
  boardingSectionText?: string;
  capabilitiesSectionTitle?: string;
  capabilities?: AboutCapabilityItem[];
  extraSectionTitle?: string;
  extraSectionHtml?: string;
  extraSectionText?: string;
  attachmentsTitle?: string;
  attachments?: AboutAttachmentFile[];
  footerNote?: string;
  updatedAt?: string;
}

export type StudentPortalIconKey =
  | 'graduation'
  | 'dining'
  | 'megaphone'
  | 'cpu'
  | 'landmark'
  | 'globe'
  | 'book'
  | 'wallet'
  | 'building'
  | 'shield'
  | 'calendar'
  | 'link';

export type StudentPortalColorKey =
  | 'teal'
  | 'amber'
  | 'sky'
  | 'indigo'
  | 'emerald'
  | 'cyan'
  | 'violet'
  | 'rose';

export interface StudentPortalLink {
  id: string;
  title: string;
  category: string;
  description: string;
  url: string;
  displayUrl?: string;
  ctaLabel?: string;
  iconKey?: StudentPortalIconKey;
  colorKey?: StudentPortalColorKey;
  isActive?: boolean;
  order?: number;
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
  heroBgMode?: 'default' | 'color' | 'image'; // حالت پس‌زمینه بنر اصلی صفحه اول
  heroBgColor?: string; // رنگ دلخواه پس‌زمینه بنر اصلی صفحه اول
  heroBgImageUrl?: string; // تصویر دلخواه پس‌زمینه بنر اصلی صفحه اول
  homeNotesTitle?: string; // عنوان بخش نکات مهم انتخاب اتاق و اسکان صفحه اول
  homeNotes?: HomeNoteItem[]; // کارت‌های بخش نکات مهم صفحه اول
  studentSecondaryEditEnabled?: boolean; // اجازه ویرایش ثانویه اطلاعات و عکس توسط دانشجو پس از تکمیل اولیه پرونده
  aboutContent?: AboutContentSettings; // محتوا و فایل‌های قابل ویرایش بخش درباره ما توسط مدیر
  studentPortals?: StudentPortalLink[]; // فهرست سامانه‌ها و درگاه‌های بیرونی قابل مدیریت توسط مدیر برای کارتابل دانشجو
}

export interface CounselorStaff {
  id: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  mobile?: string;
  photoUrl?: string; // تصویر پروفایل مشاور
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
  | { role: 'finance'; staff: FinanceStaff }
  | { role: 'procurement'; staff: ProcurementStaff }
  | { role: 'education'; staff: EducationStaff }
  | { role: 'cultural'; staff: CulturalStaff }
  | { role: 'student_affairs'; staff: StudentAffairsStaff }
  | { role: 'security'; staff: SecurityStaff }
  | { role: 'vice_dean'; staff: ViceDeanStaff }
  | { role: 'library'; staff: LibraryStaff }
  | { role: 'smart_campus'; staff: SmartCampusStaff }
  | { role: 'graduation'; staff: GraduationStaff }
  | null;

export type DayOfWeek = 'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export interface SupervisorShiftSchedule {
  id: string;
  supervisorId: string;
  supervisorName: string;
  dormId: string;
  dormName: string;
  /** تاریخ دقیق شمسی شروع شیفت در برنامه ماهانه، مثلاً ۱۴۰۵/۰۸/۱۵ */
  shiftDate?: string;
  /** کلید ماه و سال شمسی برای فیلتر ماهانه، مثلاً 1405/08 */
  monthKey?: string;
  dayOfWeek: DayOfWeek | 'all'; // به‌صورت خودکار از تاریخ شمسی محاسبه می‌شود یا 'all' برای حضور پیوسته
  shiftType: 'morning' | 'evening' | 'night' | 'full_day'; // صبح، عصر، شب، ۲۴ ساعته کامل
  startTime?: string; // مثلاً ۰۷:۰۰
  endTime?: string; // مثلاً ۰۷:۰۰ (روز بعد در شیفت ۲۴ ساعته)
  /** آیا پایان شیفت در روز بعد است (مثلاً ۲۴ ساعته از ۰۷:۰۰ تا ۰۷:۰۰ فردا یا شیفت شب) */
  endsNextDay?: boolean;
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
  | 'procurement'
  | 'finance'
  | 'education'
  | 'cultural'
  | 'student_affairs'
  | 'sports'
  | 'disciplinary'
  | 'security'
  | 'election'
  | 'warning_eval'
  | 'guest'
  | 'visit_report'
  | 'survey'
  | 'settings'
  | 'backup'
  | 'excel'
  | 'counseling'
  | 'library'
  | 'smart_campus'
  | 'graduation_clearance'
  | 'community_chat';

export type GuestEligibilityType =
  | 'first_degree_relative'
  | 'other_province_farhangian'
  | 'other_ineligible';

export type GuestRequestStatus =
  | 'pending_supervisor'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export interface GuestRequest {
  id: string;
  trackingCode: string; // مثلاً G-101
  studentId: string;
  studentName: string;
  studentNationalId: string;
  studentPhone: string;
  dormId: string;
  dormName: string;
  roomId: string;
  roomNumber: string;

  // احراز شرط مجاز مهمان
  eligibilityType: GuestEligibilityType;
  relationshipToStudent: string; // مثلاً پدر، مادر، خواهر، برادر، دانشجوی فرهنگیان استان دیگر

  // مشخصات کامل مهمان
  guestFullName: string;
  guestNationalId: string;
  guestFatherName: string;
  guestPhone: string;
  guestProvince: string;
  guestCity: string;
  guestStudentId?: string;
  guestUniversityName?: string;
  guestFieldOfStudy?: string;

  // مدت و زمان اقامت
  stayDuration: string;
  arrivalDate: string;
  arrivalTime: string;
  departureDate: string;
  departureTime: string;
  visitReason?: string;

  // تعهدات اجباری دانشجو
  fullResponsibilityAccepted: boolean;
  noSelfFoodAccepted: boolean;
  roommatesConsentConfirmed: boolean;

  // گردش کار و تصمیم سرپرست
  status: GuestRequestStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  supervisorNotes?: string;
  rejectionReason?: string;
  documentsSubmittedToSupervisor?: boolean;
  documentsSubmittedAt?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO string برای مرتب‌سازی دقیق
  date: string; // تاریخ و ساعت شمسی خوانا
  actorName: string;
  actorRole: 'admin' | 'supervisor' | 'student' | 'maintenance' | 'warehouse' | 'counselor' | 'finance' | 'procurement' | 'education' | 'cultural' | 'student_affairs' | 'security' | 'vice_dean' | 'library' | 'smart_campus' | 'graduation' | 'system';
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
  type: 'evaluation' | 'notice' | 'warning' | 'report' | 'summons' | 'negative_score';
  scope: 'individual' | 'room';
  score?: number; // نمره ارزیابی بین ۰ تا ۱۰۰
  scoreCategory?: 'discipline' | 'cleanliness' | 'general';
  negativePoints?: number; // میزان نمره منفی ثبت‌شده
  summonsTarget?: 'supervisor' | 'disciplinary_council' | 'security'; // مرجع فراخوانی
  summonsSchedule?: string; // زمان/موعد مراجعه فراخوانی
  title: string;
  description: string;
  severity?: 'low' | 'medium' | 'high';
  evaluatorId?: string;
  evaluatorName: string;
  evaluatorRole: 'admin' | 'supervisor' | 'smart_campus' | 'library';
  date: string;
  resolved?: boolean;
  resolvedAt?: string;
}

export type VisitCleanlinessCondition = 'excellent' | 'good' | 'needs_attention' | 'poor';
export type VisitFacilitiesCondition = 'healthy' | 'minor_issue' | 'urgent_repair';

export interface VisitReport {
  id: string;
  reportCode: string; // مثلاً VR-101
  dormId: string;
  dormName: string;
  roomId?: string;
  roomNumber?: string;
  scope: 'dorm' | 'room';
  inspectorId?: string;
  inspectorName: string;
  inspectorRole: 'supervisor' | 'admin';
  visitDate: string;
  visitTime: string;
  cleanlinessCondition: VisitCleanlinessCondition;
  facilitiesCondition: VisitFacilitiesCondition;
  disciplineScore?: number;
  cleanlinessScore?: number;
  residentPresenceSummary?: string;
  summary: string;
  recommendations?: string;
  createdAt: string;
}

export type SurveyCategory =
  | 'dorm_services' // کیفیت خدمات سراها (تأسیسات و نظافت)
  | 'cleanliness' // نظافت و بهداشت سراها
  | 'maintenance' // عملکرد واحد تأسیسات و تعمیرات
  | 'cafeteria' // کیفیت غذاهای سلف و تغذیه
  | 'supervisors' // عملکرد سرپرستان سراها
  | 'comprehensive'; // نظرسنجی جامع دوره‌ای (همه بخش‌ها)

export type SurveyFrequency = 'weekly' | 'monthly' | 'midterm' | 'semester' | 'custom';

export type SurveyQuestionType = 'rating_5' | 'choice' | 'text';

export interface SurveyQuestion {
  id: string;
  text: string;
  type: SurveyQuestionType;
  required?: boolean;
  options?: string[];
  aspectTag?: 'facilities' | 'cleanliness' | 'cafeteria' | 'supervisor' | 'general';
}

export interface PeriodicSurvey {
  id: string;
  surveyCode: string; // مثلاً SRV-101
  title: string;
  description?: string;
  category: SurveyCategory;
  frequency: SurveyFrequency;
  periodLabel: string; // مثلاً آذر ۱۴۰۵ / نیمسال اول ۱۴۰۵-۱۴۰۶
  targetDormId: string; // 'all' یا شناسه سرای خاص
  targetSupervisorId?: string; // 'all' یا شناسه سرپرست خاص
  targetSupervisorName?: string;
  targetMaintenanceId?: string; // 'all' یا شناسه کارشناس تأسیسات خاص
  targetMaintenanceName?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'closed' | 'draft';
  isAnonymous?: boolean; // مخفی‌سازی هویت دانشجو در نمایش نتایج و اکسل
  questions: SurveyQuestion[];
  createdBy: string;
  createdAt: string;
}

export interface SurveyAnswer {
  questionId: string;
  questionText: string;
  type: SurveyQuestionType;
  ratingValue?: number; // ۱ تا ۵
  selectedOption?: string;
  textValue?: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  studentId: string;
  studentName: string;
  studentFieldOfStudy?: string;
  studentEntryTerm?: string;
  dormId?: string;
  dormName?: string;
  roomNumber?: string;
  targetSupervisorId?: string;
  targetSupervisorName?: string;
  targetMaintenanceId?: string;
  targetMaintenanceName?: string;
  overallRating?: number;
  answers: SurveyAnswer[];
  overallComment?: string;
  submittedAt: string;
}

// -------------------------------------------------------------
// امور فرهنگی سراها: جدول زمانی هفتگی برنامه‌ها و تشکل‌ها / انجمن‌ها
// -------------------------------------------------------------
export type CulturalProgramCategory =
  | 'cultural'
  | 'religious'
  | 'scientific'
  | 'artistic'
  | 'sports'
  | 'social'
  | 'skill';

export interface CulturalProgram {
  id: string;
  programCode: string; // مثلاً CL-101
  title: string;
  category: CulturalProgramCategory;
  dormId: string; // 'all' یا شناسه سرای مشخص
  dormName: string;
  dayOfWeek: DayOfWeek; // روز هفته در جدول زمانی کلاسی
  startTime: string; // مثلاً ۱۶:۰۰
  endTime: string; // مثلاً ۱۷:۳۰
  location: string; // محل برگزاری (نمازخانه، سالن مطالعه، حیاط سرا، سالن اجتماعات...)
  presenter?: string; // مجری، استاد یا مدرس کارگاه
  description?: string;
  targetAudience?: string;
  status: 'draft' | 'approved'; // فقط برنامه‌های تایید شده در کارتابل دانشجو نمایش داده می‌شوند
  approvedAt?: string;
  approvedBy?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface CulturalAssociation {
  id: string;
  associationCode: string; // مثلاً AS-101
  name: string;
  category: CulturalProgramCategory;
  description: string;
  mentorName?: string;
  meetingSchedule?: string;
  location?: string;
  dormId?: string; // 'all' یا سرا
  dormName?: string;
  membershipMode: 'open_instant' | 'requires_approval';
  maxCapacity?: number;
  status: 'active' | 'inactive';
  createdByName: string;
  createdAt: string;
}

export interface AssociationMembership {
  id: string;
  associationId: string;
  associationName: string;
  studentId: string;
  studentName: string;
  studentFieldOfStudy?: string;
  studentEntryTerm?: string;
  dormName?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestNote?: string;
  reviewNote?: string;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

// -------------------------------------------------------------
// امور دانشجویی و تربیت بدنی: انتخابات شورای صنفی و شورای انضباطی
// -------------------------------------------------------------
export interface GuildElectionCandidate {
  id: string;
  studentId?: string;
  fullName: string;
  fieldOfStudy?: string;
  entryTerm?: string;
  dormName?: string;
  slogan?: string;
  bio?: string;
  photoUrl?: string;
}

export interface GuildElection {
  id: string;
  electionCode: string; // مثلاً EL-101
  title: string;
  description?: string;
  noticeText?: string; // متن اطلاع‌رسانی رسمی به دانشجویان
  academicYear: string;
  semester: string;
  targetEligibility: 'all_students' | 'dorm_only';
  maxSelections: number; // حداکثر تعداد انتخاب مجاز برای هر رأی‌دهنده
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  isActiveWindow: boolean; // رأی‌گیری منحصراً در زمانی که این پرچم فعال و اطلاع‌رسانی شده مجاز است
  announcedAt?: string;
  candidates: GuildElectionCandidate[];
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface GuildElectionVote {
  id: string;
  electionId: string;
  studentId: string;
  studentName: string;
  isDormResident: boolean;
  dormName?: string;
  candidateIds: string[];
  castAt: string;
}

export type DisciplinaryViolationType =
  | 'curfew_violation'
  | 'disturbing_peace'
  | 'property_damage'
  | 'moral_code'
  | 'unauthorized_guest'
  | 'hygiene_neglect'
  | 'other';

export type DisciplinaryReferralStatus =
  | 'pending_review'
  | 'session_scheduled'
  | 'verdict_issued'
  | 'closed';

export interface DisciplinaryReferral {
  id: string;
  referralCode: string; // مثلاً DC-101
  studentId: string;
  studentName: string;
  studentNationalId?: string;
  studentMobile?: string;
  studentFieldOfStudy?: string;
  studentEntryTerm?: string;
  isDormResident: boolean;
  dormId?: string;
  dormName?: string;
  roomId?: string;
  roomNumber?: string;
  violationType: DisciplinaryViolationType;
  violationLabel: string;
  referralText: string;
  referredById: string;
  referredByName: string;
  referredByRole: StaffReferralActorRole;
  referredAt: string;
  status: DisciplinaryReferralStatus;
  sessionDate?: string;
  sessionTime?: string;
  sessionLocation?: string;
  councilNotes?: string;
  verdict?: string;
  handledByStaffName?: string;
  updatedAt?: string;
}

// -------------------------------------------------------------
// برنامه‌ریزی ورزشی و تربیت بدنی (کارتابل امور دانشجویی و تربیت بدنی)
// -------------------------------------------------------------
export type SportsProgramType =
  | 'futsal'
  | 'volleyball'
  | 'basketball'
  | 'table_tennis'
  | 'badminton'
  | 'chess'
  | 'track_field'
  | 'swimming'
  | 'fitness_morning'
  | 'hiking'
  | 'martial_arts'
  | 'other';

export type SportsProgramKind = 'training' | 'tournament' | 'recreation' | 'morning_exercise';

export type SportsProgramStatus =
  | 'planned'
  | 'registration_open'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export interface SportsProgram {
  id: string;
  programCode: string; // مثلاً SP-101
  title: string;
  sportType: SportsProgramType;
  programKind: SportsProgramKind;
  genderScope: 'all' | 'brothers' | 'sisters';
  dormId: string; // 'all' یا شناسه سرای مشخص
  dormName: string;
  dayOfWeek?: DayOfWeek | 'multiple';
  scheduleDate?: string; // تاریخ شروع / برگزاری شمسی
  startTime: string;
  endTime: string;
  venue: string; // سالن ورزشی، چمن، محوطه سرا، استخر...
  coachName?: string;
  maxCapacity?: number;
  eligibility?: string;
  equipmentNeeded?: string;
  description?: string;
  status: SportsProgramStatus;
  isPublishedToStudents: boolean;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
}

export type SportsRegistrationStatus = 'registered' | 'attended' | 'cancelled';

export interface SportsRegistration {
  id: string;
  programId: string;
  programTitle: string;
  studentId: string;
  studentName: string;
  studentNationalId?: string;
  studentMobile?: string;
  studentFieldOfStudy?: string;
  studentEntryTerm?: string;
  isDormResident: boolean;
  dormName?: string;
  roomNumber?: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  healthConfirmed: boolean;
  note?: string;
  status: SportsRegistrationStatus;
  registeredAt: string;
  updatedAt?: string;
}

// -------------------------------------------------------------
// کتابخانه و پژوهش: فهرست کتب، امانت و درخواست کتاب
// -------------------------------------------------------------
export interface LibraryBook {
  id: string;
  code: string; // کد کتاب / شماره راهنما مثلاً BK-101
  title: string;
  author: string;
  isbn?: string;
  category: string; // موضوع / دسته‌بندی
  publisher?: string;
  publishYear?: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation?: string; // ردیف و قفسه
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type LibraryBookRequestStatus = 'pending' | 'approved' | 'rejected' | 'returned';

export interface LibraryBookRequest {
  id: string;
  requestCode: string; // مثلاً LIB-101
  bookId: string;
  bookCode?: string;
  bookTitle: string;
  bookAuthor?: string;
  studentId: string;
  studentName: string;
  studentFieldOfStudy?: string;
  studentEntryTerm?: string;
  studentPhone?: string;
  requestedAt: string;
  status: LibraryBookRequestStatus;
  requestNote?: string;
  approvedAt?: string;
  dueDate?: string; // تاریخ موعد بازگشت (شمسی)
  returnedAt?: string;
  librarianId?: string;
  librarianName?: string;
  librarianNote?: string;
  rejectionReason?: string;
}

// -------------------------------------------------------------
// تسویه حساب الکترونیک فراغت از تحصیل دانشجویان
// -------------------------------------------------------------
export type ClearanceUnitRole =
  | 'education'
  | 'supervisor'
  | 'finance'
  | 'library'
  | 'smart_campus'
  | 'student_affairs'
  | 'cultural'
  | 'counselor'
  | 'security'
  | 'warehouse'
  | 'maintenance'
  | 'vice_dean';

export type ClearanceUnitDecisionStatus = 'pending' | 'approved' | 'rejected';

export interface ClearanceUnitApproval {
  unitRole: ClearanceUnitRole;
  unitLabel: string;
  status: ClearanceUnitDecisionStatus;
  reviewerId?: string;
  reviewerName?: string;
  reviewedAt?: string;
  note?: string;
  resubmittedAt?: string;
}

export type GraduationClearanceStatus =
  | 'pending_education'
  | 'rejected_education'
  | 'in_clearance'
  | 'completed';

export interface GraduationClearanceRequest {
  id: string;
  trackingCode: string; // مثلاً CLR-101
  studentId: string;
  studentName: string;
  studentNationalId?: string;
  studentFatherName?: string;
  studentFieldOfStudy: string;
  studentEntryTerm: string;
  studentPhone: string;
  studentPhotoUrl?: string;
  dormName?: string;
  roomNumber?: string;
  graduationAcademicYear: string;
  graduationSemester: string;
  studentNote?: string;
  requestedAt: string;
  updatedAt: string;
  status: GraduationClearanceStatus;
  educationGateStatus: ClearanceUnitDecisionStatus;
  educationReviewerId?: string;
  educationReviewerName?: string;
  educationReviewedAt?: string;
  educationNote?: string;
  units: Record<ClearanceUnitRole, ClearanceUnitApproval>;
  completedAt?: string;
  // خاتمه و تحویل نهایی توسط واحد فارغ‌التحصیلان
  graduationFinalized?: boolean;
  graduationFinalizedAt?: string;
  graduationFinalizedBy?: string;
  graduationFinalizedById?: string;
  graduationFinalNote?: string;
  graduationArchiveNumber?: string;
}

// -------------------------------------------------------------
// تالار گفتگوی عمومی، پیام‌رسان دانشجویی و تالارها/گروه‌های تخصصی تحت نظارت
// -------------------------------------------------------------
export type CommunityForumCategory =
  | 'public'
  | 'scientific'
  | 'cultural'
  | 'sports'
  | 'association'
  | 'guild'
  | 'dormitory'
  | 'other';

export type CommunityResidenceScope = 'all' | 'dormitory' | 'commuter';

export type CommunityPrivateChatScope = 'all' | 'same_field' | 'same_entry' | 'same_dorm';

export type CommunityChatRoomType = 'public' | 'forum' | 'dm';

export type CommunityApprovalState = 'pending' | 'approved' | 'rejected';

export interface CommunityChatSettings {
  isChatSystemEnabled: boolean; // کلید اصلی باز/بسته کردن کل سامانه چت و تالارها
  isPublicForumOpen: boolean; // باز یا بسته بودن ارسال پیام در تالار گفتگوی عمومی
  isPrivateChatEnabled: boolean; // باز یا بسته بودن چت خصوصی دانشجو به دانشجو (با شماره دانشجویی)
  isStaffChatEnabled?: boolean; // باز یا بسته بودن چت خصوصی و تالارهای ویژه کارکنان
  isGroupCreationEnabled: boolean; // امکان ثبت درخواست ایجاد تالار تخصصی / گروه توسط دانشجویان
  allowPhotosInForums: boolean; // مجوز ارسال عکس در تالار عمومی و گروه‌های تخصصی
  allowPhotosInPrivateChat: boolean; // مجوز ارسال عکس در چت خصوصی دانشجویی
  allowStickers: boolean; // مجوز ارسال استیکر در تالارها و گفتگوها
  allowVoiceMessages?: boolean; // مجوز ضبط و ارسال پیام صوتی (ویس) در گفتگوها
  allowLiveVoiceCall?: boolean; // مجوز برقراری گفتگوی صوتی مستقیم زنده (تماس صوتی) برای همه کاربران
  voiceCallBlockedRoles?: string[]; // فهرست نقش‌های کاربری که دسترسی آن‌ها به تماس صوتی مستقیم توسط مدیر بسته شده است
  allowAnonymousCounselorChat?: boolean; // امکان چت ناشناس دانشجو با مشاوران (هویت فقط برای مدیر قابل مشاهده است)
  allowAnonymousSupervisorChat?: boolean; // امکان چت ناشناس دانشجو با سرپرستان سراها (هویت فقط برای مدیر قابل مشاهده است)
  requireRulesAcceptance: boolean; // الزام پذیرش تعهدنامه قوانین پیش از گفتگو
  onlyAdmittedStudentsCanChat: boolean; // محدودسازی گفتگو به دانشجویان پذیرش‌شده
  privateChatScope: CommunityPrivateChatScope; // دامنه مجاز چت خصوصی
  bannedKeywords: string[]; // کلمات ممنوعه (فیلتر خودکار)
  rulesText: string; // متن کامل قوانین و تعهدنامه اخلاقی-قانونی
  publicForumNotice?: string; // پیام پین‌شده مدیر در بالای تالار گفتگوی عمومی
  updatedAt?: string;
  updatedBy?: string;
}

export interface CommunityForumApprovalRecord {
  status: CommunityApprovalState;
  byId?: string;
  byName?: string;
  at?: string;
  note?: string;
}

export interface CommunityForum {
  id: string;
  isPublicForum?: boolean;
  title: string;
  description: string;
  category: CommunityForumCategory;
  tags: string[];
  avatarColor?: string;
  creatorId: string;
  creatorName: string;
  creatorRole: string;
  status: 'pending' | 'active' | 'rejected' | 'suspended';
  isClosed?: boolean; // قفل کردن موقت ارسال پیام در این تالار توسط مدیر/حراست
  closedBy?: string;
  closedReason?: string;
  adminApproval: CommunityForumApprovalRecord;
  securityApproval: CommunityForumApprovalRecord;
  allowedFields: string[]; // خالی = همه رشته‌ها
  allowedEntryTerms: string[]; // خالی = همه ورودی‌ها
  allowedResidence: CommunityResidenceScope; // همه / خوابگاهی / ترددی
  audienceType?: 'students_all' | 'staff_only'; // تالار دانشجویی یا تالار/گروه ویژه کارکنان
  allowedStaffRoles?: string[]; // در حالت staff_only: خالی = همه کارکنان، در غیر این صورت نقش‌های مجاز
  memberIds: string[];
  rulesAcceptedByCreator: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityChatMessage {
  id: string;
  roomType: CommunityChatRoomType;
  roomId: string; // 'public_forum' | forum.id | 'dm_<minId>_<maxId>'
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
  isModeratorMessage?: boolean; // پیام رسمی ناظر (مدیر، معاون، حراست)
  isWarningMessage?: boolean; // اخطار رسمی ثبت‌شده در گفتگو
  isAnonymousStudent?: boolean; // پیام ارسال‌شده توسط دانشجو در حالت چت ناشناس با مشاور یا سرپرست
  anonymousAlias?: string; // نام مستعار دانشجو در چت ناشناس (هویت واقعی فقط برای مدیر قابل مشاهده است)
  isDeleted?: boolean;
  deletedBy?: string;
  deletedAt?: string;
  deleteReason?: string;
  isEdited?: boolean;
  editedAt?: string;
  createdAt: string;
  createdAtIso: string;
}

export interface CommunityChatBan {
  id: string;
  studentId: string;
  studentName: string;
  studentFieldOfStudy?: string;
  reason: string;
  scope: 'all' | 'private_only' | 'forums_only';
  bannedById: string;
  bannedByName: string;
  bannedByRole: 'admin' | 'security' | 'vice_dean';
  createdAt: string;
  isActive: boolean;
  unbannedAt?: string;
  unbannedBy?: string;
}

export interface CommunityChatReport {
  id: string;
  messageId: string;
  roomId: string;
  roomType: CommunityChatRoomType;
  roomTitle: string;
  offenderId: string;
  offenderName: string;
  messageText: string;
  messageImageUrl?: string;
  reportedById: string;
  reportedByName: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
}

export interface CommunityUserChatPrefs {
  rulesAcceptedUserIds: string[];
  blockedByUser: Record<string, string[]>; // userId -> list of blocked studentIds
}

export interface PublicStudentChatProfile {
  studentId: string;
  fullName: string;
  fieldOfStudy: string;
  entryTerm: string;
  isDormResident: boolean;
  dormId?: string;
  photoUrl?: string;
  admissionStatus: 'admitted' | 'not_admitted';
}

export interface StaffChatDirectoryItem {
  id: string;
  fullName: string;
  role: string;
  roleLabel: string;
  department?: string;
  photoUrl?: string;
}





