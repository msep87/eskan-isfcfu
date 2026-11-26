import React, { useMemo, useState } from 'react';
import {
  SchedClassroom,
  SchedCourseOffering,
  SchedDayKey,
  SchedEmploymentType,
  SchedProfessor,
  SchedProgramCohort,
  SchedRulesSettings,
} from '../types';
import {
  SCHED_DAY_LABELS,
  SCHED_DAYS_ORDER,
  SCHED_EMPLOYMENT_LABELS,
  SCHED_PRACTICAL_TYPE_LABELS,
  SCHED_ROOM_TYPE_LABELS,
  calculateOfferingBreakdown,
  calculateProfessorLoadSummary,
  detectOfferingConflicts,
  evaluateProfessorEquivalentUnitStatus,
  exportJsonRowsToExcel,
  getSchedSlotTitle,
  isOfferingEffectivelyActive,
  printSchedHtml,
  round2,
  summarizeSectionOfferings,
} from '../utils/schedulingUtils';
import { escapeHtml } from '../utils/sanitizeHtml';
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  Clock,
  Download,
  FileSpreadsheet,
  Filter,
  GraduationCap,
  Layers,
  Printer,
  Share2,
  UserCheck,
  Users,
} from 'lucide-react';

interface CourseSchedulingReportsProps {
  termKey: string;
  offerings: SchedCourseOffering[];
  classrooms: SchedClassroom[];
  programs: SchedProgramCohort[];
  professors: SchedProfessor[];
  rules: SchedRulesSettings;
  canViewSensitiveProfInfo: boolean; // فقط admin و academic_deputy (مخفی برای مدیر گروه)
}

type ReportTabKey =
  | 'classroom'
  | 'major'
  | 'cohort_section'
  | 'program_days'
  | 'weekly_units_dist'
  | 'professors'
  | 'shared_conflicts';

function doesOfferingIncludeMajor(off: SchedCourseOffering, majorCode: string): boolean {
  if (off.ownerMajorCode === majorCode) return true;
  return Boolean(off.sharedWithTargets?.some((t) => t.majorCode === majorCode));
}

function doesOfferingIncludeCohort(
  off: SchedCourseOffering,
  cohortId: string,
  sectionId?: string
): boolean {
  const matchesPrimary =
    off.cohortId === cohortId &&
    (!sectionId || sectionId === 'all' || !off.sectionId || off.sectionId === sectionId);
  if (matchesPrimary) return true;
  return Boolean(
    off.sharedWithTargets?.some(
      (t) =>
        t.cohortId === cohortId &&
        (!sectionId || sectionId === 'all' || !t.sectionId || t.sectionId === sectionId)
    )
  );
}

