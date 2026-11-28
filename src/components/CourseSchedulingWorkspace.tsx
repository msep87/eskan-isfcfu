import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  SchedCellComment,
  SchedClassroom,
  SchedClassroomType,
  SchedCourseOffering,
  SchedCourseType,
  SchedCurriculumCourse,
  SchedDayKey,
  SchedEmploymentType,
  SchedExamDay,
  SchedExamSettings,
  SchedExamSlot,
  SchedInternshipSessionRole,
  SchedOfferingHistoryEntry,
  SchedOfferingSession,
  SchedPracticalUnitType,
  SchedProfessor,
  SchedProfessorProposal,
  SchedProfessorUnitLimit,
  SchedProgramCohort,
  SchedRulesSettings,
  SchedSharedTarget,
  SchedSlotHalf,
  SchedTimeSlot,
  SchedUserHistoryState,
  SchedWorkspaceRole,
  StudentScheduleAccessScope,
} from '../types';
import { Storage, normalizeAssignedFieldsList, normalizePersianSearch } from '../utils/storage';
import { addDaysToJalaliDate, formatJalaliDate, getTodayJalali } from '../utils/jalaliCalendar';
import {
  findClosestApprovedMajor,
  formatApprovedMajorLabel,
  getEffectiveApprovedMajors,
  normalizeMajorCode,
} from '../utils/academicMajors';
import {
  DEFAULT_SCHED_PROFESSOR_UNIT_LIMITS,
  EIGHT_TERM_KEYS,
  EIGHT_TERM_LABELS,
  EightTermKey,
  SCHED_COURSE_TYPE_LABELS,
  SCHED_DAY_LABELS,
  SCHED_DAYS_ORDER,
  SCHED_EMPLOYMENT_LABELS,
  SCHED_PRACTICAL_TYPE_LABELS,
  SCHED_ROOM_TYPE_LABELS,
  applyOfferingHistoryStep,
  assignSequentialGolestanGroupCodes,
  buildDefaultExamSlots,
  buildDefaultProfessorAvailabilityWindowDates,
  buildDefaultTimeSlots,
  buildExamDaysSequence,
  buildRecommendedSlotsForHours,
  buildSevenToEightSlot,
  buildTermSchedulingIndex,
  calculateOfferingBreakdown,
  calculateProfessorLoadSummary,
  cascadeRemovedProgramsFromSchedule,
  checkClassroomAvailabilityForSessions,
  checkScheduleEditLock,
  checkScheduleViewLock,
  computeInternshipSplitPlan,
  computeOfferingDeltas,
  deactivateOfferingsForRemovedClassrooms,
  deactivateOfferingsForRemovedProfessors,
  detectOfferingConflicts,
  doSlotHalvesOverlap,
  downloadSchedExcelTemplate,
  estimateCohortCurrentSemester,
  evaluateOfferingCompleteness,
  evaluateProfessorEquivalentUnitStatus,
  exportJsonRowsToExcel,
  findDuplicateGolestanGroupOffering,
  formatExamAssignmentShort,
  formatGolestanCourseCode,
  formatOfferingSessionsSummary,
  formatProfessorDegreeFull,
  formatProfessorDepartmentAndField,
  getExamSettingsForTerm,
  getMajorEightTermPlanCourseCodes,
  getNextGolestanCourseGroupInfo,
  getNextTemporaryProfessorCode,
  getOfferingClassroomAtSession,
  getOfferingSessionSlotHalf,
  getOfferingSessions,
  getOfferingSlotHalf,
  getProfessorAvailabilityWindowStatus,
  getProfessorEquivalentUnitBounds,
  getSchedSlotOrdinalLabel,
  getSchedSlotTitle,
  getSelectedTermCoursesForCohort,
  getSlotDurationHours,
  getSlotHalfLabel,
  isCourseEligibleForExam,
  isInternshipClassroomRequired,
  isOfferingAtDaySlot,
  isOfferingEffectivelyActive,
  isTemporaryProfessorCode,
  normalizeCourseGroupCode,
  normalizeCurriculumTermKey,
  normalizeOfferingWithSessions,
  normalizeProfessorCodeInput,
  normalizeSchedCode,
  parseDecimalUnits,
  parseSchedExcelFile,
  printSchedHtml,
  reconcileScheduleWithMasterData,
  round2,
  syncProfessorMetadataInOfferings,
} from '../utils/schedulingUtils';
import { CourseSchedulingAutoWizard } from './CourseSchedulingAutoWizard';
import { CourseSchedulingReports } from './CourseSchedulingReports';
import { CourseSchedulingMasterGrid } from './CourseSchedulingMasterGrid';
import { CourseSchedulingCommonExamModal } from './CourseSchedulingCommonExamModal';
import { ProfessorProposalModal } from './ProfessorProposalModal';
import { AdminProfessorProposalsPanel } from './AdminProfessorProposalsPanel';
import { PersianDatePicker } from './PersianDatePicker';
import { PersianTimePicker } from './PersianTimePicker';
import { AcademicChatWorkspace } from './AcademicChatWorkspace';
import {
  getAcademicChatTotalUnreadCount,
  subscribeAcademicChatRealtime,
} from '../utils/academicChatRealtime';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Building2,
  Calendar,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  Database,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Globe,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  Lock,
  MessagesSquare,
  Plus,
  Printer,
  Redo2,
  RefreshCw,
  RotateCcw,
  School,
  Search,
  Send,
  Settings2,
  Share2,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Undo2,
  Unlock,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

interface CourseSchedulingWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: SchedWorkspaceRole;
  actor: { id: string; name: string };
  allowedMajorNames?: string[];
  onDataUpdated?: () => void;
}

type WorkspaceSection =
  | 'overview'
  | 'term_courses'
  | 'classrooms'
  | 'programs'
  | 'professors'
  | 'courses'
  | 'rules'
  | 'locks'
  | 'master_grid'
  | 'schedule'
  | 'auto_wizard'
  | 'reports'
  | 'professor_requests';

export const CourseSchedulingWorkspace: React.FC<CourseSchedulingWorkspaceProps> = ({
  isOpen,
  onClose,
  userRole,
  actor,
  allowedMajorNames = [],
  onDataUpdated,
}) => {
  const isSystemAdmin = userRole === 'admin';
  const canManageMasterData = userRole === 'admin' || userRole === 'academic_deputy';
  const canViewSensitiveProfInfo = userRole === 'admin' || userRole === 'academic_deputy';

  const [section, setSection] = useState<WorkspaceSection>(
    canManageMasterData ? 'overview' : 'master_grid'
  );
  const approvedMajors = useMemo(
    () => getEffectiveApprovedMajors(Storage.getSettings(), false),
    [isOpen, section]
  );
  const [classrooms, setClassrooms] = useState<SchedClassroom[]>(() =>
    Storage.getSchedClassrooms()
  );
  const [programs, setPrograms] = useState<SchedProgramCohort[]>(() =>
    Storage.getSchedPrograms()
  );
  const [professors, setProfessors] = useState<SchedProfessor[]>(() =>
    Storage.getSchedProfessors()
  );
  const [professorProposals, setProfessorProposals] = useState<SchedProfessorProposal[]>(() =>
    Storage.getSchedProfessorProposals()
  );
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [profTempOnlyFilter, setProfTempOnlyFilter] = useState(false);
  const [courses, setCourses] = useState<SchedCurriculumCourse[]>(() =>
    Storage.getSchedCourses()
  );
  const [offerings, setOfferings] = useState<SchedCourseOffering[]>(() =>
    Storage.getSchedOfferings()
  );
  const [rules, setRules] = useState<SchedRulesSettings>(() => Storage.getSchedRules());
  const [cellComments, setCellComments] = useState<SchedCellComment[]>(() =>
    Storage.getSchedCellComments()
  );
  const [appSettingsSnapshot, setAppSettingsSnapshot] = useState(() => Storage.getSettings());
  const [isAcademicChatOpen, setIsAcademicChatOpen] = useState(false);
  const [academicChatUnread, setAcademicChatUnread] = useState<number>(() =>
    getAcademicChatTotalUnreadCount(actor.id)
  );

  const refreshProfessorsAndProposals = () => {
    setProfessors(Storage.getSchedProfessors());
    setOfferings(Storage.getSchedOfferings());
    setProfessorProposals(Storage.getSchedProfessorProposals());
    onDataUpdated?.();
  };

  useEffect(() => {
    if (!isOpen) return;
    const refresh = () => setAcademicChatUnread(getAcademicChatTotalUnreadCount(actor.id));
    refresh();
    return subscribeAcademicChatRealtime({ onDataUpdated: refresh });
  }, [isOpen, actor.id, isAcademicChatOpen]);

  // همگام‌سازی خودکار داده‌ها با تنظیمات کل سامانه و پاک‌سازی مغایرت‌های احتمالی در زمان باز شدن پنجره
  useEffect(() => {
    if (!isOpen) return;
    const latestRooms = Storage.getSchedClassrooms();
    const latestPrograms = Storage.getSchedPrograms();
    const latestProfs = Storage.getSchedProfessors();
    const latestProposals = Storage.getSchedProfessorProposals();
    const latestCourses = Storage.getSchedCourses();
    const latestOfferings = Storage.getSchedOfferings();
    const latestComments = Storage.getSchedCellComments();
    const latestRules = Storage.getSchedRules();
    const latestSettings = Storage.getSettings();

    setClassrooms(latestRooms);
    setPrograms(latestPrograms);
    setProfessors(latestProfs);
    setProfessorProposals(latestProposals);
    setCourses(latestCourses);
    setRules(latestRules);
    setAppSettingsSnapshot(latestSettings);

    const rec = reconcileScheduleWithMasterData({
      offerings: latestOfferings,
      cellComments: latestComments,
      programs: latestPrograms,
      professors: latestProfs,
      classrooms: latestRooms,
      actor,
    });
    if (rec.changed) {
      setOfferings(rec.nextOfferings);
      setCellComments(rec.nextCellComments);
      Storage.setSchedOfferings(rec.nextOfferings);
      Storage.setSchedCellComments(rec.nextCellComments);
    } else {
      setOfferings(latestOfferings);
      setCellComments(latestComments);
    }
  }, [isOpen]);

  const deptHeadUsers = useMemo(
    () => Storage.getEducationStaff().filter((s) => s.educationRole === 'department_head'),
    []
  );
  const expertUsers = useMemo(
    () => Storage.getEducationStaff().filter((s) => s.educationRole !== 'department_head'),
    []
  );
  const academicDeputyUsers = useMemo(() => Storage.getAcademicDeputyStaff(), []);

  const [activeTerm, setActiveTerm] = useState<string>(rules.activeTerm || '4041');
  const [newTermInput, setNewTermInput] = useState('');
  const [showNewTermBox, setShowNewTermBox] = useState(false);
  const [commonExamModalOpen, setCommonExamModalOpen] = useState(false);
  const [masterFullscreenPortalEl, setMasterFullscreenPortalEl] = useState<HTMLElement | null>(
    null
  );

  const [availWindowStatus, setAvailWindowStatus] = useState(() =>
    getProfessorAvailabilityWindowStatus(rules, new Date())
  );
  useEffect(() => {
    const syncStatus = () => {
      const next = getProfessorAvailabilityWindowStatus(rules, new Date());
      setAvailWindowStatus((prev) =>
        prev.isOpen === next.isOpen &&
        prev.status === next.status &&
        prev.remainingText === next.remainingText &&
        prev.message === next.message
          ? prev
          : next
      );
    };
    syncStatus();
    if (!isOpen || !rules.professorAvailabilityWindow?.enabled) return;
    const timer = window.setInterval(syncStatus, 30000);
    return () => window.clearInterval(timer);
  }, [isOpen, rules]);

  const profAvailStats = useMemo(() => {
    const active = professors.filter((p) => p.isActive);
    const submitted = active.filter((p) => p.availabilitySubmitted).length;
    return {
      totalActive: active.length,
      submitted,
      defaultOpen: Math.max(0, active.length - submitted),
    };
  }, [professors]);

  const [profToDelete, setProfToDelete] = useState<SchedProfessor | null>(null);
  type SchedDangerAction =
    | 'clear_term_schedule'
    | 'clear_all_schedules'
    | 'clear_classrooms'
    | 'clear_professors'
    | 'clear_courses'
    | 'clear_programs'
    | 'clear_comments_history'
    | 'clear_everything';
  const [dangerActionModal, setDangerActionModal] = useState<SchedDangerAction | null>(null);
  const restoreInputRef = useRef<HTMLInputElement | null>(null);

  const [historyState, setHistoryState] = useState<SchedUserHistoryState>(() =>
    Storage.getSchedUserHistory(actor.id)
  );
  React.useEffect(() => {
    setHistoryState(Storage.getSchedUserHistory(actor.id));
  }, [actor.id]);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const notify = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    window.setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 6000);
  };

  const persistClassrooms = (next: SchedClassroom[]) => {
    setClassrooms(next);
    Storage.setSchedClassrooms(next);
    onDataUpdated?.();
  };
  const persistPrograms = (next: SchedProgramCohort[]) => {
    setPrograms(next);
    Storage.setSchedPrograms(next);
    onDataUpdated?.();
  };
  const persistProfessors = (next: SchedProfessor[]) => {
    setProfessors(next);
    Storage.setSchedProfessors(next);
    onDataUpdated?.();
  };
  const persistCourses = (next: SchedCurriculumCourse[]) => {
    setCourses(next);
    Storage.setSchedCourses(next);
    onDataUpdated?.();
  };
  const persistOfferings = (next: SchedCourseOffering[]) => {
    setOfferings(next);
    Storage.setSchedOfferings(next);
    onDataUpdated?.();
  };
  const persistRules = (next: SchedRulesSettings) => {
    setRules(next);
    Storage.setSchedRules(next);
    onDataUpdated?.();
  };
  const persistCellComments = (next: SchedCellComment[]) => {
    setCellComments(next);
    Storage.setSchedCellComments(next);
    onDataUpdated?.();
  };

  const deptHeadAccessOpen = useMemo(() => {
    const locks = rules.programLocks;
    if (!locks) return true;
    return !locks.lockAllChanges && (!locks.lockedDeptHeadIds || locks.lockedDeptHeadIds.length === 0);
  }, [rules.programLocks]);

  const handleToggleDeptHeadAccess = () => {
    const currentLocks = rules.programLocks || {
      lockAllChanges: false,
      lockMessage: '',
      lockedMajorCodes: [],
      lockedDays: [],
      lockedSlotIds: [],
      lockedDeptHeadIds: [],
      lockedAcademicDeputyIds: [],
      lockedExpertIds: [],
      blockedViewUserIds: [],
    };
    const nextOpen = !deptHeadAccessOpen;
    const nextRules: SchedRulesSettings = {
      ...rules,
      programLocks: {
        ...currentLocks,
        lockAllChanges: !nextOpen,
        lockedDeptHeadIds: nextOpen ? [] : currentLocks.lockedDeptHeadIds || [],
      },
    };
    setDraftRules(nextRules);
    persistRules(nextRules);
    notify(
      'success',
      nextOpen
        ? 'دسترسی مدیران گروه برای ثبت و ویرایش دروس در برنامه با یک کلیک باز شد.'
        : 'دسترسی ویرایش مدیران گروه مسدود شد (صرفاً مدیر سامانه مجاز به تغییر است).'
    );
  };

  const handleDeleteClassroom = (roomToDelete: SchedClassroom) => {
    const roomMap = new Map<string, string>([[roomToDelete.id, roomToDelete.name]]);
    const { nextOfferings, affectedCount } = deactivateOfferingsForRemovedClassrooms(
      offerings,
      [roomToDelete.id],
      actor,
      roomMap
    );
    persistClassrooms(classrooms.filter((x) => x.id !== roomToDelete.id));
    if (affectedCount > 0) {
      commitOfferingsWithHistory(
        nextOfferings,
        `حذف کلاس «${roomToDelete.name}» و غیرفعال‌سازی ${affectedCount} درس`
      );
      notify(
        'success',
        `کلاس «${roomToDelete.name}» حذف شد؛ تخصیص کلاس در ${affectedCount.toLocaleString('fa-IR')} درس حذف و آن دروس غیرفعال شدند.`
      );
    } else {
      notify('success', `کلاس «${roomToDelete.name}» از فهرست کلاس‌های فیزیکی حذف شد.`);
    }
  };

  const handleDeleteProgramCohort = (progToDelete: SchedProgramCohort) => {
    const remainingPrograms = programs.filter((x) => x.id !== progToDelete.id);
    const res = cascadeRemovedProgramsFromSchedule(
      offerings,
      cellComments,
      [progToDelete.id],
      remainingPrograms,
      actor
    );
    persistPrograms(remainingPrograms);

    if (rules.termOfferedCoursesByCohort) {
      const nextByTerm: Record<string, Record<string, string[]>> = {};
      Object.entries(rules.termOfferedCoursesByCohort).forEach(([tKey, cohortMap]) => {
        if (!cohortMap || typeof cohortMap !== 'object') return;
        const { [progToDelete.id]: _removed, ...restCohorts } = cohortMap;
        nextByTerm[tKey] = restCohorts;
      });
      persistRules({ ...rules, termOfferedCoursesByCohort: nextByTerm });
    }

    if (res.removedOfferingsCount > 0 || res.updatedSharedCount > 0) {
      commitOfferingsWithHistory(
        res.nextOfferings,
        `حذف رشته-ورودی «${progToDelete.majorName} (${progToDelete.entryTerm})» و پاک‌سازی ${res.removedOfferingsCount} درس`
      );
    }
    if (res.removedCommentsCount > 0) {
      persistCellComments(res.nextCellComments);
    }
    notify(
      'success',
      res.removedOfferingsCount > 0
        ? `رشته-ورودی «${progToDelete.majorName} - ورودی ${progToDelete.entryTerm}» و تمام ${res.removedOfferingsCount.toLocaleString('fa-IR')} درس ثبت‌شده آن از جدول برنامه حذف شد.`
        : `رشته-ورودی «${progToDelete.majorName} - ورودی ${progToDelete.entryTerm}» حذف شد.`
    );
  };

  const handleConfirmDeleteProfessor = () => {
    if (!profToDelete) return;
    const map = new Map<string, string>([[profToDelete.id, profToDelete.fullName]]);
    const { nextOfferings, affectedCount } = deactivateOfferingsForRemovedProfessors(
      offerings,
      [profToDelete.id],
      actor,
      map
    );
    persistProfessors(professors.filter((x) => x.id !== profToDelete.id));
    if (affectedCount > 0) {
      commitOfferingsWithHistory(
        nextOfferings,
        `حذف استاد «${profToDelete.fullName}» و غیرفعال‌سازی ${affectedCount} درس`
      );
      notify(
        'success',
        `استاد «${profToDelete.fullName}» حذف شد و ${affectedCount.toLocaleString('fa-IR')} درس تخصیص‌یافته غیرفعال و بدون استاد گردید.`
      );
    } else {
      notify('success', `استاد «${profToDelete.fullName}» از لیست اساتید حذف شد.`);
    }
    setProfToDelete(null);
  };

  const handleDownloadSchedBackup = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      activeTerm,
      classrooms,
      programs,
      professors,
      professorProposals,
      courses,
      offerings,
      cellComments,
      rules,
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sched_backup_${activeTerm}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify('success', 'فایل پشتیبان کامل برنامه درسی (JSON) ذخیره و دانلود شد.');
  };

  const handleRestoreSchedBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.offerings)) {
        notify('error', 'ساختار فایل پشتیبان معتبر نیست.');
        return;
      }
      if (Array.isArray(parsed.classrooms)) persistClassrooms(parsed.classrooms);
      if (Array.isArray(parsed.programs)) persistPrograms(parsed.programs);
      if (Array.isArray(parsed.professors)) persistProfessors(parsed.professors);
      if (Array.isArray(parsed.professorProposals)) {
        Storage.setSchedProfessorProposals(parsed.professorProposals);
        setProfessorProposals(parsed.professorProposals);
      }
      if (Array.isArray(parsed.courses)) persistCourses(parsed.courses);
      if (Array.isArray(parsed.offerings)) persistOfferings(parsed.offerings);
      if (Array.isArray(parsed.cellComments)) persistCellComments(parsed.cellComments);
      if (parsed.rules && typeof parsed.rules === 'object') {
        const mergedRules: SchedRulesSettings = {
          ...rules,
          ...parsed.rules,
        };
        setDraftRules(mergedRules);
        persistRules(mergedRules);
        if (mergedRules.activeTerm) setActiveTerm(mergedRules.activeTerm);
      } else if (typeof parsed.activeTerm === 'string' && parsed.activeTerm) {
        setActiveTerm(parsed.activeTerm);
      }
      notify('success', 'بازیابی اطلاعات برنامه‌ریزی از فایل پشتیبان با موفقیت انجام شد.');
    } catch {
      notify('error', 'خطا در خواندن یا تجزیه فایل پشتیبان JSON.');
    }
  };

  const executeDangerAction = () => {
    if (!dangerActionModal) return;
    if (dangerActionModal === 'clear_term_schedule') {
      const removedCount = offerings.filter((o) => o.termKey === activeTerm).length;
      commitOfferingsWithHistory(
        offerings.filter((o) => o.termKey !== activeTerm),
        `خالی کردن جدول برنامه ترم ${activeTerm}`
      );
      notify(
        'success',
        `تمامی ${removedCount.toLocaleString('fa-IR')} درس جدول برنامه ترم ${activeTerm} خالی شد؛ اطلاعات پایه حفظ گردید.`
      );
    } else if (dangerActionModal === 'clear_all_schedules') {
      const removedCount = offerings.length;
      commitOfferingsWithHistory([], 'خالی کردن برنامه تمام ترم‌ها');
      notify(
        'success',
        `تمامی ${removedCount.toLocaleString('fa-IR')} درس برنامه‌ریزی‌شده همه ترم‌ها حذف شد؛ اطلاعات پایه حفظ گردید.`
      );
    } else if (dangerActionModal === 'clear_classrooms') {
      const roomNameMap = new Map(classrooms.map((r) => [r.id, r.name]));
      const { nextOfferings, affectedCount } = deactivateOfferingsForRemovedClassrooms(
        offerings,
        classrooms.map((r) => r.id),
        actor,
        roomNameMap
      );
      persistClassrooms([]);
      if (affectedCount > 0) {
        commitOfferingsWithHistory(
          nextOfferings,
          `پاک‌سازی کلاس‌های فیزیکی و غیرفعال‌سازی ${affectedCount} درس`
        );
      }
      notify(
        'success',
        `لیست کلاس‌های فیزیکی پاک‌سازی شد؛ کلاس ${affectedCount.toLocaleString('fa-IR')} درس مرتبط حذف و آن دروس غیرفعال شدند.`
      );
    } else if (dangerActionModal === 'clear_professors') {
      const profNameMap = new Map(professors.map((p) => [p.id, p.fullName]));
      const { nextOfferings, affectedCount } = deactivateOfferingsForRemovedProfessors(
        offerings,
        professors.map((p) => p.id),
        actor,
        profNameMap
      );
      persistProfessors([]);
      persistOfferings(nextOfferings);
      notify(
        'success',
        `لیست اساتید پاک‌سازی شد و ${affectedCount.toLocaleString('fa-IR')} درس مرتبط غیرفعال و بدون استاد شدند.`
      );
    } else if (dangerActionModal === 'clear_courses') {
      persistCourses([]);
      notify('success', 'لیست سرفصل دروس (کد ۷ رقمی) پاک‌سازی شد.');
    } else if (dangerActionModal === 'clear_programs') {
      const res = cascadeRemovedProgramsFromSchedule(
        offerings,
        cellComments,
        programs.map((p) => p.id),
        [],
        actor
      );
      persistPrograms([]);
      if (res.removedOfferingsCount > 0 || res.updatedSharedCount > 0) {
        commitOfferingsWithHistory(
          res.nextOfferings,
          `پاک‌سازی رشته‌ها و ورودی‌ها و حذف ${res.removedOfferingsCount} درس جدول`
        );
      }
      if (res.removedCommentsCount > 0) {
        persistCellComments(res.nextCellComments);
      }
      if (rules.termOfferedCoursesByCohort && Object.keys(rules.termOfferedCoursesByCohort).length > 0) {
        persistRules({ ...rules, termOfferedCoursesByCohort: {} });
      }
      notify(
        'success',
        `فهرست رشته‌ها، سال‌های ورود و شعب پاک‌سازی و ${res.removedOfferingsCount.toLocaleString('fa-IR')} درس مرتبط از جدول برنامه حذف شد.`
      );
    } else if (dangerActionModal === 'clear_comments_history') {
      persistCellComments([]);
      const emptyHist: SchedUserHistoryState = { undoStack: [], redoStack: [] };
      setHistoryState(emptyHist);
      Storage.setSchedUserHistory(actor.id, emptyHist);
      notify('success', 'یادداشت‌های سلول‌ها و تاریخچه بازگشت تغییرات پاک‌سازی شد.');
    } else if (dangerActionModal === 'clear_everything') {
      persistOfferings([]);
      persistClassrooms([]);
      persistPrograms([]);
      persistProfessors([]);
      persistCourses([]);
      persistCellComments([]);
      const emptyHist: SchedUserHistoryState = { undoStack: [], redoStack: [] };
      setHistoryState(emptyHist);
      Storage.setSchedUserHistory(actor.id, emptyHist);
      notify('success', 'تمامی داده‌های برنامه‌ریزی درسی به صورت کامل پاک‌سازی شدند.');
    }
    setDangerActionModal(null);
  };

  const commitOfferingsWithHistory = (
    nextOfferings: SchedCourseOffering[],
    actionLabel: string
  ) => {
    const rawDeltas = computeOfferingDeltas(offerings, nextOfferings);
    const changedIds = new Set(rawDeltas.map((d) => d.offeringId));
    const nowIso = new Date().toISOString();
    const finalizedNext = nextOfferings.map((item) =>
      changedIds.has(item.id)
        ? {
            ...item,
            updatedById: actor.id,
            updatedByName: actor.name,
            updatedAt: item.updatedAt || nowIso,
          }
        : item
    );
    const deltas = computeOfferingDeltas(offerings, finalizedNext);
    if (deltas.length > 0) {
      const entry: SchedOfferingHistoryEntry = {
        id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        termKey: activeTerm,
        actorId: actor.id,
        actorName: actor.name,
        label: actionLabel,
        timestamp: nowIso,
        deltas,
      };
      const nextHist: SchedUserHistoryState = {
        undoStack: [...historyState.undoStack, entry].slice(-50),
        redoStack: [],
      };
      setHistoryState(nextHist);
      Storage.setSchedUserHistory(actor.id, nextHist);
    }
    persistOfferings(finalizedNext);
  };

  const handleUndoOfferings = () => {
    const stack = historyState.undoStack;
    if (stack.length === 0) return;
    const entry = stack[stack.length - 1];
    const latestOfferings = Storage.getSchedOfferings();
    const res = applyOfferingHistoryStep({
      direction: 'undo',
      entry,
      latestOfferings,
      rules,
      userRole,
      actor,
      classrooms,
      professors,
    });
    if (!res.ok || !res.nextOfferings) {
      notify(
        'error',
        res.error || 'بازگشت به تغییر قبلی به دلیل تداخل یا ویرایش همزمان مجاز نیست.'
      );
      return;
    }
    const nextHist: SchedUserHistoryState = {
      undoStack: stack.slice(0, -1),
      redoStack: [...historyState.redoStack, entry].slice(-50),
    };
    setHistoryState(nextHist);
    Storage.setSchedUserHistory(actor.id, nextHist);
    persistOfferings(res.nextOfferings);
    notify('success', `بازگشت انجام شد: ${entry.label}`);
  };

  const handleRedoOfferings = () => {
    const stack = historyState.redoStack;
    if (stack.length === 0) return;
    const entry = stack[stack.length - 1];
    const latestOfferings = Storage.getSchedOfferings();
    const res = applyOfferingHistoryStep({
      direction: 'redo',
      entry,
      latestOfferings,
      rules,
      userRole,
      actor,
      classrooms,
      professors,
    });
    if (!res.ok || !res.nextOfferings) {
      notify(
        'error',
        res.error || 'انجام مجدد تغییر به دلیل تداخل یا ویرایش همزمان مجاز نیست.'
      );
      return;
    }
    const nextHist: SchedUserHistoryState = {
      undoStack: [...historyState.undoStack, entry].slice(-50),
      redoStack: stack.slice(0, -1),
    };
    setHistoryState(nextHist);
    Storage.setSchedUserHistory(actor.id, nextHist);
    persistOfferings(res.nextOfferings);
    notify('success', `تغییر مجدداً اعمال شد: ${entry.label}`);
  };

  const activeTermExamSettings = useMemo(
    () => getExamSettingsForTerm(rules, activeTerm),
    [rules, activeTerm]
  );

  const globalLockStatus = useMemo(
    () => checkScheduleEditLock(rules, userRole, actor.id),
    [rules, userRole, actor.id]
  );
  const viewLockStatus = useMemo(
    () => checkScheduleViewLock(rules, userRole, actor.id),
    [rules, userRole, actor.id]
  );

  // =====================================================
  // محدوده رشته‌های مدیر گروه
  // =====================================================
  const normalizedAllowedMajors = useMemo(
    () => normalizeAssignedFieldsList(allowedMajorNames).map((f) => normalizePersianSearch(f)),
    [allowedMajorNames]
  );

  const isOwnMajorName = (majorName: string): boolean => {
    if (canManageMasterData || normalizedAllowedMajors.length === 0) return true;
    const norm = normalizePersianSearch(majorName);
    return normalizedAllowedMajors.some((m) => norm === m || norm.includes(m) || m.includes(norm));
  };

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

  const termOfferings = useMemo(
    () => offerings.filter((o) => o.termKey === activeTerm),
    [offerings, activeTerm]
  );

  const termSchedulingIndex = useMemo(
    () => buildTermSchedulingIndex(termOfferings, classrooms, professors, rules),
    [termOfferings, classrooms, professors, rules]
  );

  // آمار خلاصه پیشخوان (محاسبه سریع O(N) با شاخص ازپیش‌محاسبه‌شده)
  const overviewStats = useMemo(() => {
    let totalHours = 0;
    let hardConflicts = 0;
    let activeCount = 0;
    let sharedCount = 0;
    for (const o of termOfferings) {
      const comp = termSchedulingIndex.completenessMap.get(o.id);
      if (comp?.isEffectivelyInactive) continue;
      activeCount++;
      totalHours += termSchedulingIndex.breakdownMap.get(o.id)?.weeklyHours || 0;
      if (termSchedulingIndex.conflictMap.get(o.id)?.hasHardConflict) {
        hardConflicts++;
      }
      if (o.sharedWithTargets && o.sharedWithTargets.length > 0) {
        sharedCount++;
      }
    }
    const disabledOfferingsCount = termOfferings.length - activeCount;
    return {
      activeClassrooms: classrooms.filter((r) => r.isActive).length,
      totalCohorts: programs.length,
      totalSections: programs.reduce((s, p) => s + Math.max(1, p.sections.length), 0),
      activeProfessors: professors.filter((p) => p.isActive).length,
      totalCourses: courses.length,
      termOfferingsCount: activeCount,
      disabledOfferingsCount,
      totalWeeklyHours: round2(totalHours),
      hardConflicts,
      sharedCount,
    };
  }, [classrooms, programs, professors, courses, termOfferings, termSchedulingIndex]);

  // =====================================================
  // اکسل گروهی اطلاعات اولیه
  // =====================================================
  const handleExcelImport = async (
    kind: 'classrooms' | 'programs' | 'professors' | 'courses',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const res = await parseSchedExcelFile(file, kind);
      if (kind === 'classrooms' && res.classrooms) {
        const merged = [...classrooms];
        for (const item of res.classrooms) {
          const idx = merged.findIndex((x) => x.code === item.code);
          if (idx >= 0) merged[idx] = { ...merged[idx], ...item, id: merged[idx].id };
          else merged.push(item);
        }
        persistClassrooms(merged);
        notify('success', `${res.classrooms.length} کلاس فیزیکی از اکسل پردازش و ذخیره شد.`);
      } else if (kind === 'programs' && res.programs) {
        const merged = [...programs];
        let normalizedExcelCount = 0;
        for (const rawItem of res.programs) {
          let item = rawItem;
          if (approvedMajors.length > 0) {
            const matched = findClosestApprovedMajor(rawItem.majorName, approvedMajors, rawItem.majorCode);
            if (matched && matched.score >= 80) {
              item = {
                ...rawItem,
                majorCode: normalizeMajorCode(matched.major.code) || rawItem.majorCode,
                majorName: matched.major.name,
              };
              normalizedExcelCount++;
            }
          }
          const idx = merged.findIndex(
            (x) => x.majorCode === item.majorCode && x.entryTerm === item.entryTerm
          );
          if (idx >= 0) merged[idx] = { ...merged[idx], ...item, id: merged[idx].id };
          else merged.push(item);
        }
        persistPrograms(merged);
        notify(
          'success',
          `${res.programs.length} ورودی و شعبه از اکسل پردازش و ذخیره شد${
            normalizedExcelCount > 0 ? ` (${normalizedExcelCount} ردیف با رشته‌های مصوب تطبیق داده شد)` : ''
          }.`
        );
      } else if (kind === 'professors' && res.professors) {
        const merged = [...professors];
        for (const item of res.professors) {
          const idx = merged.findIndex((x) => x.professorCode === item.professorCode);
          if (idx >= 0) {
            merged[idx] = {
              ...merged[idx],
              ...item,
              id: merged[idx].id,
              unavailableKeys: merged[idx].unavailableKeys || [],
            };
          } else {
            merged.push(item);
          }
        }
        persistProfessors(merged);
        notify('success', `${res.professors.length} استاد از اکسل پردازش و ذخیره شد.`);
      } else if (kind === 'courses' && res.courses) {
        const merged = [...courses];
        let normalizedCoursesCount = 0;
        for (const rawItem of res.courses) {
          let item = rawItem;
          if (approvedMajors.length > 0) {
            const matched = findClosestApprovedMajor(rawItem.majorName, approvedMajors, rawItem.majorCode);
            if (matched && matched.score >= 80) {
              item = {
                ...rawItem,
                majorCode: normalizeMajorCode(matched.major.code) || rawItem.majorCode,
                majorName: matched.major.name,
              };
              normalizedCoursesCount++;
            }
          }
          const idx = merged.findIndex(
            (x) => x.courseCode === item.courseCode && x.majorCode === item.majorCode
          );
          if (idx >= 0) merged[idx] = { ...merged[idx], ...item, id: merged[idx].id };
          else merged.push(item);
        }
        persistCourses(merged);
        notify(
          'success',
          `${res.courses.length} سرفصل درس از اکسل پردازش و ذخیره شد${
            normalizedCoursesCount > 0 ? ` (${normalizedCoursesCount} ردیف با رشته‌های مصوب تطبیق داده شد)` : ''
          }.`
        );
      }
      if (res.errors.length > 0) {
        notify('error', `برخی ردیف‌ها دارای خطا بودند: ${res.errors.slice(0, 2).join(' | ')}`);
      }
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'خطا در خواندن فایل اکسل.');
    }
  };

  // =====================================================
  // مودال افزودن/ویرایش کلاس فیزیکی
  // =====================================================
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomBuilding, setRoomBuilding] = useState('');
  const [roomCap, setRoomCap] = useState('35');
  const [roomType, setRoomType] = useState<SchedClassroomType>('ordinary');
  const [roomNotes, setRoomNotes] = useState('');

  const openRoomModal = (room?: SchedClassroom) => {
    if (room) {
      setEditingRoomId(room.id);
      setRoomCode(room.code);
      setRoomName(room.name);
      setRoomBuilding(room.building || '');
      setRoomCap(String(room.capacity));
      setRoomType(room.roomType);
      setRoomNotes(room.notes || '');
    } else {
      setEditingRoomId(null);
      setRoomCode('');
      setRoomName('');
      setRoomBuilding('');
      setRoomCap('35');
      setRoomType('ordinary');
      setRoomNotes('');
    }
    setRoomModalOpen(true);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = normalizeSchedCode(roomCode);
    const cleanName = roomName.trim();
    if (!cleanCode || !cleanName) return;
    if (editingRoomId) {
      persistClassrooms(
        classrooms.map((r) =>
          r.id === editingRoomId
            ? {
                ...r,
                code: cleanCode,
                name: cleanName,
                building: roomBuilding.trim(),
                capacity: Math.max(1, Number(normalizeSchedCode(roomCap)) || 30),
                roomType,
                notes: roomNotes.trim(),
              }
            : r
        )
      );
      notify('success', `مشخصات کلاس «${cleanName}» بروزرسانی شد.`);
    } else {
      persistClassrooms([
        ...classrooms,
        {
          id: `room_${Date.now()}`,
          code: cleanCode,
          name: cleanName,
          building: roomBuilding.trim(),
          capacity: Math.max(1, Number(normalizeSchedCode(roomCap)) || 30),
          roomType,
          isActive: true,
          notes: roomNotes.trim(),
        },
      ]);
      notify('success', `کلاس جدید «${cleanName}» ثبت شد.`);
    }
    setRoomModalOpen(false);
  };

  // =====================================================
  // مودال افزودن/ویرایش رشته، ورودی و شعبه
  // =====================================================
  const [progModalOpen, setProgModalOpen] = useState(false);
  const [editingProgId, setEditingProgId] = useState<string | null>(null);
  const [progMajorCode, setProgMajorCode] = useState('');
  const [progMajorName, setProgMajorName] = useState('');
  const [progEntryTerm, setProgEntryTerm] = useState('4031');
  const [progTotalStudents, setProgTotalStudents] = useState('35');
  const [progSectionCount, setProgSectionCount] = useState('1');
  const [progSections, setProgSections] = useState<
    Array<{ id: string; name: string; studentCount: number }>
  >([]);

  const distributeCohortSections = (
    totalStudentsVal: number,
    sectionCountVal: number,
    existing?: Array<{ id: string; name: string; studentCount: number }>
  ): Array<{ id: string; name: string; studentCount: number }> => {
    const count = Math.max(1, Math.min(20, Math.floor(sectionCountVal) || 1));
    const total = Math.max(0, Math.floor(totalStudentsVal) || 0);
    const base = Math.floor(total / count);
    const rem = total % count;
    const now = Date.now();
    return Array.from({ length: count }, (_, i) => ({
      id: existing?.[i]?.id || `sec_${now}_${i + 1}`,
      name: existing?.[i]?.name?.trim() || `گروه ${i + 1}`,
      studentCount: total >= count ? base + (i < rem ? 1 : 0) : Math.max(1, i < total ? 1 : 1),
    }));
  };

  const openProgModal = (p?: SchedProgramCohort) => {
    if (p) {
      setEditingProgId(p.id);
      setProgMajorCode(p.majorCode);
      setProgMajorName(p.majorName);
      setProgEntryTerm(p.entryTerm);
      setProgTotalStudents(String(p.totalStudents));
      setProgSectionCount(String(Math.max(1, p.sections.length)));
      setProgSections(
        p.sections.length > 0
          ? p.sections.map((s) => ({ ...s }))
          : distributeCohortSections(p.totalStudents || 30, 1)
      );
    } else {
      const firstApproved = approvedMajors[0];
      setEditingProgId(null);
      setProgMajorCode(firstApproved ? normalizeMajorCode(firstApproved.code) : '');
      setProgMajorName(firstApproved ? firstApproved.name : '');
      setProgEntryTerm('4031');
      setProgTotalStudents('35');
      setProgSectionCount('1');
      setProgSections(distributeCohortSections(35, 1));
    }
    setProgModalOpen(true);
  };

  const handleSaveProgram = (e: React.FormEvent) => {
    e.preventDefault();
    let cleanCode = normalizeSchedCode(progMajorCode);
    let cleanName = progMajorName.trim();
    const cleanEntry = normalizeSchedCode(progEntryTerm);
    if (approvedMajors.length > 0) {
      const matched = approvedMajors.find(
        (m) =>
          normalizeMajorCode(m.code) === normalizeMajorCode(cleanCode) ||
          m.name.trim() === cleanName
      );
      if (!matched) {
        notify('error', 'لطفاً یکی از رشته‌های مصوب ثبت‌شده در تنظیمات سامانه را انتخاب کنید.');
        return;
      }
      cleanCode = normalizeMajorCode(matched.code) || cleanCode;
      cleanName = matched.name;
    } else if (!/^\d{6}$/.test(cleanCode)) {
      notify('error', 'کد رشته باید دقیقاً ۶ رقم عددی باشد.');
      return;
    }
    if (!cleanCode || !cleanName || !cleanEntry) return;
    const cleanSections =
      progSections.length > 0
        ? progSections.map((s, idx) => ({
            id: s.id || `sec_${Date.now()}_${idx}`,
            name: s.name.trim() || `گروه ${idx + 1}`,
            studentCount: Math.max(1, Number(s.studentCount) || 25),
          }))
        : [
            {
              id: `sec_${Date.now()}_1`,
              name: 'گروه ۱',
              studentCount: Math.max(1, Number(normalizeSchedCode(progTotalStudents)) || 30),
            },
          ];
    const sumSec = cleanSections.reduce((acc, s) => acc + s.studentCount, 0);
    const tot = Math.max(Number(normalizeSchedCode(progTotalStudents)) || 0, sumSec);

    if (editingProgId) {
      const nextPrograms = programs.map((p) =>
        p.id === editingProgId
          ? {
              ...p,
              majorCode: cleanCode,
              majorName: cleanName,
              entryTerm: cleanEntry,
              totalStudents: tot,
              sections: cleanSections,
            }
          : p
      );
      persistPrograms(nextPrograms);

      const secNameMap = new Map(cleanSections.map((s) => [s.id, s.name]));
      const res = cascadeRemovedProgramsFromSchedule(
        offerings,
        cellComments,
        [],
        nextPrograms,
        actor
      );
      const syncedOfferings = res.nextOfferings.map((o) => {
        if (o.cohortId === editingProgId) {
          return {
            ...o,
            ownerMajorCode: cleanCode,
            ownerMajorName: cleanName,
            entryTerm: cleanEntry,
            sectionName: o.sectionId ? secNameMap.get(o.sectionId) || o.sectionName : o.sectionName,
          };
        }
        return o;
      });
      const offeringsMetadataChanged =
        res.removedOfferingsCount > 0 ||
        res.updatedSharedCount > 0 ||
        syncedOfferings.some((o, i) => o !== offerings[i]);
      if (offeringsMetadataChanged) {
        commitOfferingsWithHistory(
          syncedOfferings,
          `بروزرسانی اطلاعات و شعب «${cleanName} - ورودی ${cleanEntry}»`
        );
      }
      if (res.removedCommentsCount > 0) {
        persistCellComments(res.nextCellComments);
      }
      notify(
        'success',
        res.removedOfferingsCount > 0
          ? `اطلاعات رشته «${cleanName} - ورودی ${cleanEntry}» بروزرسانی و ${res.removedOfferingsCount.toLocaleString('fa-IR')} درس مربوط به شعب حذف‌شده از جدول حذف شد.`
          : `اطلاعات رشته «${cleanName} - ورودی ${cleanEntry}» بروزرسانی شد.`
      );
    } else {
      persistPrograms([
        ...programs,
        {
          id: `prog_${Date.now()}`,
          majorCode: cleanCode,
          majorName: cleanName,
          entryTerm: cleanEntry,
          totalStudents: tot,
          sections: cleanSections,
        },
      ]);
      notify('success', `رشته و ورودی جدید «${cleanName} (${cleanEntry})» ثبت شد.`);
    }
    setProgModalOpen(false);
  };

  // =====================================================
  // مودال افزودن/ویرایش استاد + جدول عدم امکان حضور
  // =====================================================
  const [profSearch, setProfSearch] = useState('');
  const deferredProfSearch = useDeferredValue(profSearch);
  const [profPage, setProfPage] = useState(1);
  const [profShowAll, setProfShowAll] = useState(false);
  const [profModalOpen, setProfModalOpen] = useState(false);
  const [editingProfId, setEditingProfId] = useState<string | null>(null);
  const [profCode, setProfCode] = useState('');
  const [profFirstName, setProfFirstName] = useState('');
  const [profLastName, setProfLastName] = useState('');
  const [profGender, setProfGender] = useState('');
  const [profFatherName, setProfFatherName] = useState('');
  const [profNationalId, setProfNationalId] = useState('');
  const [profDepartmentName, setProfDepartmentName] = useState('');
  const [profUnitCenterName, setProfUnitCenterName] = useState('');
  const [profDegreeLevel, setProfDegreeLevel] = useState('');
  const [profDegreeField, setProfDegreeField] = useState('');
  const [profDegreeSpecialization, setProfDegreeSpecialization] = useState('');
  const [profAcademicStep, setProfAcademicStep] = useState('');
  const [profAcademicRank, setProfAcademicRank] = useState('');
  const [profEmployment, setProfEmployment] =
    useState<SchedEmploymentType>('faculty_member');
  const [profEmploymentStatusRaw, setProfEmploymentStatusRaw] = useState('');
  const [profMobile, setProfMobile] = useState('');
  const [profLandlinePhone, setProfLandlinePhone] = useState('');
  const [profBankName, setProfBankName] = useState('');
  const [profBank, setProfBank] = useState('');
  const [profMinEqOverride, setProfMinEqOverride] = useState('');
  const [profMaxEqOverride, setProfMaxEqOverride] = useState('');
  const [unavailProfModal, setUnavailProfModal] = useState<SchedProfessor | null>(null);
  const [unavailDraft, setUnavailDraft] = useState<string[]>([]);

  const openProfModal = (prof?: SchedProfessor) => {
    if (prof) {
      setEditingProfId(prof.id);
      setProfCode(prof.professorCode);
      const nameParts = prof.fullName.trim().split(/\s+/);
      setProfFirstName(
        prof.firstName ?? (nameParts.length > 1 ? nameParts[0] : prof.fullName)
      );
      setProfLastName(
        prof.lastName ?? (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '')
      );
      setProfGender(prof.gender || '');
      setProfFatherName(prof.fatherName || '');
      setProfNationalId(prof.nationalId);
      setProfDepartmentName(prof.departmentName || '');
      setProfUnitCenterName(prof.unitCenterName || '');
      setProfDegreeLevel(prof.degreeLevel || (!prof.degreeField ? prof.degreeFull || '' : ''));
      setProfDegreeField(prof.degreeField || '');
      setProfDegreeSpecialization(prof.degreeSpecialization || '');
      setProfAcademicStep(prof.academicStep || '');
      setProfAcademicRank(prof.academicRank || '');
      setProfEmployment(prof.employmentType);
      setProfEmploymentStatusRaw(prof.employmentStatusRaw || '');
      setProfMobile(prof.mobile || prof.phone || '');
      setProfLandlinePhone(prof.landlinePhone || '');
      setProfBankName(prof.bankName || '');
      setProfBank(prof.bankAccount || '');
      setProfMinEqOverride(
        typeof prof.minEquivalentUnitsOverride === 'number'
          ? String(prof.minEquivalentUnitsOverride)
          : ''
      );
      setProfMaxEqOverride(
        typeof prof.maxEquivalentUnitsOverride === 'number'
          ? String(prof.maxEquivalentUnitsOverride)
          : ''
      );
    } else {
      setEditingProfId(null);
      setProfCode('');
      setProfFirstName('');
      setProfLastName('');
      setProfGender('');
      setProfFatherName('');
      setProfNationalId('');
      setProfDepartmentName('');
      setProfUnitCenterName('');
      setProfDegreeLevel('');
      setProfDegreeField('');
      setProfDegreeSpecialization('');
      setProfAcademicStep('');
      setProfAcademicRank('');
      setProfEmployment('haghol_tadris_free');
      setProfEmploymentStatusRaw('');
      setProfMobile('');
      setProfLandlinePhone('');
      setProfBankName('');
      setProfBank('');
      setProfMinEqOverride('');
      setProfMaxEqOverride('');
    }
    setProfModalOpen(true);
  };

  const handleSaveProf = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = normalizeProfessorCodeInput(profCode);
    const cleanFirst = profFirstName.trim();
    const cleanLast = profLastName.trim();
    const cleanName = [cleanFirst, cleanLast].filter(Boolean).join(' ').trim();
    const cleanNat = normalizeSchedCode(profNationalId) || cleanCode;
    if (!cleanCode || !cleanName) return;
    const dup = professors.find(
      (p) =>
        normalizeProfessorCodeInput(p.professorCode).toLowerCase() === cleanCode.toLowerCase() &&
        p.id !== editingProfId
    );
    if (dup) {
      notify(
        'error',
        `کد استاد ${cleanCode} قبلاً برای «${dup.fullName}» ثبت شده است. کد استاد باید یکتا باشد.`
      );
      return;
    }

    const cleanLevel = profDegreeLevel.trim();
    const cleanField = profDegreeField.trim();
    const cleanSpec = profDegreeSpecialization.trim();
    const cleanDegreeFull =
      formatProfessorDegreeFull(cleanLevel, cleanField, cleanSpec) || cleanLevel;
    const cleanMobile = normalizeSchedCode(profMobile);
    const cleanLandline = normalizeSchedCode(profLandlinePhone);
    const cleanPhone = cleanMobile || cleanLandline;
    const minEqOv =
      profMinEqOverride.trim() !== '' ? parseDecimalUnits(profMinEqOverride) : undefined;
    const maxEqOv =
      profMaxEqOverride.trim() !== '' ? parseDecimalUnits(profMaxEqOverride) : undefined;

    if (editingProfId) {
      const existingProf = professors.find((p) => p.id === editingProfId);
      const res = Storage.updateSchedProfessorAndSync({
        professorId: editingProfId,
        updatedFields: {
          professorCode: cleanCode,
          firstName: cleanFirst || undefined,
          lastName: cleanLast || undefined,
          fullName: cleanName,
          gender: profGender.trim() || undefined,
          fatherName: profFatherName.trim() || undefined,
          nationalId: cleanNat,
          departmentName: profDepartmentName.trim() || undefined,
          unitCenterName: profUnitCenterName.trim() || undefined,
          degreeLevel: cleanLevel || undefined,
          degreeField: cleanField || undefined,
          degreeSpecialization: cleanSpec || undefined,
          degreeFull: cleanDegreeFull,
          academicStep: normalizeSchedCode(profAcademicStep) || profAcademicStep.trim() || undefined,
          academicRank: profAcademicRank.trim() || undefined,
          employmentType: profEmployment,
          employmentStatusRaw: profEmploymentStatusRaw.trim() || undefined,
          phone: cleanPhone || undefined,
          mobile: cleanMobile || undefined,
          landlinePhone: cleanLandline || undefined,
          bankName: canViewSensitiveProfInfo
            ? profBankName.trim() || undefined
            : existingProf?.bankName,
          bankAccount: canViewSensitiveProfInfo
            ? normalizeSchedCode(profBank) || undefined
            : existingProf?.bankAccount,
          minEquivalentUnitsOverride: minEqOv,
          maxEquivalentUnitsOverride: maxEqOv,
        },
        actorName: actor.name,
      });
      if (!res.success) {
        notify('error', res.message);
        return;
      }
      refreshProfessorsAndProposals();
      notify('success', res.message);
    } else {
      persistProfessors([
        ...professors,
        {
          id: `prof_${Date.now()}`,
          professorCode: cleanCode,
          isTemporaryCode: isTemporaryProfessorCode(cleanCode),
          firstName: cleanFirst || undefined,
          lastName: cleanLast || undefined,
          fullName: cleanName,
          gender: profGender.trim() || undefined,
          fatherName: profFatherName.trim() || undefined,
          nationalId: cleanNat,
          departmentName: profDepartmentName.trim() || undefined,
          unitCenterName: profUnitCenterName.trim() || undefined,
          degreeLevel: cleanLevel || undefined,
          degreeField: cleanField || undefined,
          degreeSpecialization: cleanSpec || undefined,
          degreeFull: cleanDegreeFull,
          academicStep: normalizeSchedCode(profAcademicStep) || profAcademicStep.trim() || undefined,
          academicRank: profAcademicRank.trim() || undefined,
          employmentType: profEmployment,
          employmentStatusRaw: profEmploymentStatusRaw.trim() || undefined,
          phone: cleanPhone || undefined,
          mobile: cleanMobile || undefined,
          landlinePhone: cleanLandline || undefined,
          bankName: profBankName.trim() || undefined,
          bankAccount: normalizeSchedCode(profBank) || undefined,
          minEquivalentUnitsOverride: minEqOv,
          maxEquivalentUnitsOverride: maxEqOv,
          isActive: true,
          unavailableKeys: [],
        },
      ]);
      notify('success', `استاد جدید «${cleanName}» با کد ${cleanCode} ثبت شد.`);
    }
    setProfModalOpen(false);
  };

  // =====================================================
  // مودال افزودن/ویرایش سرفصل درس (کد ۷ رقمی)
  // =====================================================
  const [courseSearch, setCourseSearch] = useState('');
  const deferredCourseSearch = useDeferredValue(courseSearch);
  const [coursePage, setCoursePage] = useState(1);
  const [courseShowAll, setCourseShowAll] = useState(false);
  const [courseMajorFilter, setCourseMajorFilter] = useState('all');
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [crsCode, setCrsCode] = useState('');
  const [crsTitle, setCrsTitle] = useState('');
  const [crsMajorCode, setCrsMajorCode] = useState('');
  const [crsMajorName, setCrsMajorName] = useState('');
  const [crsType, setCrsType] = useState<SchedCourseType>('theoretical');
  const [crsThUnits, setCrsThUnits] = useState('2');
  const [crsPrUnits, setCrsPrUnits] = useState('0');
  const [crsPrType, setCrsPrType] = useState<SchedPracticalUnitType>('normal_lab');
  const [crsTerm, setCrsTerm] = useState('1');

  const openCourseModal = (crs?: SchedCurriculumCourse) => {
    if (crs) {
      setEditingCourseId(crs.id);
      setCrsCode(crs.courseCode);
      setCrsTitle(crs.title);
      setCrsMajorCode(crs.majorCode);
      setCrsMajorName(crs.majorName);
      setCrsType(crs.courseType);
      setCrsThUnits(String(crs.theoreticalUnits));
      setCrsPrUnits(String(crs.practicalUnits));
      setCrsPrType(crs.practicalType);
      setCrsTerm(crs.recommendedTerm || '');
    } else {
      const firstApproved = approvedMajors[0];
      setEditingCourseId(null);
      setCrsCode('');
      setCrsTitle('');
      setCrsMajorCode(
        programs[0]?.majorCode || (firstApproved ? normalizeMajorCode(firstApproved.code) : '')
      );
      setCrsMajorName(programs[0]?.majorName || (firstApproved ? firstApproved.name : ''));
      setCrsType('theoretical');
      setCrsThUnits('2');
      setCrsPrUnits('0');
      setCrsPrType('normal_lab');
      setCrsTerm('1');
    }
    setCourseModalOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = normalizeSchedCode(crsCode);
    let cleanMajor = normalizeSchedCode(crsMajorCode);
    let cleanMajorName = crsMajorName.trim();
    if (!/^\d{7}$/.test(cleanCode)) {
      notify('error', 'کد درس باید دقیقاً ۷ رقم عددی باشد (مبنای تشخیص دروس مشترک).');
      return;
    }
    if (approvedMajors.length > 0) {
      const matched = approvedMajors.find(
        (m) =>
          normalizeMajorCode(m.code) === normalizeMajorCode(cleanMajor) ||
          m.name.trim() === cleanMajorName
      );
      if (!matched) {
        notify('error', 'لطفاً یکی از رشته‌های مصوب ثبت‌شده در تنظیمات کل سامانه را انتخاب کنید.');
        return;
      }
      cleanMajor = normalizeMajorCode(matched.code) || cleanMajor;
      cleanMajorName = matched.name;
    }
    if (!crsTitle.trim() || !cleanMajor || !cleanMajorName) {
      notify('error', 'لطفاً عنوان درس، کد رشته و نام رشته را وارد نمایید.');
      return;
    }
    const th = Math.max(0, parseDecimalUnits(crsThUnits));
    const pr = Math.max(0, parseDecimalUnits(crsPrUnits));

    if (editingCourseId) {
      persistCourses(
        courses.map((c) =>
          c.id === editingCourseId
            ? {
                ...c,
                courseCode: cleanCode,
                title: crsTitle.trim(),
                majorCode: cleanMajor,
                majorName: cleanMajorName,
                courseType: crsType,
                theoreticalUnits: th,
                practicalUnits: pr,
                practicalType: crsPrType,
                recommendedTerm: crsTerm.trim(),
              }
            : c
        )
      );
      notify('success', `سرفصل درس «${crsTitle.trim()}» بروزرسانی شد.`);
    } else {
      persistCourses([
        ...courses,
        {
          id: `crs_${Date.now()}`,
          courseCode: cleanCode,
          title: crsTitle.trim(),
          majorCode: cleanMajor,
          majorName: cleanMajorName,
          courseType: crsType,
          theoreticalUnits: th,
          practicalUnits: pr,
          practicalType: crsPrType,
          recommendedTerm: crsTerm.trim(),
        },
      ]);
      notify('success', `درس جدید «${crsTitle.trim()}» (${cleanCode}) به چارت رشته اضافه شد.`);
    }
    setCourseModalOpen(false);
  };

  // =====================================================
  // استودیو و جدول زمان‌بندی دروس + ثبت/ویرایش ارائه + مشترک‌سازی ۷ رقمی
  // =====================================================
  const [schedViewMode, setSchedViewMode] = useState<'matrix' | 'list'>('matrix');
  const [schedMajorFilter, setSchedMajorFilter] = useState<string>('all');
  const [schedCohortFilter, setSchedCohortFilter] = useState<string>('all');
  const [schedRoomFilter, setSchedRoomFilter] = useState<string>('all');
  const [schedProfFilter, setSchedProfFilter] = useState<string>('all');
  const [allowCrossMajorView, setAllowCrossMajorView] = useState<boolean>(false);

  const uniqueMajors = useMemo(() => {
    const map = new Map<string, string>();
    programs.forEach((p) => map.set(p.majorCode, p.majorName));
    courses.forEach((c) => {
      if (!map.has(c.majorCode)) map.set(c.majorCode, c.majorName);
    });
    return Array.from(map.entries())
      .map(([majorCode, majorName]) => ({ majorCode, majorName }))
      .sort((a, b) => a.majorName.localeCompare(b.majorName, 'fa'));
  }, [programs, courses]);

  const courseCodeMajorCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of courses) {
      map.set(c.courseCode, (map.get(c.courseCode) || 0) + 1);
    }
    return map;
  }, [courses]);

  const filteredProfessors = useMemo(() => {
    const q = deferredProfSearch.trim().toLowerCase();
    return professors.filter((p) => {
      if (profTempOnlyFilter && !isTemporaryProfessorCode(p.professorCode)) return false;
      if (!q) return true;
      return `${p.fullName} ${p.firstName || ''} ${p.lastName || ''} ${p.professorCode} ${p.previousTemporaryCode || ''} ${p.nationalId || ''} ${p.degreeLevel || ''} ${p.degreeField || ''} ${p.degreeSpecialization || ''} ${p.degreeFull || ''} ${p.departmentName || ''} ${p.unitCenterName || ''} ${p.academicRank || ''} ${p.employmentStatusRaw || ''}`
        .toLowerCase()
        .includes(q);
    });
  }, [professors, deferredProfSearch, profTempOnlyFilter]);

  const filteredCourses = useMemo(() => {
    const q = deferredCourseSearch.trim().toLowerCase();
    return courses.filter((c) => {
      if (courseMajorFilter !== 'all' && c.majorCode !== courseMajorFilter) return false;
      if (!q) return true;
      return `${c.courseCode} ${c.title} ${c.majorName}`.toLowerCase().includes(q);
    });
  }, [courses, courseMajorFilter, deferredCourseSearch]);

  useEffect(() => {
    setProfPage(1);
  }, [deferredProfSearch, profTempOnlyFilter]);

  useEffect(() => {
    setCoursePage(1);
  }, [deferredCourseSearch, courseMajorFilter]);

  const filteredScheduleOfferings = useMemo(() => {
    return termOfferings.filter((o) => {
      if (!canManageMasterData && !allowCrossMajorView && normalizedAllowedMajors.length > 0) {
        const ownsMain = isOwnMajorName(o.ownerMajorName);
        const ownsShared = Boolean(o.sharedWithTargets?.some((t) => isOwnMajorName(t.majorName)));
        if (!ownsMain && !ownsShared) return false;
      }
      if (schedMajorFilter !== 'all') {
        const hit =
          o.ownerMajorCode === schedMajorFilter ||
          o.sharedWithTargets?.some((t) => t.majorCode === schedMajorFilter);
        if (!hit) return false;
      }
      if (schedCohortFilter !== 'all') {
        const hit =
          o.cohortId === schedCohortFilter ||
          o.sharedWithTargets?.some((t) => t.cohortId === schedCohortFilter);
        if (!hit) return false;
      }
      if (schedRoomFilter !== 'all' && o.classroomId !== schedRoomFilter) return false;
      if (schedProfFilter !== 'all' && o.professorId !== schedProfFilter) return false;
      return true;
    });
  }, [
    termOfferings,
    canManageMasterData,
    allowCrossMajorView,
    normalizedAllowedMajors,
    schedMajorFilter,
    schedCohortFilter,
    schedRoomFilter,
    schedProfFilter,
  ]);

  // مودال ثبت / ویرایش ارائه درس
  interface DraftModalSession {
    id: string;
    dayOfWeek: SchedDayKey | '';
    slotIds: string[];
    slotParts: Record<string, SchedSlotHalf>;
    classroomId?: string;
  }

  const [offModalOpen, setOffModalOpen] = useState(false);
  const [editingOffId, setEditingOffId] = useState<string | null>(null);
  const [offMajorCode, setOffMajorCode] = useState('');
  const [offCourseId, setOffCourseId] = useState('');
  const [offCourseGroupCode, setOffCourseGroupCode] = useState('01');
  const [offGroupCodeManual, setOffGroupCodeManual] = useState(false);
  const [offCohortId, setOffCohortId] = useState('');
  const [offSectionId, setOffSectionId] = useState('');
  const [offEnrolledCount, setOffEnrolledCount] = useState('28');
  const [offProfessorId, setOffProfessorId] = useState('');
  const [offClassroomId, setOffClassroomId] = useState('');
  const [offSessions, setOffSessions] = useState<DraftModalSession[]>([
    { id: 'sess_1', dayOfWeek: 'saturday', slotIds: [], slotParts: {} },
  ]);
  const [offSplitPart, setOffSplitPart] = useState<'full' | 'theory' | 'practical'>('full');
  const [offInternshipSessionRole, setOffInternshipSessionRole] =
    useState<SchedInternshipSessionRole>('combined');
  const [offInternshipSchoolOnlyFull, setOffInternshipSchoolOnlyFull] = useState(false);
  const [offInternshipSubLabel, setOffInternshipSubLabel] = useState('');
  const [offInternshipGroups, setOffInternshipGroups] = useState<
    Array<{ id: string; label: string; studentCount: number; professorId: string }>
  >([]);
  const [offSharedTargets, setOffSharedTargets] = useState<SchedSharedTarget[]>([]);
  const [offNotes, setOffNotes] = useState('');
  const [offExamDayId, setOffExamDayId] = useState('');
  const [offExamSlotId, setOffExamSlotId] = useState('');
  const [offIsDisabled, setOffIsDisabled] = useState(false);
  const [offDisabledReason, setOffDisabledReason] = useState('');
  const [sharePickerCohortId, setSharePickerCohortId] = useState('');
  const [sharePickerSectionId, setSharePickerSectionId] = useState('');

  const modalAvailableMajors = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of uniqueMajors) {
      const code = normalizeMajorCode(m.majorCode) || m.majorCode;
      if (code) map.set(code, m.majorName);
    }
    for (const am of approvedMajors) {
      const code = normalizeMajorCode(am.code);
      if (code && !map.has(code)) map.set(code, am.name);
    }
    const list = Array.from(map.entries())
      .map(([majorCode, majorName]) => ({ majorCode, majorName }))
      .sort((a, b) => a.majorName.localeCompare(b.majorName, 'fa'));
    if (canManageMasterData || allowCrossMajorView || normalizedAllowedMajors.length === 0) {
      return list;
    }
    return list.filter((m) => isOwnMajorName(m.majorName));
  }, [uniqueMajors, approvedMajors, canManageMasterData, allowCrossMajorView, normalizedAllowedMajors]);

  const cohortsForSelectedMajor = useMemo(() => {
    const targetCode = normalizeMajorCode(offMajorCode);
    if (!targetCode) return programs;
    return programs.filter((p) => normalizeMajorCode(p.majorCode) === targetCode);
  }, [programs, offMajorCode]);

  const [termCoursesCohortId, setTermCoursesCohortId] = useState<string>('');
  const [termCoursesSearch, setTermCoursesSearch] = useState('');
  const [termCoursesTypeFilter, setTermCoursesTypeFilter] = useState<'all' | SchedCourseType>('all');
  const [termCoursesPlanTerm, setTermCoursesPlanTerm] = useState<EightTermKey>('1');

  const visibleCohortsForWorkspace = useMemo(() => {
    const sorted = [...programs].sort((a, b) => {
      const mc = a.majorName.localeCompare(b.majorName, 'fa');
      if (mc !== 0) return mc;
      return b.entryTerm.localeCompare(a.entryTerm);
    });
    if (canManageMasterData || allowCrossMajorView || normalizedAllowedMajors.length === 0) {
      return sorted;
    }
    return sorted.filter((p) => isOwnMajorName(p.majorName));
  }, [programs, canManageMasterData, allowCrossMajorView, normalizedAllowedMajors]);

  const activeTermCoursesCohort = useMemo(() => {
    return (
      visibleCohortsForWorkspace.find((p) => p.id === termCoursesCohortId) ||
      visibleCohortsForWorkspace[0] ||
      null
    );
  }, [visibleCohortsForWorkspace, termCoursesCohortId]);

  useEffect(() => {
    if (!activeTermCoursesCohort) return;
    setTermCoursesPlanTerm(
      estimateCohortCurrentSemester(activeTermCoursesCohort.entryTerm, activeTerm)
    );
  }, [activeTermCoursesCohort?.id, activeTerm]);

  const setCohortTermSelectedCourseCodes = (cohort: SchedProgramCohort, nextCodes: string[]) => {
    const lockCheck = checkScheduleEditLock(rules, userRole, actor.id, {
      majorCode: cohort.majorCode,
    });
    if (lockCheck.locked) {
      notify('error', lockCheck.reason || 'امکان تغییر دروس قابل ارائه این رشته مسدود شده است.');
      return;
    }
    const cleanUnique = Array.from(
      new Set(nextCodes.map((c) => normalizeSchedCode(c)).filter(Boolean))
    );
    const currentTermMap = rules.termOfferedCoursesByCohort?.[activeTerm] || {};
    const nextRules: SchedRulesSettings = {
      ...rules,
      termOfferedCoursesByCohort: {
        ...(rules.termOfferedCoursesByCohort || {}),
        [activeTerm]: {
          ...currentTermMap,
          [cohort.id]: cleanUnique,
        },
      },
    };
    persistRules(nextRules);
  };

  const coursesForSelectedMajor = useMemo(() => {
    const targetCode = normalizeMajorCode(offMajorCode);
    if (!targetCode) return [];
    return courses.filter((c) => normalizeMajorCode(c.majorCode) === targetCode);
  }, [courses, offMajorCode]);

  const selectedTermCourseState = useMemo(() => {
    if (!offMajorCode || !offCohortId) {
      return {
        majorCourses: coursesForSelectedMajor,
        selectedCourses: [] as SchedCurriculumCourse[],
        selectedCourseCodes: [] as string[],
        hasExplicitSelection: false,
      };
    }
    return getSelectedTermCoursesForCohort({
      termKey: activeTerm,
      cohortId: offCohortId,
      majorCode: offMajorCode,
      allCourses: courses,
      rules,
    });
  }, [activeTerm, offCohortId, offMajorCode, courses, rules, coursesForSelectedMajor]);

  const modalSelectableCourses = useMemo(() => {
    const selected = selectedTermCourseState.selectedCourses;
    if (!editingOffId) return selected;
    const editingOriginal = offerings.find((x) => x.id === editingOffId);
    const existingCourse =
      courses.find((c) => c.id === offCourseId) ||
      (editingOriginal ? courses.find((c) => c.id === editingOriginal.courseId) : undefined);
    if (existingCourse && !selected.some((c) => c.id === existingCourse.id)) {
      return [existingCourse, ...selected];
    }
    return selected;
  }, [selectedTermCourseState.selectedCourses, editingOffId, offerings, courses, offCourseId]);

  const selectedOffCourse = useMemo(
    () => courses.find((c) => c.id === offCourseId),
    [courses, offCourseId]
  );

  // پیشنهاد خودکار کد گروه دو رقمی گلستان بر اساس تعداد دفعات ثبت کد درس ۷ رقمی در کل برنامه جامع ترم
  const golestanGroupSuggestion = useMemo(() => {
    if (!selectedOffCourse) return null;
    return getNextGolestanCourseGroupInfo(
      selectedOffCourse.courseCode,
      termOfferings,
      editingOffId || undefined
    );
  }, [selectedOffCourse, termOfferings, editingOffId]);

  useEffect(() => {
    if (!offModalOpen || editingOffId || offGroupCodeManual || !golestanGroupSuggestion) return;
    setOffCourseGroupCode(golestanGroupSuggestion.nextGroupCode);
  }, [offModalOpen, editingOffId, offGroupCodeManual, golestanGroupSuggestion]);

  const duplicateGroupConflictOffering = useMemo(() => {
    if (!offModalOpen || !selectedOffCourse) return undefined;
    const normGrp = normalizeCourseGroupCode(offCourseGroupCode);
    if (!normGrp) return undefined;
    return findDuplicateGolestanGroupOffering(
      selectedOffCourse.courseCode,
      normGrp,
      termOfferings,
      editingOffId || undefined
    );
  }, [offModalOpen, selectedOffCourse, offCourseGroupCode, termOfferings, editingOffId]);

  // رشته‌ها/ورودی‌هایی که دقیقاً همین کد ۷ رقمی درس را در سرفصل خود دارند (یا برای مشترک‌سازی مجاز هستند)
  const matchingCourseMajorCodes = useMemo(() => {
    if (!selectedOffCourse) return new Set<string>();
    const clean = normalizeSchedCode(selectedOffCourse.courseCode);
    const set = new Set<string>();
    courses
      .filter((c) => normalizeSchedCode(c.courseCode) === clean)
      .forEach((c) => set.add(c.majorCode));
    return set;
  }, [courses, selectedOffCourse]);

  const initInternshipGroupsForCourse = (
    crs: SchedCurriculumCourse | undefined,
    enrolled: number,
    profId = ''
  ) => {
    if (crs?.practicalType === 'internship') {
      const cap = rules.equivalentPerUnit.internshipMinStudents || 12;
      const plan = computeInternshipSplitPlan(enrolled, cap);
      setOffInternshipGroups(
        plan.map((g, idx) => ({
          id: `ig_${Date.now()}_${idx}`,
          label: g.label,
          studentCount: g.studentCount,
          professorId: profId,
        }))
      );
    } else {
      setOffInternshipGroups([]);
    }
  };

  const openNewOfferingModal = (
    presetDayOrOpts?:
      | SchedDayKey
      | {
          cohortId?: string;
          sectionId?: string;
          dayOfWeek?: SchedDayKey;
          slotId?: string;
          slotHalf?: SchedSlotHalf;
        },
    presetSlotIdArg?: string
  ) => {
    const opts =
      typeof presetDayOrOpts === 'object' && presetDayOrOpts !== null
        ? presetDayOrOpts
        : { dayOfWeek: presetDayOrOpts, slotId: presetSlotIdArg };

    const targetCohort = opts.cohortId
      ? programs.find((p) => p.id === opts.cohortId)
      : undefined;

    const lockCheck = checkScheduleEditLock(rules, userRole, actor.id, {
      majorCode: targetCohort?.majorCode,
      dayOfWeek: opts.dayOfWeek,
      slotIds: opts.slotId ? [opts.slotId] : undefined,
    });
    if (lockCheck.locked) {
      notify('error', lockCheck.reason || 'امکان ثبت تغییر در این بخش مسدود شده است.');
      return;
    }

    const fallbackCohort =
      targetCohort ||
      programs.find((p) =>
        canManageMasterData || allowCrossMajorView || isOwnMajorName(p.majorName)
      ) ||
      programs[0];

    const resolvedMajorCode =
      normalizeMajorCode(fallbackCohort?.majorCode) ||
      modalAvailableMajors[0]?.majorCode ||
      '';

    const majorCohorts = programs.filter(
      (p) => normalizeMajorCode(p.majorCode) === resolvedMajorCode
    );
    const matchingCohort = targetCohort || majorCohorts[0] || fallbackCohort;

    const cohortTermCourses = matchingCohort
      ? getSelectedTermCoursesForCohort({
          termKey: activeTerm,
          cohortId: matchingCohort.id,
          majorCode: resolvedMajorCode,
          allCourses: courses,
          rules,
        }).selectedCourses
      : [];
    const firstCourse = cohortTermCourses[0];

    const matchingSec = opts.sectionId
      ? matchingCohort?.sections.find((s) => s.id === opts.sectionId)
      : matchingCohort?.sections[0];

    const baseEnrolled =
      matchingSec?.studentCount || matchingCohort?.totalStudents || 28;
    const initSlotId = opts.slotId || sortedSlots[0]?.id || '';
    const initHalf: SchedSlotHalf = opts.slotHalf || 'full';
    const initGroup = firstCourse
      ? getNextGolestanCourseGroupInfo(firstCourse.courseCode, termOfferings).nextGroupCode
      : '01';

    setEditingOffId(null);
    setOffMajorCode(resolvedMajorCode);
    setOffCourseId(firstCourse?.id || '');
    setOffCourseGroupCode(initGroup);
    setOffGroupCodeManual(false);
    setOffCohortId(matchingCohort?.id || '');
    setOffSectionId(matchingSec?.id || '');
    setOffEnrolledCount(String(baseEnrolled));
    setOffProfessorId('');
    setOffClassroomId('');
    setOffSessions([
      {
        id: 'sess_1',
        dayOfWeek: opts.dayOfWeek || activeDays[0] || 'saturday',
        slotIds: initSlotId ? [initSlotId] : [],
        slotParts: initSlotId ? { [initSlotId]: initHalf } : {},
      },
    ]);
    setOffSplitPart('full');
    setOffInternshipSessionRole('combined');
    setOffInternshipSchoolOnlyFull(false);
    setOffInternshipSubLabel('');
    initInternshipGroupsForCourse(firstCourse, baseEnrolled, '');
    setOffSharedTargets([]);
    setOffNotes('');
    setOffExamDayId('');
    setOffExamSlotId('');
    setOffIsDisabled(false);
    setOffDisabledReason('');
    setSharePickerCohortId('');
    setSharePickerSectionId('');
    setOffModalOpen(true);
  };

  const openEditOfferingModal = (o: SchedCourseOffering) => {
    const matchingCohort = programs.find((p) => p.id === o.cohortId);
    const matchingCourse = courses.find((c) => c.id === o.courseId);
    const resolvedMajorCode =
      normalizeMajorCode(o.ownerMajorCode) ||
      normalizeMajorCode(matchingCohort?.majorCode) ||
      normalizeMajorCode(matchingCourse?.majorCode) ||
      '';
    const existingSessions = getOfferingSessions(o);
    const loadedSessions: DraftModalSession[] =
      existingSessions.length > 0
        ? existingSessions.map((s, idx) => {
            const parts: Record<string, SchedSlotHalf> = {};
            s.slotIds.forEach((sid) => {
              parts[sid] = s.slotParts?.[sid] || 'full';
            });
            return {
              id: s.id || `sess_${idx + 1}`,
              dayOfWeek: s.dayOfWeek,
              slotIds: [...s.slotIds],
              slotParts: parts,
              classroomId: s.classroomId && s.classroomId !== o.classroomId ? s.classroomId : undefined,
            };
          })
        : [
            {
              id: 'sess_1',
              dayOfWeek: o.dayOfWeek || '',
              slotIds: [],
              slotParts: {},
            },
          ];

    const normExistingGroup = normalizeCourseGroupCode(o.courseGroupCode);
    const fallbackNextGroup = getNextGolestanCourseGroupInfo(
      o.courseCode,
      termOfferings,
      o.id
    ).nextGroupCode;

    setEditingOffId(o.id);
    setOffMajorCode(resolvedMajorCode);
    setOffCourseId(o.courseId);
    setOffCourseGroupCode(normExistingGroup || fallbackNextGroup);
    setOffGroupCodeManual(Boolean(normExistingGroup));
    setOffCohortId(o.cohortId);
    setOffSectionId(o.sectionId || '');
    setOffEnrolledCount(String(o.enrolledCount));
    setOffProfessorId(o.professorId || '');
    setOffClassroomId(o.classroomId || '');
    setOffSessions(loadedSessions);
    setOffSplitPart(o.splitPart || 'full');
    setOffInternshipSessionRole(o.internshipSessionRole || 'combined');
    setOffInternshipSchoolOnlyFull(Boolean(o.internshipSchoolOnlyFull));
    setOffInternshipSubLabel(o.internshipSubGroupLabel || '');
    setOffInternshipGroups([]);
    setOffSharedTargets([...(o.sharedWithTargets || [])]);
    setOffNotes(o.notes || '');
    setOffExamDayId(o.examDayId || '');
    setOffExamSlotId(o.examSlotId || '');
    setOffIsDisabled(Boolean(o.isDisabled));
    setOffDisabledReason(o.disabledReason || '');
    setSharePickerCohortId('');
    setSharePickerSectionId('');
    setOffModalOpen(true);
  };

  // پیش‌نمایش زنده تداخل‌ها و واحد معادل در مودال ثبت درس
  const candidateOffering = useMemo<SchedCourseOffering | null>(() => {
    if (!offModalOpen || !selectedOffCourse) return null;
    const cohort = programs.find((p) => p.id === offCohortId);
    if (!cohort) return null;
    const sec = cohort.sections.find((s) => s.id === offSectionId);
    const prof = professors.find((p) => p.id === offProfessorId);
    const isSchoolOnlyInternship =
      selectedOffCourse.practicalType === 'internship' &&
      (offInternshipSessionRole === 'school_attendance' ||
        (offInternshipSessionRole === 'combined' && offInternshipSchoolOnlyFull));
    const room = isSchoolOnlyInternship
      ? undefined
      : classrooms.find((r) => r.id === offClassroomId);
    const enrolled = Math.max(1, Number(normalizeSchedCode(offEnrolledCount)) || 1);
    const bd = calculateOfferingBreakdown(
      {
        theoreticalUnits: selectedOffCourse.theoreticalUnits,
        practicalUnits: selectedOffCourse.practicalUnits,
        practicalType: selectedOffCourse.practicalType,
        splitPart: offSplitPart,
        enrolledCount: enrolled,
      },
      rules
    );

    const resolvedSessions: SchedOfferingSession[] = offSessions
      .filter((s) => Boolean(s.dayOfWeek))
      .map((s, idx) => {
        const sessRoom = isSchoolOnlyInternship
          ? undefined
          : s.classroomId
          ? classrooms.find((r) => r.id === s.classroomId)
          : room;
        const cleanParts: Record<string, SchedSlotHalf> = {};
        s.slotIds.forEach((sid) => {
          const h = s.slotParts?.[sid];
          if (h && h !== 'full') cleanParts[sid] = h;
        });
        return {
          id: s.id || `sess_${idx + 1}`,
          dayOfWeek: s.dayOfWeek as SchedDayKey,
          slotIds: [...s.slotIds],
          slotParts: Object.keys(cleanParts).length > 0 ? cleanParts : undefined,
          classroomId: sessRoom?.id,
          classroomName: sessRoom?.name,
        };
      });

    const primarySess = resolvedSessions[0];
    const normGroup = normalizeCourseGroupCode(offCourseGroupCode);

    return {
      id: editingOffId || 'draft_preview',
      termKey: activeTerm,
      courseId: selectedOffCourse.id,
      courseCode: selectedOffCourse.courseCode,
      courseGroupCode: normGroup || undefined,
      courseTitle: selectedOffCourse.title,
      courseType: selectedOffCourse.courseType,
      practicalType: selectedOffCourse.practicalType,
      theoreticalUnits: selectedOffCourse.theoreticalUnits,
      practicalUnits: selectedOffCourse.practicalUnits,
      weeklyHours: bd.weeklyHours,
      ownerMajorCode: cohort.majorCode,
      ownerMajorName: cohort.majorName,
      cohortId: cohort.id,
      entryTerm: cohort.entryTerm,
      sectionId: sec?.id,
      sectionName: sec?.name,
      enrolledCount: enrolled,
      internshipSubGroupLabel: offInternshipSubLabel.trim() || undefined,
      sharedWithTargets: offSharedTargets.length > 0 ? offSharedTargets : undefined,
      professorId: prof?.id,
      professorCode: prof?.professorCode,
      professorName: prof?.fullName,
      classroomId: room?.id,
      classroomName: room?.name,
      dayOfWeek: primarySess?.dayOfWeek,
      slotIds: primarySess ? [...primarySess.slotIds] : [],
      slotParts: primarySess?.slotParts,
      sessions: resolvedSessions,
      splitPart: offSplitPart,
      internshipSessionRole:
        selectedOffCourse.practicalType === 'internship' ? offInternshipSessionRole : undefined,
      internshipSchoolOnlyFull:
        selectedOffCourse.practicalType === 'internship' &&
        offInternshipSessionRole === 'combined' &&
        offInternshipSchoolOnlyFull
          ? true
          : undefined,
      examDayId:
        isCourseEligibleForExam(selectedOffCourse) && offExamDayId && offExamSlotId
          ? offExamDayId
          : undefined,
      examSlotId:
        isCourseEligibleForExam(selectedOffCourse) && offExamDayId && offExamSlotId
          ? offExamSlotId
          : undefined,
      notes: offNotes.trim() || undefined,
      isDisabled: !prof?.id && offIsDisabled ? true : undefined,
      disabledReason:
        !prof?.id && offIsDisabled ? offDisabledReason.trim() || undefined : undefined,
      createdById: actor.id,
      createdByName: actor.name,
      createdByRole: userRole,
      updatedById: actor.id,
      updatedByName: actor.name,
      updatedAt: new Date().toISOString(),
    };
  }, [
    offModalOpen,
    selectedOffCourse,
    programs,
    offCohortId,
    offSectionId,
    professors,
    offProfessorId,
    classrooms,
    offClassroomId,
    offCourseGroupCode,
    offEnrolledCount,
    offInternshipSubLabel,
    offInternshipSessionRole,
    offInternshipSchoolOnlyFull,
    offSplitPart,
    rules,
    editingOffId,
    activeTerm,
    offSharedTargets,
    offSessions,
    offNotes,
    offExamDayId,
    offExamSlotId,
    offIsDisabled,
    offDisabledReason,
    actor,
    userRole,
  ]);

  const modalLockStatus = useMemo(() => {
    if (!offModalOpen) return { locked: false };
    const cohort = programs.find((p) => p.id === offCohortId);
    const originalOff = editingOffId ? offerings.find((x) => x.id === editingOffId) : undefined;
    const origCheck = originalOff
      ? checkScheduleEditLock(rules, userRole, actor.id, {
          majorCode: originalOff.ownerMajorCode,
          dayOfWeek: originalOff.dayOfWeek,
          slotIds: originalOff.slotIds,
          sessions: getOfferingSessions(originalOff),
        })
      : { locked: false };
    if (origCheck.locked) return origCheck;
    return checkScheduleEditLock(rules, userRole, actor.id, {
      majorCode: cohort?.majorCode,
      sessions: offSessions
        .filter((s) => Boolean(s.dayOfWeek))
        .map((s) => ({ dayOfWeek: s.dayOfWeek as SchedDayKey, slotIds: s.slotIds })),
    });
  }, [offModalOpen, programs, offCohortId, editingOffId, offerings, rules, userRole, actor.id, offSessions]);

  const candidateConflictReport = useMemo(() => {
    if (!offModalOpen || !candidateOffering) return { hasHardConflict: false, errors: [], warnings: [] };
    const probe: SchedCourseOffering = {
      ...candidateOffering,
      isDisabled: false,
      isProvisional: false,
    };
    return detectOfferingConflicts(
      probe,
      termOfferings,
      classrooms,
      professors,
      rules,
      termSchedulingIndex
    );
  }, [offModalOpen, candidateOffering, termOfferings, classrooms, professors, rules, termSchedulingIndex]);

  const candidateBreakdown = useMemo(() => {
    if (!candidateOffering) return null;
    return calculateOfferingBreakdown(candidateOffering, rules);
  }, [candidateOffering, rules]);

  const candidateCompleteness = useMemo(() => {
    if (!candidateOffering) return null;
    return evaluateOfferingCompleteness(
      {
        ...candidateOffering,
        isDisabled: false,
        isProvisional: false,
      },
      rules
    );
  }, [candidateOffering, rules]);

  const getModalSessionFreeRooms = (targetSessions: DraftModalSession[]) => {
    const enrolled = Math.max(1, Number(normalizeSchedCode(offEnrolledCount)) || 1);
    const activeRooms = classrooms.filter((r) => r.isActive);
    const validSess = targetSessions.filter((s) => Boolean(s.dayOfWeek) && s.slotIds.length > 0);
    const evaluated = activeRooms.map((r) => {
      const check = checkClassroomAvailabilityForSessions(
        r.id,
        activeTerm,
        validSess.map((s) => ({
          dayOfWeek: s.dayOfWeek as SchedDayKey,
          slotIds: s.slotIds,
          slotParts: s.slotParts,
        })),
        termOfferings,
        editingOffId || undefined
      );
      return {
        room: r,
        isFree: check.isFree,
        occupiedBy: check.occupiedBy,
        capOk: r.capacity >= enrolled,
      };
    });
    return {
      totalActiveCount: activeRooms.length,
      evaluated,
      freeRooms: evaluated
        .filter((item) => item.isFree)
        .sort((a, b) => {
          if (a.capOk !== b.capOk) return Number(b.capOk) - Number(a.capOk);
          return a.room.capacity - b.room.capacity;
        }),
    };
  };

  const modalClassroomAvailability = useMemo(() => {
    if (!offModalOpen) {
      return {
        totalActiveCount: classrooms.filter((r) => r.isActive).length,
        freeRooms: [] as Array<{
          room: SchedClassroom;
          isFree: boolean;
          occupiedBy?: SchedCourseOffering;
          capOk: boolean;
        }>,
        selectedOccupiedItem: undefined,
      };
    }
    const enrolled = Math.max(1, Number(normalizeSchedCode(offEnrolledCount)) || 1);
    const activeRooms = classrooms.filter((r) => r.isActive);
    // جلساتی که از کلاس اصلی استفاده می‌کنند (بدون کلاس اختصاصی جداگانه در سطح جلسه)
    const sessionsUsingPrimaryRoom = offSessions.filter(
      (s) => Boolean(s.dayOfWeek) && s.slotIds.length > 0 && !s.classroomId
    );
    const evaluated = activeRooms.map((r) => {
      const check = checkClassroomAvailabilityForSessions(
        r.id,
        activeTerm,
        sessionsUsingPrimaryRoom.map((s) => ({
          dayOfWeek: s.dayOfWeek as SchedDayKey,
          slotIds: s.slotIds,
          slotParts: s.slotParts,
        })),
        termOfferings,
        editingOffId || undefined
      );
      return {
        room: r,
        isFree: check.isFree,
        occupiedBy: check.occupiedBy,
        capOk: r.capacity >= enrolled,
      };
    });
    const freeRooms = evaluated
      .filter((item) => item.isFree)
      .sort((a, b) => {
        if (a.capOk !== b.capOk) return Number(b.capOk) - Number(a.capOk);
        return a.room.capacity - b.room.capacity;
      });
    const selectedItem = offClassroomId
      ? evaluated.find((item) => item.room.id === offClassroomId)
      : undefined;
    return {
      totalActiveCount: activeRooms.length,
      freeRooms,
      selectedOccupiedItem:
        selectedItem && !selectedItem.isFree ? selectedItem : undefined,
    };
  }, [
    offModalOpen,
    classrooms,
    offSessions,
    activeTerm,
    termOfferings,
    editingOffId,
    offEnrolledCount,
    offClassroomId,
  ]);

  const isMultiInternshipMode = Boolean(
    !editingOffId &&
      selectedOffCourse?.practicalType === 'internship' &&
      offInternshipGroups.length > 0
  );

  const multiInternshipMissingProfessors = useMemo(() => {
    if (!isMultiInternshipMode) return false;
    return offInternshipGroups.some((g) => !(g.professorId || offProfessorId));
  }, [isMultiInternshipMode, offInternshipGroups, offProfessorId]);

  const canFinalizeModal = useMemo(() => {
    if (!candidateOffering || !candidateCompleteness) return false;
    if (modalLockStatus.locked) return false;
    if (isMultiInternshipMode) {
      return (
        candidateCompleteness.checklist.hasDayAndSlots &&
        candidateCompleteness.checklist.hoursExact &&
        (!candidateCompleteness.checklist.classroomRequired ||
          candidateCompleteness.checklist.hasClassroom) &&
        !multiInternshipMissingProfessors
      );
    }
    return candidateCompleteness.isComplete && !candidateConflictReport.hasHardConflict;
  }, [
    candidateOffering,
    candidateCompleteness,
    modalLockStatus.locked,
    isMultiInternshipMode,
    multiInternshipMissingProfessors,
    candidateConflictReport.hasHardConflict,
  ]);

  const handleAddSharedTarget = () => {
    if (!selectedOffCourse || !sharePickerCohortId) return;
    const cohort = programs.find((p) => p.id === sharePickerCohortId);
    if (!cohort) return;
    // بررسی قانون اکید یکسان بودن کد ۷ رقمی
    if (!matchingCourseMajorCodes.has(cohort.majorCode)) {
      notify(
        'error',
        `مشترک‌سازی مجاز نیست: درس با کد ۷ رقمی «${selectedOffCourse.courseCode}» در لیست دروس رشته «${cohort.majorName} (${cohort.majorCode})» ثبت نشده است.`
      );
      return;
    }
    const sec = cohort.sections.find((s) => s.id === sharePickerSectionId);
    if (
      cohort.id === offCohortId &&
      ((!sec && !offSectionId) || sec?.id === offSectionId)
    ) {
      return;
    }
    const alreadyExists = offSharedTargets.some(
      (t) => t.cohortId === cohort.id && (t.sectionId || '') === (sec?.id || '')
    );
    if (alreadyExists) return;

    const addCount = sec ? sec.studentCount : cohort.totalStudents;
    const nextTargets: SchedSharedTarget[] = [
      ...offSharedTargets,
      {
        majorCode: cohort.majorCode,
        majorName: cohort.majorName,
        cohortId: cohort.id,
        entryTerm: cohort.entryTerm,
        sectionId: sec?.id,
        sectionName: sec?.name,
        studentCount: addCount,
      },
    ];
    setOffSharedTargets(nextTargets);
    setOffEnrolledCount(String((Number(normalizeSchedCode(offEnrolledCount)) || 0) + addCount));
    setSharePickerCohortId('');
    setSharePickerSectionId('');
  };

  const commitOfferingModalSave = (mode: 'final' | 'provisional') => {
    if (!candidateOffering || !candidateCompleteness) return;

    if (modalLockStatus.locked) {
      notify('error', modalLockStatus.reason || 'امکان ذخیره تغییر در این برنامه مسدود شده است.');
      return;
    }

    const normalizedBase = normalizeOfferingWithSessions(candidateOffering);

    // حالت ثبت چند شعبه کارورزی (مثلاً تقسیم ۲۴ نفر به دو شعبه ۱۲ نفره)
    if (isMultiInternshipMode && selectedOffCourse) {
      const created: SchedCourseOffering[] = [];
      let workingTerm = [...termOfferings];
      for (let i = 0; i < offInternshipGroups.length; i++) {
        const grp = offInternshipGroups[i];
        const grpProf =
          professors.find((p) => p.id === (grp.professorId || offProfessorId)) || undefined;
        const grpBd = calculateOfferingBreakdown(
          {
            theoreticalUnits: selectedOffCourse.theoreticalUnits,
            practicalUnits: selectedOffCourse.practicalUnits,
            practicalType: selectedOffCourse.practicalType,
            splitPart: offSplitPart,
            enrolledCount: Math.max(1, grp.studentCount || 1),
          },
          rules
        );
        const suggestedGroup =
          i === 0 && normalizeCourseGroupCode(normalizedBase.courseGroupCode)
            ? normalizeCourseGroupCode(normalizedBase.courseGroupCode)
            : getNextGolestanCourseGroupInfo(selectedOffCourse.courseCode, workingTerm).nextGroupCode;
        const draftItem: SchedCourseOffering = normalizeOfferingWithSessions({
          ...normalizedBase,
          id: `off_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
          courseGroupCode: suggestedGroup,
          enrolledCount: Math.max(1, grp.studentCount || 1),
          weeklyHours: grpBd.weeklyHours,
          internshipSubGroupLabel: grp.label.trim() || `شعبه ${i + 1} کارورزی`,
          professorId: grpProf?.id,
          professorCode: grpProf?.professorCode,
          professorName: grpProf?.fullName,
          isDisabled: false,
          isProvisional: false,
          disabledReason: undefined,
          updatedById: actor.id,
          updatedByName: actor.name,
          updatedAt: new Date().toISOString(),
        });
        const grpComp = evaluateOfferingCompleteness(draftItem, rules);
        if (mode === 'final' && !grpComp.isComplete) {
          notify(
            'error',
            `برای ثبت نهایی «${draftItem.internshipSubGroupLabel}» نواقص زیر را برطرف کنید یا از «ثبت موقت» استفاده نمایید: ${grpComp.missingItems[0]}`
          );
          return;
        }
        if (mode === 'final') {
          const rep = detectOfferingConflicts(draftItem, workingTerm, classrooms, professors, rules);
          if (rep.hasHardConflict) {
            notify('error', `تداخل در ${draftItem.internshipSubGroupLabel}: ${rep.errors[0]}`);
            return;
          }
        }
        const finalItem: SchedCourseOffering =
          mode === 'provisional' || !grpComp.isComplete
            ? {
                ...draftItem,
                isProvisional: true,
                isDisabled: true,
                disabledReason: grpComp.missingItems.join(' | ') || 'ثبت موقت (ناقص)',
              }
            : draftItem;

        created.push(finalItem);
        workingTerm.push(finalItem);
      }
      commitOfferingsWithHistory(
        [...offerings, ...created],
        `${mode === 'provisional' ? 'ثبت موقت' : 'ثبت نهایی'} ${created.length} شعبه کارورزی «${selectedOffCourse.title}»`
      );
      notify(
        'success',
        mode === 'provisional'
          ? `${created.length} شعبه کارورزی برای درس «${selectedOffCourse.title}» به صورت موقت و غیرفعال ذخیره شد.`
          : `${created.length} شعبه کارورزی برای درس «${selectedOffCourse.title}» با موفقیت ثبت نهایی شد.`
      );
      setOffModalOpen(false);
      return;
    }

    if (mode === 'final') {
      if (!candidateCompleteness.isComplete) {
        notify(
          'error',
          `برای ثبت نهایی درس باید ساعت ارائه، استاد و کلاس تکمیل باشد: ${candidateCompleteness.missingItems.join(' • ')}`
        );
        return;
      }
      if (candidateConflictReport.hasHardConflict) {
        notify('error', 'به دلیل وجود تداخل زمانی قطعی امکان ثبت نهایی وجود ندارد. تداخل را برطرف نمایید.');
        return;
      }
    }

    const isProvSave = mode === 'provisional' || !candidateCompleteness.isComplete;
    const autoGroupCode =
      normalizeCourseGroupCode(normalizedBase.courseGroupCode) ||
      getNextGolestanCourseGroupInfo(
        normalizedBase.courseCode,
        termOfferings,
        editingOffId || undefined
      ).nextGroupCode;

    const saved: SchedCourseOffering = {
      ...normalizedBase,
      id: editingOffId || `off_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      courseGroupCode: autoGroupCode,
      isProvisional: isProvSave ? true : undefined,
      isDisabled: isProvSave ? true : undefined,
      disabledReason: isProvSave
        ? candidateCompleteness.missingItems.join(' | ') || 'ثبت موقت در انتظار تکمیل'
        : undefined,
      updatedById: actor.id,
      updatedByName: actor.name,
      updatedAt: new Date().toISOString(),
    };

    const codeLabel = formatGolestanCourseCode(saved.courseCode, saved.courseGroupCode);
    if (editingOffId) {
      commitOfferingsWithHistory(
        offerings.map((o) => (o.id === editingOffId ? saved : o)),
        `${isProvSave ? 'ذخیره موقت' : 'ثبت نهایی و ویرایش'} درس «${saved.courseTitle}» (${codeLabel})`
      );
      notify(
        'success',
        isProvSave
          ? `درس «${saved.courseTitle}» (${codeLabel}) به صورت موقت ذخیره شد.`
          : `برنامه درس «${saved.courseTitle}» (${codeLabel}) با موفقیت ثبت نهایی شد.`
      );
    } else {
      commitOfferingsWithHistory(
        [...offerings, saved],
        `${isProvSave ? 'ثبت موقت' : 'ثبت نهایی'} درس «${saved.courseTitle}» (${codeLabel})`
      );
      notify(
        'success',
        isProvSave
          ? `درس «${saved.courseTitle}» (${codeLabel}) به صورت موقت در جدول ثبت شد؛ با تکمیل ساعت، استاد و کلاس نهایی خواهد شد.`
          : `درس «${saved.courseTitle}» (${codeLabel}) با موفقیت در برنامه ترم ${activeTerm} ثبت نهایی شد.`
      );
    }
    setOffModalOpen(false);
  };

  const handleSaveOffering = (e: React.FormEvent) => {
    e.preventDefault();
    commitOfferingModalSave('final');
  };

  // =====================================================
  // بخش تنظیمات و ضرایب
  // =====================================================
  const [draftRules, setDraftRules] = useState<SchedRulesSettings>(rules);
  React.useEffect(() => {
    setDraftRules(rules);
  }, [rules]);

  const pendingProfProposalsCount = useMemo(
    () => professorProposals.filter((p) => p.status === 'pending').length,
    [professorProposals]
  );
  const tempCodedProfsCount = useMemo(
    () => professors.filter((p) => isTemporaryProfessorCode(p.professorCode)).length,
    [professors]
  );

  if (!isOpen) return null;

  const sidebarGroups: Array<{
    groupTitle: string;
    items: Array<{
      key: WorkspaceSection;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      badge?: string;
    }>;
  }> = [
    {
      groupTitle: 'برنامه‌ریزی و گزارش‌ها',
      items: [
        { key: 'overview', label: 'نمای کلی و وضعیت ترم', icon: LayoutDashboard },
        {
          key: 'term_courses',
          label: 'دروس قابل ارائه ترم (از سرفصل)',
          icon: ListChecks,
          badge: String(
            visibleCohortsForWorkspace.filter((coh) => {
              const sel = rules.termOfferedCoursesByCohort?.[activeTerm]?.[coh.id];
              return Array.isArray(sel) && sel.length > 0;
            }).length
          ),
        },
        {
          key: 'master_grid',
          label: 'برنامه جامع و فراگیر (کل رشته‌ها)',
          icon: LayoutGrid,
          badge: String(termOfferings.length),
        },
        {
          key: 'schedule',
          label: 'ثبت دروس و برنامه هفتگی',
          icon: CalendarDays,
          badge: String(termOfferings.length),
        },
        { key: 'auto_wizard', label: 'ویزارد چینش هوشمند', icon: Sparkles },
        { key: 'reports', label: 'گزارش‌گیری و فیلتر جامع', icon: FileSpreadsheet },
        ...(!isSystemAdmin
          ? [
              {
                key: 'professor_requests' as WorkspaceSection,
                label: 'درخواست ثبت استاد جدید',
                icon: UserPlus,
                badge:
                  pendingProfProposalsCount > 0
                    ? String(pendingProfProposalsCount)
                    : undefined,
              },
            ]
          : []),
      ],
    },
    ...(isSystemAdmin
      ? [
          {
            groupTitle: 'تنظیمات برنامه (فقط مدیر سامانه)',
            items: [
              { key: 'rules' as WorkspaceSection, label: 'قوانین، سانس‌ها و دانشجویان', icon: Settings2 },
              {
                key: 'locks' as WorkspaceSection,
                label: 'مسدودسازی و قفل برنامه',
                icon: Lock,
                badge: rules.programLocks?.lockAllChanges ? 'قفل' : undefined,
              },
              {
                key: 'classrooms' as WorkspaceSection,
                label: 'کلاس‌های فیزیکی',
                icon: Building2,
                badge: String(classrooms.length),
              },
              {
                key: 'programs' as WorkspaceSection,
                label: 'رشته‌ها، ورودی‌ها و شعب',
                icon: Layers,
                badge: String(programs.length),
              },
              {
                key: 'professors' as WorkspaceSection,
                label: 'اساتید، درخواست‌ها و عدم حضور',
                icon: Users,
                badge:
                  pendingProfProposalsCount > 0
                    ? `${professors.length} (${pendingProfProposalsCount} جدید)`
                    : String(professors.length),
              },
              {
                key: 'courses' as WorkspaceSection,
                label: 'لیست دروس (کد ۷ رقمی)',
                icon: BookOpen,
                badge: String(courses.length),
              },
            ],
          },
        ]
      : []),
  ];

  const isAdminSettingsSection =
    section === 'rules' ||
    section === 'locks' ||
    section === 'classrooms' ||
    section === 'programs' ||
    section === 'professors' ||
    section === 'courses';

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
      {/* هدر ثابت تمام‌صفحه */}
      <header className="shrink-0 bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-600/20 border border-teal-500/30 text-teal-300">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>حوزه معاونت آموزشی</span>
              <span>·</span>
              <span className="text-teal-300 font-bold">
                {userRole === 'admin'
                  ? 'مدیر کل سامانه'
                  : userRole === 'academic_deputy'
                  ? 'معاونت آموزشی'
                  : userRole === 'education_expert'
                  ? `کارشناس آموزش${allowedMajorNames.length > 0 ? ` (${allowedMajorNames.join('، ')})` : ''}`
                  : `مدیر گروه آموزشی${allowedMajorNames.length > 0 ? ` (${allowedMajorNames.join('، ')})` : ''}`}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-black text-white">
              سامانه جامع برنامه‌ریزی درسی، زمان‌بندی کلاسی و گزارش‌گیری آموزشی
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* سوئیچر ترم */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
            <span className="text-slate-400">ترم فعال:</span>
            <select
              value={activeTerm}
              onChange={(e) => {
                const nextT = e.target.value;
                setActiveTerm(nextT);
                if (isSystemAdmin) {
                  persistRules({ ...rules, activeTerm: nextT });
                }
              }}
              className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
            >
              {rules.availableTerms.map((t) => (
                <option key={t} value={t} className="bg-slate-900 text-white">
                  {t}
                </option>
              ))}
            </select>
            {isSystemAdmin && (
              <button
                type="button"
                onClick={() => setShowNewTermBox((v) => !v)}
                className="p-1 rounded-lg bg-slate-700 hover:bg-teal-600 text-white transition cursor-pointer"
                title="افزودن ترم جدید"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {showNewTermBox && isSystemAdmin && (
            <div className="flex items-center gap-1 bg-slate-800 border border-teal-500/50 rounded-xl px-2 py-1">
              <input
                type="text"
                value={newTermInput}
                onChange={(e) => setNewTermInput(e.target.value)}
                placeholder="مثلاً 4042"
                className="w-20 bg-transparent text-xs font-mono text-white focus:outline-none"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => {
                  const clean = normalizeSchedCode(newTermInput);
                  if (!clean) return;
                  const nextTerms = Array.from(new Set([...rules.availableTerms, clean]));
                  persistRules({ ...rules, availableTerms: nextTerms, activeTerm: clean });
                  setActiveTerm(clean);
                  setNewTermInput('');
                  setShowNewTermBox(false);
                }}
                className="px-2 py-1 rounded-lg bg-teal-600 text-white text-[11px] font-bold cursor-pointer"
              >
                ثبت
              </button>
            </div>
          )}

          {!viewLockStatus.locked && (
            <>
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1">
                <button
                  type="button"
                  disabled={historyState.undoStack.length === 0}
                  onClick={handleUndoOfferings}
                  title={
                    historyState.undoStack.length > 0
                      ? `بازگشت تغییر من: ${historyState.undoStack[historyState.undoStack.length - 1].label}`
                      : 'تغییری برای بازگشت توسط شما ثبت نشده است'
                  }
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-100 hover:bg-slate-700 disabled:opacity-35 inline-flex items-center gap-1 cursor-pointer transition"
                >
                  <Undo2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>بازگشت</span>
                  {historyState.undoStack.length > 0 && (
                    <span className="text-[10px] font-mono text-amber-300">
                      ({historyState.undoStack.length.toLocaleString('fa-IR')})
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  disabled={historyState.redoStack.length === 0}
                  onClick={handleRedoOfferings}
                  title={
                    historyState.redoStack.length > 0
                      ? `انجام مجدد تغییر من: ${historyState.redoStack[historyState.redoStack.length - 1].label}`
                      : 'موردی برای انجام مجدد وجود ندارد'
                  }
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-100 hover:bg-slate-700 disabled:opacity-35 inline-flex items-center gap-1 cursor-pointer transition"
                >
                  <Redo2 className="w-3.5 h-3.5 text-sky-300" />
                  <span>انجام مجدد</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setCommonExamModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="تنظیم یکجای روز و سانس امتحانات دروس مشترک و عمومی و رصد تداخل ردیف‌ها"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>برنامه امتحانات مشترک / عمومی</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAcademicChatOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="چت آنلاین دو به دو / چندنفره و تالارهای مشترک معاونت آموزش و برنامه درسی"
              >
                <MessagesSquare className="w-3.5 h-3.5" />
                <span>گفتگو و تالار برنامه درسی</span>
                {academicChatUnread > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                    {academicChatUnread.toLocaleString('fa-IR')}
                  </span>
                )}
              </button>
            </>
          )}

          {isSystemAdmin && (
            <>
              <button
                type="button"
                onClick={handleToggleDeptHeadAccess}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold border inline-flex items-center gap-1.5 cursor-pointer transition ${
                  deptHeadAccessOpen
                    ? 'bg-teal-500/20 border-teal-400/50 text-teal-200 hover:bg-teal-500/30'
                    : 'bg-amber-500/20 border-amber-400/50 text-amber-200 hover:bg-amber-500/30'
                }`}
                title="باز کردن یا بستن دسترسی مدیران گروه برای ثبت و ویرایش دروس با یک کلیک"
              >
                {deptHeadAccessOpen ? (
                  <Unlock className="w-3.5 h-3.5 text-teal-300" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>
                  مدیران گروه: {deptHeadAccessOpen ? 'باز (در حال ثبت)' : 'بسته (یک کلیک برای باز کردن)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSection('rules')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold border inline-flex items-center gap-1.5 cursor-pointer transition ${
                  rules.studentAccessEnabled
                    ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/25'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title="مدیریت انتشار برنامه ترم برای دانشجویان"
              >
                {rules.studentAccessEnabled ? (
                  <Unlock className="w-3.5 h-3.5 text-emerald-300" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>
                  برنامه دانشجویان:{' '}
                  {rules.studentAccessEnabled
                    ? rules.studentAccessScope === 'all_programs'
                      ? 'فعال (کل رشته‌ها)'
                      : rules.studentAccessScope === 'own_major'
                      ? 'فعال (رشته خودشان)'
                      : 'فعال (رشته و ورودی خودشان)'
                    : 'بسته'}
                </span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>خروج و بازگشت به پنل</span>
          </button>
        </div>
      </header>

      {/* نوار اعلان خطا / موفقیت */}
      {feedback && (
        <div
          className={`shrink-0 px-6 py-2.5 text-xs font-bold flex items-center justify-between border-b ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-70 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* بدنه اصلی: مسدودیت مشاهده یا سایدبار ساختارمند + محتوای اصلی */}
      {!isSystemAdmin && viewLockStatus.locked ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full p-7 rounded-3xl bg-white dark:bg-slate-900 border-2 border-rose-200 dark:border-rose-900 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <EyeOff className="w-7 h-7" />
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              دسترسی مشاهده و تغییر برنامه درسی مسدود شده است
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-bold">
              {viewLockStatus.reason ||
                'دسترسی مشاهده جدول برنامه جامع، استودیو و گزارش‌های این بخش برای حساب کاربری شما توسط مدیر کل سامانه محدود شده است.'}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold cursor-pointer transition"
              >
                بازگشت به پنل کاربری
              </button>
            </div>
          </div>
        </div>
      ) : (
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* منوی کناری ساختارمند */}
        <aside className="lg:w-64 shrink-0 bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-l border-slate-200 dark:border-slate-800 p-3 overflow-x-auto lg:overflow-y-auto">
          <div className="flex lg:flex-col gap-4">
            {sidebarGroups.map((grp) => (
              <div key={grp.groupTitle} className="space-y-1 min-w-[200px] lg:min-w-0">
                <div className="px-2.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500">
                  {grp.groupTitle}
                </div>
                <div className="space-y-1">
                  {grp.items.map((item) => {
                    const Icon = item.icon;
                    const active = section === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setSection(item.key)}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 transition cursor-pointer ${
                          active
                            ? 'bg-slate-900 dark:bg-teal-600 text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {item.badge !== undefined && (
                          <span
                            className={`font-mono tabular-nums text-[11px] ${
                              active ? 'text-teal-200 dark:text-white' : 'text-slate-400'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* محوطه کاری اسکرول‌پذیر */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* بنر هشدار قفل شدن ویرایش برنامه برای کاربران غیر از مدیر سامانه */}
          {!isSystemAdmin && globalLockStatus.locked && (
            <div className="max-w-7xl mx-auto p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-extrabold flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{globalLockStatus.reason}</span>
            </div>
          )}

          {/* دسترسی غیرمجاز به بخش تنظیمات برنامه (صرفاً مدیر سامانه) */}
          {isAdminSettingsSection && !isSystemAdmin && (
            <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
              <div className="font-black text-sm text-slate-900 dark:text-white">
                دسترسی محدود به مدیر کل سامانه
              </div>
              <p className="text-xs text-slate-500">
                بخش «تنظیمات برنامه، قوانین، سانس‌ها، قفل‌گذاری و اطلاعات اولیه» منحصراً در اختیار مدیر کل سامانه است.
              </p>
              <button
                type="button"
                onClick={() => setSection('master_grid')}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold cursor-pointer"
              >
                بازگشت به برنامه جامع و فراگیر
              </button>
            </div>
          )}

          {/* نوار تب یکپارچه بخش تنظیمات برنامه (فقط مدیر سامانه) */}
          {isAdminSettingsSection && isSystemAdmin && (
            <div className="max-w-6xl mx-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 flex flex-wrap items-center gap-1.5">
              {(
                [
                  { key: 'rules', label: 'قوانین، ضرایب، سانس‌ها و دانشجویان', icon: Settings2 },
                  { key: 'locks', label: 'قفل و مسدودسازی برنامه', icon: Lock },
                  { key: 'classrooms', label: 'کلاس‌های فیزیکی', icon: Building2 },
                  { key: 'programs', label: 'رشته‌ها، ورودی و شعب', icon: Layers },
                  { key: 'professors', label: 'اساتید و عدم حضور', icon: Users },
                  { key: 'courses', label: 'لیست دروس (کد ۷ رقمی)', icon: BookOpen },
                ] as const
              ).map((tab) => {
                const TabIcon = tab.icon;
                const active = section === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSection(tab.key)}
                    className={`px-3 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer ${
                      active
                        ? 'bg-slate-900 dark:bg-teal-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ۰.۲ درخواست ثبت استاد جدید برای تأیید مدیر سامانه (مدیران گروه / آموزش) */}
          {section === 'professor_requests' && (
            <div className="space-y-4 max-w-6xl mx-auto">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-teal-600" />
                    <span>ارسال اطلاعات استاد جدید برای تأیید مدیر سامانه</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    چنانچه استادی که قصد تخصیص درس به او را دارید هنوز در لیست اساتید سامانه نیست، فرم مشخصات او را تکمیل و ارسال کنید. پس از تأیید مدیر سامانه، استاد با کد موقت{' '}
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">new001</span> تا{' '}
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">new999</span> (یا کد گلستان) به سامانه اضافه می‌شود و بعداً پس از صدور کد رسمی گلستان توسط مدیر سامانه قابل اصلاح است.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setProposalModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ ارسال فرم استاد جدید</span>
                </button>
              </div>

              {professorProposals.length === 0 ? (
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-xs text-slate-500 space-y-2">
                  <div className="font-bold text-slate-700 dark:text-slate-200">
                    هنوز هیچ فرم درخواست ثبت استاد جدیدی ارسال نشده است.
                  </div>
                  <p>
                    روی دکمه «ارسال فرم استاد جدید» کلیک کنید تا مشخصات استاد جهت بررسی و تأیید برای مدیر سامانه ارسال شود.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {professorProposals.map((pr) => {
                    const linkedProf = pr.approvedProfessorId
                      ? professors.find((p) => p.id === pr.approvedProfessorId)
                      : undefined;
                    const activeCode = linkedProf?.professorCode || pr.assignedProfessorCode || pr.proposedProfessorCode || '';
                    const isTemp = isTemporaryProfessorCode(activeCode);
                    const degreeStr =
                      formatProfessorDegreeFull(pr.degreeLevel, pr.degreeField, pr.degreeSpecialization) ||
                      pr.degreeFull ||
                      '—';
                    return (
                      <div
                        key={pr.id}
                        className={`rounded-2xl p-4 border text-xs space-y-2.5 ${
                          pr.status === 'pending'
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                            : pr.status === 'approved'
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-900/60'
                            : 'bg-rose-50/40 dark:bg-rose-950/15 border-rose-200 dark:border-rose-900/60'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-sm text-slate-900 dark:text-white">
                              {pr.fullName}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]" dir="ltr">
                              کد ملی: {pr.nationalId}
                            </span>
                            {activeCode && (
                              <span
                                className={`px-2.5 py-0.5 rounded-lg font-mono font-black text-[11px] border ${
                                  isTemp
                                    ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700'
                                    : 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700'
                                }`}
                              >
                                {pr.status === 'approved' ? 'کد ثبت‌شده' : 'کد پیشنهادی'}: {activeCode}
                                {isTemp ? ' (کد موقت)' : ''}
                              </span>
                            )}
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                              pr.status === 'pending'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : pr.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {pr.status === 'pending'
                              ? 'در انتظار تأیید مدیر سامانه'
                              : pr.status === 'approved'
                              ? 'تأیید و اضافه شده به سامانه'
                              : 'رد شده'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                          <div>مدرک و رشته: <strong>{degreeStr}</strong></div>
                          <div>گروه / مرتبه: <strong>{pr.departmentName || '—'} · {pr.academicRank || SCHED_EMPLOYMENT_LABELS[pr.employmentType]}</strong></div>
                          <div>ارسال‌کننده: <strong>{pr.requestedByName}</strong></div>
                        </div>
                        {pr.status === 'rejected' && pr.rejectionReason && (
                          <div className="p-2.5 rounded-xl bg-rose-100/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-[11px] font-bold">
                            دلیل رد مدیر سامانه: {pr.rejectionReason}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ۰.۵ انتخاب دروس قابل ارائه هر رشته-ورودی در ترم جاری از سرفصل رشته */}
          {section === 'term_courses' && (() => {
            const curCohort = activeTermCoursesCohort;
            const curTermState = curCohort
              ? getSelectedTermCoursesForCohort({
                  termKey: activeTerm,
                  cohortId: curCohort.id,
                  majorCode: curCohort.majorCode,
                  allCourses: courses,
                  rules,
                })
              : null;
            const selectedCodeSet = new Set(curTermState?.selectedCourseCodes || []);
            const majorEightPlan = curCohort
              ? getMajorEightTermPlanCourseCodes(appSettingsSnapshot, curCohort.majorCode, courses)
              : null;
            const planCodesForChosenTerm = majorEightPlan ? majorEightPlan[termCoursesPlanTerm] || [] : [];
            const termSearchQ = termCoursesSearch.trim().toLowerCase();
            const filteredCurriculumForCohort = (curTermState?.majorCourses || [])
              .filter((c) => {
                if (termCoursesTypeFilter !== 'all' && c.courseType !== termCoursesTypeFilter) {
                  return false;
                }
                if (!termSearchQ) return true;
                return (
                  c.title.toLowerCase().includes(termSearchQ) ||
                  normalizeSchedCode(c.courseCode).includes(normalizeSchedCode(termSearchQ))
                );
              })
              .sort((a, b) => {
                const aSel = selectedCodeSet.has(normalizeSchedCode(a.courseCode)) ? 0 : 1;
                const bSel = selectedCodeSet.has(normalizeSchedCode(b.courseCode)) ? 0 : 1;
                if (aSel !== bSel) return aSel - bSel;
                const ta = Number(normalizeCurriculumTermKey(a.recommendedTerm) || 99);
                const tb = Number(normalizeCurriculumTermKey(b.recommendedTerm) || 99);
                if (ta !== tb) return ta - tb;
                return a.courseCode.localeCompare(b.courseCode);
              });

            const totalSelectedUnits = round2(
              (curTermState?.selectedCourses || []).reduce(
                (sum, c) => sum + c.theoreticalUnits + c.practicalUnits,
                0
              )
            );
            const totalSelectedHours = round2(
              (curTermState?.selectedCourses || []).reduce(
                (sum, c) => sum + calculateOfferingBreakdown(c, rules).weeklyHours,
                0
              )
            );
            const scheduledCourseCodesInCohort = new Set(
              curCohort
                ? termOfferings
                    .filter((o) => o.cohortId === curCohort.id)
                    .map((o) => normalizeSchedCode(o.courseCode))
                : []
            );

            return (
              <div className="space-y-4 max-w-7xl mx-auto">
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-teal-600" />
                      <span>
                        انتخاب دروس قابل ارائه ترم <span className="font-mono">{activeTerm}</span> برای هر رشته-ورودی (از سرفصل مصوب)
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      دروسی که در این بخش برای هر رشته و سال ورود تیک زده می‌شوند، در زمان ثبت درس در جدول برنامه جامع و استودیو برای همان رشته-ورودی نمایش داده خواهند شد.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSection('master_grid')}
                      className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>ورود به برنامه جامع</span>
                    </button>
                  </div>
                </div>

                {visibleCohortsForWorkspace.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                    <div className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      هنوز رشته و ورودی‌ای در اطلاعات اولیه ثبت نشده است.
                    </div>
                    {isSystemAdmin && (
                      <button
                        type="button"
                        onClick={() => setSection('programs')}
                        className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-extrabold cursor-pointer"
                      >
                        تعریف رشته‌ها، ورودی‌ها و شعب
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* لیست رشته‌ها و ورودی‌ها */}
                    <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 space-y-2 max-h-[680px] overflow-y-auto">
                      <div className="px-2 py-1 text-xs font-black text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800">
                        رشته‌ها و ورودی‌های مجاز ({visibleCohortsForWorkspace.length.toLocaleString('fa-IR')} مورد)
                      </div>
                      {visibleCohortsForWorkspace.map((coh) => {
                        const isActive = curCohort?.id === coh.id;
                        const state = getSelectedTermCoursesForCohort({
                          termKey: activeTerm,
                          cohortId: coh.id,
                          majorCode: coh.majorCode,
                          allCourses: courses,
                          rules,
                        });
                        return (
                          <button
                            key={coh.id}
                            type="button"
                            onClick={() => setTermCoursesCohortId(coh.id)}
                            className={`w-full text-right p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                              isActive
                                ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-950 dark:text-teal-100 shadow-xs'
                                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-teal-300'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-extrabold text-xs truncate">
                                {coh.majorName}
                              </div>
                              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                                <span className="font-mono">ورودی {coh.entryTerm}</span>
                                <span>·</span>
                                <span className="font-mono">کد {coh.majorCode}</span>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-lg text-[10.5px] font-black tabular-nums shrink-0 ${
                                state.selectedCourses.length > 0
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                                  : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                              }`}
                            >
                              {state.selectedCourses.length.toLocaleString('fa-IR')} /{' '}
                              {state.majorCourses.length.toLocaleString('fa-IR')} درس
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* لیست سرفصل دروس رشته برای انتخاب */}
                    {curCohort && curTermState && (
                      <div className="lg:col-span-8 space-y-3">
                        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                            <div>
                              <div className="text-sm font-black text-slate-900 dark:text-white">
                                {curCohort.majorName} — ورودی {curCohort.entryTerm}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                کد رشته: <span className="font-mono font-bold">{curCohort.majorCode}</span> · کل سرفصل رشته:{' '}
                                {curTermState.majorCourses.length.toLocaleString('fa-IR')} درس
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs tabular-nums">
                              <span className="px-3 py-1.5 rounded-xl bg-teal-600 text-white font-extrabold">
                                انتخاب‌شده در ترم {activeTerm}:{' '}
                                {curTermState.selectedCourses.length.toLocaleString('fa-IR')} درس ({totalSelectedUnits.toLocaleString('fa-IR')} واحد · {totalSelectedHours.toLocaleString('fa-IR')} ساعت)
                              </span>
                            </div>
                          </div>

                          {/* بارگذاری یک‌کلیکی از برنامه ۸ ترمه پیش‌فرض تنظیم‌شده در تنظیمات */}
                          <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/25 border border-indigo-200 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-indigo-950 dark:text-indigo-200">
                                بارگذاری از برنامه ۸ ترمه پیش‌فرض:
                              </span>
                              <select
                                value={termCoursesPlanTerm}
                                onChange={(e) => setTermCoursesPlanTerm(e.target.value as EightTermKey)}
                                className="px-2.5 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 font-bold"
                              >
                                {EIGHT_TERM_KEYS.map((tk) => {
                                  const cnt = (majorEightPlan?.[tk] || []).length;
                                  return (
                                    <option key={tk} value={tk}>
                                      {EIGHT_TERM_LABELS[tk]} ({cnt.toLocaleString('fa-IR')} درس)
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                disabled={planCodesForChosenTerm.length === 0}
                                onClick={() => {
                                  const merged = Array.from(
                                    new Set([
                                      ...curTermState.selectedCourseCodes,
                                      ...planCodesForChosenTerm,
                                    ])
                                  );
                                  setCohortTermSelectedCourseCodes(curCohort, merged);
                                  notify(
                                    'success',
                                    `${planCodesForChosenTerm.length.toLocaleString('fa-IR')} درس ${EIGHT_TERM_LABELS[termCoursesPlanTerm]} به لیست دروس قابل ارائه این ترم اضافه شد.`
                                  );
                                }}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold cursor-pointer"
                              >
                                + افزودن دروس {EIGHT_TERM_LABELS[termCoursesPlanTerm]}
                              </button>
                              <button
                                type="button"
                                disabled={planCodesForChosenTerm.length === 0}
                                onClick={() => {
                                  setCohortTermSelectedCourseCodes(curCohort, planCodesForChosenTerm);
                                  notify(
                                    'success',
                                    `لیست دروس این ترم با ${planCodesForChosenTerm.length.toLocaleString('fa-IR')} درس ${EIGHT_TERM_LABELS[termCoursesPlanTerm]} جایگزین شد.`
                                  );
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200 disabled:opacity-40 font-bold cursor-pointer hover:bg-indigo-100"
                              >
                                جایگزینی با این ترم
                              </button>
                            </div>
                          </div>

                          {/* جستجو و انتخاب گروهی */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex flex-wrap items-center gap-2 flex-1">
                              <div className="relative flex-1 min-w-[200px] max-w-xs">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                                <input
                                  type="text"
                                  value={termCoursesSearch}
                                  onChange={(e) => setTermCoursesSearch(e.target.value)}
                                  placeholder="جستجوی نام یا کد ۷ رقمی درس..."
                                  className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                />
                              </div>
                              <select
                                value={termCoursesTypeFilter}
                                onChange={(e) =>
                                  setTermCoursesTypeFilter(e.target.value as 'all' | SchedCourseType)
                                }
                                className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                              >
                                <option value="all">همه انواع درس</option>
                                {(Object.keys(SCHED_COURSE_TYPE_LABELS) as SchedCourseType[]).map((k) => (
                                  <option key={k} value={k}>
                                    {SCHED_COURSE_TYPE_LABELS[k]}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setCohortTermSelectedCourseCodes(
                                    curCohort,
                                    curTermState.majorCourses.map((c) => c.courseCode)
                                  )
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold cursor-pointer"
                              >
                                انتخاب همه
                              </button>
                              <button
                                type="button"
                                onClick={() => setCohortTermSelectedCourseCodes(curCohort, [])}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold cursor-pointer"
                              >
                                پاک کردن همه
                              </button>
                            </div>
                          </div>

                          {curTermState.majorCourses.length === 0 ? (
                            <div className="p-8 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-center text-xs space-y-2">
                              <div className="font-extrabold text-amber-900 dark:text-amber-200">
                                هیچ درسی برای رشته «{curCohort.majorName} ({curCohort.majorCode})» در سرفصل دروس ثبت نشده است.
                              </div>
                              <div className="text-slate-600 dark:text-slate-300">
                                مدیر سامانه می‌تواند در «تنظیمات کل سامانه ← مدیریت مقاطع و رشته‌های مصوب ← تب سرفصل دروس رشته» یا از بخش «لیست دروس» سرفصل این رشته را اضافه کند.
                              </div>
                            </div>
                          ) : (
                            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto max-h-[460px]">
                              <table className="w-full text-xs text-right">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0 z-10">
                                  <tr>
                                    <th className="p-2.5 text-center w-12">ارائه</th>
                                    <th className="p-2.5">کد ۷ رقمی</th>
                                    <th className="p-2.5">عنوان درس</th>
                                    <th className="p-2.5">نوع</th>
                                    <th className="p-2.5 text-center">واحد / ساعت</th>
                                    <th className="p-2.5 text-center">ترم ۸ترمه</th>
                                    <th className="p-2.5 text-center">وضعیت جدول</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                                  {filteredCurriculumForCohort.map((c) => {
                                    const cleanCode = normalizeSchedCode(c.courseCode);
                                    const isChecked = selectedCodeSet.has(cleanCode);
                                    const isAlreadyScheduled = scheduledCourseCodesInCohort.has(cleanCode);
                                    const bd = calculateOfferingBreakdown(c, rules);
                                    const recTerm = normalizeCurriculumTermKey(c.recommendedTerm);
                                    return (
                                      <tr
                                        key={c.id}
                                        onClick={() => {
                                          const next = isChecked
                                            ? curTermState.selectedCourseCodes.filter(
                                                (x) => normalizeSchedCode(x) !== cleanCode
                                              )
                                            : [...curTermState.selectedCourseCodes, cleanCode];
                                          setCohortTermSelectedCourseCodes(curCohort, next);
                                        }}
                                        className={`cursor-pointer transition ${
                                          isChecked
                                            ? 'bg-emerald-50/70 dark:bg-emerald-950/25 hover:bg-emerald-100/70'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                        }`}
                                      >
                                        <td className="p-2.5 text-center">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => {}}
                                            className="w-4 h-4 rounded text-teal-600 cursor-pointer"
                                          />
                                        </td>
                                        <td className="p-2.5 font-mono font-bold text-indigo-700 dark:text-indigo-300">
                                          {c.courseCode}
                                        </td>
                                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                                          {c.title}
                                        </td>
                                        <td className="p-2.5 text-slate-500">
                                          {SCHED_COURSE_TYPE_LABELS[c.courseType]}
                                        </td>
                                        <td className="p-2.5 text-center">
                                          <span className="font-bold">
                                            {(c.theoreticalUnits + c.practicalUnits).toLocaleString('fa-IR')} و
                                          </span>{' '}
                                          <span className="text-slate-500">
                                            ({bd.weeklyHours.toLocaleString('fa-IR')} س)
                                          </span>
                                        </td>
                                        <td className="p-2.5 text-center">
                                          {recTerm ? (
                                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 text-[10px] font-bold">
                                              ترم {recTerm}
                                            </span>
                                          ) : (
                                            '—'
                                          )}
                                        </td>
                                        <td className="p-2.5 text-center">
                                          {isAlreadyScheduled ? (
                                            <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 text-[10px] font-extrabold">
                                              ثبت‌شده در جدول
                                            </span>
                                          ) : (
                                            <span className="text-slate-400 text-[10px]">—</span>
                                          )}
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
                  </div>
                )}
              </div>
            );
          })()}

          {/* ۱. پیشخوان و نمای کلی */}
          {section === 'overview' && (
            <div className="space-y-5 max-w-6xl mx-auto">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    وضعیت کلان برنامه‌ریزی درسی — ترم <span className="font-mono">{activeTerm}</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    ورود اطلاعات اولیه، چینش دستی یا خودکار برنامه هفتگی، مدیریت دروس مشترک کد ۷ رقمی و گزارش‌های تحلیلی
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSection('master_grid')}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>ورود به برنامه جامع و فراگیر</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSection('schedule')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold cursor-pointer"
                  >
                    جدول هفتگی و ثبت درس
                  </button>
                  <button
                    type="button"
                    onClick={() => setSection('auto_wizard')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>چینش هوشمند خودکار</span>
                  </button>
                </div>
              </div>

              {/* هشدار درخواست‌های ثبت استاد جدید و کدهای موقت در نمای کلی */}
              {isSystemAdmin && (pendingProfProposalsCount > 0 || tempCodedProfsCount > 0) && (
                <div className="rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 text-xs">
                    <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-black text-indigo-950 dark:text-indigo-100">
                        {pendingProfProposalsCount > 0
                          ? `${pendingProfProposalsCount.toLocaleString('fa-IR')} فرم درخواست ثبت استاد جدید از سوی مدیران گروه در انتظار تأیید شماست.`
                          : `${tempCodedProfsCount.toLocaleString('fa-IR')} استاد دارای کد موقت (new001 تا new999) در سامانه فعال هستند.`}
                      </div>
                      <p className="text-[11px] text-indigo-800 dark:text-indigo-300">
                        {tempCodedProfsCount > 0
                          ? 'پس از صدور کد مشخصه رسمی استاد در سامانه گلستان، می‌توانید از بخش اساتید کد موقت را اصلاح و در کل برنامه همگام‌سازی کنید.'
                          : 'پس از بررسی اطلاعات، می‌توانید استاد را با کد موقت new001 تا new999 یا کد رسمی گلستان تأیید کنید.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSection('professors')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shrink-0 cursor-pointer"
                  >
                    بررسی در بخش اساتید
                  </button>
                </div>
              )}

              {!isSystemAdmin && (
                <div className="rounded-2xl bg-teal-50/70 dark:bg-teal-950/25 border border-teal-200 dark:border-teal-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 text-xs">
                    <UserPlus className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-black text-teal-950 dark:text-teal-100">
                        نیاز به تعریف استاد جدید در سامانه دارید؟
                      </div>
                      <p className="text-[11px] text-teal-800 dark:text-teal-300">
                        فرم مشخصات استاد جدید را برای تأیید مدیر سامانه ارسال کنید ({pendingProfProposalsCount.toLocaleString('fa-IR')} درخواست در انتظار بررسی).
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setProposalModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold cursor-pointer"
                    >
                      + ارسال فرم استاد جدید
                    </button>
                    <button
                      type="button"
                      onClick={() => setSection('professor_requests')}
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 text-xs font-bold cursor-pointer"
                    >
                      پیگیری وضعیت درخواست‌ها
                    </button>
                  </div>
                </div>
              )}

              {/* گردش‌کار مرحله‌بندی‌شده آماده‌سازی برنامه ترم */}
              {isSystemAdmin && (
                <div className="rounded-2xl bg-gradient-to-l from-slate-50 via-teal-50/40 to-indigo-50/40 dark:from-slate-900 dark:via-teal-950/20 dark:to-indigo-950/20 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-teal-600" />
                        <span>گردش‌کار ۴ مرحله‌ای آماده‌سازی جدول، اعلام حضور اساتید و باز کردن دسترسی مدیران گروه</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        پس از ورود اطلاعات اولیه و آماده بودن ساختار سانس‌ها، ابتدا بازه اعلام حضور اساتید را باز کنید و پس از اتمام مهلت با یک کلیک دسترسی مدیران گروه را فعال نمایید.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[11px]">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="font-black text-slate-800 dark:text-slate-100">
                        ۱. اطلاعات اولیه سامانه
                      </div>
                      <div className="text-slate-500">
                        {overviewStats.activeClassrooms} کلاس · {overviewStats.activeProfessors} استاد · {overviewStats.totalCohorts} ورودی
                      </div>
                      <div
                        className={`font-extrabold ${
                          overviewStats.activeClassrooms > 0 &&
                          overviewStats.activeProfessors > 0 &&
                          overviewStats.totalCohorts > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600'
                        }`}
                      >
                        {overviewStats.activeClassrooms > 0 &&
                        overviewStats.activeProfessors > 0 &&
                        overviewStats.totalCohorts > 0
                          ? 'تکمیل و آماده'
                          : 'نیازمند تکمیل'}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="font-black text-slate-800 dark:text-slate-100">
                        ۲. جدول سانس‌ها و ردیف‌ها
                      </div>
                      <div className="text-slate-500">
                        {activeDays.length} روز فعال × {sortedSlots.length} سانس زمانی
                      </div>
                      <button
                        type="button"
                        onClick={() => setSection('master_grid')}
                        className="font-extrabold text-teal-600 hover:underline cursor-pointer"
                      >
                        مشاهده برنامه جامع
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="font-black text-slate-800 dark:text-slate-100 flex items-center justify-between gap-1">
                        <span>۳. بازه اعلام حضور اساتید</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                            availWindowStatus.isOpen
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : availWindowStatus.status === 'expired'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {availWindowStatus.isOpen
                            ? 'باز'
                            : availWindowStatus.status === 'expired'
                            ? 'منقضی'
                            : availWindowStatus.status === 'not_started'
                            ? 'در انتظار'
                            : 'بسته'}
                        </span>
                      </div>
                      <div className="text-slate-500">
                        ثبت‌کرده: {profAvailStats.submitted.toLocaleString('fa-IR')} نفر · پیش‌فرض آزاد:{' '}
                        {profAvailStats.defaultOpen.toLocaleString('fa-IR')} نفر
                      </div>
                      <button
                        type="button"
                        onClick={() => setSection('rules')}
                        className="font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        تنظیم بازه زمانی اساتید
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <div className="font-black text-slate-800 dark:text-slate-100">
                        ۴. دسترسی مدیران گروه
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleDeptHeadAccess}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-[11px] font-black inline-flex items-center justify-center gap-1.5 cursor-pointer transition ${
                          deptHeadAccessOpen
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        {deptHeadAccessOpen ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>باز است (کلیک برای بستن)</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>باز کردن با یک کلیک</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {overviewStats.disabledOfferingsCount > 0 && (
                <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-black text-amber-900 dark:text-amber-100">
                        {overviewStats.disabledOfferingsCount.toLocaleString('fa-IR')} درس در ترم {activeTerm} به صورت موقت، ناقص یا غیرفعال (نیازمند تکمیل ساعت، استاد یا کلاس) هستند
                      </div>
                      <div className="text-[11px] text-amber-800/90 dark:text-amber-200/80 mt-0.5">
                        این دروس با هایلایت زرد در جدول نمایش داده می‌شوند و تا زمان تکمیل و ثبت نهایی، در تداخل‌ها، ساعات اساتید و برنامه رسمی دانشجویان لحاظ نمی‌شوند.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSection('schedule')}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold shrink-0 cursor-pointer"
                  >
                    مشاهده و تکمیل دروس
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 tabular-nums">
                <button
                  type="button"
                  disabled={!isSystemAdmin}
                  onClick={() => isSystemAdmin && setSection('classrooms')}
                  className={`text-right rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 transition ${
                    isSystemAdmin ? 'hover:border-teal-400 cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="text-xs text-slate-500">کلاس‌های فیزیکی فعال</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {overviewStats.activeClassrooms}
                  </div>
                </button>
                <button
                  type="button"
                  disabled={!isSystemAdmin}
                  onClick={() => isSystemAdmin && setSection('programs')}
                  className={`text-right rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 transition ${
                    isSystemAdmin ? 'hover:border-teal-400 cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="text-xs text-slate-500">رشته‌ها / ورودی‌ها و شعب</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {overviewStats.totalCohorts}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      ({overviewStats.totalSections} گروه)
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  disabled={!isSystemAdmin}
                  onClick={() => isSystemAdmin && setSection('professors')}
                  className={`text-right rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 transition ${
                    isSystemAdmin ? 'hover:border-teal-400 cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="text-xs text-slate-500">اساتید ثبت‌شده</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {overviewStats.activeProfessors}
                  </div>
                </button>
                <button
                  type="button"
                  disabled={!isSystemAdmin}
                  onClick={() => isSystemAdmin && setSection('courses')}
                  className={`text-right rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 transition ${
                    isSystemAdmin ? 'hover:border-teal-400 cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="text-xs text-slate-500">عناوین سرفصل دروس</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {overviewStats.totalCourses}
                  </div>
                </button>
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                  <div className="text-xs text-slate-500">دروس فعال ترم {activeTerm}</div>
                  <div className="text-2xl font-black text-teal-700 dark:text-teal-400 mt-1">
                    {overviewStats.termOfferingsCount}
                  </div>
                </div>
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                  <div className="text-xs text-slate-500">مجموع ساعت کلاس هفتگی</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {overviewStats.totalWeeklyHours}
                  </div>
                </div>
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                  <div className="text-xs text-slate-500">دروس مشترک (کد ۷ رقمی)</div>
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    {overviewStats.sharedCount}
                  </div>
                </div>
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                  <div className="text-xs text-slate-500">تداخل زمانی قطعی</div>
                  <div
                    className={`text-2xl font-black mt-1 ${
                      overviewStats.hardConflicts > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {overviewStats.hardConflicts}
                  </div>
                </div>
              </div>

              {/* قوانین محاسبه فعال جهت یادآوری */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    ضرایب جاری محاسبه ساعات و واحد معادل اساتید
                  </h3>
                  {isSystemAdmin && (
                    <button
                      type="button"
                      onClick={() => setSection('rules')}
                      className="text-xs font-bold text-teal-600 hover:underline cursor-pointer"
                    >
                      ویرایش ضرایب و سانس‌ها
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs tabular-nums">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-700 dark:text-slate-200">واحد نظری</div>
                    <div className="text-slate-500 mt-1">
                      هر واحد = {rules.hoursPerUnit.theoretical} ساعت تدریس ·{' '}
                      {rules.equivalentPerUnit.theoretical} واحد معادل
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-700 dark:text-slate-200">عملی عادی / آزمایشگاه</div>
                    <div className="text-slate-500 mt-1">
                      هر واحد = {rules.hoursPerUnit.practicalNormalLab} ساعت تدریس ·{' '}
                      {rules.equivalentPerUnit.practicalNormalLab} واحد معادل
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-700 dark:text-slate-200">عملی کارگاهی</div>
                    <div className="text-slate-500 mt-1">
                      هر واحد = {rules.hoursPerUnit.practicalWorkshop} ساعت تدریس ·{' '}
                      {rules.equivalentPerUnit.practicalWorkshop} واحد معادل
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-700 dark:text-slate-200">واحد کارورزی</div>
                    <div className="text-slate-500 mt-1">
                      هر واحد = {rules.hoursPerUnit.practicalInternship} ساعت · مبنای{' '}
                      {rules.equivalentPerUnit.internshipMinStudents} دانشجو:{' '}
                      {rules.equivalentPerUnit.practicalInternshipBase} معادل (زیر نصاب به نسبت)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ۲. مدیریت کلاس‌های فیزیکی (فقط مدیر سامانه) */}
          {section === 'classrooms' && isSystemAdmin && (
            <div className="space-y-4 max-w-6xl mx-auto">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    اطلاعات اولیه: کلاس‌های فیزیکی، آزمایشگاه‌ها و کارگاه‌ها
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {canManageMasterData
                      ? 'امکان ثبت تکی یا ورود گروهی از فایل اکسل (کد کلاس، نام، ساختمان، ظرفیت و نوع کاربری)'
                      : 'نمای فقط-خواندنی فهرست کلاس‌های فیزیکی پردیس'}
                  </p>
                </div>
                {canManageMasterData && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void downloadSchedExcelTemplate('classrooms')}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود اکسل نمونه</span>
                    </button>
                    <label className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>ورود از اکسل</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => void handleExcelImport('classrooms', e)}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const rows = classrooms.map((r) => ({
                          'کد کلاس': r.code,
                          'نام کلاس': r.name,
                          'ساختمان / طبقه': r.building || '',
                          'ظرفیت': r.capacity,
                          'نوع کلاس': SCHED_ROOM_TYPE_LABELS[r.roomType],
                          'وضعیت': r.isActive ? 'فعال' : 'غیرفعال',
                          'توضیحات': r.notes || '',
                        }));
                        void exportJsonRowsToExcel(
                          rows,
                          'کلاس‌های فیزیکی',
                          `کلاسهای_فیزیکی_${activeTerm}.xlsx`
                        );
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>خروجی اکسل کلاس‌ها</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openRoomModal()}
                      className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن کلاس فیزیکی</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-right">
                      <th className="p-3">کد</th>
                      <th className="p-3">نام کلاس فیزیکی</th>
                      <th className="p-3">ساختمان / طبقه</th>
                      <th className="p-3 text-center">ظرفیت</th>
                      <th className="p-3">نوع کلاس</th>
                      <th className="p-3 text-center">وضعیت</th>
                      {canManageMasterData && <th className="p-3 text-center">عملیات</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {classrooms.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold">{r.code}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{r.name}</td>
                        <td className="p-3 text-slate-500">{r.building || '—'}</td>
                        <td className="p-3 text-center font-mono tabular-nums">{r.capacity} نفر</td>
                        <td className="p-3">{SCHED_ROOM_TYPE_LABELS[r.roomType]}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            disabled={!canManageMasterData}
                            onClick={() =>
                              persistClassrooms(
                                classrooms.map((x) =>
                                  x.id === r.id ? { ...x, isActive: !x.isActive } : x
                                )
                              )
                            }
                            className={`text-xs font-bold ${
                              r.isActive ? 'text-emerald-600' : 'text-slate-400'
                            } ${canManageMasterData ? 'cursor-pointer hover:underline' : ''}`}
                          >
                            {r.isActive ? 'فعال' : 'غیرفعال'}
                          </button>
                        </td>
                        {canManageMasterData && (
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openRoomModal(r)}
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteClassroom(r)}
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-800 cursor-pointer"
                                title="حذف کلاس فیزیکی و غیرفعال‌سازی دروس مرتبط"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ۳. رشته‌ها (۶ رقمی)، ورودی‌ها و شعب/گروه‌ها (فقط مدیر سامانه) */}
          {section === 'programs' && isSystemAdmin && (
            <div className="space-y-4 max-w-6xl mx-auto">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    اطلاعات اولیه: رشته‌های تحصیلی (کد ۶ رقمی)، ورودی‌ها و شعبه‌ها
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تعریف رشته‌ها با کد ۶ رقمی یکتا، تفکیک هر سال ورودی و تقسیم دانشجویان در شعب/گروه‌ها
                  </p>
                </div>
                {canManageMasterData && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void downloadSchedExcelTemplate('programs')}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود اکسل نمونه</span>
                    </button>
                    <label className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>ورود از اکسل</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => void handleExcelImport('programs', e)}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const rows = programs.flatMap((p) =>
                          (p.sections.length > 0
                            ? p.sections
                            : [{ id: 'default', name: 'گروه ۱', studentCount: p.totalStudents }]
                          ).map((sec) => ({
                            'کد رشته ۶ رقمی': p.majorCode,
                            'نام رشته': p.majorName,
                            'ورودی': p.entryTerm,
                            'تعداد نفرات کل ورودی': p.totalStudents,
                            'تعداد شعبه‌ها': p.sections.length || 1,
                            'نام شعبه / گروه': sec.name,
                            'تعداد نفرات شعبه': sec.studentCount,
                            'توضیحات': p.notes || '',
                          }))
                        );
                        void exportJsonRowsToExcel(
                          rows,
                          'رشته‌ها و شعب',
                          `رشته_ورودی_شعب_${activeTerm}.xlsx`
                        );
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>خروجی اکسل رشته‌ها و شعب</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openProgModal()}
                      className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن رشته و ورودی</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-right">
                      <th className="p-3">کد رشته ۶ رقمی</th>
                      <th className="p-3">نام رشته</th>
                      <th className="p-3 text-center">ورودی</th>
                      <th className="p-3 text-center">تعداد کل دانشجو</th>
                      <th className="p-3">شعب و گروه‌ها</th>
                      {canManageMasterData && <th className="p-3 text-center">عملیات</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {programs.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-teal-700 dark:text-teal-400">
                          {p.majorCode}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{p.majorName}</td>
                        <td className="p-3 text-center font-mono font-bold">{p.entryTerm}</td>
                        <td className="p-3 text-center font-mono tabular-nums">{p.totalStudents} نفر</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          {p.sections.map((s) => `${s.name} (${s.studentCount} نفر)`).join(' · ')}
                        </td>
                        {canManageMasterData && (
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openProgModal(p)}
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProgramCohort(p)}
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-800 cursor-pointer"
                                title="حذف رشته-ورودی و تمام دروس آن در جدول برنامه"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ۴. اساتید (فقط مدیر سامانه) */}
          {section === 'professors' && isSystemAdmin && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    بانک اساتید (پشتیبانی مستقیم از گزارش ۴۵ گلستان با تفکیک مقطع و رشته)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    فایل اکسل خروجی <strong className="text-indigo-700 dark:text-indigo-300">گزارش ۴۵ سامانه گلستان</strong> را مستقیماً و بدون هیچ تغییری بارگذاری کنید تا ستون‌های شماره شناسایی، نام و نام خانوادگی، جنس، نام پدر، شماره ملی، گروه آموزشی، واحد/مرکز، تلفن همراه و ثابت، آخرین مدرک تحصیلی، رشته و گرایش تحصیلی، پایه، مرتبه علمی، وضعیت استخدام، بانک و شماره حساب استخراج شوند.
                  </p>
                </div>
                {canManageMasterData && (
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void downloadSchedExcelTemplate('professors')}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود اکسل نمونه</span>
                    </button>
                    <label className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>ورود مستقیم اکسل / گزارش ۴۵ گلستان</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => void handleExcelImport('professors', e)}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const rows = professors.map((p) => ({
                          'شماره شناسایی': p.professorCode,
                          'نام استاد': p.firstName || '',
                          'نام خانوادگی استاد': p.lastName || '',
                          'نام و نام خانوادگی': p.fullName,
                          'جنس': p.gender || '',
                          'نام پدر': p.fatherName || '',
                          'شماره ملی': p.nationalId || '',
                          'نام فارسی گروه آموزشی': p.departmentName || '',
                          'نام واحد/مرکز': p.unitCenterName || '',
                          'تلفن همراه': p.mobile || p.phone || '',
                          'تلفن': p.landlinePhone || '',
                          'آخرین مدرک تحصیلی': p.degreeLevel || '',
                          'رشته تحصیلی': p.degreeField || '',
                          'گرایش تحصیلی': p.degreeSpecialization || '',
                          'پایه': p.academicStep || '',
                          'مرتبه علمی': p.academicRank || '',
                          'وضعیت استخدام': p.employmentStatusRaw || SCHED_EMPLOYMENT_LABELS[p.employmentType],
                          'بانک': p.bankName || '',
                          'شماره حساب': p.bankAccount || '',
                        }));
                        void exportJsonRowsToExcel(rows, 'اساتید', `بانک_اساتید_${activeTerm}.xlsx`);
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>خروجی اکسل اساتید</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openProfModal()}
                      className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن استاد جدید</span>
                    </button>
                  </div>
                )}
              </div>

              <AdminProfessorProposalsPanel
                reviewerId={actor.id}
                reviewerName={actor.name}
                onDataChanged={() => refreshProfessorsAndProposals()}
                compactEmpty={true}
              />

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={profSearch}
                    onChange={(e) => setProfSearch(e.target.value)}
                    placeholder="جستجوی نام، شماره شناسایی، مقطع، رشته، گروه آموزشی یا مرتبه علمی..."
                    className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                {tempCodedProfsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setProfTempOnlyFilter((v) => !v)}
                    className={`px-3 py-2 rounded-xl text-xs font-extrabold border inline-flex items-center gap-1.5 cursor-pointer transition ${
                      profTempOnlyFilter
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      فقط کدهای موقت new001 تا new999 ({tempCodedProfsCount.toLocaleString('fa-IR')})
                    </span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-right">
                      <th className="p-3">شماره شناسایی</th>
                      <th className="p-3">نام و مشخصات فردی</th>
                      <th className="p-3">مقطع و رشته (جداگانه)</th>
                      <th className="p-3">گروه آموزشی / مرکز</th>
                      <th className="p-3">مرتبه، پایه و استخدام</th>
                      <th className="p-3">تماس (همراه / ثابت)</th>
                      {canViewSensitiveProfInfo && <th className="p-3">کدملی / بانک و حساب</th>}
                      <th className="p-3 text-center">واحد معادل ترم {activeTerm}</th>
                      <th className="p-3 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                    {(profShowAll
                      ? filteredProfessors
                      : filteredProfessors.slice((profPage - 1) * 50, profPage * 50)
                    ).map((p) => {
                      const summary = termSchedulingIndex.profLoadMap.get(p.id) || {
                        professorId: p.id,
                        offeringCount: 0,
                        rawUnits: 0,
                        theoreticalUnits: 0,
                        practicalUnits: 0,
                        weeklyHours: 0,
                        equivalentUnits: 0,
                        activeDays: [],
                      };
                      const unitStatus = evaluateProfessorEquivalentUnitStatus(
                        p,
                        summary.equivalentUnits,
                        rules
                      );
                      const isTempProf = isTemporaryProfessorCode(p.professorCode);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-mono font-bold text-teal-700 dark:text-teal-400">
                              <div className="flex flex-col items-start gap-1">
                                <span>{p.professorCode}</span>
                                {isTempProf && (
                                  <button
                                    type="button"
                                    onClick={() => openProfModal(p)}
                                    className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[9.5px] font-sans font-extrabold cursor-pointer hover:bg-amber-200"
                                    title="کلیک کنید تا کد رسمی گلستان را جایگزین کنید"
                                  >
                                    کد موقت · اصلاح کد گلستان
                                  </button>
                                )}
                                {!isTempProf && p.previousTemporaryCode && (
                                  <span className="text-[9.5px] font-sans text-slate-400">
                                    موقت قبلی: <span className="font-mono">{p.previousTemporaryCode}</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {p.fullName}
                              </div>
                              {(p.fatherName || p.gender) && (
                                <div className="text-[10.5px] text-slate-500 mt-0.5">
                                  {p.gender ? `${p.gender}` : ''}
                                  {p.gender && p.fatherName ? ' · ' : ''}
                                  {p.fatherName ? `فرزند ${p.fatherName}` : ''}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-slate-700 dark:text-slate-300 space-y-0.5">
                              {(p.degreeLevel || p.degreeField) ? (
                                <>
                                  {p.degreeLevel && (
                                    <div className="text-[11px]">
                                      <span className="text-slate-400">مقطع:</span>{' '}
                                      <span className="font-bold">{p.degreeLevel}</span>
                                    </div>
                                  )}
                                  {p.degreeField && (
                                    <div className="text-[11px]">
                                      <span className="text-slate-400">رشته:</span>{' '}
                                      <span className="font-semibold">{p.degreeField}</span>
                                    </div>
                                  )}
                                  {p.degreeSpecialization && (
                                    <div className="text-[10.5px] text-slate-500">
                                      گرایش: {p.degreeSpecialization}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span>{p.degreeFull || '—'}</span>
                              )}
                            </td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">
                              <div className="font-semibold">{p.departmentName || '—'}</div>
                              {p.unitCenterName && (
                                <div className="text-[10.5px] text-slate-500 mt-0.5">
                                  {p.unitCenterName}
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {p.academicRank || SCHED_EMPLOYMENT_LABELS[p.employmentType]}
                                {p.academicStep ? ` (پایه ${p.academicStep})` : ''}
                              </div>
                              <div className="text-[10.5px] text-slate-500 mt-0.5">
                                {p.employmentStatusRaw || SCHED_EMPLOYMENT_LABELS[p.employmentType]}
                              </div>
                            </td>
                            <td className="p-3 font-mono text-[11px]" dir="ltr">
                              <div>{p.mobile || p.phone || '—'}</div>
                              {p.landlinePhone && (
                                <div className="text-slate-400">ثابت: {p.landlinePhone}</div>
                              )}
                            </td>
                            {canViewSensitiveProfInfo && (
                              <td className="p-3 font-mono text-[11px]" dir="ltr">
                                <div>{p.nationalId || '—'}</div>
                                <div className="text-slate-500" dir="rtl">
                                  {p.bankName ? `${p.bankName} · ` : ''}
                                  <span className="font-mono" dir="ltr">
                                    {p.bankAccount || 'بدون حساب'}
                                  </span>
                                </div>
                              </td>
                            )}
                            <td className="p-3 text-center font-bold">
                              <div>
                                {summary.equivalentUnits} معادل ({summary.weeklyHours} ساعت)
                              </div>
                              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                {unitStatus.bounds.minEquivalentUnits > 0
                                  ? `حداقل ${unitStatus.bounds.minEquivalentUnits}`
                                  : 'بدون حداقل'}{' '}
                                ·{' '}
                                {unitStatus.bounds.maxEquivalentUnits > 0
                                  ? `سقف ${unitStatus.bounds.maxEquivalentUnits}`
                                  : 'سقف نامحدود'}
                                {(unitStatus.bounds.minSource === 'professor' ||
                                  unitStatus.bounds.maxSource === 'professor') && (
                                  <span className="text-indigo-600 dark:text-indigo-400 mr-1">
                                    (اختصاصی)
                                  </span>
                                )}
                              </div>
                              {unitStatus.status !== 'ok' && (
                                <div
                                  className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-[9.5px] font-extrabold"
                                  title={unitStatus.message || ''}
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>
                                    {unitStatus.status === 'above_max'
                                      ? 'بیش از سقف مجاز'
                                      : 'کمتر از حداقل موظفی'}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <div className="inline-flex flex-col items-center gap-1">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setUnavailProfModal(p);
                                      setUnavailDraft([...(p.unavailableKeys || [])]);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] font-bold cursor-pointer"
                                    title="ثبت زمان‌های عدم امکان حضور استاد"
                                  >
                                    عدم حضور ({p.unavailableKeys?.length || 0})
                                  </button>
                                  {canManageMasterData && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => openProfModal(p)}
                                        className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 cursor-pointer"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setProfToDelete(p)}
                                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-800 cursor-pointer"
                                        title="حذف استاد و غیرفعال‌سازی خودکار دروس مرتبط"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                                <span
                                  className={`text-[10px] font-bold ${
                                    p.availabilitySubmitted
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-slate-400 dark:text-slate-500'
                                  }`}
                                >
                                  {p.availabilitySubmitted
                                    ? 'ثبت زمان توسط استاد'
                                    : 'پیش‌فرض: کل هفته آزاد'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              {filteredProfessors.length > 50 && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5">
                  <span>
                    نمایش{' '}
                    <strong>
                      {profShowAll
                        ? `همه ${filteredProfessors.length.toLocaleString('fa-IR')}`
                        : `${(((profPage - 1) * 50) + 1).toLocaleString('fa-IR')} تا ${Math.min(
                            profPage * 50,
                            filteredProfessors.length
                          ).toLocaleString('fa-IR')} از ${filteredProfessors.length.toLocaleString('fa-IR')}`}
                    </strong>{' '}
                    استاد
                  </span>
                  <div className="flex items-center gap-1.5">
                    {!profShowAll && (
                      <>
                        <button
                          type="button"
                          disabled={profPage <= 1}
                          onClick={() => setProfPage((p) => Math.max(1, p - 1))}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 font-bold cursor-pointer"
                        >
                          قبلی
                        </button>
                        <span className="px-2 font-mono font-bold">
                          {profPage} / {Math.max(1, Math.ceil(filteredProfessors.length / 50))}
                        </span>
                        <button
                          type="button"
                          disabled={profPage >= Math.ceil(filteredProfessors.length / 50)}
                          onClick={() =>
                            setProfPage((p) =>
                              Math.min(Math.ceil(filteredProfessors.length / 50), p + 1)
                            )
                          }
                          className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 font-bold cursor-pointer"
                        >
                          بعدی
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setProfShowAll((v) => !v)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold cursor-pointer"
                    >
                      {profShowAll ? 'صفحه‌بندی (۵۰تایی)' : 'نمایش همه'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ۵. لیست دروس رشته‌ها با کد ۷ رقمی (فقط مدیر سامانه) */}
          {section === 'courses' && isSystemAdmin && (
            <div className="space-y-4 max-w-6xl mx-auto">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    لیست دروس رشته‌ها (کد درس ۷ رقمی یکتا)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ملاک مشترک‌سازی دانشجویان چند رشته در یک کلاس، یکسان بودن کد ۷ رقمی درس است؛ تشابه اسمی با کد متفاوت درس مستقل محسوب می‌شود.
                  </p>
                </div>
                {canManageMasterData && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void downloadSchedExcelTemplate('courses')}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود اکسل نمونه</span>
                    </button>
                    <label className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>ورود از اکسل</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => void handleExcelImport('courses', e)}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const rows = courses.map((c) => ({
                          'کد درس ۷ رقمی': c.courseCode,
                          'نام درس': c.title,
                          'کد رشته ۶ رقمی': c.majorCode,
                          'نام رشته': c.majorName,
                          'نوع درس': SCHED_COURSE_TYPE_LABELS[c.courseType],
                          'واحد نظری': c.theoreticalUnits,
                          'واحد عملی': c.practicalUnits,
                          'نوع واحد عملی': SCHED_PRACTICAL_TYPE_LABELS[c.practicalType],
                          'ترم پیشنهادی': c.recommendedTerm || '',
                          'توضیحات': c.notes || '',
                        }));
                        void exportJsonRowsToExcel(
                          rows,
                          'سرفصل دروس',
                          `لیست_دروس_${activeTerm}.xlsx`
                        );
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>خروجی اکسل دروس</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openCourseModal()}
                      className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن سرفصل درس</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[220px] max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    placeholder="جستجوی کد ۷ رقمی یا عنوان درس..."
                    className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <select
                  value={courseMajorFilter}
                  onChange={(e) => setCourseMajorFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                >
                  <option value="all">همه رشته‌ها</option>
                  {uniqueMajors.map((m) => (
                    <option key={m.majorCode} value={m.majorCode}>
                      {m.majorName} ({m.majorCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-right">
                      <th className="p-3">کد درس ۷ رقمی</th>
                      <th className="p-3">عنوان درس</th>
                      <th className="p-3">رشته (کد ۶ رقمی)</th>
                      <th className="p-3">نوع درس</th>
                      <th className="p-3 text-center">واحد نظری</th>
                      <th className="p-3 text-center">واحد عملی (نوع)</th>
                      <th className="p-3 text-center">ساعت هفتگی</th>
                      {canManageMasterData && <th className="p-3 text-center">عملیات</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                    {(courseShowAll
                      ? filteredCourses
                      : filteredCourses.slice((coursePage - 1) * 50, coursePage * 50)
                    ).map((c) => {
                      const bd = calculateOfferingBreakdown(c, rules);
                      const sharedMajorsCount = courseCodeMajorCountMap.get(c.courseCode) || 1;
                      return (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                            {c.courseCode}
                            {sharedMajorsCount > 1 && (
                              <span className="block text-[10px] font-sans text-teal-600 dark:text-teal-400">
                                مشترک در {sharedMajorsCount} رشته
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            {c.title}
                          </td>
                          <td className="p-3">
                            {c.majorName} <span className="font-mono text-slate-400">({c.majorCode})</span>
                          </td>
                          <td className="p-3">{SCHED_COURSE_TYPE_LABELS[c.courseType]}</td>
                          <td className="p-3 text-center font-bold">{c.theoreticalUnits}</td>
                          <td className="p-3 text-center">
                            {c.practicalUnits > 0 ? (
                              <span>
                                <strong>{c.practicalUnits}</strong> ({SCHED_PRACTICAL_TYPE_LABELS[c.practicalType]})
                              </span>
                            ) : (
                              '۰'
                            )}
                          </td>
                          <td className="p-3 text-center font-bold text-teal-700 dark:text-teal-400">
                            {bd.weeklyHours} ساعت
                          </td>
                          {canManageMasterData && (
                            <td className="p-3 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openCourseModal(c)}
                                  className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    persistCourses(courses.filter((x) => x.id !== c.id))
                                  }
                                  className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-800 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredCourses.length > 50 && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5">
                  <span>
                    نمایش{' '}
                    <strong>
                      {courseShowAll
                        ? `همه ${filteredCourses.length.toLocaleString('fa-IR')}`
                        : `${(((coursePage - 1) * 50) + 1).toLocaleString('fa-IR')} تا ${Math.min(
                            coursePage * 50,
                            filteredCourses.length
                          ).toLocaleString('fa-IR')} از ${filteredCourses.length.toLocaleString('fa-IR')}`}
                    </strong>{' '}
                    درس
                  </span>
                  <div className="flex items-center gap-1.5">
                    {!courseShowAll && (
                      <>
                        <button
                          type="button"
                          disabled={coursePage <= 1}
                          onClick={() => setCoursePage((p) => Math.max(1, p - 1))}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 font-bold cursor-pointer"
                        >
                          قبلی
                        </button>
                        <span className="px-2 font-mono font-bold">
                          {coursePage} / {Math.max(1, Math.ceil(filteredCourses.length / 50))}
                        </span>
                        <button
                          type="button"
                          disabled={coursePage >= Math.ceil(filteredCourses.length / 50)}
                          onClick={() =>
                            setCoursePage((p) =>
                              Math.min(Math.ceil(filteredCourses.length / 50), p + 1)
                            )
                          }
                          className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 font-bold cursor-pointer"
                        >
                          بعدی
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setCourseShowAll((v) => !v)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold cursor-pointer"
                    >
                      {courseShowAll ? 'صفحه‌بندی (۵۰تایی)' : 'نمایش همه'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ۶. قوانین محاسبه ساعت، واحد معادل و زمان‌بندی سانس‌ها (فقط مدیر سامانه) */}
          {section === 'rules' && isSystemAdmin && (
            <div className="space-y-5 max-w-5xl mx-auto">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                      تنظیمات ضرایب ساعت تدریس، واحد معادل اساتید و جدول سانس‌ها
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {canManageMasterData
                        ? 'تمامی ضرایب زیر قابل ویرایش توسط مدیر کل و معاونت آموزشی هستند و در تمامی محاسبات اعمال می‌شوند.'
                        : 'ضرایب رسمی مصوب معاونت آموزشی و مدیر کل سامانه (نمای فقط-خواندنی)'}
                    </p>
                  </div>
                  {canManageMasterData && (
                    <button
                      type="button"
                      onClick={() => {
                        persistRules(draftRules);
                        notify('success', 'قوانین و سانس‌های کلاسی ذخیره شد.');
                      }}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold cursor-pointer"
                    >
                      ذخیره قوانین و ضرایب
                    </button>
                  )}
                </div>

                {/* ضرایب ساعت تدریس */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h3 className="font-extrabold text-slate-900 dark:text-white">
                      ضرایب تبدیل واحد به ساعت تدریس هفتگی
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="space-y-1">
                        <span className="text-slate-600 dark:text-slate-300 font-semibold block">
                          هر واحد نظری (ساعت):
                        </span>
                        <input
                          type="number"
                          step="0.1"
                          disabled={!canManageMasterData}
                          value={draftRules.hoursPerUnit.theoretical}
                          onChange={(e) =>
                            setDraftRules((prev) => ({
                              ...prev,
                              hoursPerUnit: {
                                ...prev.hoursPerUnit,
                                theoretical: Number(e.target.value) || 1,
                              },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-slate-600 dark:text-slate-300 font-semibold block">
                          عملی عادی / آزمایشگاهی (ساعت):
                        </span>
                        <input
                          type="number"
                          step="0.1"
                          disabled={!canManageMasterData}
                          value={draftRules.hoursPerUnit.practicalNormalLab}
                          onChange={(e) =>
                            setDraftRules((prev) => ({
                              ...prev,
                              hoursPerUnit: {
                                ...prev.hoursPerUnit,
                                practicalNormalLab: Number(e.target.value) || 2,
                              },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-slate-600 dark:text-slate-300 font-semibold block">
                          عملی کارگاهی (ساعت):
                        </span>
                        <input
                          type="number"
                          step="0.1"
                          disabled={!canManageMasterData}
                          value={draftRules.hoursPerUnit.practicalWorkshop}
                          onChange={(e) =>
                            setDraftRules((prev) => ({
                              ...prev,
                              hoursPerUnit: {
                                ...prev.hoursPerUnit,
                                practicalWorkshop: Number(e.target.value) || 3,
                              },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-slate-600 dark:text-slate-300 font-semibold block">
                          واحد کارورزی (ساعت):
                        </span>
                        <input
                          type="number"
                          step="0.1"
                          disabled={!canManageMasterData}
                          value={draftRules.hoursPerUnit.practicalInternship}
                          onChange={(e) =>
                            setDraftRules((prev) => ({
                              ...prev,
                              hoursPerUnit: {
                                ...prev.hoursPerUnit,
                                practicalInternship: Number(e.target.value) || 4,
                              },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        />
                      </label>
                    </div>
                  </div>

                  {/* ضرایب واحد معادل */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h3 className="font-extrabold text-slate-900 dark:text-white">
                      ضرایب محاسبه واحد معادل اساتید
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="space-y-1">
                        <span className="text-slate-600 dark:text-slate-300 font-semibold block">
                          معادل واحد نظری:
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          disabled={!canManageMasterData}
                          value={draftRules.equivalentPerUnit.theoretical}
                          onChange={(e) =>
                            setDraftRules((prev) => ({
                              ...prev,
                              equivalentPerUnit: {
                                ...prev.equivalentPerUnit,
                                theoretical: Number(e.target.value) || 1,
                              },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-slate-600 dark:text-slate-300 font-semibold block">
                          معادل عملی عادی/آزمایشگاه:
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          disabled={!canManageMasterData}
                          value={draftRules.equivalentPerUnit.practicalNormalLab}
                          onChange={(e) =>
                            setDraftRules((prev) => ({
                              ...prev,
                              equivalentPerUnit: {
                                ...prev.equivalentPerUnit,
                                practicalNormalLab: Number(e.target.value) || 1.3,
                              },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-slate-600 dark:text-slate-300 font-semibold block">
                          معادل عملی کارگاهی:
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          disabled={!canManageMasterData}
                          value={draftRules.equivalentPerUnit.practicalWorkshop}
                          onChange={(e) =>
                            setDraftRules((prev) => ({
                              ...prev,
                              equivalentPerUnit: {
                                ...prev.equivalentPerUnit,
                                practicalWorkshop: Number(e.target.value) || 1.98,
                              },
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <label className="space-y-1">
                          <span className="text-slate-600 dark:text-slate-300 font-semibold block">
                            معادل پایه کارورزی:
                          </span>
                          <input
                            type="number"
                            step="0.1"
                            disabled={!canManageMasterData}
                            value={draftRules.equivalentPerUnit.practicalInternshipBase}
                            onChange={(e) =>
                              setDraftRules((prev) => ({
                                ...prev,
                                equivalentPerUnit: {
                                  ...prev.equivalentPerUnit,
                                  practicalInternshipBase: Number(e.target.value) || 3,
                                },
                              }))
                            }
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-slate-600 dark:text-slate-300 font-semibold block">
                            نصاب دانشجو:
                          </span>
                          <input
                            type="number"
                            min={1}
                            disabled={!canManageMasterData}
                            value={draftRules.equivalentPerUnit.internshipMinStudents}
                            onChange={(e) =>
                              setDraftRules((prev) => ({
                                ...prev,
                                equivalentPerUnit: {
                                  ...prev.equivalentPerUnit,
                                  internshipMinStudents: Math.max(1, Number(e.target.value) || 12),
                                },
                              }))
                            }
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* قوانین حداقل و حداکثر واحد معادل اساتید بر اساس نوع استخدام */}
                <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white">
                        قوانین حداقل و حداکثر واحد معادل قابل اخذ اساتید (بر اساس نوع استخدام)
                      </h3>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        پیش‌فرض: هیات علمی (حداقل ۱۰ · حداکثر ۲۴)، مامور آموزشی (حداکثر ۲۴)، سایر اساتید غیرهیات‌علمی (حداکثر ۱۲). عدم رعایت این حدود در زمان ثبت درس صرفاً به صورت <strong>اخطار</strong> نمایش داده می‌شود و مانع ثبت نخواهد شد. امکان تعیین محدوده اختصاصی برای هر استاد نیز در فرم ویرایش استاد وجود دارد.
                      </p>
                    </div>
                    {canManageMasterData && (
                      <button
                        type="button"
                        onClick={() =>
                          setDraftRules((prev) => ({
                            ...prev,
                            professorUnitLimits: { ...DEFAULT_SCHED_PROFESSOR_UNIT_LIMITS },
                          }))
                        }
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 font-bold text-[11px] hover:bg-amber-100/60 shrink-0 cursor-pointer"
                      >
                        بازنشانی پیش‌فرض‌ها (۱۰ / ۲۴ / ۱۲)
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 tabular-nums">
                    {(Object.keys(SCHED_EMPLOYMENT_LABELS) as SchedEmploymentType[]).map((empKey) => {
                      const defLimit = DEFAULT_SCHED_PROFESSOR_UNIT_LIMITS[empKey];
                      const currentLimit =
                        draftRules.professorUnitLimits?.[empKey] || defLimit;
                      return (
                        <div
                          key={empKey}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              {SCHED_EMPLOYMENT_LABELS[empKey]}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              پیش‌فرض: {defLimit.minEquivalentUnits} تا {defLimit.maxEquivalentUnits}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="space-y-1">
                              <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold block">
                                حداقل واحد معادل:
                              </span>
                              <input
                                type="number"
                                min={0}
                                step="0.5"
                                disabled={!canManageMasterData}
                                value={currentLimit.minEquivalentUnits}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  setDraftRules((prev) => {
                                    const base = {
                                      ...DEFAULT_SCHED_PROFESSOR_UNIT_LIMITS,
                                      ...(prev.professorUnitLimits || {}),
                                    } as Record<SchedEmploymentType, SchedProfessorUnitLimit>;
                                    return {
                                      ...prev,
                                      professorUnitLimits: {
                                        ...base,
                                        [empKey]: {
                                          ...(base[empKey] || defLimit),
                                          minEquivalentUnits: val,
                                        },
                                      },
                                    };
                                  });
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center"
                                dir="ltr"
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold block">
                                حداکثر واحد معادل:
                              </span>
                              <input
                                type="number"
                                min={0}
                                step="0.5"
                                disabled={!canManageMasterData}
                                value={currentLimit.maxEquivalentUnits}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  setDraftRules((prev) => {
                                    const base = {
                                      ...DEFAULT_SCHED_PROFESSOR_UNIT_LIMITS,
                                      ...(prev.professorUnitLimits || {}),
                                    } as Record<SchedEmploymentType, SchedProfessorUnitLimit>;
                                    return {
                                      ...prev,
                                      professorUnitLimits: {
                                        ...base,
                                        [empKey]: {
                                          ...(base[empKey] || defLimit),
                                          maxEquivalentUnits: val,
                                        },
                                      },
                                    };
                                  });
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center"
                                dir="ltr"
                              />
                            </label>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            عدد ۰ در حداقل = بدون الزام حداقل · عدد ۰ در حداکثر = بدون سقف
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* روزهای هفته و سانس‌ها */}
                <div className="space-y-3 text-xs">
                  <div className="font-extrabold text-slate-900 dark:text-white">روزهای فعال دانشگاه</div>
                  <div className="flex flex-wrap gap-2">
                    {SCHED_DAYS_ORDER.map((d) => {
                      const active = draftRules.activeDays.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          disabled={!canManageMasterData}
                          onClick={() =>
                            setDraftRules((prev) => ({
                              ...prev,
                              activeDays: active
                                ? prev.activeDays.filter((x) => x !== d)
                                : [...prev.activeDays, d],
                            }))
                          }
                          className={`px-3 py-1.5 rounded-xl border font-bold cursor-pointer ${
                            active
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {SCHED_DAY_LABELS[d]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white block">
                        مدیریت عناوین، تعداد و زمان سانس‌های کلاسی (به‌همراه تک‌ساعت ۷ تا ۸ صبح کارورزی)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        پیش‌فرض ۶ سانس دو ساعتی از ۰۸:۰۰ تا ۲۰:۰۰ است؛ می‌توانید عنوان هر سانس را به دلخواه تغییر دهید، ترتیب سانس‌ها را جابجا کنید یا تک‌ساعت ۷ تا ۸ صبح را برای کارورزی اضافه نمایید.
                      </span>
                    </div>
                    {isSystemAdmin && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <label className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                          <span className="text-[11px] font-bold">تعداد سانس روزانه:</span>
                          <select
                            value={draftRules.timeSlots.length}
                            onChange={(e) => {
                              const cnt = Math.max(1, Math.min(12, Number(e.target.value) || 6));
                              const generated = buildDefaultTimeSlots(cnt, 8, 2);
                              const existingSorted = [...draftRules.timeSlots].sort(
                                (a, b) => a.order - b.order
                              );
                              const merged = generated.map((g, idx) => {
                                const old = existingSorted[idx];
                                return old
                                  ? {
                                      ...g,
                                      id: old.id,
                                      label: old.label || g.label,
                                      startTime: old.startTime,
                                      endTime: old.endTime,
                                    }
                                  : g;
                              });
                              setDraftRules((prev) => ({ ...prev, timeSlots: merged }));
                            }}
                            className="bg-transparent font-mono font-black focus:outline-none cursor-pointer"
                          >
                            {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                              <option key={n} value={n} className="bg-white dark:bg-slate-900">
                                {n} سانس
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const hasSevenToEight = draftRules.timeSlots.some(
                              (s) => s.startTime.trim() === '07:00' && s.endTime.trim() === '08:00'
                            );
                            if (hasSevenToEight) {
                              notify('error', 'تک‌ساعت ۰۷:۰۰ تا ۰۸:۰۰ از قبل در لیست سانس‌ها وجود دارد.');
                              return;
                            }
                            const sevenSlot = buildSevenToEightSlot();
                            const reordered = [
                              sevenSlot,
                              ...[...draftRules.timeSlots].sort((a, b) => a.order - b.order),
                            ].map((s, idx) => ({ ...s, order: idx }));
                            setDraftRules((prev) => ({ ...prev, timeSlots: reordered }));
                            notify('success', 'تک‌ساعت ۷ تا ۸ صبح به ابتدای جدول اضافه شد. برای ثبت نهایی ذخیره کنید.');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-violet-100 dark:bg-violet-950/50 text-violet-800 dark:text-violet-200 border border-violet-300 dark:border-violet-700 font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3" />
                          <span>+ افزودن تک‌ساعت ۷ تا ۸ صبح</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftRules((prev) => ({
                              ...prev,
                              timeSlots: buildDefaultTimeSlots(6, 8, 2),
                            }))
                          }
                          className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold cursor-pointer"
                        >
                          بازنشانی به ۶ سانس (۸ تا ۲۰)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const nextOrder = draftRules.timeSlots.length + 1;
                            const newSlot: SchedTimeSlot = {
                              id: `slot_${Date.now()}`,
                              label: getSchedSlotOrdinalLabel(nextOrder - 1),
                              startTime: '18:00',
                              endTime: '20:00',
                              order: nextOrder,
                            };
                            setDraftRules((prev) => ({
                              ...prev,
                              timeSlots: [...prev.timeSlots, newSlot],
                            }));
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold hover:bg-teal-600 hover:text-white cursor-pointer"
                        >
                          + افزودن سانس
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {[...draftRules.timeSlots]
                      .sort((a, b) => a.order - b.order)
                      .map((slot, sIdx, arr) => {
                        const dur = getSlotDurationHours(slot);
                        const moveSlot = (dir: -1 | 1) => {
                          const targetIdx = sIdx + dir;
                          if (targetIdx < 0 || targetIdx >= arr.length) return;
                          const copy = [...arr];
                          const [moved] = copy.splice(sIdx, 1);
                          copy.splice(targetIdx, 0, moved);
                          setDraftRules((prev) => ({
                            ...prev,
                            timeSlots: copy.map((s, idx) => ({ ...s, order: idx + 1 })),
                          }));
                        };
                        return (
                          <div
                            key={slot.id}
                            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <input
                                type="text"
                                disabled={!isSystemAdmin}
                                value={slot.label}
                                placeholder={getSchedSlotOrdinalLabel(sIdx)}
                                onChange={(e) =>
                                  setDraftRules((prev) => ({
                                    ...prev,
                                    timeSlots: prev.timeSlots.map((s) =>
                                      s.id === slot.id ? { ...s, label: e.target.value } : s
                                    ),
                                  }))
                                }
                                onBlur={() => {
                                  if (!slot.label.trim()) {
                                    setDraftRules((prev) => ({
                                      ...prev,
                                      timeSlots: prev.timeSlots.map((s) =>
                                        s.id === slot.id
                                          ? { ...s, label: getSchedSlotOrdinalLabel(sIdx) }
                                          : s
                                      ),
                                    }));
                                  }
                                }}
                                className="font-bold bg-white/80 dark:bg-slate-900/70 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:outline-none w-full"
                              />
                              {isSystemAdmin && (
                                <div className="inline-flex items-center gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    disabled={sIdx === 0}
                                    onClick={() => moveSlot(-1)}
                                    title="انتقال به جلو"
                                    className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={sIdx === arr.length - 1}
                                    onClick={() => moveSlot(1)}
                                    title="انتقال به عقب"
                                    className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                  {draftRules.timeSlots.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDraftRules((prev) => ({
                                          ...prev,
                                          timeSlots: prev.timeSlots.filter((s) => s.id !== slot.id),
                                        }))
                                      }
                                      className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 font-mono" dir="ltr">
                                <input
                                  type="text"
                                  disabled={!isSystemAdmin}
                                  value={slot.startTime}
                                  onChange={(e) =>
                                    setDraftRules((prev) => ({
                                      ...prev,
                                      timeSlots: prev.timeSlots.map((s) =>
                                        s.id === slot.id ? { ...s, startTime: e.target.value } : s
                                      ),
                                    }))
                                  }
                                  className="w-16 px-1.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                                />
                                <span>-</span>
                                <input
                                  type="text"
                                  disabled={!isSystemAdmin}
                                  value={slot.endTime}
                                  onChange={(e) =>
                                    setDraftRules((prev) => ({
                                      ...prev,
                                      timeSlots: prev.timeSlots.map((s) =>
                                        s.id === slot.id ? { ...s, endTime: e.target.value } : s
                                      ),
                                    }))
                                  }
                                  className="w-16 px-1.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                                />
                              </div>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                  dur <= 1
                                    ? 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200'
                                    : 'bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                                }`}
                              >
                                {dur} ساعته
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* تنظیمات بازه زمانی اعلام حضور و عدم امکان حضور اساتید */}
                {(() => {
                  const defaultWin = buildDefaultProfessorAvailabilityWindowDates();
                  const winCfg = draftRules.professorAvailabilityWindow || {
                    enabled: false,
                    startDate: defaultWin.startDate,
                    startTime: defaultWin.startTime,
                    endDate: defaultWin.endDate,
                    endTime: defaultWin.endTime,
                    note: '',
                  };
                  const draftWinStatus = getProfessorAvailabilityWindowStatus(
                    { ...draftRules, professorAvailabilityWindow: winCfg },
                    new Date()
                  );
                  const updateWinCfg = (
                    patch: Partial<NonNullable<SchedRulesSettings['professorAvailabilityWindow']>>
                  ) => {
                    setDraftRules((prev) => ({
                      ...prev,
                      professorAvailabilityWindow: {
                        ...(prev.professorAvailabilityWindow || winCfg),
                        ...patch,
                      },
                    }));
                  };
                  const applyWinPreset = (daysCount: number) => {
                    const today = getTodayJalali();
                    const sDate = formatJalaliDate(today.jy, today.jm, today.jd, 'en');
                    const eDate =
                      daysCount <= 0 ? sDate : addDaysToJalaliDate(sDate, daysCount, 'en') || sDate;
                    const nextWin = {
                      ...winCfg,
                      enabled: true,
                      startDate: sDate,
                      startTime: '00:00',
                      endDate: eDate,
                      endTime: '23:59',
                    };
                    const nextRules: SchedRulesSettings = {
                      ...draftRules,
                      professorAvailabilityWindow: nextWin,
                    };
                    setDraftRules(nextRules);
                    persistRules(nextRules);
                    notify(
                      'success',
                      `بازه زمانی اعلام حضور اساتید از ${sDate} تا ${eDate} (ساعت ۲۳:۵۹) فعال و ذخیره شد.`
                    );
                  };

                  return (
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-l from-teal-50/80 via-emerald-50/40 to-sky-50/60 dark:from-teal-950/30 dark:via-emerald-950/15 dark:to-sky-950/20 border border-teal-200 dark:border-teal-800 space-y-4 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-teal-200/70 dark:border-teal-800/60">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-xl bg-teal-600 text-white shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-black text-sm text-teal-950 dark:text-teal-100">
                              بازه زمانی اعلام روزها و سانس‌های حضور اساتید
                            </h3>
                            <p className="text-[11px] text-teal-800/85 dark:text-teal-300 mt-0.5 leading-relaxed">
                              پس از آماده شدن جدول سانس‌ها، در این بازه زمانی اساتید با ورود به پنل خود روزها و سانس‌های حضور و عدم حضورشان را ثبت می‌کنند. پس از اتمام مهلت، دسترسی به صورت خودکار بسته می‌شود و اساتیدی که ثبت نکرده باشند پیش‌فرض کل هفته آزاد هستند.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-lg font-black text-[11px] ${
                              draftWinStatus.isOpen
                                ? 'bg-emerald-600 text-white'
                                : draftWinStatus.status === 'expired'
                                ? 'bg-rose-600 text-white'
                                : draftWinStatus.status === 'not_started'
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-600 text-white'
                            }`}
                          >
                            {draftWinStatus.isOpen
                              ? `باز (${draftWinStatus.remainingText || 'فعال'})`
                              : draftWinStatus.status === 'expired'
                              ? 'پایان مهلت (خودکار بسته)'
                              : draftWinStatus.status === 'not_started'
                              ? 'در انتظار شروع'
                              : 'غیرفعال'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="inline-flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 cursor-pointer font-extrabold">
                          <input
                            type="checkbox"
                            checked={Boolean(winCfg.enabled)}
                            onChange={(e) => {
                              const nextWin = { ...winCfg, enabled: e.target.checked };
                              const nextRules = {
                                ...draftRules,
                                professorAvailabilityWindow: nextWin,
                              };
                              setDraftRules(nextRules);
                              persistRules(nextRules);
                            }}
                            className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                          />
                          <span>فعال‌سازی دسترسی اساتید برای ثبت ساعات حضور و عدم حضور</span>
                        </label>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => applyWinPreset(0)}
                            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 font-bold hover:bg-teal-50 cursor-pointer"
                          >
                            فقط امروز تا ۲۳:۵۹
                          </button>
                          <button
                            type="button"
                            onClick={() => applyWinPreset(3)}
                            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 font-bold hover:bg-teal-50 cursor-pointer"
                          >
                            شروع فوری تا ۳ روز
                          </button>
                          <button
                            type="button"
                            onClick={() => applyWinPreset(7)}
                            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 font-bold hover:bg-teal-50 cursor-pointer"
                          >
                            شروع فوری تا ۷ روز
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-700 dark:text-slate-200 block">
                            تاریخ شروع (شمسی):
                          </span>
                          <PersianDatePicker
                            digits="en"
                            dir="ltr"
                            placeholder="1404/11/10"
                            value={winCfg.startDate || ''}
                            onChange={(val) => updateWinCfg({ startDate: val })}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="font-bold text-slate-700 dark:text-slate-200 block">
                            ساعت شروع:
                          </span>
                          <PersianTimePicker
                            digits="en"
                            placeholder="08:00"
                            value={winCfg.startTime || ''}
                            onChange={(val) => updateWinCfg({ startTime: val })}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="font-bold text-slate-700 dark:text-slate-200 block">
                            تاریخ پایان مهلت (شمسی):
                          </span>
                          <PersianDatePicker
                            digits="en"
                            dir="ltr"
                            placeholder="1404/11/15"
                            value={winCfg.endDate || ''}
                            onChange={(val) => updateWinCfg({ endDate: val })}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="font-bold text-slate-700 dark:text-slate-200 block">
                            ساعت پایان مهلت:
                          </span>
                          <PersianTimePicker
                            digits="en"
                            placeholder="23:59"
                            value={winCfg.endTime || ''}
                            onChange={(val) => updateWinCfg({ endTime: val })}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <label className="sm:col-span-2 space-y-1">
                          <span className="font-bold text-slate-700 dark:text-slate-200 block">
                            پیام یا راهنمای مدیر سامانه برای اساتید (اختیاری):
                          </span>
                          <input
                            type="text"
                            value={winCfg.note || ''}
                            onChange={(e) => updateWinCfg({ note: e.target.value })}
                            placeholder="مثال: اساتید محترم لطفاً تا پایان مهلت تعیین‌شده روزها و سانس‌های حضور خود را نهایی نمایید."
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            persistRules(draftRules);
                            notify('success', 'تنظیمات بازه زمانی حضور اساتید ذخیره و اعمال شد.');
                          }}
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold cursor-pointer"
                        >
                          ذخیره فوری بازه اساتید
                        </button>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-teal-200/70 dark:border-teal-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {draftWinStatus.message}
                        </span>
                        <span className="font-extrabold text-teal-700 dark:text-teal-300 tabular-nums">
                          ثبت‌کرده: {profAvailStats.submitted.toLocaleString('fa-IR')} از{' '}
                          {profAvailStats.totalActive.toLocaleString('fa-IR')} استاد فعال (
                          {profAvailStats.defaultOpen.toLocaleString('fa-IR')} نفر پیش‌فرض تمام هفته آزاد)
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* تنظیمات بازه امتحانات پایان ترم و سانس‌های امتحانی (ترم فعال) */}
                {(() => {
                  const draftExam = getExamSettingsForTerm(draftRules, activeTerm);
                  const updateDraftExam = (nextExam: SchedExamSettings) => {
                    setDraftRules((prev) => ({
                      ...prev,
                      examSettings: nextExam,
                      examSettingsByTerm: {
                        ...(prev.examSettingsByTerm || {}),
                        [activeTerm]: nextExam,
                      },
                    }));
                  };
                  return (
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-l from-violet-50/80 via-fuchsia-50/50 to-sky-50/60 dark:from-violet-950/30 dark:via-fuchsia-950/15 dark:to-sky-950/20 border border-violet-200 dark:border-violet-800 space-y-4 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-violet-200/70 dark:border-violet-800/60">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-xl bg-violet-600 text-white shrink-0">
                            <CalendarClock className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-black text-sm text-violet-950 dark:text-violet-100">
                              بازه امتحانات پایان ترم و سانس‌های امتحانی (ترم {activeTerm})
                            </h3>
                            <p className="text-[11px] text-violet-800/85 dark:text-violet-300 mt-0.5 leading-relaxed">
                              تاریخ شروع امتحانات را مشخص کنید تا روزهای امتحان (پیش‌فرض ۱۲ روزکاری ۲ هفته‌ای بدون جمعه‌ها با عنوان روز ۱ تا روز ۱۲ + تاریخ شمسی) و سانس‌های امتحان ساخته شوند. فقط دروس نظری دارای امتحان هستند.
                            </p>
                          </div>
                        </div>
                        {isSystemAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              const nextRules: SchedRulesSettings = {
                                ...draftRules,
                                examSettings: draftExam,
                                examSettingsByTerm: {
                                  ...(draftRules.examSettingsByTerm || {}),
                                  [activeTerm]: draftExam,
                                },
                              };
                              setDraftRules(nextRules);
                              persistRules(nextRules);
                              notify('success', `بازه و سانس‌های امتحانی ترم ${activeTerm} ذخیره شد.`);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-extrabold cursor-pointer shrink-0"
                          >
                            ذخیره تنظیمات امتحان ترم {activeTerm}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-700 dark:text-slate-200 block">
                            تاریخ شروع بازه امتحانات (شمسی):
                          </span>
                          <PersianDatePicker
                            digits="en"
                            dir="ltr"
                            placeholder="1404/10/20"
                            disabled={!isSystemAdmin}
                            value={draftExam.startDate}
                            onChange={(val) =>
                              updateDraftExam({ ...draftExam, startDate: val })
                            }
                            className="w-full px-3 py-1.5 rounded-lg border border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-900 font-mono text-center text-xs"
                          />
                        </div>
                        <label className="space-y-1">
                          <span className="font-bold text-slate-700 dark:text-slate-200 block">
                            روز شروع پیش‌فرض (در صورت نبود تاریخ):
                          </span>
                          <select
                            disabled={!isSystemAdmin}
                            value={draftExam.startDayOfWeek || 'saturday'}
                            onChange={(e) =>
                              updateDraftExam({
                                ...draftExam,
                                startDayOfWeek: e.target.value as SchedDayKey,
                              })
                            }
                            className="w-full px-3 py-1.5 rounded-lg border border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-900 font-bold"
                          >
                            {SCHED_DAYS_ORDER.map((dk) => (
                              <option key={dk} value={dk}>
                                {SCHED_DAY_LABELS[dk]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="space-y-1">
                          <span className="font-bold text-slate-700 dark:text-slate-200 block">
                            تعداد روزهای امتحانی:
                          </span>
                          <input
                            type="number"
                            min={1}
                            max={30}
                            disabled={!isSystemAdmin}
                            value={draftExam.daysCount}
                            onChange={(e) =>
                              updateDraftExam({
                                ...draftExam,
                                daysCount: Math.max(1, Math.min(30, Number(e.target.value) || 12)),
                              })
                            }
                            className="w-full px-3 py-1.5 rounded-lg border border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-900 font-mono text-center"
                          />
                        </label>
                        <div className="flex flex-col gap-2">
                          <label className="inline-flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              disabled={!isSystemAdmin}
                              checked={draftExam.skipFridays}
                              onChange={(e) =>
                                updateDraftExam({ ...draftExam, skipFridays: e.target.checked })
                              }
                              className="w-4 h-4 accent-violet-600 rounded"
                            />
                            <span>حذف خودکار روزهای جمعه</span>
                          </label>
                          {isSystemAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                const seq = buildExamDaysSequence({
                                  startDate: draftExam.startDate,
                                  startDayOfWeek: draftExam.startDayOfWeek,
                                  daysCount: draftExam.daysCount,
                                  skipFridays: draftExam.skipFridays,
                                  existingDays: draftExam.examDays,
                                });
                                updateDraftExam({ ...draftExam, examDays: seq });
                                notify('success', `${seq.length.toLocaleString('fa-IR')} روز امتحانی بر اساس تاریخ شروع بازتولید شد.`);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-violet-700 text-white font-extrabold text-[11px] cursor-pointer transition"
                            >
                              تولید / بروزرسانی خودکار روزهای امتحان
                            </button>
                          )}
                        </div>
                      </div>

                      {/* جدول روزهای امتحانی (روز ۱ تا روز N با تاریخ و عنوان) */}
                      <div className="space-y-2">
                        <div className="font-extrabold text-slate-800 dark:text-slate-200">
                          روزهای امتحانی تعریف‌شده ({draftExam.examDays.length.toLocaleString('fa-IR')} روز):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {draftExam.examDays.map((day, dIdx) => (
                            <div
                              key={day.id}
                              className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${
                                day.isActive
                                  ? 'bg-white dark:bg-slate-900 border-violet-200 dark:border-violet-800'
                                  : 'bg-slate-100/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-65'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="text"
                                  disabled={!isSystemAdmin}
                                  value={day.label}
                                  onChange={(e) =>
                                    updateDraftExam({
                                      ...draftExam,
                                      examDays: draftExam.examDays.map((x, i) =>
                                        i === dIdx ? { ...x, label: e.target.value } : x
                                      ),
                                    })
                                  }
                                  className="font-black text-xs bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 w-24"
                                />
                                <input
                                  type="text"
                                  disabled={!isSystemAdmin}
                                  value={day.weekdayLabel}
                                  onChange={(e) =>
                                    updateDraftExam({
                                      ...draftExam,
                                      examDays: draftExam.examDays.map((x, i) =>
                                        i === dIdx ? { ...x, weekdayLabel: e.target.value } : x
                                      ),
                                    })
                                  }
                                  className="text-[11px] font-bold bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 w-24 text-center"
                                />
                                <button
                                  type="button"
                                  disabled={!isSystemAdmin}
                                  onClick={() =>
                                    updateDraftExam({
                                      ...draftExam,
                                      examDays: draftExam.examDays.map((x, i) =>
                                        i === dIdx ? { ...x, isActive: !x.isActive } : x
                                      ),
                                    })
                                  }
                                  className={`px-2 py-1 rounded text-[10px] font-extrabold cursor-pointer ${
                                    day.isActive
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200'
                                  }`}
                                >
                                  {day.isActive ? 'فعال' : 'تعطیل'}
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500 shrink-0">تاریخ:</span>
                                <PersianDatePicker
                                  digits="en"
                                  dir="ltr"
                                  disabled={!isSystemAdmin}
                                  value={day.date}
                                  onChange={(val) =>
                                    updateDraftExam({
                                      ...draftExam,
                                      examDays: draftExam.examDays.map((x, i) =>
                                        i === dIdx ? { ...x, date: val } : x
                                      ),
                                    })
                                  }
                                  placeholder="1404/10/20"
                                  wrapperClassName="flex-1"
                                  className="w-full font-mono text-[11px] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* سانس‌های امتحانی */}
                      <div className="space-y-2 pt-2 border-t border-violet-200/70 dark:border-violet-800/60">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            سانس‌های برگزاری امتحانات:
                          </span>
                          {isSystemAdmin && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  updateDraftExam({
                                    ...draftExam,
                                    examSlots: buildDefaultExamSlots(),
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-[11px] cursor-pointer"
                              >
                                بازنشانی ۳ سانس پیش‌فرض
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextOrder = draftExam.examSlots.length + 1;
                                  const newEs: SchedExamSlot = {
                                    id: `exam_slot_${Date.now()}`,
                                    label: `سانس ${nextOrder.toLocaleString('fa-IR')} امتحان`,
                                    startTime: '16:30',
                                    endTime: '18:30',
                                    order: nextOrder,
                                  };
                                  updateDraftExam({
                                    ...draftExam,
                                    examSlots: [...draftExam.examSlots, newEs],
                                  });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-[11px] cursor-pointer"
                              >
                                + افزودن سانس امتحانی
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {[...draftExam.examSlots]
                            .sort((a, b) => a.order - b.order)
                            .map((es, esIdx, arr) => {
                              const moveExamSlot = (dir: -1 | 1) => {
                                const targetIdx = esIdx + dir;
                                if (targetIdx < 0 || targetIdx >= arr.length) return;
                                const copy = [...arr];
                                const [moved] = copy.splice(esIdx, 1);
                                copy.splice(targetIdx, 0, moved);
                                updateDraftExam({
                                  ...draftExam,
                                  examSlots: copy.map((s, idx) => ({ ...s, order: idx + 1 })),
                                });
                              };
                              return (
                                <div
                                  key={es.id}
                                  className="p-2.5 rounded-xl border border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900 space-y-1.5"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <input
                                      type="text"
                                      disabled={!isSystemAdmin}
                                      value={es.label}
                                      onChange={(e) =>
                                        updateDraftExam({
                                          ...draftExam,
                                          examSlots: draftExam.examSlots.map((x) =>
                                            x.id === es.id ? { ...x, label: e.target.value } : x
                                          ),
                                        })
                                      }
                                      className="font-bold bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 w-full"
                                    />
                                    {isSystemAdmin && (
                                      <div className="inline-flex items-center gap-0.5 shrink-0">
                                        <button
                                          type="button"
                                          disabled={esIdx === 0}
                                          onClick={() => moveExamSlot(-1)}
                                          className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                        >
                                          <ArrowUp className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={esIdx === arr.length - 1}
                                          onClick={() => moveExamSlot(1)}
                                          className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                        >
                                          <ArrowDown className="w-3 h-3" />
                                        </button>
                                        {draftExam.examSlots.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              updateDraftExam({
                                                ...draftExam,
                                                examSlots: draftExam.examSlots.filter(
                                                  (x) => x.id !== es.id
                                                ),
                                              })
                                            }
                                            className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 font-mono" dir="ltr">
                                    <input
                                      type="text"
                                      disabled={!isSystemAdmin}
                                      value={es.startTime}
                                      onChange={(e) =>
                                        updateDraftExam({
                                          ...draftExam,
                                          examSlots: draftExam.examSlots.map((x) =>
                                            x.id === es.id
                                              ? { ...x, startTime: e.target.value }
                                              : x
                                          ),
                                        })
                                      }
                                      className="w-16 px-1.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center"
                                    />
                                    <span>-</span>
                                    <input
                                      type="text"
                                      disabled={!isSystemAdmin}
                                      value={es.endTime}
                                      onChange={(e) =>
                                        updateDraftExam({
                                          ...draftExam,
                                          examSlots: draftExam.examSlots.map((x) =>
                                            x.id === es.id
                                              ? { ...x, endTime: e.target.value }
                                              : x
                                          ),
                                        })
                                      }
                                      className="w-16 px-1.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* کنترل انتشار و سطح دسترسی مشاهده «برنامه ترم» برای دانشجویان (ویژه مدیر سامانه) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-l from-indigo-50/80 via-sky-50/70 to-teal-50/70 dark:from-indigo-950/30 dark:via-sky-950/20 dark:to-teal-950/20 border border-indigo-200 dark:border-indigo-800 space-y-4 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-200/70 dark:border-indigo-800/60">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-indigo-950 dark:text-indigo-100">
                          انتشار و دسترسی مشاهده «برنامه ترم» برای دانشجویان
                        </h3>
                        <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300 mt-0.5 leading-relaxed">
                          دکمه «برنامه ترم» همواره در پنل دانشجویان نمایش داده می‌شود، اما صرفاً زمانی فعال می‌گردد که مدیر سامانه تیک انتشار را فعال کرده و محدوده نمایش را تعیین نماید.
                        </p>
                      </div>
                    </div>
                    <span
                      className={`self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black border shrink-0 ${
                        draftRules.studentAccessEnabled
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700'
                          : 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-700'
                      }`}
                    >
                      {draftRules.studentAccessEnabled ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>منتشر شده (فعال برای دانشجویان)</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>غیرفعال (بسته در پنل دانشجویان)</span>
                        </>
                      )}
                    </span>
                  </div>

                  {!isSystemAdmin && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px] font-bold">
                      تغییر وضعیت انتشار و تعیین محدوده دسترسی دانشجویان به «برنامه ترم» صرفاً توسط «مدیر کل سامانه» قابل انجام است.
                    </div>
                  )}

                  {/* تیک فعال‌سازی انتشار برای دانشجویان */}
                  <label
                    className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition ${
                      isSystemAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
                    } ${
                      draftRules.studentAccessEnabled
                        ? 'bg-white dark:bg-slate-900 border-emerald-400 dark:border-emerald-700 shadow-xs'
                        : 'bg-white/80 dark:bg-slate-900/70 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        disabled={!isSystemAdmin}
                        checked={Boolean(draftRules.studentAccessEnabled)}
                        onChange={(e) => {
                          if (!isSystemAdmin) return;
                          const checked = e.target.checked;
                          const next: SchedRulesSettings = {
                            ...draftRules,
                            studentAccessEnabled: checked,
                            studentAccessScope: draftRules.studentAccessScope || 'own_cohort',
                            studentPublishedTerms:
                              draftRules.studentPublishedTerms &&
                              draftRules.studentPublishedTerms.length > 0
                                ? draftRules.studentPublishedTerms
                                : [activeTerm],
                          };
                          setDraftRules(next);
                          persistRules(next);
                          notify(
                            'success',
                            checked
                              ? 'دسترسی دانشجویان به دکمه «برنامه ترم» فعال و منتشر شد.'
                              : 'دسترسی دانشجویان به «برنامه ترم» غیرفعال (قفل) شد.'
                          );
                        }}
                        className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                      />
                      <div>
                        <div className="font-black text-slate-900 dark:text-white">
                          فعال‌سازی و انتشار دسترسی مشاهده «برنامه ترم» برای دانشجویان
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          در صورت عدم انتخاب این گزینه، دکمه برنامه ترم در کاربری دانشجویان به‌صورت قفل و غیرفعال خواهد بود.
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* تعیین محدوده مجاز مشاهده برنامه توسط دانشجویان */}
                  <div className="space-y-2">
                    <div className="font-extrabold text-slate-900 dark:text-white">
                      محدوده مجاز مشاهده برنامه برای دانشجویان:
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {(
                        [
                          {
                            value: 'own_cohort' as StudentScheduleAccessScope,
                            title: 'فقط رشته و ورودی خود دانشجو',
                            desc: 'هر دانشجو منحصراً برنامه رشته تحصیلی و سال ورودی ثبت‌شده در پرونده خود (و دروس مشترک مربوطه) را می‌بیند.',
                            icon: Users,
                          },
                          {
                            value: 'own_major' as StudentScheduleAccessScope,
                            title: 'کل ورودی‌های رشته خود دانشجو',
                            desc: 'هر دانشجو برنامه تمامی ورودی‌ها و شعبه‌های رشته تحصیلی خودش را با امکان فیلتر ورودی مشاهده می‌کند.',
                            icon: Eye,
                          },
                          {
                            value: 'all_programs' as StudentScheduleAccessScope,
                            title: 'برنامه جامع کل رشته‌ها و ورودی‌ها',
                            desc: 'دانشجو امکان مشاهده کل برنامه دانشگاهی همه رشته‌ها و ورودی‌ها را با قابلیت جستجو و فیلتر دارد.',
                            icon: Globe,
                          },
                        ] as const
                      ).map((opt) => {
                        const Icon = opt.icon;
                        const active = (draftRules.studentAccessScope || 'own_cohort') === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={!isSystemAdmin}
                            onClick={() => {
                              if (!isSystemAdmin) return;
                              const next: SchedRulesSettings = {
                                ...draftRules,
                                studentAccessScope: opt.value,
                              };
                              setDraftRules(next);
                              persistRules(next);
                              notify('success', `محدوده مشاهده دانشجویان به «${opt.title}» تغییر یافت.`);
                            }}
                            className={`p-3 rounded-xl border text-right transition space-y-1.5 ${
                              isSystemAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
                            } ${
                              active
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-black text-xs">{opt.title}</span>
                              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-indigo-600'}`} />
                            </div>
                            <div
                              className={`text-[10.5px] leading-relaxed ${
                                active ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {opt.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ترم‌های منتشرشده برای دانشجویان */}
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        نیمسال‌های قابل مشاهده برای دانشجویان:
                      </span>
                      {isSystemAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            const next: SchedRulesSettings = {
                              ...draftRules,
                              studentPublishedTerms: [activeTerm],
                            };
                            setDraftRules(next);
                            persistRules(next);
                            notify('success', `تنها ترم فعال (${activeTerm}) برای دانشجویان منتشر شد.`);
                          }}
                          className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:underline cursor-pointer"
                        >
                          تنظیم صرفاً روی ترم فعال ({activeTerm})
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {draftRules.availableTerms.map((termItem) => {
                        const publishedList =
                          draftRules.studentPublishedTerms &&
                          draftRules.studentPublishedTerms.length > 0
                            ? draftRules.studentPublishedTerms
                            : [activeTerm];
                        const isChecked = publishedList.includes(termItem);
                        return (
                          <button
                            key={termItem}
                            type="button"
                            disabled={!isSystemAdmin}
                            onClick={() => {
                              if (!isSystemAdmin) return;
                              const nextTerms = isChecked
                                ? publishedList.filter((t) => t !== termItem)
                                : [...publishedList, termItem];
                              const finalTerms =
                                nextTerms.length > 0 ? nextTerms : [activeTerm];
                              const next: SchedRulesSettings = {
                                ...draftRules,
                                studentPublishedTerms: finalTerms,
                              };
                              setDraftRules(next);
                              persistRules(next);
                            }}
                            className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition ${
                              isSystemAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
                            } ${
                              isChecked
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            ترم {termItem} {termItem === activeTerm ? '(فعال)' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* پشتیبان‌گیری، تخلیه جدول برنامه و پاک‌سازی موردی یا کامل داده‌های برنامه‌ریزی */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 p-5 space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white shrink-0">
                      <Database className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        پشتیبان‌گیری (بکاپ JSON)، تخلیه برنامه و پاک‌سازی اطلاعات سامانه
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        پیش از شروع ترم جدید، اصلاح اطلاعات پایه یا پاک‌سازی، می‌توانید نسخه پشتیبان کامل دانلود کنید و در صورت نیاز مجدداً بازیابی نمایید.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadSchedBackup}
                      className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود پشتیبان کامل (JSON)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => restoreInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>بازیابی از فایل پشتیبان</span>
                    </button>
                    <input
                      ref={restoreInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleRestoreSchedBackup}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* تخلیه جدول برنامه درسی (با حفظ اطلاعات پایه) */}
                <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-2.5">
                  <div className="font-black text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    <span>تخلیه جدول برنامه درسی (با حفظ کلاس‌ها، اساتید، رشته‌ها و سرفصل دروس)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDangerActionModal('clear_term_schedule')}
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 font-extrabold cursor-pointer"
                    >
                      خالی کردن جدول برنامه ترم {activeTerm} ({termOfferings.length.toLocaleString('fa-IR')} درس)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDangerActionModal('clear_all_schedules')}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold cursor-pointer"
                    >
                      حذف برنامه‌های درسی همه ترم‌ها ({offerings.length.toLocaleString('fa-IR')} درس)
                    </button>
                  </div>
                </div>

                {/* پاک‌سازی موردی و پاک‌سازی کامل */}
                <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 space-y-3">
                  <div className="font-black text-rose-950 dark:text-rose-100 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>پاک‌سازی موردی اطلاعات پایه یا پاک‌سازی کامل کل سامانه</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDangerActionModal('clear_classrooms')}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 hover:bg-rose-100 font-bold cursor-pointer"
                    >
                      پاک کردن کلاس‌های فیزیکی ({classrooms.length.toLocaleString('fa-IR')})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDangerActionModal('clear_professors')}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 hover:bg-rose-100 font-bold cursor-pointer"
                    >
                      پاک کردن لیست اساتید ({professors.length.toLocaleString('fa-IR')})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDangerActionModal('clear_courses')}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 hover:bg-rose-100 font-bold cursor-pointer"
                    >
                      پاک کردن سرفصل دروس ({courses.length.toLocaleString('fa-IR')})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDangerActionModal('clear_programs')}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 hover:bg-rose-100 font-bold cursor-pointer"
                    >
                      پاک کردن رشته‌ها و شعب ({programs.length.toLocaleString('fa-IR')})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDangerActionModal('clear_comments_history')}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 hover:bg-rose-100 font-bold cursor-pointer"
                    >
                      پاک کردن یادداشت‌ها و تاریخچه ({cellComments.length.toLocaleString('fa-IR')})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDangerActionModal('clear_everything')}
                      className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black cursor-pointer mr-auto"
                    >
                      پاک‌سازی کامل کل اطلاعات سامانه
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ۶.۲ مسدودسازی و قفل‌گذاری تغییرات برنامه (فقط مدیر سامانه) */}
          {section === 'locks' && isSystemAdmin && (() => {
            const locks = rules.programLocks || {
              lockAllChanges: false,
              lockMessage: '',
              lockedMajorCodes: [],
              lockedDays: [],
              lockedSlotIds: [],
              lockedDeptHeadIds: [],
              lockedAcademicDeputyIds: [],
              lockedExpertIds: [],
              blockedViewUserIds: [],
            };
            const updateLocks = (
              patch: Partial<NonNullable<SchedRulesSettings['programLocks']>>
            ) => {
              const nextLocks = { ...locks, ...patch };
              const nextRules: SchedRulesSettings = {
                ...rules,
                programLocks: nextLocks,
              };
              setDraftRules(nextRules);
              persistRules(nextRules);
            };
            const toggleArrayItem = <T,>(arr: T[] | undefined, val: T): T[] => {
              const base = arr || [];
              return base.includes(val) ? base.filter((x) => x !== val) : [...base, val];
            };

            return (
              <div className="space-y-4 max-w-5xl mx-auto text-xs">
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <Lock className="w-4 h-4 text-rose-600" />
                        <span>قفل و مسدودسازی دسترسی و تغییرات برنامه (مدیران گروه، کارشناسان و معاونت)</span>
                      </h2>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        مدیر کل سامانه در هر شرایطی دسترسی کامل دارد. در این بخش می‌توانید تغییرات کل یا بخشی از برنامه را مسدود کنید یا دسترسی ویرایش و حتی مشاهده کامل برنامه را برای هر مدیر گروه، کارشناس آموزش یا معاون آموزشی ببندید.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateLocks({
                          lockAllChanges: false,
                          lockedMajorCodes: [],
                          lockedDays: [],
                          lockedSlotIds: [],
                          lockedDeptHeadIds: [],
                          lockedAcademicDeputyIds: [],
                          lockedExpertIds: [],
                          blockedViewUserIds: [],
                        });
                        notify('success', 'تمام قفل‌ها و محدودیت‌های ویرایش و مشاهده برنامه آزاد شدند.');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold cursor-pointer shrink-0"
                    >
                      باز کردن همه قفل‌ها
                    </button>
                  </div>

                  {/* نوار اقدام سریع گردش‌کار اعلام حضور اساتید و باز کردن دسترسی مدیران گروه */}
                  <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/25 border border-teal-200 dark:border-teal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-black text-teal-950 dark:text-teal-100">
                        آماده‌سازی دسترسی مرحله‌ای (اساتید ← مدیران گروه)
                      </div>
                      <div className="text-[11px] text-teal-800 dark:text-teal-300 mt-0.5">
                        وضعیت بازه اساتید: <strong>{availWindowStatus.message}</strong>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSection('rules')}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 font-bold cursor-pointer"
                      >
                        تنظیم بازه اساتید
                      </button>
                      <button
                        type="button"
                        onClick={handleToggleDeptHeadAccess}
                        className={`px-3.5 py-1.5 rounded-xl font-extrabold text-white cursor-pointer inline-flex items-center gap-1.5 ${
                          deptHeadAccessOpen
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-amber-600 hover:bg-amber-700'
                        }`}
                      >
                        {deptHeadAccessOpen ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>بستن دسترسی مدیران گروه</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>باز کردن یک‌کلیکی دسترسی مدیران گروه</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* قفل سراسری کل برنامه */}
                  <label
                    className={`flex items-center justify-between gap-3 p-4 rounded-xl border cursor-pointer transition ${
                      locks.lockAllChanges
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(locks.lockAllChanges)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          updateLocks({ lockAllChanges: checked });
                          notify(
                            'success',
                            checked
                              ? 'تغییرات کل برنامه درسی برای کاربران غیر از مدیر سامانه مسدود شد.'
                              : 'قفل سراسری برنامه برداشته شد.'
                          );
                        }}
                        className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                      />
                      <div>
                        <div className="font-black text-slate-900 dark:text-white">
                          مسدودسازی کامل تغییرات کل برنامه (بستن کامل برنامه پس از اتمام مهلت)
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          با فعال‌سازی این گزینه، هیچ مدیر گروه یا کاربری غیر از مدیر سامانه نمی‌تواند درسی اضافه، جابجا، ویرایش یا حذف کند.
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black shrink-0 ${
                        locks.lockAllChanges
                          ? 'bg-rose-600 text-white'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {locks.lockAllChanges ? 'بسته شده' : 'باز'}
                    </span>
                  </label>

                  {/* پیام اختصاصی قفل */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-200 block">
                      پیام نمایشی هنگام مسدود بودن تغییر (اختیاری):
                    </label>
                    <input
                      type="text"
                      value={locks.lockMessage || ''}
                      onChange={(e) => updateLocks({ lockMessage: e.target.value })}
                      placeholder="مثال: با اتمام زمان ارائه دروس، برنامه بسته شده است و هرگونه تغییر می‌بایست به اطلاع کارشناسان برسد."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  {/* قفل رشته‌ها */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="font-extrabold text-slate-900 dark:text-white">
                      مسدودسازی ویرایش رشته‌های خاص:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {uniqueMajors.map((m) => {
                        const locked = locks.lockedMajorCodes?.includes(m.majorCode);
                        return (
                          <button
                            key={m.majorCode}
                            type="button"
                            onClick={() =>
                              updateLocks({
                                lockedMajorCodes: toggleArrayItem(
                                  locks.lockedMajorCodes,
                                  m.majorCode
                                ),
                              })
                            }
                            className={`px-3 py-1.5 rounded-xl border font-bold inline-flex items-center gap-1.5 cursor-pointer transition ${
                              locked
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {locked && <Lock className="w-3 h-3" />}
                            <span>
                              {m.majorName} ({m.majorCode})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* قفل روزهای هفته */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="font-extrabold text-slate-900 dark:text-white">
                      مسدودسازی ویرایش روزهای خاص هفته:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeDays.map((d) => {
                        const locked = locks.lockedDays?.includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() =>
                              updateLocks({
                                lockedDays: toggleArrayItem(locks.lockedDays, d),
                              })
                            }
                            className={`px-3 py-1.5 rounded-xl border font-bold inline-flex items-center gap-1.5 cursor-pointer transition ${
                              locked
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {locked && <Lock className="w-3 h-3" />}
                            <span>{SCHED_DAY_LABELS[d]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* قفل سانس‌های زمانی */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="font-extrabold text-slate-900 dark:text-white">
                      مسدودسازی ویرایش سانس‌های زمانی خاص:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sortedSlots.map((slot, sIdx) => {
                        const locked = locks.lockedSlotIds?.includes(slot.id);
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() =>
                              updateLocks({
                                lockedSlotIds: toggleArrayItem(locks.lockedSlotIds, slot.id),
                              })
                            }
                            className={`px-3 py-1.5 rounded-xl border font-bold inline-flex items-center gap-1.5 cursor-pointer transition ${
                              locked
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {locked && <Lock className="w-3 h-3" />}
                            <span>
                              {getSchedSlotTitle(slot, sIdx)} ({slot.startTime}-{slot.endTime})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* مسدودسازی دسترسی ویرایش و مشاهده برای مدیران گروه، کارشناسان آموزش و معاونان آموزشی */}
                  {(deptHeadUsers.length > 0 || academicDeputyUsers.length > 0 || expertUsers.length > 0) && (
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="font-extrabold text-slate-900 dark:text-white">
                          مسدودسازی دسترسی ویرایش یا مشاهده برای هر مدیر گروه، کارشناس و معاون آموزشی:
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          «مسدودیت ویرایش» صرفاً مانع ثبت، حذف و جابجایی دروس توسط آن کاربر می‌شود؛ اما «مسدودیت مشاهده کامل» ورود کاربر به جداول برنامه جامع، استودیو و گزارش‌ها را به‌طور کامل می‌بندد.
                        </p>
                      </div>

                      {deptHeadUsers.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-[11px] font-black text-indigo-700 dark:text-indigo-300">
                            مدیران گروه‌های آموزشی ({deptHeadUsers.length.toLocaleString('fa-IR')} نفر):
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {deptHeadUsers.map((head) => {
                              const editLocked = Boolean(locks.lockedDeptHeadIds?.includes(head.id));
                              const viewBlocked = Boolean(locks.blockedViewUserIds?.includes(head.id));
                              return (
                                <div
                                  key={head.id}
                                  className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 transition ${
                                    viewBlocked
                                      ? 'bg-rose-50/90 dark:bg-rose-950/35 border-rose-300 dark:border-rose-800'
                                      : editLocked
                                      ? 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-300 dark:border-amber-800'
                                      : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className="font-extrabold text-slate-900 dark:text-white truncate">
                                      {head.fullName}
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                      رشته‌ها: {head.assignedFields || '---'}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateLocks({
                                          lockedDeptHeadIds: toggleArrayItem(
                                            locks.lockedDeptHeadIds,
                                            head.id
                                          ),
                                        })
                                      }
                                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition ${
                                        editLocked
                                          ? 'bg-amber-600 text-white border-amber-600'
                                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                                      }`}
                                      title="مسدود کردن امکان تغییر یا جابجایی درس"
                                    >
                                      <Lock className="w-3 h-3" />
                                      <span>{editLocked ? 'ویرایش مسدود' : 'قفل ویرایش'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateLocks({
                                          blockedViewUserIds: toggleArrayItem(
                                            locks.blockedViewUserIds,
                                            head.id
                                          ),
                                        })
                                      }
                                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition ${
                                        viewBlocked
                                          ? 'bg-rose-600 text-white border-rose-600'
                                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                                      }`}
                                      title="مسدود کردن کامل مشاهده برنامه درسی"
                                    >
                                      <EyeOff className="w-3 h-3" />
                                      <span>{viewBlocked ? 'مشاهده مسدود' : 'مسدودیت مشاهده'}</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {expertUsers.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <div className="text-[11px] font-black text-sky-700 dark:text-sky-300">
                            کارشناسان آموزش ({expertUsers.length.toLocaleString('fa-IR')} نفر):
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {expertUsers.map((exp) => {
                              const editLocked = Boolean(locks.lockedExpertIds?.includes(exp.id));
                              const viewBlocked = Boolean(locks.blockedViewUserIds?.includes(exp.id));
                              return (
                                <div
                                  key={exp.id}
                                  className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 transition ${
                                    viewBlocked
                                      ? 'bg-rose-50/90 dark:bg-rose-950/35 border-rose-300 dark:border-rose-800'
                                      : editLocked
                                      ? 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-300 dark:border-amber-800'
                                      : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className="font-extrabold text-slate-900 dark:text-white truncate">
                                      {exp.fullName}
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                      رشته‌ها: {exp.assignedFields || '---'}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateLocks({
                                          lockedExpertIds: toggleArrayItem(
                                            locks.lockedExpertIds,
                                            exp.id
                                          ),
                                        })
                                      }
                                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition ${
                                        editLocked
                                          ? 'bg-amber-600 text-white border-amber-600'
                                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                                      }`}
                                      title="مسدود کردن امکان تغییر یا جابجایی درس"
                                    >
                                      <Lock className="w-3 h-3" />
                                      <span>{editLocked ? 'ویرایش مسدود' : 'قفل ویرایش'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateLocks({
                                          blockedViewUserIds: toggleArrayItem(
                                            locks.blockedViewUserIds,
                                            exp.id
                                          ),
                                        })
                                      }
                                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition ${
                                        viewBlocked
                                          ? 'bg-rose-600 text-white border-rose-600'
                                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                                      }`}
                                      title="مسدود کردن کامل مشاهده برنامه درسی"
                                    >
                                      <EyeOff className="w-3 h-3" />
                                      <span>{viewBlocked ? 'مشاهده مسدود' : 'مسدودیت مشاهده'}</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {academicDeputyUsers.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <div className="text-[11px] font-black text-teal-700 dark:text-teal-300">
                            معاونت‌های آموزشی ({academicDeputyUsers.length.toLocaleString('fa-IR')} نفر):
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {academicDeputyUsers.map((dep) => {
                              const editLocked = Boolean(
                                locks.lockedAcademicDeputyIds?.includes(dep.id)
                              );
                              const viewBlocked = Boolean(locks.blockedViewUserIds?.includes(dep.id));
                              return (
                                <div
                                  key={dep.id}
                                  className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 transition ${
                                    viewBlocked
                                      ? 'bg-rose-50/90 dark:bg-rose-950/35 border-rose-300 dark:border-rose-800'
                                      : editLocked
                                      ? 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-300 dark:border-amber-800'
                                      : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className="font-extrabold text-slate-900 dark:text-white truncate">
                                      {dep.fullName}
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                      {dep.title || 'معاونت آموزشی'}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateLocks({
                                          lockedAcademicDeputyIds: toggleArrayItem(
                                            locks.lockedAcademicDeputyIds,
                                            dep.id
                                          ),
                                        })
                                      }
                                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition ${
                                        editLocked
                                          ? 'bg-amber-600 text-white border-amber-600'
                                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                                      }`}
                                      title="مسدود کردن امکان تغییر یا ویرایش برنامه"
                                    >
                                      <Lock className="w-3 h-3" />
                                      <span>{editLocked ? 'ویرایش مسدود' : 'قفل ویرایش'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateLocks({
                                          blockedViewUserIds: toggleArrayItem(
                                            locks.blockedViewUserIds,
                                            dep.id
                                          ),
                                        })
                                      }
                                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition ${
                                        viewBlocked
                                          ? 'bg-rose-600 text-white border-rose-600'
                                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                                      }`}
                                      title="مسدود کردن کامل مشاهده برنامه درسی"
                                    >
                                      <EyeOff className="w-3 h-3" />
                                      <span>{viewBlocked ? 'مشاهده مسدود' : 'مسدودیت مشاهده'}</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ۶.۵ برنامه جامع و فراگیر (ماتریس شیت متمرکز همه رشته‌ها) */}
          {section === 'master_grid' && (
            <CourseSchedulingMasterGrid
              activeTerm={activeTerm}
              offerings={offerings}
              termOfferings={termOfferings}
              programs={programs}
              classrooms={classrooms}
              professors={professors}
              courses={courses}
              rules={rules}
              activeDays={activeDays}
              sortedSlots={sortedSlots}
              canManageMasterData={canManageMasterData}
              userRole={userRole}
              actor={actor}
              isOwnMajorName={isOwnMajorName}
              cellComments={cellComments}
              onPersistCellComments={persistCellComments}
              onCommitOfferings={commitOfferingsWithHistory}
              canUndo={historyState.undoStack.length > 0}
              canRedo={historyState.redoStack.length > 0}
              undoLabel={
                historyState.undoStack.length > 0
                  ? historyState.undoStack[historyState.undoStack.length - 1].label
                  : undefined
              }
              redoLabel={
                historyState.redoStack.length > 0
                  ? historyState.redoStack[historyState.redoStack.length - 1].label
                  : undefined
              }
              onUndo={handleUndoOfferings}
              onRedo={handleRedoOfferings}
              onOpenCommonExamModal={() => setCommonExamModalOpen(true)}
              onOpenNewOffering={(opts) => openNewOfferingModal(opts)}
              onOpenEditOffering={(o) => openEditOfferingModal(o)}
              onPersistRules={persistRules}
              onFullscreenContainerChange={setMasterFullscreenPortalEl}
              hasExternalModalOpen={offModalOpen || commonExamModalOpen}
              onCloseExternalModals={() => {
                setOffModalOpen(false);
                setCommonExamModalOpen(false);
              }}
              precomputedIndex={termSchedulingIndex}
              onOpenNewProfessorProposal={!isSystemAdmin ? () => setProposalModalOpen(true) : undefined}
              onNotify={notify}
            />
          )}

          {/* ۷. نمایش برنامه هفتگی و ثبت/مدیریت دروس ارائه‌شده */}
          {section === 'schedule' && (
            <div className="space-y-4">
              {/* نوار ابزار فیلتر و اقدام */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                      استودیو برنامه‌ریزی و ثبت دروس ترم <span className="font-mono">{activeTerm}</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ثبت درس برای رشته و ورودی، مشترک‌سازی با کد ۷ رقمی یکسان، تخصیص استاد و کلاس فیزیکی و پایش زنده تداخل‌ها
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openNewOfferingModal()}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>ثبت / ارائه درس جدید در برنامه</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommonExamModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span>امتحانات مشترک / عمومی</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSection('master_grid')}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>برنامه جامع و فراگیر</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSection('auto_wizard')}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>ویزارد چینش خودکار</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const rows = filteredScheduleOfferings.map((o) => {
                          const bd = calculateOfferingBreakdown(o, rules);
                          return {
                            'ترم': o.termKey,
                            'کد درس ۷ رقمی': o.courseCode,
                            'کد گروه': o.courseGroupCode || '-',
                            'کد گلستان (درس_گروه)': formatGolestanCourseCode(o.courseCode, o.courseGroupCode),
                            'نام درس': o.courseTitle,
                            'رشته میزبان': `${o.ownerMajorName} (${o.ownerMajorCode})`,
                            'ورودی': o.entryTerm,
                            'شعبه/گروه': o.sectionName || '-',
                            'رشته‌های مشترک':
                              o.sharedWithTargets
                                ?.map((t) => `${t.majorName} (${t.entryTerm})`)
                                .join('، ') || '-',
                            'تعداد دانشجو': o.enrolledCount,
                            'استاد': o.professorName || '-',
                            'کلاس فیزیکی اصلی': o.classroomName || '-',
                            'برنامه جلسات هفتگی': formatOfferingSessionsSummary(o, sortedSlots, true),
                            'زمان امتحان': isCourseEligibleForExam(o)
                              ? formatExamAssignmentShort(o, activeTermExamSettings) || 'تعیین‌نشده'
                              : 'ندارد (عملی/نظری-عملی)',
                            'واحد کل': bd.rawUnits,
                            'ساعت هفتگی': bd.weeklyHours,
                            'واحد معادل استاد': bd.equivalentUnits,
                          };
                        });
                        void exportJsonRowsToExcel(rows, 'برنامه ترم', `برنامه_درسی_ترم_${activeTerm}.xlsx`);
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>اکسل</span>
                    </button>
                  </div>
                </div>

                {/* فیلترها */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                  <select
                    value={schedMajorFilter}
                    onChange={(e) => {
                      setSchedMajorFilter(e.target.value);
                      setSchedCohortFilter('all');
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="all">همه رشته‌ها</option>
                    {uniqueMajors.map((m) => (
                      <option key={m.majorCode} value={m.majorCode}>
                        {m.majorName} ({m.majorCode})
                      </option>
                    ))}
                  </select>

                  <select
                    value={schedCohortFilter}
                    onChange={(e) => setSchedCohortFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="all">همه ورودی‌ها</option>
                    {programs
                      .filter(
                        (p) => schedMajorFilter === 'all' || p.majorCode === schedMajorFilter
                      )
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.majorName} - ورودی {p.entryTerm}
                        </option>
                      ))}
                  </select>

                  <select
                    value={schedRoomFilter}
                    onChange={(e) => setSchedRoomFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="all">همه کلاس‌های فیزیکی</option>
                    {classrooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>

                  <select
                    value={schedProfFilter}
                    onChange={(e) => setSchedProfFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="all">همه اساتید</option>
                    {professors.map((p) => {
                      const deptField = formatProfessorDepartmentAndField(p);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.fullName} (کد {p.professorCode}){deptField ? ` · ${deptField}` : ''}
                        </option>
                      );
                    })}
                  </select>

                  {!canManageMasterData && (
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={allowCrossMajorView}
                        onChange={(e) => setAllowCrossMajorView(e.target.checked)}
                        className="rounded text-teal-600"
                      />
                      <span>نمایش سایر رشته‌ها (برای دروس مشترک/بین‌رشته‌ای)</span>
                    </label>
                  )}

                  <div className="mr-auto flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSchedViewMode('matrix')}
                      className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                        schedViewMode === 'matrix'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      جدول هفتگی
                    </button>
                    <button
                      type="button"
                      onClick={() => setSchedViewMode('list')}
                      className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                        schedViewMode === 'list'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      لیست تفکیکی ({filteredScheduleOfferings.length})
                    </button>
                  </div>
                </div>
              </div>

              {schedViewMode === 'matrix' ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <table className="w-full text-xs border-collapse min-w-[820px]">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                        <th className="p-2.5 text-right font-extrabold w-28 border-l border-slate-200 dark:border-slate-700">
                          روز / سانس
                        </th>
                        {sortedSlots.map((slot, sIdx) => (
                          <th
                            key={slot.id}
                            className="p-2 text-center font-bold border-l border-slate-200 dark:border-slate-700 last:border-l-0"
                          >
                            <div>{getSchedSlotTitle(slot, sIdx)}</div>
                            <div
                              className="text-[10px] font-mono tabular-nums text-slate-500"
                              dir="ltr"
                            >
                              {slot.startTime} - {slot.endTime}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {activeDays.map((day) => (
                        <tr key={day}>
                          <td className="p-2.5 font-extrabold bg-slate-50/70 dark:bg-slate-800/40 border-l border-slate-200 dark:border-slate-700 align-top">
                            {SCHED_DAY_LABELS[day]}
                          </td>
                          {sortedSlots.map((slot) => {
                            const items = filteredScheduleOfferings.filter((o) =>
                              isOfferingAtDaySlot(o, day, slot.id)
                            );
                            return (
                              <td
                                key={slot.id}
                                className="p-1.5 align-top border-l border-slate-200 dark:border-slate-700 last:border-l-0 min-w-[155px]"
                              >
                                <div className="space-y-1.5">
                                  {items.map((o) => {
                                    const conf =
                                      termSchedulingIndex.conflictMap.get(o.id) ||
                                      detectOfferingConflicts(
                                        o,
                                        termOfferings,
                                        classrooms,
                                        professors,
                                        rules,
                                        termSchedulingIndex
                                      );
                                    const examLabel = isCourseEligibleForExam(o)
                                      ? formatExamAssignmentShort(o, activeTermExamSettings)
                                      : '';
                                    const hasExamWarn = conf.warnings.some((w) =>
                                      w.includes('تداخل امتحان')
                                    );
                                    const bd =
                                      termSchedulingIndex.breakdownMap.get(o.id) ||
                                      calculateOfferingBreakdown(o, rules);
                                    const comp =
                                      termSchedulingIndex.completenessMap.get(o.id) ||
                                      evaluateOfferingCompleteness(o, rules);
                                    const isProvisionalOrDisabled = comp.isEffectivelyInactive;
                                    const hoverIssues = [
                                      ...comp.missingItems,
                                      ...conf.errors,
                                    ];
                                    const sessHere = getOfferingSessions(o).find(
                                      (s) => s.dayOfWeek === day && s.slotIds.includes(slot.id)
                                    );
                                    const halfHere = getOfferingSessionSlotHalf(o, day, slot.id);
                                    const roomHere = getOfferingClassroomAtSession(o, sessHere);
                                    const golCode = formatGolestanCourseCode(
                                      o.courseCode,
                                      o.courseGroupCode
                                    );
                                    const allSessionsCount = getOfferingSessions(o).length;
                                      return (
                                        <div
                                          key={`${o.id}_${day}_${slot.id}`}
                                          onClick={() => openEditOfferingModal(o)}
                                          title={
                                            hoverIssues.length > 0
                                              ? `نواقص و خطاها:\n• ${hoverIssues.join('\n• ')}`
                                              : 'کلیک برای ویرایش درس'
                                          }
                                          className={`group/card relative p-2 rounded-xl border text-right cursor-pointer transition ${
                                            isProvisionalOrDisabled
                                              ? 'border-dashed border-2 border-amber-400 dark:border-amber-500 bg-amber-50/90 dark:bg-amber-950/35 opacity-80'
                                              : conf.hasHardConflict
                                              ? 'border-rose-400 bg-rose-50/80 dark:bg-rose-950/30'
                                              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:border-teal-500'
                                          }`}
                                        >
                                          {isProvisionalOrDisabled && (
                                            <div className="text-[9.5px] font-black text-amber-900 dark:text-amber-200 bg-amber-200/70 dark:bg-amber-900/50 px-1.5 py-0.5 rounded inline-flex items-center gap-1 mb-1">
                                              <AlertTriangle className="w-3 h-3 shrink-0" />
                                              <span>
                                                موقت / غیرفعال ({comp.scheduledHours.toLocaleString('fa-IR')}/
                                                {comp.requiredTableHours.toLocaleString('fa-IR')} س)
                                              </span>
                                            </div>
                                          )}
                                          <div className="font-bold text-slate-900 dark:text-white leading-snug">
                                            {o.courseTitle}
                                            {halfHere !== 'full' && (
                                              <span className="mr-1 text-[9.5px] px-1 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-bold">
                                                {halfHere === 'first_hour' ? '۱س راست' : '۱س چپ'}
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex flex-wrap items-center gap-1">
                                            <span className="font-bold text-indigo-700 dark:text-indigo-300" dir="ltr">
                                              {golCode}
                                            </span>
                                            <span>
                                              · {bd.rawUnits} واحد ({bd.weeklyHours} س)
                                            </span>
                                            {allSessionsCount > 1 && (
                                              <span className="px-1 rounded bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-200 font-sans font-bold">
                                                {allSessionsCount.toLocaleString('fa-IR')} جلسه
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">
                                            {o.ownerMajorName} ({o.entryTerm}
                                            {o.sectionName ? ` - ${o.sectionName}` : ''})
                                          </div>
                                          <div className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold">
                                            {o.professorName || 'بدون استاد'} ·{' '}
                                            {roomHere.classroomName ||
                                              (!isInternshipClassroomRequired(o)
                                                ? 'محل: مدرسه'
                                                : 'بدون کلاس')}
                                          </div>
                                          {o.sharedWithTargets && o.sharedWithTargets.length > 0 && (
                                            <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold mt-0.5">
                                              مشترک با {o.sharedWithTargets.length} گروه دیگر
                                            </div>
                                          )}
                                          {examLabel && (
                                            <div
                                              className={`text-[10px] font-bold mt-0.5 ${
                                                hasExamWarn
                                                  ? 'text-amber-700 dark:text-amber-300'
                                                  : 'text-violet-700 dark:text-violet-300'
                                              }`}
                                            >
                                              {hasExamWarn ? '⚠ ' : ''}امتحان: {examLabel}
                                            </div>
                                          )}
                                          {!isProvisionalOrDisabled && conf.hasHardConflict && (
                                            <div className="text-[10px] text-rose-600 font-extrabold mt-0.5">
                                              تداخل زمانی!
                                            </div>
                                          )}
                                          {hoverIssues.length > 0 && (
                                            <div className="hidden group-hover/card:block absolute z-40 right-0 top-full mt-1 w-64 p-2.5 rounded-xl bg-slate-900 text-white text-[10px] shadow-xl border border-amber-400/70 pointer-events-none space-y-1">
                                              <div className="font-black text-amber-300 flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                                <span>نواقص و خطاهای درس:</span>
                                              </div>
                                              <ul className="list-disc pr-4 space-y-0.5 text-slate-100 leading-relaxed">
                                                {hoverIssues.map((msg, idx) => (
                                                  <li key={idx}>{msg}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  <button
                                    type="button"
                                    onClick={() => openNewOfferingModal(day, slot.id)}
                                    className="w-full py-1 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-[10px] text-slate-400 hover:text-teal-600 hover:border-teal-500 transition cursor-pointer"
                                  >
                                    + ثبت در این سانس
                                  </button>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-right">
                        <th className="p-3">کد درس / گروه (گلستان)</th>
                        <th className="p-3">عنوان درس</th>
                        <th className="p-3">رشته، ورودی و شعبه</th>
                        <th className="p-3">استاد</th>
                        <th className="p-3">کلاس / جلسات هفتگی</th>
                        <th className="p-3 text-center">ساعت / واحد معادل</th>
                        <th className="p-3 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                      {filteredScheduleOfferings.map((o) => {
                        const bd =
                          termSchedulingIndex.breakdownMap.get(o.id) ||
                          calculateOfferingBreakdown(o, rules);
                        const conf =
                          termSchedulingIndex.conflictMap.get(o.id) ||
                          detectOfferingConflicts(
                            o,
                            termOfferings,
                            classrooms,
                            professors,
                            rules,
                            termSchedulingIndex
                          );
                        const examLabel = isCourseEligibleForExam(o)
                          ? formatExamAssignmentShort(o, activeTermExamSettings)
                          : '';
                        const examWarns = conf.warnings.filter((w) => w.includes('تداخل امتحان'));
                        const comp =
                          termSchedulingIndex.completenessMap.get(o.id) ||
                          evaluateOfferingCompleteness(o, rules);
                        const isProvisionalOrDisabled = comp.isEffectivelyInactive;
                        const hoverIssues = [...comp.missingItems, ...conf.errors];
                        return (
                          <tr
                            key={o.id}
                            title={
                              hoverIssues.length > 0
                                ? `نواقص و خطاها:\n• ${hoverIssues.join('\n• ')}`
                                : undefined
                            }
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                              isProvisionalOrDisabled ? 'bg-amber-50/75 dark:bg-amber-950/25 opacity-85' : ''
                            }`}
                          >
                            <td className="p-3 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                              <span dir="ltr">{formatGolestanCourseCode(o.courseCode, o.courseGroupCode)}</span>
                            </td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">
                              {o.courseTitle}
                              {isProvisionalOrDisabled && (
                                <div className="text-[10px] text-amber-800 dark:text-amber-200 font-black mt-0.5 space-y-0.5">
                                  <div>
                                    ⚠ موقت / غیرفعال ({comp.scheduledHours.toLocaleString('fa-IR')}/
                                    {comp.requiredTableHours.toLocaleString('fa-IR')} ساعت)
                                  </div>
                                  <div className="font-semibold text-[9.5px] text-amber-700 dark:text-amber-300">
                                    {comp.missingItems.join(' • ')}
                                  </div>
                                </div>
                              )}
                              {!isProvisionalOrDisabled && conf.hasHardConflict && (
                                <div className="text-[10px] text-rose-600 font-extrabold">
                                  دارای تداخل زمانی
                                </div>
                              )}
                              {examLabel && (
                                <div
                                  className={`text-[10px] font-bold mt-0.5 ${
                                    examWarns.length > 0
                                      ? 'text-amber-700 dark:text-amber-300'
                                      : 'text-violet-700 dark:text-violet-300'
                                  }`}
                                >
                                  امتحان: {examLabel}
                                  {examWarns.length > 0 ? ' (دارای اخطار تداخل امتحان)' : ''}
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <div>
                                {o.ownerMajorName} ({o.entryTerm}
                                {o.sectionName ? ` - ${o.sectionName}` : ''}) · {o.enrolledCount} نفر
                              </div>
                              {o.sharedWithTargets && o.sharedWithTargets.length > 0 && (
                                <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold">
                                  مشترک:{' '}
                                  {o.sharedWithTargets
                                    .map((t) => `${t.majorName} (${t.entryTerm})`)
                                    .join('، ')}
                                </div>
                              )}
                            </td>
                            <td className="p-3">{o.professorName || 'تعیین‌نشده'}</td>
                            <td className="p-3">
                              <div>
                                {o.classroomName ||
                                  (!isInternshipClassroomRequired(o) ? 'محل: مدرسه' : 'بدون کلاس')}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {formatOfferingSessionsSummary(o, sortedSlots, true)}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <strong>{bd.weeklyHours} س</strong> · {bd.equivalentUnits} معادل
                            </td>
                            <td className="p-3 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditOfferingModal(o)}
                                  className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const lockRes = checkScheduleEditLock(
                                      rules,
                                      userRole,
                                      actor.id,
                                      {
                                        majorCode: o.ownerMajorCode,
                                        dayOfWeek: o.dayOfWeek,
                                        slotIds: o.slotIds,
                                        sessions: getOfferingSessions(o),
                                      }
                                    );
                                    if (lockRes.locked) {
                                      notify(
                                        'error',
                                        lockRes.reason || 'امکان حذف در بخش مسدودشده وجود ندارد.'
                                      );
                                      return;
                                    }
                                    commitOfferingsWithHistory(
                                      offerings.filter((x) => x.id !== o.id),
                                      `حذف درس «${o.courseTitle}»`
                                    );
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-800 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ۸. ویزارد چینش هوشمند */}
          {section === 'auto_wizard' && (
            <div className="max-w-6xl mx-auto">
              <CourseSchedulingAutoWizard
                activeTerm={activeTerm}
                classrooms={classrooms}
                programs={programs}
                professors={professors}
                courses={courses}
                existingOfferings={offerings}
                rules={rules}
                actor={{ id: actor.id, name: actor.name, role: userRole }}
                allowedMajorFilter={canManageMasterData ? undefined : allowedMajorNames}
                onApplyScheduledOfferings={(newOfferings) => {
                  const lockedHit = newOfferings
                    .map((item) =>
                      checkScheduleEditLock(rules, userRole, actor.id, {
                        majorCode: item.ownerMajorCode,
                        dayOfWeek: item.dayOfWeek,
                        slotIds: item.slotIds,
                        sessions: getOfferingSessions(item),
                      })
                    )
                    .find((r) => r.locked);
                  if (lockedHit) {
                    notify(
                      'error',
                      lockedHit.reason ||
                        'برخی از دروس تولیدشده در بازه یا رشته مسدودشده قرار دارند و ثبت نشدند.'
                    );
                    return;
                  }
                  const normalizedNew = assignSequentialGolestanGroupCodes(
                    newOfferings.map(normalizeOfferingWithSessions),
                    termOfferings
                  );
                  commitOfferingsWithHistory(
                    [...offerings, ...normalizedNew],
                    `چینش هوشمند (${normalizedNew.length} درس)`
                  );
                  notify(
                    'success',
                    `${normalizedNew.length} درس تولیدشده توسط ویزارد هوشمند با کد گروه گلستان در برنامه ترم ${activeTerm} ثبت شد.`
                  );
                  setSection('schedule');
                }}
              />
            </div>
          )}

          {/* ۹. مرکز گزارش‌گیری */}
          {section === 'reports' && (
            <div className="max-w-7xl mx-auto">
              <CourseSchedulingReports
                termKey={activeTerm}
                offerings={offerings}
                classrooms={classrooms}
                programs={programs}
                professors={professors}
                rules={rules}
                canViewSensitiveProfInfo={canViewSensitiveProfInfo}
              />
            </div>
          )}
        </main>
      </div>
      )}

      {/* ================================================================= */}
      {/* مودال‌ها: کلاس فیزیکی، رشته، استاد، عدم حضور استاد، درس و ثبت ارائه */}
      {/* ================================================================= */}

      {roomModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm">
                {editingRoomId ? 'ویرایش کلاس فیزیکی' : 'افزودن کلاس فیزیکی جدید'}
              </h3>
              <button
                type="button"
                onClick={() => setRoomModalOpen(false)}
                className="p-1 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveRoom} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="font-bold">کد کلاس *</span>
                  <input
                    type="text"
                    required
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                    dir="ltr"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-bold">ظرفیت (نفر) *</span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={roomCap}
                    onChange={(e) => setRoomCap(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="font-bold">نام کلاس *</span>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="font-bold">نوع کلاس</span>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value as SchedClassroomType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {(Object.keys(SCHED_ROOM_TYPE_LABELS) as SchedClassroomType[]).map((k) => (
                      <option key={k} value={k}>
                        {SCHED_ROOM_TYPE_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="font-bold">ساختمان / طبقه</span>
                  <input
                    type="text"
                    value={roomBuilding}
                    onChange={(e) => setRoomBuilding(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold cursor-pointer"
              >
                ذخیره اطلاعات کلاس
              </button>
            </form>
          </div>
        </div>
      )}

      {progModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm">
                {editingProgId ? 'ویرایش رشته و ورودی' : 'افزودن رشته و ورودی جدید'}
              </h3>
              <button
                type="button"
                onClick={() => setProgModalOpen(false)}
                className="p-1 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveProgram} className="space-y-3 text-xs">
              {approvedMajors.length > 0 ? (
                <>
                  {(() => {
                    const matchedMajor = approvedMajors.find(
                      (m) =>
                        normalizeMajorCode(m.code) === normalizeMajorCode(progMajorCode) ||
                        m.name.trim() === progMajorName.trim()
                    );
                    const closest =
                      !matchedMajor && (progMajorName.trim() || progMajorCode.trim())
                        ? findClosestApprovedMajor(progMajorName, approvedMajors, progMajorCode)
                        : null;
                    return (
                      <div className="space-y-1.5">
                        <label className="block space-y-1">
                          <span className="font-bold">رشته تحصیلی مصوب (همراه با کد رشته) *</span>
                          <select
                            required
                            value={matchedMajor ? matchedMajor.id : ''}
                            onChange={(e) => {
                              const picked = approvedMajors.find((m) => m.id === e.target.value);
                              if (picked) {
                                setProgMajorCode(normalizeMajorCode(picked.code));
                                setProgMajorName(picked.name);
                              }
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          >
                            <option value="">-- انتخاب رشته تحصیلی مصوب --</option>
                            {approvedMajors.map((m) => (
                              <option key={m.id} value={m.id}>
                                {formatApprovedMajorLabel(m)}
                              </option>
                            ))}
                          </select>
                        </label>
                        {matchedMajor ? (
                          <div className="text-[10px] text-teal-700 dark:text-teal-300 font-bold">
                            کد رشته: {matchedMajor.code} • مقطع: {matchedMajor.degreeLevelName}
                          </div>
                        ) : progMajorName.trim() ? (
                          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 text-[10px] text-amber-800 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2">
                            <span>
                              مقدار قبلی: «{progMajorName}» ({progMajorCode})
                            </span>
                            {closest && (
                              <button
                                type="button"
                                onClick={() => {
                                  setProgMajorCode(normalizeMajorCode(closest.major.code));
                                  setProgMajorName(closest.major.name);
                                }}
                                className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold cursor-pointer"
                              >
                                تطبیق با «{closest.major.name}» ({closest.score}٪)
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })()}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="space-y-1">
                      <span className="font-bold">ورودی (مثلاً 4031) *</span>
                      <input
                        type="text"
                        required
                        value={progEntryTerm}
                        onChange={(e) => setProgEntryTerm(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                        dir="ltr"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">تعداد دانشجویان کل *</span>
                      <input
                        type="number"
                        min={1}
                        required
                        value={progTotalStudents}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setProgTotalStudents(raw);
                          const totalVal = Number(normalizeSchedCode(raw));
                          const countVal = Number(normalizeSchedCode(progSectionCount)) || progSections.length || 1;
                          if (Number.isFinite(totalVal) && totalVal > 0) {
                            setProgSections((prev) =>
                              distributeCohortSections(totalVal, countVal, prev)
                            );
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">تعداد شعبه‌ها *</span>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        required
                        value={progSectionCount}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setProgSectionCount(raw);
                          const countVal = Math.max(
                            1,
                            Math.min(20, Number(normalizeSchedCode(raw)) || 1)
                          );
                          const totalVal =
                            Number(normalizeSchedCode(progTotalStudents)) || countVal;
                          setProgSections((prev) =>
                            distributeCohortSections(totalVal, countVal, prev)
                          );
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      />
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1">
                      <span className="font-bold">کد رشته ۶ رقمی *</span>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={progMajorCode}
                        onChange={(e) => setProgMajorCode(e.target.value)}
                        placeholder="112233"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                        dir="ltr"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">ورودی (مثلاً 4031) *</span>
                      <input
                        type="text"
                        required
                        value={progEntryTerm}
                        onChange={(e) => setProgEntryTerm(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                        dir="ltr"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <label className="sm:col-span-2 space-y-1">
                      <span className="font-bold">نام رشته *</span>
                      <input
                        type="text"
                        required
                        value={progMajorName}
                        onChange={(e) => setProgMajorName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">تعداد دانشجویان کل *</span>
                      <input
                        type="number"
                        min={1}
                        required
                        value={progTotalStudents}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setProgTotalStudents(raw);
                          const totalVal = Number(normalizeSchedCode(raw));
                          const countVal = Number(normalizeSchedCode(progSectionCount)) || progSections.length || 1;
                          if (Number.isFinite(totalVal) && totalVal > 0) {
                            setProgSections((prev) =>
                              distributeCohortSections(totalVal, countVal, prev)
                            );
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">تعداد شعبه‌ها *</span>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        required
                        value={progSectionCount}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setProgSectionCount(raw);
                          const countVal = Math.max(
                            1,
                            Math.min(20, Number(normalizeSchedCode(raw)) || 1)
                          );
                          const totalVal =
                            Number(normalizeSchedCode(progTotalStudents)) || countVal;
                          setProgSections((prev) =>
                            distributeCohortSections(totalVal, countVal, prev)
                          );
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      />
                    </label>
                  </div>
                </>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-extrabold">شعب / گروه‌های این ورودی</span>
                    <span className="mr-2 text-[10.5px] font-bold text-slate-500">
                      (مجموع فعلی شعب:{' '}
                      {progSections.reduce((s, x) => s + (Number(x.studentCount) || 0), 0).toLocaleString('fa-IR')}{' '}
                      نفر)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const totalVal = Math.max(
                          1,
                          Number(normalizeSchedCode(progTotalStudents)) || 30
                        );
                        const countVal = Math.max(
                          1,
                          Math.min(20, Number(normalizeSchedCode(progSectionCount)) || progSections.length || 1)
                        );
                        setProgSections((prev) =>
                          distributeCohortSections(totalVal, countVal, prev)
                        );
                      }}
                      className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold cursor-pointer"
                    >
                      تقسیم خودکار بین شعب
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setProgSections((prev) => {
                          const next = [
                            ...prev,
                            {
                              id: `sec_${Date.now()}`,
                              name: `گروه ${prev.length + 1}`,
                              studentCount: 25,
                            },
                          ];
                          setProgSectionCount(String(next.length));
                          return next;
                        })
                      }
                      className="text-teal-600 font-bold hover:underline cursor-pointer"
                    >
                      + افزودن شعبه
                    </button>
                  </div>
                </div>
                {progSections.map((sec, idx) => (
                  <div key={sec.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={sec.name}
                      onChange={(e) =>
                        setProgSections((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                        )
                      }
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                    <input
                      type="number"
                      min={1}
                      value={sec.studentCount}
                      onChange={(e) =>
                        setProgSections((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, studentCount: Math.max(1, Number(e.target.value) || 1) } : x
                          )
                        )
                      }
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center"
                    />
                    {progSections.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setProgSections((prev) => {
                            const next = prev.filter((_, i) => i !== idx);
                            setProgSectionCount(String(Math.max(1, next.length)));
                            return next;
                          })
                        }
                        className="text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold cursor-pointer"
              >
                ذخیره اطلاعات رشته و ورودی
              </button>
            </form>
          </div>
        </div>
      )}

      {profModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-5 border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm">
                {editingProfId ? 'ویرایش مشخصات استاد' : 'ثبت استاد جدید (با تفکیک مقطع و رشته)'}
              </h3>
              <button
                type="button"
                onClick={() => setProfModalOpen(false)}
                className="p-1 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveProf} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold">شماره شناسایی / کد استاد *</span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextCode = getNextTemporaryProfessorCode(professors, professorProposals);
                        if (nextCode) setProfCode(nextCode);
                      }}
                      className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      کد موقت (new001)
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={profCode}
                    onChange={(e) => setProfCode(e.target.value)}
                    placeholder="کد گلستان یا new001 تا new999"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                    dir="ltr"
                  />
                  {editingProfId && isTemporaryProfessorCode(profCode) && (
                    <span className="block text-[10px] text-amber-700 dark:text-amber-300 font-bold">
                      کد موقت فعال است؛ تغییر این کد در تمام دروس برنامه‌ریزی‌شده به‌صورت خودکار اعمال می‌شود.
                    </span>
                  )}
                </label>
                <label className="space-y-1">
                  <span className="font-bold">نام استاد *</span>
                  <input
                    type="text"
                    required
                    value={profFirstName}
                    onChange={(e) => setProfFirstName(e.target.value)}
                    placeholder="مثلاً: علی"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-bold">نام خانوادگی استاد *</span>
                  <input
                    type="text"
                    required
                    value={profLastName}
                    onChange={(e) => setProfLastName(e.target.value)}
                    placeholder="مثلاً: محمدی"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="space-y-1">
                  <span className="font-bold">شماره ملی (رمز ورود پیش‌فرض) *</span>
                  <input
                    type="text"
                    required
                    value={profNationalId}
                    onChange={(e) => setProfNationalId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                    dir="ltr"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-bold">جنس</span>
                  <select
                    value={profGender}
                    onChange={(e) => setProfGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="">-- انتخاب --</option>
                    <option value="مرد">مرد</option>
                    <option value="زن">زن</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="font-bold">نام پدر</span>
                  <input
                    type="text"
                    value={profFatherName}
                    onChange={(e) => setProfFatherName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </label>
              </div>

              <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/25 border border-teal-200 dark:border-teal-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-extrabold text-teal-900 dark:text-teal-200">
                    مشخصات تحصیلی (به‌صورت مجزا: مقطع، رشته و گرایش)
                  </span>
                  <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300">
                    (رشته مدرک اساتید آزاد و مستثنی از رشته‌های مصوب دانشگاه است)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="space-y-1">
                    <span className="font-bold">مقطع / آخرین مدرک تحصیلی</span>
                    <input
                      type="text"
                      list="prof-degree-level-list"
                      value={profDegreeLevel}
                      onChange={(e) => setProfDegreeLevel(e.target.value)}
                      placeholder="مثلاً: دکتری تخصصی"
                      className="w-full px-3 py-2 rounded-xl border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-900"
                    />
                    <datalist id="prof-degree-level-list">
                      <option value="دکتری تخصصی" />
                      <option value="دکتری" />
                      <option value="دانشجوی دکتری" />
                      <option value="کارشناسی ارشد" />
                      <option value="کارشناسی" />
                      <option value="حوزوی سطح ۳" />
                      <option value="حوزوی سطح ۴" />
                    </datalist>
                  </label>
                  <label className="space-y-1">
                    <span className="font-bold">رشته تحصیلی</span>
                    <input
                      type="text"
                      value={profDegreeField}
                      onChange={(e) => setProfDegreeField(e.target.value)}
                      placeholder="مثلاً: برنامه‌ریزی درسی"
                      className="w-full px-3 py-2 rounded-xl border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-900"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="font-bold">گرایش تحصیلی (اختیاری)</span>
                    <input
                      type="text"
                      value={profDegreeSpecialization}
                      onChange={(e) => setProfDegreeSpecialization(e.target.value)}
                      placeholder="مثلاً: آموزش ابتدایی"
                      className="w-full px-3 py-2 rounded-xl border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-900"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="font-bold">نام فارسی گروه آموزشی</span>
                  <input
                    type="text"
                    value={profDepartmentName}
                    onChange={(e) => setProfDepartmentName(e.target.value)}
                    placeholder="مثلاً: علوم تربیتی"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-bold">نام واحد / مرکز</span>
                  <input
                    type="text"
                    value={profUnitCenterName}
                    onChange={(e) => setProfUnitCenterName(e.target.value)}
                    placeholder="مثلاً: پردیس شهید باهنر"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="space-y-1">
                  <span className="font-bold">نوع استخدام (محاسباتی)</span>
                  <select
                    value={profEmployment}
                    onChange={(e) => setProfEmployment(e.target.value as SchedEmploymentType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {(Object.keys(SCHED_EMPLOYMENT_LABELS) as SchedEmploymentType[]).map((k) => (
                      <option key={k} value={k}>
                        {SCHED_EMPLOYMENT_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="font-bold">مرتبه علمی</span>
                  <input
                    type="text"
                    list="prof-rank-list"
                    value={profAcademicRank}
                    onChange={(e) => setProfAcademicRank(e.target.value)}
                    placeholder="مثلاً: استادیار"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <datalist id="prof-rank-list">
                    <option value="استاد" />
                    <option value="دانشیار" />
                    <option value="استادیار" />
                    <option value="مربی" />
                    <option value="مدرس مدعو" />
                    <option value="معلم مدعو" />
                  </datalist>
                </label>
                <label className="space-y-1">
                  <span className="font-bold">پایه</span>
                  <input
                    type="text"
                    value={profAcademicStep}
                    onChange={(e) => setProfAcademicStep(e.target.value)}
                    placeholder="مثلاً: ۱۲"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                    dir="ltr"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="space-y-1">
                  <span className="font-bold">وضعیت استخدام (عنوان گلستان)</span>
                  <input
                    type="text"
                    value={profEmploymentStatusRaw}
                    onChange={(e) => setProfEmploymentStatusRaw(e.target.value)}
                    placeholder="مثلاً: رسمی قطعی / حق‌التدریس"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-bold">تلفن همراه</span>
                  <input
                    type="text"
                    value={profMobile}
                    onChange={(e) => setProfMobile(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                    dir="ltr"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-bold">تلفن ثابت</span>
                  <input
                    type="text"
                    value={profLandlinePhone}
                    onChange={(e) => setProfLandlinePhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                    dir="ltr"
                  />
                </label>
              </div>

              {canViewSensitiveProfInfo && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="font-bold">نام بانک</span>
                    <input
                      type="text"
                      value={profBankName}
                      onChange={(e) => setProfBankName(e.target.value)}
                      placeholder="مثلاً: ملی / سپه"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="font-bold">شماره حساب بانکی (محرمانه)</span>
                    <input
                      type="text"
                      value={profBank}
                      onChange={(e) => setProfBank(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      dir="ltr"
                    />
                  </label>
                </div>
              )}

              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-extrabold text-amber-900 dark:text-amber-200">
                    محدوده واحد معادل اختصاصی استاد (اختیاری)
                  </span>
                  <span className="text-[10.5px] text-amber-800 dark:text-amber-300 font-semibold">
                    قانون فعلی «{SCHED_EMPLOYMENT_LABELS[profEmployment]}»: حداقل{' '}
                    {(
                      rules.professorUnitLimits?.[profEmployment] ||
                      DEFAULT_SCHED_PROFESSOR_UNIT_LIMITS[profEmployment]
                    ).minEquivalentUnits}{' '}
                    · حداکثر{' '}
                    {(
                      rules.professorUnitLimits?.[profEmployment] ||
                      DEFAULT_SCHED_PROFESSOR_UNIT_LIMITS[profEmployment]
                    ).maxEquivalentUnits}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="font-bold">حداقل واحد معادل اختصاصی</span>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={profMinEqOverride}
                      onChange={(e) => setProfMinEqOverride(e.target.value)}
                      placeholder={`خالی = استفاده از قانون (${
                        (
                          rules.professorUnitLimits?.[profEmployment] ||
                          DEFAULT_SCHED_PROFESSOR_UNIT_LIMITS[profEmployment]
                        ).minEquivalentUnits
                      })`}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 font-mono"
                      dir="ltr"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="font-bold">حداکثر واحد معادل اختصاصی</span>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={profMaxEqOverride}
                      onChange={(e) => setProfMaxEqOverride(e.target.value)}
                      placeholder={`خالی = استفاده از قانون (${
                        (
                          rules.professorUnitLimits?.[profEmployment] ||
                          DEFAULT_SCHED_PROFESSOR_UNIT_LIMITS[profEmployment]
                        ).maxEquivalentUnits
                      })`}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 font-mono"
                      dir="ltr"
                    />
                  </label>
                </div>
                <div className="text-[10.5px] text-slate-500">
                  در صورت خالی گذاشتن هر فیلد، مقدار مصوب نوع استخدام اعمال می‌شود؛ ثبت عدد ۰ به معنای بدون محدودیت است.
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold cursor-pointer"
              >
                ذخیره اطلاعات استاد
              </button>
            </form>
          </div>
        </div>
      )}

      {/* مودال جدول عدم امکان حضور استاد */}
      {unavailProfModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm">
                محدودیت زمان‌های عدم حضور استاد: {unavailProfModal.fullName} (کد{' '}
                {unavailProfModal.professorCode})
              </h3>
              <button
                type="button"
                onClick={() => setUnavailProfModal(null)}
                className="p-1 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              روی سانس‌هایی که استاد امکان حضور ندارد کلیک کنید تا غیرمجاز (قرمز) علامت‌گذاری شود:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <th className="p-2 text-right border border-slate-200 dark:border-slate-700">
                      روز / سانس
                    </th>
                    {sortedSlots.map((s, idx) => (
                      <th key={s.id} className="p-2 text-center border border-slate-200 dark:border-slate-700">
                        <div>{getSchedSlotTitle(s, idx)}</div>
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
                              className={`w-full py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                                blocked
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                              }`}
                            >
                              {blocked ? 'عدم امکان حضور' : 'آزاد'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  persistProfessors(
                    professors.map((p) =>
                      p.id === unavailProfModal.id ? { ...p, unavailableKeys: unavailDraft } : p
                    )
                  );
                  setUnavailProfModal(null);
                  notify('success', 'محدودیت زمانی استاد ذخیره شد.');
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-extrabold cursor-pointer"
              >
                ذخیره زمان‌های عدم حضور
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال افزودن/ویرایش سرفصل درس */}
      {courseModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm">
                {editingCourseId ? 'ویرایش سرفصل درس' : 'افزودن درس جدید به چارت رشته'}
              </h3>
              <button
                type="button"
                onClick={() => setCourseModalOpen(false)}
                className="p-1 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCourse} className="space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
                <span className="text-[11px] text-teal-900 dark:text-teal-200 font-bold">
                  دروس نیم‌واحدی (مانند تربیت بدنی: ۰.۵ نظری + ۰.۵ عملی عادی) پشتیبانی می‌شوند.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (!crsTitle.trim()) setCrsTitle('تربیت بدنی');
                    setCrsType('theoretical_practical');
                    setCrsThUnits('0.5');
                    setCrsPrUnits('0.5');
                    setCrsPrType('normal_lab');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-extrabold cursor-pointer transition"
                >
                  درج الگوی تربیت بدنی (۰.۵ نظری + ۰.۵ عملی)
                </button>
              </div>
              {approvedMajors.length > 0 ? (
                (() => {
                  const matchedCourseMajor = approvedMajors.find(
                    (m) =>
                      normalizeMajorCode(m.code) === normalizeMajorCode(crsMajorCode) ||
                      m.name.trim() === crsMajorName.trim()
                  );
                  const closest =
                    !matchedCourseMajor && (crsMajorName.trim() || crsMajorCode.trim())
                      ? findClosestApprovedMajor(crsMajorName, approvedMajors, crsMajorCode)
                      : null;
                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="space-y-1">
                          <span className="font-bold">کد درس ۷ رقمی *</span>
                          <input
                            type="text"
                            required
                            maxLength={7}
                            value={crsCode}
                            onChange={(e) => setCrsCode(e.target.value)}
                            placeholder="1102001"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                            dir="ltr"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="font-bold">عنوان درس *</span>
                          <input
                            type="text"
                            required
                            value={crsTitle}
                            onChange={(e) => setCrsTitle(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          />
                        </label>
                      </div>
                      <label className="block space-y-1">
                        <span className="font-bold">رشته تحصیلی مصوب (با کد رشته) *</span>
                        <select
                          required
                          value={matchedCourseMajor ? matchedCourseMajor.id : ''}
                          onChange={(e) => {
                            const picked = approvedMajors.find((m) => m.id === e.target.value);
                            if (picked) {
                              setCrsMajorCode(normalizeMajorCode(picked.code));
                              setCrsMajorName(picked.name);
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        >
                          <option value="">-- انتخاب رشته تحصیلی مصوب --</option>
                          {approvedMajors.map((m) => (
                            <option key={m.id} value={m.id}>
                              {formatApprovedMajorLabel(m)}
                            </option>
                          ))}
                        </select>
                      </label>
                      {!matchedCourseMajor && crsMajorName.trim() && (
                        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 text-[10px] text-amber-800 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2">
                          <span>
                            مقدار قبلی: «{crsMajorName}» ({crsMajorCode})
                          </span>
                          {closest && (
                            <button
                              type="button"
                              onClick={() => {
                                setCrsMajorCode(normalizeMajorCode(closest.major.code));
                                setCrsMajorName(closest.major.name);
                              }}
                              className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold cursor-pointer"
                            >
                              تطبیق با «{closest.major.name}» ({closest.score}٪)
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1">
                      <span className="font-bold">کد درس ۷ رقمی *</span>
                      <input
                        type="text"
                        required
                        maxLength={7}
                        value={crsCode}
                        onChange={(e) => setCrsCode(e.target.value)}
                        placeholder="1102001"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                        dir="ltr"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">کد رشته ۶ رقمی *</span>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={crsMajorCode}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCrsMajorCode(val);
                          const matched = programs.find((p) => p.majorCode === normalizeSchedCode(val));
                          if (matched) setCrsMajorName(matched.majorName);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                        dir="ltr"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1">
                      <span className="font-bold">عنوان درس *</span>
                      <input
                        type="text"
                        required
                        value={crsTitle}
                        onChange={(e) => setCrsTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">نام رشته *</span>
                      <input
                        type="text"
                        required
                        value={crsMajorName}
                        onChange={(e) => setCrsMajorName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </label>
                  </div>
                </>
              )}
              <div className="grid grid-cols-3 gap-3">
                <label className="space-y-1">
                  <span className="font-bold">نوع درس</span>
                  <select
                    value={crsType}
                    onChange={(e) => setCrsType(e.target.value as SchedCourseType)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {(Object.keys(SCHED_COURSE_TYPE_LABELS) as SchedCourseType[]).map((k) => (
                      <option key={k} value={k}>
                        {SCHED_COURSE_TYPE_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="font-bold">واحد نظری</span>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={crsThUnits}
                    onChange={(e) => setCrsThUnits(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-bold">واحد عملی</span>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={crsPrUnits}
                    onChange={(e) => setCrsPrUnits(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="font-bold">نوع واحد عملی</span>
                  <select
                    value={crsPrType}
                    onChange={(e) => setCrsPrType(e.target.value as SchedPracticalUnitType)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {(Object.keys(SCHED_PRACTICAL_TYPE_LABELS) as SchedPracticalUnitType[]).map(
                      (k) => (
                        <option key={k} value={k}>
                          {SCHED_PRACTICAL_TYPE_LABELS[k]}
                        </option>
                      )
                    )}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="font-bold">ترم پیشنهادی</span>
                  <input
                    type="text"
                    value={crsTerm}
                    onChange={(e) => setCrsTerm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold cursor-pointer"
              >
                ذخیره سرفصل درس
              </button>
            </form>
          </div>
        </div>
      )}

      {/* مودال شناور ثبت و ویرایش درس در برنامه (پورتال‌شونده داخل تمام‌صفحه واقعی) */}
      {(() => {
        if (!offModalOpen) return null;
        const offeringModalEl = (
          <div
            onClick={() => setOffModalOpen(false)}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-5 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 max-h-[92%] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm">
                  {editingOffId
                    ? `ویرایش برنامه درس: ${selectedOffCourse?.title || ''}`
                    : `ثبت درس جدید در برنامه هفتگی ترم ${activeTerm}`}
                </h3>
                <button
                  type="button"
                  onClick={() => setOffModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="بستن فرم (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

            {modalLockStatus.locked && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-extrabold flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalLockStatus.reason}</span>
              </div>
            )}

            {offIsDisabled && !offProfessorId && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-extrabold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  این درس هم‌اکنون غیرفعال و بدون استاد است ({offDisabledReason || 'استاد پیشین حذف شده'}). با انتخاب استاد جدید و ذخیره تغییرات، درس مجدداً فعال می‌شود.
                </span>
              </div>
            )}

            <form onSubmit={handleSaveOffering} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="space-y-1">
                  <span className="font-bold block">۱. رشته تحصیلی *</span>
                  <select
                    required
                    value={offMajorCode}
                    onChange={(e) => {
                      const nextMajorCode = e.target.value;
                      setOffMajorCode(nextMajorCode);
                      const normNext = normalizeMajorCode(nextMajorCode);
                      const firstCoh = programs.find(
                        (p) => normalizeMajorCode(p.majorCode) === normNext
                      );
                      setOffCohortId(firstCoh?.id || '');
                      const sec = firstCoh?.sections[0];
                      setOffSectionId(sec?.id || '');
                      const countVal = sec?.studentCount || firstCoh?.totalStudents || 28;
                      setOffEnrolledCount(String(countVal));
                      const firstCohSelected = firstCoh
                        ? getSelectedTermCoursesForCohort({
                            termKey: activeTerm,
                            cohortId: firstCoh.id,
                            majorCode: normNext,
                            allCourses: courses,
                            rules,
                          }).selectedCourses
                        : [];
                      const firstCrs = firstCohSelected[0];
                      setOffCourseId(firstCrs?.id || '');
                      setOffGroupCodeManual(false);
                      if (firstCrs) {
                        setOffCourseGroupCode(
                          getNextGolestanCourseGroupInfo(
                            firstCrs.courseCode,
                            termOfferings,
                            editingOffId || undefined
                          ).nextGroupCode
                        );
                      }
                      setOffInternshipSchoolOnlyFull(false);
                      if (!editingOffId) {
                        initInternshipGroupsForCourse(firstCrs, countVal, offProfessorId);
                      }
                      setOffSharedTargets([]);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="">-- انتخاب رشته تحصیلی --</option>
                    {modalAvailableMajors.map((m) => (
                      <option key={m.majorCode} value={m.majorCode}>
                        {m.majorName} ({m.majorCode})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="font-bold block">۲. ورودی میزبان (این رشته) *</span>
                  <select
                    required
                    value={offCohortId}
                    onChange={(e) => {
                      const nextCid = e.target.value;
                      setOffCohortId(nextCid);
                      const coh = programs.find((p) => p.id === nextCid);
                      const sec = coh?.sections[0];
                      setOffSectionId(sec?.id || '');
                      const countVal = sec?.studentCount || coh?.totalStudents || 25;
                      setOffEnrolledCount(String(countVal));
                      const nextTermState = coh
                        ? getSelectedTermCoursesForCohort({
                            termKey: activeTerm,
                            cohortId: coh.id,
                            majorCode: coh.majorCode,
                            allCourses: courses,
                            rules,
                          })
                        : null;
                      const validCoursesForNext = nextTermState?.selectedCourses || [];
                      const keepCurrent = validCoursesForNext.find((c) => c.id === offCourseId);
                      const pickedCrs = keepCurrent || validCoursesForNext[0];
                      setOffCourseId(pickedCrs?.id || '');
                      if (pickedCrs) {
                        setOffGroupCodeManual(false);
                        setOffCourseGroupCode(
                          getNextGolestanCourseGroupInfo(
                            pickedCrs.courseCode,
                            termOfferings,
                            editingOffId || undefined
                          ).nextGroupCode
                        );
                      }
                      if (!editingOffId && pickedCrs?.practicalType === 'internship') {
                        initInternshipGroupsForCourse(pickedCrs, countVal, offProfessorId);
                      } else if (!editingOffId) {
                        initInternshipGroupsForCourse(undefined, countVal, offProfessorId);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    {cohortsForSelectedMajor.length === 0 ? (
                      <option value="">ورودی‌ای برای این رشته ثبت نشده است</option>
                    ) : (
                      cohortsForSelectedMajor.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.majorName} — ورودی {p.entryTerm}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="font-bold block">
                    ۳. درس از دروس انتخاب‌شده ترم {activeTerm} ({modalSelectableCourses.length.toLocaleString('fa-IR')} درس) *
                  </span>
                  <select
                    required
                    value={offCourseId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setOffCourseId(nextId);
                      const c = modalSelectableCourses.find((x) => x.id === nextId);
                      if (c) {
                        setOffGroupCodeManual(false);
                        setOffCourseGroupCode(
                          getNextGolestanCourseGroupInfo(
                            c.courseCode,
                            termOfferings,
                            editingOffId || undefined
                          ).nextGroupCode
                        );
                        const currentEnrolled = Number(normalizeSchedCode(offEnrolledCount)) || 28;
                        if (c.practicalType !== 'internship') {
                          setOffInternshipSchoolOnlyFull(false);
                        }
                        if (!editingOffId) {
                          initInternshipGroupsForCourse(c, currentEnrolled, offProfessorId);
                        }
                        setOffSharedTargets([]);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    {modalSelectableCourses.length === 0 ? (
                      <option value="">
                        هیچ درسی برای این ورودی در ترم {activeTerm} انتخاب نشده است
                      </option>
                    ) : (
                      modalSelectableCourses.map((c) => {
                        const isOutsideTermList =
                          !selectedTermCourseState.selectedCourses.some((x) => x.id === c.id);
                        return (
                          <option key={c.id} value={c.id}>
                            {c.title} — کد {c.courseCode}
                            {isOutsideTermList ? ' (ثبت‌شده قبلی)' : ''}
                          </option>
                        );
                      })
                    )}
                  </select>
                </label>
              </div>

              {offCohortId && selectedTermCourseState.selectedCourses.length === 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/35 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100 text-[11px] font-bold flex flex-wrap items-center justify-between gap-2">
                  <span>
                    هنوز هیچ درسی از سرفصل برای این رشته-ورودی جهت ارائه در ترم {activeTerm} انتخاب نشده است. ابتدا دروس این ترم را از بخش «دروس قابل ارائه ترم» انتخاب کنید.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTermCoursesCohortId(offCohortId);
                      setOffModalOpen(false);
                      setSection('term_courses');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-extrabold cursor-pointer shrink-0"
                  >
                    انتخاب دروس قابل ارائه ترم
                  </button>
                </div>
              )}

              {/* کد دو رقمی گروه درس در سامانه گلستان (مثل 1111405_07) */}
              {selectedOffCourse && golestanGroupSuggestion && (
                <div className="p-3 rounded-xl bg-teal-50/75 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="font-black text-teal-950 dark:text-teal-100 flex flex-wrap items-center gap-2">
                        <span>کد ارائه درس در سامانه گلستان (کد ۷ رقمی _ کد گروه ۲ رقمی):</span>
                        <span
                          dir="ltr"
                          className="px-2.5 py-0.5 rounded-lg bg-teal-700 text-white font-mono text-xs tracking-wider shadow-xs"
                        >
                          {formatGolestanCourseCode(selectedOffCourse.courseCode, offCourseGroupCode)}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-teal-800 dark:text-teal-300 font-semibold">
                        {golestanGroupSuggestion.existingCount === 0 ? (
                          <span>
                            این کد درس ({selectedOffCourse.courseCode}) برای اولین بار در برنامه جامع این ترم ثبت می‌شود ← شروع خودکار از گروه{' '}
                            <strong className="font-mono">01</strong>
                          </span>
                        ) : (
                          <span>
                            قبلاً{' '}
                            <strong>
                              {golestanGroupSuggestion.existingCount.toLocaleString('fa-IR')} گروه
                            </strong>{' '}
                            از کد درس <span className="font-mono">{selectedOffCourse.courseCode}</span>{' '}
                            در کل برنامه جامع ثبت شده است ← کد گروه پیشنهادی خودکار:{' '}
                            <strong className="font-mono">
                              {golestanGroupSuggestion.nextGroupCode}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <label className="inline-flex items-center gap-1.5 text-[11px] font-bold">
                        <span>کد گروه:</span>
                        <input
                          type="text"
                          maxLength={2}
                          value={offCourseGroupCode}
                          onChange={(e) => {
                            setOffGroupCodeManual(true);
                            setOffCourseGroupCode(
                              normalizeSchedCode(e.target.value).replace(/[^\d]/g, '').slice(0, 2)
                            );
                          }}
                          onBlur={() => {
                            const norm = normalizeCourseGroupCode(offCourseGroupCode);
                            if (norm) setOffCourseGroupCode(norm);
                          }}
                          dir="ltr"
                          className="w-14 px-2 py-1 rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-900 font-mono text-center font-black"
                        />
                      </label>
                      {(offGroupCodeManual ||
                        normalizeCourseGroupCode(offCourseGroupCode) !==
                          golestanGroupSuggestion.nextGroupCode) && (
                        <button
                          type="button"
                          onClick={() => {
                            setOffGroupCodeManual(false);
                            setOffCourseGroupCode(golestanGroupSuggestion.nextGroupCode);
                          }}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 text-[10.5px] font-bold hover:bg-teal-100 cursor-pointer"
                        >
                          گروه خودکار ({golestanGroupSuggestion.nextGroupCode})
                        </button>
                      )}
                    </div>
                  </div>

                  {duplicateGroupConflictOffering && (
                    <div className="p-2 rounded-lg bg-amber-100/90 dark:bg-amber-950/60 border border-amber-400 text-amber-950 dark:text-amber-100 text-[10.5px] font-bold flex flex-wrap items-center justify-between gap-2">
                      <span>
                        ⚠️ کد گروه{' '}
                        <span className="font-mono" dir="ltr">
                          {formatGolestanCourseCode(selectedOffCourse.courseCode, offCourseGroupCode)}
                        </span>{' '}
                        قبلاً برای «{duplicateGroupConflictOffering.ownerMajorName} (ورودی{' '}
                        {duplicateGroupConflictOffering.entryTerm})» ثبت شده است.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setOffGroupCodeManual(false);
                          setOffCourseGroupCode(golestanGroupSuggestion.nextGroupCode);
                        }}
                        className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                      >
                        اصلاح خودکار به {golestanGroupSuggestion.nextGroupCode}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="space-y-1">
                  <span className="font-bold">شعبه / گروه</span>
                  <select
                    value={offSectionId}
                    onChange={(e) => {
                      setOffSectionId(e.target.value);
                      const coh = programs.find((p) => p.id === offCohortId);
                      const sec = coh?.sections.find((s) => s.id === e.target.value);
                      const countVal = sec?.studentCount || coh?.totalStudents || 25;
                      setOffEnrolledCount(String(countVal));
                      if (!editingOffId && selectedOffCourse?.practicalType === 'internship') {
                        initInternshipGroupsForCourse(selectedOffCourse, countVal, offProfessorId);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="">کل ورودی</option>
                    {programs
                      .find((p) => p.id === offCohortId)
                      ?.sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.studentCount} نفر)
                        </option>
                      ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="font-bold">
                    {selectedOffCourse?.practicalType === 'internship' && editingOffId
                      ? 'تعداد نفر کارورزی این شعبه *'
                      : 'کل دانشجویان شرکت‌کننده *'}
                  </span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={offEnrolledCount}
                    onChange={(e) => setOffEnrolledCount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </label>

                <label className="space-y-1">
                  <span className="font-bold">تفکیک بخش درس</span>
                  <select
                    value={offSplitPart}
                    onChange={(e) =>
                      setOffSplitPart(e.target.value as 'full' | 'theory' | 'practical')
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="full">کامل (نظری و عملی یکجا)</option>
                    <option value="theory">فقط بخش نظری</option>
                    <option value="practical">فقط بخش عملی</option>
                  </select>
                </label>
              </div>

              {/* مدیریت اختصاصی شعبه‌های کارورزی و تفکیک ۸ ساعت (۶ ساعت مدرسه ۷ تا ۱۳ + ۲ ساعت توجیهی دانشگاه) */}
              {selectedOffCourse?.practicalType === 'internship' && (
                <div className="p-3.5 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 space-y-3">
                  {/* انتخاب نقش جلسه کارورزی (۶ ساعت حضور در مدرسه + ۲ ساعت توجیهی دانشگاه) */}
                  <div className="space-y-1.5 pb-2.5 border-b border-violet-200/80 dark:border-violet-800/60">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-black text-violet-950 dark:text-violet-100 inline-flex items-center gap-1.5">
                        <School className="w-3.5 h-3.5 text-violet-700 dark:text-violet-300" />
                        <span>نوع جلسه کارورزی (۸ ساعت هفتگی = ۶ ساعت حضور مدرسه + ۲ ساعت توجیهی دانشگاه):</span>
                      </span>
                      {offInternshipSessionRole === 'school_attendance' && (
                        <button
                          type="button"
                          onClick={() => {
                            let workingSlots = [...rules.timeSlots];
                            let slot07_08 = workingSlots.find(
                              (s) => s.startTime.trim() === '07:00' && s.endTime.trim() === '08:00'
                            );
                            if (!slot07_08 && isSystemAdmin) {
                              slot07_08 = buildSevenToEightSlot();
                              const nextRules: SchedRulesSettings = {
                                ...rules,
                                timeSlots: [slot07_08, ...workingSlots].map((s, idx) => ({
                                  ...s,
                                  order: idx,
                                })),
                              };
                              workingSlots = nextRules.timeSlots;
                              persistRules(nextRules);
                            }
                            const findByStart = (h: string) =>
                              workingSlots.find((s) => s.startTime.trim().startsWith(h));
                            const s08 = findByStart('08');
                            const s10 = findByStart('10');
                            const s12 = findByStart('12');
                            const pickedIds: string[] = [];
                            const pickedParts: Record<string, SchedSlotHalf> = {};
                            if (slot07_08) {
                              pickedIds.push(slot07_08.id);
                              pickedParts[slot07_08.id] = 'full';
                            }
                            if (s08) {
                              pickedIds.push(s08.id);
                              pickedParts[s08.id] = 'full';
                            }
                            if (s10) {
                              pickedIds.push(s10.id);
                              pickedParts[s10.id] = 'full';
                            }
                            if (s12) {
                              pickedIds.push(s12.id);
                              pickedParts[s12.id] = getSlotDurationHours(s12) <= 1 ? 'full' : 'first_hour';
                            }
                            if (pickedIds.length > 0) {
                              setOffSessions((prev) =>
                                prev.map((sess, idx) =>
                                  idx === 0
                                    ? {
                                        ...sess,
                                        slotIds: pickedIds,
                                        slotParts: pickedParts,
                                      }
                                    : sess
                                )
                              );
                              setOffClassroomId('');
                              if (!slot07_08) {
                                notify(
                                  'error',
                                  'ساعات ۸ تا ۱۳ انتخاب شد؛ برای ثبت تک‌ساعت ۷ تا ۸ صبح از مدیر سامانه بخواهید آن را در تنظیمات سانس‌ها فعال کند.'
                                );
                              } else {
                                notify('success', 'بازه ۶ ساعته ۰۷:۰۰ تا ۱۳:۰۰ حضور در مدرسه انتخاب شد.');
                              }
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold cursor-pointer"
                        >
                          چیدمان خودکار ۷ تا ۱۳ (۶ ساعت)
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(
                        [
                          {
                            value: 'school_attendance' as SchedInternshipSessionRole,
                            title: 'حضور در مدرسه (۶ ساعت · ۷ تا ۱۳)',
                            desc: 'بدون نیاز به انتخاب کلاس فیزیکی',
                          },
                          {
                            value: 'university_orientation' as SchedInternshipSessionRole,
                            title: 'جلسه توجیهی دانشگاه (۲ ساعت)',
                            desc: 'انتخاب کلاس فیزیکی در دانشگاه الزامی است',
                          },
                          {
                            value: 'combined' as SchedInternshipSessionRole,
                            title: 'کل کارورزی یکجا (۸ ساعت)',
                            desc: 'با کلاس دانشگاه یا به‌صورت حضور در مدرسه',
                          },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setOffInternshipSessionRole(opt.value);
                            if (opt.value === 'school_attendance') {
                              setOffClassroomId('');
                              setOffInternshipSchoolOnlyFull(false);
                            } else if (opt.value === 'university_orientation') {
                              setOffInternshipSchoolOnlyFull(false);
                            }
                          }}
                          className={`p-2 rounded-lg border text-right transition cursor-pointer ${
                            offInternshipSessionRole === opt.value
                              ? 'bg-violet-700 text-white border-violet-700 shadow-xs'
                              : 'bg-white dark:bg-slate-900 border-violet-200 dark:border-violet-800 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="font-black text-[11px]">{opt.title}</div>
                          <div
                            className={`text-[10px] ${
                              offInternshipSessionRole === opt.value
                                ? 'text-violet-100'
                                : 'text-slate-500'
                            }`}
                          >
                            {opt.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                    {offInternshipSessionRole === 'combined' && (
                      <label className="mt-2 flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/35 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold text-emerald-950 dark:text-emerald-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={offInternshipSchoolOnlyFull}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setOffInternshipSchoolOnlyFull(checked);
                            if (checked) setOffClassroomId('');
                          }}
                          className="accent-emerald-600 rounded w-4 h-4 shrink-0"
                        />
                        <span>
                          ثبت ۸ ساعته یکسره به‌عنوان حضور در مدرسه (بدون نیاز به تعیین کلاس فیزیکی در دانشگاه)
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-black text-violet-900 dark:text-violet-200">
                        شعبه‌بندی و ظرفیت درس کارورزی (نصاب استاندارد: {rules.equivalentPerUnit.internshipMinStudents || 12} نفر)
                      </div>
                      <div className="text-[11px] text-violet-700 dark:text-violet-300">
                        تعداد دانشجو برای هر شعبه کارورزی توسط مدیر گروه قابل تعیین است (مثلاً ۲۴ نفر ← دو شعبه ۱۲ نفره، ۲۳ نفر ← ۱۲ و ۱۱ نفره، ۲۵ نفر ← ۱۲ و ۱۳ نفره).
                      </div>
                    </div>
                    {!editingOffId && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            initInternshipGroupsForCourse(
                              selectedOffCourse,
                              Number(normalizeSchedCode(offEnrolledCount)) || 24,
                              offProfessorId
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold cursor-pointer"
                        >
                          تقسیم هوشمند ({rules.equivalentPerUnit.internshipMinStudents || 12} نفره)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setOffInternshipGroups((prev) => [
                              ...prev,
                              {
                                id: `ig_${Date.now()}_${prev.length}`,
                                label: `شعبه ${(prev.length + 1).toLocaleString('fa-IR')} کارورزی`,
                                studentCount: rules.equivalentPerUnit.internshipMinStudents || 12,
                                professorId: offProfessorId,
                              },
                            ])
                          }
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-200 text-[11px] font-bold cursor-pointer"
                        >
                          + افزودن شعبه کارورزی
                        </button>
                      </div>
                    )}
                  </div>

                  {editingOffId ? (
                    <label className="block space-y-1">
                      <span className="font-bold text-violet-900 dark:text-violet-200">
                        عنوان شعبه کارورزی (اختیاری)
                      </span>
                      <input
                        type="text"
                        value={offInternshipSubLabel}
                        onChange={(e) => setOffInternshipSubLabel(e.target.value)}
                        placeholder="مثلاً: شعبه ۱ کارورزی"
                        className="w-full px-3 py-1.5 rounded-lg border border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-900"
                      />
                    </label>
                  ) : (
                    <div className="space-y-1.5">
                      {offInternshipGroups.map((grp, gIdx) => (
                        <div
                          key={grp.id}
                          className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-violet-200 dark:border-violet-800"
                        >
                          <input
                            type="text"
                            value={grp.label}
                            onChange={(e) =>
                              setOffInternshipGroups((prev) =>
                                prev.map((x, i) => (i === gIdx ? { ...x, label: e.target.value } : x))
                              )
                            }
                            placeholder="نام شعبه کارورزی"
                            className="col-span-4 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                          />
                          <div className="col-span-3 flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">نفرات:</span>
                            <input
                              type="number"
                              min={1}
                              value={grp.studentCount}
                              onChange={(e) =>
                                setOffInternshipGroups((prev) =>
                                  prev.map((x, i) =>
                                    i === gIdx
                                      ? { ...x, studentCount: Math.max(1, Number(e.target.value) || 1) }
                                      : x
                                  )
                                )
                              }
                              className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center"
                            />
                          </div>
                          <select
                            value={grp.professorId}
                            onChange={(e) =>
                              setOffInternshipGroups((prev) =>
                                prev.map((x, i) =>
                                  i === gIdx ? { ...x, professorId: e.target.value } : x
                                )
                              )
                            }
                            className="col-span-4 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          >
                            <option value="">(استاد عمومی فرم)</option>
                            {professors
                              .filter((p) => p.isActive)
                              .map((p) => {
                                const deptField = formatProfessorDepartmentAndField(p);
                                return (
                                  <option key={p.id} value={p.id}>
                                    {p.fullName}
                                    {deptField ? ` · ${deptField}` : ''}
                                  </option>
                                );
                              })}
                          </select>
                          <div className="col-span-1 text-center">
                            {offInternshipGroups.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setOffInternshipGroups((prev) => prev.filter((_, i) => i !== gIdx))
                                }
                                className="text-rose-500 hover:text-rose-700 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* بخش مشترک‌سازی بین چند رشته صرفاً با کد ۷ رقمی یکسان */}
              <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/25 border border-indigo-200 dark:border-indigo-900 space-y-2">
                <div className="font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>
                    مشترک‌سازی با سایر رشته‌ها و ورودی‌ها (فقط با کد ۷ رقمی یکسان:{' '}
                    <span className="font-mono">{selectedOffCourse?.courseCode || '---'}</span>)
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={sharePickerCohortId}
                    onChange={(e) => {
                      setSharePickerCohortId(e.target.value);
                      setSharePickerSectionId('');
                    }}
                    className="flex-1 min-w-[200px] px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900"
                  >
                    <option value="">-- انتخاب رشته/ورودی مشترک دارای همان کد ۷ رقمی --</option>
                    {programs
                      .filter((p) => matchingCourseMajorCodes.has(p.majorCode))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.majorName} ({p.majorCode}) - ورودی {p.entryTerm}
                        </option>
                      ))}
                  </select>
                  {sharePickerCohortId && (
                    <select
                      value={sharePickerSectionId}
                      onChange={(e) => setSharePickerSectionId(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900"
                    >
                      <option value="">کل ورودی</option>
                      {programs
                        .find((p) => p.id === sharePickerCohortId)
                        ?.sections.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.studentCount} نفر)
                          </option>
                        ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={handleAddSharedTarget}
                    disabled={!sharePickerCohortId}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 disabled:opacity-50 text-white font-bold cursor-pointer"
                  >
                    + افزودن به کلاس مشترک
                  </button>
                </div>

                {offSharedTargets.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {offSharedTargets.map((sh, i) => (
                      <div
                        key={`${sh.cohortId}_${sh.sectionId || ''}`}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 inline-flex items-center gap-2 text-[11px] font-bold"
                      >
                        <span>
                          {sh.majorName} ({sh.entryTerm}
                          {sh.sectionName ? ` - ${sh.sectionName}` : ''}) · {sh.studentCount} نفر
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setOffSharedTargets((prev) => prev.filter((_, idx) => idx !== i));
                            setOffEnrolledCount(
                              String(
                                Math.max(
                                  1,
                                  (Number(normalizeSchedCode(offEnrolledCount)) || 0) -
                                    (sh.studentCount || 0)
                                )
                              )
                            );
                          }}
                          className="text-rose-500 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="font-bold">تخصیص استاد (کد استاد یکتا)</span>
                  <select
                    value={offProfessorId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setOffProfessorId(val);
                      if (val) {
                        setOffIsDisabled(false);
                        setOffDisabledReason('');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="">-- بدون استاد / تعیین در آینده --</option>
                    {professors
                      .filter((p) => p.isActive)
                      .map((p) => {
                        const ld = termSchedulingIndex.profLoadMap.get(p.id) || {
                          professorId: p.id,
                          offeringCount: 0,
                          rawUnits: 0,
                          theoreticalUnits: 0,
                          practicalUnits: 0,
                          weeklyHours: 0,
                          equivalentUnits: 0,
                          activeDays: [],
                        };
                        const deptField = formatProfessorDepartmentAndField(p);
                        const bounds = getProfessorEquivalentUnitBounds(p, rules);
                        const limitEval = evaluateProfessorEquivalentUnitStatus(
                          p,
                          ld.equivalentUnits,
                          rules
                        );
                        return (
                          <option key={p.id} value={p.id}>
                            {p.fullName} (کد {p.professorCode}
                            {deptField ? ` · ${deptField}` : ''} — بار فعلی:{' '}
                            {ld.equivalentUnits}
                            {bounds.maxEquivalentUnits > 0
                              ? ` از ${bounds.maxEquivalentUnits}`
                              : ''}{' '}
                            معادل
                            {limitEval.status === 'above_max' ? ' ⚠️ سقف پر' : ''})
                          </option>
                        );
                      })}
                  </select>
                  <div className="pt-1 flex items-center justify-between gap-2">
                    {!isSystemAdmin ? (
                      <button
                        type="button"
                        onClick={() => setProposalModalOpen(true)}
                        className="text-[11px] font-extrabold text-teal-700 dark:text-teal-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>استاد جدید در لیست نیست؟ ارسال فرم ثبت استاد به مدیر سامانه</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openProfModal()}
                        className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ ثبت سریع استاد جدید (یا کد موقت new001 تا new999)</span>
                      </button>
                    )}
                  </div>
                  {(() => {
                    const selectedProf = professors.find((p) => p.id === offProfessorId);
                    if (!selectedProf) return null;
                    const degreeLabel = formatProfessorDegreeFull(
                      selectedProf.degreeLevel,
                      selectedProf.degreeField,
                      selectedProf.degreeSpecialization
                    );
                    const ld = termSchedulingIndex.profLoadMap.get(selectedProf.id) || {
                      professorId: selectedProf.id,
                      offeringCount: 0,
                      rawUnits: 0,
                      theoreticalUnits: 0,
                      practicalUnits: 0,
                      weeklyHours: 0,
                      equivalentUnits: 0,
                      activeDays: [],
                    };
                    const bounds = getProfessorEquivalentUnitBounds(selectedProf, rules);
                    const limitStatus = evaluateProfessorEquivalentUnitStatus(
                      selectedProf,
                      ld.equivalentUnits,
                      rules
                    );
                    return (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-300">
                        {selectedProf.departmentName && (
                          <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 font-bold text-teal-700 dark:text-teal-300">
                            گروه آموزشی: {selectedProf.departmentName}
                          </span>
                        )}
                        {(degreeLabel || selectedProf.degreeField) && (
                          <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 font-bold text-indigo-700 dark:text-indigo-300">
                            رشته / مدرک: {degreeLabel || selectedProf.degreeField}
                          </span>
                        )}
                        {selectedProf.academicRank && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">
                            مرتبه: {selectedProf.academicRank}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded border font-bold ${
                            limitStatus.status !== 'ok'
                              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200'
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          بار فعلی: {ld.equivalentUnits} معادل (مجاز:{' '}
                          {bounds.minEquivalentUnits > 0 ? `${bounds.minEquivalentUnits} تا ` : 'حداکثر '}
                          {bounds.maxEquivalentUnits > 0 ? bounds.maxEquivalentUnits : 'نامحدود'})
                        </span>
                      </div>
                    );
                  })()}
                </label>

                {(() => {
                  const isSchoolExempt = Boolean(
                    selectedOffCourse?.practicalType === 'internship' &&
                      (offInternshipSessionRole === 'school_attendance' ||
                        (offInternshipSessionRole === 'combined' && offInternshipSchoolOnlyFull))
                  );
                  return (
                    <label className="space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-bold">تخصیص کلاس فیزیکی</span>
                          <span
                            className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300"
                          >
                            {isSchoolExempt
                              ? 'حضور در مدرسه — بدون نیاز به کلاس فیزیکی'
                              : offSessions.some((s) => Boolean(s.dayOfWeek) && s.slotIds.length > 0 && !s.classroomId)
                              ? `فقط کلاس‌های خالی در تمام جلسات (${modalClassroomAvailability.freeRooms.length.toLocaleString('fa-IR')} از ${modalClassroomAvailability.totalActiveCount.toLocaleString('fa-IR')})`
                              : `(${modalClassroomAvailability.totalActiveCount.toLocaleString('fa-IR')} کلاس فعال)`}
                          </span>
                        </div>
                        {isSchoolExempt ? (
                          <div className="px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold text-[11px]">
                            ✓ برای حضور در مدرسه نیازی به انتخاب کلاس فیزیکی دانشگاه نیست.
                          </div>
                        ) : (
                          <>
                            <select
                              value={offClassroomId}
                              onChange={(e) => setOffClassroomId(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                            >
                              <option value="">-- بدون کلاس فیزیکی --</option>
                              {modalClassroomAvailability.selectedOccupiedItem && (
                                <option value={modalClassroomAvailability.selectedOccupiedItem.room.id}>
                                  ⛔ اشغال‌شده در یکی از جلسات —{' '}
                                  {modalClassroomAvailability.selectedOccupiedItem.room.name} (توسط «
                                  {modalClassroomAvailability.selectedOccupiedItem.occupiedBy?.courseTitle ||
                                    'درس دیگر'}
                                  »)
                                </option>
                              )}
                              {modalClassroomAvailability.freeRooms.map(({ room, capOk }) => (
                                <option key={room.id} value={room.id}>
                                  {capOk ? '✅' : '🟡 ظرفیت کمتر —'} {room.name} (کد {room.code} · ظرفیت{' '}
                                  {room.capacity} · {SCHED_ROOM_TYPE_LABELS[room.roomType]})
                                </option>
                              ))}
                            </select>
                            {selectedOffCourse?.practicalType === 'internship' &&
                              offInternshipSessionRole === 'university_orientation' && (
                                <div className="mt-1 text-[10.5px] font-bold text-violet-700 dark:text-violet-300">
                                  برای ۲ ساعت جلسه توجیهی کارورزی در دانشگاه، انتخاب کلاس فیزیکی الزامی است.
                                </div>
                              )}
                            {modalClassroomAvailability.selectedOccupiedItem && (
                              <div className="mt-1 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[10.5px] text-rose-700 dark:text-rose-200 flex flex-wrap items-center justify-between gap-1.5">
                                <span>
                                  کلاس انتخاب‌شده در یکی از روز/سانس‌ها اشغال است؛ می‌توانید کلاس دیگری انتخاب کنید یا برای جلسه جداگانه کلاس مجزا تعیین نمایید.
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOffClassroomId(modalClassroomAvailability.freeRooms[0]?.room.id || '')
                                  }
                                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                                >
                                  {modalClassroomAvailability.freeRooms[0]
                                    ? `انتخاب ${modalClassroomAvailability.freeRooms[0].room.name}`
                                    : 'پاک کردن کلاس'}
                                </button>
                              </div>
                            )}
                            {offSessions.some((s) => Boolean(s.dayOfWeek) && s.slotIds.length > 0 && !s.classroomId) &&
                              modalClassroomAvailability.freeRooms.length === 0 && (
                                <div className="mt-1 text-[10.5px] font-bold text-amber-700 dark:text-amber-300">
                                  در همه روزها/سانس‌های انتخابی یک کلاس مشترک خالی یافت نشد؛ می‌توانید برای هر جلسه پایین‌تر کلاس جداگانه انتخاب کنید.
                                </div>
                              )}
                          </>
                        )}
                      </label>
                    );
                  })()}
                </div>

                {/* زمان‌بندی منعطف چندجلسه‌ای (روزها و سانس‌های مختلف، مثلا ۲ س یکشنبه + ۱ س سه‌شنبه) */}
                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-teal-600" />
                        <span>زمان‌بندی جلسات هفتگی درس (امکان تقسیم در روزها و سانس‌های مختلف)</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        برای دروس چندساعته (مانند درس ۳ ساعته: ۲ ساعت در سانس اول یکشنبه + ۱ ساعت در تک‌ساعت اول سانس آخر سه‌شنبه) می‌توانید بیش از یک جلسه تعریف کنید.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const usedDays = new Set(offSessions.map((s) => s.dayOfWeek).filter(Boolean));
                        const nextDay =
                          activeDays.find((d) => !usedDays.has(d)) ||
                          activeDays[offSessions.length % Math.max(1, activeDays.length)] ||
                          'tuesday';
                        const rem = candidateCompleteness
                          ? round2(
                              candidateCompleteness.requiredTableHours -
                                candidateCompleteness.scheduledHours
                            )
                          : 0;
                        const lastSlot = sortedSlots[sortedSlots.length - 1];
                        const suggestSlots =
                          rem > 0.9 && rem <= 1.1 && lastSlot ? [lastSlot.id] : [];
                        const suggestParts: Record<string, SchedSlotHalf> = {};
                        if (suggestSlots.length === 1 && lastSlot) {
                          suggestParts[lastSlot.id] =
                            getSlotDurationHours(lastSlot) > 1 ? 'first_hour' : 'full';
                        }
                        setOffSessions((prev) => [
                          ...prev,
                          {
                            id: `sess_${Date.now()}_${prev.length + 1}`,
                            dayOfWeek: nextDay,
                            slotIds: suggestSlots,
                            slotParts: suggestParts,
                          },
                        ]);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن جلسه در روز/سانس دیگر</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {offSessions.map((sess, sessIdx) => {
                      const sessHours = sess.slotIds.reduce((sum, sid) => {
                        const sl = sortedSlots.find((x) => x.id === sid);
                        const dur = sl ? getSlotDurationHours(sl) : 2;
                        const h = sess.slotParts?.[sid] || 'full';
                        return sum + (h === 'full' ? dur : Math.min(dur, 1));
                      }, 0);
                      const isSchoolExempt = Boolean(
                        selectedOffCourse?.practicalType === 'internship' &&
                          (offInternshipSessionRole === 'school_attendance' ||
                            (offInternshipSessionRole === 'combined' && offInternshipSchoolOnlyFull))
                      );
                      const sessRoomInfo =
                        offSessions.length > 1 && !isSchoolExempt && sess.dayOfWeek && sess.slotIds.length > 0
                          ? getModalSessionFreeRooms([sess])
                          : null;

                      return (
                        <div
                          key={sess.id}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-black text-[11px] text-slate-800 dark:text-slate-100">
                                جلسه {(sessIdx + 1).toLocaleString('fa-IR')}
                                {sessIdx === 0 && offSessions.length > 1 ? ' (اصلی)' : ''}
                              </span>
                              <span className="text-[10.5px] font-bold text-teal-700 dark:text-teal-300">
                                ({round2(sessHours).toLocaleString('fa-IR')} ساعت در این جلسه)
                              </span>
                            </div>
                            {offSessions.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setOffSessions((prev) => prev.filter((_, i) => i !== sessIdx))
                                }
                                className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-800 text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer hover:bg-rose-100"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>حذف جلسه</span>
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="space-y-1">
                              <span className="font-bold">روز برگزاری جلسه</span>
                              <select
                                value={sess.dayOfWeek}
                                onChange={(e) => {
                                  const nextDay = e.target.value as SchedDayKey | '';
                                  setOffSessions((prev) =>
                                    prev.map((x, i) => (i === sessIdx ? { ...x, dayOfWeek: nextDay } : x))
                                  );
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                              >
                                <option value="">پیش‌نویس بدون روز قطعی</option>
                                {activeDays.map((d) => (
                                  <option key={d} value={d}>
                                    {SCHED_DAY_LABELS[d]}
                                  </option>
                                ))}
                              </select>
                            </label>

                            {offSessions.length > 1 && !isSchoolExempt && (
                              <label className="space-y-1">
                                <span className="font-bold">کلاس فیزیکی این جلسه (اختیاری)</span>
                                <select
                                  value={sess.classroomId || ''}
                                  onChange={(e) => {
                                    const nextRoomId = e.target.value || undefined;
                                    setOffSessions((prev) =>
                                      prev.map((x, i) =>
                                        i === sessIdx ? { ...x, classroomId: nextRoomId } : x
                                      )
                                    );
                                  }}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                                >
                                  <option value="">
                                    همسان با کلاس اصلی ({classrooms.find((r) => r.id === offClassroomId)?.name || 'تعیین‌نشده'})
                                  </option>
                                  {(sessRoomInfo
                                    ? sessRoomInfo.freeRooms
                                    : classrooms.filter((r) => r.isActive).map((r) => ({ room: r, capOk: true }))
                                  ).map(({ room, capOk }) => (
                                    <option key={room.id} value={room.id}>
                                      {capOk ? '✅' : '🟡 ظرفیت کمتر —'} {room.name} (ظرفیت {room.capacity})
                                    </option>
                                  ))}
                                </select>
                              </label>
                            )}
                          </div>

                          <div className="space-y-1">
                            <span className="font-bold block">سانس‌های زمانی جلسه</span>
                            <div className="flex flex-wrap gap-1.5">
                              {sortedSlots.map((slot, sIdx) => {
                                const checked = sess.slotIds.includes(slot.id);
                                return (
                                  <button
                                    key={slot.id}
                                    type="button"
                                    onClick={() => {
                                      setOffSessions((prev) =>
                                        prev.map((x, i) => {
                                          if (i !== sessIdx) return x;
                                          if (checked) {
                                            const nextParts = { ...x.slotParts };
                                            delete nextParts[slot.id];
                                            return {
                                              ...x,
                                              slotIds: x.slotIds.filter((id) => id !== slot.id),
                                              slotParts: nextParts,
                                            };
                                          }
                                          const remHours = candidateCompleteness
                                            ? round2(
                                                candidateCompleteness.requiredTableHours -
                                                  candidateCompleteness.scheduledHours
                                              )
                                            : 0;
                                          const dur = getSlotDurationHours(slot);
                                          const defaultHalf: SchedSlotHalf =
                                            dur > 1 && remHours > 0.9 && remHours <= 1.1
                                              ? 'first_hour'
                                              : x.slotParts[slot.id] || 'full';
                                          return {
                                            ...x,
                                            slotIds: [...x.slotIds, slot.id],
                                            slotParts: { ...x.slotParts, [slot.id]: defaultHalf },
                                          };
                                        })
                                      );
                                    }}
                                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer ${
                                      checked
                                        ? 'bg-teal-600 text-white border-teal-600'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                                    }`}
                                  >
                                    {getSchedSlotTitle(slot, sIdx)} ({slot.startTime}-{slot.endTime})
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {sess.slotIds.length > 0 && (
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                              <div className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
                                تعیین کل سانس یا تک‌ساعت (ساعت اول / ساعت دوم):
                              </div>
                              <div className="space-y-1.5">
                                {sess.slotIds.map((sid) => {
                                  const sIdx = sortedSlots.findIndex((x) => x.id === sid);
                                  const sl = sIdx >= 0 ? sortedSlots[sIdx] : undefined;
                                  const curHalf: SchedSlotHalf = sess.slotParts?.[sid] || 'full';
                                  return (
                                    <div
                                      key={`half_${sess.id}_${sid}`}
                                      className="flex flex-wrap items-center justify-between gap-2 text-[11px]"
                                    >
                                      <span className="font-bold text-slate-700 dark:text-slate-200">
                                        {sl ? `${getSchedSlotTitle(sl, sIdx)} (${sl.startTime}-${sl.endTime})` : sid}:
                                      </span>
                                      <div className="inline-flex items-center gap-1">
                                        {(
                                          ['full', 'first_hour', 'second_hour'] as SchedSlotHalf[]
                                        ).map((h) => (
                                          <button
                                            key={h}
                                            type="button"
                                            onClick={() =>
                                              setOffSessions((prev) =>
                                                prev.map((x, i) =>
                                                  i === sessIdx
                                                    ? { ...x, slotParts: { ...x.slotParts, [sid]: h } }
                                                    : x
                                                )
                                              )
                                            }
                                            className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer ${
                                              curHalf === h
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                            }`}
                                          >
                                            {getSlotHalfLabel(h)}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              {/* روز و سانس امتحان پایان ترم (صرفاً برای دروس نظری) */}
              {selectedOffCourse && (
                isCourseEligibleForExam(selectedOffCourse) ? (
                  <div className="p-3 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-violet-950 dark:text-violet-100 inline-flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5 text-violet-600 dark:text-violet-300" />
                        <span>تعیین روز و سانس امتحان پایان ترم (ویژه دروس نظری)</span>
                      </span>
                      {(offExamDayId || offExamSlotId) && (
                        <button
                          type="button"
                          onClick={() => {
                            setOffExamDayId('');
                            setOffExamSlotId('');
                          }}
                          className="text-[10.5px] font-bold text-rose-600 hover:underline cursor-pointer"
                        >
                          پاک کردن زمان امتحان
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <label className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          روز امتحان
                        </span>
                        <select
                          value={offExamDayId}
                          onChange={(e) => {
                            const v = e.target.value;
                            setOffExamDayId(v);
                            if (v && !offExamSlotId && activeTermExamSettings.examSlots[0]) {
                              setOffExamSlotId(activeTermExamSettings.examSlots[0].id);
                            }
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-900 font-bold"
                        >
                          <option value="">-- تعیین‌نشده --</option>
                          {activeTermExamSettings.examDays
                            .filter((d) => d.isActive)
                            .map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.label} — {d.weekdayLabel}
                                {d.date ? ` (${d.date})` : ''}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          سانس امتحان
                        </span>
                        <select
                          value={offExamSlotId}
                          onChange={(e) => setOffExamSlotId(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-900 font-bold"
                        >
                          <option value="">-- انتخاب سانس امتحانی --</option>
                          {activeTermExamSettings.examSlots.map((es) => (
                            <option key={es.id} value={es.id}>
                              {es.label} ({es.startTime} تا {es.endTime})
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="text-[10.5px] text-violet-800/80 dark:text-violet-300">
                      در صورت هم‌زمانی امتحان دو درس در یک رشته/ورودی/شعبه، سامانه صرفاً اخطار نمایش می‌دهد و مانع ثبت نمی‌شود.
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
                    این درس از نوع <strong>{SCHED_COURSE_TYPE_LABELS[selectedOffCourse.courseType]}</strong> است و فاقد امتحان پایان ترم متمرکز می‌باشد.
                  </div>
                )
              )}

              {/* پیش‌نمایش محاسبه ساعات و واحد معادل + خطاهای تداخل */}
              {candidateBreakdown && (
                <div className="space-y-2">
                  {(candidateBreakdown.weeklyHours % 1 !== 0 ||
                    candidateBreakdown.activeTheoryUnits % 1 !== 0 ||
                    candidateBreakdown.activePracticalUnits % 1 !== 0) && (
                    <div className="p-3 rounded-xl bg-sky-50/90 dark:bg-sky-950/35 border border-sky-300 dark:border-sky-800 text-sky-950 dark:text-sky-100 text-[11px] space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-black">
                          درس نیم‌واحدی / ساعتی کسری (مانند تربیت بدنی: ۱ ساعت عملی + ۱ ساعت نظری در جدول):
                        </span>
                        {offSessions[0]?.slotIds.length > 0 &&
                          (offSplitPart !== 'full' ||
                            offSessions[0]?.slotParts?.[offSessions[0].slotIds[0]] !== 'full') && (
                            <button
                              type="button"
                              onClick={() => {
                                setOffSplitPart('full');
                                setOffSessions((prev) =>
                                  prev.map((s, idx) =>
                                    idx === 0 && s.slotIds[0]
                                      ? {
                                          ...s,
                                          slotParts: { ...s.slotParts, [s.slotIds[0]]: 'full' },
                                        }
                                      : s
                                  )
                                );
                              }}
                              className="px-2 py-0.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-extrabold cursor-pointer"
                            >
                              تنظیم خودکار رزرو ۱ سانس (۲ ساعته)
                            </button>
                          )}
                      </div>
                      <p className="text-sky-800 dark:text-sky-200 leading-relaxed">
                        بدون تغییر ساختار جدول، برای ارائه این درس یک سانس کامل ۲ ساعته (معادل ۱ ساعت نظری + ۱ ساعت عملی روی جدول) رزرو می‌شود، اما سامانه در محاسبه ساعت هفتگی و بار استاد مقادیر واقعی ({candidateBreakdown.weeklyHours} ساعت واقعی و {candidateBreakdown.equivalentUnits} واحد معادل) را اعمال می‌کند.
                      </p>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 tabular-nums">
                    <span>
                      واحد کل: <strong>{candidateBreakdown.rawUnits}</strong> (نظری:{' '}
                      {candidateBreakdown.activeTheoryUnits} + عملی:{' '}
                      {candidateBreakdown.activePracticalUnits})
                    </span>
                    <span>
                      ساعت هفتگی واقعی: <strong>{candidateBreakdown.weeklyHours} ساعت</strong>
                      {candidateBreakdown.weeklyHours % 1 !== 0 && (
                        <span className="text-[10px] text-sky-700 dark:text-sky-300 font-bold mr-1">
                          (رزرو جدول: ۲ ساعته)
                        </span>
                      )}
                    </span>
                    <span className="text-teal-700 dark:text-teal-400 font-black">
                      واحد معادل استاد: {candidateBreakdown.equivalentUnits}
                    </span>
                  </div>

                  {candidateCompleteness && (
                    <div
                      className={`p-3 rounded-xl border space-y-2 ${
                        canFinalizeModal
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                          : 'bg-amber-50/90 dark:bg-amber-950/35 border-amber-300 dark:border-amber-700'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-black text-[11px] flex items-center gap-1.5">
                          {canFinalizeModal ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="text-emerald-900 dark:text-emerald-200">
                                اطلاعات درس کامل و آماده ثبت نهایی است ({candidateCompleteness.scheduledHours.toLocaleString('fa-IR')} از{' '}
                                {candidateCompleteness.requiredTableHours.toLocaleString('fa-IR')} ساعت)
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span className="text-amber-900 dark:text-amber-200">
                                وضعیت فعلی: نیازمند تکمیل برای ثبت نهایی (در صورت ذخیره، به صورت «موقت و غیرفعال» ثبت می‌شود)
                              </span>
                            </>
                          )}
                        </div>

                        {!candidateCompleteness.checklist.hoursExact &&
                          candidateCompleteness.requiredTableHours > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const rec = buildRecommendedSlotsForHours(
                                  candidateCompleteness.requiredTableHours,
                                  sortedSlots,
                                  offSessions[0]?.slotIds[0]
                                );
                                if (rec.slotIds.length > 0) {
                                  setOffSessions([
                                    {
                                      id: offSessions[0]?.id || 'sess_1',
                                      dayOfWeek: offSessions[0]?.dayOfWeek || activeDays[0] || 'saturday',
                                      slotIds: rec.slotIds,
                                      slotParts: rec.slotParts,
                                      classroomId: offSessions[0]?.classroomId,
                                    },
                                  ]);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10.5px] font-extrabold cursor-pointer"
                            >
                              تنظیم خودکار سانس ({candidateCompleteness.requiredTableHours.toLocaleString('fa-IR')} ساعت)
                            </button>
                          )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10.5px] font-bold">
                        <div
                          className={`px-2 py-1 rounded-lg border ${
                            candidateCompleteness.checklist.hasDayAndSlots
                              ? 'bg-white/80 dark:bg-slate-900/70 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {candidateCompleteness.checklist.hasDayAndSlots ? '✓' : '✕'} روز و سانس
                        </div>
                        <div
                          className={`px-2 py-1 rounded-lg border ${
                            candidateCompleteness.checklist.hoursExact
                              ? 'bg-white/80 dark:bg-slate-900/70 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {candidateCompleteness.checklist.hoursExact ? '✓' : '✕'} ساعت:{' '}
                          {candidateCompleteness.scheduledHours.toLocaleString('fa-IR')}/
                          {candidateCompleteness.requiredTableHours.toLocaleString('fa-IR')}
                        </div>
                        <div
                          className={`px-2 py-1 rounded-lg border ${
                            (isMultiInternshipMode
                              ? !multiInternshipMissingProfessors
                              : candidateCompleteness.checklist.hasProfessor)
                              ? 'bg-white/80 dark:bg-slate-900/70 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {(isMultiInternshipMode
                            ? !multiInternshipMissingProfessors
                            : candidateCompleteness.checklist.hasProfessor)
                            ? '✓'
                            : '✕'}{' '}
                          استاد درس
                        </div>
                        <div
                          className={`px-2 py-1 rounded-lg border ${
                            !candidateCompleteness.checklist.classroomRequired ||
                            candidateCompleteness.checklist.hasClassroom
                              ? 'bg-white/80 dark:bg-slate-900/70 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {!candidateCompleteness.checklist.classroomRequired
                            ? '✓ محل: مدرسه'
                            : candidateCompleteness.checklist.hasClassroom
                            ? '✓ کلاس فیزیکی'
                            : '✕ کلاس فیزیکی'}
                        </div>
                      </div>

                      {!canFinalizeModal && candidateCompleteness.missingItems.length > 0 && (
                        <ul className="list-disc pr-4 text-[10.5px] text-amber-900 dark:text-amber-200 space-y-0.5">
                          {candidateCompleteness.missingItems.map((m, idx) => (
                            <li key={idx}>{m}</li>
                          ))}
                          {isMultiInternshipMode && multiInternshipMissingProfessors && (
                            <li>برای یکی از شعبه‌های کارورزی استاد تعیین نشده است.</li>
                          )}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}

              {(candidateConflictReport.errors.length > 0 ||
                candidateConflictReport.warnings.length > 0) && (
                <div className="space-y-1.5">
                  {candidateConflictReport.errors.map((err, i) => (
                    <div
                      key={`err_${i}`}
                      className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                  {candidateConflictReport.warnings.map((w, i) => (
                    <div
                      key={`warn_${i}`}
                      className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 text-amber-800 dark:text-amber-300 flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                {editingOffId ? (
                  <button
                    type="button"
                    disabled={modalLockStatus.locked}
                    onClick={() => {
                      if (modalLockStatus.locked) {
                        notify('error', modalLockStatus.reason || 'این بخش قفل است.');
                        return;
                      }
                      commitOfferingsWithHistory(
                        offerings.filter((x) => x.id !== editingOffId),
                        `حذف درس «${selectedOffCourse?.title || ''}»`
                      );
                      setOffModalOpen(false);
                      notify('success', 'درس از برنامه ترم حذف شد.');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-800 disabled:opacity-50 font-bold cursor-pointer"
                  >
                    حذف از برنامه
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {!canFinalizeModal && (
                    <button
                      type="button"
                      disabled={modalLockStatus.locked || !candidateOffering}
                      onClick={() => commitOfferingModalSave('provisional')}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-extrabold cursor-pointer inline-flex items-center gap-1.5"
                      title="ثبت در جدول با رنگ زرد و وضعیت غیرفعال تا تکمیل ساعت، استاد و کلاس"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>ثبت موقت (غیرفعال تا تکمیل)</span>
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!canFinalizeModal}
                    title={
                      !canFinalizeModal
                        ? 'برای ثبت نهایی باید زمان، تعداد ساعت دقیق، استاد و کلاس درس تکمیل و بدون تداخل باشد.'
                        : undefined
                    }
                    className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-45 disabled:cursor-not-allowed text-white font-extrabold cursor-pointer"
                  >
                    {editingOffId
                      ? 'تکمیل و ثبت نهایی تغییرات'
                      : isMultiInternshipMode && offInternshipGroups.length > 1
                      ? `ثبت نهایی ${offInternshipGroups.length.toLocaleString('fa-IR')} شعبه کارورزی`
                      : 'ثبت نهایی در برنامه هفتگی'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        );
        return masterFullscreenPortalEl
          ? createPortal(offeringModalEl, masterFullscreenPortalEl)
          : offeringModalEl;
      })()}

      {/* مودال برنامه‌ریزی امتحانات دروس مشترک و عمومی */}
      {(() => {
        const examModalNode = (
          <CourseSchedulingCommonExamModal
            isOpen={commonExamModalOpen}
            onClose={() => setCommonExamModalOpen(false)}
            activeTerm={activeTerm}
            offerings={offerings}
            termOfferings={termOfferings}
            rules={rules}
            userRole={userRole}
            actor={actor}
            canManageMasterData={canManageMasterData}
            isOwnMajorName={isOwnMajorName}
            onCommitOfferings={commitOfferingsWithHistory}
            onOpenEditOffering={(o) => openEditOfferingModal(o)}
            onOpenExamSettings={
              isSystemAdmin
                ? () => {
                    setCommonExamModalOpen(false);
                    if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
                      void document.exitFullscreen().catch(() => {});
                    }
                    setMasterFullscreenPortalEl(null);
                    setSection('rules');
                  }
                : undefined
            }
            onNotify={notify}
          />
        );
        return masterFullscreenPortalEl && commonExamModalOpen
          ? createPortal(examModalNode, masterFullscreenPortalEl)
          : examModalNode;
      })()}

      {/* مودال چت آنلاین و تالارهای مشترک معاونت آموزش */}
      {(() => {
        const chatModalNode = (
          <AcademicChatWorkspace
            mode="modal"
            isOpen={isAcademicChatOpen}
            onClose={() => setIsAcademicChatOpen(false)}
            actor={{
              id: actor.id,
              name: actor.name,
              role: userRole,
              assignedFields: allowedMajorNames,
            }}
            onUnreadChange={() => setAcademicChatUnread(getAcademicChatTotalUnreadCount(actor.id))}
          />
        );
        return masterFullscreenPortalEl && isAcademicChatOpen
          ? createPortal(chatModalNode, masterFullscreenPortalEl)
          : chatModalNode;
      })()}

      {/* نوار اعلان شناور درون حالت تمام‌صفحه */}
      {masterFullscreenPortalEl &&
        feedback &&
        createPortal(
          <div
            className={`fixed top-3 left-1/2 -translate-x-1/2 z-[130] max-w-[92%] px-4 py-2.5 rounded-2xl border shadow-2xl text-xs font-extrabold flex items-center gap-2.5 backdrop-blur-md ${
              feedback.type === 'success'
                ? 'bg-emerald-950/95 text-emerald-100 border-emerald-500/60'
                : 'bg-rose-950/95 text-rose-100 border-rose-500/60'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="p-0.5 hover:opacity-75 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>,
          masterFullscreenPortalEl
        )}

      {/* مودال تایید حذف استاد با نمایش پیامد غیرفعال‌سازی دروس مرتبط */}
      {profToDelete && (() => {
        const linkedCount = offerings.filter((o) => o.professorId === profToDelete.id).length;
        return (
          <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 border border-rose-200 dark:border-rose-800 shadow-2xl space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    تایید حذف استاد «{profToDelete.fullName}»
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {linkedCount > 0
                      ? `با حذف این استاد، تمامی ${linkedCount.toLocaleString('fa-IR')} درس تخصیص‌یافته به ایشان در برنامه درسی به‌صورت خودکار «غیرفعال و بدون استاد» می‌شوند تا تداخلی ایجاد نشود.`
                      : 'این استاد در حال حاضر درس فعالی در جدول ندارد و از لیست اساتید حذف خواهد شد.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setProfToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteProfessor}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black cursor-pointer"
                >
                  حذف استاد و اعمال تغییرات
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* مودال تایید پاک‌سازی اطلاعات و تخلیه جدول برنامه */}
      {dangerActionModal && (() => {
        const meta: Record<
          typeof dangerActionModal,
          { title: string; desc: string; confirmLabel: string; tone: 'amber' | 'rose' }
        > = {
          clear_term_schedule: {
            title: `تخلیه جدول برنامه ترم ${activeTerm}`,
            desc: `تمامی ${termOfferings.length.toLocaleString('fa-IR')} درس ارائه‌شده در ترم ${activeTerm} حذف می‌شوند؛ کلاس‌ها، اساتید، رشته‌ها و سرفصل دروس دست‌نخورده باقی می‌مانند.`,
            confirmLabel: 'تخلیه جدول ترم فعال',
            tone: 'amber',
          },
          clear_all_schedules: {
            title: 'حذف برنامه‌های درسی همه ترم‌ها',
            desc: `تمامی ${offerings.length.toLocaleString('fa-IR')} درس ثبت‌شده در جدول تمام ترم‌ها حذف می‌شوند؛ اطلاعات پایه حفظ خواهند شد.`,
            confirmLabel: 'حذف کل برنامه‌های درسی',
            tone: 'amber',
          },
          clear_classrooms: {
            title: 'پاک کردن لیست کلاس‌های فیزیکی',
            desc: `تمامی ${classrooms.length.toLocaleString('fa-IR')} کلاس فیزیکی حذف شده و تخصیص کلاس در دروس موجود آزاد می‌شود.`,
            confirmLabel: 'پاک کردن کلاس‌ها',
            tone: 'rose',
          },
          clear_professors: {
            title: 'پاک کردن کامل لیست اساتید',
            desc: `تمامی ${professors.length.toLocaleString('fa-IR')} استاد حذف و کلیه دروس دارای استاد به‌صورت خودکار غیرفعال و بدون استاد می‌شوند.`,
            confirmLabel: 'پاک کردن اساتید',
            tone: 'rose',
          },
          clear_courses: {
            title: 'پاک کردن سرفصل دروس (کد ۷ رقمی)',
            desc: `تمامی ${courses.length.toLocaleString('fa-IR')} عنوان درس چارت آموزشی حذف می‌شوند.`,
            confirmLabel: 'پاک کردن سرفصل دروس',
            tone: 'rose',
          },
          clear_programs: {
            title: 'پاک کردن رشته‌ها، ورودی‌ها و شعب',
            desc: `تمامی ${programs.length.toLocaleString('fa-IR')} ورودی و شعبه از اطلاعات پایه حذف می‌شوند.`,
            confirmLabel: 'پاک کردن رشته‌ها و شعب',
            tone: 'rose',
          },
          clear_comments_history: {
            title: 'پاک کردن یادداشت‌ها و تاریخچه بازگشت',
            desc: `تمامی ${cellComments.length.toLocaleString('fa-IR')} یادداشت سلول‌های جدول و تاریخچه Undo/Redo شما پاک می‌شود.`,
            confirmLabel: 'پاک کردن یادداشت‌ها و تاریخچه',
            tone: 'rose',
          },
          clear_everything: {
            title: 'پاک‌سازی کامل کل داده‌های سامانه برنامه‌ریزی',
            desc: 'کلیه برنامه‌های درسی، کلاس‌ها، اساتید، رشته‌ها، دروس و یادداشت‌ها حذف می‌شوند (ضرایب و تنظیمات کلی حفظ می‌گردد). پیشنهاد می‌شود پیش از تایید فایل پشتیبان دانلود نمایید.',
            confirmLabel: 'تایید پاک‌سازی کامل',
            tone: 'rose',
          },
        };
        const info = meta[dangerActionModal];
        return (
          <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 border border-rose-200 dark:border-rose-800 shadow-2xl space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    info.tone === 'amber'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                      : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">{info.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{info.desc}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleDownloadSchedBackup}
                  className="px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ابتدا دانلود بکاپ</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDangerActionModal(null)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={executeDangerAction}
                    className={`px-4 py-2 rounded-xl text-white font-black cursor-pointer ${
                      info.tone === 'amber'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {info.confirmLabel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <ProfessorProposalModal
        isOpen={proposalModalOpen}
        onClose={() => setProposalModalOpen(false)}
        actor={actor}
        userRole={userRole}
        allowedMajorNames={allowedMajorNames}
        onSubmitted={(proposal) => {
          refreshProfessorsAndProposals();
          notify(
            'success',
            `فرم مشخصات استاد جدید «${proposal.fullName}» برای تأیید مدیر کل سامانه ارسال شد.`
          );
        }}
      />
    </div>
  );
};
