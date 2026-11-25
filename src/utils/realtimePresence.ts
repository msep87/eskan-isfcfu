import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CurrentUser } from '../types';
import { supabase } from './storage';

export interface RealtimeUserIdentity {
  id: string;
  role: string;
  name: string;
  userKey: string;
  safeId: string;
  safeUserKey: string;
}

export interface ActiveUserSession {
  sessionId: string;
  userId: string;
  userKey: string;
  role: string;
  name: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  osLabel: string;
  browserLabel: string;
  deviceLabel: string;
  loggedInAt: string;
  isCurrent: boolean;
}

export interface IncomingVoiceCallPayload {
  roomId: string;
  roomTitle: string;
  roomType: 'public' | 'forum' | 'dm';
  callerId: string;
  callerName: string;
  callerRole: string;
  sentAt: string;
}

export interface IncomingPrivateChatPayload {
  messageId: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  previewText: string;
  isVoiceMessage?: boolean;
  hasImage?: boolean;
  sentAt: string;
}

export interface CallRejectedPayload {
  roomId: string;
  rejectorId: string;
  rejectorName: string;
  sentAt: string;
}

export interface CallCancelledPayload {
  roomId: string;
  callerId: string;
  sentAt: string;
}

export interface TerminateSessionPayload {
  userKey: string;
  targetSessionId?: string;
  keepSessionId?: string;
  reason?: string;
  initiatorDevice?: string;
  sentAt: string;
}

const TAB_SESSION_STORAGE_KEY = 'cfuis_tab_session_id_v1';
const TAB_LOGIN_TIME_STORAGE_KEY = 'cfuis_tab_login_time_v1';
const AUTO_CLOSE_SESSIONS_PREFIX = 'cfuis_auto_close_sessions_v1_';
const LOCAL_SESSIONS_REGISTRY_KEY = 'cfuis_local_active_sessions_v1';
const SESSION_BROADCAST_CHANNEL_NAME = 'cfuis_session_control_v1';

// فروشگاه سبک مشترک برای در دسترس بودن وضعیت آنلاین کاربران در تمامی کامپوننت‌های داخلی (بدون ایجاد کانال تکراری)
let sharedOnlineUserIds: Set<string> = new Set();
const onlineIdsListeners = new Set<(ids: Set<string>) => void>();

function publishSharedOnlineUserIds(next: Set<string>): void {
  sharedOnlineUserIds = next;
  onlineIdsListeners.forEach((listener) => {
    try {
      listener(next);
    } catch {
      // ignore
    }
  });
}

export interface QuickStaffCommTarget {
  staffId: string;
  staffName: string;
  staffRole: string;
  mode: 'chat' | 'voice_call';
  contextNote?: string;
}

const quickStaffCommListeners = new Set<(target: QuickStaffCommTarget) => void>();

export function triggerQuickStaffComm(target: QuickStaffCommTarget): void {
  quickStaffCommListeners.forEach((listener) => {
    try {
      listener(target);
    } catch {
      // ignore
    }
  });
}

export function subscribeQuickStaffComm(
  listener: (target: QuickStaffCommTarget) => void
): () => void {
  quickStaffCommListeners.add(listener);
  return () => {
    quickStaffCommListeners.delete(listener);
  };
}

export function useGlobalOnlineUserIds(override?: Set<string>): Set<string> {
  const [ids, setIds] = useState<Set<string>>(() => override || sharedOnlineUserIds);

  useEffect(() => {
    if (override) {
      setIds(override);
      return;
    }
    setIds(sharedOnlineUserIds);
    const listener = (next: Set<string>) => setIds(next);
    onlineIdsListeners.add(listener);
    return () => {
      onlineIdsListeners.delete(listener);
    };
  }, [override]);

  return override || ids;
}

