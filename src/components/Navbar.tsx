import React from 'react';
import { CurrentUser, AppSettings, RoomWarning, Message } from '../types';
import { FarhangianEmblem } from './FarhangianEmblem';
import {
  User,
  LogOut,
  Palette,
  BarChart3,
  MessageSquare,
  KeyRound,
  School,
  Info,
  BookOpen,
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
  onOpenAbout: () => void;
  onOpenUserGuide: () => void;
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
  onOpenAbout,
  onOpenUserGuide,
}) => {
  // تعداد پیام‌های خوانده‌نشده
  const pendingMessagesCount = messages.filter((m) => {
    if (currentUser?.role === 'student') {
      return m.senderId === currentUser.student.studentId && m.replies.length > 0;
    }
    if (currentUser?.role === 'maintenance') {
      return m.category === 'maintenance' && m.status !== 'answered';
    }
    return m.status === 'pending';
  }).length;

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* لوگو و نام دانشگاه فرهنگیان اصفهان */}
          <div
            onClick={onNavigateHome}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {settings.customLogoUrl ? (
              <div className="bg-white p-1 rounded-xl shadow-xs border border-slate-200/80 shrink-0">
                <FarhangianEmblem size={38} customLogoUrl={settings.customLogoUrl} className="group-hover:scale-105 transition" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shrink-0">
                <School className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                  سامانه جامع سراهای دانشجویی
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded-full border border-teal-200 dark:border-teal-800">
                  دانشگاه فرهنگیان ({settings.currentAcademicYear || '۱۴۰۵-۱۴۰۶'})
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                مدیریت اسکان، انتخاب اتاق، شیفت‌بندی، انبار و خدمات سراها
              </p>
            </div>
          </div>

          {/* ابزارها و اکشن‌های نوار بالا */}
          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* دکمه خیلی کوچک درباره ما */}
            <button
              onClick={onOpenAbout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 text-[11px] font-bold transition cursor-pointer shadow-xs"
              title="درباره سامانه جامع سراهای دانشجویی و سازنده سایت دکتر محمد سپیانی"
            >
              <Info className="w-3.5 h-3.5" />
              <span>درباره ما</span>
            </button>

            {/* دکمه راهنمای متنی و تصویری کاربری (PDF) */}
            <button
              onClick={onOpenUserGuide}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold transition cursor-pointer shadow-xs"
              title="دفترچه راهنمای جامع و مصور کاربری برای تمامی نقش‌ها همراه با دانلود PDF"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>راهنمای کاربری (PDF)</span>
            </button>

            {/* گزارش‌ها و آمار - برای کاربران لاگین شده */}
            {currentUser && (
              <button
                onClick={onOpenReports}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
                title="مشاهده آمار و گزارش‌های خوابگاه"
              >
                <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="hidden sm:inline">گزارش‌ها</span>
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
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>
                      {currentUser.role === 'student' && currentUser.student.fullName}
                      {currentUser.role === 'supervisor' && currentUser.supervisor.fullName}
                      {currentUser.role === 'maintenance' && currentUser.technician.fullName}
                      {currentUser.role === 'warehouse' && currentUser.staff.fullName}
                      {currentUser.role === 'admin' && 'مدیر امور خوابگاه‌ها'}
                    </span>
                    {currentUser.role === 'maintenance' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                        تکنسین فنی
                      </span>
                    )}
                    {currentUser.role === 'warehouse' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 font-bold">
                        انبار و کارپردازی
                      </span>
                    )}
                    {currentUser.role === 'student' && (
                      currentUser.student.isProfileCompleted ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                          پرونده تکمیل
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold animate-pulse">
                          پرونده ناقص
                        </span>
                      )
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {currentUser.role === 'student' && `کد دانشجویی: ${currentUser.student.studentId}`}
                    {currentUser.role === 'supervisor' && 'سرپرست سرا'}
                    {currentUser.role === 'maintenance' && `امور تأسیسات (${currentUser.technician.specialty || 'تکنسین'})`}
                    {currentUser.role === 'warehouse' && 'مسئول انبار و تجهیزات'}
                    {currentUser.role === 'admin' && 'مدیر کل سامانه'}
                  </div>
                </div>

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
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>ورود به سامانه</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
