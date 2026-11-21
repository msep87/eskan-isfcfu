import {
  AssociationMembership,
  Bed,
  CulturalAssociation,
  DisciplinaryReferral,
  Dormitory,
  GuildElection,
  GuildElectionVote,
  LibraryBookRequest,
  PeriodicSurvey,
  Room,
  RoomWarning,
  SportsProgram,
  SportsRegistration,
  Student,
  StudentEvaluation,
  SurveyResponse,
} from '../types';
import { Storage } from './storage';
import { getStudentResidenceType } from './financeUtils';
import { escapeHtml } from './sanitizeHtml';
import {
  formatCommuterReasons,
  joinSkillList,
} from './studentProfileOptions';

export interface TranscriptCategoryBreakdown {
  id:
    | 'cultural'
    | 'sports'
    | 'surveys'
    | 'elections'
    | 'academic_library'
    | 'dormitory_discipline';
  title: string;
  subtitle: string;
  score: number;
  maxScore: number;
  percent: number;
  colorClass: string;
  barHex: string;
  highlights: string[];
}

export interface TranscriptActivityRecord {
  id: string;
  category: TranscriptCategoryBreakdown['id'];
  categoryLabel: string;
  title: string;
  detail: string;
  date: string;
  pointsDelta: number;
  statusLabel: string;
  tone: 'positive' | 'neutral' | 'negative';
}

export interface DormitoryTranscriptDetails {
  dormName: string;
  roomNumber: string;
  bedLabel: string;
  isRoomRepresentative: boolean;
  individualScore100: number;
  disciplineScore100: number;
  cleanlinessScore100: number;
  rawDormPoints: number;
  penaltyPoints: number;
  netDormPoints: number;
  maxDormPoints: number;
  warningsCount: number;
  disciplinaryReferralsCount: number;
}

export interface StudentActivityTranscript {
  student: Student;
  residenceType: 'dormitory' | 'commuter';
  dormName: string;
  roomNumber: string;
  bedLabel: string;
  totalScore: number;
  maxPossibleScore: number;
  normalizedScore100: number;
  gradeLabel: string;
  gradeLevel: 'A' | 'B' | 'C' | 'D' | 'E';
  gradeColorHex: string;
  categories: TranscriptCategoryBreakdown[];
  activities: TranscriptActivityRecord[];
  dormitoryDetails: DormitoryTranscriptDetails | null;
  generatedAtFa: string;
  summaryCounts: {
    associations: number;
    sportsEvents: number;
    surveys: number;
    elections: number;
    libraryRequests: number;
    skillsTotal: number;
    disciplinaryPenalties: number;
  };
}

export interface TranscriptDataContext {
  dorms?: Dormitory[];
  rooms?: Room[];
  beds?: Bed[];
  associations?: CulturalAssociation[];
  memberships?: AssociationMembership[];
  sportsPrograms?: SportsProgram[];
  sportsRegistrations?: SportsRegistration[];
  surveys?: PeriodicSurvey[];
  surveyResponses?: SurveyResponse[];
  guildElections?: GuildElection[];
  guildElectionVotes?: GuildElectionVote[];
  libraryRequests?: LibraryBookRequest[];
  evaluations?: StudentEvaluation[];
  disciplinaryReferrals?: DisciplinaryReferral[];
  roomWarnings?: RoomWarning[];
}

export function loadTranscriptDataContext(): Required<TranscriptDataContext> {
  return {
    dorms: Storage.getDormitories(),
    rooms: Storage.getRooms(),
    beds: Storage.getBeds(),
    associations: Storage.getCulturalAssociations(),
    memberships: Storage.getAssociationMemberships(),
    sportsPrograms: Storage.getSportsPrograms(),
    sportsRegistrations: Storage.getSportsRegistrations(),
    surveys: Storage.getSurveys(),
    surveyResponses: Storage.getSurveyResponses(),
    guildElections: Storage.getGuildElections(),
    guildElectionVotes: Storage.getGuildElectionVotes(),
    libraryRequests: Storage.getLibraryBookRequests(),
    evaluations: Storage.getStudentEvaluations(),
    disciplinaryReferrals: Storage.getDisciplinaryReferrals(),
    roomWarnings: Storage.getWarnings(),
  };
}

const ASSOCIATION_ROLE_LABELS: Record<string, string> = {
  member: 'عضو فعال',
  secretary_candidate: 'داوطلب دبیری',
  council_member: 'عضو شورای مرکزی',
};

const MEMBERSHIP_STATUS_LABELS: Record<string, string> = {
  approved: 'تأییدشده',
  pending: 'در انتظار بررسی',
  rejected: 'رد شده',
};

const SPORTS_REG_STATUS_LABELS: Record<string, string> = {
  attended: 'حضور تأییدشده',
  registered: 'ثبت‌نام فعال',
  absent: 'غیبت ثبت‌شده',
  cancelled: 'انصراف',
};

const LIBRARY_STATUS_LABELS: Record<string, string> = {
  returned: 'امانت و بازگشت موفق',
  delivered: 'در حال مطالعه (تحویل‌شده)',
  approved: 'تأییدشده برای تحویل',
  pending: 'درخواست ثبت‌شده',
  rejected: 'رد شده',
  cancelled: 'لغو شده',
};

