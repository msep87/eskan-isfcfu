import React, { useMemo, useState } from 'react';
import {
  SchedClassroom,
  SchedCourseOffering,
  SchedCurriculumCourse,
  SchedDayKey,
  SchedProfessor,
  SchedProgramCohort,
  SchedRulesSettings,
  SchedSlotHalf,
  SchedTimeSlot,
} from '../types';
import {
  SCHED_DAY_LABELS,
  SCHED_ROOM_TYPE_LABELS,
  calculateOfferingBreakdown,
  calculateProfessorLoadSummary,
  detectOfferingConflicts,
  exportJsonRowsToExcel,
  getOfferingSlotHalf,
  getSchedSlotTitle,
  getSlotHalfLabel,
  normalizePersianText,
  printSchedHtml,
  round2,
} from '../utils/schedulingUtils';
import { escapeHtml } from '../utils/sanitizeHtml';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Building2,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  Filter,
  GripVertical,
  Layers,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

interface CourseSchedulingMasterGridProps {
  activeTerm: string;
  offerings: SchedCourseOffering[];
  termOfferings: SchedCourseOffering[];
  programs: SchedProgramCohort[];
  classrooms: SchedClassroom[];
  professors: SchedProfessor[];
  courses: SchedCurriculumCourse[];
  rules: SchedRulesSettings;
  activeDays: SchedDayKey[];
  sortedSlots: SchedTimeSlot[];
  canManageMasterData: boolean;
  userRole: 'admin' | 'academic_deputy' | 'department_head';
  actor: { id: string; name: string };
  isOwnMajorName: (majorName: string) => boolean;
  onPersistOfferings: (next: SchedCourseOffering[]) => void;
  onOpenNewOffering: (opts: {
    cohortId: string;
    sectionId?: string;
    dayOfWeek: SchedDayKey;
    slotId: string;
    slotHalf?: SchedSlotHalf;
  }) => void;
  onOpenEditOffering: (offering: SchedCourseOffering) => void;
  onNotify: (type: 'success' | 'error', text: string) => void;
}

interface MasterRowRaw {
  rowKey: string;
  cohortId: string;
  majorCode: string;
  majorName: string;
  entryTerm: string;
  totalCohortStudents: number;
  sectionId?: string;
  sectionName: string;
  sectionStudentCount: number;
  majorGroupIdx: number;
}

interface MasterRowDisplay extends MasterRowRaw {
  isFirstInMajor: boolean;
  majorRowSpan: number;
  isFirstInCohort: boolean;
  cohortRowSpan: number;
}

type FocusMode = 'none' | 'course' | 'professor' | 'classroom';

const DAY_HEADER_PALETTES = [
  'bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200',
  'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200',
  'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200',
  'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
  'bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200',
  'bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200',
  'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200',
];

const MAJOR_BADGE_PALETTES = [
  'bg-fuchsia-50/70 dark:bg-fuchsia-950/20 border-r-4 border-r-fuchsia-500',
  'bg-sky-50/70 dark:bg-sky-950/20 border-r-4 border-r-sky-500',
  'bg-emerald-50/70 dark:bg-emerald-950/20 border-r-4 border-r-emerald-500',
  'bg-amber-50/70 dark:bg-amber-950/20 border-r-4 border-r-amber-500',
  'bg-indigo-50/70 dark:bg-indigo-950/20 border-r-4 border-r-indigo-500',
  'bg-teal-50/70 dark:bg-teal-950/20 border-r-4 border-r-teal-500',
];

