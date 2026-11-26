import React, { useMemo, useState } from 'react';
import {
  SchedCourseOffering,
  SchedRulesSettings,
  SchedWorkspaceRole,
} from '../types';
import {
  buildTermExamConflictMap,
  checkScheduleEditLock,
  detectOfferingExamConflicts,
  exportJsonRowsToExcel,
  formatExamAssignmentShort,
  getExamSettingsForTerm,
  isCourseEligibleForExam,
  normalizePersianText,
  normalizeSchedCode,
  printSchedHtml,
} from '../utils/schedulingUtils';
import { escapeHtml } from '../utils/sanitizeHtml';
import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Download,
  Edit3,
  Layers,
  Lock,
  Plus,
  Printer,
  Search,
  Settings2,
  Trash2,
  X,
} from 'lucide-react';

interface CourseSchedulingCommonExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTerm: string;
  offerings: SchedCourseOffering[];
  termOfferings: SchedCourseOffering[];
  rules: SchedRulesSettings;
  userRole: SchedWorkspaceRole;
  actor: { id: string; name: string };
  canManageMasterData: boolean;
  isOwnMajorName: (majorName: string) => boolean;
  onCommitOfferings: (nextOfferings: SchedCourseOffering[], actionLabel: string) => void;
  onOpenEditOffering: (offering: SchedCourseOffering) => void;
  onOpenExamSettings?: () => void;
  onNotify: (type: 'success' | 'error', text: string) => void;
}

interface TheoreticalCourseGroup {
  courseCode: string;
  courseTitle: string;
  offerings: SchedCourseOffering[];
  editableOfferings: SchedCourseOffering[];
  majorNames: string[];
  assignedSlotsSummary: string[];
  hasUnassigned: boolean;
  hasAnyAssigned: boolean;
}

export const CourseSchedulingCommonExamModal: React.FC<
  CourseSchedulingCommonExamModalProps
