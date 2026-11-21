import React, { useState, useMemo, useEffect } from 'react';
import { PersianTimePicker } from './PersianTimePicker';
import {
  CulturalStaff,
  Dormitory,
  CulturalProgram,
  CulturalProgramCategory,
  CulturalAssociation,
  AssociationMembership,
  DayOfWeek,
  Message,
} from '../types';
import { Storage } from '../utils/storage';
import {
  exportCulturalProgramsToExcel,
  exportCulturalAssociationsToExcel,
} from '../utils/excelUtils';
import { escapeHtml } from '../utils/sanitizeHtml';
import { GraduationClearanceReviewPanel } from './GraduationClearanceReviewPanel';
import {
  Sparkles,
  Calendar,
  Clock,
  Plus,
  CheckCircle,
  XCircle,
  Trash2,
  Edit3,
  MessageSquare,
  Users,
  FileSpreadsheet,
  Printer,
  Send,
  ShieldCheck,
  MapPin,
  UserCheck,
  BarChart3,
  BookOpen,
  X,
  Lock,
  GraduationCap,
} from 'lucide-react';

interface CulturalDashboardProps {
  staff: CulturalStaff;
  dorms: Dormitory[];
  cloudSyncTick?: number;
  onRefreshData: () => void;
  onOpenMessages: () => void;
  onOpenChangePassword: () => void;
  onOpenUserGuide?: (role: 'cultural') => void;
  embeddedMode?: boolean;
}

const DAYS_OF_WEEK: Array<{ key: DayOfWeek; label: string }> = [
  { key: 'saturday', label: 'شنبه' },
  { key: 'sunday', label: 'یکشنبه' },
  { key: 'monday', label: 'دوشنبه' },
  { key: 'tuesday', label: 'سه‌شنبه' },
  { key: 'wednesday', label: 'چهارشنبه' },
  { key: 'thursday', label: 'پنج‌شنبه' },
  { key: 'friday', label: 'جمعه' },
];

