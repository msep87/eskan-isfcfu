import React, { useMemo, useState } from 'react';
import {
  CommunityChatBan,
  CommunityChatReport,
  CommunityChatSettings,
  CommunityForum,
  CommunityPrivateChatScope,
  CurrentUser,
  Student,
} from '../types';
import { Storage, normalizePersianSearch } from '../utils/storage';
import {
  ALL_VOICE_CALL_ROLE_OPTIONS,
  FORUM_CATEGORIES_META,
  PUBLIC_FORUM_ID,
} from '../utils/communityStickers';
import {
  Settings,
  ShieldCheck,
  ShieldAlert,
  Ban,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Trash2,
  Eye,
  Plus,
  Search,
  AlertTriangle,
  Image as ImageIcon,
  Smile,
  MessageSquare,
  Users,
  Power,
  Save,
  UserX,
  UserCheck,
  Hash,
  FileWarning,
  Database,
  Eraser,
  Briefcase,
  Mic,
  PhoneCall,
  PhoneOff,
} from 'lucide-react';

interface CommunityModerationPanelProps {
  currentUser: NonNullable<CurrentUser>;
  chatSettings: CommunityChatSettings;
  forums: CommunityForum[];
  bans: CommunityChatBan[];
  reports: CommunityChatReport[];
  students: Student[];
  onRefresh: () => void;
  onJumpToRoom: (roomId: string, roomType: 'public' | 'forum' | 'dm') => void;
  onOpenCreateForum: () => void;
  onNotify: (msg: string, tone?: 'success' | 'error') => void;
}

type ModSubTab = 'settings' | 'approvals' | 'bans' | 'reports';

