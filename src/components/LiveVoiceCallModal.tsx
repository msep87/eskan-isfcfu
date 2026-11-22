import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../utils/storage';
import { getRoleDisplayLabel } from '../utils/communityStickers';
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Users,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export interface LiveVoiceCallTarget {
  roomId: string;
  roomTitle: string;
  roomType: 'public' | 'forum' | 'dm';
  targetPeerId?: string;
  targetPeerName?: string;
  isInitiator?: boolean;
}

interface LiveVoiceCallModalProps {
  call: LiveVoiceCallTarget;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  onClose: () => void;
}

interface CallPeerInfo {
  key: string;
  userId: string;
  name: string;
  role: string;
  muted: boolean;
  connected: boolean;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

function sanitizeChannelId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
}

function formatCallDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const raw = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  return raw.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

export const LiveVoiceCallModal: React.FC<LiveVoiceCallModalProps> = ({
  call,
  currentUserId,
  currentUserName,
  currentUserRole,
  onClose,
}) => {
  const myKeyRef = useRef<string>(
    `${currentUserRole}_${currentUserId}_${Math.random().toString(36).slice(2, 7)}`
  );
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const isMutedRef = useRef(false);

  const [status, setStatus] = useState<'connecting' | 'ringing' | 'connected' | 'error'>('connecting');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [peers, setPeers] = useState<CallPeerInfo[]>([]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // شمارنده زمان تماس
  useEffect(() => {
    if (status === 'error') return;
    const t = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [status]);

  // اعمال قطع/وصل صدای بلندگو روی تمام استریم‌های دریافتی
  useEffect(() => {
    remoteAudiosRef.current.forEach((audio) => {
      audio.muted = isSpeakerMuted;
    });
  }, [isSpeakerMuted]);

  useEffect(() => {
    let isMounted = true;
    const myKey = myKeyRef.current;

    const cleanupPeer = (peerKey: string) => {
      const pc = peersRef.current.get(peerKey);
      if (pc) {
        try {
          pc.ontrack = null;
          pc.onicecandidate = null;
          pc.onconnectionstatechange = null;
          pc.close();
        } catch {
          // ignore
        }
        peersRef.current.delete(peerKey);
      }
      const audioEl = remoteAudiosRef.current.get(peerKey);
      if (audioEl) {
        try {
          audioEl.pause();
          audioEl.srcObject = null;
        } catch {
          // ignore
        }
        remoteAudiosRef.current.delete(peerKey);
      }
      pendingIceRef.current.delete(peerKey);
    };

    const createPeerConnection = (peerKey: string) => {
      const existing = peersRef.current.get(peerKey);
      if (existing) return existing;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      const localStream = localStreamRef.current;
      if (localStream) {
        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
      }

      pc.onicecandidate = (ev) => {
        if (ev.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'webrtc_signal',
            payload: {
              from: myKey,
              to: peerKey,
              kind: 'ice',
              candidate: ev.candidate.toJSON(),
            },
          });
        }
      };

      pc.ontrack = (ev) => {
        const [stream] = ev.streams;
        if (!stream) return;
        let audio = remoteAudiosRef.current.get(peerKey);
        if (!audio) {
          audio = document.createElement('audio');
          audio.autoplay = true;
          audio.setAttribute('playsinline', 'true');
          remoteAudiosRef.current.set(peerKey, audio);
        }
        audio.srcObject = stream;
        audio.muted = isSpeakerMuted;
        audio.play().catch(() => {
          // در برخی مرورگرها پخش خودکار با تعامل کاربر فعال می‌شود
        });
      };

      pc.onconnectionstatechange = () => {
        if (!isMounted) return;
        const connected = pc.connectionState === 'connected';
        setPeers((prev) =>
          prev.map((p) => (p.key === peerKey ? { ...p, connected } : p))
        );
        if (connected) {
          setStatus('connected');
        }
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          cleanupPeer(peerKey);
        }
      };

      peersRef.current.set(peerKey, pc);
      return pc;
    };

    const flushPendingIce = async (peerKey: string, pc: RTCPeerConnection) => {
      const queued = pendingIceRef.current.get(peerKey) || [];
      pendingIceRef.current.delete(peerKey);
      for (const cand of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch {
          // ignore stale candidate
        }
      }
    };

    const initiateOfferTo = async (peerKey: string) => {
      try {
        const pc = createPeerConnection(peerKey);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channelRef.current?.send({
          type: 'broadcast',
          event: 'webrtc_signal',
          payload: {
            from: myKey,
            to: peerKey,
            kind: 'offer',
            sdp: offer,
          },
        });
      } catch {
        // ignore transient offer error
      }
    };

    const startCall = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(
            'مرورگر شما از دسترسی به میکروفون و تماس صوتی مستقیم پشتیبانی نمی‌کند یا صفحه در بستر امن HTTPS نیست.'
          );
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;

        const channelName = `cfuis_voice_${sanitizeChannelId(call.roomId)}`;
        const ch = supabase.channel(channelName, {
          config: {
            broadcast: { self: false },
            presence: { key: myKey },
          },
        });
        channelRef.current = ch;

        ch.on('presence', { event: 'sync' }, () => {
          if (!isMounted) return;
          const state = ch.presenceState<{
            userId: string;
            name: string;
            role: string;
            muted: boolean;
          }>();

          const activePeers: CallPeerInfo[] = [];
          const activeKeys = new Set<string>();

          Object.entries(state).forEach(([key, metas]) => {
            if (key === myKey || !metas || metas.length === 0) return;
            const meta = metas[0];
            activeKeys.add(key);
            const pc = peersRef.current.get(key);
            activePeers.push({
              key,
              userId: meta.userId,
              name: meta.name,
              role: meta.role,
              muted: Boolean(meta.muted),
              connected: pc?.connectionState === 'connected',
            });

            // ایجاد ارتباط WebRTC با قانون قطعی برای جلوگیری از تداخل دوطرفه
            if (!pc && myKey.localeCompare(key) > 0) {
              initiateOfferTo(key);
            }
          });

          // پاکسازی همتاهایی که تماس را ترک کرده‌اند
          Array.from(peersRef.current.keys()).forEach((existingKey) => {
            if (!activeKeys.has(existingKey)) {
              cleanupPeer(existingKey);
            }
          });

          setPeers(activePeers);
          if (activePeers.length > 0) {
            setStatus('connected');
          } else {
            setStatus(call.roomType === 'dm' ? 'ringing' : 'connected');
          }
        });

        ch.on('broadcast', { event: 'webrtc_signal' }, async ({ payload }) => {
          if (!isMounted || !payload || payload.to !== myKey) return;
          const fromKey = String(payload.from || '');
          if (!fromKey) return;

          try {
            if (payload.kind === 'offer' && payload.sdp) {
              const pc = createPeerConnection(fromKey);
              await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
              await flushPendingIce(fromKey, pc);
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              ch.send({
                type: 'broadcast',
                event: 'webrtc_signal',
                payload: {
                  from: myKey,
                  to: fromKey,
                  kind: 'answer',
                  sdp: answer,
                },
              });
            } else if (payload.kind === 'answer' && payload.sdp) {
              const pc = peersRef.current.get(fromKey);
              if (pc && pc.signalingState !== 'stable') {
                await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                await flushPendingIce(fromKey, pc);
              }
            } else if (payload.kind === 'ice' && payload.candidate) {
              const pc = peersRef.current.get(fromKey);
              if (pc && pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
              } else {
                const list = pendingIceRef.current.get(fromKey) || [];
                list.push(payload.candidate);
                pendingIceRef.current.set(fromKey, list);
              }
            }
          } catch {
            // ignore transient signaling error
          }
        });

        ch.subscribe(async (subStatus) => {
          if (!isMounted) return;
          if (subStatus === 'SUBSCRIBED') {
            await ch.track({
              userId: currentUserId,
              name: currentUserName,
              role: currentUserRole,
              muted: isMutedRef.current,
            });
            setStatus(call.roomType === 'dm' ? 'ringing' : 'connected');

            // ارسال زنگ تماس ورودی برای مخاطب در گفتگوی دو نفره
            if (call.roomType === 'dm' && call.isInitiator && call.targetPeerId) {
              const inviteChannel = supabase.channel(
                `cfuis_call_invite_${sanitizeChannelId(call.targetPeerId)}`
              );
              inviteChannel.subscribe((invStatus) => {
                if (invStatus === 'SUBSCRIBED') {
                  inviteChannel
                    .send({
                      type: 'broadcast',
                      event: 'incoming_voice_call',
                      payload: {
                        roomId: call.roomId,
                        roomTitle: currentUserName,
                        roomType: 'dm',
                        callerId: currentUserId,
                        callerName: currentUserName,
                        callerRole: currentUserRole,
                      },
                    })
                    .finally(() => {
                      setTimeout(() => {
                        supabase.removeChannel(inviteChannel);
                      }, 1200);
                    });
                }
              });
            }
          }
        });
      } catch (err) {
        if (!isMounted) return;
        const message =
          err instanceof Error
            ? err.message
            : 'امکان دسترسی به میکروفون وجود ندارد. لطفاً مجوز میکروفون مرورگر را بررسی کنید.';
        setErrorMsg(message);
        setStatus('error');
      }
    };

    startCall();

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      Array.from(peersRef.current.keys()).forEach((k) => cleanupPeer(k));
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call.roomId]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    channelRef.current?.track({
      userId: currentUserId,
      name: currentUserName,
      role: currentUserRole,
      muted: nextMuted,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 via-teal-950 to-slate-950 border border-teal-500/30 text-white shadow-2xl">
        {/* نوار بالا */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-extrabold text-teal-200">
              {call.roomType === 'dm'
                ? 'تماس صوتی مستقیم (خصوصی)'
                : 'اتاق گفتگوی صوتی زنده گروهی'}
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-black font-mono text-teal-100">
            {formatCallDuration(elapsedSec)}
          </span>
        </div>

        {/* بدنه اصلی تماس */}
        <div className="px-6 py-6 flex flex-col items-center text-center space-y-4">
          <div className="relative">
            {status !== 'error' && (
              <>
                <span className="absolute inset-0 rounded-full bg-teal-400/20 animate-ping" />
                <span className="absolute -inset-3 rounded-full bg-emerald-500/10 animate-pulse" />
              </>
            )}
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg border-2 border-white/25">
              {call.roomType === 'dm' ? (
                <Radio className="w-9 h-9 text-white" />
              ) : (
                <Users className="w-9 h-9 text-white" />
              )}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-black text-base sm:text-lg text-white">
              {call.targetPeerName || call.roomTitle}
            </h3>
            <p className="text-xs text-teal-200/90">
              {status === 'connecting' && 'در حال اتصال به میکروفون و برقراری ارتباط...'}
              {status === 'ringing' &&
                'در انتظار پیوستن مخاطب به تماس صوتی... (اگر مخاطب در پیام‌رسان باشد اعلان زنگ دریافت می‌کند)'}
              {status === 'connected' &&
                (peers.length > 0
                  ? `متصل • ${(peers.length + 1).toLocaleString('fa-IR')} نفر در گفتگوی صوتی فعال`
                  : 'اتاق گفتگوی صوتی آماده است — منتظر پیوستن سایر اعضا...')}
              {status === 'error' && 'خطا در برقراری تماس صوتی'}
            </p>
          </div>

          {errorMsg && (
            <div className="w-full p-3 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-100 text-xs flex items-start gap-2 text-right">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-300" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* لیست شرکت‌کنندگان فعال در تماس */}
          {status !== 'error' && (
            <div className="w-full rounded-2xl bg-white/5 border border-white/10 p-3 space-y-2 max-h-44 overflow-y-auto text-right">
              <div className="text-[10px] font-extrabold text-teal-300 flex items-center justify-between">
                <span>حاضرین در گفتگوی صوتی</span>
                <span>{(peers.length + 1).toLocaleString('fa-IR')} نفر</span>
              </div>

              {/* خود کاربر */}
              <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-white/10">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-xs font-black shrink-0">
                    {currentUserName.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold truncate">
                      {currentUserName} (شما)
                    </div>
                    <div className="text-[10px] text-teal-200/80">
                      {getRoleDisplayLabel(currentUserRole)}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isMuted
                      ? 'bg-rose-500/30 text-rose-200'
                      : 'bg-emerald-500/30 text-emerald-200'
                  }`}
                >
                  {isMuted ? 'میکروفون بسته' : 'میکروفون باز'}
                </span>
              </div>

              {/* سایر همتاهای حاضر */}
              {peers.map((peer) => (
                <div
                  key={peer.key}
                  className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-black shrink-0">
                      {peer.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold truncate">{peer.name}</div>
                      <div className="text-[10px] text-slate-300">
                        {getRoleDisplayLabel(peer.role)}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      peer.muted
                        ? 'bg-amber-500/25 text-amber-200'
                        : peer.connected
                        ? 'bg-emerald-500/30 text-emerald-200'
                        : 'bg-sky-500/25 text-sky-200'
                    }`}
                  >
                    {peer.muted ? 'بی‌صدا' : peer.connected ? 'متصل' : 'در حال اتصال...'}
                  </span>
                </div>
              ))}

              {peers.length === 0 && (
                <div className="py-2 text-center text-[11px] text-teal-200/70 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>همکاران یا اعضا با زدن دکمه «تماس صوتی» در همین گفتگو مستقیماً متصل می‌شوند.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* دکمه‌های کنترل تماس */}
        <div className="px-6 py-4 bg-black/30 border-t border-white/10 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={toggleMute}
            disabled={status === 'error'}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition cursor-pointer disabled:opacity-40 ${
              isMuted
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={isMuted ? 'وصل میکروفون' : 'قطع میکروفون (Mute)'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg cursor-pointer transition"
          >
            <PhoneOff className="w-5 h-5" />
            <span>پایان تماس</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSpeakerMuted((p) => !p)}
            disabled={status === 'error'}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition cursor-pointer disabled:opacity-40 ${
              isSpeakerMuted
                ? 'bg-slate-600 text-white hover:bg-slate-500'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={isSpeakerMuted ? 'وصل صدای خروجی' : 'قطع صدای خروجی'}
          >
            {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