export function sanitizeRealtimeKey(raw: string): string {
  return String(raw || '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 64);
}

export function getRealtimeUserIdentity(user: CurrentUser): RealtimeUserIdentity | null {
  if (!user) return null;
  let id = '';
  let name = '';
  const role = user.role;

  if (user.role === 'student') {
    id = user.student.studentId;
    name = user.student.fullName;
  } else if (user.role === 'admin') {
    id = user.username || 'admin';
    name = user.name || 'مدیر کل سامانه';
  } else if (user.role === 'supervisor') {
    id = user.supervisor.id;
    name = user.supervisor.fullName;
  } else if (user.role === 'counselor') {
    id = user.counselor.id;
    name = user.counselor.fullName;
  } else if (user.role === 'maintenance') {
    id = user.technician.id;
    name = user.technician.fullName;
  } else if (user.role === 'professor') {
    id = user.professor.id;
    name = user.professor.fullName;
  } else {
    id = user.staff.id;
    name = user.staff.fullName;
  }

  const userKey = `${role}::${id}`;
  return {
    id,
    role,
    name,
    userKey,
    safeId: sanitizeRealtimeKey(id),
    safeUserKey: sanitizeRealtimeKey(`${role}_${id}`),
  };
}

export function getOrCreateTabSessionId(): string {
  try {
    const existing = sessionStorage.getItem(TAB_SESSION_STORAGE_KEY);
    if (existing && existing.length > 6) return existing;
    const generated = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(TAB_SESSION_STORAGE_KEY, generated);
    return generated;
  } catch {
    return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function getOrSetTabLoginTime(): string {
  try {
    const existing = sessionStorage.getItem(TAB_LOGIN_TIME_STORAGE_KEY);
    if (existing) return existing;
    const now = new Date().toISOString();
    sessionStorage.setItem(TAB_LOGIN_TIME_STORAGE_KEY, now);
    return now;
  } catch {
    return new Date().toISOString();
  }
}

export function resetTabLoginTime(): string {
  const now = new Date().toISOString();
  try {
    sessionStorage.setItem(TAB_LOGIN_TIME_STORAGE_KEY, now);
  } catch {
    // ignore
  }
  return now;
}

export function detectDeviceInfo(): {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  osLabel: string;
  browserLabel: string;
  deviceLabel: string;
} {
  if (typeof navigator === 'undefined') {
    return {
      deviceType: 'desktop',
      osLabel: 'رایانه',
      browserLabel: 'مرورگر وب',
      deviceLabel: 'رایانه · مرورگر وب',
    };
  }
  const ua = navigator.userAgent || '';

  let osLabel = 'سیستم نامشخص';
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  if (/iPad|Tablet/i.test(ua)) {
    osLabel = /iPad/i.test(ua) ? 'آیپد (iPadOS)' : 'تبلت اندروید';
    deviceType = 'tablet';
  } else if (/iPhone|iPod/i.test(ua)) {
    osLabel = 'آیفون (iOS)';
    deviceType = 'mobile';
  } else if (/Android/i.test(ua)) {
    osLabel = 'گوشی اندروید';
    deviceType = /Mobile/i.test(ua) ? 'mobile' : 'tablet';
  } else if (/Windows/i.test(ua)) {
    osLabel = 'ویندوز';
    deviceType = 'desktop';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    osLabel = 'مک (macOS)';
    deviceType = 'desktop';
  } else if (/Linux/i.test(ua)) {
    osLabel = 'لینوکس';
    deviceType = 'desktop';
  }

  let browserLabel = 'مرورگر وب';
  if (/Edg\//i.test(ua)) browserLabel = 'اج (Edge)';
  else if (/OPR\/|Opera/i.test(ua)) browserLabel = 'اپرا (Opera)';
  else if (/Firefox\//i.test(ua)) browserLabel = 'فایرفاکس';
  else if (/SamsungBrowser/i.test(ua)) browserLabel = 'مرورگر سامسونگ';
  else if (/Chrome\/|CriOS/i.test(ua)) browserLabel = 'کروم (Chrome)';
  else if (/Safari\//i.test(ua)) browserLabel = 'سافاری (Safari)';

  return {
    deviceType,
    osLabel,
    browserLabel,
    deviceLabel: `${osLabel} · ${browserLabel}`,
  };
}

export function loadAutoCloseOtherSessionsPref(userKey?: string): boolean {
  try {
    if (userKey) {
      const specific = localStorage.getItem(`${AUTO_CLOSE_SESSIONS_PREFIX}${sanitizeRealtimeKey(userKey)}`);
      if (specific !== null) return specific === '1';
    }
    return localStorage.getItem(`${AUTO_CLOSE_SESSIONS_PREFIX}global`) === '1';
  } catch {
    return false;
  }
}

export function saveAutoCloseOtherSessionsPref(enabled: boolean, userKey?: string): void {
  try {
    const val = enabled ? '1' : '0';
    localStorage.setItem(`${AUTO_CLOSE_SESSIONS_PREFIX}global`, val);
    if (userKey) {
      localStorage.setItem(`${AUTO_CLOSE_SESSIONS_PREFIX}${sanitizeRealtimeKey(userKey)}`, val);
    }
  } catch {
    // ignore
  }
}

function sendEphemeralRealtimeEvent(channelName: string, event: string, payload: Record<string, unknown>): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const ch = supabase.channel(channelName);
    const finish = () => {
      if (settled) return;
      settled = true;
      setTimeout(() => {
        try {
          supabase.removeChannel(ch);
        } catch {
          // ignore
        }
      }, 1500);
      resolve();
    };

    const timeout = setTimeout(finish, 3500);

    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timeout);
        ch.send({
          type: 'broadcast',
          event,
          payload,
        })
          .catch(() => {})
          .finally(finish);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(timeout);
        finish();
      }
    });
  });
}

