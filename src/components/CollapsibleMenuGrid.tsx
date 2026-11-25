import React from 'react';
import { ChevronDown, ChevronUp, LayoutGrid, PackagePlus, X } from 'lucide-react';
import { Storage } from '../utils/storage';

export interface CollapsibleMenuItem<K extends string = string> {
  id: K;
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: number | string;
  badgeTone?: 'rose' | 'amber' | 'teal' | 'indigo' | 'sky';
  activeClass?: string;
}

export interface CollapsibleMenuCategory<K extends string = string> {
  title: string;
  items: CollapsibleMenuItem<K>[];
}

interface CollapsibleMenuGridProps<K extends string = string> {
  categories?: CollapsibleMenuCategory<K>[];
  items?: CollapsibleMenuItem<K>[];
  activeKey: K | null;
  onToggle: (key: K) => void;
  onCloseActive?: () => void;
  title?: string;
  emptyPrompt?: string;
}

const BADGE_CLASSES: Record<NonNullable<CollapsibleMenuItem['badgeTone']>, string> = {
  rose: 'bg-rose-600 text-white',
  amber: 'bg-amber-500 text-slate-950',
  teal: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  sky: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
};

export function CollapsibleMenuGrid<K extends string>({
  categories,
  items,
  activeKey,
  onToggle,
  onCloseActive,
  title = 'منوی بخش‌های کارتابل (برای باز یا بسته شدن روی هر گزینه کلیک کنید)',
  emptyPrompt = 'برای مشاهده هر بخش، روی دکمه مربوطه در منوی بالا کلیک کنید. با کلیک مجدد، همان بخش بسته می‌شود.',
}: CollapsibleMenuGridProps<K>) {
  const currentUser = Storage.getCurrentUser();
  const canRequestWarehouse = Boolean(
    currentUser &&
      currentUser.role !== 'student' &&
      currentUser.role !== 'warehouse' &&
      currentUser.role !== 'professor' &&
      currentUser.role !== 'admin'
  );
  const myStaffId = currentUser
    ? 'supervisor' in currentUser
      ? currentUser.supervisor.id
      : 'counselor' in currentUser
      ? currentUser.counselor.id
      : 'technician' in currentUser
      ? currentUser.technician.id
      : 'staff' in currentUser
      ? currentUser.staff.id
      : ''
    : '';
  const pendingWarehouseCount =
    canRequestWarehouse && myStaffId
      ? Storage.getWarehouseRequests().filter(
          (r) =>
            r.requestedByStaffId === myStaffId &&
            (r.status === 'pending_warehouse' ||
              r.status === 'pending_supervisor' ||
              r.status === 'referred_to_procurement')
        ).length
      : 0;

  const groups: CollapsibleMenuCategory<K>[] = categories
    ? categories
    : items
    ? [{ title: '', items }]
    : [];

  const activeItem = groups
    .flatMap((g) => g.items)
    .find((item) => item.id === activeKey);

  return (
    <div className="space-y-3">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-200">
            <LayoutGrid className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{title}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canRequestWarehouse && (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('cfuis:open-warehouse-request'))}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/90 dark:bg-amber-950/50 dark:hover:bg-amber-950 dark:text-amber-300 dark:border-amber-800/70 text-[11px] font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                title="ثبت و پیگیری درخواست کالا و ملزومات از انبار"
              >
                <PackagePlus className="w-3.5 h-3.5 shrink-0" />
                <span>درخواست از انبار</span>
                {pendingWarehouseCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black tabular-nums">
                    {pendingWarehouseCount.toLocaleString('fa-IR')}
                  </span>
                )}
              </button>
            )}
            {activeKey !== null && activeItem && (
              <button
                type="button"
                onClick={() => (onCloseActive ? onCloseActive() : onToggle(activeKey))}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>بستن «{activeItem.label}»</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {groups.map((group, gIdx) => (
            <div key={group.title || gIdx} className="space-y-2">
              {group.title && (
                <div className="flex items-center gap-2 px-1">
                  <span className="w-1.5 h-4 rounded-full bg-teal-500" />
                  <h4 className="text-[11px] sm:text-xs font-extrabold text-slate-500 dark:text-slate-400">
                    {group.title}
                  </h4>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {group.items.map((item) => {
                  const isOpen = activeKey === item.id;
                  const activeCls =
                    item.activeClass ||
                    'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20';
                  const hasBadge =
                    item.badge !== undefined &&
                    item.badge !== null &&
                    item.badge !== '' &&
                    item.badge !== 0;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => onToggle(item.id)}
                      className={`group w-full text-right px-3.5 py-3 rounded-2xl border transition flex items-center justify-between gap-2.5 cursor-pointer ${
                        isOpen
                          ? activeCls
                          : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-800 hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${
                            isOpen
                              ? 'bg-white/20 text-white'
                              : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-teal-600 dark:text-teal-400'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-[13px] font-extrabold leading-5 truncate">
                            {item.label}
                          </div>
                          {item.subtitle && (
                            <div
                              className={`text-[10px] truncate mt-0.5 ${
                                isOpen ? 'text-white/85' : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasBadge && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums ${
                              isOpen
                                ? 'bg-white/25 text-white'
                                : BADGE_CLASSES[item.badgeTone || 'rose']
                            }`}
                          >
                            {typeof item.badge === 'number'
                              ? item.badge.toLocaleString('fa-IR')
                              : item.badge}
                          </span>
                        )}
                        <span
                          className={`p-1 rounded-lg transition ${
                            isOpen
                              ? 'bg-white/20 text-white'
                              : 'text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400'
                          }`}
                        >
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeKey === null && (
        <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
          {emptyPrompt}
        </div>
      )}
    </div>
  );
}
