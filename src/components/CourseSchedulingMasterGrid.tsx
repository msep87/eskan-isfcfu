import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SchedCellComment,
  SchedCellTextFit,
  SchedClassroom,
  SchedCourseOffering,
  SchedCurriculumCourse,
  SchedDayKey,
  SchedMasterColumnStyle,
  SchedMasterGridLayoutSettings,
  SchedMasterPrintSettings,
  SchedMetaColumnKey,
  SchedProfessor,
  SchedProgramCohort,
  SchedRulesSettings,
  SchedSlotHalf,
  SchedTextOrientation,
  SchedTimeSlot,
  SchedWorkspaceRole,
} from '../types';
import {
  DEFAULT_MASTER_GRID_LAYOUT,
  DEFAULT_MASTER_PRINT_SETTINGS,
} from '../utils/sampleData';
import {
  SCHED_DAY_LABELS,
  SCHED_PAPER_SIZES_MM,
  SCHED_ROOM_TYPE_LABELS,
  buildTermExamConflictMap,
  calculateOfferingBreakdown,
  calculateProfessorLoadSummary,
  checkScheduleEditLock,
  detectOfferingConflicts,
  evaluateOfferingCompleteness,
  exportJsonRowsToExcel,
  formatExamAssignmentShort,
  formatProfessorDepartmentAndField,
  getExamSettingsForTerm,
  getOfferingSlotHalf,
  getSchedSlotTitle,
  getSlotDurationHours,
  getSlotHalfLabel,
  isCourseEligibleForExam,
  isOfferingEffectivelyActive,
  normalizePersianText,
  printSchedHtml,
  round2,
  summarizeSectionOfferings,
} from '../utils/schedulingUtils';
import { escapeHtml } from '../utils/sanitizeHtml';
import {
  CourseSchedulingPrintModal,
  PrintPreviewSummary,
} from './CourseSchedulingPrintModal';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Columns3,
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
  Monitor,
  MoveHorizontal,
  Printer,
  Plus,
  Redo2,
  RotateCcw,
  Scan,
  Search,
  Send,
  Settings2,
  SlidersHorizontal,
  Smartphone,
  Table2,
  Trash2,
  Undo2,
  Users,
  WrapText,
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
  userRole: SchedWorkspaceRole;
  actor: { id: string; name: string };
  isOwnMajorName: (majorName: string) => boolean;
  cellComments: SchedCellComment[];
  onPersistCellComments: (next: SchedCellComment[]) => void;
  onCommitOfferings: (next: SchedCourseOffering[], actionLabel: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  undoLabel?: string;
  redoLabel?: string;
  onUndo: () => void;
  onRedo: () => void;
  onOpenCommonExamModal: () => void;
  onOpenNewOffering: (opts: {
    cohortId?: string;
    sectionId?: string;
    dayOfWeek?: SchedDayKey;
    slotId?: string;
    slotHalf?: SchedSlotHalf;
  }) => void;
  onOpenEditOffering: (offering: SchedCourseOffering) => void;
  onPersistRules?: (next: SchedRulesSettings) => void;
  onFullscreenContainerChange?: (el: HTMLElement | null) => void;
  hasExternalModalOpen?: boolean;
  onCloseExternalModals?: () => void;
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

const ROLE_LABELS_FA: Record<SchedWorkspaceRole, string> = {
  admin: 'مدیر سامانه',
  academic_deputy: 'معاونت آموزشی',
  department_head: 'مدیر گروه',
  education_expert: 'کارشناس آموزش',
};

const META_COL_LABELS: Record<SchedMetaColumnKey, string> = {
  major: 'رشته',
  entry: 'ورودی',
  totalStudents: 'تعداد کل',
  section: 'شعبه / گروه',
};

const TEXT_FIT_LABELS: Record<SchedCellTextFit, string> = {
  wrap: 'شکستن خط (Wrap)',
  shrink: 'کوچک‌سازی فونت (Shrink)',
  clip: 'تک‌خطی با برش (...)',
};

const ORIENTATION_LABELS: Record<SchedTextOrientation, string> = {
  horizontal: 'افقی (عادی)',
  vertical_up: 'عمودی ↑ (پایین به بالا)',
  vertical_down: 'عمودی ↓ (بالا به پایین)',
};

const cloneDefaultLayout = (): SchedMasterGridLayoutSettings => ({
  metaColumns: {
    major: { ...DEFAULT_MASTER_GRID_LAYOUT.metaColumns.major },
    entry: { ...DEFAULT_MASTER_GRID_LAYOUT.metaColumns.entry },
    totalStudents: { ...DEFAULT_MASTER_GRID_LAYOUT.metaColumns.totalStudents },
    section: { ...DEFAULT_MASTER_GRID_LAYOUT.metaColumns.section },
  },
  defaultSlotWidth: DEFAULT_MASTER_GRID_LAYOUT.defaultSlotWidth,
  slotWidthsBySlotId: {},
  scheduleCells: { ...DEFAULT_MASTER_GRID_LAYOUT.scheduleCells },
  columnOverrides: {},
});

const mergeMasterGridLayout = (
  incoming?: SchedMasterGridLayoutSettings
): SchedMasterGridLayoutSettings => {
  const def = cloneDefaultLayout();
  if (!incoming) return def;
  return {
    metaColumns: {
      major: { ...def.metaColumns.major, ...(incoming.metaColumns?.major || {}) },
      entry: { ...def.metaColumns.entry, ...(incoming.metaColumns?.entry || {}) },
      totalStudents: {
        ...def.metaColumns.totalStudents,
        ...(incoming.metaColumns?.totalStudents || {}),
      },
      section: { ...def.metaColumns.section, ...(incoming.metaColumns?.section || {}) },
    },
    defaultSlotWidth:
      typeof incoming.defaultSlotWidth === 'number' && incoming.defaultSlotWidth >= 60
        ? incoming.defaultSlotWidth
        : def.defaultSlotWidth,
    slotWidthsBySlotId: { ...(incoming.slotWidthsBySlotId || {}) },
    scheduleCells: {
      ...def.scheduleCells,
      ...(incoming.scheduleCells || {}),
    },
    columnOverrides: { ...(incoming.columnOverrides || {}) },
  };
};

const getOrientationStyleObj = (orientation?: SchedTextOrientation): React.CSSProperties => {
  if (orientation === 'vertical_up') {
    return {
      writingMode: 'vertical-rl',
      transform: 'rotate(180deg)',
    };
  }
  if (orientation === 'vertical_down') {
    return {
      writingMode: 'vertical-rl',
    };
  }
  return {};
};

const getOrientationPrintCss = (orientation?: SchedTextOrientation): string => {
  if (orientation === 'vertical_up') {
    return 'writing-mode:vertical-rl;transform:rotate(180deg);display:inline-block;margin:0 auto;';
  }
  if (orientation === 'vertical_down') {
    return 'writing-mode:vertical-rl;display:inline-block;margin:0 auto;';
  }
  return '';
};

const computeAdaptiveShrinkFontPx = (
  textLength: number,
  colWidthPx: number,
  basePx: number,
  minPx: number,
  isVertical: boolean,
  rowSpan = 1
): number => {
  if (isVertical) {
    const approxAvailHeight = Math.max(48, rowSpan * 62 - 10);
    if (textLength <= Math.floor(approxAvailHeight / 7)) return basePx;
    return Math.max(
      minPx,
      Math.min(basePx, Number((approxAvailHeight / Math.max(1, textLength) * 1.45).toFixed(1)))
    );
  }
  const availWidth = Math.max(20, colWidthPx - 8);
  const charsPerLine = Math.max(1, textLength);
  const est = (availWidth / charsPerLine) * 1.9;
  return Math.max(minPx, Math.min(basePx, Number(est.toFixed(1))));
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
  onCommitOfferings,
  canUndo,
  canRedo,
  undoLabel,
  redoLabel,
  onUndo,
  onRedo,
  onOpenCommonExamModal,
  onOpenNewOffering,
  onOpenEditOffering,
  onPersistRules,
  onFullscreenContainerChange,
  hasExternalModalOpen = false,
  onCloseExternalModals,
  onNotify,
}) => {
  const isSystemAdmin = userRole === 'admin';
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [immersiveFullscreen, setImmersiveFullscreen] = useState(false);
  const [immersiveHudOpen, setImmersiveHudOpen] = useState(false);
  const [mobileLandscape, setMobileLandscape] = useState(false);
  const [isPortraitViewport, setIsPortraitViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false
  );
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

  // مودال کامنت‌های هر سلول
  const [commentModalCell, setCommentModalCell] = useState<{
    row: MasterRowDisplay;
    day: SchedDayKey;
    slot: SchedTimeSlot;
    slotIdx: number;
  } | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // تنظیمات نمایش اکسل‌مانند ستون‌ها و سلول‌ها (پهنا، جهت عمودی/افقی، Wrap/Shrink)
  const [liveLayout, setLiveLayout] = useState<SchedMasterGridLayoutSettings>(() =>
    mergeMasterGridLayout(rules.masterGridLayout)
  );
  useEffect(() => {
    setLiveLayout(mergeMasterGridLayout(rules.masterGridLayout));
  }, [rules.masterGridLayout]);

  const liveLayoutRef = useRef<SchedMasterGridLayoutSettings>(liveLayout);
  liveLayoutRef.current = liveLayout;

  const commitLayoutSettings = (nextLayout: SchedMasterGridLayoutSettings, toastMsg?: string) => {
    setLiveLayout(nextLayout);
    liveLayoutRef.current = nextLayout;
    if (onPersistRules) {
      onPersistRules({
        ...rules,
        masterGridLayout: nextLayout,
      });
    }
    if (toastMsg) {
      onNotify('success', toastMsg);
    }
  };

  const [layoutModalOpen, setLayoutModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printSettings, setPrintSettings] = useState<SchedMasterPrintSettings>(() => ({
    ...DEFAULT_MASTER_PRINT_SETTINGS,
    ...(rules.masterPrintSettings || {}),
    marginsMm: {
      ...DEFAULT_MASTER_PRINT_SETTINGS.marginsMm,
      ...(rules.masterPrintSettings?.marginsMm || {}),
    },
  }));
  useEffect(() => {
    setPrintSettings({
      ...DEFAULT_MASTER_PRINT_SETTINGS,
      ...(rules.masterPrintSettings || {}),
      marginsMm: {
        ...DEFAULT_MASTER_PRINT_SETTINGS.marginsMm,
        ...(rules.masterPrintSettings?.marginsMm || {}),
      },
    });
  }, [rules.masterPrintSettings]);

  const [layoutTab, setLayoutTab] = useState<'presets_meta' | 'slots_batch' | 'individual_col'>(
    'presets_meta'
  );
  const [selectedBatchMetaKeys, setSelectedBatchMetaKeys] = useState<SchedMetaColumnKey[]>([
    'major',
    'entry',
    'totalStudents',
    'section',
  ]);
  const [batchMetaWidthInput, setBatchMetaWidthInput] = useState('42');
  const [batchMetaBodyOri, setBatchMetaBodyOri] = useState<SchedTextOrientation>('vertical_up');
  const [batchMetaApplyToHeader, setBatchMetaApplyToHeader] = useState<boolean>(false);
  const [batchMetaTextFit, setBatchMetaTextFit] = useState<SchedCellTextFit>('wrap');

  const [selectedBatchSlotKeys, setSelectedBatchSlotKeys] = useState<string[]>([]);
  const [batchSlotColWidthInput, setBatchSlotColWidthInput] = useState('140');
  const [batchSlotHeaderOri, setBatchSlotHeaderOri] = useState<SchedTextOrientation>('horizontal');
  const [batchSlotBodyOri, setBatchSlotBodyOri] = useState<SchedTextOrientation>('horizontal');
  const [batchSlotTextFit, setBatchSlotTextFit] = useState<SchedCellTextFit>('shrink');

  const [indDay, setIndDay] = useState<SchedDayKey>(() => activeDays[0] || 'saturday');
  const [indSlotId, setIndSlotId] = useState<string>(() => sortedSlots[0]?.id || '');

  // وضعیت کشیدن بصری مرز ستون با ماوس
  const [resizeIndicator, setResizeIndicator] = useState<{
    label: string;
    width: number;
    allSameSlot: boolean;
  } | null>(null);
  const resizeSessionRef = useRef<{
    kind: 'meta' | 'slot';
    metaKey?: SchedMetaColumnKey;
    day?: SchedDayKey;
    slotId?: string;
    label: string;
    startX: number;
    startY: number;
    startWidth: number;
    latestWidth: number;
    zoomScale: number;
    rotatedCss: boolean;
    shiftKey: boolean;
  } | null>(null);

  // رفرنس کل پنل تمام‌صفحه + اسکرول‌باکس ماتریس
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const gridScrollRef = useRef<HTMLDivElement | null>(null);
  const hadNativeFullscreenRef = useRef(false);
  const fitStateRef = useRef<{ fitToScreen: boolean; fitZoomPercent: number }>({
    fitToScreen: false,
    fitZoomPercent: 100,
  });

  // پایش جهت صفحه برای پشتیبانی از حالت افقی گوشی
  useEffect(() => {
    const checkViewport = () => {
      if (typeof window !== 'undefined') {
        setIsPortraitViewport(window.innerHeight > window.innerWidth);
      }
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // همگام‌سازی کانتینر تمام‌صفحه برای پورتال شدن فرم‌های شناور و اعلان‌ها داخل لایه بومی تمام‌صفحه
  useEffect(() => {
    const active = isFullscreen || immersiveFullscreen;
    onFullscreenContainerChange?.(active ? wrapperRef.current : null);
  }, [isFullscreen, immersiveFullscreen, onFullscreenContainerChange]);

  useEffect(() => {
    return () => {
      onFullscreenContainerChange?.(null);
    };
  }, [onFullscreenContainerChange]);

  const enterImmersiveFullscreen = async (withLandscape = false) => {
    setImmersiveFullscreen(true);
    setIsFullscreen(false);
    setImmersiveHudOpen(false);
    if (withLandscape) {
      setMobileLandscape(true);
    }
    const el = wrapperRef.current;
    if (el && typeof el.requestFullscreen === 'function') {
      try {
        await el.requestFullscreen();
        hadNativeFullscreenRef.current = Boolean(document.fullscreenElement);
      } catch {
        hadNativeFullscreenRef.current = false;
      }
    }
    const orientationObj = (window.screen as unknown as {
      orientation?: { lock?: (mode: string) => Promise<void> };
    })?.orientation;
    if (withLandscape && orientationObj && typeof orientationObj.lock === 'function') {
      try {
        await orientationObj.lock('landscape');
      } catch {
        // در برخی مرورگرها و آیفریم‌ها چرخش CSS به صورت خودکار اعمال می‌شود
      }
    }
  };

  const exitImmersiveFullscreen = async () => {
    setImmersiveFullscreen(false);
    setImmersiveHudOpen(false);
    setMobileLandscape(false);
    hadNativeFullscreenRef.current = false;
    if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
      try {
        await document.exitFullscreen();
      } catch {
        // چشم‌پوشی از خطای خروج بومی
      }
    }
    const orientationObj = (window.screen as unknown as {
      orientation?: { unlock?: () => void };
    })?.orientation;
    if (orientationObj && typeof orientationObj.unlock === 'function') {
      try {
        orientationObj.unlock();
      } catch {
        // خطا نادیده گرفته می‌شود
      }
    }
  };

  const toggleMobileLandscapeMode = async () => {
    const next = !mobileLandscape;
    setMobileLandscape(next);
    if (next && !immersiveFullscreen) {
      await enterImmersiveFullscreen(true);
      return;
    }
    const orientationObj = (window.screen as unknown as {
      orientation?: { lock?: (mode: string) => Promise<void>; unlock?: () => void };
    })?.orientation;
    if (orientationObj) {
      try {
        if (next && typeof orientationObj.lock === 'function') {
          await orientationObj.lock('landscape');
        } else if (!next && typeof orientationObj.unlock === 'function') {
          orientationObj.unlock();
        }
      } catch {
        // پشتیبانی خودکار CSS rotation فعال می‌ماند
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      const isNativeFs = Boolean(document.fullscreenElement);
      if (isNativeFs) {
        hadNativeFullscreenRef.current = true;
      } else if (hadNativeFullscreenRef.current) {
        hadNativeFullscreenRef.current = false;
        setImmersiveFullscreen(false);
        setImmersiveHudOpen(false);
        setMobileLandscape(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // مدیریت چرخ ماوس: Ctrl + چرخ ماوس => زوم جدول | Shift / Alt + چرخ ماوس => اسکرول افقی چپ و راست
  useEffect(() => {
    const el = gridScrollRef.current;
    const wrapper = wrapperRef.current;
    if (!el && !wrapper) return;

    let ro: ResizeObserver | null = null;
    if (el) {
      const updateWidth = () => setContainerWidth(el.clientWidth);
      updateWidth();
      ro = new ResizeObserver(updateWidth);
      ro.observe(el);
    }

    const handleScrollAndZoomWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (delta === 0) return;
        const step = delta < 0 ? 8 : -8;
        const curFit = fitStateRef.current;
        setFitToScreen(false);
        setZoomPercent((prev) => {
          const base = curFit.fitToScreen ? curFit.fitZoomPercent : prev;
          return Math.max(28, Math.min(150, base + step));
        });
        return;
      }
      if ((e.shiftKey || e.altKey) && el) {
        e.preventDefault();
        const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        el.scrollLeft -= delta * 1.4;
      }
    };

    const targetEl = wrapper || el;
    targetEl?.addEventListener('wheel', handleScrollAndZoomWheel, { passive: false });
    return () => {
      targetEl?.removeEventListener('wheel', handleScrollAndZoomWheel);
      ro?.disconnect();
    };
  }, [isFullscreen, immersiveFullscreen, mobileLandscape, programs.length, rowGrouping, onlyPopulatedView]);

  // کلیدهای ترکیبی Ctrl+Z (Undo) و Ctrl+Y / Ctrl+Shift+Z (Redo) و خروج با Esc
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toUpperCase();
      const isEditingText =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        Boolean(target?.isContentEditable);

      if (e.key === 'Escape') {
        if (hasExternalModalOpen) {
          onCloseExternalModals?.();
          return;
        }
        if (printModalOpen) {
          setPrintModalOpen(false);
          return;
        }
        if (layoutModalOpen) {
          setLayoutModalOpen(false);
          return;
        }
        if (commentModalCell) {
          setCommentModalCell(null);
          return;
        }
        if (pendingDrop) {
          setPendingDrop(null);
          return;
        }
        if (immersiveFullscreen) {
          void exitImmersiveFullscreen();
          return;
        }
        if (isFullscreen) {
          setIsFullscreen(false);
          return;
        }
      }

      if (
        isEditingText ||
        hasExternalModalOpen ||
        printModalOpen ||
        layoutModalOpen ||
        pendingDrop ||
        commentModalCell
      )
        return;

      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        const keyLower = e.key.toLowerCase();
        const isRedo =
          e.code === 'KeyY' ||
          keyLower === 'y' ||
          ((e.code === 'KeyZ' || keyLower === 'z') && e.shiftKey);
        const isUndo = (e.code === 'KeyZ' || keyLower === 'z') && !e.shiftKey;

        if (isRedo && canRedo) {
          e.preventDefault();
          onRedo();
        } else if (isUndo && canUndo) {
          e.preventDefault();
          onUndo();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isFullscreen,
    immersiveFullscreen,
    hasExternalModalOpen,
    onCloseExternalModals,
    printModalOpen,
    layoutModalOpen,
    pendingDrop,
    commentModalCell,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
  ]);

  const globalLockStatus = useMemo(
    () => checkScheduleEditLock(rules, userRole, actor.id),
    [rules, userRole, actor.id]
  );

  const examSettings = useMemo(
    () => getExamSettingsForTerm(rules, activeTerm),
    [rules, activeTerm]
  );

  const examConflictMap = useMemo(
    () => buildTermExamConflictMap(termOfferings, rules),
    [termOfferings, rules]
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

    return buildMasterDisplayRows(filtered);
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

  function buildMasterDisplayRows(filtered: MasterRowRaw[]): MasterRowDisplay[] {
    const result: MasterRowDisplay[] = filtered.map((r) => ({
      ...r,
      isFirstMajorBlock: false,
      majorBlockSpan: 1,
      isFirstEntryBlock: false,
      entryBlockSpan: 1,
      isFirstCohortBlock: false,
      cohortBlockSpan: 1,
    }));

    for (let i = 0; i < result.length; ) {
      let j = i + 1;
      while (j < result.length && result[j].majorCode === result[i].majorCode) j++;
      result[i].isFirstMajorBlock = true;
      result[i].majorBlockSpan = j - i;
      i = j;
    }

    for (let i = 0; i < result.length; ) {
      let j = i + 1;
      while (j < result.length && result[j].entryTerm === result[i].entryTerm) j++;
      result[i].isFirstEntryBlock = true;
      result[i].entryBlockSpan = j - i;
      i = j;
    }

    for (let i = 0; i < result.length; ) {
      let j = i + 1;
      while (j < result.length && result[j].cohortId === result[i].cohortId) j++;
      result[i].isFirstCohortBlock = true;
      result[i].cohortBlockSpan = j - i;
      i = j;
    }

    return result;
  }

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

  const metaColWidths = useMemo(() => {
    const clampW = (val: number | undefined, fallback: number, min = 26, max = 380) =>
      typeof val === 'number' && !Number.isNaN(val) ? Math.max(min, Math.min(max, Math.round(val))) : fallback;
    return {
      major: clampW(liveLayout.metaColumns.major?.width, 114, 28, 360),
      entry: clampW(liveLayout.metaColumns.entry?.width, 64, 26, 240),
      totalStudents: clampW(liveLayout.metaColumns.totalStudents?.width, 56, 24, 180),
      section: clampW(liveLayout.metaColumns.section?.width, 104, 28, 300),
    };
  }, [liveLayout.metaColumns]);

  const stickyOffsets = useMemo(() => {
    const firstWidth =
      rowGrouping === 'by_major' ? metaColWidths.major : metaColWidths.entry;
    const secondWidth =
      rowGrouping === 'by_major' ? metaColWidths.entry : metaColWidths.major;
    const thirdRight = firstWidth + secondWidth;
    const fourthRight = thirdRight + metaColWidths.totalStudents;
    return {
      firstRight: 0,
      secondRight: firstWidth,
      thirdRight,
      fourthRight,
      totalMetaWidth: fourthRight + metaColWidths.section,
    };
  }, [rowGrouping, metaColWidths]);

  const getSlotColumnStyle = (day: SchedDayKey, slotId: string) => {
    const colKey = `${day}:${slotId}`;
    const override = liveLayout.columnOverrides?.[colKey];
    const slotBatchW = liveLayout.slotWidthsBySlotId?.[slotId];
    const rawW = override?.width ?? slotBatchW ?? liveLayout.defaultSlotWidth ?? 168;
    const width = Math.max(64, Math.min(440, Math.round(rawW)));
    return {
      width,
      headerOrientation:
        override?.headerOrientation ?? liveLayout.scheduleCells.headerOrientation ?? 'horizontal',
      bodyOrientation:
        override?.bodyOrientation ?? liveLayout.scheduleCells.bodyOrientation ?? 'horizontal',
      textFit: override?.textFit ?? liveLayout.scheduleCells.textFit ?? 'wrap',
      fontSizePx: override?.fontSizePx ?? liveLayout.scheduleCells.fontSizePx,
    };
  };

  const fitZoomPercent = useMemo(() => {
    let slotColumnsSum = 0;
    for (const d of displayedDays) {
      for (const s of displayedSlots) {
        slotColumnsSum += getSlotColumnStyle(d, s.id).width;
      }
    }
    const naturalTableWidth = stickyOffsets.totalMetaWidth + slotColumnsSum;
    if (!containerWidth || naturalTableWidth <= 0) return 100;
    return Math.max(28, Math.min(100, Math.floor(((containerWidth - 8) / naturalTableWidth) * 100)));
  }, [containerWidth, stickyOffsets.totalMetaWidth, displayedDays, displayedSlots, liveLayout]);

  const effectiveZoom = fitToScreen ? fitZoomPercent : zoomPercent;
  fitStateRef.current = { fitToScreen, fitZoomPercent };

  // شروع و ادامه تغییر اندازه بصری ستون با ماوس
  const startColumnResize = (
    e: React.MouseEvent,
    opts:
      | { kind: 'meta'; metaKey: SchedMetaColumnKey; label: string; currentWidth: number }
      | { kind: 'slot'; day: SchedDayKey; slotId: string; label: string; currentWidth: number }
  ) => {
    if (!isSystemAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    const zoomScale = Math.max(0.25, effectiveZoom / 100);
    const rotatedCss = mobileLandscape && isPortraitViewport;
    resizeSessionRef.current = {
      kind: opts.kind,
      metaKey: opts.kind === 'meta' ? opts.metaKey : undefined,
      day: opts.kind === 'slot' ? opts.day : undefined,
      slotId: opts.kind === 'slot' ? opts.slotId : undefined,
      label: opts.label,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: opts.currentWidth,
      latestWidth: opts.currentWidth,
      zoomScale,
      rotatedCss,
      shiftKey: e.shiftKey,
    };
    setResizeIndicator({
      label: opts.label,
      width: opts.currentWidth,
      allSameSlot: opts.kind === 'slot' && e.shiftKey,
    });
  };

  useEffect(() => {
    if (!resizeIndicator) return;
    const handleMouseMove = (e: MouseEvent) => {
      const sess = resizeSessionRef.current;
      if (!sess) return;
      // در جدول راست‌به‌چپ با کشیدن لبه چپ به سمت چپ (کاهش X) عرض افزایش می‌یابد
      const rawDelta = sess.rotatedCss ? sess.startY - e.clientY : sess.startX - e.clientX;
      const adjustedDelta = rawDelta / sess.zoomScale;
      const minW = sess.kind === 'meta' ? 26 : 64;
      const maxW = sess.kind === 'meta' ? 380 : 440;
      const nextW = Math.max(minW, Math.min(maxW, Math.round(sess.startWidth + adjustedDelta)));
      sess.latestWidth = nextW;
      const useShift = sess.shiftKey || e.shiftKey;
      sess.shiftKey = useShift;

      setResizeIndicator({
        label: sess.label,
        width: nextW,
        allSameSlot: sess.kind === 'slot' && useShift,
      });

      setLiveLayout((prev) => {
        if (sess.kind === 'meta' && sess.metaKey) {
          return {
            ...prev,
            metaColumns: {
              ...prev.metaColumns,
              [sess.metaKey]: {
                ...(prev.metaColumns[sess.metaKey] || {}),
                width: nextW,
              },
            },
          };
        }
        if (sess.kind === 'slot' && sess.day && sess.slotId) {
          if (useShift) {
            const nextOverrides = { ...(prev.columnOverrides || {}) };
            // پاک کردن override عرض روزهای مختلف همین سانس تا عرض دسته‌ای سانس اعمال شود
            Object.keys(nextOverrides).forEach((k) => {
              if (k.endsWith(`:${sess.slotId}`) && nextOverrides[k]?.width !== undefined) {
                const { width: _w, ...rest } = nextOverrides[k];
                if (Object.keys(rest).length === 0) delete nextOverrides[k];
                else nextOverrides[k] = rest;
              }
            });
            return {
              ...prev,
              slotWidthsBySlotId: {
                ...(prev.slotWidthsBySlotId || {}),
                [sess.slotId]: nextW,
              },
              columnOverrides: nextOverrides,
            };
          }
          const colKey = `${sess.day}:${sess.slotId}`;
          return {
            ...prev,
            columnOverrides: {
              ...(prev.columnOverrides || {}),
              [colKey]: {
                ...(prev.columnOverrides?.[colKey] || {}),
                width: nextW,
              },
            },
          };
        }
        return prev;
      });
    };

    const handleMouseUp = () => {
      const sess = resizeSessionRef.current;
      resizeSessionRef.current = null;
      setResizeIndicator(null);
      if (sess) {
        commitLayoutSettings(liveLayoutRef.current);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [Boolean(resizeIndicator)]);

  const resetSingleColumnWidth = (
    opts: { kind: 'meta'; metaKey: SchedMetaColumnKey } | { kind: 'slot'; day: SchedDayKey; slotId: string }
  ) => {
    if (!isSystemAdmin) return;
    if (opts.kind === 'meta') {
      const defW = DEFAULT_MASTER_GRID_LAYOUT.metaColumns[opts.metaKey]?.width || 80;
      const next: SchedMasterGridLayoutSettings = {
        ...liveLayout,
        metaColumns: {
          ...liveLayout.metaColumns,
          [opts.metaKey]: {
            ...liveLayout.metaColumns[opts.metaKey],
            width: defW,
          },
        },
      };
      commitLayoutSettings(next, `پهنای ستون «${META_COL_LABELS[opts.metaKey]}» به مقدار پیش‌فرض بازگشت.`);
    } else {
      const colKey = `${opts.day}:${opts.slotId}`;
      const nextOverrides = { ...(liveLayout.columnOverrides || {}) };
      if (nextOverrides[colKey]) {
        const { width: _w, ...rest } = nextOverrides[colKey];
        if (Object.keys(rest).length === 0) delete nextOverrides[colKey];
        else nextOverrides[colKey] = rest;
      }
      commitLayoutSettings(
        {
          ...liveLayout,
          columnOverrides: nextOverrides,
        },
        'عرض ستون به پیش‌فرض سانس بازنشانی شد.'
      );
    }
  };

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
      .filter((o) => !o.isDisabled && o.classroomId === focusRoomId && o.dayOfWeek)
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

    const candidateBase: SchedCourseOffering = {
      ...dragged,
      dayOfWeek: targetDay,
      slotIds: newSlotIds,
      slotParts: newSlotParts,
      isDisabled: false,
      isProvisional: false,
      disabledReason: undefined,
      updatedById: actor.id,
      updatedByName: actor.name,
      updatedAt: new Date().toISOString(),
    };
    const movedComp = evaluateOfferingCompleteness(candidateBase, rules);
    const candidate: SchedCourseOffering = movedComp.isComplete
      ? candidateBase
      : {
          ...candidateBase,
          isProvisional: true,
          isDisabled: true,
          disabledReason: movedComp.missingItems.join(' | ') || dragged.disabledReason,
        };

    const report = detectOfferingConflicts(candidateBase, termOfferings, classrooms, professors, rules);
    const hasProfUnavail = report.warnings.some((w) => w.includes('عدم امکان حضور'));

    if (!report.hasHardConflict && !hasProfUnavail) {
      onCommitOfferings(
        offerings.map((o) => (o.id === dragged.id ? candidate : o)),
        `جابجایی «${dragged.courseTitle}» به ${SCHED_DAY_LABELS[targetDay]}`
      );
      onNotify(
        'success',
        `درس «${dragged.courseTitle}» به ${SCHED_DAY_LABELS[targetDay]} (${newSlotIds
          .map((id) => {
            const idx = sortedSlots.findIndex((s) => s.id === id);
            return idx >= 0 ? getSchedSlotTitle(sortedSlots[idx], idx) : id;
          })
          .join(' + ')}) منتقل شد${movedComp.isComplete ? '.' : ' (وضعیت: موقت / نیازمند تکمیل).'}`
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

    const candidateDraft: SchedCourseOffering = {
      ...pendingDrop.originalOffering,
      dayOfWeek: pendingDrop.targetDay,
      slotIds: pendingDrop.targetSlotIds,
      slotParts: pendingDrop.targetSlotParts,
      professorId: prof?.id,
      professorCode: prof?.professorCode,
      professorName: prof?.fullName,
      classroomId: room?.id,
      classroomName: room?.name,
      isDisabled: false,
      isProvisional: false,
      disabledReason: undefined,
      updatedById: actor.id,
      updatedByName: actor.name,
      updatedAt: new Date().toISOString(),
    };
    const compAfterFix = evaluateOfferingCompleteness(candidateDraft, rules);
    const candidate: SchedCourseOffering = compAfterFix.isComplete
      ? candidateDraft
      : {
          ...candidateDraft,
          isProvisional: true,
          isDisabled: true,
          disabledReason: compAfterFix.missingItems.join(' | '),
        };

    const report = detectOfferingConflicts(candidateDraft, termOfferings, classrooms, professors, rules);

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

  // محاسبه محدوده ردیف‌ها و روزها و ضریب مقیاس برای چاپ و پیش‌نمایش اکسل‌مانند
  const resolvePrintScopeAndScale = (cfg: SchedMasterPrintSettings) => {
    let targetDays: SchedDayKey[];
    let targetRows: MasterRowDisplay[];

    if (cfg.printScope === 'all_rows_and_days') {
      targetDays = activeDays;
      targetRows = buildMasterDisplayRows(allRawRows);
    } else if (cfg.printScope === 'populated_only') {
      const popDays = activeDays.filter((d) =>
        termOfferings.some((o) => o.dayOfWeek === d && o.slotIds.length > 0)
      );
      targetDays = popDays.length > 0 ? popDays : activeDays;
      const popRaw = allRawRows.filter((r) =>
        termOfferings.some(
          (o) => o.dayOfWeek && o.slotIds.length > 0 && doesOfferingBelongToRow(o, r)
        )
      );
      targetRows = buildMasterDisplayRows(popRaw.length > 0 ? popRaw : allRawRows);
    } else {
      targetDays = displayedDays;
      targetRows = displayRows;
    }

    const useLayout = cfg.useLayoutWidthsAndOrientations;
    const wMajor = useLayout ? metaColWidths.major : 110;
    const wEntry = useLayout ? metaColWidths.entry : 56;
    const wTotal = useLayout ? metaColWidths.totalStudents : 48;
    const wSec = useLayout ? metaColWidths.section : 88;
    const metaTotalW = wMajor + wEntry + wTotal + wSec;

    let slotsSumW = 0;
    targetDays.forEach((d) => {
      displayedSlots.forEach((s) => {
        slotsSumW += useLayout ? getSlotColumnStyle(d, s.id).width : 145;
      });
    });
    const totalTableWidthPx = Math.max(300, metaTotalW + slotsSumW);

    const spec = SCHED_PAPER_SIZES_MM[cfg.paperSize] || SCHED_PAPER_SIZES_MM.A4;
    const isLand = cfg.orientation === 'landscape';
    const pageWmm = isLand ? spec.heightMm : spec.widthMm;
    const pageHmm = isLand ? spec.widthMm : spec.heightMm;
    const printableWpx = Math.max(
      180,
      (pageWmm - cfg.marginsMm.left - cfg.marginsMm.right) * 3.7795
    );
    const printableHpx = Math.max(
      180,
      (pageHmm - cfg.marginsMm.top - cfg.marginsMm.bottom) * 3.7795
    );

    let scaleZoom = 1;
    if (cfg.scalingMode === 'custom_percent') {
      scaleZoom = Math.max(0.25, Math.min(1.8, (cfg.scalePercent || 100) / 100));
    } else if (cfg.scalingMode === 'fit_n_pages_wide') {
      const pagesW = Math.max(1, cfg.fitPagesWide || 1);
      scaleZoom = Math.min(1, Math.max(0.2, (printableWpx * pagesW - 8) / totalTableWidthPx));
    } else {
      scaleZoom = Math.min(1, Math.max(0.2, (printableWpx - 8) / totalTableWidthPx));
    }

    const estTableHpx = (targetRows.length * 52 + 95) * scaleZoom;
    if (cfg.scalingMode === 'fit_1_page' && estTableHpx > printableHpx) {
      scaleZoom = Math.max(0.2, scaleZoom * ((printableHpx - 12) / estTableHpx));
    }

    const pagesW =
      cfg.scalingMode === 'fit_n_pages_wide'
        ? Math.max(1, cfg.fitPagesWide || 1)
        : Math.max(1, Math.ceil((totalTableWidthPx * scaleZoom) / printableWpx));
    const pagesH =
      cfg.scalingMode === 'fit_1_page'
        ? 1
        : Math.max(1, Math.ceil(estTableHpx / printableHpx));

    return {
      targetDays,
      targetRows,
      wMajor,
      wEntry,
      wTotal,
      wSec,
      totalTableWidthPx,
      scaleZoom,
      computedScalePercent: Math.round(scaleZoom * 100),
      estimatedPages: Math.max(1, pagesW * pagesH),
    };
  };

  const printPreviewSummary = useMemo<PrintPreviewSummary>(() => {
    const resolved = resolvePrintScopeAndScale(printSettings);
    const sampleRows = resolved.targetRows.slice(0, 5).map((r) => {
      const cells: string[] = [];
      resolved.targetDays.slice(0, 3).forEach((d) => {
        displayedSlots.slice(0, 2).forEach((s) => {
          const item = termOfferings.find(
            (o) =>
              doesOfferingBelongToRow(o, r) &&
              o.dayOfWeek === d &&
              o.slotIds.includes(s.id)
          );
          cells.push(item ? item.courseTitle : '');
        });
      });
      return {
        major: r.majorName,
        entry: r.entryTerm,
        total: r.totalCohortStudents.toLocaleString('fa-IR'),
        section: r.sectionName,
        cells,
      };
    });
    return {
      rowsCount: resolved.targetRows.length,
      daysCount: resolved.targetDays.length,
      slotsCount: displayedSlots.length,
      totalTableWidthPx: resolved.totalTableWidthPx,
      computedScalePercent: resolved.computedScalePercent,
      estimatedPages: resolved.estimatedPages,
      dayLabels: resolved.targetDays.map((d) => SCHED_DAY_LABELS[d]),
      slotHeaders: displayedSlots.map((s, idx) =>
        getSchedSlotTitle(s, slotOriginalIndexMap.get(s.id) ?? idx)
      ),
      sampleRows,
    };
  }, [
    printSettings,
    displayedDays,
    displayedSlots,
    displayRows,
    allRawRows,
    activeDays,
    termOfferings,
    liveLayout,
    metaColWidths,
    slotOriginalIndexMap,
  ]);

  // چاپ ماتریس جامع با اعمال کامل تنظیمات اکسل‌مانند صفحه، حاشیه، مقیاس، رنگ، سرصفحه و محتوا
  const executeMasterGridPrint = (cfg: SchedMasterPrintSettings) => {
    const resolved = resolvePrintScopeAndScale(cfg);
    const useLayout = cfg.useLayoutWidthsAndOrientations;
    const mMajor = liveLayout.metaColumns.major;
    const mEntry = liveLayout.metaColumns.entry;
    const mTotal = liveLayout.metaColumns.totalStudents;
    const mSec = liveLayout.metaColumns.section;

    const DAY_PRINT_BG = [
      '#e0f2fe',
      '#d1fae5',
      '#e0e7ff',
      '#fef3c7',
      '#ede9fe',
      '#ffe4e6',
      '#ccfbf1',
    ];
    const MAJOR_PRINT_BG = [
      '#fae8ff',
      '#e0f2fe',
      '#d1fae5',
      '#fef3c7',
      '#e0e7ff',
      '#ffe4e6',
      '#ccfbf1',
      '#ede9fe',
    ];

    const wrapPrintSpan = (txt: string, ori?: SchedTextOrientation, fit?: SchedCellTextFit) => {
      const oriCss = useLayout ? getOrientationPrintCss(ori) : '';
      const fitCss =
        fit === 'shrink'
          ? `font-size:${Math.max(7, cfg.fontSizePx - 1.5)}px;line-height:1.15;`
          : fit === 'clip'
          ? 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;'
          : 'white-space:normal;word-break:break-word;line-height:1.22;';
      return `<div style="${oriCss}${fitCss}">${txt}</div>`;
    };

    const dayThs = resolved.targetDays
      .map((d, dIdx) => {
        const bg = cfg.includeColors
          ? `background:${DAY_PRINT_BG[dIdx % DAY_PRINT_BG.length]};`
          : '';
        const borderCss = cfg.boldDayBorders ? 'border-right:2.5px solid #0f172a;' : '';
        return `<th colspan="${displayedSlots.length}" style="${bg}${borderCss}font-size:${cfg.fontSizePx + 1}px;">${escapeHtml(
          SCHED_DAY_LABELS[d]
        )}</th>`;
      })
      .join('');

    const slotThs = resolved.targetDays
      .flatMap((day, dIdx) =>
        displayedSlots.map((s, sIdx) => {
          const origIdx = slotOriginalIndexMap.get(s.id) ?? 0;
          const cStyle = getSlotColumnStyle(day, s.id);
          const colW = useLayout ? cStyle.width : 145;
          const bg = cfg.includeColors
            ? `background:${DAY_PRINT_BG[dIdx % DAY_PRINT_BG.length]}66;`
            : '';
          const firstBorder =
            cfg.boldDayBorders && sIdx === 0 ? 'border-right:2.5px solid #0f172a;' : '';
          const content = `${escapeHtml(getSchedSlotTitle(s, origIdx))}<div class="mono muted">${escapeHtml(
            s.startTime
          )}-${escapeHtml(s.endTime)}</div>`;
          return `<th style="width:${colW}px;${bg}${firstBorder}font-size:${Math.max(
            7.5,
            cfg.fontSizePx - 1
          )}px;">${wrapPrintSpan(
            content,
            useLayout ? cStyle.headerOrientation : 'horizontal',
            'wrap'
          )}</th>`;
        })
      )
      .join('');

    const bodyRows = resolved.targetRows
      .map((row) => {
        const majorHtml = wrapPrintSpan(
          escapeHtml(row.majorName),
          mMajor.bodyOrientation,
          mMajor.textFit
        );
        const entryHtml = wrapPrintSpan(
          escapeHtml(row.entryTerm),
          mEntry.bodyOrientation,
          mEntry.textFit
        );
        const totalHtml = wrapPrintSpan(
          row.totalCohortStudents.toLocaleString('fa-IR'),
          mTotal.bodyOrientation,
          mTotal.textFit
        );
        const sectionHtml = wrapPrintSpan(
          `${escapeHtml(row.sectionName)}<div class="muted">${row.sectionStudentCount.toLocaleString('fa-IR')} نفر</div>`,
          mSec.bodyOrientation,
          mSec.textFit
        );
        const majorBg = cfg.includeColors
          ? `background:${MAJOR_PRINT_BG[row.majorColorIdx % MAJOR_PRINT_BG.length]};`
          : '';

        const prefixCells =
          rowGrouping === 'by_entry'
            ? [
                row.isFirstEntryBlock
                  ? `<td rowspan="${row.entryBlockSpan}" class="mono" style="width:${resolved.wEntry}px;font-weight:800;vertical-align:middle;text-align:center;">${entryHtml}</td>`
                  : '',
                row.isFirstCohortBlock
                  ? `<td rowspan="${row.cohortBlockSpan}" style="width:${resolved.wMajor}px;${majorBg}font-weight:800;vertical-align:middle;text-align:center;">${majorHtml}</td>`
                  : '',
                row.isFirstCohortBlock
                  ? `<td rowspan="${row.cohortBlockSpan}" style="width:${resolved.wTotal}px;vertical-align:middle;text-align:center;">${totalHtml}</td>`
                  : '',
                `<td style="width:${resolved.wSec}px;text-align:center;font-weight:700;">${sectionHtml}</td>`,
              ].join('')
            : [
                row.isFirstMajorBlock
                  ? `<td rowspan="${row.majorBlockSpan}" style="width:${resolved.wMajor}px;${majorBg}font-weight:800;vertical-align:middle;text-align:center;">${majorHtml}</td>`
                  : '',
                row.isFirstCohortBlock
                  ? `<td rowspan="${row.cohortBlockSpan}" class="mono" style="width:${resolved.wEntry}px;font-weight:700;vertical-align:middle;text-align:center;">${entryHtml}</td>`
                  : '',
                row.isFirstCohortBlock
                  ? `<td rowspan="${row.cohortBlockSpan}" style="width:${resolved.wTotal}px;vertical-align:middle;text-align:center;">${totalHtml}</td>`
                  : '',
                `<td style="width:${resolved.wSec}px;text-align:center;font-weight:700;">${sectionHtml}</td>`,
              ].join('');

        const scheduleCells = resolved.targetDays
          .flatMap((day, dIdx) =>
            displayedSlots.map((slot, sIdx) => {
              const cStyle = getSlotColumnStyle(day, slot.id);
              const colW = useLayout ? cStyle.width : 145;
              const firstBorder =
                cfg.boldDayBorders && sIdx === 0 ? 'border-right:2.5px solid #0f172a;' : '';
              const zebraBg =
                cfg.includeColors && dIdx % 2 === 1 ? 'background:#f8fafc;' : '';
              const items = termOfferings.filter(
                (o) =>
                  doesOfferingBelongToRow(o, row) &&
                  o.dayOfWeek === day &&
                  o.slotIds.includes(slot.id)
              );
              const commentsHere = cfg.includeComments
                ? commentsByCellKey.get(`${row.rowKey}|${day}|${slot.id}`) || []
                : [];

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
                  const subParts: string[] = [];
                  if (cfg.includeProfessor) {
                    subParts.push(escapeHtml(o.professorName || 'بدون استاد'));
                  }
                  if (cfg.includeClassroom && o.classroomName) {
                    subParts.push(escapeHtml(o.classroomName));
                  }
                  if (
                    cfg.includeExamInfo &&
                    isCourseEligibleForExam(o) &&
                    o.examDayId &&
                    o.examSlotId
                  ) {
                    subParts.push(`آزمون: ${escapeHtml(formatExamAssignmentShort(o, examSettings))}`);
                  }
                  if (cfg.includeSharedTag && o.sharedWithTargets && o.sharedWithTargets.length > 0) {
                    subParts.push(
                      o.cohortId !== row.cohortId
                        ? `مشترک از ${escapeHtml(o.ownerMajorName)}`
                        : `مشترک (${o.sharedWithTargets.length})`
                    );
                  }
                  const subLine =
                    subParts.length > 0
                      ? `<div class="muted">${subParts.join(' · ')}</div>`
                      : '';
                  const compPrint = evaluateOfferingCompleteness(o, rules);
                  const provTag = compPrint.isEffectivelyInactive ? ' [موقت/ناقص]' : '';
                  const inner = `<strong>${escapeHtml(o.courseTitle)}${escapeHtml(internTag)}${escapeHtml(roleTag)}${escapeHtml(halfTag)}${escapeHtml(provTag)}</strong>${subLine}`;
                  const itemBg = cfg.includeColors
                    ? compPrint.isEffectivelyInactive
                      ? 'background:#fef3c7;border-color:#f59e0b;border-style:dashed;opacity:0.85;'
                      : o.practicalType === 'internship'
                      ? 'background:#f5f3ff;border-color:#ddd6fe;'
                      : o.cohortId !== row.cohortId
                      ? 'background:#eef2ff;border-color:#c7d2fe;'
                      : 'background:#f0fdfa;border-color:#99f6e4;'
                    : 'background:#ffffff;border-color:#cbd5e1;';
                  return `<div class="cell-item" style="${itemBg}">${wrapPrintSpan(
                    inner,
                    useLayout ? cStyle.bodyOrientation : 'horizontal',
                    cStyle.textFit
                  )}</div>`;
                })
                .join('');

              const cmtHtml =
                commentsHere.length > 0
                  ? `<div class="muted" style="margin-top:2px;border-top:1px dashed #cbd5e1;padding-top:1px;">💬 ${commentsHere
                      .map((c) => escapeHtml(c.text))
                      .join(' | ')}</div>`
                  : '';

              return `<td style="width:${colW}px;${firstBorder}${zebraBg}">${htmlItems}${cmtHtml}</td>`;
            })
          )
          .join('');

        return `<tr>${prefixCells}${scheduleCells}</tr>`;
      })
      .join('');

    const html = `
      <table style="table-layout:fixed;width:${resolved.totalTableWidthPx}px;">
        <thead>
          <tr>
            ${
              rowGrouping === 'by_entry'
                ? `<th rowspan="2" style="width:${resolved.wEntry}px;">${wrapPrintSpan('ورودی', mEntry.headerOrientation, 'wrap')}</th><th rowspan="2" style="width:${resolved.wMajor}px;">${wrapPrintSpan('رشته', mMajor.headerOrientation, 'wrap')}</th>`
                : `<th rowspan="2" style="width:${resolved.wMajor}px;">${wrapPrintSpan('رشته', mMajor.headerOrientation, 'wrap')}</th><th rowspan="2" style="width:${resolved.wEntry}px;">${wrapPrintSpan('ورودی', mEntry.headerOrientation, 'wrap')}</th>`
            }
            <th rowspan="2" style="width:${resolved.wTotal}px;">${wrapPrintSpan('تعداد', mTotal.headerOrientation, 'wrap')}</th>
            <th rowspan="2" style="width:${resolved.wSec}px;">${wrapPrintSpan('شعبه / گروه', mSec.headerOrientation, 'wrap')}</th>
            ${dayThs}
          </tr>
          <tr>${slotThs}</tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    `;

    const printTitle = cfg.customTitle.trim() || `برنامه جامع و فراگیر ترم ${activeTerm}`;
    const customHeaderHtml = cfg.showHeaderBanner
      ? `<div class="print-header">
          <div>
            <h1>${escapeHtml(printTitle)}</h1>
            ${
              cfg.customSubtitle.trim()
                ? `<div class="print-subtitle">${escapeHtml(cfg.customSubtitle.trim())}</div>`
                : `<div class="muted">دانشگاه فرهنگیان استان اصفهان • سامانه جامع برنامه‌ریزی درسی</div>`
            }
          </div>
          <div class="print-meta">
            ${cfg.showPrintDate ? `<div>تاریخ چاپ: ${new Date().toLocaleDateString('fa-IR')}</div>` : ''}
            ${cfg.showActorName ? `<div>تنظیم/چاپ: ${escapeHtml(actor.name)}</div>` : ''}
          </div>
        </div>`
      : '';

    const customFooterHtml =
      cfg.footerNote.trim() || cfg.showSignatureBlock
        ? `<div class="print-footer">
            ${cfg.footerNote.trim() ? `<div>${escapeHtml(cfg.footerNote.trim())}</div>` : ''}
            ${
              cfg.showSignatureBlock
                ? `<div class="sig-grid">
                    <div class="sig-box">تأیید مدیر گروه آموزشی</div>
                    <div class="sig-box">تأیید معاونت آموزشی</div>
                    <div class="sig-box">تأیید ریاست پردیس</div>
                  </div>`
                : ''
            }
          </div>`
        : '';

    printSchedHtml(printTitle, html, cfg.orientation === 'landscape', {
      paperSize: cfg.paperSize,
      marginsMm: cfg.marginsMm,
      scaleZoom: resolved.scaleZoom,
      fitSinglePage: cfg.scalingMode === 'fit_1_page',
      colorMode: cfg.colorMode,
      showGridlines: cfg.showGridlines,
      repeatHeaderRows: cfg.repeatHeaderRows,
      avoidRowBreak: cfg.avoidRowBreak,
      centerHorizontally: cfg.centerHorizontally,
      centerVertically: cfg.centerVertically,
      fontSizePx: cfg.fontSizePx,
      cellPaddingPx: cfg.cellPaddingPx,
      hideDefaultHeader: !cfg.showHeaderBanner,
      customHeaderHtml,
      customFooterHtml,
    });
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
                    const examStr =
                      isCourseEligibleForExam(o) && o.examDayId && o.examSlotId
                        ? ` {آزمون: ${formatExamAssignmentShort(o, examSettings)}}`
                        : '';
                    return `${hLabel}${o.courseTitle}${intern} - ${o.professorName || 'بدون استاد'}${o.classroomName ? ` [${o.classroomName}]` : ''}${examStr}`;
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

  const isLandscapeRotatedCss = mobileLandscape && isPortraitViewport;
  const anyFullscreen = isFullscreen || immersiveFullscreen;

  return (
    <div
      ref={wrapperRef}
      dir="rtl"
      className={
        isLandscapeRotatedCss
          ? 'fixed top-0 left-0 w-[100dvh] h-[100dvw] origin-top-left [transform:translateX(100dvw)_rotate(90deg)] z-[98] bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden'
          : immersiveFullscreen
          ? 'fixed inset-0 z-[95] bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden'
          : isFullscreen
          ? 'fixed inset-0 z-[55] bg-slate-50 dark:bg-slate-950 flex flex-col p-2.5 sm:p-3 overflow-hidden space-y-2.5'
          : 'space-y-4'
      }
    >
      {/* حالت کاملاً تمام‌صفحه: نوار کنترل کشویی مخفی‌شونده خودکار (Auto-Hide) بدون اشغال فضای صفحه */}
      {immersiveFullscreen && (
        <>
          {/* ناحیه حساس لبه بالایی برای آشکارسازی خودکار ابزارها با ماوس */}
          <div
            onMouseEnter={() => setImmersiveHudOpen(true)}
            className="fixed top-0 inset-x-0 h-3 z-[62] cursor-pointer"
          />

          {/* دستگیره کوچک و کم‌مزاحمت گوشه بالا-چپ جهت باز کردن ابزارها در لمس/موبایل */}
          {!immersiveHudOpen && (
            <button
              type="button"
              onClick={() => setImmersiveHudOpen(true)}
              onMouseEnter={() => setImmersiveHudOpen(true)}
              className="fixed top-1.5 left-2 z-[63] px-2 py-1 rounded-lg bg-slate-900/75 hover:bg-slate-900 text-white text-[10px] font-bold backdrop-blur-sm shadow-md border border-white/15 inline-flex items-center gap-1 cursor-pointer transition opacity-70 hover:opacity-100"
              title="نمایش نوار ابزار (یا ماوس را به بالای صفحه ببرید)"
            >
              <SlidersHorizontal className="w-3 h-3 text-teal-300" />
              <span>ابزارها</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          )}

          {/* پنل ابزار شناور اتوهاید */}
          {immersiveHudOpen && (
            <div
              onMouseLeave={() => setImmersiveHudOpen(false)}
              className="fixed top-0 inset-x-0 z-[65] bg-slate-900/95 text-white backdrop-blur-md border-b border-white/15 px-3 py-2 shadow-2xl flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-1 rounded-lg bg-teal-600 text-white font-black text-[11px]">
                  برنامه جامع تمام‌صفحه · ترم {activeTerm}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setImmersiveHudOpen(false);
                    onOpenNewOffering({});
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black inline-flex items-center gap-1 cursor-pointer"
                  title="ثبت درس جدید در برنامه (یا مستقیماً روی هر سلول خالی کلیک کنید)"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ثبت درس جدید</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImmersiveHudOpen(false);
                    onOpenCommonExamModal();
                  }}
                  className="px-2 py-1 rounded-lg bg-indigo-500/80 hover:bg-indigo-500 text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                  title="مدیریت امتحانات مشترک و عمومی"
                >
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>امتحانات</span>
                </button>
                <button
                  type="button"
                  disabled={!canUndo}
                  onClick={onUndo}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 font-bold inline-flex items-center gap-1 cursor-pointer"
                  title="بازگشت (Ctrl+Z)"
                >
                  <Undo2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>بازگشت</span>
                </button>
                <button
                  type="button"
                  disabled={!canRedo}
                  onClick={onRedo}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 font-bold inline-flex items-center gap-1 cursor-pointer"
                  title="انجام مجدد (Ctrl+Y)"
                >
                  <Redo2 className="w-3.5 h-3.5 text-sky-300" />
                  <span>مجدد</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOnlyPopulatedView((v) => !v)}
                  className={`px-2 py-1 rounded-lg font-bold inline-flex items-center gap-1 cursor-pointer border ${
                    onlyPopulatedView
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-white/10 border-white/15 text-slate-200'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  <span>فقط دروس ثبت‌شده</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFitToScreen((v) => !v)}
                  className={`px-2 py-1 rounded-lg font-bold inline-flex items-center gap-1 cursor-pointer border ${
                    fitToScreen
                      ? 'bg-teal-600 border-teal-500 text-white'
                      : 'bg-white/10 border-white/15 text-slate-200'
                  }`}
                >
                  <Scan className="w-3 h-3" />
                  <span>کل جدول در صفحه</span>
                </button>
                {isSystemAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setImmersiveHudOpen(false);
                      setLayoutModalOpen(true);
                    }}
                    className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black inline-flex items-center gap-1 cursor-pointer"
                    title="تنظیمات اکسل ستون‌ها، پهنا، عمودی/افقی و Wrap/Shrink"
                  >
                    <Columns3 className="w-3.5 h-3.5" />
                    <span>تنظیمات ستون‌ها</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setImmersiveHudOpen(false);
                    setPrintModalOpen(true);
                  }}
                  className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                  title="تنظیمات کامل چاپ (اندازه کاغذ، حاشیه، افقی/عمودی، مقیاس)"
                >
                  <Printer className="w-3.5 h-3.5 text-teal-300" />
                  <span>چاپ</span>
                </button>
                <div className="inline-flex items-center bg-white/10 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFitToScreen(false);
                      setZoomPercent((z) => Math.max(28, (fitToScreen ? fitZoomPercent : z) - 10));
                    }}
                    className="p-1 hover:bg-white/15 rounded cursor-pointer"
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
                    className="px-1.5 font-mono text-[11px] cursor-pointer"
                  >
                    {effectiveZoom}%
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFitToScreen(false);
                      setZoomPercent((z) => Math.min(150, (fitToScreen ? fitZoomPercent : z) + 10));
                    }}
                    className="p-1 hover:bg-white/15 rounded cursor-pointer"
                    title="بزرگ‌نمایی"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={rowSearch}
                  onChange={(e) => setRowSearch(e.target.value)}
                  placeholder="جستجوی رشته یا ورودی..."
                  className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 text-[11px] w-36"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void toggleMobileLandscapeMode()}
                  className={`px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1 cursor-pointer border ${
                    mobileLandscape
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-white/10 border-white/15 text-slate-200 hover:bg-white/20'
                  }`}
                  title="چرخش افقی برای نمایش بهتر در گوشی موبایل"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{mobileLandscape ? 'حالت عمودی' : 'حالت افقی موبایل'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImmersiveHudOpen(false)}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                  title="مخفی‌کردن نوار ابزار"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>مخفی</span>
                </button>
                <button
                  type="button"
                  onClick={() => void exitImmersiveFullscreen()}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>خروج از تمام‌صفحه (Esc)</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* نوار اعلان مسدودسازی تغییرات برنامه برای غیرمدیران */}
      {!immersiveFullscreen && globalLockStatus.locked && (
        <div className="shrink-0 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-3.5 py-2 text-xs font-extrabold text-rose-900 dark:text-rose-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{globalLockStatus.reason}</span>
        </div>
      )}

      {/* نوار کنترل و فوکوس برنامه جامع / فراگیر (در حالت کاملاً تمام‌صفحه مخفی است) */}
      {!immersiveFullscreen && (
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
                زوم سریع: <span className="font-mono font-bold">Ctrl + چرخ ماوس</span> · اسکرول افقی: <span className="font-mono font-bold">Alt / Shift + چرخ ماوس</span> · بازگشت/مجدد: <span className="font-mono font-bold">Ctrl+Z / Ctrl+Y</span>
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-teal-600 text-white text-xs font-black">
                برنامه جامع تمام‌صفحه · ترم {activeTerm}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                زوم: Ctrl+ماوس · اسکرول افقی: Alt/Shift+ماوس · Ctrl+Z/Y · خروج: Esc
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="inline-flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5">
              <button
                type="button"
                disabled={!canUndo}
                onClick={onUndo}
                className="px-2 py-1 rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 cursor-pointer disabled:cursor-not-allowed transition"
                title={undoLabel ? `بازگشت تغییرات خودتان (Ctrl+Z): ${undoLabel}` : 'بازگشت آخرین تغییر شما (Ctrl+Z)'}
              >
                <Undo2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>بازگشت</span>
              </button>
              <button
                type="button"
                disabled={!canRedo}
                onClick={onRedo}
                className="px-2 py-1 rounded-lg text-[11px] font-extrabold inline-flex items-center gap-1 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 cursor-pointer disabled:cursor-not-allowed transition"
                title={redoLabel ? `انجام مجدد (Ctrl+Y): ${redoLabel}` : 'انجام مجدد (Ctrl+Y)'}
              >
                <Redo2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>انجام مجدد</span>
              </button>
            </div>

            {isSystemAdmin && (
              <button
                type="button"
                onClick={() => setLayoutModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition"
                title="تنظیم پهنا (با ماوس یا عدد)، عمودی/افقی و Wrap/Shrink ستون‌ها و سلول‌ها (فقط مدیر سامانه)"
              >
                <Columns3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>تنظیمات ستون‌ها و سلول‌ها</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenCommonExamModal}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/70 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition"
              title="چیدمان یکجای تاریخ و سانس امتحانات دروس عمومی و مشترک"
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>امتحانات مشترک / عمومی</span>
              {examConflictMap.size > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black">
                  {examConflictMap.size.toLocaleString('fa-IR')} تداخل
                </span>
              )}
            </button>

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
                  setZoomPercent((z) => Math.max(28, (fitToScreen ? fitZoomPercent : z) - 10));
                }}
                className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                title="کوچک‌نمایی (یا Ctrl+چرخ ماوس)"
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
                  setZoomPercent((z) => Math.min(150, (fitToScreen ? fitZoomPercent : z) + 10));
                }}
                className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                title="بزرگ‌نمایی (یا Ctrl+چرخ ماوس)"
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
              title={isFullscreen ? 'بازگشت به نمای عادی (Esc)' : 'بزرگ‌نمایی تمام‌صفحه جدول داخل صفحه'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>خروج از تمام‌صفحه</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>تمام‌صفحه جدول</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => void enterImmersiveFullscreen(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition shadow-xs"
              title="نمایش بدون نوار مرورگر، بدون دکمه و اتوهاید روی کل مانیتور"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>کاملاً تمام‌صفحه</span>
            </button>

            <button
              type="button"
              onClick={() => void toggleMobileLandscapeMode()}
              className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer transition"
              title="حالت تمام‌صفحه افقی مخصوص موبایل"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">افقی موبایل</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              title="تنظیمات پیشرفته چاپ اکسل‌مانند (اندازه کاغذ، افقی/عمودی، حاشیه، مقیاس و پیش‌نمایش)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ و تنظیمات صفحه</span>
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

          {/* دکمه‌های سریع اسکرول افقی + راهنمای Alt/Shift + ماوس */}
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
              Shift / Alt + ماوس: اسکرول افقی · Ctrl + ماوس: زوم
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
                {professors.map((p) => {
                  const df = formatProfessorDepartmentAndField(p);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.fullName} (کد {p.professorCode}
                      {df ? ` · ${df}` : ''})
                    </option>
                  );
                })}
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
      )}

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
          className={`bg-white dark:bg-slate-900 shadow-sm overflow-auto ${
            immersiveFullscreen
              ? 'flex-1 min-h-0 border-0 rounded-none'
              : anyFullscreen
              ? 'flex-1 min-h-0 rounded-2xl border-2 border-slate-400 dark:border-slate-600'
              : 'max-h-[74vh] rounded-2xl border-2 border-slate-400 dark:border-slate-600'
          }`}
        >
          <table
            style={
              effectiveZoom !== 100
                ? ({ zoom: effectiveZoom / 100 } as React.CSSProperties)
                : undefined
            }
            className="border-collapse text-[11px] table-fixed w-max min-w-full"
          >
            <colgroup>
              {rowGrouping === 'by_major' ? (
                <>
                  <col style={{ width: `${metaColWidths.major}px` }} />
                  <col style={{ width: `${metaColWidths.entry}px` }} />
                </>
              ) : (
                <>
                  <col style={{ width: `${metaColWidths.entry}px` }} />
                  <col style={{ width: `${metaColWidths.major}px` }} />
                </>
              )}
              <col style={{ width: `${metaColWidths.totalStudents}px` }} />
              <col style={{ width: `${metaColWidths.section}px` }} />
              {displayedDays.map((day) =>
                displayedSlots.map((slot) => {
                  const colW = getSlotColumnStyle(day, slot.id).width;
                  return <col key={`col_${day}_${slot.id}`} style={{ width: `${colW}px` }} />;
                })
              )}
            </colgroup>

            <thead className="sticky top-0 z-30 bg-slate-100 dark:bg-slate-800 shadow-xs">
              {/* ردیف اول هدر: ستون‌های مشخصات ثابت در راست + عنوان روزهای هفته */}
              <tr>
                {(() => {
                  const orderedFirstTwo: Array<{
                    key: SchedMetaColumnKey;
                    rightPx: number;
                    widthPx: number;
                  }> =
                    rowGrouping === 'by_major'
                      ? [
                          { key: 'major', rightPx: stickyOffsets.firstRight, widthPx: metaColWidths.major },
                          { key: 'entry', rightPx: stickyOffsets.secondRight, widthPx: metaColWidths.entry },
                        ]
                      : [
                          { key: 'entry', rightPx: stickyOffsets.firstRight, widthPx: metaColWidths.entry },
                          { key: 'major', rightPx: stickyOffsets.secondRight, widthPx: metaColWidths.major },
                        ];

                  const allMetaHeaders: Array<{
                    key: SchedMetaColumnKey;
                    rightPx: number;
                    widthPx: number;
                    isSectionEdge?: boolean;
                  }> = [
                    ...orderedFirstTwo,
                    {
                      key: 'totalStudents',
                      rightPx: stickyOffsets.thirdRight,
                      widthPx: metaColWidths.totalStudents,
                    },
                    {
                      key: 'section',
                      rightPx: stickyOffsets.fourthRight,
                      widthPx: metaColWidths.section,
                      isSectionEdge: true,
                    },
                  ];

                  return allMetaHeaders.map((mh) => {
                    const cfg = liveLayout.metaColumns[mh.key];
                    const hOri = cfg?.headerOrientation || 'horizontal';
                    const isVert = hOri !== 'horizontal';
                    const label = META_COL_LABELS[mh.key];
                    const shrinkFs =
                      cfg?.textFit === 'shrink' && !isVert && mh.widthPx < 68
                        ? computeAdaptiveShrinkFontPx(label.length, mh.widthPx, 11, 7.5, false)
                        : cfg?.fontSizePx;
                    return (
                      <th
                        key={`th_${mh.key}`}
                        rowSpan={2}
                        style={{
                          right: `${mh.rightPx}px`,
                          width: `${mh.widthPx}px`,
                          minWidth: `${mh.widthPx}px`,
                          maxWidth: `${mh.widthPx}px`,
                        }}
                        className={`sticky z-40 bg-slate-200 dark:bg-slate-800 border-y border-r border-slate-400 dark:border-slate-600 p-1 text-center font-black relative select-none ${
                          mh.isSectionEdge
                            ? 'border-l-[3px] border-l-slate-900 dark:border-l-slate-300'
                            : 'border-l border-slate-400 dark:border-slate-600'
                        }`}
                      >
                        <div
                          style={{
                            ...getOrientationStyleObj(hOri),
                            ...(shrinkFs ? { fontSize: `${shrinkFs}px` } : {}),
                          }}
                          className={`mx-auto flex items-center justify-center ${
                            isVert
                              ? 'max-h-[82px] leading-tight whitespace-nowrap'
                              : cfg?.textFit === 'clip'
                              ? 'truncate'
                              : 'whitespace-normal break-words leading-tight'
                          }`}
                        >
                          {label}
                        </div>
                        {isSystemAdmin && (
                          <div
                            onMouseDown={(e) =>
                              startColumnResize(e, {
                                kind: 'meta',
                                metaKey: mh.key,
                                label,
                                currentWidth: mh.widthPx,
                              })
                            }
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              resetSingleColumnWidth({ kind: 'meta', metaKey: mh.key });
                            }}
                            title={`بکشید برای تغییر عرض ستون «${label}» (${mh.widthPx}px) · دابل‌کلیک برای پیش‌فرض`}
                            className="absolute top-0 bottom-0 left-0 w-2 -ml-1 cursor-col-resize z-50 group/resizer flex items-center justify-center"
                          >
                            <span className="w-[2px] h-2/3 rounded-full bg-transparent group-hover/resizer:bg-teal-500 transition-colors" />
                          </div>
                        )}
                      </th>
                    );
                  });
                })()}

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
                    const cStyle = getSlotColumnStyle(day, slot.id);
                    const isVertHeader = cStyle.headerOrientation !== 'horizontal';
                    const slotTitle = getSchedSlotTitle(slot, origIdx);
                    return (
                      <th
                        key={`${day}_${slot.id}`}
                        style={{
                          width: `${cStyle.width}px`,
                          minWidth: `${cStyle.width}px`,
                          maxWidth: `${cStyle.width}px`,
                        }}
                        className={`relative select-none border-t border-b-2 border-b-slate-700 dark:border-b-slate-400 border-x border-slate-300 dark:border-slate-700 py-1.5 px-1 text-center ${
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
                        <div
                          style={getOrientationStyleObj(cStyle.headerOrientation)}
                          className={`mx-auto ${isVertHeader ? 'max-h-[92px] flex flex-col items-center justify-center' : ''}`}
                        >
                          <div className="font-black text-[11px] leading-tight inline-flex items-center justify-center gap-1 flex-wrap">
                            <span>{slotTitle}</span>
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
                        </div>

                        {isSystemAdmin && (
                          <div
                            onMouseDown={(e) =>
                              startColumnResize(e, {
                                kind: 'slot',
                                day,
                                slotId: slot.id,
                                label: `${SCHED_DAY_LABELS[day]} · ${slotTitle}`,
                                currentWidth: cStyle.width,
                              })
                            }
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              resetSingleColumnWidth({ kind: 'slot', day, slotId: slot.id });
                            }}
                            title={`بکشید برای تغییر عرض (${cStyle.width}px) · با Shift برای همین سانس در همه روزها · دابل‌کلیک برای بازنشانی`}
                            className="absolute top-0 bottom-0 left-0 w-2 -ml-1 cursor-col-resize z-50 group/resizer flex items-center justify-center"
                          >
                            <span className="w-[2px] h-2/3 rounded-full bg-transparent group-hover/resizer:bg-teal-500 transition-colors" />
                          </div>
                        )}
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
                const rowActiveOfferings = termOfferings.filter(
                  (o) => doesOfferingBelongToRow(o, row) && isOfferingEffectivelyActive(o, rules)
                );
                const rowSummary = summarizeSectionOfferings(rowActiveOfferings, rules);

                const majorCfg = liveLayout.metaColumns.major;
                const entryCfg = liveLayout.metaColumns.entry;
                const totalCfg = liveLayout.metaColumns.totalStudents;
                const secCfg = liveLayout.metaColumns.section;

                const renderMetaInner = (
                  text: string,
                  subText: string | undefined,
                  cfg: SchedMasterColumnStyle,
                  colWidthPx: number,
                  rowSpan: number,
                  basePx: number,
                  subClass = 'text-[9px] font-mono opacity-80',
                  lockIcon?: boolean
                ) => {
                  const bodyOri = cfg?.bodyOrientation || 'horizontal';
                  const isVert = bodyOri !== 'horizontal';
                  const fit = cfg?.textFit || 'wrap';
                  const fsPx =
                    cfg?.fontSizePx ||
                    (fit === 'shrink'
                      ? computeAdaptiveShrinkFontPx(
                          text.length,
                          colWidthPx,
                          basePx,
                          7,
                          isVert,
                          rowSpan
                        )
                      : undefined);

                  return (
                    <div
                      style={{
                        ...getOrientationStyleObj(bodyOri),
                        ...(fsPx ? { fontSize: `${fsPx}px`, lineHeight: 1.15 } : {}),
                      }}
                      className={`mx-auto flex flex-col items-center justify-center gap-0.5 ${
                        isVert
                          ? fit === 'clip'
                            ? 'max-h-[110px] overflow-hidden whitespace-nowrap'
                            : 'leading-tight'
                          : fit === 'clip'
                          ? 'w-full overflow-hidden'
                          : 'w-full whitespace-normal break-words leading-snug'
                      }`}
                    >
                      <span
                        className={
                          fit === 'clip' && !isVert
                            ? 'w-full truncate block'
                            : 'inline-flex items-center justify-center gap-1 flex-wrap'
                        }
                      >
                        <span>{text}</span>
                        {lockIcon && (
                          <span title="تغییرات این رشته مسدود شده است" className="inline-flex">
                            <Lock className="w-3 h-3 text-rose-600" />
                          </span>
                        )}
                      </span>
                      {subText && (
                        <span
                          className={`${subClass} ${
                            fit === 'clip' && !isVert ? 'w-full truncate block' : ''
                          }`}
                        >
                          {subText}
                        </span>
                      )}
                    </div>
                  );
                };

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
                            style={{
                              right: `${stickyOffsets.firstRight}px`,
                              width: `${metaColWidths.major}px`,
                              minWidth: `${metaColWidths.major}px`,
                              maxWidth: `${metaColWidths.major}px`,
                            }}
                            className={`sticky z-20 border border-slate-300 dark:border-slate-700 p-1.5 text-center font-black align-middle overflow-hidden ${majorPalette.cell}`}
                          >
                            {renderMetaInner(
                              row.majorName,
                              row.majorCode,
                              majorCfg,
                              metaColWidths.major,
                              row.majorBlockSpan,
                              11,
                              `text-[9px] font-mono opacity-80 ${majorPalette.tag}`,
                              isMajorLocked
                            )}
                          </td>
                        )}

                        {/* ستون ۲: ورودی */}
                        {row.isFirstCohortBlock && (
                          <td
                            rowSpan={row.cohortBlockSpan}
                            style={{
                              right: `${stickyOffsets.secondRight}px`,
                              width: `${metaColWidths.entry}px`,
                              minWidth: `${metaColWidths.entry}px`,
                              maxWidth: `${metaColWidths.entry}px`,
                            }}
                            className="sticky z-20 border border-slate-300 dark:border-slate-700 p-1 text-center font-mono font-black align-middle bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden"
                          >
                            {renderMetaInner(
                              row.entryTerm,
                              undefined,
                              entryCfg,
                              metaColWidths.entry,
                              row.cohortBlockSpan,
                              11
                            )}
                          </td>
                        )}
                      </>
                    ) : (
                      <>
                        {/* حالت چیدمان بر اساس ورودی: ستون ۱ = ورودی، ستون ۲ = رشته با رنگ اختصاصی */}
                        {row.isFirstEntryBlock && (
                          <td
                            rowSpan={row.entryBlockSpan}
                            style={{
                              right: `${stickyOffsets.firstRight}px`,
                              width: `${metaColWidths.entry}px`,
                              minWidth: `${metaColWidths.entry}px`,
                              maxWidth: `${metaColWidths.entry}px`,
                            }}
                            className={`sticky z-20 border border-slate-300 dark:border-slate-700 p-1 text-center font-mono font-black align-middle overflow-hidden ${entryPalette}`}
                          >
                            {renderMetaInner(
                              row.entryTerm,
                              'ورودی',
                              entryCfg,
                              metaColWidths.entry,
                              row.entryBlockSpan,
                              11,
                              'text-[8.5px] font-sans opacity-75'
                            )}
                          </td>
                        )}

                        {row.isFirstCohortBlock && (
                          <td
                            rowSpan={row.cohortBlockSpan}
                            style={{
                              right: `${stickyOffsets.secondRight}px`,
                              width: `${metaColWidths.major}px`,
                              minWidth: `${metaColWidths.major}px`,
                              maxWidth: `${metaColWidths.major}px`,
                            }}
                            className={`sticky z-20 border border-slate-300 dark:border-slate-700 p-1.5 text-center font-black align-middle overflow-hidden ${majorPalette.cell}`}
                          >
                            {renderMetaInner(
                              row.majorName,
                              row.majorCode,
                              majorCfg,
                              metaColWidths.major,
                              row.cohortBlockSpan,
                              11,
                              `text-[9px] font-mono opacity-80 ${majorPalette.tag}`,
                              isMajorLocked
                            )}
                          </td>
                        )}
                      </>
                    )}

                    {/* ستون ۳: تعداد کل ورودی */}
                    {row.isFirstCohortBlock && (
                      <td
                        rowSpan={row.cohortBlockSpan}
                        style={{
                          right: `${stickyOffsets.thirdRight}px`,
                          width: `${metaColWidths.totalStudents}px`,
                          minWidth: `${metaColWidths.totalStudents}px`,
                          maxWidth: `${metaColWidths.totalStudents}px`,
                        }}
                        className="sticky z-20 border border-slate-300 dark:border-slate-700 p-1 text-center font-mono font-bold tabular-nums align-middle bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 overflow-hidden"
                      >
                        {renderMetaInner(
                          row.totalCohortStudents.toLocaleString('fa-IR'),
                          undefined,
                          totalCfg,
                          metaColWidths.totalStudents,
                          row.cohortBlockSpan,
                          11
                        )}
                      </td>
                    )}

                    {/* ستون ۴: شعبه و تعداد نفرات شعبه (+ خلاصه دروس/واحد با احتساب شعب کارورزی به عنوان ۱ درس) */}
                    <td
                      style={{
                        right: `${stickyOffsets.fourthRight}px`,
                        width: `${metaColWidths.section}px`,
                        minWidth: `${metaColWidths.section}px`,
                        maxWidth: `${metaColWidths.section}px`,
                      }}
                      title={`${row.sectionName} · ${row.sectionStudentCount.toLocaleString('fa-IR')} نفر${
                        rowSummary.courseCount > 0
                          ? ` · ${rowSummary.courseCount.toLocaleString('fa-IR')} درس (${rowSummary.totalUnits.toLocaleString('fa-IR')} واحد / ${rowSummary.totalWeeklyHours.toLocaleString('fa-IR')} ساعت)`
                          : ''
                      }${
                        rowSummary.internshipRecordsCount > rowSummary.internshipCourseCount
                          ? ' — شعبه‌های کارورزی این ردیف معادل ۱ درس برای دانشجو محاسبه شده است.'
                          : ''
                      }`}
                      className="sticky z-20 border-y border-r border-slate-300 dark:border-slate-700 border-l-[3px] border-l-slate-900 dark:border-l-slate-300 p-1 text-center align-middle bg-slate-50 dark:bg-slate-900 overflow-hidden"
                    >
                      {renderMetaInner(
                        row.sectionName,
                        metaColWidths.section >= 86 && rowSummary.courseCount > 0
                          ? `${row.sectionStudentCount.toLocaleString('fa-IR')} نفر · ${rowSummary.courseCount.toLocaleString('fa-IR')} درس (${rowSummary.totalUnits.toLocaleString('fa-IR')} و)`
                          : `${row.sectionStudentCount.toLocaleString('fa-IR')} نفر`,
                        secCfg,
                        metaColWidths.section,
                        1,
                        11,
                        'text-[9px] font-mono text-slate-500 tabular-nums'
                      )}
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

                        const colStyle = getSlotColumnStyle(day, slot.id);
                        const slotColWidth = colStyle.width;
                        const slotTextFit = colStyle.textFit;
                        const slotBodyOri = colStyle.bodyOrientation;
                        const isVertSlotBody = slotBodyOri !== 'horizontal';
                        const isCompactCards = Boolean(liveLayout.scheduleCells.compactCards);

                        const renderOfferingChip = (o: SchedCourseOffering, compactHalf = false) => {
                          const conf = detectOfferingConflicts(
                            o,
                            termOfferings,
                            classrooms,
                            professors,
                            rules
                          );
                          const comp = evaluateOfferingCompleteness(o, rules);
                          const isProvisionalOrDisabled = comp.isEffectivelyInactive;
                          const hoverIssues = [...comp.missingItems, ...conf.errors];
                          const examWarns = examConflictMap.get(o.id) || [];
                          const examLabel =
                            isCourseEligibleForExam(o) && o.examDayId && o.examSlotId
                              ? formatExamAssignmentShort(o, examSettings)
                              : '';
                          const isSharedHost = o.cohortId !== row.cohortId;
                          const matchedFocus = doesOfferingMatchFocus(o);
                          const dimmed = isFocusActive && !matchedFocus;
                          const editable = canEditOffering(o);

                          const effectiveWidth = compactHalf ? Math.max(44, Math.floor(slotColWidth / 2)) : slotColWidth;
                          const customBasePx = colStyle.fontSizePx;
                          const titlePx =
                            customBasePx ||
                            (slotTextFit === 'shrink'
                              ? computeAdaptiveShrinkFontPx(
                                  o.courseTitle.length,
                                  effectiveWidth,
                                  compactHalf ? 9.5 : 10.5,
                                  7.2,
                                  isVertSlotBody
                                )
                              : compactHalf
                              ? 9.5
                              : 10.5);
                          const subPx =
                            customBasePx
                              ? Math.max(7, customBasePx - 1)
                              : slotTextFit === 'shrink'
                              ? Math.max(7, Number((titlePx - 1).toFixed(1)))
                              : compactHalf
                              ? 8.5
                              : 9.5;
                          const textFitClass =
                            slotTextFit === 'clip' && !isVertSlotBody
                              ? 'truncate'
                              : 'whitespace-normal break-words leading-tight';

                          const cardTooltip =
                            hoverIssues.length > 0
                              ? `وضعیت موقت / نواقص درس:\n• ${hoverIssues.join('\n• ')}\n(کلیک کنید تا تکمیل و نهایی شود)`
                              : editable
                              ? 'کلیک برای ویرایش یا انتخاب و کشیدن در همین ردیف برای جابجایی'
                              : 'فقط مشاهده (تغییرات مسدود شده یا متعلق به گروه دیگر است)';

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
                              title={cardTooltip}
                              className={`group/card relative rounded-lg border ${
                                isCompactCards ? 'p-1' : 'p-1.5'
                              } text-right transition select-none ${
                                editable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                              } ${
                                isProvisionalOrDisabled
                                  ? 'bg-amber-50/90 dark:bg-amber-950/40 border-dashed border-2 border-amber-400 dark:border-amber-500 text-amber-950 dark:text-amber-100 opacity-75'
                                  : conf.hasHardConflict
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
                              <div
                                style={getOrientationStyleObj(slotBodyOri)}
                                className={`overflow-hidden ${isVertSlotBody ? 'mx-auto max-h-[120px]' : ''}`}
                              >
                                {isProvisionalOrDisabled && (
                                  <div className="mb-0.5 px-1 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 text-[8px] font-black inline-flex items-center gap-0.5">
                                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                    <span>
                                      موقت / غیرفعال ({comp.scheduledHours.toLocaleString('fa-IR')}/
                                      {comp.requiredTableHours.toLocaleString('fa-IR')} س)
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-start justify-between gap-1">
                                  <span
                                    style={{ fontSize: `${titlePx}px` }}
                                    className={`font-black text-slate-900 dark:text-white ${textFitClass}`}
                                  >
                                    {o.courseTitle}
                                    {o.practicalType === 'internship' && (
                                      <span className="text-violet-700 dark:text-violet-300 font-bold">
                                        {' '}
                                        (ظرفیت {o.enrolledCount.toLocaleString('fa-IR')})
                                      </span>
                                    )}
                                  </span>
                                  {editable && !isCompactCards && (
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
                                  style={{ fontSize: `${subPx}px` }}
                                  className={`font-semibold text-slate-700 dark:text-slate-300 mt-0.5 ${textFitClass}`}
                                >
                                  {o.professorName || (
                                    <span className="text-amber-700 dark:text-amber-400">
                                      بدون استاد
                                    </span>
                                  )}
                                </div>

                                {o.classroomName ? (
                                  <div
                                    style={{ fontSize: `${Math.max(7, subPx - 0.5)}px` }}
                                    className={`text-slate-500 dark:text-slate-400 ${textFitClass}`}
                                  >
                                    کلاس: {o.classroomName}
                                  </div>
                                ) : o.internshipSessionRole === 'school_attendance' ? (
                                  <div
                                    style={{ fontSize: `${Math.max(7, subPx - 0.5)}px` }}
                                    className={`text-violet-600 dark:text-violet-300 ${textFitClass}`}
                                  >
                                    محل: مدرسه
                                  </div>
                                ) : (
                                  <div
                                    style={{ fontSize: `${Math.max(7, subPx - 0.5)}px` }}
                                    className={`text-amber-700 dark:text-amber-400 font-bold ${textFitClass}`}
                                  >
                                    بدون کلاس
                                  </div>
                                )}

                                {o.sharedWithTargets && o.sharedWithTargets.length > 0 && (
                                  <div
                                    style={{ fontSize: `${Math.max(7, subPx - 1)}px` }}
                                    className={`font-bold text-indigo-700 dark:text-indigo-300 mt-0.5 ${textFitClass}`}
                                  >
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

                                {examLabel && (
                                  <div
                                    style={{ fontSize: `${Math.max(7, subPx - 1)}px` }}
                                    className={`font-bold mt-0.5 px-1 py-0.2 rounded ${textFitClass} ${
                                      examWarns.length > 0
                                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                                        : 'bg-indigo-100/70 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-200'
                                    }`}
                                    title={
                                      examWarns.length > 0
                                        ? `اخطار تداخل امتحان: ${examWarns.join(' | ')}`
                                        : `زمان امتحان: ${examLabel}`
                                    }
                                  >
                                    {examWarns.length > 0 ? '⚠️ ' : '📝 '}
                                    {examLabel}
                                  </div>
                                )}

                                {!isProvisionalOrDisabled && conf.hasHardConflict && (
                                  <div className="text-[8.5px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-0.5 mt-0.5">
                                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                    <span>تداخل!</span>
                                  </div>
                                )}
                              </div>

                              {/* تولتیپ شناور نمایش خطاها و نواقص هنگام قرار گرفتن نشانگر ماوس روی کارت */}
                              {hoverIssues.length > 0 && (
                                <div className="hidden group-hover/card:block absolute z-[95] right-0 top-full mt-1 w-64 p-2.5 rounded-xl bg-slate-900 text-white text-[10px] shadow-2xl border border-amber-400/80 pointer-events-none space-y-1">
                                  <div className="font-black text-amber-300 flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span>وضعیت موقت / نواقص درس:</span>
                                  </div>
                                  <ul className="list-disc pr-4 space-y-0.5 text-slate-100 leading-relaxed">
                                    {hoverIssues.map((msg, idx) => (
                                      <li key={idx}>{msg}</li>
                                    ))}
                                  </ul>
                                  <div className="text-[9px] text-amber-200/90 pt-0.5 border-t border-slate-700">
                                    برای تکمیل ساعت، استاد و کلاس کلیک کنید.
                                  </div>
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
                                      onCommitOfferings(
                                        offerings.filter((x) => x.id !== o.id),
                                        `حذف «${o.courseTitle}»`
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

                        const isEmptyDirectClickable =
                          !showSplitView && fullItems.length === 0 && !cellLock.locked;

                        return (
                          <td
                            key={`${row.rowKey}_${day}_${slot.id}`}
                            style={{
                              width: `${slotColWidth}px`,
                              minWidth: `${slotColWidth}px`,
                              maxWidth: `${slotColWidth}px`,
                            }}
                            onClick={() => {
                              if (isEmptyDirectClickable) {
                                handleOpenCellFromGrid(row, day, slot.id, 'full');
                              }
                            }}
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
                            className={`group/cell relative border border-slate-300 dark:border-slate-700 ${
                              isCompactCards ? 'p-0.5' : 'p-1'
                            } align-top overflow-hidden transition ${
                              isEmptyDirectClickable ? 'cursor-pointer' : ''
                            } ${
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
                                    onClick={(e) => {
                                      if (!cellLock.locked && firstHourItems.length === 0) {
                                        e.stopPropagation();
                                        handleOpenCellFromGrid(row, day, slot.id, 'first_hour');
                                      }
                                    }}
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
                                      !cellLock.locked && firstHourItems.length === 0
                                        ? 'cursor-pointer hover:border-teal-400'
                                        : ''
                                    } ${
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
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenCellFromGrid(row, day, slot.id, 'first_hour');
                                        }}
                                        className="mt-auto w-full py-0.5 rounded text-[9px] font-bold text-slate-400 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition cursor-pointer"
                                      >
                                        + ۱س راست
                                      </button>
                                    )}
                                  </div>

                                  {/* نیمه سمت چپ = ساعت دوم */}
                                  <div
                                    onClick={(e) => {
                                      if (!cellLock.locked && secondHourItems.length === 0) {
                                        e.stopPropagation();
                                        handleOpenCellFromGrid(row, day, slot.id, 'second_hour');
                                      }
                                    }}
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
                                      !cellLock.locked && secondHourItems.length === 0
                                        ? 'cursor-pointer hover:border-teal-400'
                                        : ''
                                    } ${
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
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenCellFromGrid(row, day, slot.id, 'second_hour');
                                        }}
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenCellFromGrid(row, day, slot.id, 'full');
                                    }}
                                    className="w-full py-0.5 rounded border border-dashed border-transparent hover:border-slate-300 dark:hover:border-slate-600 text-[9px] text-slate-400 opacity-55 sm:opacity-0 sm:group-hover/cell:opacity-100 hover:text-teal-600 transition cursor-pointer"
                                    title="افزودن مورد جدید (یا شعبه کارورزی) به این سانس"
                                  >
                                    + افزودن مورد دیگر
                                  </button>
                                )}
                              </div>
                            ) : cellLock.locked ? (
                              /* حالت ۳ الف: سلول قفل‌شده */
                              <div className="min-h-[58px] h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                <Lock className="w-3.5 h-3.5 opacity-40" />
                              </div>
                            ) : (
                              /* حالت ۳ ب: سلول خالی — کلیک در هر نقطه سلول برای ثبت کل سانس یا تفکیک ساعت اول/دوم */
                              <div className="group/empty min-h-[60px] h-full flex flex-col justify-between rounded-lg p-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCellFromGrid(row, day, slot.id, 'full');
                                  }}
                                  className="flex-1 w-full min-h-[36px] rounded-lg border border-dashed border-transparent group-hover/cell:border-teal-300 dark:group-hover/cell:border-teal-700 flex items-center justify-center text-[10px] font-bold text-slate-300 dark:text-slate-700 group-hover/cell:text-teal-600 transition cursor-pointer"
                                >
                                  <span className="opacity-0 group-hover/cell:opacity-100">
                                    + ثبت درس ({slotDuration <= 1 ? 'تک‌ساعت' : 'کل سانس'})
                                  </span>
                                </button>
                                {slotDuration > 1 && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="hidden group-hover/cell:grid grid-cols-2 gap-1 pt-0.5"
                                  >
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
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
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
                {pendingResolutionEval.professorOptions.map((opt) => {
                  const df = formatProfessorDepartmentAndField(opt.prof);
                  return (
                    <option key={opt.prof.id} value={opt.prof.id}>
                      {opt.isFree ? '✅ آزاد' : '⚠️ تداخل/محدودیت'} — {opt.prof.fullName} (کد{' '}
                      {opt.prof.professorCode}
                      {df ? ` · ${df}` : ''} · بار: {opt.load.equivalentUnits} معادل)
                      {opt.issue ? ` [${opt.issue}]` : ''}
                    </option>
                  );
                })}
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
                  onCommitOfferings(
                    offerings.map((o) => (o.id === saved.id ? saved : o)),
                    `جابجایی «${saved.courseTitle}»`
                  );
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

      {/* نشانگر شناور زنده هنگام تغییر عرض ستون با ماوس */}
      {resizeIndicator && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[130] px-4 py-2 rounded-2xl bg-slate-900/95 text-white border border-teal-400/60 shadow-2xl text-xs font-black flex items-center gap-2 pointer-events-none">
          <MoveHorizontal className="w-4 h-4 text-teal-400" />
          <span>{resizeIndicator.label}:</span>
          <span className="font-mono text-teal-300 text-sm" dir="ltr">
            {resizeIndicator.width} px
          </span>
          {resizeIndicator.allSameSlot && (
            <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 text-[10px]">
              اعمال روی همه روزهای این سانس
            </span>
          )}
        </div>
      )}

      {/* مودال تنظیمات اکسل‌مانند نمایش ستون‌ها و سلول‌های جدول (فقط مدیر سامانه) */}
      {layoutModalOpen && isSystemAdmin && (
        <div className="fixed inset-0 z-[118] flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-5 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shrink-0">
                  <Columns3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    تنظیمات اکسل‌مانند ستون‌ها و سلول‌های برنامه جامع
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    تغییر عرض عددی یا با کشیدن لبه ستون‌ها با ماوس، تنظیم Wrap / Shrink نوشته‌ها، و چرخش عمودی یا افقی هر ستون (با یا بدون سطر اول/سرتیتر)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLayoutModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer self-end sm:self-auto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* الگوهای سریع یک‌کلیکی */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-black text-slate-800 dark:text-slate-100 flex items-center justify-between flex-wrap gap-2">
                <span>الگوهای سریع چیدمان (مانند شیت جامع):</span>
                <span className="text-[10.5px] font-bold text-slate-500">
                  مجموع عرض ۴ ستون اول فعلی: <strong className="font-mono text-teal-600">{stickyOffsets.totalMetaWidth}px</strong>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    commitLayoutSettings(
                      cloneDefaultLayout(),
                      'چیدمان استاندارد (افقی) روی برنامه جامع اعمال شد.'
                    )
                  }
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-teal-500 font-extrabold cursor-pointer"
                >
                  ۱. پیش‌فرض استاندارد (افقی)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    commitLayoutSettings(
                      {
                        metaColumns: {
                          major: {
                            width: 44,
                            headerOrientation: 'horizontal',
                            bodyOrientation: 'vertical_up',
                            textFit: 'wrap',
                          },
                          entry: {
                            width: 34,
                            headerOrientation: 'horizontal',
                            bodyOrientation: 'vertical_up',
                            textFit: 'shrink',
                          },
                          totalStudents: {
                            width: 34,
                            headerOrientation: 'horizontal',
                            bodyOrientation: 'vertical_up',
                            textFit: 'shrink',
                          },
                          section: {
                            width: 48,
                            headerOrientation: 'horizontal',
                            bodyOrientation: 'vertical_up',
                            textFit: 'wrap',
                          },
                        },
                        defaultSlotWidth: 136,
                        slotWidthsBySlotId: {},
                        scheduleCells: {
                          headerOrientation: 'horizontal',
                          bodyOrientation: 'horizontal',
                          textFit: 'shrink',
                          compactCards: true,
                        },
                        columnOverrides: {},
                      },
                      'حالت جمع‌وجور اکسل (۴ ستون اول عمودی با سرتیتر افقی) اعمال شد.'
                    )
                  }
                  className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold cursor-pointer"
                >
                  ۲. جمع‌وجور اکسل (۴ ستون اول عمودی · سرتیتر افقی)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    commitLayoutSettings(
                      {
                        metaColumns: {
                          major: {
                            width: 38,
                            headerOrientation: 'vertical_up',
                            bodyOrientation: 'vertical_up',
                            textFit: 'wrap',
                          },
                          entry: {
                            width: 30,
                            headerOrientation: 'vertical_up',
                            bodyOrientation: 'vertical_up',
                            textFit: 'shrink',
                          },
                          totalStudents: {
                            width: 30,
                            headerOrientation: 'vertical_up',
                            bodyOrientation: 'vertical_up',
                            textFit: 'shrink',
                          },
                          section: {
                            width: 40,
                            headerOrientation: 'vertical_up',
                            bodyOrientation: 'vertical_up',
                            textFit: 'wrap',
                          },
                        },
                        defaultSlotWidth: 118,
                        slotWidthsBySlotId: {},
                        scheduleCells: {
                          headerOrientation: 'horizontal',
                          bodyOrientation: 'horizontal',
                          textFit: 'shrink',
                          compactCards: true,
                        },
                        columnOverrides: {},
                      },
                      'حالت فشرده حداکثری (۴ ستون اول همراه با سرتیتر عمودی) اعمال شد.'
                    )
                  }
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer"
                >
                  ۳. فشرده حداکثری (۴ ستون اول + سرتیترها عمودی)
                </button>
              </div>
            </div>

            {/* تب‌های تنظیمات */}
            <div className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
              {[
                {
                  key: 'presets_meta' as const,
                  label: 'چهار ستون اول (رشته، ورودی، تعداد کل، شعبه)',
                  icon: Table2,
                },
                {
                  key: 'slots_batch' as const,
                  label: 'ستون‌های سانس و سلول‌های دروس (کلی و دسته‌ای)',
                  icon: WrapText,
                },
                {
                  key: 'individual_col' as const,
                  label: 'تنظیم اختصاصی تک‌ستون (روز و سانس دلخواه)',
                  icon: Settings2,
                },
              ].map((t) => {
                const TIcon = t.icon;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setLayoutTab(t.key)}
                    className={`px-3 py-1.5 rounded-xl font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition ${
                      layoutTab === t.key
                        ? 'bg-slate-900 dark:bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <TIcon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* تب ۱: ۴ ستون اول (فردی و دسته‌ای) */}
            {layoutTab === 'presets_meta' && (
              <div className="space-y-4">
                {/* اعمال دسته‌ای روی ستون‌های انتخابی از ۴ ستون اول */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-black text-amber-950 dark:text-amber-100">
                      اعمال دسته‌ای روی ستون‌های انتخاب‌شده:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(['major', 'entry', 'totalStudents', 'section'] as SchedMetaColumnKey[]).map(
                        (k) => {
                          const checked = selectedBatchMetaKeys.includes(k);
                          return (
                            <button
                              key={`bmeta_${k}`}
                              type="button"
                              onClick={() =>
                                setSelectedBatchMetaKeys((prev) =>
                                  prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
                                )
                              }
                              className={`px-2.5 py-1 rounded-lg border font-bold inline-flex items-center gap-1 cursor-pointer ${
                                checked
                                  ? 'bg-amber-500 text-slate-950 border-amber-600'
                                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              {checked && <Check className="w-3 h-3" />}
                              <span>{META_COL_LABELS[k]}</span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
                    <label className="space-y-1">
                      <span className="font-bold block">پهنا (px):</span>
                      <input
                        type="number"
                        min={24}
                        max={380}
                        value={batchMetaWidthInput}
                        onChange={(e) => setBatchMetaWidthInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold block">جهت نوشته ستون:</span>
                      <select
                        value={batchMetaBodyOri}
                        onChange={(e) => setBatchMetaBodyOri(e.target.value as SchedTextOrientation)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      >
                        {(Object.keys(ORIENTATION_LABELS) as SchedTextOrientation[]).map((ok) => (
                          <option key={ok} value={ok}>
                            {ORIENTATION_LABELS[ok]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold block">نحوه جاگیری متن:</span>
                      <select
                        value={batchMetaTextFit}
                        onChange={(e) => setBatchMetaTextFit(e.target.value as SchedCellTextFit)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      >
                        {(Object.keys(TEXT_FIT_LABELS) as SchedCellTextFit[]).map((fk) => (
                          <option key={fk} value={fk}>
                            {TEXT_FIT_LABELS[fk]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={batchMetaApplyToHeader}
                        onChange={(e) => setBatchMetaApplyToHeader(e.target.checked)}
                        className="accent-teal-600 rounded"
                      />
                      <span>سطر اول (سرتیتر) هم هم‌جهت شود</span>
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={selectedBatchMetaKeys.length === 0}
                      onClick={() => {
                        const w = Math.max(
                          24,
                          Math.min(380, Number(batchMetaWidthInput) || 40)
                        );
                        const nextMeta = { ...liveLayout.metaColumns };
                        selectedBatchMetaKeys.forEach((k) => {
                          nextMeta[k] = {
                            ...nextMeta[k],
                            width: w,
                            bodyOrientation: batchMetaBodyOri,
                            headerOrientation: batchMetaApplyToHeader
                              ? batchMetaBodyOri
                              : 'horizontal',
                            textFit: batchMetaTextFit,
                          };
                        });
                        commitLayoutSettings(
                          { ...liveLayout, metaColumns: nextMeta },
                          'تغییرات دسته‌ای روی ستون‌های انتخابی اعمال شد.'
                        );
                      }}
                      className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-45 text-white font-extrabold cursor-pointer"
                    >
                      اعمال دسته‌ای روی ستون‌های تیک‌خورده
                    </button>
                  </div>
                </div>

                {/* جدول تنظیم تک‌تک ۴ ستون اول */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-right">
                        <th className="p-2.5">ستون</th>
                        <th className="p-2.5">پهنا (px)</th>
                        <th className="p-2.5">جهت متن ردیف‌ها (بدنه)</th>
                        <th className="p-2.5">جهت سطر اول (سرتیتر)</th>
                        <th className="p-2.5">Wrap / Shrink</th>
                        <th className="p-2.5">فونت (px)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(['major', 'entry', 'totalStudents', 'section'] as SchedMetaColumnKey[]).map(
                        (k) => {
                          const cfg = liveLayout.metaColumns[k] || {};
                          const updateOne = (patch: Partial<SchedMasterColumnStyle>) => {
                            commitLayoutSettings({
                              ...liveLayout,
                              metaColumns: {
                                ...liveLayout.metaColumns,
                                [k]: { ...cfg, ...patch },
                              },
                            });
                          };
                          return (
                            <tr key={`rowcfg_${k}`}>
                              <td className="p-2.5 font-black text-slate-900 dark:text-white">
                                {META_COL_LABELS[k]}
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  min={24}
                                  max={380}
                                  value={cfg.width ?? metaColWidths[k]}
                                  onChange={(e) =>
                                    updateOne({
                                      width: Math.max(
                                        24,
                                        Math.min(380, Number(e.target.value) || 30)
                                      ),
                                    })
                                  }
                                  className="w-20 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center"
                                />
                              </td>
                              <td className="p-2.5">
                                <select
                                  value={cfg.bodyOrientation || 'horizontal'}
                                  onChange={(e) =>
                                    updateOne({
                                      bodyOrientation: e.target.value as SchedTextOrientation,
                                    })
                                  }
                                  className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                                >
                                  {(Object.keys(ORIENTATION_LABELS) as SchedTextOrientation[]).map(
                                    (ok) => (
                                      <option key={ok} value={ok}>
                                        {ORIENTATION_LABELS[ok]}
                                      </option>
                                    )
                                  )}
                                </select>
                              </td>
                              <td className="p-2.5">
                                <select
                                  value={cfg.headerOrientation || 'horizontal'}
                                  onChange={(e) =>
                                    updateOne({
                                      headerOrientation: e.target.value as SchedTextOrientation,
                                    })
                                  }
                                  className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                                >
                                  {(Object.keys(ORIENTATION_LABELS) as SchedTextOrientation[]).map(
                                    (ok) => (
                                      <option key={ok} value={ok}>
                                        {ORIENTATION_LABELS[ok]}
                                      </option>
                                    )
                                  )}
                                </select>
                              </td>
                              <td className="p-2.5">
                                <select
                                  value={cfg.textFit || 'wrap'}
                                  onChange={(e) =>
                                    updateOne({ textFit: e.target.value as SchedCellTextFit })
                                  }
                                  className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                                >
                                  {(Object.keys(TEXT_FIT_LABELS) as SchedCellTextFit[]).map(
                                    (fk) => (
                                      <option key={fk} value={fk}>
                                        {TEXT_FIT_LABELS[fk]}
                                      </option>
                                    )
                                  )}
                                </select>
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  min={7}
                                  max={18}
                                  placeholder="خودکار"
                                  value={cfg.fontSizePx ?? ''}
                                  onChange={(e) =>
                                    updateOne({
                                      fontSizePx: e.target.value
                                        ? Math.max(7, Math.min(18, Number(e.target.value)))
                                        : undefined,
                                    })
                                  }
                                  className="w-16 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center"
                                />
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* تب ۲: تنظیمات عمومی و دسته‌ای ستون‌های سانس و سلول‌های دروس */}
            {layoutTab === 'slots_batch' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-teal-50/60 dark:bg-teal-950/25 border border-teal-200 dark:border-teal-800 space-y-3">
                  <div className="font-black text-teal-950 dark:text-teal-100">
                    تنظیمات عمومی کل سلول‌ها و ستون‌های سانس هفته
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <label className="space-y-1">
                      <span className="font-bold block">پهنای پیش‌فرض ستون سانس (px):</span>
                      <input
                        type="number"
                        min={64}
                        max={440}
                        value={liveLayout.defaultSlotWidth}
                        onChange={(e) =>
                          commitLayoutSettings({
                            ...liveLayout,
                            defaultSlotWidth: Math.max(
                              64,
                              Math.min(440, Number(e.target.value) || 140)
                            ),
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold block">نحوه جاگیری متن سلول‌ها:</span>
                      <select
                        value={liveLayout.scheduleCells.textFit}
                        onChange={(e) =>
                          commitLayoutSettings({
                            ...liveLayout,
                            scheduleCells: {
                              ...liveLayout.scheduleCells,
                              textFit: e.target.value as SchedCellTextFit,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      >
                        {(Object.keys(TEXT_FIT_LABELS) as SchedCellTextFit[]).map((fk) => (
                          <option key={fk} value={fk}>
                            {TEXT_FIT_LABELS[fk]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold block">جهت متن سلول‌های درس:</span>
                      <select
                        value={liveLayout.scheduleCells.bodyOrientation}
                        onChange={(e) =>
                          commitLayoutSettings({
                            ...liveLayout,
                            scheduleCells: {
                              ...liveLayout.scheduleCells,
                              bodyOrientation: e.target.value as SchedTextOrientation,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      >
                        {(Object.keys(ORIENTATION_LABELS) as SchedTextOrientation[]).map((ok) => (
                          <option key={ok} value={ok}>
                            {ORIENTATION_LABELS[ok]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold block">جهت سرتیتر سانس‌ها:</span>
                      <select
                        value={liveLayout.scheduleCells.headerOrientation}
                        onChange={(e) =>
                          commitLayoutSettings({
                            ...liveLayout,
                            scheduleCells: {
                              ...liveLayout.scheduleCells,
                              headerOrientation: e.target.value as SchedTextOrientation,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      >
                        {(Object.keys(ORIENTATION_LABELS) as SchedTextOrientation[]).map((ok) => (
                          <option key={ok} value={ok}>
                            {ORIENTATION_LABELS[ok]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-1.5 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(liveLayout.scheduleCells.compactCards)}
                          onChange={(e) =>
                            commitLayoutSettings({
                              ...liveLayout,
                              scheduleCells: {
                                ...liveLayout.scheduleCells,
                                compactCards: e.target.checked,
                              },
                            })
                          }
                          className="accent-teal-600 rounded"
                        />
                        <span>کارت‌های فشرده (حداقل حاشیه و ارتفاع)</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 font-bold">
                        <span>فونت ثابت کارت (اختیاری):</span>
                        <input
                          type="number"
                          min={7}
                          max={16}
                          placeholder="خودکار"
                          value={liveLayout.scheduleCells.fontSizePx ?? ''}
                          onChange={(e) =>
                            commitLayoutSettings({
                              ...liveLayout,
                              scheduleCells: {
                                ...liveLayout.scheduleCells,
                                fontSizePx: e.target.value
                                  ? Math.max(7, Math.min(16, Number(e.target.value)))
                                  : undefined,
                              },
                            })
                          }
                          className="w-16 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center"
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        commitLayoutSettings(
                          {
                            ...liveLayout,
                            slotWidthsBySlotId: {},
                            columnOverrides: {},
                          },
                          'عرض همه ستون‌های سانس به یک اندازه پیش‌فرض همسان شد.'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 font-bold cursor-pointer"
                    >
                      همسان‌سازی عرض همه ستون‌های روز و سانس
                    </button>
                  </div>
                </div>

                {/* پهنای دسته‌ای به تفکیک هر سانس در کل هفته */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="font-black text-slate-900 dark:text-white">
                    پهنای دسته‌ای هر سانس در تمام روزهای هفته (تغییر یک‌جای یک سانس):
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {sortedSlots.map((slot, idx) => {
                      const val = liveLayout.slotWidthsBySlotId?.[slot.id] ?? '';
                      return (
                        <label
                          key={`batch_slot_w_${slot.id}`}
                          className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1"
                        >
                          <span className="font-extrabold block truncate">
                            {getSchedSlotTitle(slot, idx)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block" dir="ltr">
                            {slot.startTime}-{slot.endTime}
                          </span>
                          <input
                            type="number"
                            min={64}
                            max={440}
                            placeholder={String(liveLayout.defaultSlotWidth)}
                            value={val}
                            onChange={(e) => {
                              const nextSlotMap = { ...(liveLayout.slotWidthsBySlotId || {}) };
                              if (!e.target.value) {
                                delete nextSlotMap[slot.id];
                              } else {
                                nextSlotMap[slot.id] = Math.max(
                                  64,
                                  Math.min(440, Number(e.target.value) || 140)
                                );
                              }
                              commitLayoutSettings({
                                ...liveLayout,
                                slotWidthsBySlotId: nextSlotMap,
                              });
                            }}
                            className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* انتخاب گروهی دلخواه چند ستون روز+سانس برای تنظیم یکجا */}
                <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-black text-indigo-950 dark:text-indigo-100">
                      انتخاب دسته‌ای چند ستون دلخواه از روزها و سانس‌ها ({selectedBatchSlotKeys.length.toLocaleString('fa-IR')} ستون انتخاب‌شده):
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedBatchSlotKeys(
                            displayedDays.flatMap((d) => displayedSlots.map((s) => `${d}:${s.id}`))
                          )
                        }
                        className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-300 text-indigo-700 font-bold cursor-pointer"
                      >
                        انتخاب همه
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedBatchSlotKeys([])}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 text-slate-600 font-bold cursor-pointer"
                      >
                        پاک کردن انتخاب
                      </button>
                    </div>
                  </div>
                  <div className="max-h-36 overflow-y-auto flex flex-wrap gap-1.5 p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-indigo-100 dark:border-indigo-900">
                    {displayedDays.map((d) =>
                      displayedSlots.map((s, sIdx) => {
                        const k = `${d}:${s.id}`;
                        const active = selectedBatchSlotKeys.includes(k);
                        return (
                          <button
                            key={`sel_${k}`}
                            type="button"
                            onClick={() =>
                              setSelectedBatchSlotKeys((prev) =>
                                prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
                              )
                            }
                            className={`px-2 py-1 rounded-md border text-[10.5px] font-bold cursor-pointer ${
                              active
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {SCHED_DAY_LABELS[d]} · {getSchedSlotTitle(s, slotOriginalIndexMap.get(s.id) ?? sIdx)}
                          </button>
                        );
                      })
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
                    <label className="space-y-1">
                      <span className="font-bold block">عرض (px):</span>
                      <input
                        type="number"
                        min={64}
                        max={440}
                        value={batchSlotColWidthInput}
                        onChange={(e) => setBatchSlotColWidthInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold block">جهت سرتیتر:</span>
                      <select
                        value={batchSlotHeaderOri}
                        onChange={(e) =>
                          setBatchSlotHeaderOri(e.target.value as SchedTextOrientation)
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      >
                        {(Object.keys(ORIENTATION_LABELS) as SchedTextOrientation[]).map((ok) => (
                          <option key={ok} value={ok}>
                            {ORIENTATION_LABELS[ok]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold block">جهت سلول‌ها:</span>
                      <select
                        value={batchSlotBodyOri}
                        onChange={(e) =>
                          setBatchSlotBodyOri(e.target.value as SchedTextOrientation)
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      >
                        {(Object.keys(ORIENTATION_LABELS) as SchedTextOrientation[]).map((ok) => (
                          <option key={ok} value={ok}>
                            {ORIENTATION_LABELS[ok]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold block">Wrap / Shrink:</span>
                      <select
                        value={batchSlotTextFit}
                        onChange={(e) => setBatchSlotTextFit(e.target.value as SchedCellTextFit)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      >
                        {(Object.keys(TEXT_FIT_LABELS) as SchedCellTextFit[]).map((fk) => (
                          <option key={fk} value={fk}>
                            {TEXT_FIT_LABELS[fk]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={selectedBatchSlotKeys.length === 0}
                      onClick={() => {
                        const w = Math.max(
                          64,
                          Math.min(440, Number(batchSlotColWidthInput) || 140)
                        );
                        const nextOverrides = { ...(liveLayout.columnOverrides || {}) };
                        selectedBatchSlotKeys.forEach((colKey) => {
                          nextOverrides[colKey] = {
                            ...(nextOverrides[colKey] || {}),
                            width: w,
                            headerOrientation: batchSlotHeaderOri,
                            bodyOrientation: batchSlotBodyOri,
                            textFit: batchSlotTextFit,
                          };
                        });
                        commitLayoutSettings(
                          { ...liveLayout, columnOverrides: nextOverrides },
                          `تنظیمات روی ${selectedBatchSlotKeys.length.toLocaleString('fa-IR')} ستون انتخاب‌شده اعمال شد.`
                        );
                      }}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 text-white font-extrabold cursor-pointer"
                    >
                      اعمال روی ستون‌های انتخابی
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* تب ۳: تنظیم اختصاصی تک‌ستون روز/سانس */}
            {layoutTab === 'individual_col' && (() => {
              const targetSlotId = indSlotId || sortedSlots[0]?.id || '';
              const colKey = `${indDay}:${targetSlotId}`;
              const curStyle = getSlotColumnStyle(indDay, targetSlotId);
              const override = liveLayout.columnOverrides?.[colKey];
              const updateCol = (patch: Partial<SchedMasterColumnStyle>) => {
                commitLayoutSettings({
                  ...liveLayout,
                  columnOverrides: {
                    ...(liveLayout.columnOverrides || {}),
                    [colKey]: {
                      ...(override || {}),
                      ...patch,
                    },
                  },
                });
              };
              return (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="space-y-1">
                      <span className="font-bold block">انتخاب روز:</span>
                      <select
                        value={indDay}
                        onChange={(e) => setIndDay(e.target.value as SchedDayKey)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      >
                        {activeDays.map((d) => (
                          <option key={d} value={d}>
                            {SCHED_DAY_LABELS[d]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold block">انتخاب سانس:</span>
                      <select
                        value={targetSlotId}
                        onChange={(e) => setIndSlotId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      >
                        {sortedSlots.map((s, idx) => (
                          <option key={s.id} value={s.id}>
                            {getSchedSlotTitle(s, idx)} ({s.startTime}-{s.endTime})
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <label className="space-y-1">
                      <span className="font-bold block">پهنای این ستون (px):</span>
                      <input
                        type="number"
                        min={64}
                        max={440}
                        value={curStyle.width}
                        onChange={(e) =>
                          updateCol({
                            width: Math.max(64, Math.min(440, Number(e.target.value) || 140)),
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold block">جهت سرتیتر ستون:</span>
                      <select
                        value={curStyle.headerOrientation}
                        onChange={(e) =>
                          updateCol({ headerOrientation: e.target.value as SchedTextOrientation })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      >
                        {(Object.keys(ORIENTATION_LABELS) as SchedTextOrientation[]).map((ok) => (
                          <option key={ok} value={ok}>
                            {ORIENTATION_LABELS[ok]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold block">جهت متن سلول‌ها:</span>
                      <select
                        value={curStyle.bodyOrientation}
                        onChange={(e) =>
                          updateCol({ bodyOrientation: e.target.value as SchedTextOrientation })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      >
                        {(Object.keys(ORIENTATION_LABELS) as SchedTextOrientation[]).map((ok) => (
                          <option key={ok} value={ok}>
                            {ORIENTATION_LABELS[ok]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold block">نحوه جاگیری متن:</span>
                      <select
                        value={curStyle.textFit}
                        onChange={(e) =>
                          updateCol({ textFit: e.target.value as SchedCellTextFit })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      >
                        {(Object.keys(TEXT_FIT_LABELS) as SchedCellTextFit[]).map((fk) => (
                          <option key={fk} value={fk}>
                            {TEXT_FIT_LABELS[fk]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {override && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const nextOverrides = { ...(liveLayout.columnOverrides || {}) };
                          delete nextOverrides[colKey];
                          commitLayoutSettings(
                            { ...liveLayout, columnOverrides: nextOverrides },
                            'تنظیم اختصاصی این ستون حذف و به پیش‌فرض بازگشت.'
                          );
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold cursor-pointer"
                      >
                        حذف تنظیم اختصاصی این ستون
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[11px] text-slate-500">
                نکته: روی هدر هر ستون در جدول، با کشیدن مرز سمت چپ ستون با ماوس می‌توانید عرض را بصری تغییر دهید (با نگه داشتن Shift روی همه روزهای آن سانس اعمال می‌شود).
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    commitLayoutSettings(
                      cloneDefaultLayout(),
                      'تمامی تنظیمات عرض و چرخش ستون‌ها به پیش‌فرض کارخانه بازنشانی شد.'
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>بازنشانی کامل</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black cursor-pointer"
                >
                  بستن و مشاهده جدول
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال تنظیمات کامل چاپ مشابه اکسل + پیش‌نمایش زنده */}
      <CourseSchedulingPrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        settings={printSettings}
        onChangeSettings={setPrintSettings}
        onResetSettings={() => {
          setPrintSettings({ ...DEFAULT_MASTER_PRINT_SETTINGS });
          onNotify('success', 'تنظیمات چاپ به حالت پیش‌فرض بازنشانی شد.');
        }}
        canSaveDefault={isSystemAdmin && Boolean(onPersistRules)}
        onSaveAsDefault={(nextCfg) => {
          if (onPersistRules) {
            onPersistRules({
              ...rules,
              masterPrintSettings: nextCfg,
            });
            onNotify('success', 'تنظیمات چاپ به‌عنوان پیش‌فرض سامانه ذخیره شد.');
          }
        }}
        onPrintNow={(effective) => {
          setPrintSettings(effective);
          executeMasterGridPrint(effective);
        }}
        activeTerm={activeTerm}
        actorName={actor.name}
        previewMeta={printPreviewSummary}
      />
    </div>
  );
};
