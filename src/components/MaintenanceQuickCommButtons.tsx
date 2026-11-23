import React from 'react';
import { MessageCircle, Phone, PhoneCall } from 'lucide-react';
import { MaintenanceStaff } from '../types';
import { triggerQuickStaffComm, useGlobalOnlineUserIds } from '../utils/realtimePresence';

interface MaintenanceQuickCommButtonsProps {
  technician?: Pick<MaintenanceStaff, 'id' | 'fullName' | 'mobile' | 'specialty'> | null;
  contextNote?: string;
  showLabels?: boolean;
}

/**
 * دکمه‌های اقدام سریع کنار تکنسین تأسیسات:
 * ۱) تماس تلفنی مستقیم (tel:)
 * ۲) چت سریع درون‌برنامه‌ای (با نشانگر آنلاین/آفلاین زنده)
 * ۳) تماس صوتی مستقیم درون‌برنامه‌ای
 */
export const MaintenanceQuickCommButtons: React.FC<MaintenanceQuickCommButtonsProps> = ({
  technician,
  contextNote,
  showLabels = false,
}) => {
  const onlineUserIds = useGlobalOnlineUserIds();

  if (!technician) return null;

  const isOnline = onlineUserIds.has(technician.id);

  return (
    <div className="inline-flex items-center gap-1 flex-wrap">
      {technician.mobile && (
        <a
          href={`tel:${technician.mobile}`}
          className="inline-flex items-center gap-1 px-1.5 py-1 rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/70 transition text-[11px] font-bold"
          title={`تماس تلفنی با ${technician.fullName} (${technician.mobile})`}
        >
          <Phone className="w-3.5 h-3.5 shrink-0" />
          {showLabels && <span>تماس تلفنی</span>}
        </a>
      )}

      <button
        type="button"
        onClick={() =>
          triggerQuickStaffComm({
            staffId: technician.id,
            staffName: technician.fullName,
            staffRole: 'maintenance',
            mode: 'chat',
            contextNote,
          })
        }
        className="relative inline-flex items-center gap-1 px-1.5 py-1 rounded-lg text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/70 transition text-[11px] font-bold cursor-pointer"
        title={`چت سریع درون‌برنامه‌ای با ${technician.fullName} (${isOnline ? 'آنلاین' : 'آفلاین'})`}
      >
        <span className="relative inline-flex">
          <MessageCircle className="w-3.5 h-3.5 shrink-0" />
          <span
            className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${
              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
        </span>
        {showLabels && <span>چت درون‌برنامه‌ای</span>}
      </button>

      <button
        type="button"
        onClick={() =>
          triggerQuickStaffComm({
            staffId: technician.id,
            staffName: technician.fullName,
            staffRole: 'maintenance',
            mode: 'voice_call',
            contextNote,
          })
        }
        className="inline-flex items-center gap-1 px-1.5 py-1 rounded-lg text-teal-700 dark:text-teal-300 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/60 border border-teal-200/80 dark:border-teal-800/70 transition text-[11px] font-bold cursor-pointer"
        title={`تماس صوتی سریع درون‌برنامه‌ای با ${technician.fullName} (${isOnline ? 'آنلاین' : 'آفلاین'})`}
      >
        <PhoneCall className="w-3.5 h-3.5 shrink-0" />
        {showLabels && <span>تماس درون‌برنامه‌ای</span>}
      </button>
    </div>
  );
};
