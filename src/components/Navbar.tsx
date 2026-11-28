import React, { useState } from 'react';
import { CurrentUser, AppSettings, RoomWarning, Message } from '../types';
import {
  Storage,
  doesStudentMatchMessage,
  doesEducationStaffMatchMessage,
  getEducationStaffRoleLabel,
  isEducationDepartmentHead,
} from '../utils/storage';
import { getStudentAdmissionStatus } from '../utils/financeUtils';
import { FarhangianEmblem } from './FarhangianEmblem';
import { PWAInstallButton } from './PWAInstallButton';
import { JalaliLiveClockBar } from './JalaliLiveClockBar';
import {
  User,
  LogOut,
  Palette,
  BarChart3,
  MessageSquare,
  KeyRound,
  School,
  RefreshCw,
  Menu,
  X,
  Bell,
  BellRing,
  MessagesSquare,
  MonitorSmartphone,
  PhoneIncoming,
} from 'lucide-react';

interface NavbarProps {
  currentUser: CurrentUser;
  settings: AppSettings;
  warnings: RoomWarning[];
  messages: Message[];
  onOpenAppearance: () => void;
  onOpenReports: () => void;
  onOpenMessages: () => void;
  onOpenChangePassword: () => void;
  onLogout: () => void;
  onNavigateHome: () => void;
  onOpenLogin: () => void;
  onOpenAbout?: () => void;
  onOpenUserGuide: () => void;
  onRefreshCloud?: () => void;
  isRefreshingCloud?: boolean;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  notificationPermission?: NotificationPermission | 'unsupported';
  onOpenCommunityChat?: () => void;
  communityModerationBadge?: number;
  onOpenActiveSessions?: () => void;
  activeSessionsCount?: number;
  hasIncomingVoiceCall?: boolean;
  onOpenIncomingVoiceCall?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  settings,
  warnings,
  messages,
  onOpenAppearance,
  onOpenReports,
  onOpenMessages,
  onOpenChangePassword,
  onLogout,
  onNavigateHome,
  onOpenLogin,
  onOpenUserGuide,
  onRefreshCloud,
  isRefreshingCloud = false,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  notificationPermission = 'default',
  onOpenCommunityChat,
  communityModerationBadge = 0,
  onOpenActiveSessions,
  activeSessionsCount = 1,
  hasIncomingVoiceCall = false,
  onOpenIncomingVoiceCall,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const canViewReports =
    Boolean(currentUser) &&
    currentUser?.role !== 'student' &&
    currentUser?.role !== 'finance' &&
    currentUser?.role !== 'education' &&
    currentUser?.role !== 'academic_deputy' &&
    currentUser?.role !== 'professor' &&
    currentUser?.role !== 'cultural' &&
    currentUser?.role !== 'library' &&
    currentUser?.role !== 'smart_campus' &&
    currentUser?.role !== 'graduation';

