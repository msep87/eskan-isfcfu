import React, { useMemo, useState } from 'react';
import { Message, SchedDayKey, SchedProfessor } from '../types';
import { Storage } from '../utils/storage';
import {
  SCHED_DAY_LABELS,
  SCHED_DAYS_ORDER,
  SCHED_EMPLOYMENT_LABELS,
  SCHED_PRACTICAL_TYPE_LABELS,
  calculateOfferingBreakdown,
  calculateProfessorLoadSummary,
  exportJsonRowsToExcel,
  getProfessorAvailabilityWindowStatus,
  getSchedSlotTitle,
  printSchedHtml,
} from '../utils/schedulingUtils';
import { escapeHtml } from '../utils/sanitizeHtml';
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  KeyRound,
  Lock,
  Mail,
  Printer,
  Save,
  Sparkles,
  Unlock,
} from 'lucide-react';

interface ProfessorDashboardProps {
  professor: SchedProfessor;
  messages: Message[];
  cloudSyncTick?: number;
  onRefreshData: () => void;
  onOpenMessages: () => void;
  onOpenChangePassword: () => void;
}

export const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({
  professor,
  messages,
  cloudSyncTick = 0,
  onRefreshData,
  onOpenMessages,
  onOpenChangePassword,
}) => {
  const rules = useMemo(() => Storage.getSchedRules(), [cloudSyncTick]);
  const allOfferings = useMemo(() => Storage.getSchedOfferings(), [cloudSyncTick]);
  const [selectedTerm, setSelectedTerm] = useState<string>(rules.activeTerm || '4041');
  const [unavailDraft, setUnavailDraft] = useState<string[]>(professor.unavailableKeys || []);
  const [savedMsg, setSavedMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [nowTick, setNowTick] = useState<Date>(() => new Date());

  React.useEffect(() => {
    const timer = window.setInterval(() => setNowTick(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  React.useEffect(() => {
    setUnavailDraft(professor.unavailableKeys || []);
  }, [professor.unavailableKeys]);

  const availWindowStatus = useMemo(
    () => getProfessorAvailabilityWindowStatus(rules, nowTick),
    [rules, nowTick]
  );

  const activeDays = useMemo(
    () =>
      rules.activeDays.length > 0
        ? SCHED_DAYS_ORDER.filter((d) => rules.activeDays.includes(d))
        : (['saturday', 'sunday', 'monday', 'tuesday', 'wednesday'] as SchedDayKey[]),
    [rules.activeDays]
  );

  const sortedSlots = useMemo(
    () => [...rules.timeSlots].sort((a, b) => a.order - b.order),
    [rules.timeSlots]
  );

  const myOfferings = useMemo(
    () =>
      allOfferings.filter(
        (o) =>
          !o.isDisabled &&
          o.professorId === professor.id &&
          (selectedTerm === 'all' || o.termKey === selectedTerm)
      ),
    [allOfferings, professor.id, selectedTerm]
  );

  const loadSummary = useMemo(
    () => calculateProfessorLoadSummary(professor.id, myOfferings, rules),
    [professor.id, myOfferings, rules]
  );

  const unreadMessagesCount = useMemo(
    () =>
      messages.filter(
        (m) =>
          !m.isConfidential &&
          (m.senderId === professor.id ||
            m.receiverId === professor.id ||
            m.receiverType === 'professor') &&
          m.status !== 'answered'
      ).length,
    [messages, professor.id]
  );

  const totalGridSlotCount = activeDays.length * sortedSlots.length;
  const blockedSlotCount = activeDays.reduce(
    (sum, d) =>
      sum + sortedSlots.filter((s) => unavailDraft.includes(`${d}:${s.id}`)).length,
    0
  );
  const availableSlotCount = Math.max(0, totalGridSlotCount - blockedSlotCount);

  const handleSaveUnavailable = () => {
    const freshRules = Storage.getSchedRules();
    const liveStatus = getProfessorAvailabilityWindowStatus(freshRules, new Date());
    if (!liveStatus.isOpen) {
      setNowTick(new Date());
      setSavedMsg({ type: 'error', text: liveStatus.message });
      window.setTimeout(() => setSavedMsg(null), 6000);
      return;
    }

    const allProfs = Storage.getSchedProfessors();
    const nowIso = new Date().toISOString();
    const updated = allProfs.map((p) =>
      p.id === professor.id
        ? {
            ...p,
            unavailableKeys: unavailDraft,
            availabilitySubmitted: true,
            availabilityUpdatedAt: nowIso,
          }
        : p
    );
    Storage.setSchedProfessors(updated);
    onRefreshData();
    setSavedMsg({
      type: 'success',
      text: 'ساعات حضور و عدم امکان حضور شما با موفقیت ثبت شد و برای مدیران گروه در برنامه‌ریزی ترم قابل مشاهده است.',
    });
    window.setTimeout(() => setSavedMsg(null), 5000);
  };

  const toggleDayAvailability = (day: SchedDayKey) => {
    if (!availWindowStatus.isOpen) return;
    const dayKeys = sortedSlots.map((s) => `${day}:${s.id}`);
    const allBlocked = dayKeys.every((k) => unavailDraft.includes(k));
    setUnavailDraft((prev) => {
      const next = new Set(prev);
      dayKeys.forEach((k) => {
        if (allBlocked) next.delete(k);
        else next.add(k);
      });
      return Array.from(next);
    });
  };

  const toggleSlotAvailabilityAcrossWeek = (slotId: string) => {
    if (!availWindowStatus.isOpen) return;
    const slotKeys = activeDays.map((d) => `${d}:${slotId}`);
    const allBlocked = slotKeys.every((k) => unavailDraft.includes(k));
    setUnavailDraft((prev) => {
      const next = new Set(prev);
      slotKeys.forEach((k) => {
        if (allBlocked) next.delete(k);
        else next.add(k);
      });
      return Array.from(next);
    });
  };

  const handlePrintSchedule = () => {
    const headerCells = sortedSlots
      .map(
        (s, idx) =>
          `<th>${escapeHtml(getSchedSlotTitle(s, idx))}<div class="muted mono">${escapeHtml(s.startTime)}-${escapeHtml(s.endTime)}</div></th>`
      )
      .join('');
    const bodyRows = activeDays
      .map((day) => {
        const cols = sortedSlots
          .map((slot) => {
            const matched = myOfferings.filter(
              (o) => o.dayOfWeek === day && o.slotIds.includes(slot.id)
            );
            if (matched.length === 0) return '<td style="text-align:center;color:#94a3b8;">—</td>';
            const cells = matched
              .map((o) => {
                const bd = calculateOfferingBreakdown(o, rules);
                return `<div class="cell-item">
                  <div><strong>${escapeHtml(o.courseTitle)}</strong> <span class="mono">(${escapeHtml(o.courseCode)})</span></div>
                  <div class="muted">${escapeHtml(o.ownerMajorName)} (${escapeHtml(o.entryTerm)}${o.sectionName ? ` - ${escapeHtml(o.sectionName)}` : ''})</div>
                  <div class="muted">کلاس: ${escapeHtml(o.classroomName || 'نامشخص')} | ${bd.weeklyHours} ساعت | ${bd.equivalentUnits} معادل</div>
                </div>`;
              })
              .join('');
            return `<td>${cells}</td>`;
          })
          .join('');
        return `<tr><th>${escapeHtml(SCHED_DAY_LABELS[day])}</th>${cols}</tr>`;
      })
      .join('');

    const html = `
      <div style="margin-bottom:10px;font-size:11px;">
        <strong>استاد:</strong> ${escapeHtml(professor.fullName)} (کد استاد: <span class="mono">${escapeHtml(professor.professorCode)}</span>) ·
        <strong>وضعیت:</strong> ${escapeHtml(SCHED_EMPLOYMENT_LABELS[professor.employmentType])} ·
        <strong>جمع ساعت هفتگی:</strong> ${loadSummary.weeklyHours} ساعت ·
        <strong>جمع واحد معادل:</strong> ${loadSummary.equivalentUnits}
      </div>
      <table><thead><tr><th>روز هفته / سانس</th>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>
    `;
    printSchedHtml(`برنامه هفتگی استاد ${professor.fullName} (ترم ${selectedTerm})`, html);
  };

  const handleExportExcel = () => {
    const rows = myOfferings.map((o) => {
      const bd = calculateOfferingBreakdown(o, rules);
      return {
        'کد استاد': professor.professorCode,
        'نام استاد': professor.fullName,
        'کد درس': o.courseCode,
        'عنوان درس': o.courseTitle,
        'رشته و ورودی': `${o.ownerMajorName} (${o.entryTerm}${o.sectionName ? ` - ${o.sectionName}` : ''})`,
        'کلاس فیزیکی': o.classroomName || '-',
        'روز هفته': o.dayOfWeek ? SCHED_DAY_LABELS[o.dayOfWeek] : 'تعیین‌نشده',
        'سانس‌ها': o.slotIds
          .map((id) => {
            const idx = sortedSlots.findIndex((s) => s.id === id);
            const sl = idx >= 0 ? sortedSlots[idx] : undefined;
            return sl ? `${getSchedSlotTitle(sl, idx)} (${sl.startTime}-${sl.endTime})` : id;
          })
          .join(' + '),
        'تعداد دانشجو': o.enrolledCount,
        'واحد کل': bd.rawUnits,
        'ساعات تدریس هفتگی': bd.weeklyHours,
        'واحد معادل': bd.equivalentUnits,
      };
    });
    void exportJsonRowsToExcel(rows, 'برنامه تدریس', `برنامه_استاد_${professor.professorCode}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* سربرگ پروفایل استاد */}
      <div className="rounded-3xl bg-gradient-to-l from-slate-900 via-teal-950 to-slate-900 text-white p-5 sm:p-6 shadow-xl border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-xs text-teal-300 font-bold">
              پورتال اختصاصی اساتید دانشگاه فرهنگیان · کد استاد:{' '}
              <span className="font-mono">{professor.professorCode}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black">{professor.fullName}</h1>
            <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
              <span>{professor.academicRank || SCHED_EMPLOYMENT_LABELS[professor.employmentType]}</span>
              {(professor.degreeLevel || professor.degreeField || professor.degreeFull) && (
                <>
                  <span>·</span>
                  <span>
                    {professor.degreeLevel || professor.degreeField
                      ? [professor.degreeLevel, professor.degreeField, professor.degreeSpecialization ? `گرایش ${professor.degreeSpecialization}` : '']
                          .filter(Boolean)
                          .join(' — ')
                      : professor.degreeFull}
                  </span>
                </>
              )}
              {professor.departmentName && (
                <>
                  <span>·</span>
                  <span>گروه: {professor.departmentName}</span>
                </>
              )}
              {professor.bankAccount && (
                <>
                  <span>·</span>
                  <span className="font-mono" dir="ltr">
                    {professor.bankName ? `${professor.bankName} — ` : 'حساب: '}
                    {professor.bankAccount}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white cursor-pointer"
            >
              {rules.availableTerms.map((t) => (
                <option key={t} value={t} className="bg-slate-900 text-white">
                  ترم {t}
                </option>
              ))}
              <option value="all" className="bg-slate-900 text-white">
                همه ترم‌ها
              </option>
            </select>

            <button
              type="button"
              onClick={onOpenMessages}
              className="px-3.5 py-2 rounded-xl bg-white text-slate-900 hover:bg-teal-50 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-4 h-4 text-teal-700" />
              <span>
                ارتباط با مدیران گروه، آموزش و معاونت آموزشی
                {unreadMessagesCount > 0 ? ` (${unreadMessagesCount})` : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenChangePassword}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>تغییر رمز عبور</span>
            </button>
          </div>
        </div>
      </div>

      {/* آمار کلیدی استاد */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 tabular-nums">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-xs text-slate-500">تعداد دروس تخصیصی</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {loadSummary.offeringCount} درس
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-xs text-slate-500">ساعات تدریس هفتگی</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {loadSummary.weeklyHours} ساعت
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-xs text-slate-500">مجموع واحد خام</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {loadSummary.rawUnits} واحد
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-xs text-slate-500">مجموع واحد معادل</div>
          <div className="text-2xl font-black text-teal-700 dark:text-teal-400 mt-1">
            {loadSummary.equivalentUnits} معادل
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-xs text-slate-500">روزهای حضور در دانشگاه</div>
          <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400 mt-1">
            {loadSummary.activeDays.length} روز
          </div>
        </div>
      </div>

      {/* جدول هفتگی استاد: سطر افقی = روزهای هفته، ستون عمودی = سانس‌ها */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-teal-600" />
              <span>جدول برنامه هفتگی تدریس شما</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ردیف‌های افقی نمایشگر روزهای هفته و ستون‌های عمودی نمایشگر سانس‌های زمانی هستند
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintSchedule}
              className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ برنامه A4</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>خروجی اکسل</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs border-collapse min-w-[740px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <th className="p-2.5 text-right font-extrabold w-28 border-l border-slate-200 dark:border-slate-700">
                  روز هفته / سانس
                </th>
                {sortedSlots.map((slot, idx) => (
                  <th
                    key={slot.id}
                    className="p-2 text-center font-bold border-l border-slate-200 dark:border-slate-700 last:border-l-0"
                  >
                    <div>{getSchedSlotTitle(slot, idx)}</div>
                    <div className="text-[10px] font-mono text-slate-500" dir="ltr">
                      {slot.startTime} - {slot.endTime}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {activeDays.map((day) => (
                <tr key={day}>
                  <td className="p-2.5 font-extrabold bg-slate-50/70 dark:bg-slate-800/40 border-l border-slate-200 dark:border-slate-700">
                    {SCHED_DAY_LABELS[day]}
                  </td>
                  {sortedSlots.map((slot) => {
                    const items = myOfferings.filter(
                      (o) => o.dayOfWeek === day && o.slotIds.includes(slot.id)
                    );
                    return (
                      <td
                        key={slot.id}
                        className="p-1.5 align-top border-l border-slate-200 dark:border-slate-700 last:border-l-0 min-w-[140px]"
                      >
                        {items.length === 0 ? (
                          <div className="h-10 flex items-center justify-center text-slate-300 dark:text-slate-700">
                            —
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {items.map((o) => {
                              const bd = calculateOfferingBreakdown(o, rules);
                              return (
                                <div
                                  key={o.id}
                                  className="p-2 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/25 space-y-0.5"
                                >
                                  <div className="font-bold text-slate-900 dark:text-white">
                                    {o.courseTitle}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-500">
                                    کد {o.courseCode} · {bd.weeklyHours} ساعت
                                  </div>
                                  <div className="text-[10px] text-slate-700 dark:text-slate-300">
                                    {o.ownerMajorName} ({o.entryTerm}
                                    {o.sectionName ? ` - ${o.sectionName}` : ''})
                                  </div>
                                  {o.sharedWithTargets && o.sharedWithTargets.length > 0 && (
                                    <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                                      مشترک با:{' '}
                                      {o.sharedWithTargets
                                        .map((t) => `${t.majorName} (${t.entryTerm})`)
                                        .join('، ')}
                                    </div>
                                  )}
                                  <div className="text-[10px] font-bold text-teal-700 dark:text-teal-400">
                                    مکان: {o.classroomName || 'تعیین‌نشده'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* جدول تفکیکی محاسبه ساعات و واحد معادل هر درس */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-teal-600" />
          <span>ریز محاسبه ساعات تدریس و واحد معادل دروس</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-right">
                <th className="p-2.5">کد درس</th>
                <th className="p-2.5">عنوان درس</th>
                <th className="p-2.5">رشته / ورودی</th>
                <th className="p-2.5 text-center">تعداد دانشجو</th>
                <th className="p-2.5 text-center">واحد (نظری + عملی)</th>
                <th className="p-2.5 text-center">ساعات هفتگی</th>
                <th className="p-2.5 text-center">واحد معادل محاسبه‌شده</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
              {myOfferings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    هنوز درسی در این ترم برای شما ثبت نشده است.
                  </td>
                </tr>
              ) : (
                myOfferings.map((o) => {
                  const bd = calculateOfferingBreakdown(o, rules);
                  return (
                    <tr key={o.id}>
                      <td className="p-2.5 font-mono font-bold">{o.courseCode}</td>
                      <td className="p-2.5 font-bold">
                        {o.courseTitle}
                        {bd.activePracticalUnits > 0 && (
                          <span className="block text-[10px] font-normal text-slate-500">
                            نوع عملی: {SCHED_PRACTICAL_TYPE_LABELS[o.practicalType]}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5">
                        {o.ownerMajorName} ({o.entryTerm}
                        {o.sectionName ? ` - ${o.sectionName}` : ''})
                      </td>
                      <td className="p-2.5 text-center font-mono">{o.enrolledCount} نفر</td>
                      <td className="p-2.5 text-center">
                        {bd.rawUnits} ({bd.activeTheoryUnits}+{bd.activePracticalUnits})
                      </td>
                      <td className="p-2.5 text-center font-bold">{bd.weeklyHours} ساعت</td>
                      <td className="p-2.5 text-center font-black text-teal-700 dark:text-teal-400">
                        {bd.equivalentUnits}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ثبت و ویرایش زمان‌های حضور و عدم امکان حضور استاد در بازه تعیین‌شده توسط مدیر سامانه */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>اعلام روزها، ساعت‌ها و سانس‌های حضور و عدم امکان حضور</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              در بازه زمانی اعلام‌شده توسط مدیر سامانه می‌توانید سانس‌های آزاد (امکان حضور) و عدم امکان تدریس خود را ثبت کنید. برای اساتیدی که ثبت انجام ندهند، به‌صورت پیش‌فرض <strong>تمام سانس‌ها آزاد</strong> در نظر گرفته می‌شود.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span
              className={`px-2.5 py-1 rounded-xl text-[11px] font-black border inline-flex items-center gap-1 ${
                professor.availabilitySubmitted
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              {professor.availabilitySubmitted ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>وضعیت: ثبت‌شده توسط شما</span>
                </>
              ) : (
                <span>پیش‌فرض: همه سانس‌ها آزاد</span>
              )}
            </span>
            <button
              type="button"
              disabled={!availWindowStatus.isOpen}
              onClick={handleSaveUnavailable}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition"
            >
              {availWindowStatus.isOpen ? <Save className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{availWindowStatus.isOpen ? 'ثبت و ذخیره ساعات حضور' : 'بازه ثبت بسته است'}</span>
            </button>
          </div>
        </div>

        {/* وضعیت زنده بازه زمانی */}
        <div
          className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
            availWindowStatus.isOpen
              ? 'bg-emerald-50/85 dark:bg-emerald-950/35 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : availWindowStatus.status === 'not_started'
              ? 'bg-amber-50/85 dark:bg-amber-950/35 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : 'bg-rose-50/85 dark:bg-rose-950/35 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-start gap-2">
            {availWindowStatus.isOpen ? (
              <Unlock className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <Lock className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-black">{availWindowStatus.message}</div>
              {(availWindowStatus.startsAtLabel || availWindowStatus.endsAtLabel) && (
                <div className="text-[11px] opacity-85">
                  {availWindowStatus.startsAtLabel ? `شروع: ${availWindowStatus.startsAtLabel}` : ''}
                  {availWindowStatus.startsAtLabel && availWindowStatus.endsAtLabel ? ' · ' : ''}
                  {availWindowStatus.endsAtLabel ? `پایان: ${availWindowStatus.endsAtLabel}` : ''}
                </div>
              )}
              {rules.professorAvailabilityWindow?.note && (
                <div className="text-[11px] font-bold">
                  یادداشت مدیر سامانه: {rules.professorAvailabilityWindow.note}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold shrink-0 tabular-nums">
            <span className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-current/20">
              آزاد: {availableSlotCount.toLocaleString('fa-IR')} سانس
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-current/20">
              عدم امکان: {blockedSlotCount.toLocaleString('fa-IR')} سانس
            </span>
          </div>
        </div>

        {savedMsg && (
          <div
            className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              savedMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            {savedMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{savedMsg.text}</span>
          </div>
        )}

        {availWindowStatus.isOpen && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="text-slate-500">
              روی هر سلول کلیک کنید تا بین «آزاد (امکان حضور)» و «عدم امکان» جابجا شود. با کلیک روی نام روز یا عنوان سانس، کل آن سطر/ستون تغییر می‌کند.
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setUnavailDraft([])}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>کل هفته آزاد (پیش‌فرض کامل)</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setUnavailDraft(
                    activeDays.flatMap((d) => sortedSlots.map((s) => `${d}:${s.id}`))
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800 font-bold cursor-pointer"
              >
                انتخاب کل هفته به عنوان عدم امکان
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="p-2 text-right border border-slate-200 dark:border-slate-700">
                  روز هفته
                </th>
                {sortedSlots.map((s, idx) => (
                  <th
                    key={s.id}
                    className="p-2 text-center border border-slate-200 dark:border-slate-700"
                  >
                    <button
                      type="button"
                      disabled={!availWindowStatus.isOpen}
                      onClick={() => toggleSlotAvailabilityAcrossWeek(s.id)}
                      title={
                        availWindowStatus.isOpen
                          ? 'تغییر یکجای این سانس در کل هفته'
                          : 'بازه ثبت بسته است'
                      }
                      className={`w-full ${
                        availWindowStatus.isOpen
                          ? 'cursor-pointer hover:text-teal-700 dark:hover:text-teal-300'
                          : 'cursor-default'
                      }`}
                    >
                      <div className="font-bold">{getSchedSlotTitle(s, idx)}</div>
                      <div className="font-mono text-[10px] text-slate-500" dir="ltr">
                        {s.startTime}-{s.endTime}
                      </div>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeDays.map((day) => (
                <tr key={day}>
                  <td className="p-2 font-bold border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      disabled={!availWindowStatus.isOpen}
                      onClick={() => toggleDayAvailability(day)}
                      title={
                        availWindowStatus.isOpen
                          ? 'تغییر یکجای کل سانس‌های این روز'
                          : 'بازه ثبت بسته است'
                      }
                      className={`w-full text-right ${
                        availWindowStatus.isOpen
                          ? 'cursor-pointer hover:text-teal-700 dark:hover:text-teal-300'
                          : 'cursor-default'
                      }`}
                    >
                      {SCHED_DAY_LABELS[day]}
                    </button>
                  </td>
                  {sortedSlots.map((slot) => {
                    const key = `${day}:${slot.id}`;
                    const blocked = unavailDraft.includes(key);
                    return (
                      <td
                        key={slot.id}
                        className="p-1.5 text-center border border-slate-200 dark:border-slate-700"
                      >
                        <button
                          type="button"
                          disabled={!availWindowStatus.isOpen}
                          onClick={() => {
                            if (!availWindowStatus.isOpen) return;
                            setUnavailDraft((prev) =>
                              blocked ? prev.filter((k) => k !== key) : [...prev, key]
                            );
                          }}
                          className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition ${
                            availWindowStatus.isOpen
                              ? 'cursor-pointer'
                              : 'cursor-not-allowed opacity-75'
                          } ${
                            blocked
                              ? 'bg-rose-600 text-white'
                              : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {blocked ? 'عدم امکان' : 'آزاد (حضور)'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
