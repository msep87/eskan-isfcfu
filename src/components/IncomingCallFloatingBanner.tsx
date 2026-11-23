import React from 'react';
import { PhoneCall, PhoneIncoming, PhoneOff } from 'lucide-react';
import { IncomingVoiceCallPayload } from '../utils/realtimePresence';
import { getRoleDisplayLabel } from '../utils/communityStickers';

interface IncomingCallFloatingBannerProps {
  call: IncomingVoiceCallPayload | null;
  isCallerOnline?: boolean;
  onAccept: (call: IncomingVoiceCallPayload) => void;
  onReject: (call: IncomingVoiceCallPayload) => void;
}

export const IncomingCallFloatingBanner: React.FC<IncomingCallFloatingBannerProps> = ({
  call,
  isCallerOnline = true,
  onAccept,
  onReject,
}) => {
  if (!call) return null;

  return (
    <div
      dir="rtl"
      className="fixed top-20 left-3 sm:left-5 z-[60] w-[calc(100vw-1.5rem)] max-w-sm animate-in fade-in slide-in-from-top-3 duration-300"
    >
      <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white border-2 border-emerald-400/70 shadow-2xl shadow-emerald-950/60 overflow-hidden">
        {/* نوار زنگ‌خورنده بالا */}
        <div className="px-4 py-2 bg-emerald-500/20 border-b border-emerald-400/25 flex items-center justify-between text-[11px] font-extrabold text-emerald-200">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>تماس صوتی ورودی</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-400/30">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isCallerOnline ? 'bg-emerald-400' : 'bg-slate-400'
              }`}
            />
            {isCallerOnline ? 'آنلاین' : 'آفلاین'}
          </span>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3.5">
            {/* آیکون تلفن در حال زنگ خوردن */}
            <div className="relative shrink-0">
              <span className="absolute inset-0 rounded-2xl bg-emerald-400/40 animate-ping" />
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-600/40">
                <PhoneIncoming className="w-6 h-6 text-white animate-bounce" />
              </div>
            </div>

            <div className="min-w-0 flex-1 text-right">
              <div className="text-sm font-black text-white truncate">{call.callerName}</div>
              <div className="text-[11px] text-emerald-200/90 mt-0.5 truncate">
                {getRoleDisplayLabel(call.callerRole)} · {call.roomTitle || 'تماس صوتی مستقیم'}
              </div>
              <div className="text-[10px] text-slate-300 mt-1">
                برای شروع گفتگوی صوتی زنده روی دکمه پاسخ بزنید
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onAccept(call)}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>پاسخ به تماس</span>
            </button>
            <button
              type="button"
              onClick={() => onReject(call)}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 transition cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>رد تماس</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
