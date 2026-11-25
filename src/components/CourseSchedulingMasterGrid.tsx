import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SchedCellComment,
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
  checkScheduleEditLock,
  detectOfferingConflicts,
  exportJsonRowsToExcel,
  getOfferingSlotHalf,
  getSchedSlotTitle,
  getSlotDurationHours,
  getSlotHalfLabel,
  normalizePersianText,
  printSchedHtml,
  round2,
} from '../utils/schedulingUtils';
import { escapeHtml } from '../utils/sanitizeHtml';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  GripVertical,
  Layers,
  Lock,
  Maximize2,
  MessageSquare,
  MessageSquarePlus,
  Minimize2,
  Printer,
  RotateCcw,
  Scan,
  Search,
  Send,
  Trash2,
  Users,
  X,
  ZoomIn,
  ZoomOut,
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
  cellComments: SchedCellComment[];
  onPersistCellComments: (next: SchedCellComment[]) => void;
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

type RowGroupingMode = 'by_major' | 'by_entry';

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
  majorColorIdx: number;
  entryColorIdx: number;
}

interface MasterRowDisplay extends MasterRowRaw {
  isFirstMajorBlock: boolean;
  majorBlockSpan: number;
  isFirstEntryBlock: boolean;
  entryBlockSpan: number;
  isFirstCohortBlock: boolean;
  cohortBlockSpan: number;
}

type FocusMode = 'none' | 'course' | 'professor' | 'classroom';

const DAY_HEADER_PALETTES = [
  'bg-sky-100/95 dark:bg-sky-950/65 text-sky-950 dark:text-sky-100',
  'bg-emerald-100/95 dark:bg-emerald-950/65 text-emerald-950 dark:text-emerald-100',
  'bg-indigo-100/95 dark:bg-indigo-950/65 text-indigo-950 dark:text-indigo-100',
  'bg-amber-100/95 dark:bg-amber-950/65 text-amber-950 dark:text-amber-100',
  'bg-violet-100/95 dark:bg-violet-950/65 text-violet-950 dark:text-violet-100',
  'bg-rose-100/95 dark:bg-rose-950/65 text-rose-950 dark:text-rose-100',
  'bg-teal-100/95 dark:bg-teal-950/65 text-teal-950 dark:text-teal-100',
];

const DAY_SLOT_SUBHEADER_PALETTES = [
  'bg-sky-50/90 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200',
  'bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200',
  'bg-indigo-50/90 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200',
  'bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
  'bg-violet-50/90 dark:bg-violet-950/40 text-violet-900 dark:text-violet-200',
  'bg-rose-50/90 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200',
  'bg-teal-50/90 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200',
];

// پالت رنگ متمایز و اختصاصی برای هر رشته
const MAJOR_DISTINCT_PALETTES = [
  {
    cell: 'bg-fuchsia-100/80 dark:bg-fuchsia-950/45 border-r-4 border-r-fuchsia-600 text-fuchsia-950 dark:text-fuchsia-100',
    tag: 'text-fuchsia-800 dark:text-fuchsia-300',
  },
  {
    cell: 'bg-sky-100/80 dark:bg-sky-950/45 border-r-4 border-r-sky-600 text-sky-950 dark:text-sky-100',
    tag: 'text-sky-800 dark:text-sky-300',
  },
  {
    cell: 'bg-emerald-100/80 dark:bg-emerald-950/45 border-r-4 border-r-emerald-600 text-emerald-950 dark:text-emerald-100',
    tag: 'text-emerald-800 dark:text-emerald-300',
  },
  {
    cell: 'bg-amber-100/80 dark:bg-amber-950/45 border-r-4 border-r-amber-600 text-amber-950 dark:text-amber-100',
    tag: 'text-amber-800 dark:text-amber-300',
  },
  {
    cell: 'bg-indigo-100/80 dark:bg-indigo-950/45 border-r-4 border-r-indigo-600 text-indigo-950 dark:text-indigo-100',
    tag: 'text-indigo-800 dark:text-indigo-300',
  },
  {
    cell: 'bg-rose-100/80 dark:bg-rose-950/45 border-r-4 border-r-rose-600 text-rose-950 dark:text-rose-100',
    tag: 'text-rose-800 dark:text-rose-300',
  },
  {
    cell: 'bg-teal-100/80 dark:bg-teal-950/45 border-r-4 border-r-teal-600 text-teal-950 dark:text-teal-100',
    tag: 'text-teal-800 dark:text-teal-300',
  },
  {
    cell: 'bg-violet-100/80 dark:bg-violet-950/45 border-r-4 border-r-violet-600 text-violet-950 dark:text-violet-100',
    tag: 'text-violet-800 dark:text-violet-300',
  },
  {
    cell: 'bg-orange-100/80 dark:bg-orange-950/45 border-r-4 border-r-orange-600 text-orange-950 dark:text-orange-100',
    tag: 'text-orange-800 dark:text-orange-300',
  },
  {
    cell: 'bg-cyan-100/80 dark:bg-cyan-950/45 border-r-4 border-r-cyan-600 text-cyan-950 dark:text-cyan-100',
    tag: 'text-cyan-800 dark:text-cyan-300',
  },
  {
    cell: 'bg-lime-100/80 dark:bg-lime-950/45 border-r-4 border-r-lime-600 text-lime-950 dark:text-lime-100',
    tag: 'text-lime-800 dark:text-lime-300',
  },
  {
    cell: 'bg-pink-100/80 dark:bg-pink-950/45 border-r-4 border-r-pink-600 text-pink-950 dark:text-pink-100',
    tag: 'text-pink-800 dark:text-pink-300',
  },
];

const ENTRY_DISTINCT_PALETTES = [
  'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white',
  'bg-indigo-50/90 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100',
  'bg-teal-50/90 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100',
  'bg-amber-50/90 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100',
];

