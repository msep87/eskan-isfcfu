import React, { useState } from 'react';
import { Smartphone, Download, Share, PlusSquare, MoreVertical, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'hero';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // اگر کاربر در حال حاضر در حالت اپلیکیشن نصب‌شده (Standalone) است، دکمه نصب نمایش داده نمی‌شود
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        // اگر کاربر انصراف داد یا نیاز به راهنما داشت، دیگر مزاحم نمی‌شویم
      }
      return;
    }
    setShowGuideModal(true);
  };

  return (
    <>
      {variant === 'hero' ? (
        <button
          type="button"
          onClick={() => void handleClick()}
          className="px-5 py-3.5 bg-emerald-500/90 hover:bg-emerald-500 text-white rounded-2xl font-extrabold text-xs sm:text-sm border border-white/25 transition flex items-center gap-2 cursor-pointer shadow-lg"
          title="نصب نسخه اپلیکیشن موبایل (PWA) برای اندروید، آیفون و دسکتاپ"
        >
          <Smartphone className="w-4 h-4 text-amber-200 shrink-0" />
          <span>نصب نسخه اپلیکیشن موبایل</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void handleClick()}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 border border-cyan-200 dark:border-cyan-800 text-[11px] font-bold transition cursor-pointer shadow-xs"
          title="نصب سامانه به صورت اپلیکیشن موبایل روی صفحه اصلی گوشی"
        >
          {isInstallable ? (
            <Download className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className="hidden sm:inline">نصب اپلیکیشن</span>
        </button>
      )}

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-right space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    نصب نسخه اپلیکیشن موبایل (PWA)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    اجرای تمام‌صفحه، سریع و شبیه اپلیکیشن بومی روی گوشی
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <p className="font-bold text-teal-700 dark:text-teal-300">
                  راهنمای نصب روی گوشی‌های آیفون و آیپد (مرورگر Safari):
                </p>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      ۱
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>در نوار پایین مرورگر Safari روی دکمه</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-sky-600">
                        <Share className="w-3.5 h-3.5" />
                        <span>Share (اشتراک‌گذاری)</span>
                      </span>
                      <span>بزنید.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      ۲
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>صفحه را کمی به پایین بکشید و گزینه</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-teal-700 dark:text-teal-300">
                        <PlusSquare className="w-3.5 h-3.5" />
                        <span>Add to Home Screen</span>
                      </span>
                      <span>را انتخاب کنید.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      ۳
                    </span>
                    <span>در مرحله آخر دکمه <strong>Add</strong> را بزنید تا آیکون سامانه به صفحه اصلی گوشی اضافه شود.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <p className="font-bold text-teal-700 dark:text-teal-300">
                  راهنمای نصب روی اندروید، ویندوز و مک (Chrome / Edge):
                </p>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      ۱
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>در مرورگر Chrome گوشی، روی منوی سه‌نقطه</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </span>
                      <span>در گوشه بالای مرورگر بزنید.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      ۲
                    </span>
                    <span>
                      گزینه <strong>Install app (نصب برنامه)</strong> یا <strong>Add to Home screen (افزودن به صفحه اصلی)</strong> را انتخاب کنید.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      ۳
                    </span>
                    <span>
                      در آیفون (Safari) از دکمه <strong>Share</strong> گزینه <strong>Add to Home Screen</strong> را بزنید.
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-200 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>پس از نصب، بدون نوار آدرس مرورگر و با آیکون اختصاصی دانشگاه فرهنگیان اجرا می‌شود.</span>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold transition cursor-pointer"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}
    </>
  );
};
