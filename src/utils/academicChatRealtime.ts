import { AcademicChatMessage, AcademicChatRoom } from '../types';
import { Storage, supabase } from './storage';

const SUPABASE_ACADEMIC_CHAT_CHANNEL = 'cfuis_academic_chat_v1';
const BROADCAST_CHANNEL_NAME = 'cfuis_academic_chat_bc_v1';
const LOCAL_EVENT_NAME = 'cfuis:academic-chat-updated';
const READ_MAP_STORAGE_PREFIX = 'cfuis_academic_chat_read_v1_';

export type AcademicChatRealtimeEvent =
  | {
      kind: 'room_upsert';
      room: AcademicChatRoom;
      actorId: string;
    }
  | {
      kind: 'message_upsert';
      message: AcademicChatMessage;
      actorId: string;
    }
  | {
      kind: 'message_delete';
      messageId: string;
      roomId: string;
      actorId: string;
    }
  | {
      kind: 'typing';
      roomId: string;
      senderId: string;
      senderName: string;
      isTyping: boolean;
      sentAtMs: number;
    };

const INSTANCE_TAB_ID = `actab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

let sharedChannel: ReturnType<typeof supabase.channel> | null = null;
let sharedBc: BroadcastChannel | null = null;
let subscriberCount = 0;

const typingListeners = new Set<(payload: Extract<AcademicChatRealtimeEvent, { kind: 'typing' }>) => void>();

function notifyLocalListeners() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LOCAL_EVENT_NAME));
  }
}

function handleIncomingEvent(raw: unknown) {
  if (!raw || typeof raw !== 'object') return;
  const wrapped = raw as { originTabId?: string; event?: AcademicChatRealtimeEvent };
  if (wrapped.originTabId === INSTANCE_TAB_ID || !wrapped.event) return;
  const evt = wrapped.event;

  if (evt.kind === 'room_upsert' && evt.room) {
    Storage.upsertAcademicChatRoom(evt.room);
    notifyLocalListeners();
    return;
  }

  if (evt.kind === 'message_upsert' && evt.message) {
    Storage.upsertAcademicChatMessage(evt.message);
    notifyLocalListeners();
    return;
  }

  if (evt.kind === 'message_delete' && evt.messageId) {
    Storage.deleteAcademicChatMessage(evt.messageId);
    notifyLocalListeners();
    return;
  }

  if (evt.kind === 'typing') {
    typingListeners.forEach((cb) => cb(evt));
  }
}

function ensureRealtimeConnections() {
  if (!sharedBc && typeof BroadcastChannel !== 'undefined') {
    try {
      sharedBc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      sharedBc.onmessage = (e) => handleIncomingEvent(e.data);
    } catch {
      sharedBc = null;
    }
  }

  if (!sharedChannel) {
    try {
      const ch = supabase.channel(SUPABASE_ACADEMIC_CHAT_CHANNEL, {
        config: { broadcast: { self: false } },
      });
      ch.on('broadcast', { event: 'academic_chat' }, ({ payload }) => {
        handleIncomingEvent(payload);
      });
      ch.subscribe();
      sharedChannel = ch;
    } catch {
      sharedChannel = null;
    }
  }
}

function cleanupRealtimeIfIdle() {
  if (subscriberCount > 0) return;
  if (sharedBc) {
    try {
      sharedBc.close();
    } catch {
      // ignore
    }
    sharedBc = null;
  }
  if (sharedChannel) {
    try {
      supabase.removeChannel(sharedChannel);
    } catch {
      // ignore
    }
    sharedChannel = null;
  }
}

export function broadcastAcademicChatEvent(event: AcademicChatRealtimeEvent): void {
  ensureRealtimeConnections();
  const envelope = {
    originTabId: INSTANCE_TAB_ID,
    event,
  };

  if (event.kind !== 'typing') {
    notifyLocalListeners();
  }

  if (sharedBc) {
    try {
      sharedBc.postMessage(envelope);
    } catch {
      // ignore
    }
  }

  if (sharedChannel) {
    try {
      void sharedChannel.send({
        type: 'broadcast',
        event: 'academic_chat',
        payload: envelope,
      });
    } catch {
      // ignore
    }
  }
}

export function subscribeAcademicChatRealtime(params: {
  onDataUpdated: () => void;
  onTyping?: (evt: Extract<AcademicChatRealtimeEvent, { kind: 'typing' }>) => void;
}): () => void {
  subscriberCount++;
  ensureRealtimeConnections();

  const onLocalEvent = () => {
    params.onDataUpdated();
  };
  if (typeof window !== 'undefined') {
    window.addEventListener(LOCAL_EVENT_NAME, onLocalEvent);
  }
  if (params.onTyping) {
    typingListeners.add(params.onTyping);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(LOCAL_EVENT_NAME, onLocalEvent);
    }
    if (params.onTyping) {
      typingListeners.delete(params.onTyping);
    }
    subscriberCount = Math.max(0, subscriberCount - 1);
    cleanupRealtimeIfIdle();
  };
}

export function getAcademicChatReadMap(actorId: string): Record<string, string> {
  if (!actorId || typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(READ_MAP_STORAGE_PREFIX + actorId);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function markAcademicRoomRead(actorId: string, roomId: string, isoTime?: string): void {
  if (!actorId || !roomId || typeof localStorage === 'undefined') return;
  try {
    const current = getAcademicChatReadMap(actorId);
    const nextIso = isoTime || new Date().toISOString();
    if (current[roomId] && current[roomId] >= nextIso) return;
    current[roomId] = nextIso;
    localStorage.setItem(READ_MAP_STORAGE_PREFIX + actorId, JSON.stringify(current));
    notifyLocalListeners();
  } catch {
    // ignore storage errors
  }
}

export function getAcademicRoomUnreadCount(
  actorId: string,
  room: AcademicChatRoom,
  messages: AcademicChatMessage[],
  readMap: Record<string, string>
): number {
  const lastReadIso = readMap[room.id] || '';
  return messages.filter(
    (m) =>
      m.roomId === room.id &&
      m.senderId !== actorId &&
      (!lastReadIso || (m.createdAtIso || '') > lastReadIso)
  ).length;
}

export function getAcademicChatTotalUnreadCount(actorId: string): number {
  if (!actorId) return 0;
  const rooms = Storage.getAcademicChatRooms().filter(
    (r) => r.type === 'forum' || r.memberIds.includes(actorId)
  );
  const messages = Storage.getAcademicChatMessages();
  const readMap = getAcademicChatReadMap(actorId);
  return rooms.reduce(
    (sum, r) => sum + getAcademicRoomUnreadCount(actorId, r, messages, readMap),
    0
  );
}
