import React, { useMemo, useState } from 'react';
import {
  SchedClassroom,
  SchedClassroomType,
  SchedCourseOffering,
  SchedCourseType,
  SchedCurriculumCourse,
  SchedDayKey,
  SchedEmploymentType,
  SchedPracticalUnitType,
  SchedProfessor,
  SchedProgramCohort,
  SchedRulesSettings,
  SchedSharedTarget,
  SchedSlotHalf,
  SchedTimeSlot,
} from '../types';
import { Storage, normalizeAssignedFieldsList, normalizePersianSearch } from '../utils/storage';
import {
  SCHED_COURSE_TYPE_LABELS,
  SCHED_DAY_LABELS,
  SCHED_DAYS_ORDER,
  SCHED_EMPLOYMENT_LABELS,
  SCHED_PRACTICAL_TYPE_LABELS,
  SCHED_ROOM_TYPE_LABELS,
  buildDefaultTimeSlots,
  calculateOfferingBreakdown,
  calculateProfessorLoadSummary,
  computeInternshipSplitPlan,
  detectOfferingConflicts,
  downloadSchedExcelTemplate,
  exportJsonRowsToExcel,
  getOfferingSlotHalf,
  getSchedSlotOrdinalLabel,
  getSchedSlotTitle,
  getSlotHalfLabel,
  normalizeSchedCode,
  parseSchedExcelFile,
  printSchedHtml,
  round2,
} from '../utils/schedulingUtils';
import { CourseSchedulingAutoWizard } from './CourseSchedulingAutoWizard';
import { CourseSchedulingReports } from './CourseSchedulingReports';
import { CourseSchedulingMasterGrid } from './CourseSchedulingMasterGrid';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  FileSpreadsheet,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Plus,
  Printer,
  Search,
  Settings2,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';

interface CourseSchedulingWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'admin' | 'academic_deputy' | 'department_head';
  actor: { id: string; name: string };
  allowedMajorNames?: string[];
  onDataUpdated?: () => void;
}

type WorkspaceSection =
  | 'overview'
  | 'classrooms'
  | 'programs'
  | 'professors'
  | 'courses'
  | 'rules'
  | 'master_grid'
  | 'schedule'
  | 'auto_wizard'
  | 'reports';

