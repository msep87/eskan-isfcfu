import React, { useState } from 'react';
import {
  Student,
  Dormitory,
  Room,
  Bed,
  Announcement,
  RoomWarning,
  AppSettings,
  StudentEvaluation,
  DayOfWeek,
  CulturalProgram,
  CulturalAssociation,
  GuildElection,
  SportsProgram,
  SportsProgramType,
  SportsProgramKind,
  SportsProgramStatus,
  SportsRegistration,
} from '../types';
import { Storage } from '../utils/storage';
import {
  computeStudentFinancialInfo,
  FINANCIAL_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  getStudentResidenceType,
  getStudentAdmissionStatus,
} from '../utils/financeUtils';
import { RoommatesCard } from './RoommatesCard';
import { VisualBedPicker } from './VisualBedPicker';
import { StudentProfileModal } from './StudentProfileModal';
import { DormIdCardModal } from './DormIdCardModal';
import { StudentActivityTranscriptModal } from './StudentActivityTranscriptModal';
import { StudentGuestRequestPanel } from './StudentGuestRequestPanel';
import { StudentSurveyPanel } from './StudentSurveyPanel';
import { StudentLibraryPanel } from './StudentLibraryPanel';
import { StudentGraduationClearancePanel } from './StudentGraduationClearancePanel';
import { CommunityChatHub } from './CommunityChatHub';
import { RichTextDisplay } from './RichTextEditor';
import { AnnouncementImageBox, ImageLightboxModal } from './ImageLightboxModal';
import {
  User,
  Bed as BedIcon,
  Users,
  MessageSquare,
  Sparkles,
  Calendar,
  AlertTriangle,
  Bell,
  Clock,
  ShieldCheck,
  Building,
  CheckCircle,
  Camera,
  MapPin,
  Phone,
  GraduationCap,
  Lock,
  QrCode,
  Printer,
  BookOpen,
  HeartHandshake,
  Award,
  MessageSquareWarning,
  Wallet,
  UserPlus,
  ClipboardList,
  Vote,
  Send,
  Dumbbell,
  Activity,
  XCircle,
  Globe,
  ExternalLink,
  UtensilsCrossed,
  Megaphone,
  MessagesSquare,
  Cpu,
  Landmark,
} from 'lucide-react';
import {
  PORTAL_COLOR_STYLES,
  resolveStudentPortals,
} from '../utils/studentPortalsDefaults';
import { renderPortalIcon } from './AdminStudentPortalsEditor';
import { formatCommuterReasons } from '../utils/studentProfileOptions';

