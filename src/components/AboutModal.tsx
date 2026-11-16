import React, { useState } from 'react';
import {
  X,
  School,
  UserCheck,
  CheckCircle,
  Mail,
  Layers,
  FileDown,
  FileText,
  Printer,
  Sparkles,
  Paperclip,
  Download,
  Eye,
  Edit3,
  Shield,
} from 'lucide-react';
import { AppSettings } from '../types';
import { FarhangianEmblem } from './FarhangianEmblem';
import { RichTextDisplay } from './RichTextEditor';
import { ImageLightboxModal } from './ImageLightboxModal';
import { downloadSystemPdfDocument } from '../utils/docExportUtils';
import { resolveAboutContent } from '../utils/aboutDefaults';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  customLogoUrl?: string;
  settings?: AppSettings;
  isAdmin?: boolean;
  onOpenAdminEdit?: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  customLogoUrl,
  settings,
  isAdmin = false,
  onOpenAdminEdit,
}) => {
  const [previewImageSrc, setPreviewImageSrc] = useState<{ src: string; alt: string } | null>(null);

  if (!isOpen) return null;

  const resolved = resolveAboutContent(settings?.aboutContent);
  const logoUrl = settings?.customLogoUrl || customLogoUrl;
  const academicYear = settings?.currentAcademicYear || '۱۴۰۵-۱۴۰۶';

  const formatSize = (bytes: number) => {
    if (!bytes || bytes < 1024) return `${bytes || 0} بایت`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} کیلوبایت`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} مگابایت`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
        <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">

          {/* سربرگ مودال */}
          <div className="relative bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 text-white p-6 sm:p-7 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md p-2 border border-white/20 flex items-center justify-center shadow-lg shrink-0">
                  <FarhangianEmblem size={36} customLogoUrl={logoUrl} />
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-500/30 text-teal-200 text-[10px] font-bold border border-teal-400/30 mb-1">
                    {resolved.universityBadge}
                  </span>
                  <h3 className="font-black text-lg sm:text-xl text-white">
                    {resolved.headerTitle}
                  </h3>
                  <p className="text-xs text-teal-100/90 font-medium leading-relaxed mt-0.5">
                    {resolved.headerSubtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isAdmin && onOpenAdminEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdminEdit();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="ویرایش متن‌ها، کارت‌ها و فایل‌های پیوست بخش درباره ما"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ویرایش بخش درباره ما</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* محتوای توضیحات */}
          <div className="p-6 sm:p-7 space-y-6 max-h-[72vh] overflow-y-auto">

            {/* ۱. معرفی طراح و سازنده سامانه */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-teal-500/5 border border-amber-500/20 dark:border-amber-500/30">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 text-right flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                      {resolved.designerBadge}
                    </span>
                    {resolved.designerEmail && (
                      <a
                        href={`mailto:${resolved.designerEmail}`}
                        className="inline-flex items-center gap-1.5 text-[11px] font-mono text-teal-700 dark:text-teal-300 bg-white/80 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800 hover:underline"
                        dir="ltr"
                      >
                        <Mail className="w-3 h-3 text-teal-600" />
                        <span>{resolved.designerEmail}</span>
                      </a>
                    )}
                  </div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white">
                    {resolved.designerName}
                  </h4>
                  <div className="pt-1">
                    <RichTextDisplay
                      html={resolved.designerBioHtml}
                      fallbackText={resolved.designerBioHtml.replace(/<[^>]+>/g, ' ')}
                      className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* دکمه اختصاصی دانلود فایل PDF سند جامع تحلیلی، فنی و راهنمای عملیاتی سامانه */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-blue-50 to-indigo-50 dark:from-rose-950/30 dark:via-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {resolved.pdfCardTitle}
                  </h5>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                    {resolved.pdfCardDescription}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={downloadSystemPdfDocument}
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer shrink-0"
              >
                <Printer className="w-4 h-4" />
                <span>چاپ / ذخیره PDF</span>
              </button>
            </div>

            {/* ۲. درباره دانشگاه فرهنگیان و ویژگی شبانه‌روزی بودن و رسالت تربیت معلم */}
            <div className="space-y-2.5 text-right">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {resolved.boardingSectionTitle}
                </h4>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <RichTextDisplay
                  html={resolved.boardingSectionHtml}
                  fallbackText={resolved.boardingSectionHtml.replace(/<[^>]+>/g, ' ')}
                  className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-justify"
                />
              </div>
            </div>

            {/* ۳. درباره اهداف و قابلیت‌های دسته‌بندی‌شده سامانه جامع سراها */}
            {resolved.capabilities.length > 0 && (
              <div className="space-y-3 text-right">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {resolved.capabilitiesSectionTitle}
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                  {resolved.capabilities.map((cap, idx) => {
                    const isLastOddFull =
                      cap.highlight &&
                      resolved.capabilities.length % 2 === 1 &&
                      idx === resolved.capabilities.length - 1;
                    const colonIndex = cap.text.indexOf(':');
                    const hasPrefix = colonIndex > 0 && colonIndex < 55;
                    const prefixTitle = hasPrefix ? cap.text.slice(0, colonIndex).trim() : '';
                    const restBody = hasPrefix ? cap.text.slice(colonIndex + 1).trim() : cap.text;
                    return (
                      <div
                        key={cap.id}
                        className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
                          cap.highlight
                            ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/50'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                        } ${isLastOddFull ? 'sm:col-span-2' : ''}`}
                      >
                        {cap.highlight ? (
                          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        ) : cap.text.includes('حراست') ? (
                          <Shield className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          {hasPrefix && (
                            <div className="font-extrabold text-slate-900 dark:text-white mb-0.5">
                              {prefixTitle}
                            </div>
                          )}
                          <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {restBody}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* بخش توضیحات تکمیلی قابل ویرایش مدیر */}
            {resolved.extraSectionHtml && resolved.extraSectionHtml.replace(/<[^>]+>/g, '').trim() !== '' && (
              <div className="space-y-2.5 text-right">
                {resolved.extraSectionTitle && (
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{resolved.extraSectionTitle}</span>
                  </h4>
                )}
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-200/70 dark:border-indigo-900/40">
                  <RichTextDisplay
                    html={resolved.extraSectionHtml}
                    fallbackText={resolved.extraSectionHtml.replace(/<[^>]+>/g, ' ')}
                    className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* فایل‌ها، بخشنامه‌ها و آیین‌نامه‌های پیوست قابل بارگذاری توسط مدیر */}
            {resolved.attachments.length > 0 && (
              <div className="space-y-3 text-right">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {resolved.attachmentsTitle} ({resolved.attachments.length.toLocaleString('fa-IR')} فایل)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {resolved.attachments.map((att) => {
                    const isImage = att.mimeType.startsWith('image/');
                    return (
                      <div
                        key={att.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isImage ? (
                            <button
                              type="button"
                              onClick={() => setPreviewImageSrc({ src: att.dataUrl, alt: att.title })}
                              className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 cursor-zoom-in"
                            >
                              <img src={att.dataUrl} alt={att.title} className="w-full h-full object-cover" />
                            </button>
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                              {att.title}
                            </div>
                            {att.description && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {att.description}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                              <span className="truncate max-w-[140px]" dir="ltr">{att.fileName}</span>
                              <span>·</span>
                              <span>{formatSize(att.fileSize || 0)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isImage && (
                            <button
                              type="button"
                              onClick={() => setPreviewImageSrc({ src: att.dataUrl, alt: att.title })}
                              className="p-2 rounded-xl bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 cursor-pointer"
                              title="پیش‌نمایش تصویر"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <a
                            href={att.dataUrl}
                            download={att.fileName}
                            className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold flex items-center gap-1 transition shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>دانلود</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* نوار پایین مودال */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="text-[11px] text-slate-400">
              سال تحصیلی فعال: {academicYear} • {resolved.footerNote}
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && onOpenAdminEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminEdit();
                  }}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>ویرایش</span>
                </button>
              )}

              <button
                type="button"
                onClick={downloadSystemPdfDocument}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>دریافت مستندات (PDF)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>

        </div>
      </div>

      <ImageLightboxModal
        src={previewImageSrc?.src || null}
        alt={previewImageSrc?.alt || 'پیش‌نمایش فایل پیوست'}
        onClose={() => setPreviewImageSrc(null)}
      />
    </>
  );
};