const CATEGORIES: Array<{ key: CulturalProgramCategory; label: string; badgeCls: string }> = [
  { key: 'cultural', label: 'فرهنگی و تربیتی', badgeCls: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 dark:bg-fuchsia-950/60 dark:text-fuchsia-300' },
  { key: 'religious', label: 'مذهبی و قرآنی', badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { key: 'scientific', label: 'علمی و پژوهشی', badgeCls: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300' },
  { key: 'artistic', label: 'هنری و ادبی', badgeCls: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300' },
  { key: 'sports', label: 'ورزشی و سلامت', badgeCls: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300' },
  { key: 'social', label: 'اجتماعی و جهادی', badgeCls: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300' },
  { key: 'skill', label: 'مهارتی و کارگاهی', badgeCls: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/60 dark:text-violet-300' },
];

export const CulturalDashboard: React.FC<CulturalDashboardProps> = ({
  staff,
  dorms,
  cloudSyncTick,
  onRefreshData,
  onOpenMessages,
  onOpenChangePassword,
  onOpenUserGuide,
  embeddedMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<'timetable' | 'associations' | 'reports' | 'messages' | 'clearance'>('timetable');
  const [programs, setPrograms] = useState<CulturalProgram[]>(() => Storage.getCulturalPrograms());
  const [associations, setAssociations] = useState<CulturalAssociation[]>(() =>
    Storage.getCulturalAssociations()
  );
  const [memberships, setMemberships] = useState<AssociationMembership[]>(() =>
    Storage.getAssociationMemberships()
  );
  const [messages, setMessages] = useState<Message[]>(() => Storage.getMessages());

  useEffect(() => {
    setPrograms(Storage.getCulturalPrograms());
    setAssociations(Storage.getCulturalAssociations());
    setMemberships(Storage.getAssociationMemberships());
    setMessages(Storage.getMessages());
  }, [cloudSyncTick]);

  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [dormFilter, setDormFilter] = useState<string>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'draft'>('all');

  // مودال ثبت / ویرایش برنامه هفتگی
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<CulturalProgram | null>(null);
  const [prgTitle, setPrgTitle] = useState('');
  const [prgCat, setPrgCat] = useState<CulturalProgramCategory>('cultural');
  const [prgDormId, setPrgDormId] = useState<string>('all');
  const [prgDay, setPrgDay] = useState<DayOfWeek>('saturday');
  const [prgStartTime, setPrgStartTime] = useState('۱۶:۰۰');
  const [prgEndTime, setPrgEndTime] = useState('۱۷:۳۰');
  const [prgLocation, setPrgLocation] = useState('نمازخانه / سالن اجتماعات سرا');
  const [prgPresenter, setPrgPresenter] = useState('');
  const [prgAudience, setPrgAudience] = useState('کلیه دانشجومعلمان');
  const [prgDesc, setPrgDesc] = useState('');
  const [prgStatus, setPrgStatus] = useState<'draft' | 'approved'>('approved');

  // مودال ثبت / ویرایش تشکل یا انجمن
  const [isAssocModalOpen, setIsAssocModalOpen] = useState(false);
  const [editingAssoc, setEditingAssoc] = useState<CulturalAssociation | null>(null);
  const [assocName, setAssocName] = useState('');
  const [assocCat, setAssocCat] = useState<CulturalProgramCategory>('cultural');
  const [assocDesc, setAssocDesc] = useState('');
  const [assocMentor, setAssocMentor] = useState('');
  const [assocSchedule, setAssocSchedule] = useState('');
  const [assocLocation, setAssocLocation] = useState('');
  const [assocDormId, setAssocDormId] = useState('all');
  const [assocMode, setAssocMode] = useState<'open_instant' | 'requires_approval'>('requires_approval');
  const [assocCapacity, setAssocCapacity] = useState('');

  // پاسخ به پیام فرهنگی دانشجو بدون دسترسی به اطلاعات شخصی/اسکان
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const reloadLocal = () => {
    setPrograms(Storage.getCulturalPrograms());
    setAssociations(Storage.getCulturalAssociations());
    setMemberships(Storage.getAssociationMemberships());
    setMessages(Storage.getMessages());
    onRefreshData();
  };

  // فقط پیام‌های مرتبط با امور فرهنگی و غیرمحرمانه (حفظ حریم اطلاعات دانشجو)
  const culturalMessages = useMemo(() => {
    return messages.filter(
      (m) =>
        !m.isConfidential &&
        (m.receiverType === 'cultural' ||
          m.category === 'cultural' ||
          m.senderRole === 'cultural' ||
          m.receiverId === staff.id)
    );
  }, [messages, staff.id]);

  const unreadCulturalMessagesCount = useMemo(
    () =>
      culturalMessages.filter((m) => m.senderRole === 'student' && m.status !== 'answered').length,
    [culturalMessages]
  );

  const pendingMemberships = useMemo(
    () => memberships.filter((m) => m.status === 'pending'),
    [memberships]
  );

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      if (dormFilter !== 'all' && p.dormId !== dormFilter && p.dormId !== 'all') return false;
      if (catFilter !== 'all' && p.category !== catFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      return true;
    });
  }, [programs, dormFilter, catFilter, statusFilter]);

  const openAddProgramModal = (defaultDay: DayOfWeek = 'saturday') => {
    setEditingProgram(null);
    setPrgTitle('');
    setPrgCat('cultural');
    setPrgDormId('all');
    setPrgDay(defaultDay);
    setPrgStartTime('۱۶:۰۰');
    setPrgEndTime('۱۷:۳۰');
    setPrgLocation('سالن اجتماعات / نمازخانه سرا');
    setPrgPresenter('');
    setPrgAudience('کلیه دانشجومعلمان');
    setPrgDesc('');
    setPrgStatus('approved');
    setIsProgramModalOpen(true);
  };

  const openEditProgramModal = (p: CulturalProgram) => {
    setEditingProgram(p);
    setPrgTitle(p.title);
    setPrgCat(p.category);
    setPrgDormId(p.dormId);
    setPrgDay(p.dayOfWeek);
    setPrgStartTime(p.startTime);
    setPrgEndTime(p.endTime);
    setPrgLocation(p.location);
    setPrgPresenter(p.presenter || '');
    setPrgAudience(p.targetAudience || '');
    setPrgDesc(p.description || '');
    setPrgStatus(p.status);
    setIsProgramModalOpen(true);
  };

  const handleSaveProgram = (e: React.FormEvent) => {
    e.preventDefault();
    const dormName =
      prgDormId === 'all'
        ? 'همه سراهای دانشجویی'
        : dorms.find((d) => d.id === prgDormId)?.name || 'سرای نامشخص';

    if (editingProgram) {
      const res = Storage.updateCulturalProgram(editingProgram.id, {
        title: prgTitle.trim(),
        category: prgCat,
        dormId: prgDormId,
        dormName,
        dayOfWeek: prgDay,
        startTime: prgStartTime.trim(),
        endTime: prgEndTime.trim(),
        location: prgLocation.trim(),
        presenter: prgPresenter.trim() || undefined,
        targetAudience: prgAudience.trim() || undefined,
        description: prgDesc.trim() || undefined,
        status: prgStatus,
      });
      setFeedback({ ok: res.success, msg: res.message });
    } else {
      const res = Storage.addCulturalProgram({
        title: prgTitle.trim(),
        category: prgCat,
        dormId: prgDormId,
        dormName,
        dayOfWeek: prgDay,
        startTime: prgStartTime.trim(),
        endTime: prgEndTime.trim(),
        location: prgLocation.trim() || 'نمازخانه / سالن سرا',
        presenter: prgPresenter.trim() || undefined,
        targetAudience: prgAudience.trim() || undefined,
        description: prgDesc.trim() || undefined,
        status: prgStatus,
        createdById: staff.id,
        createdByName: staff.fullName,
      });
      setFeedback({ ok: res.success, msg: res.message });
    }
    setIsProgramModalOpen(false);
    reloadLocal();
  };

  const handleToggleProgramApproval = (id: string) => {
    const res = Storage.toggleCulturalProgramApproval(id, staff.fullName);
    setFeedback({ ok: res.success, msg: res.message });
    reloadLocal();
  };

  const handleDeleteProgram = (id: string) => {
    const res = Storage.deleteCulturalProgram(id);
    setFeedback({ ok: res.success, msg: res.message });
    reloadLocal();
  };

  const openAddAssocModal = () => {
    setEditingAssoc(null);
    setAssocName('');
    setAssocCat('cultural');
    setAssocDesc('');
    setAssocMentor('');
    setAssocSchedule('');
    setAssocLocation('');
    setAssocDormId('all');
    setAssocMode('requires_approval');
    setAssocCapacity('');
    setIsAssocModalOpen(true);
  };

  const openEditAssocModal = (a: CulturalAssociation) => {
    setEditingAssoc(a);
    setAssocName(a.name);
    setAssocCat(a.category);
    setAssocDesc(a.description);
    setAssocMentor(a.mentorName || '');
    setAssocSchedule(a.meetingSchedule || '');
    setAssocLocation(a.location || '');
    setAssocDormId(a.dormId || 'all');
    setAssocMode(a.membershipMode);
    setAssocCapacity(a.maxCapacity ? String(a.maxCapacity) : '');
    setIsAssocModalOpen(true);
  };

  const handleSaveAssoc = (e: React.FormEvent) => {
    e.preventDefault();
    const dormName =
      assocDormId === 'all'
        ? 'کل سراهای پردیس'
        : dorms.find((d) => d.id === assocDormId)?.name || 'سرا';
    const capNum = Number(assocCapacity);
    const maxCapacity = !Number.isNaN(capNum) && capNum > 0 ? capNum : undefined;

    if (editingAssoc) {
      const res = Storage.updateCulturalAssociation(editingAssoc.id, {
        name: assocName.trim(),
        category: assocCat,
        description: assocDesc.trim(),
        mentorName: assocMentor.trim() || undefined,
        meetingSchedule: assocSchedule.trim() || undefined,
        location: assocLocation.trim() || undefined,
        dormId: assocDormId,
        dormName,
        membershipMode: assocMode,
        maxCapacity,
      });
      setFeedback({ ok: res.success, msg: res.message });
    } else {
      const res = Storage.addCulturalAssociation({
        name: assocName.trim(),
        category: assocCat,
        description: assocDesc.trim() || 'انجمن فرهنگی و اجتماعی دانشجومعلمان',
        mentorName: assocMentor.trim() || undefined,
        meetingSchedule: assocSchedule.trim() || undefined,
        location: assocLocation.trim() || undefined,
        dormId: assocDormId,
        dormName,
        membershipMode: assocMode,
        maxCapacity,
        status: 'active',
        createdByName: staff.fullName,
      });
      setFeedback({ ok: res.success, msg: res.message });
    }
    setIsAssocModalOpen(false);
    reloadLocal();
  };

  const handleReviewMembership = (id: string, decision: 'approved' | 'rejected') => {
    const res = Storage.reviewAssociationMembership(
      id,
      decision,
      staff.fullName,
      reviewNotes[id]
    );
    setFeedback({ ok: res.success, msg: res.message });
    reloadLocal();
  };

  const handleReplyMessage = (messageId: string) => {
    if (!replyText.trim()) return;
    const nowDate =
      new Date().toLocaleDateString('fa-IR') +
      ' - ' +
      new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    Storage.replyToMessage(messageId, {
      senderName: `${staff.fullName} (امور فرهنگی)`,
      senderRole: 'cultural',
      content: replyText.trim(),
      date: nowDate,
    });
    setReplyTargetId(null);
    setReplyText('');
    setFeedback({ ok: true, msg: 'پاسخ شما به پیام دانشجو ارسال شد.' });
    reloadLocal();
  };

  const handlePrintCulturalReport = () => {
    const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>گزارش جامع واحد امور فرهنگی سراهای دانشجویی</title>
  <style>
    @page { size: A4 landscape; margin: 1.2cm; }
    body { font-family: Vazirmatn, Tahoma, sans-serif; direction: rtl; color: #0f172a; font-size: 9pt; }
    h1 { color: #701a75; font-size: 14pt; margin: 0 0 6px 0; text-align: center; }
    .meta { text-align: center; font-size: 8.5pt; color: #475569; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #86198f; color: #fff; padding: 6px; border: 1px solid #86198f; font-size: 8.5pt; }
    td { padding: 5px 6px; border: 1px solid #cbd5e1; }
    tr:nth-child(even) td { background: #faf5ff; }
    h2 { color: #86198f; font-size: 11pt; border-bottom: 1px solid #e9d5ff; padding-bottom: 3px; }
  </style>
</head>
<body>
  <h1>گزارش جامع جدول زمانی برنامه‌های فرهنگی و تشکل‌های دانشجویی</h1>
  <div class="meta">تنظیم‌کننده: ${escapeHtml(staff.fullName)} • تاریخ چاپ: ${escapeHtml(
      new Date().toLocaleDateString('fa-IR')
    )}</div>
  <h2>۱. جدول زمانی هفتگی برنامه‌های فرهنگی (${programs.length} برنامه)</h2>
  <table>
    <thead><tr><th>کد</th><th>روز هفته</th><th>بازه ساعتی</th><th>عنوان برنامه</th><th>حوزه</th><th>سرا</th><th>مکان</th><th>وضعیت</th></tr></thead>
    <tbody>
      ${programs
        .map(
          (p) =>
            `<tr><td>${escapeHtml(p.programCode)}</td><td>${escapeHtml(
              DAYS_OF_WEEK.find((d) => d.key === p.dayOfWeek)?.label || p.dayOfWeek
            )}</td><td>${escapeHtml(p.startTime)} تا ${escapeHtml(p.endTime)}</td><td>${escapeHtml(
              p.title
            )}</td><td>${escapeHtml(
              CATEGORIES.find((c) => c.key === p.category)?.label || p.category
            )}</td><td>${escapeHtml(p.dormName)}</td><td>${escapeHtml(p.location)}</td><td>${
              p.status === 'approved' ? 'تأیید و منتشرشده' : 'پیش‌نویس'
            }</td></tr>`
        )
        .join('')}
    </tbody>
  </table>
  <h2>۲. تشکل‌ها و انجمن‌های دانشجویی (${associations.length} تشکل)</h2>
  <table>
    <thead><tr><th>کد</th><th>نام تشکل</th><th>نوع عضویت</th><th>اعضای تأییدشده</th><th>در انتظار تأیید</th><th>زمان جلسات</th></tr></thead>
    <tbody>
      ${associations
        .map((a) => {
          const mA = memberships.filter((m) => m.associationId === a.id);
          return `<tr><td>${escapeHtml(a.associationCode)}</td><td>${escapeHtml(a.name)}</td><td>${
            a.membershipMode === 'open_instant' ? 'آزاد مستقیم' : 'نیازمند تأیید'
          }</td><td>${mA.filter((m) => m.status === 'approved').length}</td><td>${
            mA.filter((m) => m.status === 'pending').length
          }</td><td>${escapeHtml(a.meetingSchedule || '-')}</td></tr>`;
        })
        .join('')}
    </tbody>
  </table>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
    const cleanup = () => window.setTimeout(() => iframe.remove(), 1000);
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        window.setTimeout(cleanup, 60000);
      }
    };
    iframe.srcdoc = html;
  };

  return (
    <div className="space-y-6">
      {/* سربرگ کارتابل امور فرهنگی */}
      {!embeddedMode ? (
      <div className="bg-gradient-to-r from-fuchsia-800 via-purple-800 to-indigo-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/15 text-fuchsia-100 text-[11px] font-bold mb-1">
                {staff.department || 'واحد امور فرهنگی و اجتماعی سراها'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black">
                کارتابل امور فرهنگی، برنامه‌های هفتگی و تشکل‌ها
              </h2>
              <p className="text-xs text-fuchsia-100/90 mt-1">
                خوش آمدید {staff.fullName} • برنامه‌های تأییدشده بلافاصله در کارتابل دانشجویان نمایش داده می‌شوند
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openAddProgramModal('saturday')}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ ثبت برنامه در جدول زمانی هفتگی</span>
            </button>

            <button
              onClick={onOpenMessages}
              className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>پیام‌رسان ({unreadCulturalMessagesCount})</span>
            </button>

            <button
              onClick={onOpenChangePassword}
              className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>تغییر رمز</span>
            </button>

            {onOpenUserGuide && (
              <button
                onClick={() => onOpenUserGuide('cultural')}
                className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>راهنما</span>
              </button>
            )}
          </div>
        </div>
      </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
            مدیریت جدول زمانی هفتگی برنامه‌های فرهنگی، تشکل‌ها و انجمن‌ها
          </div>
          <button
            onClick={() => openAddProgramModal('saturday')}
            className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ ثبت برنامه در جدول زمانی هفتگی</span>
          </button>
        </div>
      )}

      {/* کارت‌های شاخص کلیدی + اعلام حریم خصوصی */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500">کل برنامه‌های هفتگی</span>
          <div className="text-2xl font-black text-fuchsia-700 dark:text-fuchsia-400 mt-1 tabular-nums">
            {programs.length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500">تأیید و منتشرشده برای دانشجو</span>
          <div className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">
            {programs.filter((p) => p.status === 'approved').length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500">تشکل‌ها و انجمن‌ها</span>
          <div className="text-2xl font-black text-purple-600 mt-1 tabular-nums">
            {associations.length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500">درخواست عضویت در انتظار تأیید</span>
          <div className="text-2xl font-black text-amber-600 mt-1 tabular-nums">
            {pendingMemberships.length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold text-slate-500">پیام‌های فرهنگی خوانده‌نشده</span>
          <div className="text-2xl font-black text-sky-600 mt-1 tabular-nums">
            {unreadCulturalMessagesCount}
          </div>
        </div>
      </div>

      {/* اعلان تفکیک حریم خصوصی */}
      <div className="p-3.5 rounded-2xl bg-fuchsia-50/70 dark:bg-fuchsia-950/30 border border-fuchsia-200 dark:border-fuchsia-800/60 flex items-center gap-2.5 text-xs text-fuchsia-900 dark:text-fuchsia-200">
        <ShieldCheck className="w-4 h-4 text-fuchsia-600 shrink-0" />
        <span>
          مطابق اصل تفکیک دسترسی‌ها و حفظ حریم خصوصی، این کارتابل منحصراً جهت برنامه‌ریزی فرهنگی هفتگی، مدیریت تشکل‌ها و پاسخ به پیام‌های فرهنگی دانشجویان طراحی شده و اطلاعات شخصی یا خوابگاهی دانشجویان در آن نمایش داده نمی‌شود.
        </span>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold border ${
            feedback.ok
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200'
          }`}
        >
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* تب‌های امور فرهنگی */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl">
        <button
          onClick={() => setActiveTab('timetable')}
          className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'timetable'
              ? 'bg-white dark:bg-slate-900 text-fuchsia-700 dark:text-fuchsia-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>جدول زمانی هفتگی (برنامه کلاسی)</span>
        </button>

        <button
          onClick={() => setActiveTab('associations')}
          className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'associations'
              ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>تشکل‌ها و انجمن‌های دانشجویی</span>
          {pendingMemberships.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
              {pendingMemberships.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>گزارش‌گیری و اکسل</span>
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'messages'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>پیام‌های دانشجویان</span>
          {unreadCulturalMessagesCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-sky-600 text-white text-[10px] font-black">
              {unreadCulturalMessagesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('clearance')}
          className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'clearance'
              ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>تسویه حساب فارغ‌التحصیلان</span>
          {Storage.getGraduationClearances().filter((c) => c.educationGateStatus === 'approved' && (c.units?.cultural?.status || 'pending') === 'pending').length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
              {Storage.getGraduationClearances().filter((c) => c.educationGateStatus === 'approved' && (c.units?.cultural?.status || 'pending') === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* تب ۱: جدول زمانی هفتگی شبیه برنامه کلاسی */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={dormFilter}
                onChange={(e) => setDormFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">همه سراهای دانشجویی</option>
                {dorms.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">همه حوزه‌های موضوعی</option>
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'approved' | 'draft')}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="approved">تأییدشده (نمایش در پنل دانشجو)</option>
                <option value="draft">پیش‌نویس (منتظر تأیید)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openAddProgramModal('saturday')}
                className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت برنامه جدید</span>
              </button>
              <button
                onClick={() => exportCulturalProgramsToExcel(filteredPrograms)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>اکسل</span>
              </button>
            </div>
          </div>

          {/* نمای جدولی برنامه کلاسی به تفکیک روزهای هفته */}
          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day) => {
              const dayItems = filteredPrograms
                .filter((p) => p.dayOfWeek === day.key)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

              return (
                <div
                  key={day.key}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
                >
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-fuchsia-600 text-white text-xs font-black">
                        {day.label}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {dayItems.length} برنامه ثبت‌شده
                      </span>
                    </div>
                    <button
                      onClick={() => openAddProgramModal(day.key)}
                      className="text-xs font-bold text-fuchsia-700 dark:text-fuchsia-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن به {day.label}</span>
                    </button>
                  </div>

                  {dayItems.length === 0 ? (
                    <div className="p-4 text-xs text-slate-400 text-center">
                      برنامه‌ای برای روز {day.label} ثبت نشده است.
                    </div>
                  ) : (
                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dayItems.map((prg) => {
                        const catObj = CATEGORIES.find((c) => c.key === prg.category);
                        return (
                          <div
                            key={prg.id}
                            className={`p-3.5 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                              prg.status === 'approved'
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-800/50'
                                : 'bg-amber-50/40 dark:bg-amber-950/15 border-amber-200 dark:border-amber-800/50'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                                    catObj?.badgeCls || 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {catObj?.label || prg.category}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                                    prg.status === 'approved'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-amber-500 text-slate-950'
                                  }`}
                                >
                                  {prg.status === 'approved' ? 'تأیید و منتشرشده' : 'پیش‌نویس'}
                                </span>
                              </div>

                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                {prg.title}
                              </h4>

                              <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                                <div className="flex items-center gap-1.5 font-bold text-fuchsia-700 dark:text-fuchsia-300 tabular-nums">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>
                                    ساعت {prg.startTime} تا {prg.endTime}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  <span>
                                    {prg.dormName} • {prg.location}
                                  </span>
                                </div>
                                {prg.presenter && (
                                  <div className="flex items-center gap-1.5">
                                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                                    <span>مجری / استاد: {prg.presenter}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-200/70 dark:border-slate-700/60">
                              <button
                                onClick={() => handleToggleProgramApproval(prg.id)}
                                className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                                  prg.status === 'approved'
                                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                              >
                                {prg.status === 'approved'
                                  ? 'بازگشت به پیش‌نویس'
                                  : 'تأیید و انتشار برای دانشجویان'}
                              </button>
                              <button
                                onClick={() => openEditProgramModal(prg)}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                                title="ویرایش"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProgram(prg.id)}
                                className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* تب ۲: تشکل‌ها و انجمن‌های دانشجویی و تأیید عضویت */}
      {activeTab === 'associations' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                مدیریت تشکل‌ها، کانون‌ها و انجمن‌های فرهنگی دانشجویی
              </h3>
              <p className="text-xs text-slate-500">
                امکان عضویت مستقیم یا ثبت درخواست عضویت با تأیید امور فرهنگی
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openAddAssocModal}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ ایجاد تشکل / انجمن جدید</span>
              </button>
              <button
                onClick={() => exportCulturalAssociationsToExcel(associations, memberships)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>اکسل تشکل‌ها و اعضا</span>
              </button>
            </div>
          </div>

          {/* صف درخواست‌های عضویت نیازمند بررسی */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-600" />
              <span>درخواست‌های عضویت دانشجویان در تشکل‌ها ({memberships.length})</span>
            </h4>

            {memberships.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                هنوز درخواست عضویتی ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-2.5">
                {memberships.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {m.studentName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">({m.studentId})</span>
                        <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 text-[10px] font-bold">
                          تشکل: {m.associationName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                            m.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {m.status === 'approved'
                            ? 'تأییدشده'
                            : m.status === 'pending'
                            ? 'در انتظار تأیید'
                            : 'رد شده'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        رشته: {m.studentFieldOfStudy || '-'} • ورودی: {m.studentEntryTerm || '-'} • تاریخ: {m.requestedAt}
                      </p>
                      {m.requestNote && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                          یادداشت متقاضی: {m.requestNote}
                        </p>
                      )}
                    </div>

                    {m.status === 'pending' && (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={reviewNotes[m.id] || ''}
                          onChange={(e) =>
                            setReviewNotes((prev) => ({ ...prev, [m.id]: e.target.value }))
                          }
                          placeholder="یادداشت اختیاری..."
                          className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        />
                        <button
                          onClick={() => handleReviewMembership(m.id, 'approved')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>تأیید عضویت</span>
                        </button>
                        <button
                          onClick={() => handleReviewMembership(m.id, 'rejected')}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>رد درخواست</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* فهرست تشکل‌ها */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {associations.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl p-8 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800">
                هنوز هیچ تشکل یا انجمن دانشجویی ایجاد نشده است.
              </div>
            ) : (
              associations.map((a) => {
                const approvedCount = memberships.filter(
                  (m) => m.associationId === a.id && m.status === 'approved'
                ).length;
                const pendingCount = memberships.filter(
                  (m) => m.associationId === a.id && m.status === 'pending'
                ).length;
                return (
                  <div
                    key={a.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono font-bold text-purple-600">
                          {a.associationCode}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            a.membershipMode === 'open_instant'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {a.membershipMode === 'open_instant'
                            ? 'عضویت آزاد مستقیم'
                            : 'نیازمند تأیید امور فرهنگی'}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {a.name}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {a.description}
                      </p>
                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        {a.mentorName && <div>مسئول / استاد راهنما: {a.mentorName}</div>}
                        {a.meetingSchedule && <div>زمان جلسات: {a.meetingSchedule}</div>}
                        <div>
                          اعضای رسمی: <strong className="text-emerald-600">{approvedCount}</strong> نفر
                          {pendingCount > 0 && (
                            <span className="mr-2 text-amber-600 font-bold">
                              ({pendingCount} در انتظار)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => openEditAssocModal(a)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => {
                          Storage.deleteCulturalAssociation(a.id);
                          setFeedback({ ok: true, msg: 'تشکل حذف شد.' });
                          reloadLocal();
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* تب ۳: گزارش‌گیری تحلیلی و اکسل امور فرهنگی */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                گزارش‌گیری جامع برنامه‌های فرهنگی و تشکل‌ها
              </h3>
              <p className="text-xs text-slate-500">
                گزارش آماری به تفکیک روز هفته، حوزه موضوعی و وضعیت عضویت در تشکل‌ها
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => exportCulturalProgramsToExcel(programs)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>اکسل برنامه‌ها</span>
              </button>
              <button
                onClick={() => exportCulturalAssociationsToExcel(associations, memberships)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>اکسل تشکل‌ها و اعضا</span>
              </button>
              <button
                onClick={handlePrintCulturalReport}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>چاپ / PDF گزارش</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                توزیع برنامه‌ها بر اساس حوزه‌های موضوعی
              </h4>
              {CATEGORIES.map((cat) => {
                const count = programs.filter((p) => p.category === cat.key).length;
                const approved = programs.filter(
                  (p) => p.category === cat.key && p.status === 'approved'
                ).length;
                return (
                  <div
                    key={cat.key}
                    className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 dark:border-slate-700/60 last:border-0"
                  >
                    <span>{cat.label}</span>
                    <span className="font-bold tabular-nums">
                      {count} برنامه ({approved} تأییدشده)
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                آمار روزانه جدول زمانی هفته
              </h4>
              {DAYS_OF_WEEK.map((d) => {
                const count = programs.filter((p) => p.dayOfWeek === d.key).length;
                return (
                  <div
                    key={d.key}
                    className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 dark:border-slate-700/60 last:border-0"
                  >
                    <span>{d.label}</span>
                    <span className="font-bold tabular-nums">{count} برنامه</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* تب ۴: پیام‌های فرهنگی دانشجویان */}
      {activeTab === 'messages' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                پیام‌های فرهنگی و تشکل‌های دانشجویان ({culturalMessages.length})
              </h3>
              <p className="text-xs text-slate-500">
                دریافت پیام‌های فرهنگی دانشجویان و ارسال پاسخ مستقیم (بدون نمایش پرونده شخصی و اسکان)
              </p>
            </div>
            <button
              onClick={onOpenMessages}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>باز کردن پنجره کامل پیام‌رسان</span>
            </button>
          </div>

          {culturalMessages.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              هیچ پیام فرهنگی ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-3">
              {culturalMessages.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {m.subject}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        از: {m.senderName}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{m.date}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {m.content}
                  </p>
                  {m.replies && m.replies.length > 0 && (
                    <div className="space-y-1.5 pr-3 border-r-2 border-fuchsia-400">
                      {m.replies.map((r) => (
                        <div
                          key={r.id}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                        >
                          <div className="font-bold text-fuchsia-700 dark:text-fuchsia-300 text-[11px]">
                            {r.senderName} • {r.date}
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 mt-1">{r.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {replyTargetId === m.id ? (
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="متن پاسخ خود را بنویسید..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                      <button
                        onClick={() => handleReplyMessage(m.id)}
                        className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>ارسال پاسخ</span>
                      </button>
                      <button
                        onClick={() => setReplyTargetId(null)}
                        className="px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        انصراف
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setReplyTargetId(m.id);
                        setReplyText('');
                      }}
                      className="px-3 py-1.5 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>ارسال پاسخ</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* مودال ثبت / ویرایش برنامه هفتگی */}
      {isProgramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
            <div className="p-5 bg-fuchsia-700 text-white flex items-center justify-between">
              <h3 className="font-black text-base">
                {editingProgram ? 'ویرایش برنامه فرهنگی' : 'ثبت برنامه در جدول زمانی هفتگی (برنامه کلاسی)'}
              </h3>
              <button onClick={() => setIsProgramModalOpen(false)} className="p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1">عنوان برنامه فرهنگی / اجتماعی *</label>
                <input
                  type="text"
                  required
                  value={prgTitle}
                  onChange={(e) => setPrgTitle(e.target.value)}
                  placeholder="مثلاً: محفل انس با قرآن، کارگاه فن بیان معلمی، شب شعر..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">روز هفته *</label>
                  <select
                    value={prgDay}
                    onChange={(e) => setPrgDay(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">حوزه موضوعی *</label>
                  <select
                    value={prgCat}
                    onChange={(e) => setPrgCat(e.target.value as CulturalProgramCategory)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">ساعت شروع *</label>
                  <PersianTimePicker
                    required
                    value={prgStartTime}
                    onChange={setPrgStartTime}
                    placeholder="۱۶:۰۰"
                    digits="fa"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">ساعت پایان *</label>
                  <PersianTimePicker
                    required
                    value={prgEndTime}
                    onChange={setPrgEndTime}
                    placeholder="۱۷:۳۰"
                    digits="fa"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">سرای هدف</label>
                  <select
                    value={prgDormId}
                    onChange={(e) => setPrgDormId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="all">همه سراهای دانشجویی</option>
                    {dorms.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">مکان برگزاری *</label>
                  <input
                    type="text"
                    required
                    value={prgLocation}
                    onChange={(e) => setPrgLocation(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">مجری / استاد / سخنران</label>
                  <input
                    type="text"
                    value={prgPresenter}
                    onChange={(e) => setPrgPresenter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">وضعیت انتشار در کارتابل دانشجو</label>
                  <select
                    value={prgStatus}
                    onChange={(e) => setPrgStatus(e.target.value as 'draft' | 'approved')}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="approved">تأیید و نمایش فوری برای دانشجویان</option>
                    <option value="draft">ذخیره به عنوان پیش‌نویس (مخفی برای دانشجو)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">توضیحات تکمیلی</label>
                <textarea
                  rows={2}
                  value={prgDesc}
                  onChange={(e) => setPrgDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProgramModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold cursor-pointer"
                >
                  {editingProgram ? 'ذخیره تغییرات' : 'ثبت در جدول زمانی'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال ایجاد / ویرایش تشکل یا انجمن */}
      {isAssocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
            <div className="p-5 bg-purple-700 text-white flex items-center justify-between">
              <h3 className="font-black text-base">
                {editingAssoc ? 'ویرایش تشکل / انجمن' : 'ایجاد تشکل یا انجمن دانشجویی جدید'}
              </h3>
              <button onClick={() => setIsAssocModalOpen(false)} className="p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssoc} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1">نام تشکل / انجمن / کانون *</label>
                <input
                  type="text"
                  required
                  value={assocName}
                  onChange={(e) => setAssocName(e.target.value)}
                  placeholder="مثلاً: کانون قرآن و عترت، انجمن علمی معلمان آینده..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">حوزه فعالیت</label>
                  <select
                    value={assocCat}
                    onChange={(e) => setAssocCat(e.target.value as CulturalProgramCategory)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">نحوه عضویت دانشجویان</label>
                  <select
                    value={assocMode}
                    onChange={(e) =>
                      setAssocMode(e.target.value as 'open_instant' | 'requires_approval')
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="requires_approval">ثبت درخواست (نیازمند تأیید امور فرهنگی)</option>
                    <option value="open_instant">عضویت آزاد مستقیم</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">مسئول / استاد راهنما</label>
                  <input
                    type="text"
                    value={assocMentor}
                    onChange={(e) => setAssocMentor(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">سقف ظرفیت (اختیاری)</label>
                  <input
                    type="number"
                    min={0}
                    value={assocCapacity}
                    onChange={(e) => setAssocCapacity(e.target.value)}
                    placeholder="نامحدود"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">برنامه جلسات</label>
                  <input
                    type="text"
                    value={assocSchedule}
                    onChange={(e) => setAssocSchedule(e.target.value)}
                    placeholder="مثلاً: دوشنبه‌ها ساعت ۱۸"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">سرای هدف</label>
                  <select
                    value={assocDormId}
                    onChange={(e) => setAssocDormId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="all">کل سراهای پردیس</option>
                    {dorms.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">شرح اهداف و فعالیت‌های تشکل</label>
                <textarea
                  rows={3}
                  value={assocDesc}
                  onChange={(e) => setAssocDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssocModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer"
                >
                  {editingAssoc ? 'ذخیره تغییرات' : 'ایجاد تشکل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'clearance' && (
        <GraduationClearanceReviewPanel
          unitRole="cultural"
          reviewerId={staff.id}
          reviewerName={staff.fullName}
          settings={Storage.getSettings()}
          onDataChange={onRefreshData}
        />
      )}
    </div>
  );
};