> = ({
  isOpen,
  onClose,
  activeTerm,
  offerings,
  termOfferings,
  rules,
  userRole,
  actor,
  canManageMasterData,
  isOwnMajorName,
  onCommitOfferings,
  onOpenEditOffering,
  onOpenExamSettings,
  onNotify,
}) => {
  const [courseSearch, setCourseSearch] = useState('');
  const [courseFilterMode, setCourseFilterMode] = useState<
    'all' | 'unassigned' | 'multi_branch'
  >('all');
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>('');
  const [expandedCellCourseKey, setExpandedCellCourseKey] = useState<string | null>(null);
  const [quickAddCellKey, setQuickAddCellKey] = useState<string | null>(null);

  const examSettings = useMemo(
    () => getExamSettingsForTerm(rules, activeTerm),
    [rules, activeTerm]
  );

  const activeExamDays = useMemo(
    () => examSettings.examDays.filter((d) => d.isActive),
    [examSettings]
  );

  const sortedExamSlots = useMemo(
    () => [...examSettings.examSlots].sort((a, b) => a.order - b.order),
    [examSettings]
  );

  const theoreticalTermOfferings = useMemo(
    () => termOfferings.filter((o) => isCourseEligibleForExam(o)),
    [termOfferings]
  );

  const canModifyOffering = (o: SchedCourseOffering): boolean => {
    const lockRes = checkScheduleEditLock(rules, userRole, actor.id, {
      majorCode: o.ownerMajorCode,
      dayOfWeek: o.dayOfWeek,
      slotIds: o.slotIds,
    });
    if (lockRes.locked) return false;
    if (canManageMasterData || userRole === 'education_expert') return true;
    if (o.createdById === actor.id) return true;
    if (isOwnMajorName(o.ownerMajorName)) return true;
    if (o.sharedWithTargets?.some((t) => isOwnMajorName(t.majorName))) return true;
    return false;
  };

  // گروه‌بندی دروس نظری ترم بر اساس کد ۷ رقمی (برای ثبت یکجا روی تمام شعبه‌ها)
  const courseGroups = useMemo<TheoreticalCourseGroup[]>(() => {
    const map = new Map<string, SchedCourseOffering[]>();
    for (const o of theoreticalTermOfferings) {
      const code = normalizeSchedCode(o.courseCode) || o.courseTitle;
      const list = map.get(code);
      if (list) list.push(o);
      else map.set(code, [o]);
    }

    return Array.from(map.entries())
      .map(([courseCode, list]) => {
        const majorSet = new Set<string>();
        const slotSummarySet = new Set<string>();
        let hasUnassigned = false;
        let hasAnyAssigned = false;

        list.forEach((o) => {
          majorSet.add(o.ownerMajorName);
          o.sharedWithTargets?.forEach((t) => majorSet.add(t.majorName));
          if (o.examDayId && o.examSlotId) {
            hasAnyAssigned = true;
            slotSummarySet.add(formatExamAssignmentShort(o, examSettings));
          } else {
            hasUnassigned = true;
          }
        });

        return {
          courseCode,
          courseTitle: list[0]?.courseTitle || courseCode,
          offerings: list,
          editableOfferings: list.filter((o) => canModifyOffering(o)),
          majorNames: Array.from(majorSet),
          assignedSlotsSummary: Array.from(slotSummarySet),
          hasUnassigned,
          hasAnyAssigned,
        };
      })
      .sort((a, b) => {
        if (b.offerings.length !== a.offerings.length) {
          return b.offerings.length - a.offerings.length;
        }
        return a.courseTitle.localeCompare(b.courseTitle, 'fa');
      });
  }, [theoreticalTermOfferings, examSettings, rules, userRole, actor.id, canManageMasterData]);

  const filteredGroups = useMemo(() => {
    const q = normalizePersianText(courseSearch).toLowerCase();
    return courseGroups.filter((g) => {
      if (courseFilterMode === 'unassigned' && !g.hasUnassigned) return false;
      if (courseFilterMode === 'multi_branch' && g.offerings.length < 2) return false;
      if (!q) return true;
      const text = normalizePersianText(
        `${g.courseTitle} ${g.courseCode} ${g.majorNames.join(' ')}`
      ).toLowerCase();
      return text.includes(q);
    });
  }, [courseGroups, courseSearch, courseFilterMode]);

  const selectedGroup = useMemo(
    () => courseGroups.find((g) => g.courseCode === selectedCourseCode) || null,
    [courseGroups, selectedCourseCode]
  );

  // نقشه هشدارهای تداخل امتحان کل ترم بر اساس ردیف (رشته/ورودی/شعبه)
  const examConflictMap = useMemo(
    () => buildTermExamConflictMap(termOfferings, rules),
    [termOfferings, rules]
  );

  const uniqueExamConflictWarnings = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    examConflictMap.forEach((warns) => {
      warns.forEach((w) => {
        if (!seen.has(w)) {
          seen.add(w);
          list.push(w);
        }
      });
    });
    return list;
  }, [examConflictMap]);

  if (!isOpen) return null;

  const assignCourseGroupToExamCell = (
    courseCode: string,
    examDayId: string,
    examSlotId: string
  ) => {
    const grp = courseGroups.find((g) => g.courseCode === courseCode);
    if (!grp) return;

    const globalLock = checkScheduleEditLock(rules, userRole, actor.id);
    if (globalLock.locked) {
      onNotify('error', globalLock.reason || 'امکان تغییر برنامه در حال حاضر مسدود است.');
      return;
    }

    const targets = grp.editableOfferings;
    if (targets.length === 0) {
      onNotify(
        'error',
        `هیچ‌یک از شعبه‌های درس «${grp.courseTitle}» مجوز ویرایش برای حساب کاربری شما ندارند یا رشته آن‌ها قفل شده است.`
      );
      return;
    }

    const skippedCount = grp.offerings.length - targets.length;
    const targetIds = new Set(targets.map((t) => t.id));
    const nowIso = new Date().toISOString();

    const nextOfferings = offerings.map((o) =>
      targetIds.has(o.id)
        ? {
            ...o,
            examDayId,
            examSlotId,
            updatedById: actor.id,
            updatedByName: actor.name,
            updatedAt: nowIso,
          }
        : o
    );

    const dayObj = examSettings.examDays.find((d) => d.id === examDayId);
    const slotObj = examSettings.examSlots.find((s) => s.id === examSlotId);
    const cellLabel = `${dayObj?.label || examDayId} - ${slotObj?.label || examSlotId}`;

    onCommitOfferings(
      nextOfferings,
      `تنظیم امتحان مشترک «${grp.courseTitle}» در ${cellLabel}`
    );

    // بررسی اخطار تداخل امتحانات در ردیف‌ها (فقط هشدار و پیام اطلاع‌رسانی)
    const nextTermSlice = nextOfferings.filter((o) => o.termKey === activeTerm);
    const newWarnings: string[] = [];
    for (const t of targets) {
      const updatedItem = nextTermSlice.find((x) => x.id === t.id);
      if (updatedItem) {
        newWarnings.push(...detectOfferingExamConflicts(updatedItem, nextTermSlice, rules));
      }
    }

    const baseMsg = `امتحان ${targets.length.toLocaleString('fa-IR')} شعبه/ارائه درس «${grp.courseTitle} (${grp.courseCode})» در ${cellLabel} ثبت شد.${
      skippedCount > 0
        ? ` (${skippedCount.toLocaleString('fa-IR')} شعبه به دلیل محدودیت/قفل تغییر داده نشد.)`
        : ''
    }`;

    if (newWarnings.length > 0) {
      onNotify(
        'success',
        `${baseMsg} ⚠️ هشدار تداخل امتحان با ${newWarnings.length.toLocaleString('fa-IR')} مورد در ردیف رشته‌ها شناسایی شد (در جدول علامت‌گذاری گردید).`
      );
    } else {
      onNotify('success', baseMsg);
    }
    setQuickAddCellKey(null);
  };

  const clearCourseGroupExamFromCell = (
    courseCode: string,
    examDayId: string,
    examSlotId: string
  ) => {
    const grp = courseGroups.find((g) => g.courseCode === courseCode);
    if (!grp) return;
    const targets = grp.editableOfferings.filter(
      (o) => o.examDayId === examDayId && o.examSlotId === examSlotId
    );
    if (targets.length === 0) {
      onNotify('error', 'مجوز حذف زمان امتحان این درس برای شما فعال نیست.');
      return;
    }
    const targetIds = new Set(targets.map((t) => t.id));
    const nowIso = new Date().toISOString();
    const nextOfferings = offerings.map((o) =>
      targetIds.has(o.id)
        ? {
            ...o,
            examDayId: undefined,
            examSlotId: undefined,
            updatedById: actor.id,
            updatedByName: actor.name,
            updatedAt: nowIso,
          }
        : o
    );
    onCommitOfferings(nextOfferings, `حذف زمان امتحان «${grp.courseTitle}»`);
    onNotify('success', `زمان امتحان «${grp.courseTitle}» برای ${targets.length.toLocaleString('fa-IR')} ارائه حذف شد.`);
  };

  const handlePrintExams = () => {
    const rowsHtml = activeExamDays
      .map((day) => {
        const slotCells = sortedExamSlots
          .map((slot) => {
            const items = theoreticalTermOfferings.filter(
              (o) => o.examDayId === day.id && o.examSlotId === slot.id
            );
            if (items.length === 0) return '<td></td>';
            const grouped = new Map<string, SchedCourseOffering[]>();
            items.forEach((o) => {
              const list = grouped.get(o.courseCode) || [];
              list.push(o);
              grouped.set(o.courseCode, list);
            });
            const cellBody = Array.from(grouped.entries())
              .map(([code, list]) => {
                const majorsText = list
                  .map(
                    (x) =>
                      `${x.ownerMajorName} (${x.entryTerm}${x.sectionName ? `-${x.sectionName}` : ''})`
                  )
                  .join('، ');
                return `<div class="cell-item"><strong>${escapeHtml(list[0].courseTitle)} (${escapeHtml(code)})</strong><div class="muted">${escapeHtml(majorsText)}</div></div>`;
              })
              .join('');
            return `<td>${cellBody}</td>`;
          })
          .join('');
        return `<tr><td style="font-weight:800;text-align:center;">${escapeHtml(day.label)}<div class="muted">${escapeHtml(day.weekdayLabel)} ${escapeHtml(day.date)}</div></td>${slotCells}</tr>`;
      })
      .join('');

    const html = `
      <table>
        <thead>
          <tr>
            <th>روز / تاریخ امتحان</th>
            ${sortedExamSlots
              .map(
                (s) =>
                  `<th>${escapeHtml(s.label)}<div class="muted mono">${escapeHtml(s.startTime)} - ${escapeHtml(s.endTime)}</div></th>`
              )
              .join('')}
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;
    printSchedHtml(`برنامه جامع امتحانات پایان ترم ${activeTerm}`, html);
  };

  const handleExportExamExcel = () => {
    const rows = theoreticalTermOfferings.map((o) => {
      const day = examSettings.examDays.find((d) => d.id === o.examDayId);
      const slot = examSettings.examSlots.find((s) => s.id === o.examSlotId);
      return {
        'کد درس ۷ رقمی': o.courseCode,
        'عنوان درس': o.courseTitle,
        'رشته': o.ownerMajorName,
        'ورودی': o.entryTerm,
        'شعبه': o.sectionName || 'کل ورودی',
        'استاد': o.professorName || '---',
        'روز امتحان': day ? day.label : 'تعیین نشده',
        'تاریخ امتحان': day?.date || '---',
        'روز هفته': day?.weekdayLabel || '---',
        'سانس امتحان': slot ? `${slot.label} (${slot.startTime}-${slot.endTime})` : '---',
        'وضعیت تداخل ردیف': (examConflictMap.get(o.id) || []).join(' | ') || 'بدون تداخل',
      };
    });
    void exportJsonRowsToExcel(
      rows,
      'برنامه امتحانات',
      `برنامه_امتحانات_ترم_${activeTerm}.xlsx`
    );
  };

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/65 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[1440px] h-[92vh] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* هدر مودال امتحانات مشترک و عمومی */}
        <div className="shrink-0 px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black">
                برنامه‌ریزی متمرکز امتحانات پایان ترم (دروس عمومی، مشترک و نظری) · ترم {activeTerm}
              </h2>
              <p className="text-[11px] text-slate-300 mt-0.5">
                بازه امتحانی: {activeExamDays.length.toLocaleString('fa-IR')} روز
                {activeExamDays[0]?.date
                  ? ` (از ${activeExamDays[0].weekdayLabel} ${activeExamDays[0].date} تا ${
                      activeExamDays[activeExamDays.length - 1]?.date || ''
                    })`
                  : ''}{' '}
                · {sortedExamSlots.length.toLocaleString('fa-IR')} سانس در روز · صرفاً دروس نظری دارای امتحان هستند
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {userRole === 'admin' && onOpenExamSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenExamSettings();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5 text-teal-300" />
                <span>تنظیم تاریخ و سانس امتحانات</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrintExams}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ برنامه امتحانات</span>
            </button>
            <button
              type="button"
              onClick={handleExportExamExcel}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>اکسل امتحانات</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              title="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* نوار وضعیت و اخطارهای تداخل امتحان (غیرمسدودکننده) */}
        <div className="shrink-0 px-4 sm:px-6 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold">
              دروس نظری ترم: {theoreticalTermOfferings.length.toLocaleString('fa-IR')} ارائه (
              {courseGroups.length.toLocaleString('fa-IR')} عنوان درس)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold">
              امتحان ثبت‌شده:{' '}
              {theoreticalTermOfferings
                .filter((o) => o.examDayId && o.examSlotId)
                .length.toLocaleString('fa-IR')}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 font-bold">
              بدون تاریخ امتحان:{' '}
              {theoreticalTermOfferings
                .filter((o) => !o.examDayId || !o.examSlotId)
                .length.toLocaleString('fa-IR')}
            </span>
          </div>

          {uniqueExamConflictWarnings.length > 0 ? (
            <div className="px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-extrabold inline-flex items-center gap-1.5 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                اخطار: {uniqueExamConflictWarnings.length.toLocaleString('fa-IR')} مورد تداخل امتحان همزمان در سطر رشته‌ها شناسایی شد (صرفاً هشدار)
              </span>
            </div>
          ) : (
            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>هیچ تداخل امتحانی در سطر رشته‌ها وجود ندارد</span>
            </div>
          )}
        </div>

        {/* بدنه دوسطحی: ستون راست (انتخاب درس) + ماتریس روز و سانس امتحانات */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* پنل راست: فهرست دروس نظری جدول برنامه */}
          <aside className="lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col max-h-[38vh] lg:max-h-none">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
              <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>۱. انتخاب درس نظری برای چیدمان امتحان</span>
              </div>
              <p className="text-[10.5px] text-slate-500 leading-relaxed">
                با انتخاب هر درس و کلیک روی سانس امتحانی، امتحان <strong>تمام شعبه‌ها و رشته‌های دارای این کد درس</strong> یکجا ثبت می‌شود (دروس عملی و نظری-عملی در این لیست نمی‌آیند).
              </p>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2" />
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="جستجوی نام درس یا کد ۷ رقمی..."
                  className="w-full pr-8 pl-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex gap-1">
                {[
                  { key: 'all', label: 'همه' },
                  { key: 'unassigned', label: 'بدون امتحان' },
                  { key: 'multi_branch', label: 'مشترک / چندشعبه‌ای' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() =>
                      setCourseFilterMode(tab.key as 'all' | 'unassigned' | 'multi_branch')
                    }
                    className={`flex-1 py-1 px-1.5 rounded-lg text-[10.5px] font-bold cursor-pointer transition ${
                      courseFilterMode === tab.key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
              {filteredGroups.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-[11px]">
                  درس نظری منطبقی در برنامه ترم {activeTerm} یافت نشد.
                </div>
              ) : (
                filteredGroups.map((g) => {
                  const selected = selectedCourseCode === g.courseCode;
                  return (
                    <button
                      key={g.courseCode}
                      type="button"
                      onClick={() =>
                        setSelectedCourseCode(selected ? '' : g.courseCode)
                      }
                      className={`w-full text-right p-2.5 rounded-xl border transition cursor-pointer space-y-1 ${
                        selected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : g.hasUnassigned
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                          : 'bg-emerald-50/60 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="font-black text-[11.5px] leading-snug">
                          {g.courseTitle}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] shrink-0 ${
                            selected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {g.courseCode}
                        </span>
                      </div>
                      <div
                        className={`text-[10px] flex flex-wrap items-center gap-1.5 ${
                          selected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <span className="font-bold inline-flex items-center gap-0.5">
                          <Layers className="w-3 h-3" />
                          {g.offerings.length.toLocaleString('fa-IR')} شعبه/ارائه
                        </span>
                        <span>·</span>
                        <span className="truncate">{g.majorNames.join('، ')}</span>
                      </div>
                      {g.assignedSlotsSummary.length > 0 && (
                        <div
                          className={`text-[9.5px] font-bold ${
                            selected ? 'text-amber-200' : 'text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {g.assignedSlotsSummary.join(' | ')}
                        </div>
                      )}
                      {g.editableOfferings.length === 0 && (
                        <div className="text-[9.5px] font-bold text-rose-500 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>فقط مشاهده (شعب این درس خارج از محدوده مجاز شماست)</span>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* ماتریس روزها × سانس‌های امتحانی */}
          <div className="flex-1 overflow-auto p-3 sm:p-4 space-y-3 bg-slate-50/70 dark:bg-slate-950/50">
            {selectedGroup && (
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-300 dark:border-indigo-700 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-black text-indigo-950 dark:text-indigo-100">
                    درس انتخاب‌شده: {selectedGroup.courseTitle} (کد{' '}
                    <span className="font-mono">{selectedGroup.courseCode}</span>) —{' '}
                    {selectedGroup.editableOfferings.length.toLocaleString('fa-IR')} از{' '}
                    {selectedGroup.offerings.length.toLocaleString('fa-IR')} شعبه قابل ثبت
                  </div>
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-300">
                    اکنون روی دکمه «ثبت یکجا در این سانس» در جدول زیر کلیک کنید تا امتحان همه شعبه‌ها همزمان ثبت شود.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCourseCode('')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold cursor-pointer"
                >
                  لغو انتخاب
                </button>
              </div>
            )}

            {uniqueExamConflictWarnings.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/35 border border-amber-300 dark:border-amber-800 space-y-1">
                <div className="font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>اخطارهای تداخل امتحان در سطر رشته‌ها و شعبه‌ها (صرفاً جهت اطلاع و تصمیم‌گیری):</span>
                </div>
                <ul className="list-disc pr-5 space-y-0.5 text-[11px] text-amber-900 dark:text-amber-200">
                  {uniqueExamConflictWarnings.slice(0, 8).map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                  {uniqueExamConflictWarnings.length > 8 && (
                    <li className="font-bold">
                      و {(uniqueExamConflictWarnings.length - 8).toLocaleString('fa-IR')} مورد اخطار دیگر...
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-auto shadow-xs">
              <table className="w-full border-collapse text-xs min-w-[780px]">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <th className="sticky right-0 z-20 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 text-center font-black w-44">
                      روز / تاریخ امتحان
                    </th>
                    {sortedExamSlots.map((slot) => (
                      <th
                        key={slot.id}
                        className="border border-slate-300 dark:border-slate-700 p-2.5 text-center font-black min-w-[220px]"
                      >
                        <div>{slot.label}</div>
                        <div className="text-[10.5px] font-mono text-slate-500 mt-0.5" dir="ltr">
                          {slot.startTime} - {slot.endTime}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeExamDays.map((day) => (
                    <tr key={day.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="sticky right-0 z-10 bg-slate-100/95 dark:bg-slate-800/95 border border-slate-300 dark:border-slate-700 p-2.5 text-center align-middle">
                        <div className="font-black text-slate-900 dark:text-white text-[12.5px]">
                          {day.label}
                        </div>
                        <div className="text-[10.5px] font-bold text-indigo-700 dark:text-indigo-300">
                          {day.weekdayLabel}
                        </div>
                        {day.date && (
                          <div className="text-[10.5px] font-mono text-slate-500 dark:text-slate-400">
                            {day.date}
                          </div>
                        )}
                      </td>

                      {sortedExamSlots.map((slot) => {
                        const cellKey = `${day.id}::${slot.id}`;
                        const itemsHere = theoreticalTermOfferings.filter(
                          (o) => o.examDayId === day.id && o.examSlotId === slot.id
                        );
                        // گروه‌بندی دروس ثبت‌شده در این سانس امتحانی
                        const groupedMap = new Map<string, SchedCourseOffering[]>();
                        itemsHere.forEach((o) => {
                          const code = normalizeSchedCode(o.courseCode) || o.courseTitle;
                          const arr = groupedMap.get(code) || [];
                          arr.push(o);
                          groupedMap.set(code, arr);
                        });
                        const groupedEntries = Array.from(groupedMap.entries());

                        return (
                          <td
                            key={cellKey}
                            className="border border-slate-300 dark:border-slate-700 p-2 align-top space-y-1.5"
                          >
                            {selectedGroup && (
                              <button
                                type="button"
                                onClick={() =>
                                  assignCourseGroupToExamCell(
                                    selectedGroup.courseCode,
                                    day.id,
                                    slot.id
                                  )
                                }
                                className="w-full py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10.5px] font-extrabold inline-flex items-center justify-center gap-1 cursor-pointer shadow-xs transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>
                                  ثبت یکجای «{selectedGroup.courseTitle}» (
                                  {selectedGroup.editableOfferings.length.toLocaleString('fa-IR')}{' '}
                                  شعبه)
                                </span>
                              </button>
                            )}

                            {groupedEntries.map(([code, list]) => {
                              const expandKey = `${cellKey}::${code}`;
                              const isExpanded = expandedCellCourseKey === expandKey;
                              const conflictMsgs = list.flatMap(
                                (x) => examConflictMap.get(x.id) || []
                              );
                              const hasConflict = conflictMsgs.length > 0;
                              const hasEditable = list.some((x) => canModifyOffering(x));

                              return (
                                <div
                                  key={expandKey}
                                  className={`p-2 rounded-xl border text-[11px] space-y-1 ${
                                    hasConflict
                                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700'
                                      : 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedCellCourseKey(isExpanded ? null : expandKey)
                                      }
                                      className="text-right font-black text-slate-900 dark:text-white hover:text-indigo-700 cursor-pointer flex-1"
                                    >
                                      {list[0].courseTitle}{' '}
                                      <span className="font-mono text-[9.5px] text-slate-500">
                                        ({code})
                                      </span>
                                    </button>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <span className="px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-800 text-[9.5px] font-bold">
                                        {list.length.toLocaleString('fa-IR')} شعبه
                                      </span>
                                      {hasEditable && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            clearCourseGroupExamFromCell(code, day.id, slot.id)
                                          }
                                          className="p-0.5 text-rose-600 hover:bg-rose-100 rounded cursor-pointer"
                                          title="حذف امتحان کل این درس از این سانس"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {hasConflict && (
                                    <div
                                      className="text-[9.5px] font-extrabold text-amber-800 dark:text-amber-200 flex items-center gap-1"
                                      title={conflictMsgs[0]}
                                    >
                                      <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                      <span className="truncate">
                                        هشدار تداخل ردیف ({conflictMsgs.length.toLocaleString('fa-IR')})
                                      </span>
                                    </div>
                                  )}

                                  <div className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {list
                                      .slice(0, isExpanded ? list.length : 2)
                                      .map((off) => (
                                        <div
                                          key={off.id}
                                          className="flex items-center justify-between gap-1 py-0.5 border-t border-black/5 dark:border-white/5 first:border-t-0"
                                        >
                                          <span className="truncate">
                                            {off.ownerMajorName} ({off.entryTerm}
                                            {off.sectionName ? ` - ${off.sectionName}` : ''})
                                          </span>
                                          {canModifyOffering(off) && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                onClose();
                                                onOpenEditOffering(off);
                                              }}
                                              className="text-[9.5px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-0.5 shrink-0 cursor-pointer"
                                              title="تغییر تکی تاریخ/سانس امتحان این شعبه"
                                            >
                                              <Edit3 className="w-2.5 h-2.5" />
                                              <span>تکی</span>
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    {list.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedCellCourseKey(isExpanded ? null : expandKey)
                                        }
                                        className="text-[9.5px] font-bold text-indigo-700 dark:text-indigo-300 hover:underline mt-0.5 cursor-pointer"
                                      >
                                        {isExpanded
                                          ? 'بستن لیست شعب'
                                          : `مشاهده و ویرایش تکی همه ${list.length.toLocaleString('fa-IR')} شعبه...`}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {!selectedGroup && (
                              <div className="pt-0.5">
                                {quickAddCellKey === cellKey ? (
                                  <select
                                    autoFocus
                                    value=""
                                    onBlur={() => setQuickAddCellKey(null)}
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        assignCourseGroupToExamCell(
                                          e.target.value,
                                          day.id,
                                          slot.id
                                        );
                                      }
                                    }}
                                    className="w-full px-2 py-1 rounded-lg border border-indigo-400 bg-white dark:bg-slate-800 text-[10.5px] font-bold"
                                  >
                                    <option value="">-- انتخاب درس نظری برای ثبت یکجا --</option>
                                    {courseGroups
                                      .filter((g) => g.editableOfferings.length > 0)
                                      .map((g) => (
                                        <option key={g.courseCode} value={g.courseCode}>
                                          {g.courseTitle} ({g.courseCode}) · {g.offerings.length} شعبه
                                        </option>
                                      ))}
                                  </select>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setQuickAddCellKey(cellKey)}
                                    className="w-full py-1 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 text-[10px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer transition"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>افزودن درس در این سانس</span>
                                  </button>
                                )}
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
        </div>
      </div>
    </div>
  );
};
