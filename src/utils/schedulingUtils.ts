import {
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
  SchedOfferingHistoryDelta,
  SchedOfferingHistoryEntry,
  SchedPracticalUnitType,
  SchedProfessor,
  SchedProgramCohort,
  SchedRulesSettings,
  SchedSlotHalf,
  SchedTimeSlot,
  SchedWorkspaceRole,
  StudentScheduleAccessScope,
} from '../types';
import { toEnglishDigits } from './excelUtils';
import {
  addDaysToJalaliDate,
  getJalaliDayOfWeekKey,
  getJalaliWeekdayLabelFromDate,
  parseJalaliDate,
} from './jalaliCalendar';

export const SCHED_DAYS_ORDER: SchedDayKey[] = [
  'saturday',
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
];

export const SCHED_DAY_LABELS: Record<SchedDayKey, string> = {
  saturday: 'شنبه',
  sunday: 'یکشنبه',
  monday: 'دوشنبه',
  tuesday: 'سه‌شنبه',
  wednesday: 'چهارشنبه',
  thursday: 'پنج‌شنبه',
  friday: 'جمعه',
};

export const SCHED_ROOM_TYPE_LABELS: Record<SchedClassroomType, string> = {
  ordinary: 'کلاس عادی (نظری)',
  lab: 'آزمایشگاه',
  workshop: 'کارگاه',
  computer_av: 'سایت کامپیوتر / سمعی‌بصری',
};

export const SCHED_COURSE_TYPE_LABELS: Record<SchedCourseType, string> = {
  theoretical: 'نظری',
  theoretical_practical: 'نظری - عملی',
  practical: 'عملی محض',
};

export const SCHED_PRACTICAL_TYPE_LABELS: Record<SchedPracticalUnitType, string> = {
  normal_lab: 'عادی / آزمایشگاهی',
  workshop: 'کارگاهی',
  internship: 'کارورزی',
};

export const SCHED_EMPLOYMENT_LABELS: Record<SchedEmploymentType, string> = {
  mamoor_amoozeshi: 'مامور آموزشی',
  faculty_member: 'هیات علمی',
  haghol_tadris_ap: 'حق التدریس آموزش و پرورش',
  haghol_tadris_free: 'حق التدریس آزاد',
  staff: 'کارمند',
  retired: 'بازنشسته',
};

export function normalizeSchedCode(raw: string | number | undefined | null): string {
  return toEnglishDigits(String(raw ?? '')).replace(/\s+/g, '').trim();
}

export function parseDecimalUnits(raw: string | number | undefined | null): number {
  const clean = toEnglishDigits(String(raw ?? ''))
    .replace(/[٫,/،]/g, '.')
    .replace(/\s+/g, '')
    .trim();
  if (!clean) return 0;
  const n = Number(clean);
  return Number.isFinite(n) && n >= 0 ? round2(n) : 0;
}

export function normalizePersianText(raw: string | undefined | null): string {
  return String(raw ?? '')
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[ۀة]/g, 'ه')
    .replace(/\u200c/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const PERSIAN_SLOT_ORDINALS = [
  'سانس اول',
  'سانس دوم',
  'سانس سوم',
  'سانس چهارم',
  'سانس پنجم',
  'سانس ششم',
  'سانس هفتم',
  'سانس هشتم',
  'سانس نهم',
  'سانس دهم',
  'سانس یازدهم',
  'سانس دوازدهم',
];

export function getSchedSlotOrdinalLabel(index: number): string {
  if (index >= 0 && index < PERSIAN_SLOT_ORDINALS.length) {
    return PERSIAN_SLOT_ORDINALS[index];
  }
  return `سانس ${(index + 1).toLocaleString('fa-IR')}`;
}

export function isTimeRangeLikeLabel(label: string | undefined | null): boolean {
  const clean = normalizeSchedCode(label);
  if (!clean) return true;
  // اگر برچسب صرفاً بازه ساعتی باشد (مانند ۰۸:۰۰-۱۰:۰۰ یا 8تا10) باید عنوان سانس جایگزین شود
  return /^\d{1,2}(:\d{2})?[-–تا]+\d{1,2}(:\d{2})?$/.test(clean);
}

export function getSchedSlotTitle(slot: SchedTimeSlot, orderIndex?: number): string {
  if (isTimeRangeLikeLabel(slot.label)) {
    const idx = typeof orderIndex === 'number' ? orderIndex : Math.max(0, (slot.order || 1) - 1);
    return getSchedSlotOrdinalLabel(idx);
  }
  return slot.label.trim();
}

export function getSchedSlotTimeRange(slot: SchedTimeSlot): string {
  const s = (slot.startTime || '').trim();
  const e = (slot.endTime || '').trim();
  if (!s && !e) return '';
  return `${s} - ${e}`;
}

export function buildDefaultTimeSlots(
  count: number,
  startHour = 8,
  durationHours = 2
): SchedTimeSlot[] {
  const safeCount = Math.max(1, Math.min(12, Math.floor(count) || 6));
  const safeStart = Math.max(6, Math.min(18, Number(startHour) || 8));
  const safeDur = Math.max(1, Math.min(4, Number(durationHours) || 2));
  const slots: SchedTimeSlot[] = [];
  for (let i = 0; i < safeCount; i++) {
    const h1 = safeStart + i * safeDur;
    const h2 = h1 + safeDur;
    const fmt = (h: number) => `${String(Math.min(23, Math.floor(h))).padStart(2, '0')}:00`;
    slots.push({
      id: `slot_${i + 1}`,
      label: getSchedSlotOrdinalLabel(i),
      startTime: fmt(h1),
      endTime: fmt(h2),
      order: i + 1,
    });
  }
  return slots;
}

export function getSlotDurationHours(slot: SchedTimeSlot): number {
  const parseMinutes = (raw: string): number | null => {
    const clean = toEnglishDigits(String(raw ?? '')).trim();
    const m = /^(\d{1,2})(?::(\d{2}))?$/.exec(clean);
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2] || 0);
    return h * 60 + min;
  };
  const s = parseMinutes(slot.startTime);
  const e = parseMinutes(slot.endTime);
  if (s === null || e === null || e <= s) return 2;
  return round2((e - s) / 60);
}

export function buildSevenToEightSlot(): SchedTimeSlot {
  return {
    id: 'slot_07_08',
    label: 'تک‌ساعت ۷ تا ۸',
    startTime: '07:00',
    endTime: '08:00',
    order: 0,
  };
}

export function getOfferingSlotHalf(
  offering: Pick<SchedCourseOffering, 'slotParts'>,
  slotId: string
): SchedSlotHalf {
  return offering.slotParts?.[slotId] || 'full';
}

export function doSlotHalvesOverlap(h1: SchedSlotHalf, h2: SchedSlotHalf): boolean {
  if (h1 === 'full' || h2 === 'full') return true;
  return h1 === h2;
}

export function getSlotHalfLabel(half: SchedSlotHalf): string {
  if (half === 'first_hour') return 'ساعت اول (راست)';
  if (half === 'second_hour') return 'ساعت دوم (چپ)';
  return 'کل سانس (۲ ساعته)';
}

export function computeInternshipSplitPlan(
  totalStudents: number,
  maxPerGroup = 12
): Array<{ label: string; studentCount: number }> {
  const total = Math.max(1, Math.floor(totalStudents) || 1);
  const cap = Math.max(1, Math.floor(maxPerGroup) || 12);
  if (total <= cap) {
    return [{ label: 'شعبه ۱ کارورزی', studentCount: total }];
  }
  // تقسیم هوشمند بر مبنای ظرفیت استاندارد (مثلاً ۲۴ -> ۱۲ و ۱۲؛ ۲۳ -> ۱۲ و ۱۱؛ ۲۵ -> ۱۲ و ۱۳)
  const groupCount = Math.max(2, Math.round(total / cap));
  const base = Math.floor(total / groupCount);
  const rem = total % groupCount;
  const result: Array<{ label: string; studentCount: number }> = [];
  for (let i = 0; i < groupCount; i++) {
    // توزیع طوری که گروه‌های اول عدد استاندارد/بزرگ‌تر را بگیرند (مثلاً 12 و 11، یا 13 و 12، یا 12 و 12)
    const count = base + (i < rem ? 1 : 0);
    result.push({
      label: `شعبه ${(i + 1).toLocaleString('fa-IR')} کارورزی`,
      studentCount: count,
    });
  }
  return result;
}

export function getPracticalHoursRate(
  practicalType: SchedPracticalUnitType,
  rules: SchedRulesSettings
): number {
  if (practicalType === 'workshop') return rules.hoursPerUnit.practicalWorkshop;
  if (practicalType === 'internship') return rules.hoursPerUnit.practicalInternship;
  return rules.hoursPerUnit.practicalNormalLab;
}

export function getPracticalEquivalentRatePerUnit(
  practicalType: SchedPracticalUnitType,
  enrolledCount: number,
  rules: SchedRulesSettings
): number {
  if (practicalType === 'workshop') return rules.equivalentPerUnit.practicalWorkshop;
  if (practicalType === 'internship') {
    const minStudents = Math.max(1, rules.equivalentPerUnit.internshipMinStudents || 12);
    const baseEq = rules.equivalentPerUnit.practicalInternshipBase || 3;
    const count = Math.max(0, Number(enrolledCount) || 0);
    if (count >= minStudents) return baseEq;
    return round2(count * (baseEq / minStudents));
  }
  return rules.equivalentPerUnit.practicalNormalLab;
}

