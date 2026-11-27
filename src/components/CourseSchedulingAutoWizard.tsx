import React, { useMemo, useState } from 'react';
import {
  SchedClassroom,
  SchedCourseOffering,
  SchedCurriculumCourse,
  SchedProfessor,
  SchedProgramCohort,
  SchedRulesSettings,
  SchedWorkspaceRole,
} from '../types';
import {
  SCHED_DAY_LABELS,
  SCHED_PRACTICAL_TYPE_LABELS,
  SmartSchedulerResult,
  calculateOfferingBreakdown,
  formatGolestanCourseCode,
  formatOfferingSessionsSummary,
  formatProfessorDepartmentAndField,
  getSchedSlotTitle,
  getSelectedTermCoursesForCohort,
  normalizeSchedCode,
  round2,
  runSmartAutoScheduler,
} from '../utils/schedulingUtils';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface CourseSchedulingAutoWizardProps {
  activeTerm: string;
  classrooms: SchedClassroom[];
  programs: SchedProgramCohort[];
  professors: SchedProfessor[];
  courses: SchedCurriculumCourse[];
  existingOfferings: SchedCourseOffering[];
  rules: SchedRulesSettings;
  actor: { id: string; name: string; role: SchedWorkspaceRole };
  allowedMajorFilter?: string[]; // اگر مدیر گروه رشته‌های مشخصی دارد
  onApplyScheduledOfferings: (newOfferings: SchedCourseOffering[]) => void;
}

interface WizardQueuedCourse {
  rowId: string;
  courseId: string;
  cohortId: string;
  sectionId?: string;
  enrolledCount: number;
  preferredProfessorId?: string;
  preferredRoomId?: string;
}

