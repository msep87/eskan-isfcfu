import React, { useState, useEffect } from 'react';
import {
  Student,
  Dormitory,
  Room,
  Bed,
  Supervisor,
  Announcement,
  RoomWarning,
  Message,
  AppSettings,
  CurrentUser,
  MaintenanceStaff,
  MaintenanceTask,
  WarehouseStaff,
  InventoryItem,
  WarehouseRequest,
  CounselorStaff,
  CounselorShiftSchedule,
  CounselorShiftReport,
} from './types';
import { Storage, initializeStorageIfNeeded } from './utils/storage';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { AppearanceModal } from './components/AppearanceModal';
import { ReportsView } from './components/ReportsView';
import { ExcelImportModal } from './components/ExcelImportModal';
import { MessagingPanel } from './components/MessagingPanel';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { StudentDashboard } from './components/StudentDashboard';
import { SupervisorDashboard } from './components/SupervisorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { MaintenanceDashboard } from './components/MaintenanceDashboard';
import { WarehouseDashboard } from './components/WarehouseDashboard';
import { CounselorDashboard } from './components/CounselorDashboard';
import { AboutModal } from './components/AboutModal';
import { UserGuideModal } from './components/UserGuideModal';
import { UserRoleType } from './utils/guideData';
import { FarhangianEmblem } from './components/FarhangianEmblem';
import {
  Building2,
  GraduationCap,
  Users,
  Bed as BedIcon,
  Shield,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  BarChart3,
  Calendar,
  CheckCircle,
  Bell,
  School,
  Clock,
  Info,
  BookOpen,
} from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(Storage.getSettings());
  const [currentUser, setCurrentUser] = useState<CurrentUser>(Storage.getCurrentUser());
  const [dorms, setDorms] = useState<Dormitory[]>(Storage.getDormitories());
  const [rooms, setRooms] = useState<Room[]>(Storage.getRooms());
  const [beds, setBeds] = useState<Bed[]>(Storage.getBeds());
  const [students, setStudents] = useState<Student[]>(Storage.getStudents());
  const [supervisors, setSupervisors] = useState<Supervisor[]>(Storage.getSupervisors());
  const [warnings, setWarnings] = useState<RoomWarning[]>(Storage.getWarnings());
  const [announcements, setAnnouncements] = useState<Announcement[]>(Storage.getAnnouncements());
  const [messages, setMessages] = useState<Message[]>(Storage.getMessages());
  const [maintenanceStaff, setMaintenanceStaff] = useState<MaintenanceStaff[]>(Storage.getMaintenanceStaff());
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>(Storage.getMaintenanceTasks());
  const [warehouseStaff, setWarehouseStaff] = useState<WarehouseStaff[]>(Storage.getWarehouseStaff());
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(Storage.getInventoryItems());
  const [warehouseRequests, setWarehouseRequests] = useState<WarehouseRequest[]>(Storage.getWarehouseRequests());

  // مقداردهی اولیه داده‌ها
