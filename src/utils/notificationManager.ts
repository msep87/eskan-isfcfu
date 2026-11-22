import {
  Announcement,
  CurrentUser,
  GuildElection,
  Message,
  PeriodicSurvey,
  RoomWarning,
} from '../types';
import {
  Storage,
  doesEducationStaffMatchMessage,
  doesStudentMatchMessage,
} from './storage';
import { getStudentResidenceType } from './financeUtils';

export type AppNotificationCategory =
  | 'message'
  | 'announcement'
  | 'warning'
  | 'survey'
  | 'election'
  | 'system';

export interface AppNotificationItem {
  id: string;
  category: AppNotificationCategory;
  title: string;
  body: string;
  fullBody?: string;
  createdAt: string;
  read: boolean;
  itemId?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  soundEnabled: boolean;
  messages: boolean;
  announcements: boolean;
  surveys: boolean;
  elections: boolean;
}

const PREFS_KEY = 'cfuis_notification_prefs_v1';
const SNOOZE_KEY = 'cfuis_notification_prompt_snooze_until_v1';
const FEED_PREFIX = 'cfuis_notification_feed_v1_';
const BASELINE_PREFIX = 'cfuis_notification_baseline_v1_';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  enabled: true,
  soundEnabled: true,
  messages: true,
  announcements: true,
  surveys: true,
  elections: true,
};

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function isRunningStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent || '');
}

export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return window.Notification.permission;
}

export function loadNotificationPrefs(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFS };
    return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

export function saveNotificationPrefs(prefs: NotificationPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore quota errors
  }
}

export function isNotificationPromptSnoozed(): boolean {
  try {
    const until = Number(localStorage.getItem(SNOOZE_KEY) || '0');
    return Number.isFinite(until) && until > Date.now();
  } catch {
    return false;
  }
}

export function snoozeNotificationPrompt(days = 2): void {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + days * 24 * 60 * 60 * 1000));
  } catch {
    // ignore
  }
}

export function clearNotificationPromptSnooze(): void {
  try {
    localStorage.removeItem(SNOOZE_KEY);
  } catch {
    // ignore
  }
}

export async function requestSystemNotificationPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const result = await window.Notification.requestPermission();
    if (result === 'granted') {
      clearNotificationPromptSnooze();
      const prefs = loadNotificationPrefs();
      saveNotificationPrefs({ ...prefs, enabled: true });
    }
    return result;
  } catch {
    return getNotificationPermissionState();
  }
}

export function playNotificationChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(784, now); // G5
    osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.14); // C6
    osc2.frequency.setValueAtTime(523.25, now); // C5

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
    setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 500);
  } catch {
    // autoplay policy or unsupported audio context
  }
}

export function updateAppIconBadge(count: number): void {
  if (typeof navigator === 'undefined') return;
  const nav = navigator as Navigator & {
    setAppBadge?: (contents?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };
  try {
    if (count > 0 && typeof nav.setAppBadge === 'function') {
      void nav.setAppBadge(count).catch(() => {});
    } else if (typeof nav.clearAppBadge === 'function') {
      void nav.clearAppBadge().catch(() => {});
    }
  } catch {
    // ignore unsupported browsers
  }
}

export async function dispatchOSNotification(payload: {
  title: string;
  body: string;
  tag: string;
  category: AppNotificationCategory;
  itemId?: string;
}): Promise<boolean> {
  if (!isNotificationSupported() || window.Notification.permission !== 'granted') {
    return false;
  }

  const options: NotificationOptions & { renotify?: boolean; vibrate?: number[] } = {
    body: payload.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    dir: 'rtl',
    lang: 'fa',
    tag: payload.tag,
    renotify: true,
    vibrate: [180, 80, 180],
    data: {
      url: '/',
      category: payload.category,
      itemId: payload.itemId || '',
    },
  };

  // Android / Installed PWA نیازمند ServiceWorkerRegistration.showNotification است
  if ('serviceWorker' in navigator) {
    try {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200)),
      ]);
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(payload.title, options);
        return true;
      }
    } catch {
      // fallback below
    }
  }

  try {
    const n = new window.Notification(payload.title, options);
    n.onclick = () => {
      window.focus();
      window.dispatchEvent(
        new CustomEvent('app-notification-click', {
          detail: { category: payload.category, itemId: payload.itemId || '' },
        })
      );
      n.close();
    };
    return true;
  } catch {
    return false;
  }
}