  // تعداد پیام‌های خوانده‌نشده
  const pendingMessagesCount = messages.filter((m) => {
    if (currentUser?.role === 'student') {
      return (
        (m.senderId === currentUser.student.studentId && m.replies.length > 0) ||
        (doesStudentMatchMessage(currentUser.student, m) &&
          m.senderId !== currentUser.student.studentId &&
          m.status !== 'answered')
      );
    }
    if (currentUser?.role === 'maintenance') {
      return (
        (m.receiverType === 'maintenance' || m.category === 'maintenance' || m.receiverType === 'all' || m.senderRole === 'maintenance') &&
        m.status !== 'answered'
      );
    }
    if (currentUser?.role === 'counselor') {
      return (
        (m.receiverType === 'counselor' ||
          m.category === 'counseling' ||
          m.category === 'social_personal' ||
          m.senderRole === 'counselor') &&
        m.status !== 'answered'
      );
    }
    if (currentUser?.role === 'finance') {
      return (
        (m.receiverType === 'finance' || m.category === 'financial' || m.senderRole === 'finance') &&
        m.status !== 'answered'
      );
    }
    if (currentUser?.role === 'education') {
      return (
        doesEducationStaffMatchMessage(
          currentUser.staff,
          m,
          Storage.getEducationStaff(),
          Storage.getStudents()
        ) && m.status !== 'answered'
      );
    }
    if (currentUser?.role === 'cultural') {
      return (
        !m.isConfidential &&
        (m.receiverType === 'cultural' || m.category === 'cultural' || m.senderRole === 'cultural') &&
        m.status !== 'answered'
      );
    }
    if (currentUser?.role === 'student_affairs') {
      return (
        !m.isConfidential &&
        (m.receiverType === 'student_affairs' ||
          m.category === 'student_affairs' ||
          m.senderRole === 'student_affairs' ||
          m.receiverType === 'all') &&
        m.status !== 'answered'
      );
    }
    if (currentUser?.role === 'security') {
      return (
        (!m.isConfidential || m.receiverType === 'security' || m.senderRole === 'security') &&
        (m.receiverType === 'security' ||
          m.category === 'security' ||
          m.senderRole === 'security' ||
          m.receiverType === 'all') &&
        m.status !== 'answered'
      );
    }
    if (currentUser?.role === 'warehouse') {
      return (
        (m.receiverType === 'warehouse' || m.senderRole === 'warehouse') &&
        m.status !== 'answered'
      );
    }
    if (currentUser?.role === 'procurement') {
      return (
        (m.receiverType === 'procurement' || m.senderRole === 'procurement') &&
        m.status !== 'answered'
      );
    }
    if (currentUser?.role === 'supervisor') {
      return (
        (m.receiverType === 'supervisor' || m.senderRole === 'supervisor' || m.receiverType === 'all') &&
        m.status !== 'answered'
      );
    }
    if (currentUser?.role === 'vice_dean') {
      return (
        m.senderRole !== 'student' &&
        m.receiverType !== 'student' &&
        (m.receiverType === 'vice_dean' || m.receiverType === 'all' || m.senderRole === 'vice_dean') &&
        m.status !== 'answered'
      );
    }
    if (currentUser?.role === 'library') {
      return (
        !m.isConfidential &&
        (m.receiverType === 'library' || m.category === 'library' || m.senderRole === 'library') &&
        m.status !== 'answered'
      );
    }
    if (currentUser?.role === 'smart_campus') {
      return (
        !m.isConfidential &&
        (m.receiverType === 'smart_campus' || m.category === 'smart_campus' || m.senderRole === 'smart_campus') &&
        m.status !== 'answered'
      );
    }
    if (currentUser?.role === 'graduation') {
      return (
        !m.isConfidential &&
        (m.receiverType === 'graduation' || m.category === 'graduation' || m.senderRole === 'graduation') &&
        m.status !== 'answered'
      );
    }
    if (currentUser?.role === 'academic_deputy') {
      return (
        !m.isConfidential &&
        (m.receiverType === 'academic_deputy' ||
          m.receiverType === 'education' ||
          m.receiverType === 'graduation' ||
          m.receiverType === 'professor' ||
          m.receiverType === 'all' ||
          m.category === 'education' ||
          m.category === 'graduation' ||
          m.senderRole === 'academic_deputy' ||
          m.senderRole === 'education' ||
          m.senderRole === 'graduation' ||
          m.senderRole === 'professor') &&
        m.status !== 'answered'
      );
    }
    if (currentUser?.role === 'professor') {
      return (
        !m.isConfidential &&
        (m.senderId === currentUser.professor.id ||
          m.receiverId === currentUser.professor.id ||
          m.receiverType === 'professor') &&
        m.status !== 'answered'
      );
    }
    return m.status === 'pending';
  }).length;

