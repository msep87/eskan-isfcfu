import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-2xl bg-amber-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-xl border border-amber-400/50"
    >
      <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
      <span>حالت آفلاین — نمایش اطلاعات ذخیره‌شده در دستگاه</span>
    </div>
  );
};