export const CommunityModerationPanel: React.FC<CommunityModerationPanelProps> = ({
  currentUser,
  chatSettings,
  forums,
  bans,
  reports,
  students,
  onRefresh,
  onJumpToRoom,
  onOpenCreateForum,
  onNotify,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const isSecurity = currentUser.role === 'security';
  const isViceDean = currentUser.role === 'vice_dean';

  const actorMeta = useMemo(() => {
    if (currentUser.role === 'admin') {
      return {
        id: currentUser.username,
        name: currentUser.name || 'مدیر کل سامانه',
        role: 'admin' as const,
      };
    }
    if (currentUser.role === 'security') {
      return {
        id: currentUser.staff.id,
        name: currentUser.staff.fullName,
        role: 'security' as const,
      };
    }
    if (currentUser.role === 'vice_dean') {
      return {
        id: currentUser.staff.id,
        name: currentUser.staff.fullName,
        role: 'vice_dean' as const,
      };
    }
    return { id: 'mod', name: 'ناظر سامانه', role: 'admin' as const };
  }, [currentUser]);

  const [subTab, setSubTab] = useState<ModSubTab>(isAdmin ? 'settings' : 'approvals');
  const [draftSettings, setDraftSettings] = useState<CommunityChatSettings>({ ...chatSettings });
  const [newBannedWord, setNewBannedWord] = useState('');

  // وضعیت رد تالار
  const [rejectingForumId, setRejectingForumId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [forumStatusFilter, setForumStatusFilter] = useState<'all' | 'pending' | 'active' | 'rejected' | 'suspended'>('all');

  // وضعیت مسدودسازی دانشجو
  const [banSearch, setBanSearch] = useState('');
  const [selectedStudentForBan, setSelectedStudentForBan] = useState<{
    studentId: string;
    fullName: string;
    fieldOfStudy?: string;
  } | null>(null);
  const [banScope, setBanScope] = useState<'all' | 'private_only' | 'forums_only'>('all');
  const [banReason, setBanReason] = useState('');
  const [isLookingUpStudent, setIsLookingUpStudent] = useState(false);

  // مودال تأیید عملیات پاکسازی و حذف (بدون استفاده از window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  const [statsRefreshTick, setStatsRefreshTick] = useState(0);

  const storageStats = useMemo(() => {
    const allMsgs = Storage.getCommunityChatMessages();
    const publicMsgs = allMsgs.filter((m) => m.roomId === PUBLIC_FORUM_ID || m.roomType === 'public').length;
    const dmMsgs = allMsgs.filter((m) => m.roomType === 'dm').length;
    const forumMsgs = allMsgs.filter((m) => m.roomType === 'forum').length;
    const specializedForums = forums.filter((f) => !f.isPublicForum && f.id !== PUBLIC_FORUM_ID).length;
    const approxKb = Math.max(
      1,
      Math.round((JSON.stringify(allMsgs).length + JSON.stringify(forums).length) / 1024)
    );
    return {
      totalMsgs: allMsgs.length,
      publicMsgs,
      dmMsgs,
      forumMsgs,
      specializedForums,
      approxKb,
    };
  }, [forums, reports, chatSettings, statsRefreshTick]);

  // همگام‌سازی draftSettings وقتی chatSettings تغییر می‌کند
  React.useEffect(() => {
    setDraftSettings({ ...chatSettings });
  }, [chatSettings]);

  const pendingForumsCount = useMemo(() => {
    return forums.filter((f) => {
      if (f.isPublicForum || f.id === PUBLIC_FORUM_ID) return false;
      if (f.status !== 'pending') return false;
      if (isAdmin) return f.adminApproval.status === 'pending';
      if (isSecurity) return f.securityApproval.status === 'pending';
      return true;
    }).length;
  }, [forums, isAdmin, isSecurity]);

  const pendingReportsCount = useMemo(
    () => reports.filter((r) => r.status === 'pending').length,
    [reports]
  );

  const activeBansCount = useMemo(() => bans.filter((b) => b.isActive).length, [bans]);

  const filteredForums = useMemo(() => {
    return forums
      .filter((f) => !f.isPublicForum && f.id !== PUBLIC_FORUM_ID)
      .filter((f) => (forumStatusFilter === 'all' ? true : f.status === forumStatusFilter));
  }, [forums, forumStatusFilter]);

  const matchedStudentsForBan = useMemo(() => {
    const q = normalizePersianSearch(banSearch);
    if (!q || q.length < 2) return [];
    return students
      .filter((s) =>
        normalizePersianSearch(`${s.fullName} ${s.studentId} ${s.fieldOfStudy}`).includes(q)
      )
      .slice(0, 8);
  }, [students, banSearch]);

  const handleSaveSettings = (nextObj?: CommunityChatSettings) => {
    if (!isAdmin) return;
    const toSave = nextObj || draftSettings;
    Storage.setCommunityChatSettings(toSave, actorMeta.name);
    // همگام‌سازی قفل تالار عمومی با تنظیم isPublicForumOpen
    const pubForum = Storage.getCommunityForums().find((f) => f.id === PUBLIC_FORUM_ID);
    if (pubForum && Boolean(pubForum.isClosed) === toSave.isPublicForumOpen) {
      Storage.toggleCommunityForumLock(PUBLIC_FORUM_ID, {
        isClosed: !toSave.isPublicForumOpen,
        actorName: actorMeta.name,
      });
    }
    onRefresh();
    onNotify('تنظیمات کامل پیام‌رسان و تالارهای گفتگو با موفقیت ذخیره و اعمال شد.', 'success');
  };

  const quickToggle = (key: keyof CommunityChatSettings) => {
    if (!isAdmin) return;
    const defaultTrue =
      key === 'isStaffChatEnabled' || key === 'allowVoiceMessages' || key === 'allowLiveVoiceCall';
    const currentVal =
      draftSettings[key] === undefined ? defaultTrue : Boolean(draftSettings[key]);
    const updated = { ...draftSettings, [key]: !currentVal };
    setDraftSettings(updated);
    handleSaveSettings(updated);
  };

  const handleAddBannedKeyword = () => {
    const word = newBannedWord.trim();
    if (!word) return;
    if (draftSettings.bannedKeywords.includes(word)) {
      setNewBannedWord('');
      return;
    }
    const updated = {
      ...draftSettings,
      bannedKeywords: [...draftSettings.bannedKeywords, word],
    };
    setDraftSettings(updated);
    setNewBannedWord('');
  };

  const handleRemoveBannedKeyword = (word: string) => {
    setDraftSettings((prev) => ({
      ...prev,
      bannedKeywords: prev.bannedKeywords.filter((w) => w !== word),
    }));
  };

  const handleReviewForum = (
    forumId: string,
    decision: 'approved' | 'rejected',
    note?: string
  ) => {
    if (!isAdmin && !isSecurity) return;
    const res = Storage.reviewCommunityForumRequest(forumId, {
      reviewerRole: isAdmin ? 'admin' : 'security',
      reviewerId: actorMeta.id,
      reviewerName: actorMeta.name,
      decision,
      note,
    });
    if (!res.success) {
      onNotify(res.message, 'error');
      return;
    }
    setRejectingForumId(null);
    setRejectReason('');
    onRefresh();
    onNotify(res.message, 'success');
  };

  const handleLookupDirectBanStudent = async () => {
    if (!banSearch.trim()) return;
    setIsLookingUpStudent(true);
    const res = await Storage.lookupStudentPublicProfileById(banSearch.trim());
    setIsLookingUpStudent(false);
    if (res.found && res.profile) {
      setSelectedStudentForBan({
        studentId: res.profile.studentId,
        fullName: res.profile.fullName,
        fieldOfStudy: res.profile.fieldOfStudy,
      });
    } else {
      onNotify(res.error || 'دانشجویی با این مشخصات یافت نشد.', 'error');
    }
  };

  const handleSubmitBan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForBan) {
      onNotify('لطفاً ابتدا دانشجوی مورد نظر را انتخاب کنید.', 'error');
      return;
    }
    const res = Storage.banStudentFromChat({
      studentId: selectedStudentForBan.studentId,
      studentName: selectedStudentForBan.fullName,
      studentFieldOfStudy: selectedStudentForBan.fieldOfStudy,
      reason: banReason,
      scope: banScope,
      bannedById: actorMeta.id,
      bannedByName: actorMeta.name,
      bannedByRole: actorMeta.role,
    });
    if (!res.success) {
      onNotify(res.message, 'error');
      return;
    }
    setSelectedStudentForBan(null);
    setBanReason('');
    setBanSearch('');
    onRefresh();
    onNotify(res.message, 'success');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/70 dark:bg-slate-950/60 overflow-hidden" dir="rtl">
      {/* نوار تب‌های مدیریت و نظارت */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex flex-wrap items-center gap-1.5">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setSubTab('settings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                subTab === 'settings'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>تنظیمات کامل پیام‌رسان</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSubTab('approvals')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
              subTab === 'approvals'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>تالارها و تأیید درخواست‌ها</span>
            {pendingForumsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                {pendingForumsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('bans')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
              subTab === 'bans'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>مسدودسازی کاربران</span>
            {activeBansCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                {activeBansCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('reports')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
              subTab === 'reports'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>گزارش‌های تخلف</span>
            {pendingReportsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                {pendingReportsCount}
              </span>
            )}
          </button>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={onOpenCreateForum}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ایجاد تالار تخصصی جدید</span>
          </button>
        )}
      </div>

      {/* محتوای تب انتخابی */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* ================= تب ۱: تنظیمات کامل مدیر ================= */}
        {subTab === 'settings' && isAdmin && (
          <div className="space-y-5 max-w-4xl mx-auto">
            {/* کلید اصلی سامانه */}
            <div
              className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                draftSettings.isChatSystemEnabled
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    draftSettings.isChatSystemEnabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    کلید اصلی سامانه چت، پیام‌رسان و تالارهای گفتگو
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {draftSettings.isChatSystemEnabled
                      ? 'سامانه گفتگو هم‌اکنون فعال است و تابع تنظیمات زیر می‌باشد.'
                      : 'کل سامانه چت و ایجاد تالار توسط شما موقتاً بسته شده است.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => quickToggle('isChatSystemEnabled')}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-sm cursor-pointer shrink-0 ${
                  draftSettings.isChatSystemEnabled
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {draftSettings.isChatSystemEnabled ? 'بستن کامل سامانه چت' : 'باز کردن سامانه چت'}
              </button>
            </div>

            {/* کارت‌های سوییچ سریع */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {[
                {
                  key: 'isPublicForumOpen' as const,
                  title: 'تالار گفتگوی عمومی دانشگاه',
                  desc: 'در صورت باز بودن، همه کاربران و دانشجویان می‌توانند در تالار عمومی گفتگو کنند؛ در صورت بسته شدن هیچ‌کس نمی‌تواند پیامی ارسال کند.',
                  icon: <Users className="w-4 h-4 text-teal-600" />,
                  onLabel: 'باز برای همه کاربران',
                  offLabel: 'بسته (فقط خواندنی)',
                },
                {
                  key: 'isPrivateChatEnabled' as const,
                  title: 'چت خصوصی دانشجو به دانشجو (با شماره دانشجویی)',
                  desc: 'با فعال کردن این کلید، دانشجویان می‌توانند صرفاً با وارد کردن شماره دانشجویی یکدیگر پیام خصوصی ارسال کنند.',
                  icon: <MessageSquare className="w-4 h-4 text-indigo-600" />,
                  onLabel: 'مجاز و باز',
                  offLabel: 'بسته (غیرفعال)',
                },
                {
                  key: 'isGroupCreationEnabled' as const,
                  title: 'درخواست ایجاد تالار تخصصی و گروه توسط دانشجویان',
                  desc: 'اجازه ثبت درخواست تالار تخصصی جدید (ایجاد نهایی همچنان نیازمند تأیید مدیر و حراست است).',
                  icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
                  onLabel: 'درخواست‌دهی فعال',
                  offLabel: 'درخواست‌دهی بسته',
                },
                {
                  key: 'allowPhotosInForums' as const,
                  title: 'مجوز ارسال عکس در تالارها و گروه‌ها',
                  desc: 'ارسال تصویر در تالار عمومی و گروه‌های تخصصی صرفاً در صورت فعال بودن این کلید ممکن است.',
                  icon: <ImageIcon className="w-4 h-4 text-sky-600" />,
                  onLabel: 'ارسال عکس مجاز',
                  offLabel: 'ارسال عکس ممنوع',
                },
                {
                  key: 'allowPhotosInPrivateChat' as const,
                  title: 'مجوز ارسال عکس در چت خصوصی دانشجویی',
                  desc: 'کنترل مجزای ارسال تصویر در پیام‌های خصوصی بین دانشجویان.',
                  icon: <ImageIcon className="w-4 h-4 text-violet-600" />,
                  onLabel: 'ارسال عکس مجاز',
                  offLabel: 'ارسال عکس ممنوع',
                },
                {
                  key: 'allowStickers' as const,
                  title: 'مجوز ارسال استیکر در تالارها و گفتگوها',
                  desc: 'فعال یا غیرفعال‌سازی بسته استیکرهای دانشگاهی در تمامی تالارها و چت‌ها.',
                  icon: <Smile className="w-4 h-4 text-amber-600" />,
                  onLabel: 'استیکر مجاز',
                  offLabel: 'استیکر غیرفعال',
                },
                {
                  key: 'requireRulesAcceptance' as const,
                  title: 'الزام تأیید تعهدنامه قوانین پیش از گفتگو',
                  desc: 'نمایش تعهدنامه ممنوعیت بحث‌های سیاسی، توهین و موارد خلاف قانون در اولین ورود دانشجو.',
                  icon: <FileWarning className="w-4 h-4 text-rose-600" />,
                  onLabel: 'الزامی',
                  offLabel: 'اختیاری',
                },
                {
                  key: 'isStaffChatEnabled' as const,
                  title: 'چت خصوصی و گروه‌های داخلی کارکنان',
                  desc: 'امکان انتخاب همکار از فهرست کارکنان برای گفتگوی خصوصی و ایجاد گروه/تالار داخلی ویژه کارکنان دانشگاه.',
                  icon: <Briefcase className="w-4 h-4 text-violet-600" />,
                  onLabel: 'فعال برای کارکنان',
                  offLabel: 'بسته (غیرفعال)',
                  defaultTrue: true,
                },
                {
                  key: 'allowVoiceMessages' as const,
                  title: 'ضبط و ارسال پیام صوتی (ویس) در گفتگوها',
                  desc: 'امکان ضبط مستقیم صدا با میکروفون و ارسال پیام صوتی (مشابه واتساپ/تلگرام) در چت‌ها و تالارها.',
                  icon: <Mic className="w-4 h-4 text-teal-600" />,
                  onLabel: 'پیام صوتی مجاز',
                  offLabel: 'پیام صوتی بسته',
                  defaultTrue: true,
                },
                {
                  key: 'allowLiveVoiceCall' as const,
                  title: 'گفتگوی صوتی مستقیم زنده (تماس صوتی)',
                  desc: 'امکان برقراری تماس صوتی مستقیم دونفره در چت خصوصی و اتاق گفتگوی صوتی زنده در گروه‌ها و تالارها.',
                  icon: <PhoneCall className="w-4 h-4 text-emerald-600" />,
                  onLabel: 'تماس زنده مجاز',
                  offLabel: 'تماس زنده بسته',
                  defaultTrue: true,
                },
                {
                  key: 'onlyAdmittedStudentsCanChat' as const,
                  title: 'محدودسازی گفتگو به دانشجویان پذیرش‌شده',
                  desc: 'در صورت فعال بودن، دانشجویان دارای برچسب «پذیرش نشده» تا تکمیل پذیرش امکان ارسال پیام نخواهند داشت.',
                  icon: <UserCheck className="w-4 h-4 text-cyan-600" />,
                  onLabel: 'فقط پذیرش‌شده‌ها',
                  offLabel: 'همه دانشجویان',
                },
              ].map((item) => {
                const rawVal = draftSettings[item.key];
                const active =
                  rawVal === undefined ? Boolean('defaultTrue' in item && item.defaultTrue) : Boolean(rawVal);
                return (
                  <div
                    key={item.key}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                          {item.icon}
                        </div>
                        <h5 className="text-xs font-extrabold text-slate-900 dark:text-white leading-5">
                          {item.title}
                        </h5>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                          active
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {active ? item.onLabel : item.offLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-5">
                      {item.desc}
                    </p>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => quickToggle(item.key)}
                        className={`px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold transition cursor-pointer ${
                          active
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {active ? 'بستن / غیرفعال کردن' : 'باز کردن / فعال‌سازی'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* کنترل دقیق دسترسی به تماس صوتی مستقیم (همه کاربران و تفکیک هر نوع کاربری) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-200/80 dark:border-emerald-900/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      draftSettings.allowLiveVoiceCall !== false
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                    }`}
                  >
                    {draftSettings.allowLiveVoiceCall !== false ? (
                      <PhoneCall className="w-5 h-5" />
                    ) : (
                      <PhoneOff className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      کنترل دسترسی به تماس صوتی مستقیم (همه کاربران و به تفکیک هر نوع کاربری)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-5">
                      می‌توانید تماس صوتی را به‌صورت کلی برای همه باز یا بسته کنید، یا برای هر نقش کاربری (دانشجویان و هریک از واحدهای کارکنان) به‌صورت جداگانه مجوز تماس صوتی را کنترل نمایید.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const next: CommunityChatSettings = {
                        ...draftSettings,
                        allowLiveVoiceCall: true,
                        voiceCallBlockedRoles: [],
                      };
                      setDraftSettings(next);
                      Storage.saveCommunityChatSettings(next, actorMeta.name);
                      onRefresh();
                      onNotify('دسترسی تماس صوتی برای همه کاربران و تمام نقش‌ها باز شد.', 'success');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold cursor-pointer transition"
                  >
                    باز برای همه
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next: CommunityChatSettings = {
                        ...draftSettings,
                        allowLiveVoiceCall: false,
                      };
                      setDraftSettings(next);
                      Storage.saveCommunityChatSettings(next, actorMeta.name);
                      onRefresh();
                      onNotify('تماس صوتی مستقیم برای تمامی کاربران بسته شد.', 'success');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold cursor-pointer transition"
                  >
                    بستن برای همه
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next: CommunityChatSettings = {
                        ...draftSettings,
                        allowLiveVoiceCall: true,
                        voiceCallBlockedRoles: ['student'],
                      };
                      setDraftSettings(next);
                      Storage.saveCommunityChatSettings(next, actorMeta.name);
                      onRefresh();
                      onNotify('تماس صوتی فقط برای کارکنان باز و برای دانشجویان بسته شد.', 'success');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-extrabold cursor-pointer transition"
                  >
                    فقط کارکنان (بستن دانشجویان)
                  </button>
                </div>
              </div>

              {draftSettings.allowLiveVoiceCall === false && (
                <div className="px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] font-bold text-rose-800 dark:text-rose-200 flex items-center gap-2">
                  <PhoneOff className="w-4 h-4 shrink-0" />
                  <span>
                    کلید سراسری تماس صوتی در وضعیت «بسته» است و هیچ کاربری امکان برقراری تماس صوتی ندارد. برای تنظیم تفکیکی نقش‌ها، ابتدا کلید سراسری را باز کنید یا روی هر نقش زیر کلیک نمایید.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {ALL_VOICE_CALL_ROLE_OPTIONS.map((opt) => {
                  const blockedList = draftSettings.voiceCallBlockedRoles || [];
                  const isGlobalOpen = draftSettings.allowLiveVoiceCall !== false;
                  const isRoleAllowed = isGlobalOpen && !blockedList.includes(opt.role);

                  return (
                    <button
                      key={opt.role}
                      type="button"
                      onClick={() => {
                        const prevBlocked = draftSettings.voiceCallBlockedRoles || [];
                        let nextBlocked: string[];
                        let nextGlobal = draftSettings.allowLiveVoiceCall !== false;

                        if (!nextGlobal) {
                          // اگر سراسری بسته بود و مدیر یک نقش را باز کرد، سراسری را باز و بقیه نقش‌ها را مسدود می‌کنیم
                          nextGlobal = true;
                          nextBlocked = ALL_VOICE_CALL_ROLE_OPTIONS.map((r) => r.role).filter(
                            (r) => r !== opt.role
                          );
                        } else if (prevBlocked.includes(opt.role)) {
                          nextBlocked = prevBlocked.filter((r) => r !== opt.role);
                        } else {
                          nextBlocked = [...prevBlocked, opt.role];
                        }

                        const next: CommunityChatSettings = {
                          ...draftSettings,
                          allowLiveVoiceCall: nextGlobal,
                          voiceCallBlockedRoles: nextBlocked,
                        };
                        setDraftSettings(next);
                        Storage.saveCommunityChatSettings(next, actorMeta.name);
                        onRefresh();
                        onNotify(
                          nextBlocked.includes(opt.role)
                            ? `دسترسی تماس صوتی برای «${opt.label}» بسته شد.`
                            : `دسترسی تماس صوتی برای «${opt.label}» باز شد.`,
                          'success'
                        );
                      }}
                      className={`p-2.5 rounded-xl border text-right transition flex items-center justify-between gap-2 cursor-pointer ${
                        isRoleAllowed
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/70'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-rose-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-extrabold truncate">{opt.label}</div>
                        <div className="text-[10px] opacity-80">
                          {isRoleAllowed ? 'تماس صوتی باز' : 'تماس صوتی بسته'}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                          isRoleAllowed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                        }`}
                      >
                        {isRoleAllowed ? 'باز' : 'بسته'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* دامنه چت خصوصی، پیام پین‌شده، کلمات ممنوعه و متن قوانین */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 dark:text-white mb-1.5">
                    دامنه مجاز چت خصوصی دانشجو به دانشجو
                  </label>
                  <select
                    value={draftSettings.privateChatScope}
                    onChange={(e) =>
                      setDraftSettings((prev) => ({
                        ...prev,
                        privateChatScope: e.target.value as CommunityPrivateChatScope,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white"
                  >
                    <option value="all">همه دانشجویان با داشتن شماره دانشجویی</option>
                    <option value="same_field">فقط دانشجویان هم‌رشته</option>
                    <option value="same_entry">فقط دانشجویان هم‌ورودی</option>
                    <option value="same_dorm">فقط دانشجویان هم‌سرا (خوابگاهی)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 dark:text-white mb-1.5">
                    پیام پین‌شده بالای تالار گفتگوی عمومی
                  </label>
                  <input
                    type="text"
                    value={draftSettings.publicForumNotice || ''}
                    onChange={(e) =>
                      setDraftSettings((prev) => ({ ...prev, publicForumNotice: e.target.value }))
                    }
                    placeholder="پیام راهنما یا اطلاعیه ثابت در بالای تالار عمومی..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* فیلتر کلمات ممنوعه */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 dark:text-white mb-1.5">
                  فیلتر خودکار کلمات ممنوعه (مسدودسازی خودکار ارسال پیام)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newBannedWord}
                    onChange={(e) => setNewBannedWord(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBannedKeyword();
                      }
                    }}
                    placeholder="واژه ممنوعه را بنویسید و افزودن را بزنید..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddBannedKeyword}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                  >
                    افزودن واژه
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {draftSettings.bannedKeywords.map((word) => (
                    <span
                      key={word}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold"
                    >
                      {word}
                      <button
                        type="button"
                        onClick={() => handleRemoveBannedKeyword(word)}
                        className="hover:text-rose-900 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {draftSettings.bannedKeywords.length === 0 && (
                    <span className="text-[11px] text-slate-400">هیچ واژه فیلترشده‌ای ثبت نشده است.</span>
                  )}
                </div>
              </div>

              {/* متن تعهدنامه قوانین */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 dark:text-white mb-1.5">
                  متن منشور اخلاقی و قوانین سامانه چت و درخواست تالارها
                </label>
                <textarea
                  rows={5}
                  value={draftSettings.rulesText}
                  onChange={(e) =>
                    setDraftSettings((prev) => ({ ...prev, rulesText: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs leading-6 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500">
                  {chatSettings.updatedAt
                    ? `آخرین بروزرسانی: ${chatSettings.updatedAt} (${chatSettings.updatedBy || 'مدیر'})`
                    : 'آماده ذخیره‌سازی'}
                </span>
                <button
                  type="button"
                  onClick={() => handleSaveSettings()}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>ذخیره تنظیمات متنی و فیلترها</span>
                </button>
              </div>
            </div>

            {/* مدیریت حجم و پاکسازی سرور و دیتابیس پیام‌رسان (ویژه مدیر) */}
            <div className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/25 border-2 border-rose-200 dark:border-rose-900/70 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-rose-900 dark:text-rose-200">
                      پاکسازی و بهینه‌سازی فضای سرور و دیتابیس پیام‌رسان
                    </h4>
                    <p className="text-[11px] text-rose-700/90 dark:text-rose-300/90 mt-0.5">
                      برای جلوگیری از بار اضافی روی سرور و پایگاه داده، می‌توانید پیام‌ها، چت‌ها یا کل تالارهای تخصصی را به‌صورت کامل پاکسازی کنید.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-[11px] font-extrabold text-rose-700 dark:text-rose-300 shrink-0">
                  حجم تقریبی فعلی: ~{storageStats.approxKb.toLocaleString('fa-IR')} کیلوبایت
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500">کل پیام‌ها</div>
                  <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                    {storageStats.totalMsgs.toLocaleString('fa-IR')}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500">پیام تالار عمومی</div>
                  <div className="text-sm font-black text-teal-700 dark:text-teal-300 mt-0.5">
                    {storageStats.publicMsgs.toLocaleString('fa-IR')}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500">پیام چت خصوصی</div>
                  <div className="text-sm font-black text-violet-700 dark:text-violet-300 mt-0.5">
                    {storageStats.dmMsgs.toLocaleString('fa-IR')}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500">تالارهای تخصصی</div>
                  <div className="text-sm font-black text-indigo-700 dark:text-indigo-300 mt-0.5">
                    {storageStats.specializedForums.toLocaleString('fa-IR')} تالار
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmDialog({
                      title: 'پاکسازی پیام‌های تالار گفتگوی عمومی',
                      description:
                        'تمام پیام‌های ثبت‌شده در تالار گفتگوی عمومی به‌طور کامل از دیتابیس حذف می‌شوند. خود تالار عمومی باقی می‌ماند. ادامه می‌دهید؟',
                      confirmLabel: 'پاکسازی پیام‌های تالار عمومی',
                      onConfirm: () => {
                        const res = Storage.purgeCommunityChatData('public_messages', actorMeta.name);
                        onRefresh();
                        onNotify(res.message, 'success');
                      },
                    })
                  }
                  className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>پاکسازی پیام‌های تالار عمومی</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setConfirmDialog({
                      title: 'پاکسازی کامل همه چت‌های خصوصی دانشجویان',
                      description:
                        'تمام گفتگوهای خصوصی بین دانشجویان به‌صورت فیزیکی و غیرقابل بازگشت از سرور و دیتابیس پاک می‌شوند. ادامه می‌دهید؟',
                      confirmLabel: 'حذف کل چت‌های خصوصی',
                      onConfirm: () => {
                        const res = Storage.purgeCommunityChatData('all_dm_messages', actorMeta.name);
                        onRefresh();
                        onNotify(res.message, 'success');
                      },
                    })
                  }
                  className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-violet-50 dark:hover:bg-violet-950/40 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>حذف کل چت‌های خصوصی</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setConfirmDialog({
                      title: 'پاکسازی تمام پیام‌های کل تالارها و چت‌ها',
                      description:
                        'تمامی پیام‌ها در تالار عمومی، تالارهای تخصصی و چت‌های خصوصی پاک می‌شوند ولی ساختار تالارها حفظ می‌گردد. ادامه می‌دهید؟',
                      confirmLabel: 'پاکسازی تمام پیام‌ها',
                      onConfirm: () => {
                        const res = Storage.purgeCommunityChatData('all_messages', actorMeta.name);
                        onRefresh();
                        onNotify(res.message, 'success');
                      },
                    })
                  }
                  className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>پاکسازی همه پیام‌ها</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setConfirmDialog({
                      title: 'حذف کامل تمام تالارها و گروه‌های تخصصی',
                      description:
                        'تمامی تالارها، گروه‌ها و انجمن‌های تخصصی به همراه کل پیام‌های آن‌ها به‌طور دائم حذف می‌شوند (فقط تالار گفتگوی عمومی باقی می‌ماند).',
                      confirmLabel: 'حذف کل تالارهای تخصصی',
                      onConfirm: () => {
                        const res = Storage.purgeCommunityChatData('all_specialized_forums', actorMeta.name);
                        onRefresh();
                        onNotify(res.message, 'success');
                      },
                    })
                  }
                  className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف کل تالارهای تخصصی</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setConfirmDialog({
                      title: 'تخلیه کامل کل چت‌ها و تالارها (آزادسازی کامل دیتابیس)',
                      description:
                        'هشدار: تمامی پیام‌های تالار عمومی، همه چت‌های خصوصی، همه تالارهای تخصصی و گزارش‌ها به‌طور کامل حذف می‌شوند تا هیچ بار اضافی روی سرور باقی نماند. آیا مطمئن هستید؟',
                      confirmLabel: 'پاکسازی کامل کل فضا',
                      onConfirm: () => {
                        const res = Storage.purgeCommunityChatData('all_chat_and_forums', actorMeta.name);
                        onRefresh();
                        onNotify(res.message, 'success');
                      },
                    })
                  }
                  className="sm:col-span-2 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>پاکسازی کامل کل چت‌ها، پیام‌ها و تالارهای تخصصی (آزادسازی دیتابیس)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= تب ۲: تأیید و مدیریت تالارهای تخصصی ================= */}
        {subTab === 'approvals' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all' as const, label: 'همه تالارها' },
                  { id: 'pending' as const, label: 'در انتظار تأیید' },
                  { id: 'active' as const, label: 'فعال و منتشرشده' },
                  { id: 'suspended' as const, label: 'معلق / مسدود' },
                  { id: 'rejected' as const, label: 'رد شده' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setForumStatusFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      forumStatusFilter === f.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                تأیید دو مرحله‌ای: تالار دانشجویی تنها پس از تأیید هم‌زمان «مدیر» و «حراست» منتشر می‌شود.
              </div>
            </div>

            {filteredForums.length === 0 ? (
              <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
                تالار تخصصی در این فیلتر ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredForums.map((forum) => {
                  const cat = FORUM_CATEGORIES_META[forum.category] || FORUM_CATEGORIES_META.other;
                  const canMyRoleReview =
                    (isAdmin && forum.adminApproval.status === 'pending') ||
                    (isSecurity && forum.securityApproval.status === 'pending');

                  return (
                    <div
                      key={forum.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {forum.title}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${cat.badgeClass}`}>
                              {cat.label}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                                forum.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : forum.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : forum.status === 'suspended'
                                  ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              }`}
                            >
                              {forum.status === 'active'
                                ? forum.isClosed
                                  ? 'فعال (ارسال پیام بسته)'
                                  : 'فعال و منتشرشده'
                                : forum.status === 'pending'
                                ? 'در انتظار تأیید مدیر و حراست'
                                : forum.status === 'suspended'
                                ? 'معلق / مسدودشده'
                                : 'رد شده'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-5">
                            {forum.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                            <span>درخواست‌دهنده: <strong>{forum.creatorName}</strong> ({forum.creatorId})</span>
                            <span>•</span>
                            <span>تاریخ ثبت: {forum.createdAt}</span>
                            <span>•</span>
                            <span>اعضا: {(forum.memberIds?.length || 0).toLocaleString('fa-IR')} نفر</span>
                          </div>

                          {/* شرایط عضویت و تگ‌ها */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                              سکونت: {forum.allowedResidence === 'all' ? 'همه' : forum.allowedResidence === 'dormitory' ? 'فقط خوابگاهی' : 'فقط ترددی'}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                              رشته‌ها: {forum.allowedFields.length === 0 ? 'همه رشته‌ها' : forum.allowedFields.join('، ')}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                              ورودی‌ها: {forum.allowedEntryTerms.length === 0 ? 'همه ورودی‌ها' : forum.allowedEntryTerms.join('، ')}
                            </span>
                            {forum.tags.map((t) => (
                              <span
                                key={t}
                                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 text-[10px] font-bold"
                              >
                                <Hash className="w-2.5 h-2.5" />
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* وضعیت تأیید دوگانه مدیر و حراست */}
                        <div className="flex flex-col gap-1.5 shrink-0 sm:min-w-[210px]">
                          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-600 dark:text-slate-300">تأیید مدیر:</span>
                            <span
                              className={`font-extrabold ${
                                forum.adminApproval.status === 'approved'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : forum.adminApproval.status === 'rejected'
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {forum.adminApproval.status === 'approved'
                                ? 'تأیید شد ✓'
                                : forum.adminApproval.status === 'rejected'
                                ? 'رد شد ✕'
                                : 'در انتظار'}
                            </span>
                          </div>
                          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-600 dark:text-slate-300">تأیید حراست:</span>
                            <span
                              className={`font-extrabold ${
                                forum.securityApproval.status === 'approved'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : forum.securityApproval.status === 'rejected'
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {forum.securityApproval.status === 'approved'
                                ? 'تأیید شد ✓'
                                : forum.securityApproval.status === 'rejected'
                                ? 'رد شد ✕'
                                : 'در انتظار'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* کادر وارد کردن علت رد */}
                      {rejectingForumId === forum.id && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="علت رد درخواست تالار را بنویسید..."
                            className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-700 text-xs"
                          />
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleReviewForum(forum.id, 'rejected', rejectReason)}
                              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                            >
                              ثبت رد درخواست
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingForumId(null);
                                setRejectReason('');
                              }}
                              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
                            >
                              انصراف
                            </button>
                          </div>
                        </div>
                      )}

                      {/* اکشن‌های نظارتی روی تالار */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {canMyRoleReview && forum.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleReviewForum(forum.id, 'approved')}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isAdmin ? 'تأیید مدیریت' : 'تأیید حراست'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingForumId(forum.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>رد درخواست</span>
                            </button>
                          </>
                        )}

                        {forum.status === 'active' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onJumpToRoom(forum.id, 'forum')}
                              className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>ورود و نظارت زنده</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const res = Storage.toggleCommunityForumLock(forum.id, {
                                  isClosed: !forum.isClosed,
                                  actorName: actorMeta.name,
                                });
                                onRefresh();
                                onNotify(res.message, 'success');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              {forum.isClosed ? (
                                <>
                                  <Unlock className="w-3.5 h-3.5" />
                                  <span>باز کردن ارسال پیام</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>بستن ارسال پیام</span>
                                </>
                              )}
                            </button>
                          </>
                        )}

                        {(isAdmin || isSecurity) && forum.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => {
                              const res = Storage.updateCommunityForumStatus(
                                forum.id,
                                'suspended',
                                actorMeta.name
                              );
                              onRefresh();
                              onNotify(res.message, 'success');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-bold cursor-pointer"
                          >
                            تعلیق / مسدودسازی تالار
                          </button>
                        )}

                        {(isAdmin || isSecurity) && forum.status === 'suspended' && (
                          <button
                            type="button"
                            onClick={() => {
                              const res = Storage.updateCommunityForumStatus(
                                forum.id,
                                'active',
                                actorMeta.name
                              );
                              onRefresh();
                              onNotify(res.message, 'success');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                          >
                            رفع تعلیق و فعال‌سازی مجدد
                          </button>
                        )}

                        {isAdmin && (
                          <div className="flex items-center gap-1.5 mr-auto">
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDialog({
                                  title: `پاکسازی پیام‌های «${forum.title}»`,
                                  description:
                                    'تمام پیام‌های ارسال‌شده در این تالار برای سبک شدن دیتابیس حذف می‌شوند اما خود تالار حفظ می‌گردد.',
                                  confirmLabel: 'پاکسازی پیام‌ها',
                                  onConfirm: () => {
                                    const res = Storage.clearCommunityRoomMessages(forum.id, {
                                      actorName: actorMeta.name,
                                      roomTitle: forum.title,
                                    });
                                    onRefresh();
                                    onNotify(res.message, 'success');
                                  },
                                })
                              }
                              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Eraser className="w-3.5 h-3.5" />
                              <span>پاکسازی پیام‌ها</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDialog({
                                  title: `حذف کامل تالار «${forum.title}»`,
                                  description:
                                    'این تالار و تمامی پیام‌های ثبت‌شده در آن به‌طور دائم از دیتابیس حذف خواهند شد. ادامه می‌دهید؟',
                                  confirmLabel: 'حذف کامل تالار',
                                  onConfirm: () => {
                                    const res = Storage.deleteCommunityForum(forum.id, actorMeta.name);
                                    onRefresh();
                                    onNotify(res.message, res.success ? 'success' : 'error');
                                  },
                                })
                              }
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف تالار</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= تب ۳: مسدودسازی دانشجویان ================= */}
        {subTab === 'bans' && (
          <div className="space-y-5 max-w-4xl mx-auto">
            <form
              onSubmit={handleSubmitBan}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs"
            >
              <div className="flex items-center gap-2 text-sm font-extrabold text-rose-700 dark:text-rose-400">
                <UserX className="w-4 h-4" />
                <span>مسدودسازی دانشجو از ارسال پیام در تالارها و پیام‌رسان</span>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  جستجوی دانشجو بر اساس نام یا شماره دانشجویی
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={banSearch}
                      onChange={(e) => setBanSearch(e.target.value)}
                      placeholder="نام یا شماره دانشجویی را تایپ کنید..."
                      className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleLookupDirectBanStudent}
                    disabled={isLookingUpStudent}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer shrink-0"
                  >
                    {isLookingUpStudent ? 'در حال استعلام...' : 'استعلام کد دانشجویی'}
                  </button>
                </div>

                {matchedStudentsForBan.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto">
                    {matchedStudentsForBan.map((st) => (
                      <button
                        key={st.studentId}
                        type="button"
                        onClick={() => {
                          setSelectedStudentForBan({
                            studentId: st.studentId,
                            fullName: st.fullName,
                            fieldOfStudy: st.fieldOfStudy,
                          });
                          setBanSearch(`${st.fullName} (${st.studentId})`);
                        }}
                        className="text-right px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 text-xs cursor-pointer"
                      >
                        <div className="font-extrabold text-slate-900 dark:text-white">{st.fullName}</div>
                        <div className="text-[10px] text-slate-500">
                          {st.studentId} • {st.fieldOfStudy}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedStudentForBan && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-rose-800 dark:text-rose-200">
                        دانشجوی انتخاب‌شده: {selectedStudentForBan.fullName}
                      </span>{' '}
                      <span className="text-rose-600 dark:text-rose-400">
                        ({selectedStudentForBan.studentId})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentForBan(null)}
                      className="text-rose-600 hover:underline font-bold cursor-pointer"
                    >
                      تغییر
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    محدوده مسدودیت
                  </label>
                  <select
                    value={banScope}
                    onChange={(e) =>
                      setBanScope(e.target.value as 'all' | 'private_only' | 'forums_only')
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    <option value="all">کل پیام‌رسان و همه تالارها</option>
                    <option value="private_only">فقط چت خصوصی دانشجویی</option>
                    <option value="forums_only">فقط تالار عمومی و گروه‌ها</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    علت مسدودسازی (نمایش داده‌شده به دانشجو و ثبت در سوابق) *
                  </label>
                  <input
                    type="text"
                    required
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="مثلاً: ارسال پیام غیرقانونی / عدم رعایت شأن دانشجومعلمی در تالار گفتگو"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                  <span>اعمال مسدودیت فوری</span>
                </button>
              </div>
            </form>

            {/* لیست مسدودیت‌ها */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                فهرست دانشجویان مسدودشده ({bans.length.toLocaleString('fa-IR')} رکورد)
              </h4>
              {bans.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                  هیچ دانشجویی در حال حاضر مسدود نیست.
                </div>
              ) : (
                bans.map((ban) => (
                  <div
                    key={ban.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      ban.isActive
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {ban.studentName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">{ban.studentId}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            ban.isActive
                              ? 'bg-rose-600 text-white'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {ban.isActive ? 'مسدود فعال' : 'رفع مسدودیت شده'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                          {ban.scope === 'all'
                            ? 'کل پیام‌رسان'
                            : ban.scope === 'private_only'
                            ? 'فقط چت خصوصی'
                            : 'فقط تالارها'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        علت: {ban.reason}
                      </p>
                      <div className="text-[10px] text-slate-500">
                        توسط {ban.bannedByName} در {ban.createdAt}
                        {ban.unbannedAt && ` • رفع مسدودیت توسط ${ban.unbannedBy} در ${ban.unbannedAt}`}
                      </div>
                    </div>
                    {ban.isActive && (
                      <button
                        type="button"
                        onClick={() => {
                          const res = Storage.unbanStudentFromChat(ban.id, actorMeta.name);
                          onRefresh();
                          onNotify(res.message, 'success');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer shrink-0"
                      >
                        رفع مسدودیت
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= تب ۴: گزارش‌های تخلف ================= */}
        {subTab === 'reports' && (
          <div className="space-y-3 max-w-5xl mx-auto">
            {reports.length === 0 ? (
              <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
                تاکنون گزارش تخلفی در پیام‌رسان و تالارها ثبت نشده است.
              </div>
            ) : (
              reports.map((rep) => (
                <div
                  key={rep.id}
                  className={`p-4 rounded-2xl border space-y-3 ${
                    rep.status === 'pending'
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        متخلف گزارش‌شده: {rep.offenderName} ({rep.offenderId})
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        محل: {rep.roomTitle}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          rep.status === 'pending'
                            ? 'bg-rose-600 text-white'
                            : rep.status === 'reviewed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {rep.status === 'pending'
                          ? 'در انتظار رسیدگی'
                          : rep.status === 'reviewed'
                          ? 'رسیدگی شد'
                          : 'بسته شد'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">{rep.createdAt}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 mb-1">متن پیام گزارش‌شده:</div>
                    <p>{rep.messageText}</p>
                    {rep.messageImageUrl && (
                      <img
                        src={rep.messageImageUrl}
                        alt="پیوست گزارش"
                        className="mt-2 max-h-36 rounded-xl border border-slate-200 dark:border-slate-700"
                      />
                    )}
                  </div>

                  <div className="text-xs text-amber-900 dark:text-amber-300">
                    <strong>علت گزارش (توسط {rep.reportedByName}):</strong> {rep.reason}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onJumpToRoom(rep.roomId, rep.roomType)}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>مشاهده در گفتگو</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const del = Storage.deleteCommunityChatMessage(rep.messageId, {
                          actorName: actorMeta.name,
                          reason: `حذف در پی گزارش تخلف: ${rep.reason}`,
                        });
                        Storage.resolveCommunityChatReport(rep.id, {
                          status: 'reviewed',
                          reviewerName: actorMeta.name,
                          reviewNote: 'پیام حذف گردید.',
                        });
                        onRefresh();
                        onNotify(del.message, 'success');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف پیام</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const banRes = Storage.banStudentFromChat({
                          studentId: rep.offenderId,
                          studentName: rep.offenderName,
                          reason: `تخلف گزارش‌شده در ${rep.roomTitle}: ${rep.reason}`,
                          scope: 'all',
                          bannedById: actorMeta.id,
                          bannedByName: actorMeta.name,
                          bannedByRole: actorMeta.role,
                        });
                        Storage.resolveCommunityChatReport(rep.id, {
                          status: 'reviewed',
                          reviewerName: actorMeta.name,
                          reviewNote: 'کاربر مسدود گردید.',
                        });
                        onRefresh();
                        onNotify(banRes.message, banRes.success ? 'success' : 'error');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>مسدودسازی فرستنده</span>
                    </button>

                    {rep.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => {
                          Storage.resolveCommunityChatReport(rep.id, {
                            status: 'dismissed',
                            reviewerName: actorMeta.name,
                            reviewNote: isViceDean ? 'بررسی توسط معاونت دانشجویی' : 'بسته شد',
                          });
                          onRefresh();
                          onNotify('گزارش تخلف بسته شد.', 'success');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                      >
                        بستن گزارش
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* مودال تأیید پاکسازی و حذف (درون‌برنامه‌ای) */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-[80] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4"
          dir="rtl"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/70 p-5 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {confirmDialog.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-6 mt-1">
                  {confirmDialog.description}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  const fn = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  fn();
                  setStatsRefreshTick((t) => t + 1);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold cursor-pointer"
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