export function getUserNotificationKey(user: CurrentUser): string {
  if (!user) return 'guest';
  switch (user.role) {
    case 'student':
      return `student:${user.student.studentId}`;
    case 'supervisor':
      return `supervisor:${user.supervisor.id}`;
    case 'maintenance':
      return `maintenance:${user.technician.id}`;
    case 'counselor':
      return `counselor:${user.counselor.id}`;
    case 'admin':
      return `admin:${user.username}`;
    default:
      return `${user.role}:${user.staff.id}`;
  }
}

function getCurrentActorId(user: NonNullable<CurrentUser>): string {
  switch (user.role) {
    case 'student':
      return user.student.studentId;
    case 'supervisor':
      return user.supervisor.id;
    case 'maintenance':
      return user.technician.id;
    case 'counselor':
      return user.counselor.id;
    case 'admin':
      return 'admin';
    default:
      return user.staff.id;
  }
}

function getCurrentActorName(user: NonNullable<CurrentUser>): string {
  switch (user.role) {
    case 'student':
      return user.student.fullName;
    case 'supervisor':
      return user.supervisor.fullName;
    case 'maintenance':
      return user.technician.fullName;
    case 'counselor':
      return user.counselor.fullName;
    case 'admin':
      return user.name;
    default:
      return user.staff.fullName;
  }
}

export function isMessageRelevantToUser(user: NonNullable<CurrentUser>, m: Message): boolean {
  if (user.role === 'student') {
    return (
      m.senderId === user.student.studentId || doesStudentMatchMessage(user.student, m)
    );
  }
  if (user.role === 'maintenance') {
    return (
      m.receiverType === 'maintenance' ||
      m.category === 'maintenance' ||
      m.receiverType === 'all' ||
      m.senderRole === 'maintenance'
    );
  }
  if (user.role === 'counselor') {
    return (
      m.receiverType === 'counselor' ||
      m.category === 'counseling' ||
      m.category === 'social_personal' ||
      m.senderRole === 'counselor'
    );
  }
  if (user.role === 'finance') {
    return m.receiverType === 'finance' || m.category === 'financial' || m.senderRole === 'finance';
  }
  if (user.role === 'education') {
    return doesEducationStaffMatchMessage(
      user.staff,
      m,
      Storage.getEducationStaff(),
      Storage.getStudents()
    );
  }
  if (user.role === 'cultural') {
    return (
      !m.isConfidential &&
      (m.receiverType === 'cultural' || m.category === 'cultural' || m.senderRole === 'cultural')
    );
  }
  if (user.role === 'student_affairs') {
    return (
      !m.isConfidential &&
      (m.receiverType === 'student_affairs' ||
        m.category === 'student_affairs' ||
        m.senderRole === 'student_affairs' ||
        m.receiverType === 'all')
    );
  }
  if (user.role === 'security') {
    return (
      (!m.isConfidential || m.receiverType === 'security' || m.senderRole === 'security') &&
      (m.receiverType === 'security' ||
        m.category === 'security' ||
        m.senderRole === 'security' ||
        m.receiverType === 'all')
    );
  }
  if (user.role === 'warehouse') {
    return m.receiverType === 'warehouse' || m.senderRole === 'warehouse';
  }
  if (user.role === 'procurement') {
    return m.receiverType === 'procurement' || m.senderRole === 'procurement';
  }
  if (user.role === 'supervisor') {
    return (
      m.receiverType === 'supervisor' || m.senderRole === 'supervisor' || m.receiverType === 'all'
    );
  }
  if (user.role === 'vice_dean') {
    return (
      m.senderRole !== 'student' &&
      m.receiverType !== 'student' &&
      (m.receiverType === 'vice_dean' || m.receiverType === 'all' || m.senderRole === 'vice_dean')
    );
  }
  if (user.role === 'library') {
    return (
      !m.isConfidential &&
      (m.receiverType === 'library' || m.category === 'library' || m.senderRole === 'library')
    );
  }
  if (user.role === 'smart_campus') {
    return (
      !m.isConfidential &&
      (m.receiverType === 'smart_campus' ||
        m.category === 'smart_campus' ||
        m.senderRole === 'smart_campus')
    );
  }
  if (user.role === 'graduation') {
    return (
      !m.isConfidential &&
      (m.receiverType === 'graduation' ||
        m.category === 'graduation' ||
        m.senderRole === 'graduation')
    );
  }
  // admin
  return true;
}

