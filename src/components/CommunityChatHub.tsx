import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CommunityChatBan,
  CommunityChatMessage,
  CommunityChatReport,
  CommunityChatRoomType,
  CommunityChatSettings,
  CommunityForum,
  CurrentUser,
  PublicStudentChatProfile,
  Student,
} from '../types';
import { Storage, normalizePersianSearch } from '../utils/storage';
import { getStudentAdmissionStatus, isStudentDormResident } from '../utils/financeUtils';
import {
  COMMUNITY_STICKERS,
  FORUM_CATEGORIES_META,
  PUBLIC_FORUM_ID,
  compressChatImageFile,
  getRoleDisplayLabel,
  getStickerById,
  isStudentEligibleForForum,
  isSupervisorModeratorRole,
  makeDmRoomId,
} from '../utils/communityStickers';
import { CommunityForumRequestModal } from './CommunityForumRequestModal';
import { CommunityModerationPanel } from './CommunityModerationPanel';
import {
  X,
  Send,
  Search,
  Hash,
  Users,
  MessageCircle,
  Lock,
  Unlock,
  Plus,
  Image as ImageIcon,
  Smile,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Trash2,
  Ban,
  Flag,
  Reply,
  RefreshCw,
  Settings,
  ChevronRight,
  CheckCircle2,
  UserPlus,
  Eye,
  LogOut,
  Sparkles,
  Megaphone,
  UserX,
} from 'lucide-react';

interface CommunityChatHubProps {
  currentUser: NonNullable<CurrentUser>;
  students?: Student[];
  mode?: 'modal' | 'embedded';
  initialView?: 'chat' | 'moderation';
  cloudSyncTick?: number;
  onClose?: () => void;
  onRefreshGlobalData?: () => void;
}

interface DmRoomSummary {
  roomId: string;
  participants: [string, string];
  participantNames: [string, string];
  otherStudentId?: string;
  otherStudentName?: string;
  lastMessage?: CommunityChatMessage;
  messageCount: number;
}