export async function broadcastPrivateChatNotification(
  targetUserId: string,
  payload: IncomingPrivateChatPayload
): Promise<void> {
  if (!targetUserId) return;
  const safeTarget = sanitizeRealtimeKey(targetUserId);
  await sendEphemeralRealtimeEvent(
    `cfuis_user_events_${safeTarget}`,
    'incoming_private_chat',
    payload as unknown as Record<string, unknown>
  );
}

export async function broadcastCallRejected(
  callerUserId: string,
  roomId: string,
  rejectorId: string,
  rejectorName: string
): Promise<void> {
  if (!callerUserId) return;
  const safeCaller = sanitizeRealtimeKey(callerUserId);
  const payload: CallRejectedPayload = {
    roomId,
    rejectorId,
    rejectorName,
    sentAt: new Date().toISOString(),
  };
  await Promise.all([
    sendEphemeralRealtimeEvent(
      `cfuis_user_events_${safeCaller}`,
      'call_rejected',
      payload as unknown as Record<string, unknown>
    ),
    sendEphemeralRealtimeEvent(
      `cfuis_voice_${sanitizeRealtimeKey(roomId)}`,
      'call_rejected',
      payload as unknown as Record<string, unknown>
    ),
  ]);
}

export async function broadcastCallCancelled(
  targetUserId: string,
  roomId: string,
  callerId: string
): Promise<void> {
  if (!targetUserId) return;
  const safeTarget = sanitizeRealtimeKey(targetUserId);
  const payload: CallCancelledPayload = {
    roomId,
    callerId,
    sentAt: new Date().toISOString(),
  };
  await sendEphemeralRealtimeEvent(
    `cfuis_user_events_${safeTarget}`,
    'call_cancelled',
    payload as unknown as Record<string, unknown>
  );
}

export async function broadcastTerminateSessions(
  userKey: string,
  opts: {
    targetSessionId?: string;
    keepSessionId?: string;
    reason?: string;
    initiatorDevice?: string;
  }
): Promise<void> {
  if (!userKey) return;
  const payload: TerminateSessionPayload = {
    userKey,
    targetSessionId: opts.targetSessionId,
    keepSessionId: opts.keepSessionId,
    reason: opts.reason,
    initiatorDevice: opts.initiatorDevice || detectDeviceInfo().deviceLabel,
    sentAt: new Date().toISOString(),
  };

  // ارسال فوری بین تب‌های همین مرورگر از طریق BroadcastChannel
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(SESSION_BROADCAST_CHANNEL_NAME);
      bc.postMessage({ type: 'terminate_session', payload });
      setTimeout(() => bc.close(), 150);
    }
  } catch {
    // ignore
  }

  // ارسال بین دستگاه‌های مختلف از طریق Supabase Realtime
  const safeUserKey = sanitizeRealtimeKey(userKey.replace('::', '_'));
  await sendEphemeralRealtimeEvent(
    `cfuis_user_sessions_${safeUserKey}`,
    'terminate_session',
    payload as unknown as Record<string, unknown>
  );
}

// مدیریت لیست نشست‌های همین مرورگر (برای همگام‌سازی فوری بین تب‌های یک سیستم علاوه بر حضور آنلاین ابری)
interface LocalStoredSession extends Omit<ActiveUserSession, 'isCurrent'> {
  lastSeenAt: number;
}

