import React, { useMemo, useState } from 'react';
import {
  SchedCourseOffering,
  SchedDayKey,
  SchedRulesSettings,
  Student,
  StudentScheduleAccessScope,
} from '../types';
import { Storage } from '../utils/storage';
import {
  SCHED_COURSE_TYPE_LABELS,
  SCHED_DAY_LABELS,
  SCHED_DAYS_ORDER,
  calculateOfferingBreakdown,
  doesOfferingMatchStudentScope,
  doesProgramMatchStudentScope,
  doesStudentMatchEntryTerm,
  doesStudentMatchMajor,
  exportJsonRowsToExcel,
  getOfferingSlotHalf,
  getSchedSlotTitle,
  getSlotHalfLabel,
  isOfferingEffectivelyActive,
  normalizePersianText,
  printSchedHtml,
  round2,
  summarizeSectionOfferings,
} from '../utils/schedulingUtils';
import { escapeHtml } from '../utils/sanitizeHtml';
import {
  AlertCircle,
  BookOpen,
  Building2,
  Calendar,
  CalendarDays,
  Clock,
  Download,
  Eye,
  Filter,
  Globe,
  Layers,
  ListChecks,
  Printer,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';

interface StudentTermSchedulePanelProps {
  student: Student;
  rules: SchedRulesSettings;
  cloudSyncTick?: number;
}

const SCOPE_META: Record<
  StudentScheduleAccessScope,
  { label: string; badgeCls: string; icon: typeof Users }
> = {
  own_cohort: {
    label: 'فقط برنامه رشته و ورودی شما',
    badgeCls: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-200 dark:border-teal-800',
    icon: Users,
  },
  own_major: {
    label: 'برنامه کل ورودی‌های رشته تحصیلی شما',
    badgeCls: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-200 dark:border-indigo-800',
    icon: Eye,
  },
  all_programs: {
    label: 'برنامه جامع کل رشته‌ها و ورودی‌های دانشگاه',
    badgeCls: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-200 dark:border-sky-800',
    icon: Globe,
  },
};

export const StudentTermSchedulePanel: React.FC<StudentTermSchedulePanelProps> = ({
  student,
  rules,
  cloudSyncTick = 0,
}) => {
  const scope: StudentScheduleAccessScope = rules.studentAccessScope || 'own_cohort';

  const publishedTerms = useMemo(() => {
    const raw =
      Array.isArray(rules.studentPublishedTerms) && rules.studentPublishedTerms.length > 0
        ? rules.studentPublishedTerms
        : [rules.activeTerm || '1405-1'];
    return Array.from(new Set(raw));
  }, [rules.studentPublishedTerms, rules.activeTerm]);

  const [selectedTerm, setSelectedTerm] = useState<string>(() =>
    publishedTerms.includes(rules.activeTerm) ? rules.activeTerm : publishedTerms[0]
  );

  // همگام‌سازی خودکار ترم انتخابی اگر مدیر ترم‌های منتشرشده را تغییر داد
  React.useEffect(() => {
    if (!publishedTerms.includes(selectedTerm)) {
      setSelectedTerm(
        publishedTerms.includes(rules.activeTerm) ? rules.activeTerm : publishedTerms[0]
      );
    }
  }, [publishedTerms, selectedTerm, rules.activeTerm]);

  const [viewMode, setViewMode] = useState<'weekly_grid' | 'courses_list'>('weekly_grid');
  const [majorFilter, setMajorFilter] = useState<string>('all');
  const [entryFilter, setEntryFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // اگر مدیر سطح دسترسی را محدودتر کرد، فیلترها را ریست کن
  React.useEffect(() => {
    setMajorFilter('all');
    setEntryFilter('all');
    setSectionFilter('all');
  }, [scope]);

  const allOfferings = useMemo(
    () => Storage.getSchedOfferings(),
    [cloudSyncTick, selectedTerm]
  );
  const allPrograms = useMemo(
    () => Storage.getSchedPrograms(),
    [cloudSyncTick]
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

  // رشته‌ها و ورودی‌های مجاز بر اساس سطح دسترسی تعیین‌شده توسط مدیر سامانه
  const allowedPrograms = useMemo(
    () =>
      allPrograms.filter((p) =>
        doesProgramMatchStudentScope(p, student.fieldOfStudy, student.entryTerm, scope)
      ),
    [allPrograms, student.fieldOfStudy, student.entryTerm, scope]
  );

  // دروس مجاز بر اساس ترم منتشرشده + سطح دسترسی تعیین‌شده توسط مدیر سامانه (بدون دروس غیرفعال)
  const scopeOfferings = useMemo(
    () =>
      allOfferings.filter(
        (o) =>
          isOfferingEffectivelyActive(o, rules) &&
          o.termKey === selectedTerm &&
          doesOfferingMatchStudentScope(o, student.fieldOfStudy, student.entryTerm, scope)
      ),
    [allOfferings, rules, selectedTerm, student.fieldOfStudy, student.entryTerm, scope]
  );

  const availableMajors = useMemo(() => {
    const map = new Map<string, string>();
    allowedPrograms.forEach((p) => map.set(p.majorCode, p.majorName));
    scopeOfferings.forEach((o) => {
      if (scope === 'all_programs' || doesStudentMatchMajor(student.fieldOfStudy, o.ownerMajorName, o.ownerMajorCode)) {
        map.set(o.ownerMajorCode || o.ownerMajorName, o.ownerMajorName);
      }
      o.sharedWithTargets?.forEach((t) => {
        if (scope === 'all_programs' || doesStudentMatchMajor(student.fieldOfStudy, t.majorName, t.majorCode)) {
          map.set(t.majorCode || t.majorName, t.majorName);
        }
      });
    });
    return Array.from(map.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fa'));
  }, [allowedPrograms, scopeOfferings, scope, student.fieldOfStudy]);

  const availableEntries = useMemo(() => {
    const set = new Set<string>();
    allowedPrograms.forEach((p) => {
      if (majorFilter === 'all' || p.majorCode === majorFilter || p.majorName === majorFilter) {
        set.add(p.entryTerm);
      }
    });
    scopeOfferings.forEach((o) => {
      if (majorFilter === 'all' || o.ownerMajorCode === majorFilter || o.ownerMajorName === majorFilter) {
        set.add(o.entryTerm);
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a, 'en'));
  }, [allowedPrograms, scopeOfferings, majorFilter]);

  const availableSections = useMemo(() => {
    const set = new Set<string>();
    allowedPrograms.forEach((p) => {
      if (majorFilter !== 'all' && p.majorCode !== majorFilter && p.majorName !== majorFilter) return;
      if (entryFilter !== 'all' && !doesStudentMatchEntryTerm(entryFilter, p.entryTerm)) return;
      p.sections.forEach((s) => {
        if (s.name?.trim()) set.add(s.name.trim());
      });
    });
    scopeOfferings.forEach((o) => {
      if (o.sectionName?.trim()) set.add(o.sectionName.trim());
      o.sharedWithTargets?.forEach((t) => {
        if (t.sectionName?.trim()) set.add(t.sectionName.trim());
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fa'));
  }, [allowedPrograms, scopeOfferings, majorFilter, entryFilter]);

  const filteredOfferings = useMemo(() => {
    const q = normalizePersianText(searchQuery).toLowerCase();
    return scopeOfferings.filter((o) => {
      if (majorFilter !== 'all') {
        const hitHost = o.ownerMajorCode === majorFilter || o.ownerMajorName === majorFilter;
        const hitShared = o.sharedWithTargets?.some(
          (t) => t.majorCode === majorFilter || t.majorName === majorFilter
        );
        if (!hitHost && !hitShared) return false;
      }
      if (entryFilter !== 'all') {
        const hitHost = doesStudentMatchEntryTerm(entryFilter, o.entryTerm);
        const hitShared = o.sharedWithTargets?.some((t) =>
          doesStudentMatchEntryTerm(entryFilter, t.entryTerm)
        );
        if (!hitHost && !hitShared) return false;
      }
      if (sectionFilter !== 'all') {
        const hitHost = (o.sectionName || '').trim() === sectionFilter;
        const hitShared = o.sharedWithTargets?.some(
          (t) => (t.sectionName || '').trim() === sectionFilter
        );
        // اگر درسی برای کل ورودی ثبت شده (بدون شعبه خاص)، در فیلتر شعبه نیز نمایش داده شود
        const isWholeCohort = !o.sectionName && !o.sharedWithTargets?.some((t) => t.sectionName);
        if (!hitHost && !hitShared && !isWholeCohort) return false;
      }
      if (q) {
        const blob = normalizePersianText(
          `${o.courseTitle} ${o.courseCode} ${o.professorName || ''} ${o.classroomName || ''} ${o.ownerMajorName} ${o.sectionName || ''}`
        ).toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [scopeOfferings, majorFilter, entryFilter, sectionFilter, searchQuery]);

  const summaryStats = useMemo(() => {
    const daysUsed = new Set<SchedDayKey>();
    for (const o of filteredOfferings) {
      if (o.dayOfWeek) daysUsed.add(o.dayOfWeek);
    }
    const secSummary = summarizeSectionOfferings(filteredOfferings, rules, {
      groupByCohortSection: true,
    });
    return {
      offeringsCount: secSummary.courseCount,
      totalUnits: secSummary.totalUnits,
      totalHours: secSummary.totalWeeklyHours,
      activeDaysCount: daysUsed.size,
    };
  }, [filteredOfferings, rules]);

  const ScopeIcon = SCOPE_META[scope].icon;

  const handlePrint = () => {
    const headerCells = sortedSlots
      .map(
        (s, idx) =>
          `<th>${escapeHtml(getSchedSlotTitle(s, idx))}<div class="muted mono">${escapeHtml(s.startTime)} - ${escapeHtml(s.endTime)}</div></th>`
      )
      .join('');

    const bodyRows = activeDays
      .map((day) => {
        const cols = sortedSlots
          .map((slot) => {
            const matched = filteredOfferings.filter(
              (o) => o.dayOfWeek === day && o.slotIds.includes(slot.id)
            );
            if (matched.length === 0) {
              return '<td style="text-align:center;color:#94a3b8;">—</td>';
            }
            const cells = matched
              .map((o) => {
                const half = getOfferingSlotHalf(o, slot.id);
                const halfBadge =
                  half !== 'full'
                    ? `<div class="muted"><strong>${escapeHtml(getSlotHalfLabel(half))}</strong></div>`
                    : '';
                const secTxt = [o.sectionName, o.internshipSubGroupLabel]
                  .filter(Boolean)
                  .join(' · ');
                return `<div class="cell-item">
                  ${halfBadge}
                  <div><strong>${escapeHtml(o.courseTitle)}</strong> <span class="mono">(${escapeHtml(o.courseCode)})</span></div>
                  <div class="muted">${escapeHtml(o.professorName || 'استاد نامشخص')} | کلاس: ${escapeHtml(o.classroomName || 'نامشخص')}</div>
                  ${
                    scope !== 'own_cohort' || secTxt
                      ? `<div class="muted">${escapeHtml(o.ownerMajorName)} (${escapeHtml(o.entryTerm)}${secTxt ? ` - ${escapeHtml(secTxt)}` : ''})</div>`
                      : ''
                  }
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
      <div style="margin-bottom:10px;font-size:11px;display:flex;flex-wrap:wrap;gap:14px;">
        <span><strong>دانشجو:</strong> ${escapeHtml(student.fullName)} (<span class="mono">${escapeHtml(student.studentId)}</span>)</span>
        <span><strong>رشته و ورودی:</strong> ${escapeHtml(student.fieldOfStudy || '-')} · ورودی ${escapeHtml(student.entryTerm || '-')}</span>
        <span><strong>محدوده:</strong> ${escapeHtml(SCOPE_META[scope].label)}</span>
        <span><strong>تعداد کلاس‌ها:</strong> ${summaryStats.offeringsCount}</span>
      </div>
      <table>
        <thead><tr><th>روز / سانس</th>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    `;
    printSchedHtml(`برنامه هفتگی ترم ${selectedTerm} — ${student.fullName}`, html);
  };

  const handleExportExcel = () => {
    const rows = filteredOfferings.map((o) => {
      const bd = calculateOfferingBreakdown(o, rules);
      return {
        'نیمسال': o.termKey,
        'کد درس': o.courseCode,
        'عنوان درس': o.courseTitle,
        'نوع درس': SCHED_COURSE_TYPE_LABELS[o.courseType],
        'رشته': o.ownerMajorName,
        'ورودی': o.entryTerm,
        'شعبه / گروه': [o.sectionName, o.internshipSubGroupLabel].filter(Boolean).join(' - ') || 'کل ورودی',
        'استاد': o.professorName || 'تعیین‌نشده',
        'کلاس': o.classroomName || 'تعیین‌نشده',
        'روز': o.dayOfWeek ? SCHED_DAY_LABELS[o.dayOfWeek] : 'تعیین‌نشده',
        'سانس': o.slotIds
          .map((id) => {
            const idx = sortedSlots.findIndex((s) => s.id === id);
            const sl = idx >= 0 ? sortedSlots[idx] : undefined;
            const half = getOfferingSlotHalf(o, id);
            const halfSuffix = half !== 'full' ? ` (${getSlotHalfLabel(half)})` : '';
            return sl ? `${getSchedSlotTitle(sl, idx)} ${sl.startTime}-${sl.endTime}${halfSuffix}` : id;
          })
          .join(' + '),
        'واحد کل': bd.rawUnits,
        'ساعت هفتگی': bd.weeklyHours,
      };
    });
    void exportJsonRowsToExcel(rows, 'برنامه ترم', `برنامه_ترم_${selectedTerm}_${student.studentId}.xlsx`);
  };

  const renderSlotCard = (o: SchedCourseOffering, slotId: string) => {
    const bd = calculateOfferingBreakdown(o, rules);
    const half = getOfferingSlotHalf(o, slotId);
    const isSharedWithStudent =
      !doesStudentMatchMajor(student.fieldOfStudy, o.ownerMajorName, o.ownerMajorCode) &&
      o.sharedWithTargets?.some((t) =>
        doesStudentMatchMajor(student.fieldOfStudy, t.majorName, t.majorCode)
      );

    return (
      <div
        key={`${o.id}_${slotId}`}
        className={`p-2 rounded-xl border text-right space-y-1 transition ${
          o.internshipSubGroupLabel
            ? 'bg-violet-50/80 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800'
            : half === 'first_hour'
            ? 'bg-sky-50/80 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800'
            : half === 'second_hour'
            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
            : 'bg-teal-50/60 dark:bg-teal-950/25 border-teal-200/80 dark:border-teal-800/70'
        }`}
      >
        <div className="flex items-start justify-between gap-1">
          <div className="font-extrabold text-[11.5px] text-slate-900 dark:text-white leading-snug">
            {o.courseTitle}
          </div>
          <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shrink-0">
            {o.courseCode}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1 text-[10px]">
          {half !== 'full' && (
            <span className="px-1.5 py-0.5 rounded bg-white/90 dark:bg-slate-900 font-extrabold text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              {getSlotHalfLabel(half)}
            </span>
          )}
          {o.sectionName && (
            <span className="px-1.5 py-0.5 rounded bg-white/90 dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              {o.sectionName}
            </span>
          )}
          {o.internshipSubGroupLabel && (
            <span className="px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/60 font-bold text-violet-800 dark:text-violet-200">
              {o.internshipSubGroupLabel} ({o.enrolledCount} نفر)
            </span>
          )}
          {isSharedWithStudent && (
            <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 font-bold text-indigo-800 dark:text-indigo-200">
              درس مشترک
            </span>
          )}
        </div>

        <div className="text-[10.5px] text-slate-700 dark:text-slate-300 flex items-center gap-1">
          <UserCheck className="w-3 h-3 text-teal-600 shrink-0" />
          <span className="truncate font-semibold">{o.professorName || 'استاد تعیین‌نشده'}</span>
        </div>

        <div className="text-[10.5px] text-slate-600 dark:text-slate-400 flex items-center justify-between gap-1">
          <span className="inline-flex items-center gap-1 truncate">
            <Building2 className="w-3 h-3 text-indigo-500 shrink-0" />
            <span className="truncate">{o.classroomName || 'کلاس نامشخص'}</span>
          </span>
          <span className="text-[9.5px] font-bold text-slate-500 shrink-0">
            {bd.rawUnits} واحد
          </span>
        </div>

        {scope !== 'own_cohort' && (
          <div className="text-[9.5px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-200/60 dark:border-slate-700/60 truncate">
            {o.ownerMajorName} · ورودی {o.entryTerm}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* سربرگ برنامه ترم دانشجو */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                  برنامه هفتگی و کلاسی ترم {selectedTerm}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[11px] font-extrabold ${SCOPE_META[scope].badgeCls}`}
                >
                  <ScopeIcon className="w-3.5 h-3.5" />
                  <span>{SCOPE_META[scope].label}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                پروفایل آموزشی شما: <strong className="text-slate-700 dark:text-slate-200">{student.fieldOfStudy || 'ثبت‌نشده'}</strong> · ورودی{' '}
                <strong className="font-mono text-slate-700 dark:text-slate-200">{student.entryTerm || 'ثبت‌نشده'}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {publishedTerms.length > 1 && (
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold font-mono cursor-pointer"
              >
                {publishedTerms.map((t) => (
                  <option key={t} value={t}>
                    ترم {t}
                  </option>
                ))}
              </select>
            )}

            <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('weekly_grid')}
                className={`px-3 py-1.5 rounded-lg font-bold inline-flex items-center gap-1.5 cursor-pointer transition ${
                  viewMode === 'weekly_grid'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>جدول هفتگی</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('courses_list')}
                className={`px-3 py-1.5 rounded-lg font-bold inline-flex items-center gap-1.5 cursor-pointer transition ${
                  viewMode === 'courses_list'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>فهرست دروس و اساتید</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              disabled={filteredOfferings.length === 0}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ برنامه (A4)</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={filteredOfferings.length === 0}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>خروجی اکسل</span>
            </button>
          </div>
        </div>

        {/* آمار خلاصه و نوار فیلترها متناسب با محدوده دسترسی */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">تعداد جلسات / ارائه‌ها</div>
            <div className="font-black text-base text-slate-900 dark:text-white mt-0.5">
              {summaryStats.offeringsCount.toLocaleString('fa-IR')} مورد
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">جمع واحدهای جدول فعلی</div>
            <div className="font-black text-base text-teal-700 dark:text-teal-300 mt-0.5">
              {summaryStats.totalUnits.toLocaleString('fa-IR')} واحد
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">مجموع ساعات هفتگی</div>
            <div className="font-black text-base text-indigo-700 dark:text-indigo-300 mt-0.5">
              {summaryStats.totalHours.toLocaleString('fa-IR')} ساعت
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">روزهای حضور در هفته</div>
            <div className="font-black text-base text-amber-700 dark:text-amber-300 mt-0.5">
              {summaryStats.activeDaysCount.toLocaleString('fa-IR')} روز
            </div>
          </div>
        </div>

        {/* فیلترهای تعاملی مجاز */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="inline-flex items-center gap-1 text-slate-500 font-bold">
            <Filter className="w-3.5 h-3.5" />
            <span>فیلتر:</span>
          </div>

          {scope === 'all_programs' && availableMajors.length > 0 && (
            <select
              value={majorFilter}
              onChange={(e) => {
                setMajorFilter(e.target.value);
                setEntryFilter('all');
                setSectionFilter('all');
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold cursor-pointer"
            >
              <option value="all">همه رشته‌ها</option>
              {availableMajors.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.name}
                </option>
              ))}
            </select>
          )}

          {(scope === 'all_programs' || scope === 'own_major') && availableEntries.length > 0 && (
            <select
              value={entryFilter}
              onChange={(e) => {
                setEntryFilter(e.target.value);
                setSectionFilter('all');
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold cursor-pointer"
            >
              <option value="all">همه ورودی‌ها</option>
              {availableEntries.map((ent) => (
                <option key={ent} value={ent}>
                  ورودی {ent}
                </option>
              ))}
            </select>
          )}

          {availableSections.length > 0 && (
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold cursor-pointer"
            >
              <option value="all">همه شعبه‌ها</option>
              {availableSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          )}

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در نام درس، کد درس، استاد یا کلاس..."
              className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </div>
      </div>

      {/* بدنه نمایش برنامه */}
      {filteredOfferings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <div className="font-extrabold text-sm text-slate-800 dark:text-white">
            در نیمسال {selectedTerm} درسی مطابق با محدوده دسترسی شما یافت نشد
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            {!student.fieldOfStudy || !student.entryTerm
              ? 'رشته تحصیلی یا سال ورودی در پرونده شما تکمیل نشده است. لطفاً از بخش ویرایش پرونده اطلاعات آموزشی خود را بررسی کنید.'
              : `برای رشته «${student.fieldOfStudy}»${scope === 'own_cohort' ? ` (ورودی ${student.entryTerm})` : ''} هنوز درسی در برنامه ترم ${selectedTerm} ثبت یا با فیلتر انتخابی شما منطبق نشده است.`}
          </p>
        </div>
      ) : viewMode === 'weekly_grid' ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 text-right min-w-[100px] font-black text-slate-800 dark:text-white sticky right-0 z-10 bg-slate-100 dark:bg-slate-800">
                    روز / سانس
                  </th>
                  {sortedSlots.map((slot, sIdx) => (
                    <th
                      key={slot.id}
                      className="p-2.5 text-center border-r border-slate-200 dark:border-slate-700 min-w-[185px]"
                    >
                      <div className="font-black text-slate-900 dark:text-white">
                        {getSchedSlotTitle(slot, sIdx)}
                      </div>
                      <div className="text-[10.5px] font-mono text-slate-500 mt-0.5 flex items-center justify-center gap-1" dir="ltr">
                        <Clock className="w-3 h-3 text-teal-600" />
                        <span>
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {activeDays.map((day) => (
                  <tr key={day} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                    <td className="p-3 font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 sticky right-0 z-10 border-l border-slate-200 dark:border-slate-800">
                      {SCHED_DAY_LABELS[day]}
                    </td>
                    {sortedSlots.map((slot) => {
                      const items = filteredOfferings.filter(
                        (o) => o.dayOfWeek === day && o.slotIds.includes(slot.id)
                      );
                      const hasHalf = items.some((o) => getOfferingSlotHalf(o, slot.id) !== 'full');
                      const fullItems = items.filter((o) => getOfferingSlotHalf(o, slot.id) === 'full');
                      const firstHourItems = items.filter(
                        (o) => getOfferingSlotHalf(o, slot.id) === 'first_hour'
                      );
                      const secondHourItems = items.filter(
                        (o) => getOfferingSlotHalf(o, slot.id) === 'second_hour'
                      );

                      return (
                        <td
                          key={slot.id}
                          className="p-1.5 align-top border-r border-slate-200 dark:border-slate-800"
                        >
                          {items.length === 0 ? (
                            <div className="h-12 flex items-center justify-center text-slate-300 dark:text-slate-700 text-[11px]">
                              —
                            </div>
                          ) : hasHalf ? (
                            <div className="space-y-1.5">
                              {fullItems.map((o) => renderSlotCard(o, slot.id))}
                              <div className="grid grid-cols-2 gap-1.5">
                                <div className="space-y-1 rounded-xl p-1 bg-sky-50/40 dark:bg-sky-950/15 border border-dashed border-sky-200/80 dark:border-sky-900">
                                  <div className="text-[9px] font-black text-sky-700 dark:text-sky-300 text-center">
                                    ساعت اول
                                  </div>
                                  {firstHourItems.length > 0 ? (
                                    firstHourItems.map((o) => renderSlotCard(o, slot.id))
                                  ) : (
                                    <div className="text-[10px] text-center text-slate-300 py-2">
                                      خالی
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-1 rounded-xl p-1 bg-amber-50/40 dark:bg-amber-950/15 border border-dashed border-amber-200/80 dark:border-amber-900">
                                  <div className="text-[9px] font-black text-amber-700 dark:text-amber-300 text-center">
                                    ساعت دوم
                                  </div>
                                  {secondHourItems.length > 0 ? (
                                    secondHourItems.map((o) => renderSlotCard(o, slot.id))
                                  ) : (
                                    <div className="text-[10px] text-center text-slate-300 py-2">
                                      خالی
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {items.map((o) => renderSlotCard(o, slot.id))}
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
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-right">
                  <th className="p-3">کد درس</th>
                  <th className="p-3">عنوان درس</th>
                  <th className="p-3">رشته / ورودی / شعبه</th>
                  <th className="p-3">استاد</th>
                  <th className="p-3">کلاس فیزیکی</th>
                  <th className="p-3">روز و زمان برگزاری</th>
                  <th className="p-3 text-center">واحد / ساعت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                {filteredOfferings.map((o) => {
                  const bd = calculateOfferingBreakdown(o, rules);
                  return (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                        {o.courseCode}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{o.courseTitle}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {SCHED_COURSE_TYPE_LABELS[o.courseType]}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {o.ownerMajorName} · ورودی {o.entryTerm}
                        </div>
                        {(o.sectionName || o.internshipSubGroupLabel) && (
                          <div className="text-[10.5px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-slate-400" />
                            <span>
                              {[o.sectionName, o.internshipSubGroupLabel]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                        {o.professorName || 'تعیین‌نشده'}
                      </td>
                      <td className="p-3">{o.classroomName || 'تعیین‌نشده'}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {o.dayOfWeek ? SCHED_DAY_LABELS[o.dayOfWeek] : 'نامشخص'}
                        </div>
                        <div className="text-[10.5px] text-slate-500 mt-0.5">
                          {o.slotIds
                            .map((id) => {
                              const idx = sortedSlots.findIndex((s) => s.id === id);
                              const sl = idx >= 0 ? sortedSlots[idx] : undefined;
                              const half = getOfferingSlotHalf(o, id);
                              const halfStr = half !== 'full' ? ` [${getSlotHalfLabel(half)}]` : '';
                              return sl
                                ? `${getSchedSlotTitle(sl, idx)} (${sl.startTime}-${sl.endTime})${halfStr}`
                                : id;
                            })
                            .join(' + ')}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-bold text-teal-700 dark:text-teal-300">
                          {bd.rawUnits} واحد
                        </span>
                        <div className="text-[10px] text-slate-500">{bd.weeklyHours} ساعت</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
