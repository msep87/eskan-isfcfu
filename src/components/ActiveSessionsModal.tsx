import React, { useState } from 'react';
import {
  Monitor,
  Smartphone,
  Tablet,
  X,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Power,
  AlertTriangle,
} from 'lucide-react';
import { ActiveUserSession } from '../utils/realtimePresence';

interface ActiveSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ActiveUserSession[];
  autoCloseOtherSessions: boolean;
  onToggleAutoCloseOtherSessions: (next: boolean) => void;
  onTerminateSession: (sessionId: string) => Promise<void>;
  onTerminateAllOtherSessions: () => Promise<void>;
}

function formatSessionTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fa-IR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'هم‌اکنون';
  }
}

export const ActiveSessionsModal: React.FC<ActiveSessionsModalProps> = ({
  isOpen,
  onClose,
  sessions,
  autoCloseOtherSessions,
  onToggleAutoCloseOtherSessions,
  onTerminateSession,
  onTerminateAllOtherSessions,
}) => {
  const [closingId, setClosingId] = useState<string | null>(null);
  const [closingAll, setClosingAll] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  const handleCloseOne = async (sessionId: string) => {
    setClosingId(sessionId);
    setFeedback(null);
    try {
      await onTerminateSession(sessionId);
      setFeedback('دستور خروج فوری به نشست انتخاب‌شده ارسال شد و آن نشست بسته گردید.');
    } finally {
      setClosingId(null);
    }
  };

  const handleCloseAllOthers = async () => {
    setClosingAll(true);
    setFeedback(null);
    try {
      await onTerminateAllOtherSessions();
      setFeedback('تمامی نشست‌های فعال در سایر دستگاه‌ها و تب‌ها با موفقیت بسته شدند.');
    } finally {
      setClosingAll(false);
    }
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
        {/* هدر */}
        <div className="px-5 py-4 bg-gradient-to-l from-slate-900 via-slate-800 to-teal-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-white/15">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">
                نشست‌های فعال و امنیت حساب کاربری
              </h3>
              <p className="text-[11px] text-slate-300">
                مشاهده و بستن از راه دور سیستم‌ها و مرورگرهای متصل به حساب شما
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

        {/* بدنه */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* سوئیچ بستن خودکار نشست‌های دیگر هنگام ورود جدید */}
          <button
            type="button"
            onClick={() => onToggleAutoCloseOtherSessions(!autoCloseOtherSessions)}
            className="w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-teal-200/80 dark:border-teal-800/70 bg-teal-50/70 dark:bg-teal-950/30 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition cursor-pointer text-right"
          >
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-teal-950 dark:text-teal-100">
                بستن خودکار نشست‌های قبلی هنگام ورود جدید
              </div>
              <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 mt-0.5 leading-relaxed">
                در صورت فعال بودن، هر زمان از سیستم یا گوشی جدیدی وارد حساب خود شوید، کارتابل بازشده در سیستم‌های قبلی به‌صورت خودکار بسته می‌شود.
              </p>
            </div>
            <div
              className={`w-11 h-6 rounded-full p-0.5 transition shrink-0 flex items-center ${
                autoCloseOtherSessions
                  ? 'bg-teal-600 justify-end'
                  : 'bg-slate-300 dark:bg-slate-700 justify-start'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-xs block" />
            </div>
          </button>

          {feedback && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* هشدار تعداد نشست‌های همزمان */}
          {otherSessions.length > 0 && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                حساب کاربری شما هم‌اکنون در{' '}
                <strong>{sessions.length.toLocaleString('fa-IR')} دستگاه/تب</strong> به‌صورت همزمان باز است. می‌توانید نشست‌های اضافی را همین الان ببندید.
              </div>
            </div>
          )}

          {/* فهرست نشست‌های فعال */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300">
              <span>دستگاه‌ها و نشست‌های فعال ({sessions.length.toLocaleString('fa-IR')})</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                پایش زنده
              </span>
            </div>

            {sessions.map((sess) => {
              const DeviceIcon =
                sess.deviceType === 'mobile'
                  ? Smartphone
                  : sess.deviceType === 'tablet'
                  ? Tablet
                  : Monitor;

              return (
                <div
                  key={sess.sessionId}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                    sess.isCurrent
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        sess.isCurrent
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : 'bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <DeviceIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {sess.deviceLabel}
                        </span>
                        {sess.isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                            این دستگاه (نشست فعلی)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        زمان ورود: {formatSessionTime(sess.loggedInAt)}
                      </div>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <button
                      type="button"
                      disabled={closingId === sess.sessionId || closingAll}
                      onClick={() => void handleCloseOne(sess.sessionId)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-[11px] font-extrabold shadow-xs transition cursor-pointer shrink-0"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{closingId === sess.sessionId ? 'در حال بستن...' : 'بستن نشست'}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* فوتر */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {otherSessions.length > 0 ? (
            <button
              type="button"
              disabled={closingAll}
              onClick={() => void handleCloseAllOthers()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
            >
              <Power className="w-4 h-4" />
              <span>
                {closingAll
                  ? 'در حال بستن نشست‌ها...'
                  : `بستن همه نشست‌های دیگر (${otherSessions.length.toLocaleString('fa-IR')})`}
              </span>
            </button>
          ) : (
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              فقط همین دستگاه به حساب شما متصل است
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-extrabold transition cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
