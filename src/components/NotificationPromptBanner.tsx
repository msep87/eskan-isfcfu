import React, { useState } from 'react';
import {
  BellRing,
  X,
  MessageSquare,
  Megaphone,
  ClipboardList,
  Vote,
  Bell,
  Smartphone,
  AlertTriangle,
} from 'lucide-react';
import {
  AppNotificationItem,
  isIOSDevice,
  isRunningStandalonePWA,
} from '../utils/notificationManager';

interface NotificationPromptBannerProps {
  visible: boolean;
  permission: NotificationPermission | 'unsupported';
  onEnable: () => Promise<NotificationPermission | 'unsupported'>;
  onSnooze: () => void;
  onOpenSettings: () => void;
}

export const NotificationPromptBanner: React.FC<NotificationPromptBannerProps> = ({
  visible,
  permission,
  onEnable,
  onSnooze,
  onOpenSettings,
}) => {
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  const isIOS = isIOSDevice();
  const isStandalone = isRunningStandalonePWA();
  const needsIOSInstall = isIOS && !isStandalone && permission === 'unsupported';

  const handleEnable = async () => {
    if (needsIOSInstall) {
      onOpenSettings();
      return;
    }
    setLoading(true);
    try {
      await onEnable();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-l from-indigo-600 via-teal-600 to-cyan-600 text-white border-b border-white/15 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs shrink-0">
            {needsIOSInstall ? (
              <Smartphone className="w-4 h-4 text-amber-200" />
            ) : (
              <BellRing className="w-4 h-4 text-amber-200 animate-bounce" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-extrabold leading-snug">
              {needsIOSInstall
                ? 'برای دریافت نوتیفیکیشن فوری در آیفون، اپلیکیشن را روی صفحه اصلی نصب کنید'
                : 'دریافت فوری پیام‌ها، اطلاعیه‌ها، نظرسنجی‌ها و انتخابات روی گوشی شما'}
            </div>
            <div className="text-[11px] text-teal-100 leading-snug hidden sm:block">
              {needsIOSInstall
                ? 'پس از افزودن به صفحه اصلی (Add to Home Screen)، امکان روشن کردن نوتیفیکیشن فوری فعال می‌شود.'
                : 'برای اطلاع لحظه‌ای از پیام‌های جدید و اطلاعیه‌های مهم دانشگاه، نوتیفیکیشن را روشن نمایید.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleEnable()}
            className="px-3.5 py-1.5 rounded-xl bg-white text-teal-800 hover:bg-amber-50 text-xs font-black shadow-xs transition cursor-pointer disabled:opacity-60"
          >
            {needsIOSInstall
              ? 'راهنمای فعال‌سازی آیفون'
              : loading
              ? 'در حال فعال‌سازی...'
              : 'روشن کردن نوتیفیکیشن'}
          </button>
          <button
            type="button"
            onClick={onSnooze}
            className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold transition cursor-pointer"
          >
            فعلاً نه
          </button>
        </div>
      </div>
    </div>
  );
};

interface LiveNotificationToastsProps {
  toasts: AppNotificationItem[];
  onDismiss: (id: string) => void;
  onClickToast: (item: AppNotificationItem) => void;
  autoDismissMs?: number;
}

interface ToastItemCardProps {
  toast: AppNotificationItem;
  autoDismissMs: number;
  onDismiss: (id: string) => void;
  onClickToast: (item: AppNotificationItem) => void;
}

const ToastItemCard: React.FC<ToastItemCardProps> = ({
  toast,
  autoDismissMs,
  onDismiss,
  onClickToast,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const remainingRef = React.useRef(autoDismissMs);
  const startedAtRef = React.useRef(Date.now());
  const exitTimerRef = React.useRef<number | null>(null);

  const triggerExit = React.useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    exitTimerRef.current = window.setTimeout(() => {
      onDismiss(toast.id);
    }, 320);
  }, [isExiting, onDismiss, toast.id]);

  React.useEffect(() => {
    if (isExiting || isPaused) return;
    startedAtRef.current = Date.now();
    const timer = window.setTimeout(() => {
      triggerExit();
    }, Math.max(200, remainingRef.current));

    return () => {
      window.clearTimeout(timer);
      const elapsed = Date.now() - startedAtRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    };
  }, [isExiting, isPaused, triggerExit]);

  React.useEffect(() => {
    return () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  const getVisuals = (category: AppNotificationItem['category']) => {
    switch (category) {
      case 'message':
        return {
          icon: <MessageSquare className="w-4 h-4 text-teal-600 dark:text-teal-300" />,
          iconBg: 'bg-teal-50 dark:bg-teal-950/60',
          border: 'border-teal-200/90 dark:border-teal-800/80',
          bar: 'bg-teal-500',
        };
      case 'announcement':
        return {
          icon: <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-300" />,
          iconBg: 'bg-amber-50 dark:bg-amber-950/60',
          border: 'border-amber-200/90 dark:border-amber-800/80',
          bar: 'bg-amber-500',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-300" />,
          iconBg: 'bg-rose-50 dark:bg-rose-950/60',
          border: 'border-rose-200/90 dark:border-rose-800/80',
          bar: 'bg-rose-500',
        };
      case 'survey':
        return {
          icon: <ClipboardList className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />,
          iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
          border: 'border-indigo-200/90 dark:border-indigo-800/80',
          bar: 'bg-indigo-500',
        };
      case 'election':
        return {
          icon: <Vote className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />,
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
          border: 'border-emerald-200/90 dark:border-emerald-800/80',
          bar: 'bg-emerald-500',
        };
      default:
        return {
          icon: <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />,
          iconBg: 'bg-slate-100 dark:bg-slate-800',
          border: 'border-slate-200/90 dark:border-slate-700',
          bar: 'bg-teal-500',
        };
    }
  };

  const visuals = getVisuals(toast.category);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border ${visuals.border} shadow-2xl transition-shadow hover:shadow-teal-900/15 ${
        isExiting ? 'toast-exit' : 'toast-enter'
      }`}
    >
      <div className="p-3.5 flex items-start gap-2.5">
        <button
          type="button"
          onClick={() => {
            onClickToast(toast);
            triggerExit();
          }}
          className="flex items-start gap-2.5 text-right flex-1 min-w-0 cursor-pointer"
        >
          <div className={`p-2 rounded-xl shrink-0 ${visuals.iconBg}`}>{visuals.icon}</div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
              {toast.title}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
              {toast.body}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={triggerExit}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
          aria-label="بستن اعلان"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* نوار پیشرفت محو شدن خودکار */}
      <div className="h-[3px] w-full bg-slate-100 dark:bg-slate-800/80">
        <div
          className={`h-full w-full ${visuals.bar} toast-progress`}
          style={
            {
              '--toast-duration': `${autoDismissMs}ms`,
              animationPlayState: isPaused ? 'paused' : 'running',
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
};

export const LiveNotificationToasts: React.FC<LiveNotificationToastsProps> = ({
  toasts,
  onDismiss,
  onClickToast,
  autoDismissMs = 6800,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-16 sm:top-24 left-3 sm:left-5 z-50 w-[min(92vw,370px)] space-y-2.5 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastItemCard
          key={toast.id}
          toast={toast}
          autoDismissMs={autoDismissMs}
          onDismiss={onDismiss}
          onClickToast={onClickToast}
        />
      ))}
    </div>
  );
};