export const CourseSchedulingAutoWizard: React.FC<CourseSchedulingAutoWizardProps> = ({
  activeTerm,
  classrooms,
  programs,
  professors,
  courses,
  existingOfferings,
  rules,
  actor,
  allowedMajorFilter,
  onApplyScheduledOfferings,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // رشته‌ها و ورودی‌های قابل برنامه‌ریزی
  const visiblePrograms = useMemo(() => {
    if (!allowedMajorFilter || allowedMajorFilter.length === 0) return programs;
    const matched = programs.filter((p) =>
      allowedMajorFilter.some(
        (m) =>
          p.majorName.includes(m) ||
          m.includes(p.majorName) ||
          normalizeSchedCode(p.majorCode) === normalizeSchedCode(m)
      )
    );
    return matched.length > 0 ? matched : programs;
  }, [programs, allowedMajorFilter]);

  const [selectedCohortId, setSelectedCohortId] = useState<string>(visiblePrograms[0]?.id || '');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [courseSearch, setCourseSearch] = useState('');
  const [queuedItems, setQueuedItems] = useState<WizardQueuedCourse[]>([]);

  // ترجیحات و محدودیت‌های اساتید در پرسش‌نامه
  const [unavailableProfSlots, setUnavailableProfSlots] = useState<Record<string, string[]>>({});
  const [focusProfessorId, setFocusProfessorId] = useState<string>(professors[0]?.id || '');

  // سوالات ترجیحات برنامه‌ریزی
  const [compactMode, setCompactMode] = useState<'compact_days' | 'spread_evenly'>('compact_days');
  const [timePreference, setTimePreference] = useState<'morning' | 'afternoon' | 'any'>('morning');
  const [maxHoursPerDay, setMaxHoursPerDay] = useState<number>(8);
  const [strictRoomCapacity, setStrictRoomCapacity] = useState<boolean>(true);
  const [strictRoomType, setStrictRoomType] = useState<boolean>(true);

  const [previewResult, setPreviewResult] = useState<SmartSchedulerResult | null>(null);
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  const selectedCohort = visiblePrograms.find((p) => p.id === selectedCohortId) || null;
  const activeSections = selectedCohort?.sections || [];

  const candidateCourses = useMemo(() => {
    if (!selectedCohort) return [];
    const termState = getSelectedTermCoursesForCohort({
      termKey: activeTerm,
      cohortId: selectedCohort.id,
      majorCode: selectedCohort.majorCode,
      allCourses: courses,
      rules,
    });
    const q = courseSearch.trim().toLowerCase();
    return termState.selectedCourses.filter((c) => {
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        normalizeSchedCode(c.courseCode).includes(normalizeSchedCode(q))
      );
    });
  }, [courses, selectedCohort, courseSearch, activeTerm, rules]);

  const handleAddCourseToQueue = (course: SchedCurriculumCourse) => {
    if (!selectedCohort) return;
    const sec = activeSections.find((s) => s.id === selectedSectionId);
    const defaultCount = sec ? sec.studentCount : selectedCohort.totalStudents || 25;
    setQueuedItems((prev) => [
      ...prev,
      {
        rowId: `wq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        courseId: course.id,
        cohortId: selectedCohort.id,
        sectionId: sec?.id,
        enrolledCount: defaultCount,
      },
    ]);
  };

  const handleToggleProfUnavail = (profId: string, dayKey: string, slotId: string) => {
    const key = `${dayKey}:${slotId}`;
    setUnavailableProfSlots((prev) => {
      const current = new Set(prev[profId] || []);
      if (current.has(key)) current.delete(key);
      else current.add(key);
      return { ...prev, [profId]: Array.from(current) };
    });
  };

  const handleRunWizardSolver = () => {
    const coursesToSchedule = queuedItems
      .map((q) => {
        const course = courses.find((c) => c.id === q.courseId);
        const cohort = programs.find((p) => p.id === q.cohortId);
        if (!course || !cohort) return null;
        const sec = cohort.sections.find((s) => s.id === q.sectionId);
        return {
          course,
          cohort,
          sectionId: sec?.id,
          sectionName: sec?.name,
          enrolledCount: q.enrolledCount,
          preferredProfessorId: q.preferredProfessorId,
          preferredRoomId: q.preferredRoomId,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const res = runSmartAutoScheduler(
      {
        termKey: activeTerm,
        coursesToSchedule,
        unavailableProfSlots,
        compactMode,
        timePreference,
        maxHoursPerCohortPerDay: maxHoursPerDay,
        strictRoomCapacity,
        strictRoomType,
      },
      existingOfferings.filter((o) => !o.isDisabled),
      classrooms,
      professors,
      rules,
      actor
    );
    setPreviewResult(res);
    setAppliedFeedback(null);
    setStep(4);
  };

  const handleCommitSchedule = () => {
    if (!previewResult || previewResult.placedOfferings.length === 0) return;
    onApplyScheduledOfferings(previewResult.placedOfferings);
    setAppliedFeedback(
      `${previewResult.placedOfferings.length.toLocaleString('fa-IR')} درس با موفقیت به برنامه هفتگی نیمسال ${activeTerm} اضافه شد.`
    );
  };

  const sortedSlots = useMemo(
    () => [...rules.timeSlots].sort((a, b) => a.order - b.order),
    [rules.timeSlots]
  );

  return (
    <div className="space-y-5">
      {/* هدر و نوار مراحل پرسش‌نامه */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                دستیار هوشمند چینش خودکار برنامه هفتگی (نیمسال {activeTerm})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                با پاسخ به سوالات زیر، سامانه برنامه را بدون تداخل کلاس، استاد و ورودی تولید و پیش‌نمایش می‌کند.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            {[
              { n: 1, title: '۱. انتخاب دروس و ورودی' },
              { n: 2, title: '۲. اساتید و محدودیت حضور' },
              { n: 3, title: '۳. اولویت‌های چینش' },
              { n: 4, title: '۴. پیش‌نمایش و ثبت' },
            ].map((item) => (
              <button
                key={item.n}
                type="button"
                onClick={() => setStep(item.n as 1 | 2 | 3 | 4)}
                className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  step === item.n
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>

        {/* گام ۱: انتخاب ورودی، شعبه و دروس */}
        {step === 1 && (
          <div className="pt-5 space-y-5">
            {visiblePrograms.length === 0 || courses.length === 0 ? (
              <div className="p-6 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-200">
                ابتدا از بخش «اطلاعات اولیه»، رشته‌ها/ورودی‌ها و لیست دروس رشته‌ها را ثبت یا از اکسل بارگذاری نمایید.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* پنل انتخاب */}
                <div className="lg:col-span-5 space-y-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                    انتخاب رشته، ورودی و شعبه هدف
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        رشته و ورودی
                      </label>
                      <select
                        value={selectedCohortId}
                        onChange={(e) => {
                          setSelectedCohortId(e.target.value);
                          setSelectedSectionId('');
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      >
                        {visiblePrograms.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.majorName} ({p.majorCode}) — ورودی {p.entryTerm}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        شعبه / گروه
                      </label>
                      <select
                        value={selectedSectionId}
                        onChange={(e) => setSelectedSectionId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      >
                        <option value="">کل ورودی ({selectedCohort?.totalStudents || 0} نفر)</option>
                        {activeSections.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.studentCount} نفر)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      placeholder="جستجوی نام یا کد ۷ رقمی درس..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900">
                    {candidateCourses.length === 0 ? (
                      <div className="p-4 text-center text-xs text-amber-700 dark:text-amber-300 font-bold">
                        هنوز درسی از سرفصل این رشته برای ارائه در ترم {activeTerm} انتخاب نشده است. ابتدا در بخش «دروس قابل ارائه ترم» دروس این ورودی را تیک بزنید.
                      </div>
                    ) : (
                      candidateCourses.map((c) => {
                        const bd = calculateOfferingBreakdown(c, rules);
                        return (
                          <div
                            key={c.id}
                            className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {c.title}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                                {c.courseCode} · {c.theoreticalUnits} نظ + {c.practicalUnits} عم ({bd.weeklyHours} ساعت)
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddCourseToQueue(c)}
                              className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>افزودن</span>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* لیست صف‌شده برای چینش */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                      دروس انتخاب‌شده جهت چینش خودکار ({queuedItems.length.toLocaleString('fa-IR')} مورد)
                    </div>
                    {queuedItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setQueuedItems([])}
                        className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        پاک کردن لیست
                      </button>
                    )}
                  </div>

                  {queuedItems.length === 0 ? (
                    <div className="p-10 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
                      از ستون سمت راست، دروس مورد نظر هر ورودی/شعبه را به لیست چینش اضافه کنید.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="p-2.5">درس (کد ۷ رقمی)</th>
                            <th className="p-2.5">ورودی / شعبه</th>
                            <th className="p-2.5">تعداد دانشجو</th>
                            <th className="p-2.5">استاد پیشنهادی</th>
                            <th className="p-2.5">کلاس ثابت</th>
                            <th className="p-2.5 text-center">حذف</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {queuedItems.map((item) => {
                            const crs = courses.find((c) => c.id === item.courseId);
                            const coh = programs.find((p) => p.id === item.cohortId);
                            const sec = coh?.sections.find((s) => s.id === item.sectionId);
                            if (!crs || !coh) return null;
                            return (
                              <tr key={item.rowId}>
                                <td className="p-2.5">
                                  <div className="font-bold text-slate-900 dark:text-white">{crs.title}</div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    {crs.courseCode} · {SCHED_PRACTICAL_TYPE_LABELS[crs.practicalType]}
                                  </div>
                                </td>
                                <td className="p-2.5 text-[11px] font-semibold">
                                  {coh.majorName} ({coh.entryTerm}){sec ? ` · ${sec.name}` : ''}
                                </td>
                                <td className="p-2.5 w-24">
                                  <input
                                    type="number"
                                    min={1}
                                    value={item.enrolledCount}
                                    onChange={(e) => {
                                      const val = Math.max(1, Number(e.target.value) || 1);
                                      setQueuedItems((prev) =>
                                        prev.map((x) =>
                                          x.rowId === item.rowId ? { ...x, enrolledCount: val } : x
                                        )
                                      );
                                    }}
                                    className="w-20 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono tabular-nums text-xs"
                                  />
                                </td>
                                <td className="p-2.5">
                                  <select
                                    value={item.preferredProfessorId || ''}
                                    onChange={(e) =>
                                      setQueuedItems((prev) =>
                                        prev.map((x) =>
                                          x.rowId === item.rowId
                                            ? { ...x, preferredProfessorId: e.target.value || undefined }
                                            : x
                                        )
                                      )
                                    }
                                    className="w-full min-w-[140px] px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                                  >
                                    <option value="">بدون تعیین قبلی</option>
                                    {professors
                                      .filter((p) => p.isActive !== false)
                                      .map((p) => {
                                        const deptField = formatProfessorDepartmentAndField(p);
                                        return (
                                          <option key={p.id} value={p.id}>
                                            {p.fullName} ({p.professorCode})
                                            {deptField ? ` · ${deptField}` : ''}
                                          </option>
                                        );
                                      })}
                                  </select>
                                </td>
                                <td className="p-2.5">
                                  <select
                                    value={item.preferredRoomId || ''}
                                    onChange={(e) =>
                                      setQueuedItems((prev) =>
                                        prev.map((x) =>
                                          x.rowId === item.rowId
                                            ? { ...x, preferredRoomId: e.target.value || undefined }
                                            : x
                                        )
                                      )
                                    }
                                    className="w-full min-w-[120px] px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                                  >
                                    <option value="">انتخاب هوشمند کلاس</option>
                                    {classrooms
                                      .filter((r) => r.isActive)
                                      .map((r) => (
                                        <option key={r.id} value={r.id}>
                                          {r.name} (ظرفیت {r.capacity})
                                        </option>
                                      ))}
                                  </select>
                                </td>
                                <td className="p-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setQueuedItems((prev) => prev.filter((x) => x.rowId !== item.rowId))
                                    }
                                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={queuedItems.length === 0}
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
              >
                <span>مرحله بعد: محدودیت زمانی اساتید</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* گام ۲: ساعات عدم حضور اساتید */}
        {step === 2 && (
          <div className="pt-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                  تعیین روزها و سانس‌های عدم حضور اساتید (اختیاری)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  روی هر سلول که استاد امکان حضور ندارد کلیک کنید تا الگوریتم در آن ساعت درسی قرار ندهد.
                </div>
              </div>
              <select
                value={focusProfessorId}
                onChange={(e) => setFocusProfessorId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold min-w-[220px]"
              >
                {professors.map((p) => {
                  const deptField = formatProfessorDepartmentAndField(p);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.fullName} (کد {p.professorCode})
                      {deptField ? ` · ${deptField}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {focusProfessorId ? (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-center text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/70">
                    <tr>
                      <th className="p-3 text-right">روز هفته / سانس</th>
                      {sortedSlots.map((slot, idx) => (
                        <th key={slot.id} className="p-2.5 text-center">
                          <div>{getSchedSlotTitle(slot, idx)}</div>
                          <div className="text-[10px] font-mono tabular-nums text-slate-500" dir="ltr">
                            {slot.startTime} - {slot.endTime}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rules.activeDays.map((day) => (
                      <tr key={day}>
                        <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-100">
                          {SCHED_DAY_LABELS[day]}
                        </td>
                        {sortedSlots.map((slot) => {
                          const key = `${day}:${slot.id}`;
                          const profBaseUnavail =
                            professors.find((p) => p.id === focusProfessorId)?.unavailableKeys || [];
                          const isBlocked =
                            (unavailableProfSlots[focusProfessorId] || []).includes(key) ||
                            profBaseUnavail.includes(key);
                          return (
                            <td key={slot.id} className="p-2">
                              <button
                                type="button"
                                onClick={() => handleToggleProfUnavail(focusProfessorId, day, slot.id)}
                                className={`w-full py-2 px-2 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                                  isBlocked
                                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                                    : 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-900 hover:bg-emerald-100/70'
                                }`}
                              >
                                {isBlocked ? 'عدم حضور' : 'آزاد'}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500">
                استادی ثبت نشده است؛ الگوریتم بدون محدودیت استاد اجرا خواهد شد.
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>مرحله قبل</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
              >
                <span>مرحله بعد: پرسش‌نامه اولویت‌های چینش</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* گام ۳: سوالات اولویت‌ها */}
        {step === 3 && (
          <div className="pt-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                  ۱. الگوی پراکندگی روزهای حضور دانشجویان
                </div>
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    checked={compactMode === 'compact_days'}
                    onChange={() => setCompactMode('compact_days')}
                    className="mt-0.5"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-slate-900 dark:text-white">
                      فشرده‌سازی در حداقل روزهای هفته (پیشنهادی)
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      دروس یک ورودی را تا سقف ساعت مجاز در روزهای کمتری متمرکز می‌کند تا تعداد روز حضور رشته کاهش یابد.
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    checked={compactMode === 'spread_evenly'}
                    onChange={() => setCompactMode('spread_evenly')}
                    className="mt-0.5"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-slate-900 dark:text-white">
                      توزیع متوازن در طول روزهای هفته
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      دروس را بین روزهای فعال هفته پخش می‌کند تا فشار کلاسی در هر روز پایین باشد.
                    </div>
                  </div>
                </label>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                  ۲. ترجیح سانس‌های زمانی و سقف روزانه
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  {[
                    { id: 'morning', label: 'اولویت با صبح' },
                    { id: 'afternoon', label: 'اولویت با بعدازظهر' },
                    { id: 'any', label: 'فرقی ندارد' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTimePreference(opt.id as typeof timePreference)}
                      className={`py-2 px-2 rounded-xl border transition cursor-pointer ${
                        timePreference === opt.id
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    حداکثر ساعت کلاس روزانه برای هر ورودی/شعبه: <span className="font-mono tabular-nums">{maxHoursPerDay}</span> ساعت
                  </label>
                  <input
                    type="range"
                    min={4}
                    max={12}
                    step={2}
                    value={maxHoursPerDay}
                    onChange={(e) => setMaxHoursPerDay(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={strictRoomCapacity}
                      onChange={(e) => setStrictRoomCapacity(e.target.checked)}
                    />
                    <span>رعایت الزامی ظرفیت کلاس فیزیکی متناسب با تعداد دانشجویان</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={strictRoomType}
                      onChange={(e) => setStrictRoomType(e.target.checked)}
                    />
                    <span>تطبیق هوشمند نوع کلاس (کارگاه / آزمایشگاه / کلاس عادی)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>مرحله قبل</span>
              </button>
              <button
                type="button"
                onClick={handleRunWizardSolver}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>اجرای چینش هوشمند و مشاهده پیش‌نمایش</span>
              </button>
            </div>
          </div>
        )}

        {/* گام ۴: پیش‌نمایش و ثبت */}
        {step === 4 && previewResult && (
          <div className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] text-slate-500 font-bold">تعداد دروس درخواستی</div>
                <div className="text-xl font-black font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                  {previewResult.stats.requestedCount.toLocaleString('fa-IR')}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
                  جانمایی موفق بدون تداخل
                </div>
                <div className="text-xl font-black font-mono tabular-nums text-emerald-800 dark:text-emerald-200 mt-1">
                  {previewResult.stats.placedCount.toLocaleString('fa-IR')}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <div className="text-[11px] text-amber-700 dark:text-amber-300 font-bold">
                  چینش‌نشده (نیازمند اصلاح دستی)
                </div>
                <div className="text-xl font-black font-mono tabular-nums text-amber-800 dark:text-amber-200 mt-1">
                  {previewResult.stats.unplacedCount.toLocaleString('fa-IR')}
                </div>
              </div>
            </div>

            {appliedFeedback && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-xs font-extrabold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{appliedFeedback}</span>
              </div>
            )}

            {previewResult.unplacedReasons.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-1.5">
                <div className="text-xs font-extrabold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>دروس جانمایی‌نشده:</span>
                </div>
                {previewResult.unplacedReasons.map((u, i) => (
                  <div key={i} className="text-[11px] text-rose-700 dark:text-rose-300">
                    <span className="font-mono">{u.courseCode}</span> · {u.courseTitle} ({u.cohortLabel}): {u.reason}
                  </div>
                ))}
              </div>
            )}

            {previewResult.placedOfferings.length > 0 && (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/70">
                    <tr>
                      <th className="p-2.5">درس (کد ۷ رقمی)</th>
                      <th className="p-2.5">رشته / ورودی</th>
                      <th className="p-2.5">روز و سانس</th>
                      <th className="p-2.5">کلاس فیزیکی</th>
                      <th className="p-2.5">استاد</th>
                      <th className="p-2.5">ساعت / واحد معادل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewResult.placedOfferings.map((o) => {
                      const bd = calculateOfferingBreakdown(o, rules);
                      const golestanCode = formatGolestanCourseCode(o.courseCode, o.courseGroupCode);
                      const scheduleSummary = formatOfferingSessionsSummary(o, sortedSlots, true);
                      return (
                        <tr
                          key={o.id}
                          title={o.disabledReason || undefined}
                          className={
                            o.isProvisional || o.isDisabled
                              ? 'bg-amber-50/75 dark:bg-amber-950/25'
                              : ''
                          }
                        >
                          <td className="p-2.5">
                            <div className="font-bold text-slate-900 dark:text-white">{o.courseTitle}</div>
                            <div className="text-[11px] text-slate-500 font-mono" dir="ltr">
                              {golestanCode}
                            </div>
                            {(o.isProvisional || o.isDisabled) && (
                              <div className="text-[10px] font-black text-amber-800 dark:text-amber-300 mt-0.5">
                                ⚠ موقت / نیازمند تکمیل ({o.disabledReason || 'استاد یا کلاس'})
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 text-[11px] font-semibold">
                            {o.ownerMajorName} ({o.entryTerm}){o.sectionName ? ` · ${o.sectionName}` : ''}
                          </td>
                          <td className="p-2.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                            {scheduleSummary}
                          </td>
                          <td className="p-2.5 text-[11px]">{o.classroomName || 'کارورزی / بدون کلاس'}</td>
                          <td className="p-2.5 text-[11px]">{o.professorName || 'تعیین‌نشده'}</td>
                          <td className="p-2.5 text-[11px] font-mono tabular-nums">
                            {bd.weeklyHours} ساعت · {round2(bd.equivalentUnits)} معادل
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>تغییر تنظیمات و اجرای مجدد</span>
              </button>
              <button
                type="button"
                disabled={previewResult.placedOfferings.length === 0 || Boolean(appliedFeedback)}
                onClick={handleCommitSchedule}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تأیید و ثبت نهایی در برنامه هفتگی</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