function readLocalSessionsRegistry(): LocalStoredSession[] {
  try {
    const raw = localStorage.getItem(LOCAL_SESSIONS_REGISTRY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    // نشست‌هایی که بیش از ۴۵ ثانیه نبض نفرستاده‌اند منقضی محسوب می‌شوند
    return parsed.filter(
      (s): s is LocalStoredSession =>
        Boolean(s && typeof s.sessionId === 'string' && typeof s.lastSeenAt === 'number' && now - s.lastSeenAt < 45_000)
    );
  } catch {
    return [];
  }
}

function writeLocalSessionsRegistry(items: LocalStoredSession[]): void {
  try {
    localStorage.setItem(LOCAL_SESSIONS_REGISTRY_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function upsertLocalSession(entry: LocalStoredSession): LocalStoredSession[] {
  const list = readLocalSessionsRegistry().filter((item) => item.sessionId !== entry.sessionId);
  list.push(entry);
  writeLocalSessionsRegistry(list);
  return list;
}

function removeLocalSession(sessionId: string): void {
  const list = readLocalSessionsRegistry().filter((item) => item.sessionId !== sessionId);
  writeLocalSessionsRegistry(list);
}

export interface UseRealtimePortalPresenceOptions {
  currentUser: CurrentUser;
  onIncomingPrivateChat?: (payload: IncomingPrivateChatPayload) => void;
  onIncomingVoiceCall?: (payload: IncomingVoiceCallPayload) => void;
  onCallCancelled?: (payload: CallCancelledPayload) => void;
  onCallRejected?: (payload: CallRejectedPayload) => void;
  onSessionTerminated?: (payload: TerminateSessionPayload) => void;
}

export function useRealtimePortalPresence({
  currentUser,
  onIncomingPrivateChat,
  onIncomingVoiceCall,
  onCallCancelled,
  onCallRejected,
  onSessionTerminated,
}: UseRealtimePortalPresenceOptions) {
  const sessionId = useMemo(() => getOrCreateTabSessionId(), []);
  const deviceInfo = useMemo(() => detectDeviceInfo(), []);
  const identity = useMemo(() => getRealtimeUserIdentity(currentUser), [currentUser]);

  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(() => new Set());
  const [remoteUserSessions, setRemoteUserSessions] = useState<ActiveUserSession[]>([]);
  const [localTabSessions, setLocalTabSessions] = useState<ActiveUserSession[]>([]);

  // ارجاع‌های پایدار برای جلوگیری از اتصال مجدد کانال هنگام تغییر کال‌بک‌ها
  const cbRef = useRef({
    onIncomingPrivateChat,
    onIncomingVoiceCall,
    onCallCancelled,
    onCallRejected,
    onSessionTerminated,
  });
  useEffect(() => {
    cbRef.current = {
      onIncomingPrivateChat,
      onIncomingVoiceCall,
      onCallCancelled,
      onCallRejected,
      onSessionTerminated,
    };
  }, [
    onIncomingPrivateChat,
    onIncomingVoiceCall,
    onCallCancelled,
    onCallRejected,
    onSessionTerminated,
  ]);

  // ۱) حضور زنده سراسری (Supabase Realtime Presence) برای وضعیت آنلاین کاربران و نشست‌های چنددستگاهی
  useEffect(() => {
    if (!identity) {
      const empty = new Set<string>();
      setOnlineUserIds(empty);
      publishSharedOnlineUserIds(empty);
      setRemoteUserSessions([]);
      setLocalTabSessions([]);
      removeLocalSession(sessionId);
      return;
    }

    const loggedInAt = getOrSetTabLoginTime();
    const myMeta = {
      sessionId,
      userId: identity.id,
      userKey: identity.userKey,
      role: identity.role,
      name: identity.name,
      deviceType: deviceInfo.deviceType,
      osLabel: deviceInfo.osLabel,
      browserLabel: deviceInfo.browserLabel,
      deviceLabel: deviceInfo.deviceLabel,
      loggedInAt,
    };

    const syncLocalTabs = () => {
      const allLocal = upsertLocalSession({ ...myMeta, lastSeenAt: Date.now() });
      const mine = allLocal
        .filter((s) => s.userKey === identity.userKey)
        .map<ActiveUserSession>((s) => ({
          ...s,
          isCurrent: s.sessionId === sessionId,
        }));
      setLocalTabSessions(mine);
    };

    syncLocalTabs();
    const localHeartbeat = window.setInterval(syncLocalTabs, 15_000);

    const handleStorageEvent = (ev: StorageEvent) => {
      if (ev.key === LOCAL_SESSIONS_REGISTRY_KEY) {
        const mine = readLocalSessionsRegistry()
          .filter((s) => s.userKey === identity.userKey)
          .map<ActiveUserSession>((s) => ({
            ...s,
            isCurrent: s.sessionId === sessionId,
          }));
        setLocalTabSessions(mine);
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    const handleBeforeUnload = () => {
      removeLocalSession(sessionId);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const presenceChannel = supabase.channel('cfuis_global_presence_v1', {
      config: { presence: { key: sessionId } },
    });

    const syncPresenceState = () => {
      const state = presenceChannel.presenceState<typeof myMeta>();
      const nextOnlineIds = new Set<string>([identity.id]);
      const nextSessionsMap = new Map<string, ActiveUserSession>();

      Object.values(state).forEach((presences) => {
        if (!Array.isArray(presences)) return;
        presences.forEach((p) => {
          if (!p || !p.userId) return;
          nextOnlineIds.add(p.userId);
          if (p.userKey === identity.userKey && p.sessionId) {
            nextSessionsMap.set(p.sessionId, {
              sessionId: p.sessionId,
              userId: p.userId,
              userKey: p.userKey,
              role: p.role,
              name: p.name,
              deviceType: p.deviceType || 'desktop',
              osLabel: p.osLabel || 'رایانه',
              browserLabel: p.browserLabel || 'مرورگر وب',
              deviceLabel: p.deviceLabel || 'مرورگر وب',
              loggedInAt: p.loggedInAt || new Date().toISOString(),
              isCurrent: p.sessionId === sessionId,
            });
          }
        });
      });

      setOnlineUserIds(nextOnlineIds);
      publishSharedOnlineUserIds(nextOnlineIds);
      setRemoteUserSessions(Array.from(nextSessionsMap.values()));
    };

    presenceChannel
      .on('presence', { event: 'sync' }, syncPresenceState)
      .on('presence', { event: 'join' }, syncPresenceState)
      .on('presence', { event: 'leave' }, syncPresenceState)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await presenceChannel.track(myMeta);
          } catch {
            // ignore
          }
        }
      });

    return () => {
      window.clearInterval(localHeartbeat);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      removeLocalSession(sessionId);
      try {
        presenceChannel.untrack();
      } catch {
        // ignore
      }
      supabase.removeChannel(presenceChannel);
    };
  }, [identity, sessionId, deviceInfo]);

  // ۲) کانال‌های رویداد لحظه‌ای کاربر (چت خصوصی، تماس صوتی ورودی، لغو/رد تماس، بستن نشست از راه دور)
  useEffect(() => {
    if (!identity) return;

    const handleSessionTerminationEvent = (payload: TerminateSessionPayload) => {
      if (!payload || payload.userKey !== identity.userKey) return;
      const shouldTerminateMe =
        (payload.targetSessionId && payload.targetSessionId === sessionId) ||
        (payload.keepSessionId && payload.keepSessionId !== sessionId);
      if (shouldTerminateMe) {
        removeLocalSession(sessionId);
        cbRef.current.onSessionTerminated?.(payload);
      }
    };

    // کانال BroadcastChannel برای بستن فوری تب‌های همین مرورگر
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel(SESSION_BROADCAST_CHANNEL_NAME);
        bc.onmessage = (event) => {
          const data = event.data as { type?: string; payload?: TerminateSessionPayload } | null;
          if (data?.type === 'terminate_session' && data.payload) {
            handleSessionTerminationEvent(data.payload);
          }
        };
      }
    } catch {
      bc = null;
    }

    // کانال دریافت دعوت تماس صوتی (سازگار با LiveVoiceCallModal)
    const callInviteChannel = supabase
      .channel(`cfuis_call_invite_${identity.safeId}`)
      .on('broadcast', { event: 'incoming_voice_call' }, ({ payload }) => {
        const data = payload as IncomingVoiceCallPayload | undefined;
        if (!data || !data.roomId || data.callerId === identity.id) return;
        cbRef.current.onIncomingVoiceCall?.({
          ...data,
          sentAt: data.sentAt || new Date().toISOString(),
        });
      })
      .subscribe();

    // کانال دریافت چت خصوصی و وضعیت تماس
    const userEventsChannel = supabase
      .channel(`cfuis_user_events_${identity.safeId}`)
      .on('broadcast', { event: 'incoming_private_chat' }, ({ payload }) => {
        const data = payload as IncomingPrivateChatPayload | undefined;
        if (!data || !data.roomId || data.senderId === identity.id) return;
        cbRef.current.onIncomingPrivateChat?.(data);
      })
      .on('broadcast', { event: 'call_cancelled' }, ({ payload }) => {
        const data = payload as CallCancelledPayload | undefined;
        if (!data || !data.roomId) return;
        cbRef.current.onCallCancelled?.(data);
      })
      .on('broadcast', { event: 'call_rejected' }, ({ payload }) => {
        const data = payload as CallRejectedPayload | undefined;
        if (!data || !data.roomId) return;
        cbRef.current.onCallRejected?.(data);
      })
      .subscribe();

    // کانال کنترل نشست‌های چنددستگاهی کاربر
    const sessionControlChannel = supabase
      .channel(`cfuis_user_sessions_${identity.safeUserKey}`)
      .on('broadcast', { event: 'terminate_session' }, ({ payload }) => {
        const data = payload as TerminateSessionPayload | undefined;
        if (data) handleSessionTerminationEvent(data);
      })
      .subscribe();

    return () => {
      try {
        bc?.close();
      } catch {
        // ignore
      }
      supabase.removeChannel(callInviteChannel);
      supabase.removeChannel(userEventsChannel);
      supabase.removeChannel(sessionControlChannel);
    };
  }, [identity, sessionId]);

  // ادغام نشست‌های Presence ابری و تب‌های محلی بدون تکرار
  const activeSessions = useMemo<ActiveUserSession[]>(() => {
    if (!identity) return [];
    const map = new Map<string, ActiveUserSession>();
    localTabSessions.forEach((s) => map.set(s.sessionId, s));
    remoteUserSessions.forEach((s) => map.set(s.sessionId, s));

    // تضمین نمایش نشست فعلی حتی پیش از تکمیل sync اولیه
    if (!map.has(sessionId)) {
      map.set(sessionId, {
        sessionId,
        userId: identity.id,
        userKey: identity.userKey,
        role: identity.role,
        name: identity.name,
        deviceType: deviceInfo.deviceType,
        osLabel: deviceInfo.osLabel,
        browserLabel: deviceInfo.browserLabel,
        deviceLabel: deviceInfo.deviceLabel,
        loggedInAt: getOrSetTabLoginTime(),
        isCurrent: true,
      });
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      return new Date(b.loggedInAt).getTime() - new Date(a.loggedInAt).getTime();
    });
  }, [identity, localTabSessions, remoteUserSessions, sessionId, deviceInfo]);

  const isUserOnline = useCallback(
    (userId?: string | null): boolean => {
      if (!userId) return false;
      return onlineUserIds.has(userId);
    },
    [onlineUserIds]
  );

  const terminateSession = useCallback(
    async (targetSessionId: string) => {
      if (!identity || !targetSessionId || targetSessionId === sessionId) return;
      removeLocalSession(targetSessionId);
      setLocalTabSessions((prev) => prev.filter((s) => s.sessionId !== targetSessionId));
      setRemoteUserSessions((prev) => prev.filter((s) => s.sessionId !== targetSessionId));
      await broadcastTerminateSessions(identity.userKey, {
        targetSessionId,
        initiatorDevice: deviceInfo.deviceLabel,
        reason: 'این نشست توسط شما از دستگاه دیگری بسته شد.',
      });
    },
    [identity, sessionId, deviceInfo]
  );

  const terminateAllOtherSessions = useCallback(async () => {
    if (!identity) return;
    const onlyCurrentLocal = readLocalSessionsRegistry().filter(
      (s) => s.userKey !== identity.userKey || s.sessionId === sessionId
    );
    writeLocalSessionsRegistry(onlyCurrentLocal);
    setLocalTabSessions((prev) => prev.filter((s) => s.sessionId === sessionId));
    setRemoteUserSessions((prev) => prev.filter((s) => s.sessionId === sessionId));
    await broadcastTerminateSessions(identity.userKey, {
      keepSessionId: sessionId,
      initiatorDevice: deviceInfo.deviceLabel,
      reason: 'تمامی نشست‌های دیگر توسط شما از یک دستگاه دیگر بسته شدند.',
    });
  }, [identity, sessionId, deviceInfo]);

  return {
    identity,
    sessionId,
    deviceInfo,
    onlineUserIds,
    activeSessions,
    isUserOnline,
    terminateSession,
    terminateAllOtherSessions,
  };
}