export const CourseSchedulingMasterGrid: React.FC<CourseSchedulingMasterGridProps> = ({
  activeTerm,
  offerings,
  termOfferings,
  programs,
  classrooms,
  professors,
  courses,
  rules,
  activeDays,
  sortedSlots,
  canManageMasterData,
  actor,
  isOwnMajorName,
  onPersistOfferings,
  onOpenNewOffering,
  onOpenEditOffering,
  onNotify,
}) => {
  // فیلترهای سطر و تمرکز فراگیر
  const [rowSearch, setRowSearch] = useState('');
  const [majorFilter, setMajorFilter] = useState('all');
  const [entryFilter, setEntryFilter] = useState('all');
  const [alwaysShowHalfSlots, setAlwaysShowHalfSlots] = useState(false);

  // تمرکز فراگیر روی درس / استاد / کلاس
  const [focusMode, setFocusMode] = useState<FocusMode>('none');
  const [focusCourseCode, setFocusCourseCode] = useState('');
  const [focusProfId, setFocusProfId] = useState('');
  const [focusRoomId, setFocusRoomId] = useState('');
  const [hideUnmatchedRows, setHideUnmatchedRows] = useState(false);

  // کشیدن و رها کردن (Drag & Drop) در همان ردیف
  const [draggingState, setDraggingState] = useState<{
    offeringId: string;
    rowKey: string;
    fromDay?: SchedDayKey;
    fromSlotIds: string[];
  } | null>(null);
  const [dragOverTargetKey, setDragOverTargetKey] = useState<string | null>(null);

  // پنجره بررسی و رفع تداخل در صورت بروز تداخل پس از رها کردن
  const [pendingDrop, setPendingDrop] = useState<{
    originalOffering: SchedCourseOffering;
    targetDay: SchedDayKey;
    targetSlotIds: string[];
    targetSlotParts?: Record<string, SchedSlotHalf>;
    pickedProfessorId: string;
    pickedClassroomId: string;
  } | null>(null);

  // بازگردانی آخرین حرکت (Undo)
  const [undoSnapshot, setUndoSnapshot] = useState<{
    prevOfferings: SchedCourseOffering[];
    label: string;
  } | null>(null);

  const uniqueMajors = useMemo(() => {
    const map = new Map<string, string>();
    programs.forEach((p) => map.set(p.majorCode, p.majorName));
    return Array.from(map.entries())
      .map(([majorCode, majorName]) => ({ majorCode, majorName }))
      .sort((a, b) => a.majorName.localeCompare(b.majorName, 'fa'));
  }, [programs]);

  const uniqueEntries = useMemo(() => {
    return Array.from(new Set(programs.map((p) => p.entryTerm))).sort((a, b) =>
      b.localeCompare(a, 'en')
    );
  }, [programs]);

  const uniqueCoursesCatalog = useMemo(() => {
    const map = new Map<string, { courseCode: string; title: string; majorNames: string[] }>();
    for (const c of courses) {
      const existing = map.get(c.courseCode);
      if (existing) {
        if (!existing.majorNames.includes(c.majorName)) existing.majorNames.push(c.majorName);
      } else {
        map.set(c.courseCode, {
          courseCode: c.courseCode,
          title: c.title,
          majorNames: [c.majorName],
        });
      }
    }
    for (const o of termOfferings) {
      if (!map.has(o.courseCode)) {
        map.set(o.courseCode, {
          courseCode: o.courseCode,
          title: o.courseTitle,
          majorNames: [o.ownerMajorName],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title, 'fa'));
  }, [courses, termOfferings]);

  // بررسی مجوز ویرایش/جابجایی یک درس
  const canEditOffering = (o: SchedCourseOffering): boolean => {
    if (canManageMasterData) return true;
    if (o.createdById === actor.id) return true;
    if (isOwnMajorName(o.ownerMajorName)) return true;
    const crs = courses.find((c) => c.id === o.courseId || c.courseCode === o.courseCode);
    if (crs && isOwnMajorName(crs.majorName)) return true;
    return false;
  };

  // تطابق یک ارائه با سطر موردنظر (میزبان یا مشترک)
  const doesOfferingBelongToRow = (o: SchedCourseOffering, row: MasterRowRaw): boolean => {
    if (o.cohortId === row.cohortId) {
      if (!o.sectionId || !row.sectionId || o.sectionId === row.sectionId) return true;
    }
    if (o.sharedWithTargets && o.sharedWithTargets.length > 0) {
      return o.sharedWithTargets.some(
        (t) =>
          t.cohortId === row.cohortId && (!t.sectionId || !row.sectionId || t.sectionId === row.sectionId)
      );
    }
    return false;
  };

  // بررسی تطابق ارائه با حالت تمرکز (فوکوس) فعال
  const isFocusActive =
    (focusMode === 'course' && Boolean(focusCourseCode)) ||
    (focusMode === 'professor' && Boolean(focusProfId)) ||
    (focusMode === 'classroom' && Boolean(focusRoomId));

  const doesOfferingMatchFocus = (o: SchedCourseOffering): boolean => {
    if (!isFocusActive) return false;
    if (focusMode === 'course') return o.courseCode === focusCourseCode;
    if (focusMode === 'professor') return o.professorId === focusProfId;
    if (focusMode === 'classroom') return o.classroomId === focusRoomId;
    return false;
  };

  // ساخت تمام سطرهای خام بر اساس رشته -> ورودی -> شعبه
  const allRawRows = useMemo<MasterRowRaw[]>(() => {
    const sortedProgs = [...programs].sort((a, b) => {
      const mCmp = a.majorName.localeCompare(b.majorName, 'fa');
      if (mCmp !== 0) return mCmp;
      return b.entryTerm.localeCompare(a.entryTerm, 'en');
    });
    const majorIndexMap = new Map<string, number>();
    let mIdxCounter = 0;

    const rows: MasterRowRaw[] = [];
    for (const p of sortedProgs) {
      if (!majorIndexMap.has(p.majorCode)) {
        majorIndexMap.set(p.majorCode, mIdxCounter++);
      }
      const mIdx = majorIndexMap.get(p.majorCode) || 0;
      const secs =
        p.sections.length > 0
          ? p.sections
          : [{ id: '', name: 'کل ورودی', studentCount: p.totalStudents || 0 }];

      secs.forEach((sec) => {
        rows.push({
          rowKey: `${p.id}::${sec.id || 'ALL'}`,
          cohortId: p.id,
          majorCode: p.majorCode,
          majorName: p.majorName,
          entryTerm: p.entryTerm,
          totalCohortStudents: p.totalStudents,
          sectionId: sec.id || undefined,
          sectionName: sec.name,
          sectionStudentCount: sec.studentCount,
          majorGroupIdx: mIdx,
        });
      });
    }
    return rows;
  }, [programs]);

  // فیلتر کردن سطرها و محاسبه rowSpan دقیق برای نمایش شبیه گوگل شیت
  const displayRows = useMemo<MasterRowDisplay[]>(() => {
    const q = normalizePersianText(rowSearch).toLowerCase();
    const filtered = allRawRows.filter((r) => {
      if (majorFilter !== 'all' && r.majorCode !== majorFilter) return false;
      if (entryFilter !== 'all' && r.entryTerm !== entryFilter) return false;
      if (q) {
        const hay = normalizePersianText(
          `${r.majorName} ${r.majorCode} ${r.entryTerm} ${r.sectionName}`
        ).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (isFocusActive && hideUnmatchedRows) {
        const rowOffs = termOfferings.filter((o) => doesOfferingBelongToRow(o, r));
        if (!rowOffs.some(doesOfferingMatchFocus)) return false;
      }
      return true;
    });

    // محاسبه rowSpan برای ادغام عمودی رشته و ورودی
    const result: MasterRowDisplay[] = filtered.map((r) => ({
      ...r,
      isFirstInMajor: false,
      majorRowSpan: 1,
      isFirstInCohort: false,
      cohortRowSpan: 1,
    }));

    for (let i = 0; i < result.length; ) {
      let j = i + 1;
      while (j < result.length && result[j].majorCode === result[i].majorCode) j++;
      result[i].isFirstInMajor = true;
      result[i].majorRowSpan = j - i;
      i = j;
    }

    for (let i = 0; i < result.length; ) {
      let j = i + 1;
      while (j < result.length && result[j].cohortId === result[i].cohortId) j++;
      result[i].isFirstInCohort = true;
      result[i].cohortRowSpan = j - i;
      i = j;
    }

    return result;
  }, [
    allRawRows,
    majorFilter,
    entryFilter,
    rowSearch,
    isFocusActive,
    hideUnmatchedRows,
    termOfferings,
    focusMode,
    focusCourseCode,
    focusProfId,
    focusRoomId,
  ]);

  // خلاصه اطلاعات فوکوس فعال
  const focusSummary = useMemo(() => {
    if (!isFocusActive) return null;
    const matched = termOfferings.filter(doesOfferingMatchFocus);
    let totalHours = 0;
    const majorSet = new Set<string>();
    const profSet = new Set<string>();
    const roomSet = new Set<string>();

    for (const o of matched) {
      totalHours += calculateOfferingBreakdown(o, rules).weeklyHours;
      majorSet.add(`${o.ownerMajorName} (${o.entryTerm})`);
      o.sharedWithTargets?.forEach((t) => majorSet.add(`${t.majorName} (${t.entryTerm})`));
      if (o.professorName) profSet.add(o.professorName);
      if (o.classroomName) roomSet.add(o.classroomName);
    }

    const totalPossibleSlots = Math.max(1, activeDays.length * sortedSlots.length);
    const occupiedSlotCount = new Set(
      matched.flatMap((o) => (o.dayOfWeek ? o.slotIds.map((sid) => `${o.dayOfWeek}:${sid}`) : []))
    ).size;

    let label = '';
    if (focusMode === 'course') {
      const c = uniqueCoursesCatalog.find((x) => x.courseCode === focusCourseCode);
      label = c ? `درس «${c.title}» (کد ${c.courseCode})` : `کد درس ${focusCourseCode}`;
    } else if (focusMode === 'professor') {
      const p = professors.find((x) => x.id === focusProfId);
      const ld = p ? calculateProfessorLoadSummary(p.id, termOfferings, rules) : null;
      label = p
        ? `استاد «${p.fullName}» (کد ${p.professorCode}${ld ? ` · ${ld.equivalentUnits} معادل` : ''})`
        : 'استاد انتخاب‌شده';
    } else if (focusMode === 'classroom') {
      const r = classrooms.find((x) => x.id === focusRoomId);
      label = r
        ? `کلاس «${r.name}» (ظرفیت ${r.capacity} نفر · ${SCHED_ROOM_TYPE_LABELS[r.roomType]})`
        : 'کلاس انتخاب‌شده';
    }

    return {
      label,
      count: matched.length,
      totalHours: round2(totalHours),
      majorsCount: majorSet.size,
      professorsList: Array.from(profSet),
      roomsList: Array.from(roomSet),
      occupiedSlotCount,
      freeSlotCount: Math.max(0, totalPossibleSlots - occupiedSlotCount),
    };
  }, [
    isFocusActive,
    termOfferings,
    rules,
    activeDays.length,
    sortedSlots.length,
    focusMode,
    focusCourseCode,
    focusProfId,
    focusRoomId,
    uniqueCoursesCatalog,
    professors,
    classrooms,
  ]);

  const focusProfUnavailableSet = useMemo(() => {
    if (focusMode !== 'professor' || !focusProfId) return new Set<string>();
    const p = professors.find((x) => x.id === focusProfId);
    return new Set(p?.unavailableKeys || []);
  }, [focusMode, focusProfId, professors]);

  const focusRoomOccupiedSet = useMemo(() => {
    if (focusMode !== 'classroom' || !focusRoomId) return new Set<string>();
    const set = new Set<string>();
    termOfferings
      .filter((o) => o.classroomId === focusRoomId && o.dayOfWeek)
      .forEach((o) => {
        o.slotIds.forEach((sid) => set.add(`${o.dayOfWeek}:${sid}`));
      });
    return set;
  }, [focusMode, focusRoomId, termOfferings]);

  // منطق رها کردن کارت روی سلول در همان ردیف
  const handleDropOnCell = (
    e: React.DragEvent,
    targetRowKey: string,
    targetDay: SchedDayKey,
    targetSlotId: string,
    targetHalf?: SchedSlotHalf
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTargetKey(null);

    if (!draggingState) return;
    const dragged = termOfferings.find((o) => o.id === draggingState.offeringId);
    const sourceRowKey = draggingState.rowKey;
    setDraggingState(null);

    if (!dragged) return;
    if (!canEditOffering(dragged)) {
      onNotify('error', 'شما مجوز جابجایی این درس را ندارید.');
      return;
    }
    if (sourceRowKey !== targetRowKey) {
      onNotify('error', 'جابجایی درس با کشیدن فقط در امتداد همان ردیف (رشته/ورودی/شعبه) مجاز است.');
      return;
    }

    // محاسبه سانس‌های جدید مقصد
    const prevSlotIds = dragged.slotIds.length > 0 ? dragged.slotIds : [targetSlotId];
    const targetIdx = sortedSlots.findIndex((s) => s.id === targetSlotId);
    if (targetIdx < 0) return;

    let newSlotIds: string[];
    let newSlotParts: Record<string, SchedSlotHalf> | undefined;

    if (targetHalf === 'first_hour' || targetHalf === 'second_hour') {
      newSlotIds = [targetSlotId];
      newSlotParts = { [targetSlotId]: targetHalf };
    } else {
      const span = Math.min(prevSlotIds.length, sortedSlots.length);
      const clampedStart = Math.min(targetIdx, Math.max(0, sortedSlots.length - span));
      newSlotIds = sortedSlots.slice(clampedStart, clampedStart + span).map((s) => s.id);
      if (span === 1) {
        const oldHalf = prevSlotIds[0] ? getOfferingSlotHalf(dragged, prevSlotIds[0]) : 'full';
        newSlotParts = oldHalf !== 'full' ? { [newSlotIds[0]]: oldHalf } : undefined;
      } else if (dragged.slotParts) {
        newSlotParts = {};
        prevSlotIds.forEach((oldSid, idx) => {
          const ns = newSlotIds[idx];
          if (ns && dragged.slotParts?.[oldSid]) {
            newSlotParts![ns] = dragged.slotParts[oldSid];
          }
        });
      }
    }

    // اگر دقیقاً در همان زمان و همان حالت قبلی رها شده بود، نادیده بگیر
    const sameDay = dragged.dayOfWeek === targetDay;
    const sameSlots =
      sameDay &&
      newSlotIds.length === dragged.slotIds.length &&
      newSlotIds.every((id, i) => id === dragged.slotIds[i]) &&
      newSlotIds.every(
        (id) =>
          (newSlotParts?.[id] || 'full') === getOfferingSlotHalf(dragged, id)
      );
    if (sameSlots) return;

    const candidate: SchedCourseOffering = {
      ...dragged,
      dayOfWeek: targetDay,
      slotIds: newSlotIds,
      slotParts: newSlotParts,
      updatedAt: new Date().toISOString(),
    };

    const report = detectOfferingConflicts(candidate, termOfferings, classrooms, professors);
    const hasProfUnavail = report.warnings.some((w) => w.includes('عدم امکان حضور'));

    if (!report.hasHardConflict && !hasProfUnavail) {
      setUndoSnapshot({
        prevOfferings: offerings,
        label: `جابجایی «${dragged.courseTitle}» به ${SCHED_DAY_LABELS[targetDay]}`,
      });
      onPersistOfferings(offerings.map((o) => (o.id === dragged.id ? candidate : o)));
      onNotify(
        'success',
        `درس «${dragged.courseTitle}» بدون تداخل به ${SCHED_DAY_LABELS[targetDay]} (${newSlotIds
          .map((id) => {
            const idx = sortedSlots.findIndex((s) => s.id === id);
            return idx >= 0 ? getSchedSlotTitle(sortedSlots[idx], idx) : id;
          })
          .join(' + ')}) منتقل شد.`
      );
      return;
    }

    // در صورت وجود تداخل (استاد، کلاس، عدم حضور یا دانشجو) مودال رفع تداخل فوری را باز کن
    setPendingDrop({
      originalOffering: dragged,
      targetDay,
      targetSlotIds: newSlotIds,
      targetSlotParts: newSlotParts,
      pickedProfessorId: dragged.professorId || '',
      pickedClassroomId: dragged.classroomId || '',
    });
  };

  // ارزیابی زنده کاندیدای مودال رفع تداخل
  const pendingResolutionEval = useMemo(() => {
    if (!pendingDrop) return null;
    const prof = professors.find((p) => p.id === pendingDrop.pickedProfessorId);
    const room = classrooms.find((r) => r.id === pendingDrop.pickedClassroomId);

    const candidate: SchedCourseOffering = {
      ...pendingDrop.originalOffering,
      dayOfWeek: pendingDrop.targetDay,
      slotIds: pendingDrop.targetSlotIds,
      slotParts: pendingDrop.targetSlotParts,
      professorId: prof?.id,
      professorCode: prof?.professorCode,
      professorName: prof?.fullName,
      classroomId: room?.id,
      classroomName: room?.name,
      updatedAt: new Date().toISOString(),
    };

    const report = detectOfferingConflicts(candidate, termOfferings, classrooms, professors);

    // محاسبه وضعیت همه اساتید فعال در این ساعت برای انتخاب جایگزین
    const professorOptions = professors
      .filter((p) => p.isActive)
      .map((p) => {
        const testCand: SchedCourseOffering = {
          ...candidate,
          professorId: p.id,
          professorCode: p.professorCode,
          professorName: p.fullName,
        };
        const testRep = detectOfferingConflicts(testCand, termOfferings, classrooms, professors);
        const profErr = testRep.errors.find((err) => err.includes('تداخل استاد'));
        const profWarn = testRep.warnings.find((w) => w.includes('عدم امکان حضور'));
        return {
          prof: p,
          isFree: !profErr && !profWarn,
          issue: profErr || profWarn || '',
          load: calculateProfessorLoadSummary(p.id, termOfferings, rules),
        };
      })
      .sort((a, b) => Number(b.isFree) - Number(a.isFree));

    // محاسبه وضعیت همه کلاس‌های فیزیکی فعال در این ساعت برای انتخاب کلاس خالی
    const classroomOptions = classrooms
      .filter((r) => r.isActive)
      .map((r) => {
        const testCand: SchedCourseOffering = {
          ...candidate,
          classroomId: r.id,
          classroomName: r.name,
        };
        const testRep = detectOfferingConflicts(testCand, termOfferings, classrooms, professors);
        const roomErr = testRep.errors.find((err) => err.includes('تداخل مکان'));
        const capOk = r.capacity >= candidate.enrolledCount;
        return {
          room: r,
          isFree: !roomErr,
          capOk,
          issue: roomErr || (!capOk ? `ظرفیت کمتر (${r.capacity} از ${candidate.enrolledCount})` : ''),
        };
      })
      .sort((a, b) => {
        if (a.isFree !== b.isFree) return Number(b.isFree) - Number(a.isFree);
        if (a.capOk !== b.capOk) return Number(b.capOk) - Number(a.capOk);
        return a.room.capacity - b.room.capacity;
      });

    return {
      candidate,
      report,
      professorOptions,
      classroomOptions,
    };
  }, [pendingDrop, professors, classrooms, termOfferings, rules]);

  // چاپ ماتریس جامع A4 افقی
  const handlePrintMasterGrid = () => {
    const dayThs = activeDays
      .map(
        (d) =>
          `<th colspan="${sortedSlots.length}">${escapeHtml(SCHED_DAY_LABELS[d])}</th>`
      )
      .join('');
    const slotThs = activeDays
      .flatMap(() =>
        sortedSlots.map(
          (s, idx) =>
            `<th style="font-size:9px;">${escapeHtml(getSchedSlotTitle(s, idx))}<div class="mono muted">${escapeHtml(s.startTime)}-${escapeHtml(s.endTime)}</div></th>`
        )
      )
      .join('');

    const bodyRows = displayRows
      .map((row) => {
        const prefixCells = [
          row.isFirstInMajor
            ? `<td rowspan="${row.majorRowSpan}" style="font-weight:800;vertical-align:middle;text-align:center;">${escapeHtml(row.majorName)}</td>`
            : '',
          row.isFirstInCohort
            ? `<td rowspan="${row.cohortRowSpan}" class="mono" style="font-weight:700;vertical-align:middle;text-align:center;">${escapeHtml(row.entryTerm)}</td>`
            : '',
          row.isFirstInCohort
            ? `<td rowspan="${row.cohortRowSpan}" style="vertical-align:middle;text-align:center;">${row.totalCohortStudents.toLocaleString('fa-IR')}</td>`
            : '',
          `<td style="text-align:center;font-weight:700;">${escapeHtml(row.sectionName)}<div class="muted">${row.sectionStudentCount.toLocaleString('fa-IR')} نفر</div></td>`,
        ].join('');

        const scheduleCells = activeDays
          .flatMap((day) =>
            sortedSlots.map((slot) => {
              const items = termOfferings.filter(
                (o) =>
                  doesOfferingBelongToRow(o, row) &&
                  o.dayOfWeek === day &&
                  o.slotIds.includes(slot.id)
              );
              if (items.length === 0) return '<td></td>';
              const htmlItems = items
                .map((o) => {
                  const half = getOfferingSlotHalf(o, slot.id);
                  const halfTag =
                    half === 'first_hour'
                      ? ' [ساعت ۱]'
                      : half === 'second_hour'
                      ? ' [ساعت ۲]'
                      : '';
                  const internTag =
                    o.practicalType === 'internship'
                      ? ` (ظرفیت ${o.enrolledCount.toLocaleString('fa-IR')})`
                      : '';
                  return `<div class="cell-item"><strong>${escapeHtml(o.courseTitle)}${escapeHtml(internTag)}${escapeHtml(halfTag)}</strong><div class="muted">${escapeHtml(o.professorName || 'بدون استاد')}${o.classroomName ? ` · ${escapeHtml(o.classroomName)}` : ''}</div></div>`;
                })
                .join('');
              return `<td>${htmlItems}</td>`;
            })
          )
          .join('');

        return `<tr>${prefixCells}${scheduleCells}</tr>`;
      })
      .join('');

    const html = `
      <table>
        <thead>
          <tr>
            <th rowspan="2">رشته</th>
            <th rowspan="2">ورودی</th>
            <th rowspan="2">تعداد</th>
            <th rowspan="2">شعبه / گروه</th>
            ${dayThs}
          </tr>
          <tr>${slotThs}</tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    `;
    printSchedHtml(`برنامه جامع و فراگیر ترم ${activeTerm}`, html, true);
  };

  // خروجی اکسل ماتریس جامع
  const handleExportMasterExcel = () => {
    const excelRows = displayRows.map((row) => {
      const rec: Record<string, unknown> = {
        'رشته': row.majorName,
        'کد رشته': row.majorCode,
        'ورودی': row.entryTerm,
        'تعداد کل ورودی': row.totalCohortStudents,
        'شعبه / گروه': row.sectionName,
        'تعداد شعبه': row.sectionStudentCount,
      };
      activeDays.forEach((day) => {
        sortedSlots.forEach((slot, sIdx) => {
          const colTitle = `${SCHED_DAY_LABELS[day]} · ${getSchedSlotTitle(slot, sIdx)} (${slot.startTime}-${slot.endTime})`;
          const items = termOfferings.filter(
            (o) =>
              doesOfferingBelongToRow(o, row) &&
              o.dayOfWeek === day &&
              o.slotIds.includes(slot.id)
          );
          rec[colTitle] =
            items.length === 0
              ? ''
              : items
                  .map((o) => {
                    const half = getOfferingSlotHalf(o, slot.id);
                    const hLabel =
                      half === 'first_hour' ? '[ساعت اول] ' : half === 'second_hour' ? '[ساعت دوم] ' : '';
                    const intern =
                      o.practicalType === 'internship' ? ` (ظرفیت ${o.enrolledCount})` : '';
                    return `${hLabel}${o.courseTitle}${intern} - ${o.professorName || 'بدون استاد'}${o.classroomName ? ` [${o.classroomName}]` : ''}`;
                  })
                  .join(' | ');
        });
      });
      return rec;
    });
    void exportJsonRowsToExcel(
      excelRows,
      'برنامه جامع فراگیر',
      `برنامه_جامع_فراگیر_ترم_${activeTerm}.xlsx`
    );
  };

  return (
    <div className="space-y-4">
      {/* نوار کنترل و فوکوس برنامه جامع / فراگیر */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3.5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-[11px] font-black">
                برنامه جامع و فراگیر یکپارچه
              </span>
              <span className="text-xs font-mono text-slate-400">ترم {activeTerm}</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
              ماتریس کل رشته‌ها، ورودی‌ها و شعب به تفکیک روز و سانس (مانند شیت متمرکز)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              مشاهده همزمان کل برنامه و جاهای خالی رشته‌ها، چینش دروس عمومی بین‌رشته‌ای، کشیدن و جابجایی کارت‌ها در همان ردیف با پایش خودکار تداخل استاد و کلاس
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {undoSnapshot && (
              <button
                type="button"
                onClick={() => {
                  onPersistOfferings(undoSnapshot.prevOfferings);
                  onNotify('success', `حرکت قبلی («${undoSnapshot.label}») بازگردانی شد.`);
                  setUndoSnapshot(null);
                }}
                className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بازگردانی آخرین جابجایی</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrintMasterGrid}
              className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ برنامه جامع</span>
            </button>
            <button
              type="button"
              onClick={handleExportMasterExcel}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>خروجی اکسل ماتریس</span>
            </button>
          </div>
        </div>

        {/* ردیف ۱ ابزارها: فیلتر سطرها + حالت تقسیم نیم‌سانس */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={rowSearch}
              onChange={(e) => setRowSearch(e.target.value)}
              placeholder="جستجوی رشته، ورودی یا شعبه..."
              className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <select
            value={majorFilter}
            onChange={(e) => setMajorFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
          >
            <option value="all">همه رشته‌ها ({uniqueMajors.length})</option>
            {uniqueMajors.map((m) => (
              <option key={m.majorCode} value={m.majorCode}>
                {m.majorName} ({m.majorCode})
              </option>
            ))}
          </select>

          <select
            value={entryFilter}
            onChange={(e) => setEntryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
          >
            <option value="all">همه ورودی‌ها</option>
            {uniqueEntries.map((ent) => (
              <option key={ent} value={ent}>
                ورودی {ent}
              </option>
            ))}
          </select>

          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={alwaysShowHalfSlots}
              onChange={(e) => setAlwaysShowHalfSlots(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>نمایش دائمی تفکیک دو تک‌ساعت در سلول‌ها</span>
          </label>
        </div>

        {/* ردیف ۲ ابزارها: بررسی و تمرکز کل برنامه برای یک درس خاص / استاد خاص / کلاس خاص */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-teal-600" />
              <span>نمای تمرکز و تحلیل کل برنامه:</span>
            </span>

            <div className="inline-flex flex-wrap items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {[
                { key: 'none' as FocusMode, label: 'نمایش عادی همه' },
                { key: 'course' as FocusMode, label: 'برنامه یک درس خاص' },
                { key: 'professor' as FocusMode, label: 'برنامه یک استاد' },
                { key: 'classroom' as FocusMode, label: 'برنامه یک کلاس فیزیکی' },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    setFocusMode(m.key);
                    if (m.key === 'none') setHideUnmatchedRows(false);
                  }}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    focusMode === m.key
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {focusMode === 'course' && (
              <select
                value={focusCourseCode}
                onChange={(e) => setFocusCourseCode(e.target.value)}
                className="min-w-[230px] px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 font-bold"
              >
                <option value="">-- انتخاب درس (کد ۷ رقمی) --</option>
                {uniqueCoursesCatalog.map((c) => (
                  <option key={c.courseCode} value={c.courseCode}>
                    {c.title} ({c.courseCode}) — {c.majorNames.join('، ')}
                  </option>
                ))}
              </select>
            )}

            {focusMode === 'professor' && (
              <select
                value={focusProfId}
                onChange={(e) => setFocusProfId(e.target.value)}
                className="min-w-[230px] px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 font-bold"
              >
                <option value="">-- انتخاب استاد برای مشاهده کل برنامه --</option>
                {professors.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} (کد {p.professorCode})
                  </option>
                ))}
              </select>
            )}

            {focusMode === 'classroom' && (
              <select
                value={focusRoomId}
                onChange={(e) => setFocusRoomId(e.target.value)}
                className="min-w-[230px] px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 font-bold"
              >
                <option value="">-- انتخاب کلاس فیزیکی برای بررسی پر/خالی --</option>
                {classrooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (کد {r.code} · ظرفیت {r.capacity})
                  </option>
                ))}
              </select>
            )}

            {isFocusActive && (
              <>
                <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideUnmatchedRows}
                    onChange={(e) => setHideUnmatchedRows(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>فقط سطرهای دارای این مورد</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setFocusMode('none');
                    setFocusCourseCode('');
                    setFocusProfId('');
                    setFocusRoomId('');
                    setHideUnmatchedRows(false);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>پاک‌کردن تمرکز</span>
                </button>
              </>
            )}
          </div>

          {focusSummary && (
            <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="font-black text-indigo-950 dark:text-indigo-100">
                تمرکز فعال: {focusSummary.label}
              </div>
              <div className="flex flex-wrap items-center gap-3 font-bold tabular-nums text-indigo-800 dark:text-indigo-200">
                <span>تعداد کلاس ثبت‌شده: {focusSummary.count}</span>
                <span>مجموع ساعات هفتگی: {focusSummary.totalHours} س</span>
                <span>رشته/ورودی‌های پوشش‌داده‌شده: {focusSummary.majorsCount}</span>
                {focusMode === 'classroom' && (
                  <span className="text-emerald-700 dark:text-emerald-300">
                    سانس‌های اشغال: {focusSummary.occupiedSlotCount} | سانس‌های خالی: {focusSummary.freeSlotCount}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ماتریس فراگیر تمام‌عرض شبیه گوگل شیت */}
      {displayRows.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
            هیچ رشته/ورودی/شعبه‌ای با فیلترهای فعلی یافت نشد.
          </div>
          <p className="text-xs text-slate-500">
            ابتدا در بخش «رشته‌ها، ورودی‌ها و شعب» اطلاعات اولیه را ثبت یا از اکسل وارد کنید تا سطرهای برنامه جامع تشکیل شوند.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-auto max-h-[74vh]">
          <table className="border-collapse text-[11px] w-max min-w-full">
            <thead className="sticky top-0 z-30 bg-slate-100 dark:bg-slate-800 shadow-xs">
              {/* ردیف اول هدر: ستون‌های مشخصات ثابت در راست + عنوان روزهای هفته */}
              <tr>
                <th
                  rowSpan={2}
                  className="sticky right-0 z-40 w-[112px] min-w-[112px] max-w-[112px] bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2 text-center font-black"
                >
                  رشته
                </th>
                <th
                  rowSpan={2}
                  className="sticky right-[112px] z-40 w-[64px] min-w-[64px] max-w-[64px] bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2 text-center font-black"
                >
                  ورودی
                </th>
                <th
                  rowSpan={2}
                  className="sticky right-[176px] z-40 w-[58px] min-w-[58px] max-w-[58px] bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2 text-center font-black"
                >
                  تعداد کل
                </th>
                <th
                  rowSpan={2}
                  className="sticky right-[234px] z-40 w-[104px] min-w-[104px] max-w-[104px] bg-slate-200 dark:bg-slate-800 border-y border-r border-l-2 border-slate-300 dark:border-slate-700 border-l-slate-900 dark:border-l-slate-400 p-2 text-center font-black"
                >
                  شعبه / گروه
                </th>

                {activeDays.map((day, dIdx) => (
                  <th
                    key={day}
                    colSpan={sortedSlots.length}
                    className={`border border-slate-300 dark:border-slate-700 py-1.5 px-2 text-center font-black text-xs ${
                      DAY_HEADER_PALETTES[dIdx % DAY_HEADER_PALETTES.length]
                    }`}
                  >
                    {SCHED_DAY_LABELS[day]}
                  </th>
                ))}
              </tr>

              {/* ردیف دوم هدر: سانس اول، سانس دوم، ... و ساعت زیر هر سانس */}
              <tr>
                {activeDays.map((day, dIdx) =>
                  sortedSlots.map((slot, sIdx) => (
                    <th
                      key={`${day}_${slot.id}`}
                      className={`min-w-[168px] w-[168px] border border-slate-300 dark:border-slate-700 py-1.5 px-1.5 text-center ${
                        DAY_HEADER_PALETTES[dIdx % DAY_HEADER_PALETTES.length]
                      } ${sIdx === 0 ? 'border-r-2 border-r-slate-400 dark:border-r-slate-500' : ''}`}
                    >
                      <div className="font-black text-[11px] leading-tight">
                        {getSchedSlotTitle(slot, sIdx)}
                      </div>
                      <div
                        className="text-[10px] font-mono tabular-nums opacity-85 mt-0.5"
                        dir="ltr"
                      >
                        {slot.startTime} - {slot.endTime}
                      </div>
                    </th>
                  ))
                )}
              </tr>
            </thead>

            <tbody>
              {displayRows.map((row) => {
                const majorPalette =
                  MAJOR_BADGE_PALETTES[row.majorGroupIdx % MAJOR_BADGE_PALETTES.length];
                const isDraggingThisRow = draggingState?.rowKey === row.rowKey;

                return (
                  <tr
                    key={row.rowKey}
                    className="group/row hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                  >
                    {/* ستون ۱: رشته (ادغام‌شده) */}
                    {row.isFirstInMajor && (
                      <td
                        rowSpan={row.majorRowSpan}
                        className={`sticky right-0 z-20 w-[112px] min-w-[112px] max-w-[112px] border border-slate-300 dark:border-slate-700 p-2 text-center font-black align-middle bg-white dark:bg-slate-900 ${majorPalette}`}
                      >
                        <div className="leading-snug text-slate-900 dark:text-white">
                          {row.majorName}
                        </div>
                        <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                          {row.majorCode}
                        </div>
                      </td>
                    )}

                    {/* ستون ۲: ورودی (ادغام‌شده) */}
                    {row.isFirstInCohort && (
                      <td
                        rowSpan={row.cohortRowSpan}
                        className="sticky right-[112px] z-20 w-[64px] min-w-[64px] max-w-[64px] border border-slate-300 dark:border-slate-700 p-1.5 text-center font-mono font-black align-middle bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                      >
                        {row.entryTerm}
                      </td>
                    )}

                    {/* ستون ۳: تعداد کل ورودی */}
                    {row.isFirstInCohort && (
                      <td
                        rowSpan={row.cohortRowSpan}
                        className="sticky right-[176px] z-20 w-[58px] min-w-[58px] max-w-[58px] border border-slate-300 dark:border-slate-700 p-1.5 text-center font-mono font-bold tabular-nums align-middle bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                      >
                        {row.totalCohortStudents.toLocaleString('fa-IR')}
                      </td>
                    )}

                    {/* ستون ۴: شعبه و تعداد نفرات شعبه */}
                    <td className="sticky right-[234px] z-20 w-[104px] min-w-[104px] max-w-[104px] border-y border-r border-l-2 border-slate-300 dark:border-slate-700 border-l-slate-900 dark:border-l-slate-400 p-1.5 text-center align-middle bg-slate-50 dark:bg-slate-900">
                      <div className="font-extrabold text-slate-900 dark:text-white truncate">
                        {row.sectionName}
                      </div>
                      <div className="text-[9.5px] font-mono text-slate-500 tabular-nums">
                        {row.sectionStudentCount.toLocaleString('fa-IR')} نفر
                      </div>
                    </td>

                    {/* ستون‌های روز و سانس */}
                    {activeDays.map((day, dIdx) =>
                      sortedSlots.map((slot, sIdx) => {
                        const cellOfferings = termOfferings.filter(
                          (o) =>
                            doesOfferingBelongToRow(o, row) &&
                            o.dayOfWeek === day &&
                            o.slotIds.includes(slot.id)
                        );

                        const fullItems = cellOfferings.filter(
                          (o) => getOfferingSlotHalf(o, slot.id) === 'full'
                        );
                        const firstHourItems = cellOfferings.filter(
                          (o) => getOfferingSlotHalf(o, slot.id) === 'first_hour'
                        );
                        const secondHourItems = cellOfferings.filter(
                          (o) => getOfferingSlotHalf(o, slot.id) === 'second_hour'
                        );
                        const showSplitView =
                          alwaysShowHalfSlots ||
                          firstHourItems.length > 0 ||
                          secondHourItems.length > 0;

                        const cellDropKey = `${row.rowKey}|${day}|${slot.id}|full`;
                        const rightDropKey = `${row.rowKey}|${day}|${slot.id}|first_hour`;
                        const leftDropKey = `${row.rowKey}|${day}|${slot.id}|second_hour`;

                        const isProfUnavailableHere =
                          focusMode === 'professor' &&
                          focusProfUnavailableSet.has(`${day}:${slot.id}`);
                        const isRoomBusyHere =
                          focusMode === 'classroom' &&
                          focusRoomOccupiedSet.has(`${day}:${slot.id}`);

                        const dayTintBg =
                          dIdx % 2 === 1
                            ? 'bg-slate-50/45 dark:bg-slate-900/50'
                            : 'bg-white dark:bg-slate-900';

                        const renderOfferingChip = (o: SchedCourseOffering, compactHalf = false) => {
                          const conf = detectOfferingConflicts(
                            o,
                            termOfferings,
                            classrooms,
                            professors
                          );
                          const isSharedHost = o.cohortId !== row.cohortId;
                          const matchedFocus = doesOfferingMatchFocus(o);
                          const dimmed = isFocusActive && !matchedFocus;
                          const editable = canEditOffering(o);

                          return (
                            <div
                              key={`${o.id}_${slot.id}`}
                              draggable={editable}
                              onDragStart={(e) => {
                                if (!editable) return;
                                e.stopPropagation();
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('text/plain', o.id);
                                setDraggingState({
                                  offeringId: o.id,
                                  rowKey: row.rowKey,
                                  fromDay: o.dayOfWeek,
                                  fromSlotIds: [...o.slotIds],
                                });
                              }}
                              onDragEnd={() => {
                                setDraggingState(null);
                                setDragOverTargetKey(null);
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenEditOffering(o);
                              }}
                              title="کلیک برای ویرایش یا انتخاب و کشیدن در همین ردیف برای جابجایی"
                              className={`group/card relative rounded-lg border p-1.5 text-right transition select-none ${
                                editable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                              } ${
                                conf.hasHardConflict
                                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 text-rose-950 dark:text-rose-100'
                                  : matchedFocus
                                  ? 'bg-amber-100 dark:bg-amber-900/60 border-amber-500 ring-2 ring-amber-400/70 text-slate-950 dark:text-white'
                                  : o.practicalType === 'internship'
                                  ? 'bg-violet-50/90 dark:bg-violet-950/40 border-violet-300 dark:border-violet-800 hover:border-violet-500'
                                  : isSharedHost
                                  ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 hover:border-indigo-500'
                                  : 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800 hover:border-teal-500'
                              } ${dimmed ? 'opacity-25 grayscale' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span
                                  className={`font-black leading-tight ${
                                    compactHalf ? 'text-[9.5px]' : 'text-[10.5px]'
                                  } text-slate-900 dark:text-white`}
                                >
                                  {o.courseTitle}
                                  {o.practicalType === 'internship' && (
                                    <span className="text-violet-700 dark:text-violet-300 font-bold">
                                      {' '}
                                      (ظرفیت {o.enrolledCount.toLocaleString('fa-IR')})
                                    </span>
                                  )}
                                </span>
                                {editable && (
                                  <GripVertical className="w-3 h-3 text-slate-400 shrink-0 opacity-50 group-hover/card:opacity-100" />
                                )}
                              </div>

                              {o.internshipSubGroupLabel && (
                                <div className="text-[9px] font-bold text-violet-700 dark:text-violet-300">
                                  {o.internshipSubGroupLabel}
                                </div>
                              )}

                              <div
                                className={`${
                                  compactHalf ? 'text-[9px]' : 'text-[9.5px]'
                                } font-semibold text-slate-700 dark:text-slate-300 truncate mt-0.5`}
                              >
                                {o.professorName || (
                                  <span className="text-amber-700 dark:text-amber-400">
                                    بدون استاد
                                  </span>
                                )}
                              </div>

                              {o.classroomName && (
                                <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                                  کلاس: {o.classroomName}
                                </div>
                              )}

                              {o.sharedWithTargets && o.sharedWithTargets.length > 0 && (
                                <div className="text-[8.5px] font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">
                                  {isSharedHost
                                    ? `مشترک از ${o.ownerMajorName}`
                                    : `مشترک با ${o.sharedWithTargets.length} گروه`}
                                </div>
                              )}

                              {conf.hasHardConflict && (
                                <div className="text-[8.5px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-0.5 mt-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                  <span>تداخل!</span>
                                </div>
                              )}

                              {/* دکمه‌های سریع روی کارت هنگام هاور */}
                              <div
                                className="hidden group-hover/card:flex items-center gap-1 mt-1 pt-1 border-t border-black/10 dark:border-white/10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFocusMode('course');
                                    setFocusCourseCode(o.courseCode);
                                  }}
                                  className="px-1 py-0.5 rounded bg-white/80 dark:bg-slate-800 text-[8.5px] font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white cursor-pointer"
                                  title="مشاهده کل برنامه این درس"
                                >
                                  کل درس
                                </button>
                                {o.professorId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFocusMode('professor');
                                      setFocusProfId(o.professorId!);
                                    }}
                                    className="px-1 py-0.5 rounded bg-white/80 dark:bg-slate-800 text-[8.5px] font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-600 hover:text-white cursor-pointer"
                                    title="مشاهده کل برنامه استاد"
                                  >
                                    استاد
                                  </button>
                                )}
                                {editable && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onPersistOfferings(
                                        offerings.filter((x) => x.id !== o.id)
                                      );
                                      onNotify('success', `درس «${o.courseTitle}» حذف شد.`);
                                    }}
                                    className="mr-auto p-0.5 rounded text-rose-600 hover:bg-rose-600 hover:text-white cursor-pointer"
                                    title="حذف از برنامه"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        };

                        return (
                          <td
                            key={`${row.rowKey}_${day}_${slot.id}`}
                            onDragOver={(e) => {
                              if (!isDraggingThisRow) return;
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              if (!showSplitView && dragOverTargetKey !== cellDropKey) {
                                setDragOverTargetKey(cellDropKey);
                              }
                            }}
                            onDragLeave={() => {
                              if (dragOverTargetKey === cellDropKey) setDragOverTargetKey(null);
                            }}
                            onDrop={(e) => {
                              if (!showSplitView) {
                                handleDropOnCell(e, row.rowKey, day, slot.id, 'full');
                              }
                            }}
                            className={`border border-slate-300 dark:border-slate-700 p-1 align-top min-w-[168px] w-[168px] transition ${
                              sIdx === 0
                                ? 'border-r-2 border-r-slate-400 dark:border-r-slate-500'
                                : ''
                            } ${
                              dragOverTargetKey === cellDropKey
                                ? 'bg-teal-100/80 dark:bg-teal-900/50 ring-2 ring-inset ring-teal-500'
                                : isProfUnavailableHere
                                ? 'bg-rose-50/70 dark:bg-rose-950/30'
                                : isRoomBusyHere && cellOfferings.every((o) => o.classroomId !== focusRoomId)
                                ? 'bg-amber-50/50 dark:bg-amber-950/20'
                                : dayTintBg
                            }`}
                          >
                            {isProfUnavailableHere && cellOfferings.length === 0 && (
                              <div className="text-[9px] font-bold text-rose-500 text-center mb-0.5">
                                عدم حضور استاد
                              </div>
                            )}

                            {/* حالت ۱: نمایش افقی دو تک‌ساعت (راست: ساعت اول | چپ: ساعت دوم) */}
                            {showSplitView ? (
                              <div className="space-y-1">
                                {fullItems.map((o) => renderOfferingChip(o, false))}

                                <div className="grid grid-cols-2 gap-1 min-h-[62px]">
                                  {/* نیمه سمت راست = ساعت اول */}
                                  <div
                                    onDragOver={(e) => {
                                      if (!isDraggingThisRow) return;
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setDragOverTargetKey(rightDropKey);
                                    }}
                                    onDragLeave={() => {
                                      if (dragOverTargetKey === rightDropKey)
                                        setDragOverTargetKey(null);
                                    }}
                                    onDrop={(e) =>
                                      handleDropOnCell(e, row.rowKey, day, slot.id, 'first_hour')
                                    }
                                    className={`rounded-lg border p-0.5 flex flex-col gap-1 transition ${
                                      dragOverTargetKey === rightDropKey
                                        ? 'border-teal-500 bg-teal-100/80 dark:bg-teal-900/50'
                                        : 'border-dashed border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    <div className="text-[8px] font-bold text-slate-400 text-center">
                                      ساعت اول
                                    </div>
                                    {firstHourItems.map((o) => renderOfferingChip(o, true))}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onOpenNewOffering({
                                          cohortId: row.cohortId,
                                          sectionId: row.sectionId,
                                          dayOfWeek: day,
                                          slotId: slot.id,
                                          slotHalf: 'first_hour',
                                        })
                                      }
                                      className="mt-auto w-full py-0.5 rounded text-[9px] font-bold text-slate-400 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition cursor-pointer"
                                    >
                                      + ۱س راست
                                    </button>
                                  </div>

                                  {/* نیمه سمت چپ = ساعت دوم */}
                                  <div
                                    onDragOver={(e) => {
                                      if (!isDraggingThisRow) return;
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setDragOverTargetKey(leftDropKey);
                                    }}
                                    onDragLeave={() => {
                                      if (dragOverTargetKey === leftDropKey)
                                        setDragOverTargetKey(null);
                                    }}
                                    onDrop={(e) =>
                                      handleDropOnCell(e, row.rowKey, day, slot.id, 'second_hour')
                                    }
                                    className={`rounded-lg border p-0.5 flex flex-col gap-1 transition ${
                                      dragOverTargetKey === leftDropKey
                                        ? 'border-teal-500 bg-teal-100/80 dark:bg-teal-900/50'
                                        : 'border-dashed border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    <div className="text-[8px] font-bold text-slate-400 text-center">
                                      ساعت دوم
                                    </div>
                                    {secondHourItems.map((o) => renderOfferingChip(o, true))}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onOpenNewOffering({
                                          cohortId: row.cohortId,
                                          sectionId: row.sectionId,
                                          dayOfWeek: day,
                                          slotId: slot.id,
                                          slotHalf: 'second_hour',
                                        })
                                      }
                                      className="mt-auto w-full py-0.5 rounded text-[9px] font-bold text-slate-400 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition cursor-pointer"
                                    >
                                      + ۱س چپ
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : fullItems.length > 0 ? (
                              /* حالت ۲: دارای درس یا شعبه‌های کارورزی در کل سانس */
                              <div className="space-y-1">
                                {fullItems.map((o) => renderOfferingChip(o, false))}
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenNewOffering({
                                      cohortId: row.cohortId,
                                      sectionId: row.sectionId,
                                      dayOfWeek: day,
                                      slotId: slot.id,
                                      slotHalf: 'full',
                                    })
                                  }
                                  className="w-full py-0.5 rounded border border-dashed border-transparent hover:border-slate-300 dark:hover:border-slate-600 text-[9px] text-slate-400 opacity-0 group-hover/row:opacity-100 hover:text-teal-600 transition cursor-pointer"
                                  title="افزودن مورد جدید (یا شعبه کارورزی) به این سانس"
                                >
                                  + افزودن مورد دیگر
                                </button>
                              </div>
                            ) : (
                              /* حالت ۳: سلول خالی — کلیک برای ثبت کل سانس یا تفکیک ساعت اول/دوم */
                              <div className="group/empty min-h-[60px] flex flex-col justify-between rounded-lg p-0.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenNewOffering({
                                      cohortId: row.cohortId,
                                      sectionId: row.sectionId,
                                      dayOfWeek: day,
                                      slotId: slot.id,
                                      slotHalf: 'full',
                                    })
                                  }
                                  className="flex-1 w-full rounded-lg border border-dashed border-transparent group-hover/empty:border-teal-300 dark:group-hover/empty:border-teal-700 flex items-center justify-center text-[10px] font-bold text-slate-300 dark:text-slate-700 group-hover/empty:text-teal-600 transition cursor-pointer"
                                >
                                  <span className="opacity-0 group-hover/empty:opacity-100">
                                    + ثبت درس (کل سانس)
                                  </span>
                                </button>
                                <div className="hidden group-hover/empty:grid grid-cols-2 gap-1 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onOpenNewOffering({
                                        cohortId: row.cohortId,
                                        sectionId: row.sectionId,
                                        dayOfWeek: day,
                                        slotId: slot.id,
                                        slotHalf: 'first_hour',
                                      })
                                    }
                                    className="py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-[8.5px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                                  >
                                    + ۱س راست
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onOpenNewOffering({
                                        cohortId: row.cohortId,
                                        sectionId: row.sectionId,
                                        dayOfWeek: day,
                                        slotId: slot.id,
                                        slotHalf: 'second_hour',
                                      })
                                    }
                                    className="py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-[8.5px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                                  >
                                    + ۱س چپ
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* مودال بررسی و رفع تداخل هنگام جابجایی درس با Drag & Drop */}
      {pendingDrop && pendingResolutionEval && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-5 border border-rose-300 dark:border-rose-800 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    هشدار تداخل در جابجایی «{pendingDrop.originalOffering.courseTitle}»
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    مقصد انتخاب‌شده: {SCHED_DAY_LABELS[pendingDrop.targetDay]} (
                    {pendingDrop.targetSlotIds
                      .map((id) => {
                        const idx = sortedSlots.findIndex((s) => s.id === id);
                        const sl = idx >= 0 ? sortedSlots[idx] : undefined;
                        const half = pendingDrop.targetSlotParts?.[id] || 'full';
                        return `${sl ? getSchedSlotTitle(sl, idx) : id}${
                          half !== 'full' ? ` - ${getSlotHalfLabel(half)}` : ''
                        }`;
                      })
                      .join(' + ')}
                    )
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingDrop(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* وضعیت تداخل‌های فعلی */}
            <div className="space-y-1.5">
              {pendingResolutionEval.report.errors.length === 0 &&
              pendingResolutionEval.report.warnings.length === 0 ? (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 font-extrabold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>همه تداخل‌های قطعی برطرف شد! اکنون می‌توانید جابجایی را ثبت کنید.</span>
                </div>
              ) : (
                <>
                  {pendingResolutionEval.report.errors.map((err, i) => (
                    <div
                      key={`pe_${i}`}
                      className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-800 dark:text-rose-200 font-bold flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                  {pendingResolutionEval.report.warnings.map((w, i) => (
                    <div
                      key={`pw_${i}`}
                      className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 text-amber-800 dark:text-amber-300 flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* انتخاب سریع استاد آزاد جایگزین */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-teal-600" />
                  <span>تغییر استاد یا یافتن استاد آزاد در همین سانس</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPendingDrop((prev) => (prev ? { ...prev, pickedProfessorId: '' } : null))
                  }
                  className="text-[11px] font-bold text-slate-500 hover:text-rose-600 cursor-pointer"
                >
                  تعیین بدون استاد (موقت)
                </button>
              </div>
              <select
                value={pendingDrop.pickedProfessorId}
                onChange={(e) =>
                  setPendingDrop((prev) =>
                    prev ? { ...prev, pickedProfessorId: e.target.value } : null
                  )
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
              >
                <option value="">-- بدون استاد --</option>
                {pendingResolutionEval.professorOptions.map((opt) => (
                  <option key={opt.prof.id} value={opt.prof.id}>
                    {opt.isFree ? '✅ آزاد' : '⚠️ تداخل/محدودیت'} — {opt.prof.fullName} (کد{' '}
                    {opt.prof.professorCode} · بار: {opt.load.equivalentUnits} معادل)
                    {opt.issue ? ` [${opt.issue}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* انتخاب سریع کلاس فیزیکی خالی */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>یافتن و جایگزینی کلاس فیزیکی خالی در همین سانس</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPendingDrop((prev) => (prev ? { ...prev, pickedClassroomId: '' } : null))
                  }
                  className="text-[11px] font-bold text-slate-500 hover:text-rose-600 cursor-pointer"
                >
                  بدون کلاس فیزیکی
                </button>
              </div>
              <select
                value={pendingDrop.pickedClassroomId}
                onChange={(e) =>
                  setPendingDrop((prev) =>
                    prev ? { ...prev, pickedClassroomId: e.target.value } : null
                  )
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
              >
                <option value="">-- بدون کلاس فیزیکی --</option>
                {pendingResolutionEval.classroomOptions.map((opt) => (
                  <option key={opt.room.id} value={opt.room.id}>
                    {opt.isFree ? (opt.capOk ? '✅ خالی و مناسب' : '🟡 خالی (ظرفیت کمتر)') : '⛔ اشغال'}{' '}
                    — {opt.room.name} (ظرفیت {opt.room.capacity} · {SCHED_ROOM_TYPE_LABELS[opt.room.roomType]})
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-1.5">
                {pendingResolutionEval.classroomOptions
                  .filter((opt) => opt.isFree)
                  .slice(0, 6)
                  .map((opt) => (
                    <button
                      key={opt.room.id}
                      type="button"
                      onClick={() =>
                        setPendingDrop((prev) =>
                          prev ? { ...prev, pickedClassroomId: opt.room.id } : null
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                        pendingDrop.pickedClassroomId === opt.room.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : opt.capOk
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      {opt.room.name} ({opt.room.capacity} نفر)
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setPendingDrop(null);
                  onNotify('success', 'جابجایی لغو شد و درس در جای قبلی خود باقی ماند.');
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>بازگردانی حرکت (انصراف)</span>
              </button>

              <button
                type="button"
                disabled={pendingResolutionEval.report.hasHardConflict}
                onClick={() => {
                  const saved = pendingResolutionEval.candidate;
                  setUndoSnapshot({
                    prevOfferings: offerings,
                    label: `جابجایی «${saved.courseTitle}»`,
                  });
                  onPersistOfferings(offerings.map((o) => (o.id === saved.id ? saved : o)));
                  setPendingDrop(null);
                  onNotify('success', `درس «${saved.courseTitle}» با تنظیمات جدید جابجا شد.`);
                }}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-45 text-white font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تأیید و ثبت جابجایی</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