const ROLE_LABELS_FA: Record<'admin' | 'academic_deputy' | 'department_head', string> = {
  admin: 'مدیر سامانه',
  academic_deputy: 'معاونت آموزشی',
  department_head: 'مدیر گروه',
};

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
  userRole,
  actor,
  isOwnMajorName,
  cellComments,
  onPersistCellComments,
  onPersistOfferings,
  onOpenNewOffering,
  onOpenEditOffering,
  onNotify,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rowGrouping, setRowGrouping] = useState<RowGroupingMode>('by_major');
  const [onlyPopulatedView, setOnlyPopulatedView] = useState(false);
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [fitToScreen, setFitToScreen] = useState<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);

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

  // مودال کامنت‌های هر سلول
  const [commentModalCell, setCommentModalCell] = useState<{
    row: MasterRowDisplay;
    day: SchedDayKey;
    slot: SchedTimeSlot;
    slotIdx: number;
  } | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // رفرنس اسکرول افقی و کلیدهای Alt / Shift / Ctrl + چرخ ماوس + اندازه‌گیری عرض برای جاگیری کل
  const gridScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = gridScrollRef.current;
    if (!el) return;
    const updateWidth = () => setContainerWidth(el.clientWidth);
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);

    const handleWheel = (e: WheelEvent) => {
      if (e.shiftKey || e.altKey || e.ctrlKey) {
        e.preventDefault();
        const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        el.scrollLeft -= delta * 1.4;
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      ro.disconnect();
    };
  }, [isFullscreen, programs.length, rowGrouping, onlyPopulatedView]);

  // خروج از تمام‌صفحه با کلید Escape (در صورتی که مدال دیگری باز نباشد)
  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pendingDrop && !commentModalCell) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen, pendingDrop, commentModalCell]);

  const globalLockStatus = useMemo(
    () => checkScheduleEditLock(rules, userRole, actor.id),
    [rules, userRole, actor.id]
  );

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

  // تخصیص اندیس رنگ ثابت و یکتا به هر رشته و هر ورودی
  const majorColorIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    uniqueMajors.forEach((m, idx) => map.set(m.majorCode, idx));
    return map;
  }, [uniqueMajors]);

  const entryColorIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    uniqueEntries.forEach((ent, idx) => map.set(ent, idx));
    return map;
  }, [uniqueEntries]);

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

  // ایندکس کامنت‌های این ترم برای دسترسی فوق‌سریع O(1) در هر سلول
  const commentsByCellKey = useMemo(() => {
    const map = new Map<string, SchedCellComment[]>();
    for (const c of cellComments) {
      if (c.termKey !== activeTerm) continue;
      const k = `${c.rowKey}|${c.dayOfWeek}|${c.slotId}`;
      const list = map.get(k);
      if (list) list.push(c);
      else map.set(k, [c]);
    }
    return map;
  }, [cellComments, activeTerm]);

  // بررسی مجوز ویرایش/جابجایی یک درس همراه با اعمال قفل‌های مدیر سامانه
  const canEditOffering = (o: SchedCourseOffering): boolean => {
    const lockRes = checkScheduleEditLock(rules, userRole, actor.id, {
      majorCode: o.ownerMajorCode,
      dayOfWeek: o.dayOfWeek,
      slotIds: o.slotIds,
    });
    if (lockRes.locked) return false;
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
          t.cohortId === row.cohortId &&
          (!t.sectionId || !row.sectionId || t.sectionId === row.sectionId)
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

  // ساخت سطرهای خام بر اساس حالت چیدمان (بر اساس رشته یا بر اساس ورودی)
  const allRawRows = useMemo<MasterRowRaw[]>(() => {
    const sortedProgs = [...programs].sort((a, b) => {
      if (rowGrouping === 'by_entry') {
        const eCmp = b.entryTerm.localeCompare(a.entryTerm, 'en');
        if (eCmp !== 0) return eCmp;
        return a.majorName.localeCompare(b.majorName, 'fa');
      }
      const mCmp = a.majorName.localeCompare(b.majorName, 'fa');
      if (mCmp !== 0) return mCmp;
      return b.entryTerm.localeCompare(a.entryTerm, 'en');
    });

    const rows: MasterRowRaw[] = [];
    for (const p of sortedProgs) {
      const mColorIdx = majorColorIndexMap.get(p.majorCode) ?? 0;
      const eColorIdx = entryColorIndexMap.get(p.entryTerm) ?? 0;
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
          majorColorIdx: mColorIdx,
          entryColorIdx: eColorIdx,
        });
      });
    }
    return rows;
  }, [programs, rowGrouping, majorColorIndexMap, entryColorIndexMap]);

  // فیلتر کردن سطرها و محاسبه rowSpan دقیق متناسب با چیدمان انتخابی + حالت محدودشده به دروس ثبت‌شده
  const displayRows = useMemo<MasterRowDisplay[]>(() => {
    const q = normalizePersianText(rowSearch).toLowerCase();
    let filtered = allRawRows.filter((r) => {
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

    if (onlyPopulatedView) {
      const populatedRows = filtered.filter((r) =>
        termOfferings.some(
          (o) =>
            o.dayOfWeek &&
            o.slotIds.length > 0 &&
            doesOfferingBelongToRow(o, r) &&
            (!isFocusActive || !hideUnmatchedRows || doesOfferingMatchFocus(o))
        )
      );
      if (populatedRows.length > 0) {
        filtered = populatedRows;
      }
    }

    const result: MasterRowDisplay[] = filtered.map((r) => ({
      ...r,
      isFirstMajorBlock: false,
      majorBlockSpan: 1,
      isFirstEntryBlock: false,
      entryBlockSpan: 1,
      isFirstCohortBlock: false,
      cohortBlockSpan: 1,
    }));

    // ادغام ستون رشته برای ردیف‌های مجاور هم‌رشته
    for (let i = 0; i < result.length; ) {
      let j = i + 1;
      while (j < result.length && result[j].majorCode === result[i].majorCode) j++;
      result[i].isFirstMajorBlock = true;
      result[i].majorBlockSpan = j - i;
      i = j;
    }

    // ادغام ستون ورودی برای ردیف‌های مجاور هم‌ورودی
    for (let i = 0; i < result.length; ) {
      let j = i + 1;
      while (j < result.length && result[j].entryTerm === result[i].entryTerm) j++;
      result[i].isFirstEntryBlock = true;
      result[i].entryBlockSpan = j - i;
      i = j;
    }

    // ادغام ستون کد/ورودی+رشته (Cohort) برای تعداد کل
    for (let i = 0; i < result.length; ) {
      let j = i + 1;
      while (j < result.length && result[j].cohortId === result[i].cohortId) j++;
      result[i].isFirstCohortBlock = true;
      result[i].cohortBlockSpan = j - i;
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
    onlyPopulatedView,
    termOfferings,
    focusMode,
    focusCourseCode,
    focusProfId,
    focusRoomId,
  ]);

  // محاسبه روزها و سانس‌های نمایشی (در حالت «نمای کل محدودشده دروس»، روزهای بدون درس مثل پنجشنبه/جمعه و سانس‌های خالی کناری حذف می‌شوند)
  const slotOriginalIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    sortedSlots.forEach((s, idx) => map.set(s.id, idx));
    return map;
  }, [sortedSlots]);

  const { displayedDays, displayedSlots, hiddenEmptyDaysCount } = useMemo(() => {
    if (!onlyPopulatedView) {
      return {
        displayedDays: activeDays,
        displayedSlots: sortedSlots,
        hiddenEmptyDaysCount: 0,
      };
    }
    const relevantOfferings = termOfferings.filter(
      (o) =>
        o.dayOfWeek &&
        o.slotIds.length > 0 &&
        displayRows.some((r) => doesOfferingBelongToRow(o, r)) &&
        (!isFocusActive || !hideUnmatchedRows || doesOfferingMatchFocus(o))
    );
    if (relevantOfferings.length === 0) {
      return {
        displayedDays: activeDays,
        displayedSlots: sortedSlots,
        hiddenEmptyDaysCount: 0,
      };
    }

    const usedDaySet = new Set<SchedDayKey>();
    const usedSlotIndices: number[] = [];
    for (const o of relevantOfferings) {
      if (o.dayOfWeek) usedDaySet.add(o.dayOfWeek);
      for (const sid of o.slotIds) {
        const sIdx = slotOriginalIndexMap.get(sid);
        if (sIdx !== undefined) usedSlotIndices.push(sIdx);
      }
    }

    const nextDays = activeDays.filter((d) => usedDaySet.has(d));
    const minSlotIdx = usedSlotIndices.length > 0 ? Math.min(...usedSlotIndices) : 0;
    const maxSlotIdx =
      usedSlotIndices.length > 0 ? Math.max(...usedSlotIndices) : sortedSlots.length - 1;
    const nextSlots = sortedSlots.slice(minSlotIdx, maxSlotIdx + 1);

    return {
      displayedDays: nextDays.length > 0 ? nextDays : activeDays,
      displayedSlots: nextSlots.length > 0 ? nextSlots : sortedSlots,
      hiddenEmptyDaysCount: Math.max(0, activeDays.length - nextDays.length),
    };
  }, [
    onlyPopulatedView,
    activeDays,
    sortedSlots,
    termOfferings,
    displayRows,
    isFocusActive,
    hideUnmatchedRows,
    slotOriginalIndexMap,
  ]);

  const fitZoomPercent = useMemo(() => {
    const naturalTableWidth = 338 + displayedDays.length * displayedSlots.length * 168;
    if (!containerWidth || naturalTableWidth <= 0) return 100;
    return Math.max(28, Math.min(100, Math.floor(((containerWidth - 8) / naturalTableWidth) * 100)));
  }, [containerWidth, displayedDays.length, displayedSlots.length]);

  const effectiveZoom = fitToScreen ? fitZoomPercent : zoomPercent;

  // خلاصه اطلاعات فوکوس فعال
  const focusSummary = useMemo(() => {
    if (!isFocusActive) return null;
    const matched = termOfferings.filter(doesOfferingMatchFocus);
    let totalHours = 0;
    const majorSet = new Set<string>();

    for (const o of matched) {
      totalHours += calculateOfferingBreakdown(o, rules).weeklyHours;
      majorSet.add(`${o.ownerMajorName} (${o.entryTerm})`);
      o.sharedWithTargets?.forEach((t) => majorSet.add(`${t.majorName} (${t.entryTerm})`));
    }

    const totalPossibleSlots = Math.max(1, displayedDays.length * displayedSlots.length);
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
      occupiedSlotCount,
      freeSlotCount: Math.max(0, totalPossibleSlots - occupiedSlotCount),
    };
  }, [
    isFocusActive,
    termOfferings,
    rules,
    displayedDays.length,
    displayedSlots.length,
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

  // منطق رها کردن کارت روی سلول در همان ردیف همراه با بررسی قفل
  const handleDropOnCell = (
    e: React.DragEvent,
    targetRow: MasterRowRaw,
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
      onNotify('error', 'شما مجوز جابجایی این درس را ندارید یا برنامه آن قفل شده است.');
      return;
    }
    if (sourceRowKey !== targetRow.rowKey) {
      onNotify('error', 'جابجایی درس با کشیدن فقط در امتداد همان ردیف (رشته/ورودی/شعبه) مجاز است.');
      return;
    }

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

    // بررسی قفل روز یا سانس مقصد
    const destLock = checkScheduleEditLock(rules, userRole, actor.id, {
      majorCode: targetRow.majorCode,
      dayOfWeek: targetDay,
      slotIds: newSlotIds,
    });
    if (destLock.locked) {
      onNotify('error', destLock.reason || 'این بخش از برنامه توسط مدیر سامانه قفل و مسدود شده است.');
      return;
    }

    const sameDay = dragged.dayOfWeek === targetDay;
    const sameSlots =
      sameDay &&
      newSlotIds.length === dragged.slotIds.length &&
      newSlotIds.every((id, i) => id === dragged.slotIds[i]) &&
      newSlotIds.every(
        (id) => (newSlotParts?.[id] || 'full') === getOfferingSlotHalf(dragged, id)
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

    setPendingDrop({
      originalOffering: dragged,
      targetDay,
      targetSlotIds: newSlotIds,
      targetSlotParts: newSlotParts,
      pickedProfessorId: dragged.professorId || '',
      pickedClassroomId: dragged.classroomId || '',
    });
  };

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

  const handleOpenCellFromGrid = (
    row: MasterRowDisplay,
    day: SchedDayKey,
    slotId: string,
    slotHalf: SchedSlotHalf
  ) => {
    const lockCheck = checkScheduleEditLock(rules, userRole, actor.id, {
      majorCode: row.majorCode,
      dayOfWeek: day,
      slotIds: [slotId],
    });
    if (lockCheck.locked) {
      onNotify('error', lockCheck.reason || 'ثبت یا تغییر درس در این بخش مسدود شده است.');
      return;
    }
    onOpenNewOffering({
      cohortId: row.cohortId,
      sectionId: row.sectionId,
      dayOfWeek: day,
      slotId,
      slotHalf,
    });
  };

  // افزودن و حذف کامنت در سلول انتخاب‌شده
  const modalCommentsList = useMemo(() => {
    if (!commentModalCell) return [];
    const k = `${commentModalCell.row.rowKey}|${commentModalCell.day}|${commentModalCell.slot.id}`;
    return commentsByCellKey.get(k) || [];
  }, [commentModalCell, commentsByCellKey]);

  const handleAddCellComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentModalCell) return;
    const cleanText = newCommentText.trim();
    if (!cleanText) return;
    const item: SchedCellComment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      termKey: activeTerm,
      rowKey: commentModalCell.row.rowKey,
      cohortId: commentModalCell.row.cohortId,
      sectionId: commentModalCell.row.sectionId,
      dayOfWeek: commentModalCell.day,
      slotId: commentModalCell.slot.id,
      authorId: actor.id,
      authorName: actor.name,
      authorRole: userRole,
      text: cleanText,
      createdAt: new Date().toISOString(),
    };
    onPersistCellComments([...cellComments, item]);
    setNewCommentText('');
    onNotify('success', 'یادداشت روی سلول ثبت شد.');
  };

  // چاپ ماتریس جامع A4 افقی
  const handlePrintMasterGrid = () => {
    const dayThs = displayedDays
      .map((d) => `<th colspan="${displayedSlots.length}">${escapeHtml(SCHED_DAY_LABELS[d])}</th>`)
      .join('');
    const slotThs = displayedDays
      .flatMap(() =>
        displayedSlots.map((s) => {
          const origIdx = slotOriginalIndexMap.get(s.id) ?? 0;
          return `<th style="font-size:9px;">${escapeHtml(getSchedSlotTitle(s, origIdx))}<div class="mono muted">${escapeHtml(s.startTime)}-${escapeHtml(s.endTime)}</div></th>`;
        })
      )
      .join('');

    const bodyRows = displayRows
      .map((row) => {
        const prefixCells =
          rowGrouping === 'by_entry'
            ? [
                row.isFirstEntryBlock
                  ? `<td rowspan="${row.entryBlockSpan}" class="mono" style="font-weight:800;vertical-align:middle;text-align:center;">${escapeHtml(row.entryTerm)}</td>`
                  : '',
                row.isFirstCohortBlock
                  ? `<td rowspan="${row.cohortBlockSpan}" style="font-weight:800;vertical-align:middle;text-align:center;">${escapeHtml(row.majorName)}</td>`
                  : '',
                row.isFirstCohortBlock
                  ? `<td rowspan="${row.cohortBlockSpan}" style="vertical-align:middle;text-align:center;">${row.totalCohortStudents.toLocaleString('fa-IR')}</td>`
                  : '',
                `<td style="text-align:center;font-weight:700;">${escapeHtml(row.sectionName)}<div class="muted">${row.sectionStudentCount.toLocaleString('fa-IR')} نفر</div></td>`,
              ].join('')
            : [
                row.isFirstMajorBlock
                  ? `<td rowspan="${row.majorBlockSpan}" style="font-weight:800;vertical-align:middle;text-align:center;">${escapeHtml(row.majorName)}</td>`
                  : '',
                row.isFirstCohortBlock
                  ? `<td rowspan="${row.cohortBlockSpan}" class="mono" style="font-weight:700;vertical-align:middle;text-align:center;">${escapeHtml(row.entryTerm)}</td>`
                  : '',
                row.isFirstCohortBlock
                  ? `<td rowspan="${row.cohortBlockSpan}" style="vertical-align:middle;text-align:center;">${row.totalCohortStudents.toLocaleString('fa-IR')}</td>`
                  : '',
                `<td style="text-align:center;font-weight:700;">${escapeHtml(row.sectionName)}<div class="muted">${row.sectionStudentCount.toLocaleString('fa-IR')} نفر</div></td>`,
              ].join('');

        const scheduleCells = displayedDays
          .flatMap((day) =>
            displayedSlots.map((slot) => {
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
                  const roleTag =
                    o.internshipSessionRole === 'school_attendance'
                      ? ' [مدرسه]'
                      : o.internshipSessionRole === 'university_orientation'
                      ? ' [توجیهی دانشگاه]'
                      : '';
                  return `<div class="cell-item"><strong>${escapeHtml(o.courseTitle)}${escapeHtml(internTag)}${escapeHtml(roleTag)}${escapeHtml(halfTag)}</strong><div class="muted">${escapeHtml(o.professorName || 'بدون استاد')}${o.classroomName ? ` · ${escapeHtml(o.classroomName)}` : ''}</div></div>`;
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
            ${
              rowGrouping === 'by_entry'
                ? '<th rowspan="2">ورودی</th><th rowspan="2">رشته</th>'
                : '<th rowspan="2">رشته</th><th rowspan="2">ورودی</th>'
            }
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
      const rec: Record<string, unknown> =
        rowGrouping === 'by_entry'
          ? {
              'ورودی': row.entryTerm,
              'رشته': row.majorName,
              'کد رشته': row.majorCode,
              'تعداد کل ورودی': row.totalCohortStudents,
              'شعبه / گروه': row.sectionName,
              'تعداد شعبه': row.sectionStudentCount,
            }
          : {
              'رشته': row.majorName,
              'کد رشته': row.majorCode,
              'ورودی': row.entryTerm,
              'تعداد کل ورودی': row.totalCohortStudents,
              'شعبه / گروه': row.sectionName,
              'تعداد شعبه': row.sectionStudentCount,
            };

      displayedDays.forEach((day) => {
        displayedSlots.forEach((slot) => {
          const origIdx = slotOriginalIndexMap.get(slot.id) ?? 0;
          const colTitle = `${SCHED_DAY_LABELS[day]} · ${getSchedSlotTitle(slot, origIdx)} (${slot.startTime}-${slot.endTime})`;
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
                      half === 'first_hour'
                        ? '[ساعت اول] '
                        : half === 'second_hour'
                        ? '[ساعت دوم] '
                        : '';
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
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-[55] bg-slate-50 dark:bg-slate-950 flex flex-col p-2.5 sm:p-3 overflow-hidden space-y-2.5'
          : 'space-y-4'
      }
    >
      {/* نوار اعلان مسدودسازی تغییرات برنامه برای غیرمدیران */}
      {globalLockStatus.locked && (
        <div className="shrink-0 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-3.5 py-2 text-xs font-extrabold text-rose-900 dark:text-rose-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{globalLockStatus.reason}</span>
        </div>
      )}

      {/* نوار کنترل و فوکوس برنامه جامع / فراگیر */}
      <div
        className={`shrink-0 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs ${
          isFullscreen ? 'p-2.5 sm:p-3 space-y-2' : 'p-4 space-y-3.5'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {!isFullscreen ? (
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-[11px] font-black">
                  برنامه جامع و فراگیر یکپارچه
                </span>
                <span className="text-xs font-mono text-slate-400">ترم {activeTerm}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                ماتریس کل رشته‌ها، ورودی‌ها و شعب به تفکیک روز و سانس
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                مشاهده همزمان کل برنامه، اسکرول افقی با <span className="font-mono font-bold">Alt / Shift / Ctrl + چرخ ماوس</span>، ثبت کامنت در هر سلول و جابجایی کشیدنی با پایش خودکار تداخل
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-teal-600 text-white text-xs font-black">
                برنامه جامع تمام‌صفحه · ترم {activeTerm}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                اسکرول افقی: Alt / Shift / Ctrl + ماوس · خروج: Esc
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            {undoSnapshot && (
              <button
                type="button"
                onClick={() => {
                  onPersistOfferings(undoSnapshot.prevOfferings);
                  onNotify('success', `حرکت قبلی («${undoSnapshot.label}») بازگردانی شد.`);
                  setUndoSnapshot(null);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بازگردانی جابجایی</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setOnlyPopulatedView((v) => !v)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition border ${
                onlyPopulatedView
                  ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-violet-400'
              }`}
              title="نمایش جدول فقط تا جایی که درس ثبت شده (حذف خودکار روزها و ردیف‌های بدون درس مانند پنجشنبه و جمعه)"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>نمای کل محدودشده دروس</span>
              {onlyPopulatedView && hiddenEmptyDaysCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                  {hiddenEmptyDaysCount.toLocaleString('fa-IR')} روز خالی مخفی
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFitToScreen((v) => !v)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition border ${
                fitToScreen
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-teal-400'
              }`}
              title="تنظیم خودکار بزرگنمایی برای نمایش یکجای تمام روزها و ستون‌ها در صفحه"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>نمای کل در صفحه</span>
            </button>

            {/* کنترل دستی زوم جدول */}
            <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setFitToScreen(false);
                  setZoomPercent((z) => Math.max(40, (fitToScreen ? fitZoomPercent : z) - 10));
                }}
                className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                title="کوچک‌نمایی"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setFitToScreen(false);
                  setZoomPercent(100);
                }}
                className="px-1.5 font-mono tabular-nums cursor-pointer hover:text-teal-600"
                title="بازگشت به بزرگنمایی ۱۰۰٪"
              >
                {effectiveZoom}%
              </button>
              <button
                type="button"
                onClick={() => {
                  setFitToScreen(false);
                  setZoomPercent((z) => Math.min(130, (fitToScreen ? fitZoomPercent : z) + 10));
                }}
                className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                title="بزرگ‌نمایی"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsFullscreen((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition ${
                isFullscreen
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
              title={isFullscreen ? 'بازگشت به نمای عادی (Esc)' : 'بزرگ‌نمایی تمام‌صفحه جدول'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>خروج از تمام‌صفحه</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>نمای تمام‌صفحه جدول</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrintMasterGrid}
              className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ</span>
            </button>
            <button
              type="button"
              onClick={handleExportMasterExcel}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>اکسل</span>
            </button>
          </div>
        </div>

        {/* ردیف ۱ ابزارها: جستجو + فیلتر + چیدمان بر اساس رشته/ورودی + اسکرول افقی سریع */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="relative flex-1 min-w-[170px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2" />
            <input
              type="text"
              value={rowSearch}
              onChange={(e) => setRowSearch(e.target.value)}
              placeholder="جستجوی رشته، ورودی یا شعبه..."
              className="w-full pr-8 pl-2.5 py-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <select
            value={majorFilter}
            onChange={(e) => setMajorFilter(e.target.value)}
            className="px-2.5 py-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
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
            className="px-2.5 py-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
          >
            <option value="all">همه ورودی‌ها</option>
            {uniqueEntries.map((ent) => (
              <option key={ent} value={ent}>
                ورودی {ent}
              </option>
            ))}
          </select>

          {/* تغییر چیدمان ردیف‌ها: بر اساس رشته یا بر اساس ورودی */}
          <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="px-2 text-[11px] font-bold text-slate-500">چیدمان:</span>
            <button
              type="button"
              onClick={() => setRowGrouping('by_major')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition ${
                rowGrouping === 'by_major'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              بر اساس رشته
            </button>
            <button
              type="button"
              onClick={() => setRowGrouping('by_entry')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition ${
                rowGrouping === 'by_entry'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              بر اساس ورودی (ترم ورود)
            </button>
          </div>

          <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={alwaysShowHalfSlots}
              onChange={(e) => setAlwaysShowHalfSlots(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>تفکیک دو تک‌ساعت</span>
          </label>

          {/* دکمه‌های سریع اسکرول افقی + راهنمای Alt/Shift/Ctrl + ماوس */}
          <div className="mr-auto inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (gridScrollRef.current) gridScrollRef.current.scrollLeft += 420;
              }}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 cursor-pointer"
              title="اسکرول به راست"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-slate-500 hidden xl:inline px-1">
              Shift / Alt / Ctrl + اسکرول ماوس
            </span>
            <button
              type="button"
              onClick={() => {
                if (gridScrollRef.current) gridScrollRef.current.scrollLeft -= 420;
              }}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 cursor-pointer"
              title="اسکرول به چپ (روزهای بعدی)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ردیف ۲ ابزارها: بررسی و تمرکز کل برنامه برای یک درس / استاد / کلاس */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-teal-600" />
              <span>فوکوس کل برنامه:</span>
            </span>

            <div className="inline-flex flex-wrap items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              {[
                { key: 'none' as FocusMode, label: 'همه' },
                { key: 'course' as FocusMode, label: 'یک درس' },
                { key: 'professor' as FocusMode, label: 'یک استاد' },
                { key: 'classroom' as FocusMode, label: 'یک کلاس' },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    setFocusMode(m.key);
                    if (m.key === 'none') setHideUnmatchedRows(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
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
                className="min-w-[220px] px-2.5 py-1 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 font-bold"
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
                className="min-w-[220px] px-2.5 py-1 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 font-bold"
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
                className="min-w-[220px] px-2.5 py-1 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 font-bold"
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
                <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideUnmatchedRows}
                    onChange={(e) => setHideUnmatchedRows(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>فقط سطرهای مرتبط</span>
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
                  className="px-2 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>پاک‌کردن</span>
                </button>
              </>
            )}
          </div>

          {focusSummary && (
            <div className="p-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="font-black text-indigo-950 dark:text-indigo-100">
                تمرکز فعال: {focusSummary.label}
              </div>
              <div className="flex flex-wrap items-center gap-3 font-bold tabular-nums text-indigo-800 dark:text-indigo-200">
                <span>کلاس‌ها: {focusSummary.count}</span>
                <span>مجموع ساعات: {focusSummary.totalHours} س</span>
                <span>گروه‌ها: {focusSummary.majorsCount}</span>
                {focusMode === 'classroom' && (
                  <span className="text-emerald-700 dark:text-emerald-300">
                    اشغال: {focusSummary.occupiedSlotCount} | خالی: {focusSummary.freeSlotCount}
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
            ابتدا در بخش «تنظیمات برنامه ← رشته‌ها، ورودی‌ها و شعب» اطلاعات اولیه را ثبت یا از اکسل وارد کنید.
          </p>
        </div>
      ) : (
        <div
          ref={gridScrollRef}
          className={`rounded-2xl border-2 border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-sm overflow-auto ${
            isFullscreen ? 'flex-1 min-h-0' : 'max-h-[74vh]'
          }`}
        >
          <table
            ref={null}
            style={
              effectiveZoom !== 100
                ? ({ zoom: effectiveZoom / 100 } as React.CSSProperties)
                : undefined
            }
            className="border-collapse text-[11px] w-max min-w-full"
          >
            <thead className="sticky top-0 z-30 bg-slate-100 dark:bg-slate-800 shadow-xs">
              {/* ردیف اول هدر: ستون‌های مشخصات ثابت در راست + عنوان روزهای هفته */}
              <tr>
                {rowGrouping === 'by_major' ? (
                  <>
                    <th
                      rowSpan={2}
                      className="sticky right-0 z-40 w-[114px] min-w-[114px] max-w-[114px] bg-slate-200 dark:bg-slate-800 border border-slate-400 dark:border-slate-600 p-2 text-center font-black"
                    >
                      رشته
                    </th>
                    <th
                      rowSpan={2}
                      className="sticky right-[114px] z-40 w-[64px] min-w-[64px] max-w-[64px] bg-slate-200 dark:bg-slate-800 border border-slate-400 dark:border-slate-600 p-2 text-center font-black"
                    >
                      ورودی
                    </th>
                  </>
                ) : (
                  <>
                    <th
                      rowSpan={2}
                      className="sticky right-0 z-40 w-[64px] min-w-[64px] max-w-[64px] bg-slate-200 dark:bg-slate-800 border border-slate-400 dark:border-slate-600 p-2 text-center font-black"
                    >
                      ورودی
                    </th>
                    <th
                      rowSpan={2}
                      className="sticky right-[64px] z-40 w-[114px] min-w-[114px] max-w-[114px] bg-slate-200 dark:bg-slate-800 border border-slate-400 dark:border-slate-600 p-2 text-center font-black"
                    >
                      رشته
                    </th>
                  </>
                )}

                <th
                  rowSpan={2}
                  className="sticky right-[178px] z-40 w-[56px] min-w-[56px] max-w-[56px] bg-slate-200 dark:bg-slate-800 border border-slate-400 dark:border-slate-600 p-2 text-center font-black"
                >
                  تعداد کل
                </th>
                <th
                  rowSpan={2}
                  className="sticky right-[234px] z-40 w-[104px] min-w-[104px] max-w-[104px] bg-slate-200 dark:bg-slate-800 border-y border-r border-slate-400 dark:border-slate-600 border-l-[3px] border-l-slate-900 dark:border-l-slate-300 p-2 text-center font-black"
                >
                  شعبه / گروه
                </th>

                {displayedDays.map((day, dIdx) => {
                  const isDayLocked =
                    userRole !== 'admin' && Boolean(rules.programLocks?.lockedDays?.includes(day));
                  return (
                    <th
                      key={day}
                      colSpan={displayedSlots.length}
                      className={`border-y-2 border-slate-700 dark:border-slate-400 border-r-[3px] border-r-slate-800 dark:border-r-slate-300 border-l-[3px] border-l-slate-800 dark:border-l-slate-300 py-2 px-2 text-center font-black text-[13.5px] sm:text-sm tracking-tight ${
                        DAY_HEADER_PALETTES[dIdx % DAY_HEADER_PALETTES.length]
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span>{SCHED_DAY_LABELS[day]}</span>
                        {isDayLocked && (
                          <span title="تغییرات این روز قفل شده است" className="inline-flex">
                            <Lock className="w-3.5 h-3.5 text-rose-700 dark:text-rose-300" />
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>

              {/* ردیف دوم هدر: سانس‌ها و ساعت زیر هر سانس */}
              <tr>
                {displayedDays.map((day, dIdx) =>
                  displayedSlots.map((slot, sIdx) => {
                    const isFirstSlotOfDay = sIdx === 0;
                    const isLastSlotOfDay = sIdx === displayedSlots.length - 1;
                    const isSlotLocked =
                      userRole !== 'admin' &&
                      Boolean(rules.programLocks?.lockedSlotIds?.includes(slot.id));
                    const durHrs = getSlotDurationHours(slot);
                    const origIdx = slotOriginalIndexMap.get(slot.id) ?? sIdx;
                    return (
                      <th
                        key={`${day}_${slot.id}`}
                        className={`min-w-[168px] w-[168px] border-t border-b-2 border-b-slate-700 dark:border-b-slate-400 border-x border-slate-300 dark:border-slate-700 py-1.5 px-1.5 text-center ${
                          DAY_SLOT_SUBHEADER_PALETTES[dIdx % DAY_SLOT_SUBHEADER_PALETTES.length]
                        } ${
                          isFirstSlotOfDay
                            ? 'border-r-[3px] border-r-slate-800 dark:border-r-slate-300'
                            : ''
                        } ${
                          isLastSlotOfDay
                            ? 'border-l-[3px] border-l-slate-800 dark:border-l-slate-300'
                            : ''
                        }`}
                      >
                        <div className="font-black text-[11px] leading-tight inline-flex items-center gap-1">
                          <span>{getSchedSlotTitle(slot, origIdx)}</span>
                          {durHrs <= 1 && (
                            <span className="text-[9px] px-1 rounded bg-white/75 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300">
                              تک‌ساعت
                            </span>
                          )}
                          {isSlotLocked && (
                            <Lock className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          )}
                        </div>
                        <div
                          className="text-[10px] font-mono tabular-nums opacity-90 mt-0.5"
                          dir="ltr"
                        >
                          {slot.startTime} - {slot.endTime}
                        </div>
                      </th>
                    );
                  })
                )}
              </tr>
            </thead>

            <tbody>
              {displayRows.map((row) => {
                const majorPalette =
                  MAJOR_DISTINCT_PALETTES[row.majorColorIdx % MAJOR_DISTINCT_PALETTES.length];
                const entryPalette =
                  ENTRY_DISTINCT_PALETTES[row.entryColorIdx % ENTRY_DISTINCT_PALETTES.length];
                const isMajorLocked =
                  userRole !== 'admin' &&
                  Boolean(rules.programLocks?.lockedMajorCodes?.includes(row.majorCode));
                const isDraggingThisRow = draggingState?.rowKey === row.rowKey;

                return (
                  <tr
                    key={row.rowKey}
                    className="group/row hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                  >
                    {rowGrouping === 'by_major' ? (
                      <>
                        {/* ستون ۱: رشته با رنگ اختصاصی متمایز */}
                        {row.isFirstMajorBlock && (
                          <td
                            rowSpan={row.majorBlockSpan}
                            className={`sticky right-0 z-20 w-[114px] min-w-[114px] max-w-[114px] border border-slate-300 dark:border-slate-700 p-2 text-center font-black align-middle ${majorPalette.cell}`}
                          >
                            <div className="leading-snug flex flex-col items-center gap-0.5">
                              <span>{row.majorName}</span>
                              {isMajorLocked && (
                                <span title="تغییرات این رشته مسدود شده است" className="inline-flex">
                                  <Lock className="w-3 h-3 text-rose-600" />
                                </span>
                              )}
                            </div>
                            <div className={`text-[9px] font-mono mt-0.5 opacity-80 ${majorPalette.tag}`}>
                              {row.majorCode}
                            </div>
                          </td>
                        )}

                        {/* ستون ۲: ورودی */}
                        {row.isFirstCohortBlock && (
                          <td
                            rowSpan={row.cohortBlockSpan}
                            className="sticky right-[114px] z-20 w-[64px] min-w-[64px] max-w-[64px] border border-slate-300 dark:border-slate-700 p-1.5 text-center font-mono font-black align-middle bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                          >
                            {row.entryTerm}
                          </td>
                        )}
                      </>
                    ) : (
                      <>
                        {/* حالت چیدمان بر اساس ورودی: ستون ۱ = ورودی، ستون ۲ = رشته با رنگ اختصاصی */}
                        {row.isFirstEntryBlock && (
                          <td
                            rowSpan={row.entryBlockSpan}
                            className={`sticky right-0 z-20 w-[64px] min-w-[64px] max-w-[64px] border border-slate-300 dark:border-slate-700 p-1.5 text-center font-mono font-black align-middle ${entryPalette}`}
                          >
                            <div>{row.entryTerm}</div>
                            <div className="text-[8.5px] font-sans opacity-75 mt-0.5">ورودی</div>
                          </td>
                        )}

                        {row.isFirstCohortBlock && (
                          <td
                            rowSpan={row.cohortBlockSpan}
                            className={`sticky right-[64px] z-20 w-[114px] min-w-[114px] max-w-[114px] border border-slate-300 dark:border-slate-700 p-2 text-center font-black align-middle ${majorPalette.cell}`}
                          >
                            <div className="leading-snug flex flex-col items-center gap-0.5">
                              <span>{row.majorName}</span>
                              {isMajorLocked && (
                                <span title="تغییرات این رشته مسدود شده است" className="inline-flex">
                                  <Lock className="w-3 h-3 text-rose-600" />
                                </span>
                              )}
                            </div>
                            <div className={`text-[9px] font-mono mt-0.5 opacity-80 ${majorPalette.tag}`}>
                              {row.majorCode}
                            </div>
                          </td>
                        )}
                      </>
                    )}

                    {/* ستون ۳: تعداد کل ورودی */}
                    {row.isFirstCohortBlock && (
                      <td
                        rowSpan={row.cohortBlockSpan}
                        className="sticky right-[178px] z-20 w-[56px] min-w-[56px] max-w-[56px] border border-slate-300 dark:border-slate-700 p-1.5 text-center font-mono font-bold tabular-nums align-middle bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                      >
                        {row.totalCohortStudents.toLocaleString('fa-IR')}
                      </td>
                    )}

                    {/* ستون ۴: شعبه و تعداد نفرات شعبه */}
                    <td className="sticky right-[234px] z-20 w-[104px] min-w-[104px] max-w-[104px] border-y border-r border-slate-300 dark:border-slate-700 border-l-[3px] border-l-slate-900 dark:border-l-slate-300 p-1.5 text-center align-middle bg-slate-50 dark:bg-slate-900">
                      <div className="font-extrabold text-slate-900 dark:text-white truncate">
                        {row.sectionName}
                      </div>
                      <div className="text-[9.5px] font-mono text-slate-500 tabular-nums">
                        {row.sectionStudentCount.toLocaleString('fa-IR')} نفر
                      </div>
                    </td>

                    {/* ستون‌های روز و سانس */}
                    {displayedDays.map((day, dIdx) =>
                      displayedSlots.map((slot, sIdx) => {
                        const isFirstSlotOfDay = sIdx === 0;
                        const isLastSlotOfDay = sIdx === displayedSlots.length - 1;
                        const slotDuration = getSlotDurationHours(slot);

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
                          (slotDuration > 1 && alwaysShowHalfSlots) ||
                          firstHourItems.length > 0 ||
                          secondHourItems.length > 0;

                        const cellDropKey = `${row.rowKey}|${day}|${slot.id}|full`;
                        const rightDropKey = `${row.rowKey}|${day}|${slot.id}|first_hour`;
                        const leftDropKey = `${row.rowKey}|${day}|${slot.id}|second_hour`;

                        const cellLock = checkScheduleEditLock(rules, userRole, actor.id, {
                          majorCode: row.majorCode,
                          dayOfWeek: day,
                          slotIds: [slot.id],
                        });

                        const cellCommentsHere =
                          commentsByCellKey.get(`${row.rowKey}|${day}|${slot.id}`) || [];

                        const isProfUnavailableHere =
                          focusMode === 'professor' &&
                          focusProfUnavailableSet.has(`${day}:${slot.id}`);
                        const isRoomBusyHere =
                          focusMode === 'classroom' &&
                          focusRoomOccupiedSet.has(`${day}:${slot.id}`);

                        const dayTintBg =
                          dIdx % 2 === 1
                            ? 'bg-slate-50/55 dark:bg-slate-900/55'
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
                              title={
                                editable
                                  ? 'کلیک برای ویرایش یا انتخاب و کشیدن در همین ردیف برای جابجایی'
                                  : 'فقط مشاهده (تغییرات مسدود شده یا متعلق به گروه دیگر است)'
                              }
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

                              {(o.internshipSubGroupLabel || o.internshipSessionRole) && (
                                <div className="text-[8.5px] font-bold text-violet-700 dark:text-violet-300 flex flex-wrap items-center gap-1">
                                  {o.internshipSubGroupLabel && (
                                    <span>{o.internshipSubGroupLabel}</span>
                                  )}
                                  {o.internshipSessionRole === 'school_attendance' && (
                                    <span className="px-1 rounded bg-violet-100 dark:bg-violet-900/60">
                                      حضور مدرسه
                                    </span>
                                  )}
                                  {o.internshipSessionRole === 'university_orientation' && (
                                    <span className="px-1 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200">
                                      توجیهی دانشگاه
                                    </span>
                                  )}
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

                              {o.classroomName ? (
                                <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                                  کلاس: {o.classroomName}
                                </div>
                              ) : o.internshipSessionRole === 'school_attendance' ? (
                                <div className="text-[9px] text-violet-600 dark:text-violet-300 truncate">
                                  محل: مدرسه
                                </div>
                              ) : null}

                              {o.sharedWithTargets && o.sharedWithTargets.length > 0 && (
                                <div className="text-[8.5px] font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">
                                  {isSharedHost
                                    ? `مشترک از ${o.ownerMajorName}`
                                    : `مشترک با ${o.sharedWithTargets.length} گروه`}
                                </div>
                              )}

                              {(() => {
                                const bd = calculateOfferingBreakdown(o, rules);
                                if (bd.weeklyHours % 1 === 0) return null;
                                return (
                                  <div className="text-[8.5px] font-bold text-sky-700 dark:text-sky-300 mt-0.5">
                                    {bd.weeklyHours.toLocaleString('fa-IR')} س واقعی ({bd.rawUnits.toLocaleString('fa-IR')} واحد)
                                  </div>
                                );
                              })()}

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
                              if (!isDraggingThisRow || cellLock.locked) return;
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
                                handleDropOnCell(e, row, day, slot.id, 'full');
                              }
                            }}
                            className={`group/cell relative border border-slate-300 dark:border-slate-700 p-1 align-top min-w-[168px] w-[168px] transition ${
                              isFirstSlotOfDay
                                ? 'border-r-[3px] border-r-slate-800 dark:border-r-slate-300'
                                : ''
                            } ${
                              isLastSlotOfDay
                                ? 'border-l-[3px] border-l-slate-800 dark:border-l-slate-300'
                                : ''
                            } ${
                              dragOverTargetKey === cellDropKey
                                ? 'bg-teal-100/80 dark:bg-teal-900/50 ring-2 ring-inset ring-teal-500'
                                : cellLock.locked
                                ? 'bg-slate-100/75 dark:bg-slate-800/45'
                                : isProfUnavailableHere
                                ? 'bg-rose-50/70 dark:bg-rose-950/30'
                                : isRoomBusyHere &&
                                  cellOfferings.every((o) => o.classroomId !== focusRoomId)
                                ? 'bg-amber-50/50 dark:bg-amber-950/20'
                                : dayTintBg
                            }`}
                          >
                            {/* نشانگر بسیار کوچک کامنت در گوشه بالا-چپ سلول + نمایش متن کامنت‌ها هنگام هاور */}
                            <div
                              className="group/cmt absolute top-0.5 left-0.5 z-20"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {cellCommentsHere.length > 0 ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCommentModalCell({ row, day, slot, slotIdx: sIdx })
                                    }
                                    className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-400 hover:bg-amber-500 text-slate-950 text-[8.5px] font-black shadow-xs cursor-pointer"
                                    title="مشاهده و ثبت کامنت"
                                  >
                                    <MessageSquare className="w-2.5 h-2.5" />
                                    <span>{cellCommentsHere.length.toLocaleString('fa-IR')}</span>
                                  </button>

                                  {/* باکس پیش‌نمایش خودکار کامنت‌ها هنگام قرار دادن ماوس */}
                                  <div className="hidden group-hover/cmt:block absolute left-0 top-5 z-50 w-64 p-2.5 rounded-xl bg-slate-900 text-white shadow-2xl border border-amber-400/50 text-right space-y-1.5 pointer-events-none">
                                    <div className="text-[10px] font-black text-amber-300 border-b border-white/15 pb-1">
                                      یادداشت‌ها و کامنت‌های این سلول ({cellCommentsHere.length.toLocaleString('fa-IR')})
                                    </div>
                                    {cellCommentsHere.map((c) => (
                                      <div key={c.id} className="text-[10px] leading-relaxed">
                                        <div className="font-bold text-teal-300">
                                          {c.authorName}{' '}
                                          <span className="text-[9px] text-slate-400 font-normal">
                                            ({ROLE_LABELS_FA[c.authorRole]})
                                          </span>
                                        </div>
                                        <div className="text-slate-100">{c.text}</div>
                                      </div>
                                    ))}
                                    <div className="text-[9px] text-amber-200/80 pt-0.5">
                                      برای افزودن یا حذف کامنت کلیک کنید
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCommentModalCell({ row, day, slot, slotIdx: sIdx })
                                  }
                                  className="opacity-0 group-hover/cell:opacity-100 p-0.5 rounded bg-white/90 dark:bg-slate-800 text-slate-400 hover:text-amber-600 border border-slate-200 dark:border-slate-700 shadow-xs transition cursor-pointer"
                                  title="ثبت کامنت یا یادداشت در این سلول"
                                >
                                  <MessageSquarePlus className="w-3 h-3" />
                                </button>
                              )}
                            </div>

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
                                      if (!isDraggingThisRow || cellLock.locked) return;
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setDragOverTargetKey(rightDropKey);
                                    }}
                                    onDragLeave={() => {
                                      if (dragOverTargetKey === rightDropKey)
                                        setDragOverTargetKey(null);
                                    }}
                                    onDrop={(e) =>
                                      handleDropOnCell(e, row, day, slot.id, 'first_hour')
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
                                    {!cellLock.locked && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOpenCellFromGrid(row, day, slot.id, 'first_hour')
                                        }
                                        className="mt-auto w-full py-0.5 rounded text-[9px] font-bold text-slate-400 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition cursor-pointer"
                                      >
                                        + ۱س راست
                                      </button>
                                    )}
                                  </div>

                                  {/* نیمه سمت چپ = ساعت دوم */}
                                  <div
                                    onDragOver={(e) => {
                                      if (!isDraggingThisRow || cellLock.locked) return;
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setDragOverTargetKey(leftDropKey);
                                    }}
                                    onDragLeave={() => {
                                      if (dragOverTargetKey === leftDropKey)
                                        setDragOverTargetKey(null);
                                    }}
                                    onDrop={(e) =>
                                      handleDropOnCell(e, row, day, slot.id, 'second_hour')
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
                                    {!cellLock.locked && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOpenCellFromGrid(row, day, slot.id, 'second_hour')
                                        }
                                        className="mt-auto w-full py-0.5 rounded text-[9px] font-bold text-slate-400 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition cursor-pointer"
                                      >
                                        + ۱س چپ
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : fullItems.length > 0 ? (
                              /* حالت ۲: دارای درس یا شعبه‌های کارورزی در کل سانس */
                              <div className="space-y-1">
                                {fullItems.map((o) => renderOfferingChip(o, false))}
                                {!cellLock.locked && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOpenCellFromGrid(row, day, slot.id, 'full')
                                    }
                                    className="w-full py-0.5 rounded border border-dashed border-transparent hover:border-slate-300 dark:hover:border-slate-600 text-[9px] text-slate-400 opacity-0 group-hover/row:opacity-100 hover:text-teal-600 transition cursor-pointer"
                                    title="افزودن مورد جدید (یا شعبه کارورزی) به این سانس"
                                  >
                                    + افزودن مورد دیگر
                                  </button>
                                )}
                              </div>
                            ) : cellLock.locked ? (
                              /* حالت ۳ الف: سلول قفل‌شده */
                              <div className="min-h-[58px] flex items-center justify-center text-slate-300 dark:text-slate-600">
                                <Lock className="w-3.5 h-3.5 opacity-40" />
                              </div>
                            ) : (
                              /* حالت ۳ ب: سلول خالی — کلیک برای ثبت کل سانس یا تفکیک ساعت اول/دوم */
                              <div className="group/empty min-h-[60px] flex flex-col justify-between rounded-lg p-0.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenCellFromGrid(row, day, slot.id, 'full')
                                  }
                                  className="flex-1 w-full rounded-lg border border-dashed border-transparent group-hover/empty:border-teal-300 dark:group-hover/empty:border-teal-700 flex items-center justify-center text-[10px] font-bold text-slate-300 dark:text-slate-700 group-hover/empty:text-teal-600 transition cursor-pointer"
                                >
                                  <span className="opacity-0 group-hover/empty:opacity-100">
                                    + ثبت درس ({slotDuration <= 1 ? 'تک‌ساعت' : 'کل سانس'})
                                  </span>
                                </button>
                                {slotDuration > 1 && (
                                  <div className="hidden group-hover/empty:grid grid-cols-2 gap-1 pt-0.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenCellFromGrid(row, day, slot.id, 'first_hour')
                                      }
                                      className="py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-[8.5px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                                    >
                                      + ۱س راست
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenCellFromGrid(row, day, slot.id, 'second_hour')
                                      }
                                      className="py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-[8.5px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                                    >
                                      + ۱س چپ
                                    </button>
                                  </div>
                                )}
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

      {/* مودال ثبت و مشاهده کامنت‌های هر سلول */}
      {commentModalCell && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 border border-amber-300 dark:border-amber-800 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    یادداشت‌ها و کامنت‌های سلول
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {commentModalCell.row.majorName} ({commentModalCell.row.entryTerm} -{' '}
                    {commentModalCell.row.sectionName}) · {SCHED_DAY_LABELS[commentModalCell.day]}{' '}
                    · {getSchedSlotTitle(commentModalCell.slot, commentModalCell.slotIdx)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCommentModalCell(null);
                  setNewCommentText('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalCommentsList.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-500">
                هنوز هیچ کامنتی در این سلول ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-2">
                {modalCommentsList.map((cmt) => {
                  const canDelete = userRole === 'admin' || cmt.authorId === actor.id;
                  return (
                    <div
                      key={cmt.id}
                      className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-black text-slate-900 dark:text-white">
                          {cmt.authorName}{' '}
                          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                            ({ROLE_LABELS_FA[cmt.authorRole]})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">
                            {new Date(cmt.createdAt).toLocaleDateString('fa-IR')}
                          </span>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => {
                                onPersistCellComments(
                                  cellComments.filter((x) => x.id !== cmt.id)
                                );
                                onNotify('success', 'کامنت حذف شد.');
                              }}
                              className="text-rose-500 hover:text-rose-700 cursor-pointer"
                              title="حذف کامنت"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {cmt.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <form onSubmit={handleAddCellComment} className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <textarea
                rows={3}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="متن یادداشت، پیشنهاد جابجایی، درخواست استاد یا توضیح گروه را بنویسید..."
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-45 text-slate-950 font-black inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ثبت کامنت روی سلول</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال بررسی و رفع تداخل هنگام جابجایی درس با Drag & Drop */}
      {pendingDrop && pendingResolutionEval && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
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
                    {opt.isFree
                      ? opt.capOk
                        ? '✅ خالی و مناسب'
                        : '🟡 خالی (ظرفیت کمتر)'
                      : '⛔ اشغال'}{' '}
                    — {opt.room.name} (ظرفیت {opt.room.capacity} ·{' '}
                    {SCHED_ROOM_TYPE_LABELS[opt.room.roomType]})
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
