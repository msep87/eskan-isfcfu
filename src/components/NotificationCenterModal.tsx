import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCheck,
  Trash2,
  X,
  MessageSquare,
  Megaphone,
  ClipboardList,
  Vote,
  Volume2,
  VolumeX,
  Smartphone,
  ShieldAlert,
  CheckCircle2,
  Send,
  AlertTriangle,
  ArrowRight,
  Archive,
} from 'lucide-react';
import {
  AppNotificationCategory,
  AppNotificationItem,
  NotificationPreferences,
  dispatchOSNotification,
  isIOSDevice,
  isRunningStandalonePWA,
  playNotificationChime,
} from '../utils/notificationManager';
import { Announcement, RoomWarning } from '../types';
import { RichTextDisplay } from './RichTextEditor';
import { AnnouncementImageBox } from './ImageLightboxModal';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission: NotificationPermission | 'unsupported';
  prefs: NotificationPreferences;
  notifications: AppNotificationItem[];
  announcements?: Announcement[];
  warnings?: RoomWarning[];
  onOpenImagePreview?: (src: string) => void;
  selectedItem?: AppNotificationItem | null;
  onClearSelectedItem?: () => void;
  onRequestPermission: () => Promise<NotificationPermission | 'unsupported'>;
  onUpdatePrefs: (next: NotificationPreferences) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onNotificationClick: (item: AppNotificationItem) => void;
}

const CATEGORY_META: Record<
  AppNotificationCategory,
  { label: string; colorClass: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  message: {
    label: 'پیام و تیکت',
    colorClass: 'bg-teal-100 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300',
    Icon: MessageSquare,
  },
  announcement: {
    label: 'اطلاعیه',
    colorClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300',
    Icon: Megaphone,
  },
  warning: {
    label: 'تذکر و اخطار',
    colorClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300',
    Icon: AlertTriangle,
  },
  survey: {
    label: 'نظرسنجی',
    colorClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300',
    Icon: ClipboardList,
  },
  election: {
    label: 'انتخابات',
    colorClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
    Icon: Vote,
  },
  system: {
    label: 'سامانه',
    colorClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    Icon: Bell,
  },
};

function formatShortFaTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('fa-IR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  permission,
  prefs,
  notifications,
  announcements = [],
  warnings = [],
  onOpenImagePreview,
  selectedItem = null,
  onClearSelectedItem,
  onRequestPermission,
  onUpdatePrefs,
  onMarkAllRead,
  onClearAll,
  onNotificationClick,
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'settings'>('feed');
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [viewingItem, setViewingItem] = useState<AppNotificationItem | null>(selectedItem);
  const [showReadArchive, setShowReadArchive] = useState(false);

  React.useEffect(() => {
    if (selectedItem) {
      setViewingItem(selectedItem);
      setActiveTab('feed');
    } else if (!isOpen) {
      setViewingItem(null);
    }
  }, [selectedItem, isOpen]);

  if (!isOpen) return null;

  const isIOS = isIOSDevice();
  const isStandalone = isRunningStandalonePWA();
  const needsIOSInstall = isIOS && !isStandalone && permission === 'unsupported';
  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);
  const unreadCount = unreadNotifications.length;

  const handleEnableClick = async () => {
    setRequesting(true);
    setStatusFeedback(null);
    try {
      const res = await onRequestPermission();
      if (res === 'granted') {
        setStatusFeedback('نوتیفیکیشن فوری با موفقیت روی دستگاه شما فعال شد.');
        if (prefs.soundEnabled) playNotificationChime();
        await dispatchOSNotification({
          title: 'اعلان‌های سامانه جامع خدمات دانشجویی فعال شد',
          body: 'از این پس پیام‌ها، اطلاعیه‌ها، نظرسنجی‌ها و انتخابات جدید بلافاصله روی گوشی شما نمایش داده می‌شوند.',
          tag: 'cfuis-welcome-notif',
          category: 'system',
        });
      } else if (res === 'denied') {
        setStatusFeedback(
          'دسترسی اعلان مسدود شده است. لطفاً از تنظیمات مرورگر یا تنظیمات برنامه در گوشی، گزینه Notifications را روی Allow قرار دهید.'
        );
      } else {
        setStatusFeedback('درخواست مجوز اعلان تأیید نشد. هر زمان خواستید می‌توانید مجدداً تلاش کنید.');
      }
    } finally {
      setRequesting(false);
    }
  };

  const handleTestNotification = async () => {
    if (prefs.soundEnabled) playNotificationChime();
    const sent = await dispatchOSNotification({
      title: 'اعلان آزمایشی سامانه جامع خدمات دانشجویی',
      body: 'سیستم نوتیفیکیشن گوشی شما به درستی فعال است و اعلان‌های جدید را دریافت خواهید کرد.',
      tag: `cfuis-test-${Date.now()}`,
      category: 'system',
    });
    setStatusFeedback(
      sent
        ? 'نوتیفیکیشن آزمایشی ارسال شد؛ باید همین لحظه روی نوار اعلان دستگاه شما ظاهر شده باشد.'
        : 'امکان ارسال نوتیفیکیشن سیستم وجود نداشت. لطفاً وضعیت مجوز اعلان را بررسی کنید.'
    );
  };

  const togglePref = (key: keyof NotificationPreferences) => {
    onUpdatePrefs({ ...prefs, [key]: !prefs[key] });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[88dvh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* هدر مودال */}
        <div className="px-5 py-4 bg-gradient-to-l from-teal-700 via-teal-600 to-cyan-600 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-white/20 backdrop-blur-xs">
              <BellRing className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">
                مرکز اعلان‌ها و نوتیفیکیشن گوشی
              </h3>
              <p className="text-[11px] text-teal-100">
                دریافت فوری پیام‌ها، اطلاعیه‌ها، نظرسنجی‌ها و انتخابات
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 transition cursor-pointer"
            aria-label="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* وضعیت مجوز نوتیفیکیشن سیستم */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-2.5 shrink-0">
          {permission === 'granted' ? (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>نوتیفیکیشن روی این دستگاه فعال است</span>
              </div>
              <button
                type="button"
                onClick={() => void handleTestNotification()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ارسال اعلان آزمایشی</span>
              </button>
            </div>
          ) : needsIOSInstall ? (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2 font-extrabold">
                <Smartphone className="w-4 h-4 text-amber-600 shrink-0" />
                <span>نکته ویژه گوشی‌های آیفون (iOS)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                در آیفون برای روشن کردن نوتیفیکیشن، ابتدا سامانه را از دکمه{' '}
                <strong>Share → Add to Home Screen</strong> روی صفحه اصلی گوشی نصب کنید و سپس
                اپلیکیشن را از آیکون صفحه اصلی باز کرده و نوتیفیکیشن را فعال نمایید.
              </p>
            </div>
          ) : permission === 'denied' ? (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 space-y-1.5 text-xs text-rose-900 dark:text-rose-200">
              <div className="flex items-center gap-2 font-extrabold">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>نوتیفیکیشن در مرورگر یا گوشی مسدود شده است</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                برای دریافت فوری پیام‌ها و اطلاعیه‌ها، روی آیکون قفل/تنظیمات کنار آدرس سایت (یا
                تنظیمات اپلیکیشن در گوشی ← Notifications) بزنید و مجوز اعلان را روی{' '}
                <strong>Allow (مجاز)</strong> قرار دهید.
              </p>
            </div>
          ) : permission === 'default' ? (
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/70">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-extrabold text-teal-900 dark:text-teal-100">
                  نوتیفیکیشن گوشی هنوز روشن نشده است
                </div>
                <div className="text-[11px] text-teal-700 dark:text-teal-300 mt-0.5">
                  با فعال‌سازی اعلان، پیام‌ها، اطلاعیه‌ها، نظرسنجی‌ها و انتخابات را فوری دریافت کنید.
                </div>
              </div>
              <button
                type="button"
                disabled={requesting}
                onClick={() => void handleEnableClick()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold transition cursor-pointer shadow-sm disabled:opacity-60 shrink-0"
              >
                <BellRing className="w-4 h-4" />
                <span>{requesting ? 'در حال درخواست...' : 'روشن کردن نوتیفیکیشن'}</span>
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <BellOff className="w-4 h-4 shrink-0" />
              <span>
                مرورگر فعلی از اعلان سیستمی پشتیبانی نمی‌کند؛ اما اعلان‌های داخل برنامه همچنان برای شما
                نمایش داده می‌شوند.
              </span>
            </div>
          )}

          {statusFeedback && (
            <div className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-indigo-800 dark:text-indigo-200">
              {statusFeedback}
            </div>
          )}

          {/* تب‌ها */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('feed')}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'feed'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              اعلان‌های اخیر {unreadCount > 0 ? `(${unreadCount})` : ''}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              تنظیمات دریافت اعلان‌ها
            </button>
          </div>
        </div>

        {/* بدنه اسکرول‌شونده */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {activeTab === 'feed' ? (
            viewingItem ? (
              (() => {
                const meta = CATEGORY_META[viewingItem.category] || CATEGORY_META.system;
                const IconComp = meta.Icon;
                const matchedAnnouncement =
                  viewingItem.category === 'announcement' && viewingItem.itemId
                    ? announcements.find((a) => a.id === viewingItem.itemId)
                    : undefined;
                const matchedWarning =
                  viewingItem.category === 'warning' && viewingItem.itemId
                    ? warnings.find((w) => w.id === viewingItem.itemId)
                    : undefined;

                const handleBackToList = () => {
                  setViewingItem(null);
                  onClearSelectedItem?.();
                };

                const handleCloseAndReturn = () => {
                  setViewingItem(null);
                  onClearSelectedItem?.();
                  onClose();
                };

                return (
                  <div className="space-y-3.5 animate-in fade-in duration-150">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleBackToList}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold transition cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>بازگشت به اعلان‌ها</span>
                      </button>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>خوانده شد و از اعلان‌های جدید خارج گردید</span>
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl shrink-0 ${meta.colorClass}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${meta.colorClass}`}>
                              {meta.label}
                            </span>
                            {matchedAnnouncement?.priority === 'urgent' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white">
                                فوری
                              </span>
                            )}
                            {matchedAnnouncement?.priority === 'important' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-slate-950">
                                مهم
                              </span>
                            )}
                            {matchedWarning && (
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                  matchedWarning.severity === 'critical'
                                    ? 'bg-rose-600 text-white'
                                    : matchedWarning.severity === 'warning'
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'bg-sky-600 text-white'
                                }`}
                              >
                                {matchedWarning.severity === 'critical'
                                  ? 'اخطار فوری'
                                  : matchedWarning.severity === 'warning'
                                  ? 'اخطار'
                                  : 'تذکر'}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              {matchedAnnouncement?.date ||
                                matchedWarning?.date ||
                                formatShortFaTime(viewingItem.createdAt)}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-sm sm:text-[15px] text-slate-900 dark:text-white mt-1.5 leading-snug">
                            {matchedAnnouncement?.title || matchedWarning?.title || viewingItem.title}
                          </h4>
                          {(matchedAnnouncement?.author || matchedWarning?.supervisorName) && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              صادرکننده: {matchedAnnouncement?.author || matchedWarning?.supervisorName}
                            </p>
                          )}
                        </div>
                      </div>

                      {matchedAnnouncement?.imageUrl && (
                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                          <AnnouncementImageBox
                            src={matchedAnnouncement.imageUrl}
                            alt={matchedAnnouncement.title}
                            onZoom={() => onOpenImagePreview?.(matchedAnnouncement.imageUrl!)}
                          />
                        </div>
                      )}

                      <div className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                        {matchedAnnouncement?.contentHtml ? (
                          <RichTextDisplay
                            html={matchedAnnouncement.contentHtml}
                            fallbackText={matchedAnnouncement.content}
                          />
                        ) : (
                          <p className="whitespace-pre-wrap">
                            {matchedAnnouncement?.content ||
                              matchedWarning?.description ||
                              viewingItem.fullBody ||
                              viewingItem.body}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* نوار دکمه‌های بازگشت و بستن در پایین صفحه اعلان */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleBackToList}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold transition cursor-pointer"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>بازگشت به فهرست اعلان‌ها</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseAndReturn}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-xs transition cursor-pointer"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>بستن و بازگشت به صفحه</span>
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
            <>
              {(unreadNotifications.length > 0 || readNotifications.length > 0) && (
                <div className="flex items-center justify-between gap-2 pb-1">
                  {unreadNotifications.length > 0 ? (
                    <button
                      type="button"
                      onClick={onMarkAllRead}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>خوانده‌شده کردن و خروج همه ({unreadNotifications.length.toLocaleString('fa-IR')})</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      همه اعلان‌ها خوانده شده‌اند
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowReadArchive(false);
                      onClearAll();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>پاک کردن تاریخچه</span>
                  </button>
                </div>
              )}

              {unreadNotifications.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Bell className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                    اعلان خوانده‌نشده‌ای وجود ندارد
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                    به محض انتشار اطلاعیه، پیام، تذکر، نظرسنجی یا انتخابات جدید، اعلان آن اینجا
                    ظاهر می‌شود و با مشاهده، به‌صورت خودکار خوانده‌شده و از لیست خارج می‌گردد.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {unreadNotifications.map((item) => {
                    const meta = CATEGORY_META[item.category] || CATEGORY_META.system;
                    const IconComp = meta.Icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onNotificationClick(item);
                          if (item.category !== 'message') {
                            setViewingItem(item);
                          }
                        }}
                        className="w-full text-right p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 bg-teal-50/60 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800/80 hover:bg-teal-50 dark:hover:bg-teal-950/50"
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${meta.colorClass}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                              {item.title}
                            </span>
                            <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {item.body}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className={`px-1.5 py-0.5 rounded-md font-bold ${meta.colorClass}`}>
                              {meta.label}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="text-teal-600 dark:text-teal-400 font-bold">مشاهده ←</span>
                              <span>{formatShortFaTime(item.createdAt)}</span>
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* آرشیو اختیاری اعلان‌های خوانده‌شده (جمع‌شده به‌صورت پیش‌فرض) */}
              {readNotifications.length > 0 && (
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowReadArchive((prev) => !prev)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center justify-between cursor-pointer transition"
                  >
                    <span className="flex items-center gap-1.5">
                      <Archive className="w-3.5 h-3.5 text-slate-400" />
                      <span>آرشیو اعلان‌های خوانده‌شده ({readNotifications.length.toLocaleString('fa-IR')})</span>
                    </span>
                    <span>{showReadArchive ? 'بستن' : 'نمایش'}</span>
                  </button>

                  {showReadArchive && (
                    <div className="mt-2 space-y-1.5">
                      {readNotifications.map((item) => {
                        const meta = CATEGORY_META[item.category] || CATEGORY_META.system;
                        const IconComp = meta.Icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              if (item.category === 'message') {
                                onNotificationClick(item);
                              } else {
                                setViewingItem(item);
                              }
                            }}
                            className="w-full text-right p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer flex items-start gap-2.5 opacity-80 hover:opacity-100"
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 ${meta.colorClass}`}>
                              <IconComp className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">
                                {item.title}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                                <span>{meta.label} · خوانده‌شده</span>
                                <span>{formatShortFaTime(item.createdAt)}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
            )
          ) : (
            <div className="space-y-2.5">
              {(
                [
                  {
                    key: 'enabled' as const,
                    title: 'فعال بودن کلی نوتیفیکیشن‌ها',
                    desc: 'نمایش اعلان‌های فوری روی گوشی و داخل سامانه',
                    Icon: BellRing,
                  },
                  {
                    key: 'messages' as const,
                    title: 'پیام‌ها و پاسخ‌های جدید',
                    desc: 'هنگام دریافت پیام یا پاسخ تازه در صندوق پیام‌ها و تیکت‌ها',
                    Icon: MessageSquare,
                  },
                  {
                    key: 'announcements' as const,
                    title: 'اطلاعیه‌های جدید و فوری',
                    desc: 'هنگام انتشار اطلاعیه عمومی یا ویژه خوابگاه شما',
                    Icon: Megaphone,
                  },
                  {
                    key: 'surveys' as const,
                    title: 'نظرسنجی‌های جدید',
                    desc: 'هنگام فعال شدن نظرسنجی دوره‌ای جدید برای دانشجویان',
                    Icon: ClipboardList,
                  },
                  {
                    key: 'elections' as const,
                    title: 'انتخابات و آغاز رأی‌گیری',
                    desc: 'هنگام ثبت انتخابات جدید یا باز شدن پنجره رأی‌گیری',
                    Icon: Vote,
                  },
                  {
                    key: 'soundEnabled' as const,
                    title: 'پخش صدای ملایم اعلان',
                    desc: 'پخش زنگ کوتاه هنگام ورود اعلان جدید در محیط سامانه',
                    Icon: prefs.soundEnabled ? Volume2 : VolumeX,
                  },
                ] as const
              ).map(({ key, title, desc, Icon }) => {
                const active = prefs[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePref(key)}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition cursor-pointer text-right"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          active
                            ? 'bg-teal-100 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300'
                            : 'bg-slate-200/80 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{desc}</div>
                      </div>
                    </div>
                    <div
                      className={`w-10 h-6 rounded-full p-0.5 transition shrink-0 flex items-center ${
                        active ? 'bg-teal-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-white shadow-xs block" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