export const CommunityChatHub: React.FC<CommunityChatHubProps> = ({
  currentUser,
  students = [],
  mode = 'embedded',
  initialView = 'chat',
  cloudSyncTick = 0,
  onClose,
  onRefreshGlobalData,
}) => {
  const isModerator = isSupervisorModeratorRole(currentUser.role);
  const isAdmin = currentUser.role === 'admin';
  const isSecurity = currentUser.role === 'security';
  const isStudent = currentUser.role === 'student';

  const me = useMemo(() => {
    if (currentUser.role === 'student') {
      return {
        id: currentUser.student.studentId,
        name: currentUser.student.fullName,
        role: 'student',
        fieldOfStudy: currentUser.student.fieldOfStudy,
        avatarUrl: currentUser.student.photoUrl,
      };
    }
    if (currentUser.role === 'admin') {
      return {
        id: currentUser.username,
        name: currentUser.name || 'مدیر کل سامانه',
        role: 'admin',
        fieldOfStudy: undefined,
        avatarUrl: undefined,
      };
    }
    if (currentUser.role === 'supervisor') {
      return {
        id: currentUser.supervisor.id,
        name: currentUser.supervisor.fullName,
        role: 'supervisor',
        fieldOfStudy: undefined,
        avatarUrl: currentUser.supervisor.photoUrl,
      };
    }
    if (currentUser.role === 'counselor') {
      return {
        id: currentUser.counselor.id,
        name: currentUser.counselor.fullName,
        role: 'counselor',
        fieldOfStudy: undefined,
        avatarUrl: currentUser.counselor.photoUrl,
      };
    }
    if (currentUser.role === 'maintenance') {
      return {
        id: currentUser.technician.id,
        name: currentUser.technician.fullName,
        role: 'maintenance',
        fieldOfStudy: undefined,
        avatarUrl: currentUser.technician.photoUrl,
      };
    }
    return {
      id: currentUser.staff.id,
      name: currentUser.staff.fullName,
      role: currentUser.role,
      fieldOfStudy: undefined,
      avatarUrl: currentUser.staff.photoUrl,
    };
  }, [currentUser]);

  // داده‌های زنده از Storage
  const [chatSettings, setChatSettings] = useState<CommunityChatSettings>(() =>
    Storage.getCommunityChatSettings()
  );
  const [forums, setForums] = useState<CommunityForum[]>(() => Storage.getCommunityForums());
  const [messages, setMessages] = useState<CommunityChatMessage[]>(() =>
    Storage.getCommunityChatMessages()
  );
  const [bans, setBans] = useState<CommunityChatBan[]>(() => Storage.getCommunityChatBans());
  const [reports, setReports] = useState<CommunityChatReport[]>(() =>
    Storage.getCommunityChatReports()
  );
  const [rulesAccepted, setRulesAccepted] = useState<boolean>(() =>
    isModerator ? true : Storage.hasAcceptedCommunityChatRules(me.id)
  );
  const [rulesCheckTick, setRulesCheckTick] = useState(false);

  // ناوبری و وضعیت UI
  const [activeView, setActiveView] = useState<'chat' | 'moderation'>(
    isModerator ? initialView : 'chat'
  );
  const [selectedRoomId, setSelectedRoomId] = useState<string>(PUBLIC_FORUM_ID);
  const [selectedRoomType, setSelectedRoomType] = useState<CommunityChatRoomType>('public');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [sidebarSection, setSidebarSection] = useState<'all' | 'forums' | 'dms'>('all');
  const [isSyncing, setIsSyncing] = useState(false);

  // شروع گفتگوی خصوصی جدید با شماره دانشجویی
  const [dmLookupInput, setDmLookupInput] = useState('');
  const [dmLookupLoading, setDmLookupLoading] = useState(false);
  const [dmLookupProfile, setDmLookupProfile] = useState<PublicStudentChatProfile | null>(null);
  const [dmLookupError, setDmLookupError] = useState<string | null>(null);
  const [activeDmParticipants, setActiveDmParticipants] = useState<
    { ids: [string, string]; names: [string, string] } | null
  >(null);

  // کامپوزر پیام
  const [draftText, setDraftText] = useState('');
  const [draftImage, setDraftImage] = useState<string | null>(null);
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<CommunityChatMessage | null>(null);
  const [moderatorPostMode, setModeratorPostMode] = useState<'normal' | 'moderator' | 'warning'>(
    'normal'
  );
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // مودال‌های داخلی
  const [isCreateForumOpen, setIsCreateForumOpen] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<CommunityChatMessage | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [quickBanTarget, setQuickBanTarget] = useState<{
    studentId: string;
    studentName: string;
  } | null>(null);
  const [quickBanReason, setQuickBanReason] = useState('');
  const [toast, setToast] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = useCallback((text: string, tone: 'success' | 'error' = 'success') => {
    setToast({ text, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const reloadLocal = useCallback(() => {
    setChatSettings(Storage.getCommunityChatSettings());
    setForums(Storage.getCommunityForums());
    setMessages(Storage.getCommunityChatMessages());
    setBans(Storage.getCommunityChatBans());
    setReports(Storage.getCommunityChatReports());
    if (!isModerator) {
      setRulesAccepted(Storage.hasAcceptedCommunityChatRules(me.id));
    }
  }, [isModerator, me.id]);

  useEffect(() => {
    reloadLocal();
  }, [cloudSyncTick, reloadLocal]);

  // همگام‌سازی خودکار با ابر هر ۱۲ ثانیه در زمان باز بودن پیام‌رسان
  useEffect(() => {
    const unsub = Storage.subscribeCloudDataChanged(() => {
      reloadLocal();
    });
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      Storage.syncFromCloud({ force: false }).then((changed) => {
        if (changed) reloadLocal();
      });
    }, 12000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, [reloadLocal]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await Storage.syncFromCloud({ force: true });
      reloadLocal();
      onRefreshGlobalData?.();
    } finally {
      setIsSyncing(false);
    }
  };

  // محاسبه مسدودیت فعال برای دانشجوی فعلی
  const myActiveBan = useMemo(() => {
    if (!isStudent) return undefined;
    return bans.find((b) => b.isActive && b.studentId === me.id);
  }, [bans, isStudent, me.id]);

  // بررسی شرط پذیرش دانشجو در صورت فعال بودن گزینه onlyAdmittedStudentsCanChat
  const blockedByAdmissionPolicy = useMemo(() => {
    if (!isStudent || !chatSettings.onlyAdmittedStudentsCanChat) return false;
    return getStudentAdmissionStatus(currentUser.student) !== 'admitted';
  }, [isStudent, chatSettings.onlyAdmittedStudentsCanChat, currentUser]);

  // شمارنده‌های نظارتی برای مدیر، حراست و معاونت
  const pendingModerationCount = useMemo(() => {
    const pendingForums = forums.filter((f) => {
      if (f.isPublicForum || f.id === PUBLIC_FORUM_ID || f.status !== 'pending') return false;
      if (isAdmin) return f.adminApproval.status === 'pending';
      if (isSecurity) return f.securityApproval.status === 'pending';
      return true;
    }).length;
    const pendingReps = reports.filter((r) => r.status === 'pending').length;
    return pendingForums + pendingReps;
  }, [forums, reports, isAdmin, isSecurity]);

  const publicForum = useMemo(
    () => forums.find((f) => f.id === PUBLIC_FORUM_ID || f.isPublicForum) || forums[0],
    [forums]
  );

  // فهرست تالارهای تخصصی قابل نمایش در سایدبار
  const visibleSpecializedForums = useMemo(() => {
    const q = normalizePersianSearch(sidebarSearch);
    return forums
      .filter((f) => !f.isPublicForum && f.id !== PUBLIC_FORUM_ID)
      .filter((f) => {
        if (isModerator) return true;
        if (f.status === 'active') {
          if (isStudent) {
            return isStudentEligibleForForum(currentUser.student, f).eligible;
          }
          return true;
        }
        // دانشجو درخواست‌های در انتظار یا ردشده خودش را نیز می‌بیند
        return f.creatorId === me.id;
      })
      .filter((f) => {
        if (!q) return true;
        const hay = normalizePersianSearch(
          `${f.title} ${f.description} ${f.tags.join(' ')} ${f.creatorName}`
        );
        return hay.includes(q);
      });
  }, [forums, sidebarSearch, isModerator, isStudent, currentUser, me.id]);

  // فهرست گفتگوهای خصوصی (برای دانشجو: گفتگوهای خودش؛ برای ناظران: همه چت‌های خصوصی دانشجویان!)
  const dmRooms = useMemo<DmRoomSummary[]>(() => {
    const map = new Map<string, DmRoomSummary>();
    messages.forEach((m) => {
      if (m.roomType !== 'dm') return;
      const parts: [string, string] = m.dmParticipants || [m.senderId, m.roomId];
      const names: [string, string] = m.dmParticipantNames || [m.senderName, 'دانشجو'];

      if (!isModerator && isStudent) {
        if (!parts.includes(me.id)) return;
      } else if (!isModerator && !isStudent) {
        // سایر کارشناسان غیرناظر چت خصوصی دانشجویان را نمی‌بینند
        return;
      }

      const existing = map.get(m.roomId);
      const otherIdx = parts[0] === me.id ? 1 : 0;
      if (!existing) {
        map.set(m.roomId, {
          roomId: m.roomId,
          participants: parts,
          participantNames: names,
          otherStudentId: isStudent ? parts[otherIdx] : undefined,
          otherStudentName: isStudent ? names[otherIdx] : undefined,
          lastMessage: m,
          messageCount: 1,
        });
      } else {
        existing.lastMessage = m;
        existing.messageCount += 1;
      }
    });

    // اگر یک چت جدید باز شده و هنوز پیامی ندارد، به لیست اضافه شود
    if (
      selectedRoomType === 'dm' &&
      activeDmParticipants &&
      !map.has(selectedRoomId)
    ) {
      const otherIdx = activeDmParticipants.ids[0] === me.id ? 1 : 0;
      map.set(selectedRoomId, {
        roomId: selectedRoomId,
        participants: activeDmParticipants.ids,
        participantNames: activeDmParticipants.names,
        otherStudentId: isStudent ? activeDmParticipants.ids[otherIdx] : undefined,
        otherStudentName: isStudent ? activeDmParticipants.names[otherIdx] : undefined,
        messageCount: 0,
      });
    }

    const q = normalizePersianSearch(sidebarSearch);
    return Array.from(map.values())
      .filter((r) => {
        if (!q) return true;
        const hay = normalizePersianSearch(
          `${r.participants.join(' ')} ${r.participantNames.join(' ')} ${r.lastMessage?.text || ''}`
        );
        return hay.includes(q);
      })
      .sort((a, b) => {
        const ta = a.lastMessage?.createdAtIso || '';
        const tb = b.lastMessage?.createdAtIso || '';
        return tb.localeCompare(ta);
      });
  }, [
    messages,
    isModerator,
    isStudent,
    me.id,
    selectedRoomType,
    selectedRoomId,
    activeDmParticipants,
    sidebarSearch,
  ]);

  const activeForum = useMemo(
    () =>
      selectedRoomType === 'public'
        ? publicForum
        : selectedRoomType === 'forum'
        ? forums.find((f) => f.id === selectedRoomId) || null
        : null,
    [selectedRoomType, publicForum, forums, selectedRoomId]
  );

  const activeDmRoom = useMemo(
    () =>
      selectedRoomType === 'dm'
        ? dmRooms.find((r) => r.roomId === selectedRoomId) || null
        : null,
    [selectedRoomType, dmRooms, selectedRoomId]
  );

  const activeRoomMessages = useMemo(
    () => messages.filter((m) => m.roomId === selectedRoomId),
    [messages, selectedRoomId]
  );

  // اسکرول نرم به آخرین پیام هنگام تغییر پیام‌ها
  useEffect(() => {
    if (activeView === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [activeRoomMessages.length, selectedRoomId, activeView]);

  const activeRoomTitle = useMemo(() => {
    if (selectedRoomType === 'public') return publicForum?.title || 'تالار گفتگوی عمومی دانشگاه';
    if (selectedRoomType === 'forum') return activeForum?.title || 'تالار تخصصی';
    if (activeDmRoom) {
      if (isModerator) {
        return `چت خصوصی: ${activeDmRoom.participantNames[0]} ↔ ${activeDmRoom.participantNames[1]}`;
      }
      return `${activeDmRoom.otherStudentName || 'دانشجو'} (${activeDmRoom.otherStudentId || ''})`;
    }
    return 'گفتگو';
  }, [selectedRoomType, publicForum, activeForum, activeDmRoom, isModerator]);

  // بررسی اینکه آیا کاربر فعلی مجاز به ارسال پیام در اتاق انتخابی هست یا خیر
  const composerBlockReason = useMemo<string | null>(() => {
    if (isModerator) return null; // مدیر، حراست و معاونت همیشه می‌توانند پیام ناظر یا اخطار بگذارند

    if (!chatSettings.isChatSystemEnabled) {
      return 'سامانه پیام‌رسان و تالارهای گفتگو هم‌اکنون توسط مدیر سامانه بسته شده است.';
    }
    if (blockedByAdmissionPolicy) {
      return 'امکان ارسال پیام در حال حاضر ویژه دانشجویان دارای وضعیت «پذیرش شده» فعال است.';
    }
    if (myActiveBan) {
      const blockedHere =
        myActiveBan.scope === 'all' ||
        (myActiveBan.scope === 'private_only' && selectedRoomType === 'dm') ||
        (myActiveBan.scope === 'forums_only' && selectedRoomType !== 'dm');
      if (blockedHere) {
        return `حساب شما در پیام‌رسان توسط ${myActiveBan.bannedByName} مسدود شده است. علت: ${myActiveBan.reason}`;
      }
    }

    if (selectedRoomType === 'public') {
      if (!chatSettings.isPublicForumOpen || publicForum?.isClosed) {
        return 'ارسال پیام در تالار گفتگوی عمومی هم‌اکنون توسط مدیر سامانه بسته شده است (حالت فقط خواندنی).';
      }
    }

    if (selectedRoomType === 'forum') {
      if (!activeForum) return 'تالار یافت نشد.';
      if (activeForum.status === 'pending') {
        return 'این تالار هنوز در انتظار تأیید هم‌زمان «مدیر سامانه» و «واحد حراست» است.';
      }
      if (activeForum.status === 'rejected') {
        return 'درخواست ایجاد این تالار رد شده است.';
      }
      if (activeForum.status === 'suspended') {
        return 'این تالار توسط مدیریت یا حراست موقتاً معلق شده است.';
      }
      if (activeForum.isClosed) {
        return `ارسال پیام در این تالار توسط ${activeForum.closedBy || 'مدیریت'} بسته شده است.`;
      }
      if (isStudent && !activeForum.memberIds.includes(me.id)) {
        return 'برای ارسال پیام ابتدا روی دکمه «عضویت در تالار» در بالای صفحه کلیک کنید.';
      }
    }

    if (selectedRoomType === 'dm') {
      if (!chatSettings.isPrivateChatEnabled) {
        return 'امکان ارسال پیام خصوصی بین دانشجویان هم‌اکنون توسط مدیر سامانه بسته شده است.';
      }
      if (activeDmRoom && Storage.isStudentBlockedBetween(activeDmRoom.participants[0], activeDmRoom.participants[1])) {
        return 'ارسال پیام در این گفتگو به دلیل مسدودسازی شخصی غیرفعال است.';
      }
    }

    return null;
  }, [
    isModerator,
    chatSettings,
    blockedByAdmissionPolicy,
    myActiveBan,
    selectedRoomType,
    publicForum,
    activeForum,
    isStudent,
    me.id,
    activeDmRoom,
  ]);

  const canAttachPhoto = useMemo(() => {
    if (isModerator) return true;
    return selectedRoomType === 'dm'
      ? chatSettings.allowPhotosInPrivateChat
      : chatSettings.allowPhotosInForums;
  }, [isModerator, selectedRoomType, chatSettings]);

  const canUseStickers = useMemo(() => {
    if (isModerator) return true;
    return chatSettings.allowStickers;
  }, [isModerator, chatSettings.allowStickers]);

  // جستجوی شماره دانشجویی برای شروع گفتگوی خصوصی جدید
  const handleLookupStudentForDm = async (e: React.FormEvent) => {
    e.preventDefault();
    setDmLookupError(null);
    setDmLookupProfile(null);
    const cleanId = dmLookupInput.trim();
    if (!cleanId) return;
    if (isStudent && cleanId === me.id) {
      setDmLookupError('امکان ارسال پیام خصوصی به شماره دانشجویی خودتان وجود ندارد.');
      return;
    }
    setDmLookupLoading(true);
    const res = await Storage.lookupStudentPublicProfileById(cleanId);
    setDmLookupLoading(false);
    if (!res.found || !res.profile) {
      setDmLookupError(res.error || 'دانشجویی با این شماره دانشجویی یافت نشد.');
      return;
    }

    // بررسی محدودیت دامنه چت خصوصی تنظیم‌شده توسط مدیر
    if (isStudent) {
      const target = res.profile;
      if (
        chatSettings.privateChatScope === 'same_field' &&
        (currentUser.student.fieldOfStudy || '').trim() !== target.fieldOfStudy.trim()
      ) {
        setDmLookupError('طبق تنظیمات مدیر، چت خصوصی فقط بین دانشجویان هم‌رشته مجاز است.');
        return;
      }
      if (
        chatSettings.privateChatScope === 'same_entry' &&
        (currentUser.student.entryTerm || '').trim() !== target.entryTerm.trim()
      ) {
        setDmLookupError('طبق تنظیمات مدیر، چت خصوصی فقط بین دانشجویان هم‌ورودی مجاز است.');
        return;
      }
      if (
        chatSettings.privateChatScope === 'same_dorm' &&
        (!isStudentDormResident(currentUser.student) ||
          !target.isDormResident ||
          currentUser.student.assignedDormId !== target.dormId)
      ) {
        setDmLookupError('طبق تنظیمات مدیر، چت خصوصی فقط بین دانشجویان هم‌سرا مجاز است.');
        return;
      }
    }

    setDmLookupProfile(res.profile);
  };

  const handleOpenDmWithProfile = (profile: PublicStudentChatProfile) => {
    const roomId = makeDmRoomId(me.id, profile.studentId);
    const pair: [string, string] =
      me.id.localeCompare(profile.studentId) <= 0
        ? [me.id, profile.studentId]
        : [profile.studentId, me.id];
    const names: [string, string] =
      me.id.localeCompare(profile.studentId) <= 0
        ? [me.name, profile.fullName]
        : [profile.fullName, me.name];

    setActiveDmParticipants({ ids: pair, names });
    setSelectedRoomId(roomId);
    setSelectedRoomType('dm');
    setActiveView('chat');
    setMobileShowChat(true);
    setDmLookupProfile(null);
    setDmLookupInput('');
  };

  const handleSelectPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const compressed = await compressChatImageFile(file);
      setDraftImage(compressed);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در آماده‌سازی تصویر.', 'error');
    }
  };

  const handleSendMessage = (overrideStickerId?: string) => {
    if (composerBlockReason) {
      showToast(composerBlockReason, 'error');
      return;
    }

    const dmParticipants =
      selectedRoomType === 'dm'
        ? activeDmRoom?.participants || activeDmParticipants?.ids
        : undefined;
    const dmParticipantNames =
      selectedRoomType === 'dm'
        ? activeDmRoom?.participantNames || activeDmParticipants?.names
        : undefined;

    const res = Storage.sendCommunityChatMessage({
      roomType: selectedRoomType,
      roomId: selectedRoomId,
      dmParticipants,
      dmParticipantNames,
      senderId: me.id,
      senderName: me.name,
      senderRole: me.role,
      senderFieldOfStudy: me.fieldOfStudy,
      senderAvatarUrl: me.avatarUrl,
      text: overrideStickerId ? '' : draftText,
      imageUrl: overrideStickerId ? undefined : draftImage || undefined,
      stickerId: overrideStickerId,
      replyToId: replyTo?.id,
      replyToSenderName: replyTo?.senderName,
      replyToText:
        replyTo?.text || (replyTo?.imageUrl ? '[تصویر]' : replyTo?.stickerId ? '[استیکر]' : undefined),
      isModeratorMessage: isModerator && moderatorPostMode === 'moderator',
      isWarningMessage: isModerator && moderatorPostMode === 'warning',
    });

    if (!res.success) {
      showToast(res.message, 'error');
      return;
    }

    if (!overrideStickerId) {
      setDraftText('');
      setDraftImage(null);
    }
    setReplyTo(null);
    setIsStickerPickerOpen(false);
    reloadLocal();
  };

  const handleJumpToRoomFromModeration = (roomId: string, roomType: CommunityChatRoomType) => {
    setSelectedRoomId(roomId);
    setSelectedRoomType(roomType);
    setActiveView('chat');
    setMobileShowChat(true);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingMessage) return;
    const res = Storage.reportCommunityChatMessage({
      message: reportingMessage,
      roomTitle: activeRoomTitle,
      reportedById: me.id,
      reportedByName: me.name,
      reason: reportReason,
    });
    if (!res.success) {
      showToast(res.message, 'error');
      return;
    }
    setReportingMessage(null);
    setReportReason('');
    reloadLocal();
    showToast(res.message, 'success');
  };

  const handleSubmitQuickBan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBanTarget || !isModerator) return;
    const res = Storage.banStudentFromChat({
      studentId: quickBanTarget.studentId,
      studentName: quickBanTarget.studentName,
      reason: quickBanReason,
      scope: 'all',
      bannedById: me.id,
      bannedByName: me.name,
      bannedByRole: currentUser.role as 'admin' | 'security' | 'vice_dean',
    });
    if (!res.success) {
      showToast(res.message, 'error');
      return;
    }
    setQuickBanTarget(null);
    setQuickBanReason('');
    reloadLocal();
    showToast(res.message, 'success');
  };

  // گیت پذیرش تعهدنامه قوانین برای دانشجویان در اولین ورود
  const showRulesGate = isStudent && chatSettings.requireRulesAcceptance && !rulesAccepted;

  const containerInner = (
    <div
      className={`flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden ${
        mode === 'modal'
          ? 'w-full h-[94vh] max-w-7xl rounded-3xl shadow-2xl'
          : 'w-full h-[78vh] min-h-[600px] max-h-[860px] rounded-3xl shadow-sm'
      }`}
      dir="rtl"
    >
      {/* ================= نوار هدر بالای هاب گفتگو ================= */}
      <div className="px-4 py-3 bg-gradient-to-l from-teal-700 via-emerald-700 to-teal-800 text-white flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-extrabold text-sm sm:text-base truncate">
                تالارهای گفتگو و پیام‌رسان دانشجویی
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-teal-50">
                تحت نظارت مدیریت، معاونت و حراست
              </span>
            </div>
            <p className="text-[11px] text-teal-100/90 truncate hidden sm:block">
              تالار گفتگوی عمومی، تالارها و انجمن‌های تخصصی، و گفتگوی خصوصی با شماره دانشجویی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isModerator && (
            <div className="flex items-center bg-black/20 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveView('chat')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1 ${
                  activeView === 'chat'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-teal-100 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>نظارت و گفتگو</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('moderation')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1 ${
                  activeView === 'moderation'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-teal-100 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{isAdmin ? 'تنظیمات و تأییدها' : 'تأیید تالار و نظارت'}</span>
                {pendingModerationCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                    {pendingModerationCount}
                  </span>
                )}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition cursor-pointer"
            title="بروزرسانی پیام‌ها از سرور"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>

          {mode === 'modal' && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/15 hover:bg-rose-500/80 transition cursor-pointer"
              title="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* نوار پیام بازخورد (Toast) */}
      {toast && (
        <div
          className={`px-4 py-2 text-xs font-extrabold flex items-center justify-between gap-2 shrink-0 ${
            toast.tone === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-white/20 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ================= گیت پذیرش قوانین برای دانشجو ================= */}
      {showRulesGate ? (
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  تعهدنامه اخلاقی و قوانین پیام‌رسان دانشجویی
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  پیش از ورود به تالارهای گفتگو و پیام‌رسان، مطالعه و پذیرش ضوابط زیر الزامی است.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs leading-7 text-slate-800 dark:text-slate-200 whitespace-pre-line">
              {chatSettings.rulesText}
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer select-none p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                checked={rulesCheckTick}
                onChange={(e) => setRulesCheckTick(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-teal-600 focus:ring-teal-500 shrink-0"
              />
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 leading-5">
                کلیه مفاد منشور اخلاقی و قوانین فوق را مطالعه کرده و متعهد به رعایت کامل آن در تمامی تالارها و گفتگوها هستم.
              </span>
            </label>

            <button
              type="button"
              disabled={!rulesCheckTick}
              onClick={() => {
                Storage.acceptCommunityChatRules(me.id);
                setRulesAccepted(true);
                showToast('تعهدنامه با موفقیت ثبت شد. به تالار گفتگو خوش آمدید.', 'success');
              }}
              className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs sm:text-sm font-extrabold shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأیید تعهدنامه و ورود به تالار گفتگو</span>
            </button>
          </div>
        </div>
      ) : activeView === 'moderation' && isModerator ? (
        <div className="flex-1 overflow-hidden">
          <CommunityModerationPanel
            currentUser={currentUser}
            chatSettings={chatSettings}
            forums={forums}
            bans={bans}
            reports={reports}
            students={students}
            onRefresh={() => {
              reloadLocal();
              onRefreshGlobalData?.();
            }}
            onJumpToRoom={handleJumpToRoomFromModeration}
            onOpenCreateForum={() => setIsCreateForumOpen(true)}
            onNotify={showToast}
          />
        </div>
      ) : (
        /* ================= نمای دو ستونه پیام‌رسان (سبک تلگرام / اینستاگرام) ================= */
        <div className="flex-1 flex overflow-hidden relative">
          {/* ستون لیست اتاق‌ها (سایدبار راست در RTL) */}
          <aside
            className={`${
              mobileShowChat ? 'hidden md:flex' : 'flex'
            } flex-col w-full md:w-80 lg:w-96 border-l border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 shrink-0 overflow-hidden`}
          >
            {/* جستجو و فیلتر بخش‌ها */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="جستجوی تالار، تگ (#) یا گفتگو..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {[
                  { id: 'all' as const, label: 'همه' },
                  { id: 'forums' as const, label: 'تالارها' },
                  { id: 'dms' as const, label: isModerator ? 'چت خصوصی‌ها' : 'پیام خصوصی' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSidebarSection(tab.id)}
                    className={`py-1.5 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                      sidebarSection === tab.id
                        ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* فهرست اسکرول‌پذیر اتاق‌ها */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
              {/* وضعیت بسته بودن کل سامانه */}
              {!chatSettings.isChatSystemEnabled && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-[11px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>سامانه چت هم‌اکنون توسط مدیر کل بسته شده است.</span>
                </div>
              )}

              {/* ۱. تالار گفتگوی عمومی (همیشه پین در بالا برای تمام کاربران) */}
              {sidebarSection !== 'dms' && publicForum && (
                <div className="space-y-1.5">
                  <div className="px-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wide flex items-center justify-between">
                    <span>تالار عمومی دانشگاه</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                        chatSettings.isPublicForumOpen && !publicForum.isClosed
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {chatSettings.isPublicForumOpen && !publicForum.isClosed ? 'باز' : 'بسته'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRoomId(PUBLIC_FORUM_ID);
                      setSelectedRoomType('public');
                      setMobileShowChat(true);
                    }}
                    className={`w-full text-right p-3 rounded-2xl border transition flex items-center gap-3 cursor-pointer ${
                      selectedRoomId === PUBLIC_FORUM_ID
                        ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-300 dark:border-teal-700 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-teal-300'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                          {publicForum.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {messages
                            .filter((m) => m.roomId === PUBLIC_FORUM_ID)
                            .length.toLocaleString('fa-IR')}{' '}
                          پیام
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {chatSettings.isPublicForumOpen && !publicForum.isClosed
                          ? 'همه کاربران مجاز به مشاهده و ارسال پیام هستند'
                          : 'ارسال پیام توسط مدیر بسته شده است'}
                      </p>
                    </div>
                  </button>
                </div>
              )}

              {/* ۲. تالارها و گروه‌های تخصصی */}
              {sidebarSection !== 'dms' && (
                <div className="space-y-1.5">
                  <div className="px-2 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-400">
                      تالارها، گروه‌ها و انجمن‌های تخصصی ({visibleSpecializedForums.length.toLocaleString('fa-IR')})
                    </span>
                    {(isAdmin || (chatSettings.isGroupCreationEnabled && chatSettings.isChatSystemEnabled)) && (
                      <button
                        type="button"
                        onClick={() => setIsCreateForumOpen(true)}
                        className="text-[10px] font-extrabold text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isAdmin ? 'ایجاد تالار' : 'درخواست تالار'}</span>
                      </button>
                    )}
                  </div>

                  {visibleSpecializedForums.length === 0 ? (
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                      <p className="text-[11px] text-slate-500">
                        هنوز تالار تخصصی فعالی برای شرایط شما ثبت نشده است.
                      </p>
                      {(isAdmin || (chatSettings.isGroupCreationEnabled && chatSettings.isChatSystemEnabled)) && (
                        <button
                          type="button"
                          onClick={() => setIsCreateForumOpen(true)}
                          className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>درخواست ایجاد تالار تخصصی</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {visibleSpecializedForums.map((forum) => {
                        const cat = FORUM_CATEGORIES_META[forum.category] || FORUM_CATEGORIES_META.other;
                        const active = selectedRoomId === forum.id;
                        const count = messages.filter((m) => m.roomId === forum.id).length;
                        return (
                          <button
                            key={forum.id}
                            type="button"
                            onClick={() => {
                              setSelectedRoomId(forum.id);
                              setSelectedRoomType('forum');
                              setMobileShowChat(true);
                            }}
                            className={`w-full text-right p-2.5 rounded-2xl border transition flex items-center gap-2.5 cursor-pointer ${
                              active
                                ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 shadow-xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300'
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${cat.gradient} text-white flex items-center justify-center shrink-0 font-black text-xs`}
                            >
                              {forum.title.slice(0, 1)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                  {forum.title}
                                </span>
                                {forum.status === 'pending' ? (
                                  <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-extrabold shrink-0">
                                    در انتظار تأیید
                                  </span>
                                ) : forum.status === 'rejected' ? (
                                  <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-extrabold shrink-0">
                                    رد شده
                                  </span>
                                ) : forum.isClosed ? (
                                  <Lock className="w-3 h-3 text-rose-500 shrink-0" />
                                ) : (
                                  <span className="text-[10px] text-slate-400 shrink-0">
                                    {count.toLocaleString('fa-IR')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5 overflow-hidden">
                                <span className="text-[10px] text-slate-500 truncate">
                                  {cat.label}
                                  {forum.tags.length > 0 ? ` • #${forum.tags[0]}` : ''}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ۳. گفتگوی خصوصی با شماره دانشجویی (برای دانشجویان + نظارت همه چت‌های خصوصی برای مدیر/حراست/معاونت) */}
              {sidebarSection !== 'forums' && (isStudent || isModerator) && (
                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <div className="px-2 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-400">
                      {isModerator
                        ? `نظارت بر گفتگوهای خصوصی دانشجویان (${dmRooms.length.toLocaleString('fa-IR')})`
                        : 'گفتگوی خصوصی (با شماره دانشجویی)'}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                        chatSettings.isPrivateChatEnabled
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {chatSettings.isPrivateChatEnabled ? 'باز' : 'بسته'}
                    </span>
                  </div>

                  {/* باکس شروع گفتگوی جدید با شماره دانشجویی برای دانشجو */}
                  {isStudent && (
                    <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                      {chatSettings.isPrivateChatEnabled && chatSettings.isChatSystemEnabled ? (
                        <>
                          <form onSubmit={handleLookupStudentForDm} className="flex gap-1.5">
                            <input
                              type="text"
                              value={dmLookupInput}
                              onChange={(e) => setDmLookupInput(e.target.value)}
                              placeholder="شماره دانشجویی مخاطب..."
                              className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                            />
                            <button
                              type="submit"
                              disabled={dmLookupLoading}
                              className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>{dmLookupLoading ? '...' : 'جستجو'}</span>
                            </button>
                          </form>
                          <p className="text-[10px] text-slate-400 leading-4">
                            شماره دانشجویی نقش شناسه گفتگو را دارد؛ شماره تماس و کد ملی هرگز نمایش داده نمی‌شود.
                          </p>
                          {dmLookupError && (
                            <div className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                              {dmLookupError}
                            </div>
                          )}
                          {dmLookupProfile && (
                            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                  {dmLookupProfile.fullName}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {dmLookupProfile.fieldOfStudy} • ورودی {dmLookupProfile.entryTerm}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenDmWithProfile(dmLookupProfile)}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-extrabold shrink-0 cursor-pointer"
                              >
                                شروع چت
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>امکان ارسال پیام خصوصی بین دانشجویان هم‌اکنون توسط مدیر بسته است.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* لیست رشته‌گفتگوهای خصوصی */}
                  {dmRooms.length === 0 ? (
                    <div className="px-3 py-4 text-center text-[11px] text-slate-400">
                      {isModerator
                        ? 'هنوز گفتگوی خصوصی بین دانشجویان ثبت نشده است.'
                        : 'هنوز گفتگوی خصوصی ندارید.'}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {dmRooms.map((dm) => {
                        const active = selectedRoomId === dm.roomId;
                        const label = isModerator
                          ? `${dm.participantNames[0]} ↔ ${dm.participantNames[1]}`
                          : dm.otherStudentName || 'دانشجو';
                        const subLabel = isModerator
                          ? `${dm.participants[0]} • ${dm.participants[1]}`
                          : `کد دانشجویی: ${dm.otherStudentId}`;
                        return (
                          <button
                            key={dm.roomId}
                            type="button"
                            onClick={() => {
                              setSelectedRoomId(dm.roomId);
                              setSelectedRoomType('dm');
                              setActiveDmParticipants({
                                ids: dm.participants,
                                names: dm.participantNames,
                              });
                              setMobileShowChat(true);
                            }}
                            className={`w-full text-right p-2.5 rounded-2xl border transition flex items-center gap-2.5 cursor-pointer ${
                              active
                                ? 'bg-violet-50 dark:bg-violet-950/50 border-violet-300 dark:border-violet-700 shadow-xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-violet-300'
                            }`}
                          >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                              {label.slice(0, 1)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                  {label}
                                </span>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {dm.messageCount.toLocaleString('fa-IR')}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">{subLabel}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* ================= ستون اصلی اتاق گفتگو ================= */}
          <main
            className={`${
              mobileShowChat ? 'flex' : 'hidden md:flex'
            } flex-1 flex-col bg-slate-100/60 dark:bg-slate-950/80 overflow-hidden min-w-0`}
          >
            {/* هدر اتاق فعال */}
            <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer shrink-0"
                  aria-label="بازگشت به لیست"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {activeRoomTitle}
                    </h3>
                    {selectedRoomType === 'public' && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          chatSettings.isPublicForumOpen && !publicForum?.isClosed
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                        }`}
                      >
                        {chatSettings.isPublicForumOpen && !publicForum?.isClosed
                          ? 'باز برای گفتگو'
                          : 'بسته شده توسط مدیر'}
                      </span>
                    )}
                    {selectedRoomType === 'dm' && isModerator && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        حالت نظارت بر چت خصوصی
                      </span>
                    )}
                  </div>
                  {activeForum && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                      {!activeForum.isPublicForum && (
                        <span>
                          اعضا: {(activeForum.memberIds?.length || 0).toLocaleString('fa-IR')} نفر
                        </span>
                      )}
                      {activeForum.tags.slice(0, 4).map((t) => (
                        <span key={t} className="text-teal-600 dark:text-teal-400 font-bold">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* دکمه‌های سریع هدر */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* عضویت / خروج دانشجو در تالار تخصصی */}
                {isStudent &&
                  selectedRoomType === 'forum' &&
                  activeForum &&
                  activeForum.status === 'active' && (
                    activeForum.memberIds.includes(me.id) ? (
                      <button
                        type="button"
                        onClick={() => {
                          const res = Storage.leaveCommunityForum(activeForum.id, me.id);
                          reloadLocal();
                          showToast(res.message, 'success');
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">خروج از تالار</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const res = Storage.joinCommunityForum(activeForum.id, me.id);
                          reloadLocal();
                          showToast(res.message, 'success');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>عضویت در تالار</span>
                      </button>
                    )
                  )}

                {/* مسدودسازی شخصی در چت خصوصی برای دانشجو */}
                {isStudent && selectedRoomType === 'dm' && activeDmRoom?.otherStudentId && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!activeDmRoom.otherStudentId) return;
                      const res = Storage.toggleBlockStudentInChat(me.id, activeDmRoom.otherStudentId);
                      reloadLocal();
                      showToast(res.message, res.blocked ? 'error' : 'success');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {Storage.isStudentBlockedBetween(me.id, activeDmRoom.otherStudentId)
                        ? 'رفع مسدودیت'
                        : 'مسدود کردن'}
                    </span>
                  </button>
                )}

                {/* باز/بسته سریع تالار عمومی یا تالار تخصصی برای مدیر/حراست */}
                {(isAdmin || isSecurity) &&
                  (selectedRoomType === 'public' || selectedRoomType === 'forum') &&
                  activeForum && (
                    <button
                      type="button"
                      onClick={() => {
                        const currentlyClosed =
                          selectedRoomType === 'public'
                            ? !chatSettings.isPublicForumOpen || Boolean(activeForum.isClosed)
                            : Boolean(activeForum.isClosed);
                        const res = Storage.toggleCommunityForumLock(activeForum.id, {
                          isClosed: !currentlyClosed,
                          actorName: me.name,
                        });
                        reloadLocal();
                        showToast(res.message, 'success');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 cursor-pointer ${
                        (selectedRoomType === 'public'
                          ? !chatSettings.isPublicForumOpen || activeForum.isClosed
                          : activeForum.isClosed)
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {(selectedRoomType === 'public'
                        ? !chatSettings.isPublicForumOpen || activeForum.isClosed
                        : activeForum.isClosed) ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>باز کردن گفتگو</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>بستن گفتگو</span>
                        </>
                      )}
                    </button>
                  )}
              </div>
            </div>

            {/* بنر اطلاعیه پین‌شده تالار عمومی */}
            {selectedRoomType === 'public' && chatSettings.publicForumNotice && (
              <div className="px-4 py-2 bg-teal-50/90 dark:bg-teal-950/40 border-b border-teal-200/80 dark:border-teal-800/70 text-[11px] text-teal-900 dark:text-teal-200 flex items-center gap-2 shrink-0">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="font-bold leading-5">{chatSettings.publicForumNotice}</span>
              </div>
            )}

            {/* وضعیت تالار در انتظار تأیید */}
            {selectedRoomType === 'forum' && activeForum && activeForum.status === 'pending' && (
              <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    این تالار در صف تأیید دوگانه قرار دارد — مدیر:{' '}
                    {activeForum.adminApproval.status === 'approved' ? 'تأیید ✓' : 'در انتظار'} | حراست:{' '}
                    {activeForum.securityApproval.status === 'approved' ? 'تأیید ✓' : 'در انتظار'}
                  </span>
                </div>
                {(isAdmin || isSecurity) && (
                  <button
                    type="button"
                    onClick={() => setActiveView('moderation')}
                    className="px-3 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-extrabold cursor-pointer"
                  >
                    بررسی و تأیید
                  </button>
                )}
              </div>
            )}

            {/* جریان پیام‌ها */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeRoomMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                  <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-teal-600 mb-3 shadow-xs">
                    <MessageCircle className="w-8 h-8" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                    هنوز پیامی در «{activeRoomTitle}» ارسال نشده است
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    گفتگو را با رعایت ادب و شأن دانشجومعلمی آغاز کنید. تمام پیام‌ها با نظارت رسمی سامانه ثبت می‌شوند.
                  </p>
                </div>
              ) : (
                activeRoomMessages.map((msg) => {
                  const isMine = msg.senderId === me.id && msg.senderRole === me.role;
                  const sticker = getStickerById(msg.stickerId);

                  // پیام حذف‌شده
                  if (msg.isDeleted) {
                    return (
                      <div
                        key={msg.id}
                        className="flex justify-center"
                      >
                        <div className="px-3.5 py-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400 italic">
                          پیام {msg.senderName} توسط {msg.deletedBy || 'ناظر'} حذف شد ({msg.deleteReason || 'مغایرت با قوانین'}).
                        </div>
                      </div>
                    );
                  }

                  // اخطار رسمی ناظر (کارت متمایز تمام‌عرض)
                  if (msg.isWarningMessage) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <div className="w-full max-w-xl p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-700 shadow-xs space-y-1.5">
                          <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold text-rose-700 dark:text-rose-300">
                            <span className="flex items-center gap-1.5">
                              <ShieldAlert className="w-4 h-4" />
                              اخطار رسمی {getRoleDisplayLabel(msg.senderRole)} ({msg.senderName})
                            </span>
                            <span className="text-[10px] opacity-80">{msg.createdAt}</span>
                          </div>
                          <p className="text-xs font-bold text-rose-950 dark:text-rose-100 leading-6 whitespace-pre-wrap">
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  // پیام رسمی ناظر
                  if (msg.isModeratorMessage) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <div className="w-full max-w-xl p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-300 dark:border-indigo-700 shadow-xs space-y-1.5">
                          <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4" />
                              پیام رسمی ناظر • {msg.senderName} ({getRoleDisplayLabel(msg.senderRole)})
                            </span>
                            <span className="text-[10px] opacity-80">{msg.createdAt}</span>
                          </div>
                          {msg.text && (
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-6 whitespace-pre-wrap">
                              {msg.text}
                            </p>
                          )}
                          {msg.imageUrl && (
                            <img
                              src={msg.imageUrl}
                              alt="تصویر ناظر"
                              onClick={() => setLightboxImage(msg.imageUrl || null)}
                              className="max-h-56 rounded-xl cursor-zoom-in border border-indigo-200 dark:border-indigo-800"
                            />
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-start' : 'items-end'} group`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[72%] rounded-2xl px-3.5 py-2.5 shadow-xs border ${
                          isMine
                            ? 'bg-gradient-to-br from-teal-600 to-emerald-600 text-white border-teal-600 rounded-tr-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 rounded-tl-sm'
                        }`}
                      >
                        {/* نام فرستنده و نقش */}
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`text-[11px] font-extrabold truncate ${
                                isMine ? 'text-teal-50' : 'text-teal-700 dark:text-teal-300'
                              }`}
                            >
                              {msg.senderName}
                            </span>
                            {msg.senderRole !== 'student' ? (
                              <span
                                className={`px-1.5 py-0.5 rounded-md text-[9px] font-black shrink-0 ${
                                  isMine
                                    ? 'bg-white/20 text-white'
                                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                }`}
                              >
                                {getRoleDisplayLabel(msg.senderRole)}
                              </span>
                            ) : msg.senderFieldOfStudy ? (
                              <span
                                className={`text-[9px] truncate hidden sm:inline ${
                                  isMine ? 'text-teal-100/80' : 'text-slate-400'
                                }`}
                              >
                                ({msg.senderFieldOfStudy})
                              </span>
                            ) : null}
                          </div>
                          <span
                            className={`text-[9px] shrink-0 ${
                              isMine ? 'text-teal-100/80' : 'text-slate-400'
                            }`}
                          >
                            {msg.createdAt}
                          </span>
                        </div>

                        {/* نقل‌قول پاسخ */}
                        {msg.replyToText && (
                          <div
                            className={`mb-2 px-2.5 py-1.5 rounded-xl text-[10px] border-r-2 ${
                              isMine
                                ? 'bg-black/15 border-teal-200 text-teal-50'
                                : 'bg-slate-50 dark:bg-slate-800 border-teal-500 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <div className="font-extrabold">{msg.replyToSenderName}</div>
                            <div className="truncate opacity-85">{msg.replyToText}</div>
                          </div>
                        )}

                        {/* استیکر */}
                        {sticker && (
                          <div
                            className={`my-1 px-4 py-3 rounded-2xl bg-gradient-to-br ${sticker.bgGradient} border ${sticker.borderColor} inline-flex flex-col items-center gap-1`}
                          >
                            <span className="text-4xl leading-none">{sticker.emoji}</span>
                            <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
                              {sticker.label}
                            </span>
                          </div>
                        )}

                        {/* تصویر پیوست */}
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt="تصویر ارسالی"
                            onClick={() => setLightboxImage(msg.imageUrl || null)}
                            className="my-1.5 max-h-60 rounded-xl object-cover cursor-zoom-in border border-black/10"
                          />
                        )}

                        {/* متن پیام */}
                        {msg.text && (
                          <p className="text-xs sm:text-[13px] leading-6 whitespace-pre-wrap break-words">
                            {msg.text}
                          </p>
                        )}
                      </div>

                      {/* اکشن‌های سریع زیر هر پیام */}
                      <div className="flex items-center gap-1 mt-1 px-1 opacity-85 sm:opacity-0 sm:group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => setReplyTo(msg)}
                          className="p-1 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-white dark:hover:bg-slate-800 text-[10px] flex items-center gap-0.5 cursor-pointer"
                          title="پاسخ به این پیام"
                        >
                          <Reply className="w-3 h-3" />
                          <span>پاسخ</span>
                        </button>

                        {!isMine && !isModerator && (
                          <button
                            type="button"
                            onClick={() => setReportingMessage(msg)}
                            className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-white dark:hover:bg-slate-800 text-[10px] flex items-center gap-0.5 cursor-pointer"
                            title="گزارش تخلف به مدیر و حراست"
                          >
                            <Flag className="w-3 h-3" />
                            <span>گزارش</span>
                          </button>
                        )}

                        {isModerator && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const res = Storage.deleteCommunityChatMessage(msg.id, {
                                  actorName: me.name,
                                });
                                reloadLocal();
                                showToast(res.message, 'success');
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 text-[10px] flex items-center gap-0.5 cursor-pointer"
                              title="حذف پیام"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>حذف</span>
                            </button>
                            {msg.senderRole === 'student' && (
                              <button
                                type="button"
                                onClick={() =>
                                  setQuickBanTarget({
                                    studentId: msg.senderId,
                                    studentName: msg.senderName,
                                  })
                                }
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-white dark:hover:bg-slate-800 text-[10px] flex items-center gap-0.5 cursor-pointer"
                                title="مسدودسازی این دانشجو از چت"
                              >
                                <Ban className="w-3 h-3" />
                                <span>مسدودسازی</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ================= بخش ارسال پیام (Composer) ================= */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0 relative">
              {/* پنل انتخاب استیکر */}
              {isStickerPickerOpen && canUseStickers && (
                <div className="absolute bottom-full right-3 left-3 mb-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl z-20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                      استیکرهای دانشگاهی (کلیک برای ارسال فوری)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsStickerPickerOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 max-h-44 overflow-y-auto">
                    {COMMUNITY_STICKERS.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleSendMessage(st.id)}
                        className={`p-2 rounded-xl bg-gradient-to-br ${st.bgGradient} border ${st.borderColor} hover:scale-105 transition flex flex-col items-center gap-0.5 cursor-pointer`}
                      >
                        <span className="text-2xl leading-none">{st.emoji}</span>
                        <span className="text-[9px] font-bold text-slate-700 dark:text-slate-200 truncate w-full text-center">
                          {st.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* نوار پیش‌نمایش پاسخ */}
              {replyTo && (
                <div className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 truncate">
                    <span className="font-extrabold text-teal-700 dark:text-teal-300">
                      پاسخ به {replyTo.senderName}:{' '}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {replyTo.text || '[پیوست]'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* نوار پیش‌نمایش تصویر انتخابی */}
              {draftImage && (
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={draftImage}
                      alt="پیش‌نمایش"
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      تصویر فشرده‌سازی شده و آماده ارسال است
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraftImage(null)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* انتخاب نوع پیام برای ناظران (عادی / پیام رسمی ناظر / اخطار رسمی) */}
              {isModerator && (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="font-bold text-slate-500">حالت ارسال ناظر:</span>
                  {[
                    { id: 'normal' as const, label: 'پیام عادی', cls: 'bg-teal-600 text-white' },
                    { id: 'moderator' as const, label: 'پیام رسمی ناظر', cls: 'bg-indigo-600 text-white' },
                    { id: 'warning' as const, label: 'ثبت اخطار رسمی', cls: 'bg-rose-600 text-white' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setModeratorPostMode(m.id)}
                      className={`px-2.5 py-1 rounded-lg font-extrabold transition cursor-pointer ${
                        moderatorPostMode === m.id
                          ? m.cls
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}

              {/* اگر ارسال پیام مسدود یا قفل باشد */}
              {composerBlockReason ? (
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 text-center">
                  <Lock className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{composerBlockReason}</span>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSelectPhotoFile}
                    className="hidden"
                  />

                  {/* دکمه استیکر */}
                  <button
                    type="button"
                    disabled={!canUseStickers}
                    onClick={() => setIsStickerPickerOpen((p) => !p)}
                    title={
                      canUseStickers
                        ? 'ارسال استیکر'
                        : 'ارسال استیکر توسط مدیر غیرفعال است'
                    }
                    className={`p-2.5 rounded-xl border transition shrink-0 ${
                      canUseStickers
                        ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-amber-600 hover:bg-amber-50 cursor-pointer'
                        : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  {/* دکمه عکس */}
                  <button
                    type="button"
                    disabled={!canAttachPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    title={
                      canAttachPhoto
                        ? 'پیوست تصویر'
                        : 'ارسال عکس نیازمند فعال‌سازی و مجوز مدیر سامانه است'
                    }
                    className={`p-2.5 rounded-xl border transition shrink-0 ${
                      canAttachPhoto
                        ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sky-600 hover:bg-sky-50 cursor-pointer'
                        : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>

                  {/* ورودی متن */}
                  <textarea
                    rows={1}
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={
                      isModerator && moderatorPostMode === 'warning'
                        ? 'متن اخطار رسمی جهت نمایش برجسته در این گفتگو را بنویسید...'
                        : 'پیام خود را بنویسید... (Enter برای ارسال)'
                    }
                    className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 max-h-28"
                  />

                  {/* دکمه ارسال */}
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    className={`px-4 py-2.5 rounded-2xl text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0 ${
                      isModerator && moderatorPostMode === 'warning'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : isModerator && moderatorPostMode === 'moderator'
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'bg-teal-600 hover:bg-teal-700'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">ارسال</span>
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* ================= مودال درخواست ایجاد تالار تخصصی ================= */}
      {isCreateForumOpen && (
        <CommunityForumRequestModal
          currentUser={currentUser}
          chatSettings={chatSettings}
          students={students}
          onClose={() => setIsCreateForumOpen(false)}
          onCreated={(msg, forumId) => {
            setIsCreateForumOpen(false);
            reloadLocal();
            onRefreshGlobalData?.();
            showToast(msg, 'success');
            if (forumId) {
              setSelectedRoomId(forumId);
              setSelectedRoomType('forum');
              setActiveView('chat');
              setMobileShowChat(true);
            }
          }}
        />
      )}

      {/* ================= مودال گزارش تخلف پیام ================= */}
      {reportingMessage && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/60 p-4"
          dir="rtl"
        >
          <form
            onSubmit={handleSubmitReport}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <Flag className="w-4 h-4" />
                <span>گزارش تخلف به مدیر، معاونت و حراست</span>
              </h4>
              <button
                type="button"
                onClick={() => setReportingMessage(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <div className="font-bold text-slate-800 dark:text-white mb-1">
                پیام {reportingMessage.senderName}:
              </div>
              <p className="line-clamp-3">{reportingMessage.text || '[تصویر/استیکر]'}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                علت گزارش تخلف *
              </label>
              <textarea
                required
                rows={3}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="مثلاً: توهین، بحث سیاسی غیرمجاز، مزاحمت یا انتشار محتوای خلاف قوانین..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportingMessage(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold cursor-pointer"
              >
                ارسال گزارش تخلف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= مودال مسدودسازی سریع دانشجو از روی پیام ================= */}
      {quickBanTarget && isModerator && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/60 p-4"
          dir="rtl"
        >
          <form
            onSubmit={handleSubmitQuickBan}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <Ban className="w-4 h-4" />
                <span>مسدودسازی دانشجو از پیام‌رسان</span>
              </h4>
              <button
                type="button"
                onClick={() => setQuickBanTarget(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300">
              دانشجو: <strong>{quickBanTarget.studentName}</strong> ({quickBanTarget.studentId})
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                علت مسدودسازی *
              </label>
              <input
                type="text"
                required
                value={quickBanReason}
                onChange={(e) => setQuickBanReason(e.target.value)}
                placeholder="علت مسدودیت را وارد نمایید..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickBanTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold cursor-pointer"
              >
                مسدودسازی فوری
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= لایت‌باکس نمایش تصویر تمام‌صفحه ================= */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 left-4 p-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxImage}
            alt="نمایش بزرگ تصویر"
            className="max-w-full max-h-[88vh] rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );

  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
        {containerInner}
      </div>
    );
  }

  return containerInner;
};