// مقداردهی اولیه داده‌ها و دریافت لیست دانشجویان از دیتابیس ابری
  useEffect(() => {
    initializeStorageIfNeeded();
    
    Storage.fetchStudentsFromDB().then(() => {
      setStudents(Storage.getStudents());
    });
  }, []);

  // تزریق پویای فونت‌های بارگذاری شده (TTF / WOFF) به سند
  useEffect(() => {
    if (settings.customFonts && settings.customFonts.length > 0) {
      let styleTag = document.getElementById('custom-uploaded-fonts') as HTMLStyleElement;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'custom-uploaded-fonts';
        document.head.appendChild(styleTag);
      }

      const fontFaceRules = settings.customFonts
        .map(
          (cf) => `
        @font-face {
          font-family: '${cf.fontFamily}';
          src: url('${cf.dataUrl}') format('${cf.format || 'truetype'}');
          font-weight: normal;
          font-style: normal;
        }
      `
        )
        .join('\n');

      styleTag.textContent = fontFaceRules;
    }
  }, [settings.customFonts]);

  // اعمال مقیاس درصدی اندازه فونت‌ها در کل سند (مثلاً ۱۰۰٪ پیش‌فرض یا ۱۵۰٪)
  useEffect(() => {
    const scale = Number(settings.fontScale) || 100;
    document.documentElement.style.fontSize = `${scale}%`;
  }, [settings.fontScale]);

  // کنترل وضعیت مودال‌ها
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const [userGuideInitialRole, setUserGuideInitialRole] = useState<UserRoleType>('student');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleOpenUserGuide = (role?: UserRoleType) => {
    if (role) {
      setUserGuideInitialRole(role);
    } else if (currentUser?.role) {
      setUserGuideInitialRole(currentUser.role as UserRoleType);
    } else {
      setUserGuideInitialRole('student');
    }
    setIsUserGuideOpen(true);
  };

  // بروزرسانی داده‌ها از storage
  const refreshAllData = () => {
    setSettings(Storage.getSettings());
    setDorms(Storage.getDormitories());
    setRooms(Storage.getRooms());
    setBeds(Storage.getBeds());
    setStudents(Storage.getStudents());
    setSupervisors(Storage.getSupervisors());
    setWarnings(Storage.getWarnings());
    setAnnouncements(Storage.getAnnouncements());
    setMessages(Storage.getMessages());
    setMaintenanceStaff(Storage.getMaintenanceStaff());
    setMaintenanceTasks(Storage.getMaintenanceTasks());
    setWarehouseStaff(Storage.getWarehouseStaff());
    setInventoryItems(Storage.getInventoryItems());
    setWarehouseRequests(Storage.getWarehouseRequests());

    const user = Storage.getCurrentUser();
    if (user && user.role === 'student') {
      const refreshedStudent = Storage.getStudents().find((s) => s.studentId === user.student.studentId);
      if (refreshedStudent) {
        setCurrentUser({ role: 'student', student: refreshedStudent });
      }
    } else if (user && user.role === 'maintenance') {
      const refreshedTech = Storage.getMaintenanceStaff().find((t) => t.id === user.technician.id);
      if (refreshedTech) {
        setCurrentUser({ role: 'maintenance', technician: refreshedTech });
      }
    } else if (user && user.role === 'warehouse') {
      const refreshedStaff = Storage.getWarehouseStaff().find((w) => w.id === user.staff.id);
      if (refreshedStaff) {
        setCurrentUser({ role: 'warehouse', staff: refreshedStaff });
      }
    } else if (user && user.role === 'counselor') {
      const refreshedCns = Storage.getCounselors().find((c) => c.id === user.counselor.id);
      if (refreshedCns) {
        setCurrentUser({ role: 'counselor', counselor: refreshedCns });
      }
    }
  };

  const handleLoginSuccess = (user: NonNullable<CurrentUser>) => {
    setCurrentUser(user);
    Storage.setCurrentUser(user);
    refreshAllData();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    Storage.setCurrentUser(null);
  };

  // اعمال استایل فونت، اندازه، والپیپر سفارشی و دارک‌مود
  const isCustomFont = settings.customFonts?.some((cf) => cf.fontFamily === settings.fontFamily);
  const fontClass = isCustomFont ? '' : `font-${settings.fontFamily || 'vazir'}`;
  const fontStyle = isCustomFont
    ? { fontFamily: `'${settings.fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` }
    : undefined;

  const fontSizeClass =
    settings.fontSize === 'sm' ? 'text-xs' : settings.fontSize === 'lg' ? 'text-base' : 'text-sm';

  const isCustomWallpaper = settings.wallpaper === 'custom' && Boolean(settings.customWallpaperUrl);
  const wallpaperClass = isCustomWallpaper ? '' : `wallpaper-${settings.wallpaper || 'pattern-islamic'}`;
  const wallpaperStyle = isCustomWallpaper
    ? {
        backgroundImage: `url(${settings.customWallpaperUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }
    : undefined;

  const mergedRootStyle: React.CSSProperties = {
    ...fontStyle,
    ...wallpaperStyle,
  };

  return (
    <div
      style={mergedRootStyle}
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        settings.darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
      } ${fontClass} ${fontSizeClass} ${wallpaperClass}`}
    >
      {/* نوار بالایی سامانه */}
      <Navbar
        currentUser={currentUser}
        settings={settings}
        warnings={warnings}
        messages={messages}
        onOpenAppearance={() => setIsAppearanceModalOpen(true)}
        onOpenReports={() => {
          if (currentUser) setIsReportsModalOpen(true);
        }}
        onOpenMessages={() => setIsMessagesModalOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
        onLogout={handleLogout}
        onNavigateHome={() => {}}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onOpenUserGuide={() => handleOpenUserGuide()}
      />

      {/* بنر اطلاعیه سراسری در بالای صفحه */}
      {settings.announcementBanner && (
        <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-600 text-white text-xs py-2.5 px-4 text-center font-bold flex items-center justify-center gap-2 shadow-xs">
          <Bell className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{settings.announcementBanner}</span>
        </div>
      )}

      {/* بدنه اصلی */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* ۱. صفحه فرود برای مراجعین قبل از ورود به سامانه (بدون نمایش آمار به عموم) */}
        {!currentUser && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* هیرو بنر رسمی با آرم دانشگاه فرهنگیان */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-teal-800 via-teal-700 to-cyan-800 text-white p-8 sm:p-12 shadow-2xl">
              <div className="max-w-3xl relative z-10">
                
                {/* آرم دانشگاه و نشان رسمی (در صورت بارگذاری توسط مدیر) */}
                <div className="flex items-center gap-4 mb-5">
                  {settings.customLogoUrl && (
                    <div className="bg-white p-2 rounded-2xl shadow-lg border border-white/40 shrink-0">
                      <FarhangianEmblem size={74} customLogoUrl={settings.customLogoUrl} />
                    </div>
                  )}
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold border border-white/20 mb-1">
                      <School className="w-4 h-4 text-amber-300" />
                      <span>دانشگاه فرهنگیان استان اصفهان</span>
                    </div>
                    <div className="text-xs text-teal-200 font-semibold">
                      اداره امور سراهای دانشجویی (خوابگاه‌ها) • سال تحصیلی {settings.currentAcademicYear}
                    </div>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight mb-6">
                  سامانه مدیریت و انتخاب سراهای دانشجویی
                </h1>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-7 py-3.5 bg-white text-teal-900 hover:bg-teal-50 rounded-2xl font-black text-sm shadow-xl transition flex items-center gap-2 cursor-pointer hover:scale-105"
                  >
                    <span>ورود به سامانه سراها (دانشجو / سرپرست / مدیر)</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>

                  <button
                    onClick={() => handleOpenUserGuide()}
                    className="px-5 py-3.5 bg-teal-900/70 hover:bg-teal-900 text-teal-100 hover:text-white rounded-2xl font-bold text-xs sm:text-sm border border-white/20 transition flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <BookOpen className="w-4 h-4 text-amber-300" />
                    <span>راهنمای متنی و تصویری کاربری (PDF)</span>
                  </button>

                  {/* وضعیت زمانی انتخاب واحد */}
                  <div className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-teal-900/60 border border-white/15 text-xs text-teal-100 backdrop-blur-md">
                    <Clock className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>
                      {settings.selectionActive
                        ? `بازه مجاز انتخاب اتاق: ${settings.selectionStartDate} تا ${settings.selectionEndDate}`
                        : 'سامانه انتخاب اتاق در حال حاضر غیرفعال است'}
                    </span>
                  </div>
                </div>

              </div>

              {/* طرح و المان گرافیکی زمینه */}
              <div className="hidden lg:block absolute left-8 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                <Building2 className="w-72 h-72 text-white" />
              </div>
            </div>

            {/* ۲. بخش اطلاعیه‌های عمومی سراها در صفحه اول (قابل مشاهده برای همه دانشجویان قبل از ورود) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                      اطلاعیه‌ها، بخشنامه‌ها و زمان‌بندی امور سراهای دانشجویی
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      سال تحصیلی {settings.currentAcademicYear} • {settings.currentSemester}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 cursor-pointer"
                >
                  <span>ورود به حساب کاربری</span>
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                </button>
              </div>

              {/* فقط اطلاعیه‌های منتشر شده در صفحه اول نمایش داده می‌شوند */}
              {announcements.filter((a) => a.showOnHomePage !== false).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  در حال حاضر اطلاعیه عمومی جدیدی منتشر نشده است.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {announcements.filter((a) => a.showOnHomePage !== false).map((ann) => (
                    <div
                      key={ann.id}
                      className={`p-5 rounded-2xl border transition ${
                        ann.priority === 'urgent'
                          ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                          : ann.priority === 'important'
                          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {ann.priority === 'urgent' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold">
                              فوری
                            </span>
                          )}
                          {ann.priority === 'important' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold">
                              مهم
                            </span>
                          )}
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {ann.title}
                          </h3>
                        </div>
                        <span className="text-[11px] text-slate-400">{ann.date}</span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {ann.content}
                      </p>

                      {ann.imageUrl && (
                        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-black/5">
                          <img
                            src={ann.imageUrl}
                            alt={ann.title}
                            onClick={() => setPreviewImage(ann.imageUrl || null)}
                            className="w-full max-h-48 object-cover cursor-pointer hover:opacity-95 transition"
                            title="کلیک جهت مشاهده در اندازه کامل"
                          />
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-black/5 dark:border-white/5 font-medium flex items-center justify-between">
                        <span>صادرکننده: {ann.author}</span>
                        <span className="text-teal-600 font-semibold cursor-pointer" onClick={() => setIsLoginModalOpen(true)}>
                          جهت اقدام وارد شوید ←
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* راهنمای نحوه استفاده و ضوابط عمومی */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-600" />
                <span>نکات مهم انتخاب اتاق و اسکان در سراهای دانشگاه فرهنگیان اصفهان</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">۱. احراز هویت اولیه:</span>
                  دانشجومعلمان با شماره دانشجویی و کد ملی وارد سامانه شده و در اولین ورود اطلاعات تماس ضروری و تصویر پرسنلی خود را تکمیل می‌نمایند.
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">۲. انتخاب هوشمند اتاق و تخت:</span>
                  انتخاب تخت به صورت کاملاً تعاملی و بر اساس سهمیه رشته‌ها و ورودی‌ها انجام می‌پذیرد و مشخصات هم‌اتاقی‌ها قابل مشاهده است.
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">۳. پشتیبانی و پیام مستقیم:</span>
                  در صورت نیاز به جابجایی یا گزارش تأسیسات اتاق، ارسال پیام و تیکت مستقیم به سرپرست سرا از درون سامانه مقدور است.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ۲. در صورتی که کاربر دانشجو است */}
        {currentUser?.role === 'student' && (
          <StudentDashboard
            student={currentUser.student}
            dorms={dorms}
            rooms={rooms}
            beds={beds}
            students={students}
            announcements={announcements}
            warnings={warnings}
            settings={settings}
            onRefreshData={refreshAllData}
            onOpenMessages={() => setIsMessagesModalOpen(true)}
            onOpenUserGuide={() => handleOpenUserGuide('student')}
          />
        )}

        {/* ۳. در صورتی که کاربر سرپرست خوابگاه است */}
        {currentUser?.role === 'supervisor' && (
          <SupervisorDashboard
            supervisor={currentUser.supervisor}
            dorms={dorms}
            rooms={rooms}
            beds={beds}
            students={students}
            announcements={announcements}
            warnings={warnings}
            settings={settings}
            maintenanceTasks={maintenanceTasks}
            maintenanceStaff={maintenanceStaff}
            onRefreshData={refreshAllData}
            onOpenReports={() => setIsReportsModalOpen(true)}
            onOpenMessages={() => setIsMessagesModalOpen(true)}
            onOpenExcelModal={() => setIsExcelModalOpen(true)}
            onOpenUserGuide={(r) => handleOpenUserGuide(r || 'supervisor')}
          />
        )}

        {/* ۴. در صورتی که کاربر مدیر کل سامانه است */}
        {currentUser?.role === 'admin' && (
          <AdminDashboard
            settings={settings}
            dorms={dorms}
            rooms={rooms}
            beds={beds}
            students={students}
            supervisors={supervisors}
            announcements={announcements}
            warnings={warnings}
            maintenanceTasks={maintenanceTasks}
            maintenanceStaff={maintenanceStaff}
            onRefreshData={refreshAllData}
            onOpenExcelModal={() => setIsExcelModalOpen(true)}
            onOpenReports={() => setIsReportsModalOpen(true)}
            onOpenAppearance={() => setIsAppearanceModalOpen(true)}
            onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
            onUpdateSettings={(newSt) => {
              setSettings(newSt);
              refreshAllData();
            }}
            onOpenUserGuide={(r) => handleOpenUserGuide(r || 'admin')}
          />
        )}

        {/* ۵. در صورتی که کاربر تکنسین و کارشناس تأسیسات است */}
        {currentUser?.role === 'maintenance' && (
          <MaintenanceDashboard
            technician={currentUser.technician}
            dorms={dorms}
            rooms={rooms}
            tasks={maintenanceTasks}
            onRefreshData={refreshAllData}
            onOpenMessages={() => setIsMessagesModalOpen(true)}
            onOpenUserGuide={(r) => handleOpenUserGuide(r || 'maintenance')}
          />
        )}

        {/* ۶. در صورتی که کاربر انبار و کارپردازی تجهیزات سراها است */}
        {currentUser?.role === 'warehouse' && (
          <WarehouseDashboard
            staff={currentUser.staff}
            dorms={dorms}
            onRefreshData={refreshAllData}
            onOpenMessages={() => setIsMessagesModalOpen(true)}
            onOpenUserGuide={(r) => handleOpenUserGuide(r || 'warehouse')}
          />
        )}

        {/* ۷. در صورتی که کاربر مشاور و روانشناس سراها است */}
        {currentUser?.role === 'counselor' && (
          <CounselorDashboard
            counselor={currentUser.counselor}
            dorms={dorms}
            shifts={Storage.getCounselorShifts()}
            reports={Storage.getCounselorReports()}
            messages={messages}
            onRefreshData={refreshAllData}
            onOpenMessages={() => setIsMessagesModalOpen(true)}
            onOpenUserGuide={(r) => handleOpenUserGuide(r || 'counselor')}
          />
        )}

      </main>

      {/* فوتر سایت */}
      <footer className="mt-auto py-6 border-t border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {settings.customLogoUrl && (
              <div className="bg-white p-1 rounded-lg border border-slate-200 shrink-0">
                <FarhangianEmblem size={24} customLogoUrl={settings.customLogoUrl} />
              </div>
            )}
            <span>دانشگاه فرهنگیان استان اصفهان • سامانه جامع سراهای دانشجویی</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="text-teal-600 dark:text-teal-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>درباره ما (طراحی: دکتر محمد سپیانی)</span>
            </button>
            <span>•</span>
            <button
              onClick={() => handleOpenUserGuide()}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>راهنمای کاربری و دانلود PDF</span>
            </button>
            <span>•</span>
            <span>سال تحصیلی {settings.currentAcademicYear || '۱۴۰۵-۱۴۰۶'} ({settings.currentSemester})</span>
          </div>
        </div>
      </footer>

      {/* مودال‌های مشترک */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        customLogoUrl={settings.customLogoUrl}
      />

      <UserGuideModal
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
        initialRole={userGuideInitialRole}
        customLogoUrl={settings.customLogoUrl}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onOpenUserGuide={(r) => handleOpenUserGuide(r)}
      />

      {currentUser?.role === 'admin' && (
        <AppearanceModal
          isOpen={isAppearanceModalOpen}
          onClose={() => setIsAppearanceModalOpen(false)}
          settings={settings}
          onUpdateSettings={(newSt) => {
            setSettings(newSt);
            Storage.setSettings(newSt);
          }}
        />
      )}

      {currentUser && (
        <ReportsView
          isOpen={isReportsModalOpen}
          onClose={() => setIsReportsModalOpen(false)}
          dorms={dorms}
          rooms={rooms}
          beds={beds}
          students={students}
        />
      )}

      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImportComplete={() => {
          setIsExcelModalOpen(false);
          refreshAllData();
        }}
      />

      {currentUser && (
        <MessagingPanel
          isOpen={isMessagesModalOpen}
          onClose={() => setIsMessagesModalOpen(false)}
          currentUser={currentUser}
          messages={messages}
          onMessagesUpdated={refreshAllData}
        />
      )}

      {currentUser && (
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* مدال بزرگ‌نمایی تصویر اطلاعیه */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl p-3 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImage}
              alt="پوستر اطلاعیه"
              className="max-h-[82vh] w-auto mx-auto rounded-2xl object-contain"
            />
            <div className="p-3 text-center">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-6 py-2 bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                بستن تصویر
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