export function calculateOfferingBreakdown(
  item: {
    theoreticalUnits: number;
    practicalUnits: number;
    practicalType: SchedPracticalUnitType;
    splitPart?: 'full' | 'theory' | 'practical';
    enrolledCount?: number;
  },
  rules: SchedRulesSettings
): {
  activeTheoryUnits: number;
  activePracticalUnits: number;
  rawUnits: number;
  weeklyHours: number;
  theoreticalHours: number;
  practicalHours: number;
  equivalentUnits: number;
  theoreticalEquivalent: number;
  practicalEquivalent: number;
} {
  const split = item.splitPart || 'full';
  const activeTheoryUnits = split === 'practical' ? 0 : Math.max(0, Number(item.theoreticalUnits) || 0);
  const activePracticalUnits = split === 'theory' ? 0 : Math.max(0, Number(item.practicalUnits) || 0);

  const theoreticalHours = round2(activeTheoryUnits * (rules.hoursPerUnit.theoretical || 1));
  const practicalHours = round2(
    activePracticalUnits * getPracticalHoursRate(item.practicalType, rules)
  );
  const weeklyHours = round2(theoreticalHours + practicalHours);

  const theoreticalEquivalent = round2(
    activeTheoryUnits * (rules.equivalentPerUnit.theoretical || 1)
  );
  const practicalRate = getPracticalEquivalentRatePerUnit(
    item.practicalType,
    item.enrolledCount ?? 0,
    rules
  );
  const practicalEquivalent = round2(activePracticalUnits * practicalRate);
  const equivalentUnits = round2(theoreticalEquivalent + practicalEquivalent);
  const rawUnits = round2(activeTheoryUnits + activePracticalUnits);

  return {
    activeTheoryUnits,
    activePracticalUnits,
    rawUnits,
    weeklyHours,
    theoreticalHours,
    practicalHours,
    equivalentUnits,
    theoreticalEquivalent,
    practicalEquivalent,
  };
}

export interface ProfessorLoadSummary {
  professorId: string;
  offeringCount: number;
  rawUnits: number;
  theoreticalUnits: number;
  practicalUnits: number;
  weeklyHours: number;
  equivalentUnits: number;
  activeDays: SchedDayKey[];
}

export function calculateProfessorLoadSummary(
  professorId: string,
  offerings: SchedCourseOffering[],
  rules: SchedRulesSettings
): ProfessorLoadSummary {
  const mine = offerings.filter((o) => o.professorId === professorId);
  let rawUnits = 0;
  let theoreticalUnits = 0;
  let practicalUnits = 0;
  let weeklyHours = 0;
  let equivalentUnits = 0;
  const daySet = new Set<SchedDayKey>();

  for (const off of mine) {
    const bd = calculateOfferingBreakdown(off, rules);
    rawUnits += bd.rawUnits;
    theoreticalUnits += bd.activeTheoryUnits;
    practicalUnits += bd.activePracticalUnits;
    weeklyHours += bd.weeklyHours;
    equivalentUnits += bd.equivalentUnits;
    if (off.dayOfWeek) daySet.add(off.dayOfWeek);
  }

  return {
    professorId,
    offeringCount: mine.length,
    rawUnits: round2(rawUnits),
    theoreticalUnits: round2(theoreticalUnits),
    practicalUnits: round2(practicalUnits),
    weeklyHours: round2(weeklyHours),
    equivalentUnits: round2(equivalentUnits),
    activeDays: SCHED_DAYS_ORDER.filter((d) => daySet.has(d)),
  };
}

export interface OfferingConflictReport {
  hasHardConflict: boolean;
  errors: string[];
  warnings: string[];
}

function doTargetsOverlap(a: SchedCourseOffering, b: SchedCourseOffering): string | null {
  const keysA = new Set<string>();
  keysA.add(`${a.cohortId}::${a.sectionId || 'ALL'}`);
  for (const sh of a.sharedWithTargets || []) {
    keysA.add(`${sh.cohortId}::${sh.sectionId || 'ALL'}`);
  }

  const keysB: Array<{ key: string; label: string }> = [
    {
      key: `${b.cohortId}::${b.sectionId || 'ALL'}`,
      label: `${b.ownerMajorName} (ورودی ${b.entryTerm}${b.sectionName ? ` - ${b.sectionName}` : ''})`,
    },
  ];
  for (const sh of b.sharedWithTargets || []) {
    keysB.push({
      key: `${sh.cohortId}::${sh.sectionId || 'ALL'}`,
      label: `${sh.majorName} (ورودی ${sh.entryTerm}${sh.sectionName ? ` - ${sh.sectionName}` : ''})`,
    });
  }

  for (const kb of keysB) {
    const [bCohort, bSec] = kb.key.split('::');
    for (const ka of keysA) {
      const [aCohort, aSec] = ka.split('::');
      if (aCohort === bCohort && (aSec === 'ALL' || bSec === 'ALL' || aSec === bSec)) {
        return kb.label;
      }
    }
  }
  return null;
}

export function detectOfferingConflicts(
  candidate: SchedCourseOffering,
  allOfferings: SchedCourseOffering[],
  classrooms: SchedClassroom[],
  professors: SchedProfessor[],
  rules?: SchedRulesSettings
): OfferingConflictReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  // بررسی قانون یکسان بودن کد ۷ رقمی برای رشته‌های مشترک
  if (candidate.sharedWithTargets && candidate.sharedWithTargets.length > 0) {
    const cleanCode = normalizeSchedCode(candidate.courseCode);
    if (!/^\d{7}$/.test(cleanCode)) {
      warnings.push('برای دروس مشترک بین چند رشته، کد درس باید دقیقاً ۷ رقمی معتبر باشد.');
    }
  }

  // بررسی تداخل زمانی فقط در صورتی که روز و حداقل یک سانس انتخاب شده باشد
  if (candidate.dayOfWeek && candidate.slotIds.length > 0) {
    const sameTermOthers = allOfferings.filter(
      (o) =>
        o.id !== candidate.id &&
        o.termKey === candidate.termKey &&
        o.dayOfWeek === candidate.dayOfWeek &&
        o.slotIds.some(
          (sid) =>
            candidate.slotIds.includes(sid) &&
            doSlotHalvesOverlap(
              getOfferingSlotHalf(candidate, sid),
              getOfferingSlotHalf(o, sid)
            )
        )
    );

    for (const other of sameTermOthers) {
      // ۱. تداخل کلاس فیزیکی
      if (candidate.classroomId && other.classroomId === candidate.classroomId) {
        errors.push(
          `تداخل مکان: کلاس «${candidate.classroomName || other.classroomName}» در همین روز و ساعت به درس «${other.courseTitle}» (${other.ownerMajorName}) اختصاص دارد.`
        );
      }

      // ۲. تداخل استاد
      if (candidate.professorId && other.professorId === candidate.professorId) {
        errors.push(
          `تداخل استاد: «${candidate.professorName || other.professorName}» همزمان در درس «${other.courseTitle}» (${other.ownerMajorName}) کلاس دارد.`
        );
      }

      // ۳. تداخل ورودی/شعبه دانشجویان (برای شعبه‌های کارورزی همان بخش با ظرفیت تقسیم‌شده، تداخل دانشجو محسوب نمی‌شود)
      const bothInternshipSplit =
        candidate.practicalType === 'internship' &&
        other.practicalType === 'internship' &&
        (Boolean(candidate.internshipSubGroupLabel) || Boolean(other.internshipSubGroupLabel));
      const cohortOverlap = bothInternshipSplit ? null : doTargetsOverlap(candidate, other);
      if (cohortOverlap) {
        errors.push(
          `تداخل برنامه دانشجویان (${cohortOverlap}): همزمان درس «${other.courseTitle}» برای این گروه برنامه‌ریزی شده است.`
        );
      }
    }

    // بررسی محدودیت زمان عدم حضور استاد
    if (candidate.professorId) {
      const prof = professors.find((p) => p.id === candidate.professorId);
      if (prof?.unavailableKeys && prof.unavailableKeys.length > 0) {
        const hit = candidate.slotIds.some((sid) =>
          prof.unavailableKeys!.includes(`${candidate.dayOfWeek}:${sid}`)
        );
        if (hit) {
          warnings.push(
            `استاد «${prof.fullName}» این روز/سانس را جزو زمان‌های عدم امکان حضور اعلام کرده است.`
          );
        }
      }
    }
  }

  // بررسی ظرفیت و نوع کلاس فیزیکی
  if (candidate.classroomId) {
    const room = classrooms.find((r) => r.id === candidate.classroomId);
    if (room) {
      if (candidate.enrolledCount > room.capacity) {
        warnings.push(
          `تعداد دانشجویان (${candidate.enrolledCount.toLocaleString('fa-IR')} نفر) از ظرفیت کلاس «${room.name}» (${room.capacity.toLocaleString('fa-IR')} نفر) بیشتر است.`
        );
      }
      if (
        candidate.practicalUnits > 0 &&
        candidate.practicalType === 'workshop' &&
        room.roomType !== 'workshop'
      ) {
        warnings.push(`این درس دارای واحد کارگاهی است اما کلاس «${room.name}» کارگاه نیست.`);
      }
    }
  }

  if (!candidate.professorId) {
    warnings.push('استاد این درس هنوز تعیین نشده است.');
  }
  if (!candidate.classroomId) {
    if (candidate.practicalType !== 'internship') {
      warnings.push('کلاس فیزیکی این درس هنوز تعیین نشده است.');
    } else if (candidate.internshipSessionRole === 'university_orientation') {
      warnings.push('کلاس فیزیکی برای جلسه توجیهی کارورزی در دانشگاه هنوز تعیین نشده است.');
    }
  }

  // اخطار تداخل امتحان پایان ترم در همان ردیف (رشته/ورودی/شعبه) - صرفاً هشدار (مسدودکننده نیست)
  if (candidate.examDayId && candidate.examSlotId && isCourseEligibleForExam(candidate)) {
    const examWarns = detectOfferingExamConflicts(candidate, allOfferings, rules);
    warnings.push(...examWarns);
  }

  return {
    hasHardConflict: errors.length > 0,
    errors,
    warnings,
  };
}

