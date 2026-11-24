import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { lazyWithRetry, ChunkErrorBoundary } from './utils/lazyWithRetry';
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
  FinanceStaff,
  StudentFinancialRecord,
  EducationStaff,
  PeriodicSurvey,
  GuildElection,
} from './types';
import { Storage, initializeStorageIfNeeded } from './utils/storage';
import {
  AppNotificationItem,
  NotificationPreferences,
  detectNewUserNotifications,
  dispatchOSNotification,
  getNotificationPermissionState,
  getUserNotificationKey,
  isIOSDevice,
  isNotificationPromptSnoozed,
  isRunningStandalonePWA,
  loadNotificationFeed,
  loadNotificationPrefs,
  playIncomingCallRingtone,
  playNotificationChime,
  requestSystemNotificationPermission,
  saveNotificationFeed,
  saveNotificationPrefs,
  snoozeNotificationPrompt,
  updateAppIconBadge,
} from './utils/notificationManager';
import {
  IncomingPrivateChatPayload,
  IncomingVoiceCallPayload,
  TerminateSessionPayload,
  broadcastCallRejected,
  broadcastTerminateSessions,
  getRealtimeUserIdentity,
  loadAutoCloseOtherSessionsPref,
  resetTabLoginTime,
  saveAutoCloseOtherSessionsPref,
  subscribeQuickStaffComm,
  useRealtimePortalPresence,
} from './utils/realtimePresence';
import { canRoleUseLiveVoiceCall, makeStaffDmRoomId } from './utils/communityStickers';
import { Navbar } from './components/Navbar';
import { JalaliLiveClockBar } from './components/JalaliLiveClockBar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { ActiveSessionsModal } from './components/ActiveSessionsModal';
import { IncomingCallFloatingBanner } from './components/IncomingCallFloatingBanner';
import { LiveVoiceCallModal, LiveVoiceCallTarget } from './components/LiveVoiceCallModal';
import type { CommunityChatInitialTarget } from './components/CommunityChatHub';
import {
  NotificationPromptBanner,
  LiveNotificationToasts,
} from './components/NotificationPromptBanner';
import type { ExcelImportTab } from './components/ExcelImportModal';
import { RichTextDisplay } from './components/RichTextEditor';
import { AnnouncementImageBox, ImageLightboxModal } from './components/ImageLightboxModal';
import { ImportantAnnouncementsWidget } from './components/ImportantAnnouncementsWidget';

// بارگذاری تنبل (Code-Splitting) با تلاش مجدد خودکار برای افزایش سرعت و پایداری لود
const LoginModal = lazyWithRetry(() => import('./components/LoginModal').then((m) => ({ default: m.LoginModal })));
const AppearanceModal = lazyWithRetry(() => import('./components/AppearanceModal').then((m) => ({ default: m.AppearanceModal })));
const ReportsView = lazyWithRetry(() => import('./components/ReportsView').then((m) => ({ default: m.ReportsView })));
const ExcelImportModal = lazyWithRetry(() => import('./components/ExcelImportModal').then((m) => ({ default: m.ExcelImportModal })));
const MessagingPanel = lazyWithRetry(() => import('./components/MessagingPanel').then((m) => ({ default: m.MessagingPanel })));
const ChangePasswordModal = lazyWithRetry(() => import('./components/ChangePasswordModal').then((m) => ({ default: m.ChangePasswordModal })));
const AboutModal = lazyWithRetry(() => import('./components/AboutModal').then((m) => ({ default: m.AboutModal })));
const UserGuideModal = lazyWithRetry(() => import('./components/UserGuideModal').then((m) => ({ default: m.UserGuideModal })));
const AiDormAssistant = lazyWithRetry(() => import('./components/AiDormAssistant').then((m) => ({ default: m.AiDormAssistant })));
const CommunityChatHub = lazyWithRetry(() => import('./components/CommunityChatHub').then((m) => ({ default: m.CommunityChatHub })));
const WarehouseRequisitionModal = lazyWithRetry(() => import('./components/WarehouseRequisitionModal').then((m) => ({ default: m.WarehouseRequisitionModal })));

const StudentDashboard = lazyWithRetry(() => import('./components/StudentDashboard').then((m) => ({ default: m.StudentDashboard })));
const SupervisorDashboard = lazyWithRetry(() => import('./components/SupervisorDashboard').then((m) => ({ default: m.SupervisorDashboard })));
const AdminDashboard = lazyWithRetry(() => import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const MaintenanceDashboard = lazyWithRetry(() => import('./components/MaintenanceDashboard').then((m) => ({ default: m.MaintenanceDashboard })));
const WarehouseDashboard = lazyWithRetry(() => import('./components/WarehouseDashboard').then((m) => ({ default: m.WarehouseDashboard })));
const ProcurementDashboard = lazyWithRetry(() => import('./components/ProcurementDashboard').then((m) => ({ default: m.ProcurementDashboard })));
const CounselorDashboard = lazyWithRetry(() => import('./components/CounselorDashboard').then((m) => ({ default: m.CounselorDashboard })));
const FinanceDashboard = lazyWithRetry(() => import('./components/FinanceDashboard').then((m) => ({ default: m.FinanceDashboard })));
const AcademicDeputyHub = lazyWithRetry(() => import('./components/AcademicDeputyHub').then((m) => ({ default: m.AcademicDeputyHub })));
const CulturalDashboard = lazyWithRetry(() => import('./components/CulturalDashboard').then((m) => ({ default: m.CulturalDashboard })));
const StudentAffairsDashboard = lazyWithRetry(() => import('./components/StudentAffairsDashboard').then((m) => ({ default: m.StudentAffairsDashboard })));
const SecurityDashboard = lazyWithRetry(() => import('./components/SecurityDashboard').then((m) => ({ default: m.SecurityDashboard })));
const ViceDeanDashboard = lazyWithRetry(() => import('./components/ViceDeanDashboard').then((m) => ({ default: m.ViceDeanDashboard })));
const LibraryDashboard = lazyWithRetry(() => import('./components/LibraryDashboard').then((m) => ({ default: m.LibraryDashboard })));
const SmartCampusDashboard = lazyWithRetry(() => import('./components/SmartCampusDashboard').then((m) => ({ default: m.SmartCampusDashboard })));
import { resolveFontCssFamily } from './utils/fonts';
import {
  DEFAULT_HOME_NOTES_TITLE,
  DEFAULT_HOME_NOTES,
  resolveHeroBannerStyle,
} from './utils/homeDefaults';
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
  MessageCircle,
  RotateCcw,
  UserCheck,
  Pin,
  LogIn,
} from 'lucide-react';

