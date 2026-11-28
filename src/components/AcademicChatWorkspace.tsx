import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AcademicChatForumTopic,
  AcademicChatMemberRole,
  AcademicChatMessage,
  AcademicChatParticipant,
  AcademicChatRoom,
} from '../types';
import { Storage } from '../utils/storage';
import {
  broadcastAcademicChatEvent,
  getAcademicChatReadMap,
  getAcademicRoomUnreadCount,
  markAcademicRoomRead,
  subscribeAcademicChatRealtime,
} from '../utils/academicChatRealtime';
import { useGlobalOnlineUserIds } from '../utils/realtimePresence';
import { normalizePersianSearch } from '../utils/storage';
import {
  Check,
  CheckCheck,
  CornerUpLeft,
  Edit3,
  Hash,
  MessageCircle,
  MessageSquarePlus,
  MessagesSquare,
  Pin,
  PinOff,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

export interface AcademicChatActor {
  id: string;
  name: string;
  role: AcademicChatMemberRole;
  assignedFields?: string[];
}

interface AcademicChatWorkspaceProps {
  mode: 'embedded' | 'modal';
  isOpen?: boolean;
  onClose?: () => void;
  actor: AcademicChatActor;
  initialTargetParticipantId?: string | null;
  cloudSyncTick?: number;
  onUnreadChange?: () => void;
}

const FORUM_TOPIC_META: Record<
  AcademicChatForumTopic,
  { label: string; badgeClass: string; shortLabel: string }
> = {
  curriculum: {
    label: 'برنامه درسی و تدوین ترم',
    shortLabel: 'برنامه درسی',
    badgeClass:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800',
  },
  education_affairs: {
    label: 'امور آموزشی، سرفصل‌ها و قوانین',
    shortLabel: 'امور آموزشی',
    badgeClass:
      'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-200 border-sky-200 dark:border-sky-800',
  },
  department_coordination: {
    label: 'هماهنگی مدیران گروه و کارشناسان',
    shortLabel: 'هماهنگی گروه‌ها',
    badgeClass:
      'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-200 border-teal-200 dark:border-teal-800',
  },
  graduation: {
    label: 'امور فارغ‌التحصیلان و تسویه',
    shortLabel: 'فارغ‌التحصیلان',
    badgeClass:
      'bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-200 border-violet-200 dark:border-violet-800',
  },
  general: {
    label: 'پیشنهادات و مسائل عمومی معاونت',
    shortLabel: 'عمومی معاونت',
    badgeClass:
      'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200 border-amber-200 dark:border-amber-800',
  },
};

const FORUM_ISSUE_TAGS = ['برنامه درسی', 'کمبود کلاس / استاد', 'تداخل ساعات', 'پیشنهاد اصلاحی', 'فوری'];

function getRolePillClass(role: AcademicChatMemberRole): string {
  switch (role) {
    case 'academic_deputy':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200';
    case 'department_head':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200';
    case 'education_expert':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200';
    case 'graduation':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200';
    case 'admin':
    default:
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200';
  }
}

export const AcademicChatWorkspace: React.FC<AcademicChatWorkspaceProps> = ({
  mode,
  isOpen = true,
  onClose,
  actor,
  initialTargetParticipantId,
  cloudSyncTick,
  onUnreadChange,
}) => {
  const onlineIds = useGlobalOnlineUserIds();
  const [rooms, setRooms] = useState<AcademicChatRoom[]>(() => Storage.getAcademicChatRooms());
  const [messages, setMessages] = useState<AcademicChatMessage[]>(() => Storage.getAcademicChatMessages());
  const [participants, setParticipants] = useState<AcademicChatParticipant[]>(() =>
    Storage.getAcademicChatParticipants()
  );
  const [readMap, setReadMap] = useState<Record<string, string>>(() =>
    getAcademicChatReadMap(actor.id)
  );

  const [selectedRoomId, setSelectedRoomId] = useState<string>(() => {
    const initialRooms = Storage.getAcademicChatRooms();
    const pinnedForum = initialRooms.find((r) => r.type === 'forum' && r.isPinned);
    return pinnedForum?.id || initialRooms[0]?.id || 'forum_academic_general_curriculum';
  });

  const [sidebarSearch, setSidebarSearch] = useState('');
  const [listFilter, setListFilter] = useState<'all' | 'forum' | 'chat'>('all');

  // وضعیت تایپ هم‌زمان کاربران
  const [typingByRoom, setTypingByRoom] = useState<
    Record<string, Record<string, { name: string; expiresAt: number }>>
  >({});
  const lastTypingBroadcastRef = useRef<number>(0);

  // کامپوزر و پاسخ/ویرایش
  const [draftText, setDraftText] = useState('');
  const [selectedIssueTag, setSelectedIssueTag] = useState<string>('');
  const [replyTarget, setReplyTarget] = useState<AcademicChatMessage | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // مدال‌های ایجاد گفتگو / گروه / تالار مشترک
  const [activeCreatorModal, setActiveCreatorModal] = useState<
    null | 'dm' | 'group' | 'forum' | 'manage_members'
  >(null);
  const [dmSearch, setDmSearch] = useState('');
  const [dmRoleFilter, setDmRoleFilter] = useState<string>('all');

  const [groupTitle, setGroupTitle] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupMemberSearch, setGroupMemberSearch] = useState('');
  const [groupSelectedIds, setGroupSelectedIds] = useState<string[]>([]);

  const [forumTitle, setForumTitle] = useState('');
  const [forumTopic, setForumTopic] = useState<AcademicChatForumTopic>('curriculum');
  const [forumDesc, setForumDesc] = useState('');
  const [forumPinned, setForumPinned] = useState(true);

  const [showParticipantsDrawer, setShowParticipantsDrawer] = useState(false);
  const [mobileShowChatPane, setMobileShowChatPane] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const syncFromStorage = () => {
    setRooms(Storage.getAcademicChatRooms());
    setMessages(Storage.getAcademicChatMessages());
    setParticipants(Storage.getAcademicChatParticipants());
    setReadMap(getAcademicChatReadMap(actor.id));
    onUnreadChange?.();
  };

  // همگام‌سازی خودکار هنگام تغییر cloudSyncTick یا باز شدن مدال
  useEffect(() => {
    if (mode === 'modal' && !isOpen) return;
    syncFromStorage();
  }, [cloudSyncTick, isOpen, actor.id]);

  // اشتراک در کانال زنده Supabase + BroadcastChannel
  useEffect(() => {
    if (mode === 'modal' && !isOpen) return;
    const unsubscribe = subscribeAcademicChatRealtime({
      onDataUpdated: () => {
        syncFromStorage();
      },
      onTyping: (evt) => {
        if (evt.senderId === actor.id) return;
        setTypingByRoom((prev) => {
          const roomTypers = { ...(prev[evt.roomId] || {}) };
          if (evt.isTyping) {
            roomTypers[evt.senderId] = {
              name: evt.senderName,
              expiresAt: Date.now() + 3600,
            };
          } else {
            delete roomTypers[evt.senderId];
          }
          return { ...prev, [evt.roomId]: roomTypers };
        });
      },
    });
    return unsubscribe;
  }, [actor.id, mode, isOpen]);

  // پاک‌سازی نشانگر تایپ منقضی‌شده هر ۱.۵ ثانیه (فقط در صورت وجود تایپ فعال)
  useEffect(() => {
    const hasAnyTyping = Object.values(typingByRoom).some((m) => Object.keys(m).length > 0);
    if (!hasAnyTyping) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setTypingByRoom((prev) => {
        let changed = false;
        const next: typeof prev = {};
        for (const [rId, map] of Object.entries(prev)) {
          const kept: Record<string, { name: string; expiresAt: number }> = {};
          for (const [uId, info] of Object.entries(map)) {
            if (info.expiresAt > now) {
              kept[uId] = info;
            } else {
              changed = true;
            }
          }
          if (Object.keys(kept).length > 0) next[rId] = kept;
        }
        return changed ? next : prev;
      });
    }, 1500);
    return () => clearInterval(timer);
  }, [typingByRoom]);

  // باز کردن مستقیم چت دو به دو در صورت دریافت initialTargetParticipantId (مثلاً از تب اعضای معاونت)
  useEffect(() => {
    if (!initialTargetParticipantId || initialTargetParticipantId === actor.id) return;
    const latestParticipants = Storage.getAcademicChatParticipants();
    const target = latestParticipants.find((p) => p.id === initialTargetParticipantId);
    if (!target) return;
    const { room, created } = Storage.createOrGetAcademicDmRoom(
      { id: actor.id, name: actor.name, role: actor.role },
      target
    );
    if (created) {
      broadcastAcademicChatEvent({ kind: 'room_upsert', room, actorId: actor.id });
    }
    syncFromStorage();
    setSelectedRoomId(room.id);
    setMobileShowChatPane(true);
  }, [initialTargetParticipantId]);

  const participantById = useMemo(() => {
    const map = new Map<string, AcademicChatParticipant>();
    participants.forEach((p) => map.set(p.id, p));
    return map;
  }, [participants]);

  // اتاق‌های قابل دسترس برای کاربر فعلی
  const accessibleRooms = useMemo(() => {
    return rooms.filter(
      (r) =>
        r.type === 'forum' ||
        r.creatorId === actor.id ||
        r.memberIds.includes(actor.id)
    );
  }, [rooms, actor.id]);

  // پیام‌ها و آخرین پیام هر اتاق
  const messagesByRoomId = useMemo(() => {
    const map = new Map<string, AcademicChatMessage[]>();
    for (const m of messages) {
      const arr = map.get(m.roomId) || [];
      arr.push(m);
      map.set(m.roomId, arr);
    }
    return map;
  }, [messages]);

  const getRoomDisplayInfo = (room: AcademicChatRoom) => {
    if (room.type === 'dm') {
      const otherId = room.memberIds.find((id) => id !== actor.id) || actor.id;
      const other = participantById.get(otherId);
      const displayName = other?.name || room.title;
      const isOnline = other ? onlineIds.has(other.id) : false;
      return {
        title: displayName,
        subtitle: other
          ? `${other.roleLabel}${other.assignedFields?.length ? ` • ${other.assignedFields.slice(0, 2).join('، ')}` : ''}`
          : 'گفتگوی مستقیم دو به دو',
        otherParticipant: other,
        isOnline,
      };
    }
    if (room.type === 'group') {
      const memberOnlineCount = room.memberIds.filter(
        (id) => id !== actor.id && onlineIds.has(id)
      ).length;
      return {
        title: room.title,
        subtitle: `${room.memberIds.length.toLocaleString('fa-IR')} عضو${memberOnlineCount > 0 ? ` • ${memberOnlineCount.toLocaleString('fa-IR')} آنلاین` : ''}`,
        otherParticipant: undefined,
        isOnline: memberOnlineCount > 0,
      };
    }
    const topicMeta = FORUM_TOPIC_META[room.topic || 'general'] || FORUM_TOPIC_META.general;
    return {
      title: room.title,
      subtitle: room.description || topicMeta.label,
      otherParticipant: undefined,
      isOnline: false,
      topicMeta,
    };
  };

  const filteredRooms = useMemo(() => {
    const q = normalizePersianSearch(sidebarSearch);
    const list = accessibleRooms.filter((r) => {
      if (listFilter === 'forum' && r.type !== 'forum') return false;
      if (listFilter === 'chat' && r.type === 'forum') return false;
      if (!q) return true;
      const info = getRoomDisplayInfo(r);
      const hay = normalizePersianSearch(`${info.title} ${info.subtitle} ${r.description || ''}`);
      return hay.includes(q);
    });

    const forums = list
      .filter((r) => r.type === 'forum')
      .sort((a, b) => {
        if (Boolean(a.isPinned) !== Boolean(b.isPinned)) return a.isPinned ? -1 : 1;
        return (b.updatedAtIso || '').localeCompare(a.updatedAtIso || '');
      });

    const chats = list
      .filter((r) => r.type !== 'forum')
      .sort((a, b) => (b.updatedAtIso || '').localeCompare(a.updatedAtIso || ''));

    return { forums, chats };
  }, [accessibleRooms, sidebarSearch, listFilter, onlineIds, participantById]);

  const activeRoom = useMemo(
    () => accessibleRooms.find((r) => r.id === selectedRoomId) || accessibleRooms[0] || null,
    [accessibleRooms, selectedRoomId]
  );

  const activeRoomMessages = useMemo(
    () => (activeRoom ? messagesByRoomId.get(activeRoom.id) || [] : []),
    [activeRoom, messagesByRoomId]
  );

  // ثبت خوانده‌شدن پیام‌های اتاق فعال
  useEffect(() => {
    if (!activeRoom) return;
    if (mode === 'modal' && !isOpen) return;
    const lastMsg = activeRoomMessages[activeRoomMessages.length - 1];
    const readIso = lastMsg?.createdAtIso || new Date().toISOString();
    markAcademicRoomRead(actor.id, activeRoom.id, readIso);
    setReadMap(getAcademicChatReadMap(actor.id));
    onUnreadChange?.();
  }, [activeRoom?.id, activeRoomMessages.length, mode, isOpen]);

  // اسکرول خودکار به آخرین پیام هنگام باز شدن یا دریافت پیام جدید
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeRoom?.id, activeRoomMessages.length]);

  const otherParticipants = useMemo(
    () => participants.filter((p) => p.id !== actor.id),
    [participants, actor.id]
  );

  const onlineColleaguesCount = useMemo(
    () => otherParticipants.filter((p) => onlineIds.has(p.id)).length,
    [otherParticipants, onlineIds]
  );

  const handleOpenOrStartDm = (target: AcademicChatParticipant) => {
    const { room, created } = Storage.createOrGetAcademicDmRoom(
      { id: actor.id, name: actor.name, role: actor.role },
      target
    );
    if (created) {
      broadcastAcademicChatEvent({ kind: 'room_upsert', room, actorId: actor.id });
    }
    syncFromStorage();
    setSelectedRoomId(room.id);
    setMobileShowChatPane(true);
    setActiveCreatorModal(null);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupTitle.trim()) {
      showToast('error', 'لطفاً عنوان گروه را وارد نمایید.');
      return;
    }
    if (groupSelectedIds.length === 0) {
      showToast('error', 'حداقل یک همکار را برای عضویت در گروه انتخاب کنید.');
      return;
    }
    const created = Storage.createAcademicGroupRoom({
      title: groupTitle,
      description: groupDesc,
      creator: { id: actor.id, name: actor.name, role: actor.role },
      memberIds: groupSelectedIds,
    });
    broadcastAcademicChatEvent({ kind: 'room_upsert', room: created, actorId: actor.id });
    syncFromStorage();
    setSelectedRoomId(created.id);
    setMobileShowChatPane(true);
    setGroupTitle('');
    setGroupDesc('');
    setGroupSelectedIds([]);
    setActiveCreatorModal(null);
    showToast('success', `گروه «${created.title}» با موفقیت ایجاد شد.`);
  };

  const handleCreateForum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forumTitle.trim()) {
      showToast('error', 'لطفاً عنوان تالار مشترک را وارد نمایید.');
      return;
    }
    const created = Storage.createAcademicSharedForum({
      title: forumTitle,
      description: forumDesc,
      topic: forumTopic,
      isPinned: forumPinned,
      creator: { id: actor.id, name: actor.name, role: actor.role },
    });
    broadcastAcademicChatEvent({ kind: 'room_upsert', room: created, actorId: actor.id });
    syncFromStorage();
    setSelectedRoomId(created.id);
    setMobileShowChatPane(true);
    setForumTitle('');
    setForumDesc('');
    setActiveCreatorModal(null);
    showToast('success', `تالار مشترک «${created.title}» ایجاد و برای کل معاونت آموزش فعال شد.`);
  };

  const handleSaveManagedGroupMembers = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom || activeRoom.type !== 'group') return;
    const updated = Storage.updateAcademicGroupMembers(activeRoom.id, groupSelectedIds);
    if (updated) {
      broadcastAcademicChatEvent({ kind: 'room_upsert', room: updated, actorId: actor.id });
      syncFromStorage();
      showToast('success', 'فهرست اعضای گروه بروزرسانی شد.');
    }
    setActiveCreatorModal(null);
  };

  const handleTogglePinForum = (room: AcademicChatRoom) => {
    const updated = Storage.togglePinAcademicForum(room.id);
    if (updated) {
      broadcastAcademicChatEvent({ kind: 'room_upsert', room: updated, actorId: actor.id });
      syncFromStorage();
    }
  };

  const handleDraftChange = (val: string) => {
    setDraftText(val);
    if (!activeRoom) return;
    const now = Date.now();
    if (val.trim() && now - lastTypingBroadcastRef.current > 1800) {
      lastTypingBroadcastRef.current = now;
      broadcastAcademicChatEvent({
        kind: 'typing',
        roomId: activeRoom.id,
        senderId: actor.id,
        senderName: actor.name,
        isTyping: true,
        sentAtMs: now,
      });
    } else if (!val.trim()) {
      broadcastAcademicChatEvent({
        kind: 'typing',
        roomId: activeRoom.id,
        senderId: actor.id,
        senderName: actor.name,
        isTyping: false,
        sentAtMs: now,
      });
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeRoom) return;
    const clean = draftText.trim();
    if (!clean) return;

    const sent = Storage.sendAcademicChatMessage({
      roomId: activeRoom.id,
      sender: {
        id: actor.id,
        name: actor.name,
        role: actor.role,
        assignedFields: actor.assignedFields,
      },
      text: clean,
      issueTag: activeRoom.type === 'forum' ? selectedIssueTag || undefined : undefined,
      replyTo: replyTarget
        ? { id: replyTarget.id, senderName: replyTarget.senderName, text: replyTarget.text }
        : undefined,
    });

    broadcastAcademicChatEvent({ kind: 'message_upsert', message: sent, actorId: actor.id });
    broadcastAcademicChatEvent({
      kind: 'typing',
      roomId: activeRoom.id,
      senderId: actor.id,
      senderName: actor.name,
      isTyping: false,
      sentAtMs: Date.now(),
    });
    markAcademicRoomRead(actor.id, activeRoom.id, sent.createdAtIso);
    setDraftText('');
    setReplyTarget(null);
    syncFromStorage();
  };

  const handleSaveEditMessage = (msgId: string) => {
    if (!editingText.trim()) return;
    const updated = Storage.editAcademicChatMessage(msgId, editingText);
    if (updated) {
      broadcastAcademicChatEvent({ kind: 'message_upsert', message: updated, actorId: actor.id });
      syncFromStorage();
    }
    setEditingMsgId(null);
    setEditingText('');
  };

  const handleDeleteMessage = (msg: AcademicChatMessage) => {
    const deleted = Storage.deleteAcademicChatMessage(msg.id);
    if (deleted) {
      broadcastAcademicChatEvent({
        kind: 'message_delete',
        messageId: msg.id,
        roomId: msg.roomId,
        actorId: actor.id,
      });
      syncFromStorage();
    }
  };

  const canModerate = actor.role === 'admin' || actor.role === 'academic_deputy';

  const activeTypers = useMemo(() => {
    if (!activeRoom) return [];
    const map = typingByRoom[activeRoom.id] || {};
    const now = Date.now();
    return Object.values(map)
      .filter((t) => t.expiresAt > now)
      .map((t) => t.name);
  }, [activeRoom?.id, typingByRoom]);

  const activeRoomInfo = activeRoom ? getRoomDisplayInfo(activeRoom) : null;

  const filteredDmCandidates = useMemo(() => {
    const q = normalizePersianSearch(dmSearch);
    return otherParticipants.filter((p) => {
      if (dmRoleFilter !== 'all' && p.role !== dmRoleFilter) return false;
      if (!q) return true;
      const hay = normalizePersianSearch(
        `${p.name} ${p.roleLabel} ${(p.assignedFields || []).join(' ')}`
      );
      return hay.includes(q);
    });
  }, [otherParticipants, dmSearch, dmRoleFilter]);

  const filteredGroupCandidates = useMemo(() => {
    const q = normalizePersianSearch(groupMemberSearch);
    return otherParticipants.filter((p) => {
      if (!q) return true;
      const hay = normalizePersianSearch(
        `${p.name} ${p.roleLabel} ${(p.assignedFields || []).join(' ')}`
      );
      return hay.includes(q);
    });
  }, [otherParticipants, groupMemberSearch]);

  if (mode === 'modal' && !isOpen) return null;

  const content = (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col ${
        mode === 'modal'
          ? 'w-full max-w-6xl h-[88vh] rounded-3xl'
          : 'rounded-3xl h-[76vh] min-h-[560px]'
      }`}
    >
      {/* نوار بالای محیط گفتگو */}
      <div className="shrink-0 px-4 sm:px-5 py-3.5 bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300 shrink-0">
            <MessagesSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black">
                گفتگوی آنلاین و تالارهای مشترک حوزه معاونت آموزش
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {onlineColleaguesCount.toLocaleString('fa-IR')} همکار آنلاین
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              ارتباط زنده دو به دو و چندنفره بین معاون آموزشی، مدیران گروه، کارشناسان آموزش، واحد فارغ‌التحصیلان و تالارهای مشترک برنامه درسی
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setDmSearch('');
              setDmRoleFilter('all');
              setActiveCreatorModal('dm');
            }}
            className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition shadow-xs"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>گفتگوی دو به دو</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setGroupTitle('');
              setGroupDesc('');
              setGroupSelectedIds([]);
              setGroupMemberSearch('');
              setActiveCreatorModal('group');
            }}
            className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer transition shadow-xs"
          >
            <Users className="w-3.5 h-3.5" />
            <span>گروه چندنفره جدید</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setForumTitle('');
              setForumDesc('');
              setForumTopic('curriculum');
              setForumPinned(true);
              setActiveCreatorModal('forum');
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تالار مشترک جدید</span>
          </button>
          {mode === 'modal' && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 cursor-pointer transition"
              title="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div
          className={`shrink-0 px-4 py-2 text-xs font-bold flex items-center justify-between border-b ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
          }`}
        >
          <span>{toast.text}</span>
          <button type="button" onClick={() => setToast(null)} className="cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* بدنه دو ستونی: لیست تالارها/گفتگوها + پنجره چت زنده */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* ستون لیست تالارها و گفتگوها */}
        <aside
          className={`${
            mobileShowChatPane ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 lg:w-96 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex-col min-h-0`}
        >
          {/* نوار جستجو و فیلتر */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5 bg-white dark:bg-slate-900">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="جستجوی تالار، گروه یا نام همکار..."
                className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setListFilter('all')}
                className={`py-1.5 rounded-lg cursor-pointer transition ${
                  listFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                همه ({accessibleRooms.length})
              </button>
              <button
                type="button"
                onClick={() => setListFilter('forum')}
                className={`py-1.5 rounded-lg cursor-pointer transition ${
                  listFilter === 'forum'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                تالارها ({accessibleRooms.filter((r) => r.type === 'forum').length})
              </button>
              <button
                type="button"
                onClick={() => setListFilter('chat')}
                className={`py-1.5 rounded-lg cursor-pointer transition ${
                  listFilter === 'chat'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                دو به دو / گروه ({accessibleRooms.filter((r) => r.type !== 'forum').length})
              </button>
            </div>
          </div>

          {/* نوار همکاران آنلاین برای شروع فوری چت دو به دو */}
          {otherParticipants.filter((p) => onlineIds.has(p.id)).length > 0 && (
            <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 mb-1.5">
                همکاران آنلاین در همین لحظه (کلیک برای گفتگو):
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {otherParticipants
                  .filter((p) => onlineIds.has(p.id))
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleOpenOrStartDm(p)}
                      className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-[11px] font-bold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 shrink-0 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/40"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{p.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* لیست اتاق‌ها */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
            {/* بخش ۱: تالارهای مشترک معاونت آموزش */}
            {filteredRooms.forums.length > 0 && (
              <div className="space-y-1.5">
                <div className="px-2 flex items-center justify-between text-[11px] font-black text-indigo-700 dark:text-indigo-300">
                  <span className="inline-flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5" />
                    <span>تالارهای مشترک معاونت آموزش</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setForumTitle('');
                      setForumDesc('');
                      setForumTopic('curriculum');
                      setForumPinned(true);
                      setActiveCreatorModal('forum');
                    }}
                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 hover:bg-indigo-200 cursor-pointer"
                  >
                    + جدید
                  </button>
                </div>

                {filteredRooms.forums.map((room) => {
                  const isActive = activeRoom?.id === room.id;
                  const unread = getAcademicRoomUnreadCount(actor.id, room, messages, readMap);
                  const rMsgs = messagesByRoomId.get(room.id) || [];
                  const lastMsg = rMsgs[rMsgs.length - 1];
                  const topicMeta =
                    FORUM_TOPIC_META[room.topic || 'general'] || FORUM_TOPIC_META.general;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => {
                        setSelectedRoomId(room.id);
                        setMobileShowChatPane(true);
                      }}
                      className={`w-full text-right p-3 rounded-2xl border transition cursor-pointer space-y-1.5 ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {room.isPinned && (
                            <Pin
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isActive ? 'text-amber-300' : 'text-amber-500'
                              }`}
                            />
                          )}
                          <span className="font-extrabold text-xs truncate">{room.title}</span>
                        </div>
                        {unread > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shrink-0">
                            {unread.toLocaleString('fa-IR')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                            isActive
                              ? 'bg-white/15 border-white/20 text-white'
                              : topicMeta.badgeClass
                          }`}
                        >
                          {topicMeta.shortLabel}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            isActive ? 'text-indigo-100' : 'text-slate-400'
                          }`}
                        >
                          {rMsgs.length.toLocaleString('fa-IR')} پیام
                        </span>
                      </div>
                      {lastMsg && (
                        <p
                          className={`text-[11px] truncate ${
                            isActive ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <span className="font-bold">{lastMsg.senderName}:</span> {lastMsg.text}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* بخش ۲: گفتگوهای دو به دو و گروه‌های چند نفره */}
            <div className="space-y-1.5">
              <div className="px-2 flex items-center justify-between text-[11px] font-black text-teal-700 dark:text-teal-300">
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>گفتگوهای دو به دو و گروهی</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveCreatorModal('dm')}
                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 hover:bg-sky-200 cursor-pointer"
                  >
                    + دو نفره
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGroupTitle('');
                      setGroupDesc('');
                      setGroupSelectedIds([]);
                      setActiveCreatorModal('group');
                    }}
                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 hover:bg-teal-200 cursor-pointer"
                  >
                    + گروه
                  </button>
                </div>
              </div>

              {filteredRooms.chats.length === 0 ? (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    هنوز گفتگوی دو به دو یا گروهی ایجاد نشده است.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveCreatorModal('dm')}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-[11px] font-bold cursor-pointer hover:bg-teal-700"
                  >
                    شروع اولین گفتگو با همکاران
                  </button>
                </div>
              ) : (
                filteredRooms.chats.map((room) => {
                  const isActive = activeRoom?.id === room.id;
                  const info = getRoomDisplayInfo(room);
                  const unread = getAcademicRoomUnreadCount(actor.id, room, messages, readMap);
                  const rMsgs = messagesByRoomId.get(room.id) || [];
                  const lastMsg = rMsgs[rMsgs.length - 1];
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => {
                        setSelectedRoomId(room.id);
                        setMobileShowChatPane(true);
                      }}
                      className={`w-full text-right p-3 rounded-2xl border transition cursor-pointer space-y-1 ${
                        isActive
                          ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative shrink-0">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : room.type === 'group'
                                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200'
                                  : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200'
                              }`}
                            >
                              {room.type === 'group' ? (
                                <Users className="w-4 h-4" />
                              ) : (
                                info.title.slice(0, 1)
                              )}
                            </div>
                            {info.isOnline && (
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 absolute -bottom-0.5 -left-0.5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-xs truncate">{info.title}</div>
                            <div
                              className={`text-[10px] truncate ${
                                isActive ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {info.subtitle}
                            </div>
                          </div>
                        </div>
                        {unread > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shrink-0">
                            {unread.toLocaleString('fa-IR')}
                          </span>
                        )}
                      </div>
                      {lastMsg && (
                        <p
                          className={`text-[11px] truncate pt-0.5 ${
                            isActive ? 'text-teal-50' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <span className="font-bold">{lastMsg.senderName}:</span> {lastMsg.text}
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* ستون اصلی گفتگو */}
        <section
          className={`${
            mobileShowChatPane ? 'flex' : 'hidden md:flex'
          } flex-1 flex-col min-w-0 min-h-0 bg-slate-50/40 dark:bg-slate-950/30`}
        >
          {activeRoom && activeRoomInfo ? (
            <>
              {/* هدر اتاق فعال */}
              <div className="shrink-0 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileShowChatPane(false)}
                    className="md:hidden px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold cursor-pointer"
                  >
                    فهرست
                  </button>
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm ${
                      activeRoom.type === 'forum'
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200'
                        : activeRoom.type === 'group'
                        ? 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-200'
                        : 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200'
                    }`}
                  >
                    {activeRoom.type === 'forum' ? (
                      <Hash className="w-5 h-5" />
                    ) : activeRoom.type === 'group' ? (
                      <Users className="w-5 h-5" />
                    ) : (
                      activeRoomInfo.title.slice(0, 1)
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">
                        {activeRoomInfo.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                          activeRoom.type === 'forum'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
                            : activeRoom.type === 'group'
                            ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300'
                            : 'bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300'
                        }`}
                      >
                        {activeRoom.type === 'forum'
                          ? 'تالار مشترک کل معاونت آموزش'
                          : activeRoom.type === 'group'
                          ? 'گروه چندنفره'
                          : 'گفتگوی دو به دو'}
                      </span>
                      {activeRoom.type === 'dm' && activeRoomInfo.isOnline && (
                        <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          آنلاین
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {activeRoomInfo.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeRoom.type === 'forum' && (canModerate || activeRoom.creatorId === actor.id) && (
                    <button
                      type="button"
                      onClick={() => handleTogglePinForum(activeRoom)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-slate-700 dark:text-slate-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      title={activeRoom.isPinned ? 'برداشتن سنجاق تالار' : 'سنجاق کردن در بالا'}
                    >
                      {activeRoom.isPinned ? (
                        <PinOff className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <Pin className="w-3.5 h-3.5" />
                      )}
                      <span>{activeRoom.isPinned ? 'سنجاق‌شده' : 'سنجاق'}</span>
                    </button>
                  )}

                  {activeRoom.type === 'group' && (
                    <button
                      type="button"
                      onClick={() => {
                        setGroupSelectedIds(activeRoom.memberIds);
                        setGroupMemberSearch('');
                        setActiveCreatorModal('manage_members');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>اعضای گروه</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowParticipantsDrawer((v) => !v)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>اعضا</span>
                  </button>
                </div>
              </div>

              {/* نوار لیست اعضای اتاق در صورت باز شدن */}
              {showParticipantsDrawer && (
                <div className="shrink-0 px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 ml-1">
                    {activeRoom.type === 'forum'
                      ? 'اعضای دارای دسترسی به این تالار (کل معاونت آموزش):'
                      : 'اعضای حاضر در این گفتگو:'}
                  </span>
                  {(activeRoom.type === 'forum'
                    ? participants
                    : activeRoom.memberIds
                        .map((id) => participantById.get(id))
                        .filter((x): x is AcademicChatParticipant => Boolean(x))
                  ).map((p) => (
                    <span
                      key={p.id}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-bold inline-flex items-center gap-1.5"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          onlineIds.has(p.id) ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                      <span>{p.name}</span>
                      <span className="text-[10px] text-slate-400">({p.roleLabel})</span>
                    </span>
                  ))}
                </div>
              )}

              {/* فید پیام‌ها */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeRoomMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div className="font-black text-sm text-slate-800 dark:text-white">
                      {activeRoom.type === 'forum'
                        ? 'هنوز موضوعی در این تالار مشترک مطرح نشده است'
                        : 'اولین پیام این گفتگو را ارسال کنید'}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                      {activeRoom.type === 'forum'
                        ? 'مدیران گروه، کارشناسان آموزش، معاون آموزشی و کارشناسان فارغ‌التحصیلان می‌توانند دیدگاه‌ها، مسائل برنامه درسی و پیشنهادات خود را به‌صورت زنده در این تالار ثبت کنند.'
                        : 'پیام‌ها به‌صورت لحظه‌ای برای اعضای این گفتگو ارسال و در سامانه ذخیره می‌شوند.'}
                    </p>
                  </div>
                ) : (
                  activeRoomMessages.map((msg) => {
                    const isMine = msg.senderId === actor.id;
                    const isEditing = editingMsgId === msg.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`max-w-[88%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-xs border space-y-1.5 ${
                            isMine
                              ? 'bg-indigo-600 text-white border-indigo-600 rounded-tr-sm'
                              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 rounded-tl-sm'
                          }`}
                        >
                          {/* نام فرستنده و نقش */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span
                              className={`font-black ${
                                isMine ? 'text-white' : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {msg.senderName}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded-md font-bold ${
                                isMine
                                  ? 'bg-white/20 text-white'
                                  : getRolePillClass(msg.senderRole)
                              }`}
                            >
                              {msg.senderRoleLabel}
                            </span>
                            {msg.senderFields && msg.senderFields.length > 0 && (
                              <span
                                className={`px-1.5 py-0.5 rounded-md font-semibold ${
                                  isMine
                                    ? 'bg-white/10 text-indigo-100'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {msg.senderFields.slice(0, 2).join('، ')}
                              </span>
                            )}
                            {msg.issueTag && (
                              <span
                                className={`px-2 py-0.5 rounded-full font-extrabold inline-flex items-center gap-1 ${
                                  isMine
                                    ? 'bg-amber-400 text-slate-950'
                                    : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                                }`}
                              >
                                <Tag className="w-2.5 h-2.5" />
                                {msg.issueTag}
                              </span>
                            )}
                          </div>

                          {/* نقل‌قول پاسخ */}
                          {msg.replyToSenderName && msg.replyToText && (
                            <div
                              className={`p-2 rounded-xl text-[11px] border-r-2 ${
                                isMine
                                  ? 'bg-white/15 border-amber-300 text-indigo-50'
                                  : 'bg-slate-100 dark:bg-slate-800 border-indigo-500 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              <div className="font-extrabold text-[10px]">
                                در پاسخ به {msg.replyToSenderName}:
                              </div>
                              <div className="truncate">{msg.replyToText}</div>
                            </div>
                          )}

                          {/* متن پیام یا باکس ویرایش */}
                          {isEditing ? (
                            <div className="space-y-2 pt-1">
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                rows={2}
                                className="w-full px-2.5 py-1.5 rounded-xl bg-white text-slate-900 text-xs border border-indigo-300 focus:outline-none"
                              />
                              <div className="flex items-center gap-1.5 justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditMessage(msg.id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  ذخیره
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMsgId(null);
                                    setEditingText('');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                                >
                                  لغو
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                              {msg.text}
                            </div>
                          )}

                          {/* ساعت و دکمه‌های عملیات پیام */}
                          <div className="flex items-center justify-between gap-3 pt-0.5 text-[10px]">
                            <span
                              className={`inline-flex items-center gap-1 ${
                                isMine ? 'text-indigo-100' : 'text-slate-400'
                              }`}
                            >
                              {isMine && <CheckCheck className="w-3 h-3" />}
                              <span>{msg.createdAt}</span>
                              {msg.isEdited && <span>(ویرایش‌شده)</span>}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setReplyTarget(msg)}
                                className={`p-1 rounded-md cursor-pointer transition ${
                                  isMine
                                    ? 'hover:bg-white/20 text-indigo-100'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
                                }`}
                                title="پاسخ به این پیام"
                              >
                                <CornerUpLeft className="w-3 h-3" />
                              </button>
                              {isMine && !isEditing && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMsgId(msg.id);
                                    setEditingText(msg.text);
                                  }}
                                  className="p-1 rounded-md hover:bg-white/20 text-indigo-100 cursor-pointer"
                                  title="ویرایش پیام"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              )}
                              {(isMine || canModerate) && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(msg)}
                                  className={`p-1 rounded-md cursor-pointer ${
                                    isMine
                                      ? 'hover:bg-rose-500/40 text-indigo-100'
                                      : 'hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-500'
                                  }`}
                                  title="حذف پیام"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* نشانگر تایپ هم‌زمان */}
              {activeTypers.length > 0 && (
                <div className="shrink-0 px-4 py-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/20 border-t border-teal-100 dark:border-teal-900">
                  {activeTypers.join('، ')} در حال نوشتن پیام...
                </div>
              )}

              {/* نوار ارسال پیام */}
              <form
                onSubmit={handleSendMessage}
                className="shrink-0 p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2"
              >
                {replyTarget && (
                  <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 truncate">
                      <span className="font-black text-indigo-700 dark:text-indigo-300">
                        پاسخ به {replyTarget.senderName}:{' '}
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">{replyTarget.text}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyTarget(null)}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {activeRoom.type === 'forum' && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-extrabold text-slate-500 inline-flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      برچسب موضوع (اختیاری):
                    </span>
                    {FORUM_ISSUE_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedIssueTag((cur) => (cur === tag ? '' : tag))}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer transition ${
                          selectedIssueTag === tag
                            ? 'bg-amber-400 border-amber-500 text-slate-950'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <textarea
                    value={draftText}
                    onChange={(e) => handleDraftChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={2}
                    placeholder={
                      activeRoom.type === 'forum'
                        ? 'نظر، پیشنهاد یا مشکل مربوط به برنامه درسی و امور آموزشی را بنویسید... (Enter برای ارسال)'
                        : 'پیام خود را بنویسید... (Enter برای ارسال و Shift+Enter خط جدید)'
                    }
                    className="flex-1 px-3.5 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={!draftText.trim()}
                    className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer transition shadow-sm shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span>ارسال</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              یک تالار یا گفتگو را از فهرست انتخاب کنید.
            </div>
          )}
        </section>

        {/* مدال‌های داخلی ایجاد گفتگوی دو به دو / گروه چندنفره / تالار مشترک */}
        {activeCreatorModal && (
          <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-lg w-full max-h-[82vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  {activeCreatorModal === 'dm' && (
                    <>
                      <MessageCircle className="w-4 h-4 text-sky-600" />
                      <span>شروع گفتگوی دو به دو با همکاران معاونت</span>
                    </>
                  )}
                  {activeCreatorModal === 'group' && (
                    <>
                      <Users className="w-4 h-4 text-teal-600" />
                      <span>ایجاد گروه گفتگوی چندنفره جدید</span>
                    </>
                  )}
                  {activeCreatorModal === 'forum' && (
                    <>
                      <MessageSquarePlus className="w-4 h-4 text-amber-600" />
                      <span>ایجاد تالار مشترک جدید برای کل معاونت آموزش</span>
                    </>
                  )}
                  {activeCreatorModal === 'manage_members' && (
                    <>
                      <UserPlus className="w-4 h-4 text-teal-600" />
                      <span>مدیریت اعضای گروه «{activeRoom?.title}»</span>
                    </>
                  )}
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveCreatorModal(null)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* انتخاب همکار برای گفتگوی دو به دو */}
              {activeCreatorModal === 'dm' && (
                <div className="p-4 flex-1 flex flex-col min-h-0 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                      <input
                        type="text"
                        value={dmSearch}
                        onChange={(e) => setDmSearch(e.target.value)}
                        placeholder="جستجوی نام یا رشته همکار..."
                        className="w-full pr-8 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <select
                      value={dmRoleFilter}
                      onChange={(e) => setDmRoleFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="all">همه نقش‌ها</option>
                      <option value="academic_deputy">معاون آموزشی</option>
                      <option value="department_head">مدیران گروه</option>
                      <option value="education_expert">کارشناسان آموزش</option>
                      <option value="graduation">واحد فارغ‌التحصیلان</option>
                      <option value="admin">مدیر کل سامانه</option>
                    </select>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2">
                    {filteredDmCandidates.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-8">
                        همکاری با این مشخصات یافت نشد.
                      </p>
                    ) : (
                      filteredDmCandidates.map((p) => {
                        const isOnline = onlineIds.has(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleOpenOrStartDm(p)}
                            className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-400 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 flex items-center justify-between gap-3 text-right cursor-pointer transition"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                                  }`}
                                />
                                <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                                  {p.name}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getRolePillClass(
                                    p.role
                                  )}`}
                                >
                                  {p.roleLabel}
                                </span>
                              </div>
                              {p.assignedFields && p.assignedFields.length > 0 && (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                                  رشته‌ها: {p.assignedFields.join('، ')}
                                </div>
                              )}
                            </div>
                            <span className="px-3 py-1 rounded-xl bg-sky-600 text-white text-[11px] font-bold shrink-0">
                              گفتگو
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ایجاد گروه چند نفره یا مدیریت اعضای گروه */}
              {(activeCreatorModal === 'group' || activeCreatorModal === 'manage_members') && (
                <form
                  onSubmit={
                    activeCreatorModal === 'group'
                      ? handleCreateGroup
                      : handleSaveManagedGroupMembers
                  }
                  className="p-4 flex-1 flex flex-col min-h-0 space-y-3 text-xs"
                >
                  {activeCreatorModal === 'group' && (
                    <>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          عنوان گروه چندنفره *
                        </label>
                        <input
                          type="text"
                          value={groupTitle}
                          onChange={(e) => setGroupTitle(e.target.value)}
                          placeholder="مثلاً: کارگروه برنامه‌ریزی دروس پایه و عمومی ترم بهمن"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          توضیح کوتاه (اختیاری)
                        </label>
                        <input
                          type="text"
                          value={groupDesc}
                          onChange={(e) => setGroupDesc(e.target.value)}
                          placeholder="هدف تشکیل این گروه..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      انتخاب اعضای گروه ({groupSelectedIds.length.toLocaleString('fa-IR')} نفر انتخاب شده):
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setGroupSelectedIds(
                            Array.from(
                              new Set([
                                ...groupSelectedIds,
                                ...otherParticipants
                                  .filter((p) => p.role === 'department_head')
                                  .map((p) => p.id),
                              ])
                            )
                          )
                        }
                        className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold cursor-pointer"
                      >
                        + همه مدیران گروه
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setGroupSelectedIds(
                            Array.from(
                              new Set([
                                ...groupSelectedIds,
                                ...otherParticipants
                                  .filter((p) => p.role === 'education_expert')
                                  .map((p) => p.id),
                              ])
                            )
                          )
                        }
                        className="px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-bold cursor-pointer"
                      >
                        + همه کارشناسان آموزش
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={groupMemberSearch}
                    onChange={(e) => setGroupMemberSearch(e.target.value)}
                    placeholder="جستجوی نام یا رشته همکار..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />

                  <div className="flex-1 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-2xl p-2">
                    {filteredGroupCandidates.map((p) => {
                      const checked = groupSelectedIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center justify-between gap-2 p-2.5 rounded-xl cursor-pointer transition ${
                            checked
                              ? 'bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setGroupSelectedIds((prev) =>
                                  prev.includes(p.id)
                                    ? prev.filter((id) => id !== p.id)
                                    : [...prev, p.id]
                                )
                              }
                              className="w-4 h-4 rounded text-teal-600"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white truncate">
                                {p.name}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {p.roleLabel}
                                {p.assignedFields?.length ? ` • ${p.assignedFields.join('، ')}` : ''}
                              </div>
                            </div>
                          </div>
                          {onlineIds.has(p.id) && (
                            <span className="text-[10px] text-emerald-600 font-bold shrink-0">
                              آنلاین
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveCreatorModal(null)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black cursor-pointer"
                    >
                      {activeCreatorModal === 'group' ? 'ایجاد گروه چندنفره' : 'ذخیره اعضا'}
                    </button>
                  </div>
                </form>
              )}

              {/* ایجاد تالار مشترک جدید */}
              {activeCreatorModal === 'forum' && (
                <form onSubmit={handleCreateForum} className="p-4 space-y-3 text-xs">
                  <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      تالار مشترک به‌صورت خودکار برای تمام بخش‌های زیرمجموعه معاونت آموزشی (معاون آموزشی، تمامی مدیران گروه، کارشناسان آموزش، واحد فارغ‌التحصیلان و مدیر سامانه) در دسترس خواهد بود.
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      عنوان تالار مشترک *
                    </label>
                    <input
                      type="text"
                      value={forumTitle}
                      onChange={(e) => setForumTitle(e.target.value)}
                      placeholder="مثلاً: تالار حل تداخل برنامه درسی و تخصیص کلاس‌های ترم جدید"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      حوزه موضوعی تالار
                    </label>
                    <select
                      value={forumTopic}
                      onChange={(e) => setForumTopic(e.target.value as AcademicChatForumTopic)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                    >
                      {(Object.keys(FORUM_TOPIC_META) as AcademicChatForumTopic[]).map((k) => (
                        <option key={k} value={k}>
                          {FORUM_TOPIC_META[k].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      شرح و دستور کار تالار (اختیاری)
                    </label>
                    <textarea
                      value={forumDesc}
                      onChange={(e) => setForumDesc(e.target.value)}
                      rows={3}
                      placeholder="توضیح دهید همکاران در چه موضوعاتی در این تالار گفتگو و همفکری کنند..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <label className="inline-flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forumPinned}
                      onChange={(e) => setForumPinned(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <span>سنجاق در بالای فهرست تالارهای معاونت</span>
                  </label>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveCreatorModal(null)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black cursor-pointer"
                    >
                      ایجاد و انتشار تالار مشترک
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-150">
        {content}
      </div>
    );
  }

  return content;
};