// =============================================================
// الگوریتم چینش هوشمند و خودکار برنامه هفتگی
// =============================================================

export interface SmartSchedulerConfig {
  termKey: string;
  coursesToSchedule: Array<{
    course: SchedCurriculumCourse;
    cohort: SchedProgramCohort;
    sectionId?: string;
    sectionName?: string;
    enrolledCount: number;
    preferredProfessorId?: string;
    preferredRoomId?: string;
  }>;
  unavailableProfSlots: Record<string, string[]>; // professorId -> ['saturday:slot_1', ...]
  compactMode: 'compact_days' | 'spread_evenly'; // فشرده‌سازی در حداقل روزهای هفته یا پخش متوازن
  timePreference: 'morning' | 'afternoon' | 'any';
  maxHoursPerCohortPerDay: number;
  strictRoomCapacity: boolean;
  strictRoomType: boolean;
}

export interface SmartSchedulerResult {
  placedOfferings: SchedCourseOffering[];
  unplacedReasons: Array<{
    courseCode: string;
    courseTitle: string;
    cohortLabel: string;
    reason: string;
  }>;
  stats: {
    requestedCount: number;
    placedCount: number;
    unplacedCount: number;
  };
}

export function runSmartAutoScheduler(
  config: SmartSchedulerConfig,
  existingOfferings: SchedCourseOffering[],
  classrooms: SchedClassroom[],
  professors: SchedProfessor[],
  rules: SchedRulesSettings,
  actor: { id: string; name: string; role: SchedWorkspaceRole }
): SmartSchedulerResult {
  const activeRooms = classrooms.filter((r) => r.isActive);
  const activeDays: SchedDayKey[] =
    rules.activeDays.length > 0
      ? rules.activeDays
      : ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday'];
  const sortedSlots = [...rules.timeSlots].sort((a, b) => a.order - b.order);

  // مرتب‌سازی سانس‌ها بر اساس ترجیح صبح/عصر
  const orderedSlots: SchedTimeSlot[] = [...sortedSlots].sort((a, b) => {
    if (config.timePreference === 'morning') return a.order - b.order;
    if (config.timePreference === 'afternoon') return b.order - a.order;
    return a.order - b.order;
  });

  // مرتب‌سازی دروس: ابتدا دروس پر ساعت یا عملی/کارگاهی تا راحت‌تر جای بگیرند
  const queue = [...config.coursesToSchedule].sort((a, b) => {
    const ha = calculateOfferingBreakdown(a.course, rules).weeklyHours;
    const hb = calculateOfferingBreakdown(b.course, rules).weeklyHours;
    return hb - ha;
  });

  const workingOfferings = [...existingOfferings];
  const placedOfferings: SchedCourseOffering[] = [];
  const unplacedReasons: SmartSchedulerResult['unplacedReasons'] = [];

  for (const item of queue) {
    const bd = calculateOfferingBreakdown(
      { ...item.course, enrolledCount: item.enrolledCount },
      rules
    );
    // تخمین تعداد سانس مورد نیاز (هر سانس حدود ۲ ساعت در نظر گرفته می‌شود؛ اگر ۱ یا ۲ ساعت -> ۱ سانس، ۳ یا ۴ ساعت -> ۲ سانس، ۵+ -> ۳ سانس)
    const slotsNeeded = Math.max(
      1,
      Math.min(orderedSlots.length, Math.ceil(bd.weeklyHours / 2))
    );

    const prof = item.preferredProfessorId
      ? professors.find((p) => p.id === item.preferredProfessorId)
      : undefined;

    // پیدا کردن روزهایی که این ورودی/شعبه قبلاً کلاس داشته (برای حالت فشرده‌سازی)
    const cohortDaysUsage = new Map<SchedDayKey, number>();
    for (const d of activeDays) cohortDaysUsage.set(d, 0);
    for (const off of workingOfferings) {
      if (
        off.termKey === config.termKey &&
        off.cohortId === item.cohort.id &&
        (!item.sectionId || !off.sectionId || off.sectionId === item.sectionId) &&
        off.dayOfWeek
      ) {
        cohortDaysUsage.set(
          off.dayOfWeek,
          (cohortDaysUsage.get(off.dayOfWeek) || 0) + off.weeklyHours
        );
      }
    }

    const candidateDays = [...activeDays].sort((d1, d2) => {
      const h1 = cohortDaysUsage.get(d1) || 0;
      const h2 = cohortDaysUsage.get(d2) || 0;
      if (config.compactMode === 'compact_days') {
        // روزهایی که کلاس دارند (ولی هنوز جا دارند) اولویت دارند تا روزهای کمتری دانشجو به دانشگاه بیاید
        const has1 = h1 > 0 && h1 + bd.weeklyHours <= config.maxHoursPerCohortPerDay ? 1 : 0;
        const has2 = h2 > 0 && h2 + bd.weeklyHours <= config.maxHoursPerCohortPerDay ? 1 : 0;
        if (has1 !== has2) return has2 - has1;
        return h1 - h2;
      }
      // در حالت متعادل: کم‌تراکم‌ترین روز اولویت دارد
      return h1 - h2;
    });

    // فیلتر کلاس‌های کاندید
    let roomCandidates = item.preferredRoomId
      ? activeRooms.filter((r) => r.id === item.preferredRoomId)
      : [...activeRooms];

    if (config.strictRoomCapacity) {
      roomCandidates = roomCandidates.filter((r) => r.capacity >= item.enrolledCount);
    }
    if (config.strictRoomType && item.course.practicalUnits > 0) {
      if (item.course.practicalType === 'workshop') {
        const ws = roomCandidates.filter((r) => r.roomType === 'workshop');
        if (ws.length > 0) roomCandidates = ws;
      } else if (item.course.practicalType === 'normal_lab') {
        const labs = roomCandidates.filter((r) => r.roomType === 'lab' || r.roomType === 'computer_av');
        if (labs.length > 0) roomCandidates = labs;
      }
    }
    roomCandidates.sort((a, b) => a.capacity - b.capacity);

    let placed = false;

    for (const day of candidateDays) {
      const currentDayHours = cohortDaysUsage.get(day) || 0;
      if (currentDayHours + bd.weeklyHours > config.maxHoursPerCohortPerDay && currentDayHours > 0) {
        continue;
      }

      // انتخاب بلوک متوالی سانس به طول slotsNeeded
      for (let idx = 0; idx <= sortedSlots.length - slotsNeeded; idx++) {
        // ترتیب بر اساس timePreference
        const slotBlock =
          config.timePreference === 'afternoon'
            ? sortedSlots.slice(
                sortedSlots.length - slotsNeeded - idx,
                sortedSlots.length - idx
              )
            : sortedSlots.slice(idx, idx + slotsNeeded);
        if (slotBlock.length < slotsNeeded) continue;
        const slotIds = slotBlock.map((s) => s.id);

        // بررسی عدم امکان استاد در این روز/سانس
        if (prof) {
          const unavail = new Set([
            ...(prof.unavailableKeys || []),
            ...(config.unavailableProfSlots[prof.id] || []),
          ]);
          if (slotIds.some((sid) => unavail.has(`${day}:${sid}`))) {
            continue;
          }
        }

        // اگر کارورزی بدون نیاز به کلاس فیزیکی است یا اتاق پیدا نشد
        const roomsToTry: Array<SchedClassroom | null> =
          item.course.practicalType === 'internship' && roomCandidates.length === 0
            ? [null]
            : roomCandidates;

        for (const room of roomsToTry) {
          const candidate: SchedCourseOffering = {
            id: `off_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            termKey: config.termKey,
            courseId: item.course.id,
            courseCode: item.course.courseCode,
            courseTitle: item.course.title,
            courseType: item.course.courseType,
            practicalType: item.course.practicalType,
            theoreticalUnits: item.course.theoreticalUnits,
            practicalUnits: item.course.practicalUnits,
            weeklyHours: bd.weeklyHours,
            ownerMajorCode: item.cohort.majorCode,
            ownerMajorName: item.cohort.majorName,
            cohortId: item.cohort.id,
            entryTerm: item.cohort.entryTerm,
            sectionId: item.sectionId,
            sectionName: item.sectionName,
            enrolledCount: item.enrolledCount,
            professorId: prof?.id,
            professorCode: prof?.professorCode,
            professorName: prof?.fullName,
            classroomId: room?.id,
            classroomName: room?.name,
            dayOfWeek: day,
            slotIds,
            splitPart: 'full',
            createdById: actor.id,
            createdByName: actor.name,
            createdByRole: actor.role,
            updatedAt: new Date().toISOString(),
          };

          const conflict = detectOfferingConflicts(
            candidate,
            workingOfferings,
            classrooms,
            professors
          );
          if (!conflict.hasHardConflict) {
            workingOfferings.push(candidate);
            placedOfferings.push(candidate);
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
      if (placed) break;
    }

    if (!placed) {
      unplacedReasons.push({
        courseCode: item.course.courseCode,
        courseTitle: item.course.title,
        cohortLabel: `${item.cohort.majorName} (${item.cohort.entryTerm}${item.sectionName ? ` - ${item.sectionName}` : ''})`,
        reason:
          roomCandidates.length === 0
            ? 'کلاس فیزیکی با ظرفیت/نوع مناسب یافت نشد.'
            : 'تداخل زمانی استاد، کلاس یا سقف ساعت روزانه مانع جانمایی شد.',
      });
    }
  }

  return {
    placedOfferings,
    unplacedReasons,
    stats: {
      requestedCount: queue.length,
      placedCount: placedOfferings.length,
      unplacedCount: unplacedReasons.length,
    },
  };
}

// =============================================================
// ابزارهای ورود و خروجی اکسل برنامه‌ریزی درسی
// =============================================================

export type SchedExcelKind = 'classrooms' | 'programs' | 'professors' | 'courses';

export async function downloadSchedExcelTemplate(kind: SchedExcelKind): Promise<void> {
  const XLSX = await import('xlsx');
  let rows: Record<string, unknown>[] = [];
  let sheetName = 'Template';
  let fileName = 'template.xlsx';

  if (kind === 'classrooms') {
    sheetName = 'کلاس‌های فیزیکی';
    fileName = 'نمونه_اکسل_کلاسهای_فیزیکی.xlsx';
    rows = [
      {
        'کد کلاس': '101',
        'نام کلاس': 'کلاس ۱۰۱ ساختمان شهید رجایی',
        'ساختمان / طبقه': 'ساختمان اصلی - طبقه اول',
        'ظرفیت': 35,
        'نوع کلاس': 'عادی',
        'توضیحات': 'دارای ویدئو پروژکتور',
      },
      {
        'کد کلاس': 'LAB-1',
        'نام کلاس': 'آزمایشگاه علوم پایه ۱',
        'ساختمان / طبقه': 'ساختمان علوم - همکف',
        'ظرفیت': 20,
        'نوع کلاس': 'آزمایشگاه',
        'توضیحات': '',
      },
    ];
  } else if (kind === 'programs') {
    sheetName = 'رشته‌ها و ورودی‌ها';
    fileName = 'نمونه_اکسل_رشته_ورودی_شعبه.xlsx';
    rows = [
      {
        'کد رشته ۶ رقمی': '112233',
        'نام رشته': 'آموزش ابتدایی',
        'ورودی': '4031',
        'تعداد نفرات کل ورودی': 64,
        'نام شعبه / گروه': 'شعبه ۱',
        'تعداد نفرات شعبه': 32,
        'توضیحات': '',
      },
      {
        'کد رشته ۶ رقمی': '112233',
        'نام رشته': 'آموزش ابتدایی',
        'ورودی': '4031',
        'تعداد نفرات کل ورودی': 64,
        'نام شعبه / گروه': 'شعبه ۲',
        'تعداد نفرات شعبه': 32,
        'توضیحات': '',
      },
    ];
  } else if (kind === 'professors') {
    sheetName = 'اساتید';
    fileName = 'نمونه_اکسل_اساتید_گلستان45.xlsx';
    rows = [
      {
        'شماره شناسایی': '10045',
        'نام استاد': 'علی',
        'نام خانوادگی استاد': 'محمدی',
        'جنس': 'مرد',
        'نام پدر': 'حسین',
        'شماره ملی': '1280123456',
        'نام فارسی گروه آموزشی': 'آموزش ابتدایی',
        'نام واحد/مرکز': 'پردیس شهید باهنر اصفهان',
        'تلفن همراه': '09131112233',
        'تلفن': '03134445566',
        'آخرین مدرک تحصیلی': 'دکتری تخصصی',
        'رشته تحصیلی': 'برنامه‌ریزی درسی',
        'گرایش تحصیلی': 'آموزش ابتدایی',
        'پایه': '12',
        'مرتبه علمی': 'استادیار',
        'وضعیت استخدام': 'هیات علمی رسمی قطعی',
        'بانک': 'ملی',
        'شماره حساب': '6037991122334455',
      },
      {
        'شماره شناسایی': '10046',
        'نام استاد': 'مهدی',
        'نام خانوادگی استاد': 'رضایی',
        'جنس': 'مرد',
        'نام پدر': 'اکبر',
        'شماره ملی': '1280654321',
        'نام فارسی گروه آموزشی': 'آموزش ریاضی',
        'نام واحد/مرکز': 'پردیس شهید باهنر اصفهان',
        'تلفن همراه': '09132223344',
        'تلفن': '',
        'آخرین مدرک تحصیلی': 'کارشناسی ارشد',
        'رشته تحصیلی': 'آموزش ریاضی',
        'گرایش تحصیلی': '',
        'پایه': '',
        'مرتبه علمی': 'مدرس مدعو',
        'وضعیت استخدام': 'مامور آموزشی',
        'بانک': 'سپه',
        'شماره حساب': '',
      },
    ];
  } else {
    sheetName = 'لیست دروس رشته‌ها';
    fileName = 'نمونه_اکسل_لیست_دروس.xlsx';
    rows = [
      {
        'کد درس ۷ رقمی': '1102001',
        'نام درس': 'اصول و فلسفه تعلیم و تربیت',
        'کد رشته ۶ رقمی': '112233',
        'نام رشته': 'آموزش ابتدایی',
        'نوع درس': 'نظری',
        'واحد نظری': 2,
        'واحد عملی': 0,
        'نوع واحد عملی': 'عادی/آزمایشگاهی',
        'ترم پیشنهادی': '1',
      },
      {
        'کد درس ۷ رقمی': '1102015',
        'نام درس': 'کارورزی ۱ (مشاهده و توصیف)',
        'کد رشته ۶ رقمی': '112233',
        'نام رشته': 'آموزش ابتدایی',
        'نوع درس': 'عملی',
        'واحد نظری': 0,
        'واحد عملی': 2,
        'نوع واحد عملی': 'کارورزی',
        'ترم پیشنهادی': '3',
      },
    ];
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}

export function formatProfessorDegreeFull(
  level?: string,
  field?: string,
  specialization?: string
): string {
  const l = (level || '').trim();
  const f = (field || '').trim();
  const s = (specialization || '').trim();
  const main = [l, f].filter(Boolean).join(' · ');
  if (main && s) return `${main} (گرایش ${s})`;
  if (main) return main;
  if (s) return `گرایش ${s}`;
  return '';
}

function normalizeHeaderKey(raw: string): string {
  return normalizePersianText(raw)
    .replace(/[\u200c\u200d\u200e\u200f\u064b-\u065f\u0670\u0654]/g, '')
    .replace(/[\/\\\-_()（）\[\]،,:؛.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function getRowCol(
  row: Record<string, unknown>,
  candidates: string[],
  options?: { exactOnly?: boolean; exclude?: string[] }
): string {
  const entries = Object.entries(row).map(([k, v]) => ({
    rawKey: k,
    normKey: normalizeHeaderKey(k),
    value: String(v ?? '').trim(),
  }));
  const cleanExcludes = (options?.exclude || []).map((ex) => normalizeHeaderKey(ex)).filter(Boolean);
  const isExcluded = (normKey: string) =>
    cleanExcludes.some((ex) => ex && normKey.includes(ex));

  // گذر اول: تطبیق دقیق روی همه کاندیداها
  for (const cand of candidates) {
    const cleanCand = normalizeHeaderKey(cand);
    if (!cleanCand) continue;
    for (const ent of entries) {
      if (!ent.normKey || isExcluded(ent.normKey)) continue;
      if (ent.normKey === cleanCand) {
        return ent.value;
      }
    }
  }
  if (options?.exactOnly) return '';

  // گذر دوم: تطبیق جزئی روی کلیدهای غیرمبهم
  for (const cand of candidates) {
    const cleanCand = normalizeHeaderKey(cand);
    if (!cleanCand) continue;
    for (const ent of entries) {
      if (!ent.normKey || isExcluded(ent.normKey)) continue;
      if (ent.normKey.includes(cleanCand)) {
        return ent.value;
      }
    }
  }
  return '';
}

function extractRowsWithSmartHeader(
  XLSX: typeof import('xlsx'),
  sheet: import('xlsx').WorkSheet,
  kind: SchedExcelKind
): Record<string, unknown>[] {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
  });
  if (!matrix || matrix.length === 0) return [];

  const markerMap: Record<SchedExcelKind, string[]> = {
    professors: [
      'شماره شناسایی',
      'کد استاد',
      'نام خانوادگی استاد',
      'نام خانوادگی',
      'نام استاد',
      'شماره ملی',
      'کد ملی',
      'نام فارسی گروه آموزشی',
      'گروه آموزشی',
      'نام واحد مرکز',
      'تلفن همراه',
      'آخرین مدرک تحصیلی',
      'رشته تحصیلی',
      'گرایش تحصیلی',
      'مرتبه علمی',
      'وضعیت استخدام',
      'شماره حساب',
    ],
    classrooms: ['کد کلاس', 'نام کلاس', 'ظرفیت', 'ساختمان'],
    programs: ['کد رشته', 'نام رشته', 'ورودی', 'شعبه'],
    courses: ['کد درس', 'نام درس', 'واحد نظری', 'واحد عملی'],
  };

  const markers = markerMap[kind].map((m) => normalizeHeaderKey(m));
  let bestRowIdx = 0;
  let bestScore = -1;
  const maxScan = Math.min(matrix.length, 30);

  for (let r = 0; r < maxScan; r++) {
    const row = matrix[r];
    if (!Array.isArray(row)) continue;
    let score = 0;
    for (const cell of row) {
      const normCell = normalizeHeaderKey(String(cell ?? ''));
      if (!normCell) continue;
      if (markers.some((m) => normCell === m || normCell.includes(m))) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestRowIdx = r;
    }
  }

  // اگر ردیف سرستون استاندارد یا گزارش ۴۵ شناسایی شد، از همان ردیف سرستون‌ها را می‌سازیم
  const headerRowIdx = bestScore >= 2 ? bestRowIdx : 0;
  const headerCells = (matrix[headerRowIdx] || []).map((h, colIdx) => {
    const txt = String(h ?? '').replace(/\s+/g, ' ').trim();
    return txt || `__EMPTY_${colIdx}`;
  });

  const outRows: Record<string, unknown>[] = [];
  for (let r = headerRowIdx + 1; r < matrix.length; r++) {
    const cells = matrix[r];
    if (!Array.isArray(cells)) continue;
    const obj: Record<string, unknown> = {};
    let hasAnyValue = false;
    headerCells.forEach((headerName, colIdx) => {
      const val = cells[colIdx] !== undefined && cells[colIdx] !== null ? String(cells[colIdx]).trim() : '';
      if (val) hasAnyValue = true;
      if (!(headerName in obj) || (!obj[headerName] && val)) {
        obj[headerName] = val;
      }
    });
    if (hasAnyValue) {
      outRows.push(obj);
    }
  }
  return outRows;
}

export function mapRoomTypeInput(raw: string): SchedClassroomType {
  const norm = normalizePersianText(raw).toLowerCase();
  if (norm.includes('آزمایشگاه') || norm === 'lab') return 'lab';
  if (norm.includes('کارگاه') || norm === 'workshop') return 'workshop';
  if (norm.includes('سایت') || norm.includes('کامپیوتر') || norm.includes('سمعی')) return 'computer_av';
  return 'ordinary';
}

export function mapEmploymentTypeInput(raw: string, academicRank?: string): SchedEmploymentType {
  const norm = normalizeHeaderKey(raw);
  const rankNorm = normalizeHeaderKey(academicRank || '');
  if (norm.includes('آموزش و پرورش') || norm.includes('ا پ') || norm.includes('فرهنگی شاغل')) {
    return 'haghol_tadris_ap';
  }
  if (norm.includes('بازنشسته')) return 'retired';
  if (norm.includes('مامور')) return 'mamoor_amoozeshi';
  if (norm.includes('کارمند') || norm.includes('اداری')) return 'staff';
  if (norm.includes('حق التدریس') || norm.includes('آزاد') || norm.includes('مدعو')) {
    return 'haghol_tadris_free';
  }
  if (
    norm.includes('هیات علمی') ||
    norm.includes('هیئت علمی') ||
    norm.includes('رسمی قطعی') ||
    norm.includes('رسمی ازمایشی') ||
    norm.includes('رسمی آزمایشی') ||
    norm.includes('پیمانی')
  ) {
    return 'faculty_member';
  }
  if (
    norm.includes('رسمی') &&
    (rankNorm.includes('استاد') || rankNorm.includes('دانشیار') || rankNorm.includes('مربی'))
  ) {
    return 'faculty_member';
  }
  if (
    !norm &&
    (rankNorm.includes('استادیار') || rankNorm.includes('دانشیار') || rankNorm.includes('استاد تمام'))
  ) {
    return 'faculty_member';
  }
  return 'haghol_tadris_free';
}

export function mapPracticalTypeInput(raw: string): SchedPracticalUnitType {
  const norm = normalizePersianText(raw).toLowerCase();
  if (norm.includes('کارگاه') || norm === 'workshop') return 'workshop';
  if (norm.includes('کارورزی') || norm.includes('internship')) return 'internship';
  return 'normal_lab';
}

export function mapCourseTypeInput(raw: string, th: number, pr: number): SchedCourseType {
  const norm = normalizePersianText(raw).toLowerCase();
  if (norm.includes('نظری') && norm.includes('عملی')) return 'theoretical_practical';
  if (norm.includes('عملی')) return 'practical';
  if (norm.includes('نظری')) return 'theoretical';
  if (th > 0 && pr > 0) return 'theoretical_practical';
  if (pr > 0) return 'practical';
  return 'theoretical';
}

export async function parseSchedExcelFile(
  file: File,
  kind: SchedExcelKind
): Promise<{
  classrooms?: SchedClassroom[];
  programs?: SchedProgramCohort[];
  professors?: SchedProfessor[];
  courses?: SchedCurriculumCourse[];
  skippedRows: number;
  errors: string[];
}> {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const firstSheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows = extractRowsWithSmartHeader(XLSX, firstSheet, kind);

  let skippedRows = 0;
  const errors: string[] = [];

  if (kind === 'classrooms') {
    const classrooms: SchedClassroom[] = [];
    rawRows.forEach((row, idx) => {
      const code = normalizeSchedCode(getRowCol(row, ['کد کلاس', 'کد', 'code']));
      const name = getRowCol(row, ['نام کلاس', 'عنوان کلاس', 'name', 'نام']);
      if (!code && !name) {
        skippedRows++;
        return;
      }
      const capRaw = Number(normalizeSchedCode(getRowCol(row, ['ظرفیت', 'capacity']))) || 30;
      const roomType = mapRoomTypeInput(getRowCol(row, ['نوع کلاس', 'نوع', 'type']));
      classrooms.push({
        id: `room_${Date.now()}_${idx}`,
        code: code || `R-${idx + 1}`,
        name: name || `کلاس ${code}`,
        building: getRowCol(row, ['ساختمان', 'طبقه', 'ساختمان / طبقه', 'building']),
        capacity: Math.max(1, capRaw),
        roomType,
        isActive: true,
        notes: getRowCol(row, ['توضیحات', 'notes']),
      });
    });
    return { classrooms, skippedRows, errors };
  }

  if (kind === 'programs') {
    const cohortMap = new Map<string, SchedProgramCohort>();
    rawRows.forEach((row, idx) => {
      const majorCode = normalizeSchedCode(
        getRowCol(row, ['کد رشته', 'کد رشته ۶ رقمی', 'کد رشته 6 رقمی', 'majorcode'])
      );
      const majorName = getRowCol(row, ['نام رشته', 'رشته', 'majorname']);
      const entryTerm = normalizeSchedCode(getRowCol(row, ['ورودی', 'سال ورودی', 'entry']));
      if (!majorName || !entryTerm) {
        skippedRows++;
        errors.push(`ردیف ${idx + 2}: نام رشته یا ورودی خالی است.`);
        return;
      }
      const totalRaw = Number(
        normalizeSchedCode(getRowCol(row, ['تعداد نفرات کل', 'تعداد کل', 'کل دانشجویان']))
      );
      const secName = getRowCol(row, ['نام شعبه', 'شعبه', 'گروه', 'نام شعبه / گروه']);
      const secCount = Number(
        normalizeSchedCode(getRowCol(row, ['تعداد نفرات شعبه', 'تعداد شعبه', 'نفرات گروه']))
      );
      const key = `${majorCode || majorName}__${entryTerm}`;
      let cohort = cohortMap.get(key);
      if (!cohort) {
        cohort = {
          id: `prog_${Date.now()}_${idx}`,
          majorCode: majorCode || '000000',
          majorName,
          entryTerm,
          totalStudents: Number.isFinite(totalRaw) && totalRaw > 0 ? totalRaw : 0,
          sections: [],
          notes: getRowCol(row, ['توضیحات', 'notes']),
        };
        cohortMap.set(key, cohort);
      }
      if (secName) {
        cohort.sections.push({
          id: `sec_${Date.now()}_${idx}`,
          name: secName,
          studentCount: Number.isFinite(secCount) && secCount > 0 ? secCount : Math.max(1, cohort.totalStudents || 25),
        });
      }
    });
    const programs = Array.from(cohortMap.values()).map((c) => {
      if (c.sections.length === 0) {
        c.sections = [
          {
            id: `sec_${c.id}_1`,
            name: 'گروه ۱',
            studentCount: Math.max(1, c.totalStudents || 30),
          },
        ];
      }
      if (!c.totalStudents || c.totalStudents <= 0) {
        c.totalStudents = c.sections.reduce((acc, s) => acc + s.studentCount, 0);
      }
      return c;
    });
    return { programs, skippedRows, errors };
  }

  if (kind === 'professors') {
    const professors: SchedProfessor[] = [];
    rawRows.forEach((row, idx) => {
      const professorCode = normalizeSchedCode(
        getRowCol(row, ['شماره شناسایی', 'کد استاد', 'کد استادی', 'کد پرسنلی', 'code'])
      );
      const firstName = getRowCol(row, ['نام استاد', 'نام'], {
        exclude: ['خانوادگی', 'پدر', 'گروه', 'واحد', 'مرکز', 'بانک', 'مدرک', 'رشته'],
      });
      const lastName = getRowCol(row, ['نام خانوادگی استاد', 'نام خانوادگی', 'فامیلی']);
      const combinedName = getRowCol(row, ['نام و نام خانوادگی', 'fullname']);
      const fullName =
        firstName && lastName
          ? `${firstName} ${lastName}`.replace(/\s+/g, ' ').trim()
          : combinedName || [firstName, lastName].filter(Boolean).join(' ').trim();

      // نادیده گرفتن ردیف‌های جمع کل یا پاورقی گزارش گلستان
      const joinedRowText = `${professorCode} ${fullName}`.trim();
      if (
        !joinedRowText ||
        joinedRowText.includes('جمع کل') ||
        joinedRowText.includes('تعداد کل')
      ) {
        skippedRows++;
        return;
      }

      const nationalId = normalizeSchedCode(
        getRowCol(row, ['شماره ملی', 'کد ملی', 'کدملی', 'nationalid'])
      );
      if (!professorCode || !fullName) {
        skippedRows++;
        errors.push(`ردیف ${idx + 2}: شماره شناسایی (کد استاد) یا نام استاد خالی است.`);
        return;
      }

      const gender = getRowCol(row, ['جنس', 'جنسیت']);
      const fatherName = getRowCol(row, ['نام پدر', 'پدر']);
      const departmentName = getRowCol(row, [
        'نام فارسی گروه آموزشی',
        'گروه آموزشی',
        'نام گروه آموزشی',
      ]);
      const unitCenterName = getRowCol(row, [
        'نام واحد/مرکز',
        'نام واحد / مرکز',
        'نام واحد مرکز',
        'واحد/مرکز',
        'واحد مرکز',
        'نام واحد',
      ]);
      const mobile = normalizeSchedCode(
        getRowCol(row, ['تلفن همراه', 'شماره همراه', 'موبایل', 'همراه', 'mobile'])
      );
      const landlinePhone = normalizeSchedCode(
        getRowCol(row, ['تلفن', 'تلفن ثابت', 'تلفن منزل', 'phone'], {
          exclude: ['همراه', 'موبایل'],
        })
      );
      const phone = mobile || landlinePhone;

      const degreeLevel = getRowCol(row, [
        'آخرین مدرک تحصیلی',
        'مقطع تحصیلی',
        'مقطع',
        'مدرک تحصیلی',
        'مدرک',
        'degree',
      ]);
      const degreeField = getRowCol(
        row,
        ['رشته تحصیلی', 'رشته مدرک', 'رشته'],
        { exclude: ['گروه', 'کد رشته'] }
      );
      const degreeSpecialization = getRowCol(row, ['گرایش تحصیلی', 'گرایش']);
      const degreeFull =
        formatProfessorDegreeFull(degreeLevel, degreeField, degreeSpecialization) || degreeLevel;

      const academicStep =
        normalizeSchedCode(getRowCol(row, ['پایه', 'پایه علمی', 'پایه استحقاقی'])) ||
        getRowCol(row, ['پایه']);
      const academicRank = getRowCol(row, ['مرتبه علمی', 'مرتبه']);
      const employmentStatusRaw = getRowCol(row, [
        'وضعیت استخدام',
        'نوع استخدام',
        'وضعیت استخدامی',
        'employment',
      ]);
      const employmentType = mapEmploymentTypeInput(employmentStatusRaw, academicRank);

      const bankName = getRowCol(row, ['بانک', 'نام بانک'], {
        exclude: ['شماره حساب', 'حساب', 'شبا'],
      });
      const bankAccount = normalizeSchedCode(
        getRowCol(row, ['شماره حساب', 'شماره حساب بانکی', 'شبا', 'حساب', 'bank'])
      );

      professors.push({
        id: `prof_${Date.now()}_${idx}`,
        professorCode,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        fullName,
        gender: gender || undefined,
        fatherName: fatherName || undefined,
        nationalId: nationalId || professorCode,
        departmentName: departmentName || undefined,
        unitCenterName: unitCenterName || undefined,
        degreeLevel: degreeLevel || undefined,
        degreeField: degreeField || undefined,
        degreeSpecialization: degreeSpecialization || undefined,
        degreeFull,
        academicStep: academicStep || undefined,
        academicRank: academicRank || undefined,
        employmentType,
        employmentStatusRaw: employmentStatusRaw || undefined,
        phone: phone || undefined,
        mobile: mobile || undefined,
        landlinePhone: landlinePhone || undefined,
        bankName: bankName || undefined,
        bankAccount: bankAccount || undefined,
        isActive: true,
        unavailableKeys: [],
        notes: getRowCol(row, ['توضیحات', 'notes']) || undefined,
      });
    });
    return { professors, skippedRows, errors };
  }

  // courses
  const courses: SchedCurriculumCourse[] = [];
  rawRows.forEach((row, idx) => {
    const courseCode = normalizeSchedCode(
      getRowCol(row, ['کد درس', 'کد درس ۷ رقمی', 'کد درس 7 رقمی', 'coursecode'])
    );
    const title = getRowCol(row, ['نام درس', 'عنوان درس', 'title', 'نام']);
    const majorCode = normalizeSchedCode(
      getRowCol(row, ['کد رشته', 'کد رشته ۶ رقمی', 'کد رشته 6 رقمی', 'majorcode'])
    );
    const majorName = getRowCol(row, ['نام رشته', 'رشته', 'majorname']);
    if (!courseCode || !title) {
      skippedRows++;
      errors.push(`ردیف ${idx + 2}: کد درس یا نام درس خالی است.`);
      return;
    }
    const theoreticalUnits = parseDecimalUnits(
      getRowCol(row, ['واحد نظری', 'تعداد واحد نظری', 'نظری'])
    );
    const practicalUnits = parseDecimalUnits(
      getRowCol(row, ['واحد عملی', 'تعداد واحد عملی', 'عملی'])
    );
    const practicalType = mapPracticalTypeInput(
      getRowCol(row, ['نوع واحد عملی', 'نوع عملی', 'practicaltype'])
    );
    const courseType = mapCourseTypeInput(
      getRowCol(row, ['نوع درس', 'coursetype']),
      theoreticalUnits,
      practicalUnits
    );
    courses.push({
      id: `crs_${Date.now()}_${idx}`,
      courseCode,
      title,
      majorCode: majorCode || '000000',
      majorName: majorName || 'مشترک / عمومی',
      courseType,
      theoreticalUnits,
      practicalUnits,
      practicalType,
      recommendedTerm: normalizeSchedCode(getRowCol(row, ['ترم پیشنهادی', 'ترم', 'term'])),
      notes: getRowCol(row, ['توضیحات', 'notes']),
    });
  });
  return { courses, skippedRows, errors };
}

export async function exportJsonRowsToExcel(
  rows: Record<string, unknown>[],
  sheetName: string,
  fileName: string
): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, fileName);
}

/**
 * چاپ امن گزارش‌ها در محیط iFrame بدون استفاده از window.open یا window.alert
 */
export function printSchedHtml(title: string, bodyHtml: string, landscape = true): void {
  if (typeof document === 'undefined') return;
  const safeTitle = String(title || 'گزارش برنامه درسی').replace(/[<>]/g, '');
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc || !iframe.contentWindow) {
    document.body.removeChild(iframe);
    return;
  }

  const fullHtml = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<style>
  @page { size: A4 ${landscape ? 'landscape' : 'portrait'}; margin: 10mm; }
  * { box-sizing: border-box; }
  body {
    font-family: Vazirmatn, Tahoma, 'Segoe UI', sans-serif;
    direction: rtl;
    color: #0f172a;
    background: #fff;
    margin: 0;
    padding: 0;
    font-size: 11px;
    line-height: 1.5;
  }
  .print-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  .print-header h1 { margin: 0; font-size: 15px; font-weight: 800; }
  .print-meta { font-size: 10px; color: #475569; text-align: left; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14px;
    page-break-inside: auto;
  }
  tr { page-break-inside: avoid; }
  th, td {
    border: 1px solid #cbd5e1;
    padding: 5px 6px;
    vertical-align: top;
    text-align: right;
  }
  th {
    background: #f1f5f9;
    font-weight: 700;
    text-align: center;
  }
  .cell-item {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 3px 5px;
    margin-bottom: 4px;
    font-size: 10px;
  }
  .cell-item:last-child { margin-bottom: 0; }
  .muted { color: #64748b; font-size: 9.5px; }
  .mono { font-family: ui-monospace, monospace; direction: ltr; display: inline-block; }
  .page-break { page-break-after: always; }
</style>
</head>
<body>
  <div class="print-header">
    <div>
      <h1>${safeTitle}</h1>
      <div class="muted">دانشگاه فرهنگیان استان اصفهان • سامانه جامع برنامه‌ریزی درسی</div>
    </div>
    <div class="print-meta">
      تاریخ چاپ: ${new Date().toLocaleDateString('fa-IR')}
    </div>
  </div>
  ${bodyHtml}
</body>
</html>`;

  doc.open();
  doc.write(fullHtml);
  doc.close();

  const cleanup = () => {
    window.setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 800);
  };

  window.setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      cleanup();
    }
  }, 250);
}

// =========================================================================
// تطبیق پروفایل دانشجو (رشته و ورودی) با برنامه درسی برای کنترل دسترسی دانشجو
// =========================================================================
function stripMajorPrefixes(raw: string): string {
  return normalizePersianText(raw)
    .toLowerCase()
    .replace(/کارشناسی\s*(پیوسته|ناپیوسته|ارشد)?|کاردانی|رشته\s*تحصیلی|رشته/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function doesStudentMatchMajor(
  studentFieldOfStudy: string | undefined | null,
  majorName: string | undefined | null,
  majorCode?: string | null
): boolean {
  const sNorm = normalizePersianText(studentFieldOfStudy).toLowerCase();
  const mNorm = normalizePersianText(majorName).toLowerCase();
  if (!sNorm || !mNorm) return false;

  const sCode = normalizeSchedCode(studentFieldOfStudy);
  const mCode = normalizeSchedCode(majorCode);
  if (mCode && sCode && sCode === mCode) return true;

  if (sNorm === mNorm) return true;
  const sClean = stripMajorPrefixes(sNorm);
  const mClean = stripMajorPrefixes(mNorm);
  if (!sClean || !mClean) return false;
  if (sClean === mClean) return true;

  if (sClean.length >= 4 && mClean.length >= 4) {
    if (sClean.includes(mClean) || mClean.includes(sClean)) return true;
  }
  return false;
}

export function parseEntryTermComponents(raw: string | number | undefined | null): {
  yearShort: string;
  semester: string;
} {
  const digits = toEnglishDigits(String(raw ?? '')).replace(/[^\d]/g, '');
  if (!digits) return { yearShort: '', semester: '' };

  // مثلاً 14021 یا 1402-1 یا 1402
  if (digits.startsWith('14') || digits.startsWith('13')) {
    const y4 = digits.slice(0, 4);
    const yearShort = y4.slice(1); // 1402 -> 402
    const semester = digits.length >= 5 ? digits[4] : '';
    return { yearShort, semester };
  }
  // مثلاً 4021 یا 402 یا 3991
  if (digits.length >= 3) {
    const yearShort = digits.slice(0, 3);
    const semester = digits.length >= 4 ? digits[3] : '';
    return { yearShort, semester };
  }
  return { yearShort: digits, semester: '' };
}

export function doesStudentMatchEntryTerm(
  studentEntryTerm: string | number | undefined | null,
  targetEntryTerm: string | number | undefined | null
): boolean {
  const a = parseEntryTermComponents(studentEntryTerm);
  const b = parseEntryTermComponents(targetEntryTerm);
  if (!a.yearShort || !b.yearShort) return false;
  if (a.yearShort !== b.yearShort) return false;
  // اگر هر دو طرف نیمسال دقیق (مهر/بهمن) دارند، باید یکسان باشد؛ در غیر این صورت تطبیق سال کافی است
  if (a.semester && b.semester && a.semester !== b.semester) return false;
  return true;
}

export function doesProgramMatchStudentScope(
  program: SchedProgramCohort,
  studentFieldOfStudy: string | undefined | null,
  studentEntryTerm: string | number | undefined | null,
  scope: StudentScheduleAccessScope
): boolean {
  if (scope === 'all_programs') return true;
  const majorOk = doesStudentMatchMajor(
    studentFieldOfStudy,
    program.majorName,
    program.majorCode
  );
  if (!majorOk) return false;
  if (scope === 'own_major') return true;
  return doesStudentMatchEntryTerm(studentEntryTerm, program.entryTerm);
}

export function doesOfferingMatchStudentScope(
  offering: SchedCourseOffering,
  studentFieldOfStudy: string | undefined | null,
  studentEntryTerm: string | number | undefined | null,
  scope: StudentScheduleAccessScope
): boolean {
  if (scope === 'all_programs') return true;
  const hostMajorOk = doesStudentMatchMajor(
    studentFieldOfStudy,
    offering.ownerMajorName,
    offering.ownerMajorCode
  );
  if (hostMajorOk) {
    if (scope === 'own_major') return true;
    if (doesStudentMatchEntryTerm(studentEntryTerm, offering.entryTerm)) return true;
  }
  if (offering.sharedWithTargets && offering.sharedWithTargets.length > 0) {
    return offering.sharedWithTargets.some((t) => {
      const targetMajorOk = doesStudentMatchMajor(
        studentFieldOfStudy,
        t.majorName,
        t.majorCode
      );
      if (!targetMajorOk) return false;
      if (scope === 'own_major') return true;
      return doesStudentMatchEntryTerm(studentEntryTerm, t.entryTerm);
    });
  }
  return false;
}

export interface ScheduleLockCheckResult {
  locked: boolean;
  reason?: string;
}

export function checkScheduleViewLock(
  rules: SchedRulesSettings,
  userRole: SchedWorkspaceRole,
  actorId: string
): ScheduleLockCheckResult {
  // مدیر سامانه دسترسی کامل دارد و هرگز مشمول مسدودسازی نمی‌شود
  if (userRole === 'admin') return { locked: false };
  const locks = rules.programLocks;
  if (!locks) return { locked: false };
  const fallbackMsg = locks.lockMessage?.trim();

  if (actorId && locks.blockedViewUserIds?.includes(actorId)) {
    return {
      locked: true,
      reason:
        fallbackMsg ||
        'دسترسی مشاهده برنامه درسی برای حساب کاربری شما توسط مدیر کل سامانه مسدود شده است.',
    };
  }
  return { locked: false };
}

export function checkScheduleEditLock(
  rules: SchedRulesSettings,
  userRole: SchedWorkspaceRole,
  actorId: string,
  target?: {
    majorCode?: string;
    dayOfWeek?: SchedDayKey;
    slotIds?: string[];
  }
): ScheduleLockCheckResult {
  // مدیر سامانه دسترسی کامل دارد و هرگز مشمول مسدودسازی نمی‌شود
  if (userRole === 'admin') return { locked: false };
  const locks = rules.programLocks;
  if (!locks) return { locked: false };

  const fallbackMsg = locks.lockMessage?.trim();

  if (actorId && locks.blockedViewUserIds?.includes(actorId)) {
    return {
      locked: true,
      reason:
        fallbackMsg ||
        'دسترسی مشاهده و ویرایش برنامه درسی برای حساب کاربری شما توسط مدیر سامانه مسدود شده است.',
    };
  }
  if (locks.lockAllChanges) {
    return {
      locked: true,
      reason:
        fallbackMsg ||
        'امکان ایجاد تغییر در برنامه درسی برای کاربران توسط مدیر سامانه مسدود شده است.',
    };
  }
  if (
    actorId &&
    (locks.lockedDeptHeadIds?.includes(actorId) ||
      locks.lockedAcademicDeputyIds?.includes(actorId) ||
      locks.lockedExpertIds?.includes(actorId))
  ) {
    return {
      locked: true,
      reason:
        fallbackMsg ||
        'دسترسی ویرایش برنامه برای حساب کاربری شما توسط مدیر سامانه مسدود شده است.',
    };
  }
  if (target?.majorCode && locks.lockedMajorCodes?.includes(target.majorCode)) {
    return {
      locked: true,
      reason:
        fallbackMsg ||
        'تغییرات برنامه برای این رشته توسط مدیر سامانه بسته و مسدود شده است.',
    };
  }
  if (target?.dayOfWeek && locks.lockedDays?.includes(target.dayOfWeek)) {
    return {
      locked: true,
      reason:
        fallbackMsg ||
        `تغییرات برنامه در روز «${SCHED_DAY_LABELS[target.dayOfWeek]}» توسط مدیر سامانه مسدود شده است.`,
    };
  }
  if (target?.slotIds && target.slotIds.length > 0 && locks.lockedSlotIds?.length) {
    const hit = target.slotIds.find((sid) => locks.lockedSlotIds!.includes(sid));
    if (hit) {
      return {
        locked: true,
        reason:
          fallbackMsg ||
          'تغییرات برنامه در این سانس زمانی توسط مدیر سامانه مسدود شده است.',
      };
    }
  }
  return { locked: false };
}

// =============================================================
// مدیریت بازه امتحانی، سانس‌های امتحان، واجدشرایط بودن دروس نظری و اخطار تداخل
// =============================================================

export function buildDefaultExamSlots(): SchedExamSlot[] {
  return [
    { id: 'exam_slot_1', label: 'سانس اول امتحان', startTime: '08:30', endTime: '10:30', order: 1 },
    { id: 'exam_slot_2', label: 'سانس دوم امتحان', startTime: '11:00', endTime: '13:00', order: 2 },
    { id: 'exam_slot_3', label: 'سانس سوم امتحان', startTime: '14:00', endTime: '16:00', order: 3 },
  ];
}

export function buildExamDaysSequence(params: {
  startDate: string;
  startDayOfWeek?: SchedDayKey;
  daysCount: number;
  skipFridays: boolean;
  existingDays?: SchedExamDay[];
}): SchedExamDay[] {
  const count = Math.max(1, Math.min(30, Math.floor(params.daysCount || 12)));
  const cleanDate = toEnglishDigits(params.startDate || '').trim();
  const parsed = parseJalaliDate(cleanDate);
  const startDay: SchedDayKey = parsed
    ? getJalaliDayOfWeekKey(parsed.jy, parsed.jm, parsed.jd)
    : params.startDayOfWeek || 'saturday';
  const startDayOrderIdx = Math.max(0, SCHED_DAYS_ORDER.indexOf(startDay));

  const result: SchedExamDay[] = [];
  let offset = 0;
  let guard = 0;
  while (result.length < count && guard < 90) {
    guard++;
    const dayKey = SCHED_DAYS_ORDER[(startDayOrderIdx + offset) % 7];
    const isoDate = parsed ? addDaysToJalaliDate(cleanDate, offset, 'en') : '';
    const weekdayLabel = parsed
      ? getJalaliWeekdayLabelFromDate(isoDate) || SCHED_DAY_LABELS[dayKey]
      : SCHED_DAY_LABELS[dayKey];
    offset++;
    if (params.skipFridays && dayKey === 'friday') {
      continue;
    }
    const dayNumber = result.length + 1;
    const prev = params.existingDays?.[dayNumber - 1];
    result.push({
      id: prev?.id || `exam_day_${dayNumber}`,
      dayNumber,
      label: `روز ${dayNumber.toLocaleString('fa-IR')}`,
      date: isoDate || prev?.date || '',
      weekdayLabel,
      isActive: prev ? prev.isActive : true,
    });
  }
  return result;
}

export function buildDefaultExamSettings(termKey?: string): SchedExamSettings {
  const defaultStart =
    termKey && termKey.endsWith('2') ? '1405/03/23' : '1404/10/20';
  return {
    startDate: defaultStart,
    startDayOfWeek: 'saturday',
    daysCount: 12,
    skipFridays: true,
    examDays: buildExamDaysSequence({
      startDate: defaultStart,
      startDayOfWeek: 'saturday',
      daysCount: 12,
      skipFridays: true,
    }),
    examSlots: buildDefaultExamSlots(),
  };
}

export function getExamSettingsForTerm(
  rules: SchedRulesSettings,
  termKey?: string
): SchedExamSettings {
  const effectiveTerm = termKey || rules.activeTerm;
  const termCfg = effectiveTerm ? rules.examSettingsByTerm?.[effectiveTerm] : undefined;
  const raw = termCfg || rules.examSettings;
  if (!raw) return buildDefaultExamSettings(effectiveTerm);
  const examDays =
    Array.isArray(raw.examDays) && raw.examDays.length > 0
      ? raw.examDays
      : buildExamDaysSequence({
          startDate: raw.startDate || '1404/10/20',
          startDayOfWeek: raw.startDayOfWeek || 'saturday',
          daysCount: raw.daysCount || 12,
          skipFridays: raw.skipFridays !== false,
        });
  const examSlots =
    Array.isArray(raw.examSlots) && raw.examSlots.length > 0
      ? [...raw.examSlots].sort((a, b) => a.order - b.order)
      : buildDefaultExamSlots();
  return {
    startDate: raw.startDate || '1404/10/20',
    startDayOfWeek: raw.startDayOfWeek || 'saturday',
    daysCount: raw.daysCount || examDays.length || 12,
    skipFridays: raw.skipFridays !== false,
    examDays,
    examSlots,
  };
}

/**
 * صرفاً دروس نظری دارای امتحان پایان ترم هستند؛ دروس عملی و نظری-عملی فاقد امتحان متمرکزند.
 */
export function isCourseEligibleForExam(item: {
  courseType: SchedCourseType;
  theoreticalUnits?: number;
  practicalUnits?: number;
}): boolean {
  return item.courseType === 'theoretical';
}

export function formatExamAssignmentShort(
  offering: Pick<SchedCourseOffering, 'examDayId' | 'examSlotId'>,
  examSettings: SchedExamSettings
): string {
  if (!offering.examDayId || !offering.examSlotId) return '';
  const day = examSettings.examDays.find((d) => d.id === offering.examDayId);
  const slot = examSettings.examSlots.find((s) => s.id === offering.examSlotId);
  const dayPart = day
    ? `${day.label}${day.date ? ` (${day.weekdayLabel} ${day.date})` : ` (${day.weekdayLabel})`}`
    : offering.examDayId;
  const slotPart = slot ? `${slot.label} (${slot.startTime}-${slot.endTime})` : offering.examSlotId;
  return `${dayPart} · ${slotPart}`;
}

export function detectOfferingExamConflicts(
  candidate: SchedCourseOffering,
  allOfferings: SchedCourseOffering[],
  rules?: SchedRulesSettings
): string[] {
  if (!isCourseEligibleForExam(candidate) || !candidate.examDayId || !candidate.examSlotId) {
    return [];
  }
  const examSettings = rules ? getExamSettingsForTerm(rules, candidate.termKey) : undefined;
  const examSummary = examSettings
    ? formatExamAssignmentShort(candidate, examSettings)
    : '';
  const warnings: string[] = [];

  for (const other of allOfferings) {
    if (other.id === candidate.id) continue;
    if (other.termKey !== candidate.termKey) continue;
    if (!isCourseEligibleForExam(other)) continue;
    if (other.examDayId !== candidate.examDayId || other.examSlotId !== candidate.examSlotId) {
      continue;
    }
    const overlap = doTargetsOverlap(candidate, other);
    if (overlap) {
      warnings.push(
        `هشدار تداخل امتحان (${overlap}): درس «${other.courseTitle}» نیز در همین زمان (${examSummary || 'روز و سانس امتحانی یکسان'}) تنظیم شده است.`
      );
    }
  }
  return warnings;
}

export function buildTermExamConflictMap(
  termOfferings: SchedCourseOffering[],
  rules?: SchedRulesSettings
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const o of termOfferings) {
    if (!isCourseEligibleForExam(o) || !o.examDayId || !o.examSlotId) continue;
    const warns = detectOfferingExamConflicts(o, termOfferings, rules);
    if (warns.length > 0) {
      map.set(o.id, warns);
    }
  }
  return map;
}

// =============================================================
// موتور Undo / Redo اختصاصی هر کاربر با اعتبارسنجی تداخل و قفل
// =============================================================

export function computeOfferingDeltas(
  prevOfferings: SchedCourseOffering[],
  nextOfferings: SchedCourseOffering[]
): SchedOfferingHistoryDelta[] {
  const prevMap = new Map(prevOfferings.map((o) => [o.id, o]));
  const nextMap = new Map(nextOfferings.map((o) => [o.id, o]));
  const deltas: SchedOfferingHistoryDelta[] = [];

  for (const prev of prevOfferings) {
    const next = nextMap.get(prev.id);
    if (!next) {
      deltas.push({ offeringId: prev.id, before: prev, after: undefined });
    } else if (JSON.stringify(prev) !== JSON.stringify(next)) {
      deltas.push({ offeringId: prev.id, before: prev, after: next });
    }
  }
  for (const next of nextOfferings) {
    if (!prevMap.has(next.id)) {
      deltas.push({ offeringId: next.id, before: undefined, after: next });
    }
  }
  return deltas;
}

export interface HistoryApplyResult {
  ok: boolean;
  nextOfferings?: SchedCourseOffering[];
  error?: string;
}

export function applyOfferingHistoryStep(params: {
  direction: 'undo' | 'redo';
  entry: SchedOfferingHistoryEntry;
  latestOfferings: SchedCourseOffering[];
  rules: SchedRulesSettings;
  userRole: SchedWorkspaceRole;
  actor: { id: string; name: string };
  classrooms: SchedClassroom[];
  professors: SchedProfessor[];
}): HistoryApplyResult {
  const { direction, entry, latestOfferings, rules, userRole, actor, classrooms, professors } =
    params;

  if (entry.actorId !== actor.id) {
    return {
      ok: false,
      error: 'امکان بازگشت تغییرات متعلق به سایر کاربران وجود ندارد.',
    };
  }

  const globalLock = checkScheduleEditLock(rules, userRole, actor.id);
  if (globalLock.locked) {
    return {
      ok: false,
      error: `امکان ${direction === 'undo' ? 'بازگشت' : 'انجام مجدد'} وجود ندارد: ${globalLock.reason}`,
    };
  }

  const working = [...latestOfferings];
  const restoredIds: string[] = [];

  for (const delta of entry.deltas) {
    const expectedNow = direction === 'undo' ? delta.after : delta.before;
    const targetState = direction === 'undo' ? delta.before : delta.after;

    const curIdx = working.findIndex((o) => o.id === delta.offeringId);
    const cur = curIdx >= 0 ? working[curIdx] : undefined;

    // بررسی اینکه آیا کاربر دیگری بعد از تغییر ما روی همین درس تغییر داده یا آن را حذف کرده است
    if (expectedNow && !cur) {
      return {
        ok: false,
        error: `بازگشت ممکن نیست: درس «${expectedNow.courseTitle}» پس از اقدام شما توسط کاربر دیگری از جدول حذف شده است.`,
      };
    }
    if (expectedNow && cur) {
      const modifiedByOther =
        cur.updatedAt !== expectedNow.updatedAt &&
        cur.updatedById &&
        cur.updatedById !== actor.id;
      if (modifiedByOther) {
        return {
          ok: false,
          error: `بازگشت ممکن نیست: درس «${cur.courseTitle}» پس از تغییر شما توسط «${cur.updatedByName || 'کاربر دیگری'}» ویرایش شده است.`,
        };
      }
    }

    // بررسی قفل رشته/روز/سانس برای وضعیت فعلی و وضعیت مقصد
    if (expectedNow) {
      const lockCur = checkScheduleEditLock(rules, userRole, actor.id, {
        majorCode: expectedNow.ownerMajorCode,
        dayOfWeek: expectedNow.dayOfWeek,
        slotIds: expectedNow.slotIds,
      });
      if (lockCur.locked) {
        return {
          ok: false,
          error: `بازگشت ممکن نیست: ${lockCur.reason}`,
        };
      }
    }
    if (targetState) {
      const lockTarget = checkScheduleEditLock(rules, userRole, actor.id, {
        majorCode: targetState.ownerMajorCode,
        dayOfWeek: targetState.dayOfWeek,
        slotIds: targetState.slotIds,
      });
      if (lockTarget.locked) {
        return {
          ok: false,
          error: `بازگشت به وضعیت قبلی ممکن نیست: ${lockTarget.reason}`,
        };
      }
    }

    // اعمال تغییر در آرایه موقت
    if (!targetState) {
      if (curIdx >= 0) working.splice(curIdx, 1);
    } else {
      const stamped: SchedCourseOffering = {
        ...targetState,
        updatedById: actor.id,
        updatedByName: actor.name,
        updatedAt: new Date().toISOString(),
      };
      if (curIdx >= 0) {
        working[curIdx] = stamped;
      } else {
        working.push(stamped);
      }
      restoredIds.push(stamped.id);
    }
  }

  // بررسی تداخل زمانی، استاد، کلاس و دانشجویان در کل ترم پس از بازگشت
  for (const rid of restoredIds) {
    const restored = working.find((o) => o.id === rid);
    if (!restored) continue;
    const termSlice = working.filter((o) => o.termKey === restored.termKey);
    const conflict = detectOfferingConflicts(restored, termSlice, classrooms, professors, rules);
    if (conflict.hasHardConflict) {
      return {
        ok: false,
        error: `${direction === 'undo' ? 'بازگشت (Undo)' : 'انجام مجدد (Redo)'} به دلیل تداخل با تغییرات جدید جدول ممکن نیست — ${conflict.errors[0]}`,
      };
    }
  }

  return { ok: true, nextOfferings: working };
}