  return (
    <header className="sticky top-0 z-40 pt-[env(safe-area-inset-top)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 h-14 sm:h-20">
          
          {/* لوگو و نام دانشگاه فرهنگیان اصفهان */}
          <div
            onClick={() => {
              setIsMobileMenuOpen(false);
              onNavigateHome();
            }}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0 flex-1"
          >
            {settings.customLogoUrl ? (
              <div className="bg-white p-1 rounded-xl shadow-xs border border-slate-200/80 shrink-0">
                <FarhangianEmblem size={34} customLogoUrl={settings.customLogoUrl} className="group-hover:scale-105 transition" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shrink-0">
                <School className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-extrabold text-xs sm:text-base text-slate-900 dark:text-white tracking-tight truncate">
                  سامانه جامع خدمات دانشگاهی
                </span>
                <span className="hidden lg:inline-block shrink-0 px-2 py-0.5 text-[11px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded-full border border-teal-200 dark:border-teal-800">
                  دانشگاه فرهنگیان ({settings.currentAcademicYear || '۱۴۰۵-۱۴۰۶'})
                </span>
              </div>
              <p className="hidden md:block text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                پیشخوان جامع خدمات دانشگاهی — آموزش، سراهای دانشجویی، مالی، فرهنگی، ورزشی، کتابخانه، مشاوره و هوشمندسازی
              </p>
              <p className="md:hidden text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                دانشگاه فرهنگیان اصفهان ({settings.currentAcademicYear || '۱۴۰۵-۱۴۰۶'})
              </p>
            </div>
          </div>

          {/* ابزارهای فشرده موبایل و اپلیکیشن (بدون سرریز افقی) */}
          <div className="flex md:hidden items-center gap-1 shrink-0">
            {onRefreshCloud && (
              <button
                type="button"
                onClick={onRefreshCloud}
                disabled={isRefreshingCloud}
                className="p-2 rounded-xl text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 transition cursor-pointer disabled:opacity-60"
                title="بروزرسانی اطلاعات"
                aria-label="بروزرسانی اطلاعات"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshingCloud ? 'animate-spin' : ''}`} />
              </button>
            )}

            {hasIncomingVoiceCall && onOpenIncomingVoiceCall && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenIncomingVoiceCall();
                }}
                className="relative p-2 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30 animate-pulse transition cursor-pointer"
                title="تماس صوتی ورودی — جهت پاسخ یا رد تماس کلیک کنید"
                aria-label="تماس صوتی ورودی"
              >
                <PhoneIncoming className="w-4 h-4 animate-bounce" />
              </button>
            )}

            {onOpenNotifications && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenNotifications();
                }}
                className={`relative p-2 rounded-xl transition cursor-pointer ${
                  notificationPermission === 'granted'
                    ? 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800'
                    : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800'
                }`}
                title="اعلان‌ها و نوتیفیکیشن گوشی"
                aria-label="اعلان‌ها و نوتیفیکیشن گوشی"
              >
                {notificationPermission === 'granted' ? (
                  <Bell className="w-4 h-4" />
                ) : (
                  <BellRing className="w-4 h-4" />
                )}
                {unreadNotificationsCount > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                ) : notificationPermission === 'default' ? (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                ) : null}
              </button>
            )}

            {currentUser && onOpenCommunityChat && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenCommunityChat();
                }}
                className="relative p-2 rounded-xl text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 transition cursor-pointer"
                title="تالار گفتگوی عمومی و پیام‌رسان دانشجویی"
                aria-label="تالار گفتگوی عمومی و پیام‌رسان دانشجویی"
              >
                <MessagesSquare className="w-4 h-4" />
                {communityModerationBadge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {communityModerationBadge > 9 ? '9+' : communityModerationBadge}
                  </span>
                )}
              </button>
            )}

            {currentUser && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenMessages();
                }}
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="صندوق پیام‌ها"
                aria-label="صندوق پیام‌ها"
              >
                <MessageSquare className="w-4 h-4" />
                {pendingMessagesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {pendingMessagesCount}
                  </span>
                )}
              </button>
            )}

            {/* در صفحه اصلی قبل از ورود، دکمه ورود تکراری بالا حذف و تاریخ و ساعت در بالای صفحه نمایش داده می‌شود */}

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'بستن منو' : 'باز کردن منو'}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isMobileMenuOpen
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* ابزارها و اکشن‌های نوار بالا (دسکتاپ و تبلت) */}
          <div className="hidden md:flex items-center gap-1.5 sm:gap-2 shrink-0">

            {/* دکمه نصب نسخه اپلیکیشن موبایل (PWA) */}
            <PWAInstallButton variant="navbar" />

            {/* دکمه بروزرسانی فوری اطلاعات (تازه‌سازی کش ۵ دقیقه‌ای و دریافت آخرین تغییرات) */}
            {onRefreshCloud && (
              <button
                type="button"
                onClick={onRefreshCloud}
                disabled={isRefreshingCloud}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold transition cursor-pointer disabled:opacity-60 shadow-xs"
                title="تازه‌سازی فوری کش و دریافت آخرین اطلاعات سامانه"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCloud ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">بروزرسانی اطلاعات</span>
              </button>
            )}

            {/* گزارش‌ها و آمار - فقط برای مدیر، سرپرست و کادر فنی/انبار/مشاور/امور دانشجویی (نه دانشجو، امور مالی، کارشناس آموزش و امور فرهنگی) */}
            {currentUser &&
              currentUser.role !== 'student' &&
              currentUser.role !== 'finance' &&
              currentUser.role !== 'education' &&
              currentUser.role !== 'cultural' &&
              currentUser.role !== 'library' &&
              currentUser.role !== 'smart_campus' &&
              currentUser.role !== 'graduation' && (
              <button
                onClick={onOpenReports}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
                title="مشاهده آمار و گزارش‌های خوابگاه"
              >
                <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="hidden sm:inline">گزارش‌ها</span>
              </button>
            )}


            {/* دکمه تلفن چشمک‌زن هنگام وجود تماس صوتی ورودی */}
            {hasIncomingVoiceCall && onOpenIncomingVoiceCall && (
              <button
                type="button"
                onClick={onOpenIncomingVoiceCall}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black shadow-md shadow-emerald-600/35 animate-pulse transition cursor-pointer"
                title="تماس صوتی ورودی — جهت پاسخ یا رد تماس کلیک کنید"
              >
                <PhoneIncoming className="w-4 h-4 animate-bounce" />
                <span>تماس ورودی</span>
              </button>
            )}

            {/* دکمه اعلان‌ها و نوتیفیکیشن فوری */}
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className={`relative p-2 rounded-xl transition cursor-pointer ${
                  notificationPermission === 'granted'
                    ? 'text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/60'
                    : 'text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200/80 dark:border-amber-800'
                }`}
                title={
                  notificationPermission === 'granted'
                    ? 'مرکز اعلان‌ها و تنظیمات نوتیفیکیشن (فعال)'
                    : 'روشن کردن نوتیفیکیشن فوری گوشی و مرورگر'
                }
              >
                {notificationPermission === 'granted' ? (
                  <Bell className="w-4 h-4" />
                ) : (
                  <BellRing className="w-4 h-4" />
                )}
                {unreadNotificationsCount > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                ) : notificationPermission === 'default' ? (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                ) : null}
              </button>
            )}

            {/* تالار گفتگوی عمومی و پیام‌رسان دانشجویی - برای تمام کاربران واردشده */}
            {currentUser && onOpenCommunityChat && (
              <button
                type="button"
                onClick={onOpenCommunityChat}
                className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-[11px] font-extrabold shadow-xs transition cursor-pointer"
                title="تالار گفتگوی عمومی، گروه‌های تخصصی و پیام‌رسان دانشجویی"
              >
                <MessagesSquare className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">تالار گفتگو</span>
                {communityModerationBadge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                    {communityModerationBadge > 9 ? '9+' : communityModerationBadge}
                  </span>
                )}
              </button>
            )}

            {/* صندوق پیام‌ها - فقط برای کاربران لاگین شده */}
            {currentUser && (
              <button
                onClick={onOpenMessages}
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="صندوق پیام‌ها و تیکت‌ها"
              >
                <MessageSquare className="w-4 h-4" />
                {pendingMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {pendingMessagesCount}
                  </span>
                )}
              </button>
            )}

            {/* دکمه شخصی‌سازی ظاهر و تم - فقط در اختیار مدیر سامانه (Admin) */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={onOpenAppearance}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="تغییر والپیپر، فونت و ظاهر سایت (ویژه مدیر)"
              >
                <Palette className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </button>
            )}

            {/* اطلاعات کاربر، تغییر رمز و خروج / دکمه ورود */}
            {currentUser ? (
              <div className="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-slate-800">
                {(() => {
                  const avatarUrl =
                    currentUser.role === 'student'
                      ? currentUser.student.photoUrl
                      : currentUser.role === 'supervisor'
                      ? currentUser.supervisor.photoUrl
                      : currentUser.role === 'maintenance'
                      ? currentUser.technician.photoUrl
                      : currentUser.role === 'warehouse'
                      ? currentUser.staff.photoUrl
                      : currentUser.role === 'procurement'
                      ? currentUser.staff.photoUrl
                      : currentUser.role === 'finance'
                      ? currentUser.staff.photoUrl
                      : currentUser.role === 'education'
                      ? currentUser.staff.photoUrl
                      : currentUser.role === 'cultural'
                      ? currentUser.staff.photoUrl
                      : currentUser.role === 'student_affairs'
                      ? currentUser.staff.photoUrl
                      : currentUser.role === 'security'
                      ? currentUser.staff.photoUrl
                      : currentUser.role === 'vice_dean'
                      ? currentUser.staff.photoUrl
                      : currentUser.role === 'library'
                      ? currentUser.staff.photoUrl
                      : currentUser.role === 'smart_campus'
                      ? currentUser.staff.photoUrl
                      : currentUser.role === 'graduation'
                      ? currentUser.staff.photoUrl
                      : currentUser.role === 'academic_deputy'
                      ? currentUser.staff.photoUrl
                      : currentUser.role === 'professor'
                      ? currentUser.professor.photoUrl
                      : currentUser.role === 'counselor'
                      ? currentUser.counselor.photoUrl
                      : undefined;
                  return avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover border border-teal-200 dark:border-teal-700 shadow-xs shrink-0"
                    />
                  ) : null;
                })()}
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>
                      {currentUser.role === 'student' && currentUser.student.fullName}
                      {currentUser.role === 'supervisor' && currentUser.supervisor.fullName}
                      {currentUser.role === 'counselor' && currentUser.counselor.fullName}
                      {currentUser.role === 'maintenance' && currentUser.technician.fullName}
                      {currentUser.role === 'warehouse' && currentUser.staff.fullName}
                      {currentUser.role === 'procurement' && currentUser.staff.fullName}
                      {currentUser.role === 'finance' && currentUser.staff.fullName}
                      {currentUser.role === 'education' && currentUser.staff.fullName}
                      {currentUser.role === 'cultural' && currentUser.staff.fullName}
                      {currentUser.role === 'student_affairs' && currentUser.staff.fullName}
                      {currentUser.role === 'security' && currentUser.staff.fullName}
                      {currentUser.role === 'vice_dean' && currentUser.staff.fullName}
                      {currentUser.role === 'library' && currentUser.staff.fullName}
                      {currentUser.role === 'smart_campus' && currentUser.staff.fullName}
                      {currentUser.role === 'graduation' && currentUser.staff.fullName}
                      {currentUser.role === 'academic_deputy' && currentUser.staff.fullName}
                      {currentUser.role === 'professor' && currentUser.professor.fullName}
                      {currentUser.role === 'admin' && 'مدیر کل سامانه'}
                    </span>
                    {currentUser.role === 'counselor' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
                        مشاور و روانشناس
                      </span>
                    )}
                    {currentUser.role === 'maintenance' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                        تکنسین فنی
                      </span>
                    )}
                    {currentUser.role === 'warehouse' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 font-bold">
                        مسئول انبار
                      </span>
                    )}
                    {currentUser.role === 'procurement' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-bold">
                        کارپرداز و خرید
                      </span>
                    )}
                    {currentUser.role === 'finance' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                        امور مالی و حسابداری
                      </span>
                    )}
                    {currentUser.role === 'education' && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                          isEducationDepartmentHead(currentUser.staff)
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                        }`}
                      >
                        {getEducationStaffRoleLabel(currentUser.staff)}
                      </span>
                    )}
                    {currentUser.role === 'cultural' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300 font-bold">
                        امور فرهنگی
                      </span>
                    )}
                    {currentUser.role === 'student_affairs' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                        امور دانشجویی و تربیت بدنی
                      </span>
                    )}
                    {currentUser.role === 'security' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-800 text-amber-300 dark:bg-amber-950 dark:text-amber-300 font-bold">
                        حراست و انتظامات
                      </span>
                    )}
                    {currentUser.role === 'vice_dean' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                        معاونت دانشجویی
                      </span>
                    )}
                    {currentUser.role === 'library' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                        کتابخانه و پژوهش
                      </span>
                    )}
                    {currentUser.role === 'smart_campus' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 font-bold">
                        واحد هوشمندسازی
                      </span>
                    )}
                    {currentUser.role === 'graduation' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                        واحد فارغ‌التحصیلان
                      </span>
                    )}
                    {currentUser.role === 'academic_deputy' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                        معاونت آموزشی
                      </span>
                    )}
                    {currentUser.role === 'professor' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                        استاد / مدرس
                      </span>
                    )}
                    {currentUser.role === 'student' && (
                      <>
                        {getStudentAdmissionStatus(currentUser.student) === 'admitted' ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold">
                            پذیرش شده
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
                            پذیرش نشده
                          </span>
                        )}
                        {currentUser.student.isProfileCompleted ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                            پرونده تکمیل
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold animate-pulse">
                            پرونده ناقص
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {currentUser.role === 'student' && `کد دانشجویی: ${currentUser.student.studentId}`}
                    {currentUser.role === 'supervisor' && 'سرپرست سرا'}
                    {currentUser.role === 'counselor' && `مرکز مشاوره (${currentUser.counselor.specialty || 'سلامت روان'})`}
                    {currentUser.role === 'maintenance' && `امور تأسیسات (${currentUser.technician.specialty || 'تکنسین'})`}
                    {currentUser.role === 'warehouse' && 'مسئول انبار و تجهیزات'}
                    {currentUser.role === 'procurement' && (currentUser.staff.department || 'واحد کارپردازی و خرید')}
                    {currentUser.role === 'finance' && (currentUser.staff.department || 'واحد امور مالی و حسابداری')}
                    {currentUser.role === 'education' && (currentUser.staff.department || 'واحد امور آموزشی')}
                    {currentUser.role === 'cultural' && (currentUser.staff.department || 'واحد امور فرهنگی و اجتماعی سراها')}
                    {currentUser.role === 'student_affairs' && (currentUser.staff.department || 'اداره امور دانشجویی، تربیت بدنی و رفاهی')}
                    {currentUser.role === 'security' && (currentUser.staff.department || 'واحد حراست و انتظامات')}
                    {currentUser.role === 'vice_dean' && (currentUser.staff.title || currentUser.staff.department || 'معاونت دانشجویی دانشگاه فرهنگیان')}
                    {currentUser.role === 'library' && (currentUser.staff.department || 'واحد کتابخانه و پژوهش')}
                    {currentUser.role === 'smart_campus' && (currentUser.staff.department || 'واحد هوشمندسازی و فناوری')}
                    {currentUser.role === 'graduation' && (currentUser.staff.department || 'اداره امور فارغ‌التحصیلان')}
                    {currentUser.role === 'academic_deputy' && (currentUser.staff.title || currentUser.staff.department || 'معاونت آموزشی دانشگاه فرهنگیان')}
                    {currentUser.role === 'professor' && `کد استاد: ${currentUser.professor.professorCode}`}
                    {currentUser.role === 'admin' && 'مدیر کل سامانه جامع خدمات دانشگاهی'}
                  </div>
                </div>

                {/* دکمه نشست‌های فعال (مدیریت سیستم‌های متصل) */}
                {onOpenActiveSessions && (
                  <button
                    type="button"
                    onClick={onOpenActiveSessions}
                    className={`relative p-2 rounded-xl transition cursor-pointer ${
                      activeSessionsCount > 1
                        ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title={`نشست‌های فعال و دستگاه‌های متصل (${activeSessionsCount.toLocaleString('fa-IR')} نشست)`}
                  >
                    <MonitorSmartphone className="w-4 h-4" />
                    {activeSessionsCount > 1 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                        {activeSessionsCount}
                      </span>
                    )}
                  </button>
                )}

                {/* دکمه تغییر کلمه عبور */}
                <button
                  onClick={onOpenChangePassword}
                  className="p-2 rounded-xl text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition cursor-pointer"
                  title="تغییر کلمه عبور"
                >
                  <KeyRound className="w-4 h-4" />
                </button>

                {/* دکمه خروج */}
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  title="خروج از حساب کاربری"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <JalaliLiveClockBar variant="compact" />
            )}

          </div>

        </div>

        {/* نمایش فشرده تاریخ شمسی و ساعت زنده در بالای نسخه موبایل قبل از ورود */}
        {!currentUser && (
          <div className="md:hidden pb-2 pt-0.5 flex items-center justify-end">
            <JalaliLiveClockBar variant="compact" />
          </div>
        )}

        {/* منوی کشویی استاندارد موبایل و نسخه اپلیکیشن */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-3 pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
            {currentUser && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70">
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                    {currentUser.role === 'student' && currentUser.student.fullName}
                    {currentUser.role === 'supervisor' && currentUser.supervisor.fullName}
                    {currentUser.role === 'counselor' && currentUser.counselor.fullName}
                    {currentUser.role === 'maintenance' && currentUser.technician.fullName}
                    {currentUser.role === 'warehouse' && currentUser.staff.fullName}
                    {currentUser.role === 'procurement' && currentUser.staff.fullName}
                    {currentUser.role === 'finance' && currentUser.staff.fullName}
                    {currentUser.role === 'education' && currentUser.staff.fullName}
                    {currentUser.role === 'cultural' && currentUser.staff.fullName}
                    {currentUser.role === 'student_affairs' && currentUser.staff.fullName}
                    {currentUser.role === 'security' && currentUser.staff.fullName}
                    {currentUser.role === 'vice_dean' && currentUser.staff.fullName}
                    {currentUser.role === 'library' && currentUser.staff.fullName}
                    {currentUser.role === 'smart_campus' && currentUser.staff.fullName}
                    {currentUser.role === 'graduation' && currentUser.staff.fullName}
                    {currentUser.role === 'academic_deputy' && currentUser.staff.fullName}
                    {currentUser.role === 'professor' && currentUser.professor.fullName}
                    {currentUser.role === 'admin' && 'مدیر کل سامانه'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.role === 'student'
                      ? `کد دانشجویی: ${currentUser.student.studentId}`
                      : currentUser.role === 'professor'
                      ? `استاد / مدرس • کد: ${currentUser.professor.professorCode}`
                      : currentUser.role === 'academic_deputy'
                      ? 'معاونت آموزشی دانشگاه فرهنگیان'
                      : currentUser.role === 'admin'
                      ? 'مدیر کل سامانه جامع خدمات دانشگاهی'
                      : 'کاربر کادر سامانه'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>خروج</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 flex items-center justify-start">
                <PWAInstallButton variant="navbar" />
              </div>

              {currentUser && onOpenCommunityChat && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenCommunityChat();
                  }}
                  className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-l from-teal-600 to-emerald-600 text-white text-xs font-extrabold shadow-xs cursor-pointer"
                >
                  <MessagesSquare className="w-4 h-4" />
                  <span>تالار گفتگوی عمومی و پیام‌رسان دانشجویی</span>
                  {communityModerationBadge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                      {communityModerationBadge}
                    </span>
                  )}
                </button>
              )}

              {canViewReports && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenReports();
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>گزارش‌ها و آمار</span>
                </button>
              )}

              {currentUser && onOpenActiveSessions && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenActiveSessions();
                  }}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                    activeSessionsCount > 1
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <MonitorSmartphone className="w-4 h-4" />
                  <span>
                    نشست‌های فعال {activeSessionsCount > 1 ? `(${activeSessionsCount})` : ''}
                  </span>
                </button>
              )}

              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenChangePassword();
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>تغییر رمز عبور</span>
                </button>
              )}

              {currentUser?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAppearance();
                  }}
                  className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold cursor-pointer"
                >
                  <Palette className="w-4 h-4" />
                  <span>شخصی‌سازی ظاهر و فونت</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
