import React, { useEffect, useMemo, useState } from 'react';
import { Announcement } from '../types';
import { RichTextDisplay } from './RichTextEditor';
import { AnnouncementImageBox, ImageLightboxModal } from './ImageLightboxModal';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Megaphone,
  Search,
  X,
  ListFilter,
  AlignJustify,
  LayoutList,
} from 'lucide-react';

interface ImportantAnnouncementsWidgetProps {
  announcements: Announcement[];
  title?: string;
  className?: string;
}

export const ImportantAnnouncementsWidget: React.FC<ImportantAnnouncementsWidgetProps> = ({
  announcements,
  title = 'اطلاعیه‌های مهم سامانه جامع خدمات دانشجویی دانشگاه فرهنگیان',
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedInlineId, setExpandedInlineId] = useState<string | null>(null);
  const [modalSearch, setModalSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'important' | 'normal'>('all');
  const [compactModalMode, setCompactModalMode] = useState(false);
  const [expandedModalIds, setExpandedModalIds] = useState<Record<string, boolean>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewImage) {
          setPreviewImage(null);
        } else {
          setIsModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen, previewImage]);

  const urgentCount = useMemo(
    () => announcements.filter((a) => a.priority === 'urgent').length,
    [announcements]
  );

  const importantCount = useMemo(
    () => announcements.filter((a) => a.priority === 'important').length,
    [announcements]
  );

  const latestAnnouncement = announcements[0];

  const filteredModalAnnouncements = useMemo(() => {
    const q = modalSearch.trim().toLowerCase();
    return announcements.filter((ann) => {
      if (priorityFilter !== 'all' && ann.priority !== priorityFilter) return false;
      if (!q) return true;
      return (
        ann.title.toLowerCase().includes(q) ||
        ann.content.toLowerCase().includes(q) ||
        ann.author.toLowerCase().includes(q) ||
        ann.date.toLowerCase().includes(q)
      );
    });
  }, [announcements, modalSearch, priorityFilter]);

  if (!announcements || announcements.length === 0) {
    return null;
  }

  const openModalFocused = (annId?: string) => {
    setIsModalOpen(true);
    if (annId) {
      setCompactModalMode(false);
      setExpandedModalIds((prev) => ({ ...prev, [annId]: true }));
    }
  };

  const toggleModalCard = (id: string) => {
    setExpandedModalIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <div
        className={`rounded-2xl border shadow-xs transition overflow-hidden ${
          urgentCount > 0
            ? 'bg-gradient-to-l from-rose-50/90 via-white to-amber-50/60 dark:from-rose-950/35 dark:via-slate-900 dark:to-amber-950/20 border-rose-200/90 dark:border-rose-900/70'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
        } ${className}`}
        dir="rtl"
      >
        {/* نوار فشرده دکمه بازشونده / پاپ‌آپ */}
        <div className="px-3.5 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 text-right min-w-0 flex-1 group cursor-pointer"
            title="کلیک برای مشاهده کامل اطلاعیه‌ها در پنجره پاپ‌آپ"
          >
            <div
              className={`relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition group-hover:scale-105 ${
                urgentCount > 0
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/25'
                  : 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
              }`}
            >
              {urgentCount > 0 ? (
                <Megaphone className="w-5 h-5" />
              ) : (
                <Bell className="w-5 h-5" />
              )}
              <span className="absolute -top-1.5 -left-1.5 min-w-[20px] h-5 px-1 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs border-2 border-white dark:border-slate-900">
                {announcements.length.toLocaleString('fa-IR')}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition">
                  {title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800 font-bold">
                  {announcements.length.toLocaleString('fa-IR')} اطلاعیه
                </span>
                {urgentCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold animate-pulse">
                    {urgentCount.toLocaleString('fa-IR')} فوری
                  </span>
                )}
              </div>

              {latestAnnouncement && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300">آخرین اطلاعیه: </span>
                  {latestAnnouncement.title}
                  {latestAnnouncement.date ? ` (${latestAnnouncement.date})` : ''}
                </p>
              )}
            </div>
          </button>

          <div className="flex items-center gap-2 shrink-0 justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-extrabold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>پنجره اطلاعیه‌ها</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-extrabold transition flex items-center gap-1 cursor-pointer ${
                isExpanded
                  ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>{isExpanded ? 'بستن فهرست' : 'باز کردن سریع'}</span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* فهرست کشویی فشرده و اسکرول‌پذیر (با ارتفاع محدود برای جلوگیری از شلوغی صفحه) */}
        {isExpanded && (
          <div className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 px-3.5 sm:px-5 py-3">
            <div className="max-h-72 overflow-y-auto space-y-2 pl-1">
              {announcements.map((ann) => {
                const isItemOpen = expandedInlineId === ann.id;
                return (
                  <div
                    key={ann.id}
                    className={`rounded-xl border transition overflow-hidden ${
                      ann.priority === 'urgent'
                        ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                        : ann.priority === 'important'
                        ? 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/60'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedInlineId(isItemOpen ? null : ann.id)}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-right cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {ann.priority === 'urgent' && (
                          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold">
                            فوری
                          </span>
                        )}
                        {ann.priority === 'important' && (
                          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold">
                            مهم
                          </span>
                        )}
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {ann.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-[10px] text-slate-400">
                        <span>{ann.date}</span>
                        {isItemOpen ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </div>
                    </button>

                    {isItemOpen && (
                      <div className="px-3.5 pb-3 pt-1 border-t border-black/5 dark:border-white/5 space-y-2">
                        <RichTextDisplay
                          html={ann.contentHtml}
                          fallbackText={ann.content}
                          className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
                          onImageClick={(src) => setPreviewImage(src)}
                        />
                        {ann.imageUrl && (
                          <AnnouncementImageBox
                            src={ann.imageUrl}
                            alt={ann.title}
                            onClick={(src) => setPreviewImage(src)}
                            maxWidthClass="max-w-sm"
                            heightClass="h-40 sm:h-48"
                          />
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] text-slate-400">
                          <span>مرجع صدور: {ann.author}</span>
                          <button
                            type="button"
                            onClick={() => openModalFocused(ann.id)}
                            className="text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                          >
                            مشاهده در پنجره کامل ←
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* پنجره پاپ‌آپ کامل اطلاعیه‌های مهم */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-5"
          dir="rtl"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[88vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* هدر مودال */}
            <div className="px-4 sm:px-6 py-4 bg-gradient-to-l from-teal-700 via-teal-600 to-emerald-600 text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-amber-200" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm sm:text-base leading-snug truncate">
                    {title}
                  </h3>
                  <p className="text-[11px] text-teal-100 mt-0.5">
                    مجموع {announcements.length.toLocaleString('fa-IR')} اطلاعیه فعال
                    {urgentCount > 0 ? ` • ${urgentCount.toLocaleString('fa-IR')} فوری` : ''}
                    {importantCount > 0 ? ` • ${importantCount.toLocaleString('fa-IR')} مهم` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition shrink-0 cursor-pointer"
                aria-label="بستن پنجره اطلاعیه‌ها"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* نوار جستجو و فیلتر */}
            <div className="px-4 sm:px-6 py-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="جستجو در عنوان، متن یا صادرکننده اطلاعیه..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <ListFilter className="w-3.5 h-3.5 text-slate-400 hidden sm:block ml-0.5" />
                {(
                  [
                    { key: 'all', label: 'همه' },
                    { key: 'urgent', label: 'فوری' },
                    { key: 'important', label: 'مهم' },
                    { key: 'normal', label: 'عادی' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setPriorityFilter(item.key)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                      priorityFilter === item.key
                        ? item.key === 'urgent'
                          ? 'bg-rose-600 text-white'
                          : item.key === 'important'
                          ? 'bg-amber-500 text-white'
                          : 'bg-teal-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCompactModalMode((prev) => !prev)}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer"
                  title="تغییر حالت نمایش بین عناوین فشرده و متن کامل"
                >
                  {compactModalMode ? (
                    <>
                      <AlignJustify className="w-3.5 h-3.5 text-teal-600" />
                      <span>متن کامل</span>
                    </>
                  ) : (
                    <>
                      <LayoutList className="w-3.5 h-3.5 text-teal-600" />
                      <span>فهرست فشرده</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* بدنه اسکرول‌پذیر اطلاعیه‌ها */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {filteredModalAnnouncements.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  اطلاعیه‌ای با این جستجو یا فیلتر یافت نشد.
                </div>
              ) : (
                filteredModalAnnouncements.map((ann) => {
                  const showBody = !compactModalMode || Boolean(expandedModalIds[ann.id]);
                  return (
                    <div
                      key={ann.id}
                      className={`rounded-2xl border transition overflow-hidden ${
                        ann.priority === 'urgent'
                          ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                          : ann.priority === 'important'
                          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                          : 'bg-slate-50/90 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <div
                        onClick={() => {
                          if (compactModalMode) toggleModalCard(ann.id);
                        }}
                        className={`p-4 flex flex-wrap items-center justify-between gap-2 ${
                          compactModalMode ? 'cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02]' : 'pb-2'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {ann.priority === 'urgent' && (
                            <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold">
                              فوری و مهم
                            </span>
                          )}
                          {ann.priority === 'important' && (
                            <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold">
                              اطلاعیه مهم
                            </span>
                          )}
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {ann.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-slate-400">{ann.date}</span>
                          {compactModalMode && (
                            showBody ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )
                          )}
                        </div>
                      </div>

                      {showBody && (
                        <div className="px-4 pb-4 space-y-2.5">
                          <RichTextDisplay
                            html={ann.contentHtml}
                            fallbackText={ann.content}
                            className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed"
                            onImageClick={(src) => setPreviewImage(src)}
                          />
                          {ann.imageUrl && (
                            <AnnouncementImageBox
                              src={ann.imageUrl}
                              alt={ann.title}
                              onClick={(src) => setPreviewImage(src)}
                              maxWidthClass="max-w-lg"
                              heightClass="h-48 sm:h-56"
                            />
                          )}
                          <div className="text-[10px] text-slate-400 pt-2 border-t border-black/5 dark:border-white/5 font-medium flex items-center justify-between">
                            <span>مرجع صدور: {ann.author}</span>
                            <span>تاریخ انتشار: {ann.date}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* فوتر مودال */}
            <div className="px-4 sm:px-6 py-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                نمایش {filteredModalAnnouncements.length.toLocaleString('fa-IR')} از{' '}
                {announcements.length.toLocaleString('fa-IR')} اطلاعیه
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-extrabold transition cursor-pointer"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* بزرگ‌نمایی تصویر اطلاعیه */}
      <ImageLightboxModal
        src={previewImage}
        alt="تصویر اطلاعیه"
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
};