export function isAnnouncementRelevantToUser(user: CurrentUser, a: Announcement): boolean {
  if (!user) return Boolean(a.showOnHomePage);
  if (user.role === 'student') {
    return !a.targetDormId || a.targetDormId === 'all' || a.targetDormId === user.student.assignedDormId;
  }
  if (user.role === 'supervisor') {
    const supDormIds = [
      ...(user.supervisor.assignedDormIds || []),
      ...(user.supervisor.assignedDormId ? [user.supervisor.assignedDormId] : []),
    ];
    return (
      !a.targetDormId ||
      a.targetDormId === 'all' ||
      supDormIds.length === 0 ||
      supDormIds.includes('all') ||
      supDormIds.includes(a.targetDormId)
    );
  }
  return true;
}

export function isSurveyRelevantToUser(user: CurrentUser, s: PeriodicSurvey): boolean {
  if (s.status !== 'active') return false;
  if (!user) return false;
  if (user.role === 'student') {
    return !s.targetDormId || s.targetDormId === 'all' || s.targetDormId === user.student.assignedDormId;
  }
  return user.role === 'admin' || user.role === 'vice_dean' || user.role === 'supervisor';
}

export function isElectionRelevantToUser(user: CurrentUser, e: GuildElection): boolean {
  if (!user) return false;
  if (user.role === 'student') {
    if (e.targetEligibility === 'dorm_only' && getStudentResidenceType(user.student) !== 'dormitory') {
      return false;
    }
    return true;
  }
  return (
    user.role === 'admin' ||
    user.role === 'vice_dean' ||
    user.role === 'student_affairs' ||
    user.role === 'cultural'
  );
}

interface SeenBaselineSnapshot {
  initialized: boolean;
  announcementIds: string[];
  messageIds: string[];
  replyCounts: Record<string, number>;
  surveyIds: string[];
  electionStates: Record<string, boolean>;
  warningIds?: string[];
}

