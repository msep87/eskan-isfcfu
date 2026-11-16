import React, { useEffect, useState } from 'react';
import { Maximize2, Minimize2, X, ZoomIn } from 'lucide-react';

interface ImageLightboxModalProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  src,
  alt = 'تصویر اطلاعیه',
  onClose,
}) => {
  const [actualSize, setActualSize] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    setActualSize(false);
    setDimensions(null);
  }, [src]);

  useEffect(() => {
    if (!src) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-[96vw] max-h-[94vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/20 dark:border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* نوار کنترل ابعاد و بستن */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 dark:text-slate-100 truncate max-w-[200px] sm:max-w-xs">
              {alt}
            </span>
            {dimensions && (
              <span className="px-2 py-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-mono">
                {dimensions.width} × {dimensions.height} px
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActualSize((v) => !v)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                actualSize
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
              }`}
              title={actualSize ? 'تنظیم متناسب با صفحه نمایش' : 'نمایش با ابعاد واقعی تصویر (۱۰۰٪)'}
            >
              {actualSize ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>متناسب با صفحه</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>ابعاد واقعی (۱۰۰٪)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>بستن</span>
            </button>
          </div>
        </div>

        {/* نمایش تصویر در اندازه بزرگ یا ابعاد واقعی */}
        <div
          className={`p-3 sm:p-4 bg-slate-100 dark:bg-slate-950 flex ${
            actualSize
              ? 'overflow-auto max-w-[94vw] max-h-[82vh] items-start justify-start'
              : 'overflow-hidden items-center justify-center'
          }`}
        >
          <img
            src={src}
            alt={alt}
            onLoad={(e) => {
              const img = e.currentTarget;
              setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            }}
            style={
              actualSize && dimensions
                ? {
                    width: `${dimensions.width}px`,
                    height: `${dimensions.height}px`,
                    maxWidth: 'none',
                    maxHeight: 'none',
                  }
                : undefined
            }
            className={
              actualSize
                ? 'rounded-xl shadow-lg block shrink-0'
                : 'max-w-[90vw] max-h-[78vh] w-auto h-auto object-contain rounded-xl shadow-lg'
            }
          />
        </div>
      </div>
    </div>
  );
};

interface AnnouncementImageBoxProps {
  src: string;
  alt: string;
  onClick: (src: string) => void;
  maxWidthClass?: string;
  heightClass?: string;
}

export const AnnouncementImageBox: React.FC<AnnouncementImageBoxProps> = ({
  src,
  alt,
  onClick,
  maxWidthClass = 'w-full',
  heightClass = 'h-52 sm:h-60',
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick(src)}
      title="کلیک جهت مشاهده تصویر در ابعاد واقعی و بزرگ"
      className={`mt-3 ${maxWidthClass} ${heightClass} rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-900/70 p-2 flex items-center justify-center overflow-hidden relative group cursor-zoom-in transition hover:border-teal-400 dark:hover:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500`}
    >
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl transition-transform duration-200 group-hover:scale-[1.02]"
      />
      <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-xl bg-slate-900/75 text-white text-[10px] font-bold flex items-center gap-1 opacity-85 group-hover:opacity-100 transition shadow-sm">
        <ZoomIn className="w-3 h-3" />
        <span>مشاهده بزرگ / ابعاد واقعی</span>
      </span>
    </button>
  );
};
