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
  getSchedSlotTitle,
  printSchedHtml,
} from '../utils/schedulingUtils';
import { escapeHtml } from '../utils/sanitizeHtml';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  KeyRound,
  Mail,
  Printer,
  Save,
  UserCheck,
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
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setUnavailDraft(professor.unavailableKeys || []);
  }, [professor.unavailableKeys]);

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

  const handleSaveUnavailable = () => {
    const allProfs = Storage.getSchedProfessors();
    const updated = allProfs.map((p) =>
      p.id === professor.id ? { ...p, unavailableKeys: unavailDraft } : p
    );
    Storage.setSchedProfessors(updated);
    onRefreshData();
    setSavedMsg('زمان‌های عدم امکان حضور شما با موفقیت ثبت شد و برای مدیران گروه قابل مشاهده است.');
    window.setTimeout(() => setSavedMsg(null), 4000);
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

      {/* ثبت و ویرایش زمان‌های عدم امکان حضور استاد */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>اعلام زمان‌های عدم امکان حضور (جهت راهنمایی مدیران گروه در برنامه‌ریزی)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              سانس‌هایی که امکان تدریس ندارید را علامت زده و دکمه ذخیره را بزنید.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveUnavailable}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>ثبت محدودیت‌های زمانی</span>
          </button>
        </div>

        {savedMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{savedMsg}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="p-2 text-right border border-slate-200 dark:border-slate-700">
                  روز هفته
                </th>
                {sortedSlots.map((s) => (
                  <th key={s.id} className="p-2 text-center border border-slate-200 dark:border-slate-700">
                    <div>{s.label}</div>
                    <div className="font-mono text-[10px] text-slate-500" dir="ltr">
                      {s.startTime}-{s.endTime}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeDays.map((day) => (
                <tr key={day}>
                  <td className="p-2 font-bold border border-slate-200 dark:border-slate-700">
                    {SCHED_DAY_LABELS[day]}
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
                          onClick={() =>
                            setUnavailDraft((prev) =>
                              blocked ? prev.filter((k) => k !== key) : [...prev, key]
                            )
                          }
                          className={`w-full py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                            blocked
                              ? 'bg-rose-600 text-white'
                              : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {blocked ? 'عدم امکان' : 'آزاد'}
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