export function loadNotificationFeed(userKey: string): AppNotificationItem[] {
  try {
    const raw = localStorage.getItem(`${FEED_PREFIX}${userKey}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 40) : [];
  } catch {
    return [];
  }
}

export function saveNotificationFeed(userKey: string, items: AppNotificationItem[]): void {
  try {
    localStorage.setItem(`${FEED_PREFIX}${userKey}`, JSON.stringify(items.slice(0, 40)));
  } catch {
    // ignore
  }
}

function loadBaseline(userKey: string): SeenBaselineSnapshot | null {
  try {
    const raw = localStorage.getItem(`${BASELINE_PREFIX}${userKey}`);
    if (!raw) return null;
    return JSON.parse(raw) as SeenBaselineSnapshot;
  } catch {
    return null;
  }
}

function saveBaseline(userKey: string, snapshot: SeenBaselineSnapshot): void {
  try {
    localStorage.setItem(`${BASELINE_PREFIX}${userKey}`, JSON.stringify(snapshot));
  } catch {
    // ignore
  }
}

function truncateText(text: string, maxLen = 110): string {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > maxLen ? `${clean.slice(0, maxLen)}...` : clean;
}

/**
 * مقایسه وضعیت جدید پیام‌ها، اطلاعیه‌ها، نظرسنجی‌ها و انتخابات با آخرین وضعیت دیده‌شده کاربر
 * در اولین بار، خط پایه (Baseline) ذخیره می‌شود تا کاربر با اعلان‌های قدیمی بمباران نشود.
 */
export function detectNewUserNotifications(params: {
  user: CurrentUser;
  announcements: Announcement[];
  messages: Message[];
  surveys: PeriodicSurvey[];
  elections: GuildElection[];
  warnings?: RoomWarning[];
  prefs: NotificationPreferences;
}): AppNotificationItem[] {
  const { user, announcements, messages, surveys, elections, warnings = [], prefs } = params;
  const userKey = getUserNotificationKey(user);

  const relevantAnnouncements = announcements.filter((a) => isAnnouncementRelevantToUser(user, a));
  const relevantMessages = user ? messages.filter((m) => isMessageRelevantToUser(user, m)) : [];
  const relevantSurveys = surveys.filter((s) => isSurveyRelevantToUser(user, s));
  const relevantElections = elections.filter((e) => isElectionRelevantToUser(user, e));
  const relevantWarnings = user
    ? warnings.filter((w) => {
        if (w.resolved) return false;
        if (user.role === 'student') {
          return Boolean(user.student.assignedRoomId && w.roomId === user.student.assignedRoomId);
        }
        if (user.role === 'supervisor') {
          return !user.supervisor.assignedDormIds?.length || user.supervisor.assignedDormIds.includes(w.dormId);
        }
        return user.role === 'admin' || user.role === 'vice_dean' || user.role === 'security';
      })
    : [];

  const nextBaseline: SeenBaselineSnapshot = {
    initialized: true,
    announcementIds: relevantAnnouncements.map((a) => a.id),
    messageIds: relevantMessages.map((m) => m.id),
    replyCounts: Object.fromEntries(relevantMessages.map((m) => [m.id, (m.replies || []).length])),
    surveyIds: relevantSurveys.map((s) => s.id),
    electionStates: Object.fromEntries(
      relevantElections.map((e) => [e.id, Boolean(e.isActiveWindow)])
    ),
    warningIds: relevantWarnings.map((w) => w.id),
  };

  const prev = loadBaseline(userKey);
  if (!prev || !prev.initialized) {
    saveBaseline(userKey, nextBaseline);
    return [];
  }

  const prevAnnouncementSet = new Set(prev.announcementIds || []);
  const prevMessageSet = new Set(prev.messageIds || []);
  const prevReplyCounts = prev.replyCounts || {};
  const prevSurveySet = new Set(prev.surveyIds || []);
  const prevElectionStates = prev.electionStates || {};
  const hasPrevWarnings = Array.isArray(prev.warningIds);
  const prevWarningSet = new Set(prev.warningIds || []);

  const nowIso = new Date().toISOString();
  const discovered: AppNotificationItem[] = [];

  // ۱. پیام‌ها و پاسخ‌های جدید
  if (user && prefs.messages) {
    const actorId = getCurrentActorId(user);
    const actorName = getCurrentActorName(user);

    for (const m of relevantMessages) {
      const isNewMessage = !prevMessageSet.has(m.id);
      const isFromSelf = m.senderId === actorId || m.senderRole === user.role && m.senderName === actorName;

      if (isNewMessage && !isFromSelf) {
        discovered.push({
          id: `notif_msg_${m.id}_${Date.now()}`,
          category: 'message',
          title: `پیام جدید از ${m.senderName || 'سامانه'}`,
          body: truncateText(`${m.subject ? `${m.subject}: ` : ''}${m.content}`),
          createdAt: nowIso,
          read: false,
          itemId: m.id,
        });
      } else if (!isNewMessage) {
        const prevCount = prevReplyCounts[m.id] ?? 0;
        const currCount = (m.replies || []).length;
        if (currCount > prevCount) {
          const lastReply = m.replies[currCount - 1];
          const replyFromSelf =
            lastReply &&
            (lastReply.senderName === actorName ||
              (user.role === 'student' && lastReply.senderRole === 'student'));
          if (lastReply && !replyFromSelf) {
            discovered.push({
              id: `notif_rep_${m.id}_${currCount}_${Date.now()}`,
              category: 'message',
              title: `پاسخ جدید به پیام «${truncateText(m.subject || 'گفتگو', 36)}»`,
              body: truncateText(`${lastReply.senderName}: ${lastReply.content}`),
              createdAt: nowIso,
              read: false,
              itemId: m.id,
            });
          }
        }
      }
    }
  }

  // ۲. اطلاعیه‌های جدید
  if (prefs.announcements) {
    for (const a of relevantAnnouncements) {
      if (!prevAnnouncementSet.has(a.id)) {
        const prefix =
          a.priority === 'urgent' ? 'اطلاعیه فوری: ' : a.priority === 'important' ? 'اطلاعیه مهم: ' : 'اطلاعیه جدید: ';
        discovered.push({
          id: `notif_ann_${a.id}_${Date.now()}`,
          category: 'announcement',
          title: `${prefix}${truncateText(a.title, 55)}`,
          body: truncateText(a.content || 'جهت مشاهده جزئیات اطلاعیه وارد سامانه شوید.'),
          fullBody: a.content || 'جهت مشاهده جزئیات اطلاعیه وارد سامانه شوید.',
          createdAt: nowIso,
          read: false,
          itemId: a.id,
        });
      }
    }
  }

  // ۲-ب. تذکرات و اخطارهای جدید اتاق
  if (hasPrevWarnings && relevantWarnings.length > 0) {
    for (const w of relevantWarnings) {
      if (!prevWarningSet.has(w.id)) {
        const fullText = `${w.description || w.title}${w.supervisorName ? ` (صادرکننده: ${w.supervisorName})` : ''}`;
        discovered.push({
          id: `notif_warn_${w.id}_${Date.now()}`,
          category: 'warning',
          title: `تذکر جدید: ${truncateText(w.title || 'تذکر و اخطار اتاق', 50)}`,
          body: truncateText(fullText),
          fullBody: fullText,
          createdAt: nowIso,
          read: false,
          itemId: w.id,
        });
      }
    }
  }

  // ۳. نظرسنجی‌های فعال جدید
  if (prefs.surveys) {
    for (const s of relevantSurveys) {
      if (!prevSurveySet.has(s.id)) {
        discovered.push({
          id: `notif_srv_${s.id}_${Date.now()}`,
          category: 'survey',
          title: `نظرسنجی جدید: ${truncateText(s.title, 55)}`,
          body: truncateText(
            s.description || `دوره ${s.periodLabel} — لطفاً با مشارکت در نظرسنجی ما را در بهبود خدمات یاری کنید.`
          ),
          createdAt: nowIso,
          read: false,
          itemId: s.id,
        });
      }
    }
  }

  // ۴. انتخابات جدید یا باز شدن پنجره رأی‌گیری
  if (prefs.elections) {
    for (const e of relevantElections) {
      const existed = Object.prototype.hasOwnProperty.call(prevElectionStates, e.id);
      const wasActive = Boolean(prevElectionStates[e.id]);
      if (!existed) {
        discovered.push({
          id: `notif_elec_${e.id}_${Date.now()}`,
          category: 'election',
          title: `انتخابات جدید: ${truncateText(e.title, 55)}`,
          body: truncateText(
            e.noticeText || e.description || `انتخابات ${e.academicYear} ثبت شد. جهت مشاهده و شرکت وارد سامانه شوید.`
          ),
          createdAt: nowIso,
          read: false,
          itemId: e.id,
        });
      } else if (!wasActive && e.isActiveWindow) {
        discovered.push({
          id: `notif_elec_open_${e.id}_${Date.now()}`,
          category: 'election',
          title: `آغاز رأی‌گیری: ${truncateText(e.title, 55)}`,
          body: truncateText(
            e.noticeText || 'پنجره رأی‌گیری انتخابات اکنون فعال است؛ برای ثبت رأی وارد بخش انتخابات شوید.'
          ),
          createdAt: nowIso,
          read: false,
          itemId: e.id,
        });
      }
    }
  }

  saveBaseline(userKey, nextBaseline);
  return discovered;
}