export const CourseSchedulingWorkspace: React.FC<CourseSchedulingWorkspaceProps> = ({
  isOpen,
  onClose,
  userRole,
  actor,
  allowedMajorNames = [],
  onDataUpdated,
}) => {
  const canManageMasterData = userRole === 'admin' || userRole === 'academic_deputy';
  const canViewSensitiveProfInfo = userRole === 'admin' || userRole === 'academic_deputy';

  const [section, setSection] = useState<WorkspaceSection>(
    canManageMasterData ? 'overview' : 'master_grid'
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
  const [courses, setCourses] = useState<SchedCurriculumCourse[]>(() =>
    Storage.getSchedCourses()
  );
  const [offerings, setOfferings] = useState<SchedCourseOffering[]>(() =>
    Storage.getSchedOfferings()
  );
  const [rules, setRules] = useState<SchedRulesSettings>(() => Storage.getSchedRules());

  const [activeTerm, setActiveTerm] = useState<string>(rules.activeTerm || '4041');
  const [newTermInput, setNewTermInput] = useState('');
  const [showNewTermBox, setShowNewTermBox] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const notify = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    window.setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 5000);
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

  // آمار خلاصه پیشخوان
  const overviewStats = useMemo(() => {
    let totalHours = 0;
    let hardConflicts = 0;
    for (const o of termOfferings) {
      totalHours += calculateOfferingBreakdown(o, rules).weeklyHours;
      if (detectOfferingConflicts(o, termOfferings, classrooms, professors).hasHardConflict) {
        hardConflicts++;
      }
    }
    return {
      activeClassrooms: classrooms.filter((r) => r.isActive).length,
      totalCohorts: programs.length,
      totalSections: programs.reduce((s, p) => s + Math.max(1, p.sections.length), 0),
      activeProfessors: professors.filter((p) => p.isActive).length,
      totalCourses: courses.length,
      termOfferingsCount: termOfferings.length,
      totalWeeklyHours: round2(totalHours),
      hardConflicts,
      sharedCount: termOfferings.filter(
        (o) => o.sharedWithTargets && o.sharedWithTargets.length > 0
      ).length,
    };
  }, [classrooms, programs, professors, courses, termOfferings, rules]);

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
        for (const item of res.programs) {
          const idx = merged.findIndex(
            (x) => x.majorCode === item.majorCode && x.entryTerm === item.entryTerm
          );
          if (idx >= 0) merged[idx] = { ...merged[idx], ...item, id: merged[idx].id };
          else merged.push(item);
        }
        persistPrograms(merged);
        notify('success', `${res.programs.length} ورودی و شعبه از اکسل پردازش و ذخیره شد.`);
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
        for (const item of res.courses) {
          const idx = merged.findIndex(
            (x) => x.courseCode === item.courseCode && x.majorCode === item.majorCode
          );
          if (idx >= 0) merged[idx] = { ...merged[idx], ...item, id: merged[idx].id };
          else merged.push(item);
        }
        persistCourses(merged);
        notify('success', `${res.courses.length} سرفصل درس از اکسل پردازش و ذخیره شد.`);
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
  const [progSections, setProgSections] = useState<
    Array<{ id: string; name: string; studentCount: number }>
  >([]);

  const openProgModal = (p?: SchedProgramCohort) => {
    if (p) {
      setEditingProgId(p.id);
      setProgMajorCode(p.majorCode);
      setProgMajorName(p.majorName);
      setProgEntryTerm(p.entryTerm);
      setProgTotalStudents(String(p.totalStudents));
      setProgSections(p.sections.map((s) => ({ ...s })));
    } else {
      setEditingProgId(null);
      setProgMajorCode('');
      setProgMajorName('');
      setProgEntryTerm('4031');
      setProgTotalStudents('35');
      setProgSections([{ id: `sec_${Date.now()}`, name: 'گروه ۱', studentCount: 35 }]);
    }
    setProgModalOpen(true);
  };

  const handleSaveProgram = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = normalizeSchedCode(progMajorCode);
    const cleanName = progMajorName.trim();
    const cleanEntry = normalizeSchedCode(progEntryTerm);
    if (!cleanCode || !cleanName || !cleanEntry) return;
    if (!/^\d{6}$/.test(cleanCode)) {
      notify('error', 'کد رشته باید دقیقاً ۶ رقم عددی باشد.');
      return;
    }
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
      persistPrograms(
        programs.map((p) =>
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
        )
      );
      notify('success', `اطلاعات رشته «${cleanName} - ورودی ${cleanEntry}» بروزرسانی شد.`);
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
  const [profModalOpen, setProfModalOpen] = useState(false);
  const [editingProfId, setEditingProfId] = useState<string | null>(null);
  const [profCode, setProfCode] = useState('');
  const [profName, setProfName] = useState('');
  const [profNationalId, setProfNationalId] = useState('');
  const [profDegree, setProfDegree] = useState('');
  const [profEmployment, setProfEmployment] =
    useState<SchedEmploymentType>('faculty_member');
  const [profPhone, setProfPhone] = useState('');
  const [profBank, setProfBank] = useState('');
  const [unavailProfModal, setUnavailProfModal] = useState<SchedProfessor | null>(null);
  const [unavailDraft, setUnavailDraft] = useState<string[]>([]);

  const openProfModal = (prof?: SchedProfessor) => {
    if (prof) {
      setEditingProfId(prof.id);
      setProfCode(prof.professorCode);
      setProfName(prof.fullName);
      setProfNationalId(prof.nationalId);
      setProfDegree(prof.degreeFull || '');
      setProfEmployment(prof.employmentType);
      setProfPhone(prof.phone || '');
      setProfBank(prof.bankAccount || '');
    } else {
      setEditingProfId(null);
      setProfCode('');
      setProfName('');
      setProfNationalId('');
      setProfDegree('');
      setProfEmployment('haghol_tadris_free');
      setProfPhone('');
      setProfBank('');
    }
    setProfModalOpen(true);
  };

  const handleSaveProf = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = normalizeSchedCode(profCode);
    const cleanName = profName.trim();
    const cleanNat = normalizeSchedCode(profNationalId) || cleanCode;
    if (!cleanCode || !cleanName) return;
    const dup = professors.find(
      (p) => p.professorCode === cleanCode && p.id !== editingProfId
    );
    if (dup) {
      notify(
        'error',
        `کد استاد ${cleanCode} قبلاً برای «${dup.fullName}» ثبت شده است. کد استاد باید یکتا باشد.`
      );
      return;
    }

    if (editingProfId) {
      persistProfessors(
        professors.map((p) =>
          p.id === editingProfId
            ? {
                ...p,
                professorCode: cleanCode,
                fullName: cleanName,
                nationalId: cleanNat,
                degreeFull: profDegree.trim(),
                employmentType: profEmployment,
                phone: normalizeSchedCode(profPhone),
                bankAccount: canViewSensitiveProfInfo
                  ? normalizeSchedCode(profBank)
                  : p.bankAccount,
              }
            : p
        )
      );
      notify('success', `اطلاعات استاد «${cleanName}» بروزرسانی شد.`);
    } else {
      persistProfessors([
        ...professors,
        {
          id: `prof_${Date.now()}`,
          professorCode: cleanCode,
          fullName: cleanName,
          nationalId: cleanNat,
          degreeFull: profDegree.trim(),
          employmentType: profEmployment,
          phone: normalizeSchedCode(profPhone),
          bankAccount: normalizeSchedCode(profBank),
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
      setEditingCourseId(null);
      setCrsCode('');
      setCrsTitle('');
      setCrsMajorCode(programs[0]?.majorCode || '');
      setCrsMajorName(programs[0]?.majorName || '');
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
    const cleanMajor = normalizeSchedCode(crsMajorCode);
    if (!/^\d{7}$/.test(cleanCode)) {
      notify('error', 'کد درس باید دقیقاً ۷ رقم عددی باشد (مبنای تشخیص دروس مشترک).');
      return;
    }
    if (!crsTitle.trim() || !cleanMajor || !crsMajorName.trim()) {
      notify('error', 'لطفاً عنوان درس، کد رشته ۶ رقمی و نام رشته را وارد نمایید.');
      return;
    }
    const th = Math.max(0, Number(normalizeSchedCode(crsThUnits)) || 0);
    const pr = Math.max(0, Number(normalizeSchedCode(crsPrUnits)) || 0);

    if (editingCourseId) {
      persistCourses(
        courses.map((c) =>
          c.id === editingCourseId
            ? {
                ...c,
                courseCode: cleanCode,
                title: crsTitle.trim(),
                majorCode: cleanMajor,
                majorName: crsMajorName.trim(),
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
          majorName: crsMajorName.trim(),
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
  const [offModalOpen, setOffModalOpen] = useState(false);
  const [editingOffId, setEditingOffId] = useState<string | null>(null);
  const [offCourseId, setOffCourseId] = useState('');
  const [offCohortId, setOffCohortId] = useState('');
  const [offSectionId, setOffSectionId] = useState('');
  const [offEnrolledCount, setOffEnrolledCount] = useState('28');
  const [offProfessorId, setOffProfessorId] = useState('');
  const [offClassroomId, setOffClassroomId] = useState('');
  const [offDay, setOffDay] = useState<SchedDayKey | ''>('saturday');
  const [offSlotIds, setOffSlotIds] = useState<string[]>([]);
  const [offSlotParts, setOffSlotParts] = useState<Record<string, SchedSlotHalf>>({});
  const [offSplitPart, setOffSplitPart] = useState<'full' | 'theory' | 'practical'>('full');
  const [offInternshipSubLabel, setOffInternshipSubLabel] = useState('');
  const [offInternshipGroups, setOffInternshipGroups] = useState<
    Array<{ id: string; label: string; studentCount: number; professorId: string }>
  >([]);
  const [modalAllChartCourses, setModalAllChartCourses] = useState(false);
  const [offSharedTargets, setOffSharedTargets] = useState<SchedSharedTarget[]>([]);
  const [offNotes, setOffNotes] = useState('');
  const [sharePickerCohortId, setSharePickerCohortId] = useState('');
  const [sharePickerSectionId, setSharePickerSectionId] = useState('');

  const selectedOffCourse = useMemo(
    () => courses.find((c) => c.id === offCourseId),
    [courses, offCourseId]
  );

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

    const visibleCourses = canManageMasterData
      ? courses
      : allowCrossMajorView
      ? courses
      : courses.filter((c) => isOwnMajorName(c.majorName));

    // اگر هدف مشخص شده، اول درس هم‌رشته یا درس چارت گروه را برگزین
    const firstCourse =
      (targetCohort
        ? visibleCourses.find((c) => c.majorCode === targetCohort.majorCode)
        : undefined) ||
      visibleCourses[0] ||
      courses[0];

    const matchingCohort =
      targetCohort ||
      programs.find((p) => p.majorCode === firstCourse?.majorCode) ||
      programs[0];

    const matchingSec = opts.sectionId
      ? matchingCohort?.sections.find((s) => s.id === opts.sectionId)
      : matchingCohort?.sections[0];

    const baseEnrolled =
      matchingSec?.studentCount || matchingCohort?.totalStudents || 28;
    const initSlotId = opts.slotId || sortedSlots[0]?.id || '';
    const initHalf: SchedSlotHalf = opts.slotHalf || 'full';

    setEditingOffId(null);
    setModalAllChartCourses(false);
    setOffCourseId(firstCourse?.id || '');
    setOffCohortId(matchingCohort?.id || '');
    setOffSectionId(matchingSec?.id || '');
    setOffEnrolledCount(String(baseEnrolled));
    setOffProfessorId('');
    setOffClassroomId('');
    setOffDay(opts.dayOfWeek || activeDays[0] || 'saturday');
    setOffSlotIds(initSlotId ? [initSlotId] : []);
    setOffSlotParts(initSlotId ? { [initSlotId]: initHalf } : {});
    setOffSplitPart('full');
    setOffInternshipSubLabel('');
    initInternshipGroupsForCourse(firstCourse, baseEnrolled, '');
    setOffSharedTargets([]);
    setOffNotes('');
    setSharePickerCohortId('');
    setSharePickerSectionId('');
    setOffModalOpen(true);
  };

  const openEditOfferingModal = (o: SchedCourseOffering) => {
    setEditingOffId(o.id);
    setModalAllChartCourses(true);
    setOffCourseId(o.courseId);
    setOffCohortId(o.cohortId);
    setOffSectionId(o.sectionId || '');
    setOffEnrolledCount(String(o.enrolledCount));
    setOffProfessorId(o.professorId || '');
    setOffClassroomId(o.classroomId || '');
    setOffDay(o.dayOfWeek || '');
    setOffSlotIds([...o.slotIds]);
    const parts: Record<string, SchedSlotHalf> = {};
    o.slotIds.forEach((sid) => {
      parts[sid] = getOfferingSlotHalf(o, sid);
    });
    setOffSlotParts(parts);
    setOffSplitPart(o.splitPart || 'full');
    setOffInternshipSubLabel(o.internshipSubGroupLabel || '');
    setOffInternshipGroups([]);
    setOffSharedTargets([...(o.sharedWithTargets || [])]);
    setOffNotes(o.notes || '');
    setSharePickerCohortId('');
    setSharePickerSectionId('');
    setOffModalOpen(true);
  };

  // پیش‌نمایش زنده تداخل‌ها و واحد معادل در مودال ثبت درس
  const candidateOffering = useMemo<SchedCourseOffering | null>(() => {
    if (!selectedOffCourse) return null;
    const cohort = programs.find((p) => p.id === offCohortId);
    if (!cohort) return null;
    const sec = cohort.sections.find((s) => s.id === offSectionId);
    const prof = professors.find((p) => p.id === offProfessorId);
    const room = classrooms.find((r) => r.id === offClassroomId);
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
    return {
      id: editingOffId || 'draft_preview',
      termKey: activeTerm,
      courseId: selectedOffCourse.id,
      courseCode: selectedOffCourse.courseCode,
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
      dayOfWeek: offDay || undefined,
      slotIds: offSlotIds,
      slotParts: Object.keys(offSlotParts).length > 0 ? offSlotParts : undefined,
      splitPart: offSplitPart,
      notes: offNotes.trim() || undefined,
      createdById: actor.id,
      createdByName: actor.name,
      createdByRole: userRole,
      updatedAt: new Date().toISOString(),
    };
  }, [
    selectedOffCourse,
    programs,
    offCohortId,
    offSectionId,
    professors,
    offProfessorId,
    classrooms,
    offClassroomId,
    offEnrolledCount,
    offInternshipSubLabel,
    offSplitPart,
    rules,
    editingOffId,
    activeTerm,
    offSharedTargets,
    offDay,
    offSlotIds,
    offSlotParts,
    offNotes,
    actor,
    userRole,
  ]);

  const candidateConflictReport = useMemo(() => {
    if (!candidateOffering) return { hasHardConflict: false, errors: [], warnings: [] };
    return detectOfferingConflicts(candidateOffering, termOfferings, classrooms, professors);
  }, [candidateOffering, termOfferings, classrooms, professors]);

  const candidateBreakdown = useMemo(() => {
    if (!candidateOffering) return null;
    return calculateOfferingBreakdown(candidateOffering, rules);
  }, [candidateOffering, rules]);

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

  const handleSaveOffering = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateOffering) return;

    // حالت ثبت چند شعبه کارورزی (مثلاً تقسیم ۲۴ نفر به دو شعبه ۱۲ نفره یا ۲۳ نفر به ۱۲+۱۱)
    if (
      !editingOffId &&
      selectedOffCourse?.practicalType === 'internship' &&
      offInternshipGroups.length > 0
    ) {
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
        const item: SchedCourseOffering = {
          ...candidateOffering,
          id: `off_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
          enrolledCount: Math.max(1, grp.studentCount || 1),
          weeklyHours: grpBd.weeklyHours,
          internshipSubGroupLabel: grp.label.trim() || `شعبه ${i + 1} کارورزی`,
          professorId: grpProf?.id,
          professorCode: grpProf?.professorCode,
          professorName: grpProf?.fullName,
          updatedAt: new Date().toISOString(),
        };
        const rep = detectOfferingConflicts(item, workingTerm, classrooms, professors);
        if (rep.hasHardConflict) {
          notify('error', `تداخل در ${item.internshipSubGroupLabel}: ${rep.errors[0]}`);
          return;
        }
        created.push(item);
        workingTerm.push(item);
      }
      persistOfferings([...offerings, ...created]);
      notify(
        'success',
        `${created.length} شعبه کارورزی برای درس «${selectedOffCourse.title}» با موفقیت ثبت شد.`
      );
      setOffModalOpen(false);
      return;
    }

    if (candidateConflictReport.hasHardConflict) {
      notify('error', 'به دلیل وجود تداخل زمانی قطعی امکان ذخیره وجود ندارد. تداخل را برطرف نمایید.');
      return;
    }
    const saved: SchedCourseOffering = {
      ...candidateOffering,
      id: editingOffId || `off_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      updatedAt: new Date().toISOString(),
    };
    if (editingOffId) {
      persistOfferings(offerings.map((o) => (o.id === editingOffId ? saved : o)));
      notify('success', `برنامه درس «${saved.courseTitle}» بروزرسانی شد.`);
    } else {
      persistOfferings([...offerings, saved]);
      notify('success', `درس «${saved.courseTitle}» با موفقیت در برنامه ترم ${activeTerm} ثبت شد.`);
    }
    setOffModalOpen(false);
  };

  // =====================================================
  // بخش تنظیمات و ضرایب
  // =====================================================
  const [draftRules, setDraftRules] = useState<SchedRulesSettings>(rules);
  React.useEffect(() => {
    setDraftRules(rules);
  }, [rules]);

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
      groupTitle: 'پیشخوان و پیکربندی',
      items: [
        { key: 'overview', label: 'نمای کلی و وضعیت ترم', icon: LayoutDashboard },
        { key: 'rules', label: 'قوانین، ضرایب و سانس‌ها', icon: Settings2 },
      ],
    },
    {
      groupTitle: 'ورود اطلاعات اولیه',
      items: [
        {
          key: 'classrooms',
          label: 'کلاس‌های فیزیکی',
          icon: Building2,
          badge: String(classrooms.length),
        },
        {
          key: 'programs',
          label: 'رشته‌ها، ورودی‌ها و شعب',
          icon: Layers,
          badge: String(programs.length),
        },
        {
          key: 'professors',
          label: 'اساتید و عدم حضور',
          icon: Users,
          badge: String(professors.length),
        },
        {
          key: 'courses',
          label: 'لیست دروس (کد ۷ رقمی)',
          icon: BookOpen,
          badge: String(courses.length),
        },
      ],
    },
    {
      groupTitle: 'برنامه‌ریزی و گزارش‌ها',
      items: [
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
      ],
    },
  ];

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
                if (canManageMasterData) {
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
            {canManageMasterData && (
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

          {showNewTermBox && canManageMasterData && (
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

      {/* بدنه اصلی: سایدبار ساختارمند + محتوای اصلی */}
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 tabular-nums">
                <button
                  type="button"
                  onClick={() => setSection('classrooms')}
                  className="text-right rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 hover:border-teal-400 transition cursor-pointer"
                >
                  <div className="text-xs text-slate-500">کلاس‌های فیزیکی فعال</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {overviewStats.activeClassrooms}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSection('programs')}
                  className="text-right rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 hover:border-teal-400 transition cursor-pointer"
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
                  onClick={() => setSection('professors')}
                  className="text-right rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 hover:border-teal-400 transition cursor-pointer"
                >
                  <div className="text-xs text-slate-500">اساتید ثبت‌شده</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {overviewStats.activeProfessors}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSection('courses')}
                  className="text-right rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 hover:border-teal-400 transition cursor-pointer"
                >
                  <div className="text-xs text-slate-500">عناوین سرفصل دروس</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {overviewStats.totalCourses}
                  </div>
                </button>
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                  <div className="text-xs text-slate-500">دروس ارائه‌شده ترم {activeTerm}</div>
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
                  {canManageMasterData && (
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

          {/* ۲. مدیریت کلاس‌های فیزیکی */}
          {section === 'classrooms' && (
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
                                onClick={() =>
                                  persistClassrooms(classrooms.filter((x) => x.id !== r.id))
                                }
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-800 cursor-pointer"
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

          {/* ۳. رشته‌ها (۶ رقمی)، ورودی‌ها و شعب/گروه‌ها */}
          {section === 'programs' && (
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
                                onClick={() =>
                                  persistPrograms(programs.filter((x) => x.id !== p.id))
                                }
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-800 cursor-pointer"
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

          {/* ۴. اساتید */}
          {section === 'professors' && (
            <div className="space-y-4 max-w-6xl mx-auto">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    بانک اساتید (کد استاد یکتا، مشخصات استخدامی و زمان عدم حضور)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تمایز قطعی اساتید هم‌نام با کد استاد یکتا · دسترسی ورود اساتید با کد استاد و کد ملی
                    {!canViewSensitiveProfInfo && ' · شماره حساب و کدملی نزد مدیران گروه مخفی است'}
                  </p>
                </div>
                {canManageMasterData && (
                  <div className="flex flex-wrap gap-2">
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
                      <span>ورود از اکسل</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => void handleExcelImport('professors', e)}
                        className="hidden"
                      />
                    </label>
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

              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={profSearch}
                    onChange={(e) => setProfSearch(e.target.value)}
                    placeholder="جستجوی نام، کد استاد یا مدرک تحصیلی..."
                    className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-right">
                      <th className="p-3">کد استاد</th>
                      <th className="p-3">نام و نام خانوادگی</th>
                      <th className="p-3">مدرک و رشته</th>
                      <th className="p-3">نوع استخدام</th>
                      <th className="p-3">شماره تماس</th>
                      {canViewSensitiveProfInfo && <th className="p-3">کدملی / حساب بانکی</th>}
                      <th className="p-3 text-center">واحد معادل ترم {activeTerm}</th>
                      <th className="p-3 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                    {professors
                      .filter((p) => {
                        const q = profSearch.trim().toLowerCase();
                        if (!q) return true;
                        return `${p.fullName} ${p.professorCode} ${p.degreeFull}`
                          .toLowerCase()
                          .includes(q);
                      })
                      .map((p) => {
                        const summary = calculateProfessorLoadSummary(p.id, termOfferings, rules);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-mono font-bold text-teal-700 dark:text-teal-400">
                              {p.professorCode}
                            </td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">
                              {p.fullName}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-300">
                              {p.degreeFull || '—'}
                            </td>
                            <td className="p-3">{SCHED_EMPLOYMENT_LABELS[p.employmentType]}</td>
                            <td className="p-3 font-mono" dir="ltr">
                              {p.phone || '—'}
                            </td>
                            {canViewSensitiveProfInfo && (
                              <td className="p-3 font-mono text-[11px]" dir="ltr">
                                <div>{p.nationalId || '—'}</div>
                                <div className="text-slate-400">{p.bankAccount || 'بدون حساب'}</div>
                              </td>
                            )}
                            <td className="p-3 text-center font-bold">
                              {summary.equivalentUnits} معادل ({summary.weeklyHours} ساعت)
                            </td>
                            <td className="p-3 text-center">
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
                                      onClick={() =>
                                        persistProfessors(professors.filter((x) => x.id !== p.id))
                                      }
                                      className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-800 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ۵. لیست دروس رشته‌ها با کد ۷ رقمی */}
          {section === 'courses' && (
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
                    {courses
                      .filter((c) => {
                        if (courseMajorFilter !== 'all' && c.majorCode !== courseMajorFilter)
                          return false;
                        const q = courseSearch.trim().toLowerCase();
                        if (!q) return true;
                        return `${c.courseCode} ${c.title} ${c.majorName}`.toLowerCase().includes(q);
                      })
                      .map((c) => {
                        const bd = calculateOfferingBreakdown(c, rules);
                        const sharedMajorsCount = courses.filter(
                          (other) => other.courseCode === c.courseCode
                        ).length;
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
            </div>
          )}

          {/* ۶. قوانین محاسبه ساعت، واحد معادل و زمان‌بندی سانس‌ها */}
          {section === 'rules' && (
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
                        سانس‌های زمانی کلاس‌ها (عنوان استاندارد «سانس اول، دوم...» + ساعت قابل ویرایش)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        پیش‌فرض سیستم ۶ سانس دو ساعتی از ۰۸:۰۰ تا ۲۰:۰۰ است؛ با تغییر ساعت، عنوان سانس در تمام جداول به‌صورت «سانس اول»، «سانس دوم» و... و ساعت جدید در زیر آن نمایش داده می‌شود.
                      </span>
                    </div>
                    {canManageMasterData && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <label className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                          <span className="text-[11px] font-bold">تعداد سانس روزانه:</span>
                          <select
                            value={draftRules.timeSlots.length}
                            onChange={(e) => {
                              const cnt = Math.max(1, Math.min(10, Number(e.target.value) || 6));
                              const generated = buildDefaultTimeSlots(cnt, 8, 2);
                              // حفظ ساعت‌های قبلی در صورت وجود
                              const merged = generated.map((g, idx) => {
                                const old = [...draftRules.timeSlots].sort(
                                  (a, b) => a.order - b.order
                                )[idx];
                                return old
                                  ? {
                                      ...g,
                                      id: old.id,
                                      startTime: old.startTime,
                                      endTime: old.endTime,
                                    }
                                  : g;
                              });
                              setDraftRules((prev) => ({ ...prev, timeSlots: merged }));
                            }}
                            className="bg-transparent font-mono font-black focus:outline-none cursor-pointer"
                          >
                            {[3, 4, 5, 6, 7, 8].map((n) => (
                              <option key={n} value={n} className="bg-white dark:bg-slate-900">
                                {n} سانس
                              </option>
                            ))}
                          </select>
                        </label>
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
                      .map((slot, sIdx) => (
                        <div
                          key={slot.id}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <input
                              type="text"
                              disabled={!canManageMasterData}
                              value={getSchedSlotTitle(slot, sIdx)}
                              onChange={(e) =>
                                setDraftRules((prev) => ({
                                  ...prev,
                                  timeSlots: prev.timeSlots.map((s) =>
                                    s.id === slot.id ? { ...s, label: e.target.value } : s
                                  ),
                                }))
                              }
                              className="font-bold bg-transparent border-b border-transparent focus:border-teal-500 focus:outline-none w-full"
                            />
                            {canManageMasterData && draftRules.timeSlots.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftRules((prev) => ({
                                    ...prev,
                                    timeSlots: prev.timeSlots.filter((s) => s.id !== slot.id),
                                  }))
                                }
                                className="text-rose-500 hover:text-rose-700 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 font-mono" dir="ltr">
                            <input
                              type="text"
                              disabled={!canManageMasterData}
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
                              disabled={!canManageMasterData}
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
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

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
              onPersistOfferings={persistOfferings}
              onOpenNewOffering={(opts) => openNewOfferingModal(opts)}
              onOpenEditOffering={(o) => openEditOfferingModal(o)}
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
                            'کلاس فیزیکی': o.classroomName || '-',
                            'روز': o.dayOfWeek ? SCHED_DAY_LABELS[o.dayOfWeek] : 'تعیین‌نشده',
                            'سانس': o.slotIds
                              .map((id) => {
                                const idx = sortedSlots.findIndex((s) => s.id === id);
                                const sl = idx >= 0 ? sortedSlots[idx] : undefined;
                                return sl ? `${getSchedSlotTitle(sl, idx)} (${sl.startTime}-${sl.endTime})` : id;
                              })
                              .join(' + '),
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
                    {professors.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} (کد {p.professorCode})
                      </option>
                    ))}
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
                            const items = filteredScheduleOfferings.filter(
                              (o) => o.dayOfWeek === day && o.slotIds.includes(slot.id)
                            );
                            return (
                              <td
                                key={slot.id}
                                className="p-1.5 align-top border-l border-slate-200 dark:border-slate-700 last:border-l-0 min-w-[155px]"
                              >
                                <div className="space-y-1.5">
                                  {items.map((o) => {
                                    const conf = detectOfferingConflicts(
                                      o,
                                      termOfferings,
                                      classrooms,
                                      professors
                                    );
                                    const bd = calculateOfferingBreakdown(o, rules);
                                    return (
                                      <div
                                        key={o.id}
                                        onClick={() => openEditOfferingModal(o)}
                                        className={`p-2 rounded-xl border text-right cursor-pointer transition ${
                                          conf.hasHardConflict
                                            ? 'border-rose-400 bg-rose-50/80 dark:bg-rose-950/30'
                                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:border-teal-500'
                                        }`}
                                      >
                                        <div className="font-bold text-slate-900 dark:text-white leading-snug">
                                          {o.courseTitle}
                                        </div>
                                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                                          {o.courseCode} · {bd.rawUnits} واحد ({bd.weeklyHours} س)
                                        </div>
                                        <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">
                                          {o.ownerMajorName} ({o.entryTerm}
                                          {o.sectionName ? ` - ${o.sectionName}` : ''})
                                        </div>
                                        <div className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold">
                                          {o.professorName || 'بدون استاد'} ·{' '}
                                          {o.classroomName || 'بدون کلاس'}
                                        </div>
                                        {o.sharedWithTargets && o.sharedWithTargets.length > 0 && (
                                          <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold mt-0.5">
                                            مشترک با {o.sharedWithTargets.length} گروه دیگر
                                          </div>
                                        )}
                                        {conf.hasHardConflict && (
                                          <div className="text-[10px] text-rose-600 font-extrabold mt-0.5">
                                            تداخل زمانی!
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
                        <th className="p-3">کد درس ۷ رقمی</th>
                        <th className="p-3">عنوان درس</th>
                        <th className="p-3">رشته، ورودی و شعبه</th>
                        <th className="p-3">استاد</th>
                        <th className="p-3">کلاس / زمان</th>
                        <th className="p-3 text-center">ساعت / واحد معادل</th>
                        <th className="p-3 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                      {filteredScheduleOfferings.map((o) => {
                        const bd = calculateOfferingBreakdown(o, rules);
                        const conf = detectOfferingConflicts(
                          o,
                          termOfferings,
                          classrooms,
                          professors
                        );
                        return (
                          <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                              {o.courseCode}
                            </td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">
                              {o.courseTitle}
                              {conf.hasHardConflict && (
                                <div className="text-[10px] text-rose-600 font-extrabold">
                                  دارای تداخل زمانی
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
                              <div>{o.classroomName || 'بدون کلاس'}</div>
                              <div className="text-[10px] text-slate-500">
                                {o.dayOfWeek ? SCHED_DAY_LABELS[o.dayOfWeek] : 'بدون روز'} ·{' '}
                                {o.slotIds
                                  .map((id) => {
                                    const idx = sortedSlots.findIndex((s) => s.id === id);
                                    const sl = idx >= 0 ? sortedSlots[idx] : undefined;
                                    return sl
                                      ? `${getSchedSlotTitle(sl, idx)} (${sl.startTime}-${sl.endTime})`
                                      : id;
                                  })
                                  .join(' + ')}
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
                                  onClick={() =>
                                    persistOfferings(offerings.filter((x) => x.id !== o.id))
                                  }
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
                  persistOfferings([...offerings, ...newOfferings]);
                  notify(
                    'success',
                    `${newOfferings.length} درس تولیدشده توسط ویزارد هوشمند در برنامه ترم ${activeTerm} ثبت شد.`
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

      {/* ================================================================= */}
      {/* مودال‌ها: کلاس فیزیکی، رشته، استاد، عدم حضور استاد، درس و ثبت ارائه */}
      {/* ================================================================= */}

      {roomModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
              <div className="grid grid-cols-3 gap-3">
                <label className="col-span-2 space-y-1">
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
                  <span className="font-bold">کل نفرات ورودی</span>
                  <input
                    type="number"
                    min={1}
                    value={progTotalStudents}
                    onChange={(e) => setProgTotalStudents(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </label>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold">شعب / گروه‌های این ورودی</span>
                  <button
                    type="button"
                    onClick={() =>
                      setProgSections((prev) => [
                        ...prev,
                        {
                          id: `sec_${Date.now()}`,
                          name: `گروه ${prev.length + 1}`,
                          studentCount: 25,
                        },
                      ])
                    }
                    className="text-teal-600 font-bold hover:underline cursor-pointer"
                  >
                    + افزودن شعبه
                  </button>
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
                            i === idx ? { ...x, studentCount: Number(e.target.value) || 1 } : x
                          )
                        )
                      }
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                    />
                    {progSections.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setProgSections((prev) => prev.filter((_, i) => i !== idx))
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
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm">
                {editingProfId ? 'ویرایش مشخصات استاد' : 'ثبت استاد جدید'}
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
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="font-bold">کد استاد یکتا *</span>
                  <input
                    type="text"
                    required
                    value={profCode}
                    onChange={(e) => setProfCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                    dir="ltr"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-bold">نام و نام خانوادگی *</span>
                  <input
                    type="text"
                    required
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="font-bold">کد ملی (رمز ورود پیش‌فرض) *</span>
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
                  <span className="font-bold">نوع استخدام</span>
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
              </div>
              <label className="block space-y-1">
                <span className="font-bold">مدرک تحصیلی و گرایش</span>
                <input
                  type="text"
                  value={profDegree}
                  onChange={(e) => setProfDegree(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="font-bold">شماره تماس</span>
                  <input
                    type="text"
                    value={profPhone}
                    onChange={(e) => setProfPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                    dir="ltr"
                  />
                </label>
                {canViewSensitiveProfInfo && (
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
                )}
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
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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

      {/* مودال ثبت و ویرایش درس در برنامه (توسط مدیر سامانه، معاونت و مدیر گروه) */}
      {offModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-5 border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm">
                {editingOffId
                  ? `ویرایش برنامه درس: ${selectedOffCourse?.title || ''}`
                  : `ثبت درس جدید در برنامه هفتگی ترم ${activeTerm}`}
              </h3>
              <button
                type="button"
                onClick={() => setOffModalOpen(false)}
                className="p-1 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOffering} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">انتخاب درس از چارت (کد ۷ رقمی) *</span>
                    {!canManageMasterData && (
                      <label className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={modalAllChartCourses}
                          onChange={(e) => setModalAllChartCourses(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <span>همه دروس دانشگاه</span>
                      </label>
                    )}
                  </div>
                  <select
                    required
                    value={offCourseId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setOffCourseId(nextId);
                      const c = courses.find((x) => x.id === nextId);
                      if (c) {
                        let currentEnrolled = Number(normalizeSchedCode(offEnrolledCount)) || 28;
                        if (!offCohortId) {
                          const coh = programs.find((p) => p.majorCode === c.majorCode);
                          if (coh) {
                            setOffCohortId(coh.id);
                            const sec = coh.sections[0];
                            setOffSectionId(sec?.id || '');
                            currentEnrolled = sec?.studentCount || coh.totalStudents;
                            setOffEnrolledCount(String(currentEnrolled));
                          }
                        }
                        if (!editingOffId) {
                          initInternshipGroupsForCourse(c, currentEnrolled, offProfessorId);
                        }
                        setOffSharedTargets([]);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    {courses
                      .filter(
                        (c) =>
                          canManageMasterData ||
                          allowCrossMajorView ||
                          modalAllChartCourses ||
                          isOwnMajorName(c.majorName)
                      )
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} — کد {c.courseCode} ({c.majorName})
                        </option>
                      ))}
                  </select>
                </div>

                <label className="space-y-1">
                  <span className="font-bold">رشته و ورودی میزبان *</span>
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
                      if (!editingOffId && selectedOffCourse?.practicalType === 'internship') {
                        initInternshipGroupsForCourse(selectedOffCourse, countVal, offProfessorId);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.majorName} ({p.majorCode}) — ورودی {p.entryTerm}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

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

              {/* مدیریت اختصاصی شعبه‌های کارورزی (مثلاً تقسیم ۲۴ نفر به ۱۲+۱۲ یا ۲۳ به ۱۲+۱۱ یا ۲۵ به ۱۲+۱۳) */}
              {selectedOffCourse?.practicalType === 'internship' && (
                <div className="p-3.5 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 space-y-2.5">
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
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.fullName}
                                </option>
                              ))}
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
                    onChange={(e) => setOffProfessorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="">-- بدون استاد / تعیین در آینده --</option>
                    {professors
                      .filter((p) => p.isActive)
                      .map((p) => {
                        const ld = calculateProfessorLoadSummary(p.id, termOfferings, rules);
                        return (
                          <option key={p.id} value={p.id}>
                            {p.fullName} (کد {p.professorCode}) — بار فعلی: {ld.equivalentUnits} معادل
                          </option>
                        );
                      })}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="font-bold">تخصیص کلاس فیزیکی</span>
                  <select
                    value={offClassroomId}
                    onChange={(e) => setOffClassroomId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="">-- بدون کلاس فیزیکی --</option>
                    {classrooms
                      .filter((r) => r.isActive)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} (کد {r.code} · ظرفیت {r.capacity})
                        </option>
                      ))}
                  </select>
                </label>
              </div>

              {/* روز و سانس و تفکیک دو تک‌ساعت */}
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="font-bold">روز برگزاری کلاس</span>
                    <select
                      value={offDay}
                      onChange={(e) => setOffDay(e.target.value as SchedDayKey | '')}
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
                  <div className="space-y-1">
                    <span className="font-bold block">سانس‌های زمانی</span>
                    <div className="flex flex-wrap gap-1.5">
                      {sortedSlots.map((slot, sIdx) => {
                        const checked = offSlotIds.includes(slot.id);
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => {
                              if (checked) {
                                setOffSlotIds((prev) => prev.filter((id) => id !== slot.id));
                                setOffSlotParts((prev) => {
                                  const next = { ...prev };
                                  delete next[slot.id];
                                  return next;
                                });
                              } else {
                                setOffSlotIds((prev) => [...prev, slot.id]);
                                setOffSlotParts((prev) => ({
                                  ...prev,
                                  [slot.id]: prev[slot.id] || 'full',
                                }));
                              }
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
                </div>

                {offSlotIds.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
                      تعیین کل سانس یا تفکیک دو تک‌ساعت (نیمه راست: ساعت اول · نیمه چپ: ساعت دوم)
                    </div>
                    <div className="space-y-1.5">
                      {offSlotIds.map((sid) => {
                        const sIdx = sortedSlots.findIndex((x) => x.id === sid);
                        const sl = sIdx >= 0 ? sortedSlots[sIdx] : undefined;
                        const curHalf: SchedSlotHalf = offSlotParts[sid] || 'full';
                        return (
                          <div
                            key={`half_${sid}`}
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
                                    setOffSlotParts((prev) => ({ ...prev, [sid]: h }))
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

              {/* پیش‌نمایش محاسبه ساعات و واحد معادل + خطاهای تداخل */}
              {candidateBreakdown && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 tabular-nums">
                  <span>
                    واحد کل: <strong>{candidateBreakdown.rawUnits}</strong> (نظری:{' '}
                    {candidateBreakdown.activeTheoryUnits} + عملی:{' '}
                    {candidateBreakdown.activePracticalUnits})
                  </span>
                  <span>
                    ساعت هفتگی کلاس: <strong>{candidateBreakdown.weeklyHours} ساعت</strong>
                  </span>
                  <span className="text-teal-700 dark:text-teal-400 font-black">
                    واحد معادل استاد: {candidateBreakdown.equivalentUnits}
                  </span>
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

              <div className="flex items-center justify-between gap-2 pt-2">
                {editingOffId ? (
                  <button
                    type="button"
                    onClick={() => {
                      persistOfferings(offerings.filter((x) => x.id !== editingOffId));
                      setOffModalOpen(false);
                      notify('success', 'درس از برنامه ترم حذف شد.');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-800 font-bold cursor-pointer"
                  >
                    حذف از برنامه
                  </button>
                ) : (
                  <div />
                )}
                <button
                  type="submit"
                  disabled={
                    !editingOffId &&
                    selectedOffCourse?.practicalType === 'internship' &&
                    offInternshipGroups.length > 0
                      ? false
                      : candidateConflictReport.hasHardConflict
                  }
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold cursor-pointer"
                >
                  {editingOffId
                    ? 'ذخیره تغییرات درس'
                    : selectedOffCourse?.practicalType === 'internship' &&
                      offInternshipGroups.length > 1
                    ? `ثبت قطعی ${offInternshipGroups.length.toLocaleString('fa-IR')} شعبه کارورزی`
                    : 'ثبت قطعی در برنامه هفتگی'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
