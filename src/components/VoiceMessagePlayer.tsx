import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface VoiceMessagePlayerProps {
  src: string;
  durationSec?: number;
  isMine?: boolean;
}

const WAVE_BARS = [
  35, 65, 45, 90, 70, 40, 85, 95, 55, 75, 50, 88, 60, 42, 78, 92, 62, 48, 80, 52, 68, 38,
];

function formatFaSeconds(sec: number): string {
  const safe = Number.isFinite(sec) && sec > 0 ? Math.floor(sec) : 0;
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  const raw = `${m}:${s < 10 ? '0' : ''}${s}`;
  return raw.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  src,
  durationSec,
  isMine = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState<number>(durationSec || 0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (durationSec && durationSec > 0) {
      setTotalDuration((prev) => (prev > 0 ? prev : durationSec));
    }
  }, [durationSec]);

  const togglePlay = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
      return;
    }
    try {
      await el.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const handleCycleSpeed = () => {
    setPlaybackRate((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1));
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el) return;
    const dur = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : totalDuration;
    if (!dur || dur <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // چپ به راست برای نوار پیشرفت صوتی
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * dur;
    setCurrentTime(el.currentTime);
  };

  const effectiveDuration = totalDuration > 0 ? totalDuration : durationSec || 1;
  const progressRatio = Math.min(1, Math.max(0, currentTime / effectiveDuration));

  return (
    <div
      className={`my-1.5 flex items-center gap-2.5 px-2.5 py-2 rounded-2xl min-w-[220px] max-w-[300px] border ${
        isMine
          ? 'bg-black/15 border-white/20 text-white'
          : 'bg-slate-100/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
      }`}
      dir="ltr"
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setTotalDuration(d);
        }}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onPause={() => setIsPlaying(false)}
      />

      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'توقف صوت' : 'پخش صوت'}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer shadow-xs ${
          isMine
            ? 'bg-white text-teal-700 hover:bg-teal-50'
            : 'bg-teal-600 text-white hover:bg-teal-700'
        }`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0 space-y-1">
        {/* نوار شکل‌موج تعاملی */}
        <div
          onClick={handleSeek}
          role="slider"
          aria-label="پیشرفت پخش صوت"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressRatio * 100)}
          className="h-7 flex items-center gap-[2px] cursor-pointer select-none"
        >
          {WAVE_BARS.map((heightPct, idx) => {
            const barPos = (idx + 0.5) / WAVE_BARS.length;
            const active = barPos <= progressRatio;
            return (
              <span
                key={idx}
                style={{ height: `${Math.max(22, heightPct)}%` }}
                className={`flex-1 rounded-full transition-colors ${
                  active
                    ? isMine
                      ? 'bg-white'
                      : 'bg-teal-600 dark:bg-teal-400'
                    : isMine
                    ? 'bg-white/35'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] font-bold opacity-85">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3 h-3" />
            <span>
              {isPlaying || currentTime > 0
                ? `${formatFaSeconds(currentTime)} / ${formatFaSeconds(totalDuration)}`
                : formatFaSeconds(totalDuration)}
            </span>
          </span>
          <button
            type="button"
            onClick={handleCycleSpeed}
            title="تغییر سرعت پخش"
            className={`px-1.5 py-0.5 rounded-md text-[9px] font-black cursor-pointer transition ${
              isMine
                ? 'bg-white/20 hover:bg-white/30 text-white'
                : 'bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            {playbackRate === 1 ? '۱×' : playbackRate === 1.5 ? '۱.۵×' : '۲×'}
          </button>
        </div>
      </div>
    </div>
  );
};