function getImpersonatedUserMeta(user: NonNullable<CurrentUser>): {
  fullName: string;
  roleLabel: string;
  identifier: string;
} {
  switch (user.role) {
    case 'student':
      return {
        fullName: user.student.fullName,
        roleLabel: 'دانشجو',
        identifier: user.student.studentId,
      };
    case 'supervisor':
      return {
        fullName: user.supervisor.fullName,
        roleLabel: 'سرپرست سرای دانشجویی',
        identifier: user.supervisor.username,
      };
    case 'maintenance':
      return {
        fullName: user.technician.fullName,
        roleLabel: 'تکنسین و کارشناس تأسیسات',
        identifier: user.technician.username,
      };
    case 'warehouse':
      return {
        fullName: user.staff.fullName,
        roleLabel: 'مسئول انبار تجهیزات',
        identifier: user.staff.username,
      };
    case 'procurement':
      return {
        fullName: user.staff.fullName,
        roleLabel: 'کارپرداز و واحد خرید',
        identifier: user.staff.username,
      };
    case 'counselor':
      return {
        fullName: user.counselor.fullName,
        roleLabel: 'مشاور و روانشناس',
        identifier: user.counselor.username,
      };
    case 'finance':
      return {
        fullName: user.staff.fullName,
        roleLabel: 'کارشناس امور مالی و حسابداری',
        identifier: user.staff.username,
      };
    case 'education':
      return {
        fullName: user.staff.fullName,
        roleLabel: 'کارشناس آموزش',
        identifier: user.staff.username,
      };
    case 'cultural':
      return {
        fullName: user.staff.fullName,
        roleLabel: 'کارشناس امور فرهنگی',
        identifier: user.staff.username,
      };
    case 'student_affairs':
      return {
        fullName: user.staff.fullName,
        roleLabel: 'کارشناس امور دانشجویی و تربیت بدنی',
        identifier: user.staff.username,
      };
    case 'security':
      return {
        fullName: user.staff.fullName,
        roleLabel: 'کارشناس حراست و انتظامات',
        identifier: user.staff.username,
      };
    case 'vice_dean':
      return {
        fullName: user.staff.fullName,
        roleLabel: 'معاونت دانشجویی',
        identifier: user.staff.username,
      };
    case 'library':
      return {
        fullName: user.staff.fullName,
        roleLabel: 'مسئول کتابخانه و پژوهش',
        identifier: user.staff.username,
      };
    case 'smart_campus':
      return {
        fullName: user.staff.fullName,
        roleLabel: 'کارشناس واحد هوشمندسازی',
        identifier: user.staff.username,
      };
    case 'graduation':
      return {
        fullName: user.staff.fullName,
        roleLabel: 'کارشناس واحد فارغ‌التحصیلان',
        identifier: user.staff.username,
      };
    case 'admin':
      return {
        fullName: user.name,
        roleLabel: 'مدیر کل سامانه',
        identifier: user.username,
      };
  }
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(Storage.getSettings());
  const [currentUser, setCurrentUser] = useState<CurrentUser>(Storage.getCurrentUser());
  const [impersonatingAdmin, setImpersonatingAdmin] = useState<{
    role: 'admin';
    name: string;
    username: string;
  } | null>(() => Storage.getAdminImpersonator());
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
  const [financeStaff, setFinanceStaff] = useState<FinanceStaff[]>(Storage.getFinanceStaff());
  const [educationStaff, setEducationStaff] = useState<EducationStaff[]>(Storage.getEducationStaff());
  const [studentFinances, setStudentFinances] = useState<StudentFinancialRecord[]>(Storage.getStudentFinances());
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(Storage.getInventoryItems());
  const [warehouseRequests, setWarehouseRequests] = useState<WarehouseRequest[]>(Storage.getWarehouseRequests());
  const [surveys, setSurveys] = useState<PeriodicSurvey[]>(Storage.getSurveys());
  const [guildElections, setGuildElections] = useState<GuildElection[]>(Storage.getGuildElections());

  const [cloudSyncTick, setCloudSyncTick] = useState<number>(0);
  const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false);
  const lastSyncCheckRef = useRef<number>(0);

  // وضعیت سامانه نوتیفیکیشن گوشی و اپلیکیشن (PWA)
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() => getNotificationPermissionState());
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(() =>
    loadNotificationPrefs()
  );
  const [notificationFeed, setNotificationFeed] = useState<AppNotificationItem[]>(() =>
    loadNotificationFeed(getUserNotificationKey(Storage.getCurrentUser()))
  );
  const [liveToasts, setLiveToasts] = useState<AppNotificationItem[]>([]);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [selectedNotificationItem, setSelectedNotificationItem] =
    useState<AppNotificationItem | null>(null);
  const [isCommunityChatOpen, setIsCommunityChatOpen] = useState(false);
  const [isWarehouseRequestModalOpen, setIsWarehouseRequestModalOpen] = useState(false);
  const [isNotifPromptSnoozed, setIsNotifPromptSnoozed] = useState<boolean>(() =>
    isNotificationPromptSnoozed()
  );

  // بروزرسانی داده‌ها از storage
  const refreshAllData = useCallback(() => {
    setCloudSyncTick((prev) => prev + 1);
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
    setFinanceStaff(Storage.getFinanceStaff());
    setEducationStaff(Storage.getEducationStaff());
    setStudentFinances(Storage.getStudentFinances());
    setInventoryItems(Storage.getInventoryItems());
    setWarehouseRequests(Storage.getWarehouseRequests());
    setSurveys(Storage.getSurveys());
    setGuildElections(Storage.getGuildElections());

    const user = Storage.getCurrentUser();
    if (user && user.role === 'student') {
      const refreshedStudent = Storage.getStudents().find((s) => s.studentId === user.student.studentId);
      if (refreshedStudent) {
        setCurrentUser({ role: 'student', student: refreshedStudent });
      }
    } else if (user && user.role === 'supervisor') {
      const refreshedSup = Storage.getSupervisors().find((s) => s.id === user.supervisor.id);
      if (refreshedSup) {
        setCurrentUser({ role: 'supervisor', supervisor: refreshedSup });
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
    } else if (user && user.role === 'procurement') {
      const refreshedProc = Storage.getProcurementStaff().find((p) => p.id === user.staff.id);
      if (refreshedProc) {
        setCurrentUser({ role: 'procurement', staff: refreshedProc });
      }
    } else if (user && user.role === 'finance') {
      const refreshedFin = Storage.getFinanceStaff().find((f) => f.id === user.staff.id);
      if (refreshedFin) {
        setCurrentUser({ role: 'finance', staff: refreshedFin });
      }
    } else if (user && user.role === 'education') {
      const refreshedEdu = Storage.getEducationStaff().find((e) => e.id === user.staff.id);
      if (refreshedEdu) {
        setCurrentUser({ role: 'education', staff: refreshedEdu });
      }
    } else if (user && user.role === 'cultural') {
      const refreshedCul = Storage.getCulturalStaff().find((c) => c.id === user.staff.id);
      if (refreshedCul) {
        setCurrentUser({ role: 'cultural', staff: refreshedCul });
      }
    } else if (user && user.role === 'student_affairs') {
      const refreshedSa = Storage.getStudentAffairsStaff().find((sa) => sa.id === user.staff.id);
      if (refreshedSa) {
        setCurrentUser({ role: 'student_affairs', staff: refreshedSa });
      }
    } else if (user && user.role === 'security') {
      const refreshedSec = Storage.getSecurityStaff().find((sec) => sec.id === user.staff.id);
      if (refreshedSec) {
        setCurrentUser({ role: 'security', staff: refreshedSec });
      }
    } else if (user && user.role === 'vice_dean') {
      const refreshedVd = Storage.getViceDeanStaff().find((vd) => vd.id === user.staff.id);
      if (refreshedVd) {
        setCurrentUser({ role: 'vice_dean', staff: refreshedVd });
      }
    } else if (user && user.role === 'library') {
      const refreshedLib = Storage.getLibraryStaff().find((lib) => lib.id === user.staff.id);
      if (refreshedLib) {
        setCurrentUser({ role: 'library', staff: refreshedLib });
      }
    } else if (user && user.role === 'smart_campus') {
      const refreshedSmart = Storage.getSmartCampusStaff().find((sm) => sm.id === user.staff.id);
      if (refreshedSmart) {
        setCurrentUser({ role: 'smart_campus', staff: refreshedSmart });
      }
    } else if (user && user.role === 'graduation') {
      const refreshedGrad = Storage.getGraduationStaff().find((gr) => gr.id === user.staff.id);
      if (refreshedGrad) {
        setCurrentUser({ role: 'graduation', staff: refreshedGrad });
      }
    } else if (user && user.role === 'counselor') {
      const refreshedCns = Storage.getCounselors().find((c) => c.id === user.counselor.id);
      if (refreshedCns) {
        setCurrentUser({ role: 'counselor', counselor: refreshedCns });
      }
    }
  }, []);

  // مقداردهی اولیه فوری داده‌های محلی (نمایش آنی صفحه) + همگام‌سازی پس‌زمینه تدریجی با دیتابیس ابری
  useEffect(() => {
    let isMounted = true;
    initializeStorageIfNeeded();
    refreshAllData();

    // بروزرسانی تدریجی و فوری رابط کاربری بلافاصله پس از دریافت هر موج داده (تنظیمات، کاربران، دانشجویان، اطلاعیه‌ها)
    const unsubscribeCloudUpdates = Storage.subscribeCloudDataChanged(() => {
      if (isMounted) {
        refreshAllData();
      }
    });

    const performInitialSync = async () => {
      lastSyncCheckRef.current = Date.now();
      const changed = await Storage.syncFromCloud();
      if (changed && isMounted) {
        refreshAllData();
      }
    };

    void performInitialSync();

    const handleBackgroundSync = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
      const now = Date.now();
      if (now - lastSyncCheckRef.current < 20000) return;
      lastSyncCheckRef.current = now;
      const ok = await Storage.syncFromCloud();
      if (ok && isMounted) {
        refreshAllData();
      }
    };

    const handleVisibilityResume = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        setNotificationPermission(getNotificationPermissionState());
        void handleBackgroundSync();
      }
    };

    window.addEventListener('focus', handleBackgroundSync);
    document.addEventListener('visibilitychange', handleVisibilityResume);
    const intervalId = window.setInterval(handleBackgroundSync, 45000);

    return () => {
      isMounted = false;
      unsubscribeCloudUpdates();
      window.removeEventListener('focus', handleBackgroundSync);
      document.removeEventListener('visibilitychange', handleVisibilityResume);
      window.clearInterval(intervalId);
    };
  }, [refreshAllData]);

  // بارگذاری تاریخچه اعلان‌های کاربر فعلی هنگام تغییر حساب کاربری
  useEffect(() => {
    const userKey = getUserNotificationKey(currentUser);
    setNotificationFeed(loadNotificationFeed(userKey));
    setNotificationPermission(getNotificationPermissionState());
  }, [currentUser?.role, currentUser]);

  // تشخیص پیام‌ها، اطلاعیه‌ها، تذکرات، نظرسنجی‌ها و انتخابات جدید و ارسال نوتیفیکیشن گوشی + توست زنده
  useEffect(() => {
    const newItems = detectNewUserNotifications({
      user: currentUser,
      announcements,
      messages,
      surveys,
      elections: guildElections,
      warnings,
      prefs: notificationPrefs,
    });

    if (newItems.length === 0) return;

    const userKey = getUserNotificationKey(currentUser);
    setNotificationFeed((prev) => {
      const merged = [...newItems, ...prev].slice(0, 40);
      saveNotificationFeed(userKey, merged);
      return merged;
    });

    if (!notificationPrefs.enabled) return;

    if (notificationPrefs.soundEnabled) {
      playNotificationChime();
    }

    const visibleBatch = newItems.slice(0, 3);
    setLiveToasts((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const fresh = visibleBatch.filter((i) => !existingIds.has(i.id));
      return [...fresh, ...prev].slice(0, 4);
    });

    // ارسال نوتیفیکیشن سیستمی روی گوشی / مرورگر (در صورت مجوز فعال)
    if (notificationPermission === 'granted') {
      if (newItems.length <= 2) {
        newItems.forEach((item) => {
          void dispatchOSNotification({
            title: item.title,
            body: item.body,
            tag: item.id,
            category: item.category,
            itemId: item.itemId,
          });
        });
      } else {
        const first = newItems[0];
        void dispatchOSNotification({
          title: `${newItems.length} اعلان جدید در سامانه خدمات دانشجویی`,
          body: `${first.title} و ${newItems.length - 1} مورد جدید دیگر`,
          tag: 'cfuis-batch-alert',
          category: first.category,
          itemId: first.itemId,
        });
      }
    }
  }, [
    currentUser,
    announcements,
    messages,
    surveys,
    guildElections,
    warnings,
    notificationPrefs,
    notificationPermission,
  ]);

  // بروزرسانی عدد نشانگر روی آیکون اپلیکیشن نصب‌شده (App Badging API)
  const unreadNotificationsCount = notificationFeed.filter((n) => !n.read).length;
  useEffect(() => {
    updateAppIconBadge(unreadNotificationsCount);
  }, [unreadNotificationsCount]);

  // مدیریت کلیک روی نوتیفیکیشن سیستمی از طریق Service Worker یا پنجره
  useEffect(() => {
    const handleNotifOpen = (category?: string) => {
      if (category === 'private_chat' && currentUser) {
        setIsCommunityChatOpen(true);
      } else if (category === 'message' && currentUser) {
        setIsMessagesModalOpen(true);
      } else {
        setIsNotificationModalOpen(true);
      }
    };

    const onWindowClick = (e: Event) => {
      const detail = (e as CustomEvent<{ category?: string }>).detail;
      handleNotifOpen(detail?.category);
    };

    const onSwMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'APP_NOTIFICATION_CLICK') {
        handleNotifOpen(event.data.category);
      }
    };

    window.addEventListener('app-notification-click', onWindowClick);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', onSwMessage);
    }

    return () => {
      window.removeEventListener('app-notification-click', onWindowClick);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', onSwMessage);
      }
    };
  }, [currentUser]);

  const handleRequestNotifications = useCallback(async () => {
    const res = await requestSystemNotificationPermission();
    setNotificationPermission(res);
    if (res === 'granted') {
      setNotificationPrefs(loadNotificationPrefs());
      setIsNotifPromptSnoozed(false);
    }
    return res;
  }, []);

  const handleUpdateNotificationPrefs = useCallback((next: NotificationPreferences) => {
    setNotificationPrefs(next);
    saveNotificationPrefs(next);
  }, []);

  const handleMarkAllNotificationsRead = useCallback(() => {
    const userKey = getUserNotificationKey(currentUser);
    setNotificationFeed((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      saveNotificationFeed(userKey, next);
      return next;
    });
  }, [currentUser]);

  const handleClearNotifications = useCallback(() => {
    const userKey = getUserNotificationKey(currentUser);
    setNotificationFeed([]);
    saveNotificationFeed(userKey, []);
  }, [currentUser]);

  const handleNotificationItemClick = useCallback(
    (item: AppNotificationItem, fromToast = false) => {
      const userKey = getUserNotificationKey(currentUser);
      setNotificationFeed((prev) => {
        const next = prev.map((n) => (n.id === item.id ? { ...n, read: true } : n));
        saveNotificationFeed(userKey, next);
        return next;
      });
      setLiveToasts((prev) => prev.filter((t) => t.id !== item.id));
      if (item.category === 'private_chat' && currentUser) {
        const myIdentity = getRealtimeUserIdentity(currentUser);
        setSelectedNotificationItem(null);
        setIsNotificationModalOpen(false);
        if (item.roomId && myIdentity) {
          setChatTargetRoom({
            roomId: item.roomId,
            roomType: 'dm',
            dmParticipants: item.peerId
              ? {
                  ids: [myIdentity.id, item.peerId],
                  names: [myIdentity.name, item.peerName || 'کاربر سامانه'],
                }
              : undefined,
          });
        }
        setIsCommunityChatOpen(true);
      } else if (item.category === 'voice_call' && currentUser) {
        const myIdentity = getRealtimeUserIdentity(currentUser);
        setSelectedNotificationItem(null);
        setIsNotificationModalOpen(false);
        if (item.roomId && myIdentity) {
          setChatTargetRoom({
            roomId: item.roomId,
            roomType: 'dm',
            dmParticipants: item.peerId
              ? {
                  ids: [myIdentity.id, item.peerId],
                  names: [myIdentity.name, item.peerName || 'کاربر سامانه'],
                }
              : undefined,
          });
        }
        setIsCommunityChatOpen(true);
      } else if (item.category === 'message' && currentUser) {
        setSelectedNotificationItem(null);
        setIsNotificationModalOpen(false);
        setFocusedMessageId(item.itemId || null);
        setOpenedMessagesFromNotif(true);
        setIsMessagesModalOpen(true);
      } else {
        setSelectedNotificationItem(item);
        if (fromToast) {
          setIsNotificationModalOpen(true);
        }
      }
    },
    [currentUser]
  );

  const shouldShowNotifPromptBanner =
    !isNotifPromptSnoozed &&
    (Boolean(currentUser) || isRunningStandalonePWA()) &&
    (notificationPermission === 'default' ||
      (isIOSDevice() && !isRunningStandalonePWA() && notificationPermission === 'unsupported'));

  // بروزرسانی دستی اطلاعات (باطل‌سازی فوری کش ۵ دقیقه‌ای sessionStorage و دریافت تازه از Supabase)
  const handleManualCloudRefresh = useCallback(async () => {
    if (isManualRefreshing) return;
    setIsManualRefreshing(true);
    try {
      Storage.invalidatePublicCache();
      lastSyncCheckRef.current = Date.now();
      await Storage.syncFromCloud({ force: true });
      refreshAllData();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [isManualRefreshing, refreshAllData]);

  // تزریق پویای فونت‌های بارگذاری شده (TTF / WOFF) به سند
  useEffect(() => {
    let styleTag = document.getElementById('custom-uploaded-fonts') as HTMLStyleElement | null;
    if (settings.customFonts && settings.customFonts.length > 0) {
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
          font-style: normal;
          font-display: swap;
        }
      `
        )
        .join('\n');

      styleTag.textContent = fontFaceRules;
    } else if (styleTag) {
      styleTag.textContent = '';
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
  const [excelModalInitialTab, setExcelModalInitialTab] = useState<ExcelImportTab>('students');
  const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
  const [openedMessagesFromNotif, setOpenedMessagesFromNotif] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [focusAboutEditorTick, setFocusAboutEditorTick] = useState(0);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const [userGuideInitialRole, setUserGuideInitialRole] = useState<UserRoleType>('student');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  // وضعیت‌های چت خصوصی لحظه‌ای، تماس صوتی ورودی و نشست‌های چنددستگاهی
  const [chatTargetRoom, setChatTargetRoom] = useState<CommunityChatInitialTarget | null>(null);
  const [incomingVoiceCall, setIncomingVoiceCall] = useState<IncomingVoiceCallPayload | null>(null);
  const [activeVoiceCall, setActiveVoiceCall] = useState<LiveVoiceCallTarget | null>(null);
  const [isActiveSessionsModalOpen, setIsActiveSessionsModalOpen] = useState(false);
  const [autoCloseOtherSessions, setAutoCloseOtherSessions] = useState<boolean>(() =>
    loadAutoCloseOtherSessionsPref()
  );
  const [sessionTerminatedNotice, setSessionTerminatedNotice] = useState<string | null>(null);

  const handleIncomingPrivateChat = useCallback(
    (payload: IncomingPrivateChatPayload) => {
      if (!currentUser || !notificationPrefs.enabled || !notificationPrefs.messages) return;
      const userKey = getUserNotificationKey(currentUser);
      const notifId = `notif_dm_${payload.messageId || Date.now()}`;
      const bodyText = payload.isVoiceMessage
        ? '🎤 پیام صوتی جدید ارسال کرد'
        : payload.hasImage && !payload.previewText
        ? '🖼️ تصویر جدید ارسال کرد'
        : payload.previewText || 'پیام جدید در گفتگوی خصوصی';

      const isAnonIncoming = payload.senderId === 'anonymous';
      const item: AppNotificationItem = {
        id: notifId,
        category: 'private_chat',
        title: isAnonIncoming
          ? `پیام ناشناس از ${payload.senderName || 'دانشجوی ناشناس'}`
          : `پیام خصوصی از ${payload.senderName || 'کاربر سامانه'}`,
        body: bodyText,
        fullBody: bodyText,
        createdAt: payload.sentAt || new Date().toISOString(),
        read: false,
        itemId: payload.messageId,
        roomId: payload.roomId,
        peerId: isAnonIncoming ? undefined : payload.senderId,
        peerName: payload.senderName,
        peerRole: payload.senderRole,
      };

      setNotificationFeed((prev) => {
        if (prev.some((n) => n.id === notifId)) return prev;
        const merged = [item, ...prev].slice(0, 40);
        saveNotificationFeed(userKey, merged);
        return merged;
      });
      setLiveToasts((prev) => {
        if (prev.some((t) => t.id === notifId)) return prev;
        return [item, ...prev].slice(0, 3);
      });
      if (notificationPrefs.soundEnabled) {
        playNotificationChime();
      }
      if (notificationPermission === 'granted') {
        void dispatchOSNotification({
          title: item.title,
          body: item.body,
          tag: notifId,
          category: 'private_chat',
          itemId: payload.roomId,
        });
      }
      void Storage.syncFromCloud({ force: false }).then((changed) => {
        if (changed) refreshAllData();
      });
    },
    [currentUser, notificationPrefs, notificationPermission, refreshAllData]
  );

  const handleIncomingVoiceCall = useCallback(
    (payload: IncomingVoiceCallPayload) => {
      if (!currentUser) return;
      const liveChatSettings = Storage.getCommunityChatSettings();
      if (!canRoleUseLiveVoiceCall(liveChatSettings, currentUser.role).allowed) return;
      if (activeVoiceCall && activeVoiceCall.roomId === payload.roomId) return;

      setIncomingVoiceCall(payload);

      if (notificationPrefs.soundEnabled) {
        playIncomingCallRingtone();
      }

      const userKey = getUserNotificationKey(currentUser);
      const callNotifId = `notif_call_${payload.roomId}_${Date.now()}`;
      const callItem: AppNotificationItem = {
        id: callNotifId,
        category: 'voice_call',
        title: `تماس صوتی ورودی از ${payload.callerName || 'کاربر سامانه'}`,
        body: 'در حال برقراری تماس صوتی مستقیم — جهت پاسخ یا مشاهده کلیک کنید',
        fullBody: `${payload.callerName || 'کاربر سامانه'} با شما تماس صوتی مستقیم برقرار کرد.`,
        createdAt: payload.sentAt || new Date().toISOString(),
        read: false,
        itemId: payload.roomId,
        roomId: payload.roomId,
        peerId: payload.callerId,
        peerName: payload.callerName,
        peerRole: payload.callerRole,
      };
      setNotificationFeed((prev) => {
        const merged = [callItem, ...prev].slice(0, 40);
        saveNotificationFeed(userKey, merged);
        return merged;
      });

      if (notificationPermission === 'granted') {
        void dispatchOSNotification({
          title: callItem.title,
          body: 'برای پاسخ به تماس صوتی وارد سامانه شوید',
          tag: `cfuis-call-${payload.roomId}`,
          category: 'voice_call',
          itemId: payload.roomId,
        });
      }
    },
    [currentUser, activeVoiceCall, notificationPrefs.soundEnabled, notificationPermission]
  );

  const handleIncomingCallCancelled = useCallback((payload: { roomId: string }) => {
    setIncomingVoiceCall((prev) => (prev && prev.roomId === payload.roomId ? null : prev));
  }, []);

  const handleRemoteSessionTerminated = useCallback((payload: TerminateSessionPayload) => {
    Storage.clearAdminImpersonator();
    setImpersonatingAdmin(null);
    setIsAiChatOpen(false);
    setIsCommunityChatOpen(false);
    setIsMessagesModalOpen(false);
    setIsActiveSessionsModalOpen(false);
    setActiveVoiceCall(null);
    setIncomingVoiceCall(null);
    setCurrentUser(null);
    Storage.setCurrentUser(null);
    setSessionTerminatedNotice(
      payload.reason ||
        `نشست شما در این دستگاه از طریق «${payload.initiatorDevice || 'دستگاه دیگر'}» بسته شد.`
    );
  }, []);

  const {
    identity: realtimeIdentity,
    sessionId: tabSessionId,
    onlineUserIds,
    activeSessions,
    terminateSession,
    terminateAllOtherSessions,
  } = useRealtimePortalPresence({
    currentUser,
    onIncomingPrivateChat: handleIncomingPrivateChat,
    onIncomingVoiceCall: handleIncomingVoiceCall,
    onCallCancelled: handleIncomingCallCancelled,
    onSessionTerminated: handleRemoteSessionTerminated,
  });

  useEffect(() => {
    if (realtimeIdentity) {
      setAutoCloseOtherSessions(loadAutoCloseOtherSessionsPref(realtimeIdentity.userKey));
    }
  }, [realtimeIdentity]);

  const handleToggleAutoCloseOtherSessions = useCallback(
    (next: boolean) => {
      setAutoCloseOtherSessions(next);
      saveAutoCloseOtherSessionsPref(next, realtimeIdentity?.userKey);
    },
    [realtimeIdentity]
  );

  const handleAcceptIncomingVoiceCall = useCallback(
    (call: IncomingVoiceCallPayload) => {
      setIncomingVoiceCall(null);
      if (currentUser) {
        const userKey = getUserNotificationKey(currentUser);
        setNotificationFeed((prev) => {
          const next = prev.map((n) =>
            n.category === 'voice_call' && n.roomId === call.roomId ? { ...n, read: true } : n
          );
          saveNotificationFeed(userKey, next);
          return next;
        });
      }
      setActiveVoiceCall({
        roomId: call.roomId,
        roomTitle: call.callerName || 'تماس صوتی',
        roomType: call.roomType || 'dm',
        targetPeerId: call.callerId,
        targetPeerName: call.callerName,
        isInitiator: false,
      });
    },
    [currentUser]
  );

  const handleRejectIncomingVoiceCall = useCallback(
    (call: IncomingVoiceCallPayload) => {
      setIncomingVoiceCall(null);
      if (realtimeIdentity) {
        void broadcastCallRejected(
          call.callerId,
          call.roomId,
          realtimeIdentity.id,
          realtimeIdentity.name
        );
      }
      if (currentUser) {
        const userKey = getUserNotificationKey(currentUser);
        setNotificationFeed((prev) => {
          const next = prev.map((n) =>
            n.category === 'voice_call' && n.roomId === call.roomId ? { ...n, read: true } : n
          );
          saveNotificationFeed(userKey, next);
          return next;
        });
      }
    },
    [currentUser, realtimeIdentity]
  );

  // هندلر ارتباط سریع درون‌برنامه‌ای (چت یا تماس صوتی مستقیم با تکنسین تأسیسات از بخش ارجاع)
  useEffect(() => {
    if (!currentUser || !realtimeIdentity) return;
    return subscribeQuickStaffComm((target) => {
      const roomId = makeStaffDmRoomId(realtimeIdentity.id, target.staffId);
      const ids: [string, string] =
        realtimeIdentity.id.localeCompare(target.staffId) <= 0
          ? [realtimeIdentity.id, target.staffId]
          : [target.staffId, realtimeIdentity.id];
      const names: [string, string] =
        realtimeIdentity.id.localeCompare(target.staffId) <= 0
          ? [realtimeIdentity.name, target.staffName]
          : [target.staffName, realtimeIdentity.name];

      if (target.mode === 'chat') {
        setIsMessagesModalOpen(false);
        setChatTargetRoom({
          roomId,
          roomType: 'dm',
          dmParticipants: { ids, names },
        });
        setIsCommunityChatOpen(true);
        return;
      }

      if (target.mode === 'voice_call') {
        const liveSettings = Storage.getCommunityChatSettings();
        const access = canRoleUseLiveVoiceCall(liveSettings, currentUser.role);
        if (!access.allowed) {
          const warnItem: AppNotificationItem = {
            id: `notif_voice_blocked_${Date.now()}`,
            category: 'system',
            title: 'محدودیت تماس صوتی',
            body: access.reason || 'امکان برقراری تماس صوتی توسط مدیر سامانه غیرفعال شده است.',
            createdAt: new Date().toISOString(),
            read: true,
          };
          setLiveToasts((prev) => [warnItem, ...prev].slice(0, 3));
          return;
        }
        setActiveVoiceCall({
          roomId,
          roomTitle: target.staffName,
          roomType: 'dm',
          targetPeerId: target.staffId,
          targetPeerName: target.staffName,
          isInitiator: true,
        });
      }
    });
  }, [currentUser, realtimeIdentity]);

  const handleOpenExcelModal = (tab: ExcelImportTab = 'students') => {
    setExcelModalInitialTab(tab);
    setIsExcelModalOpen(true);
  };

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

  const handleLoginSuccess = (
    user: NonNullable<CurrentUser>,
    options?: { closeOtherSessions?: boolean }
  ) => {
    setSessionTerminatedNotice(null);
    resetTabLoginTime();
    Storage.clearAdminImpersonator();
    setImpersonatingAdmin(null);
    setCurrentUser(user);
    Storage.setCurrentUser(user);

    const nextIdentity = getRealtimeUserIdentity(user);
    const shouldCloseOthers =
      options?.closeOtherSessions ??
      (nextIdentity ? loadAutoCloseOtherSessionsPref(nextIdentity.userKey) : false);
    if (nextIdentity && typeof options?.closeOtherSessions === 'boolean') {
      saveAutoCloseOtherSessionsPref(options.closeOtherSessions, nextIdentity.userKey);
      setAutoCloseOtherSessions(options.closeOtherSessions);
    }
    if (shouldCloseOthers && nextIdentity) {
      void broadcastTerminateSessions(nextIdentity.userKey, {
        keepSessionId: tabSessionId,
        reason: 'به دلیل ورود جدید به حساب کاربری در یک دستگاه دیگر، این نشست به‌صورت خودکار بسته شد.',
      });
    }

    refreshAllData();
    // پس از ورود: برای مدیر و کارشناسان، لیست کامل دانشجویان و تمام جداول از Supabase دریافت می‌شود؛
    // برای دانشجو فقط داده‌های عملیاتی + ردیف همان دانشجو (با حفظ کش ۵ دقیقه‌ای داده‌های عمومی)
    lastSyncCheckRef.current = Date.now();
    void Storage.syncFromCloud({
      force: user.role !== 'student',
      roleScope: user.role === 'student' ? 'student' : 'staff',
    }).then((changed) => {
      if (changed) {
        refreshAllData();
      }
    });
  };

  // ورود مستقیم مدیر کل به کارتابل هر دانشجو یا کارمند با امکان بازگشت یک‌کلیکه به پنل مدیر کل
  const handleImpersonateUser = useCallback(
    (targetUser: NonNullable<CurrentUser>) => {
      if (!currentUser || currentUser.role !== 'admin') return;
      if (targetUser.role === 'admin') return;

      const adminSnapshot = {
        role: 'admin' as const,
        name: currentUser.name,
        username: currentUser.username,
      };
      const meta = getImpersonatedUserMeta(targetUser);

      Storage.setAdminImpersonator(adminSnapshot);
      setImpersonatingAdmin(adminSnapshot);

      Storage.addActivityLog({
        category: 'auth',
        action: 'ورود مستقیم مدیر کل به کارتابل کاربر',
        details: `مدیر کل وارد کارتابل «${meta.fullName}» (${meta.roleLabel} • ${meta.identifier}) شد.`,
      });

      setIsAiChatOpen(false);
      setIsMessagesModalOpen(false);
      setIsReportsModalOpen(false);
      setCurrentUser(targetUser);
      Storage.setCurrentUser(targetUser);
      refreshAllData();

      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [currentUser, refreshAllData]
  );

  // بازگشت مستقیم از حالت مشاهده کارتابل کاربر به پنل مدیر کل
  const handleReturnToAdmin = useCallback(() => {
    const adminSnapshot =
      impersonatingAdmin ||
      Storage.getAdminImpersonator() || {
        role: 'admin' as const,
        name: 'مدیر کل سامانه جامع خدمات دانشجویی',
        username: 'admin',
      };

    if (currentUser && currentUser.role !== 'admin') {
      const meta = getImpersonatedUserMeta(currentUser);
      Storage.addActivityLog({
        category: 'auth',
        action: 'بازگشت مدیر کل از کارتابل کاربر',
        details: `مدیر کل از کارتابل «${meta.fullName}» (${meta.roleLabel}) به پنل مدیر کل بازگشت.`,
      });
    }

    Storage.clearAdminImpersonator();
    setImpersonatingAdmin(null);
    setIsAiChatOpen(false);
    setIsMessagesModalOpen(false);
    setIsReportsModalOpen(false);
    setCurrentUser(adminSnapshot);
    Storage.setCurrentUser(adminSnapshot);
    refreshAllData();

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    lastSyncCheckRef.current = Date.now();
    void Storage.syncFromCloud({ roleScope: 'staff' }).then((changed) => {
      if (changed) {
        refreshAllData();
      }
    });
  }, [currentUser, impersonatingAdmin, refreshAllData]);

  const handleLogout = () => {
    if (currentUser) {
      Storage.addActivityLog({
        category: 'auth',
        action: 'خروج کاربر از سامانه',
        details: 'کاربر با انتخاب گزینه خروج از حساب کاربری خارج شد.',
      });
    }
    Storage.clearAdminImpersonator();
    setImpersonatingAdmin(null);
    setIsAiChatOpen(false);
    setIsCommunityChatOpen(false);
    setChatTargetRoom(null);
    setActiveVoiceCall(null);
    setIncomingVoiceCall(null);
    setIsActiveSessionsModalOpen(false);
    setCurrentUser(null);
    Storage.setCurrentUser(null);
  };

  // اعمال استایل فونت، اندازه، والپیپر سفارشی و دارک‌مود
  const isCustomFont = settings.customFonts?.some((cf) => cf.fontFamily === settings.fontFamily);
  const fontClass = isCustomFont ? '' : `font-${settings.fontFamily || 'vazir'}`;
  const fontStyle = {
    fontFamily: resolveFontCssFamily(settings.fontFamily, settings.customFonts),
  };

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
      className={`min-h-[100dvh] w-full max-w-full overflow-x-clip flex flex-col transition-colors duration-200 ${
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
          if (
            currentUser &&
            currentUser.role !== 'student' &&
            currentUser.role !== 'finance' &&
            currentUser.role !== 'education' &&
            currentUser.role !== 'cultural' &&
            currentUser.role !== 'library' &&
            currentUser.role !== 'smart_campus' &&
            currentUser.role !== 'graduation'
          ) {
            setIsReportsModalOpen(true);
          }
        }}
        onOpenMessages={() => setIsMessagesModalOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
        onLogout={handleLogout}
        onNavigateHome={() => {}}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onOpenUserGuide={() => handleOpenUserGuide()}
        onRefreshCloud={() => void handleManualCloudRefresh()}
        isRefreshingCloud={isManualRefreshing}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        notificationPermission={notificationPermission}
        onOpenCommunityChat={() => {
          setChatTargetRoom(null);
          setIsCommunityChatOpen(true);
        }}
        communityModerationBadge={
          currentUser && (currentUser.role === 'admin' || currentUser.role === 'security' || currentUser.role === 'vice_dean')
            ? Storage.getCommunityForums().filter((f) => {
                if (f.isPublicForum || f.status !== 'pending') return false;
                if (currentUser.role === 'admin') return f.adminApproval.status === 'pending';
                if (currentUser.role === 'security') return f.securityApproval.status === 'pending';
                return true;
              }).length + Storage.getCommunityChatReports().filter((r) => r.status === 'pending').length
            : 0
        }
        onOpenActiveSessions={currentUser ? () => setIsActiveSessionsModalOpen(true) : undefined}
        activeSessionsCount={activeSessions.length}
        hasIncomingVoiceCall={Boolean(currentUser && incomingVoiceCall && !activeVoiceCall)}
        onOpenIncomingVoiceCall={() => setIsNotificationModalOpen(true)}
        onOpenWarehouseRequest={
          currentUser && currentUser.role !== 'student' && currentUser.role !== 'warehouse'
            ? () => setIsWarehouseRequestModalOpen(true)
            : undefined
        }
        myPendingWarehouseRequestsCount={
          currentUser && currentUser.role !== 'student' && currentUser.role !== 'warehouse'
            ? warehouseRequests.filter((r) => {
                const myId =
                  currentUser.role === 'admin'
                    ? currentUser.username || 'admin'
                    : currentUser.role === 'supervisor'
                    ? currentUser.supervisor.id
                    : currentUser.role === 'counselor'
                    ? currentUser.counselor.id
                    : currentUser.role === 'maintenance'
                    ? currentUser.technician.id
                    : currentUser.staff.id;
                return (
                  r.requestedByStaffId === myId &&
                  (r.status === 'pending_warehouse' ||
                    r.status === 'pending_supervisor' ||
                    r.status === 'referred_to_procurement')
                );
              }).length
            : 0
        }
      />

      {/* اعلان خروج از راه دور در صورت بسته شدن نشست از دستگاه دیگر */}
      {sessionTerminatedNotice && !currentUser && (
        <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs font-extrabold text-amber-900 dark:text-amber-200">
            <span>{sessionTerminatedNotice}</span>
            <button
              type="button"
              onClick={() => setSessionTerminatedNotice(null)}
              className="px-2.5 py-1 rounded-lg bg-amber-200/70 dark:bg-amber-900/70 hover:bg-amber-300/70 text-[11px] font-bold cursor-pointer shrink-0"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}

      {/* بنر دعوت به فعال‌سازی نوتیفیکیشن فوری گوشی و اپلیکیشن */}
      <NotificationPromptBanner
        visible={shouldShowNotifPromptBanner}
        permission={notificationPermission}
        onEnable={handleRequestNotifications}
        onSnooze={() => {
          snoozeNotificationPrompt(2);
          setIsNotifPromptSnoozed(true);
        }}
        onOpenSettings={() => setIsNotificationModalOpen(true)}
      />

      {/* نوار هشدار و بازگشت سریع هنگام ورود مستقیم مدیر کل به کارتابل کاربر */}
      {impersonatingAdmin && currentUser && currentUser.role !== 'admin' && (() => {
        const meta = getImpersonatedUserMeta(currentUser);
        return (
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white py-2.5 px-4 shadow-md border-b border-amber-300/40 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 font-bold">
                <div className="p-1.5 rounded-lg bg-white/20 shrink-0">
                  <UserCheck className="w-4 h-4 text-white" />
                </div>
                <span>
                  حالت ورود مستقیم مدیر کل: در حال مشاهده کارتابل{' '}
                  <span className="underline decoration-white/60 underline-offset-4 font-black">
                    {meta.fullName}
                  </span>{' '}
                  ({meta.roleLabel}
                  {meta.identifier ? ` • ${meta.identifier}` : ''})
                </span>
              </div>
              <button
                type="button"
                onClick={handleReturnToAdmin}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-sm transition cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بازگشت به پنل مدیر کل</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* بنر اطلاعیه سراسری و تاریخ شمسی زنده — فقط پس از ورود کاربر (در صفحه اصلی حذف شده است) */}
      {currentUser && (
        <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-600 text-white text-xs py-2 px-3 sm:px-6 font-bold shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 justify-start flex-1">
              {settings.announcementBanner ? (
                <>
                  <Bell className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="leading-relaxed text-right">
                    {settings.announcementBanner}
                  </span>
                </>
              ) : (
                <span className="text-white/95 text-[11px] truncate">
                  {settings.universityName || 'سامانه جامع خدمات دانشجویی دانشگاه فرهنگیان'}
                </span>
              )}
            </div>
            <JalaliLiveClockBar variant="ribbon" />
          </div>
        </div>
      )}

      {/* بدنه اصلی */}
      <main className="flex-1 w-full min-w-0 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

        {/* ۱. صفحه فرود برای مراجعین قبل از ورود به سامانه (بدون نمایش آمار به عموم) */}
        {!currentUser && (() => {
          const heroBanner = resolveHeroBannerStyle(settings);
          const homeNotesTitle = settings.homeNotesTitle?.trim() || DEFAULT_HOME_NOTES_TITLE;
          const homeNotesList =
            settings.homeNotes && settings.homeNotes.length > 0
              ? settings.homeNotes
              : DEFAULT_HOME_NOTES;
          const notesGridClass =
            homeNotesList.length === 1
              ? 'grid-cols-1'
              : homeNotesList.length === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1 sm:grid-cols-3';

          const homeAnnouncementsTitle =
            settings.homeAnnouncementsTitle?.trim() ||
            'اطلاعیه‌ها، بخشنامه‌ها و زمان‌بندی سامانه جامع خدمات دانشجویی و سراها';

          return (
          <div className="space-y-5 sm:space-y-7 animate-in fade-in duration-300">
            {/* هیرو بنر رسمی و فشرده با آرم دانشگاه فرهنگیان */}
            <div
              className={`relative rounded-3xl overflow-hidden ${heroBanner.bgClassName} text-white px-6 py-6 sm:px-9 sm:py-8 shadow-2xl transition-all duration-300`}
              style={heroBanner.style}
            >
              {heroBanner.imageUrl && (
                <img
                  src={heroBanner.imageUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
                />
              )}
              {heroBanner.hasImageOverlay && (
                <div className="absolute inset-0 bg-gradient-to-l from-slate-950/75 via-slate-950/55 to-slate-950/35 pointer-events-none" />
              )}
              <div className="max-w-3xl relative z-10">
                {/* آرم دانشگاه و نشان رسمی (در صورت بارگذاری توسط مدیر) */}
                <div className="flex items-center gap-3.5 mb-3.5">
                  {settings.customLogoUrl && (
                    <div className="bg-white p-1.5 rounded-2xl shadow-lg border border-white/40 shrink-0">
                      <FarhangianEmblem size={64} customLogoUrl={settings.customLogoUrl} />
                    </div>
                  )}
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold border border-white/20 mb-1">
                      <School className="w-4 h-4 text-amber-300" />
                      <span>دانشگاه فرهنگیان استان اصفهان</span>
                    </div>
                    <div className="text-xs text-teal-100/95 font-semibold">
                      مدیریت یکپارچه سراهای دانشجویی، آموزش، مالی، کتابخانه، هوشمندسازی و امور دانشجویی • سال تحصیلی {settings.currentAcademicYear}
                    </div>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight mb-5">
                  سامانه جامع خدمات دانشجویی
                </h1>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(true)}
                    className="group px-7 py-3.5 bg-gradient-to-l from-amber-300 via-amber-200 to-white hover:from-amber-200 hover:to-white text-slate-950 rounded-2xl font-black text-sm sm:text-base shadow-2xl shadow-black/30 ring-2 ring-white/80 hover:ring-amber-300 transition-all duration-200 flex items-center gap-2.5 cursor-pointer hover:scale-[1.02]"
                  >
                    <span className="p-1.5 rounded-xl bg-teal-800 text-white shadow-xs">
                      <LogIn className="w-4 h-4" />
                    </span>
                    <span>ورود به سامانه (دانشجو / کارکنان / مدیران گروه / مدیر)</span>
                    <ArrowRight className="w-4 h-4 rotate-180 text-teal-900 group-hover:-translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* طرح و المان گرافیکی زمینه */}
              <div className="hidden lg:block absolute left-8 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                <Building2 className="w-56 h-56 text-white" />
              </div>
            </div>

            {/* ۲. بخش اطلاعیه‌های عمومی سراها در صفحه اول (قابل مشاهده برای همه دانشجویان قبل از ورود) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                      {homeAnnouncementsTitle}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      سال تحصیلی {settings.currentAcademicYear} • {settings.currentSemester}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-xs transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>ورود به حساب کاربری</span>
                </button>
              </div>

              {/* اطلاعیه پین‌شده بازه مجاز انتخاب اتاق */}
              <div
                className={`mb-5 p-3.5 sm:p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                  settings.selectionActive
                    ? 'bg-teal-50/90 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/80 text-teal-950 dark:text-teal-100'
                    : 'bg-amber-50/90 dark:bg-amber-950/35 border-amber-200 dark:border-amber-800/80 text-amber-950 dark:text-amber-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      settings.selectionActive
                        ? 'bg-teal-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    <Pin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          settings.selectionActive
                            ? 'bg-teal-700 text-white'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        اطلاعیه پین‌شده
                      </span>
                      <span className="text-[11px] font-bold opacity-80">
                        زمان‌بندی انتخاب اتاق سراهای دانشجویی
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold">
                      <Clock className="w-4 h-4 shrink-0 opacity-80" />
                      <span>
                        {settings.selectionActive
                          ? `بازه مجاز انتخاب اتاق: ${settings.selectionStartDate} تا ${settings.selectionEndDate}`
                          : 'سامانه انتخاب اتاق در حال حاضر غیرفعال است'}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border shrink-0 ${
                    settings.selectionActive
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {settings.selectionActive ? 'در حال پذیرش' : 'غیرفعال'}
                </span>
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

                      <RichTextDisplay
                        html={ann.contentHtml}
                        fallbackText={ann.content}
                        className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed"
                        onImageClick={(src) => setPreviewImage(src)}
                      />

                      {ann.imageUrl && (
                        <AnnouncementImageBox
                          src={ann.imageUrl}
                          alt={ann.title}
                          onClick={(src) => setPreviewImage(src)}
                          maxWidthClass="w-full"
                          heightClass="h-52 sm:h-60"
                        />
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

            {/* راهنمای نحوه استفاده و ضوابط عمومی (قابل ویرایش توسط مدیر در تنظیمات) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-600" />
                <span>{homeNotesTitle}</span>
              </h3>

              <div className={`grid ${notesGridClass} gap-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed`}>
                {homeNotesList.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                  >
                    {note.title && (
                      <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                        {note.title}
                      </span>
                    )}
                    <RichTextDisplay
                      html={note.bodyHtml}
                      fallbackText={note.body}
                      className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
          );
        })()}

        {/* نوار فشرده و پاپ‌آپ اطلاعیه‌های مهم برای تمامی کاربری‌های غیر از دانشجو (کاربری دانشجو درون داشبورد خودش دارد) */}
        {currentUser && currentUser.role !== 'student' && (
          <ImportantAnnouncementsWidget
            announcements={announcements}
            className="mb-5"
          />
        )}

        <ChunkErrorBoundary resetKey={currentUser?.role || 'guest'}>
        <Suspense
          fallback={
            currentUser ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                <div className="w-9 h-9 rounded-full border-4 border-teal-500/25 border-t-teal-600 animate-spin" />
                <span className="text-xs font-bold">در حال بارگذاری کارتابل کاربری...</span>
              </div>
            ) : null
          }
        >
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
            onOpenExcelModal={() => handleOpenExcelModal('students')}
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
            onOpenExcelModal={handleOpenExcelModal}
            onOpenReports={() => setIsReportsModalOpen(true)}
            onOpenAppearance={() => setIsAppearanceModalOpen(true)}
            onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
            onUpdateSettings={(newSt) => {
              setSettings(newSt);
              refreshAllData();
            }}
            onOpenUserGuide={(r) => handleOpenUserGuide(r || 'admin')}
            onImpersonateUser={handleImpersonateUser}
            cloudSyncTick={cloudSyncTick}
            focusAboutEditorTick={focusAboutEditorTick}
          />
        )}

        {/* ۵. در صورتی که کاربر تکنسین و کارشناس تأسیسات است */}
        {currentUser?.role === 'maintenance' && (
          <MaintenanceDashboard
            technician={currentUser.technician}
            dorms={dorms}
            rooms={rooms}
            students={students}
            tasks={maintenanceTasks}
            onRefreshData={refreshAllData}
            onOpenMessages={() => setIsMessagesModalOpen(true)}
            onOpenUserGuide={(r) => handleOpenUserGuide(r || 'maintenance')}
          />
        )}

        {/* ۶. در صورتی که کاربر انبار تجهیزات سراها است */}
        {currentUser?.role === 'warehouse' && (
          <WarehouseDashboard
            staff={currentUser.staff}
            dorms={dorms}
            onRefreshData={refreshAllData}
            onOpenMessages={() => setIsMessagesModalOpen(true)}
            onOpenUserGuide={(r) => handleOpenUserGuide(r || 'warehouse')}
          />
        )}

        {/* ۶-ب. در صورتی که کاربر کارپرداز و خرید است */}
        {currentUser?.role === 'procurement' && (
          <ProcurementDashboard
            staff={currentUser.staff}
            dorms={dorms}
            onRefreshData={refreshAllData}
            onOpenMessages={() => setIsMessagesModalOpen(true)}
            onOpenUserGuide={(r) => handleOpenUserGuide(r || 'procurement')}
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

        {/* ۸. در صورتی که کاربر امور مالی و حسابداری است */}
        {currentUser?.role === 'finance' && (
          <FinanceDashboard
            staff={currentUser.staff}
            dorms={dorms}
            rooms={rooms}
            beds={beds}
            students={students}
            studentFinances={studentFinances}
            messages={messages}
            onRefreshData={refreshAllData}
            onOpenMessages={() => setIsMessagesModalOpen(true)}
            onOpenUserGuide={(r) => handleOpenUserGuide(r || 'finance')}
          />
        )}

        {/* ۹. داشبورد یکپارچه حوزه معاونت آموزشی (مدیران گروه و کارشناسان آموزش) */}
        {currentUser?.role === 'education' && (
          <AcademicDeputyHub
            role="education"
            educationStaff={currentUser.staff}
            students={students}
            messages={messages}
            settings={settings}
            cloudSyncTick={cloudSyncTick}
            onRefreshData={refreshAllData}
            onOpenMessages={() => setIsMessagesModalOpen(true)}
            onOpenUserGuide={(r) => handleOpenUserGuide(r || 'education')}
          />
        )}

        {/* ۱۰. در صورتی که کاربر امور فرهنگی است (برنامه‌های زمان‌بندی هفتگی، تشکل‌ها و پیام‌های فرهنگی بدون دسترسی به اطلاعات دانشجویان) */}
        {currentUser?.role === 'cultural' && (
          <CulturalDashboard
            staff={currentUser.staff}
            dorms={dorms}
            cloudSyncTick={cloudSyncTick}
            onRefreshData={refreshAllData}
            onOpenMessages={() => setIsMessagesModalOpen(true)}
            onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
            onOpenUserGuide={(r) => handleOpenUserGuide(r || 'cultural')}
          />
        )}

        {/* ۱۱. در صورتی که کاربر امور دانشجویی و تربیت بدنی است (مشاهده/گزارش خوابگاهی و ترددی، برنامه‌ریزی ورزشی، انتخابات شورای صنفی و شورای انضباطی) */}
        {currentUser?.role === 'student_affairs' && (
          <StudentAffairsDashboard
            staff={currentUser.staff}
            students={students}
            dorms={dorms}
            rooms={rooms}
            cloudSyncTick={cloudSyncTick}
            onRefreshData={refreshAllData}
            onOpenReports={() => setIsReportsModalOpen(true)}
            onOpenMessages={() => setIsMessagesModalOpen(true)}
            onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
            onOpenUserGuide={(r) => handleOpenUserGuide(r || 'student_affairs')}
          />
        )}

        {/* ۱۲. در صورتی که کاربر حراست و انتظامات است */}
        {currentUser?.role === 'security' && (
          <SecurityDashboard
            securityStaff={currentUser.staff}
            students={students}
            dorms={dorms}
            rooms={rooms}
            beds={beds}
            messagesCount={
              messages.filter(
                (m) =>
                  m.status === 'pending' &&
                  (m.receiverType === 'security' ||
                    m.category === 'security' ||
                    (m.senderRole !== 'security' &&
                      (m.receiverType === 'all' ||
                        (!m.isConfidential && m.category === 'discipline'))))
              ).length
            }
            onOpenMessages={() => setIsMessagesModalOpen(true)}
            onRefreshData={refreshAllData}
            onOpenUserGuide={(r) => handleOpenUserGuide(r || 'security')}
          />
        )}

        {/* ۱۳. در صورتی که کاربر معاونت دانشجویی است (تلفیق سرپرستی + امور دانشجویی + فرهنگی + گزارش تحلیلی + پایش پیام‌ها بجز دانشجو) */}
        {currentUser?.role === 'vice_dean' && (
          <ViceDeanDashboard
            staff={currentUser.staff}
            dorms={dorms}
            rooms={rooms}
            beds={beds}
            students={students}
            announcements={announcements}
            warnings={warnings}
            settings={settings}
            maintenanceTasks={maintenanceTasks}
            maintenanceStaff={maintenanceStaff}
            cloudSyncTick={cloudSyncTick}
            onRefreshData={refreshAllData}
            onOpenReports={() => setIsReportsModalOpen(true)}
            onOpenMessages={() => setIsMessagesModalOpen(true)}
            onOpenExcelModal={() => handleOpenExcelModal('students')}
            onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
            onOpenUserGuide={(r) => handleOpenUserGuide(r || 'vice_dean')}
          />
        )}
        {/* ۱۴. در صورتی که کاربر کتابخانه و پژوهش است (دسترسی محدود به اطلاعات دانشجو) */}
        {currentUser?.role === 'library' && (
          <LibraryDashboard
            staff={currentUser.staff}
            students={students}
            messages={messages}
            settings={settings}
            onDataChange={refreshAllData}
            onOpenMessages={() => setIsMessagesModalOpen(true)}
          />
        )}

        {/* ۱۵. در صورتی که کاربر واحد هوشمندسازی است (دسترسی محدود به اطلاعات دانشجو) */}
        {currentUser?.role === 'smart_campus' && (
          <SmartCampusDashboard
            staff={currentUser.staff}
            students={students}
            messages={messages}
            settings={settings}
            onDataChange={refreshAllData}
            onOpenMessages={() => setIsMessagesModalOpen(true)}
          />
        )}

        {/* ۱۶. داشبورد یکپارچه حوزه معاونت آموزشی (واحد فارغ‌التحصیلان) */}
        {currentUser?.role === 'graduation' && (
          <AcademicDeputyHub
            role="graduation"
            graduationStaff={currentUser.staff}
            students={students}
            messages={messages}
            settings={settings}
            cloudSyncTick={cloudSyncTick}
            onRefreshData={refreshAllData}
            onOpenMessages={() => setIsMessagesModalOpen(true)}
            onOpenUserGuide={(r) => handleOpenUserGuide(r || 'graduation')}
          />
        )}
        </Suspense>
        </ChunkErrorBoundary>

      </main>

      {/* فوتر سایت */}
      <footer className="mt-auto py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] border-t border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {settings.customLogoUrl && (
                <div className="bg-white p-1 rounded-lg border border-slate-200 shrink-0">
                  <FarhangianEmblem size={24} customLogoUrl={settings.customLogoUrl} />
                </div>
              )}
              <span>دانشگاه فرهنگیان استان اصفهان • سامانه جامع خدمات دانشجویی</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
              {currentUser &&
                currentUser.role !== 'education' &&
                currentUser.role !== 'cultural' &&
                currentUser.role !== 'library' &&
                currentUser.role !== 'smart_campus' &&
                currentUser.role !== 'graduation' && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsAiChatOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-l from-teal-700 to-cyan-700 hover:from-teal-800 hover:to-cyan-800 text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>دستیار هوشمند سامانه (چت‌بات)</span>
                  </button>
                  <span className="hidden sm:inline">•</span>
                </>
              )}
              <button
                onClick={() => setIsAboutModalOpen(true)}
                className="text-teal-600 dark:text-teal-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span>درباره ما</span>
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

          <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-800/80 text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
            کلیه حقوق مادی و معنوی این سامانه متعلق به طراح و معمار سامانه بوده و فعالیت آن منطبق با قوانین و مقررات جمهوری اسلامی ایران می‌باشد.
          </div>
        </div>
      </footer>

      {/* مودال‌های مشترک با بارگذاری تنبل (تنها هنگام باز شدن) */}
      <ChunkErrorBoundary resetKey={`modals_${currentUser?.role || 'guest'}`}>
      <Suspense fallback={null}>
        {isAboutModalOpen && (
          <AboutModal
            isOpen={isAboutModalOpen}
            onClose={() => setIsAboutModalOpen(false)}
            customLogoUrl={settings.customLogoUrl}
            settings={settings}
            isAdmin={currentUser?.role === 'admin'}
            onOpenAdminEdit={() => {
              setIsAboutModalOpen(false);
              setFocusAboutEditorTick((t) => t + 1);
            }}
          />
        )}

        {isUserGuideOpen && (
          <UserGuideModal
            isOpen={isUserGuideOpen}
            onClose={() => setIsUserGuideOpen(false)}
            initialRole={userGuideInitialRole}
            customLogoUrl={settings.customLogoUrl}
          />
        )}

        {isLoginModalOpen && (
          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            onLoginSuccess={handleLoginSuccess}
            onRefreshData={refreshAllData}
            onOpenUserGuide={(r) => handleOpenUserGuide(r)}
          />
        )}

        {currentUser?.role === 'admin' && isAppearanceModalOpen && (
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

        {currentUser &&
          currentUser.role !== 'student' &&
          currentUser.role !== 'finance' &&
          currentUser.role !== 'education' &&
          currentUser.role !== 'cultural' &&
          currentUser.role !== 'library' &&
          currentUser.role !== 'smart_campus' &&
          currentUser.role !== 'graduation' &&
          isReportsModalOpen && (
            <ReportsView
              isOpen={isReportsModalOpen}
              onClose={() => setIsReportsModalOpen(false)}
              dorms={dorms}
              rooms={rooms}
              beds={beds}
              students={students}
              cloudSyncTick={cloudSyncTick}
            />
          )}

        {isExcelModalOpen && (
          <ExcelImportModal
            isOpen={isExcelModalOpen}
            onClose={() => setIsExcelModalOpen(false)}
            initialTab={excelModalInitialTab}
            allowStaffTabs={currentUser?.role === 'admin'}
            onImportComplete={() => {
              setIsExcelModalOpen(false);
              refreshAllData();
            }}
          />
        )}

        {currentUser && isMessagesModalOpen && (
          <MessagingPanel
            isOpen={isMessagesModalOpen}
            onClose={() => {
              setIsMessagesModalOpen(false);
              setFocusedMessageId(null);
              setOpenedMessagesFromNotif(false);
            }}
            currentUser={currentUser}
            messages={messages}
            onMessagesUpdated={refreshAllData}
            initialMessageId={focusedMessageId}
            returnLabel={openedMessagesFromNotif ? 'بستن و بازگشت' : 'بازگشت'}
          />
        )}

        {currentUser && isCommunityChatOpen && (
          <CommunityChatHub
            currentUser={currentUser}
            students={students}
            mode="modal"
            initialTargetRoom={chatTargetRoom}
            onlineUserIds={onlineUserIds}
            onStartVoiceCall={(target) => setActiveVoiceCall(target)}
            cloudSyncTick={cloudSyncTick}
            onClose={() => {
              setIsCommunityChatOpen(false);
              setChatTargetRoom(null);
            }}
            onRefreshGlobalData={refreshAllData}
          />
        )}

        {currentUser &&
          currentUser.role !== 'student' &&
          currentUser.role !== 'warehouse' &&
          isWarehouseRequestModalOpen && (
            <WarehouseRequisitionModal
              isOpen={isWarehouseRequestModalOpen}
              onClose={() => setIsWarehouseRequestModalOpen(false)}
              currentUser={currentUser}
              dorms={dorms}
              warehouseRequests={warehouseRequests}
              onSubmitted={refreshAllData}
            />
          )}

        {currentUser && isChangePasswordModalOpen && (
          <ChangePasswordModal
            isOpen={isChangePasswordModalOpen}
            onClose={() => setIsChangePasswordModalOpen(false)}
            currentUser={currentUser}
            onPasswordChanged={refreshAllData}
          />
        )}

        {/* دستیار هوشمند سامانه جامع خدمات دانشجویی */}
        {currentUser &&
          currentUser.role !== 'education' &&
          currentUser.role !== 'cultural' &&
          currentUser.role !== 'library' &&
          currentUser.role !== 'smart_campus' &&
          currentUser.role !== 'graduation' &&
          isAiChatOpen && (
            <AiDormAssistant
              isOpen={isAiChatOpen}
              onClose={() => setIsAiChatOpen(false)}
              currentUser={currentUser}
              settings={settings}
              dorms={dorms}
              rooms={rooms}
              beds={beds}
              students={students}
              announcements={announcements}
            />
          )}
      </Suspense>
      </ChunkErrorBoundary>

      <OfflineIndicator />

      {/* اعلان شناور تلفن تماس صوتی ورودی با دکمه پاسخ و رد تماس */}
      {currentUser && !activeVoiceCall && (
        <IncomingCallFloatingBanner
          call={incomingVoiceCall}
          isCallerOnline={
            incomingVoiceCall ? onlineUserIds.has(incomingVoiceCall.callerId) : true
          }
          onAccept={handleAcceptIncomingVoiceCall}
          onReject={handleRejectIncomingVoiceCall}
        />
      )}

      {/* پنجره فعال تماس صوتی زنده (مستقل از باز یا بسته بودن پنجره چت) */}
      {currentUser && activeVoiceCall && realtimeIdentity && (
        <LiveVoiceCallModal
          call={activeVoiceCall}
          currentUserId={realtimeIdentity.id}
          currentUserName={realtimeIdentity.name}
          currentUserRole={realtimeIdentity.role}
          isTargetOnline={
            activeVoiceCall.targetPeerId
              ? onlineUserIds.has(activeVoiceCall.targetPeerId)
              : undefined
          }
          onClose={() => setActiveVoiceCall(null)}
        />
      )}

      {/* مدال مدیریت نشست‌های فعال در دستگاه‌های مختلف */}
      {currentUser && (
        <ActiveSessionsModal
          isOpen={isActiveSessionsModalOpen}
          onClose={() => setIsActiveSessionsModalOpen(false)}
          sessions={activeSessions}
          autoCloseOtherSessions={autoCloseOtherSessions}
          onToggleAutoCloseOtherSessions={handleToggleAutoCloseOtherSessions}
          onTerminateSession={terminateSession}
          onTerminateAllOtherSessions={terminateAllOtherSessions}
        />
      )}

      {/* اعلان‌های زنده داخل برنامه (Toast) با انیمیشن نرم ورود و محو شدن خودکار */}
      <LiveNotificationToasts
        toasts={liveToasts}
        hasIncomingCallBanner={Boolean(currentUser && incomingVoiceCall && !activeVoiceCall)}
        onDismiss={(id) => setLiveToasts((prev) => prev.filter((t) => t.id !== id))}
        onClickToast={(item) => handleNotificationItemClick(item, true)}
      />

      {/* مدال مرکز اعلان‌ها و تنظیمات نوتیفیکیشن گوشی */}
      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => {
          setIsNotificationModalOpen(false);
          setSelectedNotificationItem(null);
        }}
        permission={notificationPermission}
        prefs={notificationPrefs}
        notifications={notificationFeed}
        announcements={announcements}
        warnings={warnings}
        onOpenImagePreview={(src) => setPreviewImage(src)}
        selectedItem={selectedNotificationItem}
        onClearSelectedItem={() => setSelectedNotificationItem(null)}
        onRequestPermission={handleRequestNotifications}
        onUpdatePrefs={handleUpdateNotificationPrefs}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onClearAll={handleClearNotifications}
        onNotificationClick={(item) => handleNotificationItemClick(item, false)}
        incomingVoiceCall={currentUser && !activeVoiceCall ? incomingVoiceCall : null}
        onAcceptIncomingCall={handleAcceptIncomingVoiceCall}
        onRejectIncomingCall={handleRejectIncomingVoiceCall}
        onlineUserIds={onlineUserIds}
      />

      {/* مدال بزرگ‌نمایی و نمایش در ابعاد واقعی تصویر اطلاعیه */}
      <ImageLightboxModal
        src={previewImage}
        alt="پوستر / تصویر اطلاعیه"
        onClose={() => setPreviewImage(null)}
      />

    </div>
  );
}