function renderMatrixTableHtml(
  activeDays: SchedDayKey[],
  sortedSlots: SchedRulesSettings['timeSlots'],
  items: SchedCourseOffering[],
  rules: SchedRulesSettings,
  mode: 'classroom' | 'program' | 'professor'
): string {
  const headerCells = sortedSlots
    .map(
      (s, idx) =>
        `<th>${escapeHtml(getSchedSlotTitle(s, idx))}<div class="muted mono">${escapeHtml(s.startTime)}-${escapeHtml(s.endTime)}</div></th>`
    )
    .join('');

  const rowsHtml = activeDays
    .map((day) => {
      const cols = sortedSlots
        .map((slot) => {
          const matched = items.filter((o) => o.dayOfWeek === day && o.slotIds.includes(slot.id));
          if (matched.length === 0) return '<td style="text-align:center;color:#94a3b8;">—</td>';
          const cards = matched
            .map((o) => {
              const bd = calculateOfferingBreakdown(o, rules);
              const sharedTxt =
                o.sharedWithTargets && o.sharedWithTargets.length > 0
                  ? ` + مشترک (${o.sharedWithTargets.map((t) => `${t.majorName} ${t.entryTerm}`).join('، ')})`
                  : '';
              const detailLine =
                mode === 'classroom'
                  ? `استاد: ${o.professorName || 'تعیین‌نشده'} | ${o.ownerMajorName} (${o.entryTerm}${o.sectionName ? ` - ${o.sectionName}` : ''})${sharedTxt}`
                  : mode === 'program'
                  ? `استاد: ${o.professorName || 'تعیین‌نشده'} | مکان: ${o.classroomName || 'نامشخص'}`
                  : `رشته: ${o.ownerMajorName} (${o.entryTerm}${o.sectionName ? ` - ${o.sectionName}` : ''})${sharedTxt} | مکان: ${o.classroomName || 'نامشخص'}`;
              return `<div class="cell-item">
                <div><strong>${escapeHtml(o.courseTitle)}</strong> <span class="mono muted">(${escapeHtml(o.courseCode)})</span></div>
                <div class="muted">${escapeHtml(detailLine)}</div>
                <div class="muted">${bd.rawUnits} واحد | ${bd.weeklyHours} ساعت</div>
              </div>`;
            })
            .join('');
          return `<td>${cards}</td>`;
        })
        .join('');
      return `<tr><th style="width:90px;">${escapeHtml(SCHED_DAY_LABELS[day])}</th>${cols}</tr>`;
    })
    .join('');

  return `<table><thead><tr><th>روز / سانس</th>${headerCells}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
}

export const CourseSchedulingReports: React.FC<CourseSchedulingReportsProps> = ({
  termKey,
  offerings,
  classrooms,
  programs,
  professors,
  rules,
  canViewSensitiveProfInfo,
}) => {
  const [activeReport, setActiveReport] = useState<ReportTabKey>('classroom');
  const [selectedTerm, setSelectedTerm] = useState<string>(termKey);

  // همگام‌سازی ترم وقتی از بالا تغییر کند
  React.useEffect(() => {
    setSelectedTerm(termKey);
  }, [termKey]);

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

  const rawTermOfferings = useMemo(
    () =>
      selectedTerm === 'all'
        ? offerings
        : offerings.filter((o) => o.termKey === selectedTerm),
    [offerings, selectedTerm]
  );

  const disabledOfferings = useMemo(
    () => rawTermOfferings.filter((o) => !isOfferingEffectivelyActive(o, rules)),
    [rawTermOfferings, rules]
  );

  const termOfferings = useMemo(
    () => rawTermOfferings.filter((o) => isOfferingEffectivelyActive(o, rules)),
    [rawTermOfferings, rules]
  );

  const uniqueMajors = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of programs) {
      map.set(p.majorCode, p.majorName);
    }
    for (const o of termOfferings) {
      if (!map.has(o.ownerMajorCode)) map.set(o.ownerMajorCode, o.ownerMajorName);
    }
    return Array.from(map.entries())
      .map(([majorCode, majorName]) => ({ majorCode, majorName }))
      .sort((a, b) => a.majorName.localeCompare(b.majorName, 'fa'));
  }, [programs, termOfferings]);

  // فیلترهای گزارش ۱: کلاس فیزیکی
  const [selectedRoomId, setSelectedRoomId] = useState<string>(classrooms[0]?.id || 'all');

  // فیلترهای گزارش ۲: رشته
  const [selectedMajorCode, setSelectedMajorCode] = useState<string>(
    uniqueMajors[0]?.majorCode || ''
  );

  // فیلترهای گزارش ۳: ورودی و شعبه
  const [selectedCohortId, setSelectedCohortId] = useState<string>(programs[0]?.id || '');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');

  // فیلترهای گزارش ۴: تعداد روز برنامه رشته‌ها
  const [daysFilterMajor, setDaysFilterMajor] = useState<string>('all');
  const [minDaysThreshold, setMinDaysThreshold] = useState<number>(0);

  // فیلترهای گزارش ۵: توزیع واحدها در هفته
  const [distMajorCode, setDistMajorCode] = useState<string>('all');
  const [distCohortId, setDistCohortId] = useState<string>('all');

  // فیلترهای گزارش ۶: اساتید
  const [profEmploymentFilter, setProfEmploymentFilter] = useState<string>('all');
  const [profMajorFilter, setProfMajorFilter] = useState<string>('all');
  const [profSearch, setProfSearch] = useState<string>('');
  const [selectedProfId, setSelectedProfId] = useState<string>(professors[0]?.id || '');

  React.useEffect(() => {
    if (selectedRoomId !== 'all' && !classrooms.some((r) => r.id === selectedRoomId)) {
      setSelectedRoomId(classrooms[0]?.id || 'all');
    }
  }, [classrooms, selectedRoomId]);

  React.useEffect(() => {
    if (!selectedMajorCode && uniqueMajors.length > 0) {
      setSelectedMajorCode(uniqueMajors[0].majorCode);
    }
  }, [uniqueMajors, selectedMajorCode]);

  React.useEffect(() => {
    if (!selectedCohortId && programs.length > 0) {
      setSelectedCohortId(programs[0].id);
    }
  }, [programs, selectedCohortId]);

  React.useEffect(() => {
    if (!selectedProfId && professors.length > 0) {
      setSelectedProfId(professors[0].id);
    }
  }, [professors, selectedProfId]);

  // محاسبه ردیف‌های گزارش ۴ (تعداد روز برنامه هر ورودی و شعبه با احتساب شعبه‌های کارورزی به عنوان ۱ درس و ۱ واحد واقعی برای دانشجو)
  const programDaysRows = useMemo(() => {
    const rows: Array<{
      cohortId: string;
      majorCode: string;
      majorName: string;
      entryTerm: string;
      sectionId: string;
      sectionName: string;
      studentCount: number;
      activeDays: SchedDayKey[];
      daysCount: number;
      offeringsCount: number;
      totalUnits: number;
      totalHours: number;
      maxHoursInADay: number;
      internshipDeduplicated: boolean;
    }> = [];

    for (const p of programs) {
      if (daysFilterMajor !== 'all' && p.majorCode !== daysFilterMajor) continue;
      const sections =
        p.sections.length > 0
          ? p.sections
          : [{ id: '', name: 'کل ورودی', studentCount: p.totalStudents }];

      for (const sec of sections) {
        const secOffs = termOfferings.filter((o) =>
          doesOfferingIncludeCohort(o, p.id, sec.id || undefined)
        );
        const dayHourMap = new Map<SchedDayKey, number>();

        for (const o of secOffs) {
          const bd = calculateOfferingBreakdown(o, rules);
          if (o.dayOfWeek) {
            dayHourMap.set(o.dayOfWeek, round2((dayHourMap.get(o.dayOfWeek) || 0) + bd.weeklyHours));
          }
        }

        const secSummary = summarizeSectionOfferings(secOffs, rules);
        const activeDayList = SCHED_DAYS_ORDER.filter((d) => dayHourMap.has(d));
        const maxDayHours = Math.max(0, ...Array.from(dayHourMap.values()));

        if (activeDayList.length >= minDaysThreshold) {
          rows.push({
            cohortId: p.id,
            majorCode: p.majorCode,
            majorName: p.majorName,
            entryTerm: p.entryTerm,
            sectionId: sec.id,
            sectionName: sec.name,
            studentCount: sec.studentCount,
            activeDays: activeDayList,
            daysCount: activeDayList.length,
            offeringsCount: secSummary.courseCount,
            totalUnits: secSummary.totalUnits,
            totalHours: secSummary.totalWeeklyHours,
            maxHoursInADay: round2(maxDayHours),
            internshipDeduplicated:
              secSummary.internshipRecordsCount > secSummary.internshipCourseCount,
          });
        }
      }
    }

    return rows.sort((a, b) => b.daysCount - a.daysCount || a.majorName.localeCompare(b.majorName, 'fa'));
  }, [programs, termOfferings, rules, daysFilterMajor, minDaysThreshold]);

  // محاسبه گزارش ۵ (توزیع تعداد واحدها و ساعات در روزهای هفته)
  const weeklyDistribution = useMemo(() => {
    const filtered = termOfferings.filter((o) => {
      if (distMajorCode !== 'all' && !doesOfferingIncludeMajor(o, distMajorCode)) return false;
      if (distCohortId !== 'all' && !doesOfferingIncludeCohort(o, distCohortId)) return false;
      return true;
    });

    const daysStats = activeDays.map((day) => {
      const dayOffs = filtered.filter((o) => o.dayOfWeek === day);
      let theoryUnits = 0;
      let practicalUnits = 0;
      let totalHours = 0;
      for (const o of dayOffs) {
        const bd = calculateOfferingBreakdown(o, rules);
        theoryUnits += bd.activeTheoryUnits;
        practicalUnits += bd.activePracticalUnits;
        totalHours += bd.weeklyHours;
      }
      return {
        day,
        label: SCHED_DAY_LABELS[day],
        sessionCount: dayOffs.length,
        theoryUnits: round2(theoryUnits),
        practicalUnits: round2(practicalUnits),
        totalUnits: round2(theoryUnits + practicalUnits),
        totalHours: round2(totalHours),
      };
    });

    const unscheduled = filtered.filter((o) => !o.dayOfWeek || o.slotIds.length === 0);
    const maxHours = Math.max(1, ...daysStats.map((d) => d.totalHours));
    const maxUnits = Math.max(1, ...daysStats.map((d) => d.totalUnits));

    return {
      daysStats,
      unscheduledCount: unscheduled.length,
      totalSessions: daysStats.reduce((s, d) => s + d.sessionCount, 0),
      totalTheoryUnits: round2(daysStats.reduce((s, d) => s + d.theoryUnits, 0)),
      totalPracticalUnits: round2(daysStats.reduce((s, d) => s + d.practicalUnits, 0)),
      totalUnits: round2(daysStats.reduce((s, d) => s + d.totalUnits, 0)),
      totalHours: round2(daysStats.reduce((s, d) => s + d.totalHours, 0)),
      maxHours,
      maxUnits,
    };
  }, [termOfferings, activeDays, distMajorCode, distCohortId, rules]);

  // محاسبه گزارش ۶ (گزارش جامع اساتید و واحد معادل)
  const professorRows = useMemo(() => {
    const q = profSearch.trim().toLowerCase();
    return professors
      .filter((p) => {
        if (profEmploymentFilter !== 'all' && p.employmentType !== profEmploymentFilter) {
          return false;
        }
        if (q) {
          const hay = `${p.fullName} ${p.professorCode} ${p.degreeLevel || ''} ${p.degreeField || ''} ${p.degreeSpecialization || ''} ${p.degreeFull || ''} ${p.departmentName || ''} ${p.academicRank || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (profMajorFilter !== 'all') {
          const teachesMajor = termOfferings.some(
            (o) => o.professorId === p.id && doesOfferingIncludeMajor(o, profMajorFilter)
          );
          if (!teachesMajor) return false;
        }
        return true;
      })
      .map((prof) => {
        const summary = calculateProfessorLoadSummary(prof.id, termOfferings, rules);
        return { prof, summary };
      })
      .sort((a, b) => b.summary.equivalentUnits - a.summary.equivalentUnits);
  }, [professors, termOfferings, rules, profEmploymentFilter, profMajorFilter, profSearch]);

  // محاسبه گزارش ۷ (دروس مشترک ۷ رقمی و پایش خطاها)
  const auditData = useMemo(() => {
    const sharedOfferings = termOfferings.filter(
      (o) => o.sharedWithTargets && o.sharedWithTargets.length > 0
    );
    const missingProf = termOfferings.filter((o) => !o.professorId);
    const missingRoom = termOfferings.filter(
      (o) => !o.classroomId && o.practicalType !== 'internship'
    );
    const unscheduled = termOfferings.filter((o) => !o.dayOfWeek || o.slotIds.length === 0);
    const conflicts: Array<{ offering: SchedCourseOffering; errors: string[]; warnings: string[] }> = [];

    for (const o of termOfferings) {
      const rep = detectOfferingConflicts(o, termOfferings, classrooms, professors);
      if (rep.errors.length > 0 || rep.warnings.length > 0) {
        conflicts.push({ offering: o, errors: rep.errors, warnings: rep.warnings });
      }
    }

    return { sharedOfferings, missingProf, missingRoom, unscheduled, disabledOfferings, conflicts };
  }, [termOfferings, disabledOfferings, classrooms, professors]);

  const termLabel = selectedTerm === 'all' ? 'کل ترم‌ها' : `ترم ${selectedTerm}`;

  const renderWeeklyMatrix = (
    items: SchedCourseOffering[],
    cellMode: 'classroom' | 'program' | 'professor'
  ) => (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <table className="w-full text-xs border-collapse min-w-[760px]">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
            <th className="p-2.5 text-right font-extrabold w-28 border-l border-slate-200 dark:border-slate-700">
              روز هفته / سانس
            </th>
            {sortedSlots.map((slot, idx) => (
              <th
                key={slot.id}
                className="p-2 text-center font-bold border-l border-slate-200 dark:border-slate-700 last:border-l-0"
              >
                <div>{getSchedSlotTitle(slot, idx)}</div>
                <div className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400" dir="ltr">
                  {slot.startTime} - {slot.endTime}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {activeDays.map((day) => (
            <tr key={day} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
              <td className="p-2.5 font-extrabold text-slate-800 dark:text-slate-100 bg-slate-50/70 dark:bg-slate-800/40 border-l border-slate-200 dark:border-slate-700">
                {SCHED_DAY_LABELS[day]}
              </td>
              {sortedSlots.map((slot) => {
                const cellItems = items.filter(
                  (o) => o.dayOfWeek === day && o.slotIds.includes(slot.id)
                );
                return (
                  <td
                    key={slot.id}
                    className="p-1.5 align-top border-l border-slate-200 dark:border-slate-700 last:border-l-0 min-w-[140px]"
                  >
                    {cellItems.length === 0 ? (
                      <div className="h-10 flex items-center justify-center text-slate-300 dark:text-slate-700">
                        —
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {cellItems.map((o) => {
                          const bd = calculateOfferingBreakdown(o, rules);
                          return (
                            <div
                              key={o.id}
                              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 space-y-0.5"
                            >
                              <div className="font-bold text-slate-900 dark:text-white leading-snug">
                                {o.courseTitle}
                              </div>
                              <div className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                                کد {o.courseCode} · {bd.rawUnits} واحد ({bd.weeklyHours} ساعت)
                              </div>
                              {cellMode === 'classroom' && (
                                <div className="text-[10px] text-slate-600 dark:text-slate-300">
                                  {o.professorName || 'بدون استاد'} · {o.ownerMajorName} ({o.entryTerm}
                                  {o.sectionName ? ` - ${o.sectionName}` : ''})
                                </div>
                              )}
                              {cellMode === 'program' && (
                                <div className="text-[10px] text-slate-600 dark:text-slate-300">
                                  {o.professorName || 'بدون استاد'} · {o.classroomName || 'بدون کلاس'}
                                </div>
                              )}
                              {cellMode === 'professor' && (
                                <div className="text-[10px] text-slate-600 dark:text-slate-300">
                                  {o.ownerMajorName} ({o.entryTerm}
                                  {o.sectionName ? ` - ${o.sectionName}` : ''}) ·{' '}
                                  {o.classroomName || 'بدون کلاس'}
                                </div>
                              )}
                              {o.sharedWithTargets && o.sharedWithTargets.length > 0 && (
                                <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                                  مشترک با:{' '}
                                  {o.sharedWithTargets
                                    .map((t) => `${t.majorName} (${t.entryTerm})`)
                                    .join('، ')}
                                </div>
                              )}
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
  );

  const reportTabs: Array<{
    key: ReportTabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { key: 'classroom', label: 'برنامه کلاس فیزیکی', icon: Building2 },
    { key: 'major', label: 'برنامه هر رشته', icon: GraduationCap },
    { key: 'cohort_section', label: 'برنامه ورودی و شعبه', icon: Layers },
    { key: 'program_days', label: 'محاسبه تعداد روز رشته‌ها', icon: CalendarDays },
    { key: 'weekly_units_dist', label: 'توزیع واحدها در هفته', icon: Clock },
    { key: 'professors', label: 'برنامه و واحد معادل اساتید', icon: Users },
    { key: 'shared_conflicts', label: 'پایش دروس مشترک و تداخل‌ها', icon: Share2 },
  ];

  // داده‌های تب فعال برای نمایش
  const roomOfferings = useMemo(
    () =>
      selectedRoomId === 'all'
        ? termOfferings.filter((o) => Boolean(o.classroomId))
        : termOfferings.filter((o) => o.classroomId === selectedRoomId),
    [termOfferings, selectedRoomId]
  );

  const majorOfferings = useMemo(
    () =>
      selectedMajorCode
        ? termOfferings.filter((o) => doesOfferingIncludeMajor(o, selectedMajorCode))
        : [],
    [termOfferings, selectedMajorCode]
  );

  const selectedCohort = programs.find((p) => p.id === selectedCohortId);
  const cohortOfferings = useMemo(
    () =>
      selectedCohortId
        ? termOfferings.filter((o) =>
            doesOfferingIncludeCohort(o, selectedCohortId, selectedSectionId)
          )
        : [],
    [termOfferings, selectedCohortId, selectedSectionId]
  );

  const selectedProfessorObj = professors.find((p) => p.id === selectedProfId);
  const selectedProfessorOfferings = useMemo(
    () => (selectedProfId ? termOfferings.filter((o) => o.professorId === selectedProfId) : []),
    [termOfferings, selectedProfId]
  );

  return (
    <div className="space-y-5">
      {/* هدر فیلتر ترم و تب‌بندی گزارش‌ها */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-teal-600" />
              <span>مرکز گزارش‌گیری تحلیلی، آماری و چاپی برنامه درسی</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              استخراج برنامه تفکیکی کلاس‌های فیزیکی، رشته‌ها، ورودی‌ها، محاسبه روزهای حضور، توزیع واحد در هفته و حق‌التدریس / واحد معادل اساتید
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            >
              {rules.availableTerms.map((t) => (
                <option key={t} value={t}>
                  ترم {t}
                </option>
              ))}
              <option value="all">همه ترم‌های ثبت‌شده</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
          {reportTabs.map((t) => {
            const Icon = t.icon;
            const active = activeReport === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveReport(t.key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border transition cursor-pointer ${
                  active
                    ? 'bg-slate-900 dark:bg-teal-600 text-white border-slate-900 dark:border-teal-600'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ۱. برنامه هر کلاس فیزیکی */}
      {activeReport === 'classroom' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                انتخاب کلاس فیزیکی:
              </label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold min-w-[240px]"
              >
                <option value="all">همه کلاس‌های فیزیکی ({classrooms.length} کلاس)</option>
                {classrooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (کد {r.code} · ظرفیت {r.capacity} · {SCHED_ROOM_TYPE_LABELS[r.roomType]})
                  </option>
                ))}
              </select>
              {(() => {
                const slotOccCount = new Set(
                  roomOfferings.flatMap((o) =>
                    o.dayOfWeek ? o.slotIds.map((sid) => `${o.dayOfWeek}:${sid}`) : []
                  )
                ).size;
                const capSlots = Math.max(1, activeDays.length * sortedSlots.length);
                const utilPct =
                  selectedRoomId === 'all'
                    ? Math.round(
                        (roomOfferings.reduce((acc, o) => acc + o.slotIds.length, 0) /
                          Math.max(1, classrooms.filter((r) => r.isActive).length * capSlots)) *
                          100
                      )
                    : Math.round((slotOccCount / capSlots) * 100);
                return (
                  <div className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                    دروس ثبت‌شده: <strong className="text-slate-900 dark:text-white">{roomOfferings.length}</strong> · نرخ بهره‌وری هفتگی:{' '}
                    <strong className="text-teal-700 dark:text-teal-400">%{utilPct}</strong>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const roomObj = classrooms.find((r) => r.id === selectedRoomId);
                  const title =
                    selectedRoomId === 'all'
                      ? `برنامه کلیه کلاس‌های فیزیکی (${termLabel})`
                      : `برنامه هفتگی ${roomObj?.name || ''} (کد ${roomObj?.code || ''}) - ${termLabel}`;
                  printSchedHtml(title, renderMatrixTableHtml(activeDays, sortedSlots, roomOfferings, rules, 'classroom'));
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>چاپ A4</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const rows = roomOfferings.map((o) => ({
                    'کلاس فیزیکی': o.classroomName || '-',
                    'روز': o.dayOfWeek ? SCHED_DAY_LABELS[o.dayOfWeek] : 'تعیین‌نشده',
                    'سانس‌ها': o.slotIds
                      .map((id) => {
                        const idx = sortedSlots.findIndex((s) => s.id === id);
                        const sl = idx >= 0 ? sortedSlots[idx] : undefined;
                        return sl ? `${getSchedSlotTitle(sl, idx)} (${sl.startTime}-${sl.endTime})` : id;
                      })
                      .join(' + '),
                    'کد درس': o.courseCode,
                    'عنوان درس': o.courseTitle,
                    'رشته اصلی': `${o.ownerMajorName} (${o.entryTerm})`,
                    'شعبه/گروه': o.sectionName || '-',
                    'استاد': o.professorName || '-',
                    'تعداد دانشجو': o.enrolledCount,
                  }));
                  void exportJsonRowsToExcel(rows, 'برنامه کلاس', `برنامه_کلاس_${selectedTerm}.xlsx`);
                }}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>خروجی اکسل</span>
              </button>
            </div>
          </div>

          {renderWeeklyMatrix(roomOfferings, 'classroom')}
        </div>
      )}

      {/* ۲. برنامه هر رشته (کد ۶ رقمی) */}
      {activeReport === 'major' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                انتخاب رشته (کد ۶ رقمی):
              </label>
              <select
                value={selectedMajorCode}
                onChange={(e) => setSelectedMajorCode(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold min-w-[240px]"
              >
                {uniqueMajors.map((m) => (
                  <option key={m.majorCode} value={m.majorCode}>
                    {m.majorName} (کد {m.majorCode})
                  </option>
                ))}
              </select>
              <div className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                شامل دروس اختصاصی و مشترک · تعداد کلاس‌های ارائه‌شده:{' '}
                <strong className="text-slate-900 dark:text-white">{majorOfferings.length}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const mj = uniqueMajors.find((m) => m.majorCode === selectedMajorCode);
                  printSchedHtml(
                    `برنامه هفتگی رشته ${mj?.majorName || ''} (کد ${selectedMajorCode}) - ${termLabel}`,
                    renderMatrixTableHtml(activeDays, sortedSlots, majorOfferings, rules, 'program')
                  );
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>چاپ A4</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const rows = majorOfferings.map((o) => {
                    const bd = calculateOfferingBreakdown(o, rules);
                    return {
                      'کد رشته': selectedMajorCode,
                      'کد درس ۷ رقمی': o.courseCode,
                      'عنوان درس': o.courseTitle,
                      'ورودی/شعبه': `${o.entryTerm} ${o.sectionName || ''}`,
                      'نوع ارائه': o.ownerMajorCode === selectedMajorCode ? 'اصلی' : `مشترک (میزبان: ${o.ownerMajorName})`,
                      'واحد کل': bd.rawUnits,
                      'ساعت هفتگی': bd.weeklyHours,
                      'استاد': o.professorName || '-',
                      'کلاس': o.classroomName || '-',
                      'روز': o.dayOfWeek ? SCHED_DAY_LABELS[o.dayOfWeek] : '-',
                    };
                  });
                  void exportJsonRowsToExcel(rows, 'برنامه رشته', `برنامه_رشته_${selectedMajorCode}_${selectedTerm}.xlsx`);
                }}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>خروجی اکسل</span>
              </button>
            </div>
          </div>

          {renderWeeklyMatrix(majorOfferings, 'program')}
        </div>
      )}

      {/* ۳. برنامه هر ورودی و شعبه */}
      {activeReport === 'cohort_section' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedCohortId}
                onChange={(e) => {
                  setSelectedCohortId(e.target.value);
                  setSelectedSectionId('all');
                }}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold min-w-[230px]"
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.majorName} ({p.majorCode}) — ورودی {p.entryTerm} ({p.totalStudents} نفر)
                  </option>
                ))}
              </select>

              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">همه شعب / گروه‌های این ورودی</option>
                {selectedCohort?.sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.studentCount} نفر)
                  </option>
                ))}
              </select>

              {(() => {
                const daysSet = new Set(cohortOfferings.map((o) => o.dayOfWeek).filter(Boolean));
                const cohortSummary = summarizeSectionOfferings(cohortOfferings, rules, {
                  groupByCohortSection: selectedSectionId === 'all',
                });
                return (
                  <div className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                    تعداد درس: <strong>{cohortSummary.courseCount}</strong> · جمع واحد:{' '}
                    <strong>{cohortSummary.totalUnits}</strong> · روزهای حضور در هفته:{' '}
                    <strong className="text-teal-700 dark:text-teal-400">{daysSet.size} روز</strong> · مجموع ساعت هفتگی:{' '}
                    <strong>{cohortSummary.totalWeeklyHours}</strong>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const secLabel =
                    selectedSectionId === 'all'
                      ? 'کل ورودی'
                      : selectedCohort?.sections.find((s) => s.id === selectedSectionId)?.name || '';
                  printSchedHtml(
                    `برنامه کلاسی ${selectedCohort?.majorName || ''} ورودی ${selectedCohort?.entryTerm || ''} (${secLabel}) - ${termLabel}`,
                    renderMatrixTableHtml(activeDays, sortedSlots, cohortOfferings, rules, 'program')
                  );
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>چاپ A4</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const rows = cohortOfferings.map((o) => {
                    const bd = calculateOfferingBreakdown(o, rules);
                    return {
                      'کد درس': o.courseCode,
                      'عنوان درس': o.courseTitle,
                      'استاد': o.professorName || '-',
                      'کلاس': o.classroomName || '-',
                      'روز': o.dayOfWeek ? SCHED_DAY_LABELS[o.dayOfWeek] : '-',
                      'سانس': o.slotIds
                        .map((id) => {
                          const idx = sortedSlots.findIndex((s) => s.id === id);
                          const sl = idx >= 0 ? sortedSlots[idx] : undefined;
                          return sl ? `${getSchedSlotTitle(sl, idx)} (${sl.startTime}-${sl.endTime})` : id;
                        })
                        .join(' + '),
                      'واحد': bd.rawUnits,
                      'ساعت هفتگی': bd.weeklyHours,
                    };
                  });
                  void exportJsonRowsToExcel(rows, 'برنامه ورودی', `برنامه_ورودی_${selectedCohort?.entryTerm || 'term'}.xlsx`);
                }}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>خروجی اکسل</span>
              </button>
            </div>
          </div>

          {renderWeeklyMatrix(cohortOfferings, 'program')}
        </div>
      )}

      {/* ۴. محاسبه تعداد روز برنامه رشته‌ها و ورودی‌ها */}
      {activeReport === 'program_days' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={daysFilterMajor}
                onChange={(e) => setDaysFilterMajor(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">همه رشته‌ها</option>
                {uniqueMajors.map((m) => (
                  <option key={m.majorCode} value={m.majorCode}>
                    {m.majorName} ({m.majorCode})
                  </option>
                ))}
              </select>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 inline-flex items-center gap-1.5">
                <span>حداقل روز حضور در هفته:</span>
                <input
                  type="number"
                  min={0}
                  max={7}
                  value={minDaysThreshold}
                  onChange={(e) => setMinDaysThreshold(Math.max(0, Number(e.target.value) || 0))}
                  className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-mono tabular-nums"
                />
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const html = `<table><thead><tr><th>کد رشته</th><th>رشته</th><th>ورودی</th><th>شعبه/گروه</th><th>تعداد دانشجو</th><th>تعداد روز در هفته</th><th>روزهای فعال</th><th>تعداد دروس</th><th>جمع واحد</th><th>جمع ساعت</th><th>سقف ساعت در روز</th></tr></thead><tbody>${programDaysRows
                    .map(
                      (r) =>
                        `<tr><td class="mono">${escapeHtml(r.majorCode)}</td><td>${escapeHtml(r.majorName)}</td><td class="mono">${escapeHtml(r.entryTerm)}</td><td>${escapeHtml(r.sectionName)}</td><td>${r.studentCount}</td><td><strong>${r.daysCount} روز</strong></td><td>${escapeHtml(r.activeDays.map((d) => SCHED_DAY_LABELS[d]).join('، ') || 'بدون کلاس')}</td><td>${r.offeringsCount}</td><td>${r.totalUnits}</td><td>${r.totalHours}</td><td>${r.maxHoursInADay}</td></tr>`
                    )
                    .join('')}</tbody></table>`;
                  printSchedHtml(`گزارش محاسبه تعداد روز برنامه رشته‌ها و ورودی‌ها - ${termLabel}`, html);
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>چاپ A4</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const rows = programDaysRows.map((r) => ({
                    'کد رشته ۶ رقمی': r.majorCode,
                    'نام رشته': r.majorName,
                    'ورودی': r.entryTerm,
                    'شعبه / گروه': r.sectionName,
                    'تعداد دانشجو': r.studentCount,
                    'تعداد روز برنامه در هفته': r.daysCount,
                    'روزهای فعال هفته': r.activeDays.map((d) => SCHED_DAY_LABELS[d]).join('، '),
                    'تعداد دروس برنامه‌ریزی‌شده': r.offeringsCount,
                    'مجموع واحد': r.totalUnits,
                    'مجموع ساعت هفتگی': r.totalHours,
                    'حداکثر ساعت در یک روز': r.maxHoursInADay,
                  }));
                  void exportJsonRowsToExcel(rows, 'تعداد روز برنامه رشته ها', `تعداد_روز_رشته_ها_${selectedTerm}.xlsx`);
                }}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>خروجی اکسل</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 text-right">
                  <th className="p-3">رشته (کد ۶ رقمی)</th>
                  <th className="p-3">ورودی و شعبه</th>
                  <th className="p-3 text-center">تعداد دانشجو</th>
                  <th className="p-3 text-center">تعداد روز برنامه در هفته</th>
                  <th className="p-3">روزهای حضور</th>
                  <th className="p-3 text-center">دروس</th>
                  <th className="p-3 text-center">جمع واحد</th>
                  <th className="p-3 text-center">جمع ساعت / سقف روزانه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                {programDaysRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      موردی مطابق فیلتر انتخاب‌شده یافت نشد.
                    </td>
                  </tr>
                ) : (
                  programDaysRows.map((r) => (
                    <tr key={`${r.cohortId}_${r.sectionId}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {r.majorName}
                        <div className="text-[10px] font-mono text-slate-500">کد {r.majorCode}</div>
                      </td>
                      <td className="p-3">
                        ورودی <span className="font-mono font-bold">{r.entryTerm}</span> · {r.sectionName}
                      </td>
                      <td className="p-3 text-center font-mono">{r.studentCount}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`font-black text-sm ${
                            r.daysCount >= 5
                              ? 'text-rose-600 dark:text-rose-400'
                              : r.daysCount <= 3 && r.daysCount > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {r.daysCount} روز
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        {r.activeDays.length > 0
                          ? r.activeDays.map((d) => SCHED_DAY_LABELS[d]).join('، ')
                          : 'بدون برنامه زمان‌بندی'}
                      </td>
                      <td className="p-3 text-center">
                        {r.offeringsCount}
                        {r.internshipDeduplicated && (
                          <div className="text-[9.5px] text-violet-600 dark:text-violet-400 font-semibold">
                            (کارورزی = ۱ درس)
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold">{r.totalUnits}</td>
                      <td className="p-3 text-center">
                        {r.totalHours} ساعت · سقف {r.maxHoursInADay} س/روز
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ۵. گزارش تعداد واحدها و توزیع آن‌ها در روزهای هفته */}
      {activeReport === 'weekly_units_dist' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={distMajorCode}
                onChange={(e) => {
                  setDistMajorCode(e.target.value);
                  setDistCohortId('all');
                }}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">کل دانشگاه (همه رشته‌ها)</option>
                {uniqueMajors.map((m) => (
                  <option key={m.majorCode} value={m.majorCode}>
                    {m.majorName} ({m.majorCode})
                  </option>
                ))}
              </select>

              <select
                value={distCohortId}
                onChange={(e) => setDistCohortId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">همه ورودی‌ها</option>
                {programs
                  .filter((p) => distMajorCode === 'all' || p.majorCode === distMajorCode)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.majorName} - ورودی {p.entryTerm}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const html = `<table><thead><tr><th>روز هفته</th><th>تعداد کلاس/ارائه</th><th>واحد نظری</th><th>واحد عملی</th><th>جمع واحد</th><th>مجموع ساعت تدریس</th><th>سهم از کل واحد (%)</th></tr></thead><tbody>${weeklyDistribution.daysStats
                    .map((d) => {
                      const pct =
                        weeklyDistribution.totalUnits > 0
                          ? round2((d.totalUnits / weeklyDistribution.totalUnits) * 100)
                          : 0;
                      return `<tr><td><strong>${escapeHtml(d.label)}</strong></td><td>${d.sessionCount}</td><td>${d.theoryUnits}</td><td>${d.practicalUnits}</td><td><strong>${d.totalUnits}</strong></td><td>${d.totalHours}</td><td>%${pct}</td></tr>`;
                    })
                    .join('')}</tbody></table>`;
                  printSchedHtml(`گزارش تعداد واحدها و توزیع در روزهای هفته - ${termLabel}`, html, false);
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>چاپ A4</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const rows = weeklyDistribution.daysStats.map((d) => ({
                    'روز هفته': d.label,
                    'تعداد کلاس برگزارشده': d.sessionCount,
                    'تعداد واحد نظری': d.theoryUnits,
                    'تعداد واحد عملی': d.practicalUnits,
                    'جمع واحد': d.totalUnits,
                    'مجموع ساعت کلاسی': d.totalHours,
                    'سهم درصدی از هفته':
                      weeklyDistribution.totalUnits > 0
                        ? round2((d.totalUnits / weeklyDistribution.totalUnits) * 100)
                        : 0,
                  }));
                  void exportJsonRowsToExcel(rows, 'توزیع واحدها در هفته', `توزیع_واحدها_در_هفته_${selectedTerm}.xlsx`);
                }}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>خروجی اکسل</span>
              </button>
            </div>
          </div>

          {/* خلاصه کل واحدها و ساعات */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 tabular-nums">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-[11px] text-slate-500">مجموع واحدهای زمان‌بندی‌شده</div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {weeklyDistribution.totalUnits} واحد
              </div>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-[11px] text-slate-500">واحدهای نظری</div>
              <div className="text-xl font-black text-sky-700 dark:text-sky-400 mt-1">
                {weeklyDistribution.totalTheoryUnits}
              </div>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-[11px] text-slate-500">واحدهای عملی/کارورزی</div>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {weeklyDistribution.totalPracticalUnits}
              </div>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-[11px] text-slate-500">مجموع ساعات تدریس هفتگی</div>
              <div className="text-xl font-black text-teal-700 dark:text-teal-400 mt-1">
                {weeklyDistribution.totalHours} ساعت
              </div>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-[11px] text-slate-500">دروس بدون زمان قطعی</div>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {weeklyDistribution.unscheduledCount} درس
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 text-right">
                    <th className="p-3">روز هفته</th>
                    <th className="p-3 text-center">تعداد کلاس</th>
                    <th className="p-3 text-center">نظری</th>
                    <th className="p-3 text-center">عملی</th>
                    <th className="p-3 text-center">جمع واحد</th>
                    <th className="p-3 text-center">جمع ساعت</th>
                    <th className="p-3 text-center">سهم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                  {weeklyDistribution.daysStats.map((d) => {
                    const pct =
                      weeklyDistribution.totalUnits > 0
                        ? round2((d.totalUnits / weeklyDistribution.totalUnits) * 100)
                        : 0;
                    return (
                      <tr key={d.day} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-extrabold text-slate-900 dark:text-white">
                          {d.label}
                        </td>
                        <td className="p-3 text-center">{d.sessionCount}</td>
                        <td className="p-3 text-center">{d.theoryUnits}</td>
                        <td className="p-3 text-center">{d.practicalUnits}</td>
                        <td className="p-3 text-center font-black">{d.totalUnits}</td>
                        <td className="p-3 text-center font-bold text-teal-700 dark:text-teal-400">
                          {d.totalHours}
                        </td>
                        <td className="p-3 text-center text-slate-500">%{pct}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                نمودار مقایسه‌ای توزیع واحدها و ساعات در طول هفته
              </h3>
              <div className="space-y-3">
                {weeklyDistribution.daysStats.map((d) => {
                  const wUnits = Math.round((d.totalUnits / weeklyDistribution.maxUnits) * 100);
                  const wHours = Math.round((d.totalHours / weeklyDistribution.maxHours) * 100);
                  return (
                    <div key={d.day} className="space-y-1">
                      <div className="flex items-center justify-between text-xs tabular-nums">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{d.label}</span>
                        <span className="text-[11px] text-slate-500">
                          {d.totalUnits} واحد · {d.totalHours} ساعت · {d.sessionCount} کلاس
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex gap-0.5">
                        <div
                          className="h-full bg-teal-600 rounded-r-full transition-all"
                          style={{ width: `${Math.max(d.totalUnits > 0 ? 4 : 0, wUnits)}%` }}
                          title={`${d.totalUnits} واحد`}
                        />
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-r-full transition-all"
                          style={{ width: `${Math.max(d.totalHours > 0 ? 3 : 0, wHours)}%` }}
                          title={`${d.totalHours} ساعت`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ۶. گزارش جامع اساتید و محاسبه واحد معادل */}
      {activeReport === 'professors' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={profSearch}
                onChange={(e) => setProfSearch(e.target.value)}
                placeholder="جستجوی نام یا کد استاد..."
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs w-52"
              />
              <select
                value={profEmploymentFilter}
                onChange={(e) => setProfEmploymentFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">همه وضعیت‌های استخدامی</option>
                {(Object.keys(SCHED_EMPLOYMENT_LABELS) as SchedEmploymentType[]).map((k) => (
                  <option key={k} value={k}>
                    {SCHED_EMPLOYMENT_LABELS[k]}
                  </option>
                ))}
              </select>
              <select
                value={profMajorFilter}
                onChange={(e) => setProfMajorFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">تدریس در همه رشته‌ها</option>
                {uniqueMajors.map((m) => (
                  <option key={m.majorCode} value={m.majorCode}>
                    {m.majorName} ({m.majorCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const html = `<table><thead><tr><th>کد استاد</th><th>نام و نام خانوادگی</th><th>مقطع</th><th>رشته و گرایش</th><th>گروه آموزشی</th><th>مرتبه / وضعیت استخدام</th>${
                    canViewSensitiveProfInfo ? '<th>بانک / شماره حساب</th>' : ''
                  }<th>تعداد درس</th><th>واحد خام</th><th>ساعت هفتگی</th><th>واحد معادل (حد مجاز)</th><th>روزهای حضور</th></tr></thead><tbody>${professorRows
                    .map(({ prof, summary }) => {
                      const ls = evaluateProfessorEquivalentUnitStatus(
                        prof,
                        summary.equivalentUnits,
                        rules
                      );
                      const rangeLabel = `${ls.bounds.minEquivalentUnits > 0 ? `حداقل ${ls.bounds.minEquivalentUnits}` : '۰'} تا ${ls.bounds.maxEquivalentUnits > 0 ? ls.bounds.maxEquivalentUnits : 'نامحدود'}`;
                      return `<tr><td class="mono">${escapeHtml(prof.professorCode)}</td><td><strong>${escapeHtml(prof.fullName)}</strong></td><td>${escapeHtml(prof.degreeLevel || '-')}</td><td>${escapeHtml([prof.degreeField, prof.degreeSpecialization].filter(Boolean).join(' - ') || prof.degreeFull || '-')}</td><td>${escapeHtml(prof.departmentName || '-')}</td><td>${escapeHtml([prof.academicRank, prof.employmentStatusRaw || SCHED_EMPLOYMENT_LABELS[prof.employmentType]].filter(Boolean).join(' · '))}</td>${
                        canViewSensitiveProfInfo ? `<td class="mono">${escapeHtml([prof.bankName, prof.bankAccount].filter(Boolean).join(' - ') || '-')}</td>` : ''
                      }<td>${summary.offeringCount}</td><td>${summary.rawUnits}</td><td>${summary.weeklyHours}</td><td><strong>${summary.equivalentUnits}</strong> <span class="muted">(${escapeHtml(rangeLabel)})</span>${ls.status === 'above_max' ? ' [بیش از سقف]' : ls.status === 'below_min' ? ' [زیر حداقل]' : ''}</td><td>${escapeHtml(summary.activeDays.map((d) => SCHED_DAY_LABELS[d]).join('، ') || '-')}</td></tr>`;
                    })
                    .join('')}</tbody></table>`;
                  printSchedHtml(`گزارش جامع اساتید، ساعات تدریس و واحد معادل - ${termLabel}`, html);
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>چاپ لیست کل اساتید</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const rows = professorRows.map(({ prof, summary }) => {
                    const ls = evaluateProfessorEquivalentUnitStatus(
                      prof,
                      summary.equivalentUnits,
                      rules
                    );
                    const base: Record<string, unknown> = {
                      'شماره شناسایی (کد استاد)': prof.professorCode,
                      'نام و نام خانوادگی': prof.fullName,
                      'جنس': prof.gender || '-',
                      'نام پدر': prof.fatherName || '-',
                      'گروه آموزشی': prof.departmentName || '-',
                      'واحد/مرکز': prof.unitCenterName || '-',
                      'مقطع (آخرین مدرک تحصیلی)': prof.degreeLevel || '-',
                      'رشته تحصیلی': prof.degreeField || '-',
                      'گرایش تحصیلی': prof.degreeSpecialization || '-',
                      'پایه': prof.academicStep || '-',
                      'مرتبه علمی': prof.academicRank || '-',
                      'وضعیت استخدامی': prof.employmentStatusRaw || SCHED_EMPLOYMENT_LABELS[prof.employmentType],
                      'تلفن همراه': prof.mobile || prof.phone || '-',
                      'تلفن ثابت': prof.landlinePhone || '-',
                    };
                    if (canViewSensitiveProfInfo) {
                      base['بانک'] = prof.bankName || '-';
                      base['شماره حساب'] = prof.bankAccount || '-';
                    }
                    base['تعداد دروس'] = summary.offeringCount;
                    base['واحد نظری'] = summary.theoreticalUnits;
                    base['واحد عملی'] = summary.practicalUnits;
                    base['جمع واحد خام'] = summary.rawUnits;
                    base['مجموع ساعات تدریس هفتگی'] = summary.weeklyHours;
                    base['جمع واحد معادل'] = summary.equivalentUnits;
                    base['حداقل واحد معادل مجاز'] = ls.bounds.minEquivalentUnits;
                    base['حداکثر واحد معادل مجاز'] =
                      ls.bounds.maxEquivalentUnits > 0 ? ls.bounds.maxEquivalentUnits : 'نامحدود';
                    base['وضعیت سقف/کف'] =
                      ls.status === 'above_max'
                        ? 'اخطار: بیش از سقف مجاز'
                        : ls.status === 'below_min'
                        ? 'اخطار: کمتر از حداقل موظفی'
                        : 'مجاز';
                    base['روزهای تدریس'] = summary.activeDays
                      .map((d) => SCHED_DAY_LABELS[d])
                      .join('، ');
                    return base;
                  });
                  void exportJsonRowsToExcel(rows, 'گزارش اساتید', `گزارش_جامع_اساتید_${selectedTerm}.xlsx`);
                }}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>خروجی اکسل اساتید</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 text-right">
                  <th className="p-3">کد استاد</th>
                  <th className="p-3">نام استاد و مدرک</th>
                  <th className="p-3">وضعیت استخدامی</th>
                  {canViewSensitiveProfInfo && <th className="p-3">حساب بانکی / تماس</th>}
                  <th className="p-3 text-center">تعداد درس</th>
                  <th className="p-3 text-center">واحد خام (نظری+عملی)</th>
                  <th className="p-3 text-center">ساعات تدریس</th>
                  <th className="p-3 text-center">واحد معادل</th>
                  <th className="p-3">روزهای حضور</th>
                  <th className="p-3 text-center">برنامه هفتگی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                {professorRows.map(({ prof, summary }) => {
                  const limitStatus = evaluateProfessorEquivalentUnitStatus(
                    prof,
                    summary.equivalentUnits,
                    rules
                  );
                  return (
                  <tr
                    key={prof.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                      selectedProfId === prof.id ? 'bg-teal-50/50 dark:bg-teal-950/20' : ''
                    }`}
                  >
                    <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {prof.professorCode}
                    </td>
                    <td className="p-3">
                      <div className="font-extrabold text-slate-900 dark:text-white">{prof.fullName}</div>
                      <div className="text-[11px] text-slate-500">
                        {prof.degreeLevel || prof.degreeField
                          ? `مقطع: ${prof.degreeLevel || '—'} · رشته: ${prof.degreeField || '—'}${prof.degreeSpecialization ? ` (${prof.degreeSpecialization})` : ''}`
                          : prof.degreeFull || '-'}
                      </div>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      <div>{prof.academicRank || SCHED_EMPLOYMENT_LABELS[prof.employmentType]}</div>
                      {prof.departmentName && (
                        <div className="text-[10.5px] text-slate-400">{prof.departmentName}</div>
                      )}
                    </td>
                    {canViewSensitiveProfInfo && (
                      <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-300" dir="ltr">
                        <div>
                          {prof.bankName ? `${prof.bankName}: ` : ''}
                          {prof.bankAccount || 'بدون شماره حساب'}
                        </div>
                        <div className="text-slate-400">{prof.mobile || prof.phone || '-'}</div>
                      </td>
                    )}
                    <td className="p-3 text-center">{summary.offeringCount}</td>
                    <td className="p-3 text-center">
                      <strong>{summary.rawUnits}</strong>{' '}
                      <span className="text-[10px] text-slate-400">
                        ({summary.theoreticalUnits}+{summary.practicalUnits})
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold">{summary.weeklyHours} ساعت</td>
                    <td className="p-3 text-center">
                      <div className="font-black text-teal-700 dark:text-teal-400 text-sm">
                        {summary.equivalentUnits}
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold">
                        {limitStatus.bounds.minEquivalentUnits > 0
                          ? `حداقل ${limitStatus.bounds.minEquivalentUnits}`
                          : '۰'}{' '}
                        تا{' '}
                        {limitStatus.bounds.maxEquivalentUnits > 0
                          ? limitStatus.bounds.maxEquivalentUnits
                          : 'نامحدود'}
                      </div>
                      {limitStatus.status !== 'ok' && (
                        <div
                          className="inline-flex items-center gap-0.5 mt-0.5 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-[9.5px] font-bold"
                          title={limitStatus.message || ''}
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>
                            {limitStatus.status === 'above_max' ? 'بیش از سقف' : 'زیر حداقل'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-[11px] text-slate-600 dark:text-slate-300">
                      {summary.activeDays.map((d) => SCHED_DAY_LABELS[d]).join('، ') || '—'}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedProfId(prof.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-600 hover:text-white text-[11px] font-bold transition cursor-pointer"
                      >
                        مشاهده برنامه
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selectedProfessorObj && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    جدول برنامه هفتگی و جزئیات دروس استاد: {selectedProfessorObj.fullName} (کد{' '}
                    <span className="font-mono">{selectedProfessorObj.professorCode}</span>)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {SCHED_EMPLOYMENT_LABELS[selectedProfessorObj.employmentType]} ·{' '}
                    {selectedProfessorObj.degreeFull}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    printSchedHtml(
                      `برنامه هفتگی استاد ${selectedProfessorObj.fullName} (کد ${selectedProfessorObj.professorCode}) - ${termLabel}`,
                      renderMatrixTableHtml(
                        activeDays,
                        sortedSlots,
                        selectedProfessorOfferings,
                        rules,
                        'professor'
                      )
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>چاپ برنامه استاد</span>
                </button>
              </div>
              {renderWeeklyMatrix(selectedProfessorOfferings, 'professor')}
            </div>
          )}
        </div>
      )}

      {/* ۷. پایش دروس مشترک ۷ رقمی، کسری‌ها و تداخل‌ها */}
      {activeReport === 'shared_conflicts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 tabular-nums">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-[11px] text-slate-500">دروس مشترک بین چند رشته/ورودی</div>
              <div className="text-xl font-black text-indigo-700 dark:text-indigo-400 mt-1">
                {auditData.sharedOfferings.length}
              </div>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-[11px] text-slate-500">دارای تداخل یا هشدار ظرفیت</div>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {auditData.conflicts.length}
              </div>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-[11px] text-slate-500">بدون استاد</div>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {auditData.missingProf.length}
              </div>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-[11px] text-slate-500">بدون کلاس فیزیکی / بدون سانس</div>
              <div className="text-xl font-black text-slate-800 dark:text-slate-200 mt-1">
                {auditData.missingRoom.length} / {auditData.unscheduled.length}
              </div>
            </div>
          </div>

          {/* جدول دروس مشترک کد ۷ رقمی */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span>فهرست دروس مشترک‌سازی‌شده (بر اساس یکسان بودن کد ۷ رقمی درس)</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-right">
                    <th className="p-3">کد درس ۷ رقمی</th>
                    <th className="p-3">عنوان درس</th>
                    <th className="p-3">رشته و ورودی میزبان</th>
                    <th className="p-3">رشته‌ها / ورودی‌های مشترک</th>
                    <th className="p-3">تعداد کل دانشجو</th>
                    <th className="p-3">استاد و زمان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditData.sharedOfferings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        هنوز درسی به‌صورت مشترک بین چند رشته یا ورودی ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    auditData.sharedOfferings.map((o) => (
                      <tr key={o.id}>
                        <td className="p-3 font-mono font-bold text-indigo-700 dark:text-indigo-300">
                          {o.courseCode}
                        </td>
                        <td className="p-3 font-bold">{o.courseTitle}</td>
                        <td className="p-3">
                          {o.ownerMajorName} ({o.entryTerm}
                          {o.sectionName ? ` - ${o.sectionName}` : ''})
                        </td>
                        <td className="p-3">
                          {o.sharedWithTargets
                            ?.map(
                              (t) =>
                                `${t.majorName} (${t.entryTerm}${t.sectionName ? ` - ${t.sectionName}` : ''})`
                            )
                            .join(' ، ')}
                        </td>
                        <td className="p-3 font-mono tabular-nums">{o.enrolledCount} نفر</td>
                        <td className="p-3">
                          {o.professorName || '—'} ·{' '}
                          {o.dayOfWeek ? SCHED_DAY_LABELS[o.dayOfWeek] : 'بدون زمان'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* تداخل‌ها و کسری منابع */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>موارد نیازمند بررسی (تداخل‌های زمانی، کمبود ظرفیت یا عدم تعیین استاد/کلاس)</span>
            </h3>
            {auditData.conflicts.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>تمام دروس برنامه‌ریزی‌شده این ترم بدون تداخل زمانی و دارای منابع کامل هستند.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {auditData.conflicts.map(({ offering, errors, warnings }) => (
                  <div
                    key={offering.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs space-y-1"
                  >
                    <div className="font-extrabold text-slate-900 dark:text-white">
                      {offering.courseTitle} (<span className="font-mono">{offering.courseCode}</span>) —{' '}
                      {offering.ownerMajorName} ({offering.entryTerm}
                      {offering.sectionName ? ` - ${offering.sectionName}` : ''}) ·{' '}
                      {SCHED_PRACTICAL_TYPE_LABELS[offering.practicalType]}
                    </div>
                    {errors.map((err, i) => (
                      <div key={`e_${i}`} className="text-rose-600 dark:text-rose-400 font-bold">
                        • خطای تداخل: {err}
                      </div>
                    ))}
                    {warnings.map((w, i) => (
                      <div key={`w_${i}`} className="text-amber-700 dark:text-amber-300">
                        • هشدار: {w}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {auditData.disabledOfferings.length > 0 && (
            <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/25 p-4 space-y-2.5">
              <h3 className="text-xs font-extrabold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>
                  دروس غیرفعال‌شده و بدون استاد (نیازمند تخصیص استاد جدید:{' '}
                  {auditData.disabledOfferings.length.toLocaleString('fa-IR')} مورد)
                </span>
              </h3>
              <div className="space-y-1.5">
                {auditData.disabledOfferings.map((o) => (
                  <div
                    key={o.id}
                    className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {o.courseTitle}
                      </span>{' '}
                      (<span className="font-mono">{o.courseCode}</span>) — {o.ownerMajorName} (
                      {o.entryTerm}
                      {o.sectionName ? ` - ${o.sectionName}` : ''})
                      {o.disabledReason && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                          {o.disabledReason}
                        </div>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold text-[11px]">
                      غیرفعال · بدون استاد
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