interface StudentDashboardProps {
  student: Student;
  dorms: Dormitory[];
  rooms: Room[];
  beds: Bed[];
  students: Student[];
  announcements: Announcement[];
  warnings: RoomWarning[];
  settings: AppSettings;
  onRefreshData: () => void;
  onOpenMessages: () => void;
  onOpenUserGuide?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  dorms,
  rooms,
  beds,
  students,
  announcements,
  warnings,
  settings,
  onRefreshData,
  onOpenMessages,
  onOpenUserGuide,
}) => {
  // تب‌های داشبورد
  const [activeTab, setActiveTab] = useState<'overview' | 'picker' | 'guest' | 'surveys' | 'cultural' | 'sports' | 'elections' | 'library' | 'clearance' | 'community_chat' | 'portals'>('overview');
  const activeStudentPortals = resolveStudentPortals(settings.studentPortals).filter(
    (p) => p.isActive !== false
  );
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [previewAnnImage, setPreviewAnnImage] = useState<string | null>(null);

  // وضعیت تعاملات فرهنگی، برنامه‌های ورزشی و انتخابات شورای صنفی
  const [assocNotes, setAssocNotes] = useState<Record<string, string>>({});
  const [culturalFeedback, setCulturalFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sportsTypeFilter, setSportsTypeFilter] = useState<string>('all');
  const [sportsKindFilter, setSportsKindFilter] = useState<string>('all');
  const [sportsSkillByProg, setSportsSkillByProg] = useState<Record<string, 'beginner' | 'intermediate' | 'advanced'>>({});
  const [sportsNotesByProg, setSportsNotesByProg] = useState<Record<string, string>>({});
  const [sportsHealthByProg, setSportsHealthByProg] = useState<Record<string, boolean>>({});
  const [sportsFeedback, setSportsFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedCandidatesByElection, setSelectedCandidatesByElection] = useState<Record<string, string[]>>({});
  const [electionFeedback, setElectionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // دریافت اتاق و تخت دانشجو
  const studentBed = beds.find((b) => b.id === student.assignedBedId);
  const studentRoom = rooms.find((r) => r.id === student.assignedRoomId);
  const studentDorm = dorms.find((d) => d.id === student.assignedDormId);

  // هم‌اتاقی‌ها
  const roommates = studentRoom
    ? beds
        .filter((b) => b.roomId === studentRoom.id && b.studentId)
        .map((b) => ({
          bed: b,
          student: students.find((s) => s.studentId === b.studentId)!,
        }))
        .filter((item) => item.student)
    : [];

  // اخطارهای مربوط به اتاق این دانشجو
  const myRoomWarnings = studentRoom
    ? warnings.filter((w) => w.roomId === studentRoom.id)
    : [];

  // تذکرات، اخطارها و نمرات ارزیابی فردی و اتاق دانشجو
  const myEvaluations: StudentEvaluation[] = Storage.getStudentEvaluations().filter(
    (e) =>
      e.studentId === student.studentId ||
      (e.scope === 'room' && student.assignedRoomId && e.roomId === student.assignedRoomId)
  );
  const individualEvalList = myEvaluations.filter((e) => e.type === 'evaluation' && e.scope === 'individual');
  const roomEvalList = myEvaluations.filter((e) => e.type === 'evaluation' && e.scope === 'room');
  const activePersonalAlerts = myEvaluations.filter(
    (e) => (e.type === 'notice' || e.type === 'warning' || e.type === 'summons') && !e.resolved
  );

  const latestIndividualScore =
    individualEvalList.length > 0 && typeof individualEvalList[0].score === 'number'
      ? individualEvalList[0].score
      : student.previousScore ?? 100;
  const latestRoomScore =
    roomEvalList.length > 0 && typeof roomEvalList[0].score === 'number'
      ? roomEvalList[0].score
      : null;

  const canSecondaryEdit = Boolean(settings.studentSecondaryEditEnabled);
  const canStudentEditProfile = !student.isProfileCompleted || canSecondaryEdit;

  const myFinanceRecord = Storage.getStudentFinances().find(
    (f) => f.studentId === student.studentId
  );
  const myFinancialInfo = computeStudentFinancialInfo(student, myFinanceRecord);

  const myGuestRequests = Storage.getGuestRequests().filter(
    (g) => g.studentId === student.studentId
  );
  const pendingGuestCount = myGuestRequests.filter((g) => g.status === 'pending_supervisor').length;
  const approvedAwaitingDocsGuests = myGuestRequests.filter(
    (g) => g.status === 'approved' && !g.documentsSubmittedToSupervisor
  );

  const activeMatchingSurveys = Storage.getSurveys().filter(
    (s) =>
      s.status === 'active' &&
      (s.targetDormId === 'all' || s.targetDormId === student.assignedDormId)
  );
  const pendingSurveysCount = activeMatchingSurveys.filter(
    (s) => !Storage.hasStudentRespondedToSurvey(s.id, student.studentId)
  ).length;

  // برنامه‌های فرهنگی تأییدشده (فقط تأییدشده‌ها به دانشجو نمایش داده می‌شوند)
  const approvedCulturalPrograms: CulturalProgram[] = Storage.getCulturalPrograms().filter(
    (p) => p.status === 'approved' && (p.dormId === 'all' || p.dormId === student.assignedDormId)
  );
  const activeCulturalAssociations: CulturalAssociation[] = Storage.getCulturalAssociations().filter(
    (a) => a.status === 'active' && (!a.dormId || a.dormId === 'all' || a.dormId === student.assignedDormId)
  );
  const myAssociationMemberships = Storage.getAssociationMemberships().filter(
    (m) => m.studentId === student.studentId
  );

  // انتخابات شورای صنفی (رأی‌گیری منحصراً در بازه فعال isActiveWindow مجاز است)
  const allGuildElections: GuildElection[] = Storage.getGuildElections();
  const activeGuildElectionsCount = allGuildElections.filter((e) => e.isActiveWindow).length;
  const isStudentDormResident = getStudentResidenceType(student) === 'dormitory';

  // برنامه‌های ورزشی و تربیت بدنی منتشرشده و متناسب با سرا و جنسیت دانشجو
  const allSportsRegistrations: SportsRegistration[] = Storage.getSportsRegistrations();
  const publishedSportsPrograms: SportsProgram[] = Storage.getSportsPrograms().filter(
    (p) =>
      p.isPublishedToStudents &&
      (p.dormId === 'all' || !student.assignedDormId || p.dormId === student.assignedDormId) &&
      (p.genderScope === 'all' || !studentDorm?.gender || p.genderScope === studentDorm.gender)
  );
  const openSportsCount = publishedSportsPrograms.filter(
    (p) => p.status === 'registration_open' || p.status === 'ongoing'
  ).length;

  const myActiveLibraryLoansCount = Storage.getLibraryBookRequests().filter(
    (r) => r.studentId === student.studentId && (r.status === 'approved' || r.status === 'pending')
  ).length;

  const myClearance = Storage.getGraduationClearances().find((c) => c.studentId === student.studentId);

  return (
    <div className="space-y-6">

      {/* مدال تکمیل اجباری یا اختیاری پروفایل در اولین ورود (در صورت قفل بودن، فقط حالت نمایشی) */}
      <StudentProfileModal
        isOpen={isProfileModalOpen || !student.isProfileCompleted}
        onClose={() => setIsProfileModalOpen(false)}
        student={student}
        onProfileUpdated={() => onRefreshData()}
        isFirstLoginForce={!student.isProfileCompleted}
        allowSecondaryEdit={canSecondaryEdit}
      />

      {/* بنر قرمز/امبر اخطار اجباری بودن تکمیل پرونده در صورت عدم تکمیل */}
      {!student.isProfileCompleted && (
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-500/10 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg animate-pulse">
          <div className="flex items-center gap-3 text-center sm:text-right">
            <div className="p-3 rounded-2xl bg-rose-600 text-white shrink-0 shadow-md">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-sm sm:text-base">
                پرونده جامع دانشجویی شما ناقص است! تکمیل اطلاعات در بدو ورود الزامی می‌باشد
              </div>
              <div className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                بر اساس مقررات دانشگاه فرهنگیان، استفاده از پیشخوان جامع خدمات دانشجویی و تعیین وضعیت سکونت (درخواست خوابگاه یا ترددی بودن) منوط به تکمیل و تأیید اطلاعات فردی، خانواده، توانمندی‌ها و سلامت است.
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black transition shrink-0 shadow-md shadow-rose-600/30 cursor-pointer hover:scale-105"
          >
            تکمیل فوری پرونده و فعال‌سازی
          </button>
        </div>
      )}

      {/* بنر موافقت سرپرست با درخواست مهمان و یادآوری مراجعه و تحویل مدارک */}
      {approvedAwaitingDocsGuests.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3 text-center sm:text-right">
            <div className="p-3 rounded-2xl bg-emerald-600 text-white shrink-0 shadow-sm">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-sm">
                با درخواست مهمان شما موافقت شد ({approvedAwaitingDocsGuests.length} مورد)
              </div>
              <div className="text-xs text-emerald-800 dark:text-emerald-200 mt-1 leading-relaxed">
                جهت پذیرش مهمان ({approvedAwaitingDocsGuests.map((g) => g.guestFullName).join('، ')}) به دفتر سرپرستی سرا مراجعه نموده و مدارک هویتی/دانشجویی را تحویل دهید.
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('guest')}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition shrink-0 shadow-sm cursor-pointer"
          >
            مشاهده جزئیات درخواست مهمان
          </button>
        </div>
      )}

      {/* بنر خوش‌آمدگویی و کارت هویت دانشجو با تصویر بارگذاری شده */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-teal-700/15 relative overflow-hidden">
        {/* المان‌های تزئینی پس‌زمینه */}
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-right">

            {/* عکس پرسنلی دانشجو (با دکمه تغییر) */}
            <div className="relative group">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.fullName}
                  loading="lazy"
                  decoding="async"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white/80 shadow-xl"
                />
              ) : (
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center text-white text-3xl font-extrabold border-4 border-white/80 shadow-xl"
                  style={{ backgroundColor: student.avatarColor || '#0d9488' }}
                >
                  {student.fullName.slice(0, 2)}
                </div>
              )}

              {canStudentEditProfile ? (
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="absolute -bottom-2 -left-2 p-2 rounded-2xl bg-white text-teal-800 shadow-lg hover:bg-slate-100 transition cursor-pointer"
                  title="تغییر عکس و ویرایش مشخصات"
                >
                  <Camera className="w-4 h-4" />
                </button>
              ) : (
                <div
                  className="absolute -bottom-2 -left-2 p-2 rounded-2xl bg-slate-800/90 text-amber-300 shadow-lg border border-white/30"
                  title="تغییر عکس و ویرایش ثانویه توسط مدیر سامانه بسته شده است"
                >
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* مشخصات اصلی دانشجومعلم */}
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black">{student.fullName}</h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/20 font-bold backdrop-blur-xs">
                  دانشجومعلم دانشگاه فرهنگیان اصفهان
                </span>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-extrabold border ${
                    isStudentDormResident
                      ? 'bg-emerald-500/30 border-emerald-200/50 text-white'
                      : 'bg-amber-400/30 border-amber-200/60 text-amber-100'
                  }`}
                >
                  {isStudentDormResident ? 'دانشجوی خوابگاهی' : 'دانشجوی ترددی (غیرخوابگاهی)'}
                </span>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-extrabold border ${
                    getStudentAdmissionStatus(student) === 'admitted'
                      ? 'bg-sky-500/30 border-sky-200/60 text-white'
                      : 'bg-rose-500/35 border-rose-200/60 text-rose-100'
                  }`}
                >
                  {getStudentAdmissionStatus(student) === 'admitted' ? 'پذیرش شده' : 'پذیرش نشده'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-teal-100 flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1.5 font-medium">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  {student.fieldOfStudy} (ورودی {student.entryTerm})
                </span>
                <span>•</span>
                <span>کد دانشجویی: {student.studentId}</span>
                <span>•</span>
                <span>کد ملی: {student.nationalId}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-teal-50">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-300" />
                  ساکن: {student.province} - {student.city}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-cyan-200" />
                  همراه: <span dir="ltr">{student.mobile}</span>
                </span>
                {typeof student.previousScore === 'number' && !Number.isNaN(student.previousScore) && (
                  <span className="bg-teal-800/50 px-2 py-0.5 rounded-lg border border-teal-500/30">
                    امتیاز انضباطی: {student.previousScore}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* کارت وضعیت سکونت در سربرگ */}
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center sm:text-right shrink-0 min-w-[220px] max-w-[270px]">
            <div className="text-[11px] text-teal-100 font-bold mb-1">وضعیت سکونت و اسکان:</div>
            {!isStudentDormResident ? (
              <div>
                <div className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-100 bg-amber-600/50 px-2.5 py-0.5 rounded-lg mb-1 border border-amber-300/50">
                  <span>دانشجوی ترددی (عدم نیاز به خوابگاه)</span>
                </div>
                {student.commuterEligibilityReasons && student.commuterEligibilityReasons.length > 0 && (
                  <div className="text-[11px] text-teal-50/90 mt-1 leading-snug">
                    علت: {formatCommuterReasons(student.commuterEligibilityReasons)}
                  </div>
                )}
                <div className="text-[10px] text-teal-100/90 mt-1 leading-relaxed">
                  دسترسی کامل به کلیه خدمات دانشگاهی سامانه (به‌جز امکانات خوابگاهی)
                </div>
              </div>
            ) : studentBed && studentRoom && studentDorm ? (
              <div>
                {student.assignmentStatus === 'temporary' ? (
                  <div className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-200 bg-amber-950/60 px-2 py-0.5 rounded-lg mb-1 border border-amber-400/40">
                    <Clock className="w-3 h-3 text-amber-300" />
                    <span>تخصیص موقت (در انتظار تأیید)</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-200 bg-emerald-950/60 px-2 py-0.5 rounded-lg mb-1 border border-emerald-400/40">
                    <CheckCircle className="w-3 h-3 text-emerald-300" />
                    <span>تخصیص قطعی و تأیید شده</span>
                  </div>
                )}
                <div className="font-extrabold text-base text-white">
                  اتاق {studentRoom.roomNumber} - {studentBed.label}
                </div>
                <div className="text-xs text-teal-100 mt-0.5">{studentDorm.name}</div>
              </div>
            ) : (
              <div>
                <div className="font-bold text-amber-300 text-sm">متقاضی خوابگاه (در انتظار اتاق)</div>
                <div className="text-[11px] text-teal-100">جهت انتخاب تخت اقدام فرمایید</div>
              </div>
            )}

            <button
              onClick={() => setIsProfileModalOpen(true)}
              className={`mt-3 w-full py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5 ${
                canStudentEditProfile
                  ? 'bg-white text-teal-800 hover:bg-teal-50'
                  : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
              }`}
              title={
                canStudentEditProfile
                  ? 'ویرایش پرونده و اطلاعات فردی'
                  : 'ویرایش ثانویه توسط مدیر بسته شده است (فقط مشاهده پرونده)'
              }
            >
              {!canStudentEditProfile && <Lock className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
              <span>
                {canStudentEditProfile
                  ? 'ویرایش پرونده و سلامت'
                  : 'مشاهده پرونده (ویرایش بسته است)'}
              </span>
            </button>

            <button
              onClick={() => setIsIdCardModalOpen(true)}
              className="mt-2 w-full py-1.5 px-3 rounded-xl bg-teal-900/60 hover:bg-teal-900 text-teal-100 hover:text-white text-xs font-bold border border-white/20 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-300" />
              <span>کارت شناسایی و پرینت</span>
            </button>

            {onOpenUserGuide && (
              <button
                onClick={onOpenUserGuide}
                className="mt-2 w-full py-1.5 px-3 rounded-xl bg-indigo-900/60 hover:bg-indigo-900 text-indigo-100 hover:text-white text-xs font-bold border border-white/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                title="مشاهده دفترچه راهنمای جامع دانشجو و دانلود PDF"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
                <span>راهنمای کاربری (PDF)</span>
              </button>
            )}
          </div>
        </div>

        {/* بازه زمانی انتخاب اتاق و وضعیت سامانه */}
        <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-300" />
            <span>بازه زمانی مجاز انتخاب اتاق:</span>
            <span className="font-bold text-amber-200">{settings.selectionStartDate} تا {settings.selectionEndDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                settings.selectionActive ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span className="font-bold">
              {settings.selectionActive ? 'سامانه انتخاب تخت هم‌اکنون فعال است' : 'سامانه در حال حاضر غیرفعال است'}
            </span>
          </div>
        </div>
      </div>

      {/* بنر اطلاع‌رسانی وضعیت تخصیص موقت برای دانشجو */}
      {student.assignmentStatus === 'temporary' && studentRoom && (
        <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shrink-0 shadow-md">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm block mb-0.5">اسکان شما در وضعیت «تخصیص موقت» قرار دارد</span>
              <span className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                تخت انتخابی در اتاق {studentRoom.roomNumber} برای شما به صورت موقت رزرو شده است. پس از بررسی و تأیید نهایی توسط سرپرستی سرا یا مدیریت کل سامانه، اسکان شما به صورت قطعی ثبت خواهد شد.
              </span>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-extrabold text-[11px] shrink-0 border border-amber-300 dark:border-amber-700">
            در انتظار تأیید سرپرست / مدیر
          </span>
        </div>
      )}

      {/* دکمه‌های ناوبری اصلی داشبورد دانشجو */}
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 min-w-[180px] py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
            activeTab === 'overview'
              ? 'bg-teal-600 text-white shadow-teal-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{isStudentDormResident ? 'پیشخوان، اتاق و هم‌اتاقی‌ها' : 'پیشخوان وضعیت دانشجو'}</span>
        </button>

        {isStudentDormResident && (
          <>
            <button
              onClick={() => {
                if (!student.isProfileCompleted) {
                  setIsProfileModalOpen(true);
                  return;
                }
                setActiveTab('picker');
              }}
              className={`flex-1 min-w-[180px] py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                activeTab === 'picker'
                  ? 'bg-teal-600 text-white shadow-teal-600/20'
                  : !student.isProfileCompleted
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-2 border-dashed border-amber-400'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {!student.isProfileCompleted || !settings.selectionActive ? (
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-500" />
              )}
              <span>انتخاب یا جابجایی اتاق و تخت بصری</span>
              {!student.isProfileCompleted ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold mr-1 shrink-0">
                  قفل (نیازمند تکمیل پرونده)
                </span>
              ) : !settings.selectionActive ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-extrabold mr-1 shrink-0">
                  بسته توسط مدیر
                </span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab('guest')}
              className={`flex-1 min-w-[180px] py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                activeTab === 'guest'
                  ? 'bg-indigo-600 text-white shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <UserPlus className="w-4 h-4 text-indigo-500" />
              <span>درخواست موافقت با مهمان</span>
              {pendingGuestCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                  {pendingGuestCount} در انتظار
                </span>
              )}
              {approvedAwaitingDocsGuests.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-black">
                  موافقت شده
                </span>
              )}
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('surveys')}
          className={`flex-1 min-w-[180px] py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
            activeTab === 'surveys'
              ? 'bg-violet-600 text-white shadow-violet-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <ClipboardList className={`w-4 h-4 ${activeTab === 'surveys' ? 'text-white' : 'text-violet-600'}`} />
          <span>نظرسنجی‌های دوره‌ای</span>
          {pendingSurveysCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black animate-pulse">
              {pendingSurveysCount} جدید
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cultural')}
          className={`flex-1 min-w-[190px] py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
            activeTab === 'cultural'
              ? 'bg-fuchsia-600 text-white shadow-fuchsia-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Sparkles className={`w-4 h-4 ${activeTab === 'cultural' ? 'text-white' : 'text-fuchsia-600'}`} />
          <span>برنامه فرهنگی و تشکل‌ها</span>
          {approvedCulturalPrograms.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300 font-black">
              {approvedCulturalPrograms.length} برنامه
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sports')}
          className={`flex-1 min-w-[190px] py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
            activeTab === 'sports'
              ? 'bg-emerald-600 text-white shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Dumbbell className={`w-4 h-4 ${activeTab === 'sports' ? 'text-white' : 'text-emerald-600'}`} />
          <span>برنامه‌های ورزشی و تربیت بدنی</span>
          {openSportsCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black">
              {openSportsCount} برنامه فعال
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('elections')}
          className={`flex-1 min-w-[190px] py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
            activeTab === 'elections'
              ? 'bg-indigo-700 text-white shadow-indigo-700/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Vote className={`w-4 h-4 ${activeTab === 'elections' ? 'text-white' : 'text-indigo-600'}`} />
          <span>انتخابات شورای صنفی</span>
          {activeGuildElectionsCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black animate-pulse">
              {activeGuildElectionsCount} رأی‌گیری فعال
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 min-w-[190px] py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
            activeTab === 'library'
              ? 'bg-amber-600 text-white shadow-amber-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <BookOpen className={`w-4 h-4 ${activeTab === 'library' ? 'text-white' : 'text-amber-600'}`} />
          <span>کتابخانه و پژوهش</span>
          {myActiveLibraryLoansCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-black">
              {myActiveLibraryLoansCount} فعال
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('clearance')}
          className={`flex-1 min-w-[200px] py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
            activeTab === 'clearance'
              ? 'bg-sky-700 text-white shadow-sky-700/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <GraduationCap className={`w-4 h-4 ${activeTab === 'clearance' ? 'text-white' : 'text-sky-600'}`} />
          <span>تسویه حساب فراغت از تحصیل</span>
          {myClearance && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              myClearance.status === 'completed'
                ? 'bg-emerald-500 text-white'
                : myClearance.status === 'rejected_education'
                ? 'bg-rose-500 text-white'
                : 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300'
            }`}>
              {myClearance.status === 'completed' ? 'تکمیل (آماده چاپ)' : myClearance.status === 'rejected_education' ? 'نیازمند اصلاح' : 'در جریان'}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('community_chat')}
          className={`flex-1 min-w-[200px] py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
            activeTab === 'community_chat'
              ? 'bg-gradient-to-l from-teal-600 to-emerald-600 text-white shadow-teal-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <MessagesSquare className={`w-4 h-4 ${activeTab === 'community_chat' ? 'text-white' : 'text-teal-600'}`} />
          <span>تالار گفتگو و پیام‌رسان دانشجویی</span>
        </button>

        <button
          onClick={() => setActiveTab('portals')}
          className={`flex-1 min-w-[180px] py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
            activeTab === 'portals'
              ? 'bg-cyan-700 text-white shadow-cyan-700/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Globe className={`w-4 h-4 ${activeTab === 'portals' ? 'text-white' : 'text-cyan-600'}`} />
          <span>سامانه‌ها</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeTab === 'portals'
                ? 'bg-white/20 text-white'
                : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
            }`}
          >
            {activeStudentPortals.length.toLocaleString('fa-IR')} لینک
          </span>
        </button>

        <button
          onClick={() => setIsIdCardModalOpen(true)}
          className="py-3.5 px-5 rounded-2xl bg-gradient-to-r from-teal-700 to-cyan-700 hover:from-teal-800 hover:to-cyan-800 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-700/20 hover:scale-105"
        >
          <QrCode className="w-4 h-4 text-amber-300" />
          <span>کارت شناسایی و مجوز اسکان سرا (چاپ / مجازی)</span>
        </button>

        <button
          onClick={() => setIsTranscriptModalOpen(true)}
          className="py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-600/25 hover:scale-105"
          title="مشاهده و چاپ کارنامه جامع فعالیت‌های فرهنگی، اجتماعی، ورزشی و انضباطی شما"
        >
          <Award className="w-4 h-4 text-yellow-100" />
          <span>کارنامه فعالیت‌های فرهنگی، اجتماعی و ورزشی (چاپ)</span>
        </button>

        <button
          onClick={onOpenMessages}
          className="py-3.5 px-5 rounded-2xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <MessageSquare className="w-4 h-4 text-teal-600" />
          <span>ارسال پیام به سرپرست سرا و مدیر</span>
        </button>

        <button
          onClick={onOpenMessages}
          className="py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-700/20"
          title="ارتباط مستقیم و محرمانه با مشاوران و روانشناسان سراهای دانشجویی"
        >
          <HeartHandshake className="w-4 h-4 text-emerald-200" />
          <span>درخواست مشاوره و پیام به مشاور مرکز</span>
        </button>

        <button
          onClick={onOpenMessages}
          className="py-3.5 px-5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-sky-700/20"
          title="طرح سوالات، مشکلات و درخواست‌های آموزشی با کارشناس آموزش"
        >
          <GraduationCap className="w-4 h-4 text-sky-200" />
          <span>سوالات و مشکلات آموزشی (کارشناس آموزش)</span>
        </button>
      </div>

      {/* اطلاعیه‌های دانشگاه و سرا در صفحه اول داشبورد */}
      {announcements.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white mb-4">
            <Bell className="w-5 h-5 text-teal-600" />
            <span>اطلاعیه‌های مهم سامانه جامع خدمات دانشجویی دانشگاه فرهنگیان</span>
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-2xl border transition ${
                  ann.priority === 'urgent'
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                    : ann.priority === 'important'
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {ann.priority === 'urgent' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold">
                        فوری و مهم
                      </span>
                    )}
                    {ann.priority === 'important' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold">
                        اطلاعیه مهم
                      </span>
                    )}
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {ann.title}
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400">{ann.date}</span>
                </div>
                <RichTextDisplay
                  html={ann.contentHtml}
                  fallbackText={ann.content}
                  className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed"
                  onImageClick={(src) => setPreviewAnnImage(src)}
                />
                {ann.imageUrl && (
                  <AnnouncementImageBox
                    src={ann.imageUrl}
                    alt={ann.title}
                    onClick={(src) => setPreviewAnnImage(src)}
                    maxWidthClass="max-w-md"
                    heightClass="h-48 sm:h-56"
                  />
                )}
                <div className="text-[10px] text-slate-400 mt-2 font-medium">
                  مرجع صدور: {ann.author}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* محتوای تب فعال */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* کارت ارزیابی عملکرد، نمره فردی/اتاق و تذکرات دانشجو */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    ارزیابی عملکرد، نمره فردی / اتاق و وضعیت تذکرات انضباطی
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    نمرات ارزیابی و تذکرات ثبت‌شده توسط واحدهای اجرایی و مدیریت کل سامانه جامع خدمات دانشجویی
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block">
                  نمره ارزیابی فردی
                </span>
                <div className="text-2xl font-black text-emerald-800 dark:text-emerald-200 mt-1">
                  {latestIndividualScore}{' '}
                  <span className="text-xs font-bold text-emerald-600/80">از ۱۰۰</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50">
                <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 block">
                  نمره ارزیابی اتاق {studentRoom ? `(اتاق ${studentRoom.roomNumber})` : ''}
                </span>
                <div className="text-2xl font-black text-teal-800 dark:text-teal-200 mt-1">
                  {latestRoomScore !== null ? (
                    <>
                      {latestRoomScore} <span className="text-xs font-bold text-teal-600/80">از ۱۰۰</span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">هنوز ثبت نشده</span>
                  )}
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  activePersonalAlerts.length + myRoomWarnings.filter((w) => !w.resolved).length > 0
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                  تذکرات و اخطارهای فعال
                </span>
                <div
                  className={`text-2xl font-black mt-1 ${
                    activePersonalAlerts.length + myRoomWarnings.filter((w) => !w.resolved).length > 0
                      ? 'text-rose-700 dark:text-rose-300'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {activePersonalAlerts.length + myRoomWarnings.filter((w) => !w.resolved).length}{' '}
                  <span className="text-xs font-bold">مورد</span>
                </div>
              </div>
            </div>

            {studentRoom && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/25 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 block">
                      نمره انضباط و رعایت مقررات سکونت و رفت و آمد اتاق
                    </span>
                    <span className="text-[10px] text-indigo-600/80 dark:text-indigo-400">
                      اتاق {studentRoom.roomNumber}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-indigo-800 dark:text-indigo-200 shrink-0">
                    {studentRoom.disciplineScore ?? 100}{' '}
                    <span className="text-xs font-bold text-indigo-600/80">از ۱۰۰</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/25 border border-sky-200 dark:border-sky-900/50 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 block">
                      نمره رعایت نظافت فردی و اجتماعی اتاق
                    </span>
                    <span className="text-[10px] text-sky-600/80 dark:text-sky-400">
                      اتاق {studentRoom.roomNumber}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-sky-800 dark:text-sky-200 shrink-0">
                    {studentRoom.cleanlinessScore ?? 100}{' '}
                    <span className="text-xs font-bold text-sky-600/80">از ۱۰۰</span>
                  </div>
                </div>
              </div>
            )}

            {myEvaluations.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-center text-xs text-slate-500">
                تاکنون هیچ تذکر، اخطار یا نمره ارزیابی جدیدی در کارتابل شما ثبت نشده است و وضعیت انضباطی شما مطلوب می‌باشد.
              </div>
            ) : (
              <div className="space-y-2.5">
                {myEvaluations.map((ev) => {
                  const summonsTargetLabel =
                    ev.summonsTarget === 'disciplinary_council'
                      ? 'شورای انضباطی'
                      : ev.summonsTarget === 'security'
                      ? 'حراست دانشگاه'
                      : 'سرپرستی سرا';
                  const scoreCategoryLabel =
                    ev.scoreCategory === 'discipline'
                      ? 'انضباط و مقررات سکونت و رفت و آمد'
                      : ev.scoreCategory === 'cleanliness'
                      ? 'نظافت فردی و اجتماعی'
                      : null;
                  return (
                  <div
                    key={ev.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      ev.type === 'evaluation'
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                        : ev.type === 'report'
                        ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
                        : ev.type === 'summons'
                        ? 'bg-purple-50/70 dark:bg-purple-950/25 border-purple-200 dark:border-purple-900/50'
                        : ev.type === 'negative_score'
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                        : ev.type === 'warning'
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                        : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold inline-flex items-center gap-1 ${
                            ev.type === 'evaluation'
                              ? 'bg-emerald-600 text-white'
                              : ev.type === 'report'
                              ? 'bg-blue-600 text-white'
                              : ev.type === 'summons'
                              ? 'bg-purple-700 text-white'
                              : ev.type === 'negative_score'
                              ? 'bg-rose-700 text-white'
                              : ev.type === 'warning'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {ev.type === 'evaluation' ? (
                            <Award className="w-3 h-3" />
                          ) : (
                            <MessageSquareWarning className="w-3 h-3" />
                          )}
                          <span>
                            {ev.type === 'evaluation'
                              ? `نمره ارزیابی: ${ev.score ?? '-'} از ۱۰۰`
                              : ev.type === 'report'
                              ? 'گزارش ثبت‌شده'
                              : ev.type === 'summons'
                              ? `فراخوانی به ${summonsTargetLabel}`
                              : ev.type === 'negative_score'
                              ? `نمره منفی (${ev.negativePoints ?? 0}- امتیاز)`
                              : ev.type === 'warning'
                              ? 'اخطار رسمی'
                              : 'تذکر'}
                          </span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
                          {ev.scope === 'room' ? 'مربوط به اتاق' : 'ارزیابی فردی'}
                        </span>
                        {scoreCategoryLabel && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-100/80 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 font-bold">
                            {scoreCategoryLabel}
                          </span>
                        )}
                        {ev.type === 'summons' && ev.summonsSchedule && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 font-bold">
                            زمان مراجعه: {ev.summonsSchedule}
                          </span>
                        )}
                        {(ev.type === 'notice' || ev.type === 'warning' || ev.type === 'summons') && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                              ev.resolved
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                            }`}
                          >
                            {ev.resolved ? 'برطرف شده' : 'فعال'}
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">{ev.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{ev.description}</p>
                      <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-1.5">
                        <span>ثبت‌کننده: {ev.evaluatorName}</span>
                        {ev.evaluatorRole === 'smart_campus' && (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-bold">
                            واحد هوشمندسازی
                          </span>
                        )}
                        {ev.evaluatorRole === 'library' && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold">
                            کتابخانه و پژوهش
                          </span>
                        )}
                        <span>• تاریخ: {ev.date}</span>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* کارت وضعیت مالی، کسورات قانونی حقوق و بدهی */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    وضعیت مالی، کسورات قانونی و بدهی خوابگاه
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    مطابق ضوابط دانشگاه فرهنگیان (۴۵٪ دانشجویان خوابگاهی / ۲۵٪ ترددی غیرخوابگاهی)
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold border self-start sm:self-auto ${
                  myFinancialInfo.financialStatus === 'debtor'
                    ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                    : myFinancialInfo.financialStatus === 'settled'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                }`}
              >
                {FINANCIAL_STATUS_LABELS[myFinancialInfo.financialStatus]}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  نرخ کسر از حقوق دریافتی
                </span>
                <div className="text-xl font-black text-teal-700 dark:text-teal-300 mt-1 tabular-nums">
                  {myFinancialInfo.deductionRate}٪ حقوق
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  {myFinancialInfo.isDormResident ? 'دانشجوی خوابگاهی' : 'ترددی (غیرخوابگاهی)'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  نحوه پرداخت قانونی
                </span>
                <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100 mt-1.5 leading-relaxed">
                  {PAYMENT_METHOD_LABELS[myFinancialInfo.paymentMethod]}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  میزان بدهی ثبت‌شده
                </span>
                <div
                  className={`text-xl font-black mt-1 tabular-nums ${
                    myFinancialInfo.debtAmount > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {myFinancialInfo.debtAmount.toLocaleString('fa-IR')}{' '}
                  <span className="text-xs font-bold">ریال</span>
                </div>
                {myFinancialInfo.paidAmount > 0 && (
                  <span className="text-[11px] text-slate-500 mt-0.5 block tabular-nums">
                    مبلغ پرداختی: {myFinancialInfo.paidAmount.toLocaleString('fa-IR')} ریال
                  </span>
                )}
              </div>
            </div>

            {myFinancialInfo.paymentMethod === 'in_person_accounting' && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                توجه: با توجه به ثبت محل سکونت خارج از استان اصفهان، لازم است جهت پرداخت و تسویه مبالغ مربوطه به واحد امور مالی و حسابداری مراجعه فرمایید.
              </div>
            )}

            {(myFinancialInfo.documentNumber || myFinancialInfo.fiscalNote) && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                {myFinancialInfo.documentNumber && (
                  <div>
                    <strong>شماره سند / فیش:</strong> <span className="font-mono">{myFinancialInfo.documentNumber}</span>
                  </div>
                )}
                {myFinancialInfo.fiscalNote && (
                  <div>
                    <strong>توضیحات امور مالی:</strong> {myFinancialInfo.fiscalNote}
                  </div>
                )}
              </div>
            )}
          </div>

          {isStudentDormResident ? (
            <RoommatesCard
              student={student}
              dorm={studentDorm}
              room={studentRoom}
              bed={studentBed}
              roommates={roommates}
              roomWarnings={myRoomWarnings}
              onSelectBedClick={() => {
                if (!student.isProfileCompleted) {
                  setIsProfileModalOpen(true);
                  return;
                }
                setActiveTab('picker');
              }}
              isSelectionActive={settings.selectionActive}
            />
          ) : (
            <div className="bg-amber-50/80 dark:bg-amber-950/25 rounded-3xl p-5 sm:p-6 border border-amber-200 dark:border-amber-800/70 shadow-xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black text-sm sm:text-base text-amber-950 dark:text-amber-200">
                  وضعیت سکونت شما: دانشجوی ترددی (غیرخوابگاهی)
                </h3>
                <span className="px-3 py-1 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 text-[11px] font-extrabold">
                  بدون استفاده از امکانات خوابگاهی
                </span>
              </div>
              <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                شما به عنوان دانشجوی ترددی در سامانه جامع خدمات دانشجویی ثبت شده‌اید. کلیه خدمات دانشگاهی شامل امور آموزشی، فرهنگی و تشکل‌ها، برنامه‌های ورزشی، کتابخانه و پژوهش، نظرسنجی‌ها، انتخابات شورای صنفی، مرکز مشاوره، سامانه‌های دانشجویی و تسویه حساب به‌طور کامل برای شما فعال است.
              </p>
              {student.commuterEligibilityReasons && student.commuterEligibilityReasons.length > 0 && (
                <div className="text-xs text-amber-900 dark:text-amber-100 font-bold">
                  شرط ثبت‌شده ترددی: {formatCommuterReasons(student.commuterEligibilityReasons)}
                </div>
              )}
              {student.commuterRequestNotes && (
                <div className="text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/60 p-3 rounded-2xl border border-amber-200/70 dark:border-amber-800/40">
                  <strong>توضیحات ثبت‌شده دانشجو:</strong> {student.commuterRequestNotes}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'picker' && (
        !student.isProfileCompleted ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border-2 border-dashed border-rose-300 dark:border-rose-900 text-center space-y-4 shadow-sm animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white">
              انتخاب تخت و اتاق منوط به تکمیل پرونده الکترونیک است
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              دانشجومعلم ارجمند، طبق آیین‌نامه اسکان دانشگاه فرهنگیان تا پیش از ثبت کامل و تأیید اطلاعات هویتی، تماس، نشانی و پرونده سلامت، دسترسی به انتخاب اتاق برای شما مقدور نمی‌باشد.
            </p>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-7 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-teal-600/25 cursor-pointer hover:scale-105"
            >
              تکمیل فرم پرونده اسکان
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {!settings.selectionActive && (
              <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center gap-3 text-xs font-bold">
                <Lock className="w-5 h-5 text-rose-600 shrink-0" />
                <span>
                  امکان انتخاب یا جابجایی اتاق و تخت هم‌اکنون توسط مدیر سامانه بسته (غیرفعال) شده است. تنها مشاهده وضعیت اتاق‌ها فعال می‌باشد.
                </span>
              </div>
            )}
            <VisualBedPicker
              student={student}
              dorms={dorms}
              rooms={rooms}
              beds={beds}
              students={students}
              settings={settings}
              onBedSelected={() => {
                onRefreshData();
                setActiveTab('overview');
              }}
            />
          </div>
        )
      )}

      {activeTab === 'guest' && (
        <StudentGuestRequestPanel
          student={student}
          dorm={studentDorm}
          room={studentRoom}
          roommatesCount={roommates.length}
          onDataChanged={onRefreshData}
        />
      )}

      {activeTab === 'surveys' && (
        <StudentSurveyPanel
          student={student}
          onSubmitted={onRefreshData}
        />
      )}

      {/* تب برنامه فرهنگی هفتگی (تأییدشده‌ها) و عضویت در تشکل‌ها/انجمن‌ها */}
      {activeTab === 'cultural' && (() => {
        const weekDays: { key: DayOfWeek; label: string }[] = [
          { key: 'saturday', label: 'شنبه' },
          { key: 'sunday', label: 'یکشنبه' },
          { key: 'monday', label: 'دوشنبه' },
          { key: 'tuesday', label: 'سه‌شنبه' },
          { key: 'wednesday', label: 'چهارشنبه' },
          { key: 'thursday', label: 'پنج‌شنبه' },
          { key: 'friday', label: 'جمعه' },
        ];
        const catLabels: Record<CulturalProgram['category'], string> = {
          cultural: 'فرهنگی و تربیتی',
          religious: 'معارف و قرآنی',
          scientific: 'علمی و پژوهشی',
          artistic: 'هنری و ادبی',
          sports: 'تربیت بدنی و نشاط',
          social: 'اجتماعی و جهادی',
          skill: 'مهارتی و کارگاه',
        };

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {culturalFeedback && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                  culturalFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}
              >
                {culturalFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{culturalFeedback.text}</span>
              </div>
            )}

            {/* جدول زمانی کلاسی هفتگی برنامه‌های فرهنگی و اجتماعی */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                      جدول زمانی هفتگی برنامه‌های فرهنگی و اجتماعی سراها
                    </h3>
                    <p className="text-xs text-slate-400">
                      برنامه‌های تأییدشده توسط واحد امور فرهنگی به تفکیک روزهای هفته و بازه زمانی
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenMessages}
                  className="px-3.5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>ارسال پیام به امور فرهنگی</span>
                </button>
              </div>

              {approvedCulturalPrograms.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  در حال حاضر برنامه فرهنگی تأییدشده‌ای برای جدول هفتگی سراها منتشر نشده است.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {weekDays.map((wd) => {
                    const dayItems = approvedCulturalPrograms
                      .filter((p) => p.dayOfWeek === wd.key)
                      .sort((a, b) => a.startTime.localeCompare(b.startTime));
                    return (
                      <div
                        key={wd.key}
                        className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 overflow-hidden flex flex-col"
                      >
                        <div className="px-3.5 py-2.5 bg-fuchsia-700 text-white font-extrabold text-xs flex items-center justify-between">
                          <span>{wd.label}</span>
                          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px]">
                            {dayItems.length} برنامه
                          </span>
                        </div>
                        <div className="p-2.5 space-y-2 flex-1">
                          {dayItems.length === 0 ? (
                            <div className="text-[11px] text-slate-400 text-center py-4">
                              برنامه‌ای ثبت نشده
                            </div>
                          ) : (
                            dayItems.map((prog) => (
                              <div
                                key={prog.id}
                                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-fuchsia-200/80 dark:border-fuchsia-900/50 space-y-1.5 shadow-xs"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-fuchsia-100 dark:bg-fuchsia-950 text-fuchsia-800 dark:text-fuchsia-300 font-bold">
                                    {catLabels[prog.category]}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-slate-500" dir="ltr">
                                    {prog.startTime} - {prog.endTime}
                                  </span>
                                </div>
                                <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                                  {prog.title}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-fuchsia-600 shrink-0" />
                                  <span>{prog.location} ({prog.dormName})</span>
                                </div>
                                {prog.presenter && (
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                    مجری/استاد: <strong className="text-slate-700 dark:text-slate-200">{prog.presenter}</strong>
                                  </div>
                                )}
                                {prog.description && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1 border-t border-slate-100 dark:border-slate-800">
                                    {prog.description}
                                  </p>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* تشکل‌ها، کانون‌ها و انجمن‌های دانشجویی */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    تشکل‌ها، کانون‌ها و انجمن‌های دانشجویی سراها
                  </h3>
                  <p className="text-xs text-slate-400">
                    مشاهده تشکل‌های فعال، عضویت مستقیم یا ثبت درخواست عضویت برای تأیید امور فرهنگی
                  </p>
                </div>
              </div>

              {activeCulturalAssociations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  در حال حاضر تشکل یا انجمن فعالی ثبت نشده است.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeCulturalAssociations.map((assoc) => {
                    const myMem = myAssociationMemberships.find(
                      (m) => m.associationId === assoc.id && m.status !== 'rejected'
                    );
                    const rejectedMem = !myMem
                      ? myAssociationMemberships.find(
                          (m) => m.associationId === assoc.id && m.status === 'rejected'
                        )
                      : undefined;
                    const approvedCount = Storage.getAssociationMemberships().filter(
                      (m) => m.associationId === assoc.id && m.status === 'approved'
                    ).length;

                    return (
                      <div
                        key={assoc.id}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                {assoc.name}
                              </h4>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300 font-bold">
                                {catLabels[assoc.category]}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-2">
                              <span>{assoc.membershipMode === 'open_instant' ? 'عضویت آزاد و فوری' : 'نیازمند تأیید امور فرهنگی'}</span>
                              <span>•</span>
                              <span>اعضای تأییدشده: {approvedCount}{assoc.maxCapacity ? ` از ${assoc.maxCapacity}` : ''} نفر</span>
                            </div>
                          </div>

                          {myMem && (
                            <span
                              className={`text-[11px] px-2.5 py-1 rounded-xl font-extrabold ${
                                myMem.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {myMem.status === 'approved' ? 'عضو فعال' : 'در انتظار تأیید امور فرهنگی'}
                            </span>
                          )}
                        </div>

                        {assoc.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {assoc.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
                          {assoc.mentorName && <span>مسئول/دبیر: <strong>{assoc.mentorName}</strong></span>}
                          {assoc.meetingSchedule && <span>زمان جلسات: <strong>{assoc.meetingSchedule}</strong></span>}
                          {assoc.location && <span>محل: <strong>{assoc.location}</strong></span>}
                        </div>

                        {rejectedMem && (
                          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300">
                            درخواست قبلی شما تأیید نشد{rejectedMem.reviewNote ? `: ${rejectedMem.reviewNote}` : '.'}
                          </div>
                        )}

                        {!myMem && (
                          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            {assoc.membershipMode === 'requires_approval' && (
                              <input
                                type="text"
                                value={assocNotes[assoc.id] || ''}
                                onChange={(e) =>
                                  setAssocNotes((prev) => ({ ...prev, [assoc.id]: e.target.value }))
                                }
                                placeholder="توضیح یا سوابق علاقه‌مندی شما جهت بررسی امور فرهنگی (اختیاری)..."
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const res = Storage.requestOrJoinAssociation({
                                  association: assoc,
                                  student,
                                  dormName: studentDorm?.name || student.assignedDormName,
                                  requestNote: assocNotes[assoc.id],
                                });
                                setCulturalFeedback({
                                  type: res.success ? 'success' : 'error',
                                  text: res.message,
                                });
                                if (res.success) {
                                  setAssocNotes((prev) => ({ ...prev, [assoc.id]: '' }));
                                  onRefreshData();
                                }
                              }}
                              className="w-full py-2.5 px-4 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <UserPlus className="w-4 h-4" />
                              <span>
                                {assoc.membershipMode === 'open_instant'
                                  ? 'عضویت فوری در این تشکل'
                                  : 'ارسال درخواست عضویت جهت تأیید'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* تب برنامه‌های ورزشی و تربیت بدنی (ثبت‌نام و پیگیری فعالیت‌های ورزشی) */}
      {activeTab === 'sports' && (() => {
        const sportTypeLabels: Record<SportsProgramType, string> = {
          futsal: 'فوتسال',
          volleyball: 'والیبال',
          basketball: 'بسکتبال',
          table_tennis: 'تنیس روی میز',
          badminton: 'بدمینتون',
          chess: 'شطرنج',
          track_field: 'دو و میدانی',
          swimming: 'شنا',
          fitness_morning: 'ورزش صبحگاهی و همگانی',
          hiking: 'کوهپیمایی و طبیعت‌گردی',
          martial_arts: 'ورزش‌های رزمی',
          other: 'سایر رشته‌ها',
        };
        const sportKindLabels: Record<SportsProgramKind, string> = {
          training: 'کلاس و تمرین آموزشی',
          tournament: 'مسابقه و المپیاد درون‌سرایی',
          recreation: 'اردو و برنامه تفریحی',
          morning_exercise: 'ورزش صبحگاهی و نشاط همگانی',
        };
        const sportStatusMeta: Record<SportsProgramStatus, { label: string; cls: string }> = {
          planned: { label: 'به‌زودی (برنامه‌ریزی‌شده)', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
          registration_open: { label: 'ثبت‌نام باز است', cls: 'bg-emerald-600 text-white' },
          ongoing: { label: 'در حال برگزاری', cls: 'bg-cyan-600 text-white' },
          completed: { label: 'پایان‌یافته', cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
          cancelled: { label: 'لغوشده', cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
        };
        const dayLabels: Record<DayOfWeek | 'multiple', string> = {
          saturday: 'شنبه',
          sunday: 'یکشنبه',
          monday: 'دوشنبه',
          tuesday: 'سه‌شنبه',
          wednesday: 'چهارشنبه',
          thursday: 'پنج‌شنبه',
          friday: 'جمعه',
          multiple: 'چند روز در هفته',
        };

        const filteredProgs = publishedSportsPrograms.filter((p) => {
          if (sportsTypeFilter !== 'all' && p.sportType !== sportsTypeFilter) return false;
          if (sportsKindFilter !== 'all' && p.programKind !== sportsKindFilter) return false;
          return true;
        });

        return (
          <div className="space-y-5 animate-in fade-in duration-200">
            {sportsFeedback && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                  sportsFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}
              >
                {sportsFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{sportsFeedback.text}</span>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                      برنامه‌های متنوع ورزشی و تربیت بدنی سراهای دانشجویی
                    </h3>
                    <p className="text-xs text-slate-400">
                      مشاهده برنامه‌های ورزشی برنامه‌ریزی‌شده توسط امور دانشجویی و تربیت بدنی، انتخاب سطح مهارت و ثبت‌نام آنلاین
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={sportsTypeFilter}
                    onChange={(e) => setSportsTypeFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="all">همه رشته‌های ورزشی</option>
                    {(Object.keys(sportTypeLabels) as SportsProgramType[]).map((k) => (
                      <option key={k} value={k}>
                        {sportTypeLabels[k]}
                      </option>
                    ))}
                  </select>

                  <select
                    value={sportsKindFilter}
                    onChange={(e) => setSportsKindFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="all">همه انواع برنامه</option>
                    {(Object.keys(sportKindLabels) as SportsProgramKind[]).map((k) => (
                      <option key={k} value={k}>
                        {sportKindLabels[k]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredProgs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  در حال حاضر برنامه ورزشی منطبق با فیلتر شما منتشر نشده است.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredProgs.map((prog) => {
                    const activeRegs = allSportsRegistrations.filter(
                      (r) => r.programId === prog.id && r.status !== 'cancelled'
                    );
                    const myReg = activeRegs.find((r) => r.studentId === student.studentId);
                    const isFull =
                      Boolean(prog.maxCapacity && prog.maxCapacity > 0 && activeRegs.length >= prog.maxCapacity);
                    const canRegister =
                      (prog.status === 'registration_open' || prog.status === 'ongoing') &&
                      !myReg &&
                      !isFull;
                    const statusBadge = sportStatusMeta[prog.status];

                    return (
                      <div
                        key={prog.id}
                        className="p-5 rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                                  {prog.programCode}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 font-bold">
                                  {sportTypeLabels[prog.sportType]}
                                </span>
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold ${statusBadge.cls}`}>
                                  {statusBadge.label}
                                </span>
                              </div>
                              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                                {prog.title}
                              </h4>
                            </div>

                            {myReg && (
                              <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 text-[11px] font-extrabold inline-flex items-center gap-1 border border-emerald-300 dark:border-emerald-700">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>
                                  {myReg.status === 'attended' ? 'حضور تأییدشده' : 'ثبت‌نام‌شدید'}
                                </span>
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700">
                            <div>
                              <strong>نوع:</strong> {sportKindLabels[prog.programKind]}
                            </div>
                            <div>
                              <strong>محدوده:</strong> {prog.dormName}
                            </div>
                            <div>
                              <strong>زمان:</strong>{' '}
                              {[prog.dayOfWeek ? dayLabels[prog.dayOfWeek] : '', prog.scheduleDate]
                                .filter(Boolean)
                                .join(' • ')}{' '}
                              ({prog.startTime} تا {prog.endTime})
                            </div>
                            <div>
                              <strong>ظرفیت:</strong> {activeRegs.length} /{' '}
                              {prog.maxCapacity ? prog.maxCapacity : 'نامحدود'}
                            </div>
                            <div className="sm:col-span-2 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>
                                <strong>مکان:</strong> {prog.venue}
                                {prog.coachName ? ` • مربی: ${prog.coachName}` : ''}
                              </span>
                            </div>
                          </div>

                          {prog.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {prog.description}
                            </p>
                          )}
                          {(prog.eligibility || prog.equipmentNeeded) && (
                            <div className="text-[11px] text-slate-500 flex flex-wrap gap-3">
                              {prog.eligibility && <span>شرایط: {prog.eligibility}</span>}
                              {prog.equipmentNeeded && <span>لوازم: {prog.equipmentNeeded}</span>}
                            </div>
                          )}
                        </div>

                        {myReg ? (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-500">
                              زمان ثبت‌نام: {myReg.registeredAt}
                            </span>
                            {myReg.status !== 'attended' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const res = Storage.cancelSportsRegistration(
                                    prog.id,
                                    student.studentId
                                  );
                                  setSportsFeedback({
                                    type: res.success ? 'success' : 'error',
                                    text: res.message,
                                  });
                                  if (res.success) onRefreshData();
                                }}
                                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>انصراف از برنامه</span>
                              </button>
                            )}
                          </div>
                        ) : canRegister ? (
                          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <select
                                value={sportsSkillByProg[prog.id] || 'beginner'}
                                onChange={(e) =>
                                  setSportsSkillByProg((prev) => ({
                                    ...prev,
                                    [prog.id]: e.target.value as 'beginner' | 'intermediate' | 'advanced',
                                  }))
                                }
                                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                              >
                                <option value="beginner">سطح مهارت: مبتدی</option>
                                <option value="intermediate">سطح مهارت: متوسط</option>
                                <option value="advanced">سطح مهارت: حرفه‌ای / تیمی</option>
                              </select>
                              <input
                                type="text"
                                value={sportsNotesByProg[prog.id] || ''}
                                onChange={(e) =>
                                  setSportsNotesByProg((prev) => ({
                                    ...prev,
                                    [prog.id]: e.target.value,
                                  }))
                                }
                                placeholder="توضیح یا پست بازی (اختیاری)..."
                                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                              />
                            </div>

                            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(sportsHealthByProg[prog.id])}
                                onChange={(e) =>
                                  setSportsHealthByProg((prev) => ({
                                    ...prev,
                                    [prog.id]: e.target.checked,
                                  }))
                                }
                              />
                              <span>آمادگی جسمانی و سلامت خود برای شرکت در این فعالیت ورزشی را تأیید می‌کنم.</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                const res = Storage.registerForSportsProgram({
                                  program: prog,
                                  student,
                                  dormName: studentDorm?.name || student.assignedDormName,
                                  roomNumber: studentRoom?.roomNumber || student.assignedRoomNumber,
                                  skillLevel: sportsSkillByProg[prog.id] || 'beginner',
                                  healthConfirmed: Boolean(sportsHealthByProg[prog.id]),
                                  note: sportsNotesByProg[prog.id] || '',
                                });
                                setSportsFeedback({
                                  type: res.success ? 'success' : 'error',
                                  text: res.message,
                                });
                                if (res.success) {
                                  setSportsNotesByProg((prev) => ({ ...prev, [prog.id]: '' }));
                                  onRefreshData();
                                }
                              }}
                              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Dumbbell className="w-4 h-4" />
                              <span>ثبت‌نام قطعی در برنامه ورزشی</span>
                            </button>
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                            {isFull
                              ? 'ظرفیت ثبت‌نام این برنامه تکمیل شده است.'
                              : prog.status === 'planned'
                              ? 'ثبت‌نام این برنامه به‌زودی توسط امور دانشجویی باز خواهد شد.'
                              : 'مهلت ثبت‌نام این برنامه به پایان رسیده است.'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* تب انتخابات شورای صنفی (رأی‌گیری منحصراً در بازه زمانی فعال‌شده مجاز است) */}
      {activeTab === 'elections' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {electionFeedback && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                electionFeedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {electionFeedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{electionFeedback.text}</span>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700">
                  <Vote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    صندوق الکترونیکی انتخابات شورای صنفی دانشجویان
                  </h3>
                  <p className="text-xs text-slate-400">
                    رأی‌گیری منحصراً در بازه زمانی فعال‌شده و اطلاع‌رسانی‌شده توسط امور دانشجویی امکان‌پذیر است
                  </p>
                </div>
              </div>
            </div>

            {allGuildElections.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                در حال حاضر هیچ دوره انتخاباتی برای شورای صنفی ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-5">
                {allGuildElections.map((el) => {
                  const hasVoted = Storage.hasStudentVotedInElection(el.id, student.studentId);
                  const isEligible = el.targetEligibility === 'all_students' || isStudentDormResident;
                  const canVoteNow = el.isActiveWindow && isEligible && !hasVoted;
                  const selectedIds = selectedCandidatesByElection[el.id] || [];

                  return (
                    <div
                      key={el.id}
                      className={`p-5 rounded-3xl border space-y-4 ${
                        el.isActiveWindow
                          ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                              {el.title}
                            </h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                              {el.electionCode}
                            </span>
                            {el.isActiveWindow ? (
                              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold">
                                بازه رأی‌گیری فعال است
                              </span>
                            ) : (
                              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-extrabold inline-flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                <span>بازه رأی‌گیری غیرفعال / بسته است</span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3">
                            <span>بازه زمانی: {el.startDate} {el.startTime || ''} تا {el.endDate} {el.endTime || ''}</span>
                            <span>•</span>
                            <span>سقف انتخاب: حداکثر {el.maxSelections} کاندیدا</span>
                            <span>•</span>
                            <span>جامعه هدف: {el.targetEligibility === 'dorm_only' ? 'دانشجویان خوابگاهی' : 'کلیه دانشجویان (خوابگاهی و ترددی)'}</span>
                          </div>
                        </div>

                        {hasVoted && (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-extrabold inline-flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-700">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span>رأی شما ثبت شده است</span>
                          </span>
                        )}
                      </div>

                      {el.noticeText && (
                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {el.noticeText}
                        </div>
                      )}

                      {!el.isActiveWindow && !hasVoted && (
                        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 font-bold flex items-center gap-2">
                          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            ثبت رأی فقط در بازه زمانی که واحد امور دانشجویی رأی‌گیری را فعال و اطلاع‌رسانی کند امکان‌پذیر است.
                          </span>
                        </div>
                      )}

                      {!isEligible && (
                        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 font-bold">
                          این انتخابات ویژه دانشجویان دارای اسکان خوابگاهی تعریف شده است.
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {el.candidates.map((cand) => {
                          const isChecked = selectedIds.includes(cand.id);
                          return (
                            <button
                              key={cand.id}
                              type="button"
                              disabled={!canVoteNow}
                              onClick={() => {
                                if (!canVoteNow) return;
                                setSelectedCandidatesByElection((prev) => {
                                  const curr = prev[el.id] || [];
                                  if (curr.includes(cand.id)) {
                                    return { ...prev, [el.id]: curr.filter((c) => c !== cand.id) };
                                  }
                                  if (el.maxSelections <= 1) {
                                    return { ...prev, [el.id]: [cand.id] };
                                  }
                                  if (curr.length >= el.maxSelections) {
                                    return prev;
                                  }
                                  return { ...prev, [el.id]: [...curr, cand.id] };
                                });
                              }}
                              className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between gap-2 ${
                                !canVoteNow
                                  ? 'opacity-70 cursor-not-allowed bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                                  : isChecked
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md cursor-pointer'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-400 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-extrabold text-xs sm:text-sm">{cand.fullName}</div>
                                  {(cand.fieldOfStudy || cand.dormName) && (
                                    <div className={`text-[11px] mt-0.5 ${isChecked ? 'text-indigo-100' : 'text-slate-500'}`}>
                                      {[cand.fieldOfStudy, cand.entryTerm, cand.dormName].filter(Boolean).join(' • ')}
                                    </div>
                                  )}
                                </div>
                                <span
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 text-[10px] font-black ${
                                    isChecked
                                      ? 'bg-white text-indigo-700 border-white'
                                      : 'border-slate-300 dark:border-slate-600'
                                  }`}
                                >
                                  {isChecked ? '✓' : ''}
                                </span>
                              </div>
                              {cand.slogan && (
                                <p className={`text-[11px] leading-relaxed ${isChecked ? 'text-indigo-50' : 'text-slate-600 dark:text-slate-400'}`}>
                                  «{cand.slogan}»
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {canVoteNow && (
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-indigo-200/70 dark:border-indigo-800/50">
                          <div className="text-xs text-slate-600 dark:text-slate-300">
                            تعداد کاندیدای انتخاب‌شده: <strong>{selectedIds.length}</strong> از {el.maxSelections}
                          </div>
                          <button
                            type="button"
                            disabled={selectedIds.length === 0}
                            onClick={() => {
                              const res = Storage.castGuildElectionVote({
                                election: el,
                                student,
                                candidateIds: selectedIds,
                                dormName: studentDorm?.name || student.assignedDormName,
                              });
                              setElectionFeedback({
                                type: res.success ? 'success' : 'error',
                                text: res.message,
                              });
                              if (res.success) {
                                onRefreshData();
                              }
                            }}
                            className="px-6 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
                          >
                            <Send className="w-4 h-4" />
                            <span>ثبت نهایی رأی در صندوق انتخابات</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* تب کتابخانه و پژوهش دانشجو */}
      {activeTab === 'library' && (
        <StudentLibraryPanel student={student} onDataChange={onRefreshData} />
      )}

      {/* تب تسویه حساب الکترونیک فراغت از تحصیل */}
      {activeTab === 'clearance' && (
        <StudentGraduationClearancePanel
          student={student}
          dormName={studentDorm?.name || student.assignedDormName}
          roomNumber={studentRoom?.roomNumber || student.assignedRoomNumber}
          settings={settings}
          onDataChange={onRefreshData}
        />
      )}

      {/* تب تالار گفتگوی عمومی، گروه‌های تخصصی و پیام‌رسان دانشجویی */}
      {activeTab === 'community_chat' && (
        <CommunityChatHub
          currentUser={{ role: 'student', student }}
          students={students}
          mode="embedded"
          onRefreshGlobalData={onRefreshData}
        />
      )}

      {/* تب سامانه‌ها و درگاه‌های رسمی دانشگاه فرهنگیان (قابل ایجاد و ویرایش توسط مدیر کل) */}
      {activeTab === 'portals' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                  سامانه‌ها و درگاه‌های رسمی دانشگاه فرهنگیان
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  دسترسی سریع به سامانه‌های پرکاربرد آموزشی، تغذیه، هوشمندسازی، مالی و کانال‌های رسمی اطلاع‌رسانی (تمامی لینک‌ها در صفحه جدید باز می‌شوند)
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
              <ExternalLink className="w-3.5 h-3.5 text-cyan-600" />
              <span>باز شدن در تب جدید مرورگر</span>
            </span>
          </div>

          {activeStudentPortals.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
              در حال حاضر هیچ سامانه فعالی توسط مدیریت ثبت نشده است.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStudentPortals.map((portal) => {
                const PortalIcon = renderPortalIcon(portal.iconKey);
                const colorCfg =
                  PORTAL_COLOR_STYLES[portal.colorKey || 'teal'] || PORTAL_COLOR_STYLES.teal;
                return (
                  <div
                    key={portal.id}
                    className="flex flex-col justify-between p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-800 hover:border-cyan-400/70 dark:hover:border-cyan-700 transition shadow-xs space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className={`p-2.5 rounded-xl border ${colorCfg.accentWrap}`}>
                          <PortalIcon className="w-5 h-5" />
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${colorCfg.badgeCls}`}>
                          {portal.category}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="font-black text-sm text-slate-900 dark:text-white leading-snug">
                          {portal.title}
                        </h4>
                        {portal.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {portal.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-700/60">
                      <div
                        className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate bg-white dark:bg-slate-900/70 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700"
                        dir="ltr"
                      >
                        {portal.displayUrl || portal.url}
                      </div>
                      <a
                        href={portal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-sm ${colorCfg.btnCls}`}
                      >
                        <span>{portal.ctaLabel || `ورود به ${portal.title}`}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* مدال کارت شناسایی و مجوز اسکان سرا */}
      <DormIdCardModal
        isOpen={isIdCardModalOpen}
        onClose={() => setIsIdCardModalOpen(false)}
        student={student}
        dorm={studentDorm}
        room={studentRoom}
        bed={studentBed}
        settings={settings}
      />

      {/* مدال کارنامه جامع فعالیت‌های فرهنگی، اجتماعی، ورزشی و انضباطی دانشجو */}
      <StudentActivityTranscriptModal
        isOpen={isTranscriptModalOpen}
        onClose={() => setIsTranscriptModalOpen(false)}
        initialStudent={student}
        allowStudentPicker={false}
        viewerRoleLabel="دانشجو"
      />

      <ImageLightboxModal
        src={previewAnnImage}
        alt="تصویر اطلاعیه"
        onClose={() => setPreviewAnnImage(null)}
      />

    </div>
  );
};