export function computeStudentActivityTranscript(
  student: Student,
  providedContext?: TranscriptDataContext
): StudentActivityTranscript {
  const ctx: Required<TranscriptDataContext> = {
    dorms: providedContext?.dorms ?? Storage.getDormitories(),
    rooms: providedContext?.rooms ?? Storage.getRooms(),
    beds: providedContext?.beds ?? Storage.getBeds(),
    associations: providedContext?.associations ?? Storage.getCulturalAssociations(),
    memberships: providedContext?.memberships ?? Storage.getAssociationMemberships(),
    sportsPrograms: providedContext?.sportsPrograms ?? Storage.getSportsPrograms(),
    sportsRegistrations: providedContext?.sportsRegistrations ?? Storage.getSportsRegistrations(),
    surveys: providedContext?.surveys ?? Storage.getSurveys(),
    surveyResponses: providedContext?.surveyResponses ?? Storage.getSurveyResponses(),
    guildElections: providedContext?.guildElections ?? Storage.getGuildElections(),
    guildElectionVotes: providedContext?.guildElectionVotes ?? Storage.getGuildElectionVotes(),
    libraryRequests: providedContext?.libraryRequests ?? Storage.getLibraryBookRequests(),
    evaluations: providedContext?.evaluations ?? Storage.getStudentEvaluations(),
    disciplinaryReferrals: providedContext?.disciplinaryReferrals ?? Storage.getDisciplinaryReferrals(),
    roomWarnings: providedContext?.roomWarnings ?? Storage.getWarnings(),
  };

  const residenceType = getStudentResidenceType(student);
  const dorm = student.assignedDormId
    ? ctx.dorms.find((d) => d.id === student.assignedDormId)
    : undefined;
  const room = student.assignedRoomId
    ? ctx.rooms.find((r) => r.id === student.assignedRoomId)
    : undefined;
  const bed = student.assignedBedId
    ? ctx.beds.find((b) => b.id === student.assignedBedId)
    : undefined;

  const dormName = dorm?.name || student.assignedDormName || (residenceType === 'commuter' ? 'دانشجوی ترددی' : 'تخصیص نیافته');
  const roomNumber = room?.roomNumber || student.assignedRoomNumber || '-';
  const bedLabel = bed?.label || '-';

  const activities: TranscriptActivityRecord[] = [];
  const categories: TranscriptCategoryBreakdown[] = [];

  // =========================================================================
  // ۱. فعالیت‌های فرهنگی، هنری و عضویت در تشکل‌ها و کانون‌ها (سقف ۲۰ امتیاز)
  // =========================================================================
  const myMemberships = ctx.memberships.filter((m) => m.studentId === student.studentId);
  const assocMap = new Map(ctx.associations.map((a) => [a.id, a]));
  let culturalRaw = 0;
  const culturalHighlights: string[] = [];

  myMemberships.forEach((m) => {
    const assoc = assocMap.get(m.associationId);
    const title = assoc?.name || m.associationName || 'تشکل / کانون دانشجویی';
    if (m.status === 'approved') {
      const pts = 8;
      culturalRaw += pts;
      culturalHighlights.push(`عضویت تأییدشده در ${title}`);
      activities.push({
        id: `assoc-${m.id}`,
        category: 'cultural',
        categoryLabel: 'فرهنگی و تشکل‌ها',
        title: `عضویت در ${title}`,
        detail: m.requestNote ? `یادداشت عضویت: ${m.requestNote}` : 'عضو فعال تشکل/کانون دانشجویی',
        date: m.reviewedAt || m.requestedAt || '-',
        pointsDelta: pts,
        statusLabel: MEMBERSHIP_STATUS_LABELS[m.status] || 'تأییدشده',
        tone: 'positive',
      });
    } else if (m.status === 'pending') {
      culturalRaw += 3;
      culturalHighlights.push(`درخواست عضویت در ${title}`);
      activities.push({
        id: `assoc-${m.id}`,
        category: 'cultural',
        categoryLabel: 'فرهنگی و تشکل‌ها',
        title: `درخواست عضویت در ${title}`,
        detail: m.requestNote || 'درخواست عضویت در انتظار تأیید امور فرهنگی',
        date: m.requestedAt || '-',
        pointsDelta: 3,
        statusLabel: MEMBERSHIP_STATUS_LABELS[m.status] || 'در انتظار بررسی',
        tone: 'neutral',
      });
    }
  });

  const culturalSkillsCount =
    (student.culturalActivities?.length || 0) +
    (student.culturalOther?.trim() ? 1 : 0) +
    (student.artisticSkills?.length || 0) +
    (student.artisticOther?.trim() ? 1 : 0);

  if (culturalSkillsCount > 0) {
    const skillPts = Math.min(6, Math.round(culturalSkillsCount * 1.5));
    culturalRaw += skillPts;
    const artisticStr = joinSkillList(student.artisticSkills, student.artisticOther);
    const culturalStr = joinSkillList(student.culturalActivities, student.culturalOther);
    culturalHighlights.push(`${culturalSkillsCount} توانمندی فرهنگی/هنری ثبت‌شده در پرونده`);
    activities.push({
      id: `skills-cultural-${student.studentId}`,
      category: 'cultural',
      categoryLabel: 'فرهنگی و تشکل‌ها',
      title: 'توانمندی‌ها و علایق فرهنگی و هنری پرونده',
      detail: [culturalStr && `فرهنگی: ${culturalStr}`, artisticStr && `هنری: ${artisticStr}`]
        .filter(Boolean)
        .join(' | '),
      date: 'پرونده فعال',
      pointsDelta: skillPts,
      statusLabel: 'ثبت‌شده',
      tone: 'positive',
    });
  }

  const culturalMax = 20;
  const culturalScore = Math.min(culturalMax, Math.round(culturalRaw));
  categories.push({
    id: 'cultural',
    title: 'فعالیت‌های فرهنگی، هنری و تشکل‌ها',
    subtitle: 'عضویت در کانون‌ها و تشکل‌های دانشجویی + توانمندی‌های فرهنگی و هنری',
    score: culturalScore,
    maxScore: culturalMax,
    percent: Math.round((culturalScore / culturalMax) * 100),
    colorClass: 'from-fuchsia-600 to-purple-600',
    barHex: '#9333ea',
    highlights:
      culturalHighlights.length > 0
        ? culturalHighlights.slice(0, 3)
        : ['هنوز فعالیت فرهنگی یا عضویت تشکلی ثبت نشده است'],
  });

  // =========================================================================
  // ۲. فعالیت‌های ورزشی و تربیت بدنی (سقف ۲۰ امتیاز)
  // =========================================================================
  const mySportsRegs = ctx.sportsRegistrations.filter((r) => r.studentId === student.studentId);
  const sportsProgMap = new Map(ctx.sportsPrograms.map((p) => [p.id, p]));
  let sportsRaw = 0;
  const sportsHighlights: string[] = [];

  mySportsRegs.forEach((reg) => {
    const prog = sportsProgMap.get(reg.programId);
    const title = prog?.title || reg.programTitle || 'برنامه ورزشی';
    if (reg.status === 'attended') {
      sportsRaw += 8;
      sportsHighlights.push(`حضور تأییدشده در ${title}`);
      activities.push({
        id: `sport-${reg.id}`,
        category: 'sports',
        categoryLabel: 'ورزشی و تربیت بدنی',
        title,
        detail: prog ? `${prog.venue} • مربی: ${prog.coachName || 'تعیین‌شده'}` : 'حضور ثبت‌شده در دوره/مسابقه ورزشی',
        date: reg.updatedAt || reg.registeredAt || '-',
        pointsDelta: 8,
        statusLabel: SPORTS_REG_STATUS_LABELS[reg.status] || 'حضور تأییدشده',
        tone: 'positive',
      });
    } else if (reg.status === 'registered') {
      sportsRaw += 4;
      sportsHighlights.push(`ثبت‌نام در ${title}`);
      activities.push({
        id: `sport-${reg.id}`,
        category: 'sports',
        categoryLabel: 'ورزشی و تربیت بدنی',
        title,
        detail: prog ? `${prog.venue} • ساعت ${prog.startTime}` : 'ثبت‌نام فعال در برنامه ورزشی',
        date: reg.registeredAt || '-',
        pointsDelta: 4,
        statusLabel: SPORTS_REG_STATUS_LABELS[reg.status] || 'ثبت‌نام فعال',
        tone: 'positive',
      });
    }
  });

  const sportsSkillsCount =
    (student.sportsActivities?.length || 0) + (student.sportsOther?.trim() ? 1 : 0);
  if (sportsSkillsCount > 0) {
    const skillPts = Math.min(5, Math.round(sportsSkillsCount * 1.5));
    sportsRaw += skillPts;
    const sportStr = joinSkillList(student.sportsActivities, student.sportsOther);
    sportsHighlights.push(`${sportsSkillsCount} رشته ورزشی فعال در پرونده`);
    activities.push({
      id: `skills-sports-${student.studentId}`,
      category: 'sports',
      categoryLabel: 'ورزشی و تربیت بدنی',
      title: 'رشته‌های ورزشی ثبت‌شده در پرونده دانشجو',
      detail: sportStr,
      date: 'پرونده فعال',
      pointsDelta: skillPts,
      statusLabel: 'ثبت‌شده',
      tone: 'positive',
    });
  }

  const sportsMax = 20;
  const sportsScore = Math.min(sportsMax, Math.round(sportsRaw));
  categories.push({
    id: 'sports',
    title: 'فعالیت‌های ورزشی و تربیت بدنی',
    subtitle: 'حضور در دوره‌ها، مسابقات و برنامه‌های تربیت بدنی + رشته‌های ورزشی',
    score: sportsScore,
    maxScore: sportsMax,
    percent: Math.round((sportsScore / sportsMax) * 100),
    colorClass: 'from-emerald-600 to-teal-600',
    barHex: '#059669',
    highlights:
      sportsHighlights.length > 0
        ? sportsHighlights.slice(0, 3)
        : ['هنوز حضور یا ثبت‌نام ورزشی ثبت نشده است'],
  });

  // =========================================================================
  // ۳. مشارکت در نظرسنجی‌های دوره‌ای (سقف ۱۵ امتیاز)
  // =========================================================================
  const mySurveyResponses = ctx.surveyResponses.filter((r) => r.studentId === student.studentId);
  const surveyMap = new Map(ctx.surveys.map((sv) => [sv.id, sv]));
  let surveyRaw = 0;
  const surveyHighlights: string[] = [];

  mySurveyResponses.forEach((resp) => {
    const sv = surveyMap.get(resp.surveyId);
    const title = sv?.title || 'نظرسنجی دوره‌ای دانشگاه';
    surveyRaw += 5;
    surveyHighlights.push(`شرکت در ${title}`);
    activities.push({
      id: `survey-${resp.id}`,
      category: 'surveys',
      categoryLabel: 'نظرسنجی‌ها',
      title: `مشارکت در نظرسنجی: ${title}`,
      detail: `${resp.answers?.length || 0} پرسش پاسخ‌داده‌شده`,
      date: resp.submittedAt || '-',
      pointsDelta: 5,
      statusLabel: 'تکمیل‌شده',
      tone: 'positive',
    });
  });

  const surveyMax = 15;
  const surveyScore = Math.min(surveyMax, Math.round(surveyRaw));
  categories.push({
    id: 'surveys',
    title: 'مشارکت در نظرسنجی‌های دوره‌ای',
    subtitle: 'همکاری در بهبود کیفیت خدمات رفاهی، آموزشی و فرهنگی دانشگاه',
    score: surveyScore,
    maxScore: surveyMax,
    percent: Math.round((surveyScore / surveyMax) * 100),
    colorClass: 'from-violet-600 to-indigo-600',
    barHex: '#7c3aed',
    highlights:
      surveyHighlights.length > 0
        ? surveyHighlights.slice(0, 3)
        : ['هنوز در نظرسنجی دوره‌ای شرکت نکرده است'],
  });

  // =========================================================================
  // ۴. انتخابات شورای صنفی و فعالیت‌های صنفی / نمایندگی (سقف ۱۵ امتیاز)
  // =========================================================================
  const myVotes = ctx.guildElectionVotes.filter((v) => v.studentId === student.studentId);
  const electionMap = new Map(ctx.guildElections.map((el) => [el.id, el]));
  let electionRaw = 0;
  const electionHighlights: string[] = [];

  myVotes.forEach((v) => {
    const el = electionMap.get(v.electionId);
    const title = el?.title || 'انتخابات شورای صنفی';
    electionRaw += 5;
    electionHighlights.push(`مشارکت در رأی‌گیری ${title}`);
    activities.push({
      id: `vote-${v.id}`,
      category: 'elections',
      categoryLabel: 'انتخابات و صنفی',
      title: `شرکت در انتخابات: ${title}`,
      detail: `تعداد انتخاب‌های ثبت‌شده: ${v.candidateIds?.length || 1} نامزد`,
      date: v.castAt || '-',
      pointsDelta: 5,
      statusLabel: 'رأی ثبت‌شده',
      tone: 'positive',
    });
  });

  ctx.guildElections.forEach((el) => {
    const cand = (el.candidates || []).find((c) => c.studentId === student.studentId);
    if (cand) {
      electionRaw += 8;
      electionHighlights.push(`نامزدی در ${el.title}`);
      activities.push({
        id: `cand-${el.id}-${cand.id}`,
        category: 'elections',
        categoryLabel: 'انتخابات و صنفی',
        title: `کاندیداتوری در ${el.title}`,
        detail: cand.slogan ? `شعار انتخاباتی: ${cand.slogan}` : 'داوطلب عضویت در شورای صنفی دانشجویان',
        date: el.startDate || el.createdAt || '-',
        pointsDelta: 8,
        statusLabel: 'نامزد انتخاباتی',
        tone: 'positive',
      });
    }
  });

  const isRoomRep = Boolean(room && room.representativeStudentId === student.studentId);
  if (isRoomRep) {
    electionRaw += 6;
    electionHighlights.push(`نماینده رسمی اتاق ${room?.roomNumber}`);
    activities.push({
      id: `rep-${room?.id}`,
      category: 'elections',
      categoryLabel: 'انتخابات و صنفی',
      title: `مسئولیت نمایندگی اتاق ${room?.roomNumber}`,
      detail: `${dormName} • هماهنگ‌کننده امور صنفی، نظافت و ارتباط با سرپرستی`,
      date: 'سمت فعال',
      pointsDelta: 6,
      statusLabel: 'نماینده فعال',
      tone: 'positive',
    });
  }

  const electionMax = 15;
  const electionScore = Math.min(electionMax, Math.round(electionRaw));
  categories.push({
    id: 'elections',
    title: 'انتخابات شورای صنفی و مسئولیت‌های صنفی',
    subtitle: 'رأی‌دهی، کاندیداتوری در شورای صنفی و نمایندگی دانشجویی',
    score: electionScore,
    maxScore: electionMax,
    percent: Math.round((electionScore / electionMax) * 100),
    colorClass: 'from-blue-600 to-cyan-600',
    barHex: '#2563eb',
    highlights:
      electionHighlights.length > 0
        ? electionHighlights.slice(0, 3)
        : ['مشارکت انتخاباتی یا صنفی ثبت نشده است'],
  });

  // =========================================================================
  // ۵. فعالیت‌های علمی، مهارتی و کتابخانه و پژوهش (سقف ۱۵ امتیاز)
  // =========================================================================
  const myLibReqs = ctx.libraryRequests.filter((l) => l.studentId === student.studentId);
  let academicRaw = 0;
  const academicHighlights: string[] = [];

  myLibReqs.forEach((req) => {
    if (req.status === 'returned') {
      academicRaw += 5;
      academicHighlights.push(`مطالعه و بازگشت کتاب «${req.bookTitle}»`);
      activities.push({
        id: `lib-${req.id}`,
        category: 'academic_library',
        categoryLabel: 'علمی و کتابخانه',
        title: `مطالعه کتاب: ${req.bookTitle}`,
        detail: `${req.bookAuthor ? `نویسنده: ${req.bookAuthor}` : 'امانت کتابخانه'} • تحویل به موقع`,
        date: req.returnedAt || req.requestedAt || '-',
        pointsDelta: 5,
        statusLabel: LIBRARY_STATUS_LABELS[req.status] || 'بازگشت موفق',
        tone: 'positive',
      });
    } else if (req.status === 'approved') {
      academicRaw += 3;
      academicHighlights.push(`امانت کتاب «${req.bookTitle}»`);
      activities.push({
        id: `lib-${req.id}`,
        category: 'academic_library',
        categoryLabel: 'علمی و کتابخانه',
        title: `امانت کتاب: ${req.bookTitle}`,
        detail: req.bookAuthor ? `نویسنده: ${req.bookAuthor}` : 'امانت فعال از کتابخانه',
        date: req.approvedAt || req.requestedAt || '-',
        pointsDelta: 3,
        statusLabel: LIBRARY_STATUS_LABELS[req.status] || 'فعال',
        tone: 'positive',
      });
    } else if (req.status === 'pending') {
      academicRaw += 1.5;
      activities.push({
        id: `lib-${req.id}`,
        category: 'academic_library',
        categoryLabel: 'علمی و کتابخانه',
        title: `درخواست کتاب: ${req.bookTitle}`,
        detail: 'درخواست رزرو/امانت کتابخانه',
        date: req.requestedAt || '-',
        pointsDelta: 2,
        statusLabel: LIBRARY_STATUS_LABELS[req.status] || 'در انتظار بررسی',
        tone: 'neutral',
      });
    }
  });

  const techSkillsCount =
    (student.technicalSkills?.length || 0) + (student.technicalOther?.trim() ? 1 : 0);
  if (techSkillsCount > 0) {
    const skillPts = Math.min(6, techSkillsCount * 2);
    academicRaw += skillPts;
    const techStr = joinSkillList(student.technicalSkills, student.technicalOther);
    academicHighlights.push(`${techSkillsCount} مهارت علمی و فنی ثبت‌شده`);
    activities.push({
      id: `skills-tech-${student.studentId}`,
      category: 'academic_library',
      categoryLabel: 'علمی و کتابخانه',
      title: 'مهارت‌های علمی، پژوهشی و فنی ثبت‌شده در پرونده',
      detail: techStr,
      date: 'پرونده فعال',
      pointsDelta: skillPts,
      statusLabel: 'ثبت‌شده',
      tone: 'positive',
    });
  }

  const academicMax = 15;
  const academicScore = Math.min(academicMax, Math.round(academicRaw));
  categories.push({
    id: 'academic_library',
    title: 'فعالیت‌های علمی، پژوهشی، مهارتی و کتابخانه',
    subtitle: 'امانت و مطالعه کتاب از کتابخانه + مهارت‌های علمی، فناوری و آموزشی',
    score: academicScore,
    maxScore: academicMax,
    percent: Math.round((academicScore / academicMax) * 100),
    colorClass: 'from-amber-500 to-orange-600',
    barHex: '#d97706',
    highlights:
      academicHighlights.length > 0
        ? academicHighlights.slice(0, 3)
        : ['فعالیت کتابخانه‌ای یا مهارت علمی/فنی ثبت نشده است'],
  });

  // =========================================================================
  // ۶. بخش ویژه دانشجویان خوابگاهی: امتیاز کل، انضباط، نظافت و مقررات (سقف ۴۰ امتیاز)
  // =========================================================================
  let dormitoryDetails: DormitoryTranscriptDetails | null = null;
  let disciplinaryPenaltiesCount = 0;

  if (residenceType === 'dormitory') {
    const myEvaluations = ctx.evaluations.filter(
      (ev) =>
        ev.studentId === student.studentId ||
        (ev.scope === 'room' && room?.id && ev.roomId === room.id)
    );
    const latestEvalRecord = myEvaluations.find(
      (ev) => ev.type === 'evaluation' && typeof ev.score === 'number'
    );
    const individualScore100 = Math.max(
      0,
      Math.min(100, Number(latestEvalRecord?.score ?? student.previousScore ?? 100))
    );
    const disciplineScore100 = Math.max(
      0,
      Math.min(100, Number(room?.disciplineScore ?? 100))
    );
    const cleanlinessScore100 = Math.max(
      0,
      Math.min(100, Number(room?.cleanlinessScore ?? 100))
    );

    // وزن‌ها: ارزیابی فردی ۱۵ امتیاز + انضباط و رعایت مقررات ۱۳ امتیاز + نظافت ۱۲ امتیاز = ۴۰ امتیاز
    const indivPts = (individualScore100 / 100) * 15;
    const discPts = (disciplineScore100 / 100) * 13;
    const cleanPts = (cleanlinessScore100 / 100) * 12;
    const rawDormPoints = Math.round(indivPts + discPts + cleanPts);

    let penaltyPoints = 0;
    const dormHighlights: string[] = [
      `امتیاز ارزیابی فردی: ${individualScore100} از ۱۰۰`,
      `نمره انضباط و رعایت مقررات اتاق: ${disciplineScore100} از ۱۰۰`,
      `نمره رعایت نظافت فردی و اجتماعی اتاق: ${cleanlinessScore100} از ۱۰۰`,
    ];

    myEvaluations.forEach((ev) => {
      if (ev.type === 'warning' || ev.type === 'negative_score' || ev.type === 'summons') {
        penaltyPoints += 4;
        disciplinaryPenaltiesCount += 1;
        activities.push({
          id: `eval-neg-${ev.id}`,
          category: 'dormitory_discipline',
          categoryLabel: 'انضباط و مقررات سرا',
          title: ev.title || 'اخطار / نمره منفی انضباطی',
          detail: ev.description || 'ثبت‌شده توسط واحد سرپرستی/مدیریت',
          date: ev.date || '-',
          pointsDelta: -4,
          statusLabel:
            ev.type === 'summons'
              ? 'فراخوانی'
              : ev.type === 'negative_score'
              ? 'نمره منفی'
              : 'اخطار',
          tone: 'negative',
        });
      } else if (ev.type === 'notice') {
        penaltyPoints += 2;
        disciplinaryPenaltiesCount += 1;
        activities.push({
          id: `eval-not-${ev.id}`,
          category: 'dormitory_discipline',
          categoryLabel: 'انضباط و مقررات سرا',
          title: ev.title || 'تذکر کتبی سرا',
          detail: ev.description || 'تذکر جهت رعایت مقررات سکونت',
          date: ev.date || '-',
          pointsDelta: -2,
          statusLabel: 'تذکر',
          tone: 'negative',
        });
      } else if (ev.type === 'evaluation' && typeof ev.score === 'number') {
        activities.push({
          id: `eval-pos-${ev.id}`,
          category: 'dormitory_discipline',
          categoryLabel: 'انضباط و مقررات سرا',
          title: ev.title || 'ارزیابی عملکرد و انضباط سرا',
          detail: `${ev.description || 'ثبت نمره ارزیابی دوره‌ای'} (نمره: ${ev.score} از ۱۰۰)`,
          date: ev.date || '-',
          pointsDelta: 0,
          statusLabel: `نمره ${ev.score}/۱۰۰`,
          tone: ev.score >= 80 ? 'positive' : 'neutral',
        });
      }
    });

    const myReferrals = ctx.disciplinaryReferrals.filter(
      (r) => r.studentId === student.studentId && r.status !== 'closed'
    );
    myReferrals.forEach((ref) => {
      penaltyPoints += 6;
      disciplinaryPenaltiesCount += 1;
      activities.push({
        id: `disc-${ref.id}`,
        category: 'dormitory_discipline',
        categoryLabel: 'انضباط و مقررات سرا',
        title: `ارجاع انضباطی: ${ref.violationLabel}`,
        detail: ref.referralText || 'پرونده ارجاع‌شده به شورای انضباطی',
        date: ref.referredAt || '-',
        pointsDelta: -6,
        statusLabel: 'ارجاع انضباطی',
        tone: 'negative',
      });
    });

    const activeRoomWarnings = room
      ? ctx.roomWarnings.filter((w) => w.roomId === room.id && !w.resolved)
      : [];
    activeRoomWarnings.forEach((w) => {
      penaltyPoints += 2;
      disciplinaryPenaltiesCount += 1;
      activities.push({
        id: `rw-${w.id}`,
        category: 'dormitory_discipline',
        categoryLabel: 'انضباط و مقررات سرا',
        title: `اخطار فعال اتاق ${room?.roomNumber}: ${w.title}`,
        detail: w.description || 'اخطار ثبت‌شده برای اتاق',
        date: w.date || '-',
        pointsDelta: -2,
        statusLabel: 'اخطار اتاق',
        tone: 'negative',
      });
    });

    const maxDormPoints = 40;
    const netDormPoints = Math.max(0, Math.min(maxDormPoints, rawDormPoints - penaltyPoints));

    dormitoryDetails = {
      dormName,
      roomNumber,
      bedLabel,
      isRoomRepresentative: isRoomRep,
      individualScore100,
      disciplineScore100,
      cleanlinessScore100,
      rawDormPoints,
      penaltyPoints,
      netDormPoints,
      maxDormPoints,
      warningsCount: myEvaluations.filter((e) => e.type !== 'evaluation' && e.type !== 'report').length + activeRoomWarnings.length,
      disciplinaryReferralsCount: myReferrals.length,
    };

    categories.push({
      id: 'dormitory_discipline',
      title: 'امتیازات نظم، انضباط، نظافت و رعایت مقررات سرا',
      subtitle: 'ویژه دانشجویان خوابگاهی — ارزیابی فردی، انضباط اتاق، نظافت و کسورات تذکرات',
      score: netDormPoints,
      maxScore: maxDormPoints,
      percent: Math.round((netDormPoints / maxDormPoints) * 100),
      colorClass: 'from-teal-600 to-cyan-700',
      barHex: '#0f766e',
      highlights: dormHighlights,
    });
  }

  // جمع کل و تراز ۱۰۰
  const totalScore = categories.reduce((sum, c) => sum + c.score, 0);
  const maxPossibleScore = categories.reduce((sum, c) => sum + c.maxScore, 0);
  const normalizedScore100 =
    maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

  let gradeLabel = 'نیازمند مشارکت بیشتر';
  let gradeLevel: StudentActivityTranscript['gradeLevel'] = 'E';
  let gradeColorHex = '#64748b';
  if (normalizedScore100 >= 85) {
    gradeLabel = 'ممتاز (سطح الف)';
    gradeLevel = 'A';
    gradeColorHex = '#059669';
  } else if (normalizedScore100 >= 70) {
    gradeLabel = 'بسیار خوب (سطح ب)';
    gradeLevel = 'B';
    gradeColorHex = '#0d9488';
  } else if (normalizedScore100 >= 55) {
    gradeLabel = 'خوب (سطح ج)';
    gradeLevel = 'C';
    gradeColorHex = '#2563eb';
  } else if (normalizedScore100 >= 40) {
    gradeLabel = 'قابل قبول (سطح د)';
    gradeLevel = 'D';
    gradeColorHex = '#d97706';
  }

  const skillsTotal =
    (student.artisticSkills?.length || 0) +
    (student.culturalActivities?.length || 0) +
    (student.sportsActivities?.length || 0) +
    (student.technicalSkills?.length || 0) +
    (student.artisticOther?.trim() ? 1 : 0) +
    (student.culturalOther?.trim() ? 1 : 0) +
    (student.sportsOther?.trim() ? 1 : 0) +
    (student.technicalOther?.trim() ? 1 : 0);

  return {
    student,
    residenceType,
    dormName,
    roomNumber,
    bedLabel,
    totalScore,
    maxPossibleScore,
    normalizedScore100,
    gradeLabel,
    gradeLevel,
    gradeColorHex,
    categories,
    activities,
    dormitoryDetails,
    generatedAtFa: new Date().toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    summaryCounts: {
      associations: myMemberships.filter((m) => m.status !== 'rejected').length,
      sportsEvents: mySportsRegs.filter((r) => r.status === 'attended' || r.status === 'registered').length,
      surveys: mySurveyResponses.length,
      elections: myVotes.length,
      libraryRequests: myLibReqs.filter((l) => l.status !== 'rejected').length,
      skillsTotal,
      disciplinaryPenalties: disciplinaryPenaltiesCount,
    },
  };
}

