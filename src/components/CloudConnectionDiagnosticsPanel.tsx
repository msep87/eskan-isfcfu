import React, { useEffect, useState, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Cloud,
  Database,
  HardDrive,
  Loader2,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  UploadCloud,
  Wifi,
  WifiOff,
  XCircle,
} from 'lucide-react';
import {
  CloudDiagnosticReport,
  CloudLiveMetrics,
  LocalCloudPayloadSummary,
  Storage,
} from '../utils/storage';

interface CloudConnectionDiagnosticsPanelProps {
  onRefreshData?: () => void;
}

function formatBytesFa(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '۰ بایت';
  if (bytes < 1024) return `${Math.round(bytes).toLocaleString('fa-IR')} بایت`;
  if (bytes < 1024 * 1024) {
    return `${(Math.round((bytes / 1024) * 10) / 10).toLocaleString('fa-IR')} کیلوبایت`;
  }
  return `${(Math.round((bytes / (1024 * 1024)) * 100) / 100).toLocaleString('fa-IR')} مگابایت`;
}

export const CloudConnectionDiagnosticsPanel: React.FC<CloudConnectionDiagnosticsPanelProps> = ({
  onRefreshData,
}) => {
  const [liveMetrics, setLiveMetrics] = useState<CloudLiveMetrics>(() =>
    Storage.getCloudLiveMetrics()
  );
  const [localAudit, setLocalAudit] = useState<LocalCloudPayloadSummary>(() =>
    Storage.getLocalCloudPayloadSummary()
  );
  const [report, setReport] = useState<CloudDiagnosticReport | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagStepText, setDiagStepText] = useState<string | null>(null);
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(false);
  const [latencyHistory, setLatencyHistory] = useState<Array<{ time: string; ms: number; ok: boolean }>>([]);
  const [actionBusy, setActionBusy] = useState<'push' | 'pull' | 'retry' | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    ok: boolean;
    text: string;
    details?: string[];
  } | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const unsub = Storage.subscribeCloudMetrics((snap) => {
      if (!isMountedRef.current) return;
      setLiveMetrics(snap);
      setLocalAudit(Storage.getLocalCloudPayloadSummary());
    });
    return () => {
      isMountedRef.current = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!isLiveMonitoring) return;
    let active = true;

    const runPulse = async () => {
      const res = await Storage.pollCloudLiveHealth();
      if (!active || !isMountedRef.current) return;
      const nowLabel = new Date().toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLatencyHistory((prev) => [
        ...prev.slice(-15),
        { time: nowLabel, ms: res.latencyMs, ok: res.ok },
      ]);
      setLocalAudit(Storage.getLocalCloudPayloadSummary());
    };

    void runPulse();
    const timer = setInterval(() => {
      void runPulse();
    }, 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [isLiveMonitoring]);

  const handleRunFullDiagnostics = async () => {
    if (isDiagnosing) return;
    setIsDiagnosing(true);
    setActionMessage(null);
    setDiagStepText('در حال شروع بررسی کامل سرور ابری، دیتابیس و ترافیک...');
    try {
      const result = await Storage.runCloudDiagnostics((step) => {
        if (isMountedRef.current) setDiagStepText(step);
      });
      if (!isMountedRef.current) return;
      setReport(result);
      setLocalAudit(result.localSummary);
      const healthCheck = result.checks.find((c) => c.id === 'api_and_db_health');
      if (healthCheck && typeof healthCheck.latencyMs === 'number') {
        setLatencyHistory((prev) => [
          ...prev.slice(-15),
          {
            time: result.checkedAt,
            ms: healthCheck.latencyMs!,
            ok: result.serverHealthy,
          },
        ]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsDiagnosing(false);
        setDiagStepText(null);
      }
    }
  };

  const handlePushAllToCloud = async () => {
    if (actionBusy || isDiagnosing) return;
    setActionBusy('push');
    setActionMessage(null);
    setDiagStepText('در حال آماده‌سازی انتقال کامل تمام داده‌ها، کاربران و تنظیمات به سرور ابری و دیتابیس...');
    try {
      const res = await Storage.syncAllToCloudDetailed((msg) => {
        if (isMountedRef.current) setDiagStepText(msg);
      });
      if (!isMountedRef.current) return;
      setLocalAudit(Storage.getLocalCloudPayloadSummary());

      const summaryDetails: string[] = [
        `جداول همگام‌سازی‌شده: ${res.syncedCount.toLocaleString('fa-IR')} از ${res.totalCount.toLocaleString('fa-IR')} جدول سامانه`,
        `تنظیمات عمومی، لوگو، فونت‌ها و ظاهر سایت: ${res.settingsSynced ? 'منتقل و ثبت شد' : 'نیاز به بررسی'}`,
        `هم‌ترازی جدول دانشجویان در Supabase: ${
          res.studentsMirroredCount > 0
            ? `${res.studentsMirroredCount.toLocaleString('fa-IR')} پرونده (${res.studentsMirrorOk ? 'کامل و موفق' : 'دارای خطا در بخشی از دسته‌ها'})`
            : 'بدون رکورد دانشجو'
        }`,
        `حجم کل منتقل‌شده: ${formatBytesFa(res.totalBytesSent)}${
          res.latestRevision !== null ? ` | آخرین ثبت: ${String(res.latestRevision).slice(0, 19).replace('T', ' ')}` : ''
        }`,
      ];

      if (res.ok) {
        setActionMessage({
          ok: true,
          text: `وضعیت فعلی تمام داده‌ها و تنظیمات سامانه با موفقیت به پایگاه داده ابری Supabase منتقل و ثبت شد؛ از این لحظه در تمام سیستم‌ها قابل مشاهده است.`,
          details: summaryDetails,
        });
      } else {
        const errParts: string[] = [];
        if (res.oversizedKeys.length > 0) {
          errParts.push(
            `${res.oversizedKeys.length.toLocaleString('fa-IR')} جدول بیش از حد مجاز`
          );
        }
        const otherErrs = Math.max(0, res.failedKeys.length - res.oversizedKeys.length);
        if (otherErrs > 0) {
          errParts.push(`${otherErrs.toLocaleString('fa-IR')} جدول دچار خطای شبکه/سرور`);
        }
        if (!res.studentsMirrorOk) {
          errParts.push('بخش کالکشن دانشجویان دچار خطای ارسال شد');
        }
        if (res.failedKeys.length > 0) {
          summaryDetails.push(
            `جداول ناموفق: ${res.failedKeys.map((k) => Storage.getFriendlySyncKeyLabel(k)).join('، ')}`
          );
        }
        setActionMessage({
          ok: false,
          text: `${res.syncedCount.toLocaleString('fa-IR')} از ${res.totalCount.toLocaleString('fa-IR')} جدول منتقل شد، اما ${errParts.join(' و ')}.`,
          details: summaryDetails,
        });
      }
      if (report) {
        await handleRunFullDiagnostics();
      }
    } finally {
      if (isMountedRef.current) {
        setActionBusy(null);
        setDiagStepText(null);
      }
    }
  };

  const handleRetryFailedQueue = async () => {
    if (actionBusy || isDiagnosing) return;
    setActionBusy('retry');
    setActionMessage(null);
    setDiagStepText('در حال ارسال مجدد جداول معوق در صف خطا به سرور ابری...');
    try {
      const res = await Storage.retryFailedCloudQueueNow();
      if (!isMountedRef.current) return;
      if (res.success) {
        setActionMessage({
          ok: true,
          text: 'تمام تغییرات معوق با موفقیت به سرور ابری و دیتابیس ارسال و ثبت شدند.',
        });
      } else {
        setActionMessage({
          ok: false,
          text: `تلاش مجدد انجام شد اما ${res.failedKeys.length.toLocaleString('fa-IR')} جدول هنوز ارسال نشده است: ${res.failedKeys
            .map((k) => Storage.getFriendlySyncKeyLabel(k))
            .join('، ')}`,
        });
      }
    } finally {
      if (isMountedRef.current) {
        setActionBusy(null);
        setDiagStepText(null);
      }
    }
  };

  const handlePullFromCloud = async () => {
    if (actionBusy || isDiagnosing) return;
    setActionBusy('pull');
    setActionMessage(null);
    setDiagStepText('در حال دریافت اجباری آخرین داده‌ها و تنظیمات از سرور ابری...');
    try {
      const changed = await Storage.syncFromCloud({ force: true });
      if (!isMountedRef.current) return;
      onRefreshData?.();
      if (changed) {
        setActionMessage({
          ok: true,
          text: 'آخرین داده‌ها و تنظیمات از سرور ابری دریافت و در سامانه اعمال شدند.',
        });
      } else {
        setActionMessage({
          ok: true,
          text: 'بررسی اجباری کامل انجام شد؛ داده‌های مرورگر شما با آخرین نسخه سرور کاملاً یکسان است.',
        });
      }
    } finally {
      if (isMountedRef.current) {
        setActionBusy(null);
        setDiagStepText(null);
      }
    }
  };

  const successRate =
    liveMetrics.totalRequests > 0
      ? Math.round((liveMetrics.successfulRequests / liveMetrics.totalRequests) * 100)
      : 100;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
      {/* سرصفحه و دکمه‌های اصلی */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-600 text-white shadow-sm shrink-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                بررسی اتصال سرور ابری، پایگاه داده و گزارش زنده ترافیک
              </h3>
              {isLiveMonitoring && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>پایش زنده آنلاین فعال</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              بررسی کامل ارتباط مرورگر با پایگاه داده ابری Supabase (PostgreSQL) و فضای تصاویر avatars، سرعت انتقال داده، وضعیت جداول همگام‌سازی و پایش ترافیک آنلاین.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRunFullDiagnostics}
            disabled={isDiagnosing || actionBusy !== null}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white rounded-xl text-xs font-extrabold shadow-md shadow-sky-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            {isDiagnosing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Activity className="w-4 h-4" />
            )}
            <span>بررسی کامل اتصال، دیتابیس و ترافیک</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLiveMonitoring((prev) => !prev)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-2 cursor-pointer ${
              isLiveMonitoring
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Radio className={`w-4 h-4 ${isLiveMonitoring ? 'animate-pulse' : ''}`} />
            <span>{isLiveMonitoring ? 'توقف گزارش زنده' : 'گزارش زنده آنلاین (۵ ثانیه)'}</span>
          </button>

          <button
            type="button"
            onClick={handlePullFromCloud}
            disabled={isDiagnosing || actionBusy !== null}
            className="px-3.5 py-2.5 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-200 border border-teal-200 dark:border-teal-800 disabled:opacity-60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            {actionBusy === 'pull' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>دریافت از ابر</span>
          </button>
        </div>
      </div>

      {/* بخش اختصاصی انتقال وضعیت فعلی داده‌ها و تنظیمات به سرور ابری و دیتابیس */}
      <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/25 border border-indigo-200/80 dark:border-indigo-800/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 shadow-sm">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-indigo-950 dark:text-indigo-100">
              انتقال وضعیت فعلی داده‌ها و تنظیمات به سرور ابری و دیتابیس
            </h4>
            <p className="text-xs text-indigo-800/85 dark:text-indigo-200/80 leading-relaxed">
              با کلیک روی این دکمه، تمام داده‌ها و تنظیمات فعلی این سیستم (تنظیمات عمومی، لوگو و ظاهر سایت، تمامی کاربران کارکنان و سرپرستان، پرونده دانشجویان در دسته‌های ۲۰۰تایی، سراها، اتاق‌ها، تخت‌ها و اطلاعیه‌ها) به‌صورت کامل به پایگاه داده ابری Supabase منتقل و هم‌تراز می‌شوند تا در سایر سیستم‌ها نیز دقیقاً همین وضعیت نمایش داده شود.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePushAllToCloud}
          disabled={isDiagnosing || actionBusy !== null}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-600/25 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          {actionBusy === 'push' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UploadCloud className="w-4 h-4" />
          )}
          <span>انتقال داده‌ها و تنظیمات فعلی به سرور ابری و دیتابیس</span>
        </button>
      </div>

      {/* هشدار صف تغییرات ارسال‌نشده (در صورت وجود خطای شبکه قبلی) */}
      {liveMetrics.failedRetryQueueKeys.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-100">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-extrabold">
                {liveMetrics.failedRetryQueueKeys.length.toLocaleString('fa-IR')} جدول تغییریافته هنوز در صف ارسال به سرور ابری است:
              </div>
              <div className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
                {liveMetrics.failedRetryQueueKeys
                  .map((k) => Storage.getFriendlySyncKeyLabel(k))
                  .join('، ')}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRetryFailedQueue}
            disabled={isDiagnosing || actionBusy !== null}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {actionBusy === 'retry' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>ارسال مجدد صف معوق</span>
          </button>
        </div>
      )}

      {/* پیشرفت لحظه‌ای تست یا همگام‌سازی */}
      {diagStepText && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-xs font-bold text-sky-800 dark:text-sky-200">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{diagStepText}</span>
        </div>
      )}

      {actionMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs space-y-2 ${
            actionMessage.ok
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
          }`}
        >
          <div className="flex items-center gap-2.5 font-extrabold">
            {actionMessage.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          {actionMessage.details && actionMessage.details.length > 0 && (
            <ul className="space-y-1 text-[11px] font-semibold opacity-90 pr-6">
              {actionMessage.details.map((line, idx) => (
                <li key={idx}>• {line}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* کارت‌های شاخص زنده آنلاین */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span>اتصال شبکه و سرور</span>
            {liveMetrics.browserOnline ? (
              <Wifi className="w-4 h-4 text-emerald-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>
              {liveMetrics.lastHealthOk === true
                ? 'متصل و سالم'
                : liveMetrics.lastHealthOk === false
                ? 'خطا در سرور'
                : liveMetrics.browserOnline
                ? 'آماده آزمایش'
                : 'آفلاین'}
            </span>
            {liveMetrics.lastHealthLatencyMs !== null && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sky-700 dark:text-sky-300">
                {liveMetrics.lastHealthLatencyMs.toLocaleString('fa-IR')} ms
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate" dir="ltr">
            {liveMetrics.apiBaseUrl}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span>دیتابیس Supabase (PostgreSQL)</span>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-sm font-black text-slate-900 dark:text-white">
            {liveMetrics.lastDbName || report?.dbName || 'در انتظار بررسی'}
            {liveMetrics.lastSyncRevision !== null && (
              <span className="mr-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                (نسخه #{String(liveMetrics.lastSyncRevision)})
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {liveMetrics.lastServerCounts
              ? `جداول: ${liveMetrics.lastServerCounts.syncKv.toLocaleString('fa-IR')} | دانشجو: ${liveMetrics.lastServerCounts.students.toLocaleString('fa-IR')} | عکس: ${liveMetrics.lastServerCounts.photos.toLocaleString('fa-IR')}`
              : 'برای شمارش اسناد، بررسی کامل را بزنید'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span>ترافیک و نرخ موفقیت نشست</span>
            <Server className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-sm font-black text-slate-900 dark:text-white">
            {liveMetrics.totalRequests.toLocaleString('fa-IR')} درخواست ({successRate.toLocaleString('fa-IR')}٪ موفق)
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-300 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              ارسال: {formatBytesFa(liveMetrics.bytesSentUtf8)}
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300 font-semibold">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              دریافت: {formatBytesFa(liveMetrics.bytesReceivedUtf8)}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span>صف همگام‌سازی و حجم محلی</span>
            <HardDrive className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-sm font-black text-slate-900 dark:text-white">
            {formatBytesFa(localAudit.totalBytesUtf8)}{' '}
            <span className="text-[11px] font-bold text-slate-500">
              ({localAudit.presentKeysCount.toLocaleString('fa-IR')}/{localAudit.totalSyncableKeys.toLocaleString('fa-IR')} جدول)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            در انتظار: {liveMetrics.pendingKeysCount.toLocaleString('fa-IR')} | در حال ارسال:{' '}
            {liveMetrics.inFlightKeysCount.toLocaleString('fa-IR')} | خطا:{' '}
            <span
              className={
                liveMetrics.failedRetryQueueKeys.length > 0
                  ? 'text-rose-600 font-extrabold'
                  : 'text-emerald-600 font-bold'
              }
            >
              {liveMetrics.failedRetryQueueKeys.length.toLocaleString('fa-IR')}
            </span>
          </div>
        </div>
      </div>

      {/* نمودار میله‌ای زنده پینگ سرور (هنگام فعال‌بودن پایش زنده یا پس از آزمایش) */}
      {latencyHistory.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
            <span>نوسان زمان پاسخ سرور ابری (Latency History)</span>
            <span className="text-[11px] text-slate-400">
              آخرین پینگ‌ها (میلی‌ثانیه)
            </span>
          </div>
          <div className="flex items-end gap-1.5 h-16 pt-2">
            {latencyHistory.map((item, idx) => {
              const maxMs = Math.max(800, ...latencyHistory.map((x) => x.ms));
              const heightPct = Math.max(12, Math.min(100, Math.round((item.ms / maxMs) * 100)));
              return (
                <div
                  key={`${item.time}-${idx}`}
                  title={`${item.time} — ${item.ms}ms (${item.ok ? 'موفق' : 'خطا'})`}
                  className="flex-1 flex flex-col items-center justify-end gap-1 h-full"
                >
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      !item.ok
                        ? 'bg-rose-500'
                        : item.ms > 3500
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] text-slate-400 tabular-nums leading-none">
                    {item.ms}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* گزارش کامل ۶ مرحله‌ای عیب‌یابی پس از اجرای بررسی */}
      {report && (
        <div className="space-y-4 pt-1">
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              report.overallStatus === 'pass'
                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                : report.overallStatus === 'warn'
                ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {report.overallStatus === 'pass' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : report.overallStatus === 'warn' ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div>
                <div className="font-extrabold text-sm">
                  {report.overallStatus === 'pass'
                    ? 'نتیجه بررسی: تمام مسیرهای اتصال، دیتابیس و همگام‌سازی سالم هستند'
                    : report.overallStatus === 'warn'
                    ? 'نتیجه بررسی: اتصال برقرار است اما مواردی نیازمند توجه یا همگام‌سازی وجود دارد'
                    : 'نتیجه بررسی: خطا در ارتباط با سرور ابری یا پایگاه داده شناسایی شد'}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  زمان بررسی: {report.checkedAt} | کل زمان تست:{' '}
                  {report.totalDurationMs.toLocaleString('fa-IR')} میلی‌ثانیه
                  {report.throughputKbps !== null
                    ? ` | سرعت انتقال نمونه: ${report.throughputKbps.toLocaleString('fa-IR')} KB/s`
                    : ''}
                </div>
              </div>
            </div>
          </div>

          {/* جزئیات ۶ مرحله بررسی */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {report.checks.map((chk) => (
              <div
                key={chk.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {chk.status === 'pass' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : chk.status === 'warn' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                      {chk.title}
                    </h4>
                  </div>
                  {chk.latencyMs !== null && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                      {chk.latencyMs.toLocaleString('fa-IR')} ms
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                  {chk.summary}
                </p>
                {chk.details.length > 0 && (
                  <ul className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                    {chk.details.map((d, i) => (
                      <li key={i} className="leading-relaxed">
                        • {d}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* ممیزی حجم جداول محلی در مقایسه با پایگاه داده ابری Supabase */}
          {localAudit.topKeys.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                  پرحجم‌ترین جداول سامانه (بدون محدودیت ۴.۵MB در Supabase)
                </h4>
                <span className="text-[11px] text-slate-500">
                  کل حجم محلی: {formatBytesFa(localAudit.totalBytesUtf8)}
                </span>
              </div>
              <div className="space-y-2">
                {localAudit.topKeys.map((item) => (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[65%]">
                        {item.label}
                      </span>
                      <span className="font-bold text-slate-500 dark:text-slate-400">
                        {formatBytesFa(item.bytesUtf8)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${Math.min(100, Math.max(4, item.percentOfVercelLimit))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* جمع‌بندی و توصیه‌های اجرایی */}
          {report.recommendations.length > 0 && (
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/50 space-y-1.5">
              <div className="font-extrabold text-xs text-indigo-900 dark:text-indigo-200">
                جمع‌بندی فنی و اقدامات پیشنهادی:
              </div>
              <ul className="space-y-1 text-xs text-indigo-800 dark:text-indigo-300">
                {report.recommendations.map((rec, idx) => (
                  <li key={idx}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* گزارش آنلاین و زنده ترافیک و رویدادهای اخیر */}
      <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-600" />
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
              گزارش زنده ترافیک و تبادل داده با سرور ابری
            </h4>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
            <span>
              قابلیت‌های سرور: نسخه ({liveMetrics.endpointCapabilities.version === false ? 'غیرفعال' : liveMetrics.endpointCapabilities.version ? 'فعال' : '؟'})
              {' / '}مانیفست ({liveMetrics.endpointCapabilities.manifest === false ? 'نیاز به آپدیت' : liveMetrics.endpointCapabilities.manifest ? 'فعال' : '؟'})
              {' / '}دسته ({liveMetrics.endpointCapabilities.batch === false ? 'غیرفعال' : liveMetrics.endpointCapabilities.batch ? 'فعال' : '؟'})
            </span>
          </div>
        </div>

        {liveMetrics.lastError && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-800 dark:text-rose-200 font-semibold">
            آخرین خطای ثبت‌شده ({liveMetrics.lastError.timestamp} —{' '}
            <span dir="ltr">{liveMetrics.lastError.endpoint}</span>):{' '}
            {liveMetrics.lastError.message}
          </div>
        )}

        {liveMetrics.recentEvents.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
            هنوز رویداد تبادل داده در این نشست ثبت نشده است. دکمه «بررسی کامل اتصال، دیتابیس و ترافیک» یا «گزارش زنده آنلاین» را بزنید.
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-200/70 dark:divide-slate-700/60 rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-white dark:bg-slate-900">
            {liveMetrics.recentEvents.map((ev) => (
              <div
                key={ev.id}
                className="px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`px-1.5 py-0.5 rounded-md font-extrabold shrink-0 ${
                      ev.direction === 'up'
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : ev.direction === 'down'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                    }`}
                  >
                    {ev.direction === 'up' ? 'ارسال' : ev.direction === 'down' ? 'دریافت' : 'پایش'}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                    {ev.detail}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 text-slate-500 dark:text-slate-400 tabular-nums">
                  <span dir="ltr" className="text-[10px] font-mono">
                    {ev.method} {ev.endpoint}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      ev.ok
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                    }`}
                  >
                    {ev.status ?? 'ERR'}
                  </span>
                  <span>{ev.durationMs.toLocaleString('fa-IR')}ms</span>
                  {ev.bytes > 0 && <span>{formatBytesFa(ev.bytes)}</span>}
                  <span>{ev.timeShort}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