export function printHtmlInHiddenIframe(htmlContent: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 800);
  };

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      cleanup();
    }
  }, 350);
}

export function buildTranscriptPrintHtml(
  transcript: StudentActivityTranscript,
  academicYear = '۱۴۰۴-۱۴۰۵'
): string {
  const { student, categories, activities, dormitoryDetails } = transcript;
  const commuterInfo =
    transcript.residenceType === 'commuter'
      ? formatCommuterReasons(student.commuterEligibilityReasons) || 'دانشجوی ترددی (غیرخوابگاهی)'
      : `${transcript.dormName} • اتاق ${transcript.roomNumber}${transcript.bedLabel !== '-' ? ` • ${transcript.bedLabel}` : ''}`;

  const categoryRows = categories
    .map(
      (cat, i) => `
      <tr>
        <td style="text-align:center;font-weight:700;">${i + 1}</td>
        <td>
          <div style="font-weight:800;color:#0f172a;">${escapeHtml(cat.title)}</div>
          <div style="font-size:10px;color:#64748b;margin-top:2px;">${escapeHtml(cat.highlights.join(' • '))}</div>
        </td>
        <td style="text-align:center;font-weight:800;">${cat.score} از ${cat.maxScore}</td>
        <td style="width:140px;">
          <div style="background:#e2e8f0;border-radius:999px;height:8px;overflow:hidden;">
            <div style="background:${cat.barHex};height:100%;width:${cat.percent}%;"></div>
          </div>
          <div style="font-size:10px;text-align:center;color:#334155;margin-top:2px;font-weight:700;">${cat.percent}٪</div>
        </td>
      </tr>`
    )
    .join('');

  const activityRows =
    activities.length > 0
      ? activities
          .map(
            (act, idx) => `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td style="font-weight:700;color:#334155;">${escapeHtml(act.categoryLabel)}</td>
          <td>
            <div style="font-weight:700;color:#0f172a;">${escapeHtml(act.title)}</div>
            <div style="font-size:10px;color:#64748b;">${escapeHtml(act.detail)}</div>
          </td>
          <td style="text-align:center;font-size:11px;">${escapeHtml(act.date)}</td>
          <td style="text-align:center;font-size:11px;font-weight:700;">${escapeHtml(act.statusLabel)}</td>
          <td style="text-align:center;font-weight:800;color:${
            act.pointsDelta > 0 ? '#059669' : act.pointsDelta < 0 ? '#e11d48' : '#475569'
          };" dir="ltr">
            ${act.pointsDelta > 0 ? `+${act.pointsDelta}` : act.pointsDelta}
          </td>
        </tr>`
          )
          .join('')
      : `<tr><td colspan="6" style="text-align:center;padding:16px;color:#64748b;">هنوز فعالیت یا مشارکت ثبت‌شده‌ای در سوابق سامانه درج نشده است.</td></tr>`;

  const dormBox = dormitoryDetails
    ? `
    <div class="section-box" style="background:#f0fdfa;border-color:#99f6e4;">
      <div class="section-title" style="color:#0f766e;">شاخص‌های اختصاصی دانشجوی خوابگاهی (نظم، انضباط و رعایت مقررات سرا)</div>
      <div class="dorm-grid">
        <div class="mini-card"><span>امتیاز ارزیابی فردی</span><strong>${dormitoryDetails.individualScore100} / ۱۰۰</strong></div>
        <div class="mini-card"><span>انضباط و رعایت مقررات اتاق</span><strong>${dormitoryDetails.disciplineScore100} / ۱۰۰</strong></div>
        <div class="mini-card"><span>نظافت فردی و اجتماعی اتاق</span><strong>${dormitoryDetails.cleanlinessScore100} / ۱۰۰</strong></div>
        <div class="mini-card"><span>کسورات اخطار و انضباطی</span><strong style="color:${dormitoryDetails.penaltyPoints > 0 ? '#e11d48' : '#059669'};">${dormitoryDetails.penaltyPoints > 0 ? `-${dormitoryDetails.penaltyPoints} امتیاز` : 'بدون کسر'}</strong></div>
      </div>
    </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>کارنامه جامع فعالیت‌های فرهنگی، اجتماعی و ورزشی - ${escapeHtml(student.fullName)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; font-family: Tahoma, Vazirmatn, 'Segoe UI', sans-serif; }
    body { margin: 0; color: #0f172a; background: #fff; font-size: 11.5px; line-height: 1.6; }
    .header { border: 2px solid #0f766e; border-radius: 14px; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; margin-bottom: 14px; }
    .header h1 { margin: 0; font-size: 15px; color: #0f172a; }
    .header p { margin: 3px 0 0; font-size: 11px; color: #475569; }
    .grade-badge { text-align: center; border: 2px solid ${transcript.gradeColorHex}; border-radius: 12px; padding: 8px 14px; min-width: 150px; background: #fff; }
    .grade-badge .big { font-size: 20px; font-weight: 900; color: ${transcript.gradeColorHex}; }
    .grade-badge .sub { font-size: 11px; font-weight: 800; color: #334155; }
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
    .info-item { border: 1px solid #cbd5e1; border-radius: 10px; padding: 7px 10px; background: #fff; }
    .info-item span { display: block; font-size: 10px; color: #64748b; }
    .info-item strong { font-size: 11.5px; color: #0f172a; }
    .section-box { border: 1px solid #cbd5e1; border-radius: 12px; padding: 10px 12px; margin-bottom: 12px; }
    .section-title { font-weight: 800; font-size: 12.5px; margin-bottom: 8px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .dorm-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .mini-card { background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 8px; text-align: center; }
    .mini-card span { display: block; font-size: 10px; color: #475569; }
    .mini-card strong { font-size: 13px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: middle; }
    th { background: #f1f5f9; font-weight: 800; color: #1e293b; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 22px; page-break-inside: avoid; }
    .sig-box { border: 1px dashed #94a3b8; border-radius: 10px; padding: 10px; text-align: center; min-height: 78px; display: flex; flex-direction: column; justify-content: space-between; }
    .sig-box .title { font-weight: 800; font-size: 11px; color: #1e293b; }
    .sig-box .line { font-size: 10px; color: #64748b; }
    .footer-note { margin-top: 12px; text-align: center; font-size: 10px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>کارنامه جامع فعالیت‌های فرهنگی، اجتماعی، ورزشی و انضباطی دانشجو</h1>
      <p>دانشگاه فرهنگیان استان اصفهان • سامانه جامع خدمات دانشجویی • سال تحصیلی ${escapeHtml(academicYear)}</p>
      <p>تاریخ صدور کارنامه: <strong>${escapeHtml(transcript.generatedAtFa)}</strong></p>
    </div>
    <div class="grade-badge">
      <div class="big">${transcript.normalizedScore100} از ۱۰۰</div>
      <div class="sub">${escapeHtml(transcript.gradeLabel)}</div>
      <div style="font-size:10px;color:#64748b;margin-top:2px;">مجموع امتیاز خام: ${transcript.totalScore} از ${transcript.maxPossibleScore}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-item"><span>نام و نام خانوادگی</span><strong>${escapeHtml(student.fullName)}</strong></div>
    <div class="info-item"><span>شماره دانشجویی</span><strong>${escapeHtml(student.studentId)}</strong></div>
    <div class="info-item"><span>کد ملی / نام پدر</span><strong>${escapeHtml(student.nationalId || '-')} / ${escapeHtml(student.fatherName || '-')}</strong></div>
    <div class="info-item"><span>رشته تحصیلی و ترم ورود</span><strong>${escapeHtml(student.fieldOfStudy || '-')} (${escapeHtml(student.entryTerm || '-')})</strong></div>
    <div class="info-item"><span>نوع سکونت</span><strong>${transcript.residenceType === 'dormitory' ? 'دانشجوی خوابگاهی' : 'دانشجوی ترددی (غیرخوابگاهی)'}</strong></div>
    <div class="info-item"><span>جزئیات اسکان / ترددی</span><strong>${escapeHtml(commuterInfo)}</strong></div>
  </div>

  ${dormBox}

  <div class="section-box">
    <div class="section-title">جدول امتیازات تفکیکی محورهای فعالیت</div>
    <table>
      <thead>
        <tr>
          <th style="width:36px;">ردیف</th>
          <th>محور فعالیت و شاخص‌ها</th>
          <th style="width:95px;">امتیاز کسب‌شده</th>
          <th style="width:140px;">درصد تحقق</th>
        </tr>
      </thead>
      <tbody>
        ${categoryRows}
      </tbody>
    </table>
  </div>

  <div class="section-box">
    <div class="section-title">ریز سوابق و فعالیت‌های مستند ثبت‌شده در سامانه (${activities.length} مورد)</div>
    <table>
      <thead>
        <tr>
          <th style="width:32px;">#</th>
          <th style="width:105px;">حوزه</th>
          <th>شرح فعالیت / مشارکت / ارزیابی</th>
          <th style="width:76px;">تاریخ</th>
          <th style="width:88px;">وضعیت</th>
          <th style="width:52px;">امتیاز</th>
        </tr>
      </thead>
      <tbody>
        ${activityRows}
      </tbody>
    </table>
  </div>

  <div class="signatures">
    <div class="sig-box">
      <div class="title">امور فرهنگی و اجتماعی</div>
      <div class="line">مهر و امضا</div>
    </div>
    <div class="sig-box">
      <div class="title">امور دانشجویی و تربیت بدنی</div>
      <div class="line">مهر و امضا</div>
    </div>
    <div class="sig-box">
      <div class="title">معاونت دانشجویی / مدیریت سامانه</div>
      <div class="line">مهر و امضا</div>
    </div>
  </div>

  <div class="footer-note">
    این کارنامه به‌صورت سیستمی از سامانه جامع خدمات دانشجویی دانشگاه فرهنگیان استان اصفهان استخراج شده است.
  </div>
</body>
</html>`;
}
